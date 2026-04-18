<script lang="ts">
  import type { Snippet } from 'svelte';

  interface DocsVariantItem {
    name: string;
    description: string;
    preview: Snippet;
  }

  const { title, items }: { title: string; items: DocsVariantItem[] } = $props();
</script>

<section id="variantes">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each items as item}
      <div class="border rounded-xl p-5 shadow-sm space-y-3 bg-card">
        <div class="flex items-center justify-center min-h-[60px]">
          {@render item.preview()}
        </div>
        <div>
          <p class="text-sm font-semibold">{item.name}</p>
          <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
        </div>
      </div>
    {/each}
  </div>
</section>
