<script setup lang="ts" generic="TData extends RowData">
import type { RowData, Table as TanstackTable } from '@tanstack/vue-table';
import { computed } from 'vue';
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { DataTableFeatures, DataTableLabels } from './data-table.vue';

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
  table: TanstackTable<DataTableFeatures, TData>;
  pageSizeOptions: number[];
  enableRowSelection: boolean;
  labels: DataTableLabels;
  /**
   * Legenda da tabela, e só por causa do landmark.
   *
   * Desde 2026-09-23 o rodapé é um `<nav>`: `landmark-unique` do axe reprova
   * dois com o mesmo nome na mesma página, e uma docs page instancia várias
   * tabelas. A legenda já é única por instância, então é ela que distingue.
   */
  caption?: string;
}>();

/*
 * O estado da paginação sai de um ÁTOMO, não mais de `getState()`.
 *
 * No TanStack 9 cada fatia do estado é um átomo próprio, e é assim que a
 * reatividade do Vue enxerga a mudança: `getState()` devolvia um objeto inteiro
 * a cada leitura, e o adaptador não tinha como saber que só a página mudou.
 *
 * A chave é opcional de propósito na tipagem da lib — código de recurso pode ler
 * fatias que não são dele. Aqui ela existe sempre, porque o conjunto de recursos
 * deste rodapé é o que registra a paginação; o padrão é a rede de segurança que
 * a assinatura pede, não um caso esperado.
 */
const pagination = computed(
  () => props.table.atoms.pagination?.get() ?? { pageIndex: 0, pageSize: 10 },
);

/*
 * O total que a faixa lê é o de linhas FILTRADAS — o mesmo que a contagem à
 * esquerda mostra. É dele que o primitivo deriva a contagem de páginas, e é
 * isso que mantém o desabilitado dos quatro controles igual ao que o TanStack
 * responderia: `Math.ceil(total / pageSize)` contra `getPageCount()`.
 */
const total = computed(() => props.table.getFilteredRowModel().rows.length);
</script>

<template>
  <div
    data-slot="data-table-pagination"
    class="nds-data-table-pagination"
  >
    <div class="nds-data-table-pagination-count">
      <template v-if="enableRowSelection">
        {{ props.labels.rowsSelected(props.table.getFilteredSelectedRowModel().rows.length, total) }}
      </template>
      <template v-else>
        {{ props.labels.rowsTotal(total) }}
      </template>
    </div>
    <div class="nds-data-table-pagination-controls">
      <div class="nds-data-table-page-size">
        <span>{{ props.labels.rowsPerPage }}</span>
        <select
          :aria-label="props.labels.rowsPerPage"
          :value="pagination.pageSize"
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
        {{ props.labels.page }} {{ pagination.pageIndex + 1 }} {{ props.labels.pageOf }}
        {{ Math.max(props.table.getPageCount(), 1) }}
      </div>
      <!--
        A faixa de paginação do sistema, composta.

        Até 2026-09-23 estes quatro controles eram quatro `Button` soltos dentro
        de um `<div>`: mesma aparência da faixa e nenhuma das semânticas dela —
        sem landmark, sem lista, sem `data-slot` de faixa. Havia duas paginações
        no design system, e só uma delas era navegável por landmark.

        A composição não muda a tela: sem números (quem diz em que página se está
        é o "Página X de Y" ao lado), `appearance="outline"` é a variante que o
        rodapé sempre usou, e sem texto visível os quatro direcionais nascem
        quadrados como os botões de antes.

        Sem `href` os controles são `<button>` com `disabled` nativo — o rodapé
        nunca tem rota, e é isso que mantém de pé as asserções `toBeDisabled()`
        das cinco suítes.

        O vocabulário da TABELA vence: "Primeira página", não "Ir para a primeira
        página". Os padrões da faixa seguem valendo para quem a usa sozinha.
      -->
      <Pagination
        :total="total"
        :items-per-page="pagination.pageSize"
        :page="pagination.pageIndex + 1"
        data-align="end"
        :aria-label="props.labels.paginationNav(props.caption ?? '')"
        @update:page="(page: number) => props.table.setPageIndex(page - 1)"
      >
        <PaginationContent>
          <PaginationItem>
            <PaginationFirst
              appearance="outline"
              :aria-label="props.labels.firstPage"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              appearance="outline"
              text=""
              :aria-label="props.labels.prevPage"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              appearance="outline"
              text=""
              :aria-label="props.labels.nextPage"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLast
              appearance="outline"
              :aria-label="props.labels.lastPage"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
