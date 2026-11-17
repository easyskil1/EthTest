# EthTest

A web-based, ethical pentest toolkit with a classic enterprise-style console UI, built to run
on a [ClockworkPi uConsole](https://www.clockworkpi.com/) inside a Kali (podman) container.

> ⚠️ **For authorized use only.** Run EthTest **only against networks and systems you own or have
> written permission to test.** You are responsible for complying with all applicable laws.

This is the **Python (Flask) edition** — a full port of the original Node.js/`server.js` version.
The backend is now `app.py` (Flask + Flask-SocketIO); the old Node server has been removed.

## Features

- **Nmap scanner** — preset profiles + custom arguments, with live output streamed over Socket.IO.
- **WiFi audit** — monitor-mode capture (iw-based, airmon-ng-free) via `wifite`, with wordlist support.
- **PenTest script runner** — manage and run shell scripts (REST + Socket.IO), with a findings view.
- **Defense / hardening tools** — status and install helpers for common security tooling.
- **System status** — temperature, throttling, RAM, storage, Wi-Fi/IP/gateway, firewall state.
- **Console web UI** — classic enterprise-style layout: menu bar, workspace tree, workflow steps,
  overview cards, integrated terminal; own theme / density / light–dark toggle.
- **Multilingual** — Hungarian, English, German, Spanish (`public/lang/`).

## Requirements

- Python 3.9+
- `pip install flask flask-socketio`
- For the actual tooling: `nmap`, `iw`, `wifite` (present inside the Kali container). When these are
  missing (e.g. on macOS), the UI still loads and the relevant panels degrade gracefully.

## Run

```bash
pip install flask flask-socketio
python3 app.py
# -> http://localhost:3000
```

Environment variables:

| Variable       | Default            | Purpose                                      |
| -------------- | ------------------ | -------------------------------------------- |
| `PORT`         | `3000`             | HTTP port                                    |
| `WIFI_IFACE`   | `wlan1`            | Wireless interface used for WiFi audit       |
| `WORDLIST_DIR` | `/root/work/wordlists` | Where wordlists are read from            |

## uConsole deployment

The `deploy/` folder contains the kiosk launcher and desktop entry used on the uConsole:

- `ethtest-run` — starts the persistent Kali container, launches `app.py`, opens the UI in a
  kiosk browser, and restores Wi-Fi on exit.
- `ethtest.desktop` — desktop/menu entry.
- `ethtest-eye.{png,svg}` — icon.

## Project layout

```
app.py              Flask + Socket.IO backend
public/             Frontend (index.html console UI, app/, lang/, docs/, theme/)
vendor/             Vendored client libraries (offline-friendly)
deploy/             uConsole kiosk launcher, desktop entry, icon
```

## License / disclaimer

Provided as-is for **educational and authorized security-testing purposes only**. The authors
take no responsibility for misuse.
