// A alternativa textual do Chart, medida onde ela é decidida.
//
// `buildChartTable` é pura de propósito: o que a tabela DIZ — quantas colunas,
// que número em cada célula, o que entra no lugar do dado que falta — não
// precisa de navegador para ser verificado, e os casos de borda aqui (célula
// vazia, decimal, rosca de total zero) não aparecem em story nenhuma. O que
// vira nó do DOM (escopo do cabeçalho, `.nds-sr-only`, a caixa que rola)
// continua sendo medido no DOM, pelas play functions.

import { describe, expect, it } from 'vitest';
import { buildChartOption, buildChartTable, formatValue } from './chart';

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

  it('o funil escreve a participação em relação à PRIMEIRA etapa', () => {
    // O que o funil comunica é a LARGURA da faixa, e largura não se lê em
    // texto. A largura de cada faixa é o valor dela sobre o da entrada, então é
    // essa razão — e não a fatia de um total — que a coluna precisa trazer.
    const table = buildChartTable({
      type: 'funnel',
      data: [
        { label: 'Visitas', value: 1000 },
        { label: 'Cadastros', value: 620 },
        { label: 'Compras', value: 90 },
      ],
    });
    expect(table.header).toEqual(['Categoria', 'Valor', 'Participação']);
    expect(table.lines).toEqual([
      ['Visitas', '1000', '100%'],
      ['Cadastros', '620', '62%'],
      ['Compras', '90', '9%'],
    ]);
  });

  it('no funil a referência é a primeira etapa, não a maior', () => {
    // A ordem é a do processo, não a do valor. Uma etapa que recupera volume
    // passa dos 100% — o que é a leitura certa, e some se a conta trocar a
    // referência pelo maior valor do conjunto.
    const table = buildChartTable({
      type: 'funnel',
      data: [
        { label: 'Visitas', value: 400 },
        { label: 'Retorno', value: 500 },
      ],
    });
    expect(table.lines).toEqual([
      ['Visitas', '400', '100%'],
      ['Retorno', '500', '125%'],
    ]);
  });

  it('funil com entrada zerada não divide por zero', () => {
    const table = buildChartTable({
      type: 'funnel',
      data: [
        { label: 'Visitas', value: 0 },
        { label: 'Compras', value: 0 },
      ],
    });
    expect(table.lines).toEqual([
      ['Visitas', '0', '—'],
      ['Compras', '0', '—'],
    ]);
  });

  it('o funil aceita cabeçalhos autorais nas três colunas', () => {
    const table = buildChartTable({
      type: 'funnel',
      data: [{ label: 'Visitas', value: 1000 }],
      categoryLabel: 'Etapa',
      valueLabel: 'Pessoas',
      shareLabel: 'Share',
    });
    expect(table.header).toEqual(['Etapa', 'Pessoas', 'Share']);
  });

  it('o radar escreve o MÁXIMO de cada eixo, entre o nome e as séries', () => {
    // O que o radar comunica é a distância do vértice ao centro, e essa
    // distância é o valor sobre o teto DAQUELE eixo. Sem a coluna do meio, o 9
    // de um eixo que vai a 10 e o 96 de um eixo que vai a 100 sairiam como dois
    // números soltos, e a tabela deixaria de descrever o polígono desenhado.
    const table = buildChartTable({
      type: 'radar',
      radarAxes: [
        { label: 'Boas práticas', max: 10 },
        { label: 'SEO', max: 100 },
      ],
      series: [
        { name: 'Antes', data: [6, 88] },
        { name: 'Depois', data: [9, 96] },
      ],
    });
    expect(table.header).toEqual(['Categoria', 'Máximo', 'Antes', 'Depois']);
    expect(table.lines).toEqual([
      ['Boas práticas', '10', '6', '9'],
      ['SEO', '100', '88', '96'],
    ]);
  });

  it('o radar aceita cabeçalhos autorais no eixo e no máximo', () => {
    const table = buildChartTable({
      type: 'radar',
      radarAxes: [{ label: 'SEO', max: 100 }],
      series: [{ name: 'Antes', data: [88] }],
      categoryLabel: 'Eixo',
      maxLabel: 'Teto',
    });
    expect(table.header).toEqual(['Eixo', 'Teto', 'Antes']);
  });

  it('sem eixos declarados, o radar divide um teto só — o maior valor do conjunto', () => {
    // Derivar um teto POR eixo faria todo vértice encostar no anel de fora
    // quando há uma série só: correto na aritmética, vazio na leitura. O teto
    // compartilhado é uma escala de verdade, e é ele que a coluna escreve.
    const table = buildChartTable({
      type: 'radar',
      xAxis: ['Jan', 'Feb', 'Mar'],
      series: [{ name: 'Desktop', data: [186, 305, 237] }],
    });
    expect(table.header).toEqual(['Categoria', 'Máximo', 'Desktop']);
    expect(table.lines).toEqual([
      ['Jan', '305', '186'],
      ['Feb', '305', '305'],
      ['Mar', '305', '237'],
    ]);
  });

  it('no radar, série mais curta que os eixos deixa a célula vazia', () => {
    // Mesma regra da tabela cartesiana: o eixo existe e aquela série não o
    // preenche. Apagar a linha esconderia o valor das OUTRAS séries junto.
    const table = buildChartTable({
      type: 'radar',
      radarAxes: [
        { label: 'Desempenho', max: 100 },
        { label: 'SEO', max: 100 },
      ],
      series: [
        { name: 'Antes', data: [72, 88] },
        { name: 'Depois', data: [94] },
      ],
    });
    expect(table.lines).toEqual([
      ['Desempenho', '100', '72', '94'],
      ['SEO', '100', '88', '—'],
    ]);
  });

  it('a dispersão escreve uma linha por PONTO, com a série na primeira coluna', () => {
    const table = buildChartTable({
      type: 'scatter',
      series: [
        { name: 'Grupo 1', points: [[1.5, 2], [3, 4.25]] },
        { name: 'Grupo 2', points: [[8, 5]] },
      ],
    });
    expect(table.header).toEqual(['Série', 'X', 'Y']);
    // Uma linha por ponto, na ordem das séries — não um resumo por grupo: o
    // resumo descreveria a nuvem, e a tabela precisa carregá-la.
    expect(table.lines).toEqual([
      ['Grupo 1', '1.5', '2'],
      ['Grupo 1', '3', '4.25'],
      ['Grupo 2', '8', '5'],
    ]);
  });

  it('a dispersão aceita cabeçalhos autorais nas três colunas', () => {
    const table = buildChartTable({
      type: 'scatter',
      seriesLabel: 'Grupo',
      xLabel: 'Minutos na página',
      yLabel: 'Páginas vistas',
      series: [{ name: 'Grupo 1', points: [[2, 3]] }],
    });
    expect(table.header).toEqual(['Grupo', 'Minutos na página', 'Páginas vistas']);
  });

  it('série de dispersão sem ponto nenhum não inventa linha', () => {
    const table = buildChartTable({
      type: 'scatter',
      series: [
        { name: 'Grupo 1', points: [[1, 2]] },
        { name: 'Vazio', points: [] },
      ],
    });
    expect(table.lines).toEqual([['Grupo 1', '1', '2']]);
  });

  it('a rosca aninhada traz o grupo e a categoria, uma linha por ponto', () => {
    const canais = [
      { label: 'Orgânica', value: 300, group: 'Busca' },
      { label: 'Paga', value: 100, group: 'Busca' },
      { label: 'Instagram', value: 200, group: 'Social' },
      { label: 'LinkedIn', value: 150, group: 'Social' },
      { label: 'App', value: 250, group: 'Direto' },
    ];
    const table = buildChartTable({ type: 'pie-nest', data: canais });
    expect(table.header).toEqual(['Grupo', 'Categoria', 'Valor', 'Participação']);
    // Uma linha por ponto do anel EXTERNO. O grupo não ganha linha própria
    // porque a participação dele é DERIVÁVEL — soma das participações dos
    // pontos, que estão na mesma coluna. Foi o teste que o radar não passou.
    expect(table.lines).toEqual([
      ['Busca', 'Orgânica', '300', '30%'],
      ['Busca', 'Paga', '100', '10%'],
      ['Social', 'Instagram', '200', '20%'],
      ['Social', 'LinkedIn', '150', '15%'],
      ['Direto', 'App', '250', '25%'],
    ]);
  });

  it('a rosca aninhada aceita cabeçalhos autorais nas quatro colunas', () => {
    const table = buildChartTable({
      type: 'pie-nest',
      groupLabel: 'Canal',
      categoryLabel: 'Origem',
      valueLabel: 'Sessões',
      shareLabel: 'Fatia',
      data: [{ label: 'Orgânica', value: 1, group: 'Busca' }],
    });
    expect(table.header).toEqual(['Canal', 'Origem', 'Sessões', 'Fatia']);
  });

  it('ponto sem grupo vira grupo de si mesmo, e o total não muda', () => {
    const table = buildChartTable({
      type: 'pie-nest',
      data: [
        { label: 'Orgânica', value: 300, group: 'Busca' },
        { label: 'Avulso', value: 100 },
      ],
    });
    expect(table.lines).toEqual([
      ['Busca', 'Orgânica', '300', '75%'],
      ['Avulso', 'Avulso', '100', '25%'],
    ]);
  });
});

describe('buildChartOption — rosca aninhada', () => {
  const canais = [
    { label: 'Orgânica', value: 300, group: 'Busca' },
    { label: 'Paga', value: 100, group: 'Busca' },
    { label: 'Instagram', value: 200, group: 'Social' },
    { label: 'LinkedIn', value: 150, group: 'Social' },
    { label: 'App', value: 250, group: 'Direto' },
  ];
  const rings = (opts: Parameters<typeof buildChartOption>[0]) =>
    (buildChartOption(opts) as { series: { data: { name: string; value: number }[] }[] }).series;

  it('o anel de dentro é DERIVADO: um arco por grupo, com a soma dos pontos', () => {
    const [inner, outer] = rings({ type: 'pie-nest', data: canais });
    expect(inner.data).toEqual([
      { name: 'Busca', value: 400 },
      { name: 'Social', value: 350 },
      { name: 'Direto', value: 250 },
    ]);
    expect(outer.data.map((d) => d.name)).toEqual(
      ['Orgânica', 'Paga', 'Instagram', 'LinkedIn', 'App'],
    );
  });

  it('a ordem do anel de dentro é a de PRIMEIRA APARIÇÃO, não a de tamanho', () => {
    // É esta ordem que faz cada fatia externa cair dentro do arco do seu
    // grupo. O caso que separa uma regra da outra é um grupo PEQUENO declarado
    // antes de um grande: por tamanho ele iria para o fim, e o alinhamento
    // angular com o anel de fora quebraria.
    const [inner] = rings({
      type: 'pie-nest',
      data: [
        { label: 'a', value: 1, group: 'Pequeno' },
        { label: 'b', value: 99, group: 'Grande' },
      ],
    });
    expect(inner.data.map((d) => d.name)).toEqual(['Pequeno', 'Grande']);
  });

  it('os dois anéis somam o MESMO total — é o que garante o alinhamento', () => {
    // O invariante que sustenta o desenho: mesma soma e mesma ordem fazem cada
    // fatia externa cair no vão angular do seu grupo. É a POSIÇÃO que comunica
    // a hierarquia, e não a cor — que aqui repete entre os anéis, porque as
    // duas séries leem a mesma paleta desde o índice zero.
    const [inner, outer] = rings({ type: 'pie-nest', data: canais });
    const total = (d: { value: number }[]) => d.reduce((n, x) => n + x.value, 0);
    expect(total(inner.data)).toBe(total(outer.data));
  });

  it('sem dado, a rosca aninhada não inventa arco', () => {
    const [inner, outer] = rings({ type: 'pie-nest', data: [] });
    expect(inner.data).toEqual([]);
    expect(outer.data).toEqual([]);
  });
});

describe('buildChartTable — casos de borda', () => {
  it('sem dado nenhum, a tabela nasce sem linha', () => {
    expect(buildChartTable({}).lines).toEqual([]);
    expect(buildChartTable({ type: 'funnel' }).lines).toEqual([]);
    expect(buildChartTable({ type: 'radar' }).lines).toEqual([]);
  });
});
