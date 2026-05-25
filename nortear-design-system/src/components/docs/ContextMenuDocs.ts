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
    'nds-cluster nds-w-full nds-rounded-md nds-border-default nds-text-body nds-text-muted-foreground nds-cursor-default';
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.style.height = '120px';
  el.style.maxWidth = '300px';
  el.style.borderStyle = 'dashed';
  el.style.userSelect = 'none';
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
  wrap.className = 'nds-cluster nds-p-4';
  wrap.dataset.align = 'center';
  wrap.dataset.justify = 'center';
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
    'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
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
            wrap.className = 'nds-cluster nds-p-8';
            wrap.dataset.align = 'center';
            wrap.dataset.justify = 'center';
            wrap.style.minHeight = '200px';
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
                wrap.className = 'nds-stack nds-text-body nds-p-2';
                wrap.dataset.spacing = 'sm';
                const label = document.createElement('p');
                label.className = 'nds-text-muted-foreground nds-text-caption';
                label.textContent = t('demonstration.labels.triggerLabel');
                const actions = document.createElement('div');
                actions.className = 'nds-cluster';
                actions.dataset.spacing = 'sm';
                ['Editar', 'Duplicar', 'Excluir'].forEach(a => {
                  const btn = document.createElement('button');
                  btn.className = 'nds-text-caption nds-px-2 nds-py-1 nds-rounded nds-border-default nds-hover-bg-accent';
                  btn.textContent = a;
                  actions.appendChild(btn);
                });
                wrap.append(label, actions);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster nds-p-2 nds-text-body';
                wrap.dataset.align = 'center';
                wrap.dataset.justify = 'center';
                const area = makeTriggerArea(t('demonstration.labels.triggerLabel'));
                area.style.opacity = '0.6';
                const note = document.createElement('p');
                note.className = 'nds-text-caption nds-text-muted-foreground nds-mt-2';
                note.style.textAlign = 'center';
                note.textContent = 'Sem alternativa visível';
                const inner = document.createElement('div');
                inner.className = 'nds-stack nds-w-full';
                inner.dataset.spacing = 'sm';
                inner.style.alignItems = 'center';
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
                  'nds-overflow-hidden nds-rounded-md nds-border-default nds-shadow-md';
                menu.style.minWidth = '8rem';
                menu.style.padding = 'var(--spacing-1)';
                menu.style.background = 'hsl(var(--popover))';
                menu.style.color = 'hsl(var(--popover-foreground))';
                function mkItem(label: string, destructive = false) {
                  const li = document.createElement('li');
                  li.setAttribute('role', 'menuitem');
                  li.className = [
                    'nds-cluster nds-rounded-sm nds-px-2 nds-text-body',
                    destructive ? 'text-destructive' : '',
                  ].join(' ');
                  li.textContent = label;
                  return li;
                }
                const sep = document.createElement('li');
                sep.setAttribute('role', 'separator');
                sep.className = 'nds-bg-muted';
                sep.style.marginInline = '-0.25rem';
                sep.style.marginBlock = '0.25rem';
                sep.style.height = '1px';
                menu.append(mkItem('Editar'), mkItem('Duplicar'), sep, mkItem(t('demonstration.labels.delete'), true));
                return menu;
              },
              dontPreviewFactory: () => {
                const menu = document.createElement('ul');
                menu.setAttribute('role', 'menu');
                menu.className =
                  'nds-overflow-hidden nds-rounded-md nds-border-default nds-shadow-md';
                menu.style.minWidth = '8rem';
                menu.style.padding = 'var(--spacing-1)';
                menu.style.background = 'hsl(var(--popover))';
                menu.style.color = 'hsl(var(--popover-foreground))';
                // Submenu aninhado — anti-padrão
                function mkSubItem(labelText: string): HTMLLIElement {
                  const li = document.createElement('li');
                  li.setAttribute('role', 'menuitem');
                  li.className = 'nds-cluster nds-px-2 nds-text-body';
                  li.dataset.justify = 'between';
                  li.style.paddingBlock = '0.375rem';
                  const lSpan = document.createElement('span');
                  lSpan.textContent = labelText;
                  const arrow = document.createElement('span');
                  arrow.className = 'nds-text-muted-foreground';
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
                  'nds-cluster nds-rounded-md nds-px-2 nds-text-body nds-border-default';
                li.style.minWidth = '160px';
                const labelSpan = document.createElement('span');
                labelSpan.className = 'nds-flex-1';
                labelSpan.textContent = 'Editar';
                const sc = document.createElement('span');
                sc.className = 'nds-text-caption nds-tracking-wider nds-text-muted-foreground';
                sc.style.marginLeft = 'auto';
                sc.setAttribute('aria-hidden', 'true');
                sc.textContent = '⌘E';
                li.append(labelSpan, sc);
                return li;
              },
              dontPreviewFactory: () => {
                const area = makeTriggerArea(t('demonstration.labels.triggerLabel'));
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack nds-p-2';
                wrap.dataset.spacing = 'sm';
                wrap.style.alignItems = 'center';
                const hint = document.createElement('p');
                hint.className = 'nds-text-caption nds-text-muted-foreground';
                hint.style.textAlign = 'center';
                hint.style.opacity = '0.3';
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
  'nds-cluster nds-rounded-sm nds-px-2 nds-text-body',
  'text-destructive focus:bg-destructive/10 focus:text-destructive',
].join(' ');
li.textContent = 'Excluir';`;

        const codeCheckbox = `// CheckboxItem: role menuitemcheckbox + aria-checked
const li = document.createElement('li');
li.setAttribute('role', 'menuitemcheckbox');
li.setAttribute('aria-checked', 'true');
li.className = 'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';`;

        const codeRadio = `// RadioItem: role menuitemradio + aria-checked
const li = document.createElement('li');
li.setAttribute('role', 'menuitemradio');
li.setAttribute('aria-checked', 'false');
li.className = 'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';`;

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
                  'nds-cluster nds-rounded-md nds-px-2 nds-text-body nds-text-destructive nds-border-destructive-soft';
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
                  'nds-cluster nds-rounded-md nds-px-2 nds-text-body nds-border-default';
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
                  'nds-cluster nds-rounded-md nds-px-2 nds-text-body nds-border-default';
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
subTrigger.className = '... nds-cluster ...';
// ChevronRight inline SVG à direita`,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'menuitem');
                li.setAttribute('aria-haspopup', 'menu');
                li.className =
                  'nds-cluster nds-rounded-md nds-px-2 nds-text-body nds-border-default';
                const labelEl = document.createElement('span');
                labelEl.className = 'nds-flex-1';
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
lbl.className = 'nds-px-2 nds-text-caption nds-font-semibold nds-text-muted-foreground';
lbl.textContent = 'Ações';`,
              previewFactory: () => {
                const li = document.createElement('li');
                li.setAttribute('role', 'presentation');
                li.className =
                  'nds-px-2 nds-text-caption nds-font-semibold nds-text-muted-foreground nds-border-default nds-rounded-md';
                li.style.minWidth = '160px';
                li.textContent = 'Ações';
                return li;
              },
            },
          ],
        });
      }

      // ── 6b. Composições ──────────────────────────────────────────────────
      case 'composicoes': {
        const codeCompCheckbox = `// Itens com role="menuitemcheckbox" + aria-checked
const li = document.createElement('li');
li.setAttribute('role', 'menuitemcheckbox');
li.setAttribute('aria-checked', String(showGrid));
li.className = 'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';

// Indicador (check svg) visível quando aria-checked === "true"
const indicator = document.createElement('span');
indicator.className = 'nds-cluster';
indicator.dataset.align = 'center';
indicator.dataset.justify = 'center';
indicator.style.width = '0.875rem';
indicator.style.height = '0.875rem';
if (showGrid) indicator.appendChild(createCheckSvg());

const label = document.createElement('span');
label.textContent = 'Mostrar grade';

li.append(indicator, label);
li.addEventListener('click', () => {
  showGrid = !showGrid;
  li.setAttribute('aria-checked', String(showGrid));
  indicator.replaceChildren();
  if (showGrid) indicator.appendChild(createCheckSvg());
});`;

        const codeCompRadio = `// Itens com role="menuitemradio" + aria-checked
const radioGroup = document.createElement('ul');
radioGroup.setAttribute('role', 'group');

options.forEach(opt => {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitemradio');
  li.setAttribute('aria-checked', String(opt.value === selected));
  li.addEventListener('click', () => {
    selected = opt.value;
    rebuildItems();
  });
  // ... indicador + label
});`;

        const codeCompSubmenu = `// SubTrigger com aria-haspopup="menu" + aria-expanded
const subTrigger = document.createElement('li');
subTrigger.setAttribute('role', 'menuitem');
subTrigger.setAttribute('aria-haspopup', 'menu');
subTrigger.setAttribute('aria-expanded', 'false');

// SubContent posicionado à direita ao abrir
subTrigger.addEventListener('mouseenter', openSub);
subTrigger.addEventListener('focus',      openSub);

function openSub() {
  const rect = subTrigger.getBoundingClientRect();
  subContent.style.top  = rect.top + 'px';
  subContent.style.left = (rect.right + 4) + 'px';
  subContent.style.display = 'block';
  subTrigger.setAttribute('aria-expanded', 'true');
}`;

        const codeCompShortcuts = `// Item + atalho visual (aria-hidden) — atalho real exige listener global
const li = document.createElement('li');
li.setAttribute('role', 'menuitem');
li.className = 'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';

const label = document.createElement('span');
label.className = 'nds-flex-1';
label.textContent = 'Editar';

const sc = document.createElement('span');
sc.className = 'nds-text-caption nds-tracking-wider nds-text-muted-foreground';
sc.style.marginLeft = 'auto';
sc.setAttribute('aria-hidden', 'true');
sc.textContent = '⌘E';

li.append(label, sc);`;

        // ── Helpers de DOM para os previews ─────────────────────────────────
        function makeMenuPanel(): HTMLUListElement {
          const ul = document.createElement('ul');
          ul.setAttribute('role', 'menu');
          ul.className =
            'nds-overflow-hidden nds-rounded-md nds-border-default nds-shadow-md';
          ul.style.minWidth = '10rem';
          ul.style.padding = 'var(--spacing-1)';
          ul.style.background = 'hsl(var(--popover))';
          ul.style.color = 'hsl(var(--popover-foreground))';
          return ul;
        }
        function makeMenuItem(text: string, opts?: { destructive?: boolean }): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitem');
          li.className = [
            'nds-cluster nds-rounded-sm nds-px-2 nds-text-body',
            opts?.destructive ? 'text-destructive' : '',
          ].join(' ');
          li.textContent = text;
          return li;
        }
        function makeSeparator(): HTMLLIElement {
          const sep = document.createElement('li');
          sep.setAttribute('role', 'separator');
          sep.className = 'nds-bg-muted';
          sep.style.marginInline = '-0.25rem';
          sep.style.marginBlock = '0.25rem';
          sep.style.height = '1px';
          return sep;
        }
        function makeLabel(text: string): HTMLLIElement {
          const lbl = document.createElement('li');
          lbl.setAttribute('role', 'presentation');
          lbl.className = 'nds-px-2 nds-text-caption nds-font-semibold nds-text-muted-foreground';
          lbl.textContent = text;
          return lbl;
        }
        function createCheckSvg(): SVGSVGElement {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '14');
          svg.setAttribute('height', '14');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '2');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M20 6 9 17l-5-5');
          svg.appendChild(path);
          return svg;
        }
        function createDotSvg(): SVGSVGElement {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '8');
          svg.setAttribute('height', '8');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'currentColor');
          const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '8');
          svg.appendChild(c);
          return svg;
        }
        function createChevronSvg(): SVGSVGElement {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '14');
          svg.setAttribute('height', '14');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '2');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'm9 18 6-6-6-6');
          svg.appendChild(path);
          return svg;
        }
        function makeCheckboxItem(label: string, initial: boolean): HTMLLIElement {
          let checked = initial;
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitemcheckbox');
          li.setAttribute('aria-checked', String(checked));
          li.className =
            'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';
          const ind = document.createElement('span');
          ind.className = 'nds-cluster';
          ind.dataset.align = 'center';
          ind.dataset.justify = 'center';
          ind.style.width = '0.875rem';
          ind.style.height = '0.875rem';
          if (checked) ind.appendChild(createCheckSvg());
          const lbl = document.createElement('span');
          lbl.textContent = label;
          li.append(ind, lbl);
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            checked = !checked;
            li.setAttribute('aria-checked', String(checked));
            ind.replaceChildren();
            if (checked) ind.appendChild(createCheckSvg());
          });
          return li;
        }
        function makeRadioItem(label: string, value: string, getSelected: () => string, setSelected: (v: string) => void): { el: HTMLLIElement; sync: () => void } {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitemradio');
          li.className =
            'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';
          const ind = document.createElement('span');
          ind.className = 'nds-cluster';
          ind.dataset.align = 'center';
          ind.dataset.justify = 'center';
          ind.style.width = '0.875rem';
          ind.style.height = '0.875rem';
          const lbl = document.createElement('span');
          lbl.textContent = label;
          li.append(ind, lbl);
          function sync() {
            const sel = getSelected();
            li.setAttribute('aria-checked', String(value === sel));
            ind.replaceChildren();
            if (value === sel) ind.appendChild(createDotSvg());
          }
          sync();
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelected(value);
          });
          return { el: li, sync };
        }
        function makeItemWithShortcut(text: string, shortcut: string, destructive = false): HTMLLIElement {
          const li = document.createElement('li');
          li.setAttribute('role', 'menuitem');
          li.className = [
            'nds-cluster nds-rounded-sm nds-px-2 nds-text-body',
            destructive ? 'text-destructive' : '',
          ].join(' ');
          const lbl = document.createElement('span');
          lbl.className = 'nds-flex-1';
          lbl.textContent = text;
          const sc = document.createElement('span');
          sc.className = 'nds-text-caption nds-tracking-wider nds-text-muted-foreground';
sc.style.marginLeft = 'auto';
          sc.setAttribute('aria-hidden', 'true');
          sc.textContent = shortcut;
          li.append(lbl, sc);
          return li;
        }

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'context-menu',
          items: [
            {
              name: t('variants.compositions.withCheckbox.name'),
              description: t('variants.compositions.withCheckbox.description'),
              useWhen: t('variants.compositions.withCheckbox.use'),
              code: codeCompCheckbox,
              previewFactory: () => {
                const menu = makeMenuPanel();
                menu.append(
                  makeLabel('Visualização'),
                  makeCheckboxItem('Mostrar grade', true),
                  makeCheckboxItem('Mostrar réguas', false),
                );
                return menu;
              },
            },
            {
              name: t('variants.compositions.withRadio.name'),
              description: t('variants.compositions.withRadio.description'),
              useWhen: t('variants.compositions.withRadio.use'),
              code: codeCompRadio,
              previewFactory: () => {
                const menu = makeMenuPanel();
                let selected = '100';
                const items: Array<{ sync: () => void }> = [];
                const opts = [
                  { value: '75',  label: '75%'  },
                  { value: '100', label: '100%' },
                  { value: '150', label: '150%' },
                ];
                menu.appendChild(makeLabel('Zoom'));
                opts.forEach(o => {
                  const ri = makeRadioItem(
                    o.label,
                    o.value,
                    () => selected,
                    (v) => { selected = v; items.forEach(i => i.sync()); },
                  );
                  items.push({ sync: ri.sync });
                  menu.appendChild(ri.el);
                });
                return menu;
              },
            },
            {
              name: t('variants.compositions.withSubmenu.name'),
              description: t('variants.compositions.withSubmenu.description'),
              useWhen: t('variants.compositions.withSubmenu.use'),
              code: codeCompSubmenu,
              previewFactory: () => {
                const menu = makeMenuPanel();
                menu.append(
                  makeMenuItem(t('demonstration.labels.edit')),
                  makeMenuItem(t('demonstration.labels.duplicate')),
                );
                const subTrigger = document.createElement('li');
                subTrigger.setAttribute('role', 'menuitem');
                subTrigger.setAttribute('aria-haspopup', 'menu');
                subTrigger.setAttribute('aria-expanded', 'false');
                subTrigger.className =
                  'nds-cluster nds-rounded-sm nds-px-2 nds-text-body';
                const subLabel = document.createElement('span');
                subLabel.className = 'nds-flex-1';
                subLabel.textContent = t('demonstration.labels.share');
                const chev = document.createElement('span');
                chev.appendChild(createChevronSvg());
                subTrigger.append(subLabel, chev);
                menu.appendChild(subTrigger);

                // SubContent inline (visualmente ao lado, sem flutuação real)
                const subContent = makeMenuPanel();
                subContent.append(
                  makeMenuItem(t('demonstration.labels.shareEmail')),
                  makeMenuItem(t('demonstration.labels.shareLink')),
                );

                const wrap = document.createElement('div');
                wrap.className = 'nds-cluster';
                wrap.dataset.spacing = 'sm';
                wrap.dataset.align = 'start';
                wrap.append(menu, subContent);
                return wrap;
              },
            },
            {
              name: t('variants.compositions.withShortcuts.name'),
              description: t('variants.compositions.withShortcuts.description'),
              useWhen: t('variants.compositions.withShortcuts.use'),
              code: codeCompShortcuts,
              previewFactory: () => {
                const menu = makeMenuPanel();
                menu.append(
                  makeItemWithShortcut(t('demonstration.labels.edit'), '⌘E'),
                  makeItemWithShortcut(t('demonstration.labels.duplicate'), '⌘D'),
                  makeSeparator(),
                  makeItemWithShortcut(t('demonstration.labels.delete'), '⌫', true),
                );
                return menu;
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
