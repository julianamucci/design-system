<script setup lang="ts">
import { Card } from '@/components/ui/card';

defineProps<{ title: string }>();
</script>

<template>
  <section id="demonstracao">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <Card class="p-10 mt-6 flex items-center justify-center">
        <slot />
    </Card>
  </section>
</template>
