import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSkeleton } from '@/components/ui/skeleton';
import uiTranslations from '@/i18n/ui.json';
import skeletonTranslations from '@shared/content/skeleton/translations.json';

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
const { t, subscribe } = createTranslation(skeletonTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function makeSkeleton(className: string): HTMLElement {
  const el = createSkeleton({ className });
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('data-slot', 'skeleton');
  return el;
}

function loadingWrap(label: string, extra = ''): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `w-full ${extra}`.trim();
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', label);
  return wrap;
}

function buildCardDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-sm space-y-2';

  const caption = document.createElement('div');
  caption.className = 'text-xs text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando card de perfil', 'max-w-sm');
  const row = document.createElement('div');
  row.className = 'flex items-center gap-4';
  row.appendChild(makeSkeleton('h-12 w-12 rounded-full motion-reduce:animate-none'));

  const lines = document.createElement('div');
  lines.className = 'space-y-2';
  lines.appendChild(makeSkeleton('h-4 w-[200px] motion-reduce:animate-none'));
  lines.appendChild(makeSkeleton('h-4 w-[160px] motion-reduce:animate-none'));
  row.appendChild(lines);
  inner.appendChild(row);

  wrap.append(caption, inner);
  return wrap;
}

function buildListDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-md space-y-2';

  const caption = document.createElement('div');
  caption.className = 'text-xs text-muted-foreground';
  caption.textContent = label;

  const list = loadingWrap('Carregando lista', 'space-y-3');
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-3';
    row.appendChild(makeSkeleton('h-8 w-8 rounded-full motion-reduce:animate-none'));
    const text = document.createElement('div');
    text.className = 'space-y-2 flex-1';
    text.appendChild(makeSkeleton('h-3 w-[60%] motion-reduce:animate-none'));
    text.appendChild(makeSkeleton('h-3 w-[40%] motion-reduce:animate-none'));
    row.appendChild(text);
    list.appendChild(row);
  }

  wrap.append(caption, list);
  return wrap;
}

function buildImageDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-md space-y-2';

  const caption = document.createElement('div');
  caption.className = 'text-xs text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando imagem');
  const ratio = document.createElement('div');
  ratio.className = 'relative w-full';
  ratio.style.aspectRatio = '16 / 9';
  ratio.appendChild(makeSkeleton('absolute inset-0 h-full w-full motion-reduce:animate-none'));
  inner.appendChild(ratio);

  wrap.append(caption, inner);
  return wrap;
}

function buildParagraphDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'w-full max-w-md space-y-2';

  const caption = document.createElement('div');
  caption.className = 'text-xs text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando parágrafo', 'space-y-2');
  ['w-full', 'w-[95%]', 'w-[60%]'].forEach((w) => {
    inner.appendChild(makeSkeleton(`h-4 ${w} motion-reduce:animate-none`));
  });

  wrap.append(caption, inner);
  return wrap;
}

function buildRectangleVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando bloco', 'max-w-sm');
  wrap.appendChild(makeSkeleton('h-24 w-full motion-reduce:animate-none'));
  return wrap;
}

function buildCircleVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando avatar', 'max-w-sm');
  wrap.appendChild(makeSkeleton('h-12 w-12 rounded-full motion-reduce:animate-none'));
  return wrap;
}

function buildLineVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando linhas', 'max-w-sm space-y-2');
  ['h-4 w-[250px]', 'h-4 w-[200px]', 'h-4 w-[160px]'].forEach((cls) => {
    wrap.appendChild(makeSkeleton(`${cls} motion-reduce:animate-none`));
  });
  return wrap;
}

// ─── createSkeletonDocs ───────────────────────────────────────────────────────

export function createSkeletonDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'skeleton',
    });
    track('docs_page_view', { component_name: 'skeleton', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add skeleton',
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

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 w-full';
            grid.append(
              buildCardDemo(t('demonstration.labels.card')),
              buildListDemo(t('demonstration.labels.list')),
              buildImageDemo(t('demonstration.labels.image')),
              buildParagraphDemo(t('demonstration.labels.paragraph')),
            );
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
              sanitizeHtml(t('usage.guidelines.item5')),
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
              t('usage.dont.item1'),
              t('usage.dont.item2'),
              t('usage.dont.item3'),
              t('usage.dont.item4'),
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
              doPreviewFactory: () => {
                const wrap = loadingWrap('Carregando card de perfil', 'max-w-sm');
                const row = document.createElement('div');
                row.className = 'flex items-center gap-4';
                row.appendChild(makeSkeleton('h-12 w-12 rounded-full motion-reduce:animate-none'));
                const lines = document.createElement('div');
                lines.className = 'space-y-2';
                lines.appendChild(makeSkeleton('h-4 w-[200px] motion-reduce:animate-none'));
                lines.appendChild(makeSkeleton('h-4 w-[160px] motion-reduce:animate-none'));
                row.appendChild(lines);
                wrap.appendChild(row);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = loadingWrap('Carregando', 'max-w-sm space-y-2');
                wrap.appendChild(makeSkeleton('h-20 w-full'));
                wrap.appendChild(makeSkeleton('h-20 w-full'));
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = loadingWrap('Carregando bloco', 'max-w-sm');
                wrap.appendChild(makeSkeleton('h-16 w-full motion-reduce:animate-none'));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'w-full max-w-sm';
                const skeleton = createSkeleton({ className: 'h-16 w-full' });
                wrap.appendChild(skeleton);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createSkeleton } from '@/components/ui/skeleton';`,
        });

      case 'variantes': {
        const codeRect =
          `const skeleton = createSkeleton({ className: 'h-24 w-full motion-reduce:animate-none' });\n` +
          `skeleton.setAttribute('aria-hidden', 'true');`;
        const codeCircle =
          `const avatar = createSkeleton({ className: 'h-12 w-12 rounded-full motion-reduce:animate-none' });\n` +
          `avatar.setAttribute('aria-hidden', 'true');`;
        const codeLine =
          `const line = createSkeleton({ className: 'h-4 w-[250px] motion-reduce:animate-none' });\n` +
          `line.setAttribute('aria-hidden', 'true');`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.rectangle'),
              description: sanitizeHtml(t('variants.styles.rectangle')),
              code: codeRect,
              previewFactory: () => buildRectangleVariant(),
            },
            {
              name: t('variants.items.circle'),
              description: sanitizeHtml(t('variants.styles.circle')),
              code: codeCircle,
              previewFactory: () => buildCircleVariant(),
            },
            {
              name: t('variants.items.line'),
              description: sanitizeHtml(t('variants.styles.line')),
              code: codeLine,
              previewFactory: () => buildLineVariant(),
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
            {
              label: t('states.items.default'),
              trigger: 'animate-pulse',
              behavior: sanitizeHtml(t('states.descriptions.default')),
            },
            {
              label: t('states.items.motionReduced'),
              trigger: 'prefers-reduced-motion',
              behavior: sanitizeHtml(t('states.descriptions.motionReduced')),
            },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createSkeleton(options)
export interface SkeletonOptions {
  className?: string;
}

export function createSkeleton(options?: SkeletonOptions): HTMLElement;`;

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
              title: 'createSkeleton(options)',
              cols: propsCols,
              items: [
                {
                  name: 'className',
                  type: t('props.table.className.type'),
                  defaultValue: t('props.table.className.default'),
                  required: t('props.table.className.required'),
                  description: t('props.table.className.description'),
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
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
            { token: '--primary', value: t('tokens.table.background.class'),    description: t('tokens.table.background.part') },
            { token: '—',         value: t('tokens.table.rounded.class'),       description: t('tokens.table.rounded.part') },
            { token: '—',         value: t('tokens.table.animation.class'),     description: t('tokens.table.animation.part') },
            { token: '—',         value: t('tokens.table.motionReduce.class'),  description: t('tokens.table.motionReduce.part') },
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
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: '—', description: t('accessibility.keyboard.description') },
            { key: 'Tab', description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.progress.name'),    description: t('related.items.progress.description'),    path: '?path=/docs/ui-progress--docs' },
            { name: t('related.items.spinner.name'),     description: t('related.items.spinner.description'),     path: '?path=/docs/ui-spinner--docs' },
            { name: t('related.items.aspectRatio.name'), description: t('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs' },
            { name: t('related.items.card.name'),        description: t('related.items.card.description'),        path: '?path=/docs/ui-card--docs' },
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
            { title: '', content: sanitizeHtml(t('notes.item5')) },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('analytics.table.event') || 'Evento',
            trigger: tNav('analytics.table.trigger') || 'Gatilho',
            payload: tNav('analytics.table.payload') || 'Payload',
          },
          items: [
            {
              event: '—',
              trigger: sanitizeHtml(t('analytics.description')),
              payload: '—',
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
              story: t(`testes.visual.item${i}.story`),
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
        component_name: 'skeleton',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

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
