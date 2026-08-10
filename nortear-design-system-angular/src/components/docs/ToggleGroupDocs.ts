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
import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from '@/components/ui/toggle-group';
import uiTranslations from '@/i18n/ui.json';
import toggleGroupTranslations from '@shared/content/toggle-group/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
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

// Quatro desvios do conteúdo compartilhado, e nenhum deles é snippet de código
// (snippet em override ficaria preso a um stack e invisível ao conteúdo):
//
// 1. `anatomy.item2` descreve o item como um subcomponente próprio. Aqui o item
//    É o Toggle do design system, com um `value`; não existe segunda peça.
// 2. `notes.item1` nomeia as bibliotecas das outras stacks. Cada docs page é
//    consumida isoladamente, então a lista alheia só vaza — a nota passa a
//    falar dos primitivos que ESTE componente compõe.
// 3. `notes.item4` promete variante e tamanho herdados por contexto. Quem
//    emenda o conjunto aqui é a regra de CSS do grupo, e o tamanho é escolha de
//    cada item.
// 4. `props.table.spacing.description` promete uma escada fina de distância. O
//    CSS compartilhado só resolve o caso "emendado"; acima disso vale o
//    espaçamento único da regra base.
const { t, dict } = useTranslation(toggleGroupTranslations as Record<string, unknown>, {
  'pt-BR': {
    'anatomy.item2': '<strong>Item</strong> — o próprio Toggle do design system com um <code>value</code> único; quem decide se ele está pressionado é o grupo.',
    'notes.item1': '<strong>Primitivos</strong>: <code>RdxCompositeRoot</code> (roving tabindex, setas, Home/End) mais o contexto de grupo que o <code>RdxToggle</code> de cada item consome.',
    'notes.item4': '<strong>Conjunto emendado</strong> — a variante do grupo é quem junta os itens numa borda só; o tamanho continua sendo escolha de cada item.',
    'props.table.spacing.description': 'Distância entre itens. <code>0</code> emenda as bordas (segmentado); acima disso os botões ficam separados.',
  },
  en: {
    'anatomy.item2': '<strong>Item</strong> — the design system Toggle itself with a unique <code>value</code>; the group decides whether it is pressed.',
    'notes.item1': '<strong>Primitives</strong>: <code>RdxCompositeRoot</code> (roving tabindex, arrows, Home/End) plus the group context each item\'s <code>RdxToggle</code> consumes.',
    'notes.item4': '<strong>Joined set</strong> — the group variant is what merges the items into a single border; size stays a per-item choice.',
    'props.table.spacing.description': 'Distance between items. <code>0</code> joins the borders (segmented); above that the buttons are separated.',
  },
  es: {
    'anatomy.item2': '<strong>Item</strong> — el propio Toggle del design system con un <code>value</code> único; quien decide si está presionado es el grupo.',
    'notes.item1': '<strong>Primitivos</strong>: <code>RdxCompositeRoot</code> (roving tabindex, flechas, Home/End) más el contexto de grupo que consume el <code>RdxToggle</code> de cada ítem.',
    'notes.item4': '<strong>Conjunto unido</strong> — la variante del grupo es la que junta los ítems en un solo borde; el tamaño sigue siendo elección de cada ítem.',
    'props.table.spacing.description': 'Distancia entre ítems. <code>0</code> une los bordes (segmentado); por encima de eso los botones quedan separados.',
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
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
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

// O contrato real deste stack, escrito à mão porque o compodoc está desligado
// (ver CLAUDE.md). É também onde a composição fica explícita: o item não é um
// subcomponente novo, é o `<button ndsToggle>` do slug `toggle`.
const INTERFACE_CODE = `// <div ndsToggleGroup> — o item é o Toggle do design system
<div
  ndsToggleGroup
  type="single"
  variant="outline"
  defaultValue="left"
  (valueChange)="alinhamento.set($event)"
  aria-label="Alinhamento do texto"
>
  <button ndsToggle variant="outline" value="left" aria-label="Alinhar à esquerda">
    <svg ndsToggleGroupIcon kind="align-left"></svg>
  </button>
</div>

// role="toolbar", aria-orientation, data-slot e data-variant saem do grupo;
// aria-pressed, data-state e o atributo disabled saem de cada item.
// Não os escreva no elemento.`;

@Component({
  selector: 'nds-toggle-group-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsToggleGroup, NdsToggleGroupIcon, NdsToggle, NdsToggleIcon,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div ndsToggleGroup variant="outline" defaultValue="left" [attr.aria-label]="t('demonstration.labels.alignmentLabel')">
        <button ndsToggle variant="outline" value="left" [attr.aria-label]="t('demonstration.labels.left')">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" [attr.aria-label]="t('demonstration.labels.center')">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" value="right" [attr.aria-label]="t('demonstration.labels.right')">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle variant="outline" [attr.aria-label]="t('demonstration.labels.left')">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" [attr.aria-label]="t('demonstration.labels.center')">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" [attr.aria-label]="t('demonstration.labels.right')">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsToggleGroup type="multiple" variant="outline" [attr.aria-label]="t('demonstration.labels.formattingLabel')">
        <button ndsToggle variant="outline" value="bold" [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" value="italic" [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsToggleGroup type="multiple" variant="outline">
        <button ndsToggle variant="outline" value="bold" [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" value="italic" [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
      </div>
    </ng-template>

    <ng-template #tplVarSingle>
      <div ndsToggleGroup variant="outline" defaultValue="center" [attr.aria-label]="t('demonstration.labels.alignmentLabel')">
        <button ndsToggle variant="outline" value="left" [attr.aria-label]="t('demonstration.labels.left')">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" [attr.aria-label]="t('demonstration.labels.center')">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" value="right" [attr.aria-label]="t('demonstration.labels.right')">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplVarMultiple>
      <div ndsToggleGroup type="multiple" variant="outline" [defaultValue]="['bold', 'italic']" [attr.aria-label]="t('demonstration.labels.formattingLabel')">
        <button ndsToggle variant="outline" value="bold" [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" value="italic" [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle variant="outline" value="underline" [attr.aria-label]="t('demonstration.labels.underline')">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplVarVertical>
      <div ndsToggleGroup orientation="vertical" variant="outline" defaultValue="grid" [attr.aria-label]="t('demonstration.labels.viewLabel')">
        <button ndsToggle variant="outline" value="grid">
          <svg ndsToggleGroupIcon kind="grid"></svg>
          {{ t('demonstration.labels.grid') }}
        </button>
        <button ndsToggle variant="outline" value="list">
          <svg ndsToggleIcon kind="list"></svg>
          {{ t('demonstration.labels.list') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplCompAlignmentBar>
      <div ndsToggleGroup variant="outline" defaultValue="left" [attr.aria-label]="t('demonstration.labels.alignmentLabel')">
        <button ndsToggle variant="outline" value="left" [attr.aria-label]="t('demonstration.labels.left')">
          <svg ndsToggleGroupIcon kind="align-left"></svg>
        </button>
        <button ndsToggle variant="outline" value="center" [attr.aria-label]="t('demonstration.labels.center')">
          <svg ndsToggleGroupIcon kind="align-center"></svg>
        </button>
        <button ndsToggle variant="outline" value="right" [attr.aria-label]="t('demonstration.labels.right')">
          <svg ndsToggleGroupIcon kind="align-right"></svg>
        </button>
        <button ndsToggle variant="outline" value="justify" [attr.aria-label]="t('demonstration.labels.justify')">
          <svg ndsToggleGroupIcon kind="align-justify"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplCompViewMode>
      <div ndsToggleGroup orientation="vertical" variant="outline" defaultValue="list" [attr.aria-label]="t('demonstration.labels.viewLabel')">
        <button ndsToggle variant="outline" value="grid">
          <svg ndsToggleGroupIcon kind="grid"></svg>
          {{ t('demonstration.labels.grid') }}
        </button>
        <button ndsToggle variant="outline" value="list">
          <svg ndsToggleIcon kind="list"></svg>
          {{ t('demonstration.labels.list') }}
        </button>
      </div>
    </ng-template>
    <ng-template #tplCompFilterWithText>
      <div ndsToggleGroup type="multiple" [spacing]="1" [defaultValue]="['bold']" [attr.aria-label]="t('demonstration.labels.formattingLabel')">
        <button ndsToggle variant="outline" value="bold">
          <svg ndsToggleIcon kind="bold"></svg>
          {{ t('demonstration.labels.bold') }}
        </button>
        <button ndsToggle variant="outline" value="italic">
          <svg ndsToggleIcon kind="italic"></svg>
          {{ t('demonstration.labels.italic') }}
        </button>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="toggle-group"
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
          <div class="nds-stack nds-w-full" data-spacing="lg">
            <div ndsToggleGroup variant="outline" defaultValue="left" [attr.aria-label]="t('demonstration.labels.alignmentLabel')">
              <button ndsToggle variant="outline" value="left" [attr.aria-label]="t('demonstration.labels.left')">
                <svg ndsToggleGroupIcon kind="align-left"></svg>
              </button>
              <button ndsToggle variant="outline" value="center" [attr.aria-label]="t('demonstration.labels.center')">
                <svg ndsToggleGroupIcon kind="align-center"></svg>
              </button>
              <button ndsToggle variant="outline" value="right" [attr.aria-label]="t('demonstration.labels.right')">
                <svg ndsToggleGroupIcon kind="align-right"></svg>
              </button>
              <button ndsToggle variant="outline" value="justify" [attr.aria-label]="t('demonstration.labels.justify')">
                <svg ndsToggleGroupIcon kind="align-justify"></svg>
              </button>
            </div>

            <div ndsToggleGroup type="multiple" variant="outline" [defaultValue]="['bold']" [attr.aria-label]="t('demonstration.labels.formattingLabel')">
              <button ndsToggle variant="outline" value="bold" [attr.aria-label]="t('demonstration.labels.bold')">
                <svg ndsToggleIcon kind="bold"></svg>
              </button>
              <button ndsToggle variant="outline" value="italic" [attr.aria-label]="t('demonstration.labels.italic')">
                <svg ndsToggleIcon kind="italic"></svg>
              </button>
              <button ndsToggle variant="outline" value="underline" [attr.aria-label]="t('demonstration.labels.underline')">
                <svg ndsToggleIcon kind="underline"></svg>
              </button>
            </div>

            <div ndsToggleGroup type="multiple" [spacing]="1" [attr.aria-label]="t('demonstration.labels.viewLabel')">
              <button ndsToggle variant="outline" value="grid">
                <svg ndsToggleGroupIcon kind="grid"></svg>
                {{ t('demonstration.labels.grid') }}
              </button>
              <button ndsToggle variant="outline" value="list">
                <svg ndsToggleIcon kind="list"></svg>
                {{ t('demonstration.labels.list') }}
              </button>
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
          componentSlug="toggle-group"
          language="ts"
        />

        <nds-docs-compositions
          id="variantes"
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="toggle-group"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="toggle-group"
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
          componentSlug="toggle-group"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="toggle-group" />

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
export class NdsToggleGroupDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';
import { NdsToggleGroup, NdsToggleGroupIcon } from '@/components/ui/toggle-group';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarMultiple = viewChild.required<TemplateRef<unknown>>('tplVarMultiple');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplCompAlignmentBar = viewChild.required<TemplateRef<unknown>>('tplCompAlignmentBar');
  private readonly tplCompViewMode = viewChild.required<TemplateRef<unknown>>('tplCompViewMode');
  private readonly tplCompFilterWithText = viewChild.required<TemplateRef<unknown>>('tplCompFilterWithText');

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
    // A tabela de UX writing escreve textNode: sem toPlainText o `&lt;code&gt;`
    // apareceria com as tags na tela.
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['groupLabel', 'itemLabel', 'order'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
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
    const pares: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pares.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'single',   tpl: this.tplVarSingle()   },
      { key: 'multiple', tpl: this.tplVarMultiple() },
      { key: 'vertical', tpl: this.tplVarVertical() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: stripHtml(t(`variants.styles.${key}`)),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'alignmentBar',   tpl: this.tplCompAlignmentBar()   },
      { key: 'viewMode',       tpl: this.tplCompViewMode()       },
      { key: 'filterWithText', tpl: this.tplCompFilterWithText() },
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
    return ['default', 'selected', 'hover', 'focus', 'disabled', 'disabledItem'].map((k) => ({
      label: toPlainText(t(`states.${k}.label`)),
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
    // Nomes e tipos vêm da API real: `value` é um `model` (aceita `[(value)]`),
    // a mudança sai pelo output `valueChange` e não existe input de classe. O
    // `size` do conteúdo compartilhado não aparece porque o grupo não tem esse
    // input — o degrau de densidade é escolha de cada item.
    const linhas: { name: string; type: string; k: string }[] = [
      { name: 'type',         type: '"single" | "multiple"',           k: 'type_prop'     },
      { name: 'value',        type: 'model<string | string[]>',        k: 'value'         },
      { name: 'defaultValue', type: 'string | string[]',               k: 'defaultValue'  },
      { name: 'valueChange',  type: 'output<string | string[]>',       k: 'onValueChange' },
      { name: 'disabled',     type: 'boolean',                         k: 'disabled'      },
      { name: 'orientation',  type: '"horizontal" | "vertical"',       k: 'orientation'   },
      { name: 'variant',      type: '"default" | "outline"',           k: 'variant'       },
      { name: 'spacing',      type: 'number',                          k: 'spacing'       },
    ];
    return [
      {
        title: 'NdsToggleGroup',
        cols,
        items: linhas.map(({ name, type, k }) => ({
          name,
          type,
          defaultValue: toPlainText(t(`props.table.${k}.default`)),
          required: toPlainText(t(`props.table.${k}.required`)),
          description: toPlainText(t(`props.table.${k}.description`)),
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
    // `--destructive` do conteúdo compartilhado fica de fora: a folha do grupo
    // não pinta estado de validação, e listar token que nenhuma regra usa
    // ensina o leitor a procurar o que não existe.
    return [
      { token: '--muted',             k: 'muted'      },
      { token: '--accent-foreground', k: 'foreground' },
      { token: '--input',             k: 'input'      },
      { token: '--ring',              k: 'ring'       },
      { token: '--radius',            k: 'radius'     },
    ].map(({ token, k }) => ({
      token,
      value: '.nds-toggle-group',
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '→',     description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: '←',     description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: '↓',     description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',     description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Home',  description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',   description: toPlainText(t('accessibility.keyboard.end')) },
      { key: 'Space', description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = toggleGroupTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const bloco = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da lista, não um item dela.
    return Object.entries(bloco).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'toggle',     path: '?path=/docs/ui-toggle--docs'     },
      { key: 'tabs',       path: '?path=/docs/ui-tabs--docs'       },
      { key: 'radioGroup', path: '?path=/docs/ui-radiogroup--docs' },
      { key: 'checkbox',   path: '?path=/docs/ui-checkbox--docs'   },
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
    return [{
      event: 'field_change',
      trigger: toPlainText(t('analytics.table.field_change.trigger')),
      payload: toPlainText(t('analytics.table.field_change.payload')),
    }];
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
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // Este bloco numera critérios como string solta, não como objeto — daí a
      // lista simples em vez do itemsFromDict das outras duas tabelas.
      items: [1, 2, 3, 4, 5].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: '—',
        how: 'axe + play',
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
        componentSlug: 'toggle-group',
      });
      track('docs_page_view', {
        component_name: 'toggle-group',
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
          component_name: 'toggle-group',
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
