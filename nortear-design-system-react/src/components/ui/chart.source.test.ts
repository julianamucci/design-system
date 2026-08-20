import { describe, expect, it } from 'vitest';
import {
  chartAreaSource,
  chartComTituloSource,
  chartDoisDesenhosSource,
  chartEmCardSource,
  chartLinhaSource,
  chartMultiSerieSource,
  chartPizzaSource,
  chartSerieUnicaSource,
  chartSource,
  chartTituloSemRotuloSource,
  chartVazioSource,
} from './chart.source';

const TODAS = [
  chartSource,
  chartLinhaSource,
  chartAreaSource,
  chartPizzaSource,
  chartMultiSerieSource,
  chartComTituloSource,
  chartTituloSemRotuloSource,
  chartSerieUnicaSource,
  chartVazioSource,
  chartEmCardSource,
  chartDoisDesenhosSource,
];

describe('chartSource', () => {
  it('ensina a importação do design system e o construtor que a chamada usa', () => {
    const saida = chartSource();
    expect(saida).toContain(
      'import { ChartContainer, buildBarOption } from "@/components/ui/chart";',
    );
    expect(saida).toContain('option={buildBarOption({ xAxis: meses, series })}');
  });

  it('declara os dados que a chamada referencia — o trecho cola inteiro', () => {
    const saida = chartSource();
    expect(saida).toContain('const meses = [');
    expect(saida).toContain('const series = [');
  });

  /**
   * A transform anterior vivia inline no `meta` e exigia `ctx`: chamada sem
   * args ela lançava, e por isso nenhuma guarda executável a alcançava.
   */
  it('é chamável sem nenhum argumento', () => {
    expect(typeof chartSource()).toBe('string');
    expect(chartSource().length).toBeGreaterThan(0);
  });

  /**
   * O outro defeito da transform inline: `aria-label="${args['aria-label'] ??
   * ''}"` escrevia o atributo VAZIO quando o control era limpo. Rótulo vazio é
   * pior que rótulo ausente — o container deriva o dele do título do desenho, e
   * um atributo vazio bloqueia essa rede de segurança.
   */
  it('nunca escreve um rótulo vazio', () => {
    for (const args of [{}, { 'aria-label': '' }, { 'aria-label': '   ' }]) {
      const saida = chartSource(undefined, { args: args as never });
      expect(saida).not.toContain('aria-label=""');
      expect(saida).toContain('aria-label="Acessos mensais no desktop, de janeiro a junho"');
    }
  });

  it('respeita o rótulo escolhido no control', () => {
    const saida = chartSource(undefined, { args: { 'aria-label': 'Vendas por trimestre' } });
    expect(saida).toContain('aria-label="Vendas por trimestre"');
  });

  it('omite o renderizador e a frase de vazio quando estão no padrão', () => {
    const saida = chartSource(undefined, {
      args: { renderer: 'svg', emptyLabel: 'Sem dados para exibir' },
    });
    expect(saida).not.toContain('renderer=');
    expect(saida).not.toContain('emptyLabel=');
  });

  it('escreve renderizador e frase de vazio quando diferem do padrão', () => {
    const saida = chartSource(undefined, {
      args: { renderer: 'canvas', emptyLabel: 'Nada por aqui ainda.' },
    });
    expect(saida).toContain('renderer="canvas"');
    expect(saida).toContain('emptyLabel="Nada por aqui ainda."');
  });

  it('não inventa renderizador fora da união', () => {
    const saida = chartSource(undefined, { args: { renderer: 'webgl' as never } });
    expect(saida).not.toContain('webgl');
  });

  it('a altura é número, e cai no padrão quando o control não entrega um', () => {
    expect(chartSource(undefined, { args: { height: 420 } })).toContain('height={420}');
    expect(chartSource()).toContain('height={300}');
    expect(chartSource(undefined, { args: { height: 'alto' as never } })).toContain('height={300}');
  });

  it('a classe só entra quando existe — string vazia não vira atributo', () => {
    expect(chartSource(undefined, { args: { className: '' } })).not.toContain('className=');
    expect(chartSource(undefined, { args: { className: 'nds-max-w-lg' } })).toContain(
      'className="nds-max-w-lg"',
    );
  });
});

describe('tipos de desenho', () => {
  it('cada tipo chama o seu construtor, e só importa o que chama', () => {
    expect(chartLinhaSource()).toContain('option={buildLineOption({ xAxis: meses, series })}');
    expect(chartAreaSource()).toContain('option={buildAreaOption({ xAxis: meses, series })}');
    expect(chartLinhaSource()).not.toContain('buildBarOption');
    expect(chartAreaSource()).not.toContain('buildBarOption');
  });

  it('a pizza recebe outra FORMA de dado — pares de rótulo e valor, sem eixo', () => {
    const saida = chartPizzaSource();
    expect(saida).toContain('option={buildPieOption({ data: dados })}');
    expect(saida).toContain('{ label: "Desktop", value: 1224 }');
    expect(saida).not.toContain('xAxis');
  });

  it('a legenda nasce da pluralidade das séries, não de uma bandeira', () => {
    const saida = chartMultiSerieSource();
    expect(saida).toContain('{ name: "Desktop"');
    expect(saida).toContain('{ name: "Mobile"');
    expect(saida).toContain('{ name: "Tablet"');
    expect(saida).not.toContain('showLegend');
  });

  it('com uma série só a legenda some — e nada no snippet a desliga', () => {
    const saida = chartSerieUnicaSource();
    expect(saida).toContain('buildLineOption');
    expect(saida).not.toContain('{ name: "Mobile"');
    expect(saida).not.toContain('showLegend');
  });
});

describe('rótulo e título', () => {
  it('título no desenho e rótulo autoral convivem — são textos de papéis distintos', () => {
    const saida = chartComTituloSource();
    expect(saida).toContain('title: "Acessos por dispositivo"');
    expect(saida).toContain('aria-label="Acessos por dispositivo, de janeiro a junho"');
  });

  it('sem rótulo autoral, a ausência é o assunto — o container cai no título', () => {
    const saida = chartTituloSemRotuloSource();
    expect(saida).toContain('title: "Vendas mensais"');
    expect(saida).not.toContain('aria-label');
  });

  it('dois desenhos na mesma tela carregam um rótulo cada', () => {
    const saida = chartDoisDesenhosSource();
    const rotulos = [...saida.matchAll(/aria-label="([^"]+)"/g)].map(([, texto]) => texto);
    expect(rotulos.length).toBe(2);
    expect(new Set(rotulos).size).toBe(2);
    expect(saida).toContain('buildBarOption');
    expect(saida).toContain('buildLineOption');
  });
});

describe('estados e composição', () => {
  it('o estado vazio traz a frase e NENHUMA altura — quem segura o bloco é o piso', () => {
    const saida = chartVazioSource();
    expect(saida).toContain('series: []');
    expect(saida).toContain('emptyLabel="Nenhum dado disponível para o período selecionado."');
    expect(saida).not.toContain('height=');
    // Sem desenho o container não se anuncia como imagem: a frase É o conteúdo,
    // e um rótulo genérico a esconderia. Nada no snippet força o contrário.
    expect(saida).not.toContain('aria-label');
    expect(saida).not.toContain('role=');
  });

  it('no Card o gráfico fica DENTRO do corpo, e a altura é do gráfico', () => {
    const saida = chartEmCardSource();
    expect(saida).toContain('} from "@/components/ui/card";');
    const corpo = saida.indexOf('<CardContent>');
    const grafico = saida.indexOf('<ChartContainer');
    expect(grafico).toBeGreaterThan(corpo);
    expect(grafico).toBeLessThan(saida.indexOf('</CardContent>'));
    expect(saida).toContain('<Card className="nds-max-w-lg">');
    expect(saida).toContain('<CardTitle as="h3">');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos falam só do design system e das dependências reais', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('desenhoPronto');
      expect(saida).not.toContain('chart-probe');
      expect(saida).toContain('@/components/ui/chart');
    }
  });
});
