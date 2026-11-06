/* Frase do dia */

const FRASES = ['Todo bug é uma feature com baixa autoestima.', 'Quem tem backup não tem medo de reiniciar.', 'O papagaio disse que a senha é 123456. Nós avisamos.', 'Baixar é fácil. Difícil é achar o botão de download certo.', 'Se o jogo travou, a culpa é do ping. Sempre do ping.', 'Limpar o cache resolve tudo. Menos a vida.', 'Um bom pirata desconfia de todo botão verde gigante.', 'Hoje é um ótimo dia para atualizar. Amanhã também.'];
const qw = document.createElement('div'); qw.id = 'wq'; qw.className = 'wd';
qw.innerHTML = '<div class="whead"><span>Frase do dia</span><button class="wbtn" title="Outra">↻</button></div><div class="qt"></div>';
os.append(qw); dragWidget(qw, $('.whead', qw), 'quote');
{ let k = Math.floor(Date.now() / 864e5) % FRASES.length; const t = $('.qt', qw); t.textContent = FRASES[k]; $('.wbtn', qw).onclick = () => { k = (k + 1) % FRASES.length; t.textContent = FRASES[k]; }; }
