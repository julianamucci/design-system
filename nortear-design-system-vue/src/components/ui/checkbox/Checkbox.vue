<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon, MinusIcon } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & {
  class?: HTMLAttributes['class']
  /** Alias compatível com `<input type="checkbox" checked>`. Mapeia para defaultValue quando modelValue não está controlado. */
  checked?: boolean | 'indeterminate'
}>()
const emits = defineEmits<CheckboxRootEmits>()

// `disabled` sai da lista repassada: quando ele chega ao primitivo, o primitivo
// escreve o `disabled` NATIVO no <button>, e o controle some da ordem de
// tabulação. Ver o bloco de comentário no template.
const delegatedProps = reactiveOmit(props, 'class', 'checked', 'disabled')

const resolvedDefault = computed(() => {
  if (props.defaultValue !== undefined) return props.defaultValue
  if (props.checked !== undefined) return props.checked
  return undefined
})

const disabled = computed(() => props.disabled === true)

/**
 * Contém a ativação quando desabilitado.
 *
 * Aqui a causa é DIFERENTE da que apareceu no tabs, e medir antes foi o que
 * evitou o remendo errado: o `handleClick` do primitivo não tem guarda de
 * `disabled` nenhuma. O que impedia a alternância era só o atributo nativo — o
 * mesmo atributo que precisa sair para a caixa continuar alcançável. Tirá-lo
 * sem repor a guarda deixaria a caixa "desabilitada" alternando ao clique.
 *
 * `stopImmediatePropagation` é o canal certo, e não `preventDefault`: o
 * primitivo registra `onClick` no mesmo elemento, e o que salta um ouvinte irmão
 * é a parada imediata. Vale porque o runtime do Vue funde ouvintes do mesmo
 * evento numa LISTA e a percorre checando `_stopped` a cada passo, então parar
 * no primeiro item impede o segundo de rodar. Este handler chega pelos `$attrs`,
 * que o primitivo espalha ANTES do próprio `onClick` — a ordem da lista é o que
 * torna a contenção possível.
 *
 * Cobre o teclado junto: num <button> nativo o Espaço vira `click` no keyup.
 * O Enter já é cancelado pelo próprio primitivo.
 */
function conterAtivacao(evento: Event) {
  if (!disabled.value) return
  evento.preventDefault()
  evento.stopImmediatePropagation()
}

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :default-value="resolvedDefault"
    :class="cn('nds-checkbox', props.class)"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="conterAtivacao"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="nds-checkbox-indicator"
    >
      <slot v-bind="slotProps">
        <!-- O estado misto desenha um TRAÇO, não a marca de seleção: o fundo é
             o mesmo do marcado, então o desenho é a única coisa que distingue
             "alguns selecionados" de "todos selecionados". A sonda pegou esta
             stack exibindo a marca no misto. -->
        <MinusIcon v-if="slotProps.state === 'indeterminate'" />
        <CheckIcon v-else />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
