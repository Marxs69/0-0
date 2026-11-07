/* Menu Iniciar: Loja, sites e busca */

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
  const shop = LINKS.find(l => l.id === 'sys:store'), showShop = !qq || [shop.n, tr(shop.n)].some(n => n.toLowerCase().includes(qq));   // o único app do menu é a Loja
  const found = LINKS.filter(l => !l.app && live(l) && (!qq || l.n.toLowerCase().includes(qq) || hostOf(l).includes(qq)));
  if (!showShop && !found.length) {
    if (qq) box.append(row(q.trim(), slug(q) + '.com', () => { closeStart(); window.open(FOOTER_URL, '_blank', 'noopener'); }));      // pegadinha: leva ao link do rodapé
    else { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'Nenhum app instalado. Abra a Loja para instalar.'; box.append(p); }
    return;
  }
  if (showShop) {
    const h = document.createElement('h3'); h.className = 'ghost'; h.setAttribute('aria-hidden', 'true'); h.textContent = 'Loja'; box.append(h);   // título invisível: alinha com os grupos de sites
    const b = document.createElement('button'), n = document.createElement('span'); b.className = 'ab sb'; n.textContent = shop.n;
    b.append(tile(shop), n); b.onclick = () => openApp(shop); b.addEventListener('contextmenu', e => itemMenu(e, shop, placeOf(shop))); box.append(b);
  }
  GROUPS.forEach(([g, name]) => {
    const items = found.filter(l => l.g === g); if (!items.length) return;
    const h = document.createElement('h3'); h.textContent = name; box.append(h);
    items.forEach(l => { const r = row(l.n, l.local ? (l.file || 'jogo') : hostOf(l), () => openApp(l)); r.addEventListener('contextmenu', e => itemMenu(e, l, placeOf(l))); box.append(r); });
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
