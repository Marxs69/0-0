/* Grade de ícones da área de trabalho (posições sorteadas, arrastar e soltar) */

let CW = 96, CH = 100, RH = 100; const PAD = 16;              // RH = distância entre linhas (pode ser menor que CH)
let cols = 1, rows = 1;
const saved = {};                                      // posições da sessão: url -> [coluna, linha] (sorteadas a cada acesso)
const ORDER = [...LINKS];
if (store.get('piratinha-pref', {}).shuf !== false) for (let i = ORDER.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ORDER[i], ORDER[j]] = [ORDER[j], ORDER[i]]; }
let frozen = false;
const trashed = new Set(store.get('piratinha-trash', []));
const OFF = new Set(store.get('piratinha-off', []));        // desinstalados (ids da loja); não vão para a lixeira
OFF.delete('sys:trash');                                      // a lixeira saiu da Loja: quem a tinha removido volta a vê-la
const PLACE = store.get('piratinha-place', {});              // onde cada item aparece: 'desktop' | 'taskbar' | 'dock' | 'none' (só na Loja)
const idOf = l => l.app ? l.id : 'link:' + l.u, placeOf = l => { const p = PLACE[idOf(l)] || l.p0 || 'desktop'; return p === 'menu' ? 'none' : p; };   // 'none' = só na Loja (o menu Iniciar não guarda mais apps)
const cell = new Map();                                // posições efetivas
const icons = new Map();
let dockBox = null;                                  // retângulo da dock (em coordenadas da área de trabalho), quando ela fica embaixo ou em cima
const overDock = (c, r) => dockBox && PAD + c * CW < dockBox.r && PAD + c * CW + CW > dockBox.l && PAD + r * RH < dockBox.b && PAD + r * RH + CH > dockBox.t;
const reserved = (c, r) => (r === 0 && c === 0) || overDock(c, r);   // célula da lixeira e células por baixo da dock
const taken = (c, r, except) => { for (const [k, p] of cell) if (k !== except && p[0] === c && p[1] === r) return true; return false; };
const free = (c, r, except) => !reserved(c, r) && !taken(c, r, except);
function firstFree(except) { for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (free(c, r, except)) return [c, r]; return null; }
function nearestFree(c, r, except) {
  let best = null, bd = 1e9;
  for (let cc = 0; cc < cols; cc++) for (let rr = 0; rr < rows; rr++) {
    if (!free(cc, rr, except)) continue;
    const d = (cc - c) ** 2 + (rr - r) ** 2; if (d < bd) { bd = d; best = [cc, rr]; }
  }
  return best;
}
const setXY = (el, c, r) => { el.style.left = PAD + c * CW + 'px'; el.style.top = PAD + r * RH + 'px'; };
const valid = p => p && p[0] < cols && p[1] < rows && !reserved(p[0], p[1]);

function layoutAll() {
  cols = Math.max(2, Math.floor((desk.clientWidth - PAD * 2) / CW));
  // 8 ícones por coluna (contando a lixeira), espaçados para o último ficar logo acima da taskbar. A coluna desce até a taskbar
  // mesmo com a dock embaixo (ela só ocupa o meio); as células que cairiam sobre a dock ficam bloqueadas.
  // Em telas baixas demais (linhas com menos de 75% da altura do ícone), usa menos linhas.
  const dr = desk.getBoundingClientRect(), tb = $('#taskbar').getBoundingClientRect(), dk = $('#dock'), ROWS = 8;
  const avail = (pref.tb === 't' ? innerHeight - 10 : tb.top - 8) - dr.top - PAD;          // do topo do 1º ícone até o fim do último
  const db = !dk.hidden && !pref.da && (pref.dp === 'b' || pref.dp === 't') ? dk.getBoundingClientRect() : null;
  dockBox = db && db.width ? { l: db.left - dr.left - 6, r: db.right - dr.left + 6, t: db.top - dr.top - 6, b: db.bottom - dr.top + 6 } : null;
  rows = ROWS; while (rows > 2 && avail / rows < CH * .75) rows--;
  RH = (avail - CH) / (rows - 1); if (RH < CH) RH = avail / rows;        // apertado: o ícone encolhe para a altura da linha (classe .tight)
  desk.classList.toggle('tight', RH < CH); desk.style.setProperty('--rh', Math.min(CH, RH) + 'px');
  cell.clear(); setXY(trashEl, 0, 0); trashEl.hidden = OFF.has('sys:trash');
  const gone = l => trashed.has(l.u) || OFF.has(idOf(l)) || placeOf(l) !== 'desktop';
  const visible = ORDER.filter(l => !gone(l));
  LINKS.forEach(l => { icons.get(l.u).el.style.display = gone(l) ? 'none' : ''; });
  const later = [];
  visible.forEach(l => {                               // 1º passe: quem tem posição salva livre
    const p = saved[l.u];
    if (valid(p) && !taken(p[0], p[1], l.u)) cell.set(l.u, p); else later.push(l);
  });
  later.forEach(l => {                                 // 2º passe: o resto vai para a primeira vaga
    const p = saved[l.u];
    cell.set(l.u, (p ? nearestFree(p[0], p[1], l.u) : firstFree(l.u)) || [0, Math.min(1, rows - 1)]);
  });
  visible.forEach(l => { const p = cell.get(l.u); setXY(icons.get(l.u).el, p[0], p[1]); });
  if (!frozen && desk.clientWidth) { frozen = true; visible.forEach(l => { saved[l.u] = cell.get(l.u); }); }   // fixa a disposição sorteada
}

const inside = (el, x, y) => { const r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
const touch = matchMedia('(pointer: coarse)').matches;
function deselect() { document.querySelectorAll('.icon.sel').forEach(x => x.classList.remove('sel')); }

function mkIcon(name, mk, onOpen) {
  const b = document.createElement('button'); b.className = 'icon';
  b.append(mk()); const s = document.createElement('span'); s.textContent = name; b.append(s);
  b.addEventListener('click', () => {
    if (b._dragged) { b._dragged = false; return; }
    deselect(); b.classList.add('sel'); if (touch) onOpen();
  });
  b.addEventListener('dblclick', () => { if (Date.now() - (b._dragEnd || 0) > 500) onOpen(); });
  b.addEventListener('keydown', e => { if (e.key === 'Enter') onOpen(); });
  desk.append(b); return b;
}

/* ícone fixo: lixeira (o plano de fundo fica no clique direito) */
const trashEl = mkIcon('Lixeira', etile('🗑️'), () => openTrash());
const badge = document.createElement('div'); badge.className = 'badge'; trashEl.append(badge);

/* ícones dos sites: arrastáveis em grid */
store.get('piratinha-links', []).forEach(l => { if (!LINKS.some(x => x.u === l.u)) { LINKS.push(l); ORDER.push(l); } });
[...trashed].forEach(u => { if (!LINKS.some(l => l.u === u)) trashed.delete(u); });   // esquece sites que saíram da lista
store.set('piratinha-trash', [...trashed]);
function addIcon(l) {
  const b = mkIcon(l.n, () => tile(l), () => openApp(l));
  icons.set(l.u, { l, el: b });
  b.addEventListener('contextmenu', e => showCtx(e, [['📂 Abrir', () => openApp(l)], ...(l.fn ? [] : [['↗ Abrir em nova aba', () => window.open(l.u, '_blank', 'noopener')]]), ['📌 Mover para a taskbar', () => setPlace(l, 'taskbar')], ['🧷 Mover para a dock', () => setPlace(l, 'dock')], ...(l.app ? [['🙈 Tirar da área de trabalho', () => setPlace(l, 'none')]] : []), ['🗑️ Mover para a lixeira', () => sendToTrash(l)], ...(l.c ? [['❌ Excluir link', () => delLink(l)]] : [])]));
  b.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    b._dragged = false;
    const sx = e.clientX, sy = e.clientY, r = b.getBoundingClientRect(), dr = desk.getBoundingClientRect();
    const ox = sx - r.left, oy = sy - r.top; let drag = false;
    b.setPointerCapture(e.pointerId);
    const move = ev => {
      if (!drag) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; drag = true; b.classList.add('drag'); os.classList.add('dragging'); deselect(); }
      b.style.left = ev.clientX - dr.left - ox + 'px'; b.style.top = ev.clientY - dr.top - oy + 'px';
      trashEl.classList.toggle('hot', inside(trashEl, ev.clientX, ev.clientY));
    };
    const up = ev => {
      b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up);
      os.classList.remove('dragging'); b.classList.remove('drag'); trashEl.classList.remove('hot');
      if (!drag) return;
      b._dragged = true; b._dragEnd = Date.now();
      if (ev.type === 'pointerup' && inside(trashEl, ev.clientX, ev.clientY)) { sendToTrash(l); return; }
      let c = Math.max(0, Math.min(cols - 1, Math.floor((ev.clientX - dr.left - PAD) / CW)));
      let rr = Math.max(0, Math.min(rows - 1, Math.floor((ev.clientY - dr.top - PAD + RH / 2 - CH / 2) / RH)));
      const p = free(c, rr, l.u) ? [c, rr] : (nearestFree(c, rr, l.u) || cell.get(l.u));
      saved[l.u] = p; layoutAll();
    };
    b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  });
}
LINKS.forEach(addIcon);
desk.addEventListener('click', e => { if (e.target === desk) deselect(); });
addEventListener('resize', layoutAll);
