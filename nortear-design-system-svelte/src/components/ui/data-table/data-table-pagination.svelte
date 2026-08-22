<script lang="ts" generics="TData extends RowData">
  import type { RowData, Table as TanstackTable } from '@tanstack/table-core';
  import type { DataTableFeatures } from './data-table-features';
  import { Button } from '@/components/ui/button';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
  import ChevronsRight from '@lucide/svelte/icons/chevrons-right';
  import { DATA_TABLE_LABELS_DEFAULT, type DataTableLabels } from './data-table-labels';

  const {
    table,
    pageSizeOptions,
    enableRowSelection,
    labels,
  }: {
    table: TanstackTable<DataTableFeatures, TData>;
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

  const rotulos = $derived<DataTableLabels>(labels ?? DATA_TABLE_LABELS_DEFAULT);

  /*
   * O estado da paginação sai de um ÁTOMO, não mais de `getState()`.
   *
   * No TanStack 9 cada fatia do estado é um átomo próprio. A chave é opcional na
   * tipagem da lib de propósito — código de recurso pode ler fatias que não são
   * dele. Aqui ela existe sempre, porque o conjunto de recursos deste rodapé é o
   * que registra a paginação; o padrão é a rede que a assinatura pede, não um
   * caso esperado.
   */
  const pagination = $derived(table.atoms.pagination?.get() ?? { pageIndex: 0, pageSize: 10 });

  const pageIndex = $derived(pagination.pageIndex);
  const pageCount = $derived(table.getPageCount());
  const selected = $derived(table.getFilteredSelectedRowModel().rows.length);
  const total = $derived(table.getFilteredRowModel().rows.length);
  const currentPageSize = $derived(pagination.pageSize);
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
