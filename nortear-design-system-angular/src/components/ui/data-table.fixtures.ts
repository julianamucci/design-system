import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import {
  NdsDataTable,
  type DataTableCellEdit,
  type DataTableColumn,
  type DataTableLabels,
} from './data-table';

// Fixture compartilhada pelas stories do DataTable.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export const FATURAS_DT` dentro de um `*.stories.ts` viraria uma story
// "Faturas Dt" que não renderiza nada.
//
// As faturas são as mesmas cinco das outras stacks nas cinco primeiras posições
// — a regressão visual do Chromatic compara a mesma tabela em cinco portas. As
// sete seguintes existem só aqui, para haver mais de uma página: com cinco
// linhas os botões de paginação nasceriam todos desabilitados e não haveria o
// que testar.

export interface InvoiceDT {
  id: string;
  cliente: string;
  status: string;
  metodo: string;
  valor: number;
}

export const INVOICES_DT: InvoiceDT[] = [
  { id: '#INV-001', cliente: 'Ana Prado',      status: 'Pago',      metodo: 'Cartão de crédito',      valor: 250 },
  { id: '#INV-002', cliente: 'Bruno Lima',     status: 'Pendente',  metodo: 'Transferência bancária', valor: 150 },
  { id: '#INV-003', cliente: 'Carla Souza',    status: 'Cancelado', metodo: 'Pix',                    valor: 350 },
  { id: '#INV-004', cliente: 'Diego Martins',  status: 'Pago',      metodo: 'Cartão de crédito',      valor: 450 },
  { id: '#INV-005', cliente: 'Elisa Rocha',    status: 'Pendente',  metodo: 'Pix',                    valor: 50  },
  { id: '#INV-006', cliente: 'Fábio Nunes',    status: 'Pago',      metodo: 'Pix',                    valor: 90  },
  { id: '#INV-007', cliente: 'Gabriela Alves', status: 'Pendente',  metodo: 'Cartão de crédito',      valor: 720 },
  { id: '#INV-008', cliente: 'Henrique Dias',  status: 'Cancelado', metodo: 'Transferência bancária', valor: 180 },
  { id: '#INV-009', cliente: 'Isabel Freitas', status: 'Pago',      metodo: 'Pix',                    valor: 310 },
  { id: '#INV-010', cliente: 'João Teixeira',  status: 'Pendente',  metodo: 'Pix',                    valor: 40  },
  { id: '#INV-011', cliente: 'Karina Melo',    status: 'Pago',      metodo: 'Cartão de crédito',      valor: 990 },
  { id: '#INV-012', cliente: 'Lucas Barreto',  status: 'Cancelado', metodo: 'Pix',                    valor: 210 },
];

export const STATUS_DT = ['Pago', 'Pendente', 'Cancelado'];

/** Rótulos em português para as stories — o componente nasce com os mesmos. */
export const LABELS_DT: Partial<DataTableLabels> = {
  columns: 'Colunas',
  showColumns: 'Exibir colunas',
  selectAll: 'Selecionar todas as faturas',
  selectRow: 'Selecionar fatura {row}',
  sortBy: 'Ordenar por {col}',
  filter: 'Filtrar {col}',
  edit: 'Editar {col}',
  rowsSelected: '{s} de {n} linha(s) selecionada(s).',
};

// O valor é NÚMERO na fixture e vira texto só na exibição. Guardar "R$ 250,00"
// faria a ordenação comparar strings, e "R$ 50,00" cairia depois de
// "R$ 450,00" — o defeito clássico de tabela de dinheiro.
function formatarBRL(valor: unknown): string {
  return typeof valor === 'number'
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';
}

/** Colunas básicas: fatura, cliente, status, método e valor. */
export const COLUMNS_INVOICES: DataTableColumn<InvoiceDT>[] = [
  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id,      sortable: true, hideable: false },
  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true },
  { id: 'status',  header: 'Status',  accessor: (f) => f.status },
  { id: 'metodo',  header: 'Método',  accessor: (f) => f.metodo },
  {
    id: 'valor',
    header: 'Valor',
    accessor: (f) => f.valor,
    format: formatarBRL,
    sortable: true,
    // Só a CÉLULA alinha à direita. `.nds-table th` declara `text-align: left`
    // com especificidade (0,1,1), acima de `.nds-text-right` (0,1,0) — o
    // cabeçalho de coluna numérica fica à esquerda nas cinco stacks.
    numeric: true,
  },
];

/** As mesmas colunas, com filtro por coluna: texto em cliente, select em status. */
export const COLUMNS_WITH_FILTER: DataTableColumn<InvoiceDT>[] = COLUMNS_INVOICES.map((coluna) => {
  if (coluna.id === 'cliente') {
    return { ...coluna, filter: { type: 'text' as const, placeholder: 'Filtrar cliente' } };
  }
  if (coluna.id === 'status') {
    return { ...coluna, filter: { type: 'select' as const, options: STATUS_DT } };
  }
  return coluna;
});

/** Cliente e valor editáveis inline — o resto é leitura. */
export const COLUMNS_EDITAVEIS: DataTableColumn<InvoiceDT>[] = COLUMNS_INVOICES.map((coluna) =>
  coluna.id === 'cliente' || coluna.id === 'valor' ? { ...coluna, editable: true } : coluna,
);

/**
 * Andaime das stories que precisam de estado próprio.
 *
 * O DataTable não guarda os dados: `cellEdit` avisa e quem consome atualiza o
 * array. Uma story escrita só com `template` + `props` não tem onde guardar
 * esse array, então o dono do estado é este componente — que é também o
 * exemplo honesto do que quem usa vai escrever.
 */
@Component({
  selector: 'nds-data-table-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsDataTable],
  template: `
    <div
      ndsDataTable
      caption="Faturas recentes"
      [columns]="colunas"
      [data]="faturas()"
      [labels]="rotulos"
      [rowKey]="chaveDaFatura"
      [rowLabel]="rotuloDaFatura"
      [enableRowSelection]="enableRowSelection()"
      [enablePagination]="enablePagination()"
      [enableGlobalFilter]="enableGlobalFilter()"
      [pageSize]="pageSize()"
      (cellEdit)="aplicarEdicao($event)"
      (selectionChange)="selecionadas.set($event)"
    ></div>

    @if (mostrarLote()) {
      <p class="nds-text-muted-foreground">{{ resumoDoLote() }}</p>
    }
  `,
})
export class NdsDataTableDemo {
  readonly colunas = COLUMNS_EDITAVEIS;
  readonly rotulos = LABELS_DT;
  readonly chaveDaFatura = (fatura: InvoiceDT) => fatura.id;
  readonly rotuloDaFatura = (fatura: InvoiceDT) => fatura.id;

  readonly enableRowSelection = input(false, { transform: booleanAttribute });
  readonly enablePagination = input(true, { transform: booleanAttribute });
  readonly enableGlobalFilter = input(true, { transform: booleanAttribute });
  /** Mostra a barra de ação em lote — o que se faz COM as linhas marcadas. */
  readonly mostrarLote = input(false, { transform: booleanAttribute });
  readonly pageSize = input(5, { transform: numberAttribute });

  readonly faturas = signal<InvoiceDT[]>(INVOICES_DT.map((f) => ({ ...f })));
  readonly selecionadas = signal<readonly InvoiceDT[]>([]);

  readonly resumoDoLote = computed(() =>
    this.selecionadas().length === 0
      ? 'Nenhuma fatura selecionada.'
      : `Marcar como paga: ${this.selecionadas().map((f) => f.id).join(', ')}`,
  );

  aplicarEdicao(edicao: DataTableCellEdit): void {
    this.faturas.update((atual) =>
      atual.map((fatura, indice) =>
        indice === edicao.rowIndex
          ? { ...fatura, [edicao.columnId]: edicao.value }
          : fatura,
      ),
    );
  }
}
