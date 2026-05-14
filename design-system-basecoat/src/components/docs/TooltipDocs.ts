import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createTooltip } from '@/components/ui/tooltip';
import { createButton, createButtonIcon } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import tooltipTranslations from '@shared/content/tooltip/translations.json';

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
const { t, subscribe } = createTranslation(tooltipTranslations as Record<string, unknown>);

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

function makeIconButton(ariaLabel: string): HTMLButtonElement {
  const iconWrap = document.createElement('span');
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.appendChild(createButtonIcon('download'));
  return createButton({
    variant: 'ghost',
    size: 'icon',
    ariaLabel,
    children: iconWrap,
  });
}

function buildDefaultTooltip(): HTMLElement {
  const trigger = createButton({
    variant: 'outline',
    label: t('demonstration.labels.saveButton'),
    ariaLabel: t('demonstration.labels.saveButton'),
  });
  return createTooltip({ trigger, content: t('demonstration.labels.save'), side: 'top' });
}

function buildWithShortcutTooltip(): HTMLElement {
  const trigger = makeIconButton(t('demonstration.labels.saveButton'));
  return createTooltip({ trigger, content: t('demonstration.labels.save'), side: 'bottom' });
}

function buildLongTextTooltip(): HTMLElement {
  const trigger = createButton({
    variant: 'outline',
    label: t('demonstration.labels.shareButton'),
    ariaLabel: t('demonstration.labels.shareButton'),
  });
  return createTooltip({
    trigger,
    content: t('demonstration.labels.share'),
    side: 'top',
    class: 'max-w-xs whitespace-normal text-center',
  });
}

// ─── createTooltipDocs ────────────────────────────────────────────────────────

export function createTooltipDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'tooltip',
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
      component_name: 'tooltip',
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
      installNote: 'npx shadcn@latest add tooltip',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(id: string) { pageLayout.setActiveSection(id); }

  // ── Sections ──────────────────────────────────────────────────────────────
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
            wrap.style.contain = 'layout';
            wrap.className = 'grid grid-cols-1 sm:grid-cols-3 gap-6 w-full min-h-[180px]';

            const cells: Array<{ labelKey: string; build: () => HTMLElement }> = [
              { labelKey: 'variants.items.default',      build: buildDefaultTooltip      },
              { labelKey: 'variants.items.withShortcut', build: buildWithShortcutTooltip },
              { labelKey: 'variants.items.longText',     build: buildLongTextTooltip     },
            ];

            for (const cell of cells) {
              const col = document.createElement('div');
              col.className = 'space-y-2';
              col.style.contain = 'layout';
              col.style.position = 'relative';
              col.style.minHeight = '120px';

              const label = document.createElement('p');
              label.className = 'text-xs font-medium text-muted-foreground';
              label.textContent = t(cell.labelKey);

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
          items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4].map(i => sanitizeHtml(t(`usage.guidelines.item${i}`))),
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
            items: ['content', 'shortcut', 'icon'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: stripHtml(t(`usage.uxWriting.table.${key}.format`)),
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
            items: [1, 2, 3, 4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
                wrap.className = 'text-xs font-mono';
                wrap.textContent = 'aria-label="Salvar" + Tooltip "Salvar (Ctrl+S)"';
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'text-xs font-mono';
                wrap.textContent = 'Tooltip "Salvar" (sem aria-label)';
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
                code.className = 'text-sm font-mono';
                code.textContent = '"Salvar (Ctrl+S)"';
                return code;
              },
              dontPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'text-sm font-mono';
                code.textContent = '"Clique aqui para abrir o formulário…"';
                return code;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createTooltip } from '@/components/ui/tooltip';`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({
  variant: 'outline',
  label: 'Salvar',
  ariaLabel: 'Salvar',
});

createTooltip({ trigger, content: 'Salvar', side: 'top' });`;

        const codeShortcut = `// Botão icon-only mantém aria-label obrigatório
const trigger = createButton({
  variant: 'ghost',
  size: 'icon',
  ariaLabel: 'Salvar',
  children: iconSvg,
});

createTooltip({ trigger, content: 'Salvar (Ctrl+S)', side: 'bottom' });`;

        const codeLong = `createTooltip({
  trigger,
  content: 'Esta ação salva todas as alterações localmente e sincroniza com o servidor.',
  side: 'top',
  class: 'max-w-xs whitespace-normal text-center',
});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.default'),
              description: stripHtml(t('variants.styles.default')),
              code: codeDefault,
              previewFactory: () => buildDefaultTooltip(),
            },
            {
              name: t('variants.items.withShortcut'),
              description: stripHtml(t('variants.styles.withShortcut')),
              code: codeShortcut,
              previewFactory: () => buildWithShortcutTooltip(),
            },
            {
              name: t('variants.items.longText'),
              description: stripHtml(t('variants.styles.longText')),
              code: codeLong,
              previewFactory: () => buildLongTextTooltip(),
            },
          ],
        });
      }

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
            { label: t('states.items.closed'),  trigger: 'estado inicial',          behavior: stripHtml(t('states.descriptions.closed'))  },
            { label: t('states.items.open'),    trigger: 'hover/focus no trigger',  behavior: stripHtml(t('states.descriptions.open'))    },
            { label: t('states.items.hover'),   trigger: 'mouseenter no trigger',   behavior: stripHtml(t('states.descriptions.hover'))   },
            { label: t('states.items.focus'),   trigger: 'Tab até o trigger',       behavior: stripHtml(t('states.descriptions.focus'))   },
            { label: t('states.items.delayed'), trigger: 'antes do delay completar', behavior: stripHtml(t('states.descriptions.delayed')) },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createTooltip(options) — factory custom Basecoat
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
  trigger: HTMLElement;
  content: string;
  side?: TooltipSide;
  class?: string;
};

export function createTooltip(options: TooltipOptions): HTMLElement;`;

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
              title: 'createTooltip(options)',
              cols: propsCols,
              items: [
                { name: 'trigger', type: 'HTMLElement',                         defaultValue: '—',     required: 'Sim', description: 'Elemento que ativa o tooltip por hover ou foco. aria-describedby é setado automaticamente.' },
                { name: 'content', type: 'string',                              defaultValue: '—',     required: 'Sim', description: 'Texto do tooltip. Renderizado via textContent (sem HTML).' },
                { name: 'side',    type: "'top' | 'bottom' | 'left' | 'right'", defaultValue: "'top'", required: 'Não', description: stripHtml(t('props.table.side.description')) + ' NOTA: factory Basecoat NÃO faz auto-flip por colisão.' },
                { name: 'class',   type: 'string',                              defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.className.description')) },
                { name: 'delay',        type: 'number',                       defaultValue: '300',   required: 'Não', description: stripHtml(t('props.table.delay.description')) + ' NOTA: factory Basecoat usa SHOW_DELAY interno fixo de 300 ms; não é configurável via prop nem via Provider compartilhado.' },
                { name: 'align',        type: "'start' | 'center' | 'end'",   defaultValue: "'center'", required: 'Não', description: stripHtml(t('props.table.align.description')) + ' NOTA: factory Basecoat só aplica center implícito; align não é suportado.' },
                { name: 'sideOffset',   type: 'number',                       defaultValue: '6',     required: 'Não', description: stripHtml(t('props.table.sideOffset.description')) + ' NOTA: factory Basecoat usa gap fixo (6px).' },
                { name: 'open',         type: 'boolean',                      defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.open.description')) + ' NOTA: factory Basecoat é uncontrolled-only.' },
                { name: 'defaultOpen',  type: 'boolean',                      defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.defaultOpen.description')) + ' NOTA: não suportado pela factory Basecoat.' },
                { name: 'onOpenChange', type: '(open: boolean) => void',      defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.onOpenChange.description')) + ' NOTA: não exposto pela factory Basecoat.' },
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
            { token: '--foreground', value: t('tokens.table.foreground.class'), description: t('tokens.table.foreground.part') },
            { token: '--background', value: t('tokens.table.background.class'), description: t('tokens.table.background.part') },
            { token: 'fill',         value: t('tokens.table.fill.class'),       description: t('tokens.table.fill.part')       },
            { token: '--radius',     value: t('tokens.table.radius.class'),     description: t('tokens.table.radius.part')     },
            { token: 'z-index',      value: t('tokens.table.zIndex.class'),     description: t('tokens.table.zIndex.part')     },
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
            { key: 'Esc',       description: stripHtml(t('accessibility.keyboard.escape'))   + ' NOTA: factory Basecoat não implementa Escape — apenas blur fecha.' },
            { key: 'Shift+Tab', description: stripHtml(t('accessibility.keyboard.shiftTab')) },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.popover.name'),   description: t('related.items.popover.description'),   path: '?path=/docs/ui-popover--docs'    },
            { name: t('related.items.hoverCard.name'), description: t('related.items.hoverCard.description'), path: '?path=/docs/ui-hovercard--docs'  },
            { name: t('related.items.button.name'),    description: t('related.items.button.description'),    path: '?path=/docs/ui-button--docs'     },
            { name: t('related.items.kbd.name'),       description: t('related.items.kbd.description'),       path: '?path=/docs/ui-kbd--docs'        },
          ],
        });

      case 'notas': {
        const extraNote = getLocale() === 'en'
          ? '<strong>Basecoat divergences</strong>: custom factory has no TooltipProvider — delay is per-instance and fixed at 300ms. No auto-flip on collision, no Arrow, no Escape handler, no align/sideOffset/open/onOpenChange props. Content is plain text (no <code>&lt;kbd&gt;</code> children).'
          : getLocale() === 'es'
          ? '<strong>Divergencias Basecoat</strong>: la factory custom no tiene TooltipProvider — el delay es por instancia y fijo en 300 ms. Sin auto-flip por colisión, sin Arrow, sin handler de Escape, sin props align/sideOffset/open/onOpenChange. Content es texto plano (sin children <code>&lt;kbd&gt;</code>).'
          : '<strong>Divergências Basecoat</strong>: a factory custom não possui TooltipProvider — o delay é por instância e fixo em 300ms. Sem auto-flip por colisão, sem Arrow, sem handler de Escape, sem props align/sideOffset/open/onOpenChange. Content é texto plano (sem children <code>&lt;kbd&gt;</code>).';

        return createDocsNotes({
          title: t('notes.title'),
          items: [
            ...[1, 2, 3, 4].map(i => ({ title: '', content: sanitizeHtml(t(`notes.item${i}`)) })),
            { title: '', content: sanitizeHtml(extraNote) },
          ],
        });
      }

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
              event: 'tooltip_view',
              trigger: stripHtml(t('analytics.table.tooltip_view.trigger')),
              payload: stripHtml(t('analytics.table.tooltip_view.payload')),
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
            items: [1, 2, 3, 4].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
            items: [1, 2, 3, 4].map(i => ({
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
        component_name: 'tooltip',
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
      // Also remove any leaked tooltip panels
      document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
