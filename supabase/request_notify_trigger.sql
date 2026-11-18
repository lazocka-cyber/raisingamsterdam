-- RaisingAmsterdam — upozornit chůvy, když rodina zadá novou poptávku.
-- Po každém novém řádku v family_requests zavolá Edge funkci request-notify
-- (cinknutí na telefon + e-mail chůvám s inzerátem).
--
-- Spustit v Supabase SQL editoru AŽ PO nasazení funkce request-notify.
-- Skript jde pustit opakovaně. Žádné heslo v něm není.

-- 1) Značka "už oznámeno" u poptávky.
ALTER TABLE public.family_requests
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;

-- Staré poptávky označit jako vyřízené, ať se k nim nic neposílá zpětně.
UPDATE public.family_requests SET notified_at = created_at WHERE notified_at IS NULL;

-- 2) Odhlášení z těchto e-mailů: chůva odpoví "stop" a Zdeny jí tu nastaví false.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS request_emails BOOLEAN NOT NULL DEFAULT true;

-- 3) Funkce, kterou spouštěč volá. Chyba při volání nesmí poptávku rodiče zablokovat.
CREATE OR REPLACE FUNCTION public.notify_family_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://biisjnorqwifyrfemjyt.supabase.co/functions/v1/request-notify',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('request_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_family_request failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_family_request() FROM public, anon, authenticated;

-- 4) Spouštěč.
DROP TRIGGER IF EXISTS on_family_request_insert ON public.family_requests;
CREATE TRIGGER on_family_request_insert
  AFTER INSERT ON public.family_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_family_request();
