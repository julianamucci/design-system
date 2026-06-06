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

| Nome | Default | Função |
|---|---|---|
| `title` | — | Título no header |
| `description` | — | Descrição no header |
| `content` | — | Corpo (HTMLElement ou string) |
| `footer` | — | Rodapé com `border-t` |

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
ScrollArea (overflow-auto, border, rounded-md)
└── inner (padding em --spacing-4)
    └── content
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `height` | `288px` (72 × 4) | Altura máxima do container |
| `content` | — | Conteúdo a ser rolado |

**Regras**:
- Altura múltipla de 8 (8-grid) — defaults sugeridos: 144, 240, 288, 384
- Padding interno fixo em `--spacing-4` (16px)
- Não usar `overflow: scroll` (scrollbar sempre visível) — usar `overflow: auto`
- Border opcional via token `border-border`

**Acessibilidade**:
- Conteúdo rolável deve ser alcançável por teclado (foco em elementos internos rola o container)
- Não capturar foco no wrapper — só nos elementos internos
