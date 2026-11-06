/* Blocos Coloridos (combine três) */

function openMatch() {
  gameWin('game:match', 'Blocos Coloridos', '🟪', 390, 560, (box, hud) => {
    const N = 8, K = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    const grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,40px);gap:3px'; box.append(grid);
    const rb = document.createElement('button'); rb.className = 'pill'; rb.textContent = 'Reiniciar'; box.append(rb);
    let b, sel, sc, mv, busy, best = store.get('piratinha-rec-match', 0);
    const rnd = () => Math.random() * K.length | 0, sleep = ms => new Promise(r => setTimeout(r, ms));
    const found = () => {
      const s = new Set();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const k = b[r][c];
        if (c < N - 2 && b[r][c + 1] === k && b[r][c + 2] === k) [0, 1, 2].forEach(i => s.add(r * N + c + i));
        if (r < N - 2 && b[r + 1][c] === k && b[r + 2][c] === k) [0, 1, 2].forEach(i => s.add((r + i) * N + c));
      }
      return s;
    };
    const settle = async () => {
      let s, chain = 0;
      while ((s = found()).size) {
        chain++; sc += s.size * 10 * chain; s.forEach(i => { b[i / N | 0][i % N] = -1; }); draw(); await sleep(160);
        for (let c = 0; c < N; c++) { const col = []; for (let r = N - 1; r >= 0; r--) if (b[r][c] >= 0) col.push(b[r][c]); while (col.length < N) col.push(rnd()); for (let r = N - 1, i = 0; r >= 0; r--, i++) b[r][c] = col[i]; }
        draw(); await sleep(160);
      }
    };
    const swap = (r1, c1, r2, c2) => { const t = b[r1][c1]; b[r1][c1] = b[r2][c2]; b[r2][c2] = t; };
    const tap = async (r, c) => {
      if (busy || mv <= 0) return; if (!sel) { sel = [r, c]; return draw(); }
      const [r0, c0] = sel; if (Math.abs(r - r0) + Math.abs(c - c0) !== 1) { sel = [r, c]; return draw(); }
      sel = null; busy = true; swap(r0, c0, r, c); draw(); await sleep(120);
      if (!found().size) { swap(r0, c0, r, c); } else { mv--; await settle(); if (mv <= 0) best = rec('match', sc); }
      busy = false; draw();
    };
    function draw() {
      grid.innerHTML = '';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const d = document.createElement('div'); d.style.cssText = 'width:40px;height:40px;border-radius:10px;cursor:pointer;background:' + K[b[r][c]] + ';box-shadow:inset 0 -4px 0 rgba(0,0,0,.25);' + (b[r][c] < 0 ? 'opacity:0;' : '') + (sel && sel[0] === r && sel[1] === c ? 'outline:3px solid #fff;' : '');
        d.onclick = () => tap(r, c); grid.append(d);
      }
      hud.textContent = 'Pontos ' + sc + ' · Movimentos ' + mv + ' · Recorde ' + Math.max(best, sc) + (mv <= 0 ? ' · Fim de jogo!' : '');
    }
    const reset = () => {
      b = []; for (let r = 0; r < N; r++) { b.push([]); for (let c = 0; c < N; c++) { let k; do { k = rnd(); } while ((c > 1 && b[r][c - 1] === k && b[r][c - 2] === k) || (r > 1 && b[r - 1][c] === k && b[r - 2][c] === k)); b[r].push(k); } }
      sc = 0; mv = 30; sel = null; busy = false; draw();
    };
    rb.onclick = reset; reset();
  });
}
