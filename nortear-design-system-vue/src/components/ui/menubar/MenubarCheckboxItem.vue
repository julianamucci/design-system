<script setup lang="ts">
import type { MenubarCheckboxItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon, MinusIcon } from 'lucide-vue-next'
import {
  MenubarCheckboxItem,
  MenubarItemIndicator,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

/**
 * O item de marcação expõe `checked` / `update:checked`, e não o `modelValue` da
 * lib.
 *
 * Não é preferência de nomenclatura: `checked` é o que a docs page deste stack
 * documenta, é o que as outras stacks expõem, e era o que as stories e os
 * exemplos da própria docs page já escreviam. Só que a lib ignora prop
 * desconhecida em silêncio — então o `:checked` de todo mundo caía no vazio, o
 * item nascia sempre desmarcado e o `@update:checked` nunca disparava. Nada
 * ficava vermelho na tela: o menu abria, o item aparecia, e o estado não
 * existia.
 *
 * A tradução mora aqui para que a API documentada passe a ser verdade.
 */
const props = defineProps<
  Omit<MenubarCheckboxItemProps, 'modelValue'> & {
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

/**
 * O símbolo do estado misto é TRAÇO, não tique.
 *
 * Tique quer dizer "marcado", e misto não é isso — é "alguns dos filhos". O
 * desenho vem da caixa de seleção do design system, que já resolve o misto com
 * um traço horizontal, e da composição equivalente no menu, que ramifica.
 *
 * A ramificação mora aqui, na composição, e não em CSS sobre
 * `[data-state="indeterminate"]`, por duas medições:
 *
 * 1. O indicador da lib não entrega o estado ao slot — e o item de marcação
 *    TAMBÉM não: o componente público repassa o slot padrão sem carga, mesmo o
 *    interno provendo `modelValue`. A única fonte de estado disponível é a
 *    própria prop `checked`, que é o valor entregue à lib como `model-value`.
 * 2. Por CSS os dois glifos precisariam existir no markup com um deles oculto —
 *    ou seja, um tique presente num estado que não é "marcado" —, e a regra
 *    moraria na folha compartilhada pelas cinco stacks, cujas árvores diferem.
 *    As demais resolvem o misto ramificando o markup; uma regra só de CSS
 *    criaria um segundo vocabulário para o mesmo estado.
 */
const misto = computed(() => props.checked === 'indeterminate')
</script>

<template>
  <MenubarCheckboxItem
    data-slot="menubar-checkbox-item"
    v-bind="forwarded"
    :model-value="props.checked"
    :class="cn('nds-dropdown-menu-checkbox-item', props.class)"
    @update:model-value="emits('update:checked', $event)"
    @select="emits('select', $event)"
  >
    <span class="nds-dropdown-menu-item-indicator">
      <MenubarItemIndicator>
        <slot name="indicator-icon">
          <MinusIcon v-if="misto" />
          <CheckIcon v-else />
        </slot>
      </MenubarItemIndicator>
    </span>
    <slot />
  </MenubarCheckboxItem>
</template>
