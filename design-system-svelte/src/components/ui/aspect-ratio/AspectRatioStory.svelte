<script lang="ts">
  import { AspectRatio } from './index';

  type ChildType = 'img' | 'iframe' | 'video' | 'placeholder';

  interface Props {
    ratio?: number;
    child?: ChildType;
    src?: string;
    alt?: string;
    title?: string;
    poster?: string;
    width?: string;
    class?: string;
    label?: string;
  }

  let {
    ratio = 16 / 9,
    child = 'img',
    src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt = 'Exemplo de imagem',
    title = 'Embedded content',
    poster = '',
    width = 'max-w-lg',
    class: className = '',
    label = '',
  }: Props = $props();
</script>

<div class="{width} w-full {className}">
  <AspectRatio {ratio}>
    {#if child === 'img'}
      <img src={src} alt={alt} loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
    {:else if child === 'iframe'}
      <iframe
        {src}
        {title}
        class="w-full h-full rounded-md border-0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    {:else if child === 'video'}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        {src}
        poster={poster || undefined}
        controls
        class="w-full h-full object-cover rounded-md bg-muted"
      ></video>
    {:else}
      <div class="w-full h-full flex items-center justify-center rounded-md bg-muted text-muted-foreground text-sm">
        {label}
      </div>
    {/if}
  </AspectRatio>
</div>
