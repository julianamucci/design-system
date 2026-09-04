<script lang="ts">
  import DOMPurify from 'dompurify';
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
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="md">
    {#each items as item, i (i)}
      <div data-track="link" data-track-id={trackId(i)}>
        <!-- role="note": as notas são conteúdo ESTÁTICO, já presente quando a
             página carrega. Com o `role="alert"` padrão do primitivo, cada nota
             vira live region assertiva e o leitor de tela salta para esta seção
             no carregamento (e fica preso nela). -->
        <Alert variant="default" role="note">
          {#if item.title}
            <!-- as="h3" e não o h5 padrão do Alert: a seção acima é h2, e h5
                 pularia dois níveis — `heading-order` do axe. -->
            <AlertTitle as="h3">{item.title}</AlertTitle>
          {/if}
          <AlertDescription>
            <!-- O <p> é obrigatório: `.nds-alert-description` é `display: grid`,
                 então cada filho vira um item em sua própria linha — sem ele, os
                 <code> inline quebram o texto. Mesma marcação nas 4 stacks. -->
            <p>{@html DOMPurify.sanitize(item.content)}</p>
          </AlertDescription>
        </Alert>
      </div>
    {/each}
  </div>
</section>
