<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!--
    O wrapper tem `overflow-x: auto` (.nds-table-wrapper): quando a tabela é mais
    larga que o container ele vira região rolável e precisa ser alcançável pelo
    teclado — WCAG 2.1.1 / axe scrollable-region-focusable. Mesmo tratamento do
    CodeBlock (.nds-code-block-scroll).
  -->
  <div
    data-slot="table-container"
    class="nds-table-wrapper"
    tabindex="0"
  >
    <table
      data-slot="table"
      :class="cn('nds-table', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
