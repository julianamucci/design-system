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
import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import checkboxTranslations from '@shared/content/checkbox/translations.json';

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
const { t, dict } = useTranslation(checkboxTranslations as Record<string, unknown>);

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

const INTERFACE_CODE = `// <button ndsCheckbox> — compõe os primitivos do Radix NG
@Component({
  selector: 'button[ndsCheckbox]',
  hostDirectives: [
    { directive: RdxCheckboxRootDirective,
      inputs: ['checked', 'indeterminate', 'disabled', 'required', 'name', 'value'],
      outputs: ['checkedChange', 'indeterminateChange'] },
    RdxCheckboxButtonDirective,
  ],
})
export class NdsCheckbox {}

// Uso com Reactive Forms:
// <button ndsCheckbox formControlName="termos" id="termos"></button>`;

const ANATOMY_CODE = `<div class="nds-cluster" data-spacing="sm">
  <button ndsCheckbox id="termos" [(checked)]="aceito"></button>
  <label ndsLabel for="termos">Aceito os termos</label>
</div>`;

@Component({
  selector: 'nds-checkbox-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsCheckbox, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsCheckbox id="dd1-do"></button>
        <label ndsLabel for="dd1-do">{{ t('demonstration.labels.acceptTerms') }}</label>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsCheckbox [attr.aria-label]="t('demonstration.labels.acceptTerms')"></button>
        <span class="nds-text-body">{{ t('demonstration.labels.acceptTerms') }}</span>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="dd2-do-a"></button>
          <label ndsLabel for="dd2-do-a">{{ t('demonstration.labels.newsletter') }}</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="dd2-do-b"></button>
          <label ndsLabel for="dd2-do-b">{{ t('demonstration.labels.notifications') }}</label>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsCheckbox id="dd2-dont"></button>
        <label ndsLabel for="dd2-dont">
          {{ t('demonstration.labels.newsletter') }} e {{ t('demonstration.labels.notifications') }}
        </label>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <button ndsCheckbox [attr.aria-label]="t('demonstration.labels.rememberMe')"></button>
    </ng-template>
    <ng-template #tplVarWithLabel>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsCheckbox id="var-label"></button>
        <label ndsLabel for="var-label">{{ t('demonstration.labels.rememberMe') }}</label>
      </div>
    </ng-template>
    <ng-template #tplVarWithDescription>
      <div class="nds-cluster" data-spacing="sm" data-align="start">
        <button ndsCheckbox id="var-desc" aria-describedby="var-desc-texto"></button>
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="var-desc">{{ t('demonstration.labels.newsletter') }}</label>
          <p id="var-desc-texto" class="nds-text-caption nds-text-muted-foreground">
            {{ t('demonstration.labels.notifications') }}
          </p>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompFieldset>
      <fieldset class="nds-stack" data-spacing="md">
        <legend class="nds-text-body nds-font-medium">
          {{ t('demonstration.labels.notifications') }}
        </legend>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="comp-fs-a"></button>
          <label ndsLabel for="comp-fs-a">{{ t('demonstration.labels.newsletter') }}</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="comp-fs-b"></button>
          <label ndsLabel for="comp-fs-b">{{ t('demonstration.labels.rememberMe') }}</label>
        </div>
      </fieldset>
    </ng-template>
    <ng-template #tplCompSelectAll>
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="comp-all" [indeterminate]="true"></button>
          <label ndsLabel for="comp-all">{{ t('demonstration.labels.selectAll') }}</label>
        </div>
        <div class="nds-stack nds-checkbox-sublist" data-spacing="md">
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="comp-all-a" [checked]="true"></button>
            <label ndsLabel for="comp-all-a">{{ t('demonstration.labels.newsletter') }}</label>
          </div>
          <div class="nds-cluster" data-spacing="sm">
            <button ndsCheckbox id="comp-all-b"></button>
            <label ndsLabel for="comp-all-b">{{ t('demonstration.labels.rememberMe') }}</label>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplCompInList>
      <div class="nds-stack" data-spacing="md">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="comp-list-a" [checked]="true"></button>
          <label ndsLabel for="comp-list-a">{{ t('demonstration.labels.acceptTerms') }}</label>
        </div>
        <div class="nds-cluster" data-spacing="sm">
          <button ndsCheckbox id="comp-list-b"></button>
          <label ndsLabel for="comp-list-b">{{ t('demonstration.labels.newsletter') }}</label>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="checkbox"
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
          <div class="nds-stack nds-w-full" data-spacing="md">
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="demo-terms" [checked]="true"></button>
              <label ndsLabel for="demo-terms">{{ t('demonstration.labels.acceptTerms') }}</label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="demo-news"></button>
              <label ndsLabel for="demo-news">{{ t('demonstration.labels.newsletter') }}</label>
            </div>
            <div class="nds-cluster" data-spacing="sm">
              <button ndsCheckbox id="demo-mixed" [indeterminate]="true"></button>
              <label ndsLabel for="demo-mixed">{{ t('demonstration.labels.selectAll') }}</label>
            </div>
            <div class="nds-cluster" data-spacing="sm" data-disabled="true">
              <button ndsCheckbox id="demo-disabled" [disabled]="true"></button>
              <label ndsLabel for="demo-disabled">{{ t('demonstration.labels.rememberMe') }}</label>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureCode]="anatomyCode"
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
          [title]="tNav('nav.import')"
          [code]="importCode"
          componentSlug="checkbox"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="checkbox"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="checkbox"
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
          componentSlug="checkbox"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="checkbox" />

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
export class NdsCheckboxDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly importCode = `import { NdsCheckbox } from '@/components/ui/checkbox';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarWithLabel = viewChild.required<TemplateRef<unknown>>('tplVarWithLabel');
  private readonly tplVarWithDescription = viewChild.required<TemplateRef<unknown>>('tplVarWithDescription');
  private readonly tplCompFieldset = viewChild.required<TemplateRef<unknown>>('tplCompFieldset');
  private readonly tplCompSelectAll = viewChild.required<TemplateRef<unknown>>('tplCompSelectAll');
  private readonly tplCompInList = viewChild.required<TemplateRef<unknown>>('tplCompInList');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    // Este componente não numera a anatomia por item1..N — o conteúdo usa o
    // bloco `anatomy` livre. Percorre o que existir, sem inventar linha.
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
      { name: t('variants.items.default'),         description: t('variants.items.default'),         trackId: 'default',          preview: this.tplVarDefault()         },
      { name: t('variants.items.withLabel'),       description: t('variants.items.withLabel'),       trackId: 'withLabel',       preview: this.tplVarWithLabel()       },
      { name: t('variants.items.withDescription'), description: t('variants.items.withDescription'), trackId: 'withDescription', preview: this.tplVarWithDescription() },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'fieldset',  tpl: this.tplCompFieldset()  },
      { key: 'selectAll', tpl: this.tplCompSelectAll() },
      { key: 'inList',    tpl: this.tplCompInList()    },
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
    return ['unchecked', 'checked', 'indeterminate', 'disabled', 'error'].map((k) => ({
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
    // As props vêm do RdxCheckboxRoot via hostDirectives — `checked` e
    // `indeterminate` são `model()`, então `[(checked)]` funciona. O conteúdo
    // compartilhado descreve as mesmas chaves para as outras stacks.
    return [
      {
        title: 'NdsCheckbox',
        cols,
        items: [
          { name: 'checked',        type: 'model<boolean>',   defaultValue: 'false', required: not, description: toPlainText(t('props.items.checked')) },
          { name: 'indeterminate',  type: 'model<boolean>',   defaultValue: 'false', required: not, description: toPlainText(t('props.items.indeterminate')) },
          { name: 'checkedChange',  type: 'output<boolean>',  defaultValue: '—',     required: not, description: toPlainText(t('props.items.onCheckedChange')) },
          { name: 'disabled',       type: 'boolean',          defaultValue: 'false', required: not, description: toPlainText(t('props.items.disabled')) },
          { name: 'required',       type: 'boolean',          defaultValue: 'false', required: not, description: toPlainText(t('props.items.required')) },
          { name: 'name',           type: 'string',           defaultValue: '—',     required: not, description: toPlainText(t('props.items.name')) },
          { name: 'value',          type: 'string',           defaultValue: '—',     required: not, description: toPlainText(t('props.items.value')) },
          { name: 'class',          type: 'string',           defaultValue: '—',     required: not, description: toPlainText(t('props.items.className')) },
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
    // Seletor real lido de docs/shared/styles/nds/checkbox.css — cada token
    // pinta uma regra diferente, não `.nds-checkbox` para todas as seis.
    return [
      { token: '--primary',            value: '.nds-checkbox[data-state="checked"]', k: 'primary'           },
      // O indicador herda a cor: a regra dele é `color: currentColor`, e quem
      // lê `--primary-foreground` é a caixa no estado marcado.
      { token: '--primary-foreground', value: '.nds-checkbox[data-state="checked"]', k: 'primaryForeground' },
      { token: '--input',              value: '.nds-checkbox',                       k: 'input'             },
      { token: '--ring',               value: '.nds-checkbox:focus-visible',         k: 'ring'              },
      { token: '--destructive',        value: '.nds-checkbox[aria-invalid="true"]',  k: 'destructive'       },
      { token: '--border',             value: '.nds-checkbox',                       k: 'border'            },
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
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: '—',         description: toPlainText(t('accessibility.keyboard.disabled')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = checkboxTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'switch',     name: 'Switch',      path: '?path=/docs/components-form-switch--docs'      },
      { key: 'radioGroup', name: 'Radio Group', path: '?path=/docs/components-form-radiogroup--docs'  },
      { key: 'form',       name: 'Form',        path: '?path=/docs/components-form-form--docs'        },
      { key: 'select',     name: 'Select',      path: '?path=/docs/components-form-select--docs'      },
    ].map(({ key, name, path }) => ({
      name: name,
      description: t(`related.${key}`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
    return ['fieldChange', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
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
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
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

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'checkbox',
      });
      track('docs_page_view', {
        component_name: 'checkbox',
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
          component_name: 'checkbox',
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
