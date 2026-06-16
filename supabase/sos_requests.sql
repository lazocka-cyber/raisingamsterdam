-- RaisingAmsterdam — SOS babysitter requests (last-minute / emergency)
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
-- Idempotent — safe to run more than once.
--
-- A parent (or any signed-in user) posts an urgent "I need a sitter now"
-- request. Everyone can see open requests; sitters contact the parent via
-- WhatsApp. Requests disappear once expires_at passes or status = 'closed'.

CREATE TABLE IF NOT EXISTS public.sos_requests (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area        TEXT,
  postcode    TEXT,
  child_age   TEXT,
  needed_date DATE,
  needed_time TEXT,
  note        TEXT,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  expires_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;

-- Read: anyone (even logged-out visitors) — maximum reach for emergencies.
DROP POLICY IF EXISTS "Anyone can read SOS requests" ON public.sos_requests;
CREATE POLICY "Anyone can read SOS requests"
  ON public.sos_requests FOR SELECT
  TO public USING (true);

-- Insert: any signed-in user, writing as themselves.
DROP POLICY IF EXISTS "Signed-in users can post SOS" ON public.sos_requests;
CREATE POLICY "Signed-in users can post SOS"
  ON public.sos_requests FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Update / delete: only the author (to close or remove their request).
DROP POLICY IF EXISTS "Authors can update own SOS" ON public.sos_requests;
CREATE POLICY "Authors can update own SOS"
  ON public.sos_requests FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authors can delete own SOS" ON public.sos_requests;
CREATE POLICY "Authors can delete own SOS"
  ON public.sos_requests FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Helpful index for the board query (open + not expired, newest first).
CREATE INDEX IF NOT EXISTS sos_requests_open_idx
  ON public.sos_requests (status, expires_at DESC);
