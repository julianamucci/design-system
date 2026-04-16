<script setup lang="ts">
defineProps<{
  category?: string;
  complexity?: string;
  title: string;
  description: string;
  shadcnCommand?: string;
}>();
</script>

<template>
  <header class="space-y-6">
    <div class="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <span v-if="category" class="bg-muted px-2 py-0.5 rounded">{{ category }}</span>
      <span v-if="complexity" class="bg-muted px-2 py-0.5 rounded">Complexidade: {{ complexity }}</span>
    </div>
    
    <div class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">{{ title }}</h1>
      <p class="text-xl text-muted-foreground">{{ description }}</p>
    </div>

    <div v-if="shadcnCommand" class="flex items-center gap-2 bg-muted/50 border border-border p-3 rounded-lg font-mono text-sm group">
      <code class="flex-1">{{ shadcnCommand }}</code>
      <button 
        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
        @click="$emit('copy', shadcnCommand)"
        title="Copiar comando"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      </button>
    </div>
  </header>
</template>
