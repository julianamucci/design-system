import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createDropdownMenu } from '@/components/ui/dropdown-menu';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';

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
const { t, subscribe } = createTranslation(dropdownMenuTranslations as Record<string, unknown>);

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

function buildDemoMenu(triggerLabel: string): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: triggerLabel });
  return createDropdownMenu({
    trigger,
    items: [
      { type: 'label', label: t('demonstration.labels.basic') },
      { type: 'item', label: 'Perfil', value: 'profile' },
      { type: 'item', label: 'Configurações', value: 'settings' },
      { type: 'separator' },
      { type: 'item', label: 'Sair', value: 'logout' },
    ],
  });
}

// ─── createDropdownMenuDocs ───────────────────────────────────────────────────

export function createDropdownMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'dropdown-menu',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/overlay' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'dropdown_menu',
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
      { id: 'composicoes',  labelKey: 'nav.compositions' },
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
      installNote: 'npx shadcn@latest add dropdown-menu',
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
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.align = 'center';
            wrap.style.minHeight = '140px';
            wrap.appendChild(buildDemoMenu(t('demonstration.labels.basic')));
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
            items: ['trigger', 'label', 'item', 'destructive'].map(key => ({
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
                const trigger = createButton({ variant: 'outline', label: 'Conta' });
                return createDropdownMenu({
                  trigger,
                  items: [
                    { type: 'label', label: 'Conta' },
                    { type: 'item', label: 'Perfil' },
                    { type: 'item', label: 'Configurações' },
                    { type: 'separator' },
                    { type: 'item', label: 'Sair' },
                  ],
                });
              },
              dontPreviewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Menu' });
                return createDropdownMenu({
                  trigger,
                  items: Array.from({ length: 10 }, (_, i) => ({
                    type: 'item' as const,
                    label: `Ação ${i + 1}`,
                  })),
                });
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'nds-dropdown-menu-item nds-text-destructive nds-border-destructive-soft nds-rounded-md';
                li.style.minWidth = '160px';
                li.textContent = 'Excluir conta';
                return li;
              },
              dontPreviewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'nds-dropdown-menu-item nds-border-default nds-rounded-md';
                li.style.minWidth = '160px';
                li.textContent = 'Excluir conta';
                return li;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createDropdownMenu } from '@/components/ui/dropdown-menu';
import { createButton } from '@/components/ui/button';`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Abrir menu' });
createDropdownMenu({
  trigger,
  items: [
    { type: 'item', label: 'Editar',     value: 'edit'      },
    { type: 'item', label: 'Duplicar',   value: 'duplicate' },
  ],
});`;

        const codeDestructive = `// Item destrutivo: classes aplicadas manualmente no <li>
const li = document.createElement('li');
li.setAttribute('role', 'menuitem');
li.className = 'nds-dropdown-menu-item nds-text-destructive';
li.textContent = 'Excluir';`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildDemoMenu(t('variants.items.default')),
            },
            {
              name: t('variants.items.destructive'),
              description: stripHtml(t('variants.styles.destructive')),
              code: codeDestructive,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'nds-dropdown-menu-item nds-text-destructive nds-border-destructive-soft nds-rounded-md';
                li.style.minWidth = '160px';
                li.textContent = 'Excluir';
                return li;
              },
            },
          ],
        });
      }

      case 'composicoes': {
        function makeLabelItem(text: string): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'presentation');
          li.className = 'nds-text-caption nds-font-semibold nds-text-muted-foreground';
          li.style.padding = 'var(--spacing-1) var(--spacing-2)';
          li.textContent = text;
          return li;
        }
        function makeSeparator(): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'separator');
          li.style.margin = 'var(--spacing-1) calc(var(--spacing-1) * -1)';
          li.style.height = '1px';
          li.style.background = 'hsl(var(--muted))';
          return li;
        }
        function makeItem(label: string, shortcut?: string): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitem');
          li.setAttribute('tabindex', '-1');
          li.className = 'nds-dropdown-menu-item';
          const text = document.createElement('span');
          text.className = 'nds-flex-1';
          text.textContent = label;
          li.appendChild(text);
          if (shortcut) {
            const sc = document.createElement('span');
            sc.className = 'nds-text-caption nds-text-muted-foreground';
            sc.style.marginLeft = 'auto';
            sc.style.letterSpacing = '0.1em';
            sc.setAttribute('aria-hidden', 'true');
            sc.textContent = shortcut;
            li.appendChild(sc);
          }
          return li;
        }
        function makeCheckboxItem(label: string, checked: boolean): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitemcheckbox');
          li.setAttribute('aria-checked', String(checked));
          li.setAttribute('tabindex', '-1');
          if (checked) li.dataset.state = 'checked';
          li.className = 'nds-dropdown-menu-item';
          const indicator = document.createElement('span');
          indicator.className = 'nds-icon-sm nds-rounded';
          indicator.style.display = 'inline-flex';
          indicator.style.alignItems = 'center';
          indicator.style.justifyContent = 'center';
          indicator.setAttribute('aria-hidden', 'true');
          if (checked) indicator.textContent = '✓';
          const text = document.createElement('span');
          text.textContent = label;
          li.append(indicator, text);
          return li;
        }
        function makeRadioItem(label: string, checked: boolean): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitemradio');
          li.setAttribute('aria-checked', String(checked));
          li.setAttribute('tabindex', '-1');
          if (checked) li.dataset.state = 'checked';
          li.className = 'nds-dropdown-menu-item';
          const indicator = document.createElement('span');
          indicator.className = 'nds-icon-sm nds-rounded';
          indicator.style.display = 'inline-flex';
          indicator.style.alignItems = 'center';
          indicator.style.justifyContent = 'center';
          indicator.setAttribute('aria-hidden', 'true');
          if (checked) indicator.textContent = '●';
          const text = document.createElement('span');
          text.textContent = label;
          li.append(indicator, text);
          return li;
        }
        function makeStaticMenu(build: (ul: HTMLUListElement) => void): HTMLElement {
          const ul = document.createElement('ul');
          ul.setAttribute('role', 'menu');
          ul.className =
            'nds-overflow-hidden nds-rounded-md nds-border-default nds-shadow-md';
          ul.style.zIndex = '50';
          ul.style.minWidth = '12rem';
          ul.style.padding = 'var(--spacing-1)';
          ul.style.background = 'hsl(var(--popover))';
          ul.style.color = 'hsl(var(--popover-foreground))';
          build(ul);
          return ul;
        }

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'dropdown-menu',
          items: [
            {
              name: t('variants.compositions.withLabel.name'),
              description: stripHtml(t('variants.compositions.withLabel.description')),
              useWhen: stripHtml(t('variants.compositions.withLabel.use')),
              code: `const trigger = createButton({ variant: 'outline', label: 'Conta' });
const menu = createDropdownMenu({
  trigger,
  items: [
    { type: 'label',     label: 'Conta'          },
    { type: 'item',      label: 'Perfil'         },
    { type: 'item',      label: 'Configurações'  },
    { type: 'separator' },
    { type: 'label',     label: 'Suporte'        },
    { type: 'item',      label: 'Documentação'   },
    { type: 'item',      label: 'Sair'           },
  ],
});`,
              previewFactory: () => makeStaticMenu((ul) => {
                ul.append(
                  makeLabelItem('Conta'),
                  makeItem('Perfil'),
                  makeItem('Configurações'),
                  makeSeparator(),
                  makeLabelItem('Suporte'),
                  makeItem('Documentação'),
                  makeItem('Sair'),
                );
              }),
            },
            {
              name: t('variants.compositions.withCheckboxItems.name'),
              description: stripHtml(t('variants.compositions.withCheckboxItems.description')),
              useWhen: stripHtml(t('variants.compositions.withCheckboxItems.use')),
              code: `// Nortear: factory padrão não tem checkbox-item; monte manualmente.
const li = document.createElement('li');
li.setAttribute('role', 'menuitemcheckbox');
li.setAttribute('aria-checked', 'true');
li.dataset.state = 'checked';
li.className = 'nds-cluster relative nds-px-2 nds-py-1.5 nds-text-body nds-rounded-sm focus:bg-accent';
// indicator + texto…
li.addEventListener('click', () => {
  const next = li.getAttribute('aria-checked') !== 'true';
  li.setAttribute('aria-checked', String(next));
  li.dataset.state = next ? 'checked' : 'unchecked';
});`,
              previewFactory: () => makeStaticMenu((ul) => {
                ul.append(
                  makeLabelItem('Colunas visíveis'),
                  makeCheckboxItem('Status', true),
                  makeCheckboxItem('Email', true),
                  makeCheckboxItem('Função', false),
                );
              }),
            },
            {
              name: t('variants.compositions.withRadioGroup.name'),
              description: stripHtml(t('variants.compositions.withRadioGroup.description')),
              useWhen: stripHtml(t('variants.compositions.withRadioGroup.use')),
              code: `// Nortear: monte radio-items manualmente; gerencie exclusividade no click.
function makeRadio(label, checked, group) {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitemradio');
  li.setAttribute('aria-checked', String(checked));
  li.addEventListener('click', () => {
    group.querySelectorAll('[role="menuitemradio"]').forEach(el => {
      el.setAttribute('aria-checked', 'false');
    });
    li.setAttribute('aria-checked', 'true');
  });
  return li;
}`,
              previewFactory: () => makeStaticMenu((ul) => {
                ul.append(
                  makeLabelItem('Aparência'),
                  makeRadioItem('Claro', false),
                  makeRadioItem('Escuro', true),
                  makeRadioItem('Sistema', false),
                );
              }),
            },
            {
              name: t('variants.compositions.withShortcuts.name'),
              description: stripHtml(t('variants.compositions.withShortcuts.description')),
              useWhen: stripHtml(t('variants.compositions.withShortcuts.use')),
              code: `// Nortear: factory padrão não exibe shortcut. Adicione um <span aria-hidden>
function makeItem(label, shortcut) {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitem');
  li.className = 'nds-dropdown-menu-item';
  const text = document.createElement('span');
  text.className = 'nds-flex-1';
  text.textContent = label;
  li.appendChild(text);
  if (shortcut) {
    const sc = document.createElement('span');
    sc.className = 'ml-auto nds-text-caption tracking-widest nds-text-muted-foreground';
    sc.setAttribute('aria-hidden', 'true');
    sc.textContent = shortcut;
    li.appendChild(sc);
  }
  return li;
}
// O atalho real precisa ser registrado pelo consumidor (useHotkeys / tinykeys).`,
              previewFactory: () => makeStaticMenu((ul) => {
                ul.append(
                  makeItem('Desfazer', '⌘Z'),
                  makeItem('Refazer', '⇧⌘Z'),
                  makeSeparator(),
                  makeItem('Recortar', '⌘X'),
                  makeItem('Copiar', '⌘C'),
                  makeItem('Colar', '⌘V'),
                );
              }),
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
            { label: t('states.items.open'),     trigger: 'click no trigger',        behavior: stripHtml(t('states.descriptions.open'))     },
            { label: t('states.items.disabled'), trigger: 'item.disabled=true',      behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.checked'),  trigger: 'aria-checked="true"',     behavior: stripHtml(t('states.descriptions.checked'))  },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createDropdownMenu(options)
export type DropdownMenuItemDef = {
  type?: 'item' | 'separator' | 'label';
  value?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type DropdownMenuOptions = {
  trigger: HTMLElement;
  items: DropdownMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createDropdownMenu(options: DropdownMenuOptions): HTMLElement;`;

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
              title: 'createDropdownMenu(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                 defaultValue: '—',     required: 'Sim', description: 'Elemento que abre o menu ao receber click.' },
                { name: 'items',        type: 'DropdownMenuItemDef[]',       defaultValue: '—',     required: 'Sim', description: 'Lista de itens, separadores e labels do menu.' },
                { name: 'onOpenChange', type: '(open: boolean) => void',     defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.onOpenChange.description')) },
                { name: 'class',        type: 'string',                      defaultValue: '—',     required: 'Não', description: 'Classes adicionais aplicadas ao painel.' },
                { name: 'open',         type: 'boolean',                     defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.open.description')) + ' (controle externo via .click() no trigger no Nortear).' },
                { name: 'defaultOpen',  type: 'boolean',                     defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.defaultOpen.description')) + ' NOTA: factory Nortear não tem prop nativa.' },
                { name: 'modal',        type: 'boolean',                     defaultValue: 'true',  required: 'Não', description: stripHtml(t('props.table.modal.description')) },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'bottom'", required: 'Não', description: stripHtml(t('props.table.side.description')) + ' NOTA: factory Nortear fixa bottom-start.' },
                { name: 'align',        type: "'start' | 'center' | 'end'",  defaultValue: "'start'", required: 'Não', description: stripHtml(t('props.table.align.description')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibilityCode'),
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
            { token: '--popover',            value: t('tokens.table.background.class'),  description: t('tokens.table.background.part')  },
            { token: '--popover-foreground', value: t('tokens.table.foreground.class'),  description: t('tokens.table.foreground.part')  },
            { token: '--border',             value: t('tokens.table.border.class'),      description: t('tokens.table.border.part')      },
            { token: '--shadow-md',          value: t('tokens.table.shadow.class'),      description: t('tokens.table.shadow.part')      },
            { token: '--radius',             value: t('tokens.table.rounded.class'),     description: t('tokens.table.rounded.part')     },
            { token: '--accent',             value: t('tokens.table.itemHover.class'),   description: t('tokens.table.itemHover.part')   },
            { token: '--destructive',        value: t('tokens.table.destructive.class'), description: t('tokens.table.destructive.part') },
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
            { key: 'Tab',          description: t('accessibility.keyboard.tab')      },
            { key: '↑/↓ ←/→',      description: t('accessibility.keyboard.arrows')   },
            { key: 'Enter/Space',  description: t('accessibility.keyboard.enter')    },
            { key: 'Esc',          description: t('accessibility.keyboard.escape')   },
            { key: 'Home/End',     description: t('accessibility.keyboard.homeEnd')  },
            { key: 'A–Z',          description: t('accessibility.keyboard.typeahead')},
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.contextMenu.name'), description: t('related.items.contextMenu.description'), path: '?path=/docs/ui-contextmenu--docs' },
            { name: t('related.items.menubar.name'),     description: t('related.items.menubar.description'),     path: '?path=/docs/ui-menubar--docs'     },
            { name: t('related.items.command.name'),     description: t('related.items.command.description'),     path: '?path=/docs/ui-command--docs'     },
            { name: t('related.items.popover.name'),     description: t('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
            { name: t('related.items.select.name'),      description: t('related.items.select.description'),      path: '?path=/docs/ui-select--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
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
              event: 'dropdown_menu_open',
              trigger: 'onOpenChange(true)',
              payload: "{ component: 'dropdown-menu', location, label }",
            },
            {
              event: 'dropdown_menu_close',
              trigger: 'onOpenChange(false)',
              payload: "{ component: 'dropdown-menu', location, label }",
            },
            {
              event: 'dropdown_menu_item_select',
              trigger: 'onSelect / item.onClick',
              payload: "{ component: 'dropdown-menu', location, label, value }",
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
  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'dropdown_menu',
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
