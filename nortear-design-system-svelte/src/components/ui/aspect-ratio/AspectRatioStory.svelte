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
    width = 'nds-w-lg',
    class: className = '',
    label = '',
  }: Props = $props();
</script>

<!-- Classe por expressão, e não interpolação dentro do atributo: o auditor de
     classe morta lê o que está entre aspas como nome de classe literal. -->
<div class={`${width} ${className}`}>
  <AspectRatio {ratio}>
    {#if child === 'img'}
      <img src={src} alt={alt} loading="lazy" decoding="async" class="nds-w-full nds-rounded-md" style="height: 100%; object-fit: cover" />
    {:else if child === 'iframe'}
      <iframe
        {src}
        {title}
        class="nds-w-full nds-rounded-md" style="height: 100%; border: 0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    {:else if child === 'video'}
      <video
        {src}
        poster={poster || undefined}
        controls
        class="nds-w-full nds-rounded-md nds-bg-muted" style="height: 100%; object-fit: cover"
      >
        <!-- accessibility.item4 — o contrato pede faixa de legendas. Com o track
             real o svelte-ignore de a11y_media_has_caption deixou de ser preciso. -->
        <track kind="captions" src="data:text/vtt,WEBVTT%0A%0A00:00:00.000 --> 00:00:05.000%0AV%C3%ADdeo de demonstra%C3%A7%C3%A3o do AspectRatio" srclang="pt-BR" label="Português" default />
      </video>
    {:else}
      <div class="nds-cluster nds-w-full nds-rounded-md nds-bg-muted nds-text-muted-foreground nds-text-body" data-align="center" data-justify="center" style="height: 100%">
        {label}
      </div>
    {/if}
  </AspectRatio>
</div>
