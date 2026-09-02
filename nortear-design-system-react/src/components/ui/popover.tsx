import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL: o foco ENTRA no painel ao abrir (é o que o separa do
 * tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da página. Por isso
 * o painel nunca recebe `aria-modal`: o atributo manda o leitor de tela
 * esconder o resto da página, e sem foco preso ele mentiria. `Escape` fecha e
 * devolve o foco ao gatilho; clique fora fecha; o gatilho declara
 * `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * Mecanismo desta stack: `PopoverRoot` do Base UI nasce com `modal = false`, e
 * o `FloatingFocusManager` do `Popup` só trapeia quando
 * `modal !== false && hasClosePart` — ou seja, `modal` sozinho NÃO prende o
 * foco enquanto não houver um `Popover.Close` renderizado dentro do painel.
 * Esta família não expõe um, então o estado entregue é sempre o não-modal.
 */
function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
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

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
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
