<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsPropItem {
  name: string;
  type: string;
  defaultValue: string;
  required: string;
  description: string;
}

interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}

defineProps<{
  title: string;
  tables: DocsPropsTableDef[];
  interfaceCode?: string;
  extensibilityTitle?: string;
  extensibilityNotes?: string;
}>();
</script>

<template>
  <section id="propriedades">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-8">
      <div v-for="(def, ti) in tables" :key="ti" class="space-y-3">
        <h3 v-if="def.title" class="text-base font-semibold">{{ def.title }}</h3>
        <Card class="p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow class="border-b border-border bg-muted/50 text-left">
                  <TableHead class="p-3 border-r border-border font-semibold">{{ def.cols.prop }}</TableHead>
                  <TableHead class="p-3 border-r border-border font-semibold">{{ def.cols.type }}</TableHead>
                  <TableHead class="p-3 border-r border-border font-semibold">{{ def.cols.default }}</TableHead>
                  <TableHead class="p-3 border-r border-border font-semibold">{{ def.cols.required }}</TableHead>
                  <TableHead class="p-3 font-semibold">{{ def.cols.description }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(item, i) in def.items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell class="p-3 border-r border-border font-mono font-bold text-primary">{{ item.name }}</TableCell>
                  <TableCell class="p-3 border-r border-border font-mono text-muted-foreground">{{ item.type }}</TableCell>
                  <TableCell class="p-3 border-r border-border text-muted-foreground">{{ item.defaultValue }}</TableCell>
                  <TableCell class="p-3 border-r border-border text-muted-foreground">{{ item.required }}</TableCell>
                  <TableCell class="p-3 text-muted-foreground">{{ item.description }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
        </Card>
      </div>
      <div v-if="interfaceCode" class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
        <code class="whitespace-pre">{{ interfaceCode }}</code>
      </div>
      <div v-if="extensibilityTitle" class="space-y-2">
        <h3 class="text-base font-semibold">{{ extensibilityTitle }}</h3>
        <div
          v-if="extensibilityNotes"
          class="text-sm text-muted-foreground leading-relaxed"
          v-html="sanitizeHtml(extensibilityNotes)"
        />
      </div>
    </div>
  </section>
</template>
