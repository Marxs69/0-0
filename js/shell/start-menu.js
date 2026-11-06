/* Menu Iniciar: apps, sites e busca */

const hostOf = l => l.local ? (l.file || 'jogo') : new URL(l.u).hostname.replace(/^www\./, '');
const slug = q => q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'site';
function row(name, host, fn) {
  const b = document.createElement('button'); b.className = 'row';
  const n = document.createElement('span'); n.textContent = name;
  const h = document.createElement('span'); h.className = 'h'; h.textContent = host;
  b.append(n, h); b.onclick = fn; return b;
}
function buildStart(q = '') {
  const box = $('#apps'); box.innerHTML = '';
  const qq = q.trim().toLowerCase(), live = l => !OFF.has(idOf(l));
  const apps = LINKS.filter(l => l.app && l.cat === 'apps' && live(l) && (!qq || l.n.toLowerCase().includes(qq)));
  const found = LINKS.filter(l => !l.app && live(l) && (!qq || l.n.toLowerCase().includes(qq) || hostOf(l).includes(qq)));
  if (!apps.length && !found.length) {
    if (qq) box.append(row(q.trim(), slug(q) + '.com', () => { closeStart(); window.open(FOOTER_URL, '_blank', 'noopener'); }));      // pegadinha: leva ao link do rodapé
    else { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'Nenhum app instalado. Abra a Loja para instalar.'; box.append(p); }
    return;
  }
  if (apps.length) {                                    // apps em blocos de 3 por linha: o bloco é só o ícone
    const h = document.createElement('h3'); h.textContent = 'Apps'; box.append(h);
    const g = document.createElement('div'); g.className = 'ag';
    apps.forEach(l => { const b = document.createElement('button'); b.className = 'ab'; b.title = l.n; b.setAttribute('aria-label', l.n); b.append(tile(l)); b.onclick = () => openApp(l); b.addEventListener('contextmenu', e => itemMenu(e, l, placeOf(l))); g.append(b); });
    box.append(g);
  }
  [['rec', 'Recomendados'], ['out', 'Outros']].forEach(([g, name]) => {
    const items = found.filter(l => l.g === g); if (!items.length) return;
    const h = document.createElement('h3'); h.textContent = name; box.append(h);
    items.forEach(l => box.append(row(l.n, l.local ? (l.file || 'jogo') : hostOf(l), () => openApp(l))));
  });
}
$('#search').addEventListener('input', e => buildStart(e.target.value));
$('#search').addEventListener('keydown', e => { if (e.key === 'Enter') { const f = $('.row', startEl); if (f) f.click(); } });
function closeStart() { startEl.classList.remove('open'); startBtn.setAttribute('aria-expanded', 'false'); }
startBtn.onclick = e => {
  e.stopPropagation();
  const open = startEl.classList.toggle('open'); startBtn.setAttribute('aria-expanded', open);
  if (open) { $('#search').value = ''; buildStart(); $('#search').focus(); }
};
document.addEventListener('pointerdown', e => { if (!e.target.closest('#start') && !e.target.closest('#startbtn')) closeStart(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeStart(); });
