<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ActivityGraph } from '@/components/ui/activity-graph';
import {
  WIDE_END,
  WIDE_START,
  useActivityGraphLabels,
} from '@/components/ui/activity-graph/activity-graph.fixtures';
import {
  resolveActivityCalendar,
  type ActivityCalendarCell,
  type ActivityCalendarDrawing,
} from '@shared/primitives/activity-calendar';
import {
  ACTIVITY_DAYS,
  ACTIVITY_DAYS_EMPTY,
  ACTIVITY_END,
  ACTIVITY_MONTH_END,
  ACTIVITY_MONTH_START,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from '@shared/primitives/activity-graph-examples';
import { Separator } from '@/components/ui/separator';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
//
// O locale sai do `useTranslation`, nunca de store de estado: locale de Pinia
// já derrubou docs page em runtime neste repositório.
//
// NENHUMA LINHA SOBRESCRITA, e isso é o achado desta stack: o conteúdo
// compartilhado descreve `days`, `start`, `end`, `thresholds`, `weekStart`,
// `status` e `labels`, que são exatamente os nomes e os tipos que esta peça
// declara. A única divergência de API de framework — a classe extra por
// atributo de repasse — não tem linha na tabela, porque não é propriedade
// nenhuma.

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(activityGraphTranslations);

const activityLabels = useActivityGraphLabels();

// ─── As grades das fotos ──────────────────────────────────────────────────────

/**
 * A conta da grade, para os contraexemplos.
 *
 * Eles são montados À MÃO — a peça sempre escreve a leitura de cada casa e
 * sempre põe papel e nome na camada que rola, então não há propriedade que
 * produza o erro. O que muda no errado é o que se APAGA da marcação; o desenho
 * vem da mesma conta compartilhada, para que o par compare uma coisa só.
 *
 * O `!` é seguro por construção: as duas janelas têm dia e escala, e a conta só
 * devolve nada quando falta um dos dois.
 */
const monthDrawing: ActivityCalendarDrawing = resolveActivityCalendar(ACTIVITY_DAYS, {
  start: ACTIVITY_MONTH_START,
  end: ACTIVITY_MONTH_END,
  thresholds: ACTIVITY_THRESHOLDS,
})!;

const wideDrawing: ActivityCalendarDrawing = resolveActivityCalendar(ACTIVITY_DAYS, {
  start: WIDE_START,
  end: WIDE_END,
  thresholds: ACTIVITY_THRESHOLDS,
})!;

/** A data por extenso, montada a partir do molde do idioma. */
function formatDateOf(cell: ActivityCalendarCell): string {
  return activityLabels.value.dateFormat
    .replace('{day}', String(cell.day))
    .replace('{month}', activityLabels.value.monthsLong[cell.month] ?? '')
    .replace('{year}', String(cell.year));
}

/** A frase de uma casa: a contagem, o dia e a palavra do nível. */
function readingOf(cell: ActivityCalendarCell): string {
  const date = formatDateOf(cell);
  if (cell.count === 0) return activityLabels.value.none.replace('{date}', date);
  const template = cell.count === 1 ? activityLabels.value.one : activityLabels.value.many;
  return template
    .replace('{count}', String(cell.count))
    .replace('{date}', date)
    .replace('{level}', activityLabels.value.levels[cell.level] ?? '');
}

/** A frase do total, com o eixo declarado no lugar do molde. */
function totalTextOf(drawing: ActivityCalendarDrawing): string {
  return activityLabels.value.total
    .replace('{count}', String(drawing.total))
    .replace('{start}', formatDateOf(drawing.from))
    .replace('{end}', formatDateOf(drawing.to));
}

/** A casa da grade, em propriedade personalizada. */
function cellStyleOf(cell: ActivityCalendarCell) {
  return {
    '--activity-graph-day-column': String(cell.column),
    '--activity-graph-day-row': String(cell.row),
    '--activity-graph-day-level': String(cell.level),
  };
}

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (activityGraphTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'activity-graph',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'activity-graph',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────
//
// Não há seção de variantes: esta peça não tem eixo de forma. A estrutura é
// sempre a mesma — total, camada que rola, grade e legenda —, e o que muda é o
// estado da execução, que é a seção de estados.

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import') },
      { id: 'estados',      label: tNav('nav.states') },
      { id: 'propriedades', label: tNav('nav.props')  },
      { id: 'tokens',       label: tNav('nav.tokens') },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'activity-graph',
    locale: locale.value,
  });
});

// ─── Conteúdo das seções ──────────────────────────────────────────────────────

const anatomyItems = computed(() =>
  [1, 2, 3, 4, 5].map(i => tContent(`anatomy.item${i}`)),
);

const guidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: [1, 2, 3, 4, 5].map(i => tContent(`usage.guidelines.item${i}`)),
}));

const scenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: {
    scenario: tContent('usage.scenarios.cols.scenario'),
    use: tContent('usage.scenarios.cols.use'),
    alternative: tContent('usage.scenarios.cols.alternative'),
  },
  items: [1, 2, 3, 4, 5].map(i => ({
    s: tContent(`usage.scenarios.item${i}.s`),
    u: tContent(`usage.scenarios.item${i}.u`),
    a: toPlainText(tContent(`usage.scenarios.item${i}.a`)),
  })),
}));

const uxWriting = computed(() => ({
  title: tContent('usage.uxWriting.title'),
  cols: {
    element: tContent('usage.uxWriting.table.element'),
    rules: tContent('usage.uxWriting.table.rules'),
    do: tContent('usage.uxWriting.table.correct'),
    dont: tContent('usage.uxWriting.table.avoid'),
  },
  items: ['region', 'total', 'day', 'level'].map(k => ({
    element: tContent(`usage.uxWriting.table.${k}.name`),
    rules: tContent(`usage.uxWriting.table.${k}.format`),
    do: tContent(`usage.uxWriting.table.${k}.good`),
    dont: tContent(`usage.uxWriting.table.${k}.bad`),
  })),
}));

const doList = computed(() => ({
  title: tContent('usage.do.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.do.item${i}`)),
}));

const dontList = computed(() => ({
  title: tContent('usage.dont.title'),
  items: [1, 2, 3, 4].map(i => tContent(`usage.dont.item${i}`)),
}));

const doDontPairs = computed(() => [
  {
    doLabel: tNav('common.do'),
    dontLabel: tNav('common.dont'),
    doCaption: toPlainText(tContent('doDont.pair1.do')),
    dontCaption: toPlainText(tContent('doDont.pair1.dont')),
  },
  {
    doLabel: tNav('common.do'),
    dontLabel: tNav('common.dont'),
    doCaption: toPlainText(tContent('doDont.pair2.do')),
    dontCaption: toPlainText(tContent('doDont.pair2.dont')),
  },
]);

/**
 * A tabela de estados percorre uma lista fixa.
 *
 * Diferente do estado do TRECHO ou do NÓ das duas irmãs, o estado aqui é da
 * EXECUÇÃO que escreve a grade — vazio, baixo, alto e ocupado —, e não do
 * vocabulário compartilhado `RunStatus` inteiro: a tabela descreve o que a
 * FORÇA DA TINTA mostra, e ocupado é o único ponto em que a execução importa.
 */
const stateItems = computed(() =>
  ['empty', 'low', 'high', 'busy'].map(k => ({
    label: tContent(`states.${k}.label`),
    trigger: toPlainText(tContent(`states.${k}.trigger`)),
    behavior: toPlainText(tContent(`states.${k}.behavior`)),
  })),
);

const propsCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const propsRows = (keys: string[]) =>
  keys.map(k => ({
    name: tContent(`props.table.${k}.name`),
    type: tContent(`props.table.${k}.type`),
    defaultValue: tContent(`props.table.${k}.default`),
    required: tContent(`props.table.${k}.required`),
    description: toPlainText(tContent(`props.table.${k}.description`)),
  }));

const propsTables = computed(() => [
  {
    title: 'ActivityGraph',
    cols: propsCols.value,
    items: propsRows(['days', 'start', 'end', 'thresholds', 'weekStart', 'status', 'labels']),
  },
  {
    title: 'ActivityGraphLabels',
    cols: propsCols.value,
    items: propsRows([
      'labelsRegion', 'labelsTotal', 'labelsDateFormat',
      'labelsMonthsShort', 'labelsMonthsLong', 'labelsWeekdaysShort',
      'labelsNone', 'labelsOne', 'labelsMany',
      'labelsLevels', 'labelsLegendLess', 'labelsLegendMore',
    ]),
  },
  {
    title: 'ActivityDay',
    cols: propsCols.value,
    items: propsRows(['dayDate', 'dayCount']),
  },
]);

const interfaceCode = `export interface ActivityGraphLabels {
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
// arquivo desta família que NÃO carrega geometria: a casa em que ele cai não é
// declarada, ela se DEDUZ da data e da janela.
interface ActivityDay {
  date: string;   // ano-mês-dia, um dia civil sem hora e sem fuso
  count: number;  // dias repetidos SOMAM
}

// A JANELA E A ESCALA SÃO DADO, e são o que separa esta peça de um mapa de calor
// de janela fixa: nada aqui olha o relógio, e a escala não se deriva do maior
// valor — derivada, a mesma contagem pintaria diferente em duas grades.`;

const tokenItems = computed(() =>
  [
    'textLabel', 'spacing3', 'spacing05', 'spacing2', 'mutedForeground',
    'lineHeightNormal', 'spacing3Viewport', 'border', 'radius', 'muted',
    'ring', 'spacing1', 'radiusXs', 'background', 'primary',
  ].map(k => ({
    token: tContent(`tokens.table.${k}.token`),
    value: tContent(`tokens.table.${k}.value`),
    description: toPlainText(tContent(`tokens.table.${k}.description`)),
  })),
);

const accessibilityItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8].map(i => tContent(`accessibility.items.item${i}`)),
);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab') },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter') },
  { key: '← →',   description: tContent('accessibility.keyboard.arrows') },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.chart.name'),          description: toPlainText(tContent('related.items.chart.description')),          path: '?path=/docs/primitives-display-chart--docs'                 },
  { name: tContent('related.items.calendar.name'),       description: toPlainText(tContent('related.items.calendar.description')),       path: '?path=/docs/primitives-form-calendar--docs'                 },
  { name: tContent('related.items.traceWaterfall.name'), description: toPlainText(tContent('related.items.traceWaterfall.description')), path: '?path=/docs/primitives-conversational-tracewaterfall--docs' },
  { name: tContent('related.items.jobProgress.name'),    description: toPlainText(tContent('related.items.jobProgress.description')),    path: '?path=/docs/primitives-conversational-jobprogress--docs'    },
]);

const noteItems = computed(() =>
  [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ title: '', content: tContent(`notes.item${i}`) })),
);

const analyticsItems = computed(() =>
  ['pageView', 'sectionViewed', 'demoClick'].map(k => ({
    event: tContent(`analytics.table.${k}`),
    trigger: toPlainText(tContent(`analytics.table.${k}Trigger`)),
    payload: tContent(`analytics.table.${k}Payload`),
  })),
);

const functionalTests = computed(() => ({
  title: tContent('testes.functional.title'),
  description: tContent('testes.functional.description'),
  cols: {
    action: tNav('common.userAction'),
    result: tNav('common.expectedResult'),
    priority: tNav('common.priority'),
  },
  items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
    action: toPlainText(tContent(`testes.functional.item${i}.action`)),
    result: toPlainText(tContent(`testes.functional.item${i}.result`)),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
}));

// A lista é PLANA: cada item é um critério, e o "como verificar" é o próprio
// addon-a11y rodando em toda story.
const accessibilityTests = computed(() => ({
  title: tContent('testes.accessibility.title'),
  description: tContent('testes.accessibility.description'),
  cols: {
    criterion: tNav('common.criterion'),
    level: 'WCAG',
    how: tNav('common.howToVerify'),
  },
  items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
    criterion: toPlainText(tContent(`testes.accessibility.item${i}`)),
    level: 'AA',
    how: '—',
  })),
}));

const visualTests = computed(() => ({
  title: tContent('testes.visual.title'),
  description: tContent('testes.visual.description'),
  cols: {
    story: tNav('common.storyState'),
    priority: tNav('common.priority'),
  },
  items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
    story: toPlainText(tContent(`testes.visual.item${i}.story`)),
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <!--
      A legenda diz QUAL caso está desenhado — sem ela, quatro grades
      empilhadas viram uma só, e o assunto da demonstração é justamente a
      diferença entre elas.
    -->
    <DocsDemonstration
      :title="tContent('demonstration.title')"
      component-slug="activity-graph"
    >
      <div
        class="nds-stack nds-w-full"
        data-spacing="lg"
      >
        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.quarter') }}
          </p>
          <ActivityGraph
            :days="ACTIVITY_DAYS"
            :start="ACTIVITY_START"
            :end="ACTIVITY_END"
            :thresholds="ACTIVITY_THRESHOLDS"
            status="complete"
            :labels="activityLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.empty') }}
          </p>
          <!-- GRADE VAZIA É GRADE: um trimestre sem atividade nenhuma é a
               resposta, e continua desenhado com todas as casas apagadas. -->
          <ActivityGraph
            :days="ACTIVITY_DAYS_EMPTY"
            :start="ACTIVITY_START"
            :end="ACTIVITY_END"
            :thresholds="ACTIVITY_THRESHOLDS"
            status="complete"
            :labels="activityLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.month') }}
          </p>
          <ActivityGraph
            :days="ACTIVITY_DAYS"
            :start="ACTIVITY_MONTH_START"
            :end="ACTIVITY_MONTH_END"
            :thresholds="ACTIVITY_THRESHOLDS"
            status="complete"
            :labels="activityLabels"
          />
        </div>

        <Separator />

        <div
          class="nds-stack nds-w-full"
          data-spacing="xs"
        >
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ tContent('demonstration.labels.wide') }}
          </p>
          <!-- O teto de largura é parte do assunto: sem ele a grade larga
               ficaria folgada, e a camada que rola não teria o que mostrar. -->
          <div class="nds-max-w-md">
            <ActivityGraph
              :days="ACTIVITY_DAYS"
              :start="WIDE_START"
              :end="WIDE_END"
              :thresholds="ACTIVITY_THRESHOLDS"
              status="complete"
              :labels="activityLabels"
            />
          </div>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
      language="html"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="guidelines"
      :scenarios="scenarios"
      :ux-writing="uxWriting"
      :do="doList"
      :dont="dontList"
    />

    <!-- ── Do &amp; Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <template #do-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <ActivityGraph
            :days="ACTIVITY_DAYS"
            :start="ACTIVITY_MONTH_START"
            :end="ACTIVITY_MONTH_END"
            :thresholds="ACTIVITY_THRESHOLDS"
            status="complete"
            :labels="activityLabels"
          />
        </div>
      </template>
      <template #dont-preview-0>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O contraexemplo é montado À MÃO, e tem de ser: a peça sempre
               escreve a leitura de cada casa, então não há propriedade que
               produza o erro. Aqui a frase foi removida, e sobra a tinta — que
               é exatamente o que não chega a quem lê de ouvido. -->
          <div
            class="nds-activity-graph"
            data-slot="activity-graph"
            :style="{ '--activity-graph-levels': String(monthDrawing.levels) }"
          >
            <p
              class="nds-activity-graph-total"
              data-slot="activity-graph-total"
            >{{ totalTextOf(monthDrawing) }}</p>
            <div
              class="nds-activity-graph-viewport"
              data-slot="activity-graph-viewport"
              tabindex="0"
              role="group"
              :aria-label="activityLabels.region"
            >
              <div
                class="nds-activity-graph-calendar"
                data-slot="activity-graph-calendar"
                :style="{ '--activity-graph-weeks': String(monthDrawing.weeks) }"
              >
                <ol
                  class="nds-activity-graph-months"
                  data-slot="activity-graph-months"
                  aria-hidden="true"
                >
                  <li
                    v-for="(month, index) in monthDrawing.months"
                    :key="index"
                    class="nds-activity-graph-month"
                    data-slot="activity-graph-month"
                    :style="{
                      '--activity-graph-month-column': String(month.column),
                      '--activity-graph-month-span': String(month.span),
                    }"
                  >{{ activityLabels.monthsShort[month.month] ?? '' }}</li>
                </ol>
                <ol
                  class="nds-activity-graph-weekdays"
                  data-slot="activity-graph-weekdays"
                  aria-hidden="true"
                >
                  <li
                    v-for="(weekday, index) in monthDrawing.weekdays"
                    :key="index"
                    class="nds-activity-graph-weekday"
                    data-slot="activity-graph-weekday"
                    :style="{ '--activity-graph-weekday-row': String(weekday.row) }"
                  >{{ activityLabels.weekdaysShort[weekday.weekday] ?? '' }}</li>
                </ol>
                <ol
                  class="nds-activity-graph-days"
                  data-slot="activity-graph-days"
                >
                  <li
                    v-for="cell in monthDrawing.cells"
                    :key="cell.date"
                    class="nds-activity-graph-day"
                    data-slot="activity-graph-day"
                    :data-level="String(cell.level)"
                    :data-date="cell.date"
                    :style="cellStyleOf(cell)"
                  />
                </ol>
              </div>
            </div>
            <div
              class="nds-activity-graph-legend"
              data-slot="activity-graph-legend"
            >
              <span
                class="nds-activity-graph-legend-end"
                data-slot="activity-graph-legend-end"
              >{{ activityLabels.legendLess }}</span>
              <ol
                class="nds-activity-graph-scale"
                data-slot="activity-graph-scale"
              >
                <li
                  v-for="level in monthDrawing.levels + 1"
                  :key="level - 1"
                  class="nds-activity-graph-swatch"
                  data-slot="activity-graph-swatch"
                  :data-level="String(level - 1)"
                  :style="{ '--activity-graph-day-level': String(level - 1) }"
                />
              </ol>
              <span
                class="nds-activity-graph-legend-end"
                data-slot="activity-graph-legend-end"
              >{{ activityLabels.legendMore }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- O par é a MESMA janela larga, e o que muda é a camada que rola ter,
           ou não, papel e nome. -->
      <template #do-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <div class="nds-max-w-md">
            <ActivityGraph
              :days="ACTIVITY_DAYS"
              :start="WIDE_START"
              :end="WIDE_END"
              :thresholds="ACTIVITY_THRESHOLDS"
              status="complete"
              :labels="activityLabels"
            />
          </div>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          class="nds-stack nds-w-full"
          data-spacing="lg"
        >
          <!-- O errado é a camada que rola sem papel e sem nome: quem chega
               ali por teclado para numa parada anônima. É o defeito que dois
               componentes desta casa já tiveram, e o motivo pelo qual o papel
               e o nome andam na mesma linha. -->
          <div class="nds-max-w-md">
            <div
              class="nds-activity-graph"
              data-slot="activity-graph"
              :style="{ '--activity-graph-levels': String(wideDrawing.levels) }"
            >
              <p
                class="nds-activity-graph-total"
                data-slot="activity-graph-total"
              >{{ totalTextOf(wideDrawing) }}</p>
              <div
                class="nds-activity-graph-viewport"
                data-slot="activity-graph-viewport"
                tabindex="0"
              >
                <div
                  class="nds-activity-graph-calendar"
                  data-slot="activity-graph-calendar"
                  :style="{ '--activity-graph-weeks': String(wideDrawing.weeks) }"
                >
                  <ol
                    class="nds-activity-graph-months"
                    data-slot="activity-graph-months"
                    aria-hidden="true"
                  >
                    <li
                      v-for="(month, index) in wideDrawing.months"
                      :key="index"
                      class="nds-activity-graph-month"
                      data-slot="activity-graph-month"
                      :style="{
                        '--activity-graph-month-column': String(month.column),
                        '--activity-graph-month-span': String(month.span),
                      }"
                    >{{ activityLabels.monthsShort[month.month] ?? '' }}</li>
                  </ol>
                  <ol
                    class="nds-activity-graph-weekdays"
                    data-slot="activity-graph-weekdays"
                    aria-hidden="true"
                  >
                    <li
                      v-for="(weekday, index) in wideDrawing.weekdays"
                      :key="index"
                      class="nds-activity-graph-weekday"
                      data-slot="activity-graph-weekday"
                      :style="{ '--activity-graph-weekday-row': String(weekday.row) }"
                    >{{ activityLabels.weekdaysShort[weekday.weekday] ?? '' }}</li>
                  </ol>
                  <ol
                    class="nds-activity-graph-days"
                    data-slot="activity-graph-days"
                  >
                    <li
                      v-for="cell in wideDrawing.cells"
                      :key="cell.date"
                      class="nds-activity-graph-day"
                      data-slot="activity-graph-day"
                      :data-level="String(cell.level)"
                      :data-date="cell.date"
                      :style="cellStyleOf(cell)"
                    >
                      <span
                        class="nds-sr-only"
                        data-slot="activity-graph-day-reading"
                      >{{ readingOf(cell) }}</span>
                    </li>
                  </ol>
                </div>
              </div>
              <div
                class="nds-activity-graph-legend"
                data-slot="activity-graph-legend"
              >
                <span
                  class="nds-activity-graph-legend-end"
                  data-slot="activity-graph-legend-end"
                >{{ activityLabels.legendLess }}</span>
                <ol
                  class="nds-activity-graph-scale"
                  data-slot="activity-graph-scale"
                >
                  <li
                    v-for="level in wideDrawing.levels + 1"
                    :key="level - 1"
                    class="nds-activity-graph-swatch"
                    data-slot="activity-graph-swatch"
                    :data-level="String(level - 1)"
                    :style="{ '--activity-graph-day-level': String(level - 1) }"
                  >
                    <span
                      class="nds-sr-only"
                      data-slot="activity-graph-swatch-reading"
                    >{{ activityLabels.levels[level - 1] ?? '' }}</span>
                  </li>
                </ol>
                <span
                  class="nds-activity-graph-legend-end"
                  data-slot="activity-graph-legend-end"
                >{{ activityLabels.legendMore }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="tContent('import.basicCode')"
      :secondary-description="tContent('import.withLabels')"
      :secondary-code="tContent('import.withLabelsCode')"
    />

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="propsTables"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="stripHtml(tContent('props.extensibility'))"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.value'),
        description: tContent('tokens.table.description'),
      }"
      :items="tokenItems"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
      language="css"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
      :screen-reader-title="tContent('accessibility.screenReader.title')"
      :screen-reader-items="screenReaderItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="activity-graph"
    />

    <!-- ── Analytics ──────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="functionalTests"
      :accessibility="accessibilityTests"
      :visual="visualTests"
    />
  </DocsPageLayout>
</template>
