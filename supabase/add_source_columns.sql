-- RaisingAmsterdam — first-party měření zdroje registrací a inzerátů.
-- Run this in the Supabase SQL Editor.
--
-- WHY: appka nikde neměla uloženo, odkud registrace přišla (Meta reklama,
-- Instagram, direct…). Klientský kód teď při příchodu zachytí utm_* / fbclid /
-- referrer a po registraci je zapíše sem. U každého babysittera pak jde
-- v databázi přesně vidět, která reklama/video ho přivedla.
--
-- Ukládá se jsonb, např.:
--   {"utm_source":"facebook","utm_campaign":"sitters-july","fbclid":"...",
--    "referrer":"https://l.instagram.com/","landing_page":"/","landed_at":"..."}
--
-- Jen přidání sloupců — nic se nemaže, idempotentní (safe spustit vícekrát).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS source jsonb;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS source jsonb;

-- ⚠️ DŮLEŽITÉ POŘADÍ: spustit PŘED nasazením nové verze appky — nový kód
-- posílá source při INSERT do listings; bez sloupce by vložení inzerátu selhalo.
