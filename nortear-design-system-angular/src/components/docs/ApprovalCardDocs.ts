import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsApprovalCard } from '@/components/ui/approval-card';
import {
  approvalChoices,
  approvalQuestion,
  approvalScope,
  APPROVAL_EXAMPLE_NAMES,
} from '@/components/ui/approval-card.fixtures';
import { NdsButton } from '@/components/ui/button';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import approvalTranslations from '@shared/content/approval-card/translations.json';

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

// Duas divergências de API, e as duas se REGISTRAM em vez de se "alinhar".
//
// O aviso sai por `output()` nesta stack, e não por um callback passado como
// propriedade; e os controles chegam como `TemplateRef`, e não como elementos
// prontos — é a mesma escolha que `actions` e `approval` já fazem no
// `chat-thread`. A linha da tabela nomeia o que se escreve AQUI, senão quem
// copia procura por um nome que não existe.
//
// A DESCRIÇÃO fica intacta nas três, porque ela já é neutra de API. Vontade de
// sobrescrevê-la seria sinal de que o texto compartilhado nomeia a API de
// alguma stack — e o conserto seria lá, não aqui.
const { t, dict } = useTranslation(approvalTranslations as Record<string, unknown>, {
  '*': {
    'props.table.actions.type': 'TemplateRef<unknown>[]',
    'props.table.onChoose.name': 'choose',
    'props.table.onChoose.type': 'OutputEmitterRef<string>',
  },
});

// Esta peça não tem eixo de forma, e o conteúdo compartilhado não traz seção de
// variantes: ela não existe nem na navegação nem na página. A seção de estados
// continua, e documenta as FORMAS que o cartão toma do que recebe.
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

/** As formas, na ordem em que a tabela e as stories as apresentam. */
const STATE_KEYS = [
  'withScope',
  'withoutScope',
  'longDetail',
  'manyChoices',
  'withoutActions',
] as const;

const INTERFACE_CODE = `// As três entradas e a saída do cartão, no <div ndsApprovalCard>
export class NdsApprovalCard {
  readonly question = input.required<string>();
  readonly scope = input<readonly ApprovalScopeItem[] | undefined>(undefined);

  // Os controles chegam como TEMPLATE, e não como elemento pronto: quem consome
  // os declara e o componente os instancia. Cada entrada é um pedaço do espaço
  // da resposta — a peça não conta controles, ela instancia o que chega.
  readonly actions = input<readonly TemplateRef<unknown>[] | undefined>(undefined);

  // O aviso é uma saída, e não um callback em propriedade: é o caminho desta
  // stack. O que a escolha significa continua sendo de quem consome.
  readonly choose = output<string>();
}

export interface ApprovalScopeItem {
  term: string;     // o rótulo daquela linha do alcance
  detail: string;   // o valor, inteiro — sem abreviar e sem reticências
}

// O atributo com que um controle se declara resposta. Ele NÃO é do design
// system: quem o escreve é quem monta os controles, e é o único pedaço do
// contrato que atravessa a fronteira do que a peça desenha.
//
//   <button ndsButton data-approval-choice="allow-once">…</button>
//
// Controle sem ele não dispara nada — um link de "saiba mais" no meio dos
// controles continua sendo só um link.`;

@Component({
  selector: 'nds-approval-card-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsApprovalCard, NdsButton, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- OS CONTROLES SÃO DE QUEM CONSOME, e esta página é quem consome. Todos
         com a MESMA ênfase: qual resposta o produto recomenda é política dele, e
         num cartão que pede autorização destacar "Permitir" EMPURRA para
         permitir. A demonstração fica lisa por causa disso, e é para ficar. -->
    <ng-template #choiceControls>
      @for (choice of choices(); track choice.value) {
        <button
          ndsButton
          type="button"
          variant="outline"
          size="sm"
          [attr.data-approval-choice]="choice.value"
        >{{ choice.label }}</button>
      }
    </ng-template>

    <ng-template #tplDoDont1Do>
      <div
        ndsApprovalCard
        class="nds-w-full"
        [question]="publishQuestion()"
        [scope]="publishScope()"
        [actions]="[choiceControls]"
      ></div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo se monta com a MESMA API: o alcance entra embutido na
           frase, e a lista deixa de existir. É o que a peça não pode impedir —
           quem escreve a pergunta é quem consome. -->
      <div
        ndsApprovalCard
        class="nds-w-full"
        [question]="scopeInsideQuestion()"
        [actions]="[choiceControls]"
      ></div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div
        ndsApprovalCard
        class="nds-w-full"
        [question]="writeFileQuestion()"
        [scope]="writeFileScope()"
        [actions]="[choiceControls]"
      ></div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- A pergunta genérica e sem alcance nenhum: quem responde está
           autorizando o que não viu. -->
      <div
        ndsApprovalCard
        class="nds-w-full"
        [question]="vagueQuestion()"
        [actions]="[choiceControls]"
      ></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="approval-card"
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
          componentSlug="approval-card"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL caso está desenhado — sem ela, três cartões
                 empilhados viram um só, e o assunto da demonstração é justamente
                 a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            @for (example of examples(); track example.name) {
              @if (!$first) {
                <div ndsSeparator></div>
              }
              <div class="nds-stack nds-w-full" data-spacing="xs">
                <p class="nds-text-caption nds-text-muted-foreground">{{ example.caption }}</p>
                <div
                  ndsApprovalCard
                  [question]="example.question"
                  [scope]="example.scope"
                  [actions]="[choiceControls]"
                ></div>
              </div>
            }
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
          [secondaryDescription]="t('import.withActions')"
          [secondaryCode]="t('import.withActionsCode')"
          componentSlug="approval-card"
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
          language="ts"
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
          componentSlug="approval-card"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="approval-card"
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
export class NdsApprovalCardDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /** Os controles são texto de interface, então acompanham a troca de idioma. */
  protected readonly choices = computed(() => {
    dict();
    return approvalChoices();
  });

  /** Os três casos da demonstração, com a legenda que diz qual é qual. */
  protected readonly examples = computed(() => {
    dict();
    return APPROVAL_EXAMPLE_NAMES.map((name) => ({
      name,
      caption: t(`demonstration.labels.${name}`),
      question: approvalQuestion(name),
      scope: approvalScope(name),
    }));
  });

  protected readonly publishQuestion = computed(() => {
    dict();
    return approvalQuestion('publish');
  });

  protected readonly publishScope = computed(() => {
    dict();
    return approvalScope('publish');
  });

  protected readonly writeFileQuestion = computed(() => {
    dict();
    return approvalQuestion('writeFile');
  });

  protected readonly writeFileScope = computed(() => {
    dict();
    return approvalScope('writeFile');
  });

  /** O alcance embutido na frase: o pareamento fica na pontuação, e se perde. */
  protected readonly scopeInsideQuestion = computed(() => {
    dict();
    const pairs = approvalScope('publish')
      .map((item) => `${item.term}: ${item.detail}`)
      .join(' · ');
    return `${approvalQuestion('publish')} ${pairs}`;
  });

  /** A pergunta genérica, que não diz o que vai acontecer. */
  protected readonly vagueQuestion = computed(() => {
    dict();
    return t('labels.question.vague');
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
      items: ['question', 'scopeTerm', 'scopeDetail', 'choice'].map((key) => ({
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
    return STATE_KEYS.map((k) => ({
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
        title: 'NdsApprovalCard',
        cols,
        items: rowsOf(['question', 'scope', 'actions', 'onChoose']),
      },
      {
        title: 'ApprovalScopeItem',
        cols,
        items: rowsOf(['term', 'detail']),
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
      'textLabel', 'warning', 'muted', 'radius', 'spacing3',
      'foreground', 'fontWeightMedium', 'mutedForeground',
      'spacing1', 'spacing2',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.items.item${i}`));
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
      { key: 'toolGroup',   path: '?path=/docs/components-conversational-toolgroup--docs'  },
      { key: 'chatThread',  path: '?path=/docs/components-conversational-chatthread--docs' },
      { key: 'alertDialog', path: '?path=/docs/components-overlay-alertdialog--docs'       },
      { key: 'button',      path: '?path=/docs/components-form-button--docs'               },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        componentSlug: 'approval-card',
      });
      track('docs_page_view', {
        component_name: 'approval-card',
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
          component_name: 'approval-card',
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
