// ─── Vue Chart — barrel ──────────────────────────────────────────────────────
// ChartContainer wrappa vue-echarts com tema Nortear.
// Builders puros pra montar `option` por tipo de chart.

import type { EChartsCoreOption } from 'echarts/core';
import { ARIA, CHART_TABLE_LABELS, formatChartValue } from './chart-state';
import {
  nestInnerLabel,
  nestLabelLine,
  nestOuterLabel,
  valueLabelStyle,
  type NestLabelTokens,
} from '@shared/primitives/chart-nest-labels';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

export { default as ChartContainer } from './ChartContainer.vue';
export { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state';

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
/**
 * Ponto da rosca ANINHADA: além do valor, a que grupo ele pertence.
 *
 * É o que torna a hierarquia declarável pelo lado de baixo — o anel de dentro
 * não é informado, é DERIVADO da soma dos pontos de cada grupo. Declarar os dois
 * abriria a porta para eles discordarem, e o desenho mentiria sem nada acusar.
 */
export interface ChartNestedPoint {
  label: string;
  value: number;
  group: string;
}

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
  /**
   * Escrever o valor junto do dado.
   *
   * Sem valor declarado, aparece quando há UMA série só: com duas ou mais os
   * números se sobrepõem, e aí quem entrega o valor exato é a tabela.
   *
   * Existe como opção por causa do mini gráfico de tendência — ali o desenho é
   * adjetivo de um número já escrito ao lado, e repetir o valor dentro de 48px
   * de altura só suja.
   */
  showValues?: boolean;
}

function buildAxisOption(type: 'bar' | 'line' | 'area', o: OptionsBase): EChartsCoreOption {
  const xAxisData = o.xAxis ?? o.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    o.series ?? (o.data ? [{ name: CHART_TABLE_LABELS.value, data: o.data.map((d) => d.value) }] : []);
  const showLegend = o.showLegend ?? seriesData.length > 1;
  // O valor escrito junto do dado aparece com UMA série só: com duas ou mais
  // os números se sobrepõem, e aí quem o entrega é a tabela.
  const showValueLabels = o.showValues ?? seriesData.length === 1;
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
      // O estilo do rótulo viaja no OPTION, e não no tema: medido, um bloco
      // `bar: { label: … }` registrado no tema sai IGNORADO — o rótulo desenha
      // idêntico com e sem ele. Sem estas declarações a lib usa cinza `#333`
      // fixo, halo branco de 2px e corpo de 12px cravado, e no modo escuro o
      // texto mede 1.06 contra o fundo: o número vira o próprio contorno.
      //
      // As cores aqui são de PARTIDA; quem as troca pelas do tema em vigor é o
      // container, no mesmo ponto em que injeta a trama do decal.
      label: showValueLabels
        ? {
          show: true,
          position: 'top',
          formatter: (point: { value: number }) => formatChartValue(point.value),
          ...valueLabelStyle(NEST_LABEL_FALLBACK),
        }
        : { show: false },
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
/**
 * Rosca ANINHADA: dois anéis concêntricos sobre o mesmo total.
 *
 * O de dentro é derivado da soma por grupo, e é essa derivação que faz o desenho
 * ser verdadeiro: como os dois anéis somam o MESMO total e percorrem a mesma
 * ordem, cada fatia externa cai dentro do vão angular do seu grupo. É a POSIÇÃO
 * que comunica a hierarquia — não a cor, que aqui repete entre os anéis porque
 * as duas séries leem a mesma paleta desde o índice zero.
 *
 * Duas séries `pie` e não uma com níveis: a lib não tem nível em rosca, e
 * `sunburst` — que tem — traz sistema de coordenadas próprio e contrato de dado
 * em árvore, que é outro componente, não outro modo deste.
 *
 * Cada item do anel externo LEVA o grupo junto. É de lá que a tabela equivalente
 * o lê: ela nasce do option, e sem o grupo no dado não teria como reconstruir a
 * coluna que nomeia o anel de dentro.
 */
/**
 * Cores de PARTIDA do rótulo, para o construtor continuar puro.
 *
 * Não são as que aparecem na tela: o container reaplica os tokens do tema em
 * vigor, e volta a reaplicá-los quando a classe do documento muda. Existem para
 * que um option montado e usado FORA do container ainda desenhe um rótulo
 * legível — `currentColor` herda do documento, e a placa transparente faz o pior
 * caso virar "sem placa" em vez de "texto invisível".
 */
const NEST_LABEL_FALLBACK: NestLabelTokens = {
  foreground: 'currentColor',
  background: 'transparent',
  border: 'transparent',
  muted: 'transparent',
  mutedForeground: 'currentColor',
  fontSize: 12,
};

export function buildPieNestOption(o: {
  data: ChartNestedPoint[];
  title?: string;
  showLegend?: boolean;
}): EChartsCoreOption {
  const points = o.data;
  const showLegend = o.showLegend ?? points.length > 0;

  // Ordem de PRIMEIRA APARIÇÃO, não de tamanho: é ela que alinha cada fatia
  // externa ao arco do seu grupo. Um grupo pequeno declarado antes de um grande
  // iria para o fim se a ordem fosse por valor, e o alinhamento quebraria.
  const order: string[] = [];
  const sums = new Map<string, number>();
  for (const point of points) {
    if (!sums.has(point.group)) order.push(point.group);
    sums.set(point.group, (sums.get(point.group) ?? 0) + Math.max(0, point.value));
  }

  const center: [string, string] = ['50%', o.title ? '52%' : '45%'];
  return {
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    // A legenda nomeia os dois anéis. Sem ela o de dentro fica mudo: o rótulo
    // escrito dentro do arco não cabe em fatia pequena, e a lib o esconde sem
    // avisar.
    legend: showLegend
      ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
      : undefined,
    series: [
      {
        type: 'pie',
        // Disco cheio no miolo, e não um segundo anel: dois anéis de mesma
        // espessura leem-se como duas roscas empilhadas, e a hierarquia some.
        radius: [0, '28%'],
        center,
        avoidLabelOverlap: true,
        label: nestInnerLabel(NEST_LABEL_FALLBACK),
        itemStyle: { borderRadius: 2 },
        data: order.map((name) => ({ name, value: sums.get(name) ?? 0 })),
      },
      {
        type: 'pie',
        radius: ['42%', '58%'],
        center,
        avoidLabelOverlap: true,
        label: nestOuterLabel(NEST_LABEL_FALLBACK),
        labelLine: nestLabelLine(NEST_LABEL_FALLBACK),
        itemStyle: { borderRadius: 4 },
        data: points.map((point) => ({
          name: point.label,
          value: point.value,
          group: point.group,
        })),
      },
    ],
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    // A rosca aninhada é de PREENCHIMENTO, então a trama alcança — ao contrário
    // da dispersão, onde ela é desligada.
    aria: ARIA,
  };
}

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
    // A legenda amarra a forma ao nome da série. Sem ela o desenho teria formas
    // distintas e nenhuma pista do que cada uma significa.
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
