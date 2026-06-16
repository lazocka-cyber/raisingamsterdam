-- RaisingAmsterdam — web push subscriptions (for SOS alerts)
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
-- Idempotent — safe to run more than once.
--
-- Each row is one browser/device that opted in to SOS notifications.
-- The sos-notify Edge Function (service role) reads ALL rows to fan out
-- a push when a new SOS is posted.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- A user can register / read / remove only their own subscriptions.
DROP POLICY IF EXISTS "Users manage own push subscriptions (insert)" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions (insert)"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own push subscriptions (select)" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions (select)"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own push subscriptions (delete)" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions (delete)"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Allow re-subscribing from the same browser to update the row instead of
-- failing on the unique endpoint.
DROP POLICY IF EXISTS "Users manage own push subscriptions (update)" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions (update)"
  ON public.push_subscriptions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
