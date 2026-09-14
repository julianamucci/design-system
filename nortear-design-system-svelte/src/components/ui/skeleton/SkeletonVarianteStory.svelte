<script lang="ts">
  import { Skeleton, SkeletonRegion } from './index';

  type Variant = 'rectangle' | 'circle' | 'textLine';

  interface Props {
    variant?: Variant;
  }

  let { variant = 'rectangle' }: Props = $props();
</script>

{#if variant === 'rectangle'}
  <SkeletonRegion label="Carregando bloco" class="nds-w-sm">
    <Skeleton data-shape="fill" class="nds-docs-skeleton-media" />
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
