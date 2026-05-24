import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import separatorTranslations from '@shared/content/separator/translations.json';

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
const { t, subscribe } = createTranslation(separatorTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function buildHorizontalDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const top = document.createElement('p');
  top.className = 'nds-text-body nds-font-medium';
  top.textContent = 'Configurações';

  const bottom = document.createElement('p');
  bottom.className = 'nds-text-body nds-text-muted-foreground';
  bottom.textContent = 'Preferências';

  wrap.append(caption, top, createSeparator({ orientation: 'horizontal' }), bottom);
  return wrap;
}

function buildVerticalDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'sm';
  row.dataset.align = 'center';
  row.style.height = '3rem';

  const a = document.createElement('span');
  a.className = 'nds-text-body';
  a.textContent = 'Blog';

  const b = document.createElement('span');
  b.className = 'nds-text-body';
  b.textContent = 'Docs';

  const c = document.createElement('span');
  c.className = 'nds-text-body';
  c.textContent = 'Contato';

  row.append(
    a,
    createSeparator({ orientation: 'vertical' }),
    b,
    createSeparator({ orientation: 'vertical' }),
    c,
  );

  wrap.append(caption, row);
  return wrap;
}

function buildMenuDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-xs nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const menu = document.createElement('div');
  menu.className = 'nds-stack nds-rounded-md nds-border-default nds-bg-background nds-p-1 nds-text-body';
  menu.dataset.spacing = 'xs';

  const items1 = ['Perfil', 'Conta'];
  const items2 = ['Sair'];

  items1.forEach((txt) => {
    const item = document.createElement('div');
    item.className = 'nds-rounded-sm nds-hover-bg-accent nds-px-2';
    item.style.paddingBlock = '0.375rem';
    item.textContent = txt;
    menu.appendChild(item);
  });

  const sep = createSeparator({ orientation: 'horizontal' });
  sep.classList.add('nds-my-1');
  menu.appendChild(sep);

  items2.forEach((txt) => {
    const item = document.createElement('div');
    item.className = 'nds-rounded-sm nds-hover-bg-accent nds-px-2';
    item.style.paddingBlock = '0.375rem';
    item.textContent = txt;
    menu.appendChild(item);
  });

  wrap.append(caption, menu);
  return wrap;
}

function buildCardDemo(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-stack';
  wrap.dataset.spacing = 'sm';

  const caption = document.createElement('div');
  caption.className = 'nds-text-caption nds-text-muted-foreground';
  caption.textContent = label;

  const card = document.createElement('div');
  card.className = 'nds-rounded-md nds-border-default nds-bg-background';

  const header = document.createElement('div');
  header.className = 'nds-p-4';
  const headerTitle = document.createElement('p');
  headerTitle.className = 'nds-text-body nds-font-semibold';
  headerTitle.textContent = 'Cabeçalho do Card';
  const headerDesc = document.createElement('p');
  headerDesc.className = 'nds-text-caption nds-text-muted-foreground';
  headerDesc.textContent = 'Descrição curta da seção.';
  header.append(headerTitle, headerDesc);

  const body = document.createElement('div');
  body.className = 'nds-p-4 nds-text-body nds-text-muted-foreground';
  body.textContent = 'Conteúdo principal do card.';

  card.append(
    header,
    createSeparator({ orientation: 'horizontal' }),
    body,
  );

  wrap.append(caption, card);
  return wrap;
}

// ─── createSeparatorDocs ──────────────────────────────────────────────────────

export function createSeparatorDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'separator',
    });
    track('docs_page_view', { component_name: 'separator', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add separator',
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
            grid.dataset.spacing = 'lg';
            grid.dataset.min = '18rem';
            grid.append(
              buildHorizontalDemo(t('demonstration.labels.horizontal')),
              buildVerticalDemo(t('demonstration.labels.vertical')),
              buildMenuDemo(t('demonstration.labels.inMenu')),
              buildCardDemo(t('demonstration.labels.inCard')),
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
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-xs nds-stack nds-rounded-md nds-border-default nds-bg-background nds-p-1 nds-text-body';
                wrap.dataset.spacing = 'xs';
                const a = document.createElement('div');
                a.className = 'nds-px-2';
                a.style.paddingBlock = '0.375rem';
                a.textContent = 'Perfil';
                const b = document.createElement('div');
                b.className = 'nds-px-2';
                b.style.paddingBlock = '0.375rem';
                b.textContent = 'Conta';
                const c = document.createElement('div');
                c.className = 'nds-px-2';
                c.style.paddingBlock = '0.375rem';
                c.textContent = 'Sair';
                const sep = createSeparator({ orientation: 'horizontal' });
                sep.classList.add('nds-my-1');
                wrap.append(a, b, sep, c);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-xs nds-stack nds-text-body';
                wrap.dataset.spacing = 'xs';
                const a = document.createElement('p');
                a.textContent = 'Linha 1';
                const sep = createSeparator({ orientation: 'horizontal' });
                sep.classList.add('nds-my-2');
                const b = document.createElement('p');
                b.textContent = 'Linha 2';
                wrap.append(a, sep, b);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-w-full nds-max-w-sm';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.style.height = '3rem';
                const a = document.createElement('span');
                a.className = 'nds-text-body';
                a.textContent = 'Blog';
                const b = document.createElement('span');
                b.className = 'nds-text-body';
                b.textContent = 'Docs';
                wrap.append(a, createSeparator({ orientation: 'vertical' }), b);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-block nds-w-full nds-max-w-sm';
                const a = document.createElement('span');
                a.className = 'nds-text-body';
                a.textContent = 'Blog';
                const b = document.createElement('span');
                b.className = 'nds-text-body';
                b.textContent = 'Docs';
                wrap.append(a, createSeparator({ orientation: 'vertical' }), b);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createSeparator } from '@/components/ui/separator';`,
        });

      case 'variantes': {
        const codeHorizontal =
          `const sep = createSeparator({ orientation: 'horizontal' });\n` +
          `container.append(top, sep, bottom);`;
        const codeVertical =
          `// Parent precisa de altura — use flex container:\n` +
          `const row = document.createElement('div');\n` +
          `row.className = 'nds-cluster';\nrow.dataset.spacing = 'sm';\nrow.dataset.align = 'center';\nrow.style.height = '3rem';\n` +
          `row.append(itemA, createSeparator({ orientation: 'vertical' }), itemB);`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.horizontal'),
              description: sanitizeHtml(t('variants.styles.horizontal')),
              code: codeHorizontal,
              previewFactory: () => buildHorizontalDemo(t('variants.items.horizontal')),
            },
            {
              name: t('variants.items.vertical'),
              description: sanitizeHtml(t('variants.styles.vertical')),
              code: codeVertical,
              previewFactory: () => buildVerticalDemo(t('variants.items.vertical')),
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
              label: t('states.items.decorative'),
              trigger: 'decorative={true}',
              behavior: sanitizeHtml(t('states.descriptions.decorative')),
            },
            {
              label: t('states.items.semantic'),
              trigger: 'decorative={false}',
              behavior: sanitizeHtml(t('states.descriptions.semantic')),
            },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createSeparator(options)
export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorOptions {
  orientation?: SeparatorOrientation;
  decorative?: boolean;
  className?: string;
}

export function createSeparator(options?: SeparatorOptions): HTMLElement;`;

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
              title: 'createSeparator(options)',
              cols: propsCols,
              items: [
                {
                  name: 'orientation',
                  type: t('props.table.orientation.type'),
                  defaultValue: t('props.table.orientation.default'),
                  required: t('props.table.orientation.required'),
                  description: t('props.table.orientation.description'),
                },
                {
                  name: 'decorative',
                  type: t('props.table.decorative.type'),
                  defaultValue: t('props.table.decorative.default'),
                  required: t('props.table.decorative.required'),
                  description: t('props.table.decorative.description'),
                },
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
            { token: '--border', value: t('tokens.table.background.class'),      description: t('tokens.table.background.part') },
            { token: '—',        value: t('tokens.table.heightHorizontal.class'), description: t('tokens.table.heightHorizontal.part') },
            { token: '—',        value: t('tokens.table.widthHorizontal.class'),  description: t('tokens.table.widthHorizontal.part') },
            { token: '—',        value: t('tokens.table.widthVertical.class'),    description: t('tokens.table.widthVertical.part') },
            { token: '—',        value: t('tokens.table.heightVertical.class'),   description: t('tokens.table.heightVertical.part') },
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
            { name: t('related.items.card.name'),           description: t('related.items.card.description'),           path: '?path=/docs/ui-card--docs' },
            { name: t('related.items.sheet.name'),          description: t('related.items.sheet.description'),          path: '?path=/docs/ui-sheet--docs' },
            { name: t('related.items.sidebar.name'),        description: t('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs' },
            { name: t('related.items.navigationMenu.name'), description: t('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
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
        component_name: 'separator',
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
