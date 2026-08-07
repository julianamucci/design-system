import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createAlertDialog } from '@/components/ui/alert-dialog';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

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
    (alertDialogTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(alertDialogTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

type AlertDialogDemoOptions = {
  triggerLabel: string;
  triggerVariant?: 'default' | 'destructive' | 'outline';
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  tone?: 'destructive' | 'default';
};

function buildAlertDialogDemo(opts: AlertDialogDemoOptions): HTMLElement {
  // Rótulo estável: o texto do botão é traduzido e quebraria a agregação no
  // GA4 (um rótulo por idioma para o mesmo demo).
  const label = opts.tone === 'destructive' ? 'destructive' : 'neutral';
  const trigger = createButton({
    variant: opts.triggerVariant ?? 'destructive',
    label: opts.triggerLabel,
  });
  const cancelButton = createButton({
    variant: 'outline',
    label: opts.cancelLabel,
  });
  // Variante do Button — a mesma que as stories montam. `nds-bg-destructive`
  // solto pintava só o fundo e deixava o texto no foreground default.
  const actionButton = createButton({
    variant: opts.tone === 'destructive' ? 'destructive' : 'default',
    label: opts.actionLabel,
  });
  cancelButton.addEventListener('click', () => {
    track('dialog_close', {
      component: 'alert_dialog',
      label,
      reason: 'close-button',
      location: 'docs_demo',
    });
  });
  actionButton.addEventListener('click', () => {
    track('dialog_confirm', {
      component: 'alert_dialog',
      label,
      location: 'docs_demo',
    });
    // A ação primária também fecha o diálogo — confirm + close (reason
    // 'action'), na mesma ordem das demais stacks.
    track('dialog_close', {
      component: 'alert_dialog',
      label,
      reason: 'action',
      location: 'docs_demo',
    });
  });
  return createAlertDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    cancelButton,
    actionButton,
    onOpenChange: (open) => {
      if (open) {
        track('dialog_open', {
          component: 'alert_dialog',
          label,
          location: 'docs_demo',
        });
      }
    },
  });
}

// ─── createAlertDialogDocs ────────────────────────────────────────────────────

export function createAlertDialogDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'alert-dialog',
    });
    track('docs_page_view', {
      component_name: 'alert-dialog',
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
            wrap.className = 'nds-cluster';
            wrap.dataset.spacing = 'md';
            wrap.dataset.justify = 'center';
            wrap.append(
              buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                triggerVariant: 'destructive',
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                tone: 'destructive',
              }),
              buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.neutralTriggerLabel'),
                triggerVariant: 'outline',
                title: t('demonstration.labels.neutralTitle'),
                description: t('demonstration.labels.neutralDescription'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.neutralAction'),
                tone: 'default',
              }),
            );
            return wrap;
          },
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [
            t('anatomy.item1'),
            t('anatomy.item2'),
            t('anatomy.item3'),
            t('anatomy.item4'),
            t('anatomy.item5'),
            t('anatomy.item6'),
            t('anatomy.item7'),
            t('anatomy.item8'),
            t('anatomy.item9'),
            t('anatomy.item10'),
          ],
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
              t('usage.guidelines.item5'),
            ],
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
            items: ['title', 'description', 'action', 'cancel'].map(key => ({
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
              stripHtml(t('usage.dont.item1')),
              stripHtml(t('usage.dont.item2')),
              stripHtml(t('usage.dont.item3')),
              t('usage.dont.item4'),
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
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                triggerVariant: 'destructive',
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                tone: 'destructive',
              }),
              dontPreviewFactory: () => buildAlertDialogDemo({
                triggerLabel: 'Excluir',
                triggerVariant: 'destructive',
                title: 'Tem certeza?',
                description: 'Essa ação irá excluir os dados.',
                cancelLabel: 'Não',
                actionLabel: 'Sim',
                tone: 'default',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                triggerVariant: 'destructive',
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                tone: 'destructive',
              }),
              dontPreviewFactory: () => buildAlertDialogDemo({
                triggerLabel: 'Excluir conta',
                triggerVariant: 'destructive',
                title: 'Excluir conta',
                description: 'Todos os seus dados serão removidos permanentemente.',
                cancelLabel: 'Cancelar',
                actionLabel: 'Excluir',
                tone: 'default',
              }),
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createAlertDialog } from '@/components/ui/alert-dialog';
import { createButton } from '@/components/ui/button';`,
          secondaryDescription: t('import.withTrigger'),
          secondaryCode: `const trigger = createButton({ variant: 'destructive', label: 'Excluir conta' });
const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
const actionButton = createButton({ variant: 'destructive', label: 'Excluir' });

const dialog = createAlertDialog({
  trigger,
  title: 'Excluir conta',
  description: 'Todos os seus dados serão removidos permanentemente.',
  cancelButton,
  actionButton,
});`,
        });

      case 'variantes': {
        const codeDestructive = `const trigger = createButton({ variant: 'destructive', label: 'Excluir conta' });
const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
const actionButton = createButton({ variant: 'destructive', label: 'Excluir' });

createAlertDialog({ trigger, title: 'Excluir conta', description: '...', cancelButton, actionButton });`;

        const codeDefault = `const trigger = createButton({ variant: 'outline', label: 'Sair da conta' });
const cancelButton = createButton({ variant: 'outline', label: 'Cancelar' });
const actionButton = createButton({ variant: 'default', label: 'Sair' });

createAlertDialog({ trigger, title: 'Sair da conta', description: '...', cancelButton, actionButton });`;

        return createDocsVariants({
          title: t('variants.title'),
          note: stripHtml(t('variants.note')),
          items: [
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.triggerLabel'),
                triggerVariant: 'destructive',
                title: t('demonstration.labels.title'),
                description: t('demonstration.labels.description'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.action'),
                tone: 'destructive',
              }),
            },
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildAlertDialogDemo({
                triggerLabel: t('demonstration.labels.neutralTriggerLabel'),
                triggerVariant: 'outline',
                title: t('demonstration.labels.neutralTitle'),
                description: t('demonstration.labels.neutralDescription'),
                cancelLabel: t('demonstration.labels.cancel'),
                actionLabel: t('demonstration.labels.neutralAction'),
                tone: 'default',
              }),
            },
          ],
        });
      }

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.closed.label'),     trigger: toPlainText(t('states.closed.trigger')),                   behavior: toPlainText(t('states.closed.behavior'))},
            { label: t('states.open.label'),       trigger: toPlainText(t('states.open.trigger')),          behavior: toPlainText(t('states.open.behavior'))},
            { label: t('states.confirmed.label'),  trigger: toPlainText(t('states.confirmed.trigger')),     behavior: toPlainText(t('states.confirmed.behavior')) },
            { label: t('states.cancelled.label'),  trigger: toPlainText(t('states.cancelled.trigger')),     behavior: toPlainText(t('states.cancelled.behavior'))},
            { label: t('states.controlled.label'), trigger: toPlainText(t('states.controlled.trigger')),    behavior: toPlainText(t('states.controlled.behavior'))},
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createAlertDialog(options)
export interface AlertDialogOptions {
  trigger: HTMLElement;
  title: string;
  description?: string;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  onOpenChange?: (open: boolean) => void;
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
                { name: 'trigger',       type: 'HTMLElement',              defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.children')) },
                { name: 'title',         type: 'string',                   defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.children')) },
                { name: 'description',   type: 'string',                   defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.children')) },
                { name: 'media',         type: 'HTMLElement',              defaultValue: '—', required: 'Não', description: toPlainText(t('anatomy.item10')) },
                { name: 'cancelButton',  type: 'HTMLElement',              defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.children')) },
                { name: 'actionButton',  type: 'HTMLElement',              defaultValue: '—', required: 'Sim', description: toPlainText(t('props.table.children')) },
                { name: 'defaultOpen',   type: 'boolean',                  defaultValue: 'false', required: 'Não', description: t('props.table.defaultOpen') },
                { name: 'onOpenChange',  type: '(open: boolean) => void',  defaultValue: '—', required: 'Não', description: t('props.table.onOpenChange') },
                { name: 'class',         type: 'string',                   defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.triggerTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: "'default' | 'destructive' | 'outline' | …", defaultValue: "'default'", required: 'Não', description: 'Variante visual do Button usado como trigger.' },
                { name: 'label',     type: 'string',                                     defaultValue: '—',         required: 'Sim', description: 'Texto do botão que abre o diálogo.' },
                { name: 'class',     type: 'string',                                     defaultValue: '—',         required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.contentTitle'),
              cols: propsCols,
              items: [
                { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.actionTitle'),
              cols: propsCols,
              items: [
                { name: 'onClick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: t('props.table.onClick') },
                { name: 'label',    type: 'string',                  defaultValue: '—', required: 'Sim', description: 'Texto da ação primária.' },
                { name: 'class',    type: 'string',                  defaultValue: '—', required: 'Não', description: t('props.table.className') },
              ],
            },
            {
              title: t('props.cancelTitle'),
              cols: propsCols,
              items: [
                { name: 'onClick',  type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: t('props.table.onClick') },
                { name: 'label',    type: 'string',                  defaultValue: '—', required: 'Sim', description: 'Texto da ação de cancelar.' },
                { name: 'class',    type: 'string',                  defaultValue: '—', required: 'Não', description: t('props.table.className') },
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
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --muted-foreground: 0 0% 45.1%;
  --radius: 0.5rem;
}`;

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            // O overlay é a única parte sem token: o CSS escreve hsl(0 0% 0% / 0.8) literal.
            { token: '—',                        value: '.nds-alert-dialog-overlay',     description: t('tokens.table.overlayBg') },
            { token: '--background',             value: '.nds-alert-dialog-content',     description: t('tokens.table.contentBg') },
            { token: '--foreground',             value: '.nds-alert-dialog-content',     description: t('tokens.table.contentForeground') },
            { token: '--border',                 value: '.nds-alert-dialog-content',     description: t('tokens.table.border') },
            { token: '--radius-card',            value: '.nds-alert-dialog-content',     description: t('tokens.table.radius') },
            { token: '--elevation-lg',           value: '.nds-alert-dialog-content',     description: t('tokens.table.elevation') },
            { token: '--spacing-6',              value: '.nds-alert-dialog-content',     description: t('tokens.table.padding') },
            { token: '--muted-foreground',       value: '.nds-alert-dialog-description', description: t('tokens.table.mutedForeground') },
            { token: '--muted',                  value: '.nds-alert-dialog-media',       description: t('tokens.table.mediaBg') },
            // A ação herda o tom do Button: o destrutivo vem da variante, não deste CSS.
            { token: '--destructive',            value: '.nds-button-destructive',       description: t('tokens.table.destructive') },
            { token: '--destructive-foreground', value: '.nds-button-destructive',       description: t('tokens.table.destructiveForeground') },
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
          summary: t('accessibility.summary'),
          items: [
            t('accessibility.item1'),
            t('accessibility.item2'),
            t('accessibility.item3'),
            t('accessibility.item4'),
            t('accessibility.item5'),
            t('accessibility.item6'),
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',       description: t('accessibility.keyboard.tab') },
            { key: 'Shift+Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Enter',     description: t('accessibility.keyboard.enter') },
            { key: 'Space',     description: t('accessibility.keyboard.space') },
            { key: 'Escape',    description: t('accessibility.keyboard.escape') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Dialog', description: toPlainText(t('related.dialog')), path: '?path=/docs/ui-dialog--docs' },
            { name: 'Sonner', description: toPlainText(t('related.sonner')), path: '?path=/docs/ui-sonner--docs' },
            { name: 'Alert',  description: toPlainText(t('related.alert')),  path: '?path=/docs/ui-alert--docs'  },
            { name: 'Button', description: toPlainText(t('related.button')), path: '?path=/docs/ui-button--docs' },
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
            trigger: toPlainText(t('analytics.table.trigger')),
            payload: t('analytics.table.payload'),
          },
          items: [
            { event: t('analytics.table.open'),          trigger: toPlainText(t('analytics.table.openTrigger')),          payload: t('analytics.table.openPayload') },
            { event: t('analytics.table.confirm'),       trigger: toPlainText(t('analytics.table.confirmTrigger')),       payload: t('analytics.table.confirmPayload') },
            { event: t('analytics.table.close'),         trigger: toPlainText(t('analytics.table.closeTrigger')),         payload: t('analytics.table.closePayload') },
            { event: t('analytics.table.pageView'),      trigger: toPlainText(t('analytics.table.pageViewTrigger')),      payload: t('analytics.table.pageViewPayload') },
            { event: t('analytics.table.sectionViewed'), trigger: toPlainText(t('analytics.table.sectionViewedTrigger')), payload: t('analytics.table.sectionViewedPayload') },
            { event: t('analytics.table.langSwitch'),    trigger: toPlainText(t('analytics.table.langSwitchTrigger')),    payload: t('analytics.table.langSwitchPayload') },
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
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
              action: t(`testes.functional.item${i}.action`),
              result: t(`testes.functional.item${i}.result`),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [1, 2, 3, 4, 5, 6, 7].map(i => ({
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
            items: [1, 2, 3, 4, 5, 6].map(i => ({
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
        component_name: 'alert-dialog',
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
