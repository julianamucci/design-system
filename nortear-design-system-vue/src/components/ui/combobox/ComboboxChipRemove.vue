<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { injectComboboxRootContext } from 'reka-ui'
import { computed, nextTick, useAttrs } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxChipContext, useComboboxContext } from './index'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * Frase que a região viva anuncia DEPOIS de remover ("Brasil removido").
   * Ausente, cai no nome acessível do próprio botão — que diz o comando, não o
   * que aconteceu.
   */
  removedAnnouncement?: string
}>()

const rootContext = injectComboboxRootContext()
const { value } = useComboboxChipContext()
const { announce } = useComboboxContext()
const attrs = useAttrs()

const disabled = computed(() => rootContext.disabled.value)

/*
 * O modelo da raiz é o ÚNICO dono do valor, então remover é escrever de volta
 * nele — não há segundo estado a sincronizar. Ver a nota de ponte em
 * `Combobox.vue`.
 *
 * A região viva anuncia `removedAnnouncement` — o que ACONTECEU, como nas
 * outras quatro stacks ("Brasil removido"). Sem ele sobra o nome acessível do
 * botão ("Remover Brasil"), que é o comando: lido depois que o chip sumiu, soa
 * como pedido pendente. O texto vem de fora porque quem
 * consome já o escreveu traduzido, e repeti-lo aqui criaria uma segunda fonte
 * de texto para dizer a mesma coisa.
 *
 * O foco volta ao campo de texto porque este botão desaparece no mesmo gesto —
 * sem isso o foco cairia no corpo do documento.
 */
function remove(): void {
  const current = rootContext.modelValue.value
  if (!Array.isArray(current)) return

  const fallback = attrs['aria-label']
  const message = props.removedAnnouncement ?? (typeof fallback === 'string' ? fallback : '')
  rootContext.modelValue.value = current.filter(entry => String(entry) !== value.value)
  if (message) announce(message)

  void nextTick(() => rootContext.inputElement.value?.focus())
}
</script>

<template>
  <button
    type="button"
    data-slot="combobox-chip-remove"
    :disabled="disabled"
    :class="cn('nds-combobox-chip-remove', props.class)"
    @click.stop="remove"
  >
    <slot>
      <XIcon aria-hidden="true" />
    </slot>
  </button>
</template>
