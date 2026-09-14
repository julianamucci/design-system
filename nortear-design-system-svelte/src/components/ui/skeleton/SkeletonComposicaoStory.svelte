<script lang="ts">
  import { Skeleton, SkeletonRegion } from './index';
  import { AspectRatio } from '@/components/ui/aspect-ratio';

  type Variant = 'cardDePerfil' | 'listaComAvatar' | 'imagemEmAspectRatio' | 'paragrafo';

  interface Props {
    variant?: Variant;
  }

  let { variant = 'cardDePerfil' }: Props = $props();
</script>

{#if variant === 'cardDePerfil'}
  <SkeletonRegion
    label="Carregando card de perfil"
    class="nds-cluster nds-p-4 nds-border-default nds-rounded-md nds-w-sm"
    data-align="center"
    data-spacing="md"
  >
    <Skeleton data-shape="avatar" />
    <div class="nds-stack nds-flex-1" data-spacing="sm">
      <Skeleton data-shape="text" data-width="2-3" />
      <Skeleton data-shape="text" data-width="1-2" />
    </div>
  </SkeletonRegion>
{:else if variant === 'listaComAvatar'}
  <!-- A região é a peça em volta; a `<ul>` fica dentro, sem estado nem nome.
       `role="list"` devolve a semântica de lista que o `list-style: none` tira
       no WebKit. -->
  <SkeletonRegion label="Carregando lista de pedidos" class="nds-w-md">
    <ul role="list" class="nds-stack nds-list-none nds-p-0" data-spacing="md">
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
  </SkeletonRegion>
{:else if variant === 'imagemEmAspectRatio'}
  <SkeletonRegion label="Carregando imagem" class="nds-w-sm">
    <AspectRatio ratio={16 / 9}>
      <Skeleton data-shape="fill" />
    </AspectRatio>
  </SkeletonRegion>
{:else if variant === 'paragrafo'}
  <SkeletonRegion label="Carregando parágrafo" class="nds-stack nds-w-sm" data-spacing="sm">
    <Skeleton data-shape="text" data-width="full" />
    <Skeleton data-shape="text" data-width="3-4" />
    <Skeleton data-shape="text" data-width="1-2" />
  </SkeletonRegion>
{/if}
