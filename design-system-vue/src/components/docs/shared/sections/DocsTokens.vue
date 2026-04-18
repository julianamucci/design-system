<script setup lang="ts">
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
      <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-muted/50 text-left">
              <th class="p-3 border-r border-border font-semibold">{{ cols.token }}</th>
              <th class="p-3 border-r border-border font-semibold">{{ cols.value }}</th>
              <th class="p-3 font-semibold">{{ cols.description }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in items" :key="i" class="border-b border-border last:border-0 hover:bg-muted/5">
              <td class="p-3 border-r border-border font-mono text-primary">{{ item.token }}</td>
              <td class="p-3 border-r border-border font-mono text-muted-foreground">{{ item.value }}</td>
              <td class="p-3 text-muted-foreground">{{ item.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="customizationTitle" class="space-y-3">
        <h3 class="text-base font-semibold">{{ customizationTitle }}</h3>
        <div v-if="customizationCode" class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
          <code class="whitespace-pre">{{ customizationCode }}</code>
        </div>
      </div>
    </div>
  </section>
</template>
