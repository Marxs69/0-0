/* Navegador com abas (iframes) */

function openBrowser() {
  createWindow({ id: 'sys:browser', title: 'Navegador', mk: etile('🌐'), w: 1000, h: 640, sys: true,
    hint: '<div class="hint">Alguns sites recusam ser exibidos aqui. Use ↗ para abrir em nova aba.</div>',
    body: v => {
      v.classList.add('br');
      v.innerHTML = '<div class="tabs"></div><div class="addr"><button class="pill" title="Recarregar">⟳</button><input type="text" placeholder="Endereço ou pesquisa (Wikipédia)" spellcheck="false"><button class="pill" title="Abrir em nova aba">↗</button></div><div class="frames"><div class="bmsg"></div></div>';
      const bar = $('.tabs', v), inp = $('input', v), box = $('.frames', v), msg = $('.bmsg', v), [rl, ex] = v.querySelectorAll('.addr .pill'), tabs = []; let cur = null;
      const BLOCK = /(^|\.)(google\.[a-z.]+|youtube\.com|youtu\.be|facebook\.com|instagram\.com|x\.com|twitter\.com|github\.com|reddit\.com|linkedin\.com|duckduckgo\.com|bing\.com|amazon\.[a-z.]+|netflix\.com|discord\.com|twitch\.tv|tiktok\.com|whatsapp\.com)$/i;
      const norm = q => { q = q.trim(); if (!q) return ''; if (/^[a-z]+:\/\//i.test(q)) return q; if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q)) return 'https://' + q; return 'https://pt.wikipedia.org/w/index.php?search=' + encodeURIComponent(q); };
      const name = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'Nova aba'; } };
      const note = t => {
        msg.innerHTML = ''; const h = document.createElement('b'), p = document.createElement('span');
        if (!t.u) { h.textContent = 'Nova aba'; p.textContent = 'Digite um endereço (ex.: wikipedia.org) ou uma pesquisa. Pesquisas usam a Wikipédia.'; }
        else if (t.blocked) { h.textContent = 'Este site não pode ser exibido aqui'; p.textContent = name(t.u) + ' proíbe ser aberto dentro de outra página.'; }
        else { msg.style.display = 'none'; return; }
        msg.append(h, p);
        if (t.u) { const b = document.createElement('button'); b.className = 'pill'; b.textContent = 'Abrir em nova aba'; b.onclick = () => ex.click(); msg.append(b); }
        msg.style.display = 'flex';
      };
      const show = t => { cur = t; tabs.forEach(x => { x.f.style.display = x === t && !t.blocked ? 'block' : 'none'; x.b.classList.toggle('on', x === t); }); inp.value = t.u; note(t); };
      const load = (t, u) => { t.u = u; t.blocked = BLOCK.test(name(u)); t.l.textContent = name(u); if (t.blocked) t.f.removeAttribute('src'); else t.f.src = u; };
      const plus = document.createElement('button'); plus.className = 'wbtn'; plus.textContent = '+'; plus.title = 'Nova aba'; bar.append(plus);
      const add = () => {
        const t = { u: '', blocked: false }; t.f = document.createElement('iframe'); t.f.referrerPolicy = 'no-referrer'; t.f.allow = 'fullscreen';
        t.b = document.createElement('div'); t.b.className = 'tab'; t.l = document.createElement('span'); t.l.textContent = 'Nova aba';
        const x = document.createElement('button'); x.className = 'wbtn'; x.textContent = '✕'; x.style.cssText = 'width:22px;height:22px;font-size:12px';
        x.onclick = ev => { ev.stopPropagation(); const k = tabs.indexOf(t); tabs.splice(k, 1); t.f.remove(); t.b.remove(); if (!tabs.length) add(); else if (cur === t) show(tabs[Math.max(0, k - 1)]); };
        t.b.onclick = () => show(t); t.b.append(t.l, x); bar.insertBefore(t.b, plus); box.insertBefore(t.f, msg); tabs.push(t); show(t);
      };
      plus.onclick = add;
      inp.onkeydown = e => { if (e.key === 'Enter' && cur) { const u = norm(inp.value); if (!u) return; load(cur, u); show(cur); } };
      rl.onclick = () => { if (cur && cur.u && !cur.blocked) cur.f.src = cur.u; };
      ex.onclick = () => { if (cur && cur.u) window.open(cur.u, '_blank', 'noopener'); };
      add();
    } });
}
