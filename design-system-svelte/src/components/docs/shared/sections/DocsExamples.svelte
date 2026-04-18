<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card, CardContent } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';

  interface DocsExampleItem {
    title: string;
    description?: string;
    code: string;
    preview: Snippet;
  }

  const { title, items }: { title: string; items: DocsExampleItem[] } = $props();

  let openStates = $state<Record<number, boolean>>({});
  function toggleCode(i: number) {
    openStates[i] = !openStates[i];
  }
</script>

<section id="exemplos">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-10">
    {#each items as item, i}
      <div class="space-y-3">
        <h3 class="text-base font-semibold">{item.title}</h3>
        {#if item.description}
          <p class="text-sm text-muted-foreground">{item.description}</p>
        {/if}
        <Card>
          <CardContent class="p-10 flex items-center justify-center">
            {@render item.preview()}
          </CardContent>
        </Card>
        <div>
          <Button
            variant="link"
            size="sm"
            onclick={() => toggleCode(i)}
          >
            {openStates[i] ? 'Ocultar código' : 'Ver código'}
          </Button>
          {#if openStates[i]}
            <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
              <code class="whitespace-pre">{item.code}</code>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</section>
