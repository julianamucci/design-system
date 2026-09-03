/**
 * Transforms do painel Code do Markdown.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A armadilha própria deste componente: o documento chega por prop de TEXTO e
 * tem quebras de linha que SIGNIFICAM — a linha em branco entre parágrafos é a
 * sintaxe. Achatá-lo numa string de uma linha publica um snippet que, copiado,
 * rende um documento diferente do que está na tela. E, dentro de um SFC, um
 * `</script` no conteúdo fecharia o bloco no meio do literal.
 *
 * Uma transform por story, todas chamáveis sem argumento: a varredura do
 * repositório cobra cada uma pelo nome terminado em `Source`.
 */
import {
  attrBool,
  attrsMultilinha,
  vueSnippet,
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
  class: string;
};

const IMPORT = `import { Markdown } from '@/components/ui/markdown'`;

/** Documento curto de reserva, para o snippet nunca sair sem conteúdo. */
const DEFAULT_DOCUMENT = '## Título\n\nUm parágrafo com **ênfase**.';

/**
 * O documento vira um literal do `script setup`.
 *
 * Crase, contrabarra e `${` saem escapados — e crase é o caso COMUM aqui, não a
 * borda: todo documento com bloco de código traz três. O `</script` também sai
 * escapado, senão o parser do SFC fecharia o bloco no meio da string.
 */
function documentLiteral(content: string): string {
  const scriptNoEnd = (value: string) => value.replace(/<\/script/gi, '<\\/script');
  const escapado = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${scriptNoEnd(escapado)}\``;
}

/** `:allow="['paragraph', 'code']"` — só quando a story restringe. */
function attrList(name: string, value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  const items = value.filter((v): v is string => typeof v === 'string');
  if (!items.length) return '';
  return `:${name}="[${items.map((v) => `'${v}'`).join(', ')}]"`;
}

/**
 * O ouvinte do link, DECLARADO no exemplo.
 *
 * O que ele faz continua sendo da aplicação — abrir noutra aba, confirmar antes
 * de sair, registrar o clique. O que não podia continuar é ele existir só como
 * nome no atributo: `@link-click="abrir"` sem declaração nenhuma entrega a quem
 * copia um ouvinte que não resolve.
 */
const ABRIR = [
  'function abrir(href: string) {',
  '  // O que fazer com o link é da aplicação: o componente só avisa qual foi.',
  "  window.open(href, '_blank', 'noopener');",
  '}',
].join('\n');

/** Um snippet completo: script com o documento, template com a tag. */
function build(content: string, partes: string[] = [], extra: string[] = []): string {
  return vueSnippet(
    [`${IMPORT}\n\nconst answer = ${documentLiteral(content)}`, ...extra].join('\n\n'),
    `<Markdown :content="answer"${attrsMultilinha(partes)} />`,
  );
}

/**
 * Transform do `meta` do Playground — lê os args e monta o snippet.
 *
 * `allow` só aparece quando a story RESTRINGE: o Playground marca os oito
 * blocos, e listá-los repetiria o padrão do componente como se fosse decisão.
 */
export const markdownSource: SourceTransform<MarkdownArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const content = typeof args.content === 'string' && args.content !== ''
    ? args.content
    : DEFAULT_DOCUMENT;
  const allow = Array.isArray(args.allow) && args.allow.length < 8 ? args.allow : undefined;
  return build(
    content,
    [
      attrBool('streaming', args.streaming, false),
      attrList('allow', allow),
      attrList('allowed-protocols', args.allowedProtocols),
      // O que o ouvinte FAZ é da aplicação; que ele exista, não: o snippet o
      // declara junto, ou ensina a ligar um nome que não resolve.
      args.onLinkClick ? '@link-click="abrir"' : '',
    ],
    args.onLinkClick ? [ABRIR] : [],
  );
};

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
  return build(MARKDOWN_STREAMING, [attrBool('streaming', true, false)]);
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
