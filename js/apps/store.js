/* Loja (estilo GNOME Software): instalar e remover apps e jogos */

function openStore() {
  createWindow({ id: 'sys:store', title: 'Loja', mk: etile('🛍️'), w: 820, h: 560, sys: true, body: v => {
    v.classList.add('st'); v.innerHTML = '<aside class="sd"></aside><section class="sm"><input type="text" class="sbox" placeholder="Buscar na loja" spellcheck="false"><div class="sg"></div></section>';
    const side = $('.sd', v), box = $('.sg', v), q = $('.sbox', v); let cat = 'all';
    const mk = (t, c, x, f) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; if (f) e.onclick = f; return e; };
    const CATS = [['inst', '✔️ Instalados'], ['all', '🧭 Explorar'], ['piratinha', '🏴‍☠️ Piratinha'], ['jogos', '🎮 Jogos'], ['apps', '🧰 Apps']];
    const drawSide = () => { side.innerHTML = ''; CATS.forEach(([k, n]) => side.append(mk('button', 'cat' + (k === cat ? ' on' : ''), n, () => { cat = k; drawSide(); render(); }))); };
    const card = it => {
      const c = mk('div', 'card'), t = mk('div', 'ct'), a = mk('div', 'ca'); t.append(mk('b', '', it.n), mk('small', '', it.d));
      if (it.on()) a.append(mk('button', 'pill', 'Abrir', it.open), mk('button', 'pill danger', 'Remover', () => { it.set(false); render(); }));
      else { const b = mk('button', 'pill', 'Instalar'); b.onclick = () => { b.textContent = 'Instalando…'; b.disabled = true; setTimeout(() => { it.set(true); render(); }, 300); }; a.append(b); }
      c.append(it.mk(), t, a); return c;
    };
    function render() {
      const s = q.value.trim().toLowerCase(); box.innerHTML = '';
      const list = storeItems().filter(it => (cat === 'all' || cat === 'inst' || it.c === cat) && (cat !== 'inst' || it.on()) && (!s || (it.n + ' ' + it.d).toLowerCase().includes(s)));
      [['piratinha', 'Piratinha'], ['jogos', 'Jogos'], ['apps', 'Apps']].forEach(([c, t]) => {
        const g = list.filter(it => it.c === c); if (!g.length) return;
        if (cat === 'all' || cat === 'inst') box.append(mk('h3', 'sh', t));
        const grid = mk('div', 'cg'); g.forEach(it => grid.append(card(it))); box.append(grid);
      });
      if (!list.length) box.append(mk('p', 'empty', 'Nada encontrado.'));
    }
    q.oninput = render; drawSide(); render();
  } });
}

const TRASHITEM = { c: 'apps', n: 'Lixeira', d: 'Veja e restaure os itens apagados.', mk: etile('🗑️'), open: () => openTrash(), on: () => !OFF.has('sys:trash'),
  set: on => { if (on) OFF.delete('sys:trash'); else { OFF.add('sys:trash'); const w = wins.get('sys:trash'); if (w) w.el.querySelector('.close').click(); } store.set('piratinha-off', [...OFF]); layoutAll(); } };
const storeItems = () => [
  ...LINKS.filter(l => l.id !== 'sys:store').map(l => ({ c: l.app ? l.cat : 'piratinha', n: l.n, d: l.d || hostOf(l), mk: () => tile(l), open: () => openApp(l), on: () => !OFF.has(idOf(l)), set: on => setInst(l, on) })),
  TRASHITEM,
];
