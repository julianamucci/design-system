<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';

  interface DocsNoteItem { title: string; content: string }

  const { title, items }: { title: string; items: DocsNoteItem[] } = $props();
</script>

<section id="notas">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item}
      <div class="bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4">
        <p class="text-sm font-semibold mb-1">{item.title}</p>
        <div class="text-sm text-muted-foreground leading-relaxed">{@html sanitizeHtml(item.content)}</div>
      </div>
    {/each}
  </div>
</section>
