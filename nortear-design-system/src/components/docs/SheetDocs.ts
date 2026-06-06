import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createSheet, type SheetSide } from '@/components/ui/sheet';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import sheetTranslations from '@shared/content/sheet/translations.json';

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
const { t, subscribe } = createTranslation(sheetTranslations as Record<string, unknown>);

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

type SheetDemoOptions = {
  side?: SheetSide;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  applyLabel: string;
  bodyText?: string;
};

function buildSheetDemo(opts: SheetDemoOptions): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });

  const body = document.createElement('div');
  body.className = 'nds-stack nds-text-body nds-text-muted-foreground';
  body.dataset.spacing = 'sm';
  const p = document.createElement('p');
  p.textContent = opts.bodyText ?? 'Conteúdo do painel — imagine campos de filtro aqui.';
  body.appendChild(p);

  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel });
  const apply = createButton({ variant: 'default', label: opts.applyLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'xs';
  footer.append(cancel, apply);

  // Fechar ao clicar nas ações: dispara click no overlay (close interno da factory).
  const closeFromAction = () => {
    const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
    overlay?.click();
  };
  cancel.addEventListener('click', closeFromAction);
  apply.addEventListener('click', closeFromAction);

  return createSheet({
    trigger,
    side: opts.side ?? 'right',
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
  });
}

// ─── createSheetDocs ──────────────────────────────────────────────────────────

export function createSheetDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'sheet',
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
      component_name: 'sheet',
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
      installNote: 'npx shadcn@latest add sheet',
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
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'sm';
            wrap.style.flexWrap = 'wrap';
            wrap.appendChild(buildSheetDemo({
              side: 'right',
              triggerLabel: t('demonstration.labels.trigger'),
              title: t('demonstration.labels.title'),
              description: t('demonstration.labels.description'),
              cancelLabel: t('demonstration.labels.cancel'),
              applyLabel: t('demonstration.labels.apply'),
            }));
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7, 8].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
            items: ['title', 'description', 'trigger', 'primary'].map(key => ({
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
                wrap.className = 'nds-stack nds-text-body';
                wrap.dataset.spacing = 'xs';
                const title = document.createElement('div');
                title.className = 'nds-font-medium';
                title.textContent = t('demonstration.labels.title');
                const desc = document.createElement('div');
                desc.className = 'nds-text-caption nds-text-muted-foreground';
                desc.textContent = t('demonstration.labels.description');
                wrap.append(title, desc);
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-text-body';
                const note = document.createElement('div');
                note.className = 'nds-text-caption nds-text-muted-foreground nds-italic';
                note.textContent = 'sem Title/Description — SR sem contexto';
                wrap.append(note);
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
                code.textContent = "side='right' (filtros desktop)";
                return code;
              },
              dontPreviewFactory: () => {
                const code = document.createElement('div');
                code.className = 'nds-text-body nds-font-mono';
                code.textContent = "side='top' em todos os contextos";
                return code;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createSheet } from '@/components/ui/sheet';
import { createButton } from '@/components/ui/button';`,
        });

      case 'variantes': {
        const codeRight = `const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
createSheet({
  trigger,
  side: 'right',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  content: body,
  footer,
});`;
        const codeLeft = `createSheet({ trigger, side: 'left', title, description, content, footer });`;
        const codeTop = `createSheet({ trigger, side: 'top', title, description, content, footer });`;
        const codeBottom = `createSheet({ trigger, side: 'bottom', title, description, content, footer });`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.right'),
              description: stripHtml(t('variants.styles.right')),
              code: codeRight,
              previewFactory: () => buildSheetDemo({
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.rightLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              name: t('variants.items.left'),
              description: stripHtml(t('variants.styles.left')),
              code: codeLeft,
              previewFactory: () => buildSheetDemo({
                side: 'left',
                triggerLabel: t('demonstration.labels.leftLabel'),
                title: t('demonstration.labels.leftLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              name: t('variants.items.top'),
              description: stripHtml(t('variants.styles.top')),
              code: codeTop,
              previewFactory: () => buildSheetDemo({
                side: 'top',
                triggerLabel: t('demonstration.labels.topLabel'),
                title: t('demonstration.labels.topLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              name: t('variants.items.bottom'),
              description: stripHtml(t('variants.styles.bottom')),
              code: codeBottom,
              previewFactory: () => buildSheetDemo({
                side: 'bottom',
                triggerLabel: t('demonstration.labels.bottomLabel'),
                title: t('demonstration.labels.bottomLabel'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        const buildSecondaryNavBody = () => {
          const nav = document.createElement('nav');
          nav.setAttribute('aria-label', 'Navegação secundária');
          nav.className = 'nds-stack nds-px-4';
          nav.dataset.spacing = 'xs';
          ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'].forEach((label) => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'nds-rounded-md nds-text-body nds-hover-bg-accent';
            a.style.padding = '0.5rem 0.75rem';
            a.textContent = label;
            nav.appendChild(a);
          });
          return nav;
        };
        const buildMobileActionsBody = () => {
          const grid = document.createElement('div');
          grid.className = 'nds-grid nds-px-4 nds-text-body';
          grid.dataset.cols = '3';
          grid.dataset.spacing = 'sm';
          ['Compartilhar', 'Editar', 'Excluir', 'Arquivar', 'Mover', 'Copiar link'].forEach((label) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nds-stack nds-rounded-md nds-border-default nds-hover-bg-accent';
            btn.dataset.spacing = 'xs';
            btn.style.alignItems = 'center';
            btn.style.padding = '0.75rem';
            btn.textContent = label;
            grid.appendChild(btn);
          });
          return grid;
        };
        const buildLongBody = () => {
          const wrap = document.createElement('div');
          wrap.className = 'nds-stack nds-text-body nds-text-muted-foreground';
          wrap.dataset.spacing = 'sm';
          for (let i = 1; i <= 14; i++) {
            const p = document.createElement('p');
            p.textContent = `Parágrafo ${i}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.`;
            wrap.appendChild(p);
          }
          return wrap;
        };

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'sheet',
          items: [
            {
              name: stripHtml(t('variants.compositions.advancedFilters.name')),
              description: stripHtml(t('variants.compositions.advancedFilters.description')),
              useWhen: stripHtml(t('variants.compositions.advancedFilters.use')),
              code: `const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
const form = document.createElement('form');
// ...campos de filtro
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.spacing = 'xs';
footer.append(
  createButton({ variant: 'outline', label: 'Cancelar' }),
  createButton({ variant: 'default', label: 'Aplicar filtros' }),
);
createSheet({
  trigger,
  side: 'right',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  content: form,
  footer,
});`,
              previewFactory: () => buildSheetDemo({
                side: 'right',
                triggerLabel: t('demonstration.labels.trigger'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                applyLabel: t('demonstration.labels.apply'),
              }),
            },
            {
              name: stripHtml(t('variants.compositions.secondaryNavigation.name')),
              description: stripHtml(t('variants.compositions.secondaryNavigation.description')),
              useWhen: stripHtml(t('variants.compositions.secondaryNavigation.use')),
              code: `const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Navegação secundária');
['Dashboard', 'Projetos', 'Equipe'].forEach(label => {
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = label;
  nav.appendChild(a);
});
createSheet({
  trigger,
  side: 'left',
  title: 'Menu',
  description: 'Navegue entre as áreas do sistema.',
  content: nav,
});`,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Abrir menu' });
                return createSheet({
                  trigger,
                  side: 'left',
                  title: 'Menu',
                  description: 'Navegue entre as áreas do sistema.',
                  content: buildSecondaryNavBody(),
                });
              },
            },
            {
              name: stripHtml(t('variants.compositions.mobileActions.name')),
              description: stripHtml(t('variants.compositions.mobileActions.description')),
              useWhen: stripHtml(t('variants.compositions.mobileActions.use')),
              code: `const grid = document.createElement('div');
grid.className = 'nds-grid';
grid.dataset.cols = '3';
grid.dataset.spacing = 'sm';
['Compartilhar', 'Editar', 'Excluir'].forEach(label => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  grid.appendChild(btn);
});
createSheet({
  trigger,
  side: 'bottom',
  title: 'Ações rápidas',
  description: 'Escolha o que fazer com este item.',
  content: grid,
});`,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Mais opções' });
                return createSheet({
                  trigger,
                  side: 'bottom',
                  title: 'Ações rápidas',
                  description: 'Escolha o que fazer com este item.',
                  content: buildMobileActionsBody(),
                });
              },
            },
            {
              name: stripHtml(t('variants.compositions.longScrollBody.name')),
              description: stripHtml(t('variants.compositions.longScrollBody.description')),
              useWhen: stripHtml(t('variants.compositions.longScrollBody.use')),
              code: `// body longo — factory aplica flex-1 overflow-auto no corpo automaticamente
const body = document.createElement('div');
// ...muitos parágrafos
createSheet({
  trigger,
  side: 'right',
  title: 'Termos de uso',
  description: 'Leia atentamente antes de aceitar.',
  content: body,
  footer,
});`,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Ler termos' });
                const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
                const accept = createButton({ variant: 'default', label: 'Aceitar termos' });
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
  footer.dataset.spacing = 'xs';
                footer.append(cancel, accept);
                const closeFromAction = () => {
                  const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
                  overlay?.click();
                };
                cancel.addEventListener('click', closeFromAction);
                accept.addEventListener('click', closeFromAction);
                return createSheet({
                  trigger,
                  side: 'right',
                  title: 'Termos de uso',
                  description: 'Leia atentamente antes de aceitar.',
                  content: buildLongBody(),
                  footer,
                });
              },
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
            { label: t('states.items.closed'),        trigger: 'estado inicial',                  behavior: stripHtml(t('states.descriptions.closed'))        },
            { label: t('states.items.open'),          trigger: 'click no trigger',                behavior: stripHtml(t('states.descriptions.open'))          },
            { label: t('states.items.transitioning'), trigger: 'animação de entrada/saída',       behavior: stripHtml(t('states.descriptions.transitioning')) },
            { label: t('states.items.focused'),       trigger: 'tab em elemento interno',         behavior: stripHtml(t('states.descriptions.focused'))       },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createSheet(options) — factory custom Nortear
export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

export type SheetOptions = {
  trigger: HTMLElement;
  side?: SheetSide;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createSheet(options: SheetOptions): HTMLElement;`;

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
              title: 'createSheet(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',         type: 'HTMLElement',                                       defaultValue: '—',       required: 'Sim', description: 'Elemento que abre o Sheet ao receber click (geralmente Button).' },
                { name: 'side',            type: "'top' | 'right' | 'bottom' | 'left'",               defaultValue: "'right'", required: 'Não', description: stripHtml(t('props.table.side.description')) },
                { name: 'title',           type: 'string',                                            defaultValue: '—',       required: 'Não', description: 'Texto do SheetTitle — fonte do aria-labelledby. RECOMENDADO para acessibilidade.' },
                { name: 'description',     type: 'string',                                            defaultValue: '—',       required: 'Não', description: 'Texto da SheetDescription — fonte do aria-describedby. RECOMENDADO para acessibilidade.' },
                { name: 'content',         type: 'HTMLElement',                                       defaultValue: '—',       required: 'Sim', description: 'Body do painel (formulário, lista, mensagem).' },
                { name: 'footer',          type: 'HTMLElement',                                       defaultValue: '—',       required: 'Não', description: 'Container das ações (Cancelar + ação primária).' },
                { name: 'onOpenChange',    type: '(open: boolean) => void',                           defaultValue: '—',       required: 'Não', description: stripHtml(t('props.table.onOpenChange.description')) },
                { name: 'class',           type: 'string',                                            defaultValue: '—',       required: 'Não', description: stripHtml(t('props.table.className.description')) },
                { name: 'open',            type: 'boolean',                                           defaultValue: '—',       required: 'Não', description: 'NÃO SUPORTADO pela factory Nortear — estado é interno (uncontrolled). Use onOpenChange para observar mudanças.' },
                { name: 'defaultOpen',     type: 'boolean',                                           defaultValue: 'false',   required: 'Não', description: 'NÃO SUPORTADO pela factory Nortear — para abrir programaticamente, chame `trigger.click()`.' },
                { name: 'showCloseButton', type: 'boolean',                                           defaultValue: 'true',    required: 'Não', description: 'NÃO SUPORTADO como prop — o botão X é sempre exibido. Esconda via CSS no `class` se necessário.' },
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
            { token: '--popover',             value: t('tokens.table.popover.class'),            description: t('tokens.table.popover.part')            },
            { token: '--popover-foreground',  value: t('tokens.table.popoverForeground.class'),  description: t('tokens.table.popoverForeground.part')  },
            { token: '--foreground',          value: t('tokens.table.foreground.class'),         description: t('tokens.table.foreground.part')         },
            { token: '--muted-foreground',    value: t('tokens.table.mutedForeground.class'),    description: t('tokens.table.mutedForeground.part')    },
            { token: '--border',              value: t('tokens.table.border.class'),             description: t('tokens.table.border.part')             },
            { token: '--ring',                value: t('tokens.table.ring.class'),               description: t('tokens.table.ring.part')               },
            { token: 'overlay',               value: t('tokens.table.overlay.class'),            description: t('tokens.table.overlay.part')            },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => sanitizeHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab')      },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Esc',       description: t('accessibility.keyboard.escape')   },
            { key: 'Enter',     description: t('accessibility.keyboard.enter')    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.drawer.name'),      description: t('related.items.drawer.description'),      path: '?path=/docs/ui-drawer--docs'      },
            { name: t('related.items.dialog.name'),      description: t('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'       },
            { name: t('related.items.alertDialog.name'), description: t('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
            { name: t('related.items.popover.name'),     description: t('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
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
            // Divergência idiomática Nortear — camada 1 (notes) do padrão 3-layer.
            { title: '', content: sanitizeHtml('<strong>Divergência Nortear</strong>: a factory <code>createSheet</code> não expõe props <code>open</code>/<code>defaultOpen</code>/<code>showCloseButton</code>. Para abertura programática, mantenha referência ao <code>trigger</code> e chame <code>trigger.click()</code>. O X embutido sempre é renderizado.') },
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
            { event: 'dialog_open',    trigger: t('analytics.table.dialog_open.trigger'),    payload: t('analytics.table.dialog_open.payload') },
            { event: 'dialog_close',   trigger: t('analytics.table.dialog_close.trigger'),   payload: t('analytics.table.dialog_close.payload') },
            { event: 'dialog_confirm', trigger: t('analytics.table.dialog_confirm.trigger'), payload: t('analytics.table.dialog_confirm.payload') },
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
        component_name: 'sheet',
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
      // Remove qualquer painel/overlay portado para body que tenha sido deixado órfão
      document.querySelectorAll('[data-slot="sheet-content"], [data-slot="sheet-overlay"]').forEach((n) => n.remove());
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return root;
}
