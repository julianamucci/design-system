import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createScrollArea } from '@/components/ui/scroll-area';
import { createBadge } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import scrollAreaTranslations from '@shared/content/scroll-area/translations.json';

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
const { t, subscribe } = createTranslation(scrollAreaTranslations as Record<string, unknown>);

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

// ─── Preview builders ────────────────────────────────────────────────────────

function buildTagList(count: number): HTMLElement {
  const list = document.createElement('div');
  list.className = 'nds-stack nds-p-sm';
  list.dataset.spacing = 'xs';
  const tagLabel = stripHtml(t('demonstration.labels.tag'));
  for (let i = 1; i <= count; i++) {
    const row = document.createElement('div');
    row.className = 'nds-cluster nds-text-body nds-border-b-soft';
    row.dataset.justify = 'between';
    row.style.paddingBottom = 'var(--spacing-2)';
    const left = document.createElement('span');
    left.textContent = `${tagLabel} ${i}`;
    const badge = createBadge({ variant: 'secondary', text: `#${String(i).padStart(2, '0')}` });
    row.append(left, badge);
    list.appendChild(row);
  }
  return list;
}

function buildHorizontalCards(count: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'nds-cluster nds-p-2';
  row.dataset.spacing = 'md';
  row.style.width = 'max-content';
  for (let i = 1; i <= count; i++) {
    const card = document.createElement('div');
    card.className = 'nds-shrink-0 nds-rounded-md nds-border-default nds-bg-card nds-text-card-foreground nds-p-4';
    card.style.width = '10rem';
    const title = document.createElement('div');
    title.className = 'nds-text-body nds-font-medium';
    title.textContent = `Card ${i}`;
    const desc = document.createElement('div');
    desc.className = 'nds-text-caption nds-text-muted-foreground nds-mt-1';
    desc.textContent = `#${String(i).padStart(2, '0')}`;
    card.append(title, desc);
    row.appendChild(card);
  }
  return row;
}

function buildMatrix(rows: number, cols: number): HTMLElement {
  const table = document.createElement('table');
  table.className = 'nds-text-caption';
  table.style.borderCollapse = 'collapse';
  for (let r = 1; r <= rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 1; c <= cols; c++) {
      const td = document.createElement('td');
      td.className = 'nds-border-default nds-px-2 nds-py-2 nds-whitespace-nowrap';
      td.textContent = `R${r}·C${c}`;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  const wrap = document.createElement('div');
  wrap.className = 'nds-p-2';
  wrap.appendChild(table);
  return wrap;
}

// ─── createScrollAreaDocs ─────────────────────────────────────────────────────

export function createScrollAreaDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'scroll-area',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/layout' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'scroll-area', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add scroll-area',
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
            const container = document.createElement('div');
            container.className = 'nds-w-full nds-stack';
            container.dataset.spacing = 'lg';

            const grid = document.createElement('div');
            grid.className = 'nds-grid nds-w-full';
            grid.dataset.cols = '2';
            grid.dataset.spacing = 'lg';
            grid.dataset.min = '16rem';

            // Vertical
            const verticalWrap = document.createElement('div');
            verticalWrap.className = 'nds-stack';
            verticalWrap.dataset.spacing = 'sm';
            const verticalTitle = document.createElement('div');
            verticalTitle.className = 'nds-text-caption nds-text-muted-foreground';
            verticalTitle.textContent = stripHtml(t('demonstration.labels.verticalTitle'));
            const verticalArea = createScrollArea({
              height: '240px',
              class: 'nds-w-full nds-rounded-md nds-border-default',
              children: buildTagList(30),
            });
            verticalWrap.append(verticalTitle, verticalArea);

            // Horizontal
            const horizontalWrap = document.createElement('div');
            horizontalWrap.className = 'nds-stack';
            horizontalWrap.dataset.spacing = 'sm';
            const horizontalTitle = document.createElement('div');
            horizontalTitle.className = 'nds-text-caption nds-text-muted-foreground';
            horizontalTitle.textContent = stripHtml(t('demonstration.labels.horizontalTitle'));
            const horizontalArea = createScrollArea({
              width: '100%',
              class: 'nds-rounded-md nds-border-default nds-whitespace-nowrap',
              children: buildHorizontalCards(12),
            });
            horizontalWrap.append(horizontalTitle, horizontalArea);

            grid.append(verticalWrap, horizontalWrap);

            // Both (bidirecional) — full width abaixo
            const bothWrap = document.createElement('div');
            bothWrap.className = 'nds-stack';
            bothWrap.dataset.spacing = 'sm';
            const bothTitle = document.createElement('div');
            bothTitle.className = 'nds-text-caption nds-text-muted-foreground';
            bothTitle.textContent = stripHtml(t('demonstration.labels.bothTitle'));
            const bothArea = createScrollArea({
              height: '240px',
              width: '100%',
              class: 'nds-rounded-md nds-border-default nds-whitespace-nowrap',
              children: buildMatrix(12, 15),
            });
            bothWrap.append(bothTitle, bothArea);

            container.append(grid, bothWrap);
            return container;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
            t('anatomy.item4'),
            t('anatomy.item5'),
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
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
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
            items: ['container', 'scrollArea', 'orientation'].map(key => ({
              element: stripHtml(t(`usage.uxWriting.table.${key}.name`)),
              rules: stripHtml(t(`usage.uxWriting.table.${key}.format`)),
              do: stripHtml(t(`usage.uxWriting.table.${key}.good`)),
              dont: stripHtml(t(`usage.uxWriting.table.${key}.bad`)),
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
              doPreviewFactory: () => createScrollArea({
                height: '160px',
                class: 'nds-w-full nds-rounded-md nds-border-default',
                children: buildTagList(20),
              }),
              dontPreviewFactory: () => {
                // Sem altura — conteúdo expande, ScrollArea fica invisível.
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-rounded-md nds-border-default nds-overflow-hidden';
                wrap.style.maxHeight = '160px';
                const area = createScrollArea({
                  class: 'nds-w-full',
                  children: buildTagList(20),
                });
                wrap.appendChild(area);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => createScrollArea({
                height: '160px',
                class: 'nds-w-full nds-rounded-md nds-border-default',
                children: buildTagList(20),
              }),
              dontPreviewFactory: () => {
                // ScrollArea aninhada (anti-padrão).
                const outer = createScrollArea({
                  height: '160px',
                  class: 'nds-w-full nds-rounded-md nds-border-default',
                });
                const innerWrap = document.createElement('div');
                innerWrap.className = 'nds-p-2';
                innerWrap.appendChild(createScrollArea({
                  height: '120px',
                  class: 'nds-w-full nds-rounded-md nds-border-default',
                  children: buildTagList(20),
                }));
                const viewport = outer.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null;
                viewport?.appendChild(innerWrap);
                return outer;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('description'),
          code: `import { createScrollArea } from '@/components/ui/scroll-area';`,
          secondaryDescription: stripHtml(t('anatomy.structureLabel')),
          secondaryCode:
            `const list = document.createElement('ul');\n` +
            `// ... popular o conteúdo\n\n` +
            `const area = createScrollArea({\n` +
            `  height: '400px',\n` +
            `  class: 'nds-w-full nds-rounded-md nds-border-default',\n` +
            `  children: list,\n` +
            `});`,
        });

      case 'variantes': {
        const codeVertical =
          `createScrollArea({\n` +
          `  height: '240px',\n` +
          `  class: 'nds-w-full nds-rounded-md nds-border-default',\n` +
          `  children: list,\n` +
          `});`;
        const codeHorizontal =
          `createScrollArea({\n` +
          `  width: '100%',\n` +
          `  class: 'nds-rounded-md nds-border-default nds-whitespace-nowrap',\n` +
          `  children: row, // div com nds-cluster w-max\n` +
          `});`;
        const codeBoth =
          `createScrollArea({\n` +
          `  height: '240px',\n` +
          `  width: '100%',\n` +
          `  class: 'nds-rounded-md nds-border-default',\n` +
          `  children: matrix, // table ou grid largo\n` +
          `});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.vertical')),
              description: stripHtml(t('variants.styles.vertical')),
              code: codeVertical,
              previewFactory: () => createScrollArea({
                height: '180px',
                class: 'nds-w-full nds-rounded-md nds-border-default',
                children: buildTagList(20),
              }),
            },
            {
              name: stripHtml(t('variants.items.horizontal')),
              description: stripHtml(t('variants.styles.horizontal')),
              code: codeHorizontal,
              previewFactory: () => createScrollArea({
                width: '100%',
                class: 'nds-rounded-md nds-border-default nds-whitespace-nowrap',
                children: buildHorizontalCards(12),
              }),
            },
            {
              name: stripHtml(t('variants.items.both')),
              description: stripHtml(t('variants.styles.both')),
              code: codeBoth,
              previewFactory: () => createScrollArea({
                height: '200px',
                width: '100%',
                class: 'nds-rounded-md nds-border-default nds-whitespace-nowrap',
                children: buildMatrix(10, 10),
              }),
            },
          ],
        });
      }

      case 'estados': {
        const locale = getLocale();
        const statesCols = locale === 'en'
          ? { state: 'State',  trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
          ? { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamiento' }
          : { state: 'Estado', trigger: 'Disparo', behavior: 'Comportamento' };
        return createDocsStates({
          title: t('states.title'),
          cols: statesCols,
          items: [
            { label: stripHtml(t('states.items.idle')),      trigger: '—',                       behavior: stripHtml(t('states.descriptions.idle')) },
            { label: stripHtml(t('states.items.scrolling')), trigger: 'wheel / drag',            behavior: stripHtml(t('states.descriptions.scrolling')) },
            { label: stripHtml(t('states.items.hover')),     trigger: 'mouseenter scrollbar',    behavior: stripHtml(t('states.descriptions.hover')) },
            { label: stripHtml(t('states.items.focus')),     trigger: 'Tab',                     behavior: stripHtml(t('states.descriptions.focus')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createScrollArea(options)
export interface ScrollAreaOptions {
  height?: string;   // ex.: '400px', '50vh'
  width?: string;    // ex.: '100%', '500px'
  class?: string;    // classes extras no root
  children?: HTMLElement; // conteúdo do viewport
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
              title: 'createScrollArea',
              cols: propsCols,
              items: [
                { name: 'height',   type: 'string',      defaultValue: '—', required: 'Não', description: 'Altura do root e maxHeight do viewport. Sem ela o ScrollArea NÃO rola — o conteúdo expande naturalmente.' },
                { name: 'width',    type: 'string',      defaultValue: '—', required: 'Não', description: 'Largura do root. Útil para scroll horizontal.' },
                { name: 'children', type: 'HTMLElement', defaultValue: '—', required: 'Não', description: 'Conteúdo renderizado dentro do viewport (data-slot="scroll-area-viewport").' },
                { name: 'class',    type: 'string',      defaultValue: '—', required: 'Não', description: 'Classes .nds-* extras no root <code>nds-relative nds-overflow-hidden nds-scrollbar</code>.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            'Divergência da API React: a factory Nortear NÃO expõe type, scrollHideDelay nem um subcomponente ScrollBar. ' +
            'A estilização usa a scrollbar nativa do navegador via classe utilitária ".scrollbar" — orientation, hover/auto/always e delays seguem o comportamento padrão da plataforma.',
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
            { token: '--border',     value: 'bg-border',              description: stripHtml(t('tokens.table.border.part')) },
            { token: '--ring',       value: 'ring-ring',              description: stripHtml(t('tokens.table.ring.part')) },
            { token: '--background', value: 'bg-background',          description: stripHtml(t('tokens.table.background.part')) },
            { token: '--foreground', value: 'text-foreground',        description: stripHtml(t('tokens.table.foreground.part')) },
            { token: '--muted',      value: 'bg-muted',               description: stripHtml(t('tokens.table.muted.part')) },
            { token: '—',            value: 'ring-offset-background', description: stripHtml(t('tokens.table.ringOffset.part')) },
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
            t('accessibility.items.item1'),
            t('accessibility.items.item2'),
            t('accessibility.items.item3'),
            t('accessibility.items.item4'),
            t('accessibility.items.item5'),
            t('accessibility.items.item6'),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',        description: t('accessibility.keyboard.tab') },
            { key: 'ArrowDown',  description: t('accessibility.keyboard.arrowDown') },
            { key: 'ArrowUp',    description: t('accessibility.keyboard.arrowUp') },
            { key: 'ArrowRight', description: t('accessibility.keyboard.arrowRight') },
            { key: 'ArrowLeft',  description: t('accessibility.keyboard.arrowLeft') },
            { key: 'PageDown',   description: t('accessibility.keyboard.pageDown') },
            { key: 'PageUp',     description: t('accessibility.keyboard.pageUp') },
            { key: 'Home',       description: t('accessibility.keyboard.home') },
            { key: 'End',        description: t('accessibility.keyboard.end') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: stripHtml(t('related.items.resizable.name')), description: stripHtml(t('related.items.resizable.description')), path: '?path=/docs/ui-resizable--docs' },
            { name: stripHtml(t('related.items.sheet.name')),     description: stripHtml(t('related.items.sheet.description')),     path: '?path=/docs/ui-sheet--docs' },
            { name: stripHtml(t('related.items.dialog.name')),    description: stripHtml(t('related.items.dialog.description')),    path: '?path=/docs/ui-dialog--docs' },
            { name: stripHtml(t('related.items.command.name')),   description: stripHtml(t('related.items.command.description')),   path: '?path=/docs/ui-command--docs' },
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
            { title: '', content:
              '<strong>Divergência Nortear</strong> — a factory <code>createScrollArea</code> é um wrapper minimal: '
              + 'apenas root <code>relative overflow-hidden scrollbar</code> + viewport <code>overflow-auto</code>. '
              + 'Não há subcomponente <code>ScrollBar</code>, nem props <code>type</code>/<code>scrollHideDelay</code>/<code>orientation</code> — '
              + 'a barra é a nativa do navegador, estilizada via CSS utilitário.' },
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
              event: 'content_scroll',
              trigger: stripHtml(t('analytics.table.content_scroll.trigger')),
              payload: stripHtml(t('analytics.table.content_scroll.payload')),
            },
            {
              event: '—',
              trigger: stripHtml(t('analytics.description')),
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
            items: [1, 2, 3, 4].map(i => ({
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: stripHtml(t(`testes.accessibility.item${i}`)),
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
        component_name: 'scroll-area',
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
