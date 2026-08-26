// ─── Chart — wrapper ECharts ─────────────────────────────────────────────────
// Substitui o wrapper anterior baseado em Recharts. API agora é declarativa:
// passa `option` (objeto do echarts) em vez de compor JSX.
//
// Uso:
//   <ChartContainer option={buildBarOption(data)} style={{ height: "16rem" }} />
//
// Para multi-série, customizar tooltip/legenda, etc., construir o `option`
// diretamente. ECharts é declarativo — não há composição JSX como recharts.
//
// ─── Acessibilidade: as quatro decisões ──────────────────────────────────────
//
// 1. ALTERNATIVA TEXTUAL EQUIVALENTE — o container emite, sempre, uma `<table>`
//    de verdade com os mesmos números do desenho: cabeçalho por série,
//    `<th scope="row">` por categoria, `<caption>` com a descrição do gráfico.
//    Por padrão ela é `.nds-sr-only` (existe para leitor de tela e para quem lê
//    o DOM); `showData` a torna visível para todo mundo. Os números saem do
//    PRÓPRIO `option`, e não de um dado paralelo — assim tabela e desenho não
//    têm como divergir.
//
// 2. `role="img"` + `aria-label` vão no elemento do DESENHO, não no bloco
//    `.nds-chart`: o papel poda a subárvore da árvore de acessibilidade, e no
//    bloco a tabela ficaria escondida junto — a alternativa textual sumiria.
//
// 3. A INFORMAÇÃO NÃO VIVE NA COR. `aria.decal.show` sobrepõe uma trama a cada
//    série e a legenda traz o nome escrito. A trama é traçada na cor do FUNDO,
//    e não na da lib — ver `hatchPatterns`, onde está o número que explica por
//    quê. Em linha e área, sem área a hachurar, cada série tem símbolo de ponto
//    próprio (círculo, quadrado, triângulo, losango, seta) e desenho de traço
//    próprio. Retirando toda a cor, o gráfico continua legível (WCAG 1.4.1).
//
// 4. NENHUM TAMANHO DE TEXTO CRAVADO. A lib exige número em pixel, então o
//    número é MEDIDO a partir da fonte raiz e re-medido quando ela muda — o
//    rótulo do eixo cresce com a fonte do navegador (WCAG 1.4.4).

import * as React from 'react';
// A PORTA É `/core`, e não `echarts-for-react` direto — e as duas medidas
// abaixo são o que impede de "simplificar" o import de volta.
//
// `echarts-for-react/lib/index.js` faz `require("echarts")`: o PACOTE INTEIRO,
// que se registra sozinho na importação, e é com ESSA instância que ele desenha.
// O `echarts.use([...])` daqui de baixo registra em `echarts/core`, que é OUTRA
// instância — não é quem pinta. Duas consequências, e elas se somavam:
//
// 1. TAMANHO. O pedaço `chart-*.js` do `build-storybook` media 1.186.694 bytes
//    (1159K) e passou a 650.783 (636K) — 536K a menos, quase METADE do pedaço.
//    O que saiu foram séries, componentes e renderizadores que página nenhuma
//    daqui usa, arrastados pelo pacote inteiro; o que sobrou é o conjunto que a
//    lista abaixo registra, mais uma vez só.
//
//    O PORTÃO QUE MEDE ISTO É `build-storybook`, e não `npm run build`: o
//    segundo compila o sandbox, que não importa o Chart — o `dist/` desta stack
//    sai byte a byte idêntico antes e depois, sem uma ocorrência de `echarts`
//    dentro. Quem for conferir o número pelo `dist/` vai concluir que a troca
//    não fez efeito.
// 2. O REGISTRO ERA DECORATIVO. Plantando o defeito — tirar `RadarChart` da
//    lista abaixo — a suíte PASSAVA, porque o pacote inteiro já havia
//    registrado a série; nas outras stacks a mesma remoção reprova com
//    `[ECharts] Series radar is used but not imported`. Uma classe inteira de
//    asserção não valia aqui, e não valia para barra, linha, rosca, funil nem
//    radar. Medido de novo depois da troca: reprova, com essa mensagem.
//
// `ReactEChartsCore` recebe a instância por prop (`echarts={echarts}` no JSX lá
// embaixo). O que desenha passa a ser exatamente o que a lista registrou.
//
// E é `esm/core`, não `lib/core`. O pacote publica a mesma classe duas vezes —
// `lib/` em CommonJS, `esm/` em módulo, ambas com `.d.ts` — e o `module` do
// package.json aponta para `esm/`. Pela porta CJS o build de produção passa,
// mas o pipeline de desenvolvimento e de teste entrega o NAMESPACE do módulo no
// lugar do `default`, e o React recebe um objeto onde espera um componente:
// `Element type is invalid: … but got: object`. Portão que pega isso é a suíte,
// não o build — o mesmo par de sempre, um vendo o que o outro não vê.
import ReactEChartsCore from 'echarts-for-react/esm/core';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, FunnelChart, RadarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  AriaComponent,
  RadarComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

import { cn } from '@/lib/utils';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

// Bootstrap dos módulos — idempotente, tree-shake friendly.
//
// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada. O componente ficou
// meses fora desta lista enquanto a documentação prometia o `decal`.
//
// O radar entra por DUAS portas, e é a única série daqui assim: `RadarChart` é
// o desenho, `RadarComponent` é o SISTEMA DE COORDENADAS em que ele desenha.
// Barra e linha desenham no cartesiano do `GridComponent`; rosca e funil não
// desenham em coordenada nenhuma. O radar traz a sua, e ela é um componente
// próprio — o option tem um bloco `radar` no primeiro nível, ao lado de
// `series`, e não dentro dela.
//
// A segunda porta está declarada, e a medição diz que hoje ela não é
// obrigatória: nesta versão o instalador de `RadarChart` já puxa o do
// componente, e removendo `RadarComponent` daqui o desenho continua saindo.
// Fica escrita mesmo assim, e não por precaução vaga — o que este `use` diz é
// de que módulos o componente depende, e o sistema de coordenadas é um deles.
// Inferir a dependência do detalhe de empacotamento de uma versão é como o
// registro some no dia em que o detalhe muda.
echarts.use([
  BarChart, LineChart, PieChart, FunnelChart, RadarChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent, RadarComponent,
  SVGRenderer, CanvasRenderer,
]);

/**
 * Bloco `aria` comum aos builders.
 *
 * `decal.show` liga a trama por série. `label.enabled: false` desliga a
 * descrição gerada pela lib de propósito: ela nasce em inglês e mora num
 * elemento que o `role="img"` do desenho poda da árvore de acessibilidade —
 * quem carrega a alternativa textual é o `aria-label` autoral, no idioma da
 * página, mais a tabela de dados que o container emite sempre.
 *
 * A COR da trama não entra aqui: ela sai do tema em vigor e é o container quem
 * a pinta, em `withHatchPatterns`. Um construtor puro não pode carregar cor resolvida,
 * porque a cor muda depois — na troca de marca e na troca de claro/escuro.
 */
const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/**
 * Tramas do decal, uma por posição de série, traçadas na cor recebida.
 *
 * POR QUE RECOLORIR, e o número que impede de "simplificar" isto de volta para
 * a lista da lib: as tramas padrão do ECharts nascem em `rgba(0, 0, 0, 0.2)` —
 * preto a 20% sobre o próprio preenchimento. Medido contra a paleta de gráfico
 * do tema Default, esse desenho se destaca do preenchimento que hachura entre
 * apenas 1.14 e 1.54; no pior caso ninguém o enxerga. A trama é justamente o
 * que mantém o gráfico legível QUANDO A COR SAI DE CENA (WCAG 1.4.1), então uma
 * trama invisível é o critério declarado e não entregue.
 *
 * Traçadas na cor do FUNDO da página, elas herdam a distância que a paleta já
 * tem dele: 7.32 no pior caso no claro e 6.83 no escuro, nos três temas de
 * marca. É por isso que a cor é parâmetro e não constante — o fundo do modo
 * escuro é outro, e uma trama cravada serviria a um modo só.
 *
 * São CINCO desenhos — diagonal ascendente, pontos, diagonal descendente,
 * horizontais, grade — para OITO séries. Da 6ª em diante a lib repete a lista
 * do começo (`paletteIdx = (paletteIdx + 1) % decals.length`), então a 6ª volta
 * à 1ª, a 7ª à 2ª e a 8ª à 3ª. É o mesmo giro de `SYMBOLS` e `DASHES`, e é
 * deliberado: três desenhos novos só entram com uma medida de quanto se
 * distinguem dos cinco atuais, e essa medida ainda não existe. Enquanto não
 * existir, o que separa a 1ª da 6ª é a cor mais a posição na legenda escrita.
 */
function hatchPatterns(color: string): Record<string, unknown>[] {
  return [
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 },
    { color, symbol: 'circle', dashArrayX: [[8, 8], [0, 8, 8, 0]], dashArrayY: [6, 0], symbolSize: 0.8 },
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: -Math.PI / 4 },
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: 0 },
    { color, dashArrayX: [[1, 0], [1, 6]], dashArrayY: [1, 0, 6, 0], rotation: Math.PI / 4 },
  ];
}

/**
 * O mesmo option, com a trama do decal já pintada na cor do fundo em vigor.
 *
 * Mora no container, e não no construtor, porque o construtor roda uma vez e a
 * cor muda depois: `setTheme` relê o REGISTRO do tema, nunca o option, então
 * uma trama resolvida na construção ficaria com o fundo do tema anterior — no
 * escuro, uma hachura quase branca sobre um desenho que já era escuro.
 *
 * Vale também para quem monta o `option` à mão: basta `aria.decal.show`.
 */
function withHatchPatterns(option: echarts.EChartsCoreOption): echarts.EChartsCoreOption {
  const aria = (option as { aria?: { decal?: { show?: boolean } } }).aria;
  if (!aria?.decal?.show) return option;
  return {
    ...option,
    aria: { ...aria, decal: { ...aria.decal, decals: hatchPatterns(hsl('background')) } },
  };
}

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** O option descreve alguma série com dado? Decide o estado vazio. */
export function isChartOptionEmpty(option: echarts.EChartsCoreOption): boolean {
  const series = (option as { series?: unknown }).series;
  const list = Array.isArray(series) ? series : series ? [series] : [];
  if (list.length === 0) return true;
  return list.every((s) => {
    const data = (s as { data?: unknown[] }).data;
    return !Array.isArray(data) || data.length === 0;
  });
}

// ─── Theme (lê tokens do <html>) ─────────────────────────────────────────────

const THEME_NAME = 'nortear';

function hsl(token: string, alpha = 1): string {
  if (typeof document === 'undefined') return 'transparent';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  if (!raw) return 'transparent';
  return alpha === 1 ? `hsl(${raw})` : `hsla(${raw} / ${alpha})`;
}

function cssToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Tamanho de fonte raiz, em pixels.
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()`, e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado.
 * O que é mensurável — e o que de fato muda quando a pessoa aumenta a fonte do
 * navegador ou troca a fonte pela barra de ferramentas — é o `font-size`
 * resolvido do `<html>`.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const measured = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(measured) && measured > 0 ? measured : 16;
}

/**
 * Degrau tipográfico do desenho, em pixels, relativo à fonte raiz.
 *
 * A lib exige NÚMERO em pixel — não aceita `rem`, `em` nem `var()`. Cravar 14
 * congelava o texto do gráfico: aumentar a fonte do navegador aumentava a
 * página inteira e deixava o rótulo do eixo do mesmo tamanho (WCAG 1.4.4).
 * Como o número é obrigatório, ele é MEDIDO em vez de escolhido, e re-medido
 * sempre que a fonte raiz muda.
 */
function scaled(factor: number): number {
  return Math.round(rootFontSize() * factor);
}

function buildNortearTheme() {
  const fontFamily = cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const card = hsl('card');
  const border = hsl('border');
  // 0.75 = 12px na base 16, o degrau `--text-control-sm`; 0.875 = 14px, o
  // `--text-control`, que é o tamanho do título do desenho.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);
  const axisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };
  return {
    // Oito séries, e a ORDEM não é arbitrária: cada posição é a cor que mais se
    // afasta em matiz de todas as anteriores. Reordenar não troca "só a cor" —
    // aproxima séries vizinhas e derruba a distância que separa uma da outra.
    // Por isso a lista segue a numeração dos tokens, sem exceção.
    color: [
      hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'),
      hsl('chart-5'), hsl('chart-6'), hsl('chart-7'), hsl('chart-8'),
    ],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily, fontSize: bodySize },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600, fontSize: titleSize } },
    legend: { textStyle: { color: muted, fontSize: bodySize } },
    tooltip: {
      backgroundColor: card,
      borderColor: border,
      textStyle: { color: fg, fontSize: bodySize },
    },
    axisPointer: { lineStyle: { color: hsl('primary', 0.5) } },
    categoryAxis: axisStyle,
    valueAxis: axisStyle,
    logAxis: axisStyle,
    timeAxis: axisStyle,
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta. A
    // paleta antiga tinha de servir à página quase branca E ao fundo quase preto
    // com a mesma cor, e ficava em torno de 2:1 contra o fundo — sozinha não
    // sustentava o critério. Com variante por modo (7.32 no pior caso no claro,
    // 6.83 no escuro), a cor de série já passa. O CONTORNO em --foreground fica
    // assim mesmo, e por outro motivo: é ele que separa duas formas ADJACENTES
    // uma da outra, o que nenhuma medida contra o fundo cobre. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // A faixa do funil é forma cheia como a barra e a fatia, e pelo mesmo
    // motivo leva contorno: ele separa uma etapa da ETAPA VIZINHA, que encosta
    // nela, e nenhuma medida contra o fundo cobre isso. A chave é o próprio
    // nome do tipo de série — é assim que a lib casa tema com série.
    funnel: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O radar traz EIXOS PRÓPRIOS, e é por isso que ele precisa de bloco aqui.
    //
    // Os outros tipos desenham no cartesiano ou não desenham em eixo nenhum, e
    // `categoryAxis`/`valueAxis` acima já os cobrem. O radar tem os seus, com
    // nomes de chave só dele (`axisName`, `axisLine`, `splitLine`,
    // `splitArea`), e sem esta entrada eles saem com o padrão da lib: cinzas
    // fixos, alheios ao tema, ao modo e à fonte. Um gráfico do design system
    // com eixos que não são do design system.
    //
    // Um bloco só serve a duas coisas: `radar` é nome de série E nome de
    // componente na lib, e a resolução de tema cai no mesmo lugar para os dois.
    // Cada um lê o que lhe diz respeito — o componente pega eixo, grade e nome
    // do eixo; a série pega o contorno do símbolo —, e o que sobra de um lado é
    // ignorado do outro.
    //
    // O NOME DO EIXO é texto, então segue a regra do texto: cor de
    // `--muted-foreground`, como o rótulo do eixo cartesiano e a legenda, e
    // tamanho no mesmo degrau MEDIDO — nunca pixel escolhido, senão ele para de
    // crescer com a fonte do navegador (WCAG 1.4.4).
    //
    // A GRADE e o EIXO usam `--border`, nas mesmas duas intensidades do
    // cartesiano: o traço que sai do centro é o eixo (0.6), os anéis são grade
    // (0.3). Assim o radar e o gráfico de barras ao lado dele desenham a mesma
    // malha.
    //
    // SPLITAREA DESLIGADO, e por dois motivos que se somam. O primeiro é de
    // desenho: o padrão da lib alterna DUAS faixas cinza entre os anéis, cores
    // cravadas que não vêm de token nenhum — sobre o fundo claro elas viram um
    // degrau que disputa com o preenchimento translúcido do polígono, e sobre o
    // fundo escuro viram uma lavagem clara por baixo do desenho inteiro. A
    // malha que informa já está nos anéis, em `--border`; a faixa não acrescenta
    // leitura, só um segundo fundo que o tema não escolheu. É a mesma decisão
    // que o eixo cartesiano aqui em cima já toma. O segundo é de medição, e foi
    // verificado plantando o defeito: uma das duas faixas sai com
    // `fill-opacity="0"`, e essa marca é justamente como as stories reconhecem
    // o fundo da legenda. Com a faixa ligada há DOIS retângulos transparentes
    // na tela e a espera de assentamento nunca fecha.
    radar: {
      axisName: { color: muted, fontSize: bodySize },
      axisLine: { lineStyle: { color: hsl('border', 0.6) } },
      splitLine: { lineStyle: { color: hsl('border', 0.3) } },
      splitArea: { show: false, areaStyle: { color: ['transparent'] } },
      // Contorno do símbolo de vértice, pela mesma porta do traçado: no radar,
      // como na linha, a forma de dado é o VÉRTICE — o polígono já é delimitado
      // pelo próprio traço, na cor da série, e é o vértice que precisa se
      // separar do que está por baixo dele.
      itemStyle: { borderColor: fg, borderWidth: 2 },
    },
  };
}

// Registra/atualiza o tema. Idempotente.
function applyTheme() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerTheme(THEME_NAME, buildNortearTheme() as any);
}

// ─── Option builders ─────────────────────────────────────────────────────────
// Helpers para os cinco tipos cobertos pelas stories. Para mais customização,
// passar `option` direto.

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

/**
 * Símbolo de ponto, na ordem das séries; a 6ª volta à 1ª.
 *
 * A trama do `decal` cobre a metade da WCAG 1.4.1 que vale para forma cheia —
 * barra e fatia. Em linha e área não há área a hachurar: o que resta é o
 * símbolo do ponto e o desenho do traço. Com todos os pontos em círculo, a
 * única pista de qual série é qual era a cor.
 */
const SYMBOLS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const DASHES: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

/**
 * Tamanho do símbolo de ponto, em pixels.
 *
 * Não é enfeite de 6 para 9: em 6px um triângulo e um losango têm a mesma
 * silhueta a olho, e a distinção por forma — que é justamente o que substitui a
 * cor — não chega a existir.
 */
const SYMBOL_SIZE = 9;

/**
 * Nome que o construtor inventa para a série quando o dado vem na forma
 * simples (pares de rótulo e valor). É MARCADOR, não rótulo: na alternativa
 * textual ele dá lugar ao rótulo de valor, que está no idioma da página.
 */
const DEFAULT_SERIES_NAME = 'value';

interface OptionsBase {
  data?: ChartDataPoint[];
  xAxis?: Array<string | number>;
  series?: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}

function buildAxisOption(type: 'bar' | 'line' | 'area', o: OptionsBase): echarts.EChartsCoreOption {
  const xAxisData = o.xAxis ?? o.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    o.series ?? (o.data ? [{ name: DEFAULT_SERIES_NAME, data: o.data.map((d) => d.value) }] : []);
  const showLegend = o.showLegend ?? seriesData.length > 1;
  return {
    // Sem `textStyle` cravado: o tamanho do título vem do tema, que o mede a
    // partir da fonte raiz. Um `fontSize: 14` aqui venceria a medição e o texto
    // do desenho pararia de crescer com a fonte do navegador.
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
      // Símbolo e traço próprios por posição de série: tirando toda a cor, a
      // forma do ponto e o desenho do traço continuam separando as séries.
      symbol: type === 'bar' ? undefined : SYMBOLS[i % SYMBOLS.length],
      symbolSize: SYMBOL_SIZE,
      ...(type === 'bar'
        ? {}
        : { lineStyle: { type: DASHES[i % DASHES.length], ...(s.color ? { color: s.color } : {}) } }),
      ...(s.color ? { itemStyle: { color: s.color } } : {}),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
      ...(type === 'bar' ? { itemStyle: { borderRadius: [4, 4, 0, 0], ...(s.color ? { color: s.color } : {}) } } : {}),
    })),
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ARIA,
  };
}

export const buildBarOption  = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('bar',  o);
export const buildLineOption = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('line', o);
export const buildAreaOption = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('area', o);

export function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): echarts.EChartsCoreOption {
  return {
    title: o.title ? { text: o.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
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
 * Recebe a MESMA forma de dado da pizza — pares de rótulo e valor, sem eixo —,
 * porque aqui também não há categoria contínua: há uma ordem de etapas. O que
 * o desenho comunica é a LARGURA de cada faixa em relação à primeira, e largura
 * não se lê em texto: por isso a alternativa textual ganha a terceira coluna
 * (ver `chartTableFromOption`), pelo mesmo raciocínio da participação da rosca.
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
 * - Nada de `textStyle`: o tamanho do texto vem do tema, que o MEDE a partir da
 *   fonte raiz. Um número cravado aqui venceria a medição e o desenho pararia
 *   de crescer com a fonte do navegador (WCAG 1.4.4).
 */
export function buildFunnelOption(o: { data: ChartDataPoint[]; title?: string }): echarts.EChartsCoreOption {
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
 * de máximo da alternativa textual os lê (ver `chartTableFromOption`): uma
 * segunda lista de eixos passada à parte seria uma segunda verdade sobre a
 * mesma escala.
 */
export function buildRadarOption(o: {
  axes: ChartRadarAxis[];
  series: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}): echarts.EChartsCoreOption {
  const seriesData = o.series;
  const showLegend = o.showLegend ?? seriesData.length > 0;
  return {
    // Sem `textStyle` cravado: o tamanho do título vem do tema, que o mede a
    // partir da fonte raiz (WCAG 1.4.4).
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
        symbol: SYMBOLS[i % SYMBOLS.length],
        symbolSize: SYMBOL_SIZE,
        lineStyle: {
          type: DASHES[i % DASHES.length],
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

// ─── Alternativa textual ─────────────────────────────────────────────────────
//
// Um `<svg>` mudo é conteúdo perdido. O que o leitor de tela, a busca do
// navegador e o copiar-e-colar alcançam não é o desenho: é a TABELA — os mesmos
// números, em forma que não depende de enxergar. Ela é emitida sempre, e
// `showData` só decide se ela também aparece para quem enxerga.
//
// A lib não gera nada disso. `aria.label` produz uma frase em inglês dentro de
// um elemento que o próprio `role="img"` poda da árvore; a tabela é do
// componente.

/** Rótulos das colunas que a tabela monta sozinha. */
export interface ChartTableLabels {
  categoryLabel: string;
  valueLabel: string;
  shareLabel: string;
  /**
   * Cabeçalho da coluna de máximo — só o radar a tem.
   *
   * Mesma família da coluna de participação, e pelo mesmo motivo: o desenho
   * comunica uma RAZÃO (o vértice sobre o raio), e o valor sozinho não a
   * carrega. A diferença é que aqui o denominador muda de eixo para eixo, então
   * ele não cabe num rodapé — precisa de uma célula por linha.
   */
  maxLabel: string;
}

/** Cabeçalho e linhas já formatados — a primeira célula de cada linha é o `th`. */
export interface ChartTable {
  header: string[];
  rows: string[][];
}

/** Número curto o bastante para caber numa célula, sem depender de locale. */
export function formatChartValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

type RawSeries = { name?: string; type?: string; data?: unknown[] };

function seriesOf(option: echarts.EChartsCoreOption): RawSeries[] {
  const series = (option as { series?: unknown }).series;
  return (Array.isArray(series) ? series : series ? [series] : []) as RawSeries[];
}

/** O número que a lib desenharia — a entrada aceita número cru ou objeto. */
function numberOf(entry: unknown): number | null {
  const raw = entry !== null && typeof entry === 'object'
    ? (entry as { value?: unknown }).value
    : entry;
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Célula de valor. Buraco no dado vira travessão, e não uma célula vazia. */
function cellOf(entry: unknown): string {
  const value = numberOf(entry);
  return value === null ? '—' : formatChartValue(value);
}

function textOf(entry: unknown): string {
  if (entry !== null && typeof entry === 'object') {
    const value = (entry as { value?: unknown }).value;
    return String(value ?? '');
  }
  return String(entry ?? '');
}

/** Categorias do eixo; sem eixo declarado, a posição vira o rótulo. */
function categoriesOf(option: echarts.EChartsCoreOption, count: number): string[] {
  const axis = (option as { xAxis?: unknown }).xAxis;
  const first = (Array.isArray(axis) ? axis[0] : axis) as { data?: unknown[] } | undefined;
  const data = first?.data;
  if (Array.isArray(data) && data.length > 0) return data.map(textOf);
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

/**
 * Os eixos do radar, lidos do `indicator` do próprio option.
 *
 * Mesma fonte que a lib usa para desenhar os anéis e escrever o nome de cada
 * eixo, pela mesma razão de `categoriesOf`: o teto que a escala usa e o teto
 * que a coluna escreve têm de ser o MESMO número. Uma lista paralela passada ao
 * container seria uma segunda verdade sobre a mesma escala, e as duas divergem
 * no primeiro dado que mudar.
 *
 * Sem nome escrito, a posição vira o rótulo; sem teto, a coluna sai com
 * travessão em vez de inventar um número.
 */
function radarAxesOf(option: echarts.EChartsCoreOption): { label: string; max: number | null }[] {
  const block = (option as { radar?: unknown }).radar;
  const first = (Array.isArray(block) ? block[0] : block) as { indicator?: unknown[] } | undefined;
  const indicator = first?.indicator;
  if (!Array.isArray(indicator)) return [];
  return indicator.map((entry, iEntry) => {
    const shape = (entry ?? {}) as { name?: unknown; max?: unknown };
    const max = typeof shape.max === 'number' && Number.isFinite(shape.max) ? shape.max : null;
    return { label: String(shape.name ?? iEntry + 1), max };
  });
}

/**
 * Os mesmos números do desenho, lidos do próprio option.
 *
 * Ler do option — e não de um dado paralelo passado à parte — é o que garante
 * que a tabela não possa divergir do que está desenhado: as duas saem da mesma
 * fonte. É também o que mantém a API declarativa desta stack intacta.
 */
export function chartTableFromOption(
  option: echarts.EChartsCoreOption,
  labels: ChartTableLabels,
): ChartTable {
  const series = seriesOf(option);

  // O radar é o único tipo com uma coluna ENTRE a categoria e as séries, e ela
  // é o teto do eixo.
  //
  // A razão é a mesma que deu ao funil a coluna de participação — quando a
  // informação mora numa dimensão visual, o texto precisa carregá-la —, mas
  // aqui o denominador não é um só: cada eixo tem a sua escala. Um 7 num eixo
  // que vai a 10 é um vértice quase no anel de fora; o mesmo 7 num eixo que vai
  // a 100 quase encosta no centro. Sem esta coluna, as duas linhas escreveriam
  // "7" e a tabela deixaria de descrever o polígono que está na tela.
  //
  // Uma linha por EIXO, e não por série: é o eixo que tem nome próprio e teto
  // próprio, e cada série ocupa uma coluna à direita — a mesma forma da tabela
  // de barra e linha, com uma coluna a mais no começo. Nome e teto saem do
  // `indicator` do próprio option, que é de onde a lib os desenha.
  const radar = series.find((s) => s.type === 'radar');
  if (radar) {
    const axes = radarAxesOf(option);
    const polygons = (radar.data ?? []) as unknown[];
    return {
      header: [
        labels.categoryLabel,
        labels.maxLabel,
        ...polygons.map((polygon, iPolygon) => {
          const name = polygon !== null && typeof polygon === 'object'
            ? String((polygon as { name?: unknown }).name ?? '')
            : '';
          return name || `${labels.valueLabel} ${iPolygon + 1}`;
        }),
      ],
      rows: axes.map((axis, iAxis) => [
        axis.label,
        cellOf(axis.max),
        ...polygons.map((polygon) => {
          const values = polygon !== null && typeof polygon === 'object'
            ? (polygon as { value?: unknown }).value
            : undefined;
          return cellOf(Array.isArray(values) ? values[iAxis] : undefined);
        }),
      ]),
    };
  }

  // A pizza mede parte contra o todo: a coluna de participação é o que a fatia
  // comunica pelo ângulo, e sem ela a tabela contaria menos que o desenho.
  const pie = series.find((s) => s.type === 'pie');
  if (pie) {
    const points = (pie.data ?? []) as unknown[];
    const total = points.reduce<number>((sum, p) => sum + Math.max(0, numberOf(p) ?? 0), 0);
    return {
      header: [labels.categoryLabel, labels.valueLabel, labels.shareLabel],
      rows: points.map((point) => {
        const value = Math.max(0, numberOf(point) ?? 0);
        const name = point !== null && typeof point === 'object'
          ? String((point as { name?: unknown }).name ?? '')
          : '';
        const share = total > 0 ? `${Math.round((value / total) * 1000) / 10}%` : '—';
        return [name, cellOf(point), share];
      }),
    };
  }

  // O funil mede cada etapa contra a PRIMEIRA, e não contra a soma: o que o
  // desenho comunica é a largura da faixa, que nasce da razão para o topo do
  // funil. Largura não se lê em texto, então ela vira coluna — é o mesmo
  // raciocínio da participação da rosca, com outro denominador.
  const funnel = series.find((s) => s.type === 'funnel');
  if (funnel) {
    const stages = (funnel.data ?? []) as unknown[];
    const first = Math.max(0, numberOf(stages[0]) ?? 0);
    return {
      header: [labels.categoryLabel, labels.valueLabel, labels.shareLabel],
      rows: stages.map((stage) => {
        const value = Math.max(0, numberOf(stage) ?? 0);
        const name = stage !== null && typeof stage === 'object'
          ? String((stage as { name?: unknown }).name ?? '')
          : '';
        const share = first > 0 ? `${Math.round((value / first) * 1000) / 10}%` : '—';
        return [name, cellOf(stage), share];
      }),
    };
  }

  const columns = series.reduce((max, s) => Math.max(max, s.data?.length ?? 0), 0);
  return {
    header: [
      labels.categoryLabel,
      ...series.map((s) => (!s.name || s.name === DEFAULT_SERIES_NAME ? labels.valueLabel : s.name)),
    ],
    rows: categoriesOf(option, columns).map((category, iCategory) => [
      category,
      ...series.map((s) => cellOf(s.data?.[iCategory])),
    ]),
  };
}

// ─── ChartContainer ──────────────────────────────────────────────────────────

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  option: echarts.EChartsCoreOption;
  renderer?: 'svg' | 'canvas';
  /**
   * Altura do DESENHO em pixels.
   *
   * Existe porque a documentação mandava, havia meses, definir a altura por uma
   * classe utilitária de altura fixa do Tailwind — vocabulário que saiu do
   * projeto e não tem efeito nenhum em runtime. A altura é dado do consumidor,
   * então é entrada, não classe; sem valor vale o `min-height` de `.nds-chart`.
   *
   * Vai no elemento em que a lib desenha, e não no bloco: escondida, a tabela
   * de dados não ocupa altura nenhuma e o bloco continua medindo o mesmo; À
   * VISTA, ela cresce por baixo do desenho em vez de ser recortada por uma
   * altura que só o desenho pediu.
   */
  height?: number;
  /** Frase mostrada no lugar do gráfico quando não há série com dado. */
  emptyLabel?: string;
  /**
   * Torna a tabela de dados visível para todo mundo, não só para leitor de
   * tela. A tabela é emitida de qualquer forma — isto decide se ela aparece.
   */
  showData?: boolean;
  /** Cabeçalho da primeira coluna da tabela — a que nomeia cada linha. */
  categoryLabel?: string;
  /** Cabeçalho da coluna de valor quando a série não tem nome próprio. */
  valueLabel?: string;
  /**
   * Cabeçalho da coluna de participação — a que escreve o que o desenho diz
   * pela forma. Na rosca é a fatia contra o todo; no funil, a etapa contra a
   * primeira. O rótulo é o mesmo porque a leitura é a mesma: quanto disto
   * aquilo representa.
   */
  shareLabel?: string;
  /**
   * Cabeçalho da coluna de máximo — só o radar a tem.
   *
   * Existe pelo mesmo motivo da coluna de participação: o desenho comunica uma
   * RAZÃO, e o valor sozinho não a carrega. A diferença é o denominador, que
   * aqui muda de eixo para eixo e por isso precisa de uma célula por linha.
   */
  maxLabel?: string;
}

export function ChartContainer({
  option,
  renderer = 'svg',
  height,
  emptyLabel = CHART_EMPTY_LABEL,
  showData = false,
  categoryLabel = 'Categoria',
  valueLabel = 'Valor',
  shareLabel = 'Participação',
  maxLabel = 'Máximo',
  className,
  style,
  // Desestruturado, e não deixado no `rest`, porque o rótulo NÃO vai mais no
  // bloco: ele acompanha o `role="img"` até o elemento do desenho.
  'aria-label': ariaLabelProp,
  ...rest
}: ChartContainerProps) {
  // Recolore quando o tema do <html> muda (marca / escuro / densidade / fonte).
  //
  // `registerTheme` só atualiza o REGISTRO global: a instância guarda o tema já
  // resolvido desde o `init`, e nem `setOption` nem uma re-renderização o
  // relêem. O caminho anterior era remontar o gráfico inteiro por uma `key`, o
  // que recolore mas PISCA — e a documentação promete o contrário. `setTheme`
  // relê o registro e repinta no lugar, sem recriar nó nenhum.
  const chartRef = React.useRef<ReactEChartsCore>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Contador de troca de tema.
  //
  // O option carrega UMA cor resolvida — a da trama do decal, que sai de
  // `--background` — e `setTheme` relê só o registro do tema, nunca o option.
  // Sem este contador a trama ficaria com o fundo do tema anterior depois da
  // troca, que é o mesmo defeito de sempre num lugar novo.
  const [themeVersion, setThemeVersion] = React.useState(0);

  // Sem série com dado não existe desenho a anunciar: entra a frase, como no
  // Vanilla (referência). O `min-height` de `.nds-chart` segura o bloco, e é
  // por isso que a página não salta quando o dado chega.
  const vazio = isChartOptionEmpty(option);

  // Registra o tema AINDA NA RENDERIZAÇÃO, antes de o filho montar.
  //
  // O registro é global e guarda o último tema calculado. Registrando só no
  // efeito — que roda depois da montagem do filho — o gráfico nasce com a
  // paleta de quem renderizou por último: uma tela clara herdava as cores da
  // tela escura anterior, e o contorno das formas saía a 1.04:1 do fundo. O
  // ciclo é idempotente, então registrar duas vezes não custa nada.
  React.useMemo(() => applyTheme(), []);

  React.useEffect(() => {
    applyTheme();
    const repaint = () => {
      applyTheme();
      chartRef.current?.getEchartsInstance()?.setTheme(THEME_NAME);
      // Repõe a trama na cor do fundo NOVO: `setTheme` não a alcança.
      setThemeVersion((v) => v + 1);
    };
    const observer = new MutationObserver(repaint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Aumentar a fonte do navegador não mexe na classe do documento — mexe na
    // CAIXA. Os degraus tipográficos do desenho saem da fonte raiz medida
    // (WCAG 1.4.4), e sem reler o tema o rótulo do eixo ficaria com o tamanho
    // de antes: a página inteira cresceria e só o gráfico não.
    //
    // A guarda de tamanho de fonte é o que impede o laço: repintar mexe no
    // layout e o layout notifica o observador de novo. Sem ela, cada repintura
    // viraria uma volta a mais.
    let lastFontSize = rootFontSize();
    const resizeObserver = new ResizeObserver(() => {
      const fontSize = rootFontSize();
      if (fontSize === lastFontSize) return;
      lastFontSize = fontSize;
      repaint();
    });
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [vazio]);

  // Deriva um aria-label do título do option caso o consumidor não tenha fornecido um.
  const derivedLabel = React.useMemo(() => {
    const t = (option as { title?: { text?: string } | { text?: string }[] }).title;
    if (!t) return undefined;
    if (Array.isArray(t)) return t[0]?.text;
    return t.text;
  }, [option]);
  const ariaLabel = ariaLabelProp ?? derivedLabel ?? 'Gráfico';

  const table = React.useMemo(
    () => chartTableFromOption(option, { categoryLabel, valueLabel, shareLabel, maxLabel }),
    [option, categoryLabel, valueLabel, shareLabel, maxLabel],
  );

  // A trama entra AQUI, e não no construtor: é o container que sabe qual tema
  // está no documento agora. `themeVersion` é dependência de propósito — ela é o
  // único sinal de que o fundo mudou.
  const hatchedOption = React.useMemo(
    () => withHatchPatterns(option),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [option, themeVersion],
  );

  return (
    <div data-slot="chart" className={cn('nds-chart', className)} style={style} {...rest}>
      {vazio ? (
        // Sem `role="img"` aqui de propósito: o papel PODA a subárvore da
        // árvore de acessibilidade, e a frase que explica a ausência de dado é
        // justamente o conteúdo — ficaria escondida atrás de um rótulo
        // genérico.
        <p className="nds-chart-empty">{emptyLabel}</p>
      ) : (
        <>
          {/* O elemento em que a lib desenha. É ele — e não o bloco em volta —
              que leva o papel de imagem e o rótulo, porque `role="img"` poda a
              subárvore: no bloco, a tabela de dados ficaria escondida junto e a
              alternativa textual sumiria. Aqui o desenho é anunciado como uma
              imagem com rótulo e a tabela continua exposta, ao lado. */}
          <div
            ref={canvasRef}
            data-slot="chart-canvas"
            role="img"
            aria-label={ariaLabel}
            style={{ width: '100%', height: height === undefined ? '100%' : height }}
          >
            <ReactEChartsCore
              ref={chartRef}
              // A instância que DESENHA é esta — a mesma que `echarts.use()`
              // registrou lá em cima. Ver o comentário do import.
              echarts={echarts}
              option={hatchedOption}
              theme={THEME_NAME}
              opts={{ renderer }}
              style={{ width: '100%', height: '100%' }}
              notMerge={false}
              lazyUpdate
            />
          </div>

          {/* Alternativa textual equivalente. Não é enfeite: é o mesmo dado, em
              forma que leitor de tela, busca e cópia alcançam.

              A caixa que rola só existe quando a tabela está À VISTA, e aí ela
              é alcançável por teclado — como no primitivo Table. Fora da tela a
              tabela mede 1px, então o overflow automático a tornaria uma região
              rolável sem foco (scrollable-region-focusable), sem nada para
              rolar: colunas que só existem para quem usa mouse, num elemento
              que ninguém enxerga. */}
          <div
            data-slot="chart-data"
            className={showData ? 'nds-table-wrapper' : 'nds-sr-only'}
            tabIndex={showData ? 0 : undefined}
          >
            <table className="nds-table">
              <caption>{ariaLabel}</caption>
              <thead>
                <tr>
                  {table.header.map((column, iColumn) => (
                    <th key={`${column}-${iColumn}`} scope="col">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, iRow) => (
                  <tr key={`${row[0]}-${iRow}`}>
                    <th scope="row">{row[0]}</th>
                    {row.slice(1).map((cell, iCell) => (
                      <td key={iCell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
