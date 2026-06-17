-- RaisingAmsterdam — Model B: membership decoupled from role
-- Run this in the Supabase SQL Editor (new tab → paste → Run). Idempotent.
--
-- WHAT CHANGES:
--   * Listing is FREE for everyone (already allowed by the listings INSERT policy).
--   * Contacting a listing requires membership (is_member = true), set after the
--     user enters a valid one-time access key (Gumroad) on the Membership page.
--
-- The app sets is_member on the user's own profile (the existing "Users can
-- update own profile" policy already allows this). NOTE: this trusts the client
-- after the Gumroad check — same model as the old parent-role flip. Harden later
-- with an edge function if needed (so users can't set is_member themselves).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT false;

-- Existing parents already paid for access → grant them membership.
UPDATE public.profiles
SET is_member = true
WHERE role = 'parent' AND is_member = false;
