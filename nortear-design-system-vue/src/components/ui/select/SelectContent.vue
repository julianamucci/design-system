<script setup lang="ts">
import type { SelectContentEmits, SelectContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  SelectContent,
  SelectPortal,
  SelectViewport,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { SelectScrollDownButton, SelectScrollUpButton } from './index'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'item-aligned',
    align: 'center',
  },
)
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      :data-align-trigger="position === 'item-aligned'"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn( 'nds-select-content', props.class, )"
    >
      <SelectScrollUpButton />
      <!--
        O viewport fica como a lib o entrega: `role="presentation"`, sem
        `tabindex`. Foram medidas três saídas para o `scrollable-region-focusable`
        do axe, que aponta este elemento porque é ele que rola, e as três trocam
        uma violação por outra:

          `tabindex` mantendo `role="presentation"` → `presentation-role-conflict`;
          `tabindex` sem role                       → `aria-required-children`,
                                                      `<div>` focável não é filho
                                                      permitido de `listbox`;
          `tabindex` com `role="group"`             → válido, mas acrescenta um
                                                      grupo anônimo em volta de
                                                      TODA lista, que o leitor de
                                                      tela anuncia.

        A regra do axe isenta o popup do combobox justamente porque a lista já é
        operável por teclado; aqui o overflow mora um nó abaixo do popup e a
        isenção não alcança. As stories que terminam abertas com lista longa
        declaram o motivo em `parameters.a11y` — ver `wait-for-portal`.
      -->
      <SelectViewport
        :data-position="position"
        :class="cn( 'nds-select-viewport', )"
      >
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>
