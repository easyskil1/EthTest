#!/usr/bin/env ruby
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
# T1 — FELDERÍTÉS (fut közvetlenül ebben a szkriptben)
#   - Parancsokat futtatsz: pelda = run("parancs #{TARGET}")
#   - Ha az eredmény nem üres → findings tömbbe:
#       findings << "TIPUS:#{pelda}" unless pelda.empty?
#   - A TIPUS: előtag fontos! T2 ez alapján dolgozza fel.
#   - Ha a findings tömb üres → a pipeline megáll.
#
# T2–T5 — FELDOLGOZÁS (api_run-nal indulnak a terminálokban)
#   - Megvárják az előző _done jelzést (max. 10 perc)
#   - Beolvassák az előző findings fájlt soronként
#   - Minden sor: TIPUS:érték formátum
#   - A case "$type" in blokkban típusonként feldolgozod
#   - Amit találsz → saját findings fájlba ugyanilyen formátumban
#   - Ha a saját findings fájl üres → a lánc itt megáll
#
# T6 — ÖSSZESÍTŐ (csak olvas, nem futtat semmit)
#   - Kiírja az összes findings fájl tartalmát formázva
#   - Ide nem kell semmit írni, automatikusan működik
#
# FINDINGS FÁJL FORMÁTUM:
#   Minden sor: TIPUS:érték
#   Példák:
#     IP:192.168.1.1
#     PORT:192.168.1.1:80:http
#     WHOIS_EMAIL:admin@example.com
#
# TERMINÁLOK KI/BEKAPCSOLÁSA:
#   Az ENABLE_T2..T5 = true sorokat kommenteld ki ha nem kell.
#   A lánc folytatódik a következő aktív fázissal.
#
# TIPP: A $ gombbal (terminál alján) bármikor megnézheted
#   hogy az adott fázis mit írt a findings fájlba.
# ──────────────────────────────────────────────────────────────
# ============================================================

require 'net/http'
require 'json'

TARGET = ARGV[0]
abort "[HIBA] Célpont nincs megadva. Használat: ruby MYSZKRIPT.rb <cél>" unless TARGET

API = "http://localhost:3000/api/pentest/run"
TMP = "/tmp/MYSZKRIPT"

def api_run(tid, cmd)
  uri = URI(API)
  req = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
  req.body = { terminalId: tid, command: cmd }.to_json
  Net::HTTP.new(uri.host, uri.port).request(req)
rescue => e
  puts "[api_run hiba] #{e}"
end

def run(cmd)
  `#{cmd} 2>/dev/null`.strip
end

(1..5).each do |i|
  ["_done", ".findings"].each do |suf|
    File.delete("#{TMP}_t#{i}#{suf}") rescue nil
  end
end

# ── Terminálok be/kikapcsolása ─────────────────────────────
# Kommenteld ki amit nem kell:
ENABLE_T2 = true
ENABLE_T3 = true
ENABLE_T4 = true
ENABLE_T5 = true

# ══════════════════════════════════════════════════════════════
# T2-T5 regisztrálása (várakoznak T1 jelzésére)
# ══════════════════════════════════════════════════════════════
def t_block(t, p, tmp)
  <<~BASH
    echo '=== T#{t} — <fázis neve> ==='
    T=0; while [ ! -f #{tmp}_t#{p}_done ] && [ $T -lt 600 ]; do sleep 5; T=$((T+5)); done
    [ ! -f #{tmp}_t#{p}_done ] && echo '[TIMEOUT / T#{p} nincs találat]' && exit 1
    echo "T#{p} találatok: $(wc -l < #{tmp}_t#{p}.findings | tr -d ' ') db"
    > #{tmp}_t#{t}.findings

    while IFS= read -r line; do
      type=$(echo "$line" | cut -d: -f1)
      val=$(echo "$line"  | cut -d: -f2-)
      case "$type" in
        # TIPUS1)
        #   EREDMENY=$(parancs "$val" 2>/dev/null)
        #   [ -n "$EREDMENY" ] && echo "TIPUS1:$EREDMENY" >> #{tmp}_t#{t}.findings
        #   ;;
      esac
    done < #{tmp}_t#{p}.findings

    FOUND=$(wc -l < #{tmp}_t#{t}.findings | tr -d ' ')
    echo ""; echo "T#{t} találatok: $FOUND db"
    [ "$FOUND" -eq 0 ] && echo '[T#{t}] Nincs találat — T#{t+1}+ megáll.' && exit 0
    touch #{tmp}_t#{t}_done
  BASH
end

def skip_block(t, tmp)
  "echo '[T#{t}] Kikapcsolva — kihagyva.' && touch #{tmp}_t#{t}_done"
end

api_run(2, ENABLE_T2 ? t_block(2, 1, TMP) : skip_block(2, TMP))
api_run(3, ENABLE_T3 ? t_block(3, 2, TMP) : skip_block(3, TMP))
api_run(4, ENABLE_T4 ? t_block(4, 3, TMP) : skip_block(4, TMP))
api_run(5, ENABLE_T5 ? t_block(5, 4, TMP) : skip_block(5, TMP))

api_run(6, <<~BASH)
  echo '=== T6 — Összesítő jelentés ==='
  T=0; while [ ! -f #{TMP}_t5_done ] && [ ! -f #{TMP}_t4_done ] && [ ! -f #{TMP}_t3_done ] && [ ! -f #{TMP}_t2_done ] && [ ! -f #{TMP}_t1_done ] && [ $T -lt 1200 ]; do sleep 5; T=$((T+5)); done
  echo "Célpont : #{TARGET}"
  echo "Dátum   : $(date)"
  echo ''
  for i in 1 2 3 4 5; do
    f="#{TMP}_t${i}.findings"
    [ ! -f "$f" ] && continue
    COUNT=$(wc -l < "$f" | tr -d ' ')
    [ "$COUNT" -eq 0 ] && continue
    echo "── T${i} találatok ($COUNT db) ──────────────────"
    cat "$f" | sed 's/^/  /'
    echo ''
  done
  echo '================================================'
  echo '  MYSZKRIPT — pipeline befejezve'
  echo '================================================'
BASH

# ══════════════════════════════════════════════════════════════
# T1 — <fázis neve>  (ez fut közvetlenül)
# Parancsok → változók → nem-üres értékek → findings fájl
# ══════════════════════════════════════════════════════════════
puts "=== T1 — <fázis neve>: #{TARGET} ==="
findings = []

# --- ide írd a parancsokat és a változókat ---

# pelda1 = run("parancs1 #{TARGET}")
# pelda2 = run("parancs2 #{TARGET}")

# --- nem-üres eredmény → findings ---

# findings << "TIPUS1:#{pelda1}" unless pelda1.empty?
# findings << "TIPUS2:#{pelda2}" unless pelda2.empty?

# ---------------------------------------------
File.write("#{TMP}_t1.findings", findings.join("\n") + (findings.empty? ? "" : "\n"))

puts "T1 találatok: #{findings.size} db"
if findings.empty?
  puts "[T1] Nincs találat — pipeline megáll."
  exit 0
end
File.write("#{TMP}_t1_done", "")
