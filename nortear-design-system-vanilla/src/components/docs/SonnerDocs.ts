import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { toast, createSonnerToaster, CLOSE_LABEL } from '@/components/ui/sonner';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import sonnerTranslations from '@shared/content/sonner/translations.json';
import DOMPurify from 'dompurify';
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = createTranslation(uiTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (sonnerTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(sonnerTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high:   'common.high',
  medium: 'common.medium',
  low:    'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── Espécime estático da notificação ────────────────────────────────────────
//
// Os previews de Do/Don't e de Tipos mostram a notificação PARADA, e não um
// botão que a dispara: é uma foto do componente dentro do quadro da seção. Por
// isso o nó é construído aqui em vez de sair de `toast()` — a fila real é
// portalizada e posicionada na tela inteira, e não caberia num quadro.
//
// O markup é o MESMO que `toast-utils.ts` monta: `.nds-toast` e filhos. A versão
// anterior desenhava classes de uma era anterior à migração (`bg-green-50`,
// `text-green-800`) que não existem em CSS nenhum, então o espécime mostrava um
// retângulo branco — a documentação divergia do componente sem ninguém ver.

const TOAST_ICONS: Record<string, string> = {
  default: '',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

interface LocalToastOpts {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function buildLocalToast(type: string, message: string, opts: LocalToastOpts = {}): HTMLElement {
  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.className = 'nds-toast';
  toastEl.dataset.type = type;
  toastEl.dataset.richColors = 'true';
  // Espécime: já nasce assentado, sem a transição de entrada que a fila usa.
  toastEl.dataset.visible = 'true';
  // Sem `role="status"` nem `aria-live`: isto é uma ilustração dentro da página,
  // não uma notificação que acabou de acontecer. Anunciá-la faria o leitor de
  // tela ler quatro avisos ao abrir a documentação.

  const icon = TOAST_ICONS[type];
  if (icon) {
    const iconWrap = document.createElement('span');
    iconWrap.className = type === 'loading' ? 'nds-toast-icon nds-toast-icon-spin' : 'nds-toast-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = DOMPurify.sanitize(icon);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'nds-toast-content';

  const titleEl = document.createElement('p');
  titleEl.className = 'nds-toast-title';
  titleEl.textContent = message;
  contentEl.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('p');
    descEl.className = 'nds-toast-description';
    descEl.textContent = opts.description;
    contentEl.appendChild(descEl);
  }

  if (opts.actionLabel && opts.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-toast-action';
    actionBtn.textContent = opts.actionLabel;
    actionBtn.addEventListener('click', () => {
      track('toast_action_click', {
        label: opts.actionLabel!,
        component: 'toast',
        location: 'docs_demo',
      });
      opts.onAction!();
    });
    contentEl.appendChild(actionBtn);
  }

  toastEl.appendChild(contentEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('data-close-button', '');
  closeBtn.setAttribute('aria-label', CLOSE_LABEL);
  closeBtn.className = 'nds-toast-close';
  closeBtn.innerHTML = DOMPurify.sanitize('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>');
  closeBtn.addEventListener('click', () => toastEl.remove());
  toastEl.appendChild(closeBtn);

  return toastEl;
}

/**
 * Área de demonstração: botões de disparo mais a REGIÃO de verdade.
 *
 * `contain: layout` no invólucro é o que prende a região `position: fixed` ao
 * quadro da demonstração em vez de ao canto da janela — mesma solução das outras
 * stacks. E é a fila real que desenha: a demonstração precisa mostrar o
 * componente, inclusive o prazo correndo e a pausa no ponteiro.
 */
function createDemoToastArea(btnConfigs: Array<{ label: string; fn: () => void }>): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position: relative; contain: layout; min-height: 11.25rem; padding: var(--spacing-6);';

  const btnsRow = document.createElement('div');
  btnsRow.className = 'nds-cluster';
  btnsRow.dataset.spacing = 'md';
  btnsRow.style.flexWrap = 'wrap';

  for (const { label, fn } of btnConfigs) {
    btnsRow.appendChild(
      createButton({
        variant: 'outline',
        label,
        onClick: () => {
          track('toast_demo_triggered', { toast_type: label, locale: getLocale() });
          fn();
        },
      }),
    );
  }

  wrap.appendChild(btnsRow);
  wrap.appendChild(
    createSonnerToaster({ position: 'top-right', richColors: true, closeButton: true }),
  );
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
        const demoConfigs: Array<{ label: string; fn: () => void }> = [
          { label: t('demonstration.labels.triggerDefault'),         fn: () => toast(t('demonstration.labels.default')) },
          { label: t('demonstration.labels.triggerSuccess'),         fn: () => toast.success(t('demonstration.labels.success')) },
          { label: t('demonstration.labels.triggerError'),           fn: () => toast.error(t('demonstration.labels.error')) },
          { label: t('demonstration.labels.triggerWarning'),         fn: () => toast.warning(t('demonstration.labels.warning')) },
          { label: t('demonstration.labels.triggerInfo'),            fn: () => toast.info(t('demonstration.labels.info')) },
          { label: t('demonstration.labels.triggerLoading'),         fn: () => toast.loading(t('demonstration.labels.loading')) },
          { label: t('demonstration.labels.triggerWithDescription'), fn: () => toast.success(t('demonstration.labels.withDescription'), { description: t('demonstration.labels.withDescriptionDesc') }) },
          {
            label: t('demonstration.labels.triggerWithAction'),
            fn: () => toast(t('demonstration.labels.withAction'), {
              action: {
                label: t('demonstration.labels.withActionLabel'),
                onClick: () => track('toast_action_click', {
                  label: 'with-action-label',
                  component: 'toast',
                  location: 'docs_demo',
                }),
              },
            }),
          },
          {
            label: t('demonstration.labels.triggerPromise'),
            fn: () => toast.promise(
              new Promise<void>((resolve) => setTimeout(resolve, 2000)),
              {
                loading: t('demonstration.labels.promiseLoading'),
                success: t('demonstration.labels.promise'),
                error:   t('demonstration.labels.promiseError'),
              },
            ),
          },
          {
            label: t('demonstration.labels.triggerPersistent'),
            fn: () => toast.error(t('demonstration.labels.persistent'), { duration: Number.POSITIVE_INFINITY }),
          },
        ];

        return createDocsDemonstration({
          title: t('demonstration.title'),
          demoFactory: () => createDemoToastArea(demoConfigs),
        });
      }

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => DOMPurify.sanitize(t(`anatomy.item${i}`))),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => DOMPurify.sanitize(t(`usage.guidelines.item${i}`))),
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
            items: [1, 2, 3].map(i => DOMPurify.sanitize(t(`usage.dont.item${i}`))),
          },
        });

      case 'do-dont':
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel:    tNav('common.do'),
              dontLabel:  tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
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
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
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
        // A tabela escreve textNode, então tudo passa por `toPlainText`: com
        // `stripHtml` as entidades sobreviviam e a linha mostrava
        // "&lt;code&gt;duration: Infinity&lt;/code&gt;" na tela.
        //
        // A coluna do meio traz a CHAMADA que produz cada composição. Antes ela
        // repetia o rótulo da primeira coluna — duas colunas idênticas, e o
        // cabeçalho vinha de `common.state`/`common.trigger`, que não existem em
        // `ui.json`: a página imprimia o nome da chave como título de coluna.
        const compositionItems: Array<{ key: string; chamada: string }> = [
          { key: 'withDescription', chamada: `toast.success(msg, { description })` },
          { key: 'withAction',      chamada: `toast(msg, { action: { label, onClick } })` },
          { key: 'promise',         chamada: `toast.promise(p, { loading, success, error })` },
          { key: 'persistent',      chamada: `toast.error(msg, { duration: Infinity })` },
        ];

        return createDocsStates({
          title: t('states.title'),
          cols: {
            state:    t('states.cols.state'),
            trigger:  t('states.cols.trigger'),
            behavior: t('states.cols.behavior'),
          },
          items: compositionItems.map(({ key, chamada }) => ({
            label:    t(`states.items.${key}.label`),
            trigger:  chamada,
            behavior: toPlainText(t(`states.items.${key}.description`)),
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
                { name: 'position',     type: 'ToastPosition',  defaultValue: '"bottom-right"', required: 'Não', description: toPlainText(t('props.table.position'))     },
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
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
          title: t('accessibility.title'),
          summary: DOMPurify.sanitize(t('accessibility.summary')),
          items: [1, 2, 3, 4, 5].map(i => DOMPurify.sanitize(t(`accessibility.item${i}`))),
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
            { name: 'Alert',       description: toPlainText(t('related.alert')),       path: '?path=/docs/primitives-feedback-alert--docs'       },
            { name: 'AlertDialog', description: toPlainText(t('related.alertDialog')), path: '?path=/docs/primitives-overlay-alertdialog--docs' },
            { name: 'Badge',       description: toPlainText(t('related.badge')),       path: '?path=/docs/primitives-feedback-badge--docs'       },
            { name: 'Progress',    description: toPlainText(t('related.progress')),    path: '?path=/docs/primitives-feedback-progress--docs'    },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [1, 2, 3, 4, 5].map(i => ({
            title:   '',
            content: DOMPurify.sanitize(t(`notes.item${i}`)),
          })),
        });

      case 'analytics':
        return createDocsAnalytics({
          title: t('analytics.title'),
          cols: {
            event:   t('analytics.table.event'),
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.actionClick'),    trigger: toPlainText(t('analytics.table.actionClickTrigger')),    payload: t('analytics.table.actionClickPayload')    },
            { event: t('analytics.table.pageView'),       trigger: toPlainText(t('analytics.table.pageViewTrigger')),       payload: t('analytics.table.pageViewPayload')       },
            { event: t('analytics.table.sectionViewed'),  trigger: toPlainText(t('analytics.table.sectionViewedTrigger')),  payload: t('analytics.table.sectionViewedPayload')  },
            { event: t('analytics.table.langSwitch'),     trigger: toPlainText(t('analytics.table.langSwitchTrigger')),     payload: t('analytics.table.langSwitchPayload')     },
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
