<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Separator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>(),
  { decorative: true },
)

const delegatedProps = reactiveOmit(props, 'class')
</script>

<!--
  Divisor DECORATIVO, e não `role="separator"`.

  O primitivo desta stack emite `role="separator"` por padrão, e `separator` não
  é filho permitido de `role="listbox"` — o axe reprova por
  `aria-required-children`. A linha de 1px entre grupos não carrega informação
  (quem separa semanticamente é o `role="group"` de cada `CommandGroup`), então
  ela sai da árvore de acessibilidade: `decorative` devolve `role="none"` e o
  `aria-hidden` fecha o caso, que é o mesmo tratamento das outras stacks.
-->
<template>
  <Separator
    data-slot="command-separator"
    v-bind="delegatedProps"
    :aria-hidden="decorative ? 'true' : undefined"
    :class="cn('nds-command-separator', props.class)"
  >
    <slot />
  </Separator>
</template>
