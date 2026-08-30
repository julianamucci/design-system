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
import { attachLabel, composerLabels, textOfLength } from '@/components/ui/composer.fixtures';
import { NdsButton } from '@/components/ui/button';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import composerTranslations from '@shared/content/composer/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
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

// O trilho é `TemplateRef` nesta stack, e os dois retornos são `output()`, não
// callbacks passados como propriedade. Divergência de API entre frameworks não
// se "alinha": cada stack usa a sua, e o conteúdo compartilhado descreve o
// CONCEITO. A linha da tabela nomeia o que se escreve AQUI, senão quem copia
// procura por um nome que não existe.
const { t, dict } = useTranslation(composerTranslations as Record<string, unknown>, {
  '*': {
    'props.table.railStart.type': 'TemplateRef<unknown>',
    'props.table.onSubmit.name': 'submitted',
    'props.table.onSubmit.type': 'OutputEmitterRef<string>',
    'props.table.onStop.name': 'stopped',
    'props.table.onStop.type': 'OutputEmitterRef<void>',
    // O aviso de mudança é a saída que faz `[(value)]` funcionar.
    'props.table.onInput.name': 'valueChange',
    'props.table.onInput.type': 'OutputEmitterRef<string>',
  },
  'pt-BR': {
    'props.table.class.description':
      'Atributo nativo do elemento, não input: o Angular mescla com a classe base. É por aqui que a página define a largura.',
  },
  en: {
    'props.table.class.description':
      'Native element attribute, not an input: Angular merges it with the base class. This is where the page sets the width.',
  },
  es: {
    'props.table.class.description':
      'Atributo nativo del elemento, no input: Angular lo combina con la clase base. Aquí es donde la página define el ancho.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
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

const INTERFACE_CODE = `// <nds-composer> — componente
@Component({ selector: 'nds-composer', … })
export class NdsComposer {
  readonly labels = input.required<ComposerLabels>();
  readonly value = input<string>('');
  readonly rows = input<number>(2);
  readonly maxLength = input<number | undefined>(undefined);
  readonly submitOn = input<ComposerSubmitOn>('enter');
  readonly running = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly railStart = input<TemplateRef<unknown> | undefined>(undefined);

  readonly submitted = output<string>();
  readonly stopped = output<void>();
}

// O estado de geração é ENTRADA, e não método na raiz: quem sabe se a
// resposta chegou é quem consome. O trilho é um espaço declarado em
// <ng-template>, que o componente instancia.`;

const CODE_ENTER = '<nds-composer [labels]="labels" submitOn="enter" />';
const CODE_MODIFIER = '<nds-composer [labels]="labels" submitOn="modifier" />';

/** O limite das demonstrações. Pequeno para o contador chegar perto na tela. */
const LIMIT_DEMO = 120;

/** Nove décimos do limite é onde o contador muda de cor e de peso. */
const NEAR_LIMIT_TEXT = textOfLength(Math.ceil(LIMIT_DEMO * 0.95));

@Component({
  selector: 'nds-composer-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsComposer, NdsButton, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O controle de exemplo do trilho. O composer reserva o lugar e não sabe
         o que se põe nele. -->
    <ng-template #tplRail>
      <button ndsButton variant="ghost" size="sm">{{ attachText() }}</button>
    </ng-template>

    <!-- O primeiro par é o MESMO composer gerando: o que muda é se o botão
         troca de nome junto com a forma. -->
    <ng-template #tplDoDont1Do>
      <nds-composer [labels]="labels()" value="…" [running]="true" />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-composer [labels]="stopNamedAsSubmit()" value="…" [running]="true" />
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-composer [labels]="labels()" [maxLength]="limit" [value]="nearLimitText" />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: o mesmo campo sem o limite anunciado na descrição —
           o número fica só para os olhos, e some para quem não os usa. -->
      <nds-composer [labels]="limitUnannounced()" [maxLength]="limit" [value]="nearLimitText" />
    </ng-template>

    <ng-template #tplVarEnter>
      <nds-composer [labels]="labels()" submitOn="enter" />
    </ng-template>
    <ng-template #tplVarModifier>
      <nds-composer [labels]="labels()" submitOn="modifier" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="composer"
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
        <nds-docs-demonstration [title]="t('demonstration.title')" componentSlug="composer">
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL estado está desenhado — sem ela, quatro
                 campos empilhados viram um formulário só, e o assunto da
                 demonstração é justamente a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.basic') }}</p>
              <nds-composer [labels]="labels()" />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.running') }}</p>
              <nds-composer [labels]="labels()" [value]="labels().placeholder" [running]="true" />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.limit') }}</p>
              <nds-composer [labels]="labels()" [maxLength]="limit" [value]="nearLimitText" />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.rail') }}</p>
              <nds-composer [labels]="labels()" [railStart]="tplRail" />
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
          [secondaryDescription]="t('import.withRunning')"
          [secondaryCode]="t('import.withRunningCode')"
          componentSlug="composer"
          language="html"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="composer"
          id="variantes"
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
          componentSlug="composer"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="composer"
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
export class NdsComposerDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly limit = LIMIT_DEMO;
  protected readonly nearLimitText = NEAR_LIMIT_TEXT;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ComposerLabels>(() => {
    dict();
    return composerLabels();
  });

  protected readonly attachText = computed(() => {
    dict();
    return attachLabel();
  });

  /** O contraexemplo do primeiro par: o botão que não troca de nome. */
  protected readonly stopNamedAsSubmit = computed<ComposerLabels>(() => ({
    ...this.labels(),
    stop: this.labels().submit,
  }));

  /** O contraexemplo do segundo par: o limite que só existe para os olhos. */
  protected readonly limitUnannounced = computed<ComposerLabels>(() => ({
    ...this.labels(),
    limit: '',
  }));

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarEnter = viewChild.required<TemplateRef<unknown>>('tplVarEnter');
  private readonly tplVarModifier = viewChild.required<TemplateRef<unknown>>('tplVarModifier');

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
      items: ['placeholder', 'submit', 'stop', 'hint'].map((key) => ({
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

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'enter',    code: CODE_ENTER,    tpl: this.tplVarEnter()    },
      { key: 'modifier', code: CODE_MODIFIER, tpl: this.tplVarModifier() },
    ].map(({ key, code, tpl }) => ({
      name: key,
      description: t(`variants.items.${key}.description`),
      code,
      trackId: key,
      preview: tpl,
    }));
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
    // Os estados deste componente são NOMEADOS, não numerados: o que os
    // distingue é o assunto, e `item3` não diria qual é.
    return ['empty', 'filled', 'running', 'nearLimit', 'disabled'].map((k) => ({
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
    return [
      {
        title: 'NdsComposer',
        cols,
        items: [
          'labels', 'value', 'rows', 'maxLength', 'submitOn',
          'running', 'disabled', 'railStart', 'onSubmit', 'onStop', 'onInput', 'class',
        ].map((k) => ({
          name: t(`props.table.${k}.name`),
          type: t(`props.table.${k}.type`),
          defaultValue: t(`props.table.${k}.default`),
          required: t(`props.table.${k}.required`),
          description: toPlainText(t(`props.table.${k}.description`)),
        })),
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
      'background', 'input', 'border', 'ring', 'radius',
      'foreground', 'mutedForeground', 'muted', 'destructive',
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
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'chatThread', path: '?path=/docs/primitives-conversational-chatthread--docs' },
      { key: 'textarea',   path: '?path=/docs/primitives-form-textarea--docs'   },
      { key: 'button',     path: '?path=/docs/primitives-form-button--docs'     },
      { key: 'editor',     path: '?path=/docs/primitives-form-editor--docs'     },
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
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
        componentSlug: 'composer',
      });
      track('docs_page_view', {
        component_name: 'composer',
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
          component_name: 'composer',
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
