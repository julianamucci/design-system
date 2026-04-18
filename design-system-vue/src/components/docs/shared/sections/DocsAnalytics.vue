<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsAnalyticsEventItem { event: string; trigger: string; payload: string }

defineProps<{
  title: string;
  cols: { event: string; trigger: string; payload: string };
  items: DocsAnalyticsEventItem[];
}>();
</script>

<template>
  <section id="analytics">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <Card class="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow class="border-b border-border bg-muted/50 text-left">
              <TableHead class="p-3 border-r border-border font-semibold">{{ cols.event }}</TableHead>
              <TableHead class="p-3 border-r border-border font-semibold">{{ cols.trigger }}</TableHead>
              <TableHead class="p-3 font-semibold">{{ cols.payload }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(item, i) in items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
              <TableCell class="p-3 border-r border-border font-mono text-primary">{{ item.event }}</TableCell>
              <TableCell class="p-3 border-r border-border text-muted-foreground">{{ item.trigger }}</TableCell>
              <TableCell class="p-3 font-mono text-xs text-muted-foreground">{{ item.payload }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
    </Card>
  </section>
</template>
