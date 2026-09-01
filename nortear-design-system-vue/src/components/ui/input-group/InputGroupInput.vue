<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

/**
 * O campo dentro da moldura.
 *
 * A classe do controle é o que zera a moldura própria do campo, e o `data-slot`
 * é o que o `FormField` desta casa usa para achar o campo e ligar rótulo e
 * descrição. Os dois andam juntos, e por isso saem daqui juntos.
 *
 * ─── O `data-slot`, MEDIDO ──────────────────────────────────────────────────
 *
 * `Input.vue` declara `data-slot="input"` ESTÁTICO no próprio template, e o
 * valor daqui chega por herança de atributos: os dois disputam o mesmo nome.
 * Renderizado, o vencedor é o herdado — o Vue funde os atributos herdados DEPOIS
 * dos do template (`mergeProps(props, attrs)`), e para tudo que não é `class`
 * nem `style` o último vence. A saída medida é uma só:
 *
 *   <input data-slot="input-group-control" class="nds-input nds-input-group-control">
 *
 * Não há `data-slot="input"` sobrando nem duplicado, então o `FormField` e o
 * atalho de ponteiro do addon acham o campo. A medição está registrada aqui
 * porque a leitura oposta — "atributo estático do template vence" — é plausível
 * e teria deixado o componente quebrado em silêncio.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Input
    data-slot="input-group-control"
    :class="cn('nds-input-group-control', props.class)"
  />
</template>
