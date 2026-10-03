-- RaisingAmsterdam — second round of fixes after the re-review of 3. 10. 2026.
-- Run this in the Supabase SQL Editor. Idempotent (safe to run more than once).

-- 1) Family requests can only be CLOSED, never re-opened — otherwise the
--    "max 3 open requests" limit could be bypassed (close, post, re-open).
DROP POLICY IF EXISTS "Authors update own requests" ON public.family_requests;
CREATE POLICY "Authors update own requests"
  ON public.family_requests FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'closed');

-- 2) SOS: the author keeps seeing her own requests (so she can close and
--    delete them); everyone else only sees open, not-yet-expired ones.
DROP POLICY IF EXISTS "Anyone can read SOS requests" ON public.sos_requests;
CREATE POLICY "Anyone can read SOS requests"
  ON public.sos_requests FOR SELECT
  TO public
  USING (
    (status = 'open' AND expires_at > NOW())
    OR user_id = (SELECT auth.uid())
  );
