/* Colônia: gerenciamento de colônia (protótipo).
   Fluxo: menu → mundo gerado por semente (globo ou mapa), onde cada lugar mostra clima, água, solo, vida selvagem etc.
   → origem e colonos sorteados → mapa local criado a partir dos atributos do lugar escolhido.
   Na colônia, as ordens do menu inferior viram tarefas no mapa; colonos livres pegam a mais próxima.
   Tudo fica salvo no navegador (localStorage); o mundo é refeito pela semente, só a colônia é gravada. */

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const TAU = Math.PI * 2;

/* ======================= Dados (equilíbrio do jogo) ======================= */
// Raças: iguais por enquanto. Para diferenciar, preencha mods (mesmas chaves dos traços: work, move, hp, hunger, dmg).
const RACES = {
  human: { n: 'Humano', mods: {}, names: ['Alda', 'Bento', 'Cora', 'Duarte', 'Elis', 'Fausto', 'Greta', 'Hugo', 'Inês', 'Joaquim', 'Lia', 'Martim', 'Nara', 'Otto', 'Rosa', 'Tomé'] },
  elf:   { n: 'Elfo',   mods: {}, names: ['Aerin', 'Belanor', 'Caelith', 'Daelis', 'Elowen', 'Faelar', 'Galadir', 'Ilyana', 'Lirael', 'Mythis', 'Naeris', 'Sylvar', 'Thalion', 'Vaelis'] },
  orc:   { n: 'Orc',    mods: {}, names: ['Agra', 'Borzug', 'Dagra', 'Ghorz', 'Krusk', 'Lurga', 'Mogra', 'Nazguk', 'Orga', 'Rukh', 'Shagra', 'Thokk', 'Urzog', 'Zagra'] },
};
const SKILLS = { build: 'Construção', mine: 'Mineração', plants: 'Plantas', fight: 'Combate', study: 'Pesquisa' };
// g = grupo (um colono nunca tem dois traços do mesmo grupo)
const TRAITS = {
  hard:   { n: 'Trabalhador', g: 1, mods: { work: 1.2 } },  lazy:  { n: 'Preguiçoso', g: 1, mods: { work: .85 } },
  fast:   { n: 'Veloz',       g: 2, mods: { move: 1.2 } },  slow:  { n: 'Lento',      g: 2, mods: { move: .85 } },
  tough:  { n: 'Resistente',  g: 3, mods: { hp: 1.25 } },   frail: { n: 'Frágil',     g: 3, mods: { hp: .8 } },
  frugal: { n: 'Frugal',      g: 4, mods: { hunger: .75 } }, glut: { n: 'Guloso',     g: 4, mods: { hunger: 1.3 } },
  brute:  { n: 'Brigão',      g: 5, mods: { dmg: 1.25 } },  meek:  { n: 'Pacato',     g: 5, mods: { dmg: .8 } },
};
// n = colonos iniciais (máx. MAX_START) · skill = bônus por perícia · all = bônus em todas
const MAX_START = 3, MAX_COLONISTS = 8;
const ORIGINS = {
  exped:  { n: 'Expedição', d: '3 colonos, bons suprimentos.', c: 3, res: { wood: 40, stone: 20, iron: 5, seed: 4, food: 45 } },
  wreck:  { n: 'Náufragos', d: '3 colonos, quase nada.',       c: 3, res: { wood: 8, food: 15 } },
  exile:  { n: 'Exilados',  d: '2 colonos, +3 Combate.',       c: 2, res: { wood: 20, food: 25 }, skill: { fight: 3 } },
  hermit: { n: 'Eremita',   d: '1 colono, +3 em tudo.',        c: 1, res: { wood: 25, stone: 10, food: 30 }, all: 3 },
};
const RES = { wood: '🪵', stone: '🪨', iron: '⛓', hide: '🟫', seed: '🌰', food: '🍖' };

// Casas do mapa local
const T = { EMPTY: 0, TREE: 1, ROCK: 2, ORE: 3, WATER: 4, BUSH: 5, BUSH0: 6, WALLW: 8, WALLS: 9, FLOOR: 10, DOOR: 11, BED: 12, FIRE: 13, FARM: 14, FARMR: 15, RTABLE: 16, CTABLE: 17, SAPLING: 18, TORCH: 19 };
const TILE = [];
TILE[T.EMPTY] = { n: '', walk: 1 };
TILE[T.TREE]  = { n: 'Árvore' };
TILE[T.ROCK]  = { n: 'Rocha', spr: 'rock' };
TILE[T.ORE]   = { n: 'Minério de ferro', spr: 'ore' };
TILE[T.WATER] = { n: 'Água' };
TILE[T.BUSH]  = { n: 'Arbusto com frutas', spr: 'bush', walk: 1 };
TILE[T.BUSH0] = { n: 'Arbusto', spr: 'bush0', walk: 1 };
TILE[T.WALLW] = { n: 'Parede', spr: 'wallw', built: 1 };
TILE[T.WALLS] = { n: 'Muro', spr: 'walls', built: 1 };
TILE[T.FLOOR] = { n: 'Piso', spr: 'floor', walk: 1, flat: 1, built: 1 };
TILE[T.DOOR]  = { n: 'Porta', spr: 'door', walk: 1, built: 1 };
TILE[T.BED]   = { n: 'Cama', spr: 'bed', walk: 1, built: 1 };
TILE[T.FIRE]  = { n: 'Fogueira', spr: 'fire', built: 1, light: 5.5 };   // light = raio do clarão à noite, em casas
TILE[T.FARM]  = { n: 'Horta', spr: 'farm', walk: 1, flat: 1, built: 1 };
TILE[T.FARMR] = { n: 'Horta madura', spr: 'farmr', walk: 1, flat: 1, built: 1 };
TILE[T.RTABLE] = { n: 'Mesa de pesquisa', spr: 'rtable', built: 1, station: 'research' };
TILE[T.CTABLE] = { n: 'Bancada', spr: 'ctable', built: 1, station: 'craft' };
TILE[T.SAPLING] = { n: 'Muda', spr: 'sapling', walk: 1, built: 1 };
TILE[T.TORCH] = { n: 'Tocha', spr: 'torch', walk: 1, built: 1, light: 3.2 };
// O piso não é uma peça: fica na camada do chão (M.G = base + 2 × piso; base 0 terra · 1 pedra; piso 0 nenhum · 1 madeira · 2 pedra),
// então dá para construir em cima dele e também colocá-lo por baixo de peças prontas.

// Construções. area: box = contorno do retângulo arrastado · fill = retângulo cheio · one = uma casa. work = segundos (1×) · req = pesquisa exigida
// floor = tipo de piso (camada do chão) · soil = só em terra sem piso · dirt = cobre chão de pedra com terra
const BUILD = {
  wallw:    { n: 'Parede',   spr: 'wallw', tile: T.WALLW, cost: { wood: 2 },  work: 3,   area: 'box' },
  walls:    { n: 'Muro',     spr: 'walls', tile: T.WALLS, cost: { stone: 2 }, work: 4,   area: 'box', req: 'masonry' },
  door:     { n: 'Porta',    spr: 'door',  tile: T.DOOR,  cost: { wood: 3 },  work: 3,   area: 'one' },
  floor:    { n: 'Piso',     spr: 'floor', tile: T.FLOOR, cost: { wood: 1 },  work: 1.2, area: 'fill', floor: 1 },
  sfloor:   { n: 'Piso pedra', spr: 'sfloor', tile: T.FLOOR, cost: { stone: 1 }, work: 1.6, area: 'fill', floor: 2 },
  bed:      { n: 'Cama',     spr: 'bed',   tile: T.BED,   cost: { wood: 5 },  work: 4,   area: 'one' },
  fire:     { n: 'Fogueira', spr: 'fire',  tile: T.FIRE,  cost: { wood: 4 },  work: 2,   area: 'one' },
  torch:    { n: 'Tocha',    spr: 'torch', tile: T.TORCH, cost: { wood: 1 },  work: 1,   area: 'one' },
  farm:     { n: 'Horta',    spr: 'farmr', tile: T.FARM,  cost: {},           work: 2.5, area: 'fill', skill: 'plants', soil: 1 },
  sapling:  { n: 'Muda',     spr: 'sapling', tile: T.SAPLING, cost: { seed: 1 }, work: 1.5, area: 'fill', skill: 'plants', soil: 1 },
  dirt:     { n: 'Terra',    spr: 'dirt',  tile: T.EMPTY, cost: {},           work: 2,   area: 'fill', dirt: 1 },
  ctable:   { n: 'Bancada',  spr: 'ctable', tile: T.CTABLE, cost: { wood: 8 },  work: 5, area: 'one' },
  rtable:   { n: 'Pesquisa', spr: 'rtable', tile: T.RTABLE, cost: { wood: 10, stone: 4 }, work: 6, area: 'one' },
  demolish: { n: 'Demolir',  e: '💥',      cost: {},      work: 1.5, area: 'fill' },
};
const ORDERS = [
  { k: 'build',   e: '🔨', n: 'Construir' },
  { k: 'mine',    e: '⛏', n: 'Escavar' },
  { k: 'chop',    e: '🪓', n: 'Cortar' },
  { k: 'harvest', e: '🌾', n: 'Colher' },
  { k: 'attack',  e: '⚔', n: 'Atacar' },
  { k: 'home',    e: '🏠', n: 'Alocar casa' },
  { k: 'cancel',  e: '✖', n: 'Cancelar' },
];
// Pesquisas, feitas na mesa de pesquisa. cost = segundos de trabalho (1×)
const RESEARCH = {
  masonry: { n: 'Alvenaria',   d: 'Libera o muro de pedra.',            cost: 40 },
  agri:    { n: 'Agricultura', d: 'Horta rende +50%.',                  cost: 60 },
  tools:   { n: 'Ferramentas', d: 'Trabalho 20% mais rápido.',          cost: 90 },
  metal:   { n: 'Metalurgia',  d: 'Libera espada e armadura de ferro.', cost: 120 },
};
// Itens feitos na bancada. slot w = arma (dmg soma ao golpe) · a = armadura (def = fração do dano bloqueada) · req = pesquisa exigida
const CRAFTS = {
  wsword: { n: 'Espada de madeira', slot: 'w', dmg: 3,   cost: { wood: 6 },           work: 6 },
  isword: { n: 'Espada de ferro',   slot: 'w', dmg: 9,   cost: { iron: 6, wood: 2 },  work: 10, req: 'metal' },
  larmor: { n: 'Armadura de couro', slot: 'a', def: .25, cost: { hide: 6 },           work: 8 },
  iarmor: { n: 'Armadura de ferro', slot: 'a', def: .45, cost: { iron: 10, hide: 3 }, work: 14, req: 'metal' },
};
const STATION = { research: 'Pesquisando', craft: 'Fabricando' };
const JOB = {   // t = segundos de trabalho (1×) · skill = perícia usada · c = cor da marca no mapa
  mine:    { n: 'Minerando',  t: 3.5, skill: 'mine',   c: '#ffb347' },
  chop:    { n: 'Cortando',   t: 3,   skill: 'plants', c: '#e0a060' },
  harvest: { n: 'Colhendo',   t: 1.5, skill: 'plants', c: '#7fe08a' },
  build:   { n: 'Construindo', skill: 'build',         c: '#7db4ff' },
};

// Tempo e necessidades
const HOUR_S = 6, YEAR = 24;                    // segundos reais por hora de jogo (1×) · dias por ano
const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const MEAL = 3, HUNGER_H = 30, TIRED_H = 18;    // comida por refeição · horas até zerar fome e descanso
const WOOD_PER_TREE = 4, STONE_PER_ROCK = 2, IRON_PER_ORE = 2, FOOD_PER_BUSH = 5, FOOD_PER_FARM = 5, BUSH_REGROW_H = 72, FARM_GROW_H = 72, GROW_MIN_C = 6;
const SEED_BONUS = .35, TREE_GROW_H = 96;      // chance de a árvore cortada dar 2 sementes em vez de 1 · horas até a muda virar árvore
const RAIN_GROW = 1.5, SNOW_SLOW = .8;         // chuva acelera o crescimento · neve deixa o passo mais lento fora de piso
const RAID_FROM_DAY = 6, RAID_CHANCE = .12, RAID_HOURS = 18, AGGRO_RANGE = 5, AGGRO_CALM = 60;   // invasões (chance por dia) e animais agressivos

// Animais. shape = desenho base em sprites.js · hide = couro ao abater · pred = predador (revida e pode atacar à noite) · retal = presa que revida
// aggr = ataca quem chega perto (1 = sempre, 'night' = só à noite) · raider = invasor: atravessa portas, some ao recuar · loot = recursos ao abater
const SPECIES = {
  deer:     { n: 'Cervo',         shape: 'quad',  pal: ['#d6a472', '#a5733f', '#74491f'], horns: 1, hp: 30, meat: 22, hide: 3, spd: 3.6 },
  antelope: { n: 'Antílope',      shape: 'quad',  pal: ['#f0d49a', '#cfa862', '#93703a'], horns: 1, hp: 25, meat: 18, hide: 2, spd: 4 },
  goat:     { n: 'Cabra-montesa', shape: 'quad',  pal: ['#f4f1e6', '#c9c4b6', '#8f897c'], horns: 1, hp: 28, meat: 16, hide: 2, spd: 3.4 },
  boar:     { n: 'Javali',        shape: 'quad',  pal: ['#8a6a55', '#5f4636', '#3b2a20'], hp: 40, meat: 24, hide: 3, spd: 3.2, dmg: 5, retal: 1 },
  capy:     { n: 'Capivara',      shape: 'quad',  pal: ['#c08a55', '#96643a', '#644022'], hp: 22, meat: 16, hide: 2, spd: 2.8 },
  hare:     { n: 'Lebre',         shape: 'small', pal: ['#f0e6d6', '#c9b89c', '#8f7f66'], hp: 8,  meat: 6, hide: 1,  spd: 4.4 },
  wolf:     { n: 'Lobo',          shape: 'pred',  pal: ['#c4c8d0', '#8a909c', '#555a66'], hp: 35, meat: 10, hide: 2, spd: 3.8, dmg: 6,  pred: 1, aggr: 'night' },
  bear:     { n: 'Urso',          shape: 'pred',  pal: ['#a07850', '#734f30', '#48301c'], hp: 70, meat: 30, hide: 5, spd: 3.2, dmg: 10, pred: 1, aggr: 1 },
  jaguar:   { n: 'Onça',          shape: 'pred',  pal: ['#f4cf6a', '#d09a30', '#8a611a'], hp: 45, meat: 12, hide: 3, spd: 4,   dmg: 9,  pred: 1, aggr: 1 },
  hyena:    { n: 'Hiena',         shape: 'pred',  pal: ['#d8c49a', '#a89068', '#6e5c3e'], hp: 32, meat: 10, hide: 2, spd: 3.6, dmg: 6,  pred: 1, aggr: 1 },
  raider:   { n: 'Saqueador',     shape: 'raider', pal: ['#c4484a', '#8c2a30', '#551820'], hp: 55, meat: 0, hide: 0, spd: 3.4, dmg: 8, pred: 1, raider: 1, loot: { iron: 2 } },
};
// Biomas. c = cor no mundo · g = chão local · trees = densidade de árvores · danger = peso dos predadores
const BIOMES = {
  ice:      { n: 'Calota de gelo',     c: [236, 244, 250], g: 'snow',   tree: 'shrub',  trees: .03, herb: ['hare'],                 pred: ['wolf'],         danger: .5 },
  tundra:   { n: 'Tundra',             c: [168, 176, 140], g: 'tundra', tree: 'shrub',  trees: .2,  herb: ['hare', 'goat'],         pred: ['wolf'],         danger: .5 },
  taiga:    { n: 'Taiga',              c: [70, 116, 84],   g: 'taiga',  tree: 'pine',   trees: .9,  herb: ['deer', 'hare'],         pred: ['wolf', 'bear'], danger: .6 },
  mountain: { n: 'Montanha',           c: [136, 130, 124], g: 'taiga',  tree: 'pine',   trees: .35, herb: ['goat'],                 pred: ['bear'],         danger: .5 },
  steppe:   { n: 'Estepe',             c: [176, 172, 104], g: 'dry',    tree: 'shrub',  trees: .2,  herb: ['antelope', 'hare'],     pred: ['wolf'],         danger: .35 },
  plains:   { n: 'Pradaria',           c: [124, 182, 86],  g: 'grass',  tree: 'oak',    trees: .35, herb: ['deer', 'hare', 'boar'], pred: ['wolf'],         danger: .3 },
  forest:   { n: 'Floresta temperada', c: [58, 138, 64],   g: 'grass',  tree: 'oak',    trees: 1,   herb: ['deer', 'boar', 'hare'], pred: ['wolf', 'bear'], danger: .45 },
  swamp:    { n: 'Pântano',            c: [84, 110, 70],   g: 'mud',    tree: 'oak',    trees: .7,  herb: ['capy', 'boar'],         pred: ['jaguar'],       danger: .6 },
  desert:   { n: 'Deserto',            c: [228, 202, 130], g: 'sand',   tree: 'cactus', trees: .25, herb: ['antelope'],             pred: ['hyena'],        danger: .4 },
  savanna:  { n: 'Savana',             c: [198, 180, 92],  g: 'dry',    tree: 'oak',    trees: .3,  herb: ['antelope', 'boar'],     pred: ['hyena'],        danger: .5 },
  jungle:   { n: 'Selva',              c: [38, 118, 52],   g: 'jungle', tree: 'palm',   trees: 1.1, herb: ['capy', 'boar'],         pred: ['jaguar'],       danger: .7 },
};
const WORDS = {
  water:  ['Rara', 'Escassa', 'Moderada', 'Boa', 'Abundante'],
  soil:   ['Estéril', 'Pobre', 'Regular', 'Bom', 'Fértil'],
  veg:    ['Nua', 'Rala', 'Moderada', 'Densa', 'Fechada'],
  wild:   ['Rara', 'Pouca', 'Moderada', 'Farta', 'Abundante'],
  danger: ['Mínimo', 'Baixo', 'Médio', 'Alto', 'Extremo'],
  miner:  ['Raros', 'Poucos', 'Moderados', 'Bons', 'Ricos'],
  relief: ['Plano', 'Ondulado', 'Colinas', 'Serras', 'Montanhoso'],
  diff:   ['Amena', 'Moderada', 'Difícil', 'Dura', 'Brutal'],
};
const word = (k, v) => WORDS[k][Math.min(4, Math.floor(v * 5))];

/* ======================= Estado salvo ======================= */
const SAVE = 'colonia-save-v1';
let S = { seed: 0, col: null };
try { const d = JSON.parse(localStorage.getItem(SAVE)); if (d && typeof d.seed === 'number') S = d; } catch (e) {}
let C = null, M = null;                          // colônia atual (S.col) e mapa local em uso (arrays tipados)
function save() {
  if (C && M) {
    let ts = '', gs = ''; const aux = {};
    for (let i = 0; i < M.T.length; i++) { ts += String.fromCharCode(65 + M.T[i]); gs += M.G[i]; if (M.aux[i]) aux[i] = +M.aux[i].toFixed(3); }
    C.Ts = ts; C.Gs = gs; C.aux = aux;
  }
  try { localStorage.setItem(SAVE, JSON.stringify(S, (k, v) => k === 'act' || k === 'path' ? undefined : v)); } catch (e) {}
}

/* ======================= Ruído ======================= */
const h3 = (x, y, z, s) => {
  let h = (Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x9e3779b1) ^ Math.imul(s, 0x85ebca77)) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};
function noise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let u = x - xi, v = y - yi, w = z - zi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
  const a = (dx, dy, dz) => h3(xi + dx, yi + dy, zi + dz, s);
  return lerp(lerp(lerp(a(0, 0, 0), a(1, 0, 0), u), lerp(a(0, 1, 0), a(1, 1, 0), u), v), lerp(lerp(a(0, 0, 1), a(1, 0, 1), u), lerp(a(0, 1, 1), a(1, 1, 1), u), v), w);
}
function fbm3(x, y, z, oct, s) { let v = 0, a = 1, t = 0; for (let i = 0; i < oct; i++) { v += a * noise3(x, y, z, s + i * 101); t += a; a *= .5; x *= 2; y *= 2; z *= 2; } return v / t; }

/* ======================= Mundo ======================= */
// O ruído é amostrado sobre uma esfera, então o mapa emenda nas bordas e vira globo sem costura.
const WW = 360, WH = 180, GLOBE = 440;
const W = { d: null, tex: null, texCv: null, view: 'globe', lon0: 0, lat0: .3, zoom: 1, cx: WW / 2, cy: WH / 2, sel: null };

function genWorld(seed) {
  const n = WW * WH, elev = new Float32Array(n), moist = new Float32Array(n), river = new Uint8Array(n);
  for (let j = 0; j < WH; j++) {
    const lat = (.5 - (j + .5) / WH) * Math.PI, cl = Math.cos(lat), y = Math.sin(lat);
    for (let i = 0; i < WW; i++) {
      const lon = i / WW * TAU, x = cl * Math.cos(lon), z = cl * Math.sin(lon), k = j * WW + i;
      elev[k] = fbm3(x * 1.7 + 3, y * 1.7 + 3, z * 1.7 + 3, 6, seed);
      moist[k] = fbm3(x * 2.2 + 9, y * 2.2 + 9, z * 2.2 + 9, 4, seed + 50);
      river[k] = Math.abs(fbm3(x * 4 + 5, y * 4 + 5, z * 4 + 5, 3, seed + 90) - .5) < .012 ? 1 : 0;
    }
  }
  const sorted = Float32Array.from(elev).sort();
  W.d = { seed, elev, moist, river, sea: sorted[Math.floor(n * .58)], top: sorted[n - 1] };
  W.sel = null;
  // textura do mundo (uma cor por célula), usada pelo mapa e pelo globo
  const cv = document.createElement('canvas'); cv.width = WW; cv.height = WH;
  const g = cv.getContext('2d'), img = g.createImageData(WW, WH), d = img.data;
  for (let k = 0; k < n; k++) {
    const c = cellInfo(k); let r, gg, b;
    if (c.ocean) {
      const dp = clamp((W.d.sea - elev[k]) / .18);
      if (c.tC < -14) { r = 214; gg = 228; b = 240; } else { r = lerp(78, 22, dp); gg = lerp(138, 52, dp); b = lerp(206, 112, dp); }
    } else {
      const sh = clamp(.82 + c.e * .5 + (elev[k] - elev[k % WW ? k - 1 : k]) * 14, .6, 1.35), col = BIOMES[c.b].c;
      r = col[0] * sh; gg = col[1] * sh; b = col[2] * sh;
      if (c.river) { r = 70; gg = 140; b = 220; }
    }
    d[k * 4] = r; d[k * 4 + 1] = gg; d[k * 4 + 2] = b; d[k * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  W.tex = d; W.texCv = cv;
}

// Tudo o que o painel mostra (e o que o mapa local usa) sai destes mesmos campos: altitude, umidade e latitude.
function cellInfo(k) {
  const w = W.d, i = k % WW, j = (k / WW) | 0, lat = (.5 - (j + .5) / WH) * Math.PI, al = Math.abs(lat) / (Math.PI / 2);
  const isSea = q => w.elev[q] < w.sea, ocean = isSea(k), e = ocean ? 0 : (w.elev[k] - w.sea) / (w.top - w.sea);
  const tC = 30 - 58 * Math.pow(al, 1.4) - e * 28, amp = 3 + 15 * al;
  if (ocean) return { k, ocean, tC, lat };
  const m = clamp((w.moist[k] - .5) * 2.6 + .5 + .15 * Math.cos(6 * lat));
  const nb = { W: j * WW + (i + WW - 1) % WW, E: j * WW + (i + 1) % WW, N: j > 0 ? k - WW : k, S: j < WH - 1 ? k + WW : k };
  const coast = Object.keys(nb).find(d => isSea(nb[d])) || '';
  const river = !!w.river[k] && tC > -6 && e < .5;
  let b;
  if (e > .55) b = 'mountain';
  else if (tC < -12) b = 'ice';
  else if (tC < 0) b = 'tundra';
  else if (tC < 7) b = m > .4 ? 'taiga' : 'tundra';
  else if (tC < 19) b = m < .28 ? 'steppe' : m < .5 ? 'plains' : m > .82 && e < .12 ? 'swamp' : 'forest';
  else b = m < .25 ? 'desert' : m < .5 ? 'savanna' : m > .85 && e < .12 ? 'swamp' : 'jungle';
  const bio = BIOMES[b];
  const water = clamp((m * .75 + (river ? .3 : 0) + (coast ? .08 : 0)) * (tC < -10 ? .5 : 1));
  const soil = clamp(clamp(1 - Math.abs(tC - 17) / 24) * clamp(1 - Math.abs(m - .6) / .65) * (1 - .7 * e) * 1.3 * (b === 'swamp' ? .7 : 1) + (river ? .1 : 0));
  const veg = clamp(m * 1.25 * clamp((tC + 8) / 22) * Math.min(1, .3 + bio.trees));
  const wild = clamp(veg * .65 + water * .35);
  const danger = clamp(bio.danger * (.5 + .7 * wild));
  const miner = clamp(.2 + e * 1.5), relief = clamp(e * 1.8);
  const grow = tC - amp > GROW_MIN_C ? 1 : tC + amp < GROW_MIN_C ? 0 : .5 + Math.asin((tC - GROW_MIN_C) / amp) / Math.PI;
  const harsh = clamp((Math.abs(tC - 16) - 8) / 22);
  const diff = clamp(((1 - water) + (1 - soil) + harsh * 1.5 + danger + (1 - veg) * .5) / 5);
  return { k, ocean, lat, tC, amp, m, e, b, coast, river, water, soil, veg, wild, danger, miner, relief, grow, diff };
}

function fitWorld() {
  const st = $('#wstage'), cv = $('#wcv'), sw = st.clientWidth - 12, sh = st.clientHeight - 12;
  if (sw <= 0 || sh <= 0) return;
  const map = W.view === 'map', w = map ? Math.min(sw, sh * 2) : Math.min(sw, sh), h = map ? w / 2 : w;
  cv.style.width = Math.floor(w) + 'px'; cv.style.height = Math.floor(h) + 'px';
  const cw = map ? WW * 3 : GLOBE, ch = map ? WH * 3 : GLOBE;
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  drawWorld();
}
// Globo: projeção ortográfica. Cada pixel do disco vira (lat, lon) e busca a cor na textura do mundo.
function globeCell(px, py) {
  const R = (GLOBE / 2 - 4) * W.zoom, x = (px - GLOBE / 2) / R, y = -(py - GLOBE / 2) / R, q = x * x + y * y;
  if (q > 1) return -1;
  const z = Math.sqrt(1 - q), cl = Math.cos(W.lat0), sl = Math.sin(W.lat0), y2 = y * cl + z * sl, z2 = -y * sl + z * cl;
  const lon = W.lon0 + Math.atan2(x, z2), i = Math.floor((((lon / TAU) % 1) + 1) % 1 * WW) % WW, j = clamp(Math.floor((.5 - Math.asin(clamp(y2, -1, 1)) / Math.PI) * WH), 0, WH - 1);
  return j * WW + i;
}
// Mapa plano: parte da textura que está na tela (em células), conforme o zoom e o centro.
function mapView() { const sw = WW / W.zoom, sh = WH / W.zoom; return { sw, sh, sx: clamp(W.cx - sw / 2, 0, WW - sw), sy: clamp(W.cy - sh / 2, 0, WH - sh) }; }
function zoomWorld(f, u = .5, v = .5) {                  // u, v = ponto da tela (0 a 1) que fica parado no mapa plano
  const z0 = W.zoom, m = mapView(); W.zoom = clamp(W.zoom * f, 1, 8); if (W.zoom === z0) return;
  W.cx = m.sx + u * m.sw - (u - .5) * WW / W.zoom; W.cy = m.sy + v * m.sh - (v - .5) * WH / W.zoom;
  const n = mapView(); W.cx = n.sx + n.sw / 2; W.cy = n.sy + n.sh / 2;
  drawWorld();
}
function drawWorld() {
  const cv = $('#wcv'), g = cv.getContext('2d'), sel = W.sel;
  let mx = -1, my = -1;
  if (W.view === 'map') {
    const m = mapView();
    g.imageSmoothingEnabled = false; g.drawImage(W.texCv, m.sx, m.sy, m.sw, m.sh, 0, 0, cv.width, cv.height);
    if (sel) { mx = (sel.k % WW + .5 - m.sx) / m.sw * cv.width; my = (((sel.k / WW) | 0) + .5 - m.sy) / m.sh * cv.height; }
  } else {
    const N = GLOBE, R = (N / 2 - 4) * W.zoom, img = g.createImageData(N, N), d = img.data, tx = W.tex;
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const k = globeCell(px + .5, py + .5); if (k < 0) continue;
      const x = (px + .5 - N / 2) / R, y = (py + .5 - N / 2) / R, sh = .4 + .6 * Math.sqrt(Math.max(0, 1 - x * x - y * y)), o = (py * N + px) * 4;
      d[o] = tx[k * 4] * sh; d[o + 1] = tx[k * 4 + 1] * sh; d[o + 2] = tx[k * 4 + 2] * sh; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (sel) {
      const lon = (sel.k % WW + .5) / WW * TAU, lat = sel.lat, dl = lon - W.lon0, x = Math.cos(lat) * Math.sin(dl), y1 = Math.sin(lat), z1 = Math.cos(lat) * Math.cos(dl);
      const cl = Math.cos(W.lat0), sl = Math.sin(W.lat0), y = y1 * cl - z1 * sl, z = y1 * sl + z1 * cl;
      if (z > 0) { mx = N / 2 + x * R; my = N / 2 - y * R; }
    }
  }
  if (mx >= 0) {
    g.lineWidth = 4; g.strokeStyle = '#000'; g.beginPath(); g.arc(mx, my, 8, 0, TAU); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#ffd257'; g.beginPath(); g.arc(mx, my, 8, 0, TAU); g.stroke();
    g.fillStyle = '#ffd257'; g.fillRect(mx - 1, my - 1, 2, 2);
  }
}
const pips = (v, bad) => `<span class="pips${bad ? ' bad' : ''}">${[0, 1, 2, 3, 4].map(i => `<i class="${i < Math.round(v * 5) ? 'on' : ''}"></i>`).join('')}</span>`;
const climate = t => t < -10 ? 'Glacial' : t < 2 ? 'Frio' : t < 12 ? 'Fresco' : t < 22 ? 'Ameno' : t < 28 ? 'Quente' : 'Tórrido';
function latText(lat) { const d = Math.round(Math.abs(lat) * 180 / Math.PI); return d + '°' + (lat >= 0 ? 'N' : 'S'); }
function showSite() {
  const s = W.sel, box = $('#site-body');
  $('#w-go').disabled = !s || s.ocean;
  if (!s) { box.innerHTML = `<h3>Escolha um lugar</h3><p class="where">Clique em terra firme. Arraste para mover, role para dar zoom.</p>`; return; }
  if (s.ocean) { box.innerHTML = `<h3>Oceano</h3><p class="where">${latText(s.lat)} · escolha terra firme.</p>`; return; }
  const bio = BIOMES[s.b], sp = l => l.map(id => SPECIES[id].n).join(', ');
  const row = (e, n, v, sub) => `<div class="row"><span>${e}</span><span>${n}</span><span class="v">${v}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  box.innerHTML = `<h3>${bio.n}</h3><p class="where">${[latText(s.lat), s.coast && 'litoral', s.river && 'rio'].filter(Boolean).join(' · ')}</p>` +
    row('🌡', 'Clima', climate(s.tC), `Média ${Math.round(s.tC)}°C, de ${Math.round(s.tC - s.amp)} a ${Math.round(s.tC + s.amp)}°C`) +
    row('💧', 'Água', pips(s.water) + word('water', s.water), `Chuva: ${Math.round(s.m * 240) * 10} mm/ano`) +
    row('🌱', 'Solo', pips(s.soil) + word('soil', s.soil), `Cultivo: ${Math.round(s.grow * YEAR)} de ${YEAR} dias do ano`) +
    row('🌳', 'Vegetação', pips(s.veg) + word('veg', s.veg)) +
    row('🦌', 'Vida selvagem', pips(s.wild) + word('wild', s.wild), sp(bio.herb)) +
    row('🐺', 'Perigo', pips(s.danger, 1) + word('danger', s.danger), sp(bio.pred)) +
    row('⛏', 'Minerais', pips(s.miner) + word('miner', s.miner)) +
    row('⛰', 'Relevo', word('relief', s.relief)) +
    row('☠', 'Dificuldade', pips(s.diff, 1) + word('diff', s.diff));
}
function newWorld(seed) {
  S.seed = seed >>> 0; $('#w-seed').value = S.seed;
  genWorld(S.seed); showSite(); fitWorld(); save();
}
function openWorld() {
  if (!W.d || W.d.seed !== S.seed) genWorld(S.seed || (S.seed = ri(1, 999999999)));
  $('#w-seed').value = S.seed; $('#w-view').textContent = W.view === 'globe' ? '🗺 Mapa' : '🌍 Globo';
  show('world'); showSite(); fitWorld();
}
{
  const cv = $('#wcv'); let down = null;
  const uv = e => { const r = cv.getBoundingClientRect(); return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height, w: r.width }; };
  const cellAt = e => {
    const { u, v } = uv(e); if (u < 0 || v < 0 || u >= 1 || v >= 1) return -1;
    if (W.view !== 'map') return globeCell(u * GLOBE, v * GLOBE);
    const m = mapView(); return Math.floor(m.sy + v * m.sh) * WW + Math.floor(m.sx + u * m.sw);
  };
  cv.addEventListener('mousedown', e => { down = { x: e.clientX, y: e.clientY, lon: W.lon0, lat: W.lat0, cx: W.cx, cy: W.cy, moved: false }; });
  window.addEventListener('mousemove', e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, w = cv.getBoundingClientRect().width;
    if (Math.abs(dx) + Math.abs(dy) > 4) down.moved = true;
    if (!down.moved) return;
    if (W.view === 'globe') { const R = w / 2 * W.zoom; W.lon0 = down.lon - dx / R; W.lat0 = clamp(down.lat + dy / R, -1.4, 1.4); }
    else { const m = mapView(); W.cx = down.cx - dx / w * m.sw; W.cy = down.cy - dy / w * m.sw; const n = mapView(); W.cx = n.sx + n.sw / 2; W.cy = n.sy + n.sh / 2; }
    drawWorld();
  });
  window.addEventListener('mouseup', e => {
    if (!down) return; const d = down; down = null;
    if (d.moved) return;
    const k = cellAt(e); if (k < 0) return;
    W.sel = cellInfo(k); showSite(); drawWorld();
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); const { u, v } = uv(e); zoomWorld(e.deltaY < 0 ? 1.25 : .8, u, v); }, { passive: false });
  $('#w-zin').onclick = () => zoomWorld(1.5); $('#w-zout').onclick = () => zoomWorld(1 / 1.5);
  $('#w-new').onclick = () => newWorld(ri(1, 999999999));
  $('#w-seed').onchange = e => { const t = e.target.value.trim(); let n = parseInt(t, 10); if (!(n > 0)) { n = 7; for (const ch of t) n = (Math.imul(n, 31) + ch.charCodeAt(0)) >>> 0; } newWorld(n || 1); };
  $('#w-view').onclick = () => { W.view = W.view === 'globe' ? 'map' : 'globe'; $('#w-view').textContent = W.view === 'globe' ? '🗺 Mapa' : '🌍 Globo'; showSite(); fitWorld(); };
  $('#w-back').onclick = () => openMenu();
  $('#w-go').onclick = () => openSetup();
}

/* ======================= Colonos ======================= */
// Único ponto de leitura dos modificadores de raça e traços.
function stat(c, key) { let v = RACES[c.race].mods[key] ?? 1; for (const t of c.traits) v *= TRAITS[t].mods[key] ?? 1; return v; }
const maxHp = c => Math.round(100 * stat(c, 'hp'));
function genColonist(race) {
  race = race || pick(Object.keys(RACES));
  const base = {}, xp = {}, keys = Object.keys(SKILLS);
  for (const k of keys) { base[k] = ri(0, 5); xp[k] = 0; }
  base[pick(keys)] += 3;
  const traits = [], pool = Object.keys(TRAITS);
  while (traits.length < 2) { const t = pick(pool); if (!traits.some(o => TRAITS[o].g === TRAITS[t].g)) traits.push(t); }
  return { id: 0, name: pick(RACES[race].names), race, age: ri(18, 55), traits, base, sk: Object.assign({}, base), xp, look: { s: ri(0, 5), h: ri(0, 11), c: ri(0, 5) }, food: 80, rest: 80, eq: {} };
}
function applyOrigin(c, o) { for (const k in SKILLS) c.sk[k] = clamp(c.base[k] + (o.all || 0) + ((o.skill || {})[k] || 0), 0, 10); }
function cardHTML(c, races) {
  const img = charSprite(c.race, c.look).url;
  return `<div class="top"><img src="${img}" alt=""><div><b class="nm">${c.name}</b><div class="dim">${RACES[c.race].n} · ${c.age} anos</div></div></div>` +
    (races ? `<div class="races">${Object.keys(RACES).map(r => `<button data-race="${r}" class="${r === c.race ? 'on' : ''}">${RACES[r].n}</button>`).join('')}</div>` : '') +
    Object.keys(SKILLS).map(k => `<div class="sk"><span>${SKILLS[k]}</span><i style="--w:${c.sk[k] * 10}%"></i><b>${c.sk[k]}</b></div>`).join('') +
    `<div class="traits">${c.traits.map(t => `<span>${TRAITS[t].n}</span>`).join('')}</div>`;
}

/* ======================= Origem e colonos iniciais ======================= */
const SU = { origin: 'exped', crew: [] };
function openSetup() {
  if (!W.sel || W.sel.ocean) return;
  $('#s-site').textContent = BIOMES[W.sel.b].n + ' · ' + climate(W.sel.tC);
  show('setup'); drawSetup();
}
function drawSetup() {
  const o = ORIGINS[SU.origin], n = Math.min(o.c, MAX_START);
  while (SU.crew.length < n) SU.crew.push(genColonist());
  SU.crew.length = n;
  SU.crew.forEach(c => applyOrigin(c, o));
  const ob = $('#origins'); ob.innerHTML = '';
  for (const id in ORIGINS) {
    const b = el('button', 'ocard' + (id === SU.origin ? ' on' : ''), `<b>${ORIGINS[id].n}</b><small>${ORIGINS[id].d}</small>`);
    b.onclick = () => { SU.origin = id; drawSetup(); }; ob.append(b);
  }
  const cb = $('#crew'); cb.innerHTML = '';
  SU.crew.forEach((c, i) => {
    const d = el('div', 'ccard', cardHTML(c, true)), re = el('button', 'btn small', '🎲 Sortear');
    re.onclick = () => { SU.crew[i] = genColonist(); drawSetup(); };
    d.querySelectorAll('[data-race]').forEach(b => b.onclick = () => { SU.crew[i] = genColonist(b.dataset.race); drawSetup(); });
    d.append(re); cb.append(d);
  });
}
$('#s-reroll').onclick = () => { SU.crew = []; drawSetup(); };
$('#s-back').onclick = () => openWorld();
$('#s-go').onclick = () => startColony();

/* ======================= Mapa local ======================= */
const LW = 72, LH = 48, TS = 16, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const idx = (x, y) => y * LW + x, inb = (x, y) => x >= 0 && y >= 0 && x < LW && y < LH;
const passable = (i, door) => TILE[M.T[i]].walk && (door || M.T[i] !== T.DOOR);   // door = pode cruzar portas (só colonos)
let jobAt = new Map();

function newMap() {
  M = { T: new Uint8Array(LW * LH), G: new Uint8Array(LW * LH), aux: new Float32Array(LW * LH), V: new Uint8Array(LW * LH), fires: [], stations: [] };
  for (let i = 0; i < LW * LH; i++) M.V[i] = Math.floor(h3(i % LW, (i / LW) | 0, 7, C.seed) * 4);
}
function scanFires() {                                       // luzes (fogueiras e tochas) e mesas (pesquisa e bancada)
  M.fires = []; M.stations = [];
  for (let i = 0; i < M.T.length; i++) { if (TILE[M.T[i]].light) M.fires.push(i); else if (TILE[M.T[i]].station) M.stations.push(i); }
}
// O terreno nasce dos atributos do lugar: relevo → rocha, minerais → veios, água → rio/lagoas/mar, vegetação → árvores, solo → arbustos.
function genLocal() {
  const s = C.site, seed = (Math.imul(C.seed, 31) + s.k * 7919) | 0, r = rng32(seed), bio = BIOMES[s.b];
  newMap();
  const n2 = (x, y, f, o, sd) => fbm3(x * f, y * f, .5, o, seed + sd);
  const rockThr = lerp(.7, .47, s.relief), pondThr = s.water > .5 ? .3 + (s.water - .5) * .14 : 0, ph = r() * TAU;
  const treeP = bio.trees * (.2 + .8 * s.veg) * .5;
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const i = idx(x, y); let t = T.EMPTY;
    const edge = { W: x, E: LW - 1 - x, N: y, S: LH - 1 - y }[s.coast];
    if (s.coast && edge < 5 + (n2(x, y, .12, 2, 6) - .5) * 8) t = T.WATER;
    else if (s.river && Math.abs(x - (LW * .28 + Math.sin(y * .13 + ph) * 5 + (n2(3, y, .1, 2, 4) - .5) * 10)) < 1.7) t = T.WATER;
    else if (n2(x, y, .07, 4, 1) > rockThr) t = n2(x, y, .22, 2, 2) > .7 - s.miner * .08 ? T.ORE : T.ROCK;
    else if (n2(x, y, .09, 3, 3) < pondThr) t = T.WATER;
    else if (r() < treeP * (.2 + 1.6 * n2(x, y, .11, 3, 5))) t = T.TREE;
    else if (r() < .006 + s.soil * .03) t = T.BUSH;
    if (Math.abs(x - LW / 2) < 4 && Math.abs(y - LH / 2) < 4) t = T.EMPTY;   // clareira inicial
    M.T[i] = t;
  }
  C.wildN = Math.round(3 + s.wild * 9);
  for (let i = 0; i < C.wildN; i++) spawnAnimal(false);
}
function loadMap() {
  newMap();
  for (let i = 0; i < M.T.length; i++) {
    M.T[i] = C.Ts.charCodeAt(i) - 65; M.G[i] = +C.Gs[i];
    if (M.T[i] === T.FLOOR) { M.T[i] = T.EMPTY; M.G[i] += 2; }   // saves antigos: o piso era uma peça
  }
  for (const i in C.aux) M.aux[i] = C.aux[i];
}

// Busca em largura a partir de (sx, sy) até a primeira casa em que goal() devolve algo. A casa de partida sempre vale.
const _prev = new Int32Array(LW * LH), _q = new Int32Array(LW * LH);
function bfs(sx, sy, goal, door) {
  if (!inb(sx, sy)) return null;
  _prev.fill(-1); const s = idx(sx, sy); _prev[s] = s; let h = 0, t = 0; _q[t++] = s;
  while (h < t) {
    const i = _q[h++], x = i % LW, y = (i / LW) | 0, g = goal(x, y, i);
    if (g) { const path = []; for (let k = i; k !== s; k = _prev[k]) path.push(k); path.reverse(); return { path, g, x, y }; }
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue;
      const ni = idx(nx, ny); if (_prev[ni] !== -1 || !passable(ni, door)) continue;
      _prev[ni] = i; _q[t++] = ni;
    }
  }
  return null;
}
function stepPath(e, dt, spd, door) {
  let left = spd * dt;
  while (left > 0 && e.path.length) {
    const i = e.path[0], tx = i % LW, ty = (i / LW) | 0;
    if (!passable(i, door)) { e.path = []; return; }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
    if (dx) e.dir = dx > 0 ? 1 : -1;
    if (d <= left) { e.x = tx; e.y = ty; left -= d; e.path.shift(); } else { e.x += dx / d * left; e.y += dy / d * left; left = 0; }
  }
}
function edgeTile() {
  for (let n = 0; n < 300; n++) {
    const side = ri(0, 3), x = side < 2 ? (side ? LW - 1 : 0) : ri(0, LW - 1), y = side < 2 ? ri(0, LH - 1) : (side === 2 ? 0 : LH - 1);
    if (passable(idx(x, y), false)) return { x, y };
  }
  return null;
}

// Casa da borda de onde dá para chegar a algum colono (door = quem chega atravessa portas). Sem isso, um ataque poderia nascer ilhado.
function reachEdge(door) {
  const c = C.cols[0]; if (!c) return edgeTile();
  const tx = Math.round(c.x), ty = Math.round(c.y);
  for (let n = 0; n < 12; n++) { const p = edgeTile(); if (p && bfs(p.x, p.y, (x, y) => Math.abs(x - tx) + Math.abs(y - ty) <= 1, door)) return p; }
  const q = bfs(tx, ty, (x, y) => x === 0 || y === 0 || x === LW - 1 || y === LH - 1, door);
  return q ? { x: q.x, y: q.y } : edgeTile();
}

/* ======================= Tarefas ======================= */
const canPay = cost => Object.keys(cost).every(k => C.res[k] >= cost[k]);
const pay = (cost, sign) => { for (const k in cost) C.res[k] -= cost[k] * sign; };
function addJob(x, y, k, b, o) { const j = { x, y, k, b, o, prog: 0, by: 0 };   // o = parede na vertical
  C.jobs.push(j); jobAt.set(idx(x, y), j); return j; }
function removeJob(j, refund) {
  j.dead = true; jobAt.delete(idx(j.x, j.y));
  const n = C.jobs.indexOf(j); if (n >= 0) C.jobs.splice(n, 1);
  if (refund && j.k === 'build') pay(BUILD[j.b].cost, -1);
}
// Marca uma casa com a ordem atual. Devolve 1 se marcou, 0 se não se aplica, -1 se faltou recurso.
function designate(x, y, k, b, o) {
  const i = idx(x, y), t = M.T[i], old = jobAt.get(i);
  if (k === 'cancel') { if (old) removeJob(old, true); return old ? 1 : 0; }
  if (old) return 0;
  if (k === 'mine') { if (t !== T.ROCK && t !== T.ORE) return 0; }
  else if (k === 'chop') { if (t !== T.TREE && t !== T.BUSH && t !== T.BUSH0) return 0; }   // árvores e arbustos
  else if (k === 'harvest') { if (t !== T.BUSH && t !== T.FARMR) return 0; }
  else if (b === 'demolish') { if (!TILE[t].built && !(t === T.EMPTY && M.G[i] >= 2)) return 0; }   // peça ou, sem peça, o piso
  else {
    const B = BUILD[b];
    if (B.req && !C.research.done[B.req]) return 0;
    if (B.floor) { if (M.G[i] >> 1 === B.floor || !(t === T.EMPTY || (TILE[t].built && !TILE[t].flat && t !== T.SAPLING))) return 0; }   // piso: em chão livre ou por baixo de peça pronta
    else if (B.dirt) { if (t !== T.EMPTY || M.G[i] !== 1) return 0; }
    else if (t !== T.EMPTY || (B.soil && M.G[i])) return 0;
    if (!canPay(B.cost)) return -1;
    pay(B.cost, 1);
  }
  addJob(x, y, k, b, o); return 1;
}
const jobSkill = j => j.k === 'build' ? BUILD[j.b].skill || 'build' : JOB[j.k].skill;
const jobTime = j => j.k === 'build' ? BUILD[j.b].work : JOB[j.k].t;
function gainXp(c, k, n) {
  c.xp[k] += n;
  if (c.sk[k] < 10 && c.xp[k] >= 6 + c.sk[k] * 4) { c.xp[k] = 0; c.sk[k]++; c.base[k]++; note(`${c.name}: ${SKILLS[k]} ${c.sk[k]}`, 'good'); }
}
function finishJob(j, c) {
  const i = idx(j.x, j.y), t = M.T[i]; removeJob(j, false); gainXp(c, jobSkill(j), 1);
  if (j.k === 'mine') { M.T[i] = T.EMPTY; M.G[i] = 1; C.res.stone += STONE_PER_ROCK; if (t === T.ORE) C.res.iron += IRON_PER_ORE; }
  else if (j.k === 'chop') {
    M.T[i] = T.EMPTY; M.aux[i] = 0;
    if (t === T.TREE) { C.res.wood += WOOD_PER_TREE; C.res.seed += 1 + (Math.random() < SEED_BONUS ? 1 : 0); } else C.res.wood += 1;
  }
  else if (j.k === 'harvest') {
    if (t === T.BUSH) { M.T[i] = T.BUSH0; C.res.food += FOOD_PER_BUSH; }
    else if (t === T.FARMR) { M.T[i] = T.FARM; C.res.food += Math.round(FOOD_PER_FARM * (C.research.done.agri ? 1.5 : 1)) + Math.floor(c.sk.plants / 3); }
    M.aux[i] = 0;
  } else if (j.b === 'demolish') {
    const b = Object.values(BUILD).find(o => t === T.EMPTY ? o.floor === M.G[i] >> 1 : !o.floor && !o.dirt && (o.tile === t || (t === T.FARMR && o.tile === T.FARM)));
    if (b) for (const k in b.cost) C.res[k] += Math.floor(b.cost[k] / 2);
    if (t === T.EMPTY) M.G[i] &= 1; else M.T[i] = T.EMPTY;
    M.aux[i] = 0; scanFires();
  } else if (BUILD[j.b].floor) M.G[i] = (M.G[i] & 1) + BUILD[j.b].floor * 2;
  else if (BUILD[j.b].dirt) M.G[i] = 0;
  else { M.T[i] = BUILD[j.b].tile; M.aux[i] = j.o ? 1 : 0; scanFires(); }
}
function findJob(c) {
  if (!C.jobs.some(j => !j.by)) return null;
  return bfs(Math.round(c.x), Math.round(c.y), (x, y, i) => {
    for (const [dx, dy] of DIRS) { if (!inb(x + dx, y + dy)) continue; const j = jobAt.get(i + dx + dy * LW); if (j && !j.by) return j; }
    const j = jobAt.get(i);                                   // em cima da própria casa só se o resultado for andável
    return j && !j.by && (j.k !== 'build' || j.b === 'demolish' || TILE[BUILD[j.b].tile].walk) ? j : null;
  }, true);
}

/* ======================= Simulação ======================= */
const hourNow = () => C.t % 24, isNight = () => hourNow() >= 21 || hourNow() < 6;
const yearFrac = () => ((C.t / 24) / YEAR) % 1;
const tempNow = () => C.site.tC + C.site.amp * Math.sin(TAU * (yearFrac() - .125)) + 3 * Math.sin(TAU * (hourNow() - 9) / 24);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
let danger = false;                                            // há animal hostil no mapa (recalculado a cada passo)
const inHome = (x, y) => !!C.home && x >= C.home.x0 && x <= C.home.x1 && y >= C.home.y0 && y <= C.home.y1;
const power = id => CRAFTS[id] ? CRAFTS[id].dmg || CRAFTS[id].def * 20 : 0;
const weapon = c => CRAFTS[c.eq.w] ? CRAFTS[c.eq.w].dmg : 0, armor = c => CRAFTS[c.eq.a] ? CRAFTS[c.eq.a].def : 0;
const workMul = c => stat(c, 'work') * (C.research.done.tools ? 1.2 : 1);

// Entrada única de novos colonos (início, eventos e, no futuro, captura/conversão).
function addColonist(c, x, y, source) {
  c.id = ++C.nid; c.x = x; c.y = y; c.dir = 1; c.hp = maxHp(c); c.path = []; c.act = null; c.cool = 0; c.eq = c.eq || {};
  C.cols.push(c); autoEquip();
  if (source) note(`${c.name} ${source}.`, 'good');
}
// Distribui o que está guardado: o melhor item de cada tipo vai para quem luta melhor e ainda não tem igual ou melhor.
function autoEquip() {
  const order = C.cols.slice().sort((a, b) => b.sk.fight - a.sk.fight);
  for (const slot of ['w', 'a']) for (;;) {
    const best = Object.keys(C.items).filter(id => C.items[id] > 0 && CRAFTS[id].slot === slot).sort((a, b) => power(b) - power(a))[0];
    const c = best && order.find(o => power(o.eq[slot]) < power(best)); if (!c) break;
    if (c.eq[slot]) C.items[c.eq[slot]] = (C.items[c.eq[slot]] || 0) + 1;
    C.items[best]--; c.eq[slot] = best;
  }
}
function spawnAnimal(atEdge, hostile) {
  const s = C.site, bio = BIOMES[s.b], pred = hostile || Math.random() < s.danger * .25, sp = pick(pred ? bio.pred : bio.herb);
  let p = null;
  if (atEdge) p = hostile ? reachEdge(false) : edgeTile();
  else for (let n = 0; n < 200 && !p; n++) { const x = ri(0, LW - 1), y = ri(0, LH - 1); if (passable(idx(x, y), false) && Math.hypot(x - LW / 2, y - LH / 2) > 8) p = { x, y }; }
  if (!p) return;
  C.animals.push({ id: ++C.nid, sp, x: p.x, y: p.y, dir: 1, hp: SPECIES[sp].hp, path: [], wait: Math.random() * 4, cool: 0, re: 0, flee: 0, hostile: !!hostile, hunt: false });
}
function dropAct(c) { if (c.act && c.act.k === 'job') c.act.job.by = 0; c.act = null; c.path = []; }
function hurt(c, d, cause) {
  c.hp -= d; if (d >= 1) c.hit = .2;
  if (c.hp <= 0 && !c.dead) {
    c.dead = true; dropAct(c);
    for (const k in c.eq) if (c.eq[k]) C.items[c.eq[k]] = (C.items[c.eq[k]] || 0) + 1;   // o equipamento volta para o estoque
    c.eq = {}; note(`☠ ${c.name} morreu (${cause}).`, 'bad');
  }
}
function strike(c, a) {
  const sp = SPECIES[a.sp];
  c.cool = .9; c.dir = a.x >= c.x ? 1 : -1; a.hit = .2;
  a.hp -= (6 + c.sk.fight * 1.2 + weapon(c)) * stat(c, 'dmg') * (.7 + Math.random() * .6);
  gainXp(c, 'fight', .5);
  if (a.hp <= 0) { a.dead = true; const loot = Object.assign({ food: sp.meat, hide: sp.hide }, sp.loot); for (const k in loot) C.res[k] += loot[k]; note(`${sp.n} abatido: ` + Object.keys(loot).filter(k => loot[k]).map(k => `+${loot[k]} ${RES[k]}`).join(' ')); }
  else if (sp.pred || sp.retal) a.hostile = true;
  else { a.flee = 4; a.path = []; a.wait = 0; }
}
function nearest(list, e, max, ok) { let best = null, bd = max; for (const o of list) { if (o.dead || !ok(o)) continue; const d = dist(o, e); if (d < bd) { bd = d; best = o; } } return best; }
const stationOpen = s => s === 'research' ? !!C.research.cur : C.craftQ.length > 0;
function findStation(c, cx, cy) {                              // mesa livre e com trabalho pendente
  const busy = new Set(C.cols.filter(o => o !== c && o.act && o.act.k === 'station').map(o => o.act.i));
  const open = M.stations.filter(i => !busy.has(i) && stationOpen(TILE[M.T[i]].station));
  if (!open.length) return null;
  return bfs(cx, cy, (x, y, i) => {
    for (const [dx, dy] of DIRS) { const n = i + dx + dy * LW; if (inb(x + dx, y + dy) && open.includes(n)) return { i: n, s: TILE[M.T[n]].station }; }
    return null;
  }, true);
}

function updColonist(c, dt) {
  const dh = dt / HOUR_S, asleep = c.act && c.act.k === 'sleep' && !c.path.length;
  c.food = Math.max(0, c.food - dh * 100 / HUNGER_H * stat(c, 'hunger'));
  if (!asleep) c.rest = Math.max(0, c.rest - dh * 100 / TIRED_H);
  if (c.food <= 0) hurt(c, dh * 3, 'fome');
  else if (c.hp < maxHp(c)) c.hp = Math.min(maxHp(c), c.hp + dh * (asleep ? 5 : 1));
  if (c.dead) return;
  c.cool = Math.max(0, c.cool - dt); c.hit = Math.max(0, (c.hit || 0) - dt);
  const cx = Math.round(c.x), cy = Math.round(c.y);

  // reflexo: bate em quem estiver ao alcance; se for hostil, larga tudo e luta
  const foe = nearest(C.animals, c, 1.6, a => a.hostile || a.hunt);
  if (foe) {
    if (c.cool <= 0) strike(c, foe);
    if (foe.hostile && !(c.act && c.act.k === 'hunt')) { dropAct(c); c.fighting = .6; }
  }
  c.fighting = Math.max(0, (c.fighting || 0) - dt);
  if (c.fighting > 0) return;

  const a = c.act;
  if (a && a.k === 'hunt') {                                   // persegue: refaz o caminho de tempos em tempos
    const t = C.animals.find(o => o.id === a.id && !o.dead);
    if (!t || !t.hunt) { dropAct(c); return; }
    a.re -= dt;
    if (dist(c, t) <= 1.5) c.path = [];
    else if (a.re <= 0) {
      a.re = .4; const tx = Math.round(t.x), ty = Math.round(t.y), p = bfs(cx, cy, (x, y) => Math.abs(x - tx) + Math.abs(y - ty) <= 1, true);
      if (p) c.path = p.path; else { t.hunt = false; dropAct(c); note(`${SPECIES[t.sp].n}: alvo fora de alcance.`); return; }
    }
  }
  // perigo: quem está fora da casa larga o serviço e vai se abrigar (caçar e comer não são interrompidos)
  if (danger && C.home && a && (a.k === 'job' || a.k === 'station' || a.k === 'sleep') && !inHome(cx, cy)) { dropAct(c); c.think = 0; return; }
  if (c.path.length) { stepPath(c, dt, 4 * stat(c, 'move') * (C.weather.k === 'snow' && M.G[idx(cx, cy)] < 2 ? SNOW_SLOW : 1), true); return; }
  if (!a) { decide(c, dt, cx, cy); return; }
  if (a.k === 'shelter') { if (!danger) c.act = null; }
  else if (a.k === 'sleep') {
    const bed = M.T[idx(cx, cy)] === T.BED;
    c.rest = Math.min(100, c.rest + dh * 100 / (bed ? 7 : 9.5));
    if (c.rest >= 100 || (c.rest > 70 && !isNight()) || (c.food < 12 && C.res.food >= MEAL)) c.act = null;
  } else if (a.k === 'eat') { a.t -= dt; if (a.t <= 0) { c.food = 100; c.act = null; } }
  else if (a.k === 'job') {
    const j = a.job;
    if (j.dead || Math.abs(cx - j.x) + Math.abs(cy - j.y) > 1) { dropAct(c); return; }
    c.dir = j.x >= c.x ? 1 : -1;
    j.prog += dt * (.6 + c.sk[jobSkill(j)] * .1) * workMul(c) / jobTime(j);
    if (j.prog >= 1) { finishJob(j, c); c.act = null; }
  } else if (a.k === 'station') {                              // pesquisa ou fabricação, ao lado da mesa
    const sx = a.i % LW, sy = (a.i / LW) | 0;
    if (TILE[M.T[a.i]].station !== a.s || !stationOpen(a.s) || Math.abs(cx - sx) + Math.abs(cy - sy) > 1) { dropAct(c); return; }
    c.dir = sx >= c.x ? 1 : -1;
    if (a.s === 'research') {
      const R = C.research, id = R.cur;
      R.prog[id] = (R.prog[id] || 0) + dt * (.6 + c.sk.study * .1) * workMul(c); gainXp(c, 'study', dt / 4);
      if (R.prog[id] >= RESEARCH[id].cost) { R.done[id] = 1; R.cur = null; c.act = null; note(`🔬 ${RESEARCH[id].n} concluída.`, 'good'); drawOrders(); }
    } else {
      const q = C.craftQ[0];
      q.prog += dt * (.6 + c.sk.build * .1) * workMul(c) / CRAFTS[q.id].work;
      if (q.prog >= 1) { C.craftQ.shift(); C.items[q.id] = (C.items[q.id] || 0) + 1; gainXp(c, 'build', 1); c.act = null; autoEquip(); note(`🛠 ${CRAFTS[q.id].n} pronta.`, 'good'); }
    }
  }
}
// Ordem de prioridade: caçar alvos marcados → abrigar-se → comer → dormir → tarefas do mapa → mesas → voltar para casa.
function decide(c, dt, cx, cy) {
  c.think = (c.think || 0) - dt; if (c.think > 0) return; c.think = .3 + Math.random() * .25;
  const prey = nearest(C.animals, c, 1e9, o => o.hunt);
  if (prey) { c.act = { k: 'hunt', id: prey.id, re: 0 }; return; }
  const home = !!C.home, goHome = () => home && !inHome(cx, cy) ? bfs(cx, cy, (x, y) => inHome(x, y), true) : null;
  if (danger && home) { const p = goHome(); if (p) c.path = p.path; c.act = { k: 'shelter' }; return; }
  if (c.food < 35 && C.res.food >= MEAL) {                     // come em casa, se houver casa
    C.res.food -= MEAL; c.act = { k: 'eat', t: 1.5 }; const p = goHome(); if (p) c.path = p.path; return;
  }
  if (c.rest < 20 || (isNight() && c.rest < 75)) {             // cama da casa → qualquer cama → chão da casa → onde estiver
    const taken = new Set(C.cols.filter(o => o !== c && o.act && o.act.k === 'sleep').map(o => o.act.i));
    const p = (home && bfs(cx, cy, (x, y, i) => M.T[i] === T.BED && inHome(x, y) && !taken.has(i), true))
      || bfs(cx, cy, (x, y, i) => M.T[i] === T.BED && !taken.has(i), true)
      || (home && bfs(cx, cy, (x, y, i) => inHome(x, y) && M.T[i] === T.EMPTY && !taken.has(i), true));
    c.act = { k: 'sleep', i: p ? idx(p.x, p.y) : idx(cx, cy) }; if (p) c.path = p.path;
    return;
  }
  const f = findJob(c);
  if (f) { f.g.by = c.id; c.act = { k: 'job', job: f.g }; c.path = f.path; return; }
  const st = M.stations.length && findStation(c, cx, cy);
  if (st) { c.act = { k: 'station', i: st.g.i, s: st.g.s }; c.path = st.path; return; }
  if (Math.random() < .12) {                                   // à toa: volta para casa ou dá uma volta por perto
    const p = goHome(); if (p) { c.path = p.path; return; }
    const tx = cx + ri(-2, 2), ty = cy + ri(-2, 2);
    if (inb(tx, ty) && (!home || inHome(tx, ty))) { const q = bfs(cx, cy, (x, y) => x === tx && y === ty, true); if (q && q.path.length < 6) c.path = q.path; }
  }
}
function updAnimal(a, dt) {
  const sp = SPECIES[a.sp], ax = Math.round(a.x), ay = Math.round(a.y), dr = !!sp.raider;   // dr = atravessa portas
  if (dr && (!a.hostile || C.t > a.until)) {                    // invasor sem alvo alcançável ou fim do prazo: vai embora
    a.dead = true; if (!C.animals.some(o => o !== a && !o.dead && SPECIES[o.sp].raider)) note('Os saqueadores recuaram.', 'good'); return;
  }
  a.cool = Math.max(0, a.cool - dt); a.hit = Math.max(0, (a.hit || 0) - dt); a.flee = Math.max(0, a.flee - dt);
  if (a.hostile) {
    const t = nearest(C.cols, a, 1e9, () => true);
    if (!t) { a.hostile = false; return; }
    a.re -= dt;
    if (dist(a, t) <= 1.5) { a.path = []; a.dir = t.x >= a.x ? 1 : -1; if (a.cool <= 0) { a.cool = 1.2; hurt(t, sp.dmg * (.7 + Math.random() * .6) * (1 - armor(t)), sp.n.toLowerCase()); } }
    else if (a.re <= 0) {
      a.re = .5; const tx = Math.round(t.x), ty = Math.round(t.y), p = bfs(ax, ay, (x, y) => Math.abs(x - tx) + Math.abs(y - ty) <= 1, dr);
      a.path = p ? p.path : []; a.lost = p ? 0 : (a.lost || 0) + 1;
      if (a.lost > 16) { a.hostile = false; a.lost = 0; a.calm = AGGRO_CALM; }           // não alcança ninguém (muros e portas): desiste
    }
    stepPath(a, dt, sp.spd * 1.05, dr); return;
  }
  a.calm = Math.max(0, (a.calm || 0) - dt);                       // agressivos: partem para cima de quem chega perto
  if (sp.aggr && !a.calm && (sp.aggr !== 'night' || isNight()) && nearest(C.cols, a, AGGRO_RANGE, () => true)) { a.hostile = true; a.path = []; note(`${sp.n} atacando!`, 'bad'); return; }
  if (a.path.length) { stepPath(a, dt, a.flee > 0 ? Math.min(sp.spd * 1.1, 3.3) : sp.spd * .4, false); return; }
  a.wait -= dt; if (a.wait > 0) return;
  a.wait = a.flee > 0 ? 0 : 2 + Math.random() * 6;
  const R = a.flee > 0 ? 10 : 5, tx = clamp(ax + ri(-R, R), 0, LW - 1), ty = clamp(ay + ri(-R, R), 0, LH - 1);
  if (!passable(idx(tx, ty), false)) return;
  const p = bfs(ax, ay, (x, y) => x === tx && y === ty, false);
  if (p && p.path.length < 40) a.path = p.path;
}
function hourTick() {
  const warm = tempNow() > GROW_MIN_C, h = Math.floor(C.t) % 24, day = Math.floor(C.t / 24) + 1, s = C.site, wet = C.weather.k === 'rain' ? RAIN_GROW : 1;
  for (let i = 0; i < M.T.length; i++) {
    const t = M.T[i];
    if (t === T.SAPLING && warm) { M.aux[i] += wet / TREE_GROW_H; if (M.aux[i] >= 1) { M.T[i] = T.TREE; M.aux[i] = 0; } }
    else if (t === T.BUSH0 && warm) { M.aux[i] += wet / BUSH_REGROW_H; if (M.aux[i] >= 1) { M.T[i] = T.BUSH; M.aux[i] = 0; } }
    else if (t === T.FARM && warm) { M.aux[i] += (.35 + s.soil) * wet / FARM_GROW_H; if (M.aux[i] >= 1) { M.T[i] = T.FARMR; M.aux[i] = 0; if (!jobAt.has(i)) addJob(i % LW, (i / LW) | 0, 'harvest'); } }
  }
  if (h === 6 && C.animals.length < C.wildN) spawnAnimal(true);
  if (C.t >= C.weather.until) {                                 // tempo: a chance de chuva vem da umidade do lugar; abaixo de 1°C cai neve
    const wetNow = C.weather.k === 'clear' && Math.random() < .12 + .5 * s.m;
    C.weather = wetNow ? { k: tempNow() < 1 ? 'snow' : 'rain', until: C.t + ri(3, 10) } : { k: 'clear', until: C.t + ri(6, 24) };
    if (wetNow) note(C.weather.k === 'snow' ? '❄ Começou a nevar.' : '🌧 Começou a chover.');
  }
  if (h === 13 && day >= RAID_FROM_DAY && Math.random() < RAID_CHANCE) raid(Math.min(5, 1 + Math.floor(day / 10) + (C.cols.length > 3 ? 1 : 0)));
  if (h === 8 && C.res.food < MEAL * C.cols.length * 2) note('🍖 A comida está acabando.', 'bad');
  if (h === 10 && day > 3 && C.cols.length < MAX_COLONISTS && Math.random() < .14) wandererEvent();
  if (h === 22 && day > 2 && Math.random() < s.danger * .4) {
    const n = 1 + (Math.random() < s.danger ? 1 : 0) + (day > 12 ? 1 : 0);
    for (let i = 0; i < n; i++) spawnAnimal(true, true);
    note('🐺 Predadores famintos se aproximam!', 'bad');
  }
  if (h % 3 === 0) save();
}
function raid(n) {                                             // invasão: saqueadores entram juntos por uma borda
  const p = reachEdge(true); if (!p) return;
  for (let i = 0; i < n; i++) C.animals.push({ id: ++C.nid, sp: 'raider', x: p.x, y: p.y, dir: 1, hp: SPECIES.raider.hp, path: [], wait: 0, cool: i * .3, re: i * .15, flee: 0, hostile: true, hunt: false, until: C.t + RAID_HOURS });
  note(`⚔ Invasão: ${n} saqueador${n > 1 ? 'es' : ''}!`, 'bad');
}
function wandererEvent() {
  const c = genColonist();
  modal('Viajante', `<p>${c.name} pede para ficar.</p><div class="ccard">${cardHTML(c)}</div>`, [
    { t: 'Aceitar', cls: 'primary', fn: () => { const p = edgeTile() || { x: LW >> 1, y: LH >> 1 }; addColonist(c, p.x, p.y, 'juntou-se à colônia'); } },
    { t: 'Recusar' },
  ]);
}
function tick(dt) {
  const h0 = Math.floor(C.t); C.t += dt / HOUR_S;
  danger = C.animals.some(a => a.hostile);
  for (const c of C.cols) updColonist(c, dt);
  for (const a of C.animals) updAnimal(a, dt);
  if (C.animals.some(a => a.dead)) C.animals = C.animals.filter(a => !a.dead);
  if (C.cols.some(c => c.dead)) {
    C.cols = C.cols.filter(c => !c.dead); autoEquip();
    if (!C.cols.length) {
      const d = Math.floor(C.t / 24) + 1; running = false; S.col = null; C = null; M = null; save();
      modal('A colônia caiu', `<p>Ninguém sobreviveu. Durou ${d} dia${d > 1 ? 's' : ''}.</p>`, [{ t: 'Menu', cls: 'primary', fn: openMenu }]); return;
    }
  }
  if (Math.floor(C.t) !== h0) hourTick();
}

/* ======================= Ordens e entrada ======================= */
const cv = $('#cv'), ctx = cv.getContext('2d'), night = document.createElement('canvas'), nctx = night.getContext('2d');
let tool = null, drag = null, pan = null, sel = 0, speed = 1, running = false, last = 0, acc = 0, hudT = 0, hoverTile = null;
const keys = new Set();

function setTool(k, b) {
  tool = k ? { k, b } : null; drag = null;
  if (k === 'build' && !b) tool = null;
  $('#buildmenu').hidden = k !== 'build';
  cv.classList.toggle('tool', !!tool);
  drawOrders();
}
function drawOrders() {
  const nav = $('#orders'); nav.innerHTML = '';
  ORDERS.forEach((o, n) => {
    const on = (tool && tool.k === o.k) || (o.k === 'build' && !$('#buildmenu').hidden);
    const b = el('button', on ? 'on' : '', `<kbd>${n + 1}</kbd><span class="e">${o.e}</span><span>${o.n}</span>`);
    b.onclick = () => orderClick(o.k); nav.append(b);
  });
  const bm = $('#buildmenu'); bm.innerHTML = '';
  for (const id in BUILD) {
    const b = BUILD[id], locked = b.req && !(C && C.research.done[b.req]);
    const cost = locked ? '🔒 ' + RESEARCH[b.req].n : Object.keys(b.cost).map(k => b.cost[k] + RES[k]).join(' ') || (id === 'demolish' ? 'devolve ½' : 'grátis');
    const bt = el('button', tool && tool.b === id ? 'on' : '', (b.e ? `<span style="font-size:24px;line-height:32px">${b.e}</span>` : `<img src="${SPR.obj[b.spr].toDataURL()}" alt="">`) + `<span>${b.n}</span><small>${cost}</small>`);
    bt.disabled = !!locked; bt.onclick = () => setTool('build', id); bm.append(bt);
  }
}
function orderClick(k) {
  if (k === 'build') { const open = !$('#buildmenu').hidden; tool = null; drag = null; cv.classList.remove('tool'); $('#buildmenu').hidden = open; drawOrders(); return; }
  setTool(tool && tool.k === k ? null : k);
}
// Painéis das mesas (o jogo fica pausado enquanto estão abertos)
function openResearch() {
  const R = C.research;
  modal('Pesquisa', Object.keys(RESEARCH).map(id => {
    const r = RESEARCH[id], done = R.done[id], p = done ? 1 : clamp((R.prog[id] || 0) / r.cost);
    return `<div class="prow${R.cur === id ? ' on' : ''}"><div><b>${r.n}</b><small>${r.d}</small><i class="pbar" style="--w:${p * 100}%"></i></div>` +
      (done ? '<span class="ok">✔</span>' : `<button class="btn small" data-id="${id}">${R.cur === id ? 'Parar' : 'Pesquisar'}</button>`) + '</div>';
  }).join(''), [{ t: 'Fechar' }]);
  $('#mo-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { R.cur = R.cur === b.dataset.id ? null : b.dataset.id; openResearch(); });
}
function openCraft() {
  const costText = c => Object.keys(c).map(k => c[k] + RES[k]).join(' '), stock = Object.keys(C.items).filter(id => C.items[id] > 0);
  modal('Bancada', Object.keys(CRAFTS).map(id => {
    const r = CRAFTS[id], locked = r.req && !C.research.done[r.req];
    return `<div class="prow"><div><b>${r.n}</b><small>${r.slot === 'w' ? `+${r.dmg} de dano` : `−${Math.round(r.def * 100)}% de dano recebido`} · ${costText(r.cost)}</small></div>` +
      (locked ? `<span class="dim">🔒 ${RESEARCH[r.req].n}</span>` : `<button class="btn small" data-id="${id}"${canPay(r.cost) ? '' : ' disabled'}>Fazer</button>`) + '</div>';
  }).join('') +
    `<p class="dim">Fila: ${C.craftQ.length ? C.craftQ.map((q, n) => `<button class="qi" data-q="${n}" title="Tirar da fila">${CRAFTS[q.id].n} ✖</button>`).join(' ') : 'vazia'}</p>` +
    (stock.length ? `<p class="dim">Guardado: ${stock.map(id => `${C.items[id]}× ${CRAFTS[id].n}`).join(', ')}</p>` : ''), [{ t: 'Fechar' }]);
  $('#mo-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id; pay(CRAFTS[id].cost, 1); C.craftQ.push({ id, prog: 0 }); openCraft(); });
  $('#mo-body').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const q = C.craftQ.splice(+b.dataset.q, 1)[0]; pay(CRAFTS[q.id].cost, -1); openCraft(); });
}
function tileAt(e) {
  const r = cv.getBoundingClientRect(), ts = TS * C.cam.z;
  return { x: Math.floor(C.cam.x + (e.clientX - r.left - r.width / 2) / ts), y: Math.floor(C.cam.y + (e.clientY - r.top - r.height / 2) / ts) };
}
function applyTool(d) {
  const x0 = clamp(Math.min(d.x0, d.x1), 0, LW - 1), x1 = clamp(Math.max(d.x0, d.x1), 0, LW - 1), y0 = clamp(Math.min(d.y0, d.y1), 0, LH - 1), y1 = clamp(Math.max(d.y0, d.y1), 0, LH - 1);
  const k = tool.k, box = k === 'build' && BUILD[tool.b].area === 'box'; let n = 0, short = false;
  if (k === 'home') { C.home = { x0, y0, x1, y1 }; setTool(null); note('🏠 Casa definida.', 'good'); return; }
  if (k === 'attack' || k === 'cancel') for (const a of C.animals) {
    const ax = Math.round(a.x), ay = Math.round(a.y);
    if (ax >= x0 - 1 && ax <= x1 + 1 && ay >= y0 - 1 && ay <= y1 + 1 && a.hunt !== (k === 'attack')) { a.hunt = k === 'attack'; n++; }
  }
  if (k === 'attack') {                                        // quem está trabalhando larga o serviço e vai atrás do alvo
    if (!n) { note('Nenhum animal aí.'); return; }
    for (const c of C.cols) { if (c.act && c.act.k !== 'hunt' && c.act.k !== 'eat') dropAct(c); c.think = 0; }
    note(`⚔ ${n} alvo${n > 1 ? 's' : ''} marcado${n > 1 ? 's' : ''}.`); return;
  }
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (box && x > x0 && x < x1 && y > y0 && y < y1) continue;
    const vert = box && (x0 === x1 || ((x === x0 || x === x1) && y > y0 && y < y1));   // lados do retângulo (ou coluna única): parede na vertical
    const r = designate(x, y, k, tool.b, vert); if (r > 0) n++; else if (r < 0) short = true;
  }
  if (k === 'cancel' && !n && C.home && x0 <= C.home.x1 && x1 >= C.home.x0 && y0 <= C.home.y1 && y1 >= C.home.y0) { C.home = null; note('Casa removida.'); }
  if (short) note('Faltam recursos.', 'bad');
}
function hoverText() {
  const p = hoverTile; if (!p || !C || !M || !inb(p.x, p.y)) return '';
  const i = idx(p.x, p.y), t = M.T[i], j = jobAt.get(i), a = C.animals.find(o => Math.round(o.x) === p.x && Math.round(o.y) === p.y);
  if (a) return SPECIES[a.sp].n + (a.hostile ? ' (hostil)' : a.hunt ? ' (alvo)' : '');
  let s = t === T.TREE ? 'Árvore' : TILE[t].n || (M.G[i] >= 2 ? 'Piso' : M.G[i] ? 'Chão de pedra' : 'Chão');
  if (t === T.FARM || t === T.BUSH0 || t === T.SAPLING) {                         // quanto falta para colher
    const h = Math.max(1, Math.ceil((1 - M.aux[i]) / (t === T.FARM ? (.35 + C.site.soil) / FARM_GROW_H : 1 / (t === T.SAPLING ? TREE_GROW_H : BUSH_REGROW_H))));
    s += tempNow() > GROW_MIN_C ? ` · ${t === T.FARM ? 'colheita' : t === T.SAPLING ? 'árvore' : 'frutas'} em ${h >= 24 ? Math.floor(h / 24) + 'd ' : ''}${h % 24}h` : ' · sem crescer (frio)';
  } else if (t === T.FARMR) s += ' · pronta para colher';
  else if (TILE[t].station) s += ' · clique para abrir';
  if (inHome(p.x, p.y)) s += ' · casa';
  if (j) s += ' · ' + (j.k === 'build' ? BUILD[j.b].n : JOB[j.k].n.toLowerCase().replace(/ando$|endo$/, m => m[0] + 'r'));
  return s;
}
function updHover(e) { hoverTile = tileAt(e); $('#hover').textContent = hoverText(); }
function clampCam() { const c = C.cam; c.x = clamp(c.x, 0, LW); c.y = clamp(c.y, 0, LH); }

cv.addEventListener('mousedown', e => {
  if (!C) return; const p = tileAt(e);
  if (e.button === 0) {
    if (tool) drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    else {
      const st = inb(p.x, p.y) && TILE[M.T[idx(p.x, p.y)]].station;
      if (st) { st === 'research' ? openResearch() : openCraft(); return; }
      const c = nearest(C.cols, { x: p.x, y: p.y }, 1.2, () => true); sel = c ? c.id : 0; hud();
    }
  } else { pan = { sx: e.clientX, sy: e.clientY, cx: C.cam.x, cy: C.cam.y, moved: false, btn: e.button }; e.preventDefault(); }
});
window.addEventListener('mousemove', e => {
  if (!C || !running) return;
  if (pan) {
    const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy, ts = TS * C.cam.z;
    if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
    if (pan.moved) { C.cam.x = pan.cx - dx / ts; C.cam.y = pan.cy - dy / ts; clampCam(); }
  }
  if (drag && tool) { const p = tileAt(e); drag.x1 = p.x; drag.y1 = p.y; if (tool.k === 'build' && BUILD[tool.b].area === 'one') { drag.x0 = p.x; drag.y0 = p.y; } }
  if (e.target === cv) updHover(e); else { hoverTile = null; $('#hover').textContent = ''; }
});
window.addEventListener('mouseup', () => {
  if (drag && tool && C) applyTool(drag);
  drag = null;
  if (pan && !pan.moved && pan.btn === 2) setTool(null);     // clique direito solta a ferramenta
  pan = null;
});
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  if (!C) return; e.preventDefault();
  const r = cv.getBoundingClientRect(), mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2, c = C.cam, z0 = c.z;
  c.z = clamp(c.z + (e.deltaY < 0 ? 1 : -1), 1, 4); if (c.z === z0) return;
  c.x += mx / (TS * z0) - mx / (TS * c.z); c.y += my / (TS * z0) - my / (TS * c.z); clampCam();
}, { passive: false });
window.addEventListener('keydown', e => {
  if (!running || !$('#modal').hidden || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase(); keys.add(k);
  if (k === 'escape') setTool(null);
  else if (k === ' ') { setSpeed(speed ? 0 : 1); e.preventDefault(); }
  else if (k >= '1' && k <= String(ORDERS.length)) orderClick(ORDERS[+k - 1].k);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
function setSpeed(s) { speed = s; document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.s === s)); }
document.querySelectorAll('#speed button').forEach(b => b.onclick = () => setSpeed(+b.dataset.s));
$('#crewlist').addEventListener('mousedown', e => {      // mousedown: a lista é refeita a cada 0,25 s e um click se perderia
  const d = e.target.closest('.cc'); if (!d) return;
  const c = C.cols.find(o => o.id === +d.dataset.id); if (!c) return;
  sel = sel === c.id ? 0 : c.id; if (sel) { C.cam.x = c.x + .5; C.cam.y = c.y + .5; } hud();
});
$('#c-menu').onclick = () => { save(); openMenu(); };

/* ======================= Interface da colônia ======================= */
function note(msg, cls) { const f = $('#feed'), d = el('div', cls || '', msg); f.prepend(d); while (f.children.length > 5) f.lastChild.remove(); setTimeout(() => d.remove(), 7000); }
function modal(title, html, btns) {
  $('#mo-title').textContent = title; $('#mo-body').innerHTML = html;
  const f = $('#mo-foot'); f.innerHTML = '';
  for (const b of btns) { const bt = el('button', 'btn ' + (b.cls || ''), b.t); bt.onclick = () => { $('#modal').hidden = true; if (b.fn) b.fn(); }; f.append(bt); }
  $('#modal').hidden = false;
}
function actName(c) {
  const a = c.act;
  if (c.fighting > 0) return 'Lutando';
  if (!a) return c.path.length ? 'Andando' : 'Ocioso';
  if (a.k === 'shelter') return c.path.length ? 'Indo se abrigar' : 'Abrigado';
  if (a.k === 'sleep') return c.path.length ? 'Indo dormir' : 'Dormindo';
  if (a.k === 'eat') return c.path.length ? 'Indo comer' : 'Comendo';
  if (a.k === 'hunt') return 'Caçando';
  if (c.path.length) return 'Indo trabalhar';
  if (a.k === 'station') return STATION[a.s];
  return a.job.b === 'demolish' ? 'Demolindo' : JOB[a.job.k].n;
}
function hud() {
  if (!C) return;
  const day = Math.floor(C.t / 24) + 1, t = Math.round(tempNow());
  $('#c-date').textContent = `Dia ${day} · ${String(Math.floor(hourNow())).padStart(2, '0')}h · ${SEASONS[Math.floor(yearFrac() * 4)]}`;
  $('#c-temp').textContent = `${{ rain: '🌧', snow: '❄' }[C.weather.k] || (isNight() ? '🌙' : '☀')} ${t}°C`;
  for (const k in RES) $('#r-' + k).textContent = Math.floor(C.res[k]);
  $('#hover').textContent = hoverText();
  const bar = (e, n, v, col) => `<span title="${n}">${e}</span><i title="${n}: ${Math.round(v)}%" style="--w:${clamp(v, 0, 100)}%;--c:${col}"></i>`;
  $('#crewlist').innerHTML = C.cols.map(c => {
    const on = c.id === sel, hungry = c.food < 25;
    return `<div class="cc${on ? ' sel' : ''}" data-id="${c.id}"><div class="top"><img src="${charSprite(c.race, c.look).url}" alt=""><div style="min-width:0"><div class="nm"><b>${c.name}</b></div><div class="act">${actName(c)}${hungry ? ' · <span class="warn">com fome</span>' : ''}</div></div></div>` +
      `<div class="bars">${bar('❤', 'Vida', c.hp / maxHp(c) * 100, '#ff5d6c')}${bar('🍖', 'Fome', c.food, hungry ? '#ff5d6c' : '#ffb347')}${bar('💤', 'Descanso', c.rest, '#7db4ff')}</div>` +
      (on ? `<div class="more"><div class="dim">${RACES[c.race].n} · ${c.age} anos</div>${Object.keys(SKILLS).map(k => `<div class="sk"><span>${SKILLS[k]}</span><i style="--w:${c.sk[k] * 10}%"></i><b>${c.sk[k]}</b></div>`).join('')}` +
        `<div class="dim">⚔ ${c.eq.w ? CRAFTS[c.eq.w].n : 'sem arma'}<br>🛡 ${c.eq.a ? CRAFTS[c.eq.a].n : 'sem armadura'}</div><div class="traits">${c.traits.map(x => `<span>${TRAITS[x].n}</span>`).join('')}</div></div>` : '') + `</div>`;
  }).join('');
}
function resize() {
  const st = $('#stage'); if (!st.clientWidth) return;
  cv.width = night.width = st.clientWidth; cv.height = night.height = st.clientHeight;
}
window.addEventListener('resize', () => { if ($('#world').classList.contains('on')) fitWorld(); if (running) resize(); });

/* ======================= Desenho ======================= */
const darkness = h => h < 5 ? .55 : h < 7 ? lerp(.55, 0, (h - 5) / 2) : h < 19 ? 0 : h < 21 ? lerp(0, .55, (h - 19) / 2) : .55;
function render(now) {
  const g = ctx, cw = cv.width, ch = cv.height, z = C.cam.z, ts = TS * z, bio = BIOMES[C.site.b];
  g.imageSmoothingEnabled = false; g.fillStyle = '#0b0e09'; g.fillRect(0, 0, cw, ch);
  const ox = Math.floor(cw / 2 - C.cam.x * ts), oy = Math.floor(ch / 2 - C.cam.y * ts);
  const x0 = Math.max(0, Math.floor(-ox / ts)), x1 = Math.min(LW - 1, Math.floor((cw - ox) / ts)), y0 = Math.max(0, Math.floor(-oy / ts)), y1 = Math.min(LH - 1, Math.floor((ch - oy) / ts) + 1);
  const gs = SPR.ground[bio.g], rf = SPR.ground.rockf, wf = SPR.water[Math.floor(now / 600) % 2], tree = SPR.obj[bio.tree], fl = Math.floor(now / 180) % 2, fire = SPR.obj[fl ? 'fire' : 'fire1'], torch = SPR.obj[fl ? 'torch' : 'torch1'];
  const rocky = (x, y) => inb(x, y) && (M.T[idx(x, y)] === T.ROCK || M.T[idx(x, y)] === T.ORE);

  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {       // chão e peças rasas
    const i = idx(x, y), t = M.T[i], sx = ox + x * ts, sy = oy + y * ts;
    if (t === T.WATER) { g.drawImage(wf, sx, sy, ts, ts); continue; }
    if (M.G[i] >= 2) g.drawImage(M.G[i] >= 4 ? SPR.obj.sfloor : SPR.obj.floor, sx, sy, ts, ts); else g.drawImage((M.G[i] ? rf : gs)[M.V[i]], sx, sy, ts, ts);
    if (TILE[t].flat) g.drawImage(SPR.obj[TILE[t].spr], sx, sy, ts, ts);
  }
  if (C.weather.k === 'snow') { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, 0, cw, ch); }   // chão esbranquiçado enquanto neva
  const ents = C.animals.concat(C.cols).sort((a, b) => a.y - b.y); let ei = 0;
  for (let y = y0; y <= y1; y++) {                                       // objetos e seres, linha a linha (de cima para baixo)
    for (let x = x0; x <= x1; x++) {
      const t = M.T[idx(x, y)]; if (!t || t === T.WATER || TILE[t].flat) continue;
      const sx = ox + x * ts, sy = oy + y * ts;
      if (t === T.TREE) g.drawImage(tree, sx, sy - ts / 2, ts, ts * 1.5);
      else if (t === T.FIRE || t === T.TORCH) g.drawImage(t === T.FIRE ? fire : torch, sx, sy, ts, ts);
      else {
        g.drawImage(SPR.obj[TILE[t].spr + ((t === T.WALLW || t === T.WALLS) && M.aux[idx(x, y)] ? 'v' : '')], sx, sy, ts, ts);
        if (t === T.ROCK || t === T.ORE) {                               // relevo nas bordas do maciço de rocha
          if (!rocky(x, y + 1)) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(sx, sy + ts - 4 * z, ts, 4 * z); }
          if (!rocky(x, y - 1)) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(sx, sy, ts, 2 * z); }
          g.fillStyle = 'rgba(0,0,0,.3)';
          if (!rocky(x + 1, y)) g.fillRect(sx + ts - z, sy, z, ts);
          if (!rocky(x - 1, y)) g.fillRect(sx, sy, z, ts);
        }
      }
    }
    while (ei < ents.length && Math.round(ents[ei].y) <= y) drawEnt(g, ents[ei++], ox, oy, ts, z);
  }
  g.lineWidth = z;
  for (const j of C.jobs) {                                              // marcas das tarefas
    if (j.x < x0 || j.x > x1 || j.y < y0 || j.y > y1) continue;
    const sx = ox + j.x * ts, sy = oy + j.y * ts, demo = j.b === 'demolish';
    if (j.k === 'build' && !demo) { g.globalAlpha = .5; g.drawImage(SPR.obj[BUILD[j.b].spr + (j.o ? 'v' : '')], sx, sy, ts, ts); g.globalAlpha = 1; }
    g.strokeStyle = demo ? '#ff5d6c' : JOB[j.k].c; g.strokeRect(sx + z * 1.5, sy + z * 1.5, ts - z * 3, ts - z * 3);
    if (j.prog > 0) { g.fillStyle = '#000'; g.fillRect(sx + z, sy + ts - 3 * z, ts - 2 * z, 2 * z); g.fillStyle = '#ffd257'; g.fillRect(sx + z, sy + ts - 3 * z, (ts - 2 * z) * Math.min(1, j.prog), 2 * z); }
  }
  if (C.home) {                                                          // área da casa
    const h = C.home, sx = ox + h.x0 * ts, sy = oy + h.y0 * ts, w = (h.x1 - h.x0 + 1) * ts, hh = (h.y1 - h.y0 + 1) * ts;
    g.fillStyle = 'rgba(127,224,138,.10)'; g.fillRect(sx, sy, w, hh);
    g.strokeStyle = '#7fe08a'; g.setLineDash([4 * z, 3 * z]); g.strokeRect(sx + z / 2, sy + z / 2, w - z, hh - z); g.setLineDash([]);
  }
  if (drag && tool) {
    const ax = Math.min(drag.x0, drag.x1), ay = Math.min(drag.y0, drag.y1), w = (Math.abs(drag.x1 - drag.x0) + 1) * ts, h = (Math.abs(drag.y1 - drag.y0) + 1) * ts;
    g.fillStyle = 'rgba(255,210,87,.16)'; g.strokeStyle = '#ffd257';
    if (!(tool.k === 'build' && BUILD[tool.b].area === 'box')) g.fillRect(ox + ax * ts, oy + ay * ts, w, h);
    g.strokeRect(ox + ax * ts + z / 2, oy + ay * ts + z / 2, w - z, h - z);
  } else if (tool && hoverTile && inb(hoverTile.x, hoverTile.y)) { g.strokeStyle = '#ffd257'; g.strokeRect(ox + hoverTile.x * ts + z / 2, oy + hoverTile.y * ts + z / 2, ts - z, ts - z); }

  const dk = darkness(hourNow());                                         // noite, com clarão das fogueiras
  if (dk > .01) {
    nctx.globalCompositeOperation = 'source-over'; nctx.clearRect(0, 0, cw, ch); nctx.fillStyle = `rgba(8,12,44,${dk})`; nctx.fillRect(0, 0, cw, ch);
    nctx.globalCompositeOperation = 'destination-out';
    for (const i of M.fires) {
      const fx = ox + (i % LW + .5) * ts, fy = oy + (((i / LW) | 0) + .5) * ts, R = ts * (TILE[M.T[i]].light + Math.sin(now / 150) * .15);
      const gr = nctx.createRadialGradient(fx, fy, 0, fx, fy, R); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      nctx.fillStyle = gr; nctx.fillRect(fx - R, fy - R, R * 2, R * 2);
    }
    g.drawImage(night, 0, 0);
  }
  const wk = C.weather.k;                                                 // chuva e neve na tela (os efeitos ficam em hourTick e no passo dos colonos)
  if (wk !== 'clear') {
    const rain = wk === 'rain', n = Math.round(cw * ch / (rain ? 5000 : 7000));
    g.fillStyle = rain ? 'rgba(170,200,255,.55)' : 'rgba(255,255,255,.85)';
    for (let k = 0; k < n; k++) {
      const hx = h3(k, 1, 0, 7), hy = h3(k, 2, 0, 7), y = (hy * ch + now / 1000 * (rain ? 900 + hx * 300 : 60 + hy * 50)) % ch;
      const x = ((hx * cw + (rain ? -y * .2 : Math.sin(now / 900 + k) * 12)) % cw + cw) % cw;
      if (rain) g.fillRect(x, y, z, 5 * z); else g.fillRect(x, y, z + 1, z + 1);
    }
  }
}
function drawEnt(g, e, ox, oy, ts, z) {
  const col = !!e.race, sx = ox + Math.round(e.x * ts), sy = oy + Math.round(e.y * ts) - (col ? 2 * z : 0);
  const spr = (col ? charSprite(e.race, e.look) : animalSprite(e.sp, SPECIES[e.sp]))[e.dir < 0 ? 'l' : 'r'];
  const asleep = col && e.act && e.act.k === 'sleep' && !e.path.length;
  if (e.hit > 0) g.globalAlpha = .45;
  g.drawImage(spr, sx, sy, ts, ts); g.globalAlpha = 1;
  const full = col ? maxHp(e) : SPECIES[e.sp].hp;
  if (e.hp < full) { g.fillStyle = '#000'; g.fillRect(sx + z, sy - 2 * z, ts - 2 * z, 2 * z); g.fillStyle = col ? '#7fe08a' : '#ff5d6c'; g.fillRect(sx + z, sy - 2 * z, (ts - 2 * z) * clamp(e.hp / full), 2 * z); }
  if (!col) { if (e.hostile || e.hunt) { g.strokeStyle = e.hostile ? '#ff5d6c' : '#ffb347'; g.lineWidth = z; g.strokeRect(sx + z / 2, sy + z / 2, ts - z, ts - z); } return; }
  if (e.id === sel) { g.strokeStyle = '#ffd257'; g.lineWidth = z; g.strokeRect(sx - z / 2, sy - z / 2, ts + z, ts + z); }
  if (z >= 2 || asleep) {
    g.font = `bold ${3 * z + 4}px ui-monospace, monospace`; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = '#000'; g.fillStyle = asleep ? '#7db4ff' : '#fff';
    const txt = asleep ? 'zZ' : e.name, ty = asleep ? sy - z : sy + ts + 3 * z + 2;
    g.strokeText(txt, sx + ts / 2, ty); g.fillText(txt, sx + ts / 2, ty);
  }
}
function frame(now) {
  if (!running) return;
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const pv = 18 / C.cam.z * dt;
  if (keys.has('a') || keys.has('arrowleft')) C.cam.x -= pv; if (keys.has('d') || keys.has('arrowright')) C.cam.x += pv;
  if (keys.has('w') || keys.has('arrowup')) C.cam.y -= pv; if (keys.has('s') || keys.has('arrowdown')) C.cam.y += pv;
  clampCam();
  if (speed && $('#modal').hidden) { acc += dt * speed; let n = 0; while (acc >= 1 / 30 && n++ < 16 && running) { tick(1 / 30); acc -= 1 / 30; } if (n >= 16) acc = 0; }
  if (!running) return;
  render(now);
  if ((hudT -= dt) <= 0) { hud(); hudT = .25; }
  requestAnimationFrame(frame);
}

/* ======================= Telas ======================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); if (id !== 'colony') running = false; }
function startColony() {
  const o = ORIGINS[SU.origin];
  C = S.col = { origin: SU.origin, site: W.sel, seed: S.seed, t: 8, res: Object.assign({ wood: 0, stone: 0, iron: 0, hide: 0, seed: 0, food: 0 }, o.res), jobs: [], cols: [], animals: [], nid: 0, home: null, weather: { k: 'clear', until: 0 }, research: { done: {}, cur: null, prog: {} }, craftQ: [], items: {}, wildN: 0, cam: { x: LW / 2, y: LH / 2, z: 2 } };
  genLocal();
  SU.crew.forEach((c, i) => addColonist(c, (LW >> 1) + (i - 1) * 2, (LH >> 1) + (i & 1)));
  SU.crew = [];
  enterColony(); save();
}
function enterColony() {
  // campos que saves antigos não têm
  C.res.hide = C.res.hide || 0; C.res.seed = C.res.seed || 0; C.weather = C.weather || { k: 'clear', until: 0 }; C.research = C.research || { done: {}, cur: null, prog: {} }; C.craftQ = C.craftQ || []; C.items = C.items || {}; C.home = C.home || null; delete C.draft;
  for (const c of C.cols) { c.eq = c.eq || {}; for (const k in SKILLS) if (c.sk[k] == null) { c.sk[k] = c.base[k] = ri(0, 4); c.xp[k] = 0; } }
  jobAt = new Map(); for (const j of C.jobs) { j.by = 0; jobAt.set(idx(j.x, j.y), j); }
  for (const e of C.cols.concat(C.animals)) { e.path = []; e.act = null; }
  scanFires(); tool = null; drag = pan = null; sel = 0; acc = 0;
  $('#c-biome').textContent = BIOMES[C.site.b].n; $('#feed').innerHTML = ''; $('#buildmenu').hidden = true;
  show('colony'); resize(); setSpeed(1); drawOrders(); hud();
  running = true; last = performance.now(); requestAnimationFrame(frame);
}
function openMenu() {
  C = S.col; show('menu');
  $('#m-continue').hidden = !C;
  $('#m-info').textContent = C ? `${BIOMES[C.site.b].n} · dia ${Math.floor(C.t / 24) + 1} · ${C.cols.length} colono${C.cols.length > 1 ? 's' : ''}` : '';
  const g = $('#menu-art').getContext('2d'); g.clearRect(0, 0, 96, 28);
  g.drawImage(SPR.obj.pine, 0, 2); g.drawImage(SPR.obj.oak, 14, 4);
  ['human', 'elf', 'orc'].forEach((r, i) => g.drawImage(charSprite(r, { s: 0, h: i, c: i })[i === 2 ? 'l' : 'r'], 32 + i * 12 + (i === 2 ? 6 : 0), 12));
  g.drawImage(SPR.obj.fire, 54, 12); g.drawImage(SPR.obj.palm, 80, 4);
}
$('#m-continue').onclick = () => { C = S.col; loadMap(); enterColony(); };
$('#m-new').onclick = () => {
  if (!S.col) return openWorld();
  modal('Nova colônia', '<p>A colônia atual será apagada.</p>', [{ t: 'Apagar e começar', cls: 'primary', fn: () => { S.col = null; C = null; M = null; save(); openWorld(); } }, { t: 'Voltar' }]);
};
window.addEventListener('pagehide', () => { if (running) save(); });
openMenu();

// Atalho de teste: index.html#dbg=world | setup | colony  pula direto para a tela, num lugar em terra firme. Nada é salvo nesse modo.
{
  const m = /#dbg=(\w+)/.exec(location.hash);
  if (m) {
    save = () => {}; S = { seed: S.seed, col: null }; openWorld();
    if (m[1] !== 'world' || /sel/.test(location.hash)) { let k = 0; for (let n = 0; n < 5000; n++) { k = ri(WW * 20, WW * (WH - 20)); if (!cellInfo(k).ocean) break; } W.sel = cellInfo(k); showSite(); drawWorld(); }
    if (m[1] === 'setup' || m[1] === 'colony') openSetup();
    if (m[1] === 'colony') startColony();
  }
}
