<script setup lang="ts">
import { ref } from 'vue';

interface DocsExampleItem {
  title: string;
  description?: string;
  code: string;
}

defineProps<{
  title: string;
  items: DocsExampleItem[];
}>();

const openStates = ref<Record<number, boolean>>({});
function toggleCode(i: number) {
  openStates.value[i] = !openStates.value[i];
}
</script>

<template>
  <section id="exemplos">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-10">
      <div v-for="(item, i) in items" :key="i" class="space-y-3">
        <h3 class="text-base font-semibold">{{ item.title }}</h3>
        <p v-if="item.description" class="text-sm text-muted-foreground">{{ item.description }}</p>
        <div class="flex items-center justify-center p-10 border rounded-xl bg-background shadow-sm">
          <slot :name="`preview-${i}`" />
        </div>
        <div>
          <button
            type="button"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            @click="toggleCode(i)"
          >
            {{ openStates[i] ? 'Ocultar código' : 'Ver código' }}
          </button>
          <div v-if="openStates[i]" class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
            <code class="whitespace-pre">{{ item.code }}</code>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
