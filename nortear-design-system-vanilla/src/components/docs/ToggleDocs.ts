import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
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
    (toggleTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(toggleTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  'aria-label': string;
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
    'aria-label': opts['aria-label'],
  };
  if (opts.fieldName) {
    toggleOpts.onClick = (pressed) => {
      track('field_change', {
        component: 'toggle',
        field_name: opts.fieldName!,
        value: String(pressed),
        location: 'docs_demo',
      });
    };
  }
  return createToggle(toggleOpts);
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
        location: 'docs_demo',
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
            toolbar.appendChild(buildIconToggle({ icon: Bold, 'aria-label': stripHtml(t('demonstration.labels.bold')), pressed: true, fieldName: 'bold' }));
            toolbar.appendChild(buildIconToggle({ icon: Italic, 'aria-label': stripHtml(t('demonstration.labels.italic')), fieldName: 'italic' }));
            toolbar.appendChild(buildIconToggle({ icon: Underline, 'aria-label': stripHtml(t('demonstration.labels.underline')), fieldName: 'underline' }));
            toolbar.appendChild(buildIconToggle({ icon: List, 'aria-label': stripHtml(t('demonstration.labels.list')), fieldName: 'list' }));
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
          buildIconToggle({ icon: Bold, 'aria-label': stripHtml(t('demonstration.labels.bold')), pressed: true });
        const buildDontGeneric = () => {
          const btn = buildIconToggle({ icon: Bold, 'aria-label': 'Botão B', pressed: true });
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
          const a = buildIconToggle({ icon: AlignLeft, 'aria-label': 'Alinhar à esquerda', pressed: true });
          a.style.borderRadius = '0';
          a.style.border = '0';
          group.appendChild(a);
          return group;
        };
        const buildDontLoose = () => {
          const wrap = document.createElement('div');
          wrap.className = 'nds-cluster';
          wrap.dataset.spacing = 'sm';
          wrap.appendChild(buildIconToggle({ icon: Bold, 'aria-label': 'Negrito' }));
          wrap.appendChild(buildIconToggle({ icon: Italic, 'aria-label': 'Itálico' }));
          return wrap;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildDoDescriptive,
              dontPreviewFactory: buildDontGeneric,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
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
  'aria-label': 'Negrito',
  onClick: (pressed) => console.log('pressed:', pressed),
});`,
        });

      case 'variantes': {
        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'toggle',
          items: [
            {
              trackId: 'default',
              name: stripHtml(t('variants.items.default')),
              description: stripHtml(t('variants.styles.default')),
              code: `const t = createToggle({
  variant: 'default',
  children: iconBold,
  'aria-label': 'Negrito',
});`,
              previewFactory: () => buildIconToggle({
                icon: Bold,
                'aria-label': stripHtml(t('demonstration.labels.bold')),
                pressed: true,
                variant: 'default',
              }),
            },
            {
              trackId: 'outline',
              name: stripHtml(t('variants.items.outline')),
              description: stripHtml(t('variants.styles.outline')),
              code: `const t = createToggle({
  variant: 'outline',
  children: iconItalic,
  'aria-label': 'Itálico',
});`,
              previewFactory: () => buildIconToggle({
                icon: Italic,
                'aria-label': stripHtml(t('demonstration.labels.italic')),
                variant: 'outline',
              }),
            },
            {
              trackId: 'withLabel',
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
            {
              name: stripHtml(t('variants.items.sizes.name')),
              trackId: 'sizes',
              description: stripHtml(t('variants.items.sizes.description')),
              useWhen: stripHtml(t('variants.items.sizes.use')),
              code: `const row = document.createElement('div');
row.className = 'nds-cluster';
row.dataset.spacing = 'sm';

for (const size of ['sm', 'default', 'lg'] as const) {
  row.appendChild(createToggle({
    variant: 'outline',
    size,
    children: wrapIcon(Bold),
    'aria-label': \`Negrito (\${size})\`,
  }));
}`,
              previewFactory: () => {
                const row = document.createElement('div');
                row.className = 'nds-cluster';
row.dataset.spacing = 'sm';
                row.appendChild(buildIconToggle({ icon: Bold, 'aria-label': 'Negrito (sm)', variant: 'outline', size: 'sm' }));
                row.appendChild(buildIconToggle({ icon: Bold, 'aria-label': 'Negrito (default)', variant: 'outline', size: 'default' }));
                row.appendChild(buildIconToggle({ icon: Bold, 'aria-label': 'Negrito (lg)', variant: 'outline', size: 'lg' }));
                return row;
              },
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
              trackId: 'toolbar',
              name: stripHtml(t('variants.compositions.toolbar.name')),
              description: stripHtml(t('variants.compositions.toolbar.description')),
              useWhen: stripHtml(t('variants.compositions.toolbar.use')),
              code: `const toolbar = document.createElement('div');
toolbar.setAttribute('role', 'group');
toolbar.setAttribute('aria-label', 'Formatação de texto');
toolbar.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-1';
toolbar.dataset.spacing = 'xs';

toolbar.appendChild(createToggle({
  pressed: true,
  children: wrapIcon(Bold),
  'aria-label': 'Negrito',
}));
toolbar.appendChild(createToggle({
  children: wrapIcon(Italic),
  'aria-label': 'Itálico',
}));
toolbar.appendChild(createToggle({
  children: wrapIcon(Underline),
  'aria-label': 'Sublinhado',
}));`,
              previewFactory: () => {
                const toolbar = document.createElement('div');
                toolbar.setAttribute('role', 'group');
                toolbar.setAttribute('aria-label', 'Formatação de texto');
                toolbar.className = 'nds-cluster nds-rounded-md nds-border-default nds-p-1';
toolbar.dataset.spacing = 'xs';
                toolbar.appendChild(buildIconToggle({ icon: Bold, 'aria-label': 'Negrito', pressed: true }));
                toolbar.appendChild(buildIconToggle({ icon: Italic, 'aria-label': 'Itálico' }));
                toolbar.appendChild(buildIconToggle({ icon: Underline, 'aria-label': 'Sublinhado' }));
                return toolbar;
              },
            },
            {
              trackId: 'filterList',
              name: stripHtml(t('variants.compositions.filterList.name')),
              description: stripHtml(t('variants.compositions.filterList.description')),
              useWhen: stripHtml(t('variants.compositions.filterList.use')),
              code: `const wrapper = document.createElement('div');
wrapper.className = 'nds-stack';
wrapper.dataset.spacing = 'xs';
wrapper.classList.add('nds-w-2xs');

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
wrapper.classList.add('nds-w-2xs');
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
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.off.label'),      trigger: toPlainText(t('states.off.trigger')),      behavior: toPlainText(t('states.off.behavior')) },
            { label: t('states.on.label'),       trigger: toPlainText(t('states.on.trigger')),       behavior: toPlainText(t('states.on.behavior')) },
            { label: t('states.hover.label'),    trigger: toPlainText(t('states.hover.trigger')),    behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),    trigger: toPlainText(t('states.focus.trigger')),    behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.disabled.label'), trigger: toPlainText(t('states.disabled.trigger')), behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.invalid.label'),  trigger: toPlainText(t('states.invalid.trigger')),  behavior: toPlainText(t('states.invalid.behavior')) },
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
  /** Accessible name — REQUIRED for icon-only toggles. */
  'aria-label'?: string;
  onClick?: (pressed: boolean) => void;
  children?: ToggleChild | ToggleChild[];
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
                  description: toPlainText(t('props.table.pressed.description')) +
                    ' Nota: no Nortear, `pressed` define apenas o estado inicial — o factory é não-controlado.',
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: toPlainText(t('props.table.disabled.description')),
                },
                {
                  name: 'onClick',
                  type: '(pressed: boolean) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description:
                    toPlainText(t('props.table.onPressedChange.description')) +
                    ' Nota: no Nortear o nome do callback é `onClick` (recebe o novo valor), enquanto React/Vue/Svelte usam `onPressedChange`.',
                },
                {
                  name: 'variant',
                  type: '"default" | "outline"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: toPlainText(t('props.table.variant.description')),
                },
                {
                  name: 'size',
                  type: '"default" | "sm" | "lg"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: toPlainText(t('props.table.size.description')),
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
                  description: 'Conteúdo interno (ícone SVG com `aria-hidden="true"` e/ou texto). Em icon-only, o nome vem de `aria-label`.',
                },
                {
                  name: 'aria-label',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Condicional',
                  description: 'OBRIGATÓRIO em toggles icon-only — sem ele o leitor de tela anuncia "pressionado" sem dizer o quê. Dispensável quando há texto visível dentro do botão.',
                },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'O factory custom diverge das libs upstream nos seguintes pontos: (1) o callback de mudança chama-se `onClick` (não `onPressedChange`). (2) É não-controlado: `pressed` define apenas o valor inicial — o estado vive internamente. (3) Não há prop `defaultPressed` separada — use `pressed` como inicial. (4) O factory já aplica `aria-pressed` e `data-state` automaticamente no click — não duplique a lógica externamente.',
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
            ...[
              { token: '--accent',            k: 'accent'           },
              { token: '--accent-foreground', k: 'accentForeground' },
              { token: '--muted',             k: 'muted'            },
              // A borda da variante outline é `--border`: o toggle acompanha o
              // botão de contorno, e `--input` ficou reservado à borda de
              // campo. A chave `input` é o nome da linha, não o do token.
              { token: '--border',            k: 'input'            },
              { token: '--ring',              k: 'ring'             },
              { token: '--destructive',       k: 'destructive'      },
              { token: '--radius-button',     k: 'radius'           },
            ].map(({ token, k }) => ({
              token,
              value: toPlainText(t(`tokens.table.${k}.class`)),
              description: toPlainText(t(`tokens.table.${k}.part`)),
            })),
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
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
            { name: t('related.items.toggleGroup.name'), description: stripHtml(t('related.items.toggleGroup.description')), path: '?path=/docs/components-form-togglegroup--docs' },
            { name: t('related.items.switch.name'),      description: stripHtml(t('related.items.switch.description')),      path: '?path=/docs/components-form-switch--docs'      },
            { name: t('related.items.checkbox.name'),    description: stripHtml(t('related.items.checkbox.description')),    path: '?path=/docs/components-form-checkbox--docs'    },
            { name: t('related.items.button.name'),      description: stripHtml(t('related.items.button.description')),      path: '?path=/docs/components-form-button--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            // Divergência idiomática Nortear
            { title: '', content: DOMPurify.sanitize('<strong>Nortear</strong> — o factory custom expõe o callback como <code>onClick(pressed)</code> em vez de <code>onPressedChange</code> e é não-controlado (<code>pressed</code> é só estado inicial). O factory já gerencia <code>aria-pressed</code> e <code>data-state</code> automaticamente.') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: 'field_change',        trigger: toPlainText(t('analytics.table.field_change.trigger')), payload: t('analytics.table.field_change.payload') },
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
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
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
              criterion: toPlainText(t(`testes.accessibility.item${i}`)),
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
              story: toPlainText(t(`testes.visual.item${i}.story`)),
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
