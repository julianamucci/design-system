import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription, createAlertAction, type AlertIconType, type AlertVariant } from '@/components/ui/alert';
import { createButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

import {
  createDocsHeader,
  createDocsDemonstration,
  createDocsAnatomy,
  createDocsWhenToUse,
  createDocsDoDont,
  createDocsImport,
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

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (alertTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  );
}
const { t, subscribe } = createTranslation(alertTranslations as Record<string, unknown>);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

interface BuildAlertOptions {
  /** Classes extras aplicadas junto de `className`. */
  extraClass?: string;
  /** Renderiza o botão X de fechar no canto superior direito. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Chave i18n do rótulo da ação — renderiza um botão dentro da descrição. */
  actionKey?: string;
  onAction?: () => void;
}

function buildAlert(
  variant: AlertVariant,
  className: string,
  icon: AlertIconType | null,
  titleKey: string | null,
  descKey: string,
  options: BuildAlertOptions = {},
): HTMLElement {
  const { extraClass = '', dismissible = false, onDismiss, actionKey, onAction } = options;

  const el = createAlert({
    variant,
    className: [className, extraClass].filter(Boolean).join(' '),
    dismissible,
    onDismiss,
  });
  if (icon) el.appendChild(createAlertIcon(icon));
  // as: 'h3' — as seções da docs page são h2; h3 preserva a hierarquia (axe heading-order).
  if (titleKey) el.appendChild(createAlertTitle({ text: stripHtml(t(titleKey)), as: 'h3' }));

  if (actionKey) {
    // Slot AlertAction — NÃO botão inline dentro da descrição. `.nds-alert-action`
    // é `position: absolute` no canto superior direito (alert.css), que é o
    // "alinhado à direita" que o conteúdo descreve. Empilhar o botão dentro da
    // descrição o joga para a linha de baixo, à esquerda: foi assim que a docs
    // page divergiu da story ComAcao, que sempre usou o slot.
    el.appendChild(createAlertDescription({ text: stripHtml(t(descKey)) }));
    const action = createAlertAction();
    action.appendChild(createButton({
      size: 'sm',
      variant: 'default',
      label: stripHtml(t(actionKey)),
      onClick: onAction,
    }));
    el.appendChild(action);
  } else {
    el.appendChild(createAlertDescription({ text: stripHtml(t(descKey)) }));
  }

  return el;
}

// ─── createAlertDocs ──────────────────────────────────────────────────────────

export function createAlertDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'alert',
    });
    track('docs_page_view', { component_name: 'alert', locale, page_title: `${t('title')} · Design System` });
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
      { id: 'variantes',    labelKey: 'nav.variants'     },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'       },
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
          title: t('demonstration.title'),
          demoFactory: () => {
            const wrap = document.createElement('div');
            wrap.className = 'nds-w-full nds-stack';
            wrap.dataset.spacing = 'sm';
            // Cada alert da demo mostra uma capacidade diferente do componente:
            // default sem título · destructive com título · success dismissível ·
            // warning com ação inline.
            wrap.append(
              buildAlert('default', '', 'info', null, 'demonstration.labels.infoDesc'),
              buildAlert('destructive', '', 'error', 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc'),
              buildAlert('success', '', 'success', 'demonstration.labels.successTitle', 'demonstration.labels.successDesc', {
                dismissible: true,
                onDismiss: () => track('alert_dismiss', {
                  component: 'alert',
                  label: 'demonstration',
                  location: 'docs_demo',
                }),
              }),
              buildAlert('warning', '', 'warning', 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc', {
                actionKey: 'demonstration.labels.warningAction',
              }),
            );
            return wrap;
          },
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
            items: ['title', 'description', 'error', 'warning'].map(key => ({
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
        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => {
                const el = createAlert({ variant: 'default' });
                el.appendChild(createAlertIcon('info'));
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar', as: 'h3' }));
                el.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão.' }));
                return el;
              },
              dontPreviewFactory: () => {
                const el = createAlert({ variant: 'default' });
                el.appendChild(createAlertDescription({ text: 'Salvo!' }));
                return el;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => {
                const el = createAlert({ variant: 'destructive' });
                el.appendChild(createAlertIcon('error'));
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar', as: 'h3' }));
                el.appendChild(createAlertDescription({ text: 'Verifique sua conexão.' }));
                return el;
              },
              dontPreviewFactory: () => {
                const el = createAlert({ variant: 'destructive' });
                el.appendChild(createAlertTitle({ text: 'Erro ao salvar', as: 'h3' }));
                el.appendChild(createAlertDescription({ text: 'Verifique sua conexão.' }));
                return el;
              },
            },
          ],
        });

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: t('import.basic'),
          code: `import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from '@/components/ui/alert';`,
          secondaryDescription: t('import.withIcon'),
          secondaryCode: `import { createAlertIcon } from '@/components/ui/alert';\n// createAlertIcon('info' | 'error' | 'success' | 'warning')`,
        });

      case 'variantes': {
        const codeDefault = `const alert = createAlert({ variant: 'default' });\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertTitle({ text: 'Atenção' }));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;
        const codeDestructive = `const alert = createAlert({ variant: 'destructive' });\nalert.appendChild(createAlertIcon('error'));\nalert.appendChild(createAlertTitle({ text: 'Erro ao salvar' }));\nalert.appendChild(createAlertDescription({ text: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }));`;
        const codeSuccess = `const alert = createAlert({ variant: 'success' });\nalert.appendChild(createAlertIcon('success'));\nalert.appendChild(createAlertTitle({ text: 'Perfil atualizado' }));\nalert.appendChild(createAlertDescription({ text: 'Suas informações foram salvas com sucesso.' }));`;
        const codeWarning = `const alert = createAlert({ variant: 'warning' });\nalert.appendChild(createAlertIcon('warning'));\nalert.appendChild(createAlertTitle({ text: 'Assinatura expirando' }));\nalert.appendChild(createAlertDescription({ text: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.' }));`;
        const codeInfo = `const alert = createAlert({ variant: 'info' });\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertTitle({ text: 'Atenção' }));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;
        const codeWithoutTitle = `const alert = createAlert({ variant: 'default' });\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;
        const codeDismissible = `const alert = createAlert({\n  variant: 'default',\n  dismissible: true,\n  dismissLabel: 'Fechar alerta',\n  onDismiss: () => console.log('fechado'),\n});\nalert.appendChild(createAlertIcon('info'));\nalert.appendChild(createAlertTitle({ text: 'Atenção' }));\nalert.appendChild(createAlertDescription({ text: 'Suas alterações serão aplicadas na próxima sessão.' }));`;
        return createDocsCompositions({
          id: 'variantes',
          title: t('variants.title'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'alert',
          items: [
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildAlert('default', 'nds-w-full', 'info', 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc'),
            },
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => buildAlert('destructive', 'nds-w-full', 'error', 'demonstration.labels.errorTitle', 'demonstration.labels.errorDesc'),
            },
            {
              name: 'success',
              description: stripHtml(t('variants.items.success')),
              code: codeSuccess,
              previewFactory: () => buildAlert('success', 'nds-w-full', 'success', 'demonstration.labels.successTitle', 'demonstration.labels.successDesc'),
            },
            {
              name: 'warning',
              description: stripHtml(t('variants.items.warning')),
              code: codeWarning,
              previewFactory: () => buildAlert('warning', 'nds-w-full', 'warning', 'demonstration.labels.warningTitle', 'demonstration.labels.warningDesc'),
            },
            {
              name: 'info',
              description: stripHtml(t('variants.items.info')),
              code: codeInfo,
              previewFactory: () => buildAlert('info', 'nds-w-full', 'info', 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc'),
            },
            {
              name: stripHtml(t('variants.items.dismissible.name')),
              description: stripHtml(t('variants.items.dismissible.description')),
              useWhen: stripHtml(t('variants.items.dismissible.use')),
              trackId: 'dismissible',
              code: codeDismissible,
              // Primeira emissão real do alert_dismiss: o primitivo não importa
              // analytics — o evento é fiado aqui, no consumidor, via callback.
              previewFactory: () => {
                const el = createAlert({
                  variant: 'default',
                  className: 'nds-w-full',
                  dismissible: true,
                  onDismiss: () => track('alert_dismiss', {
                    component: 'alert',
                    label: 'dismissible',
                    location: 'docs_demo',
                  }),
                });
                el.appendChild(createAlertIcon('info'));
                el.appendChild(createAlertTitle({ text: stripHtml(t('demonstration.labels.infoTitle')), as: 'h3' }));
                el.appendChild(createAlertDescription({ text: stripHtml(t('demonstration.labels.infoDesc')) }));
                return el;
              },
            },
            {
              name: t('states.withoutTitle.label'),
              description: t('states.withoutTitle.behavior'),
              code: codeWithoutTitle,
              previewFactory: () => buildAlert('default', 'nds-w-full', 'info', null, 'demonstration.labels.infoDesc'),
            },
          ],
        });
      }

      case 'composicoes':
        return createDocsCompositions({
          title: t('variants.compositionsTitle'),
          useWhenLabel: tNav('common.useWhen'),
          componentSlug: 'alert',
          items: [
            {
              name: t('variants.compositions.withIcon.name'),
              description: t('variants.compositions.withIcon.description'),
              useWhen: t('variants.compositions.withIcon.use'),
              code:
                `const alert = createAlert();\n` +
                `alert.appendChild(createAlertIcon('info'));\n` +
                `alert.appendChild(createAlertTitle({ text: 'Informação' }));\n` +
                `alert.appendChild(createAlertDescription({ text: 'Ícone SVG posicionado automaticamente.' }));`,
              previewFactory: () => buildAlert('default', 'nds-w-full', 'info', 'demonstration.labels.infoTitle', 'demonstration.labels.infoDesc'),
            },
            {
              name: t('variants.compositions.withAction.name'),
              description: t('variants.compositions.withAction.description'),
              useWhen: t('variants.compositions.withAction.use'),
              // Slot AlertAction, igual à story ComAcao. O markup anterior
              // empilhava o botão dentro da descrição e ele caía na linha de
              // baixo — divergia da story e do "alinhado à direita" do texto.
              code:
                `const alert = createAlert();\n` +
                `alert.appendChild(createAlertIcon('info'));\n` +
                `alert.appendChild(createAlertTitle({ text: 'Sessão expira em 5 minutos' }));\n` +
                `alert.appendChild(createAlertDescription({ text: 'Salve seu trabalho para não perder as alterações.' }));\n` +
                `\n` +
                `const action = createAlertAction();\n` +
                `action.appendChild(createButton({ size: 'sm', variant: 'default', label: 'Salvar agora' }));\n` +
                `alert.appendChild(action);`,
              previewFactory: () => {
                const el = createAlert({ className: 'nds-w-full' });
                el.appendChild(createAlertIcon('info'));
                el.appendChild(createAlertTitle({ text: 'Sessão expira em 5 minutos', as: 'h3' }));
                el.appendChild(createAlertDescription({ text: 'Salve seu trabalho para não perder as alterações.' }));
                const action = createAlertAction();
                action.appendChild(createButton({ size: 'sm', variant: 'default', label: 'Salvar agora' }));
                el.appendChild(action);
                return el;
              },
            },
          ],
        });

      case 'estados':
        return createDocsStates({
          title: t('states.title'),
          cols: {
            state: t('states.cols.state'),
            trigger: toPlainText(t('states.cols.trigger')),
            behavior: toPlainText(t('states.cols.behavior')),
          },
          items: [
            { label: t('states.complete.label'),      trigger: toPlainText(t('states.complete.trigger')),      behavior: toPlainText(t('states.complete.behavior'))},
            { label: t('states.withoutTitle.label'),  trigger: toPlainText(t('states.withoutTitle.trigger')),  behavior: toPlainText(t('states.withoutTitle.behavior'))},
            { label: t('states.withoutIcon.label'),   trigger: toPlainText(t('states.withoutIcon.trigger')),              behavior: toPlainText(t('states.withoutIcon.behavior'))},
            { label: t('states.dynamicInsert.label'), trigger: toPlainText(t('states.dynamicInsert.trigger')),            behavior: toPlainText(t('states.dynamicInsert.behavior')) },
            { label: t('states.dismissed.label'),     trigger: toPlainText(t('states.dismissed.trigger')),     behavior: toPlainText(t('states.dismissed.behavior'))},
          ],
        });

      case 'propriedades': {
        const interfaceCode = `// createAlert(options)
export interface AlertOptions {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role?: 'alert' | 'status' | 'note';  // semântica de anúncio — default 'alert'
  className?: string;
  dismissible?: boolean;        // botão X no canto superior direito
  onDismiss?: () => void;       // dispara uma vez, ao acionar o X
  dismissLabel?: string;        // aria-label do X — default 'Fechar alerta'
}

// createAlertTitle(options), createAlertDescription(options)
export interface AlertTitleOptions {
  text?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';  // nível do heading — default 'h5'
  className?: string;
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
              title: t('props.alertTitle'),
              cols: propsCols,
              items: [
                { name: 'variant',   type: '"default" | "destructive" | "success" | "warning" | "info"', defaultValue: '"default"', required: 'Não', description: toPlainText(t('props.table.variant')) },
                { name: 'role',      type: '"alert" | "status" | "note"', defaultValue: '"alert"', required: 'Não', description: toPlainText(t('props.table.role')) },
                { name: 'className', type: 'string',                    defaultValue: '—',         required: 'Não', description: toPlainText(t('props.table.className')) },
                { name: 'dismissible',  type: 'boolean',    defaultValue: 'false',            required: 'Não', description: toPlainText(t('props.table.dismissible')) },
                { name: 'onDismiss',    type: '() => void', defaultValue: '—',                required: 'Não', description: toPlainText(t('props.table.onDismiss')) },
                { name: 'dismissLabel', type: 'string',     defaultValue: "'Fechar alerta'",  required: 'Não', description: toPlainText(t('props.table.dismissLabel')) },
              ],
            },
            {
              title: t('props.alertTitleTitle'),
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'as',        type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'", defaultValue: "'h5'", required: 'Não', description: toPlainText(t('props.table.titleAs')) },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) },
              ],
            },
            {
              title: t('props.alertDescTitle'),
              cols: propsCols,
              items: [
                { name: 'text',      type: 'string', defaultValue: '—', required: 'Não', description: t('props.table.children') },
                { name: 'className', type: 'string', defaultValue: '—', required: 'Não', description: toPlainText(t('props.table.className')) },
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
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: [
            { token: '--muted',        value: 'hsl(var(--muted))',             description: t('tokens.table.background') },
            { token: '--foreground',   value: 'hsl(var(--foreground))',        description: t('tokens.table.foreground') },
            { token: '--border',       value: 'hsl(var(--border))',            description: t('tokens.table.border') },
            { token: '--destructive',  value: 'hsl(var(--destructive) / 0.3)', description: t('tokens.table.destructiveBorder') },
            { token: '--destructive',  value: 'hsl(var(--destructive))',       description: t('tokens.table.destructiveText') },
            { token: '--success',      value: '.nds-alert-success',            description: t('tokens.table.success') },
            { token: '--warning',      value: '.nds-alert-warning',            description: t('tokens.table.warning') },
            { token: '--info',         value: '.nds-alert-info',               description: t('tokens.table.info') },
            { token: '--radius-alert', value: 'var(--radius-alert)',           description: t('tokens.table.radius') },
            { token: '--alert-bg',     value: 'hsl(var(--muted))',             description: t('tokens.table.alertBg') },
            { token: '--alert-bg-alpha', value: '0.1',                         description: t('tokens.table.alertBgAlpha') },
            { token: '--alert-fg',     value: 'hsl(var(--card-foreground))',   description: t('tokens.table.alertFg') },
            { token: '--alert-body-fg', value: 'hsl(var(--foreground))',       description: t('tokens.table.alertBodyFg') },
            { token: '--alert-border', value: 'hsl(var(--border))',            description: t('tokens.table.alertBorder') },
            { token: '--alert-border-alpha', value: '0.3',                     description: t('tokens.table.alertBorderAlpha') },
            { token: '--alert-glow',   value: 'hsl(var(--border))',            description: t('tokens.table.alertGlow') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
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
          ],
          keyboardTitle: t('accessibility.keyboardTitle'),
          keyboardItems: [
            { key: 'Tab',   description: t('accessibility.keyboard.tab') },
            { key: 'Enter', description: t('accessibility.keyboard.enter') },
            { key: '—',     description: t('accessibility.keyboard.noKeyboard') },
          ],
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          items: [
            { name: 'Sonner',      description: toPlainText(t('related.sonner')),      path: '?path=/docs/ui-sonner--docs' },
            { name: 'AlertDialog', description: toPlainText(t('related.alertDialog')), path: '?path=/docs/ui-alertdialog--docs' },
            { name: 'Badge',       description: toPlainText(t('related.badge')),       path: '?path=/docs/ui-badge--docs' },
            { name: 'Progress',    description: toPlainText(t('related.progress')),    path: '?path=/docs/ui-progress--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          items: [
            { title: '', content: t('notes.tip1') },
            { title: '', content: t('notes.tip2') },
            { title: '', content: t('notes.tip3') },
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
            { event: t('analytics.table.dismiss'),       trigger: toPlainText(t('analytics.table.dismissTrigger')),       payload: t('analytics.table.dismissPayload') },
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
            items: [1, 2, 3, 4].map(i => ({
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
            items: [1, 2, 3, 4, 5].map(i => ({
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
        component_name: 'alert',
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
