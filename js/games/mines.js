/* Campo Minado */

function openMines() {
  gameWin('game:mines', 'Campo Minado', '💣', 340, 470, (box, hud) => {
    const N = 9, M = 10, grid = document.createElement('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(9,32px);gap:2px'; box.append(grid);
    const rb = document.createElement('button'); rb.className = 'pill'; rb.textContent = 'Reiniciar'; box.append(rb);
    let cells, over, t0, secs;
    const nb = i => { const x = i % N, y = i / N | 0, r = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const X = x + a, Y = y + b; if ((a || b) && X >= 0 && Y >= 0 && X < N && Y < N) r.push(Y * N + X); } return r; };
    const info = () => { const b = store.get('piratinha-rec-mines', 0); hud.textContent = 'Minas ' + (M - cells.filter(c => c.f).length) + ' · Tempo ' + secs + 's · Melhor ' + (b ? b + 's' : '-') + (over === 1 ? ' · Perdeu!' : over === 2 ? ' · Venceu!' : ' · Botão direito = bandeira'); };
    const reset = () => { cells = Array.from({ length: N * N }, () => ({ m: 0, n: 0, o: 0, f: 0 })); over = 0; t0 = 0; secs = 0; draw(); };
    const place = s => { let k = 0; while (k < M) { const i = Math.random() * N * N | 0; if (i !== s && !cells[i].m) { cells[i].m = 1; k++; } } cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].m).length; }); };
    const reveal = i => { const c = cells[i]; if (c.o || c.f) return; c.o = 1; if (!c.n && !c.m) nb(i).forEach(reveal); };
    const click = i => {
      if (over || cells[i].f) return; if (!t0) { t0 = Date.now(); place(i); }
      if (cells[i].m) over = 1; else { reveal(i); if (cells.every(c => c.m || c.o)) { over = 2; secs = (Date.now() - t0) / 1000 | 0; rec('mines', secs); } }
      draw();
    };
    function draw() {
      grid.innerHTML = '';
      cells.forEach((c, i) => {
        const b = document.createElement('button');
        b.style.cssText = 'width:32px;height:32px;border:0;border-radius:6px;font:bold 15px monospace;color:#fff;cursor:pointer;background:' + (c.o ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.22)');
        b.textContent = c.o ? (c.m ? '💥' : c.n || '') : c.f ? '🚩' : over && c.m ? '💣' : '';
        b.onclick = () => click(i); b.oncontextmenu = e => { e.preventDefault(); if (!over && !c.o) { c.f = !c.f; draw(); } }; grid.append(b);
      });
      info();
    }
    rb.onclick = reset;
    const tm = setInterval(() => { if (!grid.isConnected) return clearInterval(tm); if (t0 && !over) { secs = (Date.now() - t0) / 1000 | 0; info(); } }, 1000);
    reset();
  });
}
