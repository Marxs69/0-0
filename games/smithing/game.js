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
// Madeiras: fw = peso na floresta (quanto menor, mais rara e mais difícil de cortar)
const ORES = [
  { id: 'estanho',    n: 'Estanho',    tier: 1,  sh: ['#e7e5e4', '#a8a29e', '#57534e'], cost: 2,   mine: 1, w: 6,   smelt: 1, shop: true, spark: '#f5f5f4', ingr: true },
  { id: 'cobre',      n: 'Cobre',      tier: 1,  sh: ['#f4a36b', '#c8693a', '#8a3f22'], cost: 3,   mine: 1, w: 10,  smelt: 1, shop: true, spark: '#ffb36b' },
  { id: 'bronze',     n: 'Bronze',     tier: 2,  sh: ['#e8c07a', '#b3833d', '#7a5520'], cost: 8,   alloy: true, spark: '#ffc56b' },
  { id: 'ferro',      n: 'Ferro',      tier: 3,  sh: ['#d5d9de', '#9aa1aa', '#626973'], cost: 9,   mine: 1, w: 1.6, smelt: 2, shop: true, spark: '#ffd27a' },
  { id: 'aco',        n: 'Aço',        tier: 4,  sh: ['#c4d3e6', '#7d8fa6', '#4c5a6e'], cost: 22,  alloy: true, spark: '#fff1b0' },
  { id: 'prata',      n: 'Prata',      tier: 5,  sh: ['#ffffff', '#c9d1dc', '#8a94a3'], cost: 26,  mine: 2, w: .2,  smelt: 1, shop: true, spark: '#ffffff', jewel: true },
  { id: 'ouro',       n: 'Ouro',       tier: 6,  sh: ['#fff1a8', '#f2c230', '#a87a12'], cost: 42,  mine: 2, w: .12, smelt: 1, shop: true, spark: '#ffe066', jewel: true },
  { id: 'mithril',    n: 'Mithril',    tier: 7,  sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'], cost: 70,  mine: 4, w: .35, smelt: 3, spark: '#8ffff0' },
  { id: 'adamantita', n: 'Adamantita', tier: 8,  sh: ['#e2c4ff', '#9b5de5', '#5b2a99'], cost: 110, alloy: true, spark: '#d8b4fe' },
  { id: 'oricalco',   n: 'Oricalco',   tier: 9,  sh: ['#ffc2a8', '#ff6b4a', '#a8321c'], cost: 130, alloy: true, spark: '#ff9a7a' },
  { id: 'astralita',  n: 'Astralita',  tier: 10, sh: ['#e0e7ff', '#6366f1', '#1e1b4b'], cost: 300, alloy: true, spark: '#c7d2fe' },
  { id: 'pinho',      n: 'Pinho',      tier: 1,  sh: ['#f3d9a4', '#d4a65a', '#9a6b2f'], cost: 3,   wood: true, fw: 10,  shop: true, spark: '#fde68a' },
  { id: 'carvalho',   n: 'Carvalho',   tier: 2,  sh: ['#c08552', '#8a5a33', '#5e3b20'], cost: 5,   wood: true, fw: 7,   shop: true, spark: '#fbbf24' },
  { id: 'freixo',     n: 'Freixo',     tier: 3,  sh: ['#ead7b7', '#c2a477', '#8b6f47'], cost: 8,   wood: true, fw: 5,   shop: true, spark: '#fde68a' },
  { id: 'teixo',      n: 'Teixo',      tier: 5,  sh: ['#d9a066', '#a0522d', '#6b2f12'], cost: 15,  wood: true, fw: 3,   shop: true, spark: '#fbbf24' },
  { id: 'pauferro',   n: 'Pau-ferro',  tier: 6,  sh: ['#a1887f', '#6d4c41', '#3e2723'], cost: 24,  wood: true, fw: 1.6, spark: '#fbbf24' },
  { id: 'ebano',      n: 'Ébano',      tier: 8,  sh: ['#6b6b75', '#3a3540', '#1c1820'], cost: 40,  wood: true, fw: .8,  spark: '#e5e7eb' },
  { id: 'sandalo',    n: 'Sândalo',    tier: 9,  sh: ['#ffd6a5', '#e07a5f', '#9c3d2e'], cost: 60,  wood: true, fw: .4,  spark: '#fca5a5' },
].map(o => ({ ...o, buy: o.cost * 4 }));

const minable = lv => ORES.filter(o => o.mine && o.mine <= lv);
const mineWeight = (o, lv) => o.w * (o.w < 5 ? 1 + 1.2 * (lv - o.mine) : 1);

// uses = lingotes no molde Simples (+1 por nível) · base = valor da peça · pf = peso no preço do molde · df = dificuldade extra
const TYPES = [
  { id: 'dagger', grp: 'arms',  n: 'Adaga',    g: 1, uses: 1, base: 5,  pf: .8,  df: .2 },
  { id: 'helmet', grp: 'armor',  n: 'Capacete', g: 0, uses: 2, base: 6,  pf: 1,   df: 0 },
  { id: 'gloves', grp: 'armor',  n: 'Luvas',    g: 2, uses: 1, base: 4,  pf: .8,  df: 0 },
  { id: 'greaves', grp: 'armor', n: 'Grevas',   g: 2, uses: 2, base: 6,  pf: 1,   df: 0 },
  { id: 'armor', grp: 'armor',   n: 'Armadura', g: 1, uses: 3, base: 10, pf: 1.3, df: .2 },
  { id: 'sword', grp: 'arms',   n: 'Espada',   g: 1, uses: 2, base: 8,  pf: 1.2, df: .4 },
  { id: 'shield', grp: 'armor',  n: 'Escudo',   g: 0, uses: 3, base: 9,  pf: 1.2, df: .2 },
  { id: 'axe', grp: 'arms',     n: 'Machado',  g: 0, uses: 1, base: 7,  pf: 1.1, df: .3 },
  // Armaria (uma compra na loja de melhorias libera as duas): versões maiores, usam a base + 2 metais
  { id: 'longsword', grp: 'arms', n: 'Espada longa',      g: 1, uses: 4, base: 18, pf: 1.6, df: .6, unlock: true, armory: true, req: 'sword' },
  { id: 'waraxe', grp: 'arms',    n: 'Machado de guerra', g: 0, uses: 3, base: 16, pf: 1.5, df: .5, unlock: true, armory: true, req: 'axe' },
  // Pistola (Arcabuzaria, fim de jogo): metal no cano + madeira na coronha; exige Bigorna e Martelo de Mithril
  { id: 'pistol', grp: 'guns',    n: 'Pistola',           g: 1, uses: 4, base: 70, pf: 3 * 14, df: 1,  unlock: true, mixWood: 1 },
  { id: 'ring', grp: 'jewel',    n: 'Anel',     g: 0, uses: 1, base: 30, pf: 1.5, df: .5, jewel: true },
  { id: 'amulet', grp: 'jewel',  n: 'Amuleto',  g: 0, uses: 2, base: 45, pf: 1.8, df: .6, jewel: true },
  // Madeira: moldes liberados na loja de melhorias (Oficina). O cajado exige gema
  { id: 'bow', grp: 'wood',     n: 'Arco',     g: 0, uses: 2, base: 14, pf: 1.1, df: .4, wood: true, unlock: 600 },
  { id: 'staff', grp: 'wood',   n: 'Cajado',   g: 0, uses: 1, base: 14, pf: 1.3, df: .3, wood: true, gemReq: true, unlock: 800 },
];
const START_MOLDS = ['dagger', 'helmet', 'gloves'];
// Temas dos moldes (painel e loja)
const GROUPS = [['armor', 'Armaduras'], ['arms', 'Armas'], ['jewel', 'Joias'], ['wood', 'Madeiras'], ['guns', 'Arcabuzaria']];
/* Espaços de gema por peça: cajado 1 (2 a partir do Magistral); anel e amuleto 1, +1 por nível depois do Ornamentado; o resto 1 */
const gemSlots = (t, lvl) => t === 'staff' ? (lvl >= 4 ? 2 : 1) : type(t).jewel ? 1 + Math.max(0, lvl - 3) : 1;
const GEM_Q_MAX = .1;
const ARMORY_PRICE = 2500, PISTOL_PRICE = 25000 * 14, PISTOL_TOOLS = 3;   // Armaria; Arcabuzaria (exige bigorna e martelo nível 3 = Mithril)
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
];
const HAMMERS = [null,
  { n: 'Martelo de Ferro',   sh: ['#c9ced6', '#8b919b', '#565b64'], b: 0,   price: 0 },
  { n: 'Martelo de Aço',     sh: ['#c4d3e6', '#7d8fa6', '#4c5a6e'], b: .08, price: 300 },
  { n: 'Martelo de Mithril', sh: ['#c8fff6', '#5fd6d0', '#2e8f9c'], b: .16, price: 1200 },
  { n: 'Martelo Rúnico',     sh: ['#ffd1a8', '#e0571b', '#7a2a0e'], b: .25, price: 4000 },
];
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
// Fornalha: smelt = nível de minério que derrete · steel/arcane = chance, numa fundição perfeita, de ferro virar aço
// e de mithril virar adamantita/oricalco (como o ferro que vira aço no forno quente)
const FURNACES = [null,
  { n: 'Fornalha de barro', price: 0,     steel: 0,   arcane: 0 },
  { n: 'Forno de tijolos',  price: 500,   steel: .1,  arcane: 0 },
  { n: 'Alto-forno',        price: 3000,  steel: .2,  arcane: .05 },
  { n: 'Forno arcano',      price: 12000, steel: .3,  arcane: .1 },
];
const PERFECT_SMELT = .9;
// Receitas de liga, compradas em ordem na loja de melhorias (o bronze é o tutorial). fur = nível de fornalha exigido
const ALLOYS = [
  { id: 'bronze',     n: 'Liga de bronze',       inp: { cobre: 1, estanho: 1 },       fur: 1, price: 30 },
  { id: 'aco',        n: 'Processo de Bessemer', inp: { ferro: 2 },                   fur: 2, price: 600 },
  { id: 'adamantita', n: 'Liga arcana',          inp: { mithril: 1, prata: 1 },       fur: 3, price: 6000 },
  { id: 'oricalco',   n: 'Liga solar',           inp: { mithril: 1, ouro: 1 },        fur: 3, price: 9000 },
  { id: 'astralita',  n: 'Brasagem estelar',     inp: { adamantita: 1, oricalco: 1 }, fur: 4, price: 30000 },
];
// Metal da loja liberado? (prata e ouro só depois da mina chegar ao nível deles)
const shopOpen = o => o.shop && (!o.mine || S.up.mine >= o.mine) && (!o.wood || woodUnlocked());
const inpText = a => Object.entries(a.inp).map(([k, q]) => `${q} ${ore(k).n}`).join(' + ');
// Balcão: max = encomendas ao mesmo tempo · dur = multiplicador do prazo
const COUNTERS = [null,
  { n: 'Balcão simples',    max: 3, dur: 1,   price: 0 },
  { n: 'Balcão de carvalho', max: 4, dur: 1.4, price: 400 },
  { n: 'Balcão de mármore', max: 5, dur: 1.8, price: 1500 },
  { n: 'Balcão real',       max: 6, dur: 2.4, price: 5000 },
];
const SLOT_PRICES = [null, 200, 400, 1000, 2500, 6000];  // preço para ter N espaços no leilão (o 1º abre o leilão)
const ALLOY_PRICE = 8000, JEWEL_PRICE = 1200;            // técnicas: forja composta e joalheria
const ALLOY_DIFF = 1.6, ALLOY_VALUE = .3;                // por metal diferente a mais: dificuldade e bônus de valor
const HELPER_PRICE = 1500, SUPPLIER_PRICE = 1000;        // ajudante de ferreiro (venda automática) e fornecedor (compra automática)
const FOREST_CD = 120e3, FOREST_TREES = 8;               // floresta: rebrota a cada 2:00, 8 árvores por visita
const FOREST_YIELD = [0, .5, 1, 2];                      // madeira por corte: Ok = 50% de 1, Bom = 1, Perfeito = 2
const AUTO_SELL = .7, AUTO_EVERY = 3;                    // venda automática: 70% do valor, uma peça a cada 3 s
const AUTOBUY_EVERY = 30;                                // compra automática: confere os mínimos a cada 30 s

const NPCS = [['💂', 'Guarda Rui'], ['🛡️', 'Cavaleira Ana'], ['🏹', 'Caçador Téo'], ['👑', 'Lorde Bento'], ['⚔️', 'Mercenária Lia'], ['🧙', 'Mago Otto'], ['🏴‍☠️', 'Capitã Vera'], ['🧔', 'Lenhador Zé'], ['💃', 'Duquesa Inês']];
const ORDER_EVERY = 45e3;
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
const valueOf = (t, lvl, ores, r, gems) => Math.round((ores.reduce((a, o) => a + ore(o).cost, 0) * 1.6 + type(t).base) * LEVELS[lvl].m * rar(r).m * (1 + ALLOY_VALUE * mixN(ores)) * (1 + gemsB(t, gems)));
const moldPrice = (t, lvl) => Math.round(LEVELS[lvl].price * type(t).pf);
// Dificuldade: grau médio dos metais + nível do molde + quantidade de material + tipo de peça + liga
const diffOf = (t, lvl, ores) => ores.reduce((a, o) => a + ore(o).tier, 0) / ores.length * .55 + (lvl - 1) * 1.1 + ores.length * .35 + type(t).df + mixN(ores) * ALLOY_DIFF;
const oresName = ores => { const met = uniq(ores.filter(o => !ore(o).wood)), wd = uniq(ores.filter(o => ore(o).wood));
  if (met.length && wd.length) return 'de ' + met.map(o => ore(o).n).join('-') + ' e ' + wd.map(o => ore(o).n).join('-');
  const u = uniq(ores); return u.length === 1 ? 'de ' + ore(u[0]).n : 'de liga ' + u.map(o => ore(o).n).join('-'); };
const nameOf = (t, lvl, ores, gems) => { const T = type(t); const gs = (gems || []).filter(Boolean).map(g => gemOf(g).n); return T.n + (lvl > 1 ? ' ' + LEVELS[lvl].adj[T.g] : '') + ' ' + oresName(ores) + (gs.length ? ' com ' + (gs.length > 1 ? gs.slice(0, -1).join(', ') + ' e ' + gs[gs.length - 1] : gs[0]) : ''); };
// Cores da peça: um metal = cores dele; liga = mistura (claro do 1º, médio do 2º, escuro do último)
const shadesOf = ores => { const met = ores.filter(o => !ore(o).wood), u = uniq(met.length ? met : ores).map(ore); return u.length === 1 ? u[0].sh : [u[0].sh[0], u[1].sh[1], u[u.length - 1].sh[2]]; };
const itemName = it => nameOf(it.t, it.lvl, it.ores, it.gems);
const itemValue = it => valueOf(it.t, it.lvl, it.ores, it.r, it.gems);
const woodPal = ores => { const w = ores.find(o => ore(o).wood); return w ? { b: ore(w).sh[1], c: ore(w).sh[2] } : null; };
const itemImg = (it, s = 4) => sprite(it.t, shadesOf(it.ores), s, it.lvl, it.gems?.length ? gemOf(it.gems[0]).sh[1] : null, type(it.t).mixWood ? woodPal(it.ores) : null);
const moldImg = (t, lvl, s = 4) => sprite(t, NEUTRAL, s, lvl);
const ingotImg = (o, s = 4) => sprite(ore(o).wood ? 'log' : 'ingot', ore(o).sh, s);
const rawImg = (o, s = 4) => sprite('raw', ore(o).sh, s);
const gemImg = (g, s = 4) => sprite('gem', gemOf(g).sh, s);
const anvilImg = (lv, s = 10) => sprite('anvil', ANVILS[lv].sh, s, lv);
const hammerImg = (lv, s = 6) => sprite('hammer', HAMMERS[lv].sh, s, lv);
const pickImg = (lv, s = 3) => sprite('pick', MINES[lv].sh, s, lv);

/* ======================= Missões ======================= */
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
  { id: 'm12b', n: 'Entalhe um cajado',             p: s => [s.stats.staffs, 1],          rw: { o: { teixo: 2 } } },
  { id: 'm13', n: 'Encrave uma gema',               p: s => [s.stats.gemsSet, 1],         rw: { c: 300 } },
  { id: 'm14', n: 'Ganhe 2000 moedas no total',     p: s => [s.stats.earned, 2000],       rw: { o: { mithril: 2 } } },
  { id: 'm15', n: 'Entregue 20 encomendas',         p: s => [s.stats.orders, 20],         rw: { c: 400 } },
  { id: 'm16', n: 'Forje uma peça Lendária',        p: s => [s.stats.best >= 4 ? 1 : 0, 1], rw: { c: 500 } },
  { id: 'm17b', n: 'Tenha um molde Mítico',        p: s => [Math.max(...Object.values(s.molds)) >= 5 ? 1 : 0, 1], rw: { c: 4000 } },
  { id: 'm17', n: 'Tenha um molde Magistral',       p: s => [Math.max(...Object.values(s.molds)) >= 4 ? 1 : 0, 1], rw: { c: 1000 } },
  { id: 'm18', n: 'Forje uma liga',                 p: s => [s.stats.alloys, 1],          rw: { c: 1500 } },
  { id: 'm19', n: 'Chegue ao Abismo',               p: s => [s.up.mine >= 5 ? 1 : 0, 1], rw: { c: 1500 } },
  { id: 'm20', n: 'Forje com Oricalco',             p: s => [s.stats.used.includes('oricalco') ? 1 : 0, 1], rw: { c: 1500 } },
  { id: 'm20c', n: 'Forje uma pistola',              p: s => [s.stats.pistols || 0, 1],    rw: { c: 8000 } },
  { id: 'm20b', n: 'Obtenha Astralita',            p: s => [s.stats.made.astralita || 0, 1], rw: { c: 5000 } },
  { id: 'm21', n: 'Forje uma peça Única',           p: s => [s.stats.best >= 5 ? 1 : 0, 1], rw: { c: 3000 } },
];
const rwText = rw => [rw.c ? rw.c + ' moedas' : '', ...Object.entries(rw.o || {}).map(([k, v]) => v + ' ' + ore(k).n)].filter(Boolean).join(' + ');
const missionDone = m => { const [a, b] = m.p(S); return a >= b; };

/* ======================= Encomendas ======================= */
function genOrder(s, fixed) {
  const seen = ORES.filter(o => s.seen.includes(o.id) && !o.ingr), owned = TYPES.filter(t => s.molds[t.id] >= 1 && !t.gemReq && seen.some(o => oCat(o.id) === tCat(t.id)));
  const t = fixed?.t || pick(owned).id, pool = seen.filter(o => oCat(o.id) === tCat(t));
  const o = fixed?.ore || (Math.random() < .6 ? pool[pool.length - 1] : pick(pool)).id;   // prefere o melhor metal que você já tem
  const maxL = s.molds[t], lvl = fixed?.lvl || (maxL > 1 && Math.random() < .45 ? irand(2, maxL) : 1);
  const w = Math.random() * 100, r = fixed?.r || (w < 50 ? 'comum' : w < 80 ? 'incomum' : w < 95 ? 'raro' : 'epico');
  const reward = Math.round(valueOf(t, lvl, Array(usesOf(t, lvl)).fill(o), r) * 1.3), dur = rand(240, 420) * 1000 * COUNTERS[s.up.counter].dur, now = Date.now(), [e, npc] = pick(NPCS);
  return { id: now.toString(36) + Math.random().toString(36).slice(2, 5), e, npc, t, lvl, ore: o, r, reward, bonus: Math.round(reward * .5), t0: now, dl: now + dur, fast: now + dur * .4 };
}
// Peça do estoque que serve (puro do metal pedido; a de menor valor, para não gastar à toa uma melhor)
const fits = (it, o) => it.t === o.t && it.ores.every(x => x === o.ore) && it.lvl >= o.lvl && rIdx(it.r) >= rIdx(o.r);
const matchFor = o => S.stock.filter(it => fits(it, o)).sort((a, b) => itemValue(a) - itemValue(b))[0];

/* ======================= Estado salvo ======================= */
const KEY = 'piratinha-smithing';
function fresh() {
  const molds = Object.fromEntries(TYPES.map(t => [t.id, START_MOLDS.includes(t.id) ? 1 : 0]));
  const s = {
    v: 8, coins: 0, ores: { cobre: 5, bronze: 2 }, raw: {}, gems: {}, molds, msel: { ...molds }, stock: [], orders: [], nextOrder: 0, auction: [], claimed: [],
    seen: ['cobre', 'bronze'], up: { anvil: 1, hammer: 1, slots: 0, mine: 1, counter: 1, furnace: 1, alloys: 0, alloy: false, jewel: false, helper: false, supplier: false }, auto: false, autoBuy: {}, mineAt: 0, forestAt: 0,
    stats: { forged: 0, best: -1, orders: 0, auctions: 0, molds: 0, ups: 0, alloys: 0, jewels: 0, gemsSet: 0, mines: 0, smelted: 0, lost: 0, made: {}, staffs: 0, chops: 0, bows: 0, oreBought: 0, earned: 0, used: [] },
  };
  s.orders.push(genOrder(s, { t: 'gloves', ore: 'bronze', r: 'comum', lvl: 1 }));
  s.nextOrder = Date.now() + ORDER_EVERY;
  return s;
}
let S;
function load() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 8) return d; } catch {} return null; }
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
const SFX = {
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
$('#play').onclick = () => { show('game'); renderAll(); };

/* ======================= Arrastar ======================= */
/* sel.ores tem um espaço por lingote que o molde usa · sel.gems um espaço por gema · sel.re = id da peça sendo reforjada */
const sel = { t: null, ores: [null], gems: [], re: null };
let forging = null;
const curLvl = () => sel.t ? S.msel[sel.t] : 1;
const need = () => sel.t ? usesOf(sel.t, curLvl()) : 1;
const busy = () => forging || mine || fur || forest;

// Onde a peça foi solta: um espaço de minério, a bigorna, o leilão ou uma peça do estoque
function dropTarget(ev) {
  const el = document.elementFromPoint(ev.clientX, ev.clientY); if (!el) return null;
  const slot = el.closest('.slot.ore'); if (slot) return { zone: 'anvil', slot: +slot.dataset.i };
  const gsl = el.closest('.slot.gemslot'); if (gsl) return { zone: 'anvil', gslot: +gsl.dataset.i };
  if (el.closest('#anvil-area')) return { zone: 'anvil' };
  if (el.closest('#auction')) return { zone: 'auction' };
  const st = el.closest('.st-slot'); if (st) return { zone: 'stock', id: st.dataset.id };
  return null;
}
function draggable(el, img, onDrop, onClick) {
  el.addEventListener('pointerdown', e => {
    if (busy() || e.button !== 0 || e.target.closest('button')) return; e.preventDefault();
    const sx = e.clientX, sy = e.clientY; let ghost = null;
    const mark = t => { $('#anvil-area').classList.toggle('over', t?.zone === 'anvil'); $('#auction').classList.toggle('over', t?.zone === 'auction'); document.querySelectorAll('.slot.ore').forEach(s => s.classList.toggle('target', t?.slot === +s.dataset.i)); };
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
  if (!cats.includes(oc)) return nope({ wood: 'Arcos e cajados só usam madeira.', jewel: 'Anéis e amuletos só usam Prata ou Ouro.', mix: 'Pistolas usam metal comum no cano e madeira na coronha.' }[tCat(sel.t)] || (oc === 'wood' ? 'Madeira só serve para arcos, cajados e coronhas de pistola.' : `${ore(id).n} só serve para anéis e amuletos.`));
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
function placeMold(t) { if (sel.re) clearAnvil(); sel.t = t; fitOres(); leftTab = tCat(t) === 'wood' ? 'woods' : 'metals'; SFX.place(); renderSlots(); renderLists(); }
function placeGem(g, slot) {
  if (!sel.t) return nope('Coloque primeiro um molde na bigorna (ou arraste a gema para uma peça do estoque).');
  const i = slot != null && slot < sel.gems.length ? slot : sel.gems.indexOf(null);
  sel.gems[i < 0 ? sel.gems.length - 1 : i] = g; SFX.place(); renderSlots(); renderLists();
}
function placeReforge(id) { sel.re = id; sel.t = null; sel.ores = []; sel.gems = []; SFX.place(); renderSlots(); renderLists(); }
function clearAnvil() { sel.re = null; sel.t = null; sel.ores = [null]; sel.gems = []; }
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
let leftTab = 'metals';
document.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => { leftTab = b.dataset.tab; renderLists(); });
const woodUnlocked = () => TYPES.some(t => t.wood && S.molds[t.id] >= 1);
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
  const rawTotal = Object.values(S.raw).reduce((a, b) => a + b, 0), wOn = woodUnlocked(), gOn = gemsUnlocked(), grid = wOn || gOn;
  $('#raw-n').textContent = rawTotal ? '🔥' + rawTotal : '';
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
    c.innerHTML = `<img src="${ingotImg(o.id)}" alt=""><div><b>${o.n}</b><small>${o.wood ? `grau ${o.tier} · arcos e cajados` : o.ingr ? 'só para ligas' : `grau ${o.tier}${o.jewel ? ' · joias' : ''}`}</small></div><span class="qty">×${n}</span>`;
    draggable(c, () => ingotImg(o.id), t => { if (t?.zone === 'anvil') placeOre(o.id, t.slot); }, () => placeOre(o.id));
    ol.append(c);
  });
}
function renderGems(ol) {
  const gems = GEMS.filter(g => S.gems[g.id] > 0);
  if (gems.length) {

    gems.forEach(g => {
      const c = document.createElement('div'); c.className = 'card gem' + (sel.gems.includes(g.id) ? ' picked' : '');
      c.innerHTML = `<img src="${gemImg(g.id)}" alt=""><div><b>${g.n}</b><small>+${Math.round(g.b * 100)}% joias · +${Math.round(g.q * 100)}% sorte</small></div><span class="qty">×${S.gems[g.id]}</span>`;
      draggable(c, () => gemImg(g.id), t => { if (t?.zone === 'anvil') placeGem(g.id, t.gslot); else if (t?.zone === 'stock') embedGem(t.id, g.id); }, () => placeGem(g.id));
      ol.append(c);
    });
  }

}
// Forno (abaixo dos metais): minério bruto da mina e ligas liberadas
function renderFurnaceList(ol) {
    const raws = ORES.filter(o => S.raw[o.id] > 0), F = FURNACES[S.up.furnace];
    ol.insertAdjacentHTML('beforeend', `<div class="sec">🔥 Forno · ${F.n}</div>`);
    if (!raws.length) ol.insertAdjacentHTML('beforeend', '<div class="empty" style="padding:8px">Sem minério bruto. Desça na mina (botão no topo).</div>');
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
  // Reforja: a peça do estoque + 1 lingote do metal principal dela
  if (sel.re) {
    const it = S.stock.find(x => x.id === sel.re); if (!it) { clearAnvil(); return renderSlots(); }
    const o = it.ores[0], have = S.ores[o] || 0;
    os.innerHTML = `<div class="slot full ${have ? '' : 'no'}"><img src="${ingotImg(o)}" alt=""><span class="need ${have ? '' : 'no'}">1/${have}</span></div>`;
    st.className = `slot full b-${it.r}`; st.innerHTML = `<img src="${itemImg(it)}" alt="">`;
    $('#forge').disabled = !have; $('#forge').textContent = '🔨 Reforjar!';
    tip.innerHTML = `Reforjar <b>${esc(itemName(it))}</b> (<span class="r-${it.r}">${rar(it.r).n}</span>) · usa 1 de ${ore(o).n}<br>Se sair melhor, a raridade sobe. Se não, fica como está.` + (have ? '' : `<br><span class="no">Sem ${ore(o).n}</span>`);
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
      d.innerHTML = g ? `<img src="${gemImg(g)}" alt=""><span class="need ${(S.gems[g] || 0) >= need[g] ? '' : 'no'}">${need[g]}/${S.gems[g] || 0}</span>` : `<span>Gema<br>(${req && i === 0 ? 'obrigatória' : 'opcional'})</span>`;
      d.onclick = () => { if (!busy()) { sel.gems[i] = null; renderSlots(); renderLists(); } };
      gs.append(d);
    });
  }
  const gNeed = counts(sel.gems.filter(Boolean)), gShort = Object.entries(gNeed).filter(([g, q]) => (S.gems[g] || 0) < q);
  const gemOk = !gShort.length && !(sel.t && type(sel.t).gemReq && !sel.gems.some(Boolean));
  const full = sel.t && sel.ores.every(Boolean), ready = full && !short.length && gemOk;
  $('#forge').disabled = !ready;
  if (!full) tip.innerHTML = !sel.t ? 'Arraste um metal e um molde para a bigorna.<br>Peças do estoque podem ser arrastadas para cá (reforjar) ou para o leilão.'
    : type(sel.t).mixWood ? `A pistola usa ${n - type(sel.t).mixWood} metais comuns no cano e ${type(sel.t).mixWood} madeira na coronha.<br>Arraste o metal e a madeira para a bigorna.`
    : type(sel.t).wood ? `${type(sel.t).n} usa ${n} madeira${n > 1 ? 's' : ''}${type(sel.t).gemReq ? ' e pelo menos 1 gema (obrigatória)' : ''}.<br>Arraste a madeira${type(sel.t).gemReq ? ' e a gema' : ''} para a bigorna.`
    : `Este molde usa ${n} lingote${n > 1 ? 's' : ''}${tJ(sel.t) ? ' de Prata ou Ouro' : ''} (+ gema opcional).` + (S.up.alloy ? ' Com a forja composta, cada espaço aceita um metal diferente.' : '') + '<br>Arraste os metais para a bigorna.';
  else {
    const d = diffOf(sel.t, curLvl(), sel.ores), stars = clamp(Math.ceil(d / 2), 1, 5);
    const gl = sel.gems.filter(Boolean), use = Object.entries(c).map(([o, q]) => `${q} ${ore(o).n}`).join(' + ') + (gl.length ? ` + ${Object.entries(gNeed).map(([g, q]) => `${q} ${gemOf(g).n}`).join(' + ')} (+${Math.round(gemsQ(gl) * 100)}% de sorte)` : '');
    tip.innerHTML = `${esc(nameOf(sel.t, curLvl(), sel.ores, gl))} · usa ${use} · dificuldade <span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span>` +
      (short.length || !gemOk ? `<br><span class="no">Faltam ${[...short.map(([o, q]) => (q - (S.ores[o] || 0)) + ' ' + ore(o).n), gemOk ? '' : gShort.length ? gShort.map(([g, q]) => (q - (S.gems[g] || 0)) + ' ' + gemOf(g).n).join(', ') : '1 gema'].filter(Boolean).join(', ')}</span>` : '<br>Clique em Martelar (ou Enter)');
  }
}
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
  let t, lvl, ores, gems = [], re = null;
  if (sel.re) { re = S.stock.find(x => x.id === sel.re); if (!re) return; ({ t, lvl, ores } = re); S.ores[ores[0]]--; }
  else {
    t = sel.t; lvl = curLvl(); ores = [...sel.ores]; gems = sel.gems.filter(Boolean);
    Object.entries(counts(ores)).forEach(([o, q]) => S.ores[o] -= q); gems.forEach(g => S.gems[g]--);
  }
  save(); renderLists();
  const d = diffOf(t, lvl, ores);
  forging = {
    t, lvl, ores, gems, re: re?.id, n: Math.min(10, 3 + ores.length), q: gemsQ(re ? re.gems : gems),
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
  const v = $('#verdict'); v.textContent = g.n; v.style.color = g.c;
  SFX.hit(g.pts); swing(); impact(g.pts, f.ores[(f.hits.length - 1) % f.ores.length]);
  if (f.moving) { const h = f.zone / 2; f.zc = rand(h + .03, 1 - h - .03); $('#zone').style.left = f.zc * 100 + '%'; }
  if (f.hits.length >= f.n) { f.lock = true; setTimeout(finishForge, 450); }
}
function finishForge() {
  const f = forging, r = rollRarity(f.hits.reduce((a, b) => a + b, 0) / (4 * f.n), f.q);
  forging = null; hotIngot(false);
  $('#rhythm').hidden = true; $('#forge').hidden = false;
  SFX.done(); if (rIdx(r.id) >= 4) sparks(90, r.id === 'unico' ? '#ef4444' : '#fbbf24');
  if (f.re) {
    const it = S.stock.find(x => x.id === f.re);
    if (it && rIdx(r.id) > rIdx(it.r)) { it.r = r.id; toast(`<img src="${itemImg(it, 3)}"> Melhorou! Agora é <span class="r-${r.id}">${r.n}</span>`); }
    else toast(`Saiu <span class="r-${r.id}">${r.n}</span>, sem melhora. A peça ficou como estava.`);
  } else {
    const it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: f.t, lvl: f.lvl, ores: f.ores, r: r.id };
    if (f.gems.length) { it.gems = f.gems; S.stats.gemsSet += f.gems.length; }
    S.stock.unshift(it); S.stats.forged++;
    if (mixN(f.ores) > 0) S.stats.alloys++;
    if (f.t === 'pistol') S.stats.pistols = (S.stats.pistols || 0) + 1;
    if (tJ(f.t)) S.stats.jewels++;
    if (f.t === 'staff') S.stats.staffs++;
    if (f.t === 'bow') S.stats.bows++;
    toast(`<img src="${itemImg(it, 3)}"> ${esc(itemName(it))} · <span class="r-${r.id}">${r.n}</span> → estoque`);
    sel.gems = sel.gems.map(g => g && S.gems[g] > 0 ? g : null);
  }
  S.stats.best = Math.max(S.stats.best, rIdx(r.id));
  f.ores.forEach(o => { if (!S.stats.used.includes(o)) S.stats.used.push(o); });
  save(); renderStock(!f.re); renderSlots(); renderLists(); renderBottom();
}
// Material na bigorna: lingote em brasa para metais; tora (sem brasa) para madeira
function hotIngot(on, o) {
  let h = $('#hot');
  if (!on) return h && h.remove();
  if (!h) { h = new Image(); h.id = 'hot'; $('#anvil-wrap').append(h); }
  const wood = o && ore(o).wood;
  h.src = wood ? sprite('log', ore(o).sh, 4) : sprite('ingot', ['#fff3c4', '#ffb347', '#e0571b'], 4);
  h.style.cssText = `position:absolute;width:64px;left:72px;top:16px;z-index:1;${wood ? '' : 'filter:drop-shadow(0 0 10px #ff8a3d)'}`;
}
function swing() { const h = $('#hammer'); h.classList.add('hit'); setTimeout(() => h.classList.remove('hit'), 110); }
/* Impacto do martelo: o lingote amassa, um anel de luz se espalha e saem lascas do metal + faíscas */
function impact(pts, o) {
  const h = $('#hot'); if (h) { h.classList.remove('squash'); void h.offsetWidth; h.classList.add('squash'); }
  const wood = ore(o).wood;
  if (pts && !wood) { const fl = document.createElement('div'); fl.className = 'flash'; fl.style.left = '104px'; fl.style.top = '52px'; $('#anvil-wrap').append(fl); setTimeout(() => fl.remove(), 320); }
  const sh = ore(o).sh;
  chips(4 + pts * 5, [sh[0], sh[1], sh[2], '#ffb347']);
  if (!wood) sparks([3, 8, 18, 30, 45][pts], ore(o).spark);
}

/* Partículas da bigorna (faíscas pequenas e lascas maiores) */
const sc = $('#sparks'), sg = sc.getContext('2d'); let parts = [], sparking = false;
const IMPACT = [144, 102];
function emit(n, make) { for (let i = 0; i < n; i++) parts.push(make()); if (sparking) return; sparking = true; let last = performance.now();
  requestAnimationFrame(function f(t) {
    const dt = (t - last) / 1000; last = t; sg.clearRect(0, 0, sc.width, sc.height);
    parts = parts.filter(p => (p.l -= dt) > 0);
    parts.forEach(p => { p.vy += p.gr * dt; p.x += p.vx * dt; p.y += p.vy * dt; sg.fillStyle = p.c; sg.globalAlpha = Math.min(1, p.l * 2); sg.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
    sg.globalAlpha = 1;
    if (parts.length) requestAnimationFrame(f); else sparking = false;
  });
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
    const s = document.createElement('div'); s.className = `st-slot b-${it.r}` + (fresh && i === 0 ? ' new' : ''); s.dataset.id = it.id;
    s.innerHTML = `<img src="${itemImg(it)}" alt="">`;
    s.onmouseenter = e => tip(e, `<b>${esc(itemName(it))}</b><br><span class="r-${it.r}">${rar(it.r).n}</span> · valor ${itemValue(it)}<br><small>Arraste para o leilão ou para a bigorna (reforjar)${(it.gems || []).length < gemSlots(it.t, it.lvl) ? `<br>Arraste uma gema até aqui para encravar (${(it.gems || []).length}/${gemSlots(it.t, it.lvl)})` : ''}</small>`);
    s.onmousemove = e => tip(e); s.onmouseleave = () => $('#tooltip').hidden = true;
    draggable(s, () => itemImg(it), t => { if (t?.zone === 'auction') listAuction(it.id); else if (t?.zone === 'anvil') placeReforge(it.id); });
    b.append(s);
  });
}
function tip(e, html) { const t = $('#tooltip'); if (html) t.innerHTML = html; t.hidden = false; t.style.left = e.clientX + 14 + 'px'; t.style.top = e.clientY + 14 + 'px'; }
$('#auto').onclick = () => { if (!S.up.helper) return nope('Contrate o Ajudante de ferreiro na loja de melhorias para vender sozinho.'); S.auto = !S.auto; save(); renderStock(); toast(S.auto ? `💰 Venda automática ligada (${AUTO_SELL * 100}% do valor)` : 'Venda automática desligada'); };
// A venda automática não mexe em peças Lendárias/Únicas, nas que servem para encomendas abertas nem na que está na bigorna
const reserved = it => rIdx(it.r) >= 4 || S.orders.some(o => fits(it, o)) || it.id === sel.re;

/* ======================= Moedas ======================= */
const coinImg = sprite('coin', [], 3);
$('#coin-img').src = coinImg;
$('#cheat').onclick = () => { S.coins += 10000; save(); SFX.coin(); floatCoins(10000); renderAll(); if (modal) renderModal(); };
function renderCoins() { $('#coin-n').textContent = S.coins; }
function floatCoins(n) {
  const c = $('#coins'); renderCoins(); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  const r = c.getBoundingClientRect(), f = document.createElement('div'); f.className = 'float' + (n < 0 ? ' neg' : ''); f.textContent = (n > 0 ? '+' : '') + n;
  f.style.left = r.right + 6 + 'px'; f.style.top = r.top + 'px'; document.body.append(f); setTimeout(() => f.remove(), 900);
}
function earn(n) { S.coins += n; S.stats.earned += n; save(); SFX.coin(); floatCoins(n); }
function spend(n) { if (S.coins < n) { SFX.no(); return false; } S.coins -= n; save(); SFX.buy(); floatCoins(-n); return true; }

/* ======================= Encomendas ======================= */
function deliver(id) {
  const o = S.orders.find(x => x.id === id), it = o && matchFor(o); if (!it) return;
  const fast = Date.now() <= o.fast, pay = o.reward + (fast ? o.bonus : 0);
  S.stock = S.stock.filter(x => x !== it); S.orders = S.orders.filter(x => x !== o); S.stats.orders++;
  if (sel.re === it.id) clearAnvil();
  earn(pay); toast(`${o.e} ${esc(o.npc)} recebeu ${esc(itemName(it))}${fast ? ' · ⚡ bônus de entrega rápida!' : ''}`);
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
  const now = Date.now(), dur = rand(120, 300) * 1000;
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
   mais comum nos níveis abaixo dele. */
let mine = null;
const mcv = $('#mine-cv'), mg = mcv.getContext('2d');
function rockTexture(lv) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 340; const g = c.getContext('2d');
  const base = ['#2a2320', '#262230', '#1d2330', '#2a1414'][lv - 1];
  g.fillStyle = base; g.fillRect(0, 0, 640, 340);
  for (let i = 0; i < 900; i++) { const s = pick([4, 4, 8, 12]); g.fillStyle = pick(['#00000033', '#ffffff0d', '#00000022', '#ffffff08']); g.fillRect((Math.random() * 160 | 0) * 4, (Math.random() * 85 | 0) * 4, s, s); }
  g.fillStyle = '#0006'; for (let i = 0; i < 6; i++) { let x = Math.random() * 640, y = Math.random() * 340; for (let k = 0; k < 30; k++) { g.fillRect(x | 0, y | 0, 4, 4); x += rand(-4, 8); y += rand(-4, 4); } }
  return c;
}
function mineReady() { return Date.now() >= S.mineAt; }
$('#mine-btn').onclick = () => {
  if (busy() || !$('#modal').hidden) return;
  if (!mineReady()) return nope(`A mina está se recuperando. Volte em ${mmss(S.mineAt - Date.now())}.`);
  startMine();
};
function startMine() {
  const lv = S.up.mine, M = MINES[lv];
  const ores = minable(lv), gems = GEMS.filter(g => g.mine <= lv);
  const pickI = new Image(); pickI.src = pickImg(lv, 4);
  mine = { lv, M, ores, gems, pickI, swings: [], bg: rockTexture(lv), targets: [], spawned: 0, t0: performance.now(), next: .6, loot: { ores: {}, gems: {} }, fx: [], parts: [], hits: [0, 0, 0, 0], over: false };
  $('#mine-title').textContent = '⛏ ' + M.n; $('#mine-result').hidden = true; $('#mine').hidden = false;
  requestAnimationFrame(mineLoop);
}
function mineLoop(now) {
  const m = mine; if (!m || m.over) return;
  const t = (now - m.t0) / 1000;
  if (m.spawned < m.M.targets && t >= m.next) {
    let x, y, ok = false;
    for (let k = 0; k < 15 && !ok; k++) { x = rand(50, 590); y = rand(50, 290); ok = m.targets.every(o => Math.hypot(o.x - x, o.y - y) > 90); }
    const gem = m.gems.length && Math.random() < GEM_CHANCE;
    m.targets.push({ x, y, born: t, gem, id: gem ? wpick(m.gems, g => gemWeight(g, m.lv)).id : wpick(m.ores, o => mineWeight(o, m.lv)).id });
    m.spawned++; m.next = t + m.M.every * rand(.85, 1.15);
  }
  m.targets = m.targets.filter(o => { if (t - o.born > m.M.T + .3) { mineFx(o.x, o.y, 'Perdeu', '#a8a29e'); m.hits[0]++; return false; } return true; });
  // desenho
  mg.drawImage(m.bg, 0, 0);
  m.targets.forEach(o => {
    const age = t - o.born, p = clamp(age / m.M.T, 0, 1), R = 24;
    mg.fillStyle = '#57534e'; mg.beginPath(); mg.arc(o.x, o.y, R, 0, 7); mg.fill();
    mg.fillStyle = '#3f3a36'; mg.beginPath(); mg.arc(o.x + 4, o.y + 5, R - 6, 0, 7); mg.fill();
    if (o.gem) mg.drawImage(m.img?.[o.id] || (m.img = { ...m.img, [o.id]: Object.assign(new Image(), { src: gemImg(o.id, 4) }) })[o.id], o.x - 16, o.y - 14);
    else { const sh = ore(o.id).sh; [[-10, -8, 0], [4, -12, 1], [-4, 4, 1], [8, 2, 2], [-14, 6, 2]].forEach(([dx, dy, k]) => { mg.fillStyle = sh[k]; mg.fillRect(o.x + dx, o.y + dy, 8, 8); }); }
    const rr = age < m.M.T ? R + 70 * (1 - p) : R;
    mg.strokeStyle = age < m.M.T ? `rgba(255,255,255,${.35 + .65 * p})` : '#ef4444'; mg.lineWidth = 3; mg.beginPath(); mg.arc(o.x, o.y, rr, 0, 7); mg.stroke();
  });
  // Picareta: golpeia o veio (gira de trás para a frente em 0,22 s)
  m.swings = m.swings.filter(w => (w.l -= 1 / 60) > 0);
  m.swings.forEach(w => { const k = 1 - w.l / .22; mg.save(); mg.translate(w.x, w.y); mg.rotate(-1.5 + k * 2.1); mg.drawImage(m.pickI, -18, -46); mg.restore(); });
  m.parts = m.parts.filter(p => (p.l -= 1 / 60) > 0); m.parts.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; mg.fillStyle = p.c; mg.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
  m.fx = m.fx.filter(f => (f.l -= 1 / 60) > 0); m.fx.forEach(f => { mg.globalAlpha = Math.min(1, f.l * 2); mg.fillStyle = f.c; mg.font = 'bold 16px monospace'; mg.textAlign = 'center'; mg.fillText(f.txt, f.x, f.y - (1 - f.l) * 30); mg.globalAlpha = 1; });
  const got = Object.values(m.loot.ores).reduce((a, b) => a + b, 0) + Object.values(m.loot.gems).reduce((a, b) => a + b, 0);
  $('#mine-hud').textContent = `Veios ${m.spawned}/${m.M.targets} · Perfeitos ${m.hits[3]} · Coletado ${got}`;
  if (m.spawned >= m.M.targets && !m.targets.length && !m.fx.length) return endMine();
  requestAnimationFrame(mineLoop);
}
function mineFx(x, y, txt, c) { mine.fx.push({ x, y, txt, c, l: .8 }); }
mcv.addEventListener('pointerdown', e => {
  const m = mine; if (!m || m.over) return;
  const r = mcv.getBoundingClientRect(), x = (e.clientX - r.left) * mcv.width / r.width, y = (e.clientY - r.top) * mcv.height / r.height;
  const o = m.targets.find(o => Math.hypot(o.x - x, o.y - y) <= 32); if (!o) return;
  const t = (performance.now() - m.t0) / 1000, err = t - o.born - m.M.T, a = Math.abs(err);
  const g = a <= .07 ? 3 : a <= .16 ? 2 : a <= .28 ? 1 : 0;
  m.targets = m.targets.filter(x => x !== o); m.hits[g]++; SFX.pick(g); m.swings.push({ x: o.x + 14, y: o.y + 18, l: .22 });
  const label = ['Cedo!', 'Ok', 'Bom', 'Perfeito!'][g], col = ['#a8a29e', '#ff8a3d', '#fbbf24', '#fff7d6'][g];
  const colors = o.gem ? gemOf(o.id).sh : ore(o.id).sh;
  for (let i = 0; i < 6 + g * 5; i++) m.parts.push({ x: o.x, y: o.y, vx: rand(-4, 4), vy: rand(-6, -1), l: rand(.4, .8), c: pick([...colors, '#57534e', '#78716c']), s: pick([3, 4, 6]) });
  if (o.gem) { if (g >= 2) { m.loot.gems[o.id] = (m.loot.gems[o.id] || 0) + 1; mineFx(o.x, o.y, `${label} +1 ${gemOf(o.id).n}`, col); } else mineFx(o.x, o.y, label + ' (a gema rachou)', col); }
  else { const y = MINE_YIELD[g], q = y < 1 ? (Math.random() < y ? 1 : 0) : y; if (q) m.loot.ores[o.id] = (m.loot.ores[o.id] || 0) + q; mineFx(o.x, o.y, q ? `${label} +${q} ${ore(o.id).n}` : label, col); }
});
function endMine() {
  const m = mine; if (!m || m.over) return; m.over = true;
  const list = [...Object.entries(m.loot.ores).map(([k, q]) => `<span><img src="${rawImg(k, 3)}" alt="">${q} minério de ${ore(k).n}</span>`), ...Object.entries(m.loot.gems).map(([k, q]) => `<span><img src="${gemImg(k, 3)}" alt="">${q} ${gemOf(k).n}</span>`)];
  const r = $('#mine-result'); r.hidden = false;
  r.innerHTML = `<h2>Fim da descida</h2><div class="sub">Perfeitos ${m.hits[3]} · Bons ${m.hits[2]} · Ok ${m.hits[1]} · Perdidos ${m.hits[0]}</div><div class="loot">${list.join('') || '<span>Nada desta vez…</span>'}</div><button class="btn big">Coletar</button><small class="sub">O minério vai para a aba Forno. A mina reabre em ${mmss(MINE_CD)}.</small>`;
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
  b.classList.toggle('ready', ready); b.title = MINES[S.up.mine].n; b.textContent = ready ? '⛏ Mina!' : `⛏ ${mmss(S.mineAt - Date.now())}`;
}

/* ======================= Floresta =======================
   Abre com o molde de Arco ou de Cajado. Cada árvore sorteada tem uma dificuldade (o grau da madeira).
   Teste de força: segure o clique e a carga do machado sobe da esquerda para a direita aos trancos;
   se chegar ao fim, ela despenca e recomeça. Solte com a carga dentro da faixa da árvore. */
let forest = null;
const tcv = $('#for-cv'), tg = tcv.getContext('2d');
const treeStars = o => clamp(Math.ceil(o.tier / 2), 1, 5);
const forestReady = () => Date.now() >= S.forestAt;
$('#forest-btn').onclick = () => {
  if (busy() || !$('#modal').hidden) return;
  if (!forestReady()) return nope(`A floresta está rebrotando. Volte em ${mmss(S.forestAt - Date.now())}.`);
  startForest();
};
function newTree() {
  const o = wpick(ORES.filter(x => x.wood), x => x.fw), zw = clamp(.3 - o.tier * .022, .08, .3);
  return { o, zw, zc: clamp(.42 + o.tier * .05 + rand(-.08, .08), zw / 2 + .2, 1 - zw / 2 - .02), sp: .8 + o.tier * .12, chop: 0 };
}
function startForest() {
  const axe = new Image(); axe.src = sprite('axe2', ANVILS[S.up.anvil].sh, 4);
  forest = { axe, n: 0, tree: newTree(), c: 0, hold: false, drop: false, t0: performance.now(), last: performance.now(), ph: Math.random() * 9, loot: {}, fx: [], parts: [], swing: 0, wait: 0, hits: [0, 0, 0, 0], over: false };
  $('#for-result').hidden = true; $('#forest').hidden = false; requestAnimationFrame(forestLoop);
}
function forestLoop(now) {
  const f = forest; if (!f || f.over) return;
  const dt = Math.min(.05, (now - f.last) / 1000), t = (now - f.t0) / 1000; f.last = now;
  const tr = f.tree;
  // carga: sobe com velocidade irregular enquanto segura; ao encher, despenca rápido; solto, esvazia
  if (f.wait > 0) f.wait -= dt;
  else if (f.hold) {
    if (f.drop) { f.c -= 3.2 * dt; if (f.c <= 0) { f.c = 0; f.drop = false; } }
    else {
      const jolt = .35 + 1.5 * (.5 + .5 * Math.sin(t * 7.3 + f.ph)) * (.5 + .5 * Math.sin(t * 3.1 + f.ph * 2));
      f.c += tr.sp * jolt * dt; if (f.c >= 1) { f.c = 1; f.drop = true; }
    }
  } else f.c = Math.max(0, f.c - 2.5 * dt);
  // desenho
  tg.fillStyle = '#16301f'; tg.fillRect(0, 0, 640, 340);
  for (let i = 0; i < 14; i++) { tg.fillStyle = i % 2 ? '#1c3a26' : '#14281b'; tg.fillRect((i * 53 + 20) % 640, 40 + (i * 37) % 120, 30, 200); }
  tg.fillStyle = '#2d4a1f'; tg.fillRect(0, 250, 640, 90); tg.fillStyle = '#3f6a2a'; for (let x = 0; x < 640; x += 8) tg.fillRect(x, 248 + (x * 7) % 6, 4, 4);
  const sh = tr.o.sh, X = 320, shake = f.swing > 0 ? Math.sin(f.swing * 60) * 3 : 0;
  tg.fillStyle = sh[2]; tg.fillRect(X - 22 + shake, 120, 44, 132); tg.fillStyle = sh[1]; tg.fillRect(X - 16 + shake, 120, 26, 132); tg.fillStyle = sh[0]; tg.fillRect(X - 12 + shake, 120, 6, 132);
  if (tr.chop) { tg.fillStyle = '#f3d9a4'; tg.fillRect(X + 8, 200, 16, 14); }
  const leaf = tr.o.id === 'sandalo' ? ['#7f1d1d', '#b91c1c', '#ef4444'] : tr.o.id === 'ebano' ? ['#1e293b', '#334155', '#475569'] : ['#14532d', '#166534', '#22c55e'];
  [[0, 70, 70], [-50, 100, 50], [50, 100, 50], [-25, 50, 45], [25, 50, 45]].forEach(([dx, dy, r], k) => { tg.fillStyle = leaf[k % 3]; tg.beginPath(); tg.arc(X + dx + shake, dy, r, 0, 7); tg.fill(); });
  tg.fillStyle = '#fff'; tg.font = 'bold 15px monospace'; tg.textAlign = 'center';
  tg.fillText(`${tr.o.n}  ${'★'.repeat(treeStars(tr.o))}${'☆'.repeat(5 - treeStars(tr.o))}`, X, 24);
  // machado: golpe ao soltar
  if (f.swing > 0) { f.swing -= dt; const k = 1 - f.swing / .25; tg.save(); tg.translate(X + 60, 230); tg.rotate(-1.6 + k * 1.9); tg.drawImage(f.axe, -20, -50); tg.restore(); }
  f.parts = f.parts.filter(p => (p.l -= dt) > 0); f.parts.forEach(p => { p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; tg.fillStyle = p.c; tg.fillRect(p.x | 0, p.y | 0, p.s, p.s); });
  f.fx = f.fx.filter(x => (x.l -= dt) > 0); f.fx.forEach(x => { tg.globalAlpha = Math.min(1, x.l * 2); tg.fillStyle = x.c; tg.font = 'bold 16px monospace'; tg.fillText(x.txt, X, 110 - (1 - x.l) * 30); tg.globalAlpha = 1; });
  // barra de força: começa na esquerda; faixa de acerto da árvore
  const BX = 60, BW = 520, BY = 284;
  tg.fillStyle = '#0c0907'; tg.fillRect(BX - 3, BY - 3, BW + 6, 30);
  tg.fillStyle = '#4ade8055'; tg.fillRect(BX + (tr.zc - tr.zw / 2) * BW, BY, tr.zw * BW, 24);
  tg.fillStyle = '#fbbf24aa'; tg.fillRect(BX + (tr.zc - tr.zw / 8) * BW, BY, tr.zw / 4 * BW, 24);
  const grd = tg.createLinearGradient(BX, 0, BX + BW, 0); grd.addColorStop(0, '#16a34a'); grd.addColorStop(.6, '#f59e0b'); grd.addColorStop(1, '#dc2626');
  tg.globalAlpha = .85; tg.fillStyle = grd; tg.fillRect(BX, BY + 6, f.c * BW, 12); tg.globalAlpha = 1;
  tg.fillStyle = '#ef4444'; tg.fillRect(BX + f.c * BW - 2, BY - 4, 4, 32);
  $('#for-hud').textContent = `Árvore ${Math.min(f.n + 1, FOREST_TREES)}/${FOREST_TREES} · Perfeitos ${f.hits[3]} · ${f.hold ? 'carregando…' : 'segure o clique (ou Espaço)'}`;
  if (f.n >= FOREST_TREES && f.wait <= 0 && !f.fx.length) return endForest();
  requestAnimationFrame(forestLoop);
}
function chop() {
  const f = forest; if (!f || f.over || f.wait > 0 || f.n >= FOREST_TREES) return;
  const tr = f.tree, d = Math.abs(f.c - tr.zc) / (tr.zw / 2), g = f.c < .03 ? -1 : d <= .25 ? 3 : d <= .6 ? 2 : d <= 1 ? 1 : 0;
  if (g < 0) return;
  f.hits[g]++; f.swing = .25; tr.chop = 1; SFX.pick(g);
  const y = FOREST_YIELD[g], q = y < 1 ? (Math.random() < y ? 1 : 0) : y;
  if (q) f.loot[tr.o.id] = (f.loot[tr.o.id] || 0) + q;
  f.fx.push({ txt: q ? `${['Errou!', 'Ok', 'Bom', 'Perfeito!'][g]} +${q} ${tr.o.n}` : ['Errou!', 'Ok', 'Bom', 'Perfeito!'][g], c: ['#a8a29e', '#ff8a3d', '#fbbf24', '#fff7d6'][g], l: .8 });
  for (let i = 0; i < 6 + g * 6; i++) f.parts.push({ x: 330, y: 205, vx: rand(-60, 220), vy: rand(-260, -60), l: rand(.4, .9), c: pick([...tr.o.sh, '#f3d9a4']), s: pick([3, 4, 6]) });
  f.n++; f.c = 0; f.drop = false; f.hold = false; f.wait = .7;
  if (f.n < FOREST_TREES) setTimeout(() => { if (forest === f) f.tree = newTree(); }, 600);
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
  const b = $('#forest-btn'), on = woodUnlocked(), ready = forestReady();
  b.hidden = !on; if (!on) return;
  b.classList.toggle('ready', ready); b.textContent = ready ? '🌲 Floresta!' : `🌲 ${mmss(S.forestAt - Date.now())}`;
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
  const img = new Image(); img.src = alloy ? ingotImg(id, 5) : rawImg(id, 5);
  fur = { id, o: ore(id), alloy, n: 10, stage: 'setup', img, T: .15, parts: [] };
  if (!furMax(fur)) { fur = null; return; }
  $('#fur-title').textContent = alloy ? `⚗ ${alloy.n} · ${ore(id).n}` : `🔥 ${FURNACES[S.up.furnace].n} · minério de ${ore(id).n}`; $('#fur-hud').textContent = '';
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
  if (f.img.complete) fg.drawImage(f.img, 290, 92);
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
  // Compra automática: repõe até o mínimo escolhido, com o dinheiro que tiver
  if (S.up.supplier && on && ++buyT >= AUTOBUY_EVERY) {
    buyT = 0; const bought = [];
    Object.entries(S.autoBuy).forEach(([id, min]) => {
      const o = ore(id), have = S.ores[id] || 0; if (!shopOpen(o) || !min || have >= min) return;
      const q = Math.min(min - have, Math.floor(S.coins / o.buy)); if (q <= 0) return;
      S.coins -= q * o.buy; S.ores[id] = have + q; S.stats.oreBought += q; see(id); bought.push(`+${q} ${o.n}`);
    });
    if (bought.length) { changed = true; renderCoins(); renderLists(); renderSlots(); toast('🛒 Compra automática: ' + bought.join(', ')); }
  }
  if (changed) { save(); renderStock(); renderBottom(); if (modal && modal.kind !== 'counter' && modal.kind !== 'ency') renderModal(); }
  if (modal?.kind === 'counter') { if (changed || !S.orders.length) renderModal(); else updateTimers(); }
  if (modal?.kind === 'auction') updateTimers();
  renderMineBtn(); renderForestBtn();
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
  $('#counter').className = 'cl-' + S.up.counter;
  $('#counter-alert').hidden = !S.orders.some(matchFor);
  const ready = MISSIONS.filter(m => !S.claimed.includes(m.id) && missionDone(m)).length;
  $('#missions-alert').hidden = !ready; $('#missions-alert').textContent = ready;
  $('#auction').classList.toggle('locked', !S.up.slots);
  $('#auction-slots').innerHTML = !S.up.slots ? '<div class="lockmsg" style="border:0;width:auto">🔒 abra na loja de melhorias</div>' : Array.from({ length: S.up.slots }, (_, i) => { const a = S.auction[i]; return a ? `<div class="on b-${a.it.r}"><img src="${itemImg(a.it)}" alt=""></div>` : '<div></div>'; }).join('');
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
    const woodShop = modal.tab === 'woods';
    $('#m-title').textContent = woodShop ? 'Loja de madeiras' : 'Loja de metais';
    body.insertAdjacentHTML('beforeend', '<p class="sub" style="margin:0;font-size:12px">' + (woodShop ? 'Madeira pronta, mas cara. A floresta dá madeira de graça.' : 'Lingotes prontos, mas caros. O minério da mina sai de graça, só precisa passar pela fornalha.') + '' + (S.up.supplier ? '<br>Fornecedor: escolha um mínimo e, a cada 30 s, ele repõe até lá com o dinheiro que você tiver (0 = desligado).' : '<br>Contrate o Fornecedor (loja de melhorias) para compras automáticas.') + '</p>');
    ORES.filter(o => !!o.wood === woodShop).forEach(o => {
      if (o.shop && !shopOpen(o)) return row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· grau ${o.tier}</small><br><small>Libera quando você tiver a ${MINES[o.mine].n} (nível ${o.mine})</small></span><span class="pr" style="color:var(--dim)">🔒</span>`, 'lock');
      if (!o.shop) return row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· grau ${o.tier}</small><br><small>${o.alloy ? `Só por liga na fornalha (${inpText(ALLOYS.find(a => a.id === o.id))})` : o.wood ? 'Só na floresta' : `Só na mina (nível ${o.mine}: ${MINES[o.mine].n})`} · você tem ${S.ores[o.id] || 0}</small></span><span class="pr" style="color:var(--dim)">${o.alloy ? '⚗' : o.wood ? '🌲' : '⛏'}</span>`, 'lock');
      const r = row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm">${o.n} <small>· ${o.wood ? `madeira grau ${o.tier}` : o.ingr ? 'só para ligas' : `grau ${o.tier}${o.jewel ? ' · só joias' : ''}`}</small><br><small>Você tem ${S.ores[o.id] || 0}</small></span>${coinTag(o.buy)}<span class="acts"><button class="btn small" data-k="1">+1</button><button class="btn small" data-k="5">+5</button></span>${S.up.supplier ? `<input type="number" min="0" max="99" value="${S.autoBuy[o.id] || 0}" title="Mínimo para a compra automática">` : ''}`);
      r.querySelectorAll('button').forEach(b => { const q = +b.dataset.k; b.disabled = S.coins < o.buy * q; b.onclick = () => {
        if (!spend(o.buy * q)) return; S.ores[o.id] = (S.ores[o.id] || 0) + q; S.stats.oreBought += q; see(o.id); afterBuy();
      }; });
      const inp = r.querySelector('input'); if (!inp) return; inp.onkeydown = e => e.stopPropagation();
      inp.onchange = () => { const v = clamp(Math.round(+inp.value || 0), 0, 99); inp.value = v; if (v) S.autoBuy[o.id] = v; else delete S.autoBuy[o.id]; save(); toast(v ? `🛒 Manter pelo menos ${v} de ${o.n}` : `Compra automática de ${o.n} desligada`); };
    });
  }

  else if (k === 'molds') {
    $('#m-title').textContent = 'Loja de moldes';
    body.insertAdjacentHTML('beforeend', '<p class="sub" style="margin:0;font-size:12px">Compra única: o molde fica seu para sempre. Níveis maiores usam mais material, são mais difíceis e valem muito mais.</p>');
    GROUPS.forEach(([g, gn]) => TYPES.filter(T => T.grp === g).forEach((T, i) => {
      if (!i) sec(gn);
      const nx = S.molds[T.id] + 1;
      if (T.unlock && !S.molds[T.id]) return buyRow(moldImg(T.id, 1), `Molde de ${T.n}`, `Libere na loja de melhorias (${T.wood ? 'Oficina' : T.mixWood ? 'Arcabuzaria' : 'Armaria'})`, false);
      if (nx > MAXLV) return buyRow(moldImg(T.id, MAXLV), `${T.n} ${LEVELS[MAXLV].n}`, 'Nível máximo', null);
      if (T.jewel && !S.up.jewel) return buyRow(moldImg(T.id, 1), `Molde de ${T.n}`, 'Requer a técnica Joalheria (loja de melhorias)', false);
      buyRow(moldImg(T.id, nx), `Molde de ${T.n} · ${LEVELS[nx].n}`, `${nx === 1 ? 'novo tipo de peça' : 'nível ' + nx} · usa ${usesOf(T.id, nx)} lingotes${T.jewel ? ' de Prata/Ouro' : ''} · valor ×${LEVELS[nx].m}`, moldPrice(T.id, nx), () => {
        S.molds[T.id] = nx; S.msel[T.id] = nx; S.stats.molds++; toast(`<img src="${moldImg(T.id, nx, 3)}"> Molde de ${T.n} ${LEVELS[nx].n} comprado!`); if (sel.t === T.id) fitOres(); afterBuy();
      });
    }));
  }

  else if (k === 'upgrades') {
    $('#m-title').textContent = 'Loja de melhorias';
    const ua = S.up.anvil + 1, uh = S.up.hammer + 1, us = S.up.slots + 1, um = S.up.mine + 1;
    sec('Ferramentas');
    if (ANVILS[ua]) buyRow(anvilImg(ua, 2), ANVILS[ua].n, `zona de acerto ${pct(ANVILS[ua].b)} maior (agora: ${pct(ANVILS[S.up.anvil].b)})`, ANVILS[ua].price, () => { S.up.anvil = ua; S.stats.ups++; toast(ANVILS[ua].n + ' instalada!'); afterBuy(); });
    else buyRow(anvilImg(S.up.anvil, 2), ANVILS[S.up.anvil].n, 'Nível máximo', null);
    if (HAMMERS[uh]) buyRow(hammerImg(uh, 2), HAMMERS[uh].n, `cursor ${pct(HAMMERS[uh].b)} mais lento (agora: ${pct(HAMMERS[S.up.hammer].b)})`, HAMMERS[uh].price, () => { S.up.hammer = uh; S.stats.ups++; toast(HAMMERS[uh].n + ' na mão!'); afterBuy(); });
    else buyRow(hammerImg(S.up.hammer, 2), HAMMERS[S.up.hammer].n, 'Nível máximo', null);
    sec('Mina');
    if (MINES[um]) {
      const nw = [...ORES.filter(o => o.mine === um).map(o => o.n), ...GEMS.filter(g => g.mine === um).map(g => g.n)];
      buyRow(pickImg(um, 3), MINES[um].n, `nível ${um} · novos: ${nw.join(', ')} · ${MINES[um].targets} veios por descida`, MINES[um].price, () => { S.up.mine = um; S.stats.ups++; toast(`⛏ ${MINES[um].n} liberada!`); afterBuy(); });
    } else buyRow(pickImg(S.up.mine, 3), MINES[S.up.mine].n, 'Nível máximo', null);
    sec('Fornalha e ligas');
    const uf = S.up.furnace + 1, F0 = FURNACES[S.up.furnace];
    const furTxt = F => `derrete até ${ORES.filter(o => o.smelt && FURNACES.indexOf(F) >= o.smelt).map(o => o.n).join(', ')}${F.steel ? ` · ferro → aço ${pct(F.steel)}` : ''}${F.arcane ? ` · mithril → adamantita/oricalco ${pct(F.arcane)}` : ''} (em fundição perfeita)`;
    if (FURNACES[uf]) buyRow('🔥', FURNACES[uf].n, furTxt(FURNACES[uf]), FURNACES[uf].price, () => { S.up.furnace = uf; S.stats.ups++; toast(`🔥 ${FURNACES[uf].n} aceso!`); afterBuy(); });
    else buyRow('🔥', F0.n, 'Nível máximo', null);
    const na = ALLOYS[S.up.alloys];
    if (na) buyRow(ingotImg(na.id), `${na.n} → ${ore(na.id).n}`, `${inpText(na)} na fornalha · exige ${FURNACES[na.fur].n}${S.up.alloys === 0 ? ' · tutorial de ligas' : ''}`, na.price, () => { S.up.alloys++; S.stats.ups++; toast(`⚗ ${na.n} aprendida! Veja a aba Forno.`); afterBuy(); });
    else buyRow(ingotImg('astralita'), 'Todas as ligas', 'Bronze, Aço, Adamantita, Oricalco e Astralita', null);
    sec('Comércio');
    const uc = S.up.counter + 1, C0 = COUNTERS[S.up.counter];
    if (COUNTERS[uc]) buyRow('📜', COUNTERS[uc].n, `até ${COUNTERS[uc].max} encomendas e prazo ×${COUNTERS[uc].dur} (agora: ${C0.max}, ×${C0.dur})`, COUNTERS[uc].price, () => { S.up.counter = uc; S.stats.ups++; toast(`📜 ${COUNTERS[uc].n}!`); afterBuy(); });
    else buyRow('📜', C0.n, 'Nível máximo', null);
    const slotIc = sprite('coin', [], 4);
    if (SLOT_PRICES[us] != null) buyRow(slotIc, us === 1 ? 'Abrir o leilão' : `Espaço de leilão ${us}`, us === 1 ? 'libera o leilão com 1 espaço (arraste peças do estoque para vender pelo seu preço)' : `vende ${us} peças ao mesmo tempo (agora: ${S.up.slots})`, SLOT_PRICES[us], () => { S.up.slots = us; S.stats.ups++; toast(us === 1 ? '🔨 Leilão aberto!' : `Leilão agora tem ${us} espaços!`); afterBuy(); });
    else buyRow(slotIc, `Leilão com ${S.up.slots} espaços`, 'Nível máximo', null);
    sec('Ajudantes');
    buyRow('🧑‍🏭', 'Ajudante de ferreiro', S.up.helper ? 'Venda automática liberada (botão 💰 ao lado do estoque).' : `vende sozinho as peças do estoque por ${pct(AUTO_SELL)} do valor (botão 💰)`, S.up.helper ? null : HELPER_PRICE, () => { S.up.helper = true; S.stats.ups++; toast('🧑‍🏭 Ajudante contratado! Ligue o 💰 ao lado do estoque.'); afterBuy(); });
    buyRow('🛒', 'Fornecedor', S.up.supplier ? 'Compra automática liberada (mínimos na loja de metais).' : `repõe metais e madeiras até um mínimo a cada ${AUTOBUY_EVERY} s`, S.up.supplier ? null : SUPPLIER_PRICE, () => { S.up.supplier = true; S.stats.ups++; toast('🛒 Fornecedor contratado! Defina os mínimos na loja de metais.'); afterBuy(); });
    sec('Armaria');
    const arm = TYPES.filter(T => T.armory), armOwned = arm.every(T => S.molds[T.id]);
    buyRow(moldImg('longsword', 1), 'Armaria', armOwned ? 'Espada longa e Machado de guerra liberados.' : `libera os moldes de ${arm.map(T => T.n).join(' e ')} (a base + 2 metais) e, se faltarem, os de ${arm.map(T => type(T.req).n).join(' e ')}`, armOwned ? null : ARMORY_PRICE, () => {
      arm.forEach(T => { [T.req, T.id].forEach(id => { if (!S.molds[id]) { S.molds[id] = 1; S.msel[id] = 1; S.stats.molds++; } }); });
      S.stats.ups++; toast('⚔ Armaria aberta: Espada longa e Machado de guerra liberados!'); afterBuy();
    });
    sec('Arcabuzaria');
    const toolsOk = S.up.anvil >= PISTOL_TOOLS && S.up.hammer >= PISTOL_TOOLS;
    if (S.molds.pistol) buyRow(itemImg({ t: 'pistol', lvl: 1, ores: ['aco', 'aco', 'aco', 'ebano'] }), 'Pistolas', 'Liberado: os próximos níveis estão na loja de moldes.', null);
    else if (!toolsOk) {
      const ck = (ok, txt) => `${ok ? '✔' : '✘'} ${txt}`;
      buyRow(itemImg({ t: 'pistol', lvl: 1, ores: ['aco', 'aco', 'aco', 'ebano'] }), `Pistolas de pederneira · ${PISTOL_PRICE} moedas`,
        `Para desbloquear: ${ck(S.up.anvil >= PISTOL_TOOLS, ANVILS[PISTOL_TOOLS].n + ` (você tem: ${ANVILS[S.up.anvil].n})`)} · ${ck(S.up.hammer >= PISTOL_TOOLS, HAMMERS[PISTOL_TOOLS].n + ` (você tem: ${HAMMERS[S.up.hammer].n})`)}`, false);
    }
    else buyRow(itemImg({ t: 'pistol', lvl: 1, ores: ['aco', 'aco', 'aco', 'ebano'] }), 'Pistolas de pederneira', 'arma de fim de jogo, ao estilo pirata: metal comum no cano + madeira na coronha', PISTOL_PRICE, () => {
      S.molds.pistol = 1; S.msel.pistol = 1; S.stats.molds++; S.stats.ups++; toast('🏴‍☠️ Arcabuzaria aberta: molde de Pistola liberado!'); afterBuy();
    });
    sec('Oficina (madeira)');
    TYPES.filter(T => T.unlock && T.wood).forEach(T => buyRow(moldImg(T.id, 1), `Molde de ${T.n}`, S.molds[T.id] ? 'Liberado: os próximos níveis estão na loja de moldes.' : `peças de madeira${T.gemReq ? ' com gema obrigatória' : ''} · libera a aba Madeira e a 🌲 floresta`, S.molds[T.id] ? null : T.unlock, () => {
      S.molds[T.id] = 1; S.msel[T.id] = 1; S.stats.molds++; S.stats.ups++; toast(`🪵 Molde de ${T.n} liberado! A floresta está aberta.`); afterBuy();
    }));
    sec('Técnicas');
    buyRow(sprite('ring', ORES[5].sh, 4, 1, '#ef4444'), 'Joalheria', S.up.jewel ? 'Moldes de Anel e Amuleto liberados na loja de moldes.' : 'libera os moldes de Anel e Amuleto (feitos de Prata ou Ouro, com gema opcional)', S.up.jewel ? null : JEWEL_PRICE, () => { S.up.jewel = true; S.stats.ups++; toast('💍 Joalheria liberada! Veja a loja de moldes.'); afterBuy(); });
    buyRow(sprite('ingot', ['#f4a36b', '#5fd6d0', '#5b2a99']), 'Forja composta', S.up.alloy ? 'Cada espaço da bigorna aceita um metal diferente.' : `metais diferentes na mesma peça · +${pct(ALLOY_VALUE)} de valor e <b>muito</b> mais difícil por metal extra`, S.up.alloy ? null : ALLOY_PRICE, () => { S.up.alloy = true; S.stats.ups++; fitOres(); toast('⚗️ Forja composta liberada!'); afterBuy(); });
  }

  else if (k === 'counter') {
    $('#m-title').textContent = `Balcão · Encomendas (${S.orders.length}/${maxOrders()})`;
    {
      if (!S.orders.length) body.innerHTML = `<div class="empty">Nenhuma encomenda agora. Próxima em ${mmss(S.nextOrder - Date.now())}.</div>`;
      const now = Date.now();
      S.orders.forEach(o => {
        const m = matchFor(o), f = orderInfo(o, now);
        const req = `<span class="r-${o.r}">${rar(o.r).n}</span> ou melhor` + (o.lvl > 1 ? ` · molde ${LEVELS[o.lvl].n}+` : '');
        const r = row(`<img class="ic" src="${sprite(o.t, ore(o.ore).sh, 4, o.lvl)}" alt=""><span class="nm">${o.e} <b>${esc(o.npc)}</b> quer <b>${esc(nameOf(o.t, o.lvl, [o.ore]))}</b><br><small>${req} · <span class="tm">${f.txt}</span></small><div class="timer"><i class="${f.fast ? 'fast' : ''}" style="width:${f.pct}%"></i></div></span>${coinTag(f.pay)}<span class="acts"><button class="btn small">Entregar</button><button class="btn small ghost" title="Recusar">✕</button></span>`, m ? 'ok' : '');
        r.dataset.oid = o.id;
        const [bd, bx] = r.querySelectorAll('button'); bd.disabled = !m; bd.title = m ? 'Entregar ' + itemName(m) : 'Você não tem uma peça que sirva no estoque';
        bd.onclick = () => deliver(o.id); bx.onclick = () => { S.orders = S.orders.filter(x => x !== o); save(); renderBottom(); renderModal(); };
      });
      foot.innerHTML = `<small class="sub">Uma nova encomenda chega a cada ${ORDER_EVERY / 1000} s (máx. ${maxOrders()}). Entregas rápidas pagam bônus.</small>`;
    }
  }

  else if (k === 'missions') {
    $('#m-title').textContent = '🏆 Missões';
    {
      [...MISSIONS].sort((a, b) => S.claimed.includes(a.id) - S.claimed.includes(b.id)).forEach(m => {
        const [a, b] = m.p(S), done = a >= b, got = S.claimed.includes(m.id);
        const r = row(`<span class="nm">${got ? '✔ ' : ''}<b>${m.n}</b><br><small>Recompensa: ${rwText(m.rw)}</small><div class="prog"><i style="width:${Math.min(100, a / b * 100)}%"></i></div></span><span class="pr" style="color:var(--dim)">${Math.min(a, b)}/${b}</span>` + (got ? '' : `<button class="btn small" ${done ? '' : 'disabled'}>Resgatar</button>`), done && !got ? 'ok' : '');
        if (got) r.style.opacity = .5;
        const bt = r.querySelector('button'); if (bt) bt.onclick = () => {
          S.claimed.push(m.id); if (m.rw.c) earn(m.rw.c);
          Object.entries(m.rw.o || {}).forEach(([id, q]) => { S.ores[id] = (S.ores[id] || 0) + q; see(id); });
          toast('🏆 Missão concluída: ' + m.n); afterBuy();
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
      mat: [['metais', 'Metais'], ['madeiras', 'Madeiras'], ['gems', 'Gemas']],
      res: [['mine', 'Mina'], ['forest', 'Floresta']],
      ups: [['fur', 'Fornalha'], ['tools', 'Bigorna e martelo'], ['mines', 'Mina'], ['shop', 'Balcões e comércio'], ['tech', 'Técnicas']],
    };
    if (SUBS[modal.tab]) subBar(SUBS[modal.tab]);
    const t = SUBS[modal.tab] ? modal.sub : modal.tab;
    if (t === 'metais' || t === 'madeiras') ORES.filter(o => !!o.wood === (t === 'madeiras')).forEach(o => row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm"><b>${o.n}</b> <small>· ${o.wood ? 'madeira' : 'grau ' + o.tier}</small><br><small>${[o.shop ? `Loja: ${o.buy}` : '', o.mine ? `Mina: nível ${o.mine} · ${FURNACES[o.smelt].n}` : '', o.alloy ? `Liga: ${inpText(ALLOYS.find(a => a.id === o.id))}` : '', `valor ${o.cost}`, o.jewel ? 'só anéis e amuletos' : '', o.wood ? 'só cajados' : '', o.ingr ? 'só ingrediente de liga' : ''].filter(Boolean).join(' · ')}</small></span><span class="pr" style="color:var(--dim)">${S.seen.includes(o.id) ? 'tem ' + (S.ores[o.id] || 0) : '🔒'}</span>`, S.seen.includes(o.id) ? '' : 'lock'));
    if (t === 'pieces') TYPES.forEach(T => {
      const lv = LEVELS.slice(1).map((_, i) => i + 1).map(l => `<img src="${moldImg(T.id, l, 2)}" title="${LEVELS[l].n}" alt="">`).join('');
      row(`<span class="ency-lv">${lv}</span><span class="nm"><b>${T.n}</b>${T.jewel ? ' <small>· joia (requer Joalheria)</small>' : T.wood ? ` <small>· madeira (Oficina)${T.gemReq ? ', gema obrigatória' : ''}</small>` : T.mixWood ? ` <small>· Arcabuzaria (metal + madeira; exige bigorna e martelo de Mithril)</small>` : T.unlock ? ' <small>· Armaria</small>' : ''}<br><small>${T.wood ? 'madeiras' : 'lingotes'} por nível: ${LEVELS.slice(1).map((_, i) => i + 1).map(l => usesOf(T.id, l)).join(' / ')} · gemas por nível: ${LEVELS.slice(1).map((_, i) => gemSlots(T.id, i + 1)).join(' / ')} · valor base ${T.base}${T.jewel ? ' · Prata/Ouro' : ''}</small></span><span class="pr" style="color:var(--dim)">${S.molds[T.id] ? LEVELS[S.molds[T.id]].n : '🔒'}</span>`, S.molds[T.id] ? '' : 'lock');
    });
    if (t === 'pieces') body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">Níveis do molde: ${LEVELS.slice(1).map(l => `${l.n} (×${l.m})`).join(' · ')}</p>`);
    if (t === 'gems') { GEMS.forEach(g => row(`<img class="ic" src="${gemImg(g.id)}" alt=""><span class="nm"><b>${g.n}</b><br><small>+${pct(g.b)} em joias, +${pct(g.b / 2)} nas outras peças · +${pct(g.q)} de chance de raridade · Mina: nível ${g.mine}</small></span><span class="pr" style="color:var(--dim)">${S.gems[g.id] ? 'tem ' + S.gems[g.id] : ''}</span>`)); body.insertAdjacentHTML('beforeend', '<p class="sub" style="font-size:12px">A gema entra na bigorna junto com qualquer molde, ou depois: arraste-a para uma peça sem gema no estoque (aí ela só aumenta o valor). Na forja e na reforja, ela melhora as chances de Raro para cima. Na mina, só um acerto Bom ou Perfeito tira a gema inteira.</p>'); }
    if (t === 'mine') {
      MINES.slice(1).forEach((M, i) => {
        const lv = i + 1, os = minable(lv), tot = os.reduce((a, o) => a + mineWeight(o, lv), 0), gs = lv >= GEM_LEVEL ? GEMS.filter(g => g.mine <= lv) : [], gt = gs.reduce((a, g) => a + gemWeight(g, lv), 0);
        const oreTxt = os.map(o => `${o.n} ${(mineWeight(o, lv) / tot * 100 * (gs.length ? 1 - GEM_CHANCE : 1)).toFixed(1)}%`).join(' · ');
        const gemTxt = gs.length ? `<br>Gemas (${pct(GEM_CHANCE)} dos veios): ${gs.map(g => `${g.n} ${(gemWeight(g, lv) / gt * 100).toFixed(0)}%`).join(' · ')}` : '';
        row(`<img class="ic" src="${pickImg(lv, 3)}" alt=""><span class="nm"><b>${lv}. ${M.n}</b> <small>· ${M.targets} veios · ${M.price ? M.price + ' moedas' : 'inicial'}</small><br><small>${oreTxt}${gemTxt}</small></span><span class="pr">${S.up.mine >= lv ? '✔' : '🔒'}</span>`, S.up.mine >= lv ? '' : 'lock');
      });
      body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">Por veio: Perfeito = 2 minérios, Bom = 1, Ok = 50% de chance de 1. A mina reabre a cada ${mmss(MINE_CD)}.<br>O minério vai para a aba Forno: segure para aquecer e mantenha a temperatura na faixa verde. Cada minério vira metal com chance proporcional ao tempo na faixa; o resto se perde.</p>`);
    }
    if (t === 'forest') {
      const ws = ORES.filter(o => o.wood), tot = ws.reduce((a, o) => a + o.fw, 0);
      ws.forEach(o => row(`<img class="ic" src="${ingotImg(o.id)}" alt=""><span class="nm"><b>${o.n}</b> <small>· grau ${o.tier}</small><br><small>${(o.fw / tot * 100).toFixed(1)}% das árvores · dificuldade ${'★'.repeat(treeStars(o))}${'☆'.repeat(5 - treeStars(o))}${o.shop ? ` · loja: ${o.buy}` : ' · só na floresta'}</small></span>`));
      body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">Abre com o molde de Arco ou de Cajado e rebrota a cada ${mmss(FOREST_CD)} (${FOREST_TREES} árvores). Segure o clique para carregar o machado: a carga sobe aos trancos e, ao encher, despenca. Solte dentro da faixa: Perfeito = 2 madeiras, Bom = 1, Ok = 50% de 1. Árvores nobres têm faixa menor e mais à direita.</p>`);
    }
    if (t === 'fur') {
      sec('Fornos');
      FURNACES.slice(1).forEach((F, i) => row(`<span class="ic-e">🔥</span><span class="nm"><b>${F.n}</b> <small>· ${F.price ? F.price + ' moedas' : 'inicial'}</small><br><small>derrete: ${ORES.filter(o => o.smelt && o.smelt <= i + 1).map(o => o.n).join(', ')}${F.steel ? ` · fundição perfeita: ferro → aço ${pct(F.steel)}` : ''}${F.arcane ? `, mithril → adamantita/oricalco ${pct(F.arcane)}` : ''}</small></span><span class="pr">${S.up.furnace >= i + 1 ? '✔' : '🔒'}</span>`, S.up.furnace >= i + 1 ? '' : 'lock'));
      sec('Ligas (compradas em ordem)');
      ALLOYS.forEach((a, i) => row(`<img class="ic" src="${ingotImg(a.id)}" alt=""><span class="nm"><b>${a.n}</b> → ${ore(a.id).n}<br><small>${inpText(a)} · exige ${FURNACES[a.fur].n} · ${a.price} moedas</small></span><span class="pr">${S.up.alloys > i ? '✔' : '🔒'}</span>`, S.up.alloys > i ? '' : 'lock'));
      body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">Na fornalha, segure para aquecer e mantenha a temperatura na faixa verde. Cada lote dá certo com chance proporcional ao tempo na faixa; o que der errado se perde. Uma fundição é <b>perfeita</b> com ${pct(PERFECT_SMELT)} ou mais na faixa.</p>`);
    }
    if (t === 'rarity') {
      const w = rarityWeights(1), tot = w.reduce((a, b) => a + b), w5 = rarityWeights(.5), t5 = w5.reduce((a, b) => a + b);
      RARITY.forEach((r, i) => row(`<span class="nm"><b class="r-${r.id}">${r.n}</b><br><small>valor ×${r.m} · chance com ritmo médio ~${(w5[i] / t5 * 100).toFixed(1)}% · perfeito ~${(w[i] / tot * 100).toFixed(1)}%</small></span>`, 'b-' + r.id));
      body.insertAdjacentHTML('beforeend', `<p class="sub" style="font-size:12px">Golpes: ${GRADES.slice().reverse().map(g => `${g.n.replace('!', '')} = ${g.pts}`).join(' · ')}. A raridade é sorteada; acertar mais só melhora as chances.</p>`);
    }
    if (t === 'tools') {
      sec('Bigornas'); ANVILS.slice(1).forEach((a, i) => row(`<img class="ic" src="${anvilImg(i + 1, 2)}" alt=""><span class="nm"><b>${a.n}</b><br><small>zona +${pct(a.b)} · ${a.price ? a.price + ' moedas' : 'inicial'}</small></span><span class="pr">${S.up.anvil >= i + 1 ? '✔' : ''}</span>`));
      sec('Martelos'); HAMMERS.slice(1).forEach((a, i) => row(`<img class="ic" src="${hammerImg(i + 1, 2)}" alt=""><span class="nm"><b>${a.n}</b><br><small>cursor −${pct(a.b)} · ${a.price ? a.price + ' moedas' : 'inicial'}</small></span><span class="pr">${S.up.hammer >= i + 1 ? '✔' : ''}</span>`));
    }
    if (t === 'mines') {
      MINES.slice(1).forEach((a, i) => row(`<img class="ic" src="${pickImg(i + 1, 3)}" alt=""><span class="nm"><b>${a.n}</b><br><small>${a.targets} veios · novos: ${[...ORES.filter(o => o.mine === i + 1).map(o => o.n), ...GEMS.filter(g => g.mine === i + 1).map(g => g.n)].join(', ') || '—'} · ${a.price ? a.price + ' moedas' : 'inicial'}</small></span><span class="pr">${S.up.mine >= i + 1 ? '✔' : ''}</span>`));
    }
    if (t === 'shop') {
      sec('Balcões'); COUNTERS.slice(1).forEach((c, i) => row(`<span class="ic-e">📜</span><span class="nm"><b>${c.n}</b><br><small>até ${c.max} encomendas · prazo ×${c.dur} · ${c.price ? c.price + ' moedas' : 'inicial'}</small></span><span class="pr">${S.up.counter >= i + 1 ? '✔' : ''}</span>`));
      sec('Comércio');
      row(`<span class="nm"><b>Leilão</b><br><small>abrir: ${SLOT_PRICES[1]} · ${SLOT_PRICES.slice(2).map((p, i) => `${i + 2} espaços: ${p}`).join(' · ')} moedas</small></span><span class="pr">${S.up.slots}/5</span>`);
      row(`<span class="nm"><b>Ajudante de ferreiro</b> (venda automática, botão 💰)<br><small>${pct(AUTO_SELL)} do valor, uma peça a cada ${AUTO_EVERY} s · ${HELPER_PRICE} moedas</small></span><span class="pr">${S.up.helper ? '✔' : ''}</span>`);
      row(`<span class="nm"><b>Fornecedor</b> (compra automática, na loja de metais)<br><small>repõe até o mínimo a cada ${AUTOBUY_EVERY} s · ${SUPPLIER_PRICE} moedas</small></span><span class="pr">${S.up.supplier ? '✔' : ''}</span>`);
    }
    if (t === 'tech') {
      row(`<span class="nm"><b>Joalheria</b><br><small>Anel e Amuleto · ${JEWEL_PRICE} moedas</small></span><span class="pr">${S.up.jewel ? '✔' : ''}</span>`);
      row(`<span class="nm"><b>Forja composta</b><br><small>metais diferentes na mesma peça · ${ALLOY_PRICE} moedas</small></span><span class="pr">${S.up.alloy ? '✔' : ''}</span>`);
      row(`<span class="nm"><b>Armaria</b><br><small>Espada longa e Machado de guerra (e os moldes base, se faltarem) · ${ARMORY_PRICE} moedas</small></span><span class="pr">${S.molds.longsword ? '✔' : ''}</span>`);
      row(`<span class="nm"><b>Arcabuzaria</b><br><small>Pistolas (metal + madeira) · exige ${ANVILS[PISTOL_TOOLS].n} e ${HAMMERS[PISTOL_TOOLS].n} · ${PISTOL_PRICE} moedas</small></span><span class="pr">${S.molds.pistol ? '✔' : ''}</span>`);
      TYPES.filter(T => T.wood).forEach(T => row(`<span class="nm"><b>Molde de ${T.n}</b> (Oficina)<br><small>${T.unlock} moedas · libera madeiras e floresta</small></span><span class="pr">${S.molds[T.id] ? '✔' : ''}</span>`));
    }
  }

  else if (k === 'pause') {
    $('#m-title').textContent = 'Menu';
    body.innerHTML = '<div class="pause-box"><button class="btn" data-a="c">▶ Continuar</button><button class="btn" data-a="m">⌂ Menu inicial</button><button class="btn danger" data-a="r">⟲ Resetar progresso</button></div>';
    body.querySelector('[data-a=c]').onclick = closeModal;
    body.querySelector('[data-a=m]').onclick = () => { closeModal(); menuLabel(); show('menu'); };
    body.querySelector('[data-a=r]').onclick = () => openModal('reset');
  }

  else if (k === 'reset') {
    $('#m-title').textContent = '⚠ Resetar progresso';
    body.innerHTML = '<p class="warn">Isso apaga <b>tudo</b>: moedas, minérios, gemas, moldes, melhorias, estoque, leilões, encomendas e missões.<br>O jogo volta ao começo, e isso <b>não pode ser desfeito</b>.</p>';
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
  if (forest) { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && !forest.over && forest.wait <= 0) forest.hold = true; } else if (e.key === 'Escape') $('#for-exit').click(); return; }
  if (fur) { if (e.code === 'Space') { e.preventDefault(); if (fur.stage === 'run') fur.heat = true; } else if (e.key === 'Escape') $('#fur-exit').click(); return; }
  if (e.code === 'Space' && forging) { e.preventDefault(); strike(); }
  else if (e.key === 'Enter' && !forging && $('#modal').hidden) startForge();
  else if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (!forging) openModal('pause'); }
});
$('#anvil-area').addEventListener('pointerdown', e => { if (forging) { e.preventDefault(); strike(); } });
let toastT;
function toast(html) { const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }

function renderAll() { renderCoins(); renderTools(); renderLists(); renderSlots(); renderStock(); renderBottom(); renderMineBtn(); renderForestBtn(); }
menuLabel(); renderAll();
