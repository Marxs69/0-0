/* Relógio em tempo real (sincronizado com a virada do minuto) */

function tick() {
  const d = new Date(), o = { hour: '2-digit', minute: '2-digit', hour12: !pref.h24 }; if (pref.sec) o.second = '2-digit';
  $('#clock').innerHTML = d.toLocaleTimeString(LOC[pref.lang], o) + '<small>' + d.toLocaleDateString(LOC[pref.lang]) + '</small>';
  clearTimeout(tick.t); tick.t = setTimeout(tick, (pref.sec ? 1000 : 60000 - d.getSeconds() * 1000) - d.getMilliseconds() + 30);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
