/* Widget de música (arquivos locais) */

const wg = $('#widget');
wg.innerHTML = '<button class="wic" title="Música">🎵</button><div class="wbody"><div class="whead"><span>Música</span><button class="wmin wbtn" title="Minimizar">–</button></div><div class="np">Nenhuma faixa</div><audio controls></audio><div class="wl"></div><label class="pill">+ Arquivos<input type="file" accept="audio/*" multiple hidden></label></div>';
{ const list = []; let i = -1; const au = $('audio', wg), np = $('.np', wg), pl = $('.wl', wg);
  const draw = () => { pl.innerHTML = ''; list.forEach((t, k) => { const b = document.createElement('button'); b.className = 'srow' + (k === i ? ' on' : ''); b.textContent = t.name; b.onclick = () => play(k); pl.append(b); }); };
  function play(k) { if (k < 0 || k >= list.length) return; i = k; au.src = list[k].url; au.play(); np.textContent = list[k].name; draw(); }
  $('input', wg).onchange = e => { [...e.target.files].forEach(f => list.push({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) })); if (i < 0) play(0); else draw(); e.target.value = ''; };
  au.onended = () => play(i + 1);
  $('.wmin', wg).onclick = () => { pref.wm = true; applyPrefs(); }; $('.wic', wg).onclick = () => { pref.wm = false; applyPrefs(); }; }
wg.classList.add('wd'); dragWidget(wg, $('.whead', wg), 'music');
