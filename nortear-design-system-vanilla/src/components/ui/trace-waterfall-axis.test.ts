/**
 * A conta da cascata de trechos, em nó.
 *
 * Ela mora em `@shared/primitives/trace-waterfall-axis` justamente para poder
 * ser medida sem navegador: nada nela lê o DOM, e por isso as cinco decisões que
 * cinco stacks reescreveriam — o eixo que chega de fora, encostar o recuo na
 * origem, recortar a barra nas duas pontas, a barra mínima e a ordem que não se
 * mexe — se verificam aqui, uma vez, e não cinco vezes numa suíte de navegador.
 */

import { describe, expect, it } from 'vitest';
import type { ToolCallState, TraceSpan } from '@shared/primitives/chat-protocol';
import { resolveTraceWaterfall } from '@shared/primitives/trace-waterfall-axis';

function span(
  id: string,
  startMs: number,
  durationMs: number,
  depth = 0,
  state: ToolCallState = 'done',
): TraceSpan {
  return { id, label: id.toUpperCase(), startMs, durationMs, depth, state };
}

describe('resolveTraceWaterfall', () => {
  it('sem trecho nenhum não devolve cascata', () => {
    // Moldura vazia seria pior que nada: a camada que rola é parada de teclado,
    // e uma parada que leva a uma caixa vazia é ruído com nome.
    expect(resolveTraceWaterfall([], 1000)).toBeNull();
  });

  it('sem eixo com extensão não devolve cascata', () => {
    // Eixo é o que dá sentido à posição. Sem ele não há régua para dividir, e
    // dividir por zero desenharia barras infinitas.
    expect(resolveTraceWaterfall([span('a', 0, 10)], 0)).toBeNull();
    expect(resolveTraceWaterfall([span('a', 0, 10)], -5)).toBeNull();
  });

  it('posiciona a barra em fração do eixo declarado', () => {
    const cascata = resolveTraceWaterfall([span('a', 250, 500)], 1000)!;

    expect(cascata.rows[0].start).toBe(25);
    expect(cascata.rows[0].size).toBe(50);
    expect(cascata.rows[0].clipped).toBe(false);
  });

  it('o eixo NÃO é derivado dos trechos', () => {
    // É a decisão que separa esta peça de uma fila de barras: com metade do
    // rastro na mão, as barras guardam a posição verdadeira em vez de
    // reescalarem para ocupar a régua inteira.
    const inteiro = resolveTraceWaterfall([span('a', 0, 200), span('b', 800, 200)], 1000)!;
    const metade = resolveTraceWaterfall([span('a', 0, 200)], 1000)!;

    expect(metade.totalMs).toBe(1000);
    expect(metade.rows[0].start).toBe(inteiro.rows[0].start);
    expect(metade.rows[0].size).toBe(inteiro.rows[0].size);
  });

  it('encosta o menor recuo na origem, e a base da contagem não importa', () => {
    // `depth` é RELATIVO entre os trechos, como `column` e `row` no grafo. Um
    // rastro declarado a partir do recuo 3 não abre três degraus vazios.
    const cascata = resolveTraceWaterfall(
      [span('a', 0, 100, 3), span('b', 0, 100, 5), span('c', 0, 100, 4)],
      1000,
    )!;

    expect(cascata.rows.map((r) => r.indent)).toEqual([0, 2, 1]);
    expect(cascata.depth).toBe(2);
  });

  it('aceita recuo negativo, pelo mesmo motivo', () => {
    const cascata = resolveTraceWaterfall([span('a', 0, 100, -2), span('b', 0, 100, 0)], 1000)!;

    expect(cascata.rows.map((r) => r.indent)).toEqual([0, 2]);
  });

  it('recorta a barra que começa antes da origem do eixo', () => {
    // Não é erro: é o eixo declarado como uma JANELA do rastro, e o trecho
    // começou antes dela.
    const cascata = resolveTraceWaterfall([span('a', -500, 1000)], 1000)!;

    expect(cascata.rows[0].start).toBe(0);
    expect(cascata.rows[0].size).toBe(50);
    expect(cascata.rows[0].clipped).toBe(true);
  });

  it('recorta a barra que termina depois do fim do eixo', () => {
    const cascata = resolveTraceWaterfall([span('a', 800, 900)], 1000)!;

    expect(cascata.rows[0].start).toBe(80);
    expect(cascata.rows[0].size).toBe(20);
    expect(cascata.rows[0].clipped).toBe(true);
  });

  it('desenha o trecho instantâneo com a barra mínima, e não com largura zero', () => {
    // Um trecho de zero milissegundo continua sendo um trecho; barra de largura
    // zero diria "não houve", que não é o que o dado diz.
    const cascata = resolveTraceWaterfall([span('a', 400, 0)], 1000)!;

    expect(cascata.rows[0].start).toBe(40);
    expect(cascata.rows[0].size).toBeGreaterThan(0);
  });

  it('a barra mínima sobrevive no trecho que começa depois do fim do eixo', () => {
    // O começo para antes da borda para que a barra mínima ainda caiba — sem
    // isso ela sairia com largura zero justamente onde ela mais faz falta.
    const cascata = resolveTraceWaterfall([span('a', 5000, 10)], 1000)!;

    expect(cascata.rows[0].start).toBeLessThan(100);
    expect(cascata.rows[0].size).toBeGreaterThan(0);
    expect(cascata.rows[0].start + cascata.rows[0].size).toBeLessThanOrEqual(100);
    expect(cascata.rows[0].clipped).toBe(true);
  });

  it('duração negativa não desenha barra que anda para trás', () => {
    // Dado ruim, e as duas saídas ruins seriam sumir com a linha ou afirmar
    // sobre o tempo o que o dado não afirma.
    const cascata = resolveTraceWaterfall([span('a', 300, -100)], 1000)!;

    expect(cascata.rows[0].start).toBe(30);
    expect(cascata.rows[0].size).toBeGreaterThan(0);
  });

  it('a barra nunca passa do fim do eixo', () => {
    const cascata = resolveTraceWaterfall(
      [span('a', 0, 100), span('b', 900, 500), span('c', 990, 5)],
      1000,
    )!;

    for (const row of cascata.rows) {
      expect(row.start).toBeGreaterThanOrEqual(0);
      expect(row.start + row.size).toBeLessThanOrEqual(100);
    }
  });

  it('NÃO ordena: a ordem de saída é a ordem de declaração', () => {
    // A ordem no DOM é a ordem de leitura (WCAG 1.3.2), e ordenar por começo
    // seria a peça reescrevendo o rastro de quem monta.
    const cascata = resolveTraceWaterfall(
      [span('tarde', 800, 100), span('cedo', 0, 100), span('meio', 400, 100)],
      1000,
    )!;

    expect(cascata.rows.map((r) => r.span.id)).toEqual(['tarde', 'cedo', 'meio']);
  });

  it('devolve o eixo declarado junto com as linhas', () => {
    // Quem desenha precisa dele para a frase da régua, e lê-lo de volta daqui é
    // o que impede a frase e as barras de discordarem.
    const cascata = resolveTraceWaterfall([span('a', 0, 100)], 1234)!;

    expect(cascata.totalMs).toBe(1234);
  });
});
