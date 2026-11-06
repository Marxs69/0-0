/* Atalhos de DOM e armazenamento local (localStorage com tratamento de erro) */

const $ = (s, r = document) => r.querySelector(s);
const os = $('#os'), desk = $('#desktop'), startEl = $('#start'), startBtn = $('#startbtn');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
