/* Sprites em pixel art, desenhados por código.
   Cada sprite é montado numa grade de pixels (classe Pix) com retângulos e discos sombreados em 3 tons
   (claro, médio, escuro) e ganha contorno escuro automático no fim.
   Itens: 16 px por casa da mochila (uma espada 1×3 tem 16×48 px). Personagens: 28×28 px. */

const OUT = '#1b1424';
const PAL = {
  steel:   ['#eef3f8', '#aab6c6', '#667286'],
  iron:    ['#c9d0da', '#8791a0', '#4d5665'],
  gold:    ['#ffe58a', '#e3a92f', '#99670f'],
  wood:    ['#d09a5c', '#9a6432', '#643a1b'],
  leather: ['#b06f3d', '#7d4726', '#4f2a14'],
  red:     ['#ff8585', '#d93a3a', '#8c1d2b'],
  green:   ['#a5ee6e', '#55b53b', '#2a7030'],
  purple:  ['#e2a8ff', '#a455e0', '#5f2796'],
  blue:    ['#9fd0ff', '#4a8fe0', '#28509c'],
  stone:   ['#b9b3ad', '#878079', '#56504c'],
  bone:    ['#fbf6e6', '#d6ccb0', '#9a8f76'],
  glass:   ['#eafcff', '#b5dde6', '#7aa7b3'],
  dark:    ['#5a5068', '#3a3148', '#231c30'],
};

class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  p(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; return this; }
  r(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); return this; }
  // retângulo sombreado: esquerda clara, direita escura
  s(x, y, w, h, pal) {
    this.r(x, y, w, h, pal[1]);
    if (w >= 2) this.r(x, y, Math.max(1, Math.round(w / 3)), h, pal[0]);
    if (w >= 3) this.r(x + w - Math.max(1, Math.floor(w / 3)), y, Math.max(1, Math.floor(w / 3)), h, pal[2]);
    return this;
  }
  // disco (ou anel, com raio interno) sombreado com luz vindo de cima à esquerda
  disc(cx, cy, rad, pal, inner = -1) {
    for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      const dx = x - cx, dy = y - cy, q = dx * dx + dy * dy;
      if (q > rad * rad || q < inner * inner) continue;
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

/* ======================= Itens ======================= */
// Cada função desenha o item em pé (orientação 0), numa grade de (largura × 16) por (altura × 16) pixels.
const ITEM_ART = {
  dagger(p) {            // 1×2
    p.r(7, 3, 1, 15, PAL.steel[0]).r(8, 4, 1, 14, PAL.steel[1]);
    p.s(4, 18, 8, 2, PAL.gold).s(7, 20, 2, 6, PAL.leather).s(6, 26, 4, 2, PAL.gold);
  },
  sword(p) {             // 1×3
    p.r(7, 2, 2, 2, PAL.steel[0]);
    p.r(6, 4, 1, 28, PAL.steel[0]).r(7, 4, 1, 28, PAL.steel[1]).r(8, 4, 1, 28, PAL.steel[0]).r(9, 4, 1, 28, PAL.steel[2]);
    p.s(3, 32, 10, 3, PAL.gold).s(7, 35, 2, 8, PAL.leather).p(7, 37, PAL.leather[2]).p(8, 40, PAL.leather[2]);
    p.disc(7.5, 44.5, 2, PAL.gold);
  },
  axe(p) {               // 2×3 (machado de duas lâminas)
    p.s(15, 3, 3, 42, PAL.wood);
    for (let i = 0; i < 18; i++) {
      const ext = Math.round(5 + Math.abs(i - 8.5) * .85), y = 6 + i;
      p.r(15 - ext, y, ext, 1, PAL.steel[1]).p(15 - ext, y, PAL.steel[0]).p(16 - ext, y, PAL.steel[0]).p(14, y, PAL.steel[2]);
      p.r(18, y, ext, 1, PAL.steel[1]).p(17 + ext, y, PAL.steel[0]).p(18, y, PAL.steel[2]).p(16 + ext, y, PAL.steel[2]);
    }
    p.s(14, 13, 5, 4, PAL.iron).s(14, 38, 5, 2, PAL.leather).s(14, 42, 5, 2, PAL.leather);
  },
  spear(p) {             // 1×4
    p.s(7, 14, 2, 47, PAL.wood);
    [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1].forEach((hw, i) => { p.r(8 - hw, 2 + i, hw, 1, PAL.steel[0]); p.r(8, 2 + i, hw, 1, PAL.steel[2]); });
    p.s(6, 14, 4, 3, PAL.red).s(6, 58, 4, 3, PAL.iron);
  },
  mace(p) {              // 2×2
    p.s(14, 15, 4, 14, PAL.wood).s(13, 26, 6, 3, PAL.leather);
    p.disc(15.5, 10.5, 7, PAL.iron);
    [[15.5, 1.5], [15.5, 19.5], [6.5, 10.5], [24.5, 10.5], [9, 4], [22, 4], [9, 17], [22, 17]].forEach(([x, y]) => p.disc(x, y, 1.2, PAL.steel));
    p.disc(13, 8, 1.5, [PAL.steel[0], PAL.steel[0], PAL.steel[1]]);
  },
  wshield(p) {           // 2×2 (escudo redondo de madeira)
    p.disc(15.5, 15.5, 13, PAL.wood).disc(15.5, 15.5, 13, PAL.iron, 11);
    for (let y = 5; y < 27; y++) { p.p(11, y, PAL.wood[2]); p.p(20, y, PAL.wood[2]); }
    p.disc(15.5, 15.5, 4, PAL.steel);
    [[15.5, 4], [15.5, 27], [4, 15.5], [27, 15.5]].forEach(([x, y]) => p.disc(x, y, .8, PAL.steel));
  },
  ishield(p) {           // 2×3 (escudo de ferro)
    for (let y = 4; y < 44; y++) {
      const hw = y < 24 ? 12 : Math.max(1, Math.round(12 - (y - 24) * .6));
      for (let x = 16 - hw; x < 16 + hw; x++) {
        const edge = x < 18 - hw || x >= 14 + hw || y < 6;
        p.p(x, y, edge ? PAL.iron[2] : x < 16 ? PAL.blue[1] : PAL.blue[2]);
      }
    }
    p.s(14, 9, 4, 24, PAL.gold).s(8, 15, 16, 4, PAL.gold);
    p.r(7, 7, 4, 1, PAL.blue[0]).r(7, 8, 1, 4, PAL.blue[0]);
  },
  helmet(p) {            // 2×2
    p.disc(15.5, 15, 11, PAL.steel);
    p.r(4, 16, 24, 12, null);
    p.s(4, 15, 24, 5, PAL.steel).r(9, 16, 15, 2, OUT);
    p.s(4, 20, 6, 8, PAL.steel).s(22, 20, 6, 8, PAL.iron).s(14, 16, 3, 9, PAL.steel);
    p.s(14, 1, 4, 5, PAL.red).r(13, 6, 6, 1, PAL.gold[1]);
  },
  armor(p) {             // 2×3 (peitoral)
    p.s(3, 6, 9, 7, PAL.steel).s(20, 6, 9, 7, PAL.iron);
    p.s(7, 9, 18, 26, PAL.steel);
    p.r(12, 5, 8, 5, null).r(11, 10, 10, 1, PAL.gold[1]);
    p.r(15, 11, 2, 24, PAL.iron[2]);
    for (let y = 20; y < 35; y += 5) p.r(8, y, 16, 1, PAL.iron[2]);
    p.s(9, 35, 14, 3, PAL.leather).r(15, 35, 2, 3, PAL.gold[1]);
    p.s(9, 38, 6, 6, PAL.steel).s(17, 38, 6, 6, PAL.iron);
  },
  whet(p) {              // 1×1 (pedra de amolar)
    p.s(2, 6, 12, 6, PAL.stone).r(2, 6, 12, 1, PAL.stone[0]).r(2, 11, 12, 1, PAL.stone[2]);
    p.p(5, 8, PAL.stone[2]).p(9, 9, PAL.stone[0]).p(11, 8, PAL.stone[2]).p(7, 10, PAL.stone[2]);
  },
  ring(p) {              // 1×1
    p.disc(7.5, 9.5, 4.6, PAL.gold, 2.4);
    p.s(6, 2, 4, 3, PAL.red).p(7, 2, '#fff');
  },
  potion(p) {            // 1×2
    p.s(6, 3, 4, 3, PAL.wood).s(6, 6, 4, 8, PAL.glass);
    p.disc(7.5, 21, 6, PAL.glass).disc(7.5, 22, 4.6, PAL.red);
    p.r(4, 18, 8, 1, PAL.red[0]).p(5, 20, '#fff').p(5, 21, '#fff');
  },
  venom(p) {             // 1×1
    p.s(6, 1, 4, 2, PAL.wood).s(7, 3, 2, 3, PAL.glass);
    p.disc(7.5, 10, 4.4, PAL.green).p(6, 8, '#fff').p(9, 12, PAL.dark[2]).p(8, 10, PAL.dark[2]);
  },
  amulet(p) {            // 1×1
    [[3, 2], [3, 3], [4, 4], [5, 5], [6, 6], [12, 2], [12, 3], [11, 4], [10, 5], [9, 6]].forEach(([x, y]) => p.p(x, y, PAL.gold[1]));
    p.disc(7.5, 10, 3.6, PAL.gold).disc(7.5, 10, 2.2, PAL.purple).p(7, 9, '#fff');
  },
};

function rot90(c) {      // gira 90° no sentido horário
  const o = document.createElement('canvas'); o.width = c.height; o.height = c.width;
  const g = o.getContext('2d'); g.translate(c.height, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0);
  return o;
}

const _itemCache = {};
function itemImg(id, r = 0) {      // data URL do item na orientação pedida (0 = em pé, 1 = deitado)
  const k = id + r;
  if (!_itemCache[k]) {
    const d = ITEMS[id], p = new Pix(d.w * 16, d.h * 16);
    ITEM_ART[id](p);
    let c = p.outline().canvas();
    if (r) c = rot90(c);
    _itemCache[k] = c.toDataURL();
  }
  return _itemCache[k];
}

/* ======================= Personagens ======================= */
// Humanoide genérico de 28×28 px virado para a direita. As opções trocam cores, capacete, traços e armas.
function humanoid(o) {
  const p = new Pix(28, 28), skin = o.skin, body = o.body, legs = o.legs || PAL.leather;
  // braço de trás e escudo
  p.s(7, 13, 2, 7, [body[2], body[2], body[2]]).r(7, 20, 2, 1, skin[1]);
  // pernas e botas
  p.s(9, 21, 3, 4, legs).s(14, 21, 3, 4, legs);
  p.r(9, 24, 4, 2, PAL.dark[2]).r(14, 24, 4, 2, PAL.dark[2]);
  // tronco
  p.s(9, 13, 8, 8, body).r(9, 20, 8, 1, PAL.leather[2]).p(13, 20, PAL.gold[1]);
  if (o.plate) { p.r(9, 16, 8, 1, body[2]); p.r(12, 13, 2, 3, body[0]); }
  if (o.robe) p.s(9, 21, 8, 4, body);
  // cabeça
  p.s(9, 6, 8, 7, skin);
  if (o.skull) { p.r(12, 8, 2, 2, OUT).r(15, 8, 2, 2, OUT).p(14, 10, OUT); for (let x = 10; x < 17; x += 2) p.p(x, 12, OUT); }
  else { p.p(13, 9, OUT).p(16, 9, OUT); if (o.angry) { p.p(12, 8, OUT).p(15, 8, OUT); } p.r(13, 11, 3, 1, skin[2]); }
  if (o.ears) p.r(7, 8, 2, 2, skin[1]).p(6, 7, skin[1]).r(17, 8, 2, 2, skin[2]).p(19, 7, skin[2]);
  if (o.tusks) p.p(12, 12, '#fff').p(16, 12, '#fff');
  if (o.hair) p.r(9, 5, 8, 2, o.hair).r(9, 7, 2, 3, o.hair);
  if (o.helm) { p.s(9, 5, 8, 3, PAL.steel).r(8, 7, 10, 1, PAL.iron[1]).r(14, 8, 1, 3, PAL.iron[1]); if (o.plume) p.r(11, 3, 4, 2, PAL.red[1]).r(10, 4, 1, 2, PAL.red[2]); }
  if (o.hood) p.s(8, 4, 10, 4, o.hood).r(8, 8, 2, 4, o.hood[2]).r(9, 12, 8, 1, o.hood[2]);
  if (o.mask) p.r(11, 10, 6, 3, PAL.dark[2]);
  if (o.horns) p.p(9, 5, PAL.bone[1]).p(8, 4, PAL.bone[0]).p(8, 3, PAL.bone[0]).p(16, 5, PAL.bone[1]).p(17, 4, PAL.bone[0]).p(17, 3, PAL.bone[0]);
  if (o.crown) { p.r(9, 4, 8, 2, PAL.gold[1]); [9, 12, 13, 16].forEach(x => p.p(x, 3, PAL.gold[0])); p.p(12, 5, PAL.red[1]).p(14, 5, PAL.purple[1]); }
  if (o.cape) p.r(6, 13, 2, 10, o.cape[1]).r(5, 16, 1, 8, o.cape[2]);
  // escudo no braço de trás
  if (o.shield) p.disc(7, 17, 3.6, o.shield === 'iron' ? PAL.blue : PAL.wood).p(7, 17, PAL.steel[0]);
  // braço da frente
  p.s(17, 13, 2, 7, body).r(17, 20, 2, 1, skin[1]);
  // arma na mão da frente
  const w = o.weapon;
  if (w === 'sword') p.r(20, 5, 1, 14, PAL.steel[0]).r(21, 6, 1, 13, PAL.steel[1]).r(19, 19, 4, 1, PAL.gold[1]).r(20, 20, 2, 2, PAL.leather[1]);
  if (w === 'dagger') p.r(20, 13, 1, 6, PAL.steel[0]).r(21, 14, 1, 5, PAL.steel[1]).r(19, 19, 4, 1, PAL.gold[1]).r(20, 20, 2, 1, PAL.leather[1]);
  if (w === 'axe') p.r(20, 4, 1, 18, PAL.wood[1]).s(21, 5, 4, 6, PAL.steel).s(17, 6, 3, 4, PAL.steel);
  if (w === 'spear') p.r(20, 5, 1, 20, PAL.wood[1]).r(20, 1, 1, 4, PAL.steel[0]).p(19, 3, PAL.steel[1]).p(21, 3, PAL.steel[1]).p(19, 4, PAL.steel[1]).p(21, 4, PAL.steel[1]);
  if (w === 'mace') p.r(20, 9, 1, 13, PAL.wood[1]).disc(20.5, 6, 2.6, PAL.iron);
  if (w === 'staff') p.r(20, 6, 1, 19, PAL.wood[1]).disc(20.5, 4, 2, PAL.green);
  return p.outline().canvas();
}

const SK = {
  human: ['#ffd9b0', '#eab07e', '#b97d52'], goblin: ['#b6e36a', '#7fb83e', '#4f7f2a'], orc: ['#8fbf6a', '#5f8f45', '#3b6130'],
};
const CHAR_DEF = {
  hero:     { skin: SK.human, body: PAL.blue, legs: PAL.dark, hair: '#8a4b22', weapon: 'sword', shield: 'wood' },
  goblin:   { skin: SK.goblin, body: PAL.leather, ears: true, angry: true, weapon: 'dagger' },
  bandit:   { skin: SK.human, body: PAL.dark, hood: PAL.red, mask: true, weapon: 'dagger', shield: 'wood' },
  skeleton: { skin: PAL.bone, body: PAL.bone, legs: PAL.bone, skull: true, weapon: 'sword' },
  shaman:   { skin: SK.goblin, body: PAL.purple, robe: true, ears: true, hood: PAL.purple, weapon: 'staff' },
  orc:      { skin: SK.orc, body: PAL.leather, tusks: true, angry: true, weapon: 'axe' },
  lancer:   { skin: SK.human, body: PAL.green, helm: true, weapon: 'spear', shield: 'wood' },
  knight:   { skin: SK.human, body: PAL.steel, legs: PAL.iron, helm: true, plume: true, plate: true, weapon: 'sword', shield: 'iron' },
  assassin: { skin: SK.human, body: PAL.dark, legs: PAL.dark, hood: PAL.dark, mask: true, cape: PAL.dark, weapon: 'dagger' },
  warlord:  { skin: SK.orc, body: PAL.iron, plate: true, tusks: true, angry: true, horns: true, weapon: 'mace', shield: 'wood' },
  king:     { skin: PAL.bone, body: PAL.purple, legs: PAL.dark, skull: true, crown: true, cape: PAL.red, plate: true, weapon: 'sword', shield: 'iron' },
};

const _charCache = {};
function charSprite(id) {          // { img: canvas colorido, white: silhueta branca (piscar ao levar golpe) }
  if (!_charCache[id]) {
    const img = humanoid(CHAR_DEF[id]);
    const white = document.createElement('canvas'); white.width = img.width; white.height = img.height;
    const g = white.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, 28, 28);
    _charCache[id] = { img, white };
  }
  return _charCache[id];
}

/* ======================= Cenário da arena ======================= */
function arenaBg(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), R = (x, y, a, b, col) => { g.fillStyle = col; g.fillRect(x, y, a, b); };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ground = h - 26;
  ['#2a1f4e', '#43286a', '#6b2f78', '#a8456f', '#e0705a', '#f5a35c'].forEach((col, i, a) => R(0, Math.round(i * ground / a.length), w, Math.ceil(ground / a.length) + 1, col));
  for (let i = 0; i < 26; i++) R(Math.floor(rnd() * w / 2) * 2, Math.floor(rnd() * ground * .45 / 2) * 2, 2, 2, i % 3 ? '#cdb8ff' : '#fff');
  R(w - 60, 16, 16, 16, '#ffe9a8'); R(w - 62, 18, 20, 12, '#ffe9a8'); R(w - 58, 14, 12, 20, '#ffe9a8');
  for (let x = 0; x < w; x += 2) {                          // montanhas ao fundo e colinas
    const m = ground - 22 - Math.abs(Math.sin(x * .021) * 20 + Math.sin(x * .057 + 1) * 9);
    R(x, Math.round(m / 2) * 2, 2, ground - m + 2, '#4a2a63');
    const k = ground - 6 - Math.abs(Math.sin(x * .034 + 2) * 12);
    R(x, Math.round(k / 2) * 2, 2, ground - k + 2, '#33204d');
  }
  R(0, ground, w, 4, '#5fae4a'); R(0, ground + 4, w, 2, '#3e7d36'); R(0, ground + 6, w, h, '#6b4a33');
  for (let i = 0; i < 90; i++) R(Math.floor(rnd() * w / 2) * 2, ground + 8 + Math.floor(rnd() * 8) * 2, 2, 2, i % 2 ? '#553827' : '#86603f');
  for (let x = 0; x < w; x += 6) if (rnd() < .5) R(x, ground - 2, 2, 2, '#7fd062');
  return c;
}
