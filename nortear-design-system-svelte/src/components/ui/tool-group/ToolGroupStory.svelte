<script lang="ts">
  /**
   * Andaime do Playground do grupo de ferramentas.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface. Sem o invólucro, o `render` montaria os
   * rótulos no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o control de detalhe vira outra LISTA. O detalhe
   * não é propriedade do grupo: é campo de cada chamada, e o que o control de
   * fato muda são as chamadas que entram.
   */
  import { locale } from '@/lib/i18n';
  import { TOOL_CALLS_WITH_FAILURE } from '@shared/primitives/tool-group-examples';
  import { ToolGroup } from './index';
  import { toolGroupLabelsFor } from './tool-group.fixtures';

  const {
    open = false,
    detail = true,
    onOpenChange,
  }: {
    /** A caixa começa aberta. O padrão é fechada. */
    open?: boolean;
    /** Cada chamada traz o detalhe do que couber ao estado dela. */
    detail?: boolean;
    /** Alguém abriu ou fechou a caixa, e o novo estado vem junto. */
    onOpenChange?: (open: boolean) => void;
  } = $props();

  const labels = $derived(toolGroupLabelsFor($locale));

  const calls = $derived(
    detail
      ? TOOL_CALLS_WITH_FAILURE
      : TOOL_CALLS_WITH_FAILURE.map((call) => ({
          id: call.id,
          name: call.name,
          state: call.state,
        })),
  );
</script>

<ToolGroup {calls} {labels} {open} {onOpenChange} />
