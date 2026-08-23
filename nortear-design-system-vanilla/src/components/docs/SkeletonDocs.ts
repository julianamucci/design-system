import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSkeleton, type SkeletonWidth } from '@/components/ui/skeleton';
import { createAspectRatio } from '@/components/ui/aspect-ratio';
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
import { toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (skeletonTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
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

function loadingWrap(label: string, extraClass = '', stackSpacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `nds-w-full ${extraClass}`.trim();
  if (stackSpacing) {
    wrap.classList.add('nds-stack');
    wrap.dataset.spacing = stackSpacing;
  }
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', label);
  return wrap;
}

/** Linha de texto na fração pedida do container. */
function line(width: SkeletonWidth): HTMLElement {
  return createSkeleton({ shape: 'text', width });
}

function buildCardDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando card de perfil', 'nds-max-w-sm');
  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'md';
  row.dataset.align = 'center';
  row.appendChild(createSkeleton({ shape: 'avatar' }));

  const lines = document.createElement('div');
  lines.className = 'nds-stack nds-flex-1';
  lines.dataset.spacing = 'sm';
  lines.appendChild(line('2-3'));
  lines.appendChild(line('1-2'));
  row.appendChild(lines);
  inner.appendChild(row);

  wrap.append(caption, inner);
  return wrap;
}

function buildListDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const list = loadingWrap('Carregando lista', '', 'md');
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    row.dataset.align = 'center';
    row.appendChild(createSkeleton({ shape: 'avatar', size: 'sm' }));
    const text = document.createElement('div');
    text.className = 'nds-stack nds-flex-1';
    text.dataset.spacing = 'xs';
    text.appendChild(line('2-3'));
    text.appendChild(line('1-3'));
    row.appendChild(text);
    list.appendChild(row);
  }

  wrap.append(caption, list);
  return wrap;
}

function buildImageDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando imagem');
  inner.appendChild(
    createAspectRatio({ ratio: 16 / 9, content: createSkeleton({ shape: 'fill' }) }),
  );

  wrap.append(caption, inner);
  return wrap;
}

function buildParagraphDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-md nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const inner = loadingWrap('Carregando parágrafo', '', 'sm');
  (['full', '3-4', '1-2'] as const).forEach((w) => inner.appendChild(line(w)));

  wrap.append(caption, inner);
  return wrap;
}

function buildRectangleVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando bloco', 'nds-max-w-sm');
  wrap.appendChild(createSkeleton({ shape: 'fill', className: 'nds-docs-skeleton-media' }));
  return wrap;
}

function buildCircleVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando avatar', 'nds-max-w-sm');
  wrap.appendChild(createSkeleton({ shape: 'avatar' }));
  return wrap;
}

function buildLineVariant(): HTMLElement {
  const wrap = loadingWrap('Carregando linhas', 'nds-max-w-sm', 'sm');
  (['full', '3-4', '1-2'] as const).forEach((w) => wrap.appendChild(line(w)));
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
            grid.className = 'nds-grid nds-w-full';
            grid.dataset.cols = '2';
            grid.dataset.spacing = 'lg';
            grid.dataset.min = '16rem';
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
            DOMPurify.sanitize(t('anatomy.item1')),
            DOMPurify.sanitize(t('anatomy.item2')),
            DOMPurify.sanitize(t('anatomy.item3')),
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
              DOMPurify.sanitize(t('usage.guidelines.item5')),
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const wrap = loadingWrap('Carregando artigo', 'nds-max-w-sm', 'sm');
                wrap.appendChild(createSkeleton({ shape: 'heading', width: '1-2' }));
                wrap.appendChild(line('full'));
                wrap.appendChild(line('3-4'));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = loadingWrap('Carregando', 'nds-max-w-sm', 'sm');
                wrap.appendChild(line('1-3'));
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const wrap = loadingWrap('Carregando perfil', 'nds-max-w-sm');
                wrap.classList.add('nds-cluster');
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.appendChild(createSkeleton({ shape: 'avatar' }));
                const lines = document.createElement('div');
                lines.className = 'nds-stack nds-flex-1';
                lines.dataset.spacing = 'xs';
                lines.appendChild(line('1-2'));
                lines.appendChild(line('1-3'));
                wrap.appendChild(lines);
                return wrap;
              },
              // Sem `role="status"`/`aria-busy`: é justamente o que falta no
              // "não faça" — o esqueleto solto não anuncia carregamento nenhum.
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm nds-cluster';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.appendChild(createSkeleton({ shape: 'avatar' }));
                const lines = document.createElement('div');
                lines.className = 'nds-stack nds-flex-1';
                lines.dataset.spacing = 'xs';
                lines.appendChild(line('1-2'));
                lines.appendChild(line('1-3'));
                wrap.appendChild(lines);
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
        const codeRect = `const bloco = createSkeleton({ shape: 'fill', className: 'nds-docs-skeleton-media' });`;
        const codeCircle = `const avatar = createSkeleton({ shape: 'avatar' });`;
        const codeLine = `const linha = createSkeleton({ shape: 'text', width: '3-4' });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.rectangle'),
              description: DOMPurify.sanitize(t('variants.styles.rectangle')),
              code: codeRect,
              previewFactory: () => buildRectangleVariant(),
            },
            {
              name: t('variants.items.circle'),
              description: DOMPurify.sanitize(t('variants.styles.circle')),
              code: codeCircle,
              previewFactory: () => buildCircleVariant(),
            },
            {
              name: t('variants.items.line'),
              description: DOMPurify.sanitize(t('variants.styles.line')),
              code: codeLine,
              previewFactory: () => buildLineVariant(),
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
            { label: t('states.motionReduced.label'), trigger: toPlainText(t('states.motionReduced.trigger')), behavior: toPlainText(t('states.motionReduced.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createSkeleton(options) — a caixa vem de atributo, e a folha
// de estilo continua dona das medidas.
export interface SkeletonOptions {
  className?: string;
  shape?: 'text' | 'heading' | 'avatar' | 'fill';
  width?: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
  size?: 'sm' | 'lg';
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
                { name: 'className', chave: 'className' },
                { name: 'shape',     chave: 'dataShape' },
                { name: 'width',     chave: 'dataWidth' },
                { name: 'size',      chave: 'dataSize'  },
              ].map(({ name, chave }) => ({
                name,
                type: t(`props.table.${chave}.type`),
                defaultValue: t(`props.table.${chave}.default`),
                required: t(`props.table.${chave}.required`),
                description: t(`props.table.${chave}.description`),
              })),
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
          items: ['background', 'rounded', 'animation', 'size', 'motionReduce'].map((k) => ({
            token: t(`tokens.table.${k}.token`),
            value: t(`tokens.table.${k}.class`),
            description: t(`tokens.table.${k}.part`),
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
            { name: t('related.items.progress.name'),    description: toPlainText(t('related.items.progress.description')),    path: '?path=/docs/ui-progress--docs' },
            { name: t('related.items.aspectRatio.name'), description: toPlainText(t('related.items.aspectRatio.description')), path: '?path=/docs/ui-aspectratio--docs' },
            { name: t('related.items.card.name'),        description: toPlainText(t('related.items.card.description')),        path: '?path=/docs/ui-card--docs' },
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
            { title: '', content: DOMPurify.sanitize(t('notes.item5')) },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: tNav('common.event'),
            trigger: tNav('common.eventTrigger'),
            payload: tNav('common.payload'),
          },
          items: [
            {
              event: '—',
              trigger: toPlainText(t('analytics.description')),
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
            // O item 5 não é critério da WCAG: o esqueleto não transmite
            // informação, então 1.4.3 e 1.4.11 não se aplicam — o que se mede
            // é luminância.
            items: [
              { level: 'AA',    how: 'axe-core' },
              { level: '4.1.2', how: 'DevTools a11y tree' },
              { level: '4.1.2', how: 'DevTools a11y tree' },
              { level: '2.3.3', how: 'prefers-reduced-motion' },
              { level: '—',     how: 'Medição de luminância' },
            ].map(({ level, how }, idx) => ({
              criterion: t(`testes.accessibility.item${idx + 1}`),
              level,
              how,
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
