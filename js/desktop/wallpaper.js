/* Plano de fundo e janela de Customização */

const WALL_DIR = './assets/wallpapers/';
const WALLPAPER_FILES = [];     // opcional: nomes de arquivos, caso o servidor não liste a pasta (ex.: 'praia.webp')
// GitHub Pages: a pasta é lida pela API do GitHub. Deixe vazio para detectar sozinho (usuario.github.io/repo);
// preencha só se usar domínio próprio ou se o site estiver numa subpasta (ex.: docs).
const GH = { owner: '', repo: '', path: 'assets/wallpapers' };
const IMG_RE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i;
const COLORS = [
  { n: 'Azul celeste',   c: '#87ceeb' },
  { n: 'Vinho',          c: '#6B0F11' },
  { n: 'Meia-noite',     c: '#0B0E19' },
  { n: 'Roxo noturno',   c: '#1E0B36' },
  { n: 'Verde petróleo', c: '#0E2B2E' },
  { n: 'Marrom café',    c: '#33200F' },
];
let IMAGES = [], current = COLORS[0];
let picked = store.get('piratinha-wall', null);          // nome escolhido manualmente (senão, sorteio a cada visita)
if (typeof picked !== 'string') picked = null;
const DEFAULT_WALL = '59_1793395323852_59.png';                // wallpaper de quem abre o site pela primeira vez
if (picked === null && store.get('piratinha-pref', null) === null) { picked = DEFAULT_WALL; store.set('piratinha-wall', picked); }
const imgUrl = n => WALL_DIR + encodeURIComponent(n);
function applyWall() {
  os.style.backgroundColor = current.c || 'var(--wallpaper)';
  os.style.backgroundImage = current.img ? `url("${current.img}")` : 'none';
  const w = wins.get('sys:wall'); if (w && w.render) w.render();
}
async function loadWallpapers() {
  const names = new Set(WALLPAPER_FILES);
  const get = async u => { try { const r = await fetch(u, { cache: 'no-cache' }); return r.ok ? await r.text() : ''; } catch (e) { return ''; } };
  const [json, html] = await Promise.all([get(WALL_DIR + 'wallpapers.json'), get(WALL_DIR)]);
  try { JSON.parse(json).forEach(n => names.add(String(n))); } catch (e) {}
  try {
    new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a[href]').forEach(a => {
      let f = a.getAttribute('href').split(/[?#]/)[0].split('/').pop();
      try { f = decodeURIComponent(f); } catch (e) {}
      if (IMG_RE.test(f)) names.add(f);
    });
  } catch (e) {}
  if (!names.size) {                                     // GitHub Pages: lista a pasta via API do GitHub (com cache de 10 min)
    let { owner, repo } = GH;
    if (!owner && /\.github\.io$/.test(location.hostname)) {
      owner = location.hostname.split('.')[0];
      repo = repo || location.pathname.split('/')[1] || location.hostname;
    }
    if (owner && repo) {
      const cache = store.get('piratinha-wall-cache', null);
      let list = cache && Date.now() - cache.t < 600000 ? cache.names : null;
      if (!list) {
        try {
          const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${GH.path}`);
          if (r.ok) { list = (await r.json()).filter(f => f.type === 'file').map(f => f.name); store.set('piratinha-wall-cache', { t: Date.now(), names: list }); }
        } catch (e) {}
        if (!list && cache) list = cache.names;
      }
      (list || []).forEach(n => names.add(n));
    }
  }
  if (!names.size) {                                     // último recurso (funciona até em file://): imagens numeradas 1.jpg ... 30.webp
    const tests = [];
    for (let i = 1; i <= 30; i++) ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].forEach(x => {
      const n = i + '.' + x;
      tests.push(new Promise(res => { const im = new Image(); im.onload = () => { names.add(n); res(); }; im.onerror = res; im.src = imgUrl(n); }));
    });
    await Promise.all(tests);
  }
  IMAGES = [...names].filter(n => IMG_RE.test(n)).sort().map(n => ({ n, img: imgUrl(n) }));
  const keep = picked && [...IMAGES, ...MY, ...COLORS].find(w => w.n === picked);
  current = keep || (IMAGES.length ? IMAGES[Math.floor(Math.random() * IMAGES.length)] : COLORS[0]);
  applyWall();
}
function initWall() {
  const c = picked && COLORS.find(w => w.n === picked);
  if (c) current = c; else if (picked) current = MY.find(w => w.n === picked) || { n: picked, img: imgUrl(picked) };   // evita "piscar" enquanto a lista carrega
  applyWall(); loadWallpapers();
}
const MY = store.get('piratinha-mywalls', []);                    // wallpapers próprios: [{ n, img (dataURL), my: 1 }]
const saveMY = () => { try { localStorage.setItem('piratinha-mywalls', JSON.stringify(MY)); return true; } catch (e) { return false; } };
const shrink = f => new Promise(res => {
  const r = new FileReader(); r.onerror = () => res(null);
  r.onload = () => { const im = new Image(); im.onerror = () => res(null); im.onload = () => { const k = Math.min(1, 1920 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .85)); }; im.src = r.result; };
  r.readAsDataURL(f);
});
const thumbs = new Map(); let thumbChain = Promise.resolve(), thumbIO;
const makeThumb = url => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onerror = () => res(url); im.onload = () => { const k = Math.min(1, 200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, im.width * k | 0); c.height = Math.max(1, im.height * k | 0); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .7)); }; im.src = url; });
const thumbOf = url => { if (!thumbs.has(url)) thumbs.set(url, thumbChain = thumbChain.then(() => makeThumb(url))); return thumbs.get(url); };
function lazyThumb(c, url) {                       // só gera a miniatura quando o quadrado aparece na tela
  thumbIO = thumbIO || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { thumbIO.unobserve(e.target); thumbOf(e.target.dataset.src).then(d => { e.target.style.backgroundImage = `url("${d}")`; }); } }), { rootMargin: '150px' });
  c.dataset.src = url; thumbIO.observe(c);
}
function downloadWall() { const a = document.createElement('a'); a.href = current.img; a.download = /\.\w+$/.test(current.n) ? current.n : current.n + '.jpg'; document.body.append(a); a.click(); a.remove(); }
function openWall() {
  createWindow({ id: 'sys:wall', title: 'Customização', mk: etile('🎨'), w: 480, h: 720, sys: true, body: (v, w) => {
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const head = (t, mt) => { const h = el('div', 'sysbar', t); if (mt) h.style.marginTop = '14px'; return h; };
    const msg = el('p', 'empty'); msg.style.margin = '6px 2px 0';
    const cell = wl => {
      const c = el('div', 'wc' + (wl.n === current.n ? ' on' : '')); if (wl.c) { c.style.background = wl.c; c.title = wl.n; } else lazyThumb(c, wl.img);
      c.onclick = () => { current = wl; picked = wl.n; store.set('piratinha-wall', picked); applyWall(); };
      if (wl.my) { const x = el('button', 'wx', '✕'); x.title = 'Remover'; x.onclick = e => { e.stopPropagation(); MY.splice(MY.indexOf(wl), 1); saveMY(); if (current === wl) { current = COLORS[0]; picked = current.n; store.set('piratinha-wall', picked); applyWall(); } else w.render(); }; c.append(x); }
      return c;
    };
    w.render = () => {
      v.innerHTML = '';
      v.append(msg);
      const ctl = el('div'); ctl.style.marginTop = '12px';
      ctl.innerHTML = '<div class="srow"><span class="grow">Cor do vidro</span><input type="color" class="gc"></div><div class="srow"><span class="grow">Opacidade do vidro</span><span class="pc"></span><input type="range" min="0" max="100" class="go"></div><div class="srow"><span class="grow">Desfoque do vidro</span><span class="pc"></span><input type="range" min="0" max="100" class="gb"></div><div class="srow"><span class="grow">Cor de destaque</span><input type="color" class="ga"></div>';
      const gc = $('.gc', ctl), go = $('.go', ctl), gb = $('.gb', ctl), ga = $('.ga', ctl), pcs = ctl.querySelectorAll('.pc');
      const pc = () => { pcs[0].textContent = go.value + '%'; pcs[1].textContent = gb.value + '%'; };
      gc.value = pref.c; go.value = Math.round(pref.a * 100); gb.value = Math.round(pref.bl / .4); ga.value = pref.ac; pc();
      gc.oninput = () => { pref.c = gc.value; applyPrefs(); }; go.oninput = () => { pref.a = go.value / 100; applyPrefs(); pc(); };
      gb.oninput = () => { pref.bl = Math.round(gb.value * .4); applyPrefs(); pc(); }; ga.oninput = () => { pref.ac = ga.value; applyPrefs(); };
      v.append(ctl); const sp = el('div'); sp.style.height = '12px'; v.append(sp);
      if (MY.length) { const g1 = el('div', 'wgrid'); MY.forEach(wl => g1.append(cell(wl))); v.append(g1, el('hr', 'wsep')); }   // imagens próprias primeiro, com separador
      const g = el('div', 'wgrid'); [...IMAGES, ...COLORS].forEach(wl => g.append(cell(wl))); v.append(g);
      if (!IMAGES.length) v.append(el('p', 'empty', 'Nenhuma imagem encontrada em assets/wallpapers.'));
      const add = el('label', 'pill', '+ Adicionar wallpaper'); add.style.cssText = 'display:inline-grid;place-items:center;margin-top:10px;cursor:pointer';
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true; add.append(inp); v.append(add);
      inp.onchange = async e => {
        const f = e.target.files[0]; if (!f) return; const img = await shrink(f);
        if (!img) { msg.textContent = 'Não foi possível ler essa imagem.'; return; }
        const it = { n: 'meu-' + Date.now(), img, my: 1 }; MY.push(it);
        if (!saveMY()) { MY.pop(); msg.textContent = 'Sem espaço no navegador para guardar essa imagem (limite de cerca de 5 MB). Tente uma menor.'; return; }
        current = it; picked = it.n; store.set('piratinha-wall', picked); applyWall();
      };
    };
    w.render();
  } });
}
