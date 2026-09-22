/**
 * Transforms do painel Code da DataTable.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * SÃO QUATRO ARQUIVOS DE STORY mostrando o mesmo componente, e até 2026-09-22
 * só o Playground tinha construtor: as outras OITO imprimiam o template CRU no
 * painel Code — `[columns]="colunas"` contra o objeto de `props` que o renderer
 * do Angular monta, a fixture importada do arquivo de story, e o
 * `<nds-data-table-demo>` da edição inline, que é andaime e não existe no
 * design system. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `COLUMNS_INVOICES`, `INVOICES_DT`, `LABELS_DT` e os demais nomes de
 *    `data-table.fixtures.ts` — o snippet DECLARA colunas, dados e rótulos;
 *  · `<nds-data-table-demo>`, o componente que segura o estado das stories de
 *    edição. O exemplo mostra a classe de verdade, com o sinal e o método que
 *    aplicam a edição;
 *  · `[enableGlobalFilter]="false"` escrito só para a captura do Chromatic não
 *    variar. Ele aparece onde desligar a busca É o assunto.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · as colunas nascem UMA vez, em escopo estável. Recriar o array a cada
 *    render zeraria ordenação, filtro e seleção;
 *  · a linha tem chave própria (`rowKey`). Sem chave estável a marcação segue a
 *    POSIÇÃO, não a fatura — ordenar levaria o visto para quem ocupou o lugar;
 *  · `accessor` devolve o valor BRUTO e `format` só o texto. É isso que faz
 *    "R$ 50,00" ordenar antes de "R$ 450,00";
 *  · a variante do selo de status pende da CHAVE estável do domínio, nunca do
 *    rótulo: texto traduzido mudaria de idioma e levaria a cor junto;
 *  · o componente NÃO guarda os dados. `cellEdit` avisa (rowIndex, columnId,
 *    value) e quem consome atualiza o array.
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

const CAPTION = 'Faturas recentes';

/** Qual recorte de colunas o exemplo declara. */
type ColumnSet = 'base' | 'filters' | 'editable';

type SnippetOptions = {
  caption?: string;
  columns?: ColumnSet;
  /** Conjunto vazio: o exemplo do estado sem resultado. */
  empty?: boolean;
  enableRowSelection?: boolean;
  enableGlobalFilter?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  emptyMessage?: string;
  /** Publica `rowLabel` — o identificador da linha vem de OUTRA coluna. */
  rowLabel?: boolean;
  /** Publica `labels`, o vocabulário do domínio. */
  labels?: boolean;
  /** Publica `(cellEdit)` e o dono do estado que ele exige. */
  edit?: boolean;
  /** Comentário que abre a marcação, quando a story tem uma lição própria. */
  note?: string;
};

const TYPE = `interface Fatura {
  id: string;
  cliente: string;
  status: string;
  metodo: string;
  valor: number;
}`;

/**
 * O mapa do selo, em dois degraus de propósito.
 *
 * O dado guarda o rótulo do domínio; a CHAVE é o que decide a cor. Pendurar a
 * variante direto no rótulo faria o selo perder a cor no dia em que a página
 * fosse lida em outro idioma — e ninguém veria por quê.
 */
const STATUS = `const VARIANTE_DO_STATUS = {
  paid: 'default',
  pending: 'warning',
  canceled: 'destructive',
} as const;

// A CHAVE decide a cor, nunca o rótulo: texto traduzido mudaria de idioma e
// levaria a variante junto.
const CHAVE_DO_STATUS: Record<string, keyof typeof VARIANTE_DO_STATUS> = {
  Pago: 'paid',
  Pendente: 'pending',
  Cancelado: 'canceled',
};`;

const FORMAT = `const brl = (valor: unknown) =>
  typeof valor === 'number'
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';`;

/** A linha da coluna de status — igual nos três recortes. */
const STATUS_COLUMN =
  `  { id: 'status',  header: 'Status',  accessor: (f) => f.status,\n` +
  `    badge: (valor) => VARIANTE_DO_STATUS[CHAVE_DO_STATUS[String(valor)]] ?? null },`;

/** A coluna de dinheiro — `numeric` alinha a célula E o cabeçalho à direita. */
const AMOUNT_COLUMN = (extra = '') =>
  `  // accessor devolve o NÚMERO e format só o texto: sem isso "R$ 50,00" cairia\n` +
  `  // depois de "R$ 450,00" na ordenação. numeric alinha célula e cabeçalho.\n` +
  `  { id: 'valor',   header: 'Valor',   accessor: (f) => f.valor, format: brl,\n` +
  `    sortable: true, numeric: true${extra} },`;

function columns(set: ColumnSet): string {
  const first =
    `  { id: 'id',      header: 'Fatura',  accessor: (f) => f.id, sortable: true, hideable: false },`;
  const customer =
    set === 'filters'
      ? `  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true,\n` +
        `    filter: { type: 'text', placeholder: 'Filtrar cliente' } },`
      : set === 'editable'
        ? `  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true, editable: true },`
        : `  { id: 'cliente', header: 'Cliente', accessor: (f) => f.cliente, sortable: true },`;
  const status =
    set === 'filters'
      ? `  { id: 'status',  header: 'Status',  accessor: (f) => f.status,\n` +
        `    badge: (valor) => VARIANTE_DO_STATUS[CHAVE_DO_STATUS[String(valor)]] ?? null,\n` +
        `    filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },`
      : STATUS_COLUMN;
  const method = `  { id: 'metodo',  header: 'Método',  accessor: (f) => f.metodo },`;
  const amount = AMOUNT_COLUMN(set === 'editable' ? ', editable: true' : '');

  return [
    '// Definidas UMA vez, em escopo estável: recriar o array a cada render',
    '// zeraria ordenação, filtro e seleção.',
    'const COLUNAS: DataTableColumn<Fatura>[] = [',
    first,
    customer,
    status,
    method,
    amount,
    '];',
  ].join('\n');
}

/** Os rótulos do domínio: templates com marcador, não funções. */
const LABELS = `  // Rótulos são templates com marcador: {row} recebe o identificador da linha
  // e {col} o da coluna. Só as chaves informadas mudam.
  readonly rotulos = {
    selectAll: 'Selecionar todas as faturas',
    selectRow: 'Selecionar fatura {row}',
  };`;

/**
 * Monta o snippet inteiro: imports, tipo, mapa do selo, formato, colunas,
 * marcação e a classe que a hospeda.
 *
 * Tudo que o template liga é membro DECLARADO da classe do exemplo: expressão
 * de template do Angular só enxerga membro, e constante importada no topo do
 * arquivo é invisível ali.
 */
function dataTableSnippet(o: SnippetOptions = {}): string {
  const set = o.columns ?? 'base';
  const caption = o.caption ?? CAPTION;

  const attrs = [
    `      caption="${caption}"`,
    '      [columns]="colunas"',
    '      [data]="faturas()"',
    '      [rowKey]="invoiceKey"',
    o.rowLabel ? '      [rowLabel]="invoiceLabel"' : null,
    o.labels ? '      [labels]="rotulos"' : null,
    o.enableRowSelection ? '      [enableRowSelection]="true"' : null,
    o.enableGlobalFilter === false ? '      [enableGlobalFilter]="false"' : null,
    o.enableColumnVisibility === false ? '      [enableColumnVisibility]="false"' : null,
    o.enableColumnFilters ? '      [enableColumnFilters]="true"' : null,
    o.enablePagination === false ? '      [enablePagination]="false"' : null,
    typeof o.pageSize === 'number' && o.pageSize !== 10
      ? `      [pageSize]="${o.pageSize}"`
      : null,
    o.pageSizeOptions ? `      [pageSizeOptions]="[${o.pageSizeOptions.join(', ')}]"` : null,
    o.emptyMessage ? `      emptyMessage="${o.emptyMessage}"` : null,
    o.edit ? '      (cellEdit)="aplicarEdicao($event)"' : null,
  ].filter((line): line is string => line !== null);

  const markup = [
    o.note ? `    <!-- ${o.note} -->` : null,
    '    <div',
    '      ndsDataTable',
    ...attrs,
    '    ></div>',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  const imports = [
    `import { Component, signal } from '@angular/core';`,
    o.edit
      ? `import {\n  NdsDataTable,\n  type DataTableCellEdit,\n  type DataTableColumn,\n} from '@/components/ui/data-table';`
      : `import { NdsDataTable, type DataTableColumn } from '@/components/ui/data-table';`,
  ].join('\n');

  const dados = o.empty
    ? [
        '  // O recorte chega VAZIO, e a grade continua de pé: quem esvaziou o',
        '  // resultado com um filtro precisa do campo para desfazer.',
        '  readonly faturas = signal<Fatura[]>([]);',
      ].join('\n')
    : '  readonly faturas = signal(carregarFaturas());';

  const members = [
    '  readonly colunas = COLUNAS;',
    dados,
    '  // A marcação pertence à fatura, não à posição: sem chave estável,',
    '  // ordenar moveria de linha o que estava marcado.',
    '  readonly invoiceKey = (f: Fatura) => f.id;',
    o.rowLabel
      ? '  // O identificador da linha vem de OUTRA coluna, e rowLabel vence a\n' +
        '  // primeira: sem ele o nome do checkbox sairia de "Fatura".\n' +
        '  readonly invoiceLabel = (f: Fatura) => f.cliente;'
      : null,
    o.labels ? LABELS : null,
    o.edit
      ? [
          '',
          '  // O componente NÃO guarda os dados: ele avisa a edição e quem consome',
          '  // atualiza o array. Sem dono do estado a célula volta ao valor antigo.',
          '  aplicarEdicao(edicao: DataTableCellEdit): void {',
          '    this.faturas.update((atuais) =>',
          '      atuais.map((fatura, i) =>',
          '        i === edicao.rowIndex ? { ...fatura, [edicao.columnId]: edicao.value } : fatura,',
          '      ),',
          '    );',
          '  }',
        ].join('\n')
      : null,
  ].filter((line): line is string => line !== null);

  return [
    imports,
    TYPE,
    STATUS,
    FORMAT,
    columns(set),
    [
      '@Component({',
      '  imports: [NdsDataTable],',
      '  template: `',
      markup,
      '  `,',
      '})',
      'export class Exemplo {',
      ...members,
      '}',
    ].join('\n'),
  ].join('\n\n');
}

/**
 * Transform do Playground — lê os controls e escreve só o que difere do padrão
 * do componente.
 *
 * Repetir o valor default ensina ruído a quem copia.
 */
export function dataTablePlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DataTableArgs> } = {},
): string {
  const {
    caption = CAPTION,
    enableRowSelection = true,
    enableGlobalFilter = true,
    enablePagination = true,
    pageSize = 5,
  } = ctx.args ?? {};

  return dataTableSnippet({
    caption: typeof caption === 'string' ? caption : CAPTION,
    enableRowSelection,
    enableGlobalFilter,
    enablePagination,
    pageSize: typeof pageSize === 'number' ? pageSize : 5,
    labels: enableRowSelection,
  });
}

/**
 * Filtros por coluna: o recorte é declarado na COLUNA, em `filter`.
 *
 * `text` e `select` são os dois tipos, e o `select` precisa da lista de opções.
 * Os filtros SOMAM entre si e ao filtro global — nenhum substitui o outro.
 */
export function dataTableColumnFiltersSource(): string {
  return dataTableSnippet({
    columns: 'filters',
    labels: true,
    enableColumnFilters: true,
    enablePagination: false,
  });
}

/**
 * Menu de visibilidade: esconder uma coluna é decisão de LEITURA.
 *
 * A busca livre continua casando na coluna escondida — se deixasse de olhar,
 * esconder mudaria o resultado da busca e ninguém veria por quê. `hideable:
 * false` protege a coluna que identifica a linha.
 */
export function dataTableColumnVisibilitySource(): string {
  return dataTableSnippet({
    columns: 'filters',
    labels: true,
    pageSize: 5,
    note: 'O menu de colunas é ligado por padrão. A coluna com hideable: false não entra nele.',
  });
}

/**
 * Edição inline: o DataTable não guarda os dados.
 *
 * `editable` na coluna abre o campo na célula e `(cellEdit)` avisa com
 * (rowIndex, columnId, value). Por isso o exemplo tem dono de estado: sem ele a
 * célula volta ao valor antigo assim que perde o foco.
 */
export function dataTableInlineEditingSource(): string {
  return dataTableSnippet({
    columns: 'editable',
    labels: true,
    edit: true,
    enableGlobalFilter: false,
    enablePagination: false,
  });
}

/**
 * Paginação: `pageSize` vale só no primeiro render.
 *
 * Depois quem manda é o seletor do rodapé, e o tamanho inicial PRECISA estar
 * entre as opções: fora da lista o seletor não tem opção marcada e passa a
 * exibir a primeira, dizendo "10" numa tabela que mostra cinco.
 */
export function dataTablePaginatedSource(): string {
  return dataTableSnippet({
    labels: true,
    enableGlobalFilter: false,
    pageSize: 5,
    pageSizeOptions: [5, 10],
  });
}

/**
 * Rótulo de linha explícito: `rowLabel` diz qual campo identifica a linha.
 *
 * É o primeiro degrau do fallback e vence a primeira coluna. Sem ele o nome do
 * controle de seleção sai da primeira coluna de dados — o mesmo texto que quem
 * enxerga usaria para apontar a linha.
 */
export function dataTableExplicitRowLabelSource(): string {
  return dataTableSnippet({
    labels: true,
    rowLabel: true,
    enableRowSelection: true,
    enableGlobalFilter: false,
    enablePagination: false,
  });
}

/**
 * Sem resultados: o vazio é o assunto.
 *
 * A grade NÃO se desmonta — cabeçalho e busca continuam na tela, porque quem
 * esvaziou o recorte com um filtro precisa do campo para desfazer, e quem usa
 * leitor de tela precisa saber que colunas voltarão.
 */
export function dataTableNoResultsSource(): string {
  return dataTableSnippet({
    empty: true,
    labels: true,
    enableRowSelection: true,
    emptyMessage: 'Nenhuma fatura encontrada.',
  });
}

/**
 * Ordenação: quem ordena é a coluna que declara `sortable`.
 *
 * O ciclo tem três estados — ascendente, descendente e nenhum —, e o terceiro é
 * o que devolve a ordem original a quem ordenou por engano. O `aria-sort` mora
 * no `th`, que é quem tem a relação com a coluna.
 */
export function dataTableSortedSource(): string {
  return dataTableSnippet({
    labels: true,
    enableGlobalFilter: false,
    enablePagination: false,
    note: 'Ordenar usa o valor de accessor, não o texto de format: a coluna de dinheiro ordena como número.',
  });
}

/**
 * Seleção de linhas: a contagem sai por região viva.
 *
 * A linha marcada recebe `data-state="selected"` e fundo destacado — e cor
 * sozinha é muda para quem não enxerga, por isso o componente anuncia o número.
 * `labels.rowsSelected` é o texto desse anúncio.
 */
export function dataTableSelectedRowsSource(): string {
  return dataTableSnippet({
    labels: true,
    enableRowSelection: true,
    pageSize: 5,
  });
}
