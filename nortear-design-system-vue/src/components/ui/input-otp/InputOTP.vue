<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { OTPInputEmits, OTPInputProps } from 'vue-input-otp'
import { reactiveOmit } from '@vueuse/core'
import { useForwardPropsEmits } from 'reka-ui'
import { computed, onMounted, ref } from 'vue'
import { OTPInput, REGEXP_ONLY_DIGITS } from 'vue-input-otp'
import { cn } from '@/lib/utils'

/**
 * A lib declara a prop em MINÚSCULAS (`maxlength`, `autofocus`). O nome
 * documentado no conteúdo compartilhado — e o que qualquer pessoa escreve — é
 * `maxLength`, que em template vira `:max-length`. Vue cameliza para
 * `maxLength`, não encontra prop com esse nome, e o valor cai em `$attrs`.
 *
 * O efeito era silencioso e total: `Array.from({ length: Number(undefined) })`
 * devolve lista vazia, então `slots` chegava vazio ao escopo do slot padrão e
 * o campo montava com ZERO caixas — sem erro, sem aviso, e com a suíte verde
 * porque as plays conferiam o `<input>` interno, que continua funcionando.
 * O limite de caracteres e o evento `complete` também morriam junto
 * (`slice(0, undefined)` não corta; `length < undefined` é sempre falso).
 *
 * Declarar os dois nomes e normalizar aqui é o que impede o mesmo erro de
 * voltar na próxima página de documentação escrita a partir da tabela de props.
 */
const props = defineProps<
  Partial<OTPInputProps> & {
    maxLength?: number
    autoFocus?: boolean
    class?: HTMLAttributes['class']
  }
>()

const emits = defineEmits<OTPInputEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'maxLength', 'autoFocus')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const maxlength = computed(() => Number(props.maxLength ?? props.maxlength ?? 6))
const autofocus = computed(() => props.autoFocus ?? props.autofocus ?? false)

/**
 * Sem `pattern` a lib não filtra caractere nenhum, e `inputmode="numeric"` é só
 * uma dica de teclado de software: num teclado físico a letra entrava num
 * código de seis DÍGITOS sem nada recusá-la. O conteúdo compartilhado já
 * documentava "apenas dígitos" como padrão, e as stacks sem lib filtram — aqui
 * o default passa a cumprir o que está escrito.
 */
const pattern = computed(() => props.pattern ?? REGEXP_ONLY_DIGITS)

/**
 * `autofocus` chega ao `<input>` como ATRIBUTO HTML, e o atributo só age no
 * carregamento do documento — num componente montado depois ele não foca nada,
 * em silêncio. Quem pede foco inicial precisa de uma chamada de verdade.
 */
const raiz = ref<{ $el?: HTMLInputElement | null } | null>(null)
onMounted(() => {
  if (autofocus.value) raiz.value?.$el?.focus()
})
</script>

<template>
  <OTPInput
    ref="raiz"
    v-slot="slotProps"
    v-bind="(forwarded as any)"
    :maxlength="maxlength"
    :autofocus="autofocus"
    :pattern="pattern"
    :container-class="cn('nds-input-otp-container', props.class)"
    data-slot="input-otp"
    :spellcheck="false"
    class="nds-input-otp-input"
  >
    <slot v-bind="slotProps" />
  </OTPInput>
</template>
