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
import { NDS_COMMAND, type CommandSelectDetails } from '@/components/ui/command';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import commandTranslations from '@shared/content/command/translations.json';

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

/**
 * Sobrescritas de call site.
 *
 * O conteúdo compartilhado deste slug passou a ser prosa API-neutra e absorveu
 * quase tudo o que morava aqui — dez chaves que repetiam palavra por palavra o
 * texto compartilhado saíram. Override que duplica o comum não protege nada:
 * ele só garante que, na próxima correção do conteúdo, esta página fique para
 * trás sozinha e sem erro nenhum.
 *
 * Sobra UMA chave, e por divergência real de comportamento. A guideline 6
 * afirma que nenhuma biblioteca aplica <code>role="combobox"</code> nem
 * <code>aria-expanded</code> a um botão comum. A primeira metade vale aqui; a
 * segunda não — o gatilho do Popover deste stack já mantém `aria-expanded`,
 * `aria-controls` e `aria-haspopup` sozinho (é o que a story `AsCombobox`
 * afirma), e mandar escrever à mão o que o primitivo entrega faria quem lê
 * duplicar um atributo de estado, que é como ele passa a mentir.
 */
const { t, dict } = useTranslation(commandTranslations as Record<string, unknown>, {
  'pt-BR': {
    'usage.guidelines.item6':
      'No Combobox: escreva <code>role="combobox"</code> no gatilho do Popover — o primitivo trata o gatilho como botão comum e não lhe dá papel de campo de escolha.',
  },
  en: {
    'usage.guidelines.item6':
      'In the Combobox pattern: write <code>role="combobox"</code> on the Popover trigger — the primitive treats it as a plain button and gives it no choice-field role.',
  },
  es: {
    'usage.guidelines.item6':
      'En el patrón Combobox: escribe <code>role="combobox"</code> en el trigger del Popover — el primitivo lo trata como un botón común y no le da rol de campo de elección.',
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

const INTERFACE_CODE = `// A paleta é uma combobox filtrável, e é isso que o Radix NG entrega em
// @radix-ng/primitives/autocomplete — não há primitivo "command".
@Component({
  selector: 'nds-command',
  hostDirectives: [
    { directive: RdxAutocompleteRoot,
      inputs: ['value', 'defaultValue', 'filter', 'locale', 'limit',
               'loopFocus', 'disabled', 'autoHighlight', 'highlightItemOnHover'],
      outputs: ['valueChange'] },
  ],
})
export class NdsCommand {
  readonly itemSelect = output<CommandSelectDetails>();
}

export interface CommandSelectDetails {
  value: string;   // o [value] do comando — estável, é o que vai ao analytics
  label: string;   // o texto visível
}

// O item nunca recebe foco: o destaque é virtual e o campo de busca guarda
// aria-activedescendant.
@Component({
  selector: 'div[ndsCommandItem]',
  hostDirectives: [
    { directive: RdxAutocompleteItem, inputs: ['value', 'textValue', 'disabled'] },
  ],
})
export class NdsCommandItem {
  readonly checked = input<boolean | undefined>(undefined);
  readonly onSelect = output<CommandSelectDetails>();
}`;

// O snippet compartilhado descreve `<button ndsCommandItem>` e um output
// `(select)`. Aqui o comando é `<div>` — a folha `.nds-command-item` não zera a
// aparência nativa de botão, e um `<button>` ali apareceria com fundo e borda
// do navegador (mesmo caminho do DropdownMenu e do ContextMenu). O output se
// chama `onSelect` para não colidir com o evento `select` do DOM.
const ANATOMY_CODE = `<nds-command (itemSelect)="executar($event)">
  <input ndsCommandInput placeholder="Buscar..." />

  <div ndsCommandList>
    <div ndsCommandGroup heading="Componentes">
      <div ndsCommandItem value="button" textValue="Button" (onSelect)="abrir('button')">
        Button
        <span ndsCommandShortcut>⌘B</span>
      </div>
      <div ndsCommandItem value="input">Input</div>
    </div>

    <div ndsCommandSeparator></div>

    <div ndsCommandGroup heading="Utilitários">
      <div ndsCommandItem value="cn">cn()</div>
    </div>
  </div>

  <!-- Fora da lista: role="status" não é filho permitido de role="listbox" -->
  <div ndsCommandEmpty>Nenhum resultado encontrado.</div>
</nds-command>`;

const IMPORT_CODE = `import { NDS_COMMAND } from '@/components/ui/command';`;

const IMPORT_DIALOG_CODE = `import { NDS_COMMAND } from '@/components/ui/command';
import { NDS_DIALOG } from '@/components/ui/dialog';

// A paleta não traz um CommandDialog próprio: ela é o miolo, o Dialog é a
// moldura, e o CSS compartilhado já tem a classe que junta os dois.
// <div ndsDialogContent class="nds-command-dialog-content" [showCloseButton]="false">`;

const IMPORT_POPOVER_CODE = `import { NDS_COMMAND } from '@/components/ui/command';
import { NDS_POPOVER } from '@/components/ui/popover';

// <button ndsPopoverTrigger ndsButton role="combobox">…</button>
// <ng-template ndsPopoverContent><nds-command>…</nds-command></ng-template>`;

const CUSTOMIZATION_CODE = `/* A paleta lê os tokens do tema — personalizar é
   redefinir o token, não sobrescrever a regra. */
.tema-compacto {
  --radius: 0.375rem;
}`;

@Component({
  selector: 'nds-command-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_COMMAND, ...NDS_POPOVER, ...NDS_DIALOG, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- A metade "do" mostra a região de vazio; a "don't" a omite, e é essa
         ausência que a legenda descreve. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command>
          <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
            </div>
          </div>
          <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
        </nds-command>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command>
          <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
            </div>
          </div>
        </nds-command>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <button ndsButton variant="outline">
        {{ t('demonstration.labels.openPalette') }}
        <span ndsCommandShortcut>{{ t('demonstration.labels.shortcutKey') }}</span>
      </button>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <button ndsButton variant="outline">{{ t('demonstration.labels.openPalette') }}</button>
    </ng-template>

    <ng-template #tplVarInline>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command>
          <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
              <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
              <div ndsCommandItem value="separator">{{ t('demonstration.labels.itemSeparator') }}</div>
            </div>
          </div>
          <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
        </nds-command>
      </div>
    </ng-template>

    <ng-template #tplVarCombobox>
      <div ndsPopover>
        <!-- Botão puro com as classes do design system: o NdsButton liga
             [attr.role] no host e apagaria o papel de combobox escrito aqui
             (armadilha 11 — duas diretivas disputando o mesmo atributo).
             E o papel de combobox não tira nome do conteúdo, então o nome vem
             de aria-labelledby costurando finalidade e valor visível. -->
        <span id="docs-combobox-rotulo" class="nds-sr-only">
          {{ t('demonstration.labels.groupComponents') }}
        </span>
        <button
          ndsPopoverTrigger
          type="button"
          class="nds-button nds-button-outline"
          role="combobox"
          aria-labelledby="docs-combobox-rotulo docs-combobox-valor"
        >
          <span id="docs-combobox-valor">
            {{ t('demonstration.labels.selectPlaceholder') }}
          </span>
        </button>

        <ng-template ndsPopoverContent>
          <nds-command>
            <input ndsCommandInput [placeholder]="t('demonstration.labels.comboboxSearch')" />
            <div ndsCommandList>
              <div ndsCommandGroup>
                <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
                <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
              </div>
            </div>
            <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
          </nds-command>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarPalette>
      <div ndsDialog>
        <button ndsDialogTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.openPalette') }}
          <span ndsCommandShortcut>{{ t('demonstration.labels.shortcutKey') }}</span>
        </button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>
          <div ndsDialogContent class="nds-command-dialog-content" [showCloseButton]="false">
            <h3 ndsDialogTitle class="nds-sr-only">{{ t('demonstration.labels.dialogTitle') }}</h3>
            <p ndsDialogDescription class="nds-sr-only">
              {{ t('demonstration.labels.dialogDescription') }}
            </p>

            <nds-command>
              <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
              <div ndsCommandList>
                <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
                  <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
                  <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
                </div>
              </div>
              <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
            </nds-command>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithGroups>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command>
          <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
          <div ndsCommandList>
            <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
              <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup [heading]="t('demonstration.labels.groupUtils')">
              <div ndsCommandItem value="separator">{{ t('demonstration.labels.itemSeparator') }}</div>
            </div>
          </div>
          <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
        </nds-command>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="command"
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
            <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
              <nds-command (itemSelect)="registrarEscolha($event, 'inline')">
                <input
                  ndsCommandInput
                  [placeholder]="t('demonstration.labels.searchPlaceholder')"
                />

                <div ndsCommandList>
                  <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
                    <div ndsCommandItem value="button">
                      {{ t('demonstration.labels.itemButton') }}
                    </div>
                    <div ndsCommandItem value="input">
                      {{ t('demonstration.labels.itemInput') }}
                    </div>
                  </div>

                  <div ndsCommandSeparator></div>

                  <div ndsCommandGroup [heading]="t('demonstration.labels.groupUtils')">
                    <div ndsCommandItem value="separator">
                      {{ t('demonstration.labels.itemSeparator') }}
                    </div>
                  </div>
                </div>

                <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
              </nds-command>
            </div>

            <!-- O mesmo miolo dentro de um Dialog: é o padrão command palette,
                 e a dica do atalho fica no gatilho para a pessoa descobri-lo. -->
            <div ndsDialog (openChange)="registrarAberturaDaPaleta($event)">
              <button ndsDialogTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.openPalette') }}
                <span ndsCommandShortcut>{{ t('demonstration.labels.shortcutKey') }}</span>
              </button>

              <ng-template ndsDialogPortal>
                <div ndsDialogOverlay></div>
                <div
                  ndsDialogContent
                  class="nds-command-dialog-content"
                  [showCloseButton]="false"
                >
                  <h3 ndsDialogTitle class="nds-sr-only">
                    {{ t('demonstration.labels.dialogTitle') }}
                  </h3>
                  <p ndsDialogDescription class="nds-sr-only">
                    {{ t('demonstration.labels.dialogDescription') }}
                  </p>

                  <nds-command (itemSelect)="registrarEscolha($event, 'palette')">
                    <input
                      ndsCommandInput
                      [placeholder]="t('demonstration.labels.searchPlaceholder')"
                    />

                    <div ndsCommandList>
                      <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
                        <div ndsCommandItem value="button">
                          {{ t('demonstration.labels.itemButton') }}
                        </div>
                        <div ndsCommandItem value="input">
                          {{ t('demonstration.labels.itemInput') }}
                        </div>
                      </div>
                    </div>

                    <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
                  </nds-command>
                </div>
              </ng-template>
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
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withDialog')"
          [secondaryCode]="importDialogCode"
          [tertiaryDescription]="t('import.withPopover')"
          [tertiaryCode]="importPopoverCode"
          componentSlug="command"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="command"
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
          componentSlug="command"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="command"
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
export class NdsCommandDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importDialogCode = IMPORT_DIALOG_CODE;
  protected readonly importPopoverCode = IMPORT_POPOVER_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarInline = viewChild.required<TemplateRef<unknown>>('tplVarInline');
  private readonly tplVarCombobox = viewChild.required<TemplateRef<unknown>>('tplVarCombobox');
  private readonly tplVarPalette = viewChild.required<TemplateRef<unknown>>('tplVarPalette');
  private readonly tplVarWithGroups = viewChild.required<TemplateRef<unknown>>('tplVarWithGroups');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return numberedItems(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: d['usage.guidelines.title'] ?? '',
      // `t` porque a guideline 6 é sobrescrita no call site; `dict` devolve o
      // texto cru do conteúdo compartilhado.
      items: numberedItems(d, 'usage.guidelines').map((_v, i) =>
        t(`usage.guidelines.item${i + 1}`),
      ),
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
      { key: 'inline',     tpl: this.tplVarInline()     },
      { key: 'combobox',   tpl: this.tplVarCombobox()   },
      { key: 'palette',    tpl: this.tplVarPalette()    },
      { key: 'withGroups', tpl: this.tplVarWithGroups() },
    ].map(({ key, tpl }) => ({
      // As chaves de `variants.items` não têm forma única: `inline`,
      // `combobox` e `palette` são string solta; `withGroups` é objeto com
      // `name`/`description`. Tentar a string primeiro e cair no objeto evita
      // a chave crua aparecendo escrita na tela.
      name: valueOuField(`variants.items.${key}`, 'name') || defaultName(key),
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
    return ['empty', 'selected', 'disabled', 'loading', 'longList'].map((k) => ({
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
    const linha = (name: string, chave: string, tipo: string, padrao: string) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: not,
      description: toPlainText(t(`props.table.${chave}`)),
    });

    return [
      {
        title: t('props.commandTitle'),
        cols,
        items: [
          linha('filter', 'commandFilter', '(valor, busca, paraTexto) => boolean', '—'),
          linha('value', 'commandValue', 'model<string>', `''`),
          linha('valueChange', 'commandOnValueChange', 'output<string>', '—'),
          {
            name: 'itemSelect',
            type: 'output<CommandSelectDetails>',
            defaultValue: '—',
            required: not,
            description:
              'Emitido a cada comando escolhido, por clique ou por Enter, com o valor e o rótulo.',
          },
          {
            name: 'loopFocus',
            type: 'boolean',
            defaultValue: 'true',
            required: not,
            description:
              'A seta para baixo no último comando volta ao primeiro em vez de parar.',
          },
          {
            name: 'limit',
            type: 'number',
            defaultValue: '-1',
            required: not,
            description: 'Teto de comandos exibidos. Negativo não limita.',
          },
        ],
      },
      {
        title: t('props.commandInputTitle'),
        cols,
        items: [
          linha('placeholder', 'inputPlaceholder', 'string', '—'),
          {
            name: 'label',
            type: 'string',
            defaultValue: 'placeholder',
            required: not,
            description:
              'Nome acessível do campo e da lista. Vazio, o placeholder faz esse papel.',
          },
        ],
      },
      {
        title: t('props.commandItemTitle'),
        cols,
        items: [
          linha('value', 'itemValue', 'string', '—'),
          linha('(onSelect)', 'itemOnSelect', 'output<CommandSelectDetails>', '—'),
          linha('disabled', 'itemDisabled', 'boolean', 'false'),
          {
            name: 'textValue',
            type: 'string',
            defaultValue: 'texto do elemento',
            required: not,
            description:
              'Texto usado pelo filtro. Necessário quando o comando traz um atalho, que entraria na busca junto.',
          },
          {
            name: 'checked',
            type: 'boolean | undefined',
            // '—' e não a string 'undefined': a coluna é lida por quem
            // consome, e o contrato de docs proíbe 'undefined' escrito na tela.
            defaultValue: '—',
            required: not,
            description:
              'Indefinido, o comando não é marcável. Definido, vira data-checked e o comando ganha a marca de escolhido.',
          },
        ],
      },
      {
        title: t('props.commandDialogTitle'),
        cols,
        items: [
          linha('title', 'dialogTitle', 'conteúdo de h2/h3', '—'),
          linha('description', 'dialogDescription', 'conteúdo de p', '—'),
          linha('showCloseButton', 'dialogShowCloseButton', 'boolean', 'true'),
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
    // Seletor REAL, lido de `docs/shared/styles/nds/command.css`. A coluna
    // existe para quem vai abrir a folha e achar a regra: um seletor que não
    // está lá manda a pessoa procurar o que não existe.
    //
    // `inputBg` ficou de fora: `.nds-command-input` declara
    // `background: transparent` e quem pinta é o container. Uma linha dizendo
    // que o campo tem fundo próprio seria falsa, e repetir `.nds-command`
    // duplicaria a primeira.
    return [
      { token: '--popover',            k: 'popoverBg',   alvo: '.nds-command' },
      { token: '--popover-foreground', k: 'popoverFg',   alvo: '.nds-command' },
      { token: '--muted-foreground',   k: 'mutedFg',     alvo: '.nds-command-group-heading' },
      { token: '--border',             k: 'inputBorder', alvo: '.nds-command-input-wrapper' },
      // O destaque é pintado pelo seletor de estado, não pela classe base — a
      // regra do item sem destaque não tem cor de fundo nenhuma.
      { token: '--accent',             k: 'selectedBg',  alvo: '.nds-command-item[aria-selected="true"]' },
      { token: '--accent-foreground',  k: 'selectedFg',  alvo: '.nds-command-item[aria-selected="true"]' },
      { token: '--border',             k: 'border',      alvo: '.nds-command-separator' },
      { token: '--radius',             k: 'radius',      alvo: '.nds-command · .nds-command-item' },
    ].map(({ token, k, alvo }) => ({
      token,
      value: alvo,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [
      ...[1, 2, 3, 4].map((i) => t(`accessibility.item${i}`)),
      ...['roleListbox', 'roleOption', 'ariaSelected', 'roleCombobox', 'ariaExpanded', 'srOnly'].map(
        (k) => t(`accessibility.aria.${k}`),
      ),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: '↓',       description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',       description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Enter',   description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Esc',     description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Tab',     description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Cmd + K', description: toPlainText(t('accessibility.keyboard.cmdK')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onOpen', 'onFilter', 'onSelect', 'onClose'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'select',       nome: 'Select',        path: '?path=/docs/ui-select--docs'       },
      { key: 'dropdownMenu', nome: 'Dropdown Menu', path: '?path=/docs/ui-dropdownmenu--docs' },
      { key: 'popover',      nome: 'Popover',       path: '?path=/docs/ui-popover--docs'      },
      { key: 'dialog',       nome: 'Dialog',        path: '?path=/docs/ui-dialog--docs'       },
      { key: 'inputGroup',   nome: 'Input',         path: '?path=/docs/ui-input--docs'        },
    ].map(({ key, nome, path }) => ({ name: nome, description: t(`related.${key}`), path }));
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
      { e: 'itemSelect',    gatilho: 'itemSelectTrigger',    carga: 'itemSelectPayload'    },
      { e: 'paletteOpen',   gatilho: 'paletteOpenTrigger',   carga: 'paletteOpenPayload'   },
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
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // Aqui os itens são string solta, não a trinca criterion/level/how.
      items: numberedItems(d, 'testes.accessibility').map((texto) => ({
        criterion: toPlainText(texto),
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

  /**
   * A docs page É o produto consumidor: o evento disparado aqui é de verdade.
   *
   * O payload leva o `value` do comando, nunca o rótulo traduzido — senão o
   * mesmo comando vira três eventos distintos no GA4, um por idioma.
   */
  protected registrarEscolha(
    detalhe: CommandSelectDetails,
    padrao: 'inline' | 'combobox' | 'palette',
  ): void {
    track('command_item_select', { label: detalhe.value, group: 'command-docs', pattern: padrao });
  }

  /** Só a abertura interessa; o fechamento não é adoção de nada. */
  protected registrarAberturaDaPaleta(aberto: boolean): void {
    if (aberto) track('command_palette_open', { trigger: 'button' });
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
        componentSlug: 'command',
      });
      track('docs_page_view', {
        component_name: 'command',
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
          component_name: 'command',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** Nome de exibição dos três padrões, que o conteúdo compartilhado não nomeia. */
const DEFAULT_NAMES: Record<string, string> = {
  inline: 'Inline',
  combobox: 'Combobox',
  palette: 'Command Palette',
};

function defaultName(key: string): string {
  return DEFAULT_NAMES[key] ?? key;
}

/**
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 * `t()` devolve a própria chave quando ela aponta para um objeto — e é assim
 * que a chave crua acaba escrita na tela, sem erro nenhum.
 */
function valueOuField(base: string, campo: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const chave = `${base}.${campo}`;
  const ofField = t(chave);
  return ofField === chave ? '' : ofField;
}

/** Itens `base.itemN` na ordem numérica, quantos existirem. */
function numberedItems(d: Record<string, string>, base: string): string[] {
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
