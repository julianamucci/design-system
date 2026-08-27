// ─── Chart — ECharts factory ─────────────────────────────────────────────────
// Container responsivo wrappando Apache ECharts. Suporta bar / line / area /
// pie / funnel / radar.
//
// API (mantém shape próximo ao anterior pra compat com stories):
//   createChart({ type, data, height, ... }) → HTMLElement
//
// O elemento retornado pode ser appendado ao DOM normalmente. Init do echarts
// é deferida até o container estar conectado (Storybook anexa em seguida).
//
// Para uso avançado (multi-série, customização full do option), passar
// `series` em vez de `data`.
//
// ─── Acessibilidade: as quatro decisões ──────────────────────────────────────
//
// 1. ALTERNATIVA TEXTUAL EQUIVALENTE — a fábrica emite, SEMPRE, uma `<table>`
//    de verdade com os mesmos números do desenho: `<th scope="col">` por série,
//    `<th scope="row">` por categoria, `<caption>` com a descrição do gráfico.
//    Por padrão ela é `.nds-sr-only` — existe para leitor de tela, para a busca
//    da página e para quem lê o DOM; `showData` a torna visível para todo
//    mundo. A lib NÃO gera essa tabela: o que ela oferece é `aria.label`, uma
//    frase montada em inglês e escrita num elemento que o próprio `role="img"`
//    poda. Um desenho mudo é conteúdo perdido — a tabela É o conteúdo.
//
// 2. `role="img"` + `aria-label` vão no elemento do DESENHO, não no bloco
//    `.nds-chart` em volta. O papel de imagem PODA a subárvore da árvore de
//    acessibilidade: posto no bloco, ele esconderia a tabela junto e a
//    alternativa textual sumiria. Posto no elemento em que a lib desenha, o
//    desenho é anunciado como uma imagem com rótulo e a tabela continua
//    exposta, ao lado dele.
//
// 3. A INFORMAÇÃO NÃO VIVE NA COR. `aria.decal.show` sobrepõe uma trama a cada
//    série, e a legenda traz o nome escrito. A trama alcança toda forma
//    PREENCHIDA — barra, fatia, faixa de funil e polígono de radar —, porque é
//    o preenchimento que ela hachura. A trama é DESENHADA AQUI, na cor
//    do fundo — a lista padrão da lib nasce em preto translúcido e mal se
//    separa do próprio preenchimento (medido entre 1.26 e 1.57 contra as oito
//    cores de série, nos três temas): declarada, e não entregue. Na cor do
//    fundo a mesma hachura mede de 6.83 a 11.02. Em `line`/`area` a trama não
//    alcança — é de preenchimento, e traçado não tem preenchimento —, então
//    cada série ganha símbolo de ponto próprio (círculo, quadrado, triângulo,
//    losango, seta) e desenho de traço próprio. Retirando toda a cor, o gráfico
//    continua legível (WCAG 1.4.1).
//
//    Em `scatter` a trama ALCANÇA o símbolo e mesmo assim é desligada, que é o
//    caso mais sutil dos três. A hachura é um ladrilho que se repete; num
//    símbolo de 14px cabe uma repetição ou duas, e duas tramas diferentes saem
//    indistinguíveis — declarada, aplicada, e ainda assim sem separar nada.
//    Ali quem separa as séries é a forma do símbolo, e ela é o sinal primário,
//    não o reforço: é a única marca que o tipo desenha.
//
// 4. CONTRASTE (WCAG 1.4.11). Toda forma de dado — barra, fatia, faixa,
//    símbolo — é
//    contornada com `hsl(var(--foreground))`, que passa de 3:1 contra o fundo
//    em qualquer tema. O contorno vem do tema
//    (`bar`/`line`/`pie`/`funnel`/`radar` em
//    `@/lib/echarts-theme`) e é ele que delimita o objeto gráfico, e não a cor
//    de série. Ele nasceu quando a paleta ficava em torno de 2:1 contra o
//    fundo; com `--chart-1` a `--chart-8` por modo, o pior caso passou a 7.32
//    no claro e 6.83 no escuro, e o contorno fica porque separa uma forma da
//    VIZINHA — coisa que a medida contra o fundo não cobre.

import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts';
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

import { THEME_NAME, hsl, registerNortearTheme, rootFontSize, watchTheme } from '@/lib/echarts-theme';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';
import {
  nestInnerLabel,
  nestLabelLine,
  nestOuterLabel,
  valueLabelStyle,
  type NestLabelTokens,
} from '@shared/primitives/chart-nest-labels';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';

// Bootstrap dos módulos — idempotente. Tree-shake friendly.
//
// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada.
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
  BarChart, LineChart, PieChart, FunnelChart, RadarChart, ScatterChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent, RadarComponent,
  SVGRenderer, CanvasRenderer,
]);

/**
 * Tramas do decal, uma por posição de série; a 6ª volta à 1ª.
 *
 * A lista padrão da lib não serve, e o número diz por quê: as tramas dela
 * nascem em `rgba(0, 0, 0, 0.2)`, que sobre as oito cores de série mede entre
 * 1.26 e 1.57 contra o PRÓPRIO preenchimento, nos três temas — no pior caso,
 * imperceptível. A hachura é o que mantém a série distinguível quando a cor sai
 * de cena (WCAG 1.4.1); com esse contraste ela estava declarada e não entregue.
 * Traçada na cor do FUNDO, a mesma hachura mede de 6.83 a 11.02.
 *
 * São CINCO desenhos — diagonal ascendente, pontos, diagonal descendente,
 * horizontais, grade — para OITO cores, e a 6ª posição recomeça a lista. Não é
 * descuido: forma sem cor é um vocabulário de três listas que andam juntas
 * (trama, símbolo de ponto, desenho de traço), e as outras duas também têm
 * cinco entradas. Estender só esta faria a série 6 se distinguir da 1 no
 * gráfico de barras e não no de linhas — a paleta cresceu para 8 por causa de
 * contraste contra o fundo, não para autorizar 8 séries. Passar de cinco é uma
 * decisão de desenho, e vale para as três listas ao mesmo tempo.
 */
function tramas(cor: string): Record<string, unknown>[] {
  return [
    { color: cor, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 },
    { color: cor, symbol: 'circle', dashArrayX: [[8, 8], [0, 8, 8, 0]], dashArrayY: [6, 0], symbolSize: 0.8 },
    { color: cor, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: -Math.PI / 4 },
    { color: cor, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: 0 },
    { color: cor, dashArrayX: [[1, 0], [1, 6]], dashArrayY: [1, 0, 6, 0], rotation: Math.PI / 4 },
  ];
}

/**
 * Bloco `aria` comum aos dois formatos de option.
 *
 * `label.enabled: false` desliga a descrição gerada pela lib de propósito: ela
 * nasce em inglês e mora num elemento interno que o `role="img"` do desenho
 * poda da árvore de acessibilidade. Quem carrega a alternativa textual é o
 * `aria-label` autoral, no idioma da página, mais a tabela de dados.
 *
 * É função, e não constante, porque a trama carrega uma cor RESOLVIDA: o valor
 * de `--background` no momento em que o option é montado. Congelá-lo numa
 * constante de módulo deixaria a hachura com a cor do tema que estava em vigor
 * quando o arquivo carregou.
 */
function ariaBlock(): Record<string, unknown> {
  return { enabled: true, label: { enabled: false }, decal: { show: true, decals: tramas(hsl('background', HATCH_OPACITY)) } };
}

/**
 * As cores e o degrau do rótulo da rosca aninhada, resolvidos do tema em vigor.
 *
 * Vive ao lado de `ariaBlock`, que resolve a cor da trama pelo mesmo caminho e
 * no mesmo momento: os dois leem o tema que está no documento AGORA, e por isso
 * o option é reconstruído quando o tema muda.
 *
 * O degrau tipográfico sai da fonte raiz, não de um pixel cravado — o rótulo é
 * texto e cresce com a fonte do navegador (WCAG 1.4.4).
 */
function nestLabelTokens(): NestLabelTokens {
  return {
    foreground: hsl('foreground'),
    background: hsl('background'),
    border: hsl('border'),
    muted: hsl('muted'),
    mutedForeground: hsl('muted-foreground'),
    fontSize: Math.round(rootFontSize() * 0.75),
  };
}

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** Cabeçalhos padrão da tabela de dados, quando o chamador não os informa. */
export const CHART_CATEGORY_LABEL = 'Categoria';
export const CHART_VALUE_LABEL = 'Valor';
export const CHART_SHARE_LABEL = 'Participação';
export const CHART_MAX_LABEL = 'Máximo';
/** Cabeçalhos da dispersão: a série que o ponto integra e as duas grandezas. */
export const CHART_SERIES_LABEL = 'Série';
export const CHART_X_LABEL = 'X';
export const CHART_Y_LABEL = 'Y';
/** Cabeçalho da coluna de grupo — só a rosca aninhada a tem. */
export const CHART_GROUP_LABEL = 'Grupo';

/** Célula sem dado: a categoria existe, aquela série não a preenche. */
const NO_VALUE = '—';

/**
 * Símbolo de ponto, na ordem das séries — a série se distingue sem a cor.
 * A sexta volta à primeira.
 */
const SYMBOLS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const DASHES: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChartType =
  | 'bar' | 'line' | 'area' | 'pie' | 'pie-nest' | 'funnel' | 'radar' | 'scatter';

/** Forma simples: 1 série, label + value (compat com stories antigas). */
export interface ChartDataPoint {
  label: string;
  value: number;
  /**
   * A que grupo este ponto pertence — só a rosca ANINHADA usa.
   *
   * É o que torna a hierarquia declarável pelo lado de baixo: o anel de dentro
   * não é informado, é DERIVADO da soma dos pontos de cada grupo. Declarar os
   * dois abriria a porta para eles discordarem — um anel interno que não é a
   * soma do que está por fora —, e o desenho mentiria sem nada acusar.
   */
  group?: string;
}

/**
 * Um eixo do radar: o nome dele e o TETO da escala.
 *
 * Nome e teto andam juntos porque no radar eles não são separáveis: o que a
 * pessoa lê no desenho é a distância do vértice ao centro, e essa distância é o
 * valor DIVIDIDO pelo teto daquele eixo. Um 7 num eixo que vai a 10 e um 7 num
 * eixo que vai a 100 caem em pontos opostos do mesmo raio.
 */
export interface ChartRadarAxis {
  label: string;
  max: number;
}

/** Forma multi-série: x-axis + N séries com array de valores. */
export interface ChartSeries {
  name: string;
  /** Valores alinhados às categorias do eixo. A dispersão usa `points`. */
  data?: number[];
  /**
   * Pares `[x, y]` — a forma que a DISPERSÃO usa, no lugar de `data`.
   *
   * Existe como campo próprio, e não como outro formato aceito por `data`,
   * porque as duas formas respondem perguntas diferentes: `data` é uma lista de
   * valores ALINHADA a uma categoria do eixo, e um ponto de dispersão não tem
   * categoria — as duas coordenadas são medidas, e é a posição no plano que
   * carrega a informação. Um campo por forma deixa o tipo dizer isso, em vez de
   * uma união que o chamador precisa desempatar na cabeça.
   */
  points?: [number, number][];
  /** Cor explícita (sobrescreve token --chart-{n}). */
  color?: string;
}

export interface ChartOptions {
  type?: ChartType;
  /** Dataset simples (1 série). Use `series` p/ multi-série. */
  data?: ChartDataPoint[];
  /** Multi-série: labels do eixo X. */
  xAxis?: Array<string | number>;
  /** Multi-série: séries com dados alinhados ao xAxis. */
  series?: ChartSeries[];
  /**
   * Radar: os eixos e o TETO de cada um, na ordem em que aparecem no polígono.
   *
   * Declarar é o caminho recomendado, porque é aqui que mora a única informação
   * do radar que não está em nenhum outro lugar. Sem a lista, o nome do eixo sai
   * de `xAxis` (ou da posição) e TODOS os eixos passam a dividir um teto só — o
   * maior valor do conjunto —, que é uma escala honesta mas outra leitura.
   */
  radarAxes?: ChartRadarAxis[];
  /** Altura em px do desenho. Sem valor, vale o piso de `.nds-chart`. */
  height?: number;
  /** Renderer. Default 'svg' (alinha com o resto da stack standalone). */
  renderer?: 'svg' | 'canvas';
  /**
   * Título VISÍVEL, desenhado acima dos eixos. Não confundir com o nome
   * acessível: são conceitos distintos que coexistem nesta fábrica — o título
   * é pixel dentro do desenho, e serve de último recurso para o `aria-label`
   * quando ninguém descreve o gráfico.
   */
  title?: string;
  /** Mostrar legenda (default: true se >1 série). */
  showLegend?: boolean;
  /**
   * Torna a tabela de dados visível para todo mundo, não só para leitor de
   * tela. A tabela é emitida de qualquer jeito — isto decide se ela aparece.
   */
  showData?: boolean;
  /** Classe extra no container. */
  class?: string;
  /**
   * Descrição do gráfico: vira o nome acessível do desenho e a legenda
   * (`<caption>`) da tabela de dados.
   *
   * Um desenho sem descrição é conteúdo perdido — a factory não emitia
   * `role`/`aria-label` nenhum, e cada consumidor colava os dois à mão.
   */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /** Frase mostrada no lugar do gráfico quando não há dado. */
  emptyLabel?: string;
  /** Cabeçalho da primeira coluna da tabela de dados. */
  categoryLabel?: string;
  /** Nome da série na tabela quando o dado chega na forma simples. */
  valueLabel?: string;
  /**
   * Cabeçalho da coluna de participação — só a rosca e o funil a têm.
   *
   * É uma opção só porque é uma COLUNA só; o que muda entre os dois tipos não é
   * o título, é a referência da conta, e ela vem do desenho: na rosca a fatia é
   * parte de um total, no funil a etapa é o que sobrou da PRIMEIRA. Ver
   * `shareOf`.
   */
  shareLabel?: string;
  /**
   * Cabeçalho da coluna de máximo — só o radar a tem.
   *
   * Mesma família da coluna de participação, e pelo mesmo motivo: o desenho
   * comunica uma RAZÃO (o vértice sobre o raio), e o valor sozinho não a
   * carrega. A diferença é que aqui o denominador muda de eixo para eixo, então
   * ele não cabe num rodapé — precisa de uma célula por linha.
   */
  maxLabel?: string;
  /**
   * Cabeçalho da primeira coluna da dispersão: qual série o ponto integra.
   *
   * Não reaproveita `categoryLabel` porque não é categoria — a dispersão não
   * tem eixo de categorias, e a coluna nomeia a SÉRIE. Chamá-la de "Categoria"
   * ensinaria errado quem lê a tabela por leitor de tela.
   */
  seriesLabel?: string;
  /**
   * Cabeçalho da coluna de grupo — só a rosca aninhada a tem.
   *
   * Não reaproveita `categoryLabel` porque as duas coexistem na mesma tabela:
   * uma nomeia o anel de dentro e a outra o de fora, e chamar as duas de
   * "Categoria" deixaria a tabela ambígua exatamente onde ela precisa ser
   * precisa.
   */
  groupLabel?: string;
  /**
   * Escrever o valor junto do dado, nos tipos de eixo.
   *
   * Sem valor declarado, aparece quando há UMA série só: com duas ou mais os
   * números se sobrepõem, e aí quem entrega o valor exato é a tabela.
   *
   * Existe como opção por causa do mini gráfico de tendência — ali o desenho é
   * adjetivo de um número que já está escrito ao lado, e repetir o valor dentro
   * de 48px de altura só suja.
   */
  showValues?: boolean;
  /**
   * Nomes das duas grandezas da dispersão — no eixo e na tabela.
   *
   * São a informação que o desenho passa pela POSIÇÃO, e posição não se lê em
   * texto. Sem eles a tabela sairia com duas colunas chamadas X e Y, que dizem
   * onde o ponto está e não o que ele mede. É a mesma família da coluna de
   * participação da rosca e da de máximo do radar.
   */
  xLabel?: string;
  yLabel?: string;
}

// ─── Normalização (uma só, para o desenho e para a tabela) ───────────────────
//
// Desenho e tabela leem daqui os MESMOS números. Duas normalizações separadas
// seriam duas verdades sobre o mesmo dado, e a divergência apareceria como uma
// tabela que não confere com o que está na tela.

/** Séries do gráfico. A forma simples vira uma série só, nomeada. */
function seriesOf(opts: ChartOptions): ChartSeries[] {
  const multi = opts.series;
  if (multi && multi.length > 0) return multi;
  const simple = opts.data;
  if (simple && simple.length > 0) {
    return [{ name: opts.valueLabel ?? CHART_VALUE_LABEL, data: simple.map((d) => d.value) }];
  }
  return [];
}

/**
 * Os pares `[x, y]` de uma série de dispersão.
 *
 * Existe pelo mesmo motivo de `seriesOf` e `radarAxesOf`: o desenho e a tabela
 * leem daqui os MESMOS pontos. Duas leituras separadas seriam duas verdades
 * sobre o mesmo dado.
 */
function pointsOf(serie: ChartSeries): [number, number][] {
  return serie.points ?? [];
}

/**
 * O anel de DENTRO da rosca aninhada: um arco por grupo, com a soma dos pontos.
 *
 * Derivado, nunca declarado — ver `ChartDataPoint.group`. A ordem é a de
 * PRIMEIRA APARIÇÃO dos pontos, e não a do tamanho: é ela que faz cada arco
 * externo cair dentro do arco do seu grupo. Reordenar por valor quebraria o
 * alinhamento angular, que é justamente o que comunica a hierarquia sem
 * depender da cor.
 *
 * Ponto sem grupo cai num grupo com o próprio rótulo: o desenho continua
 * somando o mesmo total, e o anel de dentro passa a ter um arco só para ele —
 * honesto, e visivelmente diferente de um agrupamento que ninguém declarou.
 */
function nestedGroupsOf(points: ChartDataPoint[]): ChartDataPoint[] {
  const order: string[] = [];
  const sums = new Map<string, number>();
  for (const point of points) {
    const group = point.group ?? point.label;
    if (!sums.has(group)) order.push(group);
    sums.set(group, (sums.get(group) ?? 0) + Math.max(0, point.value));
  }
  return order.map((label) => ({ label, value: sums.get(label) ?? 0 }));
}

/** Categorias do eixo. Sem rótulo declarado, a posição vira o rótulo. */
function categoriesOf(opts: ChartOptions): string[] {
  const axis = opts.xAxis;
  if (axis && axis.length > 0) return axis.map(String);
  const simple = opts.data;
  if (simple && simple.length > 0) return simple.map((d) => d.label);
  const longest = seriesOf(opts).reduce((max, s) => Math.max(max, (s.data ?? []).length), 0);
  return Array.from({ length: longest }, (_, i) => String(i + 1));
}

/**
 * Os eixos do radar: os declarados, ou uns derivados do próprio dado.
 *
 * Uma só função para o desenho e para a tabela, pela mesma razão de
 * `seriesOf`/`categoriesOf`: o teto que a escala usa e o teto que a coluna
 * escreve têm de ser o MESMO número, e duas derivações separadas seriam duas
 * verdades sobre a mesma escala.
 *
 * Sem lista declarada, todos os eixos dividem um teto só — o maior valor do
 * conjunto. Derivar um teto POR eixo (o maior valor daquele eixo) daria um
 * polígono que toca o anel de fora em todos os vértices sempre que houver uma
 * série só: verdadeiro na aritmética e vazio na leitura.
 */
function radarAxesOf(opts: ChartOptions): ChartRadarAxis[] {
  const declared = opts.radarAxes;
  if (declared && declared.length > 0) return declared;
  const ceiling = seriesOf(opts).reduce(
    (max, s) => (s.data ?? []).reduce((inner, value) => Math.max(inner, value), max),
    0,
  );
  return categoriesOf(opts).map((label) => ({ label, max: ceiling }));
}

// ─── Funções puras ────────────────────────────────────────────────────────────

/** Número curto o bastante para caber na célula, sem depender de locale. */
export function formatValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

/**
 * Participação de um valor sobre a REFERÊNCIA da leitura, em uma casa decimal.
 *
 * A conta é a mesma; a referência é que muda com o tipo, e é o desenho que a
 * escolhe. Na rosca a fatia é parte de um TOTAL — o círculo inteiro está na
 * tela, e é contra ele que a área de cada fatia se lê. No funil não há total à
 * vista: o que está na tela é a largura de cada faixa comparada à da PRIMEIRA,
 * e é essa razão que a coluna precisa escrever. Passar o total das etapas como
 * referência daria um número correto de aritmética e falso de leitura — não
 * descreveria faixa nenhuma.
 */
function shareOf(value: number, reference: number): string {
  if (reference <= 0) return NO_VALUE;
  return `${Math.round((Math.max(0, value) / reference) * 1000) / 10}%`;
}

/** A alternativa textual, em dado: cabeçalho e linhas prontos para a `<table>`. */
export interface ChartTable {
  header: string[];
  lines: string[][];
}

/**
 * Os mesmos números do desenho, em forma de tabela.
 *
 * Pura de propósito: o que a tabela DIZ é verificável sem navegador, e o que
 * vira nó do DOM continua sendo medido no DOM.
 */
export function buildChartTable(opts: ChartOptions): ChartTable {
  const categoryLabel = opts.categoryLabel ?? CHART_CATEGORY_LABEL;
  const type = opts.type ?? 'bar';

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
  // de barra e linha, com uma coluna a mais no começo.
  if (type === 'radar') {
    const axes = radarAxesOf(opts);
    const series = seriesOf(opts);
    return {
      header: [
        categoryLabel,
        opts.maxLabel ?? CHART_MAX_LABEL,
        ...series.map((s) => s.name),
      ],
      lines: axes.map((axis, index) => [
        axis.label,
        formatValue(axis.max),
        ...series.map((s) => {
          const value = s.data?.[index];
          return value === undefined ? NO_VALUE : formatValue(value);
        }),
      ]),
    };
  }

  // A dispersão não tem eixo de categorias: cada linha é um PONTO, e as duas
  // colunas de número são as duas grandezas que o desenho põe no plano.
  //
  // Uma linha por ponto, e não um resumo por grupo (quantos pontos, onde fica o
  // centro), porque resumo não é equivalente: quem lê a tabela perderia
  // exatamente o que o desenho mostra, que é ONDE cada ponto caiu. O resumo
  // descreveria a nuvem; a tabela precisa carregá-la.
  //
  // A primeira coluna nomeia a SÉRIE, e ela se repete a cada linha do mesmo
  // grupo — é o `<th scope="row">` que diz, ponto a ponto, a que grupo ele
  // pertence. Sem essa coluna a tabela viraria uma lista de pares sem dono, e o
  // agrupamento — que é a informação do desenho — sumiria do texto.
  if (type === 'scatter') {
    const series = seriesOf(opts);
    return {
      header: [
        opts.seriesLabel ?? CHART_SERIES_LABEL,
        opts.xLabel ?? CHART_X_LABEL,
        opts.yLabel ?? CHART_Y_LABEL,
      ],
      lines: series.flatMap((serie) =>
        pointsOf(serie).map((ponto) => [
          serie.name,
          formatValue(ponto[0]),
          formatValue(ponto[1]),
        ]),
      ),
    };
  }

  // O funil também não tem eixo: cada linha é uma etapa, na ordem do processo, e
  // a terceira coluna é a participação em relação à PRIMEIRA etapa.
  //
  // Essa coluna existe pelo mesmo motivo da participação da rosca: o que o
  // desenho comunica aqui é a LARGURA da faixa, e largura não se lê em texto. A
  // correspondência é exata, não aproximada — o construtor de option fixa
  // `min: 0` e a faixa vai de `minSize` a `maxSize` sobre a maior etapa, então a
  // largura de cada faixa dividida pela da primeira é o número desta coluna.
  if (type === 'funnel') {
    const stages = opts.data ?? [];
    // A entrada do processo é a primeira ETAPA, não a maior: reordenar por valor
    // trocaria qual etapa serve de referência, e o funil descreve um percurso,
    // não um ranking. É a mesma razão de `sort: 'none'` no desenho.
    const entry = stages[0]?.value ?? 0;
    return {
      header: [
        categoryLabel,
        opts.valueLabel ?? CHART_VALUE_LABEL,
        opts.shareLabel ?? CHART_SHARE_LABEL,
      ],
      lines: stages.map((p) => [p.label, formatValue(p.value), shareOf(p.value, entry)]),
    };
  }

  // A rosca ANINHADA tem duas colunas de nome: o grupo, que é o anel de dentro,
  // e a categoria, que é o de fora.
  //
  // Uma linha por ponto do anel EXTERNO, e não duas tabelas nem um bloco por
  // grupo. A participação do grupo não precisa de linha própria porque ela é
  // DERIVÁVEL — é a soma das participações dos pontos dele, que estão logo ali
  // na mesma coluna. Foi o teste que o radar não passou: lá o teto de cada eixo
  // não saía de nenhuma outra célula, e por isso virou coluna.
  if (type === 'pie-nest') {
    const points = opts.data ?? [];
    const total = points.reduce((sum, p) => sum + Math.max(0, p.value), 0);
    return {
      header: [
        opts.groupLabel ?? CHART_GROUP_LABEL,
        categoryLabel,
        opts.valueLabel ?? CHART_VALUE_LABEL,
        opts.shareLabel ?? CHART_SHARE_LABEL,
      ],
      lines: points.map((p) => [
        p.group ?? p.label,
        p.label,
        formatValue(p.value),
        shareOf(p.value, total),
      ]),
    };
  }

  // A rosca não tem eixo: cada linha é uma fatia, e a participação no total é a
  // informação que o desenho passa pela ÁREA — a única que não sobrevive em
  // texto se ninguém a escrever.
  if (type === 'pie') {
    const points = opts.data ?? [];
    const total = points.reduce((sum, p) => sum + Math.max(0, p.value), 0);
    return {
      header: [
        categoryLabel,
        opts.valueLabel ?? CHART_VALUE_LABEL,
        opts.shareLabel ?? CHART_SHARE_LABEL,
      ],
      lines: points.map((p) => [p.label, formatValue(p.value), shareOf(p.value, total)]),
    };
  }

  const series = seriesOf(opts);
  return {
    header: [categoryLabel, ...series.map((s) => s.name)],
    lines: categoriesOf(opts).map((category, index) => [
      category,
      ...series.map((s) => {
        const value = s.data?.[index];
        return value === undefined ? NO_VALUE : formatValue(value);
      }),
    ]),
  };
}

// ─── Option builder (puro) ───────────────────────────────────────────────────

export function buildChartOption(opts: ChartOptions): echarts.EChartsCoreOption {
  const type = opts.type ?? 'bar';

  const seriesData = seriesOf(opts);
  const showLegend = opts.showLegend ?? seriesData.length > 1;

  // Radar: um eixo por grandeza, um polígono fechado por série.
  //
  // É o único tipo desta fábrica que traz SISTEMA DE COORDENADAS próprio — o
  // bloco `radar` ao lado de `series`, e não dentro dela. Quem descreve os
  // eixos é o `indicator`; a série só carrega os valores, na ordem deles.
  if (type === 'radar') {
    const axes = radarAxesOf(opts);
    return {
      title: opts.title ? { text: opts.title, left: 'left' } : undefined,
      tooltip: { trigger: 'item' },
      // O polígono não tem eixo que o nomeie — os eixos nomeiam as GRANDEZAS,
      // não as séries —, então a legenda aparece sempre que há série, como na
      // rosca e no funil. Sem ela, a única pista de qual polígono é qual seria
      // a cor.
      legend: showLegend || seriesData.length > 0
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      radar: {
        indicator: axes.map((axis) => ({ name: axis.label, max: axis.max })),
        // Polígono, e não círculo: são os vértices que dizem em que grandeza o
        // item é forte, e num anel eles somem.
        shape: 'polygon',
        // Sobe o centro e encolhe o raio para caber o nome de cada eixo por
        // fora do último anel — o nome é texto e cresce com a fonte do
        // navegador (WCAG 1.4.4), então a folga é proporcional, nunca em pixel.
        center: ['50%', opts.title ? '54%' : '48%'],
        radius: '58%',
      },
      // Uma série de radar só, com um item de dado por série do chamador: é
      // assim que a lib desenha vários polígonos no mesmo sistema de eixos.
      series: [{
        type: 'radar',
        data: seriesData.map((s, index) => ({
          name: s.name,
          value: s.data ?? [],
          // Símbolo e traço próprios, o mesmo vocabulário de forma do traçado:
          // sem a cor, um polígono ainda se separa do outro (WCAG 1.4.1).
          symbol: SYMBOLS[index % SYMBOLS.length],
          symbolSize: 9,
          lineStyle: {
            type: DASHES[index % DASHES.length],
            ...(s.color ? { color: s.color } : {}),
          },
          // A área preenchida é o que faz a trama alcançar o radar: a hachura é
          // de PREENCHIMENTO, e sem `areaStyle` a lib desenha só o contorno do
          // polígono — não haveria o que hachurar. Translúcida porque os
          // polígonos se sobrepõem de propósito: opaco, o de cima apagaria o de
          // baixo, que é justamente a comparação que o radar existe para
          // mostrar.
          areaStyle: { opacity: 0.3 },
          ...(s.color ? { itemStyle: { color: s.color } } : {}),
        })),
      }],
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      aria: ariaBlock(),
    };
  }

  // Dispersão: dois eixos de valor, um ponto por par, uma forma por série.
  //
  // É o tipo em que a trama do decal NÃO SERVE, e é por isso que ela é desligada
  // logo abaixo. A hachura é feita de um ladrilho que se repete; num símbolo de
  // 14px cabe uma repetição ou duas, e o que sai não é padrão, é ruído — duas
  // tramas diferentes chegam indistinguíveis, e o sinal que deveria substituir a
  // cor passa a não substituir nada. O caso é o mesmo do traçado (decisão 3 do
  // cabeçalho): sem trama que alcance, quem separa as séries é a FORMA do
  // símbolo, e ela é o sinal primário aqui, não o reforço.
  //
  // Por isso o símbolo é maior que o do traçado (14 contra 9): ali ele marca
  // pontos sobre uma linha que já tem desenho próprio de traço; aqui ele é a
  // única marca que existe, e é nele que a distinção inteira se apoia.
  if (type === 'scatter') {
    return {
      title: opts.title ? { text: opts.title, left: 'left' } : undefined,
      tooltip: { trigger: 'item' },
      // A legenda é o que amarra a forma ao nome do grupo. Sem ela o desenho
      // teria cinco formas e nenhuma pista do que cada uma significa, e a
      // pessoa teria de ir à tabela para descobrir — o que é a alternativa, não
      // a leitura principal.
      legend: showLegend || seriesData.length > 1
        ? { bottom: 0, itemWidth: 14 }
        : undefined,
      grid: {
        left: 16, right: 16,
        top: opts.title ? 48 : 16,
        bottom: showLegend || seriesData.length > 1 ? 48 : 24,
        containLabel: true,
      },
      // Os dois eixos são de VALOR — é o que distingue a dispersão do traçado,
      // onde o x é categoria. O nome de cada eixo é o que diz o que a posição
      // mede; sem ele o desenho mostra números sem grandeza.
      xAxis: {
        type: 'value',
        name: opts.xLabel,
        nameLocation: 'middle',
        // A folga do nome vem do TEMA (`nameGap` em `axisStyle`), que se
        // reconstrói quando a fonte raiz muda. Calculá-la aqui exigiria ler o
        // DOM, e este construtor é puro.
        scale: true,
      },
      yAxis: {
        type: 'value',
        name: opts.yLabel,
        nameLocation: 'middle',
        scale: true,
      },
      series: seriesData.map((serie, index) => ({
        name: serie.name,
        type: 'scatter',
        data: pointsOf(serie),
        symbol: SYMBOLS[index % SYMBOLS.length],
        symbolSize: 14,
        ...(serie.color ? { itemStyle: { color: serie.color } } : {}),
      })),
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      // Trama desligada — ver o comentário acima. O resto do bloco continua: o
      // desenho segue anunciado, e é a forma do símbolo que cumpre a 1.4.1.
      aria: { ...ariaBlock(), decal: { show: false } },
    };
  }

  // Funil: sem eixo, uma faixa por etapa, na ordem em que o processo acontece.
  if (type === 'funnel') {
    const stages = opts.data ?? [];
    return {
      title: opts.title ? { text: opts.title, left: 'left' } : undefined,
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      // A faixa não tem eixo que a nomeie e não leva rótulo escrito por dentro
      // (ver `label` abaixo): sem a legenda, a única pista de qual etapa é qual
      // seria a cor. Por isso ela aparece sempre que há etapa, como na rosca.
      legend: showLegend || stages.length > 0
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      series: [{
        type: 'funnel',
        // A ordem é a do PROCESSO, não a do valor. `descending`, que é o padrão
        // da lib, reordena as etapas pelo tamanho: bastaria uma etapa que
        // recupera volume para o desenho passar a contar outra história, e para
        // a coluna de participação passar a se referir a uma etapa que não é a
        // entrada.
        sort: 'none',
        // A largura da faixa É a informação, então ela não pode depender do
        // menor valor do conjunto. Com `min: 0` e a faixa indo de 0% a 100% da
        // caixa, a largura de cada etapa é o valor dela sobre o da maior — o
        // mesmo número que a coluna de participação escreve. Deixar `min` no
        // padrão (o menor valor, quando ele é negativo) esticaria a escala e
        // desfaria essa correspondência.
        min: 0,
        minSize: '0%',
        maxSize: '100%',
        left: '10%',
        right: '10%',
        top: opts.title ? 48 : 16,
        bottom: 48,
        // Um respiro entre as faixas: sem ele o contorno de uma encosta no da
        // vizinha e as duas viram um bloco só.
        gap: 2,
        // Sem rótulo desenhado por dentro da faixa. Ele nasceria em branco
        // fixo sobre a cor da série — contraste que muda com a etapa e com o
        // tema —, e a mesma informação já está na legenda, em texto de tema, e
        // na tabela. Quem lê o número exato lê na tabela; quem lê a proporção
        // lê na largura.
        label: { show: false },
        labelLine: { show: false },
        data: stages.map((p) => ({ name: p.label, value: p.value })),
      }],
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      aria: ariaBlock(),
    };
  }

  // Pie tem shape diferente — xAxis/yAxis vão fora.
  if (type === 'pie') {
    const points = opts.data ?? [];
    return {
      title: opts.title ? { text: opts.title, left: 'left' } : undefined,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: showLegend || points.length > 0
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', opts.title ? '52%' : '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4 },
        data: points.map((p) => ({ name: p.label, value: p.value })),
      }],
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      aria: ariaBlock(),
    };
  }

  // Rosca ANINHADA: dois anéis concêntricos sobre o mesmo total.
  //
  // O de dentro é derivado (ver `nestedGroupsOf`), e é essa derivação que faz o
  // desenho ser verdadeiro: como os dois anéis somam o MESMO total e percorrem
  // a mesma ordem, cada fatia externa cai dentro do vão angular do seu grupo.
  // É a POSIÇÃO que comunica a hierarquia — não a cor, que aqui repete entre os
  // anéis porque as duas séries leem a mesma paleta desde o índice zero.
  //
  // Duas séries `pie` e não uma com `levels`: a lib não tem nível em rosca, e
  // `sunburst` — que tem — traz um sistema de coordenadas próprio e um contrato
  // de dado em árvore, que é outro componente, não outro modo deste.
  if (type === 'pie-nest') {
    const points = opts.data ?? [];
    const groups = nestedGroupsOf(points);
    const labelTokens = nestLabelTokens();
    // O anel externo recua para caber o rótulo e a linha-guia por fora dele.
    // Sem esta folga a lib desenha o rótulo, mas cortado pela borda do desenho —
    // que é pior que não desenhar, porque parece defeito de dado.
    const center: [string, string] = ['50%', opts.title ? '50%' : '44%'];
    return {
      title: opts.title ? { text: opts.title, left: 'left' } : undefined,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      // A legenda nomeia os dois anéis. Sem ela, a fatia de dentro não teria
      // nome nenhum: o rótulo escrito por dentro do arco não cabe em fatia
      // pequena, e a lib o esconde sem avisar.
      legend: showLegend || points.length > 0
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      series: [
        {
          type: 'pie',
          // Disco cheio no miolo, e não um segundo anel: dois anéis de mesma
          // espessura leem-se como duas roscas empilhadas, e a hierarquia
          // some. O miolo cheio diz "isto contém aquilo".
          radius: [0, '28%'],
          center,
          avoidLabelOverlap: true,
          label: nestInnerLabel(labelTokens),
          itemStyle: { borderRadius: 2 },
          data: groups.map((g) => ({ name: g.label, value: g.value })),
        },
        {
          type: 'pie',
          radius: ['42%', '58%'],
          center,
          avoidLabelOverlap: true,
          label: nestOuterLabel(labelTokens),
          labelLine: nestLabelLine(labelTokens),
          itemStyle: { borderRadius: 4 },
          data: points.map((p) => ({ name: p.label, value: p.value })),
        },
      ],
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      aria: ariaBlock(),
    };
  }

  // bar / line / area — eixo cartesiano.
  //
  // O valor escrito junto do dado aparece com UMA série só: com duas ou mais os
  // números se sobrepõem, e aí quem o entrega é a tabela.
  const showValueLabels = opts.showValues ?? seriesData.length === 1;
  return {
    title: opts.title ? { text: opts.title, left: 'left' } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend ? {
      data: seriesData.map((s) => s.name),
      bottom: 0,
      // No traçado a legenda HERDA o símbolo da própria série — é a mesma pista
      // de forma que separa as séries no desenho, e forçar um ícone genérico
      // aqui jogaria fora justamente onde essa pista é explicada.
      ...(type === 'bar' ? { icon: 'roundRect', itemHeight: 4 } : {}),
      itemWidth: 12,
    } : undefined,
    grid: {
      left: 16, right: 16,
      top: opts.title ? 48 : 16,
      bottom: showLegend ? 48 : 24,
      containLabel: true,
    },
    xAxis: { type: 'category', data: categoriesOf(opts), boundaryGap: type === 'bar' },
    yAxis: { type: 'value' },
    series: seriesData.map((s, index) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data ?? [],
      // O estilo do rótulo viaja no OPTION, e não no tema: medido, um bloco
      // `bar: { label: … }` registrado no tema sai ignorado — o rótulo desenha
      // idêntico com e sem ele. Sem estas declarações a lib usa cinza `#333`
      // fixo, halo branco de 2px e corpo de 12px cravado, e no modo escuro o
      // texto mede 1.06 contra o fundo: o número vira o próprio contorno.
      label: showValueLabels
        ? {
          show: true,
          position: 'top',
          formatter: (ponto: { value: number }) => formatValue(ponto.value),
          ...valueLabelStyle({
            foreground: hsl('foreground'),
            fontSize: Math.round(rootFontSize() * 0.75),
          }),
        }
        : { show: false },
      smooth: type !== 'bar',
      ...(type === 'bar'
        ? { itemStyle: { borderRadius: [4, 4, 0, 0], ...(s.color ? { color: s.color } : {}) } }
        : {
          // Símbolo e traço próprios por série: sem a cor, a forma ainda separa
          // uma linha da outra (WCAG 1.4.1). O tamanho é 9 porque triângulo e
          // losango a 6px chegam indistinguíveis do círculo.
          symbol: SYMBOLS[index % SYMBOLS.length],
          symbolSize: 9,
          lineStyle: {
            type: DASHES[index % DASHES.length],
            ...(s.color ? { color: s.color } : {}),
          },
          ...(s.color ? { itemStyle: { color: s.color } } : {}),
        }),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
    })),
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ariaBlock(),
  };
}

// ─── Alternativa textual ─────────────────────────────────────────────────────

/**
 * A `<table>` com os mesmos números do desenho.
 *
 * A caixa que rola só existe quando a tabela está À VISTA, e aí ela é
 * alcançável por teclado — como no primitivo Table. Fora da tela a tabela mede
 * 1px, então o `overflow-x` automático a tornaria uma região rolável sem foco
 * (`scrollable-region-focusable`), sem nada para rolar: colunas que só existem
 * para quem usa mouse, num elemento que ninguém enxerga.
 */
function createChartTable(opts: ChartOptions, describes: string): HTMLElement {
  const { header, lines } = buildChartTable(opts);
  const showData = opts.showData ?? false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'chart-data';
  wrapper.className = showData ? 'nds-table-wrapper' : 'nds-sr-only';
  if (showData) wrapper.tabIndex = 0;

  const table = document.createElement('table');
  table.className = 'nds-table';

  // A mesma frase do `aria-label` do desenho: são a mesma descrição, e deixá-las
  // divergir anunciaria uma coisa e escreveria outra.
  const caption = document.createElement('caption');
  caption.textContent = describes;
  table.appendChild(caption);

  const head = document.createElement('thead');
  const headLine = document.createElement('tr');
  for (const column of header) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = column;
    headLine.appendChild(cell);
  }
  head.appendChild(headLine);
  table.appendChild(head);

  const body = document.createElement('tbody');
  for (const line of lines) {
    const row = document.createElement('tr');
    // A primeira célula é CABEÇALHO de linha, não dado: é ela que nomeia a
    // categoria, e é por ela que o leitor de tela anuncia cada valor seguinte.
    const first = document.createElement('th');
    first.scope = 'row';
    first.textContent = line[0];
    row.appendChild(first);
    for (const value of line.slice(1)) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  table.appendChild(body);

  wrapper.appendChild(table);
  return wrapper;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Cria o container + handle. Init do echarts é deferida até o elemento estar
 * conectado ao DOM (Storybook anexa em seguida do return).
 */
export function createChart(opts: ChartOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.dataset.slot = 'chart';
  el.className = ['nds-chart', opts.class].filter(Boolean).join(' ');

  // Estado vazio — sem dados, mostra mensagem em vez de chart.
  //
  // Sem `role="img"` aqui de propósito: o papel PODA a subárvore da árvore de
  // acessibilidade, e a frase que explica a ausência de dado é justamente o
  // conteúdo — ficaria escondida atrás de um rótulo genérico. Sem desenho
  // também não há tabela: não há número para repetir.
  const isEmpty =
    (!opts.data || opts.data.length === 0) &&
    (!opts.series || opts.series.length === 0);
  if (isEmpty) {
    const empty = document.createElement('p');
    empty.className = 'nds-chart-empty';
    empty.textContent = opts.emptyLabel ?? CHART_EMPTY_LABEL;
    el.appendChild(empty);
    return el;
  }

  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  // `title` só entra depois dos dois: ele é texto visível, e serve de último
  // recurso, não de sinônimo.
  const describes = opts['aria-label'] ?? opts.label ?? opts.title ?? 'Gráfico';

  // Init deferida — espera el estar conectado pra echarts.init() funcionar.
  const mountWhenReady = (cb: () => void) => {
    if (el.isConnected) { cb(); return; }
    const obs = new MutationObserver(() => {
      if (el.isConnected) { obs.disconnect(); cb(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  };

  // A lib desenha DENTRO de um elemento próprio, não no bloco do design system.
  //
  // Antes ela era montada no próprio `.nds-chart`, que tem `overflow: hidden` —
  // e a dica sob o ponteiro, que a lib insere ao lado do desenho, nascia
  // recortada pelo bloco. O bloco continua sendo o que carrega classe.
  //
  // É este elemento — e não o bloco em volta — que leva o papel de imagem e o
  // rótulo (decisão 2 do cabeçalho): o papel poda a subárvore, e no bloco ele
  // esconderia a tabela de dados junto. O papel de imagem também é o que
  // autoriza o `aria-label` num `<div>` (sem ele o axe aponta
  // `aria-prohibited-attr`) e o que substitui, para o leitor de tela, um SVG
  // que ele não teria como narrar.
  const design = document.createElement('div');
  design.dataset.slot = 'chart-canvas';
  design.setAttribute('role', 'img');
  design.setAttribute('aria-label', describes);
  design.style.width = '100%';
  // A altura pedida é do DESENHO, não do bloco: com a tabela à vista o bloco
  // precisa crescer para caber os dois, e um bloco de altura cravada com
  // `overflow: hidden` recortaria a alternativa textual.
  design.style.height = opts.height !== undefined ? `${opts.height}px` : '100%';
  el.appendChild(design);

  el.appendChild(createChartTable(opts, describes));

  mountWhenReady(() => {
    registerNortearTheme();
    const chart = echarts.init(design, THEME_NAME, { renderer: opts.renderer ?? 'svg' });
    chart.setOption(buildChartOption(opts));

    // Só redimensiona quando a caixa MUDA de tamanho.
    //
    // `chart.resize()` repinta, repintar mexe no layout, e mexer no layout
    // notifica o observador de novo: sem esta guarda, toda repintura vira uma
    // volta a mais. Com a troca de tema — que repinta cada gráfico da tela — o
    // laço deixava de fechar, e a suíte de estados passava de dez minutos sem
    // terminar.
    let lastWidth = -1;
    let lastHeight = -1;
    let lastFontSize = rootFontSize();
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      // Aumentar a fonte do navegador muda a caixa, e é aqui que dá para
      // perceber: os tamanhos de texto do desenho saem da fonte raiz (WCAG
      // 1.4.4), e sem reler o tema o rótulo do eixo ficaria com o tamanho
      // antigo enquanto o resto da página cresce.
      const fontSize = rootFontSize();
      if (fontSize !== lastFontSize) {
        lastFontSize = fontSize;
        registerNortearTheme();
        chart.setTheme(THEME_NAME);
      }
      chart.resize();
    });
    // Observa o DESENHO, não o bloco: com a tabela à vista o bloco muda de
    // altura por causa dela, e redimensionar o gráfico por isso seria repintar
    // por um motivo que não é dele.
    ro.observe(design);

    const unwatch = watchTheme(() => {
      // Gráfico que saiu da página se recolhe sozinho.
      //
      // A factory não tem gancho de desmontagem — o consumidor recebe um
      // elemento, não um ciclo de vida —, então cada gráfico criado continuava
      // vivo com o seu observador de tema mesmo depois de o elemento sair do
      // documento. Numa página que troca de tela sem recarregar, uma troca de
      // tema repintava TODOS os gráficos já descartados junto com o da tela: a
      // aba do navegador fechava. Aqui é onde dá para perceber o descarte sem
      // pedir nada ao consumidor.
      if (!el.isConnected) {
        (el as HTMLElement & { __chartCleanup?: () => void }).__chartCleanup?.();
        return;
      }
      registerNortearTheme();
      // `registerTheme` só atualiza o REGISTRO global. A instância guarda o
      // tema já resolvido desde o `init`, e `setOption` sem `notMerge`
      // reaproveita esse model — trocar a classe do documento não mudava cor
      // nenhuma do desenho, e no tema escuro o gráfico ficava com a paleta
      // clara. Quem relê o registro é `setTheme`, e ele recolore no lugar, sem
      // remontar: é o "não pisca nem requer reload" que a documentação promete.
      chart.setTheme(THEME_NAME);
      lastFontSize = rootFontSize();
      // O option também carrega cor RESOLVIDA — a trama do decal sai de
      // `--background` —, e `setTheme` relê só o registro do tema, nunca o
      // option. Sem esta remontagem a hachura ficaria com a cor do tema
      // anterior: no escuro, uma trama clara desenhada com o branco da página.
      // `notMerge` porque o option é reconstruído inteiro a partir das mesmas
      // opções, e mesclar deixaria resto do anterior.
      chart.setOption(buildChartOption(opts), { notMerge: true });
    });

    (el as HTMLElement & { __chartCleanup?: () => void }).__chartCleanup = () => {
      ro.disconnect();
      unwatch();
      chart.dispose();
    };
  });

  return el;
}
