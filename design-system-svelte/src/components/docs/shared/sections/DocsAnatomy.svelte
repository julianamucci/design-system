<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import ComponentDemo from '@/components/ComponentDemo.svelte';
  import { Card } from '@/components/ui/card';

  const { title, items, structureCode, structureLabel }: {
    title: string;
    items: string[];
    structureCode: string;
    structureLabel?: string;
  } = $props();
</script>

<section id="anatomia">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <ComponentDemo>
    <div class="space-y-4 w-full">
        <ol class="space-y-3 text-sm list-none p-0 m-0">
          {#each items as item, i}
            <li class="flex gap-3 list-none">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span>{@html sanitizeHtml(item)}</span>
            </li>
          {/each}
        </ol>
        <Card class="bg-muted/50 border-border/40 shadow-none px-4 pt-3 pb-4 overflow-x-auto">
          {#if structureLabel}
            <p class="text-xs text-muted-foreground mb-2">{structureLabel}</p>
          {/if}
          <pre class="font-mono text-sm whitespace-pre">{structureCode}</pre>
        </Card>
    </div>
  </ComponentDemo>
</section>
