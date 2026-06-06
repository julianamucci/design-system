<script lang="ts">
  import { ChartContainer, buildBarOption, buildLineOption, buildAreaOption, buildPieOption } from '@/components/ui/chart';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import chartTranslations from '@shared/content/chart/translations.json';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(chartTranslations);

  // ─── SEO + Analytics ─────────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const l = $locale;
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale: l,
      componentSlug: 'chart',
    });
    track('docs_page_view', {
      component_name: 'chart',
      locale: l,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Active section ──────────────────────────────────────────────────────────


  const NAV_GROUPS = $derived.by(() => {
    const tNav = $tNavStore;
    return [
      { label: tNav('nav.overview'), sections: [
        { id: 'demonstracao', label: tNav('nav.demonstration') },
        { id: 'anatomia',     label: tNav('nav.anatomy')       },
        { id: 'quando-usar',  label: tNav('nav.usage')         },
        { id: 'do-dont',      label: tNav('nav.doDont')        },
      ]},
      { label: tNav('nav.techRef'), sections: [
        { id: 'importacao',   label: tNav('nav.import')       },
        { id: 'variantes',    label: tNav('nav.variants')     },
        { id: 'composicoes',  label: tNav('nav.compositions') },
        { id: 'estados',      label: tNav('nav.states')       },
        { id: 'propriedades', label: tNav('nav.props')    },
        { id: 'tokens',       label: tNav('nav.tokens')   },
      ]},
      { label: tNav('nav.context'), sections: [
        { id: 'acessibilidade', label: tNav('nav.accessibility') },
        { id: 'relacionados',   label: tNav('nav.related')       },
        { id: 'notas',          label: tNav('nav.notes')         },
      ]},
      { label: tNav('nav.quality'), sections: [
        { id: 'analytics', label: tNav('nav.analytics') },
        { id: 'testes',    label: tNav('nav.testes')    },
      ]},
    ];
  });

  const sectionIds = NAV_GROUPS.flatMap(g => g.sections.map(s => s.id));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'chart', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function stripHtml(s: string) {
    return s.replace(/<[^>]*>/g, '');
  }

  const priorityKeyMap: Record<string, string> = {
    high: 'common.high',
    medium: 'common.medium',
    low: 'common.low',
  };

  function localPriority(raw: string, tNav: (k: string) => string): string {
    return tNav(priorityKeyMap[raw] ?? 'common.high');
  }

  // ─── Chart data & config ─────────────────────────────────────────────────────

  const monthlyData = [
    { month: 'Jan', value: 186 },
    { month: 'Fev', value: 305 },
    { month: 'Mar', value: 237 },
    { month: 'Abr', value: 173 },
    { month: 'Mai', value: 209 },
    { month: 'Jun', value: 264 },
  ];

  const multiSeriesData = monthlyData.map((d, i) => ({
    ...d,
    value2: [120, 198, 145, 220, 175, 310][i],
  }));

  // Para a API ECharts: xAxis + series.
  const xMonths = monthlyData.map(d => d.month);
  const singleSeries = [{ name: 'Vendas', data: monthlyData.map(d => d.value) }];
  const multiSeries = [
    { name: 'Vendas',     data: monthlyData.map(d => d.value) },
    { name: 'Devoluções', data: multiSeriesData.map(d => d.value2 ?? 0) },
  ];
  const pieData = [
    { label: 'Desktop', value: 1224 },
    { label: 'Mobile',  value: 860 },
    { label: 'Tablet',  value: 320 },
  ];

  

  

  // ─── Demo state ──────────────────────────────────────────────────────────────
  type DemoType = 'bar' | 'line';
  let demoType = $state<DemoType>('bar');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { ChartContainer } from '@/components/ui/chart';`;

  const codeImportSecondary = `import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from '@/components/ui/chart';`;

  const codeBar = `<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
  class="h-[240px] w-full"
  aria-label="Gráfico de barras: acessos mensais"
/>`;

  const codeLine = `<ChartContainer
  option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
  class="h-[240px] w-full"
  aria-label="Gráfico de linhas: tendência mensal"
/>`;

  const codeArea = `<ChartContainer
  option={buildAreaOption({ xAxis: xMonths, series: multiSeries })}
  class="h-[240px] w-full"
  aria-label="Gráfico de área: volume mensal"
/>`;

  const codePie = `<ChartContainer
  option={buildPieOption({ data: pieData })}
  class="h-[280px] w-full"
  aria-label="Gráfico de pizza: distribuição por dispositivo"
/>`;

  const codeMulti = `<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series: multiSeries, title: 'Vendas' })}
  class="h-[280px] w-full"
  aria-label="Gráfico multi-séries: Vendas por categoria"
/>`;

  const interfaceCode = `// ChartContainer (Svelte 5)
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

  const codeTokens = `/* Em globals.css — personalizar as cores das séries */
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} activeSection={section.value} componentSlug="chart">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="npm install echarts"
    />
  {/snippet}

  <!-- ── Demonstração ───────────────────────────────────────────── -->
  <DocsDemonstration title={$tStore('demonstration.title')}>
    {#snippet children()}
      <div class="flex flex-col items-center gap-4 w-full">
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => demoType = 'bar'}
            class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
            class:bg-primary={demoType === 'bar'}
            class:text-primary-foreground={demoType === 'bar'}
            class:bg-muted={demoType !== 'bar'}
            class:text-muted-foreground={demoType !== 'bar'}
          >
            {$tStore('demonstration.labels.bar')}
          </button>
          <button
            type="button"
            onclick={() => demoType = 'line'}
            class="px-3 py-1 rounded-md text-sm font-medium transition-colors"
            class:bg-primary={demoType === 'line'}
            class:text-primary-foreground={demoType === 'line'}
            class:bg-muted={demoType !== 'line'}
            class:text-muted-foreground={demoType !== 'line'}
          >
            {$tStore('demonstration.labels.line')}
          </button>
        </div>
        <ChartContainer
          option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
          class="h-[220px] w-full max-w-[400px]"
          aria-label={$tStore('demonstration.labels.chartTitle')}
         />
      </div>
    {/snippet}
  </DocsDemonstration>

  <!-- ── Anatomia ───────────────────────────────────────────────── -->
  <DocsAnatomy
    title={$tStore('anatomy.title')}
    items={[
      $tStore('anatomy.item1'),
      $tStore('anatomy.item2'),
      $tStore('anatomy.item3'),
      $tStore('anatomy.item4'),
    ]}
    structureLabel={$tStore('anatomy.structureLabel')}
    structureCode={`<ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} aria-label="..." />`}
  />

  <!-- ── Quando Usar ────────────────────────────────────────────── -->
  <DocsWhenToUse
    title={$tStore('usage.title')}
    guidelines={{
      title: $tStore('usage.guidelines.title'),
      items: [
        $tStore('usage.guidelines.item1'),
        $tStore('usage.guidelines.item2'),
        $tStore('usage.guidelines.item3'),
        $tStore('usage.guidelines.item4'),
        $tStore('usage.guidelines.item5'),
        $tStore('usage.guidelines.item6'),
      ],
    }}
    scenarios={{
      title: $tStore('usage.scenarios.title'),
      cols: {
        scenario: $tStore('usage.scenarios.cols.scenario'),
        use: $tStore('usage.scenarios.cols.use'),
        alternative: $tStore('usage.scenarios.cols.alternative'),
      },
      items: [
        { s: $tStore('usage.scenarios.item1.s'), u: $tStore('usage.scenarios.item1.u'), a: $tStore('usage.scenarios.item1.a') },
        { s: $tStore('usage.scenarios.item2.s'), u: $tStore('usage.scenarios.item2.u'), a: $tStore('usage.scenarios.item2.a') },
        { s: $tStore('usage.scenarios.item3.s'), u: $tStore('usage.scenarios.item3.u'), a: $tStore('usage.scenarios.item3.a') },
        { s: $tStore('usage.scenarios.item4.s'), u: $tStore('usage.scenarios.item4.u'), a: $tStore('usage.scenarios.item4.a') },
        { s: $tStore('usage.scenarios.item5.s'), u: $tStore('usage.scenarios.item5.u'), a: $tStore('usage.scenarios.item5.a') },
        { s: $tStore('usage.scenarios.item6.s'), u: $tStore('usage.scenarios.item6.u'), a: $tStore('usage.scenarios.item6.a') },
      ],
    }}
    uxWriting={{
      title: $tStore('usage.uxWriting.title'),
      cols: {
        element: $tStore('usage.uxWriting.table.element'),
        rules: $tStore('usage.uxWriting.table.rules'),
        do: $tStore('usage.uxWriting.table.correct'),
        dont: $tStore('usage.uxWriting.table.avoid'),
      },
      items: [
        { element: $tStore('usage.uxWriting.table.axisLabel.name'),    rules: $tStore('usage.uxWriting.table.axisLabel.format'),    do: $tStore('usage.uxWriting.table.axisLabel.good'),    dont: $tStore('usage.uxWriting.table.axisLabel.bad')    },
        { element: $tStore('usage.uxWriting.table.tooltipValue.name'), rules: $tStore('usage.uxWriting.table.tooltipValue.format'), do: $tStore('usage.uxWriting.table.tooltipValue.good'), dont: $tStore('usage.uxWriting.table.tooltipValue.bad') },
        { element: $tStore('usage.uxWriting.table.legendLabel.name'),  rules: $tStore('usage.uxWriting.table.legendLabel.format'),  do: $tStore('usage.uxWriting.table.legendLabel.good'),  dont: $tStore('usage.uxWriting.table.legendLabel.bad')  },
        { element: $tStore('usage.uxWriting.table.emptyState.name'),   rules: $tStore('usage.uxWriting.table.emptyState.format'),   do: $tStore('usage.uxWriting.table.emptyState.good'),   dont: $tStore('usage.uxWriting.table.emptyState.bad')   },
      ],
    }}
    do={{
      title: $tStore('usage.do.title'),
      items: [
        $tStore('usage.do.item1'),
        $tStore('usage.do.item2'),
        $tStore('usage.do.item3'),
        $tStore('usage.do.item4'),
      ],
    }}
    dont={{
      title: $tStore('usage.dont.title'),
      items: [
        $tStore('usage.dont.item1'),
        $tStore('usage.dont.item2'),
        $tStore('usage.dont.item3'),
      ],
    }}
  />

  <!-- ── Do & Don't ─────────────────────────────────────────────── -->
  <DocsDoDont
    title={$tStore('doDont.title')}
    pairs={[
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair1.do'),
        dontCaption: $tStore('doDont.pair1.dont'),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: $tStore('doDont.pair2.do'),
        dontCaption: $tStore('doDont.pair2.dont'),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[140px] w-full"
      aria-label="Gráfico multi-séries com legenda: Desktop e Mobile"
     />
  {/snippet}
  {#snippet dontPair1()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[140px] w-full"
      aria-label="Gráfico multi-séries sem legenda"
     />
  {/snippet}
  {#snippet doPair2()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[140px] w-full"
      aria-label="Gráfico de barras: acessos mensais por dispositivo — com aria-label descritivo"
     />
  {/snippet}
  {#snippet dontPair2()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[140px] w-full"
     />
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
    secondaryCode={codeImportSecondary}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    items={[
      { name: 'Bar',   description: stripHtml($tStore('variants.items.bar')),  code: codeBar,  preview: variantBar  },
      { name: 'Linha', description: stripHtml($tStore('variants.items.line')), code: codeLine, preview: variantLine },
      { name: 'Area',  description: stripHtml($tStore('variants.items.area')), code: codeArea, preview: variantArea },
      { name: 'Pie',   description: stripHtml($tStore('variants.items.pie')),  code: codePie,  preview: variantPie  },
    ]}
  />

  {#snippet variantBar()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[180px] w-[300px]"
      aria-label="Gráfico de barras: acessos mensais"
    />
  {/snippet}
  {#snippet variantLine()}
    <ChartContainer
      option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[180px] w-[300px]"
      aria-label="Gráfico de linhas: acessos mensais"
    />
  {/snippet}
  {#snippet variantArea()}
    <ChartContainer
      option={buildAreaOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[180px] w-[300px]"
      aria-label="Gráfico de área: volume mensal"
    />
  {/snippet}
  {#snippet variantPie()}
    <ChartContainer
      option={buildPieOption({ data: pieData })}
      class="h-[200px] w-[220px]"
      aria-label="Gráfico de pizza: distribuição por dispositivo"
    />
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="chart"
    items={[
      {
        name: $tStore('variants.compositions.inCard.name'),
        description: $tStore('variants.compositions.inCard.description'),
        useWhen: $tStore('variants.compositions.inCard.use'),
        code: `<Card class="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} class="h-[200px] w-full" aria-label="..." />
  </CardContent>
</Card>`,
        preview: compInCard,
      },
      {
        name: $tStore('variants.compositions.multiSeriesWithLegend.name'),
        description: $tStore('variants.compositions.multiSeriesWithLegend.description'),
        useWhen: $tStore('variants.compositions.multiSeriesWithLegend.use'),
        code: `<ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} class="h-[200px] w-full" aria-label="Gráfico multi-séries: Desktop e Mobile" />`,
        preview: compMultiSeries,
      },
      {
        name: $tStore('variants.compositions.smallInline.name'),
        description: $tStore('variants.compositions.smallInline.description'),
        useWhen: $tStore('variants.compositions.smallInline.use'),
        code: `<div class="flex items-center gap-4 rounded-md border p-4 w-fit">
  <div>
    <p class="text-xs text-muted-foreground">Acessos</p>
    <p class="text-2xl font-semibold">1.224</p>
  </div>
  <ChartContainer option={buildLineOption({ xAxis: xMonths, series: multiSeries })} class="h-[48px] w-[120px]" aria-label="Tendência de acessos" />
</div>`,
        preview: compSmallInline,
      },
      {
        name: $tStore('variants.compositions.withEmptyState.name'),
        description: $tStore('variants.compositions.withEmptyState.description'),
        useWhen: $tStore('variants.compositions.withEmptyState.use'),
        code: `{#if data.length === 0}
  <div role="status" class="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
    Nenhum dado disponível para o período selecionado.
  </div>
{:else}
  <ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} class="h-[200px] w-full" aria-label="..." />
{/if}`,
        preview: compEmptyState,
      },
    ]}
  />

  {#snippet compInCard()}
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Acessos mensais</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
          class="h-[180px] w-full"
          aria-label="Gráfico de barras: acessos mensais"
         />
      </CardContent>
    </Card>
  {/snippet}

  {#snippet compMultiSeries()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="h-[200px] w-full max-w-md"
      aria-label="Gráfico multi-séries: Desktop e Mobile"
     />
  {/snippet}

  {#snippet compSmallInline()}
    <div class="flex items-center gap-4 rounded-md border p-4 w-fit">
      <div>
        <p class="text-xs text-muted-foreground">Acessos</p>
        <p class="text-2xl font-semibold">1.224</p>
      </div>
      <ChartContainer
        option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
        class="h-[48px] w-[120px]"
        aria-label="Tendência de acessos nos últimos 6 meses"
       />
    </div>
  {/snippet}

  {#snippet compEmptyState()}
    <div
      role="status"
      class="flex h-[200px] w-full max-w-sm items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
    >
      Nenhum dado disponível para o período selecionado.
    </div>
  {/snippet}

  <!-- ── Estados ───────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: $tStore('states.cols.trigger'),
      behavior: $tStore('states.cols.behavior'),
    }}
    items={[
      { label: $tStore('states.empty.label'),        trigger: stripHtml($tStore('states.empty.trigger')),        behavior: $tStore('states.empty.behavior')        },
      { label: $tStore('states.loading.label'),      trigger: stripHtml($tStore('states.loading.trigger')),      behavior: stripHtml($tStore('states.loading.behavior'))      },
      { label: $tStore('states.singleSeries.label'), trigger: stripHtml($tStore('states.singleSeries.trigger')), behavior: stripHtml($tStore('states.singleSeries.behavior')) },
      { label: $tStore('states.multiSeries.label'),  trigger: stripHtml($tStore('states.multiSeries.trigger')),  behavior: stripHtml($tStore('states.multiSeries.behavior'))  },
    ]}
  />

  <!-- ── Propriedades ───────────────────────────────────────────── -->
  <DocsProps
    title={$tStore('props.title')}
    tables={[
      {
        title: $tStore('props.containerTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'option',     type: 'EChartsCoreOption', defaultValue: '—',     required: 'Sim', description: stripHtml($tStore('props.table.option'))    },
          { name: 'renderer',   type: '"svg" | "canvas"',  defaultValue: '"svg"', required: 'Não', description: stripHtml($tStore('props.table.renderer'))  },
          { name: 'class',      type: 'string',            defaultValue: '—',     required: 'Não', description: stripHtml($tStore('props.table.className')) },
          { name: 'aria-label', type: 'string',            defaultValue: '—',     required: 'Sim', description: stripHtml($tStore('props.table.ariaLabel')) },
        ],
      },
      {
        title: $tStore('props.legendTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'data',       type: '{ label: string; value: number }[]',           defaultValue: '—',    required: 'Não', description: stripHtml($tStore('props.table.data'))       },
          { name: 'xAxis',      type: '(string | number)[]',                          defaultValue: '—',    required: 'Não', description: stripHtml($tStore('props.table.xAxis'))      },
          { name: 'series',     type: '{ name: string; data: number[]; color?: string }[]', defaultValue: '—', required: 'Não', description: stripHtml($tStore('props.table.series')) },
          { name: 'title',      type: 'string',                                       defaultValue: '—',    required: 'Não', description: stripHtml($tStore('props.table.title'))      },
          { name: 'showLegend', type: 'boolean',                                      defaultValue: 'auto', required: 'Não', description: stripHtml($tStore('props.table.showLegend')) },
        ],
      },
    ]}
    interfaceCode={interfaceCode}
    extensibilityTitle={$tStore('props.extensibilityTitle')}
    extensibilityNotes={$tStore('props.extensibility')}
  />

  <!-- ── Tokens ─────────────────────────────────────────────────── -->
  <DocsTokens
    title={$tStore('tokens.title')}
    cols={{
      token: $tStore('tokens.table.token'),
      value: $tStore('tokens.table.class'),
      description: $tStore('tokens.table.part'),
    }}
    items={[
      { token: '--chart-1',          value: 'color série 1',  description: $tStore('tokens.table.chart1')         },
      { token: '--chart-2',          value: 'color série 2',  description: $tStore('tokens.table.chart2')         },
      { token: '--chart-3',          value: 'color série 3',  description: $tStore('tokens.table.chart3')         },
      { token: '--chart-4',          value: 'color série 4',  description: $tStore('tokens.table.chart4')         },
      { token: '--chart-5',          value: 'color série 5',  description: $tStore('tokens.table.chart5')         },
      { token: '--primary',          value: 'axisPointer',    description: $tStore('tokens.table.primary')        },
      { token: '--muted-foreground', value: 'axisLabel',      description: $tStore('tokens.table.mutedForeground') },
      { token: '--border',           value: 'axisLine + grid', description: $tStore('tokens.table.border')        },
      { token: '--foreground',       value: 'title + tooltip', description: $tStore('tokens.table.foreground')    },
      { token: '--card',             value: 'tooltip bg',     description: $tStore('tokens.table.card')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    title={$tStore('accessibility.title')}
    summary={$tStore('accessibility.summary')}
    items={[
      $tStore('accessibility.item1'),
      $tStore('accessibility.item2'),
      $tStore('accessibility.item3'),
      $tStore('accessibility.item4'),
      $tStore('accessibility.item5'),
      $tStore('accessibility.item6'),
    ]}
    keyboardTitle={$tStore('accessibility.keyboardTitle')}
    keyboardItems={[
      { key: 'Tab',        description: $tStore('accessibility.keyboard.tab')        },
      { key: 'ArrowRight', description: $tStore('accessibility.keyboard.arrowRight') },
      { key: 'ArrowLeft',  description: $tStore('accessibility.keyboard.arrowLeft')  },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Table',     description: $tStore('related.table'),     path: '?path=/docs/ui-table--docs'     },
      { name: 'Card',      description: $tStore('related.card'),      path: '?path=/docs/ui-card--docs'      },
      { name: 'DataTable', description: $tStore('related.dataTable'), path: '?path=/docs/ui-data-table--docs' },
    ]}
  />

  <!-- ── Notas ──────────────────────────────────────────────────── -->
  <DocsNotes
    title={$tStore('notes.title')}
    items={[
      { title: '', content: $tStore('notes.tip1') },
      { title: '', content: $tStore('notes.tip2') },
      { title: '', content: $tStore('notes.tip3') },
      { title: '', content: $tStore('notes.tip4') },
      { title: '', content: $tStore('notes.tip5') },
    ]}
  />

  <!-- ── Analytics ─────────────────────────────────────────────── -->
  <DocsAnalytics
    title={$tStore('analytics.title')}
    cols={{
      event: $tStore('analytics.table.event'),
      trigger: $tStore('analytics.table.trigger'),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.pageView'),      trigger: $tStore('analytics.table.pageViewTrigger'),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: $tStore('analytics.table.sectionViewedTrigger'), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: $tStore('analytics.table.langSwitchTrigger'),    payload: $tStore('analytics.table.langSwitchPayload')    },
    ]}
  />

  <!-- ── Testes ─────────────────────────────────────────────────── -->
  <DocsTestes
    title={$tStore('testes.title')}
    functional={{
      title: $tStore('testes.functional.title'),
      cols: {
        action: $tNavStore('common.userAction'),
        result: $tNavStore('common.expectedResult'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { action: $tStore('testes.functional.item1.action'), result: $tStore('testes.functional.item1.result'), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item2.action'), result: $tStore('testes.functional.item2.result'), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item3.action'), result: $tStore('testes.functional.item3.result'), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item4.action'), result: $tStore('testes.functional.item4.result'), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item5.action'), result: $tStore('testes.functional.item5.result'), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: $tStore('testes.functional.item6.action'), result: $tStore('testes.functional.item6.result'), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
      ],
    }}
    accessibility={{
      title: $tStore('testes.accessibility.title'),
      cols: {
        criterion: $tNavStore('common.criterion'),
        level: 'WCAG',
        how: $tNavStore('common.howToVerify'),
      },
      items: [
        { criterion: $tStore('testes.accessibility.item1.criterion'), level: $tStore('testes.accessibility.item1.level'), how: $tStore('testes.accessibility.item1.how') },
        { criterion: $tStore('testes.accessibility.item2.criterion'), level: $tStore('testes.accessibility.item2.level'), how: $tStore('testes.accessibility.item2.how') },
        { criterion: $tStore('testes.accessibility.item3.criterion'), level: $tStore('testes.accessibility.item3.level'), how: $tStore('testes.accessibility.item3.how') },
        { criterion: $tStore('testes.accessibility.item4.criterion'), level: $tStore('testes.accessibility.item4.level'), how: $tStore('testes.accessibility.item4.how') },
      ],
    }}
    visual={{
      title: $tStore('testes.visual.title'),
      cols: {
        story: $tNavStore('common.storyState'),
        priority: $tNavStore('common.priority'),
      },
      items: [
        { story: $tStore('testes.visual.item1.story'), priority: localPriority($tStore('testes.visual.item1.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item2.story'), priority: localPriority($tStore('testes.visual.item2.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item3.story'), priority: localPriority($tStore('testes.visual.item3.priority'), $tNavStore) },
        { story: $tStore('testes.visual.item4.story'), priority: localPriority($tStore('testes.visual.item4.priority'), $tNavStore) },
      ],
    }}
  />
</DocsPageLayout>
