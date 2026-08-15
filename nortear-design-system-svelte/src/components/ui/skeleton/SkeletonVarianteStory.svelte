<script lang="ts">
  import { Skeleton } from './index';

  type Variant = 'rectangle' | 'circle' | 'textLine';

  interface Props {
    variant?: Variant;
  }

  let { variant = 'rectangle' }: Props = $props();
</script>

{#if variant === 'rectangle'}
  <div role="status" aria-busy="true" aria-label="Carregando bloco" class="nds-w-sm">
    <Skeleton data-shape="fill" class="nds-docs-skeleton-media" />
  </div>
{:else if variant === 'circle'}
  <div role="status" aria-busy="true" aria-label="Carregando avatar">
    <Skeleton data-shape="avatar" />
  </div>
{:else if variant === 'textLine'}
  <div
    role="status"
    aria-busy="true"
    aria-label="Carregando linhas de texto"
    class="nds-stack nds-w-sm"
    data-spacing="sm"
  >
    <Skeleton data-shape="text" data-width="full" />
    <Skeleton data-shape="text" data-width="3-4" />
    <Skeleton data-shape="text" data-width="1-2" />
  </div>
{/if}
