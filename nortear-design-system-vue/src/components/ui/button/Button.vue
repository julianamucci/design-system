<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { ButtonVariants } from './index'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from './index'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})

/**
 * `type="button"` quando o elemento renderizado É um <button>.
 *
 * Sem isto o navegador assume `type="submit"`: qualquer botão dentro de um
 * <form> passa a enviar o formulário ao ser clicado — um "Cancelar" ou um
 * "Adicionar item" submetem a página inteira. As outras quatro stacks já
 * declaravam o tipo; medido, esta era a ÚNICA divergência do Button entre as
 * cinco, e não aparecia em teste nenhum porque nenhuma story monta um form.
 *
 * Só quando `as` é button: com `as="a"` ou `as-child`, o atributo não se aplica
 * e o navegador o ignoraria — mas emitir lixo no DOM é como classe morta nasce.
 */
const typeNativo = computed(() => (props.as === 'button' ? 'button' : undefined))
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :type="typeNativo"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
