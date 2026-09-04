import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsActivityGraph, type ActivityGraphLabels } from '@/components/ui/activity-graph';
import {
  WIDE_END,
  WIDE_START,
  activityGraphLabels,
} from '@/components/ui/activity-graph.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import type { ActivityDay } from '@shared/primitives/chat-protocol';
import { resolveActivityCalendar } from '@shared/primitives/activity-calendar';
import {
  ACTIVITY_DAYS,
  ACTIVITY_DAYS_EMPTY,
  ACTIVITY_END,
  ACTIVITY_MONTH_END,
  ACTIVITY_MONTH_START,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from '@shared/primitives/activity-graph-examples';
import uiTranslations from '@/i18n/ui.json';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// NENHUM OVERRIDE, e vale registrar por quê.
//
// As sete entradas se chamam `days`, `start`, `end`, `thresholds`,
// `weekStart`, `status` e `labels` aqui, exatamente como no conteúdo
// compartilhado, e todas têm o mesmo tipo. A única divergência desta stack é
// de RENDERIZAÇÃO, não de assinatura — quem escreve o `<div
// ndsActivityGraph>` é quem consome, e nenhum componente do Angular pode
// recusar o próprio host —, e divergência de renderização não tem linha na
// tabela de propriedades: ela está escrita no docblock da peça e na nota de
// arquitetura desta página.
const { t, dict } = useTranslation(activityGraphTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'estados',      labelKey: 'nav.states'   },
    { id: 'propriedades', labelKey: 'nav.props'    },
    { id: 'tokens',       labelKey: 'nav.tokens'   },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

const INTERFACE_CODE = `// As sete entradas da peça, no <div ndsActivityGraph>
export class NdsActivityGraph {
  readonly days = input.required<readonly ActivityDay[]>();
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  readonly thresholds = input.required<readonly number[]>();
  readonly weekStart = input<number>(0);
  readonly status = input<RunStatus>('idle');
  readonly labels = input.required<ActivityGraphLabels>();

  // Não há saída nenhuma: a peça é de leitura, não oferece ação e não avança
  // sozinha. Pedir outro período é remontar com outra janela.
}

export interface ActivityGraphLabels {
  region: string;                     // o nome da camada que rola — obrigatório
  total: string;                      // molde com \`{count}\`, \`{start}\` e \`{end}\`
  dateFormat: string;                 // molde com \`{day}\`, \`{month}\` e \`{year}\`
  monthsShort: readonly string[];     // 12, para os rótulos de coluna
  monthsLong: readonly string[];      // 12, para a frase de cada casa
  weekdaysShort: readonly string[];   // 7, começando no domingo
  none: string;                       // a frase do dia sem atividade
  one: string;                        // molde com \`{count}\`, \`{date}\` e \`{level}\`
  many: string;
  levels: readonly string[];          // uma palavra a mais que os degraus
  legendLess: string;
  legendMore: string;
}

// O dia vem de \`@shared/primitives/chat-protocol\`, e é o único tipo daquele
// arquivo desta família que NÃO carrega geometria: a casa em que ele cai não
// é declarada, ela se DEDUZ da data e da janela.
interface ActivityDay {
  date: string;   // ano-mês-dia, um dia civil sem hora e sem fuso
  count: number;  // dias repetidos SOMAM
}

// A JANELA E A ESCALA SÃO DADO, e são o que separa esta peça de um mapa de
// calor de janela fixa: nada aqui olha o relógio, e a escala não se deriva
// do maior valor — derivada, a mesma contagem pintaria diferente em duas
// grades.

type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;

/** Uma casa já pronta para o template dos contraexemplos. */
interface DocsDayView {
  key: string;
  date: string;
  level: string;
  column: string;
  row: string;
  reading: string;
}

/** Um rótulo de mês já pronto para o template dos contraexemplos. */
interface DocsMonthView {
  key: string;
  label: string;
  column: string;
  span: string;
}

/** Um rótulo de dia da semana já pronto para o template dos contraexemplos. */
interface DocsWeekdayView {
  key: string;
  label: string;
  row: string;
}

/** Uma amostra da legenda já pronta para o template dos contraexemplos. */
interface DocsSwatchView {
  key: string;
  level: string;
  word: string;
}

/** A grade pronta para o template dos contraexemplos, ou nada. */
interface DocsCalendarView {
  weeks: string;
  total: string;
  months: readonly DocsMonthView[];
  weekdays: readonly DocsWeekdayView[];
  days: readonly DocsDayView[];
  swatches: readonly DocsSwatchView[];
}

/** Os lugares marcados dos moldes de texto, para a montagem à mão dos contraexemplos. */
const COUNT_PLACEHOLDER = '{count}';
const DATE_PLACEHOLDER = '{date}';
const LEVEL_PLACEHOLDER = '{level}';
const START_PLACEHOLDER = '{start}';
const END_PLACEHOLDER = '{end}';
const DAY_PLACEHOLDER = '{day}';
const MONTH_PLACEHOLDER = '{month}';
const YEAR_PLACEHOLDER = '{year}';

function formatDate(
  cell: { day: number; month: number; year: number },
  labels: ActivityGraphLabels,
): string {
  return labels.dateFormat
    .replace(DAY_PLACEHOLDER, String(cell.day))
    .replace(MONTH_PLACEHOLDER, labels.monthsLong[cell.month] ?? '')
    .replace(YEAR_PLACEHOLDER, String(cell.year));
}

function readingOf(
  cell: { day: number; month: number; year: number; count: number; level: number },
  labels: ActivityGraphLabels,
): string {
  const date = formatDate(cell, labels);
  if (cell.count === 0) return labels.none.replace(DATE_PLACEHOLDER, date);
  const template = cell.count === 1 ? labels.one : labels.many;
  return template
    .replace(COUNT_PLACEHOLDER, String(cell.count))
    .replace(DATE_PLACEHOLDER, date)
    .replace(LEVEL_PLACEHOLDER, labels.levels[cell.level] ?? '');
}

/**
 * A grade desenhada à mão, para os dois contraexemplos.
 *
 * MORA AQUI porque os contraexemplos são montados À MÃO — a peça sempre
 * escreve a leitura de cada casa e sempre dá papel e nome à camada que rola,
 * então não há entrada que produza o erro que o par mostra. A conta continua
 * sendo a do primitivo compartilhado: o que esta função faz é só o arranjo
 * para o template.
 */
function drawCalendar(
  days: readonly ActivityDay[],
  start: string,
  end: string,
  thresholds: readonly number[],
  labels: ActivityGraphLabels,
): DocsCalendarView | null {
  const drawing = resolveActivityCalendar(days, { start, end, thresholds });
  if (!drawing) return null;

  return {
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
}

@Component({
  selector: 'nds-activity-graph-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsActivityGraph, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o da leitura: cada casa diz em palavras a data, a
         contagem e a palavra do nível, e é isso que faz a grade se
         reconstruir de ouvido. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsActivityGraph
          [days]="monthDays"
          [start]="monthStart"
          [end]="monthEnd"
          [thresholds]="thresholds"
          status="complete"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo é escrito À MÃO, e tem de ser: a peça sempre
           escreve a leitura de cada casa, então não há entrada que produza o
           erro. Aqui a frase não existe, e sobra a tinta — que é exatamente
           o que não chega a quem lê de ouvido. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        @if (monthCalendar(); as drawn) {
          <div class="nds-activity-graph">
            <p class="nds-activity-graph-total">{{ drawn.total }}</p>
            <div class="nds-activity-graph-viewport" tabindex="0" role="group" [attr.aria-label]="regionName()">
              <div class="nds-activity-graph-calendar" [style.--activity-graph-weeks]="drawn.weeks">
                <ol class="nds-activity-graph-months" aria-hidden="true">
                  @for (month of drawn.months; track month.key) {
                    <li
                      class="nds-activity-graph-month"
                      [style.--activity-graph-month-column]="month.column"
                      [style.--activity-graph-month-span]="month.span"
                    >{{ month.label }}</li>
                  }
                </ol>
                <ol class="nds-activity-graph-weekdays" aria-hidden="true">
                  @for (weekday of drawn.weekdays; track weekday.key) {
                    <li
                      class="nds-activity-graph-weekday"
                      [style.--activity-graph-weekday-row]="weekday.row"
                    >{{ weekday.label }}</li>
                  }
                </ol>
                <ol class="nds-activity-graph-days">
                  @for (day of drawn.days; track day.key) {
                    <li
                      class="nds-activity-graph-day"
                      [attr.data-level]="day.level"
                      [style.--activity-graph-day-column]="day.column"
                      [style.--activity-graph-day-row]="day.row"
                      [style.--activity-graph-day-level]="day.level"
                    ></li>
                  }
                </ol>
              </div>
            </div>
          </div>
        }
      </div>
    </ng-template>

    <!-- O segundo par é o da camada que rola: papel, nome e parada de
         teclado andam juntos, e sem o papel o nome é descartado pelo
         navegador. -->
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-max-w-md">
          <div
            ndsActivityGraph
            [days]="wideDays"
            [start]="wideStart"
            [end]="wideEnd"
            [thresholds]="thresholds"
            status="complete"
            [labels]="labels()"
          ></div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- A camada que rola sem papel e sem nome: quem chega ali por teclado
           para numa parada anônima. É o defeito que duas peças desta casa já
           tiveram, e o motivo pelo qual o papel e o nome andam na mesma
           linha. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-max-w-md">
          @if (wideCalendar(); as drawn) {
            <div class="nds-activity-graph">
              <p class="nds-activity-graph-total">{{ drawn.total }}</p>
              <div class="nds-activity-graph-viewport" tabindex="0">
                <div class="nds-activity-graph-calendar" [style.--activity-graph-weeks]="drawn.weeks">
                  <ol class="nds-activity-graph-months" aria-hidden="true">
                    @for (month of drawn.months; track month.key) {
                      <li
                        class="nds-activity-graph-month"
                        [style.--activity-graph-month-column]="month.column"
                        [style.--activity-graph-month-span]="month.span"
                      >{{ month.label }}</li>
                    }
                  </ol>
                  <ol class="nds-activity-graph-weekdays" aria-hidden="true">
                    @for (weekday of drawn.weekdays; track weekday.key) {
                      <li
                        class="nds-activity-graph-weekday"
                        [style.--activity-graph-weekday-row]="weekday.row"
                      >{{ weekday.label }}</li>
                    }
                  </ol>
                  <ol class="nds-activity-graph-days">
                    @for (day of drawn.days; track day.key) {
                      <li
                        class="nds-activity-graph-day"
                        [attr.data-level]="day.level"
                        [style.--activity-graph-day-column]="day.column"
                        [style.--activity-graph-day-row]="day.row"
                        [style.--activity-graph-day-level]="day.level"
                      >
                        <span class="nds-sr-only">{{ day.reading }}</span>
                      </li>
                    }
                  </ol>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="activity-graph"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration
          [title]="t('demonstration.title')"
          componentSlug="activity-graph"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL caso está desenhado — sem ela, quatro
                 grades empilhadas viram uma só, e o assunto da demonstração
                 é justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura
                 para quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.quarter') }}</p>
              <div
                ndsActivityGraph
                [days]="quarterDays"
                [start]="quarterStart"
                [end]="quarterEnd"
                [thresholds]="thresholds"
                status="complete"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.empty') }}</p>
              <div
                ndsActivityGraph
                [days]="emptyDays"
                [start]="quarterStart"
                [end]="quarterEnd"
                [thresholds]="thresholds"
                status="complete"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.month') }}</p>
              <div
                ndsActivityGraph
                [days]="monthDays"
                [start]="monthStart"
                [end]="monthEnd"
                [thresholds]="thresholds"
                status="complete"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.wide') }}</p>
              <div class="nds-max-w-md">
                <div
                  ndsActivityGraph
                  [days]="wideDays"
                  [start]="wideStart"
                  [end]="wideEnd"
                  [thresholds]="thresholds"
                  status="complete"
                  [labels]="labels()"
                ></div>
              </div>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="t('import.basicCode')"
          [secondaryDescription]="t('import.withLabels')"
          [secondaryCode]="t('import.withLabelsCode')"
          componentSlug="activity-graph"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
          [extensibilityCode]="t('props.extensibilityCode')"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
          language="css"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="activity-graph"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="activity-graph"
        />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsActivityGraphDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /**
   * Os dados das fotos.
   *
   * Dado, e por isso os mesmos nos três idiomas: a força de cada casa não é
   * idioma, e contagens diferentes por foto mostrariam mapas diferentes sem
   * que ninguém conseguisse atribuir a divergência a nada.
   */
  protected readonly quarterDays = ACTIVITY_DAYS;
  protected readonly emptyDays = ACTIVITY_DAYS_EMPTY;
  protected readonly monthDays = ACTIVITY_DAYS;
  protected readonly wideDays = ACTIVITY_DAYS;
  protected readonly thresholds = ACTIVITY_THRESHOLDS;

  /**
   * As quatro janelas, como MEMBRO DE CLASSE.
   *
   * Nunca por interpolação de string dentro do `template` do `@Component`: o
   * compilador do Angular consegue dobrar a constante importada em tempo de
   * compilação, mas o extrator de template do ESLint não — ele lê o texto
   * entre crases ao pé da letra, encontra `${ACTIVITY_START}` como cadeia
   * literal e reprova ao tentar interpretar isso como HTML.
   */
  protected readonly quarterStart = ACTIVITY_START;
  protected readonly quarterEnd = ACTIVITY_END;
  protected readonly monthStart = ACTIVITY_MONTH_START;
  protected readonly monthEnd = ACTIVITY_MONTH_END;
  protected readonly wideStart = WIDE_START;
  protected readonly wideEnd = WIDE_END;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ActivityGraphLabels>(() => {
    dict();
    return activityGraphLabels();
  });

  /** O nome da camada que rola, para o contraexemplo escrito à mão. */
  protected readonly regionName = computed(() => this.labels().region);

  /** As duas grades dos contraexemplos, montadas à mão. */
  protected readonly monthCalendar = computed(() =>
    drawCalendar(this.monthDays, this.monthStart, this.monthEnd, this.thresholds, this.labels()),
  );
  protected readonly wideCalendar = computed(() =>
    drawCalendar(this.wideDays, this.wideStart, this.wideEnd, this.thresholds, this.labels()),
  );

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        s: t(`usage.scenarios.item${i}.s`),
        u: t(`usage.scenarios.item${i}.u`),
        a: toPlainText(t(`usage.scenarios.item${i}.a`)),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['region', 'total', 'day', 'level'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['empty', 'low', 'high', 'busy'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const rowsOf = (keys: string[]) =>
      keys.map((k) => ({
        name: t(`props.table.${k}.name`),
        type: t(`props.table.${k}.type`),
        defaultValue: t(`props.table.${k}.default`),
        required: t(`props.table.${k}.required`),
        description: toPlainText(t(`props.table.${k}.description`)),
      }));
    return [
      {
        title: 'NdsActivityGraph',
        cols,
        items: rowsOf(['days', 'start', 'end', 'thresholds', 'weekStart', 'status', 'labels']),
      },
      {
        title: 'ActivityGraphLabels',
        cols,
        items: rowsOf([
          'labelsRegion', 'labelsTotal', 'labelsDateFormat',
          'labelsMonthsShort', 'labelsMonthsLong', 'labelsWeekdaysShort',
          'labelsNone', 'labelsOne', 'labelsMany',
          'labelsLevels', 'labelsLegendLess', 'labelsLegendMore',
        ]),
      },
      {
        title: 'ActivityDay',
        cols,
        items: rowsOf(['dayDate', 'dayCount']),
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.value'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      'textLabel', 'spacing3', 'spacing05', 'spacing2', 'mutedForeground',
      'lineHeightNormal', 'spacing3Viewport', 'border', 'radius', 'muted',
      'ring', 'spacing1', 'radiusXs', 'background', 'primary',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: '← →',   description: toPlainText(t('accessibility.keyboard.arrows')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'chart',          path: '?path=/docs/components-display-chart--docs'                 },
      { key: 'calendar',       path: '?path=/docs/components-form-calendar--docs'                  },
      { key: 'traceWaterfall', path: '?path=/docs/components-conversational-tracewaterfall--docs'  },
      { key: 'jobProgress',    path: '?path=/docs/components-conversational-jobprogress--docs'     },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['pageView', 'sectionViewed', 'demoClick'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: t(`analytics.table.${k}Payload`),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
        action: toPlainText(t(`testes.functional.item${i}.action`)),
        result: toPlainText(t(`testes.functional.item${i}.result`)),
        priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // A lista é PLANA: cada item é um critério, e o "como verificar" é o
    // próprio addon-a11y rodando em toda story.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: {
        criterion: tNav('common.criterion'),
        level: 'WCAG',
        how: tNav('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: {
        story: tNav('common.storyState'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        story: toPlainText(t(`testes.visual.item${i}.story`)),
        priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
      })),
    };
  });

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'activity-graph',
      });
      track('docs_page_view', {
        component_name: 'activity-graph',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'activity-graph',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}
