<script lang="ts">
  import { Skeleton } from './index';

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
    aria-label="Carregando perfil"
    class="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-align="center" data-spacing="md" style="width: 20rem"
  >
    <Skeleton class="nds-rounded-full motion-reduce:animate-none" style="height: 3rem; width: 3rem" aria-hidden="true" />
    <div class="nds-flex-1" data-spacing="sm">
      <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 180px" aria-hidden="true" />
      <Skeleton class="motion-reduce:animate-none" style="height: 1rem; width: 140px" aria-hidden="true" />
    </div>
  </div>
{:else if variant === 'listaComAvatar'}
  <ul aria-busy="true" aria-label="Carregando lista de itens" class="" data-spacing="sm" style="width: 20rem">
    {#each Array.from({ length: 5 }) as _, i (i)}
      <li class="nds-cluster nds-rounded-md nds-border-default" data-align="center" data-spacing="sm" style="padding: 0.75rem">
        <Skeleton class="nds-rounded-full motion-reduce:animate-none" style="height: 2.5rem; width: 2.5rem" aria-hidden="true" />
        <div class="nds-flex-1" data-spacing="sm">
          <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 160px" aria-hidden="true" />
          <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 120px" aria-hidden="true" />
        </div>
      </li>
    {/each}
  </ul>
{:else if variant === 'imagemEmAspectRatio'}
  <div role="status" aria-busy="true" aria-label="Carregando imagem" class="nds-w-sm">
    <div class="nds-w-full" style="position: relative; aspect-ratio: 16 / 9;" >
      <Skeleton class="inset-0 nds-w-full motion-reduce:animate-none" style="position: absolute; height: 100%" aria-hidden="true" />
    </div>
  </div>
{:else if variant === 'paragrafo'}
  <div role="status" aria-busy="true" aria-label="Carregando parágrafo" class="" data-spacing="sm" style="width: 20rem">
    <Skeleton class="nds-w-full motion-reduce:animate-none" style="height: 0.75rem" aria-hidden="true" />
    <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 90%" aria-hidden="true" />
    <Skeleton class="motion-reduce:animate-none" style="height: 0.75rem; width: 75%" aria-hidden="true" />
  </div>
{/if}
