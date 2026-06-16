-- RaisingAmsterdam — photos for listings (babysitter profile pictures)
-- Run this in the Supabase SQL Editor (new tab → paste → Run).
-- Idempotent — safe to run more than once.

-- 1) Column to store the public photo URL on each listing.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2) Public storage bucket for the uploaded images.
--    public = true so the photos can be shown to anyone browsing listings.
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3) Storage policies for the listing-photos bucket.
--    Read: anyone (public marketplace).
--    Write/update/delete: only signed-in users, and only inside a folder
--    named after their own user id (we upload to "<user_id>/<file>").
DROP POLICY IF EXISTS "listing-photos public read" ON storage.objects;
CREATE POLICY "listing-photos public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS "listing-photos owner insert" ON storage.objects;
CREATE POLICY "listing-photos owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "listing-photos owner update" ON storage.objects;
CREATE POLICY "listing-photos owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "listing-photos owner delete" ON storage.objects;
CREATE POLICY "listing-photos owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
