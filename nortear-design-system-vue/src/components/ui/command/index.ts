import type { Ref } from 'vue'
import { createContext } from 'reka-ui'

export { default as Command } from './Command.vue'
export { default as CommandDialog } from './CommandDialog.vue'
export { default as CommandEmpty } from './CommandEmpty.vue'
export { default as CommandGroup } from './CommandGroup.vue'
export { default as CommandInput } from './CommandInput.vue'
export { default as CommandItem } from './CommandItem.vue'
export { default as CommandList } from './CommandList.vue'
export { default as CommandSeparator } from './CommandSeparator.vue'
export { default as CommandShortcut } from './CommandShortcut.vue'

export const [useCommand, provideCommandContext] = createContext<{
  /**
   * Id do `CommandList`. O campo de busca aponta para ele em `aria-controls`,
   * que é o que fecha o par combobox → listbox do padrão ARIA. Nasce na raiz
   * porque campo e lista são IRMÃOS: nenhum dos dois alcança o id do outro.
   */
  listId: string
  /**
   * Nome acessível da lista: o placeholder do campo de busca, que o
   * `CommandInput` publica aqui. Os dois são IRMÃOS — a lista não alcança o
   * campo por conta própria, e sem este canal ela ficava com um nome fixo que
   * não dizia o que se estava buscando.
   */
  searchLabel: Ref<string | undefined>
  /**
   * Por item, os textos que o filtro compara com a busca: o rótulo SEM o atalho
   * e o `value`. É uma função, e não o texto, porque o rótulo é relido a cada
   * atualização do item (troca de idioma, por exemplo).
   */
  allItems: Ref<Map<string, () => string[]>>
  allGroups: Ref<Map<string, Set<string>>>
  filterState: {
    search: string
    filtered: { count: number, items: Map<string, number>, groups: Set<string> }
  }
}>('Command')

export const [useCommandGroup, provideCommandGroupContext] = createContext<{
  id?: string
}>('CommandGroup')

/**
 * Marca que a paleta mora num `CommandDialog`. É o único lugar em que o campo
 * de busca recebe foco sozinho: a paleta acabou de abrir e a pessoa vai
 * digitar. Inline, na página, o campo NÃO rouba o foco ao montar — tirar a
 * pessoa de onde ela estava lendo é o defeito que isto evita.
 */
export const [useCommandDialog, provideCommandDialogContext] = createContext<{
  autoFocusInput: boolean
}>('CommandDialog')
