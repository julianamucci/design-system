import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que o
 * separa do tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da página.
 * Por isso o painel só recebe `aria-modal` no modo modal: o atributo manda o
 * leitor de tela esconder o resto da página, e sem foco preso ele mentiria.
 * `Escape` fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho
 * declara `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a rolagem e
 * anuncia `aria-modal`, os três juntos. O padrão continua não-modal.
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
 * abaixo, na mesma forma do `popover.ts` do Vanilla. A alternativa seria injetar
 * um botão de fechar que o desenho não pede só para satisfazer `hasClosePart`.
 */

/**
 * Leva `modal` da raiz até o painel.
 *
 * O contexto é NOSSO e não o da lib: `modal` mora no store do Base UI, cujo
 * acesso não é público, e depender de interno de lib para uma decisão de
 * acessibilidade é o tipo de coisa que some numa atualização menor.
 */
const PopoverModalContext = React.createContext(false)

function Popover({ modal = false, ...props }: PopoverPrimitive.Root.Props) {
  return (
    <PopoverModalContext.Provider value={modal === true}>
      <PopoverPrimitive.Root data-slot="popover" modal={modal} {...props} />
    </PopoverModalContext.Provider>
  )
}

type PopoverTriggerProps = PopoverPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
  // Sem `nativeButton={false}`: todos os call sites passam <Button>, que é um
  // <button> nativo. Declarar o contrário faz o Base UI logar console.error em
  // dev e aplicar role="button" + handlers de teclado redundantes. A prop só
  // cabe quando o render é outro elemento — ver pagination.tsx, que renderiza <a>.
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        render={children as React.ReactElement}
        {...(props as PopoverPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...(props as PopoverPrimitive.Trigger.Props)}
    >
      {children}
    </PopoverPrimitive.Trigger>
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
 * O que conta como "focável" dentro do painel.
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 * Mesma lista do `popover.ts` do Vanilla, que é a referência.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  onKeyDown,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const modal = React.useContext(PopoverModalContext)

  /**
   * Laço de tabulação do modo modal.
   *
   * Escrito aqui porque a lib não o entrega sem um `Popover.Close` registrado
   * dentro do painel — ver o bloco no topo deste arquivo. Mesma forma do
   * `dialog.ts` e do `popover.ts` do Vanilla, que é a referência: duas escritas
   * diferentes do mesmo laço divergiriam na primeira correção.
   *
   * Fora do modo modal não há ramo nenhum: `Tab` segue a ordem da página e SAI
   * do painel, que é o contrato padrão do popover.
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
          ref={nomearPanel}
          // `aria-modal` SÓ no modo modal, e nunca `"false"` no padrão: o
          // atributo ausente e o negado dizem a mesma coisa ao leitor de tela,
          // e anunciar inércia sem o laço de tabulação acima seria mentira.
          aria-modal={modal ? true : undefined}
          onKeyDown={aoTeclar}
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
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
