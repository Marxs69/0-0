/* Testes de hardware: controle (gamepad), teclado e mouse, monitor */

const hwAlive = (v, w) => () => v.isConnected && active === w;      // janela aberta e em foco
const hwFs = el => { document.body.append(el); el.requestFullscreen?.().catch(() => {}); };   // tela cheia (ou janela por cima de tudo, se o navegador recusar)

/* ---------- Teste de controle ---------- */
function openPad() {
  createWindow({ id: 'sys:pad', title: 'Teste de controle', mk: etile('🎮'), w: 640, h: 560, sys: true, body: v => {
    v.classList.add('tool');
    const sel = tEl('div', 'trow'), cv = tEl('canvas', 'padcv'), info = tEl('div', 'padinfo'), raw = tEl('div', 'padraw'), act = tEl('div', 'trow');
    const g = cv.getContext('2d'), CW = 560, CH = 300, dpr = Math.min(2, devicePixelRatio || 1); cv.width = CW * dpr; cv.height = CH * dpr; g.scale(dpr, dpr);
    let idx = 0, trails = [[], []], lastSel = '';
    const ac = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b072b1';
    const rumble = (s, w) => { const p = navigator.getGamepads?.()[idx]; p?.vibrationActuator?.playEffect?.('dual-rumble', { duration: 700, strongMagnitude: s, weakMagnitude: w }).catch(() => {}); };
    const rb1 = tBtn('〰️ Vibração fraca', () => rumble(.2, .6)), rb2 = tBtn('💥 Vibração forte', () => rumble(1, 1));
    act.append(rb1, rb2, tEl('span', 'tmsg', 'Solte os analógicos: valor parado acima de 0,10 indica deriva.'));
    v.append(sel, cv, info, raw, act);
    const circ = (x, y, r, fill, stroke) => { g.beginPath(); g.arc(x, y, r, 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); } };
    const rr = (x, y, w, h, r, fill, stroke) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); } };
    const lit = (val, a) => val > .05 ? `color-mix(in srgb, ${a} ${Math.round(40 + val * 60)}%, rgba(255,255,255,.08))` : 'rgba(255,255,255,.08)';
    const txt = (t, x, y, size = 12, col = '#f0f2f4') => { g.fillStyle = col; g.font = size + 'px Futura, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y); };
    function stick(x, y, ax, ay, pressed, tr, a) {
      circ(x, y, 34, pressed ? lit(1, a) : 'rgba(0,0,0,.25)', 'rgba(255,255,255,.25)');
      g.setLineDash([3, 4]); circ(x, y, 3.4, null, 'rgba(255,255,255,.35)'); g.setLineDash([]);
      tr.push([ax, ay]); if (tr.length > 40) tr.shift();
      tr.forEach(([tx, ty], i) => circ(x + tx * 30, y + ty * 30, 2, `rgba(255,255,255,${i / tr.length * .35})`));
      circ(x + ax * 30, y + ay * 30, 9, a);
    }
    function draw(p) {
      const a = ac(); g.clearRect(0, 0, CW, CH);
      if (!p) { txt(tr('Conecte um controle e aperte qualquer botão'), CW / 2, CH / 2, 16, '#aeb4bb'); return; }
      const B = i => p.buttons[i] ? p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0) : 0, A = i => p.axes[i] || 0;
      const ps = /playstation|dualsense|dualshock|054c/i.test(p.id), face = ps ? ['✕', '○', '□', '△'] : ['A', 'B', 'X', 'Y'];
      g.beginPath(); g.roundRect(70, 66, 420, 150, 70); g.arc(150, 222, 62, 0, 7); g.arc(410, 222, 62, 0, 7);
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fill();
      [[6, 90, 'LT', ps ? 'L2' : 'LT'], [7, 360, 'RT', ps ? 'R2' : 'RT']].forEach(([i, x, , n]) => { rr(x, 14, 110, 12, 6, 'rgba(255,255,255,.08)'); if (B(i) > 0) rr(x, 14, 110 * B(i), 12, 6, a); txt(n + ' ' + Math.round(B(i) * 100) + '%', x + 55, 36, 11, '#aeb4bb'); });
      [[4, 90, ps ? 'L1' : 'LB'], [5, 360, ps ? 'R1' : 'RB']].forEach(([i, x, n]) => { rr(x, 46, 110, 18, 9, lit(B(i), a), 'rgba(255,255,255,.2)'); txt(n, x + 55, 55, 11); });
      stick(165, 122, A(0), A(1), B(10) > .5, trails[0], a); stick(335, 190, A(2), A(3), B(11) > .5, trails[1], a);
      [[12, 0, -1, '▲'], [13, 0, 1, '▼'], [14, -1, 0, '◀'], [15, 1, 0, '▶']].forEach(([i, dx, dy, t]) => { rr(225 + dx * 17 - 9, 190 + dy * 17 - 9, 18, 18, 4, lit(B(i), a), 'rgba(255,255,255,.2)'); txt(t, 225 + dx * 17, 190 + dy * 17 + 1, 9); });
      [[3, 0, -1], [2, -1, 0], [1, 1, 0], [0, 0, 1]].forEach(([i, dx, dy], k) => { const x = 405 + dx * 28, y = 122 + dy * 28; circ(x, y, 13, lit(B(i), a), 'rgba(255,255,255,.25)'); txt(face[3 - k], x, y + 1, 12); });
      [[8, 248, 112, ps ? 'Share' : 'Back'], [16, 280, 140, 'Home'], [9, 312, 112, ps ? 'Options' : 'Start']].forEach(([i, x, y, n]) => { circ(x, y, 8, lit(B(i), a), 'rgba(255,255,255,.25)'); txt(n, x, y - 17, 9, '#aeb4bb'); });
      const mag = (x, y) => Math.hypot(x, y), col = m => m < .05 ? '#46a758' : m < .1 ? '#f5a524' : '#e5484d';
      const sig = [A(0), A(1), A(2), A(3)].map(n => n.toFixed(3)).join(); if (sig === info.dataset.sig) return; info.dataset.sig = sig;   // só refaz o texto quando muda
      info.innerHTML = ''; [[0, 1, 'Analógico esquerdo'], [2, 3, 'Analógico direito']].forEach(([x, y, n]) => {
        const m = mag(A(x), A(y)), s = tEl('div', 'padst'), b = tEl('b', '', m.toFixed(3)); b.style.color = col(m);
        s.append(tEl('span', 'tlab', n), tEl('span', '', 'x ' + A(x).toFixed(3) + '  y ' + A(y).toFixed(3) + '  ·  '), b); info.append(s);
      });
    }
    (function loop() {
      if (!v.isConnected) return;
      const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean), key = pads.map(p => p.index + p.id).join('|');
      if (key !== lastSel) {                                      // controles conectados mudaram: refaz os botões de escolha
        lastSel = key; sel.innerHTML = ''; if (!pads.some(p => p.index === idx) && pads[0]) idx = pads[0].index;
        if (!pads.length) sel.append(tEl('span', 'tmsg', 'Nenhum controle detectado.'));
        pads.forEach(p => sel.append(tBtn('🎮 ' + p.id.replace(/\s*\(.*$/, '').slice(0, 40), () => { idx = p.index; trails = [[], []]; lastSel = ''; }, 'pill' + (p.index === idx ? ' on' : ''))));
      }
      const p = pads.find(q => q.index === idx); draw(p);
      const vib = !!p?.vibrationActuator; rb1.disabled = rb2.disabled = !vib;
      const rs = p ? p.buttons.map(b => b.pressed ? 1 : 0).join('') + p.axes.map(x => x.toFixed(2)).join() : ''; if (rs !== raw.dataset.sig) { raw.dataset.sig = rs;
      raw.innerHTML = ''; if (p) { p.buttons.forEach((b, i) => { const c = tEl('span', 'chip' + (b.pressed ? ' on' : ''), 'B' + i); raw.append(c); }); p.axes.forEach((x, i) => raw.append(tEl('span', 'chip', 'E' + i + ' ' + x.toFixed(2)))); } }
      requestAnimationFrame(loop);
    })();
  } });
}

/* ---------- Teste de teclado e mouse ---------- */
const KB = [   // [código, rótulo, largura em teclas]; cada linha soma 15 + bloco de navegação
  [['Escape', 'Esc'], [null, '', 1], ...['F1', 'F2', 'F3', 'F4'].map(f => [f, f]), [null, '', .5], ...['F5', 'F6', 'F7', 'F8'].map(f => [f, f]), [null, '', .5], ...['F9', 'F10', 'F11', 'F12'].map(f => [f, f]), [null, '', .5], ['PrintScreen', 'PrtSc'], ['ScrollLock', 'ScrLk'], ['Pause', 'Pause']],
  [['Backquote', '`'], ...'1234567890'.split('').map(d => ['Digit' + d, d]), ['Minus', '-'], ['Equal', '='], ['Backspace', '⌫', 2], [null, '', .5], ['Insert', 'Ins'], ['Home', 'Home'], ['PageUp', 'PgUp']],
  [['Tab', 'Tab', 1.5], ...'QWERTYUIOP'.split('').map(c => ['Key' + c, c]), ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\', 1.5], [null, '', .5], ['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgDn']],
  [['CapsLock', 'Caps', 1.75], ...'ASDFGHJKL'.split('').map(c => ['Key' + c, c]), ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter', 2.25], [null, '', 3.5]],
  [['ShiftLeft', 'Shift', 1.25], ['IntlBackslash', '\\'], ...'ZXCVBNM'.split('').map(c => ['Key' + c, c]), ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['IntlRo', '/'], ['ShiftRight', 'Shift', 1.75], [null, '', 1.5], ['ArrowUp', '↑'], [null, '', 1]],
  [['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', '', 6.25], ['AltRight', 'AltGr', 1.25], ['MetaRight', 'Win', 1.25], ['ContextMenu', '☰', 1.25], ['ControlRight', 'Ctrl', 1.25], [null, '', .5], ['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']],
];
function openInput() {
  createWindow({ id: 'sys:input', title: 'Teste de teclado e mouse', mk: etile('⌨️'), w: 900, h: 600, sys: true, body: (v, w) => {
    v.classList.add('tool');
    const alive = hwAlive(v, w), kb = tEl('div', 'kb'), keys = new Map(), extra = tEl('div', 'kbx'), kinfo = tEl('div', 'trow'), down = new Set(); let maxDown = 0;
    KB.forEach(r => { const row = tEl('div', 'kbr'); r.forEach(([c, l, wd = 1]) => { const k = tEl(c ? 'div' : 'i', c ? 'key' : 'kgap', l); k.style.flexGrow = wd; if (c) keys.set(c, k); row.append(k); }); kb.append(row); });
    navigator.keyboard?.getLayoutMap?.().then(m => keys.forEach((k, c) => { const l = m.get(c); if (l && k.textContent.length === 1) k.textContent = l.toUpperCase(); })).catch(() => {});   // rótulos do layout real (ex.: Ç no ABNT2)
    const kn = tEl('span', 'tmsg'), kreset = tBtn('↺ Limpar', () => { keys.forEach(k => k.classList.remove('was', 'on')); extra.innerHTML = ''; maxDown = 0; showK(); });
    const showK = () => { kn.textContent = tr('Teclas ao mesmo tempo') + ': ' + down.size + ' · ' + tr('máximo') + ' ' + maxDown; };
    kinfo.append(tEl('span', 'tlab', 'Clique aqui e aperte as teclas. Segure várias juntas: se alguma não acender, o teclado tem ghosting.'), kreset, kn);
    const keyEl = c => { let k = keys.get(c); if (!k) { k = tEl('div', 'key', c.replace(/^(Key|Digit|Numpad)/, m => m === 'Numpad' ? 'Num ' : '')); keys.set(c, k); extra.append(k); } return k; };
    const kd = e => { if (!alive() || e.target.closest?.('input, textarea')) return; e.preventDefault(); down.add(e.code); maxDown = Math.max(maxDown, down.size); const k = keyEl(e.code || e.key); k.classList.add('on', 'was'); showK(); };
    const ku = e => { if (!v.isConnected) return; down.delete(e.code); const k = keys.get(e.code); if (k) k.classList.remove('on'); showK(); };
    const clear = () => { down.clear(); keys.forEach(k => k.classList.remove('on')); showK(); };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku); addEventListener('blur', clear);
    // mouse
    const pad = tEl('div', 'mpad'), mb = tEl('div', 'mbtns'), stats = tEl('div', 'mstats');
    const BN = ['Esquerdo', 'Meio', 'Direito', 'Voltar', 'Avançar'], bEl = BN.map(n => { const b = tEl('span', 'chip', n); mb.append(b); return b; }), wUp = tEl('span', 'chip', '▲ Roda'), wDn = tEl('span', 'chip', '▼ Roda'); mb.append(wUp, wDn);
    pad.append(tEl('span', 'mhint', 'Clique, role e mexa o mouse aqui'));
    const st = {}; const stat = (k, n) => { const r = tEl('div', 'mst'), b = tEl('b', '', '—'); r.append(tEl('span', 'tlab', n), b); stats.append(r); st[k] = b; };
    stat('cps', 'Cliques por segundo'); stat('max', 'Recorde de CPS'); stat('hz', 'Taxa de atualização'); stat('dbl', 'Duplo clique fantasma'); stat('wh', 'Passos da roda');
    let clicks = [], cpsMax = 0, ghost = 0, wheel = 0, mv = 0, mvT = performance.now(), hzMax = 0; const lastUp = [];
    st.dbl.textContent = '0'; st.wh.textContent = '0';
    pad.addEventListener('mousedown', e => {
      e.preventDefault(); bEl[e.button]?.classList.add('on'); const now = performance.now();
      if (lastUp[e.button] && now - lastUp[e.button] < 18) { ghost++; st.dbl.textContent = ghost; st.dbl.className = 'bad'; }   // apertou de novo em menos de 18 ms (mais rápido que um dedo): o botão "repicou"
      if (e.button === 0) { clicks.push(now); }
    });
    pad.addEventListener('mouseup', e => { e.preventDefault(); bEl[e.button]?.classList.remove('on'); lastUp[e.button] = performance.now(); });
    pad.addEventListener('mouseleave', () => bEl.forEach(b => b.classList.remove('on')));
    pad.addEventListener('auxclick', e => e.preventDefault()); pad.addEventListener('contextmenu', e => e.preventDefault());
    pad.addEventListener('wheel', e => { e.preventDefault(); wheel++; st.wh.textContent = wheel; const c = e.deltaY < 0 ? wUp : wDn; c.classList.add('on'); clearTimeout(c.t); c.t = setTimeout(() => c.classList.remove('on'), 120); }, { passive: false });
    const MOVE = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';
    pad.addEventListener(MOVE, e => { mv += e.getCoalescedEvents ? Math.max(1, e.getCoalescedEvents().length) : 1; });
    (function tick() {
      if (!v.isConnected) { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); removeEventListener('blur', clear); return; }
      const now = performance.now(); clicks = clicks.filter(t => now - t < 1000); cpsMax = Math.max(cpsMax, clicks.length);
      st.cps.textContent = clicks.length; st.max.textContent = cpsMax;
      if (now - mvT >= 250) { const hz = mv * 1000 / (now - mvT); if (mv > 20) { hzMax = Math.max(hzMax, hz); st.hz.textContent = '~' + Math.round(hz) + ' Hz · ' + tr('máx') + ' ' + Math.round(hzMax) + ' Hz'; } mv = 0; mvT = now; }
      requestAnimationFrame(tick);
    })();
    const ms = tEl('div', 'msplit'), side = tEl('div', 'mside'); side.append(mb, stats); ms.append(pad, side);
    v.append(kinfo, kb, extra, ms); showK(); v.tabIndex = -1; v.focus();
  } });
}

/* ---------- Teste de monitor ---------- */
function openScreen() {
  createWindow({ id: 'sys:screen', title: 'Teste de monitor', mk: etile('🖥️'), w: 720, h: 560, sys: true, body: v => {
    v.classList.add('tool');
    const top = tEl('div', 'fpsbox'), big = tEl('b', 'fpsn', '—'), sub = tEl('div', 'tmsg'), graph = tEl('canvas', 'fpsg'), lanes = tEl('canvas', 'lanes'), act = tEl('div', 'trow');
    const left = tEl('div'); left.append(big, sub); top.append(left, graph);
    act.append(tBtn('🟥 Pixels mortos (tela cheia)', deadPx), tBtn('⛶ Rastro em tela cheia', () => { const o = tEl('div', 'hwfs'), c = tEl('canvas'); o.append(c, tEl('div', 'fshint', 'Esc para sair')); o.onclick = () => o.remove(); fsKeys(o); hwFs(o); laneLoop(c, o); }));
    const gg = graph.getContext('2d'), times = []; let last = 0;
    const warn = tEl('div', 'fswarn'), fsb = tBtn('⛶ Tela cheia', () => document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : document.documentElement.requestFullscreen?.().catch(() => {}));
    warn.append(tEl('span', '', '⚠️ Para medir o FPS certo, use a tela cheia: em janela o navegador pode limitar ou oscilar os quadros.'), fsb);
    const fsUpd = () => { if (!v.isConnected) return document.removeEventListener('fullscreenchange', fsUpd); const on = !!document.fullscreenElement; warn.classList.toggle('ok', on); fsb.textContent = on ? '✕ Sair da tela cheia' : '⛶ Tela cheia'; times.length = 0; };
    document.addEventListener('fullscreenchange', fsUpd);
    v.append(warn);
    v.append(top, tEl('div', 'tlab', 'Rastro (ghosting): os blocos devem ficar nítidos, sem sombra ou borrão atrás. Quanto mais Hz, mais nítido em alta velocidade.'), lanes, act);
    function fpsLoop(now) {
      if (!v.isConnected) return;
      if (last) { times.push(now - last); if (times.length > 240) times.shift(); }
      last = now;
      if (times.length > 20) {
        const s = [...times].sort((a, b) => a - b), med = s[s.length >> 1], fps = 1000 / med;
        big.textContent = Math.round(fps) + ' FPS'; sub.textContent = tr('Quadro') + ' ' + med.toFixed(2) + ' ms · ' + tr('pior') + ' ' + s[s.length - 1].toFixed(1) + ' ms · ' + tr('seu monitor deve estar em ~{} Hz').replace('{}', Math.round(fps));
        const W = graph.width = graph.clientWidth * 2, H = graph.height = graph.clientHeight * 2, mx = Math.max(34, s[s.length - 1] * 1.2);
        gg.strokeStyle = 'rgba(255,255,255,.12)'; gg.beginPath(); gg.moveTo(0, H - H * med / mx); gg.lineTo(W, H - H * med / mx); gg.stroke();
        gg.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b072b1'; gg.lineWidth = 2; gg.beginPath();
        times.forEach((t, i) => { const x = i / 239 * W, y = H - H * t / mx; i ? gg.lineTo(x, y) : gg.moveTo(x, y); }); gg.stroke();
      }
      requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop); laneLoop(lanes, v);
  } });
}
function laneLoop(c, host) {   // três faixas com blocos andando a 240, 480 e 960 px/s
  const g = c.getContext('2d'), SP = [240, 480, 960]; let x = 0, t0 = 0;
  (function f(now) {
    if (!host.isConnected) return;
    const W = c.width = c.clientWidth, H = c.height = c.clientHeight, lh = H / 3, ac = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b072b1';
    const dt = t0 ? Math.min(.05, (now - t0) / 1000) : 0; t0 = now; x += dt;
    g.fillStyle = '#0b0a0d'; g.fillRect(0, 0, W, H);
    SP.forEach((sp, i) => {
      const y = i * lh, sz = Math.min(56, lh * .6), px = (x * sp) % (W + sz) - sz;
      g.fillStyle = i % 2 ? '#121016' : '#0e0c11'; g.fillRect(0, y, W, lh);
      g.strokeStyle = 'rgba(255,255,255,.06)'; for (let gx = 0; gx < W; gx += 32) { g.beginPath(); g.moveTo(gx, y); g.lineTo(gx, y + lh); g.stroke(); }
      g.fillStyle = ac; g.beginPath(); g.roundRect(px, y + (lh - sz) / 2, sz, sz, sz * .22); g.fill();
      g.fillStyle = '#fff'; g.fillRect(px + sz * .2, y + (lh - sz) / 2 + sz * .3, sz * .18, sz * .18); g.fillRect(px + sz * .62, y + (lh - sz) / 2 + sz * .3, sz * .18, sz * .18);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '12px Futura, system-ui, sans-serif'; g.textBaseline = 'top'; g.fillText(sp + ' px/s', 10, y + 8);
    });
    requestAnimationFrame(f);
  })(performance.now());
}
function fsKeys(o, next, prev) {
  const k = e => { if (!o.isConnected) return document.removeEventListener('keydown', k); e.preventDefault(); e.stopPropagation();
    if (e.key === 'Escape') { o.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } else if (next && /^(ArrowRight| |Enter)$/.test(e.key)) next(); else if (prev && e.key === 'ArrowLeft') prev(); };
  document.addEventListener('keydown', k, true);
  const fx = () => { if (!document.fullscreenElement) { o.remove(); document.removeEventListener('fullscreenchange', fx); } }; document.addEventListener('fullscreenchange', fx);
}
function deadPx() {   // cores sólidas para achar pixel morto ou preso; clique ou → avança, ← volta, Esc sai
  const C = ['#000', '#fff', '#f00', '#0f0', '#00f', '#0ff', '#f0f', '#ff0', '#808080', 'linear-gradient(90deg, #000, #fff)'];
  const o = tEl('div', 'hwfs'), h = tEl('div', 'fshint', 'Clique ou → para a próxima cor · ← volta · Esc sai'); let i = 0;
  const show = () => { o.style.background = C[i]; h.style.color = i === 1 || i === 3 || i === 5 || i === 7 ? '#000' : '#fff'; };
  const next = () => { i++; if (i >= C.length) { o.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } else show(); };
  o.append(h); o.onclick = next; o.oncontextmenu = e => { e.preventDefault(); i = (i + C.length - 1) % C.length; show(); };
  fsKeys(o, next, () => { i = (i + C.length - 1) % C.length; show(); }); show(); hwFs(o);
}
