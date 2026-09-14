# PRD — Badge

> **Estado descrito**: 2026-09-13, escrito a partir do código, antes da revisão
> serial deste componente. A revisão de código vai usar este documento como base:
> o que está aqui foi medido nas cinco stacks, na folha compartilhada e no
> conteúdo, e as divergências entre stacks estão registradas em vez de resolvidas.
>
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Etiqueta **inline** de rótulo curto — status, categoria, contagem — que mora
dentro de frase, de título e de célula de tabela sem quebrar a linha.

Não é controle: não recebe foco, não tem papel ARIA e não escuta clique. Quando o
rótulo precisa ser acionável, quem envolve é um `<button>`, e o badge fica só com
a aparência.

| vizinho | diferença que decide |
|---|---|
| Button | é preenchido e é controle; a etiqueta é só contorno, e desde o redesenho é isso que as separa na tela |
| Alert | tem título e descrição, e ocupa a largura do bloco |
| Tooltip / HoverCard | aparecem por gesto; a etiqueta está sempre na tela, ao lado do que ela qualifica |

**Ela é a peça mais consumida das próprias docs pages.** Medido em 2026-09-13, a
folha `.nds-badge` é vestida por três consumidores internos além do componente:
`DocsHeader` (as duas pílulas de categoria e de tipo, no topo de todas as 82+
páginas de cada stack), `DocsTestes` (a pílula de prioridade de cada linha das
tabelas de teste, com a variante escolhida por `docs/shared/primitives/badge-priority.ts`)
e a família conversacional — `agent-run.css`, `composer.css` e `medicao.css`
documentam a etiqueta de ESTADO como `.nds-badge` nos docblocks
(`tool-group-state`, `agent-plan-state`, `composer-queue-state`,
`context-display-level`, `cost-meter-level`). Nenhuma dessas folhas declara regra
sobre `.nds-badge`: elas compõem a classe. Editar `badge.css` alcança todas elas
de uma vez.

**Prioridade não é variante.** O trio `-high/-medium/-low` que existia na folha
era cor semântica com nome de uso; hoje `prioridadeVariant(label)` traduz o
rótulo (nos três idiomas, sem acento e sem caixa) para `destructive`, `warning`
ou `info`. As cinco stacks consomem a MESMA função — medido nos cinco
`DocsTestes.*`.

## 2. Contrato de comportamento

Cada linha aponta a chave de `docs/shared/content/badge/translations.json` que a
publica e a story que a mede. As chaves citadas existem nos três idiomas
(conferido em 2026-09-13: `testes.functional` tem 7 itens, `testes.accessibility`
4 e `testes.visual` 6, em pt-BR, en e es).

| # | o contrato | chave · onde é medido |
|---|---|---|
| C1 | A raiz é `<span>`, inline-flex, `white-space: nowrap` | `testes.accessibility.item1` · passo "É um `<span>`" do Playground das cinco |
| C2 | A etiqueta NÃO é preenchida: fundo `--background` e texto `--foreground` em todas as variantes | `testes.functional.item7` · `Semantics` (react, vue, svelte, vanilla) e passo "Cada variante pinta a BORDA" do `Variants` (angular) |
| C3 | Quem carrega a variante é a borda, com no mínimo 2px | `testes.functional.item1` · `Default` das quatro; `Variants` no angular |
| C4 | `default` lê `--primary`, `destructive` lê `--destructive`, `warning` lê `--warning`, `success` lê `--success` | `testes.functional.item1`, `item2`, `item3` · `Default`, `Destructive`, `Semantics` |
| C5 | `info` NÃO lê o token homônimo: ela usa a hairline neutra `--border` | `testes.functional.item4` · `Semantics` / `Variants`, que gravam a expressão de cor esperada em vez do nome do token |
| C6 | As três semânticas são distinguíveis entre si — três cores, não três nomes da mesma | `testes.functional.item7` · asserção `new Set(borders).size === 3` nas cinco |
| C7 | A `warning` não pode coincidir com a `destructive` | `testes.functional.item2` · comparação explícita contra a borda da destructive nas cinco |
| C8 | O texto alcança 4.5:1 sem depender da variante escolhida | `testes.accessibility.item3` · medida de razão em vue, svelte e angular; igualdade contra referência viva em react e vanilla |
| C9 | O ícone filho é decorativo (`aria-hidden="true"`) e o nome acessível é só o texto | `testes.accessibility.item2` · `WithIcon` das cinco |
| C10 | O respiro entre ícone e rótulo é do container (`gap`), e `data-icon` encurta o padding daquele lado | `testes.functional.item5` · `WithIcon` das cinco, comparando `paddingInlineStart < paddingInlineEnd` |
| C11 | O contador fica à DIREITA do rótulo, na mesma linha, e é texto lido (sem `aria-hidden`) | `testes.visual.item6` · `WithCounter` das cinco, com a caixa do rótulo saindo de um `Range` |
| C12 | O contador é neutro em qualquer variante, e o número alcança 4.5:1 contra o fundo dele | `testes.visual.item6` · `WithCounter` das cinco |
| C13 | Envolvido em `<button>`, quem recebe o foco é o pai; o badge não ganha `tabindex` | `testes.functional.item6`, `testes.accessibility.item4` · `AsButton` (react, vue, svelte, vanilla) e `AsTrigger` (angular) |
| C14 | `data-slot="badge"` e a classe `.nds-badge` saem sempre; o contador sai com `data-slot="badge-counter"` e `.nds-badge-counter` | `testes.visual.item6` · Playground e `WithCounter` das cinco |
| C15 | Tipografia fixa: 12px e peso ≥ 500 — não há eixo de tamanho | — · passo "Tipografia compacta" do Playground das cinco |

**O que NENHUM portão mede, e está registrado aqui de propósito**: `data-variant`
é afirmado nas cinco, mas só com a variante EXPLÍCITA (ver §7, divergência do
Vue); e os três estados que a folha desenha — foco visível, inválido e hover
dentro de link — não têm produtor em stack nenhuma (§6).

## 3. Decisões fixadas

### D1 · A etiqueta deixou de ser preenchida, e quem carrega a variante é a borda

**Estado**: `--badge-bg: hsl(var(--background))` e `--badge-fg: hsl(var(--foreground))`
para as cinco variantes; cada variante reaponta UMA coisa, `--badge-border`.
**Motivo**: separar a etiqueta do botão, que continua preenchido — duas formas
parecidas na mesma tela faziam a etiqueta parecer clicável.
**Consequência medida, e é ela que vale**: o texto saiu do par semântico, então o
contraste do rótulo **deixou de depender da variante escolhida**. É o que torna
C8 verificável por igualdade contra uma referência viva, sem medir cinco razões.
**Onde está escrito**: docblock e primeira regra de `docs/shared/styles/nds/badge.css`.

### D2 · A borda é de 2px, não de 1px

**Medição**: em traço fino duas cores próximas somem na tela, e desde D1 a borda é
o ÚNICO portador da variante. As plays das cinco cobram `borderTopWidth ≥ 2`
(no svelte, igualdade exata a 2).

### D3 · O piso da borda é 3:1, e uma das cinco fica abaixo dele de propósito

**Estado**, medido nos três temas e nos dois modos contra `--background`, com o
piso de WCAG 1.4.11 (a borda é o contorno que identifica a variante):

| variante | razão | passa o piso |
|---|---|---|
| `default` (`--primary`) | — | sim |
| `destructive` | — | sim |
| `success` | — | sim |
| `warning` | 4.66:1 no claro · 5.22:1 no escuro | sim |
| `info` (`--border`) | 1.22 a 1.99 | **não, por decisão** |

A `info` assumiu a hairline neutra do projeto, a mesma que input e card desenham:
mudar isso é assunto da paleta, não do badge. Em troca ela responde por outra
promessa — não parecer a ênfase alta (C5).
**Onde está escrito**: comentário do bloco de variantes de `badge.css`.

### D4 · A `warning` voltou ao token, e a exceção por componente resolvia o problema errado

**Estado**: `--badge-border: hsl(var(--warning))`. Já foi o literal `hsl(22 55% 62%)`,
escolhido para afastá-la da `destructive` quando as duas colavam.
**Medição que desfez a exceção**: o literal estava a 5° de matiz do próprio
`--warning` no claro e a 1° no escuro — o mesmo laranja, mais claro e menos
cromático — e como traço de 2px media **2.61:1** contra a página, abaixo do piso
de 3:1, enquanto o token media **4.66:1** e passava. Trocou-se uma cor conforme
por uma que reprovava.
**Onde a separação foi feita**: na paleta. O `--destructive` do tema Default
passou a `352 80% 40%` no claro e `358 95% 79.5%` no escuro, com croma maior que
o do warning e 23° a 32° de distância de matiz.
**Consequência**: hoje o badge não tem **nenhuma** cor literal.

### D5 · O contador é NEUTRO em qualquer variante

**Estado**: fundo `--secondary`, texto `--foreground`, em todas as variantes.
**Medição**: preenchê-lo com a cor da variante — o que a referência de mercado faz
— deixa o número sem contraste. Contra `--warning` do tema warm nem `--background`
(4.40) nem `--foreground` (4.07) alcançam os 4.5 que texto pequeno exige, porque a
cor é de luminância média demais para os dois. Neutro dá **9.48** no pior caso dos
três temas.
**Regra da casa que isso executa**: o contraste não pode depender da variante
escolhida. A cor não se perde — quem a carrega é a borda, ao redor.

### D6 · O token homônimo da variante `info` não é lido

**Estado**: `--info` existe na paleta e **não aparece em `badge.css`**. A variante
`info` é pintada por `--border` (D3).
**Onde está registrado**: docblock da folha ("`--info` NÃO é lido aqui"), a tabela
de tokens das cinco docs pages (que omitem a linha de propósito — o comentário
está em `BadgeDocs.vue`) e as plays, que gravam a EXPRESSÃO de cor esperada por
variante justamente para reprovar quem devolver os tokens homônimos por simetria.

### D7 · São cinco variantes: `secondary` e `outline` saíram

**Estado**: `default`, `destructive`, `warning`, `success`, `info` — a mesma união
nas cinco stacks (`BadgeVariant` em react, vue, svelte, vanilla e angular) e nos
cinco `argTypes` do Playground.
**Motivo registrado nas guidelines**: `secondary` era quase indistinguível da
`default`; `outline` perdeu sentido quando a etiqueta inteira passou a ser
contorno, e a hairline neutra dela virou a da `info`.
**O que a saída da `outline` deixou de herança**: `prioridadeVariant` devolve
`info` para rótulo desconhecido — era `outline`, e a tela não mudou porque a
borda é a mesma.

### D8 · O contador é SUBPEÇA, nunca uma opção `count` da raiz

**Estado**: peça própria nas cinco (`BadgeCounter`, `createBadgeCounter`,
`span[ndsBadgeCounter]`), com `data-slot` e classe próprios.
**Três razões, e as três estão escritas em cada primitivo**: o conteúdo não é só
número (`'99+'` é a orientação da documentação, e o truncamento é da aplicação);
a peça não é variante, é filho que QUALQUER variante aceita, então como opção cada
combinação teria de existir na assinatura; e a raiz não ganha ramo condicional
novo — o que, no vanilla e no react, evita o `v8 ignore` que as subpeças antigas
carregavam.
**Forma de casa**: é a mesma escolha de `AlertTitle`/`CardHeader` (react),
`createAlertTitle`/`createCardTitle` (vanilla), `alert-title` (svelte) e
`NdsAlertTitle` (angular, `@Directive` porque a peça é folha).

### D9 · A variante é tabela, não cadeia de ternários (vanilla e angular)

**Estado**: `VARIANT_CLASSNAME` é um `Record<BadgeVariant, string>` nas duas
stacks sem `cva`.
**Medição**: com cinco variantes a cadeia tem cinco ramos e o último é
inalcançável — o tipo já esgotou os valores —, o que obrigava a marcar
`v8 ignore` na própria implementação. O mapa não tem ramo, então não há o que
cobrir nem o que ignorar.

### D10 · Nunca `onClick` no badge — quem envolve é o controle

**Estado**: as cinco publicam a composição "como gatilho" com a etiqueta DENTRO de
um `<button>`, e as plays cobram que o badge não tenha `tabindex` e que o foco
pare no pai (C13).
**O que saiu por causa disso**: as classes `ghost` e `link` da folha (eram estilo
de badge interativo, e ninguém as renderizava), a prop `href` do svelte, e a
composição "como link" do vue e do angular — as duas ensinavam a mesma divisão de
papéis do gatilho.
**O que ficou como resíduo**: a folha ainda desenha `a > .nds-badge:hover` e
`a.nds-badge:hover`, sem produtor em stack nenhuma (§6).

### D11 · Não há eixo de tamanho, e a altura é resultado

**Estado**: `padding-block: var(--spacing-0-5)` + `line-height: 1.5` +
`font-size: var(--text-control-sm)`. **Nenhuma declaração de `height` na folha** —
medido em 2026-09-13: as duas únicas ocorrências de `height` em `badge.css` são o
`line-height` da raiz e do contador, mais `height: 0.75rem` no `> svg`, que é
ícone e não tem texto para crescer.
**Regra da casa que isso executa**: peça interativa (e aqui, peça de texto curto)
nunca tem altura fixa — ela cresce com a fonte do navegador (WCAG 1.4.4, Resize
Text 200%). As cinco cumprem, porque a folha é uma só e nenhuma stack declara
altura própria para o badge (nenhum `.css` local de stack menciona `nds-badge`).
**O contador tem `min-width: 1.25rem`**, e isso é largura, não altura: serve para
um dígito só sair redondo, com o padding assumindo a partir de dois.

## 4. Anatomia

```
badge                        <span>, inline-flex, borda de 2px, raio de pílula
├── svg [data-icon]          opcional, aria-hidden, 12px, ANTES do rótulo
├── rótulo                   nó de texto — 1 a 3 palavras, ou um número
└── badge-counter            opcional, à direita do rótulo, DENTRO da mesma borda
```

Só dois `data-slot`: `badge` e `badge-counter`. O ícone e o rótulo são conteúdo
arbitrário de quem compõe — o ícone não é peça publicada, é um SVG que a folha
dimensiona por `.nds-badge > svg`.

**`data-icon` é o posicionador, e é ele que compensa o padding**: com
`data-icon="inline-start"` a folha encurta `padding-inline-start`; com
`inline-end`, o outro lado. Ele é escrito pelas STORIES das cinco e por
**nenhuma docs page** (medido em 2026-09-13: zero ocorrências de `data-icon` nos
cinco `BadgeDocs.*`) — ver as pendências de §11.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/badge.css`, linha a linha. Instrumento:
`node scripts/tabela-tokens.mjs badge` — em 2026-09-13 ele fecha com 0 linhas
divergentes e 0 divergências entre stacks, com as cinco tabelas de docs page
listando as mesmas 13 linhas.

| propriedade | valor | token |
|---|---|---|
| fundo (todas as variantes) | — | `--badge-bg`, que aponta para `--background` |
| texto (todas as variantes) | — | `--badge-fg`, que aponta para `--foreground` |
| borda | 2px sólidos | `--badge-border`, a única que cada variante reaponta |
| borda · default | — | `--primary` |
| borda · destructive | — | `--destructive` |
| borda · success | — | `--success` |
| borda · warning | — | `--warning` (ver D4) |
| borda · info | — | `--border` — a hairline neutra, e não o token homônimo (D6) |
| raio | pílula | `--radius-badge` |
| padding inline | 8px | `--spacing-2` |
| padding block | 2px | `--spacing-0-5` |
| gap entre ícone e rótulo | 4px | `--spacing-1` |
| padding do lado do ícone | 6px | `--spacing-1-5`, aplicado por `:has([data-icon=…])` |
| corpo do texto | 12px | `--text-control-sm` |
| peso | 500 | `--font-weight-medium`, com literal `500` de fallback |
| família | herdada | `--font-family`, com `inherit` de fallback |
| entrelinha | 1.5 | **literal** — é o que faz a altura ser resultado (D11) |
| ícone | 12px | **literal** `0.75rem`, fora do grid de 8, declarado como padrão visual de badge |
| transição | fundo, cor, borda e sombra | `--duration-fast` |
| anel de foco | halo 2px + anel 5px | `--background` e `--ring` a 50% |
| anel de inválido | halo 2px + anel 5px | `--background` e `--destructive` a 40% |
| anel de foco por variante | anel 5px na cor da variante a 40% | `--destructive`, `--warning`, `--success`; a `info` usa `--ring` a 50% |
| contador · fundo | — | `--secondary` (D5) |
| contador · texto | — | `--foreground` |
| contador · raio | círculo | `--radius-full` |
| contador · largura mínima | 20px | **literal** `1.25rem`, igual à altura de um dígito |
| contador · padding inline | 4px | `--spacing-1` |
| contador · margem final | −4px | `--spacing-1` negativado, para encostar na borda direita |
| hover dentro de link | fundo sai do neutro | `--secondary` |

**Sem sombra e sem camada**: a etiqueta vive no plano da página, então não lê
degrau de elevação nem `z-index` — é o que a separa de toda a família de
superfícies flutuantes.

**Os três literais são intencionais e estão declarados**: a entrelinha (D11), os
12px do ícone (nota na própria regra) e a largura mínima do contador. Não há
literal de COR na folha desde D4.

**Um token lido e não listado nas tabelas de docs page**: `--radius-full`, que o
contador lê. O instrumento o aponta como candidato; hoje as cinco páginas
concordam em não listá-lo, e a linha do raio que elas listam é a da etiqueta.

## 6. Estados

| estado | quando ocorre | o que muda | tem produtor? |
|---|---|---|---|
| Repouso | sempre | fundo e texto neutros, borda da variante | sim, as cinco |
| Com ícone | SVG filho com `data-icon` | padding do lado do ícone encurta; gap de 4px | sim, as cinco stories |
| Com contador | `badge-counter` como último filho | pílula neutra à direita do rótulo | sim, as cinco |
| Movimento reduzido | `prefers-reduced-motion: reduce` | `transition: none` | sim — bloco `@media` da própria folha, além da escada de `docs/shared/tokens/motion.css` |
| Foco visível | `:focus-visible` na própria etiqueta | halo de 2px na cor do fundo + anel de 5px (da variante, ou `--ring`) | **não** |
| Inválido | `[aria-invalid="true"]` | anel permanente em `--destructive` a 40%; com foco, soma `outline` sólido em `--ring` com offset de 5px | **não** |
| Hover dentro de link | `a > .nds-badge` ou `a.nds-badge` | fundo sai do neutro para `--secondary` | **não** |

**Os três últimos não têm produtor em stack nenhuma**, e isso é medição de
2026-09-13: `aria-invalid` não aparece em nenhum arquivo de badge das cinco (nem
story, nem docs page), e não existe uma única etiqueta envolvida em `<a>` — as
cinco composições de gatilho usam `<button>`. O `:focus-visible` da raiz é
inalcançável por construção: um `<span>` sem `tabindex` não recebe foco, e a
orientação do componente é que ele nunca receba (D10).

Isso **não** faz das regras defeito: elas existem para o dia em que um consumidor
puser a etiqueta dentro de um link, e a folha é consumida por outras cinco
famílias (§1). Faz delas código sem cobertura — e é isso que o documento precisa
dizer, porque `states` do conteúdo compartilhado publica **uma** configuração só
(`countBadge`), e portanto as cinco docs pages descrevem uma linha de sete.

A ordem das regras de foco e de inválido já foi defeito, e o conserto está na
folha: o anel de inválido é PERMANENTE e era declarado depois do `:focus-visible`
com a mesma especificidade, então focar um elemento inválido não mudava nada na
tela (WCAG 2.4.7). Hoje os dois convivem — o destrutivo por dentro, o de foco por
fora — e o anel de foco é opaco, porque translúcido sobre o fundo media 1.97:1 e
não alcança os 3:1 de 1.4.11.

## 7. API

O eixo é um só, e ele é igual nas cinco: `variant`, com os mesmos cinco valores e
o mesmo padrão `default`.

| prop | tipo | padrão |
|---|---|---|
| `variant` | `default \| destructive \| warning \| success \| info` | `default` |
| classe extra | string | — |
| conteúdo | texto curto, número, ícone + texto, contador | — |

Não existe `size`, não existe `href`, não existe manipulador de evento. Ajuste
pontual sobrescreve as vars internas escopadas (`--badge-bg`, `--badge-fg`,
`--badge-border`) — e a que cada variante reaponta é só a terceira.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| react | `Badge` passa por `useRender` do base-ui: aceita `render` para trocar o elemento, e `data-slot`/`data-variant` saem do `state`. `className`. O `BadgeCounter` **não** passa por `useRender` — é folha, sem estado e sem `render` |
| vue | `Badge` embrulha o `Primitive` da reka-ui: herda `as` e `as-child`, e o default `span` é calculado (`props.as ?? 'span'`) porque o `Primitive` renderiza `div`. `class`. O `as` sai do `v-bind` delegado de propósito — deixá-lo lá reinjetava `as: undefined` depois do default, apagando-o |
| svelte | `variant`, `class`, `ref` bindável e `restProps`; `badgeVariants` e o tipo saem do bloco `module` do próprio `.svelte`. O índice reexporta as formas curtas `Root`/`Counter` ao lado de `Badge`/`BadgeCounter` |
| vanilla | fábricas `createBadge(options)` e `createBadgeCounter(options)`; `children` aceita string, `HTMLElement` ou lista dos dois, e string entra por `textContent` (XSS-safe). Tem o alias legado **`text`**, mantido por compatibilidade — e ele está vivo: 14 chamadas em 10 arquivos ainda usam `createBadge({ text: … })`, incluindo `DocsHeader.ts` e `DocsTestes.ts`. O contador aceita **só** `text: string` |
| angular | diretivas de ATRIBUTO amarradas ao elemento: `span[ndsBadge]` (componente, com `<ng-content />`) e `span[ndsBadgeCounter]` (`@Directive`, porque não há nada a projetar). `variant` é `input()`; a classe extra é o `class` nativo, mesclado pelo Angular. **`data-slot` é lido do atributo estático na construção**, com `'badge'` de fallback: é o que deixa quem compõe nomear a peça (`data-slot="composer-queue-state"`) sem que o host binding apague o nome — a mesma raiz da regra de estilizar por classe e nunca por `[data-slot]` |

**Onde a semântica é a mesma nas cinco**: a raiz é `<span>` sempre. No vue isso é
um default calculado e sobrescritível; no angular está no seletor, e trocar a tag
mudaria a semântica, não só o estilo; no svelte é literal, com o comentário
dizendo que `href` saiu do contrato. Esta era a divergência mais visível do
componente — o vue renderizava `div` — e fechou antes desta escrita.

### Divergências medidas que NÃO são de framework

| # | o que difere | quem faz o quê | a maioria |
|---|---|---|---|
| V1 | `data-variant` sem variante explícita | vue OMITE o atributo (a prop não tem default, e o template liga `:data-variant="variant"`); react, svelte, vanilla e angular escrevem `data-variant="default"` | 4 de 5 escrevem. Há instância viva: `BadgeDocs.vue` usa `<Badge>` duas vezes na demonstração |
| V2 | classe da variante `default` | react, vue e svelte emitem `nds-badge-default` (via `cva`); vanilla e angular emitem só `nds-badge` (mapa com string vazia) | 3 de 5 emitem a classe. A folha agrupa `.nds-badge`, `.nds-badge-default` e `.nds-badge-primary` na mesma regra, então a tela é idêntica — mas uma sonda montada com `nds-badge-default`, como as plays de react, vue e svelte fazem, descreve markup que a referência não produz |
| V3 | árvore de stories das variantes | react, vue, svelte e vanilla têm três stories (`Default`, `Destructive`, `Semantics`); angular tem UMA (`Variants`, com as cinco lado a lado e quatro passos) | 4 de 5 |
| V4 | nome da composição de gatilho | `AsButton` em react, vue, svelte e vanilla; `AsTrigger` no angular | 4 de 5 |
| V5 | envoltório do gatilho | react, vue e svelte usam `<button>` cru com utilitárias; vanilla usa `<button>` cru mas escreve `background`, `border` e `padding` em `style` inline na story; angular usa o `<button ndsButton variant="ghost" size="sm">` do design system | 3 de 5 no `<button>` cru com classe |
| V6 | parâmetros dos arquivos de story | react, vue, svelte e vanilla declaram `design: figmaDesign('badge')`, `actions: { disable: true }` e `layout: 'centered'`; os três arquivos do angular não declaram `design` nem `actions`, e usam `layout: 'padded'` | 4 de 5 |
| V7 | snippet do painel Code | react, vue, svelte e vanilla têm `badge.source.ts` com seis a nove construtores e `badge.source.test.ts`; o angular tem um só (`badgePlaygroundSource`), sem teste, e os quatro stories de variantes e composições publicam o template da story | 4 de 5 |
| V8 | tabelas de teste renderizadas | svelte e angular publicam os 7 itens funcionais e os 6 visuais; react, vue e vanilla param em 6 e 4 — a lista é literal (`[1,2,3,4,5,6]`) nos três | 2 de 5 estão completos; o angular é o único que DERIVA a lista do dicionário |
| V9 | conjunto da demonstração | react, vue e vanilla mostram as cinco variantes + uma com ícone; svelte mostra quatro (**sem `success`**) + ícone + tag + contador; angular percorre as cinco por `@for`, sem ícone | react/vue/vanilla coincidem |
| V10 | rótulo do gatilho na docs page | react e vanilla escrevem `React` literal, vue e svelte `Acessibilidade` literal, angular lê `demonstration.labels.categoryLabel`; svelte é o único que lê `tagLabel` (na demonstração) | nenhuma maioria — três literais diferentes, e duas chaves publicadas que quase ninguém usa |
| V11 | `obrigatório` do conteúdo na tabela de props | vue marca o slot padrão como `Sim`; react, svelte, vanilla e angular marcam `Não` | 4 de 5 |
| V12 | variante da pílula de categoria em `DocsHeader` | `default` em react, vanilla e angular; `info` em vue e svelte — as classes de cor por cima são idênticas nas cinco, então só o `data-variant` difere | 3 de 5 |
| V13 | `flex-wrap: wrap` inline no agrupador da demonstração | vue e svelte escrevem; react, vanilla e angular não | 3 de 5 — e `.nds-cluster` já declara `flex-wrap: wrap`, então o inline é redundante nos dois |

### Peças, por stack

| stack | peças |
|---|---|
| react | `Badge`, `BadgeCounter`, `badgeVariants` |
| vue | `Badge`, `BadgeCounter`, `badgeVariants`, tipo `BadgeVariants` |
| svelte | `Root`/`Badge`, `Counter`/`BadgeCounter`, `badgeVariants`, tipo `BadgeVariant` |
| vanilla | `createBadge`, `createBadgeCounter`, tipos `BadgeOptions`, `BadgeCounterOptions`, `BadgeVariant` |
| angular | `span[ndsBadge]` (`NdsBadge`), `span[ndsBadgeCounter]` (`NdsBadgeCounter`), tipo `BadgeVariant` |

**`ndsBadgeIcon` não existe.** A anatomia compartilhada publica
`<svg ndsBadgeIcon>` no snippet do angular, e a stack declara `ndsButtonIcon` —
é o que a story `WithIcon` usa. Portão: `angular_anatomy_seletor_inexistente`,
que reporta hoje.

## 8. Acessibilidade

**Atributos**: nenhum. O badge não declara `role`, não declara `aria-*` e não
entra na ordem de tabulação — é texto com desenho. O ícone filho leva
`aria-hidden="true"` e o nome acessível da etiqueta é só o rótulo (C9).

**Teclado**: nada. `Tab` não para nele; quando a etiqueta é envolvida por
`<button>` ou `<a>`, quem recebe foco e teclado é o pai — `Enter`/`Espaço` no
botão, `Enter` no link.

**O que deliberadamente NÃO se faz**:

- não se põe `onClick` no badge (D10) — sem isso o `Tab` pararia num elemento sem
  ação e sem nome de verbo;
- não se pinta o contador com a cor da variante (D5);
- não se usa a cor como único indicador: o estado é PALAVRA, e a cor é reforço. É
  a regra que as folhas conversacionais repetem ao vestir `.nds-badge`
  (`agent-run.css`, regra 4 dos dois docblocks) — cinco estados distinguidos só
  por forma e cor não chegam a quem não os vê;
- não se declara `role="status"` nem `aria-live` no badge. O conteúdo compartilhado
  orienta pôr os dois no CONTAINER PAI quando o valor muda, e a orientação de
  contagem é a mesma: `aria-label` descritivo no pai (`"12 notificações não
  lidas"`), porque número solto não diz de que é a contagem.

**Em contêiner colorido, o texto corrido é `--foreground`** — e aqui a regra é
cumprida no limite mais forte possível: desde D1 **nenhum** texto do componente
carrega cor semântica, nem o curto. A cor vive no contorno, que responde ao piso
de 3:1 (D3), e o número do contador responde a 4.5:1 contra o próprio fundo (C12).

**Movimento reduzido**: a transição de 2026 (`--duration-fast` em fundo, cor,
borda e sombra) é zerada duas vezes — pelo bloco `@media (prefers-reduced-motion)`
da própria folha e pela escada de `docs/shared/tokens/motion.css`, que apaga as
durações inteiras sob a preferência.

## 9. Analytics

| evento | quem dispara hoje | payload |
|---|---|---|
| `docs_page_view` | as cinco docs pages | `{ component_name: "badge", locale, page_title }` |
| `docs_section_viewed` | as cinco docs pages | `{ section_id, component_name: "badge", locale }` |
| `language_switched` | o seletor de idioma das cinco | `{ previous_language, new_language }` |

**O componente não dispara nada.** Nenhum dos cinco primitivos importa
`track`; o evento é do gatilho que ENVOLVE a etiqueta, e por isso só existe onde
alguém montou esse gatilho.

**`badge_click` SAIU em 2026-09-13, por decisão da dona** — do tipo das cinco
`analytics.ts`, do call site do react, das cinco tabelas de analytics e das chaves
do conteúdo compartilhado. O que fica é o `button_click` do `<button>` que envolve
a etiqueta: é ele que recebe o clique, e a etiqueta é aparência. Um evento a menos
é uma coisa a menos para manter coerente em cinco stacks.

O parágrafo abaixo é a medição que levou à decisão, e fica porque descreve a forma
de defeito: **evento anunciado e não disparado não é visto por portão nenhum** —
não é erro de tipo, não é violação de axe, e some entre os que "existem".

**Estado até 2026-09-13: tipado nas cinco `analytics.ts` e disparado em uma.**
Medido naquele dia: a única ocorrência fora das declarações estava em
`BadgeDocs.tsx`, no `onClick` do `<button>` da composição de gatilho. As outras
quatro páginas publicam a MESMA composição — com preview vivo em vue, svelte e
vanilla — e nenhuma delas chama `track`. As cinco tabelas de analytics anunciam a
linha `badge_click` ao leitor.

**O `label` do payload é literal, e literal de docs page**: `"React"`, escrito no
call site. Não é texto traduzido — então não parte a série do GA4 em três —, mas
também não é id: é o mesmo rótulo que a tela mostra, num ponto em que as outras
quatro stacks mostram outra palavra (V10). O conteúdo compartilhado documenta o
payload como `{ label, variant }` e o tipo declara quatro campos
(`component`, `label`, `variant?`, `location?`), com `component` e `location`
ausentes da tabela publicada.

**Três guidelines dizem outro evento.** `07-feedback-components.md` de react, vue
e vanilla fecha a seção do Badge com "Badge clicável (filtro, tag):
`button_click` com `label`". Não é o que o código faz nem o que o conteúdo
publica; svelte e angular não têm a linha.

## 10. Reconstruir do zero

Ordem: folha → primitivo → subpeça do contador → stories → docs page.

- **Comece pelo trio de vars da raiz** (`--badge-bg`, `--badge-fg`,
  `--badge-border`) e faça cada variante reapontar só a terceira (D1). Quem pintar
  `background-color` na variante devolve o preenchimento e derruba C2 e C8 juntos.
- **2px, nunca 1** (D2), e **token, nunca literal de cor** (D4).
- **`info` lê a hairline neutra** (D6) — a simetria de nomes é a armadilha, e é o
  que as plays das cinco reprovam.
- **O contador é filho, não opção** (D8), e é neutro (D5).
- **Nada de `height`** (D11): a altura sai de `padding-block` + `line-height`.
- **A raiz é `<span>`** nas cinco. Em lib que renderiza `div` por padrão, o
  default tem de ser calculado e continuar sobrescritível — e a prop de elemento
  precisa sair do repasse delegado, senão ela reinjeta `undefined` depois do
  default.
- **Armadilha por stack**: no react o `data-slot` sai do `state` do `useRender`;
  no vue a prop de variante sem default deixa `data-variant` de fora (V1); no
  svelte o `restProps` entra depois do `class`, então a ordem importa; no vanilla o
  alias legado `text` tem 14 consumidores vivos e não pode ser removido em
  silêncio; no angular o `data-slot` estático precisa ser lido na construção,
  porque o host binding o apagaria.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, variantes, anéis, contador | `docs/shared/styles/nds/badge.css` |
| texto, props, tokens, critérios de teste | `docs/shared/content/badge/translations.json` |
| prioridade da tabela de testes → variante | `docs/shared/primitives/badge-priority.ts` |
| desenho e anotações | Figma, página `Badge` (conjunto `333-17`, docs `334-24`) |
| portões determinísticos | `node scripts/audit.mjs badge --json` |
| instrumento de tokens | `node scripts/tabela-tokens.mjs badge` |
| regra de CATEGORIA (feedback) | `nortear-design-system-<stack>/guidelines/07-feedback-components.md` |

**O comentário do link do Figma está velho**: `docs/shared/figma/design-links.ts`
descreve o variant set como "eixo único `variant` (default, secondary,
destructive, outline)" — duas das quatro saíram do sistema (D7), e `warning`,
`success` e `info` não aparecem.

**Duas afirmações do conteúdo compartilhado contradizem as cinco stacks**, e as
duas dizem `<div>`: `accessibility.item1` ("Badge é um `<div>` sem foco nem
tabindex") e `notes.tip3` ("em vez de adicionar `onClick` no `<div>`"). A raiz é
`<span>` nas cinco desde antes desta escrita, e o Playground das cinco mede
exatamente isso (C1). É o resíduo da época em que o vue renderizava `div`.

**A guideline do svelte contradiz a folha sobre o piso da `warning`**: ela diz que
"a `warning` e a `info` ficam abaixo dele de propósito", e a folha mede a warning
em 4.66:1 no claro e 5.22:1 no escuro — acima do piso —, com a própria story
daquela stack cobrando `BORDER_FLOOR` da warning e isentando só a `info` (D3).

**A migração do catálogo FECHOU em 2026-09-13**, no mesmo dia em que este PRD
nasceu: a regra da categoria virou [`19-feedback.md`](../guidelines/19-feedback.md),
o catálogo do Badge ficou aqui, e as cópias de react, vue e svelte deixaram de
existir — nada nelas era daquela stack. O vanilla e o Angular mantêm um arquivo
curto com a mecânica própria, e é lá que ficou a regra de que a etiqueta não é o
elemento interativo: `createBadge` dentro de um `<button>`, sem ouvinte no elemento
devolvido pela fábrica.

> **PENDÊNCIA · 2026-09-13** — react, vue e vanilla publicam 6 dos 7 itens
> funcionais e 4 dos 6 visuais, porque a lista é literal na página; svelte lista
> todos à mão e o angular deriva do dicionário. O item que some é justamente o
> `functional.item7`, que é o contrato C2/C6.
> **Fecha quando**: `lista_mais_curta_que_o_conteudo` não reportar badge.

> **PENDÊNCIA · 2026-09-13** — a anatomia compartilhada publica `ndsBadgeIcon`,
> atributo que a stack Angular não declara: quem copiar o snippet recebe markup
> que não compila. A story usa `ndsButtonIcon`.
> **Fecha quando**: `angular_anatomy_seletor_inexistente` não reportar badge.

> **PENDÊNCIA · 2026-09-13** — o Angular tem um construtor de snippet só, sem
> teste, e os quatro stories de variantes e composições publicam o template da
> story no painel Code, que é a única parte da página feita para ser copiada.
> **Fecha quando**: `source_sem_teste` e `story_file_sem_transform` não reportarem
> badge.

> **PENDÊNCIA · 2026-09-13** — a demonstração usa conjuntos diferentes de rótulos:
> o svelte acrescenta `tagLabel` (e perde a variante `success`), o angular
> acrescenta `categoryLabel`, e react, vue e vanilla escrevem o rótulo do gatilho
> literal em vez de ler a chave publicada (V9, V10).
> **Fecha quando**: `demonstration_labels_divergent` não reportar badge.

**FECHADA em 2026-09-13**: a dona decidiu REMOVER o `badge_click` em vez de
disparar nas cinco. Saiu do tipo das cinco stacks, do call site do react, das cinco
tabelas de analytics e do conteúdo compartilhado, com a descrição da seção
reescrita nos três idiomas para dizer que o clique é do botão. Ver §9.

> **PENDÊNCIA · 2026-09-13** — sem variante explícita o Vue não emite
> `data-variant`, e as outras quatro emitem `default` (V1). Há duas instâncias
> vivas na demonstração da própria docs page daquela stack.
> **Fecha quando**: o primitivo do vue passar a ter default de variante, ou a
> divergência for aceita por escrito como API de framework.
