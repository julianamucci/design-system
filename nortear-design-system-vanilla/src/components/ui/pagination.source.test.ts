import { describe, expect, it } from 'vitest';
import {
  paginationComEstadoSnippet,
  paginationComEstadoSourceCom,
  paginationSnippet,
  paginationSource,
  paginationSourceCom,
} from './pagination.source';

describe('paginationSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = paginationSnippet();
    expect(código).toContain("import { createPagination } from '@/components/ui/pagination';");
    expect(código).toContain('createPagination({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('<nav');
  });

  it('usa o nome acessível pelo nome que a fábrica dá a ele', () => {
    // Nesta fábrica a opção se chama `label` e não tem apelido: `PaginationOptions`
    // não declara `aria-label` nem `ariaLabel`, então inventar um seria API falsa.
    const código = paginationSnippet({ label: 'Paginação de resultados' });
    expect(código).toContain("label: 'Paginação de resultados'");
    expect(código).not.toContain('ariaLabel');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = paginationSnippet();
    // `showPrevNext` nasce `true`, o rótulo nasce "Paginação", e sem rota os
    // links nascem `#`.
    expect(código).not.toContain('showPrevNext');
    expect(código).not.toContain('label:');
    expect(código).not.toContain('hrefForPage');
    expect(código).not.toContain('align');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = paginationSnippet({
      total: 12,
      current: 6,
      showPrevNext: false,
      align: 'end',
      hrefForPage: '(page) => `?page=${page}`',
    });
    expect(código).toContain('total: 12');
    expect(código).toContain('current: 6');
    expect(código).toContain('showPrevNext: false');
    expect(código).toContain("align: 'end'");
    expect(código).toContain('hrefForPage: (page) => `?page=${page}`');
  });

  it('não vaza o andaime das stories', () => {
    const código = paginationSnippet({ total: 8 });
    expect(código).not.toContain('wrap(');
    expect(código).not.toContain('faixa(');
  });
});

describe('paginationComEstadoSnippet', () => {
  it('mostra o estado do lado de quem consome, que é o que a fábrica não guarda', () => {
    const código = paginationComEstadoSnippet({ total: 8, current: 3 });
    expect(código).toContain('let paginaAtual = 3;');
    expect(código).toContain('current: paginaAtual');
    expect(código).toContain('faixa.replaceChildren(');
    expect(código).toContain('paginaAtual = page; remontar();');
  });

  it('continua sendo a chamada da fábrica, e não o outerHTML', () => {
    const código = paginationComEstadoSnippet();
    expect(código).toContain('createPagination({');
    expect(código).not.toContain('data-slot=');
  });
});

describe('paginationSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = paginationSource('<nav data-slot="pagination">', {});
    const comArgs = paginationSource('<nav data-slot="pagination">', {
      args: { total: 20, current: 7 },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('total: 20');
    expect(comArgs).toContain('current: 7');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(paginationSource('<nav role="navigation" data-slot="pagination">', {})).not.toContain(
      'role="navigation"',
    );
  });
});

describe('paginationSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = paginationSourceCom({ total: 5, current: 5 });
    const código = transform('', { args: { total: 30, current: 1 } });
    expect(código).toContain('total: 5');
    expect(código).toContain('current: 5');
    expect(código).not.toContain('total: 30');
  });
});

describe('paginationComEstadoSourceCom', () => {
  it('sobrepõe os args e mantém a forma com estado', () => {
    const transform = paginationComEstadoSourceCom({ current: 3, label: 'Paginação interativa' });
    const código = transform('', { args: { current: 9 } });
    expect(código).toContain('let paginaAtual = 3;');
    expect(código).toContain("label: 'Paginação interativa'");
  });
});
