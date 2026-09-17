import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que o
 * separa do tooltip), mas NÃO fica preso — `Tab` a partir do último focável (ou
 * `Shift+Tab` a partir do primeiro) sai do painel, que FECHA relatando `overlay`
 * e DEVOLVE O FOCO AO GATILHO, nos dois sentidos (decisão da dona, 2026-09-17).
 * E o foco levado para FORA por outro caminho — código, clique num focável da
 * página — também fecha, com `overlay`, uma vez, deixando o foco onde foi posto;
 * o gatilho conta como parte do painel (D15, mesma data). Ver `handleBlur`.
 *
 * As duas metades da frase acima andam juntas desde 2026-09-16, e nenhuma
 * substitui a outra: o foco não ficar preso é o que separa o padrão do modo
 * modal, e o fechamento é o que impede um painel órfão de ficar aberto atrás de
 * quem já saiu dele. No modo MODAL não vale nenhuma das duas:
 * lá o foco fica preso e não há "sair".
 *
 * Por isso o painel só recebe `aria-modal` no modo modal: o atributo manda o
 * leitor de tela esconder o resto da página, e sem foco preso ele mentiria.
 * `Escape` fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho
 * declara `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a rolagem e
 * anuncia `aria-modal`; desde 2026-09-17, também esconde o resto da página do
 * leitor de tela — os quatro juntos. O padrão continua não-modal. O esconder vale
 * com ou sem `PopoverClose`, por `aria-hidden` — ver `hideOutside`.
 *
 * Mecanismo desta stack, medido na fonte: o `FloatingFocusManager` do `Popup`
 * só trapeia quando `modal !== false && hasClosePart`
 * (`popup/PopoverPopup.js`), e `hasClosePart` conta os `Popover.Close`
 * REGISTRADOS dentro do painel (`utils/closePart.js`). A trava de rolagem, essa
 * sim, cai de `modal === true` sozinho — `positioner/PopoverPositioner.js` liga
 * `useAnchoredPopupScrollLock`. Ou seja: a lib dá a TRAVA e não dá o TRAP.
 *
 * Por isso o modo modal aqui é metade lib e metade nosso: `modal` segue para a
 * raiz (trava de rolagem) e o laço de tabulação está escrito no `PopoverContent`
 * abaixo, na mesma forma do `popover.ts` do Vanilla.
 *
 * O laço CONTINUA depois de o `PopoverClose` existir (2026-09-12), e não é
 * redundância: o painel modal só herda o trap da lib se QUEM MONTA a composição
 * puser um controle de fechar dentro dele, e o contrato de `modal` não pode
 * depender do conteúdo. Sem o laço, um painel modal sem botão de fechar
 * anunciaria `aria-modal` e deixaria o Tab sair — o defeito de D1 do PRD.
 */

/**
 * Leva `modal` da raiz até o painel.
 *
 * O contexto é NOSSO e não o da lib: `modal` mora no store do Base UI, cujo
 * acesso não é público, e depender de interno de lib para uma decisão de
 * acessibilidade é o tipo de coisa que some numa atualização menor.
 */
const PopoverModalContext = React.createContext(false)

/**
 * Estado aberto/fechado, para o `data-state` que esta lib NÃO escreve.
 *
 * A base-ui publica `data-popup-open` no gatilho e `data-open`/`data-closed` no
 * painel (`utils/popupStateMapping.js`). As outras quatro stacks e a tabela de
 * Estados do conteúdo compartilhado falam `data-state="open|closed"` — era a
 * única das cinco sem o atributo documentado. Emitimos o nosso POR CIMA, sem
 * tirar nada do que a lib escreve, que é a mesma decisão do angular.
 *
 * O estado é NOSSO e não o da lib pela mesma razão do `modal` acima: o store da
 * base-ui não tem acesso público, e depender de interno de lib para um atributo
 * que a documentação promete é o tipo de coisa que some numa atualização menor.
 */
const PopoverStateContext = React.createContext(false)

/**
 * Fechar por SAÍDA DE FOCO — o Tab nas bordas (D11) e o foco levado para fora
 * (D15) — e o que o painel precisa saber da raiz para decidir.
 *
 * Mora na raiz porque é ela que tem o `actionsRef`, o `onOpenChange` e os
 * gatilhos. `null` fora de um `Popover`, e aí o painel simplesmente não age.
 *
 * - `close`: fecha relatando `overlay` (ver `handleOpenChange`); se outro
 *   caminho já fechou no mesmo instante, a raiz cancela este (ver `closedRef`);
 * - `isTrigger`: o gatilho conta como parte do painel (D15).
 */
type PopoverFocusExit = {
  close: (event: KeyboardEvent | FocusEvent) => void
  isTrigger: (node: Node) => boolean
}
const PopoverFocusExitContext = React.createContext<PopoverFocusExit | null>(null)

/**
 * Registro dos gatilhos DESTE popover, para o `isTrigger` acima.
 *
 * Um registro nosso, e não o da lib: a base-ui guarda os gatilhos em
 * `store.context.triggerElements`, que não é API pública — a mesma razão do
 * `PopoverModalContext`. Um CONJUNTO, porque a lib aceita mais de um gatilho
 * por raiz.
 */
const PopoverTriggerRegistryContext = React.createContext<
  ((node: HTMLElement) => () => void) | null
>(null)

function Popover({
  modal = false,
  open,
  defaultOpen,
  onOpenChange,
  actionsRef,
  ...props
}: PopoverPrimitive.Root.Props) {
  // Espelho do estado para o `data-state`. Controlado, quem manda é a prop;
  // não-controlado, o espelho acompanha pelo callback — que segue para quem
  // compõe com os DOIS argumentos, porque é do segundo que sai o motivo do
  // fechamento (`popoverCloseReason`), e engoli-lo mandaria todo fechamento ao
  // GA4 como `api`.
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen

  // O `actionsRef` de quem compõe tem precedência — mesma forma do `sheet.tsx`:
  // o handle é dele, e o Tab para fora só pega carona no mesmo objeto.
  const ownActions = React.useRef<PopoverPrimitive.Root.Actions | null>(null)
  const actions = actionsRef ?? ownActions

  // O evento (tecla ou perda de foco) que está fechando o painel AGORA, e só
  // durante a chamada ao `close()` — que é síncrona: `store.setOpen` chama o
  // `onOpenChange` antes de voltar (`popover/store/PopoverStore.mjs`).
  const focusExitEvent = React.useRef<KeyboardEvent | FocusEvent | null>(null)

  /**
   * UM gesto, UM fechamento — `true` depois de um fechamento APLICADO, até a
   * lib voltar a considerar o painel aberto.
   *
   * Medido em 2026-09-17, com o foco dentro do painel e um clique num focável
   * da página ("Depois"): o `onOpenChange` recebia DOIS fechamentos,
   * `focus-out` e depois `outside-press`, já antes do conserto da D15. O
   * primeiro sai da própria lib — o `pointerdown` fora desarma o
   * `markInsideReactTree` e o `mousedown` leva o foco ao alvo antes do clique
   * (`FloatingFocusManager.mjs:312`, `:297-307`); o segundo é o `useDismiss`,
   * que dispensa no `click` (`popover/root/PopoverRoot.mjs:113`,
   * `mouse: 'intentional'`) com um ouvinte que ainda não saiu. Clique num alvo
   * que não recebe foco dava um só.
   *
   * Nenhuma das duas chamadas tem opção pública para ser desligada, e a lib não
   * confere se já fechou antes de avisar (`PopoverStore.mjs:41-50`). Então a
   * raiz CANCELA o fechamento de um painel que ela já viu fechar
   * (`details.cancel()`, e a lib não aplica nada — `PopoverStore.mjs:51`): o
   * primeiro vence. Vale para qualquer par — clique fora, a perda de foco
   * depois do Tab da D11, a nossa perda de foco depois do clique no gatilho.
   *
   * Sem ouvinte de ponteiro no `document`: a marca sai do próprio fluxo de
   * `onOpenChange`. Volta a `false` em toda abertura que passa pelo callback e,
   * no modo controlado, quando a prop `open` chega `true` — abrir por código não
   * chama o `onOpenChange`.
   *
   * **E quando o consumidor RECUSA** — medido em 2026-09-17, na `Controlled`:
   * controlado, um fechamento anunciado e não aplicado deixava a marca em `true`
   * sem render nenhum para desarmá-la, e o pedido SEGUINTE (o foco voltando ao
   * painel e saindo de novo) era cancelado em silêncio — o consumidor nunca
   * mais ouvia um fechamento daquele painel. Por isso a raiz força UM render
   * depois de anunciar um fechamento controlado (`rearm`): se quem compõe
   * aceitou, o render sai com `open` falso e a marca fica; se recusou, sai com
   * `open` verdadeiro e o efeito abaixo a desarma. Os dois caminhos do mesmo
   * gesto continuam sendo um fechamento só quando ele é APLICADO, que é o caso
   * que a marca existe para cobrir.
   */
  const closedRef = React.useRef(false)
  React.useEffect(() => {
    if (isOpen) closedRef.current = false
  })
  const [, rearm] = React.useReducer((renders: number) => renders + 1, 0)

  const triggersRef = React.useRef(new Set<HTMLElement>())
  const registerTrigger = React.useCallback((node: HTMLElement) => {
    const triggers = triggersRef.current
    triggers.add(node)
    return () => {
      triggers.delete(node)
    }
  }, [])

  function handleOpenChange(
    next: boolean,
    details: Parameters<NonNullable<PopoverPrimitive.Root.Props["onOpenChange"]>>[1]
  ): void {
    // Fechar o que já fechou não é um fechamento — ver `closedRef`.
    if (!next && closedRef.current) {
      details.cancel()
      return
    }
    // O `close()` imperativo da lib chega como `imperative-action`, que o
    // `popoverCloseReason` manda para `api` — e sair pelo foco é `overlay`:
    // quem tabulou ou levou o foco embora saiu sem decidir nada. O motivo vira
    // `focus-out`, que é o MESMO motivo que a própria base-ui usa quando o Tab
    // dela sai do painel (`FloatingPortal.mjs`, sentinela de depois) e cujo
    // tipo de evento a lib declara `FocusEvent | KeyboardEvent`. Escrito no
    // próprio objeto, e não numa cópia: a lib continua lendo `reason` e
    // `isCanceled` dele depois de chamar este callback.
    if (!next && focusExitEvent.current && details.reason === "imperative-action") {
      const rewritten = details as { reason: string; event: Event }
      rewritten.reason = "focus-out"
      rewritten.event = focusExitEvent.current
    }
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next, details)
    // Só o que a lib vai APLICAR: quem compõe pode ter cancelado.
    if (details.isCanceled) return
    closedRef.current = !next
    // Controlado, "anunciado" não é "aplicado": o render forçado é o que deixa o
    // efeito da marca ler a prop que o consumidor decidiu — ver `closedRef`.
    if (!next && isControlled) rearm()
  }

  const focusExit = React.useMemo<PopoverFocusExit>(
    () => ({
      close(event) {
        focusExitEvent.current = event
        try {
          actions.current?.close()
        } finally {
          focusExitEvent.current = null
        }
      },
      isTrigger: (node) => {
        for (const trigger of triggersRef.current) {
          if (trigger.contains(node)) return true
        }
        return false
      },
    }),
    [actions]
  )

  return (
    <PopoverModalContext.Provider value={modal === true}>
      <PopoverStateContext.Provider value={isOpen}>
        <PopoverFocusExitContext.Provider value={focusExit}>
          <PopoverTriggerRegistryContext.Provider value={registerTrigger}>
            {/* Sem `data-slot="popover"`: a raiz da base-ui não renderiza
                elemento nenhum, e o atributo não chegava ao DOM. */}
            <PopoverPrimitive.Root
              modal={modal}
              open={open}
              defaultOpen={defaultOpen}
              actionsRef={actions}
              onOpenChange={handleOpenChange}
              {...props}
            />
          </PopoverTriggerRegistryContext.Provider>
        </PopoverFocusExitContext.Provider>
      </PopoverStateContext.Provider>
    </PopoverModalContext.Provider>
  )
}

type PopoverTriggerProps = PopoverPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function PopoverTrigger({ asChild, children, ref, ...props }: PopoverTriggerProps) {
  const state = React.useContext(PopoverStateContext) ? "open" : "closed"
  // O nó entra no registro da raiz — é o que faz o gatilho contar como parte
  // do painel na perda de foco (D15). O `ref` de quem compõe continua valendo.
  const register = React.useContext(PopoverTriggerRegistryContext)
  const setTriggerNode = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
      if (!node || !register) return
      return register(node)
    },
    [ref, register]
  )
  // Sem `nativeButton={false}`: todos os call sites passam <Button>, que é um
  // <button> nativo. Declarar o contrário faz o Base UI logar console.error em
  // dev e aplicar role="button" + handlers de teclado redundantes. A prop só
  // cabe quando o render é outro elemento — ver pagination.tsx, que renderiza <a>.
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        data-state={state}
        render={children as React.ReactElement}
        {...(props as PopoverPrimitive.Trigger.Props)}
        ref={setTriggerNode}
      />
    )
  }
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      data-state={state}
      {...(props as PopoverPrimitive.Trigger.Props)}
      ref={setTriggerNode}
    >
      {children}
    </PopoverPrimitive.Trigger>
  )
}

/**
 * Controle de fechar DENTRO do painel.
 *
 * Existe desde 2026-09-12, por decisão da dona, e nas cinco stacks: um
 * "Cancelar" que não fecha é o defeito que a dona viu na tela — o rodapé promete
 * uma saída e entrega um botão inerte.
 *
 * É ele que faz o ramo `close-press` do `popoverCloseReason` ter caminho:
 * `PopoverClose` chama `store.setOpen(false, …REASONS.closePress)`
 * (`popover/close/PopoverClose.mjs`), o motivo cru `"close-press"` chega ao
 * `onOpenChange` e a função o traduz para `close-button`. Escrever um
 * `onClick={() => setOpen(false)}` no lugar produziria `imperative-action`, que
 * cai em `api` — o relatório leria "fechou por código" onde alguém apertou um
 * botão.
 *
 * `asChild` pela mesma razão do gatilho: o controle é o `<Button>` que a
 * composição já tem, recebendo as props de fechamento. Envolver o botão num
 * segundo elemento daria dois nós para um só controle.
 */
type PopoverCloseProps = PopoverPrimitive.Close.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function PopoverClose({ asChild, children, ...props }: PopoverCloseProps) {
  // Sem `nativeButton={false}` — mesma leitura do gatilho: todo call site passa
  // um <Button>, que é um <button> nativo.
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Close
        data-slot="popover-close"
        render={children as React.ReactElement}
        {...(props as PopoverPrimitive.Close.Props)}
      />
    )
  }
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      {...(props as PopoverPrimitive.Close.Props)}
    >
      {children}
    </PopoverPrimitive.Close>
  )
}

/**
 * Nome acessível de reserva para o painel.
 *
 * `role="dialog"` sem nome reprova na regra `aria-dialog-name` do axe, e a
 * variante "apenas conteúdo" do conteúdo compartilhado não tem título. Com
 * `PopoverTitle` a lib já monta o `aria-labelledby`; sem ele o painel nascia
 * anônimo. O Vanilla — referência de markup — resolve exatamente assim: sem
 * título, o painel herda o texto acessível do gatilho. Nomear à mão sempre
 * vence: a função só age quando não há nome nenhum.
 */
function nomearPanel(el: HTMLElement | null): void {
  if (!el) return
  if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return

  const heading = el.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]')
  if (heading) {
    if (!heading.id) heading.id = `${el.id || "popover"}-title`
    el.setAttribute("aria-labelledby", heading.id)
    return
  }
  const trigger = el.ownerDocument.querySelector<HTMLElement>(
    '[aria-haspopup="dialog"][aria-expanded="true"]'
  )
  const name = trigger?.getAttribute("aria-label") || trigger?.textContent?.trim()
  if (name) el.setAttribute("aria-label", name)
}

/**
 * Modo MODAL: o resto da página some do leitor de tela enquanto o painel está
 * aberto — decisão da dona de 2026-09-17 (item 7 da §7 do PRD), igual nas cinco.
 * `aria-modal` sozinho não basta: leitores de tela o honram de forma desigual
 * (o VoiceOver do Safari é o caso conhecido).
 *
 * O algoritmo "esconder os outros": para cada ancestral do painel até o
 * `<body>`, os IRMÃOS desse ancestral recebem `aria-hidden="true"`; o painel e a
 * cadeia de ancestrais dele, não. `aria-hidden` e NUNCA `inert`: `inert` também
 * bloqueia o ponteiro nos elementos de fora, e o clique fora é o que fecha.
 *
 * O QUE NÃO É ESCONDIDO: região viva e `<script>`. Região viva existe para ser
 * ANUNCIADA sem receber foco, e `aria-hidden` apaga o anúncio — um toast de
 * "salvo" ou de erro ficaria mudo com o painel aberto. Ficam de fora
 * `[aria-live]` (qualquer valor), os papéis que a implicam (`status`, `alert`,
 * `log`, `progressbar`, `marquee`, `timer`) e `<script>`, que não chega à árvore
 * de acessibilidade. É o mesmo que fazem o `markOthers` da base-ui
 * (`floating-ui-react/utils/markOthers.mjs:53`, `:86`) e o pacote `aria-hidden`
 * 1.2.6 usado por outras libs da família.
 *
 * POR QUE A STACK COMPLEMENTA a lib, medido na fonte da base-ui 1.7.0:
 * - a lib só esconde quando o `FloatingFocusManager` está em modo modal
 *   (`floating-ui-react/components/FloatingFocusManager.mjs:339-342`,
 *   `ariaHidden: modal`), e o `PopoverPopup` só o põe em modo modal com
 *   `modal !== false && hasClosePart` (`popover/popup/PopoverPopup.mjs:71`) —
 *   sem `PopoverClose` dentro do painel, nada era escondido;
 * - e quando esconde, a lib trata `aria-hidden="false"` como "não escondido",
 *   escreve `"true"` e, ao fechar, REMOVE o atributo
 *   (`floating-ui-react/utils/markOthers.mjs:91`, `:98-99`, `:122`) — o valor
 *   anterior não volta.
 *
 * Por isso a restauração aqui é EXATA: cada elemento guarda o valor que tinha
 * (ou a ausência dele) e o recebe de volta. O contador por elemento é o que
 * deixa dois painéis modais simultâneos soltarem o mesmo elemento só quando o
 * último fechar.
 *
 * CONVIVÊNCIA com a lib quando há `PopoverClose`: este esconder roda na fase de
 * layout (callback ref do painel) e a lib num efeito passivo, depois. Ela
 * encontra `"true"` já escrito, conta o elemento como "não controlado"
 * (`markOthers.mjs:91`, `:95-96`) e não o remove ao fechar; a restauração é só nossa.
 */
const hiddenCount = new WeakMap<Element, number>()
const previousAriaHidden = new WeakMap<Element, string | null>()

/**
 * Papéis que IMPLICAM região viva — quem os declara é anunciado sem foco, e
 * `aria-hidden` calaria o anúncio exatamente como em `[aria-live]`.
 */
const LIVE_ROLES = new Set(["status", "alert", "log", "progressbar", "marquee", "timer"])

/** Pular: região viva (o anúncio morreria) ou `<script>` (não é conteúdo). */
function isLiveRegionOrScript(element: Element): boolean {
  if (element.tagName === "SCRIPT") return true
  if (element.hasAttribute("aria-live")) return true
  const role = element.getAttribute("role")
  if (role === null) return false
  return role
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some((token) => LIVE_ROLES.has(token))
}

function hideOutside(panel: HTMLElement): () => void {
  const body = panel.ownerDocument.body
  const hidden: Element[] = []
  let node: Element = panel
  while (node !== body && node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node) continue
      if (isLiveRegionOrScript(sibling)) continue
      const count = hiddenCount.get(sibling) ?? 0
      if (count === 0) {
        previousAriaHidden.set(sibling, sibling.getAttribute("aria-hidden"))
        sibling.setAttribute("aria-hidden", "true")
      }
      hiddenCount.set(sibling, count + 1)
      hidden.push(sibling)
    }
    node = node.parentElement
  }
  return () => {
    for (const element of hidden) {
      const count = (hiddenCount.get(element) ?? 1) - 1
      if (count > 0) {
        hiddenCount.set(element, count)
        continue
      }
      hiddenCount.delete(element)
      const previous = previousAriaHidden.get(element) ?? null
      previousAriaHidden.delete(element)
      if (previous === null) element.removeAttribute("aria-hidden")
      else element.setAttribute("aria-hidden", previous)
    }
  }
}

/**
 * O que conta como "focável" dentro do painel.
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 * Mesma lista do `popover.ts` do Vanilla, que é a referência.
 *
 * A EXCLUSÃO VALE PARA OS CINCO SELETORES, e não só para o genérico — medido em
 * 2026-09-13, quando a story Modal passou a montar dois `Checkbox` do design
 * system. Ao lado de cada caixa, o Base UI renderiza um
 * `<input type="checkbox" tabindex="-1" aria-hidden="true">` escondido, que o
 * navegador NUNCA visita no Tab; `input:not([disabled])` o alcançava assim
 * mesmo, então `last` virava um elemento inalcançável, o ramo do laço nunca
 * disparava e o foco SAÍA do painel modal. A regra sempre foi a do docblock
 * acima; o que faltava era aplicá-la ao elemento nativo que carrega o atributo.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .concat('[tabindex]:not([tabindex="-1"])')
  .join(", ")

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  onKeyDown,
  onKeyDownCapture,
  onBlur,
  onFocus,
  initialFocus,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const modal = React.useContext(PopoverModalContext)
  const focusExit = React.useContext(PopoverFocusExitContext)
  const isOpen = React.useContext(PopoverStateContext)
  const state = isOpen ? "open" : "closed"

  /**
   * Onde o foco entra ao abrir — `data-autofocus` primeiro.
   *
   * Semântica das cinco, promovida em 2026-09-16: ao abrir, o foco vai ao
   * primeiro `[data-autofocus]` DENTRO do painel; sem marca, ao primeiro
   * focável; sem nenhum, ao próprio painel (que já nasce com `tabindex="-1"`,
   * e é o que faz o leitor de tela anunciar o diálogo num painel só de texto).
   *
   * Os dois últimos degraus são exatamente o que o `initialFocus` da base-ui já
   * faz quando se devolve `true`, então o que escrevemos aqui é só o primeiro.
   * Devolver o elemento marcado é foco PROGRAMÁTICO, e por isso
   * `[data-autofocus]` com `tabindex="-1"` VALE como alvo — é justamente o caso
   * que a marca existe para resolver, e a lista de "focáveis" do laço de
   * tabulação abaixo, que exclui `tabindex="-1"`, responde a outra pergunta.
   *
   * Quem passar o próprio `initialFocus` vence: a política é o padrão, não uma
   * imposição.
   */
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const resolveInitialFocus = React.useCallback(
    () => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? true,
    []
  )

  /**
   * Um ref só para as duas responsabilidades: guardar o nó para o
   * `initialFocus` acima e nomear o painel. Callback ref, e não `useEffect`,
   * pela razão que já estava escrita no `ref` do `Popup`.
   */
  const setPanelNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node
      nomearPanel(node)
      // Esconder o resto da página — ver `hideOutside`. Na forma de limpeza de
      // callback ref (React 19, que o `useMergedRefs` da base-ui repassa): as
      // dependências `modal` e `isOpen` trocam a identidade do callback, e o
      // React roda a limpeza antiga na fase de mutação e o callback novo na de
      // layout — as duas ANTES dos efeitos passivos da lib.
      if (!node || !modal || !isOpen) return
      return hideOutside(node)
    },
    [modal, isOpen]
  )

  /**
   * Laço de tabulação do modo modal.
   *
   * Escrito aqui porque a lib não o entrega sem um `Popover.Close` registrado
   * dentro do painel — ver o bloco no topo deste arquivo. Mesma forma do
   * `dialog.ts` e do `popover.ts` do Vanilla, que é a referência: duas escritas
   * diferentes do mesmo laço divergiriam na primeira correção.
   *
   * Fora do modo modal este laço não age: o Tab para fora é do `aoTabularParaFora`
   * abaixo, que fecha e devolve o foco ao gatilho.
   */
  // O tipo do evento sai da PRÓPRIA prop da lib: o Base UI embrulha o evento do
  // React (`BaseUIEvent`, com `preventBaseUIHandler`), e escrever
  // `React.KeyboardEvent` aqui não compila. Derivar em vez de copiar mantém a
  // assinatura certa quando a lib mudar o embrulho.
  function aoTeclar(
    event: Parameters<NonNullable<PopoverPrimitive.Popup.Props["onKeyDown"]>>[0]
  ): void {
    onKeyDown?.(event)
    if (!modal || event.key !== "Tab" || event.defaultPrevented) return

    const panel = event.currentTarget
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => !el.closest("[hidden]"))
    // Sem nada focável dentro, ficar preso é literal: o painel já carrega
    // `tabindex="-1"` e segura o foco sozinho.
    if (!focusable.length) {
      event.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    } else if (document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  /**
   * Tab para FORA do painel — só fora do modo modal. Contrato da dona de
   * 2026-09-17, igual nas cinco, na forma do `popover.ts` do Vanilla: do último
   * focável com Tab, ou do primeiro com Shift+Tab (ou de um painel sem focável
   * nenhum), a tecla é CANCELADA, o painel fecha com motivo `overlay` e o foco
   * volta ao GATILHO.
   *
   * POR QUE A INTERCEPTAÇÃO EXISTE: a base-ui cerca o portal com SENTINELAS de
   * foco (`floating-ui-react/components/FloatingPortal.mjs`). Deixado seguir, o
   * Tab cai na sentinela de depois, que chama `getNextTabbable(gatilho)` e manda
   * o foco ao VIZINHO do gatilho; o Shift+Tab cai na de antes, que manda ao
   * focável ANTERIOR ao gatilho. Foi esse o destino que a dona recusou. Com o
   * `preventDefault` o foco nunca chega à sentinela: ele ainda está dentro do
   * painel quando o `close()` roda, e quem o devolve ao gatilho é o
   * `FloatingFocusManager` da lib (`returnFocus` padrão `true`), o mesmo caminho
   * do Escape — por isso não há `trigger.focus()` aqui.
   *
   * Em CAPTURA, para rodar antes de qualquer ouvinte de tecla da lib ou do
   * conteúdo. E só com o foco dentro DESTE painel: um popover aninhado mora em
   * outro portal, e a captura do React passa por aqui antes de chegar a ele.
   */
  function aoTabularParaFora(
    event: Parameters<NonNullable<PopoverPrimitive.Popup.Props["onKeyDownCapture"]>>[0]
  ): void {
    onKeyDownCapture?.(event)
    if (modal || !focusExit || event.key !== "Tab" || event.defaultPrevented) return

    const panel = event.currentTarget
    const active = document.activeElement
    if (!panel.contains(active)) return

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => !el.closest("[hidden]"))
    const isLeaving =
      !focusable.length ||
      (event.shiftKey ? active === focusable[0] : active === focusable[focusable.length - 1])
    if (!isLeaving) return

    event.preventDefault()
    focusExit.close(event.nativeEvent)
  }

  /**
   * Foco levado para FORA do painel — só fora do modo modal. Contrato da dona
   * de 2026-09-17 (D15 do PRD), igual nas cinco: foco posto em outro elemento
   * do documento, que não esteja no painel nem seja o gatilho, FECHA o painel
   * com `overlay`, uma vez, e o foco FICA onde foi posto.
   *
   * POR QUE UM OUVINTE NOSSO, e não o `closeOnFocusOut` da lib — medido em
   * 2026-09-17. A base-ui já nasce com `closeOnFocusOut = true`
   * (`floating-ui-react/components/FloatingFocusManager.mjs:121`) e o
   * `handleFocusOutside` existe (`:240-310`), mas NUNCA fecha um painel em
   * portal quando o foco sai dele por código: com `portalContext` — e o
   * `PopoverContent` está sempre num `Portal` —, a lib pendura no painel um
   * segundo ouvinte de `focusout` EM CAPTURA, `markInsideReactTree` (`:324`),
   * que marca `dataRef.current.insideReactTree = true` (`:315`) antes de o
   * ouvinte de bolha rodar; a microtarefa do `handleFocusOutside` lê a marca e
   * sai cedo (`:290-293`), antes do teste de `movedToUnrelatedNode` (`:297`).
   * O `markInsideReactTree` só não marca quando houve `pointerdown` fora
   * (`:312`) — por isso o clique fora fechava e o `focus()` não. Medido com
   * uma sonda: o mesmo `antes.focus()` deixava o painel aberto, e passava a
   * fechar com um `pointerdown` sintético em "Antes" disparado antes dele.
   * Não há opção pública que desligue a marca, então a lib fica com a saída
   * pelas sentinelas e o fechamento por perda de foco é escrito aqui.
   *
   * `onBlur` do React, e não `focusout` nativo: o evento sintético sobe pela
   * árvore do REACT, que atravessa portais. Foco que vai para um popup
   * aninhado (outro portal, fora do DOM do painel) dispara o `onFocus` deste
   * mesmo painel logo depois do `onBlur`, e é isso que desarma o fechamento.
   *
   * Os três "não fecha":
   * - `relatedTarget` nulo — o foco saiu do DOCUMENTO (outra janela, barra de
   *   endereço), ou o elemento focado sumiu; não há destino;
   * - destino dentro do painel ou no gatilho — o gatilho é parte do painel: o
   *   clique nele com o foco dentro fecha pelo clique, uma vez só;
   * - outro caminho já fechou no mesmo instante — a raiz cancela este
   *   fechamento (`closedRef` no `Popover`). É o caso do clique num focável
   *   fora: o `pointerdown` desarma a marca acima e a própria lib fecha por
   *   `focus-out` na microtarefa dela.
   *
   * O CLIQUE NO GATILHO só é um fechamento por causa do segundo item, e não do
   * terceiro: com uma pessoa, o foco chega ao gatilho no APERTO e o clique só
   * sai no SOLTAR. Se o gatilho contasse como fora, a perda de foco fecharia no
   * aperto e o clique, achando o painel fechado, o REABRIRIA.
   */
  const pendingFocusExit = React.useRef(false)

  function handleBlur(
    event: Parameters<NonNullable<PopoverPrimitive.Popup.Props["onBlur"]>>[0]
  ): void {
    onBlur?.(event)
    if (modal || !focusExit) return
    const destination = event.relatedTarget as Node | null
    if (!destination) return
    if (event.currentTarget.contains(destination) || focusExit.isTrigger(destination)) return

    pendingFocusExit.current = true
    const nativeEvent = event.nativeEvent
    queueMicrotask(() => {
      if (!pendingFocusExit.current) return
      pendingFocusExit.current = false
      focusExit.close(nativeEvent)
    })
  }

  function handleFocus(
    event: Parameters<NonNullable<PopoverPrimitive.Popup.Props["onFocus"]>>[0]
  ): void {
    onFocus?.(event)
    pendingFocusExit.current = false
  }

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="nds-popover-positioner"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          // Callback ref, e não `useEffect`: o painel monta e desmonta com o
          // portal, e o ref roda no nó certo em cada montagem. A leitura do
          // título acontece depois de o conteúdo estar dentro, que é o que um
          // efeito de montagem do PRÓPRIO Popup não garantiria.
          ref={setPanelNode}
          data-state={state}
          initialFocus={initialFocus ?? resolveInitialFocus}
          // `aria-modal` SÓ no modo modal, e nunca `"false"` no padrão: o
          // atributo ausente e o negado dizem a mesma coisa ao leitor de tela,
          // e anunciar inércia sem o laço de tabulação acima seria mentira.
          aria-modal={modal ? true : undefined}
          onKeyDown={aoTeclar}
          onKeyDownCapture={aoTabularParaFora}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(
            "nds-popover-content",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("nds-popover-header", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("nds-popover-title", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("nds-popover-description", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
