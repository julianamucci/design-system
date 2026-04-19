<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import { Card } from '@/components/ui/card';

  interface DocsKeyboardItem { key: string; description: string }

  const { title, summary, items, keyboardTitle, keyboardItems }: {
    title: string;
    summary: string;
    items: string[];
    keyboardTitle: string;
    keyboardItems: DocsKeyboardItem[];
  } = $props();
</script>

<section id="acessibilidade">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-6">
    <Card class="p-4 space-y-4">
        <p class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml(summary)}</p>
        <ul class="space-y-2 text-sm list-disc pl-5 marker:text-muted-foreground">
          {#each items as item}
            <li class="leading-relaxed">{@html sanitizeHtml(item)}</li>
          {/each}
        </ul>
    </Card>
    <div>
      <h3 class="text-base font-semibold mb-3">{keyboardTitle}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {#each keyboardItems as item}
          <Card class="bg-muted/30 border-0 shadow-none p-3 flex items-start gap-3">
              <kbd class="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm">
                {item.key}
              </kbd>
              <span class="text-sm text-muted-foreground leading-relaxed">{item.description}</span>
          </Card>
        {/each}
      </div>
    </div>
  </div>
</section>
