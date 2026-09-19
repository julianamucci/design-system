<script setup lang="ts">
import type { MenubarTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { MenubarTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { injectMenubarCloseChannel } from './menubar.context'
import { useMenubarTabLeaves } from './tab-leaves-menu'

/**
 * REABRIR pelo teclado — o conserto que morava aqui SAIU em 2026-09-18, medido.
 *
 * O que havia: um ouvinte de `keydown` que, em Enter, Espaço e Seta-baixo,
 * esperava o painel montar e, se o foco tivesse ficado no gatilho, focava à mão
 * o primeiro `[role="menuitem"]` do painel. Ele nasceu em 2026-09-03 contra um
 * defeito real da lib daquela versão: a segunda abertura pelo mesmo gatilho
 * deixava o foco de fora, porque `wasKeyboardTriggerOpenRef` e a montagem do
 * painel não se encontravam no mesmo instante.
 *
 * Por que saiu, e como foi medido: plantando a REMOÇÃO e rodando o Playground,
 * cujo passo "Space também abre o gatilho" fecha com Escape e reabre — que é
 * exatamente o gesto para o qual o conserto foi escrito. A story passou sem
 * ele: a entrada da própria reka cobre o caminho hoje. Código morto que o
 * `vue-tsc`, o `eslint` e a suíte aceitavam em silêncio, porque um ouvinte que
 * não faz nada é um ouvinte válido.
 *
 * E o conserto carregava um defeito LATENTE, que é o que a §7 #10 do PRD leu
 * como divergência: ele procurava `[role="menuitem"]`, então num menu de
 * marcação ou de rádio não teria o que casar. A medição do mesmo dia mostrou
 * que o foco entra assim mesmo — a `States/CheckboxChecked` afirma isso agora,
 * num menu sem nenhum item de ação, e é ela que guarda o C1 para essa forma.
 */
const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

/**
 * Enter e Espaço no gatilho de um menu ABERTO o fecham (a lib alterna) — e isso
 * é sair sem decidir, `overlay`, o mesmo motivo do clique no gatilho aberto
 * (D18). O clique a barra já recebe anotado pelo painel
 * (`pointer-down-outside`); a tecla não passa por ele, então quem anota é o
 * gatilho. De CAPTURA: roda antes do ouvinte da lib, que é quem alterna.
 */
const channel = injectMenubarCloseChannel()

/**
 * E o TAB com o foco no gatilho do menu aberto — §7 #20 do PRD, medido em
 * navegador em 2026-09-18 e o único ponto em que esta stack saía do contrato.
 *
 * O estado é alcançável pelo PONTEIRO: um clique abre o menu e deixa o foco no
 * gatilho (pelo teclado o foco entra no painel, e aí quem decide o Tab é o
 * ouvinte de lá). Antes deste conserto o Tab daqui não era visto por ninguém: o
 * `useMenubarTabLeaves` é ouvinte de CAPTURA no CONTEÚDO, e uma tecla apertada
 * no gatilho nunca chega a um painel que vive em portal. A reka fechava por
 * focus-out sem anotar nada, e `closeReasonFor` caía no `api` que sobra — a
 * barra dizia "o código fechou" para um gesto que é saída sem decisão.
 *
 * O mecanismo é o MESMO do painel, e de propósito: consome a tecla, calcula o
 * ponto de tabulação vizinho do gatilho, anota `overlay` e move o foco (sem
 * vizinho, fecha pela raiz e o foco volta ao gatilho). Declarado, porque é
 * divergência de MECÂNICA e não de contrato: react e angular não consomem o
 * keydown e chegam ao mesmo fim pelo focus-out da lib; o vanilla consome, como
 * aqui. O que as cinco têm igual é o observável — fecha, `overlay`, e o foco
 * segue do vizinho da BARRA.
 *
 * A guarda de `aria-expanded` é o que separa este gesto do Tab comum: com a
 * barra fechada o gatilho é um ponto de tabulação como outro qualquer, e
 * sequestrar a tecla ali seria defeito, não correção.
 */
// PATCH: a11y — Tab no gatilho aberto fecha com `overlay` e sai pelo vizinho da barra (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture: onTabLeaves } = useMenubarTabLeaves()

function onTriggerKeydownCapture(event: KeyboardEvent) {
  const trigger = event.currentTarget as HTMLElement | null
  if (trigger?.getAttribute('aria-expanded') !== 'true') return
  if (event.key === 'Enter' || event.key === ' ') {
    channel.note('overlay')
    return
  }
  onTabLeaves(event)
}
</script>

<template>
  <MenubarTrigger
    data-slot="menubar-trigger"
    v-bind="forwardedProps"
    :class="cn('nds-menubar-trigger', props.class)"
    @keydown.capture="onTriggerKeydownCapture"
  >
    <slot />
  </MenubarTrigger>
</template>
