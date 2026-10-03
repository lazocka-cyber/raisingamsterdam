-- RaisingAmsterdam — fixes after the 3. 10. 2026 security + code review.
-- Run this in the Supabase SQL Editor. Idempotent (safe to run more than once).

-- 1) Reviews ("✓ Verified member"): only paying members may write one.
--    Before, the database only checked role = 'parent', which anyone can get
--    for free with the "I'm a parent" button.
DROP POLICY IF EXISTS "Parents can add reviews" ON public.reviews;
CREATE POLICY "Parents can add reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_member = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.user_id = (SELECT auth.uid())
    )
  );

-- 2) Family requests: nobody picks their own expiry or status on insert,
--    sane list sizes, and at most 3 open requests per account.
REVOKE INSERT ON public.family_requests FROM anon, authenticated;
GRANT INSERT (user_id, area, days, age_groups, note) ON public.family_requests TO authenticated;

ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_list_sizes;
ALTER TABLE public.family_requests ADD CONSTRAINT family_requests_list_sizes
  CHECK (cardinality(days) <= 6 AND cardinality(age_groups) <= 5);

DROP POLICY IF EXISTS "Signed-in users post own requests" ON public.family_requests;
CREATE POLICY "Signed-in users post own requests"
  ON public.family_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      SELECT count(*) FROM public.family_requests r
      WHERE r.user_id = (SELECT auth.uid())
        AND r.status = 'open'
        AND r.expires_at > NOW()
    ) < 3
  );

-- 3) Old SOS board: requests (with the parent's WhatsApp number) were readable
--    forever by anyone. Now only open, not-yet-expired ones are visible.
DROP POLICY IF EXISTS "Anyone can read SOS requests" ON public.sos_requests;
CREATE POLICY "Anyone can read SOS requests"
  ON public.sos_requests FOR SELECT
  TO public
  USING (status = 'open' AND expires_at > NOW());
