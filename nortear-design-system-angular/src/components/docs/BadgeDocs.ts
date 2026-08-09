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
import { NdsBadge, type BadgeVariant } from '@/components/ui/badge';
import { NdsButton, NdsButtonIcon } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import badgeTranslations from '@shared/content/badge/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsCompositions,
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

const { t, dict } = useTranslation(badgeTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children': 'Rótulo, escrito como conteúdo do elemento.',
  },
  en: {
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children': 'Label, written as the content of the element.',
  },
  es: {
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children': 'Etiqueta, escrita como contenido del elemento.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
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
    { id: 'composicoes',  labelKey: 'nav.compositions' },
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

const INTERFACE_CODE = `// <span ndsBadge> — diretiva de atributo no elemento inline
@Component({
  selector: 'span[ndsBadge]',
  host: { '[class]': 'hostClass()', '[attr.data-variant]': 'variant()' },
})
export class NdsBadge {
  readonly variant = input<BadgeVariant>('default');
}

// class e o rótulo são nativos do <span>.`;

const VARIANTES: BadgeVariant[] = [
  'default', 'secondary', 'destructive', 'warning', 'success', 'info', 'outline',
];

@Component({
  selector: 'nds-badge-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsBadge, NdsButton, NdsButtonIcon,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <span ndsBadge variant="success">{{ t('demonstration.labels.successLabel') }}</span>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <span ndsBadge variant="success">
        {{ t('demonstration.labels.successLabel') }} — {{ t('description') }}
      </span>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <span class="nds-cluster" data-spacing="xs">
        <span ndsBadge variant="warning">{{ t('demonstration.labels.warningLabel') }}</span>
      </span>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <span class="nds-cluster" data-spacing="xs">
        <span ndsBadge variant="warning">{{ t('demonstration.labels.warningLabel') }}</span>
        <span ndsBadge variant="info">{{ t('demonstration.labels.infoLabel') }}</span>
        <span ndsBadge variant="secondary">{{ t('demonstration.labels.categoryLabel') }}</span>
        <span ndsBadge variant="destructive">{{ t('demonstration.labels.destructiveLabel') }}</span>
      </span>
    </ng-template>

    <ng-template #tplVarDefault><span ndsBadge>{{ t('demonstration.labels.defaultLabel') }}</span></ng-template>
    <ng-template #tplVarSecondary><span ndsBadge variant="secondary">{{ t('demonstration.labels.secondaryLabel') }}</span></ng-template>
    <ng-template #tplVarDestructive><span ndsBadge variant="destructive">{{ t('demonstration.labels.destructiveLabel') }}</span></ng-template>
    <ng-template #tplVarWarning><span ndsBadge variant="warning">{{ t('demonstration.labels.warningLabel') }}</span></ng-template>
    <ng-template #tplVarSuccess><span ndsBadge variant="success">{{ t('demonstration.labels.successLabel') }}</span></ng-template>
    <ng-template #tplVarInfo><span ndsBadge variant="info">{{ t('demonstration.labels.infoLabel') }}</span></ng-template>
    <ng-template #tplVarOutline><span ndsBadge variant="outline">{{ t('demonstration.labels.outlineLabel') }}</span></ng-template>

    <ng-template #tplCompIcon>
      <span ndsBadge variant="success">
        <svg ndsButtonIcon kind="check" size="sm"></svg>
        {{ t('demonstration.labels.statusLabel') }}
      </span>
    </ng-template>
    <ng-template #tplCompCount>
      <span ndsBadge variant="destructive">{{ t('demonstration.labels.countLabel') }}</span>
    </ng-template>
    <ng-template #tplCompLink>
      <a href="?path=/docs/ui-badge--docs">
        <span ndsBadge variant="secondary">{{ t('demonstration.labels.tagLabel') }}</span>
      </a>
    </ng-template>
    <ng-template #tplCompTrigger>
      <button ndsButton variant="ghost" size="sm" aria-label="Filtrar por categoria">
        <span ndsBadge variant="outline">{{ t('demonstration.labels.categoryLabel') }}</span>
      </button>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="badge"
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
          <div class="nds-cluster" data-spacing="sm">
            @for (v of variantes; track v) {
              <span ndsBadge [variant]="v">{{ rotuloDaVariante(v) }}</span>
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
          [code]="t('import.basic')"
          [secondaryCode]="t('import.withIcon')"
          componentSlug="badge"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="badge"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="badge"
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
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="badge"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="badge" />

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
export class NdsBadgeDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly variantes = VARIANTES;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarSecondary = viewChild.required<TemplateRef<unknown>>('tplVarSecondary');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarWarning = viewChild.required<TemplateRef<unknown>>('tplVarWarning');
  private readonly tplVarSuccess = viewChild.required<TemplateRef<unknown>>('tplVarSuccess');
  private readonly tplVarInfo = viewChild.required<TemplateRef<unknown>>('tplVarInfo');
  private readonly tplVarOutline = viewChild.required<TemplateRef<unknown>>('tplVarOutline');
  private readonly tplCompIcon = viewChild.required<TemplateRef<unknown>>('tplCompIcon');
  private readonly tplCompCount = viewChild.required<TemplateRef<unknown>>('tplCompCount');
  private readonly tplCompLink = viewChild.required<TemplateRef<unknown>>('tplCompLink');
  private readonly tplCompTrigger = viewChild.required<TemplateRef<unknown>>('tplCompTrigger');

  protected rotuloDaVariante(v: BadgeVariant): string {
    return t(`demonstration.labels.${v}Label`);
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
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
      items: ['label', 'status', 'count', 'category'].map((key) => ({
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
    return { title: t('usage.dont.title'), items: [1, 2, 3].map((i) => t(`usage.dont.item${i}`)) };
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
    const tpls: Record<BadgeVariant, TemplateRef<unknown>> = {
      default: this.tplVarDefault(),
      secondary: this.tplVarSecondary(),
      destructive: this.tplVarDestructive(),
      warning: this.tplVarWarning(),
      success: this.tplVarSuccess(),
      info: this.tplVarInfo(),
      outline: this.tplVarOutline(),
    };
    return VARIANTES.map((v) => ({
      name: t(`variants.items.${v}`),
      description: t(`variants.items.${v}`),
      trackId: v,
      preview: tpls[v],
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'withIcon',  tpl: this.tplCompIcon()    },
      { key: 'count',     tpl: this.tplCompCount()   },
      { key: 'asLink',    tpl: this.tplCompLink()    },
      { key: 'asTrigger', tpl: this.tplCompTrigger() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
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
    // Uma linha só: o Badge não tem estado interativo — o que o conteúdo
    // compartilhado documenta é o comportamento do contador.
    return [
      {
        label: t('states.countBadge.label'),
        trigger: toPlainText(t('states.countBadge.trigger')),
        behavior: toPlainText(t('states.countBadge.behavior')),
      },
    ];
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
        title: t('props.badgeTitle'),
        cols,
        items: [
          { name: 'variant', type: 'BadgeVariant', defaultValue: "'default'", required: nao, description: toPlainText(t('props.table.variant')) },
          { name: 'class',   type: 'string',       defaultValue: '—',         required: nao, description: toPlainText(t('props.table.className')) },
          { name: '(conteúdo)', type: 'HTML',      defaultValue: '—',         required: nao, description: toPlainText(t('props.table.children')) },
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
      { token: '--primary',              classe: '.nds-badge',             k: 'primary'              },
      { token: '--primary-foreground',   classe: '.nds-badge',             k: 'primaryForeground'    },
      { token: '--secondary',            classe: '.nds-badge-secondary',   k: 'secondary'            },
      { token: '--destructive',          classe: '.nds-badge-destructive', k: 'destructive'          },
      { token: '--warning',              classe: '.nds-badge-warning',     k: 'warning'              },
      { token: '--success',              classe: '.nds-badge-success',     k: 'success'              },
      { token: '--info',                 classe: '.nds-badge-info',        k: 'info'                 },
      { token: '--border',               classe: '.nds-badge-outline',     k: 'badgeBorder'          },
    ].map(({ token, classe, k }) => ({
      token,
      value: classe,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    // As chaves de teclado deste componente ficam na raiz (`keyboard.*`), não
    // sob `accessibility.keyboard.*` como em separator e label.
    return [
      { key: '—',     description: toPlainText(t('keyboard.noFocus')) },
      { key: 'Tab',   description: toPlainText(t('keyboard.wrappedInButton')) },
      { key: 'Enter', description: toPlainText(t('keyboard.wrappedInLink')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = badgeTranslations as unknown as Record<
      string,
      { screenReader?: Record<string, string> }
    >;
    return Object.values(byLocale[locale]?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'alert',  nome: 'Alert',  path: '?path=/docs/ui-alert--docs'  },
      { key: 'chip',   nome: 'Chip',   path: '?path=/docs/ui-badge--docs'  },
      { key: 'tag',    nome: 'Tag',    path: '?path=/docs/ui-badge--docs'  },
      { key: 'button', nome: 'Button', path: '?path=/docs/ui-button--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: t(`related.${key}`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
    return ['click', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
    }));
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
        componentSlug: 'badge',
      });
      track('docs_page_view', {
        component_name: 'badge',
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
          component_name: 'badge',
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
