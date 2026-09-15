# PRD — Tooltip

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
> **Revisado contra o código em 2026-09-15** — base para a próxima revisão de código: a §7 lista as inconsistências entre stacks medidas nesta data.

## 1. Identidade

Mensagem curta, exibida no **hover ou no foco** do gatilho, com seta apontando
para ele. Não é interativo e não recebe foco.

É o único da família de overlay com **seta**, e o único cuja superfície é
`--primary` em vez de `--popover`: ele não é um painel, é um rótulo flutuante.

| vizinho | diferença que decide |
|---|---|
| HoverCard | conteúdo mais longo, sem seta, e o ponteiro entra nele |
| Popover | abre no clique, recebe foco, aceita conteúdo interativo |

A pergunta que decide: **o que está ali dentro pode ser clicado?** Se pode, não é
tooltip — nem que seja um link.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | Abre no hover, depois do atraso do provedor | `testes.functional.item1` — story `States/Hover` nas cinco (espera que o balão NÃO esteja lá logo após o hover e esteja depois). O VALOR padrão (300 ms) só é medido em relógio em react `HoverDefaultDelay`, vue `Delayed`, svelte `HoverDefaultDelay` e angular `HoverDefaultDelay`; o vanilla não tem story que meça o padrão — ver §7, item 7 |
| C2 | Abre no foco por Tab **imediatamente**, sem atraso | `testes.functional.item2` — `States/Focused` (react), `WithFocus` (vue), `KeyboardFocus` (svelte, vanilla), `Focus` (angular), mais o passo de foco do `Playground` nas cinco. A força da asserção varia — ver §7, item 8 |
| C3 | `Escape` fecha, e o foco PERMANECE no gatilho | `testes.functional.item3` — passo "Escape fecha e o foco fica onde estava" do `Playground` nas cinco (e também `Controlled` no svelte) |
| C4 | Levar o ponteiro do gatilho até o balão não fecha; levar para longe fecha | `testes.functional.item4`, story `States/PersistenceInBubble` nas cinco — **mas o controle negativo (levar para longe fecha) só existe no vanilla**; nas outras quatro a story só afirma "continua aberto" — ver §7, item 6 |
| C5 | `aria-describedby` liga o gatilho ao balão | `testes.accessibility.item4`, declarado no `Playground` das cinco; a ligação id→balão é afirmada na story `States/Open` das cinco |
| C6 | Não é interativo: nada clicável dentro | `accessibility.items.item4` — julgamento |
| C7 | Botão só de ícone tem `aria-label` PRÓPRIO; o tooltip é complementar | `testes.accessibility.item5`, declarado no `Playground` das cinco |
| C8 | Sem espaço no `side` pedido, vira para o lado oposto | **sem portão, e não vale no vanilla.** Nenhuma story das cinco força colisão; as de lado (`PlacementSides`, `FourSides`, `SideTop…SideRight`, passo de `data-side` do `Playground`) ou aceitam `[side, oposto]` — o que passa com ou sem flip — ou exigem o lado exato. O vanilla não chama `flip` — ver §7, item 5 |

## 3. Decisões fixadas

### D1 · A folha NÃO posiciona o balão

**Fixada em** 2026-09-04.
**Estado**: em toda stack existe um elemento de FORA que é posicionado, e o balão
fica em fluxo dentro dele — `.nds-tooltip-positioner` no react e no angular, um
wrapper sem classe da própria lib no vue e no svelte, e no vanilla o próprio
painel, onde `positionFloating` escreve `position: absolute` antes de medir.
**Medição**: `position: absolute` morava na folha e derrubava as três stacks de
lib de uma vez, em silêncio — o balão saía do fluxo, o wrapper colapsava para
0×0, e era contra essa caixa que a lib calculava tudo. Com `side="top"`:

| stack | wrapper | resultado |
|---|---|---|
| react | 107×29 | centrado no gatilho, folga de 9px |
| vue | 0×0 | balão 34px à direita e 37px ABAIXO do gatilho |
| svelte | 0×0 | `--bits-floating-*: undefined`, nunca calculou |

**Mesma decisão vale para a seta**, e pelo mesmo motivo.

### D2 · O balão é `pointer-events: none`, e a persistência vem da TOLERÂNCIA

**Estado**: o balão não recebe evento de ponteiro. A cláusula "hoverable" da WCAG
1.4.13 é cumprida por uma área de tolerância que lê **coordenada**, não por o
balão ser alcançável pelo ponteiro.
**Consequência de teste, medida**: `userEvent.hover(balao)` num nó com
`pointer-events: none` chega com `clientX/clientY` em 0,0 — mediria o ponteiro no
canto da tela. A play do vanilla dita a coordenada à mão, e por isso passa a valer.
**O par que dá dentes**: a mesma play verifica que levar o ponteiro para LONGE
fecha. Sem esse segundo passo, "continua aberto" passaria mesmo se a tolerância
fosse infinita.
**Medido em 2026-09-15: as duas metades só valem no vanilla**
(`tooltip-states.stories.ts:220-242`). React, vue, svelte e angular fazem
exatamente o que o parágrafo acima diz que não mede —
`userEvent.hover(balao, { pointerEventsCheck: 0 })` — e não têm o passo
negativo. Ver §7, item 6.

### D3 · A seta é `clip-path`, e o `<svg>` da lib fica escondido

**Estado**: triângulo de 10×5px desenhado por `clip-path: polygon(0 0, 100% 0, 50% 100%)`
sobre um retângulo em `--primary`. A lib do Angular projeta um `<svg>` de polígono
DENTRO da seta, e ele é escondido por `visibility: hidden` em vez de removido.
**Por quê**: remover exigiria tocar a projeção da lib; esconder mantém o desenho
do design system valendo nas cinco, com uma linha.

### D4 · A superfície é `--primary`, e isso é do tooltip

**Estado**: fundo `--primary`, texto `--primary-foreground` — enquanto popover,
hover-card e dropdown-menu usam `--popover`.
**Por quê**: o tooltip não é painel de conteúdo, é rótulo. O contraste alto é o
que o faz ser lido de relance, e é o que o separa visualmente de tudo que é
"superfície onde se trabalha".

### D5 · O atraso e a espera compartilhada moram no provedor

**Estado**: um provedor único no root governa o atraso de abertura e a espera
compartilhada — enquanto o grupo está quente, o balão seguinte abre sem atraso.
**Consequência**: o atraso NÃO é decisão de cada tooltip. Mudar num ponto muda o
comportamento do grupo, que é o que se quer numa barra de ferramentas.

**O valor é 300 ms nas cinco, fixado pela dona em 2026-09-12** — e antes disso
era um valor por stack, com a documentação afirmando um sexto:

| stack | antes | de onde vinha |
|---|---|---|
| react, vue, svelte | `0` | default escrito no wrapper |
| vanilla | `300` | `SHOW_DELAY` na fábrica |
| angular | `600` | NÃO era escolha: a stack não passava valor, e o primitivo caía na configuração global do radix-ng |
| PRD e conteúdo compartilhado | `0` | afirmação que não valia para duas das cinco |

Três leituras que essa tabela dá, e todas custam:

1. **Zero não é atraso — é ausência de atraso**, e era o valor de três stacks. O
   atraso existe para separar o ponteiro que PASSA do ponteiro que PARA; com
   zero, todo movimento do mouse pela barra de ferramentas acende balão.
2. **O 600 do Angular era default de biblioteca**, não decisão desta casa. É a
   forma silenciosa de divergência mais difícil de achar: não há valor escrito em
   lugar nenhum do repositório para alguém comparar.
3. **A docs page do Angular documentava 600** e o conteúdo compartilhado dizia 0,
   no mesmo componente e na mesma tabela de props — cada uma honesta sobre a
   stack que enxergava.

O foco pelo teclado continua abrindo na hora, sem esperar, nas cinco: o atraso é
do hover, e prender o teclado a ele quebraria a WCAG 1.4.13.

**E o exemplo canônico ensina o atraso pela AUSÊNCIA** — decisão da dona em
2026-09-12 (`19f9b1342`), na mesma noite da padronização: quem copia o
`anatomy.structureCode` monta o Provider SEM número e herda os 300 ms da casa, em
vez de redigitar um valor que envelhece sozinho. Número redigitado sobrevive: onde
o atraso é o próprio assunto do bloco ele fica, e o motivo de cada sobrevivente
está declarado no portão.

**Dois portões guardam isto**, os dois sob a regra `atraso_de_tooltip_divergente`:
um compara o valor do primitivo de cada stack com o que a tabela de props publica;
o outro cobra a CONTAGEM de declarações de atraso em cada uma das cinco docs
pages, contra o número e o motivo escritos em `ATRASO_EM_DOCS_PAGE`. O segundo
nasceu porque nenhuma docs page entrava na varredura — provado replantando
`[delay]="400"` na página do Angular e vendo o audit fechar limpo. Ele reprova
para os dois lados: a mais, porque entrou declaração que ninguém justificou; a
menos, porque uma lição sumiu.

### D6 · A cadeia de `transform-origin` cita as três libs

**Fixada em** 2026-09-04 — o tooltip foi o primeiro da família a ser corrigido, e
o popover e o hover-card vieram depois pelo mesmo motivo.
**Medição**: sem o degrau do bits, só o Svelte perdia a origem direcional, em
silêncio, porque `center` é fallback válido.

### D7 · O balão encolhe o padding quando há atalho

**Estado**: `:has([data-slot="kbd"])` reduz o `padding-inline-end` para
`--spacing-1-5`.
**Por quê**: a tecla já vem com caixa própria, e o padding cheio do balão somado
à caixa da tecla abria um vão que lia como erro de alinhamento.

## 4. Anatomia

```
tooltip                       (raiz — elemento só no vanilla e no angular)
└── tooltip-trigger           aria-describedby aponta para o balão, só enquanto aberto

[portal, no body — irmão do gatilho, não filho]
tooltip-positioner            (classe só em react e angular — ver D1)
└── tooltip-content           role="tooltip" · o balão
    ├── [texto]               e nada mais que texto — ver C6
    ├── kbd                   opcional; encolhe o padding do balão (D7)
    └── tooltip-arrow         a seta, desenhada por clip-path (D3) — classe, sem data-slot
```

O provedor não aparece na árvore: nas quatro stacks com lib ele é contexto sem
elemento, e no vanilla é uma fábrica. **Até 2026-09-15 esta árvore punha o
positioner DENTRO do gatilho**; ele nasce no portal nas cinco.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/tooltip.css`.

| propriedade | valor | token |
|---|---|---|
| largura máxima | 320px | **literal** (`20rem`) — permite quebra de linha |
| padding lateral | 12px | `--spacing-3` |
| padding vertical | 6px | `--spacing-1-5` |
| gap interno | 6px | `--spacing-1-5` |
| superfície | — | `--primary` — ver D4 |
| texto | — | `--primary-foreground` |
| raio | — | `--radius-sm` |
| tamanho de texto | 12px | `--text-control-sm` |
| entrelinha | 1.4 | **literal** |
| sombra | — | `--elevation-lg` — flutuante passivo; era `xl` até 2026-09-10 |
| camada | — | `--z-tooltip` |
| seta | 10×5px | **literais** — base e altura do triângulo |
| superfície da seta | — | `--primary`, a mesma do balão — é o que faz o triângulo continuar o balão em vez de encostar nele |

**O degrau da sombra sai do TIPO de superfície**: flutuante passivo é `lg`, pela
regra em `04-padroes-design-sistema.md` §Qual degrau, cobrada por
`elevacao_fora_do_mapa`. O que separa `md` de `lg` ali é interativo × passivo, e
o tooltip é o caso extremo do segundo lado — nem foco recebe.

**Animação**: só a saída anima (opacidade e `scale(0.95)`), para evitar corrida
entre opacidade zero na entrada e a checagem síncrona de visibilidade das plays.
É a mesma forma do hover-card.
**Mas a regra pendura em `[data-ending-style]`, e esse atributo não chega às
cinco** — medido em 2026-09-15 nas fontes instaladas: o base-ui (react) o
escreve; a `reka-ui` (vue) não o cita em arquivo nenhum; o vanilla remove o nó
na hora (`tooltip.ts:281`). No bits-ui e no radix-ng o atributo existe no
pacote, mas o módulo do tooltip não o cita — não medido no navegador. Ver §7,
item 9.

**Até 2026-09-12 esta linha dizia "pelo mesmo motivo do popover e do
hover-card"**, e o popover saiu do exemplo: em 2026-09-12 ele deixou de animar por
completo, por decisão da dona, e com isso não há mais lado dele para comparar.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | balão fora do documento |
| Opening | hover, durante o atraso do provedor | nada visível |
| Open | atraso cumprido, ou foco por Tab | balão montado, seta apontando o gatilho |
| Transitioning | saída | opacidade e escala até terminar — só onde a lib escreve `data-ending-style` (§5) |

O atributo de estado no balão também não é um só: `data-state="open"` no
vanilla (`tooltip.ts:225`) e no angular (`tooltip.ts:270`, que acrescenta o
`data-open` da lib); `instant-open`/`delayed-open` no vue (reka) e no svelte
(`bits-ui/…/tooltip.svelte.js:196`); nenhum `data-state` no react, que tem só
`data-open`/`data-instant` do base-ui. Ver §7, item 10.

Não há estado de foco DENTRO do balão: ele não recebe foco (C6).

## 7. API

| prop | tipo | padrão | onde não vale |
|---|---|---|---|
| `delay` | number | `300`, no provedor — ver D5 | o NOME é `delayDuration` em vue, svelte e vanilla |
| `open` | boolean | — | vanilla |
| `defaultOpen` | boolean | `false` | vanilla |
| `onOpenChange` | `(open: boolean) => void` | — | vanilla |
| `side` | `top \| right \| bottom \| left` | `top` | — |
| `align` | `start \| center \| end` | `center` | vanilla |
| `sideOffset` | number | `4` | vanilla |
| `className` | string | — | angular (o balão nasce no portal e quem escreve só é dono do template — `tooltip.ts:155-158`); o NOME é `class` em vue, svelte e vanilla |
| janela de grupo | number | da lib, salvo vanilla `300` | o NOME é `timeout` em react e angular, `skipDelayDuration` em vue, svelte e vanilla; nenhuma das quatro com lib declara o valor |

Repare no `side`: o padrão aqui é `top`, e no popover é `bottom`. Rótulo nasce
acima do que ele descreve; painel nasce abaixo do que o abriu.

**Cinco das sete linhas não valem no vanilla, e a coluna existe por isso.**
Medido em 2026-09-12 em `TooltipOptions` e `TooltipProviderOptions`
(`nortear-design-system-vanilla/src/components/ui/tooltip.ts`): a fábrica recebe
`trigger`, `content`, `side`, `delayDuration`, `onShow` e `class`, e mais nada.
Não há estado controlado, não há `defaultOpen`, não há aviso de mudança e não há
encosto — o balão é sempre centrado, que é o `align: 'center'` de `@/lib/floating`.
O `sideOffset` também não é opção: o vão é a constante `GAP = ARROW_HEIGHT + 4`,
ou seja 9px, e o 4 que esta tabela documenta está DENTRO dela somado à altura da
seta, que fica fora do balão — nas stacks com lib essa soma é a lib que faz.
**Até 2026-09-12 as cinco linhas não traziam ressalva nenhuma**, e o PRD prometia
uma API que a stack de referência não tem.

**A linha do `delay` dizia `0`** até `d65716fec` (2026-09-12), com a tabela
afirmando um valor que não valia para duas das cinco — ver a medição inteira em
D5. E o NOME continuava sem ressalva: medido em 2026-09-12, é `delay` em react
(`TooltipProvider`, default `TOOLTIP_DEFAULT_DELAY`) e em angular (input `delay`
do `[ndsTooltipProvider]`, com `NDS_TOOLTIP_DELAY` registrado como padrão do
primitivo), e `delayDuration` em vue (`TooltipProvider.vue`), svelte
(`tooltip-provider.svelte`) e vanilla (`createTooltipProvider`). Os cinco valem
`300`. Divergência de forma de API não tem fonte de verdade: fica registrada.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica `createTooltip`, com `onShow` disparado na exibição REAL — registrado em `PATCHES.md#vanilla-tooltip-onshow`, e existe para o evento não depender de duplicar o timer privado da fábrica. A fábrica é também a única sem `open`/`defaultOpen`/`onOpenChange`/`align`/`sideOffset` — ver a tabela acima |
| vanilla | o grupo é `createTooltipProvider`, uma fábrica que devolve o próprio `createTooltip` já amarrado ao padrão do grupo; nas outras quatro o provedor é contexto |
| vue, svelte, vanilla | a espera se chama `delayDuration`; em react e angular é `delay` |
| react, angular | nomeiam o positioner; vue e svelte usam wrapper anônimo da lib |
| angular | a lib projeta um `<svg>` dentro da seta (D3) |
| angular | a espera da casa entra como CONFIGURAÇÃO do primitivo (`provideNdsTooltipConfig`), e não só como default de wrapper — é o que tira o último degrau da resolução do default da biblioteca |
| angular | expõe inputs que as outras não publicam: `closeDelay`, `disabled`, `disableHoverablePopup` na raiz, e `id`, `delay`, `closeDelay`, `closeOnClick` no gatilho (`tooltip.ts:208,240`) |
| svelte | `TooltipContent` aceita `arrowClasses` e `portalProps` (`tooltip-content.svelte:17-18`) |
| vue | a mudança de abertura é o evento `update:open`, não um callback `onOpenChange`; no angular é o output `openChange` |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` |
| vue | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` |
| svelte | `Tooltip`, `TooltipContent`, `TooltipPortal`, `TooltipProvider`, `TooltipTrigger` |
| vanilla | `createTooltip`, `createTooltipProvider` |
| angular | `[ndsTooltipProvider]`, `[ndsTooltip]`, `button[ndsTooltipTrigger]`, `ng-template[ndsTooltipContent]` |

Além das peças, react exporta `TOOLTIP_DEFAULT_DELAY` e angular exporta
`NDS_TOOLTIP_DELAY`, `provideNdsTooltipConfig` e o array `NDS_TOOLTIP` — as
constantes existem para as stories que MEDEM o atraso não redigitarem o número.

**O snippet de extensibilidade publicava `<nds-tooltip>` e `<nds-tooltip-provider>` até 2026-09-12**, e no Angular o
SELETOR carrega o elemento: a peça é `[ndsTooltip]`, como a linha acima já dizia e
como o `anatomy.structureCode` do conteúdo compartilhado já escrevia. A mesma
página ensinava as duas formas, e a errada era a da seção que ninguém relê — quem
copiasse receberia erro de template, porque snippet é string em JSON e nada nesta
casa o compila. Portão: `tag_angular_inexistente`, que tira a régua dos
`selector:` declarados pela própria stack.


O índice do svelte também reexporta as formas curtas — `Content`, `Portal`, `Provider`, `Root`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

### Inconsistências entre stacks, medidas em 2026-09-15

Medidas arquivo a arquivo no código desta data, sem suíte de navegador. O
`node scripts/audit.mjs tooltip --json` fechou com **0 violações** — nenhum dos
itens abaixo é visto por regra do auditor. Caminhos relativos a
`nortear-design-system-<stack>/src/components/`; `ui/` do vue e do svelte é
`ui/tooltip/`.

1. **`data-slot="tooltip"` na raiz só existe no DOM de duas.** vanilla escreve no
   wrapper `display: contents` (`ui/tooltip.ts:180`) e o `Playground` afirma
   (`ui/tooltip.stories.ts:113`); angular no host (`ui/tooltip.ts:252`), e o
   `Playground` afirma a tag `SPAN` (`ui/tooltip.stories.ts:113`). react
   (`ui/tooltip.tsx:109`) e vue (`ui/tooltip/Tooltip.vue:34`) passam o atributo a
   uma raiz de lib que não renderiza elemento — escrita morta; svelte não escreve
   e declara por quê (`ui/tooltip/tooltip-provider.svelte:9`). O mesmo vale para
   `tooltip-provider`: react escreve em nó inexistente (`ui/tooltip.tsx:72`),
   angular no host (`ui/tooltip.ts:142`), vue e svelte declaram a ausência.
   Referência: vanilla tem o elemento. Divergência de API — registrar, não
   alinhar; o que se corrige é a escrita morta de react e vue.

2. **Quem liga `id`/`aria-describedby`.** Montado à mão em três: vanilla
   (`ui/tooltip.ts:263,283`), react (`ui/tooltip.tsx:43-130`, porque o base-ui não
   liga) e svelte (`ui/tooltip/tooltip-descricao.svelte.ts`, porque o bits não
   carimba `id` no balão). Entregue pela lib em vue e angular. No vue o
   `aria-describedby` aponta para o `<span>` de `VisuallyHidden` DENTRO do balão,
   que nasce `aria-hidden` e carrega um segundo `role="tooltip"`
   (`ui/tooltip/TooltipContent.vue:39-46`); por isso a fixture de vue, svelte e
   vanilla sobe com `closest('[data-slot="tooltip-content"]')` e a de react e
   angular não (`ui/tooltip.fixtures.ts:20-22` react, `:23-25` angular). Maioria
   (3): o id está no próprio balão com o papel. Mecânica de lib — registrar.

3. **Atraso de hover nas plays: o `0` de decorator sobreviveu em três.** O svelte
   tirou o `0` morto dos args (`ui/tooltip/tooltip-compositions.stories.ts:44-49`,
   `tooltip-variants.stories.ts:53-57`), mantendo-o só onde há ponteiro real. react
   crava `delay={0}` no decorator de meta de `tooltip.stories.tsx:35`,
   `-states:68`, `-variants:45`, `-compositions:42`; vue `:delay-duration="0"` em
   `tooltip.stories.ts:29`, `-states:75`, `-variants:46`, `-compositions:38`;
   angular `[delay]="0"` em cada story de `-variants`, `-compositions` e
   `-states` (`:95,125,322…`) e no arg do `Playground` (`tooltip.stories.ts:62`).
   vanilla não usa provedor nas stories. Maioria (3) mantém o zero; a política
   de 2026-09-12 (D5) é a do svelte.

4. **O conjunto de stories diverge arquivo a arquivo.** `Playground`, `Variants`
   (`Default`, `WithShortcut`, `LongText`) e `States` `Closed`/`Open`/`Hover`/
   `PersistenceInBubble` existem nas cinco. O resto:
   - estado de foco com cinco nomes: `Focused` (react), `WithFocus` (vue),
     `KeyboardFocus` (svelte, vanilla), `Focus` (angular);
   - medição do atraso padrão: `HoverDefaultDelay` (react, svelte, angular),
     `Delayed` (vue), nenhuma (vanilla);
   - `Controlled`: react, vue, svelte — falta no angular, que tem `open`;
     no vanilla não há API;
   - `ListenerCleanup`: só vanilla;
   - `Compositions`: react `IconBarToolbar`, `WithKeyboardShortcut`,
     `PlacementSides`; vue `IconOnlyButton`, `ActionBar`, `KeyboardShortcut`,
     `FourSides`; svelte `KeyboardShortcut`, `SideTop`/`SideBottom`/`SideLeft`/
     `SideRight`, `ActionDescription`; vanilla `IconButtonWithShortcut`,
     `HelpInFormField`, `MetricDescription`, `PlacementSides`,
     `ProviderWithMarkup`; angular os mesmos quatro primeiros do vanilla.
   Referência: vanilla, que o angular já segue, e que casa com as composições
   que as cinco docs pages publicam (`iconButtonWithShortcut`, `actionBar`,
   `formFieldHelp`, `metricDescription`). O nome de story não é API de
   framework: alinhar.

5. **Flip de lado (C8).** react, vue, svelte e angular herdam o flip da lib;
   vanilla chama `positionFloating(trigger, panelEl, side, 'center', GAP)` sem
   `{ flip: true }` (`ui/tooltip.ts:231`; opt-in em `lib/floating.ts:261-271`), e
   a docs page do vanilla declara em literal que "nada reposiciona o balão"
   (`docs/TooltipDocs.ts:955`). Asserções: react (`-compositions:239`,
   `tooltip.stories.tsx:191`), vue (`-compositions:301`, `tooltip.stories.ts:185`),
   angular (`-compositions:219`, `tooltip.stories.ts:172`) e o `Playground` do
   svelte (`:169`) aceitam `[side, oposto]` — passam com ou sem flip; svelte
   `Side*` (`-compositions:106,133,160,187`) e vanilla (`-compositions:280`,
   `tooltip.stories.ts:156`) exigem o lado exato. Nenhuma das cinco força colisão.
   Maioria (4) vira; a referência não vira — decisão da dona (§10).

6. **Persistência no balão (C4): o controle negativo só existe no vanilla.**
   vanilla dita a coordenada do centro do balão e depois leva o ponteiro a 0,0
   esperando o fechamento (`ui/tooltip-states.stories.ts:220-242`). react
   (`-states:391-399`), vue (`-states:406-414`), svelte (`-states:266-274`) e
   angular (`-states:343-351`) fazem `userEvent.hover(balao, { pointerEventsCheck: 0 })`
   e só afirmam "continua aberto" após 200 ms — a forma que D2 mede como
   ponteiro em 0,0. Maioria (4) sem dentes; referência: vanilla. Alinhar.

7. **Espera de grupo: provada numa stack só.** vanilla `ProviderWithMarkup`
   mostra o vizinho abrindo sem esperar dentro da janela
   (`ui/tooltip-compositions.stories.ts:369-386`). react `IconBarToolbar`
   (`-compositions:126-129`) e vue `ActionBar` (`-compositions:167-173`) contam
   rótulos e não tocam o ponteiro; svelte e angular não têm story de grupo. E o
   atraso padrão: react afirma fechado aos 150 ms e aberto antes de 600
   (`-states:275-288`, sem piso); vue piso de 270 sem teto (`-states:294`); svelte
   lê `data-delay-duration="300"` da lib e piso de 240 (`-states:175,201`);
   angular piso 270 e teto 510, com o número tirado do conteúdo
   (`-states:238,252-253`); vanilla `Hover` só afirma "não abre na hora" e
   "abre em até 2400 ms" (`-states:127,135`). Referência para grupo: vanilla;
   para o padrão, a do angular é a única com as duas bordas.

8. **Foco abre sem atraso (C2): três forças de asserção.** vanilla
   síncrona — `focus()` e o balão já existe, sem `waitFor`
   (`ui/tooltip-states.stories.ts:161-163`); react `< 300` ms com provedor de 600
   (`-states:338-339`); svelte `< 300` (`-states:231`); angular `< 150` e
   `data-instant="focus"` (`-states:299,306`); vue sem relógio, só
   `data-state="instant-open"` depois de `waitFor` (`-states:351,357`).
   Maioria (3) mede relógio.

9. **Animação de saída.** A folha anima em `[data-ending-style]`
   (`docs/shared/styles/nds/tooltip.css:81-85`). react recebe o atributo do
   base-ui; vue nunca (a `reka-ui` instalada não o cita); vanilla remove o nó
   sem transição (`ui/tooltip.ts:281`); svelte e angular não medidos no
   navegador. No máximo três de cinco animam a saída; referência (vanilla) não
   anima. Decisão da dona (§10).

10. **Atributo de estado e o que as stories afirmam dele.** `data-state="open"`
    no vanilla (`ui/tooltip.ts:225`) e no angular (`ui/tooltip.ts:270`);
    `instant-open`/`delayed-open` em vue e svelte; ausente no react. A story
    `Open` afirma `open` no vanilla (`-states:98`) e no angular (`-states:144`),
    `instant-open` no vue (`-states:175`) e nada no react nem no svelte.
    Mecânica de lib — registrar; a asserção faltante em react e svelte é o que
    se alinha.

11. **Asserções que existem numa e faltam noutra, fora dos itens acima.**
    - padding encurtado com `kbd` (D7): `WithShortcut` afirma
      `paddingInlineEnd` em react (`-variants:171`), vue (`:166`), svelte
      (`:122`) e angular (`:132`); vanilla não (`-variants:104-111`), e usa uma
      tecla `Ctrl+S` onde as quatro usam duas (`Ctrl`, `S`).
    - espião de mudança de abertura no `Playground`: react (`:168`), vue
      (`:162`), angular (`:143-144`); svelte tem `onOpenChange` e não espiona;
      vanilla não tem a API.
    - `Closed` do angular não afirma `role="tooltip"` ausente por consulta ao
      body, como as outras quatro (`-states:109-115`).

12. **Docs page — seção Estados.** react, vue, svelte e vanilla publicam as
    cinco linhas, incluindo `states.delayed`; angular publica quatro e tira
    `delayed` (`docs/TooltipDocs.ts:1023-1030`) com o argumento de que não há
    balão durante a espera — o que vale igual nas cinco. Maioria (4):
    publicar.

13. **Docs page — tabela de props publica nomes que não são os da stack.**
    react `delay…className`, com `onOpenChange`; vue `delayDuration`, `class`,
    sem linha de evento (`docs/TooltipDocs.vue:378`); svelte publica **`delay`**
    (`docs/TooltipDocs.svelte:790`) — a prop dele é `delayDuration`
    (`ui/tooltip/tooltip-provider.svelte:24`) —, com `class` e `onOpenChange`;
    angular `delay`, `openChange`, sem `class`; vanilla a tabela da fábrica
    (`trigger`, `content`, `side`, `delayDuration`, `onShow`, `class`) e a do
    provedor (`delayDuration`, `skipDelayDuration`) (`docs/TooltipDocs.ts:879-889`).
    Os nomes são divergência de API já registrada acima; o `delay` do svelte é
    defeito da página.

14. **Docs page — o segundo bloco da Importação ensina três coisas.** react
    monta o provedor com `timeout={300}` (`docs/TooltipDocs.tsx:182-186`); vue com
    `:skip-delay-duration="300"` (`docs/TooltipDocs.vue:182-186`); svelte monta o
    provedor sem janela e repete o uso (`docs/TooltipDocs.svelte:145-159`); vanilla
    monta grupo com `skipDelayDuration: 300` e um balão com `delayDuration: 0`
    (`docs/TooltipDocs.ts:474-494`); angular não mostra provedor nenhum — o bloco é
    `imports: [...NDS_TOOLTIP, NdsButton]` (`docs/TooltipDocs.ts:110-117`). Todos
    constantes locais: é a PENDÊNCIA de 2026-09-12 (§10).

15. **Docs page — literais que contradizem o código.** vanilla afirma "não há
    […] seta apontando para o gatilho" nas notas, nos três idiomas
    (`docs/TooltipDocs.ts:952-955`), e a fábrica desenha a seta desde 2026-09-04
    (`ui/tooltip.ts:246-257`). angular diz em comentário que "o Do & Dont daqui não
    tem tooltip vivo" (`docs/TooltipDocs.ts:815`) e a página tem quatro
    (`:385-422`); o comentário final de `ui/tooltip.ts:314` diz
    `display: none` onde a folha usa `visibility: hidden`
    (`tooltip.css:150-152`).

16. **Analytics — tipo igual, disparo por dois mecanismos.** O tipo
    `tooltip_view { component; trigger_id?; location? }` é idêntico nas cinco
    (`lib/analytics.ts`: react `:591`, vue `:535`, svelte `:536`, vanilla `:526`,
    angular `:513`). Disparo: react `rastrearTooltip` (`docs/TooltipDocs.tsx:99`),
    vue (`.vue:159`), svelte (`.svelte:28`) e angular `aoAlternar` (`:816`) na
    mudança de abertura; vanilla `trackTooltipView` no `onShow` (`:197`). Os cinco
    cobrem demo, do-dont, variantes e composições com o mesmo `trigger_id`. O
    snippet de Importação do vanilla ensina o evento SEM `trigger_id` nem
    `location` (`:493`), e o `props.extensibilityCode.vanilla` do conteúdo
    compartilhado repete a forma.

17. **Construtores de snippet e seus testes.** react 12 construtores e 20 `it`;
    vue 13 e 16; svelte 3 (`tooltipSource`, `tooltipOpenSource`,
    `tooltipControlledSource`) e 13 — as composições e os lados usam o
    `tooltipSource` do meta com args; vanilla 5 e 13; angular 13 e 20 `it` (um
    deles gerado por construtor), o único
    cujo teste local cobra que todo construtor exportado entra na varredura
    (`ui/tooltip.source.test.ts:179-186`). A granularidade acompanha o item 4.

## 8. Acessibilidade

**Atributos**: `role="tooltip"` no balão; `aria-describedby` no gatilho.

**Teclado**: o foco no gatilho abre sem atraso; Escape fecha e o foco fica onde
está. O balão não entra na ordem de tabulação.

**O que NÃO se faz, de propósito:**

- nada clicável dentro — para isso existem Popover e HoverCard;
- o tooltip não substitui o nome acessível de um botão só de ícone: o
  `aria-label` é obrigatório no botão, e o balão é complemento;
- em touch não há hover, então nenhuma informação essencial mora aqui.

**Movimento reduzido**: o balão para sob `prefers-reduced-motion`, e quem o para
é a camada de TOKEN — a folha declara duração só por `var(--duration-*)`, e
`docs/shared/tokens/motion.css` zera a escada inteira sob a preferência. O
mecanismo está por extenso em `hover-card.md` §8.

**E aqui a leitura é literal: o bloco `@media` desta folha NÃO é quem segura.**
Medido em 2026-09-12: a guarda no fim de `tooltip.css` mira `.nds-tooltip-content`
(0,1,0) e a transição de saída está em `.nds-tooltip-content[data-ending-style]`
(0,2,0) — a declaração vence, e `@media` não acrescenta especificidade. O balão
para de qualquer forma, pela camada de token, e é por isso que ninguém notou. Esta
folha é uma das quatro nessa situação, junto com `dialog.css`,
`dropdown-menu.css` e `sheet.css`; a pendência aberta que as conta está em
`hover-card.md` §8, e o `tooltip.css` foi acrescentado a ela em 2026-09-12 —
tinha a mesma forma desde sempre e nunca havia sido listado.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `tooltip_view` | só quando a abertura indica intenção — é raro | `{ component: "tooltip", trigger_id, location }` |

**O tooltip é passivo, e por padrão não dispara nada.** Instrumentar toda
abertura mede o trajeto do ponteiro, não o interesse.

## 10. Reconstruir do zero

Ordem: folha → provedor → primitivo → seta → stories → docs page.

- **A primeira coisa a NÃO fazer**: `position` na folha, do balão ou da seta
  (D1). É o defeito que derruba três stacks de uma vez e não aparece em nenhuma.
- **react (`base-ui`) e angular (`radix-ng`)** — positioner nomeado; o angular
  ainda projeta o `<svg>` da seta.
- **vue (`reka-ui`) e svelte (`bits-ui`)** — wrapper anônimo; o degrau do bits na
  cadeia de origem se chama `--bits-tooltip-content-transform-origin`.
- **vanilla** — `positionFloating` escreve o `position` no próprio painel, e a
  área de tolerância lê coordenada (D2).

> **PENDÊNCIA · 2026-09-12** — o segundo bloco da seção **Importação**, que
> ensina onde montar o Provider, é uma constante LOCAL em cada uma das cinco
> docs pages, sem chave no conteúdo compartilhado. São cinco cópias do mesmo
> código publicado, mantidas à mão, e pela regra da casa snippet publicado com
> variante por stack mora no `translations.json`.
> **Como isto foi medido**: ao esvaziar o atraso do `anatomy.structureCode` no
> compartilhado, a edição não alcançou nenhuma das cinco páginas — duas agentes
> bateram nisso ao mesmo tempo, por caminhos independentes, e foi preciso
> corrigir as cinco à mão. A próxima mudança de política do Provider repete.
> **Fecha quando** existir chave compartilhada para esse snippet e as cinco
> páginas a consumirem, com o portão `soltos` do `audit-translation-literals`
> cobrando o resto.
> **Conferida em 2026-09-15: continua aberta**, e a premissa estava larga — o
> conteúdo compartilhado não tem chave em `import` (objeto vazio), as cinco
> páginas seguem com constante local, e o bloco do angular nem ensina onde
> montar o provedor: é a lista de `imports` do componente. Ver §7, item 14.

> **PENDÊNCIA · 2026-09-12** — o `message-timing` publica `delayDuration={0}` no
> painel Code em react, vue e svelte. É o mesmo resíduo que saiu do trilho do
> Sidebar e das dez stories do Svelte nesta rodada: zero cravado em cena que
> talvez nem faça hover, ensinando a desligar a espera.
> **Adiado por decisão da dona** (rodada própria do componente), e não por
> esquecimento: ali as stories montam balão DENTRO de balão para medir tempo de
> mensagem, então o zero pode ser load-bearing — decidir sem medir seria trocar
> um cravão por outro.
> **Fecha quando** a revisão do `message-timing` medir cada ponto e remover os
> que forem arg morto.
> **Conferida em 2026-09-15: continua aberta.** O painel Code ainda publica o
> zero em react (`ui/message-timing.source.ts:260`), vue
> (`ui/message-timing/message-timing.source.ts:298`) e svelte
> (`ui/message-timing/message-timing.source.ts:257`); as stories de composição
> das quatro stacks com provedor também o cravam, angular incluído
> (`ui/message-timing-compositions.stories.ts:127`).

> **PENDÊNCIA · 2026-09-15** — C8 (flip) não tem portão em stack nenhuma e não
> vale no vanilla, que posiciona sem `flip` e declara isso na docs page; as
> asserções de lado das outras quatro passam com ou sem o recurso (§7, item 5).
> **Fecha quando**: a dona decidir se o tooltip do vanilla liga `flip` ou se C8
> ganha "não vale no vanilla", e as cinco tiverem uma story que force colisão e
> afirme o lado final.

> **PENDÊNCIA · 2026-09-15** — a `PersistenceInBubble` de react, vue, svelte e
> angular usa o hover sintético que D2 mede como ponteiro em 0,0 e não tem o
> passo negativo (§7, item 6).
> **Fecha quando**: as quatro ditarem coordenada e afirmarem que levar o
> ponteiro para longe fecha, como `nortear-design-system-vanilla/src/components/ui/tooltip-states.stories.ts:220-242`.

> **PENDÊNCIA · 2026-09-15** — a espera de grupo só é provada no vanilla, e o
> atraso padrão não é medido em relógio no vanilla (§7, item 7).
> **Fecha quando**: as cinco tiverem story de grupo que mostre o vizinho abrindo
> sem espera, e o vanilla tiver story que meça o padrão com piso e teto.

> **PENDÊNCIA · 2026-09-15** — a animação de saída depende de
> `[data-ending-style]`, que no máximo três das cinco recebem; vue e vanilla não
> animam (§7, item 9).
> **Fecha quando**: a dona decidir entre animar a saída nas cinco ou tirar a
> transição da folha, e §5 e §6 descreverem o resultado.

> **PENDÊNCIA · 2026-09-15** — conjunto de stories, nomes e asserções
> divergentes (§7, itens 3, 4, 8, 10 e 11), docs pages com a linha `delayed`
> ausente no angular, `delay` no lugar de `delayDuration` na tabela do svelte e
> literais que contradizem o código (§7, itens 12, 13 e 15).
> **Fecha quando**: a próxima revisão de código do tooltip fechar esses itens
> nas cinco, alinhando pelo vanilla onde não for API de framework.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, seta, posicionamento | `docs/shared/styles/nds/tooltip.css` |
| texto, props, critérios de teste | `docs/shared/content/tooltip/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `Tooltip` (conjunto `662:14`) |
| portões determinísticos | `node scripts/audit.mjs tooltip --json` |
| rótulo do menu lateral da docs page | `nortear-design-system-<stack>/src/i18n/ui.json` — nunca o conteúdo; ver `08-docs-pages-foundations.md` |
| título (`h2`) de cada seção | o mesmo rótulo do menu, derivado do id da seção — ver `docs-page-landmarks.ts` |

**As 54 chaves `nav` saíram do conteúdo em 2026-09-12.** As páginas do vue e do
svelte liam o conteúdo, com a mesma deriva de escrita em inglês e espanhol.

O menu da docs page é cromo: as mesmas quinze seções, na mesma ordem, em toda
página das cinco stacks, lidas de relance e comparando páginas — e desde a mesma
data o TÍTULO da seção é a mesma frase, derivada do mesmo lugar. A linha abaixo
registra por quê. Portões: `rotulo_de_nav_no_conteudo`,
`rotulo_de_nav_do_conteudo` e `vocabulario_de_nav_divergente`, este último
porque `en.nav.anatomy` do vue dizia "Anatomity" — palavra inexistente, no menu
das 82 docs pages daquela stack, e indistinguível de decisão enquanto ninguém
comparava as cinco cópias.

**As 45 chaves de título de seção saíram do conteúdo em 2026-09-12**, e
**15 delas diziam palavra diferente da do item de menu que salta para a
seção** — "Quando e Como Usar" contra "Quando Usar", "Design Tokens" contra
"Tokens", "Componentes Relacionados" contra "Relacionados". O `h2` agora
nasce do id que a própria seção declara, então divergir deixou de ser possível
em vez de passar a ser proibido. Portões: `titulo_de_secao_no_conteudo`,
`titulo_de_secao_pedido_ao_conteudo` e `titulo_passado_ao_container` — o
terceiro existe porque no Angular um `[title]` esquecido **não** reprova no
`ngc` (é atributo global do HTML) e viraria tooltip silencioso no cabeçalho.


