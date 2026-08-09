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
import { NdsButton, NdsButtonIcon, type ButtonVariant, type ButtonSize } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from '@shared/content/button/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// A API do NdsButton é desta stack, não do conteúdo compartilhado: `variant`,
// `size` e `class` são inputs de signal, e o rótulo entra por projeção de
// conteúdo em vez de uma prop `label`. As descrições ficam no override, e não
// em texto fixo — presas em pt-BR apareceriam em português nas versões en e es
// da tabela.
const { t, dict } = useTranslation(buttonTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.label': 'Conteúdo projetado no botão (texto ou ícone).',
    'props.table.ariaLabel': 'Nome acessível. Obrigatório quando o botão só tem ícone.',
    'props.table.ariaBusy': 'Marca o botão como ocupado durante uma operação em andamento.',
    'props.table.ariaInvalid': 'Sinaliza que a ação está associada a dados inválidos.',
    'props.table.children': 'Conteúdo do botão, projetado via <ng-content>.',
  },
  en: {
    'props.table.label': 'Content projected into the button (text or icon).',
    'props.table.ariaLabel': 'Accessible name. Required when the button has only an icon.',
    'props.table.ariaBusy': 'Marks the button as busy while an operation is in progress.',
    'props.table.ariaInvalid': 'Signals that the action is tied to invalid data.',
    'props.table.children': 'Button content, projected through <ng-content>.',
  },
  es: {
    'props.table.label': 'Contenido proyectado en el botón (texto o icono).',
    'props.table.ariaLabel': 'Nombre accesible. Obligatorio cuando el botón solo tiene icono.',
    'props.table.ariaBusy': 'Marca el botón como ocupado mientras hay una operación en curso.',
    'props.table.ariaInvalid': 'Indica que la acción está asociada a datos inválidos.',
    'props.table.children': 'Contenido del botón, proyectado con <ng-content>.',
  },
});

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'tamanhos', 'composicoes', 'estados', 'propriedades', 'tokens',
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
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'tamanhos',     labelKey: 'nav.sizes'        },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
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

@Component({
  selector: 'nds-button-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsButton, NdsButtonIcon,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!--
      Templates de preview declarados antes do layout: DocsDoDont e DocsVariants
      recebem TemplateRef, então os componentes demonstrados são reais (com
      bindings e change detection), não DOM montado à mão.
    -->
    <!--
      Os previews seguem o Vanilla, que é a referência cross-stack: par 1
      contrasta rótulo de ação com rótulo genérico; par 2 contrasta hierarquia
      num par de ações. Nenhum dos dois demonstra icon-only sem nome acessível
      — um "não faça" desse tipo seria uma violação real de axe na página, e a
      docs page precisa passar no próprio portão que documenta.
    -->
    <ng-template #tplDoDont1Do>
      <button ndsButton variant="default">Salvar</button>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <button ndsButton variant="default">Clique aqui</button>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <span class="nds-cluster" data-spacing="xs">
        <button ndsButton variant="outline">Cancelar</button>
        <button ndsButton variant="default">Confirmar</button>
      </span>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <span class="nds-cluster" data-spacing="xs">
        <button ndsButton variant="default">Salvar</button>
        <button ndsButton variant="default">Enviar</button>
      </span>
    </ng-template>

    <ng-template #tplVarDefault>
      <button ndsButton variant="default">{{ t('variants.items.default') }}</button>
    </ng-template>
    <ng-template #tplVarSecondary>
      <button ndsButton variant="secondary">{{ t('variants.items.secondary') }}</button>
    </ng-template>
    <ng-template #tplVarDestructive>
      <button ndsButton variant="destructive">{{ t('variants.items.destructive') }}</button>
    </ng-template>
    <ng-template #tplVarOutline>
      <button ndsButton variant="outline">{{ t('variants.items.outline') }}</button>
    </ng-template>
    <ng-template #tplVarGhost>
      <button ndsButton variant="ghost">{{ t('variants.items.ghost') }}</button>
    </ng-template>
    <ng-template #tplVarLink>
      <button ndsButton variant="link">{{ t('variants.items.asLink.linkLabel') }}</button>
    </ng-template>

    <ng-template #tplSizeXs><button ndsButton size="xs">{{ t('variants.sizes.xs') }}</button></ng-template>
    <ng-template #tplSizeSm><button ndsButton size="sm">{{ t('variants.sizes.sm') }}</button></ng-template>
    <ng-template #tplSizeDefault><button ndsButton>{{ t('variants.sizes.default') }}</button></ng-template>
    <ng-template #tplSizeLg><button ndsButton size="lg">{{ t('variants.sizes.lg') }}</button></ng-template>
    <ng-template #tplSizeIconXs>
      <button ndsButton size="icon-xs" [attr.aria-label]="t('variants.sizes.icon-xs')">
        <svg ndsButtonIcon kind="plus" size="sm"></svg>
      </button>
    </ng-template>
    <ng-template #tplSizeIconSm>
      <button ndsButton size="icon-sm" [attr.aria-label]="t('variants.sizes.icon-sm')">
        <svg ndsButtonIcon kind="plus" size="sm"></svg>
      </button>
    </ng-template>
    <ng-template #tplSizeIcon>
      <button ndsButton size="icon" [attr.aria-label]="t('variants.sizes.icon')">
        <svg ndsButtonIcon kind="plus"></svg>
      </button>
    </ng-template>
    <ng-template #tplSizeIconLg>
      <button ndsButton size="icon-lg" [attr.aria-label]="t('variants.sizes.icon-lg')">
        <svg ndsButtonIcon kind="plus" size="lg"></svg>
      </button>
    </ng-template>

    <ng-template #tplCompIconLeft>
      <button ndsButton variant="default">
        <svg ndsButtonIcon kind="plus"></svg>
        <span>{{ t('variants.compositions.iconLeft.name') }}</span>
      </button>
    </ng-template>
    <ng-template #tplCompIconRight>
      <button ndsButton variant="outline">
        <span>{{ t('variants.compositions.iconRight.name') }}</span>
        <svg ndsButtonIcon kind="chevron-right"></svg>
      </button>
    </ng-template>
    <ng-template #tplCompActionPair>
      <!-- Rótulos literais como no Vanilla: são exemplo de composição, não
           chrome da interface, então não vivem em ui.json. -->
      <span class="nds-cluster" data-spacing="sm">
        <button ndsButton variant="outline">Cancelar</button>
        <button ndsButton variant="default">Confirmar</button>
      </span>
    </ng-template>
    <ng-template #tplCompDestructiveIcon>
      <button ndsButton variant="destructive">
        <svg ndsButtonIcon kind="trash"></svg>
        <span>{{ t('variants.compositions.destructiveWithIcon.name') }}</span>
      </button>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="button"
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
        <!-- 1. Demonstração -->
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-cluster" data-spacing="sm">
            @for (v of demoVariants(); track v.variant) {
              <button
                ndsButton
                [variant]="v.variant"
                (click)="onDemoClick(v.variant, v.label)"
              >{{ v.label }}</button>
            }
            <button ndsButton variant="default" (click)="onDemoClick('default', 'with-icon')">
              <svg ndsButtonIcon kind="plus"></svg>
              <span>{{ t('demonstration.labels.withIcon') }}</span>
            </button>
            <button
              ndsButton
              variant="destructive"
              size="icon"
              [attr.aria-label]="t('demonstration.labels.iconOnly')"
              (click)="onDemoClick('destructive', 'icon-only')"
            >
              <svg ndsButtonIcon kind="trash"></svg>
            </button>
          </div>
        </nds-docs-demonstration>

        <!-- 2. Anatomia -->
        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <!-- 3. Quando usar -->
        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <!-- 4. Do / Don't -->
        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <!-- 5. Importação -->
        <nds-docs-import
          [title]="t('import.title')"
          [code]="t('import.basic')"
          [secondaryCode]="t('import.withIcon')"
          componentSlug="button"
          language="ts"
        />

        <!-- 6. Variantes -->
        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="button"
          id="variantes"
        />

        <!-- 7. Tamanhos -->
        <nds-docs-variants
          [title]="t('variants.sizesTitle')"
          [items]="sizeItems()"
          componentSlug="button"
          id="tamanhos"
        />

        <!-- 8. Composições -->
        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="button"
        />

        <!-- 9. Estados -->
        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <!-- 10. Propriedades -->
        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <!-- 11. Tokens -->
        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
        />

        <!-- 12. Acessibilidade -->
        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderItems]="screenReaderItems()"
        />

        <!-- 13. Relacionados -->
        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="button"
        />

        <!-- 14. Notas -->
        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="button"
        />

        <!-- 15. Analytics -->
        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <!-- 16. Testes -->
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
export class NdsButtonDocs implements AfterViewInit, OnDestroy {
  // `t` e `tNav` expostos ao template: o dicionário é reativo ao signal de
  // locale, então trocar de idioma re-renderiza a página inteira sem
  // reconstruir nada à mão (o Vanilla precisa de `subscribe` + rebuild).
  protected readonly t = t;
  protected readonly tNav = tNav;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // ── Templates de preview ─────────────────────────────────────────────────
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarSecondary = viewChild.required<TemplateRef<unknown>>('tplVarSecondary');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarOutline = viewChild.required<TemplateRef<unknown>>('tplVarOutline');
  private readonly tplVarGhost = viewChild.required<TemplateRef<unknown>>('tplVarGhost');
  private readonly tplVarLink = viewChild.required<TemplateRef<unknown>>('tplVarLink');

  private readonly tplSizeXs = viewChild.required<TemplateRef<unknown>>('tplSizeXs');
  private readonly tplSizeSm = viewChild.required<TemplateRef<unknown>>('tplSizeSm');
  private readonly tplSizeDefault = viewChild.required<TemplateRef<unknown>>('tplSizeDefault');
  private readonly tplSizeLg = viewChild.required<TemplateRef<unknown>>('tplSizeLg');
  private readonly tplSizeIconXs = viewChild.required<TemplateRef<unknown>>('tplSizeIconXs');
  private readonly tplSizeIconSm = viewChild.required<TemplateRef<unknown>>('tplSizeIconSm');
  private readonly tplSizeIcon = viewChild.required<TemplateRef<unknown>>('tplSizeIcon');
  private readonly tplSizeIconLg = viewChild.required<TemplateRef<unknown>>('tplSizeIconLg');

  private readonly tplCompIconLeft = viewChild.required<TemplateRef<unknown>>('tplCompIconLeft');
  private readonly tplCompIconRight = viewChild.required<TemplateRef<unknown>>('tplCompIconRight');
  private readonly tplCompActionPair = viewChild.required<TemplateRef<unknown>>('tplCompActionPair');
  private readonly tplCompDestructiveIcon =
    viewChild.required<TemplateRef<unknown>>('tplCompDestructiveIcon');

  // ── Navegação ────────────────────────────────────────────────────────────
  protected readonly navGroups = computed(() => {
    // Leitura do dicionário para amarrar este computed ao signal de locale:
    // `tNav` sozinho é uma função comum e não registraria a dependência.
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  // ── Demonstração ─────────────────────────────────────────────────────────
  protected readonly demoVariants = computed<{ variant: ButtonVariant; label: string }[]>(() => {
    dict();
    return [
      { variant: 'default',     label: t('demonstration.labels.primary')     },
      { variant: 'secondary',   label: t('demonstration.labels.secondary')   },
      { variant: 'destructive', label: t('demonstration.labels.destructive') },
      { variant: 'outline',     label: t('demonstration.labels.outline')     },
      { variant: 'ghost',       label: t('demonstration.labels.ghost')       },
      { variant: 'link',        label: t('demonstration.labels.link')        },
    ];
  });

  protected onDemoClick(variant: ButtonVariant, label: string): void {
    track('button_click', { component: 'button', variant, label, location: 'docs_demo' });
  }

  // ── Anatomia ─────────────────────────────────────────────────────────────
  protected readonly anatomyItems = computed(() => {
    dict();
    return [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3'), t('anatomy.item4')];
  });

  // ── Quando usar ──────────────────────────────────────────────────────────
  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [
        t('usage.guidelines.item1'),
        t('usage.guidelines.item2'),
        t('usage.guidelines.item3'),
        t('usage.guidelines.item4'),
      ],
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
    // Linhas nomeadas, não numeradas: esta tabela documenta quatro elementos
    // fixos do Button, e o conteúdo compartilhado usa a chave do elemento.
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['label', 'ariaLabel', 'iconOnly', 'loading'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return {
      title: t('usage.do.title'),
      items: [t('usage.do.item1'), t('usage.do.item2'), t('usage.do.item3'), t('usage.do.item4')],
    };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [
        t('usage.dont.item1'), t('usage.dont.item2'),
        t('usage.dont.item3'), t('usage.dont.item4'),
      ],
    };
  });

  // ── Do / Don't ───────────────────────────────────────────────────────────
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

  // ── Variantes / Tamanhos / Composições ───────────────────────────────────
  protected readonly variantItems = computed(() => {
    dict();
    return [
      { name: t('variants.items.default'),     description: t('variants.items.default'),     trackId: 'default',     preview: this.tplVarDefault()     },
      { name: t('variants.items.secondary'),   description: t('variants.items.secondary'),   trackId: 'secondary',   preview: this.tplVarSecondary()   },
      { name: t('variants.items.destructive'), description: t('variants.items.destructive'), trackId: 'destructive', preview: this.tplVarDestructive() },
      { name: t('variants.items.outline'),     description: t('variants.items.outline'),     trackId: 'outline',     preview: this.tplVarOutline()     },
      { name: t('variants.items.ghost'),       description: t('variants.items.ghost'),       trackId: 'ghost',       preview: this.tplVarGhost()       },
      { name: t('variants.items.asLink.name'), description: t('variants.items.asLink.description'), trackId: 'link', preview: this.tplVarLink()        },
    ];
  });

  protected readonly sizeItems = computed(() => {
    dict();
    const sizes: { key: ButtonSize; tpl: TemplateRef<unknown> }[] = [
      { key: 'xs',      tpl: this.tplSizeXs()      },
      { key: 'sm',      tpl: this.tplSizeSm()      },
      { key: 'default', tpl: this.tplSizeDefault() },
      { key: 'lg',      tpl: this.tplSizeLg()      },
      { key: 'icon-xs', tpl: this.tplSizeIconXs()  },
      { key: 'icon-sm', tpl: this.tplSizeIconSm()  },
      { key: 'icon',    tpl: this.tplSizeIcon()    },
      { key: 'icon-lg', tpl: this.tplSizeIconLg()  },
    ];
    return sizes.map(({ key, tpl }) => ({
      name: t(`variants.sizes.${key}`),
      description: t(`variants.sizes.${key}`),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.compositions.iconLeft.name'),
        description: t('variants.compositions.iconLeft.description'),
        useWhen: t('variants.compositions.iconLeft.use'),
        trackId: 'icon-left',
        preview: this.tplCompIconLeft(),
      },
      {
        name: t('variants.compositions.iconRight.name'),
        description: t('variants.compositions.iconRight.description'),
        useWhen: t('variants.compositions.iconRight.use'),
        trackId: 'icon-right',
        preview: this.tplCompIconRight(),
      },
      {
        name: t('variants.compositions.actionPair.name'),
        description: t('variants.compositions.actionPair.description'),
        useWhen: t('variants.compositions.actionPair.use'),
        trackId: 'action-pair',
        preview: this.tplCompActionPair(),
      },
      {
        name: t('variants.compositions.destructiveWithIcon.name'),
        description: t('variants.compositions.destructiveWithIcon.description'),
        useWhen: t('variants.compositions.destructiveWithIcon.use'),
        trackId: 'destructive-with-icon',
        preview: this.tplCompDestructiveIcon(),
      },
    ];
  });

  // ── Estados ──────────────────────────────────────────────────────────────
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
    return ['default', 'hover', 'focusVisible', 'disabled', 'loading', 'invalid'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: t(`states.${k}.trigger`),
      behavior: t(`states.${k}.behavior`),
    }));
  });

  // ── Propriedades ─────────────────────────────────────────────────────────
  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const req = tNav('common.no');
    return [
      {
        title: t('props.buttonTitle'),
        cols,
        items: [
          { name: 'variant',  type: 'ButtonVariant', defaultValue: "'default'", required: req, description: t('props.table.variant')   },
          { name: 'size',     type: 'ButtonSize',    defaultValue: "'default'", required: req, description: t('props.table.size')      },
          { name: 'disabled', type: 'boolean',       defaultValue: 'false',     required: req, description: t('props.table.disabled')  },
          { name: 'type',     type: "'button' | 'submit' | 'reset'", defaultValue: "'button'", required: req, description: t('props.table.htmlType') },
          { name: 'class',    type: 'string',        defaultValue: "''",        required: req, description: t('props.table.className') },
          { name: 'aria-label', type: 'string',      defaultValue: '—',         required: req, description: t('props.table.ariaLabel') },
          { name: '(click)',  type: '(e: MouseEvent) => void', defaultValue: '—', required: req, description: t('props.table.onClick') },
          { name: '<ng-content>', type: 'TemplateRef', defaultValue: '—',       required: req, description: t('props.table.children') },
        ],
      },
    ];
  });

  // ── Tokens ───────────────────────────────────────────────────────────────
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
      { token: '--primary',            value: '.nds-button-default',     description: t('tokens.table.primary')           },
      { token: '--primary-foreground', value: '.nds-button-default',     description: t('tokens.table.primaryForeground') },
      { token: '--secondary',          value: '.nds-button-secondary',   description: t('tokens.table.secondary')         },
      { token: '--destructive',        value: '.nds-button-destructive', description: t('tokens.table.destructive')       },
      { token: '--accent',             value: '.nds-button-ghost',       description: t('tokens.table.accent')            },
      { token: '--border',             value: '.nds-button-outline',     description: t('tokens.table.border')            },
      { token: '--ring',               value: ':focus-visible',          description: t('tokens.table.ring')              },
      { token: '--radius',             value: '.nds-button',             description: t('tokens.table.radius')            },
    ];
  });

  // ── Acessibilidade ───────────────────────────────────────────────────────
  protected readonly a11yItems = computed(() => {
    dict();
    return [
      t('accessibility.item1'), t('accessibility.item2'), t('accessibility.item3'),
      t('accessibility.item4'), t('accessibility.item5'),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: t('accessibility.keyboard.tab')      },
      { key: 'Enter',     description: t('accessibility.keyboard.enter')    },
      { key: 'Space',     description: t('accessibility.keyboard.space')    },
      { key: 'disabled',  description: t('accessibility.keyboard.disabled') },
    ];
  });

  /**
   * As chaves de `accessibility.screenReader` variam por componente, então só os
   * valores chegam ao container — o `t()` exige nome de chave e não serviria.
   */
  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = buttonTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  // ── Relacionados ─────────────────────────────────────────────────────────
  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { name: 'Toggle',       description: t('related.toggle'),      path: '?path=/docs/ui-toggle--docs'       },
      { name: 'Switch',       description: t('related.switch'),      path: '?path=/docs/ui-switch--docs'       },
      { name: 'Dialog',       description: t('related.dialog'),      path: '?path=/docs/ui-dialog--docs'       },
      { name: 'Alert Dialog', description: t('related.alertDialog'), path: '?path=/docs/ui-alert-dialog--docs' },
      { name: 'Link',         description: t('related.link'),        path: '?path=/docs/ui-breadcrumb--docs'   },
    ];
  });

  // ── Notas ────────────────────────────────────────────────────────────────
  protected readonly noteItems = computed(() => {
    dict();
    return [
      { title: '', content: t('notes.tip1') },
      { title: '', content: t('notes.tip2') },
      { title: '', content: t('notes.tip3') },
    ];
  });

  // ── Analytics ────────────────────────────────────────────────────────────
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
      { event: t('analytics.table.pageView'),      trigger: t('analytics.table.pageViewTrigger'),      payload: t('analytics.table.pageViewPayload')      },
      { event: t('analytics.table.click'),         trigger: t('analytics.table.clickTrigger'),         payload: t('analytics.table.clickPayload')         },
      { event: t('analytics.table.sectionViewed'), trigger: t('analytics.table.sectionViewedTrigger'), payload: t('analytics.table.sectionViewedPayload') },
      { event: t('analytics.table.langSwitch'),    trigger: t('analytics.table.langSwitchTrigger'),    payload: t('analytics.table.langSwitchPayload')    },
    ];
  });

  // ── Testes ───────────────────────────────────────────────────────────────
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
      // toPlainText/stripHtml: as células são texto puro (interpolação), então
      // o <code> do conteúdo apareceria como marcação literal na tabela.
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
      // 'WCAG' literal: é o nome do padrão, não rótulo traduzível.
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

  // ── SEO + observador de seção ────────────────────────────────────────────
  private cleanupSeo: (() => void) | undefined;
  private observer: { disconnect: () => void } | undefined;

  constructor() {
    // effect e não `subscribe`: o SEO precisa ser reaplicado a cada troca de
    // idioma, e a dependência do signal de locale entra pela leitura de `dict()`.
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'button',
      });
      track('docs_page_view', {
        component_name: 'button',
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
          component_name: 'button',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.cleanupSeo?.();
  }
}

/**
 * Reconstrói linhas de tabela a partir do dicionário achatado.
 *
 * O conteúdo compartilhado numera as linhas como `item1`, `item2`… (chaves
 * nomeadas, não array), e `t()` só devolve folha — então uma lista de tamanho
 * variável não sai por chamada nomeada. Percorre até a primeira lacuna, o que
 * evita repetir na docs page um `[1,2,3,4,5,6]` que envelhece quando o
 * ux-writer acrescenta uma linha.
 */
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
