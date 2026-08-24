import type { ComputedRef, Ref } from 'vue'
import { createContext } from 'reka-ui'

export { default as Combobox } from './Combobox.vue'
export { default as ComboboxChip } from './ComboboxChip.vue'
export { default as ComboboxChipRemove } from './ComboboxChipRemove.vue'
export { default as ComboboxChips } from './ComboboxChips.vue'
export { default as ComboboxClear } from './ComboboxClear.vue'
export { default as ComboboxEmpty } from './ComboboxEmpty.vue'
export { default as ComboboxGroup } from './ComboboxGroup.vue'
export { default as ComboboxGroupLabel } from './ComboboxGroupLabel.vue'
export { default as ComboboxIcon } from './ComboboxIcon.vue'
export { default as ComboboxInput } from './ComboboxInput.vue'
export { default as ComboboxInputWrapper } from './ComboboxInputWrapper.vue'
export { default as ComboboxItem } from './ComboboxItem.vue'
export { default as ComboboxItemIndicator } from './ComboboxItemIndicator.vue'
export { default as ComboboxLabel } from './ComboboxLabel.vue'
export { default as ComboboxList } from './ComboboxList.vue'
export { default as ComboboxPopup } from './ComboboxPopup.vue'
export { default as ComboboxPositioner } from './ComboboxPositioner.vue'
export { default as ComboboxSeparator } from './ComboboxSeparator.vue'
export { default as ComboboxTrigger } from './ComboboxTrigger.vue'

/**
 * A opção como o FILTRO a enxerga: valor, rótulo e disponibilidade.
 *
 * Não é a lista de opções do consumidor — nesta stack cada opção é um
 * componente, e a lista não existe como dado em lugar nenhum. Esta camada monta
 * o registro de uma opção na hora de perguntar ao filtro, com o rótulo que a
 * própria opção publicou ao montar.
 */
export interface ComboboxFilterItem {
  /** O mesmo `value` que a opção declara. */
  value: string
  /** Rótulo visível da opção; cai no valor enquanto a opção não montou. */
  label: string
  /** Opção indisponível para escolha. */
  disabled?: boolean
}

/**
 * Predicado que substitui o filtro padrão: verdadeiro mantém a opção na lista.
 *
 * `query` é o texto pelo qual a lista está filtrando, que nem sempre é o texto
 * que aparece no campo. Ao abrir, a busca volta a vazia e a lista inteira
 * reaparece mesmo com o rótulo do escolhido escrito no campo; ao escolher, o
 * campo passa a mostrar esse rótulo sem que isso filtre nada.
 */
export type ComboboxFilter = (item: ComboboxFilterItem, query: string) => boolean

/**
 * Contexto PRÓPRIO desta stack — o que a lib não carrega de uma peça à outra.
 *
 * `reka-ui` já é dona do valor escolhido, do que está aberto e do filtro. O que
 * falta é o que amarra as peças que a lib não tem: o `id` que o rótulo do campo
 * precisa apontar, o mapa de rótulo por valor (a lib guarda o VALOR, e o campo
 * de texto tem de mostrar o RÓTULO no modo simples), o texto de busca — que
 * mais de uma peça precisa zerar — e a região viva que anuncia a saída de um
 * chip.
 *
 * É de propósito um contexto pequeno: tudo que a lib já resolve continua vindo
 * de `injectComboboxRootContext()`, e não é copiado para cá. Dois donos do
 * mesmo estado é exatamente o que este componente evita — ver o comentário de
 * ponte em `Combobox.vue`.
 */
export const [useComboboxContext, provideComboboxContext] = createContext<{
  /** `id` do campo de texto; o rótulo do campo aponta para ele em `for`. */
  inputId: string
  /** `id` da lista; vira o `aria-controls` do campo de texto. */
  listId: string
  /** Rótulo por valor, alimentado por cada opção ao montar. */
  labels: Ref<Map<string, string>>
  /** Texto de busca. Mora aqui porque o botão de limpar também o zera. */
  search: Ref<string>
  /** Conteúdo da região viva do campo. */
  announcement: Ref<string>
  /** Publica uma frase na região viva. */
  announce: (message: string) => void
  /**
   * Filtro do consumidor, ou `undefined` quando quem filtra é a lib.
   *
   * Cada opção pergunta por aqui se continua na lista, e o grupo pergunta se
   * ainda lhe sobrou alguma — sem isso, o cabeçalho de um grupo inteiramente
   * filtrado ficaria de pé sobre lugar nenhum.
   */
  filter: ComputedRef<ComboboxFilter | undefined>
}>('Combobox')

/** Contexto de um chip — o valor que o botão de remover tira do modelo. */
export const [useComboboxChipContext, provideComboboxChipContext] = createContext<{
  value: Ref<string>
}>('ComboboxChip')

/** Contexto de um grupo — o `id` do cabeçalho e as opções que sobraram nele. */
export const [useComboboxGroupContext, provideComboboxGroupContext] = createContext<{
  /** `id` do cabeçalho; vira o `aria-labelledby` do grupo. */
  labelId: string
  /**
   * Valores das opções deste grupo que o filtro do consumidor manteve na lista.
   *
   * É um conjunto, e não uma contagem, porque quem escreve são as opções, cada
   * uma por si: com contagem, uma opção que recalculasse duas vezes somaria
   * duas, e o grupo nunca mais voltaria a zero.
   */
  visibleValues: Ref<Set<string>>
}>('ComboboxGroup')
