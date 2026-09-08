# PRD — HoverCard

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-06.
> Este documento descreve o que o código FAZ hoje. Se ele divergir do código, o
> defeito é dele — corrija aqui, nunca o código para bater com o texto.

## 1. Identidade

Cartão de apoio, mostrado no **hover e no foco** do gatilho, com conteúdo mais
longo que o de um Tooltip e ainda assim **de apoio**: quem depende dele para
concluir a tarefa precisa de outro lugar.

| vizinho | diferença que decide |
|---|---|
| Tooltip | texto curto, tem seta, não é alcançável com o ponteiro dentro |
| Popover | abre no CLIQUE e recebe foco; aceita conteúdo interativo |
| Dialog | interrompe a página |

A regra que separa este dos outros dois é a de conteúdo: **nada aqui pode ser a
única forma de chegar à informação**, e nada aqui pode ser ação destrutiva ou
submit — em touch não há caminho acessível até eles.

## 2. Contrato de comportamento

| # | o contrato | portão |
|---|---|---|
| C1 | Abre no hover do gatilho, depois da espera de abertura | play, nas cinco |
| C2 | Abre TAMBÉM no foco por Tab, sem exigir ponteiro | `accessibility.items.item1` — é o que WCAG 1.4.13 pede |
| C3 | Permanece aberto enquanto o ponteiro estiver sobre o CARTÃO: dá para o cursor viajar do gatilho até ele | `accessibility.items.item2` |
| C4 | `Escape` fecha | `accessibility.items.item3` — cláusula "dismissable" da 1.4.13 |
| C5 | O gatilho é DESCRITO pelo cartão via `aria-describedby`, e só enquanto o cartão existe | `accessibility.items.item5` |
| C6 | Renderiza em portal, fora da raiz da página | `notes.item2` |
| C7 | Sem espaço no `side` pedido, vira para o lado oposto | story de posicionamento |
| C8 | O conteúdo do cartão NÃO é o único caminho para a informação | `accessibility.items.item4` — julgamento, sem portão automático |

## 3. Decisões fixadas

### D1 · `aria-describedby`, nunca `aria-labelledby`

**Estado**: o gatilho é descrito pelo cartão, e a associação existe só com o
cartão aberto — ele só está no documento nesse intervalo.
**Por quê**: `aria-labelledby` trocaria o NOME do gatilho pelo texto do cartão. O
gatilho continua se chamando o que ele é; o cartão acrescenta descrição.

### D2 · As esperas são 600ms para abrir e 300ms para fechar

**Estado**: iguais nas cinco stacks, expostas como `openDelay`/`closeDelay`.
**Por quê**: a espera de abertura é o filtro natural contra hover de baixa
intenção — é ela que evita que passar o mouse por cima conte como engajamento.
**Orientação registrada**: para previews ricos, 300–500ms; abaixo disso o cartão
passa a abrir quando ninguém pediu.

### D3 · A largura é custom property, com o default em `:root`

**Fixada em** 2026-08-17 (`80d9e7722`).
**Estado**: `--hover-card-width: 20rem` (320px) declarado em `:root`; o painel lê
`var(--hover-card-width, 20rem)`.
**Medição**: enquanto o valor morava só no fallback, o token não existia para quem
varre o CSS à procura de declaração — gancho real de customização, invisível ao
leitor. E o lugar da declaração é `:root` porque valor declarado no seletor da
própria peça vence por especificidade e APAGA o override de quem consome.

### D4 · Teto percentual não vale neste painel

**Fixada em** 2026-08-21 (`186d2dfdf`).
**Medição**: a família `nds-w-*` carrega `max-width: 100%` para não transbordar o
pai — e aqui o pai é o invólucro de posicionamento, com largura **zero**. Uma
porcentagem de zero é zero: `nds-w-md` no painel o derrubava de 448px para 34px,
o mínimo do texto. Medido: `pai=nds-hover-card-positioner:0`.
**Forma da correção**: a classe REPETIDA (`.nds-hover-card-content.nds-hover-card-content`)
leva a (0,2,0) e vence a utilitária sem `!important`. E **sem seletor de
ancestral**: `.nds-hover-card-positioner` só existe na marcação do React e do
Angular — as outras três montam o painel sem esse invólucro nomeado e continuavam
colapsando. Regra que depende de ancestral vale onde o ancestral existe.
**Contraste**: o Popover não precisa disto, porque o positioner dele tem largura
de verdade.

### D5 · O casco é o contrato; o miolo é exemplo

**Estado**: `.nds-hover-card-content` declara superfície, borda, raio, padding e
largura — e **mais nada**. A folha inteira não tem `font-size`, não tem segunda
cor de texto e não tem `gap`.
**Consequência**: o que a story de referência usa para título e corpo
(`--text-control`, `--muted-foreground`, `--spacing-2` entre eles) é escolha do
exemplo, não do sistema. Quem compõe traz o próprio ritmo.
**Registrado também no Figma**, onde a anotação de tokens separava mal as duas
listas até 2026-09-07.

### D6 · A cadeia de `transform-origin` cita as três libs, e o nome do bits é `link-preview`

**Fixada em** 2026-09-06 (`30c62422d`).
**Medição**: sem o degrau do bits, só o Svelte perdia a origem direcional — o
cartão crescia do centro em vez de crescer do gatilho, em silêncio, porque
`center` é fallback válido.
**A armadilha do nome**: no bits o equivalente do hover-card **não se chama
hover-card**, é `link-preview` — o `hover-card-content.svelte` importa
`LinkPreview as HoverCardPrimitive`, e o nome sai de
`getFloatingContentCSSVars("link-preview")`. Escrever `--bits-hover-card-…` por
simetria com tooltip e popover produziria uma variável inexistente, e nada
reprovaria.

### D7 · Os eventos existem e o campo é `trigger_label`

**Fixada em** 2026-09-06 (`30c62422d`), corrigida na prosa em 2026-09-07 (`41e155bc3`).
**Medição**: a página anunciava `hover_card_open` e `hover_card_close` como
"eventos relevantes"; nenhum dos dois existia em `AnalyticsEvents` e nenhum
preview vivo disparava evento algum. O portão não via porque cobrava
`analytics.table.*`, e este componente anuncia em PROSA.
**Correção de payload junto**: o conteúdo pedia `label` como "texto do trigger", e
texto traduzido parte o mesmo evento em um valor por idioma no GA4.

## 4. Anatomia

```
hover-card                    (raiz — só estado)
└── hover-card-trigger        aria-describedby aponta para o cartão enquanto ele existe
    └── hover-card-positioner (existe na marcação de react e angular; as outras três não o nomeiam)
        └── hover-card-content  a caixa — CASCO, ver D5
            └── [conteúdo arbitrário]
```

**O que é obrigatório**: `hover-card-content`. O título e o corpo do exemplo de
referência **não são partes do componente** — a story preenche o cartão com um
perfil inteiro, e as composições publicadas trazem cartão de link e cartão de
métrica.

## 5. Geometria e tokens

Fonte: `docs/shared/styles/nds/hover-card.css` — dezesseis declarações, e a
lista abaixo é toda ela.

| propriedade | valor | token |
|---|---|---|
| largura | 320px | `--hover-card-width`, default em `:root` — ver D3 |
| teto de largura | `none` | por regra própria — ver D4 |
| padding | 16px | `--spacing-4` |
| superfície | — | `--popover` |
| texto | — | `--popover-foreground` |
| borda | 1px | `--border` |
| raio | — | `--radius` |
| sombra | — | `--elevation-xl` |
| camada | — | `--z-popover` |

**A sombra é `xl`**, a mesma do Tooltip e mais alta que a do Popover (`md`): é um
painel que flutua sobre o texto, não um painel de trabalho.

**Animação**: só a saída anima (`data-ending-style`), pelo mesmo motivo do
Popover — evitar corrida entre opacidade zero na entrada e checagem síncrona de
visibilidade.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | conteúdo fora do documento |
| Opening | hover ou foco, durante a espera | nada visível ainda — a espera É o estado |
| Open | espera cumprida | cartão montado; `aria-describedby` ativo |
| Closing | ponteiro sai, durante a espera de fechamento | cartão ainda montado |
| Transitioning | saída | opacidade e escala até a transição terminar |

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `openDelay` | number | `600` |
| `closeDelay` | number | `300` |
| `side` | `top \| right \| bottom \| left` | `bottom` |
| `align` | `start \| center \| end` | `center` |

`side` e `align` moram no Content, não na raiz.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| svelte | a lib é `LinkPreview`, não `HoverCard`; `defaultOpen` não existe nela e é implementado no wrapper — registrado em `PATCHES.md#svelte-hovercard-defaultopen` |
| vanilla | fábrica `createHoverCard`, e ela ainda expõe `open`/`close` em vez dos verbos em inglês que o popover e o sidebar adotaram. Renomear é mudança de API pública e tem dono |
| react, angular | montam o `hover-card-positioner` nomeado; vue, svelte e vanilla não |

### Peças, por stack

Migrado das guidelines de catálogo em 2026-09-07, e extraído dos exports e dos
seletores do código — não transcrito da guideline, que é a fonte aposentada.

| stack | peças |
|---|---|
| react | `HoverCard`, `HoverCardContent`, `HoverCardTrigger` |
| vue | `HoverCard`, `HoverCardContent`, `HoverCardTrigger` |
| svelte | `HoverCard`, `HoverCardContent`, `HoverCardPortal`, `HoverCardTrigger` |
| vanilla | `createHoverCard` |
| angular | `a[ndsHoverCardTrigger], button[ndsHoverCardTrigger]`, `ng-template[ndsHoverCardContent]`, `span[ndsHoverCard]` |

O índice do svelte também reexporta as formas curtas — `Content`, `Portal`, `Root`, `Trigger` —,
para quem importa o namespace inteiro. As stories usam a forma longa.

No Angular o SELETOR carrega o elemento, e isso é contrato: trocar a tag muda a
semântica, não só o estilo.

Este componente **não tem título de cabeçalho**, então não há seletor `h2[…]`
nem `h3[…]` aqui — a nota de nível de cabeçalho vale para dialog, sheet, drawer
e alert-dialog, que são os que nomeiam o painel com um cabeçalho.

## 8. Acessibilidade

**Atributos**: gatilho com `aria-describedby` apontando para o cartão enquanto ele
existe (D1). Nenhum `role` de diálogo — este painel não é diálogo.

**Teclado**: Tab no gatilho abre; Escape fecha. Não há foco dentro do cartão, e é
por isso que ele não pode guardar ação.

**O que NÃO se faz, de propósito:**

- não se põe ação destrutiva nem submit dentro do cartão — em touch não há
  caminho acessível até eles;
- não se usa `aria-labelledby` — trocaria o nome do gatilho (D1);
- não se depende do cartão como único caminho para a informação.

## 9. Analytics

| evento | quando | payload |
|---|---|---|
| `hover_card_open` | o cartão abre | `{ component: "hover-card", trigger_label, location }` |
| `hover_card_close` | o cartão fecha | `{ component: "hover-card", trigger_label, location }` |

`trigger_label` é id estável em kebab-case, igual nas cinco, **nunca** o texto do
gatilho traduzido — ver D7. A espera de abertura serve de filtro contra hover de
baixa intenção, então não há necessidade de filtrar de novo no consumidor.

## 10. Reconstruir do zero

Ordem: folha → primitivo → stories → docs page.

- **svelte (`bits-ui`)** — o componente se chama `LinkPreview`. Isso contamina
  dois pontos: o import e o nome da custom property de origem (D6).
- **react (`base-ui`) e angular (`radix-ng`)** — nomeiam o positioner; qualquer
  regra que dependa dele vale só nessas duas (D4).
- **vue (`reka-ui`)** — sem positioner nomeado.
- **vanilla** — sem lib: as duas esperas são timers próprios, e o cartão precisa
  ouvir `mouseenter` para cumprir C3.

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, tokens, largura e teto | `docs/shared/styles/nds/hover-card.css` |
| texto, props, critérios de teste | `docs/shared/content/hover-card/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `HoverCard` (componente `674:3`) |
| portões determinísticos | `node scripts/audit.mjs hover-card --json` |

**Pendência aberta, medida em 2026-09-07**: a docs page do Angular renderiza 3 dos
5 itens de `usage.guidelines` (`lista_mais_curta_que_o_conteudo`), e os três
arquivos de story do Angular não têm `transform` no painel Code
(`story_file_sem_transform`). Nenhuma das duas é do componente — são da página que
o documenta.
