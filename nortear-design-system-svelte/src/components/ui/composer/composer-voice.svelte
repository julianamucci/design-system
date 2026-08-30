<script lang="ts" module>
  // ─── ComposerVoice ─────────────────────────────────────────────────────────
  //
  // O controle do trilho que escreve por quem fala.
  //
  // Desenho em `nds/composer.css`, no bloco de ditado por voz, que também
  // guarda as decisões de acessibilidade. O vocabulário — `VoiceState`,
  // `isVoiceBusy` — vem de `@shared/primitives/chat-protocol`.
  //
  // A DECISÃO QUE GOVERNA A PEÇA: o componente NÃO capta áudio. Permissão de
  // microfone, captura, transcrição e o destino do texto são de quem consome.
  // Ele desenha o estado que recebe e avisa que alguém pediu para começar ou
  // parar — a mesma divisão de `approval` no `chat-thread` e de `onRemove` nos
  // anexos. Um ditado que pedisse permissão sozinho traria política de produto
  // junto, e política envelhece por produto, não por sistema.
  //
  // O MEDIDOR É DECORATIVO E O ESTADO É TEXTO. O nível é um número de 0 a 1 que
  // desenha e não se anuncia; o tempo decorrido é texto na tela e fica fora do
  // que é lido em voz. É a mesma decisão do contador de caracteres e do relógio
  // do reprodutor de mídia: número que muda a cada quadro, anunciado, torna a
  // tela impossível de ouvir. Quem ouve recebe a PALAVRA do estado.
  //
  // A PULSAÇÃO respeita quem pediu menos movimento, e isso mora na FOLHA — a
  // regra `prefers-reduced-motion` já zera a animação. Repetir a checagem aqui
  // criaria uma segunda verdade sobre a mesma preferência.
  //
  // DIVERGÊNCIA DE API, em relação à referência (vanilla): lá a peça é uma
  // fábrica que devolve um elemento, e o retorno chega por `onToggle` no objeto
  // de opções. Aqui ela é um componente, o retorno é um prop de callback, e o
  // `class` entra pela mesma porta que nas demais peças da moldura. Markup,
  // classes `.nds-*`, `data-slot`, ARIA e comportamento são os mesmos.
  import type { VoiceState } from '@shared/primitives/chat-protocol';

  /**
   * O pedido que sai do alternador.
   *
   * É INTENÇÃO, e não o estado seguinte. Entre pedir para começar e estar
   * captando existe uma permissão que pode demorar ou ser negada, e um
   * componente que anunciasse `recording` estaria adivinhando o que ainda não
   * aconteceu.
   */
  export type ComposerVoiceIntent = 'start' | 'stop';

  /**
   * O vocabulário do controle.
   *
   * Tudo aqui é TEXTO de interface, e por isso tem três idiomas: o nome do
   * alternador em cada situação e a palavra de cada estado.
   */
  export interface ComposerVoiceLabels {
    /** Nome do alternador em repouso — o que a pessoa vai fazer ao acioná-lo. */
    start: string;
    /** Nome do MESMO botão enquanto o ditado ocupa. Troca de nome, não só de desenho. */
    stop: string;
    /**
     * A palavra de cada estado. É ela que chega a quem não vê o medidor, e é
     * nela que vai o motivo de o alternador não responder na transcrição.
     */
    status: Record<VoiceState, string>;
  }

  /**
   * Quantas barras o medidor desenha.
   *
   * É DESENHO, e por isso constante e não prop: a folha declara `gap` entre as
   * barras, e o número delas é o que faz o conjunto ler como medidor em vez de
   * como um traço solto. Quem consome escolhe o nível, não a forma.
   */
  const LEVEL_BAR_COUNT = 5;

  /** As barras, já numeradas — a marcação precisa de algo sobre o que iterar. */
  const LEVEL_BARS = Array.from({ length: LEVEL_BAR_COUNT }, (_unused, index) => index);
</script>

<script lang="ts">
  import Mic from '@lucide/svelte/icons/mic';
  import { isVoiceBusy } from '@shared/primitives/chat-protocol';
  import { Button } from '@/components/ui/button';
  import { cn } from '@/lib/utils.js';

  const {
    labels,
    state = 'idle',
    level,
    elapsed,
    disabled = false,
    onToggle,
    class: className,
  }: {
    labels: ComposerVoiceLabels;
    /** Em que ponto o ditado está. Quem capta é quem sabe, e é quem passa. */
    state?: VoiceState;
    /** O som que entra, de 0 a 1. É desenho, e não se anuncia. */
    level?: number;
    /**
     * Há quanto tempo a captura corre, JÁ ESCRITO.
     *
     * String, e não segundos: formato de duração é decisão de idioma, e um
     * componente que o formatasse decidiria idioma em cinco lugares diferentes.
     */
    elapsed?: string;
    /** Ditar não está disponível agora. Na transcrição já se desabilita sozinho. */
    disabled?: boolean;
    /** Alguém pediu para começar ou parar. Começar de verdade é de quem capta. */
    onToggle?: (intent: ComposerVoiceIntent) => void;
    class?: string;
  } = $props();

  // `$props.id()` só é aceito como inicializador de declaração no topo.
  const uid = $props.id();
  const statusId = `${uid}-status`;

  /**
   * Ocupado é decisão do vocabulário COMPARTILHADO, e não de um `if` local.
   *
   * É a mesma máquina nas cinco stacks; cinco condições escritas à mão são
   * cinco chances de uma delas discordar das outras sem ninguém reparar.
   */
  const busy = $derived(isVoiceBusy(state));

  /** O nível, aparado na faixa que o desenho aceita. */
  const clampedLevel = $derived(
    level === undefined || Number.isNaN(level) ? undefined : Math.min(1, Math.max(0, level)),
  );

  /**
   * O nível é valor de RUNTIME, e entra por custom property — nunca por um
   * `style` de desenho, que sairia do tema junto com a densidade e a escala
   * tipográfica. Mesma mecânica de `--nds-attachment-progress` na fila de
   * anexos. Ele é declarado UMA vez, no container, e as barras herdam.
   *
   * Sem nível não há declaração nenhuma: a folha já traz o próprio padrão em
   * `var(--nds-voice-level, 1)`, e uma declaração vazia o atropelaria.
   */
  const levelStyle = $derived(
    clampedLevel === undefined ? undefined : `--nds-voice-level: ${clampedLevel}`,
  );
</script>

<div
  class={cn('nds-composer-voice', className)}
  data-slot="composer-voice"
  data-state={state}
>
  <!--
    O ALTERNADOR: UM botão que muda de estado, e não dois que se trocam. Botão
    que some leva o foco junto, e quem estava nele é despejado no meio da tela.
    `aria-pressed` é o que carrega a diferença.

    O nome acompanha o estado: nome acessível é o NOME, e não o ícone (regra 7
    da guideline 17). O ícone é o mesmo nos três estados, de propósito — estado
    nunca é só desenho.

    `transcribing` DESABILITA: já parou de captar, e apertar ali não devolve o
    áudio. O motivo vai no texto de estado, nunca só no cinza do botão — e a
    descrição aponta para lá, senão quem chega pelo teclado encontra um botão
    apagado e nenhuma explicação na tela.
  -->
  <Button
    data-slot="composer-voice-toggle"
    variant="ghost"
    size="icon-sm"
    aria-pressed={busy ? 'true' : 'false'}
    aria-label={busy ? labels.stop : labels.start}
    aria-describedby={statusId}
    disabled={disabled || state === 'transcribing'}
    onclick={() => onToggle?.(busy ? 'stop' : 'start')}
  >
    <Mic aria-hidden="true" />
  </Button>

  <!--
    O MEDIDOR só existe enquanto há som entrando: medidor parado ao lado de um
    ditado desligado é medidor mentindo. Ele é `aria-hidden` inteiro — o que
    muda a cada quadro, anunciado, cobre tudo o mais que houvesse para ouvir.
  -->
  {#if state === 'recording'}
    <span
      class="nds-composer-voice-level"
      data-slot="composer-voice-level"
      aria-hidden="true"
      style={levelStyle}
    >
      {#each LEVEL_BARS as bar (bar)}
        <span class="nds-composer-voice-bar"></span>
      {/each}
    </span>
  {/if}

  <!--
    O ESTADO, EM PALAVRA. Ele NÃO é região viva: o estado muda por ação de quem
    usa ou por decisão de quem consome, e o alternador — que tem o foco quando
    isso acontece — já anuncia a troca por `aria-pressed` e pelo nome. Uma
    região viva aqui reanunciaria o texto inteiro a cada mudança de nível.

    O TEMPO DECORRIDO É O ÚNICO PEDAÇO ESCONDIDO DA VOZ. Ele fica dentro do
    texto de estado para ser lido junto na tela, e sai do que é anunciado por
    `aria-hidden`: cronômetro ao vivo não se anuncia (regra 9 da guideline 17),
    e é o defeito que o reprodutor de mídia já pagou nesta base. Como a
    descrição do alternador aponta para este mesmo elemento, o relógio ficaria
    colado no nome do botão a cada foco se não estivesse fora.

    O `<span>` sem classe é ESTRUTURA, e não desenho: ele herda tudo do pai e
    não pede nada da folha.
  -->
  <span
    class="nds-composer-voice-status"
    data-slot="composer-voice-status"
    id={statusId}
  >{labels.status[state]}{#if elapsed}<span
      data-slot="composer-voice-elapsed"
      aria-hidden="true"
    > · {elapsed}</span>{/if}</span>
</div>
