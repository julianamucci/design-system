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
import { NdsInlineCitation, type InlineCitationLabels } from '@/components/ui/inline-citation';
import {
  citationOf,
  inlineCitationLabels,
  sentenceParts,
  sentenceSlots,
  type InlineCitationSlot,
} from '@/components/ui/inline-citation.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import type { Citation } from '@shared/primitives/chat-protocol';
import uiTranslations from '@/i18n/ui.json';
import inlineCitationTranslations from '@shared/content/inline-citation/translations.json';

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

// O OVERRIDE TROCA O NOME, E O TIPO — NUNCA A DESCRIÇÃO.
//
// O conteúdo compartilhado documenta a saída como `onOpenChange`, que é o nome
// da propriedade nas stacks em que ela é uma função passada por argumento. Aqui
// ela é um `output`, e o prefixo `on` é do LISTENER: `(openChange)="…"`. Um
// output chamado `onOpenChange` viraria `(onOpenChange)` no ponto de uso, que é
// o mesmo defeito que a linha do estado da execução já registrou com `action`.
//
// A DESCRIÇÃO fica intocada: ela é neutra de API e continua verdadeira — a peça
// devolve cada abertura e cada fechamento, e é por aí que a página fecha a
// prévia irmã. E nada de snippet `*Code` aqui: ele ficaria preso a esta stack e
// invisível para o conteúdo compartilhado.
const { t, dict } = useTranslation(inlineCitationTranslations as Record<string, unknown>, {
  '*': {
    'props.table.onOpenChange.name': 'openChange',
    'props.table.onOpenChange.type': 'OutputEmitterRef<boolean>',
  },
});

// Esta peça não tem eixo de forma, e o conteúdo compartilhado não traz seção de
// variantes: ela não existe nem na navegação nem na página.
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

const INTERFACE_CODE = `// As quatro entradas da peça, no <span ndsInlineCitation>
export class NdsInlineCitation {
  readonly citation = input.required<Citation>();     // a fonte, o trecho e onde dentro dela
  readonly index = input.required<number>();          // o número que a marca mostra
  readonly labels = input.required<InlineCitationLabels>();
  readonly defaultOpen = input(false);                // nasce com a prévia aberta

  // Cada abertura e cada fechamento. O prefixo "on" é do LISTENER nesta stack —
  // no ponto de uso isto se escreve (openChange)="fecharAsOutras($event)".
  readonly openChange = output<boolean>();

  // O COMANDO. É a forma que esta stack tem de ser controlada: quem controla
  // alcança a peça por viewChild/viewChildren e chama o método. É esse par —
  // evento de volta, comando de ida — que resolve a exclusão mútua entre marcas,
  // que a peça não resolve sozinha porque não conhece as vizinhas.
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
}

// O VOCABULÁRIO NÃO É DAQUI. Citation e ChatSource vêm de
// @shared/primitives/chat-protocol, e é lá que está escrito por que o trecho
// mora na CITAÇÃO e não na fonte: a mesma fonte apoia afirmações diferentes.
export interface Citation {
  source: ChatSource;         // o documento
  excerpt?: string;           // o texto citado, como saiu da fonte
  anchor?: string;            // onde dentro dele — página, âncora, linhas
}

export interface InlineCitationLabels {
  marker: string;             // o nome acessível, já escrito, com o número dentro
  unsafeSource: string;       // o que se diz no lugar de um endereço recusado
}`;

@Component({
  selector: 'nds-inline-citation-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsInlineCitation, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  // A FRASE É MONTADA AQUI, e não pelo componente: é a demonstração do contrato
  // — quem escreve a frase decide onde a afirmação precisa de apoio. Nenhum
  // pedaço termina em espaço, e as emendas do template encostam de propósito: é
  // assim que a marca não se separa da palavra que a antecede na quebra de linha.
  template: `
    <!-- O primeiro par é o do NOME ACESSÍVEL: a mesma citação dos dois lados, e
         o que muda é só o que quem ouve recebe. Quem vê não nota diferença
         nenhuma, e é esse o ponto. -->
    <ng-template #tplDoDont1Do>
      <p>{{ antes }}<span
          ndsInlineCitation
          [citation]="full"
          [index]="1"
          [labels]="fullLabels()"
        ></span>{{ depois }}</p>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <p>{{ antes }}<span
          ndsInlineCitation
          [citation]="full"
          [index]="1"
          [labels]="numberOnlyLabels()"
        ></span>{{ depois }}</p>
    </ng-template>

    <!-- O segundo par é o do que NÃO veio: a citação mínima desenhada como ela
         é, e a mesma com um traço no lugar do trecho e do lugar. O traço afirma
         que existe um trecho vazio, que é pior do que não dizer nada. -->
    <ng-template #tplDoDont2Do>
      <p>{{ antes }}<span
          ndsInlineCitation
          [citation]="minimal"
          [index]="1"
          [labels]="minimalLabels()"
          [defaultOpen]="true"
        ></span>{{ depois }}</p>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <p>{{ antes }}<span
          ndsInlineCitation
          [citation]="dashed"
          [index]="1"
          [labels]="minimalLabels()"
          [defaultOpen]="true"
        ></span>{{ depois }}</p>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="inline-citation"
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
          componentSlug="inline-citation"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 frases quase iguais viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O primeiro é o único fechado, e é ele que mostra a peça como ela
                 vive: duas marcas dentro de uma frase, à espera de quem lê. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.inSentence') }}</p>
              <div>
                <p>{{ antes }}@for (slot of slots; track slot.index) {<span
                      ndsInlineCitation
                      [citation]="slot.citation"
                      [index]="slot.index"
                      [labels]="slot.labels"
                    ></span>{{ slot.tail }}}</p>
              </div>
            </div>

            <div ndsSeparator></div>

            <!-- Os três seguintes nascem abertos, e por isso ganham folga: a
                 caixa é posicionada FORA do fluxo, então sem altura reservada
                 ela cobriria a legenda do exemplo seguinte. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.open') }}</p>
              <div class="nds-min-h-50">
                <p>{{ antes }}<span
                    ndsInlineCitation
                    [citation]="full"
                    [index]="1"
                    [labels]="fullLabels()"
                    [defaultOpen]="true"
                  ></span>{{ depois }}</p>
              </div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.minimal') }}</p>
              <div class="nds-min-h-50">
                <p>{{ antes }}<span
                    ndsInlineCitation
                    [citation]="minimal"
                    [index]="1"
                    [labels]="minimalLabels()"
                    [defaultOpen]="true"
                  ></span>{{ depois }}</p>
              </div>
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.unsafe') }}</p>
              <div class="nds-min-h-50">
                <p>{{ antes }}<span
                    ndsInlineCitation
                    [citation]="unsafe"
                    [index]="1"
                    [labels]="unsafeLabels()"
                    [defaultOpen]="true"
                  ></span>{{ depois }}</p>
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
          componentSlug="inline-citation"
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
          componentSlug="inline-citation"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="inline-citation"
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
export class NdsInlineCitationDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  /**
   * A frase das fotos, partida onde as marcas entram.
   *
   * Dado, e por isso a mesma nos três idiomas: a frase é a fala da demonstração,
   * e é ela que garante que as cinco stacks fotografem o mesmo parágrafo.
   */
  protected readonly antes = sentenceParts()[0]!;
  protected readonly depois = sentenceParts()[1]! + sentenceParts()[2]!;

  /** As três citações que a peça desenha diferente. */
  protected readonly full = citationOf('full');
  protected readonly minimal = citationOf('minimal');
  protected readonly unsafe = citationOf('unsafe');

  /**
   * O contraexemplo do segundo par: um traço no lugar do que não veio.
   *
   * A prévia passa a AFIRMAR que existe um trecho vazio, e afirmar isso é pior
   * do que não dizer nada. A citação é montada aqui porque não há entrada que
   * produza o defeito — a peça simplesmente não monta o que não recebeu.
   */
  protected readonly dashed: Citation = {
    source: this.minimal.source,
    excerpt: '—',
    anchor: '—',
  };

  /** As duas marcas da frase da demonstração, já numeradas. */
  protected readonly slots: InlineCitationSlot[] = sentenceSlots();

  // Os rótulos são texto de interface, então acompanham a troca de idioma.
  protected readonly fullLabels = computed<InlineCitationLabels>(() => {
    dict();
    return inlineCitationLabels(1, this.full);
  });

  protected readonly minimalLabels = computed<InlineCitationLabels>(() => {
    dict();
    return inlineCitationLabels(1, this.minimal);
  });

  protected readonly unsafeLabels = computed<InlineCitationLabels>(() => {
    dict();
    return inlineCitationLabels(1, this.unsafe);
  });

  /**
   * O contraexemplo do primeiro par: o nome acessível é o número.
   *
   * "1" não descreve fonte nenhuma, e quem vê não nota diferença alguma em
   * relação ao exemplo certo — é exatamente esse o assunto do par.
   */
  protected readonly numberOnlyLabels = computed<InlineCitationLabels>(() => {
    dict();
    return { marker: '1', unsafeSource: t('labels.unsafeSource') };
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
      items: [1, 2, 3, 4, 5, 6].map((i) => t(`usage.guidelines.item${i}`)),
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
      items: ['marker', 'unsafeSource', 'sourceTitle', 'anchor'].map((key) => ({
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
    // Só os dois primeiros são estados que a peça guarda — recolhida e
    // expandida. Os outros dois são o que a MESMA prévia faz conforme o que a
    // citação trouxe.
    return ['closed', 'open', 'minimal', 'unsafe'].map((k) => ({
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
        title: 'NdsInlineCitation',
        cols,
        items: rowsOf(['citation', 'index', 'defaultOpen', 'onOpenChange', 'labels']),
      },
      {
        title: 'Citation',
        cols,
        items: rowsOf(['citationSource', 'citationExcerpt', 'citationAnchor']),
      },
      { title: 'ChatSource', cols, items: rowsOf(['sourceTitle', 'sourceUrl']) },
      {
        title: 'InlineCitationLabels',
        cols,
        items: rowsOf(['labelsMarker', 'labelsUnsafeSource']),
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
      'muted', 'foreground', 'primary', 'primaryForeground', 'ring',
      'sizeXs', 'radiusSm', 'textLabel',
      'textControlSm', 'spacing2', 'mutedForeground', 'border',
    ].map((k) => ({
      token: t(`tokens.table.${k}.token`),
      value: t(`tokens.table.${k}.value`),
      description: toPlainText(t(`tokens.table.${k}.description`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',            description: toPlainText(t('accessibility.keyboard.tab'))    },
      { key: 'Enter / Space',  description: toPlainText(t('accessibility.keyboard.enter'))  },
      { key: 'Escape',         description: toPlainText(t('accessibility.keyboard.escape')) },
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
      { key: 'hoverCard',  path: '?path=/docs/primitives-overlay-hovercard--docs'         },
      { key: 'popover',    path: '?path=/docs/primitives-overlay-popover--docs'           },
      { key: 'tooltip',    path: '?path=/docs/primitives-overlay-tooltip--docs'           },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
      title: '',
      content: t(`notes.item${i}`),
    }));
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
      items: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
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
        componentSlug: 'inline-citation',
      });
      track('docs_page_view', {
        component_name: 'inline-citation',
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
          component_name: 'inline-citation',
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
