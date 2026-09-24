<script lang="ts" generics="TData extends RowData">
  import type { RowData, Table as TanstackTable } from '@tanstack/table-core';
  import type { DataTableFeatures } from './data-table-features';
  import {
    Pagination,
    PaginationContent,
    PaginationFirst,
    PaginationItem,
    PaginationLast,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination';
  import { DATA_TABLE_LABELS_DEFAULT, type DataTableLabels } from '@shared/primitives/data-table-labels';

  const {
    table,
    pageSizeOptions,
    enableRowSelection,
    labels,
    caption,
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
    /**
     * Legenda da tabela, e só por causa do landmark.
     *
     * Desde 2026-09-23 o rodapé é um `<nav>`: `landmark-unique` do axe reprova
     * dois com o mesmo nome na mesma página, e uma docs page instancia várias
     * tabelas. A legenda já é única por instância, então é ela que distingue.
     */
    caption?: string;
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
    <!--
      A faixa de paginação do sistema, composta.

      Até 2026-09-23 estes quatro controles eram quatro `Button` soltos dentro de
      um `<div>`: mesma aparência da faixa e nenhuma das semânticas dela — sem
      landmark, sem lista, sem `data-slot` de faixa. Havia duas paginações no
      design system, e só uma delas era navegável por landmark.

      A composição não muda a tela: sem números (quem diz em que página se está é
      o "Página X de Y" ao lado), `appearance="outline"` é a variante que o rodapé
      sempre usou, e sem texto visível os quatro direcionais nascem quadrados como
      os botões de antes.

      Os quatro são `<button>` com `disabled` nativo — o rodapé nunca tem rota, e
      é isso que mantém de pé as asserções `toBeDisabled()` das cinco suítes.

      O vocabulário da TABELA vence: "Primeira página", não "Ir para a primeira
      página". Os padrões da faixa seguem valendo para quem a usa sozinha.

      Os saltos das pontas levam `onclick` e `disabled` porque nesta stack eles
      não são peça da lib — ver a nota em pagination-first.svelte. Aqui isso não
      custa nada: as duas respostas vêm da tabela, que é a fonte do estado.
    -->
    <Pagination
      count={total}
      perPage={currentPageSize}
      page={pageIndex + 1}
      onPageChange={(page) => table.setPageIndex(page - 1)}
      data-align="end"
      aria-label={rotulos.paginationNav(caption ?? '')}
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            appearance="outline"
            aria-label={rotulos.firstPage}
            disabled={!table.getCanPreviousPage()}
            onclick={() => table.setPageIndex(0)}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious appearance="outline" text="" aria-label={rotulos.prevPage} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext appearance="outline" text="" aria-label={rotulos.nextPage} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLast
            appearance="outline"
            aria-label={rotulos.lastPage}
            disabled={!table.getCanNextPage()}
            onclick={() => table.setPageIndex(Math.max(pageCount, 1) - 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
</div>
