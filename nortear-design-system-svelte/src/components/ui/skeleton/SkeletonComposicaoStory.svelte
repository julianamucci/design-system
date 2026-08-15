<script lang="ts">
  import { Skeleton } from './index';
  import { AspectRatio } from '@/components/ui/aspect-ratio';

  type Variant = 'cardDePerfil' | 'listaComAvatar' | 'imagemEmAspectRatio' | 'paragrafo';

  interface Props {
    variant?: Variant;
  }

  let { variant = 'cardDePerfil' }: Props = $props();
</script>

{#if variant === 'cardDePerfil'}
  <div
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
  </div>
{:else if variant === 'listaComAvatar'}
  <ul
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
  </ul>
{:else if variant === 'imagemEmAspectRatio'}
  <div role="status" aria-busy="true" aria-label="Carregando imagem" class="nds-w-sm">
    <AspectRatio ratio={16 / 9}>
      <Skeleton data-shape="fill" />
    </AspectRatio>
  </div>
{:else if variant === 'paragrafo'}
  <div
    role="status"
    aria-busy="true"
    aria-label="Carregando parágrafo"
    class="nds-stack nds-w-sm"
    data-spacing="sm"
  >
    <Skeleton data-shape="text" data-width="full" />
    <Skeleton data-shape="text" data-width="3-4" />
    <Skeleton data-shape="text" data-width="1-2" />
  </div>
{/if}
