/**
 * Transforms do painel Code do AspectRatio.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import { attrs, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type AspectRatioArgs = {
  ratio: number;
};

const IMPORT = `import { AspectRatio } from '@/components/ui/aspect-ratio'`;

/**
 * A caixa ocupa a largura INTEIRA do que está em volta e deriva a altura dela.
 * Sem um teto no elemento de fora não há do que derivar, e é por isso que todo
 * exemplo tem um contêiner com largura da escala.
 */
const WIDTH = 'nds-w-lg';

/**
 * As proporções escritas como fração, que é como se lê o pedido: `16 / 9`, e
 * não `1.7777777777777777`. O control entrega número, e o número cru no painel
 * ensina a copiar um decimal infinito.
 */
const PROPORCOES: Array<[number, string]> = [
  [21 / 9, '21 / 9'],
  [16 / 9, '16 / 9'],
  [3 / 2, '3 / 2'],
  [4 / 3, '4 / 3'],
  [1, '1'],
  [3 / 4, '3 / 4'],
  [2 / 3, '2 / 3'],
  [9 / 16, '9 / 16'],
];

export function ratioExpression(valor: number): string {
  const conhecida = PROPORCOES.find(([n]) => Math.abs(n - valor) < 0.005);
  return conhecida ? conhecida[1] : String(Math.round(valor * 100) / 100);
}

/**
 * Atributo da proporção — omitido no quadrado, que é o padrão do componente, e
 * omitido também quando o control não trouxe número.
 */
export function attrRatio(valor: unknown): string {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return '';
  if (Math.abs(valor - 1) < 0.005) return '';
  return `:ratio="${ratioExpression(valor)}"`;
}

/**
 * A caixa e o que está em volta dela.
 *
 * O filho NÃO precisa de largura nem de altura próprias: `.nds-aspect-ratio > *`
 * já o estica para cobrir a caixa inteira. Escrever as duas no exemplo ensinaria
 * a repetir o que o componente faz.
 */
function caixa(proporcao: string, filho: string, contexto = `class="${WIDTH}"`): string {
  return `<div ${contexto}>
  <AspectRatio${attrs(proporcao)}>
${indentar(filho, 4)}
  </AspectRatio>
</div>`;
}

/**
 * Imagem que cobre a caixa.
 *
 * `object-fit: cover` fica em `style` por falta de utilitária — o design system
 * não tem `.nds-object-cover`. É valor mecânico, não valor de design: não há
 * quantidade, tema nem densidade envolvidos.
 */
function image(src: string, alt: string): string {
  return `<img
  src="${src}"
  alt="${alt}"
  loading="lazy"
  decoding="async"
  class="nds-rounded-md"
  style="object-fit: cover"
/>`;
}

const FOTO_PAISAGEM =
  'https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=800&auto=format';
const FOTO_PRODUCT =
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format';
const FOTO_QUADRADA =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format';
const VERTICAL_FOTO =
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format';
const FOTO_PANORAMICA =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format';

/**
 * Forma canônica: a caixa reserva o espaço antes de a mídia chegar, e a mídia
 * a preenche. A proporção acompanha o control; o quadrado, que é o padrão, sai
 * sem atributo nenhum.
 */
export const aspectRatioSource: SourceTransform<AspectRatioArgs> = (_gerado, ctx) =>
  vueSnippet(
    IMPORT,
    caixa(attrRatio(ctx?.args?.ratio ?? 16 / 9), image(FOTO_PAISAGEM, 'Paisagem ao amanhecer')),
  );

/** Paisagem: a proporção de foto e de vídeo, e a mais comum em cabeçalho. */
export function aspectRatioDezesseisNoveSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(attrRatio(16 / 9), image(FOTO_PAISAGEM, 'Paisagem 16:9')),
  );
}

/** Produto: mais alta que a paisagem, para a foto de catálogo. */
export function aspectRatioQuatroTresSource(): string {
  return vueSnippet(IMPORT, caixa(attrRatio(4 / 3), image(FOTO_PRODUCT, 'Produto 4:3')));
}

/**
 * Quadrado: é o padrão do componente, e por isso o exemplo não escreve
 * proporção nenhuma. Escrevê-la ensinaria que ela é obrigatória.
 */
export function aspectRatioQuadradoSource(): string {
  return vueSnippet(IMPORT, caixa('', image(FOTO_QUADRADA, 'Avatar quadrado')));
}

/** Retrato: a proporção invertida, para capa e pôster. */
export function aspectRatioTresQuatroSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(attrRatio(3 / 4), image(VERTICAL_FOTO, 'Capa vertical 3:4')),
  );
}

/** Panorâmica: faixa larga e baixa, para cabeçalho de página. */
export function aspectRatioUltraWideSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(attrRatio(21 / 9), image(FOTO_PANORAMICA, 'Cabeçalho panorâmico 21:9')),
  );
}

/** Imagem informativa: o texto alternativo descreve o que a foto mostra. */
export function aspectRatioWithImageSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(
      attrRatio(16 / 9),
      image(FOTO_PAISAGEM, 'Paisagem ao amanhecer com montanhas e céu laranja'),
    ),
  );
}

/**
 * Mapa embutido: o quadro precisa de `title`, que é o nome acessível dele. Sem
 * o atributo o leitor de tela anuncia um quadro sem dizer de quê.
 */
export function aspectRatioWithIframeSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(
      attrRatio(16 / 9),
      `<iframe
  src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.56%2C-46.63%2C-23.54&layer=mapnik"
  title="Mapa do escritório em São Paulo"
  class="nds-rounded-md nds-border-default"
  loading="lazy"
></iframe>`,
    ),
  );
}

/**
 * Vídeo: `controls` é o que o torna alcançável pelo teclado, e a faixa de
 * legendas é o que o torna utilizável sem som.
 */
export function aspectRatioWithVideoSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(
      attrRatio(16 / 9),
      `<video
  controls
  class="nds-rounded-md"
  style="object-fit: cover"
  poster="${FOTO_PAISAGEM}"
>
  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
  <track kind="captions" src="/legendas/demonstracao.pt-BR.vtt" srclang="pt-BR" label="Português" default />
  Seu navegador não suporta vídeo.
</video>`,
    ),
  );
}

/**
 * Em grade: a largura de cada célula muda com a tela, e a altura de cada caixa
 * é recalculada a partir dela. É o que separa proporção de altura cravada.
 */
export function gridAspectRatioSource(): string {
  const fotos = [
    [FOTO_QUADRADA, 'Miniatura 1'],
    [FOTO_PRODUCT, 'Miniatura 2'],
    [VERTICAL_FOTO, 'Miniatura 3'],
    [FOTO_PANORAMICA, 'Miniatura 4'],
    [FOTO_PAISAGEM, 'Miniatura 5'],
    [FOTO_PRODUCT, 'Miniatura 6'],
  ];
  const celulas = fotos
    .map(([src, alt]) => `<AspectRatio>\n${indentar(image(src, alt))}\n</AspectRatio>`)
    .join('\n');
  return vueSnippet(
    IMPORT,
    `<div class="nds-grid nds-max-w-prose" data-spacing="md">
${indentar(celulas)}
</div>`,
  );
}

/**
 * Espaço reservado: a caixa segura o lugar antes de haver o que mostrar, e é
 * isso que impede o salto de layout quando a mídia chega.
 */
export function aspectRatioPlaceholderSource(): string {
  return vueSnippet(
    IMPORT,
    caixa(
      attrRatio(16 / 9),
      `<div
  class="nds-cluster nds-bg-muted nds-rounded-md nds-text-body nds-text-muted-foreground"
  data-align="center"
  data-justify="center"
  role="img"
  aria-label="Conteúdo carregando"
>
  Carregando…
</div>`,
    ),
  );
}

/**
 * Imagem decorativa: o texto alternativo fica VAZIO, e não ausente. Sem o
 * atributo o leitor de tela cai no nome do arquivo.
 */
export function aspectRatioDecorativaSource(): string {
  return vueSnippet(IMPORT, caixa(attrRatio(16 / 9), image(FOTO_PAISAGEM, '')));
}
