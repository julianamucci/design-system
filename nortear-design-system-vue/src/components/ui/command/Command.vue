<script setup lang="ts">
import type { ListboxRootEmits, ListboxRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ListboxRoot, useFilter, useForwardPropsEmits, useId } from 'reka-ui'
import { reactive, ref, watch } from 'vue'
import { cn } from '@/lib/utils'
import { provideCommandContext } from './index'

const props = withDefaults(defineProps<ListboxRootProps & { class?: HTMLAttributes['class'] }>(), {
  modelValue: '',
})

const emits = defineEmits<ListboxRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const allItems = ref<Map<string, string>>(new Map())
const allGroups = ref<Map<string, Set<string>>>(new Map())

const listId = useId(undefined, 'nds-command-list')

const { contains } = useFilter({ sensitivity: 'base' })
const filterState = reactive({
  search: '',
  filtered: {
    /** The count of all visible items. */
    count: 0,
    /** Map from visible item id to its search score. */
    items: new Map() as Map<string, number>,
    /** Set of groups with at least one visible item. */
    groups: new Set() as Set<string>,
  },
})

function filterItems() {
  if (!filterState.search) {
    filterState.filtered.count = allItems.value.size
    // Do nothing, each item will know to show itself because search is empty
    return
  }

  // Reset the groups
  filterState.filtered.groups = new Set()
  let itemCount = 0

  // Check which items should be included
  for (const [id, value] of allItems.value) {
    const score = contains(value, filterState.search)
    filterState.filtered.items.set(id, score ? 1 : 0)
    if (score)
      itemCount++
  }

  // Check which groups have at least 1 item shown
  for (const [groupId, group] of allGroups.value) {
    for (const itemId of group) {
      if (filterState.filtered.items.get(itemId)! > 0) {
        filterState.filtered.groups.add(groupId)
        break
      }
    }
  }

  filterState.filtered.count = itemCount
}

watch(() => filterState.search, () => {
  filterItems()
})

provideCommandContext({
  listId,
  allItems,
  allGroups,
  filterState,
})
</script>

<!--
  ─── DECISÃO DE ACESSIBILIDADE — versão curta ───────────────────────────────

  Bloco canônico no `command.ts` do Vanilla. Em uma frase: a paleta é um
  COMBOBOX com listbox, e o que a define é o foco NUNCA sair do campo de busca —
  as setas movem o destaque, e quem conta ao leitor de tela onde ele está é o
  `aria-activedescendant`. É o que a separa do dropdown-menu (que move o foco de
  verdade), do popover (que recebe foco) e do tooltip (que nem recebe).

  ─── O mecanismo NESTA stack ───────────────────────────────────────────────────

  Medido em `reka-ui` (2026-09-02). Esta stack compõe a família Listbox, não um
  primitivo "command": `ListboxRoot` + `ListboxFilter` + `ListboxContent` +
  `ListboxItem` + `ListboxGroup`. O que a lib dá pronto é o `role="listbox"`, o
  `role="option"`, a navegação por setas e o `aria-activedescendant`; o que
  ela NÃO dá — e é escrito aqui — é o lado COMBOBOX do par:

    · `CommandInput` escreve `role="combobox"`, `aria-autocomplete`,
      `aria-expanded` e `aria-controls`, porque o `ListboxFilter` renderiza um
      `<input type="text">` puro. `aria-expanded` é fixo em `true`: a paleta não
      tem estado fechado, quem abre e fecha é o Dialog em volta;
    · o `listId` nasce na RAIZ porque campo e lista são IRMÃOS — nenhum dos dois
      alcança o id do outro, e sem isso o `aria-controls` apontaria para órfão;
    · `CommandItem` reescreve `aria-selected` para acompanhar o DESTAQUE (a lib
      o deriva do modelo e marca o destaque só com `data-highlighted`, que
      nenhuma regra da folha alcança);
    · `CommandSeparator` vira decorativo, porque o primitivo emite
      `role="separator"`, filho não permitido de `listbox`;
    · `CommandEmpty` fica FORA do `CommandList`, montado o tempo todo, com
      `role="status"` + `aria-live` + `aria-atomic` — a única região viva do
      componente, e justificada no bloco canônico (item 6). Esta stack CUMPRE o
      contrato; react e svelte ainda não.
-->

<template>
  <ListboxRoot
    data-slot="command"
    v-bind="forwarded"
    :class="cn('nds-command', props.class)"
  >
    <slot />
  </ListboxRoot>
</template>
