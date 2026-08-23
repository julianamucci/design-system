import { describe, expect, it } from 'vitest';
import { paginationSource } from './pagination.source';

describe('paginationSource', () => {
  it('sem args, entrega a faixa canônica com os valores do Playground', () => {
    expect(paginationSource()).toBe(
      `<script lang="ts">
  import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "@/components/ui/pagination";
</script>

<Pagination count={50} siblingCount={2}>
  {#snippet children({ pages, currentPage })}
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious />
      </PaginationItem>
      {#each pages as p (p.key)}
        <PaginationItem>
          {#if p.type === "ellipsis"}
            <PaginationEllipsis />
          {:else}
            <PaginationLink page={p} isActive={currentPage === p.value}>
              {p.value}
            </PaginationLink>
          {/if}
        </PaginationItem>
      {/each}
      <PaginationItem>
        <PaginationNext />
      </PaginationItem>
    </PaginationContent>
  {/snippet}
</Pagination>`,
    );
  });

  it('acompanha o control de total de itens', () => {
    expect(paginationSource('', { args: { count: 120 } })).toContain('count={120}');
  });

  it('só escreve perPage quando difere do padrão do primitivo', () => {
    expect(paginationSource('', { args: { perPage: 10 } })).not.toContain('perPage');
    expect(paginationSource('', { args: { perPage: 25 } })).toContain('perPage={25}');
  });

  it('só escreve page quando a inicial não é a primeira', () => {
    expect(paginationSource('', { args: { page: 1 } })).not.toContain('page={1}');
    expect(paginationSource('', { args: { page: 6 } })).toContain('page={6}');
  });

  it('só escreve siblingCount quando difere de 1', () => {
    expect(paginationSource('', { args: { siblingCount: 1 } })).not.toContain('siblingCount');
    expect(paginationSource('', { args: { siblingCount: 2 } })).toContain('siblingCount={2}');
  });

  it('a composição direcional fica só com as pontas, sem números nem reticências', () => {
    const saida = paginationSource('', { args: { demonstration: 'directional', page: 2 } });
    expect(saida).toContain('<PaginationPrevious />');
    expect(saida).toContain('<PaginationNext />');
    expect(saida).not.toContain('PaginationLink');
    expect(saida).not.toContain('PaginationEllipsis');
  });

  it('a composição controlada leva o estado para fora, por bind:page', () => {
    const saida = paginationSource('', { args: { count: 40, demonstration: 'controlada' } });
    expect(saida).toContain('let paginaAtual = $state(1);');
    expect(saida).toContain('bind:page={paginaAtual}');
    expect(saida).toContain('Página {paginaAtual} de {totalPaginas}');
  });

  it('o rodapé de tabela encosta a faixa à direita e conta o intervalo exibido', () => {
    const saida = paginationSource('', {
      args: { count: 120, page: 2, siblingCount: 1, demonstration: 'tabela' },
    });
    expect(saida).toContain('data-align="end"');
    expect(saida).toContain('Mostrando 11–20 de 120 resultados');
    expect(saida).toContain('data-justify="between"');
  });

  it('não carrega o rótulo de landmark que só existe para separar as stories', () => {
    // Cada story usa um `label` diferente para não repetir o nome do landmark
    // na mesma página de docs; o padrão do primitivo já é "Paginação".
    expect(paginationSource()).not.toContain('aria-label');
  });
});
