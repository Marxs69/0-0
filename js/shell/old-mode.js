/* Modo antigo e troca entre os modos */

function oldLink(l) {                                   // card de um site no modo antigo: favicon + nome
  const a = document.createElement('a'); a.href = l.u; a.target = '_blank'; a.rel = 'noopener'; a.dataset.u = l.u;
  const s = document.createElement('span'); s.textContent = l.n; a.append(tile(l), s); return a;
}
GROUPS.forEach(([g, name], i) => {                     // uma divisória por grupo; o primeiro vira título
  const head = document.createElement(i ? 'div' : 'h2'), sp = document.createElement('span');
  if (i) { head.className = 'divider'; sp.textContent = name; head.append(sp); } else head.textContent = name;
  const sec = document.createElement('section'), box = document.createElement('div'); box.className = 'link'; box.id = 'old-' + g;
  sec.append(box); $('#old-groups').append(head, sec);
});
LINKS.forEach(l => { if (!l.local) ($('#old-' + l.g) || $('#old-out')).append(oldLink(l)); });
function setMode(m) {
  if (PHONE && m === 'os') return phoneTip();                // no celular o modo OS fica desativado
  const from = document.body.dataset.mode; if (from === m) return;
  closeStart(); sandSwap(from === 'os' ? os : $('#old'));
  document.body.dataset.mode = m; if (m === 'os') layoutAll();
  if (!EMB) try { localStorage.setItem('piratinha-mode', m); } catch (e) {}
}

/* Transição "areia" (1,5 s): o modo que sai fica por cima e se desfaz em grãos, revelando o outro.
   Um filtro SVG recorta o que ainda resta usando um mapa de ruído (cada grão some quando o ruído dele passa do progresso),
   e um <canvas> por cima solta grãos de areia na frente da dissolução, que o vento leva.
   OS → antigo: varre de baixo/esquerda para cima/direita e o vento sopra para a direita e para cima.
   Antigo → OS: o inverso, do topo direito para o canto inferior esquerdo, com o vento para a esquerda e para baixo.
   (Fazer os grãos no próprio filtro custava 3× mais e derrubava para ~20 fps.) */
const SAND_MS = 1500, SAND_LIFE = 420, SAND_S = 14, SAND_N = 5000;
let sandRun = null; const sandMaps = {};
function sandNoise(W, H, dir) {   // dir: 1 = OS → antigo, -1 = antigo → OS   // gerado uma vez por tamanho de tela, em meia resolução (grãos de 2 px), e decodificado antes de usar
  const old = sandMaps[dir]; if (old && old.W === W && old.H === H) return old;
  const w = Math.ceil(W / 2), h = Math.ceil(H / 2), c = document.createElement('canvas'), g = c.getContext('2d'), sm = document.createElement('canvas');
  c.width = w; c.height = h; sm.width = Math.ceil(w / 34); sm.height = Math.ceil(h / 34);
  const sg = sm.getContext('2d'), sd = sg.createImageData(sm.width, sm.height);
  for (let i = 0; i < sd.data.length; i += 4) { sd.data[i] = Math.random() * 255; sd.data[i + 3] = 255; }
  sg.putImageData(sd, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(sm, 0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data, v = new Float32Array(w * h); let lo = 9, hi = -9;
  for (let y = 0, k = 0; y < h; y++) for (let x = 0; x < w; x++, k++) {   // manchas + grão fino + varredura (no sentido de dir)
    const sw = x / w * .8 + (1 - y / h) * .2, t = .34 * d[k * 4] / 255 + .3 * Math.random() + .36 * (dir > 0 ? sw : 1 - sw); v[k] = t; if (t < lo) lo = t; if (t > hi) hi = t;
  }
  for (let k = 0; k < v.length; k++) { v[k] = (v[k] - lo) / (hi - lo); d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = v[k] * 255; d[k * 4 + 3] = 255; }
  g.putImageData(im, 0, 0); const url = c.toDataURL('image/png'), img = new Image(); img.src = url;
  const pts = [];                                           // grãos do canvas: posição e o momento (ruído) em que se soltam
  for (let i = 0; i < SAND_N; i++) { const x = Math.random() * W, y = Math.random() * H; pts.push([x, y, v[Math.min(h - 1, y >> 1) * w + Math.min(w - 1, x >> 1)], Math.random()]); }
  pts.sort((a, b) => a[2] - b[2]);
  return (sandMaps[dir] = { W, H, url, pts, ready: img.decode().catch(() => {}) });
}
function sandFilter(W, H, dir) {
  let svg = $('#sandfx');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'sandfx'; svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<filter id="sand" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage x="0" y="0" preserveAspectRatio="none" result="n"/><feColorMatrix in="n" type="matrix" result="keep"/>
      <feComposite in="SourceGraphic" in2="keep" operator="in"/></filter>`;
    document.body.append(svg);
  }
  const img = $('feImage', svg), map = sandNoise(W, H, dir); img.setAttribute('width', W); img.setAttribute('height', H);
  if (img.getAttribute('href') !== map.url) img.setAttribute('href', map.url);
  return map;
}
function sandSwap(out) {
  if (sandRun) sandRun();                                    // troca no meio de outra: termina a anterior na hora
  if (!pref.an || EMB || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const W = innerWidth, H = innerHeight, dir = out === os ? 1 : -1; let map; try { map = sandFilter(W, H, dir); } catch (e) { return; }
  const keep = $('feColorMatrix', $('#sandfx')), alpha = b => keep.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ' + (b == null ? '0 0 0 0 1' : SAND_S + ' 0 0 0 ' + b));
  const cv = document.createElement('canvas'), g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  cv.id = 'sandpx'; cv.width = W * dpr; cv.height = H * dpr; g.scale(dpr, dpr);
  const ac = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b072b1';
  const COLS = out === os ? ['#f4eef6', ac, '#cfc4d6', ac, '#8f8597'] : [ac, '#e9e3ec', ac, '#6f6676', '#b9aec0'];
  const DIS = SAND_MS - SAND_LIFE, END = 1 + 1 / SAND_S, pts = map.pts; let raf = 0, t0 = 0, dead = false;
  const frame = now => {
    if (!t0) t0 = now; const el = now - t0, t = Math.min(1, el / DIS), p = END * (1 - Math.cos(Math.PI * t)) / 2;
    alpha(1 - SAND_S * p);                                                                  // continua inteiro onde ruído > progresso
    g.clearRect(0, 0, W, H);
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i]; if (q[2] > p) break;                                               // ordenados: o resto ainda não soltou
      if (q[4] == null) q[4] = el; const a = (el - q[4]) / SAND_LIFE; if (a >= 1) continue;
      const r = q[3], s = a * SAND_LIFE / 1000;                                          // r: sorteio fixo de cada grão
      g.globalAlpha = (1 - a) * (1 - a) * (.55 + r * .45); g.fillStyle = COLS[(r * 997 | 0) % COLS.length];
      const sz = 1.2 + r * 2.2;
      g.fillRect(q[0] + dir * (s * (90 + r * 260) + s * s * 380), q[1] - dir * (s * (40 + r * 160) + s * s * 240) + Math.sin(r * 40 + a * 6) * 6, sz, sz);
    }
    if (el < SAND_MS) raf = requestAnimationFrame(frame); else sandRun();
  };
  pts.forEach(q => { q[4] = null; }); alpha(null);
  out.classList.add('sand-out'); document.body.append(cv);   // fica inteiro por cima até o ruído estar pronto (só demora na primeira vez)
  map.ready.then(() => { if (!dead) raf = requestAnimationFrame(frame); });
  sandRun = () => { dead = true; cancelAnimationFrame(raf); out.classList.remove('sand-out'); cv.remove(); sandRun = null; };
}
addEventListener('storage', e => {                        // a cor de destaque mudou em outra aba (ou na janela do modo antigo): aplica aqui também
  if (e.key !== 'piratinha-pref' || !e.newValue) return;
  try { const n = JSON.parse(e.newValue); if (n.ac && n.ac !== pref.ac) { pref.ac = n.ac; document.documentElement.style.setProperty('--accent', n.ac); } } catch (x) {}
});
document.querySelectorAll('[data-switch]').forEach(b => b.addEventListener('click', () => setMode(document.body.dataset.mode === 'os' ? 'old' : 'os')));
const EMB = window.top !== window.self;                       // aberto dentro de uma janela do sistema (Piratinha Old)
/* celular (tela de toque pequena): abre sempre no modo antigo, com o botão do modo OS cinza */
const PHONE = (matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent))) && Math.min(screen.width, screen.height) < 600;
function phoneTip() {
  let t = $('#oldtip'); if (!t) { t = document.createElement('div'); t.id = 'oldtip'; t.textContent = 'O modo OS só funciona no computador.'; $('#old').append(t); }
  t.classList.add('on'); clearTimeout(t.tm); t.tm = setTimeout(() => t.classList.remove('on'), 2200);
}
if (PHONE) { document.body.dataset.mode = 'old'; document.body.classList.add('phone'); const b = $('#oldswitch'); b.classList.add('off'); b.setAttribute('aria-disabled', 'true'); b.title = 'O modo OS só funciona no computador'; }
else if (/[?&]old\b/.test(location.search)) { document.body.dataset.mode = 'old'; if (EMB) $('#oldswitch').hidden = true; }
else try { const m = localStorage.getItem('piratinha-mode'); if (m === 'old' || m === 'os') document.body.dataset.mode = m; } catch (e) {}
const sandPrep = () => { if (pref.an && !EMB && !PHONE) try { const d = document.body.dataset.mode === 'os' ? 1 : -1; sandFilter(innerWidth, innerHeight, d); setTimeout(() => sandNoise(innerWidth, innerHeight, -d), 300); } catch (e) {} };   // prepara os dois ruídos com a página ociosa
addEventListener('load', () => (window.requestIdleCallback || setTimeout)(sandPrep, { timeout: 3000 }));   // só depois de todos os scripts (pref vem de settings.js)
let sandRT = 0; addEventListener('resize', () => { clearTimeout(sandRT); sandRT = setTimeout(sandPrep, 800); });
