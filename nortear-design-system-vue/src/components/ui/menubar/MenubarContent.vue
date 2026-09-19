<script setup lang="ts">
import type { MenubarContentProps, PointerDownOutsideEvent } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  injectMenubarMenuContext,
  MenubarContent,
  MenubarPortal,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { injectMenubarCloseChannel } from './menubar.context'
import { useMenubarTabLeaves } from './tab-leaves-menu'

defineOptions({
  inheritAttrs: false,
})

/**
 * O recuo do painel de TOPO no eixo cruzado — decisão da dona em 2026-09-19,
 * medida nesta stack no mesmo dia.
 *
 * **O que se decide é o desenho**: o TEXTO do primeiro item alinha com o TEXTO
 * do gatilho da barra. A conta que o entrega está medida no vanilla, que é a
 * referência: borda do painel (1) + `padding` do painel (`--spacing-1`, 4) +
 * `padding-inline` do item (`--spacing-2`, 8) = 13, contra o `padding-inline`
 * do gatilho (`--spacing-3`, 12). Sobra exatamente a borda de 1px, e é ela que
 * o `alignOffset` desconta.
 *
 * Mesma família da D15 do submenu, com uma diferença que vale reparar: lá o
 * alinhamento pede −(borda + padding), porque o eixo é o VERTICAL e só o
 * padding do painel separa o topo da caixa do topo do item; aqui os dois
 * `padding-inline` se cancelam quase inteiros e sobra a borda.
 *
 * **Medido nesta stack** na `Playground`, no SEGUNDO gatilho da barra, texto
 * contra texto (`Range.selectNodeContents`), depois de `waitForAncorado` e do
 * fim das animações:
 *
 *   alignOffset   texto do 1º item − texto do gatilho
 *     0                  +1,08
 *    -1                   +0,08   ← alinha
 *    -4  (o de antes)     -2,92
 *
 * Ou seja: aqui a reka aplica o recuo DIRETO, e o número desta stack é o mesmo
 * das outras quatro. **Não é o caso do subpainel** — lá a lib já desconta borda
 * e padding sozinha, e por isso `MenubarSubContent` declara `0`. Que o mesmo
 * componente de duas libs irmãs se comporte diferente nos dois painéis é o
 * motivo de cada número ser medido e não deduzido.
 *
 * O `-4` que estava aqui vinha com um comentário afirmando este mesmo desenho,
 * e o comentário era falso: ele deixava o item 3px À ESQUERDA do gatilho.
 *
 * Quem reprova é a `Playground`, no último passo da play — e a tolerância dela
 * é 0,75 justamente porque `0` e `-1` ficam a 1px um do outro.
 */
const props = withDefaults(
  defineProps<MenubarContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'start',
    alignOffset: -1,
    sideOffset: 8,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// PATCH: a11y — Tab sai da barra pelo vizinho do gatilho, não pelo fim do documento (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture } = useMenubarTabLeaves()

/**
 * O motivo do fechamento, anotado para a barra (`menubar.context.ts`): Escape no
 * painel é `escape`; o ponteiro fora dele — inclusive no PRÓPRIO gatilho, que
 * fecha o menu aberto — é `overlay`.
 *
 * O ponteiro no gatilho de OUTRO menu da barra não anota: ele troca o menu
 * aberto, e a troca já sai como `overlay` pela barra. O painel emite o
 * `pointer-down-outside` DEPOIS do gatilho ter pedido a troca, e anotar ali
 * deixaria uma anotação pendurada até o próximo fechamento — que sairia com o
 * motivo errado, digamos `overlay` num item escolhido.
 *
 * O foco que sai também não anota: o Tab anota por conta própria, e o resto é
 * foco movido por código, que é `api`.
 */
const channel = injectMenubarCloseChannel()
const menu = injectMenubarMenuContext(null)

function onPointerDownOutside(event: PointerDownOutsideEvent) {
  const target = event.target instanceof Element ? event.target : null
  const trigger = target?.closest<HTMLElement>('[data-slot="menubar-trigger"]')
  if (trigger && trigger !== menu?.triggerElement.value) return
  channel.note('overlay')
}
</script>

<template>
  <MenubarPortal>
    <MenubarContent
      data-slot="menubar-content"
      v-bind="{ ...$attrs, ...forwardedProps }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
      @pointer-down-outside="onPointerDownOutside"
    >
      <slot />
    </MenubarContent>
  </MenubarPortal>
</template>
