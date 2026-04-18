<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import { Card } from '@/components/ui/card';

  interface DocsNoteItem { title: string; content: string }

  const { title, items }: { title: string; items: DocsNoteItem[] } = $props();
</script>

<section id="notas">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item}
      <Card class="bg-muted/30 border-l-4 border-primary/40 shadow-none rounded-lg p-4">
          <p class="text-sm font-semibold mb-1">{item.title}</p>
          <div class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml(item.content)}</div>
      </Card>
    {/each}
  </div>
</section>
