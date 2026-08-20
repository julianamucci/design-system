import { describe, expect, it } from 'vitest';
import {
  dataTableComEdicaoSource,
  dataTableComFiltrosDeColunaSource,
  dataTableComRotuloDeLinhaSource,
  dataTablePaginadaSource,
  dataTableRedimensionavelSource,
  dataTableReordenavelEFixavelSource,
  dataTableSemResultadosSource,
  dataTableSource,
  dataTableVirtualizadaSource,
} from './data-table.source';

const TODAS = [
  dataTableSource,
  dataTableComFiltrosDeColunaSource,
  dataTableRedimensionavelSource,
  dataTableReordenavelEFixavelSource,
  dataTableComEdicaoSource,
  dataTablePaginadaSource,
  dataTableComRotuloDeLinhaSource,
  dataTableVirtualizadaSource,
  dataTableSemResultadosSource,
];

describe('dataTableSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = dataTableSource();
    expect(saida).toContain('import { DataTable, type DataTableColumn } from "@/components/ui/data-table";');
    expect(saida).not.toContain('@tanstack');
  });

  it('DECLARA os dados que a tabela consome', () => {
    // A transform inline que morava no `meta` escrevia `data={invoices}` sem
    // declarar `invoices` em lugar nenhum: quem copiava recebia uma tabela sem
    // dados e um erro de compilação.
    const saida = dataTableSource();
    expect(saida).toContain('const invoices = [');
    const declaracao = saida.indexOf('const invoices');
    expect(declaracao).toBeGreaterThan(-1);
    expect(saida.indexOf('data={invoices}')).toBeGreaterThan(declaracao);
  });

  it('declara colunas e tipo antes de usá-los', () => {
    const saida = dataTableSource();
    expect(saida).toContain('const columns: DataTableColumn<(typeof invoices)[number]>[] = [');
    expect(saida.indexOf('const columns: DataTableColumn<(typeof invoices)[number]>[] = [')).toBeLessThan(
      saida.indexOf('columns={columns}'),
    );
  });

  it('as colunas trazem o que a tabela realmente renderiza', () => {
    // Badge no status e valor formatado: a transform antiga listava colunas
    // cruas e o painel mentia sobre o que estava na tela.
    const saida = dataTableSource();
    expect(saida).toContain('<Badge variant={statusVariant[row.original.status]}>');
    expect(saida).toContain('{currency.format(row.original.amount)}');
  });

  it('nenhum snippet ensina o módulo de fixtures', () => {
    for (const fn of TODAS) {
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
    const saida = dataTableSource();
    expect(saida).toContain('const rotulos = {');
    expect(saida).toContain('selectAll: "Selecionar todas as faturas",');
    expect(saida).toContain('labels={rotulos}');
  });

  it('sem seleção, os rótulos de seleção saem do snippet', () => {
    const saida = dataTableSource(undefined, { args: { enableRowSelection: false } });
    expect(saida).not.toContain('const rotulos = {');
    expect(saida).not.toContain('labels={rotulos}');
    expect(saida).not.toContain('enableRowSelection');
  });

  it('escreve só o que difere do padrão do componente', () => {
    const saida = dataTableSource(undefined, {
      args: {
        enableRowSelection: true,
        enableGlobalFilter: true,
        enableColumnVisibility: true,
        enablePagination: false,
        pageSize: 25,
      },
    });
    expect(saida).toContain('enableRowSelection');
    expect(saida).toContain('enablePagination={false}');
    expect(saida).toContain('pageSize={25}');
    // Iguais ao padrão: não entram.
    expect(saida).not.toContain('enableGlobalFilter');
    expect(saida).not.toContain('enableColumnVisibility');
  });

  it('a legenda nomeia a tabela, e cai no padrão quando o control não dá texto', () => {
    expect(dataTableSource()).toContain('caption="Faturas recentes"');
    expect(dataTableSource(undefined, { args: { caption: 'Pedidos do mês' } })).toContain(
      'caption="Pedidos do mês"',
    );
  });

  it('não deixa espião de control virar código', () => {
    const espiao = (() => 'CORPO_DO_MOCK') as never;
    const saida = dataTableSource(undefined, {
      args: { caption: espiao, globalFilterPlaceholder: espiao, pageSize: espiao },
    });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('caption="Faturas recentes"');
    expect(saida).not.toContain('pageSize=');
  });
});

describe('configurações por feature', () => {
  it('o filtro por coluna é declarado na COLUNA', () => {
    const saida = dataTableComFiltrosDeColunaSource();
    expect(saida).toContain('meta: { filter: { type: "text" } }');
    expect(saida).toContain('filter: { type: "select", options: ["Pago", "Pendente", "Cancelado"] }');
    expect(saida).toContain('enableColumnFilters');
  });

  it('redimensionar é uma flag só, sobre as mesmas colunas', () => {
    expect(dataTableRedimensionavelSource()).toContain('enableColumnResizing');
  });

  it('reordenar e fixar andam juntas', () => {
    const saida = dataTableReordenavelEFixavelSource();
    expect(saida).toContain('enableColumnOrdering');
    expect(saida).toContain('enableColumnPinning');
  });

  it('a edição inline exige dono de estado: a tabela não guarda os dados', () => {
    const saida = dataTableComEdicaoSource();
    expect(saida).toContain('meta: { editable: true }');
    expect(saida).toContain('const [dados, setDados] = useState(invoices);');
    expect(saida).toContain('onCellEdit={(rowIndex, columnId, value) =>');
  });

  it('o tamanho inicial de página aparece junto das opções do seletor', () => {
    // Fora da lista, o seletor não tem opção marcada e passa a exibir a
    // primeira — diria "10" numa tabela que mostra cinco.
    const saida = dataTablePaginadaSource();
    expect(saida).toContain('pageSize={5}');
    expect(saida).toContain('pageSizeOptions={[5, 10]}');
  });

  it('rowLabel vence a primeira coluna como identificador da linha', () => {
    const saida = dataTableComRotuloDeLinhaSource();
    expect(saida).toContain('rowLabel={(fatura) => fatura.customer}');
    expect(saida).toContain('rowKey={(fatura) => fatura.id}');
  });

  it('a virtualização declara a altura da janela e desliga a paginação', () => {
    const saida = dataTableVirtualizadaSource();
    expect(saida).toContain('virtualized');
    expect(saida).toContain('maxHeight="400px"');
    expect(saida).not.toContain('enablePagination');
    // O conjunto grande é DECLARADO, não importado de um arquivo de story.
    expect(saida).toContain('const muitasFaturas = Array.from({ length: 1000 }');
  });

  it('o estado vazio chega como recorte, e a grade continua de pé', () => {
    // O conjunto vazio é o `data`; as colunas permanecem, porque quem esvaziou
    // o recorte com um filtro precisa do campo para desfazer.
    const saida = dataTableSemResultadosSource();
    expect(saida).toContain('data={[]}');
    expect(saida).toContain('emptyMessage="Nenhuma fatura encontrada."');
    expect(saida).toContain('columns={columns}');
  });
});
