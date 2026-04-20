<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsTestItem { action: string; result: string; priority: string }
interface DocsA11yTestItem { criterion: string; level: string; how: string }
interface DocsVisualTestItem { story: string; priority: string }

defineProps<{
  title: string;
  functional: {
    title: string;
    cols: { action: string; result: string; priority: string };
    items: DocsTestItem[];
  };
  accessibility: {
    title: string;
    cols: { criterion: string; level: string; how: string };
    items: DocsA11yTestItem[];
  };
  visual: {
    title: string;
    cols: { story: string; priority: string };
    items: DocsVisualTestItem[];
  };
}>();

const priorityClass = (p: string) =>
  ({ Alta: 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400', Média: 'border-yellow-400 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', Baixa: 'border-green-400 bg-green-500/10 text-green-600 dark:text-green-400', High: 'border-red-400 bg-red-500/10 text-red-600 dark:text-red-400', Medium: 'border-yellow-400 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', Low: 'border-green-400 bg-green-500/10 text-green-600 dark:text-green-400' } as Record<string, string>)[p] ?? '';
</script>

<template>
  <section id="testes">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-8">

      <!-- Functional -->
      <div class="space-y-3">
        <h3 class="text-base font-semibold">{{ functional.title }}</h3>
        <Card class="p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow class="border-b border-border bg-muted/50 text-left">
                  <TableHead class="p-3 border-r border-border font-semibold">{{ functional.cols.action }}</TableHead>
                  <TableHead class="p-3 border-r border-border font-semibold">{{ functional.cols.result }}</TableHead>
                  <TableHead class="p-3 font-semibold">{{ functional.cols.priority }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(item, i) in functional.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border">{{ item.action }}</TableCell>
                  <TableCell class="p-3 border-r border-border text-muted-foreground">{{ item.result }}</TableCell>
                  <TableCell class="p-3">
                    <Badge variant="outline" :class="priorityClass(item.priority)">{{ item.priority }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
        </Card>
      </div>

      <!-- Accessibility -->
      <div class="space-y-3">
        <h3 class="text-base font-semibold">{{ accessibility.title }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card v-for="(item, i) in accessibility.items" :key="i" class="bg-muted/30 border-0 shadow-none p-3 space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5">{{ item.level }}</span>
                <span class="text-sm font-medium">{{ item.criterion }}</span>
              </div>
              <p class="text-xs text-muted-foreground pl-0.5">{{ item.how }}</p>
          </Card>
        </div>
      </div>

      <!-- Visual -->
      <div class="space-y-3">
        <h3 class="text-base font-semibold">{{ visual.title }}</h3>
        <Card class="p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow class="border-b border-border bg-muted/50 text-left">
                  <TableHead class="p-3 border-r border-border font-semibold">{{ visual.cols.story }}</TableHead>
                  <TableHead class="p-3 font-semibold">{{ visual.cols.priority }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(item, i) in visual.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border font-mono text-xs">{{ item.story }}</TableCell>
                  <TableCell class="p-3">
                    <Badge variant="outline" :class="priorityClass(item.priority)">{{ item.priority }}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
        </Card>
      </div>

    </div>
  </section>
</template>
