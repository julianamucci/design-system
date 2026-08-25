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
import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';
import uiTranslations from '@/i18n/ui.json';
import toggleTranslations from '@shared/content/toggle/translations.json';

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

// Três desvios do conteúdo compartilhado, e nenhum deles é snippet de código:
//
// 1. `notes.item1` nomeia as bibliotecas das outras stacks. Cada docs page é
//    consumida isoladamente, então a lista alheia só vaza — aqui a nota fala do
//    primitivo que ESTE componente compõe.
// 2. `props.table.size.description` promete altura vindo de `--height-*`. O CSS
//    compartilhado do toggle não usa esses tokens; a descrição passa a falar do
//    que a prop realmente escolhe.
// 3. `props.table.className.description` descreve uma prop de classe. Aqui não
//    existe input `class`: o Angular mescla o atributo escrito no elemento com
//    a classe do host.
const { t, dict } = useTranslation(toggleTranslations as Record<string, unknown>, {
  'pt-BR': {
    'notes.item1': '<strong>Primitivo</strong>: <code>RdxToggle</code>, aplicado por <code>hostDirectives</code> — dele vêm <code>aria-pressed</code>, a alternância por clique e teclado e o estado desabilitado.',
    'props.table.size.description': 'Degrau de densidade do controle.',
    'props.table.className.description': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
  },
  en: {
    'notes.item1': '<strong>Primitive</strong>: <code>RdxToggle</code>, applied through <code>hostDirectives</code> — it provides <code>aria-pressed</code>, click and keyboard toggling, and the disabled state.',
    'props.table.size.description': 'Density step of the control.',
    'props.table.className.description': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
  },
  es: {
    'notes.item1': '<strong>Primitivo</strong>: <code>RdxToggle</code>, aplicado por <code>hostDirectives</code> — de él vienen <code>aria-pressed</code>, la alternancia por clic y teclado y el estado deshabilitado.',
    'props.table.size.description': 'Escalón de densidad del control.',
    'props.table.className.description': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
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

const INTERFACE_CODE = `// <button ndsToggle> — compõe o primitivo do Radix NG
@Component({
  selector: 'button[ndsToggle]',
  hostDirectives: [
    { directive: RdxToggle,
      inputs: ['pressed', 'defaultPressed', 'disabled', 'value'],
      outputs: ['pressedChange'] },
  ],
  host: {
    class: 'nds-toggle',
    '[attr.data-state]': 'state()',
    '[attr.data-variant]': 'variant() === "default" ? null : variant()',
    '[attr.data-size]': 'size() === "default" ? null : size()',
  },
})
export class NdsToggle {}

// aria-pressed, data-pressed, data-disabled e o atributo disabled são ligados
// pelo primitivo — não os escreva no elemento.`;

@Component({
  selector: 'nds-toggle-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsToggle, NdsToggleIcon,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <button ndsToggle [attr.aria-label]="t('demonstration.labels.bold')">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <button ndsToggle aria-label="B">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-cluster" data-spacing="xs" role="group" [attr.aria-label]="t('demonstration.labels.bold')">
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.underline')">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack" data-spacing="sm">
        <button ndsToggle variant="outline">
          <svg ndsToggleIcon kind="bold"></svg>
          {{ t('demonstration.labels.bold') }}
        </button>
        <button ndsToggle variant="outline">
          <svg ndsToggleIcon kind="italic"></svg>
          {{ t('demonstration.labels.italic') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <button ndsToggle [defaultPressed]="true" [attr.aria-label]="t('demonstration.labels.bold')">
        <svg ndsToggleIcon kind="bold"></svg>
      </button>
    </ng-template>
    <ng-template #tplVarOutline>
      <button ndsToggle variant="outline" [attr.aria-label]="t('demonstration.labels.italic')">
        <svg ndsToggleIcon kind="italic"></svg>
      </button>
    </ng-template>
    <ng-template #tplVarWithLabel>
      <button ndsToggle variant="outline">
        <svg ndsToggleIcon kind="eye"></svg>
        {{ t('demonstration.labels.showHidden') }}
      </button>
    </ng-template>
    <ng-template #tplVarSizes>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle variant="outline" size="sm" [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle variant="outline" [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle variant="outline" size="lg" [attr.aria-label]="t('demonstration.labels.underline')">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
      </div>
    </ng-template>

    <ng-template #tplCompToolbar>
      <div class="nds-cluster" data-spacing="xs" role="group" [attr.aria-label]="t('variants.compositions.toolbar.name')">
        <button ndsToggle [defaultPressed]="true" [attr.aria-label]="t('demonstration.labels.bold')">
          <svg ndsToggleIcon kind="bold"></svg>
        </button>
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.italic')">
          <svg ndsToggleIcon kind="italic"></svg>
        </button>
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.underline')">
          <svg ndsToggleIcon kind="underline"></svg>
        </button>
        <button ndsToggle [attr.aria-label]="t('demonstration.labels.list')">
          <svg ndsToggleIcon kind="list"></svg>
        </button>
      </div>
    </ng-template>
    <ng-template #tplCompFilterList>
      <div class="nds-cluster" data-spacing="sm">
        <button ndsToggle variant="outline" [defaultPressed]="true">
          <svg ndsToggleIcon kind="eye"></svg>
          {{ t('demonstration.labels.showHidden') }}
        </button>
        <button ndsToggle variant="outline">
          <svg ndsToggleIcon kind="list"></svg>
          {{ t('demonstration.labels.compactView') }}
        </button>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="toggle"
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
            <div class="nds-cluster" data-spacing="xs" role="group" [attr.aria-label]="t('variants.compositions.toolbar.name')">
              <button ndsToggle [defaultPressed]="true" [attr.aria-label]="t('demonstration.labels.bold')">
                <svg ndsToggleIcon kind="bold"></svg>
              </button>
              <button ndsToggle [attr.aria-label]="t('demonstration.labels.italic')">
                <svg ndsToggleIcon kind="italic"></svg>
              </button>
              <button ndsToggle [attr.aria-label]="t('demonstration.labels.underline')">
                <svg ndsToggleIcon kind="underline"></svg>
              </button>
            </div>

            <div class="nds-cluster" data-spacing="sm">
              <button ndsToggle variant="outline" [defaultPressed]="true">
                <svg ndsToggleIcon kind="eye"></svg>
                {{ t('demonstration.labels.showHidden') }}
              </button>
              <button ndsToggle variant="outline">
                <svg ndsToggleIcon kind="list"></svg>
                {{ t('demonstration.labels.compactView') }}
              </button>
              <button ndsToggle variant="outline" [disabled]="true">
                <svg ndsToggleIcon kind="underline"></svg>
                {{ t('demonstration.labels.underline') }}
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
          componentSlug="toggle"
          language="ts"
        />

        <nds-docs-compositions
          id="variantes"
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="toggle"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="toggle"
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
          componentSlug="toggle"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="toggle" />

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
export class NdsToggleDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsToggle, NdsToggleIcon } from '@/components/ui/toggle';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarOutline = viewChild.required<TemplateRef<unknown>>('tplVarOutline');
  private readonly tplVarWithLabel = viewChild.required<TemplateRef<unknown>>('tplVarWithLabel');
  private readonly tplVarSizes = viewChild.required<TemplateRef<unknown>>('tplVarSizes');
  private readonly tplCompToolbar = viewChild.required<TemplateRef<unknown>>('tplCompToolbar');
  private readonly tplCompFilterList = viewChild.required<TemplateRef<unknown>>('tplCompFilterList');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    // A tabela de UX writing escreve textNode: sem toPlainText o
    // `&lt;code&gt;` da linha do ícone apareceria com as tags na tela.
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['ariaLabel', 'label', 'icon'].map((k) => ({
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
    // As três primeiras linhas descrevem estilo (`variants.styles`); a quarta é
    // a escada de tamanho, que o conteúdo compartilhado guarda com um "quando
    // usar" próprio — daí a seção de variantes usar o container de composições.
    return [
      {
        name: t('variants.items.default'),
        description: stripHtml(t('variants.styles.default')),
        trackId: 'default',
        preview: this.tplVarDefault(),
      },
      {
        name: t('variants.items.outline'),
        description: stripHtml(t('variants.styles.outline')),
        trackId: 'outline',
        preview: this.tplVarOutline(),
      },
      {
        name: t('variants.items.withLabel'),
        description: stripHtml(t('variants.styles.withLabel')),
        trackId: 'with-label',
        preview: this.tplVarWithLabel(),
      },
      {
        name: t('variants.items.sizes.name'),
        description: t('variants.items.sizes.description'),
        useWhen: t('variants.items.sizes.use'),
        trackId: 'sizes',
        preview: this.tplVarSizes(),
      },
    ];
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'toolbar',    tpl: this.tplCompToolbar()    },
      { key: 'filterList', tpl: this.tplCompFilterList() },
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
    return ['off', 'on', 'hover', 'focus', 'disabled', 'invalid'].map((k) => ({
      label: toPlainText(t(`states.${k}.label`)),
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
    // Tipos e nomes vêm da API real: `pressed` é um `model` (aceita
    // `[(pressed)]`), a mudança sai pelo output `pressedChange`, e não existe
    // input de classe. As descrições continuam vindo do conteúdo compartilhado.
    const lines: { name: string; type: string; k: string }[] = [
      { name: 'pressed',        type: 'model<boolean>',  k: 'pressed'         },
      { name: 'defaultPressed', type: 'boolean',         k: 'defaultPressed'  },
      { name: 'pressedChange',  type: 'output<boolean>', k: 'onPressedChange' },
      { name: 'disabled',       type: 'boolean',         k: 'disabled'        },
      { name: 'variant',        type: '"default" | "outline"',       k: 'variant'   },
      { name: 'size',           type: '"default" | "sm" | "lg"',     k: 'size'      },
      { name: 'class',          type: 'string',          k: 'className'       },
    ];
    return [
      {
        title: 'NdsToggle',
        cols,
        items: lines.map(({ name, type, k }) => ({
          name,
          type,
          defaultValue: toPlainText(t(`props.table.${k}.default`)),
          required: toPlainText(t(`props.table.${k}.required`)),
          description: toPlainText(t(`props.table.${k}.description`)),
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
    return [
      { token: '--accent',            k: 'accent'           },
      { token: '--accent-foreground', k: 'accentForeground' },
      { token: '--muted',             k: 'muted'            },
      // A borda da variante outline é `--border`; `--input` não entra em
      // regra nenhuma de `toggle.css`. A chave do conteúdo continua `input`
      // porque é o nome da linha, não o nome do token.
      { token: '--border',            k: 'input'            },
      { token: '--ring',              k: 'ring'             },
      { token: '--destructive',       k: 'destructive'      },
      { token: '--radius-button',     k: 'radius'           },
    ].map(({ token, k }) => ({
      token,
      // O seletor vem do conteúdo compartilhado, como nas outras stacks: fixar
      // `.nds-toggle` aqui apagava a diferença entre o estado ativo, o hover e
      // a variante outline, que é justamente o que a coluna deve ensinar.
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
    const byLocale = toggleTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da lista, não um item dela.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'toggleGroup', path: '?path=/docs/ui-togglegroup--docs' },
      { key: 'switch',      path: '?path=/docs/ui-switch--docs'      },
      { key: 'checkbox',    path: '?path=/docs/ui-checkbox--docs'    },
      { key: 'button',      path: '?path=/docs/ui-button--docs'      },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
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
    return [{
      event: 'field_change',
      trigger: toPlainText(t('analytics.table.field_change.trigger')),
      payload: toPlainText(t('analytics.table.field_change.payload')),
    }];
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
      // Este bloco numera critérios como string solta, não como objeto — daí a
      // lista simples em vez do itemsFromDict das outras duas tabelas.
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
        componentSlug: 'toggle',
      });
      track('docs_page_view', {
        component_name: 'toggle',
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
          component_name: 'toggle',
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
