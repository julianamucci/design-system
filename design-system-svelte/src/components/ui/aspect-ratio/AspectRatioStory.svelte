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

<div class="{width} nds-w-full {className}">
  <AspectRatio {ratio}>
    {#if child === 'img'}
      <img src={src} alt={alt} loading="lazy" decoding="async" class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover" />
    {:else if child === 'iframe'}
      <iframe
        {src}
        {title}
        class="nds-w-full nds-rounded-md border-0" style="height: 100%"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    {:else if child === 'video'}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video
        {src}
        poster={poster || undefined}
        controls
        class="nds-w-full nds-rounded-md nds-bg-muted" style="height: 100%; object-fit: cover"
      ></video>
    {:else}
      <div class="nds-cluster nds-w-full nds-rounded-md nds-bg-muted nds-text-muted-foreground nds-text-body" data-align="center" data-justify="center" style="height: 100%">
        {label}
      </div>
    {/if}
  </AspectRatio>
</div>
