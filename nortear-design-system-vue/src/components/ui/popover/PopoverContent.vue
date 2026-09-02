<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'
import { POPOVER_MODAL } from './popover.context'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 4,
  },
)
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * `aria-modal` — nosso, porque nenhum caminho do primitivo o emite.
 *
 * SÓ no modo modal, e nunca `"false"` no padrão: o atributo ausente e o negado
 * dizem a mesma coisa ao leitor de tela, e anunciar inércia sem o foco preso
 * seria mentira. Quem prende o foco aqui é a lib — com `modal`, o painel que
 * renderiza é o modal, com `trap-focus` ligado —, então o anúncio é verdadeiro.
 */
const modal = inject(POPOVER_MODAL, computed(() => false))
const ariaModal = computed(() => (modal.value ? 'true' : undefined))

// Sem nome acessível de reserva aqui: a lib já aponta o `aria-labelledby` do
// painel para o GATILHO, que é exatamente o comportamento desejado quando não
// há título — o mesmo que o Vanilla, referência cross-stack, produz. Quando há
// `PopoverTitle`, é ele que reivindica o nome (ver PopoverTitle.vue): quem sabe
// que o título existe é o próprio título, e ele monta junto com o painel.
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :aria-modal="ariaModal"
      :class="cn( 'nds-popover-content', props.class, )"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
