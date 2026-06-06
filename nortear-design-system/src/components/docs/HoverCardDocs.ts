import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createHoverCard } from '@/components/ui/hover-card';
import { createAvatar } from '@/components/ui/avatar';
import uiTranslations from '@/i18n/ui.json';
import hoverCardTranslations from '@shared/content/hover-card/translations.json';

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
const { t, subscribe } = createTranslation(hoverCardTranslations as Record<string, unknown>);

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

// ─── Demo builders ────────────────────────────────────────────────────────────

function buildProfilePreview(): HTMLElement {
  const trigger = document.createElement('a');
  trigger.href = '#joana';
  trigger.className = 'nds-text-primary nds-hover-underline';
  trigger.style.textUnderlineOffset = '4px';
  trigger.textContent = '@joana';

  const content = document.createElement('div');
  content.className = 'nds-cluster';
  content.dataset.spacing = 'sm';

  const avatar = createAvatar({ fallbackText: 'JS' });

  const info = document.createElement('div');
  info.className = 'nds-stack';
  const name = document.createElement('p');
  name.className = 'nds-font-medium nds-text-body';
  name.textContent = 'Joana Silva';
  const meta = document.createElement('p');
  meta.className = 'nds-text-caption nds-text-muted-foreground';
  meta.textContent = 'Designer · 142 seguidores';
  info.appendChild(name);
  info.appendChild(meta);

  content.appendChild(avatar);
  content.appendChild(info);

  return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
}

function buildLinkPreview(): HTMLElement {
  const trigger = document.createElement('a');
  trigger.href = '#link';
  trigger.className = 'nds-text-primary nds-hover-underline';
  trigger.style.textUnderlineOffset = '4px';
  trigger.textContent = 'design-system.dev';

  const content = document.createElement('div');
  content.className = 'nds-stack';
  content.dataset.spacing = 'sm';

  const meta = document.createElement('div');
  meta.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
  meta.dataset.spacing = 'sm';
  const favicon = document.createElement('span');
  favicon.className = 'nds-icon nds-rounded-sm nds-bg-muted';
  favicon.style.display = 'inline-flex';
  favicon.style.alignItems = 'center';
  favicon.style.justifyContent = 'center';
  favicon.textContent = 'D';
  const url = document.createElement('span');
  url.textContent = 'design-system.dev';
  meta.appendChild(favicon);
  meta.appendChild(url);

  const title = document.createElement('p');
  title.className = 'nds-font-medium';
  title.textContent = 'Guia de overlays acessíveis';

  content.appendChild(meta);
  content.appendChild(title);

  return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
}

function buildDefinitionPreview(): HTMLElement {
  const trigger = document.createElement('a');
  trigger.href = '#wcag';
  trigger.className = 'nds-text-primary nds-hover-underline';
  trigger.style.textUnderlineOffset = '4px';
  trigger.textContent = 'WCAG 2.1';

  const content = document.createElement('div');
  const title = document.createElement('p');
  title.className = 'nds-font-medium nds-text-body';
  title.textContent = 'WCAG 2.1';
  const desc = document.createElement('p');
  desc.className = 'nds-text-caption nds-text-muted-foreground';
  desc.textContent = 'Web Content Accessibility Guidelines: padrão internacional de acessibilidade.';
  content.appendChild(title);
  content.appendChild(desc);

  return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
}

function buildMetricPreview(): HTMLElement {
  const trigger = document.createElement('a');
  trigger.href = '#metric';
  trigger.className = 'nds-text-primary nds-hover-underline';
  trigger.style.textUnderlineOffset = '4px';
  trigger.textContent = '3,42%';

  const content = document.createElement('div');
  const label = document.createElement('p');
  label.className = 'nds-text-caption nds-text-muted-foreground';
  label.textContent = 'Conversão (últimos 30d)';
  const value = document.createElement('p');
  value.className = 'nds-text-h4 nds-font-semibold';
  value.textContent = '3,42%';
  const desc = document.createElement('p');
  desc.className = 'nds-text-caption nds-text-muted-foreground';
  desc.textContent = 'Cliques no CTA / usuários únicos.';
  content.appendChild(label);
  content.appendChild(value);
  content.appendChild(desc);

  return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
}

// ─── createHoverCardDocs ──────────────────────────────────────────────────────

export function createHoverCardDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'hover-card',
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
      component_name: 'hover-card',
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
      { id: 'importacao',   labelKey: 'nav.import'        },
      { id: 'variantes',    labelKey: 'nav.variants'      },
      { id: 'composicoes',  labelKey: 'nav.compositions'  },
      { id: 'estados',      labelKey: 'nav.states'        },
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
      installNote: 'npx shadcn@latest add hover-card',
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
            wrap.className = 'nds-grid nds-w-full';
            wrap.dataset.cols = '2';
            wrap.dataset.spacing = 'lg';
            wrap.dataset.min = '16rem';
            wrap.style.minHeight = '160px';

            const cells: Array<{ labelKey: string; build: () => HTMLElement }> = [
              { labelKey: 'demonstration.labels.userProfile',       build: buildProfilePreview    },
              { labelKey: 'demonstration.labels.linkPreview',       build: buildLinkPreview       },
              { labelKey: 'demonstration.labels.definitionTooltip', build: buildDefinitionPreview },
              { labelKey: 'demonstration.labels.metricExplainer',   build: buildMetricPreview     },
            ];

            for (const cell of cells) {
              const col = document.createElement('div');
              col.className = 'nds-stack';
              col.dataset.spacing = 'sm';
              col.style.contain = 'layout';
              col.style.position = 'relative';
              col.style.minHeight = '100px';

              const label = document.createElement('p');
              label.className = 'nds-text-caption nds-font-medium nds-text-muted-foreground';
              label.innerHTML = sanitizeHtml(t(cell.labelKey));

              col.appendChild(label);
              col.appendChild(cell.build());
              wrap.appendChild(col);
            }

            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
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
            items: ['trigger', 'content', 'delay'].map(key => ({
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
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-body nds-stack';
                wrap.dataset.spacing = 'xs';
                const link = document.createElement('div');
                link.className = 'nds-text-primary';
                link.style.textDecoration = 'underline';
                link.textContent = '@joana';
                const note = document.createElement('div');
                note.className = 'nds-text-caption nds-text-muted-foreground';
                note.textContent = '+ link para /users/joana';
                wrap.appendChild(link);
                wrap.appendChild(note);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-body';
                const link = document.createElement('div');
                link.className = 'nds-text-primary';
                link.style.textDecoration = 'underline';
                link.textContent = '@joana';
                const note = document.createElement('div');
                note.className = 'nds-text-caption nds-text-muted-foreground nds-italic';
                note.textContent = 'apenas hover (touch users perdem)';
                wrap.appendChild(link);
                wrap.appendChild(note);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'nds-text-body nds-font-mono';
                code.textContent = 'openDelay={500}';
                return code;
              },
              dontPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'nds-text-body nds-font-mono';
                code.textContent = 'openDelay={0}';
                return code;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createHoverCard } from '@/components/ui/hover-card';`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = document.createElement('a');
trigger.href = '/users/joana';
trigger.textContent = '@joana';

const content = document.createElement('div');
content.textContent = 'Joana Silva · Designer';

createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`;

        const codeWithDelay = `// Nortear factory: delays internos fixos (SHOW_DELAY=300ms, HIDE_DELAY=150ms).
// Para customizar, ajuste constantes no fonte de hover-card.ts ou
// implemente wrapper com setTimeout próprio antes de chamar createHoverCard.
const trigger = document.createElement('a');
trigger.textContent = '@joana';
const content = document.createElement('div');
content.textContent = 'Preview';
createHoverCard({ trigger, content });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildProfilePreview(),
            },
            {
              name: t('variants.items.withDelay'),
              description: stripHtml(t('variants.styles.withDelay')),
              code: codeWithDelay,
              previewFactory: () => {
                const note = document.createElement('div');
                note.className = 'nds-text-caption nds-font-mono nds-text-muted-foreground';
                note.textContent = 'SHOW_DELAY=300 / HIDE_DELAY=150 (factory)';
                return note;
              },
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'hover-card',
          items: [
            {
              name: stripHtml(t('variants.compositions.userProfile.name')),
              description: stripHtml(t('variants.compositions.userProfile.description')),
              useWhen: stripHtml(t('variants.compositions.userProfile.use')),
              code: `const trigger = document.createElement('a');
trigger.href = '/users/joana';
trigger.className = 'nds-text-primary underline-offset-4 hover:underline';
trigger.textContent = '@joana';

const content = document.createElement('div');
content.className = 'nds-cluster';
content.dataset.spacing = 'md';

const avatar = createAvatar({ fallbackText: 'JS' });
const info = document.createElement('div');
info.className = 'nds-stack';
const name = document.createElement('p');
name.className = 'nds-font-medium nds-text-body';
name.textContent = 'Joana Silva';
const meta = document.createElement('p');
meta.className = 'nds-text-caption nds-text-muted-foreground';
meta.textContent = 'Designer · 142 seguidores';
info.append(name, meta);
content.append(avatar, info);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildProfilePreview(),
            },
            {
              name: stripHtml(t('variants.compositions.linkPreview.name')),
              description: stripHtml(t('variants.compositions.linkPreview.description')),
              useWhen: stripHtml(t('variants.compositions.linkPreview.use')),
              code: `const trigger = document.createElement('a');
trigger.href = 'https://design-system.dev';
trigger.className = 'nds-text-primary underline-offset-4 hover:underline';
trigger.textContent = 'design-system.dev';

const content = document.createElement('div');
content.className = 'nds-stack';

const meta = document.createElement('div');
meta.className = 'nds-cluster nds-text-caption nds-text-muted-foreground';
const favicon = document.createElement('span');
favicon.className = 'nds-cluster nds-rounded nds-bg-muted';
favicon.dataset.justify = 'center';
favicon.textContent = 'D';
const url = document.createElement('span');
url.textContent = 'design-system.dev';
meta.append(favicon, url);

const title = document.createElement('p');
title.className = 'nds-font-medium';
title.textContent = 'Guia de overlays acessíveis';

content.append(meta, title);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => buildLinkPreview(),
            },
            {
              name: stripHtml(t('variants.compositions.definitionTooltip.name')),
              description: stripHtml(t('variants.compositions.definitionTooltip.description')),
              useWhen: stripHtml(t('variants.compositions.definitionTooltip.use')),
              code: `const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className = 'nds-text-primary nds-text-body nds-font-medium';
Object.assign(trigger.style, { background: 'transparent', border: '0', padding: '0', textDecoration: 'underline dotted', textUnderlineOffset: '4px', cursor: 'help' });
trigger.textContent = 'WCAG 2.1 AA';

const content = document.createElement('div');
const term = document.createElement('p');
term.className = 'nds-font-medium nds-text-body';
term.textContent = 'WCAG 2.1 AA';
const def = document.createElement('p');
def.className = 'nds-text-caption nds-text-muted-foreground';
def.textContent =
  'Web Content Accessibility Guidelines 2.1 — nível AA. Contraste mínimo 4.5:1 e operação por teclado.';
content.append(term, def);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => {
                const trigger = document.createElement('button');
                trigger.type = 'button';
                trigger.className =
                  'nds-text-primary nds-text-body nds-font-medium nds-cursor-pointer';
                Object.assign(trigger.style, { background: 'transparent', border: '0', padding: '0', textDecoration: 'underline dotted', textUnderlineOffset: '4px', cursor: 'help' });
                trigger.textContent = 'WCAG 2.1 AA';

                const content = document.createElement('div');
                const term = document.createElement('p');
                term.className = 'nds-font-medium nds-text-body';
                term.textContent = 'WCAG 2.1 AA';
                const def = document.createElement('p');
                def.className = 'nds-text-caption nds-text-muted-foreground';
                def.textContent =
                  'Web Content Accessibility Guidelines 2.1 — nível AA. Contraste mínimo 4.5:1 e operação por teclado.';
                content.append(term, def);

                return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
              },
            },
            {
              name: stripHtml(t('variants.compositions.metricExplainer.name')),
              description: stripHtml(t('variants.compositions.metricExplainer.description')),
              useWhen: stripHtml(t('variants.compositions.metricExplainer.use')),
              code: `const trigger = document.createElement('button');
trigger.type = 'button';
trigger.className = 'nds-text-primary nds-text-body nds-font-medium';
Object.assign(trigger.style, { background: 'transparent', border: '0', padding: '0', textDecoration: 'underline dotted', textUnderlineOffset: '4px', cursor: 'help' });
trigger.textContent = 'LCP 1.8s';

const content = document.createElement('div');
const head = document.createElement('div');
head.className = 'nds-cluster';
head.dataset.spacing = 'sm';
head.dataset.justify = 'between';
head.style.alignItems = 'baseline';
const metric = document.createElement('p');
metric.className = 'nds-text-body nds-font-medium';
metric.textContent = 'Largest Contentful Paint';
const value = document.createElement('span');
value.className = 'nds-text-caption nds-font-medium nds-text-success';
value.textContent = '1.8s';
head.append(metric, value);

const desc = document.createElement('p');
desc.className = 'nds-text-caption nds-text-muted-foreground';
desc.textContent =
  'Tempo até o maior elemento visível ser renderizado. Bom: <2.5s · Ruim: >4s.';
content.append(head, desc);

const el = createHoverCard({ trigger, content, side: 'bottom', align: 'start' });`,
              previewFactory: () => {
                const trigger = document.createElement('button');
                trigger.type = 'button';
                trigger.className =
                  'nds-text-primary nds-text-body nds-font-medium nds-cursor-pointer';
                Object.assign(trigger.style, { background: 'transparent', border: '0', padding: '0', textDecoration: 'underline dotted', textUnderlineOffset: '4px', cursor: 'help' });
                trigger.textContent = 'LCP 1.8s';

                const content = document.createElement('div');
                const head = document.createElement('div');
                head.className = 'nds-cluster';
                head.dataset.justify = 'between';
                head.dataset.align = 'baseline';
                head.dataset.spacing = 'sm';
                const metric = document.createElement('p');
                metric.className = 'nds-text-body nds-font-medium';
                metric.textContent = 'Largest Contentful Paint';
                const value = document.createElement('span');
                value.className = 'nds-text-caption nds-font-medium nds-text-success';
                value.textContent = '1.8s';
                head.append(metric, value);

                const desc = document.createElement('p');
                desc.className = 'nds-text-caption nds-text-muted-foreground';
                desc.textContent =
                  'Tempo até o maior elemento visível ser renderizado. Bom: <2.5s · Ruim: >4s.';
                content.append(head, desc);

                return createHoverCard({ trigger, content, side: 'bottom', align: 'start' });
              },
            },
          ],
        });

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
            { label: t('states.items.closed'),     trigger: 'estado inicial',           behavior: stripHtml(t('states.descriptions.closed'))     },
            { label: t('states.items.open'),       trigger: 'mouseenter no trigger',    behavior: stripHtml(t('states.descriptions.open'))       },
            { label: t('states.items.controlled'), trigger: 'onOpenChange callback',    behavior: stripHtml(t('states.descriptions.controlled')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createHoverCard(options)
export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';
export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardOptions = {
  trigger: HTMLElement;
  content: HTMLElement;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createHoverCard(options: HoverCardOptions): HTMLElement;`;

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
              title: 'createHoverCard(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                              defaultValue: '—',         required: 'Sim', description: 'Elemento que dispara o hover (link, botão, texto).' },
                { name: 'content',      type: 'HTMLElement',                              defaultValue: '—',         required: 'Sim', description: 'Conteúdo flutuante exibido após o delay.' },
                { name: 'side',         type: "'top' | 'bottom' | 'left' | 'right'",      defaultValue: "'bottom'",  required: 'Não', description: stripHtml(t('props.table.side.description')) },
                { name: 'align',        type: "'start' | 'center' | 'end'",               defaultValue: "'center'",  required: 'Não', description: stripHtml(t('props.table.align.description')) },
                { name: 'onOpenChange', type: '(open: boolean) => void',                  defaultValue: '—',         required: 'Não', description: stripHtml(t('props.table.onOpenChange.description')) },
                { name: 'class',        type: 'string',                                   defaultValue: '—',         required: 'Não', description: 'Classes adicionais aplicadas ao painel flutuante.' },
                { name: 'openDelay',    type: 'number',                                   defaultValue: '300',       required: 'Não', description: stripHtml(t('props.table.openDelay.description')) + ' NOTA: factory Nortear usa constante interna SHOW_DELAY (não-prop).' },
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
            { token: '--popover',            value: t('tokens.table.background.class'), description: t('tokens.table.background.part') },
            { token: '--popover-foreground', value: t('tokens.table.foreground.class'), description: t('tokens.table.foreground.part') },
            { token: '--border',             value: t('tokens.table.border.class'),     description: t('tokens.table.border.part')     },
            { token: '--shadow-md',          value: t('tokens.table.shadow.class'),     description: t('tokens.table.shadow.part')     },
            { token: '--radius',             value: t('tokens.table.rounded.class'),    description: t('tokens.table.rounded.part')    },
            { token: 'spacing',              value: t('tokens.table.padding.class'),    description: t('tokens.table.padding.part')    },
            { token: 'size',                 value: t('tokens.table.width.class'),      description: t('tokens.table.width.part')      },
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
            { key: 'Tab',       description: stripHtml(t('accessibility.keyboard.tab'))      },
            { key: 'Esc',       description: stripHtml(t('accessibility.keyboard.escape'))   },
            { key: 'Shift+Tab', description: stripHtml(t('accessibility.keyboard.shiftTab')) },
            { key: 'Enter',     description: stripHtml(t('accessibility.keyboard.enter'))    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.tooltip.name'),      description: t('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
            { name: t('related.items.popover.name'),      description: t('related.items.popover.description'),      path: '?path=/docs/ui-popover--docs'      },
            { name: t('related.items.dropdownMenu.name'), description: t('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
            { name: t('related.items.card.name'),         description: t('related.items.card.description'),         path: '?path=/docs/ui-card--docs'         },
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
              event: 'hover_card_open',
              trigger: 'onOpenChange(true)',
              payload: "{ component: 'hover-card', location, label }",
            },
            {
              event: 'hover_card_close',
              trigger: 'onOpenChange(false)',
              payload: "{ component: 'hover-card', location, label }",
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
        component_name: 'hover-card',
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
