const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const PLATFORM = os.platform(); // 'linux', 'darwin', 'win32'
const IS_MAC   = PLATFORM === 'darwin';
const IS_LINUX = PLATFORM === 'linux';

// sudo elveszíti a PATH-t, ezért teljes elérési út kell; which nmap megtalálja mindkét platformon
const { execSync } = require('child_process');
let NMAP_FULL_PATH = IS_LINUX ? '/usr/bin/nmap' : '/opt/homebrew/bin/nmap';
try {
  const found = execSync('which nmap', { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim();
  if (found) NMAP_FULL_PATH = found;
} catch {}

function nmapSpawnArgs(nmapArgs, useSudo) {
  if (!useSudo) return [NMAP_FULL_PATH, nmapArgs];
  return ['sudo', ['-n', NMAP_FULL_PATH, ...nmapArgs]];
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Aktív folyamatok tárolása
const activeProcesses = {};

// Nmap leállítása
app.post('/api/nmap/stop', (req, res) => {
  if (activeProcesses['nmap']) {
    activeProcesses['nmap'].kill('SIGINT');
    delete activeProcesses['nmap'];
    io.emit('nmap:done', { code: null, summary: null, stopped: true });
    res.json({ status: 'stopped' });
  } else {
    res.json({ status: 'not_running' });
  }
});

// OS info endpoint
app.get('/api/system', (req, res) => {
  res.json({ platform: PLATFORM, isMac: IS_MAC, isLinux: IS_LINUX });
});

// Wifite futtatása
app.post('/api/wifite/start', (req, res) => {
  if (IS_MAC) {
    return res.json({ status: 'unsupported', message: 'A wifite macOS-en nem támogatott. Monitor mód WiFi kártyát és Linuxot igényel.' });
  }
  const { args = [] } = req.body;

  // Biztonsági ellenőrzés: csak engedélyezett argumentumok
  const allowedArgs = ['--wep', '--wpa', '--wps', '--pmkid', '--kill', '--random-mac', '--no-wps', '-i'];
  const safeArgs = args.filter(a => allowedArgs.some(allowed => a.startsWith(allowed)));

  res.json({ status: 'started', message: 'Wifite elindult...' });

  // Kis késleltetés, hogy a socket feliratkozhasson
  setTimeout(() => {
    try {
      const proc = spawn('wifite', ['--kill', ...safeArgs], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      activeProcesses['wifite'] = proc;
      io.emit('wifite:start');

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            const parsed = parseWifiteLine(line);
            io.emit('wifite:output', parsed);
          }
        });
      });

      proc.stderr.on('data', (data) => {
        io.emit('wifite:output', {
          raw: data.toString(),
          type: 'warning',
          explanation: 'wifite.ex.stderr'
        });
      });

      proc.on('close', (code) => {
        delete activeProcesses['wifite'];
        io.emit('wifite:done', { code });
      });

      proc.on('error', (err) => {
        io.emit('wifite:error', {
          message: err.message,
          hint: 'wifite.err.not_installed'
        });
      });
    } catch (e) {
      io.emit('wifite:error', { message: e.message });
    }
  }, 500);
});

// Wifite leállítása
app.post('/api/wifite/stop', (req, res) => {
  if (activeProcesses['wifite']) {
    activeProcesses['wifite'].kill('SIGINT');
    delete activeProcesses['wifite'];
    res.json({ status: 'stopped' });
  } else {
    res.json({ status: 'not_running' });
  }
});

// Nmap futtatása
app.post('/api/nmap/scan', (req, res) => {
  const { target, scanType = 'basic', customCmd, useSudo = false } = req.body;

  if (customCmd) {
    const BLOCKED = /[;&|><`$(){}[\]\\]/;
    if (BLOCKED.test(customCmd)) {
      return res.status(400).json({ error: 'nmap.err.blocked_char' });
    }
    const raw = customCmd.trim().replace(/^nmap\s+/i, '');
    const nmapArgs = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    if (!nmapArgs.length) {
      return res.status(400).json({ error: 'nmap.err.empty_cmd' });
    }
    res.json({ status: 'started' });
    setTimeout(() => {
      try {
        const [exe, args] = nmapSpawnArgs(nmapArgs, useSudo);
        const proc = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        activeProcesses['nmap'] = proc;
        io.emit('nmap:start', { target: nmapArgs.at(-1) || '', scanType: 'custom', useSudo });
        let fullOutput = '';
        let stderrBuf  = '';
        const startMs  = Date.now();
        proc.stdout.on('data', data => {
          const text = data.toString();
          fullOutput += text;
          text.split('\n').forEach(line => { if (line.trim()) io.emit('nmap:output', parseNmapLine(line)); });
        });
        proc.stderr.on('data', data => {
          stderrBuf += data.toString();
          io.emit('nmap:output', { raw: data.toString().trim(), type: 'warning' });
        });
        proc.on('close', code => {
          delete activeProcesses['nmap'];
          const elapsed = Date.now() - startMs;
          if (code !== 0 && elapsed < 4000 && !fullOutput.trim()) {
            io.emit('nmap:error', {
              message: stderrBuf.trim() || `nmap.err.exited`,
              hint: useSudo ? 'nmap.err.sudo_failed' : 'nmap.err.check_install'
            });
          } else {
            io.emit('nmap:done', { code, summary: buildNmapSummary(fullOutput), stderrHint: code !== 0 ? stderrBuf.trim() : null });
          }
        });
        proc.on('error', err => io.emit('nmap:error', { message: err.message, hint: 'nmap.err.not_installed' }));
      } catch (e) { io.emit('nmap:error', { message: e.message }); }
    }, 300);
    return;
  }

  if (!target || !isValidTarget(target)) {
    return res.status(400).json({ error: 'nmap.err.invalid_target' });
  }

  const scanProfiles = {
    ping:       ['-sn', target],
    os:         IS_LINUX ? ['-O', '--top-ports', '50', target] : ['-sV', '--top-ports', '50', target],
    mac:        ['-sn', '-PR', target],
    nbstat:     ['--script=nbstat', '-p', '137,139', target],
    traceroute: ['--traceroute', '-sn', target],
    dnsbrute:   ['--script=dns-brute', target],
    discovery:  ['--script=discovery', '--top-ports', '100', target],
    fast:      ['-T4', '-F', target],
    full:      IS_LINUX ? ['-sV', '-O', '--top-ports', '1000', target] : ['-sV', '--top-ports', '1000', target],
    udp:       IS_LINUX ? ['-sU', '--top-ports', '100', target] : ['-sU', '--top-ports', '20', target],
    allports:  ['-p-', '-T4', '--open', target],
    stealth:   IS_LINUX ? ['-sS', '-T4', '--top-ports', '1000', target] : ['-sT', '-T4', '--top-ports', '1000', target],
    ack:       IS_LINUX ? ['-sA', '--top-ports', '100', target] : ['-sT', '-sV', '--top-ports', '100', target],
    fin:       ['-sF', '-T4', '--top-ports', '1000', target],
    null:      ['-sN', '-T4', '--top-ports', '1000', target],
    xmas:      ['-sX', '-T4', '--top-ports', '1000', target],
    ipproto:   ['-sO', target],
    ports:       ['-sV', '--top-ports', '100', target],
    scripts:     ['-sC', '-sV', '--top-ports', '100', target],
    banner:      ['--script=banner', '--top-ports', '100', target],
    auth:        ['--script=auth', '--top-ports', '50', target],
    httpenum:    ['--script=http-enum', '-p', '80,443,8080,8443', target],
    httpmethods: ['--script=http-methods', '-p', '80,443,8080,8443', target],
    dbinfo:      ['--script=mysql-info,ms-sql-info', '-p', '1433,3306,5432,1521', target],
    vuln:       ['--script=vuln', '--top-ports', '50', target],
    smb:        ['--script', 'smb-vuln*', '-p', '139,445', target],
    httpvuln:   ['--script', 'http-vuln*', '--top-ports', '20', target],
    ssl:        ['--script=ssl-heartbleed,ssl-poodle,ssl-enum-ciphers', '-p', '443,8443', target],
    shellshock: ['--script=http-shellshock', '-p', '80,443,8080', target],
    rdpvuln:    ['--script=rdp-enum-encryption,rdp-vuln-ms12-020', '-p', '3389', target],
    dbvuln:     ['--script', 'mysql-vuln*,ms-sql-vuln*', '-p', '1433,3306', target],
    malware:    ['--script=malware', '--top-ports', '50', target],
    exploit:    ['--script=exploit', '--top-ports', '50', target],
    brute:  ['--script=brute', '--top-ports', '20', target],
    dos:    ['--script=dos', '--top-ports', '20', target],
    fuzzer: ['--script=fuzzer', '--top-ports', '10', target],
    decoy:  IS_LINUX ? ['-sS', '-D', 'RND:5', '-T2', '--top-ports', '100', target] : ['-sT', '-D', 'RND:5', '-T2', '--top-ports', '100', target],
    frag:   IS_LINUX ? ['-sS', '-f', '-T2', '--top-ports', '100', target]           : ['-sT', '-f', '-T2', '--top-ports', '100', target],
    audit:     IS_LINUX
                 ? ['-sV', '-sC', '-O', '-T4', '--top-ports', '1000', '--script=vuln', target]
                 : ['-sV', '-sC', '-T4', '--top-ports', '1000', '--script=vuln', target],
  };

  const nmapArgs = scanProfiles[scanType] || scanProfiles.ping;
  res.json({ status: 'started' });

  setTimeout(() => {
    try {
      const [exe, args] = nmapSpawnArgs(nmapArgs, useSudo);
      const proc = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      activeProcesses['nmap'] = proc;
      io.emit('nmap:start', { target, scanType, useSudo });

      let fullOutput = '';
      let stderrBuf  = '';
      const startMs  = Date.now();

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        fullOutput += text;
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            const parsed = parseNmapLine(line);
            io.emit('nmap:output', parsed);
          }
        });
      });

      proc.stderr.on('data', (data) => {
        stderrBuf += data.toString();
        io.emit('nmap:output', { raw: data.toString().trim(), type: 'warning' });
      });

      proc.on('close', (code) => {
        delete activeProcesses['nmap'];
        const elapsed = Date.now() - startMs;
        if (code !== 0 && elapsed < 4000 && !fullOutput.trim()) {
          io.emit('nmap:error', {
            message: stderrBuf.trim() || `nmap.err.exited`,
            hint: useSudo ? 'nmap.err.sudo_failed' : 'nmap.err.check_install'
          });
        } else {
          io.emit('nmap:done', { code, summary: buildNmapSummary(fullOutput), stderrHint: code !== 0 ? stderrBuf.trim() : null });
        }
      });

      proc.on('error', (err) => {
        io.emit('nmap:error', { message: err.message, hint: 'nmap.err.not_installed' });
      });
    } catch (e) {
      io.emit('nmap:error', { message: e.message });
    }
  }, 300);
});

// ─── Parser függvények ───────────────────────────────────────────────

function parseWifiteLine(line) {
  const result = { raw: line, type: 'info', explanation: '', badge: null };

  if (line.includes('scanning') || line.includes('Scanning')) {
    result.type = 'scan';
    result.explanation = 'wifite.ex.scanning';
  } else if (line.match(/\d+\.\s+\w+\s+\d+\s+(WPA|WEP|WPS)/i)) {
    result.type = 'network';
    result.explanation = 'wifite.ex.network_found';
    result.badge = 'wifite.badge.network';
  } else if (line.toLowerCase().includes('wpa handshake')) {
    result.type = 'success';
    result.explanation = 'wifite.ex.handshake_captured';
    result.badge = 'wifite.badge.handshake';
  } else if (line.toLowerCase().includes('pmkid')) {
    result.type = 'success';
    result.explanation = 'wifite.ex.pmkid_captured';
    result.badge = 'wifite.badge.pmkid';
  } else if (line.toLowerCase().includes('cracked') || line.toLowerCase().includes('key:')) {
    result.type = 'cracked';
    result.explanation = 'wifite.ex.cracked';
    result.badge = 'wifite.badge.cracked';
  } else if (line.toLowerCase().includes('failed') || line.toLowerCase().includes('hiba')) {
    result.type = 'error';
    result.explanation = 'wifite.ex.failed';
  } else if (line.toLowerCase().includes('deauth')) {
    result.type = 'action';
    result.explanation = 'wifite.ex.deauth';
  } else if (line.toLowerCase().includes('wps')) {
    result.type = 'wps';
    result.explanation = 'wifite.ex.wps_test';
  } else if (line.includes('[!]')) {
    result.type = 'warning';
    result.explanation = 'wifite.ex.warning';
  } else if (line.includes('[+]')) {
    result.type = 'success';
    result.explanation = 'wifite.ex.success';
  }

  return result;
}

function parseNmapLine(line) {
  const result = { raw: line, type: 'info', explanation: '', badge: null };

  if (line.startsWith('Nmap scan report')) {
    result.type = 'host';
    result.explanation = 'nmap.ex.host_found';
    result.badge = 'nmap.badge.host';
  } else if (line.includes('Host is up')) {
    result.type = 'success';
    const latency = line.match(/\((.*?)\)/)?.[1] || '';
    result.explanation = 'nmap.ex.host_up';
    result.data = { latency };
  } else if (line.match(/^\d+\/tcp\s+open/)) {
    result.type = 'port-open';
    const [portProto, state, service] = line.trim().split(/\s+/);
    result.explanation = getPortExplanationKey(portProto);
    result.badge = 'nmap.badge.port_open';
    result.data = { portProto, service };
  } else if (line.match(/^\d+\/tcp\s+filtered/)) {
    result.type = 'port-filtered';
    result.explanation = 'nmap.ex.port_filtered';
    result.badge = 'nmap.badge.filtered';
  } else if (line.match(/^\d+\/tcp\s+closed/)) {
    result.type = 'port-closed';
    result.explanation = 'nmap.ex.port_closed';
  } else if (line.toLowerCase().includes('mac address')) {
    result.type = 'mac';
    result.explanation = 'nmap.ex.mac_addr';
  } else if (line.toLowerCase().includes('os details') || line.toLowerCase().includes('running:')) {
    result.type = 'os';
    result.explanation = 'nmap.ex.os_detected';
    result.badge = 'nmap.badge.os';
  } else if (line.toLowerCase().includes('service info')) {
    result.type = 'service';
    result.explanation = 'nmap.ex.service_info';
  } else if (line.startsWith('|')) {
    parseNmapScriptLine(line, result);
  }

  return result;
}

function parseNmapScriptLine(line, result) {
  const l = line.toLowerCase();
  const scriptHeader = line.match(/^\|[_]? ([\w\-]+):/);
  if (scriptHeader && /^[a-z]/.test(scriptHeader[1])) {
    const script = scriptHeader[1].toLowerCase();
    result.type = 'detail';
    const scriptKeys = {
      'http-csrf':           { type: 'warning', badge: 'nmap.badge.csrf',     ex: 'nmap.ex.script.csrf' },
      'http-sql-injection':  { type: 'warning', badge: 'nmap.badge.sqli',     ex: 'nmap.ex.script.sqli' },
      'http-stored-xss':     { type: 'warning', badge: 'nmap.badge.xss',      ex: 'nmap.ex.script.xss' },
      'http-dombased-xss':   { type: 'warning', badge: 'nmap.badge.domxss',   ex: 'nmap.ex.script.domxss' },
      'ssl-heartbleed':      { type: 'danger',  badge: 'nmap.badge.bleed',    ex: 'nmap.ex.script.bleed' },
      'ssl-poodle':          { type: 'danger',  badge: 'nmap.badge.poodle',   ex: 'nmap.ex.script.poodle' },
      'smb-vuln-ms17-010':   { type: 'danger',  badge: 'nmap.badge.eternal',  ex: 'nmap.ex.script.eternal' },
      'http-title':          { type: 'info',    badge: 'nmap.badge.title',    ex: 'nmap.ex.script.title' },
      'http-server-header':  { type: 'info',    badge: 'nmap.badge.server',   ex: 'nmap.ex.script.server' },
      'ssh-hostkey':         { type: 'info',    badge: 'nmap.badge.sshkey',   ex: 'nmap.ex.script.sshkey' },
      'ssh-auth-methods':    { type: 'info',    badge: 'nmap.badge.sshauth',  ex: 'nmap.ex.script.sshauth' },
      'ftp-anon':            { type: 'warning', badge: 'nmap.badge.anonftp',  ex: 'nmap.ex.script.anonftp' },
      'ftp-bounce':          { type: 'warning', badge: 'nmap.badge.bounce',   ex: 'nmap.ex.script.bounce' },
      'smb-security-mode':   { type: 'info',    badge: 'nmap.badge.smbsec',   ex: 'nmap.ex.script.smbsec' },
      'rdp-vuln-ms12-020':   { type: 'danger',  badge: 'nmap.badge.rdpvuln',  ex: 'nmap.ex.script.rdpvuln' },
    };
    const k = scriptKeys[script];
    if (k) {
      result.type = k.type; result.badge = k.badge; result.explanation = k.ex;
    } else {
      result.badge = script.replace('http-','').replace('ssl-','').replace('smb-','').toUpperCase().slice(0,12);
      result.explanation = 'nmap.ex.script.generic';
      result.data = { script };
    }
    return;
  }
  if (l.includes('error') || l.includes('failed')) {
    result.type = 'warning'; result.explanation = 'nmap.ex.script.error'; return;
  }
  if (l.includes('found') && (l.includes('vulnerabilit') || l.includes('injection') || l.includes('xss') || l.includes('csrf'))) {
    result.type  = 'cracked'; result.badge = 'nmap.badge.vuln_found'; result.explanation = 'nmap.ex.script.vuln_found'; return;
  }
  if (l.includes("couldn't find") || l.includes('not vulnerable') || l.includes('no vulnerability')) {
    result.type = 'success'; result.explanation = 'nmap.ex.script.not_vuln'; return;
  }
  if (line.match(/CVE-\d{4}-\d+/i)) {
    result.type = 'danger'; result.badge = 'CVE';
    const cve = line.match(/CVE-\d{4}-\d+/i)[0];
    result.explanation = 'nmap.ex.script.cve_found';
    result.data = { cve };
    return;
  }
  result.type = 'detail';
}

function getPortExplanationKey(portProto) {
  const port = parseInt(portProto);
  const keys = { 21:'nmap.port.ex.21', 22:'nmap.port.ex.22', 23:'nmap.port.ex.23', 25:'nmap.port.ex.25', 53:'nmap.port.ex.53', 80:'nmap.port.ex.80', 110:'nmap.port.ex.110', 143:'nmap.port.ex.143', 443:'nmap.port.ex.443', 445:'nmap.port.ex.445', 3306:'nmap.port.ex.3306', 3389:'nmap.port.ex.3389', 8080:'nmap.port.ex.8080', 8443:'nmap.port.ex.8443' };
  return keys[port] || 'nmap.port.ex.generic';
}

function buildNmapSummary(output) {
  const hosts     = (output.match(/Host is up/g) || []).length;
  const openPorts = (output.match(/open/g) || []).length;
  const ips       = output.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];

  const vulnLines = [];
  const errorLines = [];
  const seenKeys  = new Set();

  output.split('\n').forEach(line => {
    const l       = line.toLowerCase();
    const trimmed = line.trim();
    if (!trimmed) return;

    const cveMatch = trimmed.match(/CVE-\d{4}-\d+/i);
    if (cveMatch) {
      const key = cveMatch[0].toUpperCase();
      if (!seenKeys.has(key)) { seenKeys.add(key); vulnLines.push(key); }
      return;
    }

    if (l.includes('found') && (l.includes('vulnerabilit') || l.includes('injection') || l.includes('xss') || l.includes('csrf'))) {
      const key = trimmed.slice(0, 80);
      if (!seenKeys.has(key)) { seenKeys.add(key); vulnLines.push(trimmed); }
      return;
    }

    if (/^\|\s*(likely )?vulnerable\s*:?\s*$/i.test(l) || /state:\s*(likely )?vulnerable/i.test(l)) return;

    if (l.includes('vulnerable') && !l.includes('not vulnerable')) {
      const key = trimmed.slice(0, 80);
      if (!seenKeys.has(key)) { seenKeys.add(key); vulnLines.push(trimmed); }
    }

    if (trimmed.startsWith('|') && (l.includes('error') || l.includes('failed'))) {
      errorLines.push(trimmed);
    }
  });

  return {
    hosts, openPorts,
    ips:    [...new Set(ips)],
    vulns:  vulnLines,
    errors: errorLines
  };
}

function isValidTarget(target) {
  return /^[a-zA-Z0-9.\-\/]+$/.test(target) && !target.includes(';') && !target.includes('&') && !target.includes('|');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🛡️  EthTest szerver fut: http://localhost:${PORT}`);
});
