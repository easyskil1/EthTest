# 🛡️ EthTest – Ethical Hacking Toolkit

> A web-based, beginner-friendly environment for WiFi and network security testing.
> **Only use on networks you own or have explicit written permission to test.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Nmap Scanner** | 30+ scan profiles (Discovery, Port Scan, Vuln, Full Audit, etc.) |
| **Wifite Integration** | Automated WiFi audit — WPA/WPA2, WPS, PMKID |
| **Real-time Terminal** | Live output streamed via WebSocket (Socket.IO) |
| **Smart Explanations** | Every scan line is explained — what it means and what to do next |
| **CVE Linking** | Found CVE IDs automatically link to NVD |
| **Vulnerability Guide** | Built-in database with exploitation steps and defense tips |
| **Scan History** | Last 5 scans stored locally with one-click re-run |
| **Summary Dashboard** | Hosts / open ports / unique IPs / vulnerability hits |
| **Export** | Download scan results as `.txt` |
| **Multilingual UI** | 🇭🇺 Hungarian · 🇬🇧 English · 🇩🇪 German · 🇪🇸 Spanish |
| **Knowledge Base** | Built-in wiki: legal background, pentest methodology, Nmap deep dive |

---

## 🖥️ Screenshots

> _Interface running in browser at `http://localhost:3000`_

---

## ⚡ Quick Start

### Linux (Ubuntu / Debian / Kali)

```bash
# 1. Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install required tools
sudo apt install -y wifite nmap

# 3. Clone and start EthTest
git clone https://github.com/YOUR_USERNAME/EthTest.git
cd EthTest
npm install
sudo node server.js
```

### macOS

```bash
# 1. Node.js: https://nodejs.org
# 2. Install nmap (wifite is not supported on macOS)
brew install nmap

# 3. Clone and start EthTest
git clone https://github.com/YOUR_USERNAME/EthTest.git
cd EthTest
npm install
sudo node server.js   # sudo required for nmap OS detection (-O)
```

Then open your browser at:
```
http://localhost:3000
```

---

## 🔧 Requirements

| Requirement | Notes |
|---|---|
| Node.js 18+ | Runtime |
| `nmap` | Network scanning — Linux & macOS |
| `wifite` | WiFi auditing — **Linux only** |
| Monitor-mode WiFi adapter | Required for wifite |
| Root / sudo | Required for SYN scan, OS detection, wifite |

---

## 🗂️ Project Structure

```
EthTest/
├── server.js              # Express + Socket.IO backend
├── package.json
└── public/
    ├── index.html         # Single-page application
    ├── theme/style.css    # UI styles
    ├── app/
    │   ├── app.js         # Core: tabs, socket, toast, terminal renderer
    │   ├── nmap.js        # Nmap UI logic, scan types, history, modals
    │   └── wifite.js      # Wifite UI logic
    ├── lang/
    │   ├── i18n.js        # Translation engine
    │   ├── hu.js          # Hungarian
    │   ├── en.js          # English
    │   ├── de.js          # German
    │   └── es.js          # Spanish
    └── docs/              # Knowledge base articles (hu + en)
        ├── guide.html / guide.en.html
        ├── legal.html / legal.en.html
        ├── method.html / method.en.html
        ├── nmap.html / nmap.en.html
        ├── platforms.html / platforms.en.html
        └── wifi.html / wifi.en.html
```

---

## 🌐 Nmap Scan Profiles

| Category | Profiles |
|---|---|
| Discovery | Ping, OS Detection, MAC+Vendor, NetBIOS, Traceroute, DNS Brute |
| Port Scan | Fast, Full, UDP, All Ports, Stealth SYN, ACK, FIN, NULL, Xmas, IP Proto |
| Service Analysis | Port+Version, NSE Default, Banner Grab, Auth, HTTP Enum, HTTP Methods, DB Info |
| Vulnerability | Vuln, SMB Vuln, HTTP Vuln, SSL/TLS, Shellshock, RDP Vuln, DB Vuln, Malware, Exploit |
| Offensive | Brute, DoS, Fuzzer, Decoy, Fragmentation |
| Full Audit | Everything combined — slow but thorough |

---

## ⚖️ Legal Disclaimer

This tool is intended **exclusively for ethical security testing**.

- Only use it on networks you **own** or have **written permission** to test.
- Unauthorized network scanning or access is a criminal offense in most countries (e.g. CFAA in the USA, Budapest Convention globally).
- The developer is **not responsible** for any misuse of this software.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
