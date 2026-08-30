import * as React from "react"

import {
  applyTrigger,
  findTrigger,
  rankByTerm,
  type TriggerMatch,
  type TriggerSpec,
} from "@shared/primitives/composer-trigger"

/**
 * O seletor que abre quando alguém digita um caractere gatilho no composer.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor do gatilho. A MÁQUINA —
 * onde o gatilho vale, o que ele recorta, como o filtro ordena e o que fica
 * escrito depois da escolha — vive em `@shared/primitives/composer-trigger`, e
 * é compartilhada pelas cinco stacks. Este módulo é o DOM em volta dela.
 *
 * A DECISÃO QUE ATRAVESSA O COMPOSER INTEIRO: com o seletor aberto, a tecla de
 * envio ESCOLHE em vez de enviar. As duas coisas disputam a mesma tecla, e
 * enviar no meio de uma menção é o defeito que quem escreve encontra na
 * primeira vez que usa. Quem resolve a disputa é o composer, perguntando ao
 * seletor se ele está aberto antes de decidir o que a tecla faz.
 *
 * O FOCO NUNCA SAI DO CAMPO. Quem escreve continua escrevendo enquanto escolhe;
 * mover o foco para a lista faria a próxima letra não chegar ao texto. O campo
 * aponta a opção ativa por `aria-activedescendant`, e a lista nunca é focada.
 *
 * E O CAMPO NÃO VIRA `combobox`, ainda que o padrão tenha esse nome.
 *
 * A primeira versão punha `role="combobox"` no `<textarea>`, que é o que a
 * literatura descreve — e o axe reprovou por `aria-allowed-role`: a
 * especificação de ARIA em HTML não admite esse papel neste elemento, que já é
 * uma caixa de texto de várias linhas. Trocar o papel também custaria a
 * semântica de multilinha, que é o que o campo de fato é.
 *
 * O que fica é o que a caixa de texto ADMITE e resolve o problema:
 * `aria-controls` liga o campo à lista, e `aria-activedescendant` aponta a
 * opção sem mover o foco. `aria-expanded` saiu junto com o papel — ele não é
 * permitido numa caixa de texto, e sem o papel não teria o que descrever.
 *
 * A API DIVERGE do Vanilla, e é assim que tem de ser. Lá uma fábrica devolve um
 * controlador que já traz o elemento pronto, porque sem renderizador não há
 * outro caminho. Aqui a divisão é a idiomática da stack:
 *
 *   - `useComposerTrigger` é o ESTADO — onde o gatilho está, o que a lista
 *     mostra, qual opção está ativa —, e é ele que lê o campo pela referência.
 *   - `ComposerTriggerPopover` é o DESENHO, e não guarda nada.
 *
 * O que NÃO diverge é o comportamento: as mesmas teclas, os mesmos atributos, e
 * o mesmo momento de escolher pelo ponteiro.
 */

/** Uma opção do seletor. */
export interface TriggerOption {
  /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
  id: string
  /** O que se lê na lista, e o que o filtro compara. */
  label: string
  /** Informação de apoio à direita — time, atalho, descrição curta. */
  hint?: string
  /**
   * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o rótulo.
   *
   * Existe porque o que se escreve nem sempre é o que se lê: um comando mostra
   * "Resumir a conversa" e escreve a barra seguida do verbo.
   */
  value?: string
}

/** Um gatilho e as opções que ele oferece. */
export interface TriggerSource {
  spec: TriggerSpec
  options: TriggerOption[]
}

export interface TriggerPopoverLabels {
  /**
   * O que aparece quando o filtro não deixa nada.
   *
   * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela, e
   * silêncio parece que a busca não respondeu.
   */
  empty: string
  /** Nome acessível da lista. */
  list: string
}

/** O que o seletor sabe num instante. */
interface TriggerState {
  open: boolean
  match: TriggerMatch | null
  options: TriggerOption[]
  activeIndex: number
}

const CLOSED: TriggerState = { open: false, match: null, options: [], activeIndex: 0 }

export interface UseComposerTriggerOptions {
  /** O campo que o seletor observa. É ele que aponta a lista e a opção ativa. */
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  sources: TriggerSource[]
  /** Aplicada a escolha, o texto e a posição do cursor voltam por aqui. */
  onApply: (value: string, caret: number) => void
}

export interface ComposerTriggerController {
  /** Endereço da lista, para o campo apontá-la. */
  listId: string
  open: boolean
  options: TriggerOption[]
  activeIndex: number
  /** Endereço da opção ativa, ou nada quando não há o que apontar. */
  activeOptionId: string | undefined
  optionId: (option: TriggerOption) => string
  /**
   * Está aberto? É o que decide de quem é a tecla de envio.
   *
   * Função, e não o campo `open`: quem pergunta é o manipulador de tecla, no
   * mesmo instante em que a tecla chega, e ali o valor do render anterior ainda
   * seria o antigo.
   */
  isOpen: () => boolean
  /** Relê o campo e decide se o seletor abre, filtra ou fecha. */
  sync: () => void
  /** Anda pela lista. O foco não se move; o que muda é a opção apontada. */
  move: (delta: number) => void
  /** Escreve a opção de um índice no campo — é o caminho do ponteiro. */
  choose: (index: number) => boolean
  /** Escreve a opção ativa no campo. Devolve `false` se não havia o que aplicar. */
  applyActive: () => boolean
  /** Fecha sem escolher. */
  close: () => void
}

/**
 * O estado do seletor, ligado a um campo por referência.
 *
 * O gatilho depende de ONDE o cursor está, e não do que o texto contém — e a
 * posição do cursor não é estado de React, é leitura do elemento. Por isso o
 * hook recebe a referência do campo em vez do texto: `sync()` relê os dois
 * juntos, no instante em que é chamado.
 */
export function useComposerTrigger(
  options: UseComposerTriggerOptions,
): ComposerTriggerController {
  const { inputRef, sources, onApply } = options
  const listId = React.useId()
  const [state, setState] = React.useState<TriggerState>(CLOSED)

  // A cópia síncrona do estado. Quem lê são os manipuladores de evento, no
  // mesmo instante em que a tecla chega, e o estado só entrega o valor novo no
  // render seguinte — a tecla de envio decidiria com o estado de antes.
  const stateRef = React.useRef(state)

  const commit = (next: TriggerState) => {
    stateRef.current = next
    setState(next)
  }

  const close = () => {
    // Já fechado não redesenha. Sem esta guarda, cada tecla num campo sem
    // gatilho declarado agendaria um render que não muda nada.
    if (!stateRef.current.open && stateRef.current.options.length === 0) return
    commit(CLOSED)
  }

  const sync = () => {
    const input = inputRef.current
    if (!input) return

    const found = findTrigger(
      input.value,
      input.selectionStart ?? 0,
      sources.map((source) => source.spec),
    )
    if (!found) {
      close()
      return
    }
    const source = sources.find((candidate) => candidate.spec.char === found.spec.char)
    if (!source) {
      close()
      return
    }

    const previous = stateRef.current
    const visible = rankByTerm(source.options, found.term, (option) => option.label)
    // O termo mudou: a opção ativa volta ao topo. Manter o índice faria a
    // escolha pular para outra pessoa a cada letra digitada.
    let activeIndex = previous.match?.term === found.term ? previous.activeIndex : 0
    if (activeIndex >= visible.length) activeIndex = 0

    commit({ open: true, match: found, options: visible, activeIndex })
  }

  const move = (delta: number) => {
    const current = stateRef.current
    if (!current.open || !current.options.length) return
    // Circular: quem está no fim e desce volta ao começo. Uma lista que para na
    // última obriga a subir de volta contando.
    const total = current.options.length
    commit({ ...current, activeIndex: (current.activeIndex + delta + total) % total })
  }

  const applyAt = (index: number): boolean => {
    const current = stateRef.current
    const input = inputRef.current
    if (!current.open || !current.match || !input) return false
    const option = current.options[index]
    if (!option) return false

    const replacement = option.value ?? `${current.match.spec.char}${option.label}`
    const applied = applyTrigger(
      input.value,
      current.match,
      input.selectionStart ?? 0,
      replacement,
    )

    close()
    // Quem escreve no campo é quem o controla. O cursor vai junto: devolver só
    // o texto deixaria o cursor no fim, e não depois do que acabou de entrar.
    onApply(applied.text, applied.caret)
    return true
  }

  const optionId = (option: TriggerOption) => `${listId}-${option.id}`
  const active = state.options[state.activeIndex]

  return {
    listId,
    open: state.open,
    options: state.options,
    activeIndex: state.activeIndex,
    activeOptionId: state.open && active ? optionId(active) : undefined,
    optionId,
    isOpen: () => stateRef.current.open,
    sync,
    move,
    close,
    choose: (index: number) => applyAt(index),
    applyActive: () => applyAt(stateRef.current.activeIndex),
  }
}

export interface ComposerTriggerPopoverProps {
  controller: ComposerTriggerController
  labels: TriggerPopoverLabels
}

/**
 * O painel. Mora dentro da moldura do campo, que é quem o ancora.
 *
 * SEM OPÇÕES, O PAINEL NÃO É UMA LISTA.
 *
 * Uma lista de opções vazia reprova em `aria-required-children`, e com razão:
 * ela promete filhos que não existem, e o leitor de tela anuncia "lista com
 * zero itens" em vez da frase que explica o que houve. Sem o papel, o que resta
 * é o texto — que é justamente o que se quer ler.
 */
function ComposerTriggerPopover({ controller, labels }: ComposerTriggerPopoverProps) {
  const { open, options, activeIndex } = controller
  const isList = open && options.length > 0

  return (
    <div
      data-slot="composer-trigger-popover"
      className="nds-composer-trigger-popover"
      id={controller.listId}
      hidden={!open}
      role={isList ? "listbox" : undefined}
      aria-label={isList ? labels.list : undefined}
    >
      {!open ? null : options.length === 0 ? (
        <p className="nds-composer-trigger-empty">{labels.empty}</p>
      ) : (
        options.map((option, index) => (
          <div
            key={option.id}
            id={controller.optionId(option)}
            className="nds-composer-trigger-option"
            role="option"
            // A marcação e a cor de fundo saem juntas: uma é o que o leitor de
            // tela anuncia, a outra é o que os olhos veem. Só uma deixa metade
            // das pessoas sem saber onde está.
            aria-selected={index === activeIndex}
            // Ao APERTAR o botão, e não ao soltar: soltar tira o foco do campo
            // antes, e a escolha passaria a acontecer com o cursor já perdido.
            onMouseDown={(event) => {
              event.preventDefault()
              controller.choose(index)
            }}
          >
            <span className="nds-composer-trigger-option-label">{option.label}</span>
            {option.hint ? (
              <span className="nds-composer-trigger-option-hint">{option.hint}</span>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}

export { ComposerTriggerPopover }
