import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

const NAV_KEYS = ["ArrowDown", "ArrowUp", "Home", "End"] as const

/** O base-ui envolve o evento nativo (BaseUIEvent) — tipo derivado da API
 *  pública para não depender de um caminho interno da lib. */
type AccordionKeyDownEvent = Parameters<
  NonNullable<AccordionPrimitive.Root.Props["onKeyDown"]>
>[0]

/**
 * PATCH: a11y — o `@base-ui/react` não implementa navegação por setas no
 * Accordion (o `CompositeList` do Root apenas registra refs; não há handler de
 * teclado no módulo). reka-ui, bits-ui e a factory Vanilla implementam, a docs
 * page documenta o comportamento, e sem isso as setas caem no scroll da página.
 * Ver PATCHES.md#react-accordion-arrow-keys.
 */
function Accordion({ className, onKeyDown, ...props }: AccordionPrimitive.Root.Props) {
  // O modo fica registrado no DOM, e não só na prop: sem isso nada distingue um
  // accordion single de um multiple depois de montado. Mesmo atributo nas 4 stacks.
  const mode = props.multiple ? "multiple" : "single"
  function handleKeyDown(event: AccordionKeyDownEvent) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (!NAV_KEYS.includes(event.key as (typeof NAV_KEYS)[number])) return

    // Só age quando o foco está num trigger — teclas dentro do conteúdo
    // (links, campos) seguem o comportamento nativo.
    const focused = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-slot="accordion-trigger"]',
    )
    if (!focused) return

    const triggers = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[data-slot="accordion-trigger"]:not([disabled]):not([aria-disabled="true"])',
      ),
    )
    const index = triggers.indexOf(focused)
    if (index < 0) return

    event.preventDefault()
    const last = triggers.length - 1
    const next =
      event.key === "ArrowDown" ? (index + 1) % triggers.length
      : event.key === "ArrowUp" ? (index - 1 + triggers.length) % triggers.length
      : event.key === "Home" ? 0
      : last
    triggers[next]?.focus()
  }

  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      data-type={mode}
      className={cn("nds-accordion", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("nds-accordion-item", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="nds-accordion-header">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("nds-accordion-trigger", className)}
        {...props}
      >
        {/* O rótulo vive num <span> próprio: o sublinhado de hover é
            `.nds-accordion-trigger:hover > span:first-child` e não deve
            alcançar os ícones. Mesma marcação nas 4 stacks. */}
        <span>{children}</span>
        {/* Um único chevron que gira 180° ao abrir (ver accordion.css). */}
        <ChevronDownIcon data-slot="accordion-trigger-icon" className="nds-accordion-icon" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="nds-accordion-content"
      {...props}
    >
      <div
        className={cn("nds-accordion-content-body", className)}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
