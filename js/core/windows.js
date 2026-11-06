/* Gerenciador de janelas: criar, focar, minimizar, maximizar, arrastar e abrir apps */

const wins = new Map(); let z = 10, offset = 0, active = null;
function createWindow(o) {
  closeStart(); o.pin = o.pin || pinBtns.get(o.id);
  if (wins.has(o.id)) { const w = wins.get(o.id); w.el.classList.remove('min'); focusWin(w); return w; }
  const vw = innerWidth, vh = innerHeight - 160;
  const W = Math.min(o.w, vw - 20), H = Math.min(o.h, vh - 20);
  const el = document.createElement('div'); el.className = 'win';
  const o2 = offset - 48;                          // pequeno deslocamento para janelas não ficarem exatamente empilhadas
  el.style.cssText = `width:${W}px;height:${H}px;left:${Math.max(10, Math.min(Math.round((vw - W) / 2 + o2), vw - W - 10))}px;top:${Math.max(10, Math.round((vh - H) / 2 + o2))}px`;
  offset = (offset + 24) % 120;
  if (o.tr) { el.style.left = Math.max(10, vw - W - 10) + 'px'; el.style.top = (os.classList.contains('tbtop') ? 78 : 10) + 'px'; }
  el.innerHTML = `<div class="bar"><span class="title"></span>${o.ext ? '<a class="wbtn ext" target="_blank" rel="noopener" title="Abrir em nova aba">↗</a>' : ''}
    <button class="wbtn mn" title="Minimizar">–</button><button class="wbtn mx" title="Maximizar">▢</button><button class="wbtn close" title="Fechar">✕</button></div>
    <div class="view${o.sys ? ' sys' : ''}"></div>${o.hint || ''}`;
  $('.bar', el).prepend(o.mk()); $('.title', el).textContent = o.title;
  if (o.ext) $('.ext', el).href = o.ext;

  let btn = o.pin;                                   // app fixado (taskbar ou dock): reaproveita o botão
  if (btn) btn.classList.add('open');
  else {
    btn = document.createElement('button'); btn.className = 'task';
    btn.append(o.mk()); const sp = document.createElement('span'); sp.textContent = o.title; btn.append(sp);
    $('#tasks').append(btn); btn.addEventListener('contextmenu', e => showCtx(e, [['✕ Fechar', () => $('.close', el).click()]]));
  }
  os.append(el);

  const w = { id: o.id, el, btn };
  wins.set(o.id, w);
  o.body($('.view', el), w);
  if (!o.pin) btn.onclick = () => toggleWin(w);
  el.addEventListener('pointerdown', () => focusWin(w));
  $('.mn', el).onclick = () => minimize(w);
  $('.mx', el).onclick = () => el.classList.toggle('max');
  $('.close', el).onclick = () => { const kill = () => { el.remove(); if (o.pin) { btn.classList.remove('open', 'active'); const pb = pinBtns.get(o.id); if (pb) pb.classList.remove('open', 'active'); } else btn.remove(); wins.delete(o.id); if (active === w) active = null; refresh(); }; if (pref.an) { el.classList.add('closing'); setTimeout(kill, 130); } else kill(); };

  const bar = $('.bar', el);
  bar.addEventListener('contextmenu', e => showCtx(e, [['➖ Minimizar', () => minimize(w)], [el.classList.contains('max') ? '🗗 Restaurar' : '🗖 Maximizar', () => el.classList.toggle('max')], ...(o.ext ? [['↗ Abrir em nova aba', () => window.open(o.ext, '_blank', 'noopener')]] : []), ['✕ Fechar', () => $('.close', el).click()]]));
  bar.addEventListener('dblclick', e => { if (!e.target.closest('.wbtn')) el.classList.toggle('max'); });
  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('.wbtn') || el.classList.contains('max')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    bar.setPointerCapture(e.pointerId); os.classList.add('dragging');
    const move = ev => {
      el.style.left = Math.max(-r.width + 80, Math.min(ev.clientX - dx, innerWidth - 80)) + 'px';
      el.style.top = Math.max(0, Math.min(ev.clientY - dy, innerHeight - 100)) + 'px';
    };
    const up = () => { os.classList.remove('dragging'); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
    bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
  });
  el.addEventListener('pointerdown', e => {          // canto de redimensionar: iframe não pode roubar o mouse
    const r = el.getBoundingClientRect();
    if (e.clientX > r.right - 22 && e.clientY > r.bottom - 22) {
      os.classList.add('dragging'); addEventListener('pointerup', () => os.classList.remove('dragging'), { once: true });
    }
  });
  focusWin(w); return w;
}
function toggleWin(w) { if (active === w && !w.el.classList.contains('min')) minimize(w); else { w.el.classList.remove('min'); focusWin(w); } }
function minimize(w) { const f = () => { w.el.classList.add('min'); w.el.classList.remove('closing'); }; if (pref.an) { w.el.classList.add('closing'); setTimeout(f, 130); } else f(); if (active === w) active = null; refresh(); }
function focusWin(w) { active = w; w.el.style.zIndex = ++z; refresh(); }
function refresh() { wins.forEach(w => { const on = w === active && !w.el.classList.contains('min'); w.el.classList.toggle('active', on); w.btn.classList.toggle('active', on); }); }

const pinBtns = new Map();                           // url -> botão fixado (taskbar ou dock)
function toggleApp(l) { const w = wins.get(l.u); if (w) toggleWin(w); else openApp(l); }
function openApp(l) {
  if (l.fn) return l.fn();
  const isNew = !wins.has(l.u);
  const w = createWindow({
    pin: pinBtns.get(l.u),
    id: l.u, title: l.n, mk: () => tile(l), w: l.local ? 1000 : 960, h: l.local ? 660 : 620, ext: l.u,
    hint: l.old ? '' : l.local ? `<div class="hint">Clique dentro do jogo para ativar teclado e mouse. <a target="_blank" rel="noopener" href="${l.u}">Abrir em nova aba</a></div>` : `<div class="hint">Página em branco ou recusada? O site bloqueia exibição incorporada. <a target="_blank" rel="noopener" href="${l.u}">Abrir em nova aba</a></div>`,
    body: v => { v.innerHTML = `<iframe src="${l.u}" referrerpolicy="no-referrer" allow="fullscreen"></iframe>`; $('iframe', v).title = l.n; },
  });
  if (isNew && l.max) w.el.classList.add('max');      // jogos abrem maximizados
}
