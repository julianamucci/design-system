<script lang="ts">
  /**
   * Andaime do Playground do plano.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome da lista e
   * a palavra de cada estado são texto de interface. Sem o invólucro, o `render`
   * montaria os rótulos no idioma em que a story abriu e eles ficariam para trás
   * na troca.
   *
   * O invólucro também é onde o campo de texto vazio vira AUSÊNCIA de detalhe:
   * uma string vazia desenharia uma linha de baixo sem nada nela.
   */
  import { locale } from '@/lib/i18n';
  import type { PlanStepState } from '@shared/primitives/chat-protocol';
  import { AgentPlan } from './index';
  import { agentPlanLabelsFor } from './agent-plan.fixtures';

  const {
    state,
    label,
    detail,
  }: {
    /** Em que pé está o passo. Decide a palavra, o marcador e quem é o atual. */
    state: PlanStepState;
    /** O que se faz naquele passo, por extenso. */
    label: string;
    /** O motivo, o resultado ou a falha — o que couber ao estado. */
    detail: string;
  } = $props();

  const labels = $derived(agentPlanLabelsFor($locale));
  const steps = $derived([{ id: 's1', label, state, detail: detail || undefined }]);
</script>

<AgentPlan {steps} {labels} />
