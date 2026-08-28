/**
 * markdown-ast.ts — Markdown para ÁRVORE, compartilhado pelas 5 stacks.
 * Sem imports de framework e sem acesso ao DOM.
 * Importar via: import { parseMarkdown } from '@shared/primitives/markdown-ast'
 *
 * POR QUE ÁRVORE, e não HTML
 *
 * O mesmo argumento do `code-highlight.ts`, e aqui ele pesa mais. Lá a entrada
 * era um snippet escrito por quem programa; aqui a entrada vem de um MODELO, que
 * é conteúdo não confiável por definição. Toda biblioteca que devolve string de
 * HTML transfere para quem consome o problema de sanitizar — e a sanitização
 * certa depende do que cada stack faz com a string depois.
 *
 * Devolvendo DADO, o problema desaparece em vez de ser transferido: cada stack
 * monta os próprios nós (`createElement` no Vanilla, JSX no React, `{#each}` no
 * Svelte), nenhum `innerHTML` entra em jogo, e não há superfície de XSS a
 * sanitizar. É por isso que este módulo NÃO exporta nada que produza markup.
 *
 * POR QUE mdast, e não o markdown do Tiptap
 *
 * O Tiptap 3.30.5 já está nas cinco stacks e tem maquinaria de markdown no core.
 * Foi medido, e ficou de fora por três razões:
 *
 *   - `MarkdownManager` não é exportado. O que o core expõe é a superfície para
 *     ESCREVER extensão, consumida por um `Editor` — não existe `parse()`
 *     avulso. Chegar ao JSON exige instanciar o editor, e com ele vem o
 *     ProseMirror: 11,4 MB em disco de motor de EDIÇÃO para exibir texto;
 *   - o tokenizador seria o `marked` de qualquer jeito, então a rota também traz
 *     pacote novo — e ainda acrescenta uma segunda transformação para um formato
 *     desenhado para editar (marcas como array em nó de texto), não para
 *     renderizar;
 *   - a documentação do próprio Tiptap chama a extensão de "early release,
 *     sujeita a mudar".
 *
 * A rota Tiptap fica reservada para o COMPOSITOR, onde markdown de ida e volta é
 * exatamente o caso de uso dela e o editor já está montado.
 *
 * O CUSTO, medido e não estimado
 *
 * São 55 pacotes — a granularidade do micromark, que é dividido em módulos
 * minúsculos de propósito. O que importa é o bundle:
 *
 *   com GFM   78 KB minificado, 22 KB em gzip
 *   sem GFM   55 KB minificado, 16 KB em gzip
 *
 * Para referência na mesma árvore: o DOMPurify sozinho ocupa 1,8 MB em disco.
 * A proposta dizia "~10 transitivos" — era estimativa, e estava errada.
 */

import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';

// ─── A árvore que sai daqui ──────────────────────────────────────────────────
//
// NÃO é o mdast cru, e a diferença é deliberada. O mdast tem nós que este design
// system não renderiza, carrega posição de origem que ninguém usa, e é a API de
// uma dependência — expô-la faria uma troca de versão do parser atravessar as
// cinco stacks. O que sai daqui é um tipo NOSSO, fechado, com o subconjunto que
// o componente sabe desenhar.

/** Alinhamento de coluna de tabela. `null` é "o autor não disse". */
export type MdAlign = 'left' | 'center' | 'right' | null;

export type MdNode =
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'heading'; depth: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
  | { type: 'code'; lang: string | null; value: string }
  | { type: 'blockquote'; children: MdNode[] }
  | { type: 'list'; ordered: boolean; start: number | null; items: MdListItem[] }
  | { type: 'thematicBreak' }
  | { type: 'table'; align: MdAlign[]; rows: MdTableRow[] }
  /**
   * Texto que o parser NÃO conseguiu estruturar, ou que a lista branca recusou.
   *
   * Existe para que nada suma em silêncio. Bloco recusado que desaparece deixa
   * quem lê sem saber que havia algo ali — e, num chat, sem saber que o modelo
   * respondeu outra coisa.
   */
  | { type: 'raw'; value: string };

export type MdListItem = {
  /** `null` quando o item não é de tarefa; booleano quando é. */
  checked: boolean | null;
  children: MdNode[];
};

export type MdTableRow = {
  header: boolean;
  cells: MdInline[][];
};

export type MdInline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'emphasis'; children: MdInline[] }
  | { type: 'delete'; children: MdInline[] }
  | { type: 'inlineCode'; value: string }
  | { type: 'link'; url: string; title: string | null; children: MdInline[] }
  | { type: 'image'; url: string; alt: string; title: string | null }
  | { type: 'break' };

export type MdRoot = { type: 'root'; children: MdNode[] };

/** Nomes de bloco que a lista branca aceita. */
export type MdBlockKind = MdNode['type'];

export type ParseMarkdownOptions = {
  /**
   * Quais blocos podem ser estruturados. O que ficar de fora vira `raw` — nunca
   * some.
   *
   * Serve a dois casos reais: uma bolha de chat que não quer tabela nem imagem,
   * e uma área de comentário que só aceita texto e ênfase.
   */
  allow?: readonly MdBlockKind[];
  /**
   * Esquemas de URL aceitos em link e imagem. O que não estiver aqui perde o
   * endereço — o texto do link permanece, o destino não.
   */
  allowedProtocols?: readonly string[];
};

/** O que uma resposta de modelo usa, que é quase tudo menos HTML. */
const DEFAULT_ALLOW: readonly MdBlockKind[] = [
  'paragraph', 'heading', 'code', 'blockquote', 'list', 'thematicBreak', 'table', 'raw',
];

/**
 * `http`, `https` e `mailto`, e mais nada por padrão.
 *
 * `javascript:` é o vetor óbvio. `data:` fica de fora por um motivo menos óbvio:
 * `data:text/html` num link é execução de script na origem da página, e permitir
 * só `data:image/*` exigiria conferir o tipo declarado — que é escolhido por
 * quem escreveu o markdown, ou seja, pelo modelo.
 */
const DEFAULT_PROTOCOLS: readonly string[] = ['http:', 'https:', 'mailto:'];

/**
 * O endereço é aceitável?
 *
 * URL relativa passa: ela não carrega esquema e resolve contra a página, que é o
 * comportamento esperado de documentação. O que se recusa é esquema EXPLÍCITO
 * fora da lista.
 */
function safeUrl(raw: string, protocols: readonly string[]): string | null {
  const value = raw.trim();
  if (value === '') return null;
  // Sem `://` e sem `:` antes de qualquer `/`, é relativa.
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return value;
  return protocols.includes(scheme[1].toLowerCase() + ':') ? value : null;
}

// ─── mdast → a nossa árvore ──────────────────────────────────────────────────
//
// A conversão é explícita nó a nó, e não uma cópia com filtro. O motivo é o
// mesmo da lista exaustiva de rótulos do media player: nó novo do parser não
// entra sem alguém decidir o que ele vira. Um `default` permissivo faria uma
// atualização do mdast introduzir markup que ninguém revisou.

type AnyNode = { type: string; [key: string]: unknown };

function inlineFrom(nodes: AnyNode[], protocols: readonly string[]): MdInline[] {
  const out: MdInline[] = [];
  for (const node of nodes) {
    const children = Array.isArray(node.children) ? (node.children as AnyNode[]) : [];
    switch (node.type) {
      case 'text':
        out.push({ type: 'text', value: String(node.value ?? '') });
        break;
      case 'strong':
        out.push({ type: 'strong', children: inlineFrom(children, protocols) });
        break;
      case 'emphasis':
        out.push({ type: 'emphasis', children: inlineFrom(children, protocols) });
        break;
      case 'delete':
        out.push({ type: 'delete', children: inlineFrom(children, protocols) });
        break;
      case 'inlineCode':
        out.push({ type: 'inlineCode', value: String(node.value ?? '') });
        break;
      case 'break':
        out.push({ type: 'break' });
        break;
      case 'link': {
        const url = safeUrl(String(node.url ?? ''), protocols);
        const inner = inlineFrom(children, protocols);
        // Endereço recusado não apaga o texto: o link vira o próprio texto, e
        // quem lê continua vendo o que o autor escreveu.
        if (url === null) out.push(...inner);
        else out.push({ type: 'link', url, title: (node.title as string) ?? null, children: inner });
        break;
      }
      case 'image': {
        const url = safeUrl(String(node.url ?? ''), protocols);
        if (url === null) {
          const alt = String(node.alt ?? '');
          if (alt !== '') out.push({ type: 'text', value: alt });
        } else {
          out.push({ type: 'image', url, alt: String(node.alt ?? ''), title: (node.title as string) ?? null });
        }
        break;
      }
      // `html` inline é o vetor de XSS mais direto que existe num chat. Vira
      // texto: quem lê vê exatamente o que o modelo escreveu, e nada executa.
      case 'html':
        out.push({ type: 'text', value: String(node.value ?? '') });
        break;
      default:
        // Nó desconhecido com filhos: aproveita o que dá. Sem filhos e sem
        // valor, some — mas aí não havia texto para perder.
        if (children.length > 0) out.push(...inlineFrom(children, protocols));
        else if (typeof node.value === 'string') out.push({ type: 'text', value: node.value });
    }
  }
  return out;
}

function blocksFrom(
  nodes: AnyNode[],
  allow: readonly MdBlockKind[],
  protocols: readonly string[],
): MdNode[] {
  const out: MdNode[] = [];
  const keep = (kind: MdBlockKind) => allow.includes(kind);

  for (const node of nodes) {
    const children = Array.isArray(node.children) ? (node.children as AnyNode[]) : [];

    switch (node.type) {
      case 'paragraph':
        if (keep('paragraph')) out.push({ type: 'paragraph', children: inlineFrom(children, protocols) });
        break;

      case 'heading': {
        const depth = Math.min(6, Math.max(1, Number(node.depth) || 1)) as 1 | 2 | 3 | 4 | 5 | 6;
        if (keep('heading')) out.push({ type: 'heading', depth, children: inlineFrom(children, protocols) });
        else if (keep('paragraph')) out.push({ type: 'paragraph', children: inlineFrom(children, protocols) });
        break;
      }

      case 'code':
        if (keep('code')) {
          out.push({ type: 'code', lang: (node.lang as string) || null, value: String(node.value ?? '') });
        } else {
          out.push({ type: 'raw', value: String(node.value ?? '') });
        }
        break;

      case 'blockquote':
        if (keep('blockquote')) out.push({ type: 'blockquote', children: blocksFrom(children, allow, protocols) });
        else out.push(...blocksFrom(children, allow, protocols));
        break;

      case 'list': {
        if (!keep('list')) { out.push(...blocksFrom(children, allow, protocols)); break; }
        const items: MdListItem[] = children.map((item) => ({
          // `checked` só existe em item de tarefa do GFM; `null` diz "não é".
          checked: typeof item.checked === 'boolean' ? item.checked : null,
          children: blocksFrom(
            Array.isArray(item.children) ? (item.children as AnyNode[]) : [],
            allow,
            protocols,
          ),
        }));
        out.push({
          type: 'list',
          ordered: node.ordered === true,
          start: typeof node.start === 'number' ? node.start : null,
          items,
        });
        break;
      }

      case 'thematicBreak':
        if (keep('thematicBreak')) out.push({ type: 'thematicBreak' });
        break;

      case 'table': {
        if (!keep('table')) {
          // Tabela recusada não some: cada linha vira parágrafo com as células
          // separadas, que é o que o texto dizia antes de virar grade.
          for (const row of children) {
            const cells = Array.isArray(row.children) ? (row.children as AnyNode[]) : [];
            const inline = cells.flatMap((cell, i) => {
              const parsed = inlineFrom(
                Array.isArray(cell.children) ? (cell.children as AnyNode[]) : [],
                protocols,
              );
              return i === 0 ? parsed : [{ type: 'text', value: ' — ' } as MdInline, ...parsed];
            });
            if (keep('paragraph') && inline.length > 0) out.push({ type: 'paragraph', children: inline });
          }
          break;
        }
        const align = (Array.isArray(node.align) ? node.align : []) as MdAlign[];
        const rows: MdTableRow[] = children.map((row, index) => ({
          header: index === 0,
          cells: (Array.isArray(row.children) ? (row.children as AnyNode[]) : []).map((cell) =>
            inlineFrom(Array.isArray(cell.children) ? (cell.children as AnyNode[]) : [], protocols),
          ),
        }));
        out.push({ type: 'table', align, rows });
        break;
      }

      // `html` de bloco vira texto, pelo mesmo motivo do inline.
      case 'html':
        if (keep('raw')) out.push({ type: 'raw', value: String(node.value ?? '') });
        break;

      // Nota de rodapé, definição de link e afins: sem representação visual
      // própria neste componente. Some sem perda porque o conteúdo delas
      // aparece no ponto de uso.
      case 'definition':
      case 'footnoteDefinition':
      case 'yaml':
        break;

      default:
        if (children.length > 0) out.push(...blocksFrom(children, allow, protocols));
        else if (typeof node.value === 'string' && keep('raw')) {
          out.push({ type: 'raw', value: node.value });
        }
    }
  }
  return out;
}

/**
 * Markdown para árvore. Função PURA: mesma entrada, mesma saída, sem DOM.
 *
 * GFM está sempre ligado — tabela, riscado, lista de tarefa e link automático
 * são o que um modelo escreve por padrão, e desligá-los faria a saída dele
 * chegar quebrada em vez de simplificada.
 */
export function parseMarkdown(source: string, options: ParseMarkdownOptions = {}): MdRoot {
  const allow = options.allow ?? DEFAULT_ALLOW;
  const protocols = options.allowedProtocols ?? DEFAULT_PROTOCOLS;

  const tree = fromMarkdown(source ?? '', {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as unknown as AnyNode;

  const children = Array.isArray(tree.children) ? (tree.children as AnyNode[]) : [];
  return { type: 'root', children: blocksFrom(children, allow, protocols) };
}

/**
 * O texto ainda está sendo escrito no meio de uma construção?
 *
 * Enquanto os tokens chegam, o markdown é sintaticamente INCOMPLETO: uma cerca
 * de código aberta, uma tabela com o cabeçalho mas sem a linha de alinhamento.
 * Reparsear a cada token faz a estrutura piscar — o texto vira tabela, volta a
 * ser parágrafo e vira tabela de novo, três vezes por segundo.
 *
 * Quem renderiza usa isto para decidir ESPERAR: com a construção aberta, mantém
 * a árvore anterior e só repinta o texto que veio depois dela. Não é heurística
 * de exibição, é a diferença entre uma resposta que se monta e uma que tremula.
 *
 * Devolve o índice em que a construção aberta COMEÇA, ou `null` se não há
 * nenhuma. O índice serve para cortar: o que vem antes é estável.
 */
export function openConstructionAt(source: string): number | null {
  const lines = source.split('\n');
  let fenceStart: number | null = null;
  let fenceMark = '';
  let offset = 0;

  for (const line of lines) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (fenceStart === null) { fenceStart = offset; fenceMark = fence[1][0]; }
      // Fecha só com a MESMA marca: um `~~~` não fecha um ```.
      else if (fence[1][0] === fenceMark) { fenceStart = null; fenceMark = ''; }
    }
    offset += line.length + 1;
  }
  if (fenceStart !== null) return fenceStart;

  // Cabeçalho de tabela sem a linha de alinhamento embaixo: a última linha
  // parece tabela e ainda não é.
  const last = lines[lines.length - 1] ?? '';
  const previous = lines[lines.length - 2] ?? '';
  const looksLikeRow = (text: string) => /^\s*\|.*\|\s*$/.test(text);
  if (looksLikeRow(last) && !looksLikeRow(previous)) {
    return source.length - last.length;
  }
  return null;
}
