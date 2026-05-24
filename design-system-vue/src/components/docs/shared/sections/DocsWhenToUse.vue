<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsWhenToUseScenario { s?: string; u?: string; a?: string; scenario?: string; use?: string; alternative?: string }
interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

const props = defineProps<{
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: {
    title?: string;
    cols: { scenario: string; use: string; alternative: string };
    items: DocsWhenToUseScenario[];
  };
  uxWriting?: {
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
    <Card class="p-4 space-y-6">

        <!-- Guidelines -->
        <Card class="bg-muted/40 border border-border/40 shadow-none p-4 space-y-3">
            <h3 class="font-medium text-sm">{{ guidelines.title }}</h3>
            <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li v-for="(item, i) in guidelines.items" :key="i" v-html="sanitizeHtml(item)" />
            </ul>
        </Card>

        <!-- Cenários -->
        <Card class="overflow-x-auto md:overflow-visible p-4">
          <Table class="[&_th]:whitespace-normal [&_td]:whitespace-normal">
            <TableHeader>
              <TableRow class="border-b border-border text-left bg-muted/50 font-medium">
                <TableHead class="p-3">{{ scenarios.cols.scenario }}</TableHead>
                <TableHead class="p-3">{{ scenarios.cols.use }}</TableHead>
                <TableHead class="p-3">{{ scenarios.cols.alternative }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(item, i) in scenarios.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                <TableCell class="p-3">{{ item.s ?? item.scenario }}</TableCell>
                <TableCell class="p-3 font-medium text-primary">{{ item.u ?? item.use }}</TableCell>
                <TableCell class="p-3 text-muted-foreground">{{ item.a ?? item.alternative }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <!-- UX Writing -->
        <div v-if="uxWriting" class="space-y-3">
          <h3 class="font-medium text-sm">{{ uxWriting.title }}</h3>
          <Card class="overflow-x-auto md:overflow-visible p-4">
            <Table class="[&_th]:whitespace-normal [&_td]:whitespace-normal">
              <TableHeader>
                <TableRow class="border-b border-border bg-muted/70 text-left">
                  <TableHead class="p-3 font-semibold">{{ uxWriting.cols.element }}</TableHead>
                  <TableHead v-if="uxWriting.cols.rules" class="p-3 font-semibold">{{ uxWriting.cols.rules }}</TableHead>
                  <TableHead class="p-3 font-semibold text-green-700 dark:text-green-400">
                    <span class="flex items-center gap-1.5">
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      {{ uxWriting.cols.do }}
                    </span>
                  </TableHead>
                  <TableHead class="p-3 font-semibold text-red-700 dark:text-red-400">
                    <span class="flex items-center gap-1.5">
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      {{ uxWriting.cols.dont }}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(row, i) in uxWriting.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 font-medium">{{ row.element }}</TableCell>
                  <TableCell v-if="uxWriting!.cols.rules" class="p-3 text-muted-foreground">{{ row.rules }}</TableCell>
                  <TableCell class="p-3 font-medium text-green-600 dark:text-green-500">{{ row.do }}</TableCell>
                  <TableCell class="p-3 font-medium text-red-600 dark:text-red-500">{{ row.dont }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <!-- Do / Don't cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card class="p-4">
              <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                {{ props.do.title }}
              </h3>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li v-for="(item, i) in props.do.items" :key="i" v-html="sanitizeHtml(item)" />
              </ul>
          </Card>
          <Card class="p-4">
              <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                {{ props.dont.title }}
              </h3>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                <li v-for="(item, i) in props.dont.items" :key="i" v-html="sanitizeHtml(item)" />
              </ul>
          </Card>
        </div>

    </Card>
  </section>
</template>
