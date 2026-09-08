<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { nextTick, ref, watch } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { useForwardPropsEmits } from 'reka-ui'
import { DrawerContent, DrawerPortal } from 'vaul-vue'
import { cn } from '@/lib/utils'
import DrawerOverlay from './DrawerOverlay.vue'
import { useDrawerDirection, useDrawerModal } from './context'

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
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class']
      /**
       * Onde o foco entra na abertura.
       *
       * `panel` é o padrão, e é o certo para o painel que serve a uma edição: o
       * leitor de tela anuncia o diálogo antes de qualquer campo, e quem só quer
       * editar não paga um Tab a mais.
       *
       * `close` é para o painel cuja decisão É a tela — a confirmação. Ali o
       * foco vai para o fechador do rodapé, que é a saída segura, como o
       * AlertDialog faz: o Enter por reflexo não pode cair na ação que consuma.
       *
       * Isto é prop, e não um gancho da lib, porque a lib desta stack CANCELA o
       * foco automático do diálogo (ver o bloco de `moveFocusInside` abaixo) e
       * não repassa o evento — quem escolhe o alvo aqui é este componente.
       */
      initialFocus?: 'panel' | 'close'
    }
  >(),
  {
    forceMount: undefined,
    disableOutsidePointerEvents: undefined,
    asChild: undefined,
    initialFocus: 'panel',
  },
)
const emits = defineEmits<DialogContentEmits>()

// `initialFocus` é decisão DESTE componente: repassado, viraria atributo solto
// no painel.
const forwarded = useForwardPropsEmits(reactiveOmit(props, 'initialFocus'), emits)

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
 * `data-direction` é o que dá posição ao painel.
 *
 * A folha compartilhada ancora dezessete seletores neste atributo — borda,
 * cantos, alça, cabeçalho e as transições das quatro direções. A lib de gesto
 * escreve o `data-vaul-drawer-direction` dela no mesmo elemento e pode
 * continuar escrevendo; o que a folha lê é este, porque o contrato de markup é
 * do design system e não da dependência de parte das stacks.
 *
 * A direção vem da raiz por injeção — é lá que ela é prop.
 */
const direction = useDrawerDirection()

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
 * delas. Então o foco é movido aqui, uma vez por abertura.
 *
 * O alvo padrão é o próprio painel (o primitivo já lhe dá `tabindex="-1"`), e
 * não o primeiro focável: focar direto um campo faria o leitor de tela anunciar
 * o campo sem antes anunciar o nome do diálogo.
 *
 * Com `initial-focus="close"` o alvo passa a ser o fechador do rodapé — só no
 * painel cuja decisão É a tela. Se ele não estiver lá, o painel continua sendo
 * o alvo: um diálogo aberto sem foco dentro é pior que um Tab a mais.
 */
const panel = ref<{ $el?: unknown } | null>(null)

async function moveFocusInside(instancia: { $el?: unknown }) {
  // Acompanha alguns quadros em vez de agir num instante só, porque a abertura
  // não acontece toda de uma vez: o elemento aparece num quadro, o
  // `data-state` vira `open` em outro, e o fechamento anterior ainda pode
  // devolver o foco ao gatilho no meio do caminho — devolução correta, só
  // atrasada, quando alguém fecha e reabre em seguida (duplo clique no gatilho,
  // e o par idempotente que as plays usam).
  //
  // Cada quadro é uma condição só: sem elemento ainda, PULA; painel ainda não
  // aberto, PULA; foco já dentro, encerra; painel saiu do documento (alguém
  // fechou de propósito), encerra — nunca fica competindo com quem fechou.
  for (let nextFrame = 0; nextFrame < 30; nextFrame++) {
    await new Promise((r) => requestAnimationFrame(r))
    // `$el` é lido A CADA quadro de propósito: ele começa como o nó de
    // COMENTÁRIO que marca o lugar do painel e só vira o elemento quando o
    // primitivo troca a presença. Lido uma vez só, no instante em que a
    // referência aparece, ele é sempre o comentário — e era aí que a versão
    // anterior desistia.
    const el = instancia.$el
    if (!(el instanceof HTMLElement)) continue
    if (!el.isConnected) return
    if (el.getAttribute('data-state') !== 'open') continue
    if (el.contains(document.activeElement)) return
    const target =
      props.initialFocus === 'close'
        ? (el.querySelector<HTMLElement>('[data-slot="drawer-close"]') ?? el)
        : el
    target.focus()
  }
}

/**
 * O gancho é a MONTAGEM DO PAINEL, não a deste componente.
 *
 * Este componente é o portal, e ele existe desde que a página monta — inclusive
 * com o drawer fechado, quando o portal não renderiza painel nenhum. Um
 * `onMounted` aqui rodava no instante em que o painel ainda NÃO existia, saía
 * sem fazer nada, e nada depois disso reagia: abrir pelo gatilho não remonta
 * este componente, remonta o conteúdo dentro dele. Por isso o painel que nasce
 * aberto recebia o foco (na montagem o conteúdo já estava lá) e o que abre pelo
 * gatilho nunca recebia. Medido: era essa a diferença entre as duas stories, e
 * não o ciclo de fechar e reabrir.
 *
 * O portal desta lib não usa `forceMount`: o conteúdo é montado a cada abertura
 * e desmontado ao fechar. Então observar a referência do painel dá exatamente
 * um disparo por abertura — na primeira, na reabertura pelo gatilho e no painel
 * que já nasce aberto.
 */
watch(
  panel,
  async (instancia) => {
    if (!instancia) return
    await nextTick()
    void moveFocusInside(instancia)
  },
  { flush: 'post' },
)
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      ref="panel"
      data-slot="drawer-content"
      v-bind="{ 'aria-modal': modal ? 'true' : undefined, 'data-direction': direction, ...$attrs, ...forwarded }"
      :class="cn('nds-drawer-content', props.class)"
    >
      <div
        class="nds-drawer-handle"
        aria-hidden="true"
      />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
