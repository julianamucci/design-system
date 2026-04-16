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
