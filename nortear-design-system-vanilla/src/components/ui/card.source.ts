// Snippet do painel Code do Card — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { CardSize } from './card';

/**
 * `import` de muitos nomes, quebrado em linhas. O Card é uma família de sete
 * fábricas, e a linha única passaria de 150 colunas num painel estreito.
 */
function importarVarios(slug: string, nomes: string[]): string {
  return nomes.length <= 3
    ? importar(slug, ...nomes)
    : `import {\n${nomes.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/${slug}';`;
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

const TITULO_PADRAO = 'Cadeira Gamer Pro';
const DESCRICAO_PADRAO = 'Estrutura ergonômica com ajuste de altura e apoio lombar.';
const PRECO_PADRAO = 'R$ 1.299,00';
const LARGURA_PADRAO = 'nds-w-cap-sm';

/**
 * Os blocos do Card, na ordem do DOM.
 *
 * Separado do `montar` final porque a story do card clicável usa exatamente
 * estes blocos dentro de um `<a>` — e duplicá-los faria as duas descrições do
 * mesmo componente envelhecerem em ritmos diferentes.
 */
function partesDoCard(o: CardSnippetOptions): { nomes: string[]; blocos: string[] } {
  const titulo = o.title ?? TITULO_PADRAO;
  const descricao = o.description ?? DESCRICAO_PADRAO;
  const preco = o.price ?? PRECO_PADRAO;

  const nomes = [
    'createCard',
    'createCardHeader',
    'createCardTitle',
    'createCardDescription',
    'createCardContent',
  ];
  if (o.action) nomes.push('createCardAction');
  if (o.showFooter) nomes.push('createCardFooter');

  const raiz = chamada(
    'createCard',
    opcoes([
      ['size', o.size && o.size !== 'default' ? texto(o.size) : undefined],
      ['class', texto(o.class ?? LARGURA_PADRAO)],
    ]),
  );

  const blocos: string[] = [`const card = ${raiz};`];

  if (o.image) {
    blocos.push(
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

  const cabecalho = [
    'const cabecalho = createCardHeader();',
    'cabecalho.append(',
    `  createCardTitle({ text: ${texto(titulo)} }),`,
    `  createCardDescription({ text: ${texto(descricao)} }),`,
    ');',
  ];
  if (o.action) {
    cabecalho.push(
      '',
      '// A ação vive DENTRO do cabeçalho: a posição à direita vem da grid dele,',
      '// e não de uma classe própria.',
      'const acao = createCardAction();',
      'acao.appendChild(',
      `  createButton({`,
      `    variant: 'ghost',`,
      `    size: 'sm',`,
      `    label: 'Editar',`,
      `    'aria-label': ${texto(`Editar produto ${titulo}`)},`,
      '  }),',
      ');',
      'cabecalho.appendChild(acao);',
    );
  }
  blocos.push(cabecalho.join('\n'));

  blocos.push(
    `const valor = document.createElement('p');
valor.className = 'nds-text-h4';
valor.textContent = ${texto(preco)};

const conteudo = createCardContent();
conteudo.appendChild(valor);`,
  );

  if (o.showFooter) {
    blocos.push(
      `// O Card zera o próprio respiro de baixo quando o rodapé é filho DIRETO —
// um wrapper no meio mataria a regra sem mudar nada visível.
const rodape = createCardFooter({ class: 'nds-cluster' });
rodape.dataset.spacing = 'sm';
rodape.dataset.justify = 'end';
rodape.append(
  createButton({
    variant: 'outline',
    label: 'Cancelar',
    'aria-label': ${texto(`Cancelar edição de ${titulo}`)},
  }),
  createButton({
    label: 'Salvar',
    'aria-label': ${texto(`Salvar alterações em ${titulo}`)},
  }),
);`,
    );
  }

  const montagem = ['card.append('];
  if (o.image) montagem.push('  foto,');
  montagem.push('  cabecalho,', '  conteudo,');
  if (o.showFooter) montagem.push('  rodape,');
  montagem.push(');');
  blocos.push(montagem.join('\n'));

  return { nomes, blocos };
}

/** A chamada real da família `createCard*` com as opções da story. */
export function cardSnippet(o: CardSnippetOptions = {}): string {
  const { nomes, blocos } = partesDoCard(o);
  const usaBotao = Boolean(o.showFooter || o.action);

  return snippet(
    [
      importarVarios('card', nomes),
      usaBotao ? importar('button', 'createButton') : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    ...blocos,
    montar('card'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no cartão canônico.
 */
export const cardSource: SourceTransform<CardSnippetOptions> = (_gerado, ctx) =>
  cardSnippet(ctx.args ?? {});

/** Transform de story: mesma família, opções fixas que os controls não cobrem. */
export function cardSourceCom(fixas: CardSnippetOptions): SourceTransform<CardSnippetOptions> {
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
export function cardClicavelSnippet(o: CardSnippetOptions = {}): string {
  const titulo = o.title ?? TITULO_PADRAO;
  // O `<a>` é quem recebe a largura; o Card dentro dele preenche o que sobrar.
  const { nomes, blocos } = partesDoCard({ ...o, class: 'nds-w-full' });

  return snippet(
    [
      importarVarios('card', nomes),
      o.showFooter || o.action ? importar('button', 'createButton') : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    ...blocos,
    `const destino = document.createElement('a');
destino.href = '/produtos/cadeira-gamer-pro';
destino.className = 'nds-block nds-w-cap-sm nds-text-left nds-focus-ring nds-rounded-xl';
destino.setAttribute('aria-label', ${texto(`Abrir detalhes do produto ${titulo}`)});
destino.appendChild(card);`,
    montar('destino'),
  );
}

/** Transform de story para o card clicável. */
export function cardClicavelSourceCom(
  fixas: CardSnippetOptions = {},
): SourceTransform<CardSnippetOptions> {
  return (_gerado, ctx) => cardClicavelSnippet({ ...ctx.args, ...fixas });
}
