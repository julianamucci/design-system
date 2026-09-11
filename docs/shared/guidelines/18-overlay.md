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
| DropdownMenu, ContextMenu, Menubar | [dropdown-menu.md](../prd/dropdown-menu.md) — o ContextMenu e o Menubar não têm folha própria (D9) |
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
mão no vanilla — continua na `10-overlay-components.md` daquela stack, e o
portão `guideline_de_stack_repete_categoria` impede que ela volte a copiar este
arquivo.

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

Medido nas folhas em 2026-09-10. **Nenhuma lê `--card`.**

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
Drawer reusa o do Sheet. O último `backdrop-filter` saiu do Dialog em 2026-09-08
(D5 do `dialog.md`): sob um véu a 80% o desfoque quase não aparecia, e custava
pintura em toda abertura.

## Camadas

A ordem sai da escada de tokens, e cada folha lê o seu degrau — número escrito
no call site desfaz a garantia:

| token | valor | quem lê |
|---|---:|---|
| `--z-dropdown` | 1000 | |
| `--z-sticky` | 1020 | |
| `--z-fixed` | 1030 | |
| `--z-modal-backdrop` | 1040 | véu do Dialog, do AlertDialog e do Sheet (que o Drawer reusa) |
| `--z-modal` | 1050 | painel do Dialog, do AlertDialog, do Sheet e do Drawer |
| `--z-popover` | 1060 | Popover, HoverCard, DropdownMenu, popup do Combobox |
| `--z-tooltip` | 1070 | Tooltip |
| `--z-toast` | 1080 | Toast |

O flutuante fica ACIMA do modal de propósito: o popover ou o tooltip de um
controle que mora dentro de um diálogo tem de aparecer por cima dele. Não existe
utilitária de camada (`.nds-z-*`).

## Elevação e movimento

Os dois atravessam mais que esta categoria, e moram na guideline do assunto:

- **Elevação** sai do TIPO de superfície — flutuante interativo `md`, flutuante
  passivo `lg`, modal e drawer `xl` —, em
  [`04-padroes-design-sistema.md`](04-padroes-design-sistema.md) §Qual degrau.
- **Movimento reduzido**: quem para o movimento é a camada de token, que zera a
  escada de `--duration-*` sob a preferência; as nove folhas desta categoria
  declaram duração só por token. Regra em [`13-animacao.md`](13-animacao.md); o
  mecanismo, medido, na §8 do [`hover-card.md`](../prd/hover-card.md), onde a
  leitura errada pousou duas vezes.

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

- **Ao fechar, o foco volta ao gatilho** — Dialog, AlertDialog, Sheet, Popover e
  DropdownMenu.
- **Clique fora**: fecha Dialog, Sheet, Popover e menu; **não** fecha o
  AlertDialog, que exige escolha explícita (D1 do `alert-dialog.md`). O Drawer
  fecha pelo véu e pelo arraste quando é `dismissible`.
- **HoverCard e Tooltip abrem também no foco por Tab**, sem exigir ponteiro —
  WCAG 1.4.13. O Tooltip abre no foco sem atraso.

## Modalidade

| família | `aria-modal` | o que liga junto |
|---|---|---|
| Dialog, AlertDialog, Sheet, Drawer | sempre `"true"` | foco preso, rolagem travada |
| Popover | só com `modal: true` — no padrão, **ausente**, nem como `"false"` | as mesmas três coisas, juntas (D2 do `popover.md`) |
| HoverCard, Tooltip, DropdownMenu, Command | nunca | — |

O `modal` do DropdownMenu tem padrão `true`, e ali significa véu de interação e
trava de rolagem — **não** armadilha de foco (D1 do `dropdown-menu.md`).

## Título

O título do painel sai em **`h2` por padrão**, e aceita qualquer nível de `h1`
a `h6`. Cada stack chega lá pelo mecanismo da própria lib — a tabela "Nível do
título, por stack" está no PRD de cada painel. No angular não há padrão a
herdar: o SELETOR carrega o elemento (`h2[ndsAlertDialogTitle]`), então o nível
é o que quem escreve usa — e todos os exemplos da stack usam `h2`.

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
  AlertDialog, Sheet), `drawer_*`, `popover_open`, `hover_card_open` e
  `tooltip_view`. O valor é o id estável do gatilho; no Sheet e no Drawer das
  demonstrações, o lado que ele abre. Até 2026-09-10 o mesmo papel tinha três
  nomes, e o último a cair foi `label`, no AlertDialog, no Sheet e no Drawer —
  a dona unificou em `trigger_id`. Os menus ficam de fora: lá quem identifica é o
  menu, no campo `menu`.

- **O fechamento diz por que fechou**, com `reason` **obrigatório** e de
  vocabulário do design system, nunca o da lib — quatro palavras, iguais em
  `dialog_close` (Dialog, Sheet, AlertDialog), `drawer_close`,
  `popover_close` e `context_menu_close` (este nunca emite `close-button`: o
  menu não tem controle de fechar):

  | motivo | caminho |
  |---|---|
  | `escape` | tecla Escape |
  | `overlay` | saiu sem decidir nada — clique fora, foco que saiu (o Tab num menu) |
  | `close-button` | controle explícito de fechar ou de cancelar |
  | `api` | fechou por decisão de dentro — a ação que confirma, ou código |

  O HoverCard não leva `reason`: é passivo, fechar é quase sempre "o ponteiro
  saiu", e o campo ia preenchido por uma stack só (ver o `hover-card.md` §9).
- **Onde a lib não publica motivo, a docs page o deduz**: anota os eventos de
  `Escape` e de clique fora do conteúdo, e marca a confirmação ANTES de o painel
  fechar. A ação que confirma e o cancelar costumam ser partes de fechar da lib,
  que entrega o mesmo motivo para as duas — sem a marca, "confirmou" chega ao
  relatório como "apertou o botão de fechar".
- **Até 2026-09-10 a quarta palavra não era a mesma**: `api` no drawer e no
  popover, `action` no `dialog_close` — que ainda aceitava `user` e `unknown` no
  React, era opcional em três stacks e ia vazio no Dialog e no AlertDialog do Vue
  e do Svelte. A dona decidiu por `api`. Portão: `reason_vocabulario_divergente`.

## Posicionamento dos flutuantes

A animação de entrada dos painéis flutuantes cresce a partir do gatilho, e a
origem sai de uma cadeia de custom properties — uma por lib, porque cada uma
publica com o seu prefixo:

```
transform-origin: var(--transform-origin,                          ← base-ui e radix-ng
                    var(--reka-<peça>-content-transform-origin,     ← reka
                      var(--bits-<peça>-content-transform-origin,   ← bits
                        center)));
```

- **O nome da peça no bits não se deriva do nome do componente.** O HoverCard é
  `link-preview`, e a folha do DropdownMenu, que veste três componentes, precisa
  de quatro degraus (`dropdown-menu`, `context-menu`, `menubar` e `menu` para os
  submenus).
- **Degrau faltando não quebra nada visível**: `center` é fallback válido, e o
  painel do Svelte passava a crescer do MEIO em silêncio. Foi o defeito que mais
  voltou como "achado novo".

---

## Invariantes — quem cobra cada regra

A regra que atravessa componentes e stacks não se mantém verdadeira por
instrução: o que a mantém é um **portão**. Esta tabela diz qual, e o que ele não
cobre — metade coberta que se anuncia inteira é o defeito que ela existe para
evitar.

| invariante | onde a regra está | portão | o que o portão NÃO cobre |
|---|---|---|---|
| Movimento para sob `prefers-reduced-motion` | `13-animacao.md` | `movimento_sem_guarda_eficaz` | duração por token fica de fora de propósito — a camada de token a alcança |
| Elevação por tipo de superfície | `04-padroes-design-sistema.md` | `elevacao_fora_do_mapa` · `prd_token_sem_lastro` confere cada PRD contra a folha | — |
| `reason` no fechamento | aqui, §Analytics | `reason_parcial_entre_stacks` (presença entre stacks) · `reason_vocabulario_divergente` (obrigatório e com as quatro palavras, em todo `*_close` e todo `*CloseReason`) | que a docs page deduza o motivo CERTO — o portão lê o tipo, não o caminho que o preenche |
| Nível do título | aqui, §Título | `nivel_de_titulo_divergente` | lê o default no vanilla, onde está ESCRITO; nas outras quatro ele vem da lib |
| Cadeia de `transform-origin` | aqui, §Posicionamento | `cadeia_transform_origin_sem_bits` · `_premissa` · `_nao_declarada` | `navigation-menu` fica de fora, declarado: o bits não publica origem para ele. E o portão lê a cadeia da FOLHA, não se a stack escreve a variável: o ContextMenu do vanilla não escrevia `--transform-origin` nenhum e caía em `center` (medido em 2026-09-10) |
| Anel de foco | `01-acessibilidade.md` | `focus_ring_sobrescrito` · `focus_ring_translucido` · `anel_de_foco_ausente` (peça que zera o `outline` sem regra de foco que desenhe anel; 10 exceções declaradas em `ANEL_DE_FOCO_EXCECOES`, cada uma com premissa conferida em arquivo) | que o anel CONTRASTE com o fundo em cada tema — a regra lê presença; a razão é da `focus_ring_translucido` só para `box-shadow`. Nasceu em 2026-09-10 e achou o navigation-menu sem anel em três peças, corrigido junto |
| O ponteiro pinta o destaque em toda peça | D4 do `dropdown-menu.md` | `destaque_sem_hover` (peça pintada por `[data-highlighted]` sem o `:hover` par na folha; select e combobox são exceções declaradas, porque o vanilla destaca por ponteiro ali — premissa conferida no arquivo) | a COR do hover — a regra lê a presença do par, não se ele pinta o mesmo que o destaque. Nasceu em 2026-09-10: no vanilla o mouse não pintava marcação, rádio nem sub-gatilho |
| Modalidade | aqui, §Modalidade | `modalidade_sem_condicao` | só a família NÃO-modal; o inverso é da suíte, que assere `aria-modal="true"` |
| O `<form>` e o rodapé | aqui, §Formulário | `submit_fora_do_form` no conteúdo compartilhado; play lendo `button.form`, nas cinco | a varredura do código das stacks foi retirada em 2026-09-08 (a maioria dos achados era falsa) |
| Vocabulário do payload | `07-analytics.md` | `i18n_text_in_payload` · `component_nao_kebab` · `campo_gatilho_divergente` (o nome antigo do Popover em qualquer lugar, e `label` no payload documentado de `dialog_*`/`drawer_*`) · `location_fora_do_vocabulario` · `campo_de_payload_morto` · `rotulo_de_rastreio_texto` · o TIPO: `label?: never` em `dialog_*` e `drawer_*` nos cinco `analytics.ts` | o nome do campo nos eventos que não são de painel — o menu usa `menu`, e nada cobra que continue assim |
| O véu não desfoca | aqui, §Véu | `veu_com_desfoque` | — |
| Corpo é `flex: 1 1 auto` | aqui, §O corpo que rola | `corpo_com_atalho_flex` | — |
| Ordem dos botões no rodapé | `02-alinhamento-botoes.md` | play, nas cinco, no Dialog e no AlertDialog (story `Responsive`: ordem no DOM e `column-reverse` no mobile) | no Drawer, o DOM renderizado não é asserido em stack nenhuma; o snippet é, no Vue (`drawer.source.test.ts`) |
| A regra de categoria não volta a ser copiada por stack | aqui | `guideline_de_stack_repete_categoria` | compara títulos de seção; cópia sem o título escapa |

A **largura como custom property com default em `:root`** não entra: só três dos
nove a têm (Sheet, Drawer, HoverCard), o Popover é exceção declarada (D6), e os
outros cinco não fixam largura desse jeito. É decisão de três PRDs, não
invariante de categoria.

### O que está aberto

1. **A ordem do rodapé do Drawer** não é asserida no DOM renderizado em stack
   nenhuma, enquanto a do Dialog é asserida nas cinco. É play, não regra de
   audit.

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
2026-09-09, que vivia só em comentário de CSS. O teste de que ela fechou não é
ficar sem linhas abertas: é **um relato novo cair num assunto que já está na
tabela**. Enquanto chegar achado de assunto que não está aqui, ela ganha uma
linha.
