import { describe, expect, it } from 'vitest';
import {
  paginationControladaSource,
  paginationDirecionalSource,
  paginationDisabledSource,
  paginationEllipsisSource,
  paginationLastPageSource,
  paginationLinkActiveSource,
  paginationLinkInactiveSource,
  paginationSource,
  tablePaginationFooterSource,
} from './pagination.source';

/**
 * O painel Code do Pagination não chega ao DOM durante a `play`: estas funções
 * só rodam no projeto `unit`, e sem este arquivo ninguém as media. Vue, Svelte
 * e Vanilla já tinham o par; o React era o que faltava.
 */
describe('paginationSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = paginationSource();
    expect(output).toContain('from "@/components/ui/pagination"');
    expect(output).not.toContain('@base-ui');
  });

  it('ignora o HTML que o renderer gerou', () => {
    // O primeiro argumento é a árvore renderizada; o snippet é escrito do zero,
    // então nada do markup de saída pode vazar para o painel.
    const output = paginationSource('<nav role="navigation" data-slot="pagination">', {});
    expect(output).not.toContain('data-slot=');
    expect(output).not.toContain('role="navigation"');
  });

  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const withoutArgs = paginationSource();
    const withArgs = paginationSource('', { args: { totalPages: 12, initialPage: 6 } });
    expect(withoutArgs).not.toBe(withArgs);
    expect(withoutArgs).toContain('const total = 5;');
    expect(withoutArgs).toContain('useState(1)');
    expect(withArgs).toContain('const total = 12;');
    expect(withArgs).toContain('useState(6)');
  });

  it('a página inicial fora da faixa cai no padrão, em vez de virar estado impossível', () => {
    const aboveRange = paginationSource('', { args: { totalPages: 5, initialPage: 9 } });
    const belowRange = paginationSource('', { args: { totalPages: 5, initialPage: 0 } });
    expect(aboveRange).toContain('useState(1)');
    expect(belowRange).toContain('useState(1)');
  });

  it('as reticências só entram quando a lista é longList o bastante para pedi-las', () => {
    const shortList = paginationSource('', { args: { totalPages: 5, withEllipsis: true } });
    expect(shortList).not.toContain('PaginationEllipsis');
    expect(shortList).toContain('Array.from({ length: total }');

    const longList = paginationSource('', {
      args: { totalPages: 12, initialPage: 6, withEllipsis: true },
    });
    expect(longList).toContain('PaginationEllipsis,');
    expect(longList).toContain('[1, "reticencias", 5, 6, 7, "reticencias", 12]');
  });

  it('o rótulo direcional só aparece quando difere do que o primitivo já escreve', () => {
    const defaultLabels = paginationSource('', {
      args: { previousText: 'Anterior', nextText: 'Próxima' },
    });
    expect(defaultLabels).not.toContain('text=');

    const customLabels = paginationSource('', { args: { previousText: 'Voltar', nextText: 'Seguir' } });
    expect(customLabels).toContain('text="Voltar"');
    expect(customLabels).toContain('text="Seguir"');
  });

  it('não interpola o espião que o Storybook põe no lugar do control', () => {
    // O control de texto chega como função quando a story o liga a uma action;
    // interpolá-la imprimiria o corpo do mock como se fosse código do design
    // system.
    const output = paginationSource('', {
      args: { previousText: (() => 'espiao') as unknown as string },
    });
    expect(output).not.toContain('text=');
    expect(output).not.toContain('espiao');
  });

  it('não escreve à mão o que o componente já põe', () => {
    // O nome acessível nasce do primitivo e o `aria-current` nasce do
    // `isActive`: repetir os dois no snippet ensinaria trabalho inútil, e o
    // segundo ainda marcaria o item errado se fosse escrito no link inativo.
    const output = paginationSource('', { args: { totalPages: 8, withEllipsis: true } });
    expect(output).not.toContain('aria-current');
    expect(output).not.toContain('<Pagination aria-label');
  });

  it('sem rota o snippet ensina a tag e o indisponível do BOTÃO, nos dois extremos', () => {
    // A tag segue a rota: esta faixa vive na memória, então o controle é
    // `<button>` e o extremo usa o `disabled` nativo. `aria-disabled` e o
    // tabindex negativo são o par da ÂNCORA, e ensiná-los aqui seria ensinar o
    // estado duas vezes, em dois vocabulários.
    const output = paginationSource();
    expect(output).toContain('disabled={pagina === 1}');
    expect(output).toContain('disabled={pagina === total}');
    expect(output).not.toContain('aria-disabled');
    expect(output).not.toContain('tabIndex');
    expect(output).not.toContain('href=');
  });
});

describe('formas estruturais', () => {
  it('o controle inativo não carrega marcação de página atual', () => {
    const output = paginationLinkInactiveSource();
    expect(output).not.toContain('isActive');
    expect(output).not.toContain('aria-current');
    expect(output).toContain('aria-label="Ir para página 2"');
    // Sem endereço de página não há `href` para escrever: a tag sai `<button>`,
    // e uma âncora vazia é justamente o que a regra proíbe.
    expect(output).not.toContain('href=');
  });

  it('a página atual é UMA só, e é o `isActive` que a publica', () => {
    const output = paginationLinkActiveSource();
    expect(output.match(/isActive/g)).toHaveLength(1);
    expect(output).not.toContain('aria-current');
  });

  it('a faixa direcional não importa a peça numerada que não usa', () => {
    const output = paginationDirecionalSource();
    expect(output).toContain('PaginationPrevious');
    expect(output).toContain('PaginationNext');
    expect(output).not.toContain('PaginationLink');
    expect(output).not.toContain('PaginationEllipsis');
  });

  it('o extremo bloqueado carrega o `disabled` nativo, e só ele', () => {
    const output = paginationDisabledSource();
    expect(output).toContain('<PaginationPrevious disabled />');
    // O outro extremo continua navegável: a regra é de POSIÇÃO na lista, não de
    // qual dos dois controles é.
    expect(output).toContain('<PaginationNext />');
    expect(output).not.toContain('aria-disabled');
  });

  it('a lista longList colapsa em reticências em vez de listar tudo', () => {
    const output = paginationEllipsisSource();
    expect(output).toContain('PaginationEllipsis,');
    expect(output).toContain('[1, "reticencias", 5, 6, 7, "reticencias", 12]');
    expect(output).toContain('isActive={trecho === 6}');
  });

  it('na última página quem bloqueia é o controle de avanço', () => {
    const output = paginationLastPageSource();
    expect(output).toContain('<PaginationNext disabled />');
    expect(output).toContain('<PaginationPrevious />');
    expect(output).toContain('aria-label="Ir para página 10"');
  });

  it('a faixa controlada mostra de onde sai o destaque, e não só a marcação', () => {
    const output = paginationControladaSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [pagina, setPagina] = useState(1);');
    // O mesmo `pagina` alimenta o destaque e o contador — é o que garante que
    // os dois nunca discordem.
    expect(output).toContain('isActive={n === pagina}');
    expect(output).toContain('Página {pagina} de {total}');
  });

  it('o rodapé de tabela encosta a faixa na borda em vez de centralizá-la', () => {
    const output = tablePaginationFooterSource();
    expect(output).toContain('<Pagination data-align="end">');
    // Cluster e não stack: só o cluster lê `data-justify` e quebra a linha
    // sozinho quando a largura aperta.
    expect(output).toContain('nds-cluster');
    expect(output).toContain('data-justify="between"');
    expect(output).not.toContain('nds-stack');
  });
});

describe('block de import', () => {
  it('lista as peças em ordem alfabética, e só as que o snippet usa', () => {
    const output = paginationLinkActiveSource();
    const block = output.slice(output.indexOf('import {'), output.indexOf('} from'));
    const parts = block
      .split('\n')
      .slice(1)
      .map((line) => line.trim().replace(/,$/, ''))
      .filter(Boolean);
    expect(parts).toEqual([
      'Pagination',
      'PaginationContent',
      'PaginationItem',
      'PaginationLink',
    ]);
  });
});
