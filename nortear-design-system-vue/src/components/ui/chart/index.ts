// ─── Vue Chart — barrel ──────────────────────────────────────────────────────
// ChartContainer wrappa vue-echarts com tema Nortear.
// Builders puros pra montar `option` por tipo de chart.

import type { EChartsCoreOption } from 'echarts/core';
import { ARIA, CHART_TABLE_LABELS } from './chart-state';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

export { default as ChartContainer } from './ChartContainer.vue';
export { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state';

export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { name: string; data: number[]; color?: string }

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
// A trama do `decal` cumpre a WCAG 1.4.1 onde há ÁREA para tramar — barra e
// fatia. A linha não tem área: uma série vira um traço de um pixel e meio, e a
// trama não chega nela. O que resta ali é a forma do ponto e o desenho do
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
 * Funil: as etapas de um processo, desenhadas na ordem em que acontecem.
 *
 * Recebe a MESMA forma de dado da rosca — pares de rótulo e valor, sem eixo —,
 * porque aqui também não há categoria contínua: há uma ordem de etapas. O que
 * o desenho comunica é a LARGURA de cada faixa em relação à primeira, e largura
 * não se lê em texto: por isso a alternativa textual ganha a terceira coluna
 * (ver `chartTable`), pelo mesmo raciocínio da participação da rosca.
 *
 * Três decisões que não são estilo:
 *
 * - `sort: 'none'` fica ESCRITO, e CONTRA o padrão da lib, que reordena as
 *   faixas por valor. A ordem aqui é a do PERCURSO, não a do tamanho: o funil
 *   descreve um caminho, e não um ranking. Reordenando, um dado fora de ordem
 *   sairia desenhado em ordem — o desenho ficaria bonito, e a coluna de
 *   participação passaria a se referir a uma etapa que não é a de entrada. Com
 *   `none`, dado fora de ordem aparece fora de ordem, que é o que quem
 *   escreveu o dado precisa ver; e é essa mesma ordem que a tabela repete
 *   linha a linha.
 * - `label.show: false` — o rótulo padrão do funil é escrito DENTRO da faixa,
 *   por cima de uma cor de série que muda a cada posição. Contraste que depende
 *   de qual cor a posição sorteou é contraste que não se garante; quem nomeia
 *   cada etapa por escrito é a legenda, sobre o fundo da página.
 * - Nada de `textStyle`: o tamanho do texto é MEDIDO a partir da fonte raiz e
 *   vive no tema do container. Um número cravado aqui venceria a medição e o
 *   desenho pararia de crescer com a fonte do navegador (WCAG 1.4.4).
 */
export function buildFunnelOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption {
  return {
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'funnel',
      top: o.title ? 48 : 16,
      bottom: 48,
      left: '8%',
      width: '84%',
      minSize: '24%',
      maxSize: '100%',
      sort: 'none',
      gap: 2,
      label: { show: false },
      labelLine: { show: false },
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
