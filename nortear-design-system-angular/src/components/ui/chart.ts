import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

// ─── Chart ────────────────────────────────────────────────────────────────────
//
// CAMINHO DE RENDERIZAÇÃO ESCOLHIDO: **SVG puro, desenhado aqui**.
//
// Por quê: o `package.json` deste pacote não tem echarts nem wrapper de gráfico,
// e instalar dependência está fora do escopo. O Vanilla — referência cross-stack
// — hoje usa echarts, mas o CSS compartilhado que ele consome
// (`docs/shared/styles/nds/chart.css`) foi escrito para exatamente este caminho:
// "Container responsivo para gráficos SVG. Cores e tipo (bar/line) vêm da
// factory", com `.nds-chart > svg { display: block; width: 100% }`. É esse
// contrato que o componente cumpre: o SVG tem `viewBox` e nenhuma altura
// cravada — a altura nasce da proporção do viewBox aplicada à largura do
// container, e o `min-height` do `.nds-chart` segura o piso.
//
// Sem `font-size` em nenhum `<text>`: o SVG herda a tipografia do container, de
// modo que aumentar a fonte do navegador aumenta o texto do gráfico junto
// (WCAG 1.4.4). Cravar `font-size="12"` congelaria o rótulo do eixo.
//
// ─── Acessibilidade: as quatro decisões ──────────────────────────────────────
//
// 1. ALTERNATIVA TEXTUAL EQUIVALENTE — o componente emite, sempre, uma
//    `<table>` de verdade com os mesmos números do desenho: cabeçalho por
//    série, `<th scope="row">` por categoria, `<caption>` com a descrição do
//    gráfico. Por padrão ela é `.nds-sr-only` (existe para leitor de tela e
//    para quem lê o DOM); `showData` a torna visível para todo mundo. Um
//    `<svg>` mudo seria conteúdo perdido — a tabela é o conteúdo.
//
// 2. `role="img"` + `aria-label` vão no **`<svg>`**, não no `<div>` container.
//    Isto diverge do texto do conteúdo compartilhado, que fala em
//    `div[data-slot=chart]`, e a divergência é deliberada: `role="img"` poda a
//    subárvore da árvore de acessibilidade. No container, a tabela de dados
//    ficaria escondida junto — a alternativa textual sumiria. No `<svg>`, o
//    desenho é anunciado como uma imagem com rótulo e a tabela continua
//    exposta, lado a lado.
//
// 3. A INFORMAÇÃO NÃO VIVE NA COR. Cada série recebe uma trama (hachura
//    diagonal, pontos, grade…) sobreposta ao preenchimento — o equivalente ao
//    `decal` do ECharts que o conteúdo compartilhado promete — e a legenda
//    traz o nome escrito. Em `line`, além da cor, cada série tem símbolo de
//    ponto próprio (círculo, quadrado, triângulo, losango, cruz). Retirando
//    toda a cor, o gráfico continua legível.
//
// 4. CONTRASTE (WCAG 1.4.11). Toda forma de dado — barra, fatia, símbolo —
//    é contornada com `hsl(var(--foreground))`, que passa de 3:1 contra o
//    fundo em qualquer tema. É o contorno que delimita o objeto gráfico, e
//    não a cor de série: os tokens `--chart-1` a `--chart-5` do tema padrão
//    ficam entre 2.0:1 e 2.9:1 contra o fundo branco e entre 1.14:1 e 1.29:1
//    entre vizinhos, ou seja, sozinhos não sustentam o critério.
//
// SEM TOOLTIP POR PONTEIRO. Cada forma leva um `<title>` (dica nativa do
// navegador ao passar o mouse), mas nenhuma informação existe só ali: o mesmo
// par categoria/valor está na tabela, alcançável sem ponteiro e sem foco.
//
// Divergência de API registrada (não "alinhada"): as outras stacks separam
// `ChartContainer` + `buildXOption`. Aqui é um componente só, com inputs
// declarativos — Angular não teria o que ganhar montando um objeto de
// configuração para repassar a si mesmo.

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

// ─── Geometria (unidades do viewBox, não pixels) ─────────────────────────────
//
// Tudo abaixo é dado virando desenho: `x`, `y`, `width`, `d`, `points`. Não é
// CSS inline — cor e tipografia continuam vindo de token.

const VB_L = 640;
const VB_A = 320;
const MARGEM = { esq: 72, dir: 24, topo: 24, base: 44 };
const ALT_TITULO = 26;
const ALT_LEGENDA = 34;
const DIVISOES_Y = 4;
const RAIO_SIMBOLO = 5;

/** Tramas do decal. Uma por posição de série; o 6º volta ao 1º. */
const TRAMAS: readonly string[] = [
  'M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6', // diagonal ascendente
  'M2 2 L2 2 M6 6 L6 6',               // pontos (stroke-linecap round)
  'M0 0 L8 8 M-2 6 L2 10 M6 -2 L10 2', // diagonal descendente
  'M0 2 L8 2 M0 6 L8 6',               // horizontais
  'M0 4 L8 4 M4 0 L4 8',               // grade
];

/** Traços de linha — a série se distingue sem depender da cor. */
const TRACOS: readonly string[] = ['0', '10 5', '2 4', '12 4 2 4', '6 3 2 3'];

/** Formas de símbolo, na ordem das séries. */
type FormaSimbolo = 'circulo' | 'quadrado' | 'triangulo' | 'losango' | 'cruz';
const FORMAS: readonly FormaSimbolo[] = ['circulo', 'quadrado', 'triangulo', 'losango', 'cruz'];

export interface GradeY { y: number; rotulo: string }
export interface MarcaX { x: number; rotulo: string }
export interface FormaDado {
  /** `d` de path ou geometria de rect, conforme o consumidor. */
  x: number; y: number; w: number; h: number;
  cor: string; trama: string; serie: number; titulo: string;
}
export interface TracadoLinha { d: string; cor: string; traco: string; serie: number }
export interface AreaPreenchida { d: string; cor: string; trama: string; serie: number }
export interface SimboloPonto { d: string; cor: string; serie: number; titulo: string }
export interface FatiaPizza { d: string; cor: string; trama: string; serie: number; titulo: string }
export interface RotuloValor { x: number; y: number; texto: string }
export interface ItemLegenda {
  x: number; y: number; cor: string; trama: string; traco: string;
  simbolo: string; texto: string;
}

// ─── Funções puras ────────────────────────────────────────────────────────────

/** Escada "redonda" para o eixo Y: 0, passo, 2·passo… até cobrir o máximo. */
function escalaY(maximo: number): { topo: number; passo: number } {
  if (!(maximo > 0)) return { topo: 1, passo: 1 / DIVISOES_Y };
  const bruto = maximo / DIVISOES_Y;
  const magnitude = Math.pow(10, Math.floor(Math.log10(bruto)));
  const normalizado = bruto / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  const passo = fator * magnitude;
  return { topo: Math.ceil(maximo / passo) * passo, passo };
}

/** Número curto o bastante para caber no eixo, sem depender de locale. */
export function formatarValor(valor: number): string {
  if (Number.isInteger(valor)) return String(valor);
  return String(Math.round(valor * 100) / 100);
}

/** Cor da série: a explícita, ou o token da posição (ciclo de 5). */
function corDaSerie(indice: number, explicita?: string): string {
  return explicita ?? `hsl(var(--chart-${(indice % 5) + 1}))`;
}

function caminhoSimbolo(forma: FormaSimbolo, cx: number, cy: number, r: number): string {
  switch (forma) {
    case 'quadrado':
      return `M${cx - r} ${cy - r} H${cx + r} V${cy + r} H${cx - r} Z`;
    case 'triangulo':
      return `M${cx} ${cy - r} L${cx + r} ${cy + r} L${cx - r} ${cy + r} Z`;
    case 'losango':
      return `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`;
    case 'cruz':
      return `M${cx - r} ${cy - r} L${cx + r} ${cy + r} M${cx + r} ${cy - r} L${cx - r} ${cy + r}`;
    default:
      // Círculo por dois arcos — mantém tudo como `d` de path.
      return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;
  }
}

/** Setor de rosca entre dois ângulos (radianos, 0 = topo, sentido horário). */
function caminhoFatia(
  cx: number, cy: number, raio: number, raioInterno: number,
  de: number, ate: number,
): string {
  // 2π quebra o arco (início e fim coincidem): corta um fio de ângulo.
  const fim = ate - de >= Math.PI * 2 ? de + Math.PI * 2 - 0.0001 : ate;
  const grande = fim - de > Math.PI ? 1 : 0;
  const p = (ang: number, r: number) => `${cx + r * Math.sin(ang)} ${cy - r * Math.cos(ang)}`;
  return [
    `M${p(de, raio)}`,
    `A${raio} ${raio} 0 ${grande} 1 ${p(fim, raio)}`,
    `L${p(fim, raioInterno)}`,
    `A${raioInterno} ${raioInterno} 0 ${grande} 0 ${p(de, raioInterno)}`,
    'Z',
  ].join(' ');
}

let sequencia = 0;

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
      <p class="nds-chart-empty">{{ emptyLabel() }}</p>
    } @else {
      <svg
        [attr.viewBox]="'0 0 ' + VB_L + ' ' + vbA()"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        [attr.aria-label]="label()"
      >
        <defs>
          @for (trama of tramas(); track trama.id) {
            <pattern
              [attr.id]="trama.id"
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <path
                [attr.d]="trama.d"
                fill="none"
                stroke="hsl(var(--background))"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </pattern>
          }
        </defs>

        @if (chartTitle()) {
          <text x="8" y="18" fill="hsl(var(--foreground))">{{ chartTitle() }}</text>
        }

        @if (cartesiano()) {
          <!-- Grade + rótulos do eixo Y. As linhas são decorativas; o número
               ao lado é que carrega a informação. -->
          @for (linha of gradeY(); track linha.y) {
            <line
              [attr.x1]="plot().x"
              [attr.y1]="linha.y"
              [attr.x2]="plot().x + plot().w"
              [attr.y2]="linha.y"
              stroke="hsl(var(--border))"
              stroke-width="1"
            />
            <text
              [attr.x]="plot().x - 10"
              [attr.y]="linha.y"
              text-anchor="end"
              dominant-baseline="middle"
              fill="hsl(var(--muted-foreground))"
            >{{ linha.rotulo }}</text>
          }

          @for (marca of marcasX(); track marca.rotulo) {
            <text
              [attr.x]="marca.x"
              [attr.y]="plot().y + plot().h + 20"
              text-anchor="middle"
              dominant-baseline="hanging"
              fill="hsl(var(--muted-foreground))"
            >{{ marca.rotulo }}</text>
          }
        }

        <!-- Áreas primeiro: ficam atrás da linha e dos símbolos. -->
        @for (area of areas(); track $index) {
          <path [attr.d]="area.d" [attr.fill]="area.cor" fill-opacity="0.2" stroke="none" />
          <path [attr.d]="area.d" [attr.fill]="'url(#' + area.trama + ')'" fill-opacity="0.5" stroke="none" />
        }

        <!-- Barras: retângulo de cor + retângulo de trama com o contorno. -->
        @for (barra of barras(); track $index) {
          <rect
            [attr.x]="barra.x" [attr.y]="barra.y"
            [attr.width]="barra.w" [attr.height]="barra.h"
            [attr.fill]="barra.cor"
            [attr.data-series]="barra.serie"
            stroke="none"
          ><title>{{ barra.titulo }}</title></rect>
          <rect
            [attr.x]="barra.x" [attr.y]="barra.y"
            [attr.width]="barra.w" [attr.height]="barra.h"
            [attr.fill]="'url(#' + barra.trama + ')'"
            stroke="hsl(var(--foreground))"
            stroke-width="1"
          />
        }

        @for (linha of linhas(); track $index) {
          <path
            [attr.d]="linha.d"
            fill="none"
            [attr.stroke]="linha.cor"
            [attr.stroke-dasharray]="linha.traco"
            [attr.data-series]="linha.serie"
            stroke-width="2.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        }

        @for (simbolo of simbolos(); track $index) {
          <path
            [attr.d]="simbolo.d"
            [attr.fill]="simbolo.cor"
            [attr.data-series]="simbolo.serie"
            stroke="hsl(var(--foreground))"
            stroke-width="1"
          ><title>{{ simbolo.titulo }}</title></path>
        }

        @for (fatia of fatias(); track $index) {
          <path
            [attr.d]="fatia.d"
            [attr.fill]="fatia.cor"
            [attr.data-series]="fatia.serie"
            stroke="none"
          ><title>{{ fatia.titulo }}</title></path>
          <path
            [attr.d]="fatia.d"
            [attr.fill]="'url(#' + fatia.trama + ')'"
            stroke="hsl(var(--foreground))"
            stroke-width="1"
          />
        }

        <!-- Valor legível junto do dado — só na série única, onde cabe. -->
        @for (rotulo of rotulosValor(); track $index) {
          <text
            [attr.x]="rotulo.x"
            [attr.y]="rotulo.y"
            text-anchor="middle"
            fill="hsl(var(--foreground))"
          >{{ rotulo.texto }}</text>
        }

        @for (item of legenda(); track item.texto) {
          @if (tipoLegendaLinha()) {
            <path
              [attr.d]="'M' + item.x + ' ' + (item.y + 7) + ' h22'"
              fill="none"
              [attr.stroke]="item.cor"
              [attr.stroke-dasharray]="item.traco"
              stroke-width="2.5"
            />
            <path
              [attr.d]="item.simbolo"
              [attr.fill]="item.cor"
              stroke="hsl(var(--foreground))"
              stroke-width="1"
            />
          } @else {
            <rect
              [attr.x]="item.x" [attr.y]="item.y"
              width="14" height="14"
              [attr.fill]="item.cor"
              stroke="none"
            />
            <rect
              [attr.x]="item.x" [attr.y]="item.y"
              width="14" height="14"
              [attr.fill]="'url(#' + item.trama + ')'"
              stroke="hsl(var(--foreground))"
              stroke-width="1"
            />
          }
          <text
            [attr.x]="item.x + 30"
            [attr.y]="item.y + 7"
            dominant-baseline="middle"
            fill="hsl(var(--foreground))"
          >{{ item.texto }}</text>
        }
      </svg>

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
              @for (coluna of tabela().cabecalho; track coluna) {
                <th scope="col">{{ coluna }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (linha of tabela().linhas; track $index) {
              <tr>
                <th scope="row">{{ linha[0] }}</th>
                @for (celula of linha.slice(1); track $index) {
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
   * `<svg>` e a `<caption>` da tabela. Sem ele o desenho é conteúdo perdido,
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

  // O contexto de template não tem globais — as constantes viram campos.
  protected readonly VB_L = VB_L;

  /** Altura do viewBox: achatada no modo compacto. */
  protected readonly vbA = computed(() => (this.compact() ? 140 : VB_A));

  /** Ids de `<pattern>` precisam ser únicos no documento inteiro. */
  private readonly uid = `nds-chart-${++sequencia}`;

  protected readonly cartesiano = computed(() => this.type() !== 'pie');

  protected readonly serieNorm = computed<ChartSeries[]>(() => {
    const multi = this.series();
    if (multi && multi.length > 0) return multi;
    const simples = this.data();
    if (simples && simples.length > 0) {
      return [{ name: this.valueLabel(), data: simples.map((p) => p.value) }];
    }
    return [];
  });

  protected readonly categorias = computed<string[]>(() => {
    const eixo = this.xAxis();
    if (eixo && eixo.length > 0) return eixo;
    const simples = this.data();
    if (simples && simples.length > 0) return simples.map((p) => p.label);
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

  protected readonly tipoLegendaLinha = computed(() => this.type() === 'line');

  protected readonly tramas = computed(() =>
    TRAMAS.map((d, i) => ({ id: `${this.uid}-trama-${i}`, d })),
  );

  protected readonly plot = computed(() => {
    // No modo compacto não há eixo para rotular: a margem some e o traçado
    // ocupa a caixa inteira.
    if (this.compact()) return { x: 6, y: 6, w: VB_L - 12, h: this.vbA() - 12 };
    const y = MARGEM.topo + (this.chartTitle() ? ALT_TITULO : 0);
    const base = this.vbA() - MARGEM.base - (this.legendaVisivel() ? ALT_LEGENDA : 0);
    return { x: MARGEM.esq, y, w: VB_L - MARGEM.esq - MARGEM.dir, h: Math.max(1, base - y) };
  });

  private readonly escala = computed(() => {
    const maximo = this.serieNorm().reduce(
      (max, s) => s.data.reduce((m, v) => Math.max(m, v), max),
      0,
    );
    return escalaY(maximo);
  });

  protected readonly gradeY = computed<GradeY[]>(() => {
    if (!this.cartesiano() || this.compact()) return [];
    const { y, h } = this.plot();
    const { topo } = this.escala();
    return Array.from({ length: DIVISOES_Y + 1 }, (_, i) => {
      const fracao = i / DIVISOES_Y;
      return { y: y + h - fracao * h, rotulo: formatarValor(topo * fracao) };
    });
  });

  private readonly banda = computed(() => {
    const total = Math.max(1, this.categorias().length);
    return this.plot().w / total;
  });

  protected readonly marcasX = computed<MarcaX[]>(() => {
    if (!this.cartesiano() || this.compact()) return [];
    const { x } = this.plot();
    const banda = this.banda();
    return this.categorias().map((rotulo, i) => ({ x: x + (i + 0.5) * banda, rotulo }));
  });

  /** y de um valor dentro da área de plotagem. */
  private posY(valor: number): number {
    const { y, h } = this.plot();
    const { topo } = this.escala();
    return y + h - (Math.max(0, valor) / topo) * h;
  }

  protected readonly barras = computed<FormaDado[]>(() => {
    if (this.type() !== 'bar') return [];
    const series = this.serieNorm();
    const banda = this.banda();
    const { x, y, h } = this.plot();
    const grupo = banda * 0.68;
    const largura = grupo / Math.max(1, series.length);
    const saida: FormaDado[] = [];
    this.categorias().forEach((categoria, iCat) => {
      series.forEach((serie, iSerie) => {
        const valor = serie.data[iCat];
        if (valor === undefined) return;
        const topoBarra = this.posY(valor);
        saida.push({
          x: x + iCat * banda + (banda - grupo) / 2 + iSerie * largura,
          y: topoBarra,
          w: largura,
          h: Math.max(0, y + h - topoBarra),
          cor: corDaSerie(iSerie, serie.color),
          trama: `${this.uid}-trama-${iSerie % TRAMAS.length}`,
          serie: iSerie,
          titulo: `${serie.name}, ${categoria}: ${formatarValor(valor)}`,
        });
      });
    });
    return saida;
  });

  private readonly pontos = computed(() => {
    if (this.type() !== 'line' && this.type() !== 'area') return [];
    const banda = this.banda();
    const { x } = this.plot();
    return this.serieNorm().map((serie, iSerie) => ({
      serie: iSerie,
      cor: corDaSerie(iSerie, serie.color),
      nome: serie.name,
      coords: this.categorias().flatMap((categoria, iCat) => {
        const valor = serie.data[iCat];
        if (valor === undefined) return [];
        return [{
          cx: x + (iCat + 0.5) * banda,
          cy: this.posY(valor),
          titulo: `${serie.name}, ${categoria}: ${formatarValor(valor)}`,
        }];
      }),
    }));
  });

  protected readonly linhas = computed<TracadoLinha[]>(() =>
    this.pontos()
      .filter((s) => s.coords.length > 0)
      .map((s) => ({
        d: s.coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cy}`).join(' '),
        cor: s.cor,
        traco: TRACOS[s.serie % TRACOS.length],
        serie: s.serie,
      })),
  );

  protected readonly areas = computed<AreaPreenchida[]>(() => {
    if (this.type() !== 'area') return [];
    const base = this.plot().y + this.plot().h;
    return this.pontos()
      .filter((s) => s.coords.length > 0)
      .map((s) => ({
        d: [
          s.coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.cy}`).join(' '),
          `L${s.coords[s.coords.length - 1].cx} ${base}`,
          `L${s.coords[0].cx} ${base}`,
          'Z',
        ].join(' '),
        cor: s.cor,
        trama: `${this.uid}-trama-${s.serie % TRAMAS.length}`,
        serie: s.serie,
      }));
  });

  protected readonly simbolos = computed<SimboloPonto[]>(() =>
    this.pontos().flatMap((s) =>
      s.coords.map((p) => ({
        d: caminhoSimbolo(FORMAS[s.serie % FORMAS.length], p.cx, p.cy, RAIO_SIMBOLO),
        cor: s.cor,
        serie: s.serie,
        titulo: p.titulo,
      })),
    ),
  );

  private readonly totalPizza = computed(() =>
    this.fatiasDados().reduce((soma, p) => soma + Math.max(0, p.value), 0),
  );

  protected readonly fatias = computed<FatiaPizza[]>(() => {
    if (this.cartesiano()) return [];
    const pontos = this.fatiasDados();
    const total = this.totalPizza();
    if (total <= 0) return [];
    const { x, y, w, h } = this.plot();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const raio = (Math.min(w, h) / 2) * 0.92;
    let angulo = 0;
    return pontos.map((ponto, i) => {
      const fracao = Math.max(0, ponto.value) / total;
      const de = angulo;
      angulo += fracao * Math.PI * 2;
      return {
        d: caminhoFatia(cx, cy, raio, raio * 0.55, de, angulo),
        cor: corDaSerie(i, undefined),
        trama: `${this.uid}-trama-${i % TRAMAS.length}`,
        serie: i,
        titulo: `${ponto.label}: ${formatarValor(ponto.value)} (${this.percentual(ponto.value)})`,
      };
    });
  });

  protected readonly rotulosValor = computed<RotuloValor[]>(() => {
    // Só na série única: com duas séries os números se sobrepõem e a tabela
    // já entrega o valor exato.
    const series = this.serieNorm();
    if (!this.cartesiano() || this.compact() || series.length !== 1) return [];
    const valores = series[0].data;
    if (this.type() === 'bar') {
      return this.barras().map((barra, i) => ({
        x: barra.x + barra.w / 2,
        y: barra.y - 6,
        texto: formatarValor(valores[i] ?? 0),
      }));
    }
    const banda = this.banda();
    const { x } = this.plot();
    return this.categorias().flatMap((_, i) => {
      const valor = valores[i];
      if (valor === undefined) return [];
      return [{
        x: x + (i + 0.5) * banda,
        y: this.posY(valor) - RAIO_SIMBOLO - 6,
        texto: formatarValor(valor),
      }];
    });
  });

  protected readonly legenda = computed<ItemLegenda[]>(() => {
    if (!this.legendaVisivel()) return [];
    const nomes = this.cartesiano()
      ? this.serieNorm().map((s, i) => ({ texto: s.name, cor: corDaSerie(i, s.color), i }))
      : this.fatiasDados().map((p, i) => ({
        texto: `${p.label} — ${formatarValor(p.value)} (${this.percentual(p.value)})`,
        cor: corDaSerie(i, undefined),
        i,
      }));
    if (nomes.length === 0) return [];
    const vaga = Math.min(220, VB_L / nomes.length);
    const inicio = (VB_L - vaga * nomes.length) / 2;
    const y = this.vbA() - ALT_LEGENDA + 8;
    return nomes.map((n) => {
      const x = inicio + n.i * vaga;
      return {
        x,
        y,
        cor: n.cor,
        trama: `${this.uid}-trama-${n.i % TRAMAS.length}`,
        traco: TRACOS[n.i % TRACOS.length],
        simbolo: caminhoSimbolo(FORMAS[n.i % FORMAS.length], x + 11, y + 7, RAIO_SIMBOLO),
        texto: n.texto,
      };
    });
  });

  protected readonly tabela = computed<{ cabecalho: string[]; linhas: string[][] }>(() => {
    if (!this.cartesiano()) {
      return {
        cabecalho: [this.categoryLabel(), this.valueLabel(), this.shareLabel()],
        linhas: this.fatiasDados().map((p) => [
          p.label,
          formatarValor(p.value),
          this.percentual(p.value),
        ]),
      };
    }
    const series = this.serieNorm();
    return {
      cabecalho: [this.categoryLabel(), ...series.map((s) => s.name)],
      linhas: this.categorias().map((categoria, iCat) => [
        categoria,
        ...series.map((s) => (s.data[iCat] === undefined ? '—' : formatarValor(s.data[iCat]))),
      ]),
    };
  });

  private percentual(valor: number): string {
    const total = this.totalPizza();
    if (total <= 0) return '—';
    return `${Math.round((Math.max(0, valor) / total) * 1000) / 10}%`;
  }
}
