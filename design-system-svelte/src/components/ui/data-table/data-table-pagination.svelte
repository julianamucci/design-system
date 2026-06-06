<script lang="ts" generics="TData">
  import type { Table as TanstackTable } from '@tanstack/table-core';
  import { Button } from '@/components/ui/button';
  import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
  } from 'lucide-svelte';

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
  class="flex flex-wrap items-center justify-between gap-3 text-sm"
>
  <div class="text-muted-foreground">
    {#if enableRowSelection}
      {selected} de {total} linha(s) selecionada(s).
    {:else}
      {total} linha(s).
    {/if}
  </div>
  <div class="flex flex-wrap items-center gap-4">
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground">Linhas por página</span>
      <select
        aria-label="Linhas por página"
        value={currentPageSize}
        onchange={(e) => table.setPageSize(Number((e.currentTarget as HTMLSelectElement).value))}
        class="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {#each pageSizeOptions as opt}
          <option value={opt}>{opt}</option>
        {/each}
      </select>
    </div>
    <div class="text-muted-foreground">
      Página {pageIndex + 1} de {Math.max(pageCount, 1)}
    </div>
    <div class="flex items-center gap-1">
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
