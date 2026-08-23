import { describe, expect, it } from 'vitest';
import {
  paginationWithStateSnippet,
  paginationWithStateSourceWith,
  paginationSnippet,
  paginationSource,
  paginationSourceWith,
} from './pagination.source';

describe('paginationSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = paginationSnippet();
    expect(code).toContain("import { createPagination } from '@/components/ui/pagination';");
    expect(code).toContain('createPagination({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<nav');
  });

  it('usa o nome acessível pelo nome que a fábrica dá a ele', () => {
    // A opção canônica é `'aria-label'`; `label` segue aceito como apelido
    // depreciado, e o painel Code ensina o canônico — quem copia dali adota o
    // nome que leu.
    const code = paginationSnippet({ 'aria-label': 'Paginação de resultados' });
    expect(code).toContain("'aria-label': 'Paginação de resultados'");
    expect(code).not.toContain('ariaLabel');
    // O espaço à frente separa a CHAVE `label:` do sufixo de `'aria-label':`,
    // que contém a mesma sequência de letras.
    expect(code).not.toContain(' label:');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = paginationSnippet();
    // `showPrevNext` nasce `true`, o rótulo nasce "Paginação", e sem rota os
    // links nascem `#`.
    expect(code).not.toContain('showPrevNext');
    expect(code).not.toContain('label:');
    expect(code).not.toContain("'aria-label':");
    expect(code).not.toContain('hrefForPage');
    expect(code).not.toContain('align');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = paginationSnippet({
      total: 12,
      current: 6,
      showPrevNext: false,
      align: 'end',
      hrefForPage: '(page) => `?page=${page}`',
    });
    expect(code).toContain('total: 12');
    expect(code).toContain('current: 6');
    expect(code).toContain('showPrevNext: false');
    expect(code).toContain("align: 'end'");
    expect(code).toContain('hrefForPage: (page) => `?page=${page}`');
  });

  it('não vaza o andaime das stories', () => {
    const code = paginationSnippet({ total: 8 });
    expect(code).not.toContain('wrap(');
    expect(code).not.toContain('faixa(');
  });
});

describe('paginationComEstadoSnippet', () => {
  it('mostra o estado do lado de quem consome, que é o que a fábrica não guarda', () => {
    const code = paginationWithStateSnippet({ total: 8, current: 3 });
    expect(code).toContain('let paginaAtual = 3;');
    expect(code).toContain('current: paginaAtual');
    expect(code).toContain('faixa.replaceChildren(');
    expect(code).toContain('paginaAtual = page; remontar();');
  });

  it('continua sendo a chamada da fábrica, e não o outerHTML', () => {
    const code = paginationWithStateSnippet();
    expect(code).toContain('createPagination({');
    expect(code).not.toContain('data-slot=');
  });
});

describe('paginationSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = paginationSource('<nav data-slot="pagination">', {});
    const withArgs = paginationSource('<nav data-slot="pagination">', {
      args: { total: 20, current: 7 },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('total: 20');
    expect(withArgs).toContain('current: 7');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(paginationSource('<nav role="navigation" data-slot="pagination">', {})).not.toContain(
      'role="navigation"',
    );
  });
});

describe('paginationSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = paginationSourceWith({ total: 5, current: 5 });
    const code = transform('', { args: { total: 30, current: 1 } });
    expect(code).toContain('total: 5');
    expect(code).toContain('current: 5');
    expect(code).not.toContain('total: 30');
  });
});

describe('paginationComEstadoSourceCom', () => {
  it('sobrepõe os args e mantém a forma com estado', () => {
    const transform = paginationWithStateSourceWith({ current: 3, 'aria-label': 'Paginação interativa' });
    const code = transform('', { args: { current: 9 } });
    expect(code).toContain('let paginaAtual = 3;');
    expect(code).toContain("'aria-label': 'Paginação interativa'");
  });
});
