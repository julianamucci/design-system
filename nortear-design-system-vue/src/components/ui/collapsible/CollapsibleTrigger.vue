<script setup lang="ts">
import type { CollapsibleTriggerProps } from 'reka-ui'
import { onMounted, ref } from 'vue'
import { CollapsibleTrigger, injectCollapsibleRootContext } from 'reka-ui'

/**
 * O gatilho do disclosure — botão de verdade, com `aria-expanded` e o nome do
 * painel que ele controla.
 *
 * O `aria-controls` é ESCRITO AQUI, e a razão é medida. Quem cria o id do
 * painel é o CONTEÚDO, no próprio `setup`, gravando-o numa propriedade de
 * STRING SIMPLES do contexto da raiz — não numa `ref`. O gatilho monta ANTES do
 * conteúdo: ele renderiza `aria-controls=""` e nunca mais volta ao assunto,
 * porque uma string comum não notifica ninguém. O atributo só aparecia quando
 * outro motivo forçava um novo render — abrir ou fechar —, e foi por isso que
 * as stories que alternam antes de medir passavam enquanto uma composição de
 * bloco já aberto reprovava: `aria-controls=""` no primeiro quadro.
 *
 * A `ref` local relê o contexto depois da montagem, quando o painel já existe,
 * e o valor entra no atributo no mesmo tique. Vale como atributo herdado, que é
 * aplicado DEPOIS das próprias ligações da lib e por isso vence a que veio
 * vazia.
 */
const props = defineProps<CollapsibleTriggerProps>()

const rootContext = injectCollapsibleRootContext()
const contentId = ref(rootContext.contentId)

onMounted(() => {
  contentId.value = rootContext.contentId
})
</script>

<template>
  <CollapsibleTrigger
    data-slot="collapsible-trigger"
    v-bind="props"
    :aria-controls="contentId || undefined"
  >
    <slot />
  </CollapsibleTrigger>
</template>
