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
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import inputTranslations from '@shared/content/input/translations.json';

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

// Nenhuma linha da tabela é input do componente: `type`, `placeholder`,
// `disabled`, `aria-invalid` e `autocomplete` são atributos nativos do <input>,
// e a classe extra vai no próprio elemento. As descrições explicam isso em vez
// de prometerem prop que aqui não existe.
const { t, dict } = useTranslation(inputTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
  },
  en: {
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
  },
  es: {
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
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

const INTERFACE_CODE = `// <input ndsInput> — diretiva de atributo, sem inputs
@Directive({
  selector: 'input[ndsInput]',
  host: { class: 'nds-input', '[attr.data-slot]': '"input"' },
})
export class NdsInput {}

// type, placeholder, disabled, aria-invalid e autocomplete são nativos.
// O estado de formulário vem de Reactive Forms:
// <input ndsInput formControlName="email" type="email" />`;

const TIPOS = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'file'] as const;

@Component({
  selector: 'nds-input-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsInput, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd1-do">{{ t('demonstration.labels.emailLabel') }}</label>
        <input ndsInput id="dd1-do" type="email" [placeholder]="t('demonstration.labels.emailPlaceholder')" />
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <input ndsInput type="email" [placeholder]="t('demonstration.labels.emailLabel')" />
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-do">{{ t('demonstration.labels.errorLabel') }}</label>
        <input ndsInput id="dd2-do" type="email" aria-invalid="true" aria-describedby="dd2-do-erro" />
        <p id="dd2-do-erro" class="nds-text-caption nds-text-destructive">
          {{ t('demonstration.labels.errorMessage') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-dont">{{ t('demonstration.labels.errorLabel') }}</label>
        <input ndsInput id="dd2-dont" type="email" style="border-color: red" />
      </div>
    </ng-template>
    <ng-template #tplDoDont3Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd3-do">{{ t('demonstration.labels.passwordLabel') }}</label>
        <input ndsInput id="dd3-do" type="password" autocomplete="current-password" />
      </div>
    </ng-template>
    <ng-template #tplDoDont3Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd3-dont">{{ t('demonstration.labels.passwordLabel') }}</label>
        <input ndsInput id="dd3-dont" type="text" />
      </div>
    </ng-template>

    <ng-template #tplCompLabel>
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="comp-label">{{ t('demonstration.labels.defaultLabel') }}</label>
        <input ndsInput id="comp-label" type="text" [placeholder]="t('demonstration.labels.defaultPlaceholder')" />
      </div>
    </ng-template>
    <ng-template #tplCompHint>
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="comp-hint">{{ t('demonstration.labels.emailLabel') }}</label>
        <input ndsInput id="comp-hint" type="email" aria-describedby="comp-hint-dica" />
        <p id="comp-hint-dica" class="nds-text-caption nds-text-muted-foreground">
          {{ t('demonstration.labels.emailPlaceholder') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompError>
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="comp-error">{{ t('demonstration.labels.errorLabel') }}</label>
        <input ndsInput id="comp-error" type="email" aria-invalid="true" aria-describedby="comp-error-msg" />
        <p id="comp-error-msg" class="nds-text-caption nds-text-destructive">
          {{ t('demonstration.labels.errorMessage') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompPrefix>
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="comp-prefix">{{ t('demonstration.labels.searchLabel') }}</label>
        <input ndsInput id="comp-prefix" type="search" [placeholder]="t('demonstration.labels.searchPlaceholder')" />
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="input"
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
          <div class="nds-grid nds-w-full" data-spacing="lg" data-min="16rem">
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-default">{{ t('demonstration.labels.defaultLabel') }}</label>
              <input ndsInput id="demo-default" type="text" [placeholder]="t('demonstration.labels.defaultPlaceholder')" />
            </div>
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-email">{{ t('demonstration.labels.emailLabel') }}</label>
              <input ndsInput id="demo-email" type="email" [placeholder]="t('demonstration.labels.emailPlaceholder')" />
            </div>
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-password">{{ t('demonstration.labels.passwordLabel') }}</label>
              <input ndsInput id="demo-password" type="password" autocomplete="current-password" [placeholder]="t('demonstration.labels.passwordPlaceholder')" />
            </div>
            <div class="nds-stack" data-spacing="sm" data-disabled="true">
              <label ndsLabel for="demo-disabled">{{ t('demonstration.labels.disabledLabel') }}</label>
              <input ndsInput id="demo-disabled" type="text" disabled [placeholder]="t('demonstration.labels.disabledPlaceholder')" />
            </div>
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-error">{{ t('demonstration.labels.errorLabel') }}</label>
              <input ndsInput id="demo-error" type="email" aria-invalid="true" aria-describedby="demo-error-msg" />
              <p id="demo-error-msg" class="nds-text-caption nds-text-destructive">
                {{ t('demonstration.labels.errorMessage') }}
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="t('import.basic')"
          componentSlug="input"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="input"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="input"
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
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="input"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="input" />

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
export class NdsInputDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');
  private readonly tplCompLabel = viewChild.required<TemplateRef<unknown>>('tplCompLabel');
  private readonly tplCompHint = viewChild.required<TemplateRef<unknown>>('tplCompHint');
  private readonly tplCompError = viewChild.required<TemplateRef<unknown>>('tplCompError');
  private readonly tplCompPrefix = viewChild.required<TemplateRef<unknown>>('tplCompPrefix');

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
    // A seção Variantes deste componente é a lista de TIPOS do <input>, que o
    // conteúdo compartilhado descreve um a um. Sem preview por tipo: o que
    // muda é o teclado do dispositivo e a validação do browser, não o visual —
    // nove caixas idênticas na tela ensinariam o contrário.
    return TIPOS.map((tipo) => ({
      name: tipo,
      description: t(`variants.items.types.${tipo}`),
      trackId: tipo,
      preview: this.tplCompLabel(),
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'withLabel',  tpl: this.tplCompLabel()  },
      { key: 'withHint',   tpl: this.tplCompHint()   },
      { key: 'withError',  tpl: this.tplCompError()  },
      { key: 'withPrefix', tpl: this.tplCompPrefix() },
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
    return ['default', 'focus', 'disabled', 'error', 'file'].map((k) => ({
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
    // Nenhuma linha é input do componente — todas descrevem atributo nativo do
    // <input>. O tipo diz "atributo HTML" em vez de um tipo TypeScript que não
    // existe nesta stack.
    return [
      {
        title: t('props.inputTitle'),
        cols,
        items: [
          { name: 'type',          type: 'string',  defaultValue: "'text'", required: nao, description: toPlainText(t('props.table.type_prop')) },
          { name: 'placeholder',   type: 'string',  defaultValue: '—',      required: nao, description: toPlainText(t('props.table.placeholder')) },
          { name: 'disabled',      type: 'boolean', defaultValue: 'false',  required: nao, description: toPlainText(t('props.table.disabled')) },
          { name: 'aria-invalid',  type: 'boolean', defaultValue: '—',      required: nao, description: toPlainText(t('props.table.ariaInvalid')) },
          { name: 'autocomplete',  type: 'string',  defaultValue: '—',      required: nao, description: toPlainText(t('props.table.autoComplete')) },
          { name: 'class',         type: 'string',  defaultValue: '—',      required: nao, description: toPlainText(t('props.table.className')) },
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
      { token: '--height-input', k: 'height'      },
      { token: '--radius',       k: 'radius'      },
      { token: '--border',       k: 'border'      },
      { token: '--ring',         k: 'ring'        },
      { token: '--destructive',  k: 'borderError' },
      { token: '--muted',        k: 'bgDisabled'  },
      { token: '--muted-foreground', k: 'placeholder' },
    ].map(({ token, k }) => ({
      token,
      value: '.nds-input',
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

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = inputTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'textarea',   nome: 'Textarea',   path: '?path=/docs/ui-textarea--docs'   },
      { key: 'inputOTP',   nome: 'Input OTP',  path: '?path=/docs/ui-inputotp--docs'   },
      { key: 'select',     nome: 'Select',     path: '?path=/docs/ui-select--docs'     },
      { key: 'form',       nome: 'Form',       path: '?path=/docs/ui-form--docs'       },
      { key: 'label',      nome: 'Label',      path: '?path=/docs/ui-label--docs'      },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: t(`related.${key}`),
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
        componentSlug: 'input',
      });
      track('docs_page_view', {
        component_name: 'input',
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
          component_name: 'input',
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
