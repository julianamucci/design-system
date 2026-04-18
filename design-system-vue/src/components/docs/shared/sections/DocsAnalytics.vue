<script setup lang="ts">
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
    <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-muted/50 text-left">
            <th class="p-3 border-r border-border font-semibold">{{ cols.event }}</th>
            <th class="p-3 border-r border-border font-semibold">{{ cols.trigger }}</th>
            <th class="p-3 font-semibold">{{ cols.payload }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
            <td class="p-3 border-r border-border font-mono text-primary">{{ item.event }}</td>
            <td class="p-3 border-r border-border text-muted-foreground">{{ item.trigger }}</td>
            <td class="p-3 font-mono text-xs text-muted-foreground">{{ item.payload }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
