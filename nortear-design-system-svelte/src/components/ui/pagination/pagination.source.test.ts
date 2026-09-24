import { describe, expect, it } from 'vitest';
import {
  paginationAppearanceSource,
  paginationFirstLastSource,
  paginationSource,
  paginationWithoutPagesSource,
} from './pagination.source';

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
    const output = paginationSource('', { args: { demonstration: 'directional', page: 2 } });
    expect(output).toContain('<PaginationPrevious />');
    expect(output).toContain('<PaginationNext />');
    expect(output).not.toContain('PaginationLink');
    expect(output).not.toContain('PaginationEllipsis');
  });

  it('a composição controlada leva o estado para fora, por bind:page', () => {
    const output = paginationSource('', { args: { count: 40, demonstration: 'controlada' } });
    expect(output).toContain('let paginaAtual = $state(1);');
    expect(output).toContain('bind:page={paginaAtual}');
    expect(output).toContain('Página {paginaAtual} de {totalPaginas}');
  });

  it('o rodapé de tabela encosta a faixa à direita e conta o intervalo exibido', () => {
    const output = paginationSource('', {
      args: { count: 120, page: 2, siblingCount: 1, demonstration: 'tabela' },
    });
    expect(output).toContain('data-align="end"');
    expect(output).toContain('Mostrando 11–20 de 120 resultados');
    expect(output).toContain('data-justify="between"');
  });

  it('não carrega o rótulo de landmark que só existe para separar as stories', () => {
    // Cada story usa um `label` diferente para não repetir o nome do landmark
    // na mesma página de docs; o padrão do primitivo já é "Paginação".
    expect(paginationSource()).not.toContain('aria-label');
  });
});

describe('transforms dos três eixos do rodapé', () => {
  it('a aparência vai em cada peça, nunca numa class', () => {
    const output = paginationAppearanceSource();
    // A prop é o único caminho: `class` chega depois no `cn` e não desfaz a
    // variante que `buttonVariants` já escreveu.
    expect(output).not.toContain('class=');
    expect(output.match(/appearance="outline"/g)).toHaveLength(3);
    // A página atual não pede `outline`: ela já é assim por ser a atual.
    expect(output).toContain('isActive={currentPage === p.value}');
  });

  it('os saltos entram POR FORA dos direcionais, e o extremo é de quem consome', () => {
    const output = paginationFirstLastSource();
    const first = output.indexOf('<PaginationFirst');
    const previous = output.indexOf('<PaginationPrevious');
    const next = output.indexOf('<PaginationNext');
    const last = output.indexOf('<PaginationLast');
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(previous);
    expect(next).toBeLessThan(last);
    // A lib headless desta stack não tem primitivo de primeira/última, então o
    // snippet ENSINA quem decide: o consumidor, com `onclick` e `disabled`.
    expect(output).toContain('disabled={paginaAtual === 1}');
    expect(output).toContain('disabled={paginaAtual === totalPaginas}');
  });

  it('a faixa sem régua não tem laço de números, e os direcionais ficam só de ícone', () => {
    const output = paginationWithoutPagesSource();
    expect(output).not.toContain('{#each');
    expect(output).not.toContain('{#snippet children');
    expect(output).not.toContain('PaginationLink');
    expect(output).not.toContain('PaginationEllipsis');
    expect(output.match(/text=""/g)).toHaveLength(2);
  });
});
