import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTabs, type TabsItemDef } from '@/components/ui/tabs';
import { createBadge } from '@/components/ui/badge';
import uiTranslations from '@/i18n/ui.json';
import tabsTranslations from '@shared/content/tabs/translations.json';

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
const { t, subscribe } = createTranslation(tabsTranslations as Record<string, unknown>);

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

// Helper: build a plain-text content panel safely (textContent — no XSS)
function textPanel(text: string, extraClass = ''): HTMLElement {
  const div = document.createElement('div');
  div.className = ['nds-text-body nds-text-muted-foreground nds-p-2 nds-rounded-md nds-border-default nds-bg-card', extraClass].filter(Boolean).join(' ');
  div.textContent = text;
  return div;
}

// SVG icon builders for composicoes (User / Settings / Shield from lucide).
function svgIcon(builder: (svg: SVGSVGElement) => void): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon nds-shrink-0');
  builder(svg);
  return svg;
}
function appendChildNS(svg: SVGSVGElement, tag: string, attrs: Record<string, string>): void {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  svg.appendChild(el);
}
function iconUser(): SVGSVGElement {
  return svgIcon((svg) => {
    appendChildNS(svg, 'path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' });
    appendChildNS(svg, 'circle', { cx: '12', cy: '7', r: '4' });
  });
}
function iconSettings(): SVGSVGElement {
  return svgIcon((svg) => {
    appendChildNS(svg, 'path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' });
    appendChildNS(svg, 'circle', { cx: '12', cy: '12', r: '3' });
  });
}
function iconShield(): SVGSVGElement {
  return svgIcon((svg) => {
    appendChildNS(svg, 'path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' });
  });
}

function richPanel(title: string, description: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack';
  wrap.dataset.spacing = 'sm';
  const h = document.createElement('h3');
  h.className = 'nds-text-body nds-font-semibold';
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'nds-text-body nds-text-muted-foreground';
  p.textContent = description;
  wrap.append(h, p);
  return wrap;
}

function buildDemoTabs(): HTMLElement {
  // Factory custom Nortear NÃO suporta props `variant` nem `orientation` nem `activationMode`.
  // Documentamos em 3 camadas (notes, props divergence, composicoes).
  const items: TabsItemDef[] = [
    { value: 'overview',   label: t('demonstration.labels.overview'),   content: textPanel(t('demonstration.labels.overviewContent')) },
    { value: 'properties', label: t('demonstration.labels.properties'), content: textPanel(t('demonstration.labels.propertiesContent')) },
    { value: 'examples',   label: t('demonstration.labels.examples'),   content: textPanel(t('demonstration.labels.examplesContent')) },
  ];
  const root = createTabs({
    defaultValue: 'overview',
    items,
    class: 'nds-w-full',
    onValueChange: (value) => {
      const idx = items.findIndex((i) => i.value === value);
      track('tab_change', {
        component: 'tabs',
        label: items[idx]?.label ?? value,
        index: idx,
        total: items.length,
        location: 'docs_demonstration',
      });
    },
  });
  // ARIA: aria-label OBRIGATÓRIO no tablist (factory não exige; setamos aqui).
  const list = root.querySelector('[role="tablist"]');
  if (list) list.setAttribute('aria-label', t('demonstration.title'));
  return root;
}

// ─── createTabsDocs ───────────────────────────────────────────────────────────

export function createTabsDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'tabs',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', { component_name: 'tabs', locale, page_title: `${t('title')} · Design System` });
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
      installNote: 'npx shadcn@latest add tabs',
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
          demoFactory: buildDemoTabs,
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
            items: ['trigger', 'ariaLabel', 'order'].map(key => ({
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
                const r = createTabs({
                  defaultValue: 'overview',
                  class: 'nds-w-full nds-max-w-xs',
                  items: [
                    { value: 'overview',   label: 'Visão geral',  content: textPanel('Conteúdo.') },
                    { value: 'properties', label: 'Propriedades', content: textPanel('Conteúdo.') },
                  ],
                });
                r.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Seções');
                return r;
              },
              dontPreviewFactory: () => {
                const r = createTabs({
                  defaultValue: 'a',
                  class: 'nds-w-full nds-max-w-xs',
                  items: [
                    { value: 'a', label: 'Aba 1', content: textPanel('Conteúdo.') },
                    { value: 'b', label: 'Aba 2', content: textPanel('Conteúdo.') },
                  ],
                });
                // Intencionalmente SEM aria-label para ilustrar o erro.
                return r;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const r = createTabs({
                  defaultValue: 'profile',
                  class: 'nds-w-full nds-max-w-xs',
                  items: [
                    { value: 'profile',  label: 'Perfil',  content: textPanel('Conteúdo.') },
                    { value: 'account',  label: 'Conta',   content: textPanel('Conteúdo.') },
                    { value: 'security', label: 'Segurança', content: textPanel('Conteúdo.') },
                  ],
                });
                r.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Configurações');
                return r;
              },
              dontPreviewFactory: () => {
                const r = createTabs({
                  defaultValue: 'a',
                  class: 'nds-w-full nds-max-w-xs',
                  items: [
                    { value: 'a', label: 'Aba A', content: textPanel('Conteúdo.') },
                    { value: 'b', label: 'Aba B', content: textPanel('Conteúdo.') },
                    { value: 'c', label: 'Aba C', content: textPanel('Conteúdo.') },
                  ],
                });
                return r;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: stripHtml(t('description')),
          code: `import { createTabs, type TabsItemDef } from '@/components/ui/tabs';`,
        });

      case 'variantes': {
        const codeDefault =
`createTabs({
  defaultValue: 'overview',
  items: [
    { value: 'overview',   label: 'Visão geral',  content: panelEl },
    { value: 'properties', label: 'Propriedades', content: panelEl },
    { value: 'examples',   label: 'Exemplos',     content: panelEl },
  ],
});`;
        const codeLine =
`// Nortear: factory custom NÃO expõe variant="line".
// Para visual minimalista, aplicar classes utilitárias via .class
// e ajustar o TabsList depois.
const root = createTabs({ defaultValue: 'overview', items: [...] });
const list = root.querySelector('[role="tablist"]');
list?.classList.add('nds-border-b', 'nds-bg-transparent'); list?.style.borderRadius = '0';`;
        const codeVertical =
`// Nortear: factory custom NÃO expõe orientation="vertical".
// Para orientação vertical, envolver em flex e reaplicar o layout.
const root = createTabs({ defaultValue: 'overview', items: [...] });
root.classList.add('nds-cluster');
const list = root.querySelector('[role="tablist"]');
list?.classList.add('nds-stack'); list?.style.height = 'auto';
list?.setAttribute('aria-orientation', 'vertical');`;

        return createDocsVariants({
          title: t('variants.title'),
          componentSlug: 'tabs',
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => {
                const r = createTabs({
                  defaultValue: 'overview',
                  class: 'nds-w-full nds-max-w-md',
                  items: [
                    { value: 'overview',   label: t('demonstration.labels.overview'),   content: textPanel(t('demonstration.labels.overviewContent')) },
                    { value: 'properties', label: t('demonstration.labels.properties'), content: textPanel(t('demonstration.labels.propertiesContent')) },
                    { value: 'examples',   label: t('demonstration.labels.examples'),   content: textPanel(t('demonstration.labels.examplesContent')) },
                  ],
                });
                r.querySelector('[role="tablist"]')?.setAttribute('aria-label', t('demonstration.title'));
                return r;
              },
            },
            {
              name: t('variants.items.line'),
              description: stripHtml(t('variants.styles.line')) + ' — Nortear: aplicar via .class manualmente (factory não expõe variant).',
              code: codeLine,
              previewFactory: () => {
                const r = createTabs({
                  defaultValue: 'overview',
                  class: 'nds-w-full nds-max-w-md',
                  items: [
                    { value: 'overview',   label: t('demonstration.labels.overview'),   content: textPanel(t('demonstration.labels.overviewContent')) },
                    { value: 'properties', label: t('demonstration.labels.properties'), content: textPanel(t('demonstration.labels.propertiesContent')) },
                    { value: 'examples',   label: t('demonstration.labels.examples'),   content: textPanel(t('demonstration.labels.examplesContent')) },
                  ],
                });
                const list = r.querySelector('[role="tablist"]') as HTMLElement | null;
                if (list) {
                  list.classList.add('nds-border-b', 'nds-bg-transparent', 'nds-w-full'); list.style.borderRadius = '0'; list.style.justifyContent = 'flex-start';
                  list.setAttribute('aria-label', t('demonstration.title'));
                }
                return r;
              },
            },
            {
              name: t('variants.items.vertical'),
              description: stripHtml(t('variants.styles.vertical')) + ' — Nortear: aplicar via .class manualmente (factory não expõe orientation).',
              code: codeVertical,
              previewFactory: () => {
                const r = createTabs({
                  defaultValue: 'overview',
                  class: 'nds-w-full nds-max-w-md nds-cluster',
                  items: [
                    { value: 'overview',   label: t('demonstration.labels.overview'),   content: textPanel(t('demonstration.labels.overviewContent')) },
                    { value: 'properties', label: t('demonstration.labels.properties'), content: textPanel(t('demonstration.labels.propertiesContent')) },
                    { value: 'examples',   label: t('demonstration.labels.examples'),   content: textPanel(t('demonstration.labels.examplesContent')) },
                  ],
                });
                const list = r.querySelector('[role="tablist"]') as HTMLElement | null;
                if (list) {
                  list.classList.add('nds-stack', 'nds-shrink-0'); list.style.height = 'auto'; list.style.alignItems = 'stretch';
                  list.setAttribute('aria-label', t('demonstration.title'));
                  list.setAttribute('aria-orientation', 'vertical');
                }
                return r;
              },
            },
          ],
        });
      }

      case 'composicoes': {
        const codeIconTrigger =
`const items = [
  { value: 'profile',  label: 'Perfil',    content: panelEl },
  { value: 'account',  label: 'Conta',     content: panelEl },
  { value: 'security', label: 'Segurança', content: panelEl },
];
const root = createTabs({ defaultValue: 'profile', class: 'nds-w-full', items });
// Substitui textContent do trigger por icon + label
items.forEach((item) => {
  const trigger = root.querySelector(\`[role="tab"][data-value="\${item.value}"]\`);
  if (!trigger) return;
  trigger.textContent = '';
  const wrapper = document.createElement('span');
  wrapper.className = 'nds-cluster';
  wrapper.appendChild(iconFor(item.value));  // SVG aria-hidden="true"
  const label = document.createElement('span');
  label.textContent = item.label;
  wrapper.appendChild(label);
  trigger.appendChild(wrapper);
});
root.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Configurações');`;

        const codeBadgeTrigger =
`const items = [
  { value: 'inbox', label: 'Caixa de entrada', content: panelEl },
  { value: 'spam',  label: 'Spam',             content: panelEl },
  { value: 'trash', label: 'Lixeira',          content: panelEl },
];
const root = createTabs({ defaultValue: 'inbox', class: 'nds-w-full', items });
const badgeMap = {
  inbox: { text: '12', variant: 'default' as const },
  spam:  { text: '3',  variant: 'destructive' as const },
};
Object.entries(badgeMap).forEach(([value, cfg]) => {
  const trigger = root.querySelector(\`[role="tab"][data-value="\${value}"]\`);
  if (!trigger) return;
  const labelText = trigger.textContent ?? '';
  trigger.textContent = '';
  const wrapper = document.createElement('span');
  wrapper.className = 'nds-cluster';
  const labelEl = document.createElement('span');
  labelEl.textContent = labelText;
  wrapper.append(labelEl, createBadge({ text: cfg.text, variant: cfg.variant, className: 'text-[10px] h-4' }));
  trigger.appendChild(wrapper);
});
root.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Caixas de mensagem');`;

        const codeVertical =
`const root = createTabs({
  defaultValue: 'profile',
  class: 'nds-w-full nds-cluster',
  items: [
    { value: 'profile',  label: 'Perfil',    content: panelEl },
    { value: 'account',  label: 'Conta',     content: panelEl },
    { value: 'security', label: 'Segurança', content: panelEl },
  ],
});
const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
if (list) {
  list.classList.add('nds-stack', 'nds-shrink-0'); list.style.height = 'auto'; list.style.alignItems = 'stretch'; list.style.minWidth = '10rem';
  list.setAttribute('aria-orientation', 'vertical');
  list.setAttribute('aria-label', 'Configurações');
}`;

        const codeLineSubNav =
`const root = createTabs({
  defaultValue: 'all',
  class: 'nds-w-full',
  items: [
    { value: 'all',      label: 'Tudo',       content: panelEl },
    { value: 'active',   label: 'Ativos',     content: panelEl },
    { value: 'archived', label: 'Arquivados', content: panelEl },
  ],
});
const list = root.querySelector('[role="tablist"]') as HTMLElement | null;
if (list) {
  list.classList.add('nds-border-b', 'nds-bg-transparent', 'nds-w-full'); list.style.borderRadius = '0'; list.style.justifyContent = 'flex-start';
  list.setAttribute('aria-label', 'Filtros de listagem');
}`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'tabs',
          items: [
            {
              name: t('variants.compositions.iconTrigger.name'),
              description: t('variants.compositions.iconTrigger.description'),
              useWhen: t('variants.compositions.iconTrigger.use'),
              code: codeIconTrigger,
              previewFactory: () => {
                const items: TabsItemDef[] = [
                  { value: 'profile',  label: 'Perfil',    content: richPanel('Perfil',    'Edite suas informações públicas.') },
                  { value: 'account',  label: 'Conta',     content: richPanel('Conta',     'Email, idioma e preferências.') },
                  { value: 'security', label: 'Segurança', content: richPanel('Segurança', 'Senha e autenticação em dois fatores.') },
                ];
                const iconMap: Record<string, () => SVGSVGElement> = {
                  profile: iconUser,
                  account: iconSettings,
                  security: iconShield,
                };
                const r = createTabs({ defaultValue: 'profile', class: 'nds-w-full', items });
                items.forEach((item) => {
                  const trigger = r.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
                  if (!trigger) return;
                  trigger.textContent = '';
                  const wrapper = document.createElement('span');
                  wrapper.className = 'nds-cluster';
                  wrapper.dataset.spacing = 'sm';
                  wrapper.appendChild(iconMap[item.value]());
                  const label = document.createElement('span');
                  label.textContent = item.label;
                  wrapper.appendChild(label);
                  trigger.appendChild(wrapper);
                });
                r.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Configurações');
                return r;
              },
            },
            {
              name: t('variants.compositions.badgeTrigger.name'),
              description: t('variants.compositions.badgeTrigger.description'),
              useWhen: t('variants.compositions.badgeTrigger.use'),
              code: codeBadgeTrigger,
              previewFactory: () => {
                const items: TabsItemDef[] = [
                  { value: 'inbox', label: 'Caixa de entrada', content: richPanel('Caixa de entrada', '12 mensagens não lidas.') },
                  { value: 'spam',  label: 'Spam',             content: richPanel('Spam',             '3 mensagens marcadas como spam.') },
                  { value: 'trash', label: 'Lixeira',          content: richPanel('Lixeira',          'Itens excluídos nos últimos 30 dias.') },
                ];
                const badgeMap: Record<string, { text: string; variant: 'default' | 'destructive' }> = {
                  inbox: { text: '12', variant: 'default' },
                  spam:  { text: '3',  variant: 'destructive' },
                };
                const r = createTabs({ defaultValue: 'inbox', class: 'nds-w-full', items });
                items.forEach((item) => {
                  const cfg = badgeMap[item.value];
                  if (!cfg) return;
                  const trigger = r.querySelector<HTMLButtonElement>(`[role="tab"][data-value="${item.value}"]`);
                  if (!trigger) return;
                  trigger.textContent = '';
                  const wrapper = document.createElement('span');
                  wrapper.className = 'nds-cluster';
                  wrapper.dataset.spacing = 'sm';
                  const labelEl = document.createElement('span');
                  labelEl.textContent = item.label;
                  const badge = createBadge({ text: cfg.text, variant: cfg.variant });
                  Object.assign(badge.style, { fontSize: '10px', height: '1rem' });
                  wrapper.append(labelEl, badge);
                  trigger.appendChild(wrapper);
                });
                r.querySelector('[role="tablist"]')?.setAttribute('aria-label', 'Caixas de mensagem');
                return r;
              },
            },
            {
              name: t('variants.compositions.vertical.name'),
              description: t('variants.compositions.vertical.description'),
              useWhen: t('variants.compositions.vertical.use'),
              code: codeVertical,
              previewFactory: () => {
                const items: TabsItemDef[] = [
                  { value: 'profile',  label: 'Perfil',    content: richPanel('Perfil',    'Edite suas informações públicas.') },
                  { value: 'account',  label: 'Conta',     content: richPanel('Conta',     'Email, idioma e preferências.') },
                  { value: 'security', label: 'Segurança', content: richPanel('Segurança', 'Senha e autenticação em dois fatores.') },
                ];
                const r = createTabs({ defaultValue: 'profile', class: 'nds-w-full nds-cluster', items });
                const list = r.querySelector('[role="tablist"]') as HTMLElement | null;
                if (list) {
                  list.classList.add('nds-stack', 'nds-shrink-0'); list.style.height = 'auto'; list.style.alignItems = 'stretch'; list.style.minWidth = '10rem';
                  list.setAttribute('aria-orientation', 'vertical');
                  list.setAttribute('aria-label', 'Configurações');
                }
                return r;
              },
            },
            {
              name: t('variants.compositions.lineSubNav.name'),
              description: t('variants.compositions.lineSubNav.description'),
              useWhen: t('variants.compositions.lineSubNav.use'),
              code: codeLineSubNav,
              previewFactory: () => {
                const items: TabsItemDef[] = [
                  { value: 'all',      label: 'Tudo',       content: textPanel('Mostrando todos os itens.') },
                  { value: 'active',   label: 'Ativos',     content: textPanel('Mostrando apenas ativos.') },
                  { value: 'archived', label: 'Arquivados', content: textPanel('Mostrando apenas arquivados.') },
                ];
                const r = createTabs({ defaultValue: 'all', class: 'nds-w-full', items });
                const list = r.querySelector('[role="tablist"]') as HTMLElement | null;
                if (list) {
                  list.classList.add('nds-border-b', 'nds-bg-transparent', 'nds-w-full'); list.style.borderRadius = '0'; list.style.justifyContent = 'flex-start';
                  list.setAttribute('aria-label', 'Filtros de listagem');
                }
                return r;
              },
            },
          ],
        });
      }

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
            { label: t('states.items.default'),  trigger: '—',                        behavior: stripHtml(t('states.descriptions.default'))  },
            { label: t('states.items.active'),   trigger: 'Click / Arrow / Home/End', behavior: stripHtml(t('states.descriptions.active'))   },
            { label: t('states.items.hover'),    trigger: 'Mouse hover',              behavior: stripHtml(t('states.descriptions.hover'))    },
            { label: t('states.items.focus'),    trigger: 'Tab / Arrow',              behavior: stripHtml(t('states.descriptions.focus'))    },
            { label: t('states.items.disabled'), trigger: '—',                        behavior: stripHtml(t('states.descriptions.disabled')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode =
`export type TabsItemDef = {
  value: string;
  label: string;
  content: HTMLElement;
  disabled?: boolean;
};

export type TabsOptions = {
  defaultValue: string;
  items: TabsItemDef[];
  onValueChange?: (value: string) => void;
  class?: string;
};

export function createTabs(options: TabsOptions): HTMLElement;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const DIVERGENCE = ' (Nortear: não suportado pela factory custom — aplicar via .class manualmente)';

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createTabs(options)',
              cols: propsCols,
              items: [
                { name: 'defaultValue', type: 'string',                       defaultValue: '—',         required: 'Sim', description: stripHtml(t('props.table.defaultValue.description')) },
                { name: 'items',        type: 'TabsItemDef[]',                defaultValue: '—',         required: 'Sim', description: 'Lista de tabs (value, label, content e disabled opcional).' },
                { name: 'onValueChange', type: '(value: string) => void',     defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.onValueChange.description')) },
                { name: 'class',        type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.className.description')) },
                { name: 'value',        type: 'string',                       defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.value.description')) + DIVERGENCE },
                { name: 'orientation',  type: '"horizontal" | "vertical"',    defaultValue: '"horizontal"', required: 'Não', description: stripHtml(t('props.table.orientation.description')) + DIVERGENCE },
                { name: 'activationMode', type: '"automatic" | "manual"',     defaultValue: '"automatic"', required: 'Não', description: stripHtml(t('props.table.activationMode.description')) + ' Nortear: apenas "automatic" implementado.' },
                { name: 'variant',      type: '"default" | "line"',           defaultValue: '"default"', required: 'Não', description: stripHtml(t('props.table.variant.description')) + DIVERGENCE },
              ],
            },
            {
              title: 'TabsItemDef',
              cols: propsCols,
              items: [
                { name: 'value',    type: 'string',      defaultValue: '—',     required: 'Sim', description: 'Identificador único da tab (vincula trigger ao panel).' },
                { name: 'label',    type: 'string',      defaultValue: '—',     required: 'Sim', description: 'Texto curto exibido no TabsTrigger (máx. 2 palavras).' },
                { name: 'content',  type: 'HTMLElement', defaultValue: '—',     required: 'Sim', description: 'Elemento renderizado dentro do TabsContent associado.' },
                { name: 'disabled', type: 'boolean',     defaultValue: 'false', required: 'Não', description: 'Bloqueia interação com a tab e exclui da navegação por setas.' },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: 'Nortear usa factory custom. Para variantes "line" e "vertical", aplicar classes utilitárias no elemento [role="tablist"] após criar o componente — ver seção Variantes.',
        });
      }

      case 'tokens': {
        const customizationCode = t('tokens.customizationCode');
        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--muted',            value: t('tokens.table.muted.class'),            description: t('tokens.table.muted.part') },
            { token: '--muted-foreground', value: t('tokens.table.mutedForeground.class'),  description: t('tokens.table.mutedForeground.part') },
            { token: '--background',       value: t('tokens.table.background.class'),       description: t('tokens.table.background.part') },
            { token: '--foreground',       value: t('tokens.table.foreground.class'),       description: t('tokens.table.foreground.part') },
            { token: '--ring',             value: t('tokens.table.ring.class'),             description: t('tokens.table.ring.part') },
            { token: '--border',           value: t('tokens.table.border.class'),           description: t('tokens.table.border.part') },
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
            stripHtml(t('accessibility.items.item1')),
            stripHtml(t('accessibility.items.item2')),
            stripHtml(t('accessibility.items.item3')),
            stripHtml(t('accessibility.items.item4')),
            stripHtml(t('accessibility.items.item5')),
            stripHtml(t('accessibility.items.item6')),
          ],
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: '→',     description: t('accessibility.keyboard.arrowRight') },
            { key: '←',     description: t('accessibility.keyboard.arrowLeft') },
            { key: '↓',     description: t('accessibility.keyboard.arrowDown') },
            { key: '↑',     description: t('accessibility.keyboard.arrowUp') },
            { key: 'Home',  description: t('accessibility.keyboard.home') },
            { key: 'End',   description: t('accessibility.keyboard.end') },
            { key: 'Enter', description: stripHtml(t('accessibility.keyboard.enter')) },
            { key: 'Space', description: stripHtml(t('accessibility.keyboard.space')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.stepper.name'),     description: t('related.items.stepper.description'),     path: '?path=/docs/ui-stepper--docs' },
            { name: t('related.items.accordion.name'),   description: t('related.items.accordion.description'),   path: '?path=/docs/ui-accordion--docs' },
            { name: t('related.items.sidebar.name'),     description: t('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs' },
            { name: t('related.items.toggleGroup.name'), description: t('related.items.toggleGroup.description'), path: '?path=/docs/ui-togglegroup--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.item1') },
            { title: '', content: t('notes.item2') },
            { title: '', content: t('notes.item3') },
            { title: '', content: t('notes.item4') },
            // Divergência idiomática Nortear (3ª camada — ver também DocsProps e composicoes story)
            { title: '', content: 'Nortear: factory custom NÃO expõe props variant, orientation ou activationMode="manual". Para visual line/vertical, aplicar utility classes no elemento [role="tablist"] após criar (ver Variantes e tabs-composicoes.stories.ts).' },
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
            { event: 'tab_change',         trigger: t('analytics.table.tab_change.trigger'), payload: t('analytics.table.tab_change.payload') },
            { event: 'docs_page_view',     trigger: 'Render inicial da docs page',           payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: 'Seção entra no viewport',              payload: '{ section_id, component_name, locale }' },
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
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [
              { criterion: t('testes.accessibility.item1'), level: '2.1 AA', how: 'axe-core via Storybook' },
              { criterion: t('testes.accessibility.item2'), level: '1.4.3',  how: 'Manual / Chromatic' },
              { criterion: t('testes.accessibility.item3'), level: '2.4.7',  how: 'Visual' },
              { criterion: t('testes.accessibility.item4'), level: '4.1.2',  how: 'axe-core' },
              { criterion: t('testes.accessibility.item5'), level: '4.1.2',  how: 'axe-core' },
            ],
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

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'tabs',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ───────────────────────────────────────────────────────

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
