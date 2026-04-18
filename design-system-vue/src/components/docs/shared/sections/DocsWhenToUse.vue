<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';

interface DocsWhenToUseScenario { s: string; u: string; a: string }
interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

defineProps<{
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: {
    title?: string;
    cols: { scenario: string; use: string; alternative: string };
    items: DocsWhenToUseScenario[];
  };
  uxWriting: {
    title: string;
    cols: { element: string; do: string; dont: string; rules?: string };
    items: DocsWhenToUseUXRow[];
  };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}>();
</script>

<template>
  <section id="quando-usar">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="border rounded-xl p-6 shadow-sm space-y-6">

      <!-- Guidelines -->
      <div class="bg-muted/30 rounded-lg p-4 space-y-3">
        <h3 class="font-medium text-sm">{{ guidelines.title }}</h3>
        <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          <li v-for="(item, i) in guidelines.items" :key="i" v-html="sanitizeHtml(item)" />
        </ul>
      </div>

      <!-- Cenários -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left bg-muted/50 font-medium">
              <th class="p-3 border-r border-border">{{ scenarios.cols.scenario }}</th>
              <th class="p-3 border-r border-border">{{ scenarios.cols.use }}</th>
              <th class="p-3">{{ scenarios.cols.alternative }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in scenarios.items" :key="i" class="border-b border-border hover:bg-muted/5">
              <td class="p-3 border-r border-border">{{ item.s }}</td>
              <td class="p-3 border-r border-border font-medium text-primary">{{ item.u }}</td>
              <td class="p-3 text-muted-foreground">{{ item.a }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- UX Writing -->
      <div class="space-y-3">
        <h3 class="font-medium text-sm">{{ uxWriting.title }}</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border bg-muted/70 text-left">
                <th class="p-3 border-r border-border font-semibold">{{ uxWriting.cols.element }}</th>
                <th v-if="uxWriting.cols.rules" class="p-3 border-r border-border font-semibold">{{ uxWriting.cols.rules }}</th>
                <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                    {{ uxWriting.cols.do }}
                  </span>
                </th>
                <th class="p-3 font-semibold text-red-700 dark:text-red-400">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                    {{ uxWriting.cols.dont }}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in uxWriting.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                <td class="p-3 border-r border-border font-medium">{{ row.element }}</td>
                <td v-if="uxWriting.cols.rules" class="p-3 border-r border-border text-muted-foreground">{{ row.rules }}</td>
                <td class="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{{ row.do }}</td>
                <td class="p-3 font-medium text-red-600 dark:text-red-500">{{ row.dont }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Do / Don't cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
            {{ do.title }}
          </h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li v-for="(item, i) in do.items" :key="i" v-html="sanitizeHtml(item)" />
          </ul>
        </div>
        <div class="bg-card border rounded-xl p-4 shadow-sm">
          <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
            {{ dont.title }}
          </h3>
          <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li v-for="(item, i) in dont.items" :key="i" v-html="sanitizeHtml(item)" />
          </ul>
        </div>
      </div>

    </div>
  </section>
</template>
