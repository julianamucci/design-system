import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createChart } from '@/components/ui/chart';
import { createCard, createCardHeader, createCardTitle, createCardDescription, createCardContent } from '@/components/ui/card';
import uiTranslations from '@/i18n/ui.json';
import chartTranslations from '@shared/content/chart/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
  createDocsCompositions,
  createDocsStates,
  createDocsProps,
  createDocsTokens,
  createDocsAccessibility,
  createDocsRelated,
  createDocsNotes,
  createDocsAnalytics,
  createDocsTestes,
  createDocsPageLayout,
} from '@/components/docs/shared/sections';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(chartTranslations as Record<string, unknown>);

// ─── Shared data ──────────────────────────────────────────────────────────────

const chartData = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function buildBarPreview(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md';
  wrap.appendChild(createChart({ data: chartData, type: 'bar', height: 200 }));
  return wrap;
}

function buildLinePreview(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md';
  wrap.appendChild(createChart({ data: chartData, type: 'line', height: 200 }));
  return wrap;
}

// ─── createChartDocs ──────────────────────────────────────────────────────────

export function createChartDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'chart',
    });
    track('docs_page_view', {
      component_name: 'chart',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(
    subscribe(() => {
      cleanupSeo();
      cleanupSeo = updateSeo();
    }),
  );

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia', labelKey: 'nav.anatomy' },
        { id: 'quando-usar', labelKey: 'nav.usage' },
        { id: 'do-dont', labelKey: 'nav.doDont' },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao', labelKey: 'nav.import' },
        { id: 'variantes', labelKey: 'nav.variants' },
        { id: 'composicoes', labelKey: 'nav.compositions' },
        { id: 'estados', labelKey: 'nav.states' },
        { id: 'propriedades', labelKey: 'nav.props' },
        { id: 'tokens', labelKey: 'nav.tokens' },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados', labelKey: 'nav.related' },
        { id: 'notas', labelKey: 'nav.notes' },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes', labelKey: 'nav.testes' },
      ],
    },
  ];

  function buildNavGroups() {
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups(), componentSlug: 'chart' });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npm install echarts',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao',
    'anatomia',
    'quando-usar',
    'do-dont',
    'importacao',
    'variantes',
    'composicoes',
    'estados',
    'propriedades',
    'tokens',
    'acessibilidade',
    'relacionados',
    'notas',
    'analytics',
    'testes',
  ] as const;
  type SectionId = (typeof sectionOrder)[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => buildBarPreview(),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
            t('anatomy.item4'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5, 6].map((i) => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          uxWriting: {
            title: t('usage.uxWriting.title'),
            cols: {
              element: t('usage.uxWriting.table.element'),
              rules: t('usage.uxWriting.table.rules'),
              do: t('usage.uxWriting.table.correct'),
              dont: t('usage.uxWriting.table.avoid'),
            },
            items: ['axisLabel', 'tooltipValue', 'legendLabel', 'emptyState'].map((key) => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map((i) => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair1.do')),
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-sm';
                wrap.dataset.spacing = 'xs';
                wrap.appendChild(createChart({ data: chartData, type: 'bar', height: 160 }));
                const legend = document.createElement('div');
                legend.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
                legend.dataset.spacing = 'xs';
                const dot = document.createElement('span');
                dot.className = 'nds-rounded-full nds-bg-primary nds-inline-block';
                dot.style.width = '0.5rem';
                dot.style.height = '0.5rem';
                const label = document.createElement('span');
                label.textContent = t('demonstration.labels.bar');
                legend.append(dot, label);
                wrap.appendChild(legend);
                return wrap;
              },
              dontPreviewFactory: () => {
                // Don't: sem legenda, difere séries só por cor
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                wrap.appendChild(
                  createChart({
                    data: chartData,
                    type: 'bar',
                    height: 160,
                  }),
                );
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const chart = createChart({ data: chartData, type: 'bar', height: 160 });
                chart.setAttribute('aria-label', 'Gráfico de barras: acessos mensais');
                wrap.appendChild(chart);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm';
                const chart = createChart({ data: chartData, type: 'bar', height: 160 });
                // No aria-label — inacessível
                wrap.appendChild(chart);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basecoat'),
          code: `import { createChart } from '@/components/ui/chart';`,
          secondaryDescription: t('import.withBuilders'),
          secondaryCode: `// Nortear — uso básico
const el = createChart({
  data: [
    { label: 'Jan', value: 186 },
    { label: 'Feb', value: 305 },
    { label: 'Mar', value: 237 },
  ],
  type: 'bar',   // 'bar' | 'line'
  height: 200,
});
document.body.appendChild(el);`,
        });

      case 'variantes': {
        const codeBar = `const el = createChart({
  data: chartData,
  type: 'bar',
  height: 200,
});`;

        const codeLine = `const el = createChart({
  data: chartData,
  type: 'line',
  height: 200,
});`;

        return createDocsVariants({
          title: t('variants.visualTitle'),
          componentSlug: 'chart',
          items: [
            {
              name: 'bar',
              description: stripHtml(t('variants.items.bar')),
              code: codeBar,
              previewFactory: () => buildBarPreview(),
            },
            {
              name: 'line',
              description: stripHtml(t('variants.items.line')),
              code: codeLine,
              previewFactory: () => buildLinePreview(),
            },
          ],
        });
      }

      case 'composicoes': {
        const codeInCard = `const card = createCard({ className: 'nds-w-full nds-max-w-sm' });

const header = createCardHeader();
header.appendChild(createCardTitle({ text: 'Acessos mensais', level: 3 }));
header.appendChild(createCardDescription({ text: 'Janeiro — Junho' }));

const content = createCardContent();
content.appendChild(createChart({ data: chartData, type: 'bar', height: 200 }));

card.appendChild(header);
card.appendChild(content);`;

        const codeMultiSeries = `const chart = createChart({
  data: chartData,
  type: 'bar',
  height: 200,
});
chart.setAttribute('aria-label', 'Gráfico multi-séries: Desktop e Mobile');

// Legenda manual (Nortear não inclui legenda automática)
const legend = document.createElement('div');
legend.className = 'nds-cluster nds-text-caption nds-text-muted-foreground nds-mt-2';
legend.dataset.spacing = 'md';
legend.innerHTML =
  '<span class="nds-cluster" data-spacing="xs" style="display:inline-flex"><span class="nds-inline-block nds-rounded-sm" style="width:0.75rem;height:0.75rem;background: hsl(var(--chart-1))"></span>Desktop</span>' +
  '<span class="nds-cluster" data-spacing="xs" style="display:inline-flex"><span class="nds-inline-block nds-rounded-sm" style="width:0.75rem;height:0.75rem;background: hsl(var(--chart-2))"></span>Mobile</span>';`;

        const codeSmallInline = `const wrap = document.createElement('div');
wrap.className = 'nds-cluster nds-rounded-md nds-border-default';
wrap.dataset.spacing = 'md';
wrap.style.padding = '1rem';
wrap.style.width = 'fit-content';

const stats = document.createElement('div');
stats.innerHTML =
  '<p class="nds-text-caption nds-text-muted-foreground">Acessos</p>' +
  '<p class="nds-font-semibold" style="font-size:1.5rem;line-height:2rem;">1.224</p>';
wrap.appendChild(stats);

const spark = createChart({ data: chartData, type: 'line', height: 48 });
spark.style.width = '120px';
spark.setAttribute('aria-label', 'Tendência de acessos nos últimos 6 meses');
wrap.appendChild(spark);`;

        const codeEmptyState = `if (data.length === 0) {
  const empty = document.createElement('div');
  empty.setAttribute('role', 'status');
  empty.className =
    'nds-cluster nds-w-full nds-rounded-md nds-text-body nds-text-muted-foreground';
  empty.dataset.justify = 'center';
  empty.style.height = '200px';
  empty.style.alignItems = 'center';
  empty.style.border = '1px dashed var(--border)';
  empty.textContent = 'Nenhum dado disponível para o período selecionado.';
  container.appendChild(empty);
} else {
  container.appendChild(createChart({ data, type: 'bar', height: 200 }));
}`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'chart',
          items: [
            {
              name: stripHtml(t('variants.compositions.inCard.name')),
              description: stripHtml(t('variants.compositions.inCard.description')),
              useWhen: stripHtml(t('variants.compositions.inCard.use')),
              code: codeInCard,
              previewFactory: () => {
                const card = createCard({ className: 'nds-w-full nds-max-w-sm' });
                const header = createCardHeader();
                header.appendChild(createCardTitle({ text: 'Acessos mensais', level: 3 }));
                header.appendChild(createCardDescription({ text: 'Janeiro — Junho' }));
                const content = createCardContent();
                content.appendChild(createChart({ data: chartData, type: 'bar', height: 200 }));
                card.appendChild(header);
                card.appendChild(content);
                return card;
              },
            },
            {
              name: stripHtml(t('variants.compositions.multiSeriesWithLegend.name')),
              description: stripHtml(t('variants.compositions.multiSeriesWithLegend.description')),
              useWhen: stripHtml(t('variants.compositions.multiSeriesWithLegend.use')),
              code: codeMultiSeries,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full nds-max-w-md';
                wrap.dataset.spacing = 'xs';
                const chart = createChart({ data: chartData, type: 'bar', height: 200 });
                chart.setAttribute('aria-label', 'Gráfico multi-séries: Desktop e Mobile');
                wrap.appendChild(chart);
                const legend = document.createElement('div');
                legend.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
                legend.dataset.spacing = 'md';
                const series = [
                  { label: 'Desktop', color: 'hsl(var(--chart-1))' },
                  { label: 'Mobile',  color: 'hsl(var(--chart-2))' },
                ];
                for (const s of series) {
                  const item = document.createElement('span');
                  item.className = 'nds-cluster';
                  item.dataset.spacing = 'xs';
                  item.style.display = 'inline-flex';
                  const dot = document.createElement('span');
                  dot.className = 'nds-inline-block nds-rounded-sm';
                  dot.style.width = '0.75rem';
                  dot.style.height = '0.75rem';
                  dot.style.background = s.color;
                  const lbl = document.createElement('span');
                  lbl.textContent = s.label;
                  item.appendChild(dot);
                  item.appendChild(lbl);
                  legend.appendChild(item);
                }
                wrap.appendChild(legend);
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.compositions.smallInline.name')),
              description: stripHtml(t('variants.compositions.smallInline.description')),
              useWhen: stripHtml(t('variants.compositions.smallInline.use')),
              code: codeSmallInline,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-rounded-md nds-border-default';
wrap.dataset.spacing = 'md';
wrap.style.padding = '1rem';
wrap.style.width = 'fit-content';
                const stats = document.createElement('div');
                const label = document.createElement('p');
                label.className = 'nds-text-caption nds-text-muted-foreground';
                label.textContent = 'Acessos';
                const value = document.createElement('p');
                value.className = 'nds-font-semibold';
                value.style.fontSize = '1.5rem';
                value.style.lineHeight = '2rem';
                value.textContent = '1.224';
                stats.appendChild(label);
                stats.appendChild(value);
                wrap.appendChild(stats);
                const spark = createChart({ data: chartData, type: 'line', height: 48 });
                spark.style.width = '120px';
                spark.setAttribute('aria-label', 'Tendência de acessos nos últimos 6 meses');
                wrap.appendChild(spark);
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.compositions.withEmptyState.name')),
              description: stripHtml(t('variants.compositions.withEmptyState.description')),
              useWhen: stripHtml(t('variants.compositions.withEmptyState.use')),
              code: codeEmptyState,
              previewFactory: () => {
                const empty = document.createElement('div');
                empty.setAttribute('role', 'status');
                empty.className =
                  'nds-cluster nds-w-full nds-max-w-sm nds-rounded-md nds-text-body nds-text-muted-foreground';
                empty.dataset.justify = 'center';
                empty.style.height = '200px';
                empty.style.alignItems = 'center';
                empty.style.border = '1px dashed var(--border)';
                empty.textContent = 'Nenhum dado disponível para o período selecionado.';
                return empty;
              },
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: ['empty', 'loading', 'singleSeries', 'multiSeries'].map((key) => ({
            label: t(`states.${key}.label`),
            trigger: stripHtml(t(`states.${key}.trigger`)),
            behavior: stripHtml(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `// createChart(options)
export type ChartDataPoint = {
  label: string;
  value: number;
};

export type ChartOptions = {
  /** Dados do gráfico. Array de pares label/value. */
  data: ChartDataPoint[];
  /** Tipo do gráfico. Apenas 'bar' e 'line' são suportados no Nortear. */
  type?: 'bar' | 'line';
  /** Altura do SVG em pixels. */
  height?: number;
  /** Array de cores CSS para as séries. */
  colors?: string[];
  /** Classes CSS adicionais no container. */
  class?: string;
};`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.containerTitle'),
              cols: propsCols,
              items: [
                {
                  name: 'data',
                  type: 'ChartDataPoint[]',
                  defaultValue: '—',
                  required: 'Sim',
                  description: stripHtml(t('props.table.children')),
                },
                {
                  name: 'type',
                  type: "'bar' | 'line'",
                  defaultValue: "'bar'",
                  required: 'Não',
                  description: stripHtml(t('props.table.config')),
                },
                {
                  name: 'height',
                  type: 'number',
                  defaultValue: '200',
                  required: 'Não',
                  description: stripHtml(t('props.table.initialDimension')),
                },
                {
                  name: 'colors',
                  type: 'string[]',
                  defaultValue: 'design system colors',
                  required: 'Não',
                  description: stripHtml(t('props.table.colors')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.className')),
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — tokens usados pelo Chart */
:root {
  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
  --primary: 222 47% 11%;
  --secondary: 210 40% 96%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 20% 65%;
  --border: 214 32% 91%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

.dark {
  --chart-1: 220 70% 60%;
  --chart-2: 160 60% 55%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--chart-1', value: 'hsl(var(--chart-1))', description: t('tokens.table.chart1') },
            { token: '--chart-2', value: 'hsl(var(--chart-2))', description: t('tokens.table.chart2') },
            { token: '--chart-3', value: 'hsl(var(--chart-3))', description: t('tokens.table.chart3') },
            { token: '--chart-4', value: 'hsl(var(--chart-4))', description: t('tokens.table.chart4') },
            { token: '--chart-5', value: 'hsl(var(--chart-5))', description: t('tokens.table.chart5') },
            { token: '--primary', value: 'hsl(var(--primary))', description: t('tokens.table.primary') },
            { token: '--secondary', value: 'hsl(var(--secondary))', description: t('tokens.table.secondary') },
            { token: '--muted', value: 'hsl(var(--muted))', description: t('tokens.table.muted') },
            { token: '--muted-foreground', value: 'hsl(var(--muted-foreground))', description: t('tokens.table.mutedForeground') },
            { token: '--border', value: 'hsl(var(--border))', description: t('tokens.table.border') },
            { token: '--background', value: 'hsl(var(--background))', description: t('tokens.table.background') },
            { token: '--foreground', value: 'hsl(var(--foreground))', description: t('tokens.table.foreground') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab', description: t('accessibility.keyboard.tab') },
            { key: 'ArrowRight', description: t('accessibility.keyboard.arrowRight') },
            { key: 'ArrowLeft', description: t('accessibility.keyboard.arrowLeft') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Table', description: t('related.table'), path: '?path=/docs/ui-table--docs' },
            { name: 'Card', description: t('related.card'), path: '?path=/docs/ui-card--docs' },
            { name: 'DataTable', description: t('related.dataTable'), path: '?path=/docs/ui-datatable--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
            { title: '', content: t('notes.tip5') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.pageView'),
              trigger: t('analytics.table.pageViewTrigger'),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: t('analytics.table.sectionViewedTrigger'),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: t('analytics.table.langSwitchTrigger'),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map((i) => ({
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level: 'WCAG',
              how: tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4].map((i) => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: stripHtml(t(`testes.accessibility.item${i}.how`)),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map((i) => ({
              story: stripHtml(t(`testes.visual.item${i}.story`)),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
    }
  }

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ─────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'chart',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    }),
  );

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach((fn) => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
