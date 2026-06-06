import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createResizablePanel } from '@/components/ui/resizable';
import uiTranslations from '@/i18n/ui.json';
import resizableTranslations from '@shared/content/resizable/translations.json';

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
const { t, subscribe } = createTranslation(resizableTranslations as Record<string, unknown>);

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

// Build a labelled panel with safe textContent.
function panelContent(label: string, extraClass = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `nds-cluster nds-w-full nds-text-body nds-font-medium ${extraClass}`;
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.style.height = '100%';
  el.style.padding = 'var(--spacing-4)';
  const span = document.createElement('span');
  span.textContent = label;
  el.appendChild(span);
  return el;
}

function frame(child: HTMLElement, minHeight = '220px'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.contain = 'layout';
  wrap.style.minHeight = minHeight;
  wrap.className = 'nds-w-full nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background';
  wrap.appendChild(child);
  return wrap;
}

function buildHorizontalDemo(): HTMLElement {
  const root = createResizablePanel({
    direction: 'horizontal',
    panels: [
      { defaultSize: 30, minSize: 15, content: panelContent(t('demonstration.labels.sidebar'), 'nds-bg-muted nds-text-muted-foreground') },
      { defaultSize: 70, minSize: 30, content: panelContent(t('demonstration.labels.content')) },
    ],
  });
  return frame(root);
}

function buildVerticalDemo(): HTMLElement {
  const root = createResizablePanel({
    direction: 'vertical',
    panels: [
      { defaultSize: 50, minSize: 20, content: panelContent(t('demonstration.labels.top')) },
      { defaultSize: 50, minSize: 20, content: panelContent(t('demonstration.labels.bottom'), 'nds-bg-muted nds-text-muted-foreground') },
    ],
  });
  return frame(root, '260px');
}

function buildNestedDemo(): HTMLElement {
  const inner = createResizablePanel({
    direction: 'vertical',
    panels: [
      { defaultSize: 60, minSize: 20, content: panelContent(t('demonstration.labels.top')) },
      { defaultSize: 40, minSize: 20, content: panelContent(t('demonstration.labels.bottom'), 'nds-bg-muted nds-text-muted-foreground') },
    ],
  });
  const innerWrap = document.createElement('div');
  innerWrap.style.height = '100%';
  innerWrap.style.width = '100%';
  innerWrap.appendChild(inner);

  const root = createResizablePanel({
    direction: 'horizontal',
    panels: [
      { defaultSize: 30, minSize: 15, content: panelContent(t('demonstration.labels.sidebar'), 'nds-bg-muted nds-text-muted-foreground') },
      { defaultSize: 70, minSize: 30, content: innerWrap },
    ],
  });
  return frame(root, '300px');
}

// ─── createResizableDocs ──────────────────────────────────────────────────────

export function createResizableDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'resizable',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/layout' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'resizable',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ────────────────────────────────────────────────────────────
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
      installNote: 'npx shadcn@latest add resizable',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
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
            const wrap = document.createElement('div');
            wrap.className = 'nds-stack nds-w-full';
            wrap.dataset.spacing = 'lg';
            wrap.append(buildHorizontalDemo(), buildVerticalDemo(), buildNestedDemo());
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: ['ariaLabel', 'panelLabel', 'size'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: stripHtml(t(`usage.uxWriting.table.${key}.good`)),
              dont: stripHtml(t(`usage.uxWriting.table.${key}.bad`)),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
                const el = createResizablePanel({
                  direction: 'horizontal',
                  panels: [
                    { defaultSize: 30, minSize: 20, content: panelContent('Sidebar', 'nds-bg-muted nds-text-muted-foreground') },
                    { defaultSize: 70, minSize: 40, content: panelContent('Editor') },
                  ],
                });
                return frame(el, '180px');
              },
              dontPreviewFactory: () => {
                // Don't: sem minSize, painel pode colapsar.
                const el = createResizablePanel({
                  direction: 'horizontal',
                  panels: [
                    { defaultSize: 5,  content: panelContent('?', 'nds-bg-muted nds-text-muted-foreground nds-text-caption') },
                    { defaultSize: 95, content: panelContent('Editor') },
                  ],
                });
                return frame(el, '180px');
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const el = createResizablePanel({
                  direction: 'horizontal',
                  panels: [
                    { defaultSize: 40, minSize: 20, content: panelContent('Lista') },
                    { defaultSize: 60, minSize: 30, content: panelContent('Detalhes', 'nds-bg-muted nds-text-muted-foreground') },
                  ],
                });
                const handle = el.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
                handle?.setAttribute('aria-label', 'Redimensionar painéis — use setas para ajustar');
                return frame(el, '180px');
              },
              dontPreviewFactory: () => {
                const el = createResizablePanel({
                  direction: 'horizontal',
                  panels: [
                    { defaultSize: 40, minSize: 20, content: panelContent('Lista') },
                    { defaultSize: 60, minSize: 30, content: panelContent('Detalhes', 'nds-bg-muted nds-text-muted-foreground') },
                  ],
                });
                const handle = el.querySelector<HTMLElement>('[data-slot="resizable-handle"]');
                handle?.setAttribute('aria-label', 'Handle');
                return frame(el, '180px');
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createResizablePanel } from '@/components/ui/resizable';`,
        });

      case 'variantes': {
        const codeHorizontal = `const root = createResizablePanel({
  direction: 'horizontal',
  panels: [
    { defaultSize: 30, minSize: 15, content: sidebarEl },
    { defaultSize: 70, minSize: 30, content: contentEl },
  ],
});`;
        const codeVertical = `const root = createResizablePanel({
  direction: 'vertical',
  panels: [
    { defaultSize: 50, minSize: 20, content: topEl },
    { defaultSize: 50, minSize: 20, content: bottomEl },
  ],
});`;
        const codeNested = `// PanelGroup vertical dentro de panel horizontal.
const inner = createResizablePanel({
  direction: 'vertical',
  panels: [
    { defaultSize: 60, minSize: 20, content: contentEl },
    { defaultSize: 40, minSize: 20, content: consoleEl },
  ],
});
const root = createResizablePanel({
  direction: 'horizontal',
  panels: [
    { defaultSize: 30, minSize: 15, content: sidebarEl },
    { defaultSize: 70, minSize: 30, content: inner },
  ],
});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.horizontal'),
              description: stripHtml(t('variants.styles.horizontal')),
              code: codeHorizontal,
              previewFactory: () => buildHorizontalDemo(),
            },
            {
              name: t('variants.items.vertical'),
              description: stripHtml(t('variants.styles.vertical')),
              code: codeVertical,
              previewFactory: () => buildVerticalDemo(),
            },
            {
              name: t('variants.items.nested'),
              description: stripHtml(t('variants.styles.nested')),
              code: codeNested,
              previewFactory: () => buildNestedDemo(),
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
            { label: t('states.items.idle'),     trigger: 'estado inicial',          behavior: stripHtml(t('states.descriptions.idle'))     },
            { label: t('states.items.hover'),    trigger: 'mouse sobre handle',      behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.dragging'), trigger: 'mousedown + mousemove',   behavior: stripHtml(t('states.descriptions.dragging')) },
            { label: t('states.items.focus'),    trigger: 'Tab até o handle',        behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: 'data-disabled no handle', behavior: stripHtml(t('states.descriptions.disabled')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createResizablePanel(options)
export type ResizablePanel = {
  content: HTMLElement;
  defaultSize?: number;
  minSize?: number;
};

export type ResizablePanelOptions = {
  direction?: 'horizontal' | 'vertical';
  panels: ResizablePanel[];
  class?: string;
};

export function createResizablePanel(
  options: ResizablePanelOptions,
): HTMLElement;`;

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
              title: 'createResizablePanel(options) — ResizablePanelOptions',
              cols: propsCols,
              items: [
                { name: 'direction',   type: t('props.table.direction.type'),   defaultValue: "'horizontal'", required: t('props.table.direction.required'),   description: stripHtml(t('props.table.direction.description')) },
                { name: 'panels',      type: 'ResizablePanel[]',                defaultValue: '—',            required: 'Sim',                                  description: 'Lista de painéis renderizados em ordem; handles inseridos automaticamente entre painéis adjacentes.' },
                { name: 'class',       type: 'string',                          defaultValue: '—',            required: 'Não',                                  description: 'Classes adicionais no Root <div data-slot="resizable">.' },
                { name: 'autoSaveId',  type: 'string',                          defaultValue: '—',            required: 'Não',                                  description: stripHtml(t('props.table.id.description')) + ' NOTA: factory Nortear NÃO persiste tamanhos em localStorage; argType para paridade com react-resizable-panels.' },
                { name: 'onLayout',    type: '(sizes: number[]) => void',       defaultValue: '—',            required: 'Não',                                  description: stripHtml(t('props.table.onLayout.description')) + ' NOTA: factory Nortear NÃO emite callback; consumidor deve observar mutações de width/height ou implementar wrapper.' },
              ],
            },
            {
              title: 'ResizablePanel (item)',
              cols: propsCols,
              items: [
                { name: 'content',     type: 'HTMLElement', defaultValue: '—',  required: 'Sim',                                   description: 'Elemento renderizado dentro do painel — consumidor define background e overflow.' },
                { name: 'defaultSize', type: 'number',      defaultValue: '—',  required: t('props.table.defaultSize.required'),   description: stripHtml(t('props.table.defaultSize.description')) + ' Quando omitido, tamanho é distribuído igualmente entre os painéis.' },
                { name: 'minSize',     type: 'number',      defaultValue: '10', required: t('props.table.minSize.required'),       description: stripHtml(t('props.table.minSize.description')) },
                { name: 'maxSize',     type: 'number',      defaultValue: '100',required: t('props.table.maxSize.required'),       description: stripHtml(t('props.table.maxSize.description')) + ' NOTA: factory Nortear ainda NÃO aplica maxSize — apenas minSize é respeitado.' },
                { name: 'id',          type: 'string',      defaultValue: '—',  required: 'Não',                                   description: stripHtml(t('props.table.id.description')) + ' NOTA: factory Nortear não usa id (sem persistência).' },
              ],
            },
            {
              title: 'ResizableHandle (atributos aplicados pela factory)',
              cols: propsCols,
              items: [
                { name: 'role',             type: '"separator"',           defaultValue: '"separator"',  required: 'Auto', description: 'Aplicado automaticamente pela factory em cada handle.' },
                { name: 'aria-orientation', type: '"horizontal"|"vertical"', defaultValue: 'derivado', required: 'Auto', description: 'Derivado de direction: handle de PanelGroup horizontal recebe aria-orientation="vertical".' },
                { name: 'tabindex',         type: 'number',                defaultValue: '0',            required: 'Auto', description: 'Handle é focável; setas ajustam tamanho (WCAG 2.5.7).' },
                { name: 'aria-label',       type: 'string',                defaultValue: '—',            required: 'Sim*', description: '*OBRIGATÓRIO pelo consumidor — a factory NÃO aplica aria-label; defina via handle.setAttribute("aria-label", ...) após criar.' },
                { name: 'withHandle',       type: 'boolean',               defaultValue: 'true',         required: 'Auto', description: stripHtml(t('props.table.withHandle.description')) + ' NOTA: factory Nortear SEMPRE exibe o grip visual; não há opção para ocultar.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            t('props.extensibilityCode') +
            '\n\n// NOTA Nortear: a factory custom NÃO suporta autoSaveId, id por painel,\n// onLayout, maxSize, nem ResizableHandle.withHandle=false. Para persistência\n// de tamanhos ou callbacks, envolva manualmente em listeners de MutationObserver\n// sobre style.width/height ou use as stacks React (react-resizable-panels),\n// Vue (reka-ui Splitter) ou Svelte (paneforge).',
        });
      }

      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--border',                value: t('tokens.table.border.class'),       description: t('tokens.table.border.part')       },
            { token: '--ring',                  value: t('tokens.table.ring.class'),         description: t('tokens.table.ring.part')         },
            { token: '--background',            value: t('tokens.table.background.class'),   description: t('tokens.table.background.part')   },
            { token: '--foreground',            value: t('tokens.table.foreground.class'),   description: t('tokens.table.foreground.part')   },
            { token: '--muted',                 value: t('tokens.table.muted.class'),        description: t('tokens.table.muted.part')        },
            { token: '--ring-offset-background', value: t('tokens.table.ringOffset.class'),  description: t('tokens.table.ringOffset.part')   },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6].map(i => sanitizeHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',     description: stripHtml(t('accessibility.keyboard.tab'))        },
            { key: '←',       description: stripHtml(t('accessibility.keyboard.arrowLeft'))  },
            { key: '→',       description: stripHtml(t('accessibility.keyboard.arrowRight')) },
            { key: '↑',       description: stripHtml(t('accessibility.keyboard.arrowUp'))    },
            { key: '↓',       description: stripHtml(t('accessibility.keyboard.arrowDown'))  },
            { key: 'Home',    description: stripHtml(t('accessibility.keyboard.home'))       },
            { key: 'End',     description: stripHtml(t('accessibility.keyboard.end'))        },
            { key: 'Enter',   description: stripHtml(t('accessibility.keyboard.enter'))      },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.scrollArea.name'),  description: t('related.items.scrollArea.description'),  path: '?path=/docs/ui-scrollarea--docs'  },
            { name: t('related.items.sheet.name'),       description: t('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'       },
            { name: t('related.items.separator.name'),   description: t('related.items.separator.description'),   path: '?path=/docs/ui-separator--docs'   },
            { name: t('related.items.aspectRatio.name'), description: t('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
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
              event: 'panel_resize',
              trigger: t('analytics.table.panel_resize.trigger'),
              payload: t('analytics.table.panel_resize.payload'),
            },
            {
              event: '—',
              trigger: 'NOTA Nortear: factory NÃO emite onLayout. Consumidor deve disparar track() manualmente em mouseup/keyup observando style.width/height.',
              payload: '—',
            },
          ],
        });

      case 'testes':
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
              how: 'axe-core / manual',
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

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh = buildSection(id);
      const existing = sectionEls[id];
      if (existing && existing.parentNode) existing.replaceWith(fresh);
      else main.appendChild(fresh);
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
        component_name: 'resizable',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────
  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(subscribe(() => { renderHeader(); buildSidebar(); renderAllSections(); }));
  cleanups.push(onLocaleChange(() => { renderHeader(); buildSidebar(); renderAllSections(); }));

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  const mo = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      cleanups.forEach(fn => fn());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
