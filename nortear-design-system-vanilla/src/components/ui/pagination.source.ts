// Snippet do painel Code do Pagination — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `PaginationOptions` e que o snippet precisa mostrar. */
export type PaginationSnippetOptions = {
  total?: number;
  current?: number;
  showPrevNext?: boolean;
  /**
   * Nome acessível do landmark.
   *
   * A opção canônica da fábrica é `'aria-label'`; `label` segue aceito como
   * apelido depreciado, e o painel Code ensina o canônico.
   */
  'aria-label'?: string;
  align?: 'start' | 'end';
  /** Expressão de `hrefForPage` — presença liga a paginação de rota. */
  hrefForPage?: string;
  /** Expressão do callback de mudança de página. */
  onPageChange?: string;
};

/** Nome que a fábrica assume quando `'aria-label'` não é passado. */
const LABEL_DEFAULT = 'Paginação';

/** Callback mostrado quando a story não exercita um específico. */
const CALLBACK_DEFAULT = '(page) => irPara(page)';

/**
 * Reindenta as linhas seguintes de um bloco já montado.
 *
 * `callLine()` recua os próprios pares em dois espaços, medida certa para uma
 * chamada no topo do arquivo e curta demais quando ela entra dentro de um
 * corpo de função.
 */
function recuar(block: string, espacos: string): string {
  return block
    .split('\n')
    .map((line, i) => (i === 0 ? line : `${espacos}${line}`))
    .join('\n');
}

/** As opções comuns às duas formas de snippet. */
function linesComuns(o: PaginationSnippetOptions, current: string): Array<[string, string | undefined]> {
  return [
    ['total', String(o.total ?? 5)],
    ['current', current],
    [
      'aria-label',
      o['aria-label'] && o['aria-label'] !== LABEL_DEFAULT ? text(o['aria-label']) : undefined,
    ],
    ['align', o.align ? text(o.align) : undefined],
    // `true` é o padrão da fábrica: só a supressão dos direcionais entra.
    ['showPrevNext', o.showPrevNext === false ? 'false' : undefined],
    ['hrefForPage', o.hrefForPage],
  ];
}

/** A chamada real de `createPagination` com as opções da story. */
export function paginationSnippet(o: PaginationSnippetOptions = {}): string {
  const lines = options([
    ...linesComuns(o, String(o.current ?? 1)),
    ['onPageChange', o.onPageChange ?? CALLBACK_DEFAULT],
  ]);

  return snippet(
    importing('pagination', 'createPagination'),
    `const faixa = ${callLine('createPagination', lines)};`,
    appendLine('faixa'),
  );
}

/**
 * A faixa com o estado do lado de quem consome.
 *
 * A fábrica não guarda a página: ela desenha a que recebeu e avisa qual foi
 * pedida. Quem consome guarda o número e remonta — e um snippet que omitisse
 * isso ensinaria uma paginação que não pagina.
 */
export function paginationWithStateSnippet(o: PaginationSnippetOptions = {}): string {
  const lines = options([
    ...linesComuns(o, 'paginaAtual'),
    ['onPageChange', '(page) => { paginaAtual = page; reappendLine(); }'],
  ]);

  return snippet(
    importing('pagination', 'createPagination'),
    `// A fábrica não guarda estado: quem consome mantém o número da página e
// remonta a faixa a cada mudança.
const faixa = document.createElement('div');
let paginaAtual = ${o.current ?? 1};

function reappendLine() {
  faixa.replaceChildren(${recuar(callLine('createPagination', lines), '  ')});
}

reappendLine();`,
    appendLine('faixa'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const paginationSource: SourceTransform<PaginationSnippetOptions> = (_gerado, ctx) =>
  paginationSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function paginationSourceWith(
  fixas: PaginationSnippetOptions,
): SourceTransform<PaginationSnippetOptions> {
  return (_gerado, ctx) => paginationSnippet({ ...ctx.args, ...fixas });
}

/** Transform do `meta` do Playground, que mantém a página do lado de fora. */
export const paginationWithStateSource: SourceTransform<PaginationSnippetOptions> = (_gerado, ctx) =>
  paginationWithStateSnippet(ctx.args ?? {});

/** Transform de story para a faixa com estado, com opções fixas. */
export function paginationWithStateSourceWith(
  fixas: PaginationSnippetOptions,
): SourceTransform<PaginationSnippetOptions> {
  return (_gerado, ctx) => paginationWithStateSnippet({ ...ctx.args, ...fixas });
}
