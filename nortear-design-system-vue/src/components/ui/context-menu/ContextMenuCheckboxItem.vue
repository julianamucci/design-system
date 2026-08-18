<script setup lang="ts">
import type { ContextMenuCheckboxItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'
import {
  ContextMenuCheckboxItem,
  ContextMenuItemIndicator,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * O item de marcação expõe `checked` / `update:checked`, e não o `modelValue` da
 * lib.
 *
 * Não é preferência de nomenclatura: `checked` é o que a docs page deste stack
 * documenta na tabela de props, é o que as outras stacks expõem, e era o que as
 * stories e os exemplos da própria docs page já escreviam. Só que a lib ignora
 * prop desconhecida em silêncio — então o `:checked` de todo mundo caía no vazio,
 * o item nascia sempre desmarcado e o `@update:checked` nunca disparava. Nada
 * ficava vermelho: o menu abria, o item aparecia, e o estado não existia.
 *
 * A tradução mora aqui para que a API documentada passe a ser verdade.
 */
const props = defineProps<
  Omit<ContextMenuCheckboxItemProps, 'modelValue'> & {
    checked?: boolean | 'indeterminate'
    class?: HTMLAttributes['class']
  }
>()

/**
 * A ENTRADA é de três estados; a SAÍDA é de dois.
 *
 * `checked` aceita `'indeterminate'` porque o estado misto é um valor que o
 * consumidor entrega. O evento não: ao clicar, o item misto resolve para
 * marcado e o item de dois estados alterna — a lib declara o próprio payload
 * como `boolean` justamente por isso. Declarar a saída como três estados era
 * mais larga que a realidade e que a lib, e obrigava quem escuta o evento a
 * tratar um `'indeterminate'` que nunca chega — numa comparação frouxa ele
 * passaria por verdadeiro.
 */
const emits = defineEmits<{
  'update:checked': [value: boolean]
  select: [event: Event]
}>()

const delegatedProps = reactiveOmit(props, 'class', 'checked')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ContextMenuCheckboxItem
    data-slot="context-menu-checkbox-item"
    v-bind="forwarded"
    :model-value="props.checked"
    :class="cn('nds-dropdown-menu-checkbox-item', props.class)"
    @update:model-value="emits('update:checked', $event)"
    @select="emits('select', $event)"
  >
    <span class="nds-dropdown-menu-item-indicator">
      <ContextMenuItemIndicator>
        <slot name="indicator-icon">
          <CheckIcon />
        </slot>
      </ContextMenuItemIndicator>
    </span>
    <slot />
  </ContextMenuCheckboxItem>
</template>
