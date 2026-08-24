<script setup lang="ts">
import type { ComboboxRootEmits, ComboboxRootProps } from 'reka-ui'
import type { HTMLAttributes, Ref } from 'vue'
import type { ComboboxFilter } from './index'
import { reactiveOmit, useVModel } from '@vueuse/core'
import { ComboboxRoot, useForwardPropsEmits, useId } from 'reka-ui'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { provideComboboxContext } from './index'

/*
 * ─── A PONTE ENTRE O COMBOBOX E OS CHIPS ────────────────────────────────────
 *
 * Este arquivo é mais complicado que o das outras stacks, e a razão cabe aqui.
 *
 * `reka-ui` tem `Combobox*` (raiz, campo, lista, opção, grupo, vazio) e NÃO tem
 * chips. Os chips vivem num primitivo separado, `TagsInput*`, que traz raiz
 * própria e estado próprio. A leitura óbvia seria costurar os dois — um
 * `TagsInputRoot` por fora, um `ComboboxRoot` por dentro, o `ComboboxInput`
 * como `as-child` do `TagsInputInput` — e sincronizar os dois modelos.
 *
 * Foi medido em `node_modules/reka-ui/dist/TagsInput/`, e a costura sai PIOR
 * que escrever os chips à mão sobre o `ComboboxRoot`. Quatro achados, cada um
 * verificável no código da lib:
 *
 *   1. Backspace do `TagsInput` é de DOIS tempos. `TagsInputRoot.onInputKeydown`
 *      com nada selecionado faz `selectedElement = lastTag` e para; só a
 *      segunda tecla remove. O contrato fechado deste componente diz "Backspace
 *      com o campo vazio remove o último chip" — uma tecla. Costurar exigiria
 *      desligar o teclado do primitivo importado para chips.
 *
 *   2. Enter colide. `TagsInputInput` liga `withKeys(handleCustomKeydown,
 *      ['enter'])`, que transforma o TEXTO DIGITADO em tag. Aqui Enter tem de
 *      escolher a opção ativa da lista, e o valor livre não existe: os dois
 *      handlers cairiam no mesmo elemento do DOM.
 *
 *   3. O botão de remover perde o nome próprio. `TagsInputItemDelete` escreve
 *      `aria-labelledby` apontando para o texto da tag, e `aria-labelledby`
 *      vence `aria-label`. O nome sairia "React", nunca "Remover React" — que é
 *      justamente o item de acessibilidade do contrato.
 *
 *   4. Dois donos do mesmo valor. `TagsInputRoot` tem `modelValue`, `name`,
 *      `required` e `disabled` próprios, e emite o seu próprio campo escondido
 *      de formulário. Com `ComboboxRoot` também emitindo o dele, o mesmo `name`
 *      viajaria duas vezes no envio, e o foco sairia do campo de texto para
 *      percorrer os chips — o oposto do que `aria-activedescendant` promete.
 *
 * Então a ponte é de UM DONO SÓ: o valor mora em `ComboboxRoot` e mais nada o
 * duplica. Os chips são marcação desta camada, lida do próprio `modelValue`, e
 * quem remove um chip escreve de volta nesse mesmo `modelValue` — não há o que
 * sincronizar porque não há segundo estado. O `tags-input/` desta stack segue
 * existindo para o caso de valor LIVRE, que é outro componente.
 *
 * O que sobra de trabalho manual, e onde está cada peça:
 *   - chips e botão de remover ....... `ComboboxChip*.vue`
 *   - Backspace de uma tecla ......... `ComboboxInput.vue`
 *   - Escape com a lista fechada ..... `ComboboxInput.vue`
 *   - volta da última opção à primeira `ComboboxInputWrapper.vue` (a lib para
 *     na ponta da lista; o contrato pede circular)
 *   - região viva da remoção ......... `ComboboxInputWrapper.vue`
 */

/*
 * ─── TEXTO DE BUSCA E FILTRO: O QUE ESTA CAMADA ACRESCENTA ──────────────────
 *
 * Duas capacidades do contrato não têm equivalente na lib, e a forma que elas
 * ganharam aqui DIVERGE do nome publicado no conteúdo compartilhado. Divergiu
 * porque é API de framework, e API de framework não se alinha entre stacks:
 *
 *   texto controlado ... `v-model:input-value` (prop `inputValue` + evento
 *                        `update:inputValue`). O conteúdo compartilhado nomeia
 *                        `inputValue` e um callback de mudança; em Vue o par
 *                        prop + evento É o callback, e escrever `onInputValue
 *                        Change` como prop seria estrangeiro à linguagem.
 *
 *   filtro ............. prop `filter`, com a assinatura publicada. O tipo do
 *                        primeiro parâmetro é `ComboboxFilterItem`, e não
 *                        `ComboboxItem`: `ComboboxItem` já é o COMPONENTE de
 *                        opção nesta stack, e um tipo com o nome do componente
 *                        colidiria no mesmo import.
 *
 * Por que o filtro precisa de trabalho nosso: `reka-ui` não aceita predicado.
 * Ela filtra por dentro, com `Intl.Collator` de sensibilidade `base`, contra um
 * texto que guarda por opção (`ComboboxRoot.filterState`), e o único controle
 * publicado é `ignoreFilter`, que DESLIGA esse filtro. Então, quando chega um
 * `filter`, esta camada liga `ignoreFilter` e passa a decidir opção por opção
 * (`ComboboxItem.vue`) e grupo por grupo (`ComboboxGroup.vue`).
 *
 * Sem `filter`, nada disso entra em cena: quem filtra segue sendo a lib, com o
 * mesmo comportamento de antes — acento e caixa ignorados.
 */
const props = withDefaults(
  defineProps<ComboboxRootProps & {
    class?: HTMLAttributes['class']
    /** Texto de busca controlado. Sem ele, o campo administra o próprio texto. */
    inputValue?: string
    /** Substitui o filtro. Sem ele, quem filtra é a lib. */
    filter?: ComboboxFilter
  }>(),
  {
    // A opção sob o ponteiro vira a opção ativa, como na referência Vanilla.
    highlightOnHover: true,
    // Clicar no campo abre a lista — a folha promete isso com `cursor: text`.
    openOnClick: true,
    // O botão de limpar zera a escolha, e não só o texto de busca.
    resetModelValueOnClear: true,
  },
)
const emits = defineEmits<ComboboxRootEmits & {
  'update:inputValue': [value: string]
}>()

/*
 * `inputValue` e `filter` não descem para a lib: nenhuma das duas existe lá.
 * Prop que a raiz não declara vira atributo no elemento, e uma função escrita
 * como atributo sai serializada no HTML entregue.
 */
const delegatedProps = reactiveOmit(props, 'class', 'inputValue', 'filter')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

const filter = computed(() => props.filter)

/* Com predicado do consumidor, o filtro de dentro sai de cena por inteiro. */
const ignoreFilter = computed(() => props.ignoreFilter || props.filter !== undefined)

const inputId = useId(undefined, 'nds-combobox')
const listId = useId(undefined, 'nds-combobox-list')

const labels = ref(new Map<string, string>())
const announcement = ref('')

/*
 * O texto de busca continua com UM dono só, e agora esse dono atende dos dois
 * jeitos: sem `inputValue` o modelo é interno, com `inputValue` ele passa a ler
 * da prop e a devolver cada mudança pelo evento. Quem escreve nele é sempre o
 * mesmo grupo de peças — o campo, o botão de limpar, o Backspace e o Escape —,
 * então controlar o texto de fora não exigiu um segundo estado para sincronizar.
 */
const search = useVModel(props, 'inputValue', emits, {
  // O tipo de `passive` escolhe a sobrecarga, então ele precisa ser literal —
  // e quem sabe se a prop chegou é a execução. O casting fixa a sobrecarga; as
  // duas devolvem uma referência gravável, que é tudo o que esta camada usa.
  passive: (props.inputValue === undefined) as false,
  defaultValue: '',
}) as Ref<string>

function announce(message: string): void {
  announcement.value = message
}

provideComboboxContext({ inputId, listId, labels, search, announcement, announce, filter })
</script>

<template>
  <ComboboxRoot
    v-slot="slotProps"
    data-slot="combobox"
    v-bind="forwarded"
    :ignore-filter="ignoreFilter"
    :class="cn(props.class)"
  >
    <slot v-bind="slotProps" />
  </ComboboxRoot>
</template>
