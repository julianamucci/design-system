<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useCurrentElement } from '@vueuse/core'
import { Separator } from 'reka-ui'
import { ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand } from './index'

const props = withDefaults(
  defineProps<SeparatorProps & { class?: HTMLAttributes['class'] }>(),
  { decorative: true },
)

const delegatedProps = reactiveOmit(props, 'class')

const { filterState } = useCommand()

const separatorRef = ref()
const element = useCurrentElement(separatorRef)
const hasBothSides = ref(true)

const isSeparator = (el: Element) => el.getAttribute('data-slot') === 'command-separator'

/**
 * O traço aparece só se houver comando visível dos DOIS lados dele — a mesma
 * regra do Vanilla, que desenha o traço entre blocos e não o desenha quando um
 * dos blocos sumiu no filtro.
 *
 * Uma passada pelos irmãos, em ordem: o traço que chega depois de conteúdo
 * visível vira candidato, e só é mostrado se aparecer conteúdo visível depois
 * dele antes do próximo candidato. Com três blocos e o do meio vazio, sobra UM
 * traço entre o primeiro e o terceiro — e não dois colados, nem nenhum.
 *
 * "Visível" é o grupo sem `hidden` (o `CommandGroup` se esconde quando nenhum
 * comando dele casa) e o comando solto que continua montado.
 */
function isShown(self: Element): boolean {
  const siblings = self.parentElement ? Array.from(self.parentElement.children) : []
  let contentSinceCandidate = false
  let candidate: Element | null = null
  for (const el of siblings) {
    if (isSeparator(el)) {
      if (contentSinceCandidate) {
        candidate = el
        contentSinceCandidate = false
      }
      continue
    }
    if ((el as HTMLElement).hidden) continue
    if (candidate) {
      if (candidate === self) return true
      candidate = null
    }
    contentSinceCandidate = true
  }
  return false
}

// `flush: 'post'`: a leitura é dos irmãos JÁ atualizados pelo filtro — grupo
// escondido e comando desmontado só existem no DOM depois do patch.
watch(
  [element, () => filterState.search, () => filterState.filtered.count],
  () => {
    const el = element.value
    if (el instanceof Element) hasBothSides.value = isShown(el)
  },
  { flush: 'post', immediate: true },
)
</script>

<!--
  Divisor DECORATIVO, e não `role="separator"`.

  O primitivo desta stack emite `role="separator"` por padrão, e `separator` não
  é filho permitido de `role="listbox"` — o axe reprova por
  `aria-required-children`. A linha de 1px entre grupos não carrega informação
  (quem separa semanticamente é o `role="group"` de cada `CommandGroup`), então
  ela sai da árvore de acessibilidade: `decorative` devolve `role="none"` e o
  `aria-hidden` fecha o caso, que é o mesmo tratamento das outras stacks.

  E ele SOME quando o filtro esvazia um dos lados: um traço sem nada embaixo (ou
  em cima) não separa coisa nenhuma, e sobrava solto na lista. Quem esconde é o
  atributo `hidden` — a folha não dá `display` ao separador, então o do agente
  de usuário vale.
-->
<template>
  <Separator
    ref="separatorRef"
    data-slot="command-separator"
    v-bind="delegatedProps"
    :aria-hidden="decorative ? 'true' : undefined"
    :hidden="hasBothSides ? undefined : true"
    :class="cn('nds-command-separator', props.class)"
  >
    <slot />
  </Separator>
</template>
