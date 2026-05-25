import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { injectToastStyles } from '@/components/ui/sonner';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import sonnerTranslations from '@shared/content/sonner/translations.json';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { createActiveSectionObserver } from '@/lib/use-active-section';

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
const { t, subscribe } = createTranslation(sonnerTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Local toast renderer (scoped to a container — no document.body append) ──

const TOAST_ICONS: Record<string, string> = {
  default: '',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

const TOAST_RICH_COLORS: Record<string, string> = {
  default: 'bg-background text-foreground border-border',
  success: 'bg-green-50 text-green-800 border-green-200',
  error:   'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info:    'bg-blue-50 text-blue-800 border-blue-200',
  loading: 'bg-background text-foreground border-border',
};

interface LocalToastOpts {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  persistent?: boolean;
}

function buildLocalToast(type: string, message: string, opts: LocalToastOpts = {}): HTMLElement {
  const colorClass = TOAST_RICH_COLORS[type] ?? TOAST_RICH_COLORS.default;

  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.className = `nds-w-full nds-max-w-sm nds-rounded-lg nds-border-default nds-shadow-lg nds-cluster ${colorClass}`;
  toastEl.dataset.align = 'start';
  toastEl.dataset.spacing = 'sm';
  toastEl.style.pointerEvents = 'auto';
  toastEl.style.padding = 'var(--spacing-4)';

  const icon = TOAST_ICONS[type];
  if (icon) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-shrink-0';
    iconWrap.style.marginTop = 'var(--spacing-0-5)';
    iconWrap.innerHTML = sanitizeHtml(icon);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'nds-flex-1 nds-min-w-0';

  const titleEl = document.createElement('p');
  titleEl.className = 'nds-text-body nds-font-medium';
  titleEl.textContent = message;
  contentEl.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('p');
    descEl.className = 'nds-text-body nds-text-muted-foreground';
    descEl.style.marginTop = 'var(--spacing-1)';
    descEl.textContent = opts.description;
    contentEl.appendChild(descEl);
  }

  if (opts.actionLabel && opts.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-text-body nds-font-medium nds-text-primary nds-hover-underline';
    actionBtn.style.marginTop = 'var(--spacing-2)';
    actionBtn.textContent = opts.actionLabel;
    actionBtn.addEventListener('click', () => {
      track('toast_action_click', {
        label: opts.actionLabel!,
        component: 'toast',
        location: 'docs-sonner',
      });
      opts.onAction!();
      toastEl.style.opacity = '0';
      setTimeout(() => toastEl.remove(), 200);
    });
    contentEl.appendChild(actionBtn);
  }

  toastEl.appendChild(contentEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Fechar');
  closeBtn.className = 'nds-shrink-0 nds-text-muted-foreground nds-hover-text-foreground';
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  closeBtn.addEventListener('click', () => {
    toastEl.style.opacity = '0';
    setTimeout(() => toastEl.remove(), 200);
  });
  toastEl.appendChild(closeBtn);

  return toastEl;
}

function showLocalToast(
  container: HTMLElement,
  type: string,
  message: string,
  opts: LocalToastOpts & { duration?: number } = {},
): void {
  const duration = opts.persistent ? undefined : (opts.duration ?? (type === 'error' ? 8000 : 4000));
  const toastEl = buildLocalToast(type, message, opts);
  toastEl.style.opacity = '0';
  toastEl.style.transform = 'translateY(8px)';
  container.appendChild(toastEl);

  requestAnimationFrame(() => {
    toastEl.style.transition = 'opacity 200ms, transform 200ms';
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateY(0)';
  });

  if (duration !== undefined) {
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(8px)';
      setTimeout(() => toastEl.remove(), 200);
    }, duration);
  }
}

function createDemoToastArea(btnConfigs: Array<{ label: string; fn: (container: HTMLElement) => void }>): HTMLElement {
  injectToastStyles();

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position: relative; contain: layout; min-height: 180px; padding: 1.5rem;';

  const toastContainer = document.createElement('div');
  toastContainer.setAttribute('role', 'region');
  toastContainer.setAttribute('aria-label', 'Notifications');
  toastContainer.style.cssText = 'position: absolute; top: 4.5rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none; max-width: 420px; width: 100%;';

  const btnsRow = document.createElement('div');
  btnsRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem;';

  for (const { label, fn } of btnConfigs) {
    const btn = createButton({
      variant: 'outline',
      label,
      onClick: () => {
        track('toast_demo_triggered', { toast_type: label, locale: getLocale() });
        fn(toastContainer);
      },
    });
    btnsRow.appendChild(btn);
  }

  wrap.appendChild(btnsRow);
  wrap.appendChild(toastContainer);
  return wrap;
}

// ─── createSonnerDocs ─────────────────────────────────────────────────────────

export function createSonnerDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'sonner',
    });
    track('docs_page_view', {
      component_name: 'sonner',
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
      installNote: 'npx shadcn@latest add sonner',
    });
    headerSlot.replaceChildren(header);
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  function updateActiveNav(activeId: string) {
    pageLayout.setActiveSection(activeId);
  }

  // ── Section order ─────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {

      case 'demonstracao': {
        const demoConfigs: Array<{ label: string; fn: (c: HTMLElement) => void }> = [
          { label: t('demonstration.labels.triggerDefault'),         fn: (c) => showLocalToast(c, 'default',  t('demonstration.labels.default')) },
          { label: t('demonstration.labels.triggerSuccess'),         fn: (c) => showLocalToast(c, 'success',  t('demonstration.labels.success')) },
          { label: t('demonstration.labels.triggerError'),           fn: (c) => showLocalToast(c, 'error',    t('demonstration.labels.error')) },
          { label: t('demonstration.labels.triggerWarning'),         fn: (c) => showLocalToast(c, 'warning',  t('demonstration.labels.warning')) },
          { label: t('demonstration.labels.triggerInfo'),            fn: (c) => showLocalToast(c, 'info',     t('demonstration.labels.info')) },
          { label: t('demonstration.labels.triggerLoading'),         fn: (c) => showLocalToast(c, 'loading',  t('demonstration.labels.loading')) },
          { label: t('demonstration.labels.triggerWithDescription'), fn: (c) => showLocalToast(c, 'default',  t('demonstration.labels.withDescription'), { description: t('demonstration.labels.withDescriptionDesc') }) },
          { label: t('demonstration.labels.triggerWithAction'),      fn: (c) => showLocalToast(c, 'default',  t('demonstration.labels.withAction'), { actionLabel: t('demonstration.labels.withActionLabel'), onAction: () => {} }) },
          { label: t('demonstration.labels.triggerPersistent'),      fn: (c) => showLocalToast(c, 'error',    t('demonstration.labels.persistent'), { persistent: true }) },
        ];

        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => createDemoToastArea(demoConfigs),
        });
      }

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => sanitizeHtml(t(`anatomy.item${i}`))),
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
              scenario:    t('usage.scenarios.cols.scenario'),
              use:         t('usage.scenarios.cols.use'),
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
              rules:   t('usage.uxWriting.table.rules'),
              do:      t('usage.uxWriting.table.correct'),
              dont:    t('usage.uxWriting.table.avoid'),
            },
            items: ['title', 'description', 'action', 'error'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules:   t(`usage.uxWriting.table.${key}.format`),
              do:      t(`usage.uxWriting.table.${key}.good`),
              dont:    t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3].map(i => sanitizeHtml(t(`usage.dont.item${i}`))),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:    tNav('common.do'),
              dontLabel:  tNav('common.dont'),
              doCaption:  t('doDont.pair1.do'),
              dontCaption: t('doDont.pair1.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';
                wrap.appendChild(buildLocalToast('success', 'Alterações salvas.'));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';
                wrap.appendChild(buildLocalToast('error', 'Erro crítico. O sistema está fora do ar.'));
                return wrap;
              },
            },
            {
              doLabel:    tNav('common.do'),
              dontLabel:  tNav('common.dont'),
              doCaption:  t('doDont.pair2.do'),
              dontCaption: t('doDont.pair2.dont'),
              doPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';
                wrap.appendChild(buildLocalToast('loading', 'Enviando arquivo...'));
                return wrap;
              },
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem;';
                wrap.appendChild(buildLocalToast('error', 'Campo obrigatório não preenchido.'));
                return wrap;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          code: `import { toast, injectToastStyles, createSonnerToaster } from '@/components/ui/sonner';\n\n// Setup (uma vez no root da aplicação)\ninjectToastStyles();\ndocument.body.appendChild(\n  createSonnerToaster({ position: 'top-right', richColors: true })\n);\n\n// Disparar toasts\ntoast('Código copiado.');\ntoast.success('Alterações salvas.');\ntoast.error('Não foi possível salvar.');\ntoast.promise(asyncFn(), {\n  loading: 'Enviando arquivo...',\n  success: 'Arquivo enviado com sucesso.',\n  error: 'Erro ao enviar. Tente novamente.',\n});`,
        });

      case 'variantes': {
        const toastTypes: Array<{ type: string; nameKey: string; descKey: string }> = [
          { type: 'default', nameKey: 'default', descKey: 'variants.items.default' },
          { type: 'success', nameKey: 'success', descKey: 'variants.items.success' },
          { type: 'error',   nameKey: 'error',   descKey: 'variants.items.error'   },
          { type: 'warning', nameKey: 'warning', descKey: 'variants.items.warning' },
          { type: 'info',    nameKey: 'info',    descKey: 'variants.items.info'    },
        ];

        const codeMap: Record<string, string> = {
          default: `toast('Código copiado.');`,
          success: `toast.success('Alterações salvas.');`,
          error:   `toast.error('Não foi possível salvar. Tente novamente.');`,
          warning: `toast.warning('Sua sessão expira em 5 minutos.');`,
          info:    `toast.info('Nova versão disponível.');`,
        };

        const msgMap: Record<string, string> = {
          default: t('demonstration.labels.default'),
          success: t('demonstration.labels.success'),
          error:   t('demonstration.labels.error'),
          warning: t('demonstration.labels.warning'),
          info:    t('demonstration.labels.info'),
        };

        return createDocsVariants({
          title: t('variants.title'),
          items: toastTypes.map(({ type, descKey }) => ({
            name: type,
            description: stripHtml(t(descKey)),
            code: codeMap[type],
            previewFactory: () => buildLocalToast(type, msgMap[type]),
          })),
        });
      }

      case 'estados': {
        const compositionItems = [
          {
            label:       t('states.items.withDescription.label'),
            description: stripHtml(t('states.items.withDescription.description')),
            code:         `toast('Preferências atualizadas.', {\n  description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',\n});`,
            previewFactory: () => buildLocalToast('default', t('demonstration.labels.withDescription'), {
              description: t('demonstration.labels.withDescriptionDesc'),
            }),
          },
          {
            label:       t('states.items.withAction.label'),
            description: stripHtml(sanitizeHtml(t('states.items.withAction.description'))),
            code:         `toast('Item excluído.', {\n  action: { label: 'Desfazer', onClick: () => restoreItem() },\n});`,
            previewFactory: () => buildLocalToast('default', t('demonstration.labels.withAction'), {
              actionLabel: t('demonstration.labels.withActionLabel'),
              onAction: () => {},
            }),
          },
          {
            label:       t('states.items.promise.label'),
            description: stripHtml(t('states.items.promise.description')),
            code:         `toast.promise(uploadFile(), {\n  loading: 'Enviando arquivo...',\n  success: 'Arquivo enviado com sucesso.',\n  error: 'Erro ao enviar. Tente novamente.',\n});`,
            previewFactory: () => buildLocalToast('loading', t('demonstration.labels.promiseLoading')),
          },
          {
            label:       t('states.items.persistent.label'),
            description: stripHtml(sanitizeHtml(t('states.items.persistent.description'))),
            code:         `toast.error('Falha crítica no servidor.', {\n  duration: Infinity,\n  dismissible: true,\n});`,
            previewFactory: () => buildLocalToast('error', t('demonstration.labels.persistent')),
          },
        ];

        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    tNav('common.state') || 'Composição',
            trigger:  tNav('common.trigger') || 'Código',
            behavior: tNav('common.behavior') || 'Comportamento',
          },
          items: compositionItems.map(({ label, description }) => ({
            label,
            trigger: label,
            behavior: description,
          })),
        });
      }

      case 'propriedades': {
        const interfaceCode = `// createSonnerToaster(options)
export type SonnerToasterOptions = {
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  class?: string;
};

// toast API
toast(message, options?)
toast.success(message, options?)
toast.error(message, options?)
toast.warning(message, options?)
toast.info(message, options?)
toast.loading(message, options?)
toast.promise(promise, { loading, success, error }, options?)
toast.dismiss()

// ToastOptions
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  closeButton?: boolean;
  richColors?: boolean;
  position?: ToastPosition;
}`;

        const propsCols = {
          prop:        t('props.table.prop'),
          type:        t('props.table.type'),
          default:     t('props.table.default'),
          required:    t('props.table.required'),
          description: t('props.table.description'),
        };

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.toasterTitle'),
              cols: propsCols,
              items: [
                { name: 'position',     type: 'ToastPosition',  defaultValue: '"bottom-right"', required: 'Não', description: stripHtml(t('props.table.position'))     },
                { name: 'richColors',   type: 'boolean',         defaultValue: 'false',          required: 'Não', description: t('props.table.richColors')              },
                { name: 'expand',       type: 'boolean',         defaultValue: 'false',          required: 'Não', description: t('props.table.expand')                  },
                { name: 'duration',     type: 'number',          defaultValue: '4000',           required: 'Não', description: t('props.table.duration')                },
                { name: 'class',        type: 'string',          defaultValue: '—',             required: 'Não', description: 'CSS class adicional no container.'       },
              ],
            },
            {
              title: 'ToastOptions',
              cols: propsCols,
              items: [
                { name: 'description', type: 'string',                            defaultValue: '—',        required: 'Não', description: 'Texto complementar ao título.'         },
                { name: 'duration',    type: 'number',                            defaultValue: '4000',     required: 'Não', description: 'Duração em ms. Use Infinity para persistente.' },
                { name: 'action',      type: '{ label: string; onClick: fn }',    defaultValue: '—',        required: 'Não', description: 'Botão de ação inline no toast.'         },
                { name: 'closeButton', type: 'boolean',                           defaultValue: 'false',    required: 'Não', description: 'Exibe botão de fechar.'                },
                { name: 'richColors',  type: 'boolean',                           defaultValue: 'false',    required: 'Não', description: 'Cores semânticas por tipo.'             },
                { name: 'position',    type: 'ToastPosition',                     defaultValue: '"bottom-right"', required: 'Não', description: 'Posição individual do toast.'    },
              ],
            },
          ],
          interfaceCode,
        });
      }

      case 'tokens': {
        const customizationCode = `:root {
  /* Sonner usa as mesmas vars do tema */
  --normal-bg:     var(--popover);
  --normal-text:   var(--popover-foreground);
  --normal-border: var(--border);
  --border-radius: var(--radius);
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token:       t('tokens.table.token'),
            value:       t('tokens.table.value'),
            description: t('tokens.table.description'),
          },
          items: [
            { token: '--normal-bg',     value: 'var(--popover)',            description: t('tokens.table.normalBg')     },
            { token: '--normal-text',   value: 'var(--popover-foreground)', description: t('tokens.table.normalText')   },
            { token: '--normal-border', value: 'var(--border)',             description: t('tokens.table.normalBorder') },
            { token: '--border-radius', value: 'var(--radius)',             description: t('tokens.table.borderRadius') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode,
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: sanitizeHtml(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5].map(i => sanitizeHtml(t(`accessibility.item${i}`))),
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',    description: t('accessibility.keyboard.tab')         },
            { key: 'Enter',  description: t('accessibility.keyboard.enter')       },
            { key: 'Escape', description: t('accessibility.keyboard.escape')      },
            { key: '—',      description: t('accessibility.keyboard.noKeyboard')  },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Alert',       description: t('related.alert'),       path: '?path=/docs/ui-alert--docs'       },
            { name: 'AlertDialog', description: t('related.alertDialog'), path: '?path=/docs/ui-alertdialog--docs' },
            { name: 'Badge',       description: t('related.badge'),       path: '?path=/docs/ui-badge--docs'       },
            { name: 'Progress',    description: t('related.progress'),    path: '?path=/docs/ui-progress--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({
            title:   '',
            content: sanitizeHtml(t(`notes.item${i}`)),
          })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: t('analytics.table.trigger'),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.actionClick'),    trigger: t('analytics.table.actionClickTrigger'),    payload: t('analytics.table.actionClickPayload')    },
            { event: t('analytics.table.pageView'),       trigger: t('analytics.table.pageViewTrigger'),       payload: t('analytics.table.pageViewPayload')       },
            { event: t('analytics.table.sectionViewed'),  trigger: t('analytics.table.sectionViewedTrigger'),  payload: t('analytics.table.sectionViewedPayload')  },
            { event: t('analytics.table.langSwitch'),     trigger: t('analytics.table.langSwitchTrigger'),     payload: t('analytics.table.langSwitchPayload')     },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            cols: {
              action:   tNav('common.userAction'),
              result:   tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
              action:   t(`testes.functional.item${i}.action`),
              result:   t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: {
              criterion: tNav('common.criterion'),
              level:     'WCAG',
              how:       tNav('common.howToVerify'),
            },
            items: [1, 2, 3, 4].map(i => ({
              criterion: t(`testes.accessibility.item${i}.criterion`),
              level:     t(`testes.accessibility.item${i}.level`),
              how:       t(`testes.accessibility.item${i}.how`),
            })),
          },
          visual: {
            title: t('testes.visual.title'),
            cols: {
              story:    tNav('common.storyState'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              story:    t(`testes.visual.item${i}.story`),
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
      if (existing && existing.parentNode) {
        existing.replaceWith(fresh);
      } else {
        main.appendChild(fresh);
      }
      sectionEls[id] = fresh;
    }
    attachObserver();
  }

  // ── IntersectionObserver ──────────────────────────────────────────────────

  let activeSectionObserver: { disconnect: () => void } | null = null;

  function attachObserver() {
    activeSectionObserver?.disconnect();
    activeSectionObserver = createActiveSectionObserver(
      sectionOrder as unknown as string[],
      (id) => sectionEls[id as keyof typeof sectionEls] ?? null,
      (id) => updateActiveNav(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'sonner',
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
