<script lang="ts">
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from './index';

  type Demonstration =
    | 'simples'
    | 'comEllipsis'
    | 'ultimaPagina'
    | 'directional'
    | 'controlada'
    | 'tabela';

  interface Props {
    count?: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    demonstration?: Demonstration;
  }

  let {
    count = 50,
    perPage = 10,
    page: initialPage = 1,
    siblingCount = 1,
    demonstration = 'simples',
  }: Props = $props();

  // estado controlado para a composição "controlada"
  let currentPage = $state(initialPage);
  $effect(() => {
    currentPage = initialPage;
  });
</script>

<div class="w-full" style="contain: layout; min-height: 64px;">
  {#key `${count}-${perPage}-${initialPage}-${siblingCount}-${demonstration}`}
    {#if demonstration === 'directional'}
      <Pagination {count} {perPage} page={initialPage} {siblingCount}>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Ir para a página anterior" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext aria-label="Ir para a próxima página" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    {:else if demonstration === 'controlada'}
      <div class="flex flex-col items-center gap-3">
        <span class="text-sm text-muted-foreground">
          Página atual: {currentPage} de {Math.ceil(count / perPage)}
        </span>
        <Pagination {count} {perPage} bind:page={currentPage} {siblingCount}>
          {#snippet children({ pages })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-label="Ir para a página anterior"
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
                      aria-label={currentPage === p.value
                        ? `Página atual, ${p.value}`
                        : `Ir para página ${p.value}`}
                      onclick={() => (currentPage = p.value)}
                    >
                      {p.value}
                    </PaginationLink>
                  {/if}
                </PaginationItem>
              {/each}
              <PaginationItem>
                <PaginationNext
                  aria-label="Ir para a próxima página"
                  onclick={() => (currentPage = Math.min(Math.ceil(count / perPage), currentPage + 1))}
                />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      </div>
    {:else if demonstration === 'tabela'}
      <div class="w-full max-w-2xl border rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-sm text-muted-foreground">Mostrando 11–20 de {count} resultados</span>
        <Pagination {count} {perPage} page={initialPage} {siblingCount} class="!justify-end !mx-0 !w-auto">
          {#snippet children({ pages, currentPage: cp })}
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious aria-label="Ir para a página anterior" />
              </PaginationItem>
              {#each pages as p (p.key)}
                <PaginationItem>
                  {#if p.type === 'ellipsis'}
                    <PaginationEllipsis />
                  {:else}
                    <PaginationLink
                      page={p}
                      isActive={cp === p.value}
                      aria-label={cp === p.value
                        ? `Página atual, ${p.value}`
                        : `Ir para página ${p.value}`}
                    >
                      {p.value}
                    </PaginationLink>
                  {/if}
                </PaginationItem>
              {/each}
              <PaginationItem>
                <PaginationNext aria-label="Ir para a próxima página" />
              </PaginationItem>
            </PaginationContent>
          {/snippet}
        </Pagination>
      </div>
    {:else}
      <Pagination {count} {perPage} page={initialPage} {siblingCount}>
        {#snippet children({ pages, currentPage: cp })}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious aria-label="Ir para a página anterior" />
            </PaginationItem>
            {#each pages as p (p.key)}
              <PaginationItem>
                {#if p.type === 'ellipsis'}
                  <PaginationEllipsis />
                {:else}
                  <PaginationLink
                    page={p}
                    isActive={cp === p.value}
                    aria-label={cp === p.value
                      ? `Página atual, ${p.value}`
                      : `Ir para página ${p.value}`}
                  >
                    {p.value}
                  </PaginationLink>
                {/if}
              </PaginationItem>
            {/each}
            <PaginationItem>
              <PaginationNext aria-label="Ir para a próxima página" />
            </PaginationItem>
          </PaginationContent>
        {/snippet}
      </Pagination>
    {/if}
  {/key}
</div>
