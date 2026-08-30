<script setup lang="ts">
/**
 * Colapsável de chamada de ferramenta ou de raciocínio.
 *
 * `<details>` nativo, e não o Collapsible do sistema: aqui o conteúdo precisa
 * ser encontrável pela busca do navegador com a caixa fechada, e uma thread com
 * dezenas deles não paga JavaScript por mensagem.
 *
 * `data-state`, `data-call-id` e `open` chegam por atributo de passagem — a raiz
 * é única, então o Vue os aplica no `<details>` sem que este componente precise
 * declará-los. `open` fica FORA de controle depois da montagem: quem abre e
 * fecha é quem lê.
 */
defineProps<{
  kind: 'tool-call' | 'reasoning'
  summary: string
}>()
</script>

<template>
  <details :class="`nds-chat-${kind}`">
    <summary :class="`nds-chat-${kind}-summary`">
      <!-- A seta gira com o estado, pela folha. Decorativa: o que ela diz já
           está escrito no resumo, ao lado. -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :class="`nds-icon nds-chat-${kind}-icon`"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span>{{ summary }}</span>
    </summary>
    <div :class="`nds-chat-${kind}-body`">
      <slot />
    </div>
  </details>
</template>
