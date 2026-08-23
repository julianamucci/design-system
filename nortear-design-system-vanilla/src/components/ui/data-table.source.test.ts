import { describe, expect, it } from 'vitest';
import { dataTableSnippet, dataTableSource, dataTableSourceWith } from './data-table.source';

describe('dataTableSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da grade', () => {
    const code = dataTableSnippet();
    expect(code).toContain(
      "import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';",
    );
    expect(code).toContain('createDataTable<Invoice>({');
    // Forma abreviada: `columns: columns` é ruído que ninguém digita.
    expect(code).toContain('\n  columns,\n');
    expect(code).toContain("document.querySelector('#app')?.append(tabela);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-data-table-th');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = dataTableSnippet();
    expect(code).not.toContain('enableRowSelection');
    expect(code).not.toContain('enableGlobalFilter');
    expect(code).not.toContain('enablePagination');
    expect(code).not.toContain('enableColumnVisibility');
    expect(code).not.toContain('virtualized');
    expect(code).not.toContain('pageSize');
  });

  it('não repete os textos que a fábrica já traz', () => {
    const code = dataTableSnippet({
      globalFilterPlaceholder: 'Buscar...',
      emptyMessage: 'Sem resultados.',
      pageSize: 10,
    });
    expect(code).not.toContain('globalFilterPlaceholder');
    expect(code).not.toContain('emptyMessage');
    expect(code).not.toContain('pageSize');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = dataTableSnippet({
      enableRowSelection: true,
      enableColumnFilters: true,
      enableColumnResizing: true,
      enableColumnOrdering: true,
      enableColumnPinning: true,
      enablePagination: false,
      pageSize: 5,
      pageSizeOptions: [5, 10],
      globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
      emptyMessage: 'Nenhuma fatura encontrada.',
    });
    expect(code).toContain('enableRowSelection: true');
    expect(code).toContain('enableColumnFilters: true');
    expect(code).toContain('enableColumnResizing: true');
    expect(code).toContain('enableColumnOrdering: true');
    expect(code).toContain('enableColumnPinning: true');
    expect(code).toContain('enablePagination: false');
    expect(code).toContain('pageSize: 5');
    expect(code).toContain('pageSizeOptions: [5, 10]');
    expect(code).toContain("globalFilterPlaceholder: 'Buscar fatura, cliente, método...'");
    expect(code).toContain("emptyMessage: 'Nenhuma fatura encontrada.'");
  });

  it('a altura máxima só acompanha a virtualização', () => {
    expect(dataTableSnippet({ maxHeight: '400px' })).not.toContain('maxHeight');
    const virtual = dataTableSnippet({ virtualized: true, maxHeight: '400px' });
    expect(virtual).toContain('virtualized: true');
    expect(virtual).toContain("maxHeight: '400px'");
  });

  it('troca o desenho das colunas conforme o assunto da story', () => {
    expect(dataTableSnippet()).toContain("meta: { headerLabel: 'Fatura' }");
    expect(dataTableSnippet({ colunas: 'filtro' })).toContain("filter: { type: 'text' }");
    expect(dataTableSnippet({ colunas: 'editavel' })).toContain('editable: true');
  });

  it('mantém a identidade da linha e o nome da grade', () => {
    const code = dataTableSnippet();
    expect(code).toContain("caption: 'Faturas recentes'");
    expect(code).toContain('rowKey: (fatura) => fatura.id');
    expect(code).not.toContain('rowLabel');
    expect(dataTableSnippet({ rowLabel: '(fatura) => fatura.customer' })).toContain(
      'rowLabel: (fatura) => fatura.customer',
    );
  });

  it('o estado sem resultado é dado vazio, e não grade desmontada', () => {
    const code = dataTableSnippet({ semDados: true, emptyMessage: 'Nenhuma fatura encontrada.' });
    expect(code).toContain('data: [],');
    expect(code).toContain('const columns: DataTableColumn<Invoice>[] = [');
  });

  it('leva dados próprios, e não a fixture das stories', () => {
    const code = dataTableSnippet();
    expect(code).toContain('const invoices: Invoice[] = [');
    expect(code).not.toContain('data-table.fixtures');
    expect(code).not.toContain('baseColumns');
    expect(code).not.toContain('rotulosFatura');
    expect(code).not.toContain('bigData');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const code = dataTableSnippet({
      onCellEdit: (() => undefined) as unknown as string,
      rowLabel: (() => undefined) as unknown as string,
    });
    expect(code).not.toContain('onCellEdit');
    expect(code).not.toContain('rowLabel');
  });

  it('usa o nome acessível canônico no bloco de textos', () => {
    const code = dataTableSnippet({ labels: true });
    expect(code).toContain("selectAll: 'Selecionar todas as faturas'");
    expect(code).toContain('selectRow: (fatura) =>');
    expect(dataTableSnippet()).not.toContain('labels');
  });
});

describe('dataTableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = dataTableSource('<div data-slot="data-table">', {});
    const withArgs = dataTableSource('<div data-slot="data-table">', {
      args: { enableRowSelection: true, enablePagination: false },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain('enableRowSelection: true');
    expect(withArgs).toContain('enablePagination: false');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dataTableSource('<div data-slot="data-table" class="nds-data-table">', {})).not.toContain(
      'class="nds-data-table"',
    );
  });
});

describe('dataTableSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dataTableSourceWith({ virtualized: true, maxHeight: '400px' });
    const code = transform('', { args: { enablePagination: true, enableRowSelection: true } });
    expect(code).toContain('virtualized: true');
    expect(code).toContain("maxHeight: '400px'");
    expect(code).toContain('enableRowSelection: true');
  });
});
