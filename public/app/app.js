// ── i18n init ─────────────────────────────────────────────
applyTranslations();
const langSelect = document.getElementById('langSelect');
langSelect.value = currentLang;
langSelect.addEventListener('change', () => setLanguage(langSelect.value));

// ── Socket kapcsolat ──────────────────────────────────────
const socket = io();

// ── Állapot ───────────────────────────────────────────────
const state = {
  wifite: { running: false, lines: [], networks: 0, handshakes: 0, cracked: 0 },
  nmap:   { running: false, lines: [] }
};

// ── Tab navigáció ──────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (tab === 'home')  loadDoc('guide', 'home');
    if (tab === 'guide') loadDoc('guide', 'guide');
  });
});

// ── Dokumentáció betöltése ────────────────────────────────
async function loadDoc(docName, context = 'home') {
  const contentArea = context === 'guide'
    ? document.getElementById('guideContent')
    : document.querySelector('#tab-home .wiki-content');
  const linkClass = context === 'guide' ? '.guide-nav-link' : '#tab-home .wiki-nav-link';

  document.querySelectorAll(linkClass).forEach(l => {
    l.classList.remove('active');
    if (l.getAttribute('href') === `#${docName}`) l.classList.add('active');
  });

  try {
    const langUrl = `/docs/${docName}.${currentLang}.html`;
    const baseUrl = `/docs/${docName}.html`;
    let response = await fetch(langUrl);
    if (!response.ok) response = await fetch(baseUrl);
    if (!response.ok) throw new Error(`${baseUrl}`);
    contentArea.innerHTML = await response.text();
    applyTranslations();
  } catch (err) {
    contentArea.innerHTML = `<div class="error-msg">${t('doc.load.error') || 'Error loading doc'}: ${err.message}</div>`;
  }
}

// Sidebar linkek
document.addEventListener('click', (e) => {
  const link = e.target.closest('.wiki-nav-link');
  if (!link) return;
  e.preventDefault();
  loadDoc(link.getAttribute('href').replace('#', ''), link.classList.contains('guide-nav-link') ? 'guide' : 'home');
});

// ── Oldal init ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tab-home').classList.contains('active')) {
    loadDoc('guide', 'home');
  }
});

// ── Státusz ───────────────────────────────────────────────
function setStatus(state, text) {
  document.getElementById('statusDot').className = `status-dot ${state}`;
  document.getElementById('statusText').textContent = text;
}

// ── Toast ─────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = t(msg); // Localized toast
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── CVE linkesítés ────────────────────────────────────────
function linkifyCVEs(text) {
  const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return safe.replace(/CVE-\d{4}-\d+/gi, m =>
    `<a href="https://nvd.nist.gov/vuln/detail/${m}" target="_blank" rel="noopener" class="cve-link">${m}</a>`
  );
}

// ── Terminal sor renderelése ──────────────────────────────
function renderLine(data, terminalId) {
  const terminal = document.getElementById(terminalId);
  if (!terminal) return;
  terminal.querySelector('.terminal-welcome')?.remove();

  const line = document.createElement('div');
  line.className = `t-line ${data.type || 'info'}`;

  const rawSpan = document.createElement('span');
  rawSpan.className = 't-raw';
  rawSpan.innerHTML = linkifyCVEs(data.raw || '');
  line.appendChild(rawSpan);

  if (data.badge) {
    const badge = document.createElement('span');
    badge.className = `t-badge ${data.type || ''}`;
    badge.textContent = t(data.badge);
    line.appendChild(badge);
  }

  if (data.explanation) {
    const exp = document.createElement('div');
    exp.className = 't-exp';
    let text = t(data.explanation);
    if (data.data) {
      Object.entries(data.data).forEach(([key, val]) => {
        text = text.replace(`{${key}}`, val);
      });
    }
    exp.innerHTML = text;
    line.appendChild(exp);
  }

  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// ── Line count frissítése ─────────────────────────────────
function updateLineCount(terminalId, countId) {
  const count = document.getElementById(terminalId).querySelectorAll('.t-line').length;
  const el = document.getElementById(countId);
  if (el) el.textContent = `${count} ${t('out.lines')}`;
}

// ── Letöltés ──────────────────────────────────────────────
function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast('toast.export', 'success');
}
