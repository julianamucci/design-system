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
import { NdsTraceWaterfall, type TraceWaterfallLabels } from '@/components/ui/trace-waterfall';
import {
  WIDE_TOTAL_MS,
  traceWaterfallLabels,
  wideTraceSpans,
} from '@/components/ui/trace-waterfall.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import {
  TOOL_CALL_STATES,
  type ToolCallState,
  type TraceSpan,
} from '@shared/primitives/chat-protocol';
import { resolveTraceWaterfall } from '@shared/primitives/trace-waterfall-axis';
import {
  TRACE_SPANS_FAILURE,
  TRACE_SPANS_ORDER,
  TRACE_SPANS_PARTIAL,
  TRACE_TOTAL_MS,
} from '@shared/primitives/trace-waterfall-examples';
import uiTranslations from '@/i18n/ui.json';
import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';

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
// As quatro entradas se chamam `spans`, `totalMs`, `status` e `labels` aqui,
// exatamente como no conteúdo compartilhado, e as quatro têm o mesmo tipo. A
// única divergência desta stack é de RENDERIZAÇÃO, não de assinatura — quem
// escreve o `<div ndsTraceWaterfall>` é quem consome, e nenhum componente do
// Angular pode recusar o próprio host —, e divergência de renderização não
// tem linha na tabela de propriedades: ela está escrita no docblock da peça e
// na nota de arquitetura desta página.
const { t, dict } = useTranslation(traceWaterfallTranslations as Record<string, unknown>);

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

const INTERFACE_CODE = `// As quatro entradas da peça, no <div ndsTraceWaterfall>
export class NdsTraceWaterfall {
  readonly spans = input.required<readonly TraceSpan[]>();
  readonly totalMs = input.required<number>();
  readonly status = input<RunStatus>('idle');
  readonly labels = input.required<TraceWaterfallLabels>();

  // Não há saída nenhuma: a peça é de leitura, não oferece ação e não avança
  // sozinha. Revelar aos poucos é passar menos trechos, com o mesmo eixo.
}

export interface TraceWaterfallLabels {
  region: string;    // o nome da camada que rola — obrigatório
  axis: string;      // molde visível da régua, com \`{total}\`
  duration: string;  // molde da duração visível, com \`{duration}\`
  reading: string;   // molde da leitura, com \`{start}\` e \`{duration}\`
  clipped: string;   // a frase do trecho que não coube no eixo
  state: Record<ToolCallState, string>;
}

// O trecho vem de \`@shared/primitives/chat-protocol\`. \`TraceSpan\` é o
// TERCEIRO tipo daquele arquivo que carrega geometria, e entra pelo mesmo
// critério dos dois primeiros: ser a origem única do que cinco stacks
// reescreveriam.
//
// O INTERVALO É PLANO, e não um tipo aninhado: os dois tipos de geometria que
// já moravam ali carregam as coordenadas soltas, e um tipo que embrulha dois
// campos para um consumidor só é indireção, não vocabulário.
interface TraceSpan {
  id: string;
  label: string;
  startMs: number;     // desde a origem do eixo
  durationMs: number;
  depth: number;       // recuo em degraus, relativo aos demais
  state: ToolCallState;
}

// O TOTAL NÃO MORA NO TRECHO: ele é propriedade do EIXO, e é ele que faz as
// barras dividirem uma régua só. Um total por trecho seriam N verdades sobre
// a mesma régua.

type ToolCallState = 'pending' | 'running' | 'done' | 'failed';
type RunStatus = 'idle' | 'running' | 'stopped' | 'complete' | 'failed';`;

/** Uma linha já pronta para o template dos contraexemplos. */
interface DocsRow {
  key: string;
  spanId: string;
  state: ToolCallState;
  label: string;
  /** Cadeia, e não número: valor numérico faria o Angular anexar "px". */
  indent: string;
  barStart: string;
  barSize: string;
  durationLabel: string;
  reading: string;
}

/** A cascata pronta para o template dos contraexemplos. */
interface DocsWaterfall {
  axisLabel: string;
  rows: readonly DocsRow[];
}

/**
 * A cascata desenhada à mão, para os dois contraexemplos.
 *
 * MORA AQUI porque os contraexemplos são montados À MÃO — a peça sempre
 * escreve a leitura de cada linha e sempre dá papel e nome à camada que rola,
 * então não há entrada que produza o erro que o par mostra. A conta continua
 * sendo a do primitivo compartilhado: o que esta função faz é só o arranjo
 * para o template.
 */
function drawWaterfall(
  spans: readonly TraceSpan[],
  totalMs: number,
  labels: TraceWaterfallLabels,
): DocsWaterfall | null {
  const drawing = resolveTraceWaterfall(spans, totalMs);
  if (!drawing) return null;

  return {
    axisLabel: labels.axis.replace('{total}', String(drawing.totalMs)),
    rows: drawing.rows.map((drawn, index) => {
      const parts = [
        labels.state[drawn.span.state],
        labels.reading
          .replace('{start}', String(drawn.span.startMs))
          .replace('{duration}', String(drawn.span.durationMs)),
      ];
      if (drawn.clipped) parts.push(labels.clipped);
      return {
        key: `${index}-${drawn.span.id}`,
        spanId: drawn.span.id,
        state: drawn.span.state,
        label: drawn.span.label,
        indent: String(drawn.indent),
        barStart: String(drawn.start),
        barSize: String(drawn.size),
        durationLabel: labels.duration.replace('{duration}', String(drawn.span.durationMs)),
        reading: parts.join(' '),
      };
    }),
  };
}

@Component({
  selector: 'nds-trace-waterfall-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsTraceWaterfall, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o da leitura: cada linha diz em palavras o estado,
         o começo e a duração, e é isso que faz a cascata se reconstruir de
         ouvido. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div
          ndsTraceWaterfall
          [spans]="orderSpans"
          [totalMs]="orderTotalMs"
          status="running"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo é escrito À MÃO, e tem de ser: a peça sempre
           escreve a leitura de cada linha, então não há entrada que produza o
           erro. Aqui a frase não existe, e sobra a barra — que é exatamente o
           que não chega a quem lê de ouvido. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        @if (orderWaterfall(); as drawn) {
          <div class="nds-trace-waterfall" aria-busy="true">
            <p class="nds-trace-waterfall-axis">{{ drawn.axisLabel }}</p>
            <div class="nds-trace-waterfall-viewport" tabindex="0" role="group" [attr.aria-label]="regionName()">
              <ol class="nds-trace-waterfall-rows">
                @for (row of drawn.rows; track row.key) {
                  <li
                    class="nds-trace-waterfall-row"
                    [attr.data-state]="row.state"
                    [style.--trace-waterfall-row-indent]="row.indent"
                  >
                    <span class="nds-trace-waterfall-name">
                      <span class="nds-trace-waterfall-marker" aria-hidden="true"></span>
                      <span class="nds-trace-waterfall-label">{{ row.label }}</span>
                    </span>
                    <span class="nds-trace-waterfall-track" aria-hidden="true">
                      <span
                        class="nds-trace-waterfall-bar"
                        [style.--trace-waterfall-bar-start]="row.barStart"
                        [style.--trace-waterfall-bar-size]="row.barSize"
                      ></span>
                    </span>
                    <span class="nds-trace-waterfall-duration">{{ row.durationLabel }}</span>
                  </li>
                }
              </ol>
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
            ndsTraceWaterfall
            [spans]="wideSpans"
            [totalMs]="wideTotalMs"
            status="running"
            [labels]="labels()"
          ></div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- A camada que rola sem papel e sem nome: quem chega ali por teclado
           para numa parada anônima. É o defeito que dois componentes desta
           casa já tiveram, e o motivo pelo qual o papel e o nome andam na
           mesma linha. -->
      <div class="nds-stack nds-w-full" data-spacing="lg">
        <div class="nds-max-w-md">
          @if (wideWaterfall(); as drawn) {
            <div class="nds-trace-waterfall" aria-busy="true">
              <p class="nds-trace-waterfall-axis">{{ drawn.axisLabel }}</p>
              <div class="nds-trace-waterfall-viewport" tabindex="0">
                <ol class="nds-trace-waterfall-rows">
                  @for (row of drawn.rows; track row.key) {
                    <li
                      class="nds-trace-waterfall-row"
                      [attr.data-state]="row.state"
                      [style.--trace-waterfall-row-indent]="row.indent"
                    >
                      <span class="nds-trace-waterfall-name">
                        <span class="nds-trace-waterfall-marker" aria-hidden="true"></span>
                        <span class="nds-trace-waterfall-label">{{ row.label }}</span>
                      </span>
                      <span class="nds-trace-waterfall-track" aria-hidden="true">
                        <span
                          class="nds-trace-waterfall-bar"
                          [style.--trace-waterfall-bar-start]="row.barStart"
                          [style.--trace-waterfall-bar-size]="row.barSize"
                        ></span>
                      </span>
                      <span class="nds-trace-waterfall-duration">{{ row.durationLabel }}</span>
                      <span class="nds-sr-only">{{ row.reading }}</span>
                    </li>
                  }
                </ol>
              </div>
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="trace-waterfall"
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
          componentSlug="trace-waterfall"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL caso está desenhado — sem ela, quatro
                 réguas empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura
                 para quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.order') }}</p>
              <div
                ndsTraceWaterfall
                [spans]="orderSpans"
                [totalMs]="orderTotalMs"
                status="running"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.failure') }}</p>
              <div
                ndsTraceWaterfall
                [spans]="failureSpans"
                [totalMs]="orderTotalMs"
                status="failed"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.partial') }}</p>
              <div
                ndsTraceWaterfall
                [spans]="partialSpans"
                [totalMs]="orderTotalMs"
                status="running"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.wide') }}</p>
              <div class="nds-max-w-md">
                <div
                  ndsTraceWaterfall
                  [spans]="wideSpans"
                  [totalMs]="wideTotalMs"
                  status="running"
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
          componentSlug="trace-waterfall"
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
          componentSlug="trace-waterfall"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="trace-waterfall"
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
export class NdsTraceWaterfallDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /**
   * Os rastros das fotos.
   *
   * Dado, e por isso os mesmos nos três idiomas: a posição das barras não é
   * idioma, e milissegundos diferentes por foto mostrariam cascatas
   * diferentes sem que ninguém conseguisse atribuir a divergência a nada.
   */
  protected readonly orderSpans = TRACE_SPANS_ORDER;
  protected readonly failureSpans = TRACE_SPANS_FAILURE;
  protected readonly partialSpans = TRACE_SPANS_PARTIAL;
  protected readonly wideSpans = wideTraceSpans();
  /**
   * Os dois eixos, como MEMBRO DE CLASSE.
   *
   * Nunca por interpolação de string dentro do `template` do `@Component`: o
   * compilador do Angular consegue dobrar a constante importada em tempo de
   * compilação, mas o extrator de template do ESLint não — ele lê o texto
   * entre crases ao pé da letra, encontra `${TRACE_TOTAL_MS}` como cadeia
   * literal e reprova ao tentar interpretar isso como HTML.
   */
  protected readonly orderTotalMs = TRACE_TOTAL_MS;
  protected readonly wideTotalMs = WIDE_TOTAL_MS;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<TraceWaterfallLabels>(() => {
    dict();
    return traceWaterfallLabels();
  });

  /** O nome da camada que rola, para o contraexemplo escrito à mão. */
  protected readonly regionName = computed(() => this.labels().region);

  /** As duas cascatas dos contraexemplos, montadas à mão. */
  protected readonly orderWaterfall = computed(() =>
    drawWaterfall(TRACE_SPANS_ORDER, TRACE_TOTAL_MS, this.labels()),
  );
  protected readonly wideWaterfall = computed(() =>
    drawWaterfall(this.wideSpans, WIDE_TOTAL_MS, this.labels()),
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
      items: ['region', 'label', 'axis', 'reading'].map((key) => ({
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
    // A ordem sai de `TOOL_CALL_STATES`: a tabela e a story de estados leem a
    // mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
    return TOOL_CALL_STATES.map((k) => ({
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
        title: 'NdsTraceWaterfall',
        cols,
        items: rowsOf(['spans', 'totalMs', 'status', 'labels']),
      },
      {
        title: 'TraceWaterfallLabels',
        cols,
        items: rowsOf([
          'labelsRegion', 'labelsAxis', 'labelsDuration',
          'labelsReading', 'labelsClipped', 'labelsState',
        ]),
      },
      {
        title: 'TraceSpan',
        cols,
        items: rowsOf([
          'spanId', 'spanLabel', 'spanStart',
          'spanDuration', 'spanDepth', 'spanState',
        ]),
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
      'textLabel', 'spacing24', 'spacing40', 'spacing2', 'lineHeightNormal',
      'spacing3', 'border', 'radius', 'muted', 'ring', 'spacing4',
      'radiusFull', 'mutedForeground', 'foreground', 'background',
      'primary', 'primaryForeground', 'spacing1', 'success', 'destructive',
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
      { key: 'flowGraph',     path: '?path=/docs/components-conversational-flowgraph--docs'     },
      { key: 'agentPlan',     path: '?path=/docs/components-conversational-agentplan--docs'     },
      { key: 'messageTiming', path: '?path=/docs/components-conversational-messagetiming--docs' },
      { key: 'progress',      path: '?path=/docs/components-feedback-progress--docs'            },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        componentSlug: 'trace-waterfall',
      });
      track('docs_page_view', {
        component_name: 'trace-waterfall',
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
          component_name: 'trace-waterfall',
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
