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
import { NdsSlider } from '@/components/ui/slider';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import sliderTranslations from '@shared/content/slider/translations.json';

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

// Sobrescritas locais. Todas por motivo declarado — nenhuma por gosto.
const { t, dict } = useTranslation(sliderTranslations as Record<string, unknown>, {
  '*': {
    // Prop do primitivo: `valueChange` é o output do Radix NG.
    'props.table.onValueChange.type': 'output<number[]>',
    'props.table.onValueCommitted.type': 'output<number[]>',
  },
  'pt-BR': {
    // O conteúdo compartilhado lista as libs de cada stack pelo nome. Cada
    // documentação é lida isoladamente, então a comparação não faz sentido aqui.
    'notes.item1':
      '<strong>Lib upstream</strong>: <code>@radix-ng/primitives</code> — teclado, arraste e múltiplos thumbs vêm dela.',
    // `h-40` é classe de utilitário de uma lib que saiu do projeto.
    'notes.item4':
      '<strong>Vertical</strong> — o trilho ocupa a altura do container; sem altura definida ele usa a altura mínima da própria regra.',
    'accessibility.items.item5': 'Anel de foco visível na alça, com o token <code>--ring</code>',
  },
  en: {
    'notes.item1':
      '<strong>Upstream library</strong>: <code>@radix-ng/primitives</code> — keyboard, dragging and multiple thumbs come from it.',
    'notes.item4':
      '<strong>Vertical</strong> — the track fills the container height; with no height set it falls back to the rule’s own minimum.',
    'accessibility.items.item5': 'Visible focus ring on the thumb, using the <code>--ring</code> token',
  },
  es: {
    'notes.item1':
      '<strong>Librería upstream</strong>: <code>@radix-ng/primitives</code> — teclado, arrastre y múltiples thumbs vienen de ella.',
    'notes.item4':
      '<strong>Vertical</strong> — el riel ocupa la altura del contenedor; sin altura definida usa el mínimo de la propia regla.',
    'accessibility.items.item5': 'Anillo de foco visible en el thumb, con el token <code>--ring</code>',
  },
});

/**
 * Rótulo de navegação, com queda para o ui.json.
 *
 * Nem todo componente declara a lista de nav inteira no próprio JSON: o
 * slider não tem nav.compositions. Sem a queda, o que aparece na barra
 * lateral é a chave crua.
 */
function navLabel(chave: string): string {
  const doComponente = t(chave);
  return doComponente === chave ? tNav(chave) : doComponente;
}

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

const INTERFACE_CODE = `// <div ndsSlider> — o consumidor escreve UM elemento.
// As cinco partes internas (control, track, range, thumb, input) nascem do
// template, e a quantidade de alças vem do tamanho de \`value\`.
@Component({
  selector: 'div[ndsSlider]',
  hostDirectives: [
    { directive: RdxSliderRoot,
      inputs: ['value', 'min', 'max', 'step', 'disabled',
               'orientation', 'minStepsBetweenValues'],
      outputs: ['valueChange'] },
  ],
})
export class NdsSlider {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly thumbLabels = input<readonly string[]>([]);
}

// Uso com Reactive Forms:
// <div ndsSlider formControlName="volume" aria-label="Volume"></div>`;

// A anatomia e a customização vêm do conteúdo compartilhado, como nas outras
// quatro stacks.
//
// Viviam aqui como constantes locais, e as duas estavam erradas de formas
// diferentes:
//
//  - a anatomia local existia porque a variante `angular` do conteúdo
//    compartilhado ensinava `<nds-slider />`, um elemento que não existe (o
//    seletor é `div[ndsSlider]`). Contornar localmente deixou o erro de pé no
//    conteúdo, que é o que o pacote `@nortear/ds-core` publica. A variante foi
//    corrigida na fonte, e a cópia local perdeu a razão de ser;
//  - a customização local ensinava `--spacing-5`, token que não existe em
//    nenhum CSS do projeto (a escala pula 3, 5 e 7). O leitor copiaria uma
//    regra que não muda nada.
//
// Constante local de snippet também custa os outros dois idiomas: as duas
// respondiam em português para quem lesse a página em inglês ou espanhol.

@Component({
  selector: 'nds-slider-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsSlider, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <label ndsLabel for="dd1-do">{{ t('demonstration.labels.volume') }}</label>
          <span class="nds-text-caption nds-tabular-nums" aria-live="polite">60%</span>
        </div>
        <div
          ndsSlider
          id="dd1-do"
          [value]="[60]"
          [aria-label]="t('demonstration.labels.volume')"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div
          ndsSlider
          [value]="[60]"
          [aria-label]="t('demonstration.labels.volume')"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel>{{ t('demonstration.labels.brightness') }}</label>
        <div
          ndsSlider
          [value]="[40]"
          [step]="5"
          [aria-label]="t('demonstration.labels.brightness')"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel>{{ t('demonstration.labels.brightness') }}</label>
        <div
          ndsSlider
          [value]="[40]"
          [min]="0"
          [max]="1000"
          [step]="1"
          [aria-label]="t('demonstration.labels.brightness')"
        ></div>
      </div>
    </ng-template>

    <ng-template #tplVarSingle>
      <div
        ndsSlider
        class="nds-w-full"
        [value]="[50]"
        [aria-label]="t('demonstration.labels.volume')"
      ></div>
    </ng-template>
    <ng-template #tplVarRange>
      <div
        ndsSlider
        class="nds-w-full"
        [value]="[20, 80]"
        [thumbLabels]="rotulosDaFaixa()"
      ></div>
    </ng-template>
    <ng-template #tplVarVertical>
      <div
        ndsSlider
        orientation="vertical"
        [value]="[60]"
        [aria-label]="t('demonstration.labels.vertical')"
      ></div>
    </ng-template>

    <ng-template #tplCompVolume>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div class="nds-cluster" data-justify="between">
          <label ndsLabel for="comp-vol">{{ t('demonstration.labels.volume') }}</label>
          <span class="nds-text-caption nds-tabular-nums" aria-live="polite">70%</span>
        </div>
        <div
          ndsSlider
          id="comp-vol"
          [value]="[70]"
          [aria-label]="t('demonstration.labels.volume')"
        ></div>
      </div>
    </ng-template>
    <ng-template #tplCompPriceRange>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel>{{ t('demonstration.labels.priceRange') }}</label>
        <div ndsSlider [value]="[20, 80]" [thumbLabels]="rotulosDaFaixa()"></div>
      </div>
    </ng-template>
    <ng-template #tplCompBrightness>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel>{{ t('demonstration.labels.brightness') }}</label>
        <div
          ndsSlider
          [value]="[35]"
          [step]="5"
          [aria-label]="t('demonstration.labels.brightness')"
        ></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="slider"
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
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-single">{{ t('demonstration.labels.single') }}</label>
              <div
                ndsSlider
                id="demo-single"
                [value]="[50]"
                [aria-label]="t('demonstration.labels.volume')"
              ></div>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel>{{ t('demonstration.labels.range') }}</label>
              <div ndsSlider [value]="[20, 80]" [thumbLabels]="rotulosDaFaixa()"></div>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-disabled">{{ t('states.disabled.label') }}</label>
              <div
                ndsSlider
                id="demo-disabled"
                [value]="[45]"
                [disabled]="true"
                [aria-label]="t('demonstration.labels.volume')"
              ></div>
            </div>
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
          [title]="tNav('nav.import')"
          [code]="importCode"
          componentSlug="slider"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="slider"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="slider"
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
          language="html"
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
          componentSlug="slider"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="slider" />

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
export class NdsSliderDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsSlider } from '@/components/ui/slider';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarRange = viewChild.required<TemplateRef<unknown>>('tplVarRange');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplCompVolume = viewChild.required<TemplateRef<unknown>>('tplCompVolume');
  private readonly tplCompPriceRange = viewChild.required<TemplateRef<unknown>>('tplCompPriceRange');
  private readonly tplCompBrightness = viewChild.required<TemplateRef<unknown>>('tplCompBrightness');

  /**
   * Um rótulo por alça. Repetir "Faixa de preço" nas duas não diz qual delas
   * está em foco — quem só ouve precisa da diferença.
   */
  protected readonly rotulosDaFaixa = computed(() => {
    dict();
    const faixa = t('demonstration.labels.priceRange');
    return [`${faixa} — ${tNav('common.min')}`, `${faixa} — ${tNav('common.max')}`];
  });

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: navLabel(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: navLabel(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return Object.keys(d)
      .filter((k) => /^anatomy\.item\d+$/.test(k))
      .sort()
      .map((k) => d[k]);
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: d['usage.guidelines.title'] ?? '',
      items: Object.keys(d).filter((k) => /^usage\.guidelines\.item\d+$/.test(k)).sort().map((k) => d[k]),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: d['usage.scenarios.title'] ?? '',
      cols: {
        scenario: d['usage.scenarios.cols.scenario'] ?? '',
        use: d['usage.scenarios.cols.use'] ?? '',
        alternative: d['usage.scenarios.cols.alternative'] ?? '',
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
      items: ['ariaLabel', 'valueDisplay', 'range'].map((k) => ({
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
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
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
    return [
      { name: t('variants.items.single'),   description: t('variants.styles.single'),   trackId: 'single',   preview: this.tplVarSingle()   },
      { name: t('variants.items.range'),    description: t('variants.styles.range'),    trackId: 'range',    preview: this.tplVarRange()    },
      { name: t('variants.items.vertical'), description: t('variants.styles.vertical'), trackId: 'vertical', preview: this.tplVarVertical() },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    // `brightness` mora sob `variants.items` no conteúdo compartilhado, mas tem
    // a forma de composição (name/description/use) — é aqui que ele pertence.
    const mapa: { base: string; key: string; tpl: TemplateRef<unknown> }[] = [
      { base: 'variants.compositions.volume', key: 'volume',     tpl: this.tplCompVolume()     },
      { base: 'variants.compositions.form',   key: 'form',       tpl: this.tplCompPriceRange() },
      { base: 'variants.items.brightness',    key: 'brightness', tpl: this.tplCompBrightness() },
    ];
    return mapa.map(({ base, key, tpl }) => ({
      name: t(`${base}.name`),
      description: t(`${base}.description`),
      useWhen: t(`${base}.use`),
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
    return ['default', 'hover', 'focus', 'active', 'disabled'].map((k) => ({
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
    const nao = tNav('common.no');
    const linha = (name: string, key: string, tipo: string, padrao: string) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: nao,
      description: toPlainText(t(`props.table.${key}.description`)),
    });
    return [
      {
        title: 'NdsSlider',
        cols,
        items: [
          linha('value', 'value', 'model<number[]>', '[min, max]'),
          linha('valueChange', 'onValueChange', 'output<number[]>', '—'),
          linha('min', 'min', 'number', '0'),
          linha('max', 'max', 'number', '100'),
          linha('step', 'step', 'number', '1'),
          linha('orientation', 'orientation', `'horizontal' | 'vertical'`, `'horizontal'`),
          linha('disabled', 'disabled', 'boolean', 'false'),
          {
            name: 'aria-label',
            type: 'string',
            defaultValue: '—',
            required: nao,
            // Não vem do conteúdo compartilhado: é uma entrada deste stack, e a
            // razão de existir é a seção de acessibilidade acima.
            description: toPlainText(t('accessibility.aria.label')),
          },
          {
            name: 'thumbLabels',
            type: 'string[]',
            defaultValue: '[]',
            required: nao,
            description: toPlainText(t('usage.uxWriting.table.range.format')),
          },
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
    // O token não sai mais do nome da chave: a tabela descreve o que o CSS
    // realmente pinta, e duas linhas usam `--primary` (o trilho, a 20%, e a
    // borda da alça). Derivar o nome da chave voltaria a inventar token.
    return [
      { chave: 'track', token: '--primary / 0.2' },
      { chave: 'range', token: '--primary' },
      { chave: 'thumbBorder', token: '--primary' },
      { chave: 'thumbBackground', token: '--background' },
      { chave: 'focusRing', token: '--ring' },
      { chave: 'radius', token: '--radius-full' },
    ].map(({ chave, token }) => ({
      token,
      value: toPlainText(t(`tokens.table.${chave}.class`)),
      description: toPlainText(t(`tokens.table.${chave}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    // A seção genérica não tem faixa própria para ARIA; as duas listas dizem a
    // mesma coisa em graus diferentes de detalhe, então saem juntas.
    const itens = Object.keys(d).filter((k) => /^accessibility\.items\.item\d+$/.test(k)).sort().map((k) => d[k]);
    const aria = ['role', 'valuenow', 'valuemin', 'valuemax', 'orientation'].map((k) =>
      t(`accessibility.aria.${k}`),
    );
    return [...itens, ...aria];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '→',         description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: '←',         description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: '↑',         description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: '↓',         description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: 'Home',      description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',       description: toPlainText(t('accessibility.keyboard.end')) },
      { key: 'Page Up',   description: toPlainText(t('accessibility.keyboard.pageUp')) },
      { key: 'Page Down', description: toPlainText(t('accessibility.keyboard.pageDown')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['thumb', 'change', 'limits'].map((k) => t(`accessibility.screenReader.${k}`));
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'input',      path: '?path=/docs/ui-input--docs'     },
      { key: 'switch',     path: '?path=/docs/ui-switch--docs'    },
      { key: 'progress',   path: '?path=/docs/ui-progress--docs'  },
      { key: 'radioGroup', path: '?path=/docs/ui-radiogroup--docs' },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
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
        event: 'slider_change',
        trigger: toPlainText(t('analytics.table.slider_change.trigger')),
        payload: toPlainText(t('analytics.table.slider_change.payload')),
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
    // Aqui os itens são string solta, não a trinca criterion/level/how.
    const itens = Object.keys(d)
      .filter((k) => /^testes\.accessibility\.item\d+$/.test(k))
      .sort()
      .map((k) => ({ criterion: toPlainText(d[k]), level: '', how: '' }));
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: itens,
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
        componentSlug: 'slider',
      });
      track('docs_page_view', {
        component_name: 'slider',
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
          component_name: 'slider',
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
