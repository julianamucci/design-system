// Snippet do painel Code do Skeleton — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { SkeletonShape, SkeletonSize, SkeletonWidth } from './skeleton';

/** Uma peça de esqueleto — as chaves são as da `SkeletonOptions`. */
export type SkeletonPart = {
  shape?: SkeletonShape;
  width?: SkeletonWidth;
  size?: SkeletonSize;
  className?: string;
};

export type SkeletonSnippetOptions = SkeletonPart & {
  /** Nome da região que anuncia o carregamento. */
  regionLabel?: string;
  /** Várias peças empilhadas. Sem isto, a região leva uma só. */
  lines?: SkeletonPart[];
};

/** `createSkeleton(…)` em uma linha — a peça é sempre item de uma lista. */
function partCall(p: SkeletonPart): string {
  const pairs = options([
    // A fábrica não assume forma nem largura: sem atributo, a folha aplica a
    // caixa base. Só entra o que a story declara.
    ['shape', p.shape ? text(p.shape) : undefined],
    ['width', p.width ? text(p.width) : undefined],
    ['size', p.size ? text(p.size) : undefined],
    ['className', p.className ? text(p.className) : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
    .join(', ');
  return pairs ? `createSkeleton({ ${pairs} })` : 'createSkeleton()';
}

/** Os dois imports que todo snippet desta família ensina. */
const IMPORT_SKELETON = importing('skeleton', 'createSkeleton', 'createSkeletonRegion');

/**
 * A região que anuncia o carregamento — pela PEÇA, nunca à mão.
 *
 * Ela faz parte do uso, não do andaime: o esqueleto nasce `aria-hidden` de
 * fábrica, e quem diz que a tela está carregando é a região que o contém. Papel,
 * estado e nome saem de `createSkeletonRegion`; o snippet não ensina
 * `setAttribute('role')` porque montar o trio à mão é justamente como as docs
 * pages divergiram em cinco formas. A região não alterna `aria-busy`: quando o
 * conteúdo chega, ela sai e o conteúdo entra no lugar dela.
 *
 * `children` recebe expressões já escritas; uma só vai sem colchetes.
 */
function regionBlock(
  label: string,
  children: string[],
  layout: { class?: string; spacing?: string; align?: string } = {},
): string {
  const childrenValue =
    children.length === 1
      ? children[0]
      : `[\n${children.map((c) => `    ${c},`).join('\n')}\n  ]`;
  const call = callLine('createSkeletonRegion', options([
    ['label', text(label)],
    ['class', layout.class ? text(layout.class) : undefined],
    ['children', childrenValue],
  ]));
  return [
    `const regiao = ${call};`,
    layout.spacing ? `regiao.dataset.spacing = ${text(layout.spacing)};` : '',
    layout.align ? `regiao.dataset.align = ${text(layout.align)};` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** A chamada real de `createSkeleton` dentro da região que a anuncia. */
export function skeletonSnippet(o: SkeletonSnippetOptions = {}): string {
  // `fill` preenche a caixa que o CONTAINER estabelece: sozinho ele nasce com
  // altura zero, e um snippet que o mostrasse solto ensinaria um esqueleto
  // invisível. Quem dá a caixa é a proporção.
  // O nome da região é o da story que pediu o snippet — no Playground,
  // "Carregando conteúdo", e não o padrão da composição de imagem.
  if (!o.lines && o.shape === 'fill') {
    return ratioSkeletonSnippet({ ...o, regionLabel: o.regionLabel ?? 'Carregando conteúdo' });
  }

  const parts = o.lines ?? [
    {
      shape: o.shape,
      // A fração de largura só vale para as formas de texto — nas outras a caixa
      // vem da forma, e o atributo não teria efeito nenhum.
      width: o.shape === 'text' || o.shape === 'heading' ? o.width : undefined,
      size: o.size,
      className: o.className,
    },
  ];
  const empilhado = parts.length > 1;

  return snippet(
    IMPORT_SKELETON,
    regionBlock(
      o.regionLabel ?? 'Carregando conteúdo',
      parts.map(partCall),
      empilhado ? { class: 'nds-stack nds-w-sm', spacing: 'sm' } : {},
    ),
    appendLine('regiao'),
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
    IMPORT_SKELETON,
    `const linhas = document.createElement('div');
linhas.className = 'nds-stack nds-flex-1';
linhas.dataset.spacing = 'sm';
linhas.append(
  ${partCall({ shape: 'text', width: '2-3' })},
  ${partCall({ shape: 'text', width: '1-2' })},
);`,
    regionBlock(
      o.regionLabel ?? 'Carregando card de perfil',
      [partCall({ shape: 'avatar' }), 'linhas'],
      {
        class: 'nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm',
        spacing: 'md',
        align: 'center',
      },
    ),
    appendLine('regiao'),
  );
}

/**
 * Lista de itens carregando.
 *
 * Forma própria porque a região embrulha a LISTA inteira: uma região viva por
 * item repetiria o mesmo aviso a cada linha. A `<ul>` fica DENTRO da peça e não
 * carrega estado nem nome — `role="list"` devolve a semântica de lista que
 * `list-style: none` tira em alguns leitores de tela.
 */
export function skeletonListSnippet(o: SkeletonSnippetOptions = {}): string {
  const total = o.lines?.length ?? 5;
  return snippet(
    IMPORT_SKELETON,
    `const lista = document.createElement('ul');
lista.className = 'nds-stack nds-list-none nds-p-0';
lista.dataset.spacing = 'md';
lista.setAttribute('role', 'list');`,
    `for (let i = 0; i < ${total}; i++) {
  const item = document.createElement('li');
  item.className = 'nds-cluster';
  item.dataset.align = 'center';
  item.dataset.spacing = 'sm';

  const linhas = document.createElement('div');
  linhas.className = 'nds-stack nds-flex-1';
  linhas.dataset.spacing = 'xs';
  linhas.append(
    ${partCall({ shape: 'text', width: '2-3' })},
    ${partCall({ shape: 'text', width: '1-3' })},
  );

  item.append(${partCall({ shape: 'avatar', size: 'sm' })}, linhas);
  lista.appendChild(item);
}`,
    regionBlock(o.regionLabel ?? 'Carregando lista de pedidos', ['lista'], { class: 'nds-w-md' }),
    appendLine('regiao'),
  );
}

/**
 * Placeholder de mídia dentro de uma proporção.
 *
 * Forma própria porque `shape: 'fill'` preenche a caixa que o CONTAINER
 * estabelece — sozinho ele nasce com altura zero. Quem dá a caixa aqui é o
 * AspectRatio, e é isso que a composição ensina.
 */
export function ratioSkeletonSnippet(o: SkeletonSnippetOptions = {}): string {
  return snippet(
    [IMPORT_SKELETON, importing('aspect-ratio', 'createAspectRatio')].join('\n'),
    `const midia = ${callLine('createAspectRatio', options([
      ['ratio', '16 / 9'],
      ['content', partCall({ shape: 'fill' })],
    ]))};`,
    regionBlock(o.regionLabel ?? 'Carregando imagem', ['midia'], { class: 'nds-w-sm' }),
    appendLine('regiao'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na peça de texto dentro da região.
 */
export const skeletonSource: SourceTransform<SkeletonSnippetOptions> = (_gerado, ctx) =>
  skeletonSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function skeletonSourceWith(
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
export function skeletonSourceList(
  fixas: SkeletonSnippetOptions = {},
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => skeletonListSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para o placeholder de mídia em proporção. */
export function ratioSkeletonSource(
  fixas: SkeletonSnippetOptions = {},
): SourceTransform<SkeletonSnippetOptions> {
  return (_gerado, ctx) => ratioSkeletonSnippet({ ...ctx.args, ...fixas });
}
