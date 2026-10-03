-- RaisingAmsterdam — paywall lock of 22. 6. 2026 (DOCUMENTATION COPY).
-- This was run in the Supabase SQL Editor on 22. 6. 2026 and lived only in the
-- "Zdeny mozek" vault (oprava-paywall/01-paywall-oprava.sql). Copied here on
-- 3. 10. 2026 so the repo knows about it: the WhatsApp unlock (listings,
-- My requests) depends on get_listing_contact().
-- Production differs slightly from this first draft (per the vault note of
-- 22. 6.): the whole table-level UPDATE on profiles was revoked (see
-- profiles_write_rpcs.sql), and listings SELECT was revoked and re-granted
-- for every column except phone. Do NOT re-run blindly — check production
-- first (pg_get_functiondef('public.get_listing_contact'::regproc)).

-- 1) ZÁMEK NA ČLENSTVÍ A ROLI
--    Běžný (přihlášený) uživatel už NESMÍ sám měnit is_member ani role.
--    Měnit je smí jen server (service_role) — viz Edge Function.
-- -------------------------------------------------------------
REVOKE UPDATE (is_member, role) ON public.profiles FROM anon, authenticated;

-- (jistota) běžný uživatel smí měnit ostatní sloupce svého profilu — to necháváme,
-- o to se stará tvá stávající RLS politika "Users can update own profile".


-- -------------------------------------------------------------
-- 2) TELEFON SCHOVAT PŘED NEČLENEM
--    Nikdo (ani nečlen, ani nepřihlášený) už nedostane sloupec phone
--    přímým dotazem na listings.
-- -------------------------------------------------------------
REVOKE SELECT (phone) ON public.listings FROM anon, authenticated;
-- DŮSLEDEK: ve frontendu už NESMÍ být select('*') na listings — viz plán,
--           je potřeba vyjmenovat sloupce BEZ phone.


-- -------------------------------------------------------------
-- 3) TELEFON SERVÍROVAT JEN ČLENOVI (přes bezpečnou funkci)
--    Funkce běží s právy vlastníka (SECURITY DEFINER), takže na phone vidí,
--    ale vrátí ho jen když je volající platící člen.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_listing_contact(p_listing_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone     text;
  v_is_member boolean;
BEGIN
  -- je přihlášený uživatel platící člen?
  SELECT is_member INTO v_is_member
  FROM public.profiles
  WHERE id = auth.uid();

  IF COALESCE(v_is_member, false) = false THEN
    RAISE EXCEPTION 'NOT_A_MEMBER';
  END IF;

  SELECT phone INTO v_phone
  FROM public.listings
  WHERE id = p_listing_id;

  RETURN v_phone;
END;
$$;

-- funkci smí volat jen přihlášený uživatel
REVOKE ALL ON FUNCTION public.get_listing_contact(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;


-- =============================================================
-- HOTOVO. Po spuštění:
--   - zkus v appce (NEČLEN) přečíst telefon → nesmí to jít
--   - zkus v konzoli update({is_member:true}) → musí spadnout (permission denied)
-- =============================================================
