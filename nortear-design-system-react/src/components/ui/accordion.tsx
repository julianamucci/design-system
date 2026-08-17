import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

/**
 * Ponte de id entre Item, Trigger e Content.
 *
 * O `@base-ui/react` emite `aria-controls` só enquanto o painel está ABERTO
 * (`'aria-controls': open ? panelId : undefined`, em AccordionTrigger.js) —
 * regra que faz sentido quando o painel fechado é desmontado, e não faz aqui:
 * este design system mantém o painel montado com `hidden="until-found"`, então
 * o alvo existe o tempo todo e o gatilho fechado ficava sem NENHUMA relação com
 * ele. Medido pela sonda: `aria-controls` presente aberto, ausente fechado —
 * divergente do Vanilla, que é a referência e o emite sempre.
 *
 * Pesa mais aqui do que na maioria dos disclosures porque o painel também não
 * tem `role="region"` (ver AccordionContent): sem `aria-controls` não sobra
 * nenhum vínculo entre gatilho e conteúdo.
 *
 * O id sai do Item e desce para os dois lados — mesma solução do stack Svelte
 * (accordion-a11y.ts). Passar `id` ao Panel também registra o valor no contexto
 * do base-ui (`setPanelIdState`), então as duas pontas continuam coerentes.
 */
const AccordionItemIdsContext = React.createContext<{ contentId: string } | null>(
  null,
)

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
    /* v8 ignore next -- só dispara se o consumidor chamar preventDefault no
       próprio onKeyDown para assumir a navegação; nenhuma story faz isso. */
    if (event.defaultPrevented) return
    if (!NAV_KEYS.includes(event.key as (typeof NAV_KEYS)[number])) return

    // Só age quando o foco está num trigger — teclas dentro do conteúdo
    // (links, campos) seguem o comportamento nativo.
    const focused = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-slot="accordion-trigger"]',
    )
    /* v8 ignore next -- exige foco DENTRO do conteúdo, e nenhuma composição
       do design system põe elemento focável ali (tabela, lista e texto). */
    if (!focused) return

    const triggers = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[data-slot="accordion-trigger"]:not([disabled]):not([aria-disabled="true"])',
      ),
    )
    const index = triggers.indexOf(focused)
    /* v8 ignore next -- a lista já exclui trigger desabilitado, e trigger
       desabilitado não recebe foco: não há como estar focado e fora dela. */
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
  const uid = React.useId()
  const ids = React.useMemo(() => ({ contentId: `${uid}-content` }), [uid])
  return (
    <AccordionItemIdsContext.Provider value={ids}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn("nds-accordion-item", className)}
        {...props}
      />
    </AccordionItemIdsContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  const ids = React.useContext(AccordionItemIdsContext)
  return (
    <AccordionPrimitive.Header className="nds-accordion-header">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("nds-accordion-trigger", className)}
        // Depois do spread do base-ui e antes do do consumidor: o mergeProps do
        // base-ui deixa o mais à direita vencer, então isto repõe o atributo que
        // ele apaga com o item fechado, sem tirar a palavra final de quem usa.
        aria-controls={ids?.contentId}
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
  const ids = React.useContext(AccordionItemIdsContext)
  // `hiddenUntilFound`: o painel fechado fica no DOM com `hidden="until-found"`,
  // então o Ctrl+F do navegador acha a resposta dentro dele e o abre. Obriga o
  // painel a permanecer montado — o base-ui ignora `keepMounted={false}` aqui e
  // avisa no console.
  //
  // `role`/`aria-labelledby` fora: com o painel sempre montado, o `role="region"`
  // do base-ui deixa TODO item fechado como landmark. Medido na docs page — 41
  // painéis viraram 41 landmarks e os de mesmo rótulo colidiram (axe
  // landmark-unique). É exatamente a "proliferação de landmarks" que a APG manda
  // evitar, e por isso ela trata o role no painel como opcional. A relação
  // trigger -> conteúdo continua pelo `aria-controls`.
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="nds-accordion-content"
      hiddenUntilFound
      id={ids?.contentId}
      {...props}
      role={undefined}
      aria-labelledby={undefined}
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
