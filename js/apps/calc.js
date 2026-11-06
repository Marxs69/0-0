/* Calculadora */

function openCalc() {
  createWindow({ id: 'sys:calc', title: 'Calculadora', mk: etile('🧮'), w: 320, h: 460, sys: true, body: v => {
    let ex = ''; v.innerHTML = '<div class="calc"><div class="scr">0</div></div>';
    const c = $('.calc', v), scr = $('.scr', v), show = () => { scr.textContent = ex || '0'; };
    const calc = () => { try { if (!/^[\d+\-*/.() %]+$/.test(ex)) throw 0; const r = Function('"use strict";return (' + ex + ')')(); ex = Number.isFinite(r) ? String(+r.toFixed(10)) : 'Erro'; } catch (e) { ex = 'Erro'; } show(); };
    'C ⌫ % ÷ 7 8 9 × 4 5 6 − 1 2 3 + ( ) 0 . ='.split(' ').forEach(k => {
      const b = document.createElement('button'); b.textContent = k;
      if ('÷×−+=%'.includes(k)) b.className = 'op'; if (k === '=') b.style.gridColumn = '1 / -1';
      b.onclick = () => { if (ex === 'Erro') ex = ''; if (k === 'C') ex = ''; else if (k === '⌫') ex = ex.slice(0, -1); else if (k === '=') return calc(); else ex += ({ '÷': '/', '×': '*', '−': '-' })[k] || k; show(); };
      c.append(b);
    });
  } });
}
