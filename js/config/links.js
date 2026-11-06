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
  { n: 'Online-Fix - Запуск игр по сети', u: 'https://online-fix.me/',               g: 'tools',  i: ICO('online-fix-me') },
  { n: 'FLiNG Trainer',       u: 'https://flingtrainer.com/',                        g: 'tools',  i: ICO('flingtrainer-com') },
  { n: 'GameCopyWorld',       u: 'https://gamecopyworld.com/games/index.php',        g: 'tools',  i: ICO('gamecopyworld-com') },
  { n: 'BetterRepack',        u: 'https://dl.betterrepack.com/public/',              g: 'out',    i: ICO('dl-betterrepack-com') },
];
const GAMES = [                                  // aparecem na dock; adicione novos jogos aqui
  { n: 'DOOM', file: 'DOOM.exe', u: './games/doom/index.html', g: 'game', e: '👹', local: true, max: true },
];
const APPITEMS = [   // apps e jogos: aparecem na área de trabalho, na taskbar ou na dock (botão direito: "Mover para…")
  { id: 'sys:store', n: 'Loja', e: '🛍️', cat: 'apps', d: 'Instale e remova apps e jogos.', fn: () => openStore(), p0: 'taskbar' },
  { id: 'sys:browser', n: 'Navegador', e: '🌐', cat: 'apps', d: 'Navegue em abas dentro do sistema.', fn: () => openBrowser(), p0: 'taskbar' },
  { id: 'sys:term', n: 'Terminal', e: '💻', cat: 'apps', d: 'Linha de comando do PIRATINHA OS.', fn: () => openTerm(), p0: 'taskbar' },
  { id: 'sys:calc', n: 'Calculadora', e: '🧮', cat: 'apps', d: 'Contas rápidas.', fn: () => openCalc(), p0: 'menu' },
  { id: 'sys:notes', n: 'Bloco de notas', e: '📝', cat: 'apps', d: 'Anotações salvas no navegador.', fn: () => openNotes(), p0: 'menu' },
  { id: 'sys:paint', n: 'Paint', e: '🎨', cat: 'apps', d: 'Desenhe e salve em PNG.', fn: () => openPaint(), p0: 'menu' },
  { id: GAMES[0].u, n: 'DOOM', e: '👹', cat: 'jogos', d: 'Tiro em primeira pessoa clássico, rodando Freedoom.', fn: () => openApp(GAMES[0]), p0: 'dock' },
  { id: 'game:match', n: 'Blocos Coloridos', e: '🟪', cat: 'jogos', d: 'Troque blocos vizinhos e combine três ou mais da mesma cor.', fn: () => openMatch(), p0: 'dock' },
  { id: 'game:snake', n: 'Snake', e: '🐍', cat: 'jogos', d: 'Coma, cresça e não bata nas paredes.', fn: () => openSnake(), p0: 'dock' },
  { id: 'game:mines', n: 'Campo Minado', e: '💣', cat: 'jogos', d: 'Abra o campo sem pisar em nenhuma mina.', fn: () => openMines(), p0: 'dock' },
  { id: 'game:tetris', n: 'Tetris', e: '🧱', cat: 'jogos', d: 'Encaixe as peças e complete as linhas.', fn: () => openTetris(), p0: 'dock' },
].map(a => Object.assign({ app: true, u: a.id, win: a.id, local: true, g: 'app' }, a));
LINKS.push(...APPITEMS);
const FOOTER_URL = 'https://desciclopedia.org/wiki/Especial:Aleat%C3%B3ria';
