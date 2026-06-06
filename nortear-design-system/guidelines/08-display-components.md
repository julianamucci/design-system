# Display Components (Nortear — Vanilla TypeScript)

---

## Avatar

**Propósito**: representação visual de um usuário (foto ou iniciais como fallback).

**API e exemplos**: `src/components/ui/avatar.ts` + stories + `AvatarDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
span wrapper (relative, rounded-full, overflow-hidden)
├── img (quando src + onload OK)
└── fallback (span com iniciais, bg-muted)
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `src` | — | URL da imagem |
| `alt` | — | Texto alternativo |
| `fallback` | — | Iniciais (obrigatório) |
| `size` | `default` | `sm` (24px), `default` (40px), `lg` (64px) |

**Regras**:
- Sempre `rounded-full` + `overflow-hidden`
- Tamanhos múltiplos de 8 (8-grid): 24, 40, 64
- Fallback obrigatório mesmo quando `src` existe — exibido se a imagem falhar (`onerror`)
- Imagem em `object-cover` para preservar proporção
- Tokens: `bg-muted text-muted-foreground` no fallback

**Acessibilidade**:
- `alt` descritivo na `<img>` (nome do usuário)
- Fallback decorativo: `aria-label` com nome quando apenas iniciais visíveis

---

## Table

**Propósito**: dados tabulares estáticos com linhas e colunas. Para tabelas com ordenação, filtros, paginação ou edição inline, usar **DataTable**.

**API e exemplos**: `src/components/ui/table.ts` + stories + `TableDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div wrapper (overflow-auto)
└── table
    ├── caption (obrigatório, sr-only se captionHidden)
    ├── thead
    │   └── tr
    │       └── th scope="col" (texto da coluna)
    └── tbody
        └── tr (hover:bg-muted/50, border-b)
            └── td
```

**Opts da factory**:

| Nome | Default | Função |
|---|---|---|
| `caption` | — | Descrição da tabela (obrigatório) |
| `captionHidden` | `false` | Aplica `sr-only` no caption |
| `headers` | — | Cabeçalhos das colunas |
| `rows` | — | Array de arrays (células) |

**Regras**:
- `<caption>` obrigatório (pode ser `sr-only` via `captionHidden: true`)
- `scope="col"` em todo `<th>` de coluna
- Padding em `--spacing-2` por célula; cabeçalho com altura em `--spacing-10`
- Wrapper com `overflow-auto` para responsividade horizontal
- Última linha sem border-bottom (`[&_tr:last-child]:border-0`)
- Tokens: `text-muted-foreground` no cabeçalho; corpo em `text-foreground`

**Acessibilidade**:
- `<caption>` obrigatório
- `scope="col"` em headers de coluna; `scope="row"` se houver headers de linha
- Para tabelas de layout, prefira CSS Grid — `<table>` é apenas para dados

---

## Skeleton

Ver `07-feedback-components.md`.

---

## Chart

**Propósito**: visualização de dados numéricos (linhas, barras, pizza). Stack: `<canvas>` com biblioteca de charts do projeto (Chart.js).

**API e exemplos**: `src/components/ui/chart.ts` + stories + `ChartDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Estrutura**:

```
div wrapper (relative, aria-label contextual)
└── canvas (role="img", aria-label, id único)
```

**Regras**:
- Canvas com `role="img"` + `aria-label` descritivo dos dados
- Sempre incluir alternativa textual — `<table>` oculto via `sr-only` ou `aria-describedby` apontando a um resumo
- Cores via tokens semânticos (`--chart-1` … `--chart-5`); nunca cor literal
- Não usar cor como único diferenciador entre séries — adicionar pattern/dash/marker
- Tooltip do chart deve respeitar tokens `bg-popover text-popover-foreground`
- Altura mínima de `--spacing-48` (192px); largura responsiva

**Acessibilidade**:
- Alternativa textual obrigatória (tabela oculta ou resumo descritivo)
- `aria-label` no canvas com sumário ("Vendas mensais de janeiro a dezembro de 2025")
- Contraste 3:1 entre séries adjacentes

**Analytics**: emitir `chart_interaction` com `{ chart_type, action }` (hover, click, legend toggle).

---

## DataTable

**Propósito**: tabela avançada para datasets que exigem interação — ordenação, filtros, seleção, paginação, redimensionamento, reordenação, fixação, edição inline e virtualização.

**Stack**: factory `createDataTable<TData>(opts)` em `src/components/ui/data-table.ts` sobre **`@tanstack/table-core`** v8 (engine headless) + **`@tanstack/virtual-core`**. Renderiza HTML semântico via DOM nativo reusando o factory `createTable` do design system para preservar tokens 8-grid e a11y.

**API e exemplos**: `src/components/ui/data-table.ts` + stories + `DataTableDocs.ts` (renderizada na aba Docs do Storybook). Esta guideline cobre apenas decisões e regras.

**Flags principais** (todas opcionais): `enableGlobalFilter` (default `true`), `enableColumnVisibility` (default `true`), `enableColumnFilters`, `enableRowSelection`, `enableColumnResizing`, `enableColumnOrdering`, `enableColumnPinning`, `enablePagination` (default `true`), `virtualized` (desliga paginação).

**`ColumnMeta` (Nortear)**:

| Chave | Tipo | Função |
|---|---|---|
| `filter` | `{ type: 'text' \| 'select'; options?: string[] }` | Input/select por coluna |
| `editable` | `boolean` | Marca a coluna como editável inline |
| `renderCell` | `(ctx) => HTMLElement \| string` | DOM nativo para markup rico (badges, ícones, links). Sem JSX/snippets na stack vanilla |
| `cellClass` | `string` | Classes extras no `<td>` |

**i18n**: o factory aceita uma opção `labels` para sobrescrever todas as strings (Colunas, Linhas por página, Página, de, Primeira/Anterior/Próxima/Última página, etc.). Sem `labels`, defaults em pt-BR. As docs pages passam `t('demonstration.labels.*')` para refletir o locale ativo.

**Regras**:
- Defina `columns` em escopo de módulo ou memoize — recriar zera o estado da engine
- `enableRowSelection` apenas quando houver ação em lote — checkbox sem ação confunde
- Para resize/reorder, defina `size` inicial na column def — sem isso o cabeçalho usa largura automática
- Selects de filtro recebem `filterFn: 'equals'` automaticamente; texto usa `includesString`
- Tokens 8-grid obrigatórios em CSS — `--spacing-1/2/4/6/8/10/24`. Off-grid (3, 5, 7, 9) são bugs
- Estilos em `src/styles/components/data-table.css` registrado em `globals.css` — classes `.nds-data-table-*`
- `data` nunca é mutado pelo componente — para edição inline, atualize o array externamente no handler de `onCellEdit`
- Para markup rico, use `meta.renderCell` retornando `HTMLElement` (preferido) ou `string` (escape automático)
- `virtualized` e `enablePagination` são mutuamente exclusivos; virtualização desativa paginação

**Acessibilidade**:
- HTML semântico real (`<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`)
- `aria-sort` no `<th>` ordenável (`ascending` / `descending` / `none`)
- `aria-label` contextual em todos os botões via `labels.sortBy(col)`, `labels.filter(col)`, etc.
- Checkbox de cabeçalho com `indeterminate` em seleção parcial (tri-state)
- Handle de resize: `role="separator"` + `aria-orientation="vertical"`
- Estado vazio é uma linha com mensagem — nunca tabela vazia silenciosa
