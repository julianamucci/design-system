<script setup lang="ts">
import DOMPurify from 'dompurify';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DocsNoteItem { title: string; content: string }

/**
 * DocsNotes — alertas com notas informativas (conteúdo sanitizado via v-html).
 *
 * Quando `componentSlug` é informado, cada nota recebe um wrapper `<div>` com
 * `data-track="link"` + `data-track-id="{slug}:link:notes-{idx}"` (idx =
 * índice 1-based). Como o conteúdo vem via `v-html`, não marcamos cada `<a>`
 * individualmente — o observer global usa `.closest('[data-track]')` para
 * capturar clicks em qualquer link descendente.
 */
const props = defineProps<{
  title: string;
  items: DocsNoteItem[];
  componentSlug?: string;
}>();

function trackId(i: number): string | undefined {
  return props.componentSlug ? `${props.componentSlug}:link:notes-${i + 1}` : undefined;
}
</script>

<template>
  <section id="notas">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <div
      class="nds-stack"
      data-spacing="md"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        data-track="link"
        :data-track-id="trackId(i)"
      >
        <!-- role="note": as notas já estão na página no carregamento. Com o
             `alert` padrão cada uma vira live region assertiva e o leitor de
             tela salta para cá assim que a docs page abre. -->
        <Alert
          variant="default"
          role="note"
        >
          <!-- as="h3" e não o h5 padrão do Alert: a seção acima é h2, e h5
               pularia dois níveis — `heading-order` do axe. -->
          <AlertTitle v-if="item.title" as="h3">
            {{ item.title }}
          </AlertTitle>
          <AlertDescription>
            <!-- O <p> é obrigatório: `.nds-alert-description` é `display: grid`,
                 então cada filho vira um item em sua própria linha — sem ele, os
                 <code> inline quebram o texto. Mesma marcação nas 4 stacks. -->
            <p v-html="DOMPurify.sanitize(item.content)" />
          </AlertDescription>
        </Alert>
      </div>
    </div>
  </section>
</template>
