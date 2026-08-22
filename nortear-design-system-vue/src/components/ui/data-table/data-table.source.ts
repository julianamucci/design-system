/**
 * Transforms do painel Code do DataTable.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O que o painel mostrava antes era `<DataTable />` sozinha; e a transform que
 * já existia no arquivo de story montava um `<script>` que declarava `columns`
 * e os rótulos, mas ligava `:data="invoices"` a uma variável que o snippet
 * NUNCA declarava — copiado, o exemplo não compilava.
 */
import { attr, attrBool, attrNum, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type DataTableArgs = {
  enableRowSelection: boolean;
  enableGlobalFilter: boolean;
  enableColumnVisibility: boolean;
  enablePagination: boolean;
  pageSize: number;
  caption: string;
  globalFilterPlaceholder: string;
  emptyMessage: string;
};

const IMPORT_VUE = `import { h } from 'vue'`;

const IMPORT_TABLE = `import { DataTable, type DataTableColumn } from '@/components/ui/data-table'`;

const IMPORT_TABLE_WITH_LABELS = `import {
  DataTable,
  type DataTableColumn,
  type DataTableLabels,
} from '@/components/ui/data-table'`;

const IMPORT_BADGE = `import { Badge } from '@/components/ui/badge'`;

/** O tipo da linha vem do produto, não do componente. */
const TYPE = `interface Invoice {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
}`;

/**
 * As doze faturas, escritas por extenso.
 *
 * Doze, e não três: a paginação em fatias de cinco e as contagens que a tabela
 * anuncia só fazem sentido contra o conjunto inteiro.
 */
const DATA = `const invoices: Invoice[] = [
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
]`;

/** Formatação de valor e cor do status: o que a coluna mostra além do dado cru. */
const APRESENTACAO = `const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const varianteDoStatus = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
} as const`;

/** A célula de status: o dado cru vira selo com a cor do seu significado. */
const CELL_STATUS = `    cell: ({ row }) =>
      h(Badge, { variant: varianteDoStatus[row.original.status] }, () => row.original.status),`;

/** A célula de valor: moeda formatada, em algarismos de largura fixa. */
const CELL_VALUE = `    cell: ({ row }) =>
      h(
        'span',
        { class: 'nds-font-medium nds-tabular-nums' },
        moeda.format(row.original.amount),
      ),`;

/**
 * As cinco colunas da tabela de faturas.
 *
 * Definidas UMA vez, em escopo estável: recriar o array a cada render zeraria
 * ordenação, filtros e seleção.
 */
const COLUMNS = `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110 },
  { accessorKey: 'customer', header: 'Cliente', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
${CELL_STATUS}
  },
  { accessorKey: 'method', header: 'Método', size: 200 },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
${CELL_VALUE}
  },
]`;

/** Junta as partes do `<script setup>` com uma linha em branco entre elas. */
function script(...partes: Array<string | false | null | undefined>): string {
  return partes.filter((parte): parte is string => Boolean(parte)).join('\n\n');
}

/**
 * Bloco de import: uma linha colada na outra, como o prettier do projeto
 * formata um SFC. Separá-los por linha em branco sugeriria grupos que não
 * existem.
 */
function importing(...partes: string[]): string {
  return partes.join('\n');
}

/**
 * Monta a tag do componente com uma prop por linha, descartando as vazias.
 *
 * Uma por linha porque a tabela raramente leva menos de quatro: em fila única
 * elas somem na barra de rolagem do painel.
 */
function tag(props: Array<string | false | null | undefined>): string {
  const lista = props.filter((prop): prop is string => Boolean(prop));
  if (!lista.length) return '<DataTable />';
  return `<DataTable\n${lista.map((prop) => `  ${prop}`).join('\n')}\n/>`;
}

/**
 * Forma canônica: seleção de linhas, busca livre, paginação e legenda.
 *
 * Todo control do Playground chega aqui, e só o que difere do padrão do
 * componente entra no snippet — `enable-row-selection` nasce desligado, os
 * outros três nascem ligados.
 */
export const dataTableSource: SourceTransform<DataTableArgs> = (_gerado, ctx) => {
  const {
    enableRowSelection = true,
    enableGlobalFilter = true,
    enableColumnVisibility = true,
    enablePagination = true,
    pageSize = 10,
    caption = 'Faturas recentes',
    globalFilterPlaceholder = 'Buscar fatura, cliente, método...',
    emptyMessage = 'Sem resultados.',
  } = ctx?.args ?? {};

  return vueSnippet(
    script(
      importing(
        IMPORT_VUE,
        enableRowSelection ? IMPORT_TABLE_WITH_LABELS : IMPORT_TABLE,
        IMPORT_BADGE,
      ),
      TYPE,
      DATA,
      APRESENTACAO,
      COLUMNS,
      enableRowSelection
        ? `// Só as chaves informadas mudam; o resto continua no padrão do componente.
const rotulos: Partial<DataTableLabels> = {
  selectAll: 'Selecionar todas as faturas',
  selectRow: (r) => \`Selecionar fatura \${r}\`,
}

// A identidade da linha é o número da fatura, e não a posição na tela. Sem ela
// a identidade seria a POSIÇÃO, e ordenar moveria a marcação de linha.
const chaveDaFatura = (f: Invoice) => f.id`
        : '',
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      attrBool('enable-row-selection', enableRowSelection, false),
      attrBool('enable-global-filter', enableGlobalFilter, true),
      attrBool('enable-column-visibility', enableColumnVisibility, true),
      attrBool('enable-pagination', enablePagination, true),
      attrNum('page-size', pageSize, 10),
      attr('caption', caption),
      enableGlobalFilter
        ? attr('global-filter-placeholder', globalFilterPlaceholder, 'Buscar...')
        : '',
      attr('empty-message', emptyMessage, 'Sem resultados.'),
      enableRowSelection ? ':labels="rotulos"' : '',
      enableRowSelection ? ':row-key="chaveDaFatura"' : '',
    ]),
  );
};

/**
 * Estado NoResults: o recorte não devolveu nada e a estrutura fica de pé.
 *
 * A grade inteira sobrevive ao vazio — cabeçalho, busca e a mensagem ocupando a
 * largura toda —, porque quem esvaziou o resultado com um filtro precisa do
 * campo para desfazer.
 */
export function dataTableNoResultsSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      '// O recorte não devolveu nada — a grade continua montada.\nconst invoices: Invoice[] = []',
      APRESENTACAO,
      COLUMNS,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      'enable-row-selection',
      'empty-message="Nenhuma fatura encontrada."',
    ]),
  );
}

/**
 * Configuração Paginated: fatia de cinco linhas, com o tamanho inicial presente
 * entre as opções do seletor.
 *
 * Fora da lista, nenhuma opção fica marcada e o rodapé passa a exibir a
 * primeira — dizendo "10" numa tabela que mostra cinco.
 */
export function dataTablePaginadaSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      COLUMNS,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      ':enable-global-filter="false"',
      ':page-size="5"',
      ':page-size-options="[5, 10]"',
    ]),
  );
}

/**
 * Configuração ExplicitRowLabel: quem monta a tabela diz qual campo identifica
 * a linha.
 *
 * Sem `rowLabel` o identificador sairia da primeira coluna ("INV-001"); aqui a
 * escolha é explícita e vence a primeira coluna.
 */
export function lineDataTableLabelSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      COLUMNS,
      `const chaveDaFatura = (f: Invoice) => f.id
const rotuloDaFatura = (f: Invoice) => f.customer`,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      'enable-row-selection',
      ':enable-global-filter="false"',
      ':enable-pagination="false"',
      ':row-key="chaveDaFatura"',
      ':row-label="rotuloDaFatura"',
    ]),
  );
}

/**
 * Configuração Virtualized1000Rows: mil linhas no conjunto, só as visíveis no
 * DOM.
 *
 * Sem paginação junto: recortar em páginas e virtualizar a janela resolvem o
 * mesmo problema, e somados um esconde o outro. A altura máxima é prop do
 * componente — é ela que dá ao virtualizador a janela contra a qual medir.
 */
export function dataTableVirtualizadaSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      `// Mil linhas: é o volume em que montar tudo de uma vez trava a rolagem.
const invoices: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: \`INV-\${String(i + 1).padStart(5, '0')}\`,
  customer: \`Cliente \${i + 1}\`,
  status: 'Pago',
  method: 'Pix',
  amount: (i * 37) % 2000,
}))`,
      APRESENTACAO,
      COLUMNS,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      'virtualized',
      'max-height="400px"',
      ':enable-column-visibility="false"',
    ]),
  );
}

/**
 * Composição WithColumnFilters: o filtro de cada coluna é declarado na própria
 * coluna.
 *
 * O tipo escolhe o controle e as opções da lista vêm de quem conhece o domínio.
 * A coluna sem filtro continua anunciando de qual coluna a célula vazia é.
 */
export function columnDataTableFiltersSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },
${CELL_STATUS}
  },
  {
    accessorKey: 'method',
    header: 'Método',
    meta: {
      filter: {
        type: 'select',
        options: ['Cartão de crédito', 'Boleto bancário', 'Pix', 'Cartão de débito', 'Transferência'],
      },
    },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
${CELL_VALUE}
  },
]`,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      'enable-column-filters',
      ':enable-pagination="false"',
    ]),
  );
}

/**
 * Composição ResizableColumns: a alça se anuncia como separador com o nome da
 * coluna, e arrastar muda a largura daquela coluna só.
 */
export function dataTableColumnsRedimensionaveisSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      COLUMNS,
    ),
    tag([':columns="columns"', ':data="invoices"', 'enable-column-resizing']),
  );
}

/**
 * Composição ReorderableAndPinnable: a ordem é arrastável e a fixação gruda a
 * coluna na borda durante a rolagem horizontal.
 */
export function dataTableReordenarEFixarSource(): string {
  return vueSnippet(
    script(
      importing(IMPORT_VUE, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      COLUMNS,
    ),
    tag([
      ':columns="columns"',
      ':data="invoices"',
      'enable-column-ordering',
      'enable-column-pinning',
    ]),
  );
}

/**
 * Composição WithInlineEditing: a tabela avisa a mudança, quem consome guarda o
 * dado.
 *
 * O array de linhas é do consumidor de propósito — a tabela não é dona do
 * estado, e é por isso que o evento existe. Cada coluna editável se declara na
 * própria coluna.
 */
export function dataTableEditInlineSource(): string {
  return vueSnippet(
    script(
      importing(`import { h, ref } from 'vue'`, IMPORT_TABLE, IMPORT_BADGE),
      TYPE,
      DATA,
      APRESENTACAO,
      `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
${CELL_STATUS}
  },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: { editable: true },
${CELL_VALUE}
  },
]`,
      `// A tabela não guarda os dados: ela avisa, e quem consome atualiza o array.
const data = ref<Invoice[]>(invoices.slice(0, 6))

function aoEditarCelula(rowIndex: number, columnId: string, value: unknown) {
  data.value = data.value.map((row, i) =>
    i === rowIndex ? { ...row, [columnId]: value } : row,
  )
}`,
    ),
    tag([
      ':columns="columns"',
      ':data="data"',
      ':enable-global-filter="false"',
      ':enable-column-visibility="false"',
      ':enable-pagination="false"',
      '@cell-edit="aoEditarCelula"',
    ]),
  );
}
