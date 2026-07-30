<script setup lang="ts">
/**
 * A tokenização vem de `@shared/primitives/code-highlight` (TS puro) e devolve
 * dados, não HTML — cada span vira um nó do template, então não há `v-html` e
 * nada a sanitizar. Cores, layout e destaque vivem em `nds/code-block.css`.
 */
import type { HTMLAttributes } from 'vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { copyText } from '@shared/primitives/clipboard'
import {
  highlightCode,
  parseLineRanges,
  resolveLanguage,
  type LineRangeInput,
} from '@shared/primitives/code-highlight'

const props = withDefaults(defineProps<{
  /** Código a exibir. É exatamente o que o botão copiar coloca no clipboard. */
  code: string
  /** Linguagem ou extensão (`tsx`, `vue`, `.css`, `bash`). Desconhecida → sem cor. */
  language?: string
  /** Rótulo do header, normalmente o nome do arquivo. */
  title?: string
  /** Numeração de linha. */
  showLineNumbers?: boolean
  /** Linhas destacadas: `[3, '5-7']` ou `'3, 5-7'`. */
  highlightLines?: LineRangeInput
  /** Observações abaixo do código. Também aceita o slot `footer`. */
  footer?: string
  copyLabel?: string
  copiedLabel?: string
  class?: HTMLAttributes['class']
}>(), {
  showLineNumbers: true,
  copyLabel: 'Copiar código',
  copiedLabel: 'Copiado!',
})

const lines = computed(() => highlightCode(props.code, resolveLanguage(props.language)))
const highlighted = computed(() => parseLineRanges(props.highlightLines))

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

// Limpa o timer no unmount: sem isso, desmontar dentro dos 2s mexe num ref de
// componente já destruído.
onBeforeUnmount(() => clearTimeout(timer))

async function handleCopy() {
  // copyText já cobre o fallback fora de contexto seguro; false = não copiou,
  // e nesse caso não confirmamos nada. Chamar navigator.clipboard direto deixa
  // o botão inerte em http sem localhost, onde as outras stacks ainda copiam.
  if (!(await copyText(props.code))) return
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div
    data-slot="code-block"
    :data-numbered="showLineNumbers ? 'true' : 'false'"
    :class="cn('nds-code-block-root', props.class)"
  >
    <div class="nds-code-block-header">
      <span
        v-if="title"
        class="nds-code-block-title"
      >{{ title }}</span>
      <span class="nds-code-block-actions">
        <span
          v-if="copied"
          class="nds-code-block-copy-label"
          aria-hidden="true"
        >{{ copiedLabel }}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot="code-block-copy"
          :aria-label="copied ? copiedLabel : copyLabel"
          @click="handleCopy"
        >
          <Check
            v-if="copied"
            class="nds-icon"
            aria-hidden="true"
          />
          <Copy
            v-else
            class="nds-icon"
            aria-hidden="true"
          />
        </Button>
      </span>
    </div>

    <!-- aria-live fora do botão: leitor de tela anuncia a confirmação sem que o
         rótulo do botão mude no meio da interação. -->
    <span
      class="nds-sr-only"
      role="status"
      aria-live="polite"
    >{{ copied ? copiedLabel : '' }}</span>

    <div
      class="nds-code-block-scroll"
      tabindex="0"
    >
      <pre class="nds-code-block-pre"><code class="nds-code-block-code"><span
        v-for="(spans, i) in lines"
        :key="i"
        class="nds-code-block-line"
        :data-highlighted="highlighted.has(i + 1) ? 'true' : undefined"
      ><span
        class="nds-code-block-gutter"
        aria-hidden="true"
      >{{ i + 1 }}</span><span class="nds-code-block-text"><template
        v-for="(span, j) in spans"
        :key="j"
      ><span
        v-if="span.token !== 'plain'"
        :data-token="span.token"
      >{{ span.text }}</span><template v-else>{{ span.text }}</template></template><template v-if="spans.length === 0">
</template></span></span></code></pre>
    </div>

    <div
      v-if="footer || $slots.footer"
      class="nds-code-block-footer"
    >
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>
