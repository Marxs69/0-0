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
- **Smithing** (`games/smithing/`): jogo 2D de gerenciamento de forja em pixel art, com progresso salvo no navegador.
  - **Começo**: 0 moedas, 5 de cobre, 2 de bronze, moldes de Capacete e Luvas e uma encomenda de Luvas de Bronze.
  - **Materiais**:
    - Minérios naturais: Cobre, Estanho (só para ligas), Ferro, Prata, Ouro e Mithril.
    - Ligas: Bronze, Aço, Adamantita, Oricalco e Astralita.
    - Graus: Cobre e Estanho 1, até Astralita 10.
    - Painel da esquerda com botões em grade: **Metais | Madeiras** em cima e **Forja | Gemas** embaixo. Sem madeira e gemas liberadas, ficam só **Metais | Forja** lado a lado. Madeiras aparece com o molde de Arco ou de Cajado, e Gemas a partir da mina nível 3; os dois ficam desabilitados quando vazios. O botão de compra embaixo muda com a aba: **Comprar metais** ou **Comprar madeiras**.
    - Madeiras: Pinho, Carvalho, Freixo, Teixo, Pau-ferro, Ébano e Sândalo.
    - **Prata e Ouro servem só para anéis e amuletos.**
    - A loja vende, a 4× o valor: Estanho (primeiro e mais barato), Cobre, Ferro, Prata e Ouro (estes dois só depois da Mina funda), e Pinho a Teixo. Pau-ferro, Ébano e Sândalo só saem da floresta.
  - **Mina** (botão no topo, reabre a cada 2:30): só dá minério natural bruto. Os veios aparecem com um anel que se fecha; clique quando ele encostar (Perfeito = 2, Bom = 1, Ok = 50% de 1) e uma picareta golpeia o veio. Os 6 níveis são:
    - rasa: cobre, estanho e pouco ferro;
    - funda: + prata e ouro, muito raros;
    - caverna de cristais: + gemas;
    - profunda: + mithril;
    - abismo e coração da montanha: mais metais raros e gemas melhores.
    
    Cada nível mais fundo deixa mais comuns os minérios dos níveis anteriores.
  - **Floresta** (botão 🌲 no topo, abre com o molde de Arco ou de Cajado e rebrota a cada 2:00, com 8 árvores): teste de força. Segure o clique e a carga do machado sobe da esquerda para a direita aos trancos; ao encher, ela despenca. Solte dentro da faixa da árvore: Perfeito = 2 madeiras, Bom = 1, Ok = 50% de 1. Madeiras nobres são mais raras e têm faixa menor e mais à direita.
  - **Fornalha** (painel da esquerda, botão Forja): segure para aquecer e mantenha a temperatura na faixa verde. O que der errado se perde.
    - Níveis: barro (cobre, estanho, prata, ouro), tijolos (+ ferro), alto-forno (+ mithril) e arcano.
    - Uma fundição **perfeita** (90%+ na faixa) num forno quente pode transformar ferro em **aço** (10/20/30%) e mithril em **adamantita/oricalco** (5/10%).
  - **Ligas** (compradas em ordem na loja de melhorias e feitas na Forja):
    1. Bronze = cobre + estanho (o tutorial);
    2. **Processo de Bessemer**: 2 ferro → aço;
    3. Liga arcana: mithril + prata → adamantita;
    4. Liga solar: mithril + ouro → oricalco;
    5. **Brasagem estelar**: adamantita + oricalco → **Astralita** (grau 11).
  - **Gemas** (mina nível 3+): vão em qualquer peça, aumentam o valor (cheio em joias e cajados, metade nas outras) e melhoram as chances de raridade (+2% a +10%).
  - **Moldes** (agrupados por tema no painel e na loja: Armaduras, Armas, Joias, Madeiras e Arcabuzaria): os níveis são Simples, Reforçado, Ornamentado, Magistral e Mítico, e cada nível usa 1 material a mais. Uso no nível base:
    - Adaga 1 (liberada desde o início).
    - Capacete 2, Luvas 1, Grevas 2, Armadura 3, Escudo 3.
    - Espada 2 e Machado 1.
    - **Espada longa** (4) e **Machado de guerra** (3): liberados juntos pela **Armaria** da loja de melhorias, que também libera os moldes de Espada e Machado se faltarem. Usam a base + 2.
    - **Pistola de pederneira** (fim de jogo, **Arcabuzaria**, 350.000): exige Bigorna e Martelo de Mithril. A loja mostra o que falta (✔/✘). Os moldes de pistola também custam 14× mais. Usa 3 metais comuns no cano + 1 madeira na coronha (+1 metal por nível) e vale muito.
    - Anel 1 e Amuleto 2 (com **Joalheria**).
    - Arco 2 e Cajado 1 + gema obrigatória (comprados na Oficina).
  - **Gemas por peça**: 1 na maioria; o cajado aceita 2 a partir do Magistral; anel e amuleto ganham +1 por nível depois do Ornamentado (2 no Magistral, 3 no Mítico). Os bônus de valor se somam, e a melhora de raridade fica limitada a +10% no total.
  - **📖 Enciclopédia** (ao lado do Menu), com abas e sub-abas:
    - Materiais: metais, madeiras e gemas.
    - Peças.
    - Recursos: mina e floresta.
    - Melhorias: fornalha, bigorna e martelo, mina, balcões e comércio, e técnicas.
    - Raridades.
  - **Bigorna**: um espaço por material, mais a gema. O ritmo tem 5 faixas (Perfeito, Ótimo, Bom, Ruim, Errou) e o cursor é vermelho. A **Forja composta** permite metais diferentes na mesma peça.
  - **Raridade por sorte**: Comum, Incomum, Raro, Épico, Lendário e Único (com fundo vermelho).
  - **Estoque, Balcão, Leilão e Melhorias**:
    - Estoque: arrastar para o leilão ou para a bigorna (reforja); venda automática no botão 💰, depois de contratar o **Ajudante de ferreiro**.
    - Balcão: só encomendas. As **missões** ficam no botão 🏆 à esquerda das moedas, com um alerta mostrando quantas estão prontas para resgatar. Cada melhoria muda levemente a cor e os cantos: cantoneiras de ferro, cantos de latão e, no último, cantos de ouro com gema.
    - Leilão: começa fechado. A primeira compra o abre com 1 espaço, e as seguintes vão até 5. A venda é incerta.
    - Melhorias: bigorna, martelo, mina, fornalha, ligas, balcão, leilão, Ajudante de ferreiro (venda automática), Fornecedor (compra automática), Oficina (moldes de Arco e Cajado), Joalheria e Forja composta.
  - **+10k** (ao lado das moedas): trapaça que dá 10.000 moedas, para testes.
  - **☰ Menu**: continuar, menu inicial ou resetar o progresso (em vermelho, com confirmação).
  - O equilíbrio fica em tabelas no topo de `game.js`, e os sprites, em `sprites.js`.

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
  system/               energia/atualização e notificações
  widgets/              base de arrastar, música, monitor, frase do dia
  i18n/                 traduções (strings.js) e motor de tradução (i18n.js)
  main.js               inicialização
games/
  doom/                 motor Dwasm (index.html/.js/.wasm/.data) + licença
    freedoom/           WADs do Freedoom e créditos
  smithing/             jogo Smithing (index.html, style.css, sprites.js, game.js)
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
- **Adicionar um jogo ou app**: crie a função `openAlgo()` num arquivo em `js/apps/`, inclua o `<script>` no `index.html` e adicione o item em `APPITEMS` (`js/config/links.js`).
- **Traduzir um texto novo**: adicione uma linha `[pt, en, es, fr, de, ru]` em `js/i18n/strings.js`.
- **Voltar tudo ao padrão**: Configurações → Sistema → Restaurar padrões.

## Licenças de terceiros

- **Freedoom**: licença BSD (`games/doom/freedoom/COPYING.txt`).
- **Dwasm** (motor do DOOM em WebAssembly): GNU GPL v2 (`games/doom/COPYING-dwasm.txt`).
- Os ícones dos sites são carregados do serviço de favicons do Google. Quando ele não tem um bom, entra o ícone salvo em `assets/icons/sites/`.
