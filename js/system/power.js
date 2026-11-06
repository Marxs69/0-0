/* Reiniciar, desligar, atualização forçada, tela azul e aviso de confirmação */

let BOOT = Date.now();
function ask(msg, ok) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = '<div class="box"><p></p><div class="mb"><button class="pill">Cancelar</button><button class="pill danger">Confirmar</button></div></div>'; $('p', m).textContent = msg;
  const [c, y] = m.querySelectorAll('button'); c.onclick = () => m.remove(); y.onclick = () => { m.remove(); ok(); }; os.append(m); c.focus();
}
const blk = txt => { const d = document.createElement('div'); d.className = 'blackout'; d.textContent = txt; document.body.append(d); return d; };
function coldStart() {
  [...wins.values()].forEach(w => { w.el.remove(); if (w.btn.classList.contains('task')) w.btn.remove(); else w.btn.classList.remove('open', 'active'); });
  wins.clear(); active = null; BOOT = Date.now(); closeStart(); ctx.style.display = 'none'; npanel.style.display = 'none';
  for (let i = ORDER.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [ORDER[i], ORDER[j]] = [ORDER[j], ORDER[i]]; }
  Object.keys(saved).forEach(k => delete saved[k]); frozen = false; layoutAll();
}
const VERS = ['9.0.1', '9.0.2', '9.0.3', '9.0.5', '9.0.8', '9.1.0', '9.1.1', '9.1.4', '9.2.0'];
let vIdx = +store.get('piratinha-vidx', 0) || 0;
const verAt = i => i < 0 ? '9.0.0' : VERS[i] || '9.' + (3 + Math.floor((i - VERS.length) / 5)) + '.' + ((i - VERS.length) % 5 * 2 + 1);
const nextVer = () => verAt(vIdx);
const announce = () => setTimeout(() => { if (pref.notif) pushNote(updNote()); }, 3000);
function forcedUpdate(then) {
  const d = document.createElement('div'); d.className = 'blackout upd';
  d.innerHTML = '<div><div class="spin"></div><p>Instalando atualizações</p><p class="up2">0%</p><p class="uw">Não desligue o computador (PIRATINHA OS ' + nextVer() + ')</p></div>'; document.body.append(d); let p = 0; const t0 = Date.now();
  const iv = setInterval(() => { p = Math.min(100, (Date.now() - t0) / 150); $('.up2', d).textContent = (p | 0) + '%'; if (p >= 100) { clearInterval(iv); vIdx++; store.set('piratinha-vidx', vIdx); d.remove(); then(); } }, 350);
}
function powerDialog() {                                  // duas opções em blocos, com aviso da atualização forçada
  closeStart(); const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = '<div class="box"><div class="pwb"><button class="p1"><i>⏻</i><span>Desligar</span></button><button class="p2"><i>⟳</i><span>Reiniciar</span></button></div><p class="pwn"></p><div class="mb"><button class="pill">Cancelar</button></div></div>';
  $('.pwn', m).textContent = 'Uma atualização do sistema será instalada antes de continuar (PIRATINHA OS ' + nextVer() + ').';
  $('.p1', m).onclick = () => { m.remove(); shutdown(); }; $('.p2', m).onclick = () => { m.remove(); reboot(); }; $('.mb button', m).onclick = () => m.remove(); os.append(m);
}
function reboot() {
  closeStart();
  forcedUpdate(() => { const d = blk('Reiniciando…'); setTimeout(() => { coldStart(); d.remove(); announce(); }, 1600); });
}
function shutdown() {
  closeStart();
  forcedUpdate(() => {
    const d = blk('Sistema desligado. Clique ou pressione uma tecla para ligar.');
    const on = () => { document.removeEventListener('keydown', on); d.remove(); coldStart(); announce(); };
    setTimeout(() => { document.addEventListener('keydown', on); d.onclick = on; }, 400);
  });
}
function bsod() {
  const d = document.createElement('div'); d.className = 'bsod';
  d.innerHTML = '<div style="font-size:90px">:(</div><p>Seu PIRATINHA OS encontrou um problema e precisa reiniciar. Estamos coletando algumas informações de erro e já reiniciamos para você.</p><p class="bp">0% concluído</p><p style="font-size:13px;opacity:.8">Código de parada: PAPAGAIO_COMEU_O_CABO</p>'; document.body.append(d);
  let p = 0; const iv = setInterval(() => { p += 5 + Math.random() * 10; if (p >= 100) { clearInterval(iv); d.remove(); reboot(); } else $('.bp', d).textContent = (p | 0) + '% concluído'; }, 400);
}
$('#st-off').onclick = () => powerDialog();
