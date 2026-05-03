import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createNavigationMenu } from '@/components/ui/navigation-menu';
import uiTranslations from '@/i18n/ui.json';
import navigationMenuTranslations from '@shared/content/navigation-menu/translations.json';

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
const { t, subscribe } = createTranslation(navigationMenuTranslations as Record<string, unknown>);

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

function buildDemoNav(): HTMLElement {
  const nav = createNavigationMenu([
    { label: 'Início', href: '/' },
    {
      label: 'Produtos',
      children: [
        { label: 'Plano Inicial',     href: '/produtos/inicial',     description: 'Para times pequenos.'  },
        { label: 'Plano Profissional', href: '/produtos/profissional', description: 'Empresas em crescimento.' },
        { label: 'Plano Empresarial',  href: '/produtos/empresarial',  description: 'Recursos avançados.' },
      ],
    },
    {
      label: 'Soluções',
      children: [
        { label: 'Para Marketing', href: '/solucoes/marketing' },
        { label: 'Para Vendas',    href: '/solucoes/vendas'    },
        { label: 'Para Suporte',   href: '/solucoes/suporte'   },
      ],
    },
    { label: 'Sobre', href: '/sobre' },
  ]);
  nav.setAttribute('aria-label', 'Navegação principal');
  return nav;
}

// ─── createNavigationMenuDocs ─────────────────────────────────────────────────

export function createNavigationMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'navigation-menu',
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
      component_name: 'navigation-menu',
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
      installNote: 'npx shadcn@latest add navigation-menu',
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
            wrap.className = 'flex items-start justify-center w-full min-h-[220px] p-2';
            wrap.appendChild(buildDemoNav());
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: ['trigger', 'link', 'ariaLabel', 'currentPage'].map(key => ({
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
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
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
                wrap.className = 'flex items-start justify-center';
                const nav = createNavigationMenu([
                  { label: 'Início',   href: '/' },
                  { label: 'Produtos', href: '/produtos' },
                  { label: 'Sobre',    href: '/sobre' },
                ]);
                nav.setAttribute('aria-label', 'Navegação principal');
                const home = nav.querySelector<HTMLAnchorElement>('a[href="/"]');
                if (home) {
                  home.setAttribute('aria-current', 'page');
                  home.classList.add('bg-accent', 'text-accent-foreground');
                }
                wrap.appendChild(nav);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-start justify-center';
                const nav = createNavigationMenu([
                  { label: 'Item 1', href: '/1' },
                  { label: 'Item 2', href: '/2' },
                ]);
                // Dont: remove aria-label
                nav.removeAttribute('aria-label');
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
                wrap.className = 'flex items-start justify-center';
                const nav = createNavigationMenu([
                  {
                    label: 'Soluções',
                    children: [
                      { label: 'Para Marketing', href: '/m' },
                      { label: 'Para Vendas',    href: '/v' },
                      { label: 'Para Suporte',   href: '/s' },
                      { label: 'Para Sucesso',   href: '/c' },
                    ],
                  },
                ]);
                nav.setAttribute('aria-label', 'Navegação principal');
                wrap.appendChild(nav);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex flex-col items-center text-xs text-muted-foreground italic gap-1';
                const note = document.createElement('p');
                note.textContent = 'Mega-menu com 30+ links sem agrupamento (anti-padrão).';
                wrap.appendChild(note);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createNavigationMenu } from '@/components/ui/navigation-menu';`,
        });

      case 'variantes': {
        const codeHorizontal = `const nav = createNavigationMenu([
  { label: 'Início', href: '/' },
  {
    label: 'Produtos',
    children: [
      { label: 'Plano Inicial',     href: '/produtos/inicial' },
      { label: 'Plano Profissional', href: '/produtos/profissional' },
    ],
  },
  { label: 'Sobre', href: '/sobre' },
]);
nav.setAttribute('aria-label', 'Navegação principal');`;

        const codeVertical = `// DIVERGÊNCIA IDIOMÁTICA:
// O factory Basecoat fixa orientação horizontal — para vertical,
// aplicamos classes Tailwind manualmente no <ul role="menubar">.
const nav = createNavigationMenu([
  { label: 'Início',      href: '/' },
  { label: 'Dashboard',   href: '/dashboard' },
  { label: 'Configurações', href: '/configuracoes' },
]);
nav.setAttribute('aria-label', 'Navegação lateral');
nav.classList.add('flex-col', 'items-stretch');
const ul = nav.querySelector('ul[role="menubar"]');
ul?.setAttribute('aria-orientation', 'vertical');
ul?.classList.replace('items-center', 'items-stretch');
ul?.classList.replace('space-x-1', 'space-y-1');
ul?.classList.add('flex-col');`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.horizontal'),
              description: stripHtml(t('variants.styles.horizontal')),
              code: codeHorizontal,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-start justify-center min-h-[140px]';
                wrap.appendChild(buildDemoNav());
                return wrap;
              },
            },
            {
              name: t('variants.items.vertical'),
              description:
                stripHtml(t('variants.styles.vertical')) +
                ' (Não suportado nativamente pelo factory Basecoat — composição manual.)',
              code: codeVertical,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'flex items-start justify-center min-h-[200px]';
                const nav = createNavigationMenu([
                  { label: 'Início',     href: '/' },
                  { label: 'Dashboard',  href: '/dashboard' },
                  { label: 'Configurações', href: '/configuracoes' },
                ]);
                nav.setAttribute('aria-label', 'Navegação lateral');
                nav.classList.add('flex-col', 'items-stretch');
                const ul = nav.querySelector<HTMLElement>('ul[role="menubar"]');
                if (ul) {
                  ul.setAttribute('aria-orientation', 'vertical');
                  ul.className =
                    'group flex flex-col list-none items-stretch space-y-1 w-full max-w-[220px]';
                }
                wrap.appendChild(nav);
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
            { label: t('states.items.closed'), trigger: 'estado inicial',         behavior: stripHtml(t('states.descriptions.closed')) },
            { label: t('states.items.open'),   trigger: 'click no Trigger',       behavior: stripHtml(t('states.descriptions.open'))   },
            { label: t('states.items.active'), trigger: 'aria-current="page"',    behavior: stripHtml(t('states.descriptions.active')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createNavigationMenu(items, options?)
export type NavigationMenuChild = {
  label: string;
  href: string;
  description?: string;
};

export type NavigationMenuItem = {
  label: string;
  href?: string;
  children?: NavigationMenuChild[];
};

export function createNavigationMenu(
  items: NavigationMenuItem[],
  options?: { class?: string },
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
              title: 'createNavigationMenu(items, options?)',
              cols: propsCols,
              items: [
                { name: 'items',         type: 'NavigationMenuItem[]',                defaultValue: '—',          required: 'Sim', description: 'Lista de items (label + href ou children) renderizados na barra.' },
                { name: 'options.class', type: 'string',                              defaultValue: '—',          required: 'Não', description: 'Classes adicionais no Root <nav>.' },
                { name: 'value',         type: 'string',                              defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.value.description'))         + ' NOTA: factory Basecoat não tem controle externo nativo.' },
                { name: 'onValueChange', type: '(value: string) => void',             defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.onValueChange.description')) + ' NOTA: factory Basecoat não emite (use child.onClick manual).' },
                { name: 'defaultValue',  type: 'string',                              defaultValue: '—',          required: 'Não', description: stripHtml(t('props.table.defaultValue.description'))  + ' NOTA: factory Basecoat sempre inicia fechado.' },
                { name: 'delayDuration',     type: 'number',                          defaultValue: '200',        required: 'Não', description: stripHtml(t('props.table.delayDuration.description'))     + ' NOTA: factory Basecoat abre apenas em click; hover delay não implementado.' },
                { name: 'skipDelayDuration', type: 'number',                          defaultValue: '300',        required: 'Não', description: stripHtml(t('props.table.skipDelayDuration.description')) + ' NOTA: factory Basecoat não implementa.' },
                { name: 'orientation',       type: "'horizontal' | 'vertical'",        defaultValue: "'horizontal'", required: 'Não', description: stripHtml(t('props.table.orientation.description'))       + ' NOTA: factory Basecoat fixa horizontal; vertical via composição manual.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            t('props.extensibilityCode') +
            '\n\n// NOTA Basecoat: o factory custom NÃO possui Viewport compartilhado nem\n// NavigationMenuIndicator. Cada Content abre em <div> próprio relativo ao\n// Trigger (semelhante a um DropdownMenu). Para Viewport animado e indicador,\n// utilize as stacks React/Vue/Svelte que possuem base-ui/reka-ui/bits-ui.',
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
            { token: '--background',  value: t('tokens.table.rootBg.class'),         description: t('tokens.table.rootBg.part')         },
            { token: '--accent',      value: t('tokens.table.triggerHover.class'),   description: t('tokens.table.triggerHover.part')   },
            { token: '--accent',      value: t('tokens.table.linkActive.class'),     description: t('tokens.table.linkActive.part')     },
            { token: '--popover',     value: t('tokens.table.viewportBg.class'),     description: t('tokens.table.viewportBg.part')     },
            { token: '--foreground',  value: t('tokens.table.viewportBorder.class'), description: t('tokens.table.viewportBorder.part') },
            { token: '--shadow',      value: t('tokens.table.viewportShadow.class'), description: t('tokens.table.viewportShadow.part') },
            { token: '--radius',      value: t('tokens.table.rounded.class'),        description: t('tokens.table.rounded.part')        },
            { token: '--popover',     value: t('tokens.table.indicator.class'),     description: t('tokens.table.indicator.part')      },
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
            { key: 'Tab',          description: stripHtml(t('accessibility.keyboard.tab'))     },
            { key: '← / → / ↑ / ↓', description: stripHtml(t('accessibility.keyboard.arrows')) },
            { key: 'Enter/Space',  description: stripHtml(t('accessibility.keyboard.enter'))   },
            { key: 'Esc',          description: stripHtml(t('accessibility.keyboard.escape'))  },
            { key: 'Home/End',     description: stripHtml(t('accessibility.keyboard.homeEnd')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.menubar.name'),    description: t('related.items.menubar.description'),    path: '?path=/docs/ui-menubar--docs'    },
            { name: t('related.items.sidebar.name'),    description: t('related.items.sidebar.description'),    path: '?path=/docs/ui-sidebar--docs'    },
            { name: t('related.items.breadcrumb.name'), description: t('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
            { name: t('related.items.tabs.name'),       description: t('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5, 6].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
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
              event: 'nav_menu_open',
              trigger: 'click no Trigger / onValueChange',
              payload: "{ component: 'navigation-menu', label, location }",
            },
            {
              event: 'nav_link_click',
              trigger: 'click em NavigationMenuLink',
              payload: "{ component: 'navigation-menu', label, destination }",
            },
            {
              event: '—',
              trigger: stripHtml(t('analytics.description')),
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
            component_name: 'navigation-menu',
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
