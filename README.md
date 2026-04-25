# 🛡️ EthTest – Etikus Tesztelő Környezet

Webalapú, kezdőbarát eszköz WiFi és hálózati biztonsági teszteléshez.
**Csak saját hálózatodon, saját engedéllyel használd!**

---

## ⚡ Gyors telepítés

### Linux (Ubuntu / Debian / Kali)

```bash
# 1. Node.js telepítése (ha még nincs)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Eszközök telepítése
sudo apt install -y wifite nmap

# 3. EthTest indítása
cd ethtest
npm install
sudo node server.js
```

### macOS

```bash
# 1. Node.js: https://nodejs.org
# 2. Nmap
brew install nmap
# (wifite macOS-en nem támogatott natívan)

# 3. EthTest
cd ethtest
npm install
sudo node server.js   # sudo kell az nmap -O flaghez
```

---

## 🌐 Megnyitás

```
http://localhost:3000
```

---

## 📋 Funkciók

| Funkció | Leírás |
|---|---|
| **Wifite integráció** | Automatikus WiFi audit futtatása böngészőből |
| **Nmap szkennelő** | 4 előre beállított szkennelési profil |
| **Magyar magyarázatok** | Minden sor értelmezve, kezdőknek is |
| **Összesítő** | Talált hálózatok / handshake-ek / nyitott portok |
| **Exportálás** | .txt fájl letöltése az eredményekről |

---

## 🔧 Rendszerkövetelmények

- Node.js 18+
- `nmap` (hálózat szkennelés)
- `wifite` (WiFi audit) – **csak Linux**
- Monitor módot támogató WiFi adapter (wifite-hez)
- Root / sudo jogosultság

---

## ⚖️ Jogi nyilatkozat

Ez az eszköz **kizárólag etikus tesztelési célokra** készült.
- Csak olyan hálózaton használd, amely a **saját tulajdonod** vagy amelyhez **írásos engedélyed** van.
- Magyarországon a Btk. 375-376. §-a alapján az engedély nélküli hálózati tesztelés bűncselekmény.
- A fejlesztő nem vállal felelősséget a visszaélésért.
