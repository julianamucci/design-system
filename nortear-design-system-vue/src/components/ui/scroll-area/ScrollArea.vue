<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline — 60 alturas cravadas, 20 valores distintos para dizer a mesma coisa.
// Altura fora da escada continua possível pela custom property `--box-height`,
// que a folha governa.
type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = defineProps<ScrollAreaRootProps & {
  class?: HTMLAttributes['class']
  size?: ScrollAreaSize
  /**
   * Nome acessível da região rolável. SEM PADRÃO, de propósito.
   *
   * O design system não tem como saber o que rola aqui — este é o container
   * genérico, e o nome é do CONTEÚDO que quem monta pôs dentro. Um padrão
   * genérico ("Área de rolagem") anunciaria sem informar: quem chegou por Tab
   * já sabe que rola, o que não sabe é onde entrou. Sem nome NÃO emitimos papel
   * nenhum: `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `role="group"` e NÃO `region`, e esta escolha MUDOU — medida, não herdada.
   * Até aqui esta fábrica emitia `region`, e três das cinco stacks não emitiam
   * nome nenhum. `region` é papel de MARCO: a especificação pede que ele fique
   * reservado a seções que a pessoa vá querer navegar diretamente, e um viewport
   * que rola é recurso de layout, não seção de conteúdo. Três medidas decidiram:
   *
   * 1. o próprio conteúdo compartilhado deste componente já ensinava o contrário
   *    (`accessibility.aria.label` manda pôr o `aria-label` no container PAI
   *    quando o ScrollArea define uma região) — implementação e documentação
   *    discordavam, e quem estava certo era a documentação;
   * 2. este é o primitivo mais repetido do sistema, e só as stories de
   *    composição nomeiam cinco instâncias — cinco marcos onde não há cinco
   *    seções;
   * 3. a story de composição põe uma área nomeada DENTRO de um `<nav>` que já
   *    carrega nome, o que produzia marco dentro de marco descrevendo o mesmo
   *    conteúdo.
   *
   * O prejuízo também é assimétrico: `group` de menos custa só a entrada na
   * lista de marcos, e o nome continua sendo anunciado ao focar; `region` de
   * mais suja a navegação por marcos, que é mecanismo primário de quem lê
   * ouvindo, e quem consome não tinha como desligar. Quem quiser marco de
   * verdade envolve a área num `<section>` ou `<nav>` nomeado — que é
   * exatamente o que a documentação já manda e o que as stories já fazem.
   *
   * Quando a página tem mais de uma área nomeada, os nomes precisam ser
   * DISTINTOS: dois grupos de mesmo nome são indistinguíveis para quem navega
   * ouvindo.
   */
  /**
   * Declarado em camelCase de propósito. O Vue CAMELIZA o nome de toda prop
   * declarada, então uma prop escrita `'aria-label'` passa a viver em
   * `props.ariaLabel` — e `props['aria-label']` devolve `undefined` para
   * sempre. Quem compõe continua escrevendo `aria-label="..."` no template: o
   * Vue casa o atributo com esta prop, e o markup no DOM não muda.
   */
  ariaLabel?: string
}>()

const delegatedProps = reactiveOmit(props, 'class', 'size', 'ariaLabel')
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    :data-size="size"
    v-bind="delegatedProps"
    :class="cn('nds-scroll-area', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      tabindex="0"
      class="nds-scroll-area-viewport"
      :role="props.ariaLabel ? 'group' : undefined"
      :aria-label="props.ariaLabel"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
