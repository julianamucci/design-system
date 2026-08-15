<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  href?: string
  size?: ButtonVariants['size']
  isActive?: boolean
  class?: HTMLAttributes['class']
}>(), {
  // Sem `href` o elemento é uma âncora sem destino: o navegador não lhe dá papel
  // de link, não a coloca na ordem de tabulação e o Enter não a alcança — a
  // faixa numerada inteira ficava fora do teclado. O `#` é o mesmo destino
  // neutro que as outras stacks escrevem no elemento; quem tem URL de verdade
  // passa a sua.
  href: '#',
  size: 'icon',
  isActive: false,
})
</script>

<template>
  <a
    :href="href"
    role="link"
    data-slot="pagination-link"
    :data-active="isActive ? 'true' : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :class="cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }), props.class)"
  >
    <slot />
  </a>
</template>
