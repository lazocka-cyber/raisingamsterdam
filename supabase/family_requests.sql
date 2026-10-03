-- RaisingAmsterdam — "Families looking for help".
-- Run this in the Supabase SQL Editor. Idempotent (safe to run more than once).
--
-- 1. A parent posts a request for FREE (area, days, child ages, a few words).
--    No phone number — the parent always makes the first WhatsApp contact.
-- 2. Sitters / services WITH a listing see the board for free and tap
--    "I can help" → a row in request_offers (linked to their listing).
-- 3. The parent sees who offered help. The WhatsApp button uses the existing
--    get_listing_contact() function, which only answers paying members —
--    so the parent pays once to unlock it. Nothing new to secure there.
-- Requests disappear after 30 days or when the parent closes them.

CREATE TABLE IF NOT EXISTS public.family_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area        TEXT NOT NULL CHECK (char_length(area) BETWEEN 2 AND 80),
  days        TEXT[] NOT NULL DEFAULT '{}',
  age_groups  TEXT[] NOT NULL DEFAULT '{}',
  note        TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS family_requests_open_idx
  ON public.family_requests (status, expires_at DESC);

ALTER TABLE public.family_requests ENABLE ROW LEVEL SECURITY;

-- Everyone can read open requests (that's the point: sitters see families).
-- The author also sees her own closed/expired ones.
DROP POLICY IF EXISTS "Open requests are public" ON public.family_requests;
CREATE POLICY "Open requests are public"
  ON public.family_requests FOR SELECT
  TO public
  USING (
    (status = 'open' AND expires_at > NOW())
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Signed-in users post own requests" ON public.family_requests;
CREATE POLICY "Signed-in users post own requests"
  ON public.family_requests FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authors update own requests" ON public.family_requests;
CREATE POLICY "Authors update own requests"
  ON public.family_requests FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authors delete own requests" ON public.family_requests;
CREATE POLICY "Authors delete own requests"
  ON public.family_requests FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Nobody may stretch their own request past 30 days or re-date it.
REVOKE UPDATE ON public.family_requests FROM anon, authenticated;
GRANT UPDATE (status) ON public.family_requests TO authenticated;

-- "I can help": one offer per listing per request.
CREATE TABLE IF NOT EXISTS public.request_offers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id  UUID NOT NULL REFERENCES public.family_requests(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sitter_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (request_id, listing_id)
);

CREATE INDEX IF NOT EXISTS request_offers_request_idx
  ON public.request_offers (request_id);

ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;

-- Read: the sitter sees her own offers, the parent sees offers on her request.
DROP POLICY IF EXISTS "Sitter and parent see offers" ON public.request_offers;
CREATE POLICY "Sitter and parent see offers"
  ON public.request_offers FOR SELECT
  TO authenticated
  USING (
    sitter_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_requests r
      WHERE r.id = request_id AND r.user_id = (SELECT auth.uid())
    )
  );

-- Offer help: only with your OWN listing, only on an open request that
-- isn't your own.
DROP POLICY IF EXISTS "Sitters offer help with own listing" ON public.request_offers;
CREATE POLICY "Sitters offer help with own listing"
  ON public.request_offers FOR INSERT
  TO authenticated
  WITH CHECK (
    sitter_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.family_requests r
      WHERE r.id = request_id
        AND r.status = 'open'
        AND r.expires_at > NOW()
        AND r.user_id <> (SELECT auth.uid())
    )
  );

-- Withdraw an offer.
DROP POLICY IF EXISTS "Sitters withdraw own offers" ON public.request_offers;
CREATE POLICY "Sitters withdraw own offers"
  ON public.request_offers FOR DELETE
  TO authenticated
  USING (sitter_id = (SELECT auth.uid()));

REVOKE UPDATE ON public.request_offers FROM anon, authenticated;

-- Social proof on the board: how many offers a request has (no names).
CREATE OR REPLACE FUNCTION public.request_offer_counts()
RETURNS TABLE (request_id uuid, offer_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.request_id, count(*)
  FROM public.request_offers o
  JOIN public.family_requests r ON r.id = o.request_id
  WHERE r.status = 'open' AND r.expires_at > NOW()
  GROUP BY o.request_id;
$$;

REVOKE ALL ON FUNCTION public.request_offer_counts() FROM public;
GRANT EXECUTE ON FUNCTION public.request_offer_counts() TO anon, authenticated;
