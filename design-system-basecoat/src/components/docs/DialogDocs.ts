import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createDialog } from '@/components/ui/dialog';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import dialogTranslations from '@shared/content/dialog/translations.json';

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
const { t, subscribe } = createTranslation(dialogTranslations as Record<string, unknown>);

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

type DialogDemoOptions = {
  triggerLabel: string;
  triggerVariant?: 'default' | 'outline' | 'destructive';
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  destructive?: boolean;
  showCloseButton?: boolean;
  bodyText?: string;
};

function buildDialogDemo(opts: DialogDemoOptions): HTMLElement {
  const trigger = createButton({
    variant: opts.triggerVariant ?? 'outline',
    label: opts.triggerLabel,
  });
  const cancel = createButton({ variant: 'outline', label: opts.cancelLabel });
  const action = createButton({
    variant: opts.destructive ? 'destructive' : 'default',
    label: opts.actionLabel,
  });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
  footer.appendChild(cancel);
  footer.appendChild(action);

  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = opts.bodyText ?? '';

  return createDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    content: body,
    footer,
    showCloseButton: opts.showCloseButton,
  });
}

// ─── createDialogDocs ─────────────────────────────────────────────────────────

export function createDialogDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'dialog',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      aiIntent: t('seo.aiIntent'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: 'Overlay', item: '/components/overlay' },
        { name: 'Dialog' },
      ],
    });
    track('docs_page_view', {
      component_name: 'dialog',
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
      installNote: 'npx shadcn@latest add dialog',
    });
    headerSlot.replaceChildren(header);
  }
  function buildSidebar() { pageLayout.rebuildNav(buildNavGroups()); }
  function updateActiveNav(activeId: string) { pageLayout.setActiveSection(activeId); }

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
            wrap.dataset.spacing = 'md';
            wrap.style.flexWrap = 'wrap';
            wrap.append(
              buildDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                bodyText: t('demonstration.labels.footerNote'),
              }),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1,2,3,4,5,6,7,8,9,10].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1,2,3,4,5,6].map(i => t(`usage.guidelines.item${i}`)),
          },
          scenarios: {
            title: t('usage.scenarios.title'),
            cols: {
              scenario: t('usage.scenarios.cols.scenario'),
              use: t('usage.scenarios.cols.use'),
              alternative: t('usage.scenarios.cols.alternative'),
            },
            items: [1,2,3,4,5,6].map(i => ({
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
            items: ['title', 'description', 'action', 'cancel', 'srOnly'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1,2,3,4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1,2,3,4].map(i => stripHtml(t(`usage.dont.item${i}`))),
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
              dontCaption: stripHtml(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildDialogDemo({
                triggerLabel: 'Editar perfil',
                title: 'Editar perfil',
                description: 'Atualize suas informações pessoais.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar alterações',
                bodyText: 'Os campos estariam aqui em uma aplicação real.',
              }),
              dontPreviewFactory: () => buildDialogDemo({
                triggerLabel: 'Atenção',
                title: 'Atenção',
                description: '',
                cancelLabel: 'Cancelar',
                actionLabel: 'OK',
                bodyText: '',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: stripHtml(t('doDont.pair2.do')),
              dontCaption: stripHtml(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildDialogDemo({
                triggerLabel: 'Editar perfil',
                title: 'Editar perfil',
                description: 'Atualize suas informações pessoais.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar alterações',
                bodyText: '',
              }),
              dontPreviewFactory: () => buildDialogDemo({
                triggerLabel: 'Excluir conta',
                triggerVariant: 'destructive',
                title: 'Excluir conta?',
                description: 'Confirme para remover.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Excluir',
                destructive: true,
                bodyText: 'Use AlertDialog para esse caso.',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createDialog } from '@/components/ui/dialog';
import { createButton } from '@/components/ui/button';`,
          secondaryDescription: t('import.withScroll'),
          secondaryCode: `// Para body com scroll interno, basta aplicar max-h + overflow-y-auto:
const body = document.createElement('div');
body.className = 'max-h-[60vh] nds-overflow-y';

const dialog = createDialog({
  trigger,
  title: 'Termos de uso',
  description: 'Leia atentamente antes de aceitar.',
  content: body,
  footer,
});`,
        });

      case 'variantes': {
        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Editar perfil' });
const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
const action = createButton({ variant: 'default', label: 'Salvar alterações' });

const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.justify = 'end';
footer.dataset.spacing = 'xs';
footer.append(cancel, action);

createDialog({ trigger, title: 'Editar perfil', description: '...', content, footer });`;

        const codeWithForm = `const form = document.createElement('form');
form.className = 'nds-stack';
form.dataset.spacing = 'sm';
// inputs...

createDialog({ trigger, title: 'Editar perfil', description: '...', content: form, footer });`;

        const codeNoFooter = `createDialog({
  trigger,
  title: 'Sobre este recurso',
  description: 'Detalhes informativos.',
  content: body,
  // sem footer
});`;

        const codeDestructive = `const action = createButton({ variant: 'destructive', label: 'Remover' });
// Footer com action destrutiva — uso secundário; para confirmação primária use AlertDialog.`;

        const codeCustomClose = `createDialog({
  trigger,
  title: 'Próximos passos',
  description: '...',
  content,
  footer, // inclui o seu próprio botão "Fechar"
  showCloseButton: false, // remove o X do canto
});`;

        return createDocsVariants({
          title: t('variants.title'),
          items: [
            {
              name: 'default',
              description: t('variants.items.default'),
              code: codeDefault,
              previewFactory: () => buildDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
              }),
            },
            {
              name: 'withForm',
              description: t('variants.items.withForm'),
              code: codeWithForm,
              previewFactory: () => buildDialogDemo({
                triggerLabel: 'Editar perfil',
                title: 'Editar perfil',
                description: 'Formulário inline.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Salvar alterações',
                bodyText: 'Imagine os campos aqui.',
              }),
            },
            {
              name: 'noFooter',
              description: t('variants.items.noFooter'),
              code: codeNoFooter,
              previewFactory: () => {
                const trigger = createButton({ variant: 'outline', label: 'Sobre este recurso' });
                const body = document.createElement('div');
                body.className = 'nds-text-body nds-text-muted-foreground';
                body.textContent = 'Sem ações — apenas informação.';
                return createDialog({
                  trigger,
                  title: 'Sobre este recurso',
                  description: 'Detalhes técnicos.',
                  content: body,
                });
              },
            },
            {
              name: 'withDestructiveAction',
              description: stripHtml(t('variants.items.withDestructiveAction')),
              code: codeDestructive,
              previewFactory: () => buildDialogDemo({
                triggerLabel: 'Remover item',
                title: 'Remover item da lista?',
                description: 'O item permanece na biblioteca.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Remover',
                destructive: true,
              }),
            },
            {
              name: 'customCloseInFooter',
              description: stripHtml(t('variants.items.customCloseInFooter')),
              code: codeCustomClose,
              previewFactory: () => buildDialogDemo({
                triggerLabel: 'Abrir guia',
                title: 'Próximos passos',
                description: 'Continue o fluxo.',
                cancelLabel: 'Voltar',
                actionLabel: 'Continuar',
                showCloseButton: false,
              }),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'dialog',
          items: [
            {
              name: stripHtml(t('variants.compositions.confirmEmail.name')),
              description: stripHtml(t('variants.compositions.confirmEmail.description')),
              useWhen: stripHtml(t('variants.compositions.confirmEmail.use')),
              code: `const body = document.createElement('div');
body.className = 'nds-text-body nds-text-muted-foreground';
body.textContent = 'Vamos enviar um link para maria@exemplo.com.';

const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
const action = createButton({ variant: 'default', label: 'Enviar link' });
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.justify = 'end';
footer.dataset.spacing = 'xs';
footer.append(cancel, action);

createDialog({
  trigger: createButton({ variant: 'default', label: 'Enviar link' }),
  title: 'Confirmar e-mail',
  description: 'Verifique o endereço antes de enviar o link de acesso.',
  content: body,
  footer,
});`,
              previewFactory: () => buildDialogDemo({
                triggerLabel: 'Enviar link',
                triggerVariant: 'default',
                title: 'Confirmar e-mail',
                description: 'Verifique o endereço antes de enviar o link de acesso.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Enviar link',
                bodyText: 'Vamos enviar um link para maria@exemplo.com.',
              }),
            },
            {
              name: stripHtml(t('variants.compositions.profileEdit.name')),
              description: stripHtml(t('variants.compositions.profileEdit.description')),
              useWhen: stripHtml(t('variants.compositions.profileEdit.use')),
              code: `const form = document.createElement('form');
form.className = 'nds-stack';
form.dataset.spacing = 'sm';
// campos: Nome de exibição, Função, Bio...

const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
const action = createButton({ variant: 'default', label: 'Salvar alterações' });
const footer = document.createElement('div');
footer.className = 'nds-cluster';
footer.dataset.justify = 'end';
footer.dataset.spacing = 'xs';
footer.append(cancel, action);

createDialog({
  trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
  title: 'Editar perfil',
  description: 'Atualize suas informações pessoais.',
  content: form,
  footer,
});`,
              previewFactory: () => {
                const form = document.createElement('form');
                form.className = 'nds-stack';
form.dataset.spacing = 'sm';

                const buildField = (labelText: string, value: string) => {
                  const label = document.createElement('label');
                  label.className = 'nds-stack nds-text-body';
                  label.dataset.spacing = 'xs';
                  const span = document.createElement('span');
                  span.className = 'nds-font-medium';
                  span.textContent = labelText;
                  const input = document.createElement('input');
                  input.className = 'nds-border-default nds-rounded-md';
                  input.style.padding = '0.5rem 0.75rem';
                  input.type = 'text';
                  input.value = value;
                  label.append(span, input);
                  return label;
                };

                form.append(
                  buildField('Nome de exibição', 'Maria Souza'),
                  buildField('Função', 'Designer'),
                );

                const cancel = createButton({ variant: 'outline', label: 'Cancelar' });
                const action = createButton({ variant: 'default', label: 'Salvar alterações' });
                const footer = document.createElement('div');
                footer.className = 'nds-cluster';
  footer.dataset.justify = 'end';
  footer.dataset.spacing = 'xs';
                footer.append(cancel, action);

                return createDialog({
                  trigger: createButton({ variant: 'outline', label: 'Editar perfil' }),
                  title: 'Editar perfil',
                  description: 'Atualize suas informações pessoais.',
                  content: form,
                  footer,
                });
              },
            },
            {
              name: stripHtml(t('variants.compositions.mediaPreview.name')),
              description: stripHtml(t('variants.compositions.mediaPreview.description')),
              useWhen: stripHtml(t('variants.compositions.mediaPreview.use')),
              code: `const media = document.createElement('div');
media.className = 'nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground';
media.style.aspectRatio = '16/9';
media.style.display = 'grid';
media.style.placeItems = 'center';
media.textContent = 'Pré-visualização da mídia';

createDialog({
  trigger: createButton({ variant: 'outline', label: 'Pré-visualizar' }),
  title: 'Capa do post',
  description: 'Pré-visualização em tamanho real.',
  content: media,
  // sem footer — apenas "ver"
});`,
              previewFactory: () => {
                const media = document.createElement('div');
                media.className = 'nds-w-full nds-bg-muted nds-rounded-md nds-text-caption nds-text-muted-foreground';
media.style.aspectRatio = '16/9';
media.style.display = 'grid';
media.style.placeItems = 'center';
                media.textContent = 'Pré-visualização da mídia';

                return createDialog({
                  trigger: createButton({ variant: 'outline', label: 'Pré-visualizar' }),
                  title: 'Capa do post',
                  description: 'Pré-visualização em tamanho real.',
                  content: media,
                });
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: [
            { label: t('states.closed.label'),                trigger: stripHtml(t('states.closed.trigger')),                behavior: t('states.closed.behavior') },
            { label: t('states.opening.label'),               trigger: t('states.opening.trigger'),                          behavior: stripHtml(t('states.opening.behavior')) },
            { label: t('states.open.label'),                  trigger: stripHtml(t('states.open.trigger')),                  behavior: t('states.open.behavior') },
            { label: t('states.closing.label'),               trigger: t('states.closing.trigger'),                          behavior: stripHtml(t('states.closing.behavior')) },
            { label: t('states.withCloseButtonHidden.label'), trigger: stripHtml(t('states.withCloseButtonHidden.trigger')), behavior: t('states.withCloseButtonHidden.behavior') },
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createDialog(options)
export interface DialogOptions {
  trigger: HTMLElement;
  title: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  showCloseButton?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: 'escape' | 'overlay' | 'close-button' | 'action') => void;
  class?: string;
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
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger',         type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Sim', description: 'Elemento que abre o diálogo ao receber click.' },
                { name: 'title',           type: 'string',                                                               defaultValue: '—',     required: 'Sim', description: 'Texto do título — fonte do aria-labelledby.' },
                { name: 'description',     type: 'string',                                                               defaultValue: '—',     required: 'Não', description: 'Descrição — fonte do aria-describedby.' },
                { name: 'content',         type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Sim', description: 'Body do diálogo (formulário, mídia, mensagem).' },
                { name: 'footer',          type: 'HTMLElement',                                                          defaultValue: '—',     required: 'Não', description: 'Container das ações (cancel, action).' },
                { name: 'showCloseButton', type: 'boolean',                                                              defaultValue: 'true',  required: 'Não', description: t('props.table.showCloseButtonContent') },
                { name: 'onOpenChange',    type: '(open: boolean) => void',                                              defaultValue: '—',     required: 'Não', description: t('props.table.onOpenChange') },
                { name: 'onClose',         type: "(reason: 'escape' | 'overlay' | 'close-button' | 'action') => void",  defaultValue: '—',     required: 'Não', description: 'Callback com a razão do fechamento — útil para analytics.' },
                { name: 'class',           type: 'string',                                                               defaultValue: '—',     required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.contentTitle'),
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.footerTitle'),
              cols: propsCols,
              items: [
                { name: 'children', type: 'HTMLElement[]', defaultValue: '—', required: 'Sim', description: 'Botões de ação inseridos no footer (cancel + action).' },
              ],
            },
            {
              title: t('props.titleDescriptionTitle'),
              cols: propsCols,
              items: [
                { name: 'title',       type: 'string', defaultValue: '—', required: 'Sim', description: stripHtml(t('props.table.children')) },
                { name: 'description', type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(t('props.table.children')) },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityNotes: t('props.extensibility'),
        });
      }

      case 'tokens': {
        const customizationCode = `/* globals.css */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --foreground: 0 0% 3.9%;
  --muted: 0 0% 96%;
  --border: 0 0% 89.8%;
  --radius: 0.75rem;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--popover',            value: 'bg-popover',                                          description: t('tokens.table.popover') },
            { token: '--popover-foreground', value: 'text-popover-foreground',                             description: t('tokens.table.popoverForeground') },
            { token: '--foreground',         value: 'ring-foreground/10',                                  description: t('tokens.table.foreground') },
            { token: '--muted',              value: 'bg-muted/50',                                         description: t('tokens.table.muted') },
            { token: '--border',             value: 'border-t',                                            description: t('tokens.table.border') },
            { token: '--radius-xl',          value: 'sm:rounded-xl',                                       description: t('tokens.table.radius') },
            { token: 'z-50',                 value: 'z-50',                                                description: t('tokens.table.zIndex') },
            { token: 'duration-100',         value: 'data-[state=open]:animate-in (100ms)',                description: t('tokens.table.duration') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1,2,3,4,5,6].map(i => t(`accessibility.item${i}`)),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Escape',    description: t('keyboard.escape')   },
            { key: 'Tab',       description: t('keyboard.tab')      },
            { key: 'Shift+Tab', description: t('keyboard.shiftTab') },
            { key: 'Enter',     description: t('keyboard.enter')    },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'AlertDialog', description: stripHtml(t('related.alertDialog')), path: '?path=/docs/ui-alertdialog--docs' },
            { name: 'Sheet',       description: t('related.sheet'),                  path: '?path=/docs/ui-sheet--docs'       },
            { name: 'Popover',     description: t('related.popover'),                path: '?path=/docs/ui-popover--docs'     },
            { name: 'Form',        description: t('related.form'),                   path: '?path=/docs/ui-form--docs'        },
            { name: 'Drawer',      description: t('related.drawer'),                 path: '?path=/docs/ui-drawer--docs'      },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
            { title: '', content: t('notes.tip4') },
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
            { event: t('analytics.table.open'),          trigger: t('analytics.table.openTrigger'),          payload: t('analytics.table.openPayload') },
            { event: t('analytics.table.close'),         trigger: t('analytics.table.closeTrigger'),         payload: t('analytics.table.closePayload') },
            { event: t('analytics.table.action'),        trigger: t('analytics.table.actionTrigger'),        payload: t('analytics.table.actionPayload') },
            { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1,2,3,4,5,6,7].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1,2,3,4,5,6].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level: t(`testes.accessibility.item${i}.level`),
              how: t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
            items: [1,2,3,4,5].map(i => ({
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
        component_name: 'dialog',
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
