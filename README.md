# 🏴‍☠️ PIRATINHA

Página inicial com cara de sistema operacional, feita só com HTML, CSS e JavaScript puros. Não tem build, dependências nem servidor próprio.
Ela reúne uma lista de links de sites de jogos numa área de trabalho com janelas, taskbar, dock, menu Iniciar, apps e jogos embutidos.
A página original, em lista, continua disponível como **modo antigo**, agora com cards, favicons e a cor de destaque.

> Todas as preferências, notas, recordes e wallpapers próprios ficam salvos **só no navegador** (`localStorage`). Nada é enviado a servidor nenhum.

## Funcionalidades

### Área de trabalho
- Ícones dos sites e apps em grade, **arrastáveis**. A disposição é sorteada a cada acesso, e isso pode ser desligado.
- **Lixeira**: arraste um ícone até ela para escondê-lo. Ela tem contador de itens e opção para restaurar.
- **Clique direito** na área de trabalho: novo link, atualizar, terminal, esconder ícones, baixar o plano de fundo, Customização e Configurações.
- O **clique direito** abre sempre o menu do sistema, e não o do navegador: no conteúdo das janelas (minimizar, maximizar, fechar), nos widgets (ocultar), nos sites do menu Iniciar e nos ícones. Campos de texto, texto selecionado e o modo antigo mantêm o menu do navegador (copiar e colar). Dentro dos sites abertos em `iframe` o navegador não deixa interceptar.
- **Clique direito** num ícone: abrir, abrir em nova aba, mover para a taskbar, a dock ou o menu Iniciar, mandar para a lixeira, excluir (para links criados por você).
- **Plano de fundo**: imagens da pasta `assets/wallpapers/`, cores sólidas ou imagens enviadas por você.
- **Visual padrão para quem chega pela primeira vez**: wallpaper `59_1793395323852_59.png`, vidro RGB 33, 28, 30 com 50% de opacidade e 10% de desfoque, e destaque RGB 176, 114, 177. Caixas de seleção, barras deslizantes e itens selecionados seguem a cor de destaque.
- A grade ganha **uma linha extra** quando dá para aproximar os ícones em até 15% (por exemplo, 8 por coluna numa tela 1080p).

### Janelas
- Mover, redimensionar, minimizar, maximizar (duplo clique na barra) e fechar, com animações suaves. Elas são desligadas em Configurações → Geral ou pelo modo de movimento reduzido do sistema.
- Os sites abrem em `iframe`. Quando um site bloqueia exibição incorporada, há um botão **↗** para abrir em nova aba.

### Taskbar, dock e menu Iniciar
- Taskbar **flutuante ou acoplada**, embaixo ou em cima, com relógio em tempo real e apps fixados que podem ser **reordenados arrastando**.
- **Dock de jogos** com posição configurável (embaixo, em cima, esquerda ou direita), ocultar automático, três tamanhos e formato redondo ou quadrado.
- **Menu Iniciar** com busca, nome do app ao passar o mouse, blocos de apps, sites recomendados e outros, e o botão de desligar ou reiniciar. Há uma pegadinha quando a busca não encontra nada.

### Apps embutidos
| App | O que faz |
|---|---|
| 🛍️ Loja | Instala e remove apps, jogos e sites (no estilo GNOME Software) |
| 🌐 Navegador | Navegação em abas. Endereços sem domínio viram pesquisa na Wikipédia |
| 💻 Terminal | Terminal falso: `help`, `neofetch`, `cowsay`, `matrix`, `hack`, `fortune`, `sl`, `bsod`, `sudo fishmen -ins`, `shutdown now`, `restart now`… |
| 🧮 Calculadora | Contas rápidas |
| 📝 Bloco de notas | Texto salvo automaticamente |
| 🎨 Paint | Lápis, borracha, linha, retângulo, círculo, balde, desfazer/refazer e salvar em PNG |
| 🎨 Customização | Cor, opacidade e desfoque do vidro, cor de destaque e wallpapers |
| ⚙️ Configurações | Geral, idioma, taskbar, dock, ícones, widgets e restaurar padrões |

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
  core/                 DOM e armazenamento, tiles, gerenciador de janelas
  desktop/              ícones, lixeira, wallpaper, menu de contexto
  shell/                menu Iniciar, modo antigo, relógio, configurações, taskbar e dock
  apps/                 notas, calculadora, navegador, Paint, terminal, loja
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

- **Adicionar um site**: inclua um item em `LINKS` em `js/config/links.js`, com `g: 'rec'` (Recomendados) ou `g: 'out'` (Outros). Também dá para usar "Novo link…" no clique direito; esses ficam salvos só no navegador.
- **Adicionar um wallpaper**: coloque a imagem em `assets/wallpapers/` (png, jpg, webp, gif, avif, bmp ou svg).
- **Adicionar um jogo ou app**: crie a função `openAlgo()` num arquivo em `js/apps/` ou `js/games/`, inclua o `<script>` no `index.html` e adicione o item em `APPITEMS` (`js/config/links.js`).
- **Traduzir um texto novo**: adicione uma linha `[pt, en, es, fr, de, ru]` em `js/i18n/strings.js`.
- **Voltar tudo ao padrão**: Configurações → Sistema → Restaurar padrões.

## Licenças de terceiros

- **Freedoom**: licença BSD (`games/doom/freedoom/COPYING.txt`).
- **Dwasm** (motor do DOOM em WebAssembly): GNU GPL v2 (`games/doom/COPYING-dwasm.txt`).
- Os ícones dos sites são carregados do serviço de favicons do Google.
