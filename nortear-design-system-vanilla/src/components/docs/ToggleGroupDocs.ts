import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (toggleGroupTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(toggleGroupTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Group builder (com aria-label + analytics + items icon-only) ─────────────

function buildToggleGroupDemo(opts: {
  type: 'single' | 'multiple';
  'aria-label': string;
  items: Array<{ value: string; icon: unknown; 'aria-label': string; disabled?: boolean }>;
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
    // O nome viaja COM o item. Antes ficava num segundo passo que casava rótulo
    // com posição no array, e um item inserido no meio renomeava os seguintes.
    'aria-label': it['aria-label'],
  }));

  const root = createToggleGroup({
    type: opts.type,
    variant: opts.variant ?? 'outline',
    items: groupItems,
    defaultValue: opts.defaultValue,
    orientation: opts.orientation ?? 'horizontal',
    // aria-label obrigatório no grupo
    'aria-label': opts['aria-label'],
    onValueChange: (value) => {
      const flat = Array.isArray(value) ? value.join(',') : value;
      track('field_change', {
        component: 'toggle_group',
        field_name: opts.fieldName,
        value: flat,
        location: opts.location ?? 'docs_demo',
      });
    },
  });

  // Injeta SVG (seguro: createElementNS, sem innerHTML)
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]');
  buttons.forEach((btn, idx) => {
    const meta = opts.items[idx];
    if (meta) {
      btn.textContent = ''; // limpa placeholder
      const wrap = document.createElement('span');
      wrap.style.display = 'inline-flex';
      wrap.appendChild(buildLucideSvg(meta.icon));
      btn.appendChild(wrap);
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
              'aria-label': stripHtml(t('demonstration.labels.alignmentLabel')),
              fieldName: 'text_alignment',
              defaultValue: 'left',
              items: [
                { value: 'left',   icon: AlignLeft,   'aria-label': stripHtml(t('demonstration.labels.left'))   },
                { value: 'center', icon: AlignCenter, 'aria-label': stripHtml(t('demonstration.labels.center')) },
                { value: 'right',  icon: AlignRight,  'aria-label': stripHtml(t('demonstration.labels.right'))  },
              ],
            }));

            // 2) Multiple — formatação
            wrap.appendChild(buildToggleGroupDemo({
              type: 'multiple',
              'aria-label': stripHtml(t('demonstration.labels.formattingLabel')),
              fieldName: 'text_formatting',
              defaultValue: ['bold'],
              items: [
                { value: 'bold',      icon: Bold,      'aria-label': stripHtml(t('demonstration.labels.bold'))      },
                { value: 'italic',    icon: Italic,    'aria-label': stripHtml(t('demonstration.labels.italic'))    },
                { value: 'underline', icon: Underline, 'aria-label': stripHtml(t('demonstration.labels.underline')) },
              ],
            }));

            // 3) Vertical — modo de visualização
            wrap.appendChild(buildToggleGroupDemo({
              type: 'single',
              orientation: 'vertical',
              'aria-label': stripHtml(t('demonstration.labels.viewLabel')),
              fieldName: 'view_mode',
              defaultValue: 'grid',
              items: [
                { value: 'grid', icon: LayoutGrid, 'aria-label': stripHtml(t('demonstration.labels.grid')) },
                { value: 'list', icon: List,       'aria-label': stripHtml(t('demonstration.labels.list')) },
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
          'aria-label': stripHtml(t('demonstration.labels.alignmentLabel')),
          fieldName: 'text_alignment',
          defaultValue: 'left',
          items: [
            { value: 'left',   icon: AlignLeft,   'aria-label': stripHtml(t('demonstration.labels.left'))   },
            { value: 'center', icon: AlignCenter, 'aria-label': stripHtml(t('demonstration.labels.center')) },
            { value: 'right',  icon: AlignRight,  'aria-label': stripHtml(t('demonstration.labels.right'))  },
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
          'aria-label': stripHtml(t('demonstration.labels.formattingLabel')),
          fieldName: 'text_formatting',
          defaultValue: ['bold'],
          items: [
            { value: 'bold',      icon: Bold,      'aria-label': stripHtml(t('demonstration.labels.bold'))      },
            { value: 'italic',    icon: Italic,    'aria-label': stripHtml(t('demonstration.labels.italic'))    },
            { value: 'underline', icon: Underline, 'aria-label': stripHtml(t('demonstration.labels.underline')) },
          ],
        });

        const buildDontNoAriaLabel = () => {
          // Grupo SEM aria-label — anti-pattern didático do par 2. Os items
          // mantêm aria-label invisível para não violar button-name no axe.
          const items: ToggleGroupItem[] = [
            { value: 'bold',      children: '', 'aria-label': stripHtml(t('demonstration.labels.bold'))      },
            { value: 'italic',    children: '', 'aria-label': stripHtml(t('demonstration.labels.italic'))    },
            { value: 'underline', children: '', 'aria-label': stripHtml(t('demonstration.labels.underline')) },
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: buildDoSingle,
              dontPreviewFactory: buildDontLooseToggles,
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
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
  'aria-label': 'Alinhamento do texto',
  items: [
    { value: 'left',   children: '<svg ...>...</svg>', 'aria-label': 'Alinhar à esquerda' },
    { value: 'center', children: '<svg ...>...</svg>', 'aria-label': 'Centralizar'        },
    { value: 'right',  children: '<svg ...>...</svg>', 'aria-label': 'Alinhar à direita'  },
  ],
  onValueChange: (value) => console.log('alignment:', value),
});`,
        });

      case 'variantes': {
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
  'aria-label': 'Alinhamento do texto',
  items: [
    { value: 'left',   children: svgLeft,   'aria-label': 'Alinhar à esquerda' },
    { value: 'center', children: svgCenter, 'aria-label': 'Centralizar'        },
    { value: 'right',  children: svgRight,  'aria-label': 'Alinhar à direita'  },
  ],
  onValueChange: (value) => console.log(value), // string
});`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'single',
                'aria-label': stripHtml(t('demonstration.labels.alignmentLabel')),
                fieldName: 'text_alignment',
                defaultValue: 'left',
                location: 'docs-variants',
                items: [
                  { value: 'left',   icon: AlignLeft,   'aria-label': stripHtml(t('demonstration.labels.left'))   },
                  { value: 'center', icon: AlignCenter, 'aria-label': stripHtml(t('demonstration.labels.center')) },
                  { value: 'right',  icon: AlignRight,  'aria-label': stripHtml(t('demonstration.labels.right'))  },
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
  'aria-label': 'Formatação',
  items: [
    { value: 'bold',      children: svgBold,      'aria-label': 'Negrito'    },
    { value: 'italic',    children: svgItalic,    'aria-label': 'Itálico'    },
    { value: 'underline', children: svgUnderline, 'aria-label': 'Sublinhado' },
  ],
  onValueChange: (value) => console.log(value), // string[]
});`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'multiple',
                'aria-label': stripHtml(t('demonstration.labels.formattingLabel')),
                fieldName: 'text_formatting',
                defaultValue: ['bold'],
                location: 'docs-variants',
                items: [
                  { value: 'bold',      icon: Bold,      'aria-label': stripHtml(t('demonstration.labels.bold'))      },
                  { value: 'italic',    icon: Italic,    'aria-label': stripHtml(t('demonstration.labels.italic'))    },
                  { value: 'underline', icon: Underline, 'aria-label': stripHtml(t('demonstration.labels.underline')) },
                ],
              }),
            },
            {
              name: stripHtml(t('variants.items.vertical')),
              description: stripHtml(t('variants.styles.vertical')),
              code: `const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  defaultValue: 'grid',
  orientation: 'vertical',
  'aria-label': 'Modo de visualização',
  items: [
    { value: 'grid', children: svgGrid, 'aria-label': 'Grade' },
    { value: 'list', children: svgList, 'aria-label': 'Lista' },
  ],
});`,
              previewFactory: () => buildToggleGroupDemo({
                type: 'single',
                'aria-label': stripHtml(t('demonstration.labels.viewLabel')),
                fieldName: 'view_mode',
                defaultValue: 'grid',
                orientation: 'vertical',
                location: 'docs-variants',
                items: [
                  { value: 'grid', icon: LayoutGrid, 'aria-label': stripHtml(t('demonstration.labels.grid')) },
                  { value: 'list', icon: List,       'aria-label': stripHtml(t('demonstration.labels.list')) },
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
  { value: 'left',   children: '', 'aria-label': 'Alinhar à esquerda' },
  { value: 'center', children: '', 'aria-label': 'Centralizar'        },
  { value: 'right',  children: '', 'aria-label': 'Alinhar à direita'  },
];
const group = createToggleGroup({
  type: 'single',
  variant: 'outline',
  items,
  defaultValue: 'left',
  'aria-label': 'Alinhamento do texto',
});
injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);`,
              previewFactory: () => {
                const items: ToggleGroupItem[] = [
                  { value: 'left',   children: '', 'aria-label': 'Alinhar à esquerda' },
                  { value: 'center', children: '', 'aria-label': 'Centralizar'        },
                  { value: 'right',  children: '', 'aria-label': 'Alinhar à direita'  },
                ];
                const group = createToggleGroup({
                  type: 'single',
                  variant: 'outline',
                  items,
                  defaultValue: 'left',
                  'aria-label': 'Alinhamento do texto',
                });
                injectIcons(group, [AlignLeft, AlignCenter, AlignRight]);
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
  orientation: 'vertical',
  'aria-label': 'Modo de visualização',
});
// Itens com texto visível dispensam aria-label próprio.
injectIconsAndText(group, [
  { icon: LayoutGrid, text: 'Grade' },
  { icon: List,       text: 'Lista' },
]);`,
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
                  orientation: 'vertical',
                  'aria-label': 'Modo de visualização',
                });
                injectIconsAndText(group, [
                  { icon: LayoutGrid, text: 'Grade' },
                  { icon: List,       text: 'Lista' },
                ]);
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
wrapper.classList.add('nds-w-2xs');

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
  'aria-label': 'Filtros de exibição',
});
injectIconsAndText(group, [
  { icon: Eye,  text: 'Ocultos'  },
  { icon: List, text: 'Compacto' },
]);
wrapper.appendChild(group);`,
              previewFactory: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'nds-stack';
                wrapper.dataset.spacing = 'sm';
                wrapper.classList.add('nds-w-2xs');

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
                  'aria-label': 'Filtros de exibição',
                });
                injectIconsAndText(group, [
                  { icon: Eye,  text: 'Ocultos'  },
                  { icon: List, text: 'Compacto' },
                ]);
                wrapper.appendChild(group);
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
            { label: t('states.default.label'),      trigger: toPlainText(t('states.default.trigger')),      behavior: toPlainText(t('states.default.behavior')) },
            { label: t('states.selected.label'),     trigger: toPlainText(t('states.selected.trigger')),     behavior: toPlainText(t('states.selected.behavior')) },
            { label: t('states.hover.label'),        trigger: toPlainText(t('states.hover.trigger')),        behavior: toPlainText(t('states.hover.behavior')) },
            { label: t('states.focus.label'),        trigger: toPlainText(t('states.focus.trigger')),        behavior: toPlainText(t('states.focus.behavior')) },
            { label: t('states.disabled.label'),     trigger: toPlainText(t('states.disabled.trigger')),     behavior: toPlainText(t('states.disabled.behavior')) },
            { label: t('states.disabledItem.label'), trigger: toPlainText(t('states.disabledItem.trigger')), behavior: toPlainText(t('states.disabledItem.behavior')) },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createToggleGroup(options) — Nortear factory custom
export type ToggleGroupItem = {
  value: string;
  label?: string;
  children?: string;     // SVG ou texto (string literal — sem interpolação dinâmica)
  disabled?: boolean;
  'aria-label'?: string; // OBRIGATÓRIO em item só de ícone
};

export type ToggleGroupOptions = {
  type?: 'single' | 'multiple';   // default 'single'
  variant?: 'default' | 'outline'; // default 'default'
  size?: 'default' | 'sm' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  disabled?: boolean;
  items: ToggleGroupItem[];
  defaultValue?: string | string[];
  'aria-label'?: string; // OBRIGATÓRIO — nome do role="toolbar"
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
                  description: toPlainText(t('props.table.type_prop.description')),
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
                  description: toPlainText(t('props.table.defaultValue.description')) + ' Nortear: factory é não-controlado — não há prop `value`.',
                },
                {
                  name: 'onValueChange',
                  type: '(value: string | string[]) => void',
                  defaultValue: '—',
                  required: 'Não',
                  description: toPlainText(t('props.table.onValueChange.description')),
                },
                {
                  name: 'variant',
                  type: '"default" | "outline"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: toPlainText(t('props.table.variant.description')) + ' Aplicado uniformemente a todos os items (não há Context por item).',
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
                  description: toPlainText(t('props.table.value.description')) + DIVERGENCE,
                },
                {
                  name: 'disabled',
                  type: 'boolean',
                  defaultValue: 'false',
                  required: 'Não',
                  description: toPlainText(t('props.table.disabled.description')) + ' Cada item herda; `item.disabled` trava só um.',
                },
                {
                  name: 'orientation',
                  type: '"horizontal" | "vertical"',
                  defaultValue: '"horizontal"',
                  required: 'Não',
                  description: toPlainText(t('props.table.orientation.description')),
                },
                {
                  name: 'size',
                  type: '"default" | "sm" | "lg"',
                  defaultValue: '"default"',
                  required: 'Não',
                  description: toPlainText(t('props.table.size.description')),
                },
                {
                  name: 'spacing',
                  type: 'number',
                  defaultValue: '0',
                  required: 'Não',
                  description: toPlainText(t('props.table.spacing.description')),
                },
                {
                  name: 'aria-label',
                  type: 'string',
                  defaultValue: '—',
                  required: 'Sim',
                  description: 'Nome acessível do grupo. Um `role="toolbar"` sem nome é anunciado apenas como "barra de ferramentas".',
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
                { name: 'aria-label', type: 'string', defaultValue: '—', required: 'Condicional', description: 'OBRIGATÓRIO em items só de ícone. Dispensável quando o item tem texto visível.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: 'Divergências da factory custom (Nortear)',
          extensibilityNotes:
            'A factory Nortear diverge das libs upstream nos seguintes pontos: (1) é não-controlada — não há prop `value`, apenas `defaultValue`. (2) `children` é uma string HTML literal — para evitar XSS, NUNCA interpolar dados dinâmicos; gere o SVG via `document.createElementNS` e use `svg.outerHTML`.',
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
            { token: '--muted',         value: toPlainText(t('tokens.table.muted.class')),       description: toPlainText(t('tokens.table.muted.part'))       },
            { token: '--accent',        value: toPlainText(t('tokens.table.accent.class')),      description: toPlainText(t('tokens.table.accent.part'))      },
            { token: '--input',         value: toPlainText(t('tokens.table.input.class')),       description: toPlainText(t('tokens.table.input.part'))       },
            { token: '--ring',          value: toPlainText(t('tokens.table.ring.class')),        description: toPlainText(t('tokens.table.ring.part'))        },
            { token: '--destructive',   value: toPlainText(t('tokens.table.destructive.class')), description: toPlainText(t('tokens.table.destructive.part')) },
            { token: '--radius-button', value: toPlainText(t('tokens.table.radius.class')),      description: toPlainText(t('tokens.table.radius.part'))      },
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
            { key: 'Tab',   description: t('accessibility.keyboard.tab')        },
            { key: 'Arrow Right',     description: t('accessibility.keyboard.arrowRight') },
            { key: 'Arrow Left',     description: t('accessibility.keyboard.arrowLeft')  },
            { key: 'Arrow Down',     description: t('accessibility.keyboard.arrowDown')  },
            { key: 'Arrow Up',     description: t('accessibility.keyboard.arrowUp')    },
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
            { title: '', content: DOMPurify.sanitize(t('notes.item1')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item2')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item3')) },
            { title: '', content: DOMPurify.sanitize(t('notes.item4')) },
            // 3ª camada de divergência (notes + DocsProps + composicoes)
            { title: '', content: DOMPurify.sanitize('<strong>Nortear</strong> — a factory custom <code>createToggleGroup</code> é <strong>não-controlada</strong> (sem prop <code>value</code>). O nome do grupo é a opção <code>aria-label</code>, e o de cada item só de ícone é o <code>aria-label</code> do próprio item — ambos OBRIGATÓRIOS. <code>children</code> é string HTML literal — gere o SVG via <code>createElementNS</code> e use <code>outerHTML</code>, NUNCA interpole dados dinâmicos.') },
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
            { event: 'field_change',         trigger: toPlainText(t('analytics.table.field_change.trigger')), payload: t('analytics.table.field_change.payload') },
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
