import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { toPlainText } from '@/lib/strip-html';
import { NdsMarkdown } from '@/components/ui/markdown';
import uiTranslations from '@/i18n/ui.json';
import markdownTranslations from '@shared/content/markdown/translations.json';
import { ALLOW_PRESETS } from '@shared/primitives/markdown-ast';
import {
  MARKDOWN_CODE,
  MARKDOWN_COMMENT,
  MARKDOWN_PROSE,
  MARKDOWN_TABLE,
  MARKDOWN_UNSAFE,
} from '@shared/primitives/markdown-examples';

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

// O clique de link é EVENTO nesta stack (`(linkClick)`), não prop de callback.
// Divergência de API entre frameworks não se "alinha": cada stack usa a sua, e
// o conteúdo compartilhado descreve o CONCEITO. A linha da tabela nomeia o que
// se escreve AQUI, senão quem copia procura por uma prop que não existe.
const { t, dict } = useTranslation(markdownTranslations as Record<string, unknown>, {
  '*': { 'props.table.onLinkClick.name': '(linkClick)', 'props.table.onLinkClick.type': 'OutputEmitterRef<string>' },
  'pt-BR': {
    'props.table.onLinkClick.description': 'Evento emitido no clique de um link. Com um ouvinte, quem navega é a aplicação.',
    'props.table.class.description': 'Atributo nativo do elemento, não input: o Angular mescla com a classe base. É por aqui que a página define a medida de leitura.',
  },
  en: {
    'props.table.onLinkClick.description': 'Event emitted when a link is clicked. With a listener, the application is what navigates.',
    'props.table.class.description': 'Native element attribute, not an input: Angular merges it with the base class. This is where the page sets the reading measure.',
  },
  es: {
    'props.table.onLinkClick.description': 'Evento emitido al hacer clic en un enlace. Con un oyente, quien navega es la aplicación.',
    'props.table.class.description': 'Atributo nativo del elemento, no input: Angular lo combina con la clase base. Aquí es donde la página define la medida de lectura.',
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

const INTERFACE_CODE = `// <nds-markdown> — componente
@Component({ selector: 'nds-markdown', … })
export class NdsMarkdown {
  readonly content = input.required<string>();
  readonly streaming = input(false);
  readonly allow = input<readonly MdBlockKind[] | undefined>(undefined);
  readonly allowedProtocols = input<readonly string[] | undefined>(undefined);
  readonly linkClick = output<string>();
}`;

const CODE_FULL = `<nds-markdown [content]="answer" />`;
const CODE_CHAT = `<nds-markdown
  [content]="answer"
  [allow]="['paragraph', 'code', 'blockquote', 'list', 'thematicBreak', 'raw']"
/>`;
const CODE_COMMENT = `<nds-markdown [content]="answer" [allow]="['paragraph', 'raw']" />`;

/** O par do Do & Don't é o MESMO texto: o que muda é o que se faz com ele. */
const REFUSED_LINK = '[Leia a política de privacidade](javascript:alert(1)) antes de continuar.';
const REFUSED_LINK_DROPPED = 'antes de continuar.';
const COMMENT_TRIMMED = 'Concordo com o **ponto principal**.';

@Component({
  selector: 'nds-markdown-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsMarkdown,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <nds-markdown [content]="refusedLink" />
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-markdown [content]="refusedLinkDropped" />
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-markdown [content]="commentSource" [allow]="allowComment" />
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-markdown [content]="commentTrimmed" [allow]="allowComment" />
    </ng-template>

    <ng-template #tplVarFull>
      <nds-markdown [content]="commentSource" />
    </ng-template>
    <ng-template #tplVarChat>
      <nds-markdown [content]="commentSource" [allow]="allowChat" />
    </ng-template>
    <ng-template #tplVarComment>
      <nds-markdown [content]="commentSource" [allow]="allowComment" />
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="markdown"
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
        <nds-docs-demonstration [title]="t('demonstration.title')" componentSlug="markdown">
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <!-- A legenda diz QUAL documento está sendo desenhado. Sem ela,
                 quatro documentos empilhados viram um só texto comprido — e o
                 assunto da demonstração é justamente a diferença entre eles. -->
            @for (example of examples(); track example.key) {
              <div class="nds-stack nds-w-full" data-spacing="xs">
                <p class="nds-text-caption nds-text-muted-foreground">{{ example.label }}</p>
                <nds-markdown [content]="example.content" />
              </div>
            }
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
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
          componentSlug="markdown"
          language="html"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="markdown"
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
          componentSlug="markdown"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="markdown" />

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
export class NdsMarkdownDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly commentSource = MARKDOWN_COMMENT;
  protected readonly commentTrimmed = COMMENT_TRIMMED;
  protected readonly refusedLink = REFUSED_LINK;
  protected readonly refusedLinkDropped = REFUSED_LINK_DROPPED;
  protected readonly allowChat = ALLOW_PRESETS.chat;
  protected readonly allowComment = ALLOW_PRESETS.comment;

  protected readonly activeSection = signal<string | undefined>(undefined);
  private observer: { disconnect: () => void } | undefined;

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarFull = viewChild.required<TemplateRef<unknown>>('tplVarFull');
  private readonly tplVarChat = viewChild.required<TemplateRef<unknown>>('tplVarChat');
  private readonly tplVarComment = viewChild.required<TemplateRef<unknown>>('tplVarComment');

  // Rótulo resolvido aqui, não concatenado no template: chave montada em
  // runtime é invisível para o auditor de i18n, que passa a acusar a chave
  // parcial — e um erro de digitação nela só apareceria na tela.
  protected readonly examples = computed(() => {
    dict();
    return [
      { key: 'prose',  content: MARKDOWN_PROSE,  label: t('demonstration.labels.prose')  },
      { key: 'code',   content: MARKDOWN_CODE,   label: t('demonstration.labels.code')   },
      { key: 'table',  content: MARKDOWN_TABLE,  label: t('demonstration.labels.table')  },
      { key: 'unsafe', content: MARKDOWN_UNSAFE, label: t('demonstration.labels.unsafe') },
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
      items: ['heading', 'link', 'image', 'code'].map((key) => ({
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
    return { title: t('usage.dont.title'), items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)) };
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
      { key: 'full',    code: CODE_FULL,    tpl: this.tplVarFull()    },
      { key: 'chat',    code: CODE_CHAT,    tpl: this.tplVarChat()    },
      { key: 'comment', code: CODE_COMMENT, tpl: this.tplVarComment() },
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
    return ['idle', 'streaming', 'refused', 'empty'].map((k) => ({
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
        title: 'NdsMarkdown',
        cols,
        items: ['content', 'streaming', 'allow', 'allowedProtocols', 'onLinkClick', 'class'].map(
          (k) => ({
            name: t(`props.table.${k}.name`),
            type: t(`props.table.${k}.type`),
            defaultValue: t(`props.table.${k}.default`),
            required: t(`props.table.${k}.required`),
            description: toPlainText(t(`props.table.${k}.description`)),
          }),
        ),
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
      { token: '--foreground', value: '.nds-markdown',                    k: 'foreground'  },
      { token: '--primary',    value: '.nds-markdown-link',               k: 'linkColor'   },
      { token: '--ring',       value: '.nds-markdown-link:focus-visible', k: 'linkRing'    },
      { token: '--primary',    value: '.nds-markdown-quote',              k: 'quoteBar'    },
      { token: '--border',     value: '.nds-markdown-rule',               k: 'ruleLine'    },
      { token: '--radius-md',  value: '.nds-markdown-image',              k: 'imageRadius' },
    ].map(({ token, value, k }) => ({
      token,
      value,
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
    return ['document', 'streaming', 'refused', 'table'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'codeBlock', path: '?path=/docs/primitives-display-codeblock--docs' },
      { key: 'editor',    path: '?path=/docs/primitives-form-editor--docs'    },
      { key: 'table',     path: '?path=/docs/primitives-tables-table--docs'     },
      { key: 'skeleton',  path: '?path=/docs/primitives-feedback-skeleton--docs'  },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
    // A lista é PLANA: cada item é um critério, e o "como verificar" é o
    // próprio addon-a11y rodando em toda story.
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
        componentSlug: 'markdown',
      });
      track('docs_page_view', {
        component_name: 'markdown',
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
          component_name: 'markdown',
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
