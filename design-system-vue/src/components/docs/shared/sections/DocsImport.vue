<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
}>();
</script>

<template>
  <section id="importacao">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <p v-if="description" class="text-sm text-muted-foreground mb-3">{{ description }}</p>
    <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
      <code class="whitespace-pre">{{ code }}</code>
    </div>
    <template v-if="secondaryCode">
      <p v-if="secondaryDescription" class="text-sm text-muted-foreground mt-4 mb-3">{{ secondaryDescription }}</p>
      <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-3">
        <code class="whitespace-pre">{{ secondaryCode }}</code>
      </div>
    </template>
  </section>
</template>
