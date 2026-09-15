import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { Check, X, createElement, type IconNode } from 'lucide';
import { createBadge, createBadgeCounter, type BadgeVariant } from '@/components/ui/badge';
import { createButton } from '@/components/ui/button';
import {
  badgeLinkSnippet,
  badgeSnippet,
  badgeTriggerSnippet,
  badgeWithCounterSnippet,
} from '@/components/ui/badge.source';
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
const { t, subscribe } = createTranslation(badgeTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

type ContentNode = Record<string, unknown>;

/** O nó do conteúdo no idioma vigente, por caminho pontuado. */
function contentNode(path: string): ContentNode {
  const all = badgeTranslations as unknown as Record<string, ContentNode>;
  const byLocale = all[getLocale()] ?? all['pt-BR'];
  const node = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc as ContentNode | undefined)?.[key], byLocale);
  return (node ?? {}) as ContentNode;
}

/**
 * Os números dos `itemN` que o conteúdo declara naquele caminho, em ordem.
 *
 * A lista sai do DICIONÁRIO, e não de um `[1, 2, 3…]` escrito aqui: a lista
 * literal envelhece no primeiro item que o conteúdo ganha, e a página passa a
 * esconder o que o conteúdo publica sem nada ficar vermelho.
 */
function itemNumbers(path: string): number[] {
  return Object.keys(contentNode(path))
    .map((key) => /^item(\d+)$/.exec(key)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
}

// ─── Ícones e etiquetas ───────────────────────────────────────────────────────

/**
 * Ícone decorativo antes do texto, construído como o snippet ensina: sem classe
 * de tamanho nem margem — `.nds-badge > svg` dimensiona, o gap espaça e
 * `data-icon="inline-start"` encurta o respiro daquele lado.
 */
function buildIcon(node: IconNode): SVGElement {
  const icon = createElement(node);
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('data-icon', 'inline-start');
  return icon;
}

function buildLabelBadge(variant: BadgeVariant, label: string): HTMLElement {
  return createBadge({ variant, children: label });
}

function buildIconBadge(variant: BadgeVariant, icon: SVGElement, label: string): HTMLElement {
  return createBadge({ variant, children: [icon, label] });
}

const VARIANT_LABEL_KEY: Record<BadgeVariant, string> = {
  default: 'demonstration.labels.defaultLabel',
  destructive: 'demonstration.labels.destructiveLabel',
  warning: 'demonstration.labels.warningLabel',
  success: 'demonstration.labels.successLabel',
  info: 'demonstration.labels.infoLabel',
};

const VARIANTS: readonly BadgeVariant[] = ['default', 'destructive', 'warning', 'success', 'info'];

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

  // ── Sections (rebuilt on locale change) ───────────────────────────────────

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
          componentSlug: 'badge',
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-cluster';
            wrap.dataset.spacing = 'sm';
            wrap.append(
              ...VARIANTS.map((variant) => buildLabelBadge(variant, t(VARIANT_LABEL_KEY[variant]))),
              buildIconBadge('default', buildIcon(Check), t('demonstration.labels.statusLabel')),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          items: [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')],
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
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
        // Os previews usam só rótulos do conteúdo: texto cravado aqui ficaria
        // em português nos três idiomas.
        return createDocsDoDont({
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              // Par 1: uma etiqueta curta contra uma frase inteira na etiqueta.
              doPreviewFactory: () =>
                buildLabelBadge('default', t('doDont.previews.pair1Do')),
              dontPreviewFactory: () =>
                buildLabelBadge('default', t('doDont.previews.pair1Dont')),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              // Par 2: destructive num alerta real contra destructive de enfeite.
              doPreviewFactory: () =>
                buildIconBadge('destructive', buildIcon(X), t('doDont.previews.pair2Do')),
              dontPreviewFactory: () =>
                buildLabelBadge('destructive', t('doDont.previews.pair2Dont')),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          componentSlug: 'badge',
          description: t('import.basic'),
          code: `import { createBadge } from '@/components/ui/badge';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode:
            `import { createBadge } from '@/components/ui/badge';\n` +
            `import { Check, createElement } from 'lucide';`,
        });

      case 'variantes':
        return createDocsVariants({
          componentSlug: 'badge',
          note: t('variants.note'),
          items: VARIANTS.map((variant) => ({
            // O nome é a variante — id estável, igual nos três idiomas.
            name: variant,
            description: stripHtml(t(`variants.items.${variant}`)),
            code: badgeSnippet({ variant, label: t(VARIANT_LABEL_KEY[variant]) }),
            previewFactory: () => buildLabelBadge(variant, t(VARIANT_LABEL_KEY[variant])),
          })),
        });

      case 'composicoes': {
        const statusLabel = t('demonstration.labels.statusLabel');
        const counterLabel = t('demonstration.labels.destructiveLabel');
        const categoryLabel = t('demonstration.labels.categoryLabel');
        const categoryFilterLabel = t('demonstration.labels.categoryFilterLabel');

        return createDocsCompositions({
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'badge',
          items: [
            {
              trackId: 'withIcon',
              name: t('variants.compositions.withIcon.name'),
              description: t('variants.compositions.withIcon.description'),
              useWhen: t('variants.compositions.withIcon.use'),
              code: badgeSnippet({ withIcon: true, label: statusLabel }),
              previewFactory: () => buildIconBadge('default', buildIcon(Check), statusLabel),
            },
            {
              trackId: 'withCounter',
              name: t('variants.compositions.withCounter.name'),
              description: t('variants.compositions.withCounter.description'),
              useWhen: t('variants.compositions.withCounter.use'),
              code: badgeWithCounterSnippet({ variant: 'destructive', label: counterLabel, count: '12' }),
              previewFactory: () =>
                createBadge({
                  variant: 'destructive',
                  children: [counterLabel, createBadgeCounter({ text: '12' })],
                }),
            },
            {
              trackId: 'asTrigger',
              name: t('variants.compositions.asTrigger.name'),
              description: t('variants.compositions.asTrigger.description'),
              useWhen: t('variants.compositions.asTrigger.use'),
              code: badgeTriggerSnippet({ label: categoryLabel, accessibleName: categoryFilterLabel }),
              previewFactory: () =>
                createButton({
                  variant: 'ghost',
                  size: 'sm',
                  'aria-label': categoryFilterLabel,
                  children: createBadge({ variant: 'info', children: categoryLabel }),
                }),
            },
            {
              trackId: 'asLink',
              name: t('variants.compositions.asLink.name'),
              description: t('variants.compositions.asLink.description'),
              useWhen: t('variants.compositions.asLink.use'),
              code: badgeLinkSnippet({ label: categoryLabel }),
              previewFactory: () => {
                const link = document.createElement('a');
                link.href = '#';
                link.append(createBadge({ variant: 'info', children: categoryLabel }));
                return link;
              },
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.countBadge.label'),  trigger: toPlainText(t('states.countBadge.trigger')),  behavior: toPlainText(t('states.countBadge.behavior'))  },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createBadge(options)
export type BadgeVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface BadgeOptions {
  variant?: BadgeVariant;
  children?: string | HTMLElement | SVGElement | Array<string | HTMLElement | SVGElement>;
  className?: string;
}`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };
        const no = tNav('common.no');

        return createDocsProps({
          tables: [
            {
              title: t('props.badgeTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: '"default" | "destructive" | "warning" | "success" | "info"',                  defaultValue: '"default"', required: no, description: toPlainText(t('props.table.variant')) },
                { name: 'children',  type: 'string | HTMLElement | SVGElement | Array<string | HTMLElement | SVGElement>', defaultValue: '—',         required: no, description: toPlainText(t('props.table.children')) },
                { name: 'className', type: 'string',                                                                       defaultValue: '—',         required: no, description: toPlainText(t('props.table.className')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        return createDocsTokens({
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            // A tabela lista o que a folha LÊ, e a coluna do meio diz ONDE:
            // o SELETOR que lê o token.
            // `--info` não tem linha porque a folha não o lê — a variante
            // info é pintada por `--border`. `--ring` também não: a etiqueta
            // não tem anel de foco (quem recebe foco é o botão ou o link).
            { token: '--primary',          value: '.nds-badge-default',       description: t('tokens.table.primary')         },
            { token: '--destructive',      value: '.nds-badge-destructive',   description: t('tokens.table.destructive')     },
            { token: '--success',          value: '.nds-badge-success',       description: t('tokens.table.success')         },
            { token: '--warning',          value: '.nds-badge-warning',       description: t('tokens.table.warning')         },
            { token: '--border',           value: '.nds-badge-info',          description: t('tokens.table.border')          },
            { token: '--secondary',        value: '.nds-badge-counter',       description: t('tokens.table.secondary')       },
            { token: '--foreground',       value: '.nds-badge',               description: t('tokens.table.foreground')      },
            { token: '--background',       value: '.nds-badge',               description: t('tokens.table.background')      },
            { token: '--radius-badge',     value: '.nds-badge',               description: t('tokens.table.radius')          },
            { token: '--badge-bg',         value: 'hsl(var(--background))',   description: t('tokens.table.badgeBg')         },
            { token: '--badge-fg',         value: 'hsl(var(--foreground))',   description: t('tokens.table.badgeFg')         },
            { token: '--badge-border',     value: 'hsl(var(--primary))',      description: t('tokens.table.badgeBorder')     },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
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
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: [
            t('screenReader.onRender'),
            t('screenReader.onUpdate'),
            t('screenReader.icons'),
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          componentSlug: 'badge',
          items: [
            { name: 'Alert',  description: toPlainText(t('related.alert')),  path: '?path=/docs/components-feedback-alert--docs'  },
            { name: 'Button', description: toPlainText(t('related.button')), path: '?path=/docs/components-form-button--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          componentSlug: 'badge',
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
          ],
        });

      case 'analytics':
        return createDocsAnalytics({
          cols: {
            event: t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload')      },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload')    },
          ],
        });

      case 'testes': {
        return createDocsTestes({
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: itemNumbers('testes.functional').map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: itemNumbers('testes.accessibility').map(i => ({
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
            items: itemNumbers('testes.visual').map(i => ({
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
        component_name: 'badge',
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
