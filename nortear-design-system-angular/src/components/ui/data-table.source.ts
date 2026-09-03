/**
 * Transform do painel Code da DataTable.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * este construtor sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que este snippet ensina, e a story não conseguiria mostrar: as colunas
 * nascem UMA vez, em escopo estável, e a linha tem chave própria. Recriar o
 * array a cada render zeraria ordenação, filtro e seleção — e sem chave estável
 * a marcação seguiria a POSIÇÃO, não a fatura.
 */
import type { DataTableLabels } from './data-table';
import type { InvoiceDT } from './data-table.fixtures';
export type DataTableArgs = {
  caption: string;
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enablePagination: boolean;
  pageSize: number;
  labels: Partial<DataTableLabels>;
  rowKey: (row: InvoiceDT, index: number) => string;
  rowLabel: (row: InvoiceDT) => string;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com todos os
 * bindings ligados aos args (`[enableRowSelection]="enableRowSelection"`) e com
 * a fixture do arquivo. É o andaime da story, não o que alguém escreve para
 * montar uma tabela. O `transform` devolve o uso real, com o valor atual dos
 * controls já resolvido. Ver a nota em `separator.stories.ts`.
 */
export function dataTablePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DataTableArgs> } = {},
): string {
  const {
    caption = 'Faturas recentes',
    enableRowSelection = true,
    enableGlobalFilter = true,
    enablePagination = true,
    pageSize = 5,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet: repetir o valor default ensina
  // ruído a quem copia.
  const flags = [
    enableRowSelection ? '[enableRowSelection]="true"' : null,
    enableGlobalFilter ? null : '[enableGlobalFilter]="false"',
    enablePagination ? null : '[enablePagination]="false"',
    pageSize === 10 ? null : `[pageSize]="${pageSize}"`,
  ].filter(Boolean).join('\n      ');

  return `import { NdsDataTable, type DataTableColumn } from '@/components/ui/data-table';

interface Fatura { id: string; cliente: string; status: string; metodo: string; valor: number }

// Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
// ordenacao, filtros e selecao.
const COLUNAS: DataTableColumn<Fatura>[] = [
  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id,      sortable: true, hideable: false },
  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true },
  { id: 'status',  header: 'Status',  accessor: (f) => f.status },
  { id: 'metodo',  header: 'Método',  accessor: (f) => f.metodo },
  // numeric alinha a CÉLULA à direita. O cabeçalho fica à esquerda: no CSS
  // compartilhado \`.nds-table th\` vence a utilitária por especificidade.
  { id: 'valor',   header: 'Valor',   accessor: (f) => f.valor, format: brl, sortable: true, numeric: true },
];

@Component({
  imports: [NdsDataTable],
  template: \`
    <div
      ndsDataTable
      caption="${caption}"
      [columns]="colunas"
      [data]="faturas()"
      [rowKey]="chaveDaFatura"
      [labels]="rotulos"
      ${flags}
    ></div>
  \`,
})
export class Exemplo {
  readonly colunas = COLUNAS;
  readonly faturas = signal(carregarFaturas());
  // A marcação pertence à fatura, não à posição: sem chave estável, ordenar
  // moveria de linha o que estava marcado.
  readonly chaveDaFatura = (f: Fatura) => f.id;
  // Sem rowLabel: o nome do checkbox de cada linha sai da primeira coluna, que
  // é a mesma que identifica a linha para quem enxerga. Passe rowLabel quando
  // o identificador estiver em OUTRA coluna.
  // Rótulos são templates com marcador: {row} recebe o identificador da linha e
  // {col} o da coluna. Só as chaves informadas mudam.
  readonly rotulos = {
    selectAll: 'Selecionar todas as faturas',
    selectRow: 'Selecionar fatura {row}',
  };
}`;
}
