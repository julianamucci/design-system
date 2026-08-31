<script lang="ts">
  /**
   * Andaime da sequência de comandos.
   *
   * A sequência é de quem consome: a peça desenha UM comando, e empilhá-las é o
   * que produz a sequência. Uma peça que recebesse a lista decidiria ordenação e
   * agrupamento, que são política de produto. Num `*.stories.ts` não há onde
   * escrever a pilha, e todo export nomeado dali vira story: daí este invólucro.
   *
   * Os três estados cobrem os três casos que a sequência produz: o que terminou
   * bem, o que quebrou e o que ainda não rodou — e é o último que mostra a
   * ausência da caixa dentro de uma pilha.
   */
  import type { RunStatus } from '@shared/primitives/chat-protocol';
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

  const SEQUENCE: readonly RunStatus[] = ['complete', 'failed', 'idle'];
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="lg">
  {#each SEQUENCE as status (status)}
    <TerminalBlock
      {command}
      lines={linesFor(status)}
      {status}
      exitCode={exitCodeFor(status)}
      {labels}
    />
  {/each}
</div>
