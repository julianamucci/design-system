<script setup lang="ts">
import { Button } from '@/components/ui/button';

interface DocsRelatedItem { name: string; description: string; path: string }

defineProps<{
  title: string;
  items: DocsRelatedItem[];
}>();
</script>

<template>
  <section id="relacionados">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button
        v-for="(item, i) in items"
        :key="i"
        as="a"
        :href="item.path"
        target="_top"
        variant="ghost"
        class="text-left h-auto p-4 border rounded-xl shadow-sm bg-card hover:bg-muted/50 w-full flex-col items-start space-y-1 whitespace-normal"
      >
        <p class="text-sm font-semibold text-primary">{{ item.name }}</p>
        <p class="text-xs text-muted-foreground leading-relaxed">{{ item.description }}</p>
      </Button>
    </div>
  </section>
</template>
