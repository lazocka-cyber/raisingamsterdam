-- RaisingAmsterdam — listings marketplace table
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('babysitter', 'secondhand', 'services', 'community')) NOT NULL,
  price TEXT,
  location TEXT,
  contact_email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listings"
  ON public.listings FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can insert"
  ON public.listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Demo / seed listings so the page isn't empty
INSERT INTO public.listings (user_id, title, description, category, price, location, contact_email, phone)
VALUES
  (NULL, 'Experienced babysitter available', 'Native English speaker, 5 years experience with kids 0-6. Available weekends and evenings.', 'babysitter', '€12/hour', 'Amsterdam Oud-West', 'demo1@example.com', '+31612345678'),
  (NULL, 'Baby clothes bundle 0-6 months', 'Large bundle of baby clothes, mostly H&M and Zara. Good condition. Smoke-free home.', 'secondhand', '€25', 'Amsterdam Noord', 'demo2@example.com', '0612345679'),
  (NULL, 'Dutch language playgroup', 'Weekly playgroup to help expat kids learn Dutch through play. Ages 2-5.', 'community', 'Free', 'Amsterdam Centrum', 'demo3@example.com', NULL);
