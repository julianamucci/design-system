<script lang="ts" generics="TData">
  import { untrack } from 'svelte';
  import {
    createTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ColumnPinningState,
    type ColumnSizingState,
    type RowSelectionState,
    type SortingState,
    type Table as TanstackTable,
    type Updater,
    type VisibilityState,
  } from '@tanstack/table-core';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import Pin from '@lucide/svelte/icons/pin';
  import PinOff from '@lucide/svelte/icons/pin-off';
  import Search from '@lucide/svelte/icons/search';
  import Settings2 from '@lucide/svelte/icons/settings-2';

  import { cn } from '@/lib/utils';
  import { Badge } from '@/components/ui/badge';
  import { Checkbox } from '@/components/ui/checkbox';
  import { Input } from '@/components/ui/input';
  import { Button } from '@/components/ui/button';
  import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import DataTablePagination from './data-table-pagination.svelte';
  import EditableCell from './data-table-editable-cell.svelte';

  type Column = ColumnDef<TData, unknown>;

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
    pageSizeOptions = [10, 20, 50, 100],
    pageSize = 10,
    emptyMessage = 'Sem resultados.',
    class: className,
    onTableReady,
    onCellEdit,
  }: {
    columns: Column[];
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
    virtualized?: boolean;
    virtualRowHeight?: number;
    maxHeight?: string;
    pageSizeOptions?: number[];
    pageSize?: number;
    emptyMessage?: string;
    class?: string;
    onTableReady?: (table: TanstackTable<TData>) => void;
    onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
  } = $props();

  // ── State (Svelte 5 runes) ───────────────────────────────────────────────
  let sorting = $state<SortingState>([]);
  let columnFilters = $state<ColumnFiltersState>([]);
  let columnVisibility = $state<VisibilityState>({});
  let rowSelection = $state<RowSelectionState>({});
  let globalFilter = $state('');
  let columnOrder = $state<ColumnOrderState>([]);
  let columnPinning = $state<ColumnPinningState>({ left: [], right: [] });
  let columnSizing = $state<ColumnSizingState>({});
  let columnSizingInfo = $state<Record<string, unknown>>({
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  });
  let draggedColumnId = $state<string | null>(null);
  let pagination = $state<{ pageIndex: number; pageSize: number }>(untrack(() => ({ pageIndex: 0, pageSize })));

  function apply<T>(prev: T, updater: Updater<T>): T {
    return typeof updater === 'function' ? (updater as (old: T) => T)(prev) : updater;
  }

  // ── Inject selection column ─────────────────────────────────────────────
  const allColumns = $derived.by<Column[]>(() => {
    const enriched: Column[] = columns.map((col) => {
      const filter = col.meta?.filter;
      if (filter?.type === 'select' && !('filterFn' in col)) {
        return { ...col, filterFn: 'equals' } as Column;
      }
      return col;
    });
    if (!enableRowSelection) return enriched;
    const selectCol: Column = {
      id: '__select__',
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 36,
    };
    return [selectCol, ...enriched];
  });

  const hasColumnFilters = $derived(
    enableColumnFilters && allColumns.some((c) => !!c.meta?.filter)
  );

  // ── Table engine ─────────────────────────────────────────────────────────
  let table = $state.raw<TanstackTable<TData>>(undefined as unknown as TanstackTable<TData>);

  $effect.pre(() => {
    // Reactivity dependencies for re-creation on data/columns change
    void data;
    void allColumns;
    const t = createTable<TData>({
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columnSizingInfo: columnSizingInfo as any,
        pagination,
      },
      enableRowSelection,
      enableColumnResizing,
      enableColumnPinning,
      columnResizeMode: 'onChange',
      onStateChange: () => {
        /* state lives in runes — see onChange handlers below */
      },
      renderFallbackValue: null,
      onSortingChange: (u) => (sorting = apply(sorting, u)),
      onColumnFiltersChange: (u) => (columnFilters = apply(columnFilters, u)),
      onColumnVisibilityChange: (u) => (columnVisibility = apply(columnVisibility, u)),
      onRowSelectionChange: (u) => (rowSelection = apply(rowSelection, u)),
      onGlobalFilterChange: (u) => (globalFilter = apply(globalFilter, u)),
      onColumnOrderChange: (u) => (columnOrder = apply(columnOrder, u)),
      onColumnPinningChange: (u) => (columnPinning = apply(columnPinning, u)),
      onColumnSizingChange: (u) => (columnSizing = apply(columnSizing, u)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onColumnSizingInfoChange: ((u: any) => (columnSizingInfo = apply(columnSizingInfo, u))) as any,
      onPaginationChange: (u) => (pagination = apply(pagination, u)),
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel:
        enablePagination && !virtualized ? getPaginationRowModel() : undefined,
      meta: {
        updateData: onCellEdit,
      },
      initialState: {
        pagination: { pageSize },
      },
    });
    table = t;
  });

  // ── Keep state in sync with engine (re-set options on state change) ─────
  $effect(() => {
    if (!table) return;
    table.setOptions((prev) => ({
      ...prev,
      data,
      columns: allColumns,
      state: {
        ...prev.state,
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
  });

  $effect(() => {
    if (table) onTableReady?.(table);
  });

  // ── Virtualization ───────────────────────────────────────────────────────
  let scrollRef = $state<HTMLDivElement | null>(null);
  const rowsCount = $derived(virtualized && table ? table.getRowModel().rows.length : 0);

  const virtualizerStore = $derived(
    createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
      count: rowsCount,
      getScrollElement: () => scrollRef,
      estimateSize: () => virtualRowHeight,
      overscan: 10,
    })
  );

  const virtualItems = $derived($virtualizerStore?.getVirtualItems() ?? []);
  const totalSize = $derived($virtualizerStore?.getTotalSize() ?? 0);
  const paddingTop = $derived(
    virtualized && virtualItems.length > 0 ? virtualItems[0].start : 0
  );
  const paddingBottom = $derived(
    virtualized && virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1].end
      : 0
  );

  // ── DnD reorder ──────────────────────────────────────────────────────────
  function handleDragStart(columnId: string) {
    draggedColumnId = columnId;
  }
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }
  function handleDrop(targetColumnId: string) {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      draggedColumnId = null;
      return;
    }
    const current =
      columnOrder.length > 0
        ? columnOrder
        : table.getAllLeafColumns().map((c) => c.id);
    const next = [...current];
    const from = next.indexOf(draggedColumnId);
    const to = next.indexOf(targetColumnId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, draggedColumnId);
    columnOrder = next;
    draggedColumnId = null;
  }

  function pinStyle(col: ReturnType<TanstackTable<TData>['getColumn']>): string {
    if (!col) return '';
    const pinned = col.getIsPinned();
    if (!pinned) return '';
    const left = pinned === 'left' ? `left: ${col.getStart('left')}px;` : '';
    const right = pinned === 'right' ? `right: ${col.getAfter('right')}px;` : '';
    return `position: sticky; ${left} ${right} z-index: 1;`;
  }

  function headerLabel(col: { columnDef: { header?: unknown }; id: string }): string {
    return typeof col.columnDef.header === 'string'
      ? (col.columnDef.header as string)
      : col.id;
  }

  function setGlobalFilter(value: string) {
    globalFilter = value;
  }
</script>

<div data-slot="data-table" class={cn('nds-data-table', className)}>
  {#if table}
    {@const headerGroups = table.getHeaderGroups()}
    {@const rows = table.getRowModel().rows}
    {@const visibleLeafColumns = table.getVisibleLeafColumns().length}

    {#if enableGlobalFilter || enableColumnVisibility}
      <div data-slot="data-table-toolbar" class="nds-data-table-toolbar">
        {#if enableGlobalFilter}
          <div class="nds-data-table-search">
            <Search
              aria-hidden="true"
              class="nds-dt-icon nds-dt-icon-muted"
            />
            <Input
              value={globalFilter}
              oninput={(e: Event) => setGlobalFilter((e.currentTarget as HTMLInputElement).value)}
              placeholder={globalFilterPlaceholder}
              aria-label={globalFilterPlaceholder}
              class="nds-data-table-search-input"
            />
          </div>
        {/if}
        {#if enableColumnVisibility}
          <DropdownMenu>
            <DropdownMenuTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="outline" size="sm" class="nds-data-table-columns-btn">
                  <Settings2 aria-hidden="true" />
                  Colunas
                </Button>
              {/snippet}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="nds-data-table-columns-menu-content">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {#each table.getAllLeafColumns().filter((c) => c.getCanHide()) as column (column.id)}
                  {@const pinned = column.getIsPinned()}
                  {@const label = headerLabel(column)}
                  <div class="nds-data-table-columns-menu-row">
                    <DropdownMenuCheckboxItem
                      class="nds-data-table-columns-menu-check"
                      checked={column.getIsVisible()}
                      onCheckedChange={(v: boolean) => column.toggleVisibility(!!v)}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                    {#if enableColumnPinning}
                      <div class="nds-data-table-pin-wrap">
                        <button
                          type="button"
                          aria-label={pinned === 'left' ? `Desafixar ${label}` : `Fixar ${label} à esquerda`}
                          onclick={() => column.pin(pinned === 'left' ? false : 'left')}
                          class={cn(
                            'nds-data-table-pin-btn',
                            pinned === 'left' && 'is-active',
                          )}
                        >
                          {#if pinned === 'left'}
                            <PinOff aria-hidden="true" class="nds-dt-icon" />
                          {:else}
                            <Pin aria-hidden="true" class="nds-dt-icon nds-dt-icon-pin" />
                          {/if}
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        {/if}
      </div>
    {/if}

    <div
      bind:this={scrollRef}
      class={cn(
        'nds-data-table-scroll',
        virtualized && 'nds-data-table-scroll-virtual',
      )}
      style={virtualized ? `max-height: ${maxHeight};` : undefined}
    >
      <Table
        class={cn(
          (enableColumnResizing || enableColumnOrdering || virtualized) && 'nds-table-fixed',
        )}
      >
        <TableHeader>
          {#each headerGroups as headerGroup (headerGroup.id)}
            <TableRow>
              {#each headerGroup.headers as header (header.id)}
                {@const canSort = header.column.getCanSort()}
                {@const sortDir = header.column.getIsSorted()}
                {@const label = headerLabel(header.column)}
                {@const isDraggable = enableColumnOrdering && header.column.id !== '__select__'}
                <TableHead
                  aria-sort={sortDir === 'asc'
                    ? 'ascending'
                    : sortDir === 'desc'
                      ? 'descending'
                      : canSort
                        ? 'none'
                        : undefined}
                  style={[
                    enableColumnResizing ? `width: ${header.getSize()}px;` : '',
                    pinStyle(header.column),
                  ].join(' ')}
                  class={cn('nds-data-table-th', header.column.getIsPinned() && 'nds-data-table-td-pinned')}
                  draggable={isDraggable}
                  ondragstart={isDraggable ? () => handleDragStart(header.column.id) : undefined}
                  ondragover={isDraggable ? handleDragOver : undefined}
                  ondrop={isDraggable ? () => handleDrop(header.column.id) : undefined}
                >
                  {#if !header.isPlaceholder}
                    <div class="nds-data-table-columns-menu-row">
                      {#if isDraggable}
                        <GripVertical aria-hidden="true" class="nds-dt-icon nds-dt-icon-grip" />
                      {/if}
                      {#if header.column.id === '__select__'}
                        <Checkbox
                          aria-label="Selecionar todas as linhas"
                          checked={table.getIsAllPageRowsSelected()}
                          indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
                          onCheckedChange={(v: boolean) => table.toggleAllPageRowsSelected(!!v)}
                        />
                      {:else if canSort}
                        <button
                          type="button"
                          onclick={header.column.getToggleSortingHandler()}
                          class="nds-data-table-sort-btn"
                          aria-label={`Ordenar por ${label}`}
                        >
                          {label}
                          {#if sortDir === 'asc'}
                            <ArrowUp aria-hidden="true" class="nds-dt-icon" />
                          {:else if sortDir === 'desc'}
                            <ArrowDown aria-hidden="true" class="nds-dt-icon" />
                          {:else}
                            <ArrowUpDown aria-hidden="true" class="nds-dt-icon nds-dt-icon-muted" />
                          {/if}
                        </button>
                      {:else}
                        <div class="nds-data-table-th-label">{label}</div>
                      {/if}
                    </div>
                    {#if enableColumnResizing && header.column.getCanResize()}
                      <div
                        onmousedown={header.getResizeHandler()}
                        ontouchstart={header.getResizeHandler()}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Redimensionar coluna ${label}`}
                        class={cn(
                          'nds-data-table-resize-handle',
                          header.column.getIsResizing() && 'is-resizing',
                        )}
                      ></div>
                    {/if}
                  {/if}
                </TableHead>
              {/each}
            </TableRow>
          {/each}
          {#if hasColumnFilters}
            <TableRow>
              {#each headerGroups[0]?.headers ?? [] as header (header.id)}
                {@const filterMeta = header.column.columnDef.meta?.filter}
                {@const canFilter = header.column.getCanFilter()}
                <TableHead
                  style={pinStyle(header.column)}
                  class={cn('', header.column.getIsPinned() && 'nds-data-table-td-pinned')}
                >
                  {#if canFilter && filterMeta}
                    {#if filterMeta.type === 'select'}
                      <select
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onchange={(e: Event) => header.column.setFilterValue((e.currentTarget as HTMLSelectElement).value || undefined)}
                        aria-label={`Filtrar ${header.column.id}`}
                        class="nds-data-table-filter-select"
                      >
                        <option value="">Todos</option>
                        {#each filterMeta.options ?? [] as opt (opt)}
                          <option value={opt}>{opt}</option>
                        {/each}
                      </select>
                    {:else}
                      <Input
                        value={(header.column.getFilterValue() as string) ?? ''}
                        oninput={(e: Event) => header.column.setFilterValue((e.currentTarget as HTMLInputElement).value)}
                        placeholder={filterMeta.placeholder ?? 'Filtrar...'}
                        aria-label={`Filtrar ${header.column.id}`}
                        class="nds-data-table-filter-input"
                      />
                    {/if}
                  {/if}
                </TableHead>
              {/each}
            </TableRow>
          {/if}
        </TableHeader>
        <TableBody>
          {#if paddingTop > 0}
            <tr aria-hidden="true"><td colspan={visibleLeafColumns} style={`height: ${paddingTop}px;`}></td></tr>
          {/if}
          {#if rows.length}
            {#each virtualized ? virtualItems.map((vi) => rows[vi.index]) : rows as row (row.id)}
              <TableRow data-state={row.getIsSelected() ? 'selected' : undefined}>
                {#each row.getVisibleCells() as cell (cell.id)}
                  {@const colId = cell.column.id}
                  <TableCell
                    style={[
                      enableColumnResizing ? `width: ${cell.column.getSize()}px;` : '',
                      pinStyle(cell.column),
                    ].join(' ')}
                    class={cn(
                      cell.column.getIsPinned() && 'nds-data-table-th-pinned',
                      cell.column.columnDef.meta?.cellClass,
                    )}
                  >
                    {#if colId === '__select__'}
                      <Checkbox
                        aria-label="Selecionar linha"
                        checked={row.getIsSelected()}
                        onCheckedChange={(v: boolean) => row.toggleSelected(!!v)}
                      />
                    {:else if cell.column.columnDef.meta?.editable}
                      {@const initial = cell.getValue() as string | number | null}
                      <EditableCell
                        {initial}
                        rowIndex={row.index}
                        columnId={colId}
                        onCommit={(value) => onCellEdit?.(row.index, colId, value)}
                      />
                    {:else if cell.column.columnDef.meta?.badgeVariant}
                      {@const value = cell.getValue()}
                      {@const variant = cell.column.columnDef.meta.badgeVariant(value, row.original)}
                      <Badge {variant}>{String(value ?? '')}</Badge>
                    {:else if cell.column.columnDef.meta?.format}
                      {cell.column.columnDef.meta.format(cell.getValue(), row.original)}
                    {:else}
                      {String(cell.getValue() ?? '')}
                    {/if}
                  </TableCell>
                {/each}
              </TableRow>
            {/each}
          {:else}
            <TableRow>
              <TableCell colspan={visibleLeafColumns} class="nds-data-table-empty">
                {emptyMessage}
              </TableCell>
            </TableRow>
          {/if}
          {#if paddingBottom > 0}
            <tr aria-hidden="true"><td colspan={visibleLeafColumns} style={`height: ${paddingBottom}px;`}></td></tr>
          {/if}
        </TableBody>
      </Table>
    </div>

    {#if enablePagination && !virtualized}
      <DataTablePagination {table} {pageSizeOptions} {enableRowSelection} />
    {/if}
  {/if}
</div>
