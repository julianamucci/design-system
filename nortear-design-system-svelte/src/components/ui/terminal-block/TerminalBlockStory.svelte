<script lang="ts">
  /**
   * Andaime do Playground do bloco de terminal.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface. Sem o invólucro, o `render` montaria os rótulos
   * no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o campo numérico vazio vira AUSÊNCIA de código de
   * saída: zero é um resultado, e ausência é não haver resultado ainda. E onde
   * "houve saída?" vira lista vazia — que é o caso do comando que terminou sem
   * escrever nada.
   */
  import { locale } from '@/lib/i18n';
  import type { RunStatus } from '@shared/primitives/chat-protocol';
  import { TERMINAL_COMMAND } from '@shared/primitives/terminal-block-examples';
  import { TerminalBlock } from './index';
  import { linesFor, terminalBlockLabelsFor } from './terminal-block.fixtures';

  const {
    status,
    exitCode,
    withOutput,
  }: {
    /** Em que pé está o comando. Decide a palavra, o ponto, o ocupado e o cursor. */
    status: RunStatus;
    /** O que o processo devolveu. Campo vazio é ausência, e não zero. */
    exitCode: number;
    /** Houve saída? Sem linha nenhuma não há caixa que rola. */
    withOutput: boolean;
  } = $props();

  const labels = $derived(terminalBlockLabelsFor($locale));
  const lines = $derived(withOutput ? linesFor(status) : []);
  const code = $derived(Number.isFinite(exitCode) ? exitCode : undefined);
</script>

<TerminalBlock command={TERMINAL_COMMAND} {lines} {status} exitCode={code} {labels} />
