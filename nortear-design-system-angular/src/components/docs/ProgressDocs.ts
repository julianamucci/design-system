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
import { NDS_PROGRESS } from '@/components/ui/progress';
import uiTranslations from '@/i18n/ui.json';
import progressTranslations from '@shared/content/progress/translations.json';

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

// Overrides — as três camadas de divergência idiomática (ver /dev-angular).
//
// `notes.item1` no conteúdo compartilhado lista as libs upstream das outras
// stacks pelo nome. Cada docs page é consumida isoladamente: aqui a nota tem
// que falar do primitivo que ESTA página usa.
//
// `notes.item2` e `notes.item3` já foram overrides aqui, porque o texto
// compartilhado ensinava sintaxe de variante utilitária (`[&>div]:…`) e
// prometia uma animação que o CSS não tinha. As duas coisas foram corrigidas na
// fonte — o mecanismo agora é `data-indeterminate` e `data-variant`, igual nas
// cinco stacks —, e o override saiu junto: override que repete a fonte só
// duplica manutenção.
//
// `props.table.getAriaValueText` descreve a assinatura de uma prop de outra
// forma de API: aqui o formatador recebe também `min` e `max`, e o texto que
// ele devolve alimenta tanto o anúncio quanto o valor visível.
const { t, dict } = useTranslation(progressTranslations as Record<string, unknown>, {
  'pt-BR': {
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/progress</code> — entrega <code>role</code>, a família <code>aria-value*</code>, o vínculo com o rótulo e o texto formatado do valor.',
    'props.table.getAriaValueText.type': '(value, min, max) => string',
    'props.table.getAriaValueText.description':
      'Formata o valor. O texto devolvido vai para o anúncio do leitor de tela e para a parte de valor visível.',
    'props.table.className.description':
      'Classes extras vão no atributo class do próprio elemento — o framework as mescla com as do componente.',
  },
  en: {
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/progress</code> — provides <code>role</code>, the <code>aria-value*</code> family, the link to the label and the formatted value text.',
    'props.table.getAriaValueText.type': '(value, min, max) => string',
    'props.table.getAriaValueText.description':
      'Formats the value. The returned text feeds both the screen reader announcement and the visible value part.',
    'props.table.className.description':
      'Extra classes go on the class attribute of the element itself — the framework merges them with the component ones.',
  },
  es: {
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/progress</code> — aporta <code>role</code>, la familia <code>aria-value*</code>, el vínculo con la etiqueta y el texto formateado del valor.',
    'props.table.getAriaValueText.type': '(value, min, max) => string',
    'props.table.getAriaValueText.description':
      'Formatea el valor. El texto devuelto alimenta tanto el anuncio del lector de pantalla como la parte de valor visible.',
    'props.table.className.description':
      'Las clases extra van en el atributo class del propio elemento — el framework las combina con las del componente.',
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

const INTERFACE_CODE = `// Cinco diretivas de atributo em elementos nativos
@Directive({
  selector: 'div[ndsProgress]',
  hostDirectives: [
    { directive: RdxProgressRootDirective,
      inputs: ['value', 'min', 'max', 'valueLabel: getAriaValueText'] },
  ],
  host: { class: 'nds-progress-root', '[attr.data-slot]': '"progress"' },
})
export class NdsProgress {}

// A posição da barra sai da custom property que o CSS compartilhado lê:
//   host: { '[style.--value]': 'valueCss()' }   // 0–100, do primitivo
// Sem largura nem transform inline — o desenho continua sendo do design system.`;

// Mesma estrutura que a variante `angular` de `anatomy.structureCode` no
// conteúdo compartilhado — que escrevia a raiz como elemento (`<nds-progress>`)
// e foi corrigida na fonte. A raiz é diretiva de atributo num `<div>`, como no
// Card e no Slider: markup é o que a auditoria cross-stack compara, e as outras
// quatro stacks renderizam `<div>`.
const ANATOMY_CODE = `<div ndsProgress [value]="42">
  <span ndsProgressLabel>Enviando arquivo</span>
  <span ndsProgressValue></span>
  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`;

const CODE_DETERMINATE = `<div ndsProgress [value]="42" aria-label="Progresso do upload">
  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`;

// Tabela de tokens — cada linha corresponde a uma declaração de
// `docs/shared/styles/nds/progress.css`.
const TOKEN_ROWS = [
  { token: '--primary',           k: 'track' },
  { token: '--primary',           k: 'indicator' },
  { token: '--success',           k: 'success' },
  { token: '--destructive',       k: 'destructive' },
  { token: '--spacing-2',         k: 'height' },
  { token: '--radius-full',       k: 'radius' },
  { token: '--muted-foreground',  k: 'value' },
  { token: '--text-control',      k: 'label' },
  { token: '--duration-base',     k: 'motion' },
  { token: '--duration-stately',  k: 'motionIndeterminate' },
] as const;

const CODE_SEMANTIC = `<div ndsProgress [value]="100" data-variant="success" aria-label="Sincronização concluída">
  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`;

const CODE_WITH_LABEL = `<div ndsProgress [value]="42">
  <span ndsProgressLabel>Enviando arquivo</span>
  <span ndsProgressValue></span>
  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`;

@Component({
  selector: 'nds-progress-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_PROGRESS,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-w-full">
        <div ndsProgress [value]="72" [attr.aria-label]="t('demonstration.labels.upload')">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-w-full">
        <div ndsProgress [value]="72" aria-label="Progress">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-w-full">
        <div ndsProgress [value]="70">
          <span ndsProgressLabel>{{ t('demonstration.labels.upload') }}</span>
          <span ndsProgressValue></span>
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-w-full">
        <div ndsProgress [value]="71" [attr.aria-label]="t('demonstration.labels.upload')">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
        <p class="nds-text-caption nds-text-muted-foreground" aria-live="assertive">
          71{{ t('demonstration.labels.percent') }}
        </p>
      </div>
    </ng-template>

    <ng-template #tplVarDeterminate>
      <div class="nds-w-full">
        <div ndsProgress [value]="42" [attr.aria-label]="t('demonstration.labels.upload')">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarWithLabel>
      <div class="nds-w-full">
        <div ndsProgress [value]="42">
          <span ndsProgressLabel>{{ t('demonstration.labels.upload') }}</span>
          <span ndsProgressValue></span>
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarSemantic>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <div ndsProgress [value]="100" data-variant="success" aria-label="Sincronização concluída">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
        <div
          ndsProgress
          [value]="92"
          data-variant="destructive"
          aria-label="Espaço de armazenamento quase esgotado"
        >
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="progress"
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
            <div ndsProgress [value]="72">
              <span ndsProgressLabel>{{ t('demonstration.labels.upload') }}</span>
              <span ndsProgressValue></span>
              <div ndsProgressTrack>
                <div ndsProgressIndicator></div>
              </div>
            </div>

            <div ndsProgress [value]="35" [attr.aria-label]="t('demonstration.labels.loading')">
              <div ndsProgressTrack>
                <div ndsProgressIndicator></div>
              </div>
            </div>

            <div ndsProgress [value]="100">
              <span ndsProgressLabel>{{ t('demonstration.labels.complete') }}</span>
              <span ndsProgressValue></span>
              <div ndsProgressTrack>
                <div ndsProgressIndicator></div>
              </div>
            </div>

            <div ndsProgress [attr.aria-label]="t('demonstration.labels.indeterminate')">
              <div ndsProgressTrack>
                <div ndsProgressIndicator></div>
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
          componentSlug="progress"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="progress"
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
          componentSlug="progress"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="progress" />

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
export class NdsProgressDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly importCode = `import { NDS_PROGRESS } from '@/components/ui/progress';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDeterminate = viewChild.required<TemplateRef<unknown>>('tplVarDeterminate');
  private readonly tplVarWithLabel = viewChild.required<TemplateRef<unknown>>('tplVarWithLabel');
  private readonly tplVarSemantic = viewChild.required<TemplateRef<unknown>>('tplVarSemantic');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`anatomy.item${i}`));
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
      // Os nomes de parte vêm do conteúdo compartilhado em forma neutra
      // (ProgressLabel/ProgressValue); aqui as partes são diretivas.
      items: [
        { key: 'label', name: 'ndsProgressLabel' },
        { key: 'value', name: 'ndsProgressValue' },
        { key: 'ariaLabel', name: 'aria-label' },
      ].map(({ key, name }) => ({
        element: name,
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
    // `indeterminate` não entra aqui: é ESTADO (alcançável pelos dados) e está
    // descrito na seção Estados — guideline 14, regra de não-duplicação.
    return [
      {
        name: t('variants.items.determinate'),
        description: stripHtml(t('variants.styles.determinate')),
        code: CODE_DETERMINATE,
        trackId: 'determinate',
        preview: this.tplVarDeterminate(),
      },
      {
        name: t('variants.items.withLabel'),
        description: stripHtml(t('variants.styles.withLabel')),
        code: CODE_WITH_LABEL,
        trackId: 'with-label',
        preview: this.tplVarWithLabel(),
      },
      {
        name: t('variants.items.semantic'),
        description: stripHtml(t('variants.styles.semantic')),
        code: CODE_SEMANTIC,
        trackId: 'semantic',
        preview: this.tplVarSemantic(),
      },
    ];
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
    return ['default', 'loading', 'complete', 'indeterminate'].map((k) => ({
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
    return [
      {
        title: 'ndsProgress',
        cols,
        items: [
          { key: 'value', name: 'value' },
          { key: 'min', name: 'min' },
          { key: 'max', name: 'max' },
          { key: 'getAriaValueText', name: 'getAriaValueText' },
          { key: 'variant', name: 'data-variant' },
          { key: 'className', name: 'class' },
        ].map(({ key, name }) => ({
          name: name,
          type: toPlainText(t(`props.table.${key}.type`)),
          defaultValue: toPlainText(t(`props.table.${key}.default`)),
          required: toPlainText(t(`props.table.${key}.required`)),
          description: toPlainText(t(`props.table.${key}.description`)),
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
    // Cada linha é uma declaração de `docs/shared/styles/nds/progress.css`. O
    // conteúdo compartilhado passou a trazer a própria classe, então esta stack
    // não precisa mais corrigi-la no lugar dele.
    return TOKEN_ROWS.map(({ token, k }) => ({
      token,
      value: t(`tokens.table.${k}.class`),
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
      { key: '—',   description: toPlainText(t('accessibility.keyboard.noInteraction')) },
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.container')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = progressTranslations as unknown as Record<
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
      { key: 'skeleton', path: '?path=/docs/ui-skeleton--docs' },
      { key: 'spinner',  path: '?path=/docs/ui-progress--docs' },
      { key: 'alert',    path: '?path=/docs/ui-alert--docs'    },
      { key: 'sonner',   path: '?path=/docs/ui-sonner--docs'   },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
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
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // O nome do evento é a própria chave: o conteúdo não repete `task_progress`
    // como valor traduzido, porque nome de evento não se traduz.
    return ['task_progress', 'task_complete'].map((evento) => ({
      event: evento,
      trigger: toPlainText(t(`analytics.table.${evento}.trigger`)),
      payload: toPlainText(t(`analytics.table.${evento}.payload`)),
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
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // skeleton e do label.
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
        componentSlug: 'progress',
      });
      track('docs_page_view', {
        component_name: 'progress',
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
          component_name: 'progress',
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
