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
  type WritableSignal,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NdsSwitch } from '@/components/ui/switch';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import switchTranslations from '@shared/content/switch/translations.json';

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
const { t, dict } = useTranslation(switchTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, não do conteúdo do componente:
// `switch/translations.json` não tem `nav.compositions`, e ler de lá deixaria a
// seção Composições com a própria chave impressa como título no menu.
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

// A variante `angular` de `anatomy.structureCode` no conteúdo compartilhado
// descreve um elemento `<nds-switch />` que este stack não tem — o componente é
// um seletor de atributo sobre `<button>`, para o markup bater com o das outras
// stacks e o CSS `.nds-switch` casar sem wrapper. Enquanto o conteúdo não for
// corrigido, a estrutura mostrada aqui é a que compila.
const ANATOMY_CODE = `<div class="nds-cluster" data-spacing="sm">
  <button ndsSwitch id="notificacoes" [(checked)]="ativo"></button>
  <label ndsLabel for="notificacoes">Receber notificações</label>
</div>`;

const INTERFACE_CODE = `// <button ndsSwitch> — compõe o primitivo do Radix NG
@Component({
  selector: 'button[ndsSwitch]',
  hostDirectives: [
    { directive: RdxSwitchRoot,
      inputs: ['id', 'checked', 'defaultChecked', 'disabled', 'required',
               'readonly', 'invalid', 'name', 'form', 'value'],
      outputs: ['checkedChange'] },
  ],
})
export class NdsSwitch {
  readonly size = input<'default' | 'sm'>('default');
}

// Uso com Reactive Forms:
// <button ndsSwitch formControlName="notificacoes" id="notificacoes"></button>`;

const IMPORT_CODE = `import { NdsSwitch } from '@/components/ui/switch';`;
const IMPORT_CODE_LABEL = `import { NdsSwitch } from '@/components/ui/switch';
import { NdsLabel } from '@/components/ui/label';`;

// `tokens.customizationCode` do conteúdo compartilhado ainda ensina `@apply`,
// que saiu do projeto junto com o Tailwind. A customização real do Switch é
// sobrescrever os tokens que o `.nds-switch` lê.
const TOKENS_CODE = `/* Tokens que o .nds-switch consome */
:root {
  --primary: 222 47% 11%;            /* trilho ligado */
  --input: 214 32% 91%;              /* trilho desligado */
  --background: 0 0% 100%;           /* knob */
  --ring: 222 47% 11%;               /* anel de foco */
  --destructive: 0 72% 51%;          /* estado inválido */
}

/* Degrau compacto — vem de data-size, não de classe */
button[ndsSwitch][data-size="sm"] { /* 24x16, knob 12 */ }`;

const VARIANT_CODE = {
  default: `<div class="nds-cluster" data-spacing="sm">
  <button ndsSwitch id="notificacoes"></button>
  <label ndsLabel for="notificacoes">Receber notificações</label>
</div>`,
  withDescription: `<div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
  <div class="nds-stack" data-spacing="xs">
    <label ndsLabel for="marketing">Emails de marketing</label>
    <p class="nds-text-caption nds-text-muted-foreground">
      Receba novidades e promoções da plataforma.
    </p>
  </div>
  <button ndsSwitch id="marketing"></button>
</div>`,
  sm: `<div class="nds-cluster" data-spacing="sm">
  <button ndsSwitch id="compacto" size="sm"></button>
  <label ndsLabel for="compacto">Tamanho compacto</label>
</div>`,
};

const COMPOSITION_CODE = {
  withLabel: `<div class="nds-cluster" data-spacing="sm">
  <button ndsSwitch id="sw-email"></button>
  <label ndsLabel for="sw-email">Receber notificações</label>
</div>`,
  withoutLabel: `<button ndsSwitch id="doc-no-label" aria-label="Ativar modo escuro"></button>`,
  settingsList: `<div class="nds-stack nds-w-sm" data-spacing="sm">
  @for (pref of preferencias(); track pref.id) {
    <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
      <div class="nds-stack" data-spacing="xs">
        <label ndsLabel [attr.for]="pref.id">{{ pref.titulo }}</label>
        <p class="nds-text-caption nds-text-muted-foreground">{{ pref.descricao }}</p>
      </div>
      <button ndsSwitch [id]="pref.id" [(checked)]="pref.ativo"></button>
    </div>
  }
</div>`,
  inForm: `<form class="nds-stack nds-w-sm" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <!-- name faz o primitivo manter um input escondido irmão: o campo
         participa do submit nativo sem nenhum código de sincronização. -->
    <button ndsSwitch id="newsletter" name="newsletter" value="sim" [checked]="true"></button>
    <label ndsLabel for="newsletter">Aceitar newsletter semanal</label>
  </div>
  <button ndsButton type="submit">Salvar preferências</button>
</form>`,
};

@Component({
  selector: 'nds-switch-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsSwitch, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsSwitch id="dd1-do" [checked]="true"></button>
        <label ndsLabel for="dd1-do">{{ t('demonstration.labels.notifications') }}</label>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsSwitch id="dd1-dont" [checked]="true"></button>
        <label ndsLabel for="dd1-dont">{{ rotuloAmbiguo() }}</label>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsSwitch id="dd2-do"></button>
        <label ndsLabel for="dd2-do">{{ t('demonstration.labels.darkMode') }}</label>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <!-- O "don't" é o texto solto, sem associação clicável. O aria-label
           mantém o nome acessível do controle (axe: aria-toggle-field-name)
           sem alterar o pixel do exemplo. -->
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <button ndsSwitch id="dd2-dont" [attr.aria-label]="t('demonstration.labels.darkMode')"></button>
        <span class="nds-text-body nds-font-medium nds-leading-none">
          {{ t('demonstration.labels.darkMode') }}
        </span>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="var-default"></button>
        <label ndsLabel for="var-default">{{ t('demonstration.labels.notifications') }}</label>
      </div>
    </ng-template>
    <ng-template #tplVarWithDescription>
      <div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
        <div class="nds-stack" data-spacing="xs">
          <label ndsLabel for="var-marketing">{{ t('demonstration.labels.marketing') }}</label>
          <p class="nds-text-caption nds-text-muted-foreground">
            {{ t('demonstration.labels.marketingDesc') }}
          </p>
        </div>
        <button ndsSwitch id="var-marketing"></button>
      </div>
    </ng-template>
    <ng-template #tplVarSm>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="var-sm" size="sm"></button>
        <label ndsLabel for="var-sm">{{ t('demonstration.labels.sm') }}</label>
      </div>
    </ng-template>

    <ng-template #tplCompWithLabel>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsSwitch id="comp-label"></button>
        <label ndsLabel for="comp-label">{{ t('demonstration.labels.notifications') }}</label>
      </div>
    </ng-template>
    <ng-template #tplCompWithoutLabel>
      <!-- Sem rótulo na tela: o nome acessível vem do aria-label. -->
      <button ndsSwitch id="doc-no-label" aria-label="Ativar modo escuro"></button>
    </ng-template>
    <ng-template #tplCompSettingsList>
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="comp-list-a">{{ t('demonstration.labels.marketing') }}</label>
            <p class="nds-text-caption nds-text-muted-foreground">
              {{ t('demonstration.labels.marketingDesc') }}
            </p>
          </div>
          <button ndsSwitch id="comp-list-a" [checked]="true"></button>
        </div>
        <div class="nds-cluster nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
          <div class="nds-stack" data-spacing="xs">
            <label ndsLabel for="comp-list-b">{{ t('demonstration.labels.darkMode') }}</label>
            <p class="nds-text-caption nds-text-muted-foreground">
              {{ t('demonstration.labels.darkModeDesc') }}
            </p>
          </div>
          <button ndsSwitch id="comp-list-b"></button>
        </div>
      </div>
    </ng-template>
    <ng-template #tplCompInForm>
      <form class="nds-stack nds-w-sm" data-spacing="sm">
        <div class="nds-cluster" data-spacing="sm">
          <button ndsSwitch id="comp-form" name="newsletter" value="sim" [checked]="true"></button>
          <label ndsLabel for="comp-form">{{ t('demonstration.labels.notifications') }}</label>
        </div>
      </form>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="switch"
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
              <button
                ndsSwitch
                id="demo-notifications"
                [checked]="demoNotifications()"
                (checkedChange)="aoAlternar('notifications', demoNotifications, $event)"
              ></button>
              <label ndsLabel for="demo-notifications">
                {{ t('demonstration.labels.notifications') }}
              </label>
            </div>

            <div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="demo-marketing">
                  {{ t('demonstration.labels.marketing') }}
                </label>
                <p class="nds-text-caption nds-text-muted-foreground">
                  {{ t('demonstration.labels.marketingDesc') }}
                </p>
              </div>
              <button
                ndsSwitch
                id="demo-marketing"
                [checked]="demoMarketing()"
                (checkedChange)="aoAlternar('marketing_emails', demoMarketing, $event)"
              ></button>
            </div>

            <div class="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-2" data-justify="between">
              <div class="nds-stack" data-spacing="xs">
                <label ndsLabel for="demo-darkmode">
                  {{ t('demonstration.labels.darkMode') }}
                </label>
                <p class="nds-text-caption nds-text-muted-foreground">
                  {{ t('demonstration.labels.darkModeDesc') }}
                </p>
              </div>
              <button
                ndsSwitch
                id="demo-darkmode"
                [checked]="demoDarkMode()"
                (checkedChange)="aoAlternar('dark_mode', demoDarkMode, $event)"
              ></button>
            </div>

            <div class="nds-cluster" data-spacing="sm">
              <button
                ndsSwitch
                id="demo-sm"
                size="sm"
                [checked]="demoSm()"
                (checkedChange)="aoAlternar('compact_switch', demoSm, $event)"
              ></button>
              <label ndsLabel for="demo-sm">{{ t('demonstration.labels.sm') }}</label>
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
          [secondaryCode]="importCodeLabel"
          componentSlug="switch"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="switch"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="switch"
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
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="tokensCode"
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
          componentSlug="switch"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="switch" />

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
export class NdsSwitchDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeLabel = IMPORT_CODE_LABEL;
  protected readonly tokensCode = TOKENS_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // Estado dos exemplos da demonstração. São signals porque o `field_change`
  // sai do handler, não do primitivo: analytics em componente de UI é o que a
  // regra `analytics_in_ui_primitive` proíbe.
  protected readonly demoNotifications = signal(true);
  protected readonly demoMarketing = signal(false);
  protected readonly demoDarkMode = signal(false);
  protected readonly demoSm = signal(false);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarWithDescription = viewChild.required<TemplateRef<unknown>>('tplVarWithDescription');
  private readonly tplVarSm = viewChild.required<TemplateRef<unknown>>('tplVarSm');
  private readonly tplCompWithLabel = viewChild.required<TemplateRef<unknown>>('tplCompWithLabel');
  private readonly tplCompWithoutLabel = viewChild.required<TemplateRef<unknown>>('tplCompWithoutLabel');
  private readonly tplCompSettingsList = viewChild.required<TemplateRef<unknown>>('tplCompSettingsList');
  private readonly tplCompInForm = viewChild.required<TemplateRef<unknown>>('tplCompInForm');

  protected aoAlternar(field: string, target: WritableSignal<boolean>, value: boolean): void {
    target.set(value);
    track('field_change', {
      component: 'switch',
      field_name: field,
      value: String(value),
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  /**
   * O rótulo ambíguo do primeiro "don't" é a primeira palavra do rótulo bom —
   * "Notificações" contra "Receber notificações". Derivar do conteúdo
   * traduzido evita literal em português numa página trilíngue.
   */
  protected readonly rotuloAmbiguo = computed(() => {
    dict();
    const completo = t('demonstration.labels.notifications');
    const palavras = completo.split(' ');
    return palavras.length > 1 ? palavras[1] : completo;
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`anatomy.item${i}`));
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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
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
      items: ['label', 'description', 'panel'].map((k) => ({
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
    const mapa: { key: 'default' | 'withDescription' | 'sm'; tpl: TemplateRef<unknown> }[] = [
      { key: 'default',         tpl: this.tplVarDefault()         },
      { key: 'withDescription', tpl: this.tplVarWithDescription() },
      { key: 'sm',              tpl: this.tplVarSm()              },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: stripHtml(t(`variants.styles.${key}`)),
      code: VARIANT_CODE[key],
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: 'withLabel' | 'withoutLabel' | 'settingsList' | 'inForm'; tpl: TemplateRef<unknown> }[] = [
      { key: 'withLabel',    tpl: this.tplCompWithLabel()    },
      { key: 'withoutLabel', tpl: this.tplCompWithoutLabel() },
      { key: 'settingsList', tpl: this.tplCompSettingsList() },
      { key: 'inForm',       tpl: this.tplCompInForm()       },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code: COMPOSITION_CODE[key],
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
    return ['unchecked', 'checked', 'hover', 'focus', 'disabled', 'invalid'].map((k) => ({
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
    // A linha `onCheckedChange` do conteúdo compartilhado descreve o callback de
    // mudança; aqui ele é o output `checkedChange`, o que também habilita a
    // forma de duas vias `[(checked)]`.
    const line = (key: string, name: string, type?: string) => ({
      name: name,
      type: type ?? t(`props.table.${key}.type`),
      defaultValue: t(`props.table.${key}.default`),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });
    return [
      {
        title: 'NdsSwitch',
        cols,
        items: [
          line('checked', 'checked', 'model<boolean>'),
          line('defaultChecked', 'defaultChecked'),
          line('onCheckedChange', 'checkedChange', 'output<boolean>'),
          line('disabled', 'disabled'),
          line('name', 'name'),
          line('size', 'size'),
          line('id', 'id'),
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
      { token: '--input',       k: 'input'       },
      { token: '--primary',     k: 'primary'     },
      { token: '--background',  k: 'background'  },
      { token: '--ring',        k: 'ring'        },
      { token: '--destructive', k: 'destructive' },
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
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Space', description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = switchTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista — sem o filtro ele
    // apareceria como primeiro item, repetindo o próprio título.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'checkbox',   path: '?path=/docs/ui-checkbox--docs'   },
      { key: 'toggle',     path: '?path=/docs/ui-toggle--docs'     },
      { key: 'radioGroup', path: '?path=/docs/ui-radiogroup--docs' },
      { key: 'form',       path: '?path=/docs/ui-form--docs'       },
    ].map(({ key, path }) => ({
      name: toPlainText(t(`related.items.${key}.name`)),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // item1 e item5 do conteúdo compartilhado descrevem as libs das outras
    // stacks e a factory do Vanilla — citar outra stack pelo nome é justamente
    // o que a convenção proíbe numa página consumida isoladamente.
    return [2, 3, 4].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        event: 'field_change',
        trigger: toPlainText(t('analytics.table.field_change.trigger')),
        payload: toPlainText(t('analytics.table.field_change.payload')),
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
    const d = dict();
    // Neste conteúdo `testes.accessibility.itemN` é uma STRING solta, não a
    // trinca criterion/level/how de outros componentes. As colunas restantes
    // ficam com o nível do resumo (AA) e sem procedimento próprio.
    const lines: string[] = [];
    for (let i = 1; d[`testes.accessibility.item${i}`] !== undefined; i++) {
      lines.push(d[`testes.accessibility.item${i}`]);
    }
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: lines.map((line) => ({
        criterion: toPlainText(line),
        level: 'AA',
        how: '—',
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
        componentSlug: 'switch',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'switch',
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
          component_name: 'switch',
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
