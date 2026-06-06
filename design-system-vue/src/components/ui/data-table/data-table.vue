<script lang="ts">
import type { ColumnDef, RowData } from '@tanstack/vue-table';

declare module '@tanstack/vue-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
    editable?: boolean;
  }
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

export interface DataTableProps<TData> {
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
  virtualized?: boolean;
  virtualRowHeight?: number;
  maxHeight?: string;
  pageSizeOptions?: number[];
  pageSize?: number;
  emptyMessage?: string;
  class?: string;
}
</script>

<script setup lang="ts" generic="TData">
import { computed, defineComponent, h, ref, watch, onMounted } from 'vue';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type Column,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  GripVertical,
  Pin,
  PinOff,
  Search,
  Settings2,
} from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import DataTablePagination from './data-table-pagination.vue';

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  enableGlobalFilter: true,
  globalFilterPlaceholder: 'Buscar...',
  enableRowSelection: false,
  enableColumnVisibility: true,
  enableColumnFilters: false,
  enableColumnResizing: false,
  enableColumnOrdering: false,
  enableColumnPinning: false,
  enablePagination: true,
  virtualized: false,
  virtualRowHeight: 36,
  maxHeight: '480px',
  pageSize: 10,
  emptyMessage: 'Sem resultados.',
});

const emit = defineEmits<{
  (e: 'tableReady', table: TanstackTable<TData>): void;
  (e: 'cellEdit', rowIndex: number, columnId: string, value: unknown): void;
}>();

const pageSizeOptions = computed(() => props.pageSizeOptions ?? [10, 20, 50, 100]);

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref<RowSelectionState>({});
const globalFilter = ref('');
const columnOrder = ref<ColumnOrderState>([]);
const columnPinning = ref<ColumnPinningState>({ left: [], right: [] });
const columnSizing = ref<ColumnSizingState>({});
const draggedColumnId = ref<string | null>(null);

const allColumns = computed<DataTableColumn<TData>[]>(() => {
  const enriched = props.columns.map((col) => {
    const filter = col.meta?.filter;
    if (filter?.type === 'select' && !('filterFn' in col)) {
      return { ...col, filterFn: 'equals' as const };
    }
    return col;
  });
  if (!props.enableRowSelection) return enriched;
  const selectCol: DataTableColumn<TData> = {
    id: '__select__',
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 36,
    header: ({ table }) =>
      h(Checkbox, {
        'aria-label': 'Selecionar todas as linhas',
        modelValue: table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : false,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
      }),
    cell: ({ row }) =>
      h(Checkbox, {
        'aria-label': 'Selecionar linha',
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
      }),
  };
  return [selectCol, ...enriched];
});

const hasColumnFilters = computed(
  () => props.enableColumnFilters && allColumns.value.some((c) => !!c.meta?.filter),
);

const table = useVueTable<TData>({
  get data() {
    return props.data;
  },
  get columns() {
    return allColumns.value;
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
    get columnOrder() {
      return columnOrder.value;
    },
    get columnPinning() {
      return columnPinning.value;
    },
    get columnSizing() {
      return columnSizing.value;
    },
  },
  get enableRowSelection() {
    return props.enableRowSelection;
  },
  get enableColumnResizing() {
    return props.enableColumnResizing;
  },
  get enableColumnPinning() {
    return props.enableColumnPinning;
  },
  columnResizeMode: 'onChange',
  onSortingChange: (updater) => {
    sorting.value =
      typeof updater === 'function' ? updater(sorting.value) : updater;
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value =
      typeof updater === 'function' ? updater(columnFilters.value) : updater;
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value =
      typeof updater === 'function' ? updater(columnVisibility.value) : updater;
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value =
      typeof updater === 'function' ? updater(rowSelection.value) : updater;
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value =
      typeof updater === 'function' ? updater(globalFilter.value) : updater;
  },
  onColumnOrderChange: (updater) => {
    columnOrder.value =
      typeof updater === 'function' ? updater(columnOrder.value) : updater;
  },
  onColumnPinningChange: (updater) => {
    columnPinning.value =
      typeof updater === 'function' ? updater(columnPinning.value) : updater;
  },
  onColumnSizingChange: (updater) => {
    columnSizing.value =
      typeof updater === 'function' ? updater(columnSizing.value) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel:
    props.enablePagination && !props.virtualized
      ? getPaginationRowModel()
      : undefined,
  meta: {
    updateData: (rowIndex, columnId, value) => emit('cellEdit', rowIndex, columnId, value),
  },
  initialState: {
    pagination: { pageSize: props.pageSize },
  },
});

onMounted(() => {
  emit('tableReady', table as unknown as TanstackTable<TData>);
});

const scrollRef = ref<HTMLDivElement | null>(null);
const visibleLeafColumns = computed(() => table.getVisibleLeafColumns().length);
const rows = computed(() => table.getRowModel().rows);

const virtualizerInstance = useVirtualizer(
  computed(() => ({
    count: props.virtualized ? rows.value.length : 0,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => props.virtualRowHeight,
    overscan: 10,
  })),
);

const virtualRows = computed(() =>
  props.virtualized ? virtualizerInstance.value.getVirtualItems() : [],
);
const paddingTop = computed(() =>
  props.virtualized && virtualRows.value.length > 0 ? virtualRows.value[0].start : 0,
);
const paddingBottom = computed(() =>
  props.virtualized && virtualRows.value.length > 0
    ? virtualizerInstance.value.getTotalSize() -
      virtualRows.value[virtualRows.value.length - 1].end
    : 0,
);

const displayedRows = computed(() =>
  props.virtualized
    ? virtualRows.value.map((vr) => rows.value[vr.index])
    : rows.value,
);

function handleDragStart(columnId: string) {
  draggedColumnId.value = columnId;
}
function handleDragOver(e: DragEvent) {
  e.preventDefault();
}
function handleDrop(targetColumnId: string) {
  const dragged = draggedColumnId.value;
  if (!dragged || dragged === targetColumnId) {
    draggedColumnId.value = null;
    return;
  }
  const current =
    columnOrder.value.length > 0
      ? columnOrder.value
      : table.getAllLeafColumns().map((c) => c.id);
  const next = [...current];
  const from = next.indexOf(dragged);
  const to = next.indexOf(targetColumnId);
  if (from === -1 || to === -1) return;
  next.splice(from, 1);
  next.splice(to, 0, dragged);
  columnOrder.value = next;
  draggedColumnId.value = null;
}

function pinStyle(column: Column<TData, unknown> | undefined) {
  if (!column) return {} as Record<string, unknown>;
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  return {
    position: 'sticky' as const,
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: 1,
  };
}

function flexHeaderLabel(header: unknown): string | undefined {
  return typeof header === 'string' ? header : undefined;
}

function pinLabel(column: Column<TData, unknown>): string {
  const label = flexHeaderLabel(column.columnDef.header) ?? column.id;
  return column.getIsPinned() === 'left'
    ? `Desafixar ${label}`
    : `Fixar ${label} à esquerda`;
}

function togglePin(column: Column<TData, unknown>) {
  column.pin(column.getIsPinned() === 'left' ? false : 'left');
}

// EditableCell — local subcomponent for inline cell editing
const EditableCell = defineComponent({
  name: 'EditableCell',
  props: {
    context: { type: Object, required: true },
  },
  setup(p) {
    const initialVal = () => p.context.getValue() as string | number | null;
    const value = ref<string>(initialVal() == null ? '' : String(initialVal()));
    const editing = ref(false);

    watch(
      () => p.context.getValue(),
      (v) => {
        value.value = v == null ? '' : String(v);
      },
    );

    function commit() {
      const init = initialVal();
      const isNumber = typeof init === 'number';
      const next = isNumber ? Number(value.value) : value.value;
      p.context.table.options.meta?.updateData?.(
        p.context.row.index,
        p.context.column.id,
        next,
      );
      editing.value = false;
    }
    function cancel() {
      const init = initialVal();
      value.value = init == null ? '' : String(init);
      editing.value = false;
    }

    return () => {
      if (!editing.value) {
        return h(
          'button',
          {
            type: 'button',
            class:
              'block w-full rounded-sm px-1 py-0.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            'aria-label': `Editar ${p.context.column.id}`,
            onClick: () => {
              editing.value = true;
            },
          },
          value.value === ''
            ? h('span', { class: 'text-muted-foreground' }, '—')
            : value.value,
        );
      }
      return h(Input, {
        autofocus: true,
        modelValue: value.value,
        'onUpdate:modelValue': (v: string | number) => {
          value.value = String(v);
        },
        onBlur: commit,
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            cancel();
          }
        },
        class: 'h-7',
      });
    };
  },
});

// Re-render flag for resize / sort updates
const _renderTick = ref(0);
watch(
  () => [
    sorting.value,
    columnFilters.value,
    columnVisibility.value,
    rowSelection.value,
    globalFilter.value,
    columnOrder.value,
    columnPinning.value,
    columnSizing.value,
  ],
  () => {
    _renderTick.value++;
  },
  { deep: true },
);
</script>

<template>
  <div data-slot="data-table" :class="cn('flex flex-col gap-3', props.class)">
    <!-- Toolbar -->
    <div
      v-if="enableGlobalFilter || enableColumnVisibility"
      data-slot="data-table-toolbar"
      class="flex items-center gap-2"
    >
      <div v-if="enableGlobalFilter" class="relative max-w-sm flex-1">
        <Search
          aria-hidden="true"
          class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="globalFilter"
          :placeholder="globalFilterPlaceholder"
          :aria-label="globalFilterPlaceholder"
          class="pl-8"
        />
      </div>
      <DropdownMenu v-if="enableColumnVisibility">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="ml-auto">
            <Settings2 aria-hidden="true" />
            Colunas
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <template
              v-for="column in table.getAllLeafColumns().filter((c) => c.getCanHide())"
              :key="column.id"
            >
              <div class="flex items-center gap-1">
                <DropdownMenuCheckboxItem
                  class="flex-1 capitalize"
                  :model-value="column.getIsVisible()"
                  @update:model-value="(v: boolean) => column.toggleVisibility(!!v)"
                  @select.prevent
                >
                  {{ flexHeaderLabel(column.columnDef.header) ?? column.id }}
                </DropdownMenuCheckboxItem>
                <div v-if="enableColumnPinning" class="flex shrink-0 pr-1">
                  <button
                    type="button"
                    :aria-label="pinLabel(column)"
                    :class="
                      cn(
                        'inline-flex size-6 items-center justify-center rounded-md hover:bg-muted',
                        column.getIsPinned() === 'left' && 'text-primary',
                      )
                    "
                    @click="togglePin(column)"
                  >
                    <PinOff
                      v-if="column.getIsPinned() === 'left'"
                      aria-hidden="true"
                      class="size-3.5"
                    />
                    <Pin v-else aria-hidden="true" class="size-3.5 -rotate-45" />
                  </button>
                </div>
              </div>
            </template>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Scroll container -->
    <div
      ref="scrollRef"
      :class="
        cn(
          'relative w-full overflow-auto rounded-md border',
          virtualized && 'overflow-y-auto',
        )
      "
      :style="virtualized ? { maxHeight } : undefined"
    >
      <Table
        :class="
          cn(
            (enableColumnResizing || enableColumnOrdering || virtualized) &&
              'table-fixed',
          )
        "
      >
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :aria-sort="
                header.column.getIsSorted() === 'asc'
                  ? 'ascending'
                  : header.column.getIsSorted() === 'desc'
                    ? 'descending'
                    : header.column.getCanSort()
                      ? 'none'
                      : undefined
              "
              :style="{
                width: enableColumnResizing ? `${header.getSize()}px` : undefined,
                ...pinStyle(header.column),
              }"
              :class="
                cn(
                  'relative',
                  header.column.getIsPinned() && 'bg-background',
                )
              "
              :draggable="
                enableColumnOrdering && header.column.id !== '__select__'
              "
              @dragstart="
                enableColumnOrdering && header.column.id !== '__select__'
                  ? handleDragStart(header.column.id)
                  : undefined
              "
              @dragover="
                enableColumnOrdering && header.column.id !== '__select__'
                  ? handleDragOver($event)
                  : undefined
              "
              @drop="
                enableColumnOrdering && header.column.id !== '__select__'
                  ? handleDrop(header.column.id)
                  : undefined
              "
            >
              <template v-if="!header.isPlaceholder">
                <div class="flex items-center gap-1">
                  <GripVertical
                    v-if="
                      enableColumnOrdering && header.column.id !== '__select__'
                    "
                    aria-hidden="true"
                    class="size-3.5 cursor-grab text-muted-foreground/60"
                  />
                  <button
                    v-if="header.column.getCanSort()"
                    type="button"
                    class="inline-flex flex-1 items-center gap-1.5 text-left font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
                    :aria-label="`Ordenar por ${
                      flexHeaderLabel(header.column.columnDef.header) ??
                      header.column.id
                    }`"
                    @click="header.column.getToggleSortingHandler()?.($event)"
                  >
                    <FlexRender
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                    <ArrowUp
                      v-if="header.column.getIsSorted() === 'asc'"
                      aria-hidden="true"
                      class="size-3.5"
                    />
                    <ArrowDown
                      v-else-if="header.column.getIsSorted() === 'desc'"
                      aria-hidden="true"
                      class="size-3.5"
                    />
                    <ArrowUpDown
                      v-else
                      aria-hidden="true"
                      class="size-3.5 text-muted-foreground"
                    />
                  </button>
                  <div v-else class="flex-1">
                    <FlexRender
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                  </div>
                </div>
              </template>
              <div
                v-if="enableColumnResizing && header.column.getCanResize()"
                role="separator"
                aria-orientation="vertical"
                :aria-label="`Redimensionar coluna ${
                  flexHeaderLabel(header.column.columnDef.header) ??
                  header.column.id
                }`"
                :class="
                  cn(
                    'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50',
                    header.column.getIsResizing() && 'bg-primary',
                  )
                "
                @mousedown="header.getResizeHandler()?.($event)"
                @touchstart="header.getResizeHandler()?.($event)"
              />
            </TableHead>
          </TableRow>
          <TableRow v-if="hasColumnFilters">
            <TableHead
              v-for="header in table.getHeaderGroups()[0]?.headers ?? []"
              :key="`f-${header.id}`"
              :style="pinStyle(header.column)"
              :aria-label="
                header.column.getCanFilter() && header.column.columnDef.meta?.filter
                  ? undefined
                  : 'Sem filtro disponível'
              "
              :class="
                cn(
                  'py-1.5',
                  header.column.getIsPinned() && 'bg-background',
                )
              "
            >
              <template
                v-if="header.column.getCanFilter() && header.column.columnDef.meta?.filter"
              >
                <select
                  v-if="header.column.columnDef.meta.filter.type === 'select'"
                  :value="(header.column.getFilterValue() ?? '') as string"
                  :aria-label="`Filtrar ${header.column.id}`"
                  class="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  @change="(e) => header.column.setFilterValue((e.target as HTMLSelectElement).value || undefined)"
                >
                  <option value="">Todos</option>
                  <option
                    v-for="opt in header.column.columnDef.meta.filter.options ?? []"
                    :key="opt"
                    :value="opt"
                  >
                    {{ opt }}
                  </option>
                </select>
                <Input
                  v-else
                  :model-value="(header.column.getFilterValue() ?? '') as string"
                  :placeholder="header.column.columnDef.meta.filter.placeholder ?? 'Filtrar...'"
                  :aria-label="`Filtrar ${header.column.id}`"
                  class="h-7 text-xs"
                  @update:model-value="(v) => header.column.setFilterValue(v)"
                />
              </template>
              <span v-else class="sr-only">Sem filtro</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr v-if="paddingTop > 0" aria-hidden="true">
            <td :colspan="visibleLeafColumns" :style="{ height: `${paddingTop}px` }" />
          </tr>
          <template v-if="rows.length">
            <TableRow
              v-for="row in displayedRows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :style="{
                  width: enableColumnResizing ? `${cell.column.getSize()}px` : undefined,
                  ...pinStyle(cell.column),
                }"
                :class="cn(cell.column.getIsPinned() && 'bg-background')"
              >
                <EditableCell
                  v-if="cell.column.columnDef.meta?.editable"
                  :context="cell.getContext()"
                />
                <FlexRender
                  v-else
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell
              :colspan="visibleLeafColumns"
              class="h-24 text-center text-muted-foreground"
            >
              {{ emptyMessage }}
            </TableCell>
          </TableRow>
          <tr v-if="paddingBottom > 0" aria-hidden="true">
            <td :colspan="visibleLeafColumns" :style="{ height: `${paddingBottom}px` }" />
          </tr>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination
      v-if="enablePagination && !virtualized"
      :table="(table as unknown as TanstackTable<TData>)"
      :page-size-options="pageSizeOptions"
      :enable-row-selection="enableRowSelection"
    />
  </div>
</template>

