/* Monitor do sistema (falso): picos aleatórios e alertas de mineração ou vírus */

const mon = document.createElement('div'); mon.id = 'wmon'; mon.className = 'wd';
mon.innerHTML = '<div class="whead"><span>Monitor do sistema</span></div><div class="mrow"><span>CPU</span><canvas width="120" height="28"></canvas><b></b></div><div class="mrow"><span>RAM</span><canvas width="120" height="28"></canvas><b></b></div><div class="mrow"><span>Rede</span><canvas width="120" height="28"></canvas><b></b></div><div class="malert" hidden><div class="mtx"></div><button class="pill">Encerrar processo</button></div>';
os.append(mon); dragWidget(mon, $('.whead', mon), 'mon');
{
  const cvs = [...mon.querySelectorAll('canvas')], vals = [...mon.querySelectorAll('.mrow b')], al = $('.malert', mon), tx = $('.mtx', mon), btn = $('.malert button', mon);
  const H = [[], [], []], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let cpu = 18, ram = 46, net = 6, spike = 0, mining = 0, next = 45 + Math.random() * 60;
  const NAMES = { mine: ['xmrig.exe', 'minerd.exe', 'parrot-miner.bin', 'coinhive.js'], virus: ['trojan.win32.fishy', 'worm.parrot.a', 'adware.gancho.exe'] };
  const alertOn = kind => {
    const name = NAMES[kind][Math.random() * NAMES[kind].length | 0], msg = (kind === 'mine' ? 'Mineração de criptomoeda detectada: ' : 'Possível vírus detectado: ') + name;
    mining = 25; tx.textContent = msg; btn.hidden = false; al.hidden = false; if (pref.notif) pushNote({ i: '⚠️', t: 'Monitor do sistema', m: msg });
  };
  const stop = () => { mining = 0; tx.textContent = 'Processo encerrado.'; btn.hidden = true; setTimeout(() => { if (!mining) al.hidden = true; }, 2500); };
  btn.onclick = stop;
  const spark = (cv, arr, max) => { const g = cv.getContext('2d'); g.clearRect(0, 0, 120, 28); g.strokeStyle = mining ? '#ff6b6b' : pref.ac; g.lineWidth = 1.6; g.beginPath(); arr.forEach((v, i) => { const x = i * 3, y = 27 - v / max * 26; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); };
  setInterval(() => {
    if (mon.hidden) return;
    next -= 1; if (!mining && next <= 0) { alertOn(Math.random() < .65 ? 'mine' : 'virus'); next = 180 + Math.random() * 180; }
    if (mining) { mining--; if (!mining) stop(); }
    spike = Math.max(0, spike - 1); if (!spike && Math.random() < .07) spike = 2 + Math.random() * 4 | 0;
    cpu = mining ? 90 + Math.random() * 9 : clamp(cpu + (Math.random() - .5) * 12 + (spike ? 22 : 0) - (cpu > 35 ? 5 : 0), 3, 99);
    ram = clamp(ram + (Math.random() - .5) * 2.5 + (mining ? .7 : -.15), 30, 96);
    net = clamp(net + (Math.random() - .5) * 7 + (spike ? 18 : 0) + (mining ? 5 : 0) - (net > 25 ? 4 : 0), 0, 100);
    [cpu, ram, net].forEach((v, i) => { H[i].push(v); if (H[i].length > 40) H[i].shift(); spark(cvs[i], H[i], 100); });
    vals[0].textContent = (cpu | 0) + '%'; vals[1].textContent = (ram | 0) + '%'; vals[2].textContent = (net | 0) + ' Mb/s';
  }, 1000);
}
