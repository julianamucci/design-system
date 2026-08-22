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
  it('sem args, entrega a forma canônica da tabela de faturas', () => {
    expect(dataTableSource()).toBe(
      `<script setup lang="ts">
import { h } from 'vue'
import {
  DataTable,
  type DataTableColumn,
  type DataTableLabels,
} from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'

interface Invoice {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
}

const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Ana Souza',      status: 'Pago',      method: 'Cartão de crédito', amount: 250 },
  { id: 'INV-002', customer: 'Bruno Lima',     status: 'Pendente',  method: 'Boleto bancário',   amount: 150 },
  { id: 'INV-003', customer: 'Carla Mendes',   status: 'Cancelado', method: 'Pix',               amount: 350 },
  { id: 'INV-004', customer: 'Diego Faria',    status: 'Pago',      method: 'Cartão de débito',  amount: 450 },
  { id: 'INV-005', customer: 'Eva Oliveira',   status: 'Pendente',  method: 'Transferência',     amount: 200 },
  { id: 'INV-006', customer: 'Felipe Castro',  status: 'Pago',      method: 'Pix',               amount: 920 },
  { id: 'INV-007', customer: 'Gabi Rocha',     status: 'Pendente',  method: 'Boleto bancário',   amount: 78 },
  { id: 'INV-008', customer: 'Hugo Almeida',   status: 'Cancelado', method: 'Cartão de crédito', amount: 1200 },
  { id: 'INV-009', customer: 'Iris Pereira',   status: 'Pago',      method: 'Pix',               amount: 60 },
  { id: 'INV-010', customer: 'João Martins',   status: 'Pago',      method: 'Cartão de crédito', amount: 540 },
  { id: 'INV-011', customer: 'Karen Vieira',   status: 'Pendente',  method: 'Boleto bancário',   amount: 220 },
  { id: 'INV-012', customer: 'Lucas Nogueira', status: 'Pago',      method: 'Pix',               amount: 99 },
]

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const varianteDoStatus = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
} as const

const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110 },
  { accessorKey: 'customer', header: 'Cliente', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) =>
      h(Badge, { variant: varianteDoStatus[row.original.status] }, () => row.original.status),
  },
  { accessorKey: 'method', header: 'Método', size: 200 },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
    cell: ({ row }) =>
      h(
        'span',
        { class: 'nds-font-medium nds-tabular-nums' },
        moeda.format(row.original.amount),
      ),
  },
]

// Só as chaves informadas mudam; o resto continua no padrão do componente.
const rotulos: Partial<DataTableLabels> = {
  selectAll: 'Selecionar todas as faturas',
  selectRow: (r) => \`Selecionar fatura \${r}\`,
}

// A identidade da linha é o número da fatura, e não a posição na tela. Sem ela
// a identidade seria a POSIÇÃO, e ordenar moveria a marcação de linha.
const chaveDaFatura = (f: Invoice) => f.id
</script>

<template>
  <DataTable
    :columns="columns"
    :data="invoices"
    enable-row-selection
    caption="Faturas recentes"
    global-filter-placeholder="Buscar fatura, cliente, método..."
    :labels="rotulos"
    :row-key="chaveDaFatura"
  />
</template>`,
    );
  });

  it('as doze faturas são literais, e não um import de massa de teste', () => {
    const saida = dataTableSource();
    // A contagem importa: a paginação em fatias de cinco e as contagens
    // anunciadas só fazem sentido contra o conjunto inteiro.
    expect([...saida.matchAll(/^ {2}\{ id: 'INV-\d{3}',/gm)].length).toBe(12);
    expect(saida).toContain('const invoices: Invoice[] = [');
  });

  it('nenhum dos quatro interruptores ligados por padrão aparece ligado', () => {
    const saida = dataTableSource();
    // Repetir o padrão do componente ensina ruído.
    expect(saida).not.toContain('enable-global-filter');
    expect(saida).not.toContain('enable-column-visibility');
    expect(saida).not.toContain('enable-pagination');
    expect(saida).not.toContain('page-size');
    // A seleção de linha, essa sim, nasce DESLIGADA no componente.
    expect(saida).toContain('    enable-row-selection\n');
  });

  it('desligar um interruptor escreve a negação, e não o silêncio', () => {
    const saida = dataTableSource('', {
      args: { enableGlobalFilter: false, enablePagination: false, pageSize: 25 },
    });
    expect(saida).toContain(':enable-global-filter="false"');
    expect(saida).toContain(':enable-pagination="false"');
    expect(saida).toContain(':page-size="25"');
    // Sem busca livre não há campo a nomear.
    expect(saida).not.toContain('global-filter-placeholder');
  });

  it('sem seleção de linha, os rótulos e a chave saem junto do import', () => {
    const saida = dataTableSource('', { args: { enableRowSelection: false } });
    expect(saida).not.toContain('DataTableLabels');
    expect(saida).not.toContain(':labels="rotulos"');
    expect(saida).not.toContain(':row-key=');
  });

  it('o texto padrão do vazio e da busca fica de fora', () => {
    const saida = dataTableSource('', {
      args: { emptyMessage: 'Sem resultados.', globalFilterPlaceholder: 'Buscar...' },
    });
    expect(saida).not.toContain('empty-message');
    expect(saida).not.toContain('global-filter-placeholder');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onCellEdit` e `onTableReady` são `fn()` no meta: qualquer arg pode chegar
    // como função, e o corpo do mock apareceria como se fosse o exemplo.
    const saida = dataTableSource('', {
      args: { caption: (() => {}) as never, globalFilterPlaceholder: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('caption=');
    expect(saida).not.toContain('global-filter-placeholder');
  });
});

describe('transforms das stories de estado e configuração', () => {
  it('o vazio é uma lista vazia, e a grade continua montada', () => {
    const saida = dataTableNoResultsSource();
    expect(saida).toContain('const invoices: Invoice[] = []');
    expect(saida).toContain('empty-message="Nenhuma fatura encontrada."');
    // As colunas ficam: quem esvaziou o resultado com um filtro precisa saber
    // o que volta.
    expect(saida).toContain(`{ accessorKey: 'id', header: 'Fatura', size: 110 }`);
  });

  it('a paginada põe o tamanho inicial DENTRO das opções do seletor', () => {
    const saida = dataTablePaginadaSource();
    expect(saida).toContain(':page-size="5"');
    // Fora da lista, nenhuma opção fica marcada e o rodapé exibe a primeira.
    expect(saida).toContain(':page-size-options="[5, 10]"');
  });

  it('o rótulo de linha explícito vem acompanhado da chave, e vence a primeira coluna', () => {
    const saida = lineDataTableLabelSource();
    expect(saida).toContain('const rotuloDaFatura = (f: Invoice) => f.customer');
    expect(saida).toContain(':row-label="rotuloDaFatura"');
    expect(saida).toContain(':row-key="chaveDaFatura"');
  });

  it('a virtualizada gera as mil linhas e não pagina junto', () => {
    const saida = dataTableVirtualizadaSource();
    expect(saida).toContain('Array.from({ length: 1000 }');
    expect(saida).toContain('max-height="400px"');
    // Recortar em páginas e virtualizar a janela resolvem o mesmo problema.
    expect(saida).not.toContain('page-size');
  });
});

describe('transforms das stories de composição', () => {
  it('o filtro de cada coluna é declarado na própria coluna', () => {
    const saida = columnDataTableFiltersSource();
    expect(saida).toContain(`meta: { filter: { type: 'text' } }`);
    expect(saida).toContain(`type: 'select', options: ['Pago', 'Pendente', 'Cancelado']`);
    // A coluna de valor fica SEM filtro: é ela que exercita a célula que anuncia
    // de qual coluna o espaço vazio é.
    expect(saida).toContain(`    accessorKey: 'amount',\n    header: 'Valor',\n    cell:`);
    expect(saida).toContain('enable-column-filters');
  });

  it('redimensionar e reordenar são flags distintas, e a fixação anda em par com a ordem', () => {
    expect(dataTableColumnsRedimensionaveisSource()).toContain('enable-column-resizing');
    const columnsPair = dataTableReordenarEFixarSource();
    expect(columnsPair).toContain('enable-column-ordering');
    expect(columnsPair).toContain('enable-column-pinning');
  });

  it('na edição inline o array é do consumidor, e o evento é quem avisa', () => {
    const saida = dataTableEditInlineSource();
    expect(saida).toContain(`import { h, ref } from 'vue'`);
    expect(saida).toContain('const data = ref<Invoice[]>(invoices.slice(0, 6))');
    // O payload tem os três campos; sem eles quem consome não sabe o que mudou.
    expect(saida).toContain(
      'function aoEditarCelula(rowIndex: number, columnId: string, value: unknown)',
    );
    expect(saida).toContain('@cell-edit="aoEditarCelula"');
    expect(saida).toContain(':data="data"');
  });

  it('a coluna editável se declara na coluna, e não numa lista de fora', () => {
    const saida = dataTableEditInlineSource();
    expect(saida).toContain(`{ accessorKey: 'customer', header: 'Cliente', meta: { editable: true } }`);
    // A primeira coluna continua não editável: o identificador da linha não é
    // campo de digitação.
    expect(saida).toContain(`{ accessorKey: 'id', header: 'Fatura' },`);
  });
});
