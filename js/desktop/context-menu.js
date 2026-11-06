/* Menu de clique direito, novo link e organização */

const ctx = $('#ctx');
function showCtx(e, items) {
  e.preventDefault(); e.stopPropagation(); ctx.innerHTML = '';
  items.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = () => { ctx.style.display = 'none'; f(); }; ctx.append(b); });
  ctx.style.display = 'block'; ctx.style.left = Math.min(e.clientX, innerWidth - 240) + 'px'; ctx.style.top = Math.max(0, Math.min(e.clientY, innerHeight - 20 - items.length * 38)) + 'px';
}
desk.addEventListener('contextmenu', e => {
  if (e.target === desk) showCtx(e, [['🔗 Novo link…', newLink], ['🔄 Atualizar', () => location.reload()], ['💻 Abrir terminal', openTerm], [pref.hi ? '👁️ Mostrar ícones' : '🙈 Esconder ícones', () => { pref.hi = !pref.hi; applyPrefs(); }], ...(current.img ? [['⬇️ Baixar plano de fundo', downloadWall]] : []), ['🎨 Customização', openWall], ['⚙️ Configurações', openSettings]]);
});
function organize() {
  const vis = LINKS.filter(l => !trashed.has(l.u)).sort((a, b) => a.n.localeCompare(b.n, 'pt'));
  ORDER.length = 0; ORDER.push(...vis, ...LINKS.filter(l => trashed.has(l.u))); Object.keys(saved).forEach(k => delete saved[k]); frozen = false; layoutAll();
}
function newLink() {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = '<div class="box"><p>Novo link</p><input type="text" class="sp nm" placeholder="Nome" style="width:100%"><input type="text" class="sp ur" placeholder="https://…" style="width:100%;margin-top:8px"><div class="mb" style="margin-top:14px"><button class="pill">Cancelar</button><button class="pill">Adicionar</button></div></div>';
  const [x, y] = m.querySelectorAll('button'), nm = $('.nm', m), ur = $('.ur', m);
  x.onclick = () => m.remove();
  y.onclick = () => {
    let u = ur.value.trim(); if (!/^[a-z]+:\/\//i.test(u)) u = 'https://' + u;
    try { new URL(u); } catch (e) { ur.value = ''; ur.placeholder = 'Endereço inválido'; return; }
    if (LINKS.some(l => l.u === u)) { ur.value = ''; ur.placeholder = 'Esse link já existe'; return; }
    const l = { n: nm.value.trim() || new URL(u).hostname.replace(/^www\./, ''), u, g: 'out', c: 1 };
    LINKS.push(l); ORDER.push(l); store.set('piratinha-links', [...store.get('piratinha-links', []), l]); addIcon(l);
    const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.textContent = l.n; a.dataset.u = u; $('#old-out').append(a); m.remove(); layoutAll();
  };
  os.append(m); nm.focus();
}
function delLink(l) {
  [LINKS, ORDER].forEach(a => { const i = a.indexOf(l); if (i >= 0) a.splice(i, 1); });
  icons.get(l.u).el.remove(); icons.delete(l.u); trashed.delete(l.u); delete saved[l.u]; persistTrash();
  store.set('piratinha-links', store.get('piratinha-links', []).filter(x => x.u !== l.u));
  document.querySelectorAll('#old-out a').forEach(a => { if (a.dataset.u === l.u) a.remove(); }); layoutAll();
}
document.addEventListener('pointerdown', e => { if (!e.target.closest('#ctx')) ctx.style.display = 'none'; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') ctx.style.display = 'none'; });

$('#startset').onclick = () => openSettings(); $('#startcust').onclick = () => openWall();
