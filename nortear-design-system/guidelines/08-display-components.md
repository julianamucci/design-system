# Display Components (Basecoat — Vanilla TypeScript)

---

## Avatar

**Propósito**: representação visual de um usuário (foto ou iniciais).

**Implementação**:
```ts
export interface AvatarOptions {
  src?: string;
  alt?: string;
  fallback: string; // iniciais ou texto curto
  size?: 'sm' | 'default' | 'lg'; // sm=6, default=10, lg=16 (unidades em rem * 4)
}

export function createAvatar({ src, alt, fallback, size = 'default' }: AvatarOptions): HTMLSpanElement {
  const sizeClass = { sm: 'h-6 w-6', default: 'h-10 w-10', lg: 'h-16 w-16' }[size];

  const wrapper = document.createElement('span');
  wrapper.className = cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClass);

  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt ?? fallback;
    img.className = 'aspect-square h-full w-full object-cover';
    img.addEventListener('error', () => {
      img.replaceWith(createFallback());
    });
    wrapper.appendChild(img);
  } else {
    wrapper.appendChild(createFallback());
  }

  function createFallback(): HTMLSpanElement {
    const fb = document.createElement('span');
    fb.className = 'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium';
    fb.textContent = fallback;
    if (!src && alt) fb.setAttribute('aria-label', alt);
    return fb;
  }

  return wrapper;
}
```

---

## Table

**Propósito**: dados tabulares com linhas e colunas.

**Implementação**:
```ts
export interface TableOptions {
  caption: string;
  captionHidden?: boolean;
  headers: string[];
  rows: string[][];
}

export function createTable({ caption, captionHidden = false, headers, rows }: TableOptions): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative w-full overflow-auto';

  const table = document.createElement('table');
  table.className = 'w-full caption-bottom text-sm';

  // Caption obrigatório
  const captionEl = document.createElement('caption');
  captionEl.textContent = caption;
  if (captionHidden) captionEl.className = 'sr-only';
  table.appendChild(captionEl);

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.className = '[&_tr]:border-b';
  headers.forEach((header) => {
    const th = document.createElement('th');
    th.scope = 'col'; // scope="col" obrigatório
    th.className = 'h-10 px-2 text-left align-middle font-medium text-muted-foreground';
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  tbody.className = '[&_tr:last-child]:border-0';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-border transition-colors hover:bg-muted/50';
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.className = 'p-2 align-middle';
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  wrapper.appendChild(table);
  return wrapper;
}
```

**Acessibilidade obrigatória**:
- `caption` obrigatório (pode ser `sr-only` via `captionHidden: true`)
- `scope="col"` em todo `<th>` de coluna

---

## Skeleton

Ver `07-feedback-components.md`.

---

## Chart

**Propósito**: visualização de dados numéricos.

**Stack**: usar `canvas` com a biblioteca de charts do projeto (ex: Chart.js).

```ts
export function createChart(canvasId: string, ariaLabel: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative';
  wrapper.setAttribute('aria-label', ariaLabel);

  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', ariaLabel);

  wrapper.appendChild(canvas);
  return wrapper;
}
```

**Acessibilidade**: sempre incluir alternativa textual (tabela ou `aria-describedby` com resumo dos dados).

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
