// ─── Svelte Chart — barrel ───────────────────────────────────────────────────
// ChartContainer Svelte 5 wrappa vanilla echarts. Builders puros pra option.

import type { EChartsCoreOption } from 'echarts/core';
import ChartContainer from './chart-container.svelte';
import { ARIA, CHART_TABLE_LABELS } from './chart-state.js';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion.js';

export { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state.js';

export { ChartContainer };

export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { name: string; data: number[]; color?: string }

/**
 * Série de dispersão: pares `[x, y]`, sem categoria no meio.
 *
 * Tipo próprio, e não um `data` que aceita duas formas, porque as duas
 * respondem perguntas diferentes: `ChartSeries.data` é uma lista ALINHADA às
 * categorias do eixo, e um ponto de dispersão não tem categoria — as duas
 * coordenadas são medidas, e é a posição no plano que carrega a informação.
 */
export interface ChartScatterSeries {
  name: string;
  points: [number, number][];
  color?: string;
}

/**
 * Um eixo do radar: o nome dele e o TETO da escala.
 *
 * Nome e teto andam juntos porque no radar eles não são separáveis: o que a
 * pessoa lê no desenho é a distância do vértice ao centro, e essa distância é o
 * valor DIVIDIDO pelo teto daquele eixo. Um 7 num eixo que vai a 10 e um 7 num
 * eixo que vai a 100 caem em pontos opostos do mesmo raio.
 */
export interface ChartRadarAxis { label: string; max: number }

// ─── Vocabulário do desenho ──────────────────────────────────────────────────
//
// A trama do `decal` cumpre a WCAG 1.4.1 onde há ÁREA para tramar — barra,
// fatia e faixa de funil. A linha não tem área: uma série vira um traço de um
// pixel e meio, e a trama não chega nela. O que resta ali é a forma do ponto e o desenho do
// traço, e sem os dois duas séries só se distinguem pela cor.
//
// Símbolo, traço e trama vão até CINCO; a paleta de cor vai até oito. Da sexta
// série em diante os três recomeçam, e o que volta a separar a sexta da
// primeira é a cor — o motivo de o teto ser cinco está em `chartDecals`, no
// arquivo de estado.

/** Símbolo de ponto, na ordem das séries; o 6º volta ao 1º. */
const CHART_SYMBOLS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const CHART_LINE_DASHES: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

interface OptionsBase {
  data?: ChartDataPoint[];
  xAxis?: Array<string | number>;
  series?: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}

function buildAxisOption(type: 'bar' | 'line' | 'area', o: OptionsBase): EChartsCoreOption {
  const xAxisData = o.xAxis ?? o.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    o.series ?? (o.data ? [{ name: CHART_TABLE_LABELS.value, data: o.data.map((d) => d.value) }] : []);
  const showLegend = o.showLegend ?? seriesData.length > 1;
  return {
    // Sem `textStyle` aqui de propósito.
    //
    // O tamanho do título era `14` cravado, e cravado no option ele congela:
    // aumentar a fonte do navegador crescia a frase de estado vazio do mesmo
    // componente — que usa `var(--text-control)` — e deixava o título do
    // desenho para trás (WCAG 1.4.4). A lib só aceita número em pixel, então o
    // número passou a ser MEDIDO a partir da fonte raiz, e mora no tema do
    // container junto com o do rótulo de eixo e o da legenda: lá `setTheme` o
    // recalcula quando a raiz muda, sem que ninguém remonte o option.
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend
      ? { data: seriesData.map((s) => s.name), bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 4 }
      : undefined,
    grid: { left: 16, right: 16, top: o.title ? 48 : 16, bottom: showLegend ? 48 : 24, containLabel: true },
    xAxis: { type: 'category', data: xAxisData, boundaryGap: type === 'bar' },
    yAxis: { type: 'value' },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data,
      smooth: type !== 'bar',
      ...(type === 'bar'
        ? {}
        : {
          // Símbolo e traço próprios por série: a forma distingue sem a cor.
          symbol: CHART_SYMBOLS[i % CHART_SYMBOLS.length],
          symbolSize: 9,
          lineStyle: {
            type: CHART_LINE_DASHES[i % CHART_LINE_DASHES.length],
            ...(s.color ? { color: s.color } : {}),
          },
        }),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
      ...(s.color || type === 'bar'
        ? {
          itemStyle: {
            ...(s.color ? { color: s.color } : {}),
            ...(type === 'bar' ? { borderRadius: [4, 4, 0, 0] } : {}),
          },
        }
        : {}),
    })),
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ARIA,
  };
}

export const buildBarOption  = (o: OptionsBase): EChartsCoreOption => buildAxisOption('bar',  o);
export const buildLineOption = (o: OptionsBase): EChartsCoreOption => buildAxisOption('line', o);
export const buildAreaOption = (o: OptionsBase): EChartsCoreOption => buildAxisOption('area', o);

/**
 * Funil: etapas de um processo que afunila, uma faixa por etapa.
 *
 * A ordem da lista é a do PERCURSO, e o desenho a respeita — ver `sort` abaixo.
 * É essa ordem que dá sentido à terceira coluna da alternativa textual: a
 * participação de cada etapa em relação à primeira, que é exatamente o que a
 * largura da faixa desenha.
 */
export function buildFunnelOption(o: {
  data: ChartDataPoint[];
  title?: string;
}): EChartsCoreOption {
  return {
    // Sem `textStyle`: o tamanho do título é medido a partir da fonte raiz e
    // vive no tema do container — ver `buildAxisOption` acima.
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    // A faixa não tem eixo que a nomeie e não leva rótulo escrito por dentro
    // (ver `label`): sem a legenda, a única pista de qual etapa é qual seria a
    // cor.
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'funnel',
      // A ordem é a do PROCESSO, não a do valor. `descending`, que é o padrão da
      // lib, reordena as etapas pelo tamanho: bastaria uma etapa que recupera
      // volume para o desenho contar outra história, e para a coluna de
      // participação passar a se referir a uma etapa que não é a entrada.
      sort: 'none',
      // A largura da faixa É a informação, então ela não pode depender do menor
      // valor do conjunto. Com `min: 0` e a faixa indo de 0% a 100% da caixa, a
      // largura de cada etapa é o valor dela sobre o da maior — o mesmo número
      // que a coluna de participação escreve.
      min: 0,
      minSize: '0%',
      maxSize: '100%',
      left: '10%',
      right: '10%',
      top: o.title ? 48 : 16,
      bottom: 48,
      // Um respiro entre as faixas: sem ele o contorno de uma encosta no da
      // vizinha e as duas viram um bloco só.
      gap: 2,
      // Sem rótulo desenhado por dentro da faixa: ele nasceria em branco fixo
      // sobre a cor da série — contraste que muda com a etapa e com o tema —, e
      // a mesma informação já está na legenda, em texto de tema, e na tabela.
      label: { show: false },
      labelLine: { show: false },
      data: o.data.map((p) => ({ name: p.label, value: p.value })),
    }],
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    aria: ARIA,
  };
}

export function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption {
  return {
    // Sem `textStyle`: o tamanho do título é medido a partir da fonte raiz e
    // vive no tema do container — ver `buildAxisOption` acima.
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', o.title ? '52%' : '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4 },
      data: o.data.map((p) => ({ name: p.label, value: p.value })),
    }],
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    aria: ARIA,
  };
}

/**
 * Radar: um eixo por grandeza, um polígono fechado por série.
 *
 * É o único construtor desta stack que emite SISTEMA DE COORDENADAS próprio —
 * o bloco `radar` ao lado de `series`, e não dentro dela. Quem descreve os
 * eixos é o `indicator`; a série só carrega os valores, na ordem deles. É
 * também a única fonte do nome e do teto de cada eixo, e é de lá que a coluna
 * de máximo da alternativa textual os lê (ver `chartTable`): uma segunda lista
 * de eixos passada à parte seria uma segunda verdade sobre a mesma escala.
 */
/**
 * Dispersão: dois eixos de valor, um ponto por par, uma FORMA por série.
 *
 * É o tipo em que a trama do decal não serve, e por isso ela é desligada aqui.
 * A hachura é um ladrilho que se repete; num símbolo de 14px cabe uma repetição
 * ou duas, e duas tramas diferentes saem indistinguíveis — declarada, aplicada,
 * e ainda assim sem separar nada. Quem separa as séries é a forma do símbolo, e
 * aqui ela é o sinal PRIMÁRIO, não o reforço: é a única marca que o tipo
 * desenha. Por isso o símbolo é maior que o do traçado (14 contra 9), onde ele
 * apenas marca pontos sobre uma linha que já tem desenho próprio de traço.
 *
 * O nome de cada eixo entra no option porque é dali que a tabela equivalente o
 * lê — mesma escolha do teto do radar, que sai do `indicator`.
 */
export function buildScatterOption(o: {
  series: ChartScatterSeries[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  showLegend?: boolean;
}): EChartsCoreOption {
  const showLegend = o.showLegend ?? o.series.length > 1;
  return {
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item' },
    // A legenda amarra a forma ao nome da série.
    legend: showLegend ? { bottom: 0, itemWidth: 14 } : undefined,
    grid: {
      left: 16, right: 16,
      top: o.title ? 48 : 16,
      bottom: showLegend ? 48 : 24,
      containLabel: true,
    },
    // A folga do nome do eixo vem do TEMA — ver `nameGap` lá.
    xAxis: { type: 'value', name: o.xLabel, nameLocation: 'middle', scale: true },
    yAxis: { type: 'value', name: o.yLabel, nameLocation: 'middle', scale: true },
    series: o.series.map((serie, i) => ({
      name: serie.name,
      type: 'scatter',
      data: serie.points,
      symbol: CHART_SYMBOLS[i % CHART_SYMBOLS.length],
      symbolSize: 14,
      ...(serie.color ? { itemStyle: { color: serie.color } } : {}),
    })),
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
  };
}

export function buildRadarOption(o: {
  axes: ChartRadarAxis[];
  series: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}): EChartsCoreOption {
  const seriesData = o.series;
  const showLegend = o.showLegend ?? seriesData.length > 0;
  return {
    // Sem `textStyle`: o tamanho do título é medido a partir da fonte raiz e
    // vive no tema do container — ver `buildAxisOption` acima.
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item' },
    // O polígono não tem eixo que o nomeie — os eixos nomeiam as GRANDEZAS,
    // não as séries —, então a legenda aparece sempre que há série, como na
    // rosca e no funil. Sem ela, a única pista de qual polígono é qual seria a
    // cor.
    legend: showLegend
      ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
      : undefined,
    radar: {
      indicator: o.axes.map((axis) => ({ name: axis.label, max: axis.max })),
      // Polígono, e não círculo: são os vértices que dizem em que grandeza o
      // item é forte, e num anel eles somem.
      shape: 'polygon',
      // Sobe o centro e encolhe o raio para caber o nome de cada eixo por fora
      // do último anel — o nome é texto e cresce com a fonte do navegador
      // (WCAG 1.4.4), então a folga é proporcional, nunca em pixel.
      center: ['50%', o.title ? '54%' : '48%'],
      radius: '58%',
    },
    // Uma série de radar só, com um item de dado por série do chamador: é assim
    // que a lib desenha vários polígonos no mesmo sistema de eixos.
    series: [{
      type: 'radar',
      data: seriesData.map((s, i) => ({
        name: s.name,
        value: s.data,
        // Símbolo e traço próprios, o mesmo vocabulário de forma do traçado:
        // sem a cor, um polígono ainda se separa do outro (WCAG 1.4.1).
        symbol: CHART_SYMBOLS[i % CHART_SYMBOLS.length],
        symbolSize: 9,
        lineStyle: {
          type: CHART_LINE_DASHES[i % CHART_LINE_DASHES.length],
          ...(s.color ? { color: s.color } : {}),
        },
        // A área preenchida é o que faz a trama alcançar o radar: a hachura é
        // de PREENCHIMENTO, e sem `areaStyle` a lib desenha só o contorno do
        // polígono — não haveria o que hachurar. Translúcida porque os
        // polígonos se sobrepõem de propósito: opaco, o de cima apagaria o de
        // baixo, que é justamente a comparação que o radar existe para mostrar.
        areaStyle: { opacity: 0.3 },
        ...(s.color ? { itemStyle: { color: s.color } } : {}),
      })),
    }],
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    aria: ARIA,
  };
}
