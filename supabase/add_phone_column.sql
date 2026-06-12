-- RaisingAmsterdam — ensure the listings table has a phone (WhatsApp) column.
-- Run this in the Supabase SQL Editor.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS phone text;
