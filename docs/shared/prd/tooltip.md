# PRD — Tooltip

> **Estado descrito**: 2026-09-12. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

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
| C1 | Abre no hover, depois do atraso do provedor | `testes.functional.item1` |
| C2 | Abre no foco por Tab **imediatamente**, sem atraso | `testes.functional.item2` |
| C3 | `Escape` fecha, e o foco PERMANECE no gatilho | `testes.functional.item3` |
| C4 | Levar o ponteiro do gatilho até o balão não fecha; levar para longe fecha | `testes.functional.item4`, story `PersistenceInBubble` — e o segundo passo é o controle negativo, sem ele "continua aberto" não provaria nada |
| C5 | `aria-describedby` liga o gatilho ao balão | `accessibility.items.item2` |
| C6 | Não é interativo: nada clicável dentro | `accessibility.items.item4` — julgamento |
| C7 | Botão só de ícone tem `aria-label` PRÓPRIO; o tooltip é complementar | `accessibility.items.item5` |
| C8 | Sem espaço no `side` pedido, vira para o lado oposto | story de posicionamento |

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
canto da tela. A play da story dita a coordenada à mão, e por isso passa a valer.
**O par que dá dentes**: a mesma play verifica que levar o ponteiro para LONGE
fecha. Sem esse segundo passo, "continua aberto" passaria mesmo se a tolerância
fosse infinita.

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
tooltip                       (raiz — provedor governa atraso e espera de grupo)
└── tooltip-trigger           aria-describedby aponta para o balão
    └── tooltip-positioner    (nome só em react e angular — ver D1)
        └── tooltip-content   role="tooltip" · o balão
            ├── [texto]       e nada mais que texto — ver C6
            ├── kbd           opcional; encolhe o padding do balão (D7)
            └── tooltip-arrow a seta, desenhada por clip-path (D3)
```

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

**Até 2026-09-12 esta linha dizia "pelo mesmo motivo do popover e do
hover-card"**, e o popover saiu do exemplo: em 2026-09-12 ele deixou de animar por
completo, por decisão da dona, e com isso não há mais lado dele para comparar.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | balão fora do documento |
| Opening | hover, durante o atraso do provedor | nada visível |
| Open | atraso cumprido, ou foco por Tab | balão montado, seta apontando o gatilho |
| Transitioning | saída | opacidade e escala até terminar |

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


