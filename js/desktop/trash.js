/* Lixeira */

function sendToTrash(l) { trashed.add(l.u); delete saved[l.u]; persistTrash(); layoutAll(); }
function restore(l) { trashed.delete(l.u); delete saved[l.u]; persistTrash(); layoutAll(); }
function persistTrash() {
  store.set('piratinha-trash', [...trashed]);
  badge.textContent = trashed.size || '';
  const w = wins.get('sys:trash'); if (w && w.render) w.render();
}
function openTrash() {
  createWindow({
    id: 'sys:trash', title: 'Lixeira', mk: etile('🗑️'), w: 440, h: 420, sys: true,
    body: (v, w) => {
      w.render = () => {
        v.innerHTML = '';
        const items = LINKS.filter(l => trashed.has(l.u));
        const bar = document.createElement('div'); bar.className = 'sysbar';
        bar.innerHTML = '<span></span>'; $('span', bar).textContent = items.length ? items.length + (items.length > 1 ? ' itens' : ' item') : '';
        if (items.length) { const all = document.createElement('button'); all.className = 'pill'; all.textContent = 'Restaurar tudo'; all.onclick = () => items.forEach(restore); bar.append(all); }
        v.append(bar);
        if (!items.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'A lixeira está vazia. Arraste um ícone da área de trabalho até ela para guardá-lo aqui.'; v.append(p); return; }
        items.forEach(l => {
          const row = document.createElement('div'); row.className = 'srow';
          const nm = document.createElement('span'); nm.className = 'grow'; nm.textContent = l.n;
          const bt = document.createElement('button'); bt.className = 'pill'; bt.textContent = 'Restaurar'; bt.onclick = () => restore(l);
          row.append(tile(l), nm, bt); v.append(row);
        });
      };
      w.render();
    },
  });
}
