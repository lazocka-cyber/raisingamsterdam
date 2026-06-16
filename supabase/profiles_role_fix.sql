-- RaisingAmsterdam — profiles table + automatic role on signup
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
--
-- WHY: new users (especially "Continue with Google") arrived without a row in
-- profiles, or with role = NULL, so the app couldn't tell who was a sitter.
-- This script:
--   1. makes sure the profiles table exists,
--   2. auto-creates a profile row whenever a new auth user signs up,
--      defaulting the role to 'sitter' when none was provided,
--   3. backfills anyone who is currently missing a profile / role.
-- It is idempotent — safe to run more than once.

-- 1) Profiles table (no-op if it already exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'sitter'
             CHECK (role IN ('sitter', 'parent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read profiles (needed to show roles / future names).
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

-- A user may update only their own profile row.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 2) Trigger: create a profile automatically on every new signup.
--    Role comes from the metadata the app sends (data: { role: 'sitter' | 'parent' }),
--    falling back to 'sitter' for OAuth users who sent nothing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'sitter')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role  = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Backfill: existing users who never got a profile row.
INSERT INTO public.profiles (id, email, role)
SELECT u.id,
       u.email,
       COALESCE(NULLIF(u.raw_user_meta_data ->> 'role', ''), 'sitter')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 3b) Backfill: existing profiles with a NULL/empty role → 'sitter'.
UPDATE public.profiles
SET role = 'sitter'
WHERE role IS NULL OR role = '';
