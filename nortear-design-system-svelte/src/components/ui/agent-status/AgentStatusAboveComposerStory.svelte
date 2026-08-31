<script lang="ts">
  /**
   * Andaime da composição com o campo de mensagem.
   *
   * A linha e o campo são IRMÃOS num invólucro, e não pai e filho: é assim que
   * a peça se usa, e é o que prova que nada precisou ser acrescentado ao campo.
   * Num `*.stories.ts` não há onde escrever essa marcação, e todo export nomeado
   * dali vira story: daí este invólucro.
   *
   * As props são as MESMAS da peça — o arquivo de stories é tipado pelo
   * componente, e um invólucro com vocabulário próprio deixaria de caber ali. Os
   * rótulos do CAMPO não entram por prop: são derivados do idioma, porque a
   * barra de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { Composer } from '@/components/ui/composer';
  import type { RunStatus } from '@shared/primitives/chat-protocol';
  import { AgentStatus, type AgentStatusIntent, type AgentStatusLabels } from './index';
  import { composerLabelsFor, elapsedOf } from './agent-status.fixtures';

  const {
    status = 'running',
    labels,
    onAction,
  }: {
    /** Em que pé está a execução desenhada acima do campo. */
    status?: RunStatus;
    labels: AgentStatusLabels;
    onAction?: (intent: AgentStatusIntent) => void;
  } = $props();

  const fieldLabels = $derived(composerLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <AgentStatus {status} elapsed={elapsedOf(status)} {labels} {onAction} />
  <Composer labels={fieldLabels} />
</div>
