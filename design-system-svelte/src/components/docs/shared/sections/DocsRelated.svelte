<script lang="ts">
  import { Button } from '@/components/ui/button';

  interface DocsRelatedItem { name: string; description: string; path: string }

  /**
   * DocsRelated — grid de componentes/páginas relacionadas.
   *
   * Quando `componentSlug` é informado, cada card recebe
   * `data-track="related"` + `data-track-id="{slug}:related:{item.name.slug}"`
   * + `data-track-label={item.name}`.
   */
  const { title, items, componentSlug }: {
    title: string;
    items: DocsRelatedItem[];
    componentSlug?: string;
  } = $props();

  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
  }

  function trackId(name: string): string | undefined {
    return componentSlug ? `${componentSlug}:related:${slugify(name)}` : undefined;
  }
</script>

<section id="relacionados">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each items as item}
      <Button
        variant="ghost"
        href={item.path}
        target="_top"
        class="text-left h-auto p-4 border bg-card hover:bg-muted/50 w-full flex-col items-start space-y-1 whitespace-normal"
        data-track="related"
        data-track-id={trackId(item.name)}
        data-track-label={item.name}
      >
        <p class="text-sm font-semibold text-primary">{item.name}</p>
        <p class="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
      </Button>
    {/each}
  </div>
</section>
