import { describe, expect, it } from 'vitest';
import {
  tableLoadingSnippet,
  tableSnippet,
  tableSource,
  tableSourceWith,
  tableVaziaSnippet,
} from './table.source';

describe('tableSnippet', () => {
  it('devolve a montagem das fábricas, e não o outerHTML da tabela', () => {
    const code = tableSnippet();
    expect(code).toContain("} from '@/components/ui/table';");
    expect(code).toContain('const { wrapper, table } = createTable();');
    expect(code).toContain('createTableHead(');
    expect(code).toContain("document.querySelector('#app')?.append(wrapper);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('<table');
  });

  it('não importa a peça que a story não usa', () => {
    expect(tableSnippet()).not.toContain('createTableFooter');
    expect(tableSnippet({ withFooter: true })).toContain('createTableFooter');
    expect(tableSnippet()).not.toContain('createButton');
    expect(tableSnippet({ withActions: true })).toContain(
      "import { createButton } from '@/components/ui/button';",
    );
  });

  it('a legenda fica fora da tela por padrão e visível quando a story pede', () => {
    expect(tableSnippet()).toContain(
      "createTableCaption('Lista de faturas recentes', 'nds-sr-only')",
    );
    expect(tableSnippet({ captionVisivel: true })).toContain(
      "createTableCaption('Lista de faturas recentes')",
    );
  });

  it('mostra o rodapé, a ação por linha e a linha marcada quando a story as usa', () => {
    expect(tableSnippet({ withFooter: true })).toContain("createTableCell('Total')");
    const withActions = tableSnippet({ withActions: true });
    expect(withActions).toContain("variant: 'ghost'");
    expect(withActions).toContain("'aria-label': `Ações para fatura ${fatura.id}`");
    expect(tableSnippet({ lineSelecionada: true })).toContain(
      "linha.setAttribute('data-state', 'selected')",
    );
    expect(tableSnippet()).not.toContain('data-state');
  });

  it('usa o nome acessível canônico, nunca o apelido depreciado', () => {
    const code = tableSnippet({ withActions: true });
    expect(code).toContain("'aria-label':");
    expect(code).not.toContain('ariaLabel');
  });

  it('leva dados próprios, e não a fixture das stories', () => {
    const code = tableSnippet();
    expect(code).toContain('const faturas = [');
    expect(code).not.toContain('INVOICES');
    expect(code).not.toContain('table.fixtures');
    expect(code).not.toContain('totalDe(');
    expect(code).not.toContain('buildHeader');
    expect(code).not.toContain('buildBodyRows');
  });
});

describe('tableVaziaSnippet', () => {
  it('atravessa a tabela com a mensagem, sem desmontar o cabeçalho', () => {
    const code = tableVaziaSnippet();
    expect(code).toContain("'nds-table-empty'");
    expect(code).toContain("celula.setAttribute('colspan', String(colunas.length));");
    expect(code).toContain('createTableHead(');
    expect(code).not.toContain('const faturas = [');
  });
});

describe('tableCarregandoSnippet', () => {
  it('põe o esqueleto na célula e o anúncio na região', () => {
    const code = tableLoadingSnippet();
    expect(code).toContain("import { createSkeleton } from '@/components/ui/skeleton';");
    expect(code).toContain("createSkeleton({ shape: 'text', width: '3-4' })");
    expect(code).toContain("regiao.setAttribute('aria-busy', 'true');");
    expect(code).toContain("document.querySelector('#app')?.append(regiao);");
  });
});

describe('tableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = tableSource('<table data-slot="table">', {});
    const withArgs = tableSource('<table data-slot="table">', {
      args: { captionVisivel: true, withFooter: true },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('createTableFooter');
    // Legenda visível: a chamada fecha sem a classe que a tira da tela.
    expect(withArgs).toContain("createTableCaption('Lista de faturas recentes'));");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tableSource('<div data-slot="table-container" tabindex="0">', {})).not.toContain(
      'table-container',
    );
  });
});

describe('tableSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = tableSourceWith({ withFooter: false, withActions: true });
    const code = transform('', { args: { withFooter: true } });
    expect(code).not.toContain('createTableFooter');
    expect(code).toContain('createButton');
  });
});
