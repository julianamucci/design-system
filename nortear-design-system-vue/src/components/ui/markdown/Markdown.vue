<script setup lang="ts">
/**
 * Documento em Markdown desenhado a partir de uma ÁRVORE, nunca de HTML.
 *
 * O texto vem de fora do código — numa interface conversacional, de um modelo —
 * e aqui não existe `v-html`: cada nó vira elemento do template e cada texto
 * vira interpolação. Não há superfície de XSS a sanitizar porque não há caminho
 * para marcação.
 *
 * A árvore e a decisão de streaming vêm de `@shared/primitives/markdown-ast`,
 * que as cinco stacks compartilham. O que é desta stack é só o desenho.
 * Estrutura e cores em `nds/markdown.css`.
 */
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import MarkdownBlock from './MarkdownBlock.vue'
import { parseForRender, type MdBlockKind } from '@shared/primitives/markdown-ast'

const props = withDefaults(defineProps<{
  /** O texto em Markdown. Vem de fora do código e é tratado como não confiável. */
  content: string
  /** Ligue enquanto o texto ainda chega. */
  streaming?: boolean
  /** Quais blocos podem ser estruturados. O que fica de fora vira texto. */
  allow?: readonly MdBlockKind[]
  /** Esquemas de endereço aceitos em link e imagem. */
  allowedProtocols?: readonly string[]
  class?: HTMLAttributes['class']
}>(), {
  streaming: false,
})

/**
 * O clique num link, com o endereço já validado.
 *
 * Evento, e não prop de callback: é a forma que quem escreve Vue espera
 * (`@link-click`). Divergência de API entre frameworks não se "alinha" — cada
 * stack usa a sua, e o conteúdo compartilhado descreve o CONCEITO.
 *
 * Para dentro ele volta a ser função: emit não atravessa componente aninhado, e
 * o desenho é recursivo.
 */
const emit = defineEmits<{ linkClick: [url: string] }>()

const handleLinkClick = (url: string) => emit('linkClick', url)

const tree = computed(() =>
  parseForRender(props.content, {
    streaming: props.streaming,
    allow: props.allow,
    allowedProtocols: props.allowedProtocols,
  }),
)
</script>

<template>
  <!--
    `aria-busy` enquanto gera, para quem ouve saber que o conteúdo ainda muda.

    E NÃO é região viva: anunciar a cada trecho tornaria a leitura impossível. A
    resposta é anunciada uma vez, inteira, quando termina — que é o que o leitor
    de tela faz sozinho ao encontrar o documento parado.
  -->
  <div
    data-slot="markdown"
    :class="cn('nds-markdown', props.class)"
    :data-streaming="String(props.streaming)"
    :data-allow="props.allow ? props.allow.join(' ') : undefined"
    :aria-busy="props.streaming ? 'true' : undefined"
  >
    <MarkdownBlock
      v-for="(node, i) in tree.children"
      :key="i"
      :node="node"
      :allowed-protocols="props.allowedProtocols"
      :on-link-click="handleLinkClick"
    />
  </div>
</template>
