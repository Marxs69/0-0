/* Ícones em bloco: emoji ou favicon do site */

function tile(l) {
  const t = document.createElement('div'); t.className = 'tile';
  if (l.e) { t.innerHTML = '<i>' + l.e + '</i>'; return t; }
  const img = new Image(); img.alt = ''; img.draggable = false;
  const letter = () => { t.innerHTML = ''; const b = document.createElement('b'); b.textContent = l.n.replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase(); t.append(b); };
  const local = () => { if (!l.i || img.dataset.local) return letter(); img.dataset.local = 1; img.classList.add('px'); img.src = l.i; };
  img.src = 'https://www.google.com/s2/favicons?domain=' + new URL(l.u).hostname + '&sz=64';
  img.onload = () => { if (!img.dataset.local && img.naturalWidth < 32 && l.i) local(); };   // o Google devolve um globo de 16px quando não conhece o site
  img.onerror = local;
  t.append(img); return t;
}
const etile = e => () => { const t = document.createElement('div'); t.className = 'tile'; t.innerHTML = '<i>' + e + '</i>'; return t; };
