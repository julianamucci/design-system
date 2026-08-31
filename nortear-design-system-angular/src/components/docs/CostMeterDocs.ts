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
import { NdsCostMeter, type CostMeterLabels } from '@/components/ui/cost-meter';
import { amountOf, budgetOf, costMeterLabels } from '@/components/ui/cost-meter.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import { BUDGET_LEVELS } from '@shared/primitives/token-budget';
import uiTranslations from '@/i18n/ui.json';
import costTranslations from '@shared/content/cost-meter/translations.json';

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

// Nenhum override de nome de propriedade: `amount`, `budget` e `labels` se
// chamam assim nas cinco stacks, e esta peça não tem evento — não há o que
// renomear para o caminho desta stack, como o `output()` do estado da execução
// exigiu. E nunca um snippet `*Code` em override: ele ficaria preso a uma stack,
// invisível ao conteúdo compartilhado.
const { t, dict } = useTranslation(costTranslations as Record<string, unknown>);

// Sem seção de variantes: esta peça não tem eixo de variantes, e a
// `translations.json` compartilhada não declara nenhum. Ela não existe nem na
// navegação nem na página.
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
    { id: 'importacao',   labelKey: 'nav.import' },
    { id: 'estados',      labelKey: 'nav.states' },
    { id: 'propriedades', labelKey: 'nav.props'  },
    { id: 'tokens',       labelKey: 'nav.tokens' },
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

const INTERFACE_CODE = [
  '// As três entradas do <p ndsCostMeter>. Não há saída nenhuma: a peça é só',
  '// leitura, e nada nela pede coisa alguma a quem consome.',
  'export class NdsCostMeter {',
  '  readonly amount = input.required<string>();   // o que custou, JÁ ESCRITO',
  '  readonly budget = input<CostBudget>();        // ausente é "não há teto"',
  '  readonly labels = input.required<CostMeterLabels>();',
  '}',
  '',
  '// O teto anda em PAR: a quantia escrita e a fração já calculada. Como duas',
  '// propriedades soltas existiria o estado meio declarado — teto escrito sem',
  '// medidor, ou medidor sem teto escrito.',
  'export interface CostBudget {',
  '  amount: string;         // o teto, JÁ ESCRITO',
  '  fraction: number;       // de 0 a 1, sobre o teto — número puro, sem moeda',
  '}',
  '',
  'export interface CostMeterLabels {',
  '  title: string;                      // de que custo se trata; só para quem ouve',
  '  level: Record<BudgetLevel, string>; // a palavra de cada nível',
  '  of: string;                         // liga a fração ao teto',
  '  unbounded: string;                  // o que dizer sem teto declarado',
  '}',
  '',
  '// A conta vem de @shared/primitives/token-budget, e é a MESMA que a medição',
  '// da janela lê — é isso que faz a palavra do nível querer dizer o mesmo nas',
  '// duas:',
  '//   spentFraction(gasto, teto)   // de 0 a 1, ou null quando não há teto',
  "//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'",
  '//   fractionPercent(fracao)      // inteiro travado nas duas pontas',
].join('\n');

/**
 * A quantia escrita à mão do contraexemplo.
 *
 * Ponto decimal, moeda por extenso e nenhuma das duas trocando com o idioma de
 * quem lê — que é exatamente o que a peça não tem como consertar.
 */
const HANDWRITTEN_AMOUNT = '0.84 USD';
const HANDWRITTEN_BUDGET = { amount: '1 USD', fraction: 0.84 };

@Component({
  selector: 'nds-cost-meter-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsCostMeter, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O MESMO gasto nos dois lados do primeiro par: o que muda é o teto
         chegar junto. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p
          ndsCostMeter
          [amount]="amount().warning"
          [budget]="budget().warning"
          [labels]="labels()"
        ></p>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: o teto existe, mas não é passado. A peça só pode
           dizer o que custou, e a notícia de que o gasto está perto do limite
           se perde — sem que nada pareça errado na tela. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p ndsCostMeter [amount]="amount().warning" [labels]="labels()"></p>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p
          ndsCostMeter
          [amount]="amount().warning"
          [budget]="budget().warning"
          [labels]="labels()"
        ></p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: a quantia escrita à mão, sem o símbolo nem o
           separador de quem lê, e igual em todos os idiomas. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p
          ndsCostMeter
          [amount]="handwrittenAmount"
          [budget]="handwrittenBudget"
          [labels]="labels()"
        ></p>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="cost-meter"
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
          componentSlug="cost-meter"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 linhas empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.normal') }}</p>
              <p
                ndsCostMeter
                [amount]="amount().normal"
                [budget]="budget().normal"
                [labels]="labels()"
              ></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.threshold') }}</p>
              <p
                ndsCostMeter
                [amount]="amount().threshold"
                [budget]="budget().threshold"
                [labels]="labels()"
              ></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.over') }}</p>
              <p
                ndsCostMeter
                [amount]="amount().over"
                [budget]="budget().over"
                [labels]="labels()"
              ></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.unbounded') }}</p>
              <p ndsCostMeter [amount]="amount().unbounded" [labels]="labels()"></p>
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
          [secondaryDescription]="t('import.withLabels')"
          [secondaryCode]="t('import.withLabelsCode')"
          componentSlug="cost-meter"
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
          componentSlug="cost-meter"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="cost-meter"
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
export class NdsCostMeterDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly handwrittenAmount = HANDWRITTEN_AMOUNT;
  protected readonly handwrittenBudget = HANDWRITTEN_BUDGET;

  /**
   * As quantias dos exemplos, já escritas.
   *
   * Elas dependem do IDIOMA — o símbolo troca de ponta entre um e outro —, e por
   * isso são derivadas do dicionário, e não constantes de módulo.
   */
  protected readonly amount = computed(() => {
    dict();
    return {
      normal: amountOf('normal'),
      threshold: amountOf('threshold'),
      warning: amountOf('warning'),
      over: amountOf('over'),
      unbounded: amountOf('unbounded'),
    };
  });

  /**
   * O teto de cada exemplo — a quantia escrita e a fração já calculada.
   *
   * Também derivado do dicionário, e pelo mesmo motivo do gasto: a quantia do
   * teto é escrita, e o idioma decide como.
   */
  protected readonly budget = computed(() => {
    dict();
    return {
      normal: budgetOf('normal'),
      threshold: budgetOf('threshold'),
      warning: budgetOf('warning'),
      over: budgetOf('over'),
    };
  });

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<CostMeterLabels>(() => {
    dict();
    return costMeterLabels();
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
      items: ['title', 'level', 'unbounded'].map((key) => ({
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
    // Nenhum destes é um estado que a peça guarda: são as cinco respostas que a
    // mesma linha dá conforme o que a conta devolve. Os três primeiros saem do
    // primitivo compartilhado; os dois últimos são situações que o nível não
    // modela — passar do teto e não ter teto.
    return [...BUDGET_LEVELS, 'over', 'unbounded'].map((k) => ({
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
      { title: 'NdsCostMeter', cols, items: rowsOf(['amount', 'budget', 'labels']) },
      { title: 'CostBudget', cols, items: rowsOf(['budgetAmount', 'budgetFraction']) },
      {
        title: 'CostMeterLabels',
        cols,
        items: rowsOf(['labelsTitle', 'labelsLevel', 'labelsOf', 'labelsUnbounded']),
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
      'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
      'primary', 'warning', 'destructive', 'muted', 'spacing2', 'radiusFull',
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
    // Uma linha só, e é honesto: não há controle nesta peça. Listar Enter e
    // setas para dizer que não fazem nada seria encher a tabela com ausências.
    return [{ key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) }];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'contextDisplay',   path: '?path=/docs/primitives-conversational-contextdisplay--docs'   },
      { key: 'contextBreakdown', path: '?path=/docs/primitives-conversational-contextbreakdown--docs' },
      { key: 'agentStatus',      path: '?path=/docs/primitives-conversational-agentstatus--docs'      },
      { key: 'progress',         path: '?path=/docs/primitives-feedback-progress--docs'               },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        componentSlug: 'cost-meter',
      });
      track('docs_page_view', {
        component_name: 'cost-meter',
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
          component_name: 'cost-meter',
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
