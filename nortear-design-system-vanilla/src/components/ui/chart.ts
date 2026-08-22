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

import { THEME_NAME, registerNortearTheme, watchTheme } from '@/lib/echarts-theme';
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
 * Bloco `aria` comum aos dois formatos de option.
 *
 * `label.enabled: false` desliga a descrição gerada pela lib de propósito: ela
 * nasce em inglês e mora num elemento interno que o `role="img"` do container
 * poda da árvore de acessibilidade. Quem carrega a alternativa textual é o
 * `aria-label` autoral, no idioma da página.
 */
const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

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
  /** Altura em px do container. Sem valor, vale o piso de `.nds-chart`. */
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
  /** Classe extra no container. */
  class?: string;
  /**
   * Descrição do gráfico: vira o nome acessível do container.
   *
   * Um desenho sem descrição é conteúdo perdido — a factory não emitia
   * `role`/`aria-label` nenhum, e cada consumidor colava os dois à mão.
   */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /** Frase mostrada no lugar do gráfico quando não há dado. */
  emptyLabel?: string;
}

// ─── Option builder (puro) ───────────────────────────────────────────────────

export function buildChartOption(opts: ChartOptions): echarts.EChartsCoreOption {
  const type = opts.type ?? 'bar';

  // Normaliza dado simples → xAxis + 1 série.
  const xAxisData =
    opts.xAxis ?? opts.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    opts.series ??
    (opts.data ? [{ name: 'value', data: opts.data.map((d) => d.value) }] : []);

  const showLegend = opts.showLegend ?? seriesData.length > 1;

  // Pie tem shape diferente — xAxis/yAxis vão fora.
  if (type === 'pie') {
    const points = opts.data ?? [];
    return {
      title: opts.title ? { text: opts.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
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
      aria: ARIA,
    };
  }

  // bar / line / area — eixo cartesiano.
  return {
    title: opts.title ? { text: opts.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend ? {
      data: seriesData.map((s) => s.name),
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
    } : undefined,
    grid: {
      left: 16, right: 16,
      top: opts.title ? 48 : 16,
      bottom: showLegend ? 48 : 24,
      containLabel: true,
    },
    xAxis: { type: 'category', data: xAxisData, boundaryGap: type === 'bar' },
    yAxis: { type: 'value' },
    series: seriesData.map((s) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data,
      smooth: type !== 'bar',
      symbol: type === 'bar' ? undefined : 'circle',
      symbolSize: 6,
      ...(s.color ? { itemStyle: { color: s.color }, lineStyle: { color: s.color } } : {}),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
      ...(type === 'bar' ? { itemStyle: { borderRadius: [4, 4, 0, 0], ...(s.color ? { color: s.color } : {}) } } : {}),
    })),
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ARIA,
  };
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
  // Largura e piso de altura vêm de `.nds-chart`; só a altura pedida é inline.
  if (opts.height !== undefined) el.style.height = `${opts.height}px`;

  // Estado vazio — sem dados, mostra mensagem em vez de chart.
  //
  // Sem `role="img"` aqui de propósito: o papel PODA a subárvore da árvore de
  // acessibilidade, e a frase que explica a ausência de dado é justamente o
  // conteúdo — ficaria escondida atrás de um rótulo genérico.
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

  // Com desenho, o papel de imagem é o que autoriza o `aria-label` num <div>
  // (sem ele o axe aponta aria-prohibited-attr) e o que substitui, para o leitor
  // de tela, um SVG que ele não teria como narrar. A factory não emitia nenhum
  // dos dois, e cada docs page vinha colando os atributos à mão.
  el.setAttribute('role', 'img');
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  // `title` só entra depois dos dois: ele é texto visível, e serve de último
  // recurso, não de sinônimo.
  el.setAttribute('aria-label', opts['aria-label'] ?? opts.label ?? opts.title ?? 'Gráfico');

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
  // recortada pelo bloco. Nas outras stacks o wrapper já cria um elemento
  // interno, e por isso só aqui a dica não aparecia. O bloco continua sendo o
  // que carrega classe, papel e rótulo.
  const desenho = document.createElement('div');
  desenho.dataset.slot = 'chart-canvas';
  desenho.style.width = '100%';
  desenho.style.height = '100%';
  el.appendChild(desenho);

  mountWhenReady(() => {
    registerNortearTheme();
    const chart = echarts.init(desenho, THEME_NAME, { renderer: opts.renderer ?? 'svg' });
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
    const ro = new ResizeObserver((entries) => {
      const caixa = entries[0]?.contentRect;
      if (!caixa) return;
      const largura = Math.round(caixa.width);
      const altura = Math.round(caixa.height);
      if (largura === lastWidth && altura === lastHeight) return;
      lastWidth = largura;
      lastHeight = altura;
      chart.resize();
    });
    ro.observe(el);

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
    });

    (el as HTMLElement & { __chartCleanup?: () => void }).__chartCleanup = () => {
      ro.disconnect();
      unwatch();
      chart.dispose();
    };
  });

  return el;
}
