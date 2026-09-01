# Layout Components (Nortear — Vanilla TypeScript)

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia (imagem, vídeo, iframe) independente do tamanho do container.

**API e exemplos**: `src/components/ui/aspect-ratio.ts` + stories + `AspectRatioDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
.nds-aspect-ratio (a razão vem da custom property --ratio)
└── child (img | video | iframe) — a folha já o põe em absolute/inset e 100%
```

**Ratios comuns**: `16/9`, `1`, `4/3`, `3/4`.

**Regras**:
- A razão é a propriedade CSS nativa `aspect-ratio`, lida da custom property `--ratio` no root. Não é o truque de `padding-bottom`: `aspect-ratio` respeita `min-height` e `max-height`, o truque não
- A razão entra pela opção da fábrica, que escreve `--ratio`. Custom property não é valor de design solto — é a entrada do componente
- O child não precisa de classe de posicionamento: `.nds-aspect-ratio > *` já resolve `position: absolute`, `inset: 0` e 100% nos dois eixos
- Não definir altura fixa no container — a altura é consequência da largura e da razão
- O recorte da imagem (`object-fit: cover`) é responsabilidade do elemento passado como conteúdo, não do wrapper. **Falta utilitária de `object-fit` no sistema** — enquanto não houver, o recorte vem da folha de quem consome, nunca de valor no call site

**Acessibilidade**:
- Imagem informativa: `alt` descritivo
- Imagem decorativa: `alt=""` + `aria-hidden="true"`
- Vídeo/iframe: `title` obrigatório

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado. Para containers sem borda ou sombra, usar `<div>` puro com tokens de espaçamento.

**API e exemplos**: `src/components/ui/card.ts` + stories + `CardDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
.nds-card (data-size opcional)
├── .nds-card-header (opcional)
│   ├── .nds-card-title (h3)
│   ├── .nds-card-description
│   └── .nds-card-action (opcional, encosta na 2ª coluna)
├── .nds-card-content (opcional)
└── .nds-card-footer (opcional)
```

**Opts da factory**:

O Card é composto por sub-fábricas (`createCardHeader`, `createCardTitle`, `createCardDescription`, `createCardAction`, `createCardContent`, `createCardFooter`), e não por um objeto com título e rodapé dentro.

| Nome | Default | Função |
|---|---|---|
| `size` | `'default'` | `default` ou `sm`. Sai como `data-size` na raiz e propaga padding e tipografia aos filhos pelo CSS |
| `class` | — | Classes adicionais |
| `className` | — | Apelido depreciado de `class`. Aceito para não quebrar chamador; `class` vence quando os dois vêm |

Sub-fábricas: todas aceitam `class` (e o mesmo apelido). `createCardTitle` aceita ainda `text` e `level` (1 a 6, padrão 3); `createCardDescription` aceita `text`.

**Regras**:
- A superfície é da folha: `.nds-card` lê `--card` e `--card-foreground`, e o contorno é um anel de 1px em `--foreground / 0.1` mais `--elevation-sm`. Não há classe de fundo a acrescentar, e o raio vem de `--radius-card` — nunca de uma utilitária de raio
- Padding interno em `--spacing-4` (16px), propagado do root aos filhos. `data-size="sm"` é o único degrau alternativo — não criar variações ad-hoc
- 8-grid: gap de `--spacing-1` (4px) entre título e descrição, `--spacing-4` (16px) entre os blocos do card
- Cartão dentro de cartão usa `.nds-card-nested`: o filho desconta o inset em vez de repetir o raio do pai
- Card clicável inteiro: usar `<a>` ou `<button>` como wrapper; nunca `<div>` com `onclick`
- Conteúdo aninhado herda tokens — não sobrescrever `color` em descendentes

**Acessibilidade**:
- Botões dentro do Card precisam de `aria-label` contextual com identificador (ex: nome do produto)
- Card como link: usar `<a>` semântico, não `tabindex` em `<div>`

---

## Separator

**Propósito**: divisor visual horizontal ou vertical entre seções ou itens.

**API e exemplos**: `src/components/ui/separator.ts` + stories + `SeparatorDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
.nds-separator (<hr> | <div role="separator">) — data-orientation, data-emphasis
└── (sem children)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `orientation` | `horizontal` | `horizontal` ou `vertical` |
| `decorative` | `false` | Adiciona `aria-hidden="true"` |

**Regras**:
- A orientação sai como `data-orientation="horizontal" | "vertical"` no elemento; `.nds-separator` resolve espessura, eixo e o esticar no eixo cruzado. Não há classe de altura, largura nem de alinhamento a acrescentar
- A cor vem do token `--border`, lido pela própria folha — nunca cor literal, nunca declaração no call site
- `data-emphasis="strong"` é o único degrau de reforço; peso fora dele não existe
- Divisor entre irmãos de uma lista é caso da folha do componente que os agrupa (o Accordion separa pelo `.nds-accordion-item`, o texto corrido pelo `.nds-divider`), não deste primitivo
- Decorativo (`aria-hidden="true"`) quando o separador é puramente visual

**Acessibilidade**:
- `role="separator"` + `aria-orientation` (quando semântico)
- `aria-hidden="true"` quando decorativo

---

## Scroll Area

**Propósito**: área com scroll customizado e altura limitada, mantendo aparência consistente entre navegadores.

**API e exemplos**: `src/components/ui/scroll-area.ts` + stories + `ScrollAreaDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
.nds-scroll-area (recorta, data-size resolve a altura)
└── .nds-scroll-area-viewport (overflow: auto, tabindex="0")
    └── children
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `size` | — | Degrau da escada de altura da janela (`xs`…`xl`), escrito em `data-size` no root |
| `width` | — | Largura do root; útil para rolagem horizontal |
| `label` | — | Nome acessível da região rolável |
| `class` | — | Classes `.nds-*` extras no root |
| `children` | — | Conteúdo a ser rolado, montado dentro do viewport |

**Regras**:
- A altura é **obrigatória** para haver rolagem, e vem da escada nomeada — nunca de um número escrito no call site. Os degraus são os tokens `--box-height-*`; uma medida fora deles vem da custom property `--box-height` no root
- O degrau mora no **root**: a folha resolve `block-size` ali, e o viewport é `height: 100%` por ela. Repetir a medida no viewport é declaração morta
- Não usar `overflow: scroll` (scrollbar sempre visível) — usar `overflow: auto`
- Contorno opcional lê o token `--border`, pela folha do componente que envolve a área

**Acessibilidade**:
- Conteúdo rolável deve ser alcançável por teclado (foco em elementos internos rola o container)
- Não capturar foco no wrapper — só nos elementos internos


## Resizable

**Propósito**: painéis com divisória arrastável, para quem consome ajustar a
proporção da área de trabalho.

**Stack**: factory `createResizablePanel(opts)` em `src/components/ui/resizable.ts`.
Sem lib: o arraste, o teclado e o limite de cada painel são desta fábrica.

**Estrutura**:

```
[data-slot="resizable-panel-group"]        (eixo do arraste)
├── [data-slot="resizable-panel"]
├── [data-slot="resizable-handle"]         (role="separator", focável)
└── [data-slot="resizable-panel"]
```

**Opções do grupo**:

| Opção | Tipo | Função |
|---|---|---|
| `panels` | `ResizablePanel[]` | Painéis, em ordem. Os divisores são implícitos: um entre cada par |
| `direction` | `'horizontal' \| 'vertical'` | Eixo do arraste. Default `horizontal` |
| `withHandle` | `boolean` | Mostra o pegador visual centralizado no divisor |
| `aria-label` | `string \| string[]` | **Obrigatório.** Nome dos divisores — ver Acessibilidade |

**Opções de cada painel**:

| Opção | Tipo | Função |
|---|---|---|
| `content` | `HTMLElement` | Conteúdo do painel |
| `defaultSize` | `number` | Proporção inicial em % do grupo. Sem valor, o espaço se divide igualmente |
| `minSize` | `number` | Mínimo em % — é o que impede o painel de sumir |
| `maxSize` | `number` | Máximo em % |

**Regras**:
- Os divisores não são elementos que quem consome receba: eles nascem entre os
  painéis. Configuração de divisor entra pelo grupo, nunca por percurso no DOM
  depois de construir — num grupo aninhado esse percurso alcança também os
  divisores do grupo de dentro.
- `minSize` em todo painel que possa ficar vazio. Sem ele o arraste leva o painel
  a zero e o conteúdo fica inalcançável sem desfazer.
- A altura do grupo é responsabilidade de quem o coloca na página. Nas docs e nas
  stories isso é andaime, e usa `.nds-demo-box` com `data-min` — piso, e não
  altura fixa, porque um painel que se redimensiona brigaria com moldura travada.
- A fábrica NÃO persiste a proporção entre sessões e NÃO emite callback de layout.
  Quem precisa disso observa as mudanças por fora.

**Acessibilidade**:
- Divisor é `role="separator"` com `aria-orientation` e é focável — sem foco não
  há como redimensionar por teclado (WCAG 2.1.1).
- **O nome do divisor é obrigatório.** Sem ele o leitor de tela anuncia apenas
  "separador, 30", e não há como saber o que aquele número redimensiona. Uma
  string nomeia todos os divisores do grupo; um array nomeia um a um, que é o que
  um grupo de três painéis ou mais exige — dois separadores homônimos são dois
  controles indistinguíveis na lista do leitor (WCAG 4.1.2).
- `aria-valuenow` acompanha a proporção do painel anterior ao divisor, para que o
  valor anunciado corresponda ao que a seta muda.
