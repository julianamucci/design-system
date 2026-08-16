import * as React from "react"
import {
  type CellContext,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

declare module "@tanstack/react-table" {
  // TData/TValue precisam casar com a assinatura original do TanStack pra
  // module augmentation funcionar — não são "não usados" do ponto de vista do TS.
  /* eslint-disable unused-imports/no-unused-vars */
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: { type: "text" | "select"; options?: string[]; placeholder?: string }
    editable?: boolean
  }
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void
  }
  /* eslint-enable unused-imports/no-unused-vars */
}

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>

export interface DataTableProps<TData> {
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
  className?: string
  onTableReady?: (table: TanstackTable<TData>) => void
  /** Recebe alteração de célula editável. O caller é responsável por atualizar `data`. */
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void
}

function DataTable<TData>({
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
  className,
  onTableReady,
  onCellEdit,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
  })
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [draggedColumnId, setDraggedColumnId] = React.useState<string | null>(
    null
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
          aria-label="Selecionar todas as linhas"
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
          aria-label="Selecionar linha"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
    }
    return [selectCol, ...enriched]
  }, [columns, enableRowSelection])

  const hasColumnFilters =
    enableColumnFilters &&
    allColumns.some((c) => !!c.meta?.filter)

  // TanStack Table useReactTable é a API headless oficial; o objeto config
  // é estável entre renders. React Compiler não consegue inferir memoização.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
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
      left: pinned === "left" ? column.getStart("left") : undefined,
      right: pinned === "right" ? column.getAfter("right") : undefined,
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
                    Colunas
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="nds-data-table-columns-menu-content">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
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
                                  pinned === "left"
                                    ? `Desafixar ${label}`
                                    : `Fixar ${label} à esquerda`
                                }
                                onClick={() =>
                                  column.pin(
                                    pinned === "left" ? false : "left"
                                  )
                                }
                                className={cn(
                                  "nds-data-table-pin-btn",
                                  pinned === "left" && "is-active"
                                )}
                              >
                                {pinned === "left" ? (
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
                              aria-label={`Ordenar por ${label}`}
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
                          aria-label={`Redimensionar coluna ${label}`}
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
                          {`Sem filtro para ${
                            flexHeaderLabel(header.column.columnDef.header) ??
                            header.column.id
                          }`}
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
          {`${table.getFilteredSelectedRowModel().rows.length} de ${
            table.getFilteredRowModel().rows.length
          } linha(s) selecionada(s).`}
        </div>
      )}

      {enablePagination && !virtualized && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          enableRowSelection={enableRowSelection}
        />
      )}
    </div>
  )
}

interface ColumnFilterProps<TData, TValue> {
  column: import("@tanstack/react-table").Column<TData, TValue>
  meta: NonNullable<NonNullable<DataTableColumn<TData>["meta"]>["filter"]>
}

function ColumnFilter<TData, TValue>({
  column,
  meta,
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
        aria-label={`Filtrar ${label}`}
        className="nds-data-table-filter-select"
      >
        <option value="">Todos</option>
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
      aria-label={`Filtrar ${label}`}
      className="nds-data-table-filter-input"
    />
  )
}

interface EditableCellProps<TData, TValue> {
  context: CellContext<TData, TValue>
  editable: boolean
}

function EditableCell<TData, TValue>({
  context,
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
          aria-label={`Editar ${label}`}
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
        aria-label={`Editar ${label}`}
        className="nds-data-table-edit-input"
      />
    </div>
  )
}

interface DataTablePaginationProps<TData> {
  table: TanstackTable<TData>
  pageSizeOptions: number[]
  enableRowSelection: boolean
}

function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  enableRowSelection,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
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
          ? `${selected} de ${total} linha(s) selecionada(s).`
          : `${total} linha(s).`}
      </div>
      <div className="nds-data-table-pagination-controls">
        <div className="nds-data-table-page-size">
          <span>Linhas por página</span>
          <select
            aria-label="Linhas por página"
            value={table.getState().pagination.pageSize}
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
          Página {pageIndex + 1} de {Math.max(pageCount, 1)}
        </div>
        <div className="nds-data-table-pagination-nav">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Primeira página"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Última página"
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
