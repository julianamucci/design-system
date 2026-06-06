import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createProgress } from '@/components/ui/progress';
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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
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

/**
 * Builds a Progress element and sets `aria-label` (REQUIRED — factory does not).
 * The custom Nortear factory accepts only `value`, `max`, `className`.
 */
function buildProgress(opts: {
  value: number;
  max?: number;
  className?: string;
  ariaLabel: string;
}): HTMLElement {
  const el = createProgress({ value: opts.value, max: opts.max, className: opts.className });
  el.setAttribute('aria-label', opts.ariaLabel);
  return el;
}

/**
 * Builds an indeterminate Progress.
 * DIVERGENCE: factory does not support indeterminate natively — we override the
 * indicator with an animated class and remove `aria-valuenow`.
 */
function buildIndeterminate(ariaLabel: string): HTMLElement {
  const el = createProgress({ value: 0 });
  el.setAttribute('aria-label', ariaLabel);
  el.removeAttribute('aria-valuenow');
  const indicator = el.firstElementChild as HTMLElement | null;
  if (indicator) {
    indicator.style.transform = '';
    indicator.style.width = '33.3333%';
    indicator.classList.add('animate-indeterminate');
  }
  return el;
}

/**
 * Builds a labeled Progress row (Label + Value above the track).
 * DIVERGENCE: factory does not expose ProgressLabel/ProgressValue subcomponents —
 * composed manually with native DOM.
 */
function buildLabeled(opts: {
  value: number;
  labelText: string;
  ariaLabel: string;
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

  const bar = buildProgress({ value: opts.value, ariaLabel: opts.ariaLabel });

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
      aiIntent: t('seo.aiIntent') as 'informational',
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
      installNote: 'npx shadcn@latest add progress',
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
              ariaLabel: t('demonstration.labels.upload'),
            });
            grid.appendChild(animated);

            let pct = 0;
            const valueSpan = animated.querySelector('span[aria-live]') as HTMLElement | null;
            const bar = animated.querySelector('[role="progressbar"]') as HTMLElement | null;
            const indicator = bar?.firstElementChild as HTMLElement | null;
            const timer = window.setInterval(() => {
              pct = (pct + 5) % 105;
              if (pct > 100) pct = 0;
              if (valueSpan) valueSpan.textContent = `${pct}%`;
              if (bar) bar.setAttribute('aria-valuenow', String(pct));
              if (indicator) indicator.style.transform = `translateX(-${100 - pct}%)`;
            }, 400);
            demoTimers.push(timer);

            // Static rows
            grid.appendChild(buildLabeled({
              value: 50,
              labelText: t('demonstration.labels.loading'),
              ariaLabel: t('demonstration.labels.loading'),
            }));

            grid.appendChild(buildLabeled({
              value: 100,
              labelText: t('demonstration.labels.complete'),
              ariaLabel: t('demonstration.labels.complete'),
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
            sanitizeHtml(t('anatomy.item1')),
            sanitizeHtml(t('anatomy.item2')),
            sanitizeHtml(t('anatomy.item3')),
            sanitizeHtml(t('anatomy.item4')),
            sanitizeHtml(t('anatomy.item5')),
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
              sanitizeHtml(t('usage.guidelines.item1')),
              sanitizeHtml(t('usage.guidelines.item2')),
              sanitizeHtml(t('usage.guidelines.item3')),
              sanitizeHtml(t('usage.guidelines.item4')),
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
              sanitizeHtml(t('usage.dont.item1')),
              sanitizeHtml(t('usage.dont.item2')),
              sanitizeHtml(t('usage.dont.item3')),
              sanitizeHtml(t('usage.dont.item4')),
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
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () =>
                buildProgress({ value: 42, ariaLabel: 'Progresso do upload' }),
              dontPreviewFactory: () => {
                const el = createProgress({ value: 42 });
                el.setAttribute('aria-label', 'Barra');
                return el;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () =>
                buildLabeled({ value: 50, labelText: 'Enviando arquivo', ariaLabel: 'Progresso do upload' }),
              dontPreviewFactory: () =>
                buildLabeled({ value: 47, labelText: 'Enviando arquivo', ariaLabel: 'Progresso do upload' }),
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
          `const bar = createProgress({ value: 42 });\n` +
          `bar.setAttribute('aria-label', 'Progresso do upload');`;
        const codeIndeterminate =
          `// DIVERGÊNCIA Nortear: factory não suporta value=null nativamente.\n` +
          `// Remova aria-valuenow e anime o indicador via classe utilitária.\n` +
          `const bar = createProgress({ value: 0 });\n` +
          `bar.setAttribute('aria-label', 'Processando…');\n` +
          `bar.removeAttribute('aria-valuenow');\n` +
          `const ind = bar.firstElementChild as HTMLElement;\n` +
          `ind.style.width = '33.3333%';\n` +
          `ind.classList.add('animate-indeterminate');`;
        const codeWithLabel =
          `// DIVERGÊNCIA Nortear: factory não expõe ProgressLabel/ProgressValue.\n` +
          `// Componha manualmente com DOM nativo acima da barra.\n` +
          `const wrap = document.createElement('div');\n` +
          `const row = document.createElement('div');\n` +
          `// ... label + value ...\n` +
          `wrap.append(row, createProgress({ value: 42 }));`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.determinate'),
              description: sanitizeHtml(t('variants.styles.determinate')),
              code: codeDeterminate,
              previewFactory: () => buildProgress({ value: 42, ariaLabel: 'Progresso do upload' }),
            },
            {
              name: t('variants.items.indeterminate'),
              description: sanitizeHtml(t('variants.styles.indeterminate')),
              code: codeIndeterminate,
              previewFactory: () => buildIndeterminate(t('demonstration.labels.indeterminate')),
            },
            {
              name: t('variants.items.withLabel'),
              description: sanitizeHtml(t('variants.styles.withLabel')),
              code: codeWithLabel,
              previewFactory: () =>
                buildLabeled({ value: 42, labelText: t('demonstration.labels.upload'), ariaLabel: t('demonstration.labels.upload') }),
            },
          ],
        });
      }

      case 'estados': {
        const locale = getLocale();
        const cols = locale === 'en'
          ? { state: 'State',  trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
          ? { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamiento' }
          : { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamento' };

        return createDocsStates({
          title: t('states.title'),
          cols,
          items: [
            { label: t('states.items.default'),       trigger: 'value=0',     behavior: sanitizeHtml(t('states.descriptions.default'))       },
            { label: t('states.items.loading'),       trigger: '0<value<100', behavior: sanitizeHtml(t('states.descriptions.loading'))       },
            { label: t('states.items.complete'),      trigger: 'value=100',   behavior: sanitizeHtml(t('states.descriptions.complete'))      },
            { label: t('states.items.indeterminate'), trigger: 'value=null',  behavior: sanitizeHtml(t('states.descriptions.indeterminate')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createProgress(options)
export interface ProgressOptions {
  /** Current progress value (0 – max). */
  value?: number;
  /** Maximum value (default: 100). */
  max?: number;
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
                  type: 'number',
                  defaultValue: '0',
                  required: 'Não',
                  description: 'Valor atual de 0 a max. Factory Nortear não aceita null — para indeterminate, ver Notas.',
                },
                {
                  name: 'max',
                  type: 'number',
                  defaultValue: '100',
                  required: 'Não',
                  description: t('props.table.max.description'),
                },
                {
                  name: 'className',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: sanitizeHtml(t('props.table.className.description')),
                },
                {
                  name: 'aria-label',
                  type: 'string (atributo HTML)',
                  defaultValue: '—',
                  required: 'Sim',
                  description: 'Obrigatório — setado pela aplicação via setAttribute. Factory não recebe via options.',
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
          items: [
            { token: '--primary',            value: 'bg-primary/20', description: 'Fundo da trilha (Nortear factory usa primary/20 ao invés de bg-muted)' },
            { token: '--primary',            value: t('tokens.table.primary.class'),           description: t('tokens.table.primary.part') },
            { token: '--primary-foreground', value: t('tokens.table.primaryForeground.class'), description: t('tokens.table.primaryForeground.part') },
            { token: '--foreground',         value: t('tokens.table.foreground.class'),        description: t('tokens.table.foreground.part') },
            { token: '--muted-foreground',   value: t('tokens.table.mutedForeground.class'),   description: t('tokens.table.mutedForeground.part') },
            { token: '--ring',               value: t('tokens.table.ring.class'),              description: t('tokens.table.ring.part') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            sanitizeHtml(t('accessibility.items.item1')),
            sanitizeHtml(t('accessibility.items.item2')),
            sanitizeHtml(t('accessibility.items.item3')),
            sanitizeHtml(t('accessibility.items.item4')),
            sanitizeHtml(t('accessibility.items.item5')),
            sanitizeHtml(t('accessibility.items.item6')),
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
            { name: t('related.items.skeleton.name'), description: t('related.items.skeleton.description'), path: '?path=/docs/ui-skeleton--docs' },
            { name: t('related.items.spinner.name'),  description: t('related.items.spinner.description'),  path: '?path=/docs/ui-spinner--docs' },
            { name: t('related.items.alert.name'),    description: t('related.items.alert.description'),    path: '?path=/docs/ui-alert--docs' },
            { name: t('related.items.sonner.name'),   description: t('related.items.sonner.description'),   path: '?path=/docs/ui-sonner--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.item1')) },
            { title: '', content: sanitizeHtml(t('notes.item2')) },
            { title: '', content: sanitizeHtml(t('notes.item3')) },
            { title: '', content: sanitizeHtml(t('notes.item4')) },
            // Nortear-specific divergences
            { title: '', content: 'DIVERGÊNCIA Nortear: a factory custom <code>createProgress</code> não aceita <code>value=null</code> nem expõe os subcomponentes <code>ProgressLabel</code>, <code>ProgressValue</code> e <code>ProgressTrack</code>. Componha manualmente Label/Value via DOM nativo e simule indeterminate removendo <code>aria-valuenow</code> + adicionando <code>animate-indeterminate</code> no indicador.' },
            { title: '', content: 'DIVERGÊNCIA Nortear: <code>aria-label</code> não é parâmetro da factory — a aplicação deve setá-lo via <code>el.setAttribute(\'aria-label\', ...)</code> imediatamente após <code>createProgress(...)</code>. A factory também não aceita <code>min</code> nem <code>getAriaValueText</code>.' },
            { title: '', content: 'Animação <code>animate-indeterminate</code> requer keyframes <code>@keyframes progress-indeterminate</code> definidos no CSS global (ver seção Tokens — Customização).' },
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
            { event: 'task_progress', trigger: t('analytics.table.task_progress.trigger'), payload: t('analytics.table.task_progress.payload') },
            { event: 'task_complete', trigger: t('analytics.table.task_complete.trigger'), payload: t('analytics.table.task_complete.payload') },
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
