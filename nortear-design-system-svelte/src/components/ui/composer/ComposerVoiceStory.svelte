<script lang="ts">
  /**
   * Andaime do Playground do ditado.
   *
   * Os quatro controles da story são props do componente, mas os RÓTULOS não
   * são: eles vêm da tradução, e nesta stack os args de uma story precisam
   * cobrir todos os props obrigatórios do componente que o `render` devolve.
   * Sem o invólucro, `labels` teria de virar arg — e um objeto de rótulos no
   * painel de controles é andaime exposto como se fosse API.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome do
   * alternador é texto de interface. Mesma decisão do andaime do contexto, ao
   * lado.
   */
  import { locale } from '@/lib/i18n';
  import type { VoiceState } from '@shared/primitives/chat-protocol';
  import { ComposerVoice, type ComposerVoiceIntent } from './index';
  import { voiceLabelsFor } from './composer-voice.fixtures';

  const {
    state,
    level,
    elapsed,
    disabled,
    onToggle,
  }: {
    /** Em que ponto o ditado está. */
    state: VoiceState;
    /** O som que entra, de 0 a 1. */
    level: number;
    /** O tempo decorrido, já escrito. Vazio quando não há o que mostrar. */
    elapsed: string;
    /** Ditar não está disponível agora. */
    disabled: boolean;
    onToggle?: (intent: ComposerVoiceIntent) => void;
  } = $props();

  const labels = $derived(voiceLabelsFor($locale));
</script>

<!--
  Campo de texto vazio é ausência de tempo, e não um tempo em branco: uma string
  vazia desenharia o separador sem número depois dele.
-->
<ComposerVoice
  {labels}
  {state}
  {level}
  elapsed={elapsed || undefined}
  {disabled}
  {onToggle}
/>
