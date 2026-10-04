-- RaisingAmsterdam — lock the SOS board (security review of 4. 10. 2026).
-- Run this in the Supabase SQL Editor AFTER the new SosBoard.jsx is live
-- (the board must stop reading the phone column first, or it would break).
-- Idempotent (safe to run more than once). The last query only reads and
-- shows the result.

-- 1) The parent's WhatsApp number on an SOS was readable by anyone, even
--    logged-out visitors and search engines. Now the board can read every
--    column EXCEPT phone; the number comes from get_sos_contact(), which
--    returns it only to a signed-in user with a listing (babysitter or
--    service) or to the parent who posted the SOS.
BEGIN;
REVOKE SELECT ON public.sos_requests FROM anon, authenticated;
GRANT SELECT (id, user_id, area, postcode, child_age, needed_date, needed_time,
              note, status, expires_at, created_at)
  ON public.sos_requests TO anon, authenticated;
COMMIT;

CREATE OR REPLACE FUNCTION public.get_sos_contact(p_sos_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.listings WHERE user_id = auth.uid())
     AND NOT EXISTS (SELECT 1 FROM public.sos_requests WHERE id = p_sos_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'NEEDS_LISTING';
  END IF;
  SELECT phone INTO v_phone
  FROM public.sos_requests
  WHERE id = p_sos_id AND status = 'open' AND expires_at > NOW();
  RETURN v_phone;
END;
$$;
REVOKE ALL ON FUNCTION public.get_sos_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_sos_contact(uuid) TO authenticated;

-- 2) "Only members can post an SOS" was checked by the page only. Now the
--    database checks it too, plus: at most 3 SOS per 24 hours, an SOS lasts
--    at most 3 days, sensible text lengths and a valid WhatsApp number.
DROP POLICY IF EXISTS "Signed-in users can post SOS" ON public.sos_requests;
CREATE POLICY "Signed-in users can post SOS"
  ON public.sos_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_member = true
    )
    AND status = 'open'
    AND expires_at <= NOW() + INTERVAL '3 days'
    AND (
      SELECT count(*) FROM public.sos_requests s
      WHERE s.user_id = (SELECT auth.uid()) AND s.created_at > NOW() - INTERVAL '24 hours'
    ) < 3
  );

ALTER TABLE public.sos_requests DROP CONSTRAINT IF EXISTS sos_requests_sizes;
ALTER TABLE public.sos_requests ADD CONSTRAINT sos_requests_sizes CHECK (
  char_length(coalesce(area, '')) <= 80
  AND char_length(coalesce(postcode, '')) <= 10
  AND char_length(coalesce(needed_time, '')) <= 60
  AND char_length(coalesce(note, '')) <= 300
  AND phone ~ '^(\+[0-9]{8,15}|0[0-9]{8,12})$'
) NOT VALID;

-- The author can only change the status (Mark filled), not the end date.
REVOKE UPDATE ON public.sos_requests FROM anon, authenticated;
GRANT UPDATE (status) ON public.sos_requests TO authenticated;

-- 3) Profiles hold every user's sign-in e-mail. The app only ever reads the
--    user's own profile, but the database let any signed-in account read all
--    of them. Now each account reads only its own row.
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- 4) Check (only reads). Expected: both "vidi_cislo" columns false, the SOS
--    alert trigger "on_sos_insert = O" (O = on, D = off), and one profiles
--    rule "(( SELECT auth.uid() AS uid) = id)".
SELECT
  has_column_privilege('anon', 'public.sos_requests', 'phone', 'SELECT')          AS neprihlaseny_vidi_cislo,
  has_column_privilege('authenticated', 'public.sos_requests', 'phone', 'SELECT') AS prihlaseny_vidi_cislo,
  (SELECT string_agg(tgname || ' = ' || tgenabled, ', ')
     FROM pg_trigger
     WHERE tgrelid = 'public.sos_requests'::regclass AND NOT tgisinternal)         AS sos_upozorneni,
  (SELECT count(*) FROM public.push_subscriptions)                                AS telefony_s_upozornenim,
  (SELECT string_agg(policyname || ': ' || coalesce(qual, '-'), '  |  ')
     FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT')    AS kdo_cte_profily;
