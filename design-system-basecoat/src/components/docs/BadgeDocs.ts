import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { X, Star } from 'lucide';
import { createBadge, type BadgeVariant } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import badgeTranslations from '@shared/content/badge/translations.json';

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
const { t, subscribe } = createTranslation(badgeTranslations as Record<string, unknown>);

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

// ─── Icon helpers (Lucide as vanilla SVG) ─────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function createIcon(nodes: LucideIconNode[], className = 'size-3'): SVGSVGElement {
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

  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function buildStarIcon(): SVGSVGElement {
  return createIcon(Star as unknown as LucideIconNode[], 'size-3 mr-1');
}

function buildXIcon(): SVGSVGElement {
  return createIcon(X as unknown as LucideIconNode[], 'size-3 mr-1');
}

// ─── Badge builders ───────────────────────────────────────────────────────────

function buildLabelBadge(variant: BadgeVariant, label: string): HTMLElement {
  return createBadge({ variant, children: label });
}

function buildIconBadge(variant: BadgeVariant, icon: SVGSVGElement, label: string): HTMLElement {
  return createBadge({ variant, children: [icon, label] });
}

// ─── createBadgeDocs ──────────────────────────────────────────────────────────

export function createBadgeDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'badge',
    });
    track('docs_page_view', {
      component_name: 'badge',
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
  const root = pageLayout.root;
  const headerSlot = pageLayout.headerSlot;
  const main = pageLayout.main;

  function renderHeader() {
    const header = createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
      installNote: 'npx shadcn@latest add badge',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
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
            wrap.className = 'flex flex-wrap items-center gap-3';
            wrap.append(
              buildLabelBadge('default',     t('demonstration.labels.defaultLabel')),
              buildLabelBadge('secondary',   t('demonstration.labels.secondaryLabel')),
              buildLabelBadge('destructive', t('demonstration.labels.destructiveLabel')),
              buildLabelBadge('outline',     t('demonstration.labels.outlineLabel')),
              buildIconBadge('default',    buildStarIcon(),  t('demonstration.labels.statusLabel')),
              buildLabelBadge('destructive', t('demonstration.labels.countLabel')),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
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
            items: [1, 2, 3, 4].map(i => ({
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
            items: ['label', 'status', 'count', 'category'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
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
            ],
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
                wrap.className = 'flex items-center gap-2';
                wrap.append(
                  buildLabelBadge('default',   'Novo'),
                  buildLabelBadge('secondary', 'Beta'),
                  buildLabelBadge('outline',   'Rascunho'),
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                return buildLabelBadge(
                  'default',
                  'Este item acaba de ser adicionado à sua lista e precisa de revisão',
                );
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-center gap-2';
                wrap.append(
                  buildIconBadge('destructive', buildXIcon(), 'Expirado'),
                  buildLabelBadge('destructive', 'Urgente'),
                );
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'flex items-center gap-2';
                wrap.append(
                  buildLabelBadge('destructive', 'Promoção'),
                  buildLabelBadge('destructive', 'Novo'),
                );
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createBadge } from '@/components/ui/badge';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode: `import { createBadge } from '@/components/ui/badge';\nimport { Check } from 'lucide';\n// ícone SVG construído a partir dos nós e envolvido no children do Badge`,
        });

      case 'variantes': {
        const codeDefault = `const badge = createBadge({ variant: 'default', children: 'Novo' });`;
        const codeSecondary = `const badge = createBadge({ variant: 'secondary', children: 'Beta' });`;
        const codeDestructive = `const badge = createBadge({ variant: 'destructive', children: 'Urgente' });`;
        const codeOutline = `const badge = createBadge({ variant: 'outline', children: 'Rascunho' });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildLabelBadge('default', t('demonstration.labels.defaultLabel')),
            },
            {
              name: 'secondary',
              description: stripHtml(t('variants.items.secondary')),
              code: codeSecondary,
              previewFactory: () => buildLabelBadge('secondary', t('demonstration.labels.secondaryLabel')),
            },
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => buildLabelBadge('destructive', t('demonstration.labels.destructiveLabel')),
            },
            {
              name: 'outline',
              description: stripHtml(t('variants.items.outline')),
              code: codeOutline,
              previewFactory: () => buildLabelBadge('outline', t('demonstration.labels.outlineLabel')),
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.withIcon.label'),    trigger: stripHtml(t('states.withIcon.trigger')),    behavior: stripHtml(t('states.withIcon.behavior'))    },
            { label: t('states.countBadge.label'),  trigger: stripHtml(t('states.countBadge.trigger')),  behavior: stripHtml(t('states.countBadge.behavior'))  },
            { label: t('states.asLink.label'),      trigger: stripHtml(t('states.asLink.trigger')),      behavior: stripHtml(t('states.asLink.behavior'))      },
            { label: t('states.asTrigger.label'),   trigger: stripHtml(t('states.asTrigger.trigger')),   behavior: stripHtml(t('states.asTrigger.behavior'))   },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createBadge(options)
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeOptions {
  variant?: BadgeVariant;
  children?: string | HTMLElement | Array<string | HTMLElement>;
  className?: string;
}`;

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
              title: t('props.badgeTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: '"default" | "secondary" | "destructive" | "outline"', defaultValue: '"default"', required: 'Não', description: stripHtml(t('props.table.variant')) },
                { name: 'children',  type: 'string | HTMLElement | Array<string | HTMLElement>',  defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.children')) },
                { name: 'className', type: 'string',                                               defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* Em styles.css — tokens semânticos */
:root {
  --primary: 222 47% 11%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--primary',               value: 'bg-primary',               description: t('tokens.table.primary')               },
            { token: '--primary-foreground',    value: 'text-primary-foreground',  description: t('tokens.table.primaryForeground')    },
            { token: '--secondary',             value: 'bg-secondary',             description: t('tokens.table.secondary')             },
            { token: '--secondary-foreground',  value: 'text-secondary-foreground',description: t('tokens.table.secondaryForeground')  },
            { token: '--destructive',           value: 'bg-destructive',           description: t('tokens.table.destructive')           },
            { token: '--destructive-foreground',value: 'text-destructive-foreground', description: t('tokens.table.destructiveForeground') },
            { token: '--foreground',            value: 'text-foreground',          description: t('tokens.table.foreground')            },
            { token: '--ring',                  value: 'focus:ring-ring',          description: t('tokens.table.ring')                  },
            { token: '--background',            value: 'focus:ring-offset-2',      description: t('tokens.table.background')            },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.item1'),
            t('accessibility.item2'),
            t('accessibility.item3'),
            t('accessibility.item4'),
            t('accessibility.item5'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: '—',     description: stripHtml(t('keyboard.noFocus'))         },
            { key: 'Tab',   description: stripHtml(t('keyboard.wrappedInButton')) },
            { key: 'Enter', description: stripHtml(t('keyboard.wrappedInLink'))   },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Alert',  description: t('related.alert'),  path: '?path=/docs/ui-alert--docs'  },
            { name: 'Button', description: t('related.button'), path: '?path=/docs/ui-button--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
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
            { event: t('analytics.table.click'),         trigger: t('analytics.table.clickTrigger'),         payload: t('analytics.table.clickPayload')         },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload')      },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload')    },
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story: tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story: t(`testes.visual.item${i}.story`),
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

  let observer: IntersectionObserver | null = null;

  function attachObserver() {
    observer?.disconnect();
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          updateActiveNav(id);
          track('docs_section_viewed', { section_id: id, component_name: 'badge', locale: getLocale() });
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
