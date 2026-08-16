<!--
  Andaime da story de edição inline.

  O DataTable não guarda os dados: `onCellEdit` avisa e quem consome atualiza o
  array. Uma story escrita só com `args` não tem onde guardar esse array, então
  o dono do estado é este componente — que é também o exemplo honesto do que
  quem usa vai escrever.
-->
<script lang="ts">
  import DataTable from './data-table.svelte';
  import type { DataTableColumn } from './index';
  import { invoices, currency, statusVariant, type Invoice } from './data-table.fixtures';

  const { onEdit }: { onEdit?: (rowIndex: number, columnId: string, value: unknown) => void } =
    $props();

  const columns: DataTableColumn<Invoice>[] = [
    { accessorKey: 'id', header: 'Fatura' },
    { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: { badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default' },
    },
    { accessorKey: 'method', header: 'Método', meta: { editable: true } },
    {
      accessorKey: 'amount',
      header: 'Valor',
      meta: {
        editable: true,
        format: (v) => currency.format(Number(v)),
        cellClass: 'nds-font-medium nds-tabular-nums',
      },
    },
  ];

  let data = $state<Invoice[]>(invoices.slice(0, 6).map((f) => ({ ...f })));
</script>

<DataTable
  columns={columns as never}
  {data}
  enableGlobalFilter={false}
  enableColumnVisibility={false}
  enablePagination={false}
  onCellEdit={(rowIndex, columnId, value) => {
    onEdit?.(rowIndex, columnId, value);
    data = data.map((row, i) => (i === rowIndex ? { ...row, [columnId]: value } : row));
  }}
/>
