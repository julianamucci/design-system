# Display Components

---

## Avatar

**Propósito**: representação visual de um usuário ou entidade (foto, iniciais, ícone).

**API e exemplos**: `src/components/ui/avatar/avatar.svelte` + stories + `AvatarDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Avatar (class="h-X w-X")
├── AvatarImage (src, alt)
└── AvatarFallback (iniciais ou aria-label)
```

**Regras**:
- `AvatarImage`: `alt` obrigatório e descritivo
- `AvatarFallback`: iniciais do nome ou `aria-label` descritivo
- Tamanho: via `class="h-X w-X"` — **nunca** prop `size` (não existe)
- Fallback é obrigatório sempre que houver `AvatarImage`

---

## Carousel

**Propósito**: galeria horizontal de itens com navegação por slides.

**API e exemplos**: `src/components/ui/carousel/carousel.svelte` + stories + `CarouselDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Carousel (aria-label)
├── CarouselContent
│   └── CarouselItem (basis-1/N)
├── CarouselPrevious (aria-label)
└── CarouselNext (aria-label)
```

**Acessibilidade**:
- `aria-label` descritivo no `<Carousel>`
- `aria-label` nos botões de navegação
- `motion-reduce:animate-none` em animações personalizadas

---

## Table

**Propósito**: dados tabulares com linhas e colunas — apresentação estática, sem interação. Para datasets interativos, usar **DataTable**.

**API e exemplos**: `src/components/ui/table/table.svelte` + stories + `TableDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
Table
├── TableCaption (sr-only se necessário, sempre presente)
├── TableHeader
│   └── TableRow
│       └── TableHead (scope="col")
└── TableBody
    └── TableRow
        └── TableCell
```

**Acessibilidade obrigatória**:
- `TableCaption` em toda tabela (pode ser `sr-only`)
- `scope="col"` em todo `TableHead` de coluna
- `scope="row"` em `TableHead` de linha (quando aplicável)

---

## Chart

**Propósito**: visualização de dados numéricos (barras, linhas, pizza).

**API e exemplos**: `src/components/ui/chart/` + stories + `ChartDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Stack**: biblioteca de charts configurada no projeto (ex.: Chart.js via adapter).

**Acessibilidade**:
- `aria-label` descritivo no container do chart
- Alternativa textual obrigatória (tabela de dados ou descrição via `aria-describedby`)
- Cores nunca são o único diferenciador — usar padrões (pattern, labels, legenda)

---

## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização.

**Stack**: construída sobre **`@tanstack/table-core`** (engine headless v8) + **`@tanstack/svelte-virtual`**. Não usa o adapter `@tanstack/svelte-table` (incompatível com Svelte 5); um wrapper local em `data-table.svelte` consome `createTable` direto e expõe state via runes (`$state`).

**API e exemplos**: `src/components/ui/data-table/data-table.svelte` + stories + `DataTableDocs.svelte` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Flags principais**: `enableGlobalFilter` (default `true`), `enableColumnVisibility` (default `true`), `enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`, `enableColumnOrdering`, `enableColumnPinning`, `enablePagination` (default `true`), `virtualized` (desliga paginação).

**`ColumnMeta` (Svelte-only)**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[] }` | Input/select por coluna |
| `editable` | `boolean` | Marca a coluna como editável inline |
| `format` | `(value, row) => string` | Formata o texto da célula (sem JSX/snippet) |
| `badgeVariant` | `(value, row) => 'default' \| 'secondary' \| 'destructive' \| 'outline'` | Envolve a célula em `<Badge>` com a variant retornada — substituto do `cell` renderer das outras stacks |
| `cellClass` | `string` | Classes Tailwind extras no `<td>` |

**Regras**:
- Defina `columns` no top-level do `<script>` ou em `$derived` — recriar em cada update zera o estado da tabela
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática
- Selects de filtro recebem `filterFn: 'equals'` automaticamente; texto usa `includesString`
- Aplica `table-fixed` em `enableColumnResizing`, `enableColumnOrdering` ou `virtualized` — evita travamento em datasets grandes
- `data` nunca é mutado pelo componente — para edição inline, atualize o `$state` externamente no `onCellEdit`
- `virtualized` e `enablePagination` são mutuamente exclusivos; virtualização desativa paginação
- Para markup rico (ícones, links), use `meta.badgeVariant` ou `meta.cellClass`. `cell` Snippet ainda não é suportado pelo wrapper local

**Acessibilidade**:
- Tabela semântica via `<Table>` primitive — `<th>`, `<tr>`, `<td>` reais
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual obrigatório nos botões: "Ordenar por <em>coluna</em>", "Filtrar <em>coluna</em>", "Selecionar linha", "Próxima página"
- Checkbox de cabeçalho usa `indeterminate` em seleção parcial (tri-state)
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa

**Analytics**: passivo por padrão. Para rastrear interações, consuma a instância via `onTableReady` e instrumentaliza no caller.
