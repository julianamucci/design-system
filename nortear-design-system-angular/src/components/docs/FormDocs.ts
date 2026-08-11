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
import { NDS_FORM } from '@/components/ui/form';
import { NdsInput } from '@/components/ui/input';
import { NdsTextarea } from '@/components/ui/textarea';
import uiTranslations from '@/i18n/ui.json';
import formTranslations from '@shared/content/form/translations.json';

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

// O conteúdo compartilhado descreve o Form como um par de FACTORIES com opções
// (`label`, `input`, `description`, `error`). Nesta stack não há opção nenhuma:
// cada peça é uma diretiva sobre o elemento nativo e o conteúdo é projetado —
// e o estado que as outras stacks pedem a uma lib de formulário aqui é dos
// Reactive Forms. Os overrides abaixo trocam nome de peça e descrição de
// superfície; a explicação de POR QUE mora em `form.ts`.
//
// `props.table.invalid` e `props.table.form` não existem no conteúdo
// compartilhado: são as duas superfícies que só esta stack tem. Chave declarada
// em override resolve em runtime e é reconhecida pelo auditor.
const { t, dict } = useTranslation(formTranslations as Record<string, unknown>, {
  '*': {
    'props.fieldTitle': 'ndsFormField',
    'props.fieldsetTitle': 'ndsFieldset',
  },
  'pt-BR': {
    'props.table.form':
      'Diretiva do elemento de formulário. Dá o ritmo vertical entre os campos; o modelo reativo continua sendo escrito no mesmo elemento.',
    'props.table.invalid':
      'Força o estado inválido. Ausente, o estado vem do controle de formulário projetado dentro do campo.',
    'props.table.label':
      'Rótulo projetado dentro do campo. O campo preenche a associação com o controle quando ela não foi escrita à mão.',
    'props.table.input':
      'O controle projetado dentro do campo — campo de texto, área de texto, seleção ou marcação. O campo o encontra e gera o identificador que falta.',
    'props.table.description_prop':
      'Parágrafo de apoio projetado abaixo do controle. Entra na descrição acessível do controle.',
    'props.table.error':
      'Parágrafo de erro projetado abaixo do controle. Nasce anunciado e também entra na descrição acessível.',
    'props.table.className':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.legend':
      'Rótulo do agrupamento, projetado como primeiro filho do agrupamento.',
    'props.table.children':
      'Os campos projetados dentro do agrupamento, espaçados em 16px.',
    'props.extensibility':
      'O campo aceita qualquer controle projetado — campo de texto, área de texto, seleção, marcação e composições. Classes extras vão no atributo class do próprio elemento.',
    'states.withError.trigger':
      'Mensagem de erro projetada, ou estado inválido vindo do controle de formulário',
    'states.withError.behavior':
      'Mensagem anunciada abaixo do controle, controle marcado como inválido e rótulo em cor de erro — tudo aplicado pelo campo',
    'accessibility.item3':
      'Estado inválido automático — o campo marca o controle como inválido a partir do estado do controle de formulário, sem atributo escrito à mão.',
    'notes.tip2':
      'O campo já marca o controle como inválido e pinta o rótulo quando há erro. Só use a entrada de sobrescrita para validação vinda do servidor.',
    'notes.tip5':
      'Descrição com formatação rica é conteúdo dinâmico: sanitize com DOMPurify.sanitize() no próprio ponto de uso, nunca por um wrapper local.',
  },
  en: {
    'props.table.form':
      'Directive for the form element. It sets the vertical rhythm between fields; the reactive model is still written on the same element.',
    'props.table.invalid':
      'Forces the invalid state. When absent, the state comes from the form control projected inside the field.',
    'props.table.label':
      'Label projected inside the field. The field fills in the association with the control when it was not written by hand.',
    'props.table.input':
      'The control projected inside the field — text field, text area, selection or check. The field finds it and generates the missing identifier.',
    'props.table.description_prop':
      'Helper paragraph projected below the control. It joins the accessible description of the control.',
    'props.table.error':
      'Error paragraph projected below the control. It is announced on arrival and also joins the accessible description.',
    'props.table.className':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.legend':
      'Group label, projected as the first child of the group.',
    'props.table.children':
      'The fields projected inside the group, spaced by 16px.',
    'props.extensibility':
      'The field accepts any projected control — text field, text area, selection, check and compositions. Extra classes go on the class attribute of the element itself.',
    'states.withError.trigger':
      'Projected error message, or invalid state coming from the form control',
    'states.withError.behavior':
      'Message announced below the control, control marked invalid and label in error color — all applied by the field',
    'accessibility.item3':
      'Automatic invalid state — the field marks the control as invalid from the form control state, with no hand-written attribute.',
    'notes.tip2':
      'The field already marks the control as invalid and colors the label when there is an error. Use the override entry only for server-side validation.',
    'notes.tip5':
      'A rich-formatted description is dynamic content: sanitize it with DOMPurify.sanitize() at the call site, never through a local wrapper.',
  },
  es: {
    'props.table.form':
      'Directiva del elemento de formulario. Da el ritmo vertical entre los campos; el modelo reactivo se sigue escribiendo en el mismo elemento.',
    'props.table.invalid':
      'Fuerza el estado inválido. Ausente, el estado viene del control de formulario proyectado dentro del campo.',
    'props.table.label':
      'Rótulo proyectado dentro del campo. El campo completa la asociación con el control cuando no fue escrita a mano.',
    'props.table.input':
      'El control proyectado dentro del campo — campo de texto, área de texto, selección o marcación. El campo lo encuentra y genera el identificador que falta.',
    'props.table.description_prop':
      'Párrafo de apoyo proyectado debajo del control. Entra en la descripción accesible del control.',
    'props.table.error':
      'Párrafo de error proyectado debajo del control. Nace anunciado y también entra en la descripción accesible.',
    'props.table.className':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.legend':
      'Rótulo del agrupamiento, proyectado como primer hijo del agrupamiento.',
    'props.table.children':
      'Los campos proyectados dentro del agrupamiento, espaciados en 16px.',
    'props.extensibility':
      'El campo acepta cualquier control proyectado — campo de texto, área de texto, selección, marcación y composiciones. Las clases extra van en el atributo class del propio elemento.',
    'states.withError.trigger':
      'Mensaje de error proyectado, o estado inválido proveniente del control de formulario',
    'states.withError.behavior':
      'Mensaje anunciado debajo del control, control marcado como inválido y rótulo en color de error — todo aplicado por el campo',
    'accessibility.item3':
      'Estado inválido automático — el campo marca el control como inválido a partir del estado del control de formulario, sin atributo escrito a mano.',
    'notes.tip2':
      'El campo ya marca el control como inválido y pinta el rótulo cuando hay error. Usa la entrada de sobrescritura solo para validación del servidor.',
    'notes.tip5':
      'La descripción con formato rico es contenido dinámico: sanitiza con DOMPurify.sanitize() en el propio punto de uso, nunca con un wrapper local.',
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

const IMPORT_CODE = `import { NDS_FORM } from '@/components/ui/form';
import { NdsInput } from '@/components/ui/input';
import { ReactiveFormsModule } from '@angular/forms';`;

// Sem crase no snippet: ele mora dentro de um template literal, e uma crase
// não escapada aqui fecharia a string no meio do exemplo.
const INTERFACE_CODE = `// Uma diretiva por peça, seletor de atributo no elemento nativo.
form[ndsForm]              // <form ndsForm [formGroup]="form">
div[ndsFormField]          // <div ndsFormField [invalid]="…">
label[ndsFormLabel]        // <label ndsFormLabel>
p[ndsFormDescription]      // <p ndsFormDescription>
p[ndsFormMessage]          // <p ndsFormMessage>
fieldset[ndsFieldset]      // <fieldset ndsFieldset>
legend[ndsFieldsetLegend]  // <legend ndsFieldsetLegend>

// Único input da família — todo o resto é conteúdo projetado.
readonly invalid = input<boolean | undefined>(undefined);

// Sem ele, o estado vem do controle projetado dentro do campo:
// <input ndsInput formControlName="email" />`;

const CUSTOMIZATION_CODE = `/* Em styles.css — sobrescrever tokens do form */
:root {
  --spacing-1-5: 0.375rem;         /* gap entre label, controle, descrição e erro */
  --spacing-4: 1rem;               /* gap entre campos dentro do fieldset */
  --foreground: 222 84% 5%;        /* cor do label e da legend */
  --muted-foreground: 215 16% 47%; /* cor da descrição */
  --destructive: 0 84% 60%;        /* cor do erro */
  --font-weight-medium: 500;       /* peso do label */
}`;

@Component({
  selector: 'nds-form-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_FORM, NdsInput, NdsTextarea,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- Do & Don't ------------------------------------------------------- -->
    <ng-template #tplDoDont1Do>
      <div ndsFormField class="nds-w-full">
        <label ndsFormLabel>{{ t('demonstration.labels.emailLabel') }}</label>
        <input ndsInput type="email" [placeholder]="t('demonstration.labels.emailPlaceholder')" />
        <p ndsFormDescription>{{ t('demonstration.labels.emailDescription') }}</p>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsFormField class="nds-w-full">
        <input ndsInput type="email" [placeholder]="t('demonstration.labels.emailLabel')" />
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsFormField class="nds-w-full" [invalid]="true">
        <label ndsFormLabel>{{ t('demonstration.labels.passwordLabel') }}</label>
        <input ndsInput type="password" autocomplete="new-password" />
        <p ndsFormMessage>{{ t('demonstration.labels.passwordError') }}</p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsFormField class="nds-w-full" [invalid]="true">
        <label ndsFormLabel>{{ t('demonstration.labels.passwordLabel') }}</label>
        <input ndsInput type="password" autocomplete="new-password" />
        <!-- A mensagem genérica é o contraexemplo do par: ela existe no
             conteúdo compartilhado justamente para ser traduzida junto com a
             boa, em vez de ficar presa em português dentro do código. -->
        <p ndsFormMessage>{{ t('demonstration.labels.genericError') }}</p>
      </div>
    </ng-template>

    <ng-template #tplDoDont3Do>
      <fieldset ndsFieldset class="nds-w-full">
        <legend ndsFieldsetLegend>{{ t('demonstration.labels.groupLegend') }}</legend>
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.streetLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.streetPlaceholder')" />
        </div>
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.cityLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.cityPlaceholder')" />
        </div>
      </fieldset>
    </ng-template>
    <ng-template #tplDoDont3Dont>
      <div class="nds-stack nds-w-full" data-spacing="md">
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.streetLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.streetPlaceholder')" />
        </div>
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.cityLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.cityPlaceholder')" />
        </div>
      </div>
    </ng-template>

    <!-- Variantes e composições ------------------------------------------ -->
    <ng-template #tplVarLabelOnly>
      <div ndsFormField class="nds-max-w-sm">
        <label ndsFormLabel>{{ t('demonstration.labels.nameLabel') }}</label>
        <input ndsInput type="text" [placeholder]="t('demonstration.labels.namePlaceholder')" />
      </div>
    </ng-template>
    <ng-template #tplVarWithDescription>
      <div ndsFormField class="nds-max-w-sm">
        <label ndsFormLabel>{{ t('demonstration.labels.nameLabel') }}</label>
        <input ndsInput type="text" [placeholder]="t('demonstration.labels.namePlaceholder')" />
        <p ndsFormDescription>{{ t('demonstration.labels.nameDescription') }}</p>
      </div>
    </ng-template>
    <ng-template #tplCompFieldset>
      <fieldset ndsFieldset class="nds-max-w-sm">
        <legend ndsFieldsetLegend>{{ t('demonstration.labels.groupLegend') }}</legend>
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.streetLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.streetPlaceholder')" />
        </div>
        <div ndsFormField>
          <label ndsFormLabel>{{ t('demonstration.labels.cityLabel') }}</label>
          <input ndsInput type="text" [placeholder]="t('demonstration.labels.cityPlaceholder')" />
        </div>
      </fieldset>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="form"
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
          <form ndsForm class="nds-w-full">
            <div ndsFormField>
              <label ndsFormLabel>{{ t('demonstration.labels.nameLabel') }}</label>
              <input ndsInput type="text" [placeholder]="t('demonstration.labels.namePlaceholder')" />
              <p ndsFormDescription>{{ t('demonstration.labels.nameDescription') }}</p>
            </div>

            <div ndsFormField>
              <label ndsFormLabel>{{ t('demonstration.labels.emailLabel') }}</label>
              <input ndsInput type="email" [placeholder]="t('demonstration.labels.emailPlaceholder')" />
              <p ndsFormDescription>{{ t('demonstration.labels.emailDescription') }}</p>
            </div>

            <div ndsFormField [invalid]="true">
              <label ndsFormLabel>{{ t('demonstration.labels.passwordLabel') }}</label>
              <input ndsInput type="password" autocomplete="new-password" />
              <p ndsFormMessage>{{ t('demonstration.labels.passwordError') }}</p>
            </div>

            <div ndsFormField>
              <label ndsFormLabel>{{ t('demonstration.labels.bioLabel') }}</label>
              <textarea ndsTextarea rows="3" [placeholder]="t('demonstration.labels.bioPlaceholder')"></textarea>
              <p ndsFormDescription>{{ t('demonstration.labels.bioDescription') }}</p>
            </div>

            <fieldset ndsFieldset>
              <legend ndsFieldsetLegend>{{ t('demonstration.labels.groupLegend') }}</legend>
              <div ndsFormField>
                <label ndsFormLabel>{{ t('demonstration.labels.streetLabel') }}</label>
                <input ndsInput type="text" [placeholder]="t('demonstration.labels.streetPlaceholder')" />
              </div>
              <div ndsFormField>
                <label ndsFormLabel>{{ t('demonstration.labels.cityLabel') }}</label>
                <input ndsInput type="text" [placeholder]="t('demonstration.labels.cityPlaceholder')" />
              </div>
            </fieldset>
          </form>
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importCode"
          componentSlug="form"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="form"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="form"
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
          [customizationCode]="customizationCode"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="form"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="form" />

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
export class NdsFormDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');
  private readonly tplVarLabelOnly = viewChild.required<TemplateRef<unknown>>('tplVarLabelOnly');
  private readonly tplVarWithDescription =
    viewChild.required<TemplateRef<unknown>>('tplVarWithDescription');
  private readonly tplCompFieldset = viewChild.required<TemplateRef<unknown>>('tplCompFieldset');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: rotuloDeNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: rotuloDeNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
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
    const pares: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
      [this.tplDoDont3Do(), this.tplDoDont3Dont()],
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
      { key: 'labelOnly',       tpl: this.tplVarLabelOnly()       },
      { key: 'withDescription', tpl: this.tplVarWithDescription() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.items.${key}.name`),
      description: t(`variants.items.${key}.description`),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    // Uma composição só no conteúdo compartilhado — derivada da chave, não
    // contada à mão, para acompanhar o conteúdo se ele crescer.
    const chaves = Object.keys(
      (formTranslations as Record<string, { variants?: { compositions?: Record<string, unknown> } }>)
        [getLocale()]?.variants?.compositions ?? {},
    );
    const previews: Record<string, TemplateRef<unknown>> = {
      fieldset: this.tplCompFieldset(),
    };
    return chaves
      .filter((key) => previews[key])
      .map((key) => ({
        name: t(`variants.compositions.${key}.name`),
        description: t(`variants.compositions.${key}.description`),
        useWhen: t(`variants.compositions.${key}.use`),
        trackId: key,
        preview: previews[key],
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
    return ['default', 'withError', 'disabled'].map((k) => ({
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
    const sim = tNav('common.yes');
    const nao = tNav('common.no');
    const semInput = tNav('common.no');

    // Nenhuma linha descreve opção de factory: aqui a peça é uma diretiva e o
    // conteúdo é projetado. "—" é a convenção para "sem padrão"; a string
    // "undefined" nunca vai para a tabela.
    return [
      {
        title: t('props.fieldTitle'),
        cols,
        items: [
          { name: 'ndsForm',            type: semInput,              defaultValue: '—', required: nao, description: toPlainText(t('props.table.form')) },
          { name: 'invalid',            type: 'boolean',             defaultValue: '—', required: nao, description: toPlainText(t('props.table.invalid')) },
          { name: 'ndsFormLabel',       type: semInput,              defaultValue: '—', required: nao, description: toPlainText(t('props.table.label')) },
          { name: 'ndsInput · ndsTextarea', type: semInput,          defaultValue: '—', required: sim, description: toPlainText(t('props.table.input')) },
          { name: 'ndsFormDescription', type: semInput,              defaultValue: '—', required: nao, description: toPlainText(t('props.table.description_prop')) },
          { name: 'ndsFormMessage',     type: semInput,              defaultValue: '—', required: nao, description: toPlainText(t('props.table.error')) },
          { name: 'class',              type: 'string',              defaultValue: '—', required: nao, description: toPlainText(t('props.table.className')) },
        ],
      },
      {
        title: t('props.fieldsetTitle'),
        cols,
        items: [
          { name: 'ndsFieldsetLegend', type: semInput, defaultValue: '—', required: nao, description: toPlainText(t('props.table.legend')) },
          { name: 'ndsFormField',      type: semInput, defaultValue: '—', required: nao, description: toPlainText(t('props.table.children')) },
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
      { token: '--spacing-1-5',        value: '.nds-form-field',       k: 'fieldGap'         },
      { token: '--foreground',         value: '.nds-form-label',       k: 'labelColor'       },
      { token: '--font-weight-medium', value: '.nds-form-label',       k: 'labelWeight'      },
      { token: '--muted-foreground',   value: '.nds-form-description', k: 'descriptionColor' },
      { token: '--destructive',        value: '.nds-form-error',       k: 'errorColor'       },
      { token: '--spacing-4',          value: '.nds-form-fieldset',    k: 'fieldsetGap'      },
      { token: '--foreground',         value: '.nds-form-legend',      k: 'legendColor'      },
    ].map(({ token, value, k }) => ({
      token,
      value,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'A–Z / 0–9', description: toPlainText(t('accessibility.keyboard.typing')) },
      { key: 'Escape',    description: toPlainText(t('accessibility.keyboard.escape')) },
    ];
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'input',    nome: 'Input',    path: '?path=/docs/ui-input--docs'    },
      { key: 'textarea', nome: 'Textarea', path: '?path=/docs/ui-textarea--docs' },
      { key: 'select',   nome: 'Select',   path: '?path=/docs/ui-select--docs'   },
      { key: 'checkbox', nome: 'Checkbox', path: '?path=/docs/ui-checkbox--docs' },
      { key: 'label',    nome: 'Label',    path: '?path=/docs/ui-label--docs'    },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
    return ['fieldFocus', 'fieldBlur', 'fieldError', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
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
        // `<fieldset>` e `<legend>` chegam escapados no item5; sem o par
        // stripHtml+toPlainText a tag apareceria literal na célula.
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    // Os itens de acessibilidade deste conteúdo são STRING solta, não a trinca
    // critério/nível/como — derivados do dict para não contar item à mão.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: stringItemsFromDict(d, 'testes.accessibility').map((texto) => ({
        criterion: toPlainText(texto),
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
        componentSlug: 'form',
      });
      track('docs_page_view', {
        component_name: 'form',
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
          component_name: 'form',
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

/**
 * Rótulo do menu lateral.
 *
 * Tenta primeiro o conteúdo do componente e só então o ui.json. Alguns slugs
 * trazem o próprio bloco `nav`, outros não — e `t()` devolve a PRÓPRIA CHAVE
 * quando ela não existe, então sem esta ponte o menu de quem não traz o bloco
 * mostrava "nav.overview" escrito na tela, sem erro nenhum.
 */
function rotuloDeNav(chave: string): string {
  const doComponente = t(chave);
  return doComponente === chave ? tNav(chave) : doComponente;
}

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

/** `itemN` que é string solta, não objeto — a forma que `testes.accessibility` usa. */
function stringItemsFromDict(d: Record<string, string>, base: string): string[] {
  const rows: string[] = [];
  for (let i = 1; ; i++) {
    const valor = d[`${base}.item${i}`];
    if (valor === undefined) break;
    rows.push(valor);
  }
  return rows;
}
