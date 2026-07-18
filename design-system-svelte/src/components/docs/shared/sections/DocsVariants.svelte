<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import DOMPurify from 'dompurify';

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
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="md">
    {#each items as item, i}
      <Card class="nds-p-4">
        <div>
          <p class="nds-text-body nds-font-semibold nds-m-0">{item.name}</p>
          <p class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-leading-relaxed">{@html DOMPurify.sanitize(item.description)}</p>
        </div>
        <div class="nds-cluster" data-justify="center">
          {@render item.preview()}
        </div>
        {#if item.code}
          <div>
            <Button
              variant="link"
              size="sm"
              class="nds-px-0"
              data-track="code"
              data-track-id={trackId(item.name)}
              data-track-label="Copiar código"
              onclick={() => toggleCode(i)}
            >
              {openStates[i] ? 'Ocultar código' : 'Ver código'}
            </Button>
            {#if openStates[i]}
              <Card class="nds-code-block nds-shadow-none nds-mt-2">
                <code class="nds-whitespace-pre">{item.code}</code>
              </Card>
            {/if}
          </div>
        {/if}
      </Card>
    {/each}
  </div>
</section>
