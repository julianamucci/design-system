import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createCommand } from '@/components/ui/command';
import uiTranslations from '@/i18n/ui.json';
import commandTranslations from '@shared/content/command/translations.json';

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
const { t, subscribe } = createTranslation(commandTranslations as Record<string, unknown>);

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

function buildDemoCommand(placeholder: string, withGroups = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md';
  wrap.appendChild(
    createCommand({
      placeholder,
      items: withGroups
        ? [
            { value: 'button',    label: t('demonstration.labels.itemButton'),    group: t('demonstration.labels.groupComponents') },
            { value: 'input',     label: t('demonstration.labels.itemInput'),     group: t('demonstration.labels.groupComponents') },
            { value: 'separator', label: t('demonstration.labels.itemSeparator'), group: t('demonstration.labels.groupComponents') },
            { value: 'cn',        label: 'cn()',   group: t('demonstration.labels.groupUtils') },
            { value: 'clsx',      label: 'clsx()', group: t('demonstration.labels.groupUtils') },
          ]
        : [
            { value: 'button',    label: t('demonstration.labels.itemButton')    },
            { value: 'input',     label: t('demonstration.labels.itemInput')     },
            { value: 'separator', label: t('demonstration.labels.itemSeparator') },
          ],
    })
  );
  return wrap;
}

// ─── createCommandDocs ────────────────────────────────────────────────────────

export function createCommandDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'command',
    });
    track('docs_page_view', {
      component_name: 'command',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }
  let cleanupSeo = updateSeo();
  cleanups.push(() => cleanupSeo());
  cleanups.push(subscribe(() => { cleanupSeo(); cleanupSeo = updateSeo(); }));

  // ── Nav groups ───────────────────────────────────────────────────────────

  const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
    {
      labelKey: 'nav.overview',
      sections: [
        { id: 'demonstracao', labelKey: 'nav.demonstration' },
        { id: 'anatomia',     labelKey: 'nav.anatomy'       },
        { id: 'quando-usar',  labelKey: 'nav.usage'         },
        { id: 'do-dont',      labelKey: 'nav.doDont'        },
      ],
    },
    {
      labelKey: 'nav.techRef',
      sections: [
        { id: 'importacao',   labelKey: 'nav.import'   },
        { id: 'variantes',    labelKey: 'nav.variants' },
        { id: 'composicoes',  labelKey: 'nav.compositions' },
        { id: 'estados',      labelKey: 'nav.states'   },
        { id: 'propriedades', labelKey: 'nav.props'    },
        { id: 'tokens',       labelKey: 'nav.tokens'   },
      ],
    },
    {
      labelKey: 'nav.context',
      sections: [
        { id: 'acessibilidade', labelKey: 'nav.accessibility' },
        { id: 'relacionados',   labelKey: 'nav.related'       },
        { id: 'notas',          labelKey: 'nav.notes'         },
      ],
    },
    {
      labelKey: 'nav.quality',
      sections: [
        { id: 'analytics', labelKey: 'nav.analytics' },
        { id: 'testes',    labelKey: 'nav.testes'    },
      ],
    },
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
      installNote: 'npx shadcn@latest add command',
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
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ─── 1. Demonstração ───────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => buildDemoCommand(t('demonstration.labels.searchPlaceholder'), true),
        });

      // ─── 2. Anatomia ───────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ─── 3. Quando Usar ────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5, 6].map(i => t(`usage.guidelines.item${i}`)),
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
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => t(`usage.dont.item${i}`)),
          },
        });

      // ─── 4. Do & Don't ─────────────────────────────────────────────────
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
                wrap.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md';
                wrap.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.searchPlaceholder'),
                    items: [
                      { value: 'button', label: t('demonstration.labels.itemButton') },
                      { value: 'input',  label: t('demonstration.labels.itemInput')  },
                    ],
                  })
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                // Empty state sem mensagem de feedback (sem CommandEmpty)
                const wrap = document.createElement('div');
                wrap.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md';
                const cmd = createCommand({
                  placeholder: t('demonstration.labels.searchPlaceholder'),
                  items: [
                    { value: 'button', label: t('demonstration.labels.itemButton') },
                    { value: 'input',  label: t('demonstration.labels.itemInput')  },
                  ],
                });
                wrap.appendChild(cmd);
                // Força empty state para demonstrar o problema
                const inp = wrap.querySelector('input');
                if (inp) {
                  inp.value = 'xyznotfound';
                  inp.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                const hint = document.createElement('div');
                hint.className = 'nds-cluster nds-w-full nds-text-body nds-text-muted-foreground nds-border-default nds-rounded nds-cursor-pointer';
                hint.dataset.spacing = 'xs';
                hint.style.padding = '0.375rem 0.75rem';
                hint.innerHTML = `
                  <span class="nds-flex-1">${sanitizeHtml(t('demonstration.labels.openPalette'))}</span>
                  <kbd class="nds-rounded nds-border-default nds-bg-muted nds-text-caption nds-font-mono nds-font-semibold" style="display:inline-flex;align-items:center;justify-content:center;padding:0.125rem 0.375rem;">${sanitizeHtml(t('demonstration.labels.shortcutKey'))}</kbd>
                `;
                outer.appendChild(hint);
                return outer;
              },
              dontPreviewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                const hint = document.createElement('div');
                hint.className = 'nds-cluster nds-w-full nds-text-body nds-text-muted-foreground nds-border-default nds-rounded nds-cursor-pointer';
                hint.dataset.spacing = 'xs';
                hint.style.padding = '0.375rem 0.75rem';
                hint.textContent = t('demonstration.labels.openPalette');
                // Sem dica de atalho
                outer.appendChild(hint);
                return outer;
              },
            },
          ],
        });

      // ─── 5. Importação ─────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createCommand } from '@/components/ui/command';`,
          secondaryDescription: t('import.withDialog'),
          secondaryCode: `// Padrão command palette — combine Command com Dialog nativo\nimport { createCommand } from '@/components/ui/command';\nimport { createDialog } from '@/components/ui/dialog';`,
        });

      // ─── 6. Variantes (Padrões de Uso) ─────────────────────────────────
      case 'variantes': {
        const codeInline = `const cmd = createCommand({\n  placeholder: 'Buscar componente...',\n  items: [\n    { value: 'button', label: 'Button', group: 'Componentes' },\n    { value: 'input',  label: 'Input',  group: 'Componentes' },\n  ],\n  onSelect: (value) => console.log('selected:', value),\n});`;
        const codeCombobox = `// Command inline como combobox dentro de Popover\nconst cmd = createCommand({\n  placeholder: 'Buscar item...',\n  items: listItems,\n  onSelect: (value) => {\n    setSelected(value);\n    closePopover();\n  },\n});`;
        const codePalette = `// Command dentro de Dialog para command palette\nconst cmd = createCommand({\n  placeholder: 'Buscar comando ou ação...',\n  items: globalActions,\n  onSelect: (value) => {\n    executeAction(value);\n    closeDialog();\n  },\n});\n\n// Atalho global Cmd+K\nwindow.addEventListener('keydown', (e) => {\n  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {\n    e.preventDefault();\n    openDialog();\n  }\n});`;

        return createDocsVariants({
          title: t('variants.title'),
          componentSlug: 'command',
          items: [
            {
              name: 'inline',
              description: stripHtml(t('variants.items.inline')),
              code: codeInline,
              previewFactory: () => buildDemoCommand(t('demonstration.labels.searchPlaceholder'), true),
            },
            {
              name: 'combobox',
              description: stripHtml(t('variants.items.combobox')),
              code: codeCombobox,
              previewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                const trigger = document.createElement('button');
                trigger.className = 'nds-cluster nds-border-default nds-rounded nds-text-body nds-cursor-pointer nds-bg-background';
                trigger.dataset.justify = 'between';
                trigger.style.width = '12rem';
                trigger.style.padding = '0.375rem 0.75rem';
                trigger.innerHTML = `<span>${sanitizeHtml(t('demonstration.labels.selectPlaceholder'))}</span><span class="nds-text-muted-foreground">▼</span>`;
                const popover = document.createElement('div');
                popover.className = 'nds-border-default nds-rounded-md nds-shadow-md nds-mt-1';
                popover.style.width = '12rem';
                popover.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.comboboxSearch'),
                    items: [
                      { value: 'button',    label: t('demonstration.labels.itemButton')    },
                      { value: 'input',     label: t('demonstration.labels.itemInput')     },
                      { value: 'separator', label: t('demonstration.labels.itemSeparator') },
                    ],
                  })
                );
                outer.append(trigger, popover);
                return outer;
              },
            },
            {
              name: 'palette',
              description: stripHtml(t('variants.items.palette')),
              code: codePalette,
              previewFactory: () => {
                const outer = document.createElement('div');
                outer.className = 'nds-stack nds-p-2';
                outer.dataset.spacing = 'xs';
                outer.style.alignItems = 'flex-start';
                const hint = document.createElement('div');
                hint.className = 'nds-cluster nds-w-full nds-text-body nds-text-muted-foreground nds-border-default nds-rounded nds-cursor-pointer';
                hint.dataset.spacing = 'xs';
                hint.style.padding = '0.375rem 0.75rem';
                hint.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <span class="nds-flex-1">${sanitizeHtml(t('demonstration.labels.openPalette'))}</span>
                  <kbd class="nds-rounded nds-border-default nds-bg-muted nds-text-caption nds-font-mono nds-font-semibold" style="display:inline-flex;align-items:center;justify-content:center;padding:0.125rem 0.375rem;">${sanitizeHtml(t('demonstration.labels.shortcutKey'))}</kbd>
                `;
                outer.appendChild(hint);
                const dialog = document.createElement('div');
                dialog.className = 'nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md';
                dialog.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.dialogDescription'),
                    items: [
                      { value: 'button',    label: t('demonstration.labels.itemButton'),    group: t('demonstration.labels.groupComponents') },
                      { value: 'input',     label: t('demonstration.labels.itemInput'),     group: t('demonstration.labels.groupComponents') },
                    ],
                  })
                );
                outer.appendChild(dialog);
                return outer;
              },
            },
          ],
        });
      }

      // ─── 6b. Composições ───────────────────────────────────────────────
      case 'composicoes': {
        const longListLabels = [
          'Accordion','Alert','AlertDialog','AspectRatio','Avatar',
          'Badge','Breadcrumb','Button','Calendar','Card',
          'Carousel','Chart','Checkbox','Collapsible','Command',
          'ContextMenu','DataTable','DatePicker','Dialog','Drawer',
          'DropdownMenu','Form','HoverCard','Input','InputOTP',
          'Label','Menubar','NavigationMenu','Pagination','Popover',
        ];

        const codeWithGroups = `const wrap = document.createElement('div');
wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
wrap.appendChild(
  createCommand({
    placeholder: 'Buscar componente...',
    items: [
      { value: 'button',    label: 'Button',    group: 'Componentes' },
      { value: 'input',     label: 'Input',     group: 'Componentes' },
      { value: 'badge',     label: 'Badge',     group: 'Componentes' },
      { value: 'separator', label: 'Separator', group: 'Componentes' },
      { value: 'cn',        label: 'cn()',       group: 'Utilitários' },
      { value: 'clsx',      label: 'clsx()',     group: 'Utilitários' },
      { value: 'twmerge',   label: 'twMerge()',  group: 'Utilitários' },
    ],
  })
);`;

        const codeWithDisabled = `const wrap = document.createElement('div');
wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
wrap.appendChild(
  createCommand({
    placeholder: 'Buscar...',
    items: [
      { value: 'button', label: 'Button',              group: 'Componentes' },
      { value: 'input',  label: 'Input (em breve)',    group: 'Componentes', disabled: true },
      { value: 'badge',  label: 'Badge',               group: 'Componentes' },
      { value: 'select', label: 'Select (em breve)',   group: 'Componentes', disabled: true },
      { value: 'cn',     label: 'cn()',                 group: 'Utilitários' },
      { value: 'clsx',   label: 'clsx() (depreciado)', group: 'Utilitários', disabled: true },
    ],
  })
);`;

        const codeLongList = `const items = [
  'Accordion','Alert','AlertDialog','AspectRatio','Avatar',
  'Badge','Breadcrumb','Button','Calendar','Card',
  'Carousel','Chart','Checkbox','Collapsible','Command',
  // ... e assim por diante
].map(label => ({ value: label.toLowerCase(), label, group: 'Componentes' }));

const wrap = document.createElement('div');
wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
wrap.appendChild(
  createCommand({
    placeholder: 'Buscar componente...',
    items,
  })
);`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'command',
          items: [
            {
              name: stripHtml(t('variants.compositions.withGroups.name')),
              description: stripHtml(t('variants.compositions.withGroups.description')),
              useWhen: stripHtml(t('variants.compositions.withGroups.use')),
              code: codeWithGroups,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
                wrap.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.searchPlaceholder'),
                    items: [
                      { value: 'button',    label: 'Button',    group: t('demonstration.labels.groupComponents') },
                      { value: 'input',     label: 'Input',     group: t('demonstration.labels.groupComponents') },
                      { value: 'badge',     label: 'Badge',     group: t('demonstration.labels.groupComponents') },
                      { value: 'separator', label: 'Separator', group: t('demonstration.labels.groupComponents') },
                      { value: 'cn',        label: 'cn()',       group: t('demonstration.labels.groupUtils') },
                      { value: 'clsx',      label: 'clsx()',     group: t('demonstration.labels.groupUtils') },
                      { value: 'twmerge',   label: 'twMerge()',  group: t('demonstration.labels.groupUtils') },
                    ],
                  })
                );
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.compositions.withDisabled.name')),
              description: stripHtml(t('variants.compositions.withDisabled.description')),
              useWhen: stripHtml(t('variants.compositions.withDisabled.use')),
              code: codeWithDisabled,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
                wrap.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.searchPlaceholder'),
                    items: [
                      { value: 'button', label: 'Button',              group: t('demonstration.labels.groupComponents') },
                      { value: 'input',  label: 'Input (em breve)',    group: t('demonstration.labels.groupComponents'), disabled: true },
                      { value: 'badge',  label: 'Badge',               group: t('demonstration.labels.groupComponents') },
                      { value: 'select', label: 'Select (em breve)',   group: t('demonstration.labels.groupComponents'), disabled: true },
                      { value: 'cn',     label: 'cn()',                 group: t('demonstration.labels.groupUtils') },
                      { value: 'clsx',   label: 'clsx() (depreciado)', group: t('demonstration.labels.groupUtils'), disabled: true },
                    ],
                  })
                );
                return wrap;
              },
            },
            {
              name: stripHtml(t('variants.compositions.longList.name')),
              description: stripHtml(t('variants.compositions.longList.description')),
              useWhen: stripHtml(t('variants.compositions.longList.use')),
              code: codeLongList,
              previewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
wrap.style.width = '320px';
                wrap.appendChild(
                  createCommand({
                    placeholder: t('demonstration.labels.searchPlaceholder'),
                    items: longListLabels.map(label => ({
                      value: label.toLowerCase(),
                      label,
                      group: t('demonstration.labels.groupComponents'),
                    })),
                  })
                );
                return wrap;
              },
            },
          ],
        });
      }

      // ─── 7. Estados ────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger:  t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            {
              label:    t('states.empty.label'),
              trigger:  stripHtml(t('states.empty.trigger')),
              behavior: t('states.empty.behavior'),
            },
            {
              label:    t('states.selected.label'),
              trigger:  stripHtml(t('states.selected.trigger')),
              behavior: t('states.selected.behavior'),
            },
            {
              label:    t('states.disabled.label'),
              trigger:  stripHtml(t('states.disabled.trigger')),
              behavior: t('states.disabled.behavior'),
            },
            {
              label:    t('states.loading.label'),
              trigger:  stripHtml(t('states.loading.trigger')),
              behavior: t('states.loading.behavior'),
            },
          ],
        });

      // ─── 8. Propriedades ───────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `// CommandOptions
export type CommandOptions = {
  placeholder?: string;
  items: CommandItem[];
  onSelect?: (value: string) => void;
  class?: string;
};

// CommandItem
export type CommandItem = {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
};`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
          tables: [
            {
              title: t('props.commandTitle'),
              cols: propsCols,
              items: [
                { name: 'placeholder', type: 'string',                defaultValue: '"Search…"', required: 'Não', description: stripHtml(t('props.table.inputPlaceholder')) },
                { name: 'items',       type: 'CommandItem[]',          defaultValue: '—',         required: 'Sim', description: 'Lista de itens renderizados e filtrados.' },
                { name: 'onSelect',    type: '(value: string) => void', defaultValue: '—',        required: 'Não', description: stripHtml(t('props.table.itemOnSelect')) },
                { name: 'class',       type: 'string',                defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
            {
              title: t('props.commandItemTitle'),
              cols: propsCols,
              items: [
                { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: stripHtml(t('props.table.itemValue'))    },
                { name: 'label',    type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Texto exibido no item.'                  },
                { name: 'group',    type: 'string',  defaultValue: '—',     required: 'Não', description: 'Nome do grupo para agrupar itens.'        },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.itemDisabled'))  },
              ],
            },
          ],
        });
      }

      // ─── 9. Tokens ─────────────────────────────────────────────────────
      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens semânticos */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
}

.dark {
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--popover',            value: 'bg-popover',              description: t('tokens.table.popoverBg')   },
            { token: '--popover-foreground', value: 'text-popover-foreground', description: t('tokens.table.popoverFg')   },
            { token: '--muted-foreground',   value: 'text-muted-foreground',   description: t('tokens.table.mutedFg')     },
            { token: '--background',         value: 'bg-transparent',          description: t('tokens.table.inputBg')     },
            { token: '--border',             value: 'border-b',                description: t('tokens.table.inputBorder') },
            { token: '--accent',             value: 'bg-accent',               description: t('tokens.table.selectedBg')  },
            { token: '--accent-foreground',  value: 'text-accent-foreground',  description: t('tokens.table.selectedFg')  },
            { token: '--border',             value: 'border',                  description: t('tokens.table.border')      },
            { token: '--radius',             value: 'rounded-md / rounded-sm', description: t('tokens.table.radius')      },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      // ─── 10. Acessibilidade ────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: tNav('common.keyboardNav') || 'Navegação por teclado',
          keyboardItems: [
            { key: '↓',      description: stripHtml(t('accessibility.keyboard.arrowDown')) },
            { key: '↑',      description: stripHtml(t('accessibility.keyboard.arrowUp'))   },
            { key: 'Enter',  description: stripHtml(t('accessibility.keyboard.enter'))      },
            { key: 'Escape', description: stripHtml(t('accessibility.keyboard.escape'))     },
            { key: 'Tab',    description: stripHtml(t('accessibility.keyboard.tab'))        },
            { key: '⌘K',    description: stripHtml(t('accessibility.keyboard.cmdK'))       },
          ],
        });

      // ─── 11. Relacionados ──────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Select',       description: t('related.select'),       path: '?path=/docs/ui-select--docs'        },
            { name: 'DropdownMenu', description: t('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs'  },
            { name: 'Popover',      description: t('related.popover'),      path: '?path=/docs/ui-popover--docs'       },
            { name: 'Dialog',       description: t('related.dialog'),       path: '?path=/docs/ui-dialog--docs'        },
          ],
        });

      // ─── 12. Notas ─────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
          ],
        });

      // ─── 13. Analytics ─────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            {
              event:   t('analytics.table.itemSelect'),
              trigger: t('analytics.table.itemSelectTrigger'),
              payload: t('analytics.table.itemSelectPayload'),
            },
            {
              event:   t('analytics.table.paletteOpen'),
              trigger: t('analytics.table.paletteOpenTrigger'),
              payload: t('analytics.table.paletteOpenPayload'),
            },
            {
              event:   t('analytics.table.pageView'),
              trigger: t('analytics.table.pageViewTrigger'),
              payload: t('analytics.table.pageViewPayload'),
            },
            {
              event:   t('analytics.table.sectionViewed'),
              trigger: t('analytics.table.sectionViewedTrigger'),
              payload: t('analytics.table.sectionViewedPayload'),
            },
            {
              event:   t('analytics.table.langSwitch'),
              trigger: t('analytics.table.langSwitchTrigger'),
              payload: t('analytics.table.langSwitchPayload'),
            },
          ],
        });

      // ─── 14. Testes ────────────────────────────────────────────────────
      case 'testes': {
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
              criterion: t(`testes.accessibility.item${i}`),
              level:     'AA',
              how:       'axe-core / manual',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
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
        component_name: 'command',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ────────────────────────────────────────────────────────

  renderHeader();
  buildSidebar();
  renderAllSections();

  cleanups.push(
    subscribe(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    })
  );
  cleanups.push(
    onLocaleChange(() => {
      renderHeader();
      buildSidebar();
      renderAllSections();
    })
  );

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
