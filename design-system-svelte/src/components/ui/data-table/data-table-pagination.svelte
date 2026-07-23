<script lang="ts" generics="TData">
  import type { Table as TanstackTable } from '@tanstack/table-core';
  import { Button } from '@/components/ui/button';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
  import ChevronsRight from '@lucide/svelte/icons/chevrons-right';

  const {
    table,
    pageSizeOptions,
    enableRowSelection,
  }: {
    table: TanstackTable<TData>;
    pageSizeOptions: number[];
    enableRowSelection: boolean;
  } = $props();

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
      {selected} de {total} linha(s) selecionada(s).
    {:else}
      {total} linha(s).
    {/if}
  </div>
  <div class="nds-data-table-pagination-controls">
    <div class="nds-data-table-page-size">
      <span class="nds-data-table-pagination-count">Linhas por página</span>
      <select
        aria-label="Linhas por página"
        value={currentPageSize}
        onchange={(e) => table.setPageSize(Number((e.currentTarget as HTMLSelectElement).value))}
        class="nds-data-table-page-size-select"
      >
        {#each pageSizeOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>
    <div class="nds-data-table-pagination-count">
      Página {pageIndex + 1} de {Math.max(pageCount, 1)}
    </div>
    <div class="nds-data-table-pagination-nav">
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.setPageIndex(0)}
        disabled={!table.getCanPreviousPage()}
        aria-label="Primeira página"
      >
        <ChevronsLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        aria-label="Página anterior"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        aria-label="Próxima página"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={() => table.setPageIndex(pageCount - 1)}
        disabled={!table.getCanNextPage()}
        aria-label="Última página"
      >
        <ChevronsRight aria-hidden="true" />
      </Button>
    </div>
  </div>
</div>
