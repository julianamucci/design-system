<script lang="ts">
  /**
   * Andaime da composição "antes da resposta": o grupo e o texto que ele
   * antecede, empilhados.
   *
   * Num `*.stories.ts` não há onde escrever essa marcação, e todo export
   * nomeado dali vira story — daí o invólucro.
   *
   * A RESPOSTA FICA FORA DA CAIXA, e é o assunto da story: dentro dela, o que o
   * agente respondeu viraria detalhe de execução e sumiria junto com o resto no
   * instante em que alguém fechasse o grupo.
   */
  import type { ChatToolCall } from '@shared/primitives/chat-protocol';
  import { ToolGroup, type ToolGroupLabels } from './index';

  const {
    calls,
    labels,
    answer = 'Não publiquei o relatório: o destino recusou por falta de permissão de escrita.',
  }: {
    /** As chamadas que o grupo desenha, na ordem em que aconteceram. */
    calls: ChatToolCall[];
    labels: ToolGroupLabels;
    /** O que o agente respondeu, logo abaixo do que fez para responder. */
    answer?: string;
  } = $props();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <ToolGroup {calls} {labels} />
  <p>{answer}</p>
</div>
