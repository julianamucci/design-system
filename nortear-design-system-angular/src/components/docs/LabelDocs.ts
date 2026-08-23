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
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import labelTranslations from '@shared/content/label/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// O NdsLabel não tem input nenhum: `for`, `class` e o texto são todos nativos
// do <label>. As três linhas da tabela de props do conteúdo compartilhado
// descrevem props que aqui não existem, então a descrição é sobrescrita por
// idioma para a tabela dizer a verdade desta stack.
const { t, dict } = useTranslation(labelTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.htmlFor': 'Id do controle associado. Vai no atributo for nativo do elemento label.',
    'props.table.className': 'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children': 'Texto do rótulo, escrito como conteúdo do elemento label.',
  },
  en: {
    'props.table.htmlFor': 'Id of the associated control. Goes on the native for attribute of the label element.',
    'props.table.className': 'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children': 'Label text, written as the content of the label element.',
  },
  es: {
    'props.table.htmlFor': 'Id del control asociado. Va en el atributo for nativo del elemento label.',
    'props.table.className': 'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children': 'Texto de la etiqueta, escrito como contenido del elemento label.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Este componente traz `nav.*` no próprio translations.json, ao contrário de
// button e separator, que usam o ui.json compartilhado. Usamos o do componente
// quando existe — é o que o Vanilla faz.
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

const INTERFACE_CODE = `// <label ndsLabel> — diretiva de atributo, sem inputs
@Directive({
  selector: 'label[ndsLabel]',
  host: { class: 'nds-label', '[attr.data-slot]': '"label"' },
})
export class NdsLabel {}

// for, class e o texto são nativos do <label>:
// <label ndsLabel for="email">Email</label>`;

const CODE_DEFAULT = `<label ndsLabel for="nome">Nome completo</label>
<input class="nds-input" id="nome" type="text" />`;

@Component({
  selector: 'nds-label-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd1-do">Email profissional</label>
        <input class="nds-input" id="dd1-do" type="email" />
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <span class="nds-text-body">Email profissional</span>
        <input class="nds-input" type="email" aria-label="Email profissional" />
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-do">
          Senha
          <span class="nds-text-destructive" aria-hidden="true">*</span>
        </label>
        <input class="nds-input" id="dd2-do" type="password" aria-required="true" />
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <label ndsLabel for="dd2-dont">Senha (obrigatório)</label>
        <input class="nds-input" id="dd2-dont" type="password" />
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div class="nds-stack nds-max-w-sm" data-spacing="sm">
        <label ndsLabel for="var-default">Nome completo</label>
        <input class="nds-input" id="var-default" type="text" />
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="label"
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
          <!-- O texto do rótulo VEM do conteúdo compartilhado, como nas outras
               stacks. A legenda acima de cada par repetia o mesmo texto, e a
               demonstração aparecia com o rótulo escrito duas vezes. -->
          <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 16rem">
            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-default">{{ t('demonstration.labels.default') }}</label>
              <input class="nds-input" id="demo-default" type="text" />
            </div>

            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-required">
                {{ t('demonstration.labels.required') }}
                <span class="nds-text-destructive" aria-hidden="true">{{ t('demonstration.labels.requiredMarker') }}</span>
              </label>
              <input class="nds-input" id="demo-required" type="email" aria-required="true" />
            </div>

            <div class="nds-stack" data-spacing="sm">
              <!-- nds-peer no CONTROLE é o que esmaece o rótulo junto -->
              <label ndsLabel for="demo-disabled">{{ t('demonstration.labels.disabled') }}</label>
              <input class="nds-input nds-peer" id="demo-disabled" type="text" disabled />
            </div>

            <div class="nds-stack" data-spacing="sm">
              <label ndsLabel for="demo-with-input">{{ t('demonstration.labels.withInput') }}</label>
              <input class="nds-input" id="demo-with-input" type="text" placeholder="ex: Recife" />
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          componentSlug="label"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="label"
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
          componentSlug="label"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="label"
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
export class NdsLabelDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsLabel } from '@/components/ui/label';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [t('anatomy.item1'), t('anatomy.item2'), t('anatomy.item3')];
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [
        t('usage.guidelines.item1'), t('usage.guidelines.item2'),
        t('usage.guidelines.item3'), t('usage.guidelines.item4'),
      ],
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

  protected readonly usageDo = computed(() => {
    dict();
    return {
      title: t('usage.do.title'),
      items: [t('usage.do.item1'), t('usage.do.item2'), t('usage.do.item3')],
    };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [t('usage.dont.item1'), t('usage.dont.item2'), t('usage.dont.item3')],
    };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    return [
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair1.do')),
        dontCaption: toPlainText(t('doDont.pair1.dont')),
        doPreview: this.tplDoDont1Do(),
        dontPreview: this.tplDoDont1Dont(),
      },
      {
        doLabel: tNav('common.do'),
        dontLabel: tNav('common.dont'),
        doCaption: toPlainText(t('doDont.pair2.do')),
        dontCaption: toPlainText(t('doDont.pair2.dont')),
        doPreview: this.tplDoDont2Do(),
        dontPreview: this.tplDoDont2Dont(),
      },
    ];
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.items.default.label'),
        description: t('variants.items.default.description'),
        code: CODE_DEFAULT,
        trackId: 'default',
        preview: this.tplVarDefault(),
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
    return ['default', 'disabled', 'required'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: t(`states.${k}.trigger`),
      behavior: t(`states.${k}.behavior`),
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
    // Nenhuma linha é input: as três descrevem atributo nativo do <label>.
    // O tipo diz "atributo HTML" em vez de um tipo TypeScript que não existe.
    return [
      {
        title: 'NdsLabel',
        cols,
        items: [
          // toPlainText mesmo com override: a célula é textNode e o VALOR
          // COMPARTILHADO destas chaves tem markup. Sem a guarda, remover o
          // override um dia faria a tag aparecer literal na tabela.
          { name: 'for',        type: 'string', defaultValue: '—', required: not, description: toPlainText(t('props.table.htmlFor')) },
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

  // A coluna "Token CSS" mostrava a DESCRIÇÃO da linha, não o nome do token: o
  // map usava a mesma chave nas duas colunas, e a tabela que o consumidor copia
  // para customizar não trazia um único nome de custom property.
  protected readonly tokenItems = computed(() => {
    dict();
    return (
      [
        ['--foreground', '.nds-label', 'foreground'],
        ['--text-control', '.nds-label', 'fontSize'],
        ['--font-weight-medium', '.nds-label', 'fontWeight'],
        ['--spacing-2', '.nds-label', 'gap'],
        ['--destructive', '.nds-text-destructive', 'destructive'],
      ] as const
    ).map(([token, value, key]) => ({
      token,
      value,
      description: t(`tokens.table.${key}`),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [
      t('accessibility.item1'), t('accessibility.item2'),
      t('accessibility.item3'), t('accessibility.item4'),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '—',   description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = labelTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'input',      path: '?path=/docs/ui-input--docs'       },
      { key: 'formLabel',  path: '?path=/docs/ui-form--docs'        },
      { key: 'formField',  path: '?path=/docs/ui-form--docs'        },
      { key: 'checkbox',   path: '?path=/docs/ui-checkbox--docs'    },
      { key: 'radioGroup', path: '?path=/docs/ui-radio-group--docs' },
    ].map(({ key, path }) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      description: t(`related.${key}`),
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
      event: tNav('common.event'),
      trigger: tNav('common.eventTrigger'),
      payload: tNav('common.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // Sem tabela no conteúdo compartilhado — o Label não emite evento próprio.
    // A única linha é o page_view da própria docs page.
    return [
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
    dict();
    // Critérios como frase única (item1..4), não {criterion, level, how} —
    // mesma forma do separator. Nível fica "—" em vez de inventar um valor.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4].map((i) => ({
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
        componentSlug: 'label',
      });
      track('docs_page_view', {
        component_name: 'label',
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
          component_name: 'label',
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
