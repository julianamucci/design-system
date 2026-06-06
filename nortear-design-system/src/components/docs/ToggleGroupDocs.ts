import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  LayoutGrid,
  List,
  Eye,
} from 'lucide';
import { createToggleGroup, type ToggleGroupItem } from '@/components/ui/toggle-group';
import uiTranslations from '@/i18n/ui.json';
import toggleGroupTranslations from '@shared/content/toggle-group/translations.json';

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
const { t, subscribe } = createTranslation(toggleGroupTranslations as Record<string, unknown>);

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

// ─── Lucide → SVG (vanilla) ───────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function buildLucideSvg(icon: unknown, className = ''): SVGSVGElement {
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

function injectIcons(group: HTMLElement, icons: unknown[]): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(icons[i]));
    btn.appendChild(wrap);
  });
}

function injectIconsAndText(group: HTMLElement, entries: Array<{ icon: unknown; text: string }>): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    const entry = entries[i];
    if (!entry) return;
    btn.textContent = '';
    const wrap = document.createElement('span');
    wrap.className = 'nds-cluster';
    wrap.dataset.spacing = 'sm';
    wrap.dataset.align = 'center';
    wrap.style.display = 'inline-flex';
    wrap.appendChild(buildLucideSvg(entry.icon));
    const t = document.createElement('span');
    t.textContent = entry.text;
    wrap.appendChild(t);
    btn.appendChild(wrap);
  });
}

function applyItemAriaLabels(group: HTMLElement, labels: string[]): void {
  group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
    if (labels[i]) btn.setAttribute('aria-label', labels[i]);
  });
}

// ─── Group builder (com aria-label + analytics + items icon-only) ─────────────

function buildToggleGroupDemo(opts: {
  type: 'single' | 'multiple';
  ariaLabel: string;
  items: Array<{ value: string; icon: unknown; ariaLabel: string; disabled?: boolean }>;
  defaultValue?: string | string[];
  variant?: 'default' | 'outline';
  fieldName: string;
  orientation?: 'horizontal' | 'vertical';
  location?: string;
}): HTMLElement {
  // Nortear: o factory createToggle usa `textContent` quando `children` é string.
  // Para renderizar SVG, passamos um placeholder e injetamos o SVG via DOM API após criar.
  const groupItems: ToggleGroupItem[] = opts.items.map((it) => ({
    value: it.value,
    children: '',
    disabled: it.disabled,
  }));

  const root = createToggleGroup({
    type: opts.type,
    variant: opts.variant ?? 'outline',
    items: groupItems,
    defaultValue: opts.defaultValue,
    onValueChange: (value) => {
      const flat = Array.isArray(value) ? value.join(',') : value;
      track('field_change', {
        component: 'toggle_group',
        field_name: opts.fieldName,
        value: flat,
        location: opts.location ?? 'docs-demo',
      });
    },
  });

  // aria-label obrigatório no grupo
  root.setAttribute('aria-label', opts.ariaLabel);

  // aria-orientation refletindo a orientation
  const orientation = opts.orientation ?? 'horizontal';
  root.setAttribute('aria-orientation', orientation);
  if (orientation === 'vertical') {
    // Nortear: factory não expõe orientation — aplicar utility classes manualmente
    root.classList.remove('flex-row');
    root.classList.add('nds-stack');
  }

  // Injeta SVG (seguro: createElementNS, sem innerHTML) + aria-label por item
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]');
  buttons.forEach((btn, idx) => {
    const meta = opts.items[idx];
    if (meta) {
      btn.textContent = ''; // limpa placeholder
      const wrap = document.createElement('span');
      wrap.style.display = 'inline-flex';
      wrap.appendChild(buildLucideSvg(meta.icon));
      btn.appendChild(wrap);
      btn.setAttribute('aria-label', meta.ariaLabel);
    }
  });

  return root;
}

// ─── createToggleGroupDocs ────────────────────────────────────────────────────

export function createToggleGroupDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'toggle-group',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/form' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'toggle-group',
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
      { id: 'variantes',    labelKey: 'nav.variants'     },
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
      installNote: 'npx shadcn@latest add toggle-group',
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
            wrap.dataset.spacing = 'lg';
            wrap.style.alignItems = 'flex-start';

            // 1) Single — alinhamento
            wrap.appendChild(buildToggleGroupDemo({
              type: 'single',
              ariaLabel: stripHtml(t('demonstration.labels.alignmentLabel')),
              fieldName: 'text_alignment',
              defaultValue: 'left',
              items: [
                { value: 'left',   icon: AlignLeft,   ariaLabel: stripHtml(t('demonstration.labels.left'))   },
                { value: 'center', icon: AlignCenter, ariaLabel: stripHtml(t('demonstration.labels.center')) },
                { value: 'right',  icon: AlignRight,  ariaLabel: stripHtml(t('demonstration.labels.right'))  },
              ],
            }));

            // 2) Multiple — formatação
            wrap.appendChild(buildToggleGroupDemo({
              type: 'multiple',
              ariaLabel: stripHtml(t('demonstration.labels.formattingLabel')),
              fieldName: 'text_formatting',
              defaultValue: ['bold'],
              items: [
                { value: 'bold',      icon: Bold,      ariaLabel: stripHtml(t('demonstration.labels.bold'))      },
                { value: 'italic',    icon: Italic,    ariaLabel: stripHtml(t('demonstration.labels.italic'))    },
                { value: 'underline', icon: Underline, ariaLabel: stripHtml(t('demonstration.labels.underline')) },
              ],
            }));

            // 3) Vertical — modo de visualização
            wrap.appendChild(buildToggleGroupDemo({
              type: 'single',
              orientation: 'vertical',
              ariaLabel: stripHtml(t('demonstration.labels.viewLabel')),
              fieldName: 'view_mode',
              defaultValue: 'grid',
              items: [
                { value: 'grid', icon: LayoutGrid, ariaLabel: stripHtml(t('demonstration.labels.grid')) },
                { value: 'list', icon: List,       ariaLabel: stripHtml(t('demonstration.labels.list')) },
              ],
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
            t('anatomy.item4'),
          ],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.guidelines.item${i}`)),
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
            items: ['groupLabel', 'itemLabel', 'order'].map(key => ({
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

      case 'do-dont': {
        const buildDoSingle = () => buildToggleGroupDemo({
          type: 'single',
          ariaLabel: stripHtml(t('demonstration.labels.alignmentLabel')),
          fieldName: 'text_alignment',
          defaultValue: 'left',
          items: [
            { value: 'left',   icon: AlignLeft,   ariaLabel: stripHtml(t('demonstration.labels.left'))   },
            { value: 'center', icon: AlignCenter, ariaLabel: stripHtml(t('demonstration.labels.center')) },
            { value: 'right',  icon: AlignRight,  ariaLabel: stripHtml(t('demonstration.labels.right'))  },
          ],
        });

        const buildDontLooseToggles = () => {
          // Anti-pattern: 3 Toggles soltos sem aria-label no grupo,
          // simulando o cenário ruim de não usar ToggleGroup.
          const wrap = document.createElement('div');
          wrap.className = 'nds-cluster';
          wrap.dataset.spacing = 'sm';
          wrap.dataset.align = 'center';
          ['B', 'I', 'U'].forEach((label) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.className = 'nds-cluster nds-rounded-md nds-text-body nds-font-medium nds-border-default nds-bg-transparent';
            btn.dataset.align = 'center';
            btn.dataset.justify = 'center';
            btn.style.display = 'inline-flex';
            btn.style.width = '2.25rem';
            btn.style.height = '2.25rem';
            wrap.appendChild(btn);
          });
          return wrap;
        };

        const buildDoNamed = () => buildToggleGroupDemo({
          type: 'multiple',
          ariaLabel: stripHtml(t('demonstration.labels.formattingLabel')),
          fieldName: 'text_formatting',
          defaultValue: ['bold'],
          items: [
            { value: 'bold',      icon: Bold,      ariaLabel: stripHtml(t('demonstration.labels.bold'))      },
            { value: 'italic',    icon: Italic,    ariaLabel: stripHtml(t('demonstration.labels.italic'))    },
            { value: 'underline', icon: Underline, ariaLabel: stripHtml(t('demonstration.labels.underline')) },
          ],
        });

        const buildDontNoAriaLabel = () => {
          // Grupo SEM aria-label e items icon-only sem aria-label — anti-pattern
          const items: ToggleGroupItem[] = [
            { value: 'bold',      children: '' },
            { value: 'italic',    children: '' },
            { value: 'underline', children: '' },
          ];
          const g = createToggleGroup({ type: 'multiple', variant: 'outline', items });
          const icons = [Bold, Italic, Underline];
          g.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]').forEach((btn, i) => {
            btn.textContent = '';
            const wrap = document.createElement('span');
            wrap.style.display = 'inline-flex';
            wrap.appendChild(buildLucideSvg(icons[i]));
            btn.appendChild(wrap);
          });
          return g;
        };

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: buildDoSingle,
              dontPreviewFactory: buildDontLooseToggles,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: buildDoNamed,
              dontPreviewFactory: buildDontNoAriaLabel,
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: 'Importação do factory custom (Nortear):',
          code: `import { createToggleGroup, type ToggleGroupItem } from '@/components/ui/toggle-group';`,
          secondaryDescription: 'Uso básico (icon-only — aria-label OBRIGATÓRIO no grupo e em cada item):',
          secondaryCode: `const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  defaultValue: 'left',
  items: [
    { value: 'left',   children: '<svg ...>...</svg>' },
    { value: 'center', children: '<svg ...>...</svg>' },
    { value: 'right',  children: '<svg ...>...</svg>' },
  ],
  onValueChange: (value) => console.log('alignment:', value),
});

// ARIA: aplicar manualmente — factory não expõe aria-label como prop
group.setAttribute('aria-label', 'Alinhamento do texto');
group.querySelectorAll('[data-slot="toggle"]').forEach((btn, i) => {
  btn.setAttribute('aria-label', ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita'][i]);
});`,
        });

      case 'variantes': {
        const DIVERGENCE = ' (Nortear: factory não expõe esta prop — aplicar manualmente via setAttribute/classList).';

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: stripHtml(t('variants.items.single')),
              description: stripHtml(t('variants.styles.single')),
              code: `const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  defaultValue: 'left',
  items: [
    { value: 'left',   children: svgLeft   },
    { value: 'center', children: svgCenter },
    { value: 'right',  children: svgRight  },
  ],
  onValueChange: (value) => console.log(value), // string
});
group.setAttribute('aria-label', 'Alinhamento do texto');`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'single',
                ariaLabel: stripHtml(t('demonstration.labels.alignmentLabel')),
                fieldName: 'text_alignment',
                defaultValue: 'left',
                location: 'docs-variants',
                items: [
                  { value: 'left',   icon: AlignLeft,   ariaLabel: stripHtml(t('demonstration.labels.left'))   },
                  { value: 'center', icon: AlignCenter, ariaLabel: stripHtml(t('demonstration.labels.center')) },
                  { value: 'right',  icon: AlignRight,  ariaLabel: stripHtml(t('demonstration.labels.right'))  },
                ],
              }),
            },
            {
              name: stripHtml(t('variants.items.multiple')),
              description: stripHtml(t('variants.styles.multiple')),
              code: `const group = createToggleGroup({
  type: 'multiple',
  variant: 'outline',
  defaultValue: ['bold'],
  items: [
    { value: 'bold',      children: svgBold      },
    { value: 'italic',    children: svgItalic    },
    { value: 'underline', children: svgUnderline },
  ],
  onValueChange: (value) => console.log(value), // string[]
});
group.setAttribute('aria-label', 'Formatação');`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'multiple',
                ariaLabel: stripHtml(t('demonstration.labels.formattingLabel')),
                fieldName: 'text_formatting',
                defaultValue: ['bold'],
                location: 'docs-variants',
                items: [
                  { value: 'bold',      icon: Bold,      ariaLabel: stripHtml(t('demonstration.labels.bold'))      },
                  { value: 'italic',    icon: Italic,    ariaLabel: stripHtml(t('demonstration.labels.italic'))    },
                  { value: 'underline', icon: Underline, ariaLabel: stripHtml(t('demonstration.labels.underline')) },
                ],
              }),
            },
            {
              name: stripHtml(t('variants.items.vertical')),
              description: stripHtml(t('variants.styles.vertical')) + DIVERGENCE,
              code: `// Nortear: factory NÃO expõe orientation. Aplicar manualmente:
const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  defaultValue: 'grid',
  items: [
    { value: 'grid', children: svgGrid },
    { value: 'list', children: svgList },
  ],
});
group.setAttribute('aria-label', 'Modo de visualização');
group.setAttribute('aria-orientation', 'vertical');
group.classList.remove('flex-row');
group.classList.add('nds-stack');`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'single',
                ariaLabel: stripHtml(t('demonstration.labels.viewLabel')),
                fieldName: 'view_mode',
                defaultValue: 'grid',
                orientation: 'vertical',
                location: 'docs-variants',
                items: [
                  { value: 'grid', icon: LayoutGrid, ariaLabel: stripHtml(t('demonstration.labels.grid')) },
                  { value: 'list', icon: List,       ariaLabel: stripHtml(t('demonstration.labels.list')) },
                ],
              }),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'toggle-group',
          items: [
            {
              name: t('variants.compositions.alignmentBar.name'),
              description: t('variants.compositions.alignmentBar.description'),
              useWhen: t('variants.compositions.alignmentBar.use'),
              code: `const items: ToggleGroupItem[] = [
  { value: 'left',   children: '' },
  { value: 'center', children: '' },
  { value: 'right',  children: '' },
];
const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  items,
  defaultValue: 'left',
});
injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
group.setAttribute('aria-label', 'Alinhamento do texto');
applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita']);`,
              previewFactory: () => {
                const items: ToggleGroupItem[] = [
                  { value: 'left',   children: '' },
                  { value: 'center', children: '' },
                  { value: 'right',  children: '' },
                ];
                const group = createToggleGroup({
                  type: 'single',
                  variant: 'outline',
                  items,
                  defaultValue: 'left',
                });
                injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
                group.setAttribute('aria-label', 'Alinhamento do texto');
                applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar', 'Alinhar à direita']);
                return group;
              },
            },
            {
              name: t('variants.compositions.formattingBar.name'),
              description: t('variants.compositions.formattingBar.description'),
              useWhen: t('variants.compositions.formattingBar.use'),
              code: `const items: ToggleGroupItem[] = [
  { value: 'bold',      children: '' },
  { value: 'italic',    children: '' },
  { value: 'underline', children: '' },
];
const group = createToggleGroup({
  type: 'multiple',
  variant: 'outline',
  items,
  defaultValue: ['bold'],
});
injectIcons(group, [Bold, Italic, Underline]);
group.setAttribute('aria-label', 'Formatação');
applyItemAriaLabels(group, ['Negrito', 'Itálico', 'Sublinhado']);`,
              previewFactory: () => {
                const items: ToggleGroupItem[] = [
                  { value: 'bold',      children: '' },
                  { value: 'italic',    children: '' },
                  { value: 'underline', children: '' },
                ];
                const group = createToggleGroup({
                  type: 'multiple',
                  variant: 'outline',
                  items,
                  defaultValue: ['bold'],
                });
                injectIcons(group, [Bold, Italic, Underline]);
                group.setAttribute('aria-label', 'Formatação');
                applyItemAriaLabels(group, ['Negrito', 'Itálico', 'Sublinhado']);
                return group;
              },
            },
            {
              name: t('variants.compositions.viewMode.name'),
              description: t('variants.compositions.viewMode.description'),
              useWhen: t('variants.compositions.viewMode.use'),
              code: `const items: ToggleGroupItem[] = [
  { value: 'grid', children: '' },
  { value: 'list', children: '' },
];
const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  items,
  defaultValue: 'grid',
});
injectIconsAndText(group, [
  { icon: LayoutGrid, text: 'Grade' },
  { icon: List,       text: 'Lista' },
]);
group.setAttribute('aria-label', 'Modo de visualização');
group.setAttribute('aria-orientation', 'vertical');
// Divergência Nortear: factory não expõe orientation
group.classList.remove('flex-row');
group.classList.add('nds-stack');`,
              previewFactory: () => {
                const items: ToggleGroupItem[] = [
                  { value: 'grid', children: '' },
                  { value: 'list', children: '' },
                ];
                const group = createToggleGroup({
                  type: 'single',
                  variant: 'outline',
                  items,
                  defaultValue: 'grid',
                });
                injectIconsAndText(group, [
                  { icon: LayoutGrid, text: 'Grade' },
                  { icon: List,       text: 'Lista' },
                ]);
                group.setAttribute('aria-label', 'Modo de visualização');
                group.setAttribute('aria-orientation', 'vertical');
                group.classList.remove('flex-row');
                group.classList.add('nds-stack');
                return group;
              },
            },
            {
              name: t('variants.compositions.disabledItem.name'),
              description: t('variants.compositions.disabledItem.description'),
              useWhen: t('variants.compositions.disabledItem.use'),
              code: `const items: ToggleGroupItem[] = [
  { value: 'left',   children: '' },
  { value: 'center', children: '', disabled: true },
  { value: 'right',  children: '' },
];
const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  items,
  defaultValue: 'left',
});
injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
group.setAttribute('aria-label', 'Alinhamento do texto');
applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar (indisponível)', 'Alinhar à direita']);`,
              previewFactory: () => {
                const items: ToggleGroupItem[] = [
                  { value: 'left',   children: '' },
                  { value: 'center', children: '', disabled: true },
                  { value: 'right',  children: '' },
                ];
                const group = createToggleGroup({
                  type: 'single',
                  variant: 'outline',
                  items,
                  defaultValue: 'left',
                });
                injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
                group.setAttribute('aria-label', 'Alinhamento do texto');
                applyItemAriaLabels(group, ['Alinhar à esquerda', 'Centralizar (indisponível)', 'Alinhar à direita']);
                return group;
              },
            },
            {
              name: t('variants.compositions.filterWithText.name'),
              description: t('variants.compositions.filterWithText.description'),
              useWhen: t('variants.compositions.filterWithText.use'),
              code: `const wrapper = document.createElement('div');
wrapper.className = 'nds-stack';
wrapper.dataset.spacing = 'sm';
wrapper.style.width = '18rem';

const title = document.createElement('p');
title.className = 'nds-text-body nds-font-semibold nds-mb-1';
title.textContent = 'Filtros de exibição';
wrapper.appendChild(title);

const items: ToggleGroupItem[] = [
  { value: 'hidden',  children: '' },
  { value: 'compact', children: '' },
];
const group = createToggleGroup({
  type: 'multiple',
  variant: 'outline',
  items,
  defaultValue: ['compact'],
});
injectIconsAndText(group, [
  { icon: Eye,  text: 'Ocultos'  },
  { icon: List, text: 'Compacto' },
]);
group.setAttribute('aria-label', 'Filtros de exibição');
wrapper.appendChild(group);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'sm';
                wrapper.style.width = '18rem';

                const title = document.createElement('p');
                title.className = 'nds-text-body nds-font-semibold nds-mb-1';
                title.textContent = 'Filtros de exibição';
                wrapper.appendChild(title);

                const items: ToggleGroupItem[] = [
                  { value: 'hidden',  children: '' },
                  { value: 'compact', children: '' },
                ];
                const group = createToggleGroup({
                  type: 'multiple',
                  variant: 'outline',
                  items,
                  defaultValue: ['compact'],
                });
                injectIconsAndText(group, [
                  { icon: Eye,  text: 'Ocultos'  },
                  { icon: List, text: 'Compacto' },
                ]);
                group.setAttribute('aria-label', 'Filtros de exibição');
                wrapper.appendChild(group);
                return wrapper;
              },
            },
          ],
        });

      case 'estados': {
        const locale = getLocale();
        const stateCols = locale === 'en'
          ? { state: 'State', trigger: 'Trigger', behavior: 'Behavior' }
          : locale === 'es'
            ? { state: 'Estado', trigger: 'Trigger', behavior: 'Comportamiento' }
            : { state: 'Estado', trigger: 'Trigger', behavior: 'Comportamento' };
        return createDocsStates({
          title: t('states.title'),
          cols: stateCols,
          items: [
            { label: t('states.items.default'),  trigger: '—',                              behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.selected'), trigger: 'click ou Space/Enter',           behavior: stripHtml(t('states.descriptions.selected')) },
            { label: t('states.items.hover'),    trigger: 'pointer sobre item inativo',     behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab (roving tabindex)',          behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: 'item.disabled === true',         behavior: stripHtml(t('states.descriptions.disabled')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createToggleGroup(options) — Nortear factory custom
export type ToggleGroupItem = {
  value: string;
  label?: string;
  children?: string;     // SVG ou texto (string literal — sem interpolação dinâmica)
  disabled?: boolean;
};

export type ToggleGroupOptions = {
  type?: 'single' | 'multiple';   // default 'single'
  variant?: 'default' | 'outline'; // default 'default'
  items: ToggleGroupItem[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  class?: string;
};

export function createToggleGroup(options: ToggleGroupOptions): HTMLElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const DIVERGENCE = ' (Nortear: NÃO suportado pela factory custom — aplicar manualmente).';

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createToggleGroup(options) — Nortear',
              cols: propsCols,
              items: [
                {
                  name: 'type',
                  type: '"single" | "multiple"',
                  defaultValue: '"single"',
                  required: 'Não',
                  description: stripHtml(t('props.table.type_prop.description')),
                },
                {
                  name: 'items',
                  type: 'ToggleGroupItem[]',
                  defaultValue: '—',
                  required: 'Sim',
                  description: 'Lista de itens do grupo (value único, children como SVG string ou texto, disabled opcional).',
                },
                {
                  name: 'defaultValue',
                  type: 'string | string[]',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.defaultValue.description')) + ' Nortear: factory é não-controlado — não há prop `value`.',
                },
                {
                  name: 'onValueChange',
                  type: '(value: string | string[]) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.onValueChange.description')),
                },
                {
                  name: 'variant',
                  type: '"default" | "outline"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: stripHtml(t('props.table.variant.description')) + ' Aplicado uniformemente a todos os items (não há Context por item).',
                },
                {
                  name: 'class',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Não',
                  description: 'Classes .nds-* adicionais no elemento raiz.',
                },
                {
                  name: 'value',
                  type: 'string | string[]',
                  defaultValue: '—',
                  required: 'Não',
                  description: stripHtml(t('props.table.value.description')) + DIVERGENCE,
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: stripHtml(t('props.table.disabled.description')) + DIVERGENCE + ' Use `item.disabled` por item.',
                },
                {
                  name: 'orientation',
                  type: '"horizontal" | "vertical"',
                  defaultValue: '"horizontal"',
                  required: 'Não',
                  description: stripHtml(t('props.table.orientation.description')) + DIVERGENCE,
                },
                {
                  name: 'size',
                  type: '"default" | "sm" | "lg"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: stripHtml(t('props.table.size.description')) + DIVERGENCE + ' Items usam tamanho padrão do Toggle.',
                },
                {
                  name: 'spacing',
                  type: 'number',
                  defaultValue: '0',
                  required: 'Não',
                  description: stripHtml(t('props.table.spacing.description')) + DIVERGENCE + ' Use `gap-*` via prop `class`.',
                },
                {
                  name: 'aria-label',
                  type: 'string (atributo HTML)',
                  defaultValue: '—',
                  required: 'Condicional',
                  description: 'OBRIGATÓRIO no grupo. Defina via `el.setAttribute("aria-label", ...)` no elemento retornado.',
                },
              ],
            },
            {
              title: 'ToggleGroupItem',
              cols: propsCols,
              items: [
                { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Identificador único do item dentro do grupo.' },
                { name: 'children', type: 'string',  defaultValue: '—',     required: 'Não', description: 'Conteúdo HTML interno (SVG do ícone com aria-hidden, ou texto). Apenas strings literais — nunca conteúdo dinâmico (XSS).' },
                { name: 'label',    type: 'string',  defaultValue: '—',     required: 'Não', description: 'Texto alternativo se `children` não for fornecido.' },
                { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: 'Desabilita interação neste item.' },
                { name: 'aria-label', type: 'string (atributo HTML)', defaultValue: '—', required: 'Condicional', description: 'OBRIGATÓRIO em items icon-only. Setar via `setAttribute` no botão após criar (factory não expõe).' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'A factory Nortear diverge das libs upstream nos seguintes pontos: (1) é não-controlada — não há prop `value`, apenas `defaultValue`. (2) Não expõe `orientation`, `size`, `spacing`, nem `disabled` no grupo — aplicar via `class`/`setAttribute` ou usar `item.disabled`. (3) `children` é uma string HTML literal — para evitar XSS, NUNCA interpolar dados dinâmicos; gere o SVG via `document.createElementNS` e use `svg.outerHTML`. (4) `aria-label` no grupo e em items icon-only NÃO é prop — aplicar via `setAttribute` no elemento retornado e nos botões `[data-slot="toggle"]`. (5) Não há roving tabindex automático — todos items recebem `tabindex=0` herdado do `<button>`; para roving real, ouvir teclas ArrowLeft/Right e mover foco manualmente.',
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
            { token: '--muted',         value: stripHtml(t('tokens.table.muted.class')),       description: stripHtml(t('tokens.table.muted.part'))       },
            { token: '--foreground',    value: stripHtml(t('tokens.table.foreground.class')),  description: stripHtml(t('tokens.table.foreground.part'))  },
            { token: '--input',         value: stripHtml(t('tokens.table.input.class')),       description: stripHtml(t('tokens.table.input.part'))       },
            { token: '--ring',          value: stripHtml(t('tokens.table.ring.class')),        description: stripHtml(t('tokens.table.ring.part'))        },
            { token: '--destructive',   value: stripHtml(t('tokens.table.destructive.class')), description: stripHtml(t('tokens.table.destructive.part')) },
            { token: '--radius-button', value: stripHtml(t('tokens.table.radius.class')),      description: stripHtml(t('tokens.table.radius.part'))      },
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
            { key: 'Tab',   description: t('accessibility.keyboard.tab')        },
            { key: '→',     description: t('accessibility.keyboard.arrowRight') },
            { key: '←',     description: t('accessibility.keyboard.arrowLeft')  },
            { key: '↓',     description: t('accessibility.keyboard.arrowDown')  },
            { key: '↑',     description: t('accessibility.keyboard.arrowUp')    },
            { key: 'Home',  description: t('accessibility.keyboard.home')       },
            { key: 'End',   description: t('accessibility.keyboard.end')        },
            { key: 'Space', description: t('accessibility.keyboard.space')      },
            { key: 'Enter', description: t('accessibility.keyboard.enter')      },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.toggle.name'),     description: stripHtml(t('related.items.toggle.description')),     path: '?path=/docs/ui-toggle--docs'     },
            { name: t('related.items.tabs.name'),       description: stripHtml(t('related.items.tabs.description')),       path: '?path=/docs/ui-tabs--docs'       },
            { name: t('related.items.radioGroup.name'), description: stripHtml(t('related.items.radioGroup.description')), path: '?path=/docs/ui-radiogroup--docs' },
            { name: t('related.items.checkbox.name'),   description: stripHtml(t('related.items.checkbox.description')),   path: '?path=/docs/ui-checkbox--docs'   },
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
            // 3ª camada de divergência (notes + DocsProps + composicoes)
            { title: '', content: sanitizeHtml('<strong>Nortear</strong> — a factory custom <code>createToggleGroup</code> é <strong>não-controlada</strong> (sem prop <code>value</code>); não expõe <code>orientation</code>, <code>size</code>, <code>spacing</code> nem <code>disabled</code> no grupo — aplicar via <code>setAttribute</code>/<code>classList</code>/<code>item.disabled</code>. <code>aria-label</code> no grupo e em items icon-only é OBRIGATÓRIO e deve ser aplicado manualmente via <code>setAttribute</code>. <code>children</code> é string HTML literal — gere o SVG via <code>createElementNS</code> e use <code>outerHTML</code>, NUNCA interpole dados dinâmicos.') },
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
            { event: 'field_change',         trigger: t('analytics.table.field_change.trigger'), payload: t('analytics.table.field_change.payload') },
            { event: 'docs_page_view',       trigger: 'Carregamento da docs page',                payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed',  trigger: 'Seção visível no viewport',                payload: '{ section_id, component_name, locale }' },
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
        component_name: 'toggle-group',
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
