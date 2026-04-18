<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';

interface DocsVariantItem {
  name: string;
  description: string;
}

defineProps<{
  title: string;
  items: DocsVariantItem[];
}>();
</script>

<template>
  <section id="variantes">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="(item, i) in items" :key="i" class="space-y-3">
        <CardContent class="p-5">
          <div class="flex items-center justify-center min-h-[60px]">
            <slot :name="`variant-preview-${i}`" />
          </div>
          <div>
            <p class="text-sm font-semibold">{{ item.name }}</p>
            <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ item.description }}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
