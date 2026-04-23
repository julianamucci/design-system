<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsTokenItem { token: string; value: string; description: string }

defineProps<{
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
}>();
</script>

<template>
  <section id="tokens">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-6">
      <Card class="p-4 overflow-x-auto md:overflow-visible">
          <Table class="[&_th]:whitespace-normal [&_td]:whitespace-normal">
            <TableHeader>
              <TableRow class="border-b border-border bg-muted/50 text-left">
                <TableHead class="p-3 font-semibold">{{ cols.token }}</TableHead>
                <TableHead class="p-3 font-semibold">{{ cols.value }}</TableHead>
                <TableHead class="p-3 font-semibold">{{ cols.description }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(item, i) in items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
                <TableCell class="p-3 font-mono text-primary">{{ item.token }}</TableCell>
                <TableCell class="p-3 font-mono text-muted-foreground">{{ item.value }}</TableCell>
                <TableCell class="p-3 text-muted-foreground">{{ item.description }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </Card>
      <div v-if="customizationTitle" class="space-y-3">
        <h3 class="text-base font-semibold">{{ customizationTitle }}</h3>
        <Card v-if="customizationCode" class="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none">
          <code class="whitespace-pre">{{ customizationCode }}</code>
        </Card>
      </div>
    </div>
  </section>
</template>
