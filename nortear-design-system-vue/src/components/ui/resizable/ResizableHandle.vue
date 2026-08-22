<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { onMounted, onUpdated, ref } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SplitterResizeHandle, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<SplitterResizeHandleProps & { class?: HTMLAttributes['class'], withHandle?: boolean }>()
const emits = defineEmits<SplitterResizeHandleEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'withHandle')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const punho = ref<{ $el?: HTMLElement } | null>(null)

/**
 * `aria-orientation` no divisor.
 *
 * O primitivo de painéis publica o eixo só como `data-orientation`, e nenhum
 * `aria-orientation` — o `role="separator"` saía sem eixo para o leitor de
 * tela, contrariando o que a documentação promete e o que as outras stacks
 * entregam. A sonda mediu `aria-orientation: null` aqui e preenchido nas outras
 * quatro; nenhuma story olhava para isso.
 *
 * A INVERSÃO é intencional: `data-orientation` traz a direção do GRUPO, e o
 * divisor de um grupo horizontal é uma linha VERTICAL.
 */
function sincronizarEixo(): void {
  const el = punho.value?.$el
  if (!el) return
  const ofGroup = el.getAttribute('data-orientation')
  if (ofGroup) el.setAttribute('aria-orientation', ofGroup === 'horizontal' ? 'vertical' : 'horizontal')
}

onMounted(sincronizarEixo)
onUpdated(sincronizarEixo)
</script>

<template>
  <SplitterResizeHandle
    ref="punho"
    data-slot="resizable-handle"
    v-bind="forwarded"
    :class="cn('nds-resizable-handle', props.class)"
  >
    <template v-if="props.withHandle">
      <div class="nds-resizable-grip-bar">
        <slot />
      </div>
    </template>
  </SplitterResizeHandle>
</template>
