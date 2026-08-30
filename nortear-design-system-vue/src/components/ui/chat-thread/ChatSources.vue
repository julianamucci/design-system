<script setup lang="ts">
/**
 * As citações da resposta.
 *
 * A numeração é do CONTEÚDO — é por ela que o texto se refere à fonte —, então
 * vem do `<ol>`, e não de um `::before` decorativo.
 */
// No call site, e não atrás de um invólucro local: é o que faz a análise
// estática reconhecer a validação onde ela acontece.
import { isSafeUrl } from '@shared/primitives/markdown-ast'
import type { ChatSource } from './index'

defineProps<{
  sources: ChatSource[]
  title: string
}>()
</script>

<template>
  <div>
    <p class="nds-chat-message-header">
      {{ title }}
    </p>
    <ol class="nds-chat-sources">
      <li
        v-for="(source, i) in sources"
        :key="source.url"
      >
        <!-- A fonte vem de quem gerou a resposta, e endereço vindo dali é
             ENTRADA, não constante: `javascript:` num `href` executa. Sem
             protocolo seguro a fonte continua legível e deixa de ser clicável —
             a mesma decisão do Markdown, que descarta o endereço e preserva o
             texto. Como vira `<span>`, ela também sai do percurso do teclado. -->
        <a
          v-if="isSafeUrl(source.url)"
          class="nds-chat-source"
          :href="source.url"
          rel="noreferrer"
        >
          <span class="nds-chat-source-index">{{ i + 1 }}</span>{{ source.title }}
        </a>
        <span
          v-else
          class="nds-chat-source"
          data-unsafe=""
        >
          <span class="nds-chat-source-index">{{ i + 1 }}</span>{{ source.title }}
        </span>
      </li>
    </ol>
  </div>
</template>
