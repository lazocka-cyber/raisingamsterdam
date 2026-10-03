-- RaisingAmsterdam — references from families outside the app.
-- Run this in the Supabase SQL Editor. Idempotent (safe to run more than once).
--
-- A sitter shares a link (/reference/<listing id>) with families she has
-- worked for. They write a reference WITHOUT an account (first name, stars,
-- a few sentences). It stays hidden until the sitter approves it; approved
-- references show on the listing with a "Reference" badge, next to the
-- "Verified member" reviews from the reviews table.
--
-- No e-mail or other personal data of the family is stored — only the first
-- name they type. Writes go only through the two functions below; the table
-- itself has no INSERT/UPDATE/DELETE rights for anon/authenticated.

CREATE TABLE IF NOT EXISTS public.sitter_references (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 40),
  relation    TEXT CHECK (relation IS NULL OR char_length(relation) <= 80),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL CHECK (char_length(comment) BETWEEN 10 AND 600),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sitter_references_listing_idx
  ON public.sitter_references (listing_id);

ALTER TABLE public.sitter_references ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.sitter_references FROM anon, authenticated;
GRANT SELECT ON public.sitter_references TO anon, authenticated;

-- Read: everyone sees approved references; the listing owner also sees
-- pending/hidden ones (to approve them).
DROP POLICY IF EXISTS "Approved references are public, owner sees all"
  ON public.sitter_references;
CREATE POLICY "Approved references are public, owner sees all"
  ON public.sitter_references FOR SELECT
  TO public
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = (SELECT auth.uid())
    )
  );

-- Write a reference (no account needed).
CREATE OR REPLACE FUNCTION public.submit_reference(
  p_listing_id  uuid,
  p_author_name text,
  p_relation    text,
  p_rating      integer,
  p_comment     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;
  IF auth.uid() IS NOT NULL AND auth.uid() = v_owner THEN
    RAISE EXCEPTION 'OWN_LISTING';
  END IF;
  -- Spam brake: at most 20 references waiting for approval per listing.
  IF (SELECT count(*) FROM public.sitter_references
      WHERE listing_id = p_listing_id AND status = 'pending') >= 20 THEN
    RAISE EXCEPTION 'TOO_MANY_PENDING';
  END IF;
  INSERT INTO public.sitter_references
    (listing_id, author_name, relation, rating, comment)
  VALUES (
    p_listing_id,
    btrim(p_author_name),
    NULLIF(btrim(coalesce(p_relation, '')), ''),
    p_rating,
    btrim(p_comment)
  );
END;
$$;

-- Approve or hide a reference — only the owner of the listing.
CREATE OR REPLACE FUNCTION public.set_reference_status(p_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('approved', 'hidden') THEN
    RAISE EXCEPTION 'BAD_STATUS';
  END IF;
  UPDATE public.sitter_references r
  SET status = p_status
  WHERE r.id = p_id
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = r.listing_id AND l.user_id = auth.uid()
    );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_YOURS';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_reference(uuid, text, text, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_reference(uuid, text, text, integer, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.set_reference_status(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_reference_status(uuid, text) TO authenticated;

-- Star average on listing cards now counts approved references too.
DROP VIEW IF EXISTS public.listing_ratings;
CREATE VIEW public.listing_ratings
WITH (security_invoker = on) AS
SELECT listing_id,
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(*)                       AS review_count
FROM (
  SELECT listing_id, rating FROM public.reviews
  UNION ALL
  SELECT listing_id, rating FROM public.sitter_references WHERE status = 'approved'
) all_ratings
GROUP BY listing_id;

GRANT SELECT ON public.listing_ratings TO anon, authenticated;
