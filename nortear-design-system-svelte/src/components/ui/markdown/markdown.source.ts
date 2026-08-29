/**
 * Transforms do painel Code do Markdown.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * A armadilha própria deste componente: o documento chega por prop de TEXTO e
 * tem quebras de linha que SIGNIFICAM — a linha em branco entre parágrafos é a
 * sintaxe. Achatá-lo numa string de uma linha publica um snippet que, copiado,
 * rende um documento diferente do que está na tela. E, dentro do bloco de
 * script, um `</script` no conteúdo fecharia o bloco no meio do literal.
 *
 * Uma transform por story, todas chamáveis sem argumento.
 */
import { attrsMultilinha, END_SCRIPT } from '@/lib/story-source';
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
  class: string;
};

const IMPORT = 'import { Markdown } from "@/components/ui/markdown";';

/** Documento curto de reserva, para o snippet nunca sair sem conteúdo. */
const DEFAULT_DOCUMENT = '## Título\n\nUm parágrafo com **ênfase**.';

/**
 * O documento vira um literal do bloco de script.
 *
 * Crase, contrabarra e `${` saem escapados — e crase é o caso COMUM aqui, não a
 * borda: todo documento com bloco de código traz três. O `</script` também sai
 * escapado, senão o parser fecharia o bloco no meio da string.
 */
function documentLiteral(content: string): string {
  const scriptNoEnd = (value: string) => value.replace(/<\/script/gi, '<\\/script');
  const escapado = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${scriptNoEnd(escapado)}\``;
}

/** `allow={["paragraph", "code"]}` — só quando a story restringe. */
function attrList(name: string, value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  const items = value.filter((v): v is string => typeof v === 'string');
  if (!items.length) return '';
  return `${name}={[${items.map((v) => `"${v}"`).join(', ')}]}`;
}

/**
 * Um snippet completo: script com o documento, marcação com a tag.
 *
 * Montado à mão, e não pelo `svelteSnippet`: ele recua TODA linha do bloco de
 * script, inclusive as de dentro do literal do documento. Duas casas a mais no
 * começo de uma linha de Markdown não são estilo — são sintaxe: elas grudam a
 * linha no parágrafo anterior, e com quatro viram bloco de código. O snippet
 * publicado renderia um documento diferente do que está na tela, e só quem
 * copiasse descobriria.
 *
 * Aqui a continuação do literal fica encostada à esquerda, que é como se
 * escreve isso de verdade num arquivo.
 */
function build(content: string, partes: string[] = []): string {
  return [
    '<script lang="ts">',
    `  ${IMPORT}`,
    '',
    `  const answer = ${documentLiteral(content)};`,
    END_SCRIPT,
    '',
    `<Markdown content={answer}${attrsMultilinha(partes)} />`,
  ].join('\n');
}

/**
 * Transform do `meta` do Playground — lê os args e monta o snippet.
 *
 * `allow` só aparece quando a story RESTRINGE: o Playground marca os oito
 * blocos, e listá-los repetiria o padrão do componente como se fosse decisão.
 */
export function markdownSource(_gerado?: string, ctx?: { args?: Partial<MarkdownArgs> }): string {
  const args = ctx?.args ?? {};
  const content = typeof args.content === 'string' && args.content !== ''
    ? args.content
    : DEFAULT_DOCUMENT;
  const allow = Array.isArray(args.allow) && args.allow.length < 8 ? args.allow : undefined;
  return build(content, [
    args.streaming ? 'streaming' : '',
    attrList('allow', allow),
    attrList('allowedProtocols', args.allowedProtocols),
    // O corpo do ouvinte é da aplicação, não do componente: o snippet mostra
    // ONDE ele entra, sem inventar o que ele faz.
    args.onLinkClick ? 'onLinkClick={(url) => abrir(url)}' : '',
  ]);
}

/** Lista branca completa: o padrão, e por isso sem `allow` no snippet. */
export function markdownFullSource(): string {
  return build(MARKDOWN_COMMENT);
}

/** Bolha de conversa: sem título e sem tabela. */
export function markdownChatSource(): string {
  return build(MARKDOWN_COMMENT, [attrList('allow', [...ALLOW_PRESETS.chat])]);
}

/** Campo de comentário: só texto corrido. */
export function markdownCommentSource(): string {
  return build(MARKDOWN_COMMENT, [attrList('allow', [...ALLOW_PRESETS.comment])]);
}

/** Resposta ainda chegando, com a cerca de código aberta. */
export function markdownStreamingSource(): string {
  return build(MARKDOWN_STREAMING, ['streaming']);
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
