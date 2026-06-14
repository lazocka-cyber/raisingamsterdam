-- RaisingAmsterdam — let owners edit & delete their own listings.
-- Run this in the Supabase SQL Editor (new tab).
--
-- The original schema (listings.sql) only granted SELECT to everyone and
-- INSERT to authenticated users. To support the "My listings" page (edit /
-- delete), owners need UPDATE and DELETE on rows they created.
-- auth.uid() = user_id ensures a user can only touch their own listings.

-- Update own listings
DROP POLICY IF EXISTS "Users can update own listings" ON public.listings;
CREATE POLICY "Users can update own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own listings
DROP POLICY IF EXISTS "Users can delete own listings" ON public.listings;
CREATE POLICY "Users can delete own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
