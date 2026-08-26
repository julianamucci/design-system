/**
 * Transforms do painel Code do Chart.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O Chart é montado por `h()` em todas as stories — o painel imprimiria a
 * chamada da render function, que ninguém escreve num template. O que sai daqui
 * é o SFC equivalente: os dados como constantes do `script setup` e o container
 * recebendo o `option` de um builder.
 */
import {
  attr,
  attrNum,
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';
import { CHART_EMPTY_LABEL } from './chart-state';

export type ChartArgs = {
  renderer: 'svg' | 'canvas';
  height: number;
  emptyLabel: string;
};

/** Altura pedida pelo Playground, a mesma que o control nasce trazendo. */
export const HEIGHT_PLAYGROUND = 300;

/**
 * Rótulo do desenho. `role="img"` sem nome acessível é violação de axe, e
 * desenho mudo é conteúdo perdido — por isso ele aparece em quase todo snippet.
 */
const LABEL_PLAYGROUND = 'Acessos mensais no desktop, de janeiro a junho';

/** Import do design system, com os builders que cada exemplo usa. */
function importing(...builders: string[]): string {
  return `import { ChartContainer, ${builders.join(', ')} } from '@/components/ui/chart'`;
}

const MONTHS_SEMESTER = `const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']`;
const MONTHS_QUADRIMESTRE = `const meses = ['Jan', 'Fev', 'Mar', 'Abr']`;

const SERIE_SEMESTER = `const series = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }]`;
const SERIES_SEMESTER = `const series = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
]`;

const SERIE_QUADRIMESTRE = `const series = [{ name: 'Desktop', data: [186, 305, 237, 73] }]`;
const SERIES_QUADRIMESTRE_2 = `const series = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile', data: [80, 200, 120, 190] },
]`;
const SERIES_QUADRIMESTRE_3 = `const series = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile', data: [80, 200, 120, 190] },
  { name: 'Tablet', data: [40, 90, 60, 100] },
]`;

const DISPOSITIVOS = `const dispositivos = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
]`;

/** Quatro etapas de um processo que afunila, da mais larga para a mais estreita. */
const FUNNEL_STAGES = `const etapas = [
  { label: 'Visitas', value: 4000 },
  { label: 'Cadastros', value: 2400 },
  { label: 'Carrinho', value: 1200 },
  { label: 'Compra', value: 480 },
]`;

/**
 * Cinco grandezas do mesmo item, cada uma com o SEU teto.
 *
 * Os tetos diferentes são o exemplo, não um detalhe: é por eles que a tabela do
 * radar traz uma coluna de máximo — sem ela, o 9 de um eixo que vai a 10 e o 96
 * de um que vai a 100 sairiam como dois números soltos.
 */
const RADAR_AXES = `const eixos = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
]`;

/** Duas medições do mesmo item, para o desenho ser uma comparação. */
const RADAR_SERIES = `const medicoes = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
]`;

/**
 * O container, com os atributos em uma linha cada quando a fila fica longa —
 * atributo em linha comprida some na barra de rolagem do painel.
 *
 * `renderer` nasce em `svg` e `empty-label` na frase padrão: nenhum dos dois
 * entra no snippet quando o valor bate com o padrão do componente.
 */
function container(options: {
  option: string;
  height?: unknown;
  label?: string;
  className?: string;
  renderer?: unknown;
  emptyLabel?: unknown;
  categoryLabel?: string;
  maxLabel?: string;
  seriesLabel?: string;
}): string {
  const partes = attrsMultilinha([
    `:option="${options.option}"`,
    attrNum('height', options.height),
    attr('renderer', options.renderer, 'svg'),
    options.label ? attr('aria-label', options.label) : '',
    attr('empty-label', options.emptyLabel, CHART_EMPTY_LABEL),
    options.categoryLabel ? attr('category-label', options.categoryLabel) : '',
    options.maxLabel ? attr('max-label', options.maxLabel) : '',
    options.seriesLabel ? attr('series-label', options.seriesLabel) : '',
    options.className ? attr('class', options.className) : '',
  ]);
  return partes.startsWith('\n')
    ? `<ChartContainer${partes}/>`
    : `<ChartContainer${partes} />`;
}

/**
 * Playground: barras de série única, com a altura, o desenhador e a frase de
 * estado vazio saindo dos controls.
 *
 * Todo control passa por `attr`/`attrNum`: o Storybook troca arg de ação por um
 * espião, e um valor que não é do tipo esperado interpolado direto vira ruído no
 * painel — ou, no caso do número, um `NaN` escrito como se fosse exemplo.
 */
export const chartSource: SourceTransform<ChartArgs> = (_gerado, ctx) =>
  vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_SEMESTER}\n${SERIE_SEMESTER}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: typeof ctx?.args?.height === 'number' ? ctx.args.height : HEIGHT_PLAYGROUND,
      renderer: ctx?.args?.renderer,
      emptyLabel: ctx?.args?.emptyLabel,
      label: LABEL_PLAYGROUND,
    }),
  );

/** Barras: comparação entre categorias discretas, uma série. */
export function chartBarSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_SEMESTER}\n${SERIE_SEMESTER}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 240,
      label: 'Gráfico de barras: acessos mensais no desktop',
    }),
  );
}

/** Linhas: tendência contínua, e com duas séries a legenda entra sozinha. */
export function chartLineSource(): string {
  return vueSnippet(
    `${importing('buildLineOption')}\n\n${MONTHS_SEMESTER}\n${SERIES_SEMESTER}`,
    container({
      option: 'buildLineOption({ xAxis: meses, series })',
      height: 260,
      label: 'Gráfico de linhas: acessos mensais por dispositivo',
    }),
  );
}

/** Área: a mesma linha com a região sob ela preenchida, para dar volume. */
export function chartAreaSource(): string {
  return vueSnippet(
    `${importing('buildAreaOption')}\n\n${MONTHS_SEMESTER}\n${SERIES_SEMESTER}`,
    container({
      option: 'buildAreaOption({ xAxis: meses, series })',
      height: 260,
      label: 'Gráfico de área: volume mensal de acessos por dispositivo',
    }),
  );
}

/**
 * Pizza (rosca): o builder recebe pontos rotulados, não eixo mais série — é
 * participação no todo, e não evolução ao longo de uma categoria.
 */
export function chartPieSource(): string {
  return vueSnippet(
    `${importing('buildPieOption')}\n\n${DISPOSITIVOS}`,
    container({
      option: 'buildPieOption({ data: dispositivos })',
      height: 280,
      label: 'Distribuição de acessos por dispositivo',
    }),
  );
}

/**
 * Funil: mesma FORMA de dado da rosca — pares de rótulo e valor, sem eixo —,
 * porque aqui também não há categoria contínua, e sim uma ordem de etapas. A
 * ordem em que os pares são escritos é a ordem do funil.
 */
export function chartFunnelSource(): string {
  return vueSnippet(
    `${importing('buildFunnelOption')}\n\n${FUNNEL_STAGES}`,
    container({
      option: 'buildFunnelOption({ data: etapas })',
      height: 300,
      label: 'Funil de conversão: da visita à compra',
    }),
  );
}

/**
 * Radar: duas listas, e o snippet mostra as duas porque nenhuma delas se deduz
 * da outra.
 *
 * Os EIXOS trazem nome e teto — é o teto que a coluna de máximo da tabela
 * escreve —, e as séries trazem os valores na ordem dos eixos. Os rótulos das
 * duas primeiras colunas entram escritos porque no radar a primeira não nomeia
 * uma categoria qualquer: nomeia o eixo, e a segunda traz o teto dele.
 */
/** Três grupos de pontos — o snippet mostra poucos, para ensinar a FORMA do dado. */
const SCATTER_SERIES = `const sessoes = [
  { name: 'Grupo 1', points: [[1.5, 1.1], [1.9, 1.8], [3, 1.6]] },
  { name: 'Grupo 2', points: [[7, 4.1], [8, 4.8], [9, 3.8]] },
  { name: 'Grupo 3', points: [[12.7, 2.4], [13.4, 2.7], [14.9, 1.9]] },
]`;

export function chartScatterSource(): string {
  return vueSnippet(
    `${importing('buildScatterOption')}

${SCATTER_SERIES}`,
    container({
      option: "buildScatterOption({ series: sessoes, xLabel: 'Minutos na página', yLabel: 'Páginas vistas' })",
      height: 320,
      label: 'Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos',
      seriesLabel: 'Grupo',
    }),
  );
}

export function chartRadarSource(): string {
  return vueSnippet(
    `${importing('buildRadarOption')}\n\n${RADAR_AXES}\n${RADAR_SERIES}`,
    container({
      option: 'buildRadarOption({ axes: eixos, series: medicoes })',
      height: 320,
      label: 'Radar de qualidade do site: cinco grandezas, antes e depois da revisão',
      categoryLabel: 'Eixo',
      maxLabel: 'Máximo',
    }),
  );
}

/**
 * Gráfico dentro de Card — o arranjo mais comum em painel.
 *
 * O card é o componente Card, não um retângulo desenhado à mão: borda, sombra e
 * tipografia escritas na composição ficam num lugar que o tema não alcança, e a
 * peça deixa de acompanhar densidade, marca e modo escuro.
 */
export function chartWithCardSource(): string {
  const grafico = container({
    option: 'buildBarOption({ xAxis: meses, series })',
    height: 200,
    label: 'Acessos mensais no desktop, de janeiro a junho',
  });
  return vueSnippet(
    `${importing('buildBarOption')}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

${MONTHS_SEMESTER}
${SERIE_SEMESTER}`,
    `<Card class="nds-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
    <CardDescription>Janeiro a junho de 2024</CardDescription>
  </CardHeader>
  <CardContent>
${indentar(grafico, 4)}
  </CardContent>
</Card>`,
  );
}

/**
 * Título no próprio option, para o gráfico que aparece sem card em volta.
 *
 * A ausência de `aria-label` é o assunto: o container encadeia rótulo autoral,
 * título do option e palavra genérica, e aqui é o degrau do meio que nomeia o
 * desenho.
 */
export function designChartTitleSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_SEMESTER}\n${SERIE_SEMESTER}`,
    container({
      option: "buildBarOption({ xAxis: meses, series, title: 'Vendas mensais' })",
      height: 260,
      className: 'nds-max-w-lg',
    }),
  );
}

/**
 * Dica sobre o ponto de dado: não há prop a ligar — os builders já declaram o
 * `tooltip`, e o que o exemplo mostra é a forma canônica.
 */
export function chartWithDicaSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIE_QUADRIMESTRE}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 240,
      label: 'Acessos mensais no desktop',
    }),
  );
}

/** Três séries: a legenda entra sozinha assim que há mais de uma. */
export function chartWithCaptionSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIES_QUADRIMESTRE_3}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 280,
      label: 'Acessos mensais por dispositivo',
    }),
  );
}

/** Multi-série com título no próprio option — o caso típico de painel. */
export function chartMultiSerieSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIES_QUADRIMESTRE_3}`,
    container({
      option: "buildBarOption({ xAxis: meses, series, title: 'Acessos por dispositivo' })",
      height: 300,
      label: 'Acessos mensais por dispositivo, de janeiro a abril',
    }),
  );
}

/**
 * Estado vazio: nenhuma série com dado, e a frase entra no lugar do desenho.
 *
 * Sem rótulo de propósito — sem desenho não há imagem a nomear, e o container
 * larga o `role="img"` para que a frase seja lida como conteúdo.
 */
export function chartEmptySource(): string {
  return vueSnippet(
    importing('buildBarOption'),
    container({
      option: 'buildBarOption({ data: [] })',
      height: 200,
      emptyLabel: 'Nenhum dado disponível para o período selecionado.',
    }),
  );
}

/** Uma série só: a legenda não aparece, porque não há o que comparar. */
export function chartSerieUnicaSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIE_QUADRIMESTRE}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 240,
      label: 'Acessos mensais no desktop',
    }),
  );
}

/** Duas séries: legenda automática e trama por série (WCAG 1.4.1). */
export function chartDuasSeriesSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIES_QUADRIMESTRE_2}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 280,
      label: 'Acessos mensais por dispositivo: desktop e mobile',
    }),
  );
}

/**
 * Dois tipos lado a lado: cor e tipografia saem dos tokens do tema em vigor, e
 * o container repinta sozinho quando a classe do documento muda. Não há prop de
 * tema a passar — o que o exemplo ensina é que não é preciso passar nenhuma.
 */
export function themeChartTokensSource(): string {
  const barras = container({
    option: 'buildBarOption({ xAxis: meses, series })',
    height: 260,
    label: 'Acessos mensais por dispositivo, em barras',
  });
  const lines = container({
    option: 'buildLineOption({ xAxis: meses, series })',
    height: 260,
    label: 'Acessos mensais por dispositivo, em linhas',
  });
  return vueSnippet(
    `${importing('buildBarOption', 'buildLineOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIES_QUADRIMESTRE_2}`,
    `<div class="nds-stack">
${indentar(barras, 2)}
${indentar(lines, 2)}
</div>`,
  );
}

/**
 * Contraste de objeto gráfico: série única de propósito, para que tudo que
 * houver na tela seja forma de dado. O contorno que sustenta os 3:1 da WCAG
 * 1.4.11 vem do tema do container, não de nada escrito no option.
 */
export function chartContrastSource(): string {
  return vueSnippet(
    `${importing('buildBarOption')}\n\n${MONTHS_QUADRIMESTRE}\n${SERIE_QUADRIMESTRE}`,
    container({
      option: 'buildBarOption({ xAxis: meses, series })',
      height: 260,
      label: 'Acessos mensais no desktop',
    }),
  );
}
