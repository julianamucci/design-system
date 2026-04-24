<script setup lang="ts">
// Wrapper padronizado para demos de componentes
import { Card } from '@/components/ui/card';
</script>

<template>
  <Card class="flex items-center justify-center p-4 mt-2 bg-background">
    <slot />
  </Card>
</template>
