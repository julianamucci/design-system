/**
 * Andaime das demonstrações do bloco de terminal — um construtor por caso.
 *
 * Existe pelo mesmo motivo do andaime do andamento de trabalho longo: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode morar
 * lá, e a saída fácil — copiar a constante para cada arquivo — produz cópias que
 * divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — a
 * palavra de cada estado e o molde do código de saída. O COMANDO e as LINHAS
 * saem de `@shared/primitives/terminal-block-examples`, porque não são idioma:
 * `npm run build` é `npm run build` nos três, e a saída é o que a máquina
 * escreveu. Escrever saída diferente por idioma faria as fotos terem alturas e
 * larguras diferentes, e a divergência apareceria no Chromatic sem que ninguém
 * conseguisse atribuí-la a nada.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import terminalTranslations from '@shared/content/terminal-block/translations.json';
import type { RunStatus } from '@shared/primitives/chat-protocol';
import {
  TERMINAL_LINES_COMPLETE,
  TERMINAL_LINES_FAILED,
  TERMINAL_LINES_RUNNING,
  TERMINAL_LINES_STOPPED,
} from '@shared/primitives/terminal-block-examples';
import type { TerminalBlockLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `TerminalBlockLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um estado
 * sem palavra deixaria a peça distinguindo o comando só pela cor do ponto, que é
 * exatamente o que a decisão 5 da folha proíbe.
 */
const CONTENT: Record<Locale, { labels: TerminalBlockLabels }> = terminalTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function terminalBlockLabelsFor(target: Locale): TerminalBlockLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function terminalBlockLabels(): TerminalBlockLabels {
  return terminalBlockLabelsFor(get(locale));
}

/**
 * A saída de exemplo de cada estado.
 *
 * Uma por estado, e não uma só para todos, porque aqui o estado MUDA a saída: o
 * que corre para no meio de uma linha porque ainda escreve, o interrompido para
 * no meio porque alguém o cortou, o que terminou traz a tabela alinhada e o que
 * falhou traz a linha larga. Uma saída só faria as cinco fotos mostrarem o mesmo
 * texto com palavras diferentes embaixo, que é justamente o que a peça NÃO faz.
 *
 * Em espera fica sem linha nenhuma, e é o caso que a peça existe para não errar:
 * comando enfileirado não escreveu nada, e caixa vazia com parada de tabulação
 * dentro é foco para lugar nenhum.
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
 * Em espera e em andamento ficam de fora porque o número ainda não existe — e o
 * 130 do interrompido não é enfeite: é o que um processo devolve quando o sinal
 * de interrupção o alcança, e ele mostra por que a peça não deduz o estado do
 * número. Cento e trinta não é zero, e ainda assim ninguém falhou.
 */
const EXIT_CODE_BY_STATUS: Partial<Record<RunStatus, number>> = {
  stopped: 130,
  complete: 0,
  failed: 1,
};

export function exitCodeFor(status: RunStatus): number | undefined {
  return EXIT_CODE_BY_STATUS[status];
}
