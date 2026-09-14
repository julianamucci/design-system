<script lang="ts">
  import { Skeleton, SkeletonRegion } from './index';

  // A caixa do esqueleto vem de atributo, não de classe de dimensão nem de
  // altura cravada: `data-shape` escolhe a forma e `data-width` a fração da
  // largura do container (docs/shared/styles/nds/skeleton.css).
  //
  // Sem control de "carregando": a região não alterna `aria-busy`. Quando o
  // conteúdo chega ela SAI, e o conteúdo entra no lugar (decisão da dona,
  // 2026-09-14).
  interface Props {
    shape?: 'text' | 'heading' | 'avatar' | 'fill';
    width?: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  }

  let { shape = 'text', width = '3-4' }: Props = $props();

  const widthAplicada = $derived(shape === 'text' || shape === 'heading' ? width : undefined);
  // `fill` preenche a caixa que o container estabelece; aqui quem estabelece é
  // a proporção de mídia, senão o bloco nasce com altura zero e o Playground
  // mostra um esqueleto invisível.
  const classNameAplicada = $derived(shape === 'fill' ? 'nds-docs-skeleton-media' : undefined);
</script>

<SkeletonRegion label="Carregando conteúdo">
  <Skeleton data-shape={shape} data-width={widthAplicada} class={classNameAplicada} />
</SkeletonRegion>
