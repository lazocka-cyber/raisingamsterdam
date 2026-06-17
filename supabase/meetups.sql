-- RaisingAmsterdam — Meet other parents (meetups & intros)
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
-- Idempotent — safe to run more than once.
--
-- A signed-in user posts either:
--   * a 'meetup'  — a casual get-together (coffee, park, playdate) with a date,
--   * an 'intro'  — a short "I'd love to meet families nearby" message.
-- The board is visible to SIGNED-IN users only (more private than SOS), and
-- people reach each other via WhatsApp. Past meetups disappear automatically.

CREATE TABLE IF NOT EXISTS public.meetups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'meetup' CHECK (type IN ('meetup', 'intro')),
  title       TEXT NOT NULL,
  body        TEXT,
  area        TEXT,
  event_date  DATE,          -- only for meetups
  event_time  TEXT,          -- free text, e.g. "Sat 10:00"
  whatsapp    TEXT,          -- optional contact number
  expires_at  TIMESTAMP WITH TIME ZONE,  -- set for meetups (end of event day); NULL for intros
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

-- Read: signed-in users only (these are personal posts, so not public).
DROP POLICY IF EXISTS "Signed-in users can read meetups" ON public.meetups;
CREATE POLICY "Signed-in users can read meetups"
  ON public.meetups FOR SELECT
  TO authenticated USING (true);

-- Insert: any signed-in user, writing as themselves.
DROP POLICY IF EXISTS "Signed-in users can post meetups" ON public.meetups;
CREATE POLICY "Signed-in users can post meetups"
  ON public.meetups FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Update / delete: only the author.
DROP POLICY IF EXISTS "Authors can update own meetup" ON public.meetups;
CREATE POLICY "Authors can update own meetup"
  ON public.meetups FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authors can delete own meetup" ON public.meetups;
CREATE POLICY "Authors can delete own meetup"
  ON public.meetups FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Helpful index for the board (newest first).
CREATE INDEX IF NOT EXISTS meetups_created_idx
  ON public.meetups (created_at DESC);
