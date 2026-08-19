import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  createSidebarProvider,
  createSidebar,
  createSidebarTrigger,
  createSidebarContent,
  createSidebarHeader,
  createSidebarFooter,
  createSidebarGroup,
  createSidebarMenuItem,
  createSidebarSeparator,
} from '@/components/ui/sidebar';
import uiTranslations from '@/i18n/ui.json';
import sidebarTranslations from '@shared/content/sidebar/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsCompositions,
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (sidebarTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(sidebarTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function makeIcon(path: string, size = 16): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width',  String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill',   'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width',   '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin','round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = DOMPurify.sanitize(path);
  return svg;
}

/**
 * `<ul data-sidebar="menu">` — createSidebarMenuItem() devolve um `<li>`, que só é
 * válido dentro de uma lista (axe: listitem). Mesma classe usada por
 * createSidebarGroup, então o preview mantém o layout original.
 */
function menuList(): HTMLUListElement {
  const menu = document.createElement('ul');
  menu.className = 'nds-sidebar-menu';
  menu.setAttribute('data-sidebar', 'menu');
  return menu;
}

const ICON_HOME     = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
const ICON_LAYOUT   = '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>';
const ICON_SETTINGS = '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>';
const ICON_USER     = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
const ICON_TOKENS   = '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>';
const ICON_BELL     = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>';
const ICON_SEARCH   = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
const ICON_CHEVRON  = '<path d="m6 9 6 6 6-6"/>';

// ─── Mini sidebar preview factory ─────────────────────────────────────────────

function buildMiniSidebar(opts: {
  variant?: 'sidebar' | 'floating' | 'inset';
  defaultOpen?: boolean;
  activeItem?: string;
  withGroups?: boolean;
}): HTMLElement {
  const instance = createSidebar({
    defaultOpen: opts.defaultOpen ?? true,
    variant: opts.variant ?? 'sidebar',
    // Único mecanismo de toggle na demo é o SidebarTrigger (botão).
    onOpenChange: (open) => {
      track('sidebar_toggle', { action: open ? 'open' : 'close', trigger: 'button' });
    },
  });
  const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

  const header = createSidebarHeader();
  const logoRow = document.createElement('div');
  logoRow.className = 'nds-px-2 nds-py-1 nds-text-caption nds-font-semibold';
  logoRow.style.color = 'hsl(var(--sidebar-foreground))';
  logoRow.textContent = 'App';
  header.appendChild(logoRow);
  inner.appendChild(header);

  const content = createSidebarContent();

  const items = [
    { label: t('demonstration.labels.dashboard'),   icon: ICON_HOME,     key: 'Dashboard',     slug: 'dashboard' },
    { label: t('demonstration.labels.components'),  icon: ICON_LAYOUT,   key: 'Componentes',   slug: 'components' },
    { label: t('demonstration.labels.tokens'),      icon: ICON_TOKENS,   key: 'Tokens',        slug: 'tokens' },
    { label: t('demonstration.labels.settings'),    icon: ICON_SETTINGS, key: 'Configurações', slug: 'settings' },
  ];

  // label/destination usam a CHAVE estável do item (não o texto traduzido):
  // mesmo valor nas 4 stacks e em qualquer locale, sem fragmentar o GA4.
  const trackNav = (slug: string) => () => {
    track('navigation_click', {
      component: 'sidebar',
      label: slug,
      destination: `#${slug}`,
      location: 'docs_demo',
    });
  };

  if (opts.withGroups) {
    content.appendChild(
      createSidebarGroup({
        label: t('demonstration.labels.mainNav'),
        items: items.map(item => ({
          label: item.label,
          icon: makeIcon(item.icon),
          active: (opts.activeItem ?? 'Dashboard') === item.key,
          href: '#',
          onClick: trackNav(item.slug),
        })),
      }),
    );
    content.appendChild(createSidebarSeparator());
    content.appendChild(
      createSidebarGroup({
        items: [
          { label: t('demonstration.labels.profile'), icon: makeIcon(ICON_USER), href: '#', onClick: trackNav('profile') },
        ],
      }),
    );
  } else {
    content.appendChild(
      createSidebarGroup({
        items: items.map(item => ({
          label: item.label,
          icon: makeIcon(item.icon),
          active: (opts.activeItem ?? 'Dashboard') === item.key,
          href: '#',
          onClick: trackNav(item.slug),
        })),
      }),
    );
  }

  inner.appendChild(content);

  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'nds-px-2 nds-py-1 nds-text-caption';
  userRow.style.color = 'hsl(var(--sidebar-foreground))';
  userRow.textContent = t('demonstration.labels.profile');
  footer.appendChild(userRow);
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'nds-stack nds-flex-1';
  inset.dataset.spacing = 'xs';
  const topbar = document.createElement('div');
  topbar.className = 'nds-cluster nds-border-b nds-px-4';
  topbar.dataset.spacing = 'sm';
  topbar.dataset.align = 'center';
  topbar.style.height = '2.5rem';
  topbar.appendChild(createSidebarTrigger(instance.toggle));
  const mainArea = document.createElement('div');
  mainArea.className = 'nds-cluster nds-flex-1 nds-text-caption nds-text-muted-foreground nds-p-4';
  mainArea.dataset.align = 'center';
  mainArea.dataset.justify = 'center';
  mainArea.textContent = t('demonstration.labels.dashboard');
  inset.append(topbar, mainArea);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
  container.style.minHeight = '300px';
  container.style.contain = 'layout';
  container.appendChild(wrapper);
  return container;
}

// ─── createSidebarDocs ────────────────────────────────────────────────────────

export function createSidebarDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'sidebar',
    });
    track('docs_page_view', { component_name: 'sidebar', locale, page_title: `${t('title')} · Design System` });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    { labelKey: 'nav.overview', sections: [
      { id: 'demonstracao',  labelKey: 'nav.demonstration' },
      { id: 'anatomia',      labelKey: 'nav.anatomy'       },
      { id: 'quando-usar',   labelKey: 'nav.usage'         },
      { id: 'do-dont',       labelKey: 'nav.doDont'        },
    ]},
    { labelKey: 'nav.techRef', sections: [
      { id: 'importacao',    labelKey: 'nav.import'       },
      { id: 'variantes',     labelKey: 'nav.variants'     },
      { id: 'composicoes',   labelKey: 'nav.compositions' },
      { id: 'estados',       labelKey: 'nav.states'       },
      { id: 'propriedades',  labelKey: 'nav.props'        },
      { id: 'tokens',        labelKey: 'nav.tokens'       },
    ]},
    { labelKey: 'nav.context', sections: [
      { id: 'acessibilidade',labelKey: 'nav.accessibility' },
      { id: 'relacionados',  labelKey: 'nav.related'       },
      { id: 'notas',         labelKey: 'nav.notes'         },
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
  const root       = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main       = pageLayout.main;

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

  // ── Sections ──────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ── Demonstração ──────────────────────────────────────────────────────

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => buildMiniSidebar({ withGroups: true }),
        });

      // ── Anatomia ──────────────────────────────────────────────────────────

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(i =>
            DOMPurify.sanitize(t(`anatomy.item${i}`)),
          ),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ── Quando Usar ───────────────────────────────────────────────────────

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario:    t('usage.scenarios.cols.scenario'),
              use:         t('usage.scenarios.cols.use'),
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
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => DOMPurify.sanitize(t(`usage.dont.item${i}`))),
          },
        });

      // ── Do & Don't ────────────────────────────────────────────────────────

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:       tNav('common.do'),
              dontLabel:     tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-p-2';
                wrap.dataset.spacing = 'xs';
                const label = document.createElement('div');
                label.className = 'nds-text-caption nds-px-2';
                label.style.color = 'hsl(var(--sidebar-foreground) / 0.7)';
                label.textContent = 'SidebarProvider';
                const item = createSidebarMenuItem({ label: t('demonstration.labels.dashboard'), icon: makeIcon(ICON_HOME), active: true });
                // <li> só é válido dentro de <ul>/<ol> (axe listitem) — .nds-sidebar-menu
                // é a mesma lista usada por createSidebarGroup, sem alterar o pixel.
                const menu = menuList();
                menu.appendChild(item);
                wrap.appendChild(label);
                wrap.appendChild(menu);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-p-2';
                wrap.dataset.spacing = 'xs';
                // sem opacity: o dim rebaixava o texto destructive para 3.1:1 —
                // a borda/cor destructive já marcam o don't (axe: color-contrast)
                const warning = document.createElement('div');
                warning.className = 'nds-rounded nds-border-destructive-soft nds-bg-destructive-soft nds-px-2 nds-py-1 nds-text-caption nds-text-destructive';
                warning.textContent = 'state = { open: true } // manual';
                wrap.appendChild(warning);
                return wrap;
              },
            },
            {
              doLabel:       tNav('common.do'),
              dontLabel:     tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const item = createSidebarMenuItem({
                  label: t('demonstration.labels.dashboard'),
                  icon: makeIcon(ICON_HOME),
                  active: true,
                });
                const btn = item.querySelector('[data-sidebar="menu-button"]');
                if (btn) btn.setAttribute('aria-current', 'page');
                const menu = menuList();
                menu.appendChild(item);
                return menu;
              },
              dontPreviewFactory: () => {
                const item = createSidebarMenuItem({
                  label: '',
                  icon: makeIcon(ICON_HOME),
                  active: true,
                });
                const btn = item.querySelector('[data-sidebar="menu-button"]');
                if (btn) {
                  const warning = document.createElement('span');
                  warning.className = 'nds-text-caption nds-text-destructive';
                  warning.style.marginLeft = 'auto';
                  warning.textContent = 'sem aria-label';
                  btn.appendChild(warning);
                }
                const menu = menuList();
                menu.appendChild(item);
                return menu;
              },
            },
            {
              doLabel:       tNav('common.do'),
              dontLabel:     tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-p-2 nds-rounded nds-border-default nds-text-caption nds-text-muted-foreground';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.innerHTML = DOMPurify.sanitize('<span class="nds-font-mono">lg:hidden</span><span>SidebarTrigger</span>');
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-p-2 nds-rounded nds-border-destructive-soft nds-bg-destructive-soft nds-text-caption nds-text-destructive';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'center';
                wrap.innerHTML = DOMPurify.sanitize('<span class="nds-font-mono">block</span><span>SidebarTrigger no desktop</span>');
                return wrap;
              },
            },
          ],
        });

      // ── Importação ────────────────────────────────────────────────────────

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createSidebar, createSidebarProvider } from '@/components/ui/sidebar';`,
          secondaryDescription: t('import.withSubcomponents'),
          secondaryCode: [
            `import {`,
            `  createSidebarProvider,`,
            `  createSidebar,`,
            `  createSidebarTrigger,`,
            `  createSidebarContent,`,
            `  createSidebarHeader,`,
            `  createSidebarFooter,`,
            `  createSidebarGroup,`,
            `  createSidebarMenuItem,`,
            `  createSidebarSeparator,`,
            `} from '@/components/ui/sidebar';`,
          ].join('\n'),
        });

      // ── Variantes ─────────────────────────────────────────────────────────

      case 'variantes': {
        const codeSidebar = [
          `const instance = createSidebar({ variant: 'sidebar' });`,
          `const wrapper  = createSidebarProvider();`,
          `wrapper.appendChild(instance.element);`,
        ].join('\n');

        const codeFloating = [
          `const instance = createSidebar({ variant: 'floating' });`,
          `const wrapper  = createSidebarProvider();`,
          `wrapper.appendChild(instance.element);`,
        ].join('\n');

        const codeInset = [
          `const instance = createSidebar({ variant: 'inset' });`,
          `const wrapper  = createSidebarProvider();`,
          `wrapper.appendChild(instance.element);`,
        ].join('\n');

        function buildWithSubMenu(): HTMLElement {
          const instance = createSidebar({ defaultOpen: true });
          const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

          const header = createSidebarHeader();
          const logoRow = document.createElement('div');
          logoRow.className = 'nds-px-2 nds-py-1 nds-text-caption nds-font-semibold';
  logoRow.style.color = 'hsl(var(--sidebar-foreground))';
          logoRow.textContent = 'Design System';
          header.appendChild(logoRow);
          inner.appendChild(header);

          const content = createSidebarContent();
          const group = document.createElement('div');
          group.className = 'nds-stack nds-w-full nds-min-w-0 nds-p-2';
          group.dataset.spacing = 'xs';
          group.style.position = 'relative';
          group.setAttribute('data-sidebar', 'group');

          const groupLabel = document.createElement('div');
          groupLabel.className = 'nds-cluster nds-shrink-0 nds-rounded-md nds-px-2 nds-text-caption nds-font-medium';
          groupLabel.dataset.align = 'center';
          groupLabel.style.height = '2rem';
          groupLabel.style.color = 'hsl(var(--sidebar-foreground) / 0.7)';
          groupLabel.setAttribute('data-sidebar', 'group-label');
          groupLabel.textContent = 'Componentes';
          group.appendChild(groupLabel);

          const menu = document.createElement('ul');
          menu.className = 'nds-stack nds-w-full nds-min-w-0';
          menu.dataset.spacing = 'xs';
          menu.setAttribute('data-sidebar', 'menu');

          menu.appendChild(createSidebarMenuItem({ label: 'Dashboard', icon: makeIcon(ICON_HOME), active: true, href: '#' }));

          const parentLi = document.createElement('li');
          parentLi.style.position = 'relative';
          parentLi.setAttribute('data-sidebar', 'menu-item');

          let subOpen = false;
          const parentBtn = document.createElement('button');
          parentBtn.type = 'button';
          parentBtn.className = 'peer/menu-button nds-cluster nds-w-full nds-overflow-hidden nds-rounded-md nds-p-2 nds-text-body [&>svg]:size-4 [&>svg]:shrink-0 [&>span:last-child]:truncate';
          parentBtn.dataset.spacing = 'sm';
          parentBtn.dataset.align = 'center';
          parentBtn.style.textAlign = 'left';
          parentBtn.style.outline = 'none';
          parentBtn.style.transition = 'background-color .2s, color .2s';
          parentBtn.setAttribute('data-sidebar', 'menu-button');
          parentBtn.setAttribute('aria-expanded', 'false');
          parentBtn.appendChild(makeIcon(ICON_LAYOUT));
          const parentLabel = document.createElement('span');
          parentLabel.textContent = 'Componentes';
          parentBtn.appendChild(parentLabel);

          const chevron = makeIcon(ICON_CHEVRON, 12);
          chevron.classList.add('ml-auto', 'transition-transform', 'duration-200');
          parentBtn.appendChild(chevron);

          const subList = document.createElement('ul');
          subList.className = 'nds-mt-1 nds-stack nds-pl-4';
          subList.dataset.spacing = 'xs';
          subList.style.marginLeft = '1rem';
          subList.style.borderLeft = '1px solid var(--sidebar-border)';
          subList.setAttribute('data-sidebar', 'menu-sub');
          subList.style.display = 'none';

          ['Alert', 'Button', 'Card', 'Dialog'].forEach(name => {
            const subLi = document.createElement('li');
            subLi.setAttribute('data-sidebar', 'menu-sub-item');
            const subBtn = document.createElement('a');
            subBtn.href = '#';
            subBtn.className = 'nds-cluster nds-rounded-md nds-px-2 nds-text-caption';
            subBtn.dataset.spacing = 'sm';
            subBtn.dataset.align = 'center';
            subBtn.style.paddingBlock = '0.375rem';
            subBtn.style.color = 'hsl(var(--sidebar-foreground))';
            subBtn.style.transition = 'background-color .2s, color .2s';
            subBtn.setAttribute('data-sidebar', 'menu-sub-button');
            subBtn.textContent = name;
            subLi.appendChild(subBtn);
            subList.appendChild(subLi);
          });

          parentBtn.addEventListener('click', () => {
            subOpen = !subOpen;
            subList.style.display = subOpen ? '' : 'none';
            parentBtn.setAttribute('aria-expanded', subOpen ? 'true' : 'false');
            chevron.style.transform = subOpen ? 'rotate(180deg)' : '';
          });

          parentLi.appendChild(parentBtn);
          parentLi.appendChild(subList);
          menu.appendChild(parentLi);
          menu.appendChild(createSidebarMenuItem({ label: 'Tokens', icon: makeIcon(ICON_TOKENS), href: '#' }));

          group.appendChild(menu);
          content.appendChild(group);
          inner.appendChild(content);

          const footer = createSidebarFooter();
          const footerMenu = menuList();
          footerMenu.appendChild(createSidebarMenuItem({ label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' }));
          footer.appendChild(footerMenu);
          inner.appendChild(footer);

          const inset = document.createElement('div');
          inset.className = 'nds-stack nds-flex-1';
  inset.dataset.spacing = 'xs';
          const topbar = document.createElement('div');
          topbar.className = 'nds-cluster nds-border-b nds-px-4';
  topbar.dataset.spacing = 'sm';
  topbar.dataset.align = 'center';
  topbar.style.height = '2.5rem';
          topbar.appendChild(createSidebarTrigger(instance.toggle));
          const lbl = document.createElement('span');
          lbl.className = 'nds-text-caption nds-text-muted-foreground';
          lbl.textContent = 'Clique em "Componentes"';
          topbar.appendChild(lbl);
          inset.appendChild(topbar);

          const wrapper = createSidebarProvider();
          wrapper.appendChild(instance.element);
          wrapper.appendChild(inset);
          const container = document.createElement('div');
          container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
          container.style.minHeight = '260px';
          container.style.contain = 'layout';
          container.appendChild(wrapper);
          return container;
        }
        function buildWithBadges(): HTMLElement {
          const instance = createSidebar({ defaultOpen: true });
          const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

          const header = createSidebarHeader();
          const logoRow = document.createElement('div');
          logoRow.className = 'nds-px-2 nds-py-1 nds-text-caption nds-font-semibold';
  logoRow.style.color = 'hsl(var(--sidebar-foreground))';
          logoRow.textContent = 'App';
          header.appendChild(logoRow);
          inner.appendChild(header);

          const content = createSidebarContent();
          content.appendChild(createSidebarGroup({
            items: [
              { label: 'Dashboard',     icon: makeIcon(ICON_HOME),     active: true, href: '#' },
              { label: 'Notificações',  icon: makeIcon(ICON_BELL),     href: '#', badge: '12' },
              { label: 'Componentes',   icon: makeIcon(ICON_LAYOUT),   href: '#', badge: '3'  },
              { label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' },
            ],
          }));
          inner.appendChild(content);

          const inset = document.createElement('div');
          inset.className = 'nds-stack nds-flex-1';
  inset.dataset.spacing = 'xs';
          const topbar = document.createElement('div');
          topbar.className = 'nds-cluster nds-border-b nds-px-4';
  topbar.dataset.spacing = 'sm';
  topbar.dataset.align = 'center';
  topbar.style.height = '2.5rem';
          topbar.appendChild(createSidebarTrigger(instance.toggle));
          const lbl = document.createElement('span');
          lbl.className = 'nds-text-caption nds-text-muted-foreground';
          lbl.textContent = 'Inbox';
          topbar.appendChild(lbl);
          inset.appendChild(topbar);

          const wrapper = createSidebarProvider();
          wrapper.appendChild(instance.element);
          wrapper.appendChild(inset);
          const container = document.createElement('div');
          container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
          container.style.minHeight = '260px';
          container.style.contain = 'layout';
          container.appendChild(wrapper);
          return container;
        }
        const codeWithSubMenu = [
          `// SidebarMenuSub manual: <ul data-sidebar="menu-sub"> aninhada num <li>`,
          `let open = false;`,
          `const parentBtn = document.createElement('button');`,
          `parentBtn.setAttribute('data-sidebar', 'menu-button');`,
          `parentBtn.setAttribute('aria-expanded', 'false');`,
          `// ... ícone + label + chevron`,
          ``,
          `const subList = document.createElement('ul');`,
          `subList.setAttribute('data-sidebar', 'menu-sub');`,
          `subList.style.display = 'none';`,
          ``,
          `parentBtn.addEventListener('click', () => {`,
          `  open = !open;`,
          `  subList.style.display = open ? '' : 'none';`,
          `  parentBtn.setAttribute('aria-expanded', String(open));`,
          `});`,
        ].join('\n');
        const codeWithBadges = [
          `content.appendChild(createSidebarGroup({`,
          `  items: [`,
          `    { label: 'Dashboard',    icon: makeIcon(ICON_HOME),   active: true, href: '#' },`,
          `    { label: 'Notificações', icon: makeIcon(ICON_BELL),   href: '#', badge: '12' },`,
          `    { label: 'Componentes',  icon: makeIcon(ICON_LAYOUT), href: '#', badge: '3'  },`,
          `  ],`,
          `}));`,
        ].join('\n');

        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'sidebar',
          items: [
            {
              name: 'sidebar',
              description: stripHtml(t('variants.items.sidebar')),
              code: codeSidebar,
              previewFactory: () => buildMiniSidebar({ variant: 'sidebar' }),
            },
            {
              name: 'floating',
              description: stripHtml(t('variants.items.floating')),
              code: codeFloating,
              previewFactory: () => buildMiniSidebar({ variant: 'floating' }),
            },
            {
              name: 'inset',
              description: stripHtml(t('variants.items.inset')),
              code: codeInset,
              previewFactory: () => buildMiniSidebar({ variant: 'inset' }),
            },
            {
              name: stripHtml(t('variants.items.withSubMenu.name')),
              trackId: 'withSubMenu',
              description: stripHtml(t('variants.items.withSubMenu.description')),
              useWhen: stripHtml(t('variants.items.withSubMenu.use')),
              code: codeWithSubMenu,
              previewFactory: buildWithSubMenu,
            },
            {
              name: stripHtml(t('variants.items.withBadges.name')),
              trackId: 'withBadges',
              description: stripHtml(t('variants.items.withBadges.description')),
              useWhen: stripHtml(t('variants.items.withBadges.use')),
              code: codeWithBadges,
              previewFactory: buildWithBadges,
            },
          ],
        });
      }

      // ── Composições ───────────────────────────────────────────────────────

      case 'composicoes': {
        function buildWithGroups(): HTMLElement {
          const instance = createSidebar({ defaultOpen: true });
          const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

          const header = createSidebarHeader();
          const logoRow = document.createElement('div');
          logoRow.className = 'nds-px-2 nds-py-1 nds-text-caption nds-font-semibold';
  logoRow.style.color = 'hsl(var(--sidebar-foreground))';
          logoRow.textContent = 'Design System';
          header.appendChild(logoRow);
          inner.appendChild(header);

          const content = createSidebarContent();
          content.appendChild(createSidebarGroup({
            label: 'Principal',
            items: [
              { label: 'Dashboard',   icon: makeIcon(ICON_HOME),     active: true, href: '#' },
              { label: 'Componentes', icon: makeIcon(ICON_LAYOUT),   href: '#' },
              { label: 'Tokens',      icon: makeIcon(ICON_TOKENS),   href: '#' },
            ],
          }));
          content.appendChild(createSidebarSeparator());
          content.appendChild(createSidebarGroup({
            label: 'Conta',
            items: [
              { label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' },
              { label: 'Notificações',  icon: makeIcon(ICON_BELL),     href: '#', badge: '5' },
              { label: 'Perfil',        icon: makeIcon(ICON_USER),     href: '#' },
            ],
          }));
          inner.appendChild(content);

          const inset = document.createElement('div');
          inset.className = 'nds-stack nds-flex-1';
  inset.dataset.spacing = 'xs';
          const topbar = document.createElement('div');
          topbar.className = 'nds-cluster nds-border-b nds-px-4';
  topbar.dataset.spacing = 'sm';
  topbar.dataset.align = 'center';
  topbar.style.height = '2.5rem';
          topbar.appendChild(createSidebarTrigger(instance.toggle));
          const lbl = document.createElement('span');
          lbl.className = 'nds-text-caption nds-text-muted-foreground';
          lbl.textContent = 'Dashboard';
          topbar.appendChild(lbl);
          inset.appendChild(topbar);

          const wrapper = createSidebarProvider();
          wrapper.appendChild(instance.element);
          wrapper.appendChild(inset);
          const container = document.createElement('div');
          container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
          container.style.minHeight = '260px';
          container.style.contain = 'layout';
          container.appendChild(wrapper);
          return container;
        }

        function buildWithSearch(): HTMLElement {
          const instance = createSidebar({ defaultOpen: true });
          const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

          const header = createSidebarHeader();
          const logoRow = document.createElement('div');
          logoRow.className = 'nds-px-2 nds-py-1 nds-text-caption nds-font-semibold';
  logoRow.style.color = 'hsl(var(--sidebar-foreground))';
          logoRow.textContent = 'Design System';
          header.appendChild(logoRow);

          const searchWrapper = document.createElement('div');
          searchWrapper.style.position = 'relative';
          searchWrapper.style.paddingInline = 'var(--spacing-1)';
          searchWrapper.style.paddingBottom = 'var(--spacing-1)';
          searchWrapper.setAttribute('data-sidebar', 'input');
          const searchIcon = makeIcon(ICON_SEARCH, 14);
          searchIcon.classList.add('nds-icon-input-start', 'nds-icon-sm', 'nds-text-muted-foreground');
          const searchInput = document.createElement('input');
          searchInput.type = 'search';
          searchInput.placeholder = 'Buscar...';
          searchInput.setAttribute('aria-label', 'Buscar navegação');
          searchInput.className = 'nds-w-full nds-rounded-md nds-px-2 nds-text-caption nds-pl-8';
          searchInput.style.border = '1px solid var(--sidebar-border)';
          searchInput.style.background = 'var(--sidebar)';
          searchInput.style.paddingBlock = '0.375rem';
          searchInput.style.color = 'hsl(var(--sidebar-foreground))';
          searchWrapper.appendChild(searchIcon);
          searchWrapper.appendChild(searchInput);
          header.appendChild(searchWrapper);

          inner.appendChild(header);

          const content = createSidebarContent();
          content.appendChild(createSidebarGroup({
            label: 'Navegação',
            items: [
              { label: 'Dashboard',     icon: makeIcon(ICON_HOME),     active: true, href: '#' },
              { label: 'Componentes',   icon: makeIcon(ICON_LAYOUT),   href: '#' },
              { label: 'Tokens',        icon: makeIcon(ICON_TOKENS),   href: '#' },
              { label: 'Configurações', icon: makeIcon(ICON_SETTINGS), href: '#' },
            ],
          }));
          inner.appendChild(content);

          const inset = document.createElement('div');
          inset.className = 'nds-stack nds-flex-1';
  inset.dataset.spacing = 'xs';
          const topbar = document.createElement('div');
          topbar.className = 'nds-cluster nds-border-b nds-px-4';
  topbar.dataset.spacing = 'sm';
  topbar.dataset.align = 'center';
  topbar.style.height = '2.5rem';
          topbar.appendChild(createSidebarTrigger(instance.toggle));
          const lbl = document.createElement('span');
          lbl.className = 'nds-text-caption nds-text-muted-foreground';
          lbl.textContent = 'Busca no header';
          topbar.appendChild(lbl);
          inset.appendChild(topbar);

          const wrapper = createSidebarProvider();
          wrapper.appendChild(instance.element);
          wrapper.appendChild(inset);
          const container = document.createElement('div');
          container.className = 'nds-w-full nds-border-default nds-rounded-lg nds-overflow-hidden';
          container.style.minHeight = '260px';
          container.style.contain = 'layout';
          container.appendChild(wrapper);
          return container;
        }

        const codeWithGroups = [
          `const instance = createSidebar({ defaultOpen: true });`,
          `const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;`,
          ``,
          `const content = createSidebarContent();`,
          `content.appendChild(createSidebarGroup({`,
          `  label: 'Principal',`,
          `  items: [`,
          `    { label: 'Dashboard',   icon: makeIcon(ICON_HOME),     active: true, href: '#' },`,
          `    { label: 'Componentes', icon: makeIcon(ICON_LAYOUT),   href: '#' },`,
          `    { label: 'Tokens',      icon: makeIcon(ICON_TOKENS),   href: '#' },`,
          `  ],`,
          `}));`,
          `content.appendChild(createSidebarSeparator());`,
          `content.appendChild(createSidebarGroup({`,
          `  label: 'Conta',`,
          `  items: [`,
          `    { label: 'Notificações', icon: makeIcon(ICON_BELL),    href: '#', badge: '5' },`,
          `  ],`,
          `}));`,
          `inner.appendChild(content);`,
        ].join('\n');

        const codeWithSearch = [
          `const searchWrapper = document.createElement('div');`,
          `searchWrapper.setAttribute('data-sidebar', 'input');`,
          `searchWrapper.style.position = 'relative';`,
          `searchWrapper.style.paddingInline = 'var(--spacing-1)';`,
          `searchWrapper.style.paddingBottom = 'var(--spacing-1)';`,
          ``,
          `const icon = makeIcon(ICON_SEARCH, 14);`,
          `icon.classList.add('nds-icon-input-start', 'nds-icon-sm', 'nds-text-muted-foreground');`,
          ``,
          `const input = document.createElement('input');`,
          `input.type = 'search';`,
          `input.placeholder = 'Buscar...';`,
          `input.setAttribute('aria-label', 'Buscar navegação');`,
          `input.className = 'nds-w-full nds-rounded-md nds-px-2 nds-text-caption';\ninput.style.border = '1px solid var(--sidebar-border)';\ninput.style.background = 'var(--sidebar)';`,
          ``,
          `searchWrapper.append(icon, input);`,
          `header.appendChild(searchWrapper);`,
        ].join('\n');

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'sidebar',
          items: [
            {
              name: stripHtml(t('variants.compositions.withGroups.name')),
              description: stripHtml(t('variants.compositions.withGroups.description')),
              useWhen: stripHtml(t('variants.compositions.withGroups.use')),
              code: codeWithGroups,
              previewFactory: buildWithGroups,
            },
            {
              name: stripHtml(t('variants.compositions.withSearch.name')),
              description: stripHtml(t('variants.compositions.withSearch.description')),
              useWhen: stripHtml(t('variants.compositions.withSearch.use')),
              code: codeWithSearch,
              previewFactory: buildWithSearch,
            },
          ],
        });
      }

      // ── Estados ───────────────────────────────────────────────────────────

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.expanded.label'),  trigger: toPlainText(t('states.expanded.trigger')),  behavior: toPlainText(t('states.expanded.behavior'))},
            { label: t('states.collapsed.label'), trigger: toPlainText(t('states.collapsed.trigger')), behavior: toPlainText(t('states.collapsed.behavior'))},
            { label: t('states.collapsedOffcanvas.label'), trigger: toPlainText(t('states.collapsedOffcanvas.trigger')), behavior: toPlainText(t('states.collapsedOffcanvas.behavior'))},
            { label: t('states.mobile.label'),    trigger: toPlainText(t('states.mobile.trigger')),    behavior: toPlainText(t('states.mobile.behavior'))},
            { label: t('states.hidden.label'),    trigger: toPlainText(t('states.hidden.trigger')),    behavior: toPlainText(t('states.hidden.behavior'))},
          ],
        });

      // ── Propriedades ──────────────────────────────────────────────────────

      case 'propriedades': {
        const interfaceCode = [
          `// createSidebarProvider(options)`,
          `export type SidebarProviderOptions = { children?: HTMLElement };`,
          ``,
          `// createSidebar(options) → SidebarInstance`,
          `export type SidebarOptions = {`,
          `  defaultOpen?: boolean;    // default: true`,
          `  side?: 'left' | 'right';  // default: 'left'`,
          `  variant?: 'sidebar' | 'floating' | 'inset'; // default: 'sidebar'`,
          `  onOpenChange?: (open: boolean) => void;`,
          `  class?: string;`,
          `  // Ponto de virada entre coluna e gaveta sobreposta.`,
          `  mobileQuery?: string;     // default: '(max-width: 767px)'`,
          `  mobileTitle?: string;     // nome da gaveta para leitor de tela`,
          `  mobileDescription?: string;`,
          `  onMobileOpenChange?: (open: boolean) => void;`,
          `};`,
          ``,
          `// SidebarInstance`,
          `export type SidebarInstance = {`,
          `  element: HTMLElement;`,
          `  toggle: () => void;`,
          `  open: () => void;`,
          `  close: () => void;`,
          `  getState: () => 'expanded' | 'collapsed';`,
          `  isMobile: () => boolean;`,
          `  isMobileOpen: () => boolean;`,
          `  destroy: () => void;`,
          `};`,
          ``,
          `// createSidebarMenuItem(options)`,
          `export type SidebarMenuItemOptions = {`,
          `  label: string;`,
          `  icon?: SVGElement | HTMLElement;`,
          `  href?: string;`,
          `  active?: boolean;`,
          `  disabled?: boolean;`,
          `  onClick?: () => void;`,
          `  badge?: string;`,
          `};`,
        ].join('\n');

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.providerTitle'),
              cols:  propsCols,
              items: [
                { name: 'children', type: 'HTMLElement', defaultValue: '—',    required: 'Não', description: stripHtml(t('props.provider.children')) },
              ],
            },
            {
              title: t('props.sidebarTitle'),
              cols:  propsCols,
              items: [
                { name: 'defaultOpen',   type: 'boolean',                               defaultValue: 'true',        required: 'Não', description: stripHtml(t('props.provider.defaultOpen')) },
                { name: 'side',          type: '"left" | "right"',                      defaultValue: '"left"',       required: 'Não', description: stripHtml(t('props.sidebar.side')) },
                { name: 'variant',       type: '"sidebar" | "floating" | "inset"',       defaultValue: '"sidebar"',    required: 'Não', description: stripHtml(t('props.sidebar.variant')) },
                { name: 'onOpenChange',  type: '(open: boolean) => void',               defaultValue: '—',            required: 'Não', description: stripHtml(t('props.provider.onOpenChange')) },
                // O NOME sai do conteúdo compartilhado porque a forma diverge
                // por linguagem de framework; tipo e padrão são desta stack.
                { name: t('props.provider.mobileQueryName'), type: 'string', defaultValue: `'(max-width: 767px)'`, required: 'Não', description: stripHtml(t('props.provider.mobileQuery')) },
                { name: 'mobileTitle',       type: 'string', defaultValue: `'Barra lateral'`,                                required: 'Não', description: stripHtml(t('props.sidebar.mobileTitle')) },
                { name: 'mobileDescription', type: 'string', defaultValue: `'Exibe a barra lateral como gaveta sobreposta.'`, required: 'Não', description: stripHtml(t('props.sidebar.mobileDescription')) },
              ],
            },
            {
              title: t('props.menuButtonTitle'),
              cols:  propsCols,
              items: [
                { name: 'label',    type: 'string',             defaultValue: '—',       required: 'Sim', description: 'Texto do item de menu.' },
                { name: 'icon',     type: 'SVGElement',         defaultValue: '—',       required: 'Não', description: 'Ícone exibido à esquerda do label.' },
                { name: 'href',     type: 'string',             defaultValue: '—',       required: 'Não', description: 'Se fornecido, renderiza como <code>&lt;a&gt;</code> em vez de <code>&lt;button&gt;</code>.' },
                { name: 'active',   type: 'boolean',            defaultValue: 'false',   required: 'Não', description: stripHtml(t('props.menuButton.isActive')) },
                { name: 'disabled', type: 'boolean',            defaultValue: 'false',   required: 'Não', description: 'Desabilita o item. Aplica opacidade reduzida.' },
                { name: 'badge',    type: 'string',             defaultValue: '—',       required: 'Não', description: 'Texto do badge exibido à direita do label.' },
                { name: 'onClick',  type: '() => void',         defaultValue: '—',       required: 'Não', description: 'Callback de clique quando usado como botão.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: DOMPurify.sanitize(t('props.extensibility')),
        });
      }

      // ── Tokens ────────────────────────────────────────────────────────────

      case 'tokens': {
        const customizationCode = [
          `/* Em styles.css — sobrescrever tokens da sidebar */`,
          `:root {`,
          `  --sidebar-width: 18rem;          /* desktop expandido */`,
          `  --sidebar-width-icon: 4rem;       /* modo icon */`,
          `  --sidebar-width-mobile: 20rem;    /* Sheet mobile */`,
          `}`,
          ``,
          `.dark {`,
          `  --sidebar: 224 71.4% 4.1%;`,
          `  --sidebar-foreground: 210 20% 98%;`,
          `  --sidebar-accent: 215.4 16.3% 46.9%;`,
          `}`,
        ].join('\n');

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--sidebar',                  value: 'bg-sidebar',              description: t('tokens.sidebarBg') },
            { token: '--sidebar-foreground',        value: 'text-sidebar-foreground', description: t('tokens.sidebarFg') },
            { token: '--sidebar-border',            value: 'border-sidebar-border',   description: t('tokens.sidebarBorder') },
            { token: '--sidebar-accent',            value: 'bg-sidebar-accent',       description: t('tokens.sidebarAccent') },
            { token: '--sidebar-accent-foreground', value: 'text-sidebar-accent-foreground', description: t('tokens.sidebarAccentFg') },
            { token: '--sidebar-ring',              value: 'ring-sidebar-ring',        description: t('tokens.sidebarRing') },
            { token: '--sidebar-width',             value: '16rem (default)',          description: t('tokens.sidebarWidth') },
            { token: '--sidebar-width-icon',        value: '3rem (default)',           description: t('tokens.sidebarWidthIcon') },
            { token: '--sidebar-width-mobile',      value: '18rem (default)',          description: t('tokens.sidebarWidthMobile') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      // ── Acessibilidade ────────────────────────────────────────────────────

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: DOMPurify.sanitize(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => DOMPurify.sanitize(t(`accessibility.item${i}`))),
          keyboardTitle: 'Atalhos de teclado',
          keyboardItems: [
            { key: 'Tab',        description: t('accessibility.keyboard.tab') },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Enter',      description: t('accessibility.keyboard.enter') },
            { key: 'Space',      description: t('accessibility.keyboard.space') },
            { key: 'Escape',     description: t('accessibility.keyboard.escape') },
            { key: 'Ctrl+B',     description: t('accessibility.keyboard.ctrlB') },
          ],
        });

      // ── Relacionados ──────────────────────────────────────────────────────

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'NavigationMenu', description: toPlainText(t('related.navigationMenu')), path: '?path=/docs/ui-navigationmenu--docs' },
            { name: 'Tabs',           description: toPlainText(t('related.tabs')),           path: '?path=/docs/ui-tabs--docs'           },
            { name: 'Sheet',          description: toPlainText(t('related.sheet')),          path: '?path=/docs/ui-sheet--docs'          },
            { name: 'Accordion',      description: toPlainText(t('related.accordion')),      path: '?path=/docs/ui-accordion--docs'      },
            { name: 'Tooltip',        description: toPlainText(t('related.tooltip')),        path: '?path=/docs/ui-tooltip--docs'        },
            { name: 'Separator',      description: toPlainText(t('related.separator')),      path: '?path=/docs/ui-separator--docs'      },
          ],
        });

      // ── Notas ─────────────────────────────────────────────────────────────

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: DOMPurify.sanitize(t(`notes.tip${i}`)) })),
        });

      // ── Analytics ─────────────────────────────────────────────────────────

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.navClick'),      trigger: toPlainText(t('analytics.table.navClickTrigger')),      payload: t('analytics.table.navClickPayload') },
            { event: t('analytics.table.toggleOpen'),    trigger: toPlainText(t('analytics.table.toggleOpenTrigger')),    payload: t('analytics.table.togglePayload') },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload') },
          ],
        });

      // ── Testes ────────────────────────────────────────────────────────────

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
              action:   t(`testes.functional.item${i}.action`),
              result:   t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level:     t(`testes.accessibility.item${i}.level`),
              how:       t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderAllSections() {
    for (const id of sectionOrder) {
      const fresh    = buildSection(id);
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
        component_name: 'sidebar',
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
