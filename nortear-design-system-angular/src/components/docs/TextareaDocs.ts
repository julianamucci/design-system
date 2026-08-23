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
import { toPlainText } from '@/lib/strip-html';
import { NdsTextarea } from '@/components/ui/textarea';
import { NdsLabel } from '@/components/ui/label';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import textareaTranslations from '@shared/content/textarea/translations.json';

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

// A diretiva não tem inputs: `placeholder`, `maxlength`, `rows`, `disabled`,
// `readonly` e `aria-invalid` são atributos nativos do <textarea>, o valor
// inicial é o conteúdo entre as tags e a mudança chega pelo evento nativo. As
// três descrições abaixo prometeriam prop que aqui não existe.
const { t, dict } = useTranslation(textareaTranslations as Record<string, unknown>, {
  '*': { 'props.table.onChange.type': '(event: Event) => void' },
  'pt-BR': {
    'props.table.defaultValue.description':
      'Conteúdo inicial — vai entre as tags de abertura e fechamento do elemento.',
    'props.table.onChange.description':
      'Evento nativo de entrada do elemento; em formulário, o estado vem de Reactive Forms.',
    'props.table.className.description':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
  },
  en: {
    'props.table.defaultValue.description':
      'Initial content — goes between the opening and closing tags of the element.',
    'props.table.onChange.description':
      'Native input event of the element; inside a form the state comes from Reactive Forms.',
    'props.table.className.description':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
  },
  es: {
    'props.table.defaultValue.description':
      'Contenido inicial — va entre las etiquetas de apertura y cierre del elemento.',
    'props.table.onChange.description':
      'Evento nativo de entrada del elemento; en un formulario el estado viene de Reactive Forms.',
    'props.table.className.description':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
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

const IMPORT_CODE = `import { NdsTextarea } from '@/components/ui/textarea';
import { NdsLabel } from '@/components/ui/label';`;

const INTERFACE_CODE = `// <textarea ndsTextarea> — diretiva de atributo, sem inputs
@Directive({
  selector: 'textarea[ndsTextarea]',
  host: { class: 'nds-textarea', '[attr.data-slot]': '"textarea"' },
})
export class NdsTextarea {}

// placeholder, maxlength, rows, disabled, readonly e aria-invalid são
// atributos nativos. O estado de formulário vem de Reactive Forms:
// <textarea ndsTextarea formControlName="bio" rows="3"></textarea>`;

const CODE_DEFAULT = `<div class="nds-stack" data-spacing="sm">
  <label ndsLabel for="bio">Biografia</label>
  <textarea
    ndsTextarea
    id="bio"
    placeholder="Conte um pouco sobre você..."
    class="nds-resize-y nds-min-h-30"
  ></textarea>
</div>`;

const CODE_COUNTER = `<!-- value = signal(''); max = 500 -->
<div class="nds-stack" data-spacing="sm">
  <label ndsLabel for="description">Descrição</label>
  <textarea
    ndsTextarea
    id="description"
    [value]="value()"
    (input)="value.set($any($event.target).value)"
    class="nds-resize-y nds-min-h-30"
    [attr.maxlength]="max"
  ></textarea>
  <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
    <span>Descreva com clareza.</span>
    <span
      aria-live="polite"
      [attr.aria-label]="value().length + ' de ' + max + ' caracteres usados'"
    >{{ value().length }}/{{ max }}</span>
  </div>
</div>`;

const CODE_NO_RESIZE = `<div class="nds-stack" data-spacing="sm">
  <label ndsLabel for="feedback">Feedback</label>
  <textarea
    ndsTextarea
    id="feedback"
    placeholder="O que poderíamos melhorar?"
    class="nds-resize-none nds-min-h-30"
  ></textarea>
</div>`;

const CODE_COMP_LABEL = `<div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
  <label ndsLabel for="ta-label">Descrição</label>
  <textarea ndsTextarea id="ta-label" class="nds-resize-y nds-min-h-30"></textarea>
</div>`;

const CODE_COMP_HINT = `<div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
  <label ndsLabel for="ta-hint">Descrição</label>
  <textarea
    ndsTextarea
    id="ta-hint"
    class="nds-resize-y nds-min-h-30"
    aria-describedby="ta-hint-apoio"
  ></textarea>
  <p id="ta-hint-apoio" class="nds-text-caption nds-text-muted-foreground">
    Descreva o produto com clareza, destacando os principais atributos.
  </p>
</div>`;

const CODE_COMP_ERROR = `<div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
  <label ndsLabel for="ta-error">Descrição</label>
  <textarea
    ndsTextarea
    id="ta-error"
    class="nds-resize-y nds-min-h-30"
    aria-invalid="true"
    aria-describedby="ta-error-msg"
  ></textarea>
  <p id="ta-error-msg" class="nds-text-caption nds-text-destructive">
    A descrição é obrigatória e deve ter pelo menos 20 caracteres.
  </p>
</div>`;

const CODE_COMP_FORM = `<form
  class="nds-stack nds-w-full nds-max-w-md"
  data-spacing="md"
  aria-label="Formulário de feedback"
  (submit)="enviar($event)"
>
  <div class="nds-stack" data-spacing="sm">
    <label ndsLabel for="ta-form">Feedback</label>
    <textarea
      ndsTextarea
      id="ta-form"
      name="feedback"
      class="nds-resize-y nds-min-h-30"
      placeholder="Compartilhe sua opinião..."
    ></textarea>
  </div>
  <button ndsButton type="submit">Enviar</button>
</form>`;

@Component({
  selector: 'nds-textarea-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsTextarea, NdsLabel, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd1-do">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="dd1-do"
          class="nds-resize-y nds-min-h-25"
          maxlength="500"
        >Camiseta de algodão, gola redonda, manga curta.</textarea>
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>{{ t('demonstration.labels.descriptionHelp') }}</span>
          <span aria-live="polite" aria-label="47 de 500 caracteres usados">47/500</span>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd1-dont">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="dd1-dont"
          class="nds-resize-y nds-min-h-25"
          maxlength="500"
        >Camiseta de algodão, gola redonda, manga curta.</textarea>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-do">{{ t('demonstration.labels.bioLabel') }}</label>
        <textarea
          ndsTextarea
          id="dd2-do"
          class="nds-resize-y nds-min-h-25"
          [placeholder]="t('demonstration.labels.bioPlaceholder')"
        ></textarea>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-dont">{{ t('demonstration.labels.bioLabel') }}</label>
        <textarea
          ndsTextarea
          id="dd2-dont"
          class="nds-resize nds-min-h-25"
          [placeholder]="t('demonstration.labels.bioPlaceholder')"
        ></textarea>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="v-default">{{ t('demonstration.labels.bioLabel') }}</label>
        <textarea
          ndsTextarea
          id="v-default"
          class="nds-resize-y nds-min-h-30"
          [placeholder]="t('demonstration.labels.bioPlaceholder')"
        ></textarea>
      </div>
    </ng-template>
    <ng-template #tplVarCounter>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="v-counter">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="v-counter"
          class="nds-resize-y nds-min-h-30"
          maxlength="500"
          [value]="varCounter()"
          (input)="varCounter.set($any($event.target).value)"
        ></textarea>
        <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>{{ t('demonstration.labels.descriptionHelp') }}</span>
          <span aria-live="polite" [attr.aria-label]="rotuloDoContador(varCounter().length, 500)">
            {{ varCounter().length }}/500
          </span>
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarNoResize>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="v-noresize">{{ t('demonstration.labels.feedbackLabel') }}</label>
        <textarea
          ndsTextarea
          id="v-noresize"
          class="nds-resize-none nds-min-h-30"
          [placeholder]="t('demonstration.labels.feedbackPlaceholder')"
        ></textarea>
      </div>
    </ng-template>

    <ng-template #tplCompLabel>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <label ndsLabel for="comp-label">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="comp-label"
          class="nds-resize-y nds-min-h-30"
          [placeholder]="t('demonstration.labels.descriptionPlaceholder')"
        ></textarea>
      </div>
    </ng-template>
    <ng-template #tplCompHint>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <label ndsLabel for="comp-hint">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="comp-hint"
          class="nds-resize-y nds-min-h-30"
          aria-describedby="comp-hint-apoio"
          [placeholder]="t('demonstration.labels.descriptionPlaceholder')"
        ></textarea>
        <p id="comp-hint-apoio" class="nds-text-caption nds-text-muted-foreground">
          {{ t('demonstration.labels.descriptionHelp') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompError>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <label ndsLabel for="comp-error">{{ t('demonstration.labels.descriptionLabel') }}</label>
        <textarea
          ndsTextarea
          id="comp-error"
          class="nds-resize-y nds-min-h-30"
          aria-invalid="true"
          aria-describedby="comp-error-msg"
        ></textarea>
        <p id="comp-error-msg" class="nds-text-caption nds-text-destructive">
          {{ mensagemDeErro() }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompForm>
      <form
        class="nds-stack nds-w-full nds-max-w-md"
        data-spacing="md"
        [attr.aria-label]="t('demonstration.labels.feedbackLabel')"
        (submit)="enviarFormulario($event)"
      >
        <div class="nds-stack" data-spacing="sm">
          <label ndsLabel for="comp-form">{{ t('demonstration.labels.feedbackLabel') }}</label>
          <textarea
            ndsTextarea
            id="comp-form"
            name="feedback"
            class="nds-resize-y nds-min-h-30"
            [placeholder]="t('demonstration.labels.feedbackPlaceholder')"
            [value]="formValue()"
            (input)="formValue.set($any($event.target).value)"
          ></textarea>
        </div>
        <button ndsButton type="submit">{{ rotuloEnviar() }}</button>
        @if (formEnviado()) {
          <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">
            {{ formEnviado() }}
          </p>
        }
      </form>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="textarea"
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
          <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="lg">
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-description">{{ t('demonstration.labels.descriptionLabel') }}</label>
              <textarea
                ndsTextarea
                id="demo-description"
                class="nds-resize-y nds-min-h-30"
                maxlength="500"
                aria-describedby="demo-description-help"
                [placeholder]="t('demonstration.labels.descriptionPlaceholder')"
                [value]="demoDescription()"
                (input)="demoDescription.set($any($event.target).value)"
                (blur)="registrarSaida('description', demoDescription())"
              ></textarea>
              <div class="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
                <span id="demo-description-help">{{ t('demonstration.labels.descriptionHelp') }}</span>
                <span aria-live="polite" [attr.aria-label]="rotuloDoContador(demoDescription().length, 500)">
                  {{ demoDescription().length }}/500
                </span>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-bio">{{ t('demonstration.labels.bioLabel') }}</label>
              <textarea
                ndsTextarea
                id="demo-bio"
                class="nds-resize-y nds-min-h-30"
                [placeholder]="t('demonstration.labels.bioPlaceholder')"
                [value]="demoBio()"
                (input)="demoBio.set($any($event.target).value)"
                (blur)="registrarSaida('bio', demoBio())"
              ></textarea>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-feedback">{{ t('demonstration.labels.feedbackLabel') }}</label>
              <textarea
                ndsTextarea
                id="demo-feedback"
                class="nds-resize-none nds-min-h-30"
                [placeholder]="t('demonstration.labels.feedbackPlaceholder')"
                [value]="demoFeedback()"
                (input)="demoFeedback.set($any($event.target).value)"
                (blur)="registrarSaida('feedback', demoFeedback())"
              ></textarea>
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.noResize') }}
              </p>
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
          componentSlug="textarea"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="textarea"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="textarea"
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
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="textarea"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="textarea" />

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
export class NdsTextareaDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  protected readonly demoDescription = signal('');
  protected readonly demoBio = signal('');
  protected readonly demoFeedback = signal('');
  protected readonly varCounter = signal('');
  protected readonly formValue = signal('');
  protected readonly formEnviado = signal('');

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarCounter = viewChild.required<TemplateRef<unknown>>('tplVarCounter');
  private readonly tplVarNoResize = viewChild.required<TemplateRef<unknown>>('tplVarNoResize');
  private readonly tplCompLabel = viewChild.required<TemplateRef<unknown>>('tplCompLabel');
  private readonly tplCompHint = viewChild.required<TemplateRef<unknown>>('tplCompHint');
  private readonly tplCompError = viewChild.required<TemplateRef<unknown>>('tplCompError');
  private readonly tplCompForm = viewChild.required<TemplateRef<unknown>>('tplCompForm');

  /** O template Angular não tem globais — a interpolação sai daqui. */
  protected rotuloDoContador(usados: number, max: number): string {
    const locale = getLocale();
    return locale === 'en'
      ? `${usados} of ${max} characters used`
      : `${usados} de ${max} caracteres usados`;
  }

  protected readonly rotuloEnviar = computed(() => {
    dict();
    const locale = getLocale();
    return locale === 'en' ? 'Send' : locale === 'es' ? 'Enviar' : 'Enviar';
  });

  protected readonly mensagemDeErro = computed(() => {
    dict();
    const locale = getLocale();
    if (locale === 'en') return 'The description is required and must be at least 20 characters.';
    if (locale === 'es') return 'La descripción es obligatoria y debe tener al menos 20 caracteres.';
    return 'A descrição é obrigatória e deve ter pelo menos 20 caracteres.';
  });

  protected enviarFormulario(evento: Event): void {
    evento.preventDefault();
    const text = this.formValue().trim();
    this.formEnviado.set(text ? `${text.length} / ${this.formValue().length}` : '0');
  }

  protected registrarSaida(field: string, value: string): void {
    if (!value.trim()) return;
    track('field_blur', { component: 'textarea', field_name: field, location: 'docs_demo' });
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
      items: ['label', 'placeholder', 'counter'].map((k) => ({
        element: t(`usage.uxWriting.table.${k}.name`),
        rules: t(`usage.uxWriting.table.${k}.format`),
        do: t(`usage.uxWriting.table.${k}.good`),
        dont: t(`usage.uxWriting.table.${k}.bad`),
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
      { key: 'default',     code: CODE_DEFAULT,   tpl: this.tplVarDefault()  },
      { key: 'withCounter', code: CODE_COUNTER,   tpl: this.tplVarCounter()  },
      { key: 'noResize',    code: CODE_NO_RESIZE, tpl: this.tplVarNoResize() },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: toPlainText(t(`variants.styles.${key}`)),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'withLabel', code: CODE_COMP_LABEL, tpl: this.tplCompLabel() },
      { key: 'withHint',  code: CODE_COMP_HINT,  tpl: this.tplCompHint()  },
      { key: 'withError', code: CODE_COMP_ERROR, tpl: this.tplCompError() },
      { key: 'inForm',    code: CODE_COMP_FORM,  tpl: this.tplCompForm()  },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code,
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
    return ['default', 'focus', 'filled', 'disabled', 'invalid', 'readonly'].map((k) => ({
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
    // Nenhuma linha é input da diretiva: todas descrevem atributo nativo do
    // <textarea>, e os nomes seguem o HTML em vez de uma API que não existe.
    const line = (name: string, k: string) => ({
      name,
      type: toPlainText(t(`props.table.${k}.type`)),
      defaultValue: t(`props.table.${k}.default`),
      required: t(`props.table.${k}.required`),
      description: toPlainText(t(`props.table.${k}.description`)),
    });
    return [
      {
        cols,
        items: [
          line('value', 'value'),
          line('(conteúdo do elemento)', 'defaultValue'),
          line('(input)', 'onChange'),
          line('placeholder', 'placeholder'),
          line('maxlength', 'maxLength'),
          line('rows', 'rows'),
          line('disabled', 'disabled'),
          line('readonly', 'readOnly'),
          line('class', 'className'),
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
      { token: '--input',            k: 'input'           },
      { token: '--background',       k: 'background'      },
      { token: '--foreground',       k: 'foreground'      },
      { token: '--muted-foreground', k: 'mutedForeground' },
      { token: '--ring',             k: 'ring'            },
      { token: '--destructive',      k: 'destructive'     },
      { token: '--muted',            k: 'muted'           },
      { token: '--radius',           k: 'radius'          },
      { token: '--spacing-2 · --spacing-3', k: 'padding'  },
      { token: '--spacing-8',        k: 'minHeight'       },
      { token: '--text-control',     k: 'fontSize'        },
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
      { key: 'Tab',         description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab',   description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',       description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Shift+Enter', description: toPlainText(t('accessibility.keyboard.shiftEnter')) },
      { key: 'Esc',         description: toPlainText(t('accessibility.keyboard.esc')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = textareaTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'input',    path: '?path=/docs/ui-input--docs'    },
      { key: 'label',    path: '?path=/docs/ui-label--docs'    },
      { key: 'form',     path: '?path=/docs/ui-form--docs'     },
      { key: 'inputOTP', path: '?path=/docs/ui-inputotp--docs' },
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
      trigger: toPlainText(t('analytics.table.trigger')),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return [
      {
        event: 'field_blur',
        trigger: toPlainText(t('analytics.table.field_blur.trigger')),
        payload: t('analytics.table.field_blur.payload'),
      },
      {
        event: 'docs_page_view',
        trigger: tNav('common.pageMount'),
        payload: '{ component_name: "textarea", locale, page_title }',
      },
      {
        event: 'docs_section_viewed',
        trigger: tNav('common.sectionViewed'),
        payload: '{ section_id, component_name: "textarea", locale }',
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
        result: toPlainText(r.result),
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
      items: [1, 2, 3, 4, 5].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level: 'AA',
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
        componentSlug: 'textarea',
      });
      track('docs_page_view', {
        component_name: 'textarea',
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
          component_name: 'textarea',
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
