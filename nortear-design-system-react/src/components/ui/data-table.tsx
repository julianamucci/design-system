import * as React from "react"
import {
  type CellContext,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type ReactTable,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  flexRender,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Pin,
  PinOff,
  Search,
  Settings2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ─── Os RECURSOS que esta tabela usa ──────────────────────────────────────────
//
// No TanStack 9 os recursos deixam de vir todos ligados: cada um é registrado
// aqui, e só o que está nesta lista entra no pacote. É por isso que o bloco
// existe — e por isso que ele é a fonte de verdade sobre o que o DataTable faz.
//
// Os dois `meta` também mudaram de lugar, e para melhor. Antes era
// `declare module "@tanstack/react-table"`: augmentação GLOBAL, que vazava os
// nossos campos para qualquer outra tabela do projeto que importasse a lib, e
// exigia repetir `TData`/`TValue` só para casar a assinatura. Agora são slots
// de tipo dentro do próprio conjunto — o escopo é este componente, e acabou.
type DataTableColumnMeta = {
  filter?: { type: "text" | "select"; options?: string[]; placeholder?: string }
  editable?: boolean
}

type DataTableTableMeta = {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void
}

const RECURSOS_BASE = {
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
  columnMeta: {} as DataTableColumnMeta,
  tableMeta: {} as DataTableTableMeta,
}

/**
 * Dois conjuntos, e não um com a paginação desligada por opção.
 *
 * O modelo de linhas paginado é um RECURSO no 9, não mais um `get*RowModel`
 * passado por chamada — e recurso registrado é recurso ativo. Como a tabela
 * virtualizada entrega todas as linhas de propósito (quem recorta é o
 * virtualizador, não a paginação), ela precisa de um conjunto que simplesmente
 * não tenha o recurso. Registrar e desligar por opção deixaria o código do
 * recurso no pacote de quem nunca pagina.
 */
const RECURSOS_COM_PAGINACAO = tableFeatures({
  ...RECURSOS_BASE,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
})

const RECURSOS_SEM_PAGINACAO = tableFeatures(RECURSOS_BASE)

/** O conjunto completo — é ele que tipa tudo que sai deste módulo. */
export type DataTableFeatures = typeof RECURSOS_COM_PAGINACAO

export type DataTableColumn<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>

/**
 * Todo texto que o componente escreve na tela ou entrega ao leitor de tela.
 *
 * Existe porque a alternativa — texto cravado no componente — deixa a única
 * saída de tradução do lado de fora: quem monta a tabela consegue trocar o
 * cabeçalho de uma coluna, mas não o nome do controle que marca a linha. O
 * contrato é o MESMO nas quatro stacks TanStack (react, vue, svelte, vanilla):
 * mesmas chaves, mesmos valores padrão, para que um texto revisado numa stack
 * possa ser copiado nas outras sem tradução de API.
 *
 * As chaves que dependem de um dado — coluna, linha, contagem — são FUNÇÕES, e
 * não moldes com `{col}`. A função permite ordem de palavras diferente por
 * idioma e concordância de número, coisa que interpolação posicional não faz.
 * (No Angular as mesmas chaves são moldes com `{col}`, porque template não
 * declara função; essa divergência é de API do framework e fica registrada, não
 * alinhada.)
 */
export interface DataTableLabels {
  columns: string
  showColumns: string
  selectAll: string
  selectRow: (row: string) => string
  sortBy: (col: string) => string
  filter: (col: string) => string
  noFilter: (col: string) => string
  pinLeft: (col: string) => string
  unpin: (col: string) => string
  resize: (col: string) => string
  edit: (col: string) => string
  rowsPerPage: string
  page: string
  pageOf: string
  firstPage: string
  prevPage: string
  nextPage: string
  lastPage: string
  rowsTotal: (n: number) => string
  rowsSelected: (s: number, n: number) => string
  allOption: string
}

/** Português do Brasil — o idioma em que o design system nasce. */
export const DATA_TABLE_LABELS_PADRAO: DataTableLabels = {
  columns: "Colunas",
  showColumns: "Exibir colunas",
  selectAll: "Selecionar todas as linhas",
  selectRow: (r) => `Selecionar linha ${r}`,
  sortBy: (c) => `Ordenar por ${c}`,
  filter: (c) => `Filtrar ${c}`,
  noFilter: (c) => `Sem filtro para ${c}`,
  pinLeft: (c) => `Fixar ${c} à esquerda`,
  unpin: (c) => `Desafixar ${c}`,
  resize: (c) => `Redimensionar coluna ${c}`,
  edit: (c) => `Editar ${c}`,
  rowsPerPage: "Linhas por página",
  page: "Página",
  pageOf: "de",
  firstPage: "Primeira página",
  prevPage: "Página anterior",
  nextPage: "Próxima página",
  lastPage: "Última página",
  rowsTotal: (n) => `${n} linha(s).`,
  rowsSelected: (s, n) => `${s} de ${n} linha(s) selecionada(s).`,
  allOption: "Todos",
}

export interface DataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  enableGlobalFilter?: boolean
  globalFilterPlaceholder?: string
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableColumnFilters?: boolean
  enableColumnResizing?: boolean
  enableColumnOrdering?: boolean
  enableColumnPinning?: boolean
  enablePagination?: boolean
  /** Ativa virtualização de linhas. Desativa paginação. */
  virtualized?: boolean
  virtualRowHeight?: number
  maxHeight?: string
  pageSizeOptions?: number[]
  pageSize?: number
  emptyMessage?: string
  /** Nome acessível da tabela. Vira <caption> fora da tela. */
  caption?: string
  /** Identificador estável da linha. Sem ele, a identidade da linha é a posição. */
  rowKey?: (row: TData, index: number) => string
  /** Texto que identifica a linha no rótulo do controle de seleção. */
  rowLabel?: (row: TData) => string
  /** Textos da interface. Só as chaves informadas mudam. */
  labels?: Partial<DataTableLabels>
  className?: string
  onTableReady?: (table: TanstackTable<DataTableFeatures, TData>) => void
  /** Recebe alteração de célula editável. O caller é responsável por atualizar `data`. */
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void
}

function DataTable<TData extends RowData>({
  columns,
  data,
  enableGlobalFilter = true,
  globalFilterPlaceholder = "Buscar...",
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableColumnFilters = false,
  enableColumnResizing = false,
  enableColumnOrdering = false,
  enableColumnPinning = false,
  enablePagination = true,
  virtualized = false,
  virtualRowHeight = 36,
  maxHeight = "480px",
  pageSizeOptions = [10, 20, 50, 100],
  pageSize = 10,
  emptyMessage = "Sem resultados.",
  caption,
  rowKey,
  rowLabel,
  labels,
  className,
  onTableReady,
  onCellEdit,
}: DataTableProps<TData>) {
  /*
   * Memoizado porque `L` entra na definição da coluna de seleção: um objeto novo
   * a cada render trocaria a identidade de `allColumns`, e o TanStack remonta as
   * colunas quando elas trocam de identidade — perdendo largura, ordem e pin no
   * meio de um arraste.
   */
  const L = React.useMemo(
    () => ({ ...DATA_TABLE_LABELS_PADRAO, ...labels }),
    [labels]
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    start: [],
    end: [],
  })
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [draggedColumnId, setDraggedColumnId] = React.useState<string | null>(
    null
  )

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
  const rotuloDaLinha = React.useCallback(
    (row: Row<DataTableFeatures, TData>): string => {
      if (rowLabel) return rowLabel(row.original)
      const primeira = row.getAllCells().find((c) => c.column.id !== "__select__")
      const bruto = primeira?.getValue()
      return bruto == null || bruto === "" ? row.id : String(bruto)
    },
    [rowLabel]
  )

  const allColumns = React.useMemo<DataTableColumn<TData>[]>(() => {
    const enriched = columns.map((col) => {
      const filter = col.meta?.filter
      if (filter?.type === "select" && !("filterFn" in col)) {
        return { ...col, filterFn: "equals" as const }
      }
      return col
    })
    if (!enableRowSelection) return enriched
    const selectCol: DataTableColumn<TData> = {
      id: "__select__",
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 36,
      header: ({ table }) => (
        <Checkbox
          aria-label={L.selectAll}
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            !table.getIsAllPageRowsSelected() &&
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={L.selectRow(rotuloDaLinha(row))}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }
    return [selectCol, ...enriched]
  }, [columns, enableRowSelection, L, rotuloDaLinha])

  const hasColumnFilters =
    enableColumnFilters &&
    allColumns.some((c) => !!c.meta?.filter)

  // `useTable` é a API headless oficial do TanStack 9. Ao contrário do
  // `useReactTable` do 8, ele não precisa mais da supressão de
  // `react-hooks/incompatible-library`: o React Compiler consegue analisá-lo, e
  // o lint passou a acusar a diretiva como inútil.
  const table = useTable({
    /*
     * O elenco é escolhido em tempo de execução, e os dois têm tipos
     * diferentes — o sem paginação é subconjunto do outro. O TS não estreita
     * uma união de conjuntos de recursos, então a asserção declara o que o
     * guarda logo acima já garante: nenhum caminho chama API de paginação
     * quando o recurso não está registrado. É a mesma promessa que o 8 fazia
     * em silêncio, quando `getPaginationRowModel` podia ser `undefined` e os
     * métodos continuavam tipados como presentes.
     */
    features: (enablePagination && !virtualized
      ? RECURSOS_COM_PAGINACAO
      : RECURSOS_SEM_PAGINACAO) as DataTableFeatures,
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
    },
    enableRowSelection,
    enableColumnResizing,
    enableColumnPinning,
    /*
     * Sem `getRowId` a chave da linha é o ÍNDICE, e o estado de seleção fica
     * preso à posição: ordenar por outra coluna mantinha marcadas as mesmas
     * linhas da tela, não as mesmas linhas de dados. Com `rowKey` a marcação
     * viaja com o registro. Sem ele o TanStack volta ao índice — comportamento
     * antigo, preservado para quem não passa a prop.
     */
    getRowId: rowKey ? (row, index) => rowKey(row, index) : undefined,
    /*
     * O primeiro clique ordena ASCENDENTE em qualquer coluna.
     *
     * Sem isto o TanStack decide sozinho pelo TIPO do primeiro valor: coluna de
     * número começa DESCENDENTE. O resultado era uma tabela em que ordenar por
     * "Cliente" subia e ordenar por "Valor" descia, sem nada na tela explicando a
     * diferenca — e contra o que a documentação do componente promete.
     */
    sortDescFirst: false,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    meta: {
      updateData: onCellEdit,
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize },
    },
  })

  React.useEffect(() => {
    onTableReady?.(table)
  }, [table, onTableReady])

  const visibleLeafColumns = table.getVisibleLeafColumns().length
  const rows = table.getRowModel().rows
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => virtualRowHeight,
    overscan: 10,
  })

  const virtualRows = virtualized ? virtualizer.getVirtualItems() : []
  const paddingTop =
    virtualized && virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualized && virtualRows.length > 0
      ? virtualizer.getTotalSize() -
        virtualRows[virtualRows.length - 1].end
      : 0

  function handleDragStart(columnId: string) {
    setDraggedColumnId(columnId)
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function handleDrop(targetColumnId: string) {
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null)
      return
    }
    const current =
      columnOrder.length > 0
        ? columnOrder
        : table.getAllLeafColumns().map((c) => c.id)
    const next = [...current]
    const from = next.indexOf(draggedColumnId)
    const to = next.indexOf(targetColumnId)
    if (from === -1 || to === -1) return
    next.splice(from, 1)
    next.splice(to, 0, draggedColumnId)
    setColumnOrder(next)
    setDraggedColumnId(null)
  }

  function pinStyle(column: ReturnType<typeof table.getColumn>) {
    if (!column) return {}
    const pinned = column.getIsPinned()
    if (!pinned) return {}
    return {
      position: "sticky" as const,
      left: pinned === "start" ? column.getStart("start") : undefined,
      right: pinned === "end" ? column.getAfter("end") : undefined,
      zIndex: 1,
    }
  }

  return (
    <div
      data-slot="data-table"
      className={cn("nds-data-table", className)}
    >
      {(enableGlobalFilter || enableColumnVisibility) && (
        <div
          data-slot="data-table-toolbar"
          className="nds-data-table-toolbar"
        >
          {enableGlobalFilter && (
            <div className="nds-data-table-search">
              <Search
                aria-hidden="true"
                className="nds-dt-icon nds-dt-icon-muted"
              />
              <Input
                // `type="search"` é o que dá a este campo o papel `searchbox`
                // na árvore de acessibilidade. Sem ele o leitor anuncia "campo
                // de edição" e o filtro global fica indistinguível de um
                // campo de formulário qualquer.
                type="search"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={globalFilterPlaceholder}
                aria-label={globalFilterPlaceholder}
                className="nds-data-table-search-input"
              />
            </div>
          )}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="nds-data-table-columns-btn">
                    <Settings2 aria-hidden="true" />
                    {L.columns}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="nds-data-table-columns-menu-content">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{L.showColumns}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      const pinned = column.getIsPinned()
                      const label =
                        flexHeaderLabel(column.columnDef.header) ?? column.id
                      return (
                        <div
                          key={column.id}
                          className="nds-data-table-columns-menu-row"
                        >
                          <DropdownMenuCheckboxItem
                            className="nds-data-table-columns-menu-check"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {label}
                          </DropdownMenuCheckboxItem>
                          {enableColumnPinning && (
                            <div className="nds-data-table-pin-wrap">
                              <button
                                type="button"
                                aria-label={
                                  pinned === "start"
                                    ? L.unpin(label)
                                    : L.pinLeft(label)
                                }
                                onClick={() =>
                                  column.pin(
                                    pinned === "start" ? false : "start"
                                  )
                                }
                                className={cn(
                                  "nds-data-table-pin-btn",
                                  pinned === "start" && "is-active"
                                )}
                              >
                                {pinned === "start" ? (
                                  <PinOff
                                    aria-hidden="true"
                                    className="nds-dt-icon"
                                  />
                                ) : (
                                  <Pin
                                    aria-hidden="true"
                                    className="nds-dt-icon nds-dt-icon-pin"
                                  />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "nds-data-table-scroll",
          virtualized && "nds-data-table-scroll-virtual"
        )}
        style={virtualized ? { maxHeight } : undefined}
      >
        <Table
          className={cn(
            (enableColumnResizing || enableColumnOrdering || virtualized) &&
              "nds-table-fixed"
          )}
        >
          {/*
            PRIMEIRO filho de <table>: a tag `caption` só é válida nessa posição,
            e o parser do navegador move para fora da tabela o que vier antes
            dela. Fica fora da tela — a legenda é o nome que o leitor anuncia ao
            entrar na grade, e a interface já mostra o mesmo assunto no título da
            página. Sem ela a tabela chega ao leitor como "tabela, 6 colunas", e
            nada distingue duas tabelas na mesma tela.
          */}
          {caption ? (
            <TableCaption className="nds-sr-only">{caption}</TableCaption>
          ) : null}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDir = header.column.getIsSorted()
                  const label =
                    flexHeaderLabel(header.column.columnDef.header) ??
                    header.column.id
                  const isDraggable =
                    enableColumnOrdering &&
                    header.column.id !== "__select__"
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={
                        sortDir === "asc"
                          ? "ascending"
                          : sortDir === "desc"
                            ? "descending"
                            : canSort
                              ? "none"
                              : undefined
                      }
                      style={{
                        width: enableColumnResizing
                          ? header.getSize()
                          : undefined,
                        ...pinStyle(header.column),
                      }}
                      className={cn(
                        "nds-data-table-th",
                        header.column.getIsPinned() && "nds-data-table-th-pinned"
                      )}
                      draggable={isDraggable}
                      onDragStart={
                        isDraggable
                          ? () => handleDragStart(header.column.id)
                          : undefined
                      }
                      onDragOver={isDraggable ? handleDragOver : undefined}
                      onDrop={
                        isDraggable
                          ? () => handleDrop(header.column.id)
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div className="nds-data-table-th-inner">
                          {isDraggable && (
                            <GripVertical
                              aria-hidden="true"
                              className="nds-dt-icon nds-dt-icon-grip"
                            />
                          )}
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="nds-data-table-sort-btn"
                              aria-label={L.sortBy(label)}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {sortDir === "asc" ? (
                                <ArrowUp
                                  aria-hidden="true"
                                  className="nds-dt-icon"
                                />
                              ) : sortDir === "desc" ? (
                                <ArrowDown
                                  aria-hidden="true"
                                  className="nds-dt-icon"
                                />
                              ) : (
                                <ArrowUpDown
                                  aria-hidden="true"
                                  className="nds-dt-icon nds-dt-icon-muted"
                                />
                              )}
                            </button>
                          ) : (
                            <div className="nds-data-table-th-label">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {enableColumnResizing && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={L.resize(label)}
                          className={cn(
                            "nds-data-table-resize-handle",
                            header.column.getIsResizing() && "is-resizing"
                          )}
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
            {hasColumnFilters && (
              <TableRow className="nds-data-table-filter-row">
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const filterMeta = header.column.columnDef.meta?.filter
                  const canFilter = header.column.getCanFilter()
                  return (
                    <TableHead
                      key={`f-${header.id}`}
                      style={pinStyle(header.column)}
                      className={cn(
                        header.column.getIsPinned() && "nds-data-table-th-pinned"
                      )}
                    >
                      {canFilter && filterMeta ? (
                        <ColumnFilter
                          column={header.column}
                          meta={filterMeta}
                          labels={L}
                        />
                      ) : (
                        // axe empty-table-header: o valor de um campo não entra
                        // no nome acessível da célula, então a coluna sem filtro
                        // chegaria ao leitor de tela como cabeçalho vazio.
                        //
                        // O nome da coluna entra no texto porque "Sem filtro"
                        // repetido em três células é o mesmo que célula vazia:
                        // o leitor lista três cabeçalhos idênticos e nenhum diz
                        // a que coluna pertence.
                        <span className="nds-sr-only">
                          {L.noFilter(
                            flexHeaderLabel(header.column.columnDef.header) ??
                              header.column.id
                          )}
                        </span>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={visibleLeafColumns}
                  style={{ height: paddingTop }}
                />
              </tr>
            )}
            {rows.length ? (
              (virtualized
                ? virtualRows.map((vr) => rows[vr.index])
                : rows
              ).map((row) => (
                <TableRow
                  key={row.id}
                  className="nds-data-table-tr"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: enableColumnResizing
                          ? cell.column.getSize()
                          : undefined,
                        ...pinStyle(cell.column),
                      }}
                      className={cn(
                        "nds-data-table-td",
                        cell.column.getIsPinned() && "nds-data-table-td-pinned"
                      )}
                    >
                      {cell.column.columnDef.meta?.editable ? (
                        <EditableCell
                          context={cell.getContext()}
                          editable
                          labels={L}
                        />
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleLeafColumns}
                  className="nds-data-table-empty"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={visibleLeafColumns}
                  style={{ height: paddingBottom }}
                />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/*
        A linha marcada muda de FUNDO — e cor sozinha não chega a quem não
        enxerga. A contagem existia só no rodapé da paginação, num `div` mudo
        que somia junto com ela quando `enablePagination` era falso ou a tabela
        era virtualizada. Aqui ela é região viva e não depende do rodapé.
        WCAG 4.1.3 (Status Messages), nível AA.
      */}
      {enableRowSelection && (
        <div className="nds-sr-only" role="status" aria-live="polite">
          {L.rowsSelected(
            table.getFilteredSelectedRowModel().rows.length,
            table.getFilteredRowModel().rows.length
          )}
        </div>
      )}

      {enablePagination && !virtualized && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          enableRowSelection={enableRowSelection}
          labels={L}
        />
      )}
    </div>
  )
}

interface ColumnFilterProps<TData extends RowData, TValue> {
  column: import("@tanstack/react-table").Column<
    DataTableFeatures,
    TData,
    TValue
  >
  meta: NonNullable<NonNullable<DataTableColumn<TData>["meta"]>["filter"]>
  labels?: DataTableLabels
}

function ColumnFilter<TData extends RowData, TValue>({
  column,
  meta,
  labels = DATA_TABLE_LABELS_PADRAO,
}: ColumnFilterProps<TData, TValue>) {
  const value = (column.getFilterValue() ?? "") as string
  // O rótulo sai do CABEÇALHO, não do id. O id é chave de dados —
  // `customer`, `amount` — e virava "Filtrar customer" numa interface em
  // português. Só cai no id quando o header não é string.
  const label = flexHeaderLabel(column.columnDef.header) ?? column.id
  if (meta.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) =>
          column.setFilterValue(e.target.value || undefined)
        }
        aria-label={labels.filter(label)}
        className="nds-data-table-filter-select"
      >
        <option value="">{labels.allOption}</option>
        {meta.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }
  return (
    <Input
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={meta.placeholder ?? "Filtrar..."}
      aria-label={labels.filter(label)}
      className="nds-data-table-filter-input"
    />
  )
}

interface EditableCellProps<TData extends RowData, TValue> {
  context: CellContext<DataTableFeatures, TData, TValue>
  editable: boolean
  labels?: DataTableLabels
}

function EditableCell<TData extends RowData, TValue>({
  context,
  labels = DATA_TABLE_LABELS_PADRAO,
}: EditableCellProps<TData, TValue>) {
  // Mesmo rótulo no botão e no campo: quem abriu a edição precisa ouvir de que
  // coluna é o campo que acabou de receber foco. Sai do cabeçalho, não do id.
  const label =
    flexHeaderLabel(context.column.columnDef.header) ?? context.column.id
  const initial = context.getValue() as string | number | null
  const [value, setValue] = React.useState<string>(
    initial == null ? "" : String(initial)
  )
  const [editing, setEditing] = React.useState(false)

  // Reseta o rascunho quando o valor da célula muda por fora (ordenação,
  // paginação, edição externa). Padrão "adjust state during render" da doc
  // do React — substitui o antigo useEffect+setState (cascading render).
  const [prevInitial, setPrevInitial] = React.useState(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setValue(initial == null ? "" : String(initial))
  }

  function commit() {
    const isNumber = typeof initial === "number"
    const next = isNumber ? Number(value) : value
    context.table.options.meta?.updateData?.(
      context.row.index,
      context.column.id,
      next
    )
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="nds-data-table-editable">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="nds-data-table-edit-btn"
          aria-label={labels.edit(label)}
        >
          {value === "" ? (
            <span className="nds-dt-icon-muted">—</span>
          ) : (
            value
          )}
        </button>
      </div>
    )
  }
  return (
    <div className="nds-data-table-editable">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit()
          } else if (e.key === "Escape") {
            setValue(initial == null ? "" : String(initial))
            setEditing(false)
          }
        }}
        // Sem isto o campo aberto não tem NOME nenhum: o leitor anuncia
        // "edição, em branco" e não diz de que coluna. WCAG 4.1.2, nível A.
        aria-label={labels.edit(label)}
        className="nds-data-table-edit-input"
      />
    </div>
  )
}

interface DataTablePaginationProps<TData extends RowData> {
  /*
   * `ReactTable`, e não o `Table` do core: no 9 quem publica `state` é o
   * adaptador do React, e o core expõe o mesmo dado por átomos. Aqui a leitura
   * é de render, então o tipo do adaptador é o certo.
   */
  table: ReactTable<DataTableFeatures, TData>
  pageSizeOptions: number[]
  enableRowSelection: boolean
  /** Já vem mesclado com o padrão quando quem renderiza é o DataTable. */
  labels?: DataTableLabels
}

function DataTablePagination<TData extends RowData>({
  table,
  pageSizeOptions,
  enableRowSelection,
  labels = DATA_TABLE_LABELS_PADRAO,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.state.pagination.pageIndex
  const pageCount = table.getPageCount()
  const selected = table.getFilteredSelectedRowModel().rows.length
  const total = table.getFilteredRowModel().rows.length

  return (
    <div
      data-slot="data-table-pagination"
      className="nds-data-table-pagination"
    >
      <div className="nds-data-table-pagination-count">
        {enableRowSelection
          ? labels.rowsSelected(selected, total)
          : labels.rowsTotal(total)}
      </div>
      <div className="nds-data-table-pagination-controls">
        <div className="nds-data-table-page-size">
          <span>{labels.rowsPerPage}</span>
          <select
            aria-label={labels.rowsPerPage}
            value={table.state.pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="nds-data-table-page-size-select"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="nds-data-table-pagination-count">
          {labels.page} {pageIndex + 1} {labels.pageOf} {Math.max(pageCount, 1)}
        </div>
        <div className="nds-data-table-pagination-nav">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label={labels.firstPage}
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={labels.prevPage}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={labels.nextPage}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label={labels.lastPage}
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function flexHeaderLabel(header: unknown): string | undefined {
  return typeof header === "string" ? header : undefined
}

export { DataTable, DataTablePagination }
