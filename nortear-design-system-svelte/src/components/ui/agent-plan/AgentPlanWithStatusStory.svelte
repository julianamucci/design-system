<script lang="ts">
  /**
   * Andaime das duas composições: a linha de estado e o plano, empilhados.
   *
   * As duas peças são IRMÃS num invólucro, e não pai e filho: nenhuma é prop da
   * outra, e nenhum arquivo de uma sabe que a outra existe. Quem consome as
   * monta lado a lado, nesta ordem — a linha diz em que pé está a resposta, e o
   * plano detalha os passos dentro dela. Num `*.stories.ts` não há onde escrever
   * essa marcação, e todo export nomeado dali vira story: daí este invólucro.
   *
   * UM SÓ ANDAIME PARA AS DUAS COMPOSIÇÕES, e é o assunto delas: o plano
   * proposto antes de agir e a lista de tarefas mantida durante têm a MESMA
   * marcação, e o que muda é a lista que chega e o estado da linha acima. Dois
   * arquivos aqui afirmariam em código o contrário do que as stories provam — e
   * seriam duas cópias livres para divergir sem sinal nenhum.
   *
   * As props são as MESMAS das peças, e o estado da linha tem PADRÃO por isso: o
   * arquivo de stories é tipado pelo plano, e um invólucro que exigisse uma prop
   * que o plano não tem deixaria de caber ali. Os rótulos da LINHA não entram
   * por prop: são derivados do idioma, porque a barra de idioma do Storybook os
   * troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { AgentStatus } from '@/components/ui/agent-status';
  import {
    agentStatusLabelsFor,
    elapsedOf,
  } from '@/components/ui/agent-status/agent-status.fixtures';
  import type { PlanStep, RunStatus } from '@shared/primitives/chat-protocol';
  import { AgentPlan, type AgentPlanLabels } from './index';

  const {
    status = 'idle',
    steps,
    labels,
  }: {
    /** Em que pé está a execução desenhada acima do plano. */
    status?: RunStatus;
    /** Os passos, na ordem em que se pretende dá-los. */
    steps: PlanStep[];
    labels: AgentPlanLabels;
  } = $props();

  const statusLabels = $derived(agentStatusLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <AgentStatus {status} elapsed={elapsedOf(status)} labels={statusLabels} />
  <AgentPlan {steps} {labels} />
</div>
