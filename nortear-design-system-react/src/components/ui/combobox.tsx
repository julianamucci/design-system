import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Combobox ─────────────────────────────────────────────────────────────────
//
// Campo de texto que filtra uma lista. No modo múltiplo os escolhidos viram
// CHIPS dentro do próprio campo.
//
// A REFERÊNCIA cross-stack é a fábrica do Vanilla: o markup que ela emite é o
// que este arquivo espelha, peça por peça, pelo `data-slot`. O que muda aqui é
// só quem administra o estado — `@base-ui/react/combobox` traz filtragem,
// navegação virtual e chips prontos, e envolvê-los custa menos do que
// reimplementá-los.
//
//   <div data-slot="combobox">
//     <label class="nds-combobox-label" data-slot="combobox-label">
//     <div class="nds-combobox-input-wrapper" data-slot="combobox-input-wrapper">
//       <div class="nds-combobox-chips" data-slot="combobox-chips">
//         <span class="nds-combobox-chip" data-slot="combobox-chip">
//           <span data-slot="combobox-chip-text">
//           <button class="nds-combobox-chip-remove" data-slot="combobox-chip-remove">
//       <input class="nds-combobox-input" data-slot="combobox-input" role="combobox">
//       <button class="nds-combobox-clear" data-slot="combobox-clear">
//       <button class="nds-combobox-trigger" data-slot="combobox-trigger">
//         <svg class="nds-combobox-icon" data-slot="combobox-icon">
//
//   <div class="nds-combobox-positioner" data-slot="combobox-positioner">
//     <div class="nds-combobox-popup" data-slot="combobox-popup">
//       <div class="nds-combobox-list" data-slot="combobox-list" role="listbox">
//       <div class="nds-combobox-empty" data-slot="combobox-empty">
//
// `role="combobox"` vai no INPUT, não num wrapper — padrão ARIA 1.2. O foco
// NUNCA sai do input enquanto a lista navega: a opção ativa é apontada por
// `aria-activedescendant` e realçada por `[data-highlighted]`.
//
// DIVERGÊNCIAS DE API REGISTRADAS — divergência de framework não se "alinha",
// se anota (ver `docs/shared/guidelines/11-consistencia-cross-stack.md`):
//
//  1. `Combobox.Label` da lib rotula o GATILHO, não o campo de texto, e emite
//     um erro em desenvolvimento quando o `Input` é o controle do formulário —
//     é a própria lib que manda usar um `<label>` nativo nesse caso. Por isso
//     `ComboboxLabel` é um `<label htmlFor>` de verdade, e o `id` do input vem
//     de um contexto local para os dois não saírem de sincronia.
//
//  2. `Combobox.Chips` emite `role="toolbar"` quando há chips. É decisão de
//     acessibilidade da lib (sem ele o NVDA entra em modo de leitura ao andar
//     com as setas dentro do contêiner) e não muda o desenho, porque a folha
//     deixa a peça em `display: contents`. Fica.
//
//  3. O `Input` mora DENTRO de `ComboboxChips` no modo múltiplo — é assim que a
//     lib liga o Backspace do campo vazio ao último chip, por contexto de
//     React. Como `.nds-combobox-chips` é `display: contents`, o resultado na
//     tela é o mesmo do Vanilla, onde os chips são filhos diretos da caixa.
//
//  4. O popup é PORTALIZADO para o `<body>`, então o posicionador não é irmão
//     da caixa do campo no DOM, como é no Vanilla. É o mesmo que o `select`
//     desta stack já faz.
//
//  5. `Combobox.Empty` precisa continuar montado para anunciar — a lib avisa
//     que escondê-lo cala o anúncio. A caixa ESTILIZADA (`.nds-combobox-empty`)
//     é filha dela e só existe quando a lista está vazia: com a classe na peça
//     sempre montada, todo popup carregaria o `padding-block` do estado vazio.
//
//  6. `Escape` com a lista já fechada limpa o texto E a escolha, não só o
//     texto. É o comportamento da lib, mais generoso que o do contrato, e
//     desfazê-lo exigiria interceptar a tecla antes dela.
//
//  7. `Home` e `End` movem o CURSOR dentro do texto digitado, e não a opção
//     ativa. É o que a APG manda para combobox editável, e a lib trata a tecla
//     antes de qualquer lista. Nenhum item do contrato de testes mede as duas.
//
//  8. O campo escondido do formulário é emitido pela LIB, sem
//     `data-slot="combobox-hidden-input"`, e sai como irmão da raiz — no modo
//     múltiplo é um campo por escolhido, que é o que faz o `FormData` carregar
//     a lista inteira. Marcar a peça exigiria reimplementar a serialização.
//
//  9. `Combobox.Chip` recebe foco por seta (a lib faz navegação entre chips), e
//     a folha compartilhada — escrita para o Vanilla, onde o chip não é
//     focável — não tem regra `:focus-visible` para ele. O anel do chip é uma
//     lacuna a resolver na folha, não aqui.

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Uma opção da lista. `label` é o que aparece; `value` é o que o formulário envia. */
export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

/** Um bloco de opções sob um cabeçalho. `value` é o texto do cabeçalho. */
export interface ComboboxOptionGroup {
  value: string
  items: ComboboxOption[]
}

export type ComboboxValue = ComboboxOption | ComboboxOption[] | null

// ─── Contexto local ───────────────────────────────────────────────────────────

/**
 * O `id` do campo de texto, compartilhado entre o rótulo e o input.
 *
 * Sem ele, o `htmlFor` do rótulo teria de ser escrito à mão em cada uso — e um
 * rótulo que aponta para lugar nenhum é inerte para quem clica nele e mudo para
 * quem usa leitor de tela, sem nenhum sinal na tela.
 */
const ComboboxFieldContext = React.createContext<{ inputId: string } | null>(null)

function useComboboxField(): { inputId: string } {
  const context = React.useContext(ComboboxFieldContext)
  if (!context) {
    throw new Error("As peças do Combobox precisam estar dentro de <Combobox>.")
  }
  return context
}

// ─── Raiz ─────────────────────────────────────────────────────────────────────

export interface ComboboxProps {
  /** Opções da lista, planas ou agrupadas. É delas que sai a filtragem. */
  items: readonly ComboboxOption[] | readonly ComboboxOptionGroup[]
  /** Escolha controlada. Em modo múltiplo é uma lista. */
  value?: ComboboxValue
  /** Escolha inicial quando o campo administra o próprio estado. */
  defaultValue?: ComboboxValue
  onValueChange?: (value: ComboboxValue) => void
  /** Texto de busca controlado. Sem ele o campo administra o próprio texto. */
  inputValue?: string
  onInputValueChange?: (inputValue: string) => void
  /** Modo múltiplo: os escolhidos passam a aparecer como chips no campo. */
  multiple?: boolean
  /**
   * Destaca a primeira opção que casa enquanto se digita. Ligado por padrão
   * porque é o que o contrato promete em `states.filtering` — e é o que faz o
   * Enter escolher sem exigir uma seta antes.
   */
  autoHighlight?: boolean
  /**
   * Substitui o filtro. O padrão compara o rótulo ignorando acentos e diferença
   * entre maiúsculas e minúsculas; `null` desliga a filtragem interna.
   */
  filter?: ((item: ComboboxOption, query: string) => boolean) | null
  /** Máximo de opções exibidas na lista. */
  limit?: number
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  /** Nome do campo no formulário HTML. */
  name?: string
  /** `id` do campo de texto. Sem ele, um gerado. */
  id?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Texto anunciado pela região viva quando um chip sai. Remover um chip não
   * move o foco nem muda o texto do campo: sem anúncio, quem não vê a tela não
   * recebe nada.
   */
  removedAnnouncement?: (label: string) => string
  className?: string
  children?: React.ReactNode
}

/** Normaliza a escolha para lista — o modo simples é a lista de zero ou um. */
function toOptionList(value: ComboboxValue | undefined): ComboboxOption[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function Combobox({
  className,
  children,
  id,
  value,
  defaultValue,
  onValueChange,
  inputValue,
  onInputValueChange,
  filter,
  autoHighlight = true,
  removedAnnouncement = (label) => `${label} removido`,
  ...props
}: ComboboxProps) {
  const generatedId = React.useId()
  const inputId = id ?? `${generatedId}combobox`
  const fieldContext = React.useMemo(() => ({ inputId }), [inputId])

  const [announcement, setAnnouncement] = React.useState("")
  const previousRef = React.useRef<ComboboxOption[]>(
    toOptionList(value ?? defaultValue),
  )

  const handleValueChange = React.useCallback(
    (next: ComboboxValue) => {
      const before = previousRef.current
      const after = toOptionList(next)
      if (after.length < before.length) {
        const removed = before.find(
          (option) => !after.some((kept) => kept.value === option.value),
        )
        if (removed) {
          const message = removedAnnouncement(removed.label)
          // Alterna um espaço no fim quando o texto se repete: região viva que
          // não MUDA não é reanunciada, e remover dois chips de mesmo rótulo
          // em sequência ficaria mudo na segunda vez.
          setAnnouncement((current) =>
            current === message ? `${message} ` : message,
          )
        }
      }
      previousRef.current = after
      onValueChange?.(next)
    },
    [onValueChange, removedAnnouncement],
  )

  // A lib chama o filtro com TRÊS argumentos — `(itemValue, query, itemToString)`
  // —, e o terceiro é peça interna dela: o conversor que transforma a opção em
  // texto. A assinatura que a tabela de props publica tem dois,
  // `(item, query) => boolean`, e é ela que vale. Envolver aqui é o que impede o
  // terceiro argumento de vazar: sem o embrulho, quem escrevesse um filtro de
  // três parâmetros receberia um detalhe do `@base-ui` e a lib passaria a fazer
  // parte do nosso contrato — justamente o que o resto deste arquivo mantém por
  // dentro. `null` e `undefined` seguem crus, porque os dois têm significado na
  // lib: `null` desliga a filtragem interna (a lista fica com a busca por conta
  // de quem usa) e `undefined` deixa valer o filtro padrão, que compara o rótulo
  // por colador de locale, ignorando acento e diferença de caixa.
  const primitiveFilter = React.useMemo(() => {
    if (filter == null) return filter
    return (item: ComboboxOption, query: string) => filter(item, query)
  }, [filter])

  // Mesmo motivo, do outro lado: a lib entrega `(inputValue, eventDetails)` e o
  // contrato publica só o texto.
  const handleInputValueChange = React.useMemo(
    () => onInputValueChange && ((next: string) => onInputValueChange(next)),
    [onInputValueChange],
  )

  return (
    <ComboboxFieldContext.Provider value={fieldContext}>
      <ComboboxPrimitive.Root<ComboboxOption, boolean>
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        filter={primitiveFilter}
        autoHighlight={autoHighlight}
        {...props}
      >
        <div data-slot="combobox" className={cn(className)}>
          {children}
          {/* Região viva FORA da caixa do campo: dentro dela, o texto do
              anúncio entraria na descrição do próprio campo em alguns leitores. */}
          <span role="status" aria-live="polite" className="nds-sr-only">
            {announcement}
          </span>
        </div>
      </ComboboxPrimitive.Root>
    </ComboboxFieldContext.Provider>
  )
}

// ─── Rótulo e caixa do campo ──────────────────────────────────────────────────

function ComboboxLabel({
  className,
  htmlFor,
  ...props
}: React.ComponentProps<"label">) {
  const { inputId } = useComboboxField()
  return (
    <label
      data-slot="combobox-label"
      className={cn("nds-combobox-label", className)}
      htmlFor={htmlFor ?? inputId}
      {...props}
    />
  )
}

/**
 * A caixa que PARECE um campo: borda, fundo e anel de foco moram aqui, e o
 * input por dentro é transparente. É o que permite chips e texto conviverem na
 * mesma caixa, com um anel só em volta do conjunto.
 */
function ComboboxInputWrapper({
  className,
  disabled,
  onMouseDown,
  ...props
}: React.ComponentProps<"div"> & { disabled?: boolean }) {
  return (
    <div
      data-slot="combobox-input-wrapper"
      // A folha apaga a caixa por `[data-disabled]`, e a caixa é nossa, não da
      // lib: nenhum estado dela chega até aqui. Repetir a flag é o preço de a
      // caixa não ser uma peça do `@base-ui`.
      data-disabled={disabled ? "" : undefined}
      className={cn("nds-combobox-input-wrapper", className)}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        // Clicar em qualquer canto da caixa leva ao texto — é o `cursor: text`
        // da folha cumprindo o que promete. Só quando o alvo é a própria caixa:
        // clique em chip, botão ou input já tem dono.
        if (event.defaultPrevented || event.target !== event.currentTarget) return
        event.preventDefault()
        event.currentTarget
          .querySelector<HTMLInputElement>('[data-slot="combobox-input"]')
          ?.focus()
      }}
      {...props}
    />
  )
}

function ComboboxInput({ className, id, ...props }: ComboboxPrimitive.Input.Props) {
  const { inputId } = useComboboxField()
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      id={id ?? inputId}
      className={cn("nds-combobox-input", className)}
      {...props}
    />
  )
}

// ─── Chips ────────────────────────────────────────────────────────────────────

function ComboboxChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn("nds-combobox-chips", className)}
      {...props}
    />
  )
}

function ComboboxChip({ className, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      // `<span>` e não `<div>`: o chip vive na mesma linha do texto digitado, e
      // o Vanilla — a referência — emite `<span>`.
      render={<span />}
      data-slot="combobox-chip"
      className={cn("nds-combobox-chip", className)}
      {...props}
    />
  )
}

function ComboboxChipText({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="combobox-chip-text" className={className} {...props} />
}

/**
 * Botão de remover do chip. O nome acessível é PRÓPRIO — "Remover Brasil", e
 * nunca só "Remover": numa lista de cinco chips, cinco botões com o mesmo nome
 * são indistinguíveis para quem navega por lista de controles.
 */
function ComboboxChipRemove({
  className,
  children,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      className={cn("nds-combobox-chip-remove", className)}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ComboboxPrimitive.ChipRemove>
  )
}

// ─── Ações do campo ───────────────────────────────────────────────────────────

function ComboboxClear({
  className,
  children,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn("nds-combobox-clear", className)}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ComboboxPrimitive.Clear>
  )
}

/**
 * Abre e fecha pelo clique. Fica FORA da ordem de tabulação (a lib já põe
 * `tabIndex={-1}`): quem tem foco é o input, e o Tab precisa sair do campo em
 * vez de parar num segundo alvo que faz o que a seta já faz.
 */
function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("nds-combobox-trigger", className)}
      {...props}
    >
      {children ?? (
        <ComboboxPrimitive.Icon
          render={
            <ChevronDownIcon
              className="nds-combobox-icon"
              data-slot="combobox-icon"
            />
          }
        />
      )}
    </ComboboxPrimitive.Trigger>
  )
}

// ─── Popup ────────────────────────────────────────────────────────────────────

export interface ComboboxContentProps
  extends Omit<ComboboxPrimitive.Popup.Props, "children"> {
  /**
   * Filhos da LISTA, não do popup. Aceita a forma de função — a lib chama uma
   * vez por opção já filtrada, e é ela que dá filtragem sem código.
   */
  children?: ComboboxPrimitive.List.Props["children"]
  /** Texto exibido quando o filtro não casa com nenhuma opção. Obrigatório. */
  emptyMessage: React.ReactNode
  side?: ComboboxPrimitive.Positioner.Props["side"]
  sideOffset?: ComboboxPrimitive.Positioner.Props["sideOffset"]
  align?: ComboboxPrimitive.Positioner.Props["align"]
  /** Nome da lista para leitor de tela, quando o campo não tiver rótulo visível. */
  listLabel?: string
}

function ComboboxContent({
  className,
  children,
  emptyMessage,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  listLabel,
  ...props
}: ComboboxContentProps) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        data-slot="combobox-positioner"
        className="nds-combobox-positioner"
        side={side}
        sideOffset={sideOffset}
        align={align}
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-popup"
          className={cn("nds-combobox-popup", className)}
          {...props}
        >
          <ComboboxPrimitive.List
            data-slot="combobox-list"
            className="nds-combobox-list"
            aria-label={listLabel}
          >
            {children}
          </ComboboxPrimitive.List>
          {/* Irmã da lista, e não filha: `role="status"` não é filho válido de
              `role="listbox"`, e o axe reprovaria a lista inteira por causa
              dele. Mesma leitura que já valeu para o separador do `select`. */}
          <ComboboxPrimitive.Empty>
            <div data-slot="combobox-empty" className="nds-combobox-empty">
              {emptyMessage}
            </div>
          </ComboboxPrimitive.Empty>
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn("nds-combobox-group", className)}
      {...props}
    />
  )
}

function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn("nds-combobox-group-label", className)}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn("nds-combobox-item", className)}
      {...props}
    >
      <span data-slot="combobox-item-text">{children}</span>
      <ComboboxPrimitive.ItemIndicator
        render={
          <span
            data-slot="combobox-item-indicator"
            className="nds-combobox-item-indicator"
          />
        }
      >
        <CheckIcon aria-hidden="true" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    // `aria-hidden`: dentro de um listbox a linha é DECORATIVA. Sem isso o
    // primitivo emite `role="separator"` como filho direto de `role="listbox"`,
    // que é filho não permitido (axe `aria-required-children`). Quem separa
    // para o leitor de tela é o grupo. Mesma decisão do `select`.
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      aria-hidden="true"
      className={cn("nds-combobox-separator", className)}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChipText,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxTrigger,
}
