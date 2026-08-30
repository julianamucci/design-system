<script setup lang="ts">
/**
 * O controle do trilho que escreve por quem fala.
 *
 * Desenho em `nds/composer.css`, no bloco de ditado por voz, que também guarda
 * as quatro decisões de acessibilidade. O vocabulário — `VoiceState`,
 * `isVoiceBusy` — vem de `@shared/primitives/chat-protocol`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: o componente NÃO capta áudio. Permissão de
 * microfone, captura, transcrição e o destino do texto são de quem consome. Ele
 * desenha o estado que recebe e avisa que alguém pediu para começar ou parar —
 * a mesma divisão de `approval` no `chat-thread` e do pedido de remover um
 * anexo. Um ditado que pedisse permissão sozinho traria política de produto
 * junto, e política envelhece por produto, não por sistema.
 *
 * O MEDIDOR É DECORATIVO E O ESTADO É TEXTO. O nível é um número de 0 a 1 que
 * desenha e não se anuncia; o tempo decorrido é texto na tela e fica fora do
 * que é lido em voz. É a mesma decisão do contador de caracteres e do relógio
 * do reprodutor de mídia: número que muda a cada quadro, anunciado, torna a
 * tela impossível de ouvir. Quem ouve recebe a PALAVRA do estado.
 *
 * O COMPONENTE É AUTÔNOMO: o campo não sabe que ele existe. Quem consome o põe
 * no início do trilho, que é um ESPAÇO — o mesmo lugar onde caberia qualquer
 * outro controle do que se acrescenta à mensagem.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de que
 * alguém pediu para começar ou parar é um EVENTO (`@toggle`), e não um retorno
 * que se passa por prop. O conceito é o mesmo dos dois lados — quem capta é
 * quem começa de verdade; o que muda é por onde o pedido sai.
 */
import { computed, useId, type HTMLAttributes } from 'vue'
import { Mic } from 'lucide-vue-next'
import { isVoiceBusy, type VoiceState } from '@shared/primitives/chat-protocol'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComposerVoiceIntent, ComposerVoiceLabels } from './index'

/**
 * Quantas barras o medidor desenha.
 *
 * É DESENHO, e por isso constante e não prop: a folha declara `gap` entre as
 * barras, e o número delas é o que faz o conjunto ler como medidor em vez de
 * como um traço solto. Quem consome escolhe o nível, não a forma.
 */
const LEVEL_BAR_COUNT = 5

const props = withDefaults(
  defineProps<{
    labels: ComposerVoiceLabels
    /** Em que ponto o ditado está. Quem capta é quem sabe, e é quem passa. */
    state?: VoiceState
    /** O som que entra, de 0 a 1. É desenho, e não se anuncia. */
    level?: number
    /**
     * Há quanto tempo a captura corre, JÁ ESCRITO.
     *
     * String, e não segundos: formato de duração é decisão de idioma, e um
     * componente que o formatasse decidiria idioma em cinco lugares diferentes.
     */
    elapsed?: string
    /** Ditar não está disponível agora. Na transcrição já se desabilita sozinho. */
    disabled?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    state: 'idle',
    disabled: false,
  },
)

const emit = defineEmits<{
  /**
   * Alguém pediu para começar ou parar. Começar de verdade é de quem capta.
   *
   * O pedido é INTENÇÃO, e não o estado seguinte. Entre pedir para começar e
   * estar captando existe uma permissão que pode demorar ou ser negada, e um
   * componente que anunciasse `recording` estaria adivinhando o que ainda não
   * aconteceu.
   */
  toggle: [intent: ComposerVoiceIntent]
}>()

const id = useId()
const statusId = `${id}-status`

/**
 * A decisão sai do vocabulário compartilhado, e não de um `if` local: cinco
 * stacks escreveriam cinco versões da mesma regra, e uma delas discordaria.
 */
const busy = computed(() => isVoiceBusy(props.state))

/**
 * `transcribing` DESABILITA (decisão 2 da folha): já parou de captar, e apertar
 * ali não devolve o áudio. O motivo vai no texto de estado, nunca só no cinza
 * do botão.
 */
const isOff = computed(() => props.disabled || props.state === 'transcribing')

/** O nível, aparado na faixa que o desenho aceita. */
const clampedLevel = computed<number | undefined>(() => {
  const raw = props.level
  if (raw === undefined || Number.isNaN(raw)) return undefined
  return Math.min(1, Math.max(0, raw))
})

/**
 * O nível é valor de RUNTIME, e entra por custom property — nunca por um
 * `style` de desenho, que sairia do tema junto com a densidade e a escala
 * tipográfica. Mesma mecânica de `--nds-attachment-progress` na fila de anexos.
 * Ele é declarado UMA vez, no container, e as barras herdam.
 */
const levelStyle = computed(() =>
  clampedLevel.value === undefined
    ? undefined
    : { '--nds-voice-level': String(clampedLevel.value) },
)

function requestToggle(): void {
  emit('toggle', busy.value ? 'stop' : 'start')
}
</script>

<template>
  <div
    data-slot="composer-voice"
    :data-state="state"
    :class="cn('nds-composer-voice', props.class)"
  >
    <!-- UM botão que muda de estado, e não dois que se trocam (decisão 1 da
         folha): botão que some leva o foco junto, e quem estava nele é
         despejado no meio da tela. `aria-pressed` é o que carrega a diferença.

         O nome acompanha o estado: nome acessível é o NOME, e não o ícone
         (regra 7 da guideline 17). O ícone é o mesmo nos três estados, de
         propósito — estado nunca é só desenho.

         A descrição aponta o texto de estado, que é onde o motivo de o botão
         não responder está escrito. Sem isso, quem chega pelo teclado encontra
         um botão apagado e nenhuma explicação na tela. -->
    <Button
      data-slot="composer-voice-toggle"
      variant="ghost"
      size="icon-sm"
      :aria-pressed="busy ? 'true' : 'false'"
      :aria-label="busy ? labels.stop : labels.start"
      :aria-describedby="statusId"
      :disabled="isOff"
      @click="requestToggle"
    >
      <Mic aria-hidden="true" />
    </Button>

    <!-- O medidor só existe enquanto há som entrando: medidor parado ao lado de
         um ditado desligado é medidor mentindo. Ele é `aria-hidden` inteiro — o
         que muda a cada quadro, anunciado, cobre tudo o mais que houvesse para
         ouvir. -->
    <span
      v-if="state === 'recording'"
      class="nds-composer-voice-level"
      data-slot="composer-voice-level"
      aria-hidden="true"
      :style="levelStyle"
    >
      <span
        v-for="index in LEVEL_BAR_COUNT"
        :key="index"
        class="nds-composer-voice-bar"
      />
    </span>

    <!-- O estado, em palavra. Ele NÃO é região viva: o estado muda por ação de
         quem usa ou por decisão de quem consome, e o alternador — que tem o
         foco quando isso acontece — já anuncia a troca por `aria-pressed` e
         pelo nome. Uma região viva aqui reanunciaria o texto inteiro a cada
         mudança de nível. -->
    <span
      :id="statusId"
      class="nds-composer-voice-status"
      data-slot="composer-voice-status"
    >{{ labels.status[state] }}<!--
      O TEMPO DECORRIDO É O ÚNICO PEDAÇO ESCONDIDO DA VOZ.

      Ele fica dentro do texto de estado para ser lido junto na tela, e sai do
      que é anunciado por `aria-hidden`: cronômetro ao vivo não se anuncia
      (regra 9 da guideline 17), e é o defeito que o reprodutor de mídia já
      pagou nesta base. Como a descrição do alternador aponta para este mesmo
      elemento, o relógio ficaria colado no nome do botão a cada foco se não
      estivesse fora.

      O `<span>` sem classe é ESTRUTURA, e não desenho: ele herda tudo do pai e
      não pede nada da folha.
    --><span
      v-if="elapsed"
      data-slot="composer-voice-elapsed"
      aria-hidden="true"
    > · {{ elapsed }}</span></span>
  </div>
</template>
