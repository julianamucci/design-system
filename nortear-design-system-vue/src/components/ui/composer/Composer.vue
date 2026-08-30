<script setup lang="ts">
/**
 * A superfície de entrada da conversa. Estrutura e cores em `nds/composer.css`,
 * que também guarda as decisões de acessibilidade que valem mais que o desenho.
 *
 * O QUE O COMPONENTE FAZ: recebe o que foi escrito, diz quando alguém pediu
 * para enviar, e troca o botão de enviar por um de interromper enquanto a
 * resposta é gerada.
 *
 * O QUE ELE NÃO FAZ: decidir o que enviar significa. Ele não limpa o campo
 * sozinho, não sabe se a mensagem chegou e não guarda rascunho. Emite o texto e
 * devolve o controle — a mesma divisão de `approval` no `chat-thread`, e pelo
 * mesmo motivo: o que acontece depois do envio é produto, e produto envelhece
 * por outro relógio que o sistema de design.
 *
 * O QUE MUDOU DE INSTRUMENTO NESTA STACK
 *
 * O texto vive num `defineModel`, que é o jeito idiomático daqui: sem ninguém
 * do lado de fora ele é estado local — o componente monta e funciona sozinho —,
 * e com `v-model:value` ele passa a ser de quem consome, que é como um rascunho
 * volta. Não há `getValue()` nem `setValue()` porque não há por que haver: a
 * mesma promessa já cabe no vínculo.
 *
 * O estado de geração é a PROP `running`, e não um método. Quem sabe se a
 * resposta está vindo é quem consome, e numa stack de render o caminho por onde
 * isso entra é a prop que o desenho lê.
 *
 * POR QUE `Enter` ENVIA, e por que isso é uma prop
 *
 * A convenção de conversa em teclado físico é Enter enviar e Shift+Enter
 * quebrar linha, e é o padrão daqui. Mas ela é ERRADA no toque: no teclado
 * virtual o Enter é a tecla de quebrar linha, e um composer que envia ali manda
 * mensagem pela metade a cada tentativa de fazer parágrafo. Por isso `submitOn`
 * existe.
 *
 * A dica embaixo NÃO é decoração: `Enter envia` é comportamento, e quem não vê
 * a tela precisa saber disso ANTES de apertar a tecla. Ela entra em
 * `aria-describedby` do campo, junto com o limite de caracteres.
 */
import { computed, useId, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComposerLabels, ComposerSubmitOn } from './index'

const props = withDefaults(
  defineProps<{
    /** O texto da interface. Sem padrão em inglês escondido. */
    labels: ComposerLabels
    /** Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte. */
    rows?: number
    /** Limite de caracteres. Sem ele não há contador: contar sem teto não informa nada. */
    maxLength?: number
    /** Indisponibiliza o conjunto inteiro — campo, trilho e envio. */
    disabled?: boolean
    submitOn?: ComposerSubmitOn
    /**
     * A resposta está sendo gerada?
     *
     * É o que troca o botão de enviar pelo de interromper, e o que impede um
     * segundo envio enquanto o primeiro não terminou. Quem sabe é quem consome:
     * o componente não acompanha a rede.
     */
    running?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    rows: 2,
    disabled: false,
    submitOn: 'enter',
    running: false,
  },
)

const emit = defineEmits<{
  /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem recebe. */
  submit: [value: string]
  /** Alguém pediu para interromper o que está sendo gerado. */
  stop: []
}>()

defineSlots<{
  /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
  railStart?: () => unknown
}>()

/**
 * O texto. Sem vínculo de fora ele é local, e o componente funciona sozinho;
 * com `v-model:value` ele passa a ser de quem consome.
 */
const text = defineModel<string>('value', { default: '' })

const fieldId = useId()
const hintId = `${fieldId}-hint`

/** A combinação que envia, para a dica dizer a verdade em cada modo. */
const submitKey = computed(() => (props.submitOn === 'enter' ? 'Enter' : 'Ctrl+Enter'))

const hintText = computed(() => {
  const base = props.labels.hint.replace('{key}', submitKey.value)
  if (props.maxLength === undefined) return base
  return `${base} · ${props.labels.limit.replace('{max}', String(props.maxLength))}`
})

/** Perto do limite muda cor E peso — cor sozinha não descreve estado. */
const nearLimit = computed(
  () => props.maxLength !== undefined && text.value.length >= props.maxLength * 0.9,
)

// Vazio não envia. Enquanto gera, o botão continua vivo — é ele que interrompe.
const submitDisabled = computed(
  () => props.disabled || (!props.running && text.value.trim() === ''),
)

function requestSubmit(): void {
  // Só o texto sem espaços nas pontas sai, e campo com só espaços é vazio.
  const trimmed = text.value.trim()
  if (!trimmed || props.running || props.disabled) return
  emit('submit', trimmed)
}

/**
 * O botão do trilho é sempre `type="button"` nesta stack — o primitivo de
 * botão do design system fixa o tipo, para nenhum controle dentro de um
 * formulário enviá-lo por acidente. O envio sai daqui, e o `@submit` da raiz
 * continua barrando a navegação que um formulário faria sozinho.
 */
function onButtonClick(): void {
  if (props.running) emit('stop')
  else requestSubmit()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return
  // Composição de IME (acento morto, teclado de idioma com candidatos) usa
  // Enter para CONFIRMAR o caractere. Enviar aqui interromperia quem está
  // escrevendo em japonês no meio de uma palavra — e o campo é multilíngue.
  if (event.isComposing) return
  const asked =
    props.submitOn === 'modifier' ? event.ctrlKey || event.metaKey : !event.shiftKey
  if (!asked) return
  // Sem o `preventDefault` a quebra de linha entra junto com o envio, e o campo
  // fica com um enter sobrando depois de limpo.
  event.preventDefault()
  requestSubmit()
}
</script>

<template>
  <form
    data-slot="composer"
    :class="cn('nds-composer', props.class)"
    :data-state="running ? 'running' : 'idle'"
    :data-disabled="disabled ? 'true' : undefined"
    @submit.prevent="requestSubmit"
  >
    <!-- A MOLDURA É DO CONJUNTO: o campo perde borda, fundo e anel, e quem os
         desenha é `.nds-composer-field`. O anel acende no `:focus-within` dela,
         porque o trilho está dentro do mesmo formulário e um anel só em volta
         do texto o deixaria de fora do que está em foco. -->
    <div class="nds-composer-field">
      <textarea
        :id="fieldId"
        v-model="text"
        data-slot="composer-input"
        class="nds-composer-input"
        :rows="rows"
        :placeholder="labels.placeholder"
        :aria-label="labels.input"
        :aria-describedby="hintId"
        :maxlength="maxLength"
        :disabled="disabled"
        @keydown="onKeydown"
      />
    </div>

    <div class="nds-composer-rail">
      <!-- O início é o que se acrescenta à mensagem; o fim é o que se faz com
           ela. O trilho é um ESPAÇO: o composer reserva o lugar e não sabe o
           que se põe nele. -->
      <div class="nds-composer-rail-start">
        <slot name="railStart" />
      </div>

      <div class="nds-composer-rail-end">
        <!-- O contador é `aria-hidden`, e isso é decisão, não esquecimento: ele
             muda a cada tecla, e um número reanunciado a cada letra torna o
             campo impossível de usar por audição. O limite chega UMA vez, pela
             descrição do campo, que é texto estático. -->
        <span
          v-if="maxLength !== undefined"
          class="nds-composer-counter"
          aria-hidden="true"
          :data-near-limit="String(nearLimit)"
        >{{ text.length }}/{{ maxLength }}</span>

        <!-- O botão troca de NOME, e não só de forma: é o mesmo controle
             fazendo outra coisa, e o nome acessível tem de dizer qual. -->
        <Button
          data-slot="composer-submit"
          size="sm"
          :disabled="submitDisabled"
          @click="onButtonClick"
        >
          {{ running ? labels.stop : labels.submit }}
        </Button>
      </div>
    </div>

    <!-- A dica DESCREVE o campo: saber que uma tecla envia depois de tê-la
         apertado não serve para nada. -->
    <p
      :id="hintId"
      class="nds-composer-hint"
    >
      {{ hintText }}
    </p>
  </form>
</template>
