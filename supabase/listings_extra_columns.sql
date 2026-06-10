-- RaisingAmsterdam — extra columns for the Post-a-Listing form
-- Run this in the Supabase SQL Editor (new tab).

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS availability TEXT[],
ADD COLUMN IF NOT EXISTS age_groups TEXT[];

-- NOTE: the form also collects an optional phone / WhatsApp number, which
-- had no column in the original spec. Added here so that input isn't lost.
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS phone TEXT;
