-- RaisingAmsterdam — call the sos-notify Edge Function on every new SOS.
-- Uses pg_net directly (more reliable than the dashboard Webhook UI, which
-- needs the supabase_functions schema).
--
-- ⚠️ Before running, replace the two placeholders:
--   <PROJECT_REF>        → your project ref (e.g. biisjnorqwifyrfemjyt)
--   <SOS_WEBHOOK_SECRET> → the SOS_WEBHOOK_SECRET value set in Edge Function secrets
-- (We keep the real secret out of git on purpose.)

CREATE OR REPLACE FUNCTION public.notify_sos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sos-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sos-secret', '<SOS_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'sos_requests',
      'record', to_jsonb(NEW)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_sos_insert ON public.sos_requests;
CREATE TRIGGER on_sos_insert
  AFTER INSERT ON public.sos_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_sos();
