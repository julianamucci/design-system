import { createContext, useContext, useMemo } from "react"
import type * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// ─── Stepper — composição React pura ────────────────────────────────────────
//
// Visual: classes .nds-stepper-* de `docs/shared/styles/nds/stepper.css`.
//
// A FOLHA É O CONTRATO, e é dela que esta implementação sai — não do avesso.
// Ela declara `<ol class="nds-stepper">` com `<li class="nds-stepper-item">`, o
// estado em `data-state` (active/completed/inactive) e a indisponibilidade em
// `data-disabled` no item. O `<button class="nds-stepper-trigger">` com
// `cursor: pointer` e anel de `:focus-visible` diz, sem ambiguidade, que a etapa
// é um CONTROLE.
//
// Não há Stepper na lib headless desta stack, e não se inventou uma: o
// componente é composição de React puro, e o estado de cada etapa é DERIVADO por
// contexto — a raiz publica o valor do fluxo, o item compara o próprio número
// com ele e chega sozinho a concluída, atual ou ainda não alcançada. Nenhum
// estado é escrito duas vezes, então nenhum pode divergir.
//
// `data-slot` existe para asserção e para quem lê o DOM; quem estiliza é a
// CLASSE. Trocar essa ordem prenderia a folha à árvore de um framework só.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ────────
//
// 1. A RAIZ É LISTA ORDENADA. A ordem e a contagem das etapas são o conteúdo,
//    não decoração: `<ol>` as anuncia sozinho ("lista, 4 itens, item 2") e
//    poupa texto inventado. Um `<div role="group">` com rótulo diria menos e
//    custaria mais.
//
// 2. A ETAPA ATUAL LEVA `aria-current="step"`, e não `aria-current="true"`.
//    `step` é o token que a WAI-ARIA define para posição num processo; `true`
//    é o genérico, e diz "este é o atual" sem dizer atual do quê. É a mesma
//    escolha que `pagination` já faz nesta casa com `page`.
//
// 3. ESTADO NÃO DEPENDE SÓ DE COR (WCAG 1.4.1), e por dois caminhos ao mesmo
//    tempo, porque um só não cobre todo mundo:
//      • visual — a etapa concluída troca o NÚMERO por uma marca de
//        verificação. É forma, não matiz, e sobrevive a daltonismo e a tela
//        monocromática.
//      • programático — `labels.completed` e `labels.current` viram uma
//        palavra `.nds-sr-only` dentro do gatilho. Quem não vê a marca ouve
//        "Etapa concluída".
//    Os rótulos moram na RAIZ, e não no gatilho, porque o estado de uma etapa
//    MUDA quando o fluxo avança: uma palavra fixa por gatilho estaria errada
//    no passo seguinte.
//
// 4. INDICADOR E TRAÇO SÃO DESENHO, e levam `aria-hidden="true"`. O número do
//    indicador repete a posição que a lista já anuncia, e ler os dois faz o
//    leitor de tela dizer a mesma coisa duas vezes.
//
// 5. NÃO HÁ REGIÃO VIVA. Um indicador que se reanuncia a cada avanço atropela
//    a leitura do resto da tela. Quem anuncia o avanço é o painel que trocou
//    de conteúdo, e é para ele que a aplicação move o foco.
//
// 6. ETAPA INDISPONÍVEL É `disabled` DE VERDADE, e sai da ordem de tabulação.
//    Um botão focável que não leva a lugar nenhum é uma parada de foco que
//    gasta o tempo de quem navega por teclado sem entregar nada.
//
// 7. SEM ALTURA FIXA EM TEXTO (WCAG 1.4.4). O círculo do indicador tem
//    dimensão fixa de propósito — mas RELATIVA: `--spacing-8` é
//    `calc(var(--spacing-base) * 8)` com `--spacing-base: 0.25rem`, então o
//    círculo cresce com a densidade e com o tamanho de fonte do navegador.
//    Título e descrição vivem FORA dele e nunca são recortados.

export type StepperState = "inactive" | "active" | "completed"

/**
 * Palavras de estado lidas só por leitor de tela.
 *
 * Ausentes, nada é anunciado — e aí a diferença entre concluída e futura fica
 * só na marca de verificação, que é visual. A documentação cobra as duas.
 */
export interface StepperLabels {
  completed?: string
  current?: string
}

interface StepperContextValue {
  /** Número da etapa atual do fluxo, contando de 1. */
  value: number
  labels: StepperLabels
  onStepSelect?: (step: number) => void
}

interface StepperItemContextValue {
  step: number
  state: StepperState
  disabled: boolean
}

const StepperContext = createContext<StepperContextValue>({
  value: 1,
  labels: {},
})

// `null` é o valor de fora de um item, e é o que permite às peças renderizarem
// sem quebrar quando alguém as usa soltas — o indicador fica sem número, e isso
// se vê na hora, em vez de estourar a página inteira.
const StepperItemContext = createContext<StepperItemContextValue | null>(null)

export type StepperProps = Omit<React.ComponentProps<"ol">, "value"> & {
  /** Etapa atual, contando de 1. É dela que cada item deriva o próprio estado. */
  value?: number
  /** Nome acessível do fluxo. Sem ele o leitor de tela anuncia só uma lista. */
  "aria-label": string
  labels?: StepperLabels
  /** Chamado com o número da etapa quando um gatilho disponível é acionado. */
  onStepSelect?: (step: number) => void
}

/**
 * Raiz do Stepper.
 *
 * `data-value` fica no DOM porque é o que torna o estado do fluxo inspecionável
 * de fora do React — a mesma leitura que as outras stacks entregam.
 */
function Stepper({
  value = 1,
  labels,
  onStepSelect,
  className,
  children,
  ...props
}: StepperProps) {
  const context = useMemo<StepperContextValue>(
    () => ({ value, labels: labels ?? {}, onStepSelect }),
    [value, labels, onStepSelect]
  )

  return (
    <StepperContext.Provider value={context}>
      <ol
        {...props}
        data-slot="stepper"
        data-value={value}
        className={cn("nds-stepper", className)}
      >
        {children}
      </ol>
    </StepperContext.Provider>
  )
}

export type StepperItemProps = React.ComponentProps<"li"> & {
  /** Número desta etapa, contando de 1. */
  step: number
  /** Conta como concluída mesmo estando depois da atual. */
  completed?: boolean
  /** Indisponível: o gatilho sai da ordem de tabulação. */
  disabled?: boolean
}

/**
 * Uma etapa.
 *
 * O estado é derivado aqui, num lugar só, e desce por contexto para o gatilho e
 * para o indicador. `data-completed` marca a decisão de quem compõe (concluída
 * fora de ordem); `data-state` é o resultado, e é dele que a folha vive.
 */
function StepperItem({
  step,
  completed,
  disabled,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { value } = useContext(StepperContext)

  const state: StepperState =
    completed || step < value
      ? "completed"
      : step === value
        ? "active"
        : "inactive"

  const context = useMemo<StepperItemContextValue>(
    () => ({ step, state, disabled: Boolean(disabled) }),
    [step, state, disabled]
  )

  return (
    <StepperItemContext.Provider value={context}>
      <li
        {...props}
        data-slot="stepper-item"
        data-step={step}
        data-state={state}
        {...(completed ? { "data-completed": "" } : {})}
        {...(disabled ? { "data-disabled": "" } : {})}
        className={cn("nds-stepper-item", className)}
      >
        {children}
      </li>
    </StepperItemContext.Provider>
  )
}

export type StepperTriggerProps = React.ComponentProps<"button">

/**
 * Controle da etapa.
 *
 * `type="button"` é forçado DEPOIS do espalhamento: dentro de um `<form>` — que
 * é o caso de todo wizard — um botão sem `type` é `submit`, e clicar numa etapa
 * enviaria o formulário. Deixar a prop passar reabriria exatamente esse buraco.
 *
 * A palavra `.nds-sr-only` vem da RAIZ, e por isso acompanha o fluxo: quando o
 * valor avança, o gatilho que dizia "Etapa atual" passa a dizer "Etapa
 * concluída" sem que ninguém reescreva nada.
 */
function StepperTrigger({
  className,
  children,
  disabled,
  onClick,
  ...props
}: StepperTriggerProps) {
  const { labels, onStepSelect } = useContext(StepperContext)
  const item = useContext(StepperItemContext)

  const word =
    item?.state === "completed"
      ? labels.completed
      : item?.state === "active"
        ? labels.current
        : undefined

  return (
    <button
      {...props}
      type="button"
      data-slot="stepper-trigger"
      className={cn("nds-stepper-trigger", className)}
      // Só a etapa atual carrega `aria-current`. Deixar o atributo para trás ao
      // avançar daria DOIS "atual" na mesma lista, que é pior do que nenhum.
      aria-current={item?.state === "active" ? "step" : undefined}
      disabled={disabled ?? item?.disabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || !item) return
        onStepSelect?.(item.step)
      }}
    >
      <span className="nds-sr-only" data-slot="stepper-state-label">
        {word ?? ""}
      </span>
      {children}
    </button>
  )
}

export type StepperIndicatorProps = React.ComponentProps<"span">

/**
 * Círculo numerado.
 *
 * `aria-hidden` porque o número repete a posição que a `<ol>` já anuncia.
 *
 * Com conteúdo próprio o indicador passa a ser `data-custom` e o número deixa de
 * entrar — senão a marca de verificação apagaria o ícone que quem compõe pôs
 * ali.
 */
function StepperIndicator({
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const item = useContext(StepperItemContext)
  const custom = children !== undefined && children !== null

  return (
    <span
      {...props}
      data-slot="stepper-indicator"
      aria-hidden="true"
      {...(custom ? { "data-custom": "" } : {})}
      className={cn("nds-stepper-indicator", className)}
    >
      {custom ? (
        children
      ) : item?.state === "completed" ? (
        // `.nds-icon` NÃO é decoração: sem dimensão declarada a marca ocupa o
        // círculo inteiro, porque cada lib de ícone entrega um padrão diferente
        // (aqui 24px por atributo, e a regra da folha vence o atributo). A
        // classe fixa 1rem e é o que deixa as cinco stacks desenhando a mesma
        // marca dentro do mesmo círculo.
        <Check className="nds-icon" aria-hidden="true" />
      ) : (
        item?.step
      )}
    </span>
  )
}

export type StepperTitleProps = React.ComponentProps<"span">

function StepperTitle({ className, ...props }: StepperTitleProps) {
  return (
    <span
      {...props}
      data-slot="stepper-title"
      className={cn("nds-stepper-title", className)}
    />
  )
}

export type StepperDescriptionProps = React.ComponentProps<"span">

function StepperDescription({ className, ...props }: StepperDescriptionProps) {
  return (
    <span
      {...props}
      data-slot="stepper-description"
      className={cn("nds-stepper-description", className)}
    />
  )
}

export type StepperSeparatorProps = React.ComponentProps<"div">

/**
 * Traço até a próxima etapa.
 *
 * Mora DENTRO do item, depois do gatilho, como a folha documenta — e não entre
 * os itens. É isso que faz `.nds-stepper-item[data-state="completed"]
 * .nds-stepper-separator` alcançá-lo sem regra extra.
 */
function StepperSeparator({ className, ...props }: StepperSeparatorProps) {
  return (
    <div
      {...props}
      data-slot="stepper-separator"
      aria-hidden="true"
      className={cn("nds-stepper-separator", className)}
    />
  )
}

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
}
