<script lang="ts">
  import { BarChart, LineChart } from 'layerchart';
  import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { sanitizeHtml } from '@/lib/sanitize-html';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsVariants, DocsStates, DocsProps, DocsTokens,
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

  let activeSection = $state('demonstracao');

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
        { id: 'importacao',   label: tNav('nav.import')   },
        { id: 'variantes',    label: tNav('nav.variants') },
        { id: 'estados',      label: tNav('nav.states')   },
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

  $effect(() => {
    const ids = NAV_GROUPS.flatMap((g) => g.sections.map((s) => s.id));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection = entry.target.id;
          track('docs_section_viewed', { section_id: entry.target.id, component_name: 'chart', locale: $locale });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  });

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

  const singleConfig: ChartConfig = {
    value: { label: 'Acessos', color: 'var(--chart-1)' },
  };

  const multiConfig: ChartConfig = {
    value:  { label: 'Desktop', color: 'var(--chart-1)' },
    value2: { label: 'Mobile',  color: 'var(--chart-2)' },
  };

  // ─── Demo state ──────────────────────────────────────────────────────────────
  type DemoType = 'bar' | 'line';
  let demoType = $state<DemoType>('bar');

  // ─── Code strings ────────────────────────────────────────────────────────────

  const codeImportBasic = `import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, LineChart } from 'layerchart';`;

  const codeBar = `<ChartContainer config={chartConfig} aria-label="Gráfico de barras: acessos mensais">
  <BarChart
    {data}
    x="month"
    y="value"
    series={[{ key: 'value', value: (d) => d.value, color: 'var(--color-value)' }]}
    bandPadding={0.3}
  >
    <ChartTooltip />
  </BarChart>
</ChartContainer>`;

  const codeLine = `<ChartContainer config={chartConfig} aria-label="Gráfico de linhas: acessos mensais">
  <LineChart
    {data}
    x="month"
    y="value"
    series={[{ key: 'value', value: (d) => d.value, color: 'var(--color-value)' }]}
  >
    <ChartTooltip />
  </LineChart>
</ChartContainer>`;

  const codeMulti = `const chartConfig = {
  value:  { label: 'Desktop', color: 'var(--chart-1)' },
  value2: { label: 'Mobile',  color: 'var(--chart-2)' },
};

<ChartContainer config={chartConfig} aria-label="Gráfico multi-séries">
  <BarChart
    {data}
    x="month"
    y="value"
    series={[
      { key: 'value',  value: (d) => d.value,  color: 'var(--color-value)'  },
      { key: 'value2', value: (d) => d.value2, color: 'var(--color-value2)' },
    ]}
    seriesLayout="group"
    bandPadding={0.3}
  >
    <ChartTooltip />
  </BarChart>
</ChartContainer>`;

  const interfaceCode = `// ChartContainer
interface ChartContainerProps {
  config: ChartConfig;
  id?: string;
  class?: string;
  children?: Snippet;
}

// ChartConfig
type ChartConfig = Record<string, {
  label?: string;
  icon?: Component;
  color?: string;    // OU
  theme?: Record<'light' | 'dark', string>;
}>;

// ChartTooltip (chip de layerchart)
// Sem props obrigatórias — consome contexto do ChartContainer`;

  const codeTokens = `/* Em globals.css — personalizar as cores das séries */
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}`;
</script>

<DocsPageLayout navGroups={NAV_GROUPS} {activeSection} componentSlug="chart">
  {#snippet header()}
    <DocsHeader
      title={$tStore('title')}
      description={$tStore('description')}
      category={$tStore('category')}
      type={$tStore('type')}
      installNote="Svelte: layerchart + ChartContainer customizado"
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
          config={singleConfig}
          class="h-[220px] w-full max-w-[400px]"
          aria-label={$tStore('demonstration.labels.chartTitle')}
        >
          {#if demoType === 'bar'}
            <BarChart
              data={monthlyData}
              x="month"
              y="value"
              series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: $tStore('demonstration.labels.tooltipLabel') }]}
              bandPadding={0.3}
            >
              <ChartTooltip />
            </BarChart>
          {:else}
            <LineChart
              data={monthlyData}
              x="month"
              y="value"
              series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: $tStore('demonstration.labels.tooltipLabel') }]}
            >
              <ChartTooltip />
            </LineChart>
          {/if}
        </ChartContainer>
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
    structureCode={`<ChartContainer config={chartConfig} aria-label="...">\n  <BarChart {data} x="month" y="value" series={[...]}>\n    <ChartTooltip />\n  </BarChart>\n</ChartContainer>`}
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
      config={multiConfig}
      class="h-[140px] w-full"
      aria-label="Gráfico multi-séries com legenda: Desktop e Mobile"
    >
      <BarChart
        data={multiSeriesData}
        x="month"
        y="value"
        series={[
          { key: 'value',  value: (d: any) => d.value,  color: 'var(--color-value)',  label: 'Desktop' },
          { key: 'value2', value: (d: any) => d.value2, color: 'var(--color-value2)', label: 'Mobile'  },
        ]}
        seriesLayout="group"
        bandPadding={0.3}
      >
        <ChartTooltip />
      </BarChart>
    </ChartContainer>
  {/snippet}
  {#snippet dontPair1()}
    <ChartContainer
      config={multiConfig}
      class="h-[140px] w-full"
      aria-label="Gráfico multi-séries sem legenda"
    >
      <BarChart
        data={multiSeriesData}
        x="month"
        y="value"
        series={[
          { key: 'value',  value: (d: any) => d.value,  color: 'var(--color-value)'  },
          { key: 'value2', value: (d: any) => d.value2, color: 'var(--color-value2)' },
        ]}
        seriesLayout="group"
        bandPadding={0.3}
      />
    </ChartContainer>
  {/snippet}
  {#snippet doPair2()}
    <ChartContainer
      config={singleConfig}
      class="h-[140px] w-full"
      aria-label="Gráfico de barras: acessos mensais por dispositivo — com aria-label descritivo"
    >
      <BarChart
        data={monthlyData}
        x="month"
        y="value"
        series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: 'Acessos' }]}
        bandPadding={0.3}
      >
        <ChartTooltip />
      </BarChart>
    </ChartContainer>
  {/snippet}
  {#snippet dontPair2()}
    <ChartContainer
      config={singleConfig}
      class="h-[140px] w-full"
    >
      <BarChart
        data={monthlyData}
        x="month"
        y="value"
        series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)' }]}
        bandPadding={0.3}
      />
    </ChartContainer>
  {/snippet}

  <!-- ── Importação ─────────────────────────────────────────────── -->
  <DocsImport
    title={$tStore('import.title')}
    description={$tStore('import.basic')}
    code={codeImportBasic}
  />

  <!-- ── Variantes ──────────────────────────────────────────────── -->
  <DocsVariants
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    items={[
      { name: 'Bar',   description: stripHtml($tStore('variants.items.bar')),   code: codeBar,   preview: variantBar   },
      { name: 'Linha', description: stripHtml($tStore('variants.items.line')),  code: codeLine,  preview: variantLine  },
      { name: 'Multi', description: stripHtml($tStore('variants.items.bar')),   code: codeMulti, preview: variantMulti },
    ]}
  />

  {#snippet variantBar()}
    <ChartContainer
      config={singleConfig}
      class="h-[180px] w-[300px]"
      aria-label="Gráfico de barras: acessos mensais"
    >
      <BarChart
        data={monthlyData}
        x="month"
        y="value"
        series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: 'Acessos' }]}
        bandPadding={0.3}
      >
        <ChartTooltip />
      </BarChart>
    </ChartContainer>
  {/snippet}
  {#snippet variantLine()}
    <ChartContainer
      config={singleConfig}
      class="h-[180px] w-[300px]"
      aria-label="Gráfico de linhas: acessos mensais"
    >
      <LineChart
        data={monthlyData}
        x="month"
        y="value"
        series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: 'Acessos' }]}
      >
        <ChartTooltip />
      </LineChart>
    </ChartContainer>
  {/snippet}
  {#snippet variantMulti()}
    <ChartContainer
      config={multiConfig}
      class="h-[180px] w-[320px]"
      aria-label="Gráfico multi-séries: Desktop e Mobile"
    >
      <BarChart
        data={multiSeriesData}
        x="month"
        y="value"
        series={[
          { key: 'value',  value: (d: any) => d.value,  color: 'var(--color-value)',  label: 'Desktop' },
          { key: 'value2', value: (d: any) => d.value2, color: 'var(--color-value2)', label: 'Mobile'  },
        ]}
        seriesLayout="group"
        bandPadding={0.3}
      >
        <ChartTooltip />
      </BarChart>
    </ChartContainer>
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
          { name: 'config',   type: 'ChartConfig',  defaultValue: '—',   required: 'Sim', description: stripHtml($tStore('props.table.config'))   },
          { name: 'id',       type: 'string',        defaultValue: 'auto', required: 'Não', description: stripHtml($tStore('props.table.id'))       },
          { name: 'class',    type: 'string',        defaultValue: '—',   required: 'Não', description: stripHtml($tStore('props.table.className')) },
          { name: 'children', type: 'Snippet',       defaultValue: '—',   required: 'Sim', description: $tStore('props.table.children')            },
        ],
      },
      {
        title: $tStore('props.tooltipTitle'),
        cols: {
          prop: $tStore('props.table.prop'),
          type: $tStore('props.table.type'),
          default: $tStore('props.table.default'),
          required: $tStore('props.table.required'),
          description: $tStore('props.table.description'),
        },
        items: [
          { name: 'indicator',      type: '"dot" | "line" | "dashed"', defaultValue: '"dot"',  required: 'Não', description: stripHtml($tStore('props.table.indicator'))      },
          { name: 'hideLabel',      type: 'boolean',                   defaultValue: 'false',  required: 'Não', description: $tStore('props.table.hideLabel')                 },
          { name: 'hideIndicator',  type: 'boolean',                   defaultValue: 'false',  required: 'Não', description: $tStore('props.table.hideIndicator')             },
          { name: 'nameKey',        type: 'string',                    defaultValue: '—',      required: 'Não', description: stripHtml($tStore('props.table.nameKey'))        },
          { name: 'labelKey',       type: 'string',                    defaultValue: '—',      required: 'Não', description: $tStore('props.table.labelKey')                  },
          { name: 'formatter',      type: 'Snippet',                   defaultValue: '—',      required: 'Não', description: $tStore('props.table.formatter')                 },
          { name: 'labelFormatter', type: 'function | null',           defaultValue: '—',      required: 'Não', description: $tStore('props.table.labelFormatter')            },
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
      { token: '--chart-1',          value: 'var(--color-[key])',        description: $tStore('tokens.table.chart1')         },
      { token: '--chart-2',          value: 'var(--color-[key])',        description: $tStore('tokens.table.chart2')         },
      { token: '--chart-3',          value: 'var(--color-[key])',        description: $tStore('tokens.table.chart3')         },
      { token: '--chart-4',          value: 'var(--color-[key])',        description: $tStore('tokens.table.chart4')         },
      { token: '--chart-5',          value: 'var(--color-[key])',        description: $tStore('tokens.table.chart5')         },
      { token: '--primary',          value: 'var(--primary)',            description: $tStore('tokens.table.primary')        },
      { token: '--muted',            value: 'bg-muted',                  description: $tStore('tokens.table.muted')          },
      { token: '--muted-foreground', value: 'text-muted-foreground',     description: $tStore('tokens.table.mutedForeground') },
      { token: '--border',           value: 'border-border',             description: $tStore('tokens.table.border')         },
      { token: '--background',       value: 'bg-background',             description: $tStore('tokens.table.background')     },
      { token: '--foreground',       value: 'text-foreground',           description: $tStore('tokens.table.foreground')     },
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
