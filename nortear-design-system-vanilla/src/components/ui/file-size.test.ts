// A conversão de bytes, presa sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.

import { describe, expect, it } from 'vitest';
import {
  FILE_SIZE_UNITS,
  formatFileSize,
  type FileSizeUnit,
} from '@shared/primitives/file-size';

describe('a lista cobre a união inteira', () => {
  it('quatro unidades, e nenhuma a mais', () => {
    // Mesma razão das listas do `chat-protocol`: acrescentar uma unidade ao
    // tipo e esquecer a lista deixa o mapa de rótulos sem ela, e nada quebra —
    // o texto só some da tela.
    const uniao: FileSizeUnit[] = ['byte', 'kb', 'mb', 'gb'];
    expect([...FILE_SIZE_UNITS]).toEqual(uniao);
  });
});

describe('o limiar é EXATO', () => {
  it('mil e vinte e três bytes ficam em bytes', () => {
    expect(formatFileSize(1023)).toEqual({ value: 1023, unit: 'byte' });
  });

  it('mil e vinte e quatro viram um quilo', () => {
    // A comparação frouxa produziria "1024,0 KB", que é um número que ninguém
    // escreveria à mão.
    expect(formatFileSize(1024)).toEqual({ value: 1, unit: 'kb' });
  });

  it('e o mesmo salto acontece em cada degrau', () => {
    expect(formatFileSize(1024 * 1024)).toEqual({ value: 1, unit: 'mb' });
    expect(formatFileSize(1024 * 1024 * 1024)).toEqual({ value: 1, unit: 'gb' });
  });

  it('acima do maior degrau, a unidade não cresce mais', () => {
    // Não há unidade acima; o número é que cresce.
    const grande = formatFileSize(1024 * 1024 * 1024 * 2048);
    expect(grande.unit).toBe('gb');
    expect(grande.value).toBe(2048);
  });
});

describe('as casas decimais', () => {
  it('uma casa abaixo de dez', () => {
    // 9,4 MB informa; 9,44 MB não informa mais e ocupa mais espaço num chip
    // que já é estreito.
    expect(formatFileSize(9.44 * 1024 * 1024).value).toBe(9.4);
  });

  it('nenhuma casa acima de dez', () => {
    // Entre 12,3 MB e 12 MB não há decisão que mude.
    expect(formatFileSize(12.34 * 1024 * 1024).value).toBe(12);
  });

  it('byte nunca tem casa — meio byte não existe', () => {
    expect(formatFileSize(1.6)).toEqual({ value: 2, unit: 'byte' });
  });
});

describe('entrada que não é tamanho', () => {
  it('zero é zero byte', () => {
    expect(formatFileSize(0)).toEqual({ value: 0, unit: 'byte' });
  });

  it('negativo também', () => {
    // Arquivo não tem tamanho negativo, e um número negativo na tela seria
    // pior que o zero.
    expect(formatFileSize(-5)).toEqual({ value: 0, unit: 'byte' });
  });

  it('e o que não é número finito também', () => {
    // `NaN` chega quando quem produz o dado não sabe o tamanho e faz uma conta
    // com `undefined`. Na tela, "NaN B" é pior que "0 B".
    expect(formatFileSize(Number.NaN)).toEqual({ value: 0, unit: 'byte' });
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toEqual({ value: 0, unit: 'byte' });
  });
});
