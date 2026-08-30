<script setup lang="ts">
/**
 * O painel que abre quando alguém digita um caractere gatilho no composer.
 *
 * Desenho em `nds/composer.css`, no bloco do seletor do gatilho. A MÁQUINA —
 * onde o gatilho vale, o que ele recorta, como o filtro ordena e o que fica
 * escrito depois da escolha — vive em `@shared/primitives/composer-trigger` e é
 * compartilhada. Este componente é o DESENHO em volta dela, e nada mais: ele
 * não lê o campo, não filtra e não decide de quem é a tecla de envio. Quem faz
 * isso é o composer, que é quem tem o campo.
 *
 * O FOCO NUNCA CHEGA AQUI. Quem escreve continua escrevendo enquanto escolhe;
 * mover o foco para a lista faria a próxima letra não chegar ao texto. O campo
 * aponta a opção ativa por `aria-activedescendant`, e a lista nunca é focada —
 * por isso não há `tabindex` em lugar nenhum deste arquivo.
 *
 * E O CAMPO NÃO VIRA `combobox`, ainda que o padrão tenha esse nome. A primeira
 * versão punha `role="combobox"` no campo, que é o que a literatura descreve, e
 * o axe reprovou por `aria-allowed-role`: a especificação de ARIA em HTML não
 * admite esse papel numa caixa de texto de várias linhas. O que fica é o que
 * ela ADMITE e resolve o problema — `aria-controls` liga o campo à lista e
 * `aria-activedescendant` aponta a opção sem mover o foco.
 */
import type { TriggerOption, TriggerPopoverLabels } from './index'

defineProps<{
  /** O endereço do painel. É o que o campo aponta por `aria-controls`. */
  id: string
  /**
   * O painel continua no documento quando fechado, escondido.
   *
   * Tirá-lo da árvore custaria a referência que o campo mantém e não pouparia
   * nada: fechado ele não tem filho nenhum.
   */
  open: boolean
  /** O que a lista oferece AGORA, já filtrado e ordenado por quem consome. */
  options: TriggerOption[]
  /** Qual opção está apontada. Apontada, e não focada. */
  activeIndex: number
  labels: TriggerPopoverLabels
}>()

const emit = defineEmits<{
  /** Alguém escolheu pelo ponteiro. O índice vai junto. */
  choose: [index: number]
}>()

/**
 * A escolha acontece ao APERTAR o botão, e não ao soltar.
 *
 * Soltar tira o foco do campo antes de o evento chegar, e a escolha aconteceria
 * com o cursor já perdido. O `preventDefault` é o que impede o navegador de
 * mover o foco para cá.
 */
function onPick(event: MouseEvent, index: number): void {
  event.preventDefault()
  emit('choose', index)
}
</script>

<template>
  <div
    :id="id"
    data-slot="composer-trigger-popover"
    class="nds-composer-trigger-popover"
    :hidden="!open"
    :role="open && options.length ? 'listbox' : undefined"
    :aria-label="open && options.length ? labels.list : undefined"
  >
    <template v-if="open">
      <!--
        SEM OPÇÕES, O PAINEL NÃO É UMA LISTA.

        Uma lista de opções vazia reprova em `aria-required-children`, e com
        razão: ela promete filhos que não existem, e o leitor de tela anuncia
        "lista com zero itens" em vez da frase que explica o que houve. Sem o
        papel, o que resta é o texto — que é justamente o que se quer ler.
      -->
      <p
        v-if="!options.length"
        class="nds-composer-trigger-empty"
      >
        {{ labels.empty }}
      </p>

      <div
        v-for="(option, index) in options"
        :id="`${id}-${option.id}`"
        :key="option.id"
        class="nds-composer-trigger-option"
        role="option"
        :aria-selected="index === activeIndex"
        @mousedown="onPick($event, index)"
      >
        <!-- `aria-selected` e a cor de fundo saem juntos: um é o que o leitor
             de tela anuncia, o outro é o que os olhos veem. Só um deixa metade
             das pessoas sem saber onde está. -->
        <span class="nds-composer-trigger-option-label">{{ option.label }}</span>
        <span
          v-if="option.hint"
          class="nds-composer-trigger-option-hint"
        >{{ option.hint }}</span>
      </div>
    </template>
  </div>
</template>
