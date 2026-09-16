<script lang="ts">
  import { Skeleton, SkeletonRegion } from './index';
  import { AspectRatio } from '@/components/ui/aspect-ratio';

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
</script>

<!-- `fill` não tem medida própria: preenche a caixa que o container estabelece, e
     quem a estabelece é o AspectRatio — o mesmo que o painel Code ensina e que a
     composição de imagem usa. A classe de proporção é da docs page, não API. -->
{#if shape === 'fill'}
  <SkeletonRegion label="Carregando conteúdo" class="nds-w-sm">
    <AspectRatio ratio={16 / 9}>
      <Skeleton data-shape="fill" />
    </AspectRatio>
  </SkeletonRegion>
{:else}
  <SkeletonRegion label="Carregando conteúdo">
    <Skeleton data-shape={shape} data-width={widthAplicada} />
  </SkeletonRegion>
{/if}
