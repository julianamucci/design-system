import { describe, expect, it } from 'vitest';
import {
  chartAreaSource,
  chartBarrasSource,
  chartComLegendaSource,
  chartComTituloSource,
  chartDoisTypesSource,
  chartEmCardSource,
  chartLinesSource,
  chartMultiSerieSource,
  chartPizzaSource,
  chartSource,
  chartTituloNoDesenhoSource,
  chartVazioSource,
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
    const saida = chartSource('', { args: { height: 300, class: 'nds-w-full' } });
    expect(saida).toContain('height={300}');
    expect(saida).toContain('class="nds-w-full"');
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
  });

  it('o estado vazio não escreve rótulo de imagem — a frase é o conteúdo', () => {
    const saida = chartVazioSource();
    expect(saida).toContain('option={buildBarOption({ data: [] })}');
    expect(saida).toContain('emptyLabel="Nenhum dado disponível para o período selecionado."');
    expect(saida).not.toContain('aria-label');
  });

  it('a multi-série traz as três séries no mesmo objeto de configuração', () => {
    const saida = chartMultiSerieSource();
    expect(saida).toContain("{ name: 'Desktop', data: [186, 305, 237, 73] }");
    expect(saida).toContain("{ name: 'Tablet', data: [40, 90, 60, 100] }");
  });

  it('a legenda forçada aparece dentro do objeto de configuração', () => {
    expect(chartComLegendaSource()).toContain('showLegend: true');
  });

  it('os dois títulos ficam no objeto de configuração, não numa prop do container', () => {
    expect(chartComTituloSource()).toContain("title: 'Acessos por dispositivo'");
    expect(chartTituloNoDesenhoSource()).toContain("title: 'Vendas mensais'");
  });

  it('o título no desenho dispensa o rótulo autoral, e a story diz por quê', () => {
    expect(chartTituloNoDesenhoSource()).not.toContain('aria-label');
  });

  it('a composição em card importa o Card junto do container', () => {
    const saida = chartEmCardSource();
    expect(saida).toContain('from "@/components/ui/card"');
    expect(saida).toContain('<CardTitle>Acessos mensais</CardTitle>');
    expect(saida).toContain('height={200}');
  });

  it('a story de tema empilha os dois tipos com um só conjunto de dados', () => {
    const saida = chartDoisTypesSource();
    expect(saida).toContain('import { ChartContainer, buildBarOption, buildLineOption }');
    expect(saida.match(/<ChartContainer/g)).toHaveLength(2);
    expect(saida).toContain('<div class="nds-stack nds-w-full">');
  });
});
