# Nasazení mazání účtu (delete-account)

Co je hotové v kódu:
- `supabase/functions/delete-account/index.ts` — edge funkce, co bezpečně smaže přihlášeného usera.
- `src/pages/DeleteAccount.jsx` + route `/delete-account` — stránka (in-app tlačítko i veřejná URL).
- Odkaz „Delete account" v patičce (na každé stránce) a v Dashboardu.

## Proč netřeba žádné SQL 🎉
Všechny tabulky (`listings`, `reviews`, `meetups`, `sos_requests`, `push_subscriptions`,
`profiles`) mají `REFERENCES auth.users(id) ON DELETE CASCADE`. Smazáním auth usera
se tedy **automaticky smažou i všechna jeho data**. Funkce jen smaže usera.

## Nasazení edge funkce (z VSCodia)
```bash
# jednou: přihlásit + propojit projekt (pokud ještě ne)
supabase login
supabase link --project-ref biisjnorqwifyrfemjyt

# nasadit funkci
supabase functions deploy delete-account
```
- **Verify JWT nech ZAPNUTÉ** (default) — funkci smí volat jen přihlášený uživatel.
- `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` se injektují automaticky, nic nenastavuješ.

## Push webu
```bash
git add -A && git commit -m "Account deletion (page + edge fn) + onboarding carousel" && git push
```

## Test
1. Přihlas se testovacím účtem (např. `lazocka+test1@gmail.com`).
2. Dej příspěvek/inzerát, ať má účet nějaká data.
3. Footer → „Delete account" → napiš DELETE → smazat.
4. Ověř v Supabase → Authentication, že user zmizel, a v `listings`/`profiles`, že jeho řádky jsou pryč (cascade).

⚠️ Pozn.: mazání je nevratné. Na localhostu funguje taky (volá živou Supabase funkci),
takže testuj klidně testovacím účtem, ne svým hlavním.
