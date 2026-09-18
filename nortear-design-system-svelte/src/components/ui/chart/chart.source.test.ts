import { describe, expect, it } from 'vitest';
import {
  chartAreaSource,
  chartBarrasSource,
  chartWithCaptionSource,
  chartWithTitleSource,
  chartDoisTypesSource,
  chartEmCardSource,
  chartLinesSource,
  chartMultiSerieSource,
  chartPizzaSource,
  chartFunnelSource,
  chartRadarSource,
  chartSource,
  designChartTitleSource,
  chartEmptySource,
} from './chart.source';

describe('chartSource', () => {
  it('sem args, entrega o desenho de barras com o rótulo de acessibilidade', () => {
    expect(chartSource()).toBe(
      `<script lang="ts">
  import { ChartContainer, buildBarOption } from "@/components/ui/chart";

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const series = [{ name: 'Vendas', data: [186, 305, 237, 73, 209, 214] }];
</script>

<ChartContainer
  option={buildBarOption({ xAxis: meses, series })}
  aria-label="Acessos mensais no desktop, de janeiro a junho"
/>`,
    );
  });

  it('acompanha os controls de altura e de classe', () => {
    const output = chartSource('', { args: { height: 300, class: 'nds-w-full' } });
    expect(output).toContain('height={300}');
    expect(output).toContain('class="nds-w-full"');
  });

  it('só escreve o renderer quando ele difere do padrão', () => {
    expect(chartSource('', { args: { renderer: 'svg' } })).not.toContain('renderer');
    expect(chartSource('', { args: { renderer: 'canvas' } })).toContain('renderer="canvas"');
  });

  it('só escreve a frase do estado vazio quando ela é autoral', () => {
    expect(chartSource('', { args: { emptyLabel: 'Sem dados para exibir' } })).not.toContain(
      'emptyLabel',
    );
    expect(chartSource('', { args: { emptyLabel: 'Nenhum acesso no período.' } })).toContain(
      'emptyLabel="Nenhum acesso no período."',
    );
  });

  it('o rótulo autoral substitui o padrão sem nunca sumir', () => {
    expect(chartSource('', { args: { 'aria-label': 'Vendas do trimestre' } })).toContain(
      'aria-label="Vendas do trimestre"',
    );
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('cada tipo de desenho importa e chama o próprio montador', () => {
    expect(chartBarrasSource()).toContain('option={buildBarOption({ xAxis: meses, series })}');
    expect(chartLinesSource()).toContain('option={buildLineOption({ xAxis: meses, series })}');
    expect(chartAreaSource()).toContain('option={buildAreaOption({ xAxis: meses, series })}');
    expect(chartPizzaSource()).toContain('option={buildPieOption({ data: dispositivos })}');
    expect(chartFunnelSource()).toContain('option={buildFunnelOption({ data: etapas })}');
    expect(chartRadarSource()).toContain('option={buildRadarOption({ axes: eixos, series: medicoes })}');
  });

  it('o funil ensina o rótulo da coluna de participação junto do desenho', () => {
    // Sem `shareLabel` a tabela sai com o rótulo padrão do container, que não
    // acompanha o idioma da página — e quem copia o snippet adota o que leu.
    const output = chartFunnelSource();
    expect(output).toContain('shareLabel="Participação"');
    expect(output).toContain("{ label: 'Visitas', value: 1000 },");
    // A entrada vem primeiro: a ordem da lista é o percurso, e é a primeira
    // linha que serve de referência à participação.
    expect(output.indexOf("'Visitas'")).toBeLessThan(output.indexOf("'Compra'"));
  });

  it('o radar traz as DUAS listas — os eixos com teto e as séries na ordem deles', () => {
    const output = chartRadarSource();
    // O teto é a única informação do radar que não está em nenhum outro lugar:
    // sem ele, o vértice na tela não tem denominador.
    expect(output).toContain("{ label: 'Boas práticas', max: 10 },");
    expect(output).toContain("{ name: 'Antes', data: [72, 64, 6, 88, 2] },");
    // A primeira coluna da tabela nomeia o EIXO, e a segunda traz o teto dele.
    expect(output).toContain('categoryLabel="Eixo"');
    expect(output).toContain('maxLabel="Máximo"');
    // Sem eixo cartesiano: as grandezas não são categorias de um eixo x.
    expect(output).not.toContain('xAxis');
  });

  it('o estado vazio não escreve rótulo de imagem — a frase é o conteúdo', () => {
    const output = chartEmptySource();
    expect(output).toContain('option={buildBarOption({ data: [] })}');
    expect(output).toContain('emptyLabel="Nenhum dado disponível para o período selecionado."');
    expect(output).not.toContain('aria-label');
  });

  it('a multi-série traz as três séries no mesmo objeto de configuração', () => {
    const output = chartMultiSerieSource();
    expect(output).toContain("{ name: 'Desktop', data: [186, 305, 237, 73] }");
    expect(output).toContain("{ name: 'Tablet', data: [40, 90, 60, 100] }");
  });

  it('a legenda forçada aparece dentro do objeto de configuração', () => {
    expect(chartWithCaptionSource()).toContain('showLegend: true');
  });

  it('os dois títulos ficam no objeto de configuração, não numa prop do container', () => {
    expect(chartWithTitleSource()).toContain("title: 'Acessos por dispositivo'");
    expect(designChartTitleSource()).toContain("title: 'Vendas mensais'");
  });

  it('o título no desenho dispensa o rótulo autoral, e a story diz por quê', () => {
    expect(designChartTitleSource()).not.toContain('aria-label');
  });

  it('a composição em card importa o Card junto do container', () => {
    const output = chartEmCardSource();
    expect(output).toContain('from "@/components/ui/card"');
    expect(output).toContain('<CardTitle>Acessos mensais</CardTitle>');
    expect(output).toContain('height={200}');
  });

  it('a story de tema empilha os dois tipos com um só conjunto de dados', () => {
    const output = chartDoisTypesSource();
    expect(output).toContain('import { ChartContainer, buildBarOption, buildLineOption }');
    expect(output.match(/<ChartContainer/g)).toHaveLength(2);
    expect(output).toContain('<div class="nds-stack nds-w-full">');
  });
});
