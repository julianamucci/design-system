import { describe, expect, it } from 'vitest';
import {
  chartAreaSource,
  chartWithTitleSource,
  chartDoisDesenhosSource,
  chartEmCardSource,
  chartFunnelSource,
  chartLineSource,
  chartMultiSerieSource,
  chartPizzaSource,
  chartRadarSource,
  chartSerieUnicaSource,
  chartSource,
  chartTitleNoLabelSource,
  chartEmptySource,
  chartVisibleDataSource,
} from './chart.source';

const ALL = [
  chartSource,
  chartLineSource,
  chartAreaSource,
  chartPizzaSource,
  chartFunnelSource,
  chartRadarSource,
  chartMultiSerieSource,
  chartWithTitleSource,
  chartTitleNoLabelSource,
  chartSerieUnicaSource,
  chartEmptySource,
  chartEmCardSource,
  chartDoisDesenhosSource,
  chartVisibleDataSource,
];

describe('chartSource', () => {
  it('ensina a importação do design system e o construtor que a chamada usa', () => {
    const output = chartSource();
    expect(output).toContain(
      'import { ChartContainer, buildBarOption } from "@/components/ui/chart";',
    );
    expect(output).toContain('option={buildBarOption({ xAxis: meses, series })}');
  });

  it('declara os dados que a chamada referencia — o trecho cola inteiro', () => {
    const output = chartSource();
    expect(output).toContain('const meses = [');
    expect(output).toContain('const series = [');
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
      const output = chartSource(undefined, { args: args as never });
      expect(output).not.toContain('aria-label=""');
      expect(output).toContain('aria-label="Acessos mensais no desktop, de janeiro a junho"');
    }
  });

  it('respeita o rótulo escolhido no control', () => {
    const output = chartSource(undefined, { args: { 'aria-label': 'Vendas por trimestre' } });
    expect(output).toContain('aria-label="Vendas por trimestre"');
  });

  it('omite o renderizador e a frase de vazio quando estão no padrão', () => {
    const output = chartSource(undefined, {
      args: { renderer: 'svg', emptyLabel: 'Sem dados para exibir' },
    });
    expect(output).not.toContain('renderer=');
    expect(output).not.toContain('emptyLabel=');
  });

  it('escreve renderizador e frase de vazio quando diferem do padrão', () => {
    const output = chartSource(undefined, {
      args: { renderer: 'canvas', emptyLabel: 'Nada por aqui ainda.' },
    });
    expect(output).toContain('renderer="canvas"');
    expect(output).toContain('emptyLabel="Nada por aqui ainda."');
  });

  it('não inventa renderizador fora da união', () => {
    const output = chartSource(undefined, { args: { renderer: 'webgl' as never } });
    expect(output).not.toContain('webgl');
  });

  it('a altura é número, e cai no padrão quando o control não entrega um', () => {
    expect(chartSource(undefined, { args: { height: 420 } })).toContain('height={420}');
    expect(chartSource()).toContain('height={300}');
    expect(chartSource(undefined, { args: { height: 'alto' as never } })).toContain('height={300}');
  });

  it('a tabela à vista só entra no snippet quando o control a LIGA', () => {
    // A tabela é emitida sempre; a entrada decide se ela aparece. Escrever
    // `showData={false}` no padrão ensinaria que a alternativa textual depende
    // dela — e quem copiasse o trecho acharia que desligá-la a remove.
    expect(chartSource(undefined, { args: { showData: false } })).not.toContain('showData');
    expect(chartSource()).not.toContain('showData');
    expect(chartSource(undefined, { args: { showData: true } })).toContain('showData');
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
    expect(chartLineSource()).toContain('option={buildLineOption({ xAxis: meses, series })}');
    expect(chartAreaSource()).toContain('option={buildAreaOption({ xAxis: meses, series })}');
    expect(chartLineSource()).not.toContain('buildBarOption');
    expect(chartAreaSource()).not.toContain('buildBarOption');
  });

  it('a pizza recebe outra FORMA de dado — pares de rótulo e valor, sem eixo', () => {
    const output = chartPizzaSource();
    expect(output).toContain('option={buildPieOption({ data: dados })}');
    expect(output).toContain('{ label: "Desktop", value: 1224 }');
    expect(output).not.toContain('xAxis');
  });

  it('o funil recebe pares de rótulo e valor, na ordem das etapas', () => {
    const output = chartFunnelSource();
    expect(output).toContain('option={buildFunnelOption({ data: etapas })}');
    expect(output).toContain('{ label: "Visitas", value: 4000 }');
    // Sem eixo: aqui não há categoria contínua, há uma ordem de etapas.
    expect(output).not.toContain('xAxis');
  });

  it('o radar traz as DUAS listas — os eixos com teto e as séries na ordem deles', () => {
    const output = chartRadarSource();
    expect(output).toContain('option={buildRadarOption({ axes: eixos, series: medicoes })}');
    // O teto é a única informação do radar que não está em nenhum outro lugar:
    // sem ele, o vértice na tela não tem denominador.
    expect(output).toContain('{ label: "Boas práticas", max: 10 }');
    expect(output).toContain('{ name: "Antes", data: [72, 64, 6, 88, 2] }');
    // A primeira coluna da tabela nomeia o EIXO, e a segunda traz o teto dele.
    expect(output).toContain('categoryLabel="Eixo"');
    expect(output).toContain('maxLabel="Máximo"');
    // Sem eixo cartesiano: as grandezas não são categorias de um eixo x.
    expect(output).not.toContain('xAxis');
  });

  it('a legenda nasce da pluralidade das séries, não de uma bandeira', () => {
    const output = chartMultiSerieSource();
    expect(output).toContain('{ name: "Desktop"');
    expect(output).toContain('{ name: "Mobile"');
    expect(output).toContain('{ name: "Tablet"');
    expect(output).not.toContain('showLegend');
  });

  it('com uma série só a legenda some — e nada no snippet a desliga', () => {
    const output = chartSerieUnicaSource();
    expect(output).toContain('buildLineOption');
    expect(output).not.toContain('{ name: "Mobile"');
    expect(output).not.toContain('showLegend');
  });
});

describe('rótulo e título', () => {
  it('título no desenho e rótulo autoral convivem — são textos de papéis distintos', () => {
    const output = chartWithTitleSource();
    expect(output).toContain('title: "Acessos por dispositivo"');
    expect(output).toContain('aria-label="Acessos por dispositivo, de janeiro a junho"');
  });

  it('sem rótulo autoral, a ausência é o assunto — o container cai no título', () => {
    const output = chartTitleNoLabelSource();
    expect(output).toContain('title: "Vendas mensais"');
    expect(output).not.toContain('aria-label');
  });

  it('dois desenhos na mesma tela carregam um rótulo cada', () => {
    const output = chartDoisDesenhosSource();
    const rotulos = [...output.matchAll(/aria-label="([^"]+)"/g)].map(([, text]) => text);
    expect(rotulos.length).toBe(2);
    expect(new Set(rotulos).size).toBe(2);
    expect(output).toContain('buildBarOption');
    expect(output).toContain('buildLineOption');
  });
});

describe('estados e composição', () => {
  it('o estado vazio traz a frase e NENHUMA altura — quem segura o bloco é o piso', () => {
    const output = chartEmptySource();
    expect(output).toContain('series: []');
    expect(output).toContain('emptyLabel="Nenhum dado disponível para o período selecionado."');
    expect(output).not.toContain('height=');
    // Sem desenho o container não se anuncia como imagem: a frase É o conteúdo,
    // e um rótulo genérico a esconderia. Nada no snippet força o contrário.
    expect(output).not.toContain('aria-label');
    expect(output).not.toContain('role=');
  });

  it('a tabela à vista aparece escrita na chamada — a entrada é o assunto', () => {
    const output = chartVisibleDataSource();
    expect(output).toContain('showData');
    // O rótulo continua obrigatório: ele é a `<caption>` da tabela, não só o
    // nome acessível do desenho.
    expect(output).toContain('aria-label="Acessos mensais por dispositivo');
  });

  it('nenhum outro snippet liga a tabela à vista — o padrão é escondida', () => {
    for (const fn of ALL) {
      if (fn === chartVisibleDataSource) continue;
      expect(fn()).not.toContain('showData');
    }
  });

  it('no Card o gráfico fica DENTRO do corpo, e a altura é do gráfico', () => {
    const output = chartEmCardSource();
    expect(output).toContain('} from "@/components/ui/card";');
    const body = output.indexOf('<CardContent>');
    const grafico = output.indexOf('<ChartContainer');
    expect(grafico).toBeGreaterThan(body);
    expect(grafico).toBeLessThan(output.indexOf('</CardContent>'));
    expect(output).toContain('<Card className="nds-max-w-lg">');
    expect(output).toContain('<CardTitle as="h3">');
  });
});

describe('nenhum snippet ensina o andaime da story', () => {
  it('todos falam só do design system e das dependências reais', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('desenhoPronto');
      expect(output).not.toContain('chart-probe');
      expect(output).toContain('@/components/ui/chart');
    }
  });
});
