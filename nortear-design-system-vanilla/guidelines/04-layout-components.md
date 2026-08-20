# Layout Components (Nortear — Vanilla TypeScript)

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia (imagem, vídeo, iframe) independente do tamanho do container.

**API e exemplos**: `src/components/ui/aspect-ratio.ts` + stories + `AspectRatioDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
AspectRatio
└── child (img | video | iframe) — position: absolute; inset: 0; object-cover
```

**Ratios comuns**: `16/9`, `1`, `4/3`, `3/4`.

**Regras**:
- O container é `position: relative` com `padding-bottom` calculado por `(1 / ratio) * 100%`
- O child fica em `position: absolute; inset: 0` e ocupa 100% do container
- Não definir altura fixa no container — a razão é controlada por padding
- Tokens: usar utilitários `.nds-*` (`nds-object-cover`, `nds-w-full`, `nds-h-full`) quando disponíveis em `styles/components/utilities.css`; caso contrário, aplicar CSS inline com tokens (`width: 100%`, `height: 100%`, `object-fit: cover`). Margens externas via classes 8-grid (`--spacing-*`)

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
Card (bg-card text-card-foreground border-border rounded-lg shadow-sm)
├── CardHeader (opcional)
│   ├── CardTitle (h3)
│   └── CardDescription (p, text-muted-foreground)
├── CardContent (opcional)
└── CardFooter (opcional, border-t)
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
- Tokens obrigatórios: `bg-card text-card-foreground border-border`
- Padding interno fixo em `--spacing-6` (24px) — não criar variações ad-hoc
- 8-grid: `space-y-1.5` entre título e descrição, `p-6` em header/content/footer
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
Separator (<hr> | <div role="separator">)
└── (sem children)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `orientation` | `horizontal` | `horizontal` ou `vertical` |
| `decorative` | `false` | Adiciona `aria-hidden="true"` |

**Regras**:
- Horizontal: `h-px bg-border` + margem vertical em `--spacing-4`
- Vertical: `w-px bg-border` + `self-stretch` + margem horizontal em `--spacing-2`
- Sempre usar token `bg-border` — nunca cor literal
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
- Border opcional via token `border-border`

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
