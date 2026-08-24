import type { Ref } from 'vue'
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
}>('Combobox')

/** Contexto de um chip — o valor que o botão de remover tira do modelo. */
export const [useComboboxChipContext, provideComboboxChipContext] = createContext<{
  value: Ref<string>
}>('ComboboxChip')

/** Contexto de um grupo — o `id` que amarra o cabeçalho às opções. */
export const [useComboboxGroupContext, provideComboboxGroupContext] = createContext<{
  labelId: string
}>('ComboboxGroup')
