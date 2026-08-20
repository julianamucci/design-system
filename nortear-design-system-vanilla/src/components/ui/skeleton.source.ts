// Snippet do painel Code do Skeleton — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { SkeletonShape, SkeletonSize, SkeletonWidth } from './skeleton';

/** Uma peça de esqueleto — as chaves são as da `SkeletonOptions`. */
export type SkeletonPeca = {
  shape?: SkeletonShape;
  width?: SkeletonWidth;
  size?: SkeletonSize;
  className?: string;
};

export type SkeletonSnippetOptions = SkeletonPeca & {
  /** Nome da região que anuncia o carregamento. */
  regionLabel?: string;
  /** Estado da região. `false` mostra o carregamento já concluído. */
  loading?: boolean;
  /** Várias peças empilhadas. Sem isto, a região leva uma só. */
  linhas?: SkeletonPeca[];
};

/** `createSkeleton(…)` em uma linha — a peça é sempre item de uma lista. */
function chamadaDaPeca(p: SkeletonPeca): string {
  const pares = opcoes([
    // A fábrica não assume forma nem largura: sem atributo, a folha aplica a
    // caixa base. Só entra o que a story declara.
    ['shape', p.shape ? texto(p.shape) : undefined],
    ['width', p.width ? texto(p.width) : undefined],
    ['size', p.size ? texto(p.size) : undefined],
    ['className', p.className ? texto(p.className) : undefined],
  ])
    .map((linha) => linha.replace(/,$/, ''))
    .join(', ');
  return pares ? `createSkeleton({ ${pares} })` : 'createSkeleton()';
}

/**
 * A região que anuncia o carregamento.
 *
 * Ela faz parte do uso, não do andaime: o esqueleto nasce `aria-hidden` de
 * fábrica — um bloco cinza pulsando não é conteúdo —, e quem diz que a tela está
 * carregando é a região que o contém. `aria-busy` sozinho num `div` sem papel
 * não é anunciado, e `aria-label` em `div` sem papel é atributo proibido: o par
 * papel + nome é o que faz o leitor dizer "carregando".
 */
function regiao(o: SkeletonSnippetOptions, classe?: string, spacing?: string): string {
  return `const regiao = document.createElement('div');
${classe ? `regiao.className = ${texto(classe)};\n` : ''}${spacing ? `regiao.dataset.spacing = ${texto(spacing)};\n` : ''}regiao.setAttribute('role', 'status');
regiao.setAttribute('aria-busy', ${texto(String(o.loading ?? true))});
regiao.setAttribute('aria-label', ${texto(o.regionLabel ?? 'Carregando conteúdo')});`;
}

/** A chamada real de `createSkeleton` dentro da região que a anuncia. */
export function skeletonSnippet(o: SkeletonSnippetOptions = {}): string {
  // `fill` preenche a caixa que o CONTAINER estabelece: sozinho ele nasce com
  // altura zero, e um snippet que o mostrasse solto ensinaria um esqueleto
  // invisível. Quem dá a caixa é a proporção.
  if (!o.linhas && o.shape === 'fill') return skeletonEmProporcaoSnippet(o);

  const pecas = o.linhas ?? [
    {
      shape: o.shape,
      // A fração de largura só vale para as formas de texto — nas outras a caixa
      // vem da forma, e o atributo não teria efeito nenhum.
      width: o.shape === 'text' || o.shape === 'heading' ? o.width : undefined,
      size: o.size,
      className: o.className,
    },
  ];
  const empilhado = pecas.length > 1;

  return snippet(
    importar('skeleton', 'createSkeleton'),
    regiao(o, empilhado ? 'nds-stack nds-w-sm' : undefined, empilhado ? 'sm' : undefined),
    pecas.length === 1
      ? `regiao.appendChild(${chamadaDaPeca(pecas[0])});`
      : `regiao.append(\n${pecas.map((p) => `  ${chamadaDaPeca(p)},`).join('\n')}\n);`,
    montar('regiao'),
  );
}

/**
 * Avatar mais duas linhas — o carregamento de um card de perfil.
 *
 * Forma própria porque o arranjo É o assunto: a peça redonda ao lado do bloco de
 * linhas, e as linhas com larguras diferentes, que é o que faz o placeholder
 * parecer um perfil e não três barras iguais.
 */
export function skeletonPerfilSnippet(o: SkeletonSnippetOptions = {}): string {
  return snippet(
    importar('skeleton', 'createSkeleton'),
    regiao(
      { ...o, regionLabel: o.regionLabel ?? 'Carregando card de perfil' },
      'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
      'md',
    ),
    `regiao.dataset.align = 'center';`,
    `const linhas = document.createElement('div');
linhas.className = 'nds-stack nds-flex-1';
linhas.dataset.spacing = 'sm';
linhas.append(
  ${chamadaDaPeca({ shape: 'text', width: '2-3' })},
  ${chamadaDaPeca({ shape: 'text', width: '1-2' })},
);`,
    `regiao.append(${chamadaDaPeca({ shape: 'avatar' })}, linhas);`,
    montar('regiao'),
  );
}

/**
 * Lista de itens carregando.
 *
 * Forma própria porque a região é a LISTA inteira: uma região viva por item
 * repetiria o mesmo aviso a cada linha.
 */
export function skeletonListaSnippet(o: SkeletonSnippetOptions = {}): string {
  const total = o.linhas?.length ?? 5;
  return snippet(
    importar('skeleton', 'createSkeleton'),
    `const lista = document.createElement('ul');
lista.className = 'nds-stack nds-list-none nds-p-0 nds-w-md';
lista.dataset.spacing = 'md';
// A lista inteira é UMA região ocupada: uma por item repetiria o aviso cinco
// vezes para quem usa leitor de tela.
lista.setAttribute('aria-busy', 'true');
lista.setAttribute('aria-label', ${texto(o.regionLabel ?? 'Carregando lista de pedidos')});`,
    `for (let i = 0; i < ${total}; i++) {
  const item = document.createElement('li');
  item.className = 'nds-cluster';
  item.dataset.align = 'center';
  item.dataset.spacing = 'sm';

  const linhas = document.createElement('div');
  linhas.className = 'nds-stack nds-flex-1';
  linhas.dataset.spacing = 'xs';
  linhas.append(
    ${chamadaDaPeca({ shape: 'text', width: '2-3' })},
    ${chamadaDaPeca({ shape: 'text', width: '1-3' })},
  );

  item.append(${chamadaDaPeca({ shape: 'avatar', size: 'sm' })}, linhas);
  lista.appendChild(item);
}`,
    montar('lista'),
  );
}

/**
 * Placeholder de mídia dentro de uma proporção.
 *
 * Forma própria porque `shape: 'fill'` preenche a caixa que o CONTAINER
 * estabelece — sozinho ele nasce com altura zero. Quem dá a caixa aqui é o
 * AspectRatio, e é isso que a composição ensina.
 */
export function skeletonEmProporcaoSnippet(o: SkeletonSnippetOptions = {}): string {
  return snippet(
    [importar('skeleton', 'createSkeleton'), importar('aspect-ratio', 'createAspectRatio')].join('\n'),
    regiao({ ...o, regionLabel: o.regionLabel ?? 'Carregando imagem' }, 'nds-w-sm'),
    `regiao.appendChild(
  ${chamada('createAspectRatio', opcoes([
    ['ratio', '16 / 9'],
    ['content', chamadaDaPeca({ shape: 'fill' })],
  ]))},
);`,
    montar('regiao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na peça de texto dentro da região.
 */
export const skeletonSource: SourceTransform<SkeletonSnippetOptions> = (_gerado, ctx) =>
  skeletonSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function skeletonSourceCom(
  fixas: SkeletonSnippetOptions,
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => skeletonSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o card de perfil. */
export function skeletonSourcePerfil(
  fixas: SkeletonSnippetOptions = {},
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => skeletonPerfilSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a lista de itens. */
export function skeletonSourceLista(
  fixas: SkeletonSnippetOptions = {},
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => skeletonListaSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o placeholder de mídia em proporção. */
export function skeletonSourceEmProporcao(
  fixas: SkeletonSnippetOptions = {},
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => skeletonEmProporcaoSnippet({ ...ctx.args, ...fixas });
}
