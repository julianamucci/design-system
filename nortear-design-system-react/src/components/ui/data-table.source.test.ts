import { describe, expect, it } from 'vitest';
import {
  dataTableWithEditSource,
  columnDataTableWithFiltersSource,
  lineDataTableWithLabelSource,
  dataTablePaginadaSource,
  dataTableRedimensionavelSource,
  dataTableReordenavelEFixavelSource,
  dataTableNoResultsSource,
  dataTableSource,
  dataTableVirtualizadaSource,
} from './data-table.source';

const ALL = [
  dataTableSource,
  columnDataTableWithFiltersSource,
  dataTableRedimensionavelSource,
  dataTableReordenavelEFixavelSource,
  dataTableWithEditSource,
  dataTablePaginadaSource,
  lineDataTableWithLabelSource,
  dataTableVirtualizadaSource,
  dataTableNoResultsSource,
];

describe('dataTableSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = dataTableSource();
    expect(output).toContain('import { DataTable, type DataTableColumn } from "@/components/ui/data-table";');
    expect(output).not.toContain('@tanstack');
  });

  it('DECLARA os dados que a tabela consome', () => {
    // A transform inline que morava no `meta` escrevia `data={invoices}` sem
    // declarar `invoices` em lugar nenhum: quem copiava recebia uma tabela sem
    // dados e um erro de compilação.
    const output = dataTableSource();
    expect(output).toContain('const invoices = [');
    const declaration = output.indexOf('const invoices');
    expect(declaration).toBeGreaterThan(-1);
    expect(output.indexOf('data={invoices}')).toBeGreaterThan(declaration);
  });

  it('declara colunas e tipo antes de usá-los', () => {
    const output = dataTableSource();
    expect(output).toContain('const columns: DataTableColumn<(typeof invoices)[number]>[] = [');
    expect(output.indexOf('const columns: DataTableColumn<(typeof invoices)[number]>[] = [')).toBeLessThan(
      output.indexOf('columns={columns}'),
    );
  });

  it('as colunas trazem o que a tabela realmente renderiza', () => {
    // Badge no status e valor formatado: a transform antiga listava colunas
    // cruas e o painel mentia sobre o que estava na tela.
    const output = dataTableSource();
    expect(output).toContain('<Badge variant={statusVariant[row.original.status]}>');
    expect(output).toContain('{currency.format(row.original.amount)}');
  });

  it('nenhum snippet ensina o módulo de fixtures', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('fixtures');
      expect(fn()).not.toContain('baseColumns');
      expect(fn()).not.toContain('rotulosFatura');
    }
  });

  it('rowKey está sempre presente: a marcação viaja com o registro', () => {
    // Sem ele a chave da linha é a POSIÇÃO, e ordenar deixa marcadas as mesmas
    // linhas da tela, não os mesmos dados.
    expect(dataTableSource()).toContain('rowKey={(fatura) => fatura.id}');
  });

  it('os rótulos do domínio acompanham a seleção', () => {
    // Dez controles chamados "Selecionar linha" são indistinguíveis entre si
    // para quem usa leitor de tela (WCAG 4.1.2).
    const output = dataTableSource();
    expect(output).toContain('const rotulos = {');
    expect(output).toContain('selectAll: "Selecionar todas as faturas",');
    expect(output).toContain('labels={rotulos}');
  });

  it('sem seleção, os rótulos de seleção saem do snippet', () => {
    const output = dataTableSource(undefined, { args: { enableRowSelection: false } });
    expect(output).not.toContain('const rotulos = {');
    expect(output).not.toContain('labels={rotulos}');
    expect(output).not.toContain('enableRowSelection');
  });

  it('escreve só o que difere do padrão do componente', () => {
    const output = dataTableSource(undefined, {
      args: {
        enableRowSelection: true,
        enableGlobalFilter: true,
        enableColumnVisibility: true,
        enablePagination: false,
        pageSize: 25,
      },
    });
    expect(output).toContain('enableRowSelection');
    expect(output).toContain('enablePagination={false}');
    expect(output).toContain('pageSize={25}');
    // Iguais ao padrão: não entram.
    expect(output).not.toContain('enableGlobalFilter');
    expect(output).not.toContain('enableColumnVisibility');
  });

  it('a legenda nomeia a tabela, e cai no padrão quando o control não dá texto', () => {
    expect(dataTableSource()).toContain('caption="Faturas recentes"');
    expect(dataTableSource(undefined, { args: { caption: 'Pedidos do mês' } })).toContain(
      'caption="Pedidos do mês"',
    );
  });

  it('não deixa espião de control virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = dataTableSource(undefined, {
      args: { caption: spy, globalFilterPlaceholder: spy, pageSize: spy },
    });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('caption="Faturas recentes"');
    expect(output).not.toContain('pageSize=');
  });
});

describe('configurações por feature', () => {
  it('o filtro por coluna é declarado na COLUNA', () => {
    const output = columnDataTableWithFiltersSource();
    expect(output).toContain('meta: { filter: { type: "text" } }');
    expect(output).toContain('filter: { type: "select", options: ["Pago", "Pendente", "Cancelado"] }');
    expect(output).toContain('enableColumnFilters');
  });

  it('redimensionar é uma flag só, sobre as mesmas colunas', () => {
    expect(dataTableRedimensionavelSource()).toContain('enableColumnResizing');
  });

  it('reordenar e fixar andam juntas', () => {
    const output = dataTableReordenavelEFixavelSource();
    expect(output).toContain('enableColumnOrdering');
    expect(output).toContain('enableColumnPinning');
  });

  it('a edição inline exige dono de estado: a tabela não guarda os dados', () => {
    const output = dataTableWithEditSource();
    expect(output).toContain('meta: { editable: true }');
    expect(output).toContain('const [dados, setDados] = useState(invoices);');
    expect(output).toContain('onCellEdit={(rowIndex, columnId, value) =>');
  });

  it('o tamanho inicial de página aparece junto das opções do seletor', () => {
    // Fora da lista, o seletor não tem opção marcada e passa a exibir a
    // primeira — diria "10" numa tabela que mostra cinco.
    const output = dataTablePaginadaSource();
    expect(output).toContain('pageSize={5}');
    expect(output).toContain('pageSizeOptions={[5, 10]}');
  });

  it('rowLabel vence a primeira coluna como identificador da linha', () => {
    const output = lineDataTableWithLabelSource();
    expect(output).toContain('rowLabel={(fatura) => fatura.customer}');
    expect(output).toContain('rowKey={(fatura) => fatura.id}');
  });

  it('a virtualização declara a altura da janela e desliga a paginação', () => {
    const output = dataTableVirtualizadaSource();
    expect(output).toContain('virtualized');
    expect(output).toContain('maxHeight="400px"');
    expect(output).not.toContain('enablePagination');
    // O conjunto grande é DECLARADO, não importado de um arquivo de story.
    expect(output).toContain('const muitasFaturas = Array.from({ length: 1000 }');
  });

  it('o estado vazio chega como recorte, e a grade continua de pé', () => {
    // O conjunto vazio é o `data`; as colunas permanecem, porque quem esvaziou
    // o recorte com um filtro precisa do campo para desfazer.
    const output = dataTableNoResultsSource();
    expect(output).toContain('data={[]}');
    expect(output).toContain('emptyMessage="Nenhuma fatura encontrada."');
    expect(output).toContain('columns={columns}');
  });
});
