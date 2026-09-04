import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createProgress, type ProgressVariant } from '@/components/ui/progress';
import uiTranslations from '@/i18n/ui.json';
import progressTranslations from '@shared/content/progress/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (progressTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(progressTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// Tabela de tokens — cada linha é uma declaração de
// `docs/shared/styles/nds/progress.css`. O token é o mesmo nas cinco stacks; a
// classe e a aplicação vêm do conteúdo compartilhado.
const TOKEN_ROWS = [
  { token: '--primary',           key: 'track' },
  { token: '--primary',           key: 'indicator' },
  { token: '--success',           key: 'success' },
  { token: '--destructive',       key: 'destructive' },
  { token: '--spacing-2',         key: 'height' },
  { token: '--radius-full',       key: 'radius' },
  { token: '--muted-foreground',  key: 'value' },
  { token: '--text-control',      key: 'label' },
  { token: '--duration-base',     key: 'motion' },
  { token: '--duration-stately',  key: 'motionIndeterminate' },
] as const;

/**
 * Builds a Progress element with its required accessible name.
 */
function buildProgress(opts: {
  value?: number | null;
  max?: number;
  variant?: ProgressVariant;
  className?: string;
  'aria-label': string;
}): HTMLElement {
  return createProgress({
    value: opts.value,
    max: opts.max,
    variant: opts.variant,
    className: opts.className,
    'aria-label': opts['aria-label'],
  });
}

/**
 * Builds an indeterminate Progress.
 *
 * `value: null` é o modo da própria factory desde esta revisão: ela omite
 * `aria-valuenow` e marca `data-indeterminate`, que é o gancho do CSS
 * compartilhado. Antes disto o estado era falsificado aqui — atributo removido
 * à mão e uma classe de animação que não existe em CSS nenhum, o que dava uma
 * barra vazia e parada.
 */
function buildIndeterminate(ariaLabel: string): HTMLElement {
  return buildProgress({ value: null, 'aria-label': ariaLabel });
}

/**
 * Builds a labeled Progress row (Label + Value above the track).
 * DIVERGENCE: factory does not expose ProgressLabel/ProgressValue subcomponents —
 * composed manually with native DOM.
 */
function buildLabeled(opts: {
  value: number;
  labelText: string;
  'aria-label': string;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';

  const row = document.createElement('div');
  row.className = 'nds-cluster nds-text-body';
  row.dataset.align = 'center';
  row.dataset.justify = 'between';

  const label = document.createElement('span');
  label.className = 'nds-text-foreground';
  label.textContent = opts.labelText;

  const value = document.createElement('span');
  value.className = 'nds-text-muted-foreground';
  value.style.fontVariantNumeric = 'tabular-nums';
  value.setAttribute('aria-live', 'polite');
  value.textContent = `${opts.value}%`;

  row.append(label, value);

  const bar = buildProgress({ value: opts.value, 'aria-label': opts['aria-label'] });

  wrap.append(row, bar);
  return wrap;
}

// ─── createProgressDocs ───────────────────────────────────────────────────────

export function createProgressDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'progress',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/feedback' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'progress', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao', labelKey: 'nav.demonstration' },
      { id: 'anatomia',     labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',  labelKey: 'nav.usage'         },
      { id: 'do-dont',      labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',   labelKey: 'nav.import'   },
      { id: 'variantes',    labelKey: 'nav.variants' },
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

  function buildNavGroups() {
    return NAV_GROUPS.map(g => ({
      label: tNav(g.labelKey),
      sections: g.sections.map(s => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  }

  const pageLayout = createDocsPageLayout({ navGroups: buildNavGroups() });
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;
  const demoTimers: number[] = [];

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const grid = document.createElement('div');
            grid.className = 'nds-stack nds-w-full';
            grid.dataset.spacing = 'lg';

            // Animated upload row
            const animated = buildLabeled({
              value: 0,
              labelText: t('demonstration.labels.upload'),
              'aria-label': t('demonstration.labels.upload'),
            });
            grid.appendChild(animated);

            let pct = 0;
            // Rastreia marcos apenas no primeiro ciclo da animação — a demo
            // reinicia em loop e re-emitir marcos a cada ciclo geraria spam.
            let firstCycleDone = false;
            const valueSpan = animated.querySelector('span[aria-live]') as HTMLElement | null;
            const bar = animated.querySelector('[role="progressbar"]') as HTMLElement | null;
            const indicator = bar?.firstElementChild as HTMLElement | null;
            const timer = window.setInterval(() => {
              pct = (pct + 5) % 105;
              if (pct > 100) pct = 0;
              if (valueSpan) valueSpan.textContent = `${pct}%`;
              if (bar) bar.setAttribute('aria-valuenow', String(pct));
              if (indicator) indicator.style.transform = `translateX(-${100 - pct}%)`;
              if (!firstCycleDone && (pct === 25 || pct === 50 || pct === 75 || pct === 100)) {
                track('task_progress', { component: 'progress', task: 'upload', percent: pct, location: 'docs_demo' });
                if (pct === 100) {
                  track('task_complete', { component: 'progress', task: 'upload', location: 'docs_demo' });
                  firstCycleDone = true;
                }
              }
            }, 400);
            demoTimers.push(timer);

            // Static rows
            grid.appendChild(buildLabeled({
              value: 50,
              labelText: t('demonstration.labels.loading'),
              'aria-label': t('demonstration.labels.loading'),
            }));

            grid.appendChild(buildLabeled({
              value: 100,
              labelText: t('demonstration.labels.complete'),
              'aria-label': t('demonstration.labels.complete'),
            }));

            // Indeterminate row
            const indWrap = document.createElement('div');
            indWrap.className = 'nds-stack nds-w-full';
            indWrap.dataset.spacing = 'xs';
            const indRow = document.createElement('div');
            indRow.className = 'nds-cluster nds-text-body';
            indRow.dataset.align = 'center';
            indRow.dataset.justify = 'between';
            const indLabel = document.createElement('span');
            indLabel.className = 'nds-text-foreground';
            indLabel.textContent = t('demonstration.labels.indeterminate');
            indRow.appendChild(indLabel);
            indWrap.appendChild(indRow);
            indWrap.appendChild(buildIndeterminate(t('demonstration.labels.indeterminate')));
            grid.appendChild(indWrap);

            return grid;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            DOMPurify.sanitize(t('anatomy.item1')),
            DOMPurify.sanitize(t('anatomy.item2')),
            DOMPurify.sanitize(t('anatomy.item3')),
            DOMPurify.sanitize(t('anatomy.item4')),
            DOMPurify.sanitize(t('anatomy.item5')),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [
              DOMPurify.sanitize(t('usage.guidelines.item1')),
              DOMPurify.sanitize(t('usage.guidelines.item2')),
              DOMPurify.sanitize(t('usage.guidelines.item3')),
              DOMPurify.sanitize(t('usage.guidelines.item4')),
            ],
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: ['label', 'value', 'ariaLabel'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [
              t('usage.do.item1'),
              t('usage.do.item2'),
              t('usage.do.item3'),
              t('usage.do.item4'),
            ],
          },
          dont: {
            title: t('usage.dont.title'),
            items: [
              DOMPurify.sanitize(t('usage.dont.item1')),
              DOMPurify.sanitize(t('usage.dont.item2')),
              DOMPurify.sanitize(t('usage.dont.item3')),
              DOMPurify.sanitize(t('usage.dont.item4')),
            ],
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
              doPreviewFactory: () =>
                buildProgress({ value: 42, 'aria-label': 'Progresso do upload' }),
              dontPreviewFactory: () => createProgress({ value: 42, 'aria-label': 'Barra' }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () =>
                buildLabeled({ value: 50, labelText: 'Enviando arquivo', 'aria-label': 'Progresso do upload' }),
              dontPreviewFactory: () =>
                buildLabeled({ value: 47, labelText: 'Enviando arquivo', 'aria-label': 'Progresso do upload' }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createProgress } from '@/components/ui/progress';`,
        });

      case 'variantes': {
        const codeDeterminate =
          `const bar = createProgress({\n` +
          `  value: 42,\n` +
          `  'aria-label': 'Progresso do upload',\n` +
          `});`;
        const codeWithLabel =
          `// DIVERGÊNCIA Nortear: factory não expõe ProgressLabel/ProgressValue.\n` +
          `// Componha manualmente com DOM nativo acima da barra.\n` +
          `const wrap = document.createElement('div');\n` +
          `const row = document.createElement('div');\n` +
          `// ... label + value ...\n` +
          `wrap.append(row, createProgress({ value: 42 }));`;
        const codeSemantic =
          `const ok = createProgress({\n` +
          `  value: 100,\n` +
          `  variant: 'success',\n` +
          `  'aria-label': 'Sincronização concluída',\n` +
          `});\n\n` +
          `const cheio = createProgress({\n` +
          `  value: 92,\n` +
          `  variant: 'destructive',\n` +
          `  'aria-label': 'Espaço quase esgotado',\n` +
          `});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              trackId: 'determinate',
              name: t('variants.items.determinate'),
              description: DOMPurify.sanitize(t('variants.styles.determinate')),
              code: codeDeterminate,
              previewFactory: () => buildProgress({ value: 42, 'aria-label': 'Progresso do upload' }),
            },
            {
              trackId: 'withLabel',
              name: t('variants.items.withLabel'),
              description: DOMPurify.sanitize(t('variants.styles.withLabel')),
              code: codeWithLabel,
              previewFactory: () =>
                buildLabeled({ value: 42, labelText: t('demonstration.labels.upload'), 'aria-label': t('demonstration.labels.upload') }),
            },
            {
              trackId: 'semantic',
              name: t('variants.items.semantic'),
              description: DOMPurify.sanitize(t('variants.styles.semantic')),
              code: codeSemantic,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-w-full';
                wrap.dataset.spacing = 'sm';
                wrap.append(
                  buildProgress({ value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' }),
                  buildProgress({ value: 92, variant: 'destructive', 'aria-label': 'Espaço de armazenamento quase esgotado' }),
                );
                return wrap;
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
          items: [
            { label: t('states.default.label'),       trigger: toPlainText(t('states.default.trigger')),       behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.loading.label'),       trigger: toPlainText(t('states.loading.trigger')),       behavior: toPlainText(t('states.loading.behavior')) },
            { label: t('states.complete.label'),      trigger: toPlainText(t('states.complete.trigger')),      behavior: toPlainText(t('states.complete.behavior')) },
            { label: t('states.indeterminate.label'), trigger: toPlainText(t('states.indeterminate.trigger')), behavior: toPlainText(t('states.indeterminate.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createProgress(options)
export interface ProgressOptions {
  /** Current progress value (0 – max). \`null\` = indeterminate. */
  value?: number | null;
  /** Maximum value (default: 100). */
  max?: number;
  /** Semantic colour of the bar. */
  variant?: 'success' | 'destructive';
  /** Accessible name — REQUIRED, describes what is being measured. */
  'aria-label'?: string;
  /** Additional CSS classes to append to the root element. */
  className?: string;
}

export function createProgress(options?: ProgressOptions): HTMLElement;`;

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
              title: 'createProgress(options)',
              cols: propsCols,
              items: [
                {
                  name: 'value',
                  type: t('props.table.value.type'),
                  defaultValue: '0',
                  required: 'Não',
                  description: toPlainText(t('props.table.value.description')),
                },
                {
                  name: 'max',
                  type: 'number',
                  defaultValue: '100',
                  required: 'Não',
                  description: t('props.table.max.description'),
                },
                {
                  name: 'variant',
                  type: t('props.table.variant.type'),
                  defaultValue: t('props.table.variant.default'),
                  required: t('props.table.variant.required'),
                  description: toPlainText(t('props.table.variant.description')),
                },
                {
                  name: 'className',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: DOMPurify.sanitize(t('props.table.className.description')),
                },
                {
                  name: 'aria-label',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Sim',
                  description: 'Obrigatório — nome do que está sendo medido. A barra sem nome é anunciada só como percentual.',
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: `<pre class="nds-text-caption nds-bg-muted nds-rounded nds-overflow-x" style="padding: var(--spacing-3);"><code>${t('props.extensibilityCode').replace(/</g, '&lt;')}</code></pre>`,
        });
      }

      case 'tokens': {
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: TOKEN_ROWS.map(({ token, key }) => ({
            token,
            value: t(`tokens.table.${key}.class`),
            description: t(`tokens.table.${key}.part`),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            DOMPurify.sanitize(t('accessibility.items.item1')),
            DOMPurify.sanitize(t('accessibility.items.item2')),
            DOMPurify.sanitize(t('accessibility.items.item3')),
            DOMPurify.sanitize(t('accessibility.items.item4')),
            DOMPurify.sanitize(t('accessibility.items.item5')),
            DOMPurify.sanitize(t('accessibility.items.item6')),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: '—',   description: t('accessibility.keyboard.noInteraction') },
            { key: 'Tab', description: t('accessibility.keyboard.container') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.skeleton.name'), description: toPlainText(t('related.items.skeleton.description')), path: '?path=/docs/components-feedback-skeleton--docs' },
            { name: t('related.items.alert.name'),    description: toPlainText(t('related.items.alert.description')),    path: '?path=/docs/components-feedback-alert--docs' },
            { name: t('related.items.sonner.name'),   description: toPlainText(t('related.items.sonner.description')),   path: '?path=/docs/components-feedback-sonner--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            // Divergências desta stack — API, não comportamento.
            { title: '', content: 'A factory não expõe os subcomponentes <code>ProgressLabel</code>, <code>ProgressValue</code> e <code>ProgressTrack</code>: o rótulo e o valor são compostos com DOM nativo acima da barra.' },
            { title: '', content: 'A factory não aceita <code>min</code> nem <code>getAriaValueText</code>.' },
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
            { event: 'task_progress', trigger: toPlainText(t('analytics.table.task_progress.trigger')), payload: t('analytics.table.task_progress.payload') },
            { event: 'task_complete', trigger: toPlainText(t('analytics.table.task_complete.trigger')), payload: t('analytics.table.task_complete.payload') },
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
            items: [1, 2, 3, 4].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
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
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level: 'AA',
              how: '—',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story: t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
    }
  }

  function clearDemoTimers() {
    while (demoTimers.length) {
      const t = demoTimers.pop();
      if (t !== undefined) window.clearInterval(t);
    }
  }

  function renderAllSections() {
    clearDemoTimers();
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
        component_name: 'progress',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());
  cleanups.push(() => clearDemoTimers());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));
  cleanups.push(onLocaleChange(() => {
    renderHeader();
    buildSidebar();
    renderAllSections();
  }));

  // ── Cleanup on disconnect ────────────────────────────────────────────────

  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
