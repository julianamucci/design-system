<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
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
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-4">
      <div
        v-for="(item, i) in items"
        :key="i"
        data-track="link"
        :data-track-id="trackId(i)"
      >
        <Alert variant="default">
          <AlertTitle v-if="item.title">{{ item.title }}</AlertTitle>
          <AlertDescription v-html="sanitizeHtml(item.content)" />
        </Alert>
      </div>
    </div>
  </section>
</template>
