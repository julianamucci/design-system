// ─── DataTable — Vanilla TS factory sobre TanStack Table v8 (headless) ──────
//
// API espelha o componente React (data-table.tsx). Cada recurso é uma flag
// opcional. Suporta filtro global, filtros por coluna, seleção, paginação,
// redimensionamento, reordenação, fixação, edição inline e virtualização.

import {
  createTable as createTanstackTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/table-core';
import { Virtualizer, observeElementRect, observeElementOffset, elementScroll } from '@tanstack/virtual-core';

import {
  createTable as createTableWrapper,
  createTableHeader,
  createTableBody,
  createTableRow,
} from './table';
import { createCheckbox } from './checkbox';
import { createInput } from './input';
import { createButton } from './button';

// ─── Types ────────────────────────────────────────────────────────────────────

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
    editable?: boolean;
    headerLabel?: string;
    /** Renderiza conteúdo customizado para a célula (string ou HTMLElement). */
    renderCell?: (ctx: { value: unknown; row: TData; rowIndex: number }) => string | HTMLElement;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

export interface DataTableOptions<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enablePagination?: boolean;
  /** Ativa virtualização. Desativa paginação. */
  virtualized?: boolean;
  virtualRowHeight?: number;
  maxHeight?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  /** Labels e textos i18n. */
  labels?: Partial<DataTableLabels>;
  className?: string;
  onTableReady?: (table: TanstackTable<TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}

export interface DataTableLabels {
  columns: string;
  showColumns: string;
  selectAll: string;
  selectRow: string;
  sortBy: (col: string) => string;
  filter: (col: string) => string;
  pinLeft: (col: string) => string;
  unpin: (col: string) => string;
  resize: (col: string) => string;
  edit: (col: string) => string;
  rowsPerPage: string;
  page: string;
  pageOf: string;
  firstPage: string;
  prevPage: string;
  nextPage: string;
  lastPage: string;
  rowsTotal: (n: number) => string;
  rowsSelected: (s: number, n: number) => string;
  allOption: string;
}

const DEFAULT_LABELS: DataTableLabels = {
  columns: 'Colunas',
  showColumns: 'Exibir colunas',
  selectAll: 'Selecionar todas as linhas',
  selectRow: 'Selecionar linha',
  sortBy: (c) => `Ordenar por ${c}`,
  filter: (c) => `Filtrar ${c}`,
  pinLeft: (c) => `Fixar ${c} à esquerda`,
  unpin: (c) => `Desafixar ${c}`,
  resize: (c) => `Redimensionar coluna ${c}`,
  edit: (c) => `Editar ${c}`,
  rowsPerPage: 'Linhas por página',
  page: 'Página',
  pageOf: 'de',
  firstPage: 'Primeira página',
  prevPage: 'Página anterior',
  nextPage: 'Próxima página',
  lastPage: 'Última página',
  rowsTotal: (n) => `${n} linha(s).`,
  rowsSelected: (s, n) => `${s} de ${n} linha(s) selecionada(s).`,
  allOption: 'Todos',
};

// ─── Icons (SVG seguros — strings literais, sem variáveis dinâmicas) ──────────

const ICON_BASE_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const ICONS = {
  arrowUp: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>`,
  arrowDown: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
  arrowUpDown: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon nds-dt-icon-muted"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>`,
  chevronLeft: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="m9 18 6-6-6-6"/></svg>`,
  chevronsLeft: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>`,
  chevronsRight: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>`,
  grip: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon nds-dt-icon-grip"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>`,
  pin: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`,
  pinOff: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="M12 17v5"/><path d="M15 9.34V6h1a2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>`,
  search: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon nds-dt-icon-muted"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  settings: `<svg ${ICON_BASE_ATTRS} class="nds-dt-icon"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>`,
};

function svgEl(html: string): SVGSVGElement {
  const wrap = document.createElement('div');
  // PATCH: security — ICONS contém apenas strings literais constantes (sem dados do usuário).
  wrap.innerHTML = html;
  return wrap.firstElementChild as SVGSVGElement;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headerLabel<TData>(col: ColumnDef<TData>, fallback: string): string {
  if (col.meta?.headerLabel) return col.meta.headerLabel;
  if (typeof col.header === 'string') return col.header;
  return fallback;
}

function appendCellContent<TData>(
  td: HTMLTableCellElement,
  value: unknown,
  col: ColumnDef<TData>,
  row: TData,
  rowIndex: number,
): void {
  const meta = col.meta;
  if (meta?.renderCell) {
    const rendered = meta.renderCell({ value, row, rowIndex });
    if (typeof rendered === 'string') {
      td.textContent = rendered;
    } else {
      td.appendChild(rendered);
    }
    return;
  }
  td.textContent = value == null ? '' : String(value);
}

// ─── createDataTable ──────────────────────────────────────────────────────────

export function createDataTable<TData extends RowData>(
  options: DataTableOptions<TData>,
): HTMLElement {
  const {
    columns,
    data,
    enableGlobalFilter = true,
    globalFilterPlaceholder = 'Buscar...',
    enableRowSelection = false,
    enableColumnVisibility = true,
    enableColumnFilters = false,
    enableColumnResizing = false,
    enableColumnOrdering = false,
    enableColumnPinning = false,
    enablePagination = true,
    virtualized = false,
    virtualRowHeight = 36,
    maxHeight = '480px',
    pageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    emptyMessage = 'Sem resultados.',
    className,
    onTableReady,
    onCellEdit,
  } = options;

  const L: DataTableLabels = { ...DEFAULT_LABELS, ...(options.labels ?? {}) };

  // ── State (mantido no closure; passado ao TanStack via state + onChange) ──
  let sorting: SortingState = [];
  let columnFilters: ColumnFiltersState = [];
  let columnVisibility: VisibilityState = {};
  let rowSelection: RowSelectionState = {};
  let globalFilter = '';
  let columnOrder: ColumnOrderState = [];
  let columnPinning: ColumnPinningState = { left: [], right: [] };
  let columnSizing: ColumnSizingState = {};
  let pagination = { pageIndex: 0, pageSize };
  let draggedColumnId: string | null = null;

  // ── Coluna __select__ ────────────────────────────────────────────────────
  const allColumns: DataTableColumn<TData>[] = columns.map((c) => {
    if (c.meta?.filter?.type === 'select' && !('filterFn' in c)) {
      return { ...c, filterFn: 'equals' as const };
    }
    return c;
  });
  if (enableRowSelection) {
    const selectCol: DataTableColumn<TData> = {
      id: '__select__',
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 36,
    };
    allColumns.unshift(selectCol);
  }

  // ── Resolver updater (TanStack passa value OR updater(prev)) ─────────────
  function resolveUpdater<T>(prev: T, updater: Updater<T>): T {
    return typeof updater === 'function'
      ? (updater as (old: T) => T)(prev)
      : updater;
  }

  // ── Root + Refs ──────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.dataset.slot = 'data-table';
  root.className = 'nds-data-table';
  if (className) root.classList.add(...className.split(' ').filter(Boolean));

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.dataset.slot = 'data-table-toolbar';
  toolbar.className = 'nds-data-table-toolbar';

  // Scroll container
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'nds-data-table-scroll';
  if (virtualized) {
    scrollContainer.style.maxHeight = maxHeight;
    scrollContainer.style.overflowY = 'auto';
  }

  const { wrapper: tableWrapper, table: tableEl } = createTableWrapper();
  tableWrapper.classList.add('nds-data-table-table-wrapper');
  if (enableColumnResizing || enableColumnOrdering || virtualized) {
    tableEl.classList.add('nds-table-fixed');
  }

  const thead = createTableHeader();
  const tbody = createTableBody();
  tableEl.append(thead, tbody);
  scrollContainer.appendChild(tableWrapper);

  const pagFooter = document.createElement('div');
  pagFooter.dataset.slot = 'data-table-pagination';
  pagFooter.className = 'nds-data-table-pagination';

  root.append(toolbar, scrollContainer, pagFooter);

  // ── TanStack table instance ──────────────────────────────────────────────
  const table = createTanstackTable<TData>({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
      columnPinning,
      columnSizing,
      pagination,
    },
    enableRowSelection,
    enableColumnResizing,
    enableColumnPinning,
    columnResizeMode: 'onChange',
    onSortingChange: (u: Updater<SortingState>) => { sorting = resolveUpdater(sorting, u); sync(); rerender(); },
    onColumnFiltersChange: (u: Updater<ColumnFiltersState>) => { columnFilters = resolveUpdater(columnFilters, u); sync(); rerender(); },
    onColumnVisibilityChange: (u: Updater<VisibilityState>) => { columnVisibility = resolveUpdater(columnVisibility, u); sync(); rerender(); },
    onRowSelectionChange: (u: Updater<RowSelectionState>) => { rowSelection = resolveUpdater(rowSelection, u); sync(); rerender(); },
    onGlobalFilterChange: (u: Updater<string>) => { globalFilter = resolveUpdater(globalFilter, u); sync(); rerender(); },
    onColumnOrderChange: (u: Updater<ColumnOrderState>) => { columnOrder = resolveUpdater(columnOrder, u); sync(); rerender(); },
    onColumnPinningChange: (u: Updater<ColumnPinningState>) => { columnPinning = resolveUpdater(columnPinning, u); sync(); rerender(); },
    onColumnSizingChange: (u: Updater<ColumnSizingState>) => { columnSizing = resolveUpdater(columnSizing, u); sync(); rerender(); },
    onPaginationChange: (u: Updater<{ pageIndex: number; pageSize: number }>) => { pagination = resolveUpdater(pagination, u); sync(); rerender(); },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel:
      enablePagination && !virtualized ? getPaginationRowModel() : undefined,
    meta: {
      updateData: onCellEdit,
    },
    renderFallbackValue: null,
    onStateChange: () => {},
  } as Parameters<typeof createTanstackTable<TData>>[0]);

  function sync() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table.setOptions((prev: any) => ({
      ...prev,
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        globalFilter,
        columnOrder,
        columnPinning,
        columnSizing,
        pagination,
      },
    }));
  }

  // ── Virtualizer (opcional) ───────────────────────────────────────────────
  let virtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement> | null = null;
  if (virtualized) {
    virtualizer = new Virtualizer<HTMLDivElement, HTMLTableRowElement>({
      count: 0,
      getScrollElement: () => scrollContainer,
      estimateSize: () => virtualRowHeight,
      overscan: 10,
      observeElementRect,
      observeElementOffset,
      scrollToFn: elementScroll,
      onChange: () => rerenderBody(),
    });
    virtualizer._didMount();
    virtualizer._willUpdate();
  }

  // ── pinStyle helper ──────────────────────────────────────────────────────
  function pinStyle(col: ReturnType<typeof table.getColumn>): Partial<CSSStyleDeclaration> {
    if (!col) return {};
    const pinned = col.getIsPinned();
    if (!pinned) return {};
    return {
      position: 'sticky',
      left: pinned === 'left' ? `${col.getStart('left')}px` : '',
      right: pinned === 'right' ? `${col.getAfter('right')}px` : '',
      zIndex: '1',
      background: 'var(--background)',
    } as Partial<CSSStyleDeclaration>;
  }

  // ── Toolbar render ───────────────────────────────────────────────────────
  function renderToolbar() {
    toolbar.replaceChildren();
    if (!(enableGlobalFilter || enableColumnVisibility)) {
      toolbar.style.display = 'none';
      return;
    }
    toolbar.style.display = '';

    if (enableGlobalFilter) {
      const wrap = document.createElement('div');
      wrap.className = 'nds-data-table-search';
      wrap.appendChild(svgEl(ICONS.search));
      const input = createInput({
        type: 'search',
        placeholder: globalFilterPlaceholder,
        value: globalFilter,
        class: 'nds-data-table-search-input',
      });
      input.setAttribute('aria-label', globalFilterPlaceholder);
      input.addEventListener('input', () => {
        table.setGlobalFilter(input.value);
      });
      wrap.appendChild(input);
      toolbar.appendChild(wrap);
    }

    if (enableColumnVisibility) {
      const visBtn = createButton({
        variant: 'outline',
        size: 'sm',
        class: 'nds-data-table-columns-btn',
        ariaLabel: L.columns,
      });
      visBtn.appendChild(svgEl(ICONS.settings));
      const lbl = document.createElement('span');
      lbl.textContent = L.columns;
      visBtn.appendChild(lbl);

      const menu = document.createElement('div');
      menu.className = 'nds-data-table-columns-menu';
      menu.hidden = true;
      menu.setAttribute('role', 'menu');

      function rebuildMenu() {
        menu.replaceChildren();
        const header = document.createElement('div');
        header.className = 'nds-data-table-columns-menu-header';
        header.textContent = L.showColumns;
        menu.appendChild(header);

        for (const column of table.getAllLeafColumns()) {
          if (!column.getCanHide()) continue;
          const row = document.createElement('div');
          row.className = 'nds-data-table-columns-menu-row';

          const lbl = headerLabel(column.columnDef, column.id);
          const cb = createCheckbox({
            checked: column.getIsVisible(),
            'aria-label': lbl,
            onCheckedChange: (v) => column.toggleVisibility(!!v),
          });
          const text = document.createElement('span');
          text.className = 'nds-data-table-columns-menu-label';
          text.textContent = lbl;

          row.append(cb, text);

          if (enableColumnPinning) {
            const pinned = column.getIsPinned();
            const pinBtn = document.createElement('button');
            pinBtn.type = 'button';
            pinBtn.className = 'nds-data-table-pin-btn';
            if (pinned === 'left') pinBtn.classList.add('is-active');
            pinBtn.setAttribute(
              'aria-label',
              pinned === 'left' ? L.unpin(lbl) : L.pinLeft(lbl),
            );
            pinBtn.appendChild(svgEl(pinned === 'left' ? ICONS.pinOff : ICONS.pin));
            pinBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              column.pin(pinned === 'left' ? false : 'left');
            });
            row.appendChild(pinBtn);
          }
          menu.appendChild(row);
        }
      }

      visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        if (willOpen) rebuildMenu();
        menu.hidden = !willOpen;
      });
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target as Node) && e.target !== visBtn) {
          menu.hidden = true;
        }
      });

      const wrap = document.createElement('div');
      wrap.className = 'nds-data-table-columns-wrap';
      wrap.append(visBtn, menu);
      toolbar.appendChild(wrap);
    }
  }

  // ── Header render ────────────────────────────────────────────────────────
  function renderHeader() {
    thead.replaceChildren();
    for (const headerGroup of table.getHeaderGroups()) {
      const tr = createTableRow();
      for (const header of headerGroup.headers) {
        const col = header.column;
        const lbl = headerLabel(col.columnDef, col.id);
        const th = document.createElement('th');
        th.className = 'nds-data-table-th';
        th.scope = 'col';

        if (enableColumnResizing) th.style.width = `${header.getSize()}px`;
        const pin = pinStyle(col);
        Object.assign(th.style, pin);

        const isDraggable = enableColumnOrdering && col.id !== '__select__';
        if (isDraggable) {
          th.setAttribute('draggable', 'true');
          th.addEventListener('dragstart', () => { draggedColumnId = col.id; });
          th.addEventListener('dragover', (e) => e.preventDefault());
          th.addEventListener('drop', () => {
            if (!draggedColumnId || draggedColumnId === col.id) return;
            const current = columnOrder.length > 0
              ? columnOrder
              : table.getAllLeafColumns().map((c) => c.id);
            const next = [...current];
            const from = next.indexOf(draggedColumnId);
            const to = next.indexOf(col.id);
            if (from === -1 || to === -1) return;
            next.splice(from, 1);
            next.splice(to, 0, draggedColumnId);
            draggedColumnId = null;
            table.setColumnOrder(next);
          });
        }

        if (!header.isPlaceholder) {
          const inner = document.createElement('div');
          inner.className = 'nds-data-table-th-inner';

          if (isDraggable) inner.appendChild(svgEl(ICONS.grip));

          // Cabeçalho de seleção (tri-state)
          if (col.id === '__select__') {
            const isAll = table.getIsAllPageRowsSelected();
            const isSome = !isAll && table.getIsSomePageRowsSelected();
            const cb = createCheckbox({
              checked: isAll,
              'aria-label': L.selectAll,
              onCheckedChange: (v) => table.toggleAllPageRowsSelected(!!v),
            });
            if (isSome) cb.dataset.state = 'indeterminate';
            inner.appendChild(cb);
          } else if (col.getCanSort()) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nds-data-table-sort-btn';
            btn.setAttribute('aria-label', L.sortBy(lbl));
            const span = document.createElement('span');
            span.textContent = lbl;
            btn.appendChild(span);
            const dir = col.getIsSorted();
            const icon =
              dir === 'asc' ? ICONS.arrowUp :
              dir === 'desc' ? ICONS.arrowDown :
              ICONS.arrowUpDown;
            btn.appendChild(svgEl(icon));
            btn.addEventListener('click', (e) => {
              const handler = header.column.getToggleSortingHandler();
              handler?.(e);
            });
            if (dir === 'asc') th.setAttribute('aria-sort', 'ascending');
            else if (dir === 'desc') th.setAttribute('aria-sort', 'descending');
            inner.appendChild(btn);
          } else {
            const div = document.createElement('div');
            div.className = 'nds-data-table-th-label';
            div.textContent = lbl;
            inner.appendChild(div);
          }

          th.appendChild(inner);

          if (enableColumnResizing && col.getCanResize()) {
            const handle = document.createElement('div');
            handle.className = 'nds-data-table-resize-handle';
            try { if (col.getIsResizing()) handle.classList.add('is-resizing'); } catch { /* state not ready */ }
            handle.setAttribute('role', 'separator');
            handle.setAttribute('aria-orientation', 'vertical');
            handle.setAttribute('aria-label', L.resize(lbl));
            const mouseHandler = header.getResizeHandler();
            handle.addEventListener('mousedown', mouseHandler);
            handle.addEventListener('touchstart', mouseHandler);
            th.appendChild(handle);
          }
        }
        tr.appendChild(th);
      }
      thead.appendChild(tr);
    }

    // Column filters row
    const hasFilters = enableColumnFilters &&
      table.getAllLeafColumns().some((c) => !!c.columnDef.meta?.filter);
    if (hasFilters) {
      const tr = createTableRow();
      tr.classList.add('nds-data-table-filter-row');
      for (const header of table.getHeaderGroups()[0]?.headers ?? []) {
        const col = header.column;
        const th = document.createElement('th');
        Object.assign(th.style, pinStyle(col));
        const meta = col.columnDef.meta?.filter;
        if (!col.getCanFilter() || !meta) {
          // axe empty-table-header — colunas sem filtro recebem texto sr-only.
          const lblForA11y = headerLabel(col.columnDef, col.id);
          const sr = document.createElement('span');
          sr.className = 'nds-sr-only';
          sr.textContent = `Sem filtro para ${lblForA11y || 'esta coluna'}`;
          th.appendChild(sr);
        }
        if (col.getCanFilter() && meta) {
          const lbl = headerLabel(col.columnDef, col.id);
          if (meta.type === 'select') {
            const select = document.createElement('select');
            select.className = 'nds-data-table-filter-select';
            select.setAttribute('aria-label', L.filter(lbl));
            const optAll = document.createElement('option');
            optAll.value = '';
            optAll.textContent = L.allOption;
            select.appendChild(optAll);
            for (const opt of meta.options ?? []) {
              const o = document.createElement('option');
              o.value = opt;
              o.textContent = opt;
              if (col.getFilterValue() === opt) o.selected = true;
              select.appendChild(o);
            }
            select.addEventListener('change', () => {
              col.setFilterValue(select.value || undefined);
            });
            th.appendChild(select);
          } else {
            const input = createInput({
              placeholder: meta.placeholder ?? 'Filtrar...',
              value: (col.getFilterValue() as string) ?? '',
              class: 'nds-data-table-filter-input',
            });
            input.setAttribute('aria-label', L.filter(lbl));
            input.addEventListener('input', () => {
              col.setFilterValue(input.value);
            });
            th.appendChild(input);
          }
        }
        tr.appendChild(th);
      }
      thead.appendChild(tr);
    }
  }

  // ── Body render ──────────────────────────────────────────────────────────
  function buildRow(rowIdx: number, tanstackRow: ReturnType<typeof table.getRowModel>['rows'][number]): HTMLTableRowElement {
    const tr = createTableRow();
    tr.className = 'nds-data-table-tr';
    if (tanstackRow.getIsSelected()) tr.dataset.state = 'selected';

    for (const cell of tanstackRow.getVisibleCells()) {
      const col = cell.column;
      const td = document.createElement('td');
      td.className = 'nds-data-table-td';
      if (enableColumnResizing) td.style.width = `${col.getSize()}px`;
      Object.assign(td.style, pinStyle(col));

      if (col.id === '__select__') {
        const cb = createCheckbox({
          checked: tanstackRow.getIsSelected(),
          'aria-label': L.selectRow,
          onCheckedChange: (v) => tanstackRow.toggleSelected(!!v),
        });
        td.appendChild(cb);
      } else if (col.columnDef.meta?.editable) {
        const value = cell.getValue();
        const lbl = headerLabel(col.columnDef, col.id);
        td.appendChild(buildEditableCell(value, lbl, tanstackRow.index, col.id, col.columnDef));
      } else {
        appendCellContent(td, cell.getValue(), col.columnDef, tanstackRow.original, rowIdx);
      }
      tr.appendChild(td);
    }
    return tr;
  }

  function buildEditableCell<TVal>(
    initial: TVal,
    label: string,
    rowIndex: number,
    columnId: string,
    col: ColumnDef<TData>,
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'nds-data-table-editable';

    function renderView() {
      container.replaceChildren();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nds-data-table-edit-btn';
      btn.setAttribute('aria-label', L.edit(label));
      if (initial == null || initial === '') {
        const dash = document.createElement('span');
        dash.className = 'nds-text-muted-foreground';
        dash.textContent = '—';
        btn.appendChild(dash);
      } else if (col.meta?.renderCell) {
        const rendered = col.meta.renderCell({ value: initial, row: data[rowIndex], rowIndex });
        if (typeof rendered === 'string') btn.textContent = rendered;
        else btn.appendChild(rendered);
      } else {
        btn.textContent = String(initial);
      }
      btn.addEventListener('click', renderEdit);
      container.appendChild(btn);
    }

    function renderEdit() {
      container.replaceChildren();
      const input = createInput({
        value: initial == null ? '' : String(initial),
        class: 'nds-data-table-edit-input',
      });
      input.setAttribute('aria-label', L.edit(label));
      const commit = () => {
        const isNumber = typeof initial === 'number';
        const nextValue: unknown = isNumber ? Number(input.value) : input.value;
        table.options.meta?.updateData?.(rowIndex, columnId, nextValue);
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { renderView(); }
      });
      container.appendChild(input);
      input.focus();
      input.select();
    }

    renderView();
    return container;
  }

  function rerenderBody() {
    tbody.replaceChildren();
    const rows = table.getRowModel().rows;
    const visibleCount = table.getVisibleLeafColumns().length;

    if (rows.length === 0) {
      const tr = createTableRow();
      const td = document.createElement('td');
      td.colSpan = visibleCount;
      td.className = 'nds-data-table-empty';
      td.textContent = emptyMessage;
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    if (virtualized && virtualizer) {
      virtualizer.setOptions({
        count: rows.length,
        getScrollElement: () => scrollContainer,
        estimateSize: () => virtualRowHeight,
        overscan: 10,
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll,
        onChange: () => rerenderBody(),
      });
      const items = virtualizer.getVirtualItems();
      const totalSize = virtualizer.getTotalSize();
      const paddingTop = items.length > 0 ? items[0].start : 0;
      const paddingBottom = items.length > 0 ? totalSize - items[items.length - 1].end : 0;

      if (paddingTop > 0) {
        const pad = document.createElement('tr');
        pad.setAttribute('aria-hidden', 'true');
        const td = document.createElement('td');
        td.colSpan = visibleCount;
        td.style.height = `${paddingTop}px`;
        pad.appendChild(td);
        tbody.appendChild(pad);
      }
      for (const item of items) {
        const r = rows[item.index];
        if (r) tbody.appendChild(buildRow(item.index, r));
      }
      if (paddingBottom > 0) {
        const pad = document.createElement('tr');
        pad.setAttribute('aria-hidden', 'true');
        const td = document.createElement('td');
        td.colSpan = visibleCount;
        td.style.height = `${paddingBottom}px`;
        pad.appendChild(td);
        tbody.appendChild(pad);
      }
    } else {
      for (let i = 0; i < rows.length; i++) {
        tbody.appendChild(buildRow(i, rows[i]));
      }
    }
  }

  // ── Pagination render ────────────────────────────────────────────────────
  function renderPagination() {
    pagFooter.replaceChildren();
    if (!enablePagination || virtualized) {
      pagFooter.style.display = 'none';
      return;
    }
    pagFooter.style.display = '';

    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();
    const totalRows = table.getFilteredRowModel().rows.length;
    const selected = table.getFilteredSelectedRowModel().rows.length;

    const countText = document.createElement('div');
    countText.className = 'nds-data-table-pagination-count';
    countText.textContent = enableRowSelection
      ? L.rowsSelected(selected, totalRows)
      : L.rowsTotal(totalRows);

    const controls = document.createElement('div');
    controls.className = 'nds-data-table-pagination-controls';

    // Page size
    const pageSizeWrap = document.createElement('div');
    pageSizeWrap.className = 'nds-data-table-page-size';
    const psLabel = document.createElement('span');
    psLabel.textContent = L.rowsPerPage;
    psLabel.className = 'nds-text-muted-foreground';
    const psSelect = document.createElement('select');
    psSelect.className = 'nds-data-table-page-size-select';
    psSelect.setAttribute('aria-label', L.rowsPerPage);
    for (const opt of pageSizeOptions) {
      const o = document.createElement('option');
      o.value = String(opt);
      o.textContent = String(opt);
      if (opt === table.getState().pagination.pageSize) o.selected = true;
      psSelect.appendChild(o);
    }
    psSelect.addEventListener('change', () => {
      table.setPageSize(Number(psSelect.value));
    });
    pageSizeWrap.append(psLabel, psSelect);

    // Page indicator
    const pageInd = document.createElement('div');
    pageInd.className = 'nds-text-muted-foreground';
    pageInd.textContent = `${L.page} ${pageIndex + 1} ${L.pageOf} ${Math.max(pageCount, 1)}`;

    // Nav buttons
    const navWrap = document.createElement('div');
    navWrap.className = 'nds-data-table-pagination-nav';

    function navBtn(label: string, icon: string, onClick: () => void, disabled: boolean) {
      const btn = createButton({
        variant: 'outline',
        size: 'icon',
        ariaLabel: label,
        disabled,
        onClick: () => onClick(),
      });
      btn.appendChild(svgEl(icon));
      return btn;
    }

    navWrap.append(
      navBtn(L.firstPage, ICONS.chevronsLeft, () => table.setPageIndex(0), !table.getCanPreviousPage()),
      navBtn(L.prevPage, ICONS.chevronLeft, () => table.previousPage(), !table.getCanPreviousPage()),
      navBtn(L.nextPage, ICONS.chevronRight, () => table.nextPage(), !table.getCanNextPage()),
      navBtn(L.lastPage, ICONS.chevronsRight, () => table.setPageIndex(pageCount - 1), !table.getCanNextPage()),
    );

    controls.append(pageSizeWrap, pageInd, navWrap);
    pagFooter.append(countText, controls);
  }

  // ── Re-render orchestration ──────────────────────────────────────────────
  function rerender() {
    renderToolbar();
    renderHeader();
    rerenderBody();
    renderPagination();
  }

  rerender();
  onTableReady?.(table);

  // Expose table on root for play functions / advanced consumers.
  (root as HTMLElement & { __table?: TanstackTable<TData> }).__table = table;

  return root;
}
