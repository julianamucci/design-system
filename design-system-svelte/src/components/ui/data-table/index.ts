import DataTable from './data-table.svelte';
import DataTablePagination from './data-table-pagination.svelte';
import type {
  ColumnDef,
  RowData,
  Table as TanstackTable,
} from '@tanstack/table-core';

declare module '@tanstack/table-core' {
  // TData/TValue precisam casar com a assinatura original do TanStack pra
  // module augmentation funcionar — não são "não usados" do ponto de vista do TS.
  /* eslint-disable unused-imports/no-unused-vars */
  interface ColumnMeta<TData extends RowData, TValue> {
    filter?: { type: 'text' | 'select'; options?: string[]; placeholder?: string };
    editable?: boolean;
    /** Svelte-only: formata o valor da célula como string. */
    format?: (value: TValue, row: TData) => string;
    /** Svelte-only: envolve o valor da célula em <Badge> com a variant retornada. */
    badgeVariant?: (value: TValue, row: TData) => 'default' | 'secondary' | 'destructive' | 'outline';
    /** Svelte-only: classes Tailwind extras aplicadas no <td> de cada célula da coluna. */
    cellClass?: string;
  }
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
  /* eslint-enable unused-imports/no-unused-vars */
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
  onTableReady?: (table: TanstackTable<TData>) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
}

export {
  DataTable,
  DataTablePagination,
  //
  DataTable as Root,
  DataTablePagination as Pagination,
};
