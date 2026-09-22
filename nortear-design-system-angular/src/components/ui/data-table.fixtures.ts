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
import type { BadgeVariant } from './badge';
import {
  NdsDataTable,
  type DataTableCellEdit,
  type DataTableColumn,
  type DataTableLabels,
} from './data-table';

// Fixture compartilhada pelas stories do DataTable.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export const INVOICES_DT` dentro de um `*.stories.ts` viraria uma story
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
  value: number;
}

export const INVOICES_DT: InvoiceDT[] = [
  { id: '#INV-001', cliente: 'Ana Prado',      status: 'Pago',      metodo: 'Cartão de crédito', value: 250 },
  { id: '#INV-002', cliente: 'Bruno Lima',     status: 'Pendente',  metodo: 'Transferência',     value: 150 },
  { id: '#INV-003', cliente: 'Carla Souza',    status: 'Cancelado', metodo: 'Pix',               value: 350 },
  { id: '#INV-004', cliente: 'Diego Martins',  status: 'Pago',      metodo: 'Cartão de crédito', value: 450 },
  { id: '#INV-005', cliente: 'Elisa Rocha',    status: 'Pendente',  metodo: 'Pix',               value: 50  },
  { id: '#INV-006', cliente: 'Fábio Nunes',    status: 'Pago',      metodo: 'Pix',               value: 90  },
  { id: '#INV-007', cliente: 'Gabriela Alves', status: 'Pendente',  metodo: 'Cartão de crédito', value: 720 },
  { id: '#INV-008', cliente: 'Henrique Dias',  status: 'Cancelado', metodo: 'Transferência',     value: 180 },
  { id: '#INV-009', cliente: 'Isabel Freitas', status: 'Pago',      metodo: 'Pix',               value: 310 },
  { id: '#INV-010', cliente: 'João Teixeira',  status: 'Pendente',  metodo: 'Pix',               value: 40  },
  { id: '#INV-011', cliente: 'Karina Melo',    status: 'Pago',      metodo: 'Cartão de crédito', value: 990 },
  { id: '#INV-012', cliente: 'Lucas Barreto',  status: 'Cancelado', metodo: 'Pix',               value: 210 },
];

export const STATUS_DT = ['Pago', 'Pendente', 'Cancelado'];

/** Chave estável do status — é ela, e nunca o texto, que decide a variante. */
export type StatusKeyDT = 'paid' | 'pending' | 'canceled';

/**
 * O que a fixture guarda → a chave estável.
 *
 * A fixture guarda o rótulo em pt-BR porque é ele que a tela mostra nas cinco
 * stacks (a regressão visual compara a mesma tabela em cinco portas). Mapear a
 * variante direto do rótulo é que seria o defeito: bastaria a docs page traduzir
 * o status para o selo perder a cor.
 */
export const STATUS_KEY_DT: Record<string, StatusKeyDT> = {
  Pago: 'paid',
  Pendente: 'pending',
  Cancelado: 'canceled',
};

/** Chave estável → variante do selo. Pendência tem variante própria desde que a
 * `secondary` saiu do Badge. */
export const STATUS_VARIANT_DT: Record<StatusKeyDT, BadgeVariant> = {
  paid: 'default',
  pending: 'warning',
  canceled: 'destructive',
};

/** A variante do selo para um valor bruto da coluna de status. */
export function statusBadgeDT(value: unknown): BadgeVariant | null {
  return STATUS_VARIANT_DT[STATUS_KEY_DT[String(value)]!] ?? null;
}

/** Chave estável do método de pagamento — o domínio que o conteúdo compartilhado nomeia. */
export type MethodKeyDT = 'pix' | 'bankSlip' | 'creditCard' | 'debitCard' | 'transfer';

/**
 * O que a fixture guarda → a chave estável do método.
 *
 * Mesma mecânica do status, e pelo mesmo motivo: a coluna de método saía em
 * português no meio da tabela lida em `en` e em `es`, porque o texto estava
 * cravado no dado. A fixture continua guardando o rótulo em pt-BR — é ele que a
 * story mostra, e a regressão visual compara a mesma tabela em cinco portas —,
 * e quem traduz é a docs page, que resolve a chave.
 *
 * `bankSlip` e `debitCard` não ocorrem nestas doze faturas; estão aqui porque o
 * mapa é o do DOMÍNIO, e é ele que a docs page consulta.
 */
export const METHOD_KEY_DT: Record<string, MethodKeyDT> = {
  Pix: 'pix',
  'Boleto bancário': 'bankSlip',
  'Cartão de crédito': 'creditCard',
  'Cartão de débito': 'debitCard',
  Transferência: 'transfer',
};

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
function formatarBRL(value: unknown): string {
  return typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';
}

/** Colunas básicas: fatura, cliente, status, método e valor. */
export const COLUMNS_INVOICES: DataTableColumn<InvoiceDT>[] = [
  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id,      sortable: true, hideable: false },
  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true },
  // O status é um estado, e estado se lê no selo: cor mais texto. A variante sai
  // da CHAVE estável, nunca do rótulo — ver `statusBadgeDT`.
  { id: 'status',  header: 'Status',  accessor: (f) => f.status, badge: statusBadgeDT },
  { id: 'metodo',  header: 'Método',  accessor: (f) => f.metodo },
  {
    id: 'valor',
    header: 'Valor',
    accessor: (f) => f.value,
    format: formatarBRL,
    sortable: true,
    // Célula E cabeçalho à direita (guideline 20). A premissa antiga escrita
    // aqui — `.nds-table th` em (0,1,1) tornando `.nds-text-right` inerte —
    // venceu: a regra compartilhada hoje é `:where(.nds-table) th`, (0,0,1).
    // O docblock de `numeric` em `data-table.ts` tem a medição inteira.
    numeric: true,
  },
];

/** As mesmas colunas, com filtro por coluna: texto em cliente, select em status. */
export const COLUMNS_WITH_FILTER: DataTableColumn<InvoiceDT>[] = COLUMNS_INVOICES.map((column) => {
  if (column.id === 'cliente') {
    return { ...column, filter: { type: 'text' as const, placeholder: 'Filtrar cliente' } };
  }
  if (column.id === 'status') {
    return { ...column, filter: { type: 'select' as const, options: STATUS_DT } };
  }
  return column;
});

/** Cliente e valor editáveis inline — o resto é leitura. */
export const COLUMNS_EDITAVEIS: DataTableColumn<InvoiceDT>[] = COLUMNS_INVOICES.map((column) =>
  column.id === 'cliente' || column.id === 'valor' ? { ...column, editable: true } : column,
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
      [rowKey]="invoiceKey"
      [rowLabel]="invoiceLabel"
      [enableRowSelection]="enableRowSelection()"
      [enablePagination]="enablePagination()"
      [enableGlobalFilter]="enableGlobalFilter()"
      [pageSize]="pageSize()"
      (cellEdit)="aplicarEdicao($event)"
      (selectionChange)="selecionadas.set($event)"
    ></div>

    @if (showBatch()) {
      <p class="nds-text-muted-foreground">{{ resumoDoLote() }}</p>
    }
  `,
})
export class NdsDataTableDemo {
  readonly colunas = COLUMNS_EDITAVEIS;
  readonly rotulos = LABELS_DT;
  readonly invoiceKey = (invoice: InvoiceDT) => invoice.id;
  readonly invoiceLabel = (invoice: InvoiceDT) => invoice.id;

  readonly enableRowSelection = input(false, { transform: booleanAttribute });
  readonly enablePagination = input(true, { transform: booleanAttribute });
  readonly enableGlobalFilter = input(true, { transform: booleanAttribute });
  /** Mostra a barra de ação em lote — o que se faz COM as linhas marcadas. */
  readonly showBatch = input(false, { transform: booleanAttribute });
  readonly pageSize = input(5, { transform: numberAttribute });

  readonly faturas = signal<InvoiceDT[]>(INVOICES_DT.map((f) => ({ ...f })));
  readonly selecionadas = signal<readonly InvoiceDT[]>([]);

  readonly resumoDoLote = computed(() =>
    this.selecionadas().length === 0
      ? 'Nenhuma fatura selecionada.'
      : `Marcar como paga: ${this.selecionadas().map((f) => f.id).join(', ')}`,
  );

  aplicarEdicao(edicao: DataTableCellEdit): void {
    this.faturas.update((current) =>
      current.map((invoice, index) =>
        index === edicao.rowIndex
          ? { ...invoice, [edicao.columnId]: edicao.value }
          : invoice,
      ),
    );
  }
}
