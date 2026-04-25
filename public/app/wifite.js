// ── Wifite indítás / leállítás ────────────────────────────────────────
document.getElementById('wifiteStart').addEventListener('click', async () => {
  if (state.wifite.running) return;

  const mode = document.querySelector('input[name="wifiteMode"]:checked')?.value || 'wpa';
  const args = [];
  if (mode === 'wpa') args.push('--wpa');
  if (mode === 'wps') args.push('--wps');
  if (document.getElementById('optKill').checked)      args.push('--kill');
  if (document.getElementById('optRandomMac').checked) args.push('--random-mac');

  const res = await fetch('/api/wifite/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args })
  });
  const data = await res.json();

  if (data.status === 'unsupported') {
    toast(t('toast.macos.wifite'), 'warning');
    renderLine({ raw: data.message, type: 'warning', explanation: 'A wifite csak Linuxon érhető el.' }, 'wifiteOutput');
  }
});

document.getElementById('wifiteStop').addEventListener('click', async () => {
  await fetch('/api/wifite/stop', { method: 'POST' });
});

// ── Törlés / exportálás ───────────────────────────────────────────────
document.getElementById('wifiteClear').addEventListener('click', () => {
  document.getElementById('wifiteOutput').innerHTML = '';
  state.wifite.lines      = [];
  state.wifite.networks   = 0;
  state.wifite.handshakes = 0;
  state.wifite.cracked    = 0;
  updateLineCount('wifiteOutput', 'wifiteLineCount');
  toast(t('toast.cleared'), 'info');
});

document.getElementById('wifiteExport').addEventListener('click', () => {
  const lines = [...document.getElementById('wifiteOutput').querySelectorAll('.t-line')]
    .map(l => l.querySelector('.t-raw')?.textContent || '').join('\n');
  downloadText(lines, 'wifite_scan.txt');
});

// ── Wifite socket események ───────────────────────────────────────────
socket.on('wifite:start', () => {
  state.wifite.running    = true;
  state.wifite.lines      = [];
  state.wifite.networks   = 0;
  state.wifite.handshakes = 0;
  state.wifite.cracked    = 0;
  document.getElementById('wifiteStart').disabled = true;
  document.getElementById('wifiteStop').disabled  = false;
  document.getElementById('wifiteSummary').style.display = 'none';
  setStatus('running', t('status.running.wifite'));
  toast(t('toast.wifite.start'), 'info');
});

socket.on('wifite:output', data => {
  state.wifite.lines.push(data);
  renderLine(data, 'wifiteOutput');
  updateLineCount('wifiteOutput', 'wifiteLineCount');

  if (data.type === 'network')                                  state.wifite.networks++;
  if (data.badge === 'Handshake!' || data.badge === 'PMKID!') state.wifite.handshakes++;
  if (data.type === 'cracked')                                  state.wifite.cracked++;

  document.querySelector('#sumNetworks .sum-value').textContent   = state.wifite.networks;
  document.querySelector('#sumHandshakes .sum-value').textContent = state.wifite.handshakes;
  document.querySelector('#sumCracked .sum-value').textContent    = state.wifite.cracked;
});

socket.on('wifite:done', ({ code }) => {
  state.wifite.running = false;
  document.getElementById('wifiteStart').disabled = false;
  document.getElementById('wifiteStop').disabled  = true;
  setStatus('idle', t('status.done.wifite'));
  document.getElementById('wifiteSummary').style.display = 'flex';
  toast(code === 0 ? t('toast.wifite.done') : t('toast.wifite.stop'), code === 0 ? 'success' : 'warning');
});

socket.on('wifite:error', ({ message, hint }) => {
  state.wifite.running = false;
  document.getElementById('wifiteStart').disabled = false;
  document.getElementById('wifiteStop').disabled  = true;
  setStatus('error', t('status.error'));
  renderLine({ raw: `Hiba: ${message}`, type: 'error', explanation: hint || '' }, 'wifiteOutput');
  toast(message, 'error');
});
