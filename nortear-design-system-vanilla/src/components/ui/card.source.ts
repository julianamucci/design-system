// Snippet do painel Code do Card — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { CardSize } from './card';

/**
 * `import` de muitos nomes, quebrado em linhas. O Card é uma família de sete
 * fábricas, e a linha única passaria de 150 colunas num painel estreito.
 */
function multipleImporting(slug: string, names: string[]): string {
  return names.length <= 3
    ? importing(slug, ...names)
    : `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/${slug}';`;
}

/** O que as stories usam da família `Card*` e que o snippet precisa mostrar. */
export type CardSnippetOptions = {
  size?: CardSize;
  /** Nomes iguais aos args do Playground, para os controls fluírem sem tradução. */
  title?: string;
  description?: string;
  /** Valor em destaque, dentro do conteúdo. */
  price?: string;
  /** Rodapé com o par de ações. */
  showFooter?: boolean;
  /** Ação no cabeçalho — é ela que faz o header virar grid de duas colunas. */
  action?: boolean;
  /** Imagem como primeiro filho: o Card cede o respiro de cima e o raio a ela. */
  image?: boolean;
  /** Classes do consumidor no bloco raiz. */
  class?: string;
};

const TITLE_DEFAULT = 'Cadeira Gamer Pro';
const DESCRIPTION_DEFAULT = 'Estrutura ergonômica com ajuste de altura e apoio lombar.';
const PRECO_DEFAULT = 'R$ 1.299,00';
const WIDTH_DEFAULT = 'nds-w-sm';

/**
 * Os blocos do Card, na ordem do DOM.
 *
 * Separado do `montar` final porque a story do card clicável usa exatamente
 * estes blocos dentro de um `<a>` — e duplicá-los faria as duas descrições do
 * mesmo componente envelhecerem em ritmos diferentes.
 */
function partesDoCard(o: CardSnippetOptions): { names: string[]; blocks: string[] } {
  const title = o.title ?? TITLE_DEFAULT;
  const descricao = o.description ?? DESCRIPTION_DEFAULT;
  const preco = o.price ?? PRECO_DEFAULT;

  const names = [
    'createCard',
    'createCardHeader',
    'createCardTitle',
    'createCardDescription',
    'createCardContent',
  ];
  if (o.action) names.push('createCardAction');
  if (o.showFooter) names.push('createCardFooter');

  const root = callLine(
    'createCard',
    options([
      ['size', o.size && o.size !== 'default' ? text(o.size) : undefined],
      ['class', text(o.class ?? WIDTH_DEFAULT)],
    ]),
  );

  const blocks: string[] = [`const card = ${root};`];

  if (o.image) {
    blocks.push(
      `// Primeiro filho: o Card zera o próprio respiro de cima e arredonda o topo
// da imagem por CSS — não é preciso classe nenhuma nela para isso.
const foto = document.createElement('img');
foto.src = '/produtos/cadeira-gamer-pro.avif';
foto.alt = 'Cadeira Gamer Pro vista de frente, em fundo neutro';
foto.className = 'nds-w-full nds-aspect-16-9';
// Propriedade mecânica, não valor de design: é o recorte da foto dentro da
// proporção que a classe já fixou.
foto.style.objectFit = 'cover';`,
    );
  }

  const header = [
    'const cabecalho = createCardHeader();',
    'cabecalho.append(',
    `  createCardTitle({ text: ${text(title)} }),`,
    `  createCardDescription({ text: ${text(descricao)} }),`,
    ');',
  ];
  if (o.action) {
    header.push(
      '',
      '// A ação vive DENTRO do cabeçalho: a posição à direita vem da grid dele,',
      '// e não de uma classe própria.',
      'const acao = createCardAction();',
      'acao.appendChild(',
      `  createButton({`,
      `    variant: 'ghost',`,
      `    size: 'sm',`,
      `    label: 'Editar',`,
      `    'aria-label': ${text(`Editar produto ${title}`)},`,
      '  }),',
      ');',
      'cabecalho.appendChild(acao);',
    );
  }
  blocks.push(header.join('\n'));

  blocks.push(
    `const valor = document.createElement('p');
valor.className = 'nds-text-h4';
valor.textContent = ${text(preco)};

const conteudo = createCardContent();
conteudo.appendChild(valor);`,
  );

  if (o.showFooter) {
    blocks.push(
      `// O Card zera o próprio respiro de baixo quando o rodapé é filho DIRETO —
// um wrapper no meio mataria a regra sem mudar nada visível.
const rodape = createCardFooter({ class: 'nds-cluster' });
rodape.dataset.spacing = 'md';
rodape.dataset.justify = 'end';
rodape.append(
  createButton({
    variant: 'outline',
    label: 'Cancelar',
    'aria-label': ${text(`Cancelar edição de ${title}`)},
  }),
  createButton({
    label: 'Salvar',
    'aria-label': ${text(`Salvar alterações em ${title}`)},
  }),
);`,
    );
  }

  const assembly = ['card.append('];
  if (o.image) assembly.push('  foto,');
  assembly.push('  cabecalho,', '  conteudo,');
  if (o.showFooter) assembly.push('  rodape,');
  assembly.push(');');
  blocks.push(assembly.join('\n'));

  return { names, blocks };
}

/** A chamada real da família `createCard*` com as opções da story. */
export function cardSnippet(o: CardSnippetOptions = {}): string {
  const { names, blocks } = partesDoCard(o);
  const usaButton = Boolean(o.showFooter || o.action);

  return snippet(
    [
      multipleImporting('card', names),
      usaButton ? importing('button', 'createButton') : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    ...blocks,
    appendLine('card'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no cartão canônico.
 */
export const cardSource: SourceTransform<CardSnippetOptions> = (_gerado, ctx) =>
  cardSnippet(ctx.args ?? {});

/** Transform de story: mesma família, opções fixas que os controls não cobrem. */
export function cardSourceWith(fixas: CardSnippetOptions): SourceTransform<CardSnippetOptions> {
  return (_gerado, ctx) => cardSnippet({ ...ctx.args, ...fixas });
}

// ─── Card clicável ────────────────────────────────────────────────────────────

/**
 * Card inteiro como um destino só.
 *
 * O `<a>` de fora é quem carrega o nome acessível, o anel de foco e a ativação
 * por teclado — o Card raiz continua passivo. Handler de clique no Card daria
 * uma área clicável que o Tab não alcança e que o teclado não aciona.
 */
export function cardClickableSnippet(o: CardSnippetOptions = {}): string {
  const title = o.title ?? TITLE_DEFAULT;
  // O `<a>` é quem recebe a largura; o Card dentro dele preenche o que sobrar.
  const { names, blocks } = partesDoCard({ ...o, class: 'nds-w-full' });

  return snippet(
    [
      multipleImporting('card', names),
      o.showFooter || o.action ? importing('button', 'createButton') : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    ...blocks,
    `const destino = document.createElement('a');
destino.href = '/produtos/cadeira-gamer-pro';
destino.className = 'nds-block nds-w-sm nds-text-left nds-focus-ring nds-rounded-xl';
destino.setAttribute('aria-label', ${text(`Abrir detalhes do produto ${title}`)});
destino.appendChild(card);`,
    appendLine('destino'),
  );
}

/** Transform de story para o card clicável. */
export function cardClickableSourceWith(
  fixas: CardSnippetOptions = {},
): SourceTransform<CardSnippetOptions> {
  return (_gerado, ctx) => cardClickableSnippet({ ...ctx.args, ...fixas });
}
