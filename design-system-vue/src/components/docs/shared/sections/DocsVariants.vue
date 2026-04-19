<script setup lang="ts">
import { ref } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
}

defineProps<{
  title: string;
  items: DocsVariantItem[];
}>();

const openStates = ref<Record<number, boolean>>({});
function toggleCode(i: number) {
  openStates.value[i] = !openStates.value[i];
}
</script>

<template>
  <section id="variantes">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-4">
      <Card v-for="(item, i) in items" :key="i" class="p-5 space-y-3">
        <div class="flex items-center justify-center min-h-[60px]">
          <slot :name="`variant-preview-${i}`" />
        </div>
        <div>
          <p class="text-sm font-semibold">{{ item.name }}</p>
          <p class="text-xs text-muted-foreground mt-0.5 leading-relaxed">{{ item.description }}</p>
        </div>
        <div v-if="item.code">
          <Button variant="link" size="sm" class="px-0 h-auto" @click="toggleCode(i)">
            {{ openStates[i] ? 'Ocultar código' : 'Ver código' }}
          </Button>
          <div v-if="openStates[i]" class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
            <code class="whitespace-pre">{{ item.code }}</code>
          </div>
        </div>
      </Card>
    </div>
  </section>
</template>
