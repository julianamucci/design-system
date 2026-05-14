import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCollapsible } from '@/components/ui/collapsible';
import uiTranslations from '@/i18n/ui.json';
import collapsibleTranslations from '@shared/content/collapsible/translations.json';

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
const { t, subscribe } = createTranslation(collapsibleTranslations as Record<string, unknown>);

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

function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = 'rounded-md border border-border bg-muted/50 p-4 text-sm space-y-2 mt-2';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}

// ─── Demo factories ───────────────────────────────────────────────────────────

function buildDemoDefault(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerClosed'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    defaultOpen: false,
    class: 'w-full max-w-sm',
  });
}

function buildDemoDefaultOpen(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerOpen'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    defaultOpen: true,
    class: 'w-full max-w-sm',
  });
}

function buildDemoDisabled(): HTMLElement {
  return createCollapsible({
    trigger: t('demonstration.labels.triggerClosed'),
    content: makeContent([
      t('demonstration.labels.advancedFilter1'),
      t('demonstration.labels.advancedFilter2'),
    ]),
    disabled: true,
    class: 'w-full max-w-sm',
  });
}

// ─── createCollapsibleDocs ────────────────────────────────────────────────────

export function createCollapsibleDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'collapsible',
    });
    track('docs_page_view', { component_name: 'collapsible', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add collapsible',
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

      // ── Demonstração ───────────────────────────────────────────────────
      case 'demonstracao': {
        const demoWrapper = document.createElement('div');
        demoWrapper.className = 'space-y-8';

        // Demo 1: Default (uncontrolled, fechado)
        const block1 = document.createElement('div');
        block1.className = 'space-y-2';
        const label1 = document.createElement('p');
        label1.className = 'text-sm font-medium text-muted-foreground';
        label1.textContent = 'Padrão (não-controlado, fechado)';
        block1.appendChild(label1);
        block1.appendChild(buildDemoDefault());

        // Demo 2: defaultOpen=true
        const block2 = document.createElement('div');
        block2.className = 'space-y-2';
        const label2 = document.createElement('p');
        label2.className = 'text-sm font-medium text-muted-foreground';
        label2.textContent = 'Aberto por padrão (defaultOpen: true)';
        block2.appendChild(label2);
        block2.appendChild(buildDemoDefaultOpen());

        // Demo 3: Disabled
        const block3 = document.createElement('div');
        block3.className = 'space-y-2';
        const label3 = document.createElement('p');
        label3.className = 'text-sm font-medium text-muted-foreground';
        label3.textContent = 'Desabilitado';
        block3.appendChild(label3);
        block3.appendChild(buildDemoDisabled());

        demoWrapper.appendChild(block1);
        demoWrapper.appendChild(block2);
        demoWrapper.appendChild(block3);

        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => demoWrapper,
        });
      }

      // ── Anatomia ───────────────────────────────────────────────────────
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

      // ── Quando Usar ────────────────────────────────────────────────────
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              s: t(`usage.scenarios.item${i}.s`),
              u: t(`usage.scenarios.item${i}.u`),
              a: t(`usage.scenarios.item${i}.a`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
          },
        });

      // ── Do & Don't ─────────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => createCollapsible({
                trigger: 'Exibir filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                class: 'w-full max-w-xs text-sm',
              }),
              dontPreviewFactory: () => createCollapsible({
                trigger: 'Ver mais',
                content: makeContent(['Conteúdo extra']),
                class: 'w-full max-w-xs text-sm',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => createCollapsible({
                trigger: 'Exibir detalhes adicionais',
                content: makeContent(['Detalhe 1', 'Detalhe 2']),
                class: 'w-full max-w-xs text-sm',
              }),
              dontPreviewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'space-y-2 w-full max-w-xs';
                for (let i = 1; i <= 3; i++) {
                  wrapper.appendChild(createCollapsible({
                    trigger: `Seção ${i}`,
                    content: makeContent([`Conteúdo da seção ${i}`]),
                    class: 'w-full text-sm',
                  }));
                }
                return wrapper;
              },
            },
          ],
        });

      // ── Importação ─────────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCollapsible } from '@/components/ui/collapsible';`,
        });

      // ── Variantes (Modos de Uso) ───────────────────────────────────────
      case 'variantes': {
        const codeUncontrolled = `createCollapsible({\n  trigger: 'Exibir filtros avançados',\n  content: contentEl,\n  defaultOpen: false,\n});`;
        const codeDefaultOpen = `createCollapsible({\n  trigger: 'Ocultar filtros avançados',\n  content: contentEl,\n  defaultOpen: true,\n});`;
        const codeControlled = `let open = false;\ncreateCollapsible({\n  trigger: 'Exibir filtros avançados',\n  content: contentEl,\n  defaultOpen: open,\n  onOpenChange: (next) => {\n    open = next;\n    // sincronizar com estado externo\n  },\n});`;

        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.uncontrolled')).slice(0, 40) + '…',
              description: stripHtml(t('variants.items.uncontrolled')),
              code: codeUncontrolled,
              previewFactory: () => createCollapsible({
                trigger: 'Exibir filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                class: 'w-full max-w-sm text-sm',
              }),
            },
            {
              name: 'Aberto por padrão',
              description: 'defaultOpen: true — painel renderiza expandido na montagem.',
              code: codeDefaultOpen,
              previewFactory: () => createCollapsible({
                trigger: 'Ocultar filtros avançados',
                content: makeContent(['Filtro avançado 1', 'Filtro avançado 2']),
                defaultOpen: true,
                class: 'w-full max-w-sm text-sm',
              }),
            },
            {
              name: stripHtml(t('variants.items.controlled')).slice(0, 40) + '…',
              description: stripHtml(t('variants.items.controlled')),
              code: codeControlled,
              previewFactory: () => {
                let isOpen = false;
                return createCollapsible({
                  trigger: 'Exibir filtros avançados',
                  content: makeContent(['Filtro avançado 1 (controlado)', 'Filtro avançado 2 (controlado)']),
                  defaultOpen: isOpen,
                  onOpenChange: (next) => { isOpen = next; },
                  class: 'w-full max-w-sm text-sm',
                });
              },
            },
          ],
        });
      }

      // ── Estados ────────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.closed.label'),      trigger: stripHtml(t('states.closed.trigger')),      behavior: t('states.closed.behavior')      },
            { label: t('states.open.label'),         trigger: stripHtml(t('states.open.trigger')),         behavior: t('states.open.behavior')         },
            { label: t('states.defaultOpen.label'),  trigger: stripHtml(t('states.defaultOpen.trigger')),  behavior: t('states.defaultOpen.behavior')  },
            { label: t('states.disabled.label'),     trigger: stripHtml(t('states.disabled.trigger')),     behavior: stripHtml(t('states.disabled.behavior'))     },
          ],
        });

      // ── Propriedades ───────────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `export type CollapsibleOptions = {\n  trigger: string | HTMLElement;    // botão ou elemento trigger\n  content: HTMLElement;             // painel expansível\n  defaultOpen?: boolean;            // estado inicial (padrão: false)\n  disabled?: boolean;               // desabilita o trigger\n  onOpenChange?: (open: boolean) => void; // callback de estado\n  class?: string;                   // classes adicionais no wrapper\n};`;

        const propCols = {
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
              title: t('props.collapsibleTitle'),
              cols: propCols,
              items: [
                { name: 'trigger',      type: 'string | HTMLElement', defaultValue: '—',     required: 'Sim', description: 'Texto ou elemento HTML usado como botão trigger.'           },
                { name: 'content',      type: 'HTMLElement',          defaultValue: '—',     required: 'Sim', description: 'Elemento HTML do painel expansível.'                        },
                { name: 'defaultOpen',  type: 'boolean',              defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.defaultOpen'))                      },
                { name: 'disabled',     type: 'boolean',              defaultValue: 'false', required: 'Não', description: t('props.table.disabled')                                   },
                { name: 'onOpenChange', type: '(open: boolean) => void', defaultValue: '—',  required: 'Não', description: stripHtml(t('props.table.onOpenChange'))                    },
                { name: 'class',        type: 'string',               defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.className'))                       },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: stripHtml(t('props.extensibility')),
        });
      }

      // ── Tokens ─────────────────────────────────────────────────────────
      case 'tokens':
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--border',          value: 'border-border',             description: t('tokens.table.border')      },
            { token: '--muted',           value: 'bg-muted/50',               description: t('tokens.table.background')  },
            { token: '--radius',          value: 'rounded-md',                description: t('tokens.table.radius')      },
            { token: '--accent',          value: 'hover:bg-accent',           description: t('tokens.table.triggerHover')},
            { token: '--ring',            value: 'focus-visible:ring-ring',   description: t('tokens.table.triggerFocus')},
            { token: 'transition-all',    value: 'transition-all duration-200', description: t('tokens.table.transition') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: `/* Personalizar via CSS variables no tema */\n:root {\n  --radius: 0.5rem;\n  --border: oklch(...);\n  --muted: oklch(...);\n}`,
        });

      // ── Acessibilidade ─────────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: sanitizeHtml(t('accessibility.summary')),
          items: [
            sanitizeHtml(t('accessibility.item1')),
            sanitizeHtml(t('accessibility.item2')),
            sanitizeHtml(t('accessibility.item3')),
            sanitizeHtml(t('accessibility.item4')),
            sanitizeHtml(t('accessibility.item5')),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab')     },
            { key: 'Enter', description: t('accessibility.keyboard.enter')   },
            { key: 'Space', description: t('accessibility.keyboard.space')   },
            { key: '—',     description: t('accessibility.keyboard.noArrow') },
          ],
        });

      // ── Relacionados ───────────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Accordion',  description: t('related.accordion'), path: '?path=/docs/ui-accordion--docs'  },
            { name: 'Sheet',      description: t('related.sheet'),     path: '?path=/docs/ui-sheet--docs'      },
            { name: 'Button',     description: t('related.button'),    path: '?path=/docs/ui-button--docs'     },
            { name: 'Tabs',       description: t('related.tabs'),      path: '?path=/docs/ui-tabs--docs'       },
          ],
        });

      // ── Notas ──────────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.tip1')) },
            { title: '', content: sanitizeHtml(t('notes.tip2')) },
            { title: '', content: sanitizeHtml(t('notes.tip3')) },
          ],
        });

      // ── Analytics ──────────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.toggle'),    trigger: t('analytics.table.toggleTrigger'),    payload: t('analytics.table.togglePayload')    },
            { event: t('analytics.table.pageView'),  trigger: t('analytics.table.pageViewTrigger'),  payload: t('analytics.table.pageViewPayload')  },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'), trigger: t('analytics.table.langSwitchTrigger'), payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      // ── Testes ─────────────────────────────────────────────────────────
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
              how: t(`testes.accessibility.item${i}.how`),
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
        component_name: 'collapsible',
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
