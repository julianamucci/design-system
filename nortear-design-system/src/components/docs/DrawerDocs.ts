import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createDrawer } from '@/components/ui/drawer';
import { createSheet } from '@/components/ui/sheet';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import drawerTranslations from '@shared/content/drawer/translations.json';

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
const { t, subscribe } = createTranslation(drawerTranslations as Record<string, unknown>);

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

type DrawerDemoOptions = {
  triggerLabel: string;
  title: string;
  description?: string;
  cancelLabel: string;
  actionLabel: string;
  destructive?: boolean;
  side?: 'bottom' | 'top' | 'left' | 'right';
  bodyText?: string;
};

function buildDrawerDemo(opts: DrawerDemoOptions): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: opts.triggerLabel });
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel });
  const action = createButton({
    variant: opts.destructive ? 'destructive' : 'default',
    label: opts.actionLabel,
  });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
  footer.append(cancel, action);

  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = opts.bodyText ?? '';

  const side = opts.side ?? 'bottom';
  let el: HTMLElement;
  if (side === 'bottom') {
    el = createDrawer({
      trigger,
      title: opts.title,
      description: opts.description,
      content: body,
      footer,
    });
  } else {
    el = createSheet({
      trigger,
      side,
      title: opts.title,
      description: opts.description,
      content: body,
      footer,
    });
  }
  el.dataset.slot = 'drawer';
  el.dataset.vaulDrawerDirection = side;
  return el;
}

// ─── createDrawerDocs ─────────────────────────────────────────────────────────

export function createDrawerDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'drawer',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/disclosure' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'drawer',
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
      installNote: 'npx shadcn@latest add drawer',
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
            wrap.className = 'nds-cluster';
            wrap.dataset.justify = 'center';
            wrap.dataset.spacing = 'sm';
            wrap.style.flexWrap = 'wrap';
            wrap.style.minHeight = '140px';
            wrap.append(
              buildDrawerDemo({
                triggerLabel: t('demonstration.labels.bottom'),
                title: 'Editar perfil',
                description: 'Atualize seus dados.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar',
                bodyText: 'Conteúdo do drawer.',
                side: 'bottom',
              }),
            );
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
            items: ['title', 'description', 'trigger', 'close'].map(key => ({
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
              doPreviewFactory: () => buildDrawerDemo({
                triggerLabel: 'Editar perfil',
                title: 'Editar perfil',
                description: 'Atualize seus dados.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar',
                bodyText: 'Com DrawerTitle visível.',
              }),
              dontPreviewFactory: () => buildDrawerDemo({
                triggerLabel: 'Abrir',
                title: '',
                cancelLabel: 'Cancelar',
                actionLabel: 'OK',
                bodyText: 'Sem DrawerTitle — leitor de tela não anuncia.',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => buildDrawerDemo({
                triggerLabel: 'Abrir mobile',
                title: 'Filtros',
                description: 'Mobile-first com swipe-to-close.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Aplicar',
                side: 'bottom',
              }),
              dontPreviewFactory: () => buildDrawerDemo({
                triggerLabel: 'Aninhamento ❌',
                title: 'Drawer aninhado',
                description: 'Não aninhe drawers.',
                cancelLabel: 'Cancelar',
                actionLabel: 'OK',
                bodyText: 'Aninhar quebra focus trap.',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { createDrawer } from '@/components/ui/drawer';
import { createButton } from '@/components/ui/button';`,
        });

      case 'variantes': {
        const codeBottom = `// direction=bottom (default da factory createDrawer)
const drawer = createDrawer({
  trigger,
  title: 'Editar perfil',
  description: 'Atualize seus dados.',
  content,
  footer,
});`;

        const codeOther = `// Para direction != bottom, use createSheet (divergência idiomática vs. vaul):
import { createSheet } from '@/components/ui/sheet';

const drawer = createSheet({
  trigger,
  side: 'right', // 'top' | 'left' | 'right'
  title: 'Filtros',
  content,
  footer,
});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: t('variants.items.bottom'),
              description: t('variants.styles.bottom'),
              code: codeBottom,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: t('demonstration.labels.bottom'),
                title: 'Editar perfil',
                description: 'Atualize seus dados.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar',
                side: 'bottom',
              }),
            },
            {
              name: t('variants.items.top'),
              description: t('variants.styles.top'),
              code: codeOther,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: t('demonstration.labels.top'),
                title: 'Notificação',
                description: 'Mensagem rápida.',
                cancelLabel: 'Dispensar',
                actionLabel: 'Ver',
                side: 'top',
              }),
            },
            {
              name: t('variants.items.left'),
              description: t('variants.styles.left'),
              code: codeOther,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: t('demonstration.labels.left'),
                title: 'Menu',
                description: 'Navegação lateral.',
                cancelLabel: 'Fechar',
                actionLabel: 'Confirmar',
                side: 'left',
              }),
            },
            {
              name: t('variants.items.right'),
              description: t('variants.styles.right'),
              code: codeOther,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: t('demonstration.labels.right'),
                title: 'Filtros',
                description: 'Painel de filtros.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Aplicar',
                side: 'right',
              }),
            },
          ],
        });
      }

      case 'composicoes': {
        function buildField(labelText: string, type: string, value: string): HTMLLabelElement {
          const label = document.createElement('label');
          label.className = 'nds-stack nds-text-body';
          label.dataset.spacing = 'xs';
          const span = document.createElement('span');
          span.className = 'nds-font-medium';
          span.textContent = labelText;
          const input = document.createElement('input');
          input.className = 'nds-border-default nds-rounded-md';
          input.style.padding = '0.5rem 0.75rem';
          input.type = type;
          input.value = value;
          label.append(span, input);
          return label;
        }

        const codeWithForm = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });

const form = document.createElement('form');
form.className = 'nds-stack';
form.dataset.spacing = 'sm';
form.append(
  buildField('Nome', 'text', 'Maria Souza'),
  buildField('E-mail', 'email', 'maria@exemplo.com'),
);

const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
const action = createButton({ variant: 'default', label: 'Salvar alterações' });
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.justify = 'end';
footer.dataset.spacing = 'xs';
footer.append(cancel, action);

const drawer = createDrawer({
  trigger,
  title: 'Editar perfil',
  description: 'Atualize seus dados pessoais.',
  content: form,
  footer,
});`;

        const codeWithConfirmation = `const trigger = createButton({ variant: 'outline', label: 'Remover item' });

const body = document.createElement('div');
body.className = 'nds-text-body nds-text-muted-foreground';
body.textContent = 'Você poderá adicioná-lo novamente a qualquer momento.';

const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
const action = createButton({ variant: 'destructive', label: 'Remover' });
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.justify = 'end';
footer.dataset.spacing = 'xs';
footer.append(cancel, action);

const drawer = createDrawer({
  trigger,
  title: 'Remover item da lista?',
  description: 'Você poderá adicioná-lo novamente a qualquer momento.',
  content: body,
  footer,
});`;

        const codeWithScroll = `const trigger = createButton({ variant: 'outline', label: 'Ler termos' });

const longBody = document.createElement('div');
longBody.className = 'nds-stack nds-text-body nds-text-muted-foreground nds-overflow-y';
longBody.dataset.spacing = 'sm';
longBody.style.maxHeight = '16rem';
longBody.style.paddingRight = '0.5rem';
for (let i = 1; i <= 12; i++) {
  const p = document.createElement('p');
  p.textContent = \`Parágrafo \${i}: termos longos para garantir scroll interno.\`;
  longBody.appendChild(p);
}

const drawer = createDrawer({
  trigger,
  title: 'Termos de uso',
  description: 'Leia atentamente antes de aceitar.',
  content: longBody,
  footer,
});`;

        const codeRightPanel = `// No Nortear, direction != 'bottom' usa createSheet
import { createSheet } from '@/components/ui/sheet';

const trigger = createButton({ variant: 'outline', label: 'Abrir filtros' });
const body = document.createElement('div');
body.className = 'nds-px-4 nds-text-body nds-text-muted-foreground';
body.textContent = 'Conteúdo dos filtros…';

const drawer = createSheet({
  trigger,
  side: 'right',
  title: 'Filtros',
  description: 'Refine os resultados.',
  content: body,
  footer,
});`;

        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'drawer',
          items: [
            {
              name: stripHtml(t('variants.compositions.withForm.name')),
              description: stripHtml(t('variants.compositions.withForm.description')),
              useWhen: stripHtml(t('variants.compositions.withForm.use')),
              code: codeWithForm,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });
                const form = document.createElement('form');
                form.className = 'nds-stack';
form.dataset.spacing = 'sm';
                form.append(
                  buildField('Nome', 'text', 'Maria Souza'),
                  buildField('E-mail', 'email', 'maria@exemplo.com'),
                );
                const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
                const action = createButton({ variant: 'default', label: 'Salvar alterações' });
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
                footer.append(cancel, action);
                const el = createDrawer({
                  trigger,
                  title: 'Editar perfil',
                  description: 'Atualize seus dados pessoais.',
                  content: form,
                  footer,
                });
                el.dataset.slot = 'drawer';
                el.dataset.vaulDrawerDirection = 'bottom';
                return el;
              },
            },
            {
              name: stripHtml(t('variants.compositions.withConfirmation.name')),
              description: stripHtml(t('variants.compositions.withConfirmation.description')),
              useWhen: stripHtml(t('variants.compositions.withConfirmation.use')),
              code: codeWithConfirmation,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: 'Remover item',
                title: 'Remover item da lista?',
                description: 'Você poderá adicioná-lo novamente a qualquer momento.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Remover',
                destructive: true,
                bodyText: 'Esta ação remove o item desta lista.',
                side: 'bottom',
              }),
            },
            {
              name: stripHtml(t('variants.compositions.withScroll.name')),
              description: stripHtml(t('variants.compositions.withScroll.description')),
              useWhen: stripHtml(t('variants.compositions.withScroll.use')),
              code: codeWithScroll,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Ler termos' });
                const longBody = document.createElement('div');
                longBody.className = 'nds-stack nds-text-body nds-text-muted-foreground nds-overflow-y';
longBody.dataset.spacing = 'sm';
longBody.style.maxHeight = '16rem';
longBody.style.paddingRight = '0.5rem';
                for (let i = 1; i <= 12; i++) {
                  const p = document.createElement('p');
                  p.textContent = `Parágrafo ${i}: termos longos para garantir scroll interno.`;
                  longBody.appendChild(p);
                }
                const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
                const action = createButton({ variant: 'default', label: 'Aceitar termos' });
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
                footer.append(cancel, action);
                const el = createDrawer({
                  trigger,
                  title: 'Termos de uso',
                  description: 'Leia atentamente antes de aceitar.',
                  content: longBody,
                  footer,
                });
                el.dataset.slot = 'drawer';
                el.dataset.vaulDrawerDirection = 'bottom';
                return el;
              },
            },
            {
              name: stripHtml(t('variants.compositions.rightPanel.name')),
              description: stripHtml(t('variants.compositions.rightPanel.description')),
              useWhen: stripHtml(t('variants.compositions.rightPanel.use')),
              code: codeRightPanel,
              previewFactory: () => buildDrawerDemo({
                triggerLabel: 'Abrir filtros',
                title: 'Filtros',
                description: 'Refine os resultados.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Aplicar',
                bodyText: 'Conteúdo dos filtros…',
                side: 'right',
              }),
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
            {
              label: t('states.items.closed'),
              trigger: 'defaultOpen=false',
              behavior: stripHtml(t('states.descriptions.closed')),
            },
            {
              label: t('states.items.open'),
              trigger: 'click trigger / defaultOpen=true',
              behavior: stripHtml(t('states.descriptions.open')),
            },
            {
              label: t('states.items.controlled'),
              trigger: 'open + onOpenChange',
              behavior: stripHtml(t('states.descriptions.controlled')),
            },
          ],
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createDrawer(options)
export type DrawerOptions = {
  trigger: HTMLElement;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export function createDrawer(options: DrawerOptions): HTMLElement;`;

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
              title: 'createDrawer(options)',
              cols: propsCols,
              items: [
                { name: 'trigger',      type: 'HTMLElement',                 defaultValue: '—',     required: 'Sim', description: 'Elemento que abre o drawer ao receber click.' },
                { name: 'title',        type: 'string',                      defaultValue: '—',     required: 'Não', description: 'Título — fonte do aria-labelledby (recomendado, mesmo se sr-only).' },
                { name: 'description',  type: 'string',                      defaultValue: '—',     required: 'Não', description: 'Descrição — fonte do aria-describedby.' },
                { name: 'content',      type: 'HTMLElement',                 defaultValue: '—',     required: 'Sim', description: 'Body do drawer.' },
                { name: 'footer',       type: 'HTMLElement',                 defaultValue: '—',     required: 'Não', description: 'Container das ações.' },
                { name: 'onOpenChange', type: '(open: boolean) => void',     defaultValue: '—',     required: 'Não', description: t('props.table.onOpenChange.description') },
                { name: 'class',        type: 'string',                      defaultValue: '—',     required: 'Não', description: 'Classes adicionais aplicadas ao painel.' },
                { name: 'open',         type: 'boolean',                     defaultValue: '—',     required: 'Não', description: stripHtml(t('props.table.open.description')) + ' (controlado externamente via .click() no trigger no Nortear).' },
                { name: 'defaultOpen',  type: 'boolean',                     defaultValue: 'false', required: 'Não', description: stripHtml(t('props.table.defaultOpen.description')) },
                { name: 'direction',    type: "'bottom' | 'top' | 'left' | 'right'", defaultValue: "'bottom'", required: 'Não', description: stripHtml(t('props.table.direction.description')) + ' NOTA: createDrawer fixa bottom; outras direções via createSheet.' },
                { name: 'modal',        type: 'boolean',                     defaultValue: 'true',  required: 'Não', description: stripHtml(t('props.table.modal.description')) },
                { name: 'dismissible',  type: 'boolean',                     defaultValue: 'true',  required: 'Não', description: stripHtml(t('props.table.dismissible.description')) },
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
            { token: '--border',             value: t('tokens.table.border.class'),     description: t('tokens.table.border.part') },
            { token: '—',                    value: t('tokens.table.overlay.class'),    description: t('tokens.table.overlay.part') },
            { token: '--muted',              value: t('tokens.table.handle.class'),     description: t('tokens.table.handle.part') },
            { token: '--radius-xl',          value: t('tokens.table.rounded.class'),    description: t('tokens.table.rounded.part') },
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
            { key: 'Tab/Shift+Tab', description: t('accessibility.keyboard.tab')    },
            { key: 'Escape',        description: t('accessibility.keyboard.escape') },
            { key: 'Enter/Space',   description: t('accessibility.keyboard.enter')  },
            { key: 'Swipe',         description: t('accessibility.keyboard.swipe')  },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: t('related.items.sheet.name'),       description: t('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'       },
            { name: t('related.items.dialog.name'),      description: t('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'      },
            { name: t('related.items.alertDialog.name'), description: t('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
            { name: t('related.items.sidebar.name'),     description: t('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs'     },
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
              event: 'drawer_open',
              trigger: 'onOpenChange(true)',
              payload: "{ component: 'drawer', location, label }",
            },
            {
              event: 'drawer_close',
              trigger: 'onOpenChange(false)',
              payload: "{ component: 'drawer', location, label }",
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
        component_name: 'drawer',
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
