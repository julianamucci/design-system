import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injector,
  OnInit,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  getLocalTimeZone,
  parseDate,
  today,
  type DateValue,
} from '@internationalized/date';
import { createMonths, type Month } from '@radix-ng/primitives/core';
import {
  RdxCalendarCellDirective,
  RdxCalendarCellTriggerDirective,
  RdxCalendarGridBodyDirective,
  RdxCalendarGridDirective,
  RdxCalendarGridHeadDirective,
  RdxCalendarGridRowDirective,
  RdxCalendarHeadCellDirective,
  RdxCalendarNextDirective,
  RdxCalendarPrevDirective,
  RdxCalendarRootDirective,
} from '@radix-ng/primitives/calendar';
import { calendarLabels } from '@shared/primitives/calendar-labels';
import { teclaTarget, gridDay, isoDoElemento } from '@shared/primitives/calendar-teclado';

// ─── Calendar ─────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-calendar-* (docs/shared/styles/nds/calendar.css). A
// árvore é a mesma do Vanilla, que é a referência de markup:
//
//   div.nds-calendar-root[data-slot="calendar"]
//     div.nds-calendar-months
//       div.nds-calendar-nav-overlay > button.nds-calendar-nav-btn ×2
//       div.nds-calendar-month
//         div.nds-calendar-caption
//         table.nds-calendar-table[role="grid"]
//           thead[aria-hidden] > tr.nds-calendar-weekdays > th.nds-calendar-weekday
//           tbody > tr.nds-calendar-week > td.nds-calendar-day-cell[role="gridcell"]
//                     > button.nds-calendar-day-btn
//
// COM os primitivos do Radix NG (`@radix-ng/primitives/calendar`), porque o que
// eles entregam é a parte cara: a matriz de seleção (uma data ou várias), o
// `aria-label` da célula com a data por extenso no locale ativo, `aria-selected`
// na célula certa (a `<td>`, que é quem tem papel de `gridcell`), a tabulação
// móvel — só um dia entra na ordem de Tab — e a navegação por setas que atravessa
// a borda do mês virando a página.
//
// O que eles NÃO entregam, e este componente acrescenta:
//
//   · PageUp/PageDown (mês, e com Shift o ano) e Home/End (pontas da semana).
//     O primitivo só mapeia setas, Enter e Espaço; sem o resto, atravessar um
//     ano custa doze cliques no botão de mês.
//   · a legenda em texto e a legenda com seletores de mês e ano, que ele não
//     desenha;
//   · o locale do formatador — ver a nota em `NdsCalendarMonths`;
//   · o descarte de `role="application"`, também explicado lá.
//
// INTERVALO (`range`) não existe aqui: o primitivo desta stack expõe uma data ou
// uma lista de datas avulsas, e não um par início/fim. É divergência de API de
// framework, registrada e não "alinhada".

// ─── Types ────────────────────────────────────────────────────────────────────

/** Uma data (padrão) ou várias datas avulsas. */
export type CalendarMode = 'single' | 'multiple';

/** Legenda em texto (padrão) ou com seletores de mês e ano. */
export type CalendarCaptionLayout = 'label' | 'dropdown';

/** Data no modo único; lista no múltiplo. `undefined` é "nada escolhido". */
export type CalendarValue = DateValue | DateValue[] | undefined;

/** Regra que bloqueia datas. Recebe cada dia da grade e devolve se ele barra. */
export type CalendarDateMatcher = (date: DateValue) => boolean;

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * A semana começa no domingo, como no Vanilla.
 *
 * Não é o padrão do primitivo (segunda) nem o do locale: é o do sistema. Uma
 * grade que começa em dias diferentes conforme o idioma faria a mesma tela
 * mudar de forma na troca de idioma, e a coluna do fim de semana deixaria de
 * ser sempre a primeira e a última.
 */
const WEEK_STARTS_ON = 0;

/** Anos oferecidos para cada lado do ano em vista, no seletor da legenda. */
const EACH_SIDE_YEARS = 100;

// ─── NdsCalendarMonths ────────────────────────────────────────────────────────

/**
 * A raiz do primitivo, aplicada ao contêiner dos meses.
 *
 * Existe como diretiva PRÓPRIA, e não como `hostDirectives` do `NdsCalendar`,
 * por dois motivos que se somam:
 *
 * 1. `role="application"` e `aria-label` são atributos que o primitivo liga ao
 *    seu host. `role="application"` manda o leitor de tela repassar todas as
 *    teclas e sair do modo de leitura — nenhuma das outras quatro stacks o
 *    emite, e com ele a grade deixa de ser anunciada como tabela de datas. O
 *    `aria-label` repete a legenda que já está na tela, num elemento que, sem
 *    papel, nem pode carregá-lo (o axe reprova por `aria-prohibited-attr`).
 *    Anular os dois só é confiável a partir de uma diretiva que tenha o
 *    primitivo como host directive: aí o host binding DELA roda depois, e vence.
 *    Uma ligação escrita no template perderia — host binding de diretiva roda
 *    depois das ligações do template no mesmo elemento (armadilha 11).
 *
 * 2. `multiple`, `locale` e companhia precisam vir de expressões do `NdsCalendar`
 *    (`mode() === 'multiple'`). Exposto por `hostDirectives.inputs` aqui, cada um
 *    vira uma ligação normal no template da raiz.
 *
 * Todos os nomes da lista são inputs PRÓPRIOS do `RdxCalendarRootDirective` —
 * ele não tem host directives aninhadas, então não há input entrando de carona.
 */
@Directive({
  selector: 'div[ndsCalendarMonths]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxCalendarRootDirective,
      inputs: [
        'value',
        'placeholder',
        'multiple',
        'locale',
        'numberOfMonths',
        'weekStartsOn',
        'isDateDisabled',
        'preventDeselect',
      ],
      outputs: ['valueChange', 'placeholderChange'],
    },
  ],
  host: {
    class: 'nds-calendar-months',
    '[attr.role]': 'null',
    '[attr.aria-label]': 'null',
  },
})
export class NdsCalendarMonths implements OnInit {
  /** A raiz do primitivo, para quem precisa do formatador ou da paginação. */
  readonly raiz = inject(RdxCalendarRootDirective, { self: true });

  constructor() {
    // Troca de idioma em vida: a grade é recriada, cada célula recebe um
    // `day` novo e o `aria-label` é recalculado — mas só se o formatador já
    // estiver no idioma certo quando isso acontecer.
    effect(() => {
      this.raiz.locale();
      this.sincronizarLocale();
    });
  }

  ngOnInit(): void {
    this.sincronizarLocale();
  }

  /**
   * O formatador do primitivo nasce com o locale ERRADO.
   *
   * Ele é criado no construtor da raiz, com `createFormatter(locale())` — e no
   * construtor um `input()` ainda devolve o default, que é "en" (armadilha 9).
   * O rótulo de cada dia sai desse formatador, então um calendário em português
   * anunciaria "Sunday, April 12, 2026" para quem usa leitor de tela.
   *
   * A correção precisa acontecer ANTES da primeira leitura de `labelText()`,
   * que é um `computed` e guarda o resultado: um `effect`, que roda depois da
   * primeira renderização, chegaria tarde e o rótulo ficaria em inglês para
   * sempre. Daí o `ngOnInit` — os inputs já chegaram e as células ainda não
   * foram criadas.
   */
  private sincronizarLocale(): void {
    const locale = this.raiz.locale();
    if (this.raiz.formatter.getLocale() !== locale) this.raiz.formatter.setLocale(locale);
  }
}

// ─── NdsCalendarDay ───────────────────────────────────────────────────────────

/**
 * O botão de um dia da grade.
 *
 * Existe só para corrigir a TABULAÇÃO. O primitivo liga
 * `tabindex = isFocusedDate ? 0 : isOutsideView || isDisabled ? undefined : -1`
 * — e `undefined` não é "fora da ordem": é atributo ausente, e um `<button>` sem
 * `tabindex` É tabulável. O resultado medido era o avesso da intenção: o dia
 * corrente entrava na ordem (certo), os dias comuns saíam (certo) e os
 * BLOQUEADOS e os de fora do mês entravam junto — quinze paradas de tabulação
 * numa grade que deve ter uma.
 *
 * Diretiva PRÓPRIA com o primitivo como host directive, e não uma ligação no
 * template: host binding de diretiva roda DEPOIS das ligações do template no
 * mesmo elemento (armadilha 11), então escrever `[attr.tabindex]` no `<button>`
 * perderia para o primitivo em silêncio.
 */
@Directive({
  selector: 'button[ndsCalendarDay]',
  standalone: true,
  hostDirectives: [{ directive: RdxCalendarCellTriggerDirective, inputs: ['day', 'month'] }],
  host: {
    '[attr.tabindex]': 'gatilho.isFocusedDate() ? 0 : -1',
  },
})
export class NdsCalendarDay {
  protected readonly gatilho = inject(RdxCalendarCellTriggerDirective, { self: true });
}

// ─── NdsCalendar ──────────────────────────────────────────────────────────────

/**
 * Seletor visual de datas.
 *
 * Seletor de ATRIBUTO num `<div>` nativo: o host é o próprio
 * `.nds-calendar-root`, então o markup fica idêntico ao do Vanilla e o CSS
 * compartilhado casa sem wrapper nenhum.
 */
@Component({
  selector: 'div[ndsCalendar]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O componente não declara `styles` próprios — o visual inteiro vem de
  // @shared/styles/nds/calendar.css, que é global.
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsCalendarMonths,
    RdxCalendarGridDirective,
    RdxCalendarGridHeadDirective,
    RdxCalendarGridBodyDirective,
    RdxCalendarGridRowDirective,
    RdxCalendarHeadCellDirective,
    RdxCalendarCellDirective,
    NdsCalendarDay,
    RdxCalendarPrevDirective,
    RdxCalendarNextDirective,
  ],
  host: {
    class: 'nds-calendar-root',
    '[attr.data-slot]': '"calendar"',
  },
  template: `
    <div
      ndsCalendarMonths
      [value]="value()"
      (valueChange)="value.set($event)"
      [placeholder]="vista()"
      (placeholderChange)="aoMudarVista($event)"
      [multiple]="ehMultiplo()"
      [locale]="locale()"
      [numberOfMonths]="numberOfMonths()"
      [weekStartsOn]="semanaComecaEm"
      [isDateDisabled]="disabled()"
      (keydown)="onGridKeyDown($event)"
    >
      <!-- A faixa de navegação é IRMÃ dos meses e fica por cima deles; cada mês
           traz a própria legenda no meio. Mesmo arranjo das outras stacks. -->
      <div class="nds-calendar-nav-overlay">
        <button
          type="button"
          rdxCalendarPrev
          class="nds-calendar-nav-btn"
          [attr.aria-label]="rotulos().mesAnterior"
        >
          <svg
            class="nds-calendar-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          rdxCalendarNext
          class="nds-calendar-nav-btn"
          [attr.aria-label]="rotulos().proximoMes"
        >
          <svg
            class="nds-calendar-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      @for (month of meses(); track month.value.toString()) {
        <div class="nds-calendar-month">
          <div class="nds-calendar-caption">
            @if (captionLayout() === 'dropdown') {
              <div class="nds-calendar-caption-dropdown">
                <select
                  class="nds-calendar-select"
                  [attr.aria-label]="rotulos().selecionarMes"
                  (change)="aoTrocarMes($event)"
                >
                  @for (nome of nomesDosMeses(); track $index) {
                    <option [value]="$index" [selected]="$index === mesEmVista()">{{ nome }}</option>
                  }
                </select>

                <select
                  class="nds-calendar-select"
                  [attr.aria-label]="rotulos().selecionarAno"
                  (change)="aoTrocarAno($event)"
                >
                  @for (year of anosOferecidos(); track year) {
                    <option [value]="year" [selected]="year === vistaYear()">{{ year }}</option>
                  }
                </select>
              </div>
            } @else {
              {{ legendaDoMes(month) }}
            }
          </div>

          <table rdxCalendarGrid class="nds-calendar-table" [attr.aria-label]="legendaDoMes(month)">
            <!-- A linha dos dias da semana fica fora da árvore de acessibilidade
                 (o primitivo põe aria-hidden no thead): cada dia já anuncia a
                 data por extenso, e repetir a coluna a cada célula só
                 encompridaria a leitura. -->
            <thead rdxCalendarGridHead>
              <tr rdxCalendarGridRow class="nds-calendar-weekdays">
                @for (dia of weekDays(); track $index) {
                  <th rdxCalendarHeadCell scope="col" class="nds-calendar-weekday">{{ dia }}</th>
                }
              </tr>
            </thead>

            <tbody rdxCalendarGridBody>
              @for (semana of month.weeks; track semana[0].toString()) {
                <tr rdxCalendarGridRow class="nds-calendar-week">
                  @for (dia of semana; track dia.toString()) {
                    <td rdxCalendarCell [date]="dia" class="nds-calendar-day-cell">
                      <!-- Sem a opção de dias vizinhos a casa fica VAZIA, e não com um
                           dia escondido: é o que o Vanilla faz, e é o que a
                           opção promete. A célula continua sendo gridcell para
                           a linha não perder colunas. -->
                      @if (mostraODia(dia, month)) {
                        <button
                          type="button"
                          ndsCalendarDay
                          [day]="dia"
                          [month]="month.value"
                          class="nds-calendar-day-btn"
                          [attr.data-autofocus]="ehAlvoDeFocoInicial(dia) ? '' : null"
                        >{{ dia.day }}</button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class NdsCalendar implements OnInit {
  /** Uma data (padrão) ou várias datas avulsas. */
  readonly mode = input<CalendarMode>('single');

  /**
   * Data escolhida — `DateValue` no modo único, `DateValue[]` no múltiplo.
   * É um `model`, então `[(value)]` funciona.
   */
  readonly value = model<CalendarValue>(undefined);

  /**
   * Mês exibido ao montar.
   *
   * Sem ele a visão abre no mês da data escolhida, ou no mês corrente. Existe
   * porque um calendário sem data escolhida mudaria de mês todo dia — e uma
   * story assim quebra sozinha na virada do mês.
   */
  readonly defaultMonth = input<DateValue | undefined>(undefined);

  /** Tag BCP 47 (ex: "pt-BR", "en-US", "es-ES"). */
  readonly locale = input<string>('en-US');

  /** Regra que bloqueia datas. Cada dia da grade passa por ela. */
  readonly disabled = input<CalendarDateMatcher | undefined>(undefined);

  /**
   * Completa a primeira e a última semana com os dias dos meses vizinhos, em
   * vez de deixar buracos.
   */
  readonly showOutsideDays = input(true, { transform: booleanAttribute });

  /** Legenda em texto (padrão) ou com seletores de mês e ano. */
  readonly captionLayout = input<CalendarCaptionLayout>('label');

  /** Quantos meses exibir lado a lado. */
  readonly numberOfMonths = input(1, { transform: numberAttribute });

  /**
   * Leva o foco para o dia em vista assim que o calendário aparece.
   *
   * Serve ao Calendar dentro de um Popover: sem isso, quem abre por teclado
   * precisa tabular até a grade. O input de mesmo nome do primitivo é declarado
   * e nunca lido — este aqui é implementado de verdade.
   */
  readonly initialFocus = input(false, { transform: booleanAttribute });

  protected readonly semanaComecaEm = WEEK_STARTS_ON;

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Necessário para agendar `afterNextRender` fora do contexto de injeção. */
  private readonly injetor = inject(Injector);

  /**
   * O mês em vista.
   *
   * É o `placeholder` do primitivo visto do lado de cá: a navegação por mês, os
   * seletores da legenda e o teclado escrevem aqui, e a grade nasce daqui.
   */
  protected readonly vista = signal<DateValue>(today(getLocalTimeZone()));

  protected readonly ehMultiplo = computed(() => this.mode() === 'multiple');

  protected readonly rotulos = computed(() => calendarLabels(this.locale()));

  /**
   * A grade, montada aqui e não lida do primitivo.
   *
   * `createMonths` é a MESMA função que a raiz usa por dentro, então as duas
   * enxergam a mesma grade. Ler a dela exigiria uma consulta de view ao
   * elemento que contém justamente o laço que a consome — o laço nasceria vazio
   * na primeira passada.
   */
  protected readonly meses = computed<Month<DateValue>[]>(() =>
    createMonths({
      dateObj: this.vista(),
      weekStartsOn: WEEK_STARTS_ON,
      locale: this.locale(),
      fixedWeeks: false,
      numberOfMonths: this.numberOfMonths(),
    }),
  );

  /**
   * Abreviação de dois a três caracteres, sem o ponto.
   *
   * 'narrow' daria "D S T Q Q S S", com duas quartas e duas quintas
   * indistinguíveis; e em pt-BR o formato curto sai "dom.", e o ponto numa
   * coluna de uma palavra só vira ruído. Mesma conta do Vanilla, para as cinco
   * stacks mostrarem a mesma abreviação.
   */
  protected readonly weekDays = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    // 2020-01-05 é um domingo — âncora para varrer a semana inteira.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2020, 0, 5 + i)).replace(/\.$/, ''),
    );
  });

  protected readonly nomesDosMeses = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { month: 'long' });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2020, m, 1)));
  });

  /** Índice 0-based, que é o que o `<option>` do seletor de mês carrega. */
  protected readonly mesEmVista = computed(() => this.vista().month - 1);

  protected readonly vistaYear = computed(() => this.vista().year);

  /**
   * Lista completa, e não uma janela em torno do ano em vista.
   *
   * O painel de um `<select>` é desenhado pelo navegador e não entrega evento
   * de rolagem ao JS, então não há onde pendurar um "carregar mais ao chegar na
   * ponta" — e a janela obrigava a escolher o último ano e reabrir para andar
   * mais. Quem limita o que aparece é a altura do painel (onze itens, no CSS).
   */
  protected readonly anosOferecidos = computed(() => {
    const center = this.vistaYear();
    return Array.from(
      { length: EACH_SIDE_YEARS * 2 + 1 },
      (_, i) => center - EACH_SIDE_YEARS + i,
    );
  });

  constructor() {
    afterNextRender(() => {
      if (!this.initialFocus()) return;
      this.focarDia(this.vista().toString());

      // Nada de segunda tentativa por tempo: dentro de um overlay o painel ainda
      // está `visibility: hidden` esperando o floating-ui medir, e `focus()` em
      // elemento invisível é no-op. Correr atrás disso com temporizador é
      // disputa que não se ganha — quem sabe o instante certo é o overlay.
      //
      // Por isso o dia em vista também se marca com `data-autofocus` (ver
      // `ehAlvoDeFocoInicial` no template): é o contrato que o Popover lê quando
      // o painel enfim aparece. Standalone, a chamada acima já resolve.
    });
  }

  /**
   * O dia que o overlay deve focar ao abrir.
   *
   * Só o dia em vista, e só quando `initialFocus` está ligado — o atributo é um
   * pedido, não uma marca permanente, e mais de um alvo tornaria a escolha
   * arbitrária.
   */
  protected ehAlvoDeFocoInicial(dia: DateValue): boolean {
    return this.initialFocus() && dia.compare(this.vista()) === 0;
  }

  /**
   * A visão de partida sai do input, da data escolhida ou do relógio — nessa
   * ordem. Em `ngOnInit` e não no construtor: lá um `input()` ainda devolve o
   * default (armadilha 9), e o mês pedido seria ignorado em silêncio.
   */
  ngOnInit(): void {
    const inicial = this.defaultMonth() ?? firstData(this.value());
    if (inicial) this.vista.set(inicial);
  }

  protected legendaDoMes(month: Month<DateValue>): string {
    return `${this.nomesDosMeses()[month.value.month - 1]} ${month.value.year}`;
  }

  protected mostraODia(dia: DateValue, month: Month<DateValue>): boolean {
    return this.showOutsideDays() || dia.month === month.value.month;
  }

  /**
   * A visão que o primitivo moveu (botões de mês, escolha de um dia vizinho).
   *
   * A guarda de igualdade fecha o vaivém: sem ela, cada emissão devolveria uma
   * instância nova de `DateValue` e a ligação `[placeholder]` a reenviaria.
   */
  protected aoMudarVista(nova: DateValue): void {
    if (this.vista().compare(nova) === 0) return;
    this.vista.set(nova);
  }

  protected aoTrocarMes(evento: Event): void {
    const month = Number((evento.target as HTMLSelectElement).value);
    this.vista.set(this.vista().set({ month: month + 1 }));
  }

  protected aoTrocarAno(evento: Event): void {
    const year = Number((evento.target as HTMLSelectElement).value);
    this.vista.set(this.vista().set({ year: year }));
  }

  /**
   * O resto do teclado da grade.
   *
   * O primitivo trata seta, Enter e Espaço e interrompe a propagação DESSAS
   * teclas; as outras chegam aqui. PageUp/PageDown mudam de mês (com Shift, de
   * ano) e Home/End vão às pontas da semana — sem eles, atravessar uma semana
   * custa seis setas e atravessar um ano, doze cliques.
   *
   * A data de partida vem do `data-value` do elemento em foco, e não da visão:
   * a navegação por setas do primitivo move o foco sem mexer no placeholder,
   * então a visão está uma ou mais casas atrás do que a pessoa vê em foco.
   */
  protected onGridKeyDown(evento: KeyboardEvent): void {
    const destination = teclaTarget(isoDoElemento(evento.target as Element | null), evento);
    if (!destination) return;

    evento.preventDefault();
    // A visão acompanha o foco: um dia que sai do mês em vista precisa aparecer,
    // senão o foco iria para uma célula que não está na tela.
    this.vista.set(parseDate(destination));
    this.focarDia(destination);
  }

  /**
   * Foca o botão de uma data DEPOIS que a grade tiver sido redesenhada.
   *
   * `afterNextRender` e não uma chamada direta: `vista.set()` agenda a detecção
   * de mudanças, e num app zoneless ela roda depois do handler. Focando na hora,
   * o alvo encontrado era o botão da grade ANTIGA — ele recebia o foco e em
   * seguida deixava de existir, jogando o foco no `body`. Era o que acontecia
   * com Home, End, PageUp e PageDown: a legenda até virava, e o foco sumia.
   *
   * O `injector` é obrigatório porque isto roda fora do contexto de injeção.
   */
  private focarDia(iso: string): void {
    afterNextRender(
      () => gridDay(this.elemento.nativeElement, iso)?.focus(),
      { injector: this.injetor },
    );
  }
}

/** A data que ancora o mês exibido, seja qual for o modo. */
function firstData(valor: CalendarValue): DateValue | undefined {
  if (!valor) return undefined;
  return Array.isArray(valor) ? valor[0] : valor;
}
