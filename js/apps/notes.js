/* Bloco de notas (salvo no navegador) */

function openNotes() {
  createWindow({ id: 'sys:notes', title: 'Bloco de notas', mk: etile('📝'), w: 460, h: 400, sys: true, body: v => {
    const t = document.createElement('textarea'); t.className = 'note'; t.placeholder = 'Escreva aqui… (salvo automaticamente)';
    t.value = store.get('piratinha-notes', ''); t.oninput = () => store.set('piratinha-notes', t.value); v.append(t);
  } });
}
