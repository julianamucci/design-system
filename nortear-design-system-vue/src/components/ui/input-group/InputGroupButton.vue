<script setup lang="ts">
import type { InputGroupButtonProps } from './index'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Botão apertado dentro da moldura. Compõe o `Button` do design system.
 *
 * Correção 1 — `size` é REPASSADO ao `Button`. Antes ele era escrito num
 * `:data-size` e parava ali: nenhuma folha do design system lê `[data-size]`
 * para `.nds-input-group-button`, então a prop prometia uma medida que nunca
 * aplicava. Quem rende `nds-button-xs` e companhia é o `Button`.
 *
 * Correção 2 — `type` é PROP, com padrão `'button'`. Estava cravado no
 * template, e nem quem compõe conseguia sobrepor. O padrão continua sendo
 * `'button'` para o botão do addon não submeter o formulário em volta; declarar
 * `type="submit"` agora funciona, e é o que as outras stacks já permitiam.
 *
 * O `type` chega ao `<button>` por herança de atributos: o `Button` não declara
 * `type` como prop, então o valor escrito aqui vence o `type` que ele calcula
 * internamente. MEDIDO por renderização, não suposto.
 */
const props = withDefaults(defineProps<InputGroupButtonProps>(), {
  size: 'xs',
  variant: 'ghost',
  type: 'button',
})
</script>

<template>
  <Button
    data-slot="input-group-button"
    :type="props.type"
    :variant="props.variant"
    :size="props.size"
    :class="cn('nds-input-group-button', props.class)"
  >
    <slot />
  </Button>
</template>
