/* Motor de tradução: traduz textos e atributos do DOM em tempo real */

const IDX = { pt: 0, en: 1 }, LOC = { pt: 'pt-BR', en: 'en-US' };
const DICT = new Map(), PATS = []; let curLang = 'pt';
D.forEach(r => { if (r[0].includes('{}')) PATS.push([new RegExp('^' + r[0].replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\}/g, '(.+?)') + '$'), r]); else DICT.set(r[0], r); });
function tr(str, lang = pref.lang) {
  if (lang === 'pt' || !str) return str;
  const m = str.match(/^([^\p{L}\p{N}]*)([\s\S]*?)(\s*)$/u), core = m[2], i = IDX[lang]; if (!core) return str;
  let out = null; const r = DICT.get(core);
  if (r) out = r[i] || r[1];
  else if (/ [·—] /.test(core)) { const parts = core.split(/( [·—] )/), t = parts.map((p, j) => j % 2 ? p : tr(p, lang)); if (t.join('') !== core) out = t.join(''); }
  else for (const [re, row] of PATS) { const x = core.match(re); if (x) { let n = 0; out = (row[i] || row[1]).replace(/\{\}/g, () => x[++n] || ''); break; } }
  return out == null ? str : m[1] + out + m[3];
}
const SRC = new WeakMap(), ASRC = new WeakMap(), ATTRS = ['placeholder', 'title', 'aria-label', 'data-label'], SKIP = '.term, script, style';
function textNode(n) {
  const cur = n.nodeValue, e = SRC.get(n);
  if (e && e.out === cur) { const o = tr(e.src); if (o !== cur) { n.nodeValue = o; e.out = o; } return; }
  const o = tr(cur); SRC.set(n, { src: cur, out: o }); if (o !== cur) n.nodeValue = o;
}
function attrsOf(el) {
  ATTRS.forEach(a => {
    const cur = el.getAttribute && el.getAttribute(a); if (cur == null) return;
    let m = ASRC.get(el); if (!m) ASRC.set(el, m = {}); const e = m[a];
    if (e && e.out === cur) { const o = tr(e.src); if (o !== cur) { el.setAttribute(a, o); e.out = o; } return; }
    const o = tr(cur); m[a] = { src: cur, out: o }; if (o !== cur) el.setAttribute(a, o);
  });
}
function walk(root) {
  if (root.nodeType === 3) { if (root.parentElement && !root.parentElement.closest(SKIP)) textNode(root); return; }
  if (root.nodeType !== 1 || root.closest(SKIP)) return;
  attrsOf(root); const tw = document.createTreeWalker(root, 5); let n;
  while ((n = tw.nextNode())) { if (n.nodeType === 3) { if (!n.parentElement.closest(SKIP)) textNode(n); } else attrsOf(n); }
}
function setLang(l) {
  curLang = l; document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  walk(document.body); tick();
}
new MutationObserver(ms => ms.forEach(m => {
  if (m.type === 'characterData') walk(m.target); else if (m.type === 'attributes') attrsOf(m.target); else m.addedNodes.forEach(walk);
})).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
