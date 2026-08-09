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
import { NDS_CARD } from '@/components/ui/card';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import cardTranslations from '@shared/content/card/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// `size` é o único input desta família; `class` e o conteúdo são nativos do
// <div>. As descrições dessas duas linhas são sobrescritas para a tabela não
// prometer prop que aqui não existe.
const { t, dict } = useTranslation(cardTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children': 'Conteúdo, escrito dentro do elemento.',
  },
  en: {
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children': 'Content, written inside the element.',
  },
  es: {
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children': 'Contenido, escrito dentro del elemento.',
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

const INTERFACE_CODE = `// Sete diretivas de atributo, uma por parte do Card.
@Directive({ selector: 'div[ndsCard]', host: { class: 'nds-card' } })
export class NdsCard {
  readonly size = input<CardSize>('default');   // 'default' | 'sm'
}

// Sem input: NdsCardHeader, NdsCardTitle, NdsCardDescription,
//            NdsCardAction, NdsCardContent, NdsCardFooter

// NDS_CARD exporta as sete de uma vez para o \`imports\` de quem compõe.`;

const CODE_DEFAULT = `<div ndsCard>
  <div ndsCardHeader>
    <h3 ndsCardTitle>Notebook Pro 14</h3>
    <p ndsCardDescription>M3 Pro · 18GB · 512GB SSD</p>
  </div>
  <div ndsCardContent>Disponível em 3 cores.</div>
</div>`;

const CODE_FOOTER = `<div ndsCard>
  <div ndsCardHeader>
    <h3 ndsCardTitle>Excluir projeto</h3>
  </div>
  <div ndsCardContent>Esta ação não pode ser desfeita.</div>
  <div ndsCardFooter>
    <button ndsButton variant="outline">Cancelar</button>
    <button ndsButton variant="destructive">Excluir</button>
  </div>
</div>`;

const CODE_ACTION = `<div ndsCardHeader>
  <h3 ndsCardTitle>Assinatura Pro</h3>
  <p ndsCardDescription>Renova em 12 de setembro</p>
  <div ndsCardAction>
    <button ndsButton variant="ghost" size="sm">Gerenciar</button>
  </div>
</div>`;

@Component({
  selector: 'nds-card-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_CARD, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div ndsCard class="nds-w-full">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.productTitle') }}</h3>
          <p ndsCardDescription>{{ t('demonstration.labels.productDescription') }}</p>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.productPrice') }}</div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsCard class="nds-w-full">
        <div ndsCardContent>
          {{ t('demonstration.labels.productTitle') }} —
          {{ t('demonstration.labels.productDescription') }} —
          {{ t('demonstration.labels.productPrice') }}
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsCard class="nds-w-full">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.profileTitle') }}</h3>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.profileDescription') }}</div>
        <div ndsCardFooter>
          <button ndsButton variant="outline">{{ t('demonstration.labels.actionCancel') }}</button>
          <button ndsButton>{{ t('demonstration.labels.actionSave') }}</button>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsCard class="nds-w-full">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.profileTitle') }}</h3>
        </div>
        <div ndsCardContent>
          {{ t('demonstration.labels.profileDescription') }}
          <div class="nds-cluster nds-mt-4" data-spacing="sm">
            <button ndsButton variant="outline">{{ t('demonstration.labels.actionCancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.actionSave') }}</button>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsCard class="nds-max-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.productTitle') }}</h3>
          <p ndsCardDescription>{{ t('demonstration.labels.productDescription') }}</p>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.productPrice') }}</div>
      </div>
    </ng-template>
    <ng-template #tplVarSm>
      <div ndsCard size="sm" class="nds-max-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.metricTitle') }}</h3>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.metricValue') }}</div>
      </div>
    </ng-template>
    <ng-template #tplVarFooter>
      <div ndsCard class="nds-max-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.profileTitle') }}</h3>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.profileDescription') }}</div>
        <div ndsCardFooter>
          <button ndsButton variant="outline">{{ t('demonstration.labels.actionCancel') }}</button>
          <button ndsButton>{{ t('demonstration.labels.actionSave') }}</button>
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarAction>
      <div ndsCard class="nds-max-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ t('demonstration.labels.profileTitle') }}</h3>
          <p ndsCardDescription>{{ t('demonstration.labels.profileDescription') }}</p>
          <div ndsCardAction>
            <button ndsButton variant="ghost" size="sm">
              {{ t('demonstration.labels.actionEdit') }}
            </button>
          </div>
        </div>
        <div ndsCardContent>{{ t('demonstration.labels.metricTrend') }}</div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="card"
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
          <div class="nds-grid nds-w-full" data-spacing="lg" data-min="17rem">
            <div ndsCard>
              <div ndsCardHeader>
                <h3 ndsCardTitle>{{ t('demonstration.labels.productTitle') }}</h3>
                <p ndsCardDescription>{{ t('demonstration.labels.productDescription') }}</p>
              </div>
              <div ndsCardContent>{{ t('demonstration.labels.productPrice') }}</div>
              <div ndsCardFooter>
                <button
                  ndsButton
                  variant="outline"
                  data-track="demo"
                  data-track-id="card:demo:edit"
                  (click)="onDemoAction('edit')"
                >{{ t('demonstration.labels.actionEdit') }}</button>
                <button
                  ndsButton
                  variant="destructive"
                  data-track="demo"
                  data-track-id="card:demo:delete"
                  (click)="onDemoAction('delete')"
                >{{ t('demonstration.labels.actionDelete') }}</button>
              </div>
            </div>

            <div ndsCard>
              <div ndsCardHeader>
                <h3 ndsCardTitle>{{ t('demonstration.labels.profileTitle') }}</h3>
                <p ndsCardDescription>{{ t('demonstration.labels.profileDescription') }}</p>
                <div ndsCardAction>
                  <button ndsButton variant="ghost" size="sm">
                    {{ t('demonstration.labels.actionEdit') }}
                  </button>
                </div>
              </div>
              <div ndsCardContent>{{ t('demonstration.labels.productStock') }}</div>
            </div>

            <div ndsCard size="sm">
              <div ndsCardHeader>
                <h3 ndsCardTitle>{{ t('demonstration.labels.metricTitle') }}</h3>
              </div>
              <div ndsCardContent>
                <p class="nds-text-h2">{{ t('demonstration.labels.metricValue') }}</p>
                <p class="nds-text-caption nds-text-muted-foreground">
                  {{ t('demonstration.labels.metricTrend') }}
                </p>
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
          [code]="t('import.basic')"
          [secondaryCode]="t('import.full')"
          componentSlug="card"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="card"
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
          componentSlug="card"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="card" />

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
export class NdsCardDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarSm = viewChild.required<TemplateRef<unknown>>('tplVarSm');
  private readonly tplVarFooter = viewChild.required<TemplateRef<unknown>>('tplVarFooter');
  private readonly tplVarAction = viewChild.required<TemplateRef<unknown>>('tplVarAction');

  protected onDemoAction(acao: string): void {
    track('button_click', {
      component: 'card',
      variant: 'default',
      label: acao,
      location: 'docs_demo',
    });
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
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`anatomy.item${i}`));
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
      items: ['title', 'description', 'action', 'ariaLabel'].map((key) => ({
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
      { name: t('variants.items.default'),    description: t('variants.items.default'),    code: CODE_DEFAULT, trackId: 'default',     preview: this.tplVarDefault() },
      { name: t('variants.items.sm'),         description: t('variants.items.sm'),         trackId: 'sm',         preview: this.tplVarSm()     },
      { name: t('variants.items.withFooter'), description: t('variants.items.withFooter'), code: CODE_FOOTER,  trackId: 'with-footer', preview: this.tplVarFooter() },
      { name: t('variants.items.withAction'), description: t('variants.items.withAction'), code: CODE_ACTION,  trackId: 'with-action', preview: this.tplVarAction() },
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
    return ['default', 'small', 'interactive'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: t(`states.${k}.trigger`),
      behavior: t(`states.${k}.behavior`),
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
    const classe = {
      name: 'class',
      type: 'string',
      defaultValue: '—',
      required: nao,
      description: toPlainText(t('props.table.className')),
    };
    const conteudo = {
      name: '(conteúdo)',
      type: 'HTML',
      defaultValue: '—',
      required: nao,
      description: toPlainText(t('props.table.children')),
    };

    // Sete tabelas, uma por diretiva. Só a raiz tem input; as outras seis
    // expõem apenas o atributo nativo e o conteúdo — repetir isso explicitamente
    // é mais honesto do que uma tabela única que sugere API compartilhada.
    return [
      {
        title: t('props.cardTitle'),
        cols,
        items: [
          {
            name: 'size',
            type: "'default' | 'sm'",
            defaultValue: "'default'",
            required: nao,
            description: toPlainText(t('props.table.size')),
          },
          classe,
          conteudo,
        ],
      },
      { title: t('props.headerTitle'),      cols, items: [classe, conteudo] },
      { title: t('props.cardTitleTitle'),   cols, items: [classe, conteudo] },
      { title: t('props.descriptionTitle'), cols, items: [classe, conteudo] },
      { title: t('props.actionTitle'),      cols, items: [classe, conteudo] },
      { title: t('props.contentTitle'),     cols, items: [classe, conteudo] },
      { title: t('props.footerTitle'),      cols, items: [classe, conteudo] },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: toPlainText(t('tokens.table.part')),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      { token: '--radius-card',     value: '.nds-card',             description: toPlainText(t('tokens.table.radiusCard'))     },
      { token: '--card',            value: '.nds-card',             description: toPlainText(t('tokens.table.card'))           },
      { token: '--card-foreground', value: '.nds-card',             description: toPlainText(t('tokens.table.cardForeground')) },
      { token: '--muted',           value: '.nds-card-footer',      description: toPlainText(t('tokens.table.muted'))          },
      { token: '--muted-foreground', value: '.nds-card-description', description: toPlainText(t('tokens.table.mutedForeground')) },
      { token: '--foreground',      value: '.nds-card-title',       description: toPlainText(t('tokens.table.foreground'))     },
      { token: '--border',          value: '.nds-card',             description: toPlainText(t('tokens.table.border'))         },
    ];
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: '—',     description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = cardTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'separator', nome: 'Separator', path: '?path=/docs/ui-separator--docs' },
      { key: 'accordion', nome: 'Accordion', path: '?path=/docs/ui-accordion--docs' },
      { key: 'alert',     nome: 'Alert',     path: '?path=/docs/ui-alert--docs'     },
      { key: 'button',    nome: 'Button',    path: '?path=/docs/ui-button--docs'    },
      { key: 'badge',     nome: 'Badge',     path: '?path=/docs/ui-badge--docs'     },
      { key: 'avatar',    nome: 'Avatar',    path: '?path=/docs/ui-avatar--docs'    },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: t(`related.${key}`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
    return ['buttonClick', 'cardClick', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
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
    // Este componente usa a forma completa {criterion, level, how} — diferente
    // de separator e label, onde o critério é frase única.
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
        componentSlug: 'card',
      });
      track('docs_page_view', {
        component_name: 'card',
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
          component_name: 'card',
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
