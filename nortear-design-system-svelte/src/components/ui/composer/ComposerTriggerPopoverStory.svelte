<script lang="ts">
  /**
   * Andaime do Playground do seletor.
   *
   * Os dois controles da story — qual gatilho existe — NÃO são props do campo:
   * são a pergunta que o Playground faz. Nesta stack os args da story precisam
   * servir ao componente que o `render` devolve, e o campo não tem prop chamada
   * "menção"; sem o invólucro, o andaime da story vazaria para a API do
   * componente só para o tipo fechar.
   *
   * Os gatilhos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a informação de
   * apoio de cada pessoa é texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import { Composer } from './index';
  import { composerLabelsFor } from './composer.fixtures';
  import {
    commandSource,
    mentionSourceFor,
    triggerLabelsFor,
  } from './composer-trigger-popover.fixtures';

  const {
    mention,
    command,
    onSubmit,
  }: {
    /** O gatilho de menção, que vale em começo de qualquer palavra. */
    mention: boolean;
    /** O gatilho de comando, que vale só na primeira posição do campo. */
    command: boolean;
    onSubmit?: (value: string) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const triggerLabels = $derived(triggerLabelsFor($locale));
  const triggers = $derived([
    ...(mention ? [mentionSourceFor($locale)] : []),
    ...(command ? [commandSource()] : []),
  ]);
</script>

<Composer {labels} {triggerLabels} {triggers} {onSubmit} class="nds-max-w-lg" />
