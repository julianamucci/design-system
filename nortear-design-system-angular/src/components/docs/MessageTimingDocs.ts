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
import {
  NdsMessageTiming,
  type MessageTimingLabels,
} from '@/components/ui/message-timing';
import {
  messageTimingLabels,
  statsOf,
} from '@/components/ui/message-timing.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import messageTimingTranslations from '@shared/content/message-timing/translations.json';

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

// SEM OVERRIDE NENHUM, e a ausência é o registro.
//
// Os nomes da `translations.json` — `stats`, `streaming`, `labels`, `label`,
// `value`, `title`, `measuring` — são exatamente os que esta stack expõe, e o
// tipo de `stats` segue o precedente da peça irmã da repartição, que declara
// `readonly ContextPart[]` no componente e mantém `ContextPart[]` na tabela: a
// marca de somente leitura é do produtor, não do contrato de quem consome.
//
// A DESCRIÇÃO nunca se sobrescreve: ela já é neutra de API, e vontade de mexer
// nela seria sinal de que o texto compartilhado nomeia a API de alguma stack —
// e o conserto seria lá, não aqui. Nunca um snippet `*Code` em override: ele
// ficaria preso a uma stack, invisível ao conteúdo compartilhado.
const { t, dict } = useTranslation(messageTimingTranslations as Record<string, unknown>);

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
  '// As três entradas do <div ndsMessageTiming>. Não há saída nenhuma: a peça',
  '// não decide nada, então não tem o que relatar.',
  'export class NdsMessageTiming {',
  '  readonly stats = input.required<readonly MessageTimingStat[]>();',
  '  readonly streaming = input(false);   // a medição ainda anda?',
  '  readonly labels = input.required<MessageTimingLabels>();',
  '}',
  '',
  '// O par é o que faz uma medição: valor sem termo é um número solto na linha,',
  '// e termo sem valor é uma pergunta sem resposta.',
  'export interface MessageTimingStat {',
  '  label: string;              // o que foi medido',
  '  value: string;              // quanto deu, JÁ ESCRITO',
  '}',
  '',
  'export interface MessageTimingLabels {',
  '  title: string;              // de que medição se trata; só para quem ouve',
  '  measuring: string;          // a palavra que diz que ela ainda não acabou',
  '}',
  '',
  '// NÃO HÁ CONTA A IMPORTAR, e a ausência é o desenho: tempo não tem teto,',
  '// então não há fração para tirar, limiar para comparar nem nível para nomear.',
  '// As quatro medições irmãs leem @shared/primitives/token-budget; esta não lê',
  '// nada, porque tudo o que ela mostra já chegou escrito.',
].join('\n');

/**
 * As duas medidas escritas à mão do contraexemplo.
 *
 * Ponto decimal, unidade colada e nenhuma das duas trocando com o idioma de quem
 * lê — que é exatamente o que a peça não tem como consertar.
 */
const HANDWRITTEN = { firstToken: '420ms', total: '1.24s' } as const;

@Component({
  selector: 'nds-message-timing-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsMessageTiming, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- AS MESMAS medidas parciais nos dois lados do primeiro par: o que muda é
         a ressalva chegar. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsMessageTiming
          [stats]="measuringStats()"
          [streaming]="true"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: a medição ainda corre, mas nada diz isso. O total
           parcial se lê como final, e nada na tela parece errado. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsMessageTiming
          [stats]="measuringStats()"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsMessageTiming
          [stats]="partialStats()"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: as medidas escritas à mão, com ponto decimal e
           unidade colada, iguais em todos os idiomas. -->
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsMessageTiming
          [stats]="handwrittenStats()"
          [labels]="labels()"
        ></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="message-timing"
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
          componentSlug="message-timing"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 linhas de números empilhadas viram uma só, e o assunto da
                 demonstração é justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.settled') }}</p>
              <div
                ndsMessageTiming
                [stats]="settledStats()"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.measuring') }}</p>
              <div
                ndsMessageTiming
                [stats]="measuringStats()"
                [streaming]="true"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.partial') }}</p>
              <div
                ndsMessageTiming
                [stats]="partialStats()"
                [labels]="labels()"
              ></div>
            </div>

            <div ndsSeparator></div>

            <!-- O quarto exemplo é o MESMO dado do primeiro num container
                 estreito: é assim que se vê que a forma é do container, e não um
                 argumento da peça. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.tight') }}</p>
              <div class="nds-max-w-3xs">
                <div
                  ndsMessageTiming
                  [stats]="settledStats()"
                  [labels]="labels()"
                ></div>
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
          [secondaryDescription]="t('import.withLabels')"
          [secondaryCode]="t('import.withLabelsCode')"
          componentSlug="message-timing"
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
          componentSlug="message-timing"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="message-timing"
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
export class NdsMessageTimingDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /**
   * As medidas de cada exemplo, JÁ ESCRITAS.
   *
   * Dependem do IDIOMA — o separador decimal e a abreviatura da unidade trocam
   * com quem lê —, e por isso são derivadas do dicionário, e não constantes de
   * módulo.
   */
  protected readonly settledStats = computed(() => {
    dict();
    return statsOf('settled');
  });

  protected readonly measuringStats = computed(() => {
    dict();
    return statsOf('measuring');
  });

  protected readonly partialStats = computed(() => {
    dict();
    return statsOf('partial');
  });

  /** As duas medidas do contraexemplo, congeladas num idioma só de propósito. */
  protected readonly handwrittenStats = computed(() => {
    dict();
    return [
      { label: t('labels.stats.firstToken'), value: HANDWRITTEN.firstToken },
      { label: t('labels.stats.total'), value: HANDWRITTEN.total },
    ];
  });

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<MessageTimingLabels>(() => {
    dict();
    return messageTimingLabels();
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
      items: ['title', 'measuring', 'statLabel', 'statValue'].map((key) => ({
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
    // Só um destes é um estado que a peça guarda — a medição em andamento. Os
    // outros três são o que a mesma linha faz conforme quantas medidas
    // chegaram.
    return ['settled', 'measuring', 'partial', 'empty'].map((k) => ({
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
      { title: 'NdsMessageTiming', cols, items: rowsOf(['stats', 'streaming', 'labels']) },
      { title: 'MessageTimingStat', cols, items: rowsOf(['statLabel', 'statValue']) },
      {
        title: 'MessageTimingLabels',
        cols,
        items: rowsOf(['labelsTitle', 'labelsMeasuring']),
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
      'spacing1', 'spacing2', 'spacing3',
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
      { key: 'agentStatus',    path: '?path=/docs/components-conversational-agentstatus--docs'    },
      { key: 'contextDisplay', path: '?path=/docs/components-conversational-contextdisplay--docs' },
      { key: 'chatThread',     path: '?path=/docs/components-conversational-chatthread--docs'     },
      { key: 'tooltip',        path: '?path=/docs/components-overlay-tooltip--docs'               },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        componentSlug: 'message-timing',
      });
      track('docs_page_view', {
        component_name: 'message-timing',
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
          component_name: 'message-timing',
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
