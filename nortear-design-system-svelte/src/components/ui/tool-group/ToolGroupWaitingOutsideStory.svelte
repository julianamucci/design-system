<script lang="ts">
  /**
   * Andaime da composição em que a chamada que espera por uma pessoa fica FORA
   * da caixa recolhida.
   *
   * Quem separa é quem CONSOME, e a conta vem do vocabulário compartilhado: um
   * componente que filtrasse sozinho apagaria da tela um dado que recebeu. O
   * invólucro existe porque num `*.stories.ts` não há onde escrever dois grupos
   * empilhados, e todo export nomeado dali vira story.
   *
   * O primeiro grupo nasce ABERTO de propósito: pedir autorização dentro de uma
   * caixa fechada é pedir sem mostrar.
   */
  import type { ChatToolCall } from '@shared/primitives/chat-protocol';
  import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';
  import { ToolGroup, type ToolGroupLabels } from './index';

  const {
    calls,
    labels,
  }: {
    /** Tudo o que aconteceu, na ordem — inclusive o que espera por alguém. */
    calls: ChatToolCall[];
    labels: ToolGroupLabels;
  } = $props();

  const split = $derived(splitWaitingCalls(calls));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <ToolGroup calls={split.waiting} {labels} open />
  <ToolGroup calls={split.grouped} {labels} />
</div>
