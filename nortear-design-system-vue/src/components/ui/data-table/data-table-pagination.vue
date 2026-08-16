<script setup lang="ts" generic="TData">
import type { Table as TanstackTable } from '@tanstack/vue-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import type { DataTableLabels } from './data-table.vue';

/*
 * Os rótulos chegam por PROP, já mesclados com o padrão lá em cima.
 *
 * O rodapé é metade do texto visível da tabela — contagem, "Linhas por página",
 * "Página X de Y" e os quatro nomes da navegação. Enquanto essas frases moravam
 * aqui cravadas, passar `labels` ao DataTable traduzia o cabeçalho e deixava o
 * rodapé em português: meia tabela em cada idioma. Mesclar de novo aqui seria a
 * outra armadilha — dois pontos de mescla divergem no dia em que só um mudar.
 */
const props = defineProps<{
  table: TanstackTable<TData>;
  pageSizeOptions: number[];
  enableRowSelection: boolean;
  labels: DataTableLabels;
}>();
</script>

<template>
  <div
    data-slot="data-table-pagination"
    class="nds-data-table-pagination"
  >
    <div class="nds-data-table-pagination-count">
      <template v-if="enableRowSelection">
        {{ props.labels.rowsSelected(props.table.getFilteredSelectedRowModel().rows.length, props.table.getFilteredRowModel().rows.length) }}
      </template>
      <template v-else>
        {{ props.labels.rowsTotal(props.table.getFilteredRowModel().rows.length) }}
      </template>
    </div>
    <div class="nds-data-table-pagination-controls">
      <div class="nds-data-table-page-size">
        <span>{{ props.labels.rowsPerPage }}</span>
        <select
          :aria-label="props.labels.rowsPerPage"
          :value="props.table.getState().pagination.pageSize"
          class="nds-data-table-page-size-select"
          @change="(e) => props.table.setPageSize(Number((e.target as HTMLSelectElement).value))"
        >
          <option
            v-for="opt in pageSizeOptions"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
      </div>
      <div class="nds-data-table-pagination-count">
        {{ props.labels.page }} {{ props.table.getState().pagination.pageIndex + 1 }} {{ props.labels.pageOf }}
        {{ Math.max(props.table.getPageCount(), 1) }}
      </div>
      <div class="nds-data-table-pagination-nav">
        <Button
          variant="outline"
          size="icon"
          :aria-label="props.labels.firstPage"
          :disabled="!props.table.getCanPreviousPage()"
          @click="props.table.setPageIndex(0)"
        >
          <ChevronsLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          :aria-label="props.labels.prevPage"
          :disabled="!props.table.getCanPreviousPage()"
          @click="props.table.previousPage()"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          :aria-label="props.labels.nextPage"
          :disabled="!props.table.getCanNextPage()"
          @click="props.table.nextPage()"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          :aria-label="props.labels.lastPage"
          :disabled="!props.table.getCanNextPage()"
          @click="props.table.setPageIndex(props.table.getPageCount() - 1)"
        >
          <ChevronsRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  </div>
</template>
