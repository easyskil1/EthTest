#!/usr/bin/env python3
"""
EthTest — Python backend (Flask + flask-socketio), a server.js portja.

- nmap szkenner (profilok + custom), valos ideju kimenet Socket.IO-n
- WiFi audit: a mukodo iw-monitor modszer (airmon-ng NELKUL) + wordlist (--dict)
- pentest script-futtato (REST + Socket.IO)
- a public/ frontend valtozatlan; a Socket.IO klienst a /socket.io/socket.io.js adja ki

Fut a Kali konteneriben (ott van nmap+wifite+python3). Bongeszobol: http://localhost:3000
Csak sajat halozat / irasos engedely!
"""
import os
import re
import json
import signal
import subprocess
import time
from datetime import datetime, timezone

from flask import (Flask, request, jsonify, send_from_directory,
                   send_file, abort)
from flask_socketio import SocketIO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
VENDOR_DIR = os.path.join(BASE_DIR, "vendor")
# A wordlistek helye a konteneriben (a host ~/kali/wordlists -> /root/work/wordlists)
WORDLIST_DIR = os.environ.get("WORDLIST_DIR", "/root/work/wordlists")
# Feltoltott wordlistek irhato helye (app alatt, minden kornyezetben mukodik)
WORDLIST_UPLOAD_DIR = os.path.join(BASE_DIR, "wordlists")
DEFAULT_IFACE = os.environ.get("WIFI_IFACE", "wlan1")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(WORDLIST_UPLOAD_DIR, exist_ok=True)


def _which(*cands):
    for c in cands:
        try:
            out = subprocess.run(["bash", "-lc", f"command -v {c}"],
                                 capture_output=True, text=True)
            p = out.stdout.strip().split("\n")[0]
            if p:
                return p
        except Exception:
            pass
    return cands[-1]


NMAP_PATH = _which("nmap", "/usr/bin/nmap")
BASH_PATH = _which("bash", "/bin/bash")
IW_PATH = _which("iw", "/usr/sbin/iw")
IP_PATH = _which("ip", "/usr/sbin/ip")
WIFITE_PATH = _which("wifite", "/usr/sbin/wifite")

app = Flask(__name__, static_folder=None)
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*")

active = {}   # kulcs -> Popen


# ─── Statikus kiszolgalas ────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/socketio.js")
def socketio_client():
    # A klienst NEM a /socket.io/ ala tesszuk, mert azt a Flask-SocketIO
    # middleware lefoglalja (transport) -> elfogna es hibat adna.
    return send_file(os.path.join(VENDOR_DIR, "socket.io.min.js"),
                     mimetype="application/javascript")


@app.route("/uploads/<path:fn>")
def uploads_static(fn):
    return send_from_directory(UPLOADS_DIR, fn)


@app.route("/<path:fn>")
def public_static(fn):
    full = os.path.join(PUBLIC_DIR, fn)
    if os.path.isfile(full):
        return send_from_directory(PUBLIC_DIR, fn)
    abort(404)


# ─── Rendszer info ───────────────────────────────────────────────────
@app.route("/api/system")
def system():
    return jsonify(platform="linux", isMac=False, isLinux=True)


# ─── Wordlistek listazasa (uj vegpont) ───────────────────────────────
def _hsize(n):
    for u in ("B", "K", "M", "G"):
        if n < 1024:
            return f"{n:.0f}{u}"
        n /= 1024
    return f"{n:.0f}T"


@app.route("/api/wordlists")
def wordlists():
    items = []
    for d in (WORDLIST_UPLOAD_DIR, WORDLIST_DIR, "/usr/share/wordlists"):
        try:
            for n in sorted(os.listdir(d)):
                p = os.path.join(d, n)
                if os.path.isfile(p) and n.endswith((".txt", ".lst", ".dict")):
                    try:
                        sz = os.path.getsize(p)
                    except OSError:
                        sz = 0
                    items.append({"name": n, "path": p, "size": _hsize(sz), "bytes": sz})
        except OSError:
            continue
    return jsonify(items)


@app.route("/api/wordlists/upload", methods=["POST"])
def wordlists_upload():
    f = request.files.get("file")
    if not f or not f.filename:
        return jsonify(error="Fajl szukseges"), 400
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ("txt", "lst", "dict"):
        return jsonify(error="Csak .txt, .lst, .dict engedelyezett"), 400
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", f.filename)
    dest = os.path.join(WORDLIST_UPLOAD_DIR, safe)
    try:
        f.save(dest)
    except OSError as e:
        return jsonify(error=f"Mentes sikertelen: {e}"), 500
    return jsonify(ok=True, name=safe, path=dest)


# ─── Nmap ────────────────────────────────────────────────────────────
def nmap_profiles(target):
    return {
        "ping": ["-sn", target],
        "os": ["-O", "--top-ports", "50", target],
        "mac": ["-sn", "-PR", target],
        "nbstat": ["--script=nbstat", "-p", "137,139", target],
        "traceroute": ["--traceroute", "-sn", target],
        "dnsbrute": ["--script=dns-brute", target],
        "discovery": ["--script=discovery", "--top-ports", "100", target],
        "fast": ["-T4", "-F", target],
        "full": ["-sV", "-O", "--top-ports", "1000", target],
        "udp": ["-sU", "--top-ports", "100", target],
        "allports": ["-p-", "-T4", "--open", target],
        "stealth": ["-sS", "-T4", "--top-ports", "1000", target],
        "ack": ["-sA", "--top-ports", "100", target],
        "fin": ["-sF", "-T4", "--top-ports", "1000", target],
        "null": ["-sN", "-T4", "--top-ports", "1000", target],
        "xmas": ["-sX", "-T4", "--top-ports", "1000", target],
        "ipproto": ["-sO", target],
        "ports": ["-sV", "--top-ports", "100", target],
        "scripts": ["-sC", "-sV", "--top-ports", "100", target],
        "banner": ["--script=banner", "--top-ports", "100", target],
        "auth": ["--script=auth", "--top-ports", "50", target],
        "httpenum": ["--script=http-enum", "-p", "80,443,8080,8443", target],
        "httpmethods": ["--script=http-methods", "-p", "80,443,8080,8443", target],
        "dbinfo": ["--script=mysql-info,ms-sql-info", "-p", "1433,3306,5432,1521", target],
        "vuln": ["--script=vuln", "--top-ports", "50", target],
        "smb": ["--script", "smb-vuln*", "-p", "139,445", target],
        "httpvuln": ["--script", "http-vuln*", "--top-ports", "20", target],
        "ssl": ["--script=ssl-heartbleed,ssl-poodle,ssl-enum-ciphers", "-p", "443,8443", target],
        "shellshock": ["--script=http-shellshock", "-p", "80,443,8080", target],
        "rdpvuln": ["--script=rdp-enum-encryption,rdp-vuln-ms12-020", "-p", "3389", target],
        "dbvuln": ["--script", "mysql-vuln*,ms-sql-vuln*", "-p", "1433,3306", target],
        "malware": ["--script=malware", "--top-ports", "50", target],
        "exploit": ["--script=exploit", "--top-ports", "50", target],
        "brute": ["--script=brute", "--top-ports", "20", target],
        "dos": ["--script=dos", "--top-ports", "20", target],
        "fuzzer": ["--script=fuzzer", "--top-ports", "10", target],
        "decoy": ["-sS", "-D", "RND:5", "-T2", "--top-ports", "100", target],
        "frag": ["-sS", "-f", "-T2", "--top-ports", "100", target],
        "audit": ["-sV", "-sC", "-O", "-T4", "--top-ports", "1000", "--script=vuln", target],
    }


def is_valid_target(t):
    return bool(re.match(r"^[a-zA-Z0-9.\-/]+$", t)) and not any(c in t for c in ";&|")


def _run_nmap(nmap_args, use_sudo, target, scan_type):
    if use_sudo:
        argv = ["sudo", "-n", NMAP_PATH] + nmap_args
    else:
        argv = [NMAP_PATH] + nmap_args

    def worker():
        try:
            proc = subprocess.Popen(argv, stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE, text=True, bufsize=1)
        except Exception as e:
            socketio.emit("nmap:error", {"message": str(e), "hint": "nmap.err.not_installed"})
            return
        active["nmap"] = proc
        socketio.emit("nmap:start", {"target": target, "scanType": scan_type, "useSudo": use_sudo})
        full, errbuf = [], []
        start = time.time()

        def read_err():
            for line in proc.stderr:
                errbuf.append(line)
                if line.strip():
                    socketio.emit("nmap:output", {"raw": line.strip(), "type": "warning"})
        socketio.start_background_task(read_err)

        for line in proc.stdout:
            full.append(line)
            if line.strip():
                socketio.emit("nmap:output", parse_nmap_line(line.rstrip("\n")))
        code = proc.wait()
        active.pop("nmap", None)
        out = "".join(full)
        elapsed = (time.time() - start) * 1000
        if code != 0 and elapsed < 4000 and not out.strip():
            socketio.emit("nmap:error", {
                "message": "".join(errbuf).strip() or "nmap.err.exited",
                "hint": "nmap.err.sudo_failed" if use_sudo else "nmap.err.check_install"})
        else:
            socketio.emit("nmap:done", {"code": code, "summary": build_nmap_summary(out),
                                        "stderrHint": "".join(errbuf).strip() if code != 0 else None})

    socketio.start_background_task(worker)


@app.route("/api/nmap/scan", methods=["POST"])
def nmap_scan():
    body = request.get_json(force=True, silent=True) or {}
    target = body.get("target")
    scan_type = body.get("scanType", "basic")
    custom = body.get("customCmd")
    use_sudo = bool(body.get("useSudo", False))

    if custom:
        if re.search(r"[;&|><`$(){}\[\]\\]", custom):
            return jsonify(error="nmap.err.blocked_char"), 400
        raw = re.sub(r"^nmap\s+", "", custom.strip(), flags=re.I)
        nmap_args = re.findall(r"(?:[^\s\"']+|\"[^\"]*\"|'[^']*')+", raw)
        if not nmap_args:
            return jsonify(error="nmap.err.empty_cmd"), 400
        _run_nmap(nmap_args, use_sudo, nmap_args[-1] if nmap_args else "", "custom")
        return jsonify(status="started")

    if not target or not is_valid_target(target):
        return jsonify(error="nmap.err.invalid_target"), 400
    profiles = nmap_profiles(target)
    nmap_args = profiles.get(scan_type, profiles["ping"])
    _run_nmap(nmap_args, use_sudo, target, scan_type)
    return jsonify(status="started")


@app.route("/api/nmap/stop", methods=["POST"])
def nmap_stop():
    p = active.get("nmap")
    if p:
        p.send_signal(signal.SIGINT)
        active.pop("nmap", None)
        socketio.emit("nmap:done", {"code": None, "summary": None, "stopped": True})
        return jsonify(status="stopped")
    return jsonify(status="not_running")


# ─── WiFi audit (iw-monitor modszer + wordlist) ──────────────────────
def _safe_wordlist(path):
    if not path:
        return None
    rp = os.path.realpath(path)
    allowed = (os.path.realpath(WORDLIST_UPLOAD_DIR), os.path.realpath(WORDLIST_DIR), os.path.realpath("/usr/share/wordlists"), "/root/work")
    if any(rp.startswith(a) for a in allowed) and os.path.isfile(rp):
        return rp
    return None


def _iface_driver(name):
    try:
        return os.path.basename(os.path.realpath("/sys/class/net/%s/device/driver" % name))
    except Exception:
        return ""


def _detect_stick_iface(preferred=""):
    """A monitort tudo USB sticket valasztja DRIVER alapjan (rtl8xxxu / 8188), NEM a beepitett
    brcmfmac-ot (annak nincs monitor modja). Igy mindegy, hogy wlan0 vagy wlan1.
    Visszaad: (iface, megjegyzes_vagy_None)."""
    import glob
    wifis = [os.path.basename(p) for p in sorted(glob.glob("/sys/class/net/wl*"))]
    # ha a kert iface letezik es monitor-kepes (nem brcmfmac), azt tartjuk
    if preferred and preferred in wifis and _iface_driver(preferred) != "brcmfmac":
        return preferred, None
    # keressuk a sticket a driver alapjan
    for n in wifis:
        d = _iface_driver(n)
        if d == "rtl8xxxu" or "8188" in d:
            note = None
            if preferred and preferred != n:
                note = "'%s' nem monitor-kepes (%s) -> atvaltok a stickre: %s" % (
                    preferred, _iface_driver(preferred) or "?", n)
            return n, note
    # fallback: barmi, ami nem brcmfmac
    for n in wifis:
        if _iface_driver(n) != "brcmfmac":
            return n, None
    return (preferred or "wlan1"), "Nem talaltam monitor-kepes USB sticket (rtl8xxxu)!"


@app.route("/api/wifite/start", methods=["POST"])
def wifite_start():
    body = request.get_json(force=True, silent=True) or {}
    iface = body.get("iface", DEFAULT_IFACE)
    if not re.match(r"^[a-z0-9]+$", iface or ""):
        return jsonify(status="error", message="Ervenytelen interfesz nev."), 400
    # DRIVER alapjan a monitort tudo sticket valasztjuk (ne a beepitett wlan-t)
    iface, iface_note = _detect_stick_iface(iface)
    methods = body.get("methods") or {}
    flags = []
    if methods:
        # a wifite alapbol MINDENT probal; a kikapcsolt modszereket tiltjuk
        if methods.get("pmkid") is False:
            flags.append("--no-pmkid")
        if methods.get("wps") is False:
            flags.append("--no-wps")
        if methods.get("crack") is False:
            flags.append("--skip-crack")
    else:
        # kompatibilitas a regi 'mode' mezovel
        mode = body.get("mode", "")
        if mode == "wps":
            flags.append("--wps")
        elif mode == "wpa":
            flags.append("--wpa")
    if body.get("wpsTool") == "bully":
        flags.append("--bully")
    if body.get("randomMac"):
        flags.append("--random-mac")
    wl = _safe_wordlist(body.get("wordlist", ""))
    if wl:
        flags += ["--dict", wl]

    def worker():
        socketio.emit("wifite:start")

        def emit(raw, typ="info", exp=""):
            socketio.emit("wifite:output", {"raw": raw, "type": typ, "explanation": exp})

        if iface_note:
            emit("[!] " + iface_note, "warning")
        emit("[*] Interfesz: %s (driver: %s)" % (iface, _iface_driver(iface)), "info")

        # 1) Monitor mod MEGBIZHATO beallitasa — ez a flaky "egyszer talal, egyszer 0" fix.
        #    Korabban: iw set monitor utan AZONNAL indult a wifite, ellenorzes nelkul. Ha a
        #    driver/stick nem allt be, vagy a NetworkManager visszavette managed modba, a
        #    wifite managed interfeszen szkennelt -> 0 talalat. Most: NM-levalasztas +
        #    3x retry + ELLENORZES (iw dev info) + settle-sleep.
        emit(f"[*] {iface} monitor modba allitasa (iw) + ellenorzes...", "action")

        def _is_monitor():
            r = subprocess.run(["sudo", "-n", IW_PATH, "dev", iface, "info"],
                               capture_output=True, text=True)
            return "type monitor" in (r.stdout or "")

        # NetworkManager ne vegye vissza az interfeszt szkenneles kozben (best-effort)
        subprocess.run(["sudo", "-n", "nmcli", "device", "set", iface, "managed", "no"],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        mon_ok = False
        last_err = ""
        for attempt in range(1, 4):
            subprocess.run(["sudo", "-n", "airmon-ng", "check", "kill"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            step_ok = True
            for cmd in (["sudo", "-n", IP_PATH, "link", "set", iface, "down"],
                        ["sudo", "-n", IW_PATH, "dev", iface, "set", "type", "monitor"],
                        ["sudo", "-n", IP_PATH, "link", "set", iface, "up"]):
                r = subprocess.run(cmd, capture_output=True, text=True)
                if r.returncode != 0:
                    last_err = r.stderr.strip() or f"'{' '.join(cmd[3:])}' hiba"
                    emit(f"[!] {attempt}/3: {' '.join(cmd[3:])} -> {last_err}", "warning")
                    step_ok = False
                    break
            if step_ok:
                time.sleep(1.3)   # a stick/rtl8xxxu driver beallasa — enelkul flaky
                if _is_monitor():
                    emit(f"[+] {iface} monitor modban ({attempt}. probara).", "success")
                    mon_ok = True
                    break
                last_err = f"{iface} nem valt monitor modba"
                emit(f"[!] {attempt}/3: {iface} meg NEM monitor — ujraprobalom...", "warning")
            time.sleep(1.0)

        if not mon_ok:
            emit(f"[!] Nem sikerult {iface}-t monitor modba tenni 3 probabol. "
                 f"Ellenorizd: a TL-WN722N (RTL8188EUS) stick be van-e dugva es ez-e a {iface}; "
                 f"a beepitett wlan0 NEM tud monitor modot.", "error")
            socketio.emit("wifite:error", {"message": last_err or "monitor mod sikertelen (3 proba)",
                                           "hint": "wifite.err.not_installed"})
            return

        # 2) wifite a mar monitor modu eszkozzel - PTY-ben, mert a wifite TTY-t var
        #    (sima pipe-ban nem szkennel rendesen -> 0 talalat)
        import pty
        import select as _select
        argv = ["sudo", "-n", WIFITE_PATH, "-i", iface] + flags
        emit("[*] Indul a wifite (PTY): " + " ".join(argv[3:]), "action")
        master, slave = pty.openpty()
        try:
            proc = subprocess.Popen(argv, stdin=slave, stdout=slave, stderr=slave,
                                    close_fds=True, start_new_session=True, cwd="/root/work")
        except Exception as e:
            try:
                os.close(master); os.close(slave)
            except OSError:
                pass
            socketio.emit("wifite:error", {"message": str(e), "hint": "wifite.err.not_installed"})
            return
        os.close(slave)
        active["wifite"] = proc
        active["wifite_iface"] = iface
        active["wifite_master"] = master
        ansi = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07|[\x00-\x08\x0b\x0c\x0e-\x1f]")
        buf = ""
        # Flood-csokkentes: a wifite szkennelo-tablat masodpercenkent ujrarajzolja, amitol
        # a kimenet "porog". Az egymas utani AZONOS (whitespace-normalizalt) sorokat kiszurjuk.
        _last_norm = None
        _norm_ws = re.compile(r"\s+")
        while True:
            try:
                r, _, _ = _select.select([master], [], [], 0.4)
            except (OSError, ValueError):
                break
            if r:
                try:
                    data = os.read(master, 4096)
                except OSError:
                    break
                if not data:
                    break
                buf += data.decode("utf-8", "replace").replace("\r", "\n")
                while "\n" in buf:
                    line, buf = buf.split("\n", 1)
                    line = ansi.sub("", line).rstrip()
                    if not line.strip():
                        continue
                    norm = _norm_ws.sub(" ", line).strip()
                    if norm == _last_norm:
                        continue          # ismetlodo tabla-sor -> kihagyjuk
                    _last_norm = norm
                    socketio.emit("wifite:output", parse_wifite_line(line))
            elif proc.poll() is not None:
                break
        if buf.strip():
            socketio.emit("wifite:output", parse_wifite_line(ansi.sub("", buf).rstrip()))
        try:
            os.close(master)
        except OSError:
            pass
        code = proc.wait()
        active.pop("wifite", None)
        active.pop("wifite_master", None)
        socketio.emit("wifite:done", {"code": code})

    socketio.start_background_task(worker)
    return jsonify(status="started", message="Wifite elindult...")


@app.route("/api/wifite/input", methods=["POST"])
def wifite_input():
    # Billentyuzet / jel kuldese a futo wifite-nak: Ctrl+C (szkenneles leallitasa),
    # celpont-valasztas (szam), Enter.
    data = request.get_json(force=True, silent=True) or {}
    proc = active.get("wifite")
    master = active.get("wifite_master")

    if data.get("ctrl_c"):
        # VALODI SIGINT a wifite process-group-nak -> a szkenneles azonnal leall es
        # eloall a celpont-lista. A \x03 PTY-be irasa megbizhatatlan volt (nem mindig
        # valtott ki SIGINT-et), ezert kozvetlen jelzest kuldunk.
        if not proc:
            return jsonify(status="not_running"), 400
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGINT)
        except Exception:
            try:
                proc.send_signal(signal.SIGINT)
            except Exception:
                pass
        # a PTY-be is irjuk a Ctrl+C-t (egyes wifite-verziok a billentyure reagalnak)
        if master is not None:
            try:
                os.write(master, b"\x03")
            except Exception:
                pass
        return jsonify(status="sent")

    if master is None:
        return jsonify(status="not_running"), 400
    if data.get("enter"):
        payload = "\r"
    else:
        text = str(data.get("text", ""))
        payload = text if text.endswith("\n") else text + "\n"
    try:
        os.write(master, payload.encode())
        return jsonify(status="sent")
    except OSError as e:
        return jsonify(status="error", message=str(e)), 500


@app.route("/api/wifite/stop", methods=["POST"])
def wifite_stop():
    p = active.get("wifite")
    if not p:
        return jsonify(status="not_running")

    def _sig(sig):
        try:
            os.killpg(os.getpgid(p.pid), sig)
        except (ProcessLookupError, PermissionError, OSError):
            try:
                p.send_signal(sig)
            except Exception:
                pass

    def _pkill():
        # biztositek: az egesz wifite eszkozlanc leallitasa nev szerint. A gyerekek
        # (airodump-ng stb.) neha mas process-groupban futnak, igy a pgid-jel nem eri el oket.
        try:
            subprocess.run(["sudo", "-n", "pkill", "-9", "-f", "wifite"], timeout=5)
        except Exception:
            pass
        for _n in ("airodump-ng", "aireplay-ng", "aircrack-ng", "hcxdumptool", "reaver", "bully", "wash", "tshark"):
            try:
                subprocess.run(["sudo", "-n", "pkill", "-9", _n], timeout=5)
            except Exception:
                pass

    def killer():
        # VEGLEGES leallitas: SIGINT -> SIGTERM -> SIGKILL, majd pkill az egesz lancnak.
        _sig(signal.SIGINT)
        for _ in range(4):            # ~2 mp varakozas
            if p.poll() is not None:
                break
            time.sleep(0.5)
        if p.poll() is None:
            _sig(signal.SIGTERM)
            time.sleep(1.0)
        if p.poll() is None:
            _sig(signal.SIGKILL)
        _pkill()
        # WiFi visszaallitas: az audit interfeszt vissza managed-be, majd wifi-restore (wlan0 halozat vissza)
        ifc = active.get("wifite_iface")
        try:
            if ifc:
                subprocess.run(["sudo", "-n", "ip", "link", "set", ifc, "down"], timeout=10)
                subprocess.run(["sudo", "-n", IW_PATH, "dev", ifc, "set", "type", "managed"], timeout=10)
                subprocess.run(["sudo", "-n", "ip", "link", "set", ifc, "up"], timeout=10)
        except Exception:
            pass
        try:
            subprocess.run(["sudo", "-n", "/usr/local/sbin/wifi-restore"], timeout=40)
        except Exception:
            pass
        active.pop("wifite_iface", None)
        socketio.emit("wifite:output", {"raw": "[*] WiFi visszaallitva (monitor ki, halozat vissza).", "type": "action"})
        socketio.emit("wifite:restored", {})

    socketio.start_background_task(killer)
    active.pop("wifite", None)
    return jsonify(status="stopped")


# ─── Parserek (server.js 1:1) ────────────────────────────────────────
def parse_wifite_line(line):
    r = {"raw": line, "type": "info", "explanation": "", "badge": None}
    low = line.lower()
    if "scanning" in low:
        r.update(type="scan", explanation="wifite.ex.scanning")
    elif re.search(r"\d+\.\s+\w+\s+\d+\s+(WPA|WEP|WPS)", line, re.I):
        r.update(type="network", explanation="wifite.ex.network_found", badge="wifite.badge.network")
    elif "wpa handshake" in low:
        r.update(type="success", explanation="wifite.ex.handshake_captured", badge="wifite.badge.handshake")
    elif "pmkid" in low:
        r.update(type="success", explanation="wifite.ex.pmkid_captured", badge="wifite.badge.pmkid")
    elif "cracked" in low or "key:" in low:
        r.update(type="cracked", explanation="wifite.ex.cracked", badge="wifite.badge.cracked")
    elif "failed" in low or "hiba" in low:
        r.update(type="error", explanation="wifite.ex.failed")
    elif "deauth" in low:
        r.update(type="action", explanation="wifite.ex.deauth")
    elif "wps" in low:
        r.update(type="wps", explanation="wifite.ex.wps_test")
    elif "[!]" in line:
        r.update(type="warning", explanation="wifite.ex.warning")
    elif "[+]" in line:
        r.update(type="success", explanation="wifite.ex.success")
    return r


PORT_KEYS = {21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 8080, 8443}


def get_port_key(pp):
    try:
        port = int(pp.split("/")[0])
    except ValueError:
        return "nmap.port.ex.generic"
    return f"nmap.port.ex.{port}" if port in PORT_KEYS else "nmap.port.ex.generic"


SCRIPT_KEYS = {
    "http-csrf": ("warning", "nmap.badge.csrf", "nmap.ex.script.csrf"),
    "http-sql-injection": ("warning", "nmap.badge.sqli", "nmap.ex.script.sqli"),
    "http-stored-xss": ("warning", "nmap.badge.xss", "nmap.ex.script.xss"),
    "http-dombased-xss": ("warning", "nmap.badge.domxss", "nmap.ex.script.domxss"),
    "ssl-heartbleed": ("danger", "nmap.badge.bleed", "nmap.ex.script.bleed"),
    "ssl-poodle": ("danger", "nmap.badge.poodle", "nmap.ex.script.poodle"),
    "smb-vuln-ms17-010": ("danger", "nmap.badge.eternal", "nmap.ex.script.eternal"),
    "http-title": ("info", "nmap.badge.title", "nmap.ex.script.title"),
    "http-server-header": ("info", "nmap.badge.server", "nmap.ex.script.server"),
    "ssh-hostkey": ("info", "nmap.badge.sshkey", "nmap.ex.script.sshkey"),
    "ssh-auth-methods": ("info", "nmap.badge.sshauth", "nmap.ex.script.sshauth"),
    "ftp-anon": ("warning", "nmap.badge.anonftp", "nmap.ex.script.anonftp"),
    "ftp-bounce": ("warning", "nmap.badge.bounce", "nmap.ex.script.bounce"),
    "smb-security-mode": ("info", "nmap.badge.smbsec", "nmap.ex.script.smbsec"),
    "rdp-vuln-ms12-020": ("danger", "nmap.badge.rdpvuln", "nmap.ex.script.rdpvuln"),
}


def parse_nmap_script_line(line, r):
    low = line.lower()
    m = re.match(r"^\|[_]? ([\w\-]+):", line)
    if m and re.match(r"^[a-z]", m.group(1)):
        script = m.group(1).lower()
        r["type"] = "detail"
        k = SCRIPT_KEYS.get(script)
        if k:
            r["type"], r["badge"], r["explanation"] = k
        else:
            r["badge"] = script.replace("http-", "").replace("ssl-", "").replace("smb-", "").upper()[:12]
            r["explanation"] = "nmap.ex.script.generic"
            r["data"] = {"script": script}
        return
    if "error" in low or "failed" in low:
        r.update(type="warning", explanation="nmap.ex.script.error"); return
    if "found" in low and any(x in low for x in ("vulnerabilit", "injection", "xss", "csrf")):
        r.update(type="cracked", badge="nmap.badge.vuln_found", explanation="nmap.ex.script.vuln_found"); return
    if "couldn't find" in low or "not vulnerable" in low or "no vulnerability" in low:
        r.update(type="success", explanation="nmap.ex.script.not_vuln"); return
    m2 = re.search(r"CVE-\d{4}-\d+", line, re.I)
    if m2:
        r.update(type="danger", badge="CVE", explanation="nmap.ex.script.cve_found", data={"cve": m2.group(0)}); return
    r["type"] = "detail"


def parse_nmap_line(line):
    r = {"raw": line, "type": "info", "explanation": "", "badge": None}
    low = line.lower()
    if line.startswith("Nmap scan report"):
        r.update(type="host", explanation="nmap.ex.host_found", badge="nmap.badge.host")
    elif "Host is up" in line:
        lat = re.search(r"\((.*?)\)", line)
        r.update(type="success", explanation="nmap.ex.host_up", data={"latency": lat.group(1) if lat else ""})
    elif re.match(r"^\d+/tcp\s+open", line):
        parts = line.split()
        r.update(type="port-open", explanation=get_port_key(parts[0]),
                 badge="nmap.badge.port_open", data={"portProto": parts[0],
                 "service": parts[2] if len(parts) > 2 else ""})
    elif re.match(r"^\d+/tcp\s+filtered", line):
        r.update(type="port-filtered", explanation="nmap.ex.port_filtered", badge="nmap.badge.filtered")
    elif re.match(r"^\d+/tcp\s+closed", line):
        r.update(type="port-closed", explanation="nmap.ex.port_closed")
    elif "mac address" in low:
        r.update(type="mac", explanation="nmap.ex.mac_addr")
    elif "os details" in low or "running:" in low:
        r.update(type="os", explanation="nmap.ex.os_detected", badge="nmap.badge.os")
    elif "service info" in low:
        r.update(type="service", explanation="nmap.ex.service_info")
    elif line.startswith("|"):
        parse_nmap_script_line(line, r)
    return r


def build_nmap_summary(output):
    hosts = len(re.findall(r"Host is up", output))
    open_ports = len(re.findall(r"open", output))
    ips = re.findall(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", output)
    vulns, errors, seen = [], [], set()
    for line in output.split("\n"):
        low, trimmed = line.lower(), line.strip()
        if not trimmed:
            continue
        cve = re.search(r"CVE-\d{4}-\d+", trimmed, re.I)
        if cve:
            k = cve.group(0).upper()
            if k not in seen:
                seen.add(k); vulns.append(k)
            continue
        if "found" in low and any(x in low for x in ("vulnerabilit", "injection", "xss", "csrf")):
            k = trimmed[:80]
            if k not in seen:
                seen.add(k); vulns.append(trimmed)
            continue
        if re.match(r"^\|\s*(likely )?vulnerable\s*:?\s*$", low) or re.search(r"state:\s*(likely )?vulnerable", low):
            continue
        if "vulnerable" in low and "not vulnerable" not in low:
            k = trimmed[:80]
            if k not in seen:
                seen.add(k); vulns.append(trimmed)
        if trimmed.startswith("|") and ("error" in low or "failed" in low):
            errors.append(trimmed)
    seen_ip = []
    for ip in ips:
        if ip not in seen_ip:
            seen_ip.append(ip)
    return {"hosts": hosts, "openPorts": open_ports, "ips": seen_ip, "vulns": vulns, "errors": errors}


# ─── PenTest script-tar ──────────────────────────────────────────────
pt_scripts = []
pt_seq = [1]
ALLOWED_EXT = {"sh", "py", "rb"}


def _now():
    return datetime.now(timezone.utc).isoformat()


def _load_template():
    tpl = "pentest-template.sh"
    if os.path.isfile(os.path.join(UPLOADS_DIR, tpl)):
        pt_scripts.append({"id": pt_seq[0], "name": "pentest-template",
                           "description": "Teljes pentest workflow T1-T6",
                           "phase": None, "filename": tpl, "filetype": "sh",
                           "parameters": None, "author": "EthTest",
                           "created_at": _now(), "is_shared": 1})
        pt_seq[0] += 1


_load_template()


@app.route("/api/pentest/scripts")
def pt_list():
    phase = request.args.get("phase")
    return jsonify([s for s in pt_scripts if s["phase"] == phase] if phase else pt_scripts)


@app.route("/api/pentest/scripts/<int:sid>")
def pt_get(sid):
    s = next((x for x in pt_scripts if x["id"] == sid), None)
    return (jsonify(s) if s else (jsonify(error="Nem talalhato"), 404))


@app.route("/api/pentest/scripts", methods=["POST"])
def pt_upload():
    f = request.files.get("file")
    if not f:
        return jsonify(error="Fajl szukseges"), 400
    ext = f.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify(error="Csak .sh, .py, .rb engedelyezett"), 400
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", f.filename)
    fn = f"{int(time.time()*1000)}_{safe}"
    f.save(os.path.join(UPLOADS_DIR, fn))
    name = (request.form.get("name") or "").strip() or re.sub(r"\.[^.]+$", "", f.filename)
    s = {"id": pt_seq[0], "name": name, "description": request.form.get("description") or None,
         "phase": request.form.get("phase") or None, "filename": fn, "filetype": ext,
         "parameters": request.form.get("parameters") or None,
         "author": request.form.get("author") or None, "created_at": _now(), "is_shared": 1}
    pt_seq[0] += 1
    pt_scripts.append(s)
    return jsonify(s), 201


@app.route("/api/pentest/scripts/<int:sid>", methods=["DELETE"])
def pt_delete(sid):
    idx = next((i for i, x in enumerate(pt_scripts) if x["id"] == sid), -1)
    if idx == -1:
        return jsonify(error="Nem talalhato"), 404
    s = pt_scripts.pop(idx)
    fp = os.path.join(UPLOADS_DIR, s["filename"])
    if os.path.isfile(fp):
        os.unlink(fp)
    return jsonify(ok=True)


@app.route("/api/pentest/scripts/<int:sid>/content", methods=["PUT"])
def pt_content(sid):
    s = next((x for x in pt_scripts if x["id"] == sid), None)
    if not s:
        return jsonify(error="Nem talalhato"), 404
    content = (request.get_json(force=True, silent=True) or {}).get("content")
    if not isinstance(content, str):
        return jsonify(error="content szukseges"), 400
    with open(os.path.join(UPLOADS_DIR, s["filename"]), "w", encoding="utf-8") as fh:
        fh.write(content)
    return jsonify(ok=True)


BLOCKED_CMD = re.compile(r"(\bsudo\s+rm\s+-rf\s+/\b)|(\bdd\s+if=.*of=/dev/)")


def _resolve_uploads(cmd):
    return re.sub(r'(bash|python3|ruby|sh)\s+"/uploads/', rf'\1 "{UPLOADS_DIR}/', cmd)


def _spawn_pentest(terminal_id, command, emitter):
    resolved = _resolve_uploads(command)
    if BLOCKED_CMD.search(resolved):
        emitter("pentest:output", {"terminalId": terminal_id, "data": "Tiltott parancs blokkolva", "isError": True})
        emitter("pentest:done", {"terminalId": terminal_id, "exitCode": 1})
        return
    key = f"pentest_{terminal_id}"
    if active.get(key):
        active[key].terminate()
        active.pop(key, None)
    emitter("pentest:output", {"terminalId": terminal_id, "data": f"$ {command}", "isError": False})

    def worker():
        try:
            # cwd = az uploads mappa, hogy a feltöltött / minta fájlokat SIMA NÉVVEL megtalálja
            proc = subprocess.Popen([BASH_PATH, "-c", resolved], stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE, text=True, bufsize=1,
                                    cwd=UPLOADS_DIR)
        except Exception as e:
            emitter("pentest:output", {"terminalId": terminal_id, "data": str(e), "isError": True})
            emitter("pentest:done", {"terminalId": terminal_id, "exitCode": 1})
            return
        active[key] = proc

        def read_err():
            for line in proc.stderr:
                if line.rstrip("\n"):
                    emitter("pentest:output", {"terminalId": terminal_id, "data": line.rstrip("\n"), "isError": True})
        socketio.start_background_task(read_err)
        for line in proc.stdout:
            if line.rstrip("\n"):
                emitter("pentest:output", {"terminalId": terminal_id, "data": line.rstrip("\n"), "isError": False})
        code = proc.wait()
        active.pop(key, None)
        emitter("pentest:done", {"terminalId": terminal_id, "exitCode": code if code is not None else 0})

    socketio.start_background_task(worker)


@app.route("/api/pentest/run", methods=["POST"])
def pt_run():
    body = request.get_json(force=True, silent=True) or {}
    tid, cmd = body.get("terminalId"), body.get("command")
    if not tid or not isinstance(cmd, str):
        return jsonify(error="terminalId es command kotelezo"), 400
    _spawn_pentest(tid, cmd, socketio.emit)
    return jsonify(ok=True, terminalId=tid)


@app.route("/api/pentest/kill", methods=["POST"])
def pt_kill():
    tid = (request.get_json(force=True, silent=True) or {}).get("terminalId")
    key = f"pentest_{tid}"
    if active.get(key):
        active[key].terminate()
        active.pop(key, None)
        socketio.emit("pentest:done", {"terminalId": tid, "exitCode": -1})
    return jsonify(ok=True)


@app.route("/api/pentest-queries/<int:qid>", methods=["PUT"])
def pt_queries(qid):
    if qid < 1 or qid > 6:
        return jsonify(error="invalid id"), 400
    content = (request.get_json(force=True, silent=True) or {}).get("content")
    if not isinstance(content, str):
        return jsonify(error="content required"), 400
    import json
    try:
        json.loads(content)
    except Exception:
        return jsonify(error="invalid JSON"), 400
    with open(os.path.join(PUBLIC_DIR, "pentest-queries", f"t{qid}.json"), "w", encoding="utf-8") as fh:
        fh.write(content)
    return jsonify(ok=True)


@app.route("/api/pentest-doc/<int:did>", methods=["PUT"])
def pt_doc(did):
    if did < 1 or did > 6:
        return jsonify(error="invalid id"), 400
    content = (request.get_json(force=True, silent=True) or {}).get("content")
    if not isinstance(content, str):
        return jsonify(error="content required"), 400
    import json
    try:
        json.loads(content)
    except Exception as e:
        return jsonify(error="invalid JSON: " + str(e)), 400
    with open(os.path.join(PUBLIC_DIR, "pentest-docs", f"t{did}.json"), "w", encoding="utf-8") as fh:
        fh.write(content)
    return jsonify(ok=True)


@app.route("/api/pentest/findings")
def pt_findings():
    script, t = request.args.get("script"), request.args.get("t")
    if not script or not t:
        return jsonify(lines=[])
    if not re.match(r"^[\w\-]+$", script) or not re.match(r"^[1-6]$", t):
        return jsonify(error="invalid"), 400
    exact = os.path.join("/tmp", f"{script}_t{t}.findings")
    fp = exact
    if not os.path.isfile(exact):
        try:
            cands = [f for f in os.listdir("/tmp")
                     if f.endswith(f"_t{t}.findings") and script.lower() in f.lower()]
            if cands:
                fp = os.path.join("/tmp", cands[0])
        except OSError:
            pass
    try:
        with open(fp, encoding="utf-8") as fh:
            return jsonify(lines=[l for l in fh.read().split("\n") if l.strip()])
    except OSError:
        return jsonify(lines=[])


# ─── Találatok: az összes /tmp/*_t*.findings aggregálva ──────────────
@app.route("/api/findings")
def all_findings():
    import glob
    out = []
    try:
        paths = sorted(glob.glob("/tmp/*_t*.findings"),
                       key=lambda p: -os.path.getmtime(p))
    except OSError:
        paths = []
    for p in paths[:50]:
        n = os.path.basename(p)
        m = re.match(r"^(.*)_t([1-6])\.findings$", n)
        try:
            with open(p, encoding="utf-8") as fh:
                lines = [l for l in fh.read().split("\n") if l.strip()]
        except OSError:
            continue
        out.append({"name": n,
                    "script": m.group(1) if m else n,
                    "t": m.group(2) if m else "",
                    "lines": lines[:200]})
    return jsonify(out)


# ─── Bluetooth / BLE felderítés (grácisan lebomlik, ha nincs adapter) ─
def _bt_available():
    import shutil
    return bool(shutil.which("bluetoothctl"))


def _bt_env():
    # A Flask a Kali-konténerben fut; a bluetoothctl a HOST bluetoothd-jét a host
    # D-Bus socketjén éri el. Előbb a (bekötött) /run/dbus, különben a --pid=host miatt
    # elérhető /proc/1/root/run/dbus. Macen egyik sincs -> változatlan env (grácis).
    env = os.environ.copy()
    for cand in ("/run/dbus/system_bus_socket", "/proc/1/root/run/dbus/system_bus_socket"):
        if os.path.exists(cand):
            env["DBUS_SYSTEM_BUS_ADDRESS"] = "unix:path=" + cand
            break
    return env


@app.route("/api/bt/status")
def bt_status():
    if not _bt_available():
        return jsonify(available=False, adapters=[],
                       message="A bluetoothctl nem található (Linux + Bluetooth-adapter kell).")
    adapters = []
    try:
        out = subprocess.run(["bluetoothctl", "list"], env=_bt_env(),
                             capture_output=True, text=True, timeout=5).stdout
        for line in out.splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[0] == "Controller":
                adapters.append({"mac": parts[1], "name": " ".join(parts[2:]).replace("[default]", "").strip()})
    except Exception as e:
        return jsonify(available=False, adapters=[], message=str(e))
    return jsonify(available=True, adapters=adapters)


@app.route("/api/bt/scan", methods=["POST"])
def bt_scan():
    if not _bt_available():
        return jsonify(error="unavailable",
                       message="A Bluetooth nem elérhető ezen a gépen (Linux + adapter kell).")
    try:
        dur = int((request.get_json(silent=True) or {}).get("seconds", 8))
    except Exception:
        dur = 8
    dur = max(3, min(30, dur))
    devices = {}
    try:
        btenv = _bt_env()
        subprocess.run(["bluetoothctl", "power", "on"], env=btenv,
                       capture_output=True, text=True, timeout=5)
        subprocess.run(["bluetoothctl", "--timeout", str(dur), "scan", "on"], env=btenv,
                       capture_output=True, text=True, timeout=dur + 8)
        out = subprocess.run(["bluetoothctl", "devices"], env=btenv,
                             capture_output=True, text=True, timeout=6).stdout
        for line in out.splitlines():
            parts = line.split(maxsplit=2)
            if len(parts) >= 2 and parts[0] == "Device":
                mac = parts[1]
                devices[mac] = {"mac": mac, "name": parts[2] if len(parts) > 2 else ""}
    except subprocess.TimeoutExpired:
        pass
    except Exception as e:
        return jsonify(error="scan_failed", message=str(e))
    return jsonify(devices=list(devices.values()))


# ─── Webapp-vizsgálat (whatweb / nikto / sqlmap, streamelt kimenet) ──
WEBAPP_TOOLS = {
    "whatweb": {"bin": "whatweb", "label": "WhatWeb — ujjlenyomat",
                "args": lambda t: ["whatweb", "-a", "3", t]},
    "nikto":   {"bin": "nikto", "label": "Nikto — sérülékenység-szken",
                "args": lambda t: ["nikto", "-h", t]},
    "sqlmap":  {"bin": "sqlmap", "label": "sqlmap — SQLi-teszt",
                "args": lambda t: ["sqlmap", "-u", t, "--batch", "--crawl=1"]},
}


def _valid_webtarget(t):
    if not t or len(t) > 2048:
        return False
    if re.search(r"[\s;&|`$><\\\"']", t):
        return False
    return bool(re.match(r"^(https?://)?[\w.\-]+(:\d+)?(/[\w.\-/?=&%#+~:@!,;*']*)?$", t))


def _run_webapp(tool, target):
    import shutil
    spec = WEBAPP_TOOLS.get(tool)
    if not spec:
        socketio.emit("webapp:error", {"message": "ismeretlen eszköz"})
        return
    binp = shutil.which(spec["bin"])
    if not binp:
        socketio.emit("webapp:error", {
            "message": f"A(z) {spec['bin']} nincs telepítve (Kali konténer / apt).", "tool": tool})
        return
    argv = spec["args"](target)
    argv[0] = binp

    def worker():
        try:
            proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("webapp:error", {"message": str(e)})
            return
        active["webapp"] = proc
        socketio.emit("webapp:start", {"tool": tool, "target": target})
        for line in proc.stdout:
            if line.strip():
                socketio.emit("webapp:output", {"raw": line.rstrip("\n"), "type": "out"})
        code = proc.wait()
        active.pop("webapp", None)
        socketio.emit("webapp:done", {"code": code})
    socketio.start_background_task(worker)


@app.route("/api/webapp/tools")
def webapp_tools():
    import shutil
    return jsonify([{"key": k, "label": v["label"], "installed": bool(shutil.which(v["bin"]))}
                    for k, v in WEBAPP_TOOLS.items()])


@app.route("/api/webapp/scan", methods=["POST"])
def webapp_scan():
    body = request.get_json(force=True, silent=True) or {}
    tool = body.get("tool", "whatweb")
    target = (body.get("target") or "").strip()
    if tool not in WEBAPP_TOOLS:
        return jsonify(error="ismeretlen eszköz"), 400
    if not _valid_webtarget(target):
        return jsonify(error="érvénytelen cél (http/https URL vagy host kell)"), 400
    _run_webapp(tool, target)
    return jsonify(status="started")


@app.route("/api/webapp/stop", methods=["POST"])
def webapp_stop():
    p = active.get("webapp")
    if p:
        try:
            p.send_signal(signal.SIGINT)
        except Exception:
            pass
        active.pop("webapp", None)
        socketio.emit("webapp:done", {"code": None, "stopped": True})
        return jsonify(status="stopped")
    return jsonify(status="not_running")


# ─── Android / mobil (ADB: eszköz-infó, csomagok, logcat) ────────────
ANDROID_ACTIONS = {
    "info":     lambda s: ["adb", "-s", s, "shell", "getprop"],
    "packages": lambda s: ["adb", "-s", s, "shell", "pm", "list", "packages", "-3"],
    "logcat":   lambda s: ["adb", "-s", s, "logcat", "-d", "-t", "200"],
}


def _adb_available():
    import shutil
    return bool(shutil.which("adb"))


@app.route("/api/android/devices")
def android_devices():
    if not _adb_available():
        return jsonify(available=False, devices=[],
                       message="Az adb nincs telepítve (android-platform-tools kell).")
    devices = []
    try:
        out = subprocess.run(["adb", "devices", "-l"],
                             capture_output=True, text=True, timeout=8).stdout
        for line in out.splitlines()[1:]:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            serial = parts[0]
            state = parts[1] if len(parts) > 1 else ""
            model = ""
            for p in parts[2:]:
                if p.startswith("model:"):
                    model = p.split(":", 1)[1]
            devices.append({"serial": serial, "state": state, "model": model})
    except Exception as e:
        return jsonify(available=True, devices=[], message=str(e))
    return jsonify(available=True, devices=devices)


@app.route("/api/android/action", methods=["POST"])
def android_action():
    if not _adb_available():
        return jsonify(error="Az adb nem elérhető ezen a gépen.")
    body = request.get_json(force=True, silent=True) or {}
    action = body.get("action")
    serial = (body.get("serial") or "").strip()
    if action not in ANDROID_ACTIONS:
        return jsonify(error="ismeretlen művelet"), 400
    if not re.match(r"^[\w.:\-]+$", serial):
        return jsonify(error="érvénytelen eszköz-azonosító"), 400
    argv = ANDROID_ACTIONS[action](serial)

    def worker():
        import shutil
        argv[0] = shutil.which("adb") or "adb"
        try:
            proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("android:error", {"message": str(e)})
            return
        active["android"] = proc
        socketio.emit("android:start", {"action": action, "serial": serial})
        n = 0
        for line in proc.stdout:
            if line.strip():
                n += 1
                if n <= 2000:
                    socketio.emit("android:output", {"raw": line.rstrip("\n"), "type": "out"})
        code = proc.wait()
        active.pop("android", None)
        socketio.emit("android:done", {"code": code})
    socketio.start_background_task(worker)
    return jsonify(status="started")


@app.route("/api/android/stop", methods=["POST"])
def android_stop():
    p = active.get("android")
    if p:
        try:
            p.terminate()
        except Exception:
            pass
        active.pop("android", None)
        socketio.emit("android:done", {"code": None, "stopped": True})
        return jsonify(status="stopped")
    return jsonify(status="not_running")


# ─── RFID-NFC / SDR (rádió) felderítés (hardverfüggő, grácis) ────────
RADIO_TOOLS = {
    "nfc": {"bin": "nfc-list", "label": "NFC / RFID — olvasás",
            "hint": "libnfc + olvasó (PN532/ACR122)", "args": ["nfc-list"]},
    "sdr": {"bin": "rtl_433", "label": "SDR — 433 MHz figyelés (20s)",
            "hint": "RTL-SDR dongle", "args": ["rtl_433", "-T", "20"]},
}


def _radio_run(kind):
    import shutil
    spec = RADIO_TOOLS.get(kind)
    if not spec:
        socketio.emit("radio:error", {"message": "ismeretlen típus"})
        return
    binp = shutil.which(spec["bin"])
    if not binp:
        socketio.emit("radio:error", {
            "message": f"A(z) {spec['bin']} nincs telepítve vagy nincs hardver.", "kind": kind})
        return
    argv = list(spec["args"])
    argv[0] = binp

    def worker():
        try:
            proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("radio:error", {"message": str(e)})
            return
        active["radio"] = proc
        socketio.emit("radio:start", {"kind": kind})
        for line in proc.stdout:
            if line.strip():
                socketio.emit("radio:output", {"raw": line.rstrip("\n"), "type": "out"})
        code = proc.wait()
        active.pop("radio", None)
        socketio.emit("radio:done", {"code": code})
    socketio.start_background_task(worker)


@app.route("/api/radio/status")
def radio_status():
    import shutil
    tools = [{"key": k, "label": v["label"], "hint": v["hint"],
              "installed": bool(shutil.which(v["bin"]))} for k, v in RADIO_TOOLS.items()]
    extra = {b: bool(shutil.which(b)) for b in ["proxmark3", "hackrf_info", "rtl_test", "rtl_eeprom"]}
    return jsonify(tools=tools, extra=extra)


@app.route("/api/radio/scan", methods=["POST"])
def radio_scan():
    body = request.get_json(force=True, silent=True) or {}
    kind = body.get("kind")
    if kind not in RADIO_TOOLS:
        return jsonify(error="ismeretlen típus"), 400
    _radio_run(kind)
    return jsonify(status="started")


@app.route("/api/radio/stop", methods=["POST"])
def radio_stop():
    p = active.get("radio")
    if p:
        try:
            p.terminate()
        except Exception:
            pass
        active.pop("radio", None)
        socketio.emit("radio:done", {"code": None, "stopped": True})
        return jsonify(status="stopped")
    return jsonify(status="not_running")


# ─── Modul-toolok telepítése a Kali-konténerbe (Bővítmények panel) ───
MODULE_PKG = {
    "bt": "bluez",
    "android": "adb",
    "nfc": "libnfc-bin",
    "sdr": "rtl-433 rtl-sdr",
}
MODULE_BIN = {"bt": "bluetoothctl", "android": "adb", "nfc": "nfc-list", "sdr": "rtl_433"}


@app.route("/api/module/status")
def module_status():
    import shutil
    return jsonify({k: bool(shutil.which(b)) for k, b in MODULE_BIN.items()})


@app.route("/api/module/install", methods=["POST"])
def module_install():
    body = request.get_json(force=True, silent=True) or {}
    mod = body.get("module", "")
    if mod not in MODULE_PKG:
        return jsonify(error="ismeretlen modul"), 400
    if active.get("mod_install") and active["mod_install"].poll() is None:
        return jsonify(error="busy", message="Egy telepítés már fut."), 409
    pkg = MODULE_PKG[mod]

    def worker():
        socketio.emit("module:start", {"module": mod})
        socketio.emit("module:output", {"module": mod, "line": f"$ apt-get install -y {pkg}  (Kali konténer)"})
        cmd = ("export DEBIAN_FRONTEND=noninteractive; "
               "echo '[*] apt-get update (csomaglista)...'; apt-get update -qq 2>&1 | tail -3; "
               f"echo '[*] apt-get install {pkg}...'; apt-get install -y {pkg} 2>&1")
        try:
            proc = subprocess.Popen([BASH_PATH, "-lc", cmd], stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True, bufsize=1)
        except Exception as e:
            socketio.emit("module:output", {"module": mod, "line": f"[!] Hiba: {e}"})
            socketio.emit("module:done", {"module": mod, "code": -1})
            return
        active["mod_install"] = proc
        for line in proc.stdout:
            if line.strip():
                socketio.emit("module:output", {"module": mod, "line": line.rstrip("\n")})
        code = proc.wait()
        active.pop("mod_install", None)
        socketio.emit("module:output", {"module": mod, "line": f"[telepítés kész, kód={code}]"})
        socketio.emit("module:done", {"module": mod, "code": code})
    socketio.start_background_task(worker)
    return jsonify(status="started")


# ─── Socket.IO: pentest run/kill ─────────────────────────────────────
@socketio.on("pentest:run")
def on_pt_run(data):
    tid, cmd = (data or {}).get("terminalId"), (data or {}).get("command")
    if not isinstance(cmd, str):
        return
    _spawn_pentest(tid, cmd, socketio.emit)


@socketio.on("pentest:kill")
def on_pt_kill(data):
    tid = (data or {}).get("terminalId")
    key = f"pentest_{tid}"
    if active.get(key):
        active[key].terminate()
        active.pop(key, None)
    socketio.emit("pentest:done", {"terminalId": tid, "exitCode": -1})


@app.route("/api/shutdown", methods=["POST"])
def shutdown():
    """Bezárja a kiosk böngészőt (host PID namespace megosztott --pid=host miatt),
    majd leállítja a szervert → a podman run véget ér → a launcher wifi-restore trap-je lefut."""
    def worker():
        time.sleep(0.4)
        # a kiosk Chromium egyedi --user-data-dir alapján (ethtest-chromium)
        for pat in ("ethtest-chromium", "--class=EthTest"):
            try:
                subprocess.run(["pkill", "-f", pat], timeout=5)
            except Exception:
                pass
        time.sleep(0.3)
        os._exit(0)
    socketio.start_background_task(worker)
    return jsonify(ok=True)


# ═══════════════════════════════════════════════════════════════════
#  VÉDELEM: telepítés / be-ki kapcsolás a HOST uConsole-on (nsenter)
#  Az app a Kali konténerben fut (--privileged --pid=host), de a védelmi
#  eszközök a HOST rendszert védik, ezért nsenter -t 1-gyel a host
#  névtereiben, rootként futtatjuk. A parancsok FIX allowlist (nincs
#  szabad szöveg -> nincs parancsinjekció).
# ═══════════════════════════════════════════════════════════════════
DEFENSE_CMDS = {
    "kismet":    {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y kismet",
                  "enable":  "systemctl enable --now kismet 2>/dev/null; echo 'Kismet kesz. Kezi inditas: kismet -c wlan1'"},
    "macchanger":{"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y macchanger",
                  "enable":  "ip link set @IFACE@ down 2>/dev/null; macchanger -r @IFACE@ 2>&1 | tail -4; "
                             "ip link set @IFACE@ up 2>/dev/null; echo '[+] Veletlen MAC beallitva (@IFACE@).'",
                  "disable": "ip link set @IFACE@ down 2>/dev/null; macchanger -p @IFACE@ 2>&1 | tail -3; "
                             "ip link set @IFACE@ up 2>/dev/null; echo '[+] Eredeti (gyari) MAC visszaallitva (@IFACE@).'"},
    "ufw":       {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y ufw",
                  "enable":  "ufw --force default deny incoming; ufw --force default allow outgoing; ufw --force enable; ufw status verbose",
                  "disable": "ufw --force disable"},
    "fail2ban":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban",
                  "enable":  "systemctl enable --now fail2ban; systemctl --no-pager status fail2ban | head -6",
                  "disable": "systemctl disable --now fail2ban"},
    "suricata":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y suricata",
                  "enable":  "suricata-update || true; systemctl enable --now suricata; echo 'Suricata bekapcsolva.'",
                  "disable": "systemctl disable --now suricata"},
    "arpwatch":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y arpwatch",
                  "enable":  "systemctl enable --now arpwatch; echo 'arpwatch bekapcsolva.'",
                  "disable": "systemctl disable --now arpwatch"},
    "wireguard": {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y wireguard",
                  "enable":  "echo 'WireGuard telepitve. Eloszor /etc/wireguard/wg0.conf kell, utana: systemctl enable --now wg-quick@wg0'"},
    "dnscrypt":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y dnscrypt-proxy",
                  "enable":  "systemctl enable --now dnscrypt-proxy; echo 'dnscrypt-proxy bekapcsolva.'",
                  "disable": "systemctl disable --now dnscrypt-proxy"},
    "lynis":     {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y lynis",
                  "enable":  "lynis audit system --quick --no-colors 2>&1 | tail -45"},
    "apparmor":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y apparmor apparmor-utils apparmor-profiles",
                  "enable":  "systemctl enable --now apparmor; aa-status 2>/dev/null | head -6",
                  "disable": "systemctl disable --now apparmor"},
    "firejail":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y firejail",
                  "enable":  "echo 'firejail telepitve. Hasznalat: firejail firefox'"},
    "unattended":{"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades",
                  "enable":  "systemctl enable --now unattended-upgrades; echo 'Auto biztonsagi frissites bekapcsolva.'",
                  "disable": "systemctl disable --now unattended-upgrades"},
    "auditd":    {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y auditd",
                  "enable":  "systemctl enable --now auditd; echo 'auditd bekapcsolva.'",
                  "disable": "systemctl disable --now auditd"},
    "rkhunter":  {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y rkhunter",
                  "enable":  "rkhunter --update || true; rkhunter --check --sk 2>&1 | tail -45"},
    "chkrootkit":{"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y chkrootkit",
                  "enable":  "chkrootkit 2>&1 | tail -45"},
    "aide":      {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y aide",
                  "enable":  "echo '[*] AIDE adatbazis inicializalas (ez percekig tarthat)...'; (aideinit -y -f 2>&1 || aideinit 2>&1) | tail -25"},
    "clamav":    {"install": "DEBIAN_FRONTEND=noninteractive apt-get install -y clamav clamav-daemon",
                  "enable":  "systemctl enable --now clamav-freshclam; echo 'ClamAV kesz. Vizsgalat: clamscan -r /home'",
                  "disable": "systemctl disable --now clamav-freshclam"},
}
# key -> (dpkg csomag a telepitettseg-ellenorzeshez, systemd szolgaltatas vagy None)
DEFENSE_SVC = {
    "kismet": ("kismet", None), "macchanger": ("macchanger", None),
    "ufw": ("ufw", "ufw"), "fail2ban": ("fail2ban", "fail2ban"),
    "suricata": ("suricata", "suricata"), "arpwatch": ("arpwatch", "arpwatch"),
    "wireguard": ("wireguard", None), "dnscrypt": ("dnscrypt-proxy", "dnscrypt-proxy"),
    "lynis": ("lynis", None), "apparmor": ("apparmor", "apparmor"),
    "firejail": ("firejail", None), "unattended": ("unattended-upgrades", "unattended-upgrades"),
    "auditd": ("auditd", "auditd"), "rkhunter": ("rkhunter", None),
    "chkrootkit": ("chkrootkit", None), "aide": ("aide", None),
    "clamav": ("clamav", "clamav-freshclam"),
}


def _nsenter_host(sh_cmd):
    """A host névtereiben, rootként futó bash -lc parancs (nsenter -t 1)."""
    return ["nsenter", "-t", "1", "-m", "-u", "-i", "-n", "-p", "--", "bash", "-lc", sh_cmd]


# Ezek az eszközök a host Debian tárolóiban NINCSENEK, de a Kali KONTÉNERBEN igen
# (az pedig most perzisztens + --net=host/--privileged, így a valós interfészeken működnek).
# Ezeket a konténerbe telepítjük (nsenter nélkül), a program gombjáról.
DEFENSE_IN_CONTAINER = {"kismet", "suricata", "dnscrypt"}
DEFENSE_CMDS_CONTAINER = {
    "kismet": {
        "install": "DEBIAN_FRONTEND=noninteractive apt-get install -y kismet",
        # wlan1 monitor modba (mint a wifite), majd kismet hatterben
        "enable": ("airmon-ng check kill >/dev/null 2>&1; "
                   "ip link set @IFACE@ down 2>/dev/null; iw dev @IFACE@ set type monitor 2>/dev/null; "
                   "ip link set @IFACE@ up 2>/dev/null; "
                   "setsid sh -c 'kismet -c @IFACE@ --no-ncurses' >/tmp/kismet.log 2>&1 & "
                   "sleep 2; echo '[+] Kismet elindult (@IFACE@ monitor) — webes UI: http://localhost:2501'; "
                   "tail -n 6 /tmp/kismet.log 2>/dev/null"),
        "disable": "pkill -x kismet 2>/dev/null; sleep 1; echo '[+] Kismet leallitva.'",
    },
    "suricata": {
        "install": "DEBIAN_FRONTEND=noninteractive apt-get install -y suricata",
        "enable": ("echo '[*] Suricata szabalyok frissitese...'; suricata-update 2>&1 | tail -3; "
                   "setsid sh -c 'suricata -i @IFACE@' >/tmp/suricata.log 2>&1 & "
                   "sleep 2; echo '[+] Suricata elindult (@IFACE@).'; tail -n 6 /tmp/suricata.log 2>/dev/null"),
        "disable": "pkill -x suricata 2>/dev/null; sleep 1; echo '[+] Suricata leallitva.'",
    },
    "dnscrypt": {
        "install": "DEBIAN_FRONTEND=noninteractive apt-get install -y dnscrypt-proxy",
        "enable": ("setsid sh -c 'dnscrypt-proxy -config /etc/dnscrypt-proxy/dnscrypt-proxy.toml' "
                   ">/tmp/dnscrypt.log 2>&1 & "
                   "sleep 2; echo '[+] dnscrypt-proxy elindult.'; tail -n 8 /tmp/dnscrypt.log 2>/dev/null"),
        "disable": "pkill -x dnscrypt-proxy 2>/dev/null; sleep 1; echo '[+] dnscrypt-proxy leallitva.'",
    },
}
# a status-hoz: konténeres eszközök csomagneve (dpkg/apt-cache) és futo binaris (pgrep)
DEFENSE_CONTAINER_PKG = {"kismet": "kismet", "suricata": "suricata", "dnscrypt": "dnscrypt-proxy"}
DEFENSE_CONTAINER_BIN = {"kismet": "kismet", "suricata": "suricata", "dnscrypt": "dnscrypt-proxy"}


# Minden védelmi eszköz TÍPUSA (ettől függ, mit csinálnak a gombok):
#  service = valódi be/ki (szolgáltatás v. háttérfolyamat)
#  action  = egyszeri művelet oda-vissza (pl. MAC csere)
#  scan    = lefuttat egy vizsgálatot és kiírja az eredményt
#  manual  = kézi konfiguráció kell (csak útmutató + másolás)
DEFENSE_KIND = {
    "kismet": "service", "suricata": "service", "dnscrypt": "service",
    "ufw": "service", "fail2ban": "service", "arpwatch": "service",
    "apparmor": "service", "unattended": "service", "auditd": "service", "clamav": "service",
    "macchanger": "action",
    "lynis": "scan", "rkhunter": "scan", "chkrootkit": "scan", "aide": "scan",
    "wireguard": "manual", "firejail": "manual",
}


def _def_cmds(key):
    if key in DEFENSE_IN_CONTAINER:
        return DEFENSE_CMDS_CONTAINER.get(key, {})
    return DEFENSE_CMDS.get(key, {})


def _def_argv(key, sh_cmd):
    # konténeres eszköz -> közvetlen bash (az app a konténerben fut); host eszköz -> nsenter
    if key in DEFENSE_IN_CONTAINER:
        return [BASH_PATH, "-lc", sh_cmd]
    return _nsenter_host(sh_cmd)


def _def_out(key, sh_cmd, timeout=15):
    try:
        r = subprocess.run(_def_argv(key, sh_cmd), capture_output=True, text=True, timeout=timeout)
        return (r.stdout or "").strip()
    except Exception:
        return ""


@app.route("/api/defense/status")
def defense_status():
    key = request.args.get("key", "")
    sv = DEFENSE_SVC.get(key)
    if not sv:
        return jsonify(error="unknown"), 400
    in_ct = key in DEFENSE_IN_CONTAINER
    pkg = DEFENSE_CONTAINER_PKG[key] if in_ct else sv[0]
    svc = None if in_ct else sv[1]   # konténerben nincs systemd-szolgáltatás
    try:
        inst = subprocess.run(_def_argv(key, f"dpkg-query -W -f='${{Status}}' {pkg} 2>/dev/null"),
                              capture_output=True, text=True, timeout=20)
        installed = "install ok installed" in (inst.stdout or "")
    except Exception:
        installed = False
    # elérhető-e a csomag a tárolóból (ha nem telepített).
    # Konténeres eszközök: tudjuk, hogy a Kali repóban megvannak -> mindig elérhető.
    available = True
    if not installed and not in_ct:
        cand = _def_out(key, f"apt-cache policy {pkg} 2>/dev/null | awk '/Candidate:/{{print $2}}'")
        available = bool(cand) and cand not in ("(none)", "none")
    active_s = enabled_s = None
    has_svc = False
    if in_ct:
        # konténeres eszköz: "aktív" = fut-e a folyamat (pgrep), be/ki kapcsolható
        has_svc = True
        if installed:
            binn = DEFENSE_CONTAINER_BIN.get(key, pkg)
            running = _def_out(key, f"pgrep -x {binn} >/dev/null 2>&1 && echo 1 || echo 0") == "1"
            active_s = "active" if running else "inactive"
    elif svc:
        has_svc = True
        try:
            a = subprocess.run(_nsenter_host(f"systemctl is-active {svc} 2>/dev/null"),
                               capture_output=True, text=True, timeout=20)
            e = subprocess.run(_nsenter_host(f"systemctl is-enabled {svc} 2>/dev/null"),
                               capture_output=True, text=True, timeout=20)
            active_s = (a.stdout or "").strip()
            enabled_s = (e.stdout or "").strip()
        except Exception:
            pass
    d = _def_cmds(key)
    return jsonify(installed=installed, active=active_s, enabled=enabled_s, available=available,
                   has_svc=has_svc, has_enable=("enable" in d), has_disable=("disable" in d),
                   in_container=in_ct, kind=DEFENSE_KIND.get(key, "service"),
                   needs_iface=(key in ("kismet", "suricata", "macchanger")))


@app.route("/api/defense/run", methods=["POST"])
def defense_run():
    body = request.get_json(force=True, silent=True) or {}
    key = body.get("key", "")
    action = body.get("action", "")
    d = _def_cmds(key)
    if not d or action not in ("install", "enable", "disable"):
        return jsonify(error="unknown"), 400
    cmd = d.get(action)
    if not cmd:
        return jsonify(error="no_action"), 400
    if active.get("defense") and active["defense"].poll() is None:
        return jsonify(error="busy", message="Egy muvelet mar fut, vard meg."), 409

    # opcionális interfész-paraméter (kismet/suricata); csak biztonsagos nevet engedunk
    iface = str(body.get("iface", "") or "").strip()
    if not re.match(r"^[a-z0-9]{1,15}$", iface):
        iface = DEFAULT_IFACE
    cmd = cmd.replace("@IFACE@", iface)

    run_cmd = cmd
    if action == "install":
        run_cmd = ("echo '[*] apt-get update...'; apt-get update -qq 2>&1 | tail -3; " + cmd)

    def worker():
        socketio.emit("defense:start", {"key": key, "action": action})
        loc = "konténer" if key in DEFENSE_IN_CONTAINER else "host"
        socketio.emit("defense:output", {"raw": f"$ [{key} · {action} · {loc}] {cmd}", "type": "action"})
        try:
            proc = subprocess.Popen(_def_argv(key, run_cmd),
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("defense:output", {"raw": f"[!] Hiba: {e}", "type": "error"})
            socketio.emit("defense:done", {"key": key, "action": action, "code": -1})
            return
        active["defense"] = proc
        try:
            for line in proc.stdout:
                socketio.emit("defense:output", {"raw": line.rstrip("\n"), "type": "info"})
        except Exception:
            pass
        code = proc.wait()
        active.pop("defense", None)
        socketio.emit("defense:output",
                      {"raw": f"[+] Kesz (kilepesi kod: {code}).",
                       "type": "success" if code == 0 else "warning"})
        socketio.emit("defense:done", {"key": key, "action": action, "code": code})

    socketio.start_background_task(worker)
    return jsonify(status="started")


@app.route("/api/defense/stop", methods=["POST"])
def defense_stop():
    p = active.get("defense")
    if not p:
        return jsonify(status="not_running")
    try:
        p.terminate()
    except Exception:
        pass
    active.pop("defense", None)
    return jsonify(status="stopped")


# ═══════════════════════════════════════════════════════════════════
#  NAPLÓ: a lényeges eredmények mentése/visszanézése a programon belül.
#  Perzisztens tárolás a sync-fán KÍVÜL (~/kali/ethtest-data/naplo), hogy
#  a deploy (rsync --delete) ne törölje. Minden bejegyzés egy JSON fájl.
# ═══════════════════════════════════════════════════════════════════
NAPLO_DIR = os.environ.get("NAPLO_DIR",
                           os.path.join(os.path.dirname(BASE_DIR), "ethtest-data", "naplo"))


def _ensure_naplo():
    try:
        os.makedirs(NAPLO_DIR, exist_ok=True)
    except OSError:
        pass


def _naplo_path(eid):
    if not re.match(r"^[A-Za-z0-9_-]+$", eid or ""):
        return None
    return os.path.join(NAPLO_DIR, eid + ".json")


@app.route("/api/naplo")
def naplo_list():
    _ensure_naplo()
    items = []
    try:
        for fn in os.listdir(NAPLO_DIR):
            if not fn.endswith(".json"):
                continue
            try:
                with open(os.path.join(NAPLO_DIR, fn), encoding="utf-8") as fh:
                    d = json.load(fh)
                items.append({"id": d.get("id"), "name": d.get("name"),
                              "type": d.get("type"), "created": d.get("created"),
                              "note": (d.get("note") or "")[:140]})
            except Exception:
                continue
    except OSError:
        pass
    items.sort(key=lambda x: (x.get("created") or ""), reverse=True)
    return jsonify(items)


@app.route("/api/naplo/<eid>")
def naplo_get(eid):
    p = _naplo_path(eid)
    if not p or not os.path.isfile(p):
        return jsonify(error="not_found"), 404
    try:
        with open(p, encoding="utf-8") as fh:
            return jsonify(json.load(fh))
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route("/api/naplo", methods=["POST"])
def naplo_create():
    _ensure_naplo()
    b = request.get_json(force=True, silent=True) or {}
    name = (str(b.get("name", "")).strip() or "Névtelen")[:200]
    typ = str(b.get("type", "manual"))[:20]
    note = str(b.get("note", ""))
    content = str(b.get("content", ""))
    eid = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + os.urandom(2).hex()
    entry = {"id": eid, "name": name, "type": typ,
             "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
             "note": note, "content": content}
    try:
        with open(os.path.join(NAPLO_DIR, eid + ".json"), "w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=1)
    except OSError as e:
        return jsonify(error=str(e)), 500
    return jsonify(ok=True, id=eid)


@app.route("/api/naplo/<eid>", methods=["PUT"])
def naplo_update(eid):
    p = _naplo_path(eid)
    if not p or not os.path.isfile(p):
        return jsonify(error="not_found"), 404
    b = request.get_json(force=True, silent=True) or {}
    try:
        with open(p, encoding="utf-8") as fh:
            entry = json.load(fh)
        if "name" in b:
            entry["name"] = (str(b["name"]).strip()[:200] or entry.get("name"))
        if "note" in b:
            entry["note"] = str(b["note"])
        if "content" in b:
            entry["content"] = str(b["content"])
        with open(p, "w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=1)
    except Exception as e:
        return jsonify(error=str(e)), 500
    return jsonify(ok=True)


@app.route("/api/naplo/<eid>", methods=["DELETE"])
def naplo_delete(eid):
    p = _naplo_path(eid)
    if not p or not os.path.isfile(p):
        return jsonify(error="not_found"), 404
    try:
        os.remove(p)
    except OSError as e:
        return jsonify(error=str(e)), 500
    return jsonify(ok=True)


# ═══════════════════════════════════════════════════════════════════
#  PENTEST ESZKÖZÖK: a Kali KONTÉNERBEN (ott futnak a pentest parancsok).
#  Allowlist. A konténer naprakész Kali, a legtöbb eszköz már bent van;
#  a hiányzókat apt-tal telepíti (a futó munkamenetre; restart után újra).
# ═══════════════════════════════════════════════════════════════════
PENTEST_TOOLS = {
    # key : (bináris a which-hez, apt csomag) — Kali-ban apt-telepíthető CLI eszközök
    # Hálózat / szkennelés
    "nmap":        ("nmap", "nmap"),
    "masscan":     ("masscan", "masscan"),
    "netexec":     ("nxc", "netexec"),
    "enum4linux":  ("enum4linux", "enum4linux"),
    "smbclient":   ("smbclient", "smbclient"),
    "snmpwalk":    ("snmpwalk", "snmp"),
    "onesixtyone": ("onesixtyone", "onesixtyone"),
    "nbtscan":     ("nbtscan", "nbtscan"),
    "tcpdump":     ("tcpdump", "tcpdump"),
    "tshark":      ("tshark", "tshark"),
    # Web
    "nikto":       ("nikto", "nikto"),
    "sqlmap":      ("sqlmap", "sqlmap"),
    "gobuster":    ("gobuster", "gobuster"),
    "ffuf":        ("ffuf", "ffuf"),
    "feroxbuster": ("feroxbuster", "feroxbuster"),
    "dirb":        ("dirb", "dirb"),
    "dirsearch":   ("dirsearch", "dirsearch"),
    "wpscan":      ("wpscan", "wpscan"),
    "joomscan":    ("joomscan", "joomscan"),
    "commix":      ("commix", "commix"),
    "wfuzz":       ("wfuzz", "wfuzz"),
    "nuclei":      ("nuclei", "nuclei"),
    "whatweb":     ("whatweb", "whatweb"),
    "wafw00f":     ("wafw00f", "wafw00f"),
    "sslscan":     ("sslscan", "sslscan"),
    # Felderítés / OSINT
    "theharvester":("theHarvester", "theharvester"),
    "amass":       ("amass", "amass"),
    "subfinder":   ("subfinder", "subfinder"),
    "dnsenum":     ("dnsenum", "dnsenum"),
    "fierce":      ("fierce", "fierce"),
    "dmitry":      ("dmitry", "dmitry"),
    # Jelszó / hash
    "hydra":       ("hydra", "hydra"),
    "medusa":      ("medusa", "medusa"),
    "john":        ("john", "john"),
    "hashcat":     ("hashcat", "hashcat"),
    "cewl":        ("cewl", "cewl"),
    "crunch":      ("crunch", "crunch"),
    # Vezeték nélküli
    "aircrack":    ("aircrack-ng", "aircrack-ng"),
    "bettercap":   ("bettercap", "bettercap"),
    # Egyéb / forensics
    "binwalk":     ("binwalk", "binwalk"),
    "exiftool":    ("exiftool", "libimage-exiftool-perl"),
    "steghide":    ("steghide", "steghide"),
    "searchsploit":("searchsploit", "exploitdb"),
    # WiFi (4.7) — a bináris = a kulcs, hogy a node-szintű detektálás egyezzen
    "iw":          ("iw", "iw"),
    "airodump-ng": ("airodump-ng", "aircrack-ng"),
    "aireplay-ng": ("aireplay-ng", "aircrack-ng"),
    "aircrack-ng": ("aircrack-ng", "aircrack-ng"),
    "hcxdumptool": ("hcxdumptool", "hcxdumptool"),
    "hcxtools":    ("hcxpcapngtool", "hcxtools"),
    # Bluetooth (4.9)
    "bluetoothctl":("bluetoothctl", "bluez"),
    "sdptool":     ("sdptool", "bluez"),
    "gatttool":    ("gatttool", "bluez"),
    "l2ping":      ("l2ping", "bluez"),
    "btmon":       ("btmon", "bluez"),
    "obexftp":     ("obexftp", "obexftp"),
    "spooftooph":  ("spooftooph", "spooftooph"),
    "redfang":     ("redfang", "redfang"),
    "bluelog":     ("bluelog", "bluelog"),
    "btlejack":    ("btlejack", "btlejack"),
    # Android (4.10)
    "adb":         ("adb", "adb"),
    "apktool":     ("apktool", "apktool"),
    "jadx":        ("jadx", "jadx"),
    "aapt":        ("aapt", "aapt"),
    # Hálózat / web / rendszer (0.4)
    "whois":       ("whois", "whois"),
    "smbmap":      ("smbmap", "smbmap"),
    "ssh-audit":   ("ssh-audit", "ssh-audit"),
    "inotifywait": ("inotifywait", "inotify-tools"),
}


@app.route("/api/pentest/tools")
def pentest_tools_status():
    out = {}
    bins = " ".join(sorted({b for b, _ in PENTEST_TOOLS.values()}))
    try:
        # egyetlen héj-hívással ellenőrizzük mindet (gyors)
        script = "for b in " + bins + "; do command -v $b >/dev/null && echo \"$b 1\" || echo \"$b 0\"; done"
        r = subprocess.run([BASH_PATH, "-lc", script], capture_output=True, text=True, timeout=25)
        present = {}
        for ln in (r.stdout or "").splitlines():
            parts = ln.split()
            if len(parts) == 2:
                present[parts[0]] = (parts[1] == "1")
        for key, (b, _) in PENTEST_TOOLS.items():
            out[key] = bool(present.get(b, False))
    except Exception:
        for key in PENTEST_TOOLS:
            out[key] = False
    return jsonify(out)


@app.route("/api/pentest/tool/install", methods=["POST"])
def pentest_tool_install():
    b = request.get_json(force=True, silent=True) or {}
    key = b.get("key", "")
    if key not in PENTEST_TOOLS:
        return jsonify(error="unknown"), 400
    pkg = PENTEST_TOOLS[key][1]
    try:
        tid = int((request.get_json(force=True, silent=True) or {}).get("terminalId", 1))
    except Exception:
        tid = 1
    if active.get("pt_tool") and active["pt_tool"].poll() is None:
        return jsonify(error="busy", message="Egy telepites mar fut."), 409

    def worker():
        socketio.emit("pentest:output", {"terminalId": tid,
                      "data": f"$ apt-get update && apt-get install -y {pkg}  (konténer)\n", "isError": False})
        install_cmd = (
            "export DEBIAN_FRONTEND=noninteractive; "
            "echo '[*] apt-get update (csomaglista frissítése)...'; "
            "apt-get update -qq 2>&1 | tail -4; "
            f"echo '[*] apt-get install {pkg}...'; "
            f"apt-get install -y {pkg} 2>&1"
        )
        try:
            proc = subprocess.Popen([BASH_PATH, "-lc", install_cmd],
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("pentest:output", {"terminalId": tid, "data": f"[!] Hiba: {e}\n", "isError": True})
            socketio.emit("pentest:done", {"terminalId": tid, "exitCode": -1})
            socketio.emit("pentest:tooldone", {"key": key, "code": -1, "terminalId": tid})
            return
        active["pt_tool"] = proc
        try:
            for line in proc.stdout:
                socketio.emit("pentest:output", {"terminalId": tid, "data": line, "isError": False})
        except Exception:
            pass
        code = proc.wait()
        active.pop("pt_tool", None)
        socketio.emit("pentest:output", {"terminalId": tid,
                      "data": f"[telepites kesz, kod={code}]\n", "isError": code != 0})
        socketio.emit("pentest:done", {"terminalId": tid, "exitCode": code})
        socketio.emit("pentest:tooldone", {"key": key, "code": code, "terminalId": tid})

    socketio.start_background_task(worker)
    return jsonify(status="started")


# ═══════════════════════════════════════════════════════════════════
#  RENDSZER-ÁLLAPOT: élő eszköz-egészség a HOST uConsole-ról (nsenter).
#  Hőmérséklet, alulfeszültség/throttling (a spontán kikapcsolás oka!),
#  uptime, RAM, tárhely, akku, WiFi-interfészek monitor-képességgel.
# ═══════════════════════════════════════════════════════════════════
_MON_DRIVERS = {"rtl8xxxu", "rt2800usb", "ath9k_htc", "mt7601u", "carl9170",
                "rtl88xxau", "rtl8814au", "mt7612u", "ath9k"}


def _host_out(sh, timeout=12):
    try:
        r = subprocess.run(_nsenter_host(sh), capture_output=True, text=True, timeout=timeout)
        return (r.stdout or "").strip()
    except Exception:
        return ""


def _parse_kv(text):
    d = {}
    for ln in (text or "").splitlines():
        if "=" in ln:
            k, v = ln.split("=", 1)
            d[k.strip()] = v.strip()
    return d


# Védelmi szolgáltatások a rendszer-laphoz: svc -> emberi név
_DEF_SVCS = [
    ("ufw", "UFW tűzfal"), ("fail2ban", "Fail2ban (brute-force)"),
    ("suricata", "Suricata IDS/IPS"), ("arpwatch", "arpwatch (ARP-spoof)"),
    ("dnscrypt-proxy", "dnscrypt (titkosított DNS)"), ("apparmor", "AppArmor (MAC)"),
    ("unattended-upgrades", "Auto biztonsági frissítés"), ("auditd", "auditd (napló)"),
    ("clamav-freshclam", "ClamAV (kártevő)"),
]


@app.route("/api/sysinfo")
def sysinfo():
    # ── Táp / hő (vcgencmd) ──
    temp = _host_out("vcgencmd measure_temp 2>/dev/null")
    thr = _host_out("vcgencmd get_throttled 2>/dev/null")
    volt = _host_out("vcgencmd measure_volts 2>/dev/null")
    batt = _host_out("for p in /sys/class/power_supply/*/capacity; do [ -f \"$p\" ] && cat \"$p\" && break; done")
    battst = _host_out("for p in /sys/class/power_supply/*/status; do [ -f \"$p\" ] && cat \"$p\" && break; done")

    # ── Hardver + rendszer (egy hívásban) ──
    hw = _parse_kv(_host_out(
        "echo MODEL=$(tr -d '\\000' </proc/device-tree/model 2>/dev/null);"
        "echo KERNEL=$(uname -r);"
        "echo ARCH=$(uname -m);"
        "echo CPU=$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//');"
        "echo SOC=$(grep -m1 -i 'hardware' /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//');"
        "echo REV=$(grep -m1 -i 'revision' /proc/cpuinfo 2>/dev/null | cut -d: -f2- | sed 's/^ *//');"
        "echo CORES=$(nproc 2>/dev/null);"
        "echo MHZ=$(awk '{printf \"%d\",$1/1000}' /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null);"
        "echo MAXMHZ=$(awk '{printf \"%d\",$1/1000}' /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq 2>/dev/null);"
        "echo OS=$(. /etc/os-release 2>/dev/null; echo $PRETTY_NAME);"
        "echo UP=$(uptime -p 2>/dev/null);"
        "echo LOAD=$(cut -d' ' -f1-3 /proc/loadavg 2>/dev/null);"
        "echo RAM=$(free -m 2>/dev/null | awk 'NR==2{print $3\" / \"$2\" MB\"}');"
        "echo SWAP=$(free -m 2>/dev/null | awk '/Swap/{print $3\" / \"$2\" MB\"}');"
        "echo DISK=$(df -h / 2>/dev/null | awk 'NR==2{print $3\" / \"$2\" (\"$5\")\"}');"
    ))

    # ── Hálózat ──
    net = _parse_kv(_host_out(
        "echo GW=$(ip route 2>/dev/null | awk '/default/{print $3; exit}');"
        "echo DEV=$(ip route 2>/dev/null | awk '/default/{print $5; exit}');"
        "echo DNS=$(awk '/nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | paste -sd', ');"
    ))

    # ── Interfészek (egy hívás / interfész: driver, modul-verzió, mac, ip, típus) ──
    ifaces = []
    for n in _host_out("ls /sys/class/net 2>/dev/null").split():
        if n == "lo":
            continue
        d = _parse_kv(_host_out(
            f"echo DRV=$(basename $(readlink /sys/class/net/{n}/device/driver 2>/dev/null) 2>/dev/null);"
            f"echo STATE=$(cat /sys/class/net/{n}/operstate 2>/dev/null);"
            f"echo MAC=$(cat /sys/class/net/{n}/address 2>/dev/null);"
            f"echo IP=$(ip -4 -o addr show {n} 2>/dev/null | awk '{{print $4}}' | head -1);"
            f"echo TYPE=$(iw dev {n} info 2>/dev/null | awk '/type/{{print $2}}');"
            f"echo WL=$(test -d /sys/class/net/{n}/wireless && echo 1 || echo 0);"
        ))
        drv = d.get("DRV", "")
        modver = _host_out(f"modinfo -F version {drv} 2>/dev/null | head -1") if drv else ""
        ifaces.append({"name": n, "driver": drv, "module_version": modver,
                       "state": d.get("STATE", ""), "mac": d.get("MAC", ""),
                       "ip": d.get("IP", ""), "type": d.get("TYPE", "") or "—",
                       "wifi": d.get("WL") == "1", "monitor_capable": drv in _MON_DRIVERS})

    # ── WiFi kapcsolat ──
    wifi = _host_out("nmcli -t -f DEVICE,STATE,CONNECTION device 2>/dev/null | grep ':connected' | grep -i wlan | head -1")
    ssid = dev = ""
    if wifi and ":" in wifi:
        parts = wifi.split(":")
        dev = parts[0]
        ssid = parts[-1]
    wifi_ip = next((i["ip"] for i in ifaces if i["name"] == dev), "") if dev else ""
    signal = _host_out("nmcli -t -f IN-USE,SIGNAL,RATE dev wifi 2>/dev/null | grep '^\\*' | head -1 | cut -d: -f2-") if dev else ""

    # ── Védelmi szolgáltatások (egy hívás) ──
    def_script = "".join(
        f"echo {s}\\|$(systemctl is-active {s} 2>/dev/null)\\|$(systemctl is-enabled {s} 2>/dev/null);"
        for s, _ in _DEF_SVCS)
    def_raw = _host_out(def_script)
    def_map = {}
    for ln in def_raw.splitlines():
        p = ln.split("|")
        if len(p) == 3:
            def_map[p[0]] = {"active": p[1], "enabled": p[2]}
    defense = []
    for s, name in _DEF_SVCS:
        m = def_map.get(s, {})
        defense.append({"svc": s, "name": name,
                        "active": m.get("active", "unknown"),
                        "enabled": m.get("enabled", "unknown")})
    ufw_status = _host_out("ufw status 2>/dev/null | head -1 | sed 's/Status: //'")

    # ── VPN ──
    vpn = _parse_kv(_host_out(
        "echo WG=$(systemctl is-active wg-quick@wg0 2>/dev/null);"
        "echo IFS=$(ip -o link show 2>/dev/null | awk -F': ' '$2 ~ /^(wg|tun|tap)/{print $2}' | paste -sd', ');"
        "echo WGI=$(wg show interfaces 2>/dev/null);"
    ))
    vpn_ifaces = vpn.get("IFS", "") or vpn.get("WGI", "")
    vpn_active = bool(vpn_ifaces) or vpn.get("WG") == "active"

    # ── Throttled dekódolás ──
    flags = []
    raw_val = 0
    try:
        if "=" in thr:
            raw_val = int(thr.split("=")[1], 16)
    except Exception:
        raw_val = 0
    bits = {0: "⚠️ Alulfeszültség MOST", 1: "ARM frekvencia korlátozva",
            2: "⚠️ Throttling MOST", 3: "Hőmérséklet-limit aktív",
            16: "Alulfeszültség előfordult", 17: "Frekvencia-korlát előfordult",
            18: "Throttling előfordult", 19: "Hőlimit előfordult"}
    for b, lbl in bits.items():
        if raw_val & (1 << b):
            flags.append(lbl)

    return jsonify(
        temp=temp, throttled=thr, throttled_flags=flags, volt=volt,
        battery=batt, battery_status=battst,
        hw=hw, net=net,
        uptime=hw.get("UP", ""), ram=hw.get("RAM", ""), swap=hw.get("SWAP", ""),
        disk=hw.get("DISK", ""), load=hw.get("LOAD", ""),
        ifaces=ifaces, wifi_ssid=ssid, wifi_dev=dev, wifi_ip=wifi_ip, wifi_signal=signal,
        defense=defense, ufw=ufw_status, vpn_active=vpn_active, vpn_ifaces=vpn_ifaces,
        iface_default=DEFAULT_IFACE)


# ── Fájl-feltöltés a fájl-alapú pentest eszközökhöz (john, binwalk, exiftool…) ──
# Az UPLOADS_DIR-be menti (ez a pentest-parancsok cwd-je), így SIMA NÉVVEL elérhető.
PT_UPLOAD_DIR = UPLOADS_DIR


@app.route("/api/pentest/upload", methods=["POST"])
def pentest_upload():
    try:
        os.makedirs(PT_UPLOAD_DIR, exist_ok=True)
    except OSError:
        pass
    f = request.files.get("file")
    if not f or not f.filename:
        return jsonify(error="no_file"), 400
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(f.filename))[:120] or "file"
    name = datetime.now().strftime("%H%M%S") + "_" + safe
    try:
        f.save(os.path.join(PT_UPLOAD_DIR, name))
    except Exception as e:
        return jsonify(error=str(e)), 500
    # sima fájlnevet adunk vissza — a parancs cwd-je az uploads mappa
    return jsonify(ok=True, path=name, name=name)


# ── Mintafájl-generátor a fájl-alapú eszközökhöz (teszteléshez) ──
# A hash-ek a rockyou.txt-ben szerepelnek (password, 123456), így a john/hashcat
# ténylegesen fel is töri őket. Minden recept a konténerben fut.
SAMPLES = {
    "john":     (".txt",
                 "printf 'user1:5f4dcc3b5aa765d61d8327deb882cf99\\n"
                 "user2:e10adc3949ba59abbe56e057f20f883e\\n' > '{p}'"),
    "hashcat":  (".txt",
                 "printf '5f4dcc3b5aa765d61d8327deb882cf99\\n"
                 "e10adc3949ba59abbe56e057f20f883e\\n' > '{p}'"),
    "binwalk":  (".bin",
                 "echo 'EthTest rejtett gzip' | gzip > '{p}.gz' && "
                 "printf 'FIRMWAREHDR0123456789ABCDEF' > '{p}' && "
                 "cat '{p}.gz' >> '{p}' && rm -f '{p}.gz'"),
    "exiftool": (".jpg",
                 "convert -size 160x100 xc:navy '{p}' 2>/dev/null; "
                 "test -s '{p}' || printf '\\377\\330\\377\\340\\000\\020JFIF\\000 EthTest minta \\377\\331' > '{p}'; "
                 "exiftool -overwrite_original '-Artist=EthTest' '-Comment=minta fajl' "
                 "'-Make=ClockworkPi' '-Model=uConsole' '{p}' >/dev/null 2>&1 || true"),
    "steghide": (".jpg",
                 "convert -size 160x100 xc:gray '{p}' 2>/dev/null; "
                 "test -s '{p}' || printf '\\377\\330\\377\\340\\000\\020JFIF\\000 EthTest minta \\377\\331' > '{p}'"),
}


@app.route("/api/pentest/sample")
def pentest_sample():
    tool = request.args.get("tool", "")
    spec = SAMPLES.get(tool)
    if not spec:
        return jsonify(error="no_sample"), 400
    ext, recipe = spec
    try:
        os.makedirs(PT_UPLOAD_DIR, exist_ok=True)
    except OSError:
        pass
    name = f"minta_{tool}_{datetime.now().strftime('%H%M%S')}{ext}"
    path = os.path.join(PT_UPLOAD_DIR, name)
    try:
        subprocess.run([BASH_PATH, "-lc", recipe.format(p=path)],
                       capture_output=True, text=True, timeout=40)
    except Exception as e:
        return jsonify(error=str(e)), 500
    if not os.path.isfile(path):
        return jsonify(error="create_failed"), 500
    # sima fájlnevet adunk vissza — a parancs cwd-je az uploads mappa
    return jsonify(ok=True, path=name, name=name)


# ─── Handshake-kezelo: elkapott handshake-ek listaja + letoltes ──────────
HS_DIRS = ["/root/work/hs", "/root/work/ethtest/hs", "/root/work"]


def _hs_list():
    import glob
    seen, items = set(), []
    for d in HS_DIRS:
        try:
            paths = sorted(glob.glob(os.path.join(d, "*")))
        except OSError:
            continue
        for p in paths:
            if not os.path.isfile(p):
                continue
            n = os.path.basename(p)
            if not n.lower().endswith((".cap", ".22000", ".pcapng", ".hccapx", ".pmkid")):
                continue
            if n in seen:
                continue
            seen.add(n)
            try:
                st = os.stat(p)
                items.append({"name": n, "path": p, "size": _hsize(st.st_size),
                              "mtime": st.st_mtime})
            except OSError:
                pass
    items.sort(key=lambda x: x["mtime"], reverse=True)
    return items


@app.route("/api/wifite/handshakes")
def wifite_handshakes():
    return jsonify([{k: v for k, v in it.items() if k != "path"} for it in _hs_list()])


@app.route("/api/wifite/handshake")
def wifite_handshake_dl():
    name = request.args.get("name", "")
    if not re.match(r"^[\w.\-]+$", name):
        abort(400)
    for it in _hs_list():
        if it["name"] == name:
            return send_file(it["path"], as_attachment=True, download_name=name)
    abort(404)


# ─── Frissítés (update): verziók + Kali eszközök (full-upgrade) + host ───
def _update_stream(argv):
    def worker():
        try:
            proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                    text=True, bufsize=1)
        except Exception as e:
            socketio.emit("update:output", {"line": "[HIBA] " + str(e)})
            socketio.emit("update:done", {"code": 1})
            return
        active["update"] = proc
        for line in proc.stdout:
            line = line.rstrip("\n")
            if line.strip():
                socketio.emit("update:output", {"line": line})
        code = proc.wait()
        active.pop("update", None)
        socketio.emit("update:done", {"code": code})
    socketio.start_background_task(worker)


@app.route("/api/update/versions")
def update_versions():
    cont = _def_out("kismet",
        "echo -n 'Kali: '; (grep -oP 'VERSION=\"\\K[^\"]+' /etc/os-release || echo '?'); "
        "echo -n 'wifite: '; (wifite --help 2>/dev/null | grep -oiE 'wifite2 [0-9.]+' | head -1 || echo '?'); "
        "echo -n 'aircrack-ng: '; (aircrack-ng --help 2>/dev/null | grep -oiE 'aircrack-ng [0-9.]+' | head -1 || echo '?'); "
        "echo -n 'hashcat: '; (hashcat --version 2>/dev/null | head -1 || echo '?'); "
        "echo -n 'reaver: '; (reaver 2>&1 | grep -oiE 'reaver [v0-9.]+' | head -1 || echo '?'); "
        "echo -n 'nmap: '; (nmap --version 2>/dev/null | head -1 || echo '?')",
        timeout=25)
    host = _def_out("ufw",
        "apt-get update -qq 2>/dev/null; echo -n 'Host frissitheto csomagok: '; "
        "apt list --upgradable 2>/dev/null | grep -c upgradable",
        timeout=45)
    return jsonify(container=cont or "(nem elerheto)", host=host or "(nem elerheto)")


@app.route("/api/update/run", methods=["POST"])
def update_run():
    target = (request.get_json(force=True, silent=True) or {}).get("target")
    if target == "host":
        cmd = ("echo '[*] Host rendszer frissitese (apt update + full-upgrade)...'; "
               "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y full-upgrade && "
               "echo '[+] Host frissites kesz.'")
        _update_stream(_nsenter_host(cmd))
    elif target == "tools":
        # Kali = ROLLING -> full-upgrade (a sima upgrade visszatart csomagokat)
        inner = ("apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y full-upgrade && "
                 "DEBIAN_FRONTEND=noninteractive apt-get -y install --no-install-recommends "
                 "wifite aircrack-ng reaver bully hashcat hcxtools hcxdumptool cowpatty")
        cmd = ("echo '[*] Kali eszkozok frissitese (full-upgrade, par percig tarthat)...'; "
               "podman rm -f kali-upd-tmp >/dev/null 2>&1; "
               "podman run --name kali-upd-tmp kali-uconsole bash -lc \"" + inner + "\" && "
               "echo '[*] Mentes az image-be (commit)...' && "
               "podman commit kali-upd-tmp kali-uconsole && podman rm -f kali-upd-tmp && "
               "echo '[+] Kesz — az uj eszkozok a KOVETKEZO inditaskor elnek.'")
        _update_stream(_nsenter_host(cmd))
    else:
        return jsonify(error="ismeretlen target"), 400
    return jsonify(status="started")


@app.route("/api/update/stop", methods=["POST"])
def update_stop():
    p = active.get("update")
    if p:
        try:
            p.terminate()
        except Exception:
            pass
        active.pop("update", None)
    return jsonify(status="stopped")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"\n🛡️  EthTest (Python) szerver fut: http://localhost:{port}")
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)
