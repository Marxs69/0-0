/* Paint */

function openPaint() {
  createWindow({ id: 'sys:paint', title: 'Paint', mk: etile('🎨'), w: 700, h: 560, sys: true, body: v => {
    v.innerHTML = '<div class="ptools"></div><canvas class="pcv" width="640" height="400"></canvas>';
    const tb = $('.ptools', v), cv = $('.pcv', v), g = cv.getContext('2d'), W = 640, H = 400;
    let tool = 'pen', col = '#000000', sz = 4, undo = [], redo = [], st = null, last = null, snap = null;
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    const cur = () => g.getImageData(0, 0, W, H);
    const btn = (t, fn, title) => { const b = document.createElement('button'); b.className = 'pill'; b.textContent = t; b.title = title || ''; b.onclick = fn; tb.append(b); return b; };
    const tools = {}; [['pen', '✏️', 'Lápis'], ['eraser', '🧽', 'Borracha'], ['line', '／', 'Linha'], ['rect', '▭', 'Retângulo'], ['circle', '◯', 'Círculo'], ['fill', '🪣', 'Balde de tinta']].forEach(([k, e, t]) => {
      tools[k] = btn(e, () => { tool = k; Object.values(tools).forEach(x => x.classList.remove('on')); tools[k].classList.add('on'); }, t);
    }); tools.pen.classList.add('on');
    const c = document.createElement('input'); c.type = 'color'; c.value = col; c.oninput = () => { col = c.value; }; tb.append(c);
    const r = document.createElement('input'); r.type = 'range'; r.min = 1; r.max = 40; r.value = sz; r.style.width = '90px'; r.oninput = () => { sz = +r.value; }; tb.append(r);
    btn('↶', () => { if (undo.length) { redo.push(cur()); g.putImageData(undo.pop(), 0, 0); } }, 'Desfazer');
    btn('↷', () => { if (redo.length) { undo.push(cur()); g.putImageData(redo.pop(), 0, 0); } }, 'Refazer');
    btn('🗑', () => { undo.push(cur()); redo = []; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }, 'Limpar');
    btn('💾', () => { const a = document.createElement('a'); a.download = 'desenho.png'; a.href = cv.toDataURL('image/png'); a.click(); }, 'Salvar PNG');
    const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
    const flood = (x, y) => {
      const im = cur(), d = im.data, i0 = ((y | 0) * W + (x | 0)) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2]], k = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16));
      if (t.every((q, i) => q === k[i])) return; const q = [[x | 0, y | 0]];
      while (q.length) { const [a, b] = q.pop(); if (a < 0 || b < 0 || a >= W || b >= H) continue; const i = (b * W + a) * 4; if (d[i] !== t[0] || d[i + 1] !== t[1] || d[i + 2] !== t[2]) continue; d[i] = k[0]; d[i + 1] = k[1]; d[i + 2] = k[2]; q.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
      g.putImageData(im, 0, 0);
    };
    cv.onpointerdown = e => {
      st = pt(e); undo.push(cur()); if (undo.length > 30) undo.shift(); redo = [];
      if (tool === 'fill') { flood(st[0], st[1]); st = null; return; }
      cv.setPointerCapture(e.pointerId); last = st; snap = cur(); g.lineCap = 'round'; g.lineWidth = sz; g.strokeStyle = tool === 'eraser' ? '#fff' : col;
      if (tool === 'pen' || tool === 'eraser') { g.beginPath(); g.moveTo(st[0], st[1]); g.lineTo(st[0] + .01, st[1]); g.stroke(); }
    };
    cv.onpointermove = e => {
      if (!st) return; const p = pt(e);
      if (tool === 'pen' || tool === 'eraser') { g.beginPath(); g.moveTo(last[0], last[1]); g.lineTo(p[0], p[1]); g.stroke(); last = p; return; }
      g.putImageData(snap, 0, 0); g.beginPath();
      if (tool === 'line') { g.moveTo(st[0], st[1]); g.lineTo(p[0], p[1]); }
      else if (tool === 'rect') g.rect(st[0], st[1], p[0] - st[0], p[1] - st[1]);
      else g.arc(st[0], st[1], Math.hypot(p[0] - st[0], p[1] - st[1]), 0, 7);
      g.stroke();
    };
    cv.onpointerup = () => { st = null; };
  } });
}
