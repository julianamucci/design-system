/**
 * Bytes em algo que se lê.
 *
 * Máquina pura, como `chat-scroll.ts` e `composer-trigger.ts`: só a conta vive
 * aqui, e ela é a mesma nas cinco stacks. O TEXTO — a palavra da unidade, o
 * separador decimal — não mora neste módulo: unidade é texto de interface e tem
 * três idiomas, então quem monta a frase é o componente, com o rótulo que veio
 * da `translations.json`.
 *
 * A guideline 17 não lista este primitivo. Ele existe porque a alternativa era
 * cada stack converter bytes do seu jeito, e a conversão tem TRÊS decisões
 * dentro dela — cada uma com duas respostas plausíveis, e nenhuma delas óbvia:
 *
 * 1. Mil ou mil e vinte e quatro? Este módulo usa 1024, porque é o que o
 *    sistema operacional mostra na janela de escolher arquivo — e o número ao
 *    lado do nome do anexo é comparado com aquele, não com o do servidor.
 * 2. Quantas casas? Uma abaixo de dez, nenhuma acima. "9,4 MB" informa; "9,44
 *    MB" não informa mais e ocupa mais espaço num chip que já é estreito.
 * 3. Onde a unidade troca? No limiar exato, e não perto dele: 1023 bytes ficam
 *    em bytes, 1024 viram um quilo. A regra frouxa produz "1024,0 KB", que é
 *    um número que ninguém escreveria à mão.
 */

/** As unidades, da menor para a maior. */
export type FileSizeUnit = 'byte' | 'kb' | 'mb' | 'gb';

export const FILE_SIZE_UNITS: readonly FileSizeUnit[] = ['byte', 'kb', 'mb', 'gb'] as const;

/** O tamanho já reduzido à unidade em que ele se lê. */
export interface FileSize {
  /** O número, arredondado como a decisão 2 manda. */
  value: number;
  unit: FileSizeUnit;
}

const STEP = 1024;

/**
 * Reduz os bytes à maior unidade em que o número ainda é ≥ 1.
 *
 * Negativo e não-finito viram zero bytes: o tamanho de um arquivo não é
 * negativo, e um `NaN` na tela é pior que um zero — zero pelo menos se lê.
 */
export function formatFileSize(bytes: number): FileSize {
  if (!Number.isFinite(bytes) || bytes <= 0) return { value: 0, unit: 'byte' };

  let value = bytes;
  let index = 0;
  // O limiar é exato: 1023 fica em bytes, 1024 vira um quilo. A comparação
  // frouxa produziria "1024,0 KB".
  while (value >= STEP && index < FILE_SIZE_UNITS.length - 1) {
    value /= STEP;
    index += 1;
  }

  return { value: round(value, index), unit: FILE_SIZE_UNITS[index]! };
}

/**
 * Uma casa decimal abaixo de dez, nenhuma acima — e byte nunca tem casa.
 *
 * Meio byte não existe, e "1,5 B" é um número que o sistema operacional nunca
 * mostra. Acima de dez a casa deixa de informar: entre 12,3 MB e 12 MB não há
 * decisão que mude.
 */
function round(value: number, unitIndex: number): number {
  if (unitIndex === 0) return Math.round(value);
  if (value >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
}
