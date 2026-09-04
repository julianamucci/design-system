<script lang="ts">
  import { untrack } from 'svelte';
  import { ChartContainer, buildBarOption, buildLineOption, buildAreaOption, buildPieOption, buildFunnelOption, buildRadarOption, buildScatterOption, buildPieNestOption } from '@/components/ui/chart';
  import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { createActiveSection } from '@/lib/use-active-section.svelte';
  import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.svelte';
  import {
    DocsHeader, DocsDemonstration, DocsAnatomy, DocsWhenToUse, DocsDoDont,
    DocsImport, DocsCompositions, DocsStates, DocsProps, DocsTokens,
    DocsAccessibility, DocsRelated, DocsNotes, DocsAnalytics, DocsTestes,
  } from '@/components/docs/shared/sections';
  import uiTranslations from '@/i18n/ui.json';
  import chartTranslations from '@shared/content/chart/translations.json';
  import { stripHtml, toPlainText } from '@/lib/strip-html';

  const { tStore: tNavStore } = useTranslation(uiTranslations);
  const { tStore } = useTranslation(chartTranslations);

  // As chaves de `accessibility.screenReader` variam por componente, então só os
  // valores chegam ao container — o `t()` exige nome de chave e não serviria.
  const screenReaderItems = $derived(
    Object.values(
      (chartTranslations as unknown as Record<
        string,
        { accessibility?: { screenReader?: Record<string, string> } }
      >)[$locale]?.accessibility?.screenReader ?? {},
    ),
  );

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

  const sectionIds = untrack(() => NAV_GROUPS.flatMap(g => g.sections.map(s => s.id)));
  const section = createActiveSection(sectionIds, (id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'chart', locale: $locale });
  });
  $effect(() => section.attach());

  // ─── Helpers ─────────────────────────────────────────────────────────────────

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
  // Etapas de um processo, da entrada à saída. A ordem é o percurso, não o
  // valor: é a primeira etapa que serve de referência à coluna de participação.
  const funnelStages = [
    { label: 'Visitas',   value: 1000 },
    { label: 'Cadastros', value: 620 },
    { label: 'Carrinho',  value: 260 },
    { label: 'Compra',    value: 90 },
  ];
  // Cinco grandezas do mesmo item, cada uma com o SEU teto. Os tetos diferentes
  // são o exemplo, não um detalhe: é por eles que a tabela do radar traz uma
  // coluna de máximo — sem ela, o 9 de um eixo que vai a 10 e o 96 de um que vai
  // a 100 sairiam como dois números soltos.
  const radarAxes = [
    { label: 'Desempenho',     max: 100 },
    { label: 'Acessibilidade', max: 100 },
    { label: 'Boas práticas',  max: 10  },
    { label: 'SEO',            max: 100 },
    { label: 'Conteúdo',       max: 5   },
  ];

  const radarSeries = [
    { name: 'Antes',  data: [72, 64, 6, 88, 2] },
    { name: 'Depois', data: [94, 97, 9, 96, 4] },
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
  buildFunnelOption,
  buildRadarOption,
} from '@/components/ui/chart';`;

  const codeBar = `<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
  class="nds-w-full" height={240}
  aria-label="Gráfico de barras: acessos mensais"
/>`;

  const codeLine = `<ChartContainer
  option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
  class="nds-w-full" height={240}
  aria-label="Gráfico de linhas: tendência mensal"
/>`;

  const codeArea = `<ChartContainer
  option={buildAreaOption({ xAxis: xMonths, series: multiSeries })}
  class="nds-w-full" height={240}
  aria-label="Gráfico de área: volume mensal"
/>`;

  const codePie = `<ChartContainer
  option={buildPieOption({ data: pieData })}
  class="nds-w-full" height={280}
  aria-label="Gráfico de pizza: distribuição por dispositivo"
/>`;

  const codeFunnel = `<ChartContainer
  option={buildFunnelOption({ data: funnelStages })}
  class="nds-w-full" height={220}
  shareLabel="Participação"
  aria-label="Funil de conversão: visitas, cadastros, carrinho e compra"
/>`;

  // O radar recebe duas listas: os EIXOS (nome mais teto) e as séries com os
  // valores na ordem deles. Os rótulos das duas primeiras colunas da tabela
  // entram escritos porque aqui a primeira não nomeia uma categoria qualquer —
  // nomeia o eixo, e a segunda traz o teto dele.
  // O agrupamento vem PRONTO de `docs/shared/primitives`, gerado uma vez por
  // `scripts/gerar-agrupamento-scatter.mjs`: k-means sorteia o início, e
  // rodá-lo aqui faria o desenho mudar sozinho entre visitas — a partição se
  // repete de 92 a 98 vezes em 100 — enquanto a tabela, que sai de função
  // pura, descreveria outro agrupamento.
  const scatterSeries = CHART_SCATTER_CLUSTERS.map((c) => ({ name: c.name, points: c.points }));

  // Cada ponto declara o GRUPO a que pertence, e o anel de dentro sai da soma —
  // não se declara. Declarar os dois abriria a porta para eles discordarem, e o
  // desenho mentiria sem nada acusar.
  const nestData = [
  { label: 'Orgânica',  value: 300, group: 'Busca'  },
  { label: 'Paga',      value: 100, group: 'Busca'  },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn',  value: 150, group: 'Social' },
  { label: 'App',       value: 250, group: 'Direto' },
  ];

  const codeNest = `const canais = [
  { label: 'Orgânica',  value: 300, group: 'Busca'  },
  { label: 'Paga',      value: 100, group: 'Busca'  },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn',  value: 150, group: 'Social' },
  { label: 'App',       value: 250, group: 'Direto' },
];

<ChartContainer
  option={buildPieNestOption({ data: canais })}
  groupLabel="Canal"
  categoryLabel="Origem"
  aria-label="Sessões por canal e origem, em dois anéis"
/>`;

  const codeScatter = `const sessoes = [
  { name: 'Grupo 1', points: [[1.5, 1.1], [1.9, 1.8], [3, 1.6]] },
  { name: 'Grupo 2', points: [[7, 4.1], [8, 4.8], [9, 3.8]] },
  { name: 'Grupo 3', points: [[12.7, 2.4], [13.4, 2.7], [14.9, 1.9]] },
];

<ChartContainer
  option={buildScatterOption({
    series: sessoes,
    xLabel: 'Minutos na página',
    yLabel: 'Páginas vistas',
  })}
  seriesLabel="Grupo"
  aria-label="Dispersão de sessões de leitura, em três grupos"
/>`;

  const codeRadar = `const eixos = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
];

const medicoes = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
];

<ChartContainer
  option={buildRadarOption({ axes: eixos, series: medicoes })}
  class="nds-w-full" height={280}
  categoryLabel="Eixo"
  maxLabel="Máximo"
  aria-label="Radar de qualidade: cinco grandezas, antes e depois"
/>`;

  const codeMulti = `<ChartContainer
  option={buildBarOption({ xAxis: xMonths, series: multiSeries, title: 'Vendas' })}
  class="nds-w-full" height={280}
  aria-label="Gráfico multi-séries: Vendas por categoria"
/>`;

  const interfaceCode = `// ChartContainer (Svelte 5)
interface ChartContainerProps {
  option: EChartsCoreOption;
  class?: string;
  renderer?: 'svg' | 'canvas';
  /** Altura do container em px. Sem valor, vale o piso de .nds-chart. */
  height?: number;
  /** Frase no lugar do desenho quando nenhuma série tem dado. */
  emptyLabel?: string;
  'aria-label'?: string;
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
declare function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;
declare function buildFunnelOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption;

// O radar recebe os EIXOS (nome mais teto) além das séries: o teto é a única
// informação dele que não está em nenhum outro lugar, e é o que a coluna de
// máximo da tabela escreve.
export interface ChartRadarAxis { label: string; max: number }

declare function buildRadarOption(o: {
  axes: ChartRadarAxis[];
  series: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}): EChartsCoreOption;`;

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
    <div class="nds-stack nds-w-full" data-spacing="md" style="align-items: center">
      <div class="nds-cluster" data-spacing="sm">
        <button
          type="button"
          onclick={() => demoType = 'bar'}
          class="nds-rounded-md nds-text-body nds-font-medium nds-py-1 nds-px-4"
          style="transition: background-color .15s, color .15s"
          class:nds-bg-primary={demoType === 'bar'}
          class:nds-text-primary-foreground={demoType === 'bar'}
          class:nds-bg-muted={demoType !== 'bar'}
          class:nds-text-muted-foreground={demoType !== 'bar'}
        >
          {$tStore('demonstration.labels.bar')}
        </button>
        <button
          type="button"
          onclick={() => demoType = 'line'}
          class="nds-rounded-md nds-text-body nds-font-medium nds-py-1 nds-px-4"
          style="transition: background-color .15s, color .15s"
          class:nds-bg-primary={demoType === 'line'}
          class:nds-text-primary-foreground={demoType === 'line'}
          class:nds-bg-muted={demoType !== 'line'}
          class:nds-text-muted-foreground={demoType !== 'line'}
        >
          {$tStore('demonstration.labels.line')}
        </button>
      </div>
      <ChartContainer
        option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
        class="nds-w-full"
        height={220} style="max-width: 400px"
        aria-label={$tStore('demonstration.labels.chartTitle')}
       />
    </div>
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
    structureCode={$tStore('anatomy.structureCode')}
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
        doCaption: toPlainText($tStore('doDont.pair1.do')),
        dontCaption: toPlainText($tStore('doDont.pair1.dont')),
        doPreview: doPair1,
        dontPreview: dontPair1,
      },
      {
        doLabel: $tNavStore('common.do'),
        dontLabel: $tNavStore('common.dont'),
        doCaption: toPlainText($tStore('doDont.pair2.do')),
        dontCaption: toPlainText($tStore('doDont.pair2.dont')),
        doPreview: doPair2,
        dontPreview: dontPair2,
      },
    ]}
  />

  {#snippet doPair1()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="nds-w-full" height={140}
      aria-label="Gráfico multi-séries com legenda: Desktop e Mobile"
     />
  {/snippet}
  {#snippet dontPair1()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="nds-w-full" height={140}
      aria-label="Gráfico multi-séries sem legenda"
     />
  {/snippet}
  {#snippet doPair2()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="nds-w-full" height={140}
      aria-label="Gráfico de barras: acessos mensais por dispositivo — com aria-label descritivo"
     />
  {/snippet}
  {#snippet dontPair2()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      class="nds-w-full" height={140}
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
  <DocsCompositions
    id="variantes"
    title={$tStore('variants.title')}
    note={$tStore('variants.note')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="chart"
    items={[
      { name: 'Bar',   description: stripHtml($tStore('variants.items.bar')),  code: codeBar,  preview: variantBar  },
      { name: 'Linha', description: stripHtml($tStore('variants.items.line')), code: codeLine, preview: variantLine },
      { name: 'Area',  description: stripHtml($tStore('variants.items.area')), code: codeArea, preview: variantArea },
      { name: 'Pie',   description: stripHtml($tStore('variants.items.pie')),  code: codePie,  preview: variantPie  },
      { name: 'Funil', description: stripHtml($tStore('variants.items.funnel')), code: codeFunnel, preview: variantFunnel },
      { name: 'Radar', description: stripHtml($tStore('variants.items.radar')), code: codeRadar, preview: variantRadar },
      { name: 'Dispersão', description: stripHtml($tStore('variants.items.scatter')), code: codeScatter, preview: variantScatter },
      { name: 'Rosca aninhada', description: stripHtml($tStore('variants.items.pieNest')), code: codeNest, preview: variantNest },
      {
        trackId: 'smallInline',
        name: $tStore('variants.items.smallInline.name'),
        description: $tStore('variants.items.smallInline.description'),
        useWhen: $tStore('variants.items.smallInline.use'),
        code: `<div class="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-spacing="md" style="width: fit-content">
  <div>
    <p class="nds-text-caption nds-text-muted-foreground">Acessos</p>
    <p class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem">1.224</p>
  </div>
  <ChartContainer option={buildLineOption({ xAxis: xMonths, series: multiSeries })} height={48} style="width: 120px" aria-label="Tendência de acessos" />
</div>`,
        preview: variantSmallInline,
      },
    ]}
  />

  {#snippet variantBar()}
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      height={180} style="width: 300px"
      aria-label="Gráfico de barras: acessos mensais"
    />
  {/snippet}
  {#snippet variantLine()}
    <ChartContainer
      option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
      height={180} style="width: 300px"
      aria-label="Gráfico de linhas: acessos mensais"
    />
  {/snippet}
  {#snippet variantArea()}
    <ChartContainer
      option={buildAreaOption({ xAxis: xMonths, series: multiSeries })}
      height={180} style="width: 300px"
      aria-label="Gráfico de área: volume mensal"
    />
  {/snippet}
  {#snippet variantPie()}
    <ChartContainer
      option={buildPieOption({ data: pieData })}
      height={200} style="width: 220px"
      aria-label="Gráfico de pizza: distribuição por dispositivo"
    />
  {/snippet}
  {#snippet variantFunnel()}
    <!-- Sem largura cravada em `style`: a caixa fica por conta da grade da
         seção, e os rótulos das colunas vêm do conteúdo compartilhado, para
         acompanhar o idioma da página. A primeira coluna não é uma categoria
         qualquer: é a ETAPA do processo, e é esse o nome que a pessoa lê. -->
    <ChartContainer
      option={buildFunnelOption({ data: funnelStages })}
      height={220} class="nds-w-full"
      categoryLabel={stripHtml($tStore('demonstration.labels.funnelStage'))}
      shareLabel={stripHtml($tStore('demonstration.labels.funnelShare'))}
      aria-label="Funil de conversão: visitas, cadastros, carrinho e compra"
    />
  {/snippet}
  {#snippet variantRadar()}
    <!-- No radar a primeira coluna da tabela não nomeia uma categoria: nomeia o
         EIXO, e a segunda traz o teto dele. Os dois títulos vêm do conteúdo
         compartilhado para acompanharem o idioma da página. -->
    <ChartContainer
      option={buildRadarOption({ axes: radarAxes, series: radarSeries })}
      height={280} class="nds-w-full"
      categoryLabel={stripHtml($tStore('demonstration.labels.radarAxis'))}
      maxLabel={stripHtml($tStore('demonstration.labels.radarMax'))}
      aria-label="Radar de qualidade do site: cinco grandezas, antes e depois da revisão"
    />
  {/snippet}
  {#snippet variantNest()}
    <!-- A primeira coluna da tabela nomeia o GRUPO e a segunda a parte; os dois
         títulos vêm do conteúdo compartilhado para acompanharem o idioma. -->
    <ChartContainer
      option={buildPieNestOption({ data: nestData })}
      height={280} class="nds-w-full"
      groupLabel={stripHtml($tStore('demonstration.labels.nestGroup'))}
      categoryLabel={stripHtml($tStore('demonstration.labels.nestPart'))}
      aria-label="Sessões por canal e origem: três canais abertos em suas origens, em dois anéis"
    />
  {/snippet}
  {#snippet variantScatter()}
    <!-- A primeira coluna da tabela nomeia o GRUPO, e as duas de número nomeiam
         as GRANDEZAS que o desenho põe nos eixos — sem elas a tabela diria onde
         o ponto está e não o que ele mede. -->
    <ChartContainer
      option={buildScatterOption({
        series: scatterSeries,
        xLabel: stripHtml($tStore('demonstration.labels.scatterX')),
        yLabel: stripHtml($tStore('demonstration.labels.scatterY')),
      })}
      height={280} class="nds-w-full"
      seriesLabel={stripHtml($tStore('demonstration.labels.scatterSeries'))}
      aria-label="Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos"
    />
  {/snippet}
  {#snippet variantSmallInline()}
    <div class="nds-cluster nds-rounded-md nds-border-default nds-p-4" data-spacing="md" style="width: fit-content">
      <div>
        <p class="nds-text-caption nds-text-muted-foreground">Acessos</p>
        <p class="nds-font-semibold" style="font-size: 1.5rem; line-height: 2rem">1.224</p>
      </div>
      <ChartContainer
        option={buildLineOption({ xAxis: xMonths, series: multiSeries })}
        height={48} style="width: 120px"
        aria-label="Tendência de acessos nos últimos 6 meses"
       />
    </div>
  {/snippet}

  <!-- ── Composições ──────────────────────────────────────────────── -->
  <DocsCompositions
    title={$tStore('variants.compositionsTitle')}
    useWhenLabel={$tNavStore('common.useWhen')}
    componentSlug="chart"
    items={[
      {
        trackId: 'inCard',
        name: $tStore('variants.compositions.inCard.name'),
        description: $tStore('variants.compositions.inCard.description'),
        useWhen: $tStore('variants.compositions.inCard.use'),
        code: `<Card class="nds-w-full nds-max-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer option={buildBarOption({ xAxis: xMonths, series: multiSeries })} class="nds-w-full" height={200} aria-label="..." />
  </CardContent>
</Card>`,
        preview: compInCard,
      },
    ]}
  />

  {#snippet compInCard()}
    <Card class="nds-w-full nds-max-w-sm">
      <CardHeader>
        <CardTitle>Acessos mensais</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
          class="nds-w-full" height={180}
          aria-label="Gráfico de barras: acessos mensais"
         />
      </CardContent>
    </Card>
  {/snippet}

  <!-- ── Estados ───────────────────────────────────────────────── -->
  <DocsStates
    title={$tStore('states.title')}
    cols={{
      state: $tStore('states.cols.state'),
      trigger: toPlainText($tStore('states.cols.trigger')),
      behavior: toPlainText($tStore('states.cols.behavior')),
    }}
    items={[
      { label: $tStore('states.empty.label'),        trigger: toPlainText($tStore('states.empty.trigger')),        behavior: toPlainText($tStore('states.empty.behavior'))},
      { label: $tStore('states.loading.label'),      trigger: toPlainText($tStore('states.loading.trigger')),      behavior: toPlainText($tStore('states.loading.behavior'))      },
      { label: $tStore('states.singleSeries.label'), trigger: toPlainText($tStore('states.singleSeries.trigger')), behavior: toPlainText($tStore('states.singleSeries.behavior')) },
      { label: $tStore('states.multiSeries.label'),  trigger: toPlainText($tStore('states.multiSeries.trigger')),  behavior: toPlainText($tStore('states.multiSeries.behavior'))  },
      { label: $tStore('states.withEmptyState.label'),        trigger: toPlainText($tStore('states.withEmptyState.trigger')),        behavior: toPlainText($tStore('states.withEmptyState.behavior'))        },
      { label: $tStore('states.multiSeriesWithLegend.label'), trigger: toPlainText($tStore('states.multiSeriesWithLegend.trigger')), behavior: toPlainText($tStore('states.multiSeriesWithLegend.behavior')) },
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
          { name: 'option',     type: 'EChartsCoreOption', defaultValue: '—',     required: 'Sim', description: toPlainText($tStore('props.table.option'))    },
          { name: 'renderer',   type: '"svg" | "canvas"',  defaultValue: '"svg"', required: 'Não', description: toPlainText($tStore('props.table.renderer'))  },
          { name: 'height',     type: 'number',            defaultValue: '—',     required: 'Não', description: toPlainText($tStore('props.table.height'))     },
          { name: 'emptyLabel', type: 'string',            defaultValue: '"Sem dados para exibir"', required: 'Não', description: toPlainText($tStore('props.table.emptyLabel')) },
          { name: 'class',      type: 'string',            defaultValue: '—',     required: 'Não', description: toPlainText($tStore('props.table.className')) },
          { name: 'aria-label', type: 'string',            defaultValue: '"Gráfico"', required: 'Sim', description: toPlainText($tStore('props.table.ariaLabel')) },
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
          { name: 'buildBarOption | buildLineOption | buildAreaOption | buildPieOption | buildFunnelOption | buildRadarOption', type: '(o: OptionsBase) => EChartsCoreOption', defaultValue: '—', required: 'Sim', description: toPlainText($tStore('props.table.chartType')) },
          { name: 'data',       type: '{ label: string; value: number }[]',           defaultValue: '—',    required: 'Não', description: toPlainText($tStore('props.table.data'))       },
          { name: 'xAxis',      type: '(string | number)[]',                          defaultValue: '—',    required: 'Não', description: toPlainText($tStore('props.table.xAxis'))      },
          { name: 'series',     type: '{ name: string; data: number[]; color?: string }[]', defaultValue: '—', required: 'Não', description: toPlainText($tStore('props.table.series')) },
          { name: 'title',      type: 'string',                                       defaultValue: '—',    required: 'Não', description: toPlainText($tStore('props.table.title'))      },
          { name: 'showLegend', type: 'boolean',                                      defaultValue: 'auto', required: 'Não', description: toPlainText($tStore('props.table.showLegend')) },
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
      { token: '--chart-6',          value: 'color série 6',  description: $tStore('tokens.table.chart6')         },
      { token: '--chart-7',          value: 'color série 7',  description: $tStore('tokens.table.chart7')         },
      { token: '--chart-8',          value: 'color série 8',  description: $tStore('tokens.table.chart8')         },
      { token: '--primary',          value: 'axisPointer',    description: toPlainText($tStore('tokens.table.primary')) },
      { token: '--muted-foreground', value: 'axisLabel',      description: $tStore('tokens.table.mutedForeground') },
      { token: '--border',           value: 'axisLine + grid', description: $tStore('tokens.table.border')        },
      { token: '--background',       value: 'aria.decal',     description: $tStore('tokens.table.background')     },
      { token: '--foreground',       value: 'title + tooltip', description: $tStore('tokens.table.foreground')    },
      { token: '--card',             value: 'tooltip bg',     description: $tStore('tokens.table.card')           },
    ]}
    customizationTitle={$tStore('tokens.customizationTitle')}
    customizationCode={codeTokens}
  />

  <!-- ── Acessibilidade ─────────────────────────────────────────── -->
  <DocsAccessibility
    screenReaderTitle={$tNavStore('common.screenReader')}
    screenReaderItems={screenReaderItems}
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
      { key: 'Tab',         description: toPlainText($tStore('accessibility.keyboard.tab'))        },
      { key: 'Arrow Right', description: toPlainText($tStore('accessibility.keyboard.arrowRight')) },
      { key: 'Arrow Left',  description: toPlainText($tStore('accessibility.keyboard.arrowLeft'))  },
    ]}
  />

  <!-- ── Relacionados ───────────────────────────────────────────── -->
  <DocsRelated
    title={$tStore('related.title')}
    items={[
      { name: 'Table',     description: $tStore('related.table'),     path: '?path=/docs/components-tables-table--docs'     },
      { name: 'Card',      description: $tStore('related.card'),      path: '?path=/docs/components-layout-card--docs'      },
      { name: 'DataTable', description: $tStore('related.dataTable'), path: '?path=/docs/components-tables-datatable--docs' },
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
      trigger: toPlainText($tStore('analytics.table.trigger')),
      payload: $tStore('analytics.table.payload'),
    }}
    items={[
      { event: $tStore('analytics.table.pageView'),      trigger: toPlainText($tStore('analytics.table.pageViewTrigger')),      payload: $tStore('analytics.table.pageViewPayload')      },
      { event: $tStore('analytics.table.sectionViewed'), trigger: toPlainText($tStore('analytics.table.sectionViewedTrigger')), payload: $tStore('analytics.table.sectionViewedPayload') },
      { event: $tStore('analytics.table.langSwitch'),    trigger: toPlainText($tStore('analytics.table.langSwitchTrigger')),    payload: $tStore('analytics.table.langSwitchPayload')    },
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
        { action: toPlainText($tStore('testes.functional.item1.action')), result: toPlainText($tStore('testes.functional.item1.result')), priority: localPriority($tStore('testes.functional.item1.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item2.action')), result: toPlainText($tStore('testes.functional.item2.result')), priority: localPriority($tStore('testes.functional.item2.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item3.action')), result: toPlainText($tStore('testes.functional.item3.result')), priority: localPriority($tStore('testes.functional.item3.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item4.action')), result: toPlainText($tStore('testes.functional.item4.result')), priority: localPriority($tStore('testes.functional.item4.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item5.action')), result: toPlainText($tStore('testes.functional.item5.result')), priority: localPriority($tStore('testes.functional.item5.priority'), $tNavStore) },
        { action: toPlainText($tStore('testes.functional.item6.action')), result: toPlainText($tStore('testes.functional.item6.result')), priority: localPriority($tStore('testes.functional.item6.priority'), $tNavStore) },
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
