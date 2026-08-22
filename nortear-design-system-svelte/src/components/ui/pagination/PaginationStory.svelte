<script lang="ts">
  import { untrack } from 'svelte';
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from './index';

  type Demonstration = 'simples' | 'directional' | 'controlada' | 'tabela';

  interface Props {
    count?: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    demonstration?: Demonstration;
    /** Nome acessível do landmark — distinto por story, senão o axe acusa landmark-unique. */
    rotulo?: string;
    /** Espião do consumidor: a play precisa alcançá-lo, então vem de fora. */
    onPageChange?: (page: number) => void;
  }

  let {
    count = 50,
    perPage = 10,
    page: initialPage = 1,
    siblingCount = 1,
    demonstration = 'simples',
    rotulo = 'Paginação',
    onPageChange = () => {},
  }: Props = $props();

  // Estado controlado da composição "controlada". `$state` e não `$derived`: a
  // demonstração é justamente o estado que muda a cada clique.
  //
  // `untrack` porque a leitura é DE PROPÓSITO só a inicial: quem re-sincroniza
  // quando o control muda é o `{#key}` abaixo, que remonta o bloco inteiro.
  let currentPage = $state(untrack(() => initialPage));
  const totalPages = $derived(Math.ceil(count / perPage));
</script>

{#key `${count}-${perPage}-${initialPage}-${siblingCount}-${demonstration}`}
  {#if demonstration === 'directional'}
    <Pagination {count} {perPage} page={initialPage} {siblingCount} aria-label={rotulo}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onclick={() => onPageChange(initialPage - 1)} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext onclick={() => onPageChange(initialPage + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  {:else if demonstration === 'controlada'}
    <div class="nds-stack" data-spacing="sm">
      <p class="nds-text-body nds-text-muted-foreground" data-slot="pagina-atual">
        Página {currentPage} de {totalPages}
      </p>
      <Pagination {count} {perPage} bind:page={currentPage} {siblingCount} aria-label={rotulo}>
        {#snippet children({ pages })}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onclick={() => (currentPage = Math.max(1, currentPage - 1))}
              />
            </PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <PaginationLink
                    page={p}
                    isActive={currentPage === p.value}
                    onclick={() => (currentPage = p.value)}
                  >
                    {p.value}
                  </PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem>
              <PaginationNext
                onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
    </div>
  {:else if demonstration === 'tabela'}
    <!--
      `nds-cluster` e não `nds-stack`: só o cluster tem data-align/data-justify, e
      é ele que quebra a linha sozinho quando a largura aperta. A marcação
      anterior usava um stack com atributos que nenhuma regra lê, mais três
      classes de força de um framework que saiu — o rodapé nunca virou linha e a
      faixa nunca encostou à direita.
    -->
    <div
      class="nds-cluster nds-w-prose nds-border-default nds-rounded-lg nds-p-4"
      data-spacing="sm"
      data-align="center"
      data-justify="between"
    >
      <span class="nds-text-body nds-text-muted-foreground">
        Mostrando 11–20 de {count} resultados
      </span>
      <Pagination
        {count}
        {perPage}
        page={initialPage}
        {siblingCount}
        data-align="end"
        aria-label={rotulo}
      >
        {#snippet children({ pages, currentPage: cp })}
          <PaginationContent>
            <PaginationItem><PaginationPrevious /></PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <PaginationLink page={p} isActive={cp === p.value}>
                    {p.value}
                  </PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem><PaginationNext /></PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
    </div>
  {:else}
    <Pagination {count} {perPage} page={initialPage} {siblingCount} aria-label={rotulo}>
      {#snippet children({ pages, currentPage: cp })}
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onclick={() => onPageChange(initialPage - 1)} />
          </PaginationItem>
          {#each pages as p (p.key)}
            <PaginationItem>
              {#if p.type === 'ellipsis'}
                <PaginationEllipsis />
              {:else}
                <PaginationLink
                  page={p}
                  isActive={cp === p.value}
                  onclick={() => onPageChange(p.value)}
                >
                  {p.value}
                </PaginationLink>
              {/if}
            </PaginationItem>
          {/each}
          <PaginationItem>
            <PaginationNext onclick={() => onPageChange(initialPage + 1)} />
          </PaginationItem>
        </PaginationContent>
      {/snippet}
    </Pagination>
  {/if}
{/key}
