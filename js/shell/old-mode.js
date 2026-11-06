/* Modo antigo e troca entre os modos */

LINKS.forEach(l => {
  if (l.local) return;
  const a = document.createElement('a'); a.href = l.u; a.target = '_blank'; a.textContent = l.n; a.dataset.u = l.u;
  $(l.g === 'rec' ? '#old-rec' : '#old-out').append(a);
});
function setMode(m) { document.body.dataset.mode = m; closeStart(); if (m === 'os') layoutAll(); if (!EMB) try { localStorage.setItem('piratinha-mode', m); } catch (e) {} }
document.querySelectorAll('[data-switch]').forEach(b => b.addEventListener('click', () => setMode(document.body.dataset.mode === 'os' ? 'old' : 'os')));
const EMB = window.top !== window.self;                       // aberto dentro de uma janela do sistema (Piratinha Old)
if (/[?&]old\b/.test(location.search)) { document.body.dataset.mode = 'old'; if (EMB) $('#oldswitch').hidden = true; }
else try { const m = localStorage.getItem('piratinha-mode'); if (m === 'old' || m === 'os') document.body.dataset.mode = m; } catch (e) {}
