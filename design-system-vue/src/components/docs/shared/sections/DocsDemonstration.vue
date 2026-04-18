<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <section id="demonstracao">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
      <slot />
    </div>
  </section>
</template>
