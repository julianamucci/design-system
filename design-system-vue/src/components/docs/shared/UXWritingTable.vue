<script setup lang="ts">
import { sanitizeHtml } from '@/lib/sanitize-html';

interface Row {
  situation: string;
  recommendation: string;
  reason: string;
}

defineProps<{
  rows: Row[];
}>();
</script>

<template>
  <div class="rounded-lg border border-border overflow-hidden">
    <table class="w-full text-sm text-left">
      <thead class="bg-muted text-muted-foreground font-medium border-bottom border-border">
        <tr>
          <th class="px-4 py-3">Situação</th>
          <th class="px-4 py-3">Recomendação</th>
          <th class="px-4 py-3">Por que?</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr v-for="(row, i) in rows" :key="i" class="bg-card">
          <td class="px-4 py-3 font-medium" v-html="sanitizeHtml(row.situation)"></td>
          <td class="px-4 py-3 italic" v-html="sanitizeHtml(row.recommendation)"></td>
          <td class="px-4 py-3 text-muted-foreground" v-html="sanitizeHtml(row.reason)"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
