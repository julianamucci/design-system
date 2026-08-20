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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (chartTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
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

const multiSeries = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// Cada preview leva a SUA descrição: a opção `'aria-label'` vira o `role="img"`
// e o atributo do container dentro da própria factory. Antes disso cada preview colava os
// dois atributos à mão — e os que esqueciam ficavam mudos para o leitor de tela.
function buildBarPreview(): HTMLElement {
  return createChart({
    data: chartData,
    type: 'bar',
    height: 200,
    class: 'nds-w-full nds-max-w-md',
    'aria-label': 'Gráfico de barras: acessos mensais de janeiro a junho',
  });
}

function buildLinePreview(): HTMLElement {
  return createChart({
    data: chartData,
    type: 'line',
    height: 200,
    class: 'nds-w-full nds-max-w-md',
    'aria-label': 'Gráfico de linhas: tendência dos acessos de janeiro a junho',
  });
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Do: com mais de uma série a legenda aparece sozinha, e o rótulo
              // nomeia as duas.
              doPreviewFactory: () => createChart({
                xAxis: chartData.map((d) => d.label),
                series: multiSeries,
                type: 'bar',
                height: 160,
                class: 'nds-w-full nds-max-w-sm',
                'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
              }),
              // Don't: as mesmas duas séries, mas com a legenda desligada — só a
              // cor separa uma da outra.
              dontPreviewFactory: () => createChart({
                xAxis: chartData.map((d) => d.label),
                series: multiSeries,
                type: 'bar',
                height: 160,
                showLegend: false,
                class: 'nds-w-full nds-max-w-sm',
                'aria-label': 'Acessos mensais',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => createChart({
                data: chartData,
                type: 'bar',
                height: 160,
                class: 'nds-w-full nds-max-w-sm',
                'aria-label': 'Gráfico de barras: acessos mensais de janeiro a junho',
              }),
              // Don't: rótulo genérico. A factory sempre emite um, então o erro
              // que ainda dá para cometer não é ficar sem descrição — é escrever
              // uma que não descreve nada.
              dontPreviewFactory: () => createChart({
                data: chartData,
                type: 'bar',
                height: 160,
                class: 'nds-w-full nds-max-w-sm',
                'aria-label': 'Gráfico',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.vanilla'),
          code: `import { createChart } from '@/components/ui/chart';`,
          secondaryDescription: t('import.withBuilders'),
          secondaryCode: `// Nortear — uso básico
const el = createChart({
  data: [
    { label: 'Jan', value: 186 },
    { label: 'Feb', value: 305 },
    { label: 'Mar', value: 237 },
  ],
  type: 'bar',   // 'bar' | 'line' | 'area' | 'pie'
  height: 200,
  // Vira o role="img" + aria-label do container. Sem ele, o desenho é
  // conteúdo perdido para quem usa leitor de tela.
  'aria-label': 'Acessos mensais de janeiro a março',
});
document.body.appendChild(el);`,
        });

      case 'variantes': {
        const codeBar = `const el = createChart({
  data: chartData,
  type: 'bar',
  height: 200,
  'aria-label': 'Gráfico de barras: acessos mensais de janeiro a junho',
});`;

        const codeLine = `const el = createChart({
  data: chartData,
  type: 'line',
  height: 200,
  'aria-label': 'Gráfico de linhas: tendência dos acessos de janeiro a junho',
});`;

        const codeSmallInline = `const wrap = document.createElement('div');
wrap.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-4';
wrap.dataset.spacing = 'md';
wrap.style.width = 'fit-content';

const stats = document.createElement('div');
stats.innerHTML =
  '<p class="nds-text-caption nds-text-muted-foreground">Acessos</p>' +
  '<p class="nds-font-semibold" style="font-size:1.5rem;line-height:2rem;">1.224</p>';
wrap.appendChild(stats);

const spark = createChart({
  data: chartData,
  type: 'line',
  height: 48,
  'aria-label': 'Tendência de acessos nos últimos seis meses',
});
spark.style.width = '120px';
wrap.appendChild(spark);`;

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.visualTitle'),
          useWhenLabel: tNav('common.useWhen'),
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
            {
              name: stripHtml(t('variants.items.smallInline.name')),
              description: stripHtml(t('variants.items.smallInline.description')),
              useWhen: stripHtml(t('variants.items.smallInline.use')),
              trackId: 'smallInline',
              code: codeSmallInline,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-4';
                wrap.dataset.spacing = 'md';
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
                const spark = createChart({
                  data: chartData,
                  type: 'line',
                  height: 48,
                  'aria-label': 'Tendência de acessos nos últimos seis meses',
                });
                spark.style.width = '120px';
                wrap.appendChild(spark);
                return wrap;
              },
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
content.appendChild(createChart({
  data: chartData,
  type: 'bar',
  height: 200,
  'aria-label': 'Acessos mensais de janeiro a junho',
}));

card.appendChild(header);
card.appendChild(content);`;

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
                content.appendChild(createChart({
                  data: chartData,
                  type: 'bar',
                  height: 200,
                  'aria-label': 'Acessos mensais de janeiro a junho',
                }));
                card.appendChild(header);
                card.appendChild(content);
                return card;
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
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: ['empty', 'loading', 'singleSeries', 'multiSeries', 'withEmptyState', 'multiSeriesWithLegend'].map((key) => ({
            label: t(`states.${key}.label`),
            trigger: toPlainText(t(`states.${key}.trigger`)),
            behavior: toPlainText(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode = `// createChart(options) → HTMLElement
export type ChartType = 'bar' | 'line' | 'area' | 'pie';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  data: number[];
  /** Cor autoral da série. Sobrescreve o token --chart-{n}. */
  color?: string;
}

export interface ChartOptions {
  type?: ChartType;
  /** Dataset simples (1 série). Use \`series\` para multi-série. */
  data?: ChartDataPoint[];
  /** Multi-série: rótulos do eixo X. */
  xAxis?: Array<string | number>;
  /** Multi-série: séries com dados alinhados ao xAxis. */
  series?: ChartSeries[];
  /** Altura do container em px. Sem valor, vale o piso do bloco. */
  height?: number;
  /** Tecnologia de desenho. */
  renderer?: 'svg' | 'canvas';
  /** Título VISÍVEL, desenhado acima dos eixos. */
  title?: string;
  /** Mostrar a legenda. Sem valor, aparece com mais de uma série. */
  showLegend?: boolean;
  /** Classes adicionais no container. */
  class?: string;
  /** Descrição do gráfico: vira o nome acessível do container. */
  'aria-label'?: string;
  /** Frase exibida no lugar do desenho quando não há dado. */
  emptyLabel?: string;
}`;

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
              // A tabela descreve a API REAL desta stack: a factory
              // `createChart(options)`, e não um componente de container.
              title: 'createChart(options)',
              cols: propsCols,
              items: [
                {
                  name: 'data',
                  type: 'ChartDataPoint[]',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.data')),
                },
                {
                  name: 'xAxis',
                  type: 'Array<string | number>',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.xAxis')),
                },
                {
                  name: 'series',
                  type: 'ChartSeries[]',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.series')),
                },
                {
                  name: 'type',
                  type: "'bar' | 'line' | 'area' | 'pie'",
                  defaultValue: "'bar'",
                  required: 'Não',
                  description: toPlainText(t('props.table.chartType')),
                },
                {
                  name: 'height',
                  type: 'number',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.height')),
                },
                {
                  name: 'title',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.title')),
                },
                {
                  name: 'showLegend',
                  type: 'boolean',
                  defaultValue: 'mais de uma série',
                  required: 'Não',
                  description: toPlainText(t('props.table.showLegend')),
                },
                {
                  name: 'renderer',
                  type: "'svg' | 'canvas'",
                  defaultValue: "'svg'",
                  required: 'Não',
                  description: toPlainText(t('props.table.renderer')),
                },
                {
                  name: 'aria-label',
                  type: 'string',
                  defaultValue: "title, depois 'Gráfico'",
                  required: 'Não',
                  description: toPlainText(t('props.table.ariaLabel')),
                },
                {
                  name: 'emptyLabel',
                  type: 'string',
                  defaultValue: "'Sem dados para exibir'",
                  required: 'Não',
                  description: toPlainText(t('props.table.emptyLabel')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.className')),
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
          // A tabela de tokens escreve textNode: `toPlainText` para a marcação
          // do conteúdo não chegar literal à tela.
          items: ([
            ['--chart-1', 'chart1'],
            ['--chart-2', 'chart2'],
            ['--chart-3', 'chart3'],
            ['--chart-4', 'chart4'],
            ['--chart-5', 'chart5'],
            ['--primary', 'primary'],
            ['--secondary', 'secondary'],
            ['--muted', 'muted'],
            ['--muted-foreground', 'mutedForeground'],
            ['--border', 'border'],
            ['--background', 'background'],
            ['--foreground', 'foreground'],
          ] as const).map(([token, chave]) => ({
            token,
            value: `hsl(var(${token}))`,
            description: toPlainText(t(`tokens.table.${chave}`)),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          // As linhas de teclado escrevem textNode — daí `toPlainText` e não
          // `stripHtml`: sem decodificar, a entidade apareceria literal.
          keyboardItems: [
            { key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
            { key: 'Arrow Right', description: toPlainText(t('accessibility.keyboard.arrowRight')) },
            { key: 'Arrow Left', description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Table', description: toPlainText(t('related.table')), path: '?path=/docs/ui-table--docs' },
            { name: 'Card', description: toPlainText(t('related.card')), path: '?path=/docs/ui-card--docs' },
            { name: 'DataTable', description: toPlainText(t('related.dataTable')), path: '?path=/docs/ui-datatable--docs' },
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
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event: t('analytics.table.pageView'),
              trigger: toPlainText(t('analytics.table.pageViewTrigger')),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event: t('analytics.table.sectionViewed'),
              trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event: t('analytics.table.langSwitch'),
              trigger: toPlainText(t('analytics.table.langSwitchTrigger')),
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
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
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
              criterion: toPlainText(t(`testes.accessibility.item${i}.criterion`)),
              level: t(`testes.accessibility.item${i}.level`),
              how: toPlainText(t(`testes.accessibility.item${i}.how`)),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map((i) => ({
              story: toPlainText(t(`testes.visual.item${i}.story`)),
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
