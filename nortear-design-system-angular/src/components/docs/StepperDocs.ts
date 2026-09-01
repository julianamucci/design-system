import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsStepper,
  NdsStepperItem,
  NdsStepperTrigger,
  NdsStepperIndicator,
  NdsStepperTitle,
  NdsStepperDescription,
  NdsStepperSeparator,
} from '@/components/ui/stepper';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import stepperTranslations from '@shared/content/stepper/translations.json';

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

// Overrides: só texto DESCRITIVO e RÓTULO que muda (ou nasce) nesta stack.
// Nenhum snippet `*Code` entra aqui — snippet em override fica preso a uma
// stack e some do conteúdo compartilhado; o que diverge vira const neste
// arquivo, com a divergência reportada.
//
// `props.table.class.description` — aqui não existe prop de classe.
// `props.table.ariaLabel.description` — o nome do fluxo é ATRIBUTO nativo, não
//   input; a diferença muda o que a pessoa escreve.
// `props.custom.description` — input que o conteúdo compartilhado não descreve.
// `notes.item6` — a divergência desta stack.
const { t, dict } = useTranslation(stepperTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'props.table.ariaLabel.description':
      'Nome acessível do fluxo, escrito como atributo nativo no elemento da raiz. Sem ele o leitor de tela anuncia só uma lista.',
    'props.custom.description':
      'Troca o número (e a marca de verificação) por conteúdo próprio dentro do indicador.',
    'notes.item6':
      '<strong>Sem biblioteca de comportamento</strong> — o componente é escrito com elementos nativos e estado derivado por sinais: a etapa injeta a raiz e compara o próprio número com o valor do fluxo. Não há foco a governar nem ARIA a gerar que a marcação nativa já não anuncie.',
  },
  en: {
    'props.table.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'props.table.ariaLabel.description':
      'Accessible name of the flow, written as a native attribute on the root element. Without it the screen reader announces just a list.',
    'props.custom.description':
      'Replaces the number (and the check mark) with your own content inside the indicator.',
    'notes.item6':
      '<strong>No behaviour library</strong> — the component is written with native elements and state derived from signals: the step injects the root and compares its own number with the flow value. There is no focus to govern and no ARIA to generate that the native markup does not already announce.',
  },
  es: {
    'props.table.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'props.table.ariaLabel.description':
      'Nombre accesible del flujo, escrito como atributo nativo en el elemento raíz. Sin él el lector de pantalla anuncia solo una lista.',
    'props.custom.description':
      'Sustituye el número (y la marca de verificación) por contenido propio dentro del indicador.',
    'notes.item6':
      '<strong>Sin biblioteca de comportamiento</strong> — el componente se escribe con elementos nativos y estado derivado de señales: el paso inyecta la raíz y compara su propio número con el valor del flujo. No hay foco que gobernar ni ARIA que generar que el marcado nativo no anuncie ya.',
  },
});

// Sem `variantes`: o Stepper não tem forma alternativa — o que ele tem são
// ESTADOS derivados do valor do fluxo, e esses vivem na seção Estados. Criar a
// seção só para preencher a lista duplicaria a mesma tabela em outro formato.
const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'composicoes', 'estados', 'propriedades', 'tokens',
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

const IMPORT_CODE = `import {
  NdsStepper,
  NdsStepperItem,
  NdsStepperTrigger,
  NdsStepperIndicator,
  NdsStepperTitle,
  NdsStepperDescription,
  NdsStepperSeparator,
} from '@/components/ui/stepper';

// Ou o barril com as sete partes, para o \`imports\` de quem compõe:
import { NDS_STEPPER } from '@/components/ui/stepper';`;

const INTERFACE_CODE = `// <ol ndsStepper> › <li ndsStepperItem> › <button ndsStepperTrigger>
@Directive({ selector: 'ol[ndsStepper]' })
export class NdsStepper {
  readonly value = input(1, { transform: numberAttribute });
  readonly labels = input<StepperLabels>({});
  readonly stepSelect = output<number>();
}

@Directive({ selector: 'li[ndsStepperItem]' })
export class NdsStepperItem {
  readonly step = input.required<number, unknown>({ transform: numberAttribute });
  readonly completed = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly state = computed<StepperState>(() => /* completed | active | inactive */);
}

@Component({ selector: 'button[ndsStepperTrigger]' })
export class NdsStepperTrigger {}

@Component({ selector: 'span[ndsStepperIndicator]' })
export class NdsStepperIndicator {
  readonly custom = input(false, { transform: booleanAttribute });
}

@Directive({ selector: 'span[ndsStepperTitle]' })
export class NdsStepperTitle {}

@Directive({ selector: 'span[ndsStepperDescription]' })
export class NdsStepperDescription {}

@Directive({ selector: 'div[ndsStepperSeparator]' })
export class NdsStepperSeparator {}`;

/** Etapas da demonstração — base estável de step/total no analytics. */
const DEMO_STEPS = [
  { step: 1, titleKey: 'account', hintKey: 'accountHint' },
  { step: 2, titleKey: 'address', hintKey: 'addressHint' },
  { step: 3, titleKey: 'payment', hintKey: 'paymentHint' },
  { step: 4, titleKey: 'review',  hintKey: 'reviewHint'  },
] as const;

@Component({
  selector: 'nds-stepper-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsStepper, NdsStepperItem, NdsStepperTrigger, NdsStepperIndicator,
    NdsStepperTitle, NdsStepperDescription, NdsStepperSeparator, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Do & Don't ─────────────────────────────────────────────────── -->

    <ng-template #tplDoDont1Do>
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
        <li ndsStepperItem [step]="1">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <!-- Sem rótulos de estado, e com o indicador preso ao número: a etapa
           concluída passa a diferir da futura só pela cor do círculo. -->
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')">
        <li ndsStepperItem [step]="1">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator custom>1</span>
            <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator custom>2</span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
        <li ndsStepperItem [step]="1">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack" data-spacing="sm">
        <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
          <li ndsStepperItem [step]="1">
            <button ndsStepperTrigger>
              <span ndsStepperIndicator></span>
              <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
            </button>
            <div ndsStepperSeparator></div>
          </li>
          <li ndsStepperItem [step]="2">
            <button ndsStepperTrigger>
              <span ndsStepperIndicator></span>
              <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
            </button>
          </li>
        </ol>
        <!-- A região viva se reanuncia a cada avanço e atropela a leitura do
             resto da tela. Quem anuncia o avanço é o painel que trocou. -->
        <p class="nds-text-caption nds-text-muted-foreground" aria-live="polite">
          {{ t('demonstration.labels.current') }}
        </p>
      </div>
    </ng-template>

    <ng-template #tplDoDont3Do>
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="3" [disabled]="true">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.payment') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>
    <ng-template #tplDoDont3Dont>
      <!-- A terceira etapa continua focável e não leva a lugar nenhum: uma
           parada de foco que gasta o tempo de quem navega por teclado. -->
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="3">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.payment') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>

    <!-- ── Composições ────────────────────────────────────────────────── -->

    <ng-template #tplCompWizard>
      <div class="nds-stack nds-w-full" data-spacing="md">
        <ol
          ndsStepper
          [value]="wizardStep()"
          [attr.aria-label]="t('demonstration.labels.flow')"
          [labels]="demoLabels()"
          (stepSelect)="wizardStep.set($event)"
        >
          <li ndsStepperItem [step]="1">
            <button ndsStepperTrigger>
              <span ndsStepperIndicator></span>
              <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
            </button>
            <div ndsStepperSeparator></div>
          </li>
          <li ndsStepperItem [step]="2">
            <button ndsStepperTrigger>
              <span ndsStepperIndicator></span>
              <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
            </button>
            <div ndsStepperSeparator></div>
          </li>
          <li ndsStepperItem [step]="3">
            <button ndsStepperTrigger>
              <span ndsStepperIndicator></span>
              <span ndsStepperTitle>{{ t('demonstration.labels.payment') }}</span>
            </button>
          </li>
        </ol>

        <div class="nds-cluster" data-spacing="md">
          <button
            ndsButton
            type="button"
            variant="outline"
            [disabled]="wizardStep() === 1"
            (click)="wizardStep.set(wizardStep() - 1)"
          >
            {{ t('demonstration.labels.back') }}
          </button>
          <button
            ndsButton
            type="button"
            [disabled]="wizardStep() === 3"
            (click)="wizardStep.set(wizardStep() + 1)"
          >
            {{ t('demonstration.labels.next') }}
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompDescriptions>
      <ol ndsStepper [value]="2" [attr.aria-label]="t('demonstration.labels.flow')" [labels]="demoLabels()">
        <li ndsStepperItem [step]="1">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
            <span ndsStepperDescription>{{ t('demonstration.labels.accountHint') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
            <span ndsStepperDescription>{{ t('demonstration.labels.addressHint') }}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="3">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>{{ t('demonstration.labels.payment') }}</span>
            <span ndsStepperDescription>{{ t('demonstration.labels.paymentHint') }}</span>
          </button>
        </li>
      </ol>
    </ng-template>

    <!-- ── Página ─────────────────────────────────────────────────────── -->

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="stepper"
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
            <ol
              ndsStepper
              [value]="demoStep()"
              [attr.aria-label]="t('demonstration.labels.flow')"
              [labels]="demoLabels()"
              (stepSelect)="irParaEtapa($event)"
            >
              <li ndsStepperItem [step]="1">
                <button ndsStepperTrigger>
                  <span ndsStepperIndicator></span>
                  <span ndsStepperTitle>{{ t('demonstration.labels.account') }}</span>
                  <span ndsStepperDescription>{{ t('demonstration.labels.accountHint') }}</span>
                </button>
                <div ndsStepperSeparator></div>
              </li>
              <li ndsStepperItem [step]="2">
                <button ndsStepperTrigger>
                  <span ndsStepperIndicator></span>
                  <span ndsStepperTitle>{{ t('demonstration.labels.address') }}</span>
                  <span ndsStepperDescription>{{ t('demonstration.labels.addressHint') }}</span>
                </button>
                <div ndsStepperSeparator></div>
              </li>
              <li ndsStepperItem [step]="3">
                <button ndsStepperTrigger>
                  <span ndsStepperIndicator></span>
                  <span ndsStepperTitle>{{ t('demonstration.labels.payment') }}</span>
                  <span ndsStepperDescription>{{ t('demonstration.labels.paymentHint') }}</span>
                </button>
                <div ndsStepperSeparator></div>
              </li>
              <li ndsStepperItem [step]="4">
                <button ndsStepperTrigger>
                  <span ndsStepperIndicator></span>
                  <span ndsStepperTitle>{{ t('demonstration.labels.review') }}</span>
                  <span ndsStepperDescription>{{ t('demonstration.labels.reviewHint') }}</span>
                </button>
              </li>
            </ol>

            <p class="nds-text-body">{{ demoHint() }}</p>

            <div class="nds-cluster" data-spacing="md">
              <button
                ndsButton
                type="button"
                variant="outline"
                [disabled]="demoStep() === 1"
                (click)="irParaEtapa(demoStep() - 1)"
              >
                {{ t('demonstration.labels.back') }}
              </button>
              <button
                ndsButton
                type="button"
                [disabled]="demoStep() === demoTotal"
                (click)="irParaEtapa(demoStep() + 1)"
              >
                {{ t('demonstration.labels.next') }}
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
          componentSlug="stepper"
          language="ts"
        />

        <nds-docs-compositions
          [title]="t('variants.title')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="stepper"
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
          componentSlug="stepper"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="stepper" />

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
export class NdsStepperDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly demoTotal = DEMO_STEPS.length;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Etapa atual da demonstração. */
  protected readonly demoStep = signal(2);

  /** Etapa atual do cartão de composição — estado próprio, para não empurrar
   *  a demonstração quando alguém brinca com o exemplo. */
  protected readonly wizardStep = signal(1);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');
  private readonly tplCompWizard = viewChild.required<TemplateRef<unknown>>('tplCompWizard');
  private readonly tplCompDescriptions =
    viewChild.required<TemplateRef<unknown>>('tplCompDescriptions');

  /**
   * Palavras de estado do fluxo, na raiz.
   *
   * Traduzidas, e por isso num `computed` que lê `dict()`: sem essa leitura a
   * página monta certa e CONGELA no idioma inicial.
   */
  protected readonly demoLabels = computed(() => {
    dict();
    return {
      completed: t('demonstration.labels.completed'),
      current: t('demonstration.labels.current'),
    };
  });

  protected readonly demoHint = computed(() => {
    dict();
    const atual = DEMO_STEPS.find((e) => e.step === this.demoStep());
    return atual ? t(`demonstration.labels.${atual.hintKey}`) : '';
  });

  /**
   * A demonstração é produto: quem seleciona uma etapa aqui dispara o mesmo
   * evento que o componente dispararia num app. O payload leva o NÚMERO da
   * etapa, nunca o título traduzido — o título partiria um evento em três no
   * GA4.
   */
  protected irParaEtapa(etapa: number): void {
    const destino = Math.min(Math.max(etapa, 1), this.demoTotal);
    this.demoStep.set(destino);
    track('step_change', {
      component: 'stepper',
      step: destino,
      total: this.demoTotal,
      location: 'docs-demonstration',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`anatomy.item${i}`));
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
      items: ['title', 'description', 'stateLabel', 'flowName'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  // O container renderiza cada item por `innerHTML` sanitizado, então o
  // `<code>` do conteúdo compartilhado chega como marcação — passar por
  // `toPlainText` aqui imprimiria a tag literal.
  protected readonly usageDo = computed(() => {
    dict();
    return {
      title: t('usage.do.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)),
    };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)),
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
      [this.tplDoDont3Do(), this.tplDoDont3Dont()],
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

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'wizard',           trackId: 'wizard',            tpl: this.tplCompWizard()       },
      { key: 'withDescriptions', trackId: 'with-descriptions', tpl: this.tplCompDescriptions() },
    ].map(({ key, trackId, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      trackId,
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
    return ['inactive', 'active', 'completed', 'disabled'].map((k) => ({
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
    const line = (name: string, key: string, type?: string) => ({
      name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });
    return [
      {
        title: 'NdsStepper',
        cols,
        items: [
          line('value', 'value'),
          line('aria-label', 'ariaLabel'),
          line('labels', 'labels'),
          line('stepSelect', 'onStepSelect', 'output<number>'),
          line('class', 'class'),
        ],
      },
      {
        title: 'NdsStepperItem',
        cols,
        items: [
          line('step', 'step'),
          line('completed', 'completed'),
          line('disabled', 'disabled'),
          line('class', 'class'),
        ],
      },
      {
        title: 'NdsStepperIndicator',
        cols,
        items: [
          {
            name: 'custom',
            type: 'boolean',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.custom.description')),
          },
          line('class', 'class'),
        ],
      },
    ].map((table) => ({
      ...table,
      items: table.items.map((item) => ({ ...item, required: item.required || nao })),
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
    // Token real → chave do conteúdo. A coluna do meio mostra a classe `.nds-*`
    // que o conteúdo já declara, porque é ela que existe no CSS deste sistema.
    return [
      { token: '--spacing-2',            k: 'gap'                },
      { token: '--spacing-2',            k: 'itemGap'            },
      { token: '--spacing-1',            k: 'triggerGap'         },
      { token: '--radius-md',            k: 'triggerRadius'      },
      { token: '--ring',                 k: 'ring'               },
      { token: '--background',           k: 'ringHalo'           },
      { token: '--spacing-8',            k: 'indicatorSize'      },
      { token: '--radius-full',          k: 'indicatorRadius'    },
      { token: '--muted',                k: 'indicatorBg'        },
      { token: '--muted-foreground',     k: 'indicatorFg'        },
      { token: '--primary',              k: 'activeBg'           },
      { token: '--primary-foreground',   k: 'activeFg'           },
      { token: '--accent',               k: 'completedBg'        },
      { token: '--accent-foreground',    k: 'completedFg'        },
      { token: '--text-control-lg',      k: 'titleSize'          },
      { token: '--font-weight-semi-bold', k: 'titleWeight'       },
      { token: '--text-control-sm',      k: 'descriptionSize'    },
      { token: '--muted-foreground',     k: 'descriptionColor'   },
      { token: '--border',               k: 'separator'          },
      { token: '--spacing-8',            k: 'separatorLength'    },
      { token: '--accent',               k: 'separatorCompleted' },
      { token: '--muted',                k: 'separatorDisabled'  },
    ].map(({ token, k }) => ({
      token,
      value: toPlainText(t(`tokens.table.${k}.class`)),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = stepperTranslations as unknown as Record<
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
      { key: 'tabs',       path: '?path=/docs/primitives-navigation-tabs--docs'       },
      { key: 'breadcrumb', path: '?path=/docs/primitives-navigation-breadcrumb--docs' },
      { key: 'progress',   path: '?path=/docs/primitives-feedback-progress--docs'     },
      { key: 'form',       path: '?path=/docs/primitives-form-form--docs'             },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // 1–5 vêm do conteúdo compartilhado; o 6 é o override desta stack.
    return [1, 2, 3, 4, 5, 6].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
        event: 'step_change',
        trigger: toPlainText(t('analytics.table.step_change.trigger')),
        payload: toPlainText(t('analytics.table.step_change.payload')),
      },
      {
        event: 'docs_section_viewed',
        trigger: toPlainText(t('analytics.table.docs_section_viewed.trigger')),
        payload: toPlainText(t('analytics.table.docs_section_viewed.payload')),
      },
      {
        event: 'docs_page_view',
        trigger: tNav('common.pageMount'),
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
    // radio-group e do separator.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
        componentSlug: 'stepper',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/navigation' },
          { name: t('title') },
        ],
      });
      track('docs_page_view', {
        component_name: 'stepper',
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
          component_name: 'stepper',
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
