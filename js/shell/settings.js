/* Preferências salvas e janela de Configurações */

const SIZES = { p: { n: 'Pequeno', w: 80, h: 88, t: 38 }, m: { n: 'Médio', w: 96, h: 100, t: 46 }, g: { n: 'Grande', w: 116, h: 120, t: 56 } };
const pref = Object.assign({ c: '#211c1e', a: .5, s: 'm', h24: true, sec: false, an: true, shuf: true, tb: 'b', notif: true, ac: '#b072b1', bl: 4, sq: false, ts: 'f', lang: 'en', dk: true, da: false, dp: 'b', dsh: 'r', dz: 'm', hi: false, wg: true, wm: false, wmon: true, wq: true }, store.get('piratinha-pref', {}));
function applyPrefs(relayout) {
  const h = pref.c, st = document.documentElement.style, z = SIZES[pref.s] || SIZES.m;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  st.setProperty('--glass', `rgba(${r},${g},${b},${pref.a})`);
  st.setProperty('--glass-strong', `rgba(${r},${g},${b},${Math.min(.95, pref.a + .2)})`);
  CW = z.w; CH = z.h; os.style.setProperty('--cw', z.w + 'px'); os.style.setProperty('--ch', z.h + 'px'); os.style.setProperty('--ts', z.t + 'px');
  st.setProperty('--accent', pref.ac); st.setProperty('--blur', pref.bl + 'px');
  os.classList.toggle('tbtop', pref.tb === 't'); os.classList.toggle('tbdock', pref.ts === 'd'); if (pref.lang !== curLang) setLang(pref.lang); document.body.classList.toggle('noanim', !pref.an); document.body.classList.toggle('sq', !!pref.sq);
  document.body.classList.toggle('hideicons', !!pref.hi);
  const dk = $('#dock'); dk.dataset.p = pref.dp; dk.dataset.sh = pref.dsh; dk.dataset.z = pref.dz; dk.dataset.ah = pref.da ? '1' : ''; $('#dockzone').dataset.p = pref.dp;
  wg.hidden = !pref.wg; wg.classList.toggle('min', !!pref.wm); mon.hidden = !pref.wmon; qw.hidden = !pref.wq; updateDock();
  if (relayout === 'soft') layoutAll(); else if (relayout) { Object.keys(saved).forEach(k => delete saved[k]); frozen = false; layoutAll(); }
  store.set('piratinha-pref', pref);
}
function openSettings(sec) {
  createWindow({ id: 'sys:set', title: 'Configurações', mk: etile('⚙️'), w: 700, h: 480, sys: true, body: v => {
    v.classList.add('st'); v.innerHTML = '<aside class="sd"></aside><section class="sm"></section>';
    const side = $('.sd', v), main = $('.sm', v);
    const mk = (t, c, x, f) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (f) e.onclick = f; return e; };
    const grp = (label, items, key, rl) => {
      main.append(mk('div', 'sysbar', label)); const box = mk('div'); box.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px';
      const draw = () => { box.innerHTML = ''; items.forEach(([k, n]) => box.append(mk('button', 'pill' + (k === pref[key] ? ' on' : ''), n, () => { pref[key] = k; applyPrefs(rl); draw(); }))); }; draw(); main.append(box);
    };
    const chk = (label, key, rl) => {
      const l = mk('label', 'srow'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!pref[key];
      cb.onchange = () => { pref[key] = cb.checked; applyPrefs(rl); tick(); }; l.append(mk('span', 'grow', label), cb); main.append(l);
    };
    const SECS = [
      ['geral', 'Geral', () => { chk('Relógio em 24 horas', 'h24'); chk('Mostrar segundos no relógio', 'sec'); chk('Animações das janelas', 'an'); chk('Cantos quadrados', 'sq'); }],
      ['idioma', 'Idioma', () => grp('Idioma', [['en', 'EN'], ['pt', 'BR'], ['es', 'ES'], ['fr', 'FR'], ['de', 'DE'], ['ru', 'RU']], 'lang')],
      ['taskbar', 'Taskbar', () => { grp('Posição da taskbar', [['b', 'Embaixo'], ['t', 'Em cima']], 'tb', 'soft'); grp('Estilo da taskbar', [['f', 'Flutuante'], ['d', 'Acoplada']], 'ts', 'soft'); }],
      ['dock', 'Dock', () => {
        chk('Habilitada', 'dk', 'soft'); chk('Ocultar automaticamente', 'da', 'soft');
        grp('Posição da dock', [['b', 'Embaixo'], ['t', 'Em cima'], ['l', 'Esquerda'], ['r', 'Direita']], 'dp', 'soft');
        grp('Formato', [['r', 'Arredondado'], ['s', 'Quadrado']], 'dsh'); grp('Tamanho dos ícones da dock', [['p', 'Pequeno'], ['m', 'Médio'], ['g', 'Grande']], 'dz', 'soft');
      }],
      ['icones', 'Ícones', () => { grp('Tamanho dos ícones', Object.entries(SIZES).map(([k, z]) => [k, z.n]), 's', true); chk('Embaralhar ícones a cada acesso', 'shuf'); chk('Esconder ícones', 'hi'); }],
      ['widget', 'Widget', () => { chk('Mostrar widget de música', 'wg'); chk('Mostrar monitor do sistema', 'wmon'); chk('Mostrar frase do dia', 'wq'); }],
      ['sistema', 'Sistema', () => {
        const r = mk('div'); r.style.cssText = 'display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap'; const left = mk('div'); left.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
        left.append(mk('button', 'pill', 'Ir para o modo antigo', () => setMode('old')));
        r.append(left, mk('button', 'pill danger', 'Restaurar padrões', () => ask('Restaurar os padrões e apagar todos os dados salvos neste navegador (notas, recordes, lixeira e preferências)? Isso não pode ser desfeito.', () => { try { localStorage.clear(); } catch (e) {} location.reload(); }))); main.append(r);
      }],
    ];
    const show = k => { side.innerHTML = ''; SECS.forEach(([id, n]) => side.append(mk('button', 'cat' + (id === k ? ' on' : ''), n, () => show(id)))); main.innerHTML = ''; SECS.find(s => s[0] === k)[2](); };
    show(typeof sec === 'string' && SECS.some(s => s[0] === sec) ? sec : 'geral');
  } });
}
