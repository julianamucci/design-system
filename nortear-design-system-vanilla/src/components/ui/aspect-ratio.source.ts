// Snippet do painel Code do AspectRatio — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** O filho que a story coloca dentro da caixa. */
export type AspectRatioContent = 'image' | 'iframe' | 'video' | 'none';

export type AspectRatioSnippetOptions = {
  ratio?: number;
  content?: AspectRatioContent;
  imageUrl?: string;
  /**
   * Nome acessível do filho: `alt` na imagem, `title` no iframe, `aria-label` no
   * vídeo. String vazia é imagem decorativa — e é diferente de não ter o atributo.
   */
  alt?: string;
  className?: string;
};

/**
 * A proporção como se escreve, e não como o número sai.
 *
 * `16 / 9` chega à fábrica como 1.7777777777777777, e um snippet com essa dízima
 * ensinaria a copiar o resultado da conta em vez da conta. As proporções da
 * folha de estilo entram pela fração; qualquer outra sai como o control a
 * entregou, sem arredondar (arredondar mudaria a caixa).
 */
const FRACOES: ReadonlyArray<[number, string]> = [
  [21 / 9, '21 / 9'],
  [16 / 9, '16 / 9'],
  [3 / 2, '3 / 2'],
  [4 / 3, '4 / 3'],
  [1, '1'],
  [3 / 4, '3 / 4'],
  [2 / 3, '2 / 3'],
  [9 / 16, '9 / 16'],
];

export function ratioExpressao(ratio: number): string {
  const fraction = FRACOES.find(([value]) => Math.abs(value - ratio) < 1e-9);
  return fraction ? fraction[1] : String(ratio);
}

const IMAGE_DEFAULT = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80';
const ALT_DEFAULT = 'Paisagem montanhosa ao entardecer';

/**
 * O filho, montado com DOM cru curto.
 *
 * `.nds-aspect-ratio > *` já estica o filho para a caixa inteira — largura,
 * altura e posição saem da folha. O que sobra para quem consome é o recorte
 * (`object-fit`, que não tem utilitária) e o arredondamento, por classe.
 */
function contentBlock(o: AspectRatioSnippetOptions): { name: string; code: string } | null {
  const alt = o.alt ?? ALT_DEFAULT;

  if (o.content === 'iframe') {
    return {
      name: 'mapa',
      code: `const mapa = document.createElement('iframe');
mapa.src = 'https://www.openstreetmap.org/export/embed.html';
mapa.title = ${text(alt)};
mapa.loading = 'lazy';
mapa.className = 'nds-rounded-md';`,
    };
  }

  if (o.content === 'video') {
    return {
      name: 'video',
      code: `const video = document.createElement('video');
video.controls = true;
video.poster = ${text(o.imageUrl ?? IMAGE_DEFAULT)};
video.setAttribute('aria-label', ${text(alt)});
video.className = 'nds-rounded-md';
video.style.objectFit = 'cover';

const legenda = document.createElement('track');
legenda.kind = 'captions';
legenda.src = '/legendas/demonstracao.vtt';
legenda.srclang = 'pt-BR';
legenda.label = 'Português';
legenda.default = true;
video.appendChild(legenda);`,
    };
  }

  if (o.content === 'none') return null;

  return {
    name: 'imagem',
    code: `const imagem = document.createElement('img');
imagem.src = ${text(o.imageUrl ?? IMAGE_DEFAULT)};
imagem.alt = ${text(alt)};
imagem.loading = 'lazy';
imagem.className = 'nds-rounded-md';
imagem.style.objectFit = 'cover';`,
  };
}

/** A chamada real de `createAspectRatio` com o filho que a story mostra. */
export function aspectRatioSnippet(o: AspectRatioSnippetOptions = {}): string {
  const ratio = o.ratio ?? 16 / 9;
  const content = contentBlock(o);

  const lines = options([
    // `1` é o padrão da fábrica (quadrado): só a proporção diferente entra.
    ['ratio', ratio === 1 ? undefined : ratioExpressao(ratio)],
    ['content', content?.name],
    ['className', o.className ? text(o.className) : undefined],
  ]);

  return snippet(
    importing('aspect-ratio', 'createAspectRatio'),
    content?.code,
    `const caixa = ${chamada('createAspectRatio', lines)};`,
    montar('caixa'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground (proporção, imagem e texto alternativo).
 */
export const aspectRatioSource: SourceTransform<AspectRatioSnippetOptions> = (_gerado, ctx) =>
  aspectRatioSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function aspectRatioSourceWith(
  fixas: AspectRatioSnippetOptions,
): SourceTransform<AspectRatioSnippetOptions> {
  return (_gerado, ctx) => aspectRatioSnippet({ ...ctx.args, ...fixas });
}
