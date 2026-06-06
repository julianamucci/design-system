<script setup lang="ts" generic="TData">
import type { Table as TanstackTable } from '@tanstack/vue-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  table: TanstackTable<TData>;
  pageSizeOptions: number[];
  enableRowSelection: boolean;
}>();
</script>

<template>
  <div
    data-slot="data-table-pagination"
    class="flex flex-wrap items-center justify-between gap-3 text-sm"
  >
    <div class="text-muted-foreground">
      <template v-if="enableRowSelection">
        {{ props.table.getFilteredSelectedRowModel().rows.length }} de
        {{ props.table.getFilteredRowModel().rows.length }} linha(s) selecionada(s).
      </template>
      <template v-else>
        {{ props.table.getFilteredRowModel().rows.length }} linha(s).
      </template>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">Linhas por página</span>
        <select
          aria-label="Linhas por página"
          :value="props.table.getState().pagination.pageSize"
          class="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          @change="(e) => props.table.setPageSize(Number((e.target as HTMLSelectElement).value))"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
      <div class="text-muted-foreground">
        Página {{ props.table.getState().pagination.pageIndex + 1 }} de
        {{ Math.max(props.table.getPageCount(), 1) }}
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Primeira página"
          :disabled="!props.table.getCanPreviousPage()"
          @click="props.table.setPageIndex(0)"
        >
          <ChevronsLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          :disabled="!props.table.getCanPreviousPage()"
          @click="props.table.previousPage()"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Próxima página"
          :disabled="!props.table.getCanNextPage()"
          @click="props.table.nextPage()"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Última página"
          :disabled="!props.table.getCanNextPage()"
          @click="props.table.setPageIndex(props.table.getPageCount() - 1)"
        >
          <ChevronsRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  </div>
</template>
