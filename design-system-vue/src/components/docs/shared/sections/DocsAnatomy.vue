<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
import ComponentDemo from '@/components/ComponentDemo.vue';

defineProps<{
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
}>();
</script>

<template>
  <section id="anatomia">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <ComponentDemo>
      <div class="space-y-4 w-full">
          <ol class="space-y-3 text-sm list-none p-0 m-0">
            <li v-for="(item, i) in items" :key="i" class="flex gap-3 list-none">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {{ i + 1 }}
              </span>
              <span v-html="sanitizeHtml(item)" />
            </li>
          </ol>
          <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
            <p v-if="structureLabel" class="text-xs text-muted-foreground mb-2">{{ structureLabel }}</p>
            <pre class="font-mono text-sm whitespace-pre">{{ structureCode }}</pre>
        </div>
      </div>
    </ComponentDemo>
  </section>
</template>
