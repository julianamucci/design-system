<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';

  interface DocsVariantItem {
    name: string;
    description: string;
    code?: string;
    preview: Snippet;
  }

  const { title, items, id = 'variantes' }: { title: string; items: DocsVariantItem[]; id?: string } = $props();

  let openStates = $state<Record<number, boolean>>({});
  function toggleCode(i: number) {
    openStates[i] = !openStates[i];
  }
</script>

<section {id}>
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item, i}
      <Card class="p-4 gap-2">
        <div>
          <p class="text-sm font-semibold">{item.name}</p>
          <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
        </div>
        <div class="flex items-center justify-center">
          {@render item.preview()}
        </div>
        {#if item.code}
          <div>
            <Button variant="link" size="sm" class="px-0 h-auto" onclick={() => toggleCode(i)}>
              {openStates[i] ? 'Ocultar código' : 'Ver código'}
            </Button>
            {#if openStates[i]}
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
                <code class="whitespace-pre">{item.code}</code>
              </div>
            {/if}
          </div>
        {/if}
      </Card>
    {/each}
  </div>
</section>
