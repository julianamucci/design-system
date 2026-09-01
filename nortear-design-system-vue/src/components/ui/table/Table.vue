<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * Nome acessível do container que rola. SEM PADRÃO, de propósito.
   *
   * O container é o WRAPPER, e não a `<table>`: são elementos diferentes e cada um
   * tem o seu nome. Por isso a prop tem nome próprio e não é `aria-label` — um
   * `aria-label` escrito aqui nomeia a TABELA, que é o comportamento certo e que
   * não se quer roubar. O wrapper é o que quem monta não alcança, e é ele que entra
   * na ordem de tabulação.
   *
   * O nome é do CONTEÚDO ("Faturas de 2026"), e o design system não tem como
   * sabê-lo. Padrão genérico ("Tabela") anunciaria sem informar: quem chegou por Tab
   * já sabe que rola, o que não sabe é o que rola. Sem nome NÃO emitimos papel
   * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe acusa
   * `aria-prohibited-attr`.
   *
   * `group` e não `region`: `region` com nome vira marco de página, e uma tela de
   * relatório empilha várias tabelas — seriam vários marcos onde não há várias
   * seções. Quem quiser marco envolve a tabela num `<section>` nomeado.
   */
  regionLabel?: string
}>()
</script>

<template>
  <!--
    O wrapper tem `overflow-x: auto` (.nds-table-wrapper): quando a tabela é mais
    larga que o container ele vira região rolável e precisa ser alcançável pelo
    teclado — WCAG 2.1.1 / axe scrollable-region-focusable. Mesmo tratamento do
    CodeBlock (.nds-code-block-scroll).
  -->
  <div
    data-slot="table-container"
    class="nds-table-wrapper"
    tabindex="0"
    :role="props.regionLabel ? 'group' : undefined"
    :aria-label="props.regionLabel"
  >
    <table
      data-slot="table"
      :class="cn('nds-table', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
