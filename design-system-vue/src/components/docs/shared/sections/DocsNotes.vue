<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';

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
      <div v-for="(item, i) in items" :key="i" class="bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4">
        <p class="text-sm font-semibold mb-1">{{ item.title }}</p>
        <div class="text-sm text-muted-foreground leading-relaxed" v-html="sanitizeHtml(item.content)" />
      </div>
    </div>
  </section>
</template>
