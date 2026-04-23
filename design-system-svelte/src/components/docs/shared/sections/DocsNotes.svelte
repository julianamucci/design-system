<script lang="ts">
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

  interface DocsNoteItem { title: string; content: string }

  /**
   * DocsNotes — alertas com notas informativas (conteúdo sanitizado via {@html}).
   *
   * Quando `componentSlug` é informado, cada nota recebe um wrapper `<div>`
   * com `data-track="link"` + `data-track-id="{slug}:link:notes-{idx}"`
   * (idx = índice 1-based). Como o conteúdo vem via `{@html}`, não marcamos
   * cada `<a>` individualmente — o observer global usa
   * `.closest('[data-track]')` para capturar clicks em qualquer link descendente.
   */
  const { title, items, componentSlug }: {
    title: string;
    items: DocsNoteItem[];
    componentSlug?: string;
  } = $props();

  function trackId(i: number): string | undefined {
    return componentSlug ? `${componentSlug}:link:notes-${i + 1}` : undefined;
  }
</script>

<section id="notas">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <div class="space-y-4">
    {#each items as item, i}
      <div data-track="link" data-track-id={trackId(i)}>
        <Alert variant="default">
          {#if item.title}
            <AlertTitle>{item.title}</AlertTitle>
          {/if}
          <AlertDescription>{@html sanitizeHtml(item.content)}</AlertDescription>
        </Alert>
      </div>
    {/each}
  </div>
</section>
