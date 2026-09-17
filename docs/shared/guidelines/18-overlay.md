# Overlay — as regras da categoria

Vale para os dez componentes de overlay, nas cinco stacks: **Dialog, AlertDialog,
Sheet, Drawer, Popover, HoverCard, Tooltip, DropdownMenu** (que também veste o
**ContextMenu** e o **Menubar**) e **Command**.

Este arquivo guarda o que ATRAVESSA os componentes. O que cada um É — contrato,
decisões com data e medição, tokens, peças das cinco stacks — está no PRD dele:

| componente | PRD |
|---|---|
| Dialog | [dialog.md](../prd/dialog.md) |
| AlertDialog | [alert-dialog.md](../prd/alert-dialog.md) |
| Sheet | [sheet.md](../prd/sheet.md) |
| Drawer | [drawer.md](../prd/drawer.md) |
| Popover | [popover.md](../prd/popover.md) |
| HoverCard | [hover-card.md](../prd/hover-card.md) |
| Tooltip | [tooltip.md](../prd/tooltip.md) |
| DropdownMenu, ContextMenu, Menubar | [dropdown-menu.md](../prd/dropdown-menu.md) — o ContextMenu não tem folha própria; o Menubar tem uma que só posiciona a barra e o painel, e veste o miolo com as classes do DropdownMenu (D9) |
| Command | [command.md](../prd/command.md) |

## Por que este arquivo existe

Até 2026-09-10 a regra de categoria vivia em **cinco cópias**, uma
`10-overlay-components.md` por stack. Não havia especialização por stack nelas:
medido naquele dia, só 3% das linhas traziam marcador de stack, e o resto era o
mesmo assunto escrito cinco vezes de jeitos diferentes. As cópias discordavam
entre si — quatro das cinco afirmavam `--card` na superfície dos painéis, que
nenhuma folha lê, e quatro punham o Tooltip em `--popover`, quando ele lê
`--primary` — e a cópia do React ainda ensinava padding com sintaxe Tailwind e
um token que não existe, e `label` = título traduzido no payload de analytics.

Ao mesmo tempo, os invariantes da categoria apareciam pedaço a pedaço, um D em
cada PRD, e três achados voltaram como "defeito novo" duas ou três vezes, por
agentes diferentes — a cadeia de `transform-origin`, a guarda de movimento
reduzido e o nome da opção de nível de título. Cada rodada consertava a
instância que via, e o invariante continuava sem dono.

Aqui fica a regra UMA vez, e a última seção diz qual portão cobra cada uma. O
que é mecânica de uma stack só — o `ng-template` do Angular, o teclado feito à
mão no vanilla — fica na `10-overlay-components.md` daquela stack, que hoje só
existe nessas duas; react, vue e svelte não têm mecânica de overlay própria a
registrar. O portão `guideline_de_stack_repete_categoria` impede que a `10`
volte a copiar este arquivo — e só ela: a cópia que migrou para OUTRO arquivo
de stack não é vista (ver a tabela de invariantes).

---

## Qual componente

| Situação | Componente |
|----------|------------|
| Formulário, criação, edição — interrompe a página | Dialog |
| Confirmação de ação destrutiva — decisão obrigatória | AlertDialog |
| Painel lateral | Sheet |
| Painel deslizante com gesto, pensado para mobile | Drawer |
| Lista de ações por clique explícito | DropdownMenu |
| Ações contextuais por clique direito | ContextMenu, **sempre** com alternativa acessível — clique direito não é descobrível |
| Conteúdo interativo contextual, ao lado da página | Popover |
| Prévia informativa no hover e no foco | HoverCard — nunca o único caminho para a informação |
| Texto explicativo curto, não interativo | Tooltip |
| Busca rápida e paleta de comandos | Command |

A pergunta que separa DropdownMenu de Popover: **a pessoa vai escolher ou vai
compor?** Se uma letra digitada ali dentro é atalho, é menu; se é texto, é
popover (D1 do `dropdown-menu.md`).

**Dialog no desktop, Drawer no mobile** é uma recomendação de uso, não uma peça
pronta — nenhuma stack tem essa composição. Quem a monta extrai o conteúdo para
um componente próprio e mantém um estado de abertura só, no chamador.

---

## Superfície

A superfície de um overlay é decidida pela **folha do componente**, e é a classe
dele que a aplica. Não existe utilitária de superfície flutuante, de propósito:
overlay pintado por fora perde elevação, raio e animação de entrada — e quebra
primeiro no modo escuro, onde a diferença entre as superfícies é o que separa um
plano do outro.

| componente | classe | fundo | texto |
|---|---|---|---|
| Dialog | `.nds-dialog-content` | `--popover` | `--popover-foreground` |
| Sheet | `.nds-sheet-content` | `--background` | `--foreground` |
| AlertDialog | `.nds-alert-dialog-content` | `--background` | `--foreground` |
| Drawer | `.nds-drawer-content` | `--background` | `--foreground` |
| DropdownMenu, ContextMenu, Menubar | `.nds-dropdown-menu-content` | `--popover` | `--popover-foreground` |
| Popover | `.nds-popover-content` | `--popover` | `--popover-foreground` |
| HoverCard | `.nds-hover-card-content` | `--popover` | `--popover-foreground` |
| Command | `.nds-command` | `--popover` | `--popover-foreground` |
| Tooltip | `.nds-tooltip-content` | `--primary` | `--primary-foreground` |

Medido nas folhas em 2026-09-10 e de novo em 2026-09-15, sem mudança. **Nenhuma
lê `--card`.**

- **O Tooltip é o único que inverte o par**, e é o exemplo de por que ninguém
  pinta fundo por fora: uma classe de fundo por cima o transformaria num
  retângulo sem contraste com o próprio texto.
- **Os quatro painéis modais não concordam**: o Dialog lê `--popover` e os
  outros três `--background`. A divergência está registrada, com a medição, na
  D1 do [`dialog.md`](../prd/dialog.md). Enquanto durar, o que vale é a regra
  estrutural acima.

## Véu

`--overlay` a 80%, **sem desfoque**. As folhas modais o declaram em
`.nds-dialog-overlay`, `.nds-alert-dialog-overlay` e `.nds-sheet-overlay` — o
Drawer reusa o do Sheet nas cinco stacks (a `drawer.css` não declara véu). O
último `backdrop-filter` saiu do Dialog em 2026-09-08 (D5 do `dialog.md`): sob
um véu a 80% o desfoque quase não aparecia, e custava pintura em toda abertura.

## Camadas

A ordem sai da escada de tokens, e cada folha lê o seu degrau — número escrito
no call site desfaz a garantia:

| token | valor | quem lê (medido nas folhas em 2026-09-15) |
|---|---:|---|
| `--z-dropdown` | 1000 | nenhum overlay — só a DataTable |
| `--z-sticky` | 1020 | ninguém; degrau reservado para cabeçalho fixo de aplicação |
| `--z-fixed` | 1030 | nenhum overlay — só o Sidebar |
| `--z-modal-backdrop` | 1040 | véu do Dialog, do AlertDialog e do Sheet (que o Drawer reusa) |
| `--z-modal` | 1050 | painel do Dialog, do AlertDialog, do Sheet e do Drawer |
| `--z-popover` | 1060 | Popover, HoverCard, DropdownMenu e o painel do Menubar — e, fora desta categoria, Select, Combobox, NavigationMenu e Composer |
| `--z-tooltip` | 1070 | Tooltip |
| `--z-toast` | 1080 | Sonner |

O Command não lê degrau nenhum: ele não flutua sozinho, e mora dentro do painel
que o contém.

O flutuante fica ACIMA do modal de propósito: o popover ou o tooltip de um
controle que mora dentro de um diálogo tem de aparecer por cima dele. Não existe
utilitária de camada (`.nds-z-*`).

## Elevação e movimento

Os dois atravessam mais que esta categoria, e moram na guideline do assunto:

- **Elevação** sai do TIPO de superfície — flutuante interativo `md`, flutuante
  passivo `lg`, modal e drawer `xl` —, em
  [`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) §Qual degrau. A
  barra do Menubar é a única peça desta categoria fora dos três: ela não flutua,
  e desde 2026-09-12 lê o degrau `xs`, que nasceu para relevo no plano da página
  — antes era uma sombra cravada na folha, invisível ao portão, que só classifica
  quem LÊ `var(--elevation-*)`. O Command não tem sombra: a elevação é do painel
  que o hospeda.
- **Movimento reduzido**: quem para o movimento é a camada de token, que zera a
  escada de `--duration-*` sob a preferência. Toda folha desta categoria que
  anima declara duração só por token — medido em 2026-09-15, nenhuma duração
  literal. Duas não animam nada: a do Popover desde 2026-09-12 e a do Tooltip
  desde 2026-09-16, as duas por decisão da dona — no Tooltip a saída pendurava em
  `[data-ending-style]`, atributo de lib que não chegava às cinco, então o balão
  saía animado em algumas stacks e seco nas outras. Regra em [`13-animacao.md`](13-animacao.md); o
  mecanismo, medido, na §8 do [`hover-card.md`](../prd/hover-card.md), onde a
  leitura errada pousou duas vezes.

  **As guardas por folha são redundância, e três delas não seguram nada.**
  `@media` não acrescenta especificidade, então guarda que mira a classe nua
  (0,1,0) perde para a animação declarada num seletor de atributo (0,2,0).
  Medido em 2026-09-15: o `animation: none` perde no Dialog
  (`[data-state="open"]`, `[data-closed]`), no Sheet (`[data-side="…"]`) e no
  DropdownMenu (`[data-state="open"]`). Eram quatro: a do Tooltip perdia para
  `[data-ending-style]`, e saiu junto com a transição em 2026-09-16 — folha que
  não anima não precisa de guarda. Vencem as do AlertDialog e do Drawer, que
  repetem o seletor de atributo, e as do Command e do Menubar, que miram a mesma
  classe nua da transição. Nada disso deixa movimento na tela — a camada de token
  alcança as três —, e é por isso que ninguém tinha visto.

---

## Teclado e foco

Nas quatro stacks com lib, o comportamento vem do primitivo headless e **não se
reimplementa**. No vanilla, cada fábrica o implementa — ver a
`10-overlay-components.md` de lá.

| tecla | o que faz |
|---|---|
| `Escape` | fecha o overlay do topo da pilha. No Tooltip o foco **fica** no gatilho; no AlertDialog fechar equivale a cancelar |
| `Tab` / `Shift+Tab` | na família modal (Dialog, AlertDialog, Sheet, Drawer) o foco fica **preso** no painel. Menu e Popover não prendem: Tab sai e segue a página — no menu, e fecha |
| setas | percorrem os itens do menu e o destaque do Command |
| letra | no menu, typeahead; no Command, vira texto da busca, e o foco nunca sai do campo |

- **Ao fechar, o foco volta ao gatilho** — Dialog, AlertDialog, Sheet, Drawer,
  Popover e DropdownMenu (e o Menubar, ao gatilho da barra).
- **Clique fora**: fecha Dialog, Sheet, Popover e menu; **não** fecha o
  AlertDialog, que exige escolha explícita (D1 do `alert-dialog.md`). O Drawer
  fecha pelo véu e pelo arraste quando é `dismissible`.
- **HoverCard e Tooltip abrem também no foco por Tab**, sem exigir ponteiro —
  WCAG 1.4.13. O Tooltip abre no foco sem atraso: a espera é só do ponteiro.

## Modalidade

| família | `aria-modal` | o que liga junto |
|---|---|---|
| AlertDialog | sempre `"true"` | foco preso, rolagem travada |
| Dialog, Sheet | `"true"` — o vanilla escreve sem condição; react e vue acompanham o `modal` da raiz da lib, que é `true` no padrão | foco preso, rolagem travada |
| Drawer | `"true"` no padrão; `modal` existe e é `true` por padrão nas cinco, e com `modal: false` o atributo fica **ausente** | foco preso, rolagem travada — os três saem juntos no não-modal |
| Popover | só com `modal: true` — no padrão, **ausente**, nem como `"false"` | as mesmas três coisas, juntas (D2 do `popover.md`) |
| HoverCard, Tooltip, DropdownMenu, ContextMenu, Menubar, Command | nunca | — |

O `modal` do DropdownMenu tem padrão `true`, e ali significa véu de interação e
trava de rolagem — **não** armadilha de foco (D1 do `dropdown-menu.md`). O
Command em si nunca anuncia modalidade; quando é montado dentro de um Dialog,
quem anuncia é o Dialog.

## Título

O título do painel sai em **`h2` por padrão**, e aceita qualquer nível de `h1`
a `h6`. Cada stack chega lá pelo mecanismo da própria lib — a tabela "Nível do
título, por stack" está no PRD de cada painel. No angular não há padrão a
herdar: no Dialog, no AlertDialog, no Sheet e no Drawer o SELETOR carrega o
elemento (`h1[ndsAlertDialogTitle]` … `h6[ndsAlertDialogTitle]`), e no Popover
ele é só atributo (`[ndsPopoverTitle]`) — nos dois casos o nível é o que quem
escreve usa.

**Até 2026-09-12 esta linha terminava em "e todos os exemplos da stack usam
`h2`", e era falso em 39 pontos.** O inventário daquele dia achou, no Angular,
**39 títulos de overlay em `h3` contra 138 em `h2`** — o popover INTEIRO (27),
onze demos do `DrawerDocs` e um título só-para-leitor do `CommandDocs`. O defeito
chegou por captura de tela: o mesmo popover, lado a lado, saía `h2` no vanilla e
`h3` no Angular.

Duas coisas o mantiveram invisível. A primeira é que **qualquer nível é HTML
válido** — não há compilador, teste ou folha que reprove. A segunda é que o
portão `nivel_de_titulo_divergente` lia o DEFAULT declarado pela peça, e no
Angular não existe default para ler: o nível é escolha do call site. O portão
ganhou o ramo que mede call site, com exceção declarada para as stories
`HeadingH3`, que demonstram a capacidade de trocar o nível de propósito — e com
o irmão que confere a premissa, que na primeira medição já derrubou uma entrada
que eu tinha escrito errado.

**O nome da opção é relativo ao escopo da fábrica, e isso não é divergência** —
já foi relatado como tal três vezes. No vanilla, fábrica que monta só o título
usa `level` (`createPopoverTitle`, `createCardTitle`); fábrica que monta o
componente inteiro usa `titleLevel` (`createDialog`, `createSheet`,
`createDrawer`, `createAlertDialog`).

## O corpo que rola

- O corpo do painel é `flex: 1 1 auto`, **nunca** o atalho `flex: 1`: o atalho
  zera a base, e o corpo de conteúdo curto colapsa (D3 do `sheet.md`, D6 do
  `drawer.md`).
- Caixa que rola é parada de teclado (WCAG 2.1.1), e o trio vai junto:
  `tabindex="0"`, `role="group"` e `aria-label`. Parada de teclado precisa de
  papel, e nome em elemento sem papel é atributo proibido. É `group` e não
  `region`, porque marco aninhado num diálogo já nomeado não acrescenta
  navegação.
- Há **uma** saída para conteúdo longo: o corpo rola, com o painel fixo (D7 do
  `dialog.md`).

## Formulário e rodapé

- Painel com `<form>` tem como submeter: o botão de submissão fica **dentro** do
  formulário, ou fora dele com `form="<id>"`. O Dialog põe o rodapé dentro do
  `<form>`, que é o que faz o Enter funcionar (D10 do `dialog.md`); o Sheet e o
  Drawer religam por `form="<id>"` (D9 do `sheet.md`, D14 do `drawer.md`).
- A ordem dos botões do rodapé é a regra transversal de grupos de botões — o
  primário é o ÚLTIMO do DOM, à direita quando deitado e no topo quando
  empilhado: [`02-alinhamento-botoes.md`](02-alinhamento-botoes.md).

## Analytics

O vocabulário do payload — `component` em kebab-case, `trigger_id` para o
gatilho, `label` estável e nunca texto — é regra de todos os eventos, e está em
[`07-analytics.md`](07-analytics.md). O que é desta categoria:

- **Quem abriu vai em `trigger_id`, em todo painel** — `dialog_*` (Dialog,
  AlertDialog e Sheet, nos TRÊS eventos: `dialog_open`, `dialog_close` e
  `dialog_confirm`), `drawer_*`, `popover_open`,
  `hover_card_open` e `tooltip_view`. O valor é o id estável do gatilho; no Sheet
  e no Drawer das demonstrações, o lado que ele abre. **A obrigatoriedade não é a
  mesma nos dois grupos**, medido nos cinco `analytics.ts` em 2026-09-15: em
  `dialog_*` e `drawer_*` o campo é obrigatório e `label?: never` reprova o nome
  antigo; em `popover_open`, `hover_card_open` e `tooltip_view` ele é opcional
  (`trigger_id?`), e o `popover_close` e o `hover_card_close` não o levam. Até
  2026-09-10 o mesmo papel tinha três nomes, e o último a cair foi `label`, no
  AlertDialog, no Sheet e no Drawer — a dona unificou em `trigger_id`. Os menus
  ficam de fora: lá quem identifica é o menu, no campo `menu`.

- **O fechamento diz por que fechou**, com `reason` **obrigatório** e de
  vocabulário do design system, nunca o da lib — quatro palavras, iguais em
  `dialog_close` (Dialog, Sheet, AlertDialog), `drawer_close`, `popover_close` e
  os três da família de menus — `dropdown_menu_close`, `context_menu_close` e
  `menubar_close`, que nunca emitem `close-button`, porque menu não tem controle
  de fechar (o tipo carrega as quatro palavras mesmo assim, para o vocabulário
  ser um só no GA4):

  | motivo | caminho |
  |---|---|
  | `escape` | tecla Escape |
  | `overlay` | saiu sem decidir nada — clique fora, foco que saiu (o Tab num menu) |
  | `close-button` | controle explícito de fechar ou de cancelar |
  | `api` | fechou por decisão de dentro — a ação que confirma, ou código |

  O HoverCard não leva `reason`: é passivo, fechar é quase sempre "o ponteiro
  saiu", e o campo ia preenchido por uma stack só (ver o `hover-card.md` §9).
- **Onde a lib não publica motivo, quem deduz fica AO LADO DO PRIMITIVO** — um
  helper exportado do mesmo índice das peças, que anota os eventos de `Escape` e
  de clique fora do conteúdo e marca a confirmação ANTES de o painel fechar. A
  ação que confirma e o cancelar costumam ser partes de fechar da lib, que
  entrega o mesmo motivo para as duas — sem a marca, "confirmou" chega ao
  relatório como "apertou o botão de fechar".

  Esta linha dizia "a docs page o deduz" até 2026-09-11, e era o contrato ao
  contrário: quem consome remendando o que o componente não sabe dizer. O
  sintoma, medido no Sheet do vanilla — a stack de REFERÊNCIA de contrato —, era
  a página fingir um clique no véu para fechar pelo rodapé e sobrescrever o
  motivo relatado com uma variável dela. A página repassa a palavra; inventar a
  palavra é do componente. Portão: `motivo_sintetizado_na_docs_page`.

- **Desmontar não é fechar.** O painel que sai da página junto com quem o montou
  — troca de story, desmonte de docs page, troca de idioma, que refaz as seções —
  não emite evento de fechamento. Se emitir, o relatório recebe um fechamento que
  ninguém fez, e com `api` ele fica indistinguível de quem confirmou a ação. O
  desmonte remove o painel e, no máximo, avisa o estado (`onOpenChange(false)`),
  que descreve situação e não gesto — e não devolve foco, porque quem desmonta
  pode ter tirado o próprio gatilho do documento. Medido em 2026-09-11 e
  2026-09-12 em cinco fábricas do vanilla. Portão: `desmonte_emite_fechamento`.
- **Até 2026-09-10 a quarta palavra não era a mesma**: `api` no drawer e no
  popover, `action` no `dialog_close` — que ainda aceitava `user` e `unknown` no
  React, era opcional em três stacks e ia vazio no Dialog e no AlertDialog do Vue
  e do Svelte. A dona decidiu por `api`. Portão: `reason_vocabulario_divergente`.
- **Vocabulário mais curto se DECLARA.** Componente que legitimamente não tem um
  dos motivos — o AlertDialog não fecha por clique no véu — entra em
  `FAMILIA_DE_MOTIVO`, em `scripts/audit.mjs`, com a premissa conferida contra o
  PRD dele: se o comportamento mudar, a exceção cai sozinha. Sem essa declaração,
  "menos palavras" é a porta por onde uma peça fica para trás sem nada reprovar,
  e foi por ela que o `SheetCloseReason` do vanilla passou seis semanas com três
  palavras contra as quatro do Dialog da mesma stack. Dois portões guardam os
  dois eixos: `reason_da_familia_divergente` entre os componentes que dividem um
  evento, `reason_entre_stacks_divergente` entre as stacks que declaram o mesmo
  tipo.

## Posicionamento dos flutuantes

- **O painel flutuante fica EM FLUXO dentro do invólucro que a lib posiciona.**
  Folha que declara `position: absolute` sem deslocamento nenhum na família de
  seletores colapsa esse invólucro para 0×0, e a lib passa a calcular posição e
  colisão contra uma caixa vazia — sem erro, com o painel aparecendo no lugar
  errado. Custou o Tooltip (2026-09-04) e o HoverCard (2026-09-13). Ou a folha
  declara o deslocamento e É o posicionador, ou ela não declara `position`; a
  fábrica sem lib crava a posição inline, que é onde essa responsabilidade mora.

A animação de entrada dos painéis flutuantes que animam cresce a partir do
gatilho, e a origem sai de uma cadeia de custom properties — uma por lib, porque
cada uma publica com o seu prefixo:

```
transform-origin: var(--transform-origin,                          ← base-ui e radix-ng
                    var(--reka-<peça>-content-transform-origin,     ← reka
                      var(--bits-<peça>-content-transform-origin,   ← bits
                        center)));
```

- **O nome da peça no bits não se deriva do nome do componente.** O HoverCard é
  `link-preview`, e a folha do DropdownMenu, que veste três componentes, precisa
  de quatro degraus do bits (`dropdown-menu`, `context-menu`, `menubar` e `menu`
  para os submenus) e três do reka.
- **Degrau faltando não quebra nada visível**: `center` é fallback válido, e o
  painel do Svelte passava a crescer do MEIO em silêncio. Foi o defeito que mais
  voltou como "achado novo".
- **O Popover mantém a cadeia sem animar.** Ela é inerte desde 2026-09-12, quando
  a animação saiu, e continua declarada — e cobrada pelo portão — para que a
  animação, se voltar, volte com a origem certa.

---

## Invariantes — quem cobra cada regra

A regra que atravessa componentes e stacks não se mantém verdadeira por
instrução: o que a mantém é um **portão**. Esta tabela diz qual, e o que ele não
cobre — metade coberta que se anuncia inteira é o defeito que ela existe para
evitar.

Cada linha foi conferida contra `scripts/audit.mjs` e as stories das cinco
stacks em 2026-09-15.

| invariante | onde a regra está | portão | o que o portão NÃO cobre |
|---|---|---|---|
| Movimento para sob `prefers-reduced-motion` | `13-animacao.md` | `movimento_sem_guarda_eficaz` (todas as folhas de `docs/shared/styles/nds/`: duração literal sem guarda, ou com guarda que perde por especificidade) | duração por token fica de fora de propósito — a camada de token a alcança. Por isso a guarda INERTE sobre duração por token passa calada: quatro desta categoria (Dialog, Sheet, DropdownMenu, Tooltip), ver §Elevação e movimento |
| Elevação por tipo de superfície | `04-padroes-design-sistema.md` | `elevacao_fora_do_mapa` · `prd_token_sem_lastro` confere a tabela de geometria de cada PRD contra a folha | folha que não está no mapa e não LÊ `var(--elevation-*)` não é classificada; sombra literal é da `sombra_cravada`. O `prd_token_sem_lastro` lê um sentido só: token que a folha lê e o PRD não cita não reprova |
| `reason` no fechamento | aqui, §Analytics | `reason_vocabulario_divergente` (em todo `*_close` dos cinco `analytics.ts`: presente, obrigatório e com as quatro palavras, salvo o `hover_card_close`, declarado em `FECHAMENTO_SEM_REASON` com premissa neste arquivo; em todo `*CloseReason`, só palavra FORA do vocabulário) · `reason_da_familia_divergente` e `reason_entre_stacks_divergente` (o `*CloseReason` com MENOS palavras) · `motivo_sintetizado_na_docs_page` (docs page que traduz o motivo por conta própria) · `reason_parcial_entre_stacks` (presença de `reason` nas chamadas de `track` das docs pages, entre stacks) | que o componente mapeie cada caminho para a palavra CERTA — isso é das plays que colecionam os motivos relatados. E o `reason_parcial_entre_stacks` lista `menu_close`, evento que nenhuma stack tipa: `dropdown_menu_close`, `context_menu_close` e `menubar_close` ficam fora dele (a presença nesses três segue cobrada pelo tipo obrigatório) |
| Desmontar não emite fechamento | aqui, §Analytics | `desmonte_emite_fechamento` | só o vanilla, só o callback de limpeza de `tornarDestruivel`, e só até dois saltos de chamada local até `onClose`; chamada de método (`obj.close()`) não é seguida. Nas quatro stacks com lib, nada |
| Nível do título | aqui, §Título | `nivel_de_titulo_divergente` — no vanilla, o default ESCRITO de `titleLevel`/`level` em `dialog.ts`, `alert-dialog.ts`, `sheet.ts`, `drawer.ts` e `popover.ts`; no Angular, o call site `<hN … nds{Popover,Dialog,AlertDialog,Sheet,Drawer,HoverCard}Title>`, com as exceções de `NIVEL_TROCADO_DE_PROPOSITO` e a premissa `HeadingH3` conferida | react, vue e svelte, onde o nível vem da lib ou de `aria-level` escrito à mão; no Angular, título cujo `<hN>` não está literal no template do arquivo |
| Cadeia de `transform-origin` | aqui, §Posicionamento | `cadeia_transform_origin_sem_bits` · `cadeia_transform_origin_premissa` · `cadeia_transform_origin_nao_declarada` (os dois últimos NÃO levam `sem_bits` no nome — a forma abreviada que esta linha usava até 2026-09-12 devolvia zero a quem procurasse por ela) | `navigation-menu` fica de fora, declarado: o bits não publica origem para ele. A premissa só é conferida onde há `node_modules` do svelte. E o portão lê a cadeia da FOLHA, não se a stack escreve a variável: o ContextMenu do vanilla não escrevia `--transform-origin` nenhum e caía em `center` (medido em 2026-09-10; hoje escreve, em `context-menu.ts`) |
| Painel flutuante em fluxo no invólucro da lib | aqui, §Posicionamento | `folha_tira_do_fluxo_sem_dizer_onde` · `posicao_sem_deslocamento_declarada_vencida` (a exceção declarada cuja premissa caiu) | deslocamento escrito em seletor que não é da mesma família de prefixo; e se o invólucro da lib colapsa por outra causa que não `position` na folha |
| Anel de foco | `01-acessibilidade.md` | `focus_ring_sobrescrito` · `focus_ring_translucido` · `anel_de_foco_ausente` (peça que zera o `outline` sem regra de foco que desenhe anel; 10 exceções declaradas em `ANEL_DE_FOCO_EXCECOES`, cada uma com premissa conferida em arquivo) | que o anel CONTRASTE com o fundo em cada tema — a regra lê presença; a razão é da `focus_ring_translucido` só para `box-shadow`. Nasceu em 2026-09-10 e achou o navigation-menu sem anel em três peças, corrigido junto |
| O ponteiro pinta o destaque em toda peça | D4 do `dropdown-menu.md` | `destaque_sem_hover` (peça pintada por `[data-highlighted]` sem o `:hover` par na folha; select e combobox são exceções declaradas, porque o vanilla destaca por ponteiro ali — premissa conferida no arquivo) | a COR do hover — a regra lê a presença do par, não se ele pinta o mesmo que o destaque. Nasceu em 2026-09-10: no vanilla o mouse não pintava marcação, rádio nem sub-gatilho |
| Modalidade | aqui, §Modalidade | `modalidade_sem_condicao` — `aria-modal` com o literal `true` sem condição, nos primitivos de `popover`, `hover-card`, `tooltip` e `dropdown-menu` | Command, ContextMenu e Menubar estão fora da lista `NAO_MODAIS`. O inverso — a família modal anunciar — é da suíte: há asserção de `aria-modal` nas stories de Dialog, AlertDialog, Sheet, Drawer e Popover nas cinco stacks |
| Foco volta ao gatilho ao fechar | aqui, §Teclado e foco | nenhum portão de audit — play, nas cinco, no Dialog, AlertDialog, Sheet, Drawer, Popover, DropdownMenu e Menubar | nada reprova um overlay NOVO sem essa asserção |
| Rolagem travada no modal | aqui, §Modalidade | nenhum portão de audit — play no Dialog (cinco stacks), no Popover modal (cinco) e no Sheet (quatro; não no svelte) | o AlertDialog não tem asserção de trava em stack nenhuma, e o Drawer só no Angular — medido por leitura das stories em 2026-09-15 |
| O `<form>` e o rodapé | aqui, §Formulário | `submit_fora_do_form`, só nos `*Code` do `translations.json` do slug; play lendo `button.form` — no Drawer nas cinco, no Dialog em svelte, vanilla e angular, no Sheet em svelte e vanilla | a varredura do código das stacks foi retirada em 2026-09-08 (a maioria dos achados era falsa); por isso, nas stacks sem a play, nada lê o elo |
| Vocabulário do payload | `07-analytics.md` | `i18n_text_in_payload` · `component_nao_kebab` · `campo_gatilho_divergente` (o nome antigo do campo no Popover, em qualquer lugar, e `label` no payload de `dialog_*`/`drawer_*` escrito na mesma linha que o `component`, em conteúdo, PRD, guideline e código) · `location_fora_do_vocabulario` · `campo_de_payload_morto` · `rotulo_de_rastreio_texto` · o TIPO: `label?: never` em `dialog_*` e `drawer_*` nos cinco `analytics.ts` | payload documentado em mais de uma linha escapa do `campo_gatilho_divergente`; e o nome do campo nos eventos que não são de painel — o menu usa `menu`, e nada cobra que continue assim |
| O véu não desfoca | aqui, §Véu | `veu_com_desfoque` (seletor `-overlay`/`-backdrop` nas nove folhas de `OVERLAY_FOLHAS`) | desfoque declarado em seletor sem esses sufixos |
| Corpo é `flex: 1 1 auto` | aqui, §O corpo que rola | `corpo_com_atalho_flex` (seletor `-body` nas nove folhas de `OVERLAY_FOLHAS`, valor exato `flex: 1;`) | `flex: 1 1 0`, `flex-basis: 0` e o atalho como última declaração da regra, sem `;` |
| Ordem dos botões no rodapé | `02-alinhamento-botoes.md` | play, nas cinco: no Dialog, a story `CustomCloseInFooter` (ordem no DOM); no AlertDialog, a story `Responsive` (ordem no DOM e `column-reverse` no estreito) | no Drawer e no Sheet, a ordem renderizada não é asserida em stack nenhuma — a play do Drawer confere só que os dois botões EXISTEM (`toContain`), inclusive no Angular, cujo passo se chama "nessa ordem de leitura". O snippet do Drawer é asserido no Vue e no Angular (`drawer.source.test.ts`) |
| A regra de categoria não volta a ser copiada por stack | aqui | `guideline_de_stack_repete_categoria` | compara títulos de seção, e só na `10-overlay-components.md`: cópia sem o título escapa, e cópia em outro arquivo de stack também — medido em 2026-09-15, a `01-regras-gerais.md` das cinco stacks ainda manda Dialog em `--card`, e a `03-sistema-design.md` do svelte, do vanilla e do angular põe Dialog, Sheet e Drawer em `--card` e o Tooltip em `--popover` |

A **largura como custom property com default em `:root`** não entra: só três dos
nove a têm (Sheet, Drawer, HoverCard), o Popover é exceção declarada (D6), e os
outros cinco não fixam largura desse jeito. É decisão de três PRDs, não
invariante de categoria.

### O que está aberto

1. **A ordem do rodapé do Drawer e do Sheet** não é asserida no DOM renderizado
   em stack nenhuma, enquanto a do Dialog e a do AlertDialog são asseridas nas
   cinco. No Drawer a play já tem o passo — só assere presença. É play, não regra
   de audit.
2. **Quatro guardas de movimento reduzido inertes** (Dialog, Sheet, DropdownMenu,
   Tooltip). Não há movimento sobrando, porque a camada de token alcança; a
   decisão é se a guarda por folha sai — como saiu do Popover, pelo argumento de
   que guarda inerte anuncia proteção que não dá — ou se ganha o seletor de
   atributo, como a do AlertDialog e a do Drawer.
3. **As cópias de `--card` nas guidelines de stack** (`01-regras-gerais.md` nas
   cinco, `03-sistema-design.md` em três) contradizem a §Superfície, e o portão
   de cópia só lê a `10-overlay-components.md`.

### Como este inventário foi levantado, para poder ser refeito

1. Extrair os títulos `### D<n>` dos nove PRDs — eram 87 decisões fixadas em
   2026-09-10.
2. Agrupar por ASSUNTO e contar em quantos PRDs cada assunto aparece. Assunto que
   aparece em um só é decisão do componente, e sai da lista.
3. Para cada assunto restante, procurar regra no `audit.mjs` por nome **e** por
   implementação.

Dois cuidados que mudaram o resultado da primeira vez: `grep -E` trata `\|` como
barra LITERAL, então padrão alternado escrito assim devolve zero e parece
confirmar ausência; e "aparece no PRD" não é o mesmo que "é decisão fixada" — o
movimento reduzido aparecia nos nove, como parágrafo de seção, nunca como `D`.

**A lista não promete estar completa.** Invariante que nunca virou decisão fixada
em PRD nenhum não aparece aqui — foi o caso do movimento reduzido até
2026-09-09, que vivia só em comentário de CSS, e do retorno de foco e da trava de
rolagem até 2026-09-15, que viviam só em play. O teste de que ela fechou não é
ficar sem linhas abertas: é **um relato novo cair num assunto que já está na
tabela**. Enquanto chegar achado de assunto que não está aqui, ela ganha uma
linha.
