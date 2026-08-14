<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { onBeforeUnmount, onMounted, nextTick, ref } from 'vue'
import { useForwardPropsEmits } from 'reka-ui'
import { DrawerContent, DrawerPortal } from 'vaul-vue'
import { cn } from '@/lib/utils'
import DrawerOverlay from './DrawerOverlay.vue'
import { useDrawerModal } from './context'

defineOptions({
  inheritAttrs: false,
})

/**
 * Os `undefined` explícitos são a MESMA armadilha já documentada na raiz deste
 * componente: prop declarada como boolean sem `default` faz o Vue converter
 * "ausente" em `false`, e o repasse então ENVIA `false` onde o consumidor não
 * escreveu nada — sobrescrevendo o default do primitivo.
 *
 * Aqui o efeito era grave e silencioso: `disableOutsidePointerEvents: false`
 * desligava o comportamento modal, e com ele o foco deixava de ser levado para
 * dentro do painel ao abrir. Um diálogo modal que não recebe o foco quebra o
 * contrato de `accessibility` e deixa quem usa teclado do lado de fora, sem
 * nenhum erro visível. Medido: duas stories do Vue reprovavam com "o foco não
 * entrou no painel" enquanto as outras quatro stacks passavam.
 */
const props = withDefaults(
  defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    forceMount: undefined,
    disableOutsidePointerEvents: undefined,
    asChild: undefined,
  },
)
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)

/**
 * `aria-modal` acompanha o modo REAL da raiz.
 *
 * O primitivo desta stack não emite o atributo, então ele é escrito aqui. Fixo
 * em `"true"` ele mentia no modo não-modal: o leitor de tela esconde tudo o que
 * está fora de um diálogo com `aria-modal`, e num drawer não-modal o resto da
 * página continua clicável e legível.
 *
 * O nome acessível NÃO é escrito aqui. Havia um `aria-label="Drawer"` de
 * reserva, em inglês, e `aria-label` vence `aria-labelledby` no cálculo do nome
 * — o painel se anunciava "Drawer" em vez do título que quem compõe escreveu.
 * O nome sai do DrawerTitle, pelo `aria-labelledby` que o primitivo liga ao id
 * real dele.
 */
const modal = useDrawerModal()

/**
 * O foco entra no painel — a lib desta stack impede que ele entre.
 *
 * Lida na fonte: o `DrawerContent` do primitivo registra
 * `onOpenAutoFocus` com o modificador `prevent`, ou seja, CANCELA o foco
 * automático do diálogo. É escolha deliberada da lib (num drawer de toque, puxar
 * o foco abre o teclado virtual), e é um handler interno — não dá para
 * sobrescrever por prop, porque o dele é aplicado depois do nosso.
 *
 * Só que um diálogo modal que não recebe o foco deixa quem navega por teclado
 * do lado de fora: o próximo Tab continua na página atrás do painel. As outras
 * quatro stacks levam o foco para dentro, e a referência do projeto é uma
 * delas. Então o foco é movido aqui, uma vez, na montagem.
 *
 * O alvo é o próprio painel (o primitivo já lhe dá `tabindex="-1"`), e não o
 * primeiro focável: focar direto um campo faria o leitor de tela anunciar o
 * campo sem antes anunciar o nome do diálogo.
 */
const painel = ref<{ $el?: HTMLElement } | null>(null)

async function levarFocoParaODentro(el: HTMLElement) {
  // Insiste por alguns quadros, e a razão é o FECHAMENTO, não a abertura.
  //
  // Ao fechar, o primitivo devolve o foco ao gatilho — comportamento correto.
  // Quando alguém fecha e reabre em seguida (o par idempotente que as plays
  // usam, e um duplo clique no uso real), essa devolução chega DEPOIS de o
  // painel já estar aberto e rouba o foco que acabamos de colocar. Medido com
  // sonda: painel `data-state="open"`, `tabindex="-1"`, e o foco no botão do
  // gatilho.
  //
  // Focar uma vez só perde essa corrida. O laço para assim que o foco entra,
  // e desiste se o painel fechar no meio — nunca fica competindo com quem
  // fechou de propósito.
  // O quadro em que o painel ainda não está `open` é PULADO, não encerra o
  // laço: na reabertura o estado leva alguns quadros para virar, e sair na
  // primeira leitura desistia antes de haver o que focar.
  for (let quadro = 0; quadro < 20; quadro++) {
    await new Promise((r) => requestAnimationFrame(r))
    if (el.getAttribute('data-state') !== 'open') continue
    if (el.contains(document.activeElement)) return
    el.focus()
  }
}

onMounted(async () => {
  await nextTick()
  // `$el` de um componente que renderiza fragmento pode vir como nó de
  // comentário; a consulta pelo `data-slot` é a reserva que sempre resolve.
  const doRef = painel.value?.$el
  const el =
    doRef instanceof HTMLElement
      ? doRef
      : document.querySelector<HTMLElement>('[data-slot="drawer-content"]')
  if (!el) return

  // A montagem cobre o painel que nasce aberto; o observador cobre o resto.
  // Reabrir pelo gatilho NÃO remonta este componente — o primitivo mantém o nó
  // e alterna `data-state` —, então um `onMounted` sozinho focava na primeira
  // abertura e nunca mais. Medido: a story que monta aberta passava e a que
  // fecha e reabre continuava reprovando.
  void levarFocoParaODentro(el)

  const observador = new MutationObserver(() => void levarFocoParaODentro(el))
  observador.observe(el, { attributes: true, attributeFilter: ['data-state'] })
  onBeforeUnmount(() => observador.disconnect())
})
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      ref="painel"
      data-slot="drawer-content"
      v-bind="{ 'aria-modal': modal ? 'true' : undefined, ...$attrs, ...forwarded }"
      :class="cn('nds-drawer-content', props.class)"
    >
      <div class="nds-drawer-handle" aria-hidden="true" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
