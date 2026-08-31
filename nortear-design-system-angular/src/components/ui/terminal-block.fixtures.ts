/**
 * Andaime das demonstrações do bloco de terminal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra de cada estado e o molde do código de saída. O COMANDO e as LINHAS
 * saem de `@shared/primitives/terminal-block-examples`, porque não são idioma:
 * `npm run build` é `npm run build` nos três, e a saída é o que a máquina
 * escreveu. Escrever saída diferente por idioma faria as fotos terem alturas e
 * larguras diferentes, e a divergência apareceria no Chromatic sem que ninguém
 * conseguisse atribuí-la a nada.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import terminalTranslations from '@shared/content/terminal-block/translations.json';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import {
  TERMINAL_LINES_COMPLETE,
  TERMINAL_LINES_FAILED,
  TERMINAL_LINES_RUNNING,
  TERMINAL_LINES_STOPPED,
} from '@shared/primitives/terminal-block-examples';
import type { TerminalBlockLabels } from './terminal-block';

const { t } = useTranslation(terminalTranslations as Record<string, unknown>);

/**
 * A palavra de cada estado e o molde do código de saída.
 *
 * O mapa de estados sai de `RUN_STATUSES`, e não de cinco linhas escritas à
 * mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
 * que percorre os estados passa a cobri-lo sem que ninguém lembre de mexer no
 * andaime.
 */
export function terminalBlockLabels(): TerminalBlockLabels {
  const status = {} as Record<RunStatus, string>;
  for (const item of RUN_STATUSES) status[item] = t(`labels.status.${item}`);

  return { status, exitCode: t('labels.exitCode') };
}

/**
 * A saída de exemplo de cada estado.
 *
 * Uma por estado, e não uma só para todos, porque aqui o estado MUDA a saída:
 * o que corre para no meio de uma linha porque ainda escreve, o interrompido
 * para no meio porque alguém o cortou, o que terminou traz a tabela alinhada e
 * o que falhou traz a linha larga. Uma saída só faria as cinco fotos mostrarem
 * o mesmo texto com palavras diferentes embaixo, que é justamente o que a peça
 * NÃO faz.
 *
 * Em espera fica sem linha nenhuma, e é o caso que a peça existe para não
 * errar: comando enfileirado não escreveu nada, e caixa vazia com parada de
 * tabulação dentro é foco para lugar nenhum.
 */
const LINES_BY_STATUS: Record<RunStatus, readonly string[]> = {
  idle: [],
  running: TERMINAL_LINES_RUNNING,
  stopped: TERMINAL_LINES_STOPPED,
  complete: TERMINAL_LINES_COMPLETE,
  failed: TERMINAL_LINES_FAILED,
};

export function linesFor(status: RunStatus): readonly string[] {
  return LINES_BY_STATUS[status];
}

/**
 * O código de saída de exemplo de cada estado, ou nada onde ele não existe.
 *
 * Em espera e em andamento ficam de fora porque o número ainda não existe — e
 * o 130 do interrompido não é enfeite: é o que um processo devolve quando o
 * sinal de interrupção o alcança, e ele mostra por que a peça não deduz o
 * estado do número. Cento e trinta não é zero, e ainda assim ninguém falhou.
 */
const EXIT_CODE_BY_STATUS: Partial<Record<RunStatus, number>> = {
  stopped: 130,
  complete: 0,
  failed: 1,
};

export function exitCodeFor(status: RunStatus): number | undefined {
  return EXIT_CODE_BY_STATUS[status];
}
