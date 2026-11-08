/* Notificações (piadas), sino e janela de atualização */

const JOKES = [
  { i: '⬇️', t: 'Atualização do sistema', m: 'PIRATINHA OS 9.0.1 está pronto. Clique para instalar.', u: 1 },
  { i: '🎮', t: 'Barba-Negra', m: 'começou a jogar DOOM.', g: 1 },
  { i: '🦜', t: 'Papagaio', m: 'instalou 14 extensões sem perguntar.' },
  { i: '🛡️', t: 'Antivírus', m: 'tirou o dia de folga.' },
  { i: '📦', t: 'tesouro.zip', m: 'terminou de baixar. Ninguém sabe onde.' },
  { i: '🔋', t: 'Bateria', m: 'em 100%. Desconfie.' },
  { i: '☠️', t: 'Download iniciado', m: 'Baixando trojan.exe… 99%' },
  { i: '🤖', t: 'Copilot', m: 'Adquira seu Copilot grátis! Sem pegadinhas. Talvez.' },
  { i: '🐋', t: 'Notas da versão', m: 'Removemos o bug da baleia.' },
  { i: '📢', t: 'Anúncio', m: 'GTA VII foi anunciado. Previsão de lançamento: depois do GTA VI.' },
  { i: '🖥️', t: 'Oferta imperdível', m: 'Adquira sua placa de vídeo virtual. 0 FPS garantidos.' },
  { i: '📍', t: 'Perto de você', m: 'Femboys na sua área a 5 km!' },
  { i: '📍', t: 'Perto de você', m: 'Garotas gamer na sua área a 1 km!' },
  { i: '⏳', t: 'Update', m: 'Um update seco, seco, seco logo chegará.' },
  { i: '💾', t: 'Download', m: 'Baixando mais RAM… 8 GB de 8 GB. Quase lá.' },
  { i: '🎁', t: 'Parabéns!', m: 'Seu PC foi selecionado para ganhar um PC.' },
  { i: '🕒', t: 'Atualização', m: 'Faltam 3 minutos (estimativa feita há 3 horas).' },
  { i: '🔒', t: 'Pir-Ate Defender', m: 'Detectou 0 ameaças. Duvidamos.' },
  { i: '📶', t: 'Rede', m: 'Você está conectado à internet. Tente não atrapalhar.' },
];
const updNote = () => ({ i: '⬇️', t: 'Atualização do sistema', m: 'PIRATINHA OS ' + nextVer() + ' está pronto. Clique para instalar.', u: 1 });
const NOTES = [], bell = $('#bell'), npanel = $('#npanel'), toasts = $('#toasts'); let lastJ = -1, unread = 0; const dot = $('.dot', bell);
const actNote = n => { if (n.u === 1) openUpdate(); else if (n.u === 2) openUpdate(true); };
function drawPanel() {
  npanel.innerHTML = ''; const h = document.createElement('div'); h.className = 'nh'; const t = document.createElement('b'); t.textContent = 'Notificações';
  const sw = document.createElement('button'); sw.className = 'pill'; sw.textContent = pref.notif ? 'Desativar' : 'Ativar';
  sw.onclick = () => { pref.notif = !pref.notif; applyPrefs(); drawPanel(); }; h.append(t, sw); npanel.append(h);
  if (!NOTES.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = pref.notif ? 'Nenhuma notificação ainda.' : 'Notificações desativadas.'; npanel.append(p); }
  NOTES.forEach(n => {
    const r = document.createElement('button'), a = document.createElement('span'), b = document.createElement('span'), s = document.createElement('small');
    r.className = 'srow'; a.textContent = n.i; b.className = 'grow'; b.style.whiteSpace = 'normal'; b.textContent = n.t + ' — ' + n.m;
    s.textContent = n.time.toLocaleTimeString(LOC[pref.lang], { hour: '2-digit', minute: '2-digit' }); r.append(a, b, s);
    r.onclick = () => { npanel.style.display = 'none'; actNote(n); }; npanel.append(r);
  });
}
function pushNote(j) {
  const n = Object.assign({ time: new Date() }, j); NOTES.unshift(n); if (NOTES.length > 40) NOTES.pop();
  const t = document.createElement('div'); t.className = 'toast' + (j.g ? ' game' : ''); t.innerHTML = '<span class="ti"></span><div><b></b><em></em></div>';
  $('.ti', t).textContent = j.i; $('b', t).textContent = j.t; $('em', t).textContent = j.m;
  const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
  t.onclick = () => { actNote(n); kill(); }; toasts.append(t); setTimeout(kill, 8000);
  if (npanel.style.display === 'block') drawPanel(); else { unread++; dot.textContent = unread > 9 ? '9+' : unread; bell.classList.add('alert'); }
}
bell.onclick = e => { e.stopPropagation(); const open = npanel.style.display === 'block'; npanel.style.display = open ? 'none' : 'block'; if (!open) { unread = 0; dot.textContent = ''; bell.classList.remove('alert'); drawPanel(); } };
document.addEventListener('pointerdown', e => { if (!e.target.closest('#npanel') && !e.target.closest('#bell')) npanel.style.display = 'none'; });
let fireN = 0;
function fire() {
  if (pref.notif) {
    fireN++; if (fireN % 3 === 0) pushNote(updNote());                      // a cada 15 min: atualização
    else { let k; do { k = 1 + (Math.random() * (JOKES.length - 1) | 0); } while (k === lastJ); lastJ = k; pushNote(JOKES[k]); }   // a cada 5 min: piada
  }
  setTimeout(fire, 5 * 60000);
}
setTimeout(fire, 5 * 60000);
lastJ = 0; setTimeout(() => { if (pref.notif) pushNote(updNote()); }, 4000);   // ao abrir o site: pede a atualização do sistema
function openUpdate(done) {
  createWindow({ id: 'sys:update', title: 'Atualização do sistema', mk: etile('⬇️'), w: 460, h: 300, sys: true, body: (v, w) => {
    v.innerHTML = '<p class="us" style="margin:6px 0 14px">Preparando…</p><div class="pbar"><i></i></div><p class="up" style="color:var(--text-dim);font-size:13px"></p><div class="uact" style="display:none;gap:8px;margin-top:14px"><button class="pill ok">Reiniciar agora</button><button class="pill later">Mais tarde</button></div>';
    const us = $('.us', v), bar = $('.pbar i', v), up = $('.up', v), ua = $('.uact', v), close = () => w.el.querySelector('.close').click();
    const STEPS = ['Baixando PIRATINHA OS ' + nextVer() + '…', 'Instalando o papagaio…', 'Reconfigurando o tesouro…', 'Procurando o mapa… (não achei)', 'Finalizando…'];
    const finish = () => { us.textContent = 'Atualização concluída. É preciso reiniciar para aplicá-la.'; bar.style.width = '100%'; up.textContent = ''; ua.style.display = 'flex'; };
    $('.ok', v).onclick = () => { close(); reboot(); };
    $('.later', v).onclick = () => { close(); setTimeout(() => { if (pref.notif) pushNote({ i: '🔄', t: 'Reinício pendente', m: 'Reinicie para concluir a atualização.', u: 2 }); }, 120000); };
    if (done) return finish(); let p = 0; const t0 = Date.now();
    const iv = setInterval(() => { if (!v.isConnected) return clearInterval(iv); p = Math.min(100, (Date.now() - t0) / 80); bar.style.width = p + '%'; us.textContent = STEPS[Math.min(4, p / 20 | 0)]; up.textContent = (p | 0) + '%'; if (p >= 100) { clearInterval(iv); finish(); } }, 450);
  } });
}
