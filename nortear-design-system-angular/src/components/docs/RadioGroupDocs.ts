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
import { NdsRadioGroup, NdsRadioGroupItem } from '@/components/ui/radio-group';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import radioGroupTranslations from '@shared/content/radio-group/translations.json';

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

// Overrides: prop e nota que só existem (ou só não existem) nesta stack.
//
// `orientation` — o composite do Radix NG navega nas quatro setas, então não há
// direção a configurar; a orientação aqui é layout de quem compõe.
// `notes.item1` — o texto compartilhado lista as libs das outras stacks pelo
// nome, e cada docs page é consumida isoladamente.
// `related.items.form.description` — idem, cita a biblioteca de formulário de
// outra stack.
const { t, dict } = useTranslation(radioGroupTranslations as Record<string, unknown>, {
  '*': {
    'props.table.orientation.type': '—',
    'props.table.orientation.default': '—',
  },
  'pt-BR': {
    'props.table.orientation.description':
      'Não existe: as setas navegam nas quatro direções e a direção do layout é de quem compõe — envolva as linhas num container horizontal.',
    'props.table.className.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'props.itemValue.description':
      'Identificador da opção. É ele que o grupo guarda quando esta opção é escolhida.',
    'preview.deliveryHint': 'Frete grátis em 5 dias úteis.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/radio</code> — o grupo entrega roving tabindex, navegação por setas com seleção seguindo o foco e integração com formulário.',
    'related.items.form.description': 'Integração com validação de formulário.',
  },
  en: {
    'props.table.orientation.description':
      'Does not exist: arrow keys navigate in all four directions and layout direction belongs to the composer — wrap the rows in a horizontal container.',
    'props.table.className.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'props.itemValue.description':
      'Option identifier. This is what the group stores when the option is chosen.',
    'preview.deliveryHint': 'Free shipping in 5 business days.',
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/radio</code> — the group provides roving tabindex, arrow navigation with selection following focus, and form integration.',
    'related.items.form.description': 'Form validation integration.',
  },
  es: {
    'props.table.orientation.description':
      'No existe: las flechas navegan en las cuatro direcciones y la dirección del layout es de quien compone — envuelve las filas en un contenedor horizontal.',
    'props.table.className.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'props.itemValue.description':
      'Identificador de la opción. Es lo que el grupo guarda cuando se elige esta opción.',
    'preview.deliveryHint': 'Envío gratuito en 5 días hábiles.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/radio</code> — el grupo aporta roving tabindex, navegación por flechas con selección siguiendo el foco e integración con formulario.',
    'related.items.form.description': 'Integración con validación de formulario.',
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

// Hardcoded, e não `t('anatomy.structureCode')`: a variante `angular` do
// conteúdo compartilhado descreve seletores de ELEMENTO
// (`<nds-radio-group>` / `<nds-radio-group-item>`) que este stack não usa —
// aqui o seletor é de atributo, sobre `<fieldset>` e `<button>` nativos, para o
// markup e o CSS `.nds-*` baterem com o das outras stacks. Mesmo caminho do
// CheckboxDocs. A correção do conteúdo compartilhado está reportada.
const ANATOMY_CODE = `<p id="pagamento-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
<fieldset ndsRadioGroup aria-labelledby="pagamento-titulo" name="payment">
  <div class="nds-radio-row">
    <button ndsRadioGroupItem value="cartao" id="cartao"></button>
    <label ndsLabel class="nds-radio-label" for="cartao">Cartão de crédito</label>
  </div>
  <div class="nds-radio-row">
    <button ndsRadioGroupItem value="pix" id="pix"></button>
    <label ndsLabel class="nds-radio-label" for="pix">Pix</label>
  </div>
</fieldset>`;

const INTERFACE_CODE = `// <fieldset ndsRadioGroup> + <button ndsRadioGroupItem>
@Directive({
  selector: 'fieldset[ndsRadioGroup], div[ndsRadioGroup]',
  hostDirectives: [
    { directive: RdxRadioGroupDirective,
      inputs: ['value', 'defaultValue', 'name', 'form',
               'disabled', 'readOnly', 'required', 'invalid'],
      outputs: ['valueChange', 'onValueChange'] },
  ],
})
export class NdsRadioGroup {}

@Component({
  selector: 'button[ndsRadioGroupItem]',
  hostDirectives: [
    { directive: RdxRadioItemDirective,
      inputs: ['value', 'required', 'disabled', 'readOnly'] },
  ],
})
export class NdsRadioGroupItem {}`;

const EXTENSIBILITY_CODE = `<!-- Reactive Forms: o grupo é um ControlValueAccessor -->
<form [formGroup]="form">
  <p id="pagamento-titulo" class="nds-text-body nds-font-semibold">Forma de pagamento</p>
  <fieldset ndsRadioGroup formControlName="payment" aria-labelledby="pagamento-titulo">
    @for (opt of options; track opt.value) {
      <div class="nds-radio-row">
        <button ndsRadioGroupItem [value]="opt.value" [id]="opt.value"></button>
        <label ndsLabel class="nds-radio-label" [for]="opt.value">{{ opt.label }}</label>
      </div>
    }
  </fieldset>
</form>`;

@Component({
  selector: 'nds-radio-group-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsRadioGroup, NdsRadioGroupItem, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p id="dd1-do-titulo" class="nds-text-body nds-font-semibold">
          {{ t('demonstration.labels.groupLabel') }}
        </p>
        <fieldset ndsRadioGroup aria-labelledby="dd1-do-titulo">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="dd1-do-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="dd1-do-cartao">
              {{ t('demonstration.labels.card') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="dd1-do-pix"></button>
            <label ndsLabel class="nds-radio-label" for="dd1-do-pix">
              {{ t('demonstration.labels.pix') }}
            </label>
          </div>
        </fieldset>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p id="dd1-dont-titulo" class="nds-text-body nds-font-semibold">
          {{ t('demonstration.labels.groupLabel') }}
        </p>
        <fieldset ndsRadioGroup aria-labelledby="dd1-dont-titulo">
          <div class="nds-radio-row">
            <button
              ndsRadioGroupItem
              value="cartao"
              [attr.aria-label]="t('demonstration.labels.card')"
            ></button>
            <span class="nds-text-body">{{ t('demonstration.labels.card') }}</span>
          </div>
          <div class="nds-radio-row">
            <button
              ndsRadioGroupItem
              value="pix"
              [attr.aria-label]="t('demonstration.labels.pix')"
            ></button>
            <span class="nds-text-body">{{ t('demonstration.labels.pix') }}</span>
          </div>
        </fieldset>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p id="dd2-do-titulo" class="nds-text-body nds-font-semibold">
          {{ t('demonstration.labels.deliveryLabel') }}
        </p>
        <fieldset ndsRadioGroup aria-labelledby="dd2-do-titulo">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="standard" id="dd2-do-standard"></button>
            <label ndsLabel class="nds-radio-label" for="dd2-do-standard">
              {{ t('demonstration.labels.standard') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="express" id="dd2-do-express"></button>
            <label ndsLabel class="nds-radio-label" for="dd2-do-express">
              {{ t('demonstration.labels.express') }}
            </label>
          </div>
        </fieldset>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="xs">
        <p id="dd2-dont-titulo" class="nds-text-body nds-font-semibold">
          {{ t('demonstration.labels.deliveryLabel') }}
        </p>
        <fieldset ndsRadioGroup aria-labelledby="dd2-dont-titulo" defaultValue="express">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="express" id="dd2-dont-express"></button>
            <label ndsLabel class="nds-radio-label" for="dd2-dont-express">
              {{ t('demonstration.labels.express') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="standard" id="dd2-dont-standard"></button>
            <label ndsLabel class="nds-radio-label" for="dd2-dont-standard">
              {{ t('demonstration.labels.standard') }}
            </label>
          </div>
        </fieldset>
      </div>
    </ng-template>

    <ng-template #tplVarVertical>
      <fieldset ndsRadioGroup [attr.aria-label]="t('demonstration.labels.groupLabel')">
        <div class="nds-radio-row">
          <button ndsRadioGroupItem value="cartao" id="var-v-cartao"></button>
          <label ndsLabel class="nds-radio-label" for="var-v-cartao">
            {{ t('demonstration.labels.card') }}
          </label>
        </div>
        <div class="nds-radio-row">
          <button ndsRadioGroupItem value="pix" id="var-v-pix"></button>
          <label ndsLabel class="nds-radio-label" for="var-v-pix">
            {{ t('demonstration.labels.pix') }}
          </label>
        </div>
        <div class="nds-radio-row">
          <button ndsRadioGroupItem value="boleto" id="var-v-boleto"></button>
          <label ndsLabel class="nds-radio-label" for="var-v-boleto">
            {{ t('demonstration.labels.boleto') }}
          </label>
        </div>
      </fieldset>
    </ng-template>
    <ng-template #tplVarHorizontal>
      <fieldset ndsRadioGroup [attr.aria-label]="t('demonstration.labels.deliveryLabel')">
        <div class="nds-cluster" data-spacing="lg">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="standard" id="var-h-standard"></button>
            <label ndsLabel class="nds-radio-label" for="var-h-standard">
              {{ t('demonstration.labels.standard') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="express" id="var-h-express"></button>
            <label ndsLabel class="nds-radio-label" for="var-h-express">
              {{ t('demonstration.labels.express') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pickup" id="var-h-pickup"></button>
            <label ndsLabel class="nds-radio-label" for="var-h-pickup">
              {{ t('demonstration.labels.pickup') }}
            </label>
          </div>
        </div>
      </fieldset>
    </ng-template>
    <ng-template #tplVarWithDescription>
      <fieldset ndsRadioGroup [attr.aria-label]="t('demonstration.labels.deliveryLabel')">
        <div class="nds-cluster" data-align="start" data-spacing="sm">
          <button
            ndsRadioGroupItem
            class="nds-mt-0-5"
            value="standard"
            id="var-d-standard"
            aria-describedby="var-d-standard-texto"
          ></button>
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel class="nds-radio-label" for="var-d-standard">
              {{ t('demonstration.labels.standard') }}
            </label>
            <p id="var-d-standard-texto" class="nds-text-caption nds-text-muted-foreground">
              {{ t('preview.deliveryHint') }}
            </p>
          </div>
        </div>
        <div class="nds-cluster" data-align="start" data-spacing="sm">
          <button
            ndsRadioGroupItem
            class="nds-mt-0-5"
            value="express"
            id="var-d-express"
            aria-describedby="var-d-express-texto"
          ></button>
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel class="nds-radio-label" for="var-d-express">
              {{ t('demonstration.labels.express') }}
            </label>
            <p id="var-d-express-texto" class="nds-text-caption nds-text-muted-foreground">
              {{ t('preview.deliveryHint') }}
            </p>
          </div>
        </div>
      </fieldset>
    </ng-template>

    <ng-template #tplCompInForm>
      <form class="nds-stack nds-w-full" data-spacing="md">
        <p id="comp-form-titulo" class="nds-text-body nds-font-semibold">
          {{ t('demonstration.labels.groupLabel') }}
        </p>
        <fieldset ndsRadioGroup aria-labelledby="comp-form-titulo" name="payment">
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="cartao" id="docs-form-cartao"></button>
            <label ndsLabel class="nds-radio-label" for="docs-form-cartao">
              {{ t('demonstration.labels.card') }}
            </label>
          </div>
          <div class="nds-radio-row">
            <button ndsRadioGroupItem value="pix" id="docs-form-pix"></button>
            <label ndsLabel class="nds-radio-label" for="docs-form-pix">
              {{ t('demonstration.labels.pix') }}
            </label>
          </div>
        </fieldset>
      </form>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="radio-group"
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
            <div class="nds-stack" data-spacing="xs">
              <p id="demo-pag-titulo" class="nds-text-body nds-font-semibold">
                {{ t('demonstration.labels.groupLabel') }}
              </p>
              <fieldset ndsRadioGroup aria-labelledby="demo-pag-titulo" defaultValue="pix">
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="cartao" id="demo-cartao"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-cartao">
                    {{ t('demonstration.labels.card') }}
                  </label>
                </div>
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="pix" id="demo-pix"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-pix">
                    {{ t('demonstration.labels.pix') }}
                  </label>
                </div>
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="boleto" id="demo-boleto"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-boleto">
                    {{ t('demonstration.labels.boleto') }}
                  </label>
                </div>
              </fieldset>
            </div>

            <div class="nds-stack" data-spacing="xs">
              <p id="demo-ent-titulo" class="nds-text-body nds-font-semibold">
                {{ t('demonstration.labels.deliveryLabel') }}
              </p>
              <fieldset ndsRadioGroup aria-labelledby="demo-ent-titulo">
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="standard" id="demo-standard"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-standard">
                    {{ t('demonstration.labels.standard') }}
                  </label>
                </div>
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="express" id="demo-express"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-express">
                    {{ t('demonstration.labels.express') }}
                  </label>
                </div>
                <div class="nds-radio-row">
                  <button ndsRadioGroupItem value="pickup" id="demo-pickup" [disabled]="true"></button>
                  <label ndsLabel class="nds-radio-label" for="demo-pickup">
                    {{ t('demonstration.labels.pickup') }}
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
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
          componentSlug="radio-group"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="radio-group"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="radio-group"
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
          [extensibilityCode]="extensibilityCode"
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
          componentSlug="radio-group"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="radio-group" />

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
export class NdsRadioGroupDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode =
    `import { NdsRadioGroup, NdsRadioGroupItem } from '@/components/ui/radio-group';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarWithDescription =
    viewChild.required<TemplateRef<unknown>>('tplVarWithDescription');
  private readonly tplCompInForm = viewChild.required<TemplateRef<unknown>>('tplCompInForm');

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
      items: ['groupLabel', 'itemLabel', 'order'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
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
      { key: 'vertical',        tpl: this.tplVarVertical()        },
      { key: 'horizontal',      tpl: this.tplVarHorizontal()      },
      { key: 'withDescription', tpl: this.tplVarWithDescription() },
    ].map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: t(`variants.styles.${key}`),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.compositions.inForm.name'),
        description: t('variants.compositions.inForm.description'),
        useWhen: t('variants.compositions.inForm.use'),
        trackId: 'inForm',
        preview: this.tplCompInForm(),
      },
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
    return ['default', 'checked', 'hover', 'focus', 'disabled', 'invalid'].map((k) => ({
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
    const not = tNav('common.no');
    const line = (name: string, key: string, type?: string, padrao?: string) => ({
      name: name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: padrao ?? toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });
    return [
      {
        title: 'NdsRadioGroup',
        cols,
        items: [
          line('value', 'value', 'model<string | null>'),
          line('defaultValue', 'defaultValue'),
          line('valueChange', 'onValueChange', 'output<string | null>'),
          line('disabled', 'disabled'),
          line('name', 'name'),
          // Sem prop de orientação nesta stack — a descrição vem do override.
          line('orientation', 'orientation'),
          line('class', 'className'),
        ],
      },
      {
        title: 'NdsRadioGroupItem',
        cols,
        items: [
          {
            name: 'value',
            type: 'string',
            defaultValue: '—',
            required: tNav('common.yes'),
            description: toPlainText(t('props.itemValue.description')),
          },
          line('disabled', 'disabled'),
          line('class', 'className'),
        ],
      },
    ].map((table) => ({
      ...table,
      items: table.items.map((item) => ({ ...item, required: item.required || not })),
    }));
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
      { token: '--background',  k: 'background'  },
      { token: '--primary',     k: 'primary'     },
      { token: '--ring',        k: 'ring'        },
      { token: '--destructive', k: 'destructive' },
      { token: '--foreground',  k: 'foreground'  },
    ].map(({ token, k }) => ({
      token,
      value: toPlainText(t(`tokens.table.${k}.class`)),
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
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'ArrowDown',  description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: 'ArrowUp',    description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'ArrowRight', description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: 'ArrowLeft',  description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: 'Space',      description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = radioGroupTranslations as unknown as Record<
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
      { key: 'checkbox', path: '?path=/docs/primitives-form-checkbox--docs' },
      { key: 'switch',   path: '?path=/docs/primitives-form-switch--docs'   },
      { key: 'select',   path: '?path=/docs/primitives-form-select--docs'   },
      { key: 'form',     path: '?path=/docs/primitives-form-form--docs'     },
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
        event: 'radio_change',
        trigger: toPlainText(t('analytics.table.radio_change.trigger')),
        payload: toPlainText(t('analytics.table.radio_change.payload')),
      },
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
    // skeleton e do separator.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
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
        componentSlug: 'radio-group',
      });
      track('docs_page_view', {
        component_name: 'radio-group',
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
          component_name: 'radio-group',
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
