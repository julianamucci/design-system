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
import { NdsToaster, toast } from '@/components/ui/sonner';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import sonnerTranslations from '@shared/content/sonner/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides de propriedade: o conteúdo compartilhado descreve a API da lib
// externa `sonner` (`theme` do next-themes, `icons`, `toastOptions`). Aqui o
// Toaster é um componente do próprio design system, com o conjunto de ícones
// fixo e o tema vindo da cascata — então essas três linhas dão lugar às três
// que existem de fato. Overrides são para nome e rótulo; nunca para snippet.
const { t, dict } = useTranslation(sonnerTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.closeButton':
      'Mostra o botão de fechar em todas as notificações. Cada disparo pode sobrepor.',
    'props.table.label':
      'Nome acessível da região. Dois Toasters na mesma tela precisam de nomes distintos.',
    'props.table.closeLabel':
      'Rótulo do botão de fechar, que só tem ícone.',
    'a11y.toasterLabel': 'Notificações',
  },
  en: {
    'props.table.closeButton':
      'Shows the close button on every notification. Each dispatch may override it.',
    'props.table.label':
      'Accessible name of the region. Two Toasters on the same screen need distinct names.',
    'props.table.closeLabel': 'Label for the close button, which is icon-only.',
    'a11y.toasterLabel': 'Notifications',
  },
  es: {
    'props.table.closeButton':
      'Muestra el botón de cerrar en todas las notificaciones. Cada disparo puede sobrescribirlo.',
    'props.table.label':
      'Nombre accesible de la región. Dos Toasters en la misma pantalla necesitan nombres distintos.',
    'props.table.closeLabel': 'Rótulo del botón de cerrar, que solo tiene ícono.',
    'a11y.toasterLabel': 'Notificaciones',
  },
});

// A seção "Composições" (`states`) não entra: o conteúdo compartilhado só traz
// `title` e `items` ali, e a auditoria lê essa forma como seção vazia — uma
// página com o id e sem conteúdo reconhecido é cobrada como placeholder. As
// quatro composições aparecem na Demonstração, onde cada uma tem um disparo.
const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'propriedades', 'tokens',
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

const IMPORT_CODE = `import { NdsToaster, toast } from '@/components/ui/sonner';`;

// Escrito à mão, e não vindo de `anatomy.structureCode`: a variante `angular`
// do conteúdo compartilhado descreve um elemento `<nds-toaster>` de uma lib
// externa, e o componente desta stack é um seletor de ATRIBUTO no elemento
// nativo — o snippet compartilhado não compila aqui. Divergência reportada.
const ANATOMY_CODE = `<!-- Uma vez, no root da aplicação -->
<div ndsToaster position="top-right" [richColors]="true" [closeButton]="true"></div>

<!-- De qualquer lugar do código, sem injetar nada -->
toast('Código copiado.');
toast.success('Alterações salvas.', { description: 'Detalhes' });
toast('Item excluído.', { action: { label: 'Desfazer', onClick: () => restaurar() } });
toast.promise(enviar(), { loading: '...', success: '...', error: '...' });`;

const INTERFACE_CODE = `// Seletor de atributo: o host é o <div> nativo, então o markup sai igual ao
// das outras stacks e o CSS \`.nds-toaster\` casa sem wrapper.
@Component({ selector: 'div[ndsToaster]' })
export class NdsToaster {
  readonly position = input<ToastPosition>('bottom-right');
  readonly richColors = input(false, { transform: booleanAttribute });
  readonly expand = input(false, { transform: booleanAttribute });
  readonly duration = input(4000, { transform: numberAttribute });
  readonly closeButton = input(false, { transform: booleanAttribute });
  readonly label = input('Notificações');
  readonly closeLabel = input('Fechar notificação');
}

// A fila é global ao módulo: \`toast\` não exige injetor nem referência ao Toaster.
toast(titulo, opcoes?): number;
toast.success | error | warning | info | loading (titulo, opcoes?): number;
toast.promise(promessa, { loading, success, error }, opcoes?): void;
toast.dismiss(id?): void;`;

const CUSTOMIZATION_CODE = `/* A notificação lê os tokens do tema — personalizar é
   redefinir o token, não sobrescrever a regra do componente. */
.tema-warm {
  --radius: 0.375rem;
}`;

/** Snippet de cada tipo, na ordem em que a seção Tipos os apresenta. */
const CODIGO_POR_TIPO: Record<string, string> = {
  default: `toast('Código copiado.');`,
  success: `toast.success('Alterações salvas.');`,
  error: `toast.error('Não foi possível salvar. Tente novamente.');`,
  warning: `toast.warning('Sua sessão expira em 5 minutos.');`,
  info: `toast.info('Nova versão disponível.');`,
};

@Component({
  selector: 'nds-sonner-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsToaster, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- UM Toaster para a página inteira. Dois marcos com o mesmo nome fariam
         o leitor de tela oferecer duas regiões idênticas — e as duas
         desenhariam a mesma fila. -->
    <div
      ndsToaster
      position="top-right"
      [richColors]="true"
      [closeButton]="true"
      [label]="t('a11y.toasterLabel')"
    ></div>

    <ng-template #tplDoDont1Do>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('success')">
        {{ t('demonstration.labels.triggerSuccess') }}
      </button>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <button ndsButton variant="outline" size="sm" (click)="dispararBloqueante()">
        {{ t('demonstration.labels.triggerError') }}
      </button>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <button ndsButton variant="outline" size="sm" (click)="dispararPromessa()">
        {{ t('demonstration.labels.triggerPromise') }}
      </button>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <button ndsButton variant="outline" size="sm" (click)="dispararDeFormulario()">
        {{ t('demonstration.labels.triggerWarning') }}
      </button>
    </ng-template>

    <ng-template #tplVarDefault>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('default')">
        {{ t('demonstration.labels.triggerDefault') }}
      </button>
    </ng-template>
    <ng-template #tplVarSuccess>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('success')">
        {{ t('demonstration.labels.triggerSuccess') }}
      </button>
    </ng-template>
    <ng-template #tplVarError>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('error')">
        {{ t('demonstration.labels.triggerError') }}
      </button>
    </ng-template>
    <ng-template #tplVarWarning>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('warning')">
        {{ t('demonstration.labels.triggerWarning') }}
      </button>
    </ng-template>
    <ng-template #tplVarInfo>
      <button ndsButton variant="outline" size="sm" (click)="dispararTipo('info')">
        {{ t('demonstration.labels.triggerInfo') }}
      </button>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="sonner"
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
            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption">{{ t('variants.title') }}</span>
              <div class="nds-cluster" data-spacing="sm">
                @for (gatilho of gatilhosDeTipo(); track gatilho.tipo) {
                  <button
                    ndsButton
                    variant="outline"
                    size="sm"
                    (click)="dispararTipo(gatilho.tipo)"
                  >
                    {{ gatilho.rotulo }}
                  </button>
                }
              </div>
            </div>

            <!-- As composições documentadas em \`states.items\` vivem aqui: cada
                 uma é um disparo, e é disparando que se entende a diferença. -->
            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption">{{ t('states.title') }}</span>
              <div class="nds-cluster" data-spacing="sm">
                <button ndsButton variant="outline" size="sm" (click)="dispararComDescricao()">
                  {{ t('demonstration.labels.triggerWithDescription') }}
                </button>
                <button ndsButton variant="outline" size="sm" (click)="dispararComAcao()">
                  {{ t('demonstration.labels.triggerWithAction') }}
                </button>
                <button ndsButton variant="outline" size="sm" (click)="dispararPromessa()">
                  {{ t('demonstration.labels.triggerPromise') }}
                </button>
                <button ndsButton variant="outline" size="sm" (click)="dispararPersistente()">
                  {{ t('demonstration.labels.triggerPersistent') }}
                </button>
              </div>
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
          componentSlug="sonner"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="sonner"
          id="variantes"
          language="ts"
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
          componentSlug="sonner"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="sonner" />

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
export class NdsSonnerDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = IMPORT_CODE;

  /** Os seis tipos, na ordem da documentação. */
  protected readonly tiposDeToast = ['default', 'success', 'error', 'warning', 'info', 'loading'];

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarSuccess = viewChild.required<TemplateRef<unknown>>('tplVarSuccess');
  private readonly tplVarError = viewChild.required<TemplateRef<unknown>>('tplVarError');
  private readonly tplVarWarning = viewChild.required<TemplateRef<unknown>>('tplVarWarning');
  private readonly tplVarInfo = viewChild.required<TemplateRef<unknown>>('tplVarInfo');

  // ─── Disparos da demonstração ───────────────────────────────────────────────
  //
  // O evento é da AÇÃO que originou a notificação, nunca da notificação em si —
  // e a carga leva o valor estável do tipo, jamais o texto traduzido, que
  // partiria o mesmo evento em três no GA4.

  /**
   * Rótulo de cada disparo, montado AQUI e não no template.
   *
   * Dois motivos: o contexto de template não tem globais (nada de `String(...)`
   * nem de métodos soltos), e a auditoria lê chave de i18n por LITERAL — uma
   * chave concatenada dentro do `t()` do template era acusada como inexistente,
   * com o prefixo truncado no lugar da chave real.
   */
  protected readonly gatilhosDeTipo = computed(() => {
    dict();
    return this.tiposDeToast.map((tipo) => ({
      tipo,
      rotulo: t(`demonstration.labels.trigger${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`),
    }));
  });

  protected dispararTipo(tipo: string): void {
    track('toast_demo_triggered', { toast_type: tipo, locale: getLocale() });
    const texto = t(`demonstration.labels.${tipo}`);
    switch (tipo) {
      case 'success': toast.success(texto); break;
      case 'error':   toast.error(texto);   break;
      case 'warning': toast.warning(texto); break;
      case 'info':    toast.info(texto);    break;
      case 'loading': toast.loading(texto); break;
      default:        toast(texto);
    }
  }

  protected dispararComDescricao(): void {
    track('toast_demo_triggered', { toast_type: 'with_description', locale: getLocale() });
    toast.success(t('demonstration.labels.withDescription'), {
      description: t('demonstration.labels.withDescriptionDesc'),
    });
  }

  protected dispararComAcao(): void {
    track('toast_demo_triggered', { toast_type: 'with_action', locale: getLocale() });
    toast(t('demonstration.labels.withAction'), {
      action: {
        label: t('demonstration.labels.withActionLabel'),
        onClick: () =>
          track('toast_action_click', {
            // Valor estável, e não o rótulo traduzido.
            label: 'undo',
            component: 'toast',
            location: 'docs_demo',
          }),
      },
    });
  }

  protected dispararPromessa(): void {
    track('toast_demo_triggered', { toast_type: 'promise', locale: getLocale() });
    const operacao = new Promise<void>((resolve) => setTimeout(resolve, 1800));
    toast.promise(operacao, {
      loading: t('demonstration.labels.promiseLoading'),
      success: t('demonstration.labels.promise'),
      error: t('demonstration.labels.promiseError'),
    });
  }

  protected dispararPersistente(): void {
    track('toast_demo_triggered', { toast_type: 'persistent', locale: getLocale() });
    toast.error(t('demonstration.labels.persistent'), {
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
  }

  /** Contraexemplo do par 1: erro que bloqueia o fluxo — lugar do Alert. */
  protected dispararBloqueante(): void {
    track('toast_demo_triggered', { toast_type: 'blocking_error', locale: getLocale() });
    toast.error(t('demonstration.labels.error'));
  }

  /** Contraexemplo do par 2: erro de campo — lugar do FormMessage. */
  protected dispararDeFormulario(): void {
    track('toast_demo_triggered', { toast_type: 'form_error', locale: getLocale() });
    toast.warning(t('demonstration.labels.warning'));
  }

  // ─── Conteúdo ───────────────────────────────────────────────────────────────

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: rotuloDeNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: rotuloDeNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return itensNumerados(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: d['usage.guidelines.title'] ?? '', items: itensNumerados(d, 'usage.guidelines') };
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
    const d = dict();
    const chaves = Object.keys(d)
      .filter((k) => /^usage\.uxWriting\.table\.[a-zA-Z]+\.name$/.test(k))
      .map((k) => k.split('.')[3]);
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
      items: chaves.map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
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
      default: this.tplVarDefault(),
      success: this.tplVarSuccess(),
      error: this.tplVarError(),
      warning: this.tplVarWarning(),
      info: this.tplVarInfo(),
    };
    // Derivado do dicionário, não de uma lista escrita à mão: um tipo novo no
    // conteúdo compartilhado aparece sozinho, sem editar a página.
    return Object.keys(d)
      .filter((k) => /^variants\.items\.[a-zA-Z]+$/.test(k))
      .map((k) => k.split('.')[2])
      .filter((chave) => previews[chave] !== undefined)
      .map((chave) => ({
        name: chave,
        description: t(`variants.items.${chave}`),
        trackId: chave,
        code: CODIGO_POR_TIPO[chave] ?? '',
        preview: previews[chave],
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
    const linha = (name: string, chave: string, tipo: string, padrao: string) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: nao,
      description: toPlainText(t(`props.table.${chave}`)),
    });

    return [
      {
        title: t('props.toasterTitle'),
        cols,
        items: [
          linha('position', 'position', 'ToastPosition', `'bottom-right'`),
          linha('richColors', 'richColors', 'boolean', 'false'),
          linha('expand', 'expand', 'boolean', 'false'),
          linha('duration', 'duration', 'number', '4000'),
          linha('closeButton', 'closeButton', 'boolean', 'false'),
          linha('label', 'label', 'string', `'Notificações'`),
          linha('closeLabel', 'closeLabel', 'string', `'Fechar notificação'`),
        ],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.value'),
      description: t('tokens.table.description'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    // Os tokens que a notificação lê DE FATO nesta stack. O conteúdo
    // compartilhado nomeia as variáveis internas da lib externa
    // (`--normal-bg` e irmãs), que aqui não existem — a descrição de cada
    // linha continua valendo, o nome do token é o do design system.
    return [
      { token: '--background',  k: 'normalBg',     propriedade: 'background-color' },
      { token: '--foreground',  k: 'normalText',   propriedade: 'color' },
      { token: '--border',      k: 'normalBorder', propriedade: 'border-color' },
      { token: '--radius',      k: 'borderRadius', propriedade: 'border-radius' },
    ].map(({ token, k, propriedade }) => ({
      token,
      value: propriedade,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return itensNumerados(d, 'accessibility');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',    description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter',  description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Escape', description: toPlainText(t('accessibility.keyboard.escape')) },
      // Nunca a string "undefined" numa tabela: o travessão é o vazio legível.
      { key: '—',      description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    const d = dict();
    // As chaves de `screenReader` variam por componente — derivadas do dict, e
    // não escritas à mão.
    return Object.keys(d)
      .filter((k) => /^accessibility\.screenReader\.[a-zA-Z]+$/.test(k))
      .map((k) => d[k]);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'alert',       nome: 'Alert',       path: '?path=/docs/ui-alert--docs' },
      { key: 'alertDialog', nome: 'AlertDialog', path: '?path=/docs/ui-alertdialog--docs' },
      { key: 'badge',       nome: 'Badge',       path: '?path=/docs/ui-badge--docs' },
      { key: 'progress',    nome: 'Progress',    path: '?path=/docs/ui-progress--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    return itensNumerados(d, 'notes').map((conteudo) => ({ title: '', content: conteudo }));
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
      { e: 'actionClick',   gatilho: 'actionClickTrigger',   carga: 'actionClickPayload'   },
      { e: 'pageView',      gatilho: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', gatilho: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    gatilho: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, gatilho, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${gatilho}`)),
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
    // A forma varia por componente: aqui é a trinca, mas string solta também
    // aparece em outros slugs — e `t()` devolveria a própria chave nesse caso.
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']);
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : itensNumerados(d, 'testes.accessibility').map((texto) => ({
          criterion: toPlainText(texto),
          level: '',
          how: '',
        }));
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items,
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
        componentSlug: 'sonner',
      });
      track('docs_page_view', {
        component_name: 'sonner',
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
          component_name: 'sonner',
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

/** Itens `base.itemN` na ordem numérica, quantos existirem. */
function itensNumerados(d: Record<string, string>, base: string): string[] {
  const itens: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) itens.push(d[`${base}.item${i}`]);
  return itens;
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
