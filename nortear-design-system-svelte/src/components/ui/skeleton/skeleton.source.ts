/**
 * Transforms do painel Code do Skeleton.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * A caixa do esqueleto vem de `data-shape` / `data-width`, nunca de altura
 * cravada — o snippet ensina o atributo, e não uma medida.
 */
import { svelteSnippet } from '@/lib/story-source';

export type SkeletonArgs = {
  shape: 'text' | 'heading' | 'avatar' | 'fill';
  width: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  loading: boolean;
};

const IMPORT = `import { Skeleton } from "@/components/ui/skeleton";`;

/**
 * Forma canônica (Playground): um placeholder dentro da região que anuncia o
 * carregamento. Quem fala com o leitor de tela é a região; o placeholder sai
 * de fábrica com `aria-hidden`.
 */
export function skeletonSource(_gerado?: string, ctx?: { args?: Partial<SkeletonArgs> }): string {
  const { shape = 'text', width = '3-4', loading = true } = ctx?.args ?? {};
  // `data-width` é fração da largura do container e só se aplica às formas de
  // texto: escrevê-lo em avatar ou fill ensinaria um atributo que não responde.
  const largura = shape === 'text' || shape === 'heading' ? ` data-width="${width}"` : '';

  return svelteSnippet(
    `${IMPORT}

let carregando = $state(${loading});`,
    `<div role="status" aria-busy={carregando} aria-label="Carregando conteúdo">
  <Skeleton data-shape="${shape}"${largura} />
</div>`,
  );
}

/** Variante Rectangle: `fill` preenche a caixa que o container estabelece. */
export function skeletonRetanguloSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div role="status" aria-busy="true" aria-label="Carregando bloco" class="nds-w-sm">
  <Skeleton data-shape="fill" />
</div>`,
  );
}

/** Variante Circle: o avatar é peça sem fluxo de texto, e a medida vem do tema. */
export function skeletonCirculoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div role="status" aria-busy="true" aria-label="Carregando avatar">
  <Skeleton data-shape="avatar" />
</div>`,
  );
}

/** Variante TextLine: larguras diferentes entre linhas é o que sugere texto. */
export function textSourceSkeletonLines(): string {
  return svelteSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando linhas de texto"
  class="nds-stack nds-w-sm"
  data-spacing="sm"
>
  <Skeleton data-shape="text" data-width="full" />
  <Skeleton data-shape="text" data-width="3-4" />
  <Skeleton data-shape="text" data-width="1-2" />
</div>`,
  );
}

/**
 * Estados Pulsing e ReducedMotion: a marcação é a mesma nos dois. O pulso e o
 * seu desligamento sob movimento reduzido vivem na folha do design system, não
 * em prop nenhuma — não há o que escrever aqui além do placeholder.
 */
export function skeletonStateSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando conteúdo"
  class="nds-stack nds-w-sm"
  data-spacing="sm"
>
  <Skeleton data-shape="text" data-width="full" />
  <Skeleton data-shape="text" data-width="3-4" />
</div>`,
  );
}

/** Composição ProfileCard: avatar ao lado de duas linhas de texto. */
export function skeletonCardDePerfilSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando card de perfil"
  class="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
  data-align="center"
  data-spacing="md"
>
  <Skeleton data-shape="avatar" />
  <div class="nds-stack nds-flex-1" data-spacing="sm">
    <Skeleton data-shape="text" data-width="2-3" />
    <Skeleton data-shape="text" data-width="1-2" />
  </div>
</div>`,
  );
}

/**
 * Composição ListWithAvatar: a lista inteira é UMA região ocupada, e não cinco.
 * O avatar compacto vem de `data-size`.
 */
export function skeletonListWithAvatarSource(): string {
  return svelteSnippet(
    IMPORT,
    `<ul
  aria-busy="true"
  aria-label="Carregando lista de pedidos"
  class="nds-stack nds-list-none nds-p-0 nds-w-md"
  data-spacing="md"
>
  {#each Array.from({ length: 5 }) as _, i (i)}
    <li class="nds-cluster" data-align="center" data-spacing="sm">
      <Skeleton data-shape="avatar" data-size="sm" />
      <div class="nds-stack nds-flex-1" data-spacing="xs">
        <Skeleton data-shape="text" data-width="2-3" />
        <Skeleton data-shape="text" data-width="1-3" />
      </div>
    </li>
  {/each}
</ul>`,
  );
}

/** Composição ImageInAspectRatio: quem estabelece a caixa é a proporção. */
export function skeletonImagemEmProporcaoSource(): string {
  return svelteSnippet(
    `${IMPORT}
import { AspectRatio } from "@/components/ui/aspect-ratio";`,
    `<div role="status" aria-busy="true" aria-label="Carregando imagem" class="nds-w-sm">
  <AspectRatio ratio={16 / 9}>
    <Skeleton data-shape="fill" />
  </AspectRatio>
</div>`,
  );
}

/** Composição Paragraph: três linhas de larguras decrescentes. */
export function skeletonParagrafoSource(): string {
  return svelteSnippet(
    IMPORT,
    `<div
  role="status"
  aria-busy="true"
  aria-label="Carregando parágrafo"
  class="nds-stack nds-w-sm"
  data-spacing="sm"
>
  <Skeleton data-shape="text" data-width="full" />
  <Skeleton data-shape="text" data-width="3-4" />
  <Skeleton data-shape="text" data-width="1-2" />
</div>`,
  );
}
