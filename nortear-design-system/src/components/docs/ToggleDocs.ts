import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { Bold, Italic, Underline, List, Eye, AlignLeft } from 'lucide';
import { createToggle, type ToggleOptions, type ToggleSize, type ToggleVariant } from '@/components/ui/toggle';
import uiTranslations from '@/i18n/ui.json';
import toggleTranslations from '@shared/content/toggle/translations.json';

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
const { t, subscribe } = createTranslation(toggleTranslations as Record<string, unknown>);

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

// ─── Lucide icon → SVG (vanilla) ─────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function buildLucideSvg(icon: unknown, className = 'nds-icon-sm'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', className);

  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function wrapIcon(icon: unknown, className = 'nds-icon-sm'): HTMLSpanElement {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.appendChild(buildLucideSvg(icon, className));
  return span;
}

// ─── Toggle factories (docs preview) ──────────────────────────────────────────

function buildIconToggle(opts: {
  icon: unknown;
  ariaLabel: string;
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  fieldName?: string;
}): HTMLButtonElement {
  const toggleOpts: ToggleOptions = {
    pressed: opts.pressed ?? false,
    disabled: opts.disabled ?? false,
    variant: opts.variant ?? 'default',
    size: opts.size ?? 'default',
    children: wrapIcon(opts.icon),
  };
  if (opts.fieldName) {
    toggleOpts.onClick = (pressed) => {
      track('field_change', {
        component: 'toggle',
        field_name: opts.fieldName!,
        value: String(pressed),
        location: 'docs-demo',
      });
    };
  }
  const btn = createToggle(toggleOpts);
  btn.setAttribute('aria-label', opts.ariaLabel);
  return btn;
}

function buildLabelToggle(opts: {
  icon: unknown;
  labelText: string;
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  fieldName?: string;
}): HTMLButtonElement {
  const wrap = document.createElement('span');
  wrap.className = 'nds-cluster';
  wrap.dataset.spacing = 'xs';
  wrap.style.display = 'inline-flex';
  wrap.appendChild(buildLucideSvg(opts.icon));
  const text = document.createElement('span');
  text.textContent = opts.labelText;
  wrap.appendChild(text);

  const toggleOpts: ToggleOptions = {
    pressed: opts.pressed ?? false,
    disabled: opts.disabled ?? false,
    variant: opts.variant ?? 'default',
    size: opts.size ?? 'default',
    children: wrap,
  };
  if (opts.fieldName) {
    toggleOpts.onClick = (pressed) => {
      track('field_change', {
        component: 'toggle',
        field_name: opts.fieldName!,
        value: String(pressed),
        location: 'docs-demo',
      });
    };
  }
  return createToggle(toggleOpts);
}

// ─── createToggleDocs ─────────────────────────────────────────────────────────

export function createToggleDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'toggle',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'toggle', locale, page_title: `${t('title')} · Design System` });
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
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add toggle',
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

      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-stack';
            wrap.dataset.spacing = 'md';
            wrap.style.alignItems = 'flex-start';

            // 1) Toolbar de formatação (icon-only, default variant)
            const toolbar = document.createElement('div');
            toolbar.className = 'nds-cluster';
            toolbar.dataset.spacing = 'xs';
            toolbar.setAttribute('role', 'group');
            toolbar.setAttribute('aria-label', t('title'));
            toolbar.appendChild(buildIconToggle({ icon: Bold, ariaLabel: stripHtml(t('demonstration.labels.bold')), pressed: true, fieldName: 'bold' }));
            toolbar.appendChild(buildIconToggle({ icon: Italic, ariaLabel: stripHtml(t('demonstration.labels.italic')), fieldName: 'italic' }));
            toolbar.appendChild(buildIconToggle({ icon: Underline, ariaLabel: stripHtml(t('demonstration.labels.underline')), fieldName: 'underline' }));
            toolbar.appendChild(buildIconToggle({ icon: List, ariaLabel: stripHtml(t('demonstration.labels.list')), fieldName: 'list' }));
            wrap.appendChild(toolbar);

            // 2) Outline com label visível (Mostrar ocultos)
            wrap.appendChild(buildLabelToggle({
              icon: Eye,
              labelText: stripHtml(t('demonstration.labels.showHidden')),
              variant: 'outline',
              fieldName: 'show_hidden',
            }));

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [
              t('usage.guidelines.item1'),
              t('usage.guidelines.item2'),
              t('usage.guidelines.item3'),
              t('usage.guidelines.item4'),
            ],
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
            items: [
              t('usage.do.item1'),
              t('usage.do.item2'),
              t('usage.do.item3'),
              t('usage.do.item4'),
            ],
          },
          dont: {
            title: t('usage.dont.title'),
            items: [
              t('usage.dont.item1'),
              t('usage.dont.item2'),
              t('usage.dont.item3'),
              t('usage.dont.item4'),
            ],
          },
        });

      case 'do-dont': {
        const buildDoDescriptive = () =>
          buildIconToggle({ icon: Bold, ariaLabel: stripHtml(t('demonstration.labels.bold')), pressed: true });
        const buildDontGeneric = () => {
          const btn = buildIconToggle({ icon: Bold, ariaLabel: 'Botão B', pressed: true });
          return btn;
        };
        const buildDoGroupSurrogate = () => {
          // Conjunto: mostra ToggleGroup-like (3 toggles relacionados)
          const group = document.createElement('div');
          group.className = 'nds-cluster nds-rounded-md nds-border-default';
          group.dataset.spacing = 'xs';
          group.style.display = 'inline-flex';
          group.setAttribute('role', 'group');
          group.setAttribute('aria-label', 'Alinhamento de texto');
          const a = buildIconToggle({ icon: AlignLeft, ariaLabel: 'Alinhar à esquerda', pressed: true });
          a.style.borderRadius = '0';
          a.style.border = '0';
          group.appendChild(a);
          return group;
        };
        const buildDontLoose = () => {
          const wrap = document.createElement('div');
          wrap.className = 'nds-cluster';
          wrap.dataset.spacing = 'sm';
          wrap.appendChild(buildIconToggle({ icon: Bold, ariaLabel: 'Negrito' }));
          wrap.appendChild(buildIconToggle({ icon: Italic, ariaLabel: 'Itálico' }));
          return wrap;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: buildDoDescriptive,
              dontPreviewFactory: buildDontGeneric,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoGroupSurrogate,
              dontPreviewFactory: buildDontLoose,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createToggle, type ToggleOptions } from '@/components/ui/toggle';`,
          secondaryDescription: 'Uso básico (icon-only — aria-label OBRIGATÓRIO):',
          secondaryCode: `const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
icon.setAttribute('aria-hidden', 'true');
// ... popular SVG do lucide Bold

const toggle = createToggle({
  pressed: false,
  variant: 'default',
  size: 'default',
  children: icon,
  onClick: (pressed) => console.log('pressed:', pressed),
});
toggle.setAttribute('aria-label', 'Negrito');`,
        });

      case 'variantes': {
        return createDocsVariants({
          id: 'variantes',
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.default')),
              description: stripHtml(t('variants.styles.default')),
              code: `const t = createToggle({
  variant: 'default',
  children: iconBold,
});
t.setAttribute('aria-label', 'Negrito');`,
              previewFactory: () => buildIconToggle({
                icon: Bold,
                ariaLabel: stripHtml(t('demonstration.labels.bold')),
                pressed: true,
                variant: 'default',
              }),
            },
            {
              name: stripHtml(t('variants.items.outline')),
              description: stripHtml(t('variants.styles.outline')),
              code: `const t = createToggle({
  variant: 'outline',
  children: iconItalic,
});
t.setAttribute('aria-label', 'Itálico');`,
              previewFactory: () => buildIconToggle({
                icon: Italic,
                ariaLabel: stripHtml(t('demonstration.labels.italic')),
                variant: 'outline',
              }),
            },
            {
              name: stripHtml(t('variants.items.withLabel')),
              description: stripHtml(t('variants.styles.withLabel')),
              code: `// Ícone + texto visível — não precisa de aria-label
const wrap = document.createElement('span');
wrap.className = 'nds-cluster';
wrap.dataset.spacing = 'xs';
wrap.style.display = 'inline-flex';
wrap.appendChild(iconEye); // aria-hidden="true"
const span = document.createElement('span');
span.textContent = 'Mostrar ocultos';
wrap.appendChild(span);

const t = createToggle({ variant: 'outline', children: wrap });`,
              previewFactory: () => buildLabelToggle({
                icon: Eye,
                labelText: stripHtml(t('demonstration.labels.showHidden')),
                variant: 'outline',
              }),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'toggle',
          items: [
            {
              name: stripHtml(t('variants.compositions.toolbar.name')),
              description: stripHtml(t('variants.compositions.toolbar.description')),
              useWhen: stripHtml(t('variants.compositions.toolbar.use')),
              code: `const toolbar = document.createElement('div');
toolbar.setAttribute('role', 'group');
toolbar.setAttribute('aria-label', 'Formatação de texto');
toolbar.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-1';
toolbar.dataset.spacing = 'xs';

const bold = createToggle({ pressed: true, children: wrapIcon(Bold) });
bold.setAttribute('aria-label', 'Negrito');
toolbar.appendChild(bold);

const italic = createToggle({ children: wrapIcon(Italic) });
italic.setAttribute('aria-label', 'Itálico');
toolbar.appendChild(italic);

const underline = createToggle({ children: wrapIcon(Underline) });
underline.setAttribute('aria-label', 'Sublinhado');
toolbar.appendChild(underline);`,
              previewFactory: () => {
                const toolbar = document.createElement('div');
                toolbar.setAttribute('role', 'group');
                toolbar.setAttribute('aria-label', 'Formatação de texto');
                toolbar.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-1';
toolbar.dataset.spacing = 'xs';
                toolbar.appendChild(buildIconToggle({ icon: Bold, ariaLabel: 'Negrito', pressed: true }));
                toolbar.appendChild(buildIconToggle({ icon: Italic, ariaLabel: 'Itálico' }));
                toolbar.appendChild(buildIconToggle({ icon: Underline, ariaLabel: 'Sublinhado' }));
                return toolbar;
              },
            },
            {
              name: stripHtml(t('variants.compositions.filterWithLabel.name')),
              description: stripHtml(t('variants.compositions.filterWithLabel.description')),
              useWhen: stripHtml(t('variants.compositions.filterWithLabel.use')),
              code: `const wrap = document.createElement('span');
wrap.className = 'nds-cluster';
wrap.dataset.spacing = 'xs';
wrap.style.display = 'inline-flex';
wrap.appendChild(buildLucideSvg(Eye)); // aria-hidden
const text = document.createElement('span');
text.textContent = 'Mostrar ocultos';
wrap.appendChild(text);

const toggle = createToggle({ variant: 'outline', children: wrap });`,
              previewFactory: () => buildLabelToggle({
                icon: Eye,
                labelText: 'Mostrar ocultos',
                variant: 'outline',
              }),
            },
            {
              name: stripHtml(t('variants.compositions.sizes.name')),
              description: stripHtml(t('variants.compositions.sizes.description')),
              useWhen: stripHtml(t('variants.compositions.sizes.use')),
              code: `const row = document.createElement('div');
row.className = 'nds-cluster';
row.dataset.spacing = 'sm';

const sm = createToggle({ variant: 'outline', size: 'sm', children: wrapIcon(Bold) });
sm.setAttribute('aria-label', 'Negrito (sm)');
row.appendChild(sm);

const md = createToggle({ variant: 'outline', size: 'default', children: wrapIcon(Bold) });
md.setAttribute('aria-label', 'Negrito (default)');
row.appendChild(md);

const lg = createToggle({ variant: 'outline', size: 'lg', children: wrapIcon(Bold) });
lg.setAttribute('aria-label', 'Negrito (lg)');
row.appendChild(lg);`,
              previewFactory: () => {
                const row = document.createElement('div');
                row.className = 'nds-cluster';
row.dataset.spacing = 'sm';
                row.appendChild(buildIconToggle({ icon: Bold, ariaLabel: 'Negrito (sm)', variant: 'outline', size: 'sm' }));
                row.appendChild(buildIconToggle({ icon: Bold, ariaLabel: 'Negrito (default)', variant: 'outline', size: 'default' }));
                row.appendChild(buildIconToggle({ icon: Bold, ariaLabel: 'Negrito (lg)', variant: 'outline', size: 'lg' }));
                return row;
              },
            },
            {
              name: stripHtml(t('variants.compositions.filterList.name')),
              description: stripHtml(t('variants.compositions.filterList.description')),
              useWhen: stripHtml(t('variants.compositions.filterList.use')),
              code: `const wrapper = document.createElement('div');
wrapper.className = 'nds-stack';
wrapper.dataset.spacing = 'xs';
wrapper.style.width = '18rem';

const title = document.createElement('p');
title.className = 'nds-text-body nds-font-semibold nds-mb-1';
title.textContent = 'Filtros de exibição';
wrapper.appendChild(title);

const row = document.createElement('div');
row.className = 'nds-cluster';
row.dataset.spacing = 'xs';
row.style.flexWrap = 'wrap';

// Toggle 1 — Mostrar ocultos (Eye)
const w1 = document.createElement('span');
w1.className = 'nds-cluster nds-inline-block';
w1.dataset.spacing = 'sm';
w1.appendChild(buildLucideSvg(Eye));
const t1 = document.createElement('span');
t1.textContent = 'Mostrar ocultos';
w1.appendChild(t1);
row.appendChild(createToggle({ pressed: false, variant: 'outline', children: w1 }));

// Toggle 2 — Visão compacta (List)
const w2 = document.createElement('span');
w2.className = 'nds-cluster nds-inline-block';
w2.dataset.spacing = 'sm';
w2.appendChild(buildLucideSvg(List));
const t2 = document.createElement('span');
t2.textContent = 'Visão compacta';
w2.appendChild(t2);
row.appendChild(createToggle({ pressed: true, variant: 'outline', children: w2 }));

wrapper.appendChild(row);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
wrapper.dataset.spacing = 'xs';
wrapper.style.width = '18rem';
                const title = document.createElement('p');
                title.className = 'nds-text-body nds-font-semibold nds-mb-1';
                title.textContent = 'Filtros de exibição';
                wrapper.appendChild(title);
                const row = document.createElement('div');
                row.className = 'nds-cluster';
row.dataset.spacing = 'xs';
row.style.flexWrap = 'wrap';
                row.appendChild(buildLabelToggle({ icon: Eye, labelText: 'Mostrar ocultos', variant: 'outline', pressed: false }));
                row.appendChild(buildLabelToggle({ icon: List, labelText: 'Visão compacta', variant: 'outline', pressed: true }));
                wrapper.appendChild(row);
                return wrapper;
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: 'Estado',
            trigger: 'Quando ocorre',
            behavior: 'Comportamento',
          },
          items: [
            { label: t('states.items.off'),      trigger: '—',                                behavior: stripHtml(t('states.descriptions.off'))      },
            { label: t('states.items.on'),       trigger: 'click ou Space/Enter',             behavior: stripHtml(t('states.descriptions.on'))       },
            { label: t('states.items.hover'),    trigger: 'pointer sobre o Toggle',           behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab para o Toggle',                behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: 'options.disabled === true',        behavior: stripHtml(t('states.descriptions.disabled')) },
            { label: t('states.items.invalid'),  trigger: 'aria-invalid="true" no Toggle',    behavior: stripHtml(t('states.descriptions.invalid')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createToggle(options)
export type ToggleVariant = 'default' | 'outline';
export type ToggleSize = 'default' | 'sm' | 'lg';

export type ToggleOptions = {
  pressed?: boolean;
  disabled?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  class?: string;
  onClick?: (pressed: boolean) => void;
  children?: HTMLElement | string;
};`;

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
              title: 'createToggle(options) — Nortear',
              cols: propsCols,
              items: [
                {
                  name: 'pressed',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.pressed.description')) +
                    ' Nota: no Nortear, `pressed` define apenas o estado inicial — o factory é não-controlado.',
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.disabled.description')),
                },
                {
                  name: 'onClick',
                  type: '(pressed: boolean) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description:
                    stripHtml(t('props.table.onPressedChange.description')) +
                    ' Nota: no Nortear o nome do callback é `onClick` (recebe o novo valor), enquanto React/Vue/Svelte usam `onPressedChange`.',
                },
                {
                  name: 'variant',
                  type: '"default" | "outline"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: stripHtml(t('props.table.variant.description')),
                },
                {
                  name: 'size',
                  type: '"default" | "sm" | "lg"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: stripHtml(t('props.table.size.description')),
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: 'Classes .nds-* adicionais no `<button>` raiz.',
                },
                {
                  name: 'children',
                  type: 'HTMLElement | string',
                  defaultValue: '—',
                  required: 'Não',
                  description: 'Conteúdo interno (ícone SVG com `aria-hidden="true"` e/ou texto). Em icon-only, defina `aria-label` no botão retornado.',
                },
                {
                  name: 'aria-label',
                  type: 'string (atributo HTML)',
                  defaultValue: '—',
                  required: 'Condicional',
                  description: 'OBRIGATÓRIO em toggles icon-only. Defina via `el.setAttribute("aria-label", ...)` no botão retornado pelo factory (não é prop do options).',
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom diverge das libs upstream nos seguintes pontos: (1) o callback de mudança chama-se `onClick` (não `onPressedChange`). (2) É não-controlado: `pressed` define apenas o valor inicial — o estado vive internamente. (3) Não há prop `defaultPressed` separada — use `pressed` como inicial. (4) `aria-label` não é prop do options; aplique via `setAttribute` no `<button>` retornado. (5) O factory já aplica `aria-pressed` e `data-state` automaticamente no click — não duplique a lógica externamente.',
        });
      }

      case 'tokens': {
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--muted',       value: stripHtml(t('tokens.table.muted.class')),       description: stripHtml(t('tokens.table.muted.part'))       },
            { token: '--foreground',  value: stripHtml(t('tokens.table.foreground.class')),  description: stripHtml(t('tokens.table.foreground.part'))  },
            { token: '--input',       value: stripHtml(t('tokens.table.input.class')),       description: stripHtml(t('tokens.table.input.part'))       },
            { token: '--ring',        value: stripHtml(t('tokens.table.ring.class')),        description: stripHtml(t('tokens.table.ring.part'))        },
            { token: '--destructive', value: stripHtml(t('tokens.table.destructive.class')), description: stripHtml(t('tokens.table.destructive.part')) },
            { token: '--radius-button', value: stripHtml(t('tokens.table.radius.class')),    description: stripHtml(t('tokens.table.radius.part'))      },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: stripHtml(t('accessibility.summary')),
          items: [
            t('accessibility.items.item1'),
            t('accessibility.items.item2'),
            t('accessibility.items.item3'),
            t('accessibility.items.item4'),
            t('accessibility.items.item5'),
            t('accessibility.items.item6'),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab')   },
            { key: 'Space', description: t('accessibility.keyboard.space') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.toggleGroup.name'), description: stripHtml(t('related.items.toggleGroup.description')), path: '?path=/docs/ui-togglegroup--docs' },
            { name: t('related.items.switch.name'),      description: stripHtml(t('related.items.switch.description')),      path: '?path=/docs/ui-switch--docs'      },
            { name: t('related.items.checkbox.name'),    description: stripHtml(t('related.items.checkbox.description')),    path: '?path=/docs/ui-checkbox--docs'    },
            { name: t('related.items.button.name'),      description: stripHtml(t('related.items.button.description')),      path: '?path=/docs/ui-button--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: sanitizeHtml(t('notes.item1')) },
            { title: '', content: sanitizeHtml(t('notes.item2')) },
            { title: '', content: sanitizeHtml(t('notes.item3')) },
            { title: '', content: sanitizeHtml(t('notes.item4')) },
            // Divergência idiomática Nortear
            { title: '', content: sanitizeHtml('<strong>Nortear</strong> — o factory custom expõe o callback como <code>onClick(pressed)</code> em vez de <code>onPressedChange</code>; é não-controlado (<code>pressed</code> é só estado inicial); <code>aria-label</code> não é prop do options — aplique via <code>setAttribute</code> no <code>&lt;button&gt;</code> retornado. O factory já gerencia <code>aria-pressed</code> e <code>data-state</code> automaticamente.') },
          ],
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
            { event: 'field_change',        trigger: t('analytics.table.field_change.trigger'), payload: t('analytics.table.field_change.payload') },
            { event: 'docs_page_view',      trigger: 'Carregamento da docs page',                payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: 'Seção visível no viewport',                payload: '{ section_id, component_name, locale }' },
          ],
        });

      case 'testes': {
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
              action: stripHtml(t(`testes.functional.item${i}.action`)),
              result: stripHtml(t(`testes.functional.item${i}.result`)),
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
              criterion: stripHtml(t(`testes.accessibility.item${i}`)),
              level: 'AA',
              how: '—',
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story: stripHtml(t(`testes.visual.item${i}.story`)),
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
        component_name: 'toggle',
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
