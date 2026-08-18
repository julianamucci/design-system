<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

/**
 * `readonly`, `maxlength` e `rows` são props DECLARADAS, e não atributos
 * herdados.
 *
 * A tabela de props da docs page e os argTypes das stories já documentavam as
 * três como parte da API do componente; só que elas chegavam como atributo
 * solto — funcionavam em runtime pela herança, e não existiam para o tipo nem
 * para o painel de controles, que é onde a divergência aparecia. Declarar torna
 * a API documentada verdadeira; o `v-bind` explícito abaixo é obrigatório,
 * porque prop declarada sai da herança de atributos.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  maxlength?: number
  rows?: number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :rows="rows"
    :placeholder="placeholder"
    :class="cn('nds-textarea', props.class)"
  />
</template>
