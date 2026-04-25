import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
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
const { t, subscribe } = createTranslation(sidebarTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

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
  svg.innerHTML = sanitizeHtml(path);
  return svg;
}

const ICON_HOME     = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
const ICON_LAYOUT   = '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>';
const ICON_SETTINGS = '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>';
const ICON_USER     = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
const ICON_TOKENS   = '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>';

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
  });
  const inner = instance.element.querySelector('[data-sidebar="sidebar"]')!;

  const header = createSidebarHeader();
  const logoRow = document.createElement('div');
  logoRow.className = 'px-2 py-1 text-xs font-semibold text-sidebar-foreground';
  logoRow.textContent = 'App';
  header.appendChild(logoRow);
  inner.appendChild(header);

  const content = createSidebarContent();

  const items = [
    { label: t('demonstration.labels.dashboard'),   icon: ICON_HOME,     key: 'Dashboard' },
    { label: t('demonstration.labels.components'),  icon: ICON_LAYOUT,   key: 'Componentes' },
    { label: t('demonstration.labels.tokens'),      icon: ICON_TOKENS,   key: 'Tokens' },
    { label: t('demonstration.labels.settings'),    icon: ICON_SETTINGS, key: 'Configurações' },
  ];

  if (opts.withGroups) {
    content.appendChild(
      createSidebarGroup({
        label: t('demonstration.labels.mainNav'),
        items: items.map(item => ({
          label: item.label,
          icon: makeIcon(item.icon),
          active: (opts.activeItem ?? 'Dashboard') === item.key,
          href: '#',
        })),
      }),
    );
    content.appendChild(createSidebarSeparator());
    content.appendChild(
      createSidebarGroup({
        items: [
          { label: t('demonstration.labels.profile'), icon: makeIcon(ICON_USER), href: '#' },
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
        })),
      }),
    );
  }

  inner.appendChild(content);

  const footer = createSidebarFooter();
  const userRow = document.createElement('div');
  userRow.className = 'px-2 py-1 text-xs text-sidebar-foreground';
  userRow.textContent = t('demonstration.labels.profile');
  footer.appendChild(userRow);
  inner.appendChild(footer);

  const inset = document.createElement('div');
  inset.className = 'flex flex-1 flex-col';
  const topbar = document.createElement('div');
  topbar.className = 'flex h-10 items-center gap-2 border-b border-border px-3';
  topbar.appendChild(createSidebarTrigger(instance.toggle));
  const mainArea = document.createElement('div');
  mainArea.className = 'flex flex-1 items-center justify-center text-xs text-muted-foreground p-4';
  mainArea.textContent = t('demonstration.labels.dashboard');
  inset.append(topbar, mainArea);

  const wrapper = createSidebarProvider();
  wrapper.appendChild(instance.element);
  wrapper.appendChild(inset);

  const container = document.createElement('div');
  container.className = 'min-h-[300px] w-full border border-border rounded-lg overflow-hidden';
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
      { id: 'importacao',    labelKey: 'nav.import'   },
      { id: 'variantes',     labelKey: 'nav.variants' },
      { id: 'estados',       labelKey: 'nav.states'   },
      { id: 'propriedades',  labelKey: 'nav.props'    },
      { id: 'tokens',        labelKey: 'nav.tokens'   },
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
      installNote: 'npx shadcn@latest add sidebar',
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
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
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
            sanitizeHtml(t(`anatomy.item${i}`)),
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
            items: [1, 2, 3, 4, 5].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: [1, 2, 3].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
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
              doCaption:     t('doDont.pair1.do'),
              dontCaption:   t('doDont.pair1.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col gap-1 p-2';
                const label = document.createElement('div');
                label.className = 'text-xs text-sidebar-foreground/70 px-2';
                label.textContent = 'SidebarProvider';
                const item = createSidebarMenuItem({ label: t('demonstration.labels.dashboard'), icon: makeIcon(ICON_HOME), active: true });
                wrap.appendChild(label);
                wrap.appendChild(item);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col gap-1 p-2 opacity-60';
                const warning = document.createElement('div');
                warning.className = 'rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive';
                warning.textContent = 'state = { open: true } // manual';
                wrap.appendChild(warning);
                return wrap;
              },
            },
            {
              doLabel:       tNav('common.do'),
              dontLabel:     tNav('common.dont'),
              doCaption:     t('doDont.pair2.do'),
              dontCaption:   t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const item = createSidebarMenuItem({
                  label: t('demonstration.labels.dashboard'),
                  icon: makeIcon(ICON_HOME),
                  active: true,
                });
                const btn = item.querySelector('[data-sidebar="menu-button"]');
                if (btn) btn.setAttribute('aria-current', 'page');
                return item;
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
                  warning.className = 'ml-auto text-xs text-destructive';
                  warning.textContent = 'sem aria-label';
                  btn.appendChild(warning);
                }
                return item;
              },
            },
            {
              doLabel:       tNav('common.do'),
              dontLabel:     tNav('common.dont'),
              doCaption:     t('doDont.pair3.do'),
              dontCaption:   t('doDont.pair3.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-center gap-2 p-2 rounded border border-border text-xs text-muted-foreground';
                wrap.innerHTML = sanitizeHtml('<span class="font-mono">lg:hidden</span><span>SidebarTrigger</span>');
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-center gap-2 p-2 rounded border border-destructive/30 bg-destructive/10 text-xs text-destructive';
                wrap.innerHTML = sanitizeHtml('<span class="font-mono">block</span><span>SidebarTrigger no desktop</span>');
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

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'sidebar',
              description: stripHtml(t('variants.sidebar')),
              code: codeSidebar,
              previewFactory: () => buildMiniSidebar({ variant: 'sidebar' }),
            },
            {
              name: 'floating',
              description: stripHtml(t('variants.floating')),
              code: codeFloating,
              previewFactory: () => buildMiniSidebar({ variant: 'floating' }),
            },
            {
              name: 'inset',
              description: stripHtml(t('variants.inset')),
              code: codeInset,
              previewFactory: () => buildMiniSidebar({ variant: 'inset' }),
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
            trigger:  t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.expanded.label'),  trigger: stripHtml(t('states.expanded.trigger')),  behavior: t('states.expanded.behavior') },
            { label: t('states.collapsed.label'), trigger: stripHtml(t('states.collapsed.trigger')), behavior: t('states.collapsed.behavior') },
            { label: t('states.offcanvas.label'), trigger: stripHtml(t('states.offcanvas.trigger')), behavior: t('states.offcanvas.behavior') },
            { label: t('states.mobile.label'),    trigger: stripHtml(t('states.mobile.trigger')),    behavior: t('states.mobile.behavior') },
            { label: t('states.hidden.label'),    trigger: stripHtml(t('states.hidden.trigger')),    behavior: t('states.hidden.behavior') },
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
          `};`,
          ``,
          `// SidebarInstance`,
          `export type SidebarInstance = {`,
          `  element: HTMLElement;`,
          `  toggle: () => void;`,
          `  open: () => void;`,
          `  close: () => void;`,
          `  getState: () => 'expanded' | 'collapsed';`,
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
          extensibilityNotes: sanitizeHtml(t('props.extensibility')),
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
          title: t('accessibility.title'),
          summary: sanitizeHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => sanitizeHtml(t(`accessibility.item${i}`))),
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
            { name: 'NavigationMenu', description: t('related.navigationMenu'), path: '?path=/docs/ui-navigationmenu--docs' },
            { name: 'Tabs',           description: t('related.tabs'),           path: '?path=/docs/ui-tabs--docs'           },
            { name: 'Sheet',          description: t('related.sheet'),          path: '?path=/docs/ui-sheet--docs'          },
            { name: 'Accordion',      description: t('related.accordion'),      path: '?path=/docs/ui-accordion--docs'      },
            { name: 'Tooltip',        description: t('related.tooltip'),        path: '?path=/docs/ui-tooltip--docs'        },
            { name: 'Separator',      description: t('related.separator'),      path: '?path=/docs/ui-separator--docs'      },
          ],
        });

      // ── Notas ─────────────────────────────────────────────────────────────

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: sanitizeHtml(t(`notes.tip${i}`)) })),
        });

      // ── Analytics ─────────────────────────────────────────────────────────

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.navClick'),      trigger: t('analytics.table.navClickTrigger'),      payload: t('analytics.table.navClickPayload') },
            { event: t('analytics.table.toggleOpen'),    trigger: t('analytics.table.toggleOpenTrigger'),    payload: t('analytics.table.togglePayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'sidebar', locale: getLocale() });
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
