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
import { NdsComposerVoice, type ComposerVoiceLabels } from '@/components/ui/composer-voice';
import {
  SAMPLE_ELAPSED,
  SAMPLE_ELAPSED_DONE,
  SAMPLE_LEVEL,
  composerLabels,
  voiceLabels,
} from '@/components/ui/composer-voice.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import voiceTranslations from '@shared/content/composer-voice/translations.json';

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

// O retorno é `output()` nesta stack, e não um callback passado como
// propriedade. Divergência de API entre frameworks não se "alinha": cada stack
// usa a sua, e o conteúdo compartilhado descreve o CONCEITO. A linha da tabela
// nomeia o que se escreve AQUI, senão quem copia procura por um nome que não
// existe.
const { t, dict } = useTranslation(voiceTranslations as Record<string, unknown>, {
  '*': {
    'props.table.onToggle.name': 'toggle',
    'props.table.onToggle.type': 'OutputEmitterRef<ComposerVoiceIntent>',
  },
});

// Esta peça não tem seção de variantes nem de composições no conteúdo
// compartilhado, então elas não existem nem na navegação nem na página.
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

const INTERFACE_CODE = `// As entradas e a saída do <nds-composer-voice>
export class NdsComposerVoice {
  readonly labels = input.required<ComposerVoiceLabels>();
  readonly state = input<VoiceState>('idle');
  readonly level = input<number | undefined>(undefined);
  readonly elapsed = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);

  // O pedido é uma saída, e não um callback em propriedade: é o caminho desta
  // stack. Começar e parar de verdade continua sendo de quem capta.
  readonly toggle = output<ComposerVoiceIntent>();
}

export interface ComposerVoiceLabels {
  start: string;                        // o nome em repouso
  stop: string;                         // o nome do MESMO botão, ocupado
  status: Record<VoiceState, string>;   // a palavra de cada estado
}

// O estado vem de @shared/primitives/chat-protocol:
//   type VoiceState = 'idle' | 'recording' | 'transcribing'
//
// O pedido sai como INTENÇÃO, e não como estado novo — entre pedir para
// começar e estar captando existe uma permissão que só quem consome resolve:
export type ComposerVoiceIntent = 'start' | 'stop';`;

/** Os valores das demonstrações. Dado de exemplo não muda com o idioma. */
const LEVEL = SAMPLE_LEVEL;
const ELAPSED = SAMPLE_ELAPSED;
const ELAPSED_DONE = SAMPLE_ELAPSED_DONE;

@Component({
  selector: 'nds-composer-voice-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsComposer, NdsComposerVoice, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsStates, NdsDocsProps,
    NdsDocsTokens, NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes,
    NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O primeiro par é o MESMO controle captando: o que muda é se o estado
         chega em palavra a quem não vê o medidor. -->
    <ng-template #tplDoDont1Do>
      <nds-composer-voice
        [labels]="voiceText()"
        state="recording"
        [level]="level"
        [elapsed]="elapsed"
      />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- O contraexemplo: a palavra do estado apagada, e a diferença entre
           captando e parado passa a existir só no desenho do medidor. -->
      <nds-composer-voice
        [labels]="voiceWithoutWords()"
        state="recording"
        [level]="level"
        [elapsed]="elapsed"
      />
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nds-composer-voice
        [labels]="voiceText()"
        state="transcribing"
        [elapsed]="elapsedDone"
      />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: o alternador apagado e nenhum motivo escrito ao lado
           — a pergunta "por que não posso?" sem resposta na tela. -->
      <nds-composer-voice
        [labels]="voiceWithoutWords()"
        state="transcribing"
        [elapsed]="elapsedDone"
      />
    </ng-template>

    <!-- O controle onde ele de fato mora: o início do trilho do campo. -->
    <ng-template #tplRail>
      <nds-composer-voice
        [labels]="voiceText()"
        state="recording"
        [level]="level"
        [elapsed]="elapsed"
      />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="composer-voice"
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
          componentSlug="composer-voice"
        >
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL ponto está desenhado — sem ela, três
                 controles empilhados viram um só, e o assunto da demonstração é
                 justamente a diferença entre eles.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.idle') }}</p>
              <nds-composer-voice [labels]="voiceText()" state="idle" />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.recording') }}</p>
              <nds-composer-voice
                [labels]="voiceText()"
                state="recording"
                [level]="level"
                [elapsed]="elapsed"
              />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.transcribing') }}</p>
              <nds-composer-voice
                [labels]="voiceText()"
                state="transcribing"
                [elapsed]="elapsedDone"
              />
            </div>

            <div ndsSeparator></div>

            <div class="nds-stack nds-w-full" data-spacing="xs">
              <p class="nds-text-caption nds-text-muted-foreground">{{ t('demonstration.labels.inRail') }}</p>
              <!-- A referência do ng-template já É o TemplateRef dentro do
                   próprio template — ela não passa por viewChild, que existe
                   para quem precisa dele no TypeScript. -->
              <nds-composer [labels]="fieldLabels()" [railStart]="tplRail" />
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
          [secondaryDescription]="t('import.withLevel')"
          [secondaryCode]="t('import.withLevelCode')"
          componentSlug="composer-voice"
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
          componentSlug="composer-voice"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="composer-voice"
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
export class NdsComposerVoiceDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly level = LEVEL;
  protected readonly elapsed = ELAPSED;
  protected readonly elapsedDone = ELAPSED_DONE;

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly voiceText = computed<ComposerVoiceLabels>(() => {
    dict();
    return voiceLabels();
  });

  protected readonly fieldLabels = computed<ComposerLabels>(() => {
    dict();
    return composerLabels();
  });

  /**
   * O contraexemplo dos dois pares: o estado que só existe no desenho.
   *
   * Sem a palavra, captando e parado ficam a um medidor de distância — e quem
   * não vê o medidor não recebe distância nenhuma.
   */
  protected readonly voiceWithoutWords = computed<ComposerVoiceLabels>(() => ({
    ...this.voiceText(),
    status: { idle: '', recording: '', transcribing: '' },
  }));

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
      items: ['start', 'stop', 'status', 'elapsed'].map((key) => ({
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
    return ['idle', 'recording', 'transcribing', 'disabled'].map((k) => ({
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
        title: 'NdsComposerVoice',
        cols,
        items: rowsOf(['state', 'labels', 'level', 'elapsed', 'disabled', 'onToggle']),
      },
      {
        title: 'ComposerVoiceLabels',
        cols,
        items: rowsOf(['labelStart', 'labelStop', 'labelStatus']),
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
      'destructive', 'radiusFull', 'spacing4', 'spacing1_5',
      'textLabel', 'mutedForeground', 'durationSlow', 'spacing6',
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
      { key: 'composer',            path: '?path=/docs/primitives-conversational-composer--docs' },
      { key: 'composerAttachments', path: '?path=/docs/primitives-conversational-composerattachments--docs' },
      { key: 'mediaPlayer',         path: '?path=/docs/primitives-display-mediaplayer--docs' },
      { key: 'button',              path: '?path=/docs/primitives-form-button--docs' },
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
        componentSlug: 'composer-voice',
      });
      track('docs_page_view', {
        component_name: 'composer-voice',
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
          component_name: 'composer-voice',
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
