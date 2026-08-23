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
import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';
import uiTranslations from '@/i18n/ui.json';
import contextMenuTranslations from '@shared/content/context-menu/translations.json';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';

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
const { t, dict } = useTranslation(contextMenuTranslations as Record<string, unknown>);

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

const INTERFACE_CODE = `// O primitivo do Radix NG dá só raiz e gatilho; do popup para dentro
// as peças de @radix-ng/primitives/menu valem sem alteração.
@Component({
  selector: 'div[ndsContextMenu]',
  hostDirectives: [
    { directive: RdxContextMenuRoot,
      inputs: ['open', 'modal', 'loopFocus', 'highlightItemOnHover'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsContextMenu {}

// O submenu tem raiz PRÓPRIA: o menu de topo nasce no ponto do ponteiro,
// o submenu nasce colado ao item que o abre.
@Component({ selector: 'div[ndsContextMenuSub]', hostDirectives: [RdxMenuRoot] })
export class NdsContextMenuSub {}`;

// O snippet compartilhado descreve `<nds-context-menu>` e `<button
// ndsContextMenuItem>`. Aqui a raiz é diretiva de atributo (paridade de markup
// com o Vanilla) e o item é `<div>`: a folha não zera a aparência nativa de
// botão, e um `<button>` ali aparece com fundo e borda do navegador. Mesmo
// caminho do DropdownMenu.
const ANATOMY_CODE = `<div ndsContextMenu>
  <div ndsContextMenuTrigger>Clique com o botão direito aqui</div>

  <ng-template ndsContextMenuContent>
    <div ndsContextMenuGroup>
      <div ndsContextMenuLabel>Arquivo</div>
      <div ndsContextMenuItem>
        Editar
        <span ndsContextMenuShortcut>⌘E</span>
      </div>
      <div ndsContextMenuCheckboxItem [checked]="mostrarGrade">Mostrar grade</div>
    </div>

    <div ndsContextMenuSeparator></div>

    <div ndsContextMenuSub>
      <div ndsContextMenuSubTrigger>Compartilhar</div>
      <ng-template ndsContextMenuSubContent>
        <div ndsContextMenuItem>Por e-mail</div>
        <div ndsContextMenuItem>Por link</div>
      </ng-template>
    </div>

    <div ndsContextMenuSeparator></div>

    <div ndsContextMenuItem variant="destructive">
      Excluir
      <span ndsContextMenuShortcut>⌫</span>
    </div>
  </ng-template>
</div>`;

const CUSTOMIZATION_CODE = `/* O menu lê os tokens do tema — personalizar é
   redefinir o token, não sobrescrever a regra. */
.tema-compacto {
  --radius: 0.375rem;
}`;

@Component({
  selector: 'nds-context-menu-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_CONTEXT_MENU,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Cada preview traz o gatilho E a alternativa acessível ao lado: a regra
         mais importante deste componente é que o gesto nunca seja o único
         caminho. Mostrar o menu sozinho ensinaria o contrário. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-cluster nds-w-full" data-spacing="sm">
        <div ndsContextMenu>
          <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
          <ng-template ndsContextMenuContent>
            <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          </ng-template>
        </div>
        <button class="nds-button nds-button-outline nds-button-sm" type="button">
          {{ t('demonstration.labels.edit') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          <div ndsContextMenuItem>{{ t('demonstration.labels.duplicate') }}</div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuItem variant="destructive">
            {{ t('demonstration.labels.delete') }}
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem variant="destructive">
            {{ t('demonstration.labels.delete') }}
          </div>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          <div ndsContextMenuItem>{{ t('demonstration.labels.duplicate') }}</div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont3Do>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>
            {{ t('demonstration.labels.edit') }}
            <span ndsContextMenuShortcut>{{ t('demonstration.labels.editShortcut') }}</span>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont3Dont>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          <div ndsContextMenuItem>{{ t('demonstration.labels.duplicate') }}</div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarDestructive>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuItem variant="destructive">
            {{ t('demonstration.labels.delete') }}
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarSubmenu>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuItem>{{ t('demonstration.labels.edit') }}</div>
          <div ndsContextMenuSub>
            <div ndsContextMenuSubTrigger>{{ t('demonstration.labels.share') }}</div>
            <ng-template ndsContextMenuSubContent>
              <div ndsContextMenuItem>{{ t('demonstration.labels.shareEmail') }}</div>
              <div ndsContextMenuItem>{{ t('demonstration.labels.shareLink') }}</div>
            </ng-template>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarSelecao>
      <div ndsContextMenu class="nds-w-full">
        <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>
        <ng-template ndsContextMenuContent>
          <div ndsContextMenuCheckboxItem [checked]="true">
            {{ t('demonstration.labels.duplicate') }}
          </div>
          <div ndsContextMenuSeparator></div>
          <div ndsContextMenuRadioGroup value="email">
            <div ndsContextMenuRadioItem value="email">
              {{ t('demonstration.labels.shareEmail') }}
            </div>
            <div ndsContextMenuRadioItem value="link">
              {{ t('demonstration.labels.shareLink') }}
            </div>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="context-menu"
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
            <div ndsContextMenu>
              <div ndsContextMenuTrigger [class]="areaClasse" data-align="center" data-justify="center">{{ t('demonstration.labels.triggerLabel') }}</div>

              <ng-template ndsContextMenuContent>
                <div ndsContextMenuItem (onSelect)="registrarEscolha('edit')">
                  {{ t('demonstration.labels.edit') }}
                  <span ndsContextMenuShortcut>{{ t('demonstration.labels.editShortcut') }}</span>
                </div>
                <div ndsContextMenuItem (onSelect)="registrarEscolha('duplicate')">
                  {{ t('demonstration.labels.duplicate') }}
                </div>

                <div ndsContextMenuSeparator></div>

                <div ndsContextMenuSub>
                  <div ndsContextMenuSubTrigger>{{ t('demonstration.labels.share') }}</div>
                  <ng-template ndsContextMenuSubContent>
                    <div ndsContextMenuItem>{{ t('demonstration.labels.shareEmail') }}</div>
                    <div ndsContextMenuItem>{{ t('demonstration.labels.shareLink') }}</div>
                  </ng-template>
                </div>

                <div ndsContextMenuSeparator></div>

                <div
                  ndsContextMenuItem
                  variant="destructive"
                  (onSelect)="registrarEscolha('delete')"
                >
                  {{ t('demonstration.labels.delete') }}
                  <span ndsContextMenuShortcut>{{ t('demonstration.labels.deleteShortcut') }}</span>
                </div>
              </ng-template>
            </div>

            <!-- A alternativa acessível, sempre visível. Sem ela o gesto seria a
                 única porta, e quem não o conhece ficaria sem as ações. -->
            <div class="nds-cluster" data-spacing="sm">
              <button class="nds-button nds-button-outline nds-button-sm" type="button">
                {{ t('demonstration.labels.edit') }}
              </button>
              <button class="nds-button nds-button-outline nds-button-sm" type="button">
                {{ t('demonstration.labels.duplicate') }}
              </button>
            </div>
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="tNav('nav.import')"
          [code]="importCode"
          componentSlug="context-menu"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="context-menu"
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
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="context-menu"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="context-menu"
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
export class NdsContextMenuDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  /**
   * A moldura tracejada é o único sinal de "clique com o botão direito aqui".
   * Este stack era o único cujas docs pages não a desenhavam: o gatilho saía sem
   * borda nenhuma, e a pessoa não tinha onde mirar. A classe vem do módulo
   * compartilhado, que é o mesmo das stories e das outras quatro stacks.
   */
  protected readonly areaClasse = AREA_CLICK_DIREITO;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = `import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarSubmenu = viewChild.required<TemplateRef<unknown>>('tplVarSubmenu');
  private readonly tplVarSelecao = viewChild.required<TemplateRef<unknown>>('tplVarSelecao');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return Object.keys(d)
      .filter((k) => /^anatomy\.item\d+$/.test(k))
      // Ordem numérica: com 11 itens, `item10` viria antes de `item2`.
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
      .map((k) => d[k]);
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: d['usage.guidelines.title'] ?? '', items: numberedItems(d, 'usage.guidelines') };
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

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'default',      tpl: this.tplVarDefault()     },
      { key: 'destructive',  tpl: this.tplVarDestructive() },
      { key: 'withSubmenu',  tpl: this.tplVarSubmenu()     },
      { key: 'withCheckbox', tpl: this.tplVarSelecao()     },
    ].map(({ key, tpl }) => ({
      // As chaves de `variants.items` não têm forma única: umas são string solta,
      // outras são objeto com `name`/`description`. Tentar a string primeiro e
      // cair no objeto evita a chave crua aparecendo escrita na tela.
      name: valueOuField(`variants.items.${key}`, 'name') || key,
      description: valueOuField(`variants.items.${key}`, 'description'),
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
    return ['closed', 'open', 'focused', 'disabled', 'checked', 'subOpen'].map((k) => ({
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
      description: toPlainText(t(`props.items.${key}`)),
    });

    return [
      {
        title: t('props.rootTitle'),
        cols,
        items: [
          line('openChange', 'onOpenChange', 'output<boolean>', '—'),
          {
            name: 'modal',
            type: 'boolean',
            defaultValue: 'true',
            required: not,
            description:
              'Trava a rolagem da página e prende o foco enquanto o menu está aberto.',
          },
        ],
      },
      {
        title: t('props.contentTitle'),
        cols,
        items: [
          line('side', 'side', `'top' | 'bottom' | 'left' | 'right'`, `'bottom'`),
          line('align', 'align', `'start' | 'center' | 'end'`, `'start'`),
          line('sideOffset', 'sideOffset', 'number', '0'),
          line('alignOffset', 'alignOffset', 'number', '0'),
        ],
      },
      {
        title: t('props.itemTitle'),
        cols,
        items: [
          line('variant', 'variant', `'default' | 'destructive'`, `'default'`),
          line('inset', 'inset', 'boolean', 'false'),
          line('disabled', 'disabled', 'boolean', 'false'),
          line('(onSelect)', 'onSelect', 'output<void>', '—'),
        ],
      },
      {
        title: t('props.checkboxItemTitle'),
        cols,
        items: [
          line('checked', 'checked', 'model<boolean>', 'false'),
          line('checkedChange', 'onCheckedChange', 'output<boolean>', '—'),
        ],
      },
      {
        title: t('props.radioGroupTitle'),
        cols,
        items: [
          line('value', 'value', 'model<string>', '—'),
          line('valueChange', 'onValueChange', 'output<string>', '—'),
        ],
      },
      {
        title: t('props.radioItemTitle'),
        cols,
        items: [line('value', 'value', 'string', '—')],
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
      { token: '--popover',              k: 'popoverBg',        target: '.nds-dropdown-menu-content' },
      { token: '--popover-foreground',   k: 'popoverFg',        target: '.nds-dropdown-menu-content' },
      { token: '--accent',               k: 'accentBg',         target: '.nds-dropdown-menu-item' },
      { token: '--accent-foreground',    k: 'accentFg',         target: '.nds-dropdown-menu-item' },
      { token: '--destructive',          k: 'destructive',      target: '[data-variant="destructive"]' },
      { token: '--destructive',          k: 'destructiveFocus', target: '[data-variant="destructive"]' },
      { token: '--muted-foreground',     k: 'mutedFg',          target: '.nds-dropdown-menu-shortcut' },
      // Medido no navegador: o separador é `--muted` (245,245,245), não
      // `--border` (230,230,230) — este último pinta a BORDA do popup, que
      // agora tem linha própria. O raio do item é `--radius-sm` (6px), não o
      // `--radius` (10px) do popup.
      { token: '--muted',                k: 'border',           target: '.nds-dropdown-menu-separator' },
      { token: '--border',               k: 'popupBorder',      target: '.nds-dropdown-menu-content' },
      { token: '--elevation-md',         k: 'shadow',           target: '.nds-dropdown-menu-content' },
      { token: '--radius',               k: 'radius',           target: '.nds-dropdown-menu-content' },
      { token: '--radius-sm',            k: 'radiusItem',       target: '.nds-dropdown-menu-item' },
      { token: '--z-popover',            k: 'zIndex',           target: '.nds-dropdown-menu-positioner' },
    ].map(({ token, k, target }) => ({
      token,
      value: target,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    // O aviso vem PRIMEIRO: é a regra que decide se o componente pode ser usado.
    return [
      t('accessibility.warning'),
      ...['roleMenu', 'roleMenuItem'].map((k) => t(`accessibility.aria.${k}`)),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Menu / Shift+F10', description: toPlainText(t('accessibility.keyboard.rightClick')) },
      { key: '↓',               description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',               description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: '→',               description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: '←',               description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: 'Enter',           description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',           description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Esc',             description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Tab',             description: toPlainText(t('accessibility.keyboard.tab')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onOpen', 'onNavigate', 'onSelect', 'shortcuts', 'alternative'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'dropdownMenu', name: 'Dropdown Menu', path: '?path=/docs/ui-dropdownmenu--docs' },
      { key: 'menubar',      name: 'Menubar',       path: '?path=/docs/ui-menubar--docs'      },
      { key: 'dialog',       name: 'Dialog',        path: '?path=/docs/ui-dialog--docs'       },
      { key: 'alertDialog',  name: 'Alert Dialog',  path: '?path=/docs/ui-alertdialog--docs'  },
      { key: 'tooltip',      name: 'Tooltip',       path: '?path=/docs/ui-tooltip--docs'      },
    ].map(({ key, name, path }) => ({ name: name, description: t(`related.${key}`), path }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
      { e: 'menuOpen',      trigger: 'menuOpenTrigger',      carga: 'menuOpenPayload'      },
      { e: 'itemClick',     trigger: 'itemClickTrigger',     carga: 'itemClickPayload'     },
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
      // Aqui os itens são string solta, não a trinca criterion/level/how.
      items: numberedItems(d, 'testes.accessibility').map((text) => ({
        criterion: toPlainText(text),
        level: '',
        how: '',
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

  /** A docs page É o produto consumidor: o evento disparado aqui é de verdade. */
  protected registrarEscolha(item: string): void {
    track('menu_item_click', { label: item, menu: 'context-menu' });
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
        componentSlug: 'context-menu',
      });
      track('docs_page_view', {
        component_name: 'context-menu',
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
          component_name: 'context-menu',
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
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 *  devolve a própria chave quando ela aponta para um objeto — e é assim
 * que a chave crua acaba escrita na tela, sem erro nenhum.
 */
function valueOuField(base: string, field: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const key = `${base}.${field}`;
  const ofField = t(key);
  return ofField === key ? '' : ofField;
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
