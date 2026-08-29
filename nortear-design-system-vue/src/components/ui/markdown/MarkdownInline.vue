<script setup lang="ts">
/**
 * O conteúdo de frase de um bloco: texto, ênfase, código curto, link e imagem.
 *
 * Componente próprio porque a estrutura é RECURSIVA — ênfase dentro de link,
 * link dentro de ênfase — e no Vue a recursão de template pede um componente
 * que possa se referenciar pelo próprio nome.
 *
 * Nada de `v-html` aqui: cada nó vira elemento do template e cada texto vira
 * interpolação. Não há superfície de XSS a sanitizar porque não há caminho para
 * marcação.
 */
import { isSafeUrl, type MdInline } from '@shared/primitives/markdown-ast'

const props = defineProps<{
  nodes: MdInline[]
  allowedProtocols?: readonly string[]
  onLinkClick?: (url: string) => void
}>()

/** Endereço absoluto sai do site — não vaze o referenciador para ele. */
function isExternal(url: string): boolean {
  return /^https?:/i.test(url)
}

/**
 * O parser já recusou o que não presta — link de esquema fora da lista nem
 * chega aqui como link. A pergunta é feita de novo no ponto em que o endereço
 * encosta no DOM: assim a garantia não depende de quem chamou o parser antes, e
 * fica onde uma varredura de segurança consegue vê-la.
 */
function safeHref(url: string): string | undefined {
  return isSafeUrl(url, props.allowedProtocols) ? url : undefined
}

function handleLink(event: MouseEvent, url: string) {
  if (!props.onLinkClick) return
  // Com ouvinte, quem navega é a aplicação — é o que permite empurrar a rota
  // sem recarregar. O `href` continua ali, então abrir em outra aba e copiar o
  // endereço seguem funcionando.
  event.preventDefault()
  props.onLinkClick(url)
}
</script>

<template>
  <template
    v-for="(node, i) in props.nodes"
    :key="i"
  >
    <template v-if="node.type === 'text'">
      {{ node.value }}
    </template>

    <strong v-else-if="node.type === 'strong'">
      <MarkdownInline
        :nodes="node.children"
        :allowed-protocols="props.allowedProtocols"
        :on-link-click="props.onLinkClick"
      />
    </strong>

    <em v-else-if="node.type === 'emphasis'">
      <MarkdownInline
        :nodes="node.children"
        :allowed-protocols="props.allowedProtocols"
        :on-link-click="props.onLinkClick"
      />
    </em>

    <s v-else-if="node.type === 'delete'">
      <MarkdownInline
        :nodes="node.children"
        :allowed-protocols="props.allowedProtocols"
        :on-link-click="props.onLinkClick"
      />
    </s>

    <!--
      Duas classes: o desenho é o de `.nds-code-inline`, e a segunda só desfaz o
      `nowrap` dela — trecho longo de resposta precisa quebrar.
    -->
    <code
      v-else-if="node.type === 'inlineCode'"
      class="nds-code-inline nds-markdown-inline-code"
    >{{ node.value }}</code>

    <!--
      `title` fica de fora de propósito: ele só aparece ao pousar o ponteiro,
      então guardar informação ali é escondê-la de quem navega por teclado ou
      ouve a página.
    -->
    <a
      v-else-if="node.type === 'link'"
      class="nds-markdown-link"
      :href="safeHref(node.url)"
      :rel="isExternal(node.url) ? 'noreferrer' : undefined"
      @click="handleLink($event, node.url)"
    >
      <MarkdownInline
        :nodes="node.children"
        :allowed-protocols="props.allowedProtocols"
        :on-link-click="props.onLinkClick"
      />
    </a>

    <!--
      Descrição vazia deixa a imagem decorativa, e é o certo quando não há
      descrição: ler o endereço no lugar dela seria ruído. Escrever a descrição
      é de quem escreveu o texto.
    -->
    <img
      v-else-if="node.type === 'image'"
      class="nds-markdown-image"
      :src="safeHref(node.url)"
      :alt="node.alt"
      loading="lazy"
    >

    <br v-else-if="node.type === 'break'">
  </template>
</template>
