<script lang="ts">
  /**
   * Andaime das stories de composição do ditado.
   *
   * O trilho é um ESPAÇO, e nesta stack esse espaço é um `{#snippet}` — que só
   * existe dentro de marcação. Num `*.stories.ts` não há onde declará-lo, e todo
   * export nomeado dali vira story: daí este invólucro. Mesma decisão do andaime
   * do trilho, ao lado.
   *
   * O ESTADO CHEGA POR STORE, e isso é divergência de forma em relação à
   * referência. Lá a story troca o controle por outro com `replaceWith` quando
   * precisa provar que o segundo pedido sai do MESMO botão; aqui os props
   * chegam uma vez, no `render`, e quem precisa mexer no estado no meio da
   * `play` mexe na store. O papel é o mesmo: quem consome é quem troca o
   * estado, e o componente nunca o troca sozinho.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome do
   * alternador é texto de interface.
   */
  import type { Readable } from 'svelte/store';
  import { locale } from '@/lib/i18n';
  import type { VoiceState } from '@shared/primitives/chat-protocol';
  import { Composer, ComposerVoice, type ComposerVoiceIntent } from './index';
  import { composerLabelsFor } from './composer.fixtures';
  import { SAMPLE_ELAPSED, SAMPLE_LEVEL, voiceLabelsFor } from './composer-voice.fixtures';

  const {
    voiceState,
    onToggle,
  }: {
    /** Em que ponto o ditado está. Quem troca é a story, no papel de quem consome. */
    voiceState: Readable<VoiceState>;
    onToggle?: (intent: ComposerVoiceIntent) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const voiceLabels = $derived(voiceLabelsFor($locale));
</script>

<!--
  O snippet vem ANTES de quem o usa: a marcação abaixo o passa como o trilho, e
  declará-lo depois deixaria a referência apontando para o nada.

  O nível e o tempo só acompanham a captura — fora dela seriam um medidor sem
  som e um relógio de nada.
-->
{#snippet railStart()}
  <ComposerVoice
    labels={voiceLabels}
    state={$voiceState}
    level={$voiceState === 'recording' ? SAMPLE_LEVEL : undefined}
    elapsed={$voiceState === 'recording' ? SAMPLE_ELAPSED : undefined}
    {onToggle}
  />
{/snippet}

<Composer {labels} {railStart} class="nds-max-w-lg" />
