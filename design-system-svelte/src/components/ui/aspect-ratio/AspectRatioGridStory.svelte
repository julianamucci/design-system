<script lang="ts">
  import { AspectRatio } from './index';

  const items = [
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60', alt: 'Paisagem 1' },
    { src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=60',  alt: 'Paisagem 2' },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=60', alt: 'Paisagem 3' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=60', alt: 'Paisagem 4' },
    { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=900&auto=format&fit=crop&q=60',  alt: 'Paisagem 5' },
    { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&auto=format&fit=crop&q=60',  alt: 'Paisagem 6' },
  ];
</script>

<div class="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-4">
  {#each items as item}
    <AspectRatio ratio={4 / 3}>
      <img src={item.src} alt={item.alt} loading="lazy" decoding="async" class="w-full h-full object-cover rounded-md" />
    </AspectRatio>
  {/each}
</div>
