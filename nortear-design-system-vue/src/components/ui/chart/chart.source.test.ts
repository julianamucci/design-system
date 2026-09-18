import { describe, expect, it } from 'vitest';
import {
  chartAreaSource,
  chartBarSource,
  chartWithCardSource,
  chartWithDicaSource,
  chartWithCaptionSource,
  chartContrastSource,
  chartDuasSeriesSource,
  chartLineSource,
  chartMultiSerieSource,
  chartFunnelSource,
  chartPieSource,
  chartRadarSource,
  chartSerieUnicaSource,
  chartSource,
  designChartTitleSource,
  themeChartTokensSource,
  chartEmptySource,
} from './chart.source';

describe('chartSource', () => {
  it('sem args, entrega o SFC do Playground com a altura do control', () => {
    expect(chartSource()).toBe(
      `<script setup lang="ts">
import { ChartContainer, buildBarOption } from '@/components/ui/chart'

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
const series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }]
</script>

<template>
  <ChartContainer
    :option="buildBarOption({ xAxis: meses, series })"
    :height="300"
    aria-label="Acessos mensais no desktop, de janeiro a junho"
  />
</template>`,
    );
  });

  it('acompanha os controls de altura, desenhador e frase de vazio', () => {
    const output = chartSource('', {
      args: { height: 420, renderer: 'canvas', emptyLabel: 'Nada no período.' },
    });
    expect(output).toContain(':height="420"');
    expect(output).toContain('renderer="canvas"');
    expect(output).toContain('empty-label="Nada no período."');
  });

  it('não escreve o desenhador nem a frase padrão — repetir padrão ensina ruído', () => {
    const output = chartSource('', { args: { renderer: 'svg', emptyLabel: 'Sem dados para exibir' } });
    expect(output).not.toContain('renderer=');
    expect(output).not.toContain('empty-label=');
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const output = chartSource('', {
      args: {
        renderer: (() => {}) as never,
        emptyLabel: (() => {}) as never,
        height: (() => {}) as never,
      },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('renderer=');
    expect(output).not.toContain('empty-label=');
    // `Number(fn)` daria `NaN`, escrito no painel como se fosse exemplo; a
    // altura cai na do Playground em vez de virar lixo.
    expect(output).not.toContain('NaN');
    expect(output).toContain(':height="300"');
  });

  it('o rótulo do desenho não sai do snippet — role="img" mudo é violação de axe', () => {
    expect(chartSource()).toContain('aria-label="Acessos mensais no desktop, de janeiro a junho"');
  });
});

describe('transforms das stories de variante', () => {
  it('cada tipo de gráfico importa e chama o seu próprio builder', () => {
    expect(chartBarSource()).toContain(':option="buildBarOption({ xAxis: meses, series })"');
    expect(chartLineSource()).toContain(':option="buildLineOption({ xAxis: meses, series })"');
    expect(chartAreaSource()).toContain(':option="buildAreaOption({ xAxis: meses, series })"');
    expect(chartLineSource()).toContain(
      `import { ChartContainer, buildLineOption } from '@/components/ui/chart'`,
    );
  });

  it('a pizza recebe pontos rotulados, não eixo mais série', () => {
    const output = chartPieSource();
    expect(output).toContain(':option="buildPieOption({ data: dispositivos })"');
    expect(output).toContain(`{ label: 'Desktop', value: 580 },`);
    expect(output).not.toContain('xAxis');
  });

  it('o funil recebe pares de rótulo e valor, na ordem das etapas', () => {
    const output = chartFunnelSource();
    expect(output).toContain(':option="buildFunnelOption({ data: etapas })"');
    expect(output).toContain(`{ label: 'Visitas', value: 4000 },`);
    // Sem eixo: aqui não há categoria contínua, há uma ordem de etapas.
    expect(output).not.toContain('xAxis');
  });

  it('o radar traz as DUAS listas — os eixos com teto e as séries na ordem deles', () => {
    const output = chartRadarSource();
    expect(output).toContain(`:option="buildRadarOption({ axes: eixos, series: medicoes })"`);
    // O teto é a única informação do radar que não está em nenhum outro lugar:
    // sem ele, o vértice na tela não tem denominador.
    expect(output).toContain(`{ label: 'Boas práticas', max: 10 },`);
    expect(output).toContain(`{ name: 'Antes', data: [72, 64, 6, 88, 2] },`);
    // A primeira coluna da tabela nomeia o EIXO, e a segunda traz o teto dele.
    expect(output).toContain(`category-label="Eixo"`);
    expect(output).toContain(`max-label="Máximo"`);
    // Sem eixo cartesiano: as grandezas não são categorias de um eixo x.
    expect(output).not.toContain('xAxis');
  });

  it('a linha e a área trazem a segunda série — é ela que faz nascer a legenda', () => {
    for (const output of [chartLineSource(), chartAreaSource()]) {
      expect(output).toContain(`{ name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },`);
    }
    // A de barras é de série única: a legenda não teria o que comparar.
    expect(chartBarSource()).not.toContain('Mobile');
  });
});

describe('transforms das stories de composição', () => {
  it('o card é o componente da biblioteca, e o gráfico mora dentro dele', () => {
    const output = chartWithCardSource();
    expect(output).toContain(`} from '@/components/ui/card'`);
    expect(output).toContain('<Card class="nds-w-sm">');
    // O aninhamento é a lição: o gráfico entra recuado dentro do conteúdo do
    // card, e não ao lado dele.
    expect(output).toMatch(/ {4}<CardContent>\n {6}<ChartContainer\n/);
    expect(output).toMatch(/ {6}\/>\n {4}<\/CardContent>\n {2}<\/Card>/);
  });

  it('o título no desenho dispensa o rótulo autoral — a ausência é o assunto', () => {
    const output = designChartTitleSource();
    expect(output).toContain(`title: 'Vendas mensais'`);
    expect(output).not.toContain('aria-label=');
    expect(output).toContain('class="nds-max-w-lg"');
  });
});

describe('transforms das stories de configuração', () => {
  it('a dica não tem prop a ligar — o builder já declara o tooltip', () => {
    const output = chartWithDicaSource();
    expect(output).toContain(`const meses = ['Jan', 'Fev', 'Mar', 'Abr']`);
    expect(output).not.toContain('tooltip');
  });

  it('a legenda automática vem de três séries, e a multi-série leva título no option', () => {
    expect(chartWithCaptionSource()).toContain(`{ name: 'Tablet', data: [40, 90, 60, 100] },`);
    expect(chartMultiSerieSource()).toContain(`title: 'Acessos por dispositivo'`);
    // O título mora dentro do option, não num elemento em volta.
    expect(chartMultiSerieSource()).not.toContain('<CardTitle>');
  });
});

describe('transforms das stories de estado', () => {
  it('o vazio não tem dado, não tem rótulo de imagem e traz a frase completa', () => {
    const output = chartEmptySource();
    expect(output).toContain(':option="buildBarOption({ data: [] })"');
    expect(output).toContain('empty-label="Nenhum dado disponível para o período selecionado."');
    // Sem desenho não há imagem a nomear: o container larga o `role="img"`.
    expect(output).not.toContain('aria-label=');
    expect(output).not.toContain('const series');
  });

  it('série única e duas séries diferem só no dado — e é aí que está a lição', () => {
    expect(chartSerieUnicaSource()).not.toContain('Mobile');
    expect(chartDuasSeriesSource()).toContain(`{ name: 'Mobile', data: [80, 200, 120, 190] },`);
  });

  it('os tokens de tema empilham dois containers, sem prop de tema a passar', () => {
    const output = themeChartTokensSource();
    expect(output).toContain('<div class="nds-stack">');
    expect(output.match(/<ChartContainer/g)).toHaveLength(2);
    expect(output).toContain('buildBarOption({ xAxis: meses, series })');
    expect(output).toContain('buildLineOption({ xAxis: meses, series })');
    expect(output).not.toContain('theme');
  });

  it('o contraste mede forma de dado, então a série é única', () => {
    const output = chartContrastSource();
    expect(output).not.toContain('Mobile');
    expect(output).toContain(':height="260"');
  });
});
