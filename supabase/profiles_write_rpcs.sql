-- RaisingAmsterdam — safe writes to profiles (role choice + signup source).
-- Run this in the Supabase SQL Editor. Idempotent (safe to run more than once).
--
-- WHY: the paywall fix of 22. 6. 2026 removed ALL UPDATE rights on
-- public.profiles from anon/authenticated (so nobody can set is_member on
-- themselves). That lock was applied only in the dashboard, so the app kept
-- calling .update() on profiles and silently failed since then:
--   * "I'm a parent looking for help" → "Couldn't save your choice"
--   * profiles.source (where a signup came from) was never saved
-- The lock stays. The app now writes through two narrow functions instead.

-- 1) The lock, written down so the repo knows about it.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- 2) Role choice: a signed-in user can only switch themselves to 'parent'.
--    Membership (is_member) is NOT touched — that stays paid.
CREATE OR REPLACE FUNCTION public.choose_parent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;
  UPDATE public.profiles SET role = 'parent' WHERE id = auth.uid();
END;
$$;

-- 3) Signup source: written once, only while empty, only for accounts
--    created in the last 7 days, and only a small JSON object.
CREATE OR REPLACE FUNCTION public.save_signup_source(p_source jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_SIGNED_IN';
  END IF;
  IF p_source IS NULL
     OR jsonb_typeof(p_source) <> 'object'
     OR pg_column_size(p_source) > 4000 THEN
    RAISE EXCEPTION 'BAD_SOURCE';
  END IF;
  UPDATE public.profiles p
  SET source = p_source
  WHERE p.id = auth.uid()
    AND p.source IS NULL
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid() AND u.created_at > now() - interval '7 days'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.choose_parent() FROM public, anon;
REVOKE ALL ON FUNCTION public.save_signup_source(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.choose_parent() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_signup_source(jsonb) TO authenticated;
