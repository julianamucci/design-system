/**
 * Transforms do painel Code do AspectRatio.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 */
import { svelteSnippet } from '@/lib/story-source';

export type AspectRatioArgs = {
  /** Proporção largura/altura. É o assunto do componente: vai sempre explícita. */
  ratio: number;
  /** Tipo de filho que a demonstração coloca dentro da caixa. */
  child: 'img' | 'iframe' | 'video' | 'placeholder';
  /** Texto alternativo da imagem. Vazio é o valor da imagem decorativa. */
  alt: string;
  /** Nome acessível do iframe. */
  title: string;
  /** Rótulo do bloco reservado, quando ainda não há mídia. */
  label: string;
  /** Classe de largura máxima do contêiner que envolve a caixa. */
  width: string;
};

const IMPORT = `import { AspectRatio } from "@/components/ui/aspect-ratio";`;

/** Razões canônicas do design system, escritas como fração para quem copia. */
const RAZOES: Array<[number, string]> = [
  [21 / 9, '21 / 9'],
  [16 / 9, '16 / 9'],
  [3 / 2, '3 / 2'],
  [4 / 3, '4 / 3'],
  [1, '1'],
  [3 / 4, '3 / 4'],
  [9 / 16, '9 / 16'],
];

/**
 * `1.7777777777777777` no snippet não ensina nada — `16 / 9` ensina. Valor fora
 * da tabela (o control é um número livre) sai arredondado.
 */
function proporcao(ratio: number): string {
  const conhecida = RAZOES.find(([valor]) => Math.abs(valor - ratio) < 0.005);
  return conhecida ? conhecida[1] : String(Number(ratio.toFixed(2)));
}

/**
 * O filho da caixa. `height: 100%` e `object-fit` são mecânicos — é assim que o
 * conteúdo cobre a caixa que a proporção reservou.
 */
function filho(args: Pick<AspectRatioArgs, 'child' | 'alt' | 'title' | 'label'>): string {
  switch (args.child) {
    case 'iframe':
      return `<iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66,-23.56,-46.62,-23.54"
      title="${args.title}"
      class="nds-w-full nds-rounded-md"
      style="height: 100%; border: 0"
      loading="lazy"
    ></iframe>`;
    case 'video':
      return `<video
      src="/midia/praia.mp4"
      poster="/midia/praia.jpg"
      controls
      class="nds-w-full nds-rounded-md nds-bg-muted"
      style="height: 100%; object-fit: cover"
    >
      <track
        kind="captions"
        src="/midia/praia.vtt"
        srclang="pt-BR"
        label="Português"
        default
      />
    </video>`;
    case 'placeholder':
      return `<div
      class="nds-cluster nds-w-full nds-rounded-md nds-bg-muted nds-text-muted-foreground nds-text-body"
      data-align="center"
      data-justify="center"
      style="height: 100%"
    >
      ${args.label}
    </div>`;
    default:
      return `<img
      src="/midia/paisagem.jpg"
      alt="${args.alt}"
      loading="lazy"
      decoding="async"
      class="nds-w-full nds-rounded-md"
      style="height: 100%; object-fit: cover"
    />`;
  }
}

/**
 * Forma canônica: a caixa reserva a proporção e o filho a cobre. Serve o
 * Playground, as cinco proporções e as composições por tipo de filho — todas
 * declaram o que muda em `args`.
 */
export function aspectRatioSource(
  _gerado?: string,
  ctx?: { args?: Partial<AspectRatioArgs> },
): string {
  const {
    ratio = 16 / 9,
    child = 'img',
    alt = 'Paisagem ao entardecer',
    title = 'Mapa do escritório',
    label = 'Carregando…',
    width = 'nds-w-cap-lg',
  } = ctx?.args ?? {};

  return svelteSnippet(
    IMPORT,
    `<div class="${width}">
  <AspectRatio ratio={${proporcao(ratio)}}>
    ${filho({ child, alt, title, label })}
  </AspectRatio>
</div>`,
  );
}

/**
 * Composição em grade: larguras diferentes, mesma proporção. É o que prova que
 * a altura é recalculada a partir da largura, e não fixada.
 */
export function aspectRatioEmGradeSource(): string {
  return svelteSnippet(
    `${IMPORT}

const imagens = [
  { src: "/midia/paisagem-1.jpg", alt: "Paisagem 1" },
  { src: "/midia/paisagem-2.jpg", alt: "Paisagem 2" },
  { src: "/midia/paisagem-3.jpg", alt: "Paisagem 3" },
];`,
    `<div
  class="nds-grid nds-w-cap-content nds-sm-grid-3"
  data-spacing="md"
  data-cols="2"
>
  {#each imagens as imagem (imagem.src)}
    <AspectRatio ratio={4 / 3}>
      <img
        src={imagem.src}
        alt={imagem.alt}
        loading="lazy"
        decoding="async"
        class="nds-w-full nds-rounded-md"
        style="height: 100%; object-fit: cover"
      />
    </AspectRatio>
  {/each}
</div>`,
  );
}
