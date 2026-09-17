# PRD — Tooltip

> **Estado descrito**: 2026-09-15. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.
> **Revisado contra o código em 2026-09-15**, e **corrigido na passagem de `fix`
> de 2026-09-16**, que fechou a maior parte da §7 e três das seis pendências. A §7
> abaixo descreve o que sobrou, medido depois da passagem.

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
| C8 | Sem espaço no `side` pedido, vira para o lado oposto | `testes.functional.item5` — story `Compositions/Collision` nas cinco: o gatilho encosta na borda, a play afirma a PREMISSA (folga acima menor que a altura do balão mais o vão) e só então o lado FINAL, esperando o VALOR de `data-side`. Vale nas cinco desde 2026-09-16, quando o vanilla passou a chamar `positionFloating` com `{ flip: true }` |

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

### D8 · Aberto, o balão acompanha o gatilho — e a seta é refeita a cada vez

**Fixada em** 2026-09-17, decisão da dona na passagem do popover ("reposicionar
nos seis consumidores do `positionFloating` agora").
**Medição**: o vanilla calculava a posição UMA vez, ao mostrar. Com o balão
aberto, rolar a página — inclusive dentro de um contêiner — ou redimensionar a
janela deixava o balão parado enquanto o gatilho se movia. As outras quatro
stacks nunca tiveram o defeito: as quatro libs reposicionam sozinhas
(`autoUpdate` do floating-ui). O mesmo valia para os outros cinco consumidores
do `positionFloating` do vanilla.
**Mecanismo**: `autoUpdateFloating` (`nortear-design-system-vanilla/src/lib/floating.ts`)
escuta rolagem em cada ancestral rolável do gatilho e na janela, redimensionamento
da janela, e mudança de tamanho do gatilho e do balão (`ResizeObserver`),
agrupando por quadro. É ligado ao mostrar e desligado no `hide()`.
**O que é refeito a cada atualização, e é o ponto delicado deste componente**: o
lado final E a seta. Um flip provocado por ROLAGEM troca o lado com o balão já
na tela, e a seta que não fosse refeita apontaria para o lado antigo. A conta da
seta saiu para uma função própria (`placeArrow`), chamada no callback.
**Portões**: passo `'Com o painel aberto, o gatilho deslocado e a página rolada
reposicionam o painel junto dele'` na `States/Open` do vanilla; e um passo na
`Compositions/Collision` que rola até o balão VIRAR para cima e confere a seta —
o passo de deslocamento horizontal não pegaria a seta velha, porque não vira o
lado. Provado: com a seta não refeita, a folga entre o bico e o gatilho deu
−80,5 px.
**Limite declarado**: a sonda de vazamento das stories só conta ouvintes de
`window` e `document`; os de contêiner rolável e o observador ficam provados
pelo teste unitário do utilitário.

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

**Animação: nenhuma, desde 2026-09-16.** A entrada nunca animou — opacidade zero
na entrada corre com a checagem síncrona de visibilidade das plays —, e a saída
deixou de animar por decisão da dona.
**O que a saída era, e por que saiu**: opacidade e `scale(0.95)` pendurados em
`[data-ending-style]`, atributo de LIB que não chega às cinco — medido em
2026-09-15 nas fontes instaladas: o base-ui (react) o escreve; a `reka-ui` (vue)
não o cita em arquivo nenhum; o vanilla remove o nó na hora (`tooltip.ts:281`);
no bits-ui e no radix-ng o atributo existe no pacote e o módulo do tooltip não o
cita. No máximo três das cinco animavam, e a stack de referência não era uma
delas. Regra de acabamento que depende de atributo de lib produz saída diferente
por stack, em silêncio.
**Consequência**: a folha não declara movimento nenhum, e por isso não tem guarda
de `prefers-reduced-motion` — ela saiu da lista de guardas inertes de
`hover-card.md` §8, que passou de quatro para três.

**Até 2026-09-12 esta linha dizia "pelo mesmo motivo do popover e do
hover-card"**, e o popover saiu do exemplo: em 2026-09-12 ele deixou de animar por
completo, por decisão da dona, e com isso não há mais lado dele para comparar.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | balão fora do documento |
| Opening | hover, durante o atraso do provedor | nada visível |
| Open | atraso cumprido, ou foco por Tab | balão montado, seta apontando o gatilho |
| Closing | saída | o balão sai sem transição, nas cinco — ver §5 |

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

**E a CHAVE do conteúdo se chama `props.table.delay` nas cinco, o que não é defeito** —
medido em 2026-09-16, depois de duas agentes o relatarem como tal na mesma rodada. A
chave carrega `type`, `default`, `required` e `description`, e **não carrega `name`**:
quem escreve o nome da prop é cada docs page, e é por isso que a página do vue publica
`delayDuration` lendo `props.table.delay.*`. O id da chave é interno; o que o leitor vê
é o nome que a stack dele usa. O defeito real desta família era outro, e foi corrigido
nesta rodada: a página do svelte PUBLICAVA `delay` onde a prop é `delayDuration`.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica `createTooltip`, com `onShow` disparado na exibição REAL — registrado em `PATCHES.md#vanilla-tooltip-onshow`, e existe para o evento não depender de duplicar o timer privado da fábrica. A fábrica é também a única sem `open`/`defaultOpen`/`onOpenChange`/`align`/`sideOffset` — ver a tabela acima |
| vanilla | o grupo é `createTooltipProvider`, uma fábrica que devolve o próprio `createTooltip` já amarrado ao padrão do grupo; nas outras quatro o provedor é contexto |
| vanilla, react | a constante do atraso tem nome por stack — `SHOW_DELAY` no vanilla, `TOOLTIP_DEFAULT_DELAY` no react, `NDS_TOOLTIP_DELAY` no angular —, e o do vanilla é **fixado pelo portão**: `ATRASO_DE_TOOLTIP`, em `scripts/audit.mjs`, procura o nome para comparar o valor do primitivo com o que a tabela de props publica. Medido em 2026-09-16: renomear o do vanilla para o do react reprova *high*, porque a regra passa a ler "a stack não declara mais o atraso". A constante do vanilla é EXPORTADA desde esta data, para a story que mede o padrão não redigitar o número |
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

### Inconsistências entre stacks — medidas em 2026-09-15, corrigidas em 2026-09-16

A numeração de 1 a 17 é a da medição original e **fica**, porque C4, D2 e §5
apontam para itens por número. O texto de cada um passou a dizer o estado de
hoje. Caminhos relativos a `nortear-design-system-<stack>/src/components/`;
`ui/` do vue e do svelte é `ui/tooltip/`.

**O que sobra**: os itens 1 e 2, que são divergência de API registrada e não se
alinham, e o 14, que é a PENDÊNCIA do bloco do Provider (§10).

**O que a passagem mediu, e o auditor não via**: nenhum dos dezessete era visto
por regra do auditor — ele fechou com 0 violações antes e depois. E dois defeitos
só apareceram no NAVEGADOR, depois de o flip entrar na referência: as stories de
lado afirmavam o lado pedido sem garantir folga, e liam `data-side` no primeiro
paint, antes de o posicionador medir. Compilação, lint, unitários e auditor
passavam com os dois de pé, em quatro stacks. Por isso duas regras novas valem
para toda story de lado: **a folga é garantida por EIXO e MEDIDA como premissa**
(não declarada em comentário), e **espera-se o VALOR do `data-side`**, nunca a
existência dele.

Suítes de navegador ao fim da passagem: react 39, vue 36, svelte 36, vanilla 31 e
angular 53, todas verdes, mais a fumaça das docs pages nas cinco.

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

3. **FECHADO · o `0` de decorator saiu das cinco.** Era o resíduo que a D5
   condena: react o cravava nos quatro decorators de meta, vue idem, angular em
   cada story e no arg do `Playground`. Hoje o zero sobrevive só onde há ponteiro
   real — a `PersistenceInBubble`, que precisa do balão aberto para medir a
   tolerância. Story que quer o balão aberto na hora usa foco ou `defaultOpen`,
   que não passam pelo temporizador. O angular ainda publicava `[delay]="0"` no
   `EXTENSIBILITY_CODE` da docs page, ou seja ENSINAVA a desligar a espera; agora
   publica um valor por gatilho, que é a lição real do bloco.

4. **FECHADO · o conjunto de stories é o mesmo nas cinco.** `-compositions` traz
   `IconButtonWithShortcut`, `HelpInFormField`, `MetricDescription`,
   `PlacementSides`, `Collision` e `GroupWait`; o estado de foco, que tinha cinco
   nomes, é `KeyboardFocus`; a medição do atraso padrão é `HoverDefaultDelay`. Os
   nomes saem do vanilla. `ActionBar`/`IconBarToolbar` saiu: a barra de ícones
   existia para mostrar espera de grupo e só contava rótulos — quem mede isso
   agora é a `GroupWait`, que é também a story do card `actionBar` do conteúdo
   compartilhado, para nenhuma docs page publicar card sem story. Extras
   declarados: `ProviderWithMarkup` e `ListenerCleanup`, no vanilla; `Controlled`
   não existe no angular, que tem `open`, nem no vanilla, que não tem a API.
   **Renomear não é mover**: story trocada de arquivo muda de id e leva junto a
   baseline do Chromatic, então as renomeações ficaram no arquivo de origem.

5. **FECHADO · o flip vale nas cinco, e C8 ganhou portão.** Por decisão da dona o
   vanilla passou a chamar `positionFloating` com `{ flip: true }` e a reconciliar
   `data-side` E a seta com o lado devolvido — virar o painel e esquecer a seta é
   defeito que compila e renderiza. Os literais da docs page que negavam
   reposicionamento saíram nos três idiomas. Nasceu a `Compositions/Collision` nas
   cinco, e as seis asserções que aceitavam `[lado, oposto]` — que passavam com ou
   sem o recurso — passaram a exigir o lado exato. Prova de dentes: sem a folga do
   palco, a premissa reprova nomeando os números (`0px livres para um balão que
   precisa de 38px, quadro 1200×900`).

6. **FECHADO · a persistência tem as duas metades nas cinco.** As quatro que
   faziam `userEvent.hover(balao, { pointerEventsCheck: 0 })` — a forma que a D2
   mede como ponteiro em 0,0 — passaram a ditar `clientX/clientY` do centro do
   balão e a afirmar que levar o ponteiro para longe FECHA. Cada lib pediu um
   caminho: no reka o ouvinte recusa evento cujo alvo não é elemento, então a
   coordenada vai no `body`; no base-ui o balão só solta quando o ponteiro sai do
   GATILHO; no bits a chegada por coordenada limpa o rastreio do polígono. Prova
   de dentes: com `toleranciaInside` sempre verdadeira, a story reprova.

7. **FECHADO · a espera de grupo é provada nas cinco, com as duas metades.**
   Nasceu a `GroupWait`, e o vanilla ganhou a `HoverDefaultDelay` que faltava, com
   piso e teto (0,9× e 1,7×). **A metade que dá dentes é a primeira**: o primeiro
   balão abre por PONTEIRO e PAGA a espera; só então o vizinho abre sem esperar.
   Vue e angular abriam o primeiro por `focus()`, que por contrato abre na hora —
   provavam que o vizinho não espera e nunca que alguém espera, e uma janela que
   jamais esfriasse passaria igual. Prova de dentes: com `[delay]="0"` plantado, a
   `GroupWait` reprova no piso.

8. **FECHADO · o foco abre sem atraso, medido por relógio.** O vue era o único sem
   relógio — só `data-state="instant-open"` depois de `waitFor`, o que passaria com
   o foco preso aos 600 ms — e passou a medir com teto. As cinco medem tempo.

9. **Animação de saída — RESOLVIDO em 2026-09-16.** A folha animava em
   `[data-ending-style]`, atributo que no máximo três das cinco recebiam: react
   pelo base-ui; vue nunca (a `reka-ui` instalada não o cita); vanilla remove o
   nó sem transição (`ui/tooltip.ts:281`); svelte e angular tinham o atributo no
   pacote sem o módulo do tooltip citá-lo. Por decisão da dona a transição saiu
   da folha, com o motivo no lugar dela — nenhuma stack anima a saída, que é o
   que a referência já fazia. Nenhum arquivo de tooltip das cinco stacks cita o
   atributo, então a remoção não deixou story nem sonda órfã.

10. **Atributo de estado: a mecânica diverge, a asserção não.** `data-state="open"`
    no vanilla e no angular; `instant-open`/`delayed-open` em vue e svelte; no
    react só `data-open`/`data-instant` do base-ui. Isso é lib, e fica
    registrado. O que se alinhou foi a asserção: a story `Open` afirma o estado
    da lib nas cinco — react e svelte não afirmavam nenhum.

11. **FECHADO · as asserções avulsas.** O `WithShortcut` do vanilla usava a
    string `'Salvar (Ctrl+S)'`, sem `<kbd>` nenhum, e não media nada; a
    `IconButtonWithShortcut` dele também não. As duas passaram a montar as duas
    teclas com `data-slot="kbd"` e a afirmar o `paddingInlineEnd` encurtado, que
    é o D7 — a referência não demonstrava o assunto da própria story. O `Closed`
    do angular passou a consultar `role="tooltip"` no body, como as outras
    quatro. O espião de mudança de abertura continua onde a API existe.

12. **FECHADO · a linha `delayed` é publicada nas cinco.** O angular a tirava
    com o argumento de que não há balão durante a espera — o que vale igual nas
    cinco, e portanto não justificava a diferença.

13. **FECHADO · a tabela de props publica o nome REAL de cada stack.** O svelte
    publicava `delay` onde a prop é `delayDuration`, e era defeito de página, não
    divergência de API. Os nomes seguem diferentes entre stacks de propósito
    (`delay` em react e angular, `delayDuration` em vue, svelte e vanilla), e a
    CHAVE do conteúdo (`props.table.delay`) é id interno, não nome publicado.

14. **FECHADO · o segundo bloco da Importação virou chave compartilhada.** Ele
    ensina onde montar o Provider, e era constante LOCAL nas cinco docs pages —
    cinco cópias do mesmo código publicado, mantidas à mão, que já ensinavam
    cinco coisas diferentes: react com `timeout={300}`, vue com
    `:skip-delay-duration="300"`, svelte sem janela e repetindo o uso do balão,
    vanilla misturando grupo, marcação como elemento e um `delayDuration: 0` que
    ensinava a DESLIGAR a espera, e o angular sem provedor nenhum — publicava a
    lista de `imports` do componente, que é outro assunto. Agora as cinco leem
    `import.provider` (a prosa) e `import.providerCode` (as cinco variantes), e o
    angular ensina o provedor no root como as outras quatro, por decisão da dona.
    O atraso segue ensinado pela AUSÊNCIA (D5) e a janela do grupo escrita, por
    ser assunto sem padrão implícito a herdar.

15. **FECHADO · os literais que contradiziam o código.** Saíram os três: a nota
    do vanilla que negava a seta e o reposicionamento (três idiomas, mais o
    override de `props.local.side.description` e o comentário do
    `extensibilityCode`), o comentário do angular que dizia não haver tooltip
    vivo no Do & Dont quando a página tem quatro, e o `display: none` do
    comentário do angular onde a folha usa `visibility: hidden`.
    **Na mesma varredura saiu uma classe que não pintava nada**: o
    `nds-max-w-xs` das prévias e dos snippets publicados vale `max-width: 20rem`,
    exatamente o que `.nds-tooltip-content` já declara. Quatro stacks a
    aplicavam, o angular nunca; em snippet publicado é o caso pior, porque quem
    copia leva o no-op achando que limita. Quem ensina a lição do balão largo é o
    texto longo. O `nds-max-w-sm` do CONTÊINER do campo ficou — ele é a largura
    do formulário de exemplo, e virou `nds-w-sm` nas cinco, que declara a largura
    e funciona também sob `layout: 'centered'`.

16. **Analytics — tipo igual, disparo por dois mecanismos.** O tipo
    `tooltip_view { component; trigger_id?; location? }` é idêntico nas cinco
    (`lib/analytics.ts`: react `:591`, vue `:535`, svelte `:536`, vanilla `:526`,
    angular `:513`). Disparo: react `rastrearTooltip` (`docs/TooltipDocs.tsx:99`),
    vue (`.vue:159`), svelte (`.svelte:28`) e angular `aoAlternar` (`:816`) na
    mudança de abertura; vanilla `trackTooltipView` no `onShow` (`:197`). Os cinco
    cobrem demo, do-dont, variantes e composições com o mesmo `trigger_id`.
    **O snippet publicado ensinava o evento SEM `trigger_id` nem `location`**, no
    `props.extensibilityCode.vanilla` do conteúdo compartilhado e na docs page que
    o espelha; corrigido em 2026-09-16 — snippet é o que se copia, e ensinar
    payload incompleto produz evento que não responde "de onde veio este clique".

17. **Construtores de snippet e seus testes**, medidos em 2026-09-16: angular 15
    construtores e 23 `it`; vue 14 e 19; react 13 e 22; svelte 8 e 19; vanilla 3
    e 13. A granularidade acompanha o item 4 e a forma de cada stack: o vanilla
    serve as stories por builders parametrizados, o svelte usa o construtor do
    meta com args, e o angular é o único cujo teste local cobra que todo
    construtor exportado entra na varredura. O que importa é que as stories novas
    desta passagem (`Collision`, `GroupWait`) nasceram com construtor e teste nas
    cinco — a catraca do painel Code não tem linha de base para o angular, onde
    story sem `transform` reprova.

## 8. Acessibilidade

**Atributos**: `role="tooltip"` no balão; `aria-describedby` no gatilho.

**Teclado**: o foco no gatilho abre sem atraso; Escape fecha e o foco fica onde
está. O balão não entra na ordem de tabulação.

**O que NÃO se faz, de propósito:**

- nada clicável dentro — para isso existem Popover e HoverCard;
- o tooltip não substitui o nome acessível de um botão só de ícone: o
  `aria-label` é obrigatório no botão, e o balão é complemento;
- em touch não há hover, então nenhuma informação essencial mora aqui.

**Movimento reduzido: não há o que parar.** Desde 2026-09-16 a folha não declara
movimento nenhum — a entrada nunca animou e a saída deixou de animar (§5) —,
então ela também não tem bloco `@media (prefers-reduced-motion)`. Folha que não
anima não precisa de guarda, e guarda sem declaração é enfeite que se lê como
proteção.

**A guarda que existia era, ela própria, inerte**, e vale registrar porque é o
mecanismo que ainda vale para outras folhas: medido em 2026-09-12, ela mirava
`.nds-tooltip-content` (0,1,0) contra a transição em
`.nds-tooltip-content[data-ending-style]` (0,2,0) — a declaração vencia, e
`@media` não acrescenta especificidade. O balão parava de qualquer forma, pela
camada de token (`docs/shared/tokens/motion.css` zera a escada de
`--duration-*`), e é por isso que ninguém tinha notado. Esta folha era uma das
QUATRO nessa situação; com a saída dela, a pendência de `hover-card.md` §8 conta
três — `dialog.css`, `dropdown-menu.css` e `sheet.css`.

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

> **FECHADA · 2026-09-16** — o segundo bloco da seção **Importação**, que
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
> **Como fechou**: nasceram `import.provider` (prosa) e `import.providerCode`
> (cinco variantes, três idiomas), e as cinco páginas passaram a consumi-las — o
> objeto `import` do conteúdo estava vazio. Por decisão da dona o angular passou a
> ensinar o provedor no root, como as outras quatro; a lição virou uma só.
> **Duas coisas saíram junto, e as duas eram do tipo que ninguém vê**: o bloco do
> vanilla publicava `delayDuration: 0`, ou seja ENSINAVA a desligar a espera que a
> D5 fixou, e usava identificadores em português (`comEspera`, `botaoCopiar`) —
> invisíveis enquanto o snippet era constante local, e contra a regra da casa
> assim que ele entrou no conteúdo compartilhado.
> **Portões**: `--only soltos` devolve "Nenhum.", `audit.mjs tooltip` fica em
> zero, os cinco builds passam (o `ngc` é o único que type-checa o template do
> angular, que trocou constante por `computed`), e a docs-smoke do Tooltip fecha
> verde nas cinco — é ela que renderiza a página e veria chave faltando.

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

> **FECHADA · 2026-09-16** — C8 (flip) não tem portão em stack nenhuma e não
> vale no vanilla, que posiciona sem `flip` e declara isso na docs page; as
> asserções de lado das outras quatro passam com ou sem o recurso (§7, item 5).
> **Fecha quando**: a dona decidir se o tooltip do vanilla liga `flip` ou se C8
> ganha "não vale no vanilla", e as cinco tiverem uma story que force colisão e
> afirme o lado final.
> **Como fechou**: a dona mandou LIGAR o flip na referência. O vanilla passa
> `{ flip: true }` e reconcilia `data-side` e a SETA com o lado devolvido — virar o
> painel e esquecer a seta é defeito que compila e renderiza. Os literais da docs
> page que negavam reposicionamento saíram, nos três idiomas. A story `Collision`
> nasceu nas cinco, e as asserções de lado que aceitavam `[lado, oposto]` — seis
> pontos, que passavam com ou sem o recurso — passaram a exigir o lado exato.
> **E ligar o flip foi o que tornou visíveis dois defeitos que nenhum portão via**:
> as stories de lado afirmavam o lado pedido sem garantir folga (react, vue, svelte
> e vanilla reprovaram em navegador, cada uma por um lado), e liam `data-side` no
> primeiro paint, antes de o posicionador medir. Compilação, lint, unitários e
> auditor passavam com as duas coisas de pé.

> **FECHADA · 2026-09-16** — a `PersistenceInBubble` de react, vue, svelte e
> angular usa o hover sintético que D2 mede como ponteiro em 0,0 e não tem o
> passo negativo (§7, item 6).
> **Como fechou**: as quatro passaram a ditar `clientX/clientY` do centro do balão
> e a afirmar que levar o ponteiro para longe FECHA, como a referência. Cada lib
> exigiu um caminho próprio para armar a área de tolerância — no reka o ouvinte
> recusa evento cujo alvo não é elemento, então a coordenada vai no `body`; no
> base-ui o balão só solta quando o ponteiro sai do GATILHO; no bits a chegada por
> coordenada limpa o rastreio do polígono. O contrato é o mesmo nas cinco, e agora
> a metade que dá dentes existe em todas: sem ela, tolerância infinita passaria.
> **Fecha quando**: as quatro ditarem coordenada e afirmarem que levar o
> ponteiro para longe fecha, como `nortear-design-system-vanilla/src/components/ui/tooltip-states.stories.ts:220-242`.

> **FECHADA · 2026-09-16** — a espera de grupo só é provada no vanilla, e o
> atraso padrão não é medido em relógio no vanilla (§7, item 7).
> **Fecha quando**: as cinco tiverem story de grupo que mostre o vizinho abrindo
> sem espera, e o vanilla tiver story que meça o padrão com piso e teto.
> **Como fechou**: nasceu a `Compositions/GroupWait` nas cinco, e o vanilla ganhou
> a `HoverDefaultDelay` que faltava, com piso e teto (0,9× e 1,7× do padrão).
> **A story de grupo precisou de DUAS metades, e a segunda é a que dá dentes**: o
> primeiro balão abre por PONTEIRO e paga a espera (piso antes do prazo), e só
> então o vizinho abre sem esperar. Vue e angular abriam o primeiro por `focus()`,
> que por contrato abre na hora — assim provavam que o vizinho não espera, e nunca
> que alguém espera; uma janela de grupo que jamais esfriasse passaria igual.
> Provado no angular plantando `[delay]="0"`: a `GroupWait` reprova no piso
> (`expected 10.2 to be greater than or equal to 2700`), plantado e restaurado na
> mesma chamada.

> **FECHADA · 2026-09-16** — a animação de saída depende de
> `[data-ending-style]`, que no máximo três das cinco recebem; vue e vanilla não
> animam (§7, item 9).
> **Fecha quando**: a dona decidir entre animar a saída nas cinco ou tirar a
> transição da folha, e §5 e §6 descreverem o resultado.
> **Como fechou**: a dona escolheu TIRAR a transição — animar exigiria código de
> saída novo no vanilla e no vue, com risco de corrida com as plays, que é o
> motivo de a entrada já não animar. A regra saiu de `tooltip.css` com o motivo
> escrito no lugar dela, a guarda de movimento reduzido saiu junto (não havia mais
> o que guardar), e §5 e §6 descrevem balão que some sem transição nas cinco.

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


