/* Onde cada item aparece: área de trabalho, taskbar, dock ou menu Iniciar */

$('#taskbar').addEventListener('contextmenu', e => e.preventDefault());       // o botão direito na taskbar nunca abre as configurações

const BTN = new Map();
function btnOf(l, w) {
  const id = idOf(l); let m = BTN.get(id); if (!m) BTN.set(id, m = {});
  if (!m[w]) {
    const b = document.createElement('button'); b.className = w === 'dock' ? 'dk' : 'pin'; b.dataset.label = l.n; b.dataset.id = id; b.setAttribute('aria-label', l.n); b.append(tile(l));
    b.onclick = () => toggleApp(l); b.addEventListener('contextmenu', e => itemMenu(e, l, w)); if (w === 'taskbar') b.draggable = true;
    (w === 'dock' ? $('#dock') : $('#tools')).append(b); m[w] = b;
  }
  return m[w];
}
function syncItem(l) {
  const id = idOf(l), p = placeOf(l), on = !OFF.has(id), m = BTN.get(id) || {}, key = l.win || l.u;
  ['taskbar', 'dock'].forEach(w => { if (p === w && on) btnOf(l, w).hidden = false; else if (m[w]) m[w].hidden = true; });
  const cur = on && (p === 'taskbar' || p === 'dock') ? BTN.get(id)[p] : null, old = pinBtns.get(key);
  if (old && old !== cur) old.classList.remove('open', 'active');
  if (cur) pinBtns.set(key, cur); else pinBtns.delete(key);
  const w = wins.get(key); if (w && cur && !w.btn.classList.contains('task')) { cur.classList.add('open'); w.btn = cur; }
}
function setPlace(l, w) {
  PLACE[idOf(l)] = w; store.set('piratinha-place', PLACE); delete saved[l.u];
  if (w === 'dock' && !pref.dk) { pref.dk = true; applyPrefs(); }
  syncItem(l); updateDock(); layoutAll();
}
function itemMenu(e, l, where) {
  const w = wins.get(l.win || l.u), items = [w ? ['✕ Fechar', () => w.el.querySelector('.close').click()] : ['📂 Abrir', () => openApp(l)]];
  [['taskbar', '📌 Mover para a taskbar'], ['dock', '🧷 Mover para a dock'], ['desktop', '🖥️ Mover para a área de trabalho'], ['menu', '📋 Mover para o menu Iniciar']].forEach(([k, t]) => { if (k !== where && (k !== 'menu' || l.app)) items.push([t, () => setPlace(l, k)]); });
  showCtx(e, items);
}
function setInst(l, on) {
  const id = idOf(l);
  if (on) OFF.delete(id); else { OFF.add(id); const w = wins.get(l.win || l.u); if (w) w.el.querySelector('.close').click(); trashed.delete(l.u); delete saved[l.u]; persistTrash(); }
  store.set('piratinha-off', [...OFF]); syncItem(l); updateDock(); layoutAll();
}
function updateDock(relayout) {
  const d = $('#dock'), z = { p: 66, m: 74, g: 84 }[pref.dz] || 74, tb = 58 + (pref.ts === 'd' ? 10 : 20);
  d.hidden = !pref.dk || ![...d.children].some(b => !b.hidden); $('#dockzone').hidden = d.hidden || !pref.da;
  let t = 0, b = 0, l = 0, r = 0; if (pref.tb === 't') t = tb; else b = tb;
  if (!d.hidden && !pref.da) { if (pref.dp === 'b') b += z; else if (pref.dp === 't') t += z; else if (pref.dp === 'l') l += z; else r += z; }
  [['t', t], ['b', b], ['l', l], ['r', r]].forEach(([k, n]) => os.style.setProperty('--ins-' + k, n + 'px'));
  os.style.setProperty('--dk-off', (pref.dp === pref.tb ? tb : 10) + 'px');
  if (relayout) layoutAll();
}
LINKS.forEach(syncItem);
{ const tl = $('#tools'); let drag = null;                       // reordenar os ícones da taskbar arrastando
  store.get('piratinha-tools', []).forEach(n => { const b = [...tl.children].find(x => x.dataset.id === n); if (b) tl.append(b); });
  tl.addEventListener('dragstart', e => { drag = e.target.closest('.pin'); });
  tl.addEventListener('dragover', e => { e.preventDefault(); const t = e.target.closest('.pin'); if (t && drag && t !== drag) { const r = t.getBoundingClientRect(); tl.insertBefore(drag, e.clientX < r.left + r.width / 2 ? t : t.nextSibling); } });
  tl.addEventListener('dragend', () => { drag = null; store.set('piratinha-tools', [...tl.children].map(b => b.dataset.id)); }); }
{ const d = $('#dock'), z = $('#dockzone'); let t;                // dock com ocultar automático
  const show = () => { clearTimeout(t); d.classList.add('show'); }, hide = () => { clearTimeout(t); t = setTimeout(() => d.classList.remove('show'), 450); };
  [z, d].forEach(x => { x.addEventListener('pointerenter', show); x.addEventListener('pointerleave', hide); }); }
