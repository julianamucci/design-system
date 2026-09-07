# PRD — Tooltip

> **Estado descrito**: 2026-09-07. **Revisão serial fechada em** 2026-09-06.
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
| sombra | — | `--elevation-xl` |
| camada | — | `--z-tooltip` |
| seta | 10×5px | **literais** — base e altura do triângulo |

**Animação**: só a saída anima (opacidade e `scale(0.95)`), pelo mesmo motivo do
popover e do hover-card.

## 6. Estados

| estado | quando ocorre | o que muda |
|---|---|---|
| Closed | inicial | balão fora do documento |
| Opening | hover, durante o atraso do provedor | nada visível |
| Open | atraso cumprido, ou foco por Tab | balão montado, seta apontando o gatilho |
| Transitioning | saída | opacidade e escala até terminar |

Não há estado de foco DENTRO do balão: ele não recebe foco (C6).

## 7. API

| prop | tipo | padrão |
|---|---|---|
| `delay` | number | `0` — no provedor |
| `open` | boolean | — |
| `defaultOpen` | boolean | `false` |
| `onOpenChange` | `(open: boolean) => void` | — |
| `side` | `top \| right \| bottom \| left` | `top` |
| `align` | `start \| center \| end` | `center` |
| `sideOffset` | number | `4` |

Repare no `side`: o padrão aqui é `top`, e no popover é `bottom`. Rótulo nasce
acima do que ele descreve; painel nasce abaixo do que o abriu.

### Divergências de forma, registradas

| stack | como difere |
|---|---|
| vanilla | fábrica `createTooltip`, com `onShow` disparado na exibição REAL — registrado em `PATCHES.md#vanilla-tooltip-onshow`, e existe para o evento não depender de duplicar o timer privado da fábrica |
| react, angular | nomeiam o positioner; vue e svelte usam wrapper anônimo da lib |
| angular | a lib projeta um `<svg>` dentro da seta (D3) |

## 8. Acessibilidade

**Atributos**: `role="tooltip"` no balão; `aria-describedby` no gatilho.

**Teclado**: o foco no gatilho abre sem atraso; Escape fecha e o foco fica onde
está. O balão não entra na ordem de tabulação.

**O que NÃO se faz, de propósito:**

- nada clicável dentro — para isso existem Popover e HoverCard;
- o tooltip não substitui o nome acessível de um botão só de ícone: o
  `aria-label` é obrigatório no botão, e o balão é complemento;
- em touch não há hover, então nenhuma informação essencial mora aqui.

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

## 11. Onde está a verdade

| assunto | arquivo |
|---|---|
| geometria, seta, posicionamento | `docs/shared/styles/nds/tooltip.css` |
| texto, props, critérios de teste | `docs/shared/content/tooltip/translations.json` |
| divergências intencionais sobre libs | `PATCHES.md` |
| desenho e anotações | Figma, página `Tooltip` (conjunto `662:14`) |
| portões determinísticos | `node scripts/audit.mjs tooltip --json` |
