import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createAlertDialog } from '@/components/ui/alert-dialog';
import { alertDialogSnippet } from '@/components/ui/alert-dialog.source';
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
// valores chegam ao container — o `t()` exige nome de chave e não serviria. O
// `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.entries(
    (alertDialogTranslations as unknown as Record<string, { accessibility?: { screenReader?: Record<string, string> } }>)[locale]
      ?.accessibility?.screenReader ?? {},
  )
    .filter(([k]) => k !== 'title')
    .map(([, v]) => v);
}
// Opções que só esta stack tem, e o que a fábrica NÃO tem.
//
// `trigger`, `cancelButton`, `actionButton`, `titleLevel`, `media` e `onClose`
// são a API da fábrica — as outras stacks compõem peças e não têm linha para
// elas no conteúdo compartilhado. Ficam no override, e não em texto fixo: presas
// em pt-BR apareceriam em português nas versões en e es da tabela.
//
// `states.open.trigger`, `states.controlled.*` e `testes.functional.item7`
// descrevem um estado aberto fornecido por quem consome, e a fábrica não recebe
// `open` — a story `Controlled` declara o item como não aplicável. O texto
// compartilhado, lido aqui, prometia uma capacidade que esta página não entrega.
const { t, subscribe } = createTranslation(alertDialogTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.trigger': 'Elemento que abre o diálogo. A fábrica o marca com aria-haspopup="dialog" e aria-expanded, e devolve o foco a ele ao fechar.',
    'props.table.title': 'Texto do título. É o nome acessível do diálogo, por aria-labelledby.',
    'props.table.titleLevel': 'Nível do cabeçalho do título, de 1 a 6. Escolha o que segue a hierarquia da página de onde o diálogo abre.',
    'props.table.media': 'Caixa de ícone no topo do cabeçalho, montada com createAlertDialogMedia. Opcional.',
    'props.table.cancelButton': 'Botão da saída segura. Recebe o foco inicial e fecha o diálogo sem executar a ação.',
    'props.table.actionButton': 'Botão que confirma. O onClick passado ao botão roda primeiro, e o diálogo fecha em seguida.',
    'props.table.onClose': 'Callback com o motivo do fechamento: escape, close-button (Cancelar) ou api (ação que confirma). Dispara antes do callback de mudança.',
    'states.open.trigger': 'Clique no gatilho, ou estado inicial aberto na montagem',
    'states.controlled.trigger': 'Callback de mudança fornecido por quem consome; a fábrica não recebe estado aberto',
    'states.controlled.behavior': 'O estado vive na fábrica e sai pelo callback a cada transição; nascer aberto é o estado inicial não controlado',
    'testes.functional.item7.action': 'Controlar a abertura de fora',
    'testes.functional.item7.result': 'Não se aplica a esta fábrica: ela não recebe estado aberto. O callback de mudança reporta cada transição, e o estado inicial cobre nascer aberto',
  },
  en: {
    'props.table.trigger': 'Element that opens the dialog. The factory marks it with aria-haspopup="dialog" and aria-expanded, and returns focus to it on close.',
    'props.table.title': "Title text. It is the dialog's accessible name, through aria-labelledby.",
    'props.table.titleLevel': 'Heading level of the title, from 1 to 6. Pick the one that follows the hierarchy of the page the dialog opens from.',
    'props.table.media': 'Icon box at the top of the header, built with createAlertDialogMedia. Optional.',
    'props.table.cancelButton': 'Safe-exit button. Receives initial focus and closes the dialog without running the action.',
    'props.table.actionButton': 'Button that confirms. The onClick given to the button runs first, then the dialog closes.',
    'props.table.onClose': 'Callback with the close reason: escape, close-button (Cancel) or api (confirming action). Fires before the change callback.',
    'states.open.trigger': 'Click on the trigger, or initial open state on mount',
    'states.controlled.trigger': 'Change callback provided by the consumer; the factory takes no open state',
    'states.controlled.behavior': 'State lives in the factory and is reported through the callback on every transition; starting open is the uncontrolled initial state',
    'testes.functional.item7.action': 'Control opening from outside',
    'testes.functional.item7.result': 'Not applicable to this factory: it takes no open state. The change callback reports every transition, and the initial state covers starting open',
  },
  es: {
    'props.table.trigger': 'Elemento que abre el diálogo. La fábrica lo marca con aria-haspopup="dialog" y aria-expanded, y le devuelve el foco al cerrar.',
    'props.table.title': 'Texto del título. Es el nombre accesible del diálogo, mediante aria-labelledby.',
    'props.table.titleLevel': 'Nivel del encabezado del título, de 1 a 6. Elige el que sigue la jerarquía de la página desde donde se abre el diálogo.',
    'props.table.media': 'Caja de icono en la parte superior del encabezado, montada con createAlertDialogMedia. Opcional.',
    'props.table.cancelButton': 'Botón de salida segura. Recibe el foco inicial y cierra el diálogo sin ejecutar la acción.',
    'props.table.actionButton': 'Botón que confirma. El onClick pasado al botón se ejecuta primero y luego el diálogo se cierra.',
    'props.table.onClose': 'Callback con el motivo del cierre: escape, close-button (Cancelar) o api (acción que confirma). Se dispara antes del callback de cambio.',
    'states.open.trigger': 'Clic en el trigger, o estado inicial abierto al montar',
    'states.controlled.trigger': 'Callback de cambio provisto por quien consume; la fábrica no recibe estado abierto',
    'states.controlled.behavior': 'El estado vive en la fábrica y sale por el callback en cada transición; nacer abierto es el estado inicial no controlado',
    'testes.functional.item7.action': 'Controlar la apertura desde fuera',
    'testes.functional.item7.result': 'No aplica a esta fábrica: no recibe estado abierto. El callback de cambio informa cada transición, y el estado inicial cubre nacer abierto',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * A SEÇÃO onde o preview está — nunca uma constante no topo do arquivo.
 *
 * Demonstração, Variantes e Do & Don't montam o diálogo VIVO, e um clique ali é
 * tão real quanto o da demonstração. Até 2026-09-10 as quatro chamadas
 * mandavam `docs_demo`, e o GA4 juntava três seções num balde só.
 */
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

type AlertDialogDemoOptions = {
  /**
   * Id ESTÁVEL do preview para o payload — nunca o texto do botão, que é
   * traduzido e partiria o mesmo preview em um rótulo por idioma no GA4.
   */
  label: string;
  location: DocsLocation;
  triggerLabel: string;
  triggerVariant: 'default' | 'destructive' | 'outline';
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  /** Variante do Button da ação — a severidade da confirmação. */
  tone: 'destructive' | 'default';
};

/**
 * Um preview vivo, rastreado nos três eventos da família.
 *
 * O `dialog_close` sai do `onClose` da fábrica, que é quem sabe por onde o
 * diálogo fechou: `escape`, `close-button` (Cancelar) ou `api` (a ação). Antes
 * o fechamento era rastreado nos cliques dos dois botões, à mão — e o Escape,
 * que também fecha, não mandava evento nenhum. A confirmação vai no `onClick`
 * da ação, registrado quando o botão nasce, e por isso chega ao GA4 antes do
 * fechamento que ela provoca.
 */
function buildAlertDialogDemo(opts: AlertDialogDemoOptions): HTMLElement {
  const payload = { component: 'alert-dialog' as const, label: opts.label, location: opts.location };
  return createAlertDialog({
    trigger: createButton({ variant: opts.triggerVariant, label: opts.triggerLabel }),
    title: opts.title,
    description: opts.description,
    cancelButton: createButton({ variant: 'outline', label: opts.cancelLabel }),
    // Variante do Button — a mesma que as stories montam. `nds-bg-destructive`
    // solto pintava só o fundo e deixava o texto no foreground default.
    actionButton: createButton({
      variant: opts.tone,
      label: opts.actionLabel,
      onClick: () => track('dialog_confirm', payload),
    }),
    onOpenChange: (open) => {
      if (open) track('dialog_open', payload);
    },
    onClose: (reason) => track('dialog_close', { ...payload, reason }),
  });
}

type DemoContent = Omit<AlertDialogDemoOptions, 'label' | 'location'>;

/**
 * O exemplo destrutivo de `demonstration.labels`. Lido a cada chamada, e não
 * guardado: a página se remonta na troca de idioma.
 */
function destructiveContent(): DemoContent {
  return {
    triggerLabel: t('demonstration.labels.triggerLabel'),
    triggerVariant: 'destructive',
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    cancelLabel: t('demonstration.labels.cancel'),
    actionLabel: t('demonstration.labels.action'),
    tone: 'destructive',
  };
}

/** O exemplo neutro de `demonstration.labels`. */
function neutralContent(): DemoContent {
  return {
    triggerLabel: t('demonstration.labels.neutralTriggerLabel'),
    triggerVariant: 'outline',
    title: t('demonstration.labels.neutralTitle'),
    description: t('demonstration.labels.neutralDescription'),
    cancelLabel: t('demonstration.labels.cancel'),
    actionLabel: t('demonstration.labels.neutralAction'),
    tone: 'default',
  };
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
              buildAlertDialogDemo({ ...destructiveContent(), label: 'destructive', location: 'docs_demo' }),
              buildAlertDialogDemo({ ...neutralContent(), label: 'neutral', location: 'docs_demo' }),
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

      // Os quatro previews são o componente vivo e rastreado. O par 1 muda só
      // o TEXTO — o "não faça" é `doDont.pair1.dontExample`, com o mesmo gatilho
      // e o mesmo tom do "faça" —; o par 2 muda só o TOM da ação, com os
      // rótulos de `demonstration.labels` e o Cancelar presente nos dois (C7).
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
                ...destructiveContent(),
                label: 'pair1-do',
                location: 'docs_do_dont',
              }),
              dontPreviewFactory: () => buildAlertDialogDemo({
                ...destructiveContent(),
                title: t('doDont.pair1.dontExample.title'),
                description: t('doDont.pair1.dontExample.description'),
                cancelLabel: t('doDont.pair1.dontExample.cancel'),
                actionLabel: t('doDont.pair1.dontExample.action'),
                label: 'pair1-dont',
                location: 'docs_do_dont',
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => buildAlertDialogDemo({
                ...destructiveContent(),
                label: 'pair2-do',
                location: 'docs_do_dont',
              }),
              dontPreviewFactory: () => buildAlertDialogDemo({
                ...destructiveContent(),
                tone: 'default',
                label: 'pair2-dont',
                location: 'docs_do_dont',
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
        // O código de cada card sai do MESMO construtor do painel Code das
        // stories, com o texto do preview ao lado no idioma corrente. Os dois
        // blocos eram cravados em pt-BR com `description: '...'`: em en e es o
        // card ensinava outro texto que o do diálogo que ele descreve.
        const toSnippet = (c: DemoContent) => alertDialogSnippet({
          tone: c.tone,
          triggerVariant: c.triggerVariant,
          triggerLabel: c.triggerLabel,
          title: c.title,
          description: c.description,
          cancelLabel: c.cancelLabel,
          actionLabel: c.actionLabel,
        });
        const codeDestructive = toSnippet(destructiveContent());
        const codeDefault = toSnippet(neutralContent());

        return createDocsVariants({
          title: t('variants.title'),
          note: stripHtml(t('variants.note')),
          items: [
            {
              name: 'destructive',
              description: stripHtml(t('variants.items.destructive')),
              code: codeDestructive,
              previewFactory: () => buildAlertDialogDemo({
                ...destructiveContent(),
                label: 'destructive',
                location: 'docs_variantes',
              }),
            },
            {
              name: 'default',
              description: stripHtml(t('variants.items.default')),
              code: codeDefault,
              previewFactory: () => buildAlertDialogDemo({
                ...neutralContent(),
                label: 'neutral',
                location: 'docs_variantes',
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
export type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';

export interface AlertDialogOptions {
  trigger: HTMLElement;
  title: string;
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  description?: string;
  media?: HTMLElement;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: AlertDialogCloseReason) => void;
  class?: string;
}

// createAlertDialogMedia(options)
export interface AlertDialogMediaOptions {
  class?: string;
}`;

        const yes = tNav('common.yes');
        const no = tNav('common.no');

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        // Uma fábrica só, e cada tabela lista as OPÇÕES dela: a raiz fica com o
        // que é do diálogo inteiro, e cada peça com a opção que a monta. As
        // subtabelas descreviam as opções do `createButton` (variante, rótulo),
        // que não são API deste componente — e com texto em pt-BR cravado.
        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: t('props.rootTitle'),
              cols: propsCols,
              items: [
                { name: 'title',        type: 'string',                                           defaultValue: '—',     required: yes, description: t('props.table.title') },
                { name: 'titleLevel',   type: '1 | 2 | 3 | 4 | 5 | 6',                            defaultValue: '2',     required: no,  description: t('props.table.titleLevel') },
                { name: 'description',  type: 'string',                                           defaultValue: '—',     required: no,  description: toPlainText(t('props.table.optionalDescription')) },
                { name: 'media',        type: 'HTMLElement',                                      defaultValue: '—',     required: no,  description: t('props.table.media') },
                { name: 'defaultOpen',  type: 'boolean',                                          defaultValue: 'false', required: no,  description: t('props.table.defaultOpen') },
                { name: 'onOpenChange', type: '(open: boolean) => void',                          defaultValue: '—',     required: no,  description: t('props.table.onOpenChange') },
                { name: 'onClose',      type: "(reason: 'escape' | 'close-button' | 'api') => void", defaultValue: '—',  required: no,  description: t('props.table.onClose') },
              ],
            },
            {
              title: t('props.triggerTitle'),
              cols: propsCols,
              items: [
                { name: 'trigger', type: 'HTMLElement', defaultValue: '—', required: yes, description: t('props.table.trigger') },
              ],
            },
            {
              title: t('props.contentTitle'),
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: no, description: t('props.table.className') },
              ],
            },
            {
              title: t('props.actionTitle'),
              cols: propsCols,
              items: [
                { name: 'actionButton', type: 'HTMLElement', defaultValue: '—', required: yes, description: t('props.table.actionButton') },
              ],
            },
            {
              title: t('props.cancelTitle'),
              cols: propsCols,
              items: [
                { name: 'cancelButton', type: 'HTMLElement', defaultValue: '—', required: yes, description: t('props.table.cancelButton') },
              ],
            },
            {
              // Nome da sub-fábrica, e não rótulo traduzível: é identificador.
              title: 'createAlertDialogMedia',
              cols: propsCols,
              items: [
                { name: 'class', type: 'string', defaultValue: '—', required: no, description: t('props.table.className') },
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
            // O véu lê `--overlay`, o token de cor da camada; o alfa de 0.8 é do uso.
            { token: '--overlay',                        value: '.nds-alert-dialog-overlay',     description: t('tokens.table.overlayBg') },
            { token: '--background',             value: '.nds-alert-dialog-content',     description: t('tokens.table.contentBg') },
            { token: '--foreground',             value: '.nds-alert-dialog-content',     description: t('tokens.table.contentForeground') },
            { token: '--border',                 value: '.nds-alert-dialog-content',     description: t('tokens.table.border') },
            { token: '--radius-card',            value: '.nds-alert-dialog-content',     description: t('tokens.table.radius') },
            { token: '--elevation-xl',           value: '.nds-alert-dialog-content',     description: t('tokens.table.elevation') },
            { token: '--spacing-6',              value: '.nds-alert-dialog-content',     description: t('tokens.table.padding') },
            { token: '--muted-foreground',       value: '.nds-alert-dialog-description', description: t('tokens.table.mutedForeground') },
            { token: '--muted',                  value: '.nds-alert-dialog-media',       description: t('tokens.table.mediaBg') },
            { token: '--radius-md',              value: '.nds-alert-dialog-media',       description: t('tokens.table.mediaRadius') },
            // A ação herda o tom do Button: o destrutivo vem da variante, não deste CSS.
            // `--destructive-foreground` não tem linha porque não tem leitor: a variante
            // destrutiva é soft (fundo suave com o rótulo na PRÓPRIA cor semântica), e
            // nenhuma regra de button.css lê o par `-foreground`. Ver button.css:16-18.
            { token: '--destructive',            value: '.nds-button-destructive',       description: t('tokens.table.destructive') },
          ],
          customizationTitle: t('tokens.customizationTitle'),
          // Do conteúdo compartilhado, e só com tokens que a folha lê: o bloco
          // local redefinia `--destructive-foreground` e `--radius`, que
          // nenhuma regra de alert-dialog.css consome.
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
            { name: 'Dialog', description: toPlainText(t('related.dialog')), path: '?path=/docs/components-overlay-dialog--docs' },
            { name: 'Sonner', description: toPlainText(t('related.sonner')), path: '?path=/docs/components-feedback-sonner--docs' },
            { name: 'Alert',  description: toPlainText(t('related.alert')),  path: '?path=/docs/components-feedback-alert--docs'  },
            { name: 'Button', description: toPlainText(t('related.button')), path: '?path=/docs/components-form-button--docs' },
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
            items: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({
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
