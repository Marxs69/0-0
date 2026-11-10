/* Lista de sites, jogos e apps. Adicione novos itens aqui. */

const GROUPS = [   // divisórias do modo antigo e do menu Iniciar, na ordem em que aparecem
  ['repack', 'Repack'],
  ['scene', 'Scene'],
  ['tools', 'Tools'],
  ['out', 'Outros'],
];
const ICO = f => './assets/icons/sites/' + f + '.png';   // ícone de reserva, usado quando o Google não tem um bom
const LINKS = [
  { n: 'DODI Repacks',        u: 'https://dodi-repacks.site/',                       g: 'repack', i: ICO('dodi-repacks-site') },
  { n: 'FitGirl Repacks',     u: 'https://fitgirl-repacks.site/',                    g: 'repack', i: ICO('fitgirl-repacks-site') },
  { n: 'GameBounty',          u: 'https://gamebounty.world/',                        g: 'repack', i: ICO('gamebounty-world') },
  { n: 'KaOsKrew',            u: 'https://www.kaoskrew.org/viewforum.php?f=13',      g: 'repack', i: ICO('kaoskrew-org') },
  { n: 'Appnetica',           u: 'https://appnetica.com/',                           g: 'scene',  i: ICO('appnetica-com') },
  { n: 'GLOAD',               u: 'https://gload.to/',                                g: 'scene',  i: ICO('gload-to') },
  { n: 'Old Games Download',  u: 'https://oldgamesdownload.com/browse/platform/',    g: 'scene',  i: ICO('oldgamesdownload-com') },
  { n: 'My Abandonware',      u: 'https://www.myabandonware.com/',                   g: 'scene',  i: ICO('myabandonware-com') },
  { n: 'RexaGames',           u: 'https://rexagames.com/',                           g: 'scene',  i: ICO('rexagames-com') },
  { n: 'ByXatab',             u: 'https://byxatab.com/',                             g: 'scene',  i: ICO('byxatab-com') },
  { n: 'Online-Fix',          u: 'https://online-fix.me/',                        g: 'tools',  i: ICO('online-fix-me') },
  { n: 'FLiNG Trainer',       u: 'https://flingtrainer.com/',                        g: 'tools',  i: ICO('flingtrainer-com') },
  { n: 'GameCopyWorld',       u: 'https://gamecopyworld.com/games/index.php',        g: 'tools',  i: ICO('gamecopyworld-com') },
  { n: 'BetterRepack',        u: 'https://dl.betterrepack.com/public/',              g: 'out',    i: ICO('dl-betterrepack-com') },
];
const GAMES = [                                  // aparecem na dock; adicione novos jogos aqui
  { n: 'DOOM', file: 'DOOM.exe', u: './games/doom/index.html', g: 'game', e: '👹', local: true, max: true },
  { n: 'Smithing', file: 'Smithing.exe', u: './games/smithing/index.html', g: 'game', e: '⚒️', local: true, max: true },
  { n: 'Combate', file: 'Combate.exe', u: './games/combate/index.html', g: 'game', e: '⚔️', local: true, max: true },
];
const APPITEMS = [   // apps e jogos: aparecem na área de trabalho, na taskbar ou na dock (botão direito: "Mover para…"); tag = grupo na Loja
  { id: 'sys:store', tag: 'sistema', n: 'Loja', e: '🛍️', cat: 'apps', d: 'Instale e remova apps e jogos.', fn: () => openStore(), p0: 'taskbar' },
  { id: 'sys:browser', tag: 'sistema', n: 'Navegador', e: '🌐', cat: 'apps', d: 'Navegue em abas dentro do sistema.', fn: () => openBrowser(), p0: 'taskbar' },
  { id: 'sys:term', tag: 'sistema', n: 'Terminal', e: '💻', cat: 'apps', d: 'Linha de comando do PIRATINHA OS.', fn: () => openTerm(), p0: 'taskbar' },
  { id: 'sys:calc', tag: 'util', n: 'Calculadora', e: '🧮', cat: 'apps', d: 'Contas rápidas.', fn: () => openCalc(), p0: 'none' },
  { id: 'sys:notes', tag: 'util', n: 'Bloco de notas', e: '📝', cat: 'apps', d: 'Anotações salvas no navegador.', fn: () => openNotes(), p0: 'none' },
  { id: 'sys:b64', tag: 'util', n: 'Base64', e: '🔣', cat: 'apps', d: 'Codifique e decodifique texto e arquivos em Base64.', fn: () => openB64(), p0: 'none' },
  { id: 'sys:qr', tag: 'util', n: 'QR Code', e: '🔳', cat: 'apps', d: 'Transforme links e textos em QR Code e salve em PNG.', fn: () => openQR(), p0: 'none' },
  { id: 'sys:pass', tag: 'util', n: 'Gerador de senhas', e: '🔑', cat: 'apps', d: 'Senhas aleatórias e fortes, geradas no navegador.', fn: () => openPass(), p0: 'none' },
  { id: 'sys:hash', tag: 'util', n: 'Hash', e: '#️⃣', cat: 'apps', d: 'SHA-1, SHA-256, SHA-384 e SHA-512 de textos e arquivos.', fn: () => openHash(), p0: 'none' },
  { id: 'sys:pad', tag: 'hw', n: 'Teste de controle', e: '🎮', cat: 'apps', d: 'Botões, gatilhos, analógicos (deriva) e vibração de qualquer controle.', fn: () => openPad(), p0: 'none' },
  { id: 'sys:input', tag: 'hw', n: 'Teste de teclado e mouse', e: '⌨️', cat: 'apps', d: 'Ghosting do teclado, taxa de atualização do mouse, CPS e duplo clique fantasma.', fn: () => openInput(), p0: 'none' },
  { id: 'sys:screen', tag: 'hw', n: 'Teste de monitor', e: '🖥️', cat: 'apps', d: 'Pixels mortos, FPS e Hz reais e teste de rastro (ghosting).', fn: () => openScreen(), p0: 'none' },
  { id: 'sys:paint', tag: 'util', n: 'Paint', e: '🎨', cat: 'apps', d: 'Desenhe e salve em PNG.', fn: () => openPaint(), p0: 'none' },
  { id: GAMES[0].u, n: 'DOOM', e: '👹', cat: 'jogos', d: 'Tiro em primeira pessoa clássico, rodando Freedoom.', fn: () => openApp(GAMES[0]), p0: 'dock' },
  { id: GAMES[1].u, n: 'Smithing', e: '⚒️', cat: 'jogos', d: 'Forje armas e armaduras no ritmo do martelo, entregue encomendas e venda no leilão.', fn: () => openApp(GAMES[1]), p0: 'dock' },
  { id: GAMES[2].u, n: 'Combate', e: '⚔️', cat: 'jogos', d: 'Arrume a mochila com armas e escudos, espie a mochila do inimigo e vença as lutas automáticas.', fn: () => openApp(GAMES[2]), p0: 'dock' },
].map(a => Object.assign({ app: true, u: a.id, win: a.id, local: true, g: 'app' }, a));
LINKS.push(...APPITEMS);
const FOOTER_URL = 'https://desciclopedia.org/wiki/Especial:Aleat%C3%B3ria';
