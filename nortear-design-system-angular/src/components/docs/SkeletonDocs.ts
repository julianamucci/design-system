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
import { NdsSkeleton } from '@/components/ui/skeleton';
import { NDS_CARD } from '@/components/ui/card';
import uiTranslations from '@/i18n/ui.json';
import skeletonTranslations from '@shared/content/skeleton/translations.json';

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

// O NdsSkeleton não tem input nenhum: forma e dimensão vêm do `style` de quem
// usa, e `aria-hidden` é fixo. As três linhas da tabela do conteúdo
// compartilhado descrevem props que aqui não existem.
const { t, dict } = useTranslation(skeletonTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className.description': 'Classes extras vão no atributo class do próprio elemento. Dimensão, porém, vai em style — o esqueleto imita a caixa do conteúdo real.',
    'props.table.ariaHidden.description': 'Fixo em true, não configurável: o esqueleto é ruído para leitor de tela. Quem anuncia o carregamento é o container, com aria-busy.',
    'props.table.rest.description': 'Qualquer atributo nativo escrito no elemento — style, id, data-*.',
  },
  en: {
    'props.table.className.description': 'Extra classes go on the class attribute of the element itself. Size, however, goes in style — the skeleton mimics the box of the real content.',
    'props.table.ariaHidden.description': 'Fixed at true, not configurable: the skeleton is noise for screen readers. The container announces loading, with aria-busy.',
    'props.table.rest.description': 'Any native attribute written on the element — style, id, data-*.',
  },
  es: {
    'props.table.className.description': 'Las clases extra van en el atributo class del propio elemento. El tamaño, en cambio, va en style — el esqueleto imita la caja del contenido real.',
    'props.table.ariaHidden.description': 'Fijo en true, no configurable: el esqueleto es ruido para el lector de pantalla. Quien anuncia la carga es el contenedor, con aria-busy.',
    'props.table.rest.description': 'Cualquier atributo nativo escrito en el elemento — style, id, data-*.',
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

const INTERFACE_CODE = `// <div ndsSkeleton> — diretiva de atributo, sem inputs
@Directive({
  selector: 'div[ndsSkeleton]',
  host: {
    class: 'nds-skeleton',
    '[attr.data-slot]': '"skeleton"',
    '[attr.aria-hidden]': '"true"',
  },
})
export class NdsSkeleton {}

// Forma e dimensão vêm de atributo, e a folha de estilo continua dona
// das medidas:
// <div ndsSkeleton data-shape="text" data-width="3-4"></div>`;

const CODE_LINHA = `<div ndsSkeleton data-shape="text" data-width="3-4"></div>`;
const CODE_CIRCULO = `<div ndsSkeleton data-shape="avatar"></div>`;
const CODE_RETANGULO = `<div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>`;

@Component({
  selector: 'nds-skeleton-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsSkeleton, ...NDS_CARD,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm" role="status" aria-busy="true" aria-label="Carregando artigo">
        <div ndsSkeleton data-shape="heading" data-width="1-2"></div>
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-cluster nds-w-full" data-spacing="sm" role="status" aria-busy="true" aria-label="Carregando perfil">
        <div ndsSkeleton data-shape="avatar"></div>
        <div class="nds-stack" data-spacing="xs">
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
          <div ndsSkeleton data-shape="text" data-width="1-3"></div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <div ndsSkeleton data-shape="avatar"></div>
        <div class="nds-stack" data-spacing="xs">
          <p class="nds-text-body">Joana Silva</p>
          <div ndsSkeleton data-shape="text" data-width="1-3"></div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarRectangle>
      <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
    </ng-template>
    <ng-template #tplVarCircle>
      <div ndsSkeleton data-shape="avatar"></div>
    </ng-template>
    <ng-template #tplVarLine>
      <div class="nds-stack" data-spacing="xs">
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
        <div ndsSkeleton data-shape="text" data-width="1-2"></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="skeleton"
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
          <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 16rem">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.card') }}
              </p>
              <div ndsCard class="nds-p-4" role="status" aria-busy="true" aria-label="Carregando cartão">
                <div class="nds-stack" data-spacing="sm">
                  <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
                  <div ndsSkeleton data-shape="heading" data-width="2-3"></div>
                  <div ndsSkeleton data-shape="text" data-width="1-3"></div>
                </div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.list') }}
              </p>
              <div class="nds-stack" data-spacing="sm" role="status" aria-busy="true" aria-label="Carregando lista">
                @for (i of [1, 2, 3]; track i) {
                  <div class="nds-cluster" data-spacing="sm">
                    <div ndsSkeleton data-shape="avatar" data-size="sm"></div>
                    <div ndsSkeleton data-shape="text" data-width="1-2"></div>
                  </div>
                }
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.image') }}
              </p>
              <div role="status" aria-busy="true" aria-label="Carregando imagem">
                <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.paragraph') }}
              </p>
              <div class="nds-stack" data-spacing="xs" role="status" aria-busy="true" aria-label="Carregando texto">
                <div ndsSkeleton data-shape="text" data-width="full"></div>
                <div ndsSkeleton data-shape="text" data-width="full"></div>
                <div ndsSkeleton data-shape="text" data-width="2-3"></div>
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
          [code]="importCode"
          componentSlug="skeleton"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="skeleton"
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
          [extensibilityCode]="t('props.extensibilityCode')"
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
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="skeleton"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="skeleton" />

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
export class NdsSkeletonDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsSkeleton } from '@/components/ui/skeleton';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarRectangle = viewChild.required<TemplateRef<unknown>>('tplVarRectangle');
  private readonly tplVarCircle = viewChild.required<TemplateRef<unknown>>('tplVarCircle');
  private readonly tplVarLine = viewChild.required<TemplateRef<unknown>>('tplVarLine');

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
      items: ['ariaLabel', 'dimensions', 'shape', 'motionReduce'].map((key) => ({
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
      { name: t('variants.items.rectangle'), description: t('variants.styles.rectangle'), code: CODE_RETANGULO, trackId: 'rectangle', preview: this.tplVarRectangle() },
      { name: t('variants.items.circle'),    description: t('variants.styles.circle'),    code: CODE_CIRCULO,   trackId: 'circle',    preview: this.tplVarCircle()    },
      { name: t('variants.items.line'),      description: t('variants.styles.line'),      code: CODE_LINHA,     trackId: 'line',      preview: this.tplVarLine()      },
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
    return ['default', 'motionReduced'].map((k) => ({
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
        title: 'NdsSkeleton',
        cols,
        items: ['className', 'dataShape', 'dataWidth', 'dataSize', 'ariaHidden', 'rest'].map((p) => ({
          name: {
            className: 'class',
            dataShape: 'data-shape',
            dataWidth: 'data-width',
            dataSize: 'data-size',
            ariaHidden: 'aria-hidden',
            rest: '(atributos nativos)',
          }[p]!,
          type: toPlainText(t(`props.table.${p}.type`)),
          defaultValue: toPlainText(t(`props.table.${p}.default`)),
          required: toPlainText(t(`props.table.${p}.required`)),
          description: toPlainText(t(`props.table.${p}.description`)),
        })),
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
    return ['background', 'rounded', 'animation', 'size', 'motionReduce'].map((k) => ({
      token: toPlainText(t(`tokens.table.${k}.token`)),
      value: toPlainText(t(`tokens.table.${k}.class`)),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: '—',   description: toPlainText(t('accessibility.keyboard.description')) },
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = skeletonTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const sr = { ...(byLocale[locale]?.accessibility?.screenReader ?? {}) };
    // `title` é rótulo da subseção, não anúncio — entraria como item da lista.
    delete sr['title'];
    return Object.values(sr);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'progress',    path: '?path=/docs/primitives-feedback-progress--docs'    },
      // O id do Storybook sai do title 'UI/AspectRatio', sem hífen: com hífen
      // o link cai em 404 e ninguém percebe, porque nada testa navegação.
      { key: 'aspectRatio', path: '?path=/docs/primitives-layout-aspectratio--docs' },
      { key: 'card',        path: '?path=/docs/primitives-layout-card--docs'        },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
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
      event: tNav('common.event'),
      trigger: tNav('common.eventTrigger'),
      payload: tNav('common.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // Sem tabela no conteúdo: o esqueleto não é interativo e não emite evento
    // próprio. A única linha é o page_view da docs page.
    return [
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('analytics.description')),
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
    dict();
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // separator e do label.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // O item 5 não é critério da WCAG: o esqueleto não transmite informação,
      // então 1.4.3 e 1.4.11 não se aplicam — o que se mede é luminância.
      items: [
        { level: 'AA',    how: 'axe-core' },
        { level: '4.1.2', how: 'DevTools a11y tree' },
        { level: '4.1.2', how: 'DevTools a11y tree' },
        { level: '2.3.3', how: 'prefers-reduced-motion' },
        { level: '—',     how: 'Medição de luminância' },
      ].map(({ level, how }, idx) => ({
        criterion: toPlainText(t(`testes.accessibility.item${idx + 1}`)),
        level,
        how,
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
        componentSlug: 'skeleton',
      });
      track('docs_page_view', {
        component_name: 'skeleton',
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
          component_name: 'skeleton',
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
