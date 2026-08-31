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
import {
  NdsContextDisplay,
  CONTEXT_DISPLAY_FORMS,
  type ContextDisplayLabels,
} from '@/components/ui/context-display';
import { contextDisplayLabels, usageOf } from '@/components/ui/context-display.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import { BUDGET_LEVELS, type BudgetLevel } from '@shared/primitives/token-budget';
import uiTranslations from '@/i18n/ui.json';
import contextTranslations from '@shared/content/context-display/translations.json';

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

// Nenhum override de nome de propriedade: `usage`, `form` e `labels` se chamam
// assim nas cinco stacks, e esta peça não tem evento — não há o que renomear
// para o caminho desta stack, como o `output()` do estado da execução exigiu.
const { t, dict } = useTranslation(contextTranslations as Record<string, unknown>);

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

const INTERFACE_CODE = `// As três entradas do <p ndsContextDisplay>. Não há saída nenhuma: a peça é só
// leitura, e nada nela pede coisa alguma a quem consome.
export class NdsContextDisplay {
  readonly usage = input.required<TokenUsage>();
  readonly form = input<ContextDisplayForm>('ring');
  readonly labels = input.required<ContextDisplayLabels>();
}

export interface ContextDisplayLabels {
  title: string;                        // o nome da medida, fora da tela
  level: Record<BudgetLevel, string>;   // a palavra de cada nível
  of: string;                           // liga o consumido ao teto
  unit: string;                         // o que está sendo contado
  unbounded: string;                    // o que dizer sem teto conhecido
}

// O dado vem de @shared/primitives/chat-protocol. O total é FUNÇÃO, e nunca
// campo: total guardado pode discordar da soma.
interface TokenUsage {
  input: number;
  output: number;
  limit?: number;   // sem ele não há fração, só contagem
}

// A conta vem de @shared/primitives/token-budget, e o nível com ela:
type BudgetLevel = 'normal' | 'warning' | 'critical';

// A forma é escolha de espaço, e não de significado.
export type ContextDisplayForm = 'ring' | 'bar' | 'text';`;

/**
 * As medições dos exemplos. Dado, e por isso as mesmas nos três idiomas.
 *
 * `empty` não vem do andaime: ela existe só para o contraexemplo do segundo par,
 * onde a ausência de teto é desenhada como se o teto fosse conhecido e nada
 * tivesse sido gasto.
 */
const USAGE = {
  normal: usageOf('normal'),
  warning: usageOf('warning'),
  critical: usageOf('critical'),
  unbounded: usageOf('unbounded'),
  empty: { input: 0, output: 0, limit: 32_000 },
};

@Component({
  selector: 'nds-context-display-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsContextDisplay, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o MESMO par de níveis: o que muda é se a palavra chega
         a quem não vê a cor do medidor. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p ndsContextDisplay [usage]="usage.normal" [labels]="labels()"></p>
        <p ndsContextDisplay [usage]="usage.critical" [labels]="labels()"></p>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: as palavras apagadas, e a diferença entre a janela
           com folga e a janela no limite passa a existir só na cor do anel. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p ndsContextDisplay [usage]="usage.normal" [labels]="wordless()"></p>
        <p ndsContextDisplay [usage]="usage.critical" [labels]="wordless()"></p>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p ndsContextDisplay [usage]="usage.unbounded" [labels]="labels()"></p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: a MESMA medição sem teto, desenhada como se o teto
           fosse conhecido e nada tivesse sido gasto. É o que sai de tratar a
           ausência de teto como um zero — um anel vazio e "0%", que é o oposto
           de "não se sabe quanto cabe". -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p ndsContextDisplay [usage]="usage.empty" [labels]="labels()"></p>
      </div>
    </ng-template>

    <ng-template #tplVarRing>
      <p ndsContextDisplay [usage]="usage.warning" form="ring" [labels]="labels()"></p>
    </ng-template>
    <ng-template #tplVarBar>
      <p ndsContextDisplay [usage]="usage.warning" form="bar" [labels]="labels()"></p>
    </ng-template>
    <ng-template #tplVarText>
      <p ndsContextDisplay [usage]="usage.warning" form="text" [labels]="labels()"></p>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="context-display"
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
          componentSlug="context-display"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 blocos empilhados viram um só, e o assunto da demonstração é
                 justamente a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.ring') }}</p>
              <p ndsContextDisplay [usage]="usage.warning" form="ring" [labels]="labels()"></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.bar') }}</p>
              <p ndsContextDisplay [usage]="usage.warning" form="bar" [labels]="labels()"></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.text') }}</p>
              <p ndsContextDisplay [usage]="usage.warning" form="text" [labels]="labels()"></p>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.unbounded') }}</p>
              <p ndsContextDisplay [usage]="usage.unbounded" [labels]="labels()"></p>
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
          componentSlug="context-display"
          language="html"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="context-display"
          id="variantes"
          language="ts"
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
          componentSlug="context-display"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="context-display"
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
export class NdsContextDisplayDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly usage = USAGE;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ContextDisplayLabels>(() => {
    dict();
    return contextDisplayLabels();
  });

  /**
   * O contraexemplo do primeiro par: o nível que só existe na cor do medidor.
   *
   * As palavras saem de `BUDGET_LEVELS`, e não de três linhas escritas à mão —
   * mesma razão da tabela de estados logo abaixo.
   */
  protected readonly wordless = computed<ContextDisplayLabels>(() => ({
    ...this.labels(),
    level: BUDGET_LEVELS.reduce((acc, level) => {
      acc[level] = '';
      return acc;
    }, {} as Record<BudgetLevel, string>),
  }));

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarRing = viewChild.required<TemplateRef<unknown>>('tplVarRing');
  private readonly tplVarBar = viewChild.required<TemplateRef<unknown>>('tplVarBar');
  private readonly tplVarText = viewChild.required<TemplateRef<unknown>>('tplVarText');

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
      items: ['name', 'level', 'unit', 'unbounded'].map((key) => ({
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

  /**
   * As três formas, na ordem do componente.
   *
   * A lista sai de `CONTEXT_DISPLAY_FORMS`: a seção e a story de formas leem a
   * mesma lista, e nenhuma das duas fica para trás quando o tipo cresce.
   */
  protected readonly variantItems = computed(() => {
    dict();
    const previews: Record<string, TemplateRef<unknown>> = {
      ring: this.tplVarRing(),
      bar: this.tplVarBar(),
      text: this.tplVarText(),
    };
    return CONTEXT_DISPLAY_FORMS.map((form) => ({
      name: form,
      description: t(`variants.items.${form}.description`),
      code: t(`variants.items.${form}.variantCode`),
      trackId: form,
      preview: previews[form]!,
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
    // Os três níveis saem do primitivo compartilhado; os dois últimos são
    // situações que o nível não modela — passar do teto e não ter teto.
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
      {
        title: 'NdsContextDisplay',
        cols,
        items: rowsOf(['usage', 'form', 'labels']),
      },
      {
        title: 'ContextDisplayLabels',
        cols,
        items: rowsOf([
          'labelsTitle', 'labelsLevel', 'labelsOf', 'labelsUnit', 'labelsUnbounded',
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
      'sizeXs', 'spacing2', 'radiusFull',
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
      { key: 'agentStatus', path: '?path=/docs/primitives-conversational-agentstatus--docs' },
      { key: 'chatThread',  path: '?path=/docs/primitives-conversational-chatthread--docs'  },
      { key: 'progress',    path: '?path=/docs/primitives-feedback-progress--docs'          },
      { key: 'badge',       path: '?path=/docs/primitives-feedback-badge--docs'             },
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
        componentSlug: 'context-display',
      });
      track('docs_page_view', {
        component_name: 'context-display',
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
          component_name: 'context-display',
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
