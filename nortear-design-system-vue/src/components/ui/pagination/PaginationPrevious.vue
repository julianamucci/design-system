<script setup lang="ts">
import type { PaginationPrevProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { PaginationPrev, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<PaginationPrevProps & {
  size?: ButtonVariants['size']
  /** Texto visível do controle. Traduzível — o mesmo nome de prop das outras stacks. */
  text?: string
  /** Aparência do controle. Padrão `ghost` — ver a nota em PaginationLink.vue. */
  appearance?: 'ghost' | 'outline'
  class?: HTMLAttributes['class']
}>(), {
  size: 'default',
  text: 'Anterior',
  appearance: 'ghost',
})

const delegatedProps = reactiveOmit(props, 'class', 'size', 'text', 'appearance')
const forwarded = useForwardProps(delegatedProps)

/**
 * Sem texto visível o direcional é um controle SÓ DE ÍCONE, e então ele é
 * quadrado como o numerado. É a forma que o rodapé do DataTable usa.
 */
const iconOnly = computed(() => !props.text)

const classes = computed(() => cn(
  buttonVariants({ variant: props.appearance, size: iconOnly.value ? 'icon' : props.size }),
  // O recuo assimétrico de `.nds-pagination-prev` existe para abrir espaço
  // ENTRE o chevron e a palavra ao lado; num quadrado ele só desalinharia o
  // ícone.
  iconOnly.value ? undefined : 'nds-pagination-prev',
  props.class,
))
</script>

<template>
  <!--
    `nds-pagination-prev` é a classe do design system que dá o recuo assimétrico
    do lado do ícone. No lugar dela havia `pl-1.5!`, do framework utilitário que
    saiu: classe inerte, e o recuo nunca chegou à tela.

    O `<span>` do rótulo não nasce vazio: `.nds-pagination-label` é `block` acima
    de 40rem, e um bloco sem texto ainda ocuparia uma linha inteira dentro do
    botão — o quadrado deixaria de ser quadrado. Quem nomeia o controle é o
    `aria-label`, que não depende do texto visível.
  -->
  <PaginationPrev
    aria-label="Ir para a página anterior"
    data-slot="pagination-previous"
    :class="classes"
    v-bind="forwarded"
  >
    <slot>
      <ChevronLeftIcon data-icon="inline-start" />
      <span
        v-if="!iconOnly"
        class="nds-pagination-label"
      >{{ text }}</span>
    </slot>
  </PaginationPrev>
</template>
