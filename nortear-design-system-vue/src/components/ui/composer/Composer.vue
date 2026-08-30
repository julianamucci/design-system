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
import { computed, nextTick, ref, useId, type HTMLAttributes } from 'vue'
import {
  applyTrigger,
  findTrigger,
  rankByTerm,
  type TriggerMatch,
} from '@shared/primitives/composer-trigger'
import type { Attachment } from '@shared/primitives/chat-protocol'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ComposerTriggerPopover from './ComposerTriggerPopover.vue'
import ComposerAttachments from './ComposerAttachments.vue'
import type {
  ComposerAttachmentLabels,
  ComposerLabels,
  ComposerSubmitOn,
  TriggerOption,
  TriggerPopoverLabels,
  TriggerSource,
} from './index'

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
    /**
     * Gatilhos do seletor — menções, comandos, e qualquer outro caractere.
     *
     * Sem eles o campo é só um campo. Com eles, digitar o caractere abre o
     * seletor, e a tecla de envio passa a ESCOLHER enquanto ele estiver aberto.
     */
    triggers?: TriggerSource[]
    /**
     * O texto do seletor.
     *
     * Obrigatório quando há gatilho, porque é texto de tela: sem ele o painel
     * abriria com a frase de nenhum resultado em branco, que é pior que não
     * abrir.
     */
    triggerLabels?: TriggerPopoverLabels
    /**
     * Os arquivos que vão junto com a mensagem.
     *
     * O composer os DESENHA e avisa quando alguém pede para remover; subir,
     * validar e remover de verdade é de quem consome.
     */
    attachments?: Attachment[]
    /** Textos da fila de anexos. Obrigatórios quando há anexo. */
    attachmentLabels?: ComposerAttachmentLabels
    class?: HTMLAttributes['class']
  }>(),
  {
    rows: 2,
    disabled: false,
    submitOn: 'enter',
    running: false,
    triggers: () => [],
    attachments: () => [],
  },
)

const emit = defineEmits<{
  /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem recebe. */
  submit: [value: string]
  /** Alguém pediu para interromper o que está sendo gerado. */
  stop: []
  /** Alguém pediu para remover um anexo. O componente não remove nada. */
  removeAttachment: [attachment: Attachment]
}>()

/**
 * A fila só existe quando há anexo E texto para ela.
 *
 * Sem anexo ela não fica escondida: ela não existe no documento. Uma lista
 * vazia seria anunciada como "lista com zero itens", que promete algo que não
 * há.
 */
const hasAttachments = computed(
  () => props.attachments.length > 0 && props.attachmentLabels !== undefined,
)

function forwardRemoveAttachment(attachment: Attachment): void {
  emit('removeAttachment', attachment)
}

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
const popoverId = `${fieldId}-trigger`

/**
 * O campo, para o seletor poder ler onde o cursor está.
 *
 * O gatilho depende de ONDE o cursor está, e não do que o texto contém: o
 * `v-model` não carrega essa informação, e é por isso que o elemento importa
 * aqui.
 */
const inputRef = ref<HTMLTextAreaElement | null>(null)

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

// ─── O seletor do caractere gatilho ──────────────────────────────────────────
//
// Só existe quando há gatilho declarado E texto para o painel dizer. O ESTADO
// mora aqui, e não no painel: quem lê o campo, filtra e resolve a disputa pela
// tecla de envio é quem tem o campo. O painel recebe o que mostrar e devolve o
// que alguém apontou.

const hasTriggerPopover = computed(
  () => props.triggers.length > 0 && props.triggerLabels !== undefined,
)

const triggerMatch = ref<TriggerMatch | null>(null)
const triggerOptions = ref<TriggerOption[]>([])
const triggerActiveIndex = ref(0)

const triggerOpen = computed(() => triggerMatch.value !== null)

/**
 * O campo aponta a opção ativa só enquanto ela existe para ele.
 *
 * Um `aria-activedescendant` órfão aponta um elemento que já saiu do documento,
 * e um `aria-controls` para um painel escondido promete uma lista que não há.
 */
const triggerActiveId = computed(() => {
  const option = triggerOptions.value[triggerActiveIndex.value]
  return option ? `${popoverId}-${option.id}` : undefined
})

function closeTriggerPopover(): void {
  triggerMatch.value = null
  triggerOptions.value = []
  triggerActiveIndex.value = 0
}

/** Relê o campo e decide se o seletor abre, filtra ou fecha. */
function syncTriggerPopover(el: HTMLTextAreaElement): void {
  if (!hasTriggerPopover.value) return
  const found = findTrigger(
    el.value,
    el.selectionStart ?? 0,
    props.triggers.map((source) => source.spec),
  )
  const source = found
    ? props.triggers.find((candidate) => candidate.spec.char === found.spec.char)
    : undefined
  if (!found || !source) {
    closeTriggerPopover()
    return
  }

  // O termo mudou: a opção ativa volta ao topo. Manter o índice faria a escolha
  // pular para outra pessoa a cada letra digitada.
  const previousTerm = triggerMatch.value?.term
  triggerMatch.value = found
  triggerOptions.value = rankByTerm(source.options, found.term, (option) => option.label)
  if (previousTerm !== found.term) triggerActiveIndex.value = 0
  if (triggerActiveIndex.value >= triggerOptions.value.length) triggerActiveIndex.value = 0
}

/**
 * A rolagem, o clique e a seta movem o cursor sem que o texto mude.
 *
 * O evento traz o elemento, e ler dele — em vez do vínculo — é o que torna esta
 * releitura independente da ordem em que os dois ouvintes do campo rodam.
 */
function syncFromEvent(event: Event): void {
  syncTriggerPopover(event.target as HTMLTextAreaElement)
}

function onTriggerKeyup(event: KeyboardEvent): void {
  if (!event.key.startsWith('Arrow') && event.key !== 'Home' && event.key !== 'End') return
  syncFromEvent(event)
}

/** Anda pela lista. O foco não se move; o que muda é a opção apontada. */
function moveTriggerActive(delta: number): void {
  const total = triggerOptions.value.length
  if (!triggerOpen.value || !total) return
  // Circular: quem está no fim e desce volta ao começo. Uma lista que para na
  // última obriga a subir de volta contando.
  triggerActiveIndex.value = (triggerActiveIndex.value + delta + total) % total
}

/** Escreve a opção ativa no campo. Devolve `false` se não havia o que aplicar. */
function applyTriggerActive(): boolean {
  const el = inputRef.value
  const current = triggerMatch.value
  const option = triggerOptions.value[triggerActiveIndex.value]
  if (!el || !current || !option) return false

  const replacement = option.value ?? `${current.spec.char}${option.label}`
  const applied = applyTrigger(
    el.value,
    current,
    el.selectionStart ?? el.value.length,
    replacement,
  )

  text.value = applied.text
  closeTriggerPopover()
  // O texto chega ao campo na próxima passada do render; a posição do cursor
  // só existe depois disso.
  void nextTick(() => el.setSelectionRange(applied.caret, applied.caret))
  return true
}

function onTriggerChoose(index: number): void {
  triggerActiveIndex.value = index
  applyTriggerActive()
}

function onKeydown(event: KeyboardEvent): void {
  // COM O SELETOR ABERTO, AS TECLAS SÃO DELE.
  //
  // É a decisão que atravessa o componente inteiro: envio e escolha disputam a
  // mesma tecla, e enviar no meio de uma menção é o defeito que quem escreve
  // encontra na primeira vez que usa. As setas e o Escape também param aqui —
  // sem isso a seta moveria o cursor no texto enquanto a lista parece andar.
  if (triggerOpen.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveTriggerActive(1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveTriggerActive(-1)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      closeTriggerPopover()
      return
    }
    // Enter e Tab escolhem. O Tab entra porque quem escreve espera que ele
    // complete, e sem isso ele tiraria o foco do campo com a lista aberta.
    if ((event.key === 'Enter' && !event.isComposing) || event.key === 'Tab') {
      if (applyTriggerActive()) {
        event.preventDefault()
        return
      }
    }
  }

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
      <!-- A fila vive DENTRO da moldura e ANTES do campo: os anexos fazem
           parte do que está sendo escrito, e uma fila fora da moldura
           pareceria uma lista de outra coisa. -->
      <ComposerAttachments
        v-if="hasAttachments && attachmentLabels"
        :attachments="attachments"
        :labels="attachmentLabels"
        @remove="forwardRemoveAttachment"
      />

      <textarea
        :id="fieldId"
        ref="inputRef"
        v-model="text"
        data-slot="composer-input"
        class="nds-composer-input"
        :rows="rows"
        :placeholder="labels.placeholder"
        :aria-label="labels.input"
        :aria-describedby="hintId"
        :aria-controls="triggerOpen ? popoverId : undefined"
        :aria-activedescendant="triggerOpen ? triggerActiveId : undefined"
        :maxlength="maxLength"
        :disabled="disabled"
        @keydown="onKeydown"
        @input="syncFromEvent"
        @click="syncFromEvent"
        @keyup="onTriggerKeyup"
        @blur="closeTriggerPopover"
      />

      <!-- O painel é ancorado no CAMPO, e abre para cima: o composer mora no pé
           da conversa, e abrir para baixo é abrir para fora da janela. -->
      <ComposerTriggerPopover
        v-if="hasTriggerPopover && triggerLabels"
        :id="popoverId"
        :open="triggerOpen"
        :options="triggerOptions"
        :active-index="triggerActiveIndex"
        :labels="triggerLabels"
        @choose="onTriggerChoose"
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
