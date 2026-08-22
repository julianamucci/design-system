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
  chartPieSource,
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
    const saida = chartSource('', {
      args: { height: 420, renderer: 'canvas', emptyLabel: 'Nada no período.' },
    });
    expect(saida).toContain(':height="420"');
    expect(saida).toContain('renderer="canvas"');
    expect(saida).toContain('empty-label="Nada no período."');
  });

  it('não escreve o desenhador nem a frase padrão — repetir padrão ensina ruído', () => {
    const saida = chartSource('', { args: { renderer: 'svg', emptyLabel: 'Sem dados para exibir' } });
    expect(saida).not.toContain('renderer=');
    expect(saida).not.toContain('empty-label=');
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const saida = chartSource('', {
      args: {
        renderer: (() => {}) as never,
        emptyLabel: (() => {}) as never,
        height: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('renderer=');
    expect(saida).not.toContain('empty-label=');
    // `Number(fn)` daria `NaN`, escrito no painel como se fosse exemplo; a
    // altura cai na do Playground em vez de virar lixo.
    expect(saida).not.toContain('NaN');
    expect(saida).toContain(':height="300"');
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
    const saida = chartPieSource();
    expect(saida).toContain(':option="buildPieOption({ data: dispositivos })"');
    expect(saida).toContain(`{ label: 'Desktop', value: 580 },`);
    expect(saida).not.toContain('xAxis');
  });

  it('a linha e a área trazem a segunda série — é ela que faz nascer a legenda', () => {
    for (const saida of [chartLineSource(), chartAreaSource()]) {
      expect(saida).toContain(`{ name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },`);
    }
    // A de barras é de série única: a legenda não teria o que comparar.
    expect(chartBarSource()).not.toContain('Mobile');
  });
});

describe('transforms das stories de composição', () => {
  it('o card é o componente da biblioteca, e o gráfico mora dentro dele', () => {
    const saida = chartWithCardSource();
    expect(saida).toContain(`} from '@/components/ui/card'`);
    expect(saida).toContain('<Card class="nds-w-sm">');
    // O aninhamento é a lição: o gráfico entra recuado dentro do conteúdo do
    // card, e não ao lado dele.
    expect(saida).toMatch(/ {4}<CardContent>\n {6}<ChartContainer\n/);
    expect(saida).toMatch(/ {6}\/>\n {4}<\/CardContent>\n {2}<\/Card>/);
  });

  it('o título no desenho dispensa o rótulo autoral — a ausência é o assunto', () => {
    const saida = designChartTitleSource();
    expect(saida).toContain(`title: 'Vendas mensais'`);
    expect(saida).not.toContain('aria-label=');
    expect(saida).toContain('class="nds-max-w-lg"');
  });
});

describe('transforms das stories de configuração', () => {
  it('a dica não tem prop a ligar — o builder já declara o tooltip', () => {
    const saida = chartWithDicaSource();
    expect(saida).toContain(`const meses = ['Jan', 'Fev', 'Mar', 'Abr']`);
    expect(saida).not.toContain('tooltip');
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
    const saida = chartEmptySource();
    expect(saida).toContain(':option="buildBarOption({ data: [] })"');
    expect(saida).toContain('empty-label="Nenhum dado disponível para o período selecionado."');
    // Sem desenho não há imagem a nomear: o container larga o `role="img"`.
    expect(saida).not.toContain('aria-label=');
    expect(saida).not.toContain('const series');
  });

  it('série única e duas séries diferem só no dado — e é aí que está a lição', () => {
    expect(chartSerieUnicaSource()).not.toContain('Mobile');
    expect(chartDuasSeriesSource()).toContain(`{ name: 'Mobile', data: [80, 200, 120, 190] },`);
  });

  it('os tokens de tema empilham dois containers, sem prop de tema a passar', () => {
    const saida = themeChartTokensSource();
    expect(saida).toContain('<div class="nds-stack">');
    expect(saida.match(/<ChartContainer/g)).toHaveLength(2);
    expect(saida).toContain('buildBarOption({ xAxis: meses, series })');
    expect(saida).toContain('buildLineOption({ xAxis: meses, series })');
    expect(saida).not.toContain('theme');
  });

  it('o contraste mede forma de dado, então a série é única', () => {
    const saida = chartContrastSource();
    expect(saida).not.toContain('Mobile');
    expect(saida).toContain(':height="260"');
  });
});
