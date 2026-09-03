/**
 * Transforms do painel Code do Markdown.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * A armadilha própria deste componente é a mesma do CodeBlock, e maior: o
 * documento chega por prop de TEXTO e tem quebras de linha que SIGNIFICAM — a
 * linha em branco entre parágrafos é a sintaxe. Colar
 * `content="## Título\n\nUm parágrafo"` numa linha só publica um snippet que,
 * copiado, rende um documento diferente do que está na tela.
 *
 * Uma transform por story, todas chamáveis sem argumento: é o que permite à
 * varredura de `source-snippets.test.ts` cobrar cada uma.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import { ALLOW_PRESETS, type MdBlockKind } from '@shared/primitives/markdown-ast';
import {
  MARKDOWN_CODE,
  MARKDOWN_COMMENT,
  MARKDOWN_STREAMING,
  MARKDOWN_TABLE,
  MARKDOWN_UNSAFE,
} from '@shared/primitives/markdown-examples';

export type MarkdownArgs = {
  content: string;
  streaming: boolean;
  allow: readonly MdBlockKind[];
  allowedProtocols: readonly string[];
  onLinkClick: unknown;
  className: string;
};

const IMPORT = 'import { Markdown } from "@/components/ui/markdown";';

/** Documento curto de reserva, para o snippet nunca sair sem conteúdo. */
const DEFAULT_DOCUMENT = '## Título\n\nUm parágrafo com **ênfase**.';

/**
 * O documento vira template literal, então crase, contrabarra e `${` precisam
 * sair escapados — sem isso o snippet publicado abre uma interpolação que quem
 * copia não escreveu. E crase é o caso COMUM aqui: todo documento com bloco de
 * código traz três.
 */
function templateLiteral(content: string): string {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/**
 * O ouvinte de link, declarado numa LINHA de código de verdade.
 *
 * Elidi-lo — `onLinkClick={(url) => abrir(url)}` sem `abrir` em lugar nenhum —
 * custa a quem copia exatamente o mesmo que qualquer outro símbolo sem origem:
 * `abrir is not defined` na primeira vez que alguém tocar num link. O corpo
 * fica vazio de propósito: para onde o link leva é da aplicação, e inventar
 * uma navegação aqui ensinaria uma decisão que a peça não toma.
 */
const LINK_HANDLER =
  'const abrir = (url) => { /* a navegação é da aplicação, e não do componente */ };';

/**
 * Cabeçalho: import, a declaração do texto que a prop `content` recebe e o que
 * mais o corpo do snippet vier a citar.
 */
function headerWith(content: string, declaracoes: readonly string[] = []): string {
  return [
    `${IMPORT}

const answer = \`${templateLiteral(content)}\`;`,
    ...declaracoes,
  ].join('\n\n');
}

/** `allow={["paragraph", "code"]}` — só quando a story restringe. */
function propList(name: string, value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const items = value.filter((v): v is string => typeof v === 'string');
  if (!items.length) return undefined;
  return `${name}={[${items.map((v) => `"${v}"`).join(', ')}]}`;
}

function tagMarkdown(partes: Array<string | undefined>): string {
  return `<Markdown content={answer}${attrsMultilinha(partes)} />`;
}

/** Um snippet completo, do cabeçalho ao fechamento da tag. */
function build(
  content: string,
  partes: Array<string | undefined> = [],
  declaracoes: readonly string[] = [],
): string {
  return jsxSnippet(headerWith(content, declaracoes), tagMarkdown(partes));
}

/**
 * Transform do `meta` do Playground — lê os args e monta o snippet.
 *
 * `allow` só aparece quando a story RESTRINGE: o Playground marca os oito
 * blocos, e listá-los repetiria o padrão do componente como se fosse decisão.
 */
export const markdownSource: SourceTransform<MarkdownArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const allow = Array.isArray(args.allow) && args.allow.length < 8 ? args.allow : undefined;
  const comOuvinte = Boolean(args.onLinkClick);
  return build(
    text(args.content) ?? DEFAULT_DOCUMENT,
    [
      propBool('streaming', args.streaming),
      propList('allow', allow),
      propList('allowedProtocols', args.allowedProtocols),
      // O corpo do ouvinte é da aplicação, não do componente: o snippet mostra
      // ONDE ele entra, sem inventar o que ele faz. Mas o NOME é declarado
      // junto — ver `LINK_HANDLER`.
      comOuvinte ? 'onLinkClick={(url) => abrir(url)}' : undefined,
    ],
    comOuvinte ? [LINK_HANDLER] : [],
  );
};

/** Lista branca completa: o padrão, e por isso sem `allow` no snippet. */
export function markdownFullSource(): string {
  return build(MARKDOWN_COMMENT);
}

/** Bolha de conversa: sem título e sem tabela. */
export function markdownChatSource(): string {
  return build(MARKDOWN_COMMENT, [propList('allow', [...ALLOW_PRESETS.chat])]);
}

/** Campo de comentário: só texto corrido. */
export function markdownCommentSource(): string {
  return build(MARKDOWN_COMMENT, [propList('allow', [...ALLOW_PRESETS.comment])]);
}

/** Resposta ainda chegando, com a cerca de código aberta. */
export function markdownStreamingSource(): string {
  return build(MARKDOWN_STREAMING, [propBool('streaming', true)]);
}

/** Entrada hostil: nada dela vira marcação, e nada dela some. */
export function markdownRefusedSource(): string {
  return build(MARKDOWN_UNSAFE);
}

/** Documento vazio: nada desenhado, e sem caixa ocupando espaço. */
export function markdownEmptySource(): string {
  return build('');
}

/** Bloco de código, delegado ao CodeBlock. */
export function markdownCodeBlockSource(): string {
  return build(MARKDOWN_CODE);
}

/** Tabela do GFM, delegada à Table. */
export function markdownTableSource(): string {
  return build(MARKDOWN_TABLE);
}
