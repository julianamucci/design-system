import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createPagination } from '@/components/ui/pagination';
import uiTranslations from '@/i18n/ui.json';
import paginationTranslations from '@shared/content/pagination/translations.json';

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
const { t, subscribe } = createTranslation(paginationTranslations as Record<string, unknown>);

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

function buildDemoPagination(total: number, current: number): HTMLElement {
  return createPagination({
    total,
    current,
    onPageChange: () => {},
  });
}

// ─── createPaginationDocs ─────────────────────────────────────────────────────

export function createPaginationDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'pagination',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'pagination',
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
      installNote: 'npx shadcn@latest add pagination',
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
            wrap.style.contain = 'layout';
            wrap.className = 'flex items-center justify-center w-full min-h-[120px] p-2';
            wrap.appendChild(buildDemoPagination(10, 3));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
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
            items: [1, 2, 3, 4].map(i => ({
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
            items: ['previous', 'next', 'page', 'ellipsis'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
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
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                wrap.appendChild(buildDemoPagination(12, 6));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                // Don't: muitos números seguidos sem ellipsis (composição manual).
                const nav = document.createElement('nav');
                nav.setAttribute('role', 'navigation');
                nav.setAttribute('aria-label', 'Pagination (anti-padrão)');
                nav.className = 'mx-auto flex w-full justify-center';
                const ul = document.createElement('ul');
                ul.className = 'flex flex-row items-center gap-1 flex-wrap';
                for (let i = 1; i <= 14; i++) {
                  const li = document.createElement('li');
                  li.className = 'list-none';
                  const a = document.createElement('a');
                  a.href = '#';
                  a.className =
                    'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-accent';
                  a.textContent = String(i);
                  if (i === 7) {
                    a.setAttribute('aria-current', 'page');
                    a.className += ' border';
                  }
                  a.addEventListener('click', (e) => e.preventDefault());
                  li.appendChild(a);
                  ul.appendChild(li);
                }
                nav.appendChild(ul);
                wrap.appendChild(nav);
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
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                wrap.appendChild(buildDemoPagination(5, 2));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                // Don't: setas sem aria-label (composição manual).
                const nav = document.createElement('nav');
                nav.setAttribute('role', 'navigation');
                nav.className = 'mx-auto flex w-full justify-center';
                const ul = document.createElement('ul');
                ul.className = 'flex flex-row items-center gap-1';
                ['<', '1', '2', '3', '>'].forEach((label) => {
                  const li = document.createElement('li');
                  li.className = 'list-none';
                  const a = document.createElement('a');
                  a.href = '#';
                  a.className =
                    'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-accent';
                  a.textContent = label;
                  a.addEventListener('click', (e) => e.preventDefault());
                  li.appendChild(a);
                  ul.appendChild(li);
                });
                nav.appendChild(ul);
                wrap.appendChild(nav);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createPagination } from '@/components/ui/pagination';`,
        });

      case 'variantes': {
        const codeDefault = `const nav = createPagination({
  total: 5,
  current: 2,
  onPageChange: (page) => console.log('page', page),
});`;

        const codeActive = `// 'active' não é prop — o factory aplica aria-current="page"
// + classe no link cujo número === current.
const nav = createPagination({
  total: 5,
  current: 3, // <- página atual recebe estilo "active"
  onPageChange: (page) => console.log('page', page),
});`;

        const codeDirectional = `// Previous/Next são montados quando showPrevNext=true (padrão).
const nav = createPagination({
  total: 10,
  current: 1,
  showPrevNext: true,
  onPageChange: (page) => console.log('page', page),
});
// Previous fica desabilitado automaticamente em current=1
// (recebe pointer-events-none + opacity-50).`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                wrap.appendChild(buildDemoPagination(5, 2));
                return wrap;
              },
            },
            {
              name: t('variants.items.active'),
              description: stripHtml(t('variants.styles.active')),
              code: codeActive,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                const pag = buildDemoPagination(5, 3);
                // realça visualmente o link aria-current="page" com border-outline para parity de variant
                const current = pag.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
                if (current) current.classList.add('border', 'border-input');
                wrap.appendChild(pag);
                return wrap;
              },
            },
            {
              name: t('variants.items.directional'),
              description: stripHtml(t('variants.styles.directional')),
              code: codeDirectional,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-center justify-center min-h-[80px]';
                wrap.appendChild(buildDemoPagination(10, 1));
                return wrap;
              },
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
            { label: t('states.items.default'),  trigger: 'estado inicial',                   behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.hover'),    trigger: 'mouseenter',                        behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.active'),   trigger: 'page === current',                  behavior: stripHtml(t('states.descriptions.active'))   },
            { label: t('states.items.disabled'), trigger: 'current=1 (Prev) / current=total (Next)', behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.focus'),    trigger: 'Tab',                                behavior: stripHtml(t('states.descriptions.focus'))    },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createPagination(options)
export type PaginationOptions = {
  total: number;                          // total de páginas
  current: number;                        // página atualmente ativa (1-based)
  onPageChange: (page: number) => void;   // callback ao clicar em página/Prev/Next
  showPrevNext?: boolean;                 // exibe Previous e Next (default true)
  class?: string;                         // classes Tailwind extras no <nav>
};

export function createPagination(options: PaginationOptions): HTMLElement;`;

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
              title: 'createPagination(options)',
              cols: propsCols,
              items: [
                { name: 'total',         type: 'number',                  defaultValue: '—',     required: 'Sim', description: 'Total de páginas. Define quantos itens são renderizados.' },
                { name: 'current',       type: 'number',                  defaultValue: '—',     required: 'Sim', description: 'Página atual (1-based). Recebe aria-current="page".' },
                { name: 'onPageChange',  type: '(page: number) => void',  defaultValue: '—',     required: 'Sim', description: 'Callback disparado ao clicar em página, Previous ou Next.' },
                { name: 'showPrevNext',  type: 'boolean',                 defaultValue: 'true',  required: 'Não', description: 'Exibe controles Previous/Next nas extremidades.' },
                { name: 'class',         type: 'string',                  defaultValue: '—',     required: 'Não', description: 'Classes Tailwind extras no <nav>.' },
                { name: 'isActive',      type: 'boolean',                 defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.isActive.description'))   + ' NOTA: factory Basecoat marca ativo internamente via current — sem prop por item.' },
                { name: 'size',          type: '"default" | "sm" | "lg" | "icon"', defaultValue: '"icon"', required: 'Não', description: stripHtml(t('props.table.size.description'))       + ' NOTA: factory Basecoat fixa altura h-9 (icon).' },
                { name: 'text',          type: 'string',                  defaultValue: '"Previous"/"Next"', required: 'Não', description: stripHtml(t('props.table.text.description')) + ' NOTA: factory Basecoat usa apenas ícone — para texto, customize via class ou compose manualmente.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            t('props.extensibilityCode') +
            '\n\n// NOTA Basecoat: o factory custom não expõe asChild/PaginationLink individuais.\n' +
            '// Para integrar com router (history.pushState ou similar), use onPageChange\n' +
            '// e atualize a URL manualmente — o componente sempre renderiza <a href="#">.',
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
            { token: '--background',         value: t('tokens.table.background.class'),         description: t('tokens.table.background.part')         },
            { token: '--foreground',         value: t('tokens.table.foreground.class'),         description: t('tokens.table.foreground.part')         },
            { token: '--accent',             value: t('tokens.table.accent.class'),             description: t('tokens.table.accent.part')             },
            { token: '--accent-foreground',  value: t('tokens.table.accentForeground.class'),   description: t('tokens.table.accentForeground.part')   },
            { token: '--border',             value: t('tokens.table.border.class'),             description: t('tokens.table.border.part')             },
            { token: '--ring',               value: t('tokens.table.ring.class'),               description: t('tokens.table.ring.part')               },
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
            { key: 'Tab',         description: stripHtml(t('accessibility.keyboard.tab'))      },
            { key: 'Enter',       description: stripHtml(t('accessibility.keyboard.enter'))    },
            { key: 'Space',       description: stripHtml(t('accessibility.keyboard.space'))    },
            { key: 'Shift+Tab',   description: stripHtml(t('accessibility.keyboard.shiftTab')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.breadcrumb.name'), description: t('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
            { name: t('related.items.tabs.name'),       description: t('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
            { name: t('related.items.button.name'),     description: t('related.items.button.description'),     path: '?path=/docs/ui-button--docs'     },
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
              event: 'page_change',
              trigger: t('analytics.table.page_change.trigger'),
              payload: t('analytics.table.page_change.payload'),
            },
            {
              event: 'docs_page_view',
              trigger: 'mount da docs page',
              payload: "{ component_name: 'pagination', locale, page_title }",
            },
            {
              event: 'docs_section_viewed',
              trigger: 'IntersectionObserver atinge seção',
              payload: "{ section_id, component_name: 'pagination', locale }",
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
  let observer: IntersectionObserver | null = null;
  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          updateActiveNav(sectionId);
          track('docs_section_viewed', {
            section_id: sectionId,
            component_name: 'pagination',
            locale: getLocale(),
          });
          break;
        }
      }
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    for (const id of sectionOrder) {
      const el = sectionEls[id];
      if (el) observer.observe(el);
    }
  }
  cleanups.push(() => observer?.disconnect());

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
