import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createContextMenu } from '@/components/ui/context-menu';
import uiTranslations from '@/i18n/ui.json';
import contextMenuTranslations from '@shared/content/context-menu/translations.json';

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
const { t, subscribe } = createTranslation(contextMenuTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function makeTriggerArea(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'flex h-[120px] w-full max-w-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground select-none cursor-default';
  el.textContent = label;
  return el;
}

function buildDemoMenu(): HTMLElement {
  const trigger = makeTriggerArea(t('demonstration.labels.triggerLabel'));
  return createContextMenu({
    trigger,
    items: [
      { type: 'item',      label: t('demonstration.labels.edit'),      value: 'edit' },
      { type: 'item',      label: t('demonstration.labels.duplicate'), value: 'duplicate' },
      { type: 'item',      label: t('demonstration.labels.share'),     value: 'share' },
      { type: 'separator' },
      { type: 'item',      label: t('demonstration.labels.delete'),    value: 'delete' },
    ],
  });
}

function buildSimpleTriggerArea(label: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center justify-center p-4';
  wrap.appendChild(makeTriggerArea(label));
  return wrap;
}

// ─── createContextMenuDocs ────────────────────────────────────────────────────

export function createContextMenuDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'context-menu',
    });
    track('docs_page_view', {
      component_name: 'context_menu',
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
  const root       = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main       = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add context-menu',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Section order ─────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      // ── 1. Demonstração ──────────────────────────────────────────────────
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'flex items-center justify-center p-8 min-h-[200px]';
            wrap.appendChild(buildDemoMenu());
            return wrap;
          },
        });

      // ── 2. Anatomia ──────────────────────────────────────────────────────
      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      // ── 3. Quando Usar ───────────────────────────────────────────────────
      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario:    t('usage.scenarios.cols.scenario'),
              use:         t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1, 2, 3, 4].map(i => ({
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

      // ── 4. Do & Don't ────────────────────────────────────────────────────
      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption:    t('doDont.pair1.do'),
              dontCaption:  t('doDont.pair1.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col gap-2 text-sm p-2';
                const label = document.createElement('p');
                label.className = 'text-muted-foreground text-xs';
                label.textContent = t('demonstration.labels.triggerLabel');
                const actions = document.createElement('div');
                actions.className = 'flex gap-2';
                ['Editar', 'Duplicar', 'Excluir'].forEach(a => {
                  const btn = document.createElement('button');
                  btn.className = 'text-xs px-2 py-1 rounded border border-border hover:bg-accent';
                  btn.textContent = a;
                  actions.appendChild(btn);
                });
                wrap.append(label, actions);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-center justify-center p-2 text-sm';
                const area = makeTriggerArea(t('demonstration.labels.triggerLabel'));
                area.className += ' opacity-60';
                const note = document.createElement('p');
                note.className = 'text-xs text-muted-foreground mt-2 text-center';
                note.textContent = 'Sem alternativa visível';
                const inner = document.createElement('div');
                inner.className = 'flex flex-col items-center gap-2 w-full';
                inner.append(area, note);
                wrap.appendChild(inner);
                return wrap;
              },
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption:    t('doDont.pair2.do'),
              dontCaption:  t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const menu = document.createElement('ul');
                menu.setAttribute('role', 'menu');
                menu.className =
                  'min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
                function mkItem(label: string, destructive = false) {
                  const li = document.createElement('li');
                  li.setAttribute('role', 'menuitem');
                  li.className = [
                    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                    destructive ? 'text-destructive' : '',
                  ].join(' ');
                  li.textContent = label;
                  return li;
                }
                const sep = document.createElement('li');
                sep.setAttribute('role', 'separator');
                sep.className = '-mx-1 my-1 h-px bg-muted';
                menu.append(mkItem('Editar'), mkItem('Duplicar'), sep, mkItem(t('demonstration.labels.delete'), true));
                return menu;
              },
              dontPreviewFactory: () => {
                const menu = document.createElement('ul');
                menu.setAttribute('role', 'menu');
                menu.className =
                  'min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
                // Submenu aninhado — anti-padrão
                function mkSubItem(labelText: string): HTMLLIElement {
                  const li = document.createElement('li');
                  li.setAttribute('role', 'menuitem');
                  li.className = 'px-2 py-1.5 text-sm flex justify-between';
                  const lSpan = document.createElement('span');
                  lSpan.textContent = labelText;
                  const arrow = document.createElement('span');
                  arrow.className = 'text-muted-foreground';
                  arrow.textContent = '›';
                  li.append(lSpan, arrow);
                  return li;
                }
                menu.append(mkSubItem('Compartilhar'), mkSubItem('Enviar'), mkSubItem('Exportar'));
                return menu;
              },
            },
            {
              doLabel:      tNav('common.do'),
              dontLabel:    tNav('common.dont'),
              doCaption:    t('doDont.pair3.do'),
              dontCaption:  t('doDont.pair3.dont'),
              doPreviewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm min-w-[160px] border border-border rounded-md';
                const labelSpan = document.createElement('span');
                labelSpan.className = 'flex-1';
                labelSpan.textContent = 'Editar';
                const sc = document.createElement('span');
                sc.className = 'ml-auto text-xs tracking-widest text-muted-foreground';
                sc.setAttribute('aria-hidden', 'true');
                sc.textContent = '⌘E';
                li.append(labelSpan, sc);
                return li;
              },
              dontPreviewFactory: () => {
                const area = makeTriggerArea(t('demonstration.labels.triggerLabel'));
                const wrap = document.createElement('div');
                wrap.className = 'flex flex-col items-center gap-2 p-2';
                const hint = document.createElement('p');
                hint.className = 'text-xs text-muted-foreground text-center opacity-30';
                hint.textContent = '(sem dica visual)';
                wrap.append(area, hint);
                return wrap;
              },
            },
          ],
        });

      // ── 5. Importação ────────────────────────────────────────────────────
      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createContextMenu } from '@/components/ui/context-menu';`,
          secondaryDescription: t('import.withCheckbox'),
          secondaryCode: `// Com radio/checkbox — monte o menu manualmente e adicione os atributos ARIA
// role="menuitemcheckbox" + aria-checked para CheckboxItem
// role="menuitemradio"    + aria-checked para RadioItem`,
        });

      // ── 6. Variantes ─────────────────────────────────────────────────────
      case 'variantes': {
        const codeDefault = `const trigger = document.createElement('div');
trigger.textContent = 'Clique com o botão direito';

createContextMenu({
  trigger,
  items: [
    { type: 'item', label: 'Editar',      value: 'edit'      },
    { type: 'item', label: 'Duplicar',    value: 'duplicate' },
    { type: 'separator' },
    { type: 'item', label: 'Excluir',     value: 'delete'    },
  ],
});`;

        const codeDestructive = `// Item destrutivo: classes aplicadas manualmente
const li = document.createElement('li');
li.setAttribute('role', 'menuitem');
li.className = [
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
  'text-destructive focus:bg-destructive/10 focus:text-destructive',
].join(' ');
li.textContent = 'Excluir';`;

        const codeCheckbox = `// CheckboxItem: role menuitemcheckbox + aria-checked
const li = document.createElement('li');
li.setAttribute('role', 'menuitemcheckbox');
li.setAttribute('aria-checked', 'true');
li.className = 'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm';`;

        const codeRadio = `// RadioItem: role menuitemradio + aria-checked
const li = document.createElement('li');
li.setAttribute('role', 'menuitemradio');
li.setAttribute('aria-checked', 'false');
li.className = 'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm';`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: t('variants.items.default'),
              code: codeDefault,
              previewFactory: () => buildSimpleTriggerArea(t('demonstration.labels.triggerLabel')),
            },
            {
              name: 'destructive',
              description: t('variants.items.destructive'),
              code: codeDestructive,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.className =
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive border border-destructive/30 rounded-md';
                li.textContent = t('demonstration.labels.delete');
                return li;
              },
            },
            {
              name: 'checkboxItem',
              description: t('variants.checkboxItem'),
              code: codeCheckbox,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitemcheckbox');
                li.setAttribute('aria-checked', 'true');
                li.className =
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm border border-border rounded-md min-w-[160px]';
                const indicator = document.createElement('span');
                indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
                const labelEl = document.createElement('span');
                labelEl.textContent = 'Barra de Status';
                li.append(indicator, labelEl);
                return li;
              },
            },
            {
              name: 'radioItem',
              description: t('variants.radioItem'),
              code: codeRadio,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitemradio');
                li.setAttribute('aria-checked', 'true');
                li.className =
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm border border-border rounded-md min-w-[160px]';
                const indicator = document.createElement('span');
                indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>`;
                const labelEl = document.createElement('span');
                labelEl.textContent = 'Compacto';
                li.append(indicator, labelEl);
                return li;
              },
            },
            {
              name: 'subTrigger',
              description: t('variants.subTrigger'),
              code: `const subTrigger = document.createElement('li');
subTrigger.setAttribute('role', 'menuitem');
subTrigger.setAttribute('aria-haspopup', 'menu');
subTrigger.setAttribute('aria-expanded', 'false');
subTrigger.className = '... flex items-center gap-2 ...';
// ChevronRight inline SVG à direita`,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.setAttribute('aria-haspopup', 'menu');
                li.className =
                  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm border border-border rounded-md min-w-[160px]';
                const labelEl = document.createElement('span');
                labelEl.className = 'flex-1';
                labelEl.textContent = t('demonstration.labels.share');
                const chevron = document.createElement('span');
                chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>`;
                li.append(labelEl, chevron);
                return li;
              },
            },
            {
              name: 'label',
              description: t('variants.label'),
              code: `const lbl = document.createElement('li');
lbl.setAttribute('role', 'presentation');
lbl.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
lbl.textContent = 'Ações';`,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'presentation');
                li.className =
                  'px-2 py-1.5 text-xs font-semibold text-muted-foreground border border-border rounded-md min-w-[160px]';
                li.textContent = 'Ações';
                return li;
              },
            },
          ],
        });
      }

      // ── 7. Estados ───────────────────────────────────────────────────────
      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger:  t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.closed.label'),  trigger: t('states.closed.trigger'),  behavior: t('states.closed.behavior')  },
            { label: t('states.open.label'),     trigger: t('states.open.trigger'),    behavior: t('states.open.behavior')    },
            { label: t('states.focused.label'),  trigger: t('states.focused.trigger'), behavior: t('states.focused.behavior') },
            { label: t('states.disabled.label'), trigger: t('states.disabled.trigger'),behavior: t('states.disabled.behavior')},
            { label: t('states.checked.label'),  trigger: t('states.checked.trigger'), behavior: t('states.checked.behavior') },
            { label: t('states.subOpen.label'),  trigger: t('states.subOpen.trigger'), behavior: t('states.subOpen.behavior') },
          ],
        });

      // ── 8. Propriedades ──────────────────────────────────────────────────
      case 'propriedades': {
        const interfaceCode = `// createContextMenu(options)
export type ContextMenuItemDef = {
  type?:     'item' | 'separator' | 'label';
  value?:    string;
  label?:    string;
  disabled?: boolean;
  onClick?:  () => void;
};

export type ContextMenuOptions = {
  trigger:        HTMLElement;
  items:          ContextMenuItemDef[];
  onOpenChange?:  (open: boolean) => void;
  class?:         string;
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
          tables: [
            {
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                    defaultValue: '—',    required: 'Sim', description: 'Elemento HTML que captura o contextmenu (right-click).' },
                { name: 'items',        type: 'ContextMenuItemDef[]',           defaultValue: '—',    required: 'Sim', description: 'Lista de itens, separadores e labels do menu.' },
                { name: 'onOpenChange', type: '(open: boolean) => void',        defaultValue: '—',    required: 'Não', description: t('props.items.onOpenChange') },
                { name: 'class',        type: 'string',                         defaultValue: '—',    required: 'Não', description: 'Classes extras aplicadas ao painel do menu.' },
              ],
            },
            {
              title: t('props.itemTitle'),
              cols: propsCols,
              items: [
                { name: 'type',     type: '"item" | "separator" | "label"', defaultValue: '"item"', required: 'Não', description: 'Tipo do item no menu.' },
                { name: 'label',    type: 'string',                         defaultValue: '—',      required: 'Não', description: 'Texto exibido no item ou label.' },
                { name: 'value',    type: 'string',                         defaultValue: '—',      required: 'Não', description: t('props.items.value') },
                { name: 'disabled', type: 'boolean',                        defaultValue: 'false',  required: 'Não', description: t('props.items.disabled') },
                { name: 'onClick',  type: '() => void',                     defaultValue: '—',      required: 'Não', description: t('props.items.onSelect') },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      // ── 9. Tokens ────────────────────────────────────────────────────────
      case 'tokens': {
        const customizationCode = `/* Em styles.css — sobrescrever tokens do popover */
:root {
  --popover:            0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --accent:             240 4.8% 95.9%;
  --accent-foreground:  240 5.9% 10%;
  --destructive:        0 84.2% 60.2%;
}

.dark {
  --popover:            240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --accent:             240 3.7% 15.9%;
  --accent-foreground:  0 0% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--popover',            value: 'bg-popover',           description: t('tokens.table.popoverBg')        },
            { token: '--popover-foreground', value: 'text-popover-foreground', description: t('tokens.table.popoverFg')    },
            { token: '--accent',             value: 'bg-accent',            description: t('tokens.table.accentBg')         },
            { token: '--accent-foreground',  value: 'text-accent-foreground',  description: t('tokens.table.accentFg')     },
            { token: '--destructive',        value: 'text-destructive',     description: t('tokens.table.destructive')      },
            { token: '--destructive',        value: 'bg-destructive/10',    description: t('tokens.table.destructiveFocus') },
            { token: '--muted-foreground',   value: 'text-muted-foreground',description: t('tokens.table.mutedFg')          },
            { token: '--border',             value: 'bg-muted / border',    description: t('tokens.table.border')           },
            { token: '--shadow-md',          value: 'shadow-md',            description: t('tokens.table.shadow')           },
            { token: '--radius',             value: 'rounded-md / rounded-sm', description: t('tokens.table.radius')        },
            { token: 'z-50',                 value: 'z-50',                 description: t('tokens.table.zIndex')           },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      // ── 10. Acessibilidade ───────────────────────────────────────────────
      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.warning'),
            t('accessibility.aria.roleMenu'),
            t('accessibility.aria.roleMenuItem'),
            t('accessibility.aria.roleMenuitemCheckbox'),
            t('accessibility.aria.roleMenuitemRadio'),
            t('accessibility.aria.ariaChecked'),
            t('accessibility.aria.ariaDisabled'),
            t('accessibility.aria.ariaHaspopup'),
            t('accessibility.aria.ariaExpanded'),
          ],
          keyboardTitle: tNav('common.keyboard'),
          keyboardItems: [
            { key: 'Right-click / Menu', description: t('accessibility.keyboard.rightClick') },
            { key: '↓',                  description: t('accessibility.keyboard.arrowDown')  },
            { key: '↑',                  description: t('accessibility.keyboard.arrowUp')    },
            { key: '→',                  description: t('accessibility.keyboard.arrowRight') },
            { key: '←',                  description: t('accessibility.keyboard.arrowLeft')  },
            { key: 'Enter',              description: t('accessibility.keyboard.enter')      },
            { key: 'Space',              description: t('accessibility.keyboard.space')      },
            { key: 'Esc',                description: t('accessibility.keyboard.escape')     },
            { key: 'Tab',                description: t('accessibility.keyboard.tab')        },
          ],
        });

      // ── 11. Relacionados ─────────────────────────────────────────────────
      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'DropdownMenu', description: t('related.dropdownMenu'), path: '?path=/docs/ui-dropdownmenu--docs'  },
            { name: 'Menubar',      description: t('related.menubar'),      path: '?path=/docs/ui-menubar--docs'       },
            { name: 'Dialog',       description: t('related.dialog'),       path: '?path=/docs/ui-dialog--docs'        },
            { name: 'AlertDialog',  description: t('related.alertDialog'),  path: '?path=/docs/ui-alertdialog--docs'   },
            { name: 'Tooltip',      description: t('related.tooltip'),      path: '?path=/docs/ui-tooltip--docs'       },
          ],
        });

      // ── 12. Notas ────────────────────────────────────────────────────────
      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
            { title: '', content: t('notes.tip5') },
          ],
        });

      // ── 13. Analytics ────────────────────────────────────────────────────
      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.menuOpen'),      trigger: t('analytics.table.menuOpenTrigger'),      payload: t('analytics.table.menuOpenPayload')      },
            { event: t('analytics.table.itemClick'),     trigger: t('analytics.table.itemClickTrigger'),     payload: t('analytics.table.itemClickPayload')     },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload')      },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload')    },
          ],
        });

      // ── 14. Testes ───────────────────────────────────────────────────────
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
              priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
            })),
          },
        });
      }
    }
  }

  // ── Render all sections ────────────────────────────────────────────────────

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

  // ── IntersectionObserver ──────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'context_menu',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ─────────────────────────────────────────────────────────

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
