// Snippet do painel Code do DataTable — ver `@/lib/story-source`.

import {
  chamada,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Qual desenho de colunas a story usa. */
export type DataTableColunas = 'base' | 'filtro' | 'editavel';

export type DataTableSnippetOptions = {
  colunas?: DataTableColunas;
  /** Estado sem resultado: a grade continua montada, só os dados somem. */
  semDados?: boolean;
  enableRowSelection?: boolean;
  enableGlobalFilter?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enablePagination?: boolean;
  virtualized?: boolean;
  maxHeight?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  globalFilterPlaceholder?: string;
  emptyMessage?: string;
  caption?: string;
  /** Corpo de `rowLabel`, quando a story escolhe o campo que nomeia a linha. */
  rowLabel?: string;
  /** Corpo de `onCellEdit`, quando a story tem colunas editáveis. */
  onCellEdit?: string;
  /** Bloco de textos da interface. Nos args ele chega como objeto. */
  labels?: unknown;
};

const CAPTION_PADRAO = 'Faturas recentes';
/** Padrões da fábrica — documentação não ensina a repetir o que já vale. */
const BUSCA_PADRAO = 'Buscar...';
const VAZIO_PADRAO = 'Sem resultados.';

/**
 * Dados do snippet, e não a fixture das stories.
 *
 * `data-table.fixtures.ts` existe para as stories medirem ordenação e contagem
 * sobre um conjunto conhecido — é andaime de teste. O painel Code ensina o
 * design system, não o andaime.
 */
const DADOS = [
  'interface Invoice {',
  '  id: string;',
  '  customer: string;',
  '  status: string;',
  '  method: string;',
  '  amount: number;',
  '}',
  '',
  'const invoices: Invoice[] = [',
  "  { id: 'INV-001', customer: 'Ana Souza',  status: 'Pago',     method: 'Pix',    amount: 250 },",
  "  { id: 'INV-002', customer: 'Bruno Lima', status: 'Pendente', method: 'Boleto', amount: 150 },",
  '];',
].join('\n');

const IMPORTACAO = "import { createDataTable, type DataTableColumn } from '@/components/ui/data-table';";

/** Uma linha de coluna, com o `meta` que aquele desenho pede. */
function colunas(tipo: DataTableColunas): string {
  const linhas: Record<DataTableColunas, string[]> = {
    base: [
      "  { accessorKey: 'id', header: 'Fatura', size: 110, meta: { headerLabel: 'Fatura' } },",
      "  { accessorKey: 'customer', header: 'Cliente', size: 200, meta: { headerLabel: 'Cliente' } },",
      "  { accessorKey: 'status', header: 'Status', size: 140, meta: { headerLabel: 'Status' } },",
      "  { accessorKey: 'method', header: 'Método', size: 200, meta: { headerLabel: 'Método' } },",
      "  { accessorKey: 'amount', header: 'Valor', size: 130, meta: { headerLabel: 'Valor' } },",
    ],
    filtro: [
      '  // `meta.filter` é o que faz a linha de filtros existir naquela coluna.',
      '  // `select` recorta pelo valor exato; `text` casa por trecho.',
      "  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura', filter: { type: 'text' } } },",
      "  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', filter: { type: 'text' } } },",
      '  {',
      "    accessorKey: 'status',",
      "    header: 'Status',",
      '    meta: {',
      "      headerLabel: 'Status',",
      "      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },",
      '    },',
      '  },',
      "  { accessorKey: 'amount', header: 'Valor', meta: { headerLabel: 'Valor' } },",
    ],
    editavel: [
      '  // `meta.editable` troca o texto da célula por um botão que abre o campo.',
      "  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura' } },",
      "  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', editable: true } },",
      "  { accessorKey: 'method', header: 'Método', meta: { headerLabel: 'Método', editable: true } },",
      "  { accessorKey: 'amount', header: 'Valor', meta: { headerLabel: 'Valor', editable: true } },",
    ],
  };

  return [
    '// Definidas UMA vez, em escopo estável: recriar o array a cada render',
    '// zeraria ordenação, filtros e seleção.',
    'const columns: DataTableColumn<Invoice>[] = [',
    ...linhas[tipo],
    '];',
  ].join('\n');
}

/** O bloco de textos, quando a story troca o vocabulário do domínio. */
const LABELS = [
  '{',
  "    selectAll: 'Selecionar todas as faturas',",
  '    // O identificador entra no nome: dez controles com o mesmo nome são,',
  '    // para quem navega pela lista do leitor, dez controles sem nome.',
  '    selectRow: (fatura) => `Selecionar fatura ${fatura}`,',
  '  }',
].join('\n');

/** O texto do callback só entra quando é texto: nos args ele chega como função. */
function corpoDoCallback(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

/** A chamada real de `createDataTable` com as opções da story. */
export function dataTableSnippet(o: DataTableSnippetOptions = {}): string {
  const linhas = opcoes([
    ['columns', 'columns'],
    ['data', o.semDados ? '[]' : 'invoices'],
    ['enableRowSelection', o.enableRowSelection ? 'true' : undefined],
    ['enableGlobalFilter', o.enableGlobalFilter === false ? 'false' : undefined],
    ['enableColumnVisibility', o.enableColumnVisibility === false ? 'false' : undefined],
    ['enableColumnFilters', o.enableColumnFilters ? 'true' : undefined],
    ['enableColumnResizing', o.enableColumnResizing ? 'true' : undefined],
    ['enableColumnOrdering', o.enableColumnOrdering ? 'true' : undefined],
    ['enableColumnPinning', o.enableColumnPinning ? 'true' : undefined],
    ['enablePagination', o.enablePagination === false ? 'false' : undefined],
    ['virtualized', o.virtualized ? 'true' : undefined],
    ['maxHeight', o.virtualized && o.maxHeight ? texto(o.maxHeight) : undefined],
    ['pageSize', typeof o.pageSize === 'number' && o.pageSize !== 10 ? String(o.pageSize) : undefined],
    [
      'pageSizeOptions',
      o.pageSizeOptions ? `[${o.pageSizeOptions.join(', ')}]` : undefined,
    ],
    [
      'globalFilterPlaceholder',
      o.globalFilterPlaceholder && o.globalFilterPlaceholder !== BUSCA_PADRAO
        ? texto(o.globalFilterPlaceholder)
        : undefined,
    ],
    [
      'emptyMessage',
      o.emptyMessage && o.emptyMessage !== VAZIO_PADRAO ? texto(o.emptyMessage) : undefined,
    ],
    ['caption', texto(o.caption ?? CAPTION_PADRAO)],
    ['rowKey', '(fatura) => fatura.id'],
    ['rowLabel', corpoDoCallback(o.rowLabel)],
    ['labels', o.labels ? LABELS : undefined],
    ['onCellEdit', corpoDoCallback(o.onCellEdit)],
  ]);

  // A constante e a opção têm o mesmo nome, e é assim que se escreve de
  // verdade: `columns: columns` é ruído que ninguém digita.
  const chamadaDaTabela = chamada('createDataTable<Invoice>', linhas).replace(
    '\n  columns: columns,',
    '\n  columns,',
  );

  return snippet(
    IMPORTACAO,
    DADOS,
    colunas(o.colunas ?? 'base'),
    [
      '// `caption` é o nome da grade para quem chega por leitor de tela: vira',
      '// uma legenda fora da tela — não ocupa espaço e não some da árvore.',
      '// `rowKey` é a identidade da linha; sem ele a identidade é a POSIÇÃO, e',
      '// ordenar levaria a marcação para quem ocupou o lugar.',
      `const tabela = ${chamadaDaTabela};`,
    ].join('\n'),
    montar('tabela'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na configuração canônica.
 */
export const dataTableSource: SourceTransform<DataTableSnippetOptions> = (_gerado, ctx) =>
  dataTableSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function dataTableSourceCom(
  fixas: DataTableSnippetOptions,
): SourceTransform<DataTableSnippetOptions> {
  return (_gerado, ctx) => dataTableSnippet({ ...ctx.args, ...fixas });
}
