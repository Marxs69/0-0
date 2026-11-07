/* Loja (estilo GNOME Software): instalar e remover apps e jogos */

function openStore() {
  createWindow({ id: 'sys:store', title: 'Loja', mk: etile('🛍️'), w: 820, h: 560, sys: true, body: v => {
    v.classList.add('st'); v.innerHTML = '<aside class="sd"></aside><section class="sm"><input type="text" class="sbox" placeholder="Buscar na loja" spellcheck="false"><div class="sg"></div></section>';
    const side = $('.sd', v), box = $('.sg', v), q = $('.sbox', v); let cat = 'all';
    const mk = (t, c, x, f) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (f) e.onclick = f; return e; };
    const TAGS = { piratinha: GROUPS, apps: [['sistema', 'Sistema'], ['util', 'Utilitários'], ['hw', 'Testes de hardware']] }; let tag = 'all';
    const CATS = [['inst', '✔️ Instalados'], ['all', '🧭 Explorar'], ['piratinha', '🏴‍☠️ Piratinha'], ['jogos', '🎮 Jogos'], ['apps', '🧰 Apps']];
    const drawSide = () => { side.innerHTML = ''; CATS.forEach(([k, n]) => side.append(mk('button', 'cat' + (k === cat ? ' on' : ''), n, () => { cat = k; tag = 'all'; drawSide(); render(); }))); };
    const card = it => {
      const c = mk('div', 'card'), t = mk('div', 'ct'), a = mk('div', 'ca'); t.append(mk('b', '', it.n), mk('small', '', it.d));
      if (it.on()) {
        const top = mk('div', 'car'); top.append(mk('button', 'pill', 'Abrir', it.open));
        if (it.l.app) {                                    // apps e jogos: mostrar ou tirar da área de trabalho
          const on = placeOf(it.l) === 'desktop', p = mk('button', 'pill pinb' + (on ? ' on' : ''), '🖥️', () => { setPlace(it.l, on ? 'none' : 'desktop'); render(); });
          p.title = on ? 'Tirar da área de trabalho' : 'Mostrar na área de trabalho'; top.append(p);
        }
        a.append(top, mk('button', 'pill danger', 'Remover', () => { it.set(false); render(); }));
      }
      else { const b = mk('button', 'pill', 'Instalar'); b.onclick = () => { b.textContent = 'Instalando…'; b.disabled = true; setTimeout(() => { it.set(true); render(); }, 300); }; a.append(b); }
      c.append(it.mk(), t, a); return c;
    };
    function render() {
      const s = q.value.trim().toLowerCase(), tg = TAGS[cat]; box.innerHTML = '';
      if (tg) {                                            // Piratinha e Apps: filtro por tag no topo
        const bar = mk('div', 'stags'); [['all', 'Todos'], ...tg].forEach(([k, n]) => bar.append(mk('button', 'chip' + (k === tag ? ' on' : ''), n, () => { tag = k; render(); }))); box.append(bar);
      }
      const list = storeItems().filter(it => (cat === 'all' || cat === 'inst' || it.c === cat) && (cat !== 'inst' || it.on()) && (!tg || tag === 'all' || it.t === tag) && (!s || (it.n + ' ' + it.d).toLowerCase().includes(s)));
      [['piratinha', 'Piratinha'], ['jogos', 'Jogos'], ['apps', 'Apps']].forEach(([c, t]) => {
        const g = list.filter(it => it.c === c); if (!g.length) return;
        if (cat === 'all' || cat === 'inst') box.append(mk('h3', 'sh', t));
        const groups = TAGS[c] ? TAGS[c].map(([k, n]) => [n, g.filter(it => it.t === k)]) : [['', g]];
        groups.forEach(([n, items]) => {                   // um bloco por tag (Repack, Scene… / Sistema, Utilitários…)
          if (!items.length) return; if (n) box.append(mk('span', 'stag', n));
          const grid = mk('div', 'cg'); items.forEach(it => grid.append(card(it))); box.append(grid);
        });
      });
      if (!list.length) box.append(mk('p', 'empty', 'Nada encontrado.'));
    }
    q.oninput = render; drawSide(); render();
  } });
}

const storeItems = () => LINKS.filter(l => l.id !== 'sys:store').map(l => ({
  l, c: l.app ? l.cat : 'piratinha', t: l.app ? l.tag || (l.cat === 'apps' ? 'util' : '') : l.g, n: l.n, d: l.d || hostOf(l),
  mk: () => tile(l), open: () => openApp(l), on: () => !OFF.has(idOf(l)), set: on => setInst(l, on),
}));
