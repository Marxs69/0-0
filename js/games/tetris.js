/* Tetris */

function openTetris() {
  gameWin('game:tetris', 'Tetris', '🧱', 330, 620, (box, hud, live) => {
    const W = 10, H = 20, S = 24, cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S; box.append(cv);
    const g = cv.getContext('2d'), COL = ['#22d3ee', '#facc15', '#c084fc', '#60a5fa', '#fb923c', '#4ade80', '#f87171'];
    const SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]];
    let b, p, x, y, sc, over, best = store.get('piratinha-rec-tetris', 0);
    const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
    const hit = (m, X, Y) => m.some((r, j) => r.some((v, i) => v && (X + i < 0 || X + i >= W || Y + j >= H || (Y + j >= 0 && b[Y + j][X + i]))));
    const spawn = () => { const k = Math.random() * 7 | 0; p = { m: SH[k], c: COL[k] }; x = 3; y = 0; if (hit(p.m, x, y)) { over = true; best = rec('tetris', sc); } };
    const reset = () => { b = Array.from({ length: H }, () => Array(W).fill(0)); sc = 0; over = false; spawn(); };
    const lock = () => {
      p.m.forEach((r, j) => r.forEach((v, i) => { if (v) b[y + j][x + i] = p.c; })); let n = 0;
      for (let j = H - 1; j >= 0; j--) if (b[j].every(Boolean)) { b.splice(j, 1); b.unshift(Array(W).fill(0)); n++; j++; }
      sc += [0, 100, 300, 500, 800][n]; spawn();
    };
    const draw = () => {
      g.fillStyle = '#0b0d10'; g.fillRect(0, 0, W * S, H * S);
      b.forEach((r, j) => r.forEach((c, i) => { if (c) { g.fillStyle = c; g.fillRect(i * S, j * S, S - 1, S - 1); } }));
      if (!over) { g.fillStyle = p.c; p.m.forEach((r, j) => r.forEach((v, i) => { if (v) g.fillRect((x + i) * S, (y + j) * S, S - 1, S - 1); })); }
      hud.textContent = 'Pontos ' + sc + ' · Recorde ' + Math.max(best, sc) + (over ? ' · Fim! Enter reinicia' : ' · Setas, espaço = queda');
    };
    const drop = () => { if (!hit(p.m, x, y + 1)) y++; else lock(); };
    const loop = setInterval(() => { if (!cv.isConnected) return clearInterval(loop); if (live() && !over) { drop(); draw(); } }, 500);
    document.addEventListener('keydown', e => {
      if (!live()) return; const k = e.key; if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
      if (k === 'Enter' && over) reset(); if (over) return draw();
      if (k === 'ArrowLeft' && !hit(p.m, x - 1, y)) x--; else if (k === 'ArrowRight' && !hit(p.m, x + 1, y)) x++;
      else if (k === 'ArrowDown') drop(); else if (k === 'ArrowUp') { const r = rot(p.m); if (!hit(r, x, y)) p.m = r; }
      else if (k === ' ') { while (!hit(p.m, x, y + 1)) y++; lock(); }
      draw();
    });
    reset(); draw();
  });
}
