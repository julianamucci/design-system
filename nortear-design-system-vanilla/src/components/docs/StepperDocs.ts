import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, onLocaleChange, createTranslation } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { createButton } from '@/components/ui/button';
import {
  createStepper,
  createStepperDescription,
  createStepperIndicator,
  createStepperItem,
  createStepperSeparator,
  createStepperTitle,
  createStepperTrigger,
  setStepperValue,
  type StepperLabels,
} from '@/components/ui/stepper';
import { stepperSnippet, type StepperSnippetStep } from '@/components/ui/stepper.source';
import uiTranslations from '@/i18n/ui.json';
import stepperTranslations from '@shared/content/stepper/translations.json';

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
const { t, subscribe } = createTranslation(stepperTranslations as Record<string, unknown>);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
function screenReaderItems(): string[] {
  const locale = getLocale();
  return Object.values(
    (stepperTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale]?.accessibility?.screenReader ?? {},
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── O fluxo, montado com o componente real ───────────────────────────────────

interface FlowStepDef {
  step: number;
  title: string;
  description?: string;
  completed?: boolean;
  disabled?: boolean;
}

interface FlowOptions {
  'aria-label': string;
  value: number;
  steps: FlowStepDef[];
  labels?: StepperLabels;
  onStepSelect?: (step: number) => void;
  /**
   * Indicador com o número escrito à mão. Conteúdo próprio vira `data-custom`, e
   * `setStepperValue` deixa de reescrevê-lo — então a marca de verificação nunca
   * aparece, que é exatamente o defeito que o painel "não faça" ilustra.
   */
  plainIndicator?: boolean;
}

const STEP_KEYS = ['account', 'address', 'payment', 'review'] as const;

/** As quatro etapas do cadastro, com ou sem o texto de apoio. */
function flowSteps(withDescriptions: boolean): FlowStepDef[] {
  return STEP_KEYS.map((key, index) => ({
    step: index + 1,
    title: t(`demonstration.labels.${key}`),
    description: withDescriptions ? t(`demonstration.labels.${key}Hint`) : undefined,
  }));
}

/** As palavras de estado, lidas só por leitor de tela. */
function stateLabels(): StepperLabels {
  return {
    completed: t('demonstration.labels.completed'),
    current: t('demonstration.labels.current'),
  };
}

/** As mesmas etapas, na forma que o construtor de snippet entende. */
function snippetSteps(steps: FlowStepDef[]): StepperSnippetStep[] {
  return steps.map((def) => ({
    title: def.title,
    description: def.description,
    completed: def.completed,
    disabled: def.disabled,
  }));
}

/**
 * Monta o fluxo inteiro e resolve o estado das etapas.
 *
 * A montagem tem DUAS FASES: sem runtime reativo, o estado de cada etapa só
 * pode ser resolvido depois que todas existem — e a segunda fase é
 * `setStepperValue`.
 */
function createFlow(options: FlowOptions): HTMLOListElement {
  const root = createStepper({
    'aria-label': options['aria-label'],
    labels: options.labels,
    onStepSelect: options.onStepSelect,
  });

  const items = options.steps.map((def) => {
    const item = createStepperItem({
      step: def.step,
      completed: def.completed,
      disabled: def.disabled,
    });

    const trigger = createStepperTrigger();
    trigger.append(
      options.plainIndicator
        ? createStepperIndicator({ content: String(def.step) })
        : createStepperIndicator(),
      createStepperTitle({ text: def.title }),
    );
    if (def.description) {
      trigger.appendChild(createStepperDescription({ text: def.description }));
    }

    item.appendChild(trigger);
    return item;
  });

  // O traço mora DENTRO da etapa, depois do gatilho — e a última não tem para
  // onde apontar.
  items.slice(0, -1).forEach((item) => item.appendChild(createStepperSeparator()));

  root.append(...items);
  setStepperValue(root, options.value);

  return root;
}

/**
 * Painel de conteúdo da etapa — quem anuncia o avanço é ele, não o indicador.
 *
 * `tabindex="-1"` existe para receber foco por programa e só por programa: sem
 * um alvo focável, mover o foco no avanço não teria para onde ir, e quem usa
 * leitor de tela continuaria ouvindo o botão que acabou de apertar em vez do
 * conteúdo que mudou. Ele não entra na ordem de tabulação.
 */
function createFlowPanel(): { root: HTMLElement; paint: (step: FlowStepDef) => void } {
  const root = document.createElement('div');
  root.className = 'nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack';
  root.dataset.spacing = 'sm';
  root.tabIndex = -1;

  const title = document.createElement('p');
  title.className = 'nds-text-body nds-font-semibold';

  const description = document.createElement('p');
  description.className = 'nds-text-body nds-text-muted-foreground';

  root.append(title, description);

  return {
    root,
    paint: (step) => {
      title.textContent = step.title;
      description.textContent = step.description ?? '';
    },
  };
}

/**
 * O fluxo completo: indicador, painel da etapa e os controles de voltar e
 * avançar. Quem é dono do valor é esta página — o componente informa a etapa
 * escolhida e recebe de volta o novo valor.
 *
 * `location` distingue a demonstração da composição no GA4, e é valor estável:
 * texto traduzido ali partiria um evento em três.
 */
function buildFlow(location: 'docs_demo' | 'docs_composition'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-full';
  wrapper.dataset.spacing = 'lg';

  const steps = flowSteps(true);
  const panel = createFlowPanel();
  let value = 1;

  const root = createFlow({
    'aria-label': t('demonstration.labels.flow'),
    value,
    steps,
    labels: stateLabels(),
    onStepSelect: (step) => goTo(step),
  });

  const back = createButton({
    variant: 'outline',
    label: t('demonstration.labels.back'),
    onClick: () => goTo(value - 1),
  });
  const next = createButton({
    label: t('demonstration.labels.next'),
    onClick: () => goTo(value + 1),
  });

  const actions = document.createElement('div');
  actions.className = 'nds-cluster';
  actions.dataset.spacing = 'md';
  actions.append(back, next);

  function paint(): void {
    setStepperValue(root, value);
    panel.paint(steps[value - 1]);
    back.disabled = value === 1;
    next.disabled = value === steps.length;
  }

  function goTo(step: number): void {
    const target = Math.min(Math.max(step, 1), steps.length);
    if (target === value) return;
    value = target;
    paint();
    // O foco vai para o painel, e não para o indicador — é o conteúdo que
    // mudou que anuncia o avanço, e é por isso que o Stepper não precisa de
    // região viva. `preventScroll` porque a página não deve saltar a cada
    // clique.
    panel.root.focus({ preventScroll: true });
    track('step_change', {
      component: 'stepper',
      step: value,
      total: steps.length,
      location,
    });
  }

  paint();
  wrapper.append(root, panel.root, actions);
  return wrapper;
}

// ─── createStepperDocs ────────────────────────────────────────────────────────

export function createStepperDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // ── SEO + Analytics ──────────────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: t('seo.title'),
      description: t('seo.description'),
      locale,
      componentSlug: 'stepper',
      aiSummary: t('seo.aiSummary'),
      aiEntities: t('seo.aiEntities'),
      breadcrumb: [
        { name: 'Components', item: '/components' },
        { name: t('category'), item: '/components/navigation' },
        { name: t('title') },
      ],
    });
    track('docs_page_view', {
      component_name: 'stepper',
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
      { id: 'importacao',   labelKey: 'nav.import'       },
      { id: 'composicoes',  labelKey: 'nav.compositions' },
      { id: 'estados',      labelKey: 'nav.states'       },
      { id: 'propriedades', labelKey: 'nav.props'        },
      { id: 'tokens',       labelKey: 'nav.tokens'       },
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
    headerSlot.replaceChildren(createDocsHeader({
      title: t('title'),
      description: t('description'),
      category: t('category'),
      type: t('type'),
    }));
  }

  function buildSidebar() {
    pageLayout.rebuildNav(buildNavGroups());
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  const sectionOrder = [
    'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
    'importacao', 'composicoes', 'estados', 'propriedades', 'tokens',
    'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
  ] as const;
  type SectionId = typeof sectionOrder[number];

  const sectionEls: Record<SectionId, HTMLElement> = {} as Record<SectionId, HTMLElement>;

  function buildSection(id: SectionId): HTMLElement {
    switch (id) {
      case 'demonstracao':
        return createDocsDemonstration({
          title: t('demonstration.title'),
          componentSlug: 'stepper',
          demoFactory: () => buildFlow('docs_demo'),
        });

      case 'anatomia':
        return createDocsAnatomy({
          title: t('anatomy.title'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => t(`anatomy.item${i}`)),
          structureLabel: t('anatomy.structureLabel'),
          structureCode: t('anatomy.structureCode'),
        });

      case 'quando-usar':
        return createDocsWhenToUse({
          title: t('usage.title'),
          guidelines: {
            title: t('usage.guidelines.title'),
            items: [1, 2, 3, 4, 5].map(i => t(`usage.guidelines.item${i}`)),
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
            items: ['title', 'description', 'stateLabel', 'flowName'].map(key => ({
              element: t(`usage.uxWriting.table.${key}.name`),
              rules: t(`usage.uxWriting.table.${key}.format`),
              do: t(`usage.uxWriting.table.${key}.good`),
              dont: t(`usage.uxWriting.table.${key}.bad`),
            })),
          },
          // Os itens do "não use" citam o componente alternativo em <code>, e o
          // container sanitiza e renderiza HTML — passar por toPlainText aqui
          // devolveria a marcação como texto na tela.
          do: {
            title: t('usage.do.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.do.item${i}`)),
          },
          dont: {
            title: t('usage.dont.title'),
            items: [1, 2, 3, 4].map(i => t(`usage.dont.item${i}`)),
          },
        });

      case 'do-dont': {
        const steps = flowSteps(false);
        const withHints = flowSteps(true);

        return createDocsDoDont({
          title: t('doDont.title'),
          pairs: [
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair1.do')),
              dontCaption: toPlainText(t('doDont.pair1.dont')),
              doPreviewFactory: () => createFlow({
                'aria-label': toPlainText(t('doDont.pair1.do')),
                value: 3,
                steps,
                labels: stateLabels(),
              }),
              // Sem as palavras de estado E com o número escrito à mão no
              // indicador, a etapa concluída fica diferente da futura só na cor
              // do círculo: nada de forma, nada de palavra.
              dontPreviewFactory: () => createFlow({
                'aria-label': toPlainText(t('doDont.pair1.dont')),
                value: 3,
                steps,
                plainIndicator: true,
              }),
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair2.do')),
              dontCaption: toPlainText(t('doDont.pair2.dont')),
              doPreviewFactory: () => createFlow({
                'aria-label': toPlainText(t('doDont.pair2.do')),
                value: 2,
                steps,
                labels: stateLabels(),
              }),
              dontPreviewFactory: () => {
                const wrap = document.createElement('div');
                wrap.className = 'nds-stack';
                wrap.dataset.spacing = 'sm';
                wrap.append(createFlow({
                  'aria-label': toPlainText(t('doDont.pair2.dont')),
                  value: 2,
                  steps,
                }));

                // O aviso que se repete a cada avanço. Ele é renderizado SEM
                // `aria-live` e SEM `role="status"` de propósito: uma região
                // viva de verdade nesta página interromperia a leitura de quem
                // a abrisse, que é o mesmo defeito que o painel denuncia. O que
                // se mostra aqui é o aviso repetido; o que se descreve é o
                // atributo que o faria falar por cima de tudo.
                const announcement = document.createElement('p');
                announcement.className =
                  'nds-text-body nds-text-muted-foreground nds-p-2 nds-rounded-md nds-border-default';
                announcement.textContent =
                  `${t('demonstration.labels.current')}: ${steps[1].title}`;
                wrap.append(announcement);
                return wrap;
              },
            },
            {
              doLabel: tNav('common.do'),
              dontLabel: tNav('common.dont'),
              doCaption: toPlainText(t('doDont.pair3.do')),
              dontCaption: toPlainText(t('doDont.pair3.dont')),
              doPreviewFactory: () => createFlow({
                'aria-label': toPlainText(t('doDont.pair3.do')),
                value: 2,
                steps: steps.map(s => (s.step === 3 ? { ...s, disabled: true } : s)),
                labels: stateLabels(),
                onStepSelect: () => undefined,
              }),
              // Todas as etapas focáveis e nenhum ouvinte: o foco pousa numa
              // etapa que não abre nada.
              dontPreviewFactory: () => createFlow({
                'aria-label': toPlainText(t('doDont.pair3.dont')),
                value: 2,
                steps: withHints.map(s => ({ ...s, description: undefined })),
                labels: stateLabels(),
              }),
            },
          ],
        });
      }

      case 'importacao':
        return createDocsImport({
          title: t('import.title'),
          description: stripHtml(t('description')),
          componentSlug: 'stepper',
          code: `import {
  createStepper,
  createStepperItem,
  createStepperTrigger,
  createStepperIndicator,
  createStepperTitle,
  createStepperDescription,
  createStepperSeparator,
  setStepperValue,
} from '@/components/ui/stepper';`,
        });

      case 'composicoes': {
        const withHints = flowSteps(true);

        return createDocsCompositions({
          title: t('variants.title'),
          componentSlug: 'stepper',
          useWhenLabel: tNav('common.useWhen'),
          items: [
            {
              name: t('variants.compositions.wizard.name'),
              description: t('variants.compositions.wizard.description'),
              useWhen: t('variants.compositions.wizard.use'),
              trackId: 'wizard',
              // O mesmo construtor de snippet que alimenta o painel Code das
              // stories: snippet que diverge da demo mente sobre o que a página
              // renderiza, e ninguém percebe.
              code: stepperSnippet({
                'aria-label': t('demonstration.labels.flow'),
                value: 1,
                steps: snippetSteps(withHints),
                labels: stateLabels(),
                onStepSelect: 'irPara(step);',
              }),
              previewFactory: () => buildFlow('docs_composition'),
            },
            {
              name: t('variants.compositions.withDescriptions.name'),
              description: t('variants.compositions.withDescriptions.description'),
              useWhen: t('variants.compositions.withDescriptions.use'),
              trackId: 'withDescriptions',
              code: stepperSnippet({
                'aria-label': t('demonstration.labels.flow'),
                value: 2,
                steps: snippetSteps(withHints),
                labels: stateLabels(),
              }),
              previewFactory: () => createFlow({
                'aria-label': t('variants.compositions.withDescriptions.name'),
                value: 2,
                steps: withHints,
                labels: stateLabels(),
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
          items: ['inactive', 'active', 'completed', 'disabled'].map(key => ({
            label: t(`states.${key}.label`),
            trigger: toPlainText(t(`states.${key}.trigger`)),
            behavior: toPlainText(t(`states.${key}.behavior`)),
          })),
        });

      case 'propriedades': {
        const interfaceCode =
`export interface StepperOptions {
  /** Nome acessível do fluxo. Sem ele o leitor de tela anuncia só uma lista. */
  'aria-label': string;
  labels?: { completed?: string; current?: string };
  onStepSelect?: (step: number) => void;
  class?: string;
}

export interface StepperItemOptions {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  class?: string;
}

export function createStepper(options: StepperOptions): HTMLOListElement;
export function createStepperItem(options: StepperItemOptions): HTMLLIElement;
export function createStepperTrigger(options?: StepperTriggerOptions): HTMLButtonElement;
export function createStepperIndicator(options?: StepperIndicatorOptions): HTMLElement;
export function createStepperTitle(options?: StepperTextOptions): HTMLElement;
export function createStepperDescription(options?: StepperTextOptions): HTMLElement;
export function createStepperSeparator(options?: StepperSeparatorOptions): HTMLElement;

/** Segunda fase: aplica o valor do fluxo e resolve o estado de cada etapa. */
export function setStepperValue(root: HTMLElement, value: number): void;
export function getStepperValue(root: HTMLElement): number;`;

        const propsCols = {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        };

        const DIVERGENCE =
          ' (Nortear: sem runtime reativo, o valor não é opção da raiz — é aplicado por' +
          ' setStepperValue(root, value) depois que todas as etapas existem.)';

        return createDocsProps({
          title: t('props.title'),
          tables: [
            {
              title: 'createStepper(options)',
              cols: propsCols,
              items: [
                { name: "'aria-label'", type: t('props.table.ariaLabel.type'), defaultValue: t('props.table.ariaLabel.default'), required: t('props.table.ariaLabel.required'), description: toPlainText(t('props.table.ariaLabel.description')) },
                { name: 'labels',       type: t('props.table.labels.type'),    defaultValue: t('props.table.labels.default'),    required: t('props.table.labels.required'),    description: toPlainText(t('props.table.labels.description')) },
                { name: 'onStepSelect', type: t('props.table.onStepSelect.type'), defaultValue: t('props.table.onStepSelect.default'), required: t('props.table.onStepSelect.required'), description: toPlainText(t('props.table.onStepSelect.description')) },
                { name: 'class',        type: t('props.table.class.type'),     defaultValue: t('props.table.class.default'),     required: t('props.table.class.required'),     description: toPlainText(t('props.table.class.description')) + ' `className` é aceito como apelido; quando os dois vêm, `class` vence.' },
              ],
            },
            {
              title: 'createStepperItem(options)',
              cols: propsCols,
              items: [
                { name: 'step',      type: t('props.table.step.type'),      defaultValue: t('props.table.step.default'),      required: t('props.table.step.required'),      description: toPlainText(t('props.table.step.description')) },
                { name: 'completed', type: t('props.table.completed.type'), defaultValue: t('props.table.completed.default'), required: t('props.table.completed.required'), description: toPlainText(t('props.table.completed.description')) },
                { name: 'disabled',  type: t('props.table.disabled.type'),  defaultValue: t('props.table.disabled.default'),  required: t('props.table.disabled.required'),  description: toPlainText(t('props.table.disabled.description')) },
                { name: 'class',     type: t('props.table.class.type'),     defaultValue: t('props.table.class.default'),     required: t('props.table.class.required'),     description: toPlainText(t('props.table.class.description')) },
              ],
            },
            {
              title: 'setStepperValue(root, value)',
              cols: propsCols,
              items: [
                { name: 'value', type: t('props.table.value.type'), defaultValue: t('props.table.value.default'), required: t('props.table.value.required'), description: toPlainText(t('props.table.value.description')) + DIVERGENCE },
              ],
            },
          ],
          interfaceCode,
          extensibilityTitle: t('props.extensibilityTitle'),
          extensibilityCode: t('props.extensibilityCode'),
          extensibilityNotes:
            'O indicador com conteúdo próprio passa a ser data-custom, e setStepperValue deixa de reescrevê-lo — senão a marca de verificação apagaria o ícone posto ali. O traço mora dentro do item, depois do gatilho: é o que faz a regra da etapa concluída alcançá-lo sem seletor extra.',
        });
      }

      case 'tokens': {
        const rows: Array<[string, string]> = [
          ['gap', '--spacing-2'],
          ['itemGap', '--spacing-2'],
          ['triggerGap', '--spacing-1'],
          ['triggerRadius', '--radius-md'],
          ['ring', '--ring'],
          ['ringHalo', '--background'],
          ['indicatorSize', '--spacing-8'],
          ['indicatorRadius', '--radius-full'],
          ['indicatorBg', '--muted'],
          ['indicatorFg', '--muted-foreground'],
          ['activeBg', '--primary'],
          ['activeFg', '--primary-foreground'],
          ['completedBg', '--accent'],
          ['completedFg', '--accent-foreground'],
          ['titleSize', '--text-control-lg'],
          ['titleWeight', '--font-weight-semi-bold'],
          ['descriptionSize', '--text-control-sm'],
          ['descriptionColor', '--muted-foreground'],
          ['separator', '--border'],
          ['separatorLength', '--spacing-8'],
          ['separatorCompleted', '--accent'],
          ['separatorDisabled', '--muted'],
        ];

        return createDocsTokens({
          title: t('tokens.title'),
          cols: {
            token: t('tokens.table.token'),
            value: t('tokens.table.class'),
            description: t('tokens.table.part'),
          },
          items: rows.map(([key, token]) => ({
            token,
            value: t(`tokens.table.${key}.class`),
            description: toPlainText(t(`tokens.table.${key}.part`)),
          })),
          customizationTitle: t('tokens.customizationTitle'),
          customizationCode: t('tokens.customizationCode'),
        });
      }

      case 'acessibilidade':
        return createDocsAccessibility({
          title: t('accessibility.title'),
          summary: t('accessibility.summary'),
          items: [1, 2, 3, 4, 5, 6, 7].map(i => stripHtml(t(`accessibility.items.item${i}`))),
          keyboardTitle: t('accessibility.keyboard.title'),
          keyboardItems: [
            { key: 'Tab',         description: t('accessibility.keyboard.tab') },
            { key: 'Shift + Tab', description: t('accessibility.keyboard.shiftTab') },
            { key: 'Enter',       description: t('accessibility.keyboard.enter') },
            { key: 'Space',       description: t('accessibility.keyboard.space') },
          ],
          screenReaderTitle: tNav('common.screenReader'),
          screenReaderItems: screenReaderItems(),
        });

      case 'relacionados':
        return createDocsRelated({
          title: t('related.title'),
          componentSlug: 'stepper',
          items: [
            { name: t('related.items.tabs.name'),       description: toPlainText(t('related.items.tabs.description')),       path: '?path=/docs/components-navigation-tabs--docs' },
            { name: t('related.items.breadcrumb.name'), description: toPlainText(t('related.items.breadcrumb.description')), path: '?path=/docs/components-navigation-breadcrumb--docs' },
            { name: t('related.items.progress.name'),   description: toPlainText(t('related.items.progress.description')),   path: '?path=/docs/components-feedback-progress--docs' },
            { name: t('related.items.form.name'),       description: toPlainText(t('related.items.form.description')),       path: '?path=/docs/components-form-form--docs' },
          ],
        });

      case 'notas':
        return createDocsNotes({
          title: t('notes.title'),
          componentSlug: 'stepper',
          items: [
            ...[1, 2, 3, 4, 5].map(i => ({ title: '', content: t(`notes.item${i}`) })),
            {
              title: '',
              // Divergência idiomática desta stack (ver também a tabela de
              // propriedades): a montagem é de duas fases.
              content:
                '<strong>A montagem tem duas fases</strong> — sem runtime reativo, o estado só pode ser resolvido depois que todas as etapas existem. Monte a árvore e chame <code>setStepperValue(root, value)</code>; esquecer a segunda fase deixa toda etapa em <code>inactive</code>, que é como o item nasce.',
            },
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
            { event: 'step_change',         trigger: toPlainText(t('analytics.table.step_change.trigger')),         payload: t('analytics.table.step_change.payload') },
            { event: 'docs_page_view',      trigger: 'Render inicial da docs page',                                  payload: '{ component_name, locale, page_title }' },
            { event: 'docs_section_viewed', trigger: toPlainText(t('analytics.table.docs_section_viewed.trigger')), payload: t('analytics.table.docs_section_viewed.payload') },
          ],
        });

      case 'testes':
        return createDocsTestes({
          title: t('testes.title'),
          functional: {
            title: t('testes.functional.title'),
            description: t('testes.functional.description'),
            cols: {
              action: tNav('common.userAction'),
              result: tNav('common.expectedResult'),
              priority: tNav('common.priority'),
            },
            items: [1, 2, 3, 4].map(i => ({
              action: toPlainText(t(`testes.functional.item${i}.action`)),
              result: toPlainText(t(`testes.functional.item${i}.result`)),
              priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
            })),
          },
          accessibility: {
            title: t('testes.accessibility.title'),
            description: t('testes.accessibility.description'),
            cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
            items: [
              { criterion: t('testes.accessibility.item1'), level: '2.2 AA', how: 'axe-core via Storybook' },
              { criterion: t('testes.accessibility.item2'), level: '1.3.1',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item3'), level: '4.1.2',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item4'), level: '1.3.1',  how: 'play (Playground)' },
              { criterion: t('testes.accessibility.item5'), level: '2.1.1',  how: 'play (Disabled)' },
              { criterion: t('testes.accessibility.item6'), level: '4.1.3',  how: 'play (Playground)' },
            ],
          },
          visual: {
            title: t('testes.visual.title'),
            description: t('testes.visual.description'),
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
      (id) => pageLayout.setActiveSection(id),
      (id) => track('docs_section_viewed', {
        section_id: id,
        component_name: 'stepper',
        locale: getLocale(),
      }),
    );
  }
  cleanups.push(() => activeSectionObserver?.disconnect());

  // ── Initial render ───────────────────────────────────────────────────────

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
