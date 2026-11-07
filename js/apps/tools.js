/* Utilitários: Base64, QR Code, gerador de senhas e hash */

const tEl = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const tBtn = (x, f, c = 'pill') => { const b = tEl('button', c, x); b.onclick = f; return b; };
function tCopy(text, b) {   // copia e mostra "Copiado!" no próprio botão
  const done = () => { const o = b.textContent; b.textContent = '✔ Copiado!'; setTimeout(() => { b.textContent = o; }, 1100); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => {});
  else { const t = tEl('textarea'); t.value = text; document.body.append(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
}

/* ---------- Base64 ---------- */
function openB64() {
  createWindow({ id: 'sys:b64', title: 'Base64', mk: etile('🔣'), w: 620, h: 520, sys: true, body: v => {
    v.classList.add('tool');
    const inp = tEl('textarea', 'tarea'), out = tEl('textarea', 'tarea'), msg = tEl('div', 'tmsg'), url = tEl('input'), fileIn = tEl('input');
    inp.placeholder = 'Texto ou Base64…'; out.placeholder = 'Resultado'; out.readOnly = true; inp.spellcheck = out.spellcheck = false;
    url.type = 'checkbox'; fileIn.type = 'file'; fileIn.hidden = true;
    const b2s = b => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return s; };
    const enc = () => { let r = btoa(b2s(new TextEncoder().encode(inp.value))); if (url.checked) r = r.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return r; };
    const dec = () => {
      let s = inp.value.trim().replace(/^data:[^,]*;base64,/, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'); s += '='.repeat((4 - s.length % 4) % 4);
      const bin = atob(s), b = Uint8Array.from(bin, c => c.charCodeAt(0));
      try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return bin; }   // não é UTF-8: mostra os bytes como estão
    };
    const run = (f, ok) => { try { out.value = f(); msg.textContent = ok; msg.className = 'tmsg'; } catch (e) { out.value = ''; msg.textContent = 'Base64 inválido.'; msg.className = 'tmsg bad'; } };
    const lbl = tEl('label', 'tchk'); lbl.append(url, tEl('span', '', 'Seguro para URL'));
    const bar = tEl('div', 'trow');
    bar.append(tBtn('🔒 Codificar', () => run(enc, 'Codificado.')), tBtn('🔓 Decodificar', () => run(dec, 'Decodificado.')),
      tBtn('⇅ Trocar', () => { inp.value = out.value; out.value = ''; msg.textContent = ''; }), tBtn('📁 Arquivo', () => fileIn.click()), lbl);
    const copy = tBtn('📋 Copiar resultado', () => tCopy(out.value, copy));
    fileIn.onchange = () => {
      const f = fileIn.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { out.value = r.result; msg.textContent = f.name + ' · ' + Math.round(f.size / 1024) + ' KB'; msg.className = 'tmsg'; fileIn.value = ''; };
      r.readAsDataURL(f);
    };
    const foot = tEl('div', 'trow'); foot.append(copy, msg);
    v.append(inp, bar, out, foot, fileIn);
  } });
}

/* ---------- QR Code ---------- */
function openQR() {
  createWindow({ id: 'sys:qr', title: 'QR Code', mk: etile('🔳'), w: 460, h: 600, sys: true, body: v => {
    v.classList.add('tool');
    const inp = tEl('input', 'sp'), cv = tEl('canvas', 'qrcv'), msg = tEl('div', 'tmsg'), lv = tEl('div', 'trow'); let ecl = 'M', last = null;
    inp.type = 'text'; inp.placeholder = 'https://… ou qualquer texto'; inp.spellcheck = false; inp.value = location.protocol.startsWith('http') ? location.href.split('?')[0] : 'https://github.com/Marxs69/0-0';
    const draw = () => {
      const t = inp.value; if (!t) { last = null; cv.width = cv.height = 0; msg.textContent = 'Digite um endereço ou texto.'; return; }
      try { last = QR(t, ecl); } catch (e) { last = null; cv.width = cv.height = 0; msg.textContent = 'Texto longo demais para um QR Code.'; return; }
      const n = last.length, q = 4, s = Math.max(4, Math.floor(512 / (n + q * 2))); cv.width = cv.height = (n + q * 2) * s;
      const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#000';
      last.forEach((row, y) => row.forEach((d, x) => { if (d) g.fillRect((x + q) * s, (y + q) * s, s, s); }));
      msg.textContent = n + '×' + n + ' · versão ' + (n - 17) / 4;
    };
    const levels = [['L', '7%'], ['M', '15%'], ['Q', '25%'], ['H', '30%']];
    const drawLv = () => { lv.innerHTML = ''; lv.append(tEl('span', 'tlab', 'Correção')); levels.forEach(([k, p]) => lv.append(tBtn(k + ' ' + p, () => { ecl = k; drawLv(); draw(); }, 'pill' + (k === ecl ? ' on' : '')))); };
    const save = tBtn('💾 Salvar PNG', () => { if (!last) return; const a = tEl('a'); a.href = cv.toDataURL('image/png'); a.download = 'qrcode.png'; a.click(); });
    const copy = tBtn('📋 Copiar imagem', () => {
      if (!last || !navigator.clipboard || !window.ClipboardItem) return;
      cv.toBlob(b => navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(() => { const o = copy.textContent; copy.textContent = '✔ Copiado!'; setTimeout(() => { copy.textContent = o; }, 1100); }, () => {}));
    });
    const box = tEl('div', 'qrbox'); box.append(cv);
    const foot = tEl('div', 'trow'); foot.append(save, copy, msg);
    inp.oninput = draw; drawLv(); v.append(inp, lv, box, foot); draw(); setTimeout(() => inp.select(), 50);
  } });
}

/* ---------- Gerador de senhas ---------- */
function openPass() {
  createWindow({ id: 'sys:pass', title: 'Gerador de senhas', mk: etile('🔑'), w: 480, h: 440, sys: true, body: v => {
    v.classList.add('tool');
    const out = tEl('input', 'sp tpass'), len = tEl('input'), ln = tEl('b', 'tlab'), meter = tEl('div', 'tmeter'), bar = tEl('i'), info = tEl('div', 'tmsg');
    out.type = 'text'; out.readOnly = true; len.type = 'range'; len.min = 4; len.max = 64; len.value = store.get('piratinha-passlen', 20); meter.append(bar);
    const SETS = [['Maiúsculas', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', true], ['Minúsculas', 'abcdefghijklmnopqrstuvwxyz', true], ['Números', '0123456789', true], ['Símbolos', '!@#$%&*?-_=+.:;/', true], ['Evitar parecidos (l, I, 1, O, 0)', '', false]];
    const boxes = SETS.map(([n, , on]) => { const l = tEl('label', 'tchk'), c = tEl('input'); c.type = 'checkbox'; c.checked = on; c.onchange = gen; l.append(c, tEl('span', '', n)); return [l, c]; });
    const rnd = n => { const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };
    function gen() {
      const avoid = boxes[4][1].checked, sets = SETS.slice(0, 4).filter((s, i) => boxes[i][1].checked).map(s => avoid ? s[1].replace(/[lI1O0]/g, '') : s[1]);
      const n = +len.value; ln.textContent = n + ' caracteres'; store.set('piratinha-passlen', n);
      if (!sets.length) { out.value = ''; bar.style.width = '0'; info.textContent = 'Escolha pelo menos um tipo de caractere.'; return; }
      const all = sets.join(''), p = sets.map(s => s[rnd(s.length)]);   // garante um de cada tipo escolhido
      while (p.length < n) p.push(all[rnd(all.length)]);
      for (let i = p.length - 1; i > 0; i--) { const j = rnd(i + 1); [p[i], p[j]] = [p[j], p[i]]; }
      out.value = p.slice(0, n).join('');
      const bits = Math.round(n * Math.log2(all.length)), lvl = bits < 40 ? ['Fraca', '#e5484d'] : bits < 64 ? ['Razoável', '#f5a524'] : bits < 100 ? ['Forte', '#46a758'] : ['Muito forte', '#2ec27e'];
      bar.style.width = Math.min(100, bits / 1.28) + '%'; bar.style.background = lvl[1]; info.textContent = lvl[0] + ' · ' + bits + ' bits';
    }
    len.oninput = gen;
    const copy = tBtn('📋 Copiar', () => tCopy(out.value, copy));
    const top = tEl('div', 'trow'); top.append(out, tBtn('🎲', gen), copy);
    const lr = tEl('div', 'trow'); len.style.flex = '1'; lr.append(ln, len);
    const opts = tEl('div', 'topts'); boxes.forEach(([l]) => opts.append(l));
    v.append(top, meter, info, lr, opts); gen();
  } });
}

/* ---------- Hash ---------- */
function openHash() {
  createWindow({ id: 'sys:hash', title: 'Hash', mk: etile('#️⃣'), w: 640, h: 500, sys: true, body: v => {
    v.classList.add('tool');
    const inp = tEl('textarea', 'tarea'), list = tEl('div', 'hlist'), msg = tEl('div', 'tmsg'), fileIn = tEl('input'); let job = 0;
    inp.placeholder = 'Texto para calcular o hash…'; inp.spellcheck = false; fileIn.type = 'file'; fileIn.hidden = true;
    const ALGS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    const rows = ALGS.map(a => { const r = tEl('div', 'hrow'), o = tEl('input', 'sp'); o.readOnly = true; o.type = 'text'; const c = tBtn('📋', () => tCopy(o.value, c)); r.append(tEl('b', 'tlab', a), o, c); list.append(r); return o; });
    const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    const calc = async (buf, label) => {
      if (!crypto.subtle) { msg.textContent = 'O navegador só calcula hash em páginas seguras (https).'; return; }
      const id = ++job, res = await Promise.all(ALGS.map(a => crypto.subtle.digest(a, buf)));
      if (id !== job) return; res.forEach((r, i) => { rows[i].value = hex(r); }); msg.textContent = label;
    };
    inp.oninput = () => calc(new TextEncoder().encode(inp.value), inp.value.length + ' caracteres');
    fileIn.onchange = () => { const f = fileIn.files[0]; if (!f) return; f.arrayBuffer().then(b => calc(b, f.name + ' · ' + Math.round(f.size / 1024) + ' KB')); fileIn.value = ''; };
    const foot = tEl('div', 'trow'); foot.append(tBtn('📁 Arquivo', () => fileIn.click()), msg);
    v.append(inp, foot, list, fileIn); inp.oninput();
  } });
}
