// ─── DataTable — Vanilla TS factory sobre TanStack Table v8 (headless) ──────
//
// API espelha o componente React (data-table.tsx). Cada recurso é uma flag
// opcional. Suporta filtro global, filtros por coluna, seleção, paginação,
// redimensionamento, reordenação, fixação, edição inline e virtualização.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import {
  constructTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type Updater,
  type columnResizingState,
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
} from '@tanstack/table-core';
import { storeReactivityBindings } from '@tanstack/table-core/store-reactivity-bindings';
import type { TableReactivityBindings } from '@tanstack/table-core/reactivity';
import { Virtualizer, observeElementRect, observeElementOffset, elementScroll } from '@tanstack/virtual-core';

import {
  createTable as createTableWrapper,
  createTableHeader,
  createTableBody,
  createTableRow,
  createTableCaption,
} from './table';
import { createCheckbox } from './checkbox';
import { createInput } from './input';
import { createButton } from './button';
import DOMPurify from 'dompurify';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Os RECURSOS que esta tabela usa ──────────────────────────────────────────
//
// No TanStack 9 os recursos deixam de vir todos ligados: cada um é registrado
// aqui, e só o que está nesta lista entra no pacote. É por isso que o bloco
// existe — e por isso que ele é a fonte de verdade sobre o que o DataTable faz.
//
// Os dois `meta` também mudaram de lugar, e para melhor. Antes era
// `declare module '@tanstack/table-core'`: augmentação GLOBAL, que vazava os
// nossos campos para qualquer outra tabela do projeto que importasse a lib, e
// exigia repetir `TData`/`TValue` só para casar a assinatura. Agora são slots
// de tipo dentro do próprio conjunto — o escopo é este componente, e acabou.
type DataTableColumnMeta<TData extends RowData> = {
  filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
  editable?: boolean;
  headerLabel?: string;
  /** Renderiza conteúdo customizado para a célula (string ou HTMLElement). */
  renderCell?: (ctx: { value: unknown; row: TData; rowIndex: number }) => string | HTMLElement;
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
  columnMeta: {} as DataTableColumnMeta<RowData>,
  tableMeta: {} as DataTableTableMeta,
};

/**
 * O conjunto COMPLETO, com paginação. É esta função que dá nome ao tipo — e ela
 * é chamada de verdade, no caminho paginado da fábrica abaixo. Antes o nome saía
 * de uma função que ninguém chamava, e o lint cobrou, com razão.
 */
function recursosCompletos(reatividade: TableReactivityBindings) {
  return tableFeatures({
    ...RECURSOS_BASE,
    coreReactivityFeature: reatividade,
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
  });
}

/** O conjunto completo — é ele que tipa tudo que sai deste módulo. */
export type DataTableFeatures = ReturnType<typeof recursosCompletos>;

/**
 * Uma FÁBRICA, e não uma constante de módulo.
 *
 * `constructTable` — o construtor agnóstico de framework — exige que alguém
 * forneça as ligações de reatividade. React e Vue recebem as do adaptador; aqui
 * não há adaptador, então usamos as que o próprio core publica para uso vanilla.
 * E elas guardam estado por instância (assinaturas, desmontagem): compartilhar
 * um conjunto entre tabelas misturaria as assinaturas de todas elas. Por isso o
 * conjunto nasce a cada tabela.
 *
 * O parâmetro escolhe o elenco. O modelo de linhas paginado é um RECURSO no 9,
 * não mais um `get*RowModel` passado por chamada — e recurso registrado é
 * recurso ativo. Como a tabela virtualizada entrega todas as linhas de propósito
 * (quem recorta é o virtualizador, não a paginação), ela precisa de um conjunto
 * que simplesmente não tenha o recurso.
 */
function createRecursos(comPaginacao: boolean): DataTableFeatures {
  const reatividade = storeReactivityBindings();
  return comPaginacao
    ? recursosCompletos(reatividade)
    : (tableFeatures({
        ...RECURSOS_BASE,
        coreReactivityFeature: reatividade,
      }) as DataTableFeatures);
}

export type DataTableColumn<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;

export interface DataTableOptions<TData extends RowData> {
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
  /**
   * Nome acessível da tabela. Vira `<caption>` fora da tela.
   *
   * Fora da tela e não ausente: quem enxerga já sabe que tabela é essa pelo
   * título da página em volta, e quem entra pela árvore de acessibilidade
   * encontraria só "tabela, 6 colunas". A legenda é o único jeito de a grade
   * dizer o próprio nome sem ocupar espaço visual.
   */
  caption?: string;
  /**
   * Identificador estável da linha. Sem ele, a identidade da linha é a posição
   * — e ordenar passaria a marcação para quem ocupou o lugar.
   */
  rowKey?: (row: TData, index: number) => string;
  /** Texto que identifica a linha no rótulo do controle de seleção. */
  rowLabel?: (row: TData) => string;
  /** Labels e textos i18n. */
  labels?: Partial<DataTableLabels>;
  className?: string;
  onTableReady?: (table: TanstackTable<DataTableFeatures, TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}

/**
 * Contrato de textos comum às quatro stacks que rodam TanStack.
 *
 * `selectRow` recebe o identificador da linha em vez de ser texto fixo: dez
 * controles com o mesmo nome são, para quem navega pela lista de controles do
 * leitor, dez controles sem nome (WCAG 4.1.2).
 *
 * `noFilter` existe porque o texto da célula sem filtro estava cravado em
 * português dentro do `renderHeader` — invisível para quem troca os labels.
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

const DEFAULT_LABELS: DataTableLabels = {
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
  // ICONS contém apenas strings literais constantes (sem dados do usuário),
  // mas wrappamos via DOMPurify.sanitize pra deixar a chain segura mesmo se um
  // chamador externo passar HTML não-confiável.
  wrap.innerHTML = DOMPurify.sanitize(html);
  return wrap.firstElementChild as SVGSVGElement;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headerLabel<TData extends RowData>(col: DataTableColumn<TData>, fallback: string): string {
  if (col.meta?.headerLabel) return col.meta.headerLabel;
  if (typeof col.header === 'string') return col.header;
  return fallback;
}

function appendCellContent<TData extends RowData>(
  td: HTMLTableCellElement,
  value: unknown,
  col: DataTableColumn<TData>,
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
): DestroyableElement {
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
    caption,
    rowKey,
    rowLabel,
    className,
    onTableReady,
    onCellEdit,
  } = options;

  const L: DataTableLabels = { ...DEFAULT_LABELS, ...(options.labels ?? {}) };

  // ── State (mantido no closure; passado ao TanStack via state + onChange) ──
  let sorting: SortingState = [];
  let columnFilters: ColumnFiltersState = [];
  let columnVisibility: ColumnVisibilityState = {};
  let rowSelection: RowSelectionState = {};
  let globalFilter = '';
  let columnOrder: ColumnOrderState = [];
  let columnPinning: ColumnPinningState = { start: [], end: [] };
  let columnSizing: ColumnSizingState = {};
  let pagination = { pageIndex: 0, pageSize };
  // O arrasto da alça acumula o delta em `columnResizing`. Sem este estado
  // controlado E o handler correspondente, o `onStateChange` vazio engolia cada
  // atualização e o redimensionamento não movia um pixel — a alça existia, o
  // ponteiro arrastava e a coluna ficava parada.
  let columnResizing: columnResizingState = {
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  };
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
  root.className = cn('nds-data-table', className);

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.dataset.slot = 'data-table-toolbar';
  toolbar.className = 'nds-data-table-toolbar';

  // ── Contêiner externo ────────────────────────────────────────────────────
  //
  // MOLDURA (borda, raio) e, no modo virtualizado, a rolagem VERTICAL — que
  // precisa ficar aqui porque é a altura máxima deste elemento que o
  // virtualizador mede.
  //
  // A rolagem HORIZONTAL não é dele. Este `div` não está na ordem de tabulação,
  // e enquanto ele rolava as colunas fora da tela eram inalcançáveis por teclado
  // (WCAG 2.1.1, axe `scrollable-region-focusable`). Quem rola na horizontal é o
  // `.nds-table-wrapper` do primitivo Table, o único dos dois que carrega
  // `tabindex="0"` — e é por isso que a classe `nds-data-table-table-wrapper`,
  // que zerava o `overflow` dele, deixou de ser aplicada aqui. Sem ela o dono do
  // overflow horizontal é um só, e é o alcançável.
  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'nds-data-table-scroll';
  if (virtualized) {
    scrollContainer.classList.add('nds-data-table-scroll-virtual');
    scrollContainer.style.maxHeight = maxHeight;
  }

  const { wrapper: tableWrapper, table: tableEl } = createTableWrapper();
  if (enableColumnResizing || enableColumnOrdering || virtualized) {
    tableEl.classList.add('nds-table-fixed');
  }

  // A legenda tem de ser o PRIMEIRO filho de `<table>` — em qualquer outra
  // posição o parser de HTML a move ou a descarta. Por isso ela entra antes do
  // `thead`, e não em algum ponto conveniente do render.
  if (caption) tableEl.appendChild(createTableCaption(caption, 'nds-sr-only'));

  const thead = createTableHeader();
  const tbody = createTableBody();
  tableEl.append(thead, tbody);
  scrollContainer.appendChild(tableWrapper);

  const pagFooter = document.createElement('div');
  pagFooter.dataset.slot = 'data-table-pagination';
  pagFooter.className = 'nds-data-table-pagination';

  // A linha marcada muda de FUNDO — e cor sozinha não chega a quem não enxerga.
  // A contagem existia só no rodapé da paginação, num `div` mudo que sumia
  // junto com ela quando `enablePagination` era falso ou a tabela era
  // virtualizada. Aqui ela é região viva e não depende do rodapé.
  // WCAG 4.1.3 (Status Messages), nível AA.
  //
  // O nó é criado UMA vez e só o texto muda: região viva que nasce junto com o
  // conteúdo não é anunciada.
  const regiaoViva = document.createElement('div');
  regiaoViva.className = 'nds-sr-only';
  regiaoViva.setAttribute('role', 'status');
  regiaoViva.setAttribute('aria-live', 'polite');

  root.append(toolbar, scrollContainer);
  if (enableRowSelection) root.appendChild(regiaoViva);
  root.appendChild(pagFooter);

  // ── TanStack table instance ──────────────────────────────────────────────
  const table = constructTable({
    features: createRecursos(enablePagination && !virtualized),
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
    // Sem `getRowId` a identidade da linha é o índice dela nos dados. Isso
    // basta enquanto nada muda de lugar, e passa a mentir assim que quem
    // consome troca o array por um recorte com outra ordem: o que estava
    // marcado continua "na linha 3", que agora é outra fatura.
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
    onSortingChange: (u: Updater<SortingState>) => { sorting = resolveUpdater(sorting, u); sync(); rerender(); },
    onColumnFiltersChange: (u: Updater<ColumnFiltersState>) => { columnFilters = resolveUpdater(columnFilters, u); sync(); rerenderNoHeader(); },
    onColumnVisibilityChange: (u: Updater<ColumnVisibilityState>) => { columnVisibility = resolveUpdater(columnVisibility, u); sync(); rerender(); },
    onRowSelectionChange: (u: Updater<RowSelectionState>) => { rowSelection = resolveUpdater(rowSelection, u); sync(); rerender(); },
    onGlobalFilterChange: (u: Updater<string>) => { globalFilter = resolveUpdater(globalFilter, u); sync(); rerenderNoHeader(); },
    onColumnOrderChange: (u: Updater<ColumnOrderState>) => { columnOrder = resolveUpdater(columnOrder, u); sync(); rerender(); },
    onColumnPinningChange: (u: Updater<ColumnPinningState>) => { columnPinning = resolveUpdater(columnPinning, u); sync(); rerender(); },
    // Redimensionar NÃO reconstrói a grade: a alça que está sendo arrastada é
    // filha do `th`, e reconstruir o cabeçalho a cada pixel destruía o elemento
    // sob o cursor — o arrasto parava no primeiro movimento. Só as larguras
    // mudam, e é só elas que este caminho escreve.
    onColumnSizingChange: (u: Updater<ColumnSizingState>) => { columnSizing = resolveUpdater(columnSizing, u); sync(); updateLarguras(); },
    onColumnResizingChange: (u: Updater<columnResizingState>) => { columnResizing = resolveUpdater(columnResizing, u); sync(); },
    // Trocar de página também NÃO reconstrói o cabeçalho. E não é só economia:
    // filtrar zera a página automaticamente (`autoResetPageIndex`), então cada
    // tecla digitada num filtro por coluna passava por aqui e reconstruía o
    // `thead` — o campo com foco saía do DOM e a segunda letra caía fora dele.
    onPaginationChange: (u: Updater<{ pageIndex: number; pageSize: number }>) => { pagination = resolveUpdater(pagination, u); sync(); rerenderNoHeader(); },
    meta: {
      updateData: onCellEdit,
    },
    renderFallbackValue: null,
  } as Parameters<typeof constructTable<DataTableFeatures, TData>>[0]);

  /*
   * O estado da paginação sai de um ÁTOMO, não mais de `getState()`.
   *
   * No TanStack 9 cada fatia do estado é um átomo próprio. A chave é opcional na
   * tipagem da lib de propósito — código de recurso pode ler fatias que não são
   * dele. Aqui ela existe sempre que a paginação está registrada; o padrão é a
   * rede que a assinatura pede, não um caso esperado.
   */
  function paginationCurrent() {
    return table.atoms.pagination?.get() ?? pagination;
  }

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
        columnResizing,
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
  //
  // Só a GEOMETRIA sai daqui. O fundo opaco — que é o que impede o conteúdo de
  // vazar por baixo da coluna fixada — vem da classe `nds-data-table-*-pinned`,
  // aplicada por `marcarFixada`. Escrito inline, o fundo saía do tema.
  function pinStyle(col: ReturnType<typeof table.getColumn>): Partial<CSSStyleDeclaration> {
    if (!col) return {};
    const pinned = col.getIsPinned();
    if (!pinned) return {};
    return {
      position: 'sticky',
      left: pinned === 'start' ? `${col.getStart('start')}px` : '',
      right: pinned === 'end' ? `${col.getAfter('end')}px` : '',
      zIndex: '1',
    } as Partial<CSSStyleDeclaration>;
  }

  /** Campos de filtro por coluna, criados uma vez e reaproveitados. */
  const filterControls = new Map<string, HTMLInputElement | HTMLSelectElement>();

  /**
   * Só as larguras, sem reconstruir a grade. É o caminho do redimensionamento,
   * que roda a cada pixel do arrasto.
   */
  function updateLarguras(): void {
    if (!enableColumnResizing) return;
    const colunas = table.getVisibleLeafColumns();
    const aplicar = (celulas: ArrayLike<HTMLElement>) => {
      for (let i = 0; i < celulas.length; i++) {
        const col = colunas[i];
        if (col) celulas[i].style.width = `${col.getSize()}px`;
      }
    };
    const firstLine = thead.querySelector('tr');
    if (firstLine) aplicar(firstLine.querySelectorAll<HTMLElement>('th'));
    for (const tr of tbody.querySelectorAll('tr')) {
      aplicar(tr.querySelectorAll<HTMLElement>('td'));
    }
  }

  /** Classe de coluna fixada — o mesmo nome que as outras stacks emitem. */
  function marcarFixada(
    celula: HTMLElement,
    col: ReturnType<typeof table.getColumn>,
    type: 'th' | 'td',
  ): void {
    if (col?.getIsPinned()) celula.classList.add(`nds-data-table-${type}-pinned`);
  }

  // ── Toolbar render ───────────────────────────────────────────────────────
  //
  // Construída UMA vez. Reconstruir a cada mudança de estado trocava o `input`
  // de busca no meio da digitação: o nó com foco morria a cada tecla, a segunda
  // letra caía fora do campo e limpar a busca deixava de funcionar. Nada aqui
  // depende do estado da tabela — o menu de colunas se reconstrói ao abrir.
  let toolbarMontada = false;
  /** Solta o ouvinte de clique fora do menu de colunas do render anterior. */
  let menuSoltarClickOutside: (() => void) | null = null;

  function renderToolbar() {
    if (toolbarMontada) return;
    toolbarMontada = true;
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
        'aria-label': L.columns,
      });
      visBtn.appendChild(svgEl(ICONS.settings));
      const lbl = document.createElement('span');
      lbl.textContent = L.columns;
      visBtn.appendChild(lbl);

      const menu = document.createElement('div');
      menu.className = 'nds-data-table-columns-menu';
      menu.hidden = true;
      // `group`, e não `menu`: um `role="menu"` obriga filhos `menuitem*`, e aqui
      // dentro moram checkboxes e botões de fixar. O axe reprovava a página
      // inteira (aria-required-children) e ninguém via, porque nenhuma story
      // chegava a ABRIR o menu.
      menu.setAttribute('role', 'group');
      menu.setAttribute('aria-label', L.showColumns);

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
            if (pinned === 'start') pinBtn.classList.add('is-active');
            pinBtn.setAttribute(
              'aria-label',
              pinned === 'start' ? L.unpin(lbl) : L.pinLeft(lbl),
            );
            pinBtn.appendChild(svgEl(pinned === 'start' ? ICONS.pinOff : ICONS.pin));
            pinBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              column.pin(pinned === 'start' ? false : 'start');
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

      /*
       * Fechar o menu de colunas ao clicar fora.
       *
       * Este ouvinte era anônimo e registrado aqui dentro — e `renderToolbar()`
       * roda a CADA mudança de estado da tabela: ordenar, filtrar, virar
       * página, marcar linha. Não era um ouvinte por tabela que sobrava no fim:
       * era um ouvinte NOVO por interação, empilhado no `document` enquanto a
       * pessoa usava a tabela, cada um segurando o menu daquele render. O pior
       * do conjunto, e o único que crescia sem a tabela sair da página.
       *
       * Agora a barra solta o ouvinte anterior antes de pendurar o seu.
       */
      menuSoltarClickOutside?.();
      const columnsCloseMenu = (e: MouseEvent): void => {
        if (!menu.contains(e.target as Node) && e.target !== visBtn) {
          menu.hidden = true;
        }
      };
      document.addEventListener('click', columnsCloseMenu);
      menuSoltarClickOutside = () => {
        document.removeEventListener('click', columnsCloseMenu);
        menuSoltarClickOutside = null;
      };

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
        Object.assign(th.style, pinStyle(col));
        marcarFixada(th, col, 'th');

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
            if (isSome) {
              cb.dataset.state = 'indeterminate';
              // `data-state` é só estilo. Quem anuncia "parcialmente marcado" ao
              // leitor de tela é `aria-checked="mixed"` — sem ele a seleção
              // parcial era indistinguível de "nenhuma linha marcada".
              cb.setAttribute('aria-checked', 'mixed');
            }
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
            // `none` explícito, e não atributo ausente: é o que diz ao leitor
            // de tela que a coluna É ordenável e está sem ordem aplicada.
            // Ausência é indistinguível de "esta coluna não ordena", e era a
            // única stack que não emitia.
            th.setAttribute(
              'aria-sort',
              dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none',
            );
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
        marcarFixada(th, col, 'th');
        const meta = col.columnDef.meta?.filter;
        if (!col.getCanFilter() || !meta) {
          // axe empty-table-header — colunas sem filtro recebem texto sr-only.
          const lblForA11y = headerLabel(col.columnDef, col.id);
          const sr = document.createElement('span');
          sr.className = 'nds-sr-only';
          sr.textContent = L.noFilter(lblForA11y || 'esta coluna');
          th.appendChild(sr);
        }
        if (col.getCanFilter() && meta) {
          const lbl = headerLabel(col.columnDef, col.id);
          // O controle é criado UMA vez por coluna e reaproveitado a cada
          // render. Recriá-lo trocava o nó com foco a cada tecla: só a primeira
          // letra entrava no filtro e o resto caía fora do campo.
          let control = filterControls.get(col.id);
          if (!control) {
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
                select.appendChild(o);
              }
              select.addEventListener('change', () => {
                col.setFilterValue(select.value || undefined);
              });
              control = select;
            } else {
              const input = createInput({
                placeholder: meta.placeholder ?? 'Filtrar...',
                class: 'nds-data-table-filter-input',
              });
              input.setAttribute('aria-label', L.filter(lbl));
              input.addEventListener('input', () => {
                col.setFilterValue(input.value);
              });
              control = input;
            }
            filterControls.set(col.id, control);
          }
          // Só sincroniza quando o campo NÃO está com o foco: escrever nele
          // durante a digitação moveria o cursor.
          const value = (col.getFilterValue() as string) ?? '';
          if (document.activeElement !== control && control.value !== value) {
            control.value = value;
          }
          th.appendChild(control);
        }
        tr.appendChild(th);
      }
      thead.appendChild(tr);
    }
  }

  // ── Body render ──────────────────────────────────────────────────────────

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
  function lineLabel(
    tanstackRow: ReturnType<typeof table.getRowModel>['rows'][number],
  ): string {
    if (rowLabel) return rowLabel(tanstackRow.original);
    const first = tanstackRow.getAllCells().find((c) => c.column.id !== '__select__');
    const raw = first?.getValue();
    return raw == null || raw === '' ? tanstackRow.id : String(raw);
  }

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
      marcarFixada(td, col, 'td');

      if (col.id === '__select__') {
        const cb = createCheckbox({
          checked: tanstackRow.getIsSelected(),
          'aria-label': L.selectRow(lineLabel(tanstackRow)),
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
    col: DataTableColumn<TData>,
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
      // O `blur` também confirma — e o Escape tira o campo da tela ANTES dele.
      // Sem esta guarda, descartar com Escape avisava a edição mesmo assim:
      // o valor voltava na tela e quem consome recebia o que foi cancelado.
      let descartado = false;
      const commit = () => {
        if (descartado) return;
        const isNumber = typeof initial === 'number';
        const nextValue: unknown = isNumber ? Number(input.value) : input.value;
        table.options.meta?.updateData?.(rowIndex, columnId, nextValue);
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { descartado = true; renderView(); }
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
      // `_willUpdate()` a CADA render, como faz o adapter do React. Chamado só
      // na construção — que é quando o contêiner ainda não está no documento e
      // portanto tem altura zero — o virtualizador devolvia zero itens e a
      // tabela virtualizada ficava com o corpo VAZIO para sempre.
      virtualizer._willUpdate();
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

    const pageIndex = paginationCurrent().pageIndex;
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
    const psSelect = document.createElement('select');
    psSelect.className = 'nds-data-table-page-size-select';
    psSelect.setAttribute('aria-label', L.rowsPerPage);
    for (const opt of pageSizeOptions) {
      const o = document.createElement('option');
      o.value = String(opt);
      o.textContent = String(opt);
      if (opt === paginationCurrent().pageSize) o.selected = true;
      psSelect.appendChild(o);
    }
    psSelect.addEventListener('change', () => {
      table.setPageSize(Number(psSelect.value));
    });
    pageSizeWrap.append(psLabel, psSelect);

    // Page indicator
    // A classe do componente, e não a utilitária de cor: as duas pintam igual,
    // mas só a do componente diz o que este bloco É — e era por isso que a
    // sonda achava a contagem no lugar do indicador de página.
    const pageInd = document.createElement('div');
    pageInd.className = 'nds-data-table-pagination-count';
    pageInd.textContent = `${L.page} ${pageIndex + 1} ${L.pageOf} ${Math.max(pageCount, 1)}`;

    // Nav buttons
    const navWrap = document.createElement('div');
    navWrap.className = 'nds-data-table-pagination-nav';

    function navBtn(label: string, icon: string, onClick: () => void, disabled: boolean) {
      const btn = createButton({
        variant: 'outline',
        size: 'icon',
        'aria-label': label,
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
  //
  // Filtrar NÃO reconstrói o cabeçalho: tirar do DOM o campo que está com o
  // foco o desfoca, e da segunda letra em diante a digitação caía fora do
  // campo. Só o corpo, o rodapé e a contagem mudam quando o recorte muda.
  function rerenderNoHeader() {
    rerenderBody();
    renderPagination();
    updateRegiaoViva();
  }

  function updateRegiaoViva() {
    if (!enableRowSelection) return;
    regiaoViva.textContent = L.rowsSelected(
      table.getFilteredSelectedRowModel().rows.length,
      table.getFilteredRowModel().rows.length,
    );
  }

  function rerender() {
    renderToolbar();
    renderHeader();
    rerenderBody();
    renderPagination();
    if (enableRowSelection) {
      regiaoViva.textContent = L.rowsSelected(
        table.getFilteredSelectedRowModel().rows.length,
        table.getFilteredRowModel().rows.length,
      );
    }
  }

  rerender();

  // A primeira montagem acontece com a raiz FORA do documento — quem chama a
  // factory ainda vai anexá-la. Enquanto o contêiner de rolagem não tem altura,
  // o virtualizador não sabe quantas linhas cabem. Este observador roda a
  // primeira medição de verdade e desliga.
  if (virtualized && typeof ResizeObserver !== 'undefined') {
    const observador = new ResizeObserver(() => {
      if (scrollContainer.clientHeight > 0) {
        observador.disconnect();
        rerenderBody();
      }
    });
    observador.observe(scrollContainer);
  }

  onTableReady?.(table);

  // Expose table on root for play functions / advanced consumers.
  (root as HTMLElement & { __table?: TanstackTable<DataTableFeatures, TData> }).__table = table;

  return tornarDestruivel(root, root, () => {
    menuSoltarClickOutside?.();
  });
}
