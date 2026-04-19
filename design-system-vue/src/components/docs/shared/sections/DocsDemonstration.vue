<script setup lang="ts">
import ComponentDemo from '@/components/ComponentDemo.vue';

defineProps<{ title: string }>();
</script>

<template>
  <section id="demonstracao">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <ComponentDemo>
      <slot />
    </ComponentDemo>
  </section>
</template>
