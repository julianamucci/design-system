/**
 * code-highlight.ts — Tokenizador de snippets compartilhado entre as 4 stacks.
 * Sem imports de framework e sem acesso ao DOM.
 * Importar via: import { highlightCode } from '@shared/primitives/code-highlight'
 *
 * POR QUE PRÓPRIO, e não Shiki/Prism/highlight.js
 *
 * 1. Tema. O requisito é "syntax highlighting com os temas do projeto". Libs de
 *    highlight trazem tema próprio (paleta fixa ou VS Code themes) e adaptá-las
 *    aos nossos tokens significaria sobrescrever as cores delas de qualquer
 *    forma. Aqui o tokenizador só CLASSIFICA; a cor sai de `code-block.css`
 *    lendo as custom properties, então claro/escuro/warm/cold e densidade
 *    funcionam sem mapeamento extra.
 * 2. Paridade cross-stack. Sendo TS puro compartilhado, as 4 stacks produzem
 *    exatamente a mesma tokenização — não há como divergirem.
 * 3. Segurança. A saída é DADO estruturado, não HTML. Cada stack renderiza com
 *    seus próprios nós (spans no React, `{#each}` no Svelte, `createElement` no
 *    Vanilla), então nenhum `innerHTML` entra em jogo e não há superfície de XSS
 *    a sanitizar — ao contrário de qualquer lib que devolve string de HTML.
 * 4. Zero dependência nova em 4 package.json.
 *
 * ESCOPO, declarado: isto cobre snippets de documentação — não é um parser de
 * linguagem. Não trata JSX aninhado em template string, regex literal ambíguo
 * (`/` divisão vs. regex) nem CSS-in-JS. Para esses casos o pior resultado é um
 * trecho classificado como `plain`, nunca markup quebrado. Se um dia a
 * documentação precisar destacar código arbitrário do usuário, troque por uma
 * lib de verdade.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Classes de token. A cor de cada uma vive em `nds/code-block.css`. */
export type CodeToken =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'builtin'
  | 'function'
  | 'tag'
  | 'attr'
  | 'property'
  | 'operator'
  | 'punctuation';

export type CodeLanguage =
  | 'tsx' | 'ts' | 'jsx' | 'js'
  | 'vue' | 'svelte' | 'html'
  | 'css' | 'json' | 'bash' | 'text';

export interface CodeSpan {
  text: string;
  token: CodeToken;
}

/** Uma linha do snippet, já dividida em spans. */
export type CodeLine = CodeSpan[];

/** Aceita `[3, '5-7']`, `'3, 5-7'` ou `[3, 5, 6, 7]`. */
export type LineRangeInput = string | ReadonlyArray<number | string> | undefined;

// ─── Ranges de linha ──────────────────────────────────────────────────────────

/**
 * Normaliza a entrada de `highlightLines` num Set de números 1-based.
 * Entrada inválida é ignorada em silêncio: destaque é decoração, não deve
 * derrubar a página de documentação.
 */
export function parseLineRanges(input: LineRangeInput): Set<number> {
  const out = new Set<number>();
  if (input === undefined || input === null) return out;

  const parts = typeof input === 'string' ? input.split(',') : input;
  for (const part of parts) {
    if (typeof part === 'number') {
      if (Number.isInteger(part) && part > 0) out.add(part);
      continue;
    }
    const trimmed = String(part).trim();
    if (!trimmed) continue;

    const range = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const [from, to] = start <= end ? [start, end] : [end, start];
      for (let n = from; n <= to; n++) if (n > 0) out.add(n);
      continue;
    }
    const single = Number(trimmed);
    if (Number.isInteger(single) && single > 0) out.add(single);
  }
  return out;
}

// ─── Regras por linguagem ─────────────────────────────────────────────────────

interface Rule {
  token: CodeToken;
  /** Sticky: o scanner posiciona o lastIndex, sem fatiar a string. */
  rx: RegExp;
  /** Quando presente, reclassifica conforme o texto casado. */
  refine?: (text: string) => CodeToken;
}

const JS_KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
  'continue', 'new', 'class', 'extends', 'implements', 'interface', 'type',
  'enum', 'async', 'await', 'yield', 'try', 'catch', 'finally', 'throw',
  'typeof', 'instanceof', 'in', 'of', 'delete', 'void', 'as', 'satisfies',
  'readonly', 'public', 'private', 'protected', 'static', 'get', 'set',
]);

const JS_BUILTINS = new Set([
  'true', 'false', 'null', 'undefined', 'this', 'super', 'string', 'number',
  'boolean', 'object', 'symbol', 'bigint', 'unknown', 'any', 'never',
  'document', 'window', 'console', 'Math', 'JSON', 'Object', 'Array',
  'Promise', 'Set', 'Map', 'Boolean', 'String', 'Number',
]);

const IDENTIFIER = /[A-Za-z_$][\w$]*/y;

const JS_RULES: Rule[] = [
  { token: 'comment', rx: /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*/y },
  { token: 'string', rx: /`(?:\\[\s\S]|[^\\`])*`?|"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?/y },
  { token: 'number', rx: /0[xXbBoO][\da-fA-F_]+n?|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?/y },
  // Nome de tag JSX/TSX: <Button, </Button, <div
  { token: 'tag', rx: /<\/?[A-Za-z][\w.-]*/y },
  // Chamada ou declaração de função: identificador colado no parêntese.
  //
  // Sem esta regra o token `function` NUNCA era emitido: ele existia no tipo
  // CodeToken, tinha cor própria em `--code-token-function` nos dois modos e uma
  // linha na tabela de tokens da docs page ("Nomes de função em chamadas e
  // declarações") — e nenhum trecho jamais a acendia. Cor documentada que o
  // tokenizador não produz é promessa não cumprida, não sobra: o que faltava era
  // a entrega, não a limpeza.
  //
  // Vem ANTES do identificador comum porque as regras são testadas em ordem, e
  // `refine` devolve keyword/builtin primeiro para que `if (`, `for (` e
  // `Boolean(` não virem nome de função.
  {
    token: 'function',
    rx: /[A-Za-z_$][\w$]*(?=\s*\()/y,
    refine: (text) =>
      JS_KEYWORDS.has(text) ? 'keyword'
      : JS_BUILTINS.has(text) ? 'builtin'
      : 'function',
  },
  {
    token: 'plain',
    rx: IDENTIFIER,
    refine: (text) =>
      JS_KEYWORDS.has(text) ? 'keyword'
      : JS_BUILTINS.has(text) ? 'builtin'
      : /^[A-Z]/.test(text) ? 'tag'
      : 'plain',
  },
  { token: 'operator', rx: /=>|\.\.\.|[=!<>]=+|&&|\|\||\?\?|[+\-*/%!<>=&|^~?]/y },
  { token: 'punctuation', rx: /[{}()[\];:,.@#]/y },
];

const CSS_RULES: Rule[] = [
  { token: 'comment', rx: /\/\*[\s\S]*?(?:\*\/|$)/y },
  { token: 'string', rx: /"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?/y },
  { token: 'keyword', rx: /@[\w-]+/y },
  // Custom property e propriedade seguida de dois-pontos
  { token: 'property', rx: /--[\w-]+|[a-z-]+(?=\s*:)/y },
  { token: 'number', rx: /#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|fr|deg)?/y },
  { token: 'tag', rx: /\.[A-Za-z][\w-]*|&|::?[a-z-]+(?=[\s,{:)])/y },
  { token: 'builtin', rx: IDENTIFIER },
  { token: 'punctuation', rx: /[{}()[\];:,>+~*]/y },
];

const MARKUP_RULES: Rule[] = [
  { token: 'comment', rx: /<!--[\s\S]*?(?:-->|$)/y },
  { token: 'tag', rx: /<\/?[A-Za-z][\w.:-]*|\/?>/y },
  { token: 'string', rx: /"(?:[^"\n])*"?|'(?:[^'\n])*'?/y },
  // Diretiva/atributo: v-if, :class, @click, use:melt, on:click, bind:value
  { token: 'attr', rx: /[@:#]?[A-Za-z][\w.:-]*(?==)|[@:][A-Za-z][\w.:-]*/y },
  { token: 'punctuation', rx: /[={}()]/y },
];

const JSON_RULES: Rule[] = [
  { token: 'property', rx: /"(?:\\.|[^\\"\n])*"(?=\s*:)/y },
  { token: 'string', rx: /"(?:\\.|[^\\"\n])*"?/y },
  { token: 'number', rx: /-?\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
  { token: 'builtin', rx: /\b(?:true|false|null)\b/y },
  { token: 'punctuation', rx: /[{}[\]:,]/y },
];

const BASH_RULES: Rule[] = [
  { token: 'comment', rx: /#[^\n]*/y },
  { token: 'string', rx: /"(?:\\.|[^\\"])*"?|'[^']*'?/y },
  { token: 'attr', rx: /--?[\w-]+/y },
  { token: 'keyword', rx: /\b(?:npm|npx|pnpm|yarn|node|git|cd|ls|rm|cp|mv|mkdir|echo|export)\b/y },
  { token: 'builtin', rx: IDENTIFIER },
  { token: 'operator', rx: /[|&><]+/y },
  { token: 'punctuation', rx: /[{}()[\];:,.]/y },
];

function rulesFor(language: CodeLanguage): Rule[] | null {
  switch (language) {
    case 'tsx': case 'ts': case 'jsx': case 'js': return JS_RULES;
    case 'vue': case 'svelte': case 'html': return MARKUP_RULES;
    case 'css': return CSS_RULES;
    case 'json': return JSON_RULES;
    case 'bash': return BASH_RULES;
    case 'text': default: return null;
  }
}

// ─── Tokenização ──────────────────────────────────────────────────────────────

/** Junta spans adjacentes do mesmo token — menos nós no DOM. */
function pushSpan(spans: CodeSpan[], text: string, token: CodeToken): void {
  if (!text) return;
  const last = spans[spans.length - 1];
  if (last && last.token === token) last.text += text;
  else spans.push({ text, token });
}

/**
 * Classifica o snippet e devolve uma linha por `\n`.
 *
 * Tokeniza a string INTEIRA antes de dividir em linhas: comentário de bloco e
 * template string atravessam `\n`, e dividir primeiro os classificaria errado a
 * partir da segunda linha.
 */
export function highlightCode(code: string, language: CodeLanguage = 'text'): CodeLine[] {
  const source = code.replace(/\r\n?/g, '\n');
  const rules = rulesFor(language);

  const spans: CodeSpan[] = [];
  if (!rules) {
    pushSpan(spans, source, 'plain');
  } else {
    let i = 0;
    while (i < source.length) {
      // Espaço em branco nunca é token — mantém a indentação intacta.
      const ws = /[ \t]+|\n/y;
      ws.lastIndex = i;
      const wsMatch = ws.exec(source);
      if (wsMatch) {
        pushSpan(spans, wsMatch[0], 'plain');
        i = ws.lastIndex;
        continue;
      }

      let matched = false;
      for (const rule of rules) {
        rule.rx.lastIndex = i;
        const m = rule.rx.exec(source);
        if (!m || m[0].length === 0) continue;
        const token = rule.refine ? rule.refine(m[0]) : rule.token;
        pushSpan(spans, m[0], token);
        i += m[0].length;
        matched = true;
        break;
      }
      // Nenhuma regra casou: consome 1 char como plain e segue. Garante término
      // do laço para qualquer entrada.
      if (!matched) {
        pushSpan(spans, source[i], 'plain');
        i += 1;
      }
    }
  }

  // Divide os spans em linhas
  const lines: CodeLine[] = [[]];
  for (const span of spans) {
    const parts = span.text.split('\n');
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) lines.push([]);
      pushSpan(lines[lines.length - 1], parts[p], span.token);
    }
  }
  // `code` terminando em \n gera uma última linha vazia que não deve virar linha
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();

  return lines;
}

/** Extensão/apelido → linguagem suportada. Desconhecido cai em `text`. */
export function resolveLanguage(hint?: string): CodeLanguage {
  const key = (hint ?? '').trim().toLowerCase().replace(/^\./, '');
  const map: Record<string, CodeLanguage> = {
    tsx: 'tsx', ts: 'ts', typescript: 'ts', mts: 'ts', cts: 'ts',
    jsx: 'jsx', js: 'js', javascript: 'js', mjs: 'js', cjs: 'js',
    vue: 'vue', svelte: 'svelte', html: 'html', htm: 'html',
    css: 'css', scss: 'css', json: 'json', jsonc: 'json',
    bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash',
    text: 'text', txt: 'text', plain: 'text',
  };
  return map[key] ?? 'text';
}
