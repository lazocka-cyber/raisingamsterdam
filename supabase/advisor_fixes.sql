-- RaisingAmsterdam — Supabase Advisor clean-up
-- Run this in the SQL Editor (new tab → paste → Run) AFTER the other three.
-- Idempotent — safe to run more than once.
--
-- Fixes:
--   1. CRITICAL "Security Definer View" on listing_ratings → run as invoker.
--   2. "Auth RLS Initialization Plan" perf hints → wrap auth.uid() in a
--      scalar sub-select so it is evaluated once per query, not per row.

-- 1) Rebuild the ratings view so it runs with the *caller's* privileges.
DROP VIEW IF EXISTS public.listing_ratings;
CREATE VIEW public.listing_ratings
WITH (security_invoker = on) AS
SELECT listing_id,
       ROUND(AVG(rating)::numeric, 1) AS avg_rating,
       COUNT(*)                       AS review_count
FROM public.reviews
GROUP BY listing_id;
GRANT SELECT ON public.listing_ratings TO anon, authenticated;

-- 2a) profiles — optimised policies
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 2b) listings — optimised owner policies
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.listings;
CREATE POLICY "Authenticated users can insert"
  ON public.listings FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 2c) reviews — optimised policies
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
