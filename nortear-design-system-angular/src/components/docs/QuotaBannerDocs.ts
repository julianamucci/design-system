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
import { NdsQuotaBanner, type QuotaBannerLabels } from '@/components/ui/quota-banner';
import {
  quotaBannerActionLabel,
  quotaBannerLabels,
  quotaOf,
  renewalOf,
} from '@/components/ui/quota-banner.fixtures';
import { NdsButton } from '@/components/ui/button';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import quotaTranslations from '@shared/content/quota-banner/translations.json';

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

// Uma divergência de API, e ela se REGISTRA em vez de se "alinhar".
//
// Os controles chegam como `TemplateRef` nesta stack, e não como elementos
// prontos — é a mesma escolha que `actions` já faz no cartão de autorização e no
// `chat-thread`. A linha da tabela nomeia o que se escreve AQUI, senão quem
// copia procura por um tipo que não existe.
//
// O NOME não muda: `quota`, `renewsIn`, `actions` e `labels` se chamam assim nas
// cinco. E a DESCRIÇÃO fica intacta nas três, porque ela já é neutra de API —
// vontade de sobrescrevê-la seria sinal de que o texto compartilhado nomeia a
// API de alguma stack, e o conserto seria lá, não aqui. Nunca um snippet `*Code`
// em override: ele ficaria preso a uma stack, invisível ao conteúdo
// compartilhado.
const { t, dict } = useTranslation(quotaTranslations as Record<string, unknown>, {
  '*': {
    'props.table.actions.type': 'TemplateRef<unknown>[]',
  },
});

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
  '// As quatro entradas do <div ndsQuotaBanner>. Não há saída nenhuma: a faixa',
  '// não decide o que o controle faz, então não tem o que relatar.',
  'export class NdsQuotaBanner {',
  '  readonly quota = input.required<QuotaAllowance>();',
  '  readonly renewsIn = input<string>();                // ausente é "não renova"',
  '  readonly actions = input<readonly TemplateRef<unknown>[] | undefined>(undefined);',
  '  readonly labels = input.required<QuotaBannerLabels>();',
  '}',
  '',
  '// O teto é OBRIGATÓRIO aqui, ao contrário das medições irmãs: a cota É o teto,',
  '// e "quanto ainda resta" não tem resposta sem ele. Quem não tem teto não monta',
  '// a faixa.',
  'export interface QuotaAllowance {',
  '  used: number;               // quanto já foi usado',
  '  limit: number;              // o teto da cota',
  '}',
  '',
  'export interface QuotaBannerLabels {',
  '  title: string;                      // de qual cota se trata; só para quem ouve',
  '  unit: string;                       // o que está sendo contado',
  '  left: string;                       // a palavra que acompanha o resto',
  '  exhausted: string;                  // o que dizer quando não sobra nada',
  '  renews: string;                     // a palavra que antecede o horizonte',
  '  of: string;                         // liga o usado ao teto na razão',
  '  level: Record<BudgetLevel, string>; // a palavra de cada nível',
  '}',
  '',
  '// A conta vem de @shared/primitives/token-budget, e é a MESMA que as outras',
  '// medições leem — é isso que faz a palavra do nível querer dizer o mesmo em',
  '// todas elas:',
  '//   remainingUnits(uso, teto)    // o resto, nunca negativo',
  '//   spentFraction(uso, teto)     // de 0 a 1, ou null quando o teto não é teto',
  "//   fractionLevel(fracao)        // 'normal' | 'warning' | 'critical'",
  '//   fractionPercent(fracao)      // inteiro travado nas duas pontas',
].join('\n');

/**
 * O horizonte escrito à mão do contraexemplo.
 *
 * Ponto decimal, unidade por extenso e nenhuma das duas trocando com o idioma de
 * quem lê — que é exatamente o que a peça não tem como consertar.
 */
const HANDWRITTEN_HORIZON = '3.2 hours';

@Component({
  selector: 'nds-quota-banner-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsQuotaBanner, NdsButton, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O CONTROLE É DE QUEM CONSOME, e por isso ele nasce aqui: a página está
         no papel de quem monta a faixa. Nenhum manipulador — demonstrar a
         política seria demonstrar o que a peça não tem (§7 da guideline 17). -->
    <ng-template #demoAction>
      <button
        ndsButton
        type="button"
        variant="outline"
        size="sm"
      >{{ actionLabel() }}</button>
    </ng-template>

    <!-- O MESMO uso nos dois lados do primeiro par: o que muda é o horizonte
         chegar. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsQuotaBanner
          [quota]="quota().warning"
          [renewsIn]="horizon().warning"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: a cota renova, mas o horizonte não é passado. A faixa
           só pode dizer que está no fim, e esperar vira aposta — sem que nada
           pareça errado na tela. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsQuotaBanner [quota]="quota().warning" [labels]="labels()"></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsQuotaBanner
          [quota]="quota().warning"
          [renewsIn]="horizon().warning"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: o horizonte escrito à mão, com um formato que não
           muda com quem lê. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsQuotaBanner
          [quota]="quota().warning"
          [renewsIn]="handwrittenHorizon"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="quota-banner"
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
          componentSlug="quota-banner"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 caixas empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.normal') }}</p>
              <div
                ndsQuotaBanner
                [quota]="quota().normal"
                [renewsIn]="horizon().normal"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.threshold') }}</p>
              <div
                ndsQuotaBanner
                [quota]="quota().threshold"
                [renewsIn]="horizon().threshold"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <!-- O controle entra só onde ele muda alguma coisa — a cota
                 esgotada —, e é de propósito: repeti-lo nas quatro faria a
                 demonstração parecer que a faixa nasce com um botão, quando o
                 botão é de quem a monta. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.exhausted') }}</p>
              <div
                ndsQuotaBanner
                [quota]="quota().exhausted"
                [renewsIn]="horizon().exhausted"
                [actions]="[demoAction]"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.noRenewal') }}</p>
              <div
                ndsQuotaBanner
                [quota]="quota().noRenewal"
                [labels]="labels()"
              ></div>
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
          componentSlug="quota-banner"
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
          componentSlug="quota-banner"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="quota-banner"
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
export class NdsQuotaBannerDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly handwrittenHorizon = HANDWRITTEN_HORIZON;

  /**
   * As cotas dos exemplos.
   *
   * São NÚMEROS, e não dependeriam do idioma — mas ficam no mesmo formato dos
   * demais derivados para que a página inteira se redesenhe por um caminho só.
   */
  protected readonly quota = computed(() => {
    dict();
    return {
      normal: quotaOf('normal'),
      threshold: quotaOf('threshold'),
      warning: quotaOf('warning'),
      exhausted: quotaOf('exhausted'),
      noRenewal: quotaOf('noRenewal'),
    };
  });

  /**
   * O horizonte de cada exemplo, JÁ ESCRITO.
   *
   * Depende do IDIOMA — a abreviatura da hora e a do minuto trocam com quem lê
   * —, e por isso é derivado do dicionário, e não uma constante de módulo.
   */
  protected readonly horizon = computed(() => {
    dict();
    return {
      normal: renewalOf('normal'),
      threshold: renewalOf('threshold'),
      warning: renewalOf('warning'),
      exhausted: renewalOf('exhausted'),
    };
  });

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<QuotaBannerLabels>(() => {
    dict();
    return quotaBannerLabels();
  });

  /** A palavra do controle, que é de quem monta a faixa e não da peça. */
  protected readonly actionLabel = computed(() => {
    dict();
    return quotaBannerActionLabel();
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
    return [1, 2, 3, 4, 5, 6].map((i) => t(`anatomy.item${i}`));
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
      items: ['title', 'unit', 'left', 'exhausted'].map((key) => ({
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
    // mesma faixa dá conforme o que a conta devolve.
    return ['normal', 'warning', 'critical', 'exhausted', 'noRenewal'].map((k) => ({
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
        title: 'NdsQuotaBanner',
        cols,
        items: rowsOf(['quota', 'renewsIn', 'actions', 'labels']),
      },
      { title: 'QuotaAllowance', cols, items: rowsOf(['quotaUsed', 'quotaLimit']) },
      {
        title: 'QuotaBannerLabels',
        cols,
        items: rowsOf([
          'labelsTitle', 'labelsUnit', 'labelsLeft', 'labelsExhausted',
          'labelsRenews', 'labelsOf', 'labelsLevel',
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
      'textLabel', 'mutedForeground', 'foreground', 'fontWeightMedium',
      'primary', 'warning', 'destructive', 'muted',
      'spacing2', 'spacing3', 'spacing6', 'radius', 'radiusFull',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    // Duas linhas, e as duas são honestas: a faixa em si não tem controle, mas
    // os controles que chegam de fora entram na ordem de foco — e é aí que o
    // teclado tem o que fazer.
    return [
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'contextDisplay', path: '?path=/docs/components-conversational-contextdisplay--docs' },
      { key: 'costMeter',      path: '?path=/docs/components-conversational-costmeter--docs'      },
      { key: 'alert',          path: '?path=/docs/components-feedback-alert--docs'                },
      { key: 'progress',       path: '?path=/docs/components-feedback-progress--docs'             },
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
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
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
        componentSlug: 'quota-banner',
      });
      track('docs_page_view', {
        component_name: 'quota-banner',
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
          component_name: 'quota-banner',
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
