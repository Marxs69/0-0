/* Base dos widgets: arrastar e lembrar a posição */

const WPOS = store.get('piratinha-wpos', {});
function dragEl(el, handle, done) {
  handle.style.touchAction = 'none';
  handle.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; handle.setPointerCapture(e.pointerId); os.classList.add('dragging');
    const mv = ev => { el.style.left = Math.max(0, Math.min(innerWidth - 60, ev.clientX - dx)) + 'px'; el.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - dy)) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; };
    const up = () => { os.classList.remove('dragging'); handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); const b = el.getBoundingClientRect(); done(Math.round(b.left), Math.round(b.top)); };
    handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up); handle.addEventListener('pointercancel', up);
  });
}
function dragWidget(el, handle, id) {
  const p = WPOS[id]; if (p) { el.style.left = Math.max(0, Math.min(p[0], innerWidth - 60)) + 'px'; el.style.top = Math.max(0, Math.min(p[1], innerHeight - 60)) + 'px'; el.style.right = 'auto'; }
  handle.style.cursor = 'grab'; dragEl(el, handle, (x, y) => { WPOS[id] = [x, y]; store.set('piratinha-wpos', WPOS); });
}
