import { cn } from '@/lib/utils';
import { createCodeBlock } from './code-block';
import {
  createTable,
  createTableBody,
  createTableHead,
  createTableHeader,
  createTableRow,
} from './table';
import {
  isSafeUrl,
  parseForRender,
  type MdBlockKind,
  type MdInline,
  type MdListItem,
  type MdNode,
} from '@shared/primitives/markdown-ast';

// ─── Markdown ────────────────────────────────────────────────────────────────
//
// Documento em Markdown desenhado a partir de uma ÁRVORE, nunca de HTML. O
// texto vem de fora do código — numa interface conversacional, de um modelo — e
// aqui não existe `innerHTML`: cada nó vira elemento por `createElement` e cada
// texto por `textContent`. Não há superfície de XSS a sanitizar porque não há
// caminho para markup.
//
// A árvore e a decisão de streaming vêm de @shared/primitives/markdown-ast, que
// as cinco stacks compartilham. O que é desta stack é só o desenho.
//
// Estrutura e cores em docs/shared/styles/nds/markdown.css.

export interface MarkdownOptions {
  /** O texto em Markdown. Tratado como não confiável. */
  content: string;
  /** Ligue enquanto o texto ainda chega. */
  streaming?: boolean;
  /** Quais blocos podem ser estruturados. O que fica de fora vira texto. */
  allow?: readonly MdBlockKind[];
  /** Esquemas de endereço aceitos em link e imagem. */
  allowedProtocols?: readonly string[];
  /** Chamado no clique de um link, com o endereço já validado. */
  onLinkClick?: (url: string) => void;
  class?: string;
}

/** Raiz devolvida pela fábrica, com o repintar que o streaming exige. */
export type MarkdownElement = HTMLDivElement & {
  /** Repinta com o que mudou. É como o texto cresce sem trocar a raiz. */
  update: (patch: Partial<MarkdownOptions>) => void;
};

/** Contexto que o desenho precisa e que não está na árvore. */
type RenderContext = Pick<MarkdownOptions, 'onLinkClick' | 'allowedProtocols'>;

/** A escada de tipos tem quatro degraus; o documento aceita seis níveis. */
function headingClass(depth: number): string {
  return `nds-text-h${Math.min(depth, 4)}`;
}

/** Endereço absoluto sai do site — não vaze o referenciador para ele. */
function isExternal(url: string): boolean {
  return /^https?:/i.test(url);
}

function renderInline(nodes: MdInline[], ctx: RenderContext): DocumentFragment {
  const frag = document.createDocumentFragment();

  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        frag.appendChild(document.createTextNode(node.value));
        break;

      case 'strong':
      case 'emphasis':
      case 'delete': {
        const tag = node.type === 'strong' ? 'strong' : node.type === 'emphasis' ? 'em' : 's';
        const el = document.createElement(tag);
        el.appendChild(renderInline(node.children, ctx));
        frag.appendChild(el);
        break;
      }

      case 'inlineCode': {
        const el = document.createElement('code');
        // Duas classes: o desenho é o de `.nds-code-inline`, e a segunda só
        // desfaz o `nowrap` dela — trecho longo de resposta precisa quebrar.
        el.className = 'nds-code-inline nds-markdown-inline-code';
        el.textContent = node.value;
        frag.appendChild(el);
        break;
      }

      case 'link': {
        const el = document.createElement('a');
        el.className = 'nds-markdown-link';
        // O parser já recusou o que não presta — link de esquema fora da
        // lista nem chega aqui como link. A pergunta é feita de novo no ponto
        // em que o endereço encosta no DOM: assim a garantia não depende de
        // quem chamou o parser antes, e fica onde uma varredura de segurança
        // consegue vê-la.
        if (isSafeUrl(node.url, ctx.allowedProtocols)) el.href = node.url;
        if (isExternal(node.url)) el.rel = 'noreferrer';
        // `title` fica de fora de propósito: ele só aparece ao pousar o
        // ponteiro, então guardar informação ali é escondê-la de quem navega
        // por teclado ou ouve a página.
        el.appendChild(renderInline(node.children, ctx));
        if (ctx.onLinkClick) {
          // Com ouvinte, quem navega é a aplicação — é o que permite empurrar a
          // rota sem recarregar. Sem ouvinte, o link é um link e o navegador
          // faz o que sempre fez: o `href` continua ali nos dois casos, então
          // abrir em outra aba e copiar o endereço seguem funcionando.
          el.addEventListener('click', (event) => {
            event.preventDefault();
            ctx.onLinkClick?.(node.url);
          });
        }
        frag.appendChild(el);
        break;
      }

      case 'image': {
        const el = document.createElement('img');
        el.className = 'nds-markdown-image';
        if (isSafeUrl(node.url, ctx.allowedProtocols)) el.src = node.url;
        // Descrição vazia deixa a imagem decorativa, e é o certo quando não há
        // descrição: ler o endereço no lugar dela seria ruído. Escrever a
        // descrição é de quem escreveu o texto.
        el.alt = node.alt;
        el.loading = 'lazy';
        frag.appendChild(el);
        break;
      }

      case 'break':
        frag.appendChild(document.createElement('br'));
        break;
    }
  }

  return frag;
}

/** O texto simples de um bloco, para quando só um rótulo cabe. */
function plainText(nodes: MdNode[]): string {
  const inline = (list: MdInline[]): string =>
    list
      .map((n) =>
        n.type === 'text' || n.type === 'inlineCode' ? n.value
        : n.type === 'image' ? n.alt
        : n.type === 'break' ? ' '
        : inline(n.children),
      )
      .join('');

  return nodes
    .map((n) =>
      n.type === 'paragraph' || n.type === 'heading' ? inline(n.children)
      : n.type === 'code' || n.type === 'raw' ? n.value
      : n.type === 'list' ? n.items.map((i) => plainText(i.children)).join(' ')
      : n.type === 'blockquote' ? plainText(n.children)
      : '',
    )
    .join(' ')
    .trim();
}

function renderListItem(item: MdListItem, ctx: RenderContext): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'nds-markdown-item';

  // Item de lista quase sempre tem um parágrafo só. Desembrulhá-lo evita uma
  // caixa a mais entre o marcador e o texto, e é o que faz a caixa de tarefa
  // ficar na mesma linha do conteúdo.
  const blocks = item.children;
  const simples = blocks.length === 1 && blocks[0].type === 'paragraph';

  if (item.checked === null) {
    if (simples && blocks[0].type === 'paragraph') {
      li.appendChild(renderInline(blocks[0].children, ctx));
      return li;
    }
    for (const block of blocks) {
      const el = renderBlock(block, ctx);
      if (el) li.appendChild(el);
    }
    return li;
  }

  // ── Item de tarefa ────────────────────────────────────────────────────────
  //
  // A caixa é um `checkbox` desabilitado de verdade, e não um glifo: ela
  // anuncia "marcada" ou "não marcada", que é a informação que o texto
  // carregava. Glifo em `::before` não anunciaria nada.
  //
  // E toda caixa precisa de NOME. Sem ele o axe reprova por controle de
  // formulário sem rótulo — e com razão: a caixa é anunciada sozinha, sem
  // dizer o que está marcado. O nome é o próprio texto do item, e por isso o
  // texto vai DENTRO de um `<label>`: assim ele é o nome e o conteúdo ao mesmo
  // tempo, sem ser lido duas vezes.
  li.classList.add('nds-markdown-task');

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = item.checked;
  box.disabled = true;

  if (simples && blocks[0].type === 'paragraph') {
    const label = document.createElement('label');
    label.className = 'nds-markdown-task-label';
    label.append(box, renderInline(blocks[0].children, ctx));
    li.appendChild(label);
    return li;
  }

  // Item com mais de um bloco: `<label>` só aceita conteúdo de frase, então
  // uma lista aninhada dentro dele seria markup inválido. Aqui o nome vem por
  // atributo, com o texto simples do item.
  box.setAttribute('aria-label', plainText(blocks));
  li.appendChild(box);
  for (const block of blocks) {
    const el = renderBlock(block, ctx);
    if (el) li.appendChild(el);
  }
  return li;
}

function renderTable(node: Extract<MdNode, { type: 'table' }>, ctx: RenderContext): HTMLElement {
  // A tabela é a do sistema: a wrapper dela já traz o recorte e o `tabindex`
  // que torna a região rolável alcançável por teclado.
  const { wrapper, table } = createTable('nds-markdown-table');
  const head = createTableHeader();
  const body = createTableBody();

  for (const row of node.rows) {
    const tr = createTableRow();
    row.cells.forEach((cell, i) => {
      const align = node.align[i];
      if (row.header) {
        const th = createTableHead('');
        if (align) th.dataset.align = align;
        th.appendChild(renderInline(cell, ctx));
        tr.appendChild(th);
        return;
      }
      const td = document.createElement('td');
      td.dataset.slot = 'table-cell';
      if (align) td.dataset.align = align;
      td.appendChild(renderInline(cell, ctx));
      tr.appendChild(td);
    });
    (row.header ? head : body).appendChild(tr);
  }

  if (head.childElementCount) table.appendChild(head);
  table.appendChild(body);
  return wrapper;
}

function renderBlock(node: MdNode, ctx: RenderContext): HTMLElement | null {
  switch (node.type) {
    case 'paragraph': {
      const p = document.createElement('p');
      p.className = 'nds-markdown-paragraph';
      p.appendChild(renderInline(node.children, ctx));
      return p;
    }

    case 'heading': {
      const h = document.createElement(`h${node.depth}`);
      h.className = cn(headingClass(node.depth), 'nds-markdown-heading');
      h.appendChild(renderInline(node.children, ctx));
      return h;
    }

    case 'code':
      // Delegado: o CodeBlock já traz destaque de sintaxe pelos tokens do tema,
      // numeração e o botão de copiar. Uma segunda paleta aqui divergiria dele.
      return createCodeBlock({ code: node.value, language: node.lang ?? undefined });

    case 'blockquote': {
      const quote = document.createElement('blockquote');
      quote.className = 'nds-markdown-quote';
      for (const child of node.children) {
        const el = renderBlock(child, ctx);
        if (el) quote.appendChild(el);
      }
      return quote;
    }

    case 'list': {
      const list = document.createElement(node.ordered ? 'ol' : 'ul');
      list.className = 'nds-markdown-list';
      if (node.ordered && node.start !== null && node.start !== 1) {
        (list as HTMLOListElement).start = node.start;
      }
      for (const item of node.items) list.appendChild(renderListItem(item, ctx));
      return list;
    }

    case 'thematicBreak': {
      const hr = document.createElement('hr');
      hr.className = 'nds-markdown-rule';
      return hr;
    }

    case 'table':
      return renderTable(node, ctx);

    case 'raw': {
      // O que a lista branca recusou, o que o parser não estruturou e a
      // construção ainda aberta durante o streaming. Sai como TEXTO: bloco que
      // desaparece deixa quem lê sem saber que havia algo ali.
      const p = document.createElement('p');
      p.className = 'nds-markdown-raw';
      p.textContent = node.value;
      return p;
    }
  }
}

export function createMarkdown(options: MarkdownOptions): MarkdownElement {
  const root = document.createElement('div') as MarkdownElement;
  root.dataset.slot = 'markdown';

  let current: MarkdownOptions = { ...options };

  const render = () => {
    root.className = cn('nds-markdown', current.class);
    // Configuração registrada no DOM, e não só no closure: é o que permite a
    // teste e devtools distinguirem as opções, e o que mantém o snippet da aba
    // API Reference acompanhando os controls.
    root.dataset.streaming = String(current.streaming === true);
    if (current.allow) root.dataset.allow = current.allow.join(' ');
    else delete root.dataset.allow;

    // Ocupado enquanto gera, para quem ouve saber que o conteúdo ainda muda.
    //
    // E NÃO é região viva: anunciar a cada trecho tornaria a leitura
    // impossível. A resposta é anunciada uma vez, inteira, quando termina —
    // que é o que o leitor de tela faz sozinho ao encontrar o documento
    // parado.
    if (current.streaming) root.setAttribute('aria-busy', 'true');
    else root.removeAttribute('aria-busy');

    while (root.firstChild) root.removeChild(root.firstChild);

    const tree = parseForRender(current.content, {
      streaming: current.streaming,
      allow: current.allow,
      allowedProtocols: current.allowedProtocols,
    });

    const ctx: RenderContext = {
      onLinkClick: current.onLinkClick,
      allowedProtocols: current.allowedProtocols,
    };
    for (const node of tree.children) {
      const el = renderBlock(node, ctx);
      if (el) root.appendChild(el);
    }
  };

  render();

  root.update = (patch) => {
    current = { ...current, ...patch };
    render();
  };

  return root;
}
