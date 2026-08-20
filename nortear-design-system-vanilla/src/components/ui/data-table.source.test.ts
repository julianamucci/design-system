import { describe, expect, it } from 'vitest';
import { dataTableSnippet, dataTableSource, dataTableSourceCom } from './data-table.source';

describe('dataTableSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML da grade', () => {
    const código = dataTableSnippet();
    expect(código).toContain(
      "import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';",
    );
    expect(código).toContain('createDataTable<Invoice>({');
    // Forma abreviada: `columns: columns` é ruído que ninguém digita.
    expect(código).toContain('\n  columns,\n');
    expect(código).toContain("document.querySelector('#app')?.append(tabela);");
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('nds-data-table-th');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = dataTableSnippet();
    expect(código).not.toContain('enableRowSelection');
    expect(código).not.toContain('enableGlobalFilter');
    expect(código).not.toContain('enablePagination');
    expect(código).not.toContain('enableColumnVisibility');
    expect(código).not.toContain('virtualized');
    expect(código).not.toContain('pageSize');
  });

  it('não repete os textos que a fábrica já traz', () => {
    const código = dataTableSnippet({
      globalFilterPlaceholder: 'Buscar...',
      emptyMessage: 'Sem resultados.',
      pageSize: 10,
    });
    expect(código).not.toContain('globalFilterPlaceholder');
    expect(código).not.toContain('emptyMessage');
    expect(código).not.toContain('pageSize');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = dataTableSnippet({
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
    expect(código).toContain('enableRowSelection: true');
    expect(código).toContain('enableColumnFilters: true');
    expect(código).toContain('enableColumnResizing: true');
    expect(código).toContain('enableColumnOrdering: true');
    expect(código).toContain('enableColumnPinning: true');
    expect(código).toContain('enablePagination: false');
    expect(código).toContain('pageSize: 5');
    expect(código).toContain('pageSizeOptions: [5, 10]');
    expect(código).toContain("globalFilterPlaceholder: 'Buscar fatura, cliente, método...'");
    expect(código).toContain("emptyMessage: 'Nenhuma fatura encontrada.'");
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
    const código = dataTableSnippet();
    expect(código).toContain("caption: 'Faturas recentes'");
    expect(código).toContain('rowKey: (fatura) => fatura.id');
    expect(código).not.toContain('rowLabel');
    expect(dataTableSnippet({ rowLabel: '(fatura) => fatura.customer' })).toContain(
      'rowLabel: (fatura) => fatura.customer',
    );
  });

  it('o estado sem resultado é dado vazio, e não grade desmontada', () => {
    const código = dataTableSnippet({ semDados: true, emptyMessage: 'Nenhuma fatura encontrada.' });
    expect(código).toContain('data: [],');
    expect(código).toContain('const columns: DataTableColumn<Invoice>[] = [');
  });

  it('leva dados próprios, e não a fixture das stories', () => {
    const código = dataTableSnippet();
    expect(código).toContain('const invoices: Invoice[] = [');
    expect(código).not.toContain('data-table.fixtures');
    expect(código).not.toContain('baseColumns');
    expect(código).not.toContain('rotulosFatura');
    expect(código).not.toContain('bigData');
  });

  it('nunca imprime a função que os args trazem no lugar do corpo do callback', () => {
    const código = dataTableSnippet({
      onCellEdit: (() => undefined) as unknown as string,
      rowLabel: (() => undefined) as unknown as string,
    });
    expect(código).not.toContain('onCellEdit');
    expect(código).not.toContain('rowLabel');
  });

  it('usa o nome acessível canônico no bloco de textos', () => {
    const código = dataTableSnippet({ labels: true });
    expect(código).toContain("selectAll: 'Selecionar todas as faturas'");
    expect(código).toContain('selectRow: (fatura) =>');
    expect(dataTableSnippet()).not.toContain('labels');
  });
});

describe('dataTableSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const semArgs = dataTableSource('<div data-slot="data-table">', {});
    const comArgs = dataTableSource('<div data-slot="data-table">', {
      args: { enableRowSelection: true, enablePagination: false },
    });
    expect(semArgs).not.toBe(comArgs);
    expect(comArgs).toContain('enableRowSelection: true');
    expect(comArgs).toContain('enablePagination: false');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(dataTableSource('<div data-slot="data-table" class="nds-data-table">', {})).not.toContain(
      'class="nds-data-table"',
    );
  });
});

describe('dataTableSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = dataTableSourceCom({ virtualized: true, maxHeight: '400px' });
    const código = transform('', { args: { enablePagination: true, enableRowSelection: true } });
    expect(código).toContain('virtualized: true');
    expect(código).toContain("maxHeight: '400px'");
    expect(código).toContain('enableRowSelection: true');
  });
});
