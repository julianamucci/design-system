<script setup lang="ts">
defineProps<{
  id?: string;
  title: string;
  description?: string;
  noSeparator?: boolean;
}>();
</script>

<template>
  <section :id="id" class="space-y-4 scroll-mt-24">
    <hr v-if="!noSeparator" class="border-border my-12" />
    <div class="space-y-1">
      <h2 class="text-2xl font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="text-muted-foreground">{{ description }}</p>
    </div>
    <div><slot /></div>
  </section>
</template>
