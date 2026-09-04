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
import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
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

const { t, dict } = useTranslation(alertDialogTranslations as Record<string, unknown>, {
  '*': {
    // O conteúdo descreve props na API do React. Aqui `asChild` não existe — a
    // composição é diretiva de atributo no próprio elemento — e `className`
    // não é input: o Angular mescla o `class` escrito no elemento.
    'props.table.asChild':
      'Não existe nesta stack: a diretiva vai no próprio elemento, sem wrapper.',
    'props.table.children': 'Conteúdo projetado — em Angular, o que está entre as tags.',
  },
  // Este par sai do '*' e vai por idioma: prosa em português servida às páginas
  // em inglês e espanhol é o mesmo defeito que o override existe para evitar.
  //
  // E o texto anterior era FALSO para o painel. Ele dizia "classes extras vão
  // no atributo class do elemento" — o que vale para header, título, descrição
  // e rodapé, mas não para o painel: ele é portalado de dentro do template do
  // componente, então classe posta em <nds-alert-dialog> cai no HOST, que fica
  // na página. O input panelClass é a rota real, e existe desde esta revisão.
  'pt-BR': {
    'props.table.className':
      'Nas peças internas, classes extras vão no atributo class do próprio elemento, e o Angular as mescla com a base. Para o painel, que é portalado, use a entrada panelClass da raiz.',
  },
  en: {
    'props.table.className':
      'On the inner parts, extra classes go on the element class attribute and Angular merges them with the base. For the panel, which is portalled, use the root panelClass input.',
  },
  es: {
    'props.table.className':
      'En las piezas internas, las clases extra van en el atributo class del propio elemento y Angular las combina con la base. Para el panel, que es portalizado, usa la entrada panelClass de la raíz.',
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

const INTERFACE_CODE = `// O que separa este componente do Dialog não é input: é PERFIL,
// fixado na construção pela variante do primitivo. Ninguém que consome
// consegue afrouxar por engano.
@Component({
  selector: 'nds-alert-dialog',
  providers: [
    provideRdxDialogVariant({
      role: 'alertdialog',                    // leitor lê a descrição junto do título
      forceModal: true,                       // foco preso, rolagem travada
      forcePointerDismissalDisabled: true,    // clique fora não fecha; Escape ainda fecha
    }),
  ],
  hostDirectives: [
    { directive: RdxDialogRoot,
      inputs: ['open', 'defaultOpen'],        // sem \`modal\`: a variante o fixa
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsAlertDialog {}`;

const ANATOMY_CODE = `<nds-alert-dialog>
  <button ndsAlertDialogTrigger ndsButton variant="destructive">
    Excluir conta
  </button>

  <!-- O painel é ng-template, não elemento projetado: nó projetado pertence
       à view de quem consome, e o portal removeria o DOM sem destruir as
       diretivas — o foco nunca voltaria ao gatilho. -->
  <ng-template ndsAlertDialogContent>
    <div ndsAlertDialogHeader>
      <h2 ndsAlertDialogTitle>Excluir conta</h2>
      <p ndsAlertDialogDescription>
        Todos os seus dados serão removidos permanentemente.
      </p>
    </div>

    <div ndsAlertDialogFooter>
      <!-- Cancelar vem ANTES no DOM: é onde o foco pousa ao abrir. -->
      <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
      <button ndsAlertDialogAction ndsButton variant="destructive" (click)="excluir()">
        Excluir
      </button>
    </div>
  </ng-template>
</nds-alert-dialog>`;

const CUSTOMIZATION_CODE = `/* O painel e o overlay leem os tokens do tema —
   personalizar é redefinir o token, não sobrescrever a regra. */
.tema-critico {
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 98%;
}`;

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
    <ng-template #tplDoDont1Do>
      <nds-alert-dialog>
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
            <button ndsAlertDialogAction ndsButton variant="destructive">
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <nds-alert-dialog>
        <button ndsAlertDialogTrigger ndsButton variant="destructive">
          {{ t('demonstration.labels.triggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.title') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.title') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Não</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Sim</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nds-alert-dialog>
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
            <button ndsAlertDialogAction ndsButton>
              {{ t('demonstration.labels.neutralAction') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <nds-alert-dialog>
        <button ndsAlertDialogTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.neutralTriggerLabel') }}
        </button>
        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ t('demonstration.labels.neutralTitle') }}</h2>
            <p ndsAlertDialogDescription>{{ t('demonstration.labels.neutralDescription') }}</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogAction ndsButton variant="destructive">
              {{ t('demonstration.labels.neutralAction') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplVarDestructive>
      <nds-alert-dialog>
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
            <button ndsAlertDialogAction ndsButton variant="destructive">
              {{ t('demonstration.labels.action') }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    </ng-template>

    <ng-template #tplVarDefault>
      <nds-alert-dialog>
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
            <button ndsAlertDialogAction ndsButton>
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
          <div class="nds-cluster" data-spacing="md">
            <nds-alert-dialog>
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
                    (click)="registrarConfirmacao()"
                  >
                    {{ t('demonstration.labels.action') }}
                  </button>
                </div>
              </ng-template>
            </nds-alert-dialog>

            <nds-alert-dialog>
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
                  <button ndsAlertDialogAction ndsButton (click)="registrarConfirmacao()">
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
          [title]="tNav('nav.import')"
          [code]="importCode"
          componentSlug="alert-dialog"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="alert-dialog"
          id="variantes"
          language="html"
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
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';`;

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

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'destructive', tpl: this.tplVarDestructive() },
      { key: 'default',     tpl: this.tplVarDefault()     },
    ].map(({ key, tpl }) => ({
      name: key,
      description: t(`variants.items.${key}`),
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
    const not = tNav('common.no');
    const line = (name: string, key: string, type: string, padrao: string) => ({
      name,
      type: type,
      defaultValue: padrao,
      required: not,
      description: toPlainText(t(`props.table.${key}`)),
    });

    return [
      {
        title: t('props.rootTitle'),
        cols,
        items: [
          line('open', 'open', 'model<boolean>', '—'),
          line('defaultOpen', 'defaultOpen', 'boolean', 'false'),
          line('openChange', 'onOpenChange', 'output<boolean>', '—'),
          {
            name: 'modal',
            type: '—',
            defaultValue: 'true',
            required: not,
            // Não é omissão: é o ponto do componente. Expor um input que a
            // variante ignora seria mentir na tabela.
            description:
              'Não é input aqui. A modalidade é fixada pela variante do componente, junto com o papel alertdialog e a recusa de fechar por clique fora.',
          },
        ],
      },
      {
        title: t('props.triggerTitle'),
        cols,
        items: [
          line('disabled', 'asChild', 'boolean', 'false'),
          line('class', 'className', 'string', '—'),
        ],
      },
      {
        title: t('props.contentTitle'),
        cols,
        items: [line('(conteúdo)', 'children', 'ng-template', '—')],
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
      { token: '--elevation-lg',           k: 'elevation',             target: '.nds-alert-dialog-content' },
      { token: '--muted',                  k: 'mediaBg',               target: '.nds-alert-dialog-media' },
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
      { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape')) },
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
   * A demonstração dispara evento de produto de verdade — a docs page É o
   * produto consumidor deste design system.
   */
  protected registrarConfirmacao(): void {
    // `dialog_confirm` e não um evento novo: é o que a tabela de analytics do
    // conteúdo compartilhado documenta, e ele já existe tipado em AnalyticsEvents.
    track('dialog_confirm', { component: 'alert-dialog', action: 'confirm' });
  }

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
