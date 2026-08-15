<script setup lang="ts">
import type { SelectValueProps } from 'reka-ui'
import { SelectValue } from 'reka-ui'

const props = defineProps<SelectValueProps>()
</script>

<template>
  <SelectValue
    data-slot="select-value"
    class="nds-select-value"
    v-bind="props"
  >
    <!--
      O slot do primitivo entrega o valor escolhido e o rótulo resolvido, e é
      por ele que se formata o texto do campo fechado — o caso mais comum é o
      valor que chega ANTES da primeira abertura (valor inicial, valor vindo do
      formulário), quando a lista ainda não montou e não há rótulo para achar.

      O wrapper anterior escrevia `<slot />` seco: os dois dados morriam aqui, e
      quem consumisse recebia `undefined`. O `v-if` é o que mantém o
      comportamento padrão intacto — sem conteúdo próprio, o primitivo continua
      resolvendo rótulo e placeholder sozinho; um slot sempre presente, ainda
      que vazio, desligaria esse padrão.
    -->
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </SelectValue>
</template>
