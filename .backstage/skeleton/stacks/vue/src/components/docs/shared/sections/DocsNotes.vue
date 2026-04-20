<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DocsNoteItem { title: string; content: string }

defineProps<{
  title: string;
  items: DocsNoteItem[];
}>();
</script>

<template>
  <section id="notas">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-4">
      <Alert v-for="(item, i) in items" :key="i" variant="default">
        <AlertTitle v-if="item.title">{{ item.title }}</AlertTitle>
        <AlertDescription v-html="sanitizeHtml(item.content)" />
      </Alert>
    </div>
  </section>
</template>
