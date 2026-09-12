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
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_ALERT_DIALOG, alertDialogCloseReason } from '@/components/ui/alert-dialog';
import {
  alertDialogDestructiveSource,
  alertDialogNeutralSource,
} from '@/components/ui/alert-dialog.source';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
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

// Os overrides vão POR IDIOMA, nunca em '*': prosa em português servida às
// páginas em inglês e espanhol é o mesmo defeito que o override existe para
// evitar. As três chaves descrevem o que só existe nesta stack:
//
//  · `className` — o texto compartilhado diz "classes extras no elemento", o
//    que vale para header, título, descrição e rodapé, mas não para o painel:
//    ele é portalado de dentro do template do componente, então classe posta em
//    <nds-alert-dialog> cai no HOST, que fica na página. A entrada panelClass é
//    a rota real;
//  · `disabled` — entrada do gatilho, que o conteúdo compartilhado não
//    descreve porque nas outras stacks ela vem do botão composto;
//  · `modalFixed` — a linha `modal` da tabela, que aqui não é entrada: a
//    variante do primitivo a fixa, e expor uma entrada que não muda nada seria
//    mentir na tabela.
const { t, dict } = useTranslation(alertDialogTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className':
      'Nas peças internas, classes extras vão no atributo class do próprio elemento, e o Angular as mescla com a base. Para o painel, que é portalado, use a entrada panelClass da raiz.',
    'props.table.disabled': 'Desabilita o gatilho: o diálogo não abre por ele.',
    'props.table.modalFixed':
      'Não é entrada nesta stack. A modalidade é fixada pelo componente, junto com o papel alertdialog e a recusa de fechar por clique fora.',
  },
  en: {
    'props.table.className':
      'On the inner parts, extra classes go on the element class attribute and Angular merges them with the base. For the panel, which is portalled, use the root panelClass input.',
    'props.table.disabled': 'Disables the trigger: the dialog does not open from it.',
    'props.table.modalFixed':
      'Not an input in this stack. Modality is fixed by the component, together with the alertdialog role and the refusal to close on an outside click.',
  },
  es: {
    'props.table.className':
      'En las piezas internas, las clases extra van en el atributo class del propio elemento y Angular las combina con la base. Para el panel, que es portalizado, usa la entrada panelClass de la raíz.',
    'props.table.disabled': 'Deshabilita el disparador: el diálogo no se abre desde él.',
    'props.table.modalFixed':
      'No es una entrada en este stack. La modalidad la fija el componente, junto con el rol alertdialog y el rechazo a cerrar con un clic fuera.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
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

/**
 * A API que quem compõe USA — entradas, saídas e as peças —, e não a
 * configuração interna do componente. Mesmas linhas da tabela de propriedades,
 * `panelClass` incluída.
 */
const INTERFACE_CODE = `// <nds-alert-dialog> — a raiz: o que se liga no template.
interface NdsAlertDialogApi {
  open: boolean;                  // [open] + (openChange), ou [(open)] — controlado
  defaultOpen: boolean;           // estado inicial, modo não controlado (false)
  panelClass: string;             // classe extra no painel, que é portalado

  openChange: (open: boolean) => void;
  onOpenChange: (change: { open: boolean; reason: string }) => void; // com o motivo
  onOpenChangeComplete: (open: boolean) => void;                     // fim da animação
}

// As peças são diretivas no próprio elemento, sem wrapper:
//   button[ndsAlertDialogTrigger]        [disabled]
//   ng-template[ndsAlertDialogContent]   o painel, instanciado na abertura
//   div[ndsAlertDialogHeader]            div[ndsAlertDialogMedia]
//   h1…h6[ndsAlertDialogTitle]           p[ndsAlertDialogDescription]
//   div[ndsAlertDialogFooter]
//   button[ndsAlertDialogCancel]         button[ndsAlertDialogAction]  (click)
//
// Papel alertdialog, modalidade e a recusa de fechar por clique fora são do
// componente: não há entrada para afrouxá-los.`;

const IMPORT_CODE = `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';`;

/** O gatilho é um `ndsButton`: quem compõe importa os dois e os declara no componente. */
const IMPORT_WITH_TRIGGER_CODE = `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [NDS_ALERT_DIALOG, NdsButton],
})`;

@Component({
  selector: 'nds-alert-dialog-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_ALERT_DIALOG, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Os quatro previews do Do & Don't e os dois das Variantes são o
         componente VIVO, e rastreiam como a demonstração: um clique ali é tão
         real quanto lá. O que muda é o location, que sai da seção onde o
         elemento está — nunca de constante no topo do arquivo. -->

    <!-- Par 1, faça: título nomeia a ação, descrição diz a consequência, a
         ação repete o verbo. -->
    <ng-template #tplDoDont1Do>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('pair1-do', 'docs_do_dont', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              (click)="trackConfirmation('pair1-do', 'docs_do_dont')"
            >
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <!-- Par 1, não faça: título em pergunta e botões genéricos. O texto é o
         exemplo do próprio conteúdo compartilhado; a severidade fica igual à do
         "faça", para que a única diferença entre os dois seja a redação. -->
    <ng-template #tplDoDont1Dont>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('pair1-dont', 'docs_do_dont', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('doDont.pair1.dontExample.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('doDont.pair1.dontExample.description') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('doDont.pair1.dontExample.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              (click)="trackConfirmation('pair1-dont', 'docs_do_dont')"
            >
              {{ t('doDont.pair1.dontExample.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <!-- Par 2, faça: gatilho destrutivo, ação destrutiva. -->
    <ng-template #tplDoDont2Do>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('pair2-do', 'docs_do_dont', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              (click)="trackConfirmation('pair2-do', 'docs_do_dont')"
            >
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <!-- Par 2, não faça: gatilho destrutivo com a ação na variante padrão.
         O Cancelar continua lá: o erro que o par mostra é de severidade, e um
         rodapé sem saída segura seria outro erro, que o componente não admite. -->
    <ng-template #tplDoDont2Dont>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('pair2-dont', 'docs_do_dont', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              (click)="trackConfirmation('pair2-dont', 'docs_do_dont')"
            >
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplVarDestructive>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('destructive', 'docs_variantes', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              (click)="trackConfirmation('destructive', 'docs_variantes')"
            >
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplVarDefault>
      <nds-alert-dialog (onOpenChange)="trackOpenChange('neutral', 'docs_variantes', $event)">
        <button ndsAlertDialogTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.neutralTriggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.neutralTitle') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.neutralDescription') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button
              ndsAlertDialogAction
              ndsButton
              (click)="trackConfirmation('neutral', 'docs_variantes')"
            >
              {{ t('demonstration.labels.neutralAction') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="alert-dialog"
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
          <div class="nds-cluster" data-spacing="md" data-justify="center">
            <nds-alert-dialog (onOpenChange)="trackOpenChange('destructive', 'docs_demo', $event)">
              <button ndsAlertDialogTrigger ndsButton variant="destructive">
                {{ t('demonstration.labels.triggerLabel') }}
              </button>
              <ng-template ndsAlertDialogContent>
                <div ndsAlertDialogHeader>
                  <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
                  <p ndsAlertDialogDescription>{{ t('demonstration.labels.description') }}</p>
                </div>
                <div ndsAlertDialogFooter>
                  <button ndsAlertDialogCancel ndsButton variant="outline">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button
                    ndsAlertDialogAction
                    ndsButton
                    variant="destructive"
                    (click)="trackConfirmation('destructive', 'docs_demo')"
                  >
                    {{ t('demonstration.labels.action') }}
                  </button>
                </div>
              </ng-template>
            </nds-alert-dialog>

            <nds-alert-dialog (onOpenChange)="trackOpenChange('neutral', 'docs_demo', $event)">
              <button ndsAlertDialogTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.neutralTriggerLabel') }}
              </button>
              <ng-template ndsAlertDialogContent>
                <div ndsAlertDialogHeader>
                  <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.neutralTitle') }}</h2>
                  <p ndsAlertDialogDescription>
                    {{ t('demonstration.labels.neutralDescription') }}
                  </p>
                </div>
                <div ndsAlertDialogFooter>
                  <button ndsAlertDialogCancel ndsButton variant="outline">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button ndsAlertDialogAction ndsButton (click)="trackConfirmation('neutral', 'docs_demo')">
                    {{ t('demonstration.labels.neutralAction') }}
                  </button>
                </div>
              </ng-template>
            </nds-alert-dialog>
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
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withTrigger')"
          [secondaryCode]="importWithTriggerCode"
          componentSlug="alert-dialog"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="alert-dialog"
          id="variantes"
          language="ts"
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
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="alert-dialog"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="alert-dialog"
        />

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
export class NdsAlertDialogDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importWithTriggerCode = IMPORT_WITH_TRIGGER_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');

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
      // Ordem numérica: com 10 itens, `item10` viria antes de `item2`.
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
      .map((k) => d[k]);
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
        // O container lê `do`/`dont`; `correct`/`avoid` renderiza duas colunas
        // vazias, e o tsc não pega porque não valida template Angular.
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['title', 'description', 'action', 'cancel'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
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
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  /**
   * O código de cada variante é o MESMO construtor que o painel Code das stories
   * usa — uma cópia só, com o texto do preview ao lado e a guarda do
   * `alert-dialog.source.test.ts`. Chamado dentro do `computed` que lê `dict()`,
   * acompanha a troca de idioma.
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'destructive', tpl: this.tplVarDestructive(), code: alertDialogDestructiveSource() },
      { key: 'default',     tpl: this.tplVarDefault(),     code: alertDialogNeutralSource()     },
    ].map(({ key, tpl, code }) => ({
      name: key,
      description: t(`variants.items.${key}`),
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
    return ['closed', 'open', 'confirmed', 'cancelled', 'controlled'].map((k) => ({
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
    // Nenhuma entrada desta tabela é obrigatória; o rótulo vem do ui.json, e
    // não de um "Não" cravado, porque a página também abre em inglês e espanhol.
    const no = tNav('common.no');
    const line = (name: string, key: string, type: string, defaultValue: string) => ({
      name,
      type,
      defaultValue,
      required: no,
      description: toPlainText(t(`props.table.${key}`)),
    });

    return [
      {
        title: t('props.rootTitle'),
        cols,
        items: [
          line('open', 'open', 'model<boolean>', 'false'),
          line('defaultOpen', 'defaultOpen', 'boolean', 'false'),
          line('openChange', 'onOpenChange', 'output<boolean>', '—'),
          line('panelClass', 'className', 'string', "''"),
          // Não é omissão: é o ponto do componente. A linha existe para dizer
          // que `modal` NÃO é entrada aqui — quem procura por ela na tabela
          // acha o porquê.
          line('modal', 'modalFixed', '—', 'true'),
        ],
      },
      {
        title: t('props.triggerTitle'),
        cols,
        items: [
          line('disabled', 'disabled', 'boolean', 'false'),
          line('class', 'className', 'string', '—'),
        ],
      },
      {
        // O painel é o `ng-template` marcado: o que está dentro dele é o
        // conteúdo, e só é instanciado na abertura.
        title: t('props.contentTitle'),
        cols,
        items: [line('ndsAlertDialogContent', 'children', 'ng-template', '—')],
      },
      {
        title: t('props.actionTitle'),
        cols,
        items: [line('(click)', 'onClick', 'output', '—')],
      },
      {
        title: t('props.cancelTitle'),
        cols,
        items: [line('(click)', 'onClick', 'output', '—')],
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
      { token: '--overlay',                        k: 'overlayBg',             target: '.nds-alert-dialog-overlay' },
      { token: '--background',             k: 'contentBg',             target: '.nds-alert-dialog-content' },
      { token: '--foreground',             k: 'contentForeground',     target: '.nds-alert-dialog-content' },
      { token: '--border',                 k: 'border',                target: '.nds-alert-dialog-content' },
      { token: '--muted-foreground',       k: 'mutedForeground',       target: '.nds-alert-dialog-description' },
      // A ação destrutiva é um Button: quem lê o token é `button.css`, na
      // variante. E `--destructive-foreground` não tem linha porque não tem
      // leitor: a variante destrutiva é soft (fundo suave com o rótulo na
      // PRÓPRIA cor semântica), e nenhuma regra de button.css lê o par
      // `-foreground`. Ver button.css:16-18.
      { token: '--destructive',            k: 'destructive',           target: '.nds-button-destructive' },
      // O painel usa o raio do Card, não o raio de controle.
      { token: '--radius-card',            k: 'radius',                target: '.nds-alert-dialog-content' },
      { token: '--elevation-xl',           k: 'elevation',             target: '.nds-alert-dialog-content' },
      { token: '--muted',                  k: 'mediaBg',               target: '.nds-alert-dialog-media' },
      { token: '--radius-md',              k: 'mediaRadius',           target: '.nds-alert-dialog-media' },
      { token: '--spacing-6',              k: 'padding',               target: '.nds-alert-dialog-content' },
    ].map(({ token, k, target }) => ({
      token,
      value: target,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return numberedItems(d, 'accessibility');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Escape',    description: toPlainText(t('accessibility.keyboard.escape')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onOpen', 'onFocusChange', 'onClose'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'dialog', name: 'Dialog', path: '?path=/docs/components-overlay-dialog--docs' },
      { key: 'sonner', name: 'Sonner', path: '?path=/docs/components-feedback-sonner--docs' },
      { key: 'alert',  name: 'Alert',  path: '?path=/docs/components-feedback-alert--docs'  },
      { key: 'button', name: 'Button', path: '?path=/docs/components-form-button--docs' },
    ].map(({ key, name, path }) => ({ name: name, description: t(`related.${key}`), path }));
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
    return [
      { e: 'open',          trigger: 'openTrigger',          carga: 'openPayload'          },
      { e: 'confirm',       trigger: 'confirmTrigger',       carga: 'confirmPayload'       },
      { e: 'close',         trigger: 'closeTrigger',         carga: 'closePayload'         },
      { e: 'pageView',      trigger: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', trigger: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    trigger: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, trigger, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${trigger}`)),
      payload: toPlainText(t(`analytics.table.${carga}`)),
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

  /**
   * A confirmação de um diálogo VIVO da página — a docs page É o produto
   * consumidor deste design system.
   *
   * `triggerId` vai no `trigger_id`: é a chave estável do exemplo, nunca o
   * texto traduzido (o mesmo evento viraria três valores no GA4, um por
   * idioma). `location` é a SEÇÃO onde o elemento está — `docs_demo`,
   * `docs_variantes`, `docs_do_dont` — e vem do call site: com um valor cravado
   * aqui, o funil somaria três seções numa.
   */
  protected trackConfirmation(triggerId: string, location: string): void {
    // `dialog_confirm` e não um evento novo: é o que a tabela de analytics do
    // conteúdo compartilhado documenta, e ele já existe tipado em AnalyticsEvents.
    // Levanta a bandeira ANTES do fechamento: o `(click)` de quem consome roda
    // antes do listener de `host` da diretiva de fechar (armadilha 10 do
    // CLAUDE.md desta stack), igual ao Dialog.
    this.confirmed = true;
    track('dialog_confirm', { component: 'alert-dialog', trigger_id: triggerId, location });
  }

  /**
   * `dialog_open` e `dialog_close` de todo diálogo vivo da página, com o mesmo
   * `trigger_id` e `location` da confirmação.
   *
   * O motivo segue o vocabulário do design system (`18-overlay.md` §Analytics),
   * e quem o traduz é `alertDialogCloseReason`, ao lado do primitivo: a página
   * só sabe que a pessoa confirmou — a palavra é do componente. A ação que
   * confirma e o Cancelar são as duas partes de fechar, e o radix-ng entrega
   * `close-press` para as duas; sem a bandeira, "confirmou" chegaria ao
   * relatório como "apertou o botão de fechar". O Escape chega como
   * `escape-key` e sai como `escape`. Clique fora não fecha este componente,
   * então `overlay` não existe no vocabulário dele.
   */
  protected trackOpenChange(triggerId: string, location: string, event: RdxDialogOpenChange): void {
    if (event.open) {
      this.confirmed = false;
      track('dialog_open', { component: 'alert-dialog', trigger_id: triggerId, location });
      return;
    }
    const reason = alertDialogCloseReason(event.reason, { confirmed: this.confirmed });
    this.confirmed = false;
    track('dialog_close', { component: 'alert-dialog', trigger_id: triggerId, reason, location });
  }

  private confirmed = false;

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'alert-dialog',
      });
      track('docs_page_view', {
        component_name: 'alert-dialog',
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
          component_name: 'alert-dialog',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** Rótulo de navegação, com queda para o ui.json quando o slug não o declara. */
function navLabel(key: string): string {
  const doComponente = t(key);
  return doComponente === key ? tNav(key) : doComponente;
}

/** Itens `base.itemN` na ordem numérica, quantos existirem. */
function numberedItems(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
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
