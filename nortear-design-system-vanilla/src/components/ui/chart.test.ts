// A alternativa textual do Chart, medida onde ela é decidida.
//
// `buildChartTable` é pura de propósito: o que a tabela DIZ — quantas colunas,
// que número em cada célula, o que entra no lugar do dado que falta — não
// precisa de navegador para ser verificado, e os casos de borda aqui (célula
// vazia, decimal, rosca de total zero) não aparecem em story nenhuma. O que
// vira nó do DOM (escopo do cabeçalho, `.nds-sr-only`, a caixa que rola)
// continua sendo medido no DOM, pelas play functions.

import { describe, expect, it } from 'vitest';
import { buildChartTable, formatValue } from './chart';

describe('formatValue', () => {
  it('não enfeita inteiro nem depende de locale', () => {
    expect(formatValue(186)).toBe('186');
    expect(formatValue(0)).toBe('0');
    expect(formatValue(-42)).toBe('-42');
  });

  it('corta o decimal em duas casas', () => {
    expect(formatValue(3.14159)).toBe('3.14');
    expect(formatValue(1.239)).toBe('1.24');
    // Uma casa continua sendo uma casa: o corte é teto, não formato fixo.
    expect(formatValue(12.5)).toBe('12.5');
  });
});

describe('buildChartTable', () => {
  it('uma coluna de categoria e uma por série', () => {
    const table = buildChartTable({
      xAxis: ['Jan', 'Feb'],
      series: [
        { name: 'Desktop', data: [186, 305] },
        { name: 'Mobile', data: [120, 190] },
      ],
    });
    expect(table.header).toEqual(['Categoria', 'Desktop', 'Mobile']);
    expect(table.lines).toEqual([
      ['Jan', '186', '120'],
      ['Feb', '305', '190'],
    ]);
  });

  it('a forma simples vira uma série nomeada', () => {
    // Sem nome declarado a coluna sairia com o identificador interno da série,
    // que não é palavra para quem lê.
    const table = buildChartTable({
      data: [{ label: 'Jan', value: 186 }],
    });
    expect(table.header).toEqual(['Categoria', 'Valor']);
    expect(table.lines).toEqual([['Jan', '186']]);
  });

  it('aceita cabeçalhos autorais', () => {
    const table = buildChartTable({
      data: [{ label: 'Jan', value: 186 }],
      categoryLabel: 'Mês',
      valueLabel: 'Acessos',
    });
    expect(table.header).toEqual(['Mês', 'Acessos']);
  });

  it('série mais curta que o eixo não come a linha — a célula fica vazia', () => {
    // A categoria existe e aquela série não a preenche: apagar a linha
    // esconderia o dado das OUTRAS séries junto.
    const table = buildChartTable({
      xAxis: ['Jan', 'Feb', 'Mar'],
      series: [
        { name: 'Desktop', data: [186, 305, 237] },
        { name: 'Mobile', data: [120] },
      ],
    });
    expect(table.lines).toEqual([
      ['Jan', '186', '120'],
      ['Feb', '305', '—'],
      ['Mar', '237', '—'],
    ]);
  });

  it('sem rótulo de eixo, a posição vira o rótulo', () => {
    const table = buildChartTable({ series: [{ name: 'Desktop', data: [186, 305] }] });
    expect(table.lines.map((l) => l[0])).toEqual(['1', '2']);
  });

  it('a rosca escreve a participação, que é o que a ÁREA comunica', () => {
    const table = buildChartTable({
      type: 'pie',
      data: [
        { label: 'Desktop', value: 580 },
        { label: 'Mobile', value: 420 },
      ],
    });
    expect(table.header).toEqual(['Categoria', 'Valor', 'Participação']);
    expect(table.lines).toEqual([
      ['Desktop', '580', '58%'],
      ['Mobile', '420', '42%'],
    ]);
  });

  it('rosca de total zero não divide por zero', () => {
    const table = buildChartTable({
      type: 'pie',
      data: [{ label: 'Desktop', value: 0 }],
    });
    expect(table.lines).toEqual([['Desktop', '0', '—']]);
  });

  it('sem dado nenhum, a tabela nasce sem linha', () => {
    expect(buildChartTable({}).lines).toEqual([]);
  });
});
