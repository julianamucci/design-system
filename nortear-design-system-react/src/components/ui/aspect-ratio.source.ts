/**
 * Transforms do painel Code do AspectRatio.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * Duas coisas o painel imprimia e ninguém consegue colar: o `ImageWithFallback`
 * — que vive em `components/figma/` e é andaime das stories, não peça do design
 * system — e o `ratio` já resolvido em ponto flutuante (`1.7777777777777777`).
 * Quem lê a documentação escreve `16 / 9`.
 */
import { jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type AspectRatioArgs = {
  /** Largura dividida pela altura. */
  ratio: number;
};

const IMPORT = 'import { AspectRatio } from "@/components/ui/aspect-ratio";';

/**
 * Proporções canônicas do design system, com a fração que o leitor escreve.
 *
 * O control entrega o número já dividido; imprimir `ratio={1.7777777777777777}`
 * é tecnicamente equivalente e ilegível — e some a informação de que 16/9 é um
 * preset documentado, e não um número qualquer.
 */
const RATIOS_CANONICOS: ReadonlyArray<readonly [string, number]> = [
  ['16 / 9', 16 / 9],
  ['4 / 3', 4 / 3],
  ['1', 1],
  ['3 / 4', 3 / 4],
  ['21 / 9', 21 / 9],
];

/** Expressão do `ratio` para o snippet. Valor fora dos presets vira decimal curto. */
export function ratioExpr(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '16 / 9';
  const canonico = RATIOS_CANONICOS.find(([, n]) => Math.abs(n - value) < 0.005);
  if (canonico) return canonico[0];
  return String(Number(value.toFixed(3)));
}

/**
 * A caixa com uma imagem dentro — o uso que a documentação chama de canônico.
 *
 * Sem largura no exemplo de propósito: `.nds-aspect-ratio` já é `width: 100%` e
 * tira a altura da proporção, então quem define a largura é o contêiner de
 * quem cola. As stories embrulham num `div` de 480px só para a captura ficar
 * estável, e esse `div` não faz parte do componente.
 *
 * `object-fit` fica no FILHO, e o raio também: a folha do design system estica
 * o filho até os quatro cantos (`inset: 0`), mas não decide como a mídia
 * preenche esse espaço — é a guideline item2 pedindo `cover` para não distorcer,
 * e a item3 pedindo o raio na mídia visível, nunca no contêiner.
 */
function withImage(ratio: string, src: string, alt: string): string {
  return jsxSnippet(
    IMPORT,
    `<AspectRatio ratio={${ratio}}>
  <img
    src="${src}"
    alt="${alt}"
    loading="lazy"
    decoding="async"
    className="nds-rounded-md"
    style={{ objectFit: "cover" }}
  />
</AspectRatio>`,
  );
}

/**
 * Transform do `meta` — cascateia para as stories dos três arquivos.
 *
 * Lê o control `ratio` do Playground; nos arquivos que desligam os controls cai
 * no 16/9, que é o preset padrão do componente e o valor do `meta` daqueles
 * arquivos. Cada proporção que difere disso declara a sua própria transform.
 */
export const aspectRatioSource: SourceTransform<AspectRatioArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return withImage(ratioExpr(args.ratio), '/midia/paisagem-entardecer.jpg', 'Paisagem ao entardecer');
};

/** 4/3 — proporção de foto de produto. */
export function aspectRatioQuatroTercosSource(): string {
  return withImage('4 / 3', '/midia/tenis-de-corrida.jpg', 'Tênis de corrida');
}

/** 1/1 — quadrado, para miniatura e foto de pessoa. */
export function aspectRatioQuadradoSource(): string {
  return withImage('1', '/midia/retrato-maria-silva.jpg', 'Retrato de Maria Silva');
}

/** 3/4 — retrato vertical, para capa e pôster. */
export function aspectRatioTresQuartosSource(): string {
  return withImage('3 / 4', '/midia/capa-vertical.jpg', 'Capa de retrato vertical');
}

/** 21/9 — panorâmica, para faixa de topo e cinematográfico. */
export function aspectRatioUltraWideSource(): string {
  return withImage('21 / 9', '/midia/cordilheira.jpg', 'Panorâmica da cordilheira');
}

/**
 * Imagem decorativa: `alt=""` é o que a tira da árvore de acessibilidade. A
 * string vazia é o assunto da story — OMITIR o atributo faz o leitor de tela
 * anunciar o nome do arquivo, que é o oposto do pretendido.
 */
export function aspectRatioImageDecorativaSource(): string {
  return withImage('16 / 9', '/midia/textura-de-fundo.jpg', '');
}

/**
 * Iframe: o `title` é o nome acessível do quadro embutido (WCAG 4.1.2). Sem
 * ele o leitor de tela anuncia só "quadro". `border: 0` some a moldura padrão
 * do navegador — mecânica, não decisão de tema.
 */
export function aspectRatioWithIframeSource(): string {
  return jsxSnippet(
    IMPORT,
    `<AspectRatio ratio={16 / 9}>
  <iframe
    title="Mapa do escritório em São Paulo"
    src="https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.57%2C-46.62%2C-23.54"
    className="nds-rounded-md"
    style={{ border: 0 }}
    loading="lazy"
  />
</AspectRatio>`,
  );
}

/**
 * Vídeo: a faixa de legendas é requisito (WCAG 1.2.2), e `controls` é o que
 * torna a mídia alcançável pelo teclado. O texto solto no fim é a mensagem
 * para navegador sem suporte à tag.
 */
export function aspectRatioWithVideoSource(): string {
  return jsxSnippet(
    IMPORT,
    `<AspectRatio ratio={16 / 9}>
  <video
    controls
    preload="metadata"
    className="nds-rounded-md nds-bg-muted"
    style={{ objectFit: "cover" }}
    aria-label="Vídeo institucional"
  >
    <source src="/midia/institucional.mp4" type="video/mp4" />
    <track
      kind="captions"
      src="/midia/institucional.pt-BR.vtt"
      srcLang="pt-BR"
      label="Português"
      default
    />
    Seu navegador não suporta a tag de vídeo.
  </video>
</AspectRatio>`,
  );
}

/**
 * Caixa vazia: sem mídia dentro, o espaço já está reservado na proporção — é o
 * que evita o salto de layout quando o conteúdo termina de carregar. O
 * `role="img"` com rótulo dá voz ao espaço reservado enquanto ele é o que está
 * na tela.
 */
export function aspectRatioPlaceholderSource(): string {
  return jsxSnippet(
    IMPORT,
    `<AspectRatio ratio={16 / 9}>
  <div
    className="nds-cluster nds-bg-muted nds-rounded-md nds-text-body nds-text-muted-foreground"
    data-align="center"
    data-justify="center"
    role="img"
    aria-label="Conteúdo carregando"
  >
    Carregando…
  </div>
</AspectRatio>`,
  );
}

/**
 * Em grade: a proporção é a mesma em todos os itens, e a largura de cada
 * célula é diferente — é isso que prova que a altura é RECALCULADA a partir da
 * largura, e não fixada. Sem o AspectRatio, imagens de dimensões variáveis
 * deixam a listagem com alturas desiguais.
 */
export function gridAspectRatioSource(): string {
  return jsxSnippet(
    `${IMPORT}

const itens = [
  { src: "/midia/paisagem-entardecer.jpg", alt: "Paisagem ao entardecer" },
  { src: "/midia/tenis-de-corrida.jpg", alt: "Tênis de corrida" },
  { src: "/midia/retrato-maria-silva.jpg", alt: "Retrato de Maria Silva" },
];`,
    `<div className="nds-grid nds-sm-grid-3" data-spacing="md">
  {itens.map((item) => (
    <div key={item.src} className="nds-stack" data-spacing="sm">
      <AspectRatio ratio={4 / 3}>
        <img
          src={item.src}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          className="nds-rounded-md"
          style={{ objectFit: "cover" }}
        />
      </AspectRatio>
      <p className="nds-text-body nds-font-medium">{item.alt}</p>
    </div>
  ))}
</div>`,
  );
}
