import DataTable from './data-table.svelte';
import DataTablePagination from './data-table-pagination.svelte';
import type { DataTableLabels } from './data-table-labels';
import type { RowData, Table as TanstackTable } from '@tanstack/table-core';
import type { DataTableColumn, DataTableFeatures } from './data-table-features';

export { createRecursos } from './data-table-features';
export type { DataTableColumn, DataTableFeatures } from './data-table-features';

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
  /** Nome acessível da tabela. Vira `<caption>` fora da tela. */
  caption?: string;
  /** Identificador estável da linha — sem ele a identidade da linha é a posição. */
  rowKey?: (row: TData, index: number) => string;
  /** Texto que identifica a linha no nome do controle de seleção. */
  rowLabel?: (row: TData) => string;
  /** Só as chaves informadas mudam; o resto continua no padrão. */
  labels?: Partial<DataTableLabels>;
  class?: string;
  onTableReady?: (table: TanstackTable<DataTableFeatures, TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}

export type { DataTableLabels };
export { DATA_TABLE_LABELS_DEFAULT } from './data-table-labels';

export {
  DataTable,
  DataTablePagination,
  //
  DataTable as Root,
  DataTablePagination as Pagination,
};
