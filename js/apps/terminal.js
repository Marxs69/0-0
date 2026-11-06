/* Terminal falso (help, neofetch, cowsay, sudo fishmen -ins…) */

function browserName() {
  const u = navigator.userAgent; if (navigator.brave) return 'Brave';
  for (const [k, n] of [['Edg', 'Edge'], ['OPR', 'Opera'], ['Firefox', 'Firefox'], ['Chrome', 'Chrome'], ['Version', 'Safari']]) { const m = u.match(new RegExp(k + '/(\\d+)')); if (m) return n + ' ' + m[1]; }
  return 'Desconhecido';
}
function openTerm() {
  createWindow({ id: 'sys:term', title: 'Terminal', mk: etile('💻'), w: 760, h: 420, sys: true, body: v => {
    v.innerHTML = '<div class="term"><div class="out"></div><div class="in"><span>piratinha@web:~$&nbsp;</span><input type="text" spellcheck="false" autocomplete="off"></div></div>';
    const term = $('.term', v), out = $('.out', v), inp = $('input', v), hist = []; let hi = 0, pending = null;
    const print = t => { const d = document.createElement('div'); d.textContent = t; out.append(d); term.scrollTop = term.scrollHeight; return d; };
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const pbar = async (l, ms) => { const d = print(''), t0 = Date.now(); for (;;) { const p = Math.min(1, (Date.now() - t0) / ms), n = p * 40 | 0; d.textContent = l + ' [' + '█'.repeat(n) + '░'.repeat(40 - n) + '] ' + (p * 100 | 0) + '%'; term.scrollTop = term.scrollHeight; if (p >= 1) break; await sleep(100); } };
    const LOGO = ["                  ~.", "           Ya...___|__..aab     .   .", "            Y88a  Y88o  Y88a   (     )", "             Y88b  Y88b  Y88b   `.oo'", "             :888  :888  :888  ( (`-'", "    .---.    d88P  d88P  d88P   `.`.", "   / .-._)  d8P'\"\"\"|\"\"\"'-Y8P      `.`.", "  ( (`._) .-.  .-. |.-.  .-.  .-.   ) )", "   \\ `---( O )( O )( O )( O )( O )-' /", "    `.    `-'  `-'  `-'  `-'  `-'  .'", "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"];
    const LW = Math.max(...LOGO.map(l => l.length)) + 3;
    const CMDS = {
      help: () => print('Commands: help, neofetch, cowsay <text>, matrix, hack, fortune, sl, bsod, sudo fishmen -ins, shutdown now, restart now, date, echo <text>, whoami, ls, clear'),
      sudo: async a => { if (/^fishmen(\s+-ins)?$/.test(a.trim())) return CMDS.fishmen(a.trim().replace(/^fishmen\s*/, ''), true); print('pirate is not in the sudoers file. This incident will be reported to the parrot.'); },
      fishmen: async (a, root) => {
        if (!root) return print('fishmen: permission denied. Try: sudo fishmen -ins'); if (a.trim() !== '-ins') return print('usage: sudo fishmen -ins');
        print('Checking for updates…'); await sleep(700); print('Found: PIRATINHA OS ' + nextVer()); await pbar('Downloading', 8000); await pbar('Installing  ', 3000);
        print('Update installed. A restart is required to finish.'); print('Restart now? [y/N]');
        pending = s => { if (/^y(es)?$/i.test(s.trim())) reboot(); else print('Okay. Restart later with: restart now'); };
      },
      fortune: () => print(['Silence is consent. Downloading is repacking.', 'Every treasure has a map. Yours is in the other coat.', 'Today is a good day to make a backup.', 'The parrot knows your password.', 'An update is just a restart with hope.'][Math.random() * 5 | 0]),
      bsod: () => bsod(), reboot: () => reboot(), shutdown: a => (/^now$/.test(a.trim()) ? shutdown() : print('usage: shutdown now')), restart: a => (/^now$/.test(a.trim()) ? reboot() : print('usage: restart now')),
      sl: async () => { const T = ['      ____            ', ' ____|    |======    ', '|____|____|__O__O____', '   (o)(o)(o)(o)      ']; const d = print(''); for (let i = 0; i < 60; i += 2) { d.textContent = T.map(l => ' '.repeat(i) + l).join('\n'); await sleep(35); } d.remove(); print('Choo choo!'); },
      clear: () => { out.innerHTML = ''; },
      date: () => print(new Date().toLocaleString(LOC[pref.lang])),
      echo: a => print(a), whoami: () => print('pirata'), ls: () => print('assets/  css/  games/  js/  index.html  README.md  treasure.txt'),
      neofetch: () => {
        const apps = LINKS.filter(l => !OFF.has(idOf(l))).length, v = verAt(vIdx - 1);
        const info = ['pirata@piratinha', '-----------------', 'OS: PiratinhaOS ' + v + ' x86', 'Kernel: ' + browserName(), 'Uptime: ' + Math.round((Date.now() - BOOT) / 1000) + 's', 'Packages: ' + apps + ' (shipping)', 'Shell: fishing 6.7.' + vIdx, 'WM: Pir-Ate 1.' + vIdx + ' (WM)', 'Terminal: Arrg 0.50.' + (2 + vIdx), 'Display: ' + screen.width + 'x' + screen.height + '@60Hz', 'Font: Futura Medium Condensed BT', 'CPU: Intel Celeron G1610 (2) @ 2.60GHz', 'GPU: Intel HD Graphics', 'IP: 192.168.1.1', 'Wallpaper: ' + current.n, 'Open windows: ' + wins.size, 'Glass: ' + pref.c];
        print(Array.from({ length: Math.max(LOGO.length, info.length) }, (_, i) => (LOGO[i] || '').padEnd(LW) + (info[i] || '')).join('\n'));
      },
      cowsay: a => { a = a || 'Arrr!'; print(' ' + '_'.repeat(a.length + 2) + '\n< ' + a + ' >\n ' + '-'.repeat(a.length + 2) + '\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||'); },
      hack: async () => {
        const bar = async l => { const d = print(''); for (let i = 0; i <= 40; i++) { d.textContent = l + ' [' + '█'.repeat(i) + '░'.repeat(40 - i) + '] ' + (i * 2.5 | 0) + '%'; term.scrollTop = term.scrollHeight; await sleep(35); } };
        await bar('Connecting to server'); await bar('Breaking the firewall'); await bar('Downloading treasure.zip'); print('Access granted.');
      },
      matrix: async () => { const d = print(''); d.style.color = '#22c55e'; for (let i = 0; i < 24; i++) { d.textContent += Array.from({ length: 56 }, () => String.fromCharCode(0xff66 + Math.random() * 50 | 0)).join('') + '\n'; term.scrollTop = term.scrollHeight; await sleep(110); } },
    };
    const run = async s => { print('$ ' + s); const [c, ...a] = s.trim().split(/\s+/); if (!c) return; const f = CMDS[c]; if (f) await f(a.join(' ')); else print(c + ': command not found. Type help.'); };
    inp.onkeydown = e => {
      if (e.key === 'Enter') { const s = inp.value; inp.value = ''; if (pending) { const f = pending; pending = null; print('> ' + s); f(s); return; } if (s.trim()) { hist.push(s); hi = hist.length; } run(s); }
      else if (e.key === 'ArrowUp' && hi > 0) inp.value = hist[--hi]; else if (e.key === 'ArrowDown') inp.value = hist[++hi] || '';
    };
    term.onclick = () => inp.focus(); CMDS.neofetch(); print('Type help.'); setTimeout(() => inp.focus(), 50);
  } });
}
