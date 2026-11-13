/* Sprites em pixel art, desenhados por código (mesma ideia do Combate: grade de pixels com 3 tons e contorno automático).
   Chão e blocos: 16×16 px por casa. Árvores: 16×24 (sobem meia casa). Colonos e animais: 16×16. */

const OUT = '#16131c';
const PAL = {
  wood:   ['#d09a5c', '#9a6432', '#643a1b'],
  stone:  ['#a8a29b', '#878079', '#625c57'],
  leaf:   ['#8fd45e', '#55a83b', '#2f7030'],
  pine:   ['#5fa06a', '#3a7a4c', '#234f36'],
  palm:   ['#b5e06a', '#6fb53b', '#3a7a2c'],
  cactus: ['#a5d88a', '#6aa85a', '#3f7340'],
  red:    ['#ff8585', '#d93a3a', '#8c1d2b'],
  fire:   ['#fff2a0', '#ffa63a', '#e0482a'],
  soil:   ['#86603f', '#6b4a2f', '#553822'],
};
const GROUND_PAL = {
  grass:  ['#74c254', '#5fae48', '#4f983c'],
  dry:    ['#cdb95e', '#b8a34d', '#a08c40'],
  sand:   ['#f0da98', '#dfc680', '#c9ae69'],
  snow:   ['#ffffff', '#e9eff5', '#d2dce6'],
  jungle: ['#56ae44', '#40953a', '#327c30'],
  mud:    ['#84914e', '#6e7c42', '#5a6837'],
  taiga:  ['#86ae66', '#719958', '#5d834a'],
  tundra: ['#b0b690', '#9ca27c', '#878d69'],
  rockf:  ['#8f8982', '#7d7771', '#6b6560'],
};
const SKIN = {
  human: [['#f6cfa4', '#e0a878', '#b97f52'], ['#d9a06b', '#b97a48', '#8a5530'], ['#9a6540', '#7a4a2c', '#55301a']],
  elf:   [['#fdeedd', '#f0d2b8', '#c9a488'], ['#ece6f7', '#cfc4e6', '#a094c2']],
  orc:   [['#9bd06a', '#6fa644', '#477a2c'], ['#86b894', '#5a8a66', '#3a6446']],
};
const HAIR = {
  human: [['#7a4a22', '#4f2c12'], ['#2b2530', '#17131c'], ['#e6c25a', '#b08a2c'], ['#c2552a', '#8a3414']],
  elf:   [['#e8e8f2', '#b4b4c8'], ['#f2d878', '#c4a23c'], ['#a8d8b0', '#6aa07a']],
  orc:   [['#2b2530', '#17131c'], ['#6a2222', '#401010']],
};
const CLOTH = [['#9fd0ff', '#4a8fe0', '#28509c'], ['#ff8585', '#d93a3a', '#8c1d2b'], ['#ffe58a', '#e3a92f', '#99670f'],
               ['#e2a8ff', '#a455e0', '#5f2796'], ['#b9f0d0', '#4fb58a', '#2a7058'], ['#d8d2c8', '#a39c90', '#6e685e']];

function rng32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  p(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; return this; }
  r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); return this; }
  s(x, y, w, h, pal) {                                   // retângulo sombreado: esquerda clara, direita escura
    this.r(x, y, w, h, pal[1]);
    if (w >= 2) this.r(x, y, Math.max(1, Math.round(w / 3)), h, pal[0]);
    if (w >= 3) this.r(x + w - Math.max(1, Math.floor(w / 3)), y, Math.max(1, Math.floor(w / 3)), h, pal[2]);
    return this;
  }
  disc(cx, cy, rad, pal) {                               // disco com luz vindo de cima à esquerda
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > rad * rad) continue;
      const v = (dx + dy) / rad;
      this.p(x, y, v < -.45 ? pal[0] : v < .55 ? pal[1] : pal[2]);
    }
    return this;
  }
  outline() {
    const o = this.d.slice(), { w, h } = this, at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && o[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (!o[y * w + x] && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) this.d[y * w + x] = OUT;
    return this;
  }
  canvas() {
    const c = document.createElement('canvas'); c.width = this.w; c.height = this.h;
    const g = c.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = this.d[y * this.w + x]; if (v) { g.fillStyle = v; g.fillRect(x, y, 1, 1); } }
    return c;
  }
}
function rot(c) { const f = document.createElement('canvas'); f.width = c.height; f.height = c.width; const g = f.getContext('2d'); g.translate(f.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return f; }
function flip(c) { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; }

/* ======================= Chão ======================= */
function groundTile(pal, seed, dots) {
  const p = new Pix(16, 16), r = rng32(seed);
  p.r(0, 0, 16, 16, pal[1]);
  for (let i = 0; i < dots; i++) p.p(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? pal[0] : pal[2]);
  return p.canvas();
}
function waterTile(f) {
  const p = new Pix(16, 16); p.r(0, 0, 16, 16, '#3f7fd0');
  [[1, 3], [9, 6], [4, 10], [11, 13]].forEach(([x, y]) => p.r((x + f * 3) % 14, y, 3, 1, '#7db4ff'));
  [[6, 1], [13, 9], [1, 14]].forEach(([x, y]) => p.r((x + f * 2) % 14, y, 2, 1, '#2f65b5'));
  return p.canvas();
}

/* ======================= Objetos ======================= */
const OBJ_ART = {
  oak(p)    { p.s(7, 17, 2, 6, PAL.wood).disc(7.5, 8, 6, PAL.leaf).disc(4, 12, 3, PAL.leaf).disc(11.5, 12, 3, PAL.leaf); },
  pine(p)   {
    p.s(7, 19, 2, 4, PAL.wood);
    for (let y = 1; y <= 18; y++) {
      const half = .6 + ((y - 1) % 6) * .8 + Math.floor((y - 1) / 6) * 1.1;
      for (let x = Math.round(7.5 - half); x <= Math.round(7.5 + half); x++) p.p(x, y, x < 6 ? PAL.pine[0] : x > 9 ? PAL.pine[2] : PAL.pine[1]);
    }
  },
  palm(p)   {
    for (let y = 8; y < 23; y++) p.r(y < 14 ? 8 : 7, y, 2, 1, y % 3 ? PAL.wood[1] : PAL.wood[2]);
    [[-1, -.25], [1, -.25], [-1, .45], [1, .45], [-.45, -1], [.45, -1]].forEach(([dx, dy], k) => {
      for (let i = 0; i < 7; i++) { const x = 8.5 + dx * i, y = 7 + dy * i + i * i * .06; p.p(x, y, PAL.palm[k % 3]).p(x, y + 1, PAL.palm[2]); }
    });
  },
  cactus(p) { p.s(6, 8, 4, 15, PAL.cactus).s(2, 13, 4, 2, PAL.cactus).s(2, 10, 2, 3, PAL.cactus).s(10, 15, 4, 2, PAL.cactus).s(12, 11, 2, 4, PAL.cactus); },
  shrub(p)  {
    p.r(7, 17, 2, 6, PAL.wood[2]);
    [[6, 16], [5, 15], [4, 13], [9, 16], [10, 14], [11, 12], [8, 14], [8, 12], [7, 11]].forEach(([x, y]) => p.p(x, y, PAL.wood[1]));
    [[4, 12], [11, 11], [7, 10], [9, 13]].forEach(([x, y]) => p.p(x, y, PAL.pine[1]));
  },
  bush(p)   { p.disc(7.5, 10, 5, PAL.leaf); [[5, 8], [9, 9], [7, 12], [11, 11], [4, 11]].forEach(([x, y]) => p.p(x, y, PAL.red[1])); },
  bush0(p)  { p.disc(7.5, 10, 5, PAL.leaf); },
  bed(p)    { p.s(1, 2, 14, 13, PAL.wood).r(2, 3, 12, 4, '#f4f1e6').s(2, 7, 12, 7, PAL.red); },
  rtable(p) {                                            // mesa de pesquisa: livro e frasco
    p.s(1, 7, 14, 4, PAL.wood).r(2, 11, 2, 4, PAL.wood[2]).r(12, 11, 2, 4, PAL.wood[2]);
    p.r(3, 4, 6, 3, '#f4f1e6').r(6, 4, 1, 3, '#b9b3a0').r(4, 5, 1, 1, '#7d7768').r(8, 5, 1, 1, '#7d7768');
    p.disc(11.5, 4.5, 1.6, ['#c9f0ff', '#6fc3ff', '#3a7fd0']).r(11, 1, 1, 2, '#c9f0ff');
  },
  ctable(p) {                                            // bancada: martelo e lâmina
    p.s(1, 7, 14, 4, PAL.wood).r(2, 11, 2, 4, PAL.wood[2]).r(12, 11, 2, 4, PAL.wood[2]).r(1, 7, 14, 1, PAL.wood[0]);
    p.r(2, 3, 5, 2, PAL.stone[1]).p(2, 3, PAL.stone[0]).r(4, 5, 1, 2, PAL.wood[2]);
    p.r(10, 1, 1, 5, '#e6edf5').r(11, 2, 1, 4, '#aab6c6').r(9, 6, 4, 1, '#e3a92f');
  },
  sapling(p) { p.r(7, 9, 1, 6, PAL.wood[1]); [[6, 8], [8, 8], [7, 7], [5, 10], [9, 10], [7, 6]].forEach(([x, y], k) => p.p(x, y, PAL.leaf[k % 2])); },
  torch(p)  { OBJ_ART._torch(p, 0); },
  torch1(p) { OBJ_ART._torch(p, 1); },
  _torch(p, f) { p.s(7, 7, 2, 8, PAL.wood).r(6, 6, 4, 1, PAL.wood[2]).disc(7.5 + f * .4, 3.6, 2, PAL.fire).p(7 + f, 1, PAL.fire[1]).p(7.5, 4, '#fff'); },
  fire(p)   { OBJ_ART._fire(p, 0); },
  fire1(p)  { OBJ_ART._fire(p, 1); },
  _fire(p, f) {
    [[2, 12], [13, 12], [3, 14], [12, 14]].forEach(([x, y]) => p.r(x, y, 2, 2, PAL.stone[1]));
    p.s(4, 12, 9, 2, PAL.wood).s(5, 14, 7, 1, PAL.wood);
    p.disc(7.5 + f * .5, 8.5, 3.4, PAL.fire).p(7 + f, 4, PAL.fire[1]).p(8 - f, 3, PAL.fire[1]).p(7.5, 9, '#fff');
  },
};
// Blocos que ocupam a casa inteira (sem contorno)
const BLOCK_ART = {
  rock(p)  { const r = rng32(11); p.r(0, 0, 16, 16, PAL.stone[1]); for (let i = 0; i < 18; i++) p.p(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? PAL.stone[0] : PAL.stone[2]); },
  ore(p)   { BLOCK_ART.rock(p); [[3, 4], [10, 3], [6, 10], [12, 11]].forEach(([x, y]) => p.r(x, y, 2, 2, '#c9763a').p(x, y, '#f0b070').p(x + 2, y + 1, '#8a4a20')); },
  wallw(p) { p.r(0, 0, 16, 16, PAL.wood[1]); for (let x = 3; x < 16; x += 4) p.r(x, 0, 1, 16, PAL.wood[2]); p.r(0, 0, 16, 3, PAL.wood[0]).r(0, 14, 16, 2, '#3d2412'); },
  walls(p) {
    p.r(0, 0, 16, 16, PAL.stone[1]).r(0, 0, 16, 3, '#c4beb6');
    for (let y = 3; y < 16; y += 4) { p.r(0, y, 16, 1, PAL.stone[2]); for (let x = (y % 8 === 3 ? 3 : 7); x < 16; x += 8) p.r(x, y + 1, 1, 3, PAL.stone[2]); }
    p.r(0, 15, 16, 1, '#3f3a36');
  },
  floor(p) { p.r(0, 0, 16, 16, '#b98a55'); for (let y = 3; y < 16; y += 4) p.r(0, y, 16, 1, '#9c7242'); [[4, 1], [12, 5], [6, 9], [14, 13]].forEach(([x, y]) => p.p(x, y, '#7d5a32')); },
  sfloor(p) {                                            // piso de pedra: lajotas
    p.r(0, 0, 16, 16, '#9a948d');
    for (let y = 7; y < 16; y += 8) { p.r(0, y, 16, 1, '#77716b'); for (let x = (y === 7 ? 7 : 3); x < 16; x += 8) p.r(x, y - 7, 1, 7, '#77716b'); }
    [[2, 2], [11, 4], [5, 11], [13, 13]].forEach(([x, y]) => p.p(x, y, '#b3ada6'));
  },
  dirt(p)  { const r = rng32(23); p.r(0, 0, 16, 16, PAL.soil[1]); for (let i = 0; i < 16; i++) p.p(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? PAL.soil[0] : PAL.soil[2]); },
  door(p)  { p.r(0, 0, 16, 16, PAL.wood[2]).s(2, 1, 12, 15, PAL.wood).r(7, 1, 1, 15, PAL.wood[2]).p(10, 9, '#ffe58a'); },
  farm(p)  { p.r(0, 0, 16, 16, PAL.soil[1]); for (let y = 3; y < 16; y += 4) p.r(0, y, 16, 1, PAL.soil[2]); for (let y = 1; y < 16; y += 4) for (let x = 2; x < 16; x += 4) p.p(x, y, PAL.leaf[0]); },
  farmr(p) { BLOCK_ART.farm(p); for (let y = 0; y < 16; y += 4) for (let x = 2; x < 16; x += 4) p.r(x, y, 1, 3, PAL.leaf[1]).p(x, y, '#ffe58a').p(x - 1, y + 1, PAL.leaf[0]).p(x + 1, y + 1, PAL.leaf[2]); },
};

/* ======================= Colonos e animais ======================= */
function charArt(race, look) {
  const sk = SKIN[race][look.s % SKIN[race].length], hr = HAIR[race][look.h % HAIR[race].length], cl = CLOTH[look.c % CLOTH.length], p = new Pix(16, 16);
  p.s(5, 8, 6, 5, cl);
  if (race === 'orc') p.r(4, 8, 8, 2, cl[1]).p(4, 8, cl[0]).p(11, 8, cl[2]);
  p.r(4, 9, 1, 3, sk[1]).r(11, 9, 1, 3, sk[2]);
  p.r(5, 13, 2, 2, '#4a4458').r(9, 13, 2, 2, '#35303f');
  p.s(5, 3, 6, 5, sk);
  p.r(5, 2, 6, 2, hr[0]).p(10, 2, hr[1]).p(10, 3, hr[1]).p(5, 4, hr[0]).p(10, 4, hr[1]);
  p.p(6, 5, OUT).p(9, 5, OUT);
  if (race === 'elf') p.p(4, 4, sk[0]).p(4, 5, sk[1]).p(11, 4, sk[1]).p(11, 5, sk[2]).p(5, 5, hr[0]).p(5, 6, hr[0]).p(10, 5, hr[1]).p(10, 6, hr[1]);
  if (race === 'orc') p.p(6, 7, '#fff').p(9, 7, '#fff').p(7, 6, sk[2]).p(8, 6, sk[2]);
  return p.outline().canvas();
}
const ANIMAL_ART = {
  quad(p, a, horns) {
    p.s(3, 7, 9, 5, a).s(11, 4, 4, 4, a).r(4, 12, 2, 3, a[2]).r(9, 12, 2, 3, a[2]).p(2, 7, a[2]).p(13, 5, OUT).p(15, 6, a[2]);
    if (horns) p.p(11, 3, '#f4f1e6').p(11, 2, '#f4f1e6').p(13, 3, '#f4f1e6').p(14, 2, '#f4f1e6');
  },
  small(p, a) { p.disc(7, 11.5, 3, a).disc(10.5, 9, 2, a).r(10, 4, 1, 4, a[1]).r(12, 5, 1, 3, a[2]).p(11, 9, OUT).p(4, 11, '#fff'); },
  raider(p, a) {                                         // saqueador: capuz, máscara e lâmina
    const sk = ['#e0a878', '#b97a48', '#8a5530'];
    p.s(5, 8, 6, 5, a).r(4, 9, 1, 3, sk[1]).r(11, 9, 1, 3, sk[2]).r(5, 13, 2, 2, '#35303f').r(9, 13, 2, 2, '#231f2b');
    p.s(5, 3, 6, 5, sk).r(5, 2, 6, 2, a[2]).r(5, 6, 6, 2, a[2]).p(6, 5, '#fff').p(9, 5, '#fff').r(12, 5, 1, 7, '#e6edf5').r(11, 11, 3, 1, '#e3a92f');
  },
  pred(p, a)  { p.s(2, 8, 10, 4, a).s(10, 5, 4, 4, a).r(14, 7, 1, 2, a[2]).p(10, 4, a[1]).p(13, 4, a[2]).r(3, 12, 2, 3, a[2]).r(9, 12, 2, 3, a[2]).r(0, 7, 2, 2, a[1]).p(12, 6, '#ff5d6c'); },
};

/* ======================= Montagem e cache ======================= */
const SPR = { ground: {}, water: [waterTile(0), waterTile(1)], obj: {}, char: {}, animal: {} };
for (const k in GROUND_PAL) SPR.ground[k] = [0, 1, 2, 3].map(v => groundTile(GROUND_PAL[k], k.length * 97 + v * 13 + 5, k === 'rockf' ? 10 : 14));
for (const k in OBJ_ART) if (k[0] !== '_') { const tall = ['oak', 'pine', 'palm', 'cactus', 'shrub'].includes(k), p = new Pix(16, tall ? 24 : 16); OBJ_ART[k](p); SPR.obj[k] = p.outline().canvas(); }
for (const k in BLOCK_ART) { const p = new Pix(16, 16); BLOCK_ART[k](p); SPR.obj[k] = p.canvas(); }
for (const k of ['wallw', 'walls']) SPR.obj[k + 'v'] = rot(SPR.obj[k]);   // paredes na vertical

function charSprite(race, look) {
  const key = race + look.s + look.h + look.c;
  if (!SPR.char[key]) { const r = charArt(race, look); SPR.char[key] = { r, l: flip(r), url: r.toDataURL() }; }
  return SPR.char[key];
}
function animalSprite(id, sp) {
  if (!SPR.animal[id]) { const p = new Pix(16, 16); ANIMAL_ART[sp.shape](p, sp.pal, sp.horns); const r = p.outline().canvas(); SPR.animal[id] = { r, l: flip(r) }; }
  return SPR.animal[id];
}
