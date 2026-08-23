<script setup lang="ts">
import type { NavigationMenuListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuList, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NavigationMenuListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

/**
 * Setas movem o foco ao longo da barra; Home/End vão às pontas.
 *
 * A lib desta stack é a única das cinco que NÃO traz foco itinerante entre os
 * gatilhos — ela só trata a tecla de ENTRADA no painel já aberto. Sem isto, a
 * navegação por setas que o conteúdo compartilhado documenta (e que as outras
 * quatro cumprem) simplesmente não existia aqui, e nenhum teste apontava:
 * ninguém asserta tecla que a story não aperta.
 *
 * O eixo segue a orientação. Numa coluna, seta para o lado não move nada — e
 * seria justamente o gesto que o leitor de tela ensina a usar.
 */
function onKeyDown(event: KeyboardEvent): void {
  const list = event.currentTarget as HTMLElement | null
  if (!list) return

  const vertical = list.getAttribute('data-orientation') === 'vertical'
  const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
  const next = vertical ? 'ArrowDown' : 'ArrowRight'

  // Um controle por item da barra: o primeiro gatilho ou destino DENTRO de cada
  // `<li>`. Os destinos do painel não entram — no modo viewport eles vivem fora
  // da lista, e mesmo assim varrer a lista inteira os arrastaria para a ordem.
  const items = [...list.children]
    .map((li) =>
      li.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-trigger"], [data-slot="navigation-menu-link"]',
      ),
    )
    .filter((el): el is HTMLElement => el !== null)

  const current = items.indexOf(document.activeElement as HTMLElement)
  if (current === -1) return

  let destination = -1
  if (event.key === next) destination = (current + 1) % items.length
  else if (event.key === previous) destination = (current - 1 + items.length) % items.length
  else if (event.key === 'Home') destination = 0
  else if (event.key === 'End') destination = items.length - 1
  if (destination === -1) return

  // A tecla de ENTRADA no painel (Seta-para-baixo numa barra horizontal) é da
  // lib e só vale com o painel aberto — por isso o eixo daqui é o da barra, e
  // os dois nunca disputam a mesma tecla.
  event.preventDefault()
  items[destination]?.focus()
}
</script>

<template>
  <NavigationMenuList
    data-slot="navigation-menu-list"
    v-bind="forwardedProps"
    :class="cn( 'nds-navigation-menu-list', props.class, )"
    @keydown="onKeyDown"
  >
    <slot />
  </NavigationMenuList>
</template>
