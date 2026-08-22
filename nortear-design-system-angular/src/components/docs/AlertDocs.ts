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
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertAction,
  NdsAlertIcon,
} from '@/components/ui/alert';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import alertTranslations from '@shared/content/alert/translations.json';

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

const { t, dict } = useTranslation(alertTranslations as Record<string, unknown>, {
  // Overrides só de nome de prop e rótulo — nunca de snippet `*Code`, que
  // ficaria preso neste stack e invisível para o conteúdo compartilhado.
  'pt-BR': {
    'props.table.className':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com as do design system.',
    'props.table.children':
      'Conteúdo do Alert: ícone, título e descrição, escritos dentro do elemento.',
    'props.table.onDismiss':
      'Output de fechamento — emitido uma única vez, depois que o alert sai da tela.',
    'props.table.titleAs':
      'O nível do heading é o próprio elemento (h1–h6) em que a diretiva é aplicada. Escolha o que preserva a hierarquia da página onde o Alert está — um nível fixo pula degraus sob seções h2/h3 e falha o axe (heading-order).',
  },
  en: {
    'props.table.className':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the design system ones.',
    'props.table.children':
      'Alert content: icon, title, and description, written inside the element.',
    'props.table.onDismiss':
      'Dismiss output — emitted exactly once, after the alert leaves the screen.',
    'props.table.titleAs':
      'The heading level is the element itself (h1–h6) the directive is applied to. Pick the one that preserves the hierarchy of the page hosting the Alert — a fixed level skips levels under h2/h3 sections and fails axe (heading-order).',
  },
  es: {
    'props.table.className':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con las del design system.',
    'props.table.children':
      'Contenido del Alert: ícono, título y descripción, escritos dentro del elemento.',
    'props.table.onDismiss':
      'Output de cierre — emitido una única vez, después de que el alert sale de la pantalla.',
    'props.table.titleAs':
      'El nivel del heading es el propio elemento (h1–h6) donde se aplica la directiva. Elige el que preserva la jerarquía de la página donde está el Alert — un nivel fijo salta niveles bajo secciones h2/h3 y falla el axe (heading-order).',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// O `nav` do conteúdo compartilhado do alert não tem a chave `compositions`
// (ele chama a seção de "Configurações"); ela vem do ui.json, como no React.
const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string; fromUi?: boolean }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'composicoes',  labelKey: 'nav.compositions', fromUi: true },
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

// ─── Snippets ────────────────────────────────────────────────────────────────
//
// Markup de template Angular, que é o que se copia. O import fica separado do
// uso: quem já tem o componente importado só quer o trecho de baixo.

const IMPORT_BASICO = `import {
  NdsAlert, NdsAlertTitle, NdsAlertDescription,
} from '@/components/ui/alert';`;

const IMPORT_WITH_ICON = `import {
  NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon,
} from '@/components/ui/alert';`;

const CODE_DEFAULT = `<div ndsAlert>
  <svg ndsAlertIcon kind="info"></svg>
  <h5 ndsAlertTitle>Atenção</h5>
  <section ndsAlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </section>
</div>`;

const CODE_DESTRUCTIVE = `<div ndsAlert variant="destructive">
  <svg ndsAlertIcon kind="error"></svg>
  <h5 ndsAlertTitle>Erro ao salvar</h5>
  <section ndsAlertDescription>
    Não foi possível salvar. Verifique sua conexão e tente novamente.
  </section>
</div>`;

const CODE_SUCCESS = `<div ndsAlert variant="success">
  <svg ndsAlertIcon kind="success"></svg>
  <h5 ndsAlertTitle>Perfil atualizado</h5>
  <section ndsAlertDescription>
    Suas informações foram salvas com sucesso.
  </section>
</div>`;

const CODE_WARNING = `<div ndsAlert variant="warning">
  <svg ndsAlertIcon kind="warning"></svg>
  <h5 ndsAlertTitle>Assinatura expirando</h5>
  <section ndsAlertDescription>
    Sua assinatura expira em 3 dias. Renove para evitar interrupções.
  </section>
</div>`;

const CODE_INFO = `<div ndsAlert variant="info">
  <svg ndsAlertIcon kind="info"></svg>
  <h5 ndsAlertTitle>Dica</h5>
  <section ndsAlertDescription>
    Você pode alterar o tema em Configurações a qualquer momento.
  </section>
</div>`;

const CODE_DISMISSIBLE = `<div ndsAlert dismissible (dismiss)="aoFechar()">
  <svg ndsAlertIcon kind="success"></svg>
  <h5 ndsAlertTitle>Perfil atualizado</h5>
  <section ndsAlertDescription>
    Suas informações foram salvas com sucesso.
  </section>
</div>`;

const CODE_NO_TITLE = `<div ndsAlert>
  <svg ndsAlertIcon kind="info"></svg>
  <section ndsAlertDescription>
    Suas alterações serão aplicadas na próxima sessão.
  </section>
</div>`;

const CODE_WITH_ICON = `<div ndsAlert>
  <svg ndsAlertIcon kind="info"></svg>
  <h5 ndsAlertTitle>Informação</h5>
  <section ndsAlertDescription>
    Ícone SVG posicionado automaticamente pelo CSS do componente.
  </section>
</div>`;

const CODE_WITH_ACTION = `<div ndsAlert>
  <svg ndsAlertIcon kind="info"></svg>
  <h5 ndsAlertTitle>Sessão expira em 5 minutos</h5>
  <section ndsAlertDescription>
    Salve seu trabalho para não perder as alterações.
  </section>
  <div ndsAlertAction>
    <button ndsButton variant="outline" size="sm">Salvar agora</button>
  </div>
</div>`;

const INTERFACE_CODE = `// <div ndsAlert> — componente de atributo no elemento nativo
@Component({ selector: 'div[ndsAlert]' })
export class NdsAlert {
  readonly variant = input<AlertVariant>('default');       // default | destructive | success | warning | info
  readonly role = input<AlertRole>('alert');               // alert | status | note
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissLabel = input<string>('Fechar alerta');
  readonly dismiss = output<void>();                       // (dismiss)="…"
}

// <h1..h6 ndsAlertTitle> · <section ndsAlertDescription> · <div ndsAlertAction>
// Diretivas sem input: aplicam classe e data-slot ao elemento que você escreveu.
// O nível do heading do título é o próprio elemento.

// <svg ndsAlertIcon kind="info | error | success | warning">
export class NdsAlertIcon {
  readonly kind = input.required<AlertIconKind>();
}

// class e o conteúdo são nativos dos elementos — o Angular mescla a classe.`;

type ChaveDeVariante = 'default' | 'destructive' | 'success' | 'warning' | 'info';

@Component({
  selector: 'nds-alert-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertAction, NdsAlertIcon,
    NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews do Do & Don't ────────────────────────────────────────────
         Nível de heading h3: a seção abre em h2 e não tem h3 próprio, então h3
         aqui não pula degrau (axe heading-order). -->
    <ng-template #tplDoDont1Do>
      <div ndsAlert class="nds-w-full">
        <svg ndsAlertIcon kind="error"></svg>
        <h3 ndsAlertTitle>{{ t('demonstration.labels.errorTitle') }}</h3>
        <section ndsAlertDescription>{{ t('demonstration.labels.errorDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsAlert class="nds-w-full">
        <section ndsAlertDescription>{{ t('demonstration.labels.successTitle') }}</section>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsAlert variant="destructive" class="nds-w-full">
        <svg ndsAlertIcon kind="error"></svg>
        <h3 ndsAlertTitle>{{ t('demonstration.labels.errorTitle') }}</h3>
        <section ndsAlertDescription>{{ t('demonstration.labels.errorDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsAlert variant="destructive" class="nds-w-full">
        <h3 ndsAlertTitle>{{ t('demonstration.labels.errorTitle') }}</h3>
        <section ndsAlertDescription>{{ t('demonstration.labels.errorDesc') }}</section>
      </div>
    </ng-template>

    <!-- ── Previews das variantes ────────────────────────────────────────────
         h4 aqui: o card da seção já abre um h3 com o nome da variante. -->
    <ng-template #tplVarDefault>
      <div ndsAlert class="nds-w-full">
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.infoTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarDestructive>
      <div ndsAlert variant="destructive" class="nds-w-full">
        <svg ndsAlertIcon kind="error"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.errorTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.errorDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarSuccess>
      <div ndsAlert variant="success" class="nds-w-full">
        <svg ndsAlertIcon kind="success"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.successTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.successDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarWarning>
      <div ndsAlert variant="warning" class="nds-w-full">
        <svg ndsAlertIcon kind="warning"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.warningTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.warningDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarInfo>
      <div ndsAlert variant="info" class="nds-w-full">
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.infoTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarDismissible>
      <!-- Alert dismissible de verdade: fechar dispara a emissão real de
           alert_dismiss (payload tipado em analytics.ts). -->
      <div
        ndsAlert
        dismissible
        class="nds-w-full"
        (dismiss)="rastrearFechamento('dismissible')"
      >
        <svg ndsAlertIcon kind="success"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.successTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.successDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplVarSemTitulo>
      <div ndsAlert class="nds-w-full">
        <svg ndsAlertIcon kind="info"></svg>
        <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
      </div>
    </ng-template>

    <!-- ── Previews das composições ─────────────────────────────────────── -->
    <ng-template #tplCompIcone>
      <div ndsAlert class="nds-w-full">
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.infoTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
      </div>
    </ng-template>
    <ng-template #tplCompAcao>
      <!-- Slot ndsAlertAction, não um botão dentro da descrição:
           a classe .nds-alert-action é absoluto no canto superior direito, que é o
           "alinhado à direita" que o conteúdo descreve. -->
      <div ndsAlert variant="warning" class="nds-w-full">
        <svg ndsAlertIcon kind="warning"></svg>
        <h4 ndsAlertTitle>{{ t('demonstration.labels.warningTitle') }}</h4>
        <section ndsAlertDescription>{{ t('demonstration.labels.warningDesc') }}</section>
        <div ndsAlertAction>
          <button ndsButton variant="outline" size="sm">
            {{ t('demonstration.labels.warningAction') }}
          </button>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="alert"
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
          <!-- Cada alert da demo mostra uma capacidade diferente: sem título,
               com título, dismissible e com ação. -->
          <div class="nds-w-full nds-stack" data-spacing="sm">
            <div ndsAlert role="note">
              <svg ndsAlertIcon kind="info"></svg>
              <section ndsAlertDescription>{{ t('demonstration.labels.infoDesc') }}</section>
            </div>

            <div ndsAlert variant="destructive" role="note">
              <svg ndsAlertIcon kind="error"></svg>
              <h3 ndsAlertTitle>{{ t('demonstration.labels.errorTitle') }}</h3>
              <section ndsAlertDescription>{{ t('demonstration.labels.errorDesc') }}</section>
            </div>

            <div
              ndsAlert
              variant="success"
              role="note"
              dismissible
              (dismiss)="rastrearFechamento('demonstration')"
            >
              <svg ndsAlertIcon kind="success"></svg>
              <h3 ndsAlertTitle>{{ t('demonstration.labels.successTitle') }}</h3>
              <section ndsAlertDescription>{{ t('demonstration.labels.successDesc') }}</section>
            </div>

            <div ndsAlert variant="warning" role="note">
              <svg ndsAlertIcon kind="warning"></svg>
              <h3 ndsAlertTitle>{{ t('demonstration.labels.warningTitle') }}</h3>
              <section ndsAlertDescription>{{ t('demonstration.labels.warningDesc') }}</section>
              <div ndsAlertAction>
                <button ndsButton variant="outline" size="sm">
                  {{ t('demonstration.labels.warningAction') }}
                </button>
              </div>
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
          [description]="t('import.basic')"
          [code]="importBasico"
          [secondaryDescription]="t('import.withIcon')"
          [secondaryCode]="importComIcone"
          componentSlug="alert"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="alert"
          language="html"
        />

        <nds-docs-variants
          id="composicoes"
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          componentSlug="alert"
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
          componentSlug="alert"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="alert" />

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
export class NdsAlertDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importBasico = IMPORT_BASICO;
  protected readonly importComIcone = IMPORT_WITH_ICON;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarSuccess = viewChild.required<TemplateRef<unknown>>('tplVarSuccess');
  private readonly tplVarWarning = viewChild.required<TemplateRef<unknown>>('tplVarWarning');
  private readonly tplVarInfo = viewChild.required<TemplateRef<unknown>>('tplVarInfo');
  private readonly tplVarDismissible = viewChild.required<TemplateRef<unknown>>('tplVarDismissible');
  private readonly tplVarSemTitulo = viewChild.required<TemplateRef<unknown>>('tplVarSemTitulo');
  private readonly tplCompIcone = viewChild.required<TemplateRef<unknown>>('tplCompIcone');
  private readonly tplCompAcao = viewChild.required<TemplateRef<unknown>>('tplCompAcao');

  /**
   * O Alert das docs pages é produto: fechar aqui emite o evento real, com
   * valores estáveis (nunca texto traduzido, que dividiria um evento em três
   * no GA4).
   */
  protected rastrearFechamento(label: string): void {
    track('alert_dismiss', { component: 'alert', label, location: 'docs_demo' });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({
        id: s.id,
        label: s.fromUi ? tNav(s.labelKey) : t(s.labelKey),
      })),
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
      items: ['title', 'description', 'error', 'warning'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
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
    return [1, 2].map((n) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${n}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${n}.dont`)),
      doPreview: n === 1 ? this.tplDoDont1Do() : this.tplDoDont2Do(),
      dontPreview: n === 1 ? this.tplDoDont1Dont() : this.tplDoDont2Dont(),
    }));
  });

  protected readonly variantItems = computed(() => {
    dict();
    const byVariant: Record<ChaveDeVariante, { tpl: TemplateRef<unknown>; code: string }> = {
      default:     { tpl: this.tplVarDefault(),     code: CODE_DEFAULT     },
      destructive: { tpl: this.tplVarDestructive(), code: CODE_DESTRUCTIVE },
      success:     { tpl: this.tplVarSuccess(),     code: CODE_SUCCESS     },
      warning:     { tpl: this.tplVarWarning(),     code: CODE_WARNING     },
      info:        { tpl: this.tplVarInfo(),        code: CODE_INFO        },
    };

    const base = (Object.keys(byVariant) as ChaveDeVariante[]).map((v) => ({
      name: v,
      description: stripHtml(t(`variants.items.${v}`)),
      code: byVariant[v].code,
      trackId: v,
      preview: byVariant[v].tpl,
    }));

    return [
      ...base,
      {
        name: t('variants.items.dismissible.name'),
        description: withQuandoUsar(
          t('variants.items.dismissible.description'),
          t('variants.items.dismissible.use'),
        ),
        code: CODE_DISMISSIBLE,
        trackId: 'dismissible',
        preview: this.tplVarDismissible(),
      },
      {
        name: t('states.withoutTitle.label'),
        description: stripHtml(t('states.withoutTitle.behavior')),
        code: CODE_NO_TITLE,
        trackId: 'without-title',
        preview: this.tplVarSemTitulo(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'withIcon',   code: CODE_WITH_ICON, tpl: this.tplCompIcone() },
      { key: 'withAction', code: CODE_WITH_ACTION,  tpl: this.tplCompAcao()  },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: withQuandoUsar(
        t(`variants.compositions.${key}.description`),
        t(`variants.compositions.${key}.use`),
      ),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: toPlainText(t('states.cols.trigger')),
      behavior: toPlainText(t('states.cols.behavior')),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['complete', 'withoutTitle', 'withoutIcon', 'dynamicInsert', 'dismissed'].map((k) => ({
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
    return [
      {
        title: t('props.alertTitle'),
        cols,
        items: [
          { name: 'variant',      type: 'AlertVariant',  defaultValue: "'default'",        required: not, description: toPlainText(t('props.table.variant')) },
          { name: 'role',         type: 'AlertRole',     defaultValue: "'alert'",          required: not, description: toPlainText(t('props.table.role')) },
          { name: 'dismissible',  type: 'boolean',       defaultValue: 'false',            required: not, description: toPlainText(t('props.table.dismissible')) },
          { name: 'dismissLabel', type: 'string',        defaultValue: "'Fechar alerta'",  required: not, description: toPlainText(t('props.table.dismissLabel')) },
          { name: '(dismiss)',    type: 'OutputRef<void>', defaultValue: '—',              required: not, description: toPlainText(t('props.table.onDismiss')) },
          { name: 'class',        type: 'string',        defaultValue: '—',                required: not, description: toPlainText(t('props.table.className')) },
          { name: '(conteúdo)',   type: 'HTML',          defaultValue: '—',                required: not, description: toPlainText(t('props.table.children')) },
        ],
      },
      {
        title: t('props.alertTitleTitle'),
        cols,
        items: [
          { name: '(elemento)', type: 'h1 | h2 | h3 | h4 | h5 | h6', defaultValue: '—', required: not, description: toPlainText(t('props.table.titleAs')) },
          { name: 'class',      type: 'string', defaultValue: '—', required: not, description: toPlainText(t('props.table.className')) },
          { name: '(conteúdo)', type: 'HTML',   defaultValue: '—', required: not, description: toPlainText(t('props.table.children')) },
        ],
      },
      {
        title: t('props.alertDescTitle'),
        cols,
        items: [
          { name: 'class',      type: 'string', defaultValue: '—', required: not, description: toPlainText(t('props.table.className')) },
          { name: '(conteúdo)', type: 'HTML',   defaultValue: '—', required: not, description: toPlainText(t('props.table.children')) },
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
      { token: '--muted',         valor: 'hsl(var(--muted))',                 k: 'background'       },
      { token: '--foreground',    valor: 'hsl(var(--foreground))',            k: 'foreground'       },
      { token: '--border',        valor: 'hsl(var(--border))',                k: 'border'           },
      { token: '--destructive',   valor: 'hsl(var(--destructive) / 0.3)',     k: 'destructiveBorder'},
      { token: '--destructive',   valor: 'hsl(var(--destructive))',           k: 'destructiveText'  },
      { token: '--success',       valor: '.nds-alert-success',                k: 'success'          },
      { token: '--warning',       valor: '.nds-alert-warning',                k: 'warning'          },
      { token: '--info',          valor: '.nds-alert-info',                   k: 'info'             },
      { token: '--radius-alert',  valor: 'var(--radius-alert)',               k: 'radius'           },
      { token: '--alert-bg',      valor: 'hsl(var(--muted))',                 k: 'alertBg'          },
      { token: '--alert-fg',      valor: 'hsl(var(--card-foreground))',       k: 'alertFg'          },
      { token: '--alert-body-fg', valor: 'hsl(var(--foreground))',            k: 'alertBodyFg'      },
      { token: '--alert-border',  valor: 'hsl(var(--border))',                k: 'alertBorder'      },
      { token: '--alert-glow',    valor: 'hsl(var(--border))',                k: 'alertGlow'        },
    ].map(({ token, valor, k }) => ({
      token,
      value: valor,
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
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: '—',     description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    // As chaves de `screenReader` variam por componente — aqui elas vivem sob
    // `accessibility`, e não na raiz como no badge. Só os valores importam.
    const porLocale = alertTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(porLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'sonner',      nome: 'Sonner',      path: '?path=/docs/ui-sonner--docs'      },
      { key: 'alertDialog', nome: 'AlertDialog', path: '?path=/docs/ui-alertdialog--docs' },
      { key: 'badge',       nome: 'Badge',       path: '?path=/docs/ui-badge--docs'       },
      { key: 'progress',    nome: 'Progress',    path: '?path=/docs/ui-progress--docs'    },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
    return ['dismiss', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
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
        componentSlug: 'alert',
      });
      track('docs_page_view', {
        component_name: 'alert',
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
          component_name: 'alert',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/**
 * Junta descrição e "quando usar" na forma que o container de variantes espera.
 *
 * O `NdsDocsCompositions` faria isto sozinho, mas ele não repassa `language`
 * para o `NdsDocsVariants` — e os snippets aqui são template Angular, não TS.
 */
function withQuandoUsar(descricao: string, quandoUsar: string): string {
  return `${descricao}<br><br><strong>${tNav('common.useWhen')}</strong> ${quandoUsar}`;
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
