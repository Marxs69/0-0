/* Base dos jogos: janela do jogo e recordes no navegador */

const rec = (k, s) => { const b = store.get('piratinha-rec-' + k, 0); if (k === 'mines' ? (!b || s < b) : s > b) { store.set('piratinha-rec-' + k, s); return s; } return b; };
function gameWin(id, title, e, W, H, setup) {
  createWindow({ id, title, mk: etile(e), w: W, h: H, sys: true, body: (v, w) => {
    v.innerHTML = '<div class="gw"><div class="hud"></div></div>';
    const box = $('.gw', v), hud = $('.hud', v);
    setup(box, hud, () => box.isConnected && active === w);
  } });
}
