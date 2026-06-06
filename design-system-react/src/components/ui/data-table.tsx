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
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: { type: "text" | "select"; options?: string[]; placeholder?: string }
    editable?: boolean
  }
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void
  }
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
      className={cn("flex flex-col gap-3", className)}
    >
      {(enableGlobalFilter || enableColumnVisibility) && (
        <div
          data-slot="data-table-toolbar"
          className="flex items-center gap-2"
        >
          {enableGlobalFilter && (
            <div className="relative max-w-sm flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={globalFilterPlaceholder}
                aria-label={globalFilterPlaceholder}
                className="pl-8"
              />
            </div>
          )}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Settings2 aria-hidden="true" />
                    Colunas
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-64">
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
                          className="flex items-center gap-1"
                        >
                          <DropdownMenuCheckboxItem
                            className="flex-1 capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {label}
                          </DropdownMenuCheckboxItem>
                          {enableColumnPinning && (
                            <div className="flex shrink-0 pr-1">
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
                                  "inline-flex size-6 items-center justify-center rounded-md hover:bg-muted",
                                  pinned === "left" &&
                                    "text-primary"
                                )}
                              >
                                {pinned === "left" ? (
                                  <PinOff
                                    aria-hidden="true"
                                    className="size-3.5"
                                  />
                                ) : (
                                  <Pin
                                    aria-hidden="true"
                                    className="size-3.5 -rotate-45"
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
          "relative w-full overflow-auto rounded-md border",
          virtualized && "overflow-y-auto"
        )}
        style={virtualized ? { maxHeight } : undefined}
      >
        <Table
          className={cn(
            (enableColumnResizing || enableColumnOrdering || virtualized) &&
              "table-fixed"
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
                        "relative",
                        header.column.getIsPinned() && "bg-background"
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
                        <div className="flex items-center gap-1">
                          {isDraggable && (
                            <GripVertical
                              aria-hidden="true"
                              className="size-3.5 cursor-grab text-muted-foreground/60"
                            />
                          )}
                          {canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex flex-1 items-center gap-1.5 text-left font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
                              aria-label={`Ordenar por ${label}`}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {sortDir === "asc" ? (
                                <ArrowUp
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              ) : sortDir === "desc" ? (
                                <ArrowDown
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              ) : (
                                <ArrowUpDown
                                  aria-hidden="true"
                                  className="size-3.5 text-muted-foreground"
                                />
                              )}
                            </button>
                          ) : (
                            <div className="flex-1">
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
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50",
                            header.column.getIsResizing() && "bg-primary"
                          )}
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
            {hasColumnFilters && (
              <TableRow>
                {table.getHeaderGroups()[0]?.headers.map((header) => {
                  const filterMeta = header.column.columnDef.meta?.filter
                  const canFilter = header.column.getCanFilter()
                  return (
                    <TableHead
                      key={`f-${header.id}`}
                      style={pinStyle(header.column)}
                      className={cn(
                        "py-1.5",
                        header.column.getIsPinned() && "bg-background"
                      )}
                    >
                      {canFilter && filterMeta ? (
                        <ColumnFilter
                          column={header.column}
                          meta={filterMeta}
                        />
                      ) : null}
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
                        cell.column.getIsPinned() && "bg-background"
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
                  className="h-24 text-center text-muted-foreground"
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
  if (meta.type === "select") {
    return (
      <select
        value={value}
        onChange={(e) =>
          column.setFilterValue(e.target.value || undefined)
        }
        aria-label={`Filtrar ${column.id}`}
        className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      aria-label={`Filtrar ${column.id}`}
      className="h-7 text-xs"
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
  const initial = context.getValue() as string | number | null
  const [value, setValue] = React.useState<string>(
    initial == null ? "" : String(initial)
  )
  const [editing, setEditing] = React.useState(false)

  React.useEffect(() => {
    setValue(initial == null ? "" : String(initial))
  }, [initial])

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
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="block w-full rounded-sm px-1 py-0.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Editar ${context.column.id}`}
      >
        {value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </button>
    )
  }
  return (
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
      className="h-7"
    />
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
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <div className="text-muted-foreground">
        {enableRowSelection
          ? `${selected} de ${total} linha(s) selecionada(s).`
          : `${total} linha(s).`}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Linhas por página</span>
          <select
            aria-label="Linhas por página"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="text-muted-foreground">
          Página {pageIndex + 1} de {Math.max(pageCount, 1)}
        </div>
        <div className="flex items-center gap-1">
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
