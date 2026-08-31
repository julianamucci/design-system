<script lang="ts">
  /**
   * Andaime do par sem caixa de saída.
   *
   * Duas peças, e as duas dizem a mesma coisa sobre a caixa por caminhos
   * diferentes: uma terminou sem escrever nada, a outra ainda não rodou. Caso
   * real, e não borda — é o que um terminal de verdade mostra —, e a ausência da
   * caixa é o assunto: caixa vazia com parada de tabulação dentro seria dar foco
   * a lugar nenhum.
   *
   * Num `*.stories.ts` não há onde escrever duas peças empilhadas, e todo export
   * nomeado dali vira story: daí este invólucro.
   */
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
  <TerminalBlock {command} status="complete" exitCode={0} {labels} />
  <TerminalBlock
    {command}
    lines={linesFor('idle')}
    status="idle"
    exitCode={exitCodeFor('idle')}
    {labels}
  />
</div>
