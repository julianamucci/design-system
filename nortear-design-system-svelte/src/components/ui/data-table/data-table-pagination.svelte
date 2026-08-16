<script lang="ts" generics="TData">
  import type { Table as TanstackTable } from '@tanstack/table-core';
  import { Button } from '@/components/ui/button';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
  import ChevronsRight from '@lucide/svelte/icons/chevrons-right';
  import { DATA_TABLE_LABELS_PADRAO, type DataTableLabels } from './data-table-labels';

  const {
    table,
    pageSizeOptions,
    enableRowSelection,
    labels,
  }: {
    table: TanstackTable<TData>;
    pageSizeOptions: number[];
    enableRowSelection: boolean;
    /**
     * Rótulos JÁ resolvidos (padrão + o que veio por prop). O rodapé é montado
     * pelo DataTable, que é quem tem o objeto completo — mesclar de novo aqui
     * daria duas fontes para o mesmo texto. Continua opcional porque este
     * componente também é exportado avulso pelo `index.ts`.
     */
    labels?: DataTableLabels;
  } = $props();

  const rotulos = $derived<DataTableLabels>(labels ?? DATA_TABLE_LABELS_PADRAO);

  const pageIndex = $derived(table.getState().pagination.pageIndex);
  const pageCount = $derived(table.getPageCount());
  const selected = $derived(table.getFilteredSelectedRowModel().rows.length);
  const total = $derived(table.getFilteredRowModel().rows.length);
  const currentPageSize = $derived(table.getState().pagination.pageSize);
</script>

<div
  data-slot="data-table-pagination"
  class="nds-data-table-pagination"
>
  <div class="nds-data-table-pagination-count">
    {#if enableRowSelection}
      {rotulos.rowsSelected(selected, total)}
    {:else}
      {rotulos.rowsTotal(total)}
    {/if}
  </div>
  <div class="nds-data-table-pagination-controls">
    <div class="nds-data-table-page-size">
      <span class="nds-data-table-pagination-count">{rotulos.rowsPerPage}</span>
      <select
        aria-label={rotulos.rowsPerPage}
        value={currentPageSize}
        onchange={(e) => table.setPageSize(Number((e.currentTarget as HTMLSelectElement).value))}
        class="nds-data-table-page-size-select"
      >
        {#each pageSizeOptions as opt (opt)}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>
    <div class="nds-data-table-pagination-count">
      {rotulos.page} {pageIndex + 1} {rotulos.pageOf} {Math.max(pageCount, 1)}
    </div>
    <div class="nds-data-table-pagination-nav">
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
        aria-label={rotulos.firstPage}
      >
        <ChevronsLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label={rotulos.prevPage}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label={rotulos.nextPage}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.setPageIndex(pageCount - 1)}
        disabled={!table.getCanNextPage()}
        aria-label={rotulos.lastPage}
      >
        <ChevronsRight aria-hidden="true" />
      </Button>
    </div>
  </div>
</div>
