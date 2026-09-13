# PRD — DropdownMenu
<!-- prd-familia: context-menu menubar -->

> **Estado descrito**: 2026-09-12. **Revisão serial fechada em** 2026-09-07.
> **Revisado em 2026-09-10** pela pipeline `fix` do ContextMenu, que mora aqui
> (D9): §2 (C2, C5, C10), D1, D2, D4, D5, §6, §7, §8 e §9 mudaram, com a linha antiga
> registrada no lugar.
> **Revisado em 2026-09-12** contra o código dos TRÊS membros nas cinco stacks,
> depois das correções de categoria (`3d9efa5cb`, `aaa9ea44c`, `7975f6b53`,
> `7f24ea325`, `9d0cf0823`, `17980d769`): §1, §2 (C1), D1, D2, D4, D9, §4, §5,
> §6, §7, §8, §10 e §11 mudaram. A correção maior é de fato: **o Menubar TEM
> folha própria** — o documento negava isso em três lugares.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Menu suspenso disparado por um gatilho, em que **o teclado pertence à lista**:
as setas andam item a item, letra digitada é typeahead, e Tab fecha.

É a folha mais reusada da família: o **miolo do painel** — item, rótulo,
separador, atalho, marcação, escolha única, recuo e variante destrutiva — é o
mesmo no menu de contexto e no menubar, e mora aqui. O **menu de contexto** não
tem folha própria; o **menubar** tem uma, e ela só descreve a barra, o gatilho
da barra e a ancoragem do painel de topo (D9).

**Até 2026-09-12 esta linha dizia** "o menu de contexto e o menubar são
construídos com estas mesmas classes, e nenhum dos dois tem folha própria", e a
segunda metade era falsa desde 2026-07-16, quando
`docs/shared/styles/nds/menubar.css` nasceu com a infraestrutura `.nds-*`
(`7e8045dbd`): hoje 194 linhas, três classes (`.nds-menubar`,
`.nds-menubar-trigger`, `.nds-menubar-panel`). O erro estava em três lugares de uma vez — aqui, no
título e no corpo da D9, e na linha de §11 que apontava só `dropdown-menu.css`.

| vizinho | diferença que decide |
|---|---|
| Popover | o teclado pertence ao CONTEÚDO: Tab circula campos, letra é texto |
| Command | lista navegável COM campo de busca — o item nunca recebe foco, quem o mantém é o campo |
| Select | escolha de um valor de formulário, com o valor escolhido visível no gatilho |

A pergunta que decide entre este e o Popover: **a pessoa vai escolher ou vai
compor?** Se digitar uma letra ali dentro é atalho, é menu; se é texto, é popover.
Pôr um `<input>` aqui quebra duas coisas de uma vez — `role="menu"` só admite
`menuitem` e parentes, e a primeira letra digitada vira typeahead antes de chegar
ao campo.

## 2. Contrato de comportamento

| # | o contrato | o item de `testes.*` que o verifica, em cada membro |
|---|---|---|
| C1 | Ao abrir, o foco ENTRA no painel — nunca fica fora dele — e as setas alcançam os itens a partir de onde ele pousou. ONDE ele pousa varia por membro e por gesto (quadro abaixo) | dropdown-menu: functional.item1, functional.item2 · context-menu: functional.item16, functional.item4 · menubar: functional.item3, functional.item4, functional.item12 |
| C2 | **Não prende o foco**: Tab e Shift+Tab fecham o menu inteiro — também de dentro do submenu — e o foco vai ao próximo ponto de tabulação depois do GATILHO (Shift+Tab: ao anterior; no Menubar, da barra; no ContextMenu, da área); sem vizinho, volta ao gatilho | dropdown-menu: functional.item9 · context-menu: functional.item12 · menubar: functional.item13 |
| C3 | Setas cima/baixo andam; Home/End vão às pontas | dropdown-menu: functional.item2, functional.item10 · context-menu: functional.item4, functional.item13 · menubar: functional.item4, functional.item10 |
| C4 | Letra digitada move o foco para o item que começa com ela (typeahead), com `preventDefault` | dropdown-menu: functional.item11 · context-menu: functional.item14 · menubar: functional.item11 |
| C5 | `Escape` fecha e devolve o foco ao gatilho; dentro do submenu fecha só o submenu e devolve o foco ao sub-gatilho. Clique fora também fecha | dropdown-menu: functional.item4, functional.item12, functional.item13 · context-menu: functional.item2, functional.item3, functional.item6 · menubar: functional.item6, functional.item5, functional.item14 |
| C6 | Setas direita/esquerda abrem e fecham submenu | dropdown-menu: functional.item7, functional.item12 · context-menu: functional.item5, functional.item6 · menubar: functional.item5 |
| C7 | O gatilho declara `aria-haspopup="menu"` e `aria-expanded` | dropdown-menu: accessibility.item2 · context-menu: n/a (a área não é botão que anuncia o menu — §8; o sub-gatilho é o que declara, em accessibility.item10) · menubar: accessibility.item3 |
| C8 | Papéis por tipo de item: `menuitem`, `menuitemcheckbox`, `menuitemradio` | dropdown-menu: accessibility.item4 · context-menu: accessibility.item3, accessibility.item4, accessibility.item5 · menubar: accessibility.item5 |
| C9 | O atalho exibido é só texto — a tecla real é registrada por quem consome | dropdown-menu: functional.item14 · context-menu: functional.item17 · menubar: functional.item16 |
| C10 | Marcar um item de marcação ou escolher uma opção de rádio NÃO fecha o menu | dropdown-menu: functional.item5, functional.item6 · context-menu: functional.item7, functional.item8 · menubar: functional.item7, functional.item15 |

**Onde o foco pousa ao abrir, medido em 2026-09-12 nas quinze implementações.**
O invariante é o containment — e é ele, e só ele, que as stories afirmam nos três
membros (`menu.contains(document.activeElement)`).

| membro | vanilla | angular | react · vue · svelte |
|---|---|---|---|
| DropdownMenu | primeiro item, sempre (`dropdown-menu.ts:648`) | primeiro item, sempre (`show('first')`) | painel quando abre por ponteiro; primeiro item quando abre por teclado |
| ContextMenu | primeiro item, sempre (`context-menu.ts:570`) | depende do GESTO: ponteiro e toque longo → painel; tecla de menu e Shift+F10 → primeiro item | painel; a seta seguinte pousa no primeiro item |
| Menubar | primeiro item por clique e por teclado; o gatilho na troca por seta lateral; nenhum foco quando abre por `defaultOpen` (`menubar.ts:381`) | primeiro item por clique, Enter, Espaço e seta-baixo; na troca por ponteiro o foco fica no GATILHO | primeiro item — no vue por patch nosso (`MenubarTrigger.vue:37`), nas outras duas pelo caminho de teclado da lib |

**Até 2026-09-12 o C1 dizia** "o painel recebe o foco ao abrir", e isso descrevia
três das cinco stacks em um dos três membros. A referência faz o contrário do que
estava escrito: as fábricas do vanilla nunca dão `focus()` no painel — ele não
recebe `tabindex` — e focam o primeiro item nos três menus. O cabeçalho da folha
compartilhada carregava o mesmo erro pelo lado oposto — "foco automático no
primeiro item ao abrir", que é o vanilla afirmado das cinco — e foi corrigido no
mesmo dia; hoje ele diz que o foco entra no painel e que ONDE ele pousa depende da
stack, remetendo ao quadro acima.

**O destino do Tab sai do GATILHO, não do painel.** O painel vive num portal no
fim do `<body>`: o Tab nativo a partir dele leva o foco para fora do documento,
e o Shift+Tab, para o último focável da página. Medido em 2026-09-10 — cada
stack falhava de um jeito: a reka prendia o Tab no DropdownMenu e no ContextMenu
(modais), a base-ui prendia no ContextMenu, o Menubar da reka mandava o foco ao
`<body>`, o bits deixava o menu aberto quando o gatilho era a última parada, e o
vanilla e o radix-ng saíam do portal ou voltavam ao gatilho. No Menubar o gatilho
é a BARRA, que é uma parada só (tabulação itinerante).

## 3. Decisões fixadas

### D1 · Menu não prende o foco — e a página dizia o contrário

**Corrigida em** 2026-09-07 (`6b85f3a74`).
**Medição**: `accessibility.items.item2` afirmava que o painel prende o foco
enquanto aberto, e `accessibility.keyboard.tab`, **três linhas abaixo na mesma
seção**, dizia que Tab sai do menu e o fecha. As duas não podem ser verdade.
**O que vale**: o foco entra no painel ao abrir (C1), as setas percorrem os itens,
e Tab fecha e segue o percurso da página. Prender o foco é contrato de diálogo.
**Nota**: a prop `modal` tem padrão `true` aqui — e modal, neste componente,
significa véu de interação e trava de rolagem, não armadilha de foco.
**Medido em 2026-09-10 — o texto estava certo e nenhuma stack o cumpria por
inteiro, nem a referência.** O vanilla fechava no Tab mas deixava o foco ao
navegador, que partia do portal no fim do `<body>`: o Tab saía do documento e o
Shift+Tab caía no último focável da página, nos três menus; o Menubar do vanilla
nem fechava. As outras quatro erravam de outros jeitos (ver a nota sob §2).
Nenhuma story media o DESTINO do foco — só que ele não ficava preso —, e é por
isso que as cinco pareciam cumprir o C2. Hoje cada stack mede o destino em story
dedicada no DropdownMenu (`TabLeavesMenu` + `TabAtPageEnd`) e no Menubar
(`TabLeavesMenubar` + `TabAtPageEnd`).

**No ContextMenu não existe `TabAtPageEnd` em nenhuma das cinco, e o caso está
coberto de outra forma** — medido em 2026-09-12. A metade do vizinho é a story
`TabLeavesMenu`; a metade do fim da página é um `step` dentro do Playground nas
cinco (`context-menu.stories.ts` — react :340, vue :333, svelte :307, vanilla
:300, angular :243), duas delas conferindo a precondição de que não sobra ponto
de tabulação depois da área em vez de supô-la. O `functional.item12` do conteúdo
promete as duas metades e as duas são medidas; o que não existe é a simetria de
NOME com os irmãos. **Até 2026-09-12 esta linha dizia** que cada stack tem
`TabLeavesMenu` e `TabAtPageEnd` — afirmava cinco stories que não existem, e a
forma do erro é a de sempre: o caso estava coberto, então nada reprovava, e o
documento contava a cobertura pelo nome que ele esperava encontrar.

### D2 · O anel de foco do item é INTERNO e em `--accent-foreground`

**Estado**: `outline: 2px solid hsl(var(--accent-foreground))` com
`outline-offset: -2px`.
**Medição, nas duas metades**:

- **por que não `--ring`**: o anel é desenhado sobre o preenchimento de accent, e
  no escuro do tema default o `--ring` (teal) e o accent têm praticamente a mesma
  luminância — **1,38:1**, e **1,01:1** onde o accent entra a 80%. O anel sumiria
  justamente no modo em que o problema é maior. `--accent-foreground` é, por
  definição, o que se lê sobre o accent: **4,66:1** no pior dos seis pares de tema
  e modo, contra os 3:1 que a WCAG 1.4.11 pede;
- **por que interno**: o painel tem `padding: 4px` e `overflow-y: auto` — anel
  externo é recortado nas laterais e nos itens das pontas. `outline` não ocupa
  espaço, então a lista não se move ao receber foco.

**Por que existe**: antes, o item destacado era indicado SÓ pelo preenchimento, e
no tema default o `--accent-foreground` é igual ao `--foreground` — o texto não
muda, então quem navega por teclado dependia inteiramente da diferença entre o
fundo do item e o do painel, que nunca chegou a 3:1.
**Vale para as quatro peças focáveis de `dropdown-menu.css`** — item, item de
marcação, item de rádio e sub-gatilho — desde 2026-09-10. As três últimas
declaravam `outline: 0` e não recebiam anel nenhum: focadas pelo teclado, só
mudavam de fundo, nas cinco stacks e nos três menus que vestem esta folha (achado
da pipeline do ContextMenu, WCAG 2.4.7).

**E há uma QUINTA peça com o mesmo anel, na outra folha**: o gatilho da barra do
Menubar (`.nds-menubar-trigger:focus-visible`, `menubar.css:130-133`) declara os
mesmos `2px solid hsl(var(--accent-foreground))` com `outline-offset: -2px`, e
carrega a medição copiada por extenso no comentário acima da regra. Registrado em
2026-09-12: **até esta data a decisão dizia "as quatro peças focáveis"** sem
qualificar a folha, e a quinta não aparecia — ela é a única peça focável do
menubar que não é item de menu, e é por isso que o anel dela é a mesma decisão e
não outra.

### D3 · Texto secundário sobre item destacado é `--accent-foreground` a 85%

**Medição**: o accent é o laranja/teal da marca, não um quase-branco.
`--muted-foreground` sobre ele mede **2,64:1** — o axe reprovou no `command`, e o
defeito é o mesmo em todo segundo texto dentro de item destacado. **85% é o PISO
medido**: a 80% a razão cai para 4,34:1.

### D4 · O item destacado é `--accent` a 20%; no `command` é 10%; o gatilho da barra, 10%

**Estado**: `[data-highlighted]`, `:focus` e `:hover` pintam o item com
`--accent / 0.2` nas quatro peças de `dropdown-menu.css` (item, marcação, rádio,
sub-gatilho); a variante destrutiva usa `--destructive / 0.1`. **O gatilho da
barra do Menubar pinta 10%** — `hsl(var(--accent) / 0.1)` em
`menubar.css:102-108`, por `:focus`, `:hover`, `[data-state="open"]` e
`[data-popup-open]`.

**Até 2026-09-12 esta linha dizia "em TODAS as peças"**, e havia uma quinta peça
pintando outro peso na outra folha. As duas superfícies não são a mesma: o item
está sobre o `--popover` de um painel flutuante, e o gatilho está sobre o
`--background` da própria barra, que já se separa da página por borda e relevo. O
peso menor ali não foi medido contra o de 20% — quem quiser unificar mede os dois,
como diz o registro do `command` abaixo. Dois marcadores no mesmo seletor também são
de propósito (`menubar.css:90-101`): o vanilla escreve `data-state="open"`, as
libs headless publicam `data-popup-open`, e sem os dois o realce do menu aberto
não pintava em stack que não escrevesse `data-state` à mão.
**Até 2026-09-10 esta linha não era a folha**: o par `:focus`/`:hover` do item
comum pintava 10%, e o mesmo menu tinha dois pesos conforme o tipo do item e o
caminho que o destacou. Decisão da dona: 20% para todos.
**E o `:hover` só existia no item comum** até a mesma data — marcação, rádio,
sub-gatilho e a variante destrutiva reagiam a `:focus` e `[data-highlighted]`. As
quatro stacks de lib escrevem `[data-highlighted]` na passagem do ponteiro, e o
defeito não aparecia nelas; as fábricas do vanilla não escutam ponteiro nos
itens, e ali passar o mouse numa marcação não pintava nada, e no item destrutivo
pintava o accent a 20%. A folha ganhou o `:hover` nas quatro peças (decisão da
dona: mudar a folha, não esta linha), e a marcação desabilitada do vanilla, que
só carrega `aria-disabled`, passou a esmaecer e a bloquear o ponteiro. Portão:
`destaque_sem_hover` — peça pintada por `[data-highlighted]` sem `:hover` na
mesma folha reprova, salvo folha cuja fábrica do vanilla destaca por ponteiro
(select e combobox, exceções declaradas com a premissa conferida no arquivo).
Conferido em 2026-09-12: as cinco regras desta folha têm o par, e o portão varre
TODAS as folhas de `docs/shared/styles/nds/` — mas casa só seletor terminado em
`[data-highlighted]`, então o gatilho da barra fica fora do alcance dele por ser
pintado por `[data-state="open"]`. Ali o `:hover` está escrito no mesmo seletor,
e é o vanilla que o precisa: a fábrica do menubar também não escuta ponteiro.
**Contraste registrado**: o `command` usa 10% para o item selecionado. Mesmo
token, pesos diferentes, e as duas folhas dizem isso separadamente — não unifique
sem medir os dois casos.

### D5 · Menu fecha instantâneo, sem animação de saída

**Estado**: só a entrada anima (`nds-menu-in`, sob `[data-open]`/`[data-state="open"]`);
não há keyframe de saída — manter o menu montado durante o fechamento deixa os
focus-guards da lib visíveis para o axe (`aria-hidden-focus`).
**O que vale**: menus fecham instantâneo, como no vanilla.
**Até 2026-09-10 a folha dizia o contrário**: declarava `nds-menu-out` sob
`[data-closed]`/`[data-state="closed"]` desde 2026-07-26, logo abaixo do
comentário que proibia a saída animada. Saiu por decisão da dona; a entrada
continua animada.
**O que a saída escondia**: com o painel montado ~150 ms depois de fechar, as
plays que afirmavam "marcar não fecha o menu" (C10) passavam no Vue e no Svelte
— onde a reka e o bits FECHAVAM em toda escolha, inclusive nas de marcação e de
rádio. Medido em par no Svelte: com a regra de saída reinjetada, a story passa.
Corrigido nos wrappers (PATCHES `#vue-menu-select-keeps-open`,
`#svelte-menu-select-keeps-open`, `#vue-context-menu-keep-open`), e as plays
passaram a contar menus abertos (`queryAllByRole('menu')`) em vez de conferir o
nó no documento, que no bits continua lá depois de fechado.

### D6 · O separador RASGA o padding do painel

**Estado**: `margin-inline: calc(var(--spacing-1) * -1)` — a régua corre de borda
a borda, atravessando os 4px de padding do painel.
**Consequência para o desenho**: auto-layout não tem margem negativa, então no
Figma a régua para na borda do item. A folha é quem manda.

### D7 · O raio do item é `--radius-sm`, e isso é raio aninhado

**Estado**: `Rᵢ = Rₑ − E`, ou seja `--radius` (10) menos o padding do painel
(`--spacing-1`, 4).
**Para revisitar**: mudar o padding do painel sem mudar o raio do item faz os
cantos derivarem um do outro.

### D8 · O item de checkbox e o de rádio desenham a MESMA linha

**Estado**: os dois usam o mesmo tique à direita, na mesma pista reservada de
`--spacing-8`. O que os separa é o papel e o comportamento, não o desenho. O
estado misto existe só na caixa de seleção, e desenha um traço, não um tique.
**Por quê**: tique quer dizer "marcado", e misto não é isso — repetir o tique nos
dois estados apagaria a diferença para quem depende do símbolo.

### D9 · O ContextMenu não tem folha própria; o Menubar tem, e ela só cuida da barra

**Estado do ContextMenu**: não existe `context-menu.css`. O componente inteiro é
montado com as classes desta folha, e a única regra própria dele mora **dentro**
de `dropdown-menu.css:132`: `.nds-context-menu-trigger { user-select: none }`.
**O que difere**: o gatilho (área de clique-direito) e onde o painel é colocado
(no ponteiro, não ancorado a um elemento). Nenhum dos dois é desenho.

**Estado do Menubar**: existe `docs/shared/styles/nds/menubar.css`, 194 linhas, e
ela declara exatamente três classes — nenhuma delas de miolo:

| classe | o que declara |
|---|---|
| `.nds-menubar` | a barra: `flex`, `gap` de 4px, `min-height` (nunca `height`), padding, superfície `--background`, borda, raio e relevo `xs` |
| `.nds-menubar-trigger` | o gatilho da barra: padding, raio aninhado, tipografia, o realce a 10% (D4) e o anel de foco (D2) |
| `.nds-menubar-panel` | só POSIÇÃO: `position: absolute`, camada, `overflow: visible` e a ancoragem do painel de topo por `[data-side]` × `[data-align]`, com vão de 8px — ver D12 |

**O miolo do painel continua vindo de `dropdown-menu.css`**, e isso é decisão
escrita na própria folha (`menubar.css:21-30`): item, rótulo, separador, atalho,
marcação, escolha única, recuo e variante destrutiva são os mesmos de qualquer
menu do sistema, e uma segunda família de classes significaria duas cópias do
mesmo CSS com uma delas sempre atrasada — foi assim que o calendar acumulou dois
vocabulários paralelos. As cinco stacks compõem `.nds-dropdown-menu-*` dentro do
painel do menubar; nenhuma propriedade é declarada duas vezes, então não há
disputa de cascata entre os dois arquivos.

**Até 2026-09-12 esta decisão negava a folha**, no título e no corpo, e a §1 e a
§11 diziam o mesmo. A guideline de overlay já estava certa desde a revisão da
categoria (`18-overlay.md:19`: "o Menubar tem uma que só posiciona a barra e o
painel"), e o documento que ela aponta contradizia a linha que a aponta.

**Geometria de `menubar.css`**, medida em 2026-09-12:

| propriedade | valor | token |
|---|---|---|
| altura mínima da barra | 36px | `--size-lg` — mínimo, não altura fixa (WCAG 1.4.4) |
| padding da barra | 4px | `--spacing-1` |
| gap entre gatilhos | 4px | `--spacing-1` |
| superfície da barra | — | `--background` (o painel é `--popover`) |
| borda da barra | 1px | `--border` |
| raio da barra | — | `--radius` |
| relevo da barra | — | `--elevation-xs` — degrau de controle, não de flutuante |
| padding do gatilho | 12px lateral, 4px vertical | `--spacing-3` e `--spacing-1` |
| raio do gatilho | — | `--radius-sm` (Rᵢ = Rₑ − padding da barra, o mesmo cálculo da D7) |
| texto do gatilho | 14px | `--text-control` |
| realce do gatilho | accent a 10% | `--accent` — ver D4 |
| camada do painel | — | `--z-popover` |
| afastamento do painel | 4px | `--spacing-1`, por `[data-side]` |

Esta tabela mora aqui, e não na §5, por causa do alcance do portão: o
`prd_token_sem_lastro` confere os tokens da seção de geometria contra a folha do
SLUG — `dropdown-menu.css` —, então token de segunda folha ali reprova por não
ter lastro. Medido em 2026-09-12: com a linha do relevo da barra na §5, o
`node scripts/audit.mjs dropdown-menu --json` reprovava `--elevation-xs`. O
portão não está errado; ele foi escrito para um PRD de um componente, e este é de
uma família com duas folhas.

> **PENDÊNCIA · 2026-09-12** — a `.nds-menubar-panel` é escrita só pelo vanilla
> (`menubar.ts:422-424`, painel de topo). React, Vue, Svelte e Angular aplicam
> apenas `nds-dropdown-menu-content` no painel do Menubar, então nas quatro nem a
> ancoragem por `[data-side]`/`[data-align]` nem o `overflow: visible` da folha
> alcançam o painel — ele fica com o `overflow-y: auto` do bloco composto, que é
> a condição exata do `scrollable-region-focusable` que a regra de
> `menubar.css:146-167` existe para evitar. Posicionar é papel da lib nas quatro,
> mas o `overflow` não.
> **A primeira saída que esta pendência prescrevia FICOU ERRADA, e a D12 é o
> motivo.** Ela dizia "as quatro stacks escreverem a classe no painel de topo".
> Só que `.nds-menubar-panel` declara `position: absolute` JUNTO com a ancoragem
> por `top`/`left`, e nas quatro quem posiciona é a lib: aplicar a classe lá
> reintroduziria, ao contrário, o defeito que a D12 acabou de remover — uma folha
> disputando posição com o posicionador da lib. Medido em 2026-09-13.
>
> **Fecha quando** as duas responsabilidades que hoje moram na mesma classe forem
> separadas: o `overflow: visible`, que as cinco precisam, e a ancoragem por
> folha, que é do painel aninhado do vanilla e só dele. Enquanto estiverem
> juntas, não há como dar uma às quatro sem dar a outra. A alternativa é a folha
> declarar a exceção medida com um menu longo — o que exige medir, não deduzir,
> como o próprio bloco em `menubar.css` já exige.

### D12 · A folha NÃO posiciona o painel, e o vão do Menubar é 8

**Fixada em** 2026-09-13.
**Medição**: `.nds-dropdown-menu-content` declarava `position: absolute` sem
deslocamento nenhum — e essa classe veste os TRÊS membros da família nas cinco
stacks. Em toda stack de lib o painel vive em FLUXO dentro de um elemento que a
lib posiciona; fora do fluxo esse elemento colapsa. Medido no Svelte, replantando
a declaração: o invólucro vai de **128×97 para 0×0**.

**O que torna este caso instrutivo**: a posição VISÍVEL continuava certa. Com
`side="bottom"` e `align="start"` a posição estática do painel coincide com a
correta, e a folga medida seguia em 4,2px nos dois estados. O que se perde é a
detecção de colisão — `flip` e `shift` passam a medir transbordo contra uma caixa
sem tamanho. Por isso a asserção cobra as DUAS coisas: a folga e a caixa do
invólucro. Uma asserção que medisse só a folga passaria com o defeito de pé, que
é como ele sobreviveu até aqui.

**Quem posiciona, por stack**: react e angular pelo positioner da lib; vue e
svelte por um invólucro sem classe da própria lib; vanilla por `positionFloating`,
que escreve `position: absolute` no painel antes de medir. A única ancoragem por
FOLHA que sobra é a do painel de topo do Menubar (`.nds-menubar-panel`, com
`position` junto de `top`/`left`), e ela é legítima: ali o painel não vai a portal.

**O vão do Menubar é 8, e o do DropdownMenu é 4.** Medido ao escrever a asserção,
com cada stack devolvendo o próprio número: react 8, vue 8, svelte 8, angular 8 e
**vanilla 4** — a ancoragem por folha usava `--spacing-1`. Quatro contra uma, e
vão é valor de design system, não API de framework: o vanilla foi para
`--spacing-2`. O Menubar abre de uma BARRA e pede mais respiro que o menu de um
botão solto.

**Instrumento**: `docs/shared/testing/ancoragem.ts` (`expectOndeDiz`,
`expectInvolucroComCaixa`, `waitForAncorado`), ligado nas quinze implementações.
**Portão da folha**: `folha_tira_do_fluxo_sem_dizer_onde`.
**Exceção declarada**: no vanilla o painel do ContextMenu é filho do `<body>`,
então `expectInvolucroComCaixa` retorna cedo e é inerte ali. Ela entrou mesmo
assim, para as cinco afirmarem a mesma coisa, e passa a ter dentes se o painel
deixar de ser filho do `<body>`.

### D10 · O payload de analytics não leva texto localizado

**Corrigida em** 2026-09-07 (`6b85f3a74`).
**Medição**: `analytics.description` mandava o `label` levar "texto do trigger ou
item" — e texto localizado divide o mesmo evento em um valor por idioma no GA4. A
contradição estava no conteúdo que ENSINA, não no código que envia, e por isso
sobreviveria a qualquer correção de stack.
**O terceiro membro ficou um dia atrás**: a `analytics.description` do
`context-menu` seguiu com a frase anterior à unificação — "rastreie interações
relevantes", sem campo nenhum nomeado — enquanto as do dropdown e do menubar foram
reescritas com `menu`, `label`, `reason` e `location`. Corrigida em 2026-09-12, nos
três idiomas. A tabela do context-menu já estava certa: o que envelheceu foi a
PROSA ao lado dela, que é onde o leitor decide se entendeu.

### D11 · A cadeia de `transform-origin` enumera QUATRO peças do bits

**Corrigida em** 2026-09-09.
**Medição**: a cadeia caía em `center` no Svelte, e o menu crescia do MEIO em vez
de crescer do gatilho. Medido no Storybook do Svelte com o painel aberto:
`transform-origin` resolvia em `64px 48.5px` numa caixa de 128×97 — o centro
exato. Depois do conserto, `0px 0px`, a borda encostada no gatilho.

**Por que quatro nomes**: por D9. Esta folha veste dropdown, context-menu e
menubar, e os submenus dos três entram por outro nome ainda. No bits-ui 2.19.0
`getFloatingContentCSSVars(nome)` escreve `--bits-${nome}-content-transform-origin`
e é chamado com `"dropdown-menu"`, `"context-menu"`, `"menubar"` e `"menu"`. Os
nomes não se derivam do nome do componente — no bits o hover-card chama-se
`link-preview`.

**Por que demorou**: a cadeia nasceu sem o degrau do bits na migração do Vue, em
seis folhas de uma vez. O conserto do tooltip (2026-09-03) mediu as seis e
deixou as outras cinco escritas na mensagem do commit, como fora de escopo —
daí em diante foi uma por rodada, e a mesma omissão voltou como achado novo três
vezes. `center` é fallback válido, então nada reprovava. Agora reprova:
`cadeia_transform_origin_sem_bits`, com conferência de premissa contra o pacote
instalado.

## 4. Anatomia

Três árvores, porque os três membros divergem justamente na moldura: o que muda é
o GATILHO e onde o painel é ancorado. O miolo é o mesmo nos três — só o prefixo do
`data-slot` acompanha o membro (`dropdown-menu-item`, `context-menu-item`,
`menubar-item`).

**DropdownMenu**

```
dropdown-menu                       (raiz — só estado; no vanilla um display:contents)
└── dropdown-menu-trigger           aria-haspopup="menu" · aria-expanded · aria-controls
    └── dropdown-menu-positioner    só onde a lib tem posicionador próprio (react, angular)
        └── dropdown-menu-content   role="menu" · padding 4px · rola · portal no body
            ├── dropdown-menu-group            role="group" + aria-labelledby do rótulo
            │   ├── dropdown-menu-label        não interativo, não recebe foco
            │   └── …itens do grupo
            ├── dropdown-menu-item             role="menuitem" · tabindex sempre presente (§10)
            │   ├── [ícone]                    16px
            │   ├── [rótulo]
            │   └── dropdown-menu-shortcut     só exibe (C9)
            ├── dropdown-menu-checkbox-item    role="menuitemcheckbox"
            │   └── dropdown-menu-checkbox-item-indicator   absoluto à direita
            ├── dropdown-menu-radio-item       role="menuitemradio"
            │   └── dropdown-menu-radio-item-indicator
            ├── dropdown-menu-sub-trigger      + chevron à direita · aria-owns ou aria-controls (§8)
            └── dropdown-menu-separator        rasga o padding (D6)
```

O grupo faltava nesta árvore até 2026-09-12, e ele não é enfeite: é o que faz o
rótulo NOMEAR o bloco em vez de ser texto solto que o leitor de tela anuncia sem
dizer a que se aplica (`dropdown-menu.css:18-22`). No vanilla ele vem em dois
níveis — um `<li role="presentation">` que carrega e um `<ul role="group">` que
agrupa —, porque o menu é uma lista e um `<ul>` só pode ser filho de um `<li>`; a
classe resolve isso com `display: contents`, que é mecânica e não desenho. A
CLASSE do indicador é uma só (`.nds-dropdown-menu-item-indicator`); o `data-slot`
é que diz o tipo do item.

**ContextMenu** — o que difere é o gatilho, e ele é uma ÁREA, não um botão:

```
context-menu                        (raiz — só estado)
└── context-menu-trigger            a ÁREA de clique-direito
                                    tabindex="0" nas cinco — sem ele, quem não usa
                                    mouse nunca abre, e o foco de volta cai no <body>
                                    sem role, sem aria-haspopup, sem aria-expanded (§8)
    └── context-menu-content        role="menu" — posicionado no PONTO do ponteiro,
                                    não ancorado a elemento; sem data-side no vanilla
        └── (o miolo do DropdownMenu, com data-slot de prefixo context-menu-)
```

**Menubar** — barra → menu → gatilho → painel:

```
menubar                             role="menubar" · aria-orientation="horizontal"
                                    UMA parada de tabulação (tabulação itinerante)
└── menubar-menu                    um por menu; é o bloco de referência do painel
    ├── menubar-trigger             <button> role="menuitem" · aria-haspopup="menu"
    │                               aria-expanded · aria-controls · data-state
    └── menubar-content             role="menu" · data-side × data-align
        └── (o miolo do DropdownMenu, com data-slot de prefixo menubar-)
```

Duas notas de estrutura medidas no vanilla, que é a referência: no Menubar o
painel de topo é INLINE, irmão do gatilho dentro de `menubar-menu` — os outros dois
portam o painel raiz para o `<body>` —, e por isso o painel e os itens dele são
`<div>` em vez de `<ul>`/`<li>`. O SUBMENU dos três vai sempre para o `<body>`,
desde 2026-09-07: aninhado, ele não sabia recuar quando não cabia.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/dropdown-menu.css` — o painel e o miolo dos TRÊS
membros. A barra do Menubar é de outra folha, e a tabela dela está na D9.

| propriedade | valor | token |
|---|---|---|
| largura mínima do painel | 128px | **literal** (`8rem`) |
| padding do painel | 4px | `--spacing-1` |
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| borda | 1px | `--border` |
| raio do painel | — | `--radius` |
| raio do item | — | `--radius-sm` — ver D7 |
| sombra do painel | — | `--elevation-md` |
| padding do item | 8px lateral, 6px vertical | `--spacing-2` e `--spacing-1-5` |
| gap do item | 8px | `--spacing-2` |
| ícone do item | 16px | `--spacing-4` |
| tamanho de texto | 14px | `--text-control` |
| rótulo de grupo e atalho | 12px | `--text-control-sm` |
| item destacado | accent a 20% | `--accent` — ver D4 |
| texto do item destacado | — | `--accent-foreground` |
| anel de foco do item | 2px interno | `--accent-foreground` — ver D2 |
| variante destrutiva | destructive, fundo a 10% | `--destructive` |
| separador | 1px | `--muted` |
| pista do indicador | 32px | `--spacing-8` |
| item recuado | 28px | `--spacing-7` |
| camada | — | `--z-popover` |

**O separador aqui é `--muted`; no `command` é `--border`.** Dois menus, dois
tokens.

**A barra do Menubar tem DOIS degraus de sombra em jogo, e eles não são o mesmo
assunto**: o painel que abre é flutuante (`md`, e sai desta folha), e a barra em
si continua no plano da página — relevo de controle, `xs`, e sai da folha dela.
Até 2026-09-12 a barra cravava
`0 1px 2px hsl(0 0% 0% / 0.05)` na folha em vez de ler token, e o efeito não era
estético: valor cravado não segue o MODO, então no escuro ela ficava em 0.05
onde a escada vai a 0.15 — sombra praticamente inexistente sobre fundo escuro.
Era uma de dezoito declarações assim nas folhas compartilhadas. Portão:
`sombra_cravada`, que reprova valor literal, e `elevacao_fora_do_mapa`, que
agora conhece o degrau de controle.

**A linha entrou na tabela de tokens das cinco docs pages do Menubar em
2026-09-12**, apontando `.nds-menubar` — e vale registrar por que ela faltava:
enquanto a sombra era valor cravado não havia token para listar, então a ausência
na tabela era coerente com a folha. Tokenizar criou a linha. O que cobra isso
agora é o `token_table_row_incoerente` pelo lado do CONTEÚDO compartilhado: a
metade das tabelas que guarda o seletor no `translations.json` era invisível ao
portão, que só lia o par token↔seletor quando os dois eram literais na página.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | painel fora da tela — desmontado na maioria das stacks; o bits mantém o nó (ver D5), e as plays contam menus abertos em vez de conferir o nó |
| Open | gatilho | painel montado; o foco entra nele — no painel ou no primeiro item, conforme o membro e o gesto (C1) —, setas ativas |
| Item destacado | ponteiro ou setas | fundo accent a 20%, texto `--accent-foreground` |
| Item com foco visível | navegação por teclado | soma o anel interno (D2) |
| Item desabilitado | `data-disabled` nas libs, `aria-disabled="true"` no vanilla | 50% de opacidade, sem eventos de ponteiro; as setas continuam pousando nele |
| Submenu aberto | seta direita, Enter ou Espaço no sub-gatilho, ou ponteiro | o sub-gatilho permanece destacado — a folha lê o nome de estado de cada lib (`data-popup-open` na base-ui e no radix-ng; `data-state="open"` na reka, no bits e no controlador de submenu do vanilla); sem o último, no Vue, no Svelte e no vanilla o destaque sumia quando o foco entrava no submenu (corrigido em 2026-09-10) |

## 7. API

| prop | tipo | padrão | onde vale |
|---|---|---|---|
| `open` | boolean | — | DropdownMenu |
| `defaultOpen` | boolean | `false` | DropdownMenu — no Menubar a abertura é por MENU, e a forma divergiu (nota abaixo) |
| `onOpenChange` | `(open: boolean) => void` | — | os três — no Menubar, um por menu da barra |
| `modal` | boolean | `true` | DropdownMenu só; o ContextMenu e o Menubar não têm a opção |
| `side` | `top \| right \| bottom \| left` | `bottom` no DropdownMenu e no Menubar | no ContextMenu o padrão é outro, e no vanilla a opção não existe (quadro abaixo) |
| `align` | `start \| center \| end` | `start` | os três, onde a opção existe |

Repare no `align`: `start` aqui, `center` no popover e no tooltip. Menu alinha
pela borda do gatilho porque a lista se lê de cima para baixo, encostada.

**No Menubar, quem abre é o MENU, e a forma da opção divergiu** — medido nos dois
extremos em 2026-09-12: no angular cada `nds-menubar-menu` recebe `open`,
`defaultOpen`, `disabled` e `loopFocus`; no vanilla o `defaultOpen` é da BARRA e é
o ÍNDICE do menu que nasce aberto (`defaultOpen?: number`), que abre sem levar
foco a nada. Divergência de API de framework: registrada, não alinhada.

**O `side` do ContextMenu não é `bottom`, e em uma stack não existe** — medido em
2026-09-12, e até essa data a tabela dizia `bottom` sem qualificar o membro:

| membro | side padrão |
|---|---|
| DropdownMenu | `bottom` nas cinco (submenu: `right`) |
| Menubar | `bottom` nas cinco (submenu: `right`) |
| ContextMenu | `right` em react, vue e svelte; `bottom` no angular; **inexistente no vanilla** |

A divergência tem raiz e não é descuido: o menu de contexto abre no PONTO do
ponteiro, então o lado só governa de fato o submenu. O vanilla leva isso ao fim e
não aceita a opção — `createContextMenu` não tem `side` nem `align` no tipo, com a
ausência declarada no arquivo ("ele abre onde o ponteiro está"), e o painel não
recebe `data-side` porque não havia lado para escrever. O angular resolve o padrão
na raiz e usa `bottom` para a raiz e `right` para o submenu. Os outros três chegam
a `right` por caminhos diferentes: o react por default do wrapper, o vue e o
svelte porque a lib o crava no render do conteúdo — nesses dois o wrapper não
declara `side` nem `align`, então não há o que ajustar sem contrariar a lib. É
divergência de API de framework: registrada, não alinhada.

### Abertura por TOQUE, no ContextMenu

O toque longo abre o menu em quatro das cinco, com prazo próprio de cada lib —
medido em 2026-09-12, e o PRD não registrava isto:

| stack | prazo | configurável |
|---|---|---|
| react | 500 ms | não — a base-ui não expõe prop de prazo em nenhuma camada |
| angular | 500 ms | sim, `longPressDelay` no gatilho (o wrapper repassa o input da host directive) |
| vue | 700 ms | sim, `pressOpenDelay` na raiz |
| svelte | 700 ms | não — valor cravado no bits |
| vanilla | — | **não abre por toque** |

A fábrica do vanilla não tem temporizador: ela ouve `contextmenu` e depende de o
navegador emiti-lo no toque longo, o que nem todo navegador móvel faz. A ausência
está declarada no arquivo (`context-menu.ts:72-77`) e o conteúdo compartilhado não
promete toque — é a forma correta de divergir, e é por isso que ela não é
pendência. Repare que o prazo divide as quatro em dois pares por LIB, não por
decisão desta casa.

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

**DropdownMenu**

| stack | peças |
|---|---|
| react | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| vue | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| svelte | `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuGroupHeading`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger` |
| vanilla | `createDropdownMenu` |
| angular | `a[ndsDropdownMenuLinkItem]`, `button[ndsDropdownMenuTrigger]`, `div[ndsDropdownMenuCheckboxItem]`, `div[ndsDropdownMenuGroup]`, `div[ndsDropdownMenuItem]`, `div[ndsDropdownMenuLabel]`, `div[ndsDropdownMenuRadioGroup]`, `div[ndsDropdownMenuRadioItem]`, `div[ndsDropdownMenuSeparator]`, `div[ndsDropdownMenuSubTrigger]`, `nds-dropdown-menu, nds-dropdown-menu-sub`, `ng-template[ndsDropdownMenuContent], ng-template[ndsDropdownMenuSubContent]`, `span[ndsDropdownMenuShortcut]` — e `svg[ndsDropdownMenuIcon]`, interno: exportado por exigência do verificador de templates, fora do `NDS_DROPDOWN_MENU` e sem barril que o reexporte (marcado assim em 2026-09-12, para ler igual à linha do ContextMenu) |

O índice do svelte também reexporta as formas curtas — `CheckboxItem`, `Content`, `Group`, `GroupHeading`, `Item`, `Label`, `Portal`, `RadioGroup`, `RadioItem`, `Root`, `Separator`, `Shortcut`, `Sub`, `SubContent`, `SubTrigger`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

**No vanilla a peça é uma fábrica, e o que ela DEVOLVE também é API** — medido em
2026-09-12: `createDropdownMenu` devolve `open()`, `close()`, `toggle()`,
`setOpen(open)` e `destroy()`; `createContextMenu` e `createMenubar` devolvem só
`destroy()`. A assimetria é do gesto: menu de contexto e barra não se abrem por
chamada de fora, abrem por clique direito e por gatilho. Conferido também que a
saída do "gatilho escondido" (`7f24ea325`) **não acrescentou verbo nenhum** — ela
não tocou `dropdown-menu.ts`, só as stories e os snippets: a fábrica já tinha
`open()`, e o que estava velho era o código que a demonstrava. O `trigger`
continua obrigatório, porque é a âncora do posicionamento.

**ContextMenu**

| stack | peças |
|---|---|
| react | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| vue | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| svelte | `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuGroupHeading`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger` |
| vanilla | `createContextMenu` |
| angular | `div[ndsContextMenuCheckboxItem]`, `div[ndsContextMenuGroup]`, `div[ndsContextMenuItem]`, `div[ndsContextMenuLabel]`, `div[ndsContextMenuRadioGroup]`, `div[ndsContextMenuRadioItem]`, `div[ndsContextMenuSeparator]`, `div[ndsContextMenuSubTrigger]`, `div[ndsContextMenuSub]`, `div[ndsContextMenuTrigger]`, `div[ndsContextMenu]`, `ng-template[ndsContextMenuContent], ng-template[ndsContextMenuSubContent]`, `span[ndsContextMenuShortcut]` — e `svg[ndsContextMenuIcon]`, interno (o próprio código diz que não é API pública: é o ícone que os itens usam por dentro) |

O índice do svelte também reexporta as formas curtas — `CheckboxItem`, `Content`, `Group`, `GroupHeading`, `Item`, `Label`, `RadioGroup`, `RadioItem`, `Root`, `Separator`, `Shortcut`, `Sub`, `SubContent`, `SubTrigger`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

**Menubar** — a tabela faltava até 2026-09-12, e as peças existem e divergem:

| stack | peças |
|---|---|
| react | `Menubar`, `MenubarCheckboxItem`, `MenubarContent`, `MenubarGroup`, `MenubarItem`, `MenubarLabel`, `MenubarMenu`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSeparator`, `MenubarShortcut`, `MenubarSub`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarTrigger` |
| vue | as mesmas quinze, nome por nome |
| svelte | as quinze, mais `MenubarGroupHeading` e `MenubarPortal` |
| vanilla | `createMenubar` |
| angular | `nds-menubar`, `nds-menubar-menu, nds-menubar-sub`, `ng-template[ndsMenubarContent], ng-template[ndsMenubarSubContent]`, `button[ndsMenubarTrigger]`, `div[ndsMenubarGroup]`, `div[ndsMenubarLabel]`, `div[ndsMenubarSeparator]`, `div[ndsMenubarItem]`, `span[ndsMenubarShortcut]`, `div[ndsMenubarSubTrigger]`, `div[ndsMenubarCheckboxItem]`, `div[ndsMenubarRadioGroup]`, `div[ndsMenubarRadioItem]` — e `svg[ndsMenubarIcon]`, interno, pelo mesmo motivo dos outros dois |

Três divergências que a tabela mostra e vale nomear. O `MenubarMenu` existe nas
quatro stacks de lib e **não tem par no vanilla**, onde a barra recebe a lista de
menus como dado (`createMenubar(menus, options)`) em vez de composição. O svelte
carrega duas peças a mais — `GroupHeading`, que é o cabeçalho do grupo no bits, e
`Portal` —, e reexporta tudo também na forma curta, como nos outros dois membros.
E no angular o `nds-menubar-sub` compartilha o seletor da raiz de menu: o submenu é
o mesmo componente, num nível abaixo.

No angular, dos três só o DropdownMenu tem item de link (`a[ndsDropdownMenuLinkItem]`):
o ContextMenu e o Menubar não têm peça equivalente.

No vue, o item de marcação não fala a mesma API nos três membros: o `DropdownMenuCheckboxItem` liga `v-model` (`modelValue`, o nome da reka 2), e o `ContextMenuCheckboxItem` e o `MenubarCheckboxItem` expõem `checked`/`update:checked`, que os wrappers declaram. É divergência de API de framework dentro de uma stack, registrada em 2026-09-11 e não alinhada: alinhar muda a API pública de dois componentes, e é decisão da dona.

No svelte, `ContextMenuGroupHeading` é desde 2026-09-10 um apelido de
`ContextMenuLabel`: mesmo markup, `data-slot="context-menu-label"`, e dentro de
um grupo o rótulo é o cabeçalho do bits, que escreve o id no `aria-labelledby`
do grupo. Continua exportado por ser API pública.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Os três menus do Angular compartilham, desde 2026-09-10, peças INTERNAS em
`menu-popup-scope.ts` — **três diretivas**, e o arquivo cita **três âncoras de
PATCH** (em quatro comentários, porque a da entrada do submenu é lida em dois
pontos):

| peça | selector | o que faz | âncora |
|---|---|---|---|
| `NdsMenuPopupScope` | `[ndsMenuPopupScope]` | entrega o injetor DO POPUP ao miolo em `ng-template`, e consome o Tab em captura para fechar o menu inteiro devolvendo o foco à página (C2) | `#angular-dropdown-menu-submenu-entry` e `#angular-dropdown-menu-tab-exit` |
| `NdsSubmenuKeyboardEntry` | nenhum — só host directive | a seta direita LEVA o foco ao primeiro item do submenu, inclusive quando o painel já foi aberto por ponteiro | `#angular-dropdown-menu-submenu-entry` |
| `NdsSubmenuOwnsPanel` | nenhum — só host directive | escreve `aria-owns` no sub-gatilho apontando o painel portalado, e só enquanto ele está aberto | `#angular-menu-submenu-aria-owns` |

**Até 2026-09-12 este parágrafo listava duas diretivas e uma âncora.** A terceira
não é detalhe de implementação: é o que liga o sub-gatilho ao painel na árvore de
acessibilidade, e sem ela o Angular seria a única stack sem essa relação (§8). O
arquivo também exporta dois tokens de injeção — a âncora de tabulação
(`NDS_MENU_TAB_ANCHOR`, de onde o Tab conta a página) e o painel de submenu
(`NDS_SUBMENU_PANEL`) — e o cabeçalho declara que nada disso é API pública:
nenhum barril reexporta, e nenhuma das três entra nos arrays `NDS_*`.

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

## 8. Acessibilidade

**Papéis**: `menu` no painel; `menuitem`, `menuitemcheckbox` e `menuitemradio`
nos itens, conforme o tipo. O gatilho traz `aria-haspopup="menu"` e
`aria-expanded`.

**O sub-gatilho liga-se ao painel por `aria-owns` em duas stacks e por
`aria-controls` nas outras três**, e o PRD não citava nenhum dos dois até
2026-09-12:

| stacks | atributo | quem escreve |
|---|---|---|
| vanilla, angular | `aria-owns`, só enquanto o submenu está aberto | nós — `lib/submenu.ts` no vanilla, `NdsSubmenuOwnsPanel` no angular |
| react, vue, svelte | `aria-controls` | a lib, sem passar pelos nossos wrappers |

As duas stacks que decidem à mão escolhem `aria-owns`, e as duas escrevem o motivo no
arquivo: o painel do submenu **não é filho** do sub-gatilho — ele vive num portal
no `<body>` —, e `aria-controls` é a ligação certa para o painel ANINHADO; para
painel fora da árvore, quem devolve a relação de posse é `aria-owns`, que
REPARENTA o nó na árvore de acessibilidade. Onde a lib decide, ela escreve
`aria-controls` e não há o que negociar: é divergência de lib, registrada. No
vanilla, `aria-controls` aparece — mas no gatilho de TOPO, apontando o painel
raiz, que é outra relação.

**No ContextMenu, o C7 não vale para a área**: ela é uma região genérica que
recebe o clique direito (e a tecla de menu ou Shift+F10 quando focada), não um
botão que anuncia o menu — nas cinco stacks, por desenho. `aria-haspopup` e
`aria-expanded` aparecem no sub-gatilho, que é um item.

**Teclado**: setas andam, Home/End vão às pontas, letra é typeahead com
`preventDefault`, Enter e Espaço ativam, Escape fecha e devolve o foco, Tab fecha
e segue a página a partir do gatilho (C2).

**O que NÃO se faz, de propósito:**

- não se põe campo de texto nem conteúdo composto aqui — quebra o papel e o
  typeahead ao mesmo tempo;
- não se prende o foco: menu não é diálogo (D1);
- não se anima a saída, para não deixar focus-guard visível ao axe (D5).

**Movimento reduzido**: o painel para sob `prefers-reduced-motion`, e quem o
para é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo, incluindo por que o bloco `@media` da própria folha não é o que
segura, está por extenso em `hover-card.md` §8.

## 9. Analytics

Nove eventos, três por membro da família, **no mesmo formato** — e é o tipo das
cinco `analytics.ts` que o cobra: evento fora dele não compila.

| evento | quando | payload |
|---|---|---|
| `dropdown_menu_open` · `context_menu_open` · `menubar_open` | o menu abre (no ContextMenu: clique direito, tecla de menu ou Shift+F10; no Menubar: um menu da barra) | `{ component, menu, location }` |
| `dropdown_menu_close` · `context_menu_close` · `menubar_close` | o menu fecha | `{ component, menu, reason, location }` |
| `dropdown_menu_item_select` · `context_menu_item_select` · `menubar_item_select` | item escolhido — marcar e escolher rádio também, sem fechar (C10) | `{ component, menu, label, location }` |

- **`component`** é o slug em kebab: `dropdown-menu`, `context-menu`, `menubar`.
- **`menu`** é o id estável do menu, em inglês e kebab. Numa prévia de UM
  menu, o id da prévia — `demo` (ContextMenu), `pair1-do`, `pair1-dont`…, ou o
  nome do card em kebab (`with-checkbox-items`). Numa prévia de VÁRIOS menus, o
  id da prévia + `-` + a chave do rótulo do gatilho em kebab — as quatro células
  da demonstração do DropdownMenu (`demo-account` … `demo-file`) e toda barra
  de mais de um menu (`demo-file`, `pair1-do-edit`, `editor-complete-help`);
  barra de um menu só leva só o id da prévia (`with-shortcuts`). Nunca o texto
  do gatilho.
- **`label`** só existe na escolha de item: é a chave de
  `demonstration.labels.*` que nomeia o item, em kebab (`showGrid` →
  `show-grid`). A regra é mecânica de propósito — as cinco stacks chegam ao
  mesmo valor sem combinar entre si.
- **`reason`** é `escape`, `overlay` (clique fora, Tab, clique no gatilho
  aberto e, no Menubar, a passagem ao menu vizinho — saiu sem decidir) ou `api`
  (item escolhido que fecha, ou fechamento pelo código — "decisão de dentro",
  como no resto da categoria). `close-button` não ocorre — menu não tem
  controle de fechar —, e **o tipo declara três palavras**, não quatro: até
  2026-09-11 o React carregava a quarta, que nenhum caminho produzia, enquanto as
  outras declaravam três. Palavra sem comportamento atrás é a mesma dívida do
  comportamento sem palavra, do outro lado.
- **A tradução do motivo mora AO LADO DO PRIMITIVO, e é UMA para a família
  inteira** — `ui/menu-close-reason.ts` no react, no angular e no svelte, plano
  ao lado das três pastas de propósito, porque um arquivo por componente vira
  três cópias que divergem; no vanilla cada fábrica entrega `onClose(reason)` de
  primeira mão; no vue o motivo já vem do contexto do próprio wrapper
  (`ui/<menu>/<menu>.context.ts`), um por componente, que é a forma da stack.
  Até 2026-09-12 as docs pages do Svelte declaravam o vocabulário por conta
  própria, e uma delas numa união ANÔNIMA, que não tinha nome para ninguém
  procurar. Portão: `motivo_sintetizado_na_docs_page`.

  O que a mudança de casa pagou de imediato: a guarda de submenu usava
  `event.target instanceof Element`, que só existe no navegador — assim que a
  dedução passou a ter teste de unidade em node, ela quebrou com
  `ReferenceError`. Enquanto morava na página, esse trecho não tinha como ser
  exercitado fora do navegador.
- **`location`** é a seção da página onde a prévia está (`docs_demo`,
  `docs_variantes`, `docs_composicoes`, `docs_do_dont`) — toda prévia viva
  rastreia, e a seção vem do chamador.

**Os ids são em inglês, e o texto nunca entra** (D10). Traduzido, o mesmo item
viraria três valores no GA4, um por idioma, e a série não juntaria.

**Histórico — o que este formato substituiu, e por quê.**

- **2026-09-10, eventos do ContextMenu**: eram `menu_open` e `menu_item_click`,
  outro vocabulário que o do irmão, com o evento de item sem `component`, e o
  fechamento não era medido. A dona decidiu renomear para `context_menu_*`, e a
  série `menu_*` parou de crescer nessa data.
- **2026-09-11, o resto da família**, por decisão da dona:
  - o `dropdown_menu_open`/`_close` mandava o id do menu em `label`, e o
    `dropdown_menu_item_select` o mandava em `menu` — a mesma dimensão do GA4
    guardava o menu num evento e o item no outro. Passa a `menu`, e a série de
    `label` desses dois eventos para de crescer em 2026-09-11;
  - o `dropdown_menu_close` não tinha `reason`, e o portão aceitava a ausência
    (`reason_vocabulario_divergente` pulava o evento sem o campo). Agora a
    ausência reprova, salvo exceção declarada com premissa — hoje só o
    `hover_card_close`;
  - os ids eram em português no DropdownMenu (`acoes`, `configuracoes`) e em
    inglês no ContextMenu — e o vanilla dava ao item `value: 'settings'` e
    rastreava `configuracoes`. Passam a inglês, pela chave do rótulo;
  - Variantes e Do & Don't do DropdownMenu não rastreavam: os dois helpers de
    cada stack cravavam `docs_demo`, com um comentário dizendo que só a
    demonstração era atendida. O `location_so_da_demo` exigia três literais e
    a página tinha dois — a regra agora dispara com um, e a dívida do resto do
    repositório está declarada em
    `docs/shared/primitives/location-so-da-demo-divida.json`;
  - **destruir não é fechar**: a fábrica do vanilla destruída com o menu aberto
    mandava `*_close` com `api`, e toda troca de idioma de uma docs page com um
    menu aberto virava um fechamento falso. Hoje a destruição não avisa nada,
    nos três menus;
  - o **Menubar** não disparava nada, e o conteúdo prometia
    `menubar_menu_open`, `menubar_item_select` e `menubar_shortcut_invoke`, com
    o texto do item no payload. Passa a rastrear, no formato da família; o
    `menubar_shortcut_invoke` não existe — o atalho exibido é só texto (C9), e
    nada o registra.

As duas pendências abertas aqui em 2026-09-10 — o `reason` do DropdownMenu e os
eventos do Menubar — estavam endereçadas "à passagem do DropdownMenu" e "à
passagem do Menubar". Este PRD descreve os dois, e nenhuma dessas passagens
estava marcada: é o mecanismo que o `.claude/commands/pipeline.md` agora proíbe
("A família é a unidade").

## 10. Reconstruir do zero

Ordem: folha → primitivo → itens (comum, seleção, sub-gatilho) → separador e
rótulo → stories → docs page.

- **O typeahead precisa de `preventDefault`**, senão a letra chega a quem estiver
  atrás do menu.
- **`tabindex` em TODO item, inclusive no desabilitado** — sem ele o `focus()`
  programático é no-op, e é assim que as setas andam no vanilla. Vale também para
  a ÁREA do ContextMenu: `tabindex="0"` nela é o que faz a tecla de menu alcançar
  o componente, e é para onde o foco volta no fechamento.
- **A fábrica do vanilla foca o primeiro item, não o painel** (C1), e o painel
  nunca recebe `tabindex`. Quem reconstrói copiando a lib acaba com o foco no
  painel e uma seta a mais para chegar ao primeiro item.
- **O painel de topo do Menubar é INLINE**, ancorado por `[data-side]`/`[data-align]`
  com as classes `nds-menubar-panel` + `nds-dropdown-menu-content`; o submenu vai
  para o `<body>` e leva só a segunda. Na folha, o seletor que devolve o
  `overflow: visible` ao painel de topo repete as DUAS classes
  (`.nds-menubar-panel.nds-dropdown-menu-content`): precisa vencer a regra do
  dropdown independentemente da ordem em que as folhas entram.
- **angular** — host binding de diretiva APAGA atributo estático do template:
  `data-slot` disputado se resolve na diretiva, não no ponto de uso. E
  `[attr.data-slot]` no template perde do mesmo jeito.
- **A saída não anima** (D5). Se a lib insistir, o sintoma é `aria-hidden-focus`
  no axe.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, estados, anel de foco, submenus — do painel e do miolo dos TRÊS | `docs/shared/styles/nds/dropdown-menu.css` |
| a barra do Menubar, o gatilho dela e a ancoragem do painel de topo | `docs/shared/styles/nds/menubar.css` — 194 linhas, três classes (D9) |
| texto, props, critérios de teste | `docs/shared/content/<membro>/translations.json`, um por membro da família |
| desenho e anotações | Figma, página `DropdownMenu` (componente `684:377`) |
| portões determinísticos | `node scripts/audit.mjs dropdown-menu --json` — e os outros dois membros, `context-menu` e `menubar`: o `contrato_de_familia_sem_teste` lê o §2 deste arquivo contra o conteúdo dos três |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 57 chaves `nav` saíram do conteúdo em 2026-09-12.** Mesma forma do drawer
e da mesma família: vue e svelte liam o conteúdo e mostravam "When to Use" e
"Tests" onde as outras três mostravam "Usage" e "Pruebas".

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 42 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**15 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.


