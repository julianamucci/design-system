<script setup lang="ts">
import type { DropdownMenuCheckboxItemEmits, DropdownMenuCheckboxItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon, MinusIcon } from 'lucide-vue-next'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DropdownMenuCheckboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * O símbolo do estado misto é TRAÇO, não tique.
 *
 * Tique quer dizer "marcado", e misto não é isso — é "alguns dos filhos". Ver a
 * nota longa no item de marcação da barra de menus: o indicador da lib não
 * entrega o estado ao slot, o item público também não, e por isso a única fonte
 * é o valor que este componente já recebe.
 */
const misto = computed(() => props.modelValue === 'indeterminate')

/**
 * Alternar NÃO fecha o menu — como no vanilla e no react.
 *
 * A reka fecha em toda escolha, inclusive nos itens de marcação: o `MenuItem`
 * emite `select` e, no tique seguinte, chama `rootContext.onClose()` a menos que
 * o evento tenha voltado com `preventDefault`. Isso ficou escondido enquanto a
 * folha animava a saída: o painel seguia montado durante a animação e a play
 * que conferia "continua aberto" passava dentro dessa janela. Sem a animação
 * (D5), o menu sumia a cada marcação.
 *
 * Quem consome ouve `select` pelo `forwarded`, que o Vue soma ANTES deste
 * ouvinte — o evento chega intacto, e o `preventDefault` só diz à lib para não
 * fechar. A alternância em si não depende dele: a lib troca o valor de qualquer
 * jeito.
 */
// PATCH: bugfix — marcar não fecha o menu, como no vanilla (ver PATCHES.md#vue-menu-select-keeps-open)
function keepMenuOpen(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <DropdownMenuCheckboxItem
    data-slot="dropdown-menu-checkbox-item"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-checkbox-item', props.class)"
    @select="keepMenuOpen"
  >
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="dropdown-menu-checkbox-item-indicator"
    >
      <DropdownMenuItemIndicator>
        <slot name="indicator-icon">
          <MinusIcon v-if="misto" />
          <CheckIcon v-else />
        </slot>
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuCheckboxItem>
</template>
