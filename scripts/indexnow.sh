#!/bin/bash
# ─────────────────────────────────────────────────────────────
# IndexNow — okamzite oznami vyhledavacum (Bing, Copilot, Seznam,
# Yandex...), ze mas novy nebo zmeneny obsah. Misto cekani, az se
# robot sam objevi, o nem vi behem minut.
#
# POUZITI:
#   ./scripts/indexnow.sh              → posle vsechny URL ze sitemap.xml
#   ./scripts/indexnow.sh <url> [...]  → posle jen konkretni adresy
#
# PRIKLAD po pridani noveho pruvodce:
#   ./scripts/indexnow.sh https://raisingamsterdam.com/guides/novy-pruvodce.html
#
# Klic musi byt verejne dostupny na https://raisingamsterdam.com/<KLIC>.txt
# (soubor je v public/, nasazuje se automaticky pri deployi na Vercel).
# ─────────────────────────────────────────────────────────────

set -euo pipefail

HOST="raisingamsterdam.com"
KEY="710d6f276a17ee99fe3efb56792b69bc"
KEY_URL="https://$HOST/$KEY.txt"
API="https://api.indexnow.org/IndexNow"

cd "$(dirname "$0")/.."

# 1) Overit, ze klic je verejne dostupny — bez toho IndexNow odmitne vse
echo "Kontroluji klic na $KEY_URL ..."
REMOTE_KEY=$(curl -fsS --max-time 15 "$KEY_URL" 2>/dev/null || true)
if [ "$REMOTE_KEY" != "$KEY" ]; then
  echo "CHYBA: klic neni dostupny nebo nesouhlasi."
  echo "  ocekavano: $KEY"
  echo "  nalezeno : ${REMOTE_KEY:-(nic)}"
  echo "  → soubor public/$KEY.txt musi byt nasazeny (git push a pockat na Vercel)."
  exit 1
fi
echo "Klic OK."

# 2) Sestavit seznam adres
if [ "$#" -gt 0 ]; then
  URLS=("$@")
  echo "Posilam $# zadanych adres."
else
  echo "Ctu adresy ze sitemap.xml ..."
  # shellcheck disable=SC2207
  URLS=($(grep -o '<loc>[^<]*</loc>' public/sitemap.xml | sed 's|</\?loc>||g'))
  echo "Nalezeno ${#URLS[@]} adres v sitemape."
fi

if [ "${#URLS[@]}" -eq 0 ]; then
  echo "Zadne adresy k odeslani, koncim."
  exit 1
fi

# 3) Poslat davkove na IndexNow
PAYLOAD=$(python3 -c '
import json, sys
print(json.dumps({
    "host": sys.argv[1],
    "key": sys.argv[2],
    "keyLocation": sys.argv[3],
    "urlList": sys.argv[4:],
}))' "$HOST" "$KEY" "$KEY_URL" "${URLS[@]}")

echo "Odesilam na IndexNow ..."
CODE=$(curl -sS -o /tmp/indexnow-response.txt -w '%{http_code}' \
  -X POST "$API" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data "$PAYLOAD" --max-time 30)

echo
case "$CODE" in
  200) echo "HOTOVO (HTTP 200) — vyhledavace prijaly ${#URLS[@]} adres." ;;
  202) echo "PRIJATO (HTTP 202) — adresy prijaty, klic se jeste overuje." ;;
  400) echo "CHYBA 400 — spatny format pozadavku." ;;
  403) echo "CHYBA 403 — klic neni platny nebo nesouhlasi se souborem na webu." ;;
  422) echo "CHYBA 422 — nektera adresa nepatri k domene $HOST." ;;
  429) echo "CHYBA 429 — prilis mnoho pozadavku, zkus to pozdeji." ;;
  *)   echo "Neocekavana odpoved HTTP $CODE" ;;
esac

if [ -s /tmp/indexnow-response.txt ]; then
  echo "--- odpoved serveru ---"
  cat /tmp/indexnow-response.txt
  echo
fi

[ "$CODE" = "200" ] || [ "$CODE" = "202" ]
