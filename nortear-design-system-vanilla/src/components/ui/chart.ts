// ─── Chart — ECharts factory ─────────────────────────────────────────────────
// Container responsivo wrappando Apache ECharts. Suporta bar / line / area / pie.
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
//    série, e a legenda traz o nome escrito. A trama é DESENHADA AQUI, na cor
//    do fundo — a lista padrão da lib nasce em preto translúcido e mal se
//    separa do próprio preenchimento (medido entre 1.26 e 1.57 contra as oito
//    cores de série, nos três temas): declarada, e não entregue. Na cor do
//    fundo a mesma hachura mede de 6.83 a 11.02. Em `line`/`area` a trama não
//    alcança — é de preenchimento, e traçado não tem preenchimento —, então
//    cada série ganha símbolo de ponto próprio (círculo, quadrado, triângulo,
//    losango, seta) e desenho de traço próprio. Retirando toda a cor, o gráfico
//    continua legível (WCAG 1.4.1).
//
// 4. CONTRASTE (WCAG 1.4.11). Toda forma de dado — barra, fatia, símbolo — é
//    contornada com `hsl(var(--foreground))`, que passa de 3:1 contra o fundo
//    em qualquer tema. O contorno vem do tema (`bar`/`line`/`pie` em
//    `@/lib/echarts-theme`) e é ele que delimita o objeto gráfico, e não a cor
//    de série. Ele nasceu quando a paleta ficava em torno de 2:1 contra o
//    fundo; com `--chart-1` a `--chart-8` por modo, o pior caso passou a 7.32
//    no claro e 6.83 no escuro, e o contorno fica porque separa uma forma da
//    VIZINHA — coisa que a medida contra o fundo não cobre.

import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  AriaComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

import { THEME_NAME, hsl, registerNortearTheme, rootFontSize, watchTheme } from '@/lib/echarts-theme';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

// Bootstrap dos módulos — idempotente. Tree-shake friendly.
//
// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
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
  return { enabled: true, label: { enabled: false }, decal: { show: true, decals: tramas(hsl('background')) } };
}

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** Cabeçalhos padrão da tabela de dados, quando o chamador não os informa. */
export const CHART_CATEGORY_LABEL = 'Categoria';
export const CHART_VALUE_LABEL = 'Valor';
export const CHART_SHARE_LABEL = 'Participação';

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

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

/** Forma simples: 1 série, label + value (compat com stories antigas). */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Forma multi-série: x-axis + N séries com array de valores. */
export interface ChartSeries {
  name: string;
  data: number[];
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
  /** Cabeçalho da coluna de participação — só a rosca a tem. */
  shareLabel?: string;
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

/** Categorias do eixo. Sem rótulo declarado, a posição vira o rótulo. */
function categoriesOf(opts: ChartOptions): string[] {
  const axis = opts.xAxis;
  if (axis && axis.length > 0) return axis.map(String);
  const simple = opts.data;
  if (simple && simple.length > 0) return simple.map((d) => d.label);
  const longest = seriesOf(opts).reduce((max, s) => Math.max(max, s.data.length), 0);
  return Array.from({ length: longest }, (_, i) => String(i + 1));
}

// ─── Funções puras ────────────────────────────────────────────────────────────

/** Número curto o bastante para caber na célula, sem depender de locale. */
export function formatValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

/** Participação da fatia no total, em uma casa decimal. */
function shareOf(value: number, total: number): string {
  if (total <= 0) return NO_VALUE;
  return `${Math.round((Math.max(0, value) / total) * 1000) / 10}%`;
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

  // A rosca não tem eixo: cada linha é uma fatia, e a participação no total é a
  // informação que o desenho passa pela ÁREA — a única que não sobrevive em
  // texto se ninguém a escrever.
  if ((opts.type ?? 'bar') === 'pie') {
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
        const value = s.data[index];
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

  // bar / line / area — eixo cartesiano.
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
      data: s.data,
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
