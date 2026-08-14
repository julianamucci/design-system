<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { computed } from 'vue'
import {
  ProgressIndicator,
  ProgressRoot,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<ProgressRootProps & { class?: HTMLAttributes['class'] }>(),
  {
    modelValue: 0,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

// A lib publica o estado em `data-state="indeterminate"`; as outras stacks
// publicam `data-indeterminate`. O CSS compartilhado se apoia no segundo, que é
// o vocabulário de markup que a auditoria cross-stack compara — então a
// tradução acontece aqui, e não com um seletor extra na folha compartilhada.
// `undefined` remove o atributo: presença é o que o seletor testa, e
// `data-indeterminate="false"` casaria `[data-indeterminate]` do mesmo jeito.
const indeterminado = computed(() =>
  props.modelValue == null ? '' : undefined,
)
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :data-indeterminate="indeterminado"
    :class="cn( 'nds-progress', props.class, )"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="nds-progress-indicator"
      :style="
        props.modelValue == null
          ? undefined
          : `transform: translateX(-${100 - props.modelValue}%);`
      "
    />
  </ProgressRoot>
</template>
