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
    class="flex items-center gap-4 w-80 rounded-md border p-4"
  >
    <Skeleton class="h-12 w-12 rounded-full motion-reduce:animate-none" aria-hidden="true" />
    <div class="space-y-2 flex-1">
      <Skeleton class="h-4 w-[180px] motion-reduce:animate-none" aria-hidden="true" />
      <Skeleton class="h-4 w-[140px] motion-reduce:animate-none" aria-hidden="true" />
    </div>
  </div>
{:else if variant === 'listaComAvatar'}
  <ul aria-busy="true" aria-label="Carregando lista de itens" class="space-y-3 w-80">
    {#each Array.from({ length: 5 }) as _, i (i)}
      <li class="flex items-center gap-3 rounded-md border p-3">
        <Skeleton class="h-10 w-10 rounded-full motion-reduce:animate-none" aria-hidden="true" />
        <div class="space-y-2 flex-1">
          <Skeleton class="h-3 w-[160px] motion-reduce:animate-none" aria-hidden="true" />
          <Skeleton class="h-3 w-[120px] motion-reduce:animate-none" aria-hidden="true" />
        </div>
      </li>
    {/each}
  </ul>
{:else if variant === 'imagemEmAspectRatio'}
  <div role="status" aria-busy="true" aria-label="Carregando imagem" class="w-80">
    <div class="relative w-full" style="aspect-ratio: 16 / 9;">
      <Skeleton class="absolute inset-0 h-full w-full motion-reduce:animate-none" aria-hidden="true" />
    </div>
  </div>
{:else if variant === 'paragrafo'}
  <div role="status" aria-busy="true" aria-label="Carregando parágrafo" class="space-y-2 w-80">
    <Skeleton class="h-3 w-full motion-reduce:animate-none" aria-hidden="true" />
    <Skeleton class="h-3 w-[90%] motion-reduce:animate-none" aria-hidden="true" />
    <Skeleton class="h-3 w-[75%] motion-reduce:animate-none" aria-hidden="true" />
  </div>
{/if}
