/* Sprites em pixel art, desenhados por código.
   Cada sprite é uma grade de letras; cada letra é uma cor da paleta ('.' = transparente).
   Nos itens e lingotes, l/m/d (claro, médio, escuro) vêm da cor do minério, então o mesmo
   desenho serve para cobre, ferro, aço e mithril. */

const SPR = {
  ingot: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....oooooooo....',
    '...ollllllllo...',
    '..ollllllllmmo..',
    '.ommmmmmmmmmddo.',
    '.oddddddddddddo.',
    '.oddddddddddddo.',
    '..oooooooooooo..',
  ],
  helmet: [
    '................',
    '.....oooooo.....',
    '....ollllllo....',
    '...ollllllmmo...',
    '..ollllllmmmdo..',
    '..olllmmmmmmdo..',
    '..ommmmmmmmmdo..',
    '..oooooooooooo..',
    '..omo......omo..',
    '..omo......omo..',
    '..omo......omo..',
    '..omdo....odmo..',
    '...oo......oo...',
  ],
  armor: [
    '................',
    '..ooo......ooo..',
    '.olllo....olllo.',
    '.ollllooooollmo.',
    '.olllllllllllmo.',
    '..olllllllllmo..',
    '...ollllllmmo...',
    '...ollmmmmmmo...',
    '...ommmmmmmmo...',
    '...ommmmmmmdo...',
    '...ommmmmmddo...',
    '...oddddddddo...',
    '....oooooooo....',
  ],
  gloves: [
    '................',
    '................',
    '....o.o.o.......',
    '...olololo......',
    '...olololo......',
    '...olllllo.oo...',
    '...ollllloolo...',
    '...ollllllllo...',
    '...ommmmmmmo....',
    '...ommmmmmo.....',
    '....oddddo......',
    '....ommmmo......',
    '....ommmmo......',
    '....oooooo......',
  ],
  greaves: [
    '................',
    '...oooo..oooo...',
    '...ollo..ollo...',
    '...ollo..ollo...',
    '...olmo..olmo...',
    '...olmo..olmo...',
    '...olmo..olmo...',
    '...olmo..olmo...',
    '...olmmo.olmmo..',
    '...olmmmoolmmmo.',
    '...oddddooddddo.',
    '...oooooooooooo.',
  ],
  sword: [
    '............ooo.',
    '...........olmo.',
    '..........olmo..',
    '.........olmo...',
    '........olmo....',
    '.......olmo.....',
    '......olmo......',
    '..oo.olmo.......',
    '..odoolmo.......',
    '...oddmo........',
    '...obddo........',
    '..obo.odo.......',
    '.obo...oo.......',
    '.oo.............',
  ],
  // Pistola de pederneira (estilo pirata): cano de metal (l/m/d), detalhes dourados (A) e coronha de madeira (b/c)
  pistol: [
    '................',
    '.oooooooooooo...',
    'olllllllllllmo..',
    'ommmmmmmmmmmmdo.',
    '.ooooooooAAddddo',
    '.........oAmmo..',
    '.........obbbo..',
    '........obbbbo..',
    '.......obbbco...',
    '......obbbco....',
    '.....obbcco.....',
    '.....oAcco......',
    '......ooo.......',
  ],
  dagger: [
    '................',
    '................',
    '..........oo....',
    '.........olo....',
    '........olmo....',
    '.......olmo.....',
    '......olmo......',
    '...oo.olo.......',
    '...odoomo.......',
    '....oddo........',
    '....obdo........',
    '...obo.oo.......',
    '...oo...........',
  ],
  longsword: [
    '..............oo',
    '.............olo',
    '............olmo',
    '...........olmo.',
    '..........olmo..',
    '.........olmo...',
    '........olmo....',
    '.......olmo.....',
    '..oo..olmo......',
    '..odoolmo.......',
    '...oddmo........',
    '...obddo........',
    '..obo.odo.......',
    '.obo...oo.......',
    'obo.............',
    'oo..............',
  ],
  waraxe: [
    '................',
    '..ooo..oo..ooo..',
    '.ollloobboolllo.',
    'ollllmobbomllllo',
    'olllmmobbommlllo',
    'ollmmdobbodmmllo',
    '.ommddobbodddmo.',
    '..ooo.obbo.ooo..',
    '......obbo......',
    '......obbo......',
    '......obbo......',
    '......obbo......',
    '......ocbo......',
    '......oooo......',
  ],
  axe: [
    '................',
    '.....oo.oooo....',
    '....obboollllo..',
    '....obbolllllmo.',
    '....obbollllmmdo',
    '....obbolllmmmdo',
    '....obboommmddo.',
    '....obbo.ooooo..',
    '....obbo........',
    '....obbo........',
    '....obbo........',
    '....obbo........',
    '....ocbo........',
    '....oooo........',
  ],
  shield: [
    '................',
    '..oooooooooooo..',
    '..ollllllllllo..',
    '..ollllmmlllmo..',
    '..olllmddmllmo..',
    '..ollllmmllmmo..',
    '..olllllllmmmo..',
    '...olllllmmmo...',
    '...ollllmmmdo...',
    '....ollmmmdo....',
    '.....ommmdo.....',
    '......oddo......',
    '.......oo.......',
  ],
  // Joias: 'k' é a gema (sem gema, vira o metal)
  ring: [
    '................',
    '.......oo.......',
    '......okko......',
    '.....okkkko.....',
    '......okko......',
    '.....oolloo.....',
    '....olo..omo....',
    '...olo....omo...',
    '...ol......mo...',
    '...ol......do...',
    '...om......do...',
    '....omo..odo....',
    '.....oddddo.....',
    '......oooo......',
  ],
  amulet: [
    '..o..........o..',
    '..lo........ol..',
    '...lo......ol...',
    '....mo....om....',
    '.....mo..om.....',
    '......ommo......',
    '.....ollmmo.....',
    '....olkkkkdo....',
    '....okkkkkdo....',
    '....okkkkkdo....',
    '.....okkkdo.....',
    '......okdo......',
    '.......oo.......',
  ],
  // Cajado: madeira (l/m/d) com a gema (k) na ponta
  staff: [
    '............oo..',
    '...........okko.',
    '..........okkkko',
    '..........okkko.',
    '.........olloo..',
    '........olmo....',
    '.......olmo.....',
    '......olmo......',
    '.....olmo.......',
    '....olmo........',
    '...olmo.........',
    '..olmo..........',
    '.oldo...........',
    '.oo.............',
  ],
  // Arco: braço de madeira curvado, empunhadura (b) e corda (r)
  bow: [
    '..oo............',
    '..oloo..........',
    '..r.olo.........',
    '..r..olo........',
    '..r...olo.......',
    '..r...omo.......',
    '..r...obbo......',
    '..r...obbo......',
    '..r...omo.......',
    '..r...odo.......',
    '..r..odo........',
    '..r.odo.........',
    '..oddo..........',
    '..oo............',
  ],
  axe2: [
    '.....oooo.......',
    '....ollllo......',
    '...ollmmmmo.....',
    '...olmmmmdo.....',
    '....ommddo......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....ocbo.......',
    '.....oooo.......',
  ],
  log: [
    '................',
    '................',
    '................',
    '................',
    '...ooooooooooo..',
    '..olllllllllloo.',
    '.ommmmmmmmmmolmo',
    '.omdmmmmmdmmomdo',
    '.ommmmdmmmmmolmo',
    '.odddddddddddoo.',
    '..ooooooooooo...',
  ],
  // Minério bruto: pedra (s/S) com veios do metal (l/m/d)
  raw: [
    '....oooo....',
    '..oossmmoo..',
    '.osslmssddo.',
    'osmlssSsmdso',
    'osSsslmssdSo',
    'oslmsSsslmso',
    '.ossddsSsso.',
    '..oossssoo..',
    '....oooo....',
  ],
  gem: [
    '..oooo..',
    '.olllmo.',
    'ollwlmmo',
    'olmmmmdo',
    '.ommmdo.',
    '..omdo..',
    '...oo...',
  ],
  pick: [
    '...oooooo.......',
    '..ollllllo......',
    '.olmmmmmmmo.....',
    'olmo.obbo.omo...',
    'oo...obbo..oo...',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....ocbo.......',
    '.....oooo.......',
  ],
  hammer: [
    '................',
    '..oooooooooo....',
    '..ollllllllmo...',
    '..ommmmmmmmmo...',
    '..oddddddddddo..',
    '..oooooooooooo..',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....obbo.......',
    '.....ocbo.......',
    '.....oooo.......',
  ],
  anvil: [
    'oooooooooooooooooooo....',
    'olllllllllllllllllllooo.',
    'ommmmmmmmmmmmmmmmmmmmmmo',
    '.oommmmmmmmmmmmmmmmoooo.',
    '...oommmmmmmmmmmmoo.....',
    '.....ommmmmmmmmmo.......',
    '.....odmmmmmmmmdo.......',
    '.....odmmmmmmmmdo.......',
    '....oddmmmmmmmmddo......',
    '...odddddddddddddddo....',
    '..oooooooooooooooooooo..',
  ],
  coin: [
    '..oooo..',
    '.oyyyyo.',
    'oyywyyyo',
    'oywyyyyo',
    'oyyyyyho',
    'oyyyyyho',
    '.ohhhho.',
    '..oooo..',
  ],
};

const BASE_PAL = {
  o: '#15131a', b: '#8a5a33', c: '#5e3b20', y: '#fcd34d', w: '#fff7d6', h: '#b7791f',
  s: '#78716c', S: '#57534e', X: '#f43f5e', Q: '#7f1d1d', W: '#ffffff', a: '#b45309', A: '#fbbf24', v: '#a855f7', O: '#3b0764', r: '#f8fafc', g: '#ef4444', G: '#22d3ee',
};
const NEUTRAL = ['#e5e7eb', '#a1a1aa', '#6b6b75'];   // moldes, sem minério
const ANVIL = ['#9aa0ab', '#5d626d', '#3a3d45'];

/* Variações por nível do molde (o mesmo desenho ganha detalhes):
   2 Reforçado: faixa de bronze no lugar da sombra + rebites
   3 Ornamentado: faixa de ouro + rubi no centro
   4 Magistral: faixa violeta, contorno roxo + gema azul
   5 Mítico: faixa carmesim, contorno vinho + gema branca */
function variant(rows, lvl) {
  if (!lvl || lvl <= 1) return rows;
  const g = rows.map(r => [...r]), trim = { 2: 'a', 3: 'A', 4: 'v', 5: 'X' }[lvl];
  g.forEach((r, y) => r.forEach((c, x) => {
    if (c === 'd') r[x] = trim;
    else if (lvl === 2 && c === 'm' && (x + 2 * y) % 5 === 0) r[x] = 'r';
    else if (lvl >= 4 && c === 'o') r[x] = lvl === 4 ? 'O' : 'Q';
  }));
  if (lvl >= 3) {
    const px = []; g.forEach((r, y) => r.forEach((c, x) => { if (c === 'l' || c === 'm') px.push([x, y]); }));
    if (px.length) {
      const cx = px.reduce((s, p) => s + p[0], 0) / px.length, cy = px.reduce((s, p) => s + p[1], 0) / px.length;
      const [x, y] = px.reduce((b, p) => Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(b[0] - cx, b[1] - cy) ? p : b);
      g[y][x] = { 3: 'g', 4: 'G', 5: 'W' }[lvl];
    }
  }
  return g.map(r => r.join(''));
}

/* Desenha o sprite num canvas e devolve uma imagem (data URL), com cache */
const _sprCache = new Map();
function sprite(name, shades = NEUTRAL, scale = 4, lvl = 1, gem = null, extra = null) {
  const key = name + shades.join() + scale + '/' + lvl + '/' + gem + '/' + (extra ? JSON.stringify(extra) : '');
  if (_sprCache.has(key)) return _sprCache.get(key);
  let rows = variant(SPR[name], lvl);
  // Gema em peças que não têm engaste próprio: 2 pixels no centro da peça
  if (gem && !rows.some(r => r.includes('k'))) {
    const g = rows.map(r => [...r]), px = [];
    g.forEach((r, y) => r.forEach((c, x) => { if ('lmgGW'.includes(c)) px.push([x, y]); }));
    if (px.length) {
      const cx = px.reduce((a, p) => a + p[0], 0) / px.length, cy = px.reduce((a, p) => a + p[1], 0) / px.length;
      const [x, y] = px.reduce((b, p) => Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(b[0] - cx, b[1] - cy) ? p : b);
      g[y][x] = 'k'; if ('lmgGW'.includes(g[y][x + 1] || '')) g[y][x + 1] = 'k';
    }
    rows = g.map(r => r.join(''));
  }
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const pal = { ...BASE_PAL, l: shades[0], m: shades[1], d: shades[2], k: gem || shades[1], ...(extra || {}) };
  const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale;
  const g = cv.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * scale, y * scale, scale, scale); } }));
  const url = cv.toDataURL(); _sprCache.set(key, url); return url;
}
