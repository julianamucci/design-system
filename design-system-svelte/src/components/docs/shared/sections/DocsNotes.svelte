<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

  interface DocsNoteItem { title: string; content: string }

  const { title, items }: { title: string; items: DocsNoteItem[] } = $props();
</script>

<section id="notas">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item}
      <Alert variant="default">
        {#if item.title}
          <AlertTitle>{item.title}</AlertTitle>
        {/if}
        <AlertDescription>{@html sanitizeHtml(item.content)}</AlertDescription>
      </Alert>
    {/each}
  </div>
</section>
