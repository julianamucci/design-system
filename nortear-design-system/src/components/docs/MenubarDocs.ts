import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createMenubar } from '@/components/ui/menubar';
import uiTranslations from '@/i18n/ui.json';
import menubarTranslations from '@shared/content/menubar/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
  createDocsVariants,
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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);
const { t, subscribe } = createTranslation(menubarTranslations as Record<string, unknown>);

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

function buildDemoMenubar(): HTMLElement {
  const bar = createMenubar([
    {
      label: 'Arquivo',
      items: [
        { type: 'item', label: 'Novo',     shortcut: '⌘N' },
        { type: 'item', label: 'Abrir',    shortcut: '⌘O' },
        { type: 'item', label: 'Salvar',   shortcut: '⌘S' },
        { type: 'separator' },
        { type: 'item', label: 'Sair',     shortcut: '⌘Q' },
      ],
    },
    {
      label: 'Editar',
      items: [
        { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
        { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
        { type: 'separator' },
        { type: 'item', label: 'Recortar', shortcut: '⌘X' },
        { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
        { type: 'item', label: 'Colar',    shortcut: '⌘V' },
      ],
    },
    {
      label: 'Exibir',
      items: [
        { type: 'label', label: 'Aparência' },
        { type: 'item',  label: 'Modo escuro' },
        { type: 'separator' },
        { type: 'item',  label: 'Tela cheia', shortcut: 'F11' },
      ],
    },
    {
      label: 'Ferramentas',
      items: [
        { type: 'item', label: 'Buscar',     shortcut: '⌘F' },
        { type: 'item', label: 'Substituir', shortcut: '⌘H' },
      ],
    },
  ]);
  bar.dataset.slot = 'menubar';
  return bar;
}

// ─── createMenubarDocs ────────────────────────────────────────────────────────

export function createMenubarDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'menubar',
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
      component_name: 'menubar',
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
      { id: 'importacao',   labelKey: 'nav.import'        },
      { id: 'variantes',    labelKey: 'nav.variants'      },
      { id: 'composicoes',  labelKey: 'nav.compositions'  },
      { id: 'estados',      labelKey: 'nav.states'        },
      { id: 'propriedades', labelKey: 'nav.props'         },
      { id: 'tokens',       labelKey: 'nav.tokens'        },
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
      installNote: 'npx shadcn@latest add menubar',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

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

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.style.contain = 'layout';
            wrap.className = 'nds-cluster nds-w-full';
            wrap.dataset.align = 'start';
            wrap.dataset.justify = 'center';
            wrap.style.minHeight = '200px';
            wrap.style.padding = 'var(--spacing-2)';
            wrap.appendChild(buildDemoMenubar());
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
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
            items: ['trigger', 'item', 'shortcut', 'destructive'].map(key => ({
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
                wrap.className = 'nds-cluster';
                wrap.dataset.align = 'start';
                wrap.dataset.justify = 'center';
                wrap.appendChild(
                  createMenubar([
                    { label: 'Arquivo', items: [{ type: 'item', label: 'Novo' }] },
                    { label: 'Editar',  items: [{ type: 'item', label: 'Copiar' }] },
                    { label: 'Exibir',  items: [{ type: 'item', label: 'Zoom' }] },
                  ]),
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-cluster';
                wrap.dataset.align = 'start';
                wrap.dataset.justify = 'center';
                wrap.appendChild(
                  createMenubar([
                    { label: 'Menu', items: [{ type: 'item', label: 'Ação única' }] },
                  ]),
                );
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
                wrap.className = 'nds-cluster';
                wrap.dataset.align = 'start';
                wrap.dataset.justify = 'center';
                wrap.appendChild(
                  createMenubar([
                    {
                      label: 'Arquivo',
                      items: [
                        { type: 'item', label: 'Salvar', shortcut: '⌘S' },
                        { type: 'item', label: 'Abrir',  shortcut: '⌘O' },
                      ],
                    },
                  ]),
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.contain = 'layout';
                wrap.className = 'nds-stack nds-text-caption nds-text-muted-foreground nds-italic';
                wrap.dataset.spacing = 'xs';
                wrap.style.alignItems = 'center';
                const note = document.createElement('p');
                note.textContent = 'Submenu aninhado em submenu (não-suportado pelo factory Nortear).';
                wrap.appendChild(note);
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createMenubar } from '@/components/ui/menubar';`,
        });

      case 'variantes': {
        const codeDefault = `const bar = createMenubar([
  {
    label: 'Arquivo',
    items: [
      { type: 'item', label: 'Novo',    shortcut: '⌘N' },
      { type: 'item', label: 'Abrir',   shortcut: '⌘O' },
      { type: 'item', label: 'Salvar',  shortcut: '⌘S' },
    ],
  },
]);`;

        const codeDestructive = `// DIVERGÊNCIA IDIOMÁTICA:
// O factory Nortear não tem prop \`variant\` — o item destructive
// é montado manualmente via classes .nds-* no <div role="menuitem">.
const bar = createMenubar([{ label: 'Arquivo', items: [{ type: 'item', label: 'Novo' }] }]);
const panel = bar.querySelector('[role="menu"]');
const li = document.createElement('div');
li.setAttribute('role', 'menuitem');
li.setAttribute('tabindex', '0');
li.className = 'nds-dropdown-menu-item nds-text-destructive';
li.textContent = 'Excluir arquivo';
panel.appendChild(li);`;

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
                wrap.className = 'nds-cluster';
                wrap.dataset.align = 'start';
                wrap.dataset.justify = 'center';
                wrap.style.minHeight = '140px';
                wrap.appendChild(
                  createMenubar([
                    {
                      label: 'Arquivo',
                      items: [
                        { type: 'item', label: 'Novo',    shortcut: '⌘N' },
                        { type: 'item', label: 'Salvar',  shortcut: '⌘S' },
                      ],
                    },
                  ]),
                );
                return wrap;
              },
            },
            {
              name: t('variants.items.destructive'),
              description:
                stripHtml(t('variants.styles.destructive')) +
                ' (Não suportado nativamente pelo factory Nortear — composição manual.)',
              code: codeDestructive,
              previewFactory: () => {
                const li = document.createElement('div');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'nds-dropdown-menu-item nds-text-destructive nds-border-destructive-soft nds-rounded-md';
                li.style.minWidth = '180px';
                li.textContent = 'Excluir arquivo';
                return li;
              },
            },
          ],
        });
      }

      case 'composicoes': {
        function injectCheckbox(panel: HTMLElement, label: string, checked: boolean): void {
          const item = document.createElement('div');
          item.setAttribute('role', 'menuitemcheckbox');
          item.setAttribute('aria-checked', String(checked));
          item.setAttribute('tabindex', '0');
          if (checked) item.dataset.state = 'checked';
          item.className = 'nds-dropdown-menu-item nds-hover-bg-accent';
          const indicator = document.createElement('span');
          indicator.className = 'nds-icon-sm nds-rounded';
          indicator.style.display = 'inline-flex';
          indicator.style.alignItems = 'center';
          indicator.style.justifyContent = 'center';
          indicator.setAttribute('aria-hidden', 'true');
          if (checked) indicator.textContent = '✓';
          const text = document.createElement('span');
          text.textContent = label;
          item.append(indicator, text);
          item.addEventListener('click', () => {
            const next = item.getAttribute('aria-checked') !== 'true';
            item.setAttribute('aria-checked', String(next));
            item.dataset.state = next ? 'checked' : 'unchecked';
            indicator.textContent = next ? '✓' : '';
          });
          panel.appendChild(item);
        }

        function injectRadio(panel: HTMLElement, label: string, checked: boolean): void {
          const item = document.createElement('div');
          item.setAttribute('role', 'menuitemradio');
          item.setAttribute('aria-checked', String(checked));
          item.setAttribute('tabindex', '0');
          if (checked) item.dataset.state = 'checked';
          item.className = 'nds-dropdown-menu-item nds-hover-bg-accent';
          const indicator = document.createElement('span');
          indicator.className = 'nds-icon-sm nds-rounded';
          indicator.style.display = 'inline-flex';
          indicator.style.alignItems = 'center';
          indicator.style.justifyContent = 'center';
          indicator.setAttribute('aria-hidden', 'true');
          if (checked) indicator.textContent = '●';
          const text = document.createElement('span');
          text.textContent = label;
          item.append(indicator, text);
          item.addEventListener('click', () => {
            panel.querySelectorAll<HTMLElement>('[role="menuitemradio"]').forEach((el) => {
              el.setAttribute('aria-checked', 'false');
              el.dataset.state = 'unchecked';
              const ind = el.querySelector<HTMLElement>('span[aria-hidden="true"]');
              if (ind) ind.textContent = '';
            });
            item.setAttribute('aria-checked', 'true');
            item.dataset.state = 'checked';
            indicator.textContent = '●';
          });
          panel.appendChild(item);
        }

        function wrapPreview(child: HTMLElement): HTMLElement {
          const wrap = document.createElement('div');
          wrap.style.contain = 'layout';
          wrap.className = 'nds-cluster nds-w-full';
          wrap.dataset.align = 'start';
          wrap.dataset.justify = 'center';
          wrap.style.minHeight = '220px';
          wrap.style.padding = 'var(--spacing-2)';
          wrap.appendChild(child);
          return wrap;
        }

        const codeWithShortcuts = `const bar = createMenubar([
  {
    label: 'Editar',
    items: [
      { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
      { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
      { type: 'separator' },
      { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
      { type: 'item', label: 'Colar',    shortcut: '⌘V' },
    ],
  },
]);`;

        const codeWithCheckbox = `// O factory Nortear não tem CheckboxItem nativo.
// Compor manualmente com role="menuitemcheckbox" sobre o panel:
const bar = createMenubar([{ label: 'Exibir', items: [{ type: 'label', label: 'Painéis' }] }]);
const panel = bar.querySelector('[role="menu"]');
// injectCheckbox(panel, 'Sidebar', true);
// injectCheckbox(panel, 'Grid', false);`;

        const codeWithRadio = `// Idem para radio — composição manual com role="menuitemradio":
const bar = createMenubar([{ label: 'Tema', items: [{ type: 'label', label: 'Aparência' }] }]);
const panel = bar.querySelector('[role="menu"]');
// injectRadio(panel, 'Claro',   false);
// injectRadio(panel, 'Escuro',  true);
// injectRadio(panel, 'Sistema', false);`;

        const codeEditorComplete = `const bar = createMenubar([
  { label: 'Arquivo', items: [
    { type: 'item', label: 'Novo',    shortcut: '⌘N' },
    { type: 'item', label: 'Abrir...', shortcut: '⌘O' },
    { type: 'item', label: 'Salvar',  shortcut: '⌘S' },
    { type: 'separator' },
    { type: 'item', label: 'Sair',    shortcut: '⌘Q' },
  ]},
  { label: 'Editar', items: [
    { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
    { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
  ]},
  { label: 'Exibir', items: [
    { type: 'label', label: 'Aparência' },
    { type: 'item',  label: 'Modo escuro' },
    { type: 'separator' },
    { type: 'item',  label: 'Tela cheia', shortcut: 'F11' },
  ]},
  { label: 'Ajuda', items: [
    { type: 'item', label: 'Documentação' },
    { type: 'item', label: 'Sobre' },
  ]},
]);`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'menubar',
          items: [
            {
              name: stripHtml(t('variants.compositions.withShortcuts.name')),
              description: stripHtml(t('variants.compositions.withShortcuts.description')),
              useWhen: stripHtml(t('variants.compositions.withShortcuts.use')),
              code: codeWithShortcuts,
              previewFactory: () => wrapPreview(
                createMenubar([
                  {
                    label: 'Editar',
                    items: [
                      { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
                      { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
                      { type: 'separator' },
                      { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
                      { type: 'item', label: 'Colar',    shortcut: '⌘V' },
                    ],
                  },
                ]),
              ),
            },
            {
              name: stripHtml(t('variants.compositions.withCheckbox.name')),
              description: stripHtml(t('variants.compositions.withCheckbox.description')),
              useWhen: stripHtml(t('variants.compositions.withCheckbox.use')),
              code: codeWithCheckbox,
              previewFactory: () => {
                const bar = createMenubar([
                  { label: 'Exibir', items: [{ type: 'label', label: 'Painéis' }] },
                ]);
                const panel = bar.querySelector<HTMLElement>('[role="menu"]');
                if (panel) {
                  injectCheckbox(panel, 'Sidebar', true);
                  injectCheckbox(panel, 'Grid', false);
                  injectCheckbox(panel, 'Régua', false);
                }
                return wrapPreview(bar);
              },
            },
            {
              name: stripHtml(t('variants.compositions.withRadio.name')),
              description: stripHtml(t('variants.compositions.withRadio.description')),
              useWhen: stripHtml(t('variants.compositions.withRadio.use')),
              code: codeWithRadio,
              previewFactory: () => {
                const bar = createMenubar([
                  { label: 'Tema', items: [{ type: 'label', label: 'Aparência' }] },
                ]);
                const panel = bar.querySelector<HTMLElement>('[role="menu"]');
                if (panel) {
                  injectRadio(panel, 'Claro',   false);
                  injectRadio(panel, 'Escuro',  true);
                  injectRadio(panel, 'Sistema', false);
                }
                return wrapPreview(bar);
              },
            },
            {
              name: stripHtml(t('variants.compositions.editorComplete.name')),
              description: stripHtml(t('variants.compositions.editorComplete.description')),
              useWhen: stripHtml(t('variants.compositions.editorComplete.use')),
              code: codeEditorComplete,
              previewFactory: () => wrapPreview(
                createMenubar([
                  { label: 'Arquivo', items: [
                    { type: 'item', label: 'Novo',     shortcut: '⌘N' },
                    { type: 'item', label: 'Abrir...', shortcut: '⌘O' },
                    { type: 'item', label: 'Salvar',   shortcut: '⌘S' },
                    { type: 'separator' },
                    { type: 'item', label: 'Sair',     shortcut: '⌘Q' },
                  ]},
                  { label: 'Editar', items: [
                    { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
                    { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
                  ]},
                  { label: 'Exibir', items: [
                    { type: 'label', label: 'Aparência' },
                    { type: 'item',  label: 'Modo escuro' },
                    { type: 'separator' },
                    { type: 'item',  label: 'Tela cheia', shortcut: 'F11' },
                  ]},
                  { label: 'Ajuda', items: [
                    { type: 'item', label: 'Documentação' },
                    { type: 'item', label: 'Sobre' },
                  ]},
                ]),
              ),
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
            { label: t('states.items.closed'),   trigger: 'estado inicial',          behavior: stripHtml(t('states.descriptions.closed'))   },
            { label: t('states.items.open'),     trigger: 'click no Trigger',        behavior: stripHtml(t('states.descriptions.open'))     },
            { label: t('states.items.disabled'), trigger: 'item.disabled=true',      behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.checked'),  trigger: 'aria-checked="true"',     behavior: stripHtml(t('states.descriptions.checked'))  },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createMenubar(menus, options?)
export type MenubarItemType = 'item' | 'separator' | 'label';

export type MenubarItem = {
  type?: MenubarItemType;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
};

export type MenubarMenu = {
  label: string;
  items: MenubarItem[];
};

export function createMenubar(
  menus: MenubarMenu[],
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
              title: 'createMenubar(menus, options?)',
              cols: propsCols,
              items: [
                { name: 'menus',         type: 'MenubarMenu[]',                       defaultValue: '—',    required: 'Sim', description: 'Lista de menus (label + items) renderizados na barra.' },
                { name: 'options.class', type: 'string',                              defaultValue: '—',    required: 'Não', description: 'Classes adicionais no Root.' },
                { name: 'value',         type: 'string',                              defaultValue: '—',    required: 'Não', description: stripHtml(t('props.table.value.description'))         + ' NOTA: factory Nortear não tem controle externo nativo.' },
                { name: 'onValueChange', type: '(value: string) => void',             defaultValue: '—',    required: 'Não', description: stripHtml(t('props.table.onValueChange.description')) + ' NOTA: factory Nortear não emite (use item.onClick).' },
                { name: 'defaultValue',  type: 'string',                              defaultValue: '—',    required: 'Não', description: stripHtml(t('props.table.defaultValue.description'))  + ' NOTA: factory Nortear sempre inicia fechado.' },
                { name: 'loop',          type: 'boolean',                             defaultValue: 'true', required: 'Não', description: stripHtml(t('props.table.loop.description'))          + ' NOTA: factory Nortear não implementa loop (setas Esquerda/Direita não navegam).' },
                { name: 'side',          type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'", required: 'Não', description: stripHtml(t('props.table.side.description')) + ' NOTA: factory Nortear fixa bottom-start.' },
                { name: 'align',         type: "'start' | 'center' | 'end'",          defaultValue: "'start'",  required: 'Não', description: stripHtml(t('props.table.align.description')) + ' NOTA: factory Nortear fixa start.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes:
            t('props.extensibilityCode') +
            '\n\n// NOTA Nortear: o factory custom não possui MenubarSub/SubTrigger/SubContent.\n// Para hierarquia, prefira reorganizar os menus em estrutura plana, ou utilize\n// as stacks React/Vue/Svelte que possuem submenu via base-ui/reka-ui/bits-ui.',
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
            { token: '--background',         value: t('tokens.table.menubarBg.class'),     description: t('tokens.table.menubarBg.part')     },
            { token: '--border',             value: t('tokens.table.menubarBorder.class'), description: t('tokens.table.menubarBorder.part') },
            { token: '--accent',             value: t('tokens.table.triggerHover.class'),  description: t('tokens.table.triggerHover.part')  },
            { token: '--popover',            value: t('tokens.table.contentBg.class'),     description: t('tokens.table.contentBg.part')     },
            { token: '--foreground',         value: t('tokens.table.contentBorder.class'), description: t('tokens.table.contentBorder.part') },
            { token: '--radius',             value: t('tokens.table.rounded.class'),       description: t('tokens.table.rounded.part')       },
            { token: '--accent',             value: t('tokens.table.itemHover.class'),     description: t('tokens.table.itemHover.part')     },
            { token: '--destructive',        value: t('tokens.table.destructive.class'),   description: t('tokens.table.destructive.part')   },
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
            { key: 'Tab',         description: stripHtml(t('accessibility.keyboard.tab'))              },
            { key: '← / →',       description: stripHtml(t('accessibility.keyboard.arrowsHorizontal')) },
            { key: '↑ / ↓',       description: stripHtml(t('accessibility.keyboard.arrowsVertical'))   },
            { key: 'Enter/Space', description: stripHtml(t('accessibility.keyboard.enter'))            },
            { key: 'Esc',         description: stripHtml(t('accessibility.keyboard.escape'))           },
            { key: 'Home/End',    description: stripHtml(t('accessibility.keyboard.homeEnd'))          },
            { key: 'A–Z',         description: stripHtml(t('accessibility.keyboard.typeahead'))        },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.navigationMenu.name'), description: t('related.items.navigationMenu.description'), path: '?path=/docs/ui-navigationmenu--docs' },
            { name: t('related.items.dropdownMenu.name'),   description: t('related.items.dropdownMenu.description'),   path: '?path=/docs/ui-dropdownmenu--docs'   },
            { name: t('related.items.sidebar.name'),        description: t('related.items.sidebar.description'),        path: '?path=/docs/ui-sidebar--docs'        },
            { name: t('related.items.command.name'),        description: t('related.items.command.description'),        path: '?path=/docs/ui-command--docs'        },
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
              event: 'menubar_menu_open',
              trigger: 'click no Trigger / onValueChange',
              payload: "{ component: 'menubar', menu, location }",
            },
            {
              event: 'menubar_item_select',
              trigger: 'click no Item / item.onClick',
              payload: "{ component: 'menubar', menu, label, value }",
            },
            {
              event: 'menubar_shortcut_invoke',
              trigger: 'atalho de teclado registrado externo',
              payload: "{ component: 'menubar', menu, label, shortcut }",
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'menubar',
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
