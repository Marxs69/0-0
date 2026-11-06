/* Modo antigo e troca entre os modos */

function oldLink(l) {                                   // card de um site no modo antigo: favicon + nome
  const a = document.createElement('a'); a.href = l.u; a.target = '_blank'; a.rel = 'noopener'; a.dataset.u = l.u;
  const s = document.createElement('span'); s.textContent = l.n; a.append(tile(l), s); return a;
}
LINKS.forEach(l => { if (!l.local) $(l.g === 'rec' ? '#old-rec' : '#old-out').append(oldLink(l)); });
function setMode(m) { document.body.dataset.mode = m; closeStart(); if (m === 'os') layoutAll(); if (!EMB) try { localStorage.setItem('piratinha-mode', m); } catch (e) {} }
document.querySelectorAll('[data-switch]').forEach(b => b.addEventListener('click', () => setMode(document.body.dataset.mode === 'os' ? 'old' : 'os')));
const EMB = window.top !== window.self;                       // aberto dentro de uma janela do sistema (Piratinha Old)
if (/[?&]old\b/.test(location.search)) { document.body.dataset.mode = 'old'; if (EMB) $('#oldswitch').hidden = true; }
else try { const m = localStorage.getItem('piratinha-mode'); if (m === 'old' || m === 'os') document.body.dataset.mode = m; } catch (e) {}
