/* Smithing: jogo 2D de gerenciamento de forja.
   Loop: minerar ou comprar minérios → minérios + molde na bigorna → mini-jogo de ritmo → peça com raridade vai para o estoque
   → entregar encomendas, vender no leilão ou na venda automática → comprar moldes, melhorias e descer mais na mina.
   Todo o progresso fica salvo no navegador (localStorage). */

const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a), irand = (a, b) => Math.floor(rand(a, b + 1)), pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const uniq = a => [...new Set(a)];
const wpick = (list, w) => { let x = Math.random() * list.reduce((a, it) => a + w(it), 0); for (const it of list) if ((x -= w(it)) < 0) return it; return list[0]; };

/* ======================= Dados (equilíbrio do jogo) ======================= */
// Materiais. cost = valor base (usado no valor das peças) · buy = preço na loja (4× o valor) · tier = grau (pesa na dificuldade)
// Minérios naturais: mine = nível da mina onde aparecem · w = peso na mina (quanto menor, mais raro) · smelt = nível da fornalha para derreter
// alloy = só se obtém por liga na fornalha · ingr = só serve de ingrediente · jewel = só para joias · wood = só para cajados
// Madeiras: fw = peso na floresta (quanto menor, mais rara e mais difícil de cortar) · fl = nível da floresta onde nasce
// shop = nível do Fornecedor que vende o material (sem shop = não se compra)
const ORES = [
  { id: 'estanho',    n: 'Estanho',    tier: 1,  sh: ['#e7e5e4', '#a8a29e', '#57534e'], cost: 2,   mine: 1, w: 6,   smelt: 1, shop: 1, spark: '#f5f5f4', ingr: true },
  { id: 'cobre',      n: 'Cobre',      tier: 1,  sh: ['#f4a36b', '#c8693a', '#8a3f22'], cost: 3,   mine: 1, w: 10,  smelt: 1, shop: 1, spark: '#ffb36b' },
  { id: 'bronze',     n: 'Bronze',     tier: 2,  sh: ['#e8c07a', '#b3833d', '#7a5520'], cost: 8,   alloy: true, spark: '#ffc56b' },
  { id: 'ferro',      n: 'Ferro',      tier: 3,  sh: ['#d5d9de', '#9aa1aa', '#626973'], cost: 9,   mine: 1, w: 1.6, smelt: 2, shop: 1, spark: '#ffd27a' },
  { id: 'aco',        n: 'Aço',        tier: 4,  sh: ['#c4d3e6', '#7d8fa6', '#4c5a6e'], cost: 22,  alloy: true, spark: '#fff1b0' },
  { id: 'prata',      n: 'Prata',      tier: 5,  sh: ['#ffffff', '#c9d1dc', '#8a94a3'], cost: 26,  mine: 2, w: .2,  smelt: 1, shop: 2, spark: '#ffffff', jewel: true },
  { id: 'ouro',       n: 'Ouro',       tier: 6,  sh: ['#fff1a8', '#f2c230', '#a87a12'], cost: 42,  mine: 2, w: .12, smelt: 1, shop: 2, spark: '#ffe066', jewel: true },
  { id: 'mithril',    n: 'Mithril',    tier: 7,  sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'], cost: 70,  mine: 4, w: .35, smelt: 3, shop: 3, spark: '#8ffff0' },
  { id: 'adamantita', n: 'Adamantita', tier: 8,  sh: ['#e2c4ff', '#9b5de5', '#5b2a99'], cost: 110, alloy: true, spark: '#d8b4fe' },
  { id: 'oricalco',   n: 'Oricalco',   tier: 9,  sh: ['#ffc2a8', '#ff6b4a', '#a8321c'], cost: 130, alloy: true, spark: '#ff9a7a' },
  { id: 'astralita',  n: 'Astralita',  tier: 10, sh: ['#e0e7ff', '#6366f1', '#1e1b4b'], cost: 300, alloy: true, spark: '#c7d2fe' },
  { id: 'pinho',      n: 'Pinho',      tier: 1,  sh: ['#f3d9a4', '#d4a65a', '#9a6b2f'], cost: 3,   wood: true, fw: 10,  shop: 1, fl: 1, spark: '#fde68a' },
  { id: 'carvalho',   n: 'Carvalho',   tier: 2,  sh: ['#c08552', '#8a5a33', '#5e3b20'], cost: 5,   wood: true, fw: 7,   shop: 1, fl: 1, spark: '#fbbf24' },
  { id: 'freixo',     n: 'Freixo',     tier: 3,  sh: ['#ead7b7', '#c2a477', '#8b6f47'], cost: 8,   wood: true, fw: 5,   shop: 1, fl: 1, spark: '#fde68a' },
  { id: 'teixo',      n: 'Teixo',      tier: 5,  sh: ['#d9a066', '#a0522d', '#6b2f12'], cost: 15,  wood: true, fw: 3,   shop: 2, fl: 2, spark: '#fbbf24' },
  { id: 'pauferro',   n: 'Pau-ferro',  tier: 6,  sh: ['#a1887f', '#6d4c41', '#3e2723'], cost: 24,  wood: true, fw: 1.6, shop: 2, fl: 2, spark: '#fbbf24' },
  { id: 'ebano',      n: 'Ébano',      tier: 8,  sh: ['#6b6b75', '#3a3540', '#1c1820'], cost: 40,  wood: true, fw: .8,  shop: 2, fl: 2, spark: '#e5e7eb' },
  { id: 'sandalo',    n: 'Sândalo',    tier: 9,  sh: ['#ffd6a5', '#e07a5f', '#9c3d2e'], cost: 60,  wood: true, fw: .4,  shop: 3, fl: 3, spark: '#fca5a5' },
].map(o => ({ ...o, buy: o.cost * 4 }));
// Floresta: cada nível traz madeiras novas e alarga em 5% a faixa de corte das madeiras de cada nível anterior
const FORESTS = [null,
  { n: 'Bosque',             price: 0 },
  { n: 'Mata velha',         price: 2500 },
  { n: 'Floresta ancestral', price: 20000 },
];
const FOREST_EASE = .05;
const forestWoods = lv => ORES.filter(o => o.wood && o.fl <= lv);

const minable = lv => ORES.filter(o => o.mine && o.mine <= lv);
const mineWeight = (o, lv) => o.w * (o.w < 5 ? 1 + 1.2 * (lv - o.mine) : 1);

// uses = lingotes no molde Simples (+1 por nível) · base = valor da peça · pf = peso no preço do molde · df = dificuldade extra
const TYPES = [
  { id: 'dagger', grp: 'arms',  n: 'Adaga',    g: 1, uses: 1, base: 5,  pf: .8,  df: .2 },
  // Armas com cabo: os últimos espaços (mixWood) são de madeira; o resto, de metal comum. A lança é inicial
  { id: 'spear', grp: 'arms',   n: 'Lança',    g: 1, uses: 3, base: 7,  pf: .9,  df: .3, mixWood: 2 },
  { id: 'helmet', grp: 'armor',  n: 'Elmo',     g: 0, uses: 2, base: 6,  pf: 1,   df: 0 },
  { id: 'gloves', grp: 'armor',  n: 'Manoplas', g: 2, uses: 1, base: 4,  pf: .8,  df: 0 },
  { id: 'greaves', grp: 'armor', n: 'Grevas',   g: 2, uses: 2, base: 6,  pf: 1,   df: 0 },
  { id: 'armor', grp: 'armor',   n: 'Peitoral', g: 0, uses: 3, base: 10, pf: 1.3, df: .2 },
  { id: 'shield', grp: 'armor',  n: 'Escudo',   g: 0, uses: 3, base: 9,  pf: 1.2, df: .2 },
  // Armaria (loja de melhorias): cada nível libera duas armas. No molde Simples:
  // nv.1 espada (2 metais + 1 madeira) e machado (1 + 1) · nv.2 maça (3 + 1) e alabarda (2 + 2) · nv.3 espada longa (5 + 1) e machado de guerra (4 + 2)
  { id: 'sword', grp: 'arms',     n: 'Espada',   g: 1, uses: 3, base: 10, pf: 1.2, df: .4, unlock: true, armory: 1, mixWood: 1 },
  { id: 'axe', grp: 'arms',       n: 'Machado',  g: 0, uses: 2, base: 8,  pf: 1.1, df: .3, unlock: true, armory: 1, mixWood: 1 },
  { id: 'mace', grp: 'arms',      n: 'Maça',     g: 1, uses: 4, base: 20, pf: 1.7, df: .5, unlock: true, armory: 2, mixWood: 1 },
  { id: 'halberd', grp: 'arms',   n: 'Alabarda', g: 1, uses: 4, base: 22, pf: 1.8, df: .6, unlock: true, armory: 2, mixWood: 2 },
  { id: 'longsword', grp: 'arms', n: 'Espada longa',      g: 1, uses: 6, base: 34, pf: 2.4, df: .8, unlock: true, armory: 3, mixWood: 1 },
  { id: 'waraxe', grp: 'arms',    n: 'Machado de guerra', g: 0, uses: 6, base: 32, pf: 2.3, df: .8, unlock: true, armory: 3, mixWood: 2 },
  // Arcabuzaria (fim de jogo; exige Bigorna e Martelo de Mithril): cano de metal + coronha de madeira
  { id: 'pistol', grp: 'guns',    n: 'Flintlock', g: 0, uses: 3, base: 70,  pf: 3 * 14, df: 1,   unlock: true, mixWood: 1 },
  { id: 'arquebus', grp: 'guns',  n: 'Arcabuz',   g: 0, uses: 6, base: 130, pf: 60,     df: 1.3, unlock: true, mixWood: 2 },
  { id: 'ring', grp: 'jewel',    n: 'Anel',     g: 0, uses: 1, base: 30, pf: 1.5, df: .5, jewel: true },
  { id: 'amulet', grp: 'jewel',  n: 'Amuleto',  g: 0, uses: 2, base: 45, pf: 1.8, df: .6, jewel: true },
  // Madeira: moldes liberados na loja de melhorias (Oficina). O cajado exige gema
  { id: 'bow', grp: 'wood',     n: 'Arco',     g: 0, uses: 2, base: 14, pf: 1.1, df: .4, wood: true, unlock: true },
  { id: 'staff', grp: 'wood',   n: 'Cajado',   g: 0, uses: 1, base: 14, pf: 1.3, df: .3, wood: true, gemReq: true, unlock: true },
];
const START_MOLDS = ['dagger', 'spear', 'helmet', 'gloves'];
// Temas dos moldes (painel e loja)
const GROUPS = [['armor', 'Armaduras'], ['arms', 'Armas'], ['jewel', 'Joias'], ['wood', 'Madeiras'], ['guns', 'Arcabuzaria']];
/* Espaços de gema por peça: cajado 1 (2 a partir do Magistral); anel e amuleto 1, +1 por nível depois do Ornamentado; o resto 1 */
const gemSlots = (t, lvl) => t === 'staff' ? (lvl >= 4 ? 2 : 1) : type(t).jewel ? 1 + Math.max(0, lvl - 3) : 1;
const GEM_Q_MAX = .1;
const PISTOL_PRICE = 25000 * 14, PISTOL_TOOLS = 3;   // Arcabuzaria exige bigorna e martelo nível 3 (Mithril)
// Armaria: cada nível libera um grupo de moldes
const ARMORY = [null,
  { price: 800,   types: ['sword', 'axe'] },
  { price: 4000,  types: ['mace', 'halberd'] },
  { price: 12000, types: ['longsword', 'waraxe'] },
];
// Oficina → Arcabuzaria: uma trilha só, comprada em ordem (cada passo libera um molde)
const WORKSHOP = [null,
  { n: 'Oficina',     lv: 1, t: 'bow',      price: 600,          d: 'molde de Arco (madeira)' },
  { n: 'Oficina',     lv: 2, t: 'staff',    price: 800,          d: 'molde de Cajado (madeira + gema obrigatória)' },
  { n: 'Arcabuzaria', lv: 1, t: 'pistol',   price: PISTOL_PRICE, d: 'molde de Flintlock: 2 metais no cano + 1 madeira na coronha', tools: PISTOL_TOOLS },
  { n: 'Arcabuzaria', lv: 2, t: 'arquebus', price: 600000,       d: 'molde de Arcabuz: 4 metais no cano + 2 madeiras na coronha', tools: PISTOL_TOOLS },
];
// Ajudante: 1 = venda automática · 2 = também forja peças simples de graça · 3 = aprendiz de ferreiro (peças melhores, até Épica)
// 4 = aprendiz que chega à Lendária (~0,5%) e às vezes encrava uma gema · every = segundos entre peças · tier = grau máximo do metal
// w = pesos das raridades (Comum, Incomum, Raro, Épico, Lendário) · gem = chance de a peça sair com gema
const HELPERS = [null,
  { n: 'Ajudante de ferreiro', price: 1500 },
  { n: 'Ajudante de ferreiro', price: 6000,  every: 1080, tier: 3, w: [80, 18.5, 1.5] },
  { n: 'Aprendiz de ferreiro', price: 25000, every: 720,  tier: 4, w: [68, 22, 8, 2] },
  { n: 'Aprendiz de ferreiro', price: 80000, every: 600,  tier: 4, w: [68, 22, 7.5, 2, .5], gem: .15 },
];
const HELPER_STOCK = 24;   // o ajudante para de forjar com o estoque cheio
// Runas (fim de jogo). Grau: v = bônus no valor da peça · q = melhora as chances de raridade
const RUNE_G = [null,
  { n: 'Comum',    r: 'comum',    v: .15, q: .04 },
  { n: 'Incomum',  r: 'incomum',  v: .3,  q: .08 },
  { n: 'Rara',     r: 'raro',     v: .5,  q: .12 },
  { n: 'Épica',    r: 'epico',    v: .8,  q: .18 },
  { n: 'Lendária', r: 'lendario', v: 1.2, q: .25 },
];
// Mesa de runas: max = grau máximo que sai · cd = espera entre sessões · cnt = runas por sessão
const RUNE_UP = [null,
  { n: 'Pedra rúnica',    price: 30000,  max: 2, cd: 600e3, cnt: 1 },
  { n: 'Círculo rúnico',  price: 90000,  max: 3, cd: 540e3, cnt: 1 },
  { n: 'Altar rúnico',    price: 250000, max: 4, cd: 450e3, cnt: 2 },
  { n: 'Altar ancestral', price: 700000, max: 5, cd: 360e3, cnt: 2 },
];
const RUNE_TOOLS = 4;                                  // exige Bigorna e Martelo Rúnicos
const RAR_HEX = { comum: '#a1a1aa', incomum: '#4ade80', raro: '#60a5fa', epico: '#c084fc', lendario: '#fbbf24', unico: '#ef4444' };
const runeOk = t => type(t).grp !== 'jewel';           // runa só em armaduras e armas (madeira e arcabuzaria contam)
const runeQ = r => r ? RUNE_G[r].q : 0;
const runeSh = g => { const c = RAR_HEX[RUNE_G[g].r]; return [mixc(c, '#ffffff', .55), c, mixc(c, '#000000', .45)]; };
const runeImg = (g, s = 4) => sprite('rune', runeSh(g), s);
const ORDER_PENALTY = .75;                             // entrega sem a gema/runa pedida: paga 75% do valor da peça simples
const GEM_SPEED = .75, RUNE_SPEED = .5;                // leilão: peças com gema vendem em 75% do tempo; com runa, na metade
// Categoria de cada espaço da bigorna: a pistola tem os últimos espaços de madeira; o resto segue a categoria da peça
const slotCatOf = (t, n, i) => type(t).mixWood ? (i >= n - type(t).mixWood ? 'wood' : 'metal') : tCat(t);
// Metais diferentes (ou madeiras diferentes) na mesma peça; metal + madeira da pistola não conta como liga
const mixN = ores => { const m = uniq(ores.filter(o => !ore(o).wood)), w = uniq(ores.filter(o => ore(o).wood)); return Math.max(0, m.length - 1) + Math.max(0, w.length - 1); };   // somadas, as gemas melhoram as chances de raridade em no máximo 10%
// Gemas (mina nível 3+): b = bônus no valor (cheio em joias, metade nas outras peças) · q = melhora as chances de raridade (máx. 10%)
const GEMS = [
  { id: 'quartzo',   n: 'Quartzo',   sh: ['#ffffff', '#e5e7eb', '#9ca3af'], b: .2,  q: .02, mine: 3, w: 10 },
  { id: 'ametista',  n: 'Ametista',  sh: ['#e9d5ff', '#a855f7', '#6b21a8'], b: .4,  q: .03, mine: 3, w: 6 },
  { id: 'topazio',   n: 'Topázio',   sh: ['#fef3c7', '#f59e0b', '#92400e'], b: .6,  q: .04, mine: 3, w: 4 },
  { id: 'safira',    n: 'Safira',    sh: ['#bfdbfe', '#3b82f6', '#1e3a8a'], b: 1,   q: .06, mine: 4, w: 2.5 },
  { id: 'esmeralda', n: 'Esmeralda', sh: ['#bbf7d0', '#22c55e', '#14532d'], b: 1.5, q: .07, mine: 5, w: 1.6 },
  { id: 'rubi',      n: 'Rubi',      sh: ['#fecaca', '#ef4444', '#7f1d1d'], b: 2,   q: .08, mine: 6, w: 1 },
  { id: 'diamante',  n: 'Diamante',  sh: ['#ffffff', '#a5f3fc', '#0e7490'], b: 3,   q: .1,  mine: 6, w: .5 },
];
const gemWeight = (g, lv) => g.w * (1 + .8 * (lv - g.mine));
// Nível do molde: m = multiplicador de valor · price = preço na loja (× pf do tipo) · adj = nome por gênero (m, f, f plural)
const LEVELS = [null,
  { n: 'Simples',     m: 1,   price: 80,   adj: null },
  { n: 'Reforçado',   m: 1.4, price: 250,  adj: ['Reforçado', 'Reforçada', 'Reforçadas'] },
  { n: 'Ornamentado', m: 1.9, price: 900,  adj: ['Ornamentado', 'Ornamentada', 'Ornamentadas'] },
  { n: 'Magistral',   m: 2.6, price: 3000, adj: ['Magistral', 'Magistral', 'Magistrais'] },
  { n: 'Mítico',      m: 3.6, price: 10000, adj: ['Mítico', 'Mítica', 'Míticas'] },
];
const MAXLV = LEVELS.length - 1;
// m = multiplicador de valor · af = atratividade no leilão
const RARITY = [
  { id: 'comum',    n: 'Comum',    m: 1,   af: .8 },
  { id: 'incomum',  n: 'Incomum',  m: 1.5, af: 1 },
  { id: 'raro',     n: 'Raro',     m: 2.2, af: 1.15 },
  { id: 'epico',    n: 'Épico',    m: 3.5, af: 1.3 },
  { id: 'lendario', n: 'Lendário', m: 6,   af: 1.5 },
  { id: 'unico',    n: 'Único',    m: 12,  af: 1.8 },
];
/* Raridade por sorte: p = desempenho no ritmo (0 a 1) só muda os pesos.
   Mesmo com tudo perfeito, Lendário fica em ~5% e Único em ~1%. */
// q (gema) multiplica as chances de Raro para cima em até +10%
const rarityWeights = (p, q = 0) => [60 * (1 - p) + 5, 30, 5 + 25 * p, 1 + 12 * p * p, .2 + 4 * p ** 3, .02 + .8 * p ** 4].map((w, i) => i >= 2 ? w * (1 + q) : w);
function rollRarity(p, q = 0) { const w = rarityWeights(p, q); return RARITY[wpick(RARITY.map((_, i) => i), i => w[i])]; }

/* Faixas do ritmo (fração da meia-zona a partir do centro) */
const GRADES = [
  { n: 'Errou!',    pts: 0, c: '#a8a29e', cls: 'x' },
  { n: 'Ruim',      pts: 1, c: '#c2410c', cls: 'r', max: 1 },
  { n: 'Bom',       pts: 2, c: '#ff8a3d', cls: 'g', max: .75 },
  { n: 'Ótimo!',    pts: 3, c: '#fbbf24', cls: 'o', max: .45 },
  { n: 'Perfeito!', pts: 4, c: '#fff7d6', cls: 'p', max: .2 },
];

/* Melhorias: b da bigorna = zona de acerto maior · b do martelo = cursor mais lento */
const ANVILS = [null,
  { n: 'Bigorna de Ferro',   sh: ['#9aa0ab', '#5d626d', '#3a3d45'], b: 0,   price: 0 },
  { n: 'Bigorna de Aço',     sh: ['#c4d3e6', '#7d8fa6', '#4c5a6e'], b: .12, price: 400 },
  { n: 'Bigorna de Mithril', sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'], b: .24, price: 1500 },
  { n: 'Bigorna Rúnica',     sh: ['#ffd1a8', '#e0571b', '#7a2a0e'], b: .36, price: 5000 },
  { n: 'Bigorna Estelar',    sh: ['#e0e7ff', '#6366f1', '#1e1b4b'], b: .45, price: 150000 },
];
const HAMMERS = [null,
  { n: 'Martelo de Ferro',   sh: ['#c9ced6', '#8b919b', '#565b64'], b: 0,   price: 0 },
  { n: 'Martelo de Aço',     sh: ['#c4d3e6', '#7d8fa6', '#4c5a6e'], b: .08, price: 300 },
  { n: 'Martelo de Mithril', sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'], b: .16, price: 1200 },
  { n: 'Martelo Rúnico',     sh: ['#ffd1a8', '#e0571b', '#7a2a0e'], b: .25, price: 4000 },
  { n: 'Martelo Estelar',    sh: ['#e0e7ff', '#6366f1', '#1e1b4b'], b: .32, price: 120000 },
];
/* Bigorna e Martelo Estelares (nível 5): só abrem com o Forno arcano, a Brasagem estelar e o Círculo rúnico.
   Com os dois, toda peça forjada por você sai no mínimo Incomum, e todo craft (inclusive o do ajudante) tem ~5% de chance
   de sair um nível de molde acima (Simples → Reforçado…). */
const STAR_TOOLS = 5, STAR_UP = .05;
const STAR_REQ = [
  [s => s.up.furnace >= 4, () => FURNACES[4].n],
  [s => s.up.alloys >= ALLOYS.length, () => ALLOYS[ALLOYS.length - 1].n],
  [s => s.up.runes >= 2, () => RUNE_UP[2].n],
];
const starOpen = () => STAR_REQ.every(([ok]) => ok(S));
const stellar = () => S.up.anvil >= STAR_TOOLS && S.up.hammer >= STAR_TOOLS;
const starRarity = r => stellar() && r.id === 'comum' ? RARITY[1] : r;
const starLvl = lvl => stellar() && lvl < MAXLV && Math.random() < STAR_UP ? lvl + 1 : lvl;
// Mina: targets = veios por descida · T = tempo até o anel fechar (s) · every = intervalo entre veios (s)
const MINES = [null,
  { n: 'Mina rasa',            price: 0,     targets: 10, T: 1.35, every: .8,  sh: ['#a8a29e', '#78716c', '#44403c'] },
  { n: 'Mina funda',           price: 600,   targets: 11, T: 1.3,  every: .76, sh: ['#d5d9de', '#9aa1aa', '#626973'] },
  { n: 'Caverna de cristais',  price: 2500,  targets: 12, T: 1.25, every: .72, sh: ['#e9d5ff', '#a855f7', '#6b21a8'] },
  { n: 'Mina profunda',        price: 6000,  targets: 13, T: 1.18, every: .68, sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'] },
  { n: 'Abismo',               price: 15000, targets: 14, T: 1.1,  every: .64, sh: ['#e2c4ff', '#9b5de5', '#5b2a99'] },
  { n: 'Coração da montanha',  price: 40000, targets: 15, T: 1.02, every: .6,  sh: ['#ffd1a8', '#e0571b', '#7a2a0e'] },
];
const MINE_CD = 150e3, GEM_CHANCE = .1, GEM_LEVEL = 3;  // mina reabre a cada 2:30 · chance de um veio ser gema (nível 3+)
const MINE_YIELD = [0, .5, 1, 2];                         // minério por acerto: Ok = 50% de chance de 1, Bom = 1, Perfeito = 2
// Bônus de um veio de minério que rendeu: estanho junto (se o veio não for de estanho) e, com Bom ou Perfeito, uma gema (mina nível 3+)
const TIN_BONUS = .25, GEM_BONUS = .06;
function mineBonus(o, q, g, gems, lv) {
  const ex = []; if (o.gem || !q) return ex;
  if (o.id !== 'estanho' && Math.random() < TIN_BONUS) ex.push({ id: 'estanho', q: 1 });
  if (g >= 2 && gems.length && Math.random() < GEM_BONUS) ex.push({ id: wpick(gems, x => gemWeight(x, lv)).id, gem: true, q: 1 });
  return ex;
}
// Fornalha: smelt = nível de minério que derrete · steel/arcane = chance, numa fundição perfeita, de ferro virar aço
// e de mithril virar adamantita/oricalco (como o ferro que vira aço no forno quente)
const FURNACES = [null,
  { n: 'Fornalha de barro', price: 0,     steel: 0,   arcane: 0,   fire: { p: '#e0571b', P: '#9a3412', q: '#fbbf24', w: '#fff6c9' } },   // laranja
  { n: 'Forno de tijolos',  price: 500,   steel: .1,  arcane: 0,   fire: { p: '#f2b01e', P: '#b45309', q: '#fde68a', w: '#ffffff' } },   // amarelo
  { n: 'Alto-forno',        price: 3000,  steel: .2,  arcane: .05, fire: { p: '#3b82f6', P: '#1e3a8a', q: '#7dd3fc', w: '#e0f2fe' } },   // azul
  { n: 'Forno arcano',      price: 12000, steel: .3,  arcane: .1,  fire: { p: '#a855f7', P: '#6b21a8', q: '#f0abfc', w: '#fdf4ff' } },   // roxo
];
// Ícone de fogo na cor da fornalha daquele nível
const flameImg = (lv, s = 4) => sprite('i_flame', NEUTRAL, s, 1, null, FURNACES[lv].fire);
const flameIco = lv => `<img class="ico" src="${flameImg(lv, 2)}" alt="">`;
const PERFECT_SMELT = .9;
// Receitas de liga, compradas em ordem na loja de melhorias (o bronze é o tutorial). fur = nível de fornalha exigido
// Toda liga leva estanho, sempre por último: o primeiro ingrediente é o metal principal (ícone do lote perdido)
const ALLOYS = [
  { id: 'bronze',     n: 'Liga de bronze',       inp: { cobre: 1, estanho: 1 },       fur: 1, price: 30 },
  { id: 'aco',        n: 'Processo de Bessemer', inp: { ferro: 2, estanho: 1 },       fur: 2, price: 600 },
  { id: 'adamantita', n: 'Liga arcana',          inp: { mithril: 1, prata: 1, estanho: 1 }, fur: 3, price: 6000 },
  { id: 'oricalco',   n: 'Liga solar',           inp: { mithril: 1, ouro: 1, estanho: 1 },  fur: 3, price: 9000 },
  { id: 'astralita',  n: 'Brasagem estelar',     inp: { adamantita: 1, oricalco: 1, estanho: 1 }, fur: 4, price: 30000 },
];
// Metal da loja liberado? (prata e ouro só depois da mina chegar ao nível deles)
const shopOpen = o => o.shop && S.up.supplier >= o.shop;
// Fornecedor: 1 = loja básica, sem reposição · 2 = desconto, mais materiais e reposição automática (até cap por material a cada vez) · 3 = tudo, sem limite
const SUPPLIERS = [null,
  { n: 'Fornecedor',          price: 0 },
  { n: 'Fornecedor regular',  price: 2500,  off: .2, cap: 20 },
  { n: 'Fornecedor real',     price: 30000, off: .2 },
];
const buyPrice = o => Math.round(o.buy * (1 - (SUPPLIERS[S.up.supplier].off || 0)));
const inpText = a => Object.entries(a.inp).map(([k, q]) => `${q} ${ore(k).n}`).join(' + ');
// Balcão: max = encomendas ao mesmo tempo · skin = aparência (classe cl-N no CSS e textura da frente)
const COUNTERS = [null,
  { n: 'Balcão simples',     max: 2, price: 0,     skin: 1 },
  { n: 'Balcão de carvalho', max: 3, price: 400,   skin: 2 },
  { n: 'Balcão de mogno',    max: 4, price: 1500,  skin: 5 },
  { n: 'Balcão de granito',  max: 5, price: 4000,  skin: 6 },
  { n: 'Balcão de mármore',  max: 6, price: 10000, skin: 3 },
  { n: 'Balcão real',        max: 7, price: 25000, skin: 4 },
];
const SLOT_PRICES = [null, 200, 400, 1000, 2500, 6000];  // preço para ter N espaços no leilão (o 1º abre o leilão)
const ALLOY_PRICE = 8000, JEWEL_PRICE = 1200;            // técnicas: forja composta e joalheria
/* Reforja (técnica): refaz uma peça do estoque para subir a raridade. Gasta metade (arredondada para cima) de cada material da peça.
   Só 1 vez por peça (2 com a bigorna e o martelo Estelares). A 1ª sobe 1 raridade, ou 2 com um bom ritmo; a 2ª sobe só 1 e é mais difícil.
   Falha = metade ou mais dos golpes em Ruim/Errou: a peça é destruída (se tiver runa, sobrevive, mas perde a runa). */
const REFORGE_PRICE = 5000, REFORGE_DIFF = [2, 4], REFORGE_GREAT = .75, REFORGE_FAIL = .5;
const reMax = () => stellar() ? 2 : 1, reLeft = it => reMax() - (it.rf || 0);
const reCost = it => Object.entries(counts(it.ores)).map(([o, q]) => [o, Math.ceil(q / 2)]);
// Resultado da reforja a partir dos golpes (pontos 0 a 4 cada): 'fail' ou quantas raridades sobe
const reResult = (hits, nth) => hits.filter(h => h <= 1).length >= hits.length * REFORGE_FAIL ? 'fail' : !nth && hits.reduce((a, b) => a + b, 0) / (4 * hits.length) >= REFORGE_GREAT ? 2 : 1;
const ALLOY_DIFF = 1.6, ALLOY_VALUE = .3;                // por metal diferente a mais: dificuldade e bônus de valor

const FOREST_CD = 120e3, FOREST_TREES = 8;               // floresta: rebrota a cada 2:00, 8 árvores por visita
const FOREST_YIELD = [0, .5, 1, 2];                      // madeira por corte: Ok = 50% de 1, Bom = 1, Perfeito = 2
const AUTO_SELL = .7, AUTO_EVERY = 3;                    // venda automática: 70% do valor, uma peça a cada 3 s
const AUTOBUY_EVERY = 180;                               // fornecedor nv.2+: confere os mínimos a cada 3 min

const NPCS = [['💂', 'Guarda Rui'], ['🛡️', 'Cavaleira Ana'], ['🏹', 'Caçador Téo'], ['👑', 'Lorde Bento'], ['⚔️', 'Mercenária Lia'], ['🧙', 'Mago Otto'], ['🏴‍☠️', 'Capitã Vera'], ['🧔', 'Lenhador Zé'], ['💃', 'Duquesa Inês']];
const ORDER_EVERY = 45e3, ORDER_MIN = 120, ORDER_MAX = 900;   // prazo da encomenda: sorteado entre 2 e 15 min
const maxOrders = () => COUNTERS[S.up.counter].max;

const ore = id => ORES.find(o => o.id === id), type = id => TYPES.find(t => t.id === id), rar = id => RARITY.find(r => r.id === id), gemOf = id => GEMS.find(g => g.id === id);
const rIdx = id => RARITY.findIndex(r => r.id === id);
const isJ = o => !!ore(o).jewel, tJ = t => !!type(t).jewel;
// Categoria do material e da peça: metal comum, metal de joia, madeira ou ingrediente (estanho)
const oCat = o => { const x = ore(o); return x.wood ? 'wood' : x.ingr ? 'ingr' : x.jewel ? 'jewel' : 'metal'; };
const tCat = t => { const T = type(t); return T.mixWood ? 'mix' : T.wood ? 'wood' : T.jewel ? 'jewel' : 'metal'; };
const usesOf = (t, lvl) => type(t).uses + lvl - 1;
const gemsB = (t, gems) => (gems || []).reduce((a, g) => a + gemOf(g).b, 0) * (tCat(t) !== 'metal' ? 1 : .5);
const gemsQ = gems => Math.min(GEM_Q_MAX, (gems || []).reduce((a, g) => a + gemOf(g).q, 0));
const valueOf = (t, lvl, ores, r, gems, rune) => Math.round((ores.reduce((a, o) => a + ore(o).cost, 0) * 1.6 + type(t).base) * LEVELS[lvl].m * rar(r).m * (1 + ALLOY_VALUE * mixN(ores)) * (1 + gemsB(t, gems)) * (1 + (rune ? RUNE_G[rune].v : 0)));
const moldPrice = (t, lvl) => Math.round(LEVELS[lvl].price * type(t).pf);
// Dificuldade: grau médio dos metais + nível do molde + quantidade de material + tipo de peça + liga
const diffOf = (t, lvl, ores) => ores.reduce((a, o) => a + ore(o).tier, 0) / ores.length * .55 + (lvl - 1) * 1.1 + ores.length * .35 + type(t).df + mixN(ores) * ALLOY_DIFF;
const oresName = ores => { const met = uniq(ores.filter(o => !ore(o).wood)), wd = uniq(ores.filter(o => ore(o).wood));
  if (met.length && wd.length) return 'de ' + met.map(o => ore(o).n).join('-') + ' e ' + wd.map(o => ore(o).n).join('-');
  const u = uniq(ores); return u.length === 1 ? 'de ' + ore(u[0]).n : 'de liga ' + u.map(o => ore(o).n).join('-'); };
// Nome: 'peça' [nível] de 'metal' [rúnica] [com 'gema']. O adjetivo concorda com o gênero da peça (g: 0 masc., 1 fem., 2 fem. plural)
const RUNIC = ['rúnico', 'rúnica', 'rúnicas'];
const nameOf = (t, lvl, ores, gems, rune) => { const T = type(t); const gs = (gems || []).filter(Boolean).map(g => gemOf(g).n); return T.n + (lvl > 1 ? ' ' + LEVELS[lvl].adj[T.g] : '') + ' ' + oresName(ores) + (rune ? ' ' + RUNIC[T.g] : '') + (gs.length ? ' com ' + (gs.length > 1 ? gs.slice(0, -1).join(', ') + ' e ' + gs[gs.length - 1] : gs[0]) : ''); };
// Cores da peça: um metal = cores dele; liga = mistura (claro do 1º, médio do 2º, escuro do último)
const shadesOf = ores => { const met = ores.filter(o => !ore(o).wood), u = uniq(met.length ? met : ores).map(ore); return u.length === 1 ? u[0].sh : [u[0].sh[0], u[1].sh[1], u[u.length - 1].sh[2]]; };
const itemName = it => nameOf(it.t, it.lvl, it.ores, it.gems, it.rune);
const itemValue = it => valueOf(it.t, it.lvl, it.ores, it.r, it.gems, it.rune);
const woodPal = ores => { const w = ores.find(o => ore(o).wood); return w ? { b: ore(w).sh[1], c: ore(w).sh[2] } : null; };
const itemImg = (it, s = 4) => sprite(it.t, shadesOf(it.ores), s, it.lvl, it.gems?.length ? gemOf(it.gems[0]).sh[1] : null, type(it.t).mixWood ? woodPal(it.ores) : null);
const moldImg = (t, lvl, s = 4) => sprite(t, type(t).wood ? WOODN : NEUTRAL, s, lvl);
const ingotImg = (o, s = 4) => sprite(ore(o).wood ? 'log' : 'ingot', ore(o).sh, s);
const rawImg = (o, s = 4) => sprite('raw', ore(o).sh, s);
const gemImg = (g, s = 4) => sprite('gem_' + g, gemOf(g).sh, s);
const anvilImg = (lv, s = 6) => sprite('anvil', ANVILS[lv].sh, s, lv);
const hammerImg = (lv, s = 3) => sprite('hammer', HAMMERS[lv].sh, s, lv);
const pickImg = (lv, s = 3) => sprite('pick', MINES[lv].sh, s, lv);

/* ======================= Recompensas (objetivos com prêmio) =======================
   Os prêmios em material só dão o que o jogador já consegue obter naquele ponto (floresta nv.1, fornecedor nv.1) */
// p(state) → [atual, meta] · rw = recompensa (moedas e/ou minérios)
const MISSIONS = [
  { id: 'm1',  n: 'Entregue a primeira encomenda',  p: s => [s.stats.orders, 1],          rw: { o: { cobre: 4 } } },
  { id: 'm2',  n: 'Desça na mina',                  p: s => [s.stats.mines, 1],           rw: { c: 15 } },
  { id: 'm2b', n: 'Derreta 5 minérios na fornalha', p: s => [s.stats.smelted, 5],         rw: { c: 20 } },
  { id: 'm2c', n: 'Faça bronze na fornalha (tutorial de ligas)', p: s => [s.stats.made.bronze || 0, 1], rw: { o: { estanho: 2, cobre: 2 } } },
  { id: 'm3',  n: 'Forje 3 peças',                  p: s => [s.stats.forged, 3],          rw: { c: 15 } },
  { id: 'm4',  n: 'Venda uma peça no leilão',       p: s => [s.stats.auctions, 1],        rw: { c: 25 } },
  { id: 'm5',  n: 'Compre 5 lingotes na loja',              p: s => [s.stats.oreBought, 5],       rw: { o: { ferro: 2 } } },
  { id: 'm6',  n: 'Forje uma peça Rara ou melhor',  p: s => [s.stats.best >= 2 ? 1 : 0, 1], rw: { c: 40 } },
  { id: 'm7',  n: 'Compre um molde',                p: s => [s.stats.molds, 1],           rw: { c: 60 } },
  { id: 'm8',  n: 'Entregue 5 encomendas',          p: s => [s.stats.orders, 5],          rw: { c: 80 } },
  { id: 'm9',  n: 'Compre uma melhoria',            p: s => [s.stats.ups, 1],             rw: { c: 120 } },
  { id: 'm9b', n: 'Faça aço (Bessemer ou forno quente)', p: s => [s.stats.made.aco || 0, 1], rw: { c: 150 } },
  { id: 'm10', n: 'Forje com Aço',                  p: s => [s.stats.used.includes('aco') ? 1 : 0, 1], rw: { c: 100 } },
  { id: 'm11', n: 'Forje uma joia',                 p: s => [s.stats.jewels, 1],          rw: { c: 150 } },
  { id: 'm12', n: 'Forje uma peça Épica ou melhor', p: s => [s.stats.best >= 3 ? 1 : 0, 1], rw: { c: 200 } },
  { id: 'm12a', n: 'Corte 10 madeiras na floresta',   p: s => [s.stats.chops, 10],          rw: { c: 80 } },
  { id: 'm12c', n: 'Faça um arco',                   p: s => [s.stats.bows, 1],            rw: { o: { freixo: 2 } } },
  { id: 'm12b', n: 'Entalhe um cajado',             p: s => [s.stats.staffs, 1],          rw: { o: { freixo: 3 } } },
  { id: 'm13', n: 'Encrave uma gema',               p: s => [s.stats.gemsSet, 1],         rw: { c: 300 } },
  { id: 'm14', n: 'Ganhe 2000 moedas no total',     p: s => [s.stats.earned, 2000],       rw: { o: { ferro: 5 } } },
  { id: 'm15', n: 'Entregue 20 encomendas',         p: s => [s.stats.orders, 20],         rw: { c: 400 } },
  { id: 'm16', n: 'Forje uma peça Lendária',        p: s => [s.stats.best >= 4 ? 1 : 0, 1], rw: { c: 1500 } },
  { id: 'm17b', n: 'Tenha um molde Mítico',        p: s => [Math.max(...Object.values(s.molds)) >= 5 ? 1 : 0, 1], rw: { c: 4000 } },
  { id: 'm17', n: 'Tenha um molde Magistral',       p: s => [Math.max(...Object.values(s.molds)) >= 4 ? 1 : 0, 1], rw: { c: 1000 } },
  { id: 'm18', n: 'Forje uma liga',                 p: s => [s.stats.alloys, 1],          rw: { c: 2500 } },
  { id: 'm19', n: 'Chegue ao Abismo',               p: s => [s.up.mine >= 5 ? 1 : 0, 1], rw: { c: 3000 } },
  { id: 'm20', n: 'Forje com Oricalco',             p: s => [s.stats.used.includes('oricalco') ? 1 : 0, 1], rw: { c: 3000 } },
  { id: 'm20c', n: 'Forje um flintlock',              p: s => [s.stats.pistols || 0, 1],    rw: { c: 50000 } },
  { id: 'm20b', n: 'Obtenha Astralita',            p: s => [s.stats.made.astralita || 0, 1], rw: { c: 15000 } },
  { id: 'm22', n: 'Grave uma runa na mesa de runas', p: s => [s.stats.runes || 0, 1],   rw: { c: 10000 } },
  { id: 'm23', n: 'Forje uma peça com runa',        p: s => [s.stats.runed || 0, 1],   rw: { c: 15000 } },
  { id: 'm21', n: 'Forje uma peça Única',           p: s => [s.stats.best >= 5 ? 1 : 0, 1], rw: { c: 10000 } },
];
const rwText = rw => [rw.c ? rw.c + ' moedas' : '', ...Object.entries(rw.o || {}).map(([k, v]) => v + ' ' + ore(k).n)].filter(Boolean).join(' + ');
const missionDone = m => { const [a, b] = m.p(S); return a >= b; };

/* ======================= Encomendas ======================= */
function genOrder(s, fixed) {
  // só pede madeira que a sua floresta dá (ou que você já tem guardada)
  const seen = ORES.filter(o => s.seen.includes(o.id) && !o.ingr && (!o.wood || o.fl <= s.up.forest || s.ores[o.id] > 0)), has = c => seen.some(o => oCat(o.id) === c);
  const gemsOk = GEMS.filter(g => (s.up.mine >= GEM_LEVEL && g.mine <= s.up.mine) || s.gems[g.id] > 0);
  const owned = TYPES.filter(t => s.molds[t.id] >= 1 && (t.mixWood ? has('metal') && has('wood') : has(tCat(t.id))) && (!t.gemReq || gemsOk.length));
  const t = fixed?.t || pick(owned).id, T = type(t), best = p => (Math.random() < .6 ? p[p.length - 1] : pick(p)).id;   // prefere o melhor material que você já tem
  const o = fixed?.ore || best(seen.filter(x => oCat(x.id) === (T.mixWood ? 'metal' : tCat(t)))), wood = T.mixWood ? best(seen.filter(x => x.wood)) : null;
  const maxL = s.molds[t], lvl = fixed?.lvl || (maxL > 1 && Math.random() < .45 ? irand(2, maxL) : 1);
  const w = Math.random() * 100, r = fixed?.r || (w < 50 ? 'comum' : w < 80 ? 'incomum' : w < 95 ? 'raro' : 'epico');
  // Extras: gema específica (quase sempre no cajado, bastante em joias, às vezes nas outras peças) e runa (só com a mesa de runas)
  const gem = !fixed && gemsOk.length && Math.random() < (T.gemReq ? .7 : T.jewel ? .45 : .12) ? wpick(gemsOk, g => g.w).id : null;
  const rmax = s.up.runes ? RUNE_UP[s.up.runes].max : 0, rune = !fixed && rmax && runeOk(t) && Math.random() < .2 ? irand(1, Math.max(1, rmax - 1)) : null;
  const ord = { t, lvl, ore: o, wood, r, gem, rune };
  const reward = Math.round(valueOf(t, lvl, orderOres(ord), r, gem ? [gem] : [], rune) * 1.3), dur = rand(ORDER_MIN, ORDER_MAX) * 1000, now = Date.now(), [e, npc] = pick(NPCS);
  return { id: now.toString(36) + Math.random().toString(36).slice(2, 5), e, npc, ...ord, reward, bonus: Math.round(reward * .5), t0: now, dl: now + dur, fast: now + dur * .4 };
}
// Materiais da peça pedida (nas peças com cabo, os últimos espaços são da madeira pedida)
const orderOres = o => { const n = usesOf(o.t, o.lvl), mw = o.wood ? type(o.t).mixWood : 0; return Array.from({ length: n }, (_, i) => i >= n - mw ? o.wood : o.ore); };
// Peça que serve: mesmo tipo, feita só do metal (e da madeira) pedidos, nível e raridade iguais ou melhores
const fits = (it, o) => it.t === o.t && it.lvl >= o.lvl && rIdx(it.r) >= rIdx(o.r) && it.ores.every(x => x === (o.wood && ore(x).wood ? o.wood : o.ore));
// Gema e runa pedidas são opcionais: sem elas a entrega vale, mas paga menos
const hasGem = (it, o) => !o.gem || (it.gems || []).includes(o.gem), hasRune = (it, o) => !o.rune || (it.rune || 0) >= o.rune;
const missing = (it, o) => !hasGem(it, o) + !hasRune(it, o);
const orderPay = (o, it) => !missing(it, o) ? o.reward : Math.round(valueOf(o.t, o.lvl, orderOres(o), o.r, o.gem && hasGem(it, o) ? [o.gem] : [], o.rune && hasRune(it, o) ? o.rune : 0) * 1.3 * ORDER_PENALTY);
// A melhor peça do estoque para a encomenda: primeiro as completas; entre elas, a de menor valor (para não gastar à toa uma melhor)
const matchFor = o => S.stock.filter(it => fits(it, o)).sort((a, b) => missing(a, o) - missing(b, o) || itemValue(a) - itemValue(b))[0];
const orderName = o => nameOf(o.t, o.lvl, orderOres(o), o.gem ? [o.gem] : [], o.rune);
const orderImg = (o, s = 4) => itemImg({ t: o.t, lvl: o.lvl, ores: orderOres(o), gems: o.gem ? [o.gem] : [] }, s);

/* ======================= Estado salvo ======================= */
const KEY = 'piratinha-smithing';
function fresh() {
  const molds = Object.fromEntries(TYPES.map(t => [t.id, START_MOLDS.includes(t.id) ? 1 : 0]));
  const s = {
    v: 11, coins: 0, ores: { cobre: 5, bronze: 2, pinho: 4 }, raw: {}, gems: {}, molds, msel: { ...molds }, stock: [], orders: [], nextOrder: 0, auction: [], claimed: [],
    seen: ['cobre', 'bronze', 'pinho'], up: { anvil: 1, hammer: 1, slots: 0, mine: 1, counter: 1, furnace: 1, alloys: 0, alloy: false, jewel: false, reforge: false, helper: 0, supplier: 1, forest: 1, armory: 0, workshop: 0, runes: 0 }, auto: false, autoSell: { r: [true, true, true, true, false, false], gems: false, runes: false }, helpAt: 0, autoBuy: {}, mineAt: 0, forestAt: 0, runeAt: 0, runes: {}, cheat: false,
    stats: { forged: 0, best: -1, orders: 0, auctions: 0, molds: 0, ups: 0, alloys: 0, jewels: 0, gemsSet: 0, mines: 0, smelted: 0, lost: 0, made: {}, staffs: 0, chops: 0, bows: 0, oreBought: 0, earned: 0, used: [], runes: 0, runed: 0 },
  };
  s.orders.push(genOrder(s, { t: 'gloves', ore: 'bronze', r: 'comum', lvl: 1 }));
  s.nextOrder = Date.now() + ORDER_EVERY;
  return s;
}
let S;
// Saves antigos (v8 a v10) ganham os campos novos sem perder nada do que já foi liberado
function migrate(d) {
  const u = d.up;
  u.helper = +u.helper || 0;
  u.forest ??= TYPES.some(t => t.wood && d.molds[t.id] >= 1);
  u.armory ??= d.molds.longsword ? 1 : 0;   // numeração antiga (v8/v9); convertida logo abaixo
  u.workshop ??= d.molds.pistol ? 3 : d.molds.staff ? 2 : d.molds.bow ? 1 : 0;
  u.runes ??= 0; d.runes ??= {}; d.runeAt ??= 0; d.cheat ??= false; d.stats.runes ??= 0; d.stats.runed ??= 0;
  TYPES.forEach(t => { d.molds[t.id] ??= 0; d.msel[t.id] ??= d.molds[t.id]; });
  WORKSHOP.slice(1, u.workshop + 1).forEach(W => { if (!d.molds[W.t]) d.molds[W.t] = d.msel[W.t] = 1; });
  if (d.v < 10) {
    // v10: floresta e lança iniciais; a Armaria passou a ter 3 níveis (espada/machado → maça/alabarda → espada longa/machado de guerra).
    // Nenhum molde já comprado se perde: quem tinha a Armaria antiga nv.2 fica com tudo (nv.3); a nv.1 antiga vira a nv.1 nova
    u.forest = true;
    if (!d.molds.spear) d.molds.spear = d.msel.spear = 1;
    u.armory = u.armory >= 2 ? 3 : u.armory === 1 || (d.molds.sword && d.molds.axe) ? 1 : 0;
    ARMORY.slice(1, u.armory + 1).forEach(A => A.types.forEach(id => { if (!d.molds[id]) d.molds[id] = d.msel[id] = 1; }));
    // Encomendas abertas de armas que agora levam cabo passam a pedir uma madeira comum
    d.orders.forEach(o => { if (type(o.t).mixWood && !o.wood) o.wood = 'pinho'; });
  }
  if (d.v < 11) {
    // v11: floresta e fornecedor em níveis; balcão com 6 níveis (os antigos mármore e real viram nv.5 e nv.6, pela aparência)
    u.forest = 1; u.supplier = u.supplier ? 2 : 1; u.counter = [1, 1, 2, 5, 6][u.counter] || 1;
  }
  u.reforge ??= false;
  d.autoSell ??= { r: [true, true, true, true, false, false], gems: false, runes: false }; d.helpAt ??= 0;
  d.v = 11; return d;
}
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v >= 8 && d.v <= 11) return migrate(d); } catch {} return null; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
S = load() || fresh();
const see = id => { if (!S.seen.includes(id)) S.seen.push(id); };

/* ======================= Som ======================= */
let ac;
function tone(f, d = .15, type = 'square', v = .06, delay = 0) {
  try {
    ac ||= new AudioContext(); const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .5, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d);
  } catch {}
}
// Ruído curto filtrado (pedra rachando, madeira, cascalho)
function noise(d = .12, v = .08, f = 1800) {
  try {
    ac ||= new AudioContext(); const n = ac.sampleRate * d | 0, b = ac.createBuffer(1, n, ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const src = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
    fl.type = 'bandpass'; fl.frequency.value = f; src.buffer = b; g.gain.value = v; src.connect(fl).connect(g).connect(ac.destination); src.start();
  } catch {}
}
const SFX = {
  crack: g => { noise(.1 + g * .03, .05 + g * .02, [500, 1200, 1800, 2600][g]); if (g === 3) { tone(1568, .25, 'triangle', .05, .02); tone(2093, .3, 'sine', .04, .08); } },
  tick: () => tone(1500 + Math.random() * 500, .05, 'square', .018),
  hit: pts => [() => tone(160, .15, 'sawtooth', .05), () => tone(520, .15, 'triangle', .08), () => tone(950, .2, 'triangle', .1), () => { tone(1200, .25, 'triangle', .11); tone(1800, .15, 'sine', .04); }, () => { tone(1400, .3, 'triangle', .12); tone(2100, .25, 'sine', .05); }][pts](),
  place: () => tone(600, .06, 'square', .03),
  coin: () => { tone(1200, .08, 'square', .04); tone(1700, .12, 'square', .04, .07); },
  buy: () => { tone(500, .08, 'square', .04); tone(380, .1, 'square', .04, .06); },
  done: () => { tone(800, .1, 'triangle', .08); tone(1200, .1, 'triangle', .08, .1); tone(1600, .25, 'triangle', .08, .2); },
  no: () => tone(140, .2, 'square', .05),
  pick: g => tone([110, 300, 420, 560][g], .12, 'square', .06),
};

/* ======================= Telas ======================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
const hasProgress = () => S.stats.forged > 0 || S.stats.oreBought > 0 || S.stats.mines > 0;
function menuLabel() { $('#play').textContent = hasProgress() ? '▶ Continuar' : '▶ Jogar'; }
$('#menu-anvil').src = sprite('anvil', ANVIL, 8);
$('#menu-hammer').src = sprite('hammer', HAMMERS[1].sh, 4);
// Cenário: texturas em pixel art (tijolos, madeira) e brasas subindo no menu e na forja
for (const k in TEX) document.documentElement.style.setProperty('--tex-' + k, TEX[k]());
document.querySelectorAll('.embers').forEach(d => {
  for (let i = 0; i < +d.dataset.n; i++) {
    const e = document.createElement('i');
    e.style.cssText = `--x:${rand(8, 92).toFixed(1)}%;--s:${pick([2, 2, 4])}px;--c:${pick(['#ff8a3d', '#fbbf24', '#ffb347', '#e0571b'])};--d:${rand(3.5, 8).toFixed(2)}s;--dl:-${rand(0, 8).toFixed(2)}s;--dx:${irand(-50, 50)}px;--dy:-${irand(160, 420)}px`;
    d.append(e);
  }
});
$('#play').onclick = () => { show('game'); renderAll(); };

/* ======================= Arrastar ======================= */
/* sel.ores tem um espaço por lingote que o molde usa · sel.gems um espaço por gema · sel.re = id da peça sendo reforjada */
const sel = { t: null, ores: [null], gems: [], rune: null, re: null };
let forging = null;
const curLvl = () => sel.t ? S.msel[sel.t] : 1;
const need = () => sel.t ? usesOf(sel.t, curLvl()) : 1;
const busy = () => forging || mine || fur || forest || runeGame;

// Onde a peça foi solta: um espaço de minério, a bigorna, o leilão ou uma peça do estoque
function dropTarget(ev) {
  const el = document.elementFromPoint(ev.clientX, ev.clientY); if (!el) return null;
  const slot = el.closest('.slot.ore'); if (slot) return { zone: 'anvil', slot: +slot.dataset.i };
  const gsl = el.closest('.slot.gemslot'); if (gsl) return { zone: 'anvil', gslot: +gsl.dataset.i };
  if (el.closest('#counter')) return { zone: 'counter' };
  if (el.closest('#anvil-area')) return { zone: 'anvil' };
  if (el.closest('#auction')) return { zone: 'auction' };
  const st = el.closest('.st-slot'); if (st) return { zone: 'stock', id: st.dataset.id };
  return null;
}
function draggable(el, img, onDrop, onClick) {
  el.addEventListener('pointerdown', e => {
    if (busy() || e.button !== 0 || e.target.closest('button')) return; e.preventDefault();
    const sx = e.clientX, sy = e.clientY; let ghost = null;
    const mark = t => { $('#anvil-area').classList.toggle('over', t?.zone === 'anvil'); $('#auction').classList.toggle('over', t?.zone === 'auction'); $('#counter').classList.toggle('over', t?.zone === 'counter'); document.querySelectorAll('.slot.ore').forEach(s => s.classList.toggle('target', t?.slot === +s.dataset.i)); };
    const mv = ev => {
      if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { ghost = new Image(); ghost.src = img(); ghost.className = 'ghost-drag'; document.body.append(ghost); $('#tooltip').hidden = true; }
      if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; mark(dropTarget(ev)); }
    };
    const up = ev => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); mark(null);
      if (ghost) { ghost.remove(); onDrop(dropTarget(ev)); } else onClick?.();
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  });
}
const nope = msg => { SFX.no(); toast(msg); };
// Sem a forja composta, um material preenche todos os espaços da mesma categoria. Com ela, cada espaço pode ter um diferente.
function placeOre(id, slot) {
  if (sel.re) clearAnvil();
  const oc = oCat(id);
  if (oc === 'ingr') return nope(`${ore(id).n} é mole demais para forjar: use-o na fornalha para fazer bronze.`);
  const n = need(), cats = Array.from({ length: n }, (_, i) => sel.t ? slotCatOf(sel.t, n, i) : oc);
  if (!cats.includes(oc)) return nope({ wood: 'Arcos e cajados só usam madeira.', jewel: 'Anéis e amuletos só usam Prata ou Ouro.', mix: 'Esta peça usa metal comum e madeira (cabo ou coronha).' }[tCat(sel.t)] || (oc === 'wood' ? 'Madeira só serve para arcos, cajados, cabos e coronhas.' : `${ore(id).n} só serve para anéis e amuletos.`));
  if (!sel.t && sel.ores.some(o => o && oCat(o) !== oc)) sel.ores = Array(n).fill(null);
  const idx = cats.map((c, i) => c === oc ? i : -1).filter(i => i >= 0);
  if (!S.up.alloy) idx.forEach(i => sel.ores[i] = id);
  else if (slot != null && cats[slot] === oc) sel.ores[slot] = id;
  else { const e = idx.find(i => !sel.ores[i]); if (e == null) idx.forEach(i => sel.ores[i] = id); else sel.ores[e] = id; }
  SFX.place(); renderSlots(); renderLists();
}
// Ajusta os espaços ao molde/nível atual, mantendo o que ainda couber na categoria certa
function fitOres() {
  const n = need(), old = sel.ores;
  if (!sel.t) sel.ores = Array(n).fill(old.find(Boolean) || null);
  else sel.ores = Array.from({ length: n }, (_, i) => {
    const c = slotCatOf(sel.t, n, i);
    if (S.up.alloy) return old[i] && oCat(old[i]) === c ? old[i] : null;
    return old.find(o => o && oCat(o) === c) || null;
  });
  const ng = sel.t ? gemSlots(sel.t, curLvl()) : 0;
  sel.gems = Array.from({ length: ng }, (_, i) => sel.gems[i] ?? null);
}
function placeMold(t) { if (sel.re) clearAnvil(); sel.t = t; fitOres(); if (!runeOk(t)) sel.rune = null; leftTab = tCat(t) === 'wood' ? 'woods' : 'metals'; SFX.place(); renderSlots(); renderLists(); }
function placeGem(g, slot) {
  if (!sel.t) return nope('Coloque primeiro um molde na bigorna (ou arraste a gema para uma peça do estoque).');
  const i = slot != null && slot < sel.gems.length ? slot : sel.gems.indexOf(null);
  sel.gems[i < 0 ? sel.gems.length - 1 : i] = g; SFX.place(); renderSlots(); renderLists();
}
function placeRune(g) {
  if (!sel.t || sel.re) return nope('Coloque primeiro um molde na bigorna: a runa entra na hora de forjar.');
  if (!runeOk(sel.t)) return nope('Runas só servem em armaduras e armas, não em joias.');
  sel.rune = g; SFX.place(); renderSlots(); renderLists();
}
function placeReforge(id) {
  const it = S.stock.find(x => x.id === id); if (!it) return;
  if (!S.up.reforge) return nope('Requer a técnica Reforja.');
  if (rIdx(it.r) >= RARITY.length - 1) return nope('Peça Única não reforja.');
  if (reLeft(it) <= 0) return nope('Peça já reforjada.');
  sel.re = id; sel.t = null; sel.ores = []; sel.gems = []; sel.rune = null; SFX.place(); renderSlots(); renderLists(); }
function clearAnvil() { sel.re = null; sel.t = null; sel.ores = [null]; sel.gems = []; sel.rune = null; }
// Encrava uma gema numa joia já pronta do estoque
function embedGem(itemId, g) {
  const it = S.stock.find(x => x.id === itemId);
  if (!it) return;
  if ((it.gems || []).length >= gemSlots(it.t, it.lvl)) return nope(`Esta peça já tem ${gemSlots(it.t, it.lvl) > 1 ? 'todas as gemas que cabem' : 'uma gema'}.`);
  if (!(S.gems[g] > 0)) return nope('Você não tem essa gema.');
  S.gems[g]--; it.gems = [...(it.gems || []), g]; S.stats.gemsSet++; save(); SFX.done();
  toast(`<img src="${itemImg(it, 3)}"> ${esc(itemName(it))} · valor ${itemValue(it)}`); renderAll();
}

/* ======================= Listas laterais ======================= */
let leftTab = 'metals', shownTab = null;
document.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => { leftTab = b.dataset.tab; renderLists(); });
const woodUnlocked = () => TYPES.some(t => (t.wood || t.mixWood) && S.molds[t.id] >= 1);
const gemsUnlocked = () => S.up.mine >= GEM_LEVEL || GEMS.some(g => S.gems[g.id] > 0) || S.stats.gemsSet > 0;
const hasWood = () => ORES.some(o => o.wood && S.ores[o.id] > 0);
const hasGems = () => GEMS.some(g => S.gems[g.id] > 0);
/* Painel da esquerda, em grade:
   sem madeira/gemas liberadas:  [Metais] [Forja]
   com madeira ou gemas:         [Metais] [Madeira]
                                 [Forja]  [Gemas]
   Madeira e Gemas só aparecem quando liberadas, e ficam desabilitadas se estiverem vazias. */
function renderLists() {
  const ol = $('#ores'); ol.innerHTML = '';
  ol.classList.toggle('fresh', shownTab !== leftTab); shownTab = leftTab;
  const rawTotal = Object.values(S.raw).reduce((a, b) => a + b, 0), wOn = woodUnlocked(), gOn = gemsUnlocked(), grid = wOn || gOn;
  $('#raw-n').innerHTML = rawTotal ? flameIco(S.up.furnace) + rawTotal : '';
  const tab = id => $(`.ptabs [data-tab=${id}]`), place = (id, r, c) => { tab(id).style.gridRow = r; tab(id).style.gridColumn = c; };
  tab('woods').hidden = !wOn; tab('woods').disabled = !hasWood();
  tab('gems').hidden = !gOn; tab('gems').disabled = !hasGems();
  if (grid) { place('metals', 1, 1); place('woods', 1, 2); place('raw', 2, 1); place('gems', 2, 2); }
  else { place('metals', 1, 1); place('raw', 1, 2); }
  if ((leftTab === 'woods' && (!wOn || !hasWood())) || (leftTab === 'gems' && (!gOn || !hasGems()))) leftTab = 'metals';
  document.querySelectorAll('.ptabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === leftTab));
  $('#buy-ores').textContent = leftTab === 'woods' ? '+ Comprar madeiras' : '+ Comprar metais';
  if (leftTab === 'woods') renderMats(ol, true);
  else if (leftTab === 'gems') renderGems(ol);
  else if (leftTab === 'raw') renderFurnaceList(ol);
  else renderMats(ol, false);
  renderMolds();
}
function renderMats(ol, woods) {
  const list = ORES.filter(o => S.seen.includes(o.id) && !!o.wood === woods);
  if (!list.length) ol.insertAdjacentHTML('beforeend', `<div class="empty">${woods ? 'Sem madeira ainda.<br>Corte na 🌲 floresta (botão no topo) ou compre na loja.' : 'Sem metais.'}</div>`);
  list.forEach(o => {
    const n = S.ores[o.id] || 0, c = document.createElement('div');
    c.className = 'card' + (n ? '' : ' out') + (sel.ores.includes(o.id) ? ' picked' : '');
    c.innerHTML = `<img src="${ingotImg(o.id)}" alt=""><div><b>${o.n}</b><small>${o.wood ? `madeira grau ${o.tier}` : o.ingr ? 'só para ligas' : `grau ${o.tier}${o.jewel ? ' · joias' : ''}`}</small></div><span class="qty">×${n}</span>`;
    draggable(c, () => ingotImg(o.id), t => { if (t?.zone === 'anvil') placeOre(o.id, t.slot); }, () => placeOre(o.id));
    ol.append(c);
  });
}
function renderGems(ol) {
  GEMS.filter(g => S.gems[g.id] > 0).forEach(g => {
    const c = document.createElement('div'); c.className = 'card gem' + (sel.gems.includes(g.id) ? ' picked' : '');
    c.innerHTML = `<img src="${gemImg(g.id)}" alt=""><div><b>${g.n}</b><small>+${Math.round(g.b * 100)}% joias · +${Math.round(g.q * 100)}% sorte</small></div><span class="qty">×${S.gems[g.id]}</span>`;
    draggable(c, () => gemImg(g.id), t => { if (t?.zone === 'anvil') placeGem(g.id, t.gslot); else if (t?.zone === 'stock') embedGem(t.id, g.id); }, () => placeGem(g.id));
    ol.append(c);
  });
}
// Forno (abaixo dos metais): minério bruto da mina e ligas liberadas
function renderFurnaceList(ol) {
    const raws = ORES.filter(o => S.raw[o.id] > 0), F = FURNACES[S.up.furnace];
    ol.insertAdjacentHTML('beforeend', `<div class="sec">${flameIco(S.up.furnace)} Forno · ${F.n}</div>`);
    if (!raws.length) ol.insertAdjacentHTML('beforeend', '<div class="empty" style="padding:8px">Sem minério. Vá à ⛏ mina.</div>');
    raws.forEach(o => {
      const ok = S.up.furnace >= o.smelt, c = document.createElement('div'); c.className = 'card' + (ok ? '' : ' out'); c.style.cursor = 'pointer';
      c.innerHTML = `<img src="${rawImg(o.id)}" alt=""><div><b>${o.n}</b><small>${ok ? 'minério bruto' : '🔒 ' + FURNACES[o.smelt].n}</small></div><span class="qty">×${S.raw[o.id]}</span>`;
      c.onclick = () => ok ? openFurnace(o.id) : nope(`Minério de ${o.n} precisa de ${FURNACES[o.smelt].n} (loja de melhorias).`); ol.append(c);
    });
    const al = ALLOYS.slice(0, S.up.alloys);
    if (al.length) ol.insertAdjacentHTML('beforeend', '<div class="sec">Ligas</div>');
    al.forEach(a => {
      const ok = S.up.furnace >= a.fur, can = Object.entries(a.inp).every(([k, q]) => (S.ores[k] || 0) >= q), c = document.createElement('div');
      c.className = 'card' + (ok && can ? '' : ' out'); c.style.cursor = 'pointer';
      c.innerHTML = `<img src="${ingotImg(a.id)}" alt=""><div><b>${ore(a.id).n}</b><small>${ok ? inpText(a) : '🔒 ' + FURNACES[a.fur].n}</small></div><span class="qty">⚗</span>`;
      c.onclick = () => !ok ? nope(`${a.n} precisa de ${FURNACES[a.fur].n}.`) : !can ? nope(`Faltam metais: ${inpText(a)}.`) : openFurnace(a.id, a);
      ol.append(c);
    });
    if (!al.length) ol.insertAdjacentHTML('beforeend', '<div class="empty" style="padding:8px">Compre a <b>Liga de bronze</b> na loja de melhorias para fazer sua primeira liga.</div>');
}
// Moldes que você tem: um cartão por tipo, com ◀ ▶ para escolher o nível
function renderMolds() {
  const ml = $('#molds'); ml.innerHTML = '';
  GROUPS.forEach(([g, gn]) => TYPES.filter(T => T.grp === g && S.molds[T.id] >= 1).forEach((T, i) => {
    if (!i) ml.insertAdjacentHTML('beforeend', `<div class="sec">${gn}</div>`);
    const max = S.molds[T.id], lv = S.msel[T.id] = clamp(S.msel[T.id] || 1, 1, max), c = document.createElement('div');
    c.className = 'card' + (sel.t === T.id ? ' picked' : '');
    c.innerHTML = `<img src="${moldImg(T.id, lv)}" alt=""><div><b>${T.n}</b><small>${LEVELS[lv].n} · usa ${usesOf(T.id, lv)}${T.gemReq ? ` + ${gemSlots(T.id, lv) > 1 ? gemSlots(T.id, lv) + ' gemas' : 'gema'}` : ''}</small></div>` +
      (max > 1 ? `<span class="lv"><button data-d="-1" ${lv <= 1 ? 'disabled' : ''}>◀</button><button data-d="1" ${lv >= max ? 'disabled' : ''}>▶</button></span>` : '');
    c.querySelectorAll('.lv button').forEach(b => b.onclick = () => { if (busy()) return; S.msel[T.id] = clamp(lv + +b.dataset.d, 1, max); save(); if (sel.t === T.id) fitOres(); renderLists(); renderSlots(); });
    draggable(c, () => moldImg(T.id, S.msel[T.id]), t => { if (t?.zone === 'anvil') placeMold(T.id); }, () => placeMold(T.id));
    ml.append(c);
  }));
}
$('#buy-ores').onclick = () => openModal('ores', leftTab === 'woods' ? 'woods' : 'metals');
$('#buy-molds').onclick = () => openModal('molds');
$('#ency').onclick = () => openModal('ency', 'mat');

/* ======================= Bigorna ======================= */
function renderTools() { $('#anvil').src = anvilImg(S.up.anvil); $('#hammer').src = hammerImg(S.up.hammer); }
const counts = a => a.reduce((m, o) => (o && (m[o] = (m[o] || 0) + 1), m), {});
function renderSlots() {
  const os = $('#ore-slots'), st = $('#slot-t'), gs = $('#gem-slots'), tip = $('#tip');
  os.innerHTML = ''; st.className = 'slot'; st.innerHTML = '<span>Molde</span>'; gs.innerHTML = '';
  const rs = $('#rune-slot'), rOn = S.up.runes > 0 && sel.t && !sel.re && runeOk(sel.t), rHave = sel.rune ? S.runes[sel.rune] || 0 : 0;
  rs.hidden = !rOn; rs.classList.toggle('full', !!(rOn && sel.rune)); rs.classList.toggle('no', !!(rOn && sel.rune && !rHave));
  if (rOn) rs.innerHTML = sel.rune ? `<img src="${runeImg(sel.rune)}" alt=""><span class="need ${rHave ? '' : 'no'}">1/${rHave}</span>` : '<span>Runa</span>';
  // Reforja: a peça do estoque + metade dos materiais dela
  if (sel.re) {
    const it = S.stock.find(x => x.id === sel.re); if (!it) { clearAnvil(); return renderSlots(); }
    const cost = reCost(it), short = cost.filter(([o, q]) => (S.ores[o] || 0) < q), n = it.rf || 0;
    os.innerHTML = cost.map(([o, q]) => { const have = S.ores[o] || 0; return `<div class="slot full ${have >= q ? '' : 'no'}"><img src="${ingotImg(o)}" alt=""><span class="need ${have >= q ? '' : 'no'}">${q}/${have}</span></div>`; }).join('');
    st.className = `slot full b-${it.r}`; st.innerHTML = `<img src="${itemImg(it)}" alt="">`;
    $('#forge').disabled = short.length > 0; $('#forge').textContent = '🔨 Reforjar!';
    tip.innerHTML = `Reforjar <b>${esc(itemName(it))}</b> (<span class="r-${it.r}">${rar(it.r).n}</span>)${reMax() > 1 ? ` · ${n + 1}ª de ${reMax()}` : ''} · usa ${cost.map(([o, q]) => `${q} ${ore(o).n}`).join(' + ')}` +
      `<br>+${n ? 1 : '1 a 2'} raridade${n ? '' : 's'} · <span class="no">falha ${it.rune ? 'apaga a runa' : 'destrói a peça'}</span>` +
      (short.length ? `<br><span class="no">Faltam ${short.map(([o, q]) => `${q - (S.ores[o] || 0)} ${ore(o).n}`).join(', ')}</span>` : '');
    return;
  }
  $('#forge').textContent = '🔨 Martelar!';
  const n = need(), c = counts(sel.ores), short = Object.entries(c).filter(([o, q]) => (S.ores[o] || 0) < q);
  const small = n + sel.gems.length + 1 > 5;   // muitos espaços: todos ficam menores
  sel.ores.forEach((o, i) => {
    const s = document.createElement('div'); s.className = 'slot ore' + (small ? ' sm' : '') + (o ? ' full' : '') + (o && short.some(x => x[0] === o) ? ' no' : ''); s.dataset.i = i;
    const cat = sel.t ? slotCatOf(sel.t, n, i) : 'metal';
    s.innerHTML = o ? `<img src="${ingotImg(o)}" alt="">` : `<span>${cat === 'wood' ? 'Madeira' : 'Metal'}</span>`;
    s.onclick = () => { if (busy()) return; if (S.up.alloy) sel.ores[i] = null; else sel.ores = sel.ores.map((x, k) => (sel.t ? slotCatOf(sel.t, n, k) : 'metal') === cat ? null : x); renderSlots(); renderLists(); };
    os.append(s);
  });
  st.classList.toggle('sm', small);
  if (sel.t) { st.classList.add('full'); st.innerHTML = `<img src="${moldImg(sel.t, curLvl())}" alt="">`; }
  if (sel.t) {
    const need = counts(sel.gems.filter(Boolean)), req = type(sel.t).gemReq;
    sel.gems.forEach((g, i) => {
      const d = document.createElement('div'); d.className = 'slot gem-slot gemslot' + (g ? ' full' : '') + (small ? ' sm' : ''); d.dataset.i = i;
      d.innerHTML = g ? `<img src="${gemImg(g)}" alt=""><span class="need ${(S.gems[g] || 0) >= need[g] ? '' : 'no'}">${need[g]}/${S.gems[g] || 0}</span>` : `<span>Gema${req && i === 0 ? '<br>(obrigatória)' : ''}</span>`;
      d.onclick = () => { if (!busy()) { sel.gems[i] = null; renderSlots(); renderLists(); } };
      gs.append(d);
    });
  }
  const gNeed = counts(sel.gems.filter(Boolean)), gShort = Object.entries(gNeed).filter(([g, q]) => (S.gems[g] || 0) < q);
  const gemOk = !gShort.length && !(sel.t && type(sel.t).gemReq && !sel.gems.some(Boolean));
  const runeFine = !sel.rune || rHave > 0;
  const full = sel.t && sel.ores.every(Boolean), ready = full && !short.length && gemOk && runeFine;
  $('#forge').disabled = !ready;
  if (!full) tip.innerHTML = !sel.t ? 'Arraste um metal e um molde para a bigorna.<br>Peças do estoque podem ser arrastadas para ' + (S.up.reforge ? 'cá (reforjar) ou para o leilão.' : 'o balcão ou para o leilão.')
    : type(sel.t).mixWood ? `${type(sel.t).n} usa ${n - type(sel.t).mixWood} ${n - type(sel.t).mixWood > 1 ? 'metais comuns' : 'metal comum'} e ${type(sel.t).mixWood} ${type(sel.t).mixWood > 1 ? 'madeiras' : 'madeira'} (${type(sel.t).grp === 'guns' ? 'coronha' : 'cabo'}).<br>Arraste o metal e a madeira para a bigorna.`
    : type(sel.t).wood ? `${type(sel.t).n} usa ${n} madeira${n > 1 ? 's' : ''}${type(sel.t).gemReq ? ' e pelo menos 1 gema (obrigatória)' : ''}.<br>Arraste a madeira${type(sel.t).gemReq ? ' e a gema' : ''} para a bigorna.`
    : `Este molde usa ${n} lingote${n > 1 ? 's' : ''}${tJ(sel.t) ? ' de Prata ou Ouro' : ''} (+ gema opcional).` + (S.up.alloy ? ' Com a forja composta, cada espaço aceita um metal diferente.' : '') + '<br>Arraste os metais para a bigorna.';
  else {
    const d = diffOf(sel.t, curLvl(), sel.ores), stars = clamp(Math.ceil(d / 2), 1, 5);
    const gl = sel.gems.filter(Boolean), use = Object.entries(c).map(([o, q]) => `${q} ${ore(o).n}`).join(' + ') + (gl.length ? ` + ${Object.entries(gNeed).map(([g, q]) => `${q} ${gemOf(g).n}`).join(' + ')} (+${Math.round(gemsQ(gl) * 100)}% de sorte)` : '');
    tip.innerHTML = `${esc(nameOf(sel.t, curLvl(), sel.ores, gl, sel.rune))}${sel.rune ? ` · <span class="r-${RUNE_G[sel.rune].r}">runa ${RUNE_G[sel.rune].n}</span>` : ''} · usa ${use} · dificuldade <span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>` +
      (!runeFine ? '<br><span class="no">Você não tem mais essa runa</span>' : '') + (short.length || !gemOk ? `<br><span class="no">Faltam ${[...short.map(([o, q]) => (q - (S.ores[o] || 0)) + ' ' + ore(o).n), gemOk ? '' : gShort.length ? gShort.map(([g, q]) => (q - (S.gems[g] || 0)) + ' ' + gemOf(g).n).join(', ') : '1 gema'].filter(Boolean).join(', ')}</span>` : '<br>Clique em Martelar (ou Enter)');
  }
}
$('#rune-slot').onclick = () => { if (!busy()) { sel.rune = null; renderSlots(); renderLists(); } };
$('#slot-t').onclick = () => { if (!busy()) { if (sel.re) clearAnvil(); else { sel.t = null; fitOres(); } renderSlots(); renderLists(); } };


/* ======================= Mini-jogo de ritmo =======================
   O cursor vai e volta na barra. Faixas do centro para fora: Perfeito (4), Ótimo (3), Bom (2), Ruim (1); fora = Errou (0).
   Dificuldade = metais + nível do molde + quantidade de material + tipo de peça + liga:
   - golpes = 3 + lingotes usados (máx. 10)
   - zona menor e cursor mais rápido conforme a dificuldade (a bigorna aumenta a zona; o martelo deixa o cursor mais lento)
   - a partir da dificuldade 4,5 a zona muda de lugar a cada golpe
   O desempenho não garante a raridade: ele só melhora as chances (veja rollRarity). */
$('#forge').onclick = startForge;
function startForge() {
  if (busy() || $('#forge').disabled || !$('#modal').hidden) return;
  let t, lvl, ores, gems = [], re = null, rune = null;
  if (sel.re) { re = S.stock.find(x => x.id === sel.re); if (!re || reLeft(re) <= 0) return; ({ t, lvl, ores } = re); reCost(re).forEach(([o, q]) => S.ores[o] -= q); }
  else {
    t = sel.t; lvl = curLvl(); ores = [...sel.ores]; gems = sel.gems.filter(Boolean);
    Object.entries(counts(ores)).forEach(([o, q]) => S.ores[o] -= q); gems.forEach(g => S.gems[g]--);
    if (sel.rune && S.runes[sel.rune] > 0 && runeOk(t)) { rune = sel.rune; S.runes[rune]--; }
  }
  save(); renderLists();
  const d = diffOf(t, lvl, ores) + (re ? REFORGE_DIFF[re.rf || 0] : 0);   // a reforja é bem mais difícil; a segunda, mais ainda
  forging = {
    t, lvl, ores, gems, re: re?.id, n: Math.min(10, 3 + ores.length), rune, q: gemsQ(re ? re.gems : gems) + runeQ(re ? re.rune : rune),
    zone: clamp(.48 - d * .03, .12, .48) * (1 + ANVILS[S.up.anvil].b), speed: (.65 + d * .1) * (1 - HAMMERS[S.up.hammer].b),
    moving: d >= 4.5, zc: .5, pos: 0, dir: 1, hits: [], last: performance.now(), lock: false,
  };
  $('#zone').style.width = forging.zone * 100 + '%'; $('#zone').style.left = '50%';
  $('#strikes').innerHTML = '<i></i>'.repeat(forging.n);
  $('#verdict').innerHTML = '&nbsp;';
  $('#rhythm').hidden = false; $('#forge').hidden = true;
  $('#tip').innerHTML = 'Clique (ou Espaço) quando o cursor passar no centro da zona!' + (forging.moving ? '<br><span class="stars">A zona muda de lugar a cada golpe.</span>' : '');
  hotIngot(true, ores[0]); requestAnimationFrame(tick);
}
function tick(t) {
  const f = forging; if (!f) return;
  const dt = Math.min(.05, (t - f.last) / 1000); f.last = t;
  f.pos += f.dir * f.speed * dt;
  if (f.pos > 1) { f.pos = 2 - f.pos; f.dir = -1; } else if (f.pos < 0) { f.pos = -f.pos; f.dir = 1; }
  $('#cursor').style.left = f.pos * 100 + '%';
  requestAnimationFrame(tick);
}
function strike() {
  const f = forging; if (!f || f.lock) return;
  const d = Math.abs(f.pos - f.zc) / (f.zone / 2), g = [...GRADES].reverse().find(x => x.max != null && d <= x.max) || GRADES[0];
  f.hits.push(g.pts); f.speed *= 1.05;
  $('#strikes').children[f.hits.length - 1].className = g.cls;
  const v = $('#verdict'); v.textContent = g.n; v.style.color = g.c; v.classList.remove('pop'); void v.offsetWidth; v.classList.add('pop');
  SFX.hit(g.pts); swing(); impact(g.pts, f.ores[(f.hits.length - 1) % f.ores.length]);
  if (f.moving) { const h = f.zone / 2; f.zc = rand(h + .03, 1 - h - .03); $('#zone').style.left = f.zc * 100 + '%'; }
  if (f.hits.length >= f.n) { f.lock = true; setTimeout(finishForge, 450); }
}
function finishForge() {
  const f = forging; let r, made = false;   // made = saiu peça nova ou melhorada (peça Lendária ou Única ganha raios)
  forging = null; hotIngot(false);
  $('#rhythm').hidden = true; $('#forge').hidden = false; SFX.done();
  if (f.re) {
    const it = S.stock.find(x => x.id === f.re); if (!it) { save(); return renderAll(); }
    const res = reResult(f.hits, it.rf || 0); it.rf = (it.rf || 0) + 1; r = rar(it.r);
    if (res === 'fail') {
      SFX.no(); chips(26, ['#57534e', '#a8a29e', '#292524']);
      if (it.rune) { delete it.rune; toast(`<img src="${itemImg(it, 3)}"> Reforja falhou: runa perdida.`); }
      else { S.stock = S.stock.filter(x => x !== it); toast(`💥 Reforja falhou: ${esc(itemName(it))} destruída.`); }
    } else {
      r = RARITY[Math.min(RARITY.length - 1, rIdx(it.r) + res)]; it.r = r.id; made = true; reveal(it, r);
      toast(`<img src="${itemImg(it, 3)}"> Reforjada! Agora é <span class="r-${r.id}">${r.n}</span>`);
    }
    if (!S.stock.includes(it) || reLeft(it) <= 0 || rIdx(it.r) >= RARITY.length - 1) clearAnvil();
  } else {
    r = starRarity(rollRarity(f.hits.reduce((a, b) => a + b, 0) / (4 * f.n), f.q));
    const lvl = starLvl(f.lvl), it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: f.t, lvl, ores: f.ores, r: r.id };
    if (f.gems.length) { it.gems = f.gems; S.stats.gemsSet += f.gems.length; }
    if (f.rune) { it.rune = f.rune; S.stats.runed++; }
    S.stock.unshift(it); S.stats.forged++;
    if (mixN(f.ores) > 0) S.stats.alloys++;
    if (type(f.t).grp === 'guns') S.stats.pistols = (S.stats.pistols || 0) + 1;
    if (tJ(f.t)) S.stats.jewels++;
    if (f.t === 'staff') S.stats.staffs++;
    if (f.t === 'bow') S.stats.bows++;
    made = true; reveal(it, r);
    toast(`<img src="${itemImg(it, 3)}"> ${esc(itemName(it))} · <span class="r-${r.id}">${r.n}</span>${lvl > f.lvl ? ` · ★ subiu para ${LEVELS[lvl].n}!` : ''} → estoque`);
    sel.gems = sel.gems.map(g => g && S.gems[g] > 0 ? g : null); if (sel.rune && !(S.runes[sel.rune] > 0)) sel.rune = null;
  }
  if (made && rIdx(r.id) >= 4) { sparks(90, RAR_HEX[r.id]); lightning(RAR_HEX[r.id]); }
  if (made) S.stats.best = Math.max(S.stats.best, rIdx(r.id));
  f.ores.forEach(o => { if (!S.stats.used.includes(o)) S.stats.used.push(o); });
  save(); renderStock(!f.re); renderSlots(); renderLists(); renderBottom();
}
// Material na bigorna: lingote em brasa (que pulsa) para metais; tora (sem brasa) para madeira
function hotIngot(on, o) {
  let h = $('#hot');
  if (!on) return h && h.remove();
  if (!h) { h = new Image(); h.id = 'hot'; $('#anvil-wrap').append(h); }
  const wood = o && ore(o).wood;
  h.src = wood ? sprite('log', ore(o).sh, 3) : sprite('ingot', ['#fff3c4', '#ffb347', '#e0571b'], 3);
  h.className = wood ? '' : 'glow';
}
// Peça pronta: aparece sobre a bigorna, com raios na cor da raridade, e depois vai para o estoque
function reveal(it, r) {
  const d = document.createElement('div'); d.className = 'reveal'; d.style.setProperty('--rc', `var(--r-${r.id})`);
  d.innerHTML = `<img src="${itemImg(it, 4)}" alt="">`; $('#anvil-wrap').append(d); setTimeout(() => d.remove(), 1250);
}
const again = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
function swing() { again($('#hammer'), 'hit'); }
/* Impacto do martelo: a bigorna afunda, o lingote amassa, um clarão se abre e saem lascas do metal + faíscas */
function impact(pts, o) {
  const h = $('#hot'); if (h) again(h, 'squash');
  again($('#anvil-wrap'), 'thump'); if (pts >= 3) again($('#anvil-area'), 'shk');
  const wood = ore(o).wood;
  if (pts && !wood) { const fl = document.createElement('div'); fl.className = 'flash'; fl.style.left = '129px'; fl.style.top = '36px'; $('#anvil-wrap').append(fl); setTimeout(() => fl.remove(), 320); }
  const sh = ore(o).sh;
  chips(4 + pts * 5, [sh[0], sh[1], sh[2], '#ffb347']);
  if (!wood) sparks([3, 8, 18, 30, 45][pts], ore(o).spark);
}

/* Partículas da bigorna (faíscas pequenas e lascas maiores) */
const sc = $('#sparks'), sg = sc.getContext('2d'); let parts = [], sparking = false;
const IMPACT = [189, 106];
function emit(n, make) { for (let i = 0; i < n; i++) parts.push(make()); if (sparking) return; sparking = true; let last = performance.now();
  requestAnimationFrame(function f(t) {
    const dt = (t - last) / 1000; last = t; sg.clearRect(0, 0, sc.width, sc.height);
    parts = parts.filter(p => (p.l -= dt) > 0);
    parts.forEach(p => { p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; sg.fillStyle = p.c; sg.globalAlpha = Math.min(1, p.l * 2); sg.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
    sg.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(f); else sparking = false;
  });
}
/* Raios na cor da raridade (peça Lendária ou Única): caem do alto da área da bigorna até ela, com ramos e um clarão.
   Cada raio é um caminho em ziguezague desenhado em blocos (pixel art), que some em ~0,2 s */
const bc = $('#bolts'), bg2 = bc.getContext('2d'); let bolts = [], bolting = false;
function boltPath(x0, y0, x1, y1, step = 14) {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / step)), pts = [[x0, y0]];
  for (let i = 1; i < n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + rand(-16, 16) * (1 - k * .5), y0 + (y1 - y0) * k + rand(-4, 4)]); }
  pts.push([x1, y1]); return pts;
}
function lightning(color) {
  const area = $('#anvil-area'), ar = area.getBoundingClientRect(), an = $('#anvil').getBoundingClientRect();
  bc.width = Math.round(ar.width / 2); bc.height = Math.round(ar.height / 2);   // metade da resolução, ampliada 2× sem suavizar
  const tx = (an.left + an.width / 2 - ar.left) / 2, ty = (an.top + an.height * .2 - ar.top) / 2, W = bc.width;
  for (let i = 0; i < 7; i++) {
    const x0 = clamp(tx + rand(-.42, .42) * W, 6, W - 6), main = boltPath(x0, 0, tx + rand(-30, 30) * (i ? 1 : 0), ty + (i ? rand(-6, 30) : 0), 7), paths = [main];
    for (let b = 0; b < 2; b++) { const [bx, by] = main[irand(1, main.length - 2)]; paths.push(boltPath(bx, by, bx + rand(-50, 50), by + rand(16, 46), 6)); }   // ramos
    bolts.push({ paths, d: i * .13 + rand(0, .05), l: .22, L: .22, c: color });
  }
  area.classList.remove('bolt'); void area.offsetWidth; area.classList.add('bolt'); area.style.setProperty('--bolt', color);
  noise(.35, .09, 500); tone(70, .5, 'sawtooth', .05);
  if (!bolting) { bolting = true; let last = performance.now(); requestAnimationFrame(function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; bg2.clearRect(0, 0, bc.width, bc.height);
    bolts = bolts.filter(b => { if (b.d > 0) { b.d -= dt; return true; } return (b.l -= dt) > 0; });
    bolts.forEach(b => { if (b.d > 0) return; const a = b.l / b.L;
      [[3, b.c, a * .55], [1, a > .5 ? '#ffffff' : b.c, a]].forEach(([w, c, al]) => { bg2.globalAlpha = al; bg2.fillStyle = c;
        b.paths.forEach((p, pi) => { for (let i = 1; i < p.length; i++) { const [x0, y0] = p[i - 1], [x1, y1] = p[i], n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))), s = pi ? Math.max(1, w - 1) : w;
          for (let k = 0; k <= n; k++) bg2.fillRect(Math.round(x0 + (x1 - x0) * k / n - s / 2), Math.round(y0 + (y1 - y0) * k / n), s, s); } }); }); });
    bg2.globalAlpha = 1;
    if (bolts.length) requestAnimationFrame(loop); else { bolting = false; bg2.clearRect(0, 0, bc.width, bc.height); }
  }); }
}
function sparks(n, color) { emit(n, () => { const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, s = 80 + Math.random() * 240; return { x: IMPACT[0], y: IMPACT[1] - 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: .3 + Math.random() * .5, c: Math.random() < .3 ? '#fff' : color, s: 2 + (Math.random() * 2 | 0), gr: 500 }; }); }
function chips(n, colors) { emit(n, () => { const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, s = 60 + Math.random() * 140; return { x: IMPACT[0] + rand(-20, 20), y: IMPACT[1], vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, l: .5 + Math.random() * .4, c: pick(colors), s: 4 + (Math.random() * 3 | 0), gr: 700 }; }); }

/* ======================= Estoque ======================= */
function renderStock(fresh) {
  const b = $('#stock'); b.innerHTML = '';
  $('#stock-n').textContent = S.stock.length ? `(${S.stock.length})` : '';
  $('#auto').classList.toggle('on', S.up.helper && S.auto); $('#auto').classList.toggle('locked', !S.up.helper);
  if (!S.stock.length) { b.innerHTML = '<div class="st-empty">Vazio. Forje alguma peça!</div>'; return; }
  S.stock.forEach((it, i) => {
    const want = S.orders.some(o => fits(it, o)), gems = it.gems || [];
    const s = document.createElement('div'); s.className = `st-slot b-${it.r}` + (fresh && i === 0 ? ' new' : '') + (it.rune ? ' runed' : '') + (gems.length ? ' gemmed' : ''); s.dataset.id = it.id;
    if (it.rune) s.style.setProperty('--rc', RAR_HEX[RUNE_G[it.rune].r]);
    // marcas: "!" = serve para uma encomenda · losango = gema · quadrado brilhante = runa
    s.innerHTML = `<img src="${itemImg(it)}" alt="">` + (want ? '<b class="want">!</b>' : '') +
      (gems.length || it.rune ? `<span class="pips">${gems.map(g => `<i class="pip" style="--c:${gemOf(g).sh[1]}"></i>`).join('')}${it.rune ? `<i class="pip rune" style="--c:${RAR_HEX[RUNE_G[it.rune].r]}"></i>` : ''}</span>` : '');
    s.onmouseenter = e => tip(e, `<b>${esc(itemName(it))}</b><br><span class="r-${it.r}">${rar(it.r).n}</span> · valor ${itemValue(it)}` +
      (it.rune ? `<br><span class="r-${RUNE_G[it.rune].r}">Runa ${RUNE_G[it.rune].n}</span> · +${pct(RUNE_G[it.rune].v)} de valor · vende no leilão na metade do tempo` : '') +
      (want ? '<br><span style="color:var(--red)">! Serve para uma encomenda: arraste para o balcão</span>' : '') +
      (it.rf ? `<br><small>Reforjada ${it.rf}×</small>` : '') +
      `<br><small>Arraste para o balcão (encomenda ou venda por ${pct(AUTO_SELL)})${S.up.reforge && reLeft(it) > 0 && it.r !== 'unico' ? ', para o leilão ou para a bigorna (reforjar)' : ' ou para o leilão'}${gems.length < gemSlots(it.t, it.lvl) ? `<br>Arraste uma gema até aqui para encravar (${gems.length}/${gemSlots(it.t, it.lvl)})` : ''}</small>`);
    s.onmousemove = e => tip(e); s.onmouseleave = () => $('#tooltip').hidden = true;
    draggable(s, () => itemImg(it), t => { if (t?.zone === 'auction') listAuction(it.id); else if (t?.zone === 'anvil') placeReforge(it.id); else if (t?.zone === 'counter') counterDrop(it.id); });
    b.append(s);
  });
}
// Peça solta no balcão: completa a encomenda que pagar mais; se não servir para nenhuma, vende na hora
function counterDrop(id) {
  const it = S.stock.find(x => x.id === id); if (!it) return;
  const o = S.orders.filter(o => fits(it, o)).sort((a, b) => orderPay(b, it) - orderPay(a, it))[0];
  if (o) return deliver(o.id, it);
  S.stock = S.stock.filter(x => x !== it); if (sel.re === id) clearAnvil();
  const v = Math.round(itemValue(it) * AUTO_SELL); earn(v);
  toast(`<img src="${itemImg(it, 3)}"> Vendido no balcão: ${esc(itemName(it))} por ${v} (${pct(AUTO_SELL)} do valor)`); renderStock(); renderSlots(); renderBottom();
}
function tip(e, html) { const t = $('#tooltip'); if (html) t.innerHTML = html; t.hidden = false; t.style.left = e.clientX + 14 + 'px'; t.style.top = e.clientY + 14 + 'px'; }
$('#auto').onclick = () => { if (!S.up.helper) return nope('Contrate o Ajudante de ferreiro na loja de melhorias para vender sozinho.'); if (!busy()) openModal('autosell'); };
// A venda automática não mexe em peças Lendárias/Únicas, nas que servem para encomendas abertas nem na que está na bigorna
// Peça que a venda automática não toca: raridade ou opcional (gema, runa) desmarcados na aba 💰, serve para uma encomenda, ou está na bigorna
const reserved = it => !S.autoSell.r[rIdx(it.r)] || (it.gems?.length && !S.autoSell.gems) || (it.rune && !S.autoSell.runes) || S.orders.some(o => fits(it, o)) || it.id === sel.re;

/* ======================= Moedas ======================= */
const coinImg = sprite('coin', [], 3);
$('#coin-img').src = coinImg;
$('#cheat').onclick = () => { S.coins += 100000; save(); SFX.coin(); floatCoins(100000); renderAll(); if (modal) renderModal(); };
$('#cheat-cd').onclick = () => { S.mineAt = S.forestAt = S.runeAt = 0; save(); SFX.place(); toast('⏱ Esperas zeradas: mina, floresta e runas prontas.'); renderAll(); };
const renderCheat = () => { $('#cheat').hidden = $('#cheat-cd').hidden = !S.cheat; };
let coinShown = S.coins, coinRaf = 0;
function renderCoins() {
  const el = $('#coin-n');
  if (!$('#game').classList.contains('on')) { coinShown = S.coins; el.textContent = S.coins; return; }
  if (coinRaf) return;
  const step = () => { const d = S.coins - coinShown; coinShown += Math.abs(d) < 5 ? d : Math.round(d * .2); el.textContent = coinShown; coinRaf = d ? requestAnimationFrame(step) : 0; };
  step();
}
function floatCoins(n) {
  const c = $('#coins'); renderCoins(); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  const r = c.getBoundingClientRect(), f = document.createElement('div'); f.className = 'float' + (n < 0 ? ' neg' : ''); f.textContent = (n > 0 ? '+' : '') + n;
  f.style.left = r.right + 6 + 'px'; f.style.top = r.top + 'px'; document.body.append(f); setTimeout(() => f.remove(), 900);
}
function earn(n) { S.coins += n; S.stats.earned += n; save(); SFX.coin(); floatCoins(n); }
function spend(n) { if (S.coins < n) { SFX.no(); return false; } S.coins -= n; save(); SFX.buy(); floatCoins(-n); return true; }

/* ======================= Encomendas ======================= */
function deliver(id, item) {
  const o = S.orders.find(x => x.id === id), it = o && (item || matchFor(o)); if (!it) return;
  const fast = Date.now() <= o.fast, base = orderPay(o, it), pay = base + (fast ? Math.round(base * .5) : 0), miss = missing(it, o);
  S.stock = S.stock.filter(x => x !== it); S.orders = S.orders.filter(x => x !== o); S.stats.orders++;
  if (sel.re === it.id) clearAnvil();
  earn(pay); toast(`${o.e} ${esc(o.npc)} recebeu ${esc(itemName(it))}${miss ? ` · sem ${[hasGem(it, o) ? '' : 'a gema', hasRune(it, o) ? '' : 'a runa'].filter(Boolean).join(' e ')} pedida: pagou menos` : ''}${fast ? ' · ⚡ bônus de entrega rápida!' : ''}`);
  renderStock(); renderSlots(); renderBottom(); renderModal();
}
const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function orderInfo(o, now) {
  const fast = now <= o.fast, left = o.dl - now;
  return { fast, pct: clamp(left / (o.dl - o.t0), 0, 1) * 100, pay: o.reward + (fast ? '+' + o.bonus : ''), txt: `⏱ ${mmss(left)}${fast ? ` · ⚡ +${o.bonus} se entregar em ${mmss(o.fast - now)}` : ''}` };
}

/* ======================= Leilão =======================
   Ao pôr à venda, sorteia-se se vai aparecer comprador (mais provável perto do valor e em peças raras) e quando.
   O leilão dura de 2 a 5 minutos; se o comprador não aparecer a tempo, a peça volta para o estoque. */
const buyerChance = (it, price) => clamp((1.15 - .55 * (price / itemValue(it) - 1)) * (.7 + .2 * rar(it.r).af), .03, .95);
function rollAuction(it, price) {
  const now = Date.now(), dur = rand(120, 300) * 1000 * (it.rune ? RUNE_SPEED : 1) * (it.gems?.length ? GEM_SPEED : 1);   // gemas e runas atraem comprador mais rápido
  return { price, t0: now, end: now + dur, sellAt: Math.random() < buyerChance(it, price) ? now + rand(.1, 1.1) * dur : null };
}
function chance(it, price) {
  const p = buyerChance(it, price) * .9;
  const cls = p >= .7 ? 'ch-hi' : p >= .45 ? 'ch-mid' : p >= .2 ? 'ch-lo' : 'ch-vlo';
  return `<span class="${cls}">chance de venda ~${Math.round(p * 100)}%</span>`;
}
const drafts = {};
const suggested = it => Math.round(itemValue(it) * 1.2);
function listAuction(id, price) {
  if (!S.up.slots) return nope('O leilão ainda está fechado. Abra na loja de melhorias.');
  if (S.auction.length >= S.up.slots) return nope(`Leilão cheio (${S.up.slots} ${S.up.slots > 1 ? 'espaços' : 'espaço'}). Compre mais na loja de melhorias.`);
  const it = S.stock.find(x => x.id === id); if (!it) return;
  price = Math.max(1, Math.round(price ?? (+drafts[id] || suggested(it))));
  S.stock = S.stock.filter(x => x !== it); S.auction.push({ it, ...rollAuction(it, price) }); delete drafts[id];
  if (sel.re === id) { clearAnvil(); renderSlots(); }
  save(); SFX.place(); toast(`🔨 ${esc(itemName(it))} no leilão por ${price}`); renderStock(); renderBottom(); renderModal();
}
function reprice(i, price) { const a = S.auction[i]; if (!a) return; Object.assign(a, rollAuction(a.it, Math.max(1, Math.round(price)))); save(); renderModal(); }
function cancelAuction(i) { const a = S.auction.splice(i, 1)[0]; if (a) S.stock.unshift(a.it); save(); renderStock(); renderBottom(); renderModal(); }

/* ======================= Mina =======================
   Veios aparecem na parede com um anel que se fecha. Clique no veio quando o anel encostar nele:
   Perfeito = 2 minérios, Bom = 1, Ok = 50% de chance de 1; cedo ou tarde demais = nada. O minério vai bruto para a fornalha.
   Cada metal surge num nível (prata e ouro no 2, mithril no 4, adamantita no 5, oricalco no 6; gemas a partir do 3) e fica
   mais comum nos níveis abaixo dele.
   A cena é desenhada em baixa resolução (320×170) e ampliada 2× sem suavização, para tudo ficar em pixel art.
   Cada acerto tem peso: a picareta desce, a pedra pisca e racha em pedaços, saem lascas, faíscas e poeira, a tela treme
   e as pepitas voam até a contagem lá em cima. Quanto melhor o acerto, mais forte o efeito. */
let mine = null;
const mcv = $('#mine-cv'), mg = mcv.getContext('2d');
const lowCanvas = () => { const c = Object.assign(document.createElement('canvas'), { width: 320, height: 170 }), g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
const [mlo, ml] = lowCanvas();
const STONE = ['#8b8580', '#67615c', '#45403d'];
const MINE_BASE = ['#2c2521', '#25232e', '#231d33', '#1b2630', '#261b33', '#2e1714'];
const SW_T = .07, SW_END = .36;   // golpe da picareta: 0,07 s até bater na pedra; some aos 0,36 s
const backOut = k => 1 + 2.70158 * (k - 1) ** 3 + 1.70158 * (k - 1) ** 2;
const _cvs = new Map();
const sprCv = (name, sh, lvl = 1) => { const k = name + sh + lvl; if (!_cvs.has(k)) _cvs.set(k, spriteCanvas(name, sh, 1, lvl)); return _cvs.get(k); };
const nodeCv = (o, plain) => sprCv(o.gem ? 'gemnode' : 'node', plain ? STONE : (o.gem ? gemOf(o.id) : ore(o.id)).sh);
// Círculos de pixels (sem suavização)
function pxRing(g, x, y, r, c) { g.fillStyle = c; const n = Math.max(12, Math.ceil(r * 6.4)); for (let i = 0; i < n; i++) { const a = i / n * 6.2832; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); } }
function pxDisc(g, x, y, r, c) { g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(x - w, y + dy, w * 2, 1); } }
// Texto com contorno, que "salta" ao aparecer e sobe sumindo (mina e floresta)
function popText(g, f, x, y) {
  const age = f.L - f.l, s = 1 + .7 * Math.max(0, 1 - age / .12);
  g.save(); g.font = `bold ${f.big ? 19 : 15}px ui-monospace, monospace`; g.textAlign = 'center';
  const half = g.measureText(f.txt).width * s / 2 + 8; x = clamp(x, half, g.canvas.width - half);   // não deixa o texto sair da tela
  g.translate(x, y - age * 34); g.scale(s, s); g.globalAlpha = Math.min(1, f.l * 3); g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = '#0e0a08';
  g.strokeText(f.txt, 0, 0); g.fillStyle = f.c; g.fillText(f.txt, 0, 0); g.restore();
}
// Parede da mina: blocos de pedra, rachaduras, pontinhos do mineral do nível, escoras de madeira e um lampião
function mineBg(lv) {
  const [c, g] = lowCanvas();
  g.fillStyle = MINE_BASE[lv - 1] || MINE_BASE[0]; g.fillRect(0, 0, 320, 170);
  for (let i = 0; i < 80; i++) {
    const w = irand(10, 34), h = irand(6, 16), x = irand(-6, 310), y = irand(10, 166);
    g.fillStyle = pick(['#ffffff0a', '#00000026', '#ffffff06', '#0000001a']); g.fillRect(x, y, w, h);
    g.fillStyle = '#ffffff0d'; g.fillRect(x, y, w, 1); g.fillStyle = '#00000033'; g.fillRect(x, y + h - 1, w, 1);
  }
  for (let i = 0; i < 520; i++) { g.fillStyle = pick(['#00000030', '#ffffff10', '#00000020', '#ffffff08']); const s = pick([1, 1, 2]); g.fillRect(irand(0, 319), irand(0, 169), s, s); }
  g.fillStyle = '#00000070'; for (let i = 0; i < 8; i++) { let x = rand(0, 320), y = rand(14, 170); for (let k = 0; k < 28; k++) { g.fillRect(x | 0, y | 0, 1, 1); x += pick([-1, 0, 1, 1]); y += pick([-1, 0, 1]); } }
  const sh = MINES[lv].sh; for (let i = 0; i < 30; i++) { g.fillStyle = sh[i % 3] + '99'; g.fillRect(irand(10, 309), irand(16, 166), 1, 1); }
  // escoras: viga em cima (onde fica a contagem) e dois postes
  const wood = (x, y, w, h, vert) => {
    g.fillStyle = '#5e3b20'; g.fillRect(x, y, w, h);
    g.fillStyle = '#8a5a33'; vert ? g.fillRect(x, y, 2, h) : g.fillRect(x, y, w, 2);
    g.fillStyle = '#3a2110'; vert ? g.fillRect(x + w - 2, y, 2, h) : g.fillRect(x, y + h - 2, w, 2);
    g.fillStyle = '#0000002e'; for (let i = 0; i < (vert ? h : w) / 5; i++) vert ? g.fillRect(x + irand(2, w - 4), y + irand(0, h - 8), 1, irand(4, 9)) : g.fillRect(x + irand(0, w - 10), y + irand(3, h - 4), irand(5, 12), 1);
    g.fillStyle = '#0e0a08'; vert ? (g.fillRect(x - 1, y, 1, h), g.fillRect(x + w, y, 1, h)) : g.fillRect(x, y + h, w, 1);
  };
  wood(0, 14, 8, 156, true); wood(312, 14, 8, 156, true); wood(0, 0, 320, 14, false);
  g.fillStyle = '#b9b0a4'; [[3, 18], [315, 18], [3, 160], [315, 160]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  // lampião pendurado na viga
  g.fillStyle = '#0e0a08'; g.fillRect(296, 14, 1, 5); g.fillRect(292, 19, 9, 11);
  g.fillStyle = '#6b6b75'; g.fillRect(293, 19, 7, 2); g.fillRect(293, 28, 7, 2);
  g.fillStyle = '#ffb347'; g.fillRect(293, 21, 7, 7); g.fillStyle = '#fff7d6'; g.fillRect(295, 23, 3, 4);
  const v = g.createRadialGradient(170, 90, 60, 170, 90, 200); v.addColorStop(0, '#0000'); v.addColorStop(1, '#000000b8'); g.fillStyle = v; g.fillRect(0, 14, 320, 156);
  return c;
}
function mineReady() { return Date.now() >= S.mineAt; }
$('#mine-btn').onclick = () => {
  if (busy() || !$('#modal').hidden) return;
  if (!mineReady()) return nope(`A mina está se recuperando. Volte em ${mmss(S.mineAt - Date.now())}.`);
  startMine();
};
function startMine() {
  const lv = S.up.mine, M = MINES[lv], now = performance.now();
  const ores = minable(lv), gems = GEMS.filter(g => g.mine <= lv);
  mine = { lv, M, ores, gems, pick: sprCv('pickbig', M.sh, lv), bg: mineBg(lv), targets: [], dying: [], spawned: 0, t0: now, last: now, next: .6, loot: { ores: {}, gems: {} },
    fx: [], parts: [], swings: [], rings: [], stars: [], tally: [], shake: 0, stop: 0, white: 0, hits: [0, 0, 0, 0], over: false,
    motes: Array.from({ length: 16 }, () => ({ x: rand(10, 310), y: rand(16, 168), v: rand(2, 7), p: rand(0, 6) })) };
  $('#mine-title').textContent = '⛏ ' + M.n; $('#mine-result').hidden = true; $('#mine').hidden = false;
  requestAnimationFrame(mineLoop);
}
function mineLoop(now) {
  const m = mine; if (!m || m.over) return;
  const rdt = Math.min(.05, (now - m.last) / 1000), t = (now - m.t0) / 1000; m.last = now;
  let dt = rdt; if (m.stop > 0) { m.stop -= rdt; dt = 0; }   // nos golpes fortes, a cena congela um instante
  if (m.spawned < m.M.targets && t >= m.next) {
    let x, y, ok = false;
    for (let k = 0; k < 15 && !ok; k++) { x = rand(50, 590); y = rand(72, 290); ok = m.targets.every(o => Math.hypot(o.x - x, o.y - y) > 90); }
    const gem = m.gems.length && Math.random() < GEM_CHANCE;
    m.targets.push({ x, y, born: t, gem, id: gem ? wpick(m.gems, g => gemWeight(g, m.lv)).id : wpick(m.ores, o => mineWeight(o, m.lv)).id, gx: irand(-6, 6), gy: irand(-4, 4) });
    m.spawned++; m.next = t + m.M.every * rand(.85, 1.15);
  }
  m.targets = m.targets.filter(o => { if (t - o.born > m.M.T + .3) { mineFx(o.x, o.y - 26, 'Perdeu', '#a8a29e'); m.hits[0]++; mineCrumble(o); return false; } return true; });
  m.swings.forEach(w => { w.t += dt; if (!w.hit && w.t >= SW_T) { w.hit = true; mineImpact(w); } });
  m.swings = m.swings.filter(w => w.t < SW_END);
  mineDraw(m, t, dt, rdt);
  const got = Object.values(m.loot.ores).reduce((a, b) => a + b, 0) + Object.values(m.loot.gems).reduce((a, b) => a + b, 0);
  $('#mine-hud').textContent = `Veios ${m.spawned}/${m.M.targets} · Perfeitos ${m.hits[3]} · Coletado ${got}`;
  if (m.spawned >= m.M.targets && !m.targets.length && !m.dying.length && !m.swings.length && !m.fx.length && !m.parts.some(p => p.k === 'nug')) return endMine();
  requestAnimationFrame(mineLoop);
}
function mineFx(x, y, txt, c, big) { mine.fx.push({ x, y, txt, c, big, l: .9, L: .9 }); }
const mPart = p => { p.L = p.l; mine.parts.push(p); };
const tallyX = i => 12 + i * 30;
function tallySlot(id, gem) { const m = mine; let i = m.tally.findIndex(s => s.id === id); if (i < 0) i = m.tally.push({ id, gem, n: 0, pop: 0 }) - 1; return i; }

/* Golpe da picareta chegando na pedra. w.g = qualidade (0 cedo/tarde, 1 Ok, 2 Bom, 3 Perfeito; -1 = bateu na parede) */
function mineImpact(w) {
  const m = mine, x = Math.round(w.x / 2), y = Math.round(w.y / 2), g = w.g, o = w.o;
  if (!o) {   // parede vazia: só um "tinc" com poeira
    noise(.05, .03, 2400); m.stars.push({ x, y, l: .1, L: .1, s: 3 });
    for (let i = 0; i < 4; i++) mPart({ k: 'spark', x, y, vx: rand(-70, 70), vy: rand(-90, -10), gr: 300, l: rand(.15, .3), c: '#fff7d6' });
    for (let i = 0; i < 3; i++) mPart({ k: 'chip', x, y, vx: rand(-40, 40), vy: rand(-70, -10), gr: 520, l: rand(.3, .5), c: pick(STONE), s: 1 });
    return;
  }
  m.dying = m.dying.filter(d => d !== o);
  const sh = (o.gem ? gemOf(o.id) : ore(o.id)).sh, col = ['#a8a29e', '#ff8a3d', '#fbbf24', '#fff7d6'][g];
  SFX.crack(g);
  m.shake = Math.max(m.shake, [3, 4, 6, 10][g]); m.stop = [0, 0, .035, .07][g];
  mineFx(w.x, w.y - 26, w.txt, col, g === 3);
  m.stars.push({ x: x - 3, y: y - 1, l: .14, L: .14, s: 5 + g * 2 });
  if (g) m.rings.push({ x, y, r: 8, v: 110 + g * 30, l: .32, L: .32, c: col });
  if (g === 3) {   // Perfeito: clarão, segunda onda e raios
    m.white = .12; m.rings.push({ x, y, r: 4, v: 200, l: .42, L: .42, c: '#ffffff' });
    for (let i = 0; i < 10; i++) mPart({ k: 'ray', x, y, a: i / 10 * 6.283 + rand(-.2, .2), r: 12, v: rand(150, 210), l: .28 });
  }
  // a pedra racha em quatro pedaços (cinza se o golpe não rendeu nada)
  const cv = nodeCv(o, g === 0 && !o.gem), cw = cv.width / 2, ch = cv.height / 2;
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j]) => mPart({ k: 'shard', cv, sx: i * cw, sy: j * ch, sw: cw, sh: ch, x: x - cw + i * cw, y: y - ch + j * ch,
    vx: (i ? 1 : -1) * rand(22, 60) * (g ? 1 : .5), vy: (j ? -25 : -80) * rand(.6, 1.2), gr: 430, l: .5 }));
  for (let i = 0; i < 6 + g * 4; i++) mPart({ k: 'chip', x: x + rand(-8, 8), y: y + rand(-6, 6), vx: rand(-95, 95), vy: rand(-160, -20), gr: 520, l: rand(.4, .8), c: pick(g ? [...STONE, sh[1], sh[2]] : STONE), s: pick([1, 2, 2, 3]) });
  for (let i = 0; i < 4 + g; i++) mPart({ k: 'dust', x: x + rand(-10, 10), y: y + rand(-4, 8), vx: rand(-16, 16), vy: rand(-24, -6), l: rand(.4, .8), s: irand(2, 4) });
  for (let i = 0; i < [3, 6, 12, 20][g]; i++) mPart({ k: 'spark', x, y, vx: rand(-150, 150), vy: rand(-190, 30), gr: 320, l: rand(.2, .5), c: pick(['#fff7d6', '#fbbf24', sh[0]]) });
  // pepitas: saltam da pedra e voam para a contagem na viga
  if (w.q) {
    const slot = tallySlot(o.id, o.gem), n = o.gem ? 4 : 2 + w.q * 2;
    for (let i = 0; i < n; i++) mPart({ k: 'nug', x, y, vx: rand(-70, 70), vy: rand(-130, -50), t: 0, d: .2 + i * .045, slot, add: i ? 0 : w.q, c: sh[1], hi: sh[0], l: 9 });
  }
  // bônus (estanho ou gema que veio junto): pepitas próprias, na cor delas
  (w.extra || []).forEach(e => { const es = (e.gem ? gemOf(e.id) : ore(e.id)).sh, slot = tallySlot(e.id, e.gem);
    for (let i = 0; i < 3; i++) mPart({ k: 'nug', x, y, vx: rand(-70, 70), vy: rand(-130, -50), t: 0, d: .35 + i * .045, slot, add: i ? 0 : e.q, c: es[1], hi: es[0], l: 9 }); });
}
// Veio que passou do tempo: desmancha em cascalho
function mineCrumble(o) {
  const x = Math.round(o.x / 2), y = Math.round(o.y / 2), cv = nodeCv(o, !o.gem), cw = cv.width / 2, ch = cv.height / 2;
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j]) => mPart({ k: 'shard', cv, sx: i * cw, sy: j * ch, sw: cw, sh: ch, x: x - cw + i * cw, y: y - ch + j * ch, vx: (i ? 1 : -1) * rand(4, 14), vy: rand(-20, 0), gr: 300, l: .45 }));
  for (let i = 0; i < 5; i++) mPart({ k: 'dust', x: x + rand(-10, 10), y: y + rand(0, 10), vx: rand(-10, 10), vy: rand(-16, -4), l: rand(.4, .7), s: irand(2, 4) });
  noise(.12, .025, 400);
}
const swingAng = w => {
  if (w.t < SW_T) return .7 - 1.75 * (w.t / SW_T) ** 2;                       // desce acelerando
  const r = (w.t - SW_T) / (SW_END - SW_T); return -1.05 + (w.g > 0 ? .45 : .85) * Math.sin(Math.min(1, r * 1.6) * 1.5708);   // rebate (mais quando erra)
};
function mineDraw(m, t, dt, rdt) {
  const g = ml;
  g.globalAlpha = 1; g.drawImage(m.bg, 0, 0);
  // lampião: luz quente que tremula
  const fk = .5 + .5 * Math.sin(t * 9) * Math.sin(t * 5.3), lg = g.createRadialGradient(296, 24, 2, 296, 24, 120 + fk * 10);
  lg.addColorStop(0, `rgba(255,190,110,${.3 + fk * .06})`); lg.addColorStop(1, 'rgba(255,150,60,0)');
  g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(0, 14, 320, 156); g.globalCompositeOperation = 'source-over';
  m.motes.forEach(p => { p.y -= p.v * dt; p.x += Math.sin(t + p.p) * 3 * dt; if (p.y < 15) { p.y = 170; p.x = rand(10, 310); } g.fillStyle = '#ffe9c955'; g.fillRect(p.x | 0, p.y | 0, 1, 1); });
  // veios: surgem "pulando" da parede, com um brilho que passa de vez em quando
  const node = (o, age) => {
    const cv = nodeCv(o), x = Math.round(o.x / 2), y = Math.round(o.y / 2), s = age < .18 ? backOut(age / .18) : 1;
    const w = Math.round(cv.width * s), h = Math.round(cv.height * s);
    g.fillStyle = '#00000055'; g.fillRect(x - (w >> 1) + 2, y + (h >> 1) - 1, w - 4, 2);
    g.drawImage(cv, x - (w >> 1), y - (h >> 1), w, h);
    if ((t * .9 + o.x * .013) % 1.6 < .16 && age > .2) { g.fillStyle = '#fff'; g.fillRect(x + o.gx - 1, y + o.gy, 3, 1); g.fillRect(x + o.gx, y + o.gy - 1, 1, 3); }
  };
  m.targets.forEach(o => {
    const age = t - o.born, T = m.M.T, p = clamp(age / T, 0, 1), x = Math.round(o.x / 2), y = Math.round(o.y / 2);
    node(o, age);
    pxRing(g, x, y, 16, '#0e0a0880');   // marca fixa: onde o anel precisa chegar
    const r = 16 + 34 * (1 - p), c = age >= T ? '#ef4444' : T - age <= .16 ? '#fff7d6' : `rgba(255,255,255,${.35 + .65 * p})`;
    pxRing(g, x, y, r, c); pxRing(g, x, y, r + 1, c);
  });
  m.dying.forEach(o => node(o, 1));
  // partículas
  m.parts = m.parts.filter(p => {
    if (p.k === 'nug') {
      p.t += dt;
      if (p.t < p.d) { p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.hx = p.x; p.hy = p.y; }
      else {
        const k = Math.min(1, (p.t - p.d) / .32), e = k * k, tx = tallyX(p.slot), ty = 7;
        p.x = p.hx + (tx - p.hx) * e; p.y = p.hy + (ty - p.hy) * e - Math.sin(k * 3.1416) * 10;
        if (k >= 1) { const s = m.tally[p.slot]; s.n += p.add; s.pop = 1; SFX.tick(); return false; }
      }
      g.fillStyle = p.c; g.fillRect((p.x | 0) - 1, (p.y | 0) - 1, 3, 3); g.fillStyle = p.hi; g.fillRect((p.x | 0) - 1, (p.y | 0) - 1, 2, 1);
      if (Math.random() < .3) { g.fillStyle = '#ffffff'; g.fillRect((p.x | 0) + irand(-3, 3), (p.y | 0) + irand(-3, 3), 1, 1); }
      return true;
    }
    if ((p.l -= dt) <= 0) return false;
    const a = p.l / p.L;
    if (p.k === 'ray') { p.r += p.v * dt; g.fillStyle = '#fff7d6'; g.globalAlpha = a; for (let i = 0; i < 6; i++) g.fillRect(Math.round(p.x + Math.cos(p.a) * (p.r + i)), Math.round(p.y + Math.sin(p.a) * (p.r + i)), 1, 1); g.globalAlpha = 1; return true; }
    if (p.k === 'dust') { p.x += p.vx * dt; p.y += p.vy * dt; const s = p.s + ((1 - a) * 3 | 0); g.globalAlpha = a * .45; g.fillStyle = '#b9b0a4'; g.fillRect((p.x | 0) - (s >> 1), (p.y | 0) - (s >> 1), s, s); g.globalAlpha = 1; return true; }
    p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    g.globalAlpha = Math.min(1, a * 2.5);
    if (p.k === 'shard') g.drawImage(p.cv, p.sx, p.sy, p.sw, p.sh, p.x | 0, p.y | 0, p.sw, p.sh);
    else if (p.k === 'spark') { g.fillStyle = Math.random() < .3 ? '#ffffff' : p.c; g.fillRect(p.x | 0, p.y | 0, 1, 1); g.globalAlpha *= .5; g.fillRect((p.x - p.vx * .02) | 0, (p.y - p.vy * .02) | 0, 1, 1); }
    else { g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
    g.globalAlpha = 1; return true;
  });
  // picareta: desce com rastro, bate e rebate
  m.swings.forEach(w => {
    const a = swingAng(w), al = w.t > SW_END - .1 ? (SW_END - w.t) / .1 : 1, px = Math.round(w.x / 2) + 28, py = Math.round(w.y / 2) + 2;
    const at = (ang, alpha) => { g.save(); g.globalAlpha = alpha; g.translate(px, py); g.rotate(ang); g.drawImage(m.pick, -13, -29); g.restore(); };
    if (w.t < SW_T) { at(a + .5, .15); at(a + .25, .32); }
    at(a, Math.max(0, al));
  });
  // ondas de choque e clarão do impacto
  m.rings = m.rings.filter(r => (r.l -= dt) > 0);
  m.rings.forEach(r => { r.r += r.v * dt; g.globalAlpha = r.l / r.L; pxRing(g, r.x, r.y, r.r, r.c); pxRing(g, r.x, r.y, r.r + 1, r.c); g.globalAlpha = 1; });
  m.stars = m.stars.filter(s => (s.l -= rdt) > 0);
  m.stars.forEach(s => { const k = s.l / s.L, n = Math.round(s.s * (1.3 - k * .5)); g.fillStyle = '#ffffff'; g.fillRect(s.x - n, s.y, n * 2 + 1, 1); g.fillRect(s.x, s.y - n, 1, n * 2 + 1); g.fillRect(s.x - 1, s.y - 1, 3, 3); g.fillStyle = '#fff7d6'; const d = n >> 1; g.fillRect(s.x - d, s.y - d, 1, 1); g.fillRect(s.x + d, s.y - d, 1, 1); g.fillRect(s.x - d, s.y + d, 1, 1); g.fillRect(s.x + d, s.y + d, 1, 1); });
  // contagem na viga: o ícone "pula" quando chega uma pepita
  m.tally.forEach((s, i) => {
    s.pop = Math.max(0, s.pop - rdt * 5); if (!s.n) return;
    const cv = s.gem ? sprCv('gem_' + s.id, gemOf(s.id).sh) : sprCv('nug', ore(s.id).sh), k = 1 + s.pop * .6, w = Math.round(cv.width * k), h = Math.round(cv.height * k);
    g.drawImage(cv, tallyX(i) - (w >> 1), 7 - (h >> 1), w, h);
  });
  // amplia 2× com o tremor da tela
  const sk = m.shake; m.shake = Math.max(0, sk - rdt * 40);
  const ox = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0, oy = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0;
  mg.imageSmoothingEnabled = false; mg.globalAlpha = 1; mg.fillStyle = '#0e0a08'; mg.fillRect(0, 0, 640, 340); mg.drawImage(mlo, ox, oy, 640, 340);
  if (m.white > 0) { mg.fillStyle = `rgba(255,247,214,${m.white * 2})`; mg.fillRect(0, 0, 640, 340); m.white -= rdt; }
  mg.font = 'bold 13px ui-monospace, monospace'; mg.textAlign = 'left';
  m.tally.forEach((s, i) => { if (!s.n) return; const x = tallyX(i) * 2 + 16 + ox, y = 19 + oy; mg.fillStyle = '#0e0a08'; mg.fillText('×' + s.n, x, y + 2); mg.fillStyle = s.pop > 0 ? '#fff7d6' : '#f3e9dc'; mg.fillText('×' + s.n, x, y); });
  m.fx = m.fx.filter(f => (f.l -= rdt) > 0);
  m.fx.forEach(f => popText(mg, f, f.x + ox, Math.max(52, f.y) + oy));
}
mcv.addEventListener('pointerdown', e => {
  const m = mine; if (!m || m.over) return;
  const r = mcv.getBoundingClientRect(), x = (e.clientX - r.left) * mcv.width / r.width, y = (e.clientY - r.top) * mcv.height / r.height;
  const o = m.targets.find(o => Math.hypot(o.x - x, o.y - y) <= 32);
  if (!o) { if (y > 30) m.swings.push({ x, y, t: 0, g: -1 }); return; }
  const t = (performance.now() - m.t0) / 1000, err = t - o.born - m.M.T, a = Math.abs(err);
  const g = a <= .07 ? 3 : a <= .16 ? 2 : a <= .28 ? 1 : 0;
  m.targets = m.targets.filter(x => x !== o); m.dying.push(o); m.hits[g]++; SFX.pick(g);
  const label = [err < 0 ? 'Cedo!' : 'Tarde!', 'Ok', 'Bom', 'Perfeito!'][g];
  let q = 0, txt = label;
  if (o.gem) { if (g >= 2) { q = 1; m.loot.gems[o.id] = (m.loot.gems[o.id] || 0) + 1; txt = `${label} +1 ${gemOf(o.id).n}`; } else txt = label + ' (a gema rachou)'; }
  else { const yl = MINE_YIELD[g]; q = yl < 1 ? (Math.random() < yl ? 1 : 0) : yl; if (q) { m.loot.ores[o.id] = (m.loot.ores[o.id] || 0) + q; txt = `${label} +${q} ${ore(o.id).n}`; } }
  const extra = mineBonus(o, q, g, m.gems, m.lv);
  extra.forEach(x => { const L = x.gem ? m.loot.gems : m.loot.ores; L[x.id] = (L[x.id] || 0) + x.q; txt += ` +${x.q} ${(x.gem ? gemOf(x.id) : ore(x.id)).n}`; });
  m.swings.push({ x: o.x, y: o.y, t: 0, g, o, q, txt, extra });   // o efeito acontece quando a picareta chega (mineImpact)
});
function endMine() {
  const m = mine; if (!m || m.over) return; m.over = true;
  const list = [...Object.entries(m.loot.ores).map(([k, q]) => `<span><img src="${rawImg(k, 3)}" alt="">${q} minério de ${ore(k).n}</span>`), ...Object.entries(m.loot.gems).map(([k, q]) => `<span><img src="${gemImg(k, 3)}" alt="">${q} ${gemOf(k).n}</span>`)];
  const r = $('#mine-result'); r.hidden = false;
  r.innerHTML = `<h2>Fim da descida</h2><div class="sub">Perfeitos ${m.hits[3]} · Bons ${m.hits[2]} · Ok ${m.hits[1]} · Perdidos ${m.hits[0]}</div><div class="loot">${list.join('') || '<span>Nada desta vez…</span>'}</div><button class="btn big">Coletar</button><small class="sub">O minério vai para a aba Forja. A mina reabre em ${mmss(MINE_CD)}.</small>`;
  r.querySelector('button').onclick = collectMine;
}
function collectMine() {
  const m = mine; if (!m) return;
  Object.entries(m.loot.ores).forEach(([k, q]) => { S.raw[k] = (S.raw[k] || 0) + q; });
  if (Object.keys(m.loot.ores).length) leftTab = 'raw';
  Object.entries(m.loot.gems).forEach(([k, q]) => { S.gems[k] = (S.gems[k] || 0) + q; });
  S.mineAt = Date.now() + MINE_CD; S.stats.mines++; save();
  mine = null; $('#mine').hidden = true; SFX.done(); renderAll();
}
$('#mine-exit').onclick = () => { if (!mine) return; if (!mine.over) { mine.targets = []; mine.spawned = mine.M.targets; mine.fx = []; endMine(); } else collectMine(); };
function renderMineBtn() {
  const b = $('#mine-btn'), ready = mineReady();
  const txt = ready ? '⛏ Mina!' : `⛏ ${mmss(S.mineAt - Date.now())}`;
  b.classList.toggle('ready', ready); b.title = MINES[S.up.mine].n; if (b.dataset.t !== txt) b.textContent = b.dataset.t = txt;
}

/* ======================= Runas =======================
   Fim de jogo: a mesa de runas abre depois da Bigorna e do Martelo Rúnicos (loja de melhorias).
   No estilo "osu": os pontos da runa aparecem em ordem, cada um com um anel que se fecha. Clique em cada ponto quando
   o anel encostar nele e o traço vai sendo gravado na laje. A precisão média decide o grau da runa
   (Comum → Lendária, limitado pelo nível da mesa); com precisão baixa demais, a pedra racha.
   A runa entra na bigorna (espaço no meio dela), uma por peça, só em armaduras e armas. */
let runeGame = null;
const rcv = $('#rune-cv'), rg = rcv.getContext('2d');
const [rlo, rl] = lowCanvas();
const runeReady = () => Date.now() >= S.runeAt;
// Glifos: pontos em ordem (x, y de 0 a 1); o 3º valor = 1 levanta o cinzel antes do ponto (começa outro traço)
const GLYPHS = [
  { n: 'Uruz',     p: [[.3, .92], [.3, .52], [.3, .12], [.55, .32], [.7, .6], [.7, .92]] },
  { n: 'Thurisaz', p: [[.36, .95], [.36, .52], [.36, .06], [.36, .28, 1], [.68, .5], [.36, .74]] },
  { n: 'Ansuz',    p: [[.34, .95], [.34, .5], [.34, .06], [.54, .2], [.72, .34], [.34, .4, 1], [.54, .54], [.72, .68]] },
  { n: 'Raido',    p: [[.3, .95], [.3, .52], [.3, .06], [.66, .27], [.32, .5], [.5, .72], [.7, .95]] },
  { n: 'Kenaz',    p: [[.68, .08], [.48, .28], [.3, .5], [.48, .72], [.68, .92]] },
  { n: 'Gebo',     p: [[.24, .1], [.41, .37], [.59, .63], [.76, .9], [.76, .1, 1], [.59, .37], [.41, .63], [.24, .9]] },
  { n: 'Algiz',    p: [[.5, .95], [.5, .62], [.5, .08], [.24, .14, 1], [.5, .46], [.76, .14]] },
  { n: 'Sowilo',   p: [[.7, .08], [.5, .2], [.3, .34], [.5, .48], [.7, .62], [.5, .78], [.3, .92]] },
  { n: 'Tiwaz',    p: [[.5, .95], [.5, .65], [.5, .36], [.5, .06], [.24, .34, 1], [.5, .06], [.76, .34]] },
  { n: 'Othala',   p: [[.24, .95], [.5, .62], [.76, .36], [.5, .08], [.24, .36], [.5, .62], [.76, .95]] },
];
const RX = x => Math.round(104 + x * 112), RY = y => Math.round(24 + y * 122);
function pxLine(g, x0, y0, x1, y1, c, w = 1) { g.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0 || 1; for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - (w >> 1), Math.round(y0 + (y1 - y0) * i / n) - (w >> 1), w, w); }
// Câmara escura com a laje de pedra no centro e duas velas
function runeBg() {
  const [c, g] = lowCanvas();
  g.fillStyle = '#14111c'; g.fillRect(0, 0, 320, 170);
  for (let i = 0; i < 60; i++) { const w = irand(12, 30), h = irand(6, 14), x = irand(-6, 310), y = irand(-4, 166); g.fillStyle = pick(['#ffffff08', '#00000030', '#ffffff05']); g.fillRect(x, y, w, h); g.fillStyle = '#00000040'; g.fillRect(x, y + h - 1, w, 1); }
  g.fillStyle = '#0c0a12'; g.fillRect(0, 146, 320, 24); g.fillStyle = '#231e30'; g.fillRect(0, 146, 320, 1);
  g.fillStyle = '#0e0a08'; g.fillRect(89, 7, 142, 156);
  g.fillStyle = '#67615c'; g.fillRect(91, 9, 138, 152); g.fillStyle = '#8b8580'; g.fillRect(91, 9, 138, 2); g.fillRect(91, 9, 2, 152); g.fillStyle = '#45403d'; g.fillRect(91, 159, 138, 2); g.fillRect(227, 9, 2, 152);
  g.fillStyle = '#57514c'; g.fillRect(97, 15, 126, 140); g.fillStyle = '#45403d'; g.fillRect(97, 15, 126, 1); g.fillRect(97, 15, 1, 140); g.fillStyle = '#6f6964'; g.fillRect(97, 154, 126, 1); g.fillRect(222, 15, 1, 140);
  for (let i = 0; i < 260; i++) { g.fillStyle = pick(['#00000026', '#ffffff10', '#0000001a']); g.fillRect(irand(98, 221), irand(16, 153), pick([1, 1, 2]), 1); }
  g.fillStyle = '#00000050'; for (let i = 0; i < 4; i++) { let x = rand(100, 220), y = rand(18, 150); for (let k = 0; k < 16; k++) { g.fillRect(x | 0, y | 0, 1, 1); x += pick([-1, 0, 1, 1]); y += pick([-1, 0, 1]); } }
  [60, 260].forEach(x => { g.fillStyle = '#0e0a08'; g.fillRect(x - 5, 130, 10, 17); g.fillRect(x - 3, 109, 6, 22); g.fillStyle = '#45403d'; g.fillRect(x - 4, 131, 8, 15); g.fillStyle = '#67615c'; g.fillRect(x - 4, 131, 2, 15); g.fillStyle = '#e8dcc0'; g.fillRect(x - 2, 110, 4, 21); g.fillStyle = '#b9ad90'; g.fillRect(x + 1, 110, 1, 21); });
  const v = g.createRadialGradient(160, 85, 70, 160, 85, 210); v.addColorStop(0, '#0000'); v.addColorStop(1, '#000000c0'); g.fillStyle = v; g.fillRect(0, 0, 320, 170);
  return c;
}
// O botão ᚱ (canto de cima da bigorna) abre a aba de runas: as já gravadas e a opção de gravar mais
$('#rune-btn').onclick = () => { if (!busy() && $('#modal').hidden) openModal('runes'); };
const runeCraftTxt = () => runeReady() ? 'ᚱ Gravar' : `⏱ ${mmss(S.runeAt - Date.now())}`;
function startRunes() {
  const U = RUNE_UP[S.up.runes];
  runeGame = { U, list: Array.from({ length: U.cnt }, () => pick(GLYPHS)), gi: -1, made: [], bg: runeBg(), parts: [], rings: [], stars: [], fx: [], shake: 0, last: performance.now(), over: false };
  nextGlyph();
  $('#rune-title').textContent = 'ᚱ ' + U.n; $('#rune-result').hidden = true; $('#runes').hidden = false; requestAnimationFrame(runeLoop);
}
function nextGlyph() {
  const R = runeGame; R.gi++; R.G = R.list[R.gi];
  let t = 1.5; const beat = .66 - S.up.runes * .025;
  R.nodes = R.G.p.map(([x, y, up], i) => { if (i) t += beat + (up ? .3 : 0); return { x: RX(x), y: RY(y), up: !!up, t, res: null }; });
  R.t0 = performance.now(); R.phase = 'play'; R.ft = 0; R.grade = 0;
}
function runeHit(n, q, txt) {
  const R = runeGame, col = ['#a8a29e', '#ff8a3d', '#fbbf24', '#fff7d6'][q];
  n.res = q; R.fx.push({ x: n.x * 2, y: n.y * 2 - 22, txt, c: col, big: q === 3, l: .7, L: .7 });
  if (!q) { noise(.08, .03, 500); return; }
  SFX.crack(q); R.shake = Math.max(R.shake, [0, 2, 3, 5][q]);
  R.stars.push({ x: n.x, y: n.y, l: .14, L: .14, s: 4 + q * 2 });
  R.rings.push({ x: n.x, y: n.y, r: 8, v: 90 + q * 30, l: .3, L: .3, c: q === 3 ? '#e0f7ff' : '#7dd3fc' });
  for (let i = 0; i < 4 + q * 5; i++) R.parts.push({ k: 'spark', x: n.x, y: n.y, vx: rand(-120, 120), vy: rand(-150, 30), gr: 300, l: rand(.2, .5), L: .5, c: pick(['#e0f7ff', '#7dd3fc', '#fff7d6']) });
  for (let i = 0; i < 3 + q; i++) R.parts.push({ k: 'chip', x: n.x, y: n.y, vx: rand(-60, 60), vy: rand(-110, -20), gr: 500, l: rand(.3, .6), L: .6, c: pick(STONE), s: pick([1, 2]) });
}
function runeLoop(now) {
  const R = runeGame; if (!R || R.over) return;
  const dt = Math.min(.05, (now - R.last) / 1000), t = (now - R.t0) / 1000; R.last = now;
  if (R.phase === 'play') {
    R.nodes.forEach(n => { if (n.res == null && t > n.t + .26) runeHit(n, 0, 'Perdeu'); });
    if (R.nodes.every(n => n.res != null)) {   // glifo terminado: a precisão média vira o grau
      const p = R.nodes.reduce((a, n) => a + n.res, 0) / (3 * R.nodes.length);
      R.grade = Math.min(R.U.max, p >= .93 ? 5 : p >= .8 ? 4 : p >= .65 ? 3 : p >= .45 ? 2 : p >= .2 ? 1 : 0); R.acc = p; R.phase = 'flash'; R.ft = 0;
      if (R.grade) { R.made.push(R.grade); SFX.done(); R.shake = 6; } else { SFX.no(); noise(.3, .06, 300); }
    }
  } else if ((R.ft += dt) > 1.5) { if (R.gi + 1 < R.list.length) nextGlyph(); else return endRunes(); }
  runeDraw(R, (now - R.t0) / 1000, dt);
  const done = R.nodes.filter(n => n.res != null).length;
  $('#rune-hud').textContent = `Runa ${R.gi + 1}/${R.list.length} · ${R.G.n} · ponto ${Math.min(done + 1, R.nodes.length)}/${R.nodes.length} · grau máximo: ${RUNE_G[R.U.max].n}`;
  requestAnimationFrame(runeLoop);
}
function runeDraw(R, t, dt) {
  const g = rl, N = R.nodes, flash = R.phase === 'flash', gc = R.grade ? RAR_HEX[RUNE_G[R.grade].r] : '#57534e';
  g.globalAlpha = 1; g.drawImage(R.bg, 0, 0);
  // velas: chama e luz que tremulam
  const fk = .5 + .5 * Math.sin(performance.now() / 110) * Math.sin(performance.now() / 190);
  [60, 260].forEach(x => {
    const lg = g.createRadialGradient(x, 104, 2, x, 104, 70 + fk * 8); lg.addColorStop(0, `rgba(255,180,100,${.26 + fk * .06})`); lg.addColorStop(1, 'rgba(255,150,60,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(x - 80, 24, 160, 146); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff8a3d'; g.fillRect(x - 1, 104 - (fk > .5 ? 1 : 0), 3, 5 + (fk > .5 ? 1 : 0)); g.fillStyle = '#fff7d6'; g.fillRect(x, 106, 1, 3);
  });
  // sulco do glifo (guia) e traços já gravados
  N.forEach((n, i) => { if (i && !n.up) pxLine(g, N[i - 1].x, N[i - 1].y, n.x, n.y, '#3f3a44', 3); });
  N.forEach((n, i) => {
    if (!i || n.up) return; const a = N[i - 1]; if (n.res == null || a.res == null) return;
    const ok = n.res > 0 && a.res > 0;
    if (flash) { pxLine(g, a.x, a.y, n.x, n.y, R.grade ? gc : '#2a2630', 3); if (R.grade && Math.sin(R.ft * 14) > -.3) pxLine(g, a.x, a.y, n.x, n.y, '#ffffff', 1); }
    else if (ok) { pxLine(g, a.x, a.y, n.x, n.y, '#7dd3fc', 3); pxLine(g, a.x, a.y, n.x, n.y, '#e0f7ff', 1); }
    else pxLine(g, a.x, a.y, n.x, n.y, '#7f1d1d', 3);
  });
  if (flash && R.grade && Math.random() < .6) { const n = pick(N); R.parts.push({ k: 'spark', x: n.x + rand(-6, 6), y: n.y + rand(-6, 6), vx: rand(-30, 30), vy: rand(-70, -20), gr: 60, l: rand(.3, .7), L: .7, c: gc }); }
  // pontos: o próximo fica mais claro; o anel fecha até encostar
  const cur = N.find(n => n.res == null);
  N.forEach(n => {
    if (n.res != null || t < n.t - 1) return;
    const p = clamp(t - (n.t - 1), 0, 1), on = n === cur;
    pxDisc(g, n.x, n.y, 8, '#0e0a08'); pxDisc(g, n.x, n.y, 7, on ? '#4b4470' : '#35304a'); pxDisc(g, n.x - 1, n.y - 1, 4, on ? '#6f67a8' : '#454063');
    const r = 9 + 24 * (1 - p), c = t >= n.t ? '#ef4444' : n.t - t <= .15 ? '#fff7d6' : `rgba(255,255,255,${.3 + .7 * p})`;
    pxRing(g, n.x, n.y, r, c); pxRing(g, n.x, n.y, r + 1, c);
  });
  R.parts = R.parts.filter(p => {
    if ((p.l -= dt) <= 0) return false;
    p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.globalAlpha = Math.min(1, p.l / p.L * 2.5); g.fillStyle = p.c;
    g.fillRect(p.x | 0, p.y | 0, p.s || 1, p.s || 1); g.globalAlpha = 1; return true;
  });
  R.rings = R.rings.filter(r => (r.l -= dt) > 0);
  R.rings.forEach(r => { r.r += r.v * dt; g.globalAlpha = r.l / r.L; pxRing(g, r.x, r.y, r.r, r.c); pxRing(g, r.x, r.y, r.r + 1, r.c); g.globalAlpha = 1; });
  R.stars = R.stars.filter(s => (s.l -= dt) > 0);
  R.stars.forEach(s => { const n = Math.round(s.s * (1.3 - s.l / s.L * .5)); g.fillStyle = '#ffffff'; g.fillRect(s.x - n, s.y, n * 2 + 1, 1); g.fillRect(s.x, s.y - n, 1, n * 2 + 1); g.fillRect(s.x - 1, s.y - 1, 3, 3); });
  // amplia 2× e escreve por cima
  const sk = R.shake; R.shake = Math.max(0, sk - dt * 40);
  const ox = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0, oy = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0;
  rg.imageSmoothingEnabled = false; rg.globalAlpha = 1; rg.fillStyle = '#0e0a08'; rg.fillRect(0, 0, 640, 340); rg.drawImage(rlo, ox, oy, 640, 340);
  rg.font = 'bold 12px ui-monospace, monospace'; rg.textAlign = 'center';
  N.forEach((n, i) => { if (n.res != null || t < n.t - 1) return; rg.fillStyle = '#0e0a08'; rg.fillText(i + 1, n.x * 2 + ox, n.y * 2 + 6 + oy); rg.fillStyle = n === cur ? '#ffffff' : '#b9b0d0'; rg.fillText(i + 1, n.x * 2 + ox, n.y * 2 + 4 + oy); });
  R.fx = R.fx.filter(f => (f.l -= dt) > 0); R.fx.forEach(f => popText(rg, f, f.x + ox, Math.max(30, f.y) + oy));
  if (flash) popText(rg, { txt: R.grade ? `Runa ${R.G.n} ${RUNE_G[R.grade].n}!  (${Math.round(R.acc * 100)}%)` : `A pedra rachou… (${Math.round(R.acc * 100)}%)`, c: R.grade ? gc : '#a8a29e', big: true, l: 1, L: 1 + Math.min(R.ft, .12) }, 320, 176);
}
rcv.addEventListener('pointerdown', e => {
  const R = runeGame; if (!R || R.over || R.phase !== 'play') return;
  const b = rcv.getBoundingClientRect(), x = (e.clientX - b.left) * rcv.width / b.width, y = (e.clientY - b.top) * rcv.height / b.height, t = (performance.now() - R.t0) / 1000;
  const n = R.nodes.find(n => n.res == null);   // só o próximo ponto da ordem pode ser tocado
  if (!n || Math.hypot(n.x * 2 - x, n.y * 2 - y) > 32 || t < n.t - .45) return;
  const a = Math.abs(t - n.t), q = a <= .07 ? 3 : a <= .15 ? 2 : a <= .26 ? 1 : 0;
  SFX.pick(q); runeHit(n, q, [t < n.t ? 'Cedo!' : 'Tarde!', 'Ok', 'Bom', 'Perfeito!'][q]);
});
function endRunes() {
  const R = runeGame; if (!R || R.over) return; R.over = true;
  const list = R.made.map(g => `<span class="b-${RUNE_G[g].r}"><img src="${runeImg(g, 3)}" alt="">Runa <span class="r-${RUNE_G[g].r}">${RUNE_G[g].n}</span></span>`);
  const r = $('#rune-result'); r.hidden = false;
  r.innerHTML = `<h2>Runas gravadas</h2><div class="loot">${list.join('') || '<span>Nenhuma runa desta vez…</span>'}</div><button class="btn big">Coletar</button><small class="sub">As runas ficam no botão de runas, no canto da bigorna. A mesa recarrega em ${mmss(R.U.cd)}.</small>`;
  r.querySelector('button').onclick = collectRunes;
}
function collectRunes() {
  const R = runeGame; if (!R) return;
  R.made.forEach(g => { S.runes[g] = (S.runes[g] || 0) + 1; }); S.stats.runes += R.made.length;
  if (R.made.length) leftTab = 'gems';
  S.runeAt = Date.now() + R.U.cd; save();
  runeGame = null; $('#runes').hidden = true; SFX.done(); renderAll();
}
$('#rune-exit').onclick = () => { if (!runeGame) return; if (!runeGame.over) endRunes(); else collectRunes(); };
function renderRuneBtn() {
  const b = $('#rune-btn'), on = S.up.runes > 0; b.hidden = !on; if (!on) return;
  if (!b.firstChild) b.innerHTML = `<img src="${sprite('i_rune', NEUTRAL, 4)}" alt=""><small></small>`;
  const ready = runeReady(), txt = ready ? '' : mmss(S.runeAt - Date.now()), tm = b.lastChild;
  b.classList.toggle('ready', ready); tm.hidden = ready; if (tm.textContent !== txt) tm.textContent = txt;
}

/* ======================= Floresta =======================
   Abre com o molde de Arco ou de Cajado. Cada árvore sorteada tem uma dificuldade (o grau da madeira).
   Teste de força: segure o clique e a carga do machado sobe da esquerda para a direita num ritmo quase constante;
   se chegar ao fim, ela volta no mesmo ritmo (vai e vem). Solte com a carga dentro da faixa da árvore.
   Errar a faixa na primeira tentativa não perde a árvore: dá para tentar mais uma vez.
   Como a mina, a cena é desenhada em baixa resolução e ampliada 2×. No acerto a árvore tomba; no erro ela só balança. */
let forest = null;
const tcv = $('#for-cv'), tg = tcv.getContext('2d');
const [flo, fl] = lowCanvas();
const treeStars = o => clamp(Math.ceil(o.tier / 2), 1, 5);
const forestReady = () => Date.now() >= S.forestAt;
// Folhagem de cada madeira (do tom mais escuro ao brilho)
const LEAVES = {
  pinho: ['#0f3326', '#17503a', '#22785a', '#4fb38a'], carvalho: ['#0f3d21', '#166534', '#22a04a', '#5fd67e'], freixo: ['#3a4a14', '#5a7a1c', '#8fb52a', '#c8e06a'],
  teixo: ['#0c2e2a', '#12524a', '#1c8272', '#52c2a8'], pauferro: ['#33381a', '#525a22', '#7d8a30', '#b3c05a'], ebano: ['#141c2b', '#263347', '#3b4c66', '#7c8ba6'], sandalo: ['#4f1414', '#8f1d1d', '#d43030', '#ff8a7a'],
};
$('#forest-btn').onclick = () => {
  if (busy() || !$('#modal').hidden) return;
  if (!forestReady()) return nope(`A floresta está rebrotando. Volte em ${mmss(S.forestAt - Date.now())}.`);
  startForest();
};
// Desenha a árvore inteira uma vez (tronco da cor da madeira + copa em discos de pixels); a base fica em (55, 138)
function treeCanvas(o) {
  const c = Object.assign(document.createElement('canvas'), { width: 110, height: 140 }), g = c.getContext('2d'), sh = o.sh, L = LEAVES[o.id] || LEAVES.carvalho, INKC = '#0e0a08';
  g.fillStyle = INKC; g.fillRect(43, 58, 24, 81); g.fillRect(38, 133, 34, 6);
  g.fillStyle = sh[2]; g.fillRect(44, 58, 22, 80); g.fillRect(39, 134, 32, 4);
  g.fillStyle = sh[1]; g.fillRect(46, 58, 14, 80); g.fillRect(41, 134, 20, 2);
  g.fillStyle = sh[0]; g.fillRect(48, 58, 3, 80);
  g.fillStyle = sh[2]; [[53, 70, 6], [56, 96, 8], [47, 112, 5], [58, 120, 7], [52, 84, 4]].forEach(([x, y, h]) => g.fillRect(x, y, 1, h));
  const blobs = [[55, 44, 30], [31, 58, 20], [79, 58, 20], [42, 26, 19], [68, 26, 19]];
  blobs.forEach(([x, y, r]) => pxDisc(g, x, y, r + 1, INKC));
  blobs.forEach(([x, y, r]) => pxDisc(g, x, y, r, L[0]));
  blobs.forEach(([x, y, r]) => pxDisc(g, x - 2, y - 3, r - 4, L[1]));
  blobs.forEach(([x, y, r]) => pxDisc(g, x - 5, y - 7, Math.round(r * .5), L[2]));
  blobs.forEach(([x, y, r]) => { g.fillStyle = L[3]; g.fillRect(x - 9, y - 12, 3, 1); g.fillRect(x - 11, y - 9, 1, 2); g.fillRect(x - 4, y - 14, 2, 1); });
  // sombras entre as folhas
  g.fillStyle = L[0]; [[40, 50], [62, 60], [70, 40], [50, 66], [28, 64], [84, 66], [56, 30]].forEach(([x, y]) => { g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 3, 1); });
  return c;
}
function forestBg() {
  const [c, g] = lowCanvas();
  const sky = g.createLinearGradient(0, 0, 0, 130); sky.addColorStop(0, '#0b1a17'); sky.addColorStop(1, '#1d4030'); g.fillStyle = sky; g.fillRect(0, 0, 320, 170);
  const pine = (x, base, h, w, c1, c2) => { for (let i = 0; i < h; i++) { const ww = Math.round(w * (.15 + .85 * ((i % (h / 3)) / (h / 3)) * (.45 + .55 * i / h)) + 2); g.fillStyle = i % 5 < 3 ? c1 : c2; g.fillRect(x - (ww >> 1), base - h + i, ww, 1); } g.fillStyle = c2; g.fillRect(x - 1, base - 4, 3, 6); };
  for (let i = 0; i < 13; i++) pine(12 + i * 26 + irand(-6, 6), 122, irand(70, 104), irand(22, 30), '#10271c', '#0d2118');
  for (let i = 0; i < 9; i++) { const x = 4 + i * 40 + irand(-8, 8); if (Math.abs(x - 160) > 46) pine(x, 128, irand(56, 84), irand(26, 36), '#173524', '#122b1d'); }
  // chão: grama, terra e tufos
  g.fillStyle = '#2d4a1f'; g.fillRect(0, 124, 320, 46); g.fillStyle = '#3f6a2a'; g.fillRect(0, 124, 320, 2);
  g.fillStyle = '#25401a'; g.fillRect(0, 150, 320, 20);
  for (let i = 0; i < 70; i++) { const x = irand(0, 318), y = irand(123, 166); g.fillStyle = pick(['#4f8234', '#3f6a2a', '#22381a']); g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y + 1, 1, 1); }
  for (let i = 0; i < 8; i++) { const x = irand(6, 312), y = irand(132, 164); g.fillStyle = pick(['#fde68a', '#fca5a5', '#e9d5ff']); g.fillRect(x, y, 1, 1); }
  const v = g.createRadialGradient(160, 80, 60, 160, 80, 210); v.addColorStop(0, '#0000'); v.addColorStop(1, '#000000a0'); g.fillStyle = v; g.fillRect(0, 0, 320, 170);
  return c;
}
function newTree() {
  const o = wpick(forestWoods(S.up.forest), x => x.fw), zw = clamp(.36 - o.tier * .02, .16, .36) * (1 + FOREST_EASE * (S.up.forest - o.fl));   // faixa mais larga para madeiras de níveis anteriores
  return { o, zw, zc: clamp(.4 + o.tier * .035 + rand(-.1, .1), zw / 2 + .15, 1 - zw / 2 - .04), sp: .6 + o.tier * .06, retry: false, chop: 0, cv: treeCanvas(o), born: null, fall: null };
}
function startForest() {
  const now = performance.now();
  forest = { axe: sprCv('axebig', ANVILS[S.up.anvil].sh, S.up.anvil), bg: forestBg(), n: 0, tree: newTree(), c: 0, hold: false, drop: false, t0: now, last: now, ph: Math.random() * 9, loot: {}, fx: [], parts: [], swing: 0, wait: 0, shake: 0, leafT: 0, hits: [0, 0, 0, 0], over: false };
  $('#for-result').hidden = true; $('#forest').hidden = false; requestAnimationFrame(forestLoop);
}
function forestLoop(now) {
  const f = forest; if (!f || f.over) return;
  const dt = Math.min(.05, (now - f.last) / 1000), t = (now - f.t0) / 1000; f.last = now;
  const tr = f.tree;
  // carga: sobe num ritmo quase constante enquanto segura; ao encher, volta (vai e vem); solto, esvazia
  if (f.wait > 0) f.wait -= dt;
  else if (f.hold) {
    const pulse = .8 + .4 * (.5 + .5 * Math.sin(t * 5.1 + f.ph));   // leve pulso, sem trancos
    f.c += (f.drop ? -1 : 1) * tr.sp * pulse * dt;
    if (f.c >= 1) { f.c = 1; f.drop = true; } else if (f.c <= 0) { f.c = 0; f.drop = false; }
  } else f.c = Math.max(0, f.c - 2.5 * dt);
  // ---- desenho em baixa resolução ----
  const g = fl, X = 160, G = 127, L = LEAVES[tr.o.id] || LEAVES.carvalho;
  g.globalAlpha = 1; g.drawImage(f.bg, 0, 0);
  tr.born ??= t;
  const grow = Math.min(1, (t - tr.born) / .28), sway = f.swing > 0 ? Math.round(Math.sin(f.swing * 60) * 2) : Math.round(Math.sin(t * 1.3) * .6);
  if (tr.fall) {   // acertou: fica o toco e a árvore tomba para a esquerda
    tr.fall.t += dt; const k = Math.min(1, tr.fall.t / .55);
    g.fillStyle = '#0e0a08'; g.fillRect(X - 12, G - 9, 24, 10); g.fillStyle = tr.o.sh[2]; g.fillRect(X - 11, G - 8, 22, 8); g.fillStyle = tr.o.sh[1]; g.fillRect(X - 9, G - 8, 14, 8); g.fillStyle = '#f3d9a4'; g.fillRect(X - 11, G - 9, 22, 2); g.fillStyle = '#c9a05f'; g.fillRect(X - 6, G - 9, 8, 1);
    g.save(); g.translate(X, G - 8); g.rotate(-1.5 * k * k); g.globalAlpha = k > .7 ? Math.max(0, 1 - (k - .7) / .3) : 1; g.drawImage(tr.cv, -55, -130); g.restore();
  } else {
    g.save(); g.translate(X + sway, G); g.scale(1, grow < 1 ? Math.max(.02, backOut(grow)) : 1); g.drawImage(tr.cv, -55, -138);
    if (tr.chop) { g.fillStyle = '#0e0a08'; g.fillRect(2, -27, 10, 10); g.fillStyle = '#f3d9a4'; g.fillRect(3, -26, 8, 6); g.fillStyle = '#c9a05f'; g.fillRect(3, -20, 8, 2); }
    g.restore();
  }
  // folhas caindo o tempo todo, devagar
  if ((f.leafT -= dt) <= 0 && !tr.fall) { f.leafT = rand(.25, .6); f.parts.push({ k: 'leaf', x: X + rand(-48, 48), y: G - rand(70, 120), vy: rand(14, 26), ph: rand(0, 6), l: 3, L: 3, c: pick(L.slice(1)) }); }
  // machado: golpe ao soltar (lâmina virada para o tronco)
  if (f.swing > 0) { f.swing -= dt; const k = 1 - Math.max(0, f.swing) / .25, a = k < .45 ? -.9 + 2.3 * (k / .45) ** 2 : 1.4 - .35 * Math.sin((k - .45) / .55 * 1.5708); g.save(); g.translate(X + 42, G - 16); g.scale(-1, 1); g.rotate(a); g.drawImage(f.axe, -13, -29); g.restore(); }
  f.parts = f.parts.filter(p => {
    if ((p.l -= dt) <= 0) return false;
    g.globalAlpha = Math.min(1, p.l / p.L * 3);
    if (p.k === 'leaf') { p.y += p.vy * dt; p.x += Math.sin(t * 4 + p.ph) * 20 * dt; if (p.y > G + 6) { p.vy = 0; p.l = Math.min(p.l, .5); } g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, 2, 1); g.fillRect((p.x | 0) + (Math.sin(t * 4 + p.ph) > 0 ? 1 : 0), (p.y | 0) + 1, 1, 1); }
    else { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
    g.globalAlpha = 1; return true;
  });
  // ---- amplia 2× e desenha a interface por cima ----
  const sk = f.shake; f.shake = Math.max(0, sk - dt * 40);
  const ox = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0, oy = sk ? Math.round(rand(-sk, sk) / 2) * 2 : 0;
  tg.imageSmoothingEnabled = false; tg.fillStyle = '#0e0a08'; tg.fillRect(0, 0, 640, 340); tg.drawImage(flo, ox, oy, 640, 340);
  tg.font = 'bold 15px ui-monospace, monospace'; tg.textAlign = 'center'; tg.lineJoin = 'round'; tg.lineWidth = 4; tg.strokeStyle = '#0e0a08';
  const title = `${tr.o.n}  ${'★'.repeat(treeStars(tr.o))}${'☆'.repeat(5 - treeStars(tr.o))}`;
  tg.strokeText(title, 320, 24); tg.fillStyle = '#f3e9dc'; tg.fillText(title, 320, 24);
  f.fx = f.fx.filter(x => (x.l -= dt) > 0); f.fx.forEach(x => popText(tg, x, 320, 96));
  // barra de força: começa na esquerda; faixa de acerto da árvore
  const BX = 60, BW = 520, BY = 290, zx = BX + (tr.zc - tr.zw / 2) * BW, zw = tr.zw * BW;
  tg.fillStyle = '#0e0a08'; tg.fillRect(BX - 4, BY - 6, BW + 8, 36); tg.fillRect(BX - 6, BY - 4, BW + 12, 32);
  tg.fillStyle = '#7a5c44'; tg.fillRect(BX - 2, BY - 4, BW + 4, 32); tg.fillRect(BX - 4, BY - 2, BW + 8, 28);
  tg.fillStyle = '#0c0907'; tg.fillRect(BX, BY, BW, 24);
  tg.fillStyle = '#4ade8066'; tg.fillRect(zx, BY, zw, 24); tg.fillStyle = '#4ade80'; tg.fillRect(zx, BY, 2, 24); tg.fillRect(zx + zw - 2, BY, 2, 24);
  tg.fillStyle = '#fbbf24cc'; tg.fillRect(BX + (tr.zc - tr.zw * .15) * BW, BY, tr.zw * .3 * BW, 24);
  const grd = tg.createLinearGradient(BX, 0, BX + BW, 0); grd.addColorStop(0, '#16a34a'); grd.addColorStop(.6, '#f59e0b'); grd.addColorStop(1, '#dc2626');
  tg.globalAlpha = .9; tg.fillStyle = grd; tg.fillRect(BX, BY + 6, Math.round(f.c * BW / 4) * 4, 12); tg.globalAlpha = 1;
  tg.fillStyle = '#ffffff33'; tg.fillRect(BX, BY + 6, Math.round(f.c * BW / 4) * 4, 2);
  tg.fillStyle = '#0e0a08'; tg.fillRect(BX + f.c * BW - 4, BY - 6, 8, 36); tg.fillStyle = '#ef4444'; tg.fillRect(BX + f.c * BW - 2, BY - 4, 4, 32);
  $('#for-hud').textContent = `Árvore ${Math.min(f.n + 1, FOREST_TREES)}/${FOREST_TREES} · Perfeitos ${f.hits[3]} · ${f.hold ? 'carregando…' : 'segure o clique (ou Espaço)'}`;
  if (f.n >= FOREST_TREES && f.wait <= 0 && !f.fx.length) return endForest();
  requestAnimationFrame(forestLoop);
}
function chop() {
  const f = forest; if (!f || f.over || f.wait > 0 || f.n >= FOREST_TREES) return;
  const tr = f.tree, d = Math.abs(f.c - tr.zc) / (tr.zw / 2), g = f.c < .03 ? -1 : d <= .3 ? 3 : d <= .7 ? 2 : d <= 1.12 ? 1 : 0;   // a borda da faixa tem uma pequena tolerância
  if (g < 0) return;
  if (g === 0 && !tr.retry) {   // primeira tentativa fora da faixa: a árvore só balança e dá para tentar de novo
    tr.retry = true; f.swing = .25; tr.chop = 1; f.shake = 2; SFX.pick(0); noise(.08, .04, 500);
    f.fx.push({ txt: f.c < tr.zc ? 'Fraco! Mais uma chance' : 'Forte demais! Mais uma chance', c: '#a8a29e', l: .9, L: .9 });
    for (let i = 0; i < 5; i++) f.parts.push({ k: 'chip', x: 168, y: 104, vx: rand(-20, 80), vy: rand(-100, -30), l: rand(.3, .6), L: .6, c: pick(tr.o.sh), s: pick([1, 2]) });
    f.c = 0; f.drop = false; f.hold = false; f.wait = .45; return;
  }
  f.hits[g]++; f.swing = .25; tr.chop = 1; SFX.pick(g); SFX.crack(g);
  const y = FOREST_YIELD[g], q = y < 1 ? (Math.random() < y ? 1 : 0) : y;
  if (q) f.loot[tr.o.id] = (f.loot[tr.o.id] || 0) + q;
  f.fx.push({ txt: q ? `${['Errou!', 'Ok', 'Bom', 'Perfeito!'][g]} +${q} ${tr.o.n}` : ['Errou!', 'Ok', 'Bom', 'Perfeito!'][g], c: ['#a8a29e', '#ff8a3d', '#fbbf24', '#fff7d6'][g], big: g === 3, l: .8, L: .8 });
  // lascas do corte, folhas sacudidas da copa e tremor; no acerto a árvore tomba
  const L = LEAVES[tr.o.id] || LEAVES.carvalho;
  for (let i = 0; i < 6 + g * 6; i++) f.parts.push({ k: 'chip', x: 168, y: 104, vx: rand(-20, 110), vy: rand(-130, -30), l: rand(.4, .9), L: .9, c: pick([...tr.o.sh, '#f3d9a4']), s: pick([1, 2, 2, 3]) });
  for (let i = 0; i < 8 + g * 6; i++) f.parts.push({ k: 'leaf', x: 160 + rand(-50, 50), y: 127 - rand(60, 124), vy: rand(20, 60), ph: rand(0, 6), l: rand(1.2, 2.4), L: 2.4, c: pick(L.slice(1)) });
  f.shake = [2, 3, 5, 8][g];
  if (g >= 1) setTimeout(() => { if (forest === f && f.tree === tr) { tr.fall = { t: 0 }; noise(.25, .04, 300); } }, 110);
  f.n++; f.c = 0; f.drop = false; f.hold = false; f.wait = .7;
  if (f.n < FOREST_TREES) setTimeout(() => { if (forest === f) f.tree = newTree(); }, 640);
}
function endForest() {
  const f = forest; if (!f || f.over) return; f.over = true;
  const list = Object.entries(f.loot).map(([k, q]) => `<span><img src="${ingotImg(k, 3)}" alt="">${q} ${ore(k).n}</span>`);
  const r = $('#for-result'); r.hidden = false;
  r.innerHTML = `<h2>Fim do corte</h2><div class="sub">Perfeitos ${f.hits[3]} · Bons ${f.hits[2]} · Ok ${f.hits[1]} · Erros ${f.hits[0]}</div><div class="loot">${list.join('') || '<span>Nada desta vez…</span>'}</div><button class="btn big">Coletar</button><small class="sub">A floresta rebrota em ${mmss(FOREST_CD)}.</small>`;
  r.querySelector('button').onclick = collectForest;
}
function collectForest() {
  const f = forest; if (!f) return;
  Object.entries(f.loot).forEach(([k, q]) => { S.ores[k] = (S.ores[k] || 0) + q; see(k); S.stats.chops += q; });
  if (Object.keys(f.loot).length) leftTab = 'woods';
  S.forestAt = Date.now() + FOREST_CD; save();
  forest = null; $('#forest').hidden = true; SFX.done(); renderAll();
}
tcv.addEventListener('pointerdown', e => { if (forest && !forest.over && forest.wait <= 0) { e.preventDefault(); forest.hold = true; } });
addEventListener('pointerup', () => { if (forest?.hold) { forest.hold = false; chop(); } });
$('#for-exit').onclick = () => { if (!forest) return; if (!forest.over) { forest.n = FOREST_TREES; forest.fx = []; forest.wait = 0; endForest(); } else collectForest(); };
function renderForestBtn() {
  const b = $('#forest-btn'), on = S.up.forest, ready = forestReady();
  b.hidden = !on; if (!on) return;
  const txt = ready ? '🌲 Floresta!' : `🌲 ${mmss(S.forestAt - Date.now())}`;
  b.classList.toggle('ready', ready); if (b.dataset.t !== txt) b.textContent = b.dataset.t = txt;
}

/* ======================= Fornalha =======================
   Transforma minério bruto (da mina) em metal. Segure o clique (ou Espaço) para aquecer e solte para esfriar:
   a temperatura precisa ficar dentro da faixa verde. Metais de grau maior têm faixa menor, que se move e oscila mais.
   No fim, cada minério vira metal com chance proporcional ao tempo na faixa; o resto se perde. */
let fur = null;
const fcv = $('#fur-cv'), fg = fcv.getContext('2d');
const FIRE = ['#7c2d12', '#c2410c', '#ea580c', '#f59e0b', '#fde68a'];
// Quantos lotes dá para fazer agora (minério bruto, ou metais suficientes para a liga), no máximo 10
const furMax = f => Math.min(10, f.alloy ? Math.min(...Object.entries(f.alloy.inp).map(([k, q]) => Math.floor((S.ores[k] || 0) / q))) : S.raw[f.id] || 0);
function openFurnace(id, alloy = null) {
  if (busy()) return;
  const img = new Image(); img.src = alloy ? ingotImg(id, 3) : rawImg(id, 3);
  fur = { id, o: ore(id), alloy, n: 10, stage: 'setup', img, T: .15, parts: [] };
  if (!furMax(fur)) { fur = null; return; }
  $('#fur-title').innerHTML = alloy ? `⚗ ${alloy.n} · ${ore(id).n}` : `${flameIco(S.up.furnace)} ${FURNACES[S.up.furnace].n} · minério de ${ore(id).n}`; $('#fur-hud').textContent = '';
  $('#furnace').hidden = false; renderFurSetup();
}
// O que uma fundição perfeita pode transmutar neste forno
function transmuteInfo(id) {
  const F = FURNACES[S.up.furnace];
  if (id === 'ferro' && F.steel) return `Fundição perfeita (${pct(PERFECT_SMELT)}+ na faixa): cada lingote tem ${pct(F.steel)} de chance de virar <b>Aço</b>.`;
  if (id === 'mithril' && F.arcane) return `Fundição perfeita (${pct(PERFECT_SMELT)}+ na faixa): cada lingote tem ${pct(F.arcane)} de chance de virar <b>Adamantita</b> ou <b>Oricalco</b>.`;
  if (id === 'ferro') return 'Num forno mais quente, uma fundição perfeita pode transformar ferro em aço.';
  return '';
}
function renderFurSetup() {
  const f = fur, max = furMax(f), r = $('#fur-result');
  if (!max) return closeFurnace();
  f.stage = 'setup'; f.n = Math.min(f.n, max); r.hidden = false;
  const what = f.alloy ? `Fundir ${inpText(f.alloy)} → 1 ${f.o.n} (por lote)` : `Derreter minério de ${f.o.n}`;
  r.innerHTML = `<img src="${f.img.src}" alt="" style="width:60px"><h2>${what}</h2>
    <div class="qty-pick">${f.alloy ? 'Lotes' : 'Quantidade'} <input type="range" min="1" max="${max}" value="${f.n}"><b id="fur-n">${f.n}</b> de ${max}</div>
    <div class="sub">Segure o clique (ou Espaço) para aquecer e solte para esfriar.<br>Mantenha a temperatura dentro da faixa verde. Se for mal, parte do ${f.alloy ? 'metal' : 'minério'} se perde.${f.alloy ? '' : '<br>' + transmuteInfo(f.id)}</div>
    <button class="btn big">🔥 Acender</button>`;
  const inp = r.querySelector('input'); inp.oninput = () => { f.n = +inp.value; $('#fur-n').textContent = f.n; };
  r.querySelector('button').onclick = startFurnace;
  drawFurnace(0);
}
function startFurnace() {
  const f = fur;
  if (f.alloy) Object.entries(f.alloy.inp).forEach(([k, q]) => S.ores[k] -= q * f.n); else S.raw[f.id] -= f.n;
  save(); renderLists();
  Object.assign(f, { stage: 'run', T: .25, heat: false, t0: performance.now(), last: performance.now(), inBand: 0, grace: 1, D: 6 + Math.min(4, f.n * .3),
    w: clamp(.26 - f.o.tier * .014, .1, .26), amp: Math.min(.2, (f.o.tier - 1) * .03), ph: Math.random() * 6 });
  $('#fur-result').hidden = true; requestAnimationFrame(furLoop);
}
const furBand = (f, t) => ({ c: .6 + f.amp * Math.sin(t * .8 + f.ph), w: f.w });
function furLoop(now) {
  const f = fur; if (!f || f.stage !== 'run') return;
  const dt = Math.min(.05, (now - f.last) / 1000); f.last = now;
  const t = (now - f.t0) / 1000;
  f.T = clamp(f.T + (f.heat ? .55 : -.38) * dt + Math.sin(t * 2.3 + f.ph) * .06 * dt * (1 + f.o.tier * .2), 0, 1);
  const b = furBand(f, t), inside = Math.abs(f.T - b.c) <= b.w / 2;
  if (t > f.grace) f.inBand += inside ? dt : 0;
  drawFurnace(t, b, inside);
  const left = f.grace + f.D - t;
  $('#fur-hud').textContent = t < f.grace ? 'Prepare-se…' : `Na faixa: ${Math.round(f.inBand / f.D * 100)}% · ${Math.max(0, left).toFixed(1)} s`;
  if (left <= 0) return endFurnace();
  requestAnimationFrame(furLoop);
}
function drawFurnace(t, b, inside) {
  const f = fur, W = 640, T = f.T;
  fg.fillStyle = '#1a1210'; fg.fillRect(0, 0, W, 300);
  for (let y = 0; y < 210; y += 20) for (let x = (y / 20) % 2 ? -20 : 0; x < W; x += 40) { fg.fillStyle = (x + y) % 3 ? '#2a1a14' : '#24160f'; fg.fillRect(x + 2, y + 2, 36, 16); }
  fg.fillStyle = '#0c0806'; fg.fillRect(210, 30, 220, 160); fg.fillStyle = '#3f3a36'; fg.fillRect(200, 22, 240, 10); fg.fillRect(200, 186, 240, 10);
  // fogo: mais alto e mais claro quanto mais quente
  for (let i = 0; i < 1 + T * 7; i++) f.parts.push({ x: rand(220, 420), y: 184, vy: -rand(40, 90) * (.5 + T), l: rand(.4, .9) * (.4 + T), c: FIRE[Math.min(4, Math.floor(T * 4 + Math.random() * 1.5))] });
  f.parts = f.parts.filter(p => (p.l -= 1 / 60) > 0);
  f.parts.forEach(p => { p.y += p.vy / 60; p.x += rand(-1, 1); fg.globalAlpha = Math.min(1, p.l * 2); fg.fillStyle = p.c; fg.fillRect(p.x | 0, p.y | 0, 6, 6); });
  fg.globalAlpha = 1;
  // cadinho com o minério, que brilha quando está na temperatura certa
  fg.fillStyle = '#57534e'; fg.fillRect(280, 130, 80, 44); fg.fillStyle = '#44403c'; fg.fillRect(286, 136, 68, 32);
  if (f.img.complete) fg.drawImage(f.img, 290, 86);
  if (inside) { fg.fillStyle = '#ffb34755'; fg.fillRect(280, 90, 80, 84); }
  // termômetro
  const X = 40, BW = 560, Y = 226, grd = fg.createLinearGradient(X, 0, X + BW, 0);
  grd.addColorStop(0, '#1e3a8a'); grd.addColorStop(.45, '#a16207'); grd.addColorStop(.75, '#ea580c'); grd.addColorStop(1, '#dc2626');
  fg.fillStyle = grd; fg.fillRect(X, Y, BW, 24);
  if (b) { fg.fillStyle = '#4ade8044'; fg.fillRect(X + (b.c - b.w / 2) * BW, Y - 4, b.w * BW, 32); fg.strokeStyle = '#4ade80'; fg.lineWidth = 3; fg.strokeRect(X + (b.c - b.w / 2) * BW, Y - 4, b.w * BW, 32); }
  fg.fillStyle = '#fff'; fg.fillRect(X + T * BW - 2, Y - 8, 4, 40);
  fg.fillStyle = '#b9a896'; fg.font = '12px monospace'; fg.textAlign = 'left'; fg.fillText('frio', X, Y + 44); fg.textAlign = 'right'; fg.fillText('quente', X + BW, Y + 44);
  if (b && t > f.grace) { fg.fillStyle = '#0006'; fg.fillRect(X, 10, BW, 6); fg.fillStyle = '#fbbf24'; fg.fillRect(X, 10, BW * clamp((t - f.grace) / f.D, 0, 1), 6); }
}
function endFurnace() {
  const f = fur; f.stage = 'end'; f.heat = false;
  const perf = clamp(f.inBand / f.D, 0, 1), p = clamp((perf - .15) / .7, 0, 1), F = FURNACES[S.up.furnace], perfect = perf >= PERFECT_SMELT;
  const out = {}; let ok = 0;
  for (let i = 0; i < f.n; i++) {
    if (Math.random() >= p) continue;
    ok++; let id = f.id;
    // Fundição perfeita num forno quente: ferro pode virar aço; mithril pode virar adamantita ou oricalco
    if (!f.alloy && perfect && id === 'ferro' && Math.random() < F.steel) id = 'aco';
    else if (!f.alloy && perfect && id === 'mithril' && Math.random() < F.arcane) id = Math.random() < .55 ? 'adamantita' : 'oricalco';
    out[id] = (out[id] || 0) + 1;
  }
  const lost = f.n - ok;
  Object.entries(out).forEach(([k, q]) => { S.ores[k] = (S.ores[k] || 0) + q; see(k); if (k !== f.id || f.alloy) S.stats.made[k] = (S.stats.made[k] || 0) + q; });
  if (!f.alloy) S.stats.smelted += ok;
  S.stats.lost += lost; save();
  ok ? SFX.done() : SFX.no();
  const lostImg = f.alloy ? ingotImg(Object.keys(f.alloy.inp)[0], 3) : rawImg(f.id, 3);
  const r = $('#fur-result'); r.hidden = false;
  r.innerHTML = `<h2>${ok === f.n ? (perfect ? 'Fundição perfeita!' : 'Fundição concluída') : ok ? 'Fundição concluída' : `${f.alloy ? 'A liga' : 'O minério'} se perdeu…`}</h2><div class="sub">Tempo na faixa: ${Math.round(perf * 100)}%${perfect && !f.alloy && transmuteInfo(f.id) ? ' · perfeita!' : ''}</div>
    <div class="loot">${Object.entries(out).map(([k, q]) => `<span ${k !== f.id ? 'class="b-epico"' : ''}><img src="${ingotImg(k, 3)}" alt="">+${q} ${ore(k).n}</span>`).join('')}${lost ? `<span style="color:var(--red)"><img src="${lostImg}" alt="">−${lost} ${f.alloy ? 'lote' : 'perdido'}${lost > 1 ? 's' : ''}</span>` : ''}</div>
    <div style="display:flex;gap:8px">${furMax(f) ? `<button class="btn" data-a="again">${f.alloy ? 'Fundir' : 'Derreter'} mais</button>` : ''}<button class="btn big" data-a="ok">OK</button></div>`;
  r.querySelector('[data-a=ok]').onclick = closeFurnace;
  const ag = r.querySelector('[data-a=again]'); if (ag) ag.onclick = () => { f.n = 10; renderFurSetup(); };
  renderAll();
}
function closeFurnace() { fur = null; $('#furnace').hidden = true; renderAll(); }
$('#fur-exit').onclick = () => { if (!fur) return; if (fur.stage === 'run') endFurnace(); else closeFurnace(); };
fcv.addEventListener('pointerdown', e => { if (fur?.stage === 'run') { e.preventDefault(); fur.heat = true; } });
addEventListener('pointerup', () => { if (fur) fur.heat = false; });
addEventListener('keyup', e => { if (fur && e.code === 'Space') fur.heat = false; if (forest?.hold && e.code === 'Space') { forest.hold = false; chop(); } });

/* ======================= Relógio do jogo (1 s) ======================= */
let autoT = 0, buyT = 0;
// Ajudante nv.2+ forja sozinho, de graça, uma peça simples de metal barato (o Aprendiz acerta mais e usa o molde Reforçado às vezes;
// no nv.4 a peça pode sair com uma gema das que a sua mina já dá). A raridade mínima das ferramentas Estelares não vale para ele
function helperCraft() {
  const H = HELPERS[S.up.helper];
  const mats = ORES.filter(o => S.seen.includes(o.id) && oCat(o.id) === 'metal' && o.tier <= H.tier), types = TYPES.filter(T => S.molds[T.id] >= 1 && tCat(T.id) === 'metal');
  if (S.stock.length >= HELPER_STOCK || !mats.length || !types.length) return false;
  const T = pick(types), base = S.up.helper >= 3 && S.molds[T.id] >= 2 && Math.random() < .3 ? 2 : 1, r = RARITY[wpick(H.w.map((_, i) => i), i => H.w[i])];
  const it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: T.id, lvl: starLvl(base), ores: Array(usesOf(T.id, base)).fill(pick(mats).id), r: r.id };
  const gems = GEMS.filter(g => g.mine <= S.up.mine);
  if (H.gem && gems.length && Math.random() < H.gem) it.gems = [wpick(gems, g => g.w).id];
  S.stock.unshift(it);
  if (rIdx(r.id) >= 4) lightning(RAR_HEX[r.id]);
  if (rIdx(r.id) >= 2) toast(`<img src="${itemImg(it, 3)}"> ${H.n} forjou: ${esc(itemName(it))} · <span class="r-${r.id}">${r.n}</span>!`);
  return true;
}
function restock() {
  const cap = SUPPLIERS[S.up.supplier].cap || Infinity, bought = [];
  Object.entries(S.autoBuy).forEach(([id, min]) => {
    const o = ore(id), have = S.ores[id] || 0, p = buyPrice(o); if (!shopOpen(o) || !min || have >= min) return;
    const q = Math.min(min - have, cap, Math.floor(S.coins / p)); if (q <= 0) return;
    S.coins -= q * p; S.ores[id] = have + q; S.stats.oreBought += q; see(id); bought.push(`+${q} ${o.n}`);
  });
  if (bought.length) { renderCoins(); renderLists(); renderSlots(); toast('🛒 Fornecedor: ' + bought.join(', ')); }
  return bought.length > 0;
}
setInterval(() => {
  const now = Date.now(), on = $('#game').classList.contains('on'); let changed = false;
  S.orders = S.orders.filter(o => { if (o.dl > now) return true; if (on) toast(`${o.e} ${esc(o.npc)} desistiu da encomenda.`); changed = true; return false; });
  if (S.orders.length < maxOrders() && now >= S.nextOrder) { S.orders.push(genOrder(S)); S.nextOrder = now + ORDER_EVERY; changed = true; if (on) toast('📜 Nova encomenda no balcão!'); }
  for (let i = S.auction.length - 1; i >= 0; i--) {
    const a = S.auction[i];
    if (a.sellAt && now >= a.sellAt) { S.auction.splice(i, 1); S.stats.auctions++; earn(a.price); toast(`🔨 Vendido no leilão: ${esc(itemName(a.it))} por ${a.price}!`); changed = true; }
    else if (now >= a.end) { S.auction.splice(i, 1); S.stock.unshift(a.it); toast(`Ninguém comprou ${esc(itemName(a.it))}. Voltou para o estoque.`); changed = true; }
  }
  if (S.up.helper && S.auto && on && !busy() && ++autoT >= AUTO_EVERY) {
    autoT = 0; const it = [...S.stock].reverse().find(x => !reserved(x));
    if (it) { S.stock = S.stock.filter(x => x !== it); earn(Math.round(itemValue(it) * AUTO_SELL)); changed = true; }
  }
  if (S.up.helper >= 2 && on && !busy()) {   // a hora da próxima peça fica no save: recarregar a página não zera a espera
    if (!S.helpAt) { S.helpAt = now + HELPERS[S.up.helper].every * 1000; save(); }
    else if (now >= S.helpAt) { S.helpAt = now + HELPERS[S.up.helper].every * 1000; if (helperCraft()) changed = true; else save(); }
  }
  // Fornecedor nv.2+: a cada 3 min repõe até o mínimo escolhido, com o dinheiro que tiver (nv.2: no máximo `cap` por material de cada vez)
  if (S.up.supplier >= 2 && on && ++buyT >= AUTOBUY_EVERY) { buyT = 0; if (restock()) changed = true; }
  if (changed) { save(); renderStock(); renderBottom(); if (modal && modal.kind !== 'counter' && modal.kind !== 'ency') renderModal(); }
  if (modal?.kind === 'counter') { if (changed || !S.orders.length) renderModal(); else updateTimers(); }
  if (modal?.kind === 'auction') updateTimers();
  if (modal?.kind === 'runes') { const b = $('#rune-craft'), t = runeCraftTxt(); if (b && b.dataset.t !== t) b.textContent = b.dataset.t = t; }
  renderMineBtn(); renderForestBtn(); renderRuneBtn();
}, 1000);
/* Atualiza só os relógios abertos, sem redesenhar a janela (para não perder cliques nem o que está sendo digitado) */
function updateTimers() {
  const now = Date.now();
  document.querySelectorAll('[data-oid]').forEach(r => {
    const o = S.orders.find(x => x.id === r.dataset.oid); if (!o) return;
    const f = orderInfo(o, now), i = r.querySelector('.timer i');
    r.querySelector('.tm').textContent = f.txt; i.style.width = f.pct + '%'; i.className = f.fast ? 'fast' : '';
    r.querySelector('.pr').innerHTML = `<img src="${coinImg}" alt="">${f.pay}`;
  });
  document.querySelectorAll('[data-aid]').forEach(r => { const a = S.auction.find(x => x.it.id === r.dataset.aid); if (a) r.querySelector('.tm').textContent = '⏱ ' + mmss(a.end - now); });
}

/* ======================= Parte de baixo: melhorias, balcão e leilão ======================= */
function renderBottom() {
  $('#order-n').textContent = S.orders.length;
  $('#counter').className = 'cl-' + COUNTERS[S.up.counter].skin;
  $('#counter-alert').hidden = !S.orders.some(matchFor);
  const ready = MISSIONS.filter(m => !S.claimed.includes(m.id) && missionDone(m)).length;
  $('#missions-alert').hidden = !ready; $('#missions-alert').textContent = ready;
  $('#auction').classList.toggle('locked', !S.up.slots);
  $('#auction-slots').innerHTML = !S.up.slots ? '<div class="lockmsg" style="border:0;width:auto" title="Abra o leilão na loja de melhorias">🔒</div>' : Array.from({ length: S.up.slots }, (_, i) => { const a = S.auction[i]; return a ? `<div class="on b-${a.it.r}${a.it.rune ? ' runed' : ''}"${a.it.rune ? ` style="--rc:${RAR_HEX[RUNE_G[a.it.rune].r]}"` : ''}><img src="${itemImg(a.it)}" alt=""></div>` : '<div></div>'; }).join('');
  $('#up-icons').innerHTML = `<img src="${anvilImg(S.up.anvil, 2)}" title="${ANVILS[S.up.anvil].n}" alt=""><img src="${hammerImg(S.up.hammer, 2)}" title="${HAMMERS[S.up.hammer].n}" alt=""><img src="${pickImg(S.up.mine, 2)}" title="${MINES[S.up.mine].n}" alt=""><span class="alloy ${S.up.jewel ? 'on' : ''}" title="Joalheria">💍</span><span class="alloy ${S.up.alloy ? 'on' : ''}" title="Forja composta">⚗️</span>`;
}
$('#counter').onclick = () => { if (!busy()) openModal('counter'); };
$('#missions-btn').onclick = () => { if (!busy()) openModal('missions'); };
$('#auction').onclick = () => { if (busy()) return; if (!S.up.slots) return nope('O leilão ainda está fechado. Abra na loja de melhorias.'); openModal('auction'); };
$('#upgrades').onclick = () => { if (!busy()) openModal('upgrades'); };
$('#pause').onclick = () => { if (!busy()) openModal('pause'); };

/* ======================= Janelas ======================= */
let modal = null;
function openModal(kind, tab) { modal = { kind, tab: tab || (kind === 'counter' ? 'orders' : null) }; $('#modal').hidden = false; $('#tooltip').hidden = true; renderModal(); }
function closeModal() { modal = null; $('#modal').hidden = true; }
$('#m-x').onclick = closeModal;
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
const coinTag = n => `<span class="pr"><img src="${coinImg}" alt="">${n}</span>`;
const afterBuy = () => { save(); renderAll(); renderModal(); };
const pct = b => Math.round(b * 100) + '%';

function renderModal() {
  if (!modal) return;
  const body = $('#m-body'), foot = $('#m-foot'), tabs = $('#m-tabs'), keep = body.scrollTop;
  body.innerHTML = foot.innerHTML = tabs.innerHTML = '';
  const row = (html, cls = '') => { const r = document.createElement('div'); r.className = 'row ' + cls; r.innerHTML = html; body.append(r); return r; };
  const sec = t => body.insertAdjacentHTML('beforeend', `<div class="sec">${t}</div>`);
  const ic = img => img.startsWith('data:') ? `<img class="ic" src="${img}" alt="">` : `<span class="ic-e">${img}</span>`;
  const buyRow = (img, title, sub, price, onBuy) => {
    if (price == null) return row(`${ic(img)}<span class="nm">${title}<br><small>${sub}</small></span><span class="pr">✔</span>`);
    if (price === false) return row(`${ic(img)}<span class="nm">${title}<br><small>${sub}</small></span><span class="pr" style="color:var(--dim)">🔒</span>`, 'lock');
    const r = row(`${ic(img)}<span class="nm">${title}<br><small>${sub}</small></span>${coinTag(price)}<button class="btn small">Comprar</button>`);
    const b = r.querySelector('button'); b.disabled = S.coins < price; b.onclick = () => { if (spend(price)) onBuy(); };
  };
  const tabBar = list => list.forEach(([id, lab]) => { const b = document.createElement('button'); b.className = 'btn small' + (modal.tab === id ? ' on' : ''); b.textContent = lab; b.onclick = () => { modal.tab = id; modal.sub = null; body.scrollTop = 0; renderModal(); }; tabs.append(b); });
  const subBar = list => { const d = document.createElement('div'); d.className = 'subtabs'; if (!list.some(([id]) => id === modal.sub)) modal.sub = list[0][0];
    list.forEach(([id, lab]) => { const b = document.createElement('button'); b.className = 'btn small ghost' + (modal.sub === id ? ' on' : ''); b.textContent = lab; b.onclick = () => { modal.sub = id; body.scrollTop = 0; renderModal(); }; d.append(b); }); tabs.append(d); };
  const k = modal.kind;

  if (k === 'ores') {
    const woodShop = modal.tab === 'woods', SU = SUPPLIERS[S.up.supplier], auto = S.up.supplier >= 2, maxMin = SU.cap ? 99 : 999;
    $('#m-title').textContent = woodShop ? 'Loja de madeiras' : 'Loja de metais';
    body.insertAdjacentHTML('beforeend', '<p class="sub" style="margin:0;font-size:12px">' + (woodShop ? 'Madeira pronta, mas cara. A floresta dá madeira de graça.' : 'Lingotes prontos, mas caros. O minério da mina sai de graça, só precisa passar pela fornalha.') +
      (auto ? `<br>${SU.n}: preços ${pct(SU.off)} menores. Escolha um mínimo e, a cada ${mmss(AUTOBUY_EVERY * 1000)}, ele repõe até lá${SU.cap ? ` (no máximo ${SU.cap} por material de cada vez)` : ''} com o dinheiro que você tiver (0 = desligado).` : '<br>Melhore o Fornecedor (loja de melhorias) para ter mais materiais, desconto e reposição automática.') + '</p>');
    ORES.filter(o => !!o.wood === woodShop).forEach(o => {
      if (o.shop && !shopOpen(o)) return row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· grau ${o.tier}</small><br><small>Vendido pelo ${SUPPLIERS[o.shop].n} (nv.${o.shop})</small></span><span class="pr" style="color:var(--dim)">🔒</span>`, 'lock');
      if (!o.shop) return row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· grau ${o.tier}</small><br><small>Só por liga na fornalha (${inpText(ALLOYS.find(a => a.id === o.id))}) · você tem ${S.ores[o.id] || 0}</small></span><span class="pr" style="color:var(--dim)">⚗</span>`, 'lock');
      const p = buyPrice(o);
      const r = row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· ${o.wood ? `madeira grau ${o.tier}` : o.ingr ? 'só para ligas' : `grau ${o.tier}${o.jewel ? ' · só joias' : ''}`}</small><br><small>Você tem ${S.ores[o.id] || 0}</small></span>${coinTag(p)}<span class="acts"><button class="btn small" data-k="1">+1</button><button class="btn small" data-k="5">+5</button></span>${auto ? `<input type="number" min="0" max="${maxMin}" value="${S.autoBuy[o.id] || 0}" title="Mínimo para a reposição automática">` : ''}`);
      r.querySelectorAll('button').forEach(b => { const q = +b.dataset.k; b.disabled = S.coins < p * q; b.onclick = () => {
        if (!spend(p * q)) return; S.ores[o.id] = (S.ores[o.id] || 0) + q; S.stats.oreBought += q; see(o.id); afterBuy();
      }; });
      const inp = r.querySelector('input'); if (!inp) return; inp.onkeydown = e => e.stopPropagation();
      inp.onchange = () => { const v = clamp(Math.round(+inp.value || 0), 0, maxMin); inp.value = v; if (v) S.autoBuy[o.id] = v; else delete S.autoBuy[o.id]; save(); toast(v ? `🛒 Manter pelo menos ${v} de ${o.n}` : `Reposição de ${o.n} desligada`); };
    });
  }

  else if (k === 'molds') {
    $('#m-title').textContent = 'Loja de moldes';
    body.insertAdjacentHTML('beforeend', '<p class="sub" style="margin:0;font-size:12px">Compra única: o molde fica seu para sempre. Níveis maiores usam mais material, são mais difíceis e valem muito mais.</p>');
    GROUPS.forEach(([g, gn]) => TYPES.filter(T => T.grp === g).forEach((T, i) => {
      if (!i) sec(gn);
      const nx = S.molds[T.id] + 1;
      if (T.unlock && !S.molds[T.id]) return buyRow(moldImg(T.id, 1), `Molde de ${T.n}`, `Libere na loja de melhorias (${T.grp === 'guns' ? 'Arcabuzaria' : T.wood ? 'Oficina' : 'Armaria nv.' + T.armory})`, false);
      if (nx > MAXLV) return buyRow(moldImg(T.id, MAXLV), `${T.n} ${LEVELS[MAXLV].n}`, 'Nível máximo', null);
      if (T.jewel && !S.up.jewel) return buyRow(moldImg(T.id, 1), `Molde de ${T.n}`, 'Requer a técnica Joalheria (loja de melhorias)', false);
      buyRow(moldImg(T.id, nx), `Molde de ${T.n} · ${LEVELS[nx].n}`, `${nx === 1 ? 'novo tipo de peça' : 'nível ' + nx} · usa ${T.mixWood ? `${usesOf(T.id, nx) - T.mixWood} metais + ${T.mixWood} madeira${T.mixWood > 1 ? 's' : ''}` : T.wood ? usesOf(T.id, nx) + ' madeiras' : usesOf(T.id, nx) + ' lingotes'}${T.jewel ? ' de Prata/Ouro' : ''} · valor ×${LEVELS[nx].m}`, moldPrice(T.id, nx), () => {
        S.molds[T.id] = nx; S.msel[T.id] = nx; S.stats.molds++; toast(`<img src="${moldImg(T.id, nx, 3)}"> Molde de ${T.n} ${LEVELS[nx].n} comprado!`); if (sel.t === T.id) fitOres(); afterBuy();
      });
    }));
  }

  else if (k === 'upgrades') {
    $('#m-title').textContent = 'Loja de melhorias';
    const nv = n => ` <small>(nv.${n})</small>`, give = id => { if (!S.molds[id]) { S.molds[id] = 1; S.msel[id] = 1; S.stats.molds++; } };
    const ck = (ok, txt) => `${ok ? '✔' : '✘'} ${txt}`, tools = n => S.up.anvil >= n && S.up.hammer >= n;
    const needTools = n => `Para desbloquear: ${ck(S.up.anvil >= n, ANVILS[n].n)} · ${ck(S.up.hammer >= n, HAMMERS[n].n)}`;
    const needStar = `Para desbloquear: ${STAR_REQ.map(([ok, n]) => ck(ok(S), n())).join(' · ')}`, starTxt = ` · com a bigorna e o martelo Estelares: raridade mínima Incomum e ~${pct(STAR_UP)} de chance de a peça subir um nível`;
    const ua = S.up.anvil + 1, uh = S.up.hammer + 1, us = S.up.slots + 1, um = S.up.mine + 1;
    sec('Ferramentas');
    if (ua === STAR_TOOLS && !starOpen()) buyRow(anvilImg(ua, 2), `${ANVILS[ua].n}${nv(ua)} · ${ANVILS[ua].price} moedas`, needStar, false);
    else if (ANVILS[ua]) buyRow(anvilImg(ua, 2), ANVILS[ua].n + nv(ua), `zona de acerto ${pct(ANVILS[ua].b)} maior (agora: ${pct(ANVILS[S.up.anvil].b)})` + (ua === STAR_TOOLS ? starTxt : ''), ANVILS[ua].price, () => { S.up.anvil = ua; S.stats.ups++; toast(ANVILS[ua].n + ' instalada!'); afterBuy(); });
    else buyRow(anvilImg(S.up.anvil, 2), ANVILS[S.up.anvil].n + nv(S.up.anvil), 'Nível máximo', null);
    if (uh === STAR_TOOLS && !starOpen()) buyRow(hammerImg(uh, 2), `${HAMMERS[uh].n}${nv(uh)} · ${HAMMERS[uh].price} moedas`, needStar, false);
    else if (HAMMERS[uh]) buyRow(hammerImg(uh, 2), HAMMERS[uh].n + nv(uh), `cursor ${pct(HAMMERS[uh].b)} mais lento (agora: ${pct(HAMMERS[S.up.hammer].b)})` + (uh === STAR_TOOLS ? starTxt : ''), HAMMERS[uh].price, () => { S.up.hammer = uh; S.stats.ups++; toast(HAMMERS[uh].n + ' na mão!'); afterBuy(); });
    else buyRow(hammerImg(S.up.hammer, 2), HAMMERS[S.up.hammer].n + nv(S.up.hammer), 'Nível máximo', null);
    sec('Mina e floresta');
    if (MINES[um]) {
      const nw = [...ORES.filter(o => o.mine === um).map(o => o.n), ...GEMS.filter(g => g.mine === um).map(g => g.n)];
      buyRow(pickImg(um, 3), MINES[um].n + nv(um), `novos: ${nw.join(', ')} · ${MINES[um].targets} veios por descida`, MINES[um].price, () => { S.up.mine = um; S.stats.ups++; toast(`⛏ ${MINES[um].n} liberada!`); afterBuy(); });
    } else buyRow(pickImg(S.up.mine, 3), MINES[S.up.mine].n + nv(S.up.mine), 'Nível máximo', null);
    const ufo = S.up.forest + 1, FO = FORESTS[ufo];
    if (FO) buyRow('🌲', FO.n + nv(ufo), `novas: ${ORES.filter(o => o.fl === ufo).map(o => o.n).join(', ')} · madeiras dos níveis anteriores ficam ${pct(FOREST_EASE)} mais fáceis de cortar`, FO.price, () => { S.up.forest = ufo; S.stats.ups++; toast(`🌲 ${FO.n} liberada!`); afterBuy(); });
    else buyRow('🌲', FORESTS[S.up.forest].n + nv(S.up.forest), 'Nível máximo', null);
    sec('Fornalha e ligas');
    const uf = S.up.furnace + 1, F0 = FURNACES[S.up.furnace];
    const furTxt = F => `derrete até ${ORES.filter(o => o.smelt && FURNACES.indexOf(F) >= o.smelt).map(o => o.n).join(', ')}${F.steel ? ` · ferro → aço ${pct(F.steel)}` : ''}${F.arcane ? ` · mithril → adamantita/oricalco ${pct(F.arcane)}` : ''} (em fundição perfeita)`;
    if (FURNACES[uf]) buyRow(flameImg(uf), FURNACES[uf].n + nv(uf), furTxt(FURNACES[uf]), FURNACES[uf].price, () => { S.up.furnace = uf; S.stats.ups++; toast(`🔥 ${FURNACES[uf].n} aceso!`); afterBuy(); });
    else buyRow(flameImg(S.up.furnace), F0.n + nv(S.up.furnace), 'Nível máximo', null);
    const na = ALLOYS[S.up.alloys];
    if (na) buyRow(ingotImg(na.id), na.n + nv(S.up.alloys + 1), `${inpText(na)} na fornalha · exige ${FURNACES[na.fur].n}${S.up.alloys === 0 ? ' · tutorial de ligas' : ''}`, na.price, () => { S.up.alloys++; S.stats.ups++; toast(`⚗ ${na.n} aprendida! Veja a aba Forja.`); afterBuy(); });
    else buyRow(ingotImg('astralita'), 'Ligas' + nv(ALLOYS.length), 'Todas aprendidas: Bronze, Aço, Adamantita, Oricalco e Astralita', null);
    sec('Comércio');
    const uc = S.up.counter + 1, C0 = COUNTERS[S.up.counter];
    if (COUNTERS[uc]) buyRow('📜', COUNTERS[uc].n + nv(uc), `até ${COUNTERS[uc].max} encomendas ao mesmo tempo (agora: ${C0.max})`, COUNTERS[uc].price, () => { S.up.counter = uc; S.stats.ups++; toast(`📜 ${COUNTERS[uc].n}!`); afterBuy(); });
    else buyRow('📜', C0.n + nv(S.up.counter), 'Nível máximo', null);
    const slotIc = sprite('coin', [], 4);
    if (SLOT_PRICES[us] != null) buyRow(slotIc, 'Leilão' + nv(us), us === 1 ? 'abre o leilão com 1 espaço (arraste peças do estoque para vender pelo seu preço)' : `vende ${us} peças ao mesmo tempo (agora: ${S.up.slots})`, SLOT_PRICES[us], () => { S.up.slots = us; S.stats.ups++; toast(us === 1 ? '🔨 Leilão aberto!' : `Leilão agora tem ${us} espaços!`); afterBuy(); });
    else buyRow(slotIc, 'Leilão' + nv(S.up.slots), `${S.up.slots} espaços · Nível máximo`, null);
    sec('Ajudantes');
    const uhp = S.up.helper + 1, H = HELPERS[uhp];
    const helpTxt = n => n === 1 ? `vende sozinho as peças do estoque por ${pct(AUTO_SELL)} do valor (botão 💰)` : `além de vender, forja de graça uma peça simples a cada ${mmss(HELPERS[n].every * 1000)}${n === 2 ? ' (quase sempre Comum; ~1,5% de sair Rara)' : n === 3 ? ' (peças melhores: pode sair até Épica)' : ` (pode sair Lendária, ~0,5%, e ${pct(HELPERS[n].gem)} das peças vêm com gema)`}`;
    if (H) buyRow('🧑‍🏭', H.n + nv(uhp), helpTxt(uhp), H.price, () => { S.up.helper = uhp; S.helpAt = 0; S.stats.ups++; toast(uhp === 1 ? '🧑‍🏭 Ajudante contratado! Ligue o 💰 ao lado do estoque.' : uhp === 2 ? '🧑‍🏭 O ajudante agora forja peças simples sozinho!' : uhp === 3 ? '🧑‍🏭 O ajudante virou Aprendiz de ferreiro!' : '🧑‍🏭 O aprendiz agora pode forjar Lendárias e encravar gemas!'); afterBuy(); });
    else buyRow('🧑‍🏭', HELPERS[S.up.helper].n + nv(S.up.helper), 'Nível máximo: vende e forja sozinho.', null);
    const usu = S.up.supplier + 1, SU = SUPPLIERS[usu], sells = n => ORES.filter(o => o.shop === n).map(o => o.n).join(', ');
    if (SU) buyRow('🛒', SU.n + nv(usu), `vende ${sells(usu)}${usu === 2 ? ` · preços ${pct(SU.off)} menores · repõe materiais até um mínimo a cada ${mmss(AUTOBUY_EVERY * 1000)} (máx. ${SU.cap} por material)` : ' · reposição sem limite de unidades'}`, SU.price, () => { S.up.supplier = usu; S.stats.ups++; toast(`🛒 ${SU.n} contratado!`); afterBuy(); });
    else buyRow('🛒', SUPPLIERS[S.up.supplier].n + nv(S.up.supplier), 'Nível máximo', null);
    sec('Técnicas');
    buyRow(sprite('ring', ORES[5].sh, 4, 1, '#ef4444'), 'Joalheria' + nv(1), S.up.jewel ? 'Moldes de Anel e Amuleto liberados na loja de moldes.' : 'libera os moldes de Anel e Amuleto (feitos de Prata ou Ouro, com gema opcional)', S.up.jewel ? null : JEWEL_PRICE, () => { S.up.jewel = true; S.stats.ups++; toast('💍 Joalheria liberada! Veja a loja de moldes.'); afterBuy(); });
    buyRow(hammerImg(S.up.hammer, 2), 'Reforja' + nv(1), S.up.reforge ? 'Arraste uma peça para a bigorna.' : 'sobe até 2 raridades · 1× por peça · falha destrói a peça', S.up.reforge ? null : REFORGE_PRICE, () => { S.up.reforge = true; S.stats.ups++; toast('🔨 Reforja aprendida!'); afterBuy(); });
    buyRow(sprite('ingot', ['#f4a36b', '#5fd6d0', '#5b2a99']), 'Forja composta' + nv(1), S.up.alloy ? 'Cada espaço da bigorna aceita um metal diferente.' : `metais diferentes na mesma peça · +${pct(ALLOY_VALUE)} de valor e <b>muito</b> mais difícil por metal extra`, S.up.alloy ? null : ALLOY_PRICE, () => { S.up.alloy = true; S.stats.ups++; fitOres(); toast('⚗️ Forja composta liberada!'); afterBuy(); });
    // Armaria: nv.1 espada e machado · nv.2 maça e alabarda · nv.3 espada longa e machado de guerra (metal + cabo de madeira)
    while (ARMORY[S.up.armory + 1]?.types.every(id => S.molds[id])) S.up.armory++;   // nível cujos moldes já são seus (saves antigos) não é cobrado de novo
    const uar = S.up.armory + 1, AR = ARMORY[uar], names = A => A.types.map(id => type(id).n).join(', ').replace(/, ([^,]*)$/, ' e $1');
    if (AR) buyRow(moldImg(AR.types[0], 1), 'Armaria' + nv(uar), `libera os moldes de ${names(AR)} (metal comum + cabo de madeira)`, AR.price, () => {
      AR.types.forEach(give); S.up.armory = uar; S.stats.ups++; toast(`⚔ Armaria nv.${uar}: ${names(AR)}!`); afterBuy();
    });
    else buyRow(moldImg('waraxe', 1), 'Armaria' + nv(S.up.armory), 'Nível máximo: todos os moldes de armas liberados.', null);
    // Oficina (nv.1 arco → nv.2 cajado) → Arcabuzaria (nv.1 flintlock → nv.2 arcabuz)
    const uw = S.up.workshop + 1, W = WORKSHOP[uw];
    if (!W) { const L = WORKSHOP[S.up.workshop]; buyRow(moldImg(L.t, 1), L.n + nv(L.lv), 'Nível máximo: Arco, Cajado, Flintlock e Arcabuz liberados.', null); }
    else if (W.tools && !tools(W.tools)) buyRow(moldImg(W.t, 1), `${W.n}${nv(W.lv)} · ${W.price} moedas`, needTools(W.tools), false);
    else buyRow(moldImg(W.t, 1), W.n + nv(W.lv), W.d + (uw < WORKSHOP.length - 1 ? ` · depois: ${WORKSHOP[uw + 1].n} (nv.${WORKSHOP[uw + 1].lv})` : ''), W.price, () => {
      give(W.t); S.up.workshop = uw; S.stats.ups++; toast(`<img src="${moldImg(W.t, 1, 3)}"> ${W.n} nv.${W.lv}: molde de ${type(W.t).n} liberado!`); afterBuy();
    });
    // Mesa de runas: só depois da Bigorna e do Martelo Rúnicos
    const ur = S.up.runes + 1, RU = RUNE_UP[ur], runeTxt = U => `grava runas até o grau ${RUNE_G[U.max].n} · ${U.cnt} por sessão · recarrega em ${mmss(U.cd)}`;
    if (!RU) buyRow(runeImg(5), RUNE_UP[S.up.runes].n + nv(S.up.runes), 'Nível máximo · ' + runeTxt(RUNE_UP[S.up.runes]), null);
    else if (!tools(RUNE_TOOLS)) buyRow(runeImg(1), `${RU.n}${nv(ur)} · ${RU.price} moedas`, needTools(RUNE_TOOLS), false);
    else buyRow(runeImg(RU.max), RU.n + nv(ur), runeTxt(RU) + (ur === 1 ? ' · runas aumentam o valor e a sorte de armaduras e armas (botão ᚱ no canto da bigorna)' : ''), RU.price, () => { S.up.runes = ur; S.stats.ups++; toast(`ᚱ ${RU.n}! Botão de runas no canto da bigorna.`); afterBuy(); });
  }

  else if (k === 'autosell') {
    const A = S.autoSell, tog = (label, on, txt, set) => { const r = row(`<span class="nm">${label}</span><button class="btn small ${on ? 'on' : ''}">${txt[+on]}</button>`); r.querySelector('button').onclick = () => { set(!on); save(); SFX.place(); renderStock(); renderModal(); }; };
    $('#m-title').textContent = '💰 Venda automática';
    tog(`<b>Venda automática</b><br><small>uma peça a cada ${AUTO_EVERY} s, por ${pct(AUTO_SELL)} do valor</small>`, S.auto, ['Desligada', 'Ligada'], v => S.auto = v);
    sec('Raridades');
    RARITY.forEach((R, i) => tog(`<b class="r-${R.id}">${R.n}</b>`, A.r[i], ['Guarda', 'Vende'], v => A.r[i] = v));
    sec('Opcionais');
    tog('<b>Peças com gema</b>', A.gems, ['Guarda', 'Vende'], v => A.gems = v);
    tog('<b>Peças com runa</b>', A.runes, ['Guarda', 'Vende'], v => A.runes = v);
    foot.innerHTML = '<small class="sub">Peças que servem para uma encomenda aberta ficam sempre guardadas.</small>';
  }

  else if (k === 'runes') {
    const U = RUNE_UP[S.up.runes], total = RUNE_G.reduce((a, _, g) => a + (S.runes[g] || 0), 0);
    $('#m-title').textContent = `ᚱ Runas (${total})`;
    sec('Runas gravadas');
    if (!total) body.insertAdjacentHTML('beforeend', '<div class="empty" style="padding:8px">Nenhuma runa ainda. Grave a primeira logo abaixo.</div>');
    RUNE_G.forEach((G, g) => {
      if (!G || !S.runes[g]) return;
      const r = row(`<img class="ic" src="${runeImg(g)}" alt=""><span class="nm"><b class="r-${G.r}">Runa ${G.n}</b><br><small>+${pct(G.v)} no valor da peça · +${pct(G.q)} de chance de raridade</small></span><span class="pr">×${S.runes[g]}</span><button class="btn small">${sel.rune === g ? 'Na bigorna' : 'Usar'}</button>`);
      const b = r.querySelector('button'); b.disabled = sel.rune === g;
      b.onclick = () => { placeRune(g); if (sel.rune === g) closeModal(); };
    });
    sec('Gravar runa');
    const r = row(`<img class="ic" src="${runeImg(U.max)}" alt=""><span class="nm"><b>${U.n}</b> <small>(nv.${S.up.runes})</small><br><small>grava ${U.cnt} runa${U.cnt > 1 ? 's' : ''} por sessão, até o grau ${RUNE_G[U.max].n} · recarrega em ${mmss(U.cd)}</small></span><button id="rune-craft" class="btn small">${runeCraftTxt()}</button>`);
    r.querySelector('button').onclick = () => {
      if (!runeReady()) return nope(`A mesa de runas está recarregando. Volte em ${mmss(S.runeAt - Date.now())}.`);
      closeModal(); startRunes();
    };
    body.insertAdjacentHTML('beforeend', '<p class="sub" style="font-size:12px">A runa vai no espaço do meio da bigorna, uma por peça, só em armaduras e armas. Coloque primeiro o molde e depois clique em Usar.</p>');
  }

  else if (k === 'counter') {
    $('#m-title').textContent = `Balcão · Encomendas (${S.orders.length}/${maxOrders()})`;
    {
      if (!S.orders.length) body.innerHTML = `<div class="empty">Nenhuma encomenda agora. Próxima em ${mmss(S.nextOrder - Date.now())}.</div>`;
      const now = Date.now();
      S.orders.forEach(o => {
        const m = matchFor(o), f = orderInfo(o, now), miss = m ? missing(m, o) : 0;
        const req = `<span class="r-${o.r}">${rar(o.r).n}</span> ou melhor` + (o.lvl > 1 ? ` · molde ${LEVELS[o.lvl].n}+` : '') + (o.gem ? ` · gema: ${gemOf(o.gem).n}` : '') + (o.rune ? ` · <span class="r-${RUNE_G[o.rune].r}">runa ${RUNE_G[o.rune].n} ou melhor</span>` : '');
        const extra = o.gem || o.rune ? `<br><small>${miss ? `<span style="color:var(--fire)">Sua peça não tem ${[hasGem(m, o) ? '' : 'a gema', hasRune(m, o) ? '' : 'a runa'].filter(Boolean).join(' nem ')}: paga só ${orderPay(o, m)}</span>` : `Sem ${[o.gem ? 'a gema' : '', o.rune ? 'a runa' : ''].filter(Boolean).join(' ou ')} a entrega vale, mas paga menos.`}</small>` : '';
        const r = row(`<img class="ic" src="${orderImg(o)}" alt=""><span class="nm">${o.e} <b>${esc(o.npc)}</b> quer <b>${esc(orderName(o))}</b><br><small>${req} · <span class="tm">${f.txt}</span></small>${extra}<div class="timer"><i class="${f.fast ? 'fast' : ''}" style="width:${f.pct}%"></i></div></span>${coinTag(f.pay)}<span class="acts"><button class="btn small">Entregar</button><button class="btn small ghost" title="Recusar">✕</button></span>`, m ? 'ok' : '');
        r.dataset.oid = o.id;
        const [bd, bx] = r.querySelectorAll('button'); bd.disabled = !m; bd.title = m ? 'Entregar ' + itemName(m) : 'Você não tem uma peça que sirva no estoque';
        bd.onclick = () => deliver(o.id); bx.onclick = () => { S.orders = S.orders.filter(x => x !== o); save(); renderBottom(); renderModal(); };
      });
      foot.innerHTML = `<small class="sub">Uma nova encomenda chega a cada ${ORDER_EVERY / 1000} s (máx. ${maxOrders()}). Entregas rápidas pagam bônus. Você também pode arrastar a peça do estoque para o balcão: se não servir para nenhuma encomenda, ela é vendida por ${pct(AUTO_SELL)} do valor.</small>`;
    }
  }

  else if (k === 'missions') {
    $('#m-title').textContent = '🏆 Recompensas';
    {
      [...MISSIONS].sort((a, b) => S.claimed.includes(a.id) - S.claimed.includes(b.id)).forEach(m => {
        const [a, b] = m.p(S), done = a >= b, got = S.claimed.includes(m.id);
        const r = row(`<span class="nm">${got ? '✔ ' : ''}<b>${m.n}</b><br><small>Recompensa: ${rwText(m.rw)}</small><div class="prog"><i style="width:${Math.min(100, a / b * 100)}%"></i></div></span><span class="pr" style="color:var(--dim)">${Math.min(a, b)}/${b}</span>` + (got ? '' : `<button class="btn small" ${done ? '' : 'disabled'}>Resgatar</button>`), done && !got ? 'ok' : '');
        if (got) r.style.opacity = .5;
        const bt = r.querySelector('button'); if (bt) bt.onclick = () => {
          S.claimed.push(m.id); if (m.rw.c) earn(m.rw.c);
          Object.entries(m.rw.o || {}).forEach(([id, q]) => { S.ores[id] = (S.ores[id] || 0) + q; see(id); });
          toast('🏆 Recompensa resgatada: ' + m.n); afterBuy();
        };
      });
    }
  }

  else if (k === 'auction') {
    $('#m-title').textContent = `Leilão (${S.auction.length}/${S.up.slots})`;
    sec('À venda');
    if (!S.auction.length) body.insertAdjacentHTML('beforeend', '<div class="empty">Nada à venda. Arraste uma peça do estoque para o leilão ou escolha abaixo.</div>');
    S.auction.forEach((a, i) => {
      const r = row(`<img class="ic" src="${itemImg(a.it)}" alt=""><span class="nm">${esc(itemName(a.it))} <small class="r-${a.it.r}">${rar(a.it.r).n}</small><br><small>valor ${itemValue(a.it)} · ${chance(a.it, a.price)} · <span class="tm">⏱ ${mmss(a.end - Date.now())}</span></small></span><input type="number" min="1" value="${a.price}" title="Mudar o preço reinicia o leilão"><button class="btn small ghost">Retirar</button>`, 'b-' + a.it.r);
      r.dataset.aid = a.it.id;
      const inp = r.querySelector('input');
      inp.onchange = () => reprice(i, +inp.value || 1); inp.onkeydown = e => e.stopPropagation();
      r.querySelector('button').onclick = () => cancelAuction(i);
    });
    sec('Estoque');
    if (!S.stock.length) body.insertAdjacentHTML('beforeend', '<div class="empty">Estoque vazio.</div>');
    S.stock.forEach(it => {
      const d = drafts[it.id] ?? suggested(it);
      const r = row(`<img class="ic" src="${itemImg(it)}" alt=""><span class="nm">${esc(itemName(it))} <small class="r-${it.r}">${rar(it.r).n}</small><br><small>valor ${itemValue(it)} · <span class="ch">${chance(it, +d || 1)}</span></small></span><input type="number" min="1" value="${d}"><button class="btn small">Leiloar</button>`, 'b-' + it.r);
      const inp = r.querySelector('input'), b = r.querySelector('button');
      inp.oninput = () => { drafts[it.id] = inp.value; r.querySelector('.ch').innerHTML = chance(it, Math.max(1, +inp.value || 1)); };
      inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') listAuction(it.id); };
      b.disabled = S.auction.length >= S.up.slots; b.onclick = () => listAuction(it.id);
    });
    foot.innerHTML = '<small class="sub">Nem toda peça vende: quanto mais perto do valor e mais rara, maior a chance. Se ninguém comprar até o fim do leilão, ela volta para o estoque.</small>';
  }

  else if (k === 'ency') {
    $('#m-title').textContent = '📖 Enciclopédia';
    tabBar([['mat', 'Materiais'], ['pieces', 'Peças'], ['res', 'Recursos'], ['ups', 'Melhorias'], ['rarity', 'Raridades']]);
    const SUBS = {
      mat: [['metais', 'Metais'], ['madeiras', 'Madeiras'], ['gems', 'Gemas'], ['runes', 'Runas']],
      res: [['mine', 'Mina'], ['forest', 'Floresta'], ['fur', 'Fornalha'], ['table', 'Mesa de runas']],
      ups: [['tools', 'Ferramentas'], ['shop', 'Comércio'], ['tech', 'Técnicas']],
    };
    if (SUBS[modal.tab]) subBar(SUBS[modal.tab]);
    const t = SUBS[modal.tab] ? modal.sub : modal.tab;
    // Cada fato fica num lugar só. Linha = ícone + nome + uma linha de dados + estado (✔, 🔒 ou quantidade); os números saem das tabelas do jogo
    const line = (img, name, info, st = '', lock = false) => row(`${img ? `<img class="ic" src="${img}" alt="">` : ''}<span class="nm"><b>${name}</b><br><small>${info}</small></span><span class="pr"${st === '✔' ? '' : ' style="color:var(--dim)"'}>${st}</span>`, lock ? 'lock' : '');
    const note = html => body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">${html}</p>`);
    const cost = p => p ? p + ' moedas' : 'inicial', and = a => a.join(', ').replace(/, ([^,]*)$/, ' e $1'), dot = a => a.filter(Boolean).join(' · ');
    const up = (img, name, info, ok) => line(img, name, info, ok ? '✔' : '🔒', !ok);
    const lvls = f => LEVELS.slice(1).map((_, i) => f(i + 1)).join('/');

    if (t === 'metais') {
      ORES.filter(o => !o.wood).forEach(o => { const seen = S.seen.includes(o.id);
        line(ingotImg(o.id), o.n, dot([`grau ${o.tier}`, `valor ${o.cost}`, o.alloy ? ALLOYS.find(a => a.id === o.id).n : `mina nv.${o.mine}`, o.shop && `loja ${o.buy} (fornecedor nv.${o.shop})`, o.jewel && 'só joias', o.ingr && 'só para ligas']), seen ? '×' + (S.ores[o.id] || 0) : '🔒', !seen); });
      note('O valor entra no preço da peça; o grau, na dificuldade da forja.');
    }
    if (t === 'madeiras') {
      ORES.filter(o => o.wood).forEach(o => { const seen = S.seen.includes(o.id);
        line(ingotImg(o.id), o.n, dot([`grau ${o.tier}`, `valor ${o.cost}`, `floresta nv.${o.fl}`, `corte ${'★'.repeat(treeStars(o))}${'☆'.repeat(5 - treeStars(o))}`, `loja ${o.buy} (fornecedor nv.${o.shop})`]), seen ? '×' + (S.ores[o.id] || 0) : '🔒', !seen); });
      note('Usada em cabos de armas, arcos, cajados e coronhas.');
    }
    if (t === 'gems') {
      GEMS.forEach(g => line(gemImg(g.id), g.n, dot([`+${pct(g.b)} de valor`, `+${pct(g.q)} de sorte`, `mina nv.${g.mine}`]), S.gems[g.id] ? '×' + S.gems[g.id] : ''));
      note(`Uma gema por espaço. Na forja dá valor e sorte (até +${pct(GEM_Q_MAX)}); arrastada para uma peça do estoque, só valor. Em peças só de metal o valor conta pela metade. Peça com gema vende no leilão em ${pct(GEM_SPEED)} do tempo.`);
    }
    if (t === 'runes') {
      RUNE_G.slice(1).forEach((G, i) => line(runeImg(i + 1), `<span class="r-${G.r}">Runa ${G.n}</span>`, dot([`+${pct(G.v)} de valor`, `+${pct(G.q)} de sorte`]), S.runes[i + 1] ? '×' + S.runes[i + 1] : ''));
      note(`Uma por peça, só em armaduras e armas. Peça rúnica vende no leilão em ${pct(RUNE_SPEED)} do tempo. Encomendas podem pedir gema ou runa: sem ela, pagam menos.`);
    }

    if (t === 'pieces') {
      TYPES.forEach(T => { const mw = T.mixWood || 0, lv = S.molds[T.id];
        const src = T.jewel ? 'Joalheria' : T.wood ? 'Oficina' : T.grp === 'guns' ? 'Arcabuzaria' : T.armory ? 'Armaria nv.' + T.armory : '';
        const rec = mw ? `${lvls(l => usesOf(T.id, l) - mw)} metais + ${mw} madeira${mw > 1 ? 's' : ''}` : `${lvls(l => usesOf(T.id, l))} ${T.wood ? 'madeiras' : T.jewel ? 'Prata ou Ouro' : 'lingotes'}`;
        line(moldImg(T.id, lv || 1), T.n, dot([src, rec + (T.gemReq ? ' + gema' : ''), `valor base ${T.base}`]), lv ? LEVELS[lv].n : '🔒', !lv); });
      note(`Material por nível do molde: ${LEVELS.slice(1).map(l => `${l.n} (valor ×${l.m})`).join(' / ')}.<br>Gema: 1 espaço por peça; joias ganham +1 por nível acima de ${LEVELS[3].n} e o cajado tem 2 a partir de ${LEVELS[4].n}.`);
    }

    if (t === 'mine') {
      MINES.slice(1).forEach((M, i) => {
        const lv = i + 1, os = minable(lv), tot = os.reduce((a, o) => a + mineWeight(o, lv), 0), gs = GEMS.filter(g => g.mine <= lv), gt = gs.reduce((a, g) => a + gemWeight(g, lv), 0);
        const ores = os.map(o => `${o.n} ${(mineWeight(o, lv) / tot * 100 * (gs.length ? 1 - GEM_CHANCE : 1)).toFixed(1)}%`).join(' · ');
        const gems = gs.length ? `<br>Gemas (${pct(GEM_CHANCE)} dos veios): ${gs.map(g => `${g.n} ${(gemWeight(g, lv) / gt * 100).toFixed(0)}%`).join(' · ')}` : '';
        up(pickImg(lv, 3), `${lv}. ${M.n}`, `${M.targets} veios · ${cost(M.price)}<br>${ores}${gems}`, S.up.mine >= lv);
      });
      note(`Por veio: Perfeito = 2 minérios, Bom = 1, Ok = 50% de chance de 1. Gema só sai inteira com Bom ou Perfeito.<br>Bônus em veio de minério: ${pct(TIN_BONUS)} de vir +1 Estanho junto e, com Bom ou Perfeito, ${pct(GEM_BONUS)} de vir uma gema (mina nv.${GEM_LEVEL}+).<br>Reabre em ${mmss(MINE_CD)}. O minério bruto vai para a aba Forja.`);
    }
    if (t === 'forest') {
      FORESTS.slice(1).forEach((F, i) => { const lv = i + 1, ws = forestWoods(lv), tot = ws.reduce((a, o) => a + o.fw, 0);
        up('', `${lv}. ${F.n}`, `${cost(F.price)}<br>${ws.map(o => `${o.n} ${(o.fw / tot * 100).toFixed(1)}%`).join(' · ')}`, S.up.forest >= lv); });
      note(`${FOREST_TREES} árvores por visita; rebrota em ${mmss(FOREST_CD)}.<br>Segure para carregar o machado e solte na faixa verde: Perfeito = 2 madeiras, Bom = 1, Ok = 50% de chance de 1. Fora da faixa, a árvore dá mais uma chance.<br>Madeira nobre tem faixa menor e carga mais rápida. Cada nível da floresta alarga em ${pct(FOREST_EASE)} a faixa das madeiras dos níveis anteriores.`);
    }
    if (t === 'fur') {
      sec('Fornos');
      FURNACES.slice(1).forEach((F, i) => up(flameImg(i + 1), F.n, dot([cost(F.price), `derrete ${and(ORES.filter(o => o.smelt === i + 1).map(o => o.n)) || 'os mesmos minérios'}`, F.steel && `ferro → aço ${pct(F.steel)}`, F.arcane && `mithril → adamantita/oricalco ${pct(F.arcane)}`]), S.up.furnace >= i + 1));
      sec('Ligas (compradas em ordem)');
      ALLOYS.forEach((a, i) => up(ingotImg(a.id), a.n, dot([`${inpText(a)} → ${ore(a.id).n}`, FURNACES[a.fur].n, cost(a.price)]), S.up.alloys > i));
      note(`Segure para aquecer e mantenha a temperatura na faixa verde: cada lote dá certo com chance igual ao tempo na faixa.<br>As conversões dos fornos (→) só acontecem em fundição perfeita (${pct(PERFECT_SMELT)}+ na faixa) e não gastam estanho.`);
    }
    if (t === 'table') {
      RUNE_UP.slice(1).forEach((U, i) => up(runeImg(U.max), U.n, dot([cost(U.price), `até ${RUNE_G[U.max].n}`, `${U.cnt} por sessão`, `recarrega em ${mmss(U.cd)}`]), S.up.runes >= i + 1));
      note(`Exige ${ANVILS[RUNE_TOOLS].n} e ${HAMMERS[RUNE_TOOLS].n}. Clique em cada ponto quando o anel encostar nele.<br>Grau pela precisão média: 93% Lendária · 80% Épica · 65% Rara · 45% Incomum · 20% Comum; abaixo disso a pedra racha.`);
    }

    if (t === 'tools') {
      sec('Bigornas (zona de acerto)'); ANVILS.slice(1).forEach((a, i) => up(anvilImg(i + 1, 2), a.n, dot([`+${pct(a.b)}`, cost(a.price)]), S.up.anvil >= i + 1));
      sec('Martelos (cursor mais lento)'); HAMMERS.slice(1).forEach((a, i) => up(hammerImg(i + 1, 2), a.n, dot([`−${pct(a.b)}`, cost(a.price)]), S.up.hammer >= i + 1));
      note(`Estelares: exigem ${and(STAR_REQ.map(([, n]) => n()))}. Com os dois, suas peças saem no mínimo Incomum (não vale para o ajudante) e todo craft tem ~${pct(STAR_UP)} de chance de subir um nível de molde.`);
    }
    if (t === 'shop') {
      sec('Balcões'); COUNTERS.slice(1).forEach((c, i) => up('', c.n, dot([`${c.max} encomendas`, cost(c.price)]), S.up.counter >= i + 1));
      sec('Leilão'); SLOT_PRICES.slice(1).forEach((p, i) => up('', `${i + 1} espaço${i ? 's' : ''}`, cost(p), S.up.slots >= i + 1));
      sec('Ajudantes'); HELPERS.slice(1).forEach((H, i) => up('', `${H.n} nv.${i + 1}`, dot([i ? `forja uma peça simples a cada ${mmss(H.every * 1000)}` : `vende por ${pct(AUTO_SELL)} do valor, uma peça a cada ${AUTO_EVERY} s`, i === 1 && 'até Rara', i === 2 && 'até Épica', i === 3 && `até Lendária · ${pct(H.gem)} com gema`, cost(H.price)]), S.up.helper >= i + 1));
      sec('Fornecedores'); SUPPLIERS.slice(1).forEach((U, i) => up('', U.n, dot([`vende ${ORES.filter(o => o.shop === i + 1).map(o => o.n).join(', ')}`, U.off && `preços −${pct(U.off)}`, i === 1 && `repõe a cada ${mmss(AUTOBUY_EVERY * 1000)}, até ${U.cap} por material`, i === 2 && 'repõe sem limite', cost(U.price)]), S.up.supplier >= i + 1));
      note(`Encomendas: prazo sorteado entre ${ORDER_MIN / 60} e ${ORDER_MAX / 60} min. Venda automática (botão 💰): escolha quais raridades e opcionais (gema, runa) ela vende.`);
    }
    if (t === 'tech') {
      up('', 'Joalheria', dot(['moldes de Anel e Amuleto', cost(JEWEL_PRICE)]), S.up.jewel);
      up('', 'Reforja', dot([`+1 raridade, +2 com média ${GRADES[3].n.replace('!', '')}`, '1× por peça (2× com Estelares)', 'usa metade dos materiais', 'falha destrói a peça ou apaga a runa', cost(REFORGE_PRICE)]), S.up.reforge);
      up('', 'Forja composta', dot([`metais diferentes na mesma peça: +${pct(ALLOY_VALUE)} de valor por metal extra, bem mais difícil`, cost(ALLOY_PRICE)]), S.up.alloy);
      ARMORY.slice(1).forEach((A, i) => up('', `Armaria nv.${i + 1}`, dot([and(A.types.map(id => type(id).n)), cost(A.price)]), S.up.armory > i));
      WORKSHOP.slice(1).forEach((W, i) => up('', `${W.n} nv.${W.lv}`, dot([type(W.t).n, W.tools && `exige ${ANVILS[W.tools].n} e ${HAMMERS[W.tools].n}`, cost(W.price)]), S.up.workshop > i));
    }

    if (t === 'rarity') {
      const w = rarityWeights(1), tot = w.reduce((a, b) => a + b), w5 = rarityWeights(.5), t5 = w5.reduce((a, b) => a + b);
      RARITY.forEach((r, i) => row(`<span class="nm"><b class="r-${r.id}">${r.n}</b><br><small>valor ×${r.m} · ritmo médio ${(w5[i] / t5 * 100).toFixed(1)}% · perfeito ${(w[i] / tot * 100).toFixed(1)}%</small></span>`, 'b-' + r.id));
      note(`Golpes: ${GRADES.slice().reverse().map(g => `${g.n.replace('!', '')} = ${g.pts}`).join(' · ')}. A raridade é sorteada: acertar só melhora as chances. A sorte de gemas e runas vale de Raro para cima.`);
    }
  }

  else if (k === 'pause') {
    $('#m-title').textContent = 'Menu';
    body.innerHTML = `<div class="pause-box"><button class="btn" data-a="c">▶ Continuar</button><button class="btn" data-a="m">⌂ Menu inicial</button><button class="btn ${S.cheat ? 'on' : ''}" data-a="x">Modo trapaça: ${S.cheat ? 'LIGADO' : 'desligado'}</button><small class="sub" style="margin:0">Com o modo trapaça, aparecem no topo os botões +100k moedas e "Zerar esperas" (mina, floresta e runas).</small><button class="btn danger" data-a="r">⟲ Resetar progresso</button></div>`;
    body.querySelector('[data-a=c]').onclick = closeModal;
    body.querySelector('[data-a=m]').onclick = () => { closeModal(); menuLabel(); show('menu'); };
    body.querySelector('[data-a=x]').onclick = () => { S.cheat = !S.cheat; save(); renderCheat(); renderModal(); };
    body.querySelector('[data-a=r]').onclick = () => openModal('reset');
  }

  else if (k === 'reset') {
    $('#m-title').textContent = '⚠ Resetar progresso';
    body.innerHTML = '<p class="warn">Isso apaga <b>tudo</b>: moedas, minérios, gemas, moldes, melhorias, estoque, leilões, encomendas e recompensas.<br>O jogo volta ao começo, e isso <b>não pode ser desfeito</b>.</p>';
    foot.innerHTML = '<button class="btn" data-a="n">Cancelar</button><button class="btn danger" data-a="y">Sim, apagar tudo</button>';
    foot.querySelector('[data-a=n]').onclick = () => openModal('pause');
    foot.querySelector('[data-a=y]').onclick = () => { S = fresh(); save(); clearAnvil(); closeModal(); renderAll(); menuLabel(); show('menu'); toast('Progresso apagado.'); };
  }
  body.scrollTop = keep;
}

/* ======================= Teclado e avisos ======================= */
addEventListener('keydown', e => {
  if (!$('#game').classList.contains('on')) return;
  if (mine) { if (e.key === 'Escape') $('#mine-exit').click(); return; }
  if (runeGame) { if (e.key === 'Escape') $('#rune-exit').click(); return; }
  if (forest) { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && !forest.over && forest.wait <= 0) forest.hold = true; } else if (e.key === 'Escape') $('#for-exit').click(); return; }
  if (fur) { if (e.code === 'Space') { e.preventDefault(); if (fur.stage === 'run') fur.heat = true; } else if (e.key === 'Escape') $('#fur-exit').click(); return; }
  if (e.code === 'Space' && forging) { e.preventDefault(); strike(); }
  else if (e.key === 'Enter' && !forging && $('#modal').hidden) startForge();
  else if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (!forging) openModal('pause'); }
});
$('#anvil-area').addEventListener('pointerdown', e => { if (forging) { e.preventDefault(); strike(); } });
let toastT;
function toast(html) { const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }

function renderAll() { renderCoins(); renderTools(); renderLists(); renderSlots(); renderStock(); renderBottom(); renderMineBtn(); renderForestBtn(); renderRuneBtn(); renderCheat(); }
/* Ícones em pixel art: qualquer emoji de HUD que apareça na tela (botões, títulos, avisos) vira um sprite */
const EMO = { '🔥': 'flame', '⚗': 'flask', '🔒': 'lock', '⛏': 'pick', '🌲': 'tree', '💰': 'bag', '⚙': 'gear', '🔨': 'gavel', '📜': 'scroll', '🏆': 'trophy', '📖': 'book', '🛒': 'cart', '⏱': 'clock', '💍': 'ring', '☰': 'menu', 'ᚱ': 'rune' };
const EMO_RE = new RegExp(`(${Object.keys(EMO).join('|')})\\uFE0F?`, 'gu');
function iconify(root) {
  const list = []; if (root.nodeType === 3) list.push(root); else { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) list.push(n); }
  list.forEach(n => {
    EMO_RE.lastIndex = 0; if (!n.parentNode || !EMO_RE.test(n.data)) return; EMO_RE.lastIndex = 0;
    const tpl = document.createElement('template'); tpl.innerHTML = esc(n.data).replace(EMO_RE, (_, e) => icon(EMO[e])); n.replaceWith(tpl.content);
  });
}
new MutationObserver(ms => ms.forEach(m => { if (m.type === 'characterData') iconify(m.target); else m.addedNodes.forEach(n => (n.nodeType === 1 || n.nodeType === 3) && iconify(n)); })).observe(document.body, { childList: true, subtree: true, characterData: true });
menuLabel(); renderAll(); iconify(document.body);
