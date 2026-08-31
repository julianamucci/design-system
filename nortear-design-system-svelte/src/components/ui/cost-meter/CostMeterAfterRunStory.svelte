<script lang="ts">
  /**
   * Andaime da composição com a linha de estado da execução.
   *
   * A linha de estado diz que terminou; o custo diz quanto isso saiu. As duas
   * são IRMÃS num invólucro, e não pai e filha — a peça se encaixa sem virar
   * propriedade de quem a hospeda, que é o teste de §4.2 da guideline 17. Num
   * `*.stories.ts` não há onde escrever essa marcação, e todo export nomeado
   * dali vira story: daí este invólucro.
   *
   * Os rótulos da EXECUÇÃO não entram por prop: são derivados do idioma, porque
   * a barra de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { AgentStatus } from '@/components/ui/agent-status';
  import { agentStatusLabelsFor } from '@/components/ui/agent-status/agent-status.fixtures';
  import { CostMeter, type CostMeterLabels } from './index';
  import { amountOf, budgetOf } from './cost-meter.fixtures';

  const {
    labels,
  }: {
    labels: CostMeterLabels;
  } = $props();

  const runLabels = $derived(agentStatusLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <AgentStatus status="complete" labels={runLabels} />
  <CostMeter amount={amountOf('normal')} budget={budgetOf('normal')} {labels} />
</div>
