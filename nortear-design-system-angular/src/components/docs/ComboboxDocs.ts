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
  type WritableSignal,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_COMBOBOX } from '@/components/ui/combobox';
import uiTranslations from '@/i18n/ui.json';
import comboboxTranslations from '@shared/content/combobox/translations.json';

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
const { t, dict } = useTranslation(comboboxTranslations as Record<string, unknown>);

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

const IMPORT_CODE = `import { NDS_COMBOBOX } from '@/components/ui/combobox';`;

// A raiz compõe `RdxComboboxRoot` por host directive, e cada peça compõe a sua.
// `invalid` NÃO aparece na lista de inputs do `ɵdir` do primitivo: ele vem de
// `RdxFormUiControlBase` e chega por `usesInheritance: true`.
const INTERFACE_CODE = `// <nds-combobox> — compõe os primitivos do Radix NG
@Component({
  selector: 'nds-combobox',
  hostDirectives: [
    { directive: RdxComboboxRoot,
      inputs: ['value', 'defaultValue', 'inputValue', 'open', 'multiple',
               'disabled', 'readOnly', 'required', 'invalid', 'name',
               'filter', 'limit', 'itemToStringLabel'],
      outputs: ['valueChange', 'inputValueChange', 'openChange'] },
  ],
})
export class NdsCombobox {
  // Forma dos chips no campo. Sai como \`data-chips\` no wrapper, e é a folha
  // que decide entre acumular linhas e rolar na horizontal.
  readonly chipsLayout = input<'wrap' | 'single-line'>('wrap');
}

// Uso com Reactive Forms:
// <nds-combobox formControlName="pais"> … </nds-combobox>`;

@Component({
  selector: 'nds-combobox-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_COMBOBOX,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!--
      Um molde por preview. Todos repetem a mesma composição — rótulo, caixa,
      lista — porque é ela que a página está documentando: reduzir os exemplos a
      um invólucro esconderia justamente o que o leitor precisa copiar.
    -->

    <ng-template #tplDoDont1Do>
      <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="doDont1DoValue()" (valueChange)="setMultiple(doDont1DoValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of doDont1DoValue(); track chosen) {
              <span ndsComboboxChip [value]="chosen">
                {{ countryLabel(chosen) }}
                <button
                  ndsComboboxChipRemove
                  [attr.aria-label]="removeLabel(countryLabel(chosen))"
                ></button>
              </span>
            }
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
          </div>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="doDont1DontValue()" (valueChange)="setMultiple(doDont1DontValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of doDont1DontValue(); track chosen) {
              <span ndsComboboxChip [value]="chosen">
                {{ countryLabel(chosen) }}
                <!-- Todos com o mesmo nome: é o defeito que o par ilustra. -->
                <button
                  ndsComboboxChipRemove
                  [attr.aria-label]="t('demonstration.labels.remove')"
                ></button>
              </span>
            }
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
          </div>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="doDont2DoValue()" (valueChange)="setMultiple(doDont2DoValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of doDont2DoValue(); track chosen) {
              <span ndsComboboxChip [value]="chosen">
                {{ countryLabel(chosen) }}
                <button
                  ndsComboboxChipRemove
                  [attr.aria-label]="removeLabel(countryLabel(chosen))"
                ></button>
              </span>
            }
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
          </div>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="doDont2DontValue()" (valueChange)="setMultiple(doDont2DontValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of doDont2DontValue(); track chosen) {
              <!-- Sem botão de remover: só o ponteiro desfaz, na lista. -->
              <span ndsComboboxChip [value]="chosen">{{ countryLabel(chosen) }}</span>
            }
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
          </div>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplVarSingle>
      <nds-combobox [value]="varSingleValue()" (valueChange)="setSingle(varSingleValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countryLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput [placeholder]="t('demonstration.labels.countryPlaceholder')" />
          <button ndsComboboxClear [attr.aria-label]="t('demonstration.labels.clear')"></button>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplVarMultiple>
      <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="varMultipleValue()" (valueChange)="setMultiple(varMultipleValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <div ndsComboboxChips>
            @for (chosen of varMultipleValue(); track chosen) {
              <span ndsComboboxChip [value]="chosen">
                {{ countryLabel(chosen) }}
                <button
                  ndsComboboxChipRemove
                  [attr.aria-label]="removeLabel(countryLabel(chosen))"
                ></button>
              </span>
            }
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
          </div>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (item of countries(); track item.value) {
              <div ndsComboboxItem [value]="item.value">
                {{ item.label }}
                <span ndsComboboxItemIndicator></span>
              </div>
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplVarGrouped>
      <nds-combobox [value]="varGroupedValue()" (valueChange)="setSingle(varGroupedValue, $event)" class="nds-w-full">
        <label ndsComboboxLabel>{{ t('demonstration.labels.groupedLabel') }}</label>
        <div ndsComboboxInputWrapper>
          <input ndsComboboxInput [placeholder]="t('demonstration.labels.groupedPlaceholder')" />
          <button ndsComboboxClear [attr.aria-label]="t('demonstration.labels.clear')"></button>
          <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
            <svg ndsComboboxIcon></svg>
          </button>
        </div>
        <ng-template ndsComboboxPopup>
          <div ndsComboboxList>
            @for (group of groceries(); track group.name; let last = $last) {
              <div ndsComboboxGroup>
                <div ndsComboboxGroupLabel>{{ group.name }}</div>
                @for (item of group.items; track item.value) {
                  <div ndsComboboxItem [value]="item.value">
                    {{ item.label }}
                    <span ndsComboboxItemIndicator></span>
                  </div>
                }
              </div>
              @if (!last) {
                <div ndsComboboxSeparator></div>
              }
            }
          </div>
          <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
        </ng-template>
      </nds-combobox>
    </ng-template>

    <ng-template #tplCompInForm>
      <form class="nds-stack nds-w-full" data-spacing="md" (submit)="$event.preventDefault()">
        <nds-combobox name="pais" [value]="compFormValue()" (valueChange)="setSingle(compFormValue, $event)" class="nds-w-full">
          <label ndsComboboxLabel>{{ t('demonstration.labels.countryLabel') }}</label>
          <div ndsComboboxInputWrapper>
            <input ndsComboboxInput [placeholder]="t('demonstration.labels.countryPlaceholder')" />
            <button ndsComboboxClear [attr.aria-label]="t('demonstration.labels.clear')"></button>
            <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
              <svg ndsComboboxIcon></svg>
            </button>
          </div>
          <ng-template ndsComboboxPopup>
            <div ndsComboboxList>
              @for (item of countries(); track item.value) {
                <div ndsComboboxItem [value]="item.value">
                  {{ item.label }}
                  <span ndsComboboxItemIndicator></span>
                </div>
              }
            </div>
            <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
          </ng-template>
        </nds-combobox>
      </form>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="combobox"
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
          <div class="nds-stack nds-w-full" data-spacing="xl">
            <nds-combobox [value]="demoSingleValue()" (valueChange)="setSingle(demoSingleValue, $event)" class="nds-w-full">
              <label ndsComboboxLabel>{{ t('demonstration.labels.countryLabel') }}</label>
              <div ndsComboboxInputWrapper>
                <input
                  ndsComboboxInput
                  [placeholder]="t('demonstration.labels.countryPlaceholder')"
                />
                <button ndsComboboxClear [attr.aria-label]="t('demonstration.labels.clear')"></button>
                <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
                  <svg ndsComboboxIcon></svg>
                </button>
              </div>
              <ng-template ndsComboboxPopup>
                <div ndsComboboxList>
                  @for (item of countries(); track item.value) {
                    <div ndsComboboxItem [value]="item.value">
                      {{ item.label }}
                      <span ndsComboboxItemIndicator></span>
                    </div>
                  }
                </div>
                <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
              </ng-template>
            </nds-combobox>

            <nds-combobox multiple [removedLabel]="t('demonstration.labels.removed')" [value]="demoMultipleValue()" (valueChange)="setMultiple(demoMultipleValue, $event)" class="nds-w-full">
              <label ndsComboboxLabel>{{ t('demonstration.labels.countriesLabel') }}</label>
              <div ndsComboboxInputWrapper>
                <div ndsComboboxChips>
                  @for (chosen of demoMultipleValue(); track chosen) {
                    <span ndsComboboxChip [value]="chosen">
                      {{ countryLabel(chosen) }}
                      <button
                        ndsComboboxChipRemove
                        [attr.aria-label]="removeLabel(countryLabel(chosen))"
                      ></button>
                    </span>
                  }
                  <input ndsComboboxInput [placeholder]="t('demonstration.labels.countriesPlaceholder')" />
                </div>
                <button ndsComboboxTrigger [attr.aria-label]="t('demonstration.labels.openList')">
                  <svg ndsComboboxIcon></svg>
                </button>
              </div>
              <ng-template ndsComboboxPopup>
                <div ndsComboboxList>
                  @for (item of countries(); track item.value) {
                    <div ndsComboboxItem [value]="item.value">
                      {{ item.label }}
                      <span ndsComboboxItemIndicator></span>
                    </div>
                  }
                </div>
                <div ndsComboboxEmpty>{{ t('demonstration.labels.empty') }}</div>
              </ng-template>
            </nds-combobox>
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
          componentSlug="combobox"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="combobox"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="combobox"
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
          componentSlug="combobox"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="combobox" />

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
export class NdsComboboxDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // ── Estado dos exemplos vivos ──────────────────────────────────────────────

  protected readonly demoSingleValue = signal<string | null>(null);
  protected readonly demoMultipleValue = signal<string[]>(['brasil', 'argentina']);
  protected readonly doDont1DoValue = signal<string[]>(['brasil']);
  protected readonly doDont1DontValue = signal<string[]>(['brasil']);
  protected readonly doDont2DoValue = signal<string[]>(['brasil', 'argentina']);
  protected readonly doDont2DontValue = signal<string[]>(['brasil', 'argentina']);
  protected readonly varSingleValue = signal<string | null>(null);
  protected readonly varMultipleValue = signal<string[]>(['brasil', 'argentina']);
  protected readonly varGroupedValue = signal<string | null>(null);
  protected readonly compFormValue = signal<string | null>(null);

  // ── Listas dos exemplos ────────────────────────────────────────────────────
  //
  // `computed` sobre `dict()` porque os rótulos são traduzidos: um array
  // constante congelaria a lista no idioma da primeira montagem.

  protected readonly countries = computed(() => {
    dict();
    return [
      { value: 'brasil',    label: t('demonstration.labels.brazil')    },
      { value: 'argentina', label: t('demonstration.labels.argentina') },
      { value: 'chile',     label: t('demonstration.labels.chile')     },
      { value: 'colombia',  label: t('demonstration.labels.colombia')  },
      { value: 'mexico',    label: t('demonstration.labels.mexico')    },
      { value: 'peru',      label: t('demonstration.labels.peru')      },
      { value: 'portugal',  label: t('demonstration.labels.portugal')  },
      { value: 'espanha',   label: t('demonstration.labels.spain')     },
      { value: 'uruguai',   label: t('demonstration.labels.uruguay')   },
    ];
  });

  protected readonly groceries = computed(() => {
    dict();
    return [
      {
        name: t('demonstration.labels.groupFruits'),
        items: [
          { value: 'maca',    label: t('demonstration.labels.apple')  },
          { value: 'banana',  label: t('demonstration.labels.banana') },
          { value: 'laranja', label: t('demonstration.labels.orange') },
        ],
      },
      {
        name: t('demonstration.labels.groupVegetables'),
        items: [
          { value: 'cenoura',   label: t('demonstration.labels.carrot')   },
          { value: 'batata',    label: t('demonstration.labels.potato')   },
          { value: 'abobrinha', label: t('demonstration.labels.zucchini') },
        ],
      },
    ];
  });

  /**
   * Escrita do valor escolhido — em uma via, e não com `[(value)]`.
   *
   * A forma de duas vias exige que o signal tenha EXATAMENTE o tipo do model do
   * primitivo (`string | number | bigint | Record | null`, ou lista disso),
   * porque escrita e leitura tornam o tipo invariante. Um signal de `string[]`
   * reprovaria no verificador de templates, e alargar o tipo aqui obrigaria um
   * `Array.isArray` em cada `@for` da página. A via única mantém os exemplos
   * tipados como o leitor os escreveria.
   */
  protected setSingle(target: WritableSignal<string | null>, value: unknown): void {
    target.set(typeof value === 'string' ? value : null);
  }

  protected setMultiple(target: WritableSignal<string[]>, value: unknown): void {
    target.set(Array.isArray(value) ? value.map((entry) => String(entry)) : []);
  }

  protected countryLabel(value: string): string {
    return this.countries().find((item) => item.value === value)?.label ?? value;
  }

  /** "Remover <rótulo>" — o nome PRÓPRIO que cada botão de chip precisa ter. */
  protected removeLabel(label: string): string {
    return `${t('demonstration.labels.remove')} ${label}`;
  }

  // ── Moldes ─────────────────────────────────────────────────────────────────

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarMultiple = viewChild.required<TemplateRef<unknown>>('tplVarMultiple');
  private readonly tplVarGrouped = viewChild.required<TemplateRef<unknown>>('tplVarGrouped');
  private readonly tplCompInForm = viewChild.required<TemplateRef<unknown>>('tplCompInForm');

  // ── Seções ─────────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((group) => ({
      label: t(group.labelKey),
      sections: group.sections.map((section) => ({ id: section.id, label: t(section.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return numberedItems(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: d['usage.guidelines.title'] ?? '',
      items: numberedItems(d, 'usage.guidelines'),
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
      items: ['placeholder', 'itemLabel', 'chipRemove', 'emptyMessage'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: numberedItems(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: numberedItems(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], index) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${index + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${index + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'single',   tpl: this.tplVarSingle()   },
      { key: 'multiple', tpl: this.tplVarMultiple() },
      { key: 'grouped',  tpl: this.tplVarGrouped()  },
    ].map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: toPlainText(t(`variants.styles.${key}`)),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [{ key: 'inForm', tpl: this.tplCompInForm() }].map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: toPlainText(t(`variants.compositions.${key}.description`)),
      useWhen: toPlainText(t(`variants.compositions.${key}.use`)),
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
    return ['default', 'open', 'filtering', 'selected', 'focus', 'empty', 'disabled', 'invalid'].map(
      (key) => ({
        label: t(`states.${key}.label`),
        trigger: toPlainText(t(`states.${key}.trigger`)),
        behavior: toPlainText(t(`states.${key}.behavior`)),
      }),
    );
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
    const no = tNav('common.no');

    // Os nomes e tipos são os DESTA stack — `value` e `inputValue` são models do
    // primitivo, então `[(value)]` funciona, e a mudança sai por `output`, não
    // por callback. As descrições vêm do conteúdo compartilhado, que é
    // API-neutro de propósito.
    //
    // `items` não tem linha: aqui as opções são escritas no template, uma
    // `<div ndsComboboxItem>` por opção, e o motor de filtragem as registra ao
    // montarem. Uma linha prometendo um array seria superfície que não existe.
    return [
      {
        title: 'NdsCombobox',
        cols,
        items: [
          { name: 'value',            type: 'model<string | string[]>',                  defaultValue: '—',     required: no, description: toPlainText(t('props.table.value.description')) },
          { name: 'defaultValue',     type: 'string | string[]',                         defaultValue: '—',     required: no, description: toPlainText(t('props.table.defaultValue.description')) },
          { name: 'valueChange',      type: 'output<string | string[]>',                 defaultValue: '—',     required: no, description: toPlainText(t('props.table.onValueChange.description')) },
          { name: 'inputValue',       type: 'model<string>',                             defaultValue: "''",    required: no, description: toPlainText(t('props.table.inputValue.description')) },
          { name: 'inputValueChange', type: 'output<string>',                            defaultValue: '—',     required: no, description: toPlainText(t('props.table.onInputValueChange.description')) },
          { name: 'multiple',         type: 'boolean',                                   defaultValue: 'false', required: no, description: toPlainText(t('props.table.multiple.description')) },
          { name: 'chipsLayout',      type: "'wrap' | 'single-line'",                    defaultValue: "'wrap'", required: no, description: toPlainText(t('props.table.chipsLayout.description')) },
          { name: 'filter',           type: '(value, query, itemToString) => boolean',   defaultValue: '—',     required: no, description: toPlainText(t('props.table.filter.description')) },
          { name: 'disabled',         type: 'boolean',                                   defaultValue: 'false', required: no, description: toPlainText(t('props.table.disabled.description')) },
          { name: 'invalid',          type: 'boolean',                                   defaultValue: 'false', required: no, description: toPlainText(t('states.invalid.trigger')) },
          { name: 'name',             type: 'string',                                    defaultValue: '—',     required: no, description: toPlainText(t('props.table.name.description')) },
        ],
      },
      {
        title: 'ndsComboboxInput',
        cols,
        items: [
          { name: 'placeholder', type: 'string', defaultValue: '—', required: no, description: toPlainText(t('props.table.placeholder.description')) },
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
    // Token e seletor real, lidos de docs/shared/styles/nds/combobox.css.
    return [
      { token: '--input',                key: 'input'               },
      { token: '--input-background',     key: 'inputBackground'     },
      { token: '--foreground',           key: 'foreground'          },
      { token: '--muted-foreground',     key: 'mutedForeground'     },
      { token: '--muted',                key: 'muted'               },
      { token: '--secondary',            key: 'secondary'           },
      { token: '--secondary-foreground', key: 'secondaryForeground' },
      { token: '--popover',              key: 'popover'             },
      { token: '--popover-foreground',   key: 'popoverForeground'   },
      { token: '--accent',               key: 'accent'              },
      { token: '--accent-foreground',    key: 'accentForeground'    },
      { token: '--primary',              key: 'primary'             },
      { token: '--border',               key: 'border'              },
      { token: '--ring',                 key: 'ring'                },
      { token: '--destructive',          key: 'destructive'         },
      { token: '--radius',               key: 'radius'              },
      { token: '--radius-full',          key: 'radiusFull'          },
    ].map(({ token, key }) => ({
      token,
      value: t(`tokens.table.${key}.class`),
      description: toPlainText(t(`tokens.table.${key}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return numberedItems(d, 'accessibility.items');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'A–Z',       description: toPlainText(t('accessibility.keyboard.typing')) },
      { key: '↓',         description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',         description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Backspace', description: toPlainText(t('accessibility.keyboard.backspace')) },
      { key: 'Home',      description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',       description: toPlainText(t('accessibility.keyboard.end')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    // Chaves explícitas: `Object.values` levaria junto o `title` do bloco, que é
    // cabeçalho de seção e não item de lista.
    return ['field', 'navigation', 'selection', 'chip'].map((key) =>
      toPlainText(t(`accessibility.screenReader.${key}`)),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'select',  path: '?path=/docs/ui-select--docs'  },
      { key: 'command', path: '?path=/docs/ui-command--docs' },
      { key: 'input',   path: '?path=/docs/ui-input--docs'   },
      { key: 'form',    path: '?path=/docs/ui-form--docs'    },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    return numberedItems(d, 'notes').map((content) => ({ title: '', content }));
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
    // O nome do evento é o próprio identificador do GA4 — valor estável, nunca
    // texto traduzido, que dividiria um evento em três no relatório.
    return ['option_select', 'field_change'].map((event) => ({
      event,
      trigger: toPlainText(t(`analytics.table.${event}.trigger`)),
      payload: toPlainText(t(`analytics.table.${event}.payload`)),
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
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((row) => ({
        action: toPlainText(row.action),
        result: stripHtml(toPlainText(row.result)),
        priority: priorityLabel(row.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // Aqui os itens são string solta, não a trinca criterion/level/how.
      items: numberedItems(d, 'testes.accessibility').map((text) => ({
        criterion: toPlainText(text),
        level: '',
        how: '',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((row) => ({
        story: toPlainText(row.story),
        priority: priorityLabel(row.priority),
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
        componentSlug: 'combobox',
      });
      track('docs_page_view', {
        component_name: 'combobox',
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
          component_name: 'combobox',
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

/** `base.item1`, `base.item2`, … na ordem — para até onde a numeração for. */
function numberedItems(d: Record<string, string>, base: string): string[] {
  const rows: string[] = [];
  for (let i = 1; ; i++) {
    const value = d[`${base}.item${i}`];
    if (value === undefined) break;
    rows.push(value);
  }
  return rows;
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
    for (const field of fields) row[field] = d[`${base}.item${i}.${field}`] ?? '';
    rows.push(row);
  }
  return rows;
}
