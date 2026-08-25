// Snippet do painel Code do ScrollArea — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ScrollAreaSize } from './scroll-area';

/** Qual demonstração ocupa a área rolável. Muda o CONTEÚDO, não a chamada. */
export type ScrollAreaContent = 'lista' | 'fileira' | 'matriz' | 'links' | 'badges';

/**
 * O que as stories usam da `ScrollAreaOptions`.
 *
 * `label` e `className` estão aqui porque são as chaves dos args das stories —
 * assim `{ ...ctx.args }` entra sem tradução. No snippet elas saem pelo nome
 * CANÔNICO da fábrica (`'aria-label'` e `class`); os apelidos são `@deprecated`
 * e não devem ser ensinados.
 */
export type ScrollAreaSnippetOptions = {
  /** Degrau da escada de altura. `null` mostra o caso SEM teto, que não rola. */
  size?: ScrollAreaSize | null;
  width?: string;
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label` — chave dos args da story. */
  label?: string;
  class?: string;
  /** @deprecated Apelido de `class` — chave dos args da story. */
  className?: string;
  itemCount?: number;
  content?: ScrollAreaContent;
};

const CLASSNAME_DEFAULT = 'nds-w-full nds-rounded-md nds-border-default';

function accessibleName(o: ScrollAreaSnippetOptions): string | undefined {
  const name = o['aria-label'] ?? o.label;
  return name ? text(name) : undefined;
}

function className(o: ScrollAreaSnippetOptions): string {
  return o.class ?? o.className ?? CLASSNAME_DEFAULT;
}

/**
 * As opções da fábrica.
 *
 * `size` NÃO é omitido como se fosse padrão: a fábrica não tem degrau nenhum por
 * padrão, e sem teto de altura não há transbordo — logo não há rolagem. Omiti-lo
 * ensinaria o erro de uso mais comum do componente, que é a story `NoLimit`.
 */
function areaLines(o: ScrollAreaSnippetOptions, child: string): string[] {
  const degrau = o.size === null ? undefined : (o.size ?? 'lg');
  return options([
    ['size', degrau ? text(degrau) : undefined],
    ['width', o.width ? text(o.width) : undefined],
    ['aria-label', accessibleName(o)],
    ['class', text(className(o))],
    ['children', child],
  ]);
}

// ─── Conteúdos de demonstração ───────────────────────────────────────────────
//
// O que rola é conteúdo de quem consome — a fábrica não o inventa. Cada bloco
// abaixo é escrito com DOM curto ou com fábricas do design system, nunca com o
// `buildList`/`buildMatrix` que só existe dentro do arquivo de story.

type Content = { imports: string[]; block: string; variavel: string };

function contentList(total: number): Content {
  return {
    imports: [],
    variavel: 'lista',
    block: `const lista = document.createElement('ul');
lista.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
lista.dataset.spacing = 'sm';
for (let i = 1; i <= ${total}; i++) {
  const item = document.createElement('li');
  item.className = 'nds-text-body nds-border-b-soft nds-pb-2';
  item.textContent = \`Item \${i}\`;
  lista.appendChild(item);
}`,
  };
}

function contentRow(total: number): Content {
  return {
    imports: [importing('card', 'createCard', 'createCardContent')],
    variavel: 'fileira',
    // `nds-row` e não `nds-cluster`: o cluster quebra linha, e sem transbordo não
    // há barra horizontal nenhuma. Os cartões não encolhem, e é a soma deles que
    // passa da largura da área.
    block: `const fileira = document.createElement('div');
fileira.className = 'nds-row nds-p-2';
fileira.dataset.spacing = 'md';
for (let i = 1; i <= ${total}; i++) {
  const cartao = createCard({ class: 'nds-shrink-0 nds-w-xs' });
  const conteudo = createCardContent();
  conteudo.textContent = \`Card \${i}\`;
  cartao.appendChild(conteudo);
  fileira.appendChild(cartao);
}`,
  };
}

function contentMatriz(lines: number, colunas: number): Content {
  return {
    imports: [],
    variavel: 'matriz',
    block: `const matriz = document.createElement('table');
matriz.className = 'nds-text-caption nds-border-collapse';
for (let l = 1; l <= ${lines}; l++) {
  const tr = document.createElement('tr');
  for (let c = 1; c <= ${colunas}; c++) {
    const td = document.createElement('td');
    // Sem quebra de linha na célula: é o que faz a tabela passar da largura da
    // área e nascer a barra horizontal.
    td.className = 'nds-border-default nds-py-2 nds-px-2 nds-whitespace-nowrap';
    td.textContent = \`L\${l}·C\${c}\`;
    tr.appendChild(td);
  }
  matriz.appendChild(tr);
}`,
  };
}

function contentLinks(total: number): Content {
  return {
    imports: [],
    variavel: 'navegacao',
    // A navegação tem nome próprio: dentro da área rolável ela continua sendo um
    // marco da página, e marco sem nome não é listado pelo leitor de tela.
    block: `const navegacao = document.createElement('nav');
navegacao.setAttribute('aria-label', 'Ações da conta');

const lista = document.createElement('ul');
lista.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
lista.dataset.spacing = 'xs';
for (let i = 1; i <= ${total}; i++) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = \`#acao-\${i}\`;
  link.className = 'nds-block nds-rounded-md nds-px-2 nds-py-1 nds-text-body nds-hover-bg-accent';
  link.textContent = \`Ação \${i}\`;
  item.appendChild(link);
  lista.appendChild(item);
}
navegacao.appendChild(lista);`,
  };
}

function contentBadges(total: number): Content {
  return {
    imports: [importing('badge', 'createBadge')],
    variavel: 'versoes',
    block: `const versoes = document.createElement('div');
versoes.className = 'nds-stack nds-p-2';
versoes.dataset.spacing = 'sm';
for (let i = 1; i <= ${total}; i++) {
  const linha = document.createElement('div');
  linha.className = 'nds-cluster nds-border-b-soft nds-pb-2';
  linha.dataset.justify = 'between';
  const nome = document.createElement('span');
  nome.className = 'nds-text-body';
  nome.textContent = \`v\${i}.0.0\`;
  linha.append(nome, createBadge({ variant: 'info', text: String(i * 12) }));
  versoes.appendChild(linha);
}`,
  };
}

function contentOf(o: ScrollAreaSnippetOptions): Content {
  const total = o.itemCount ?? 30;
  switch (o.content) {
    case 'fileira':
      return contentRow(o.itemCount ?? 15);
    case 'matriz':
      return contentMatriz(o.itemCount ?? 15, 12);
    case 'links':
      return contentLinks(o.itemCount ?? 20);
    case 'badges':
      return contentBadges(o.itemCount ?? 20);
    default:
      return contentList(total);
  }
}

// ─── Snippets ────────────────────────────────────────────────────────────────

/** A chamada real de `createScrollArea` com o conteúdo que a story mostra. */
export function scrollAreaSnippet(o: ScrollAreaSnippetOptions = {}): string {
  const content = contentOf(o);
  return snippet(
    [importing('scroll-area', 'createScrollArea'), ...content.imports].join('\n'),
    content.block,
    `const area = ${chamada('createScrollArea', areaLines(o, content.variavel))};`,
    montar('area'),
  );
}

/**
 * O par sem teto × com teto de altura.
 *
 * Forma própria porque o assunto da story é a AUSÊNCIA da opção: um snippet que
 * mostrasse só a chamada certa esconderia o erro de uso que ela documenta.
 */
export function scrollAreaNoLimitSnippet(o: ScrollAreaSnippetOptions = {}): string {
  const content = contentOf(o);
  return snippet(
    importing('scroll-area', 'createScrollArea'),
    content.block,
    `// Sem degrau de altura o conteúdo expande e NÃO há rolagem: sem teto não há
// transbordo. Sem nome também não há papel — região anônima não vira marco, e
// \`aria-label\` em elemento sem papel é atributo proibido.
const semTeto = ${chamada('createScrollArea', [
      `class: ${text(className(o))},`,
      `children: ${content.variavel},`,
    ])};`,
    `const comTeto = ${chamada('createScrollArea', areaLines({ ...o, size: o.size ?? 'sm' }, content.variavel))};`,
    `document.querySelector('#app')?.append(semTeto, comTeto);`,
  );
}

/**
 * A área rolável dentro de um Card.
 *
 * Forma própria porque a vizinhança É o assunto: o cabeçalho fica FORA da área,
 * senão o título rola junto e quem lê perde a referência do que está vendo.
 */
export function scrollAreaEmCardSnippet(o: ScrollAreaSnippetOptions = {}): string {
  const content = contentOf(o);
  return snippet(
    [
      importing('scroll-area', 'createScrollArea'),
      importing(
        'card',
        'createCard',
        'createCardContent',
        'createCardDescription',
        'createCardHeader',
        'createCardTitle',
      ),
      ...content.imports,
    ].join('\n'),
    content.block,
    `const area = ${chamada('createScrollArea', areaLines(o, content.variavel))};`,
    `const cabecalho = createCardHeader();
cabecalho.append(
  createCardTitle({ text: 'Histórico de atividades' }),
  createCardDescription({ text: 'Últimas ações do usuário' }),
);`,
    `const corpo = createCardContent({ class: 'nds-p-0' });
corpo.appendChild(area);`,
    `const cartao = createCard({ class: 'nds-w-md' });
// O cabeçalho fica FORA da área rolável: ele é a referência do que rola.
cartao.append(cabecalho, corpo);`,
    montar('cartao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na lista vertical, que é o uso
 * canônico do componente.
 */
export const scrollAreaSource: SourceTransform<ScrollAreaSnippetOptions> = (_gerado, ctx) =>
  scrollAreaSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function scrollAreaSourceWith(
  fixas: ScrollAreaSnippetOptions,
): SourceTransform<ScrollAreaSnippetOptions> {
  return (_gerado, ctx) => scrollAreaSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o par sem teto × com teto. */
export function scrollAreaSourceNoLimit(
  fixas: ScrollAreaSnippetOptions = {},
): SourceTransform<ScrollAreaSnippetOptions> {
  return (_gerado, ctx) => scrollAreaNoLimitSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a área dentro de um Card. */
export function scrollAreaSourceEmCard(
  fixas: ScrollAreaSnippetOptions = {},
): SourceTransform<ScrollAreaSnippetOptions> {
  return (_gerado, ctx) => scrollAreaEmCardSnippet({ ...ctx.args, ...fixas });
}
