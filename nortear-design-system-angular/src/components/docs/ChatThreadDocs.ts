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
import { NdsChatThread, type ChatMessage, type ChatThreadLabels } from '@/components/ui/chat-thread';
import { chatLabels, toMessages } from '@/components/ui/chat-thread.fixtures';
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import {
  CHAT_COM_FERRAMENTAS,
  CHAT_CONVERSA,
  CHAT_EM_STREAMING,
  CHAT_FERRAMENTA_FALHOU,
} from '@shared/primitives/chat-examples';

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

// As ações do turno e os controles de autorização são `TemplateRef` nesta
// stack, não nó de interface como no React. Divergência de API entre frameworks
// não se "alinha": cada stack usa a sua, e o conteúdo compartilhado descreve o
// CONCEITO. A linha da tabela nomeia o que se escreve AQUI, senão quem copia
// procura por um tipo que não existe.
const { t, dict } = useTranslation(chatTranslations as Record<string, unknown>, {
  '*': { 'props.table.actions.type': 'TemplateRef<unknown>' },
  'pt-BR': {
    'props.table.class.description':
      'Atributo nativo do elemento, não input: o Angular mescla com a classe base. É por aqui que a página define a altura e a medida de leitura.',
  },
  en: {
    'props.table.class.description':
      'Native element attribute, not an input: Angular merges it with the base class. This is where the page sets the height and the reading measure.',
  },
  es: {
    'props.table.class.description':
      'Atributo nativo del elemento, no input: Angular lo combina con la clase base. Aquí es donde la página define la altura y la medida de lectura.',
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

const INTERFACE_CODE = `// <nds-chat-thread> — componente
@Component({ selector: 'nds-chat-thread', … })
export class NdsChatThread {
  readonly messages = input.required<ChatMessage[]>();
  readonly labels = input.required<ChatThreadLabels>();
  readonly error = input<string | undefined>(undefined);
  readonly size = input<ChatThreadSize | undefined>(undefined);
}

// A LISTA é a API: quem faz streaming troca o array.
//   mensagem nova   — acrescenta ao fim, e é por ela que a rolagem decide
//   mesmo \`id\`      — onde o streaming pousa; é o \`track\` que remenda a
//                     mensagem que cresce, em vez de remontá-la
//   \`error\`         — a falha da execução, fora da conversa`;

const CODE_USER = `<nds-chat-thread
  [messages]="[{ role: 'user', content: text }]"
  [labels]="labels"
/>`;
const CODE_ASSISTANT = `<nds-chat-thread
  [messages]="[{ role: 'assistant', content: text }]"
  [labels]="labels"
/>`;
const CODE_SYSTEM = `<nds-chat-thread
  [messages]="[{ role: 'system', content: text }]"
  [labels]="labels"
/>`;

/** Os rótulos sem a palavra do estado — o contraexemplo do segundo par. */
const EMPTY_TOOL_STATE = { pending: '', running: '', done: '', failed: '' };

@Component({
  selector: 'nds-chat-thread-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsChatThread, NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- O par do Do & Don't é a MESMA conversa: o que muda é para onde a
         rolagem vai quando a mensagem chega. -->
    <ng-template #tplDoDont1Do>
      <nds-chat-thread [messages]="conversation" [labels]="labels()" size="sm" />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-chat-thread [messages]="conversation" [labels]="labels()" size="sm" />
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-chat-thread [messages]="toolFailed" [labels]="labels()" size="sm" />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O contraexemplo: o estado sem palavra, só o ícone colorido. -->
      <nds-chat-thread [messages]="toolFailed" [labels]="mutedToolState()" size="sm" />
    </ng-template>

    <ng-template #tplVarUser>
      <nds-chat-thread [messages]="userTurn" [labels]="labels()" size="xs" />
    </ng-template>
    <ng-template #tplVarAssistant>
      <nds-chat-thread [messages]="assistantTurn" [labels]="labels()" size="xs" />
    </ng-template>
    <ng-template #tplVarSystem>
      <nds-chat-thread [messages]="systemTurn" [labels]="labels()" size="xs" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="chat-thread"
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
        <nds-docs-demonstration [title]="t('demonstration.title')" componentSlug="chat-thread">
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL exemplo está desenhado — sem ela, quatro
                 conversas empilhadas viram uma só, e o assunto da demonstração é
                 justamente a diferença entre elas.

                 O separador é decorativo de propósito: quem dá a estrutura para
                 quem ouve é a legenda de cada exemplo, não a linha. -->
            @for (example of examples(); track example.key) {
              @if (!$first) {
                <div ndsSeparator></div>
              }
              <div class="nds-stack nds-w-full" data-spacing="xs">
                <p class="nds-text-caption nds-text-muted-foreground">{{ example.label }}</p>
                <nds-chat-thread
                  [messages]="example.messages"
                  [labels]="labels()"
                  size="md"
                />
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
          [secondaryDescription]="t('import.withStreaming')"
          [secondaryCode]="t('import.withStreamingCode')"
          componentSlug="chat-thread"
          language="html"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="chat-thread"
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
          componentSlug="chat-thread"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="chat-thread"
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
export class NdsChatThreadDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  // As conversas não dependem de idioma: o que a `translations.json` carrega são
  // os RÓTULOS da interface, não a fala.
  protected readonly conversation = toMessages(CHAT_CONVERSA);
  protected readonly toolFailed = toMessages(CHAT_FERRAMENTA_FALHOU);
  protected readonly userTurn = toMessages(CHAT_CONVERSA.filter((m) => m.role === 'user'));
  protected readonly assistantTurn = toMessages(
    CHAT_CONVERSA.filter((m) => m.role === 'assistant'),
  );
  protected readonly systemTurn = toMessages(CHAT_CONVERSA.filter((m) => m.role === 'system'));

  /** Os rótulos são texto de interface, então acompanham a troca de idioma. */
  protected readonly labels = computed<ChatThreadLabels>(() => {
    dict();
    return chatLabels();
  });

  protected readonly mutedToolState = computed<ChatThreadLabels>(() => ({
    ...this.labels(),
    toolState: EMPTY_TOOL_STATE,
  }));

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarUser = viewChild.required<TemplateRef<unknown>>('tplVarUser');
  private readonly tplVarAssistant = viewChild.required<TemplateRef<unknown>>('tplVarAssistant');
  private readonly tplVarSystem = viewChild.required<TemplateRef<unknown>>('tplVarSystem');

  // Rótulo resolvido aqui, não concatenado no template: chave montada em runtime
  // é invisível para o auditor de i18n, que passa a acusar a chave parcial — e
  // um erro de digitação nela só apareceria na tela.
  protected readonly examples = computed<
    { key: string; label: string; messages: ChatMessage[] }[]
  >(() => {
    dict();
    const streaming = toMessages(CHAT_EM_STREAMING);
    streaming[streaming.length - 1].streaming = true;
    return [
      {
        key: 'conversation',
        label: t('demonstration.labels.conversation'),
        messages: toMessages(CHAT_CONVERSA),
      },
      {
        key: 'tools',
        label: t('demonstration.labels.tools'),
        messages: toMessages(CHAT_COM_FERRAMENTAS),
      },
      { key: 'streaming', label: t('demonstration.labels.streaming'), messages: streaming },
      {
        key: 'failed',
        label: t('demonstration.labels.failed'),
        messages: toMessages(CHAT_FERRAMENTA_FALHOU),
      },
    ];
  });

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
      items: ['author', 'toolName', 'toolState', 'system'].map((key) => ({
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
      { key: 'user',      code: CODE_USER,      tpl: this.tplVarUser()      },
      { key: 'assistant', code: CODE_ASSISTANT, tpl: this.tplVarAssistant() },
      { key: 'system',    code: CODE_SYSTEM,    tpl: this.tplVarSystem()    },
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
    return ['atEnd', 'away', 'streaming', 'toolPending', 'toolFailed', 'error'].map((k) => ({
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
        title: 'NdsChatThread',
        cols,
        items: [
          'messages', 'labels', 'id', 'role', 'streaming',
          'toolCalls', 'sources', 'actions', 'error', 'regionLabel', 'class',
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
    return ['bubble', 'header', 'body', 'disclosure', 'failed', 'ring'].map((k) => ({
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
    return ['turns', 'answer', 'tool', 'jump'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'markdown', path: '?path=/docs/components-conversational-markdown--docs' },
      { key: 'avatar',   path: '?path=/docs/components-display-avatar--docs'   },
      { key: 'button',   path: '?path=/docs/components-form-button--docs'   },
      { key: 'skeleton', path: '?path=/docs/components-feedback-skeleton--docs' },
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
        componentSlug: 'chat-thread',
      });
      track('docs_page_view', {
        component_name: 'chat-thread',
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
          component_name: 'chat-thread',
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
