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
import { NdsSeparator } from '@/components/ui/separator';
import uiTranslations from '@/i18n/ui.json';
import separatorTranslations from '@shared/content/separator/translations.json';

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

// Não há input de classe nesta stack: classe extra vai no atributo `class` do
// próprio elemento e o Angular mescla com a classe base do componente. A
// descrição é sobrescrita por idioma para a tabela não afirmar uma prop que
// aqui não existe — e para não prender em pt-BR o que sai nos três idiomas.
const { t, dict } = useTranslation(separatorTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className.description':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base do componente. Não existe input dedicado.',
  },
  en: {
    'props.table.className.description':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the component base class. There is no dedicated input.',
  },
  es: {
    'props.table.className.description':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base del componente. No hay input dedicado.',
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

const INTERFACE_CODE = `// <div ndsSeparator> — diretiva de atributo no próprio <div>
export type SeparatorOrientation = 'horizontal' | 'vertical';

@Directive({
  selector: 'div[ndsSeparator]',
  host: { class: 'nds-separator' },
})
export class NdsSeparator {
  readonly orientation = input<SeparatorOrientation>('horizontal');
  readonly decorative = input<boolean>(true);
}`;

@Component({
  selector: 'nds-separator-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsSeparator,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Previews como TemplateRef — ver a nota em DocsDoDont. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p class="nds-text-body">Perfil</p>
        <div ndsSeparator></div>
        <p class="nds-text-body">Faturamento</p>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div class="nds-stack nds-w-full" data-spacing="sm">
        <p class="nds-text-body">Perfil</p>
        <div ndsSeparator></div>
        <div ndsSeparator></div>
        <p class="nds-text-body">Faturamento</p>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div class="nds-cluster nds-docs-demo-row" data-spacing="sm">
        <span class="nds-text-body">Editar</span>
        <div ndsSeparator orientation="vertical"></div>
        <span class="nds-text-body">Duplicar</span>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div class="nds-cluster nds-docs-demo-row" data-spacing="sm">
        <span class="nds-text-body">Editar</span>
        <div ndsSeparator></div>
        <span class="nds-text-body">Duplicar</span>
      </div>
    </ng-template>

    <ng-template #tplVarHorizontal>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <p class="nds-text-body">Seção superior</p>
        <div ndsSeparator orientation="horizontal"></div>
        <p class="nds-text-body">Seção inferior</p>
      </div>
    </ng-template>
    <ng-template #tplVarVertical>
      <div class="nds-cluster nds-docs-demo-row" data-spacing="md">
        <span class="nds-text-body">Item A</span>
        <div ndsSeparator orientation="vertical"></div>
        <span class="nds-text-body nds-text-muted-foreground">Item B</span>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="separator"
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
        <!-- 1. Demonstração -->
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-grid nds-w-full" data-spacing="lg" data-min="18rem">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.horizontal') }}
              </p>
              <p class="nds-text-body">Seção superior</p>
              <div ndsSeparator></div>
              <p class="nds-text-body">Seção inferior</p>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.vertical') }}
              </p>
              <div class="nds-cluster nds-docs-demo-row" data-spacing="md">
                <span class="nds-text-body">Item A</span>
                <div ndsSeparator orientation="vertical"></div>
                <span class="nds-text-body">Item B</span>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.inMenu') }}
              </p>
              <div class="nds-stack" data-spacing="xs">
                <span class="nds-text-body">Perfil</span>
                <span class="nds-text-body">Configurações</span>
                <div ndsSeparator></div>
                <span class="nds-text-body nds-text-destructive">Sair</span>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.inCard') }}
              </p>
              <div class="nds-stack" data-spacing="sm">
                <p class="nds-text-body nds-font-semibold">Resumo</p>
                <div ndsSeparator></div>
                <p class="nds-text-body nds-text-muted-foreground">Detalhes do pedido</p>
              </div>
            </div>
          </div>
        </nds-docs-demonstration>

        <!-- 2. Anatomia -->
        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <!-- 3. Quando usar -->
        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <!-- 4. Do / Don't -->
        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <!-- 5. Importação -->
        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          componentSlug="separator"
          language="ts"
        />

        <!-- 6. Variantes -->
        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="separator"
          id="variantes"
        />

        <!-- 7. Estados -->
        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <!-- 8. Propriedades -->
        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="t('props.extensibilityCode')"
        />

        <!-- 9. Tokens -->
        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <!-- 10. Acessibilidade -->
        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <!-- 11. Relacionados -->
        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="separator"
        />

        <!-- 12. Notas -->
        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="separator"
        />

        <!-- 13. Analytics -->
        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <!-- 14. Testes -->
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
export class NdsSeparatorDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = `import { NdsSeparator } from '@/components/ui/separator';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');

  // `dict()` amarra cada computed ao signal de locale — sem essa leitura a
  // página monta certa e congela no idioma inicial.
  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
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
        t('usage.guidelines.item5'),
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
      items: ['decorativeChoice', 'vsGap', 'vsBorder', 'vertical'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: t(`usage.uxWriting.table.${key}.format`),
        do: t(`usage.uxWriting.table.${key}.good`),
        dont: t(`usage.uxWriting.table.${key}.bad`),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return {
      title: t('usage.do.title'),
      items: [t('usage.do.item1'), t('usage.do.item2'), t('usage.do.item3'), t('usage.do.item4')],
    };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return {
      title: t('usage.dont.title'),
      items: [
        t('usage.dont.item1'), t('usage.dont.item2'),
        t('usage.dont.item3'), t('usage.dont.item4'),
      ],
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
        name: t('variants.items.horizontal'),
        description: t('variants.styles.horizontal'),
        trackId: 'horizontal',
        preview: this.tplVarHorizontal(),
      },
      {
        name: t('variants.items.vertical'),
        description: t('variants.styles.vertical'),
        trackId: 'vertical',
        preview: this.tplVarVertical(),
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
    return ['decorative', 'semantic'].map((k) => ({
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
    return [
      {
        title: 'NdsSeparator',
        cols,
        items: ['orientation', 'decorative', 'className'].map((p) => ({
          // A chave do conteúdo compartilhado é `className` (herança das outras
          // stacks); aqui a linha documenta o atributo `class` nativo.
          name: p === 'className' ? 'class' : p,
          type: t(`props.table.${p}.type`),
          defaultValue: t(`props.table.${p}.default`),
          required: t(`props.table.${p}.required`),
          description: t(`props.table.${p}.description`),
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
    // A tabela deste componente não tem coluna de token CSS por linha — o
    // conteúdo compartilhado descreve classe + parte. O token fica no valor.
    return ['background', 'heightHorizontal', 'widthHorizontal', 'widthVertical', 'heightVertical']
      .map((k) => ({
        token: t(`tokens.table.${k}.class`),
        value: '.nds-separator',
        description: t(`tokens.table.${k}.part`),
      }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [
      t('accessibility.items.item1'), t('accessibility.items.item2'),
      t('accessibility.items.item3'), t('accessibility.items.item4'),
      t('accessibility.items.item5'),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    // O separador não é focável: a primeira linha explica a ausência de
    // interação e a segunda o que acontece no Tab. Mesma escolha do Vanilla.
    return [
      { key: '—',   description: toPlainText(t('accessibility.keyboard.description')) },
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.noKeyboard')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = separatorTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const sr = { ...(byLocale[locale]?.accessibility?.screenReader ?? {}) };
    // `title` é o rótulo da subseção, não um anúncio — o container recebe só
    // os valores e renderizaria o título como se fosse item da lista.
    delete sr['title'];
    return Object.values(sr);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'card',           path: '?path=/docs/ui-card--docs'            },
      { key: 'sheet',          path: '?path=/docs/ui-sheet--docs'           },
      { key: 'sidebar',        path: '?path=/docs/ui-sidebar--docs'         },
      { key: 'navigationMenu', path: '?path=/docs/ui-navigation-menu--docs' },
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
    return { event: tNav('common.event'), trigger: tNav('common.eventTrigger'), payload: tNav('common.payload') };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // Este componente não emite evento próprio — é decorativo e não interativo.
    // A única linha é o page_view da própria docs page, e o texto explicativo
    // do conteúdo compartilhado entra como gatilho.
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
    // Este componente descreve os critérios de a11y como frase única (item1..5),
    // não como {criterion, level, how} — o container recebe a frase no critério
    // e deixa nível e verificação vazios em vez de inventar valor.
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
        componentSlug: 'separator',
      });
      track('docs_page_view', {
        component_name: 'separator',
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
          component_name: 'separator',
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

/**
 * Reconstrói linhas de tabela a partir do dicionário achatado.
 *
 * O conteúdo compartilhado numera as linhas como `item1`, `item2`… e `t()` só
 * devolve folha. Percorre até a primeira lacuna, para não repetir na docs page
 * um `[1,2,3,4,5]` que envelhece quando o ux-writer acrescenta uma linha.
 */
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
