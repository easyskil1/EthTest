/* EthTest Konzol — vállalati elrendezésű felület a meglévő Flask backendre kötve.
   A motor (app.py) és a végpontok változatlanok; ez csak a felület.
   Fordítások: a /lang/*.js + i18n.js adja a t()-t (a terminál-magyarázatok, badge-ek). */
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const tHM=t=>{const d=new Date(t);return p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds());};
const tDate=t=>{const d=new Date(t);return d.getFullYear()+'.'+p2(d.getMonth()+1)+'.'+p2(d.getDate())+' '+p2(d.getHours())+':'+p2(d.getMinutes());};
const TR=(k)=>{try{return (typeof t==='function')?t(k):k;}catch(e){return k;}};
function svg(p,w){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||1.8}" stroke-linejoin="round" stroke-linecap="round">${p}</svg>`;}
const store={get(k,d){try{const v=localStorage.getItem('eth-'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('eth-'+k,JSON.stringify(v));}catch(e){}}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

const GL={
  grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  wifi:'<path d="M2 8.5a16 16 0 0120 0M5 12a11 11 0 0114 0M8 15.5a6 6 0 018 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  radar:'<circle cx="12" cy="12" r="9"/><path d="M12 12l6-3M12 12v-9M12 12l4 6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  bug:'<path d="M9 7a3 3 0 016 0M6 10h12M7 10v4a5 5 0 0010 0v-4M4 12h3M17 12h3M5 8l2 2M19 8l-2 2M5 17l2-1.5M19 17l-2-1.5M12 19v3"/>',
  shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  book:'<path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 00-3 3V4z"/><path d="M5 4a3 3 0 00-3 3v13a3 3 0 013-3"/>',
  note:'<path d="M5 3h10l4 4v14H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  chip:'<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  dl:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  up:'<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.9 7.9 0 000-2l2-1.5-2-3.4-2.3 1a8 8 0 00-1.7-1l-.3-2.6h-4l-.3 2.6a8 8 0 00-1.7 1l-2.3-1-2 3.4 2 1.5a7.9 7.9 0 000 2l-2 1.5 2 3.4 2.3-1a8 8 0 001.7 1l.3 2.6h4l.3-2.6a8 8 0 001.7-1l2.3 1 2-3.4z"/>',
  play:'<path d="M7 5v14l11-7z"/>', stop:'<rect x="6" y="6" width="12" height="12"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', refresh:'<path d="M20 11a8 8 0 10-2 6m2 2v-5h-5"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>', save:'<path d="M5 3h12l3 3v15H5zM8 3v6h7V3M8 14h8"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7v.5"/>',
  doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  flow:'<rect x="4" y="3" width="7" height="5"/><rect x="13" y="10" width="7" height="5"/><rect x="4" y="16" width="7" height="5"/><path d="M7.5 8v8M11 5.5h5.5v4.5M11 18.5h2.5V15"/>',
  tasks:'<path d="M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17M11 6h9M11 12h9M11 18h9"/>',
  term:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  check:'<path d="M5 12l5 5 9-10"/>', undo:'<path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2"/>', folder:'<path d="M3 6a1 1 0 011-1h5l2 2h9a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>',
  history:'<path d="M3.2 12a9 9 0 1 0 2.6-6.4M3 5v4h4"/><path d="M12 8v4.5l3 1.8"/>',
  puzzle:'<path d="M10 3h4a1 1 0 011 1v2a2 2 0 104 0h2a1 1 0 011 1v4a2 2 0 100 4v2a1 1 0 01-1 1h-4a2 2 0 10-4 0H5a1 1 0 01-1-1v-4a2 2 0 100-4V4a1 1 0 011-1h3a2 2 0 104 0z"/>',
};
const L=c=>`<span class="led ${c}"></span>`;
const S=(c,t)=>`<span class="st ${c}">${c==='o'?'':L(c)}${t}</span>`;
const box=(t,b,r,flush,cls)=>`<div class="box ${cls||''}"><div class="bt">${t}${r?`<span class="bt-r">${r}</span>`:''}</div><div class="bc${flush?' flush':''}">${b}</div></div>`;
const boxf=(t,b,r,cls)=>box(t,b,r,true,cls);
const intro=(g,h,cls)=>`<div class="note intro ${cls||''}"><span class="ni">${svg(GL[g])}</span><div>${h}</div></div>`;
const chain=(steps,cur)=>`<div class="chain">${steps.map((s,i)=>`<div class="cst ${i<cur?'done':i===cur?'now':'todo'}"><span class="cn">${i<cur?'✓':i+1}</span><span><b>${s[0]}</b><small>${s[1]}</small></span></div>`).join('')}</div>`;

/* ───────── terminál ───────── */
function linkifyCVE(text){const safe=esc(text);return safe.replace(/CVE-\d{4}-\d+/gi,m=>`<a href="https://nvd.nist.gov/vuln/detail/${m}" target="_blank" rel="noopener" class="cve">${m}</a>`);}
function renderLine(d,termId){const term=document.getElementById(termId);if(!term)return;
  term.querySelector('.t-welcome')?.remove();
  const line=el('div','tl '+(d.type||'info'));
  const raw=el('span','traw');raw.innerHTML=linkifyCVE(d.raw||'');line.appendChild(raw);
  if(d.badge){const b=el('span','tbadge '+(d.type||''));b.textContent=TR(d.badge);line.appendChild(b);}
  if(d.explanation){const e=el('div','texp');let txt=TR(d.explanation);if(d.data)Object.entries(d.data).forEach(([k,v])=>{txt=txt.replace('{'+k+'}',v);});e.innerHTML=txt;line.appendChild(e);}
  term.appendChild(line);term.scrollTop=term.scrollHeight;
  const cnt=term.closest('.term-box, .console')?.querySelector('.tcount');if(cnt)cnt.textContent=term.querySelectorAll('.tl').length+' sor';
}
function termText(termId){const t=document.getElementById(termId);if(!t)return'';return [...t.querySelectorAll('.tl')].map(l=>l.querySelector('.traw')?.textContent||'').join('\n');}
function termClear(termId){const t=document.getElementById(termId);if(t)t.innerHTML='<div class="t-welcome">— kész —</div>';const cnt=t?.closest('.term-box, .console')?.querySelector('.tcount');if(cnt)cnt.textContent='0 sor';}
/* többsoros szöveg terminál-sorokként (renderLine-nal) */
function termPrint(termId,txt,type){String(txt==null?'':txt).split('\n').forEach(l=>renderLine({raw:l,type:type||'out'},termId));}
/* fejléces terminál-doboz: id, cím, gombsor-opciók */
function termBox(id,title,btns,welcome){
  const b=(btns||[]).map(x=>`<button class="cbtn ${x.cls||''}" data-act="${x.act}" ${x.id?`id="${x.id}"`:''} ${x.dis?'disabled':''}>${x.g?svg(GL[x.g],2):''}${x.label}</button>`).join('');
  return `<div class="console"><div class="cons-hd">${title}<span class="ch-r"><span class="ttimer" id="${id}Timer" style="display:none"></span><span class="tcount">0 sor</span>${b}<input class="tfilter" data-tfilter="${id}" placeholder="szűrés…"></span></div>
    <div class="term" id="${id}" tabindex="0"><div class="t-welcome">${welcome||'A kimenet itt jelenik meg.'}</div></div></div>`;
}
/* terminál-központú konzol: NAGY terminál + szerkeszthető parancssor */
function consoleBox(id,title,promptPh,runAct,runLabel,stopAct,ctl,welcome){
  const btns=(ctl||[]).map(x=>`<button class="cbtn" data-act="${x.act}">${x.g?svg(GL[x.g],2):''}${x.label}</button>`).join('');
  return `<div class="console">
    <div class="cons-hd">${title}<span class="ch-r"><span class="ttimer" id="${id}Timer" style="display:none"></span><span class="tcount">0 sor</span>${btns}<input class="tfilter" data-tfilter="${id}" placeholder="szűrés…"></span></div>
    <div class="term" id="${id}" tabindex="0"><div class="t-welcome">${welcome||'A kimenet itt jelenik meg.'}</div></div>
    <div class="cmdline"><span class="cprompt">$</span><input id="${id}Cmd" placeholder="${promptPh}" spellcheck="false" autocomplete="off" data-enter="${runAct}"><span class="cmdent" title="Enter: Indít — a gomb a fejléc jobb szélén">⏎</span></div>
  </div>`;
}
let _timers={};
function timerStart(id){const el=document.getElementById(id+'Timer');if(!el)return;const s0=Date.now();el.style.display='';clearInterval(_timers[id]);
  _timers[id]=setInterval(()=>{const s=Math.floor((Date.now()-s0)/1000);el.textContent='⏱ '+p2(Math.floor(s/60))+':'+p2(s%60);},1000);}
function timerStop(id){clearInterval(_timers[id]);}

/* ───────── toast + státusz + esemény-napló ───────── */
function toast(msg,type){const c=$('#toasts');if(!c)return;const e=el('div','toast '+(type||'info'),esc(TR(msg)));c.appendChild(e);setTimeout(()=>e.remove(),3200);}
const LVLMAP={info:'b',success:'g',warning:'y',error:'r',scan:'b',action:'b'};
function status(msg,lvl){$('#statusMsg').textContent=msg;$('#statusMsg').className=lvl&&lvl!=='g'?'st '+lvl:'';$('#statusLed').className='led '+(lvl||'g');}
let APPLOG=store.get('applog',[]);let unseen=0;
function applog(lvl,msg){APPLOG.push({t:Date.now(),l:lvl,m:msg,v:curView});if(APPLOG.length>400)APPLOG.shift();store.set('applog',APPLOG);
  if(curTool==='log')renderDrawer();else if(lvl==='r'||lvl==='y'){unseen++;badges();}}
function say(msg,lvl){status(msg,lvl||'g');applog(lvl||'g',msg);}
let CMDHIST=store.get('cmdhist',[]);
function cmdHistPush(cmd){CMDHIST.push({t:Date.now(),v:curView,cmd});if(CMDHIST.length>40)CMDHIST.shift();store.set('cmdhist',CMDHIST);if(curTool==='hist')renderDrawer();}
window.toast=toast;window.renderLine=renderLine;window.say=say;

/* ───────── bal oldali fa ───────── */
const TREE=[
  {id:'overview',label:'Áttekintés',glyph:'grid'},
  {folder:'Teszt / Audit',glyph:'radar',open:true,children:[
    {id:'wifite',label:'WiFi Audit',glyph:'wifi'},{id:'nmap',label:'Nmap Scan',glyph:'radar'},{id:'pentest',label:'PenTest',glyph:'bug'}]},
  {folder:'Védelem',glyph:'shield',open:true,children:[
    {id:'vedelem',label:'Védelmi eszközök',glyph:'shield'}]},
  {folder:'Dokumentáció',glyph:'book',open:true,children:[
    {id:'kb',label:'Tudásbázis',glyph:'book'},{id:'naplo',label:'Napló',glyph:'note'}]},
  {sect:'Rendszer'},
  {id:'rendszer',label:'Rendszer-állapot',glyph:'chip'},
  {id:'update',label:'Frissítés',glyph:'dl'},
  {id:'settings',label:'Beállítások',glyph:'gear'},
];
const TITLE={overview:'Áttekintés',wifite:'WiFi Audit',nmap:'Nmap Scan',pentest:'PenTest',vedelem:'Védelmi eszközök',kb:'Tudásbázis',naplo:'Napló',rendszer:'Rendszer-állapot',update:'Frissítés',settings:'Beállítások'};
const PATH={overview:'Munkaterület',wifite:'Teszt / Audit',nmap:'Teszt / Audit',pentest:'Teszt / Audit',vedelem:'Védelem',kb:'Dokumentáció',naplo:'Dokumentáció',rendszer:'Rendszer',update:'Rendszer',settings:'Rendszer'};
const GLYPH={overview:'grid',wifite:'wifi',nmap:'radar',pentest:'bug',vedelem:'shield',kb:'book',naplo:'note',rendszer:'chip',update:'dl',settings:'gear'};
function buildTree(){
  const tl=$('#treeList');tl.innerHTML='';
  const node=(n,lvl)=>{const t=el('div','tnode lvl'+lvl);t.dataset.go=n.id;t.tabIndex=0;
    t.innerHTML=`<span class="tw"></span><span class="tglyph">${svg(GL[n.glyph||'doc'])}</span><span>${n.label}</span>`;return t;};
  TREE.forEach(n=>{
    if(n.sect){tl.appendChild(el('div','tsect',n.sect));return;}
    if(!n.folder){tl.appendChild(node(n,1));return;}
    const head=el('div','tnode lvl1',`<span class="tw">${n.open?'▾':'▸'}</span><span class="tglyph">${svg(GL[n.glyph])}</span><span>${n.folder}</span>`);
    const kids=el('div','tchildren'+(n.open?'':' collapsed'));n.children.forEach(c=>kids.appendChild(node(c,2)));
    head.onclick=()=>{n.open=!n.open;kids.classList.toggle('collapsed',!n.open);head.querySelector('.tw').textContent=n.open?'▾':'▸';};
    tl.appendChild(head);tl.appendChild(kids);});
  $$('.tnode').forEach(t=>t.classList.toggle('sel',t.dataset.go===curView));
}

/* ───────── állapot ───────── */
let curView='overview', curTool=null, appTheme='light', appScale=100, appDensity='compact', appBlink='normal', appSb='show', appSbw=10, appPan='on', appDw=400;
const SCALES=[90,100,110,125,150];
function scaleList(){return SCALES.includes(appScale)?SCALES.slice():[...SCALES,appScale].sort((a,b)=>a-b);}
const hist=[];let hpos=-1;
let IS_LINUX=false;
const STATE={nmap:{running:false},wifite:{running:false,networks:0,handshakes:0,cracked:0}};

/* ───────── navigáció ───────── */
function select(id,fromHist){
  if(!TITLE[id])return;
  if((!fromHist&&id!==curView)||hpos<0){hist.splice(hpos+1);hist.push(id);hpos=hist.length-1;}
  const changed=id!==curView;curView=id;
  $$('.tnode').forEach(t=>t.classList.toggle('sel',t.dataset.go===id));
  $('#scrTitle').textContent=TITLE[id];$('#scrPath').textContent=PATH[id]||'';
  renderAppbar(id);
  $('#main').innerHTML=(VIEWS[id]||VIEWS._stub)(id);$('#main').scrollTop=0;
  status('Kész');if(changed&&!fromHist)applog('b','Megnyitva: '+TITLE[id]);
  if(MOUNT[id])try{MOUNT[id]();}catch(e){console.error(e);}
  if(curTool&&!railAvail(curTool))closeTool();else if(curTool)renderDrawer();
  badges();updateRailState();
  document.body.classList.remove('tree-open');
}
function rerender(){$('#main').innerHTML=(VIEWS[curView]||VIEWS._stub)(curView);renderAppbar(curView);if(MOUNT[curView])try{MOUNT[curView]();}catch(e){}}
function renderAppbar(id){
  const sets={
    overview:[['refresh','Frissítés','','cmd:refresh']],
    nmap:[['play','Indít','pri','act:nmapRun'],['stop','Leállít','','act:nmapStop']],
    wifite:[['undo','Keresés stop','','act:wifiteCtrlC'],['play','Indít','pri','act:wifiteGo'],['stop','Leállít','','act:wifiteStop']],
    pentest:[['play','Indít','pri','act:ptRunLine'],['stop','Leállít','','act:ptKill']],
    vedelem:[['play','Indít','pri','act:vedStart'],['stop','Leállít','','act:defStop']],
    naplo:[['plus','Új jegyzet','pri','act:npNew']],
  };
  $('#appbar').innerHTML=(sets[id]||[]).map(x=>{const a=(x[3]||'').split(':');
    return `<button class="abtn ${x[2]==='pri'?'pri':''}" ${x[2]==='pri'?'id="abPrimary"':''} ${a[0]==='go'?`data-go="${a[1]}"`:a[0]==='act'?`data-act="${a[1]}"`:`data-cmd="${a[1]}"`}>${x[0]?svg(GL[x[0]],2):''}<span class="lbl2">${x[1]}</span></button>`;}).join('');
}

/* ═══════════════ KÉPERNYŐK ═══════════════ */
const VIEWS={}, MOUNT={};

/* ── Áttekintés ── */
VIEWS.overview=()=>`
  ${intro('shield','<b>Etikus teszt-konzol.</b> Csak saját vagy írásos engedéllyel rendelkező hálózaton használd. Balra a modulok, jobbra az ikonsor: Leírás, Folyamat, Teendők, Esemény-napló, Jegyzet, Terminál.','warn')}
  ${boxf('Munkafolyamat',chain([['Felderítés','WiFi / Nmap'],['Elemzés','portok, sebezhetőség'],['Teszt','PenTest szkriptek'],['Védelem','megerősítés'],['Napló','dokumentálás']],0))}
  <div class="cols c4">
    ${box('WiFi Audit',`<div class="kv"><dt>Interfész</dt><dd class="mono" id="ovIface">wlan1</dd><dt>Monitor</dt><dd id="ovMon" class="muted">?</dd></div><div class="btnrow"><button class="btn sm pri" data-go="wifite">Megnyitás</button></div>`,L('b'))}
    ${box('Nmap',`<div class="kv"><dt>Profilok</dt><dd>39</dd><dt>Platform</dt><dd id="ovPlat" class="muted">?</dd></div><div class="btnrow"><button class="btn sm pri" data-go="nmap">Megnyitás</button></div>`)}
    ${box('Védelem',`<div class="kv"><dt>Eszközök</dt><dd>19</dd><dt>Aktív</dt><dd id="ovDef" class="muted">?</dd></div><div class="btnrow"><button class="btn sm pri" data-go="vedelem">Megnyitás</button></div>`,L('g'))}
    ${box('Napló',`<div class="kv"><dt>Bejegyzés</dt><dd id="ovNaplo" class="muted">?</dd></div><div class="btnrow"><button class="btn sm pri" data-go="naplo">Megnyitás</button></div>`)}
  </div>
  ${boxf('Rendszer — rövid állapot',`<div id="ovSys" class="bc"><div class="dempty">Betöltés…</div></div>`,'<button class="lnk" data-go="rendszer">Teljes nézet</button>')}`;
MOUNT.overview=async()=>{
  try{const s=await fetch('/api/system').then(r=>r.json());IS_LINUX=!!s.isLinux;const p=$('#ovPlat');if(p)p.textContent=s.isLinux?'Linux':(s.platform||'nem Linux');}catch(e){}
  try{const items=await fetch('/api/naplo').then(r=>r.json());const n=$('#ovNaplo');if(n)n.textContent=(Array.isArray(items)?items.length:0)+' db';}catch(e){}
  try{const d=await fetch('/api/sysinfo').then(r=>r.json());
    const iface=$('#ovIface');if(iface)iface.textContent=d.iface_default||'wlan1';
    const mon=$('#ovMon');const mif=(d.ifaces||[]).find(i=>i.monitor_capable);if(mon)mon.innerHTML=mif?S('g','van ('+mif.name+')'):S('y','nincs');
    const def=(d.defense||[]);const act=def.filter(x=>x.active==='active').length;const dd=$('#ovDef');if(dd)dd.innerHTML=S(act?'g':'o',act+'/'+def.length);
    const g=$('#ovSys');if(g)g.innerHTML=sysMini(d);
  }catch(e){const g=$('#ovSys');if(g)g.innerHTML='<div class="dempty">Rendszer-info nem elérhető (fut a backend?).</div>';}
};
function sysMini(d){const r=(k,v,c)=>`<div class="sysr"><span class="sk">${k}</span><span class="sv ${c||''}">${v==null||v===''?'—':v}</span></div>`;
  const danger=(d.throttled_flags||[]).some(f=>/MOST/.test(f));
  return `<div class="sysgrid">
    <div class="syscard ${danger?'danger':''}"><div class="sysbody">${r('Hőmérséklet',esc((d.temp||'').replace('temp=','')))}${r('Throttled',esc(d.throttled),danger?'bad':'ok')}${r('RAM',esc(d.ram))}${r('Tárhely',esc(d.disk))}</div></div>
    <div class="syscard"><div class="sysbody">${r('WiFi (SSID)',esc(d.wifi_ssid),d.wifi_ssid?'ok':'')}${r('IP',esc(d.wifi_ip))}${r('Átjáró',esc((d.net||{}).GW))}${r('UFW',esc(d.ufw),/active/i.test(d.ufw||'')?'on':'')}</div></div>
  </div>`;}

/* ── NMAP ── */
const SCAN_INFO={ping:'nmap -sn <cél>',os:'nmap -O --top-ports 50 <cél>',mac:'nmap -sn -PR <cél>',nbstat:'nmap --script=nbstat -p 137,139 <cél>',traceroute:'nmap --traceroute -sn <cél>',dnsbrute:'nmap --script=dns-brute <cél>',discovery:'nmap --script=discovery --top-ports 100 <cél>',fast:'nmap -T4 -F <cél>',full:'nmap -sV [-O] --top-ports 1000 <cél>',udp:'nmap -sU --top-ports 100 <cél>',allports:'nmap -p- -T4 --open <cél>',stealth:'nmap -sS -T4 --top-ports 1000 <cél>',ack:'nmap -sA --top-ports 100 <cél>',fin:'nmap -sF -T4 --top-ports 1000 <cél>',null:'nmap -sN -T4 --top-ports 1000 <cél>',xmas:'nmap -sX -T4 --top-ports 1000 <cél>',ipproto:'nmap -sO <cél>',ports:'nmap -sV --top-ports 100 <cél>',scripts:'nmap -sC -sV --top-ports 100 <cél>',banner:'nmap --script=banner --top-ports 100 <cél>',auth:'nmap --script=auth --top-ports 50 <cél>',httpenum:'nmap --script=http-enum -p 80,443,8080,8443 <cél>',httpmethods:'nmap --script=http-methods -p 80,443,8080,8443 <cél>',dbinfo:'nmap --script=mysql-info,ms-sql-info -p 1433,3306,5432,1521 <cél>',vuln:'nmap --script=vuln --top-ports 50 <cél>',smb:'nmap --script smb-vuln* -p 139,445 <cél>',httpvuln:'nmap --script http-vuln* --top-ports 20 <cél>',ssl:'nmap --script=ssl-heartbleed,ssl-poodle,ssl-enum-ciphers -p 443,8443 <cél>',shellshock:'nmap --script=http-shellshock -p 80,443,8080 <cél>',rdpvuln:'nmap --script=rdp-enum-encryption,rdp-vuln-ms12-020 -p 3389 <cél>',dbvuln:'nmap --script mysql-vuln*,ms-sql-vuln* -p 1433,3306 <cél>',malware:'nmap --script=malware --top-ports 50 <cél>',exploit:'nmap --script=exploit --top-ports 50 <cél>',brute:'nmap --script=brute --top-ports 20 <cél>',dos:'nmap --script=dos --top-ports 20 <cél>',fuzzer:'nmap --script=fuzzer --top-ports 10 <cél>',decoy:'nmap -sS -D RND:5 -T2 --top-ports 100 <cél>',frag:'nmap -sS -f -T2 --top-ports 100 <cél>',audit:'nmap -sV -sC [-O] --top-ports 1000 --script=vuln <cél>'};
const SCAN_GRP=[['🏓 Felderítés',['ping','os','mac','nbstat','traceroute','dnsbrute','discovery']],['🔌 Port Scan',['fast','full','udp','allports','stealth','ack','fin','null','xmas','ipproto']],['🔬 Szolgáltatás',['ports','scripts','banner','auth','httpenum','httpmethods','dbinfo']],['🛡️ Sebezhetőség',['vuln','smb','httpvuln','ssl','shellshock','rdpvuln','dbvuln','malware','exploit']],['💥 Offenzív / speciális',['brute','dos','fuzzer','decoy','frag']],['💣 Teljes audit',['audit']]];
const SCAN_ICON={ping:'🏓',os:'💻',mac:'🏷️',nbstat:'🪟',traceroute:'🗺️',dnsbrute:'🌐',discovery:'🔎',fast:'⚡',full:'📋',udp:'📡',allports:'🔢',stealth:'🥷',ack:'🧱',fin:'🏁',null:'⭕',xmas:'🎄',ipproto:'🧬',ports:'🔬',scripts:'📜',banner:'🏷️',auth:'🔑',httpenum:'📁',httpmethods:'🔧',dbinfo:'🗄️',vuln:'🛡️',smb:'🪟',httpvuln:'🌐',ssl:'🔒',shellshock:'🐚',rdpvuln:'🖥️',dbvuln:'🗄️',malware:'🦠',exploit:'💉',brute:'🔨',dos:'💢',fuzzer:'🎲',decoy:'🎭',frag:'✂️',audit:'💣'};
let NM={type:'ping',target:'',custom:'',sudo:false};
function fillNmCmd(){const i=$('#nmapOutCmd');if(!i)return;let c=SCAN_INFO[NM.type]||'';c=IS_LINUX?c.replace('[-O]','-O'):c.replace(' [-O]','');i.value=c.replace('<cél>',NM.target||'<cél>');}
function nmapCmdPreview(){fillNmCmd();}
const NMTITLE={discovery:'Felderítés+',auth:'Hitelesítés',vuln:'Sebezhetőség',malware:'Malware',exploit:'Exploit',brute:'Brute-force',dos:'DoS',fuzzer:'Fuzzer'};
function nmTitle(k){const v=TR('nmap.'+k+'.title');return (v==='nmap.'+k+'.title')?(NMTITLE[k]||k):v;}
function nmScanGrid(){return SCAN_GRP.map(([title,keys])=>`<div class="scan-cat">${title}</div><div class="scan-grid">${keys.map(k=>`<button class="scan-btn ${k==='audit'?'full':''} ${NM.type===k?'on':''}" data-act="nmType" data-k="${k}"><span class="si">${SCAN_ICON[k]||'•'}</span><b>${esc(nmTitle(k))}</b><small>${esc(TR('nmap.'+k+'.desc'))}</small></button>`).join('')}</div>`).join('');}
VIEWS.nmap=()=>`
  <div class="tbar">
    <label>Profil</label><select class="in" data-in="nmProfile">${SCAN_GRP.map(([tt,keys])=>`<optgroup label="${tt}">${keys.map(k=>`<option value="${k}" ${NM.type===k?'selected':''}>${esc(nmTitle(k))} — ${esc(TR('nmap.'+k+'.desc'))}</option>`).join('')}</optgroup>`).join('')}</select>
    <label>Cél</label><input class="in mono" data-in="nmTarget" value="${esc(NM.target)}" placeholder="192.168.1.0/24">
    <label class="ck"><input type="checkbox" data-in="nmSudo" ${NM.sudo?'checked':''}> sudo</label>
    <span class="grow"></span><span class="ph" id="nmPhaseTxt"></span>
  </div>
  <div class="grow1">${consoleBox('nmapOut','Nmap terminál','nmap … — a profil kitölti, átírhatod, Enter futtat','nmapRun','Futtat','nmapStop',[{act:'nmapClear',g:'trash',label:'Törlés'}],'Válassz profilt fent — a parancs ide kerül, szerkesztheted, Enterrel futtatod. Az eredmény (host/port/sebezhetőség, előzmény) a jobb oldali „Eredmény" panelen.')}</div>`;
MOUNT.nmap=()=>{fillNmCmd();ptToolsFetch();};
/* nmap előzmények */
function nmHist(){return store.get('nmHist',[]);}
function nmHistSave(e){const l=nmHist();l.unshift(e);if(l.length>5)l.length=5;store.set('nmHist',l);}
function nmHistRender(){const c=$('#nmHist');if(!c)return;const l=nmHist();
  c.innerHTML=l.length?l.map(e=>`<div class="hist"><span class="hb ${e.status}">${e.status}</span><span class="ht" title="${esc(e.target)}">${esc(e.target)}</span><span class="hm">${e.time} · ${e.scanType}${e.hosts!==undefined?' · '+e.hosts+'h/'+e.ports+'p':''}</span>${e.status!=='error'&&e.scanType!=='custom'?`<button class="btn sm" data-act="nmRerun" data-k="${esc(e.target)}" data-t="${e.scanType}">▶</button>`:''}</div>`).join(''):'<div class="dempty">Még nincs scan.</div>';}
/* nmap összegző modal → a jobb oldali drawer Leírás helyén */
let NMDATA={hosts:[],ports:[],ips:[],vuln:[],error:[]};let _nmHostCur=null,_nmHostMap={};
const VULN_GUIDE=[
  {re:/CVE-2014-0160|heartbleed/i,name:'Heartbleed (CVE-2014-0160)',sev:'kritikus',desc:'OpenSSL TLS heartbeat puffertúlcsordulás. A szerver memóriájából 64 KB-os blokkok olvashatók belépés nélkül — jelszavak, kulcsok szivároghatnak.',tools:['metasploit: openssl_heartbleed','testssl.sh','sslscan'],fix:'OpenSSL 1.0.1g+ frissítés, tanúsítvány- és jelszócsere.'},
  {re:/MS17-010|EternalBlue|smb-vuln-ms17/i,name:'EternalBlue (MS17-010)',sev:'kritikus',desc:'SMBv1 puffertúlcsordulás — WannaCry/NotPetya. SYSTEM jogú távoli kódfuttatás Windows rendszereken.',tools:['metasploit: ms17_010_eternalblue','AutoBlue-MS17-010'],fix:'KB4012212 patch, SMBv1 letiltása.'}];
function nmModalHtml(type){
  if(type==='hosts')return NMDATA.hosts.length?NMDATA.hosts.map(h=>`<div class="defcard"><div class="defhead"><span class="dn mono">${esc(h.ip)}</span></div><div class="defdesc">${h.details.map(d=>esc(d)).join('<br>')||'—'}</div></div>`).join(''):'<div class="dempty">Nincs host.</div>';
  if(type==='ports')return NMDATA.ports.length?`<table class="logt"><tbody>${NMDATA.ports.map(p=>`<tr><td class="mono">${esc(p.raw)}</td></tr>${p.explanation?`<tr><td class="muted" style="font-size:11px">${esc(p.explanation)}</td></tr>`:''}`).join('')}</tbody></table>`:'<div class="dempty">Nincs nyitott port.</div>';
  if(type==='ips')return NMDATA.ips.length?`<div style="padding:10px;display:flex;flex-wrap:wrap;gap:5px">${NMDATA.ips.map(ip=>`<span class="tgt-chip mono" style="border:1px solid var(--line);padding:1px 6px">${esc(ip)}</span>`).join('')}</div>`:'<div class="dempty">Nincs IP.</div>';
  if(type==='vuln')return NMDATA.vuln.length?NMDATA.vuln.map(raw=>{const g=VULN_GUIDE.find(x=>x.re.test(raw));
    if(g)return `<div class="defcard"><div class="defhead"><span class="dn">${esc(g.name)}</span><span class="dtag crit">${g.sev}</span></div><div class="defdesc">${esc(g.desc)}</div><div class="defrow"><span class="dk">Eszköz</span><div>${g.tools.map(x=>`<code>${esc(x)}</code>`).join(' ')}</div></div><div class="defrow"><span class="dk">Javítás</span><div class="pos">${esc(g.fix)}</div></div></div>`;
    const cve=raw.match(/CVE-\d{4}-\d+/i);return `<div class="defcard"><div class="defhead"><span class="dn">${cve?esc(cve[0]):'Találat'}</span><span class="dtag crit">magas</span></div><div class="defdesc mono">${esc(raw)}</div></div>`;}).join(''):'<div class="dempty">Nincs sebezhetőség-találat.</div>';
  if(type==='error')return NMDATA.error.length?NMDATA.error.map(e=>`<div class="defcard"><div class="defdesc mono neg">${esc(e)}</div></div>`).join(''):'<div class="dempty">Nincs hiba.</div>';
  return '';}

/* ── WIFITE ── */
let WF={iface:'wlan1',wordlist:'',pmkid:true,wps:true,crack:true,wpsTool:'reaver',randomMac:false};
VIEWS.wifite=()=>`
  <div class="tbar">
    <label>if</label><input class="in mono" data-in="wfIface" value="${esc(WF.iface)}" style="width:66px">
    <label>wordlist</label><select class="in" id="wfWordlist" data-in="wfWordlist"><option value="">— nincs —</option></select>
    <button class="btn sm" data-act="wlUpload" title="Saját wordlist feltöltése (.txt / .lst / .dict)">${svg(GL.up,2)} Feltöltés</button>
    <label class="ck"><input type="checkbox" data-in="wfM" data-k="pmkid" ${WF.pmkid?'checked':''}> PMKID</label>
    <label class="ck"><input type="checkbox" data-in="wfM" data-k="wps" ${WF.wps?'checked':''}> WPS</label>
    <label class="ck"><input type="checkbox" data-in="wfM" data-k="crack" ${WF.crack?'checked':''}> törés</label>
    <label class="ck"><input type="checkbox" data-in="wfM" data-k="randomMac" ${WF.randomMac?'checked':''}> rnd MAC</label>
    <span class="grow"></span><span class="ph" id="wfPhase"></span>
  </div>
  <div class="grow1">${consoleBox('wifiteOut','WiFi audit terminál','indításhoz Enter/Indít (üresen); futás közben célpont: 1, 1,2, all','wifiteGo','Indít','wifiteStop',[{act:'wifiteClear',g:'trash',label:'Törlés'}],'Az „Indít" elindítja a wifite-ot (monitor-képes interfész kell, pl. wlan1). Futás közben a parancssorba írt számmal támadsz. A talált hálózatok és handshake-ek a jobb oldali „Eredmény" panelen.')}</div>`;
MOUNT.wifite=()=>{wfLoadWordlists();ptToolsFetch();};
async function wfLoadWordlists(){const sel=$('#wfWordlist');if(!sel)return;try{const items=await fetch('/api/wordlists').then(r=>r.json());sel.length=1;items.forEach(w=>{const o=el('option');o.value=w.path;o.textContent=`${w.name} (${w.size})`;sel.appendChild(o);});if(WF.wordlist)sel.value=WF.wordlist;}catch(e){}}
async function wfLoadHandshakes(){const list=$('#wfHsList');if(!list)return;try{const items=await fetch('/api/wifite/handshakes').then(r=>r.json());
  list.innerHTML=items.length?items.map(h=>`<div class="hsitem">${L('g')}<span class="hn" title="${esc(h.name)}">${esc(h.name)}</span><span class="muted">${esc(h.size)}</span><a class="lnk" href="/api/wifite/handshake?name=${encodeURIComponent(h.name)}" download>letölt</a></div>`).join(''):'<div class="dempty">Még nincs elkapott handshake.</div>';}catch(e){list.innerHTML='<div class="dempty">Nem elérhető.</div>';}}
const WFT=new Map();
function wfParseTarget(raw){const l=String(raw).replace(/\s+/g,' ').trim();if(/^num\b/i.test(l)||/^[-=]+$/.test(l))return null;
  const m=l.match(/^(\d{1,3})\s+(.+?)\s+(\d{1,3})\s+(WPA[0-9.\-]*|WEP|OPN|WPS|OWE)\b\s*(.*)$/i);if(!m)return null;
  const rest=(m[5]||'').split(' ').filter(Boolean);const wps=rest.find(x=>/^(yes|no)$/i.test(x))||'';
  const pw=rest.find(x=>/\d/.test(x)&&!/^\d+$/.test(x))||rest.find(x=>/^\d+$/.test(x))||'';
  return {num:m[1],essid:m[2],ch:m[3],encr:m[4].toUpperCase(),power:pw,wps};}
function wfSig(p){const n=parseInt(String(p).replace(/[^0-9]/g,''),10)||0;const lvl=n>=50?4:n>=35?3:n>=20?2:n>0?1:0;return '▂▄▆█'.slice(0,lvl).padEnd(4,'·');}
function wfRenderTargets(){const panel=$('#wfTargets');if(!panel)return;if(!WFT.size){panel.innerHTML='<div class="dempty">A keresés indítása után itt jelennek meg.</div>';return;}
  panel.innerHTML=[...WFT.values()].sort((a,b)=>(+a.num)-(+b.num)).map(t=>`<div class="tgt"><span class="tnum">${t.num}</span><span class="tess">${esc(t.essid)}</span><span class="tchip">CH ${esc(t.ch)}</span><span class="tchip">${esc(t.encr)}</span><span class="tsig" title="jel: ${esc(t.power)}">${wfSig(t.power)}</span>${/yes/i.test(t.wps)?'<span class="tchip wps">WPS</span>':''}<button class="btn sm pri" data-act="wifiteTarget" data-k="${t.num}">Támad ▶</button></div>`).join('');}
function wfSendInput(body){fetch('/api/wifite/input',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>{});}

/* ── VÉDELEM ── */
const DEFENSES=[
 {cat:'wifi',name:'Kismet',key:'kismet',tag:'Vezeték nélküli IDS',desc:'Passzív vezeték nélküli behatolásjelző (WIDS). Riaszt deauth-áradatra, hamis AP-ra (evil twin), gyanús aktivitásra — anélkül, hogy maga támadna.',install:'sudo apt install kismet',enable:'sudo usermod -aG kismet $USER\nkismet -c wlan1',iface:true},
 {cat:'wifi',name:'WPA3 + PMF (802.11w)',key:null,tag:'Router-beállítás',desc:'A Protected Management Frames aláírja a menedzsment-kereteket, így a deauth nem hamisítható. A WPA3 kötelezővé teszi. A fő valódi védelem a deauth ellen.',install:'— (router-beállítás)',enable:'Router admin → WPA3-SAE, PMF: „Required"'},
 {cat:'wifi',name:'WPS kikapcsolása',key:null,tag:'Router-beállítás',desc:'A WPS PIN brute-force-olható (Reaver/Bully), sok routeren órák alatt — a jelszótól függetlenül. Kapcsold ki.',install:'— (router-beállítás)',enable:'Router admin → WPS: Ki'},
 {cat:'wifi',name:'macchanger',key:'macchanger',tag:'MAC-anonimitás',desc:'Véletlenszerűvé teszi a kártya MAC-címét, így az eszköz nem követhető a MAC alapján.',install:'sudo apt install macchanger',enable:'sudo ip link set wlan1 down\nsudo macchanger -r wlan1\nsudo ip link set wlan1 up',iface:true},
 {cat:'net',name:'UFW (tűzfal)',key:'ufw',tag:'Tűzfal',desc:'Egyszerű tűzfal az iptables fölött. Tiltja a bejövő forgalmat, csak azt engedi be, amit akarsz. Az első védelmi vonal.',install:'sudo apt install ufw',enable:'sudo ufw default deny incoming\nsudo ufw default allow outgoing\nsudo ufw enable'},
 {cat:'net',name:'Fail2ban',key:'fail2ban',tag:'Brute-force védelem',desc:'Figyeli a naplókat (pl. SSH), és kitiltja az IP-t, amelyik túl sokszor próbál bejelentkezni. A jelszó-találgatás elleni fő védelem.',install:'sudo apt install fail2ban',enable:'sudo systemctl enable --now fail2ban'},
 {cat:'net',name:'Suricata',key:'suricata',tag:'Hálózati IDS/IPS',desc:'A forgalmat szabály-készletek alapján elemzi, riaszt vagy blokkol ismert támadásokra, kártevőkre, exploitokra.',install:'sudo apt install suricata',enable:'sudo suricata-update\nsudo systemctl enable --now suricata',iface:true},
 {cat:'net',name:'arpwatch',key:'arpwatch',tag:'ARP-spoofing észlelés',desc:'Riaszt, ha egy IP-hez tartozó MAC hirtelen megváltozik — ez a MITM / ARP-spoofing jele.',install:'sudo apt install arpwatch',enable:'sudo systemctl enable --now arpwatch'},
 {cat:'net',name:'WireGuard (VPN)',key:'wireguard',tag:'Titkosított alagút',desc:'Modern, gyors VPN. Idegen/nyílt WiFin titkosítja az egész forgalmad, így nem lehallgatható.',install:'sudo apt install wireguard',enable:'sudo systemctl enable --now wg-quick@wg0'},
 {cat:'net',name:'dnscrypt-proxy',key:'dnscrypt',tag:'Titkosított DNS',desc:'Titkosítja a DNS-lekérdezéseket (DoH/DNSCrypt), így a szolgáltató nem látja/hamisíthatja, mit nyitsz meg.',install:'sudo apt install dnscrypt-proxy',enable:'sudo systemctl enable --now dnscrypt-proxy'},
 {cat:'sys',name:'Lynis',key:'lynis',tag:'Biztonsági audit',desc:'Végigvizsgálja és pontozza a rendszer megerősítettségét, konkrét javaslatokkal. Futtasd a változtatások előtt és után.',install:'sudo apt install lynis',enable:'sudo lynis audit system'},
 {cat:'sys',name:'AppArmor',key:'apparmor',tag:'Alkalmazás-összezárás',desc:'Profilokkal korlátozza, mihez férhet egy program, így egy feltört app nem kártékonykodhat szabadon.',install:'sudo apt install apparmor apparmor-utils apparmor-profiles',enable:'sudo systemctl enable --now apparmor'},
 {cat:'sys',name:'firejail',key:'firejail',tag:'Homokozó (sandbox)',desc:'Elszigetelten futtat egy appot (pl. böngésző), korlátozva a fájl- és hálózati hozzáférését.',install:'sudo apt install firejail',enable:'firejail firefox'},
 {cat:'sys',name:'unattended-upgrades',key:'unattended',tag:'Auto biztonsági frissítés',desc:'Automatikusan telepíti a biztonsági frissítéseket — a legegyszerűbb, mégis egyik leghatásosabb védelem.',install:'sudo apt install unattended-upgrades',enable:'sudo dpkg-reconfigure --priority=low unattended-upgrades'},
 {cat:'sys',name:'auditd',key:'auditd',tag:'Audit-naplózás',desc:'Részletesen naplózza a rendszer-eseményeket, így utólag kinyomozható egy incidens.',install:'sudo apt install auditd',enable:'sudo systemctl enable --now auditd'},
 {cat:'mal',name:'rkhunter',key:'rkhunter',tag:'Rootkit-kereső',desc:'Rootkiteket, hátsó kapukat, gyanús módosításokat keres ismert minták alapján.',install:'sudo apt install rkhunter',enable:'sudo rkhunter --update\nsudo rkhunter --check'},
 {cat:'mal',name:'chkrootkit',key:'chkrootkit',tag:'Rootkit-kereső',desc:'Az rkhunter kiegészítője: helyi rootkit-jeleket keres. Érdemes a kettőt együtt.',install:'sudo apt install chkrootkit',enable:'sudo chkrootkit'},
 {cat:'mal',name:'AIDE',key:'aide',tag:'Fájl-integritás',desc:'Ujjlenyomatot készít a fontos rendszerfájlokról, és jelzi, ha bármelyik megváltozik.',install:'sudo apt install aide',enable:'sudo aideinit\nsudo aide --check'},
 {cat:'mal',name:'ClamAV',key:'clamav',tag:'Kártevő-kereső',desc:'Nyílt forrású vírus/kártevő-kereső letöltött fájlok, USB ellenőrzésére.',install:'sudo apt install clamav clamav-daemon',enable:'sudo systemctl enable --now clamav-freshclam\nclamscan -r /home'}];
const DEFCATS={wifi:'📡 Vezeték nélküli (WiFi)',net:'🌐 Hálózat',sys:'🧱 Rendszer-megerősítés',mal:'🦠 Kártevő & integritás'};
let defBusy=false,DEFSEL=null,EXTSEL=null;
const DEFSTAT={};
let UPDVER=null;
function vedTbarHtml(){const d=DEFENSES.find(x=>x.name===EXTSEL);
  if(!d)return `<div class="tbar" id="vedTbar"><span class="muted">Válassz egy eszközt a jobb oldali <b>Bővítmények</b> panelen — a műveletei itt jelennek meg.</span></div>`;
  return `<div class="tbar" id="vedTbar"><label>Kijelölt</label><b>${esc(d.name)}</b>${d.tag?`<span class="muted">${esc(d.tag)}</span>`:''}
    <span class="grow"></span>
    <button class="btn sm" data-act="defRun" data-key="${d.key}" data-action="install">${svg(GL.dl,2)} Telepít</button>
    ${d.iface?`<span class="defiface">if:<input data-defiface="${d.key}" value="wlan1"></span>`:''}
    <button class="btn sm" data-act="defRun" data-key="${d.key}" data-action="disable">${svg(GL.stop,2)} Kikapcsol</button></div>`;}
VIEWS.vedelem=()=>`
  ${vedTbarHtml()}
  <div class="grow1">${consoleBox('vedOut','Művelet-kimenet','parancs (pl. sudo apt install …, systemctl status ufw) — Enter futtat','vedRunLine','Futtat',null,[{act:'defClear',g:'trash',label:'Törlés'}],'A Bővítmények panelen válassz eszközt és kattints Telepít/Bekapcsol — a valódi parancs itt fut. Vagy írj be sajátot és Enter.')}</div>`;
MOUNT.vedelem=()=>{DEFENSES.forEach(d=>{if(d.key)defRefreshOne(d.key);});};
/* a védelmi eszköz részlete (telepítés/bekapcsolás parancs + gombok + állapot) — a Bővítmények panelben */
function defDetailHtml(d){const key=d.key;const cb=(code,inner)=>`<div class="cblock"><div class="cbh">${inner||''}<span class="grow"></span><button class="cbcopy" data-act="defCopyTxt" data-k="${esc(code)}" title="Másolás">⧉</button></div><pre>${esc(code)}</pre></div>`;
  let body;
  if(key){body=`<div class="defact" data-key="${key}" style="display:block;padding:0">
    <h5 style="margin-top:4px">Telepítés</h5>${cb(d.install,`<button class="btn sm def-install" data-act="defRun" data-key="${key}" data-action="install">${svg(GL.dl,2)} Telepít</button>`)}
    <h5>Bekapcsolás / futtatás</h5>${cb(d.enable,`${d.iface?`<span class="defiface">if:<input data-defiface="${key}" value="wlan1"></span>`:''}<button class="btn sm def-enable" data-act="defRun" data-key="${key}" data-action="enable" hidden>${svg(GL.play,2)} Bekapcsol</button><button class="btn sm def-disable" data-act="defRun" data-key="${key}" data-action="disable" hidden>${svg(GL.stop,2)} Kikapcsol</button>`)}
    <div style="padding:2px 0 6px">Állapot: <span class="defstat off" data-defstat="${key}">betöltés…</span></div></div>`;}
  else{body=`<div class="note warn" style="margin:4px 0 8px"><span class="ni">🔧</span><div>Router-beállítás — nincs telepíthető csomag.</div></div><h5>Telepítés</h5>${cb(d.install)}<h5>Bekapcsolás</h5>${cb(d.enable)}`;}
  return `<div class="desc" style="padding:4px 10px 8px"><p style="margin:2px 0 6px">${esc(d.desc)}</p>${body}</div>`;}
function defExtHtml(){return `<div class="dtool"><span class="muted" style="font-size:11px;flex:1">Kattints egy eszközre — kinyílik a telepítés / beállítás</span><button class="btn sm" data-act="defRefresh">${svg(GL.refresh,2)}</button></div>`
  +Object.keys(DEFCATS).map(cat=>`<div class="scan-cat" style="padding:6px 10px 2px">${DEFCATS[cat]}</div>`+DEFENSES.filter(d=>d.cat===cat).map(d=>{const open=EXTSEL===d.name;
    return `<div class="hist" data-act="extSel" data-k="${esc(d.name)}" style="cursor:pointer"><span class="hb" data-defstat2="${d.key||''}">${d.key?'…':'🔧'}</span><span class="ht"><b>${esc(d.name)}</b> — <span class="muted">${esc(d.tag)}</span></span><span class="hm">${open?'▾':'▸'}</span></div>`
      +(open?`<div class="extdetail">${defDetailHtml(d)}</div>`:'');}).join('')).join('');}
function defCardHtml(d){
  const act=d.key?`<div class="defact" data-key="${d.key}">
     <button class="btn sm def-install" data-act="defRun" data-key="${d.key}" data-action="install">${svg(GL.dl,2)} Telepítés</button>
     ${d.iface?`<span class="defiface">if:<input data-defiface="${d.key}" value="wlan1"></span>`:''}
     <button class="btn sm def-enable" data-act="defRun" data-key="${d.key}" data-action="enable" hidden>${svg(GL.play,2)} Bekapcsol</button>
     <button class="btn sm def-disable" data-act="defRun" data-key="${d.key}" data-action="disable" hidden>${svg(GL.stop,2)} Kikapcsol</button>
     <span class="defstat off" data-defstat="${d.key}">állapot…</span></div>`
    :`<div class="defact"><span class="defstat off">🔧 Router-beállítás — nincs telepíthető csomag</span></div>`;
  return `<div class="defcard"><div class="defhead"><span class="dn">${esc(d.name)}</span><span class="dtag">${esc(d.tag)}</span><button class="defi" data-act="defInfo">${svg(GL.info,2)}</button></div>
    <div class="defdesc" hidden>${esc(d.desc)}</div>
    <div class="defrow"><span class="dk">Telepítés</span><pre class="defcode">${esc(d.install)}</pre><button class="defcopy" data-act="defCopy">⧉</button></div>
    <div class="defrow"><span class="dk">Bekapcsolás</span><pre class="defcode">${esc(d.enable)}</pre><button class="defcopy" data-act="defCopy">⧉</button></div>${act}</div>`;}
async function defRefreshOne(key){if(!key)return;try{const s=await fetch('/api/defense/status?key='+encodeURIComponent(key)).then(r=>r.json());
  const inst=s.installed,avail=s.available!==false,kind=s.kind||'service',active=s.active==='active';
  let short,txt,cls;
  if(inst){if(kind==='service'){short=active?'●':'○';txt=active?'● aktív':'○ telepítve (áll)';cls=active?'on':'mid';}else if(kind==='manual'){short='✓';txt='✓ telepítve — kézi';cls='on';}else{short='✓';txt='✓ telepítve';cls='on';}}
  else if(!avail){short='⚠';txt='⚠ nincs a tárolóban';cls='off';}else{short='⬇';txt='⬇ nincs telepítve';cls='off';}
  DEFSTAT[key]={short,txt,cls};
  document.querySelectorAll(`[data-defstat2="${key}"]`).forEach(b=>{b.textContent=short;b.className='hb '+(cls==='on'?'done':cls==='off'?'error':'');});
  const badge=document.querySelector(`[data-defstat="${key}"]`),wrap=document.querySelector(`.defact[data-key="${key}"]`);
  if(badge){badge.textContent=txt;badge.className='defstat '+cls;}
  if(wrap){const bi=wrap.querySelector('.def-install'),be=wrap.querySelector('.def-enable'),bd=wrap.querySelector('.def-disable'),pf=wrap.querySelector('.defiface');
    if(bi)bi.hidden=inst||!avail;if(pf)pf.hidden=!inst;
    if(be&&bd){if(!inst){be.hidden=true;bd.hidden=true;}
      else if(kind==='service'){be.innerHTML=svg(GL.play,2)+' Bekapcsol';bd.innerHTML=svg(GL.stop,2)+' Kikapcsol';be.hidden=active;bd.hidden=!active;}
      else if(kind==='action'){be.textContent='🎲 Véletlen MAC';bd.textContent='↩ Eredeti';be.hidden=false;bd.hidden=false;}
      else if(kind==='scan'){be.innerHTML=svg(GL.play,2)+' Futtatás';be.hidden=false;bd.hidden=true;}
      else{be.hidden=true;bd.hidden=true;}}}
}catch(e){}}
function defSetBusy(on){defBusy=on;$$('.def-install,.def-enable,.def-disable').forEach(b=>b.disabled=on);}

/* ── NAPLÓ ── */
const NPTYPES={wifi:['📡','WiFi'],nmap:['🛰️','Nmap'],pentest:['🧪','PenTest'],vedelem:['🛡️','Védelem'],manual:['📝','Jegyzet']};
let NPcur=null,NPmode='view';
VIEWS.naplo=()=>`
  ${intro('note','Mentett eredmények és jegyzetek a programon belül. A többi modul „Naplóz" gombja is ide ment.')}
  <div class="tbar">
    <button class="btn sm" data-act="npRefresh">${svg(GL.refresh,2)} Frissít</button>
    <span class="grow"></span><span class="muted" style="font-size:11px">A többi modul „Naplóz" gombja is ide ment</span>
  </div>
  <div class="cols c12">
    ${boxf('Bejegyzések',`<div id="npList"><div class="dempty">Betöltés…</div></div>`)}
    ${box('Részletek',`<div id="npDetail"><div class="dempty">Válassz egy bejegyzést, vagy hozz létre újat (fenti gomb).</div></div>`,`<span id="npHdr"></span>`,false,'fill')}
  </div>`;
MOUNT.naplo=()=>npLoadList();
async function npLoadList(){const el=$('#npList');if(!el)return;try{const items=await fetch('/api/naplo').then(r=>r.json());
  el.innerHTML=Array.isArray(items)&&items.length?items.map(it=>{const ti=NPTYPES[it.type]||NPTYPES.manual;return `<div class="hist ${NPcur&&NPcur.id===it.id?'':''}" data-act="npOpen" data-k="${it.id}" style="cursor:pointer"><span class="hb">${ti[0]}</span><span class="ht"><b>${esc(it.name)}</b>${it.note?' — '+esc(it.note):''}</span><span class="hm">${esc(tDate(it.created))}</span></div>`;}).join(''):'<div class="dempty">Még nincs mentett bejegyzés.</div>';
}catch(e){el.innerHTML='<div class="dempty">Hiba a lista betöltésekor.</div>';}}
async function npOpen(id){try{const r=await fetch('/api/naplo/'+encodeURIComponent(id));if(!r.ok){toast('Nem található','error');return;}NPcur=await r.json();NPmode='view';npRenderView();}catch(e){toast('Hiba','error');}}
function npRenderView(){const d=NPcur,ti=NPTYPES[d.type]||NPTYPES.manual;$('#npHdr').innerHTML=`<button class="btn sm" data-act="npEdit">${svg(GL.edit,2)} Szerkeszt</button> <button class="btn sm" data-act="npExport">${svg(GL.dl,2)} Export</button> <button class="btn sm dng" data-act="npDelete">${svg(GL.trash,2)} Törlés</button>`;
  $('#npDetail').innerHTML=`<div class="dstate" style="margin:-10px -10px 8px">${ti[0]} ${ti[1]} · ${esc(tDate(d.created))}</div><div style="font-size:14px;font-weight:700;margin-bottom:6px">${esc(d.name)}</div>${d.note?`<div class="note" style="margin-bottom:8px">${esc(d.note)}</div>`:''}<pre class="outpre">${esc(d.content)||'(üres)'}</pre>`;}
function npRenderForm(isNew,prefill){NPmode=isNew?'new':'edit';const d=prefill||NPcur||{};$('#npHdr').innerHTML='';
  const opts=Object.keys(NPTYPES).map(k=>`<option value="${k}" ${((d.type||'manual')===k)?'selected':''}>${NPTYPES[k][0]} ${NPTYPES[k][1]}</option>`).join('');
  $('#npDetail').innerHTML=`<div class="frm">
    <div class="fr"><label class="req">Név</label><input class="in" id="npfName" value="${esc(d.name||'')}" placeholder="pl. Otthoni WiFi szken"></div>
    <div class="fr"><label>Típus</label><select class="in" id="npfType">${opts}</select></div>
    <div class="fr" style="align-items:start"><label>Jegyzet</label><textarea class="in" id="npfNote" rows="2" placeholder="A lényeg, pár sor">${esc(d.note||'')}</textarea></div>
    <div class="fr" style="align-items:start"><label>Tartalom</label><textarea class="in" id="npfContent" rows="10">${esc(d.content||'')}</textarea></div>
    <div class="btnrow"><button class="btn pri" data-act="npSave" data-new="${isNew?1:0}">${svg(GL.save,2)} Mentés</button><button class="btn" data-act="npCancel">Mégse</button></div></div>`;
  const nf=$('#npfName');if(nf)nf.focus();}
async function npSave(isNew){const name=$('#npfName').value.trim(),type=$('#npfType').value,note=$('#npfNote').value,content=$('#npfContent').value;
  if(!name){toast('Adj nevet','warning');return;}
  try{let id;if(isNew){const r=await fetch('/api/naplo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,type,note,content})}).then(r=>r.json());if(!r.ok)throw 0;id=r.id;}
    else{id=NPcur.id;const r=await fetch('/api/naplo/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,note,content})}).then(r=>r.json());if(!r.ok)throw 0;}
    say('Mentve a Naplóba');await npLoadList();await npOpen(id);}catch(e){toast('Mentés sikertelen','error');}}
window.saveToNaplo=function(type,name,content){select('naplo');setTimeout(()=>{NPcur=null;npRenderForm(true,{type:type||'manual',name:name||'',content:content||''});},60);};

/* ── RENDSZER ── */
const SYSCARDS={
 power:{title:'🔌 Tápellátás & hő',build:d=>{const danger=(d.throttled_flags||[]).some(f=>/MOST/.test(f)),warn=(d.throttled_flags||[]).length>0;let b=sr('Hőmérséklet',esc((d.temp||'').replace('temp=','')))+sr('Mag-feszültség',esc((d.volt||'').replace('volt=','')));
   if(d.battery)b+=sr('Akku',esc(d.battery)+'%'+(d.battery_status?' · '+esc(d.battery_status):''));
   b+=sr('Throttled',esc(d.throttled),danger?'bad':warn?'warn':'ok');
   if((d.throttled_flags||[]).length){b+=`<div style="margin-top:3px">${d.throttled_flags.map(f=>`<span class="sysflag ${/MOST/.test(f)?'bad':'warn'}">${esc(f)}</span>`).join('')}</div><div class="sysnote bad">Alulfeszültség/throttling — spontán kikapcsolást okozhat. Akkuk be, vagy erősebb 5V táp.</div>`;}
   else b+=`<div style="margin-top:3px"><span class="sysflag ok">✓ nincs alulfeszültség</span></div>`;return {body:b,cls:danger?'danger':warn?'warn':''};}},
 defense:{title:'🛡️ Védelmi állapot',build:d=>{const list=d.defense||[],act=list.filter(x=>x.active==='active').length;let b=`<div class="sysnote">Aktív: <b>${act}/${list.length}</b></div>`;
   list.forEach(x=>{let cls,txt;if(x.active==='active'){cls='on';txt='● aktív'+(x.enabled==='enabled'?' · auto':'');}else if(x.active==='inactive'||x.active==='failed'){cls='warn';txt='○ áll';}else{cls='off';txt='– nincs';}b+=sr(x.name,txt,cls);});
   b+=sr('UFW',esc(d.ufw||'—'),/active/i.test(d.ufw||'')?'on':'')+sr('VPN',d.vpn_active?'● aktív':'○ nincs',d.vpn_active?'on':'');return {body:b};}},
 hw:{title:'🧩 Hardver & driver',build:d=>{const h=d.hw||{};return {body:sr('Modell',esc(h.MODEL))+sr('SoC',esc(h.SOC))+sr('CPU',esc(h.CPU||h.SOC))+sr('Magok',esc(h.CORES))+sr('Architektúra',esc(h.ARCH))+sr('Kernel',esc(h.KERNEL))+sr('OS',esc(h.OS))};}},
 system:{title:'🖥️ Rendszer',build:d=>({body:sr('Uptime',esc((d.uptime||'').replace('up ','')))+sr('Terhelés',esc(d.load))+sr('RAM',esc(d.ram))+(d.swap?sr('Swap',esc(d.swap)):'')+sr('Tárhely',esc(d.disk))})},
 wifi:{title:'📶 WiFi kapcsolat',build:d=>({body:sr('SSID',esc(d.wifi_ssid),d.wifi_ssid?'ok':'')+sr('Eszköz',esc(d.wifi_dev))+sr('IP',esc(d.wifi_ip))+(d.wifi_signal?sr('Jel',esc(d.wifi_signal)):'')})},
 net:{title:'🌐 Hálózat',build:d=>{const n=d.net||{};return {body:sr('Átjáró',esc(n.GW))+sr('Eszköz',esc(n.DEV))+sr('DNS',esc(n.DNS))};}},
 ifaces:{title:'🔗 Interfészek',build:d=>{let b='';(d.ifaces||[]).forEach(i=>{const mon=i.monitor_capable?'<span class="sysbadge ok">monitor</span>':(i.wifi?'<span class="sysbadge off">nincs monitor</span>':'');const def=i.name===d.iface_default?' <span class="sysbadge def">audit</span>':'';
   b+=`<div class="sysif"><div><span class="sifn">${esc(i.name)}</span> <span class="sv ${i.state==='up'?'ok':'off'}">${esc(i.state||'?')}</span>${def}</div><div class="muted" style="font-size:10.5px">driver: ${esc(i.driver||'—')}${i.module_version?' (v'+esc(i.module_version)+')':''} ${mon}</div><div class="muted" style="font-size:10.5px">MAC: ${esc(i.mac||'—')} · IP: ${esc(i.ip||'—')}</div></div>`;});return {body:b||sr('—','—')};}},
};
const SYSORDER=['power','defense','hw','system','wifi','net','ifaces'];
function sr(k,v,c){return `<div class="sysr"><span class="sk">${esc(k)}</span><span class="sv ${c||''}">${v==null||v===''?'—':v}</span></div>`;}
let sysTimer=null,sysColl=new Set(store.get('sysColl',[]));
VIEWS.rendszer=()=>`
  ${intro('chip','Részletes rendszer-állapot: tápellátás, hardver, védelem, hálózat, interfészek. A kártyák címére kattintva össze-/kinyithatók.')}
  <div class="tbar">
    <label class="ck"><input type="checkbox" id="sysAuto" data-in="sysAuto"> auto-frissítés (6 mp)</label>
    <button class="btn sm" data-act="sysLoad">${svg(GL.refresh,2)} Frissít</button>
    <span class="grow"></span><span id="sysUpd" class="muted"></span>
  </div>
  <div id="sysGrid" class="sysgrid"><div class="dempty">Betöltés…</div></div>`;
MOUNT.rendszer=()=>{sysLoad();sysSchedule();};
async function sysLoad(){try{const d=await fetch('/api/sysinfo').then(r=>r.json());window._sysData=d;sysRender(d);}catch(e){const g=$('#sysGrid');if(g)g.innerHTML='<div class="dempty">Nem elérhető a rendszer-info (fut a backend? host-elérés?).</div>';}}
function sysRender(d){const g=$('#sysGrid');if(!g)return;g.innerHTML=SYSORDER.map(id=>{const spec=SYSCARDS[id];if(!spec)return'';let built;try{built=spec.build(d);}catch(e){built={body:sr('hiba',esc(e.message))};}const coll=sysColl.has(id);
  return `<div class="syscard ${built.cls||''} ${coll?'collapsed':''}" data-sys="${id}"><div class="sysct" data-act="sysToggle" data-k="${id}">${spec.title}<span class="scol">${coll?'▸':'▾'}</span></div><div class="sysbody">${built.body}</div></div>`;}).join('');
  const u=$('#sysUpd');if(u)u.textContent='frissítve: '+tHM(Date.now());}
function sysSchedule(){if(sysTimer){clearInterval(sysTimer);sysTimer=null;}const a=$('#sysAuto');if(a&&a.checked)sysTimer=setInterval(()=>{if(curView==='rendszer')sysLoad();},6000);}

/* ── FRISSÍTÉS ── */
VIEWS.update=()=>`
  <div class="grow1">${consoleBox('updOut','Frissítés — kimenet','parancs — Enter futtat','updRunLine','Futtat',null,[{act:'updClear',g:'trash',label:'Törlés'}],'A jobb oldali Bővítmények panelen válaszd, mit frissíts (Kali eszközök / Host rendszer); a verziók az Eredmény panelen. A kimenet itt. Vagy írj be parancsot és Enter.')}</div>`;
function updExtHtml(){return `<div class="dtool"><span class="muted" style="font-size:11px;flex:1">Mit frissítsünk?</span><button class="btn sm" data-act="updCheck">${svg(GL.refresh,2)} Verziók</button></div>
  <div class="scan-cat" style="padding:6px 10px 2px">Frissíthető</div>
  <div class="hist"><span class="ht"><b>Pentest-eszközök</b> <span class="muted">Kali konténer</span></span><button class="btn sm pri" id="updTools" data-act="updRun" data-k="tools">${svg(GL.dl,2)} Frissítés</button></div>
  <div class="hist"><span class="ht"><b>Host rendszer</b> <span class="muted">apt</span></span><button class="btn sm" id="updHost" data-act="updRun" data-k="host">${svg(GL.dl,2)} Frissítés</button></div>
  <div class="btnrow" style="margin:8px 10px 0"><button class="btn sm dng" id="updStop" data-act="updStop" disabled>${svg(GL.stop,2)} Leállít</button></div>
  <p class="muted" style="font-size:11px;padding:6px 10px">A frissítés hosszú lehet — ne zárd be közben. A kimenet a terminálon.</p>`;}

/* ── PENTEST (egyszerűsített, ugyanarra a backendre) ── */
let PT={scripts:[],selId:null,tools:{},installing:null};
VIEWS.pentest=()=>`
  <div class="tbar">
    <label>Szkript</label><select class="in" id="ptScriptSel"><option value="">— válassz —</option></select>
    <button class="btn sm" data-act="ptUpload">${svg(GL.up,2)} Feltöltés</button>
    <button class="btn sm" data-act="ptRunSel">Betölt a parancssorba</button>
    <button class="btn sm" data-act="ptSample">Minta</button>
    <span class="grow"></span><span class="muted" style="font-size:11px">Kali-eszközök: jobb oldali Bővítmények panel</span>
  </div>
  <div class="grow1">${consoleBox('ptOut','PenTest terminál — szabad parancs','parancs (pl. nmap -sV 10.0.0.1, nikto -h …) — Enter futtat','ptRunLine','Futtat','ptKill',[{act:'ptClear',g:'trash',label:'Törlés'}],'Írj be bármilyen parancsot és Enter — a backend terminálján fut, a kimenet élőben ide streamel. Szkriptet a fenti legördülőből, Kali-eszközt a jobb oldali „Bővítmények" panelből tölthetsz a parancssorba.')}</div>`;
MOUNT.pentest=()=>{ptLoadScriptsSel();ptToolsFetch();};
async function ptLoadScriptsSel(){const sel=$('#ptScriptSel');if(!sel)return;try{PT.scripts=await fetch('/api/pentest/scripts').then(r=>r.json());sel.length=1;PT.scripts.forEach(s=>{const o=el('option');o.value=s.id;o.textContent=s.name+'.'+s.filetype;sel.appendChild(o);});}catch(e){}}
async function ptToolsFetch(){try{PT.tools=await fetch('/api/pentest/tools').then(r=>r.json());}catch(e){PT.tools={};}if(curTool==='ext')renderDrawer();}
function ptExtDetail(t,inst){
  if(t.apt)return `<h5 style="margin-top:4px">Telepítés (kézi)</h5><div class="cblock"><div class="cbh"><span class="grow"></span><button class="cbcopy" data-act="defCopyTxt" data-k="${esc(t.apt)}" title="Másolás">⧉</button></div><pre>${esc(t.apt)}</pre></div><p class="muted" style="font-size:11px">Kézi telepítésű bővítmény (a WiFi Audit alapcsomagja).</p>`;
  if(inst)return `<div class="btnrow" style="margin:0">${curView==='pentest'?`<button class="btn sm pri" data-act="ptToolUse" data-k="${t.key}">${svg(GL.term,2)} Betölt a parancssorba</button>`:''}<span class="defstat on">✓ telepítve</span></div>`;
  return `<div class="btnrow" style="margin:0"><button class="btn sm" data-act="ptInstall" data-k="${t.key}" ${PT.installing?'disabled':''}>${svg(GL.dl,2)} Telepítés</button><span class="defstat off">⬇ nincs telepítve</span></div>`;}
function ptExtHtml(){const list=EXTLIST[curView]||[];
  return `<div class="dtool"><span class="muted" style="font-size:11px;flex:1">Bővítmények — kattints egy eszközre a részletért</span><button class="btn sm" data-act="ptToolsRefresh">${svg(GL.refresh,2)}</button></div>`
   +(list.length?list.map(t=>{const inst=t.key?!!PT.tools[t.key]:null;const open=EXTSEL===(t.key||t.name);const badge=t.apt?'◦':inst?'✓':'⬇';
     return `<div class="hist" data-act="extSel" data-k="${esc(t.key||t.name)}" style="cursor:pointer"><span class="hb ${inst?'done':''}">${badge}</span><span class="ht"><b>${esc(t.name)}</b> — <span class="muted">${esc(t.desc||'')}</span></span><span class="hm">${open?'▾':'▸'}</span></div>`
       +(open?`<div class="extdetail"><div class="desc" style="padding:4px 10px 8px"><p style="margin:2px 0 6px">${esc(t.desc||'')}</p>${ptExtDetail(t,inst)}</div></div>`:'');}).join('')
     :'<div class="dempty">Nincs bővítmény ehhez a modulhoz.</div>');}
const PTTOOLS=[{key:'nmap',name:'nmap',desc:'Port/szolgáltatás szkenner',cat:'net'},{key:'masscan',name:'masscan',desc:'Ultragyors portszkenner',cat:'net'},{key:'netexec',name:'NetExec',desc:'SMB/WinRM/SSH',cat:'net'},{key:'enum4linux',name:'enum4linux',desc:'SMB enumeráció',cat:'net'},{key:'smbclient',name:'smbclient',desc:'SMB kliens',cat:'net'},{key:'snmpwalk',name:'snmpwalk',desc:'SNMP lekérdezés',cat:'net'},{key:'tcpdump',name:'tcpdump',desc:'Csomagelfogás',cat:'net'},{key:'tshark',name:'tshark',desc:'Wireshark CLI',cat:'net'},
 {key:'nikto',name:'Nikto',desc:'Webszerver-szkenner',cat:'web'},{key:'sqlmap',name:'sqlmap',desc:'SQL injection',cat:'web'},{key:'gobuster',name:'Gobuster',desc:'Könyvtár brute',cat:'web'},{key:'ffuf',name:'ffuf',desc:'Web fuzzer',cat:'web'},{key:'feroxbuster',name:'feroxbuster',desc:'Rekurzív feltérk.',cat:'web'},{key:'wpscan',name:'WPScan',desc:'WordPress',cat:'web'},{key:'nuclei',name:'Nuclei',desc:'Sablon-szkenner',cat:'web'},{key:'whatweb',name:'WhatWeb',desc:'Tech-felismerés',cat:'web'},{key:'sslscan',name:'sslscan',desc:'SSL/TLS vizsgálat',cat:'web'},
 {key:'theharvester',name:'theHarvester',desc:'E-mail/subdomain OSINT',cat:'osint'},{key:'amass',name:'Amass',desc:'Aldomain',cat:'osint'},{key:'subfinder',name:'subfinder',desc:'Aldomain',cat:'osint'},{key:'dnsenum',name:'dnsenum',desc:'DNS enum',cat:'osint'},{key:'dmitry',name:'DMitry',desc:'Infógyűjtő',cat:'osint'},
 {key:'hydra',name:'Hydra',desc:'Login brute',cat:'pass'},{key:'medusa',name:'Medusa',desc:'Login brute',cat:'pass'},{key:'john',name:'John',desc:'Hash törés',cat:'pass'},{key:'hashcat',name:'hashcat',desc:'GPU hash-törés',cat:'pass'},{key:'crunch',name:'crunch',desc:'Szólista',cat:'pass'},
 {key:'aircrack',name:'aircrack-ng',desc:'WiFi audit',cat:'wifi'},{key:'bettercap',name:'bettercap',desc:'MITM keretrendszer',cat:'wifi'},
 {key:'binwalk',name:'binwalk',desc:'Firmware elemzés',cat:'misc'},{key:'exiftool',name:'exiftool',desc:'Metaadat',cat:'misc'},{key:'searchsploit',name:'searchsploit',desc:'Exploit-DB',cat:'misc'}];
/* modulonkénti bővítmény-lista (telepíthető eszközök) a jobb oldali Bővítmények panelhez — PTTOOLS után! */
const EXTLIST={
  nmap:PTTOOLS.filter(t=>t.cat==='net'),
  wifite:[...PTTOOLS.filter(t=>t.cat==='wifi'),
    {name:'wifite',desc:'WiFi audit automatizálás',apt:'sudo apt install wifite'},
    {name:'reaver',desc:'WPS PIN brute-force',apt:'sudo apt install reaver'},
    {name:'bully',desc:'WPS brute-force (alternatíva)',apt:'sudo apt install bully'},
    {name:'hcxdumptool',desc:'PMKID elfogás',apt:'sudo apt install hcxdumptool'},
    {name:'hcxtools',desc:'PMKID / hash konverzió',apt:'sudo apt install hcxtools'},
    {name:'hashcat',desc:'GPU hash-törés',apt:'sudo apt install hashcat'}],
  pentest:PTTOOLS,
};
function ptRunScript(id){const s=PT.scripts.find(x=>x.id===id);if(!s)return;const interp={sh:'bash',py:'python3',rb:'ruby'}[s.filetype]||'bash';
  const cmd=`${interp} uploads/${s.filename}`;ptRunCmd(cmd);}
const PT_TERM={1:'ptOut',2:'vedOut',3:'updOut'};
function ptRunCmd(command,terminalId,termId){terminalId=terminalId||1;termId=termId||'ptOut';cmdHistPush(command);renderLine({raw:'$ '+command,type:'action'},termId);timerStart(termId);
  fetch('/api/pentest/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({terminalId,command})}).then(r=>r.json()).then(d=>{if(d&&d.error)renderLine({raw:'[!] '+(d.message||d.error),type:'error'},termId);}).catch(e=>renderLine({raw:'[!] '+e,type:'error'},termId));}

/* ── TUDÁSBÁZIS ── */
const KBDOCS=[['guide','0. Kezdő lépések'],['legal','1. Jogi háttér'],['method','2. Pentest módszertan'],['nmap','3. Nmap deep dive'],['wifi','4. Wireless security'],['platforms','5. Gyakorló platformok']];
let KBsel='guide';
VIEWS.kb=()=>`<div class="box fill"><div class="bt">Tudásbázis<span class="bt-r muted">etikus hacking</span></div><div class="bc flush" style="flex:1;min-height:0">
  <div class="kbwrap"><div class="kbnav">${KBDOCS.map(d=>`<div class="kbl ${KBsel===d[0]?'active':''}" data-act="kbSel" data-k="${d[0]}">${d[1]}</div>`).join('')}</div>
  <div class="kbbody" id="kbBody"><div class="dempty">Betöltés…</div></div></div></div></div>`;
MOUNT.kb=()=>kbLoad(KBsel);
async function kbLoad(name){KBsel=name;$$('.kbl').forEach(l=>l.classList.toggle('active',l.dataset.k===name));const body=$('#kbBody');if(!body)return;
  try{let r=await fetch(`/docs/${name}.hu.html`);if(!r.ok)r=await fetch(`/docs/${name}.html`);if(!r.ok)throw 0;body.innerHTML=await r.text();body.scrollTop=0;}
  catch(e){body.innerHTML='<div class="dempty">A dokumentum nem tölthető be (fut a backend?).</div>';}}

/* ── BEÁLLÍTÁSOK ── */
const radb=(key,opts,cur)=>`<div class="rad" role="radiogroup">${opts.map(o=>`<label><input type="radio" name="r_${key}" data-in="set" data-k="${key}" value="${o[0]}"${String(o[0])===String(cur)?' checked':''}>${o[1]}</label>`).join('')}</div>`;
const selb=(key,opts,cur)=>`<select class="in" data-in="set" data-k="${key}">${opts.map(o=>`<option value="${o[0]}"${String(o[0])===String(cur)?' selected':''}>${o[1]}</option>`).join('')}</select>`;
VIEWS.settings=()=>{const treeOff=document.body.classList.contains('tree-off');const dws=[320,400,480,560,640];
  return `${intro('gear','A program saját témát, méretet és sűrűséget használ — nem a böngészőét. A választás ezen az eszközön megmarad.')}
  <div class="cols c3">
    ${box('Megjelenés',`<div class="frm">
      <div class="fr"><label>Téma</label>${radb('theme',[['light','Világos'],['dark','Sötét']],appTheme)}</div>
      <div class="fr"><label>Felület mérete</label>${selb('scale',scaleList().map(v=>[v,v+'%'+(v===100?' — alap':v===125?' — ajánlott 7"-on':'')]),appScale)}</div>
      <div class="fr"><label>Sűrűség</label>${radb('density',[['compact','Kompakt'],['cozy','Kényelmes']],appDensity)}</div>
      <div class="fr"><label>Jelzők lüktetése</label>${selb('blink',[['off','Ki'],['slow','Lassú'],['normal','Normál'],['fast','Gyors']],appBlink)}</div>
      <p class="fhint">A méret mindent arányosan nagyít. 7"-os, 1280×720-as kijelzőn (uConsole) a 125% jó kiindulás. Csak a piros jelzés lüktet ${L('r')}.</p>
    </div>`,`${appScale}% · ${appDensity==='cozy'?'kényelmes':'kompakt'}`)}
    ${box('Görgetés és panelek',`<div class="frm">
      <div class="fr"><label>Húzásos görgetés</label>${radb('pan',[['on','Be'],['off','Ki']],appPan)}</div>
      <div class="fr"><label>Görgetősáv</label>${radb('sb',[['show','Látszik'],['hide','Rejtve']],appSb)}</div>
      <div class="fr"><label>Sáv vastagsága</label>${selb('sbw',[[6,'Vékony — 6 px'],[10,'Normál — 10 px'],[16,'Vastag — 16 px'],[22,'Extra — 22 px']],appSbw)}</div>
      <div class="fr"><label>Segédpanel szélesség</label>${selb('dw',(dws.includes(appDw)?dws:[...dws,appDw].sort((a,b)=>a-b)).map(v=>[v,v+' px'+(v===400?' — alap':'')]),appDw)}</div>
      <div class="fr"><label>Navigációs fa</label>${radb('tree',[['on','Látszik'],['off','Rejtve']],treeOff?'off':'on')}</div>
      <p class="fhint"><b>Húzásos görgetés:</b> a lapot/táblát lenyomott egérgombbal elhúzhatod. A segédpanel a bal szélénél fogva is méretezhető.</p>
    </div>`)}
    ${box('Nyelv és eszköz',`<div class="frm">
      <div class="fr"><label>Nyelv</label>${selb('lang',[['hu','🇭🇺 Magyar'],['en','🇬🇧 English'],['de','🇩🇪 Deutsch'],['es','🇪🇸 Español']],(typeof currentLang!=='undefined'?currentLang:'hu'))}</div>
      <div class="fr"><label>Audit interfész</label><input class="in mono" value="wlan1" disabled></div>
      <p class="fhint">A nyelv a terminál-magyarázatokra és a tudásbázisra hat. A kezelőfelület feliratai magyarul vannak.</p>
      <div class="fsub">Névjegy</div>
      <p class="fhint">EthTest Konzol — a pentest-toolkit klasszikus vállalati elrendezésre építve. Motor: Flask backend (app.py). Csak etikus, engedélyezett tesztre.</p>
      <div class="btnrow"><button class="btn" data-act="setReset">${svg(GL.undo,2)} Alaphelyzet</button></div>
    </div>`)}
  </div>`;};

VIEWS._stub=id=>`${intro('doc','Ez a modul tervezés alatt.')}${box(TITLE[id]||'Modul','<p class="muted">Hamarosan.</p>')}`;

/* ═══════════════ JOBB OLDALI PANEL ═══════════════ */
const TERMID={nmap:'nmapOut',wifite:'wifiteOut',pentest:'ptOut',vedelem:'vedOut'};
const CMDID={nmap:'nmapOutCmd',wifite:'wifiteOutCmd',pentest:'ptOutCmd'};
const RAIL=[{id:'ctx',label:'Nézet',glyph:'grid'},{id:'ext',label:'Bővítm.',glyph:'puzzle'},{id:'desc',label:'Leírás',glyph:'doc'},{id:'flow',label:'Folyamat',glyph:'flow'},{id:'tasks',label:'Teendők',glyph:'tasks'},{sep:1},
  {id:'export',label:'Export',glyph:'dl'},{id:'hist',label:'Előzmény',glyph:'history'},{sep:1},
  {id:'quick',label:'Beáll.',glyph:'gear'},{id:'ref',label:'Referencia',glyph:'book'},{sep:1},
  {id:'log',label:'Napló',glyph:'list'},{id:'note',label:'Jegyzet',glyph:'note'}];
/* KÖZÖS panelek; a tartalom a modulhoz igazodik, a gomb halvány/inaktív, ha nincs hozzá tartalom */
function railAvail(id){
  if(id==='flow')return !!FLOW[curView];
  if(id==='ctx')return ['nmap','wifite','vedelem','update'].includes(curView);
  if(id==='ext')return ['nmap','wifite','pentest','vedelem','update'].includes(curView);
  if(id==='desc')return !!DESC[curView];
  if(id==='export')return !!TERMID[curView];
  if(id==='hist')return !!CMDID[curView];
  return true;
}
function updateRailState(){$$('.rbtn').forEach(b=>{const ok=railAvail(b.dataset.tool);b.classList.toggle('off',!ok);b.disabled=!ok;});}
const DESC={
  overview:['A konzol kezdőképe.','<p>Balra a modulok, jobbra ez az ikonsor. Minden modulhoz tartozik Leírás, Folyamat, Teendők, Esemény-napló és Jegyzet.</p><div class="warn"><b>Etikai figyelmeztetés.</b> Csak saját vagy írásos engedéllyel bíró hálózaton/rendszeren tesztelj.</div>'],
  wifite:['Automatikus WiFi-audit.','<p>A wifite monitor-képes interfészt igényel (wlan1). PMKID, WPS és jelszótörés (wordlist) módszerek. A talált hálózatok a listában kattinthatók — a számot a futó wifite-nak küldi.</p><h5>Megállás</h5><p>A „Keresés leállítása (Ctrl+C)" a célpont-listához ugrik; a „Leállít" teljesen megállítja.</p>'],
  nmap:['Port- és sebezhetőség-szkennelés.','<p>42 profil hat kategóriában. A generált parancs élőben látszik; egyéni parancs felülírja. A futás után az összesítő csempék kattinthatók (host/port/IP/sebezhetőség/hiba) — a részletek ide, a panelbe jönnek.</p>'],
  pentest:['Szkript-kezelő és eszköz-katalógus.','<p>Saját szkriptek (sh/py/rb) feltöltése, futtatása a backend terminálján, és a Kali-eszközök telepítése. Ez egyszerűsített nézet; az eredeti több-paneles T1–T6 folyamat helyett egy futtató-terminál.</p>'],
  vedelem:['Védelmi eszközök telepítése és bekapcsolása.','<p>A katalógus a jobb oldali <b>Bővítmények</b> panelen — egy eszközre kattintva kijelölöd, a műveletei a felső sávban (Telepít, Kikapcsol) és a panelben jelennek meg. A fejléc <b>Indít</b> bekapcsolja a kijelöltet, a <b>Leállít</b> megállítja a futó műveletet.</p><p>Négy kategória, 19 eszköz. Minden eszköznél telepítés és bekapcsolás, a „mire jó" az ⓘ alatt, a parancs a ⧉-vel másolható. A router-beállítások csak útmutatók.</p>'],
  rendszer:['Rendszer-állapot.','<p>Tápellátás/hő, hardver, védelem, hálózat, interfészek. Az auto-frissítés 6 másodpercenként frissít. A kártyák össze-/kinyithatók.</p>'],
  naplo:['Mentett eredmények és jegyzetek.','<p>A WiFi/Nmap/PenTest/Védelem modulok „Naplóz" gombja ide ment. Itt szerkeszthető, exportálható, törölhető.</p>'],
  kb:['Tudásbázis.','<p>Jogi háttér, módszertan, Nmap és wireless mélymerülés, gyakorló platformok. A dokumentumok a /docs mappából töltődnek.</p>'],
  update:['Frissítés.','<p>A Kali pentest-eszközök (konténer) vagy a host rendszer frissítése. A verziók előbb lekérhetők.</p>'],
  settings:['Megjelenés és eszköz.','<p>Téma, méret, sűrűség, görgetés, panelek, nyelv — mind a program saját beállítása, a böngészőtől függetlenül.</p>'],
};
const FLOW={
  wifite:{cur:1,steps:[{k:'s',l:'Monitor mód'},{l:'Hálózatok keresése',d:'wifite -i wlan1',who:'Eszköz'},{k:'d',l:'Célpont?',no:'Keresés leállítása (Ctrl+C), majd szám'},{l:'Handshake / PMKID',d:'deauth + capture',who:'Eszköz'},{l:'Jelszótörés',d:'wordlist',who:'Eszköz'},{k:'e',l:'Eredmény'}]},
  nmap:{cur:0,steps:[{k:'s',l:'Cél megadása'},{l:'Host discovery',d:'ki van online',who:'nmap'},{l:'Port scan',d:'nyitott portok',who:'nmap'},{l:'Szolgáltatás/NSE',d:'verzió, scriptek',who:'nmap'},{k:'e',l:'Összegzés'}]},
  vedelem:{cur:0,steps:[{k:'s',l:'Eszköz kiválasztása'},{l:'Telepítés',d:'apt install',who:'Rendszer'},{l:'Bekapcsolás',d:'systemctl enable',who:'Rendszer'},{k:'e',l:'Védve'}]},
  pentest:{cur:0,steps:[{k:'s',l:'Szkript / eszköz'},{l:'Futtatás',d:'terminál T1',who:'Backend'},{l:'Eredmény',d:'kimenet',who:'Backend'},{k:'e',l:'Naplózás'}]},
  _:{cur:0,steps:[{k:'s',l:'Kezdés'},{l:'Művelet',d:'a modul funkciója',who:'Felhasználó'},{k:'e',l:'Kész'}]},
};
const TASKS=store.get('tasks',{});
const NOTES=store.get('notes',{});
const RLBL={ctx:'Eredmény',ext:'Bővítmények',desc:'Leírás',flow:'Folyamat',tasks:'Teendők',export:'Export / Mentés',hist:'Parancs-előzmény',quick:'Gyorsbeállítás',ref:'Referencia',log:'Esemény-napló',note:'Jegyzet'};
function buildRail(){const r=$('#rail');r.innerHTML='';RAIL.forEach(x=>{if(x.sep){r.appendChild(el('div','rsep'));return;}const b=el('button','rbtn',svg(GL[x.glyph]));b.dataset.tool=x.id;b.title=RLBL[x.id]||x.label;b.setAttribute('aria-label',RLBL[x.id]||x.label);b.onclick=()=>toggleTool(x.id);r.appendChild(b);});updateRailState();}
function badges(){const set=(id,n,c)=>{const b=document.querySelector(`.rbtn[data-tool="${id}"]`);if(!b)return;b.querySelector('.bdg')?.remove();if(n)b.appendChild(el('span','bdg '+(c||''),String(n)));};
  set('tasks',(TASKS[curView]||[]).filter(t=>!t.done).length);set('log',unseen,'r');}
function toggleTool(id){if(!railAvail(id))return;if(curTool===id){closeTool();return;}openTool(id);}
function openTool(id){curTool=id;if(id==='log')unseen=0;document.body.classList.add('drawer-open');const d=$('#drawer');d.setAttribute('aria-hidden','false');d.inert=false;$$('.rbtn').forEach(b=>b.classList.toggle('active',b.dataset.tool===id));renderDrawer();badges();}
function closeTool(){curTool=null;document.body.classList.remove('drawer-open');const d=$('#drawer');d.setAttribute('aria-hidden','true');d.inert=true;$$('.rbtn').forEach(b=>b.classList.remove('active'));}
function renderDrawer(){if(!curTool)return;const b=$('#drawerBody');const y=b.scrollTop;$('#drawerTitle').textContent=RLBL[curTool];$('#drawerSub').textContent='· '+TITLE[curView];
  $('#drawerIcon').innerHTML=`<span style="display:grid;color:var(--accent);width:16px;height:16px">${svg(GL[(RAIL.find(x=>x.id===curTool)||{}).glyph])}</span>`;
  b.innerHTML=DRAWER[curTool]();b.scrollTop=y;
  if(curTool==='ctx'&&curView==='wifite'){wfRenderTargets();wfTile();wfLoadHandshakes();}
  if(curTool==='ctx'&&curView==='vedelem'){DEFENSES.forEach(d=>{if(d.key)defRefreshOne(d.key);});}}
const DRAWER={
  ctx(){const v=curView;
    if(v==='nmap'){const d=NMDATA,c={hosts:d.hosts.length,ports:d.ports.length,ips:d.ips.length,vuln:d.vuln.length,error:d.error.length};
      const tile=(k,lbl,cls)=>`<div class="ttile clk ${cls||''}" data-act="nmModal" data-k="${k}"><div class="tv">${c[k]}</div><div class="tk">${lbl}</div></div>`;
      const any=c.hosts||c.ports||c.ips||c.vuln||c.error;const hl=nmHist();
      return `<div style="padding:10px 12px 0"><h4 style="margin:0;font-size:14px">Nmap — eredmény</h4><div class="muted" style="margin-bottom:6px">kattints a csempére a részletért</div></div>
        <div class="term-tiles" style="margin:0 10px;border:1px solid var(--line)">${tile('hosts','host')}${tile('ports','port')}${tile('ips','IP')}${tile('vuln','sebz.','r')}${tile('error','hiba','y')}</div>
        <div style="padding:8px 10px">${any?(nmModalHtml('hosts')+(c.ports?'<div class="scan-cat">Nyitott portok</div>'+nmModalHtml('ports'):'')+(c.vuln?'<div class="scan-cat">Sebezhetőségek</div>'+nmModalHtml('vuln'):'')):'<div class="dempty">Futtass egy scant — a host/port/sebezhetőség eredmény ide kerül.</div>'}</div>
        <div class="scan-cat" style="padding:0 12px 2px">Előzmények (utolsó 5)</div><div style="padding:0 4px">${hl.length?hl.map(e=>`<div class="hist"><span class="hb ${e.status}">${e.status}</span><span class="ht" title="${esc(e.target)}">${esc(e.target)}</span><span class="hm">${e.time} · ${e.scanType}</span>${e.status!=='error'&&e.scanType!=='custom'?`<button class="btn sm" data-act="nmRerun" data-k="${esc(e.target)}" data-t="${e.scanType}">▶</button>`:''}</div>`).join(''):'<div class="dempty">Nincs korábbi scan.</div>'}</div>`;}
    if(v==='wifite'){const s=STATE.wifite;
      return `<div style="padding:10px 12px 0"><h4 style="margin:0;font-size:14px">WiFi — eredmény</h4></div>
        <div class="term-tiles" style="margin:4px 10px;border:1px solid var(--line)">
          <div class="ttile"><div class="tv" id="wfNet">${s.networks}</div><div class="tk">hálózat</div></div>
          <div class="ttile g"><div class="tv" id="wfHs">${s.handshakes}</div><div class="tk">handshake</div></div>
          <div class="ttile g"><div class="tv" id="wfCr">${s.cracked}</div><div class="tk">feltört</div></div></div>
        <div class="scan-cat" style="padding:4px 12px 2px">Talált hálózatok</div><div id="wfTargets" style="padding:0 4px"><div class="dempty">A keresés indítása után itt jelennek meg.</div></div>
        <div class="scan-cat" style="padding:8px 12px 2px">Elkapott handshake-ek</div><div id="wfHsList" style="padding:0 6px"><div class="dempty">—</div></div>`;}
    if(v==='vedelem'){
      return `<div style="padding:10px 12px 0"><h4 style="margin:0;font-size:14px">Védelem — állapot</h4><div class="muted" style="margin-bottom:6px">telepített és aktív eszközök — kattints a kijelöléshez</div></div>`
       +Object.keys(DEFCATS).map(cat=>`<div class="scan-cat" style="padding:6px 12px 2px">${DEFCATS[cat]}</div>`
         +DEFENSES.filter(d=>d.cat===cat).map(d=>{const st=DEFSTAT[d.key]||{};return `<div class="hist ${EXTSEL===d.name?'sel':''}" data-act="extSel" data-k="${esc(d.name)}" style="cursor:pointer"><span class="ht"><b>${esc(d.name)}</b> <span class="muted">${esc(d.tag)}</span></span><span class="defstat ${st.cls||''}" data-defstat="${d.key||''}">${d.key?(st.txt||'…'):'🔧 kézi'}</span></div>`;}).join('')).join('');}
    if(v==='update'){const u=UPDVER||{};const pre=t=>`<pre style="margin:0 10px;white-space:pre-wrap;font-family:var(--mono);font-size:11px;background:var(--surface-2);border:1px solid var(--line);padding:6px">${esc(t||'—')}</pre>`;
      return `<div style="padding:10px 12px 0"><h4 style="margin:0;font-size:14px">Frissítés — verziók</h4><div class="muted" style="margin-bottom:6px">${UPDVER?'lekérve':'kattints a „Verziók" gombra a Bővítmények panelen'}</div></div>
        <div class="scan-cat" style="padding:6px 12px 2px">Pentest-eszközök (Kali)</div>${pre(u.container)}
        <div class="scan-cat" style="padding:8px 12px 2px">Host rendszer</div>${pre(u.host)}`;}
    return DRAWER.desc();},
  desc(){const d=DESC[curView]||['Rövid leírás.','<p>Ehhez a modulhoz a leírás később készül el.</p>'];return `<div class="desc"><h4>${TITLE[curView]}</h4><div class="lead">${d[0]}</div>${d[1]}</div>`;},
  flow(){const f=FLOW[curView]||FLOW._;return `<div class="desc"><h4>${TITLE[curView]} — folyamat</h4>${f.steps.map((s,i)=>{const st=i<f.cur?'done':i===f.cur?'now':'todo';
    if(s.k==='s'||s.k==='e')return `<div style="text-align:center;margin:6px 0"><span class="hb ${st==='todo'?'':'done'}" style="padding:2px 12px;border-radius:12px">${s.l}</span></div>`;
    if(s.k==='d')return `<div class="note warn" style="margin:6px 0"><span class="ni">?</span><div><b>${s.l}</b><br><span class="muted">nem → ${esc(s.no)}</span></div></div>`;
    return `<div class="defcard" style="margin:5px 0"><div class="defhead"><span class="dn">${i}. ${esc(s.l)}</span><span class="dtag ${st==='now'?'crit':''}">${st==='now'?'most · ':''}${esc(s.who)}</span></div><div class="defdesc" style="border:0">${esc(s.d)}</div></div>`;}).join('')}</div>`;},
  tasks(){const ts=TASKS[curView]||[];return `<div class="dtool"><input class="in" id="tkIn" style="flex:1" placeholder="Új teendő…" data-enter="tkAdd" maxlength="90"><button class="btn sm pri" data-act="tkAdd">${svg(GL.plus,2)}</button></div>`
    +(ts.length?ts.map(t=>`<label class="hist" style="cursor:pointer"><input type="checkbox" data-in="tkCk" data-k="${t.id}" ${t.done?'checked':''}><span class="ht ${t.done?'muted':''}" style="${t.done?'text-decoration:line-through':''}">${esc(t.t)}</span></label>`).join(''):`<div class="dempty">${svg(GL.tasks)}<br>Nincs teendő ehhez a modulhoz.</div>`);},
  log(){const rows=APPLOG.slice().reverse();return `<div class="dtool"><button class="btn sm" data-act="logClear">${svg(GL.trash,2)} Ürít</button><span class="grow"></span><span class="muted" style="font-size:11px">${rows.length} esemény</span></div>`
    +(rows.length?`<table class="logt"><tbody>${rows.map(r=>`<tr class="${r.l}"><td class="t">${tHM(r.t)}</td><td style="width:1px">${L(r.l)}</td><td class="m" title="${esc(r.m)}">${esc(r.m)}</td></tr>`).join('')}</tbody></table>`:`<div class="dempty">${svg(GL.list)}<br>Nincs esemény.</div>`);},
  note(){const v=NOTES[curView]||'';return `<div class="dstate">Jegyzet: ${esc(TITLE[curView])} — ezen az eszközön tárolva</div><div class="noteedit"><textarea data-in="ntText" placeholder="Jegyzet a(z) „${esc(TITLE[curView])}" modulhoz…" spellcheck="false">${esc(v)}</textarea></div>`;},
  export(){const ttl=TITLE[curView];return `<div class="desc"><h4>Export / Mentés</h4><div class="lead">${ttl} kimenete</div>
    <div class="btnrow" style="margin:0"><button class="btn pri" data-act="expDl">${svg(GL.dl,2)} Letöltés .txt</button><button class="btn" data-act="expNaplo">${svg(GL.save,2)} Mentés a Naplóba</button></div>
    <p class="muted" style="margin-top:10px">A fájl az aktuális terminál teljes tartalmát menti. A Napló a programon belül, kereshetően őrzi meg.</p></div>`;},
  hist(){const rows=CMDHIST.slice().reverse();return `<div class="dtool"><span class="muted" style="font-size:11px;flex:1">Kattints — betölti a parancssorba</span><button class="btn sm" data-act="histClear">${svg(GL.trash,2)} Ürít</button></div>`
    +(rows.length?rows.map(h=>`<div class="hist" data-act="histUse" data-k="${esc(h.cmd)}" style="cursor:pointer"><span class="hb">${esc((TITLE[h.v]||'').slice(0,4))}</span><span class="ht mono" title="${esc(h.cmd)}">${esc(h.cmd)}</span><span class="hm">${tHM(h.t)}</span></div>`).join(''):`<div class="dempty">${svg(GL.history)}<br>Még nincs futtatott parancs.</div>`);},
  quick(){return `<div class="desc"><h4>Gyorsbeállítás</h4><div class="lead">Megjelenés — bármelyik modulból</div>
    <div class="frm">
      <div class="fr"><label>Téma</label>${radb('theme',[['light','Világos'],['dark','Sötét']],appTheme)}</div>
      <div class="fr"><label>Méret</label>${selb('scale',scaleList().map(v=>[v,v+'%']),appScale)}</div>
      <div class="fr"><label>Sűrűség</label>${radb('density',[['compact','Kompakt'],['cozy','Kényelmes']],appDensity)}</div>
      <div class="fr"><label>Lüktetés</label>${selb('blink',[['off','Ki'],['slow','Lassú'],['normal','Normál'],['fast','Gyors']],appBlink)}</div>
    </div><p class="muted" style="margin-top:8px">Teljes beállítások a <button class="lnk" data-go="settings">Beállítások</button> modulban.</p></div>`;},
  ref(){const ports=[['21','FTP'],['22','SSH'],['23','Telnet'],['25','SMTP'],['53','DNS'],['80','HTTP'],['110','POP3'],['143','IMAP'],['443','HTTPS'],['445','SMB'],['3306','MySQL'],['3389','RDP'],['8080','HTTP-alt'],['8443','HTTPS-alt']];
    return `<div class="desc"><h4>Referencia</h4><div class="lead">Gyakori portok, keresők, puska</div>
      <h5>Gyakori portok</h5><table class="logt"><tbody>${ports.map(p=>`<tr><td class="t mono">${p[0]}</td><td>${p[1]}</td></tr>`).join('')}</tbody></table>
      <h5>Keresők</h5><p><a href="https://nvd.nist.gov/vuln/search" target="_blank" rel="noopener">NVD CVE-kereső ↗</a><br><a href="https://www.exploit-db.com/" target="_blank" rel="noopener">Exploit-DB ↗</a></p>
      <h5>Puska</h5><p><code>nmap -sV -sC -O &lt;cél&gt;</code> — alap audit<br><code>nmap --script vuln &lt;cél&gt;</code> — sebezhetőség<br><code>nikto -h &lt;url&gt;</code> — web</p></div>`;},
  ext(){return curView==='vedelem'?defExtHtml():curView==='update'?updExtHtml():ptExtHtml();},
};

/* ═══════════════ MŰVELETEK ═══════════════ */
const ACT={
  /* nmap */
  async nmapRun(){if(STATE.nmap.running){toast('Már fut egy scan','warning');return;}const cmd=($('#nmapOutCmd')?.value||'').trim();if(!cmd||/<cél>/.test(cmd)){toast('Adj meg célt a parancsban','warning');return;}
    cmdHistPush(cmd);
    try{const d=await fetch('/api/nmap/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCmd:cmd,useSudo:NM.sudo})}).then(r=>r.json());if(d&&d.error)toast(d.error,'error');}catch(e){toast('Hálózati hiba','error');}},
  nmapStart(){ACT.nmapRun();},
  nmapStop(){fetch('/api/nmap/stop',{method:'POST'}).catch(()=>{});},
  nmapClear(){termClear('nmapOut');},
  nmapExport(){dl('nmap_scan.txt',termText('nmapOut'));},
  nmapNaplo(){const lines=termText('nmapOut').split('\n');const keep=lines.filter(t=>/\bopen\b|\/tcp|\/udp|Nmap (scan report|done)|MAC Address|Running:|OS details|Service Info|host(s)? up/i.test(t));saveToNaplo('nmap','Nmap — '+tDate(Date.now()),(keep.length?keep.join('\n'):lines.slice(-50).join('\n'))||'(üres)');},
  nmRerun(b){NM.target=b.dataset.k;NM.type=b.dataset.t;rerender();setTimeout(()=>ACT.nmapRun(),120);},
  nmModal(b){NMDATA._t=b.dataset.k;openTool('desc');const body=$('#drawerBody');$('#drawerTitle').textContent='Nmap — '+({hosts:'hostok',ports:'portok',ips:'IP-k',vuln:'sebezhetőségek',error:'hibák'}[b.dataset.k]);body.innerHTML=`<div style="padding:8px">${nmModalHtml(b.dataset.k)}</div>`;},
  /* wifite */
  async wifiteStart(){if(STATE.wifite.running)return;const body={iface:WF.iface||'wlan1',wordlist:WF.wordlist,methods:{pmkid:WF.pmkid,wps:WF.wps,crack:WF.crack},wpsTool:WF.wpsTool,randomMac:WF.randomMac};
    try{const d=await fetch('/api/wifite/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());if(d&&d.status==='unsupported'){toast('A wifite csak Linuxon érhető el','warning');renderLine({raw:d.message,type:'warning'},'wifiteOut');}}catch(e){toast('Hálózati hiba','error');}},
  wifiteStop(){say('WiFi audit leállítása…','y');renderLine({raw:'[*] Leállítás kérve — eszközlánc leállítása, WiFi visszaállítása…',type:'action'},'wifiteOut');fetch('/api/wifite/stop',{method:'POST'}).catch(()=>{});},
  wifiteClear(){termClear('wifiteOut');},
  wifiteExport(){dl('wifite_scan.txt',termText('wifiteOut'));},
  wifiteCtrlC(){wfSendInput({ctrl_c:true});toast('Ctrl+C elküldve','info');},
  wifiteGo(){if(STATE.wifite.running)ACT.wifiteSend();else ACT.wifiteStart();},
  wifiteSend(){const el=$('#wifiteOutCmd');const v=(el?.value||'').trim();if(!v)return;wfSendInput({text:v});renderLine({raw:'> '+v,type:'action'},'wifiteOut');el.value='';},
  wifiteTarget(b){wfSendInput({text:b.dataset.k});renderLine({raw:'> célpont: '+b.dataset.k,type:'action'},'wifiteOut');},
  wifiteHsRefresh(){wfLoadHandshakes();},
  wifiteNaplo(){const s=STATE.wifite;const sum=`Összesítés: ${s.networks} hálózat, ${s.handshakes} handshake/PMKID, ${s.cracked} feltört.`;saveToNaplo('wifi','WiFi audit — '+tDate(Date.now()),sum+'\n\n'+termText('wifiteOut'));},
  /* védelem */
  extSel(b){const k=b.dataset.k;EXTSEL=(EXTSEL===k)?null:k;renderDrawer();if(curView==='vedelem'){const tb=$('#vedTbar');if(tb)tb.outerHTML=vedTbarHtml();if(EXTSEL){const d=DEFENSES.find(x=>x.name===EXTSEL);if(d&&d.key)setTimeout(()=>defRefreshOne(d.key),30);}}},
  defCopyTxt(b){const txt=b.dataset.k;if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>{const o=b.textContent;b.textContent='✓';setTimeout(()=>b.textContent=o,1000);});},
  defInfo(b){const c=b.closest('.defcard').querySelector('.defdesc');c.hidden=!c.hidden;},
  defCopy(b){const code=b.closest('.defrow').querySelector('.defcode').textContent;if(navigator.clipboard)navigator.clipboard.writeText(code).then(()=>{const o=b.textContent;b.textContent='✓';setTimeout(()=>b.textContent=o,1200);}).catch(()=>{});},
  async defRun(b){if(defBusy){toast('Egy művelet már fut','warning');return;}const key=b.dataset.key,action=b.dataset.action;const ife=document.querySelector(`[data-defiface="${key}"]`);
    const dd=DEFENSES.find(x=>x.key===key);const cmdText=action==='install'?(dd&&dd.install):action==='enable'?(dd&&dd.enable):null;
    defSetBusy(true);renderLine({raw:'$ '+(cmdText||`[${key} · ${action}]`),type:'action'},'vedOut');
    try{const d=await fetch('/api/defense/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,action,iface:ife?ife.value.trim():''})}).then(r=>r.json());if(d&&d.error){defSetBusy(false);renderLine({raw:'[!] '+(d.message||d.error),type:'error'},'vedOut');}}catch(e){defSetBusy(false);renderLine({raw:'[!] '+e,type:'error'},'vedOut');}},
  defStop(){fetch('/api/defense/stop',{method:'POST'}).catch(()=>{});},
  vedRunLine(){const i=$('#vedOutCmd');const cmd=(i?.value||'').trim();if(!cmd)return;ptRunCmd(cmd,2,'vedOut');if(i)i.value='';},
  vedStart(){const d=DEFENSES.find(x=>x.name===EXTSEL);if(!d||!d.key){toast('Válassz egy eszközt a jobb oldali Bővítmények panelen','warning');openTool('ext');return;}ACT.defRun({dataset:{key:d.key,action:'enable'}});},
  defClear(){termClear('vedOut');},
  defRefresh(){DEFENSES.forEach(d=>{if(d.key)defRefreshOne(d.key);});toast('Állapot frissítve','info');},
  /* napló */
  npNew(){NPcur=null;npRenderForm(true,{type:'manual'});},
  npRefresh(){npLoadList();},
  npOpen(b){npOpen(b.dataset.k);},
  npEdit(){if(NPcur)npRenderForm(false);},
  npCancel(){if(NPcur)npRenderView();else{$('#npDetail').innerHTML='<div class="dempty">Válassz egy bejegyzést.</div>';$('#npHdr').innerHTML='';}},
  npSave(b){npSave(b.dataset.new==='1');},
  async npDelete(){if(!NPcur)return;if(!confirm(`Törlöd? „${NPcur.name}" — nem vonható vissza.`))return;try{const r=await fetch('/api/naplo/'+encodeURIComponent(NPcur.id),{method:'DELETE'}).then(r=>r.json());if(!r.ok)throw 0;say('Törölve','y');NPcur=null;$('#npDetail').innerHTML='<div class="dempty">Válassz egy bejegyzést.</div>';$('#npHdr').innerHTML='';npLoadList();}catch(e){toast('Törlés sikertelen','error');}},
  npExport(){if(!NPcur)return;const d=NPcur;dl('naplo_'+d.id+'.txt',`# ${d.name}\nTípus: ${d.type}\nIdő: ${tDate(d.created)}\n`+(d.note?`\nJegyzet:\n${d.note}\n`:'')+`\n--- Tartalom ---\n${d.content||''}\n`);},
  /* rendszer */
  sysLoad(){sysLoad();},
  sysToggle(b){const id=b.dataset.k;if(sysColl.has(id))sysColl.delete(id);else sysColl.add(id);store.set('sysColl',[...sysColl]);const card=b.closest('.syscard');card.classList.toggle('collapsed');b.querySelector('.scol').textContent=sysColl.has(id)?'▸':'▾';},
  /* update */
  async updCheck(){try{const d=await fetch('/api/update/versions').then(r=>r.json());UPDVER={container:d.container||'(nincs adat)',host:d.host||'(nincs adat)'};openTool('ctx');toast('Verziók lekérve','info');}catch(e){toast('Verziók nem elérhetők','error');}},
  updRunLine(){const i=$('#updOutCmd');const cmd=(i?.value||'').trim();if(!cmd)return;ptRunCmd(cmd,3,'updOut');if(i)i.value='';},
  async updRun(b){termClear('updOut');renderLine({raw:'[*] '+(b.dataset.k==='tools'?'Eszközök':'Host')+' frissítése indul… (ne zárd be)',type:'action'},'updOut');['updTools','updHost'].forEach(id=>{const e=$('#'+id);if(e)e.disabled=true;});$('#updStop').disabled=false;
    try{await fetch('/api/update/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:b.dataset.k})});}catch(e){renderLine({raw:'[HIBA] '+e,type:'error'},'updOut');}},
  updStop(){fetch('/api/update/stop',{method:'POST'}).catch(()=>{});renderLine({raw:'[*] Leállítás kérve…',type:'action'},'updOut');},
  updClear(){termClear('updOut');},
  /* pentest */
  ptRunLine(){const cmd=($('#ptOutCmd')?.value||'').trim();if(!cmd)return;ptRunCmd(cmd);},
  ptRunSel(){const id=+($('#ptScriptSel')?.value||0);const s=PT.scripts.find(x=>x.id===id);if(!s){toast('Válassz szkriptet','warning');return;}const interp={sh:'bash',py:'python3',rb:'ruby'}[s.filetype]||'bash';const i=$('#ptOutCmd');if(i){i.value=`${interp} uploads/${s.filename}`;i.focus();}},
  ptUpload(){$('#ptFileInput').click();},
  async ptSample(){try{const r=await fetch('/api/pentest/sample');const txt=await r.text();dl('pentest-sample.sh',txt);toast('Minta letöltve','success');}catch(e){toast('Nem elérhető','error');}},
  ptToolsLoad(){ptToolsFetch();},
  ptOpenExt(){openTool('ext');},
  ptToolsRefresh(){ptToolsFetch();},
  ptToolUse(b){const i=$('#ptOutCmd');if(i){i.value=b.dataset.k+' ';i.focus();}},
  async ptInstall(b){if(PT.installing){toast('Egy telepítés már fut','warning');return;}PT.installing=b.dataset.k;ptToolsFetch();renderLine({raw:'$ telepítés: '+b.dataset.k,type:'action'},'ptOut');
    try{const r=await fetch('/api/pentest/tool/install',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:b.dataset.k,terminalId:1})}).then(r=>r.json());if(r&&r.error){PT.installing=null;ptToolsFetch();toast(r.message||r.error,'error');}}catch(e){PT.installing=null;toast('Hálózati hiba','error');}},
  ptKill(){fetch('/api/pentest/kill',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({terminalId:1})}).catch(()=>{});timerStop('ptOut');},
  ptClear(){termClear('ptOut');},
  ptNaplo(){saveToNaplo('pentest','PenTest — '+tDate(Date.now()),termText('ptOut'));},
  /* kb */
  kbSel(b){kbLoad(b.dataset.k);},
  /* beállítások */
  set(b){const k=b.dataset.k,v=b.dataset.v!=null?b.dataset.v:b.value;SET[k](v);if(curView==='settings')rerender();say('Beállítás: '+k);},
  setReset(){setTheme('light');setScale(100);setDensity('compact');setBlink('normal');setSb('show');setSbw(10);setPan('on');setDw(400);setTree(false);rerender();say('Megjelenés alaphelyzetbe');},
  /* teendők / jegyzet */
  tkAdd(){const i=$('#tkIn'),t=(i.value||'').trim();if(!t)return;(TASKS[curView]=TASKS[curView]||[]).push({id:uid(),t,done:false});store.set('tasks',TASKS);renderDrawer();badges();$('#tkIn').focus();},
  logClear(){APPLOG=[];store.set('applog',APPLOG);unseen=0;renderDrawer();badges();},
  /* közös */
  expDl(){const tid=TERMID[curView];if(!tid)return;dl(curView+'_'+tDate(Date.now()).slice(0,16).replace(/[ :.]/g,'-')+'.txt',termText(tid));},
  expNaplo(){const tid=TERMID[curView];if(!tid)return;const ty={nmap:'nmap',wifite:'wifi',pentest:'pentest',vedelem:'vedelem'}[curView]||'manual';saveToNaplo(ty,TITLE[curView]+' — '+tDate(Date.now()),termText(tid));},
  histUse(b){const id=CMDID[curView],i=id&&$('#'+id);if(i){i.value=b.dataset.k;i.focus();}},
  histClear(){CMDHIST=[];store.set('cmdhist',CMDHIST);renderDrawer();},
  demo(b){toast((b.dataset.m||'művelet')+' — a mintában nincs bekötve','info');},
};
const SET={theme:setTheme,scale:v=>setScale(+v),density:setDensity,blink:setBlink,sb:setSb,sbw:v=>setSbw(+v),pan:setPan,dw:v=>setDw(+v),tree:v=>setTree(v==='off'),lang:v=>{if(typeof setLanguage==='function'){setLanguage(v);const ls=$('#langSel');if(ls)ls.value=v;toast('Nyelv: '+v,'info');}}};
const INP={
  nmProfile:i=>{NM.type=i.value;fillNmCmd();},nmTarget:i=>{NM.target=i.value.trim();fillNmCmd();},nmSudo:i=>{NM.sudo=i.checked;},
  wlUpload(){$('#wlFileInput').click();},
  wfIface:i=>{WF.iface=i.value.trim();},wfWordlist:i=>{WF.wordlist=i.value;},wfWpsTool:i=>{WF.wpsTool=i.value;},wfM:i=>{WF[i.dataset.k]=i.checked;},
  sysAuto:()=>sysSchedule(),
  tkCk:i=>{const t=(TASKS[curView]||[]).find(x=>x.id===i.dataset.k);if(t){t.done=i.checked;store.set('tasks',TASKS);renderDrawer();badges();}},
  ntText:i=>{NOTES[curView]=i.value;store.set('notes',NOTES);},
  set:i=>{SET[i.dataset.k](i.value);say('Beállítás: '+i.dataset.k);},
};

/* ═══════════════ PARANCSOK / MENÜ / ESEMÉNYEK ═══════════════ */
const CMD={
  tree(){if($('#app').clientWidth<=820){document.body.classList.toggle('tree-open');return;}setTree(!document.body.classList.contains('tree-off'));if(curView==='settings')rerender();},
  run(){const q=$('#cmdIn').value.trim().replace(/^\//,'').toLowerCase();if(!q)return;const ids=Object.keys(TITLE);const id=ids.find(k=>k===q)||ids.find(k=>TITLE[k].toLowerCase()===q)||ids.find(k=>TITLE[k].toLowerCase().startsWith(q))||ids.find(k=>k.startsWith(q));if(id){select(id);$('#cmdIn').value='';}else status('Ismeretlen: '+q,'r');},
  back(){if(hpos>0)select(hist[--hpos],true);else status('Nincs korábbi','b');},
  fwd(){if(hpos<hist.length-1)select(hist[++hpos],true);},
  refresh(){rerender();if(curTool)renderDrawer();status('Frissítve');},
  print(){window.print();},
  theme(){setTheme(appTheme==='dark'?'light':'dark');if(curView==='settings')rerender();},
  zoomIn(){setScale(appScale+5);if(curView==='settings')rerender();},
  zoomOut(){setScale(appScale-5);if(curView==='settings')rerender();},
  dock(){const d=!document.body.classList.contains('docked');document.body.classList.toggle('docked',d);$('#drawerPin').classList.toggle('on',d);store.set('docked',d);},
  closeTool,
  async shutdown(){if(!confirm('Biztosan kilépsz? A szerver is leáll, a Wi-Fi visszaáll.'))return;try{await fetch('/api/shutdown',{method:'POST'});}catch(e){}setTimeout(()=>{try{window.close();}catch(e){}},400);},
};
const MENUS={
  'Program':[['Áttekintés','go:overview'],['Beállítások','go:settings'],['Rendszer-állapot','go:rendszer'],0,['Nyomtatás','cmd:print'],['Kilépés (szerver le)','cmd:shutdown']],
  'Művelet':[['WiFi Audit indítása','go:wifite'],['Nmap scan','go:nmap'],['PenTest','go:pentest'],['Új napló-jegyzet','act:npNew']],
  'Ugrás':[['Vissza','cmd:back','F3'],['Előre','cmd:fwd'],0,['WiFi Audit','go:wifite'],['Nmap Scan','go:nmap'],['PenTest','go:pentest'],['Védelem','go:vedelem'],['Napló','go:naplo'],['Rendszer','go:rendszer']],
  'Eszközök':[['Védelmi eszközök','go:vedelem'],['Frissítés','go:update'],['Tudásbázis','go:kb']],
  'Nézet':[['Navigációs fa be/ki','cmd:tree'],['Segédpanel rögzítése','cmd:dock'],0,['Világos / sötét','cmd:theme'],['Frissítés','cmd:refresh']],
  'Súgó':[['Tudásbázis','go:kb'],['Leírás (F1)','tool:desc'],['Jogi háttér','kb:legal'],['Módszertan','kb:method']],
};
function execItem(c){const[k,v]=c.split(':');if(k==='go')select(v);else if(k==='tool')openTool(v);else if(k==='cmd')CMD[v]();else if(k==='act')ACT[v]({dataset:{}});else if(k==='kb'){KBsel=v;select('kb');}}
function closeMenu(){$('#mpop').classList.remove('show');$$('.menubar .m').forEach(m=>m.classList.remove('open'));}
function openMenu(b){const p=$('#mpop');const was=b.classList.contains('open');closeMenu();if(was)return;b.classList.add('open');p.innerHTML=MENUS[b.dataset.menu].map(i=>i?`<button data-x="${i[1]}">${i[0]}${i[2]?`<kbd>${i[2]}</kbd>`:''}</button>`:'<hr>').join('');p.style.left=b.offsetLeft+'px';p.classList.add('show');}

document.addEventListener('click',e=>{
  const mi=e.target.closest('#mpop [data-x]');if(mi){closeMenu();execItem(mi.dataset.x);return;}
  const mb=e.target.closest('[data-menu]');if(mb){openMenu(mb);return;}
  closeMenu();
  const c=e.target.closest('[data-cmd]');if(c){CMD[c.dataset.cmd]();return;}
  const a=e.target.closest('[data-act]');if(a&&!a.disabled){const f=ACT[a.dataset.act];if(f)f(a,e);return;}
  const g=e.target.closest('[data-go]');if(g){select(g.dataset.go);return;}
});
document.addEventListener('mouseover',e=>{const mb=e.target.closest('[data-menu]');if(mb&&$('#mpop').classList.contains('show')&&!mb.classList.contains('open'))openMenu(mb);});
document.addEventListener('input',e=>{const t=e.target,k=t.dataset.in;if(k&&INP[k]&&t.tagName!=='SELECT'&&t.type!=='checkbox'&&t.type!=='radio')INP[k](t);
  const tf=t.dataset.tfilter;if(tf){const q=t.value.toLowerCase();document.getElementById(tf)?.querySelectorAll('.tl').forEach(line=>{const x=(line.querySelector('.traw')?.textContent||'').toLowerCase();line.style.display=(!q||x.includes(q))?'':'none';});}});
document.addEventListener('change',e=>{const t=e.target,k=t.dataset.in;if(k&&INP[k]&&(t.tagName==='SELECT'||t.type==='checkbox'||t.type==='radio'))INP[k](t);});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){if(e.target.id==='cmdIn'){CMD.run();return;}const en=e.target.dataset&&e.target.dataset.enter;if(en){e.preventDefault();ACT[en](e.target);return;}if(e.target.classList.contains('tnode')){e.target.click();return;}}
  if(e.key==='Escape'){if($('#mpop').classList.contains('show'))closeMenu();else if(curTool)closeTool();return;}
  if(e.key==='F1'){e.preventDefault();openTool('desc');return;}
  if(e.key==='F3'){e.preventDefault();CMD.back();return;}
});
$('#scrim').onclick=()=>document.body.classList.remove('tree-open');
$('#langSel').addEventListener('change',function(){if(typeof setLanguage==='function')setLanguage(this.value);toast('Nyelv: '+this.value,'info');});

/* ───────── téma/méret/sűrűség/görgetés ───────── */
const RT=document.documentElement;
function setTheme(t){appTheme=t==='dark'?'dark':'light';RT.setAttribute('data-theme',appTheme);store.set('theme',appTheme);}
function setScale(v){v=Math.round((+v||100)/5)*5;appScale=Math.max(70,Math.min(v,200));RT.style.setProperty('--scale',appScale/100);store.set('scale',appScale);const zv=$('#zoomVal');if(zv&&document.activeElement!==zv)zv.value=appScale;}
function setDensity(d){appDensity=d==='cozy'?'cozy':'compact';RT.setAttribute('data-density',appDensity);store.set('density',appDensity);}
function setBlink(b){appBlink=['off','slow','fast'].includes(b)?b:'normal';RT.setAttribute('data-blink',appBlink);RT.style.setProperty('--blink',({slow:'1.2s',normal:'.7s',fast:'.4s'})[appBlink]||'.7s');store.set('blink',appBlink);}
function setSb(v){appSb=v==='hide'?'hide':'show';RT.setAttribute('data-sb',appSb);store.set('sb',appSb);}
function setSbw(v){appSbw=[6,10,16,22].includes(v)?v:10;RT.style.setProperty('--sb',appSbw+'px');store.set('sbw',appSbw);}
function setPan(v){appPan=v==='off'?'off':'on';store.set('pan',appPan);}
function setDw(v){appDw=Math.round(Math.max(280,Math.min(v||400,Math.max(280,$('#app').clientWidth-parseFloat(getComputedStyle(RT).getPropertyValue('--rail'))-220))));RT.style.setProperty('--drawer-w',appDw+'px');store.set('dw',appDw);}
function setTree(off){document.body.classList.toggle('tree-off',!!off);store.set('treeOff',!!off);}

/* segédpanel méretezés húzással */
{const g=$('#dgrip');let st=null;
  g.addEventListener('pointerdown',e=>{st={x:e.clientX,w:$('#drawer').offsetWidth};g.setPointerCapture(e.pointerId);document.body.classList.add('resizing');e.preventDefault();});
  g.addEventListener('pointermove',e=>{if(st)setDw(st.w+(st.x-e.clientX)/(appScale/100));});
  const end=()=>{if(!st)return;st=null;document.body.classList.remove('resizing');if(curView==='settings')rerender();};
  g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);
  g.addEventListener('dblclick',()=>{setDw(400);if(curView==='settings')rerender();});}
/* húzásos görgetés */
{let pan=null,eat=false;
  const scroller=(n,ax)=>{for(;n&&n!==document.body;n=n.parentElement){const c=getComputedStyle(n);if(ax==='x'?(n.scrollWidth>n.clientWidth+1&&/auto|scroll/.test(c.overflowX)):(n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(c.overflowY)))return n;}return null;};
  document.addEventListener('pointerdown',e=>{if(appPan!=='on'||e.button!==0||e.pointerType==='touch')return;if(e.target.closest('input,textarea,select,button,a,label,.dgrip,.rail,.menubar,.toolbar,.status,.term'))return;const X=scroller(e.target,'x'),Y=scroller(e.target,'y');if(!X&&!Y)return;pan={X,Y,x:e.clientX,y:e.clientY,sx:X?X.scrollLeft:0,sy:Y?Y.scrollTop:0,on:false};});
  document.addEventListener('pointermove',e=>{if(!pan)return;const dx=e.clientX-pan.x,dy=e.clientY-pan.y;if(!pan.on){if(Math.hypot(dx,dy)<5)return;pan.on=true;document.body.classList.add('panning');getSelection()?.removeAllRanges();}const k=appScale/100;if(pan.X)pan.X.scrollLeft=pan.sx-dx/k;if(pan.Y)pan.Y.scrollTop=pan.sy-dy/k;e.preventDefault();});
  const end=()=>{if(pan&&pan.on){eat=true;setTimeout(()=>eat=false,0);}pan=null;document.body.classList.remove('panning');};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  document.addEventListener('click',e=>{if(eat){e.stopPropagation();e.preventDefault();eat=false;}},true);}

/* ═══════════════ SOCKET.IO ═══════════════ */
let socket=null;
function connBadge(ok){const led=$('#connLed'),txt=$('#connTxt'),o=$('#onlineLed');if(led)led.className='led '+(ok?'g':'r');if(txt)txt.textContent=ok?'kapcsolódva':'nincs kapcsolat';if(o)o.className='led '+(ok?'g':'r');}
try{socket=io();
  socket.on('connect',()=>{connBadge(true);applog('g','Kapcsolódva a szerverhez');});
  socket.on('disconnect',()=>{connBadge(false);applog('r','Megszakadt a kapcsolat');});
  socket.on('connect_error',()=>connBadge(false));
  /* nmap */
  socket.on('nmap:start',({target,scanType,useSudo})=>{STATE.nmap={running:true,meta:{target,scanType}};_nmHostMap={};_nmHostCur=null;NMDATA={hosts:[],ports:[],ips:[],vuln:[],error:[]};
    termClear('nmapOut');$('#nmTiles')&&($('#nmTiles').style.display='none');const pb=$('#nmPhases');if(pb){pb.style.display='';$$('.phstep').forEach(x=>x.classList.remove('done','active'));}nmPhase(1);timerStart('nmapOut');say('Nmap indul: '+target+' ('+scanType+')','b');
    if(useSudo)renderLine({raw:'🔑 sudo mód aktív',type:'scan'},'nmapOut');});
  socket.on('nmap:output',data=>{
    if(data.type==='host'){const ip=(data.raw||'').match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);_nmHostCur=ip?ip[0]:(data.raw||'').replace('Nmap scan report for','').trim();_nmHostMap[_nmHostCur]={ip:_nmHostCur,details:[]};}
    else if(_nmHostCur&&['success','mac','os','service'].includes(data.type))_nmHostMap[_nmHostCur].details.push(data.raw);
    else if(data.type==='port-open')NMDATA.ports.push({raw:data.raw,explanation:TR(data.explanation)});
    if(['port-open','port-closed','port-filtered'].includes(data.type))nmPhase(2);if(['service','os','mac'].includes(data.type))nmPhase(3);
    renderLine(data,'nmapOut');});
  socket.on('nmap:done',({code,summary,stopped,stderrHint})=>{STATE.nmap.running=false;timerStop('nmapOut');nmPhase(5);setTimeout(()=>{const pb=$('#nmPhases');if(pb)pb.style.display='none';},1600);
    const meta=STATE.nmap.meta||{};const time=new Date().toLocaleTimeString('hu-HU',{hour:'2-digit',minute:'2-digit'});
    if(stopped){nmHistSave({...meta,time,status:'stopped'});nmHistRender();say('Nmap leállítva','y');return;}
    if(summary){$('#nmHosts')&&($('#nmHosts').textContent=summary.hosts);$('#nmPorts')&&($('#nmPorts').textContent=summary.openPorts);$('#nmIPs')&&($('#nmIPs').textContent=summary.ips.length);$('#nmVulns')&&($('#nmVulns').textContent=summary.vulns.length);$('#nmErrors')&&($('#nmErrors').textContent=summary.errors.length);const tiles=$('#nmTiles');if(tiles)tiles.style.display='flex';
      NMDATA.hosts=Object.values(_nmHostMap);NMDATA.ips=summary.ips;NMDATA.vuln=summary.vulns;NMDATA.error=summary.errors;
      nmHistSave({...meta,time,hosts:summary.hosts,ports:summary.openPorts,status:code===0?'done':'stopped'});nmHistRender();}
    say(code===0?'Nmap kész':'Nmap hibakóddal zárult',code===0?'g':'y');if(stderrHint)renderLine({raw:stderrHint,type:'error'},'nmapOut');if(curTool==='ctx')renderDrawer();});
  socket.on('nmap:error',({message,hint})=>{STATE.nmap.running=false;timerStop('nmapOut');const pb=$('#nmPhases');if(pb)pb.style.display='none';renderLine({raw:'Hiba: '+message,type:'error',explanation:hint||''},'nmapOut');say(message,'r');});
  /* wifite */
  socket.on('wifite:start',()=>{STATE.wifite={running:true,networks:0,handshakes:0,cracked:0};WFT.clear();termClear('wifiteOut');say('WiFi audit indul','b');timerStart('wifiteOut');const ph=$('#wfPhase');if(ph)ph.textContent='';const rb=$('#abPrimary');if(rb)rb.innerHTML=svg(GL.term,2)+'<span class="lbl2">Küld</span>';if(curTool==='ctx')renderDrawer();headerStatus();});
  socket.on('wifite:restored',()=>{say('WiFi visszaállítva — monitor ki, hálózat vissza','g');setTimeout(headerStatus,500);});
  socket.on('wifite:output',data=>{renderLine(data,'wifiteOut');const s=STATE.wifite;if(data.type==='network')s.networks++;if(data.badge==='Handshake!'||data.badge==='PMKID!')s.handshakes++;if(data.type==='cracked')s.cracked++;wfTile();
    const t=wfParseTarget(data.raw||'');if(t){WFT.set(t.num,t);wfRenderTargets();}
    const low=String(data.raw||'').toLowerCase();const ph=$('#wfPhase');if(ph){if(/cracking|aircrack|hashcat|dictionary|attempting/.test(low))ph.textContent='● Törés';else if(/handshake|deauth|capturing|pmkid|eapol/.test(low))ph.textContent='● Handshake';else if(/scanning|found \d+|target/.test(low))ph.textContent='● Szkennelés';}});
  socket.on('wifite:done',({code})=>{STATE.wifite.running=false;timerStop('wifiteOut');say(code===0?'WiFi audit kész':'WiFi audit leállt',code===0?'g':'y');const ph=$('#wfPhase');if(ph)ph.textContent='';const rb=$('#abPrimary');if(rb)rb.innerHTML=svg(GL.play,2)+'<span class="lbl2">Indít</span>';wfLoadHandshakes();if(curTool==='ctx')renderDrawer();headerStatus();});
  socket.on('wifite:error',({message,hint})=>{STATE.wifite.running=false;timerStop('wifiteOut');renderLine({raw:'Hiba: '+message,type:'error',explanation:hint||''},'wifiteOut');say(message,'r');});
  /* védelem */
  socket.on('defense:start',()=>defSetBusy(true));
  socket.on('defense:output',data=>renderLine(data,'vedOut'));
  socket.on('defense:done',({key})=>{defSetBusy(false);renderLine({raw:'[kész]',type:'action'},'vedOut');if(key)setTimeout(()=>defRefreshOne(key),700);say('Védelmi művelet kész');});
  /* pentest */
  socket.on('pentest:output',({terminalId,data,isError})=>{renderLine({raw:(data||'').replace(/\n$/,''),type:isError?'error':'info'},PT_TERM[terminalId]||'ptOut');});
  socket.on('pentest:done',({terminalId,exitCode})=>{const t=PT_TERM[terminalId]||'ptOut';timerStop(t);renderLine({raw:'[kész] kód: '+(exitCode==null?'?':exitCode),type:exitCode===0?'success':'warning'},t);if(terminalId===2)DEFENSES.forEach(d=>{if(d.key)defRefreshOne(d.key);});});
  socket.on('pentest:tooldone',({code})=>{PT.installing=null;setTimeout(ptToolsFetch,400);say(code===0?'Eszköz telepítve':'Telepítés hiba',code===0?'g':'y');});
  /* update */
  socket.on('update:output',d=>renderLine({raw:d.line||'',type:'out'},'updOut'));
  socket.on('update:done',d=>{renderLine({raw:'[kész] kód: '+(d.code==null?'?':d.code),type:'action'},'updOut');['updTools','updHost'].forEach(id=>{const e=$('#'+id);if(e)e.disabled=false;});const s=$('#updStop');if(s)s.disabled=true;});
}catch(e){connBadge(false);}
function nmPhase(n){const LB={1:'Host discovery',2:'Port scan',3:'Szolgáltatás',4:'NSE scriptek',5:'Kész'};const e=$('#nmPhaseTxt');if(e)e.textContent=n?('● '+(LB[n]||'')):'';}
function wfTile(){const s=STATE.wifite;$('#wfNet')&&($('#wfNet').textContent=s.networks);$('#wfHs')&&($('#wfHs').textContent=s.handshakes);$('#wfCr')&&($('#wfCr').textContent=s.cracked);}

/* pentest fájlfeltöltés */
$('#ptFileInput').addEventListener('change',async function(){const f=this.files[0];if(!f)return;const fd=new FormData();fd.append('file',f);fd.append('name',f.name.replace(/\.[^.]+$/,''));
  try{const r=await fetch('/api/pentest/scripts',{method:'POST',body:fd}).then(r=>r.json());if(r.error)toast(r.error,'error');else{toast('Feltöltve','success');ptLoadScripts();}}catch(e){toast('Feltöltés sikertelen','error');}this.value='';});

$('#wlFileInput').addEventListener('change',async function(){const f=this.files[0];if(!f)return;const fd=new FormData();fd.append('file',f);
  try{const r=await fetch('/api/wordlists/upload',{method:'POST',body:fd}).then(r=>r.json());if(r.error)toast(r.error,'error');else{toast('Wordlist feltöltve','success');await wfLoadWordlists();if(r.path){const sel=$('#wfWordlist');if(sel){sel.value=r.path;WF.wordlist=r.path;}}}}catch(e){toast('Feltöltés sikertelen','error');}this.value='';});

/* letöltés */
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),3000);say('Letöltve: '+name);}

/* ═══════════════ INDÍTÁS ═══════════════ */
setTheme(store.get('theme','light'));setScale(store.get('scale',100));setBlink(store.get('blink','normal'));
setDensity(store.get('density',window.matchMedia&&matchMedia('(pointer:coarse)').matches?'cozy':'compact'));
setSb(store.get('sb','show'));setSbw(store.get('sbw',10));setPan(store.get('pan','on'));setDw(store.get('dw',400));setTree(store.get('treeOff',false));
{const d=store.get('docked',null);const on=d==null?$('#app').clientWidth>=1440:d;document.body.classList.toggle('docked',on);$('#drawerPin').classList.toggle('on',on);}
if(typeof currentLang!=='undefined'){const ls=$('#langSel');if(ls)ls.value=currentLang;}
fetch('/api/system').then(r=>r.json()).then(s=>{IS_LINUX=!!s.isLinux;const p=$('#stPlat');if(p)p.textContent=s.isLinux?'Linux':(s.platform||'nem Linux');nmapCmdPreview();}).catch(()=>{const p=$('#stPlat');if(p)p.textContent='?';});
const tick=()=>{const d=new Date();const c=$('#clock');if(c)c.textContent=p2(d.getHours())+':'+p2(d.getMinutes());};tick();setInterval(tick,20000);
/* fejléc-jelzők: aku / WiFi / SSH (elérhetőség) a /api/sysinfo-ból */
async function headerStatus(){try{const d=await fetch('/api/sysinfo').then(r=>r.json());
  const b=$('#hdrBatt');if(b){const bv=(d.battery!=null&&d.battery!=='')?d.battery+'%':'—';b.innerHTML='🔋 <b>'+bv+'</b>'+(/charg|tölt|full/i.test(d.battery_status||'')?' ⚡':'');b.title='Akkumulátor: '+bv+(d.battery_status?' · '+d.battery_status:'');}
  const w=$('#hdrWifi');if(w){const ss=d.wifi_ssid||'nincs';w.innerHTML='📶 <b>'+esc(ss)+'</b>';w.title='WiFi: '+ss+(d.wifi_signal?' · '+d.wifi_signal:'')+(d.wifi_ip?' · '+d.wifi_ip:'');}
  const st=$('#hdrSshTxt');if(st){const ip=d.wifi_ip||'';st.textContent=ip||'—';$('#hdrSsh').title='SSH / elérhetőség: '+(ip||'ismeretlen');}
  const mon=(d.ifaces||[]).find(i=>/monitor/i.test(i.type||''));const hm=$('#hdrMon');
  if(hm){const on=!!mon||STATE.wifite.running;hm.style.display=on?'':'none';if(on)hm.querySelector('b').textContent='MONITOR'+(mon?' · '+mon.name:'');}
}catch(e){/* statikus előnézet: nincs backend */}}
headerStatus();setInterval(headerStatus,15000);
connBadge(false);
{const zi=$('#zoomVal');if(zi){zi.addEventListener('change',()=>setScale(parseInt(zi.value,10)||100));zi.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();zi.blur();}});}}
buildTree();buildRail();select('overview');
