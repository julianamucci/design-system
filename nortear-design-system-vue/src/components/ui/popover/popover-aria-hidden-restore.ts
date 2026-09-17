import { defineComponent, onUnmounted } from 'vue'

/**
 * Modo modal: o resto da página escondido do leitor de tela — e DEVOLVIDO
 * exatamente como estava ao fechar.
 *
 * Decisão da dona de 2026-09-17 (item 7 da §7 do PRD): esconder nas cinco,
 * sempre que o modo for modal, por `aria-hidden` (nunca `inert`, que também
 * bloquearia o clique fora), com restauração exata ao fechar e ao desmontar.
 *
 * ─── O que a lib já entrega, e por isso ESCONDER é dela ─────────────────────
 *
 * Medido na reka-ui 2.10.4 em 2026-09-17: `Popover/PopoverContentModal.js:122`
 * chama `useHideOthers(currentElement)` sempre que o painel modal monta — com ou
 * sem peça de fechar —, e `shared/useHideOthers.js:15-25` aplica o `hideOthers`
 * do pacote `aria-hidden` (1.2.6) ao montar e desfaz ao desmontar. O algoritmo é
 * o da especificação: os irmãos de cada ancestral do painel até o `<body>`
 * ganham `aria-hidden="true"`. O não-modal (`PopoverContentNonModal`) não chama
 * nada, então o item 4 também é da lib.
 *
 * Duas exceções da lib ficam como estão, porque são as mesmas do `markOthers` da
 * base-ui: elementos `[aria-live]` e `<script>` não são escondidos
 * (`aria-hidden/dist/es2015/index.js:133`) — uma região viva calada por um
 * popover deixaria de anunciar.
 *
 * ─── O que ela NÃO entrega, e por isso este complemento ─────────────────────
 *
 * A restauração não é exata para `aria-hidden="false"`. Em
 * `aria-hidden/dist/es2015/index.js:66` o valor `"false"` conta como "não
 * escondido": a lib o sobrescreve com `"true"` (`:78-79`) e, ao desfazer,
 * REMOVE o atributo (`:97-100`) em vez de devolver o `"false"`. Qualquer outro
 * valor pré-existente é preservado (`:72-73`, `uncontrolledNodes`). Medido pela
 * story `Modal`: sem este componente, o elemento marcado volta sem atributo.
 *
 * Por isso este componente anota, ANTES de a lib esconder, quem tinha
 * `aria-hidden="false"`, e devolve o valor depois que ela desfaz:
 *
 *  - a anotação é no `setup`: ele é renderizado DENTRO do painel modal, então
 *    roda durante a montagem do `PopoverContentModal` — antes do `watch` de
 *    `useHideOthers`, que só dispara depois que o elemento do painel existe;
 *  - a devolução é numa microtarefa depois do `onUnmounted`: o desmonte chama os
 *    ganchos dos filhos antes dos do pai, então o `undo` da lib (no
 *    `onUnmounted` de `useHideOthers.js:23-25`) ainda não rodou quando o nosso
 *    dispara. A microtarefa espera o fim da descarga do Vue.
 *
 * A devolução só toca quem tinha `"false"` e ficou SEM atributo — a assinatura
 * exata da perda. Um valor que outra peça tenha escrito durante a abertura não é
 * desfeito aqui.
 */
export const PopoverAriaHiddenRestore = defineComponent({
  name: 'PopoverAriaHiddenRestore',
  setup() {
    const negated: Element[] =
      typeof document === 'undefined'
        ? []
        : Array.from(document.querySelectorAll('[aria-hidden="false"]'))

    onUnmounted(() => {
      if (!negated.length) return
      queueMicrotask(() => {
        for (const el of negated) {
          if (el.isConnected && el.getAttribute('aria-hidden') === null) {
            el.setAttribute('aria-hidden', 'false')
          }
        }
      })
    })

    return () => null
  },
})
