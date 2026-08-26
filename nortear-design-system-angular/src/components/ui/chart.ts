import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';

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
import { SVGRenderer } from 'echarts/renderers';

import { THEME_NAME, rootFontSize, hsl, registerNortearTheme, watchTheme } from '@/lib/echarts-theme';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

// ─── Chart ────────────────────────────────────────────────────────────────────
//
// CAMINHO DE RENDERIZAÇÃO: **Apache ECharts**, com o renderizador SVG.
//
// Foi SVG desenhado à mão até esta migração, e o motivo era circunstancial: não
// havia echarts nas dependências desta stack. Havia nas outras quatro, e o
// conteúdo compartilhado descrevia a lib que só aqui não existia. Com a
// dependência instalada, o motor passa a ser o mesmo das cinco; o que NÃO muda
// é nada do contrato de acessibilidade abaixo, que era o valor real do desenho
// à mão e continua sendo cumprido, item por item, sobre o novo motor.
//
// O renderizador é o SVG (e não o de tela): as formas continuam sendo nós do
// DOM, então cor, contorno e trama seguem mensuráveis por `getComputedStyle`
// nas stories de contraste — que é como este componente prova a WCAG 1.4.11 em
// vez de afirmá-la.
//
// A altura continua nascendo da PROPORÇÃO aplicada à largura do container:
// o elemento em que a lib desenha é um `.nds-chart-canvas`, e o `min-height` do
// `.nds-chart` segue sendo o piso. O ECharts precisa de uma caixa medida para
// iniciar, e é a proporção que a fornece sem cravar pixel nenhum.
//
// ─── Acessibilidade: as quatro decisões ──────────────────────────────────────
//
// 1. ALTERNATIVA TEXTUAL EQUIVALENTE — o componente emite, sempre, uma
//    `<table>` de verdade com os mesmos números do desenho: cabeçalho por
//    série, `<th scope="row">` por categoria, `<caption>` com a descrição do
//    gráfico. Por padrão ela é `.nds-sr-only` (existe para leitor de tela e
//    para quem lê o DOM); `showData` a torna visível para todo mundo. O ECharts
//    NÃO gera essa tabela — `aria.label` produz uma frase em inglês, dentro de
//    um elemento que o próprio `role="img"` poda. A tabela é do componente, e
//    continua sendo.
//
// 2. `role="img"` + `aria-label` vão no elemento do **DESENHO**, não no `<div>`
//    container. Isto diverge do texto do conteúdo compartilhado, que fala em
//    `div[data-slot=chart]`, e a divergência é deliberada: `role="img"` poda a
//    subárvore da árvore de acessibilidade. No container, a tabela de dados
//    ficaria escondida junto — a alternativa textual sumiria. No elemento em
//    que a lib desenha, o desenho é anunciado como uma imagem com rótulo e a
//    tabela continua exposta, lado a lado. (É também por isso que a lib monta
//    num elemento INTERNO, e não no bloco `.nds-chart`.)
//
// 3. A INFORMAÇÃO NÃO VIVE NA COR. `aria.decal.show` sobrepõe uma trama a cada
//    série — hachura diagonal, pontos, grade… — e a legenda traz o nome
//    escrito. Em `line`/`area`, além da cor, cada série tem símbolo de ponto
//    próprio (círculo, quadrado, triângulo, losango, seta) e desenho de traço
//    próprio. Retirando toda a cor, o gráfico continua legível.
//
// 4. CONTRASTE (WCAG 1.4.11). Toda forma de dado — barra, fatia, símbolo — é
//    contornada com `hsl(var(--foreground))`, que passa de 3:1 contra o fundo
//    em qualquer tema. O contorno vem do tema (`bar/line/pie.itemStyle.
//    borderColor` em `@/lib/echarts-theme`) e é ele que delimita o objeto
//    gráfico, não a cor de série: no tema Default as cinco cores ficam entre
//    2.07 e 13.23 no claro e entre 1.00 e 6.41 no escuro — o `--chart-5` do
//    escuro É o fundo, contraste 1.00. Sem contorno, essa série some.
//
// A DICA SOB O PONTEIRO agora existe (a lib a desenha), e continua sem carregar
// informação exclusiva: o mesmo par categoria/valor está na tabela, alcançável
// sem ponteiro e sem foco.
//
// Divergência de API registrada (não "alinhada"): as outras stacks separam
// `ChartContainer` + `buildXOption`. Aqui é um componente só, com inputs
// declarativos — a troca de motor não mexeu na API pública.

// Bootstrap dos módulos — idempotente. Tree-shake friendly.
//
// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
  SVGRenderer,
]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

/** Forma simples: 1 série, rótulo + valor. */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Forma multi-série: N séries com valores alinhados ao eixo de categorias. */
export interface ChartSeries {
  name: string;
  data: number[];
  /** Cor explícita; sobrescreve o token `--chart-{n}` da posição. */
  color?: string;
}

// ─── Vocabulário do desenho ──────────────────────────────────────────────────

/**
 * Tramas do decal, uma por posição de série; a 6ª volta à 1ª.
 *
 * O ECharts tem uma lista padrão, e ela não serve: as tramas nascem em preto
 * translúcido, que sobre a paleta escura fica invisível. Estas repetem os cinco
 * desenhos que o SVG à mão traçava — diagonal ascendente, pontos, diagonal
 * descendente, horizontais, grade — no traço do FUNDO, que é o que separa a
 * hachura do preenchimento em qualquer tema.
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

/** Símbolo de ponto, na ordem das séries — a série se distingue sem a cor. */
const SIMBOLOS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const TRACOS: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

/** Proporção do desenho: a mesma do viewBox anterior, cheia e achatada. */
const RATIO = '640 / 320';
const RATIO_COMPACT = '640 / 140';

// ─── Funções puras ────────────────────────────────────────────────────────────

/** Número curto o bastante para caber no eixo, sem depender de locale. */
export function formatarValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'div[ndsChart]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-chart',
    '[attr.data-slot]': '"chart"',
    '[attr.data-type]': 'type()',
  },
  template: `
    @if (vazio()) {
      <!-- Sem \`role="img"\` aqui de propósito: o papel PODA a subárvore da
           árvore de acessibilidade, e a frase que explica a ausência de dado é
           justamente o conteúdo — ficaria escondida atrás de um rótulo
           genérico. -->
      <p class="nds-chart-empty">{{ emptyLabel() }}</p>
    } @else {
      <!-- O elemento em que a lib desenha. É ele — e não o bloco em volta — que
           leva o papel de imagem, para que a tabela abaixo continue na árvore
           de acessibilidade (decisão 2). A proporção é custom property, e a
           altura nasce dela aplicada à largura do container. -->
      <div
        #desenho
        class="nds-chart-canvas"
        [style.--ratio]="ratio()"
        data-slot="chart-canvas"
        role="img"
        [attr.aria-label]="label()"
      ></div>

      <!-- Alternativa textual equivalente. Não é enfeite: é o mesmo dado, em
           forma que leitor de tela, busca e cópia alcançam.

           A caixa que rola só existe quando a tabela está À VISTA, e aí ela é
           alcançável por teclado — como no primitivo Table. Fora da tela a
           tabela mede 1px, então o overflow-x automático a tornaria uma região
           rolável sem foco (scrollable-region-focusable), sem nada para rolar:
           colunas que só existem para quem usa mouse, num elemento que ninguém
           enxerga. -->
      <div
        [class.nds-table-wrapper]="showData()"
        [class.nds-sr-only]="!showData()"
        [attr.tabindex]="showData() ? 0 : null"
        data-slot="chart-data"
      >
        <table class="nds-table">
          <caption>{{ label() }}</caption>
          <thead>
            <tr>
              @for (coluna of table().header; track coluna) {
                <th scope="col">{{ coluna }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (line of table().lines; track $index) {
              <tr>
                <th scope="row">{{ line[0] }}</th>
                @for (celula of line.slice(1); track $index) {
                  <td>{{ celula }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class NdsChart {
  /** Tipo do gráfico. Não há variante `cva`: o tipo é o dado, não o estilo. */
  readonly type = input<ChartType>('bar');

  /**
   * Descrição do gráfico. Obrigatório de propósito: vira o `aria-label` do
   * desenho e a `<caption>` da tabela. Sem ele o desenho é conteúdo perdido,
   * então o compilador cobra.
   */
  readonly label = input.required<string>();

  /** Dataset simples de uma série — e a única forma aceita por `pie`. */
  readonly data = input<ChartDataPoint[] | undefined>(undefined);

  /** Rótulos do eixo de categorias quando há multi-série. */
  readonly xAxis = input<string[] | undefined>(undefined);

  /** Multi-série. Tem precedência sobre `data` em bar/line/area. */
  readonly series = input<ChartSeries[] | undefined>(undefined);

  /** Título desenhado acima dos eixos. `chartTitle` e não `title` para não
   *  disputar o atributo nativo `title` do elemento hospedeiro. */
  readonly chartTitle = input<string>('');

  /** Força mostrar/esconder a legenda. Padrão: visível com mais de uma série. */
  readonly showLegend = input<boolean | undefined>(undefined);

  /** Torna a tabela de dados visível para todo mundo, não só para leitor de tela. */
  readonly showData = input<boolean>(false);

  /**
   * Mini gráfico inline: sem eixos, grade, legenda ou rótulo de valor, e com
   * proporção achatada. Serve de indicador de tendência ao lado de um número —
   * ali o desenho é adjetivo do KPI, e o número exato continua na tabela.
   */
  readonly compact = input<boolean>(false);

  readonly categoryLabel = input<string>('Categoria');
  readonly valueLabel = input<string>('Valor');
  readonly shareLabel = input<string>('Participação');
  readonly emptyLabel = input<string>('Sem dados para exibir');

  private readonly desenho = viewChild<ElementRef<HTMLElement>>('desenho');

  /** Instância viva da lib. Signal para que o efeito de option a acompanhe. */
  private readonly instancia = signal<echarts.ECharts | null>(null);

  /**
   * Contador de troca de tema.
   *
   * O option carrega cores RESOLVIDAS (a trama do decal sai de `--background`),
   * e `setTheme` relê só o registro do tema — não o option. Sem este sinal, a
   * trama ficaria com a cor do tema anterior depois da troca.
   */
  private readonly temaVersao = signal(0);

  protected readonly cartesiano = computed(() => this.type() !== 'pie');

  protected readonly ratio = computed(() => (this.compact() ? RATIO_COMPACT : RATIO));

  protected readonly serieNorm = computed<ChartSeries[]>(() => {
    const multi = this.series();
    if (multi && multi.length > 0) return multi;
    const simple = this.data();
    if (simple && simple.length > 0) {
      return [{ name: this.valueLabel(), data: simple.map((p) => p.value) }];
    }
    return [];
  });

  protected readonly categorias = computed<string[]>(() => {
    const eixo = this.xAxis();
    if (eixo && eixo.length > 0) return eixo;
    const simple = this.data();
    if (simple && simple.length > 0) return simple.map((p) => p.label);
    const maior = this.serieNorm().reduce((max, s) => Math.max(max, s.data.length), 0);
    return Array.from({ length: maior }, (_, i) => String(i + 1));
  });

  /** Fatias da pizza — só a forma simples faz sentido aqui. */
  protected readonly fatiasDados = computed<ChartDataPoint[]>(() => this.data() ?? []);

  protected readonly vazio = computed(() => {
    if (!this.cartesiano()) return this.fatiasDados().length === 0;
    const series = this.serieNorm();
    return series.length === 0 || series.every((s) => s.data.length === 0);
  });

  protected readonly legendaVisivel = computed(() => {
    if (this.compact()) return false;
    if (!this.cartesiano()) return true; // a pizza não rotula fatia: a legenda é o rótulo
    return this.showLegend() ?? this.serieNorm().length > 1;
  });

  private readonly totalPizza = computed(() =>
    this.fatiasDados().reduce((sum, p) => sum + Math.max(0, p.value), 0),
  );

  // ─── Option ────────────────────────────────────────────────────────────────

  private readonly option = computed<echarts.EChartsCoreOption>(() => {
    // Depende da troca de tema porque carrega cor resolvida (ver `temaVersao`).
    this.temaVersao();

    const compact = this.compact();
    const animar = !prefersReducedMotion();
    const dur = Math.round(motionDuration('moderate') * 1000);
    const aria = {
      enabled: true,
      // A descrição gerada pela lib fica desligada de propósito: nasce em inglês
      // e mora num elemento que o `role="img"` do desenho poda. Quem carrega a
      // alternativa textual é o `aria-label` autoral, mais a tabela.
      label: { enabled: false },
      decal: { show: true, decals: tramas(hsl('background')) },
    };
    const title = this.chartTitle() && !compact
      ? { text: this.chartTitle(), left: 'left' }
      : undefined;

    if (!this.cartesiano()) return this.optionPizza(title, aria, animar, dur);
    return this.optionCartesiano(title, aria, animar, dur, compact);
  });

  private optionPizza(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const pontos = this.fatiasDados();
    // A legenda da pizza é o rótulo da fatia: sem nome, valor e participação
    // escritos, a única pista de qual fatia é qual seria a cor.
    const legendText = new Map(
      pontos.map((p) => [
        p.label,
        `${p.label} — ${formatarValue(p.value)} (${this.percentual(p.value)})`,
      ]),
    );
    return {
      title,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: this.legendaVisivel()
        ? {
          bottom: 0,
          icon: 'roundRect',
          itemWidth: 12,
          itemHeight: 8,
          formatter: (name: string) => legendText.get(name) ?? name,
        }
        : undefined,
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', this.chartTitle() ? '52%' : '45%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderRadius: 4 },
        data: pontos.map((p) => ({ name: p.label, value: p.value })),
      }],
      animation: animar,
      animationDuration: dur,
      aria,
    };
  }

  private optionCartesiano(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
    compact: boolean,
  ): echarts.EChartsCoreOption {
    const type = this.type();
    const series = this.serieNorm();
    const legenda = this.legendaVisivel();
    // Com uma série só não há números se sobrepondo: o valor exato cabe junto
    // do dado. Com duas ou mais, quem entrega o número é a tabela.
    const labelValues = series.length === 1 && !compact;

    return {
      title,
      tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
      legend: legenda
        ? {
          data: series.map((s) => s.name),
          bottom: 0,
          // No gráfico de linhas a legenda herda o símbolo da própria série —
          // é a mesma pista de forma que separa as séries no desenho.
          ...(type === 'bar' ? { icon: 'roundRect', itemHeight: 8 } : {}),
          itemWidth: 14,
        }
        : undefined,
      grid: compact
        ? { left: 2, right: 2, top: 2, bottom: 2, containLabel: false }
        : {
          left: 16,
          right: 16,
          top: title ? 48 : 24,
          bottom: legenda ? 48 : 24,
          containLabel: true,
        },
      xAxis: {
        type: 'category',
        data: this.categorias(),
        boundaryGap: type === 'bar',
        show: !compact,
      },
      yAxis: { type: 'value', show: !compact },
      series: series.map((serie, i) => ({
        name: serie.name,
        type: type === 'area' ? 'line' : type,
        data: serie.data,
        ...(type === 'bar'
          ? { barMaxWidth: '68%' }
          : {
            smooth: false,
            showSymbol: !compact,
            // Símbolo próprio por série: a forma distingue sem depender da cor.
            symbol: SIMBOLOS[i % SIMBOLOS.length],
            symbolSize: 9,
            lineStyle: {
              type: TRACOS[i % TRACOS.length],
              ...(serie.color ? { color: serie.color } : {}),
            },
          }),
        ...(type === 'area' ? { areaStyle: { opacity: 0.2 } } : {}),
        ...(serie.color || type === 'bar'
          ? {
            itemStyle: {
              ...(serie.color ? { color: serie.color } : {}),
              ...(type === 'bar' ? { borderRadius: [4, 4, 0, 0] } : {}),
            },
          }
          : {}),
        label: labelValues
          ? { show: true, position: 'top', formatter: (p: { value: number }) => formatarValue(p.value) }
          : { show: false },
      })),
      animation: animar,
      animationDuration: dur,
      animationEasing: 'cubicOut',
      aria,
    };
  }

  // ─── Ciclo de vida da instância ────────────────────────────────────────────

  constructor() {
    effect((onCleanup) => {
      const el = this.desenho()?.nativeElement;
      if (!el) return;

      registerNortearTheme();
      const chart = echarts.init(el, THEME_NAME, { renderer: 'svg' });
      this.instancia.set(chart);

      // Só redimensiona quando a caixa MUDA de tamanho.
      //
      // `chart.resize()` repinta, repintar mexe no layout, e mexer no layout
      // notifica o observador de novo: sem esta guarda, toda repintura vira uma
      // volta a mais. Com a troca de tema — que repinta cada gráfico da tela —
      // o laço deixava de fechar, e a suíte de estados passava de dez minutos
      // sem terminar.
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
        // perceber: os tamanhos do desenho saem da fonte raiz (WCAG 1.4.4), e
        // sem reler o tema o rótulo do eixo ficaria com o tamanho antigo.
        const fontSize = rootFontSize();
        if (fontSize !== lastFontSize) {
          lastFontSize = fontSize;
          registerNortearTheme();
          chart.setTheme(THEME_NAME);
        }
        chart.resize();
      });
      ro.observe(el);

      const unwatch = watchTheme(() => {
        registerNortearTheme();
        // `registerTheme` só atualiza o REGISTRO global. A instância guarda o
        // tema já resolvido desde o `init`, e `setOption` sem `notMerge`
        // reaproveita esse model — trocar a classe do documento não mudava cor
        // nenhuma do desenho, e no tema escuro o gráfico ficava com a paleta
        // clara. Quem relê o registro é `setTheme`, e ele recolore no lugar,
        // sem remontar: é o "não pisca nem requer reload" que a documentação
        // promete.
        chart.setTheme(THEME_NAME);
        lastFontSize = rootFontSize();
        this.temaVersao.update((v) => v + 1);
      });

      onCleanup(() => {
        ro.disconnect();
        unwatch();
        chart.dispose();
        this.instancia.set(null);
      });
    });

    effect(() => {
      const chart = this.instancia();
      const option = this.option();
      if (!chart) return;
      // `notMerge` porque trocar o TIPO troca a forma do option inteiro (a
      // pizza não tem eixo); mesclar deixaria eixo órfão de um tipo no outro.
      chart.setOption(option, { notMerge: true });
    });
  }

  // ─── Alternativa textual ───────────────────────────────────────────────────

  protected readonly table = computed<{ header: string[]; lines: string[][] }>(() => {
    if (!this.cartesiano()) {
      return {
        header: [this.categoryLabel(), this.valueLabel(), this.shareLabel()],
        lines: this.fatiasDados().map((p) => [
          p.label,
          formatarValue(p.value),
          this.percentual(p.value),
        ]),
      };
    }
    const series = this.serieNorm();
    return {
      header: [this.categoryLabel(), ...series.map((s) => s.name)],
      lines: this.categorias().map((categoria, iCat) => [
        categoria,
        ...series.map((s) => (s.data[iCat] === undefined ? '—' : formatarValue(s.data[iCat]))),
      ]),
    };
  });

  private percentual(value: number): string {
    const total = this.totalPizza();
    if (total <= 0) return '—';
    return `${Math.round((Math.max(0, value) / total) * 1000) / 10}%`;
  }
}
