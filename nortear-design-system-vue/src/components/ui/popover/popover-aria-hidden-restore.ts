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
 * A exceção de região viva da lib é MENOR que a das outras quatro stacks: ela é
 * por ATRIBUTO. `aria-hidden/dist/es2015/index.js:133` empurra
 * `querySelectorAll('[aria-live], script')` para a lista de alvos preservados e
 * para aí — é o mesmo corte do `markOthers` da base-ui. Os seis papéis que
 * IMPLICAM região viva ficavam de fora da exceção e eram escondidos.
 *
 * ─── O que ela NÃO entrega, e por isso este complemento ─────────────────────
 *
 * DUAS coisas, e as duas são de restauração/exceção, nunca de esconder.
 *
 * 1. `aria-hidden="false"` não volta. Em
 *    `aria-hidden/dist/es2015/index.js:66` o valor `"false"` conta como "não
 *    escondido": a lib o sobrescreve com `"true"` (`:78-79`) e, ao desfazer,
 *    REMOVE o atributo (`:97-100`) em vez de devolver o `"false"`. Qualquer
 *    outro valor pré-existente é preservado (`:72-73`, `uncontrolledNodes`).
 *    Medido pela story `Modal`: sem este componente, o elemento marcado volta
 *    sem atributo.
 *
 * 2. Região viva marcada só pelo PAPEL era escondida. `role="status"` e
 *    `role="alert"` têm `aria-live` implícito pela ARIA, e marcar o toast só
 *    pelo papel é a forma mais comum: com o painel modal aberto, o anúncio de
 *    "salvo" ou de erro ficava mudo. As outras quatro stacks pulam `[aria-live]`
 *    com qualquer valor, `<script>` e os seis papéis — `status`, `alert`, `log`,
 *    `progressbar`, `marquee`, `timer`. Aqui a lista é do pacote, então a
 *    igualdade vem deste complemento, que DEVOLVE o valor de antes aos nós de
 *    papel vivo que a lib escondeu.
 *
 * ─── Por que devolver em vez de patchar a lib ───────────────────────────────
 *
 * O `hideOthers` aceita `Element | Element[]`, então um patch da reka poderia
 * passar os papéis vivos como alvos a mais. Medido em 2026-09-17: não é
 * necessário, e o que decide é o caso do SEGUNDO painel modal. O pacote conta
 * por nó (`counterMap`, `:69-75`) e, num segundo `hideOthers`, um nó que já não
 * tem o atributo conta como "não escondido" e é escrito de novo — ou seja, uma
 * remoção de uma vez só não sobreviveria. Este complemento é renderizado DENTRO
 * de cada painel modal, então cada painel traz a sua própria devolução; e a
 * devolução não é um disparo único, é um observador de mutação vivo pelo tempo
 * do painel. A reaplicação do segundo painel é desfeita pelos dois
 * observadores, e a do primeiro sobrevive ao fechamento do segundo.
 *
 * ─── Os dois GANCHOS, e por que cada um é onde é ────────────────────────────
 *
 *  - a ANOTAÇÃO (as duas listas) é no `setup`: ele é renderizado DENTRO do
 *    painel modal, então roda durante a montagem do `PopoverContentModal` —
 *    antes do `watch` de `useHideOthers`, que só dispara depois que o elemento
 *    do painel existe;
 *  - a devolução do papel vivo é por `MutationObserver` filtrado em
 *    `aria-hidden`, armado no `setup` e desligado no `onUnmounted`. O
 *    observador existe porque a passada da lib cai num tique de reatividade
 *    próprio, e depender da ORDEM entre o nosso gancho de montagem e o `watch`
 *    dela seria depender de detalhe interno; o observador enxerga a escrita
 *    quando ela acontecer, quantas vezes acontecer;
 *  - a devolução do `"false"` é numa microtarefa depois do `onUnmounted`: o
 *    desmonte chama os ganchos dos filhos antes dos do pai, então o `undo` da
 *    lib (no `onUnmounted` de `useHideOthers.js:23-25`) ainda não rodou quando o
 *    nosso dispara. A microtarefa espera o fim da descarga do Vue.
 *
 * A devolução do `"false"` só toca quem tinha `"false"` e ficou SEM atributo — a
 * assinatura exata da perda. Um valor que outra peça tenha escrito durante a
 * abertura não é desfeito aqui. A devolução do papel vivo tem a mesma disciplina
 * e mais uma: só toca nó que carrega o MARCADOR da lib (`data-aria-hidden`), o
 * que prova que foi ela quem escreveu. O marcador fica onde está, para o `undo`
 * dela seguir consistente.
 */

/**
 * Papéis que IMPLICAM região viva — quem os declara é anunciado sem foco, e
 * `aria-hidden` calaria o anúncio exatamente como em `[aria-live]`.
 *
 * Lista igual à das outras quatro stacks (a do svelte é escrita em
 * `popover-hide-others.ts`, que implementa o algoritmo inteiro).
 */
const LIVE_ROLES = new Set(['status', 'alert', 'log', 'progressbar', 'marquee', 'timer'])

/**
 * O atributo que o pacote `aria-hidden` deixa em TODO nó que ele tocou
 * (`dist/es2015/index.js:80-82`, o `markerName` padrão do `hideOthers`). É a
 * prova de que o `aria-hidden="true"` encontrado é dele, e não da aplicação.
 */
const LIB_MARKER = 'data-aria-hidden'

/**
 * O papel é lido como LISTA DE TOKENS e em minúsculas, igual às outras quatro:
 * `role` aceita vários valores separados por espaço, e o primeiro que a ARIA
 * reconhece vence — um `role="status alert"` é região viva do mesmo jeito.
 */
function isLiveRegionByRole(element: Element): boolean {
  const role = element.getAttribute('role')
  if (role === null) return false
  return role
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some((token) => LIVE_ROLES.has(token))
}

export const PopoverAriaHiddenRestore = defineComponent({
  name: 'PopoverAriaHiddenRestore',
  setup() {
    const hasDocument = typeof document !== 'undefined'

    const negated: Element[] = hasDocument
      ? Array.from(document.querySelectorAll('[aria-hidden="false"]'))
      : []

    // Papel vivo → valor de `aria-hidden` de ANTES da passada da lib. O
    // candidato é colhido por SELETOR e decidido pelo predicado: `[role]` não
    // sabe ler lista de tokens sem diferenciar maiúscula.
    const liveByRole = new Map<Element, string | null>()
    if (hasDocument) {
      for (const element of document.body.querySelectorAll('[role]')) {
        if (isLiveRegionByRole(element)) {
          liveByRole.set(element, element.getAttribute('aria-hidden'))
        }
      }
    }

    const restoreLiveRegions = (): void => {
      for (const [element, previous] of liveByRole) {
        if (!element.isConnected) continue
        const current = element.getAttribute('aria-hidden')
        // Só a escrita da lib, e só quando ela MUDOU o valor: a comparação com o
        // valor de antes é o que impede o observador de se realimentar, porque
        // `setAttribute` gera registro de mutação mesmo escrevendo o mesmo valor.
        if (current !== 'true' || current === previous) continue
        if (!element.hasAttribute(LIB_MARKER)) continue
        if (previous === null) element.removeAttribute('aria-hidden')
        else element.setAttribute('aria-hidden', previous)
      }
    }

    const observer =
      hasDocument && liveByRole.size > 0 ? new MutationObserver(restoreLiveRegions) : null
    if (observer) {
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-hidden'],
      })
    }

    onUnmounted(() => {
      observer?.disconnect()
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
