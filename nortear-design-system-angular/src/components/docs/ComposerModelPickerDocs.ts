import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsComposer, type ComposerLabels } from '@/components/ui/composer';
import { composerLabels } from '@/components/ui/composer.fixtures';
import {
  NdsComposerModelPicker,
  type ComposerModelPickerLabels,
} from '@/components/ui/composer-model-picker';
import {
  availableModels,
  everyModel,
  modelLabels,
} from '@/components/ui/composer-model-picker.fixtures';
import type { ModelOption } from '@shared/primitives/chat-protocol';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import pickerTranslations from '@shared/content/composer-model-picker/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Os retornos são `output()` nesta stack, e não callbacks passados como
// propriedade. Divergência de API entre frameworks não se "alinha": cada stack
// usa a sua, e o conteúdo compartilhado descreve o CONCEITO. A linha da tabela
// nomeia o que se escreve AQUI, senão quem copia procura por um nome que não
// existe.
const { t, dict } = useTranslation(pickerTranslations as Record<string, unknown>, {
  '*': {
    'props.table.onValueChange.name': '(valueChange)',
    'props.table.onValueChange.type': 'OutputEmitterRef<ModelOption>',
    'props.table.onOpenChange.name': '(openChange)',
    'props.table.onOpenChange.type': 'OutputEmitterRef<boolean>',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
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

const INTERFACE_CODE = `// As entradas e as saídas do <nds-composer-model-picker>
export class NdsComposerModelPicker {
  readonly models = input.required<ModelOption[]>();
  readonly labels = input.required<ComposerModelPickerLabels>();
  readonly value = input<string | undefined>(undefined);

  // Semente, e não controle: quem abre e fecha depois é o próprio seletor.
  readonly open = input<boolean>(false);

  // Os retornos são saídas, e não callbacks em propriedade: é o caminho desta
  // stack. Aplicar a troca continua sendo de quem monta a conversa.
  readonly valueChange = output<ModelOption>();
  readonly openChange = output<boolean>();
}

export interface ComposerModelPickerLabels {
  trigger: string;   // \`{label}\` vira o nome do modelo escolhido
  list: string;      // o nome acessível da lista
}

// O modelo vem de @shared/primitives/chat-protocol:
export interface ModelOption {
  id: string;
  label: string;
  description?: string;         // aparece na lista, e não no gatilho
  badge?: string;               // reforço; nunca a única portadora
  unavailable?: boolean;
  unavailableReason?: string;   // obrigatório quando indisponível
}`;

/** As listas das demonstrações. Dado de exemplo não muda com o idioma. */
const EVERY = everyModel();
const AVAILABLE = availableModels();

/**
 * O contraexemplo do primeiro par: o impedimento sem o motivo.
 *
 * A opção continua apagada, e a pergunta "por que não posso?" fica sem
 * resposta na tela.
 */
const WITHOUT_REASON: ModelOption[] = everyModel().map((model) =>
  model.unavailable
    ? { id: model.id, label: model.label, description: model.description, unavailable: true }
    : model,
);

/**
 * O contraexemplo do segundo par: a descrição empurrada para dentro do nome.
 *
 * É como um gatilho que "leva a descrição" de fato acontece — não há entrada
 * para isso, o que há é alguém escrevendo a frase inteira no nome. E o campo
 * encolhe.
 */
const NAME_CARRYING_DESCRIPTION: ModelOption[] = everyModel().map((model) => ({
  ...model,
  label: model.description ? `${model.label} — ${model.description}` : model.label,
}));

@Component({
  selector: 'nds-composer-model-picker-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsComposer, NdsComposerModelPicker, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é a MESMA lista: o que muda é se a opção apagada
         explica por que está apagada. -->
    <ng-template #tplDoDont1Do>
      <nds-composer-model-picker
        [labels]="pickerLabels()"
        [models]="every"
        value="fast"
        [open]="true"
      />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-composer-model-picker
        [labels]="pickerLabels()"
        [models]="withoutReason"
        value="fast"
        [open]="true"
      />
    </ng-template>

    <!-- O segundo par é o seletor no trilho: com o nome curto, e com a
         descrição empurrada para dentro dele. -->
    <ng-template #tplDoDont2Do>
      <ng-template #railDoDont2Do>
        <nds-composer-model-picker
          [labels]="pickerLabels()"
          [models]="every"
          value="fast"
        />
      </ng-template>
      <nds-composer [labels]="labels()" [railStart]="railDoDont2Do" />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <ng-template #railDoDont2Dont>
        <nds-composer-model-picker
          [labels]="pickerLabels()"
          [models]="nameCarryingDescription"
          value="fast"
        />
      </ng-template>
      <nds-composer [labels]="labels()" [railStart]="railDoDont2Dont" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="composer-model-picker"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <nds-docs-demonstration
          [title]="t('demonstration.title')"
          componentSlug="composer-model-picker"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A LEGENDA VAI EMBAIXO, e é a única divergência de forma em
                 relação às outras docs pages. Ela sai do desenho: a lista abre
                 PARA CIMA, e uma legenda acima do seletor seria a primeira
                 coisa que a lista cobriria. O recuo no topo reserva o espaço
                 que a lista ocupa, que de outro modo não entraria no fluxo —
                 ela é absoluta.

                 O separador é decorativo de propósito: quem dá a estrutura
                 para quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full nds-pt-8" data-spacing="xs">
              <nds-composer-model-picker
                [labels]="pickerLabels()"
                [models]="every"
                value="balanced"
              />
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.closed') }}</p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full nds-pt-8" data-spacing="xs">
              <nds-composer-model-picker
                [labels]="pickerLabels()"
                [models]="available"
                [open]="true"
              />
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.open') }}</p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full nds-pt-8" data-spacing="xs">
              <nds-composer-model-picker
                [labels]="pickerLabels()"
                [models]="every"
                value="fast"
                [open]="true"
              />
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.unavailable') }}</p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full nds-pt-8" data-spacing="xs">
              <ng-template #railDemo>
                <nds-composer-model-picker
                  [labels]="pickerLabels()"
                  [models]="every"
                  value="fast"
                />
              </ng-template>
              <nds-composer [labels]="labels()" [railStart]="railDemo" />
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.withField') }}</p>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="t('import.basicCode')"
          [secondaryDescription]="t('import.withUnavailable')"
          [secondaryCode]="t('import.withUnavailableCode')"
          componentSlug="composer-model-picker"
          language="html"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
          [extensibilityCode]="t('props.extensibilityCode')"
          language="html"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
          language="css"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="composer-model-picker"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="composer-model-picker"
        />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsComposerModelPickerDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly every = EVERY;
  protected readonly available = AVAILABLE;
  protected readonly withoutReason = WITHOUT_REASON;
  protected readonly nameCarryingDescription = NAME_CARRYING_DESCRIPTION;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ComposerLabels>(() => {
    dict();
    return composerLabels();
  });

  protected readonly pickerLabels = computed<ComposerModelPickerLabels>(() => {
    dict();
    return modelLabels();
  });

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: [1, 2, 3, 4, 5].map((i) => ({
        s: t(`usage.scenarios.item${i}.s`),
        u: t(`usage.scenarios.item${i}.u`),
        a: toPlainText(t(`usage.scenarios.item${i}.a`)),
      })),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['trigger', 'modelName', 'description', 'badge', 'reason'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    // Os estados desta peça são NOMEADOS, não numerados: o que os distingue é o
    // assunto, e `item3` não diria qual é.
    return ['closed', 'open', 'selected', 'unavailable'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const rowsOf = (keys: string[]) =>
      keys.map((k) => ({
        name: t(`props.table.${k}.name`),
        type: t(`props.table.${k}.type`),
        defaultValue: t(`props.table.${k}.default`),
        required: t(`props.table.${k}.required`),
        description: toPlainText(t(`props.table.${k}.description`)),
      }));
    return [
      {
        title: 'NdsComposerModelPicker',
        cols,
        items: rowsOf(['models', 'labels', 'value', 'onValueChange', 'open', 'onOpenChange']),
      },
      {
        title: 'ModelOption',
        cols,
        items: rowsOf([
          'id', 'modelLabel', 'modelDescription', 'badge', 'unavailable', 'unavailableReason',
        ]),
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.value'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      'popover', 'border', 'elevationMd', 'zPopover', 'accent',
      'radiusSm', 'spacing6', 'textP', 'mutedForeground',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: '↑ ↓',   description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Esc',   description: toPlainText(t('accessibility.keyboard.escape')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'composer',               path: '?path=/docs/primitives-conversational-composer--docs' },
      { key: 'composerTriggerPopover', path: '?path=/docs/primitives-conversational-composertriggerpopover--docs' },
      { key: 'select',                 path: '?path=/docs/primitives-form-select--docs' },
      { key: 'badge',                  path: '?path=/docs/primitives-feedback-badge--docs' },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['pageView', 'sectionViewed', 'demoClick'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: t(`analytics.table.${k}Payload`),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        action: toPlainText(t(`testes.functional.item${i}.action`)),
        result: toPlainText(t(`testes.functional.item${i}.result`)),
        priority: priorityLabel(t(`testes.functional.item${i}.priority`)),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    dict();
    // A lista é PLANA: cada item é um critério, e o "como verificar" é o próprio
    // addon-a11y rodando em toda story.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: {
        criterion: tNav('common.criterion'),
        level: 'WCAG',
        how: tNav('common.howToVerify'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: 'AA',
        how: '—',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: {
        story: tNav('common.storyState'),
        priority: tNav('common.priority'),
      },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
        story: toPlainText(t(`testes.visual.item${i}.story`)),
        priority: priorityLabel(t(`testes.visual.item${i}.priority`)),
      })),
    };
  });

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'composer-model-picker',
      });
      track('docs_page_view', {
        component_name: 'composer-model-picker',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'composer-model-picker',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}
