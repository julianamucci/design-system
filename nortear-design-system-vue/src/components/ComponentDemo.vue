<script setup lang="ts">
// Wrapper padronizado para demos de componentes
import { Card } from '@/components/ui/card';
</script>

<template>
  <Card class="nds-docs-demo" data-docs-preview="demonstracao">
    <slot />
  </Card>
</template>
