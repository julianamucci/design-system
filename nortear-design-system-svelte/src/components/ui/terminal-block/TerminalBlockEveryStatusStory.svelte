<script lang="ts">
  /**
   * Andaime da grade dos cinco estados.
   *
   * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
   * novo no vocabulário compartilhado entra na story sozinho, que é exatamente o
   * que aquela constante existe para garantir. Num `*.stories.ts` não há onde
   * escrever a repetição, e todo export nomeado dali vira story: daí este
   * invólucro.
   *
   * A saída de exemplo ACOMPANHA o estado, de propósito. Aqui o estado MUDA a
   * saída: o que corre para no meio porque ainda escreve, o interrompido para no
   * meio porque alguém o cortou, o que terminou traz a tabela alinhada e o que
   * falhou traz a linha larga. Uma saída só para os cinco faria as fotos
   * mostrarem o mesmo texto com palavras diferentes embaixo, que é exatamente o
   * que esta peça não faz.
   */
  import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
  import { TerminalBlock, type TerminalBlockLabels } from './index';
  import { exitCodeFor, linesFor } from './terminal-block.fixtures';

  const {
    command,
    labels,
  }: {
    /** O que foi executado. Igual em toda foto, e vindo de fora como na peça. */
    command: string;
    labels: TerminalBlockLabels;
  } = $props();
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  {#each RUN_STATUSES as status (status)}
    <TerminalBlock
      {command}
      lines={linesFor(status)}
      {status}
      exitCode={exitCodeFor(status)}
      {labels}
    />
  {/each}
</div>
