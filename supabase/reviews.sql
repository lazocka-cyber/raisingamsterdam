-- RaisingAmsterdam — reviews & star ratings for listings (babysitters)
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
-- Idempotent — safe to run more than once.
--
-- Only PARENTS can leave a review (they are the paying members contacting
-- sitters), one review per parent per listing, and never on their own listing.

CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (listing_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Read: anyone can see reviews (public marketplace).
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  TO public USING (true);

-- Insert: only a signed-in PARENT, writing as themselves, and not on a
-- listing they own.
DROP POLICY IF EXISTS "Parents can add reviews" ON public.reviews;
CREATE POLICY "Parents can add reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.role = 'parent'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = (SELECT auth.uid())
    )
  );

-- Update / delete: only the author of the review.
DROP POLICY IF EXISTS "Reviewers can update own review" ON public.reviews;
CREATE POLICY "Reviewers can update own review"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = reviewer_id)
  WITH CHECK ((SELECT auth.uid()) = reviewer_id);

DROP POLICY IF EXISTS "Reviewers can delete own review" ON public.reviews;
CREATE POLICY "Reviewers can delete own review"
  ON public.reviews FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = reviewer_id);

-- Aggregate view: average rating + count per listing, for fast display
-- on listing cards. Readable by anyone. security_invoker = on so the view
-- runs with the querying user's privileges (Supabase advisor best practice).
DROP VIEW IF EXISTS public.listing_ratings;
CREATE VIEW public.listing_ratings
WITH (security_invoker = on) AS
SELECT listing_id,
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(*)                       AS review_count
FROM public.reviews
GROUP BY listing_id;

GRANT SELECT ON public.listing_ratings TO anon, authenticated;
