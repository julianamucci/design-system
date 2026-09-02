<script setup lang="ts">
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'
import { TooltipRoot, useForwardPropsEmits } from 'reka-ui'
//
// ─── Acessibilidade: a decisão, medida nas cinco stacks em 2026-09-02 ────────
//
// 1. Abre por FOCO além de ponteiro, e o foco abre sem espera (WCAG 2.1.1).
// 2. Escape fecha sem mover o foco (WCAG 1.4.13, Dismissible).
// 3. Pairável e persistente por COORDENADA: a folha dá `pointer-events: none`
//    ao balão, então quem segura a abertura é a área de tolerância entre
//    gatilho e balão, e não um hover no nó (WCAG 1.4.13, Hoverable).
// 4. O gatilho é DESCRITO pelo balão (`aria-describedby`, e só enquanto o balão
//    existe), nunca NOMEADO por ele. Gatilho icon-only carrega `aria-label`
//    próprio: em touch não há hover.
// 5. Nada de região viva — o balão é `role="tooltip"`, e o anúncio chega pela
//    descrição do gatilho, ao focar.
//
// Texto canônico, com o porquê de cada uma: cabeçalho do tooltip do Vanilla,
// que é a referência de comportamento.
//
// Mecanismo nesta stack: os primitivos do `reka-ui`, cujo `useGraceArea` mede
// a tolerância em coordenada.
//

const props = defineProps<TooltipRootProps>()
const emits = defineEmits<TooltipRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot
    v-slot="slotProps"
    data-slot="tooltip"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </TooltipRoot>
</template>
