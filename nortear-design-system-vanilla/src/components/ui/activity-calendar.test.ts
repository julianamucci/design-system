/**
 * A conta da grade de atividade, em nó.
 *
 * Ela mora em `@shared/primitives/activity-calendar` justamente para poder ser
 * medida sem navegador: nada nela lê o DOM, e por isso as decisões que cinco
 * stacks reescreveriam — a janela que chega de fora, a semana que ancora as
 * linhas, o dia repetido que soma, o rótulo de mês que não se sobrepõe, o rótulo
 * de dia alternado e a classificação da contagem em nível — se verificam aqui,
 * uma vez, e não cinco vezes numa suíte de navegador.
 *
 * A CONTA DO DIA DA SEMANA É EM UTC DO PRIMEIRO AO ÚLTIMO PASSO, e este arquivo
 * é o que segura isso: um teste que só afirmasse contagens passaria com a grade
 * deslocada em uma casa para quem estivesse a oeste de Greenwich.
 */

import { describe, expect, it } from 'vitest';
import type { ActivityDay } from '@shared/primitives/chat-protocol';
import {
  activityLevel,
  resolveActivityCalendar,
} from '@shared/primitives/activity-calendar';

/** Uma escala de quatro degraus, como a do exemplo. */
const SCALE: readonly number[] = [1, 4, 8, 13];

function day(date: string, count: number): ActivityDay {
  return { date, count };
}

describe('activityLevel', () => {
  it('o nível é quantos degraus da escala a contagem alcança', () => {
    expect(activityLevel(0, SCALE)).toBe(0);
    expect(activityLevel(1, SCALE)).toBe(1);
    expect(activityLevel(3, SCALE)).toBe(1);
    expect(activityLevel(4, SCALE)).toBe(2);
    expect(activityLevel(12, SCALE)).toBe(3);
    expect(activityLevel(13, SCALE)).toBe(4);
    expect(activityLevel(900, SCALE)).toBe(4);
  });

  it('o empate com o degrau ALCANÇA o degrau', () => {
    // É a borda que cinco `if` escritos à mão erram de cinco maneiras.
    expect(activityLevel(8, SCALE)).toBe(3);
    expect(activityLevel(7, SCALE)).toBe(2);
  });

  it('a escala fora de ordem devolve o mesmo nível da escala ordenada', () => {
    // De graça, e tira do caminho a única maneira silenciosa de errar aqui.
    expect(activityLevel(9, [13, 1, 8, 4])).toBe(activityLevel(9, SCALE));
  });

  it('contagem negativa é nível zero, e não um nível negativo', () => {
    expect(activityLevel(-5, SCALE)).toBe(0);
  });

  it('nível zero não quer dizer "não houve": a escala pode começar acima de um', () => {
    expect(activityLevel(3, [5, 10])).toBe(0);
  });
});

describe('resolveActivityCalendar', () => {
  const janela = { start: '2026-01-01', end: '2026-03-31', thresholds: SCALE };

  it('sem janela não devolve grade', () => {
    // Fim antes do começo não é janela.
    expect(resolveActivityCalendar([], { ...janela, start: '2026-03-31', end: '2026-01-01' }))
      .toBeNull();
    // Data ilegível também não.
    expect(resolveActivityCalendar([], { ...janela, start: 'ontem' })).toBeNull();
    // 31 de fevereiro não existe, e transbordar para março em silêncio seria
    // desenhar uma casa num dia que ninguém mediu.
    expect(resolveActivityCalendar([], { ...janela, start: '2026-02-31' })).toBeNull();
  });

  it('sem escala não devolve grade', () => {
    // Sem degrau todo dia pintaria igual, e a peça deixaria de dizer algo.
    expect(resolveActivityCalendar([], { ...janela, thresholds: [] })).toBeNull();
  });

  it('GRADE VAZIA É GRADE: janela sem atividade nenhuma desenha', () => {
    // É a diferença desta peça em relação às duas irmãs da família: um trimestre
    // em que nada aconteceu É a resposta, e devolver nada a esconderia.
    const grade = resolveActivityCalendar([], janela)!;

    expect(grade).not.toBeNull();
    expect(grade.total).toBe(0);
    expect(grade.cells).toHaveLength(90);
    expect(grade.cells.every((c) => c.level === 0)).toBe(true);
  });

  it('há uma casa por dia da janela, e nenhuma fora dela', () => {
    const grade = resolveActivityCalendar([], { ...janela, end: '2026-01-31' })!;

    expect(grade.cells).toHaveLength(31);
    expect(grade.cells[0].date).toBe('2026-01-01');
    expect(grade.cells[30].date).toBe('2026-01-31');
  });

  it('a linha é o dia da semana, contada em UTC', () => {
    // 2026-01-01 é uma quinta-feira. Numa semana que começa no domingo, quinta é
    // a quinta linha. `getDay()` local devolveria quarta a oeste de Greenwich, e
    // a grade inteira andaria uma casa sem reprovar em teste nenhum.
    const grade = resolveActivityCalendar([], { ...janela, end: '2026-01-07' })!;

    expect(grade.cells[0].row).toBe(5);
    expect(grade.cells[1].row).toBe(6);
    expect(grade.cells[2].row).toBe(7);
    // Domingo volta para a primeira linha, e para a coluna seguinte.
    expect(grade.cells[3].row).toBe(1);
    expect(grade.cells[3].column).toBe(2);
  });

  it('a semana pode começar na segunda, e as linhas giram junto', () => {
    const grade = resolveActivityCalendar(
      [],
      { ...janela, end: '2026-01-07', weekStart: 1 },
    )!;

    // Com a semana começando na segunda, quinta é a quarta linha.
    expect(grade.cells[0].row).toBe(4);
    // E o domingo passa a fechar a semana em vez de abri-la.
    expect(grade.cells[3].row).toBe(7);
    expect(grade.cells[3].column).toBe(1);
  });

  it('a grade começa na semana que CONTÉM o começo, e não no começo', () => {
    // Sem isso as linhas deixariam de ser dias da semana, que é a leitura
    // inteira de um mapa de calendário.
    const grade = resolveActivityCalendar([], { ...janela, end: '2026-01-31' })!;

    expect(grade.cells[0].column).toBe(1);
    expect(grade.cells[0].row).toBe(5);
    expect(grade.weeks).toBe(5);
  });

  it('o dia repetido SOMA, e não fica com o último', () => {
    // Duas entradas para a mesma data são duas medições do mesmo dia; ficar com
    // uma perderia dado em silêncio.
    const grade = resolveActivityCalendar(
      [day('2026-01-02', 3), day('2026-01-02', 4)],
      { ...janela, end: '2026-01-31' },
    )!;

    const casa = grade.cells.find((c) => c.date === '2026-01-02')!;
    expect(casa.count).toBe(7);
    expect(casa.level).toBe(activityLevel(7, SCALE));
    expect(grade.total).toBe(7);
  });

  it('o dia fora da janela sai, e não quebra', () => {
    const grade = resolveActivityCalendar(
      [day('2025-12-31', 99), day('2026-01-02', 5), day('2026-04-01', 99), day('ontem', 99)],
      janela,
    )!;

    expect(grade.total).toBe(5);
    expect(grade.cells.some((c) => c.date === '2025-12-31')).toBe(false);
  });

  it('o total é a soma do que caiu dentro da janela', () => {
    const grade = resolveActivityCalendar(
      [day('2026-01-02', 2), day('2026-02-10', 3), day('2026-03-05', 4)],
      janela,
    )!;

    expect(grade.total).toBe(9);
  });

  it('cada mês da janela ganha um rótulo, e nenhum se sobrepõe ao vizinho', () => {
    // Dois rótulos na mesma casa se sobrepõem, e o que se lê ali vira nada.
    const grade = resolveActivityCalendar([], janela)!;

    expect(grade.months.map((m) => m.month)).toEqual([0, 1, 2]);
    const colunas = grade.months.map((m) => m.column);
    expect(new Set(colunas).size).toBe(colunas.length);
  });

  it('o rótulo de mês cobre até onde o próximo começa', () => {
    const grade = resolveActivityCalendar([], janela)!;

    for (const [index, mes] of grade.months.entries()) {
      const proximo = grade.months[index + 1];
      const fim = proximo ? proximo.column : grade.weeks + 1;
      expect(mes.span).toBe(fim - mes.column);
    }
  });

  it('o rótulo de dia da semana é alternado, a partir da segunda linha', () => {
    // Sete rótulos na altura de sete casas não cabem em fonte nenhuma.
    const grade = resolveActivityCalendar([], janela)!;

    expect(grade.weekdays.map((w) => w.row)).toEqual([2, 4, 6]);
    // Com a semana começando no domingo, a segunda linha é segunda-feira.
    expect(grade.weekdays.map((w) => w.weekday)).toEqual([1, 3, 5]);
  });

  it('o teto do nível é o número de degraus da escala', () => {
    const grade = resolveActivityCalendar([day('2026-01-02', 9999)], janela)!;

    expect(grade.levels).toBe(SCALE.length);
    expect(Math.max(...grade.cells.map((c) => c.level))).toBe(SCALE.length);
  });

  it('devolve o primeiro e o último dia, para a frase do total', () => {
    const grade = resolveActivityCalendar([], janela)!;

    expect(grade.from.date).toBe('2026-01-01');
    expect(grade.to.date).toBe('2026-03-31');
    expect(grade.from.month).toBe(0);
    expect(grade.to.month).toBe(2);
    expect(grade.to.day).toBe(31);
    expect(grade.to.year).toBe(2026);
  });
});
