<script lang="ts">
import type { ColumnDef, RowData } from '@tanstack/vue-table';
import {
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
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
} from '@tanstack/vue-table';

// ─── Os RECURSOS que esta tabela usa ──────────────────────────────────────────
//
// No TanStack 9 os recursos deixam de vir todos ligados: cada um é registrado
// aqui, e só o que está nesta lista entra no pacote. É por isso que o bloco
// existe — e por isso que ele é a fonte de verdade sobre o que o DataTable faz.
//
// Os dois `meta` também mudaram de lugar, e para melhor. Antes era
// `declare module '@tanstack/vue-table'`: augmentação GLOBAL, que vazava os
// nossos campos para qualquer outra tabela do projeto que importasse a lib.
// Agora são slots de tipo dentro do próprio conjunto — o escopo é este
// componente, e acabou.
type DataTableColumnMeta = {
  filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
  editable?: boolean;
};

type DataTableTableMeta = {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
};

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
};

/**
 * Dois conjuntos, e não um com a paginação desligada por opção.
 *
 * O modelo de linhas paginado é um RECURSO no 9, não mais um `get*RowModel`
 * passado por chamada — e recurso registrado é recurso ativo. Como a tabela
 * virtualizada entrega todas as linhas de propósito (quem recorta é o
 * virtualizador, não a paginação), ela precisa de um conjunto que simplesmente
 * não tenha o recurso.
 */
export const RECURSOS_COM_PAGINACAO = tableFeatures({
  ...RECURSOS_BASE,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export const RECURSOS_SEM_PAGINACAO = tableFeatures(RECURSOS_BASE);

/** O conjunto completo — é ele que tipa tudo que sai deste módulo. */
export type DataTableFeatures = typeof RECURSOS_COM_PAGINACAO;

export type DataTableColumn<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

/**
 * Todo texto que a tabela escreve na tela ou entrega ao leitor.
 *
 * Existe porque o componente tinha as frases cravadas em português no meio do
 * markup: quem monta uma tabela de faturas não conseguia dizer "Selecionar
 * fatura" nem trocar de idioma sem reescrever o componente.
 *
 * As chaves que dependem de um dado são FUNÇÃO, e não template com `{col}`:
 * função é a forma que TypeScript sabe checar (aridade e tipo de argumento) e
 * que não obriga ninguém a decorar o nome do buraco. `rowsSelected` recebe os
 * dois números porque a ordem deles muda de idioma para idioma.
 */
export interface DataTableLabels {
  columns: string;
  showColumns: string;
  selectAll: string;
  selectRow: (row: string) => string;
  sortBy: (col: string) => string;
  filter: (col: string) => string;
  noFilter: (col: string) => string;
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

/**
 * O padrão é o texto que o componente já dizia — trocar de API não podia mudar
 * o que a tela mostra a quem nunca passou `labels`.
 */
export const DATA_TABLE_LABELS_PADRAO: DataTableLabels = {
  columns: 'Colunas',
  showColumns: 'Exibir colunas',
  selectAll: 'Selecionar todas as linhas',
  selectRow: (r) => `Selecionar linha ${r}`,
  sortBy: (c) => `Ordenar por ${c}`,
  filter: (c) => `Filtrar ${c}`,
  noFilter: (c) => `Sem filtro para ${c}`,
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

export interface DataTableProps<TData extends RowData> {
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
  /**
   * Nome acessível da tabela. Sai como `<caption>` fora da tela: é o que o
   * leitor anuncia ao entrar na grade, e sem ele a pessoa cai numa "tabela, 6
   * colunas" sem saber de quê.
   */
  caption?: string;
  /**
   * Identidade estável da linha. Sem ela a identidade é a POSIÇÃO, e ordenar
   * ou filtrar move a marcação de linha.
   */
  rowKey?: (row: TData, index: number) => string;
  /** Texto que identifica a linha no nome do controle de seleção. */
  rowLabel?: (row: TData) => string;
  /** Só as chaves informadas mudam; o resto continua no padrão. */
  labels?: Partial<DataTableLabels>;
  class?: string;
}
</script>

<script setup lang="ts" generic="TData extends RowData">
import { computed, defineComponent, h, ref, watch, onMounted } from 'vue';
import {
  FlexRender,
  useTable,
  type Column,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type ColumnVisibilityState,
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
  TableCaption,
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
  (e: 'tableReady', table: TanstackTable<DataTableFeatures, TData>): void;
  (e: 'cellEdit', rowIndex: number, columnId: string, value: unknown): void;
}>();

const pageSizeOptions = computed(() => props.pageSizeOptions ?? [10, 20, 50, 100]);

/*
 * Mescla rasa, e de propósito: `labels` é um mapa de folhas (strings e
 * funções), então quem passa três chaves fica com as outras dezoito no padrão.
 * Computado porque `labels` pode chegar de um `computed` de idioma lá em cima —
 * congelar no setup deixaria a tabela em português depois da troca de locale.
 */
const rotulos = computed<DataTableLabels>(() => ({
  ...DATA_TABLE_LABELS_PADRAO,
  ...(props.labels ?? {}),
}));

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
function rotuloDaLinha(row: Row<DataTableFeatures, TData>): string {
  if (props.rowLabel) return props.rowLabel(row.original);
  const primeira = row.getAllCells().find((c) => c.column.id !== '__select__');
  const bruto = primeira?.getValue();
  return bruto == null || bruto === '' ? row.id : String(bruto);
}

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<ColumnVisibilityState>({});
const rowSelection = ref<RowSelectionState>({});
const globalFilter = ref('');
const columnOrder = ref<ColumnOrderState>([]);
const columnPinning = ref<ColumnPinningState>({ start: [], end: [] });
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
        'aria-label': rotulos.value.selectAll,
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
        // O identificador da linha entra no nome: dez caixas chamadas
        // "Selecionar linha" são dez controles indistinguíveis na lista do
        // leitor, e a marcação vira aposta.
        'aria-label': rotulos.value.selectRow(rotuloDaLinha(row)),
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

const table = useTable({
  /*
   * O elenco é escolhido em tempo de execução, e os dois têm tipos diferentes —
   * o sem paginação é subconjunto do outro. O TS não estreita uma união de
   * conjuntos de recursos, então a asserção declara o que o guarda já garante:
   * nenhum caminho chama API de paginação quando o recurso não está registrado.
   */
  features: (props.enablePagination && !props.virtualized
    ? RECURSOS_COM_PAGINACAO
    : RECURSOS_SEM_PAGINACAO) as DataTableFeatures,
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
  /*
   * A identidade da linha vem do DADO, quando quem usa souber dizer qual campo
   * a identifica. Sem isto a chave é o índice na lista, e o que estava marcado
   * na terceira posição segue marcado na terceira posição depois de reordenar —
   * a marcação anda de linha. Getter, e não valor: a função pode trocar.
   */
  get getRowId() {
    return props.rowKey ? (row: TData, index: number) => props.rowKey!(row, index) : undefined;
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
  meta: {
    updateData: (rowIndex, columnId, value) => emit('cellEdit', rowIndex, columnId, value),
  },
  initialState: {
    pagination: { pageIndex: 0, pageSize: props.pageSize },
  },
});

onMounted(() => {
  emit('tableReady', table as unknown as TanstackTable<DataTableFeatures, TData>);
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

function pinStyle(column: Column<DataTableFeatures, TData, unknown> | undefined) {
  if (!column) return {} as Record<string, unknown>;
  const pinned = column.getIsPinned();
  if (!pinned) return {};
  return {
    position: 'sticky' as const,
    left: pinned === 'start' ? `${column.getStart('start')}px` : undefined,
    right: pinned === 'end' ? `${column.getAfter('end')}px` : undefined,
    zIndex: 1,
  };
}

function flexHeaderLabel(header: unknown): string | undefined {
  return typeof header === 'string' ? header : undefined;
}

/** Rótulo da coluna como a pessoa lê no cabeçalho — nunca o id de dados. */
function nomeDaColuna(column: Column<DataTableFeatures, TData, unknown>): string {
  return flexHeaderLabel(column.columnDef.header) ?? column.id;
}

function pinLabel(column: Column<DataTableFeatures, TData, unknown>): string {
  const label = nomeDaColuna(column);
  return column.getIsPinned() === 'start'
    ? rotulos.value.unpin(label)
    : rotulos.value.pinLeft(label);
}

function togglePin(column: Column<DataTableFeatures, TData, unknown>) {
  column.pin(column.getIsPinned() === 'start' ? false : 'start');
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
      // O `blur` também confirma — e o Escape sai da edição ANTES dele. Sem
      // esta guarda, descartar com Escape disparava `cellEdit` mesmo assim: o
      // valor voltava na tela e quem consome recebia a edição cancelada.
      if (!editing.value) return;
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
      // Mesmo rótulo no botão e no campo, e tirado do CABEÇALHO e não do id:
      // o id é chave de dados (`customer`, `amount`) e virava "Editar amount".
      const rotulo = rotulos.value.edit(
        flexHeaderLabel(p.context.column.columnDef.header) ?? p.context.column.id,
      );
      if (!editing.value) {
        return h('div', { class: 'nds-data-table-editable' }, [
          h(
            'button',
            {
              type: 'button',
              class:
                'nds-data-table-edit-btn',
              'aria-label': rotulo,
              onClick: () => {
                editing.value = true;
              },
            },
            value.value === ''
              ? h('span', { class: 'nds-dt-icon-muted' }, '—')
              : value.value,
          ),
        ]);
      }
      return h('div', { class: 'nds-data-table-editable' }, [
        h(Input, {
          // `autofocus` é ATRIBUTO: o navegador só o honra no primeiro parse do
          // documento, e aqui o campo nasce depois, trocado no lugar do botão.
          // Sem o foco programático quem abriu a edição com Enter perdia o
          // ponto de partida e o campo ficava inalcançável pelo teclado.
          autofocus: true,
          onVnodeMounted: (vnode) => {
            const el = vnode.el as HTMLInputElement | null;
            el?.focus();
            el?.select();
          },
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
          // Sem isto o campo aberto não tem NOME nenhum: o leitor anuncia
          // "edição, em branco" e não diz de que coluna. WCAG 4.1.2, nível A.
          'aria-label': rotulo,
          class: 'nds-data-table-edit-input',
        }),
      ]);
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
  <div
    data-slot="data-table"
    :class="cn('nds-data-table', props.class)"
  >
    <!-- Toolbar -->
    <div
      v-if="enableGlobalFilter || enableColumnVisibility"
      data-slot="data-table-toolbar"
      class="nds-data-table-toolbar"
    >
      <div
        v-if="enableGlobalFilter"
        class="nds-data-table-search"
      >
        <Search
          aria-hidden="true"
          class="nds-dt-icon nds-dt-icon-muted"
        />
        <!--
          `type="search"` é o que dá a este campo o papel `searchbox` na árvore
          de acessibilidade. Sem ele o leitor anuncia "campo de edição" e o
          filtro global fica indistinguível de um campo de formulário qualquer.
        -->
        <Input
          v-model="globalFilter"
          type="search"
          :placeholder="globalFilterPlaceholder"
          :aria-label="globalFilterPlaceholder"
          class="nds-data-table-search-input"
        />
      </div>
      <DropdownMenu v-if="enableColumnVisibility">
        <DropdownMenuTrigger as-child>
          <Button
            variant="outline"
            size="sm"
            class="nds-data-table-columns-btn"
          >
            <Settings2 aria-hidden="true" />
            {{ rotulos.columns }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="nds-data-table-columns-menu-content"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{{ rotulos.showColumns }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <template
              v-for="column in table.getAllLeafColumns().filter((c) => c.getCanHide())"
              :key="column.id"
            >
              <div class="nds-data-table-columns-menu-row">
                <DropdownMenuCheckboxItem
                  class="nds-data-table-columns-menu-check"
                  :model-value="column.getIsVisible()"
                  @update:model-value="(v: boolean) => column.toggleVisibility(!!v)"
                  @select.prevent
                >
                  {{ flexHeaderLabel(column.columnDef.header) ?? column.id }}
                </DropdownMenuCheckboxItem>
                <div
                  v-if="enableColumnPinning"
                  class="nds-data-table-pin-wrap"
                >
                  <button
                    type="button"
                    :aria-label="pinLabel(column)"
                    :class="cn( 'nds-data-table-pin-btn', column.getIsPinned() === 'start' && 'is-active', )"
                    @click="togglePin(column)"
                  >
                    <PinOff
                      v-if="column.getIsPinned() === 'start'"
                      aria-hidden="true"
                      class="nds-dt-icon"
                    />
                    <Pin
                      v-else
                      aria-hidden="true"
                      class="nds-dt-icon nds-dt-icon-pin"
                    />
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
      :class="cn( 'nds-data-table-scroll', virtualized && 'nds-data-table-scroll-virtual', )"
      :style="virtualized ? { maxHeight } : undefined"
    >
      <Table
        :class="cn( (enableColumnResizing || enableColumnOrdering || virtualized) && 'nds-table-fixed', )"
      >
        <!--
          PRIMEIRO filho de `<table>` porque o HTML exige isso da tag `caption`
          — em qualquer outra posição o navegador a move ou a descarta, e o nome
          acessível da tabela some junto. Fora da tela: é orientação para quem
          não vê a grade, e repetir na tela um título que já existe acima seria
          ruído para quem vê.
        -->
        <TableCaption
          v-if="caption"
          class="nds-sr-only"
        >
          {{ caption }}
        </TableCaption>
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
              :class="cn( 'nds-data-table-th', header.column.getIsPinned() && 'nds-data-table-th-pinned', )"
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
                <div class="nds-data-table-th-inner">
                  <GripVertical
                    v-if="
                      enableColumnOrdering && header.column.id !== '__select__'
                    "
                    aria-hidden="true"
                    class="nds-dt-icon nds-dt-icon-grip"
                  />
                  <button
                    v-if="header.column.getCanSort()"
                    type="button"
                    class="nds-data-table-sort-btn"
                    :aria-label="rotulos.sortBy(nomeDaColuna(header.column))"
                    @click="header.column.getToggleSortingHandler()?.($event)"
                  >
                    <FlexRender
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                    <ArrowUp
                      v-if="header.column.getIsSorted() === 'asc'"
                      aria-hidden="true"
                      class="nds-dt-icon"
                    />
                    <ArrowDown
                      v-else-if="header.column.getIsSorted() === 'desc'"
                      aria-hidden="true"
                      class="nds-dt-icon"
                    />
                    <ArrowUpDown
                      v-else
                      aria-hidden="true"
                      class="nds-dt-icon nds-dt-icon-muted"
                    />
                  </button>
                  <div
                    v-else
                    class="nds-data-table-th-label"
                  >
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
                :aria-label="rotulos.resize(nomeDaColuna(header.column))"
                :class="cn( 'nds-data-table-resize-handle', header.column.getIsResizing() && 'is-resizing', )"
                @mousedown="header.getResizeHandler()?.($event)"
                @touchstart="header.getResizeHandler()?.($event)"
              />
            </TableHead>
          </TableRow>
          <TableRow
            v-if="hasColumnFilters"
            class="nds-data-table-filter-row"
          >
            <TableHead
              v-for="header in table.getHeaderGroups()[0]?.headers ?? []"
              :key="`f-${header.id}`"
              :style="pinStyle(header.column)"
              :class="cn( header.column.getIsPinned() && 'nds-data-table-th-pinned', )"
            >
              <template
                v-if="header.column.getCanFilter() && header.column.columnDef.meta?.filter"
              >
                <!--
                  O rótulo sai do CABEÇALHO, não do id. O id é chave de dados —
                  `customer`, `amount` — e virava "Filtrar customer" numa
                  interface em português.
                -->
                <select
                  v-if="header.column.columnDef.meta.filter.type === 'select'"
                  :value="(header.column.getFilterValue() ?? '') as string"
                  :aria-label="rotulos.filter(nomeDaColuna(header.column))"
                  class="nds-data-table-filter-select"
                  @change="(e) => header.column.setFilterValue((e.target as HTMLSelectElement).value || undefined)"
                >
                  <option value="">
                    {{ rotulos.allOption }}
                  </option>
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
                  :aria-label="rotulos.filter(nomeDaColuna(header.column))"
                  class="nds-data-table-filter-input"
                  @update:model-value="(v) => header.column.setFilterValue(v)"
                />
              </template>
              <!--
                axe empty-table-header: o valor de um campo não entra no nome
                acessível da célula, então a coluna sem filtro chegaria ao leitor
                como cabeçalho vazio. O nome da coluna entra no texto porque
                "Sem filtro" repetido em três células é o mesmo que vazio.
              -->
              <span
                v-else
                class="nds-sr-only"
              >{{ rotulos.noFilter(nomeDaColuna(header.column)) }}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr
            v-if="paddingTop > 0"
            aria-hidden="true"
          >
            <td
              :colspan="visibleLeafColumns"
              :style="{ height: `${paddingTop}px` }"
            />
          </tr>
          <template v-if="rows.length">
            <TableRow
              v-for="row in displayedRows"
              :key="row.id"
              class="nds-data-table-tr"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :style="{
                  width: enableColumnResizing ? `${cell.column.getSize()}px` : undefined,
                  ...pinStyle(cell.column),
                }"
                :class="cn('nds-data-table-td', cell.column.getIsPinned() && 'nds-data-table-td-pinned')"
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
              class="nds-data-table-empty"
            >
              {{ emptyMessage }}
            </TableCell>
          </TableRow>
          <tr
            v-if="paddingBottom > 0"
            aria-hidden="true"
          >
            <td
              :colspan="visibleLeafColumns"
              :style="{ height: `${paddingBottom}px` }"
            />
          </tr>
        </TableBody>
      </Table>
    </div>

    <!--
      A linha marcada muda de FUNDO — e cor sozinha não chega a quem não
      enxerga. A contagem existia só no rodapé da paginação, num `div` mudo que
      sumia junto com ela quando `enablePagination` era falso ou a tabela era
      virtualizada. Aqui ela é região viva e não depende do rodapé.
      WCAG 4.1.3 (Status Messages), nível AA.
    -->
    <div
      v-if="enableRowSelection"
      class="nds-sr-only"
      role="status"
      aria-live="polite"
    >
      {{ rotulos.rowsSelected(table.getFilteredSelectedRowModel().rows.length, table.getFilteredRowModel().rows.length) }}
    </div>

    <DataTablePagination
      v-if="enablePagination && !virtualized"
      :table="(table as unknown as TanstackTable<DataTableFeatures, TData>)"
      :page-size-options="pageSizeOptions"
      :enable-row-selection="enableRowSelection"
      :labels="rotulos"
    />
  </div>
</template>

