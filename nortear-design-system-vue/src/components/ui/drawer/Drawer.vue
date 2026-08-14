<script lang="ts" setup>
import type { DrawerRootEmits, DrawerRootProps } from 'vaul-vue'
import { computed, ref } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DrawerRoot } from 'vaul-vue'
import { provideDrawerModal } from './context'

/**
 * ─── Por que `open` e `defaultOpen` não são repassados como vieram ───────────
 *
 * Duas armadilhas somadas, e o sintoma era um drawer que simplesmente não
 * abria ao clicar no gatilho.
 *
 * 1. Prop declarada como boolean SEM `default` faz o Vue converter "ausente"
 *    em `false`. Sem o `open: undefined` abaixo, este wrapper não conseguiria
 *    distinguir "ninguém controla" de "controlado em fechado".
 *
 * 2. A raiz do primitivo decide se está no modo controlado olhando o VALOR
 *    resolvido de `open` (com `defaultOpen` entrando como valor inicial), e não
 *    se `open` foi escrito. Passar `:default-open="false"` já bastava para ela
 *    se considerar controlada: o clique no gatilho emitia a mudança e não
 *    mexia no estado interno, então o painel nunca montava. Medido em sonda:
 *    `<Drawer>` abria, `<Drawer :default-open="false">` não.
 *
 * A saída é este wrapper assumir o estado quando ninguém o controla: a raiz
 * recebe sempre um `open` definido e devolve toda mudança por `update:open`,
 * que é o caminho que ela trata corretamente nos dois modos.
 */
const props = withDefaults(defineProps<DrawerRootProps>(), {
  shouldScaleBackground: true,
  // Defaults do primitivo, declarados aqui porque a conversão de boolean do Vue
  // transformaria a ausência deles em `false` — e um drawer não-modal e não
  // dispensável por omissão é o oposto do que o conteúdo compartilhado documenta.
  modal: true,
  dismissible: true,
  open: undefined,
  defaultOpen: undefined,
})

const emits = defineEmits<DrawerRootEmits>()

const naoControlado = ref(props.defaultOpen === true)
const aberto = computed(() => (props.open === undefined ? naoControlado.value : props.open))

function aoMudarAbertura(valor: boolean) {
  // Guarda contra o ECO do modo controlado. Como este wrapper passa sempre um
  // `open` definido, a raiz vê a prop mudar logo depois de nós atualizarmos o
  // estado e emite `update:open` de novo — o consumidor recebia DUAS chamadas
  // por abertura. Medido contra a stack de referência, que notifica uma vez
  // por gesto: espião em 3 onde deveria estar em 2.
  if (valor === aberto.value) return
  naoControlado.value = valor
  emits('update:open', valor)
}

// `open` e `defaultOpen` saem do repasse: quem os administra agora é este
// wrapper. O resto (direção, snap points, gestos) segue direto para a raiz.
const repassados = reactiveOmit(props, 'open', 'defaultOpen')

provideDrawerModal(computed(() => props.modal))
</script>

<template>
  <DrawerRoot
    v-slot="slotProps"
    data-slot="drawer"
    v-bind="repassados"
    :open="aberto"
    @update:open="aoMudarAbertura"
    @update:active-snap-point="(v) => emits('update:activeSnapPoint', v)"
    @drag="(v) => emits('drag', v)"
    @release="(v) => emits('release', v)"
    @close="() => emits('close')"
    @animation-end="(v) => emits('animationEnd', v)"
  >
    <slot v-bind="slotProps" />
  </DrawerRoot>
</template>
