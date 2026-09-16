<script lang="ts">
  import { Skeleton, SkeletonRegion } from './index';
  import { AspectRatio } from '@/components/ui/aspect-ratio';

  type Variant = 'rectangle' | 'circle' | 'textLine';

  interface Props {
    variant?: Variant;
  }

  let { variant = 'rectangle' }: Props = $props();
</script>

{#if variant === 'rectangle'}
  <!-- Quem dá a caixa ao `fill` é o AspectRatio, e é ele que o painel ensina. -->
  <SkeletonRegion label="Carregando bloco" class="nds-w-sm">
    <AspectRatio ratio={16 / 9}>
      <Skeleton data-shape="fill" />
    </AspectRatio>
  </SkeletonRegion>
{:else if variant === 'circle'}
  <SkeletonRegion label="Carregando avatar">
    <Skeleton data-shape="avatar" />
  </SkeletonRegion>
{:else if variant === 'textLine'}
  <SkeletonRegion label="Carregando linhas de texto" class="nds-stack nds-w-sm" data-spacing="sm">
    <Skeleton data-shape="text" data-width="full" />
    <Skeleton data-shape="text" data-width="3-4" />
    <Skeleton data-shape="text" data-width="1-2" />
  </SkeletonRegion>
{/if}
