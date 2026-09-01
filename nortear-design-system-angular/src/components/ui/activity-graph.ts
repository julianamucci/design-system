import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol';
import {
  resolveActivityCalendar,
  type ActivityCalendarCell,
} from '@shared/primitives/activity-calendar';

// ─── ActivityGraph ──────────────────────────────────────────────────────────
//
// Um período de trabalho numa grade de datas: uma casa por dia, uma coluna
// por semana, a força da tinta dizendo quanto aconteceu.
//
// Desenho em docs/shared/styles/nds/resposta-estruturada.css, no bloco "Grade
// de atividade", que também guarda as seis decisões de acessibilidade. O
// vocabulário — ActivityDay — vem de `@shared/primitives/chat-protocol`, e a
// conta de `@shared/primitives/activity-calendar`.
//
// POR QUE ELA É PEÇA, e não um tipo a mais no gráfico. O teste não é se a
// peça existente PODERIA crescer até cobrir a entrada — tudo pode crescer —,
// é se o DESENHO já existe. Medido antes de construir: o gráfico tem oito
// tipos e nenhum é mapa de calor, e o calendário desta casa é uma tabela de
// mês para ESCOLHER data, com navegação e células que são botões. Outra
// geometria, outro propósito.
//
// ELA ABSORVE O MAPA DE CALOR do catálogo, que é a mesma grade sabendo menos:
// um prop só, sem classe de quem consome, janela fixa nos 365 dias que
// terminam hoje e cinco cores em hexadecimal puro, sem modo escuro.
//
// A JANELA É DADO, e é o coração da absorção: nada aqui olha o relógio. Quem
// monta declara o primeiro e o último dia, e é isso que permite pedir o
// trimestre passado.
//
// A ESCALA TAMBÉM É DADO, e obrigatória. Uma escala derivada do maior valor
// faria a MESMA contagem pintar com forças diferentes em duas grades lado a
// lado.
//
// GRADE VAZIA É GRADE, e é a diferença desta peça em relação às duas irmãs da
// família (flow-graph, trace-waterfall). Sem nó não há grafo e sem eixo não
// há cascata, mas uma janela sem atividade nenhuma É a resposta: um trimestre
// em que nada aconteceu se desenha como um trimestre de casas apagadas. A
// peça só deixa de desenhar quando não há JANELA — ou não há escala, porque
// aí todo dia pintaria igual.
//
// A CASA NÃO É PARADA DE TECLADO. Um ano são 365 paradas de tabulação que não
// levam a lugar nenhum, e o que a acessibilidade da peça precisava era do
// NOME de cada casa, não do foco: o nome está lá, dentro de cada uma, em
// texto que só quem ouve recebe.
//
// O QUE O COMPONENTE NÃO FAZ: olhar o relógio, derivar a escala, medir
// elemento, animar, abrir dica, contar tempo, buscar nada. Ele desenha os
// dias que recebe na janela que recebe.
//
// A RAIZ É UM `div`, e por isso o seletor é de ATRIBUTO. A escolha do
// elemento é da folha e não desta stack — mesma escolha do `div[ndsFlowGraph]`
// e do `div[ndsTraceWaterfall]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - SEM JANELA, OU SEM ESCALA, A PEÇA NÃO DESENHA NADA — mas o host
//     continua no documento, e é divergência de framework, não de markup.
//     Onde a fábrica compartilhada devolve `null` e quem monta não chega a
//     inserir elemento nenhum, aqui quem escreve o `<div ndsActivityGraph>` é
//     quem consome, e nenhum componente do Angular pode recusar o próprio
//     host. O que a peça faz é não desenhar NADA dentro: sem total, sem
//     camada que rola, sem parada de teclado e sem `aria-busy`. Sobra um
//     bloco vazio de altura zero, que é o mesmo nada visto da tela — e a
//     razão da guarda continua valendo por inteiro, porque o que ela existe
//     para evitar é a parada de teclado que leva a uma caixa vazia.
//   - as entradas são `input()` de signal, então os dias chegam por
//     `[days]="atividade"`, e a janela por `start="2026-01-01"` e
//     `end="2026-03-31"` (ou por binding, quando é dado).
//   - não há entrada `class`: `class` é nativo do host, e quem consome a
//     escreve direto no elemento. Mesma escolha das duas irmãs.
//   - não há saída nenhuma: a peça não oferece ação, e não há o que avisar.

export interface ActivityGraphLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão da família. A grade é mais larga que a
   * conversa, então ela rola, e o que rola é parada de teclado com
   * `tabindex="0"` — sem nome, quem chega ali ouvindo não sabe onde entrou.
   * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o
   * mesmo nome são duas paradas indistinguíveis.
   */
  region: string;
  /**
   * Quanto aconteceu na janela, visível. `{count}`, `{start}` e `{end}`
   * viram a soma e as duas datas.
   *
   * VISÍVEL, e é decisão: sem ele a grade mostra densidade relativa e nunca
   * diz relativa a quanto — nem qual janela está desenhada, que aqui é dado
   * e não o relógio de hoje.
   */
  total: string;
  /** O molde de uma data. `{day}`, `{month}` e `{year}` viram os três pedaços. */
  dateFormat: string;
  /** Os doze meses, curtos, para os rótulos de coluna. Janeiro é o primeiro. */
  monthsShort: readonly string[];
  /** Os doze meses, por extenso, para a frase que quem ouve recebe. */
  monthsLong: readonly string[];
  /** Os sete dias da semana, curtos. Domingo é o primeiro. */
  weekdaysShort: readonly string[];
  /** A frase do dia sem atividade. `{date}` vira a data. */
  none: string;
  /** A frase do dia com uma ocorrência. `{count}`, `{date}` e `{level}`. */
  one: string;
  /** A frase do dia com mais de uma. `{count}`, `{date}` e `{level}`. */
  many: string;
  /**
   * A palavra de cada nível, do zero ao teto da escala — uma a mais que os
   * degraus.
   *
   * É o que impede o nível de ser só cor (WCAG 1.4.1). O tamanho do quadrado
   * resolve para quem vê; esta palavra resolve para quem ouve, na casa e na
   * legenda.
   */
  levels: readonly string[];
  /** A ponta fraca da legenda. */
  legendLess: string;
  /** A ponta forte da legenda. */
  legendMore: string;
}

/** Os lugares marcados dos moldes de texto. */
const COUNT_PLACEHOLDER = '{count}';
const DATE_PLACEHOLDER = '{date}';
const LEVEL_PLACEHOLDER = '{level}';
const START_PLACEHOLDER = '{start}';
const END_PLACEHOLDER = '{end}';
const DAY_PLACEHOLDER = '{day}';
const MONTH_PLACEHOLDER = '{month}';
const YEAR_PLACEHOLDER = '{year}';

/**
 * A data por extenso, montada a partir do molde do idioma.
 *
 * Mesma leitura do vanilla: o dia já chegou repartido em três números pela
 * conta compartilhada, e o que falta é a ordem em que o idioma os diz.
 */
function formatDate(cell: ActivityCalendarCell, labels: ActivityGraphLabels): string {
  return labels.dateFormat
    .replace(DAY_PLACEHOLDER, String(cell.day))
    .replace(MONTH_PLACEHOLDER, labels.monthsLong[cell.month] ?? '')
    .replace(YEAR_PLACEHOLDER, String(cell.year));
}

/** A frase de uma casa: a contagem, o dia e a palavra do nível. */
function readingOf(cell: ActivityCalendarCell, labels: ActivityGraphLabels): string {
  const date = formatDate(cell, labels);
  // O DIA SEM NADA TEM FRASE PRÓPRIA, e não a frase de contagem com um zero
  // dentro: "zero contribuições" e "nada aconteceu" são a mesma informação, e
  // uma delas se ouve.
  if (cell.count === 0) return labels.none.replace(DATE_PLACEHOLDER, date);

  const template = cell.count === 1 ? labels.one : labels.many;
  return template
    .replace(COUNT_PLACEHOLDER, String(cell.count))
    .replace(DATE_PLACEHOLDER, date)
    .replace(LEVEL_PLACEHOLDER, labels.levels[cell.level] ?? '');
}

/**
 * Uma casa já pronta para o template.
 *
 * As coordenadas e o nível saem daqui como CADEIA, e não como número:
 * `[style.--custom]` com valor numérico faz o Angular anexar "px" à
 * propriedade personalizada, e a folha passaria a receber "3px" onde espera
 * um número. É a mesma nota do `NdsFlowGraph` e do `NdsTraceWaterfall`, e o
 * defeito é silencioso: a tinta simplesmente não pinta.
 */
interface DayView {
  /** A posição entra na chave: a data não se repete dentro de uma janela,
   *  mas a posição junto é a mesma cautela das duas irmãs. */
  key: string;
  date: string;
  level: string;
  column: string;
  row: string;
  reading: string;
}

/** Um rótulo de mês já pronto para o template. */
interface MonthView {
  key: string;
  label: string;
  column: string;
  span: string;
}

/** Um rótulo de dia da semana já pronto para o template. */
interface WeekdayView {
  key: string;
  label: string;
  row: string;
}

/** Uma amostra da legenda já pronta para o template. */
interface SwatchView {
  key: string;
  level: string;
  word: string;
}

/** A grade pronta para o template, ou nada quando não há janela nem escala. */
interface CalendarView {
  levels: string;
  weeks: string;
  total: string;
  months: readonly MonthView[];
  weekdays: readonly WeekdayView[];
  days: readonly DayView[];
  swatches: readonly SwatchView[];
}

@Component({
  selector: 'div[ndsActivityGraph]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-activity-graph',
    '[attr.data-slot]': '"activity-graph"',
    // O TETO DA ESCALA É DADO, e entra por propriedade personalizada porque é
    // dele que a folha tira a fração de tinta de cada nível.
    '[style.--activity-graph-levels]': 'levelsStyle()',
    // OCUPADO ENQUANTO CORRE, e nada aqui é região viva. Uma grade que se
    // reanunciasse a cada casa é impossível de ouvir.
    '[attr.aria-busy]': 'busy()',
  },
  template: `
    <!-- SEM JANELA, OU SEM ESCALA, NÃO HÁ GRADE, e nada é desenhado dentro
         do host: nem total, nem camada que rola. Uma parada de teclado que
         leva a uma caixa vazia é ruído com nome, e por isso a peça prefere
         não desenhar. Note o que NÃO está aqui: dias vazios. Uma janela sem
         atividade nenhuma é a resposta, e devolver nada esconderia
         exatamente essa informação. -->
    @if (view(); as drawn) {
      <!-- QUANTO ACONTECEU NA JANELA, dito em palavras e visível. -->
      <p class="nds-activity-graph-total" data-slot="activity-graph-total">{{ drawn.total }}</p>

      <!-- A CAMADA QUE ROLA, com o PAR COMPLETO: a parada de tabulação sem
           papel deixaria uma parada de teclado anônima, e o nome acessível
           sobre um div sem papel é DESCARTADO pelo navegador
           (aria-prohibited-attr). Papel de grupo e não de região: uma página
           de documentação tem dezenas destas, e região com nome vira dezenas
           de marcos homônimos. -->
      <div
        class="nds-activity-graph-viewport"
        data-slot="activity-graph-viewport"
        tabindex="0"
        role="group"
        [attr.aria-label]="labels().region"
      >
        <div
          class="nds-activity-graph-calendar"
          data-slot="activity-graph-calendar"
          [style.--activity-graph-weeks]="drawn.weeks"
        >
          <!-- FORA DA LEITURA: elas são âncora para o olho encontrar a
               coluna, e a data inteira já vem dentro de cada casa. -->
          <ol class="nds-activity-graph-months" data-slot="activity-graph-months" aria-hidden="true">
            @for (month of drawn.months; track month.key) {
              <li
                class="nds-activity-graph-month"
                data-slot="activity-graph-month"
                [style.--activity-graph-month-column]="month.column"
                [style.--activity-graph-month-span]="month.span"
              >{{ month.label }}</li>
            }
          </ol>

          <ol class="nds-activity-graph-weekdays" data-slot="activity-graph-weekdays" aria-hidden="true">
            @for (weekday of drawn.weekdays; track weekday.key) {
              <li
                class="nds-activity-graph-weekday"
                data-slot="activity-graph-weekday"
                [style.--activity-graph-weekday-row]="weekday.row"
              >{{ weekday.label }}</li>
            }
          </ol>

          <!-- Lista ordenada e não simples: a ordem é a do calendário, do
               primeiro dia da janela ao último, e ela é a ordem de leitura
               (WCAG 1.3.2). A posição na grade é para o olho. -->
          <ol class="nds-activity-graph-days" data-slot="activity-graph-days">
            @for (day of drawn.days; track day.key) {
              <li
                class="nds-activity-graph-day"
                data-slot="activity-graph-day"
                [attr.data-level]="day.level"
                [attr.data-date]="day.date"
                [style.--activity-graph-day-column]="day.column"
                [style.--activity-graph-day-row]="day.row"
                [style.--activity-graph-day-level]="day.level"
              >
                <!-- A LEITURA DA CASA: o dia, a contagem e a palavra do
                     nível. É o que faz a grade se reconstruir de ouvido. -->
                <span
                  class="nds-sr-only"
                  data-slot="activity-graph-day-reading"
                >{{ day.reading }}</span>
              </li>
            }
          </ol>
        </div>
      </div>

      <!-- A LEGENDA É LIDA, e não é decoração: as duas pontas são texto
           visível, e cada amostra carrega a palavra do seu nível para quem
           não distingue as cinco forças. -->
      <div class="nds-activity-graph-legend" data-slot="activity-graph-legend">
        <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{{ labels().legendLess }}</span>
        <ol class="nds-activity-graph-scale" data-slot="activity-graph-scale">
          @for (swatch of drawn.swatches; track swatch.key) {
            <li
              class="nds-activity-graph-swatch"
              data-slot="activity-graph-swatch"
              [attr.data-level]="swatch.level"
              [style.--activity-graph-day-level]="swatch.level"
            >
              <span class="nds-sr-only" data-slot="activity-graph-swatch-reading">{{ swatch.word }}</span>
            </li>
          }
        </ol>
        <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{{ labels().legendMore }}</span>
      </div>
    }
  `,
})
export class NdsActivityGraph {
  /**
   * O que aconteceu, dia a dia. Dia fora da janela sai; dia repetido soma.
   *
   * Pode vir vazio, e vazio não é ausência de resposta: é a resposta de um
   * período em que nada aconteceu.
   */
  readonly days = input.required<readonly ActivityDay[]>();

  /** O primeiro dia da janela, em ano-mês-dia. */
  readonly start = input.required<string>();

  /** O último dia da janela, em ano-mês-dia. */
  readonly end = input.required<string>();

  /**
   * Os degraus da escala, em contagem. Obrigatório — ver o docblock do
   * módulo.
   */
  readonly thresholds = input.required<readonly number[]>();

  /** Em que dia a semana começa, com zero no domingo. */
  readonly weekStart = input<number>(0);

  /**
   * Em que pé está a execução que escreve a grade.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça
   * se declara ocupada. Receber as cinco palavras e perguntar uma coisa só
   * não é achatamento de dado — um booleano na assinatura obrigaria quem
   * consome a traduzir cinco palavras em duas no ponto da chamada, que é
   * onde a perda aconteceria.
   */
  readonly status = input<RunStatus>('idle');

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ActivityGraphLabels>();

  /**
   * A grade pronta para o template, ou nada.
   *
   * A conta inteira sai de `resolveActivityCalendar`, e o que este `computed`
   * faz com o resultado é só o que é DESTA stack: virar cadeia o que entra
   * em propriedade personalizada, e escrever a frase de cada casa.
   */
  protected readonly view = computed<CalendarView | null>(() => {
    const drawing = resolveActivityCalendar(this.days(), {
      start: this.start(),
      end: this.end(),
      thresholds: this.thresholds(),
      weekStart: this.weekStart(),
    });
    // SEM JANELA, OU SEM ESCALA, NÃO HÁ GRADE. E note o que NÃO está aqui:
    // dias vazios. Uma janela sem atividade nenhuma é a resposta, e devolver
    // nada esconderia exatamente essa informação.
    if (!drawing) return null;

    const labels = this.labels();

    return {
      levels: String(drawing.levels),
      weeks: String(drawing.weeks),
      total: labels.total
        .replace(COUNT_PLACEHOLDER, String(drawing.total))
        .replace(START_PLACEHOLDER, formatDate(drawing.from, labels))
        .replace(END_PLACEHOLDER, formatDate(drawing.to, labels)),
      months: drawing.months.map((month, index) => ({
        key: `${index}-${month.month}-${month.column}`,
        label: labels.monthsShort[month.month] ?? '',
        column: String(month.column),
        span: String(month.span),
      })),
      weekdays: drawing.weekdays.map((weekday, index) => ({
        key: `${index}-${weekday.weekday}`,
        label: labels.weekdaysShort[weekday.weekday] ?? '',
        row: String(weekday.row),
      })),
      days: drawing.cells.map((cell, index) => ({
        // O ENDEREÇO NÃO SE REPETE dentro de uma janela, mas a posição junto
        // na chave é a mesma cautela das duas irmãs desta família.
        key: `${index}-${cell.date}`,
        date: cell.date,
        level: String(cell.level),
        column: String(cell.column),
        row: String(cell.row),
        reading: readingOf(cell, labels),
      })),
      swatches: Array.from({ length: drawing.levels + 1 }, (_, level) => ({
        key: String(level),
        level: String(level),
        word: labels.levels[level] ?? '',
      })),
    };
  });

  /** O teto da escala, para o host — nada quando não há grade. */
  protected readonly levelsStyle = computed(() => this.view()?.levels ?? null);

  /**
   * A peça se declara ocupada enquanto a execução corre, e em nenhum outro
   * momento — nem quando não há grade, porque aí não há peça a declarar.
   */
  protected readonly busy = computed(() =>
    this.status() === 'running' && this.view() !== null ? 'true' : null,
  );
}
