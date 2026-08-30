import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isModelSelectable, type ModelOption } from "@shared/primitives/chat-protocol"

/**
 * O controle do trilho que diz QUEM responde.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor de modelo, que também
 * guarda as quatro decisões de acessibilidade. O vocabulário — `ModelOption`,
 * `isModelSelectable` — vem de `@shared/primitives/chat-protocol`.
 *
 * A PEÇA É AUTÔNOMA. Ela não mora dentro do composer: quem consome a monta e a
 * põe no início do trilho, pelo mesmo espaço que qualquer outro controle usa.
 * É o que permite ter o seletor sem ter o campo — numa barra de ferramentas,
 * numa página de ajustes — e é o que impede o composer de crescer uma prop por
 * controle que alguém invente.
 *
 * O GATILHO LEVA SÓ O NOME, A LISTA LEVA A DESCRIÇÃO. Um trilho é estreito e o
 * nome é o que se confere de relance; a descrição é o que se lê na hora de
 * trocar. Pôr as duas no gatilho encolhe o campo, que é o que importa ali.
 *
 * O FOCO ENTRA NA LISTA, ao contrário do seletor do caractere gatilho. Lá o
 * foco não pode sair do campo, porque quem escolhe continua escrevendo; aqui
 * não há texto em curso — a escolha é o único assunto enquanto a lista está
 * aberta, e a lista é o lugar certo para o teclado estar. O cursor anda por
 * `aria-activedescendant`, e fechar devolve o foco ao gatilho.
 *
 * O QUE O COMPONENTE NÃO FAZ: trocar de modelo. Ele avisa qual foi confirmado
 * e devolve o controle — quem sabe o que a troca custa, quem tem direito a
 * qual e o que acontece depois é quem monta a conversa. Mesma divisão de
 * `approval` no `chat-thread`.
 */

export interface ComposerModelPickerLabels {
  /** Nome acessível do gatilho. `{label}` vira o nome do modelo escolhido. */
  trigger: string
  /** Nome acessível da lista. */
  list: string
}

export interface ComposerModelPickerProps {
  /** Os modelos que podem responder, na ordem em que aparecem na lista. */
  models: ModelOption[]
  /** O texto da interface. Sem padrão em inglês escondido. */
  labels: ComposerModelPickerLabels
  /**
   * O modelo escolhido, pelo endereço dele.
   *
   * Sem ele, o primeiro que PODE responder: abrir com um indisponível no
   * gatilho prometeria uma resposta que não vem.
   *
   * Sozinho é semente. Trocado depois — que é o caminho de quem APLICOU a
   * escolha e a devolve —, é quem consome que manda: o seletor relê o valor e
   * passa a mostrá-lo.
   */
  value?: string
  /** Alguém confirmou um modelo. Aplicar a troca é de quem monta a conversa. */
  onValueChange?: (model: ModelOption) => void
  /**
   * A lista começa aberta.
   *
   * É SEMENTE, e não controle: quem abre e fecha depois é o próprio seletor,
   * porque abrir e fechar é desenho e não estado do mundo (guideline 17, §2).
   * `onOpenChange` existe para quem precisa acompanhar.
   */
  open?: boolean
  /** A lista abriu ou fechou. */
  onOpenChange?: (open: boolean) => void
  className?: string
}

/** O primeiro que pode responder, ou o primeiro da lista se nenhum puder. */
function firstSelectable(models: ModelOption[]): number {
  const found = models.findIndex(isModelSelectable)
  return found === -1 ? 0 : found
}

/** O índice do endereço recebido, ou o do primeiro que pode responder. */
function indexOfValue(models: ModelOption[], value: string | undefined): number {
  const found = value === undefined ? -1 : models.findIndex((model) => model.id === value)
  return found === -1 ? firstSelectable(models) : found
}

function ComposerModelPicker({
  models,
  labels,
  value,
  onValueChange,
  open: openSeed = false,
  onOpenChange,
  className,
}: ComposerModelPickerProps) {
  const baseId = React.useId()
  const panelId = `${baseId}-panel`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const [selectedIndex, setSelectedIndex] = React.useState(() => indexOfValue(models, value))
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex)
  const [isOpen, setIsOpen] = React.useState(openSeed)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // O próximo abrir ou fechar move o foco? A abertura de SEMENTE não move: o
  // elemento pode nem estar no documento ainda, e roubar o foco ao montar a
  // página é exatamente o que a story fotografaria.
  const moveFocusRef = React.useRef(false)

  // `value` é semente enquanto ninguém a move. Movida, é quem consome que
  // manda — é por aqui que uma escolha APLICADA volta, no lugar do comando
  // imperativo que uma stack sem renderizador precisa expor.
  //
  // O ajuste acontece DURANTE a renderização, e não num efeito. Efeito que
  // chama `setState` de forma síncrona reprova em `react-hooks` porque encadeia
  // uma segunda renderização: a primeira já pintou com o índice velho, e a tela
  // pisca no valor anterior antes de assentar. Ajustando aqui, o React descarta
  // a saída em curso e recomeça antes de tocar o DOM — é o padrão documentado
  // para estado que precisa acompanhar uma prop.
  const [lastValue, setLastValue] = React.useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    const next = models.findIndex((model) => model.id === value)
    if (next !== -1) {
      setSelectedIndex(next)
      setActiveIndex(next)
    }
  }

  // O foco vai para a lista ao abrir e volta ao gatilho ao fechar. É efeito de
  // layout porque foco é posição na tela: agendado como passivo, a lista
  // apareceria por um quadro com o teclado ainda no gatilho.
  React.useLayoutEffect(() => {
    if (!moveFocusRef.current) return
    moveFocusRef.current = false
    if (isOpen) panelRef.current?.focus()
    // Sem isto o foco cairia no começo da página quando a lista some, e quem
    // navega por teclado perderia o lugar.
    else triggerRef.current?.focus()
  }, [isOpen])

  const setOpen = (next: boolean, moveFocus: boolean) => {
    if (next === isOpen) return
    moveFocusRef.current = moveFocus
    // O cursor começa no que já estava escolhido: é de lá que quem troca
    // parte, e começar no topo faria a lista perder o lugar a cada abertura.
    if (next) setActiveIndex(selectedIndex)
    setIsOpen(next)
    onOpenChange?.(next)
  }

  // O ponteiro fora da raiz fecha a lista, sem mexer no foco. Sem isto ela
  // ficaria aberta por cima do que a pessoa foi fazer, e o único jeito de
  // fechá-la seria voltar ao gatilho.
  React.useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: Event) => {
      // O que acontece DENTRO do seletor é dele — inclusive no gatilho, que
      // fecha pelo próprio clique logo depois.
      if (rootRef.current?.contains(event.target as Node)) return
      moveFocusRef.current = false
      setIsOpen(false)
      onOpenChange?.(false)
    }
    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => document.removeEventListener("pointerdown", handlePointerDown, true)
  }, [isOpen, onOpenChange])

  const move = (delta: number) => {
    if (models.length === 0) return
    // Anda por TODAS as opções, inclusive as que não podem ser escolhidas.
    // Pular a indisponível esconderia o motivo justamente de quem navega por
    // teclado — que é quem mais depende de ele estar na leitura.
    setActiveIndex((current) => (current + delta + models.length) % models.length)
  }

  const choose = (index: number) => {
    const model = models[index]
    if (!model) return
    // A pergunta vai ao vocabulário compartilhado, e não a um `if
    // (model.unavailable)` escrito aqui: cinco stacks escreveriam cinco
    // versões da mesma regra, e uma delas discordaria.
    if (!isModelSelectable(model)) {
      // Nada muda, e a lista CONTINUA ABERTA. Fechar sem trocar pareceria uma
      // troca que não aconteceu, e o motivo — que está na própria opção —
      // sairia da tela junto.
      setActiveIndex(index)
      return
    }
    setSelectedIndex(index)
    setOpen(false, true)
    onValueChange?.(model)
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // A seta abre já com a lista sob o cursor — é o atalho de quem troca de
    // modelo sem tirar as mãos do teclado.
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    if (isOpen) return
    event.preventDefault()
    setOpen(true, true)
  }

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        move(1)
        return
      case "ArrowUp":
        event.preventDefault()
        move(-1)
        return
      case "Home":
        event.preventDefault()
        setActiveIndex(0)
        return
      case "End":
        event.preventDefault()
        setActiveIndex(models.length - 1)
        return
      case "Enter":
      case " ":
        event.preventDefault()
        choose(activeIndex)
        return
      case "Escape":
      case "Tab":
        // Tab fecha como Escape: a lista não é uma parada da ordem de foco, e
        // deixar o foco sair dela com o painel aberto deixaria um painel sem
        // dono na tela.
        event.preventDefault()
        setOpen(false, true)
        return
      default:
        return
    }
  }

  const current = models[selectedIndex]
  const currentName = current?.label ?? ""

  return (
    <div
      ref={rootRef}
      data-slot="composer-model"
      data-state={isOpen ? "open" : "closed"}
      className={cn("nds-composer-model", className)}
    >
      <Button
        ref={triggerRef}
        data-slot="composer-model-trigger"
        type="button"
        variant="ghost"
        size="sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        // O gatilho só aponta a lista enquanto ela existe: apontar um endereço
        // vazio é prometer um elemento que não está no documento.
        aria-controls={isOpen ? panelId : undefined}
        // Decisão 1 da folha: o nome acessível diz O QUE o gatilho escolhe, e
        // não só o valor escolhido — "Rápido, botão" não informa nada.
        aria-label={labels.trigger.replace("{label}", currentName)}
        onClick={() => setOpen(!isOpen, !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        {currentName}
      </Button>

      {/* Fechada, a lista NÃO existe no documento. Não é uma lista escondida:
          é ausência. Uma lista presente e invisível continuaria sendo lida, e
          prometeria uma escolha que não está à mão. */}
      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          data-slot="composer-model-panel"
          className="nds-composer-model-panel"
          role="listbox"
          aria-label={labels.list}
          // O foco pousa na lista, e o cursor anda por `aria-activedescendant`.
          // `-1` e não `0`: a lista não é uma parada da ordem de foco — quem
          // chega por Tab chega ao gatilho, que é o controle.
          tabIndex={-1}
          aria-activedescendant={optionId(activeIndex)}
          onKeyDown={handlePanelKeyDown}
        >
          {models.map((model, index) => (
            <div
              key={model.id}
              id={optionId(index)}
              data-slot="composer-model-option"
              data-model-id={model.id}
              data-active={index === activeIndex ? "true" : undefined}
              className="nds-composer-model-option"
              role="option"
              aria-selected={index === selectedIndex}
              // Decisão 2 da folha: `aria-disabled` mais a frase, nunca só o
              // cinza. `disabled` de verdade tiraria a opção da leitura em vez
              // de explicá-la.
              aria-disabled={isModelSelectable(model) ? undefined : true}
              onClick={() => choose(index)}
            >
              <span className="nds-composer-model-name">{model.label}</span>

              {/* Decisão 3 da folha: a etiqueta é REFORÇO. O desenho vem do
                  badge do sistema; o lugar na grade vem da classe da folha. */}
              {model.badge ? (
                <Badge className="nds-composer-model-badge">{model.badge}</Badge>
              ) : null}

              {model.description ? (
                <span className="nds-composer-model-description">{model.description}</span>
              ) : null}

              {/* O motivo em TEXTO, dentro da opção — é o que o cursor anuncia
                  ao passar por ela. Opção apagada sem explicação é a pergunta
                  "por que não posso?" sem resposta na tela. */}
              {model.unavailable && model.unavailableReason ? (
                <span
                  className="nds-composer-model-description"
                  data-slot="composer-model-reason"
                >
                  {model.unavailableReason}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export { ComposerModelPicker }
