<script lang="ts">
  /**
   * Andaime da saída longa, com o teto apertado de propósito.
   *
   * O teto é a única coisa que este invólucro muda, e ele entra por CUSTOM
   * PROPERTY: valor de runtime entra por custom property, nunca por declaração
   * de desenho em `style`. É também a única maneira de mudá-lo sem tirar o valor
   * do tema e da escala de tipo — e ele está em `rem`, então cresce com a fonte
   * do navegador: a 200% de texto a caixa fica maior, em vez de mostrar metade
   * das linhas no mesmo espaço.
   *
   * Num `*.stories.ts` não há onde escrever essa marcação, e todo export nomeado
   * dali vira story: daí este invólucro.
   */
  import { TERMINAL_LINES_COMPLETE } from '@shared/primitives/terminal-block-examples';
  import { TerminalBlock, type TerminalBlockLabels } from './index';

  const {
    command,
    labels,
  }: {
    /** O que foi executado. Igual em toda foto, e vindo de fora como na peça. */
    command: string;
    labels: TerminalBlockLabels;
  } = $props();

  /** A saída inteira, repetida, para transbordar o teto com folga. */
  const lines = [...TERMINAL_LINES_COMPLETE, ...TERMINAL_LINES_COMPLETE];
</script>

<div
  class="nds-stack nds-max-w-lg"
  data-spacing="lg"
  style="--terminal-block-max-block-size: 6rem"
>
  <TerminalBlock
    {command}
    {lines}
    status="complete"
    exitCode={0}
    {labels}
  />
</div>
