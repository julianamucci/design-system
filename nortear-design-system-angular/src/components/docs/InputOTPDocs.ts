import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsInputOtp } from '@/components/ui/input-otp';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import inputOtpTranslations from '@shared/content/input-otp/translations.json';

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

// A tabela de propriedades do conteúdo compartilhado descreve a API da lib
// `input-otp` (React). Aqui não existe lib: os nomes reais são os inputs deste
// componente, e é isso que a pessoa escreve no template. Só o NOME e o TIPO
// mudam — a descrição continua vindo do conteúdo compartilhado.
const { t, dict } = useTranslation(inputOtpTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.pattern.description':
      'Conjunto aceito: apenas dígitos ou letras e dígitos. Também escolhe o teclado do dispositivo.',
  },
  en: {
    'props.table.pattern.description':
      'Accepted set: digits only, or letters and digits. It also picks the device keyboard.',
  },
  es: {
    'props.table.pattern.description':
      'Conjunto aceptado: solo dígitos, o letras y dígitos. También elige el teclado del dispositivo.',
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

const IMPORT_CODE = `import { Component, signal } from '@angular/core';
import { NdsInputOtp } from '@/components/ui/input-otp';

@Component({
  imports: [NdsInputOtp],
  template: \`
    <span id="otp-label" class="nds-text-label">Código de verificação</span>
    <nds-input-otp
      aria-labelledby="otp-label"
      [maxLength]="6"
      [(value)]="codigo"
      (complete)="verificar($event)"
    ></nds-input-otp>
  \`,
})
export class Exemplo {
  readonly codigo = signal('');
  verificar(codigo: string): void { /* … */ }
}`;

const INTERFACE_CODE = `// <nds-input-otp> — um <input> real por dígito, como no Vanilla.
@Component({ selector: 'nds-input-otp' })
export class NdsInputOtp {
  readonly maxLength     = input<number>(6);
  readonly value         = model<string>('');            // [(value)]
  readonly mode          = input<'numeric' | 'alphanumeric'>('numeric');
  readonly disabled      = input<boolean>(false);
  readonly invalid       = input<boolean>(false);        // aria-invalid nos slots
  readonly describedBy   = input<string>('');            // aria-describedby nos slots
  readonly autoFocus     = input<boolean>(false);
  readonly autocomplete  = input<string>('one-time-code');
  readonly separatorAt   = input<number[]>([]);          // [3] → formato 3+3
  readonly separatorChar = input<string>('—');
  readonly ariaLabel     = input<string>('Código de verificação');
  readonly digitLabel    = input<string>('Dígito');
  readonly complete      = output<string>();
}`;

/** Propriedade do conteúdo compartilhado → input real deste stack. */
const PROPS_MAP: { chave: string; nome: string; tipo: string; padrao: string }[] = [
  { chave: 'maxLength',  nome: 'maxLength',   tipo: 'number',                          padrao: '6'                  },
  { chave: 'value',      nome: 'value',       tipo: 'string (model)',                  padrao: `''`                 },
  { chave: 'onChange',   nome: 'valueChange', tipo: 'output<string>',                  padrao: '—'                  },
  { chave: 'onComplete', nome: 'complete',    tipo: 'output<string>',                  padrao: '—'                  },
  { chave: 'pattern',    nome: 'mode',        tipo: `'numeric' | 'alphanumeric'`,      padrao: `'numeric'`          },
  { chave: 'disabled',   nome: 'disabled',    tipo: 'boolean',                         padrao: 'false'              },
  { chave: 'autoFocus',  nome: 'autoFocus',   tipo: 'boolean',                         padrao: 'false'              },
];

/** Chave de token do conteúdo → custom property e seletor reais do CSS. */
const TOKENS_MAP: { chave: string; token: string; seletor: string }[] = [
  { chave: 'slotSize', token: '--spacing-9',  seletor: '.nds-input-otp-slot' },
  { chave: 'border',   token: '--input',      seletor: '.nds-input-otp-slot' },
  { chave: 'rounded',  token: '--radius',     seletor: '.nds-input-otp-slot' },
  { chave: 'active',   token: '--ring',       seletor: '.nds-input-otp-slot:focus' },
  { chave: 'invalid',  token: '--destructive', seletor: '.nds-input-otp-slot[aria-invalid]' },
  // Desabilitado é só opacidade: nenhuma custom property entra na regra, e
  // inventar uma aqui daria à pessoa um token que não sobrescreve nada.
  { chave: 'disabled', token: '—',            seletor: '.nds-input-otp-slot:disabled' },
  { chave: 'caret',    token: '--foreground', seletor: '.nds-input-otp-caret' },
];

@Component({
  selector: 'nds-input-otp-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsInputOtp, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews de Do & Don't ─────────────────────────────────────────── -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="dd1-do-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp aria-labelledby="dd1-do-label" [maxLength]="6"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="dd1-dont-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <!-- autocomplete="off": o campo deixa de pedir o código do SMS ao
             sistema, e quem recebeu a mensagem precisa copiar dígito a dígito. -->
        <nds-input-otp aria-labelledby="dd1-dont-label" [maxLength]="6" autocomplete="off"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="dd2-do-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp aria-labelledby="dd2-do-label" [maxLength]="6"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <nds-input-otp [maxLength]="6"></nds-input-otp>
      </div>
    </ng-template>

    <!-- ── Previews de Variantes ──────────────────────────────────────────── -->
    <ng-template #tplVarSeis>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="var-6-label" class="nds-text-label">{{ t('demonstration.labels.sixDigits') }}</span>
        <nds-input-otp aria-labelledby="var-6-label" [maxLength]="6"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplVarQuatro>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="var-4-label" class="nds-text-label">{{ t('demonstration.labels.fourDigits') }}</span>
        <nds-input-otp aria-labelledby="var-4-label" [maxLength]="4"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplVarSeparador>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="var-sep-label" class="nds-text-label">{{ t('demonstration.labels.withSeparator') }}</span>
        <nds-input-otp
          aria-labelledby="var-sep-label"
          [maxLength]="6"
          [separatorAt]="separadorTresTres"
        ></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplVarAlfanumerico>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="var-alfa-label" class="nds-text-label">{{ t('demonstration.labels.alphanumeric') }}</span>
        <nds-input-otp aria-labelledby="var-alfa-label" [maxLength]="6" mode="alphanumeric"></nds-input-otp>
      </div>
    </ng-template>

    <!-- ── Previews de Composições ────────────────────────────────────────── -->
    <ng-template #tplCompLabel>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="comp-label-texto" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp aria-labelledby="comp-label-texto" [maxLength]="6"></nds-input-otp>
      </div>
    </ng-template>
    <ng-template #tplCompAjuda>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="comp-ajuda-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp
          aria-labelledby="comp-ajuda-label"
          describedBy="comp-ajuda-texto"
          [maxLength]="6"
        ></nds-input-otp>
        <p id="comp-ajuda-texto" class="nds-text-caption nds-text-muted-foreground">
          {{ t('usage.uxWriting.table.helpText.good') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompErro>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="comp-erro-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp
          aria-labelledby="comp-erro-label"
          describedBy="comp-erro-texto"
          [maxLength]="6"
          [value]="codigoErrado"
          [invalid]="true"
        ></nds-input-otp>
        <p id="comp-erro-texto" class="nds-text-caption nds-text-destructive">
          {{ t('usage.uxWriting.table.errorText.good') }}
        </p>
      </div>
    </ng-template>
    <ng-template #tplCompReenvio>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span id="comp-reenvio-label" class="nds-text-label">{{ t('usage.uxWriting.table.label.good') }}</span>
        <nds-input-otp aria-labelledby="comp-reenvio-label" [maxLength]="6"></nds-input-otp>
        <!-- Só o botão: a nota "Não recebeu?" que a descrição cita não existe
             como chave no conteúdo compartilhado, e escrevê-la aqui a deixaria
             em português nos três idiomas. -->
        <div class="nds-cluster" data-spacing="xs" data-align="center">
          <button ndsButton variant="link" size="sm" type="button">
            {{ t('usage.uxWriting.table.resend.good') }}
          </button>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="input-otp"
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
          <div class="nds-grid nds-w-full" data-spacing="lg" data-min="18rem">
            <div class="nds-stack" data-spacing="sm">
              <span id="demo-6-label" class="nds-text-label">{{ t('demonstration.labels.sixDigits') }}</span>
              <nds-input-otp aria-labelledby="demo-6-label" [maxLength]="6"></nds-input-otp>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <span id="demo-4-label" class="nds-text-label">{{ t('demonstration.labels.fourDigits') }}</span>
              <nds-input-otp aria-labelledby="demo-4-label" [maxLength]="4"></nds-input-otp>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <span id="demo-sep-label" class="nds-text-label">{{ t('demonstration.labels.withSeparator') }}</span>
              <nds-input-otp
                aria-labelledby="demo-sep-label"
                [maxLength]="6"
                [separatorAt]="separadorTresTres"
              ></nds-input-otp>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <span id="demo-alfa-label" class="nds-text-label">{{ t('demonstration.labels.alphanumeric') }}</span>
              <nds-input-otp aria-labelledby="demo-alfa-label" [maxLength]="6" mode="alphanumeric"></nds-input-otp>
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
          componentSlug="input-otp"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="input-otp"
          id="variantes"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="input-otp"
          id="composicoes"
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
          language="ts"
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
          componentSlug="input-otp"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="input-otp" />

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
export class NdsInputOTPDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  /** Formato 3+3: separador antes do quarto slot. */
  protected readonly separadorTresTres = [3];
  protected readonly codigoErrado = '482913';

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSeis = viewChild.required<TemplateRef<unknown>>('tplVarSeis');
  private readonly tplVarQuatro = viewChild.required<TemplateRef<unknown>>('tplVarQuatro');
  private readonly tplVarSeparador = viewChild.required<TemplateRef<unknown>>('tplVarSeparador');
  private readonly tplVarAlfanumerico = viewChild.required<TemplateRef<unknown>>('tplVarAlfanumerico');
  private readonly tplCompLabel = viewChild.required<TemplateRef<unknown>>('tplCompLabel');
  private readonly tplCompAjuda = viewChild.required<TemplateRef<unknown>>('tplCompAjuda');
  private readonly tplCompErro = viewChild.required<TemplateRef<unknown>>('tplCompErro');
  private readonly tplCompReenvio = viewChild.required<TemplateRef<unknown>>('tplCompReenvio');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: rotuloDeNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: rotuloDeNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => itensNumerados(dict(), 'anatomy'));

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: t('usage.guidelines.title'),
      items: itensNumerados(d, 'usage.guidelines'),
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
    const d = dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: chavesCom(d, 'usage.uxWriting.table', 'name').map((k) => ({
        element: t(`usage.uxWriting.table.${k}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: itensNumerados(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: itensNumerados(d, 'usage.dont') };
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
    const d = dict();
    const previews: Record<string, TemplateRef<unknown>> = {
      sixDigits: this.tplVarSeis(),
      fourDigits: this.tplVarQuatro(),
      withSeparator: this.tplVarSeparador(),
      alphanumeric: this.tplVarAlfanumerico(),
    };
    // A ordem e o conjunto vêm do dicionário: variante nova no conteúdo
    // compartilhado aparece aqui sem editar a página.
    return chavesFolha(d, 'variants.items')
      .filter((k) => previews[k])
      .map((k) => ({
        name: t(`variants.items.${k}`),
        description: t(`variants.styles.${k}`),
        trackId: k,
        preview: previews[k],
      }));
  });

  protected readonly compositionItems = computed(() => {
    const d = dict();
    const previews: Record<string, TemplateRef<unknown>> = {
      withLabel: this.tplCompLabel(),
      withHelpText: this.tplCompAjuda(),
      withErrorMessage: this.tplCompErro(),
      withResendButton: this.tplCompReenvio(),
    };
    return chavesCom(d, 'variants.compositions', 'name')
      .filter((k) => previews[k])
      .map((k) => ({
        name: t(`variants.compositions.${k}.name`),
        description: t(`variants.compositions.${k}.description`),
        useWhen: t(`variants.compositions.${k}.use`),
        trackId: k,
        preview: previews[k],
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
    const d = dict();
    return chavesCom(d, 'states', 'label').map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    return [
      {
        cols: {
          prop: t('props.table.prop'),
          type: t('props.table.type'),
          default: t('props.table.default'),
          required: t('props.table.required'),
          description: t('props.table.description'),
        },
        items: PROPS_MAP.map(({ chave, nome, tipo, padrao }) => ({
          name: nome,
          type: tipo,
          defaultValue: padrao,
          required: t(`props.table.${chave}.required`),
          description: toPlainText(t(`props.table.${chave}.description`)),
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
    return TOKENS_MAP.map(({ chave, token, seletor }) => ({
      token,
      value: seletor,
      description: toPlainText(t(`tokens.table.${chave}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => itensNumerados(dict(), 'accessibility.items'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '← / →',      description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Backspace',  description: toPlainText(t('accessibility.keyboard.backspace')) },
      { key: 'Ctrl+V',     description: toPlainText(t('accessibility.keyboard.paste')) },
      { key: '0–9',        description: toPlainText(t('accessibility.keyboard.digit')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    const d = dict();
    return ['label', 'value', 'error'].map((k) => toPlainText(d[`accessibility.screenReader.${k}`] ?? ''));
  });

  protected readonly relatedItems = computed(() => {
    const d = dict();
    const caminhos: Record<string, string> = {
      input:  '?path=/docs/ui-input--docs',
      form:   '?path=/docs/ui-form--docs',
      label:  '?path=/docs/ui-label--docs',
      button: '?path=/docs/ui-button--docs',
    };
    return chavesCom(d, 'related.items', 'name')
      .filter((k) => caminhos[k])
      .map((k) => ({
        name: t(`related.items.${k}.name`),
        description: t(`related.items.${k}.description`),
        path: caminhos[k],
      }));
  });

  protected readonly noteItems = computed(() =>
    itensNumerados(dict(), 'notes').map((content) => ({ title: '', content })),
  );

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
    // O conteúdo deste slug traz a seção Analytics como um parágrafo, não como
    // tabela: uma linha só, com o texto inteiro no gatilho.
    return [
      {
        event: 'otp_complete / otp_paste / otp_resend',
        trigger: toPlainText(t('analytics.description')),
        payload: 'component, location, length',
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
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // Aqui os itens são string solta (sem criterion/level/how): o critério é
      // o texto, e o nível vem dentro dele quando existe.
      items: itensNumerados(d, 'testes.accessibility').map((texto) => ({
        criterion: toPlainText(texto),
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
        componentSlug: 'input-otp',
      });
      track('docs_page_view', {
        component_name: 'input-otp',
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
          component_name: 'input-otp',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// ─── Helpers de dicionário ────────────────────────────────────────────────────
//
// Toda lista desta página é derivada do dicionário. Contar itens à mão faz o
// conteúdo compartilhado crescer sem a página acompanhar — e o item novo some
// sem erro nenhum.

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

/** `base.item1`, `base.item2`, … até faltar. */
function itensNumerados(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
}

/** Sub-chaves de `base` que têm o campo `campo` — descarta cabeçalhos da seção. */
function chavesCom(d: Record<string, string>, base: string, campo: string): string[] {
  const prefixo = `${base}.`;
  const out: string[] = [];
  for (const chave of Object.keys(d)) {
    if (!chave.startsWith(prefixo)) continue;
    const nome = chave.slice(prefixo.length).split('.')[0];
    if (out.includes(nome)) continue;
    if (d[`${base}.${nome}.${campo}`] === undefined) continue;
    out.push(nome);
  }
  return out;
}

/** Sub-chaves de `base` que são folha (string direta, sem campos dentro). */
function chavesFolha(d: Record<string, string>, base: string): string[] {
  const prefixo = `${base}.`;
  const out: string[] = [];
  for (const chave of Object.keys(d)) {
    if (!chave.startsWith(prefixo)) continue;
    const resto = chave.slice(prefixo.length);
    if (resto.includes('.')) continue;
    out.push(resto);
  }
  return out;
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
