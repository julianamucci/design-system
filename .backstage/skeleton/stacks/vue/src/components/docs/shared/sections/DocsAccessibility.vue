<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Card } from '@/components/ui/card';

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
    <Card class="p-4 space-y-6">
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground leading-relaxed" v-html="sanitizeHtml(summary)" />
        <ul class="space-y-2 text-sm list-disc pl-5 marker:text-muted-foreground">
          <li
            v-for="(item, i) in items"
            :key="i"
            class="leading-relaxed"
            v-html="sanitizeHtml(item)"
          />
        </ul>
      </div>
      <div>
        <h3 class="text-base font-semibold mb-3">{{ keyboardTitle }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card v-for="(item, i) in keyboardItems" :key="i" class="bg-muted/30 border-0 shadow-none p-4">
              <div class="flex items-start gap-3">
                <kbd class="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm">
                  {{ item.key }}
                </kbd>
                <span class="text-sm text-muted-foreground leading-relaxed">{{ item.description }}</span>
              </div>
          </Card>
        </div>
      </div>
    </Card>
  </section>
</template>
