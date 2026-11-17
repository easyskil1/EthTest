#!/bin/bash
# ============================================================
# Név:     MYSZKRIPT
# Leírás:  DESC
# Szerző:  AUTHOR
# ============================================================
# ──────────────────────────────────────────────────────────────
# HOGYAN MŰKÖDIK — olvasd el mielőtt szerkeszted!
# ──────────────────────────────────────────────────────────────
#
# Ez a szkript 6 terminált használ párhuzamosan (T1–T6).
# Minden terminál egy-egy fázist hajt végre, és az eredményeit
# egy .findings fájlba írja, amit a következő terminál olvas.
#
# PIPELINE LOGIKA:
#   T1 → T2 → T3 → T4 → T5 → T6
#   Minden fázis megvárja az előző befejezését (_done jelzés).
#   Ha egy fázis nem talált semmit → nem hoz létre _done fájlt
#   → az összes következő fázis megáll és kiírja hogy miért.
#
# T1 — FELDERÍTÉS (fut közvetlenül ebben a terminálban)
#   - Parancsokat futtatsz a célpont ellen (pl. whois, dig, ping)
#   - Az eredményeket változókba mentsd: VAR=$(parancs "$TARGET")
#   - Ha a változó nem üres → írd be a findings fájlba:
#       [ -n "$VAR" ] && echo "TIPUS:$VAR" >> ${TMP}_t1.findings
#   - A TIPUS: előtag fontos! T2 ez alapján dolgozza fel a sorokat.
#   - Ha a findings fájl üres → a pipeline megáll.
#
# T2–T5 — FELDOLGOZÁS (ezek a terminálokban futnak, api_run-nal)
#   - Megvárják az előző _done jelzést (max. 10 perc, utána timeout)
#   - Beolvassák az előző findings fájlt soronként
#   - Minden sorban: TIPUS:érték formátum
#   - A case "$type" in ... esac blokkban típusonként feldolgozod
#   - Amit találsz → írd be a saját findings fájlba ugyanígy
#   - Ha a saját findings fájl üres → a lánc itt megáll
#
# T6 — ÖSSZESÍTŐ (csak olvas, nem futtat semmit)
#   - Megvárja hogy legalább egy fázis befejezzen
#   - Kiírja az összes findings fájl tartalmát formázva
#   - Ide nem kell semmit írni, automatikusan működik
#
# FINDINGS FÁJL FORMÁTUM:
#   Minden sor: TIPUS:érték
#   Példák:
#     IP:192.168.1.1
#     PORT:192.168.1.1:80:http
#     WHOIS_EMAIL:admin@example.com
#     CVE:CVE-2021-41773:192.168.1.1:80
#   A TIPUS nagy betűs, a : után jön az érték (tartalmazhat : -ot)
#
# TERMINÁLOK KI/BEKAPCSOLÁSA:
#   Az ENABLE_T2..T5 változókkal kapcsolhatod ki a fázisokat.
#   Ha kikommenteled → az adott terminál kihagyódik, de a lánc
#   folytatódik a következő fázissal.
#
# TIPP: A $ gombbal (terminál alján) bármikor megnézheted
#   hogy az adott fázis mit írt a findings fájlba.
# ──────────────────────────────────────────────────────────────
# ============================================================

TARGET="$1"
[ -z "$TARGET" ] && echo "[HIBA] Célpont nincs megadva. Használat: ./MYSZKRIPT.sh <cél>" && exit 1

API="http://localhost:3000/api/pentest/run"
TMP="/tmp/MYSZKRIPT"

api_run() {
  local payload
  payload=$(python3 -c 'import json,sys; print(json.dumps({"terminalId":int(sys.argv[1]),"command":sys.argv[2]}))' "$1" "$2" 2>/dev/null)
  curl -s -X POST "$API" -H 'Content-Type: application/json' -d "$payload" >/dev/null
}

rm -f ${TMP}_t{1,2,3,4,5}_done ${TMP}_t{1,2,3,4,5}.findings

# ── Terminálok be/kikapcsolása ─────────────────────────────
# Kommenteld ki amit nem kell (a lánc folytatódik, csak kihagyja):
ENABLE_T2=1
ENABLE_T3=1
ENABLE_T4=1
ENABLE_T5=1

# ══════════════════════════════════════════════════════════════
# T2 — <fázis neve>
# Beolvassa: ${TMP}_t1.findings  |  Írja: ${TMP}_t2.findings
# ══════════════════════════════════════════════════════════════
api_run 2 "
echo '=== T2 — <fázis neve> ==='
[ '${ENABLE_T2}' != '1' ] && echo '[T2] Kikapcsolva — kihagyva.' && touch ${TMP}_t2_done && exit 0
T=0; while [ ! -f ${TMP}_t1_done ] && [ \$T -lt 600 ]; do sleep 5; T=\$((T+5)); done
[ ! -f ${TMP}_t1_done ] && echo '[TIMEOUT / T1 nincs találat]' && exit 1
echo \"T1 találatok: \$(wc -l < ${TMP}_t1.findings | tr -d ' ') db\"
> ${TMP}_t2.findings

while IFS= read -r line; do
  type=\$(echo \"\$line\" | cut -d: -f1)
  val=\$(echo \"\$line\"  | cut -d: -f2-)
  case \"\$type\" in
    # TIPUS1)
    #   EREDMENY=\$(parancs \"\$val\" 2>/dev/null)
    #   [ -n \"\$EREDMENY\" ] && echo \"TIPUS1:\$EREDMENY\" >> ${TMP}_t2.findings
    #   ;;
  esac
done < ${TMP}_t1.findings

FOUND=\$(wc -l < ${TMP}_t2.findings | tr -d ' ')
echo \"\"; echo \"T2 találatok: \$FOUND db\"
[ \"\$FOUND\" -eq 0 ] && echo '[T2] Nincs találat — T3+ megáll.' && exit 0
touch ${TMP}_t2_done
"

# ══════════════════════════════════════════════════════════════
# T3 — <fázis neve>
# Beolvassa: ${TMP}_t2.findings  |  Írja: ${TMP}_t3.findings
# ══════════════════════════════════════════════════════════════
api_run 3 "
echo '=== T3 — <fázis neve> ==='
[ '${ENABLE_T3}' != '1' ] && echo '[T3] Kikapcsolva — kihagyva.' && touch ${TMP}_t3_done && exit 0
T=0; while [ ! -f ${TMP}_t2_done ] && [ \$T -lt 600 ]; do sleep 5; T=\$((T+5)); done
[ ! -f ${TMP}_t2_done ] && echo '[TIMEOUT / T2 nincs találat]' && exit 1
echo \"T2 találatok: \$(wc -l < ${TMP}_t2.findings | tr -d ' ') db\"
> ${TMP}_t3.findings

while IFS= read -r line; do
  type=\$(echo \"\$line\" | cut -d: -f1)
  val=\$(echo \"\$line\"  | cut -d: -f2-)
  case \"\$type\" in
    # TIPUS1)
    #   EREDMENY=\$(parancs \"\$val\" 2>/dev/null)
    #   [ -n \"\$EREDMENY\" ] && echo \"TIPUS1:\$EREDMENY\" >> ${TMP}_t3.findings
    #   ;;
  esac
done < ${TMP}_t2.findings

FOUND=\$(wc -l < ${TMP}_t3.findings | tr -d ' ')
echo \"\"; echo \"T3 találatok: \$FOUND db\"
[ \"\$FOUND\" -eq 0 ] && echo '[T3] Nincs találat — T4+ megáll.' && exit 0
touch ${TMP}_t3_done
"

# ══════════════════════════════════════════════════════════════
# T4 — <fázis neve>
# Beolvassa: ${TMP}_t3.findings  |  Írja: ${TMP}_t4.findings
# ══════════════════════════════════════════════════════════════
api_run 4 "
echo '=== T4 — <fázis neve> ==='
[ '${ENABLE_T4}' != '1' ] && echo '[T4] Kikapcsolva — kihagyva.' && touch ${TMP}_t4_done && exit 0
T=0; while [ ! -f ${TMP}_t3_done ] && [ \$T -lt 900 ]; do sleep 5; T=\$((T+5)); done
[ ! -f ${TMP}_t3_done ] && echo '[TIMEOUT / T3 nincs találat]' && exit 1
echo \"T3 találatok: \$(wc -l < ${TMP}_t3.findings | tr -d ' ') db\"
> ${TMP}_t4.findings

while IFS= read -r line; do
  type=\$(echo \"\$line\" | cut -d: -f1)
  val=\$(echo \"\$line\"  | cut -d: -f2-)
  case \"\$type\" in
    # TIPUS1)
    #   EREDMENY=\$(parancs \"\$val\" 2>/dev/null)
    #   [ -n \"\$EREDMENY\" ] && echo \"TIPUS1:\$EREDMENY\" >> ${TMP}_t4.findings
    #   ;;
  esac
done < ${TMP}_t3.findings

FOUND=\$(wc -l < ${TMP}_t4.findings | tr -d ' ')
echo \"\"; echo \"T4 találatok: \$FOUND db\"
[ \"\$FOUND\" -eq 0 ] && echo '[T4] Nincs találat — T5+ megáll.' && exit 0
touch ${TMP}_t4_done
"

# ══════════════════════════════════════════════════════════════
# T5 — <fázis neve>
# Beolvassa: ${TMP}_t4.findings  |  Írja: ${TMP}_t5.findings
# ══════════════════════════════════════════════════════════════
api_run 5 "
echo '=== T5 — <fázis neve> ==='
[ '${ENABLE_T5}' != '1' ] && echo '[T5] Kikapcsolva — kihagyva.' && touch ${TMP}_t5_done && exit 0
T=0; while [ ! -f ${TMP}_t4_done ] && [ \$T -lt 900 ]; do sleep 5; T=\$((T+5)); done
[ ! -f ${TMP}_t4_done ] && echo '[TIMEOUT / T4 nincs találat]' && exit 1
echo \"T4 találatok: \$(wc -l < ${TMP}_t4.findings | tr -d ' ') db\"
> ${TMP}_t5.findings

while IFS= read -r line; do
  type=\$(echo \"\$line\" | cut -d: -f1)
  val=\$(echo \"\$line\"  | cut -d: -f2-)
  case \"\$type\" in
    # TIPUS1)
    #   EREDMENY=\$(parancs \"\$val\" 2>/dev/null)
    #   [ -n \"\$EREDMENY\" ] && echo \"TIPUS1:\$EREDMENY\" >> ${TMP}_t5.findings
    #   ;;
  esac
done < ${TMP}_t4.findings

FOUND=\$(wc -l < ${TMP}_t5.findings | tr -d ' ')
echo \"\"; echo \"T5 találatok: \$FOUND db\"
[ \"\$FOUND\" -eq 0 ] && echo '[T5] Nincs találat — T6 csak részleges.' && exit 0
touch ${TMP}_t5_done
"

# ══════════════════════════════════════════════════════════════
# T6 — Összesítő jelentés (csak listáz, nem futtat semmit)
# ══════════════════════════════════════════════════════════════
api_run 6 "
echo '=== T6 — Összesítő jelentés ==='
T=0; while [ ! -f ${TMP}_t5_done ] && [ ! -f ${TMP}_t4_done ] && [ ! -f ${TMP}_t3_done ] && [ ! -f ${TMP}_t2_done ] && [ ! -f ${TMP}_t1_done ] && [ \$T -lt 1200 ]; do sleep 5; T=\$((T+5)); done
echo \"Célpont : $TARGET\"
echo \"Dátum   : \$(date)\"
echo ''
for i in 1 2 3 4 5; do
  f=\"${TMP}_t\${i}.findings\"
  [ ! -f \"\$f\" ] && continue
  COUNT=\$(wc -l < \"\$f\" | tr -d ' ')
  [ \"\$COUNT\" -eq 0 ] && continue
  echo \"── T\${i} találatok (\$COUNT db) ──────────────────\"
  cat \"\$f\" | sed 's/^/  /'
  echo ''
done
echo '================================================'
echo '  MYSZKRIPT — pipeline befejezve'
echo '================================================'
"

# ══════════════════════════════════════════════════════════════
# T1 — <fázis neve>  (ez fut közvetlenül ebben a terminálban)
# Parancsok → változók → nem-üres értékek → findings fájl
# ══════════════════════════════════════════════════════════════
echo "=== T1 — <fázis neve> ==="
echo "Célpont: $TARGET"
echo ""
> ${TMP}_t1.findings

# --- ide írd a parancsokat és a változókat ---

# PELDA1=$(parancs1 "$TARGET" 2>/dev/null | grep "valami")
# PELDA2=$(parancs2 "$TARGET" 2>/dev/null | grep "valami")

# --- nem-üres eredmény → findings ---

# [ -n "$PELDA1" ] && echo "TIPUS1:$PELDA1" >> ${TMP}_t1.findings
# [ -n "$PELDA2" ] && echo "TIPUS2:$PELDA2" >> ${TMP}_t1.findings

# ---------------------------------------------
FOUND=$(wc -l < ${TMP}_t1.findings | tr -d ' ')
echo ""
echo "T1 találatok: $FOUND db"
[ "$FOUND" -eq 0 ] && echo "[T1] Nincs találat — pipeline megáll." && exit 0
touch ${TMP}_t1_done
