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
import { NdsMarkdown } from '@/components/ui/markdown';
import { NdsComposer, type ComposerLabels } from '@/components/ui/composer';
import { NdsSeparator } from '@/components/ui/separator';
import { NdsThinkingIndicator } from '@/components/ui/thinking-indicator';
import {
  answerText,
  composerLabels,
  generatingLabel,
  questionText,
  searchingLabel,
} from '@/components/ui/thinking-indicator.fixtures';
import uiTranslations from '@/i18n/ui.json';
import indicatorTranslations from '@shared/content/thinking-indicator/translations.json';

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

// A DIVERGÊNCIA DE API que se REGISTRA em vez de se "alinhar".
//
// O conteúdo compartilhado descreve a propriedade de classe pelo nome neutro
// `class`, e a descreve como uma propriedade da raiz. Aqui a raiz É o parágrafo:
// o seletor é de atributo (`p[ndsThinkingIndicator]`), porque um elemento
// próprio somaria uma caixa entre o lugar da resposta e o `.nds-thinking`, e
// essa caixa quebraria o `display: flex` que a folha declara na raiz. A
// consequência é que não existe propriedade por onde passar classes: elas vão no
// atributo do próprio parágrafo, e a classe base se soma às que forem escritas.
//
// A linha da tabela é sobrescrita para dizer isso, senão quem copia procura uma
// propriedade que não existe. Sobrescrever é para nome de prop e rótulo — nunca
// para chave `*Code`, que estranharia o conteúdo compartilhado.
const { t, dict } = useTranslation(indicatorTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.class.description':
      'Classes extras vão no atributo do próprio parágrafo, que é a raiz — não há propriedade por onde passá-las, e a classe base se soma às que forem escritas.',
  },
  en: {
    'props.table.class.description':
      'Extra classes go on the attribute of the paragraph itself, which is the root — there is no property to pass them through, and the base class is added to whatever is written.',
  },
  es: {
    'props.table.class.description':
      'Las clases extra van en el atributo del propio párrafo, que es la raíz — no hay propiedad por donde pasarlas, y la clase base se suma a las que se escriban.',
  },
});

// Esta peça não tem eixo de forma — os pontos são sempre três —, então não há
// seção de variantes nem na navegação nem na página.
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

const INTERFACE_CODE = `// O seletor é de ATRIBUTO: a raiz é o próprio parágrafo, e um elemento
// próprio somaria uma caixa entre o lugar da resposta e a linha de pontos.
@Component({ selector: 'p[ndsThinkingIndicator]' })
export class NdsThinkingIndicator {
  // A frase que diz o que está acontecendo. Obrigatória e sem padrão: um padrão
  // escondido seria uma frase numa língua só, e é ela que chega a quem ouve.
  readonly label = input.required<string>();
}

// Não há entrada de quantidade de pontos: o atraso escalonado que os faz
// parecer uma onda está escrito na folha para três.
//
// Não há entrada de aparecer nem de sumir: as duas são de quem monta a
// conversa, que é quem sabe quando o primeiro trecho de texto chegou.`;

@Component({
  selector: 'nds-thinking-indicator-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsComposer, NdsMarkdown, NdsSeparator, NdsThinkingIndicator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o MESMO indicador: o que muda é se a espera chega em
         palavra a quem não vê os pontos se mexerem. -->
    <ng-template #tplDoDont1Do>
      <p ndsThinkingIndicator [label]="generating()"></p>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: a frase apagada, e o que sobra para quem ouve a tela
           é silêncio — os pontos são desenho, e desenho não se lê. -->
      <p ndsThinkingIndicator label=""></p>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <nds-markdown [content]="question" />
        <nds-markdown [content]="answer" />
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: o indicador continua ao lado do texto que já chegou,
           dizendo que se espera pelo que já veio. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <nds-markdown [content]="question" />
        <nds-markdown [content]="answer" />
        <p ndsThinkingIndicator [label]="generating()"></p>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="thinking-indicator"
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
          componentSlug="thinking-indicator"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, três
                 lugares empilhados viram um só, e o assunto da demonstração é
                 justamente a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.waiting') }}</p>
              <div class="nds-stack nds-w-full" data-spacing="sm">
                <nds-markdown [content]="question" />
                <p ndsThinkingIndicator [label]="generating()"></p>
              </div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.arrived') }}</p>
              <div class="nds-stack nds-w-full" data-spacing="sm">
                <nds-markdown [content]="question" />
                <nds-markdown [content]="answer" />
              </div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.withComposer') }}</p>
              <div class="nds-stack nds-w-full" data-spacing="sm">
                <!-- Outra frase para a mesma espera, de propósito: o desenho é o
                     mesmo, e o que muda é o que o consumidor manda dizer. -->
                <p ndsThinkingIndicator [label]="searching()"></p>
                <!-- O campo é quem oferece o que fazer a respeito da espera; o
                     indicador só diz que a resposta vem. -->
                <nds-composer [labels]="fieldLabels()" [running]="true" />
              </div>
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
          [secondaryDescription]="t('import.arrival')"
          [secondaryCode]="t('import.arrivalCode')"
          componentSlug="thinking-indicator"
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
          componentSlug="thinking-indicator"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="thinking-indicator"
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
export class NdsThinkingIndicatorDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /** A fala é dado de exemplo: ela não muda com o idioma da documentação. */
  protected readonly question = questionText();
  protected readonly answer = answerText();

  /** As frases SÃO texto de interface, então acompanham a troca de idioma. */
  protected readonly generating = computed(() => {
    dict();
    return generatingLabel();
  });

  protected readonly searching = computed(() => {
    dict();
    return searchingLabel();
  });

  protected readonly fieldLabels = computed<ComposerLabels>(() => {
    dict();
    return composerLabels();
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
      // As linhas são NOMEADAS, e não numeradas: o que as distingue é o assunto,
      // e `item3` não diria qual é.
      items: ['phrase', 'verb', 'length', 'promise'].map((key) => ({
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
    return ['waiting', 'arrived', 'reducedMotion'].map((k) => ({
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
        // O título nomeia o que se ESCREVE: o atributo no parágrafo, e não um
        // elemento próprio, porque a raiz é o parágrafo.
        title: 'p[ndsThinkingIndicator]',
        cols,
        items: ['label', 'class'].map((k) => ({
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
      'spacing2', 'spacing1', 'radiusFull',
      'mutedForeground', 'durationSlow', 'easeStandard',
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
      { key: 'agentStatus', path: '?path=/docs/primitives-conversational-agentstatus--docs' },
      { key: 'chatThread',  path: '?path=/docs/primitives-conversational-chatthread--docs' },
      { key: 'skeleton',    path: '?path=/docs/primitives-feedback-skeleton--docs' },
      { key: 'progress',    path: '?path=/docs/primitives-feedback-progress--docs' },
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
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
      items: [1, 2, 3, 4, 5].map((i) => ({
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
      items: [1, 2, 3, 4, 5].map((i) => ({
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
        componentSlug: 'thinking-indicator',
      });
      track('docs_page_view', {
        component_name: 'thinking-indicator',
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
          component_name: 'thinking-indicator',
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
