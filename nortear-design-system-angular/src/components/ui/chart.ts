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
import { SVGRenderer } from 'echarts/renderers';

import {
  THEME_NAME,
  rootFontSize,
  scaled,
  hsl,
  registerNortearTheme,
  watchTheme,
} from '@/lib/echarts-theme';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';
import {
  nestInnerLabel,
  nestLabelLine,
  nestOuterLabel,
  valueLabelStyle,
  type NestLabelTokens,
} from '@shared/primitives/chart-nest-labels';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';

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
//    Corolário para todo tipo em que o desenho comunica uma PROPORÇÃO: a
//    tabela ganha uma terceira coluna com esse número. O ângulo da fatia e a
//    largura da faixa do funil não se leem em texto — sem a coluna, a
//    alternativa textual traria menos informação que o desenho, e aí deixaria
//    de ser equivalente. A base da conta muda com o tipo: na rosca é o total,
//    no funil é a PRIMEIRA etapa, porque o que o funil mostra é quanto sobrou
//    de onde o processo começou.
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
// 4. CONTRASTE (WCAG 1.4.11). Toda forma de dado — barra, fatia, faixa,
//    símbolo — é contornada com `hsl(var(--foreground))`, que passa de 3:1
//    contra o fundo em qualquer tema. O contorno vem do tema (`bar/line/pie/
//    radar.itemStyle.borderColor` em `@/lib/echarts-theme`); o funil, que não
//    tem entrada no tema, declara o seu no próprio option, e o option é
//    recalculado a cada troca de tema. É ele que delimita o objeto
//    gráfico, e não a cor de série. O contorno nasceu quando a paleta ia de
//    2.07 a 13.23 no claro e de 1.00 a 6.41 no escuro — uma das cores ERA o
//    fundo, contraste 1.00, e sem contorno aquela série sumia. Com as oito
//    cores por modo o pior caso passou a 7.32 no claro e 6.83 no escuro; o
//    contorno fica porque separa uma forma da VIZINHA, coisa que a medida
//    contra o fundo não cobre.
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
  SVGRenderer,
]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChartType =
  | 'bar' | 'line' | 'area' | 'pie' | 'pie-nest' | 'funnel' | 'radar' | 'scatter';

/** Forma simples: 1 série, rótulo + valor. */
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
 * pessoa lê é a distância do vértice ao centro, e essa distância é o valor
 * DIVIDIDO pelo teto daquele eixo. Um 7 num eixo que vai a 10 e um 7 num eixo
 * que vai a 100 caem em pontos opostos do mesmo raio.
 */
export interface ChartRadarAxis {
  label: string;
  max: number;
}

/** Forma multi-série: N séries com valores alinhados ao eixo de categorias. */
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
   * carrega a informação.
   */
  points?: [number, number][];
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

  /** Dataset simples de uma série — e a única forma aceita por `pie` e `funnel`. */
  readonly data = input<ChartDataPoint[] | undefined>(undefined);

  /** Rótulos do eixo de categorias quando há multi-série. */
  readonly xAxis = input<string[] | undefined>(undefined);

  /** Multi-série. Tem precedência sobre `data` em bar/line/area. */
  readonly series = input<ChartSeries[] | undefined>(undefined);

  /**
   * Radar: os eixos e o TETO de cada um, na ordem em que aparecem no polígono.
   *
   * Declarar é o caminho recomendado, porque é aqui que mora a única informação
   * do radar que não está em nenhum outro lugar. Sem a lista, o nome do eixo sai
   * do eixo de categorias (ou da posição) e TODOS os eixos passam a dividir um
   * teto só — o maior valor do conjunto —, que é uma escala honesta mas outra
   * leitura.
   */
  readonly radarAxes = input<ChartRadarAxis[] | undefined>(undefined);

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
  /**
   * Cabeçalho da coluna de máximo do eixo — só o radar a tem.
   *
   * Mesma família da coluna de participação, e pelo mesmo motivo: o desenho
   * comunica uma RAZÃO (o vértice sobre o raio), e o valor sozinho não a
   * carrega. A diferença é que aqui o denominador muda de eixo para eixo, então
   * ele não cabe num rodapé — precisa de uma célula por linha.
   */
  readonly maxLabel = input<string>('Máximo');
  /**
   * Cabeçalho da primeira coluna da dispersão: qual série o ponto integra.
   *
   * Não reaproveita `categoryLabel` porque não é categoria — a dispersão não
   * tem eixo de categorias, e a coluna nomeia a SÉRIE. Chamá-la de "Categoria"
   * ensinaria errado quem lê a tabela por leitor de tela.
   */
  readonly seriesLabel = input<string>('Série');
  /**
   * Nomes das duas grandezas da dispersão — no eixo e na tabela.
   *
   * São a informação que o desenho passa pela POSIÇÃO, e posição não se lê em
   * texto. Sem eles a tabela sairia com duas colunas chamadas X e Y, que dizem
   * onde o ponto está e não o que ele mede. É a mesma família da coluna de
   * participação da rosca e da de máximo do radar.
   */
  readonly xLabel = input<string>('X');
  readonly yLabel = input<string>('Y');
  /**
   * Cabeçalho da coluna de grupo — só a rosca aninhada a tem.
   *
   * Não reaproveita `categoryLabel` porque as duas coexistem na mesma tabela:
   * uma nomeia o anel de dentro e a outra o de fora, e chamar as duas de
   * "Categoria" deixaria a tabela ambígua exatamente onde ela precisa ser
   * precisa.
   */
  readonly groupLabel = input<string>('Grupo');
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

  /**
   * Tem eixo de categorias e eixo de valor.
   *
   * Rosca e funil não desenham em eixo nenhum; o radar desenha nos SEUS, que não
   * são estes — daí ele ficar de fora junto, mesmo tendo eixo. O que esta
   * pergunta decide é a forma do option e a forma da tabela, e nas duas o radar
   * é caso próprio.
   */
  protected readonly cartesiano = computed(() => {
    const type = this.type();
    // A dispersão TEM eixo, e ainda assim fica de fora: os dois eixos dela são
    // de valor, e o que esta pergunta decide é a forma do option e a forma da
    // tabela — nas duas ela é caso próprio, como o radar. A rosca aninhada não
    // desenha em eixo nenhum, como a simples.
    return type !== 'pie' && type !== 'pie-nest' && type !== 'funnel'
      && type !== 'radar' && type !== 'scatter';
  });

  protected readonly scatterType = computed(() => this.type() === 'scatter');
  protected readonly nestedType = computed(() => this.type() === 'pie-nest');

  /**
   * As cores e o degrau do rótulo da rosca aninhada, do tema em vigor.
   *
   * Lê `temaVersao` como o `option` lê: é o sinal que faz as duas coisas serem
   * recalculadas quando a classe do documento muda. A trama do decal segue o
   * mesmo caminho neste componente, e pelo mesmo motivo — as duas carregam cor
   * RESOLVIDA, e `setTheme` relê o registro do tema, nunca o option.
   *
   * O degrau sai da fonte raiz, não de pixel cravado (WCAG 1.4.4).
   */
  private nestLabelTokens(): NestLabelTokens {
    return {
      foreground: hsl('foreground'),
      background: hsl('background'),
      border: hsl('border'),
      muted: hsl('muted'),
      mutedForeground: hsl('muted-foreground'),
      fontSize: Math.round(rootFontSize() * 0.75),
    };
  }

  /**
   * O anel de DENTRO da rosca aninhada: um arco por grupo, com a soma dos pontos.
   *
   * Derivado, nunca declarado. A ordem é a de PRIMEIRA APARIÇÃO, e não a do
   * tamanho: é ela que faz cada arco externo cair dentro do arco do seu grupo.
   * Reordenar por valor quebraria o alinhamento angular, que é justamente o que
   * comunica a hierarquia sem depender da cor.
   *
   * Ponto sem grupo cai num grupo com o próprio rótulo: o total não muda, e o
   * anel de dentro passa a ter um arco só para ele — honesto, e visivelmente
   * diferente de um agrupamento que ninguém declarou.
   */
  protected readonly nestedGroups = computed<ChartDataPoint[]>(() => {
    const order: string[] = [];
    const sums = new Map<string, number>();
    for (const point of this.simpleData()) {
      const group = point.group ?? point.label;
      if (!sums.has(group)) order.push(group);
      sums.set(group, (sums.get(group) ?? 0) + Math.max(0, point.value));
    }
    return order.map((label) => ({ label, value: sums.get(label) ?? 0 }));
  });

  /** O radar lê SÉRIES, como o cartesiano; rosca e funil leem a lista simples. */
  protected readonly radarType = computed(() => this.type() === 'radar');

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
    const maior = this.serieNorm().reduce((max, s) => Math.max(max, (s.data ?? []).length), 0);
    return Array.from({ length: maior }, (_, i) => String(i + 1));
  });

  /**
   * Rótulo e valor, na ordem declarada — a forma que rosca e funil aceitam.
   *
   * A ordem é do dado e não da lib: no funil ela é a ordem do PROCESSO, e o
   * desenho não reordena por valor (ver `optionFunnel`).
   */
  protected readonly simpleData = computed<ChartDataPoint[]>(() => this.data() ?? []);

  /**
   * Os eixos do radar: os declarados, ou uns derivados do próprio dado.
   *
   * Um só produtor para o desenho e para a tabela: o teto que a escala usa e o
   * teto que a coluna escreve têm de ser o MESMO número, e duas derivações
   * separadas seriam duas verdades sobre a mesma escala.
   *
   * Sem lista declarada, todos os eixos dividem um teto só — o maior valor do
   * conjunto. Derivar um teto POR eixo (o maior valor daquele eixo) daria um
   * polígono que toca o anel de fora em todos os vértices sempre que houver uma
   * série só: verdadeiro na aritmética e vazio na leitura.
   */
  protected readonly radarAxesNorm = computed<ChartRadarAxis[]>(() => {
    const declared = this.radarAxes();
    if (declared && declared.length > 0) return declared;
    const ceiling = this.serieNorm().reduce(
      (max, s) => (s.data ?? []).reduce((inner, value) => Math.max(inner, value), max),
      0,
    );
    return this.categorias().map((label) => ({ label, max: ceiling }));
  });

  protected readonly vazio = computed(() => {
    // Rosca e funil — e SÓ eles — leem a lista simples. A dispersão também não
    // é cartesiana nem radar, e sem nomeá-la aqui ela caía neste ramo: media
    // `data()`, que na dispersão é vazio por definição, e o container trocava um
    // desenho cheio pela frase de estado vazio. O build passou limpo; quem viu
    // foi a suíte.
    if (!this.cartesiano() && !this.radarType() && !this.scatterType()) {
      return this.simpleData().length === 0;
    }
    const series = this.serieNorm();
    // Na dispersão o que enche o desenho são os PARES, não `data`: sem esta
    // segunda leitura um gráfico de dispersão cheio seria julgado vazio e o
    // container trocaria o desenho pela frase de estado vazio.
    return series.length === 0
      || series.every((s) => (s.data ?? []).length === 0 && (s.points ?? []).length === 0);
  });

  protected readonly legendaVisivel = computed(() => {
    if (this.compact()) return false;
    // Nem a rosca nem o funil escrevem o nome dentro da forma: a legenda é o
    // rótulo, e é ela que carrega nome, valor e participação por escrito. No
    // radar vale o mesmo por outro caminho: os eixos nomeiam as GRANDEZAS, não
    // as séries, então sem legenda a única pista de qual polígono é qual seria
    // a cor.
    if (!this.cartesiano()) return true;
    return this.showLegend() ?? this.serieNorm().length > 1;
  });

  private readonly totalPizza = computed(() =>
    this.simpleData().reduce((sum, p) => sum + Math.max(0, p.value), 0),
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
      decal: { show: true, decals: tramas(hsl('background', HATCH_OPACITY)) },
    };
    const title = this.chartTitle() && !compact
      ? { text: this.chartTitle(), left: 'left' }
      : undefined;

    if (this.type() === 'pie') return this.optionPizza(title, aria, animar, dur);
    if (this.type() === 'funnel') return this.optionFunnel(title, aria, animar, dur);
    if (this.type() === 'radar') return this.optionRadar(title, aria, animar, dur);
    if (this.type() === 'scatter') return this.optionScatter(title, animar, dur);
    if (this.type() === 'pie-nest') return this.optionPieNest(title, aria, animar, dur);
    return this.optionCartesiano(title, aria, animar, dur, compact);
  });

  /**
   * Radar: um eixo por grandeza, um polígono fechado por série.
   *
   * É o único tipo deste componente que traz SISTEMA DE COORDENADAS próprio — o
   * bloco `radar` ao lado de `series`, e não dentro dela. Quem descreve os eixos
   * é o `indicator`; a série só carrega os valores, na ordem deles.
   *
   * Nada de reserva em pixel aqui: o centro e o raio são proporção, então o nome
   * de cada eixo — que é texto e cresce com a fonte do navegador — continua
   * cabendo por fora do último anel (WCAG 1.4.4).
   */
  /**
   * Dispersão: dois eixos de valor, um ponto por par, uma FORMA por série.
   *
   * Não recebe `aria` como os outros ramos, e é de propósito: é o tipo em que a
   * trama do decal não serve. A hachura é um ladrilho que se repete; num símbolo
   * de 14px cabe uma repetição ou duas, e duas tramas diferentes saem
   * indistinguíveis — declarada, aplicada, e ainda assim sem separar nada. Quem
   * separa as séries aqui é a FORMA do símbolo, e ela é o sinal primário, não o
   * reforço: é a única marca que o tipo desenha. Por isso o símbolo é maior que
   * o do traçado (14 contra 9), onde ele apenas marca pontos sobre uma linha que
   * já tem desenho próprio de traço.
   *
   * O bloco de acessibilidade continua — o desenho segue anunciado —, só a trama
   * sai.
   */
  /**
   * Rosca ANINHADA: dois anéis concêntricos sobre o mesmo total.
   *
   * O de dentro é derivado da soma por grupo, e é essa derivação que faz o
   * desenho ser verdadeiro: como os dois anéis somam o MESMO total e percorrem a
   * mesma ordem, cada fatia externa cai dentro do vão angular do seu grupo. É a
   * POSIÇÃO que comunica a hierarquia — não a cor, que aqui repete entre os
   * anéis porque as duas séries leem a mesma paleta desde o índice zero.
   *
   * Duas séries `pie` e não uma com níveis: a lib não tem nível em rosca, e
   * `sunburst` — que tem — traz sistema de coordenadas próprio e contrato de
   * dado em árvore, que é outro componente, não outro modo deste.
   *
   * Recebe `aria` porque aqui a trama ALCANÇA: a rosca é de preenchimento, ao
   * contrário da dispersão.
   */
  private optionPieNest(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const points = this.simpleData();
    const groups = this.nestedGroups();
    const labelTokens = this.nestLabelTokens();
    // O centro sobe e os raios encolhem para caber o rótulo e a linha-guia por
    // fora do anel externo. Sem a folga a lib desenha o rótulo, mas cortado pela
    // borda do desenho — que é pior que não desenhar, porque parece defeito de
    // dado.
    const center: [string, string] = ['50%', title ? '50%' : '44%'];
    return {
      title,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      // A legenda nomeia os dois anéis. Sem ela o de dentro fica mudo: o rótulo
      // escrito dentro do arco não cabe em fatia pequena, e a lib o esconde sem
      // avisar.
      legend: points.length > 0
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
      animation: animar,
      animationDuration: dur,
      aria,
    };
  }

  private optionScatter(
    title: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const series = this.serieNorm();
    const legenda = this.legendaVisivel() || series.length > 1;
    return {
      title,
      tooltip: { trigger: 'item' },
      // A legenda amarra a forma ao nome da série. Sem ela o desenho teria
      // formas distintas e nenhuma pista do que cada uma significa.
      legend: legenda ? { bottom: 0, itemWidth: 14 } : undefined,
      grid: {
        left: 16, right: 16,
        top: title ? 48 : 16,
        bottom: legenda ? 48 : 24,
        containLabel: true,
      },
      // A folga do nome do eixo vem do TEMA (`nameGap`), que se reconstrói
      // quando a fonte raiz muda — o nome é texto e cresce com ela (WCAG 1.4.4).
      xAxis: { type: 'value', name: this.xLabel(), nameLocation: 'middle', scale: true },
      yAxis: { type: 'value', name: this.yLabel(), nameLocation: 'middle', scale: true },
      series: series.map((serie, index) => ({
        name: serie.name,
        type: 'scatter',
        data: serie.points ?? [],
        symbol: SIMBOLOS[index % SIMBOLOS.length],
        symbolSize: 14,
        ...(serie.color ? { itemStyle: { color: serie.color } } : {}),
      })),
      animation: animar,
      animationDuration: dur,
      // Trama desligada — ver o comentário acima.
      aria: { enabled: true, label: { enabled: false }, decal: { show: false } },
    };
  }

  private optionRadar(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const axes = this.radarAxesNorm();
    const series = this.serieNorm();
    return {
      title,
      tooltip: { trigger: 'item' },
      legend: this.legendaVisivel()
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      radar: {
        indicator: axes.map((axis) => ({ name: axis.label, max: axis.max })),
        // Polígono, e não círculo: são os vértices que dizem em que grandeza o
        // item é forte, e num anel eles somem.
        shape: 'polygon',
        center: ['50%', this.chartTitle() ? '54%' : '48%'],
        radius: '58%',
      },
      // Uma série de radar só, com um item de dado por série do chamador: é
      // assim que a lib desenha vários polígonos no mesmo sistema de eixos.
      series: [{
        type: 'radar',
        data: series.map((serie, i) => ({
          name: serie.name,
          value: serie.data ?? [],
          // Símbolo e traço próprios, o mesmo vocabulário de forma do traçado:
          // sem a cor, um polígono ainda se separa do outro (WCAG 1.4.1).
          symbol: SIMBOLOS[i % SIMBOLOS.length],
          symbolSize: 9,
          lineStyle: {
            type: TRACOS[i % TRACOS.length],
            ...(serie.color ? { color: serie.color } : {}),
          },
          // A área preenchida é o que faz a trama alcançar o radar: a hachura é
          // de PREENCHIMENTO, e sem `areaStyle` a lib desenha só o contorno do
          // polígono — não haveria o que hachurar. Translúcida porque os
          // polígonos se sobrepõem de propósito: opaco, o de cima apagaria o de
          // baixo, que é justamente a comparação que o radar existe para
          // mostrar.
          areaStyle: { opacity: 0.3 },
          ...(serie.color ? { itemStyle: { color: serie.color } } : {}),
        })),
      }],
      animation: animar,
      animationDuration: dur,
      aria,
    };
  }

  private optionPizza(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const pontos = this.simpleData();
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

  private optionFunnel(
    title: unknown,
    aria: unknown,
    animar: boolean,
    dur: number,
  ): echarts.EChartsCoreOption {
    const stages = this.simpleData();
    // Mesma razão da rosca, e uma a mais: no funil a faixa só carrega cor e
    // largura. Nome, valor e participação ficam escritos na legenda — o texto
    // não vai DENTRO da faixa porque ali ele cairia sobre a cor de série, que
    // é escolhida para 3:1 de objeto gráfico e não para os 4.5:1 que texto
    // exige. Sobre o fundo da página, o mesmo texto passa em qualquer tema.
    const legendText = new Map(
      stages.map((stage) => [
        stage.label,
        `${stage.label} — ${formatarValue(stage.value)} (${this.shareOfFirst(stage.value)})`,
      ]),
    );
    const legenda = this.legendaVisivel();
    // O espaço reservado acima e abaixo do desenho nasce do degrau de texto
    // medido, não de pixel escolhido: título e legenda crescem com a fonte do
    // navegador, e reserva cravada os cortaria (WCAG 1.4.4).
    const topRoom = this.chartTitle() ? scaled(3) : scaled(1.5);
    const bottomRoom = legenda ? scaled(3) : scaled(1.5);

    return {
      title,
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      legend: legenda
        ? {
          bottom: 0,
          icon: 'roundRect',
          itemWidth: 12,
          itemHeight: 8,
          formatter: (name: string) => legendText.get(name) ?? name,
        }
        : undefined,
      series: [{
        type: 'funnel',
        top: topRoom,
        bottom: bottomRoom,
        left: '10%',
        width: '80%',
        // A ordem é a do PROCESSO, não a do valor. Reordenar por valor
        // desenharia um funil bonito a partir de etapas fora de ordem, e o
        // desenho passaria a contar uma história que o dado não conta.
        sort: 'none',
        // Sem piso de largura: a largura da faixa É a participação, e um piso
        // engordaria a última etapa exatamente onde a queda é a informação.
        // É também a coluna que a tabela repete em número — as duas leituras
        // têm de fechar.
        minSize: '0%',
        maxSize: '100%',
        // Fio de separação entre faixas vizinhas, da mesma ordem do contorno.
        gap: 2,
        label: { show: false },
        labelLine: { show: false },
        // Decisão 4 do cabeçalho: é o contorno em `--foreground` que delimita
        // o objeto gráfico e separa uma faixa da vizinha, e não a cor de
        // série. O tema traz o contorno de barra, linha e rosca; o funil
        // declara o seu aqui, resolvido no tema ativo — e o option é
        // recalculado a cada troca de tema (ver `temaVersao`).
        itemStyle: { borderColor: hsl('foreground'), borderWidth: 1 },
        data: stages.map((stage) => ({ name: stage.label, value: stage.value })),
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
        data: serie.data ?? [],
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
        // O rótulo de valor precisa das TRÊS declarações abaixo, e nenhuma é
        // enfeite: sem elas a lib usa os padrões dela, que são cinza `#333`
        // fixo, halo branco de 2px e corpo de 12px cravado.
        //
        // Medido contra o fundo da página, nos três temas:
        //
        //   claro   `#333` 12.46 · halo branco  1.01
        //   escuro  `#333`  1.06 · halo branco 13.36
        //
        // No claro funcionava por ACIDENTE — texto escuro, halo invisível. No
        // escuro o texto sumia e o que sobrava era o halo: o número aparecia
        // grosso e borrado, que foi como o defeito chegou. `--foreground` mede
        // de 13.08 a 18.04 nos dois modos, e com ele o halo deixa de ter função
        // — ele existe para socorrer uma cor fixa que não conhece o tema, e é o
        // que empasta o texto no corpo pequeno.
        //
        // O corpo sai da fonte raiz porque o rótulo é TEXTO e cresce com a
        // fonte do navegador (WCAG 1.4.4); 12px cravado encolheria em proporção
        // a cada degrau de aumento.
        label: labelValues
          ? {
            show: true,
            position: 'top',
            formatter: (p: { value: number }) => formatarValue(p.value),
            ...valueLabelStyle({
              foreground: hsl('foreground'),
              fontSize: Math.round(rootFontSize() * 0.75),
            }),
          }
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
    // O radar é o único tipo com uma coluna ENTRE a categoria e as séries, e ela
    // é o teto do eixo.
    //
    // A razão é a mesma que deu ao funil a coluna de participação — quando a
    // informação mora numa dimensão visual, o texto precisa carregá-la —, mas
    // aqui o denominador não é um só: cada eixo tem a sua escala. Um 7 num eixo
    // que vai a 10 é um vértice quase no anel de fora; o mesmo 7 num eixo que
    // vai a 100 quase encosta no centro. Sem esta coluna, as duas linhas
    // escreveriam "7" e a tabela deixaria de descrever o polígono que está na
    // tela.
    //
    // Uma linha por EIXO, e não por série: é o eixo que tem nome próprio e teto
    // próprio, e cada série ocupa uma coluna à direita.
    // A dispersão não tem eixo de categorias: cada linha é um PONTO, e as duas
    // colunas de número são as duas grandezas que o desenho põe no plano.
    //
    // Uma linha por ponto, e não um resumo por série (quantos pontos, onde fica
    // o centro), porque resumo não é equivalente: quem lê a tabela perderia
    // exatamente o que o desenho mostra, que é ONDE cada ponto caiu.
    //
    // A primeira coluna nomeia a SÉRIE e se repete a cada linha do mesmo grupo —
    // é ela que diz, ponto a ponto, a que grupo ele pertence.
    // A rosca ANINHADA tem duas colunas de nome: o grupo, que é o anel de dentro,
    // e a categoria, que é o de fora.
    //
    // Uma linha por ponto do anel EXTERNO. A participação do grupo não precisa
    // de linha própria porque é DERIVÁVEL — soma das participações dos pontos
    // dele, na mesma coluna. Foi o teste que o radar não passou: lá o teto de
    // cada eixo não saía de nenhuma outra célula, e por isso virou coluna.
    if (this.nestedType()) {
      const points = this.simpleData();
      const total = points.reduce((sum, p) => sum + Math.max(0, p.value), 0);
      return {
        header: [
          this.groupLabel(),
          this.categoryLabel(),
          this.valueLabel(),
          this.shareLabel(),
        ],
        lines: points.map((p) => [
          p.group ?? p.label,
          p.label,
          formatarValue(p.value),
          total > 0 ? `${Math.round((Math.max(0, p.value) / total) * 1000) / 10}%` : '—',
        ]),
      };
    }

    if (this.scatterType()) {
      return {
        header: [this.seriesLabel(), this.xLabel(), this.yLabel()],
        lines: this.serieNorm().flatMap((serie) =>
          (serie.points ?? []).map((ponto) => [
            serie.name,
            formatarValue(ponto[0]),
            formatarValue(ponto[1]),
          ])),
      };
    }

    if (this.radarType()) {
      const series = this.serieNorm();
      return {
        header: [this.categoryLabel(), this.maxLabel(), ...series.map((s) => s.name)],
        lines: this.radarAxesNorm().map((axis, iAxis) => [
          axis.label,
          formatarValue(axis.max),
          ...series.map((s) =>
            (s.data?.[iAxis] === undefined ? '—' : formatarValue(s.data[iAxis]!))),
        ]),
      };
    }
    if (!this.cartesiano()) {
      // Rosca e funil compartilham a forma da tabela — três colunas, sendo a
      // terceira a proporção que o desenho comunica e o texto não carrega
      // sozinho. O que muda é a BASE: total das fatias na rosca, primeira
      // etapa no funil, que é o que a largura da faixa desenha.
      const share = this.type() === 'funnel'
        ? (value: number) => this.shareOfFirst(value)
        : (value: number) => this.percentual(value);
      return {
        header: [this.categoryLabel(), this.valueLabel(), this.shareLabel()],
        lines: this.simpleData().map((p) => [
          p.label,
          formatarValue(p.value),
          share(p.value),
        ]),
      };
    }
    const series = this.serieNorm();
    return {
      header: [this.categoryLabel(), ...series.map((s) => s.name)],
      lines: this.categorias().map((categoria, iCat) => [
        categoria,
        ...series.map((s) => (s.data?.[iCat] === undefined ? '—' : formatarValue(s.data[iCat]!))),
      ]),
    };
  });

  private percentual(value: number): string {
    const total = this.totalPizza();
    if (total <= 0) return '—';
    return `${Math.round((Math.max(0, value) / total) * 1000) / 10}%`;
  }

  /**
   * Quanto sobrou da PRIMEIRA etapa, em por cento.
   *
   * É o número que a largura da faixa desenha, e a razão de a tabela do funil
   * ter três colunas: largura não se lê em texto. A base é a primeira etapa e
   * não o total porque somar etapas de um mesmo processo conta a mesma pessoa
   * quantas vezes ela avançou — o total não significa nada aqui.
   */
  private shareOfFirst(value: number): string {
    const first = this.simpleData()[0]?.value ?? 0;
    if (first <= 0) return '—';
    return `${Math.round((Math.max(0, value) / first) * 1000) / 10}%`;
  }
}
