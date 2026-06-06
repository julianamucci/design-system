import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createAspectRatio } from '@/components/ui/aspect-ratio';
import uiTranslations from '@/i18n/ui.json';
import aspectRatioTranslations from '@shared/content/aspect-ratio/translations.json';

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
const { t, subscribe } = createTranslation(aspectRatioTranslations as Record<string, unknown>);

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

// ─── Preview image helpers (used by demonstrations, variants, composições) ───

const PREVIEW_IMAGES = {
  landscape: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  product:   'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
  avatar:    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80',
  portrait:  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
  ultrawide: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80',
};

function createPreviewImage(src: string, alt: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.className = 'nds-w-full nds-rounded-md';
  img.style.objectFit = 'cover';
  img.style.height = '100%';
  return img;
}

function createPreviewIframe(src: string, title: string): HTMLIFrameElement {
  const f = document.createElement('iframe');
  f.src = src;
  f.title = title;
  f.className = 'nds-w-full nds-rounded-md';
  f.style.height = '100%';
  f.style.border = '0';
  f.loading = 'lazy';
  return f;
}

function createPreviewVideo(poster: string, captionLabel: string): HTMLVideoElement {
  const v = document.createElement('video');
  v.poster = poster;
  v.controls = true;
  v.className = 'nds-w-full nds-rounded-md';
  v.style.objectFit = 'cover';
  v.style.height = '100%';
  const track = document.createElement('track');
  track.kind = 'captions';
  track.srclang = 'pt';
  track.label = captionLabel;
  track.default = true;
  v.appendChild(track);
  return v;
}

function ratioPreview(ratio: number, labelKey: string, src: string = PREVIEW_IMAGES.landscape): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';
  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = stripHtml(t(labelKey));
  const ratioEl = createAspectRatio({
    ratio,
    content: createPreviewImage(src, stripHtml(t(labelKey))),
  });
  wrap.append(ratioEl, caption);
  return wrap;
}

// ─── createAspectRatioDocs ────────────────────────────────────────────────────

export function createAspectRatioDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'aspect-ratio',
    });
    track('docs_page_view', { component_name: 'aspect-ratio', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add aspect-ratio',
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
            grid.className = 'nds-grid nds-w-full';
            grid.style.gap = 'var(--spacing-6)';
            grid.append(
              ratioPreview(16 / 9, 'demonstration.labels.sixteenNine', PREVIEW_IMAGES.landscape),
              ratioPreview(4 / 3,  'demonstration.labels.fourThree',   PREVIEW_IMAGES.product),
              ratioPreview(1,      'demonstration.labels.square',      PREVIEW_IMAGES.avatar),
              ratioPreview(3 / 4,  'demonstration.labels.threeFour',   PREVIEW_IMAGES.portrait),
            );
            return grid;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3')],
          structureLabel: t('anatomy.title'),
          structureCode:
            `<div class="relative nds-w-full" style="padding-bottom: 56.25%">   // Root — wrapper com ratio\n` +
            `  <div class="absolute inset-0">                               // Inner — preenche o container\n` +
            `    <img class="object-cover nds-w-full h-full nds-rounded-md" />      // Slot — conteúdo filho\n` +
            `  </div>\n` +
            `</div>`,
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
              t('usage.guidelines.item5'),
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
                const img = document.createElement('img');
                img.src = PREVIEW_IMAGES.landscape;
                img.alt = 'Paisagem com object-cover';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.className = 'nds-w-full nds-rounded-md';
  img.style.objectFit = 'cover';
  img.style.height = '100%';
                return createAspectRatio({ ratio: 16 / 9, content: img });
              },
              dontPreviewFactory: () => {
                const img = document.createElement('img');
                img.src = PREVIEW_IMAGES.portrait;
                img.alt = 'Retrato com object-contain';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.className = 'nds-w-full nds-rounded-md nds-bg-muted';
                img.style.objectFit = 'contain';
                img.style.height = '100%';
                return createAspectRatio({ ratio: 16 / 9, content: img });
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const img = document.createElement('img');
                img.src = PREVIEW_IMAGES.product;
                img.alt = 'Imagem com rounded-md no filho';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.className = 'nds-w-full nds-rounded-md';
  img.style.objectFit = 'cover';
  img.style.height = '100%';
                return createAspectRatio({ ratio: 4 / 3, content: img });
              },
              dontPreviewFactory: () => {
                const img = document.createElement('img');
                img.src = PREVIEW_IMAGES.product;
                img.alt = 'Imagem sem rounded no filho';
                img.loading = 'lazy';
                img.decoding = 'async';
                img.className = 'nds-w-full';
                img.style.objectFit = 'cover';
                img.style.height = '100%';
                return createAspectRatio({
                  ratio: 4 / 3,
                  content: img,
                  className: 'nds-rounded-md nds-overflow-hidden',
                });
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('description'),
          code: `import { createAspectRatio } from '@/components/ui/aspect-ratio';`,
          secondaryDescription: stripHtml(t('variants.items.sixteenNine')),
          secondaryCode:
            `const img = document.createElement('img');\n` +
            `img.src = '/cover.jpg';\n` +
            `img.alt = 'Capa do artigo';\n` +
            `img.className = 'object-cover nds-w-full h-full nds-rounded-md';\n\n` +
            `const el = createAspectRatio({ ratio: 16 / 9, content: img });`,
        });

      case 'variantes': {
        const mkCode = (ratioExpr: string) =>
          `const img = document.createElement('img');\n` +
          `img.src = '/media.jpg';\n` +
          `img.alt = 'Descrição da mídia';\n` +
          `img.className = 'object-cover nds-w-full h-full nds-rounded-md';\n\n` +
          `const el = createAspectRatio({ ratio: ${ratioExpr}, content: img });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: '16 / 9',
              description: stripHtml(t('variants.items.sixteenNine')),
              code: mkCode('16 / 9'),
              previewFactory: () => ratioPreview(16 / 9, 'demonstration.labels.sixteenNine', PREVIEW_IMAGES.landscape),
            },
            {
              name: '4 / 3',
              description: stripHtml(t('variants.items.fourThree')),
              code: mkCode('4 / 3'),
              previewFactory: () => ratioPreview(4 / 3, 'demonstration.labels.fourThree', PREVIEW_IMAGES.product),
            },
            {
              name: '1 / 1',
              description: stripHtml(t('variants.items.square')),
              code: mkCode('1'),
              previewFactory: () => ratioPreview(1, 'demonstration.labels.square', PREVIEW_IMAGES.avatar),
            },
            {
              name: '3 / 4',
              description: stripHtml(t('variants.items.threeFour')),
              code: mkCode('3 / 4'),
              previewFactory: () => ratioPreview(3 / 4, 'demonstration.labels.threeFour', PREVIEW_IMAGES.portrait),
            },
            {
              name: '21 / 9',
              description: stripHtml(t('variants.items.ultraWide')),
              code: mkCode('21 / 9'),
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full';
                wrap.appendChild(createAspectRatio({
                  ratio: 21 / 9,
                  content: createPreviewImage(PREVIEW_IMAGES.ultrawide, '21 / 9 ultra-wide'),
                }));
                return wrap;
              },
            },
          ],
        });
      }

      case 'estados': {
        const locale = getLocale();
        const statesCols = locale === 'en'
          ? { state: 'State',    trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
          ? { state: 'Estado',   trigger: 'Disparo', behavior: 'Comportamiento' }
          : { state: 'Estado',   trigger: 'Disparo', behavior: 'Comportamento' };
        return createDocsStates({
          title: t('states.title'),
          cols: statesCols,
          items: [
            { label: t('states.item1.label'), trigger: t('states.item1.trigger'), behavior: t('states.item1.behavior') },
            { label: t('states.item2.label'), trigger: t('states.item2.trigger'), behavior: t('states.item2.behavior') },
            { label: t('states.item3.label'), trigger: t('states.item3.trigger'), behavior: stripHtml(t('states.item3.behavior')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createAspectRatio(options)
export interface AspectRatioOptions {
  ratio?: number;
  content?: HTMLElement;
  className?: string;
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
              title: 'createAspectRatio',
              cols: propsCols,
              items: [
                { name: 'ratio',     type: 'number',      defaultValue: '1', required: 'Não', description: stripHtml(t('props.table.ratio')) },
                { name: 'content',   type: 'HTMLElement', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.children')) },
                { name: 'className', type: 'string',      defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            stripHtml(t('props.extensibility')) +
            ' Nota Nortear: a factory aceita content: HTMLElement em vez de children e não suporta asChild.',
        });
      }

      case 'tokens': {
        const customizationCode = `/* AspectRatio não aplica tokens próprios. Aplique no filho: */
<img class="nds-rounded-md object-cover nds-w-full h-full" />

/* Placeholder opcional quando o conteúdo ainda não carregou: */
<div class="absolute inset-0 nds-bg-muted nds-rounded-md" aria-hidden="true"></div>`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--radius',      value: 'rounded-md',  description: t('tokens.table.radius') },
            { token: '--border',      value: 'border',      description: t('tokens.table.border') },
            { token: '--muted',       value: 'bg-muted',    description: t('tokens.table.muted') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.aria.item1'),
            t('accessibility.aria.item2'),
            t('accessibility.aria.item3'),
            t('accessibility.aria.item4'),
            t('accessibility.aria.item5'),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: '—',   description: t('accessibility.keyboard.item1') },
            { key: 'Tab', description: t('accessibility.keyboard.note') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Card',       description: t('related.card'),       path: '?path=/docs/ui-card--docs' },
            { name: 'Avatar',     description: t('related.avatar'),     path: '?path=/docs/ui-avatar--docs' },
            { name: 'Skeleton',   description: t('related.skeleton'),   path: '?path=/docs/ui-skeleton--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.item1') },
            { title: '', content: t('notes.item2') },
            { title: '', content: t('notes.item3') },
            { title: '', content: t('notes.item4') },
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
              event: '—',
              trigger: stripHtml(t('analytics.note')),
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
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
        component_name: 'aspect-ratio',
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

// Expose createPreviewIframe / createPreviewVideo for story reuse (tree-shakeable).
export { createPreviewImage, createPreviewIframe, createPreviewVideo, PREVIEW_IMAGES };
