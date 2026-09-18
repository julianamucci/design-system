import { describe, expect, it } from 'vitest';
import {
  dataTableColumnsRedimensionaveisSource,
  dataTableEditInlineSource,
  columnDataTableFiltersSource,
  dataTablePaginadaSource,
  dataTableReordenarEFixarSource,
  lineDataTableLabelSource,
  dataTableNoResultsSource,
  dataTableSource,
  dataTableVirtualizadaSource,
} from './data-table.source';

describe('dataTableSource', () => {
  it('sem args, entrega a tabela com as colunas em escopo estável', () => {
    expect(dataTableSource()).toBe(
      `<script lang="ts">
  import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

  interface Invoice {
    id: string;
    customer: string;
    status: 'Pago' | 'Pendente' | 'Cancelado';
    method: string;
    amount: number;
  }

  const invoices: Invoice[] = [
    { id: 'INV-001', customer: 'Ana Souza',    status: 'Pago',      method: 'Cartão de crédito', amount: 250 },
    { id: 'INV-002', customer: 'Bruno Lima',   status: 'Pendente',  method: 'Boleto bancário',   amount: 150 },
    { id: 'INV-003', customer: 'Carla Mendes', status: 'Cancelado', method: 'Pix',               amount: 350 },
  ];

  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const varianteDoStatus = {
    Pago: 'default',
    Pendente: 'warning',
    Cancelado: 'destructive',
  } as const;

  const columns: DataTableColumn<Invoice>[] = [
    { accessorKey: 'id', header: 'Fatura', size: 110 },
    { accessorKey: 'customer', header: 'Cliente', size: 200 },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      meta: { badgeVariant: (v) => varianteDoStatus[v as Invoice['status']] },
    },
    { accessorKey: 'method', header: 'Método', size: 200 },
    {
      accessorKey: 'amount',
      header: 'Valor',
      size: 130,
      meta: {
        format: (v) => moeda.format(Number(v)),
        cellClass: 'nds-font-medium nds-tabular-nums',
      },
    },
  ];
</script>

<DataTable
  {columns}
  data={invoices}
  caption="Faturas recentes"
  globalFilterPlaceholder="Buscar fatura, cliente, método..."
/>`,
    );
  });

  it('a seleção de linhas traz junto os rótulos do domínio e a chave da linha', () => {
    // As três peças andam juntas: sem `labels` os controles ficariam com o
    // texto genérico, e sem `rowKey` a identidade da linha seria a posição.
    const output = dataTableSource('', { args: { enableRowSelection: true } });
    expect(output).toContain('  enableRowSelection\n');
    expect(output).toContain('labels={rotulos}');
    expect(output).toContain('rowKey={chaveDaFatura}');
    expect(output).toContain('type DataTableLabels');
    expect(dataTableSource()).not.toContain('labels={rotulos}');
  });

  it('só escreve as chaves ligadas por padrão quando elas são desligadas', () => {
    expect(dataTableSource()).not.toContain('enablePagination');
    expect(dataTableSource('', { args: { enablePagination: false } })).toContain(
      'enablePagination={false}',
    );
    expect(dataTableSource('', { args: { enableColumnVisibility: false } })).toContain(
      'enableColumnVisibility={false}',
    );
  });

  it('o campo de busca desaparece do snippet quando a busca livre é desligada', () => {
    const output = dataTableSource('', { args: { enableGlobalFilter: false } });
    expect(output).toContain('enableGlobalFilter={false}');
    expect(output).not.toContain('globalFilterPlaceholder');
  });

  it('só escreve pageSize quando o valor difere do padrão', () => {
    expect(dataTableSource('', { args: { pageSize: 10 } })).not.toContain('pageSize');
    expect(dataTableSource('', { args: { pageSize: 5 } })).toContain('pageSize={5}');
  });

  it('a legenda e o texto da busca acompanham os controls', () => {
    const output = dataTableSource('', {
      args: { caption: 'Faturas do trimestre', globalFilterPlaceholder: 'Buscar...' },
    });
    expect(output).toContain('caption="Faturas do trimestre"');
    expect(output).toContain('globalFilterPlaceholder="Buscar..."');
  });
});

describe('transforms das stories de estado, composição e configuração', () => {
  it('o estado sem resultados mantém a grade montada e troca a mensagem', () => {
    const output = dataTableNoResultsSource();
    expect(output).toContain('const invoices: Invoice[] = [];');
    expect(output).toContain('emptyMessage="Nenhuma fatura encontrada."');
  });

  it('o filtro por coluna é declarado na própria coluna, por tipo', () => {
    const output = columnDataTableFiltersSource();
    expect(output).toContain('enableColumnFilters');
    expect(output).toContain("filter: { type: 'text' }");
    expect(output).toContain("filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] }");
  });

  it('as colunas redimensionáveis ligam só a própria chave', () => {
    const output = dataTableColumnsRedimensionaveisSource();
    expect(output).toContain('enableColumnResizing');
    expect(output).not.toContain('enableColumnOrdering');
  });

  it('reordenar e fixar são duas chaves, e andam juntas na story', () => {
    const output = dataTableReordenarEFixarSource();
    expect(output).toContain('enableColumnOrdering');
    expect(output).toContain('enableColumnPinning');
  });

  it('na edição inline quem guarda o dado é quem consome, pelo callback', () => {
    const output = dataTableEditInlineSource();
    expect(output).toContain('meta: { editable: true }');
    expect(output).toContain('let data = $state<Invoice[]>');
    expect(output).toContain('onCellEdit={(rowIndex, columnId, value) => {');
  });

  it('a paginação declara o tamanho inicial dentro das opções do seletor', () => {
    const output = dataTablePaginadaSource();
    expect(output).toContain('pageSize={5}');
    expect(output).toContain('pageSizeOptions={[5, 10]}');
  });

  it('o rótulo de linha explícito convive com a chave da linha', () => {
    const output = lineDataTableLabelSource();
    expect(output).toContain('rowLabel={rotuloDaFatura}');
    expect(output).toContain('rowKey={chaveDaFatura}');
  });

  it('a virtualização declara o teto de altura e dispensa a paginação', () => {
    const output = dataTableVirtualizadaSource();
    expect(output).toContain('virtualized');
    expect(output).toContain('maxHeight="400px"');
    expect(output).toContain('{ length: 1000 }');
    expect(output).not.toContain('enablePagination');
  });
});
