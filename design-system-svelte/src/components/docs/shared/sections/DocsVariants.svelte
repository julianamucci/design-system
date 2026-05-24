<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  interface DocsVariantItem {
    name: string;
    description: string;
    code?: string;
    preview: Snippet;
  }

  /**
   * DocsVariants — lista de variants.
   *
   * Quando `componentSlug` é informado, o botão "Ver código / Ocultar código"
   * de cada variant recebe `data-track="code"` +
   * `data-track-id="{slug}:code:{variant.name}"` +
   * `data-track-label="Copiar código"`.
   */
  const { title, items, id = 'variantes', componentSlug }: {
    title: string;
    items: DocsVariantItem[];
    id?: string;
    componentSlug?: string;
  } = $props();

  let openStates = $state<Record<number, boolean>>({});
  function toggleCode(i: number) {
    openStates[i] = !openStates[i];
  }

  function trackId(name: string): string | undefined {
    return componentSlug ? `${componentSlug}:code:${name}` : undefined;
  }
</script>

<section {id}>
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item, i}
      <Card class="p-4 gap-2">
        <div>
          <p class="text-sm font-semibold">{item.name}</p>
          <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{@html sanitizeHtml(item.description)}</p>
        </div>
        <div class="flex items-center justify-center">
          {@render item.preview()}
        </div>
        {#if item.code}
          <div>
            <Button
              variant="link"
              size="sm"
              class="px-0 h-auto"
              data-track="code"
              data-track-id={trackId(item.name)}
              data-track-label="Copiar código"
              onclick={() => toggleCode(i)}
            >
              {openStates[i] ? 'Ocultar código' : 'Ver código'}
            </Button>
            {#if openStates[i]}
              <Card class="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none mt-2">
                <code class="whitespace-pre">{item.code}</code>
              </Card>
            {/if}
          </div>
        {/if}
      </Card>
    {/each}
  </div>
</section>
