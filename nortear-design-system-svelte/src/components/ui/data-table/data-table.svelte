<script lang="ts" generics="TData extends RowData">
  import { untrack } from 'svelte';
  import {
    constructTable,
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ColumnPinningState,
    type ColumnSizingState,
    type RowSelectionState,
    type SortingState,
    type Table as TanstackTable,
    type Updater,
    type ColumnVisibilityState,
    type RowData,
  } from '@tanstack/table-core';
  import { criarRecursos, type DataTableFeatures } from './data-table-features';
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
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import DataTablePagination from './data-table-pagination.svelte';
  import EditableCell from './data-table-editable-cell.svelte';
  import { DATA_TABLE_LABELS_PADRAO, type DataTableLabels } from './data-table-labels';

  type Column = ColumnDef<DataTableFeatures, TData, unknown>;
  type Row = ReturnType<TanstackTable<DataTableFeatures, TData>['getRowModel']>['rows'][number];

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
    caption,
    rowKey,
    rowLabel,
    labels,
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
    /** Nome acessível da tabela. Vira `<caption>` fora da tela. */
    caption?: string;
    /**
     * Identificador estável da linha. Sem ele a identidade da linha é a POSIÇÃO
     * no array, e reordenar moveria a marcação de linha.
     */
    rowKey?: (row: TData, index: number) => string;
    /** Texto que identifica a linha no nome do controle de seleção. */
    rowLabel?: (row: TData) => string;
    /** Só as chaves informadas mudam; o resto continua no padrão. */
    labels?: Partial<DataTableLabels>;
    class?: string;
    onTableReady?: (table: TanstackTable<DataTableFeatures, TData>) => void;
    onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
  } = $props();

  /**
   * Padrão por baixo, o que veio por prop por cima — chave a chave. Mesclar o
   * objeto inteiro faria quem quer trocar um rótulo ter de repetir os vinte.
   */
  const rotulos = $derived<DataTableLabels>({ ...DATA_TABLE_LABELS_PADRAO, ...(labels ?? {}) });

  // ── State (Svelte 5 runes) ───────────────────────────────────────────────
  let sorting = $state<SortingState>([]);
  let columnFilters = $state<ColumnFiltersState>([]);
  let columnVisibility = $state<ColumnVisibilityState>({});
  let rowSelection = $state<RowSelectionState>({});
  let globalFilter = $state('');
  let columnOrder = $state<ColumnOrderState>([]);
  let columnPinning = $state<ColumnPinningState>({ start: [], end: [] });
  let columnSizing = $state<ColumnSizingState>({});
  let columnResizing = $state<Record<string, unknown>>({
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
  let table = $state.raw<TanstackTable<DataTableFeatures, TData>>(undefined as unknown as TanstackTable<DataTableFeatures, TData>);

  $effect.pre(() => {
    // Reactivity dependencies for re-creation on data/columns change
    void data;
    void allColumns;
    const t = constructTable({
      /*
       * O elenco é escolhido em tempo de execução, e os dois têm tipos
       * diferentes — o sem paginação é subconjunto do outro. O TS não estreita
       * uma união de conjuntos de recursos, então a asserção declara o que o
       * guarda já garante: nenhum caminho chama API de paginação quando o
       * recurso não está registrado.
       */
      features: criarRecursos(enablePagination && !virtualized),
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
        columnResizing: columnResizing as any,
        pagination,
      },
      enableRowSelection,
      enableColumnResizing,
      enableColumnPinning,
      /*
       * A chave da linha é o que o mapa de seleção guarda. No padrão do
       * TanStack ela é o ÍNDICE, então a marcação pertence à posição e não ao
       * dado — trocar a fonte de dados por outra lista marcaria "a terceira
       * linha", qualquer que fosse ela. Com `rowKey` a identidade é do registro.
       */
      getRowId: rowKey ? (row: TData, index: number) => rowKey(row, index) : undefined,
      /*
       * O primeiro clique ordena ASCENDENTE em qualquer coluna.
       *
       * Sem isto o TanStack decide sozinho pelo TIPO do primeiro valor: coluna de
       * número começa DESCENDENTE. O resultado era uma tabela em que ordenar por
       * "Cliente" subia e ordenar por "Valor" descia, sem nada na tela explicando a
       * diferenca — e contra o que a documentação do componente promete.
       */
      sortDescFirst: false,
      columnResizeMode: 'onChange',
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
      onColumnResizingChange: ((u: any) => (columnResizing = apply(columnResizing, u))) as any,
      onPaginationChange: (u) => (pagination = apply(pagination, u)),
      meta: {
        updateData: onCellEdit,
      },
      initialState: {
        pagination: { pageIndex: 0, pageSize },
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
      getRowId: rowKey ? (row, index) => rowKey(row, index) : undefined,
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

  /**
   * Contador de medições do virtualizador.
   *
   * O store do adapter emite SEMPRE o mesmo objeto (`Object.assign(instance,…)`),
   * então `$derived` sobre ele nunca invalida: a primeira leitura acontecia com
   * o contêiner ainda sem altura, devolvia zero itens, e nada recalculava
   * depois que ele era medido — a tabela virtualizada ficava com o corpo VAZIO,
   * e nenhuma story reparava porque nenhuma tinha play.
   *
   * O tique é o que muda de valor, e é ele que os `$derived` abaixo observam.
   */
  let medicoes = $state(0);

  /**
   * O store é criado UMA vez e reconfigurado por `setOptions`, que é o caminho
   * que o adapter expõe: ele chama `_willUpdate()` e reemite o valor. Recriar o
   * store a cada mudança de `count` remontava o virtualizador do zero e jogava
   * fora a medição do contêiner — que é justamente o que ele precisa guardar.
   */
  const virtualizerStore = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: 0,
    getScrollElement: () => scrollRef,
    estimateSize: () => virtualRowHeight,
    overscan: 10,
    onChange: () => {
      medicoes += 1;
    },
  });

  $effect(() => {
    const conta = rowsCount;
    const elemento = scrollRef;
    // `untrack`: `setOptions` reemite o store, e sem isto o próprio efeito se
    // reagendaria em laço — o que travava a paginação da tabela NÃO
    // virtualizada na primeira página.
    untrack(() =>
      $virtualizerStore.setOptions({
        count: conta,
        getScrollElement: () => elemento,
        estimateSize: () => virtualRowHeight,
        overscan: 10,
        onChange: () => {
          medicoes += 1;
        },
      }),
    );
  });

  const virtualItems = $derived.by(() => {
    medicoes;
    return $virtualizerStore?.getVirtualItems() ?? [];
  });
  const totalSize = $derived.by(() => {
    medicoes;
    return $virtualizerStore?.getTotalSize() ?? 0;
  });
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
        : table.getAllLeafColumns().map((c: { id: string }) => c.id);
    const next = [...current];
    const from = next.indexOf(draggedColumnId);
    const to = next.indexOf(targetColumnId);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, draggedColumnId);
    columnOrder = next;
    draggedColumnId = null;
  }

  function pinStyle(col: ReturnType<TanstackTable<DataTableFeatures, TData>['getColumn']>): string {
    if (!col) return '';
    const pinned = col.getIsPinned();
    if (!pinned) return '';
    const left = pinned === 'start' ? `left: ${col.getStart('start')}px;` : '';
    const right = pinned === 'end' ? `right: ${col.getAfter('end')}px;` : '';
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

  /**
   * Nome que identifica a linha no controle de seleção.
   *
   * Ordem do fallback, e o porquê de cada degrau:
   *  1. `rowLabel`, quando quem usa souber qual campo identifica a linha;
   *  2. o valor da PRIMEIRA coluna de dados — é ela que identifica a linha na
   *     leitura visual, então é o mesmo texto que a pessoa vidente usaria para
   *     dizer "esta linha aqui". `getAllCells` e não `getVisibleCells`: esconder
   *     uma coluna pelo menu é decisão de leitura, e não pode renomear controle;
   *  3. a chave da linha (`row.id`), quando a primeira coluna vem vazia.
   * Nunca cai em "Selecionar linha" puro: nome repetido em dez controles é o
   * mesmo que nome nenhum (WCAG 4.1.2), e era exatamente o defeito daqui.
   */
  function rotuloDaLinha(row: Row): string {
    if (rowLabel) return rowLabel(row.original);
    const primeira = row.getAllCells().find((c) => c.column.id !== '__select__');
    const bruto = primeira?.getValue();
    return bruto == null || bruto === '' ? row.id : String(bruto);
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
            <!-- `type="search"` é o que dá a este campo o papel `searchbox` na
                 árvore de acessibilidade. Sem ele o leitor anuncia "campo de
                 edição" e o filtro global fica indistinguível de um campo de
                 formulário qualquer. -->
            <Input
              type="search"
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
                  {rotulos.columns}
                </Button>
              {/snippet}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="nds-data-table-columns-menu-content">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{rotulos.showColumns}</DropdownMenuLabel>
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
                          aria-label={pinned === 'start' ? rotulos.unpin(label) : rotulos.pinLeft(label)}
                          onclick={() => column.pin(pinned === 'start' ? false : 'start')}
                          class={cn(
                            'nds-data-table-pin-btn',
                            pinned === 'start' && 'is-active',
                          )}
                        >
                          {#if pinned === 'start'}
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
        <!-- PRIMEIRO filho de `<table>`: o HTML só aceita `<caption>` nessa
             posição, e fora dela o navegador a move ou a descarta. Fica fora da
             tela porque a legenda existe para quem ENTRA na grade pelo leitor
             de tela — visualmente o título já está na página. -->
        {#if caption}
          <TableCaption class="nds-sr-only">{caption}</TableCaption>
        {/if}
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
                  class={cn('nds-data-table-th', header.column.getIsPinned() && 'nds-data-table-th-pinned')}
                  draggable={isDraggable}
                  ondragstart={isDraggable ? () => handleDragStart(header.column.id) : undefined}
                  ondragover={isDraggable ? handleDragOver : undefined}
                  ondrop={isDraggable ? () => handleDrop(header.column.id) : undefined}
                >
                  {#if !header.isPlaceholder}
                    <!-- `nds-data-table-th-inner`, e não a classe do menu de
                         colunas: a do menu traz padding, raio e um FUNDO no
                         hover, e o cabeçalho ficava 8px mais alto que nas outras
                         stacks e acendia ao passar o mouse. -->
                    <div class="nds-data-table-th-inner">
                      {#if isDraggable}
                        <GripVertical aria-hidden="true" class="nds-dt-icon nds-dt-icon-grip" />
                      {/if}
                      {#if header.column.id === '__select__'}
                        <Checkbox
                          aria-label={rotulos.selectAll}
                          checked={table.getIsAllPageRowsSelected()}
                          indeterminate={!table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()}
                          onCheckedChange={(v: boolean) => table.toggleAllPageRowsSelected(!!v)}
                        />
                      {:else if canSort}
                        <button
                          type="button"
                          onclick={header.column.getToggleSortingHandler()}
                          class="nds-data-table-sort-btn"
                          aria-label={rotulos.sortBy(label)}
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
                        aria-label={rotulos.resize(label)}
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
            <TableRow class="nds-data-table-filter-row">
              {#each headerGroups[0]?.headers ?? [] as header (header.id)}
                {@const filterMeta = header.column.columnDef.meta?.filter}
                {@const canFilter = header.column.getCanFilter()}
                {@const filterLabel = headerLabel(header.column)}
                <TableHead
                  style={pinStyle(header.column)}
                  class={cn('', header.column.getIsPinned() && 'nds-data-table-th-pinned')}
                >
                  {#if canFilter && filterMeta}
                    <!-- O rótulo sai do CABEÇALHO, não do id. O id é chave de
                         dados (`customer`, `amount`) e virava "Filtrar amount"
                         numa interface em português. -->
                    {#if filterMeta.type === 'select'}
                      <select
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onchange={(e: Event) => header.column.setFilterValue((e.currentTarget as HTMLSelectElement).value || undefined)}
                        aria-label={rotulos.filter(filterLabel)}
                        class="nds-data-table-filter-select"
                      >
                        <option value="">{rotulos.allOption}</option>
                        {#each filterMeta.options ?? [] as opt (opt)}
                          <option value={opt}>{opt}</option>
                        {/each}
                      </select>
                    {:else}
                      <Input
                        value={(header.column.getFilterValue() as string) ?? ''}
                        oninput={(e: Event) => header.column.setFilterValue((e.currentTarget as HTMLInputElement).value)}
                        placeholder={filterMeta.placeholder ?? 'Filtrar...'}
                        aria-label={rotulos.filter(filterLabel)}
                        class="nds-data-table-filter-input"
                      />
                    {/if}
                  {:else}
                    <!-- axe empty-table-header: o valor de um campo não entra no
                         nome acessível da célula, então a coluna sem filtro
                         chegaria ao leitor de tela como cabeçalho vazio. O nome
                         da coluna entra no texto porque "Sem filtro" repetido em
                         três células é o mesmo que célula vazia. -->
                    <span class="nds-sr-only">{rotulos.noFilter(filterLabel)}</span>
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
              <TableRow class="nds-data-table-tr" data-state={row.getIsSelected() ? 'selected' : undefined}>
                {#each row.getVisibleCells() as cell (cell.id)}
                  {@const colId = cell.column.id}
                  <TableCell
                    style={[
                      enableColumnResizing ? `width: ${cell.column.getSize()}px;` : '',
                      pinStyle(cell.column),
                    ].join(' ')}
                    class={cn(
                      'nds-data-table-td',
                      cell.column.getIsPinned() && 'nds-data-table-td-pinned',
                      cell.column.columnDef.meta?.cellClass,
                    )}
                  >
                    {#if colId === '__select__'}
                      <Checkbox
                        aria-label={rotulos.selectRow(rotuloDaLinha(row))}
                        checked={row.getIsSelected()}
                        onCheckedChange={(v: boolean) => row.toggleSelected(!!v)}
                      />
                    {:else if cell.column.columnDef.meta?.editable}
                      {@const initial = cell.getValue() as string | number | null}
                      <EditableCell
                        {initial}
                        rowIndex={row.index}
                        columnId={colId}
                        label={headerLabel(cell.column)}
                        edit={rotulos.edit}
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

    <!-- A linha marcada muda de FUNDO — e cor sozinha não chega a quem não
         enxerga. A contagem existia só no rodapé da paginação, num `div` mudo
         que sumia junto com ela quando `enablePagination` era falso ou a tabela
         era virtualizada. Aqui ela é região viva e não depende do rodapé.
         WCAG 4.1.3 (Status Messages), nível AA. -->
    {#if enableRowSelection}
      <div class="nds-sr-only" role="status" aria-live="polite">
        {rotulos.rowsSelected(
          table.getFilteredSelectedRowModel().rows.length,
          table.getFilteredRowModel().rows.length,
        )}
      </div>
    {/if}

    {#if enablePagination && !virtualized}
      <DataTablePagination {table} {pageSizeOptions} {enableRowSelection} labels={rotulos} />
    {/if}
  {/if}
</div>
