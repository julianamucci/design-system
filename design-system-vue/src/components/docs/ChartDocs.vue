<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { ChartContainer, buildBarOption, buildLineOption, buildAreaOption, buildPieOption } from '@/components/ui/chart';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import chartTranslations from '@shared/content/chart/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

// ─── i18n ─────────────────────────────────────────────────────────────────────

// IMPORTANTE: locale vem de useTranslation, NUNCA de useLocaleStore ou Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(chartTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

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
  componentSlug: 'chart',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'chart',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')        },
      { id: 'variantes',    label: tNav('nav.variants')      },
      { id: 'composicoes',  label: tNav('nav.compositions')  },
      { id: 'estados',      label: tNav('nav.states')        },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
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
    component_name: 'chart',
    locale: locale.value,
  });
});
// ─── Chart data ───────────────────────────────────────────────────────────────

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73,  mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

// API ECharts: xAxis (labels) + series (dados alinhados).
const xMonths = chartData.map(d => d.month);
const singleSeries = [{ name: 'Desktop', data: chartData.map(d => d.desktop) }];
const multiSeries = [
  { name: 'Desktop', data: chartData.map(d => d.desktop) },
  { name: 'Mobile',  data: chartData.map(d => d.mobile) },
];
const pieData = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile',  value: 860 },
  { label: 'Tablet',  value: 320 },
];

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { ChartContainer } from "@/components/ui/chart";`;

const codeImportSecondary = `import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from "@/components/ui/chart";`;

const codeBarChart = `<ChartContainer :option="buildBarOption({ xAxis: xMonths, series: multiSeries })" class="h-[300px] w-full" />`;

const codeLineChart = `<ChartContainer :option="buildLineOption({ xAxis: xMonths, series: multiSeries })" class="h-[300px] w-full" />`;

const codeAreaChart = `<ChartContainer :option="buildAreaOption({ xAxis: xMonths, series: multiSeries })" class="h-[300px] w-full" />`;

const codePieChart = `<ChartContainer :option="buildPieOption({ data: pieData })" class="h-[300px] w-full" />`;

const codeCustomizationTokens = `/* Em globals.css — personalizar tokens de cor das séries */
:root {
  --chart-1: 221 83% 53%;
  --chart-2: 142 76% 36%;
  --chart-3: 48 96% 53%;
  --chart-4: 262 83% 58%;
  --chart-5: 0 84% 60%;
}

.dark {
  --chart-1: 217 91% 60%;
  --chart-2: 142 70% 45%;
  --chart-3: 48 96% 58%;
  --chart-4: 262 83% 70%;
  --chart-5: 0 84% 68%;
}`;

const interfaceCode = `// ChartContainer props (Vue)
interface ChartContainerProps {
  option: EChartsCoreOption;
  class?: string;
  renderer?: 'svg' | 'canvas';
}

// Builders auxiliares — montam o option a partir de dados simples.
export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries     { name: string; data: number[]; color?: string }

interface OptionsBase {
  data?: ChartDataPoint[];
  xAxis?: Array<string | number>;
  series?: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}

declare function buildBarOption(o: OptionsBase): EChartsCoreOption;
declare function buildLineOption(o: OptionsBase): EChartsCoreOption;
declare function buildAreaOption(o: OptionsBase): EChartsCoreOption;
declare function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'bar',  description: stripHtml(tContent('variants.items.bar')),  code: codeBarChart  },
  { name: 'line', description: stripHtml(tContent('variants.items.line')), code: codeLineChart },
  { name: 'area', description: stripHtml(tContent('variants.items.area')), code: codeAreaChart },
  { name: 'pie',  description: stripHtml(tContent('variants.items.pie')),  code: codePieChart  },
]);

// ─── Compositions ─────────────────────────────────────────────────────────────

const codeCompInCard = `<Card class="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer
      :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
      class="h-[200px] w-full"
      aria-label="Gráfico de barras: acessos mensais por dispositivo"
     />
  </CardContent>
</Card>`;

const codeCompMultiSeries = `<ChartContainer
  :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
  class="h-[240px] w-full"
  aria-label="Gráfico multi-séries: Desktop e Mobile"
/>`;

const codeCompSmallInline = `<div class="flex items-center gap-4 rounded-md border p-4 w-fit">
  <div>
    <p class="text-xs text-muted-foreground">Acessos</p>
    <p class="text-2xl font-semibold">1.224</p>
  </div>
  <ChartContainer
    :option="buildLineOption({ xAxis: xMonths, series: multiSeries })"
    class="h-[48px] w-[120px]"
    aria-label="Tendência de acessos nos últimos 6 meses"
   />
</div>`;

const codeCompEmpty = `<div
  v-if="data.length === 0"
  role="status"
  class="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
>
  Nenhum dado disponível para o período selecionado.
</div>
<ChartContainer v-else :option="buildBarOption({ xAxis: xMonths, series: multiSeries })" class="h-[200px] w-full" aria-label="..." />`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.inCard.name'),
    description: tContent('variants.compositions.inCard.description'),
    useWhen: tContent('variants.compositions.inCard.use'),
    code: codeCompInCard,
  },
  {
    name: tContent('variants.compositions.multiSeriesWithLegend.name'),
    description: tContent('variants.compositions.multiSeriesWithLegend.description'),
    useWhen: tContent('variants.compositions.multiSeriesWithLegend.use'),
    code: codeCompMultiSeries,
  },
  {
    name: tContent('variants.compositions.smallInline.name'),
    description: tContent('variants.compositions.smallInline.description'),
    useWhen: tContent('variants.compositions.smallInline.use'),
    code: codeCompSmallInline,
  },
  {
    name: tContent('variants.compositions.withEmptyState.name'),
    description: tContent('variants.compositions.withEmptyState.description'),
    useWhen: tContent('variants.compositions.withEmptyState.use'),
    code: codeCompEmpty,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.empty.label'),        trigger: stripHtml(tContent('states.empty.trigger')),        behavior: stripHtml(tContent('states.empty.behavior'))        },
  { label: tContent('states.loading.label'),       trigger: stripHtml(tContent('states.loading.trigger')),       behavior: stripHtml(tContent('states.loading.behavior'))       },
  { label: tContent('states.singleSeries.label'),  trigger: stripHtml(tContent('states.singleSeries.trigger')),  behavior: stripHtml(tContent('states.singleSeries.behavior'))  },
  { label: tContent('states.multiSeries.label'),   trigger: stripHtml(tContent('states.multiSeries.trigger')),   behavior: stripHtml(tContent('states.multiSeries.behavior'))   },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const containerPropItems = computed(() => [
  { name: 'option',     type: 'EChartsCoreOption', defaultValue: '—',     required: 'Sim', description: stripHtml(tContent('props.table.option'))    },
  { name: 'renderer',   type: '"svg" | "canvas"',  defaultValue: '"svg"', required: 'Não', description: stripHtml(tContent('props.table.renderer'))  },
  { name: 'class',      type: 'string',            defaultValue: '—',     required: 'Não', description: stripHtml(tContent('props.table.className')) },
  { name: 'aria-label', type: 'string',            defaultValue: '—',     required: 'Sim', description: stripHtml(tContent('props.table.ariaLabel')) },
]);

const legendPropItems = computed(() => [
  { name: 'data',       type: '{ label: string; value: number }[]',           defaultValue: '—',    required: 'Não', description: stripHtml(tContent('props.table.data'))       },
  { name: 'xAxis',      type: '(string | number)[]',                          defaultValue: '—',    required: 'Não', description: stripHtml(tContent('props.table.xAxis'))      },
  { name: 'series',     type: '{ name: string; data: number[]; color?: string }[]', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.series')) },
  { name: 'title',      type: 'string',                                       defaultValue: '—',    required: 'Não', description: stripHtml(tContent('props.table.title'))      },
  { name: 'showLegend', type: 'boolean',                                      defaultValue: 'auto', required: 'Não', description: stripHtml(tContent('props.table.showLegend')) },
]);

const tokenRows = computed(() => [
  { token: '--chart-1',          value: 'color série 1',    description: tContent('tokens.table.chart1')          },
  { token: '--chart-2',          value: 'color série 2',    description: tContent('tokens.table.chart2')          },
  { token: '--chart-3',          value: 'color série 3',    description: tContent('tokens.table.chart3')          },
  { token: '--chart-4',          value: 'color série 4',    description: tContent('tokens.table.chart4')          },
  { token: '--chart-5',          value: 'color série 5',    description: tContent('tokens.table.chart5')          },
  { token: '--primary',          value: 'axisPointer',      description: tContent('tokens.table.primary')         },
  { token: '--muted-foreground', value: 'axisLabel',        description: tContent('tokens.table.mutedForeground') },
  { token: '--border',           value: 'axisLine + grid',  description: tContent('tokens.table.border')          },
  { token: '--foreground',       value: 'title + tooltip',  description: tContent('tokens.table.foreground')      },
  { token: '--card',             value: 'tooltip bg',       description: tContent('tokens.table.card')            },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
  tContent('accessibility.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',        description: tContent('accessibility.keyboard.tab')        },
  { key: 'ArrowRight', description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'ArrowLeft',  description: tContent('accessibility.keyboard.arrowLeft')  },
]);

const relatedItems = computed(() => [
  { name: 'Table',     description: tContent('related.table'),     path: '?path=/docs/ui-table--docs'      },
  { name: 'Card',      description: tContent('related.card'),      path: '?path=/docs/ui-card--docs'       },
  { name: 'DataTable', description: tContent('related.dataTable'), path: '?path=/docs/ui-datatable--docs'  },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
  { title: '', content: tContent('notes.tip5') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);
</script>

<template>
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="chart">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npm install echarts vue-echarts"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')" component-slug="chart">
      <div class="flex flex-col items-center justify-center w-full py-8 gap-4">
        <ChartContainer
          :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
          class="h-[240px] w-full max-w-lg"
          :aria-label="tContent('demonstration.labels.chartTitle')"
         />

      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
          tContent('usage.guidelines.item5'),
          tContent('usage.guidelines.item6'),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.axisLabel.name'),     rules: tContent('usage.uxWriting.table.axisLabel.format'),     do: tContent('usage.uxWriting.table.axisLabel.good'),     dont: tContent('usage.uxWriting.table.axisLabel.bad')     },
          { element: tContent('usage.uxWriting.table.tooltipValue.name'),  rules: tContent('usage.uxWriting.table.tooltipValue.format'),  do: tContent('usage.uxWriting.table.tooltipValue.good'),  dont: tContent('usage.uxWriting.table.tooltipValue.bad')  },
          { element: tContent('usage.uxWriting.table.legendLabel.name'),   rules: tContent('usage.uxWriting.table.legendLabel.format'),   do: tContent('usage.uxWriting.table.legendLabel.good'),   dont: tContent('usage.uxWriting.table.legendLabel.bad')   },
          { element: tContent('usage.uxWriting.table.emptyState.name'),    rules: tContent('usage.uxWriting.table.emptyState.format'),    do: tContent('usage.uxWriting.table.emptyState.good'),    dont: tContent('usage.uxWriting.table.emptyState.bad')    },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <!-- Pair 1: DO — com legenda visível -->
      <template #do-preview-0>
        <div class="flex flex-col items-center justify-center py-6 px-4 gap-3">
          <ChartContainer
            :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[120px] w-full max-w-xs"
            aria-label="Bar chart com legenda"
           />

        </div>
      </template>
      <!-- Pair 1: DON'T — sem legenda -->
      <template #dont-preview-0>
        <div class="flex flex-col items-center justify-center py-6 px-4 gap-3">
          <ChartContainer
            :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[120px] w-full max-w-xs"
           />
          <p class="text-xs text-muted-foreground italic">Sem legenda — séries indistinguíveis</p>
        </div>
      </template>
      <!-- Pair 2: DO — com aria-label -->
      <template #do-preview-1>
        <div class="flex flex-col items-center justify-center gap-2 py-4">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
            <code>aria-label="Gráfico de barras: acessos mensais"</code>
          </div>
          <p class="text-xs text-muted-foreground text-center max-w-xs">aria-label descritivo garante acessibilidade para leitores de tela</p>
        </div>
      </template>
      <!-- Pair 2: DON'T — sem aria-label -->
      <template #dont-preview-1>
        <div class="flex flex-col items-center justify-center gap-2 py-4">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></span>
            <code>&lt;ChartContainer :config="..."&gt;</code>
          </div>
          <p class="text-xs text-muted-foreground text-center max-w-xs">Sem aria-label — gráfico inacessível para leitores de tela</p>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withBuilders')"
      :secondary-code="codeImportSecondary"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" component-slug="chart">
      <!-- Bar chart -->
      <template #variant-preview-0>
        <div class="py-6 px-4 flex flex-col gap-3">
          <ChartContainer
            :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[180px] w-full"
            aria-label="Bar chart"
           />
        </div>
      </template>
      <!-- Line chart -->
      <template #variant-preview-1>
        <div class="py-6 px-4 flex flex-col gap-3">
          <ChartContainer
            :option="buildLineOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[180px] w-full"
            aria-label="Line chart"
           />
        </div>
      </template>
      <!-- Area chart -->
      <template #variant-preview-2>
        <div class="py-6 px-4 flex flex-col gap-3">
          <ChartContainer
            :option="buildAreaOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[180px] w-full"
            aria-label="Area chart"
           />
        </div>
      </template>
      <!-- Pie chart -->
      <template #variant-preview-3>
        <div class="py-6 px-4 flex flex-col gap-3">
          <ChartContainer
            :option="buildPieOption({ data: pieData })"
            class="h-[180px] w-[260px]"
            aria-label="Pie chart"
           />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="chart"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Acessos mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
              class="h-[200px] w-full"
              aria-label="Gráfico de barras: acessos mensais por dispositivo"
             />
          </CardContent>
        </Card>
      </template>

      <template #variant-preview-1>
        <div class="flex flex-col items-center gap-3 w-full">
          <ChartContainer
            :option="buildBarOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[200px] w-full max-w-md"
            aria-label="Gráfico multi-séries: Desktop e Mobile"
           />

        </div>
      </template>

      <template #variant-preview-2>
        <div class="flex items-center gap-4 rounded-md border p-4 w-fit">
          <div>
            <p class="text-xs text-muted-foreground">Acessos</p>
            <p class="text-2xl font-semibold">1.224</p>
          </div>
          <ChartContainer
            :option="buildLineOption({ xAxis: xMonths, series: multiSeries })"
            class="h-[48px] w-[120px]"
            aria-label="Tendência de acessos nos últimos 6 meses"
           />
        </div>
      </template>

      <template #variant-preview-3>
        <div
          role="status"
          class="flex h-[200px] w-full max-w-sm items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
        >
          Nenhum dado disponível para o período selecionado.
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.containerTitle'), cols: propCols, items: containerPropItems },
        { title: tContent('props.legendTitle'),    cols: propCols, items: legendPropItems    },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" component-slug="chart" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" component-slug="chart" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
