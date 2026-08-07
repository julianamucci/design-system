<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <!-- A anatomia documentada é literal: "último item com aria-current='page'; nunca é
   link". O role="link" com aria-disabled fazia o leitor de tela anunciar
   justamente o contrário — "link, desabilitado" — para um texto que nunca foi
   navegável. Quem marca a página atual é o aria-current, e ele vale em
   qualquer elemento. -->
  <span
    data-slot="breadcrumb-page"
    aria-current="page"
    :class="cn('nds-breadcrumb-page', props.class)"
  >
    <slot />
  </span>
</template>
