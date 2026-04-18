<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';

interface DocsKeyboardItem { key: string; description: string }

defineProps<{
  title: string;
  summary: string;
  items: string[];
  keyboardTitle: string;
  keyboardItems: DocsKeyboardItem[];
}>();
</script>

<template>
  <section id="acessibilidade">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-6">
      <div class="border rounded-xl p-6 shadow-sm space-y-4">
        <p class="text-sm text-muted-foreground leading-relaxed" v-html="sanitizeHtml(summary)" />
        <ul class="space-y-2 text-sm list-none p-0 m-0">
          <li
            v-for="(item, i) in items"
            :key="i"
            class="flex gap-2 list-none"
            v-html="sanitizeHtml(item)"
          />
        </ul>
      </div>
      <div>
        <h3 class="text-base font-semibold mb-3">{{ keyboardTitle }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="(item, i) in keyboardItems" :key="i" class="flex items-start gap-3 border rounded-lg p-3 bg-muted/30">
            <kbd class="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm">
              {{ item.key }}
            </kbd>
            <span class="text-sm text-muted-foreground leading-relaxed">{{ item.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
