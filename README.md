# 🏴‍☠️ PIRATINHA

Página inicial com cara de sistema operacional, feita só com HTML, CSS e JavaScript puros. Não tem build, dependências nem servidor próprio.
Ela reúne uma lista de links de sites de jogos numa área de trabalho com janelas, taskbar, dock, menu Iniciar, apps e jogos embutidos.
A página original, em lista, continua disponível como **modo antigo**, com cards, favicons, uma divisória por grupo (Repack, Scene, Tools e Outros) e o brilho do título, dos cards e dos botões na mesma cor de destaque do modo OS (mudou lá, muda aqui, inclusive em outras abas abertas). O botão **Modo OS** fica no canto superior direito.

No **celular** (tela de toque pequena), a página abre sempre no modo antigo, e o botão **Modo OS** fica cinza. Ao tocar nele, aparece o aviso de que o modo OS só funciona no computador.

A troca entre os modos tem uma animação de **1,5 s** em que a tela que sai se desfaz em areia (indo para o modo antigo, do canto inferior esquerdo para o superior direito; voltando ao modo OS, o inverso): um filtro SVG com mapa de ruído recorta a tela em grãos, e um `<canvas>` por cima solta grãos que o vento leva. Ela é desligada junto com as animações (Configurações → Geral) ou pelo modo de movimento reduzido do sistema.

> Todas as preferências, notas, recordes e wallpapers próprios ficam salvos **só no navegador** (`localStorage`). Nada é enviado a servidor nenhum.

## Funcionalidades

### Área de trabalho
- Ícones dos sites em grade (os apps de utilidade e os testes ficam só na Loja até você colocá-los na área de trabalho, taskbar ou dock), **arrastáveis**. A disposição é sorteada a cada acesso, e isso pode ser desligado.
- **Lixeira**: arraste um ícone até ela para escondê-lo. Ela tem contador de itens e opção para restaurar.
- **Clique direito** na área de trabalho: novo link, atualizar, terminal, esconder ícones, baixar o plano de fundo, Customização e Configurações.
- O **clique direito** abre sempre o menu do sistema, e não o do navegador: no conteúdo das janelas (minimizar, maximizar, fechar), nos widgets (ocultar), nos sites do menu Iniciar e nos ícones. Campos de texto, texto selecionado e o modo antigo mantêm o menu do navegador (copiar e colar). Dentro dos sites abertos em `iframe` o navegador não deixa interceptar.
- **Clique direito** num ícone: abrir, abrir em nova aba, mover para a taskbar, a dock ou o menu Iniciar, mandar para a lixeira, excluir (para links criados por você).
- **Plano de fundo**: imagens da pasta `assets/wallpapers/`, cores sólidas ou imagens enviadas por você.
- **Destaque no estilo do modo antigo**: ao passar o mouse em ícones, taskbar, dock, menu Iniciar, Loja, Configurações e clique direito, o item ganha fundo e contorno na cor de destaque com brilho, e os blocos sobem um pouco. Os selecionados ficam com o mesmo visual, um pouco mais forte.
- Os ícones não têm caixa de fundo: o emoji ou favicon fica solto, um pouco maior e centralizado no seu bloco.
- **Visual padrão para quem chega pela primeira vez**: wallpaper `59_1793395323852_59.png`, vidro RGB 33, 28, 30 com 50% de opacidade e 10% de desfoque, e destaque RGB 176, 114, 177. Caixas de seleção, barras deslizantes e itens selecionados seguem a cor de destaque.
- A grade tem sempre **8 ícones por coluna** (contando a lixeira), espaçados para o último ficar logo acima da taskbar. Com a dock embaixo, as colunas continuam descendo até a taskbar, e só as posições por baixo da dock ficam livres. Em telas muito baixas, os ícones se aproximam (até 75% da altura) e, se nem assim couber, a coluna fica com menos ícones.

### Janelas
- Mover, redimensionar, minimizar, maximizar (duplo clique na barra) e fechar, com animações suaves. Elas são desligadas em Configurações → Geral ou pelo modo de movimento reduzido do sistema.
- Os sites abrem em `iframe`. Quando um site bloqueia exibição incorporada, há um botão **↗** para abrir em nova aba.

### Taskbar, dock e menu Iniciar
- Taskbar **flutuante ou acoplada**, embaixo ou em cima, com relógio em tempo real e apps fixados que podem ser **reordenados arrastando**.
- **Dock de jogos** com posição configurável (embaixo, em cima, esquerda ou direita), ocultar automático, três tamanhos e formato redondo ou quadrado.
- **Menu Iniciar** com busca, a **Loja** (o único app do menu, com o nome ao lado), os sites separados pelos mesmos grupos do modo antigo e, no rodapé, **Ir para o modo antigo** à esquerda e **Desligar** à direita. Há uma pegadinha quando a busca não encontra nada.

### Apps embutidos
| App | O que faz |
|---|---|
| 🛍️ Loja | Instala e remove apps, jogos e sites (no estilo GNOME Software). Em Explorar e Instalados, as seções aparecem com títulos grandes em maiúsculas (PIRATINHA, JOGOS, APPS); em Piratinha e Apps há tags para filtrar e agrupar (Repack, Scene, Tools, Outros / Sistema, Utilitários, Testes de hardware). O botão 🖥️ ao lado de Abrir mostra ou tira um app da área de trabalho |
| 🌐 Navegador | Navegação em abas. Endereços sem domínio viram pesquisa na Wikipédia |
| 💻 Terminal | Terminal falso: `help`, `neofetch`, `cowsay`, `matrix`, `hack`, `fortune`, `sl`, `bsod`, `sudo fishmen -ins`, `shutdown now`, `restart now`… |
| 🧮 Calculadora | Contas rápidas |
| 📝 Bloco de notas | Texto salvo automaticamente |
| 🎨 Paint | Lápis, borracha, linha, retângulo, círculo, balde, desfazer/refazer e salvar em PNG |
| 🔣 Base64 | Codifica e decodifica texto (UTF-8, com opção segura para URL) e transforma arquivos em data URL |
| 🔳 QR Code | Gera QR Code de links e textos (gerador próprio em `js/core/qr.js`, sem bibliotecas), com nível de correção e salvar/copiar PNG |
| 🔑 Gerador de senhas | Senhas com `crypto.getRandomValues`, tamanho de 4 a 64, tipos de caractere e medidor de força |
| #️⃣ Hash | SHA-1, SHA-256, SHA-384 e SHA-512 de textos e arquivos |
| 🎮 Teste de controle | Desenho do controle com botões, gatilhos (em %), analógicos com rastro e indicador de deriva, vibração fraca/forte e lista crua de botões e eixos (Gamepad API; Xbox, PlayStation ou genérico) |
| ⌨️ Teste de teclado e mouse | Teclado virtual (rótulos do layout real, como o Ç do ABNT2) que acende as teclas e conta quantas ficam apertadas ao mesmo tempo (ghosting); área do mouse com os 5 botões, roda, cliques por segundo, taxa de atualização em Hz e detector de duplo clique fantasma |
| 🖥️ Teste de monitor | Aviso e botão para usar tela cheia (em janela o navegador pode limitar o FPS), FPS e Hz reais com gráfico do tempo de cada quadro, teste de rastro (blocos a 240, 480 e 960 px/s) e cores sólidas em tela cheia para achar pixel morto |
| 🎨 Customização | Cor, opacidade e desfoque do vidro, cor de destaque e wallpapers |
| ⚙️ Configurações | Geral, idioma, taskbar, dock, ícones e widgets; **Restaurar padrões** fica no fim da lista lateral, preso embaixo |

### Jogos
- **DOOM**, rodando o [Freedoom](https://freedoom.github.io/) no navegador (WebAssembly, motor Dwasm).
- **Blocos Coloridos** (combine três), **Snake**, **Campo Minado** e **Tetris**, com recordes salvos no navegador.

### Widgets
- 🎵 **Música**: toca arquivos de áudio do seu computador.
- 📈 **Monitor do sistema** (falso): gráficos de CPU, RAM e rede, com alertas fictícios de "mineração" ou "vírus".
- 💬 **Frase do dia**.
- Todos podem ser arrastados e lembram a posição.

### Humor do sistema
- Notificações com piadas a cada 5 minutos e avisos de "atualização do sistema" (com toasts no estilo "fulano começou a jogar").
- A atualização forçada aparece ao desligar ou reiniciar, e o número da versão sobe a cada vez. Também tem uma tela azul (`bsod` no terminal).

### Idiomas
Inglês (padrão), português, espanhol, francês, alemão e russo. A tradução é aplicada em tempo real sobre o DOM (`js/i18n/`).

## Estrutura

```
index.html              marcação da página + ordem de carregamento de CSS e JS
README.md
assets/
  fonts/                Futura Medium Condensed BT
  icons/favicon.ico
  icons/sites/          ícones de reserva dos sites (16×16)
  wallpapers/           imagens de fundo (lidas automaticamente)
css/
  base.css              fonte, variáveis do tema, reset e troca de modo
  old.css               modo antigo
  os/
    components.css      tiles, botões "pill", listas e campos
    desktop.css         área de trabalho, ícones, menu de contexto
    windows.css         janelas
    taskbar.css         taskbar e relógio
    dock.css            dock de jogos
    start-menu.css      menu Iniciar
    notifications.css   sino, toasts e painel
    system.css          modais, energia, atualização, tela azul
    apps.css            estilos de cada app
    widgets.css         widgets
js/
  config/links.js       ★ lista de sites, jogos e apps
  core/                 DOM e armazenamento, tiles, gerenciador de janelas, gerador de QR Code
  desktop/              ícones, lixeira, wallpaper, menu de contexto
  shell/                menu Iniciar, modo antigo (e a transição em areia), relógio, configurações, taskbar e dock
  apps/                 notas, calculadora, navegador, Paint, terminal, loja e utilitários (tools.js: Base64, QR Code, senhas, hash), testes de hardware (hwtest.js)
  games/                jogos embutidos (Blocos, Snake, Campo Minado, Tetris)
  system/               energia/atualização e notificações
  widgets/              base de arrastar, música, monitor, frase do dia
  i18n/                 traduções (strings.js) e motor de tradução (i18n.js)
  main.js               inicialização
games/
  doom/                 motor Dwasm (index.html/.js/.wasm/.data) + licença
    freedoom/           WADs do Freedoom e créditos
```

Os scripts são **clássicos**, não módulos. Eles compartilham variáveis globais e precisam ser carregados **na ordem que está no `index.html`**. Um arquivo novo deve entrar na lista na posição certa: depois dos arquivos de que ele depende e antes de `main.js`.

## Como rodar

Abrir o `index.html` direto funciona, mas o ideal é usar um servidor local, para que a pasta de wallpapers seja listada e o DOOM carregue:

```sh
python3 -m http.server 8000
# depois abra http://localhost:8000
```

No **GitHub Pages** (`usuario.github.io/repo`), a lista de wallpapers é lida pela API do GitHub automaticamente. Com domínio próprio, preencha `GH` em `js/desktop/wallpaper.js`.

## Personalizando

- **Adicionar um site**: inclua um item em `LINKS` em `js/config/links.js`, com o grupo em `g` (`repack`, `scene`, `tools` ou `out`, que é Outros) e, se quiser, um ícone de reserva em `i` (arquivos em `assets/icons/sites/`). Os grupos ficam em `GROUPS` e viram as divisórias do modo antigo e do menu Iniciar. Também dá para usar "Novo link…" no clique direito; esses ficam salvos só no navegador.
- **Adicionar um wallpaper**: coloque a imagem em `assets/wallpapers/` (png, jpg, webp, gif, avif, bmp ou svg).
- **Adicionar um jogo ou app**: crie a função `openAlgo()` num arquivo em `js/apps/` ou `js/games/`, inclua o `<script>` no `index.html` e adicione o item em `APPITEMS` (`js/config/links.js`).
- **Traduzir um texto novo**: adicione uma linha `[pt, en, es, fr, de, ru]` em `js/i18n/strings.js`.
- **Voltar tudo ao padrão**: Configurações → Sistema → Restaurar padrões.

## Licenças de terceiros

- **Freedoom**: licença BSD (`games/doom/freedoom/COPYING.txt`).
- **Dwasm** (motor do DOOM em WebAssembly): GNU GPL v2 (`games/doom/COPYING-dwasm.txt`).
- Os ícones dos sites são carregados do serviço de favicons do Google. Quando ele não tem um bom, entra o ícone salvo em `assets/icons/sites/`.
