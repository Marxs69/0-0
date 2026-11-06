/* Snake */

function openSnake() {
  gameWin('game:snake', 'Snake', '🐍', 380, 470, (box, hud, live) => {
    const N = 20, S = 17, cv = document.createElement('canvas'); cv.width = cv.height = N * S; box.append(cv);
    const g = cv.getContext('2d'); let sn, d, nd, f, sc, over, best = store.get('piratinha-rec-snake', 0);
    const rnd = () => ({ x: Math.random() * N | 0, y: Math.random() * N | 0 });
    const reset = () => { sn = [{ x: 10, y: 10 }]; d = nd = { x: 1, y: 0 }; f = rnd(); sc = 0; over = false; };
    const draw = () => {
      g.fillStyle = '#0b0d10'; g.fillRect(0, 0, N * S, N * S); g.fillStyle = '#e5484d'; g.fillRect(f.x * S, f.y * S, S - 1, S - 1);
      g.fillStyle = '#4ade80'; sn.forEach(p => g.fillRect(p.x * S, p.y * S, S - 1, S - 1));
      hud.textContent = 'Pontos ' + sc + ' · Recorde ' + Math.max(best, sc) + (over ? ' · Fim! Enter reinicia' : ' · Setas movem');
    };
    const loop = setInterval(() => {
      if (!cv.isConnected) return clearInterval(loop); if (!live() || over) return;
      d = nd; const h = { x: sn[0].x + d.x, y: sn[0].y + d.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || sn.some(p => p.x === h.x && p.y === h.y)) { over = true; best = rec('snake', sc); return draw(); }
      sn.unshift(h); if (h.x === f.x && h.y === f.y) { sc++; f = rnd(); } else sn.pop(); draw();
    }, 120);
    document.addEventListener('keydown', e => {
      if (!live()) return; const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (m) { e.preventDefault(); if (m[0] !== -d.x || m[1] !== -d.y) nd = { x: m[0], y: m[1] }; }
      if (e.key === 'Enter' && over) { reset(); draw(); }
    });
    reset(); draw();
  });
}
