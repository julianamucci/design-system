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
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsAspectRatio } from '@/components/ui/aspect-ratio';
import uiTranslations from '@/i18n/ui.json';
import aspectRatioTranslations from '@shared/content/aspect-ratio/translations.json';

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

// `asChild` é padrão de composição do React/Base UI e não existe aqui: no
// Angular a diretiva já vive NO elemento que você escolheu, então não há
// wrapper para dispensar. A linha da tabela explica isso em vez de sumir —
// quem vem de outra stack procura por ela.
const { t, dict } = useTranslation(aspectRatioTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.asChild': 'Não existe nesta stack. A diretiva se aplica ao próprio elemento que você escreve, então não há wrapper a dispensar.',
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children': 'Conteúdo — img, iframe ou vídeo — escrito dentro do elemento.',
  },
  en: {
    'props.table.asChild': 'Does not exist in this stack. The directive applies to the element you write, so there is no wrapper to opt out of.',
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children': 'Content — img, iframe or video — written inside the element.',
  },
  es: {
    'props.table.asChild': 'No existe en esta stack. La directiva se aplica al propio elemento que escribes, así que no hay wrapper que evitar.',
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children': 'Contenido — img, iframe o vídeo — escrito dentro del elemento.',
  },
});

const IMG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23cbd5e1'/%3E%3C/svg%3E";

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

const INTERFACE_CODE = `// <div ndsAspectRatio> — diretiva de atributo
@Directive({
  selector: 'div[ndsAspectRatio]',
  host: { class: 'nds-aspect-ratio', '[style.--ratio]': 'ratioCss()' },
})
export class NdsAspectRatio {
  readonly ratio = input<number>(1);   // 16/9, 4/3, 1…
}

// O CSS compartilhado lê a custom property: aspect-ratio: var(--ratio).`;

const CODE_16_9 = `<div ndsAspectRatio [ratio]="16 / 9">
  <img src="/orla.jpg" alt="Vista aérea da orla" />
</div>`;

@Component({
  selector: 'nds-aspect-ratio-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsAspectRatio,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-w-full">
        <div ndsAspectRatio [ratio]="16 / 9">
          <img [src]="img" alt="Vista aérea da orla ao amanhecer" />
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-w-full">
        <div ndsAspectRatio [ratio]="16 / 9">
          <img [src]="img" alt="imagem" />
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-w-full">
        <div ndsAspectRatio [ratio]="1">
          <img [src]="img" alt="" />
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-w-full">
        <img [src]="img" alt="" class="nds-w-full" />
      </div>
    </ng-template>

    <ng-template #tplVar16>
      <div class="nds-w-full"><div ndsAspectRatio [ratio]="16 / 9"><img [src]="img" alt="Exemplo 16:9" /></div></div>
    </ng-template>
    <ng-template #tplVar43>
      <div class="nds-w-full"><div ndsAspectRatio [ratio]="4 / 3"><img [src]="img" alt="Exemplo 4:3" /></div></div>
    </ng-template>
    <ng-template #tplVar11>
      <div class="nds-w-full"><div ndsAspectRatio [ratio]="1"><img [src]="img" alt="Exemplo 1:1" /></div></div>
    </ng-template>
    <ng-template #tplVar34>
      <div class="nds-w-full"><div ndsAspectRatio [ratio]="3 / 4"><img [src]="img" alt="Exemplo 3:4" /></div></div>
    </ng-template>
    <ng-template #tplVar219>
      <div class="nds-w-full"><div ndsAspectRatio [ratio]="21 / 9"><img [src]="img" alt="Exemplo 21:9" /></div></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="aspect-ratio"
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
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 13rem">
            @for (p of demoProporcoes(); track p.key) {
              <div class="nds-stack" data-spacing="sm">
                <p class="nds-text-caption nds-text-muted-foreground">{{ p.label }}</p>
                <div ndsAspectRatio [ratio]="p.ratio">
                  <img [src]="img" [alt]="'Exemplo na proporção ' + p.nome" />
                </div>
              </div>
            }
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureCode]="anatomyCode"
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
          [code]="importCode"
          componentSlug="aspect-ratio"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="aspect-ratio"
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
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
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
          componentSlug="aspect-ratio"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="aspect-ratio" />

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
export class NdsAspectRatioDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = CODE_16_9;
  protected readonly importCode = `import { NdsAspectRatio } from '@/components/ui/aspect-ratio';`;
  // Rótulo resolvido aqui, não concatenado no template: chave montada em
  // runtime é invisível para o auditor de i18n, que passa a acusar a chave
  // parcial — e um erro de digitação nela só apareceria na tela.
  protected readonly demoProporcoes = computed(() => {
    dict();
    return [
      { key: 'sixteenNine', ratio: 16 / 9, nome: '16:9', label: t('demonstration.labels.sixteenNine') },
      { key: 'fourThree',   ratio: 4 / 3,  nome: '4:3',  label: t('demonstration.labels.fourThree')   },
      { key: 'square',      ratio: 1,      nome: '1:1',  label: t('demonstration.labels.square')      },
      { key: 'threeFour',   ratio: 3 / 4,  nome: '3:4',  label: t('demonstration.labels.threeFour')   },
    ];
  });
  protected readonly img = IMG;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVar16 = viewChild.required<TemplateRef<unknown>>('tplVar16');
  private readonly tplVar43 = viewChild.required<TemplateRef<unknown>>('tplVar43');
  private readonly tplVar11 = viewChild.required<TemplateRef<unknown>>('tplVar11');
  private readonly tplVar34 = viewChild.required<TemplateRef<unknown>>('tplVar34');
  private readonly tplVar219 = viewChild.required<TemplateRef<unknown>>('tplVar219');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
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
      items: ['alt', 'altDecorative', 'iframe', 'video'].map((key) => ({
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
      { key: 'sixteenNine', code: CODE_16_9, tpl: this.tplVar16()  },
      { key: 'fourThree',   tpl: this.tplVar43()  },
      { key: 'square',      tpl: this.tplVar11()  },
      { key: 'threeFour',   tpl: this.tplVar34()  },
      { key: 'ultraWide',   tpl: this.tplVar219() },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: t(`variants.items.${key}`),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    // Este componente NÃO tem `states.cols.*` — os cabeçalhos vêm do ui.json
    // compartilhado. Assumir a chave por analogia com separator e badge fazia a
    // página imprimir "states.cols.state" como texto; quem pegou foi o contrato
    // de docs (regra chave_i18n_visivel), não o typecheck.
    return {
      state: tNav('common.stateName'),
      trigger: tNav('common.stateTrigger'),
      behavior: tNav('common.stateBehavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    const d = dict();
    // Este componente numera os estados como item1..3, não por nome — quarta
    // forma diferente entre os componentes já implementados.
    return itemsFromDict(d, 'states', ['label', 'trigger', 'behavior']).map((r) => ({
      label: toPlainText(r.label),
      trigger: toPlainText(r.trigger),
      behavior: toPlainText(r.behavior),
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
    const nao = tNav('common.no');
    return [
      {
        title: 'NdsAspectRatio',
        cols,
        items: [
          { name: 'ratio',   type: 'number', defaultValue: '1', required: nao, description: toPlainText(t('props.table.ratio')) },
          { name: 'class',   type: 'string', defaultValue: '—', required: nao, description: toPlainText(t('props.table.className')) },
          { name: '(conteúdo)', type: 'HTML', defaultValue: '—', required: nao, description: toPlainText(t('props.table.children')) },
          { name: 'asChild', type: '—',      defaultValue: '—', required: nao, description: toPlainText(t('props.table.asChild')) },
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: t('tokens.table.part'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      { token: '--radius', k: 'radius' },
      { token: '--border', k: 'border' },
      { token: '--muted',  k: 'muted'  },
    ].map(({ token, k }) => ({
      token,
      value: '.nds-aspect-ratio',
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    // Os itens de a11y deste componente vivem sob `accessibility.aria.item*`,
    // não `accessibility.item*` — quinta forma diferente.
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.aria.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: '—',   description: toPlainText(t('accessibility.keyboard.note')) },
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.item1')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => t(`accessibility.screenReader.item${i}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'avatar',   nome: 'Avatar',   path: '?path=/docs/ui-avatar--docs'   },
      { key: 'card',     nome: 'Card',     path: '?path=/docs/ui-card--docs'     },
      { key: 'skeleton', nome: 'Skeleton', path: '?path=/docs/ui-skeleton--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: t(`related.${key}`),
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
    return [
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('analytics.note')),
        payload: 'component_name, locale, page_title',
      },
    ];
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'aspect-ratio',
      });
      track('docs_page_view', {
        component_name: 'aspect-ratio',
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
          component_name: 'aspect-ratio',
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

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
