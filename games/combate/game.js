/* Combate: protótipo de auto-batalha com mochila.
   Loop: antes da luta você vê a mochila do inimigo, compra itens na loja, melhora itens e o personagem e arruma
   a sua mochila (cada item ocupa casas, como numa maleta) → a luta roda sozinha, com a mesma lógica para os dois lados
   → vitória dá ouro (moeda da jornada) e essência (moeda permanente, gasta na árvore de melhorias).
   Tudo fica salvo no navegador (localStorage). */

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pct = v => Math.round(v * 100) + '%';

/* ======================= Dados (equilíbrio do jogo) ======================= */
const LVM = [1, 1.4, 1.9];                         // multiplicador dos números do item por nível (1 a 3)
const lvl = (v, lv) => Math.round(v * LVM[lv - 1]);
const MAX_LV = 3, STASH_MAX = 8, FATIGUE_AT = 25;

// w × h = casas na mochila · price = preço na loja · min = rodada em que começa a aparecer na loja
// kind: weapon (ataca a cada cd segundos) · def · util    aura = bônus dado aos itens encostados nele
const ITEMS = {
  dagger:  { n: 'Adaga',             w: 1, h: 2, price: 4,  min: 1, kind: 'weapon', dmg: 3,  cd: 1.1 },
  sword:   { n: 'Espada',            w: 1, h: 3, price: 7,  min: 1, kind: 'weapon', dmg: 8,  cd: 2.0 },
  mace:    { n: 'Maça',              w: 2, h: 2, price: 8,  min: 2, kind: 'weapon', dmg: 7,  cd: 2.4, crush: 4 },
  spear:   { n: 'Lança',             w: 1, h: 4, price: 10, min: 3, kind: 'weapon', dmg: 10, cd: 2.3, pierce: .5 },
  axe:     { n: 'Machado',           w: 2, h: 3, price: 13, min: 4, kind: 'weapon', dmg: 19, cd: 3.4 },
  wshield: { n: 'Escudo de madeira', w: 2, h: 2, price: 5,  min: 1, kind: 'def', block: 4, cd: 2.6 },
  ishield: { n: 'Escudo de ferro',   w: 2, h: 3, price: 10, min: 4, kind: 'def', block: 9, cd: 3.0 },
  helmet:  { n: 'Elmo',              w: 2, h: 2, price: 6,  min: 2, kind: 'def', hp: 15 },
  armor:   { n: 'Peitoral',          w: 2, h: 3, price: 12, min: 4, kind: 'def', hp: 25, armor: 1 },
  whet:    { n: 'Pedra de amolar',   w: 1, h: 1, price: 4,  min: 1, kind: 'util', aura: { dmg: 2 } },
  ring:    { n: 'Anel da pressa',    w: 1, h: 1, price: 6,  min: 2, kind: 'util', aura: { haste: .15 } },
  venom:   { n: 'Frasco de veneno',  w: 1, h: 1, price: 6,  min: 3, kind: 'util', aura: { poison: 1 } },
  amulet:  { n: 'Amuleto vampírico', w: 1, h: 1, price: 7,  min: 3, kind: 'util', aura: { steal: .2 } },
  potion:  { n: 'Poção',             w: 1, h: 2, price: 4,  min: 1, kind: 'util', heal: 18 },
};

// Inimigos, um por rodada. kit = [item, nível, x, y, girado]
const ENEMIES = [
  { n: 'Goblin',       spr: 'goblin',   hp: 26,  w: 3, h: 3, kit: [['dagger', 1, 1, 0]] },
  { n: 'Bandido',      spr: 'bandit',   hp: 38,  w: 4, h: 3, kit: [['dagger', 1, 0, 0], ['wshield', 1, 1, 0]] },
  { n: 'Esqueleto',    spr: 'skeleton', hp: 42,  w: 4, h: 3, kit: [['sword', 1, 1, 0], ['whet', 1, 0, 0]] },
  { n: 'Xamã goblin',  spr: 'shaman',   hp: 48,  w: 4, h: 3, kit: [['dagger', 1, 0, 0], ['venom', 1, 1, 0], ['dagger', 1, 2, 0], ['potion', 1, 3, 0]] },
  { n: 'Orc',          spr: 'orc',      hp: 75,  w: 4, h: 4, kit: [['axe', 1, 0, 0], ['helmet', 1, 2, 0]] },
  { n: 'Lanceiro',     spr: 'lancer',   hp: 70,  w: 5, h: 4, kit: [['spear', 1, 0, 0], ['ring', 1, 1, 0], ['sword', 1, 2, 0], ['wshield', 1, 3, 0]] },
  { n: 'Cavaleiro',    spr: 'knight',   hp: 85,  w: 6, h: 4, kit: [['whet', 1, 0, 0], ['sword', 2, 1, 0], ['ishield', 1, 2, 0], ['armor', 1, 4, 0]] },
  { n: 'Assassino',    spr: 'assassin', hp: 80,  w: 5, h: 4, kit: [['amulet', 1, 0, 0], ['dagger', 2, 1, 0], ['venom', 2, 2, 0], ['ring', 1, 2, 1], ['dagger', 2, 3, 0], ['potion', 1, 4, 0]] },
  { n: 'Chefe orc',    spr: 'warlord',  hp: 130, w: 6, h: 4, big: true, kit: [['axe', 2, 0, 0], ['whet', 2, 2, 0], ['mace', 1, 2, 1], ['helmet', 2, 4, 0], ['wshield', 2, 4, 2]] },
  { n: 'Rei Caveira',  spr: 'king',     hp: 150, w: 6, h: 5, big: true, kit: [['whet', 2, 0, 0], ['amulet', 2, 0, 1], ['venom', 1, 0, 2], ['sword', 3, 1, 0], ['spear', 1, 2, 0], ['ishield', 2, 3, 0], ['potion', 2, 5, 0], ['armor', 2, 3, 3, 1]] },
];

// Treino: melhorias do personagem compradas com ouro, valem só nesta jornada
const TRAIN = [
  { id: 'vig', e: '❤', n: 'Vigor',     d: '+12 de vida máxima',           base: 5, step: 3 },
  { id: 'str', e: '💪', n: 'Força',     d: '+8% de dano',                  base: 6, step: 4 },
  { id: 'agi', e: '⚡', n: 'Agilidade', d: '+6% de velocidade dos itens',  base: 6, step: 4 },
];
const TRAIN_MAX = 5;

// Árvore permanente (comprada com essência). x, y = posição na árvore · req = nó anterior · fx = efeito
const NODES = [
  { id: 'vit1',   e: '❤', n: 'Vitalidade I',   d: '+10 de vida',                    cost: 3,  x: 3,   y: 0, fx: { hp: 10 } },
  { id: 'gold1',  e: '🪙', n: 'Bolsa cheia',    d: '+6 de ouro inicial',             cost: 3,  x: 1,   y: 1, req: 'vit1',  fx: { gold: 6 } },
  { id: 'str1',   e: '💪', n: 'Força I',        d: '+6% de dano',                    cost: 4,  x: 3,   y: 1, req: 'vit1',  fx: { dmg: .06 } },
  { id: 'pack1',  e: '🎒', n: 'Mochila larga',  d: '+1 coluna na mochila',           cost: 6,  x: 5,   y: 1, req: 'vit1',  fx: { cols: 1 } },
  { id: 'merch',  e: '🏷', n: 'Pechincha',      d: 'Loja 10% mais barata',           cost: 6,  x: .5,  y: 2, req: 'gold1', fx: { disc: .1 } },
  { id: 'shop1',  e: '🛒', n: 'Vitrine maior',  d: '+1 item na loja',                cost: 8,  x: 1.5, y: 2, req: 'gold1', fx: { shopn: 1 } },
  { id: 'vit2',   e: '❤', n: 'Vitalidade II',  d: '+15 de vida',                    cost: 7,  x: 2.5, y: 2, req: 'str1',  fx: { hp: 15 } },
  { id: 'spd1',   e: '⚡', n: 'Reflexos',       d: '+6% de velocidade',              cost: 7,  x: 3.5, y: 2, req: 'str1',  fx: { spd: .06 } },
  { id: 'pack2',  e: '🎒', n: 'Mochila funda',  d: '+1 linha na mochila',            cost: 12, x: 4.5, y: 2, req: 'pack1', fx: { rows: 1 } },
  { id: 'kit',    e: '🛡', n: 'Kit inicial',    d: 'Começa com um escudo de madeira', cost: 5, x: 5.5, y: 2, req: 'pack1', fx: { kit: 1 } },
  { id: 'reroll', e: '🎲', n: 'Freguês',        d: '1 troca grátis da loja por rodada', cost: 8, x: 1.5, y: 3, req: 'shop1', fx: { reroll: 1 } },
  { id: 'life',   e: '💖', n: 'Segunda chance', d: '+1 vida por jornada',            cost: 15, x: 2.5, y: 3, req: 'vit2',  fx: { lives: 1 } },
  { id: 'str2',   e: '💪', n: 'Força II',       d: '+8% de dano',                    cost: 12, x: 3.5, y: 3, req: 'spd1',  fx: { dmg: .08 } },
  { id: 'soul',   e: '💠', n: 'Colheita',       d: '+30% de essência',               cost: 10, x: 5.5, y: 3, req: 'kit',   fx: { ess: .3 } },
];

/* ======================= Estado e salvamento ======================= */
const SAVE = 'combate-save';
let S = { meta: { ess: 0, nodes: [] }, run: null, best: 0, speed: 1 };
try { const d = JSON.parse(localStorage.getItem(SAVE)); if (d && d.meta) S = Object.assign(S, d); } catch (e) {}
let save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} };
const meta = k => NODES.reduce((a, n) => a + (S.meta.nodes.includes(n.id) && n.fx[k] || 0), 0);

let run = S.run;              // jornada atual (ou null)
let mode = 'prep';            // prep | combat | result
let sel = null;               // item selecionado: { src: 'pack' | 'stash' | 'shop' | 'enemy', it }
let cb = null;                // combate em andamento
let view = { a: null, b: null };   // lutadores mostrados na arena (prévia na preparação, reais no combate)
const itemEls = new Map();    // item → elemento na mochila (para as barras de recarga)

/* ======================= Mochila: geometria ======================= */
const dims = it => { const d = ITEMS[it.id]; return it.r ? [d.h, d.w] : [d.w, d.h]; };
function fits(pack, it, x, y, r, ignore) {
  const d = ITEMS[it.id], w = r ? d.h : d.w, h = r ? d.w : d.h;
  if (x < 0 || y < 0 || x + w > pack.w || y + h > pack.h) return false;
  return !pack.items.some(o => { if (o === ignore) return false; const [ow, oh] = dims(o); return x < o.x + ow && o.x < x + w && y < o.y + oh && o.y < y + h; });
}
function adjacent(a, b) {     // encostados por um lado (canto não conta)
  const [aw, ah] = dims(a), [bw, bh] = dims(b);
  const ox = a.x < b.x + bw && b.x < a.x + aw, oy = a.y < b.y + bh && b.y < a.y + ah;
  return ((a.x + aw === b.x || b.x + bw === a.x) && oy) || ((a.y + ah === b.y || b.y + bh === a.y) && ox);
}

/* ======================= Jornada ======================= */
const newItem = (id, lv = 1) => ({ uid: run.uid++, id, lv, x: 0, y: 0, r: 0 });
const price = id => Math.max(1, Math.round(ITEMS[id].price * (1 - meta('disc'))));
const upCost = it => ITEMS[it.id].price * it.lv;                       // nível 1→2: preço do item; 2→3: o dobro
const sellValue = it => Math.floor(ITEMS[it.id].price * (1 + (it.lv > 1) + 2 * (it.lv > 2)) / 2);   // metade do que foi investido
const trainCost = t => t.base + t.step * run.train[t.id];
const essFor = round => Math.ceil((1 + Math.floor(round / 3)) * (1 + meta('ess')));

function newRun() {
  run = S.run = { round: 1, gold: 12 + meta('gold'), lives: 1 + meta('lives'), train: { vig: 0, str: 0, agi: 0 }, uid: 1,
    pack: { w: 5 + meta('cols'), h: 4 + meta('rows'), items: [] }, stash: [], shop: [], free: 0, rerolls: 0, ess: 0 };
  run.pack.items.push(newItem('dagger'));
  if (meta('kit')) run.pack.items.push(Object.assign(newItem('wshield'), { x: 1 }));
  setupRound();
}
function mkEnemy(round) {
  const e = ENEMIES[round - 1], pack = { w: e.w, h: e.h, items: [] };
  e.kit.forEach(([id, lv, x, y, r], i) => {
    const it = { uid: 'e' + i, id, lv, x, y, r: r || 0 };
    if (fits(pack, it, x, y, it.r)) pack.items.push(it); else console.warn('Kit inválido:', e.n, id);
  });
  return { n: e.n, spr: e.spr, hp: e.hp, big: !!e.big, pack };
}
function rollShop() {
  const pool = Object.keys(ITEMS).filter(id => ITEMS[id].min <= run.round), n = 4 + meta('shopn');
  run.shop = Array.from({ length: n }, () => ({ uid: 's' + run.uid++, id: pool[Math.random() * pool.length | 0], lv: 1, r: 0, sold: false }));
}
function setupRound() { run.enemy = mkEnemy(run.round); rollShop(); run.free = meta('reroll'); run.rerolls = 0; sel = null; save(); }
const rerollCost = () => run.free > 0 ? 0 : 1 + run.rerolls;

/* ======================= Lutadores e combate (mesma lógica para os dois lados) ======================= */
function buildFighter(name, spr, hp, pack, dmgMul = 1, spdMul = 1, big = false) {
  const f = { name, spr, big, hpMax: hp, hp: 0, block: 0, poison: 0, armor: 0, dmgMul, spdMul, lunge: 0, flash: 0, dead: 0 };
  f.items = pack.items.map(it => ({ it, d: ITEMS[it.id], t: 0, bonus: 0, haste: 0, poison: 0, steal: 0, used: false }));
  for (const a of f.items) {
    if (a.d.hp) f.hpMax += lvl(a.d.hp, a.it.lv);
    if (a.d.armor) f.armor += a.it.lv;
    const au = a.d.aura; if (!au) continue;
    for (const b of f.items) {
      if (b === a || !adjacent(a.it, b.it)) continue;
      const w = b.d.kind === 'weapon';
      if (au.dmg && w) b.bonus += lvl(au.dmg, a.it.lv);
      if (au.haste && b.d.cd) b.haste += au.haste * LVM[a.it.lv - 1];
      if (au.poison && w) b.poison += a.it.lv;
      if (au.steal && w) b.steal += au.steal * LVM[a.it.lv - 1];
    }
  }
  f.hp = f.hpMax;
  return f;
}
const playerFighter = () => buildFighter('Você', 'hero', 60 + meta('hp') + run.train.vig * 12, run.pack,
  1 + meta('dmg') + run.train.str * .08, 1 + meta('spd') + run.train.agi * .06);
const enemyFighter = () => buildFighter(run.enemy.n, run.enemy.spr, run.enemy.hp, run.enemy.pack, 1, 1, run.enemy.big);
function rates(f) {           // dano e bloqueio por segundo, para a prévia
  let dps = 0, bps = 0;
  for (const r of f.items) { const sp = f.spdMul * (1 + r.haste) / (r.d.cd || 1); if (r.d.dmg) dps += (lvl(r.d.dmg, r.it.lv) + r.bonus) * f.dmgMul * sp; if (r.d.block) bps += lvl(r.d.block, r.it.lv) * sp; }
  return { dps, bps };
}

const STEP = .05;
function startCombat() {
  if (!run.pack.items.some(it => ITEMS[it.id].kind === 'weapon')) return toast('Coloque pelo menos uma arma na mochila!');
  hideTip(); sel = null; mode = 'combat';
  cb = { a: playerFighter(), b: enemyFighter(), t: 0, acc: 0, sec: 0, over: false, win: false, endT: 0 };
  view = cb; $('#log').innerHTML = ''; $('#fx').innerHTML = '';
  log(`<b>Rodada ${run.round}</b> — você contra ${cb.b.name}`);
  render();
}
function fire(f, foe, r, side) {
  const d = r.d, me = side === 'a' ? 'Você' : f.name, cls = side === 'a' ? 'me' : 'foe';
  flashItem(r);
  if (d.dmg) {
    const dmg = Math.max(1, Math.round((lvl(d.dmg, r.it.lv) + r.bonus) * f.dmgMul * (.9 + Math.random() * .2)));
    const absorbed = Math.min(foe.block, Math.round(dmg * (1 - (d.pierce || 0))));
    foe.block = Math.max(0, foe.block - absorbed - (d.crush || 0));
    let dealt = dmg - absorbed;
    if (dealt > 0) dealt = Math.max(1, dealt - foe.armor);
    foe.hp -= dealt; f.lunge = 1;
    const other = side === 'a' ? 'b' : 'a';
    if (dealt > 0) { foe.flash = 1; fx(other, '-' + dealt, 'dmg'); } else fx(other, 'bloqueou', 'blk');
    if (dealt > 0 && r.poison) foe.poison += r.poison;
    if (dealt > 0 && r.steal) { const h = Math.min(f.hpMax - f.hp, Math.max(1, Math.round(dealt * r.steal))); if (h > 0) { f.hp += h; fx(side, '+' + h, 'heal'); } }
    log(`<span class="${cls}">${me}</span>: ${d.n} causa <b>${dealt}</b>${absorbed ? ` <i>(${absorbed} bloqueado)</i>` : ''}`);
  }
  if (d.block) { const b = lvl(d.block, r.it.lv); f.block = Math.min(99, f.block + b); fx(side, '🛡+' + b, 'blk'); }
}
function step(dt) {
  const { a, b } = cb;
  cb.t += dt;
  for (const [f, foe, side] of [[a, b, 'a'], [b, a, 'b']]) for (const r of f.items) {
    if (r.d.heal && !r.used && f.hp <= f.hpMax / 2 && f.hp > 0) {
      r.used = true; const h = lvl(r.d.heal, r.it.lv); f.hp = Math.min(f.hpMax, f.hp + h);
      flashItem(r); fx(side, '+' + h, 'heal'); log(`<span class="${side === 'a' ? 'me' : 'foe'}">${side === 'a' ? 'Você' : f.name}</span> bebe a poção: <b>+${h}</b> de vida`);
    }
    if (!r.d.cd) continue;
    r.t += dt * f.spdMul * (1 + r.haste);
    if (r.t >= r.d.cd) { r.t -= r.d.cd; fire(f, foe, r, side); }
  }
  cb.sec += dt;
  if (cb.sec >= 1) {                                   // a cada segundo: veneno e exaustão
    cb.sec -= 1;
    const tired = cb.t > FATIGUE_AT ? Math.ceil((cb.t - FATIGUE_AT) / 2) : 0;
    for (const [f, side] of [[a, 'a'], [b, 'b']]) {
      if (f.poison) { f.hp -= f.poison; fx(side, '☠-' + f.poison, 'psn'); }
      if (tired) { f.hp -= tired; fx(side, '-' + tired, 'dmg'); }
    }
    if (tired && Math.ceil(cb.t - FATIGUE_AT) === 1) log('<i>Exaustão! Os dois perdem vida a cada segundo.</i>');
  }
  if (a.hp <= 0 || b.hp <= 0) {
    cb.over = true; cb.win = a.hp > 0;                 // empate conta como derrota
    a.hp = Math.max(0, a.hp); b.hp = Math.max(0, b.hp);
    (cb.win ? b : a).dead = .01; if (!cb.win && b.hp <= 0) b.dead = .01;
  }
}
function finishCombat() {
  mode = 'result';
  const round = run.round, name = cb.b.name;
  if (cb.win) {
    const gold = 6 + round * 2, last = round >= ENEMIES.length, ess = essFor(round) + (last ? 10 : 0);
    S.meta.ess += ess; run.ess += ess; S.best = Math.max(S.best, round);
    if (last) {
      const total = run.ess; run = S.run = null; save();
      return modal('🏆 Jornada concluída!', `<p>${name} caiu. Você venceu as ${ENEMIES.length} rodadas!</p><p class="rw">💠 +${ess} de essência <small>(${total} nesta jornada)</small></p>`,
        [['💠 Árvore de melhorias', () => show('tree')], ['Menu', () => show('menu')]]);
    }
    run.gold += gold; run.round++; setupRound();
    return modal('Vitória!', `<p>Você derrotou ${name}.</p><p class="rw">🪙 +${gold} de ouro &nbsp; 💠 +${ess} de essência</p><p class="dim">Próximo inimigo: <b>${run.enemy.n}</b></p>`,
      [['Continuar ▶', toPrep]]);
  }
  run.lives--;
  if (run.lives > 0) {
    run.gold += 3; rollShop(); save();
    return modal('Derrota', `<p>${name} venceu esta luta. Você perdeu uma vida — restam <b>${run.lives}</b>.</p><p class="rw">🪙 +3 de ouro de consolo</p>`, [['Tentar de novo', toPrep]]);
  }
  const total = run.ess; run = S.run = null; save();
  modal('Fim da jornada', `<p>${name} derrotou você na rodada ${round}.</p><p class="rw">💠 ${total} de essência ganha nesta jornada</p><p class="dim">Gaste a essência na árvore: as melhorias são permanentes.</p>`,
    [['💠 Árvore de melhorias', () => show('tree')], ['Menu', () => show('menu')]]);
}
function toPrep() { mode = 'prep'; cb = null; $('#fx').innerHTML = ''; render(); }

/* ======================= Arena (canvas) ======================= */
const cv = $('#cv'), g = cv.getContext('2d'), BG = arenaBg(cv.width, cv.height), GROUND = cv.height - 24;
g.imageSmoothingEnabled = false;
let lastTs = 0;
function drawFighter(f, dir, now) {
  const s = charSprite(f.spr), sc = f.big ? 3 : 2, w = 28 * sc;
  const bob = f.dead ? 0 : Math.round(Math.sin(now / 320 + (dir > 0 ? 0 : 2)));
  const x = Math.round((dir > 0 ? 56 : cv.width - 56 - w) + dir * f.lunge * 16), y = GROUND - 27 * sc + bob;
  g.save();
  if (f.dead) { const k = Math.min(1, f.dead); g.globalAlpha = 1 - k * .65; g.translate(x + w / 2, GROUND); g.rotate(-dir * k * Math.PI / 2); g.translate(-(x + w / 2), -GROUND); }
  g.translate(dir > 0 ? x : x + w, y); g.scale(dir * sc, sc);
  g.drawImage(s.img, 0, 0);
  if (f.flash > 0) { g.globalAlpha = Math.min(1, f.flash); g.drawImage(s.white, 0, 0); }
  g.restore();
}
function frame(ts) {
  requestAnimationFrame(frame);
  const real = Math.min(.1, (ts - lastTs) / 1000 || 0); lastTs = ts;
  if (!$('#game').classList.contains('on') || !view.a) return;
  if (mode === 'combat' && cb) {
    if (!cb.over) { cb.acc += real * S.speed; while (cb.acc >= STEP && !cb.over) { step(STEP); cb.acc -= STEP; } }
    else if ((cb.endT += real) > 1.1) finishCombat();
    updateCombatUI();
  }
  for (const f of [view.a, view.b]) { f.lunge = Math.max(0, f.lunge - real * 5); f.flash = Math.max(0, f.flash - real * 5); if (f.dead) f.dead = Math.min(1, f.dead + real * 2.5); }
  g.drawImage(BG, 0, 0);
  drawFighter(view.a, 1, ts); drawFighter(view.b, -1, ts);
}

/* ======================= Interface ======================= */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  $('#modal').hidden = true; hideTip();
  if (id === 'menu') renderMenu();
  if (id === 'tree') renderTree();
  if (id === 'game') { mode = 'prep'; cb = null; render(); }
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on'); }
function modal(title, body, btns) {
  $('#mo-title').textContent = title; $('#mo-body').innerHTML = body;
  const foot = $('#mo-foot'); foot.innerHTML = '';
  btns.forEach(([t, fn], i) => { const b = el('button', 'btn' + (i ? '' : ' primary'), t); b.onclick = () => { $('#modal').hidden = true; fn(); }; foot.append(b); });
  $('#modal').hidden = false;
}
function log(html) { const l = $('#log'); l.append(el('p', '', html)); while (l.children.length > 80) l.firstChild.remove(); l.scrollTop = l.scrollHeight; }
function fx(side, text, cls) {
  const s = el('span', 'float ' + cls, text);
  s.style.left = (side === 'a' ? 27 : 73) + (Math.random() * 10 - 5) + '%'; s.style.top = 38 + Math.random() * 14 + '%';
  $('#fx').append(s); setTimeout(() => s.remove(), 900);
}
function flashItem(r) { const e = itemEls.get(r.it); if (e) { e.classList.remove('fire'); void e.offsetWidth; e.classList.add('fire'); } }

// Texto do item. r = dados do item já calculados na mochila (bônus dos vizinhos), quando houver
function describe(it, r) {
  const d = ITEMS[it.id], L = [], m = LVM[it.lv - 1];
  if (d.dmg) L.push(`⚔ <b>${lvl(d.dmg, it.lv)}${r && r.bonus ? '+' + r.bonus : ''}</b> de dano a cada <b>${(d.cd / (1 + (r ? r.haste : 0))).toFixed(1)}s</b>`);
  if (d.pierce) L.push(`Perfura: ${pct(d.pierce)} do dano ignora bloqueio`);
  if (d.crush) L.push(`Esmaga: destrói +${d.crush} de bloqueio por golpe`);
  if (d.block) L.push(`🛡 <b>+${lvl(d.block, it.lv)}</b> de bloqueio a cada <b>${(d.cd / (1 + (r ? r.haste : 0))).toFixed(1)}s</b>`);
  if (d.hp) L.push(`❤ <b>+${lvl(d.hp, it.lv)}</b> de vida máxima`);
  if (d.armor) L.push(`Reduz cada golpe sofrido em <b>${it.lv}</b>`);
  if (d.heal) L.push(`Com 50% de vida ou menos, cura <b>${lvl(d.heal, it.lv)}</b> (1× por luta)`);
  if (d.aura) {
    if (d.aura.dmg) L.push(`Armas encostadas: <b>+${lvl(d.aura.dmg, it.lv)}</b> de dano`);
    if (d.aura.haste) L.push(`Armas e escudos encostados ficam <b>${pct(d.aura.haste * m)}</b> mais rápidos`);
    if (d.aura.poison) L.push(`Armas encostadas aplicam <b>${it.lv}</b> de veneno por golpe (☠ dano por segundo)`);
    if (d.aura.steal) L.push(`Armas encostadas curam <b>${pct(d.aura.steal * m)}</b> do dano causado`);
  }
  if (r && r.poison) L.push(`<span class="psn">☠ aplica ${r.poison} de veneno</span>`);
  if (r && r.steal) L.push(`<span class="heal">🩸 cura ${pct(r.steal)} do dano</span>`);
  return L.join('<br>');
}
const runtimeOf = it => [view.a, view.b].flatMap(f => f ? f.items : []).find(r => r.it === it);
const itemTitle = it => `${ITEMS[it.id].n} <span class="stars">${'★'.repeat(it.lv)}${'☆'.repeat(MAX_LV - it.lv)}</span> <small>${ITEMS[it.id].w}×${ITEMS[it.id].h}</small>`;

function showTip(e, it) {
  if (drag && drag.moved) return;
  const t = $('#tip'); t.innerHTML = `<b>${itemTitle(it)}</b><p>${describe(it, runtimeOf(it))}</p>`; t.hidden = false; moveTip(e);
}
function moveTip(e) { const t = $('#tip'); if (t.hidden) return; t.style.left = clamp(e.clientX + 14, 4, innerWidth - t.offsetWidth - 4) + 'px'; t.style.top = clamp(e.clientY - t.offsetHeight - 10, 4, innerHeight - t.offsetHeight - 4) + 'px'; }
function hideTip() { $('#tip').hidden = true; }

function itemEl(it, src) {
  const [w, h] = dims(it), e = el('div', `it k-${ITEMS[it.id].kind} lv${it.lv}` + (sel && sel.it === it ? ' sel' : ''),
    `<img src="${itemImg(it.id, it.r ? 1 : 0)}" draggable="false" alt=""><b>${'★'.repeat(it.lv - 1)}</b>${ITEMS[it.id].cd ? '<i class="cd"></i>' : ''}`);
  e.style.width = `calc(var(--c) * ${w})`; e.style.height = `calc(var(--c) * ${h})`;
  e.onmouseenter = ev => showTip(ev, it); e.onmousemove = moveTip; e.onmouseleave = hideTip;
  if (src === 'enemy') e.onclick = () => { if (mode === 'prep') { sel = { src, it }; render(); } };
  else e.onpointerdown = ev => startDrag(ev, src, it);
  return e;
}
function renderGrid(box, pack, src) {
  box.innerHTML = ''; box.style.width = `calc(var(--c) * ${pack.w})`; box.style.height = `calc(var(--c) * ${pack.h})`;
  for (const it of pack.items) {
    const e = itemEl(it, src); e.style.left = `calc(var(--c) * ${it.x})`; e.style.top = `calc(var(--c) * ${it.y})`;
    if (src === 'pack') e.oncontextmenu = ev => { ev.preventDefault(); rotateInPlace(it); };
    box.append(e); itemEls.set(it, e);
  }
}
function renderPlate(id, f, combat) {
  const p = $(id), r = rates(f);
  p.querySelector('.pn').textContent = f.name;
  p.querySelector('.hp i').style.width = clamp(f.hp / f.hpMax * 100, 0, 100) + '%';
  p.querySelector('.hp span').textContent = `${Math.ceil(f.hp)} / ${f.hpMax}`;
  p.querySelector('.st').innerHTML = combat
    ? `<span class="blk">🛡 ${f.block}</span>${f.poison ? ` <span class="psn">☠ ${f.poison}</span>` : ''}`
    : `⚔ ${r.dps.toFixed(1)}/s &nbsp;🛡 ${r.bps.toFixed(1)}/s${f.armor ? ` &nbsp;⛨ ${f.armor}` : ''}`;
}
function updateCombatUI() {
  renderPlate('#pa', cb.a, true); renderPlate('#pb', cb.b, true);
  for (const f of [cb.a, cb.b]) for (const r of f.items) {
    const e = itemEls.get(r.it); if (!e) continue;
    if (r.d.cd) e.lastChild.style.height = clamp(r.t / r.d.cd * 100, 0, 100) + '%';
    if (r.used) e.classList.add('used');
  }
  const t = $('#timer'); t.textContent = cb.t > FATIGUE_AT ? `⏱ ${cb.t.toFixed(0)}s — exaustão!` : `⏱ ${cb.t.toFixed(0)}s`; t.classList.toggle('hot', cb.t > FATIGUE_AT);
}

function render() {
  if (!run) return;
  const prep = mode === 'prep';
  $('#g-round').textContent = `Rodada ${Math.min(run.round, ENEMIES.length)} / ${ENEMIES.length}`;
  $('#g-lives').textContent = run.lives; $('#g-gold').textContent = run.gold; $('#g-ess').textContent = S.meta.ess;
  $('#game').dataset.mode = mode;
  $('#fight').hidden = !prep; $('#speed').hidden = $('#timer').hidden = prep;
  $('#prep-ui').hidden = !prep; $('#log').hidden = prep;
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.s === S.speed));

  if (mode !== 'result') {                      // no resultado a arena continua mostrando a luta que acabou
    if (prep) view = { a: playerFighter(), b: enemyFighter() };
    itemEls.clear();
    renderGrid($('#pack'), run.pack, 'pack');
    renderGrid($('#epack'), run.enemy.pack, 'enemy');
    $('#e-title').innerHTML = `Mochila de ${run.enemy.n}`;
    renderPlate('#pa', view.a, !prep); renderPlate('#pb', view.b, !prep);
  }

  const st = $('#stash'); st.innerHTML = '';
  run.stash.forEach(it => st.append(itemEl(it, 'stash')));
  $('#stash-n').textContent = `${run.stash.length}/${STASH_MAX}`;

  const sh = $('#shop'); sh.innerHTML = '';
  run.shop.forEach(en => {
    const c = el('div', 'card' + (en.sold ? ' sold' : '') + (price(en.id) > run.gold ? ' poor' : ''));
    if (!en.sold) c.append(itemEl(en, 'shop'));
    c.append(el('span', 'cn', en.sold ? 'vendido' : ITEMS[en.id].n), el('span', 'cp', en.sold ? '' : '🪙 ' + price(en.id)));
    sh.append(c);
  });
  const rc = rerollCost(), rb = el('button', 'btn small reroll', `🎲 Trocar itens (${rc ? '🪙 ' + rc : 'grátis'})`);
  rb.disabled = rc > run.gold; rb.onclick = () => { if (run.free > 0) run.free--; else { run.gold -= rc; run.rerolls++; } rollShop(); sel = null; save(); render(); };
  sh.append(rb);

  const tr = $('#train'); tr.innerHTML = '';
  TRAIN.forEach(t => {
    const n = run.train[t.id], max = n >= TRAIN_MAX, c = trainCost(t);
    const row = el('div', 'trow', `<span class="te">${t.e}</span><div><b>${t.n}</b> <small>${'●'.repeat(n)}${'○'.repeat(TRAIN_MAX - n)}</small><br><small>${t.d}</small></div>`);
    const b = el('button', 'btn small', max ? 'máx.' : '🪙 ' + c); b.disabled = max || c > run.gold;
    b.onclick = () => { run.gold -= c; run.train[t.id]++; save(); render(); };
    row.append(b); tr.append(row);
  });
  renderInfo();
}
function renderInfo() {
  const box = $('#info'); box.innerHTML = '';
  if (!sel || mode !== 'prep') { box.innerHTML = '<p class="dim">Clique num item para ver detalhes, melhorar ou vender. Arraste para arrumar a mochila.</p>'; return; }
  const { src, it } = sel;
  box.innerHTML = `<b>${itemTitle(it)}</b><p>${describe(it, runtimeOf(it))}</p>`;
  const row = el('div', 'row');
  if (src === 'shop') {
    const b = el('button', 'btn small primary', `Comprar 🪙 ${price(it.id)}`); b.disabled = price(it.id) > run.gold || run.stash.length >= STASH_MAX;
    b.onclick = () => { if (buy(it)) { run.stash.push(newItem(it.id)); sel = null; save(); render(); } }; row.append(b);
  } else if (src !== 'enemy') {
    const up = el('button', 'btn small primary', it.lv >= MAX_LV ? 'Nível máx.' : `Melhorar 🪙 ${upCost(it)}`); up.disabled = it.lv >= MAX_LV || upCost(it) > run.gold;
    up.onclick = () => { run.gold -= upCost(it); it.lv++; save(); render(); toast(`${ITEMS[it.id].n} agora é nível ${it.lv}!`); };
    const se = el('button', 'btn small', `Vender 🪙 ${sellValue(it)}`); se.onclick = () => sell(src, it);
    row.append(up, se);
  }
  box.append(row);
}
function buy(entry) {
  const p = price(entry.id);
  if (p > run.gold) { toast('Ouro insuficiente'); return false; }
  run.gold -= p; entry.sold = true; return true;
}
function takeOut(src, it) { const list = src === 'pack' ? run.pack.items : run.stash, i = list.indexOf(it); if (i >= 0) list.splice(i, 1); }
function sell(src, it) { takeOut(src, it); run.gold += sellValue(it); sel = null; save(); render(); }
function rotateInPlace(it) {
  if (mode !== 'prep') return;
  if (!fits(run.pack, it, it.x, it.y, it.r ? 0 : 1, it)) return toast('Não há espaço para girar aqui');
  it.r = it.r ? 0 : 1; save(); render();
}

/* ======================= Arrastar e soltar ======================= */
let drag = null;
const cellPx = () => $('#pack').getBoundingClientRect().width / run.pack.w;
function startDrag(e, src, it) {
  if (mode !== 'prep' || e.button !== 0) return;
  e.preventDefault();
  const c = cellPx(), rc = e.currentTarget.getBoundingClientRect();
  drag = { src, it, r: it.r || 0, sx: e.clientX, sy: e.clientY, moved: false, c,
    ox: src === 'pack' ? (e.clientX - rc.left) / c : .5, oy: src === 'pack' ? (e.clientY - rc.top) / c : .5, from: e.currentTarget };
  addEventListener('pointermove', onDrag); addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
}
function ghostSize() {
  const d = ITEMS[drag.it.id], w = drag.r ? d.h : d.w, h = drag.r ? d.w : d.h, gh = drag.ghost;
  gh.style.width = w * drag.c + 'px'; gh.style.height = h * drag.c + 'px'; gh.firstChild.src = itemImg(drag.it.id, drag.r);
}
function dropTarget(x, y) {
  const inside = (r, m = 0) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
  const pr = $('#pack').getBoundingClientRect(), c = drag.c;
  const gx = Math.round((x - drag.ox * c - pr.left) / c), gy = Math.round((y - drag.oy * c - pr.top) / c);
  if (inside(pr, c / 2)) return { zone: 'pack', x: gx, y: gy, ok: fits(run.pack, drag.it, gx, gy, drag.r, drag.src === 'pack' ? drag.it : null) };
  if (inside($('#sell').getBoundingClientRect())) return { zone: 'sell' };
  if (inside($('#stash').getBoundingClientRect(), 6)) return { zone: 'stash' };
  return null;
}
function onDrag(e) {
  if (!drag) return;
  if (e.clientX != null) { drag.lx = e.clientX; drag.ly = e.clientY; }
  if (!drag.moved) {
    if (Math.hypot(drag.lx - drag.sx, drag.ly - drag.sy) < 5) return;
    drag.moved = true; hideTip();
    drag.ghost = el('div', `it ghost k-${ITEMS[drag.it.id].kind} lv${drag.it.lv}`, '<img alt="" draggable="false">'); document.body.append(drag.ghost); ghostSize();
    drag.from.classList.add('lifted');
    drag.hl = el('div', 'hl'); $('#pack').append(drag.hl);
  }
  const { ghost, hl, c } = drag;
  ghost.style.left = drag.lx - drag.ox * c + 'px'; ghost.style.top = drag.ly - drag.oy * c + 'px';
  const t = dropTarget(drag.lx, drag.ly), d = ITEMS[drag.it.id];
  hl.hidden = !(t && t.zone === 'pack');
  if (!hl.hidden) {
    hl.className = 'hl ' + (t.ok ? 'ok' : 'bad');
    hl.style.left = t.x * c + 'px'; hl.style.top = t.y * c + 'px'; hl.style.width = (drag.r ? d.h : d.w) * c + 'px'; hl.style.height = (drag.r ? d.w : d.h) * c + 'px';
  }
  $('#sell').classList.toggle('over', !!t && t.zone === 'sell' && drag.src !== 'shop');
  $('#stash').classList.toggle('over', !!t && t.zone === 'stash');
}
function rotateDrag() { if (!drag || !drag.moved) return; drag.r = drag.r ? 0 : 1; drag.ox = drag.oy = .5; ghostSize(); onDrag({}); }
function endDrag(e) {
  removeEventListener('pointermove', onDrag); removeEventListener('pointerup', endDrag); removeEventListener('pointercancel', endDrag);
  const d = drag; drag = null; if (!d) return;
  $('#sell').classList.remove('over'); $('#stash').classList.remove('over');
  if (!d.moved) { sel = sel && sel.it === d.it ? null : { src: d.src, it: d.it }; return render(); }
  d.ghost.remove(); d.hl.remove();
  drag = d; const t = e.type === 'pointercancel' ? null : dropTarget(e.clientX, e.clientY); drag = null;
  const { src, it } = d;
  if (t && t.zone === 'pack') {
    if (!t.ok) toast('Não cabe aí');
    else if (src === 'shop') { if (buy(it)) run.pack.items.push(Object.assign(newItem(it.id), { x: t.x, y: t.y, r: d.r })); }
    else { if (src === 'stash') { takeOut('stash', it); run.pack.items.push(it); } Object.assign(it, { x: t.x, y: t.y, r: d.r }); }
  } else if (t && t.zone === 'stash' && src !== 'stash') {
    if (run.stash.length >= STASH_MAX) toast('A reserva está cheia');
    else if (src === 'shop') { if (buy(it)) run.stash.push(newItem(it.id)); }
    else { takeOut('pack', it); it.r = 0; run.stash.push(it); }
  } else if (t && t.zone === 'sell' && src !== 'shop') return sell(src, it);
  if (sel && sel.src === 'shop' && sel.it.sold) sel = null;
  else if (sel && sel.it === it) sel.src = run.pack.items.includes(it) ? 'pack' : 'stash';
  save(); render();
}
addEventListener('keydown', e => {
  if (e.key !== 'r' && e.key !== 'R') return;
  if (drag && drag.moved) rotateDrag(); else if (sel && sel.src === 'pack') rotateInPlace(sel.it);
});
addEventListener('contextmenu', e => { if (drag) { e.preventDefault(); rotateDrag(); } else if (e.target.closest('#game')) e.preventDefault(); });
addEventListener('wheel', () => { if (drag && drag.moved) rotateDrag(); }, { passive: true });

/* ======================= Menu e árvore ======================= */
function renderMenu() {
  $('#m-continue').hidden = !run;
  $('#m-ess').textContent = `(💠 ${S.meta.ess})`;
  $('#m-best').textContent = S.best ? `Melhor jornada: rodada ${S.best} de ${ENEMIES.length}` : '';
  const c = $('#menu-art'), x = c.getContext('2d'); x.clearRect(0, 0, 84, 28);
  x.drawImage(charSprite('hero').img, 0, 0); x.save(); x.translate(84, 0); x.scale(-1, 1); x.drawImage(charSprite('king').img, 0, 0); x.restore();
}
function renderTree() {
  const CW = 166, RH = 112, NW = 154, NH = 84, area = $('#tree-area'), svg = $('#tree-lines');
  $('#t-ess').textContent = S.meta.ess;
  area.querySelectorAll('.node').forEach(n => n.remove());
  area.style.width = CW * 6.5 + 'px'; area.style.height = RH * 4 + 'px';
  const pos = n => [n.x * CW + NW / 2 + 8, n.y * RH + 8];
  let lines = '';
  NODES.forEach(n => {
    const own = S.meta.nodes.includes(n.id), open = !n.req || S.meta.nodes.includes(n.req), [x, y] = pos(n);
    if (n.req) { const [px, py] = pos(NODES.find(m => m.id === n.req)); lines += `<path d="M${px} ${py + NH} V${py + NH + 14} H${x} V${y}" class="${own ? 'own' : open ? 'open' : ''}"/>`; }
    const b = el('button', 'node ' + (own ? 'own' : open ? (S.meta.ess >= n.cost ? 'can' : 'open') : 'locked'),
      `<span class="ne">${n.e}</span><b>${n.n}</b><small>${n.d}</small><i>${own ? '✔ ativo' : '💠 ' + n.cost}</i>`);
    b.style.left = x - NW / 2 + 'px'; b.style.top = y + 'px'; b.style.width = NW + 'px'; b.style.height = NH + 'px';
    b.disabled = own || !open;
    b.onclick = () => {
      if (S.meta.ess < n.cost) return toast('Essência insuficiente');
      S.meta.ess -= n.cost; S.meta.nodes.push(n.id); save(); renderTree();
    };
    area.append(b);
  });
  svg.setAttribute('width', CW * 6.5); svg.setAttribute('height', RH * 4); svg.innerHTML = lines;
}

/* ======================= Ligações ======================= */
$('#m-new').onclick = () => {
  const go = () => { newRun(); show('game'); };
  if (!run) return go();
  modal('Nova jornada?', '<p>A jornada em andamento será abandonada. A essência já ganha fica com você.</p>', [['Começar de novo', go], ['Cancelar', () => {}]]);
};
$('#m-continue').onclick = () => show('game');
$('#m-tree').onclick = () => show('tree');
$('#t-back').onclick = () => show('menu');
$('#g-menu').onclick = () => { if (mode === 'combat') return toast('Termine a luta primeiro'); show('menu'); };
$('#fight').onclick = startCombat;
document.querySelectorAll('#speed button').forEach(b => b.onclick = () => { S.speed = +b.dataset.s; save(); render(); });
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(o => o.classList.toggle('on', o === b));
  $('#shop').hidden = b.dataset.tab !== 'shop'; $('#train').hidden = b.dataset.tab !== 'train';
});

renderMenu();
requestAnimationFrame(frame);

/* Modo de demonstração (para testar telas): ?demo=prep, ?demo=combat, ?demo=end ou ?demo=tree. Não grava nada. */
const DEMO = new URLSearchParams(location.search).get('demo');
if (DEMO) {
  save = () => {};
  S.meta = { ess: 14, nodes: ['vit1', 'pack1', 'str1'] };
  newRun(); run.round = 7; run.gold = 40;
  run.pack.items = [['whet', 1, 0, 0], ['sword', 2, 1, 0], ['wshield', 1, 2, 0], ['dagger', 1, 4, 0], ['venom', 1, 5, 0], ['helmet', 3, 4, 2], ['potion', 1, 0, 1], ['spear', 1, 0, 3, 1]]
    .map(([id, lv, x, y, r]) => Object.assign(newItem(id, lv), { x, y, r: r || 0 }));
  run.stash = [newItem('axe'), newItem('ring'), newItem('ishield', 2)];
  setupRound();
  if (DEMO === 'tree') show('tree'); else { show('game'); if (DEMO === 'combat' || DEMO === 'end') { startCombat(); if (DEMO === 'end') { while (!cb.over) step(STEP); updateCombatUI(); finishCombat(); } } }
}
