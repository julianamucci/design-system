<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { InputGroupAlign } from './index'
import { cn } from '@/lib/utils'

/**
 * O compartimento do acompanhamento — ícone, texto, atalho ou botão.
 *
 * Decisão 3: O ADDON NÃO DECLARA PAPEL. Havia um `role="group"` aqui, e ele
 * saiu: um agrupamento SEM NOME aninhado dentro do grupo de verdade acrescenta
 * um degrau que anuncia "grupo" e não informa nada. A folha já o trata como
 * decoração (`cursor: text`, `user-select: none`).
 *
 * Decisão 4: CLICAR NO ADDON LEVA O FOCO AO CAMPO, e isso NÃO faz do addon um
 * controle. É atalho de PONTEIRO para o que o campo já oferece ao teclado: quem
 * navega por Tab chega ao campo direto, e não perde função nenhuma por o addon
 * não ser focável. Por isso ele não recebe `tabindex` — parada de tabulação que
 * não leva a lugar nenhum foi o custo declarado do `stepper`.
 */
const props = withDefaults(defineProps<{
  align?: InputGroupAlign
  class?: HTMLAttributes['class']
}>(), {
  align: 'inline-start',
})

/** Seletor da moldura, o ponto de partida do atalho de ponteiro. */
const GROUP_SELECTOR = '[data-slot="input-group"]'

/** Classe do campo interno — o gancho que a folha usa para acender a moldura. */
const CONTROL_CLASS = 'nds-input-group-control'

/**
 * Correção dupla, e as duas mudam o comportamento:
 *
 *  • a busca é pela CLASSE do controle, e não pelo elemento `input` — sem isso
 *    o atalho não alcança `<textarea>`, e a composição de área de texto fica
 *    sem ele (decisão 4);
 *  • o ponto de partida é a MOLDURA por `closest`, e não `parentElement`, que
 *    quebra assim que alguém aninha um wrapper entre o addon e o grupo.
 *
 * O `@click` de quem compõe continua valendo: o Vue ACUMULA o ouvinte do
 * template com o que chega por herança de atributos, então não há nada a
 * repassar à mão aqui.
 */
function focusControlFromAddon(event: MouseEvent) {
  // Decisão 5: clique em botão é do botão. Sem esta guarda, apertar "limpar"
  // devolveria o foco ao campo no meio da ação, e o botão perderia o próprio.
  const target = event.target as Element | null
  if (target?.closest('button')) return

  const addon = event.currentTarget as HTMLElement | null
  addon
    ?.closest(GROUP_SELECTOR)
    ?.querySelector<HTMLElement>(`.${CONTROL_CLASS}`)
    ?.focus()
}
</script>

<template>
  <div
    data-slot="input-group-addon"
    :data-align="props.align"
    :class="cn('nds-input-group-addon', props.class)"
    @click="focusControlFromAddon"
  >
    <slot />
  </div>
</template>
