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
import { NDS_SKELETON } from '@/components/ui/skeleton';
import { NdsAspectRatio } from '@/components/ui/aspect-ratio';
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

// Override só de TIPO de uma linha: o `ComponentProps<'div'>` do conteúdo
// compartilhado não existe aqui — a diretiva mora num `<div>` nativo, e o que
// sobra são os atributos dele. Descrição e demais linhas valem como estão.
const { t, dict } = useTranslation(skeletonTranslations as Record<string, unknown>, {
  '*': { 'props.table.rest.type': 'HTMLDivElement' },
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

// A região que espera o conteúdo é peça, e o esqueleto vai DENTRO dela:
// o bloco é aria-hidden, então quem anuncia o carregamento é a região.
// aria-busy é fixo — quando o conteúdo chega, a região SAI do template.
@Directive({
  selector: 'div[ndsSkeletonRegion]',
  host: {
    '[attr.data-slot]': '"skeleton-region"',
    '[attr.role]': '"status"',
    '[attr.aria-busy]': '"true"',
    '[attr.aria-label]': 'label()',
  },
})
export class NdsSkeletonRegion {
  readonly label = input.required<string>();
}

// Forma e dimensão vêm de atributo, e a folha de estilo continua dona
// das medidas:
// <div ndsSkeletonRegion label="Carregando artigo" class="nds-stack">
//   <div ndsSkeleton data-shape="text" data-width="3-4"></div>
// </div>`;

const CODE_LINHA = `<div ndsSkeleton data-shape="text" data-width="3-4"></div>`;
const CODE_CIRCULO = `<div ndsSkeleton data-shape="avatar"></div>`;
// O snippet ensina o container de proporção: a classe de mídia do preview é da
// docs page, não da API, e `fill` sozinho nasce com altura zero.
const CODE_RETANGULO = `<div ndsAspectRatio [ratio]="16 / 9">\n  <div ndsSkeleton data-shape="fill"></div>\n</div>`;

@Component({
  selector: 'nds-skeleton-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_SKELETON, NdsAspectRatio,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Par 1: os dois lados dentro da peça — o que muda é a FORMA. -->
    <ng-template #tplDoDont1Do>
      <div ndsSkeletonRegion [label]="t('doDont.regionLabels.pair1')" class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="heading" data-width="1-2"></div>
        <div ndsSkeleton data-shape="text" data-width="full"></div>
        <div ndsSkeleton data-shape="text" data-width="3-4"></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsSkeletonRegion [label]="t('doDont.regionLabels.pair1')" class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="1-3"></div>
      </div>
    </ng-template>
    <!-- Par 2: o MESMO esqueleto; o "não faça" é ele sem região. -->
    <ng-template #tplDoDont2Do>
      <div ndsSkeletonRegion [label]="t('doDont.regionLabels.pair2')" class="nds-cluster nds-w-full nds-max-w-sm" data-spacing="sm" data-align="center">
        <div ndsSkeleton data-shape="avatar"></div>
        <!-- nds-flex-1: sem base de largura a pilha encolhe e as linhas somem. -->
        <div class="nds-stack nds-flex-1" data-spacing="xs">
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
          <div ndsSkeleton data-shape="text" data-width="1-3"></div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-cluster nds-w-full nds-max-w-sm" data-spacing="sm" data-align="center">
        <div ndsSkeleton data-shape="avatar"></div>
        <div class="nds-stack nds-flex-1" data-spacing="xs">
          <div ndsSkeleton data-shape="text" data-width="1-2"></div>
          <div ndsSkeleton data-shape="text" data-width="1-3"></div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarRectangle>
      <div ndsSkeletonRegion [label]="t('demonstration.regionLabels.rectangle')" class="nds-w-full nds-max-w-sm">
        <div ndsSkeleton data-shape="fill" class="nds-docs-skeleton-media"></div>
      </div>
    </ng-template>
    <ng-template #tplVarCircle>
      <div ndsSkeletonRegion [label]="t('demonstration.regionLabels.circle')" class="nds-w-full nds-max-w-sm">
        <div ndsSkeleton data-shape="avatar"></div>
      </div>
    </ng-template>
    <ng-template #tplVarLine>
      <div ndsSkeletonRegion [label]="t('demonstration.regionLabels.line')" class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <div ndsSkeleton data-shape="text" data-width="full"></div>
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
        <nds-docs-demonstration>
          <!-- Quatro blocos que casam com as legendas: card = avatar + 2
               linhas; lista = 5 itens; imagem = fill em proporção real;
               parágrafo = 3 linhas. -->
          <div class="nds-grid nds-w-full" data-cols="2" data-spacing="lg" style="--grid-min: 16rem">
            <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.card') }}
              </p>
              <div
                ndsSkeletonRegion
                [label]="t('demonstration.regionLabels.card')"
                class="nds-cluster nds-w-full"
                data-spacing="md"
                data-align="center"
              >
                <div ndsSkeleton data-shape="avatar"></div>
                <!-- nds-flex-1: sem base de largura a pilha encolhe e as
                     linhas em fração resolvem para zero. -->
                <div class="nds-stack nds-flex-1" data-spacing="sm">
                  <div ndsSkeleton data-shape="text" data-width="2-3"></div>
                  <div ndsSkeleton data-shape="text" data-width="1-2"></div>
                </div>
              </div>
            </div>

            <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.list') }}
              </p>
              <!-- UMA região para a lista inteira: uma por item repetiria o
                   aviso a cada linha. -->
              <div
                ndsSkeletonRegion
                [label]="t('demonstration.regionLabels.list')"
                class="nds-stack nds-w-full"
                data-spacing="md"
              >
                @for (item of listItems; track item) {
                  <div class="nds-cluster" data-spacing="sm" data-align="center">
                    <div ndsSkeleton data-shape="avatar" data-size="sm"></div>
                    <div class="nds-stack nds-flex-1" data-spacing="xs">
                      <div ndsSkeleton data-shape="text" data-width="2-3"></div>
                      <div ndsSkeleton data-shape="text" data-width="1-3"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.image') }}
              </p>
              <div ndsSkeletonRegion [label]="t('demonstration.regionLabels.image')" class="nds-w-full">
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div ndsSkeleton data-shape="fill"></div>
                </div>
              </div>
            </div>

            <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.paragraph') }}
              </p>
              <div
                ndsSkeletonRegion
                [label]="t('demonstration.regionLabels.paragraph')"
                class="nds-stack nds-w-full"
                data-spacing="sm"
              >
                <div ndsSkeleton data-shape="text" data-width="full"></div>
                <div ndsSkeleton data-shape="text" data-width="3-4"></div>
                <div ndsSkeleton data-shape="text" data-width="1-2"></div>
              </div>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [code]="importCode"
          componentSlug="skeleton"
          language="ts"
        />

        <nds-docs-variants
          [items]="variantItems()"
          componentSlug="skeleton"
          id="variantes"
          language="html"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="t('props.extensibilityCode')"
        />

        <nds-docs-tokens
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="skeleton"
        />

        <nds-docs-notes [items]="noteItems()" componentSlug="skeleton" />

        <nds-docs-analytics
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
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
  /** Os cinco itens da lista da demonstração — casa com a legenda. */
  protected readonly listItems = [1, 2, 3, 4, 5];
  protected readonly importCode =
    `import { NdsSkeleton, NdsSkeletonRegion } from '@/components/ui/skeleton';`;

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
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
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
            // Qualquer atributo nativo do <div> hospedeiro.
            rest: '*',
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
    return [
      'background', 'rounded', 'roundedFull', 'animation', 'duration', 'motionReduce', 'size',
    ].map((k) => ({
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
      { key: 'progress',    path: '?path=/docs/components-feedback-progress--docs'    },
      // O id do Storybook sai do title 'UI/AspectRatio', sem hífen: com hífen
      // o link cai em 404 e ninguém percebe, porque nada testa navegação.
      { key: 'aspectRatio', path: '?path=/docs/components-layout-aspectratio--docs' },
      { key: 'card',        path: '?path=/docs/components-layout-card--docs'        },
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
    // Sem tabela no conteúdo: o esqueleto é passivo e não emite evento
    // próprio. O page_view é da docs page, não do componente — por isso a
    // linha é de travessões, com a explicação do conteúdo compartilhado.
    return [
      {
        event: '—',
        trigger: toPlainText(t('analytics.description')),
        payload: '—',
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
        { level: '—',     how: t('testes.accessibility.luminanceHow') },
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
