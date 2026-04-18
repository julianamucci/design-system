<script lang="ts">
  interface DocsRelatedItem { name: string; description: string; path: string }

  const { title, items }: { title: string; items: DocsRelatedItem[] } = $props();

  function navigate(path: string) {
    (window.top ?? window).location.href = path;
  }
</script>

<section id="relacionados">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each items as item}
      <button
        type="button"
        class="text-left border rounded-xl p-4 shadow-sm bg-card hover:bg-muted/50 transition-colors space-y-1 cursor-pointer"
        onclick={() => navigate(item.path)}
      >
        <p class="text-sm font-semibold text-primary">{item.name}</p>
        <p class="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
      </button>
    {/each}
  </div>
</section>
