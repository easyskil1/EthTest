const hu = {
  // Nav
  'nav.home':  '📚 Tudásbázis',
  'nav.wifi':  'WiFi Audit',
  'nav.nmap':  'Nmap Scan',
  'nav.guide': '📖 Útmutató',
  'nav.vedelem': '🛡️ Védelem',
  'nav.pentest': 'PenTest',
  'nav.naplo': '📓 Napló',
  'nav.rendszer': '📊 Rendszer',
  'close.title': 'Bezárás (böngésző + szerver)',
  'close.confirm': 'Biztosan bezárod? A böngésző és a szerver is leáll, a Wi-Fi visszaáll.',

  // --- SIDEBAR NAV ---
  'home.nav.guide': '0. Kezdő lépések',
  'home.nav.legal': '1. Nemzetközi Jogi Háttér',
  'home.nav.method': '2. Pentest Módszertan',
  'home.nav.nmap': '3. Nmap Deep Dive',
  'home.nav.wifi': '4. Wireless Security',
  'home.nav.platforms': '5. Gyakorló Platformok',

  'home.welcome': 'Ethical Hacking Knowledge Base v1.0',
  'home.tagline': 'Részletes technikai dokumentáció és módszertani útmutató szakembereknek.',

  // --- SECTION 1: LEGAL ---
  'home.legal.title': '1. Nemzetközi Kiberbiztonsági Jog és Etika',
  'home.legal.content': `Az etikus hacker tevékenysége során a törvényesség határán mozog. A nemzetközi jogi környezet megértése kritikus a börtönbüntetés elkerülése érdekében.
  <br><br>
  <strong>1.1. Budapesti Egyezmény (Convention on Cybercrime):</strong> Az Európa Tanács által 2001-ben létrehozott első nemzetközi egyezmény, amely összehangolja a nemzeti törvényeket a számítógépes bűnözés ellen. Magyarország is aláírója. Meghatározza az "illegal access" (jogtalan hozzáférés) és az "illegal interception" (jogtalan megfigyelés) fogalmait. Ez az alapköve minden európai kiberjognak.
  <br><br>
  <strong>1.2. CFAA (Computer Fraud and Abuse Act - USA):</strong> Az egyik legfontosabb globális törvény. Bár amerikai, sok esetben precedensértékű. Büntet minden olyan tevékenységet, amely "meghaladja a felhatalmazott hozzáférést". Az USA-ban már egy egyszerű portszkennelés is szürke zónának minősülhet, ha rosszindulatú szándékot feltételeznek.
  <br><br>
  <strong>1.3. GDPR és Adatvédelem:</strong> Ha a tesztelés során személyes adatokhoz férsz hozzá (PII - Personally Identifiable Information), az EU-s GDPR szabályozás lép életbe. A büntetés itt nem szabadságvesztés, hanem óriási pénzbírság. Pentest során kötelező az adatok anonimizálása és a biztonságos kezelése.
  <br><br>
  <strong>1.4. Rules of Engagement (RoE):</strong> Az írásos szerződés kötelező elemei:
  <ul>
    <li><strong>Scope:</strong> Pontosan mely IP címek és domainek támadhatóak. Minden, ami ezen kívül esik, bűncselekmény.</li>
    <li><strong>Tools:</strong> Vannak tiltott eszközök? Sok cég tiltja a DoS (Denial of Service) teszteket.</li>
    <li><strong>Schedule:</strong> Csak munkaidőn kívül vagy bármikor végezhető a tesztelés?</li>
    <li><strong>Communication:</strong> Kit kell értesíteni, ha kritikus (pl. távoli kódvégrehajtást lehetővé tevő) hibát találsz?</li>
  </ul>`,

  // --- SECTION 2: METHODOLOGY ---
  'home.method.title': '2. Professzionális Módszertan (PTES)',
  'home.method.content': `A sikeres tesztelés nem ad-hoc jellegű, hanem követi a <strong>Penetration Testing Execution Standard (PTES)</strong> irányelveit. Ez biztosítja, hogy a teszt átfogó legyen és minden kockázatot feltárjon.
  <br><br>
  <strong>2.1. Intelligence Gathering (Információgyűjtés):</strong>
  Itt használjuk az OSINT (Open Source Intelligence) eszközöket. Cél: a támadási felület (Attack Surface) feltérképezése. Domainek, DNS rekordok (MX, TXT, SPF), subdomének, publikus e-mail címek gyűjtése. Ez a fázis adja meg az alapot a későbbi támadásokhoz.
  <br><br>
  <strong>2.2. Vulnerability Analysis (Sebezhetőség elemzés):</strong>
  Ebben a fázisban azonosítjuk a gyenge pontokat. Itt jön képbe az <strong>Nmap NSE</strong>, vagy olyan eszközök, mint a Nessus vagy OpenVAS. Nem csak a szoftver verzióját nézzük, hanem a konfigurációs hibákat is (pl. alapértelmezett jelszavak, nyitott NFS megosztások).
  <br><br>
  <strong>2.3. Exploitation (Kihasználás):</strong>
  A cél a hozzáférés megszerzése a talált sebezhetőségen keresztül. Csak akkor végezzük, ha a RoE megengedi. Eszközök: Metasploit, Burp Suite, SQLMap. Itt bizonyítjuk be, hogy a hiba valóban kihasználható.
  <br><br>
  <strong>2.4. Post-Exploitation:</strong>
  A legfontosabb szakasz a kliens számára. Mit ért el a támadó? Ki tudott-e lépni a sandboxból? Meg tudta-e szerezni a Domain Admin jogosultságot (Lateral Movement)? Itt határozzuk meg az üzleti kockázat mértékét.`,

  // --- SECTION 3: NMAP DEEP DIVE ---
  'home.nmap.title': '3. Nmap (Network Mapper) - Az Ultimate Útmutató',
  'home.nmap.content': `Az Nmap a kiberbiztonság alapköve. Megértéséhez ismernünk kell a TCP/IP protokoll rétegeit és a csomagok felépítését.
  <br><br>
  <strong>3.1. Host Discovery (Hogyan látja a gépeket?):</strong>
  Az Nmap nem csak egyszerű pinget küld. A <code>-sn</code> flag használatakor:
  <ul>
    <li><strong>Helyi hálózaton (Ethernet):</strong> ARP requesteket küld minden lehetséges IP-re. Ez kikerülhetetlen, mivel az OS-nek szüksége van a MAC címre a kommunikációhoz.</li>
    <li><strong>Távoli hálózaton:</strong> ICMP Echo Requestet, TCP ACK-t a 80-as portra, és SYN-t a 443-asra küld egyszerre. Ha bármelyikre válasz jön, a host élőnek minősül.</li>
  </ul>
  <br>
  <strong>3.2. Scan Technikák mélységei:</strong>
  <ul>
    <li><code>-sS (SYN Scan):</code> Az Nmap elküldi a SYN csomagot. Ha SYN/ACK jön, a port NYITVA. Ha RST jön, a port ZÁRVA. Az Nmap azonnal küld egy RST-t, hogy ne jöjjön létre a teljes kapcsolat, így sok régi naplózót kikerül.</li>
    <li><code>-sT (Connect Scan):</code> A rendszer <code>connect()</code> hívását használja. Teljes 3-way handshake épül fel. Lassabb, de pontosabb olyan hálózatokon, ahol a SYN csomagokat szűrik.</li>
    <li><code>-sU (UDP Scan):</code> UDP esetén nincs kézfogás. Ha nem jön válasz, a port "open|filtered". Ha ICMP Type 3 Code 3 (Destination Unreachable) jön, akkor zárva.</li>
    <li><code>-sV (Version Detection):</code> Az Nmap azonosítás után "szondákat" (probes) küld a portra, és figyeli a banner válaszokat. Összeveti az nmap-service-probes adatbázissal a pontos verzióhoz.</li>
  </ul>
  <br>
  <strong>3.3. NSE (Nmap Scripting Engine):</strong>
  Ez teszi az Nmap-et sebezhetőség-vizsgálóvá. Lua nyelven írt scriptek futnak:
  <ul>
    <li><strong>Vulnerability Detection:</strong> Pl. <code>--script vuln</code> lefuttat minden ismert sebezhetőség-ellenőrzőt.</li>
    <li><strong>Exploitation support:</strong> Vannak scriptek, amik segítenek a kihasználásban (pl. SMB backdoor csekkolás).</li>
  </ul>
  <br>
  <strong>3.4. Timing és Evasion (Tűzfalak kikerülése):</strong>
  A <code>-T0</code>-tól <code>-T5</code>-ig terjedő skála a csomagok közötti várakozást állítja. <code>-T0</code> esetén soronként percek telnek el, ami elaltatja az IDS rendszereket. A <code>--spoof</code> és <code>-D (Decoy)</code> flagekkel hamis IP címekről érkező csomagokkal áraszthatjuk el a célt, így elrejtve a valódi címünket a zajban.`,

  // --- SECTION 4: WIFITE & WIRELESS ---
  'home.wifi.title': '4. Wireless Security és Rádiófrekvenciás Audit',
  'home.wifi.content': `A WiFi hálózatok tesztelése alapvetően más megközelítést igényel, mivel a közeg (levegő) bárki számára elérhető.
  <br><br>
  <strong>4.1. 802.11 Frame Típusok:</strong>
  A WiFi nem csak adatokat továbbít. Vannak Management (Beacon, Probe, Auth), Control (RTS/CTS) és Data frame-ek. Az etikus hackernek ismernie kell ezeket, hogy lássa, mi történik a levegőben.
  <br><br>
  <strong>4.2. A 4-Way Handshake mechanizmusa:</strong>
  WPA2 esetén a jelszó (PSK) egy 256 bites kulccsá alakul (PMK). A csatlakozáskor a router és a kliens 4 csomagot vált vált (EAPOL). Ebből kinyerhető a MIC (Message Integrity Code), ami ellenőrizhető offline. Ha a jelszavad <code>12345678</code>, a támadó másodpercek alatt kitalálja, mert a hash megegyezik.
  <br><br>
  <strong>4.3. PMKID (Clientless) Attack:</strong>
  Ez a legmodernebb támadás. Nem kell megvárni, hogy egy kliens csatlakozzon! Csak egyetlen kérést küldünk a routernek, és az válaszol egy olyan frame-mel, ami tartalmazza a jelszó hash-ét (PMKID). Ez drasztikusan leegyszerűsíti a WiFi auditot.
  <br><br>
  <strong>4.4. Deauthentication Támadás:</strong>
  A támadó hamisított management frame-eket küld a kliensnek a router nevében, amivel "lecsatlakoztatja" a hálózatról. A kliens azonnal megpróbál visszakapcsolódni, ekkor pedig elkapható a 4-way handshake. A <strong>Wifite</strong> ezt automatikusan végzi.`,

  // --- SECTION 5: PLATFORMS ---
  'home.platforms.title': '5. Gyakorló Platformok és Karrier',
  'home.platforms.content': `A tudás elmélyítéséhez elengedhetetlen a legális gyakorlás.
  <br><br>
  <strong>5.1. TryHackMe (THM):</strong> Játékosított tanulás. Kiváló a hálózati alapokhoz, Linux ismeretekhez és az Nmap megtanulásához. A "Rooms" rendszere lépésről lépésre vezet.
  <br><br>
  <strong>5.2. Hack The Box (HTB):</strong> Itt nincsenek segítő kérdések. Kapsz egy IP-t, és be kell jutnod. A "Seasonal" gépek a legmodernebb sebezhetőségeket mutatják be. Az itt szerzett rang (pl. Global Elite) elismert a munkaerőpiacon.
  <br><br>
  <strong>5.3. OSCP (Offensive Security Certified Professional):</strong> Az "arany standard" tanúsítvány. Egy 24 órás vizsgán kell bebizonyítanod, hogy képes vagy gépeket feltörni és dokumentálni a folyamatot. Az EthTest használata jó előszoba lehet ehhez a szinthez.
  <br><br>
  <strong>5.4. Bug Bounty:</strong> Ha már profi vagy, pénzt is kereshetsz. Olyan platformokon, mint a HackerOne vagy a Bugcrowd, nagy cégek (Google, Facebook, DoD) fizetnek azért, ha hibát találsz náluk.`,

  // --- REST OF TRANSLATIONS ---
  'status.idle':    'Készenléti állapot',
  'status.running.wifite': 'Wifite fut...',
  'status.running.nmap':   'Nmap fut...',
  'status.done.wifite':    'Wifite kész',
  'status.done.nmap':      'Nmap kész',
  'status.stopped.nmap':   'Nmap leállítva',
  'status.error':          'Hiba',
  'wifite.title':         '⚡ Wifite Konfiguráció',
  'wifite.info':          '<strong>Mi ez?</strong><br>A <code>wifite</code> egy automatizált WiFi biztonsági tesztelő eszköz. Megkeresi a közeli hálózatokat és teszteli azok védelmi szintjét.<br><br><strong>⚠️ Fontos:</strong> Csak olyan hálózaton használd, amelyhez jogod van! Ez a tool <em>saját hálózatod</em> tesztelésére való.',
  'wifite.label.mode':    'Szkennelési mód',
  'wifite.wpa.title':     'WPA/WPA2',
  'wifite.wpa.desc':      'Modern titkosítás tesztelése',
  'wifite.wps.title':     'WPS',
  'wifite.wps.desc':      'WPS gomb sebezhetőség',
  'wifite.all.title':     'Teljes szkennelés',
  'wifite.all.desc':      'Minden módszer',
  'wifite.label.extra':   'Extra opciók',
  'wifite.kill.desc':     'Interferáló folyamatok leállítása',
  'wifite.mac.desc':      'Véletlenszerű MAC cím használata',
  'wifite.btn.start':     'Indítás',
  'wifite.btn.stop':      'Leállítás',
  'wifite.req.title':     'Rendszerkövetelmények',
  'wifite.req.linux':     'Linux (Kali / Parrot / Ubuntu) – teljes támogatás',
  'wifite.req.macos':     'macOS – wifite nem elérhető, nmap igen',
  'wifite.req.monitor':   'Monitor módot támogató WiFi kártya',
  'wifite.req.root':      'Root jogosultság',
  'nmap.title':           '🔍 Nmap Szkennelés',
  'nmap.info':            '<strong>Mi ez?</strong><br>Az <code>nmap</code> (Network Mapper) megvizsgálja, hogy egy hálózaton milyen gépek és nyitott portok vannak. Segít megérteni, mit "lát" egy külső szemlélő a hálózatodról.',
  'nmap.label.target':    'Cél IP cím / tartomány',
  'nmap.target.ph':       'pl. 192.168.1.1 vagy 192.168.1.0/24',
  'nmap.target.hint':     'Csak saját hálózatod! A /24 az egész alhálózatot jelenti.',
  'nmap.label.discovery': '🏓 Felderítés',
  'nmap.label.portscan':  '🔌 Port Scan',
  'nmap.label.service':   '🔬 Szolgáltatás elemzés',
  'nmap.label.vulnscan':  '🛡️ Sebezhetőség',
  'nmap.label.offensive': '💥 Offenzív / Speciális',
  'nmap.label.audit':     '💣 Teljes Audit',
  'nmap.ping.title':      'Ping Scan',
  'nmap.ping.desc':       'Ki van online?',
  'nmap.os.title':        'OS Detection',
  'nmap.os.desc':         'Op. rendszer',
  'nmap.mac.title':        'MAC + Gyártó',
  'nmap.mac.desc':         'ARP, LAN-only',
  'nmap.nbstat.title':     'NetBIOS',
  'nmap.nbstat.desc':      'Windows nevek',
  'nmap.traceroute.title': 'Traceroute',
  'nmap.traceroute.desc':  'Hálózati útvonal',
  'nmap.dnsbrute.title':   'DNS Brute',
  'nmap.dnsbrute.desc':    'Subdomének',
  'nmap.fast.title':      'Gyors',
  'nmap.fast.desc':       'Top 100 port',
  'nmap.full.title':      'Teljes',
  'nmap.full.desc':       'Top 1000 + OS*',
  'nmap.udp.title':       'UDP Scan',
  'nmap.udp.desc':        'DNS, DHCP, SNMP',
  'nmap.allports.title':  'Összes port',
  'nmap.allports.desc':   '65535, lassú',
  'nmap.stealth.title':   'Stealth SYN',
  'nmap.stealth.desc':    'Félkézfogásos',
  'nmap.ack.title':        'ACK Scan',
  'nmap.ack.desc':         'Tűzfal feltérképezés',
  'nmap.fin.title':        'FIN Scan',
  'nmap.fin.desc':         'FIN evasion',
  'nmap.null.title':       'NULL Scan',
  'nmap.null.desc':        'Flag nélkül',
  'nmap.xmas.title':       'Xmas Scan',
  'nmap.xmas.desc':        'FIN+PSH+URG',
  'nmap.ipproto.title':    'IP Proto',
  'nmap.ipproto.desc':     'Protokoll scan',
  'nmap.ports.title':     'Port + Verzió',
  'nmap.ports.desc':      'Top 100 + szoftver',
  'nmap.scripts.title':   'NSE Alap',
  'nmap.scripts.desc':    'Default scriptek',
  'nmap.banner.title':    'Banner Grab',
  'nmap.banner.desc':     'Szoftver fejléc',
  'nmap.auth.desc':          'Gyenge hitelesítés',
  'nmap.httpenum.title':     'HTTP Enum',
  'nmap.httpenum.desc':      'Web könyvtárak',
  'nmap.httpmethods.title':  'HTTP Methods',
  'nmap.httpmethods.desc':   'PUT, TRACE, DEL',
  'nmap.dbinfo.title':       'DB Info',
  'nmap.dbinfo.desc':        'MySQL, MSSQL',
  'nmap.vuln.desc':       'Sebezhetőségek',
  'nmap.smb.title':       'SMB Vuln',
  'nmap.smb.desc':        'EternalBlue, MS17',
  'nmap.httpvuln.title':  'HTTP Vuln',
  'nmap.httpvuln.desc':   'XSS, SQLi, CSRF',
  'nmap.ssl.title':          'SSL/TLS',
  'nmap.ssl.desc':           'Heartbleed, POODLE',
  'nmap.shellshock.title':   'Shellshock',
  'nmap.shellshock.desc':    'CVE-2014-6271',
  'nmap.rdpvuln.title':      'RDP Vuln',
  'nmap.rdpvuln.desc':       'MS12-020, port 3389',
  'nmap.dbvuln.title':       'DB Vuln',
  'nmap.dbvuln.desc':        'MySQL, MSSQL CVE',
  'nmap.malware.desc':       'Backdoor nyomok',
  'nmap.exploit.desc':       'Aktív exploitok',
  'nmap.brute.desc':         'Jelszó törés',
  'nmap.dos.desc':           'Túlterheléses seb.',
  'nmap.fuzzer.desc':        'Input fuzzelés',
  'nmap.decoy.title':        'Decoy',
  'nmap.decoy.desc':         'Hamis forrás IP-k',
  'nmap.frag.title':         'Fragmentálás',
  'nmap.frag.desc':          'IP tűzfal bypass',
  'nmap.discovery.desc':     'Részletes feltérk.',
  'nmap.audit.title':        'Teljes Audit',
  'nmap.audit.desc':         'Mindent egybe – lassú!',
  'nmap.btn.start':       'Indítás',
  'nmap.btn.stop':        'Leállítás',
  'nmap.install.title':   'Telepítés',
  'out.wifite.title':   'Terminal kimenet',
  'out.nmap.title':     'Szkennelés eredménye',
  'out.clear':          'Törlés',
  'out.export':         'Exportálás',
  'out.lines':          'sor',
  'out.filter_ph':      '🔍 szűrés...',
  'sum.networks':   'Hálózat',
  'sum.handshakes': 'Handshake',
  'sum.cracked':    'Feltörve',
  'sum.hosts':      'Host online',
  'sum.ports':      'Nyitott port',
  'sum.ips':        'Egyedi IP',
  'welcome.wifite.text': 'Etikus WiFi tesztelő környezet kezdőknek.',
  'welcome.wifite.hint': 'Konfiguráld a beállításokat, majd nyomj',
  'welcome.nmap.text':   'Network Mapper – hálózat feltérképező.',
  'welcome.nmap.hint':   'Add meg a cél IP-t, válassz típust, majd kattints',
  'welcome.btn':         'Indítás',
  'toast.wifite.start':   'Wifite elindítva...',
  'toast.wifite.ctrlc': 'Keresés leállítása — célpontlista betöltése…',
  'toast.wifite.done':    'Wifite szkennelés kész!',
  'toast.wifite.stop':    'Wifite leállítva',
  'toast.wifite.err':     'Hiba a wifite indításánál',
  'toast.nmap.start':     'Nmap szkennelés indult...',
  'toast.nmap.done':      'Nmap szkennelés kész!',
  'toast.nmap.stop':      'Nmap leállítva',
  'toast.nmap.err':       'Hiba a nmap indításánál',
  'toast.nmap.notarget':  'Add meg a cél IP-t!',
  'toast.export':         'Mentve',
  'toast.cleared':        'Terminal törölve.',
  'toast.macos.wifite':   'macOS: wifite nem támogatott',
  'term.end':     '── Szkennelés vége ──',
  'term.stopped': '── Manuálisan leállítva ──',
  'term.err':     'HIBA',
  'nmap.start.hint': 'Szkennelés indult:',
  'wifite.macos.hint': '⚠️ macOS-en a wifite nem elérhető – monitor mód WiFi adapter és Linux szükséges hozzá. Az nmap szkennelés viszont macOS-en is működik!',
  'guide.title': '📖 Kezdők útmutatója',
  'guide.eth.title': 'Mi az etikus tesztelés?',
  'guide.eth.body':  'Az etikus hacking (más nevén penetration testing vagy "pentest") azt jelenti, hogy <strong>saját engedélyeddel</strong> teszteled egy rendszer biztonságát. Célja a gyengeségek megtalálása, mielőtt egy rosszindulatú támadó megtenné.',
  'guide.eth.rule':  '<strong>Arany szabály:</strong> Csak olyan rendszert tesztelj, amelyhez <em>írásban</em> megkaptad az engedélyt, vagy a saját tulajdonod!',
  'guide.law.title': 'Jogi háttér (Magyarország)',
  'guide.law.body':  'Magyarországon a Btk. 375-376. §-a szabályozza az informatikai bűncselekményeket. Más hálózatán való engedély nélküli tesztelés <strong>büntetőjogi következményekkel</strong> jár.',
  'guide.law.rule':  '<strong>Biztonságos gyakorlás:</strong> Használj otthoni labort (Raspberry Pi, virtuális gépek), vagy regisztrálj egy CTF (Capture The Flag) platformra!',
  'guide.wifi.title': 'WiFi biztonsági szintek',
  'guide.ports.title': 'Fontosabb portok',
  'guide.next.title': 'Következő lépések',
  'guide.install.title': 'Telepítési útmutató',

  // --- NMAP UI LABELS ---
  'nmap.label.gen_cmd': 'Generált parancs',
  'nmap.label.live_prev': '(élő előnézet)',
  'nmap.label.custom_cmd': 'Egyéni parancs',
  'nmap.label.optional': '(opcionális)',
  'nmap.custom_cmd.ph': 'nmap -sV -p 22,80,443 192.168.1.1',
  'nmap.custom_cmd.hint': 'Ha ki van töltve, felülírja a fenti cél- és típusbeállításokat.',
  'nmap.label.sudo': 'Sudo mód',
  'nmap.label.root_priv': '(root jog)',
  'nmap.sudo.hint': 'Linux: OS/SYN/UDP scanhez · macOS: sudo npm start helyett',
  'nmap.right_panel.title': '📋 Port Referencia',

  // --- NMAP DYNAMIC INFO ---
  'nmap.si.label.what': 'Mit csinál?',
  'nmap.si.label.checks': 'Mit keres?',
  'nmap.si.label.next': 'Következő lépés',
  'nmap.si.ping.what': 'Megvizsgálja, mely eszközök aktívak a hálózaton. Nem szkenneli a portokat – csak azt kérdezi: "él-e a gép?"',
  'nmap.si.ping.checks': 'Online/offline állapot. LAN-on ARP requesteket küld, így MAC-cím és gyártó is megjelenik.',
  'nmap.si.ping.next': 'Folytasd Gyors vagy Port + Verzió scan-nel a talált hostok részletes vizsgálatához.',
  'nmap.si.os.what': 'A célgép operációs rendszerét azonosítja a TCP/IP csomag-viselkedés elemzésével – belépés nélkül.',
  'nmap.si.os.checks': 'TCP/IP stack fingerprint: TTL, Window Size, TCP options értékek. Pl. "Linux 5.x", "Windows 10 / Server 2019".',
  'nmap.si.os.next': 'Az OS alapján keresd a célzott CVE-ket az nvd.nist.gov adatbázisban, majd futtasd a Vuln scan-t.',
  'nmap.si.mac.what': 'ARP ping-gel tárja fel a helyi hálózat eszközeit, és kiírja MAC-címüket és gyártójukat.',
  'nmap.si.mac.checks': 'MAC → OUI gyártó azonosítás (pl. "Apple, Inc.", "Cisco Systems"). Csak LAN-on működik.',
  'nmap.si.mac.next': 'Ismeretlen gyártójú eszközöknél futtass Port Scan-t az adott IP-re a szolgáltatások azonosításához.',
  'nmap.si.nbstat.what': 'NetBIOS name service lekérdezés – Windows gépek számítógép-nevét, felhasználóját és workgroup-ját tárja fel.',
  'nmap.si.nbstat.checks': 'Számítógép neve, workgroup/domain neve, bejelentkezett felhasználó neve, MAC-cím.',
  'nmap.si.nbstat.next': 'A domain/workgroup info segít megérteni a hálózati struktúrát. Kombináld SMB Vuln scan-nel.',
  'nmap.si.traceroute.what': 'Megmutatja a hálózati útvonalat (hopokat) a saját gépedtől a célig – minden közbülső routert feltárja.',
  'nmap.si.traceroute.checks': 'Közbülső router IP-k és válaszidők. Láthatóvá válik a hálózati topológia és az esetleges szűrőpontok.',
  'nmap.si.traceroute.next': 'Magas RTT értékek tűzfalra vagy forgalomkorlátozásra utalhatnak. Érdemes a közbülső IP-ket is nmap-pel vizsgálni.',
  'nmap.si.dnsbrute.what': 'Szótáras módszerrel keres subdoméneket egy domainen belül – például mail.példa.hu, dev.példa.hu.',
  'nmap.si.dnsbrute.checks': 'Felfedett subdomének és hozzájuk tartozó IP-k. Dev/staging/admin subdomének komoly biztonsági kockázatot jelenthetnek.',
  'nmap.si.dnsbrute.next': 'Talált subdoméneket vizsgáld meg Port + Verzió és Vuln scan-nel. Az admin panelek különösen érzékenyek.',
  'nmap.si.discovery.what': 'Részletes hálózati feltérképezés: hostnames, DNS rekordok, NetBIOS nevek, SNMP és egyéb metaadatok.',
  'nmap.si.discovery.checks': 'Nyilvánosan elérhető szerviz-info, névfeloldás, hálózati topológia, SNMP community string-ek.',
  'nmap.si.discovery.next': 'Windows gépek esetén futtasd az SMB Vuln scan-t. Nyitott SNMP (161) esetén vizsgáld az snmp-info script eredményét.',
  'nmap.si.fast.what': 'A 100 leggyakoribb portot vizsgálja meg gyorsan. T4 timing: gyors, de naplózható.',
  'nmap.si.fast.checks': 'Nyitott portok listája: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 3389 (RDP), stb.',
  'nmap.si.fast.next': 'Nyitott portok esetén futtasd a Port + Verzió scan-t azonosításhoz, majd NSE Alap vagy Vuln scan-t.',
  'nmap.si.full.what': 'Az 1000 leggyakoribb port szkennelése verziódetektálással. Linux esetén OS azonosítás is fut.',
  'nmap.si.full.checks': 'Portok + szoftver verziószáma (pl. "Apache 2.4.29", "OpenSSH 7.4"). Régi verziók → ismert CVE-k.',
  'nmap.si.full.next': 'Régi szoftver esetén keresd a CVE-it az NVD-n. Futtasd a Vuln scan-t megerősítéshez.',
  'nmap.si.udp.what': 'UDP alapú szolgáltatásokat keres. Lassú (nincs ACK visszajelzés), de sok kritikus szolgáltatás UDP-t használ.',
  'nmap.si.udp.checks': 'DNS (53), DHCP (67/68), SNMP (161), NTP (123), NetBIOS (137). Nyitott SNMP céges adatokat szivárogtathat.',
  'nmap.si.udp.next': 'Nyitott SNMP (161) → tesztelés az snmp-info script-tel. Nyitott DNS → zone transfer kísérlet.',
  'nmap.si.allports.what': 'Mind a 65 535 portot átvizsgálja. Nagyon lassú, de megtalálja a nem-standard porton futó rejtett szolgáltatásokat.',
  'nmap.si.allports.checks': 'Nem szabványos porton futó backdoor-ok, rejtett admin panelek (pl. 8888, 9090), fejlesztői szerverek.',
  'nmap.si.allports.next': 'Ismeretlen porton futó szolgáltatásoknál futtass Banner Grab-ot az azonosításhoz.',
  'nmap.si.stealth.what': 'SYN-scan: a TCP kézfogás csak az első felét végzi el. Kevésbé naplózható mint a teljes TCP kapcsolat.',
  'nmap.si.stealth.checks': 'Nyitott portok feltérképezése kevesebb "zajjal". Ha SYN/ACK jön: nyitott. Ha RST: zárt.',
  'nmap.si.stealth.next': 'A talált nyitott portokra futtass Port + Verzió scan-t a szoftverek azonosításához, majd Vuln scan-t.',
  'nmap.si.ack.what': 'ACK csomagokat küld – NEM a portok nyitottságát, hanem a tűzfal szűrési szabályait térképezi fel.',
  'nmap.si.ack.checks': 'RST válasz → nincs tűzfal előtte (unfiltered). Nincs válasz → tűzfal szűri (filtered).',
  'nmap.si.ack.next': 'Kombináld Stealth SYN scan-nel: a "filtered" portok ellenőrzéséhez további technikák szükségesek.',
  'nmap.si.fin.what': 'FIN flag-gel küldött TCP csomagok – egyes állapot nélküli tűzfalak nem szűrik, így megkerülhetők.',
  'nmap.si.fin.checks': 'Nincs válasz → nyitott (vagy szűrt). RST → zárt. Windows általában RST-tel válaszol minden esetben.',
  'nmap.si.fin.next': 'Kombináld NULL és Xmas scan-nel a tűzfal bypass lehetőségek feltérképezéséhez.',
  'nmap.si.null.what': 'Egyetlen TCP flag sem kerül beállításra – szabályos TCP nem küld ilyen csomagot, ezért egyes IDS/tűzfal figyelmen kívül hagyja.',
  'nmap.si.null.checks': 'Nincs válasz → nyitott/szűrt. RST/ACK → zárt. Linuxon/Unix-on megbízható, Windowson kevésbé.',
  'nmap.si.null.next': 'Hasznos tűzfal bypass tesztelésre. Ha más scantípus blokkolt portot nyitottként jelez, érdekes anomália.',
  'nmap.si.xmas.what': 'FIN+PSH+URG flagek egyszerre – az összes "karácsonyfa fény" be van kapcsolva. RFC 793 szerinti viselkedés alapján azonosít.',
  'nmap.si.xmas.checks': 'Nyitott/szűrt: nincs válasz. Zárt: RST. Stateful tűzfalakat nem kerüli meg, de régi rendszereken hatékony.',
  'nmap.si.xmas.next': 'FIN/NULL/Xmas hármassal teszteld az IDS érzékenységét. Stateful firewall esetén térj vissza Stealth SYN-re.',
  'nmap.si.ipproto.what': 'Megállapítja, milyen IP-szintű protokollokat fogad el a célgép: TCP, UDP, ICMP, IGMP, GRE, stb.',
  'nmap.si.ipproto.checks': 'Elérhető IP protokollok listája. Szokatlan protokollok (pl. GRE, OSPF) VPN vagy routing infrastruktúrára utalnak.',
  'nmap.si.ipproto.next': 'Azonosított protokollok alapján célzott vizsgálat: pl. GRE → VPN tunnel felderítés.',
  'nmap.si.ports.what': 'Top 100 port szkennelése pontos verziódetektálással. Megmutatja, milyen szoftver fut az egyes portokon.',
  'nmap.si.ports.checks': 'Szoftvernév + verziószám minden nyitott porton. Régi verziók → ismert, kihasználható CVE-k.',
  'nmap.si.ports.next': 'Régi verziót találtál? Keresd meg az NVD-n (nvd.nist.gov) vagy Exploit-DB-n a CVE-it.',
  'nmap.si.scripts.what': 'Az alapértelmezett NSE scripteket futtatja verziódetektálással. Gyors, átfogó első audithoz ideális.',
  'nmap.si.scripts.checks': 'HTTP title, SSL cert, SSH hostkey, SMB security mode, FTP anonymous login, SMTP open relay.',
  'nmap.si.scripts.next': 'Anonymous FTP vagy gyenge SSL konfiguráció esetén futtasd a célzott SSL/TLS vagy SMB Vuln scan-t.',
  'nmap.si.banner.what': 'Nyitott portokra csatlakozik és rögzíti a szerver által önként elküldött fejléc (banner) szöveget.',
  'nmap.si.banner.checks': 'Szoftver neve és verzió amit a szerver elàrul (pl. "220 vsftpd 2.3.4", "SSH-2.0-OpenSSH_7.4").',
  'nmap.si.banner.next': 'A banner alapján azonosítsd a verziót és keresd CVE-jét. A vsftpd 2.3.4 pl. backdoor-t tartalmaz (port 6200)!',
  'nmap.si.auth.what': 'Alapértelmezett és üres jelszavakkal próbál bejelentkezni a talált szolgáltatásokba.',
  'nmap.si.auth.checks': 'FTP anonymous, HTTP basic auth bypass, Telnet/SSH default credentials, SNMP community "public".',
  'nmap.si.auth.next': 'Sikeres auth bypass esetén azonnal változtass jelszót! Auditáld az összes érintett szolgáltatást.',
  'nmap.si.httpenum.what': 'Webes könyvtárakat és ismert fájlokat keres a webszerveren szótáras módszerrel.',
  'nmap.si.httpenum.checks': '/admin, /login, /backup, /phpmyadmin, /wp-admin, robots.txt, .git könyvtárak és egyéb érzékeny útvonalak.',
  'nmap.si.httpenum.next': 'Talált admin felület → tesztelj brute-force-t vagy default credentialst. .git mappa → forráskód szivárgás!',
  'nmap.si.httpmethods.what': 'Megvizsgálja, milyen HTTP metódusokat engedélyez a webszerver (PUT, DELETE, TRACE, CONNECT stb.).',
  'nmap.si.httpmethods.checks': 'PUT/DELETE engedélyezett → fájlfeltöltés és törlés lehetséges. TRACE → XST (Cross-Site Tracing) támadás.',
  'nmap.si.httpmethods.next': 'PUT metódus = kritikus! Tesztelj fájlfeltöltést. TRACE aktív esetén tiltsd le a webszerver konfigban.',
  'nmap.si.dbinfo.what': 'MySQL, MSSQL, PostgreSQL és Oracle adatbázisszerverek verzióját és konfigurációs adatait kérdezi le.',
  'nmap.si.dbinfo.checks': 'DB szerver verziója, protokoll verziója, hitelesítési módok, anonymous/guest hozzáférés lehetősége.',
  'nmap.si.dbinfo.next': 'Régi DB verzió → keress CVE-t. Ha internetről elérhető az adatbázis port, az súlyos biztonsági probléma.',
  'nmap.si.vuln.what': 'Az összes ismert CVE-ellenőrző NSE scriptet lefuttatja. Általános, átfogó sebezhetőség-vizsgálat.',
  'nmap.si.vuln.checks': 'HTTP CSRF/XSS/SQLi, SMB EternalBlue (MS17-010), SSL Heartbleed (CVE-2014-0160), RDP MS12-020, stb.',
  'nmap.si.vuln.next': 'Minden CVE-találatnál keresd meg a részleteket az nvd.nist.gov-on. Kritikus esetén azonnali patch alkalmazása.',
  'nmap.si.smb.what': 'SMB (Windows fájlmegosztás) protokoll specifikus sebezhetőségeit ellenőrzi a 139 és 445 porton.',
  'nmap.si.smb.checks': 'MS17-010 (EternalBlue/WannaCry), MS08-067 (Conficker), CVE-2020-0796 (SMBGhost), SMB signing hiány.',
  'nmap.si.smb.next': 'EternalBlue/SMBGhost találat = kritikus! Azonnali Windows Update. Ideiglenesen: SMB port (445) tűzfalazása.',
  'nmap.si.httpvuln.what': 'HTTP/HTTPS webalkalmazás-sebezhetőségeket keres NSE scriptekkel a webszervereken.',
  'nmap.si.httpvuln.checks': 'CSRF tokenek hiánya, SQL injection, Stored/DOM XSS, HTTP TRACE engedélyezett, Drupal/WordPress CVE-k.',
  'nmap.si.httpvuln.next': 'SQL injection vagy XSS találat esetén futtasd Burp Suite-ot mélyebb elemzéshez. OWASP Top 10 alapján auditálj.',
  'nmap.si.ssl.what': 'SSL/TLS konfiguráció és ismert kritikus sebezhetőségek ellenőrzése a HTTPS portokon.',
  'nmap.si.ssl.checks': 'Heartbleed (CVE-2014-0160), POODLE (SSLv3), gyenge cipher suite-ok (RC4, DES, NULL), lejárt tanúsítvány.',
  'nmap.si.ssl.next': 'Heartbleed = azonnali OpenSSL frissítés + minden privát kulcs és jelszó csere. POODLE = SSLv3 letiltása.',
  'nmap.si.shellshock.what': 'CVE-2014-6271 Shellshock: a Bash shell sebezhető verziói HTTP User-Agent és egyéb fejléceken keresztül tetszőleges parancsot hajtanak végre.',
  'nmap.si.shellshock.checks': 'CGI scriptek és webszerverek Shellshock érzékenysége. Pozitív találat = távoli kódfuttatás lehetséges.',
  'nmap.si.shellshock.next': 'Shellshock találat = kritikus RCE! Azonnal frissítsd a Bash-t (bash 4.3 patch 25+). CGI-t kapcsold ki ha nem kell.',
  'nmap.si.rdpvuln.what': 'RDP (Remote Desktop) port sebezhetőségeit és titkosítási beállításait vizsgálja a 3389-es porton.',
  'nmap.si.rdpvuln.checks': 'MS12-020 (DoS/potenciális RCE), gyenge titkosítás (NLA hiánya), CredSSP sebezhetőségek.',
  'nmap.si.rdpvuln.next': 'MS12-020 találat → azonnali Windows Update. RDP-t tedd tűzfal mögé és engedélyezd az NLA hitelesítést.',
  'nmap.si.dbvuln.what': 'MySQL és MSSQL adatbázisszerverek ismert CVE sebezhetőségeit ellenőrzi célzottan.',
  'nmap.si.dbvuln.checks': 'MySQL auth bypass (CVE-2012-2122), MSSQL sa account, UDF privilege escalation, SQL injection a DB rétegben.',
  'nmap.si.dbvuln.next': 'DB auth bypass = azonnali patch + jelszócsere. SA account aktív = tiltsd le vagy korlátozd hálózati szinten.',
  'nmap.si.malware.what': 'Backdoor-okra és malware jelenlétére utaló nyomokat keres a nyitott portokon futó szolgáltatásoknál.',
  'nmap.si.malware.checks': 'vsftpd 2.3.4 backdoor (port 6200), IRC botnet kapcsolatok, ismert RAT portok, gyanús banner válaszok.',
  'nmap.si.malware.next': 'Backdoor találat = a rendszer kompromittált! Teljes forensic vizsgálat és újratelepítés javasolt.',
  'nmap.si.exploit.what': 'Aktívan megpróbálja kihasználni az ismert sebezhetőségeket NSE exploit scriptek segítségével.',
  'nmap.si.exploit.checks': 'Tényleges exploit kísérletek: auth bypass, remote code execution, privilege escalation tesztelés.',
  'nmap.si.exploit.next': '⚠️ Csak saját, kontrollált környezetben! Sikeres exploit = azonnali patch + incidenskezelési folyamat.',
  'nmap.si.brute.what': 'Jelszó brute-force támadást szimulál az összes elérhető hálózati protokollon.',
  'nmap.si.brute.checks': 'SSH, FTP, HTTP basic auth, Telnet, SMB, MySQL, PostgreSQL, RDP – gyenge vagy alapértelmezett jelszavak.',
  'nmap.si.brute.next': 'Sikeres belépés = azonnal változtass jelszót! Vezess be account lockout policy-t és fail2ban-t.',
  'nmap.si.dos.what': 'DoS sebezhetőségeket ellenőriz – NEM indít valódi támadást, csak a sérülékenység meglétét teszteli.',
  'nmap.si.dos.checks': 'Slowloris (HTTP DoS), ms-sql-dos, smb-flood és más DoS sérülékenységek jelenléte.',
  'nmap.si.dos.next': 'DoS sérülékenység esetén vezess be rate limiting-et, connection timeout-ot és WAF-ot.',
  'nmap.si.fuzzer.what': 'Véletlenszerű / hibás bemeneteket küld a szolgáltatásoknak crash és nem várt viselkedés kiváltásához.',
  'nmap.si.fuzzer.checks': 'Buffer overflow, input validation hibák, abnormális válaszok hálózati protokoll implementációkban.',
  'nmap.si.fuzzer.next': 'Crash vagy abnormális válasz = instabil implementáció. Frissítsd a szoftvert és kövesd a gyártói security advisory-kat.',
  'nmap.si.decoy.what': 'Valódi scant hajt végre, de 5 véletlenszerű hamis forrás IP-t is beilleszt – a célpont logjaiban nehéz azonosítani a valódi forrást.',
  'nmap.si.decoy.checks': 'A scan eredménye azonos a normál SYN scan-nel, de a forrás IP elfedett. IDS/IPS evasion technika.',
  'nmap.si.decoy.next': 'Csak saját hálózaton tesztelj! A hamis IP-k valódi gépekhez tartozhatnak, ne okozz nekik forgalmat.',
  'nmap.si.frag.what': 'A TCP fejléceket kis töredékekre (8 bájtos csomagokra) osztja szét – egyes régi tűzfalak nem tudják összerakni és átengedik.',
  'nmap.si.frag.checks': 'Tűzfal bypass: ha fragmentált scan eredménye eltér a normál scan-től, a tűzfal nem végez deep packet inspection-t.',
  'nmap.si.frag.next': 'Modern stateful tűzfalak és IPS rendszerek összera kják a töredékeket, de régi eszközök ellen hatékony lehet.',
  'nmap.si.audit.what': 'Teljes körű audit: verziódetektálás + OS + alapscriptek + sebezhetőség-ellenőrzés egyetlen menetben. Lassú!',
  'nmap.si.audit.checks': 'Mindent: nyitott portok, szoftver verziók, OS, default credentials, CVE sebezhetőségek, SSL hibák.',
  'nmap.si.audit.next': 'A legteljesebb kép a célrendszerről. Prioritizálj: kritikus → magas → közepes sorrendben javíts.',

  // --- NMAP PHASES ---
  'nmap.phase.1': 'Host Discovery',
  'nmap.phase.2': 'Port Scan',
  'nmap.phase.3': 'Szolgáltatás',
  'nmap.phase.4': 'NSE Scriptek',

  // --- NMAP MODALS ---
  'nmap.modal.hosts.title': '🖥️ Talált hostok',
  'nmap.modal.ports.title': '🔌 Nyitott portok',
  'nmap.modal.ips.title': '🌐 Egyedi IP-k',
  'nmap.modal.vuln.title': '🚨 Sebezhetőség találatok',
  'nmap.modal.error.title': '⚠️ Script hibák',
  'nmap.modal.empty.hosts': 'Nem találtunk hostot.',
  'nmap.modal.empty.ports': 'Nem találtunk nyitott portot.',
  'nmap.modal.empty.ips': 'Nem találtunk IP-t.',
  'nmap.modal.empty.vuln': 'Nem találtunk sebezhetőséget. 🎉',
  'nmap.modal.empty.error': 'Nincs script hiba.',
  'nmap.modal.error.hint': '💡 Script hibák oka: root jog hiánya, célpont nem válaszol az adott protokollra, vagy a script nem kompatibilis a célrendszerrel.',
  'nmap.modal.vuln.unknown': 'Ismeretlen vagy összetett sebezhetőség. Keresd meg a CVE azonosítót az <a href="https://nvd.nist.gov" target="_blank" rel="noopener" class="cve-link">nvd.nist.gov</a> oldalon a részletekért.',
  'nmap.modal.vuln.defense': '🛡️ Általános tanács: frissítsd az érintett szoftvert a legújabb verzióra, és ellenőrizd a gyártó security advisory-ját.',
  'nmap.modal.back': '← Vissza a port referenciához',

  // --- VULN SEVERITIES ---
  'severity.kritikus': 'KRITIKUS',
  'severity.magas': 'MAGAS',
  'severity.kozepes': 'KÖZEPES',
  'severity.alacsony': 'ALACSONY',

  // --- HISTORY ---
  'nmap.history.title': '📜 Scan előzmények',
  'nmap.history.empty': 'Még nincs scan előzmény.',
  'nmap.status.done': 'kész',
  'nmap.status.stopped': 'leáll.',
  'nmap.status.error': 'hiba',

  // --- EXPLANATIONS (from server) ---
  'nmap.ex.host_found': '🖥️ Új host (gép) találva a hálózaton! Ez egy eszköz, amely válaszolt a szkennelésre.',
  'nmap.ex.host_up': '✅ A gép online és elérhető.',
  'nmap.ex.port_filtered': '🔶 Szűrt port – tűzfal blokkolja, nem tudni biztosan nyitott-e.',
  'nmap.ex.port_closed': '🔒 Zárt port – a gép válaszol, de ezen a porton nincs aktív szolgáltatás.',
  'nmap.ex.mac_addr': '🔖 MAC cím – a hálózati kártya egyedi azonosítója. Ebből megállapítható a gyártó.',
  'nmap.ex.os_detected': '💻 Operációs rendszer észlelve! Az nmap a hálózati viselkedés alapján tippeli meg.',
  'nmap.ex.service_info': '⚙️ Szolgáltatás részletek – pontosabb info az adott porton futó szoftverről.',
  'nmap.ex.script.generic': '🔍 NSE script: {script} – automatikus biztonsági ellenőrzés.',
  'nmap.ex.script.error': '⚠️ A script hibába futott – lehet hogy root jog kell, vagy a célpont nem válaszol.',
  'nmap.ex.script.vuln_found': '🚨 Sebezhetőség találva! Ez valódi biztonsági probléma a célgépen.',
  'nmap.ex.script.not_vuln': '✅ Erre a sebezhetőségre nem sebezhető a célgép.',
  'nmap.ex.script.cve_found': '💀 {cve} – ismert publikus sebezhetőség azonosítója. Keresd meg a részleteit az NVD adatbázisban.',
  
  'nmap.badge.host': 'Host',
  'nmap.badge.port_open': 'Nyitott port',
  'nmap.badge.filtered': 'Szűrt',
  'nmap.badge.os': 'OS',
  'nmap.badge.vuln_found': 'TALÁLAT',

  'nmap.port.ex.21': '📁 FTP port – fájlátvitelhez. Régi és általában nem titkosított!',
  'nmap.port.ex.22': '🔐 SSH port – titkosított távoli belépés. Jó ha nyitva van, de brute-force támadások célpontja.',
  'nmap.port.ex.23': '⚠️ Telnet port – titkosítatlan távoli belépés. VESZÉLYES, kerülendő!',
  'nmap.port.ex.25': '📧 SMTP port – e-mail küldés. Nyílt relay esetén spam forrás lehet.',
  'nmap.port.ex.53': '🌐 DNS port – névfeloldás. Nyíltan kell futnia, de konfigurációs hibák lehetnek.',
  'nmap.port.ex.80': '🌍 HTTP port – titkosítatlan webszerver fut. Érdemes HTTPS-re váltani.',
  'nmap.port.ex.110': '📬 POP3 port – e-mail letöltés (titkosítatlan).',
  'nmap.port.ex.143': '📮 IMAP port – e-mail elérés (titkosítatlan verzió).',
  'nmap.port.ex.443': '🔒 HTTPS port – titkosított webszerver. Ez a biztonságos verzió!',
  'nmap.port.ex.445': '📂 SMB port – Windows fájlmegosztás. Ransomware-ek kedvenc célpontja!',
  'nmap.port.ex.3306': '🗄️ MySQL adatbázis port. Soha ne legyen internetről elérhető!',
  'nmap.port.ex.3389': '🖥️ RDP port – Windows távoli asztal. Brute-force és exploit célpont.',
  'nmap.port.ex.8080': '🌐 Alternatív HTTP port – fejlesztői szerverek, proxyk.',
  'nmap.port.ex.8443': '🔒 Alternatív HTTPS port.',
  'nmap.port.ex.generic': '🔌 Nyitott port – {service} szolgáltatás fut.',

  'wifite.ex.scanning': '📡 Wifite keresi az elérhető hálózatokat a közelben.',
  'wifite.ex.network_found': '🔍 Talált hálózat! Az oszlopok: sorszám, SSID (név), csatorna, titkosítás típusa, jelerősség.',
  'wifite.ex.handshake_captured': '🤝 WPA Handshake elfogva! Ez egy titkosított "kézfogás" a router és egy kliens között.',
  'wifite.ex.pmkid_captured': '🔑 PMKID elfogva! Modern módszer WPA2 hálózatok tesztelésére.',
  'wifite.ex.cracked': '✅ Jelszó megtalálva! Ez mutatja, hogy a hálózat gyenge jelszót használ.',
  'wifite.ex.failed': '❌ Ez a lépés nem sikerült. Lehetséges ok: nincs kliens csatlakozva, vagy a jel gyenge.',
  'wifite.ex.deauth': '📤 Deauthentication csomag küldve – lekapcsolja a klienst az elfogáshoz.',
  'wifite.ex.wps_test': '📌 WPS (Wi-Fi Protected Setup) tesztelés.',
  'wifite.ex.warning': '⚠️ Figyelmeztetés – érdemes elolvasni.',
  'wifite.ex.success': '✅ Sikeres művelet.',
  
  'wifite.badge.network': 'Hálózat',
  'wifite.badge.handshake': 'Handshake!',
  'wifite.badge.pmkid': 'PMKID!',
  'wifite.badge.cracked': 'Feltörve!',
};
