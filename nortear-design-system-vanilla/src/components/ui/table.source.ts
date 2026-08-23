// Snippet do painel Code do Table — ver `@/lib/story-source`.
//
// O Table não é uma fábrica só: são sete, uma por peça da tabela. O que o
// leitor copia é a MONTAGEM — e ela é o snippet inteiro, não uma chamada.

import { montar, snippet, text, type SourceTransform } from '@/lib/story-source';

export type TableSnippetOptions = {
  /** Legenda desenhada na tela; sem isto ela fica só para o leitor de tela. */
  captionVisivel?: boolean;
  caption?: string;
  /** Rodapé com o total das linhas exibidas. */
  withFooter?: boolean;
  /** Coluna de ação por linha. */
  withActions?: boolean;
  /** Marca uma linha com `data-state="selected"`. */
  lineSelecionada?: boolean;
};

const CAPTION_DEFAULT = 'Lista de faturas recentes';

/**
 * Dados do snippet, e não a fixture das stories.
 *
 * `table.fixtures.ts` existe para as stories medirem contagem e total sem
 * número escrito à mão — é andaime de teste, e o painel Code ensina o design
 * system, não o andaime.
 */
const DATA = [
  "const colunas = ['Fatura', 'Status', 'Método', 'Valor'];",
  '',
  'const faturas = [',
  "  { id: '#INV-001', status: 'Pago',     method: 'Cartão de crédito', amount: 'R$ 250,00' },",
  "  { id: '#INV-002', status: 'Pendente', method: 'Boleto bancário',   amount: 'R$ 150,00' },",
  '];',
].join('\n');

/** Nomes que a montagem importa do primitivo, em import de várias linhas. */
function importingParts(...names: string[]): string {
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/table';`;
}

function caption(o: TableSnippetOptions): string {
  const className = o.captionVisivel ? '' : ", 'nds-sr-only'";
  return [
    '// A legenda é o NOME da tabela. `nds-sr-only` a tira da tela e nunca do',
    '// DOM: quem entra pela árvore de acessibilidade encontraria só "tabela".',
    `table.appendChild(createTableCaption(${text(o.caption ?? CAPTION_DEFAULT)}${className}));`,
  ].join('\n');
}

function header(o: TableSnippetOptions = {}): string {
  const lines = [
    'const cabecalho = createTableHeader();',
    'const linhaDeCabecalho = createTableRow();',
    '// A última coluna é numérica: o rótulo acompanha os números que ele',
    '// nomeia. O `scope="col"` já vem da fábrica.',
    'for (const [i, coluna] of colunas.entries()) {',
    '  linhaDeCabecalho.appendChild(',
    "    createTableHead(coluna, i === colunas.length - 1 ? 'nds-text-right' : undefined),",
    '  );',
    '}',
  ];

  if (o.withActions) {
    lines.push(
      '',
      '// A coluna de ação também precisa de cabeçalho: sem ele a coluna existe',
      '// para quem vê e some para quem navega por cabeçalhos. Quem sai da tela',
      '// é o RÓTULO, num span — a classe no próprio `th` desmontaria a grade.',
      "const cabecalhoDeAcoes = createTableHead('');",
      "const rotuloDeAcoes = document.createElement('span');",
      "rotuloDeAcoes.className = 'nds-sr-only';",
      "rotuloDeAcoes.textContent = 'Ações';",
      'cabecalhoDeAcoes.appendChild(rotuloDeAcoes);',
      'linhaDeCabecalho.appendChild(cabecalhoDeAcoes);',
    );
  }

  lines.push('', 'cabecalho.appendChild(linhaDeCabecalho);', 'table.appendChild(cabecalho);');
  return lines.join('\n');
}

function body(o: TableSnippetOptions): string {
  const lines = ['const corpo = createTableBody();', 'for (const fatura of faturas) {', '  const linha = createTableRow();'];

  if (o.lineSelecionada) {
    lines.push(
      '  // Só o atributo: quem pinta a linha marcada é o próprio componente,',
      '  // pela regra `.nds-table tbody tr[data-state="selected"]`.',
      "  if (fatura.id === '#INV-002') linha.setAttribute('data-state', 'selected');",
    );
  }

  lines.push(
    "  linha.appendChild(createTableCell(fatura.id, 'nds-font-medium'));",
    '  linha.appendChild(createTableCell(fatura.status));',
    '  linha.appendChild(createTableCell(fatura.method));',
    "  linha.appendChild(createTableCell(fatura.amount, 'nds-text-right'));",
  );

  if (o.withActions) {
    lines.push(
      '',
      "  const celulaDeAcao = createTableCell('', 'nds-text-right');",
      '  celulaDeAcao.appendChild(',
      '    createButton({',
      "      variant: 'ghost',",
      "      size: 'sm',",
      "      label: 'Ações',",
      '      // O nome diz de qual fatura a ação é: três controles chamados',
      '      // "Ações" são três controles sem nome na lista do leitor.',
      "      'aria-label': `Ações para fatura ${fatura.id}`,",
      '    }),',
      '  );',
      '  linha.appendChild(celulaDeAcao);',
    );
  }

  lines.push('', '  corpo.appendChild(linha);', '}', 'table.appendChild(corpo);');
  return lines.join('\n');
}

function footer(): string {
  return [
    '// O total vive no rodapé, e não como mais uma linha do corpo: dentro do',
    '// `tbody` ele entraria na contagem de registros.',
    'const rodapeDaTabela = createTableFooter();',
    'const linhaDoTotal = createTableRow();',
    "const rotuloDoTotal = createTableCell('Total');",
    "rotuloDoTotal.setAttribute('colspan', '3');",
    "linhaDoTotal.append(rotuloDoTotal, createTableCell('R$ 400,00', 'nds-text-right'));",
    'rodapeDaTabela.appendChild(linhaDoTotal);',
    'table.appendChild(rodapeDaTabela);',
  ].join('\n');
}

/** A montagem canônica da tabela, com as peças que a story usa. */
export function tableSnippet(o: TableSnippetOptions = {}): string {
  const parts = [
    'createTable',
    'createTableBody',
    'createTableCaption',
    'createTableCell',
    'createTableHead',
    'createTableHeader',
    'createTableRow',
  ];
  if (o.withFooter) parts.splice(4, 0, 'createTableFooter');

  const importacoes = o.withActions
    ? [importingParts(...parts), "import { createButton } from '@/components/ui/button';"].join('\n')
    : importingParts(...parts);

  return snippet(
    importacoes,
    DATA,
    [
      '// O wrapper é quem rola na horizontal, e ele nasce com `tabindex="0"`:',
      '// sem isso as colunas fora da caixa ficam inalcançáveis por teclado.',
      'const { wrapper, table } = createTable();',
    ].join('\n'),
    caption(o),
    header(o),
    body(o),
    o.withFooter ? footer() : undefined,
    montar('wrapper'),
  );
}

/** Estado vazio: uma célula que atravessa a tabela inteira. */
export function tableVaziaSnippet(o: TableSnippetOptions = {}): string {
  return snippet(
    importingParts(
      'createTable',
      'createTableBody',
      'createTableCaption',
      'createTableCell',
      'createTableHead',
      'createTableHeader',
      'createTableRow',
    ),
    DATA.split('\n').slice(0, 1).join('\n'),
    'const { wrapper, table } = createTable();',
    caption(o),
    header(),
    [
      'const corpo = createTableBody();',
      'const linha = createTableRow();',
      '// `nds-table-empty` reserva a altura e centraliza a mensagem; o colspan',
      '// a faz atravessar a tabela, em vez de cair sob a primeira coluna.',
      "const celula = createTableCell('Nenhuma fatura encontrada.', 'nds-table-empty');",
      "celula.setAttribute('colspan', String(colunas.length));",
      'linha.appendChild(celula);',
      'corpo.appendChild(linha);',
      'table.appendChild(corpo);',
    ].join('\n'),
    montar('wrapper'),
  );
}

/** Carregando: esqueleto por célula, dentro de uma região que anuncia. */
export function tableLoadingSnippet(o: TableSnippetOptions = {}): string {
  return snippet(
    [
      importingParts(
        'createTable',
        'createTableBody',
        'createTableCaption',
        'createTableCell',
        'createTableHead',
        'createTableHeader',
        'createTableRow',
      ),
      "import { createSkeleton } from '@/components/ui/skeleton';",
    ].join('\n'),
    DATA.split('\n').slice(0, 1).join('\n'),
    [
      '// `aria-busy` na REGIÃO, e não na célula: o esqueleto é `aria-hidden`, e',
      '// sem a região quem usa leitor de tela ouve uma tabela vazia sem saber',
      '// que os dados estão a caminho.',
      "const regiao = document.createElement('div');",
      "regiao.setAttribute('role', 'status');",
      "regiao.setAttribute('aria-busy', 'true');",
      "regiao.setAttribute('aria-label', 'Carregando faturas');",
    ].join('\n'),
    'const { wrapper, table } = createTable();',
    caption(o),
    header(),
    [
      'const corpo = createTableBody();',
      'for (let i = 0; i < 3; i++) {',
      '  const linha = createTableRow();',
      '  for (const _coluna of colunas) {',
      "    const celula = createTableCell('');",
      "    celula.appendChild(createSkeleton({ shape: 'text', width: '3-4' }));",
      '    linha.appendChild(celula);',
      '  }',
      '  corpo.appendChild(linha);',
      '}',
      'table.appendChild(corpo);',
      '',
      'regiao.appendChild(wrapper);',
    ].join('\n'),
    montar('regiao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na montagem canônica.
 */
export const tableSource: SourceTransform<TableSnippetOptions> = (_gerado, ctx) =>
  tableSnippet(ctx.args ?? {});

/** Transform de story: mesma montagem, opções fixas que os controls não cobrem. */
export function tableSourceWith(fixas: TableSnippetOptions): SourceTransform<TableSnippetOptions> {
  return (_gerado, ctx) => tableSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o estado vazio. */
export function tableVaziaSource(
  fixas: TableSnippetOptions = {},
): SourceTransform<TableSnippetOptions> {
  return (_gerado, ctx) => tableVaziaSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o estado carregando. */
export function tableLoadingSource(
  fixas: TableSnippetOptions = {},
): SourceTransform<TableSnippetOptions> {
  return (_gerado, ctx) => tableLoadingSnippet({ ...ctx.args, ...fixas });
}
