-- RaisingAmsterdam — upozornit rodiče, když se mu na poptávku ozve chůva.
-- Po každém novém řádku v request_offers zavolá Edge funkci offer-notify
-- (cinknutí na telefon + e-mail u první odpovědi).
--
-- Spustit v Supabase SQL editoru AŽ PO nasazení funkce offer-notify.
-- Skript jde pustit opakovaně. Žádné heslo v něm není: funkce si nabídku
-- ověřuje sama v databázi (viz komentář v supabase/functions/offer-notify/index.ts).

-- 1) Značka "už oznámeno", aby oznámení neodešlo dvakrát.
ALTER TABLE public.request_offers
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;

-- Staré nabídky označit jako vyřízené, ať se k nim nic neposílá zpětně.
UPDATE public.request_offers SET notified_at = created_at WHERE notified_at IS NULL;

-- 2) Funkce, kterou spouštěč volá. Chyba při volání nesmí nabídku chůvy zablokovat.
CREATE OR REPLACE FUNCTION public.notify_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://biisjnorqwifyrfemjyt.supabase.co/functions/v1/offer-notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('offer_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_offer failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_offer() FROM public, anon, authenticated;

-- 3) Spouštěč.
DROP TRIGGER IF EXISTS on_offer_insert ON public.request_offers;
CREATE TRIGGER on_offer_insert
  AFTER INSERT ON public.request_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_offer();
