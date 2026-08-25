/**
 * Transforms do painel Code do DataTable.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O que o painel mostrava antes era `<wrapper …/>`, o nome interno da função
 * compilada — uma tag que ninguém pode importar.
 */
import { svelteSnippet } from '@/lib/story-source';

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

const IMPORT = `import { DataTable, type DataTableColumn } from '@/components/ui/data-table';`;

const IMPORT_WITH_LABELS = `import {
  DataTable,
  type DataTableColumn,
  type DataTableLabels,
} from '@/components/ui/data-table';`;

/** Tipo da linha e o recorte de dados — vêm do produto, não do componente. */
const DATA = `interface Invoice {
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
];`;

/** Formatação de valor e cor do status: o que a coluna mostra além do dado cru. */
const APRESENTACAO = `const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const varianteDoStatus = {
  Pago: 'default',
  Pendente: 'warning',
  Cancelado: 'destructive',
} as const;`;

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
];`;

/** Junta as partes do `<script>` com uma linha em branco entre elas. */
function script(...partes: Array<string | false | null | undefined>): string {
  return partes.filter((parte): parte is string => Boolean(parte)).join('\n\n');
}

/** Monta a tag do componente com uma prop por linha, descartando as vazias. */
function tag(props: Array<string | false | null | undefined>): string {
  const list = props.filter((prop): prop is string => Boolean(prop));
  return `<DataTable\n${list.map((prop) => `  ${prop}`).join('\n')}\n/>`;
}

/** Forma canônica: seleção de linhas, busca livre, paginação e legenda. */
export function dataTableSource(
  _gerado?: string,
  ctx?: { args?: Partial<DataTableArgs> },
): string {
  const {
    enableRowSelection = false,
    enableGlobalFilter = true,
    enableColumnVisibility = true,
    enablePagination = true,
    pageSize = 10,
    caption = 'Faturas recentes',
    globalFilterPlaceholder = 'Buscar fatura, cliente, método...',
  } = ctx?.args ?? {};

  return svelteSnippet(
    script(
      enableRowSelection ? IMPORT_WITH_LABELS : IMPORT,
      DATA,
      APRESENTACAO,
      COLUMNS,
      enableRowSelection
        ? `// Só as chaves informadas mudam; o resto continua no padrão do componente.
const rotulos: Partial<DataTableLabels> = {
  selectAll: 'Selecionar todas as faturas',
  selectRow: (r) => \`Selecionar fatura \${r}\`,
  rowsSelected: (s, n) => \`\${s} de \${n} fatura(s) selecionada(s).\`,
};

// A identidade da linha é o número da fatura, e não a posição na tela.
const chaveDaFatura = (f: Invoice) => f.id;`
        : '',
    ),
    `${tag([
      '{columns}',
      'data={invoices}',
      enableRowSelection ? 'enableRowSelection' : '',
      enableGlobalFilter ? '' : 'enableGlobalFilter={false}',
      enableColumnVisibility ? '' : 'enableColumnVisibility={false}',
      enablePagination ? '' : 'enablePagination={false}',
      pageSize === 10 ? '' : `pageSize={${pageSize}}`,
      `caption="${caption}"`,
      enableRowSelection ? 'labels={rotulos}' : '',
      enableRowSelection ? 'rowKey={chaveDaFatura}' : '',
      enableGlobalFilter ? `globalFilterPlaceholder="${globalFilterPlaceholder}"` : '',
    ])}${
      enableRowSelection
        ? `

<!-- Sem \`rowLabel\`: o identificador do controle de seleção sai da primeira
     coluna, que é a mesma que identifica a linha para quem enxerga. -->`
        : ''
    }`,
  );
}

/** Estado sem resultados: a estrutura fica de pé e a mensagem ocupa a linha inteira. */
export function dataTableNoResultsSource(): string {
  return svelteSnippet(
    script(
      IMPORT,
      `interface Invoice {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
}

// O recorte não devolveu nada — a grade continua montada.
const invoices: Invoice[] = [];`,
      APRESENTACAO,
      COLUMNS,
    ),
    tag([
      '{columns}',
      'data={invoices}',
      'enableRowSelection',
      'emptyMessage="Nenhuma fatura encontrada."',
    ]),
  );
}

/** Filtro por coluna: campo de texto e lista de valores, declarados na coluna. */
export function columnDataTableFiltersSource(): string {
  return svelteSnippet(
    script(
      IMPORT,
      DATA,
      APRESENTACAO,
      `// O filtro de cada coluna é declarado na própria coluna: o tipo escolhe o
// controle, e as opções da lista vêm de quem conhece o domínio.
const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },
      badgeVariant: (v) => varianteDoStatus[v as Invoice['status']],
    },
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
  // Sem filtro: a célula da linha de filtros anuncia de qual coluna ela é.
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      format: (v) => moeda.format(Number(v)),
      cellClass: 'nds-font-medium nds-tabular-nums',
    },
  },
];`,
    ),
    tag([
      '{columns}',
      'data={invoices}',
      'enableColumnFilters',
      'enablePagination={false}',
    ]),
  );
}

/** Colunas redimensionáveis: a alça se anuncia como separador com o nome da coluna. */
export function dataTableColumnsRedimensionaveisSource(): string {
  return svelteSnippet(
    script(IMPORT, DATA, APRESENTACAO, COLUMNS),
    tag(['{columns}', 'data={invoices}', 'enableColumnResizing']),
  );
}

/** Reordenar e fixar colunas: a ordem é arrastável e a fixação gruda na borda. */
export function dataTableReordenarEFixarSource(): string {
  return svelteSnippet(
    script(IMPORT, DATA, APRESENTACAO, COLUMNS),
    tag([
      '{columns}',
      'data={invoices}',
      'enableColumnOrdering',
      'enableColumnPinning',
    ]),
  );
}

/**
 * Edição inline: o componente avisa a mudança, quem consome guarda o dado.
 *
 * O array de linhas é do consumidor de propósito — a tabela não é dona do
 * estado, e é por isso que `onCellEdit` existe.
 */
export function dataTableEditInlineSource(): string {
  return svelteSnippet(
    script(
      IMPORT,
      DATA,
      APRESENTACAO,
      `const columns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { badgeVariant: (v) => varianteDoStatus[v as Invoice['status']] },
  },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      editable: true,
      format: (v) => moeda.format(Number(v)),
      cellClass: 'nds-font-medium nds-tabular-nums',
    },
  },
];

// A tabela não guarda os dados: ela avisa, e quem consome atualiza o array.
let data = $state<Invoice[]>(invoices.map((f) => ({ ...f })));`,
    ),
    tag([
      '{columns}',
      '{data}',
      'enableGlobalFilter={false}',
      'enableColumnVisibility={false}',
      'enablePagination={false}',
      `onCellEdit={(rowIndex, columnId, value) => {
    data = data.map((row, i) => (i === rowIndex ? { ...row, [columnId]: value } : row));
  }}`,
    ]),
  );
}

/** Paginação: fatia de cinco linhas, com o tamanho inicial presente nas opções. */
export function dataTablePaginadaSource(): string {
  return svelteSnippet(
    script(IMPORT, DATA, APRESENTACAO, COLUMNS),
    `${tag([
      '{columns}',
      'data={invoices}',
      'enableGlobalFilter={false}',
      'pageSize={5}',
      'pageSizeOptions={[5, 10]}',
    ])}

<!-- O tamanho inicial precisa existir entre as opções do seletor: fora da
     lista, nenhuma opção fica marcada e o rodapé passa a exibir a primeira. -->`,
  );
}

/** Rótulo de linha explícito: quem monta a tabela diz qual campo identifica a linha. */
export function lineDataTableLabelSource(): string {
  return svelteSnippet(
    script(
      IMPORT,
      DATA,
      APRESENTACAO,
      COLUMNS,
      `// Sem \`rowLabel\` o identificador sairia da primeira coluna ("INV-001").
// Aqui a escolha é explícita, e vence a primeira coluna.
const chaveDaFatura = (f: Invoice) => f.id;
const rotuloDaFatura = (f: Invoice) => f.customer;`,
    ),
    tag([
      '{columns}',
      'data={invoices}',
      'enableRowSelection',
      'enableGlobalFilter={false}',
      'enablePagination={false}',
      'rowKey={chaveDaFatura}',
      'rowLabel={rotuloDaFatura}',
    ]),
  );
}

/** Virtualização: mil linhas no conjunto, só as visíveis no DOM. */
export function dataTableVirtualizadaSource(): string {
  return svelteSnippet(
    script(
      IMPORT,
      `interface Invoice {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
}

// Mil linhas: é o volume em que montar tudo de uma vez trava a rolagem.
const invoices: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: \`INV-\${String(i + 1).padStart(5, '0')}\`,
  customer: \`Cliente \${i + 1}\`,
  status: 'Pago',
  method: 'Pix',
  amount: (i * 37) % 2000,
}));`,
      APRESENTACAO,
      COLUMNS,
    ),
    `${tag([
      '{columns}',
      'data={invoices}',
      'virtualized',
      'maxHeight="400px"',
      'enableColumnVisibility={false}',
    ])}

<!-- Sem paginação junto: recortar em páginas e virtualizar a janela resolvem
     o mesmo problema, e somados um esconde o outro. -->`,
  );
}
