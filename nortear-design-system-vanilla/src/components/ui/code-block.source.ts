// Snippet do painel Code do CodeBlock — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * Trecho de exemplo padrão.
 *
 * Três linhas bastam para haver o que numerar e o que destacar — e o trecho é
 * do snippet, não do arquivo de story: `COMPOSITION_CODE`, `LONG_CODE` e
 * `LANGUAGE_ITEMS` são andaime de teste e de docs page, e o painel Code ensina
 * o design system, não o andaime.
 */
const TRECHO_DEFAULT = [
  'const items = await load();',
  'const total = items.length;',
  'render(items, total);',
].join('\n');

/** Apelidos que a fábrica resolve para `text`, que é o padrão dela. */
const LANGUAGE_DEFAULT = ['', 'text', 'txt', 'plain'];

/** O que a story usa da `CodeBlockOptions` e que o snippet precisa mostrar. */
export type CodeBlockSnippetOptions = {
  /** Conteúdo do bloco. Vira o literal `source` acima da chamada. */
  code?: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  /** `'3, 5-7'` ou `[3, '5-7']` — as duas formas que a fábrica aceita. */
  highlightLines?: string | Array<string | number>;
  footer?: string;
};

/**
 * O trecho como template literal, para o snippet não achatar em uma linha só
 * um código que tem quebras. Escapa o que fecharia a crase antes da hora.
 */
function codeLiteral(code: string): string {
  const corpo = code
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${corpo}\``;
}

/** `'1, 4-5'` fica string; `[3, '5-7']` fica array — como a story escreveu. */
function literalDeLinhas(valor: string | Array<string | number>): string | undefined {
  if (typeof valor === 'string') return valor.trim() === '' ? undefined : texto(valor);
  if (valor.length === 0) return undefined;
  return `[${valor.map((n) => (typeof n === 'number' ? String(n) : texto(n))).join(', ')}]`;
}

/**
 * A chamada real de `createCodeBlock` com as opções da story.
 *
 * O código exibido é argumento obrigatório da fábrica, então ele aparece —
 * como um literal `source` logo acima, que é o que quem consome escreve.
 */
export function codeBlockSnippet(o: CodeBlockSnippetOptions = {}): string {
  const linguagem = (o.language ?? '').toLowerCase();
  const lines = opcoes([
    ['code', 'source'],
    ['language', LANGUAGE_DEFAULT.includes(linguagem) ? undefined : texto(o.language!)],
    ['title', o.title ? texto(o.title) : undefined],
    ['showLineNumbers', o.showLineNumbers === false ? 'false' : undefined],
    [
      'highlightLines',
      o.highlightLines === undefined ? undefined : literalDeLinhas(o.highlightLines),
    ],
    ['footer', o.footer ? texto(o.footer) : undefined],
  ]);

  return snippet(
    importing('code-block', 'createCodeBlock'),
    `const source = ${codeLiteral(o.code ?? TRECHO_DEFAULT)};`,
    `const bloco = ${chamada('createCodeBlock', lines)};`,
    montar('bloco'),
  );
}

/**
 * O mesmo bloco, mais a saída dele da página.
 *
 * Forma própria porque o assunto da story é o que acontece DEPOIS: a
 * confirmação de "copiado" agenda a volta do rótulo, e tirar o bloco da página
 * antes disso precisa cancelar o temporizador. A limpeza é da fábrica — quem
 * consome só remove o nó.
 */
export function codeBlockWithRemovalSnippet(o: CodeBlockSnippetOptions = {}): string {
  return snippet(
    codeBlockSnippet(o),
    [
      '// A confirmação de "copiado" volta ao rótulo inicial depois de 2 segundos.',
      '// Tirar o bloco da página antes disso cancela o temporizador pendente:',
      '// `destroy()` roda sozinho na saída, e chamá-lo à mão é idempotente.',
      'bloco.remove();',
    ].join('\n'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é
 * exatamente o uso canônico do componente.
 */
export const codeBlockSource: SourceTransform<CodeBlockSnippetOptions> = (_gerado, ctx) =>
  codeBlockSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function codeBlockSourceWith(
  fixas: CodeBlockSnippetOptions,
): SourceTransform<CodeBlockSnippetOptions> {
  return (_gerado, ctx) => codeBlockSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a forma com remoção. */
export function codeBlockWithRemovalSource(
  fixas: CodeBlockSnippetOptions = {},
): SourceTransform<CodeBlockSnippetOptions> {
  return (_gerado, ctx) => codeBlockWithRemovalSnippet({ ...ctx.args, ...fixas });
}
