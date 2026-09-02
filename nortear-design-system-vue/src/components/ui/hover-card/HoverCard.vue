<script setup lang="ts">
import type { HoverCardRootEmits, HoverCardRootProps } from 'reka-ui'
import { HoverCardRoot, useForwardPropsEmits } from 'reka-ui'
import { provide, ref } from 'vue'
import { KEY_HOVER_CARD } from './context'

// ─── Acessibilidade: o cartão é enriquecimento, e o teclado não entra nele ──
//
// Abre por PONTEIRO e por FOCO, fecha no `blur` do gatilho e não move o foco
// para o painel — então um Tab a partir do gatilho fecha o cartão antes de
// alcançar o que houver dentro. Conteúdo interativo no painel é inalcançável
// por teclado, e isso vale nas cinco stacks: é a forma do gesto, não defeito de
// uma delas. Daí as três regras — nada de ação, link ou campo no painel; o
// gatilho continua sendo o caminho; abrir por foco é obrigatório.
//
// **Descrição sim, papel não** (decisão de 2026-09-02, que INVERTE a anterior).
// O painel era `role="dialog"` nomeado pelo gatilho, e o gatilho não apontava
// para ele — para não anunciar a mesma coisa duas vezes. O argumento estava
// certo e resolvia o problema errado: a duplicação vinha de o painel ser um
// diálogo homônimo, e isso era escolha nossa. Medido, o defeito era outro — com
// o cartão ABERTO na tela, o leitor anunciava só o gatilho, porque nada leva o
// foco ao painel e o `blur` fecha o cartão. Agora o painel não tem papel, e o
// gatilho o DESCREVE por `aria-describedby` enquanto o cartão está aberto.
//
//  · GANHA-SE o anúncio do conteúdo, no foco do gatilho;
//  · PERDE-SE o painel como nó com papel próprio na árvore de acessibilidade.
//
// O painel também não tem nome próprio: `aria-label` em elemento sem papel é
// `aria-prohibited-attr` no axe, então o nome saiu junto com o papel em vez de
// sobrar apontando para nada. `aria-labelledby` continua fora (trocaria o nome
// do link pelo do cartão), e `aria-describedby` só existe enquanto o painel
// existe — escrito na montagem seria `aria-valid-attr-value`.
//
// **Mecanismo desta stack** (medido em `node_modules`): a raiz agenda abertura e
// fechamento por temporizador, e o gatilho liga `pointerenter`, `pointerleave`,
// `focus` e `blur` — o foco aqui é o CRU, sem a guarda de `:focus-visible` que
// outras libs aplicam. O painel é pairável pelo sinalizador de ponteiro em
// trânsito da raiz, e o Escape chega pela camada dispensável do conteúdo.
//
// Bloco canônico, com a comparação contra tooltip e popover e as três condições
// da WCAG 1.4.13: `hover-card.ts` do Vanilla.

// Espera padrão do design system: 600ms para abrir, 300ms para fechar. A reka
// traz 700/300; o valor é fixado aqui para as cinco stacks abrirem no mesmo
// tempo, que é o que o conteúdo compartilhado documenta.
const props = withDefaults(defineProps<HoverCardRootProps>(), {
  openDelay: 600,
  closeDelay: 300,
})
const emits = defineEmits<HoverCardRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

// O gatilho é registrado por HoverCardTrigger e lido por HoverCardContent, que
// tira dele o nome acessível do painel. Buscar o gatilho no documento daria o
// mesmo nome a todos os cartões de uma tela com vários (ver a story Sides).
const trigger = ref<HTMLElement | null>(null)
provide(KEY_HOVER_CARD, { trigger })
</script>

<template>
  <HoverCardRoot
    v-slot="slotProps"
    data-slot="hover-card"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </HoverCardRoot>
</template>
