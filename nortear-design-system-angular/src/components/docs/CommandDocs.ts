import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_COMMAND, type CommandSelectDetails } from '@/components/ui/command';
import {
  commandDemoInlineSource,
  commandDemoPaletteSource,
  commandWithGroupsSource,
} from '@/components/ui/command.source';
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

const { t, dict } = useTranslation(commandTranslations as Record<string, unknown>);

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
               'disabled', 'highlightItemOnHover'],
      outputs: ['valueChange'] },
  ],
})
export class NdsCommand {
  readonly itemSelect = output<CommandSelectDetails>();
  // Próprio da paleta, e não do primitivo: lá o padrão é laçar.
  readonly loopFocus = input(false, { transform: booleanAttribute });
}

export interface CommandSelectDetails {
  value: string;   // o [value] do comando — estável, é o que vai ao analytics
  label: string;   // o texto do comando, sem o atalho
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

const IMPORT_CODE = `import { NDS_COMMAND } from '@/components/ui/command';`;

const IMPORT_DIALOG_CODE = `import { NDS_COMMAND } from '@/components/ui/command';
import { NDS_DIALOG } from '@/components/ui/dialog';

// A paleta não traz um CommandDialog próprio: ela é o miolo, o Dialog é a
// moldura, e o CSS compartilhado já tem a classe que junta os dois.
// <div ndsDialogContent class="nds-command-dialog-content" [showCloseButton]="false">`;

/** Chave de grupo que vai ao analytics — estável, nunca o cabeçalho traduzido. */
type GroupKey = 'components' | 'utils';

/** Grupo de cada comando, por lista: o mesmo `value` muda de grupo entre elas. */
type ListGroups = Readonly<Record<string, GroupKey>>;

/**
 * A demonstração e a paleta dela: Button e Input em Componentes, Separator em
 * Utilitários. Os cartões Inline e Command palette de Variantes desenham a
 * mesma lista — o que se compara entre os cartões é o ARRANJO, não os comandos.
 */
const DEMO_GROUPS: ListGroups = {
  button: 'components',
  input: 'components',
  separator: 'utils',
};

/** O cartão Com grupos — a mesma lista da story WithGroups. */
const WITH_GROUPS_CARD_GROUPS: ListGroups = {
  button: 'components',
  input: 'components',
  badge: 'components',
  separator: 'components',
  cn: 'utils',
  clsx: 'utils',
  twmerge: 'utils',
};

/** O par 1 de Do & Don't: dois componentes, sem cabeçalho. */
const DO_DONT_GROUPS: ListGroups = {
  button: 'components',
  input: 'components',
};

/**
 * Faz o campo NASCER com uma busca digitada — o par 1 de Do & Don't compara
 * justamente a paleta sem resultado.
 *
 * Escrever o `value` não basta: o primitivo só filtra o que a pessoa digitou (um
 * valor que chega por binding é tratado como seleção feita, e a lista fica
 * inteira). O evento `input` é o mesmo caminho de uma tecla, e vai depois do
 * primeiro render porque antes dele o campo ainda não está ligado ao primitivo.
 *
 * Exportada só porque o `ngc` exige: o type-check do template importa a classe
 * de cada diretiva com input ligado, e sem `export` ele reprova com NG3004.
 */
@Directive({ selector: 'input[ndsDocsInitialSearch]', standalone: true })
export class NdsDocsInitialSearch {
  readonly ndsDocsInitialSearch = input('');

  constructor() {
    const field = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      const query = this.ndsDocsInitialSearch();
      if (!query) return;
      field.value = query;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

@Component({
  selector: 'nds-command-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_COMMAND, ...NDS_DIALOG, NdsButton, NdsDocsInitialSearch,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  // O Ctrl+K da página: a demonstração exibe a dica do atalho, então a página
  // responde a ela. Ouvinte de `host`, e não `addEventListener` à mão: sai
  // junto com o componente, sem limpeza que alguém possa esquecer.
  host: {
    '(window:keydown)': 'openFromShortcut($event)',
  },
  template: `
    <!-- Par 1: os dois lados JÁ nascem com a mesma busca sem resultado. O que
         muda é haver ou não uma frase para ler: a "don't" omite a região de
         vazio, e é essa ausência que a legenda descreve. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command (itemSelect)="trackSelect($event, doDontGroups, 'inline', 'docs_do_dont')">
          <input
            ndsCommandInput
            ndsDocsInitialSearch="xyz"
            [placeholder]="t('demonstration.labels.searchPlaceholder')"
          />
          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
              <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
            </div>
          </div>
          <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
        </nds-command>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div class="nds-w-full nds-border-default nds-rounded-md">
        <nds-command (itemSelect)="trackSelect($event, doDontGroups, 'inline', 'docs_do_dont')">
          <input
            ndsCommandInput
            ndsDocsInitialSearch="xyz"
            [placeholder]="t('demonstration.labels.searchPlaceholder')"
          />
          <div ndsCommandList>
            <div ndsCommandGroup>
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
              <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
            </div>
          </div>
        </nds-command>
      </div>
    </ng-template>

    <!-- Par 2: o mesmo gatilho, com e sem a tecla DENTRO dele. -->
    <ng-template #tplDoDont2Do>
      <button ndsButton variant="outline">
        {{ t('demonstration.labels.openPalette') }}
        <kbd class="nds-kbd">{{ t('demonstration.labels.shortcutKey') }}</kbd>
      </button>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <button ndsButton variant="outline">{{ t('demonstration.labels.openPalette') }}</button>
    </ng-template>

    <!-- Cartões de Variantes. Inline e Command palette desenham a lista da
         DEMONSTRAÇÃO, cada um no seu arranjo; Com grupos é a story homônima.
         O bloco de código abaixo de cada um publica a mesma lista que o cartão
         desenha — o que se copia é o que se vê. A moldura é a das paletas
         desenhadas direto na página: sem borda nem sombra próprias, quem dá o
         quadro é o container (PRD, §1). -->
    <ng-template #tplVarInline>
      <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command (itemSelect)="trackSelect($event, demoGroups, 'inline', 'docs_variantes')">
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

    <!-- Retrato do padrão: o gatilho e, embaixo, a paleta como ela fica dentro
         do Dialog. A paleta que abre de verdade é a da demonstração; aqui as
         duas peças ficam lado a lado, para comparar com os outros cartões. O
         gatilho é ESTÁTICO — não abre nada —, e por isso não leva
         aria-haspopup nem aria-expanded: anunciaria um diálogo que não existe. -->
    <ng-template #tplVarPalette>
      <div class="nds-stack nds-p-2" data-spacing="xs" data-align="start">
        <button ndsButton variant="outline">
          {{ t('demonstration.labels.openPalette') }}
          <kbd class="nds-kbd">{{ t('demonstration.labels.shortcutKey') }}</kbd>
        </button>

        <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
          <nds-command (itemSelect)="trackSelect($event, demoGroups, 'palette', 'docs_variantes')">
            <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
            <div ndsCommandList>
              <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
                <div ndsCommandItem value="button">
                  {{ t('demonstration.labels.itemButton') }}
                  <span ndsCommandShortcut>Ctrl+B</span>
                </div>
                <div ndsCommandItem value="input">
                  {{ t('demonstration.labels.itemInput') }}
                  <span ndsCommandShortcut>Ctrl+I</span>
                </div>
              </div>

              <div ndsCommandSeparator></div>

              <div ndsCommandGroup [heading]="t('demonstration.labels.groupUtils')">
                <div ndsCommandItem value="separator">{{ t('demonstration.labels.itemSeparator') }}</div>
              </div>
            </div>
            <div ndsCommandEmpty>{{ t('demonstration.labels.emptyMessage') }}</div>
          </nds-command>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarWithGroups>
      <div class="nds-w-full nds-max-w-sm nds-border-default nds-rounded-md nds-shadow-md">
        <nds-command (itemSelect)="trackSelect($event, withGroupsCardGroups, 'inline', 'docs_variantes')">
          <input ndsCommandInput [placeholder]="t('demonstration.labels.searchPlaceholder')" />
          <div ndsCommandList>
            <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
              <div ndsCommandItem value="button">{{ t('demonstration.labels.itemButton') }}</div>
              <div ndsCommandItem value="input">{{ t('demonstration.labels.itemInput') }}</div>
              <div ndsCommandItem value="badge">Badge</div>
              <div ndsCommandItem value="separator">{{ t('demonstration.labels.itemSeparator') }}</div>
            </div>

            <div ndsCommandSeparator></div>

            <div ndsCommandGroup [heading]="t('demonstration.labels.groupUtils')">
              <div ndsCommandItem value="cn">cn()</div>
              <div ndsCommandItem value="clsx">clsx()</div>
              <div ndsCommandItem value="twmerge">twMerge()</div>
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
        <nds-docs-demonstration>
          <div class="nds-stack nds-w-full" data-spacing="md">
            <!-- 1. Inline: sem ícone e sem atalho. -->
            <div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
              <nds-command (itemSelect)="trackSelect($event, demoGroups, 'inline', 'docs_demo')">
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

            <!-- 2. A paleta de verdade, num Dialog: abre pelo gatilho ou pelo
                 Ctrl+K da página, e escolher um comando executa e fecha. A dica
                 da tecla fica DENTRO do gatilho — o nome acessível do botão sai
                 do texto visível, então não há aria-label por cima dele. -->
            <div ndsDialog [open]="paletteOpen()" (openChange)="paletteOpen.set($event)">
              <button
                ndsDialogTrigger
                ndsButton
                variant="outline"
                (click)="trackButtonOpen('docs_demo')"
              >
                {{ t('demonstration.labels.openPalette') }}
                <kbd class="nds-kbd">{{ t('demonstration.labels.shortcutKey') }}</kbd>
              </button>

              <ng-template ndsDialogPortal>
                <div ndsDialogOverlay></div>
                <div
                  ndsDialogContent
                  class="nds-command-dialog-content"
                  [showCloseButton]="false"
                >
                  <h2 ndsDialogTitle class="nds-sr-only">
                    {{ t('demonstration.labels.dialogTitle') }}
                  </h2>
                  <p ndsDialogDescription class="nds-sr-only">
                    {{ t('demonstration.labels.dialogDescription') }}
                  </p>

                  <nds-command (itemSelect)="selectInPalette($event)">
                    <input
                      ndsCommandInput
                      [placeholder]="t('demonstration.labels.searchPlaceholder')"
                    />

                    <div ndsCommandList>
                      <div ndsCommandGroup [heading]="t('demonstration.labels.groupComponents')">
                        <div ndsCommandItem value="button">
                          {{ t('demonstration.labels.itemButton') }}
                          <span ndsCommandShortcut>Ctrl+B</span>
                        </div>
                        <div ndsCommandItem value="input">
                          {{ t('demonstration.labels.itemInput') }}
                          <span ndsCommandShortcut>Ctrl+I</span>
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
              </ng-template>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withDialog')"
          [secondaryCode]="importDialogCode"
          componentSlug="command"
          language="ts"
        />

        <nds-docs-variants
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="command"
          id="variantes"
          language="ts"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="tNav('common.keyboardNav')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="command"
        />

        <nds-docs-notes
          [items]="noteItems()"
          componentSlug="command"
        />

        <nds-docs-analytics
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
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
  protected readonly importCode = IMPORT_CODE;
  protected readonly importDialogCode = IMPORT_DIALOG_CODE;

  protected readonly demoGroups = DEMO_GROUPS;
  protected readonly withGroupsCardGroups = WITH_GROUPS_CARD_GROUPS;
  protected readonly doDontGroups = DO_DONT_GROUPS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /**
   * A paleta da demonstração — a única da página que abre num Dialog, e é ela
   * que o Ctrl+K abre. O cartão de Variantes a desenha aberta, sem Dialog.
   */
  protected readonly paletteOpen = signal(false);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarInline = viewChild.required<TemplateRef<unknown>>('tplVarInline');
  private readonly tplVarPalette = viewChild.required<TemplateRef<unknown>>('tplVarPalette');
  private readonly tplVarWithGroups = viewChild.required<TemplateRef<unknown>>('tplVarWithGroups');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
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

  /**
   * Os três padrões de `variants.items`. Nome e descrição vêm do conteúdo
   * compartilhado; o id do toggle de código é a CHAVE, que não muda com o
   * idioma; e o código publica a mesma lista que o cartão desenha.
   *
   * O "quando usar" (`variants.items.<k>.use`, hoje só em `withGroups`) entra
   * na descrição com o rótulo comum da stack — a mesma costura que o container
   * de composições faz, feita aqui porque o de variantes não tem o campo.
   */
  protected readonly variantItems = computed(() => {
    const d = dict();
    const useWhenLabel = tNav('common.useWhen');
    return [
      { key: 'inline',     tpl: this.tplVarInline(),     code: commandDemoInlineSource() },
      { key: 'palette',    tpl: this.tplVarPalette(),    code: commandDemoPaletteSource() },
      { key: 'withGroups', tpl: this.tplVarWithGroups(), code: commandWithGroupsSource() },
    ].map(({ key, tpl, code }) => {
      const description = stripHtml(t(`variants.items.${key}.description`));
      const use = d[`variants.items.${key}.use`];
      return {
        name: stripHtml(t(`variants.items.${key}.name`)),
        description: use
          ? `${description}<br><br><strong>${useWhenLabel}</strong> ${stripHtml(use)}`
          : description,
        trackId: key,
        code,
        preview: tpl,
      };
    });
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
    // Ordem das cinco stacks: o destaque vem logo depois do vazio — é o estado
    // em que a paleta NASCE (D11), antes de qualquer gesto.
    return ['empty', 'highlighted', 'selected', 'disabled', 'loading', 'longList'].map((k) => ({
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
        title: t('props.commandTitle'),
        cols,
        items: [
          line('filter', 'commandFilter', '(value, search, toText) => boolean', '—'),
          line('value', 'commandValue', 'model<string>', `''`),
          line('valueChange', 'commandOnValueChange', 'output<string>', '—'),
          line('itemSelect', 'commandItemSelect', 'output<CommandSelectDetails>', '—'),
          line('loopFocus', 'commandLoopFocus', 'boolean', 'false'),
          line('limit', 'commandLimit', 'number', '-1'),
        ],
      },
      {
        title: t('props.commandInputTitle'),
        cols,
        items: [
          line('placeholder', 'inputPlaceholder', 'string', '—'),
          line('label', 'inputLabel', 'string', 'placeholder'),
        ],
      },
      {
        title: t('props.commandItemTitle'),
        cols,
        items: [
          line('value', 'itemValue', 'string', '—'),
          line('(onSelect)', 'itemOnSelect', 'output<CommandSelectDetails>', '—'),
          line('disabled', 'itemDisabled', 'boolean', 'false'),
          line('textValue', 'textValue', 'string', '—'),
          // '—' e não a string 'undefined': a coluna é lida por quem consome, e
          // o contrato de docs proíbe 'undefined' escrito na tela.
          line('checked', 'checked', 'boolean | undefined', '—'),
        ],
      },
      {
        // A paleta não tem Dialog próprio: estas são as entradas do `ndsDialog`
        // e do `ndsDialogContent` que a hospedam, com os padrões DELES. Título
        // e descrição são o TEXTO projetado em `ndsDialogTitle` e
        // `ndsDialogDescription` — o tipo é o do conteúdo, `string`.
        title: t('props.commandDialogTitle'),
        cols,
        items: [
          line('open', 'open', 'boolean', 'false'),
          line('(openChange)', 'onOpenChange', 'output<boolean>', '—'),
          line('title', 'dialogTitle', 'string', '—'),
          line('description', 'dialogDescription', 'string', '—'),
          line('showCloseButton', 'dialogShowCloseButton', 'boolean', 'true'),
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
      { token: '--popover',            k: 'popoverBg',   target: '.nds-command' },
      { token: '--popover-foreground', k: 'popoverFg',   target: '.nds-command' },
      { token: '--foreground',         k: 'groupFg',     target: '.nds-command-group' },
      { token: '--muted-foreground',   k: 'mutedFg',     target: '.nds-command-group-heading' },
      { token: '--border',             k: 'inputBorder', target: '.nds-command-input-wrapper' },
      // O destaque é pintado pelo seletor de estado, não pela classe base — a
      // regra do item sem destaque não tem cor de fundo nenhuma.
      { token: '--accent',             k: 'selectedBg',  target: '.nds-command-item[aria-selected="true"]' },
      { token: '--accent-foreground',  k: 'selectedFg',  target: '.nds-command-item[aria-selected="true"]' },
      { token: '--border',             k: 'border',      target: '.nds-command-separator' },
      // Dois raios, e não um: o container lê `--radius` e o item lê
      // `--radius-sm`, o raio aninhado (raio externo menos o inset do grupo).
      { token: '--radius',             k: 'radius',      target: '.nds-command' },
      { token: '--radius-sm',          k: 'radiusSm',    target: '.nds-command-item' },
    ].map(({ token, k, target }) => ({
      token,
      value: target,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Arrow Down', description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: 'Arrow Up',   description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Escape',     description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Ctrl+K',     description: toPlainText(t('accessibility.keyboard.cmdK')) },
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
      { key: 'select',       name: 'Select',        path: '?path=/docs/components-form-select--docs'       },
      { key: 'dropdownMenu', name: 'Dropdown Menu', path: '?path=/docs/components-overlay-dropdownmenu--docs' },
      { key: 'dialog',       name: 'Dialog',        path: '?path=/docs/components-overlay-dialog--docs'       },
    ].map(({ key, name, path }) => ({ name: name, description: t(`related.${key}`), path }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
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
      { e: 'itemSelect',    trigger: 'itemSelectTrigger',    carga: 'itemSelectPayload'    },
      { e: 'paletteOpen',   trigger: 'paletteOpenTrigger',   carga: 'paletteOpenPayload'   },
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
      // Aqui os itens são string solta, não a trinca criterion/level/how. A
      // coluna "Como verificar" é a mesma nas cinco stacks: o conteúdo não
      // separa o método por critério, e inventar um por linha seria dizer mais
      // do que o texto compartilhado diz.
      items: numberedItems(d, 'testes.accessibility').map((text) => ({
        criterion: toPlainText(text),
        level: 'AA',
        how: 'axe-core / manual',
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
   * O payload leva o `value` do comando e a CHAVE do grupo, nunca o rótulo nem
   * o cabeçalho traduzidos — senão o mesmo comando vira três eventos distintos
   * no GA4, um por idioma. `location` é a seção onde a paleta mora.
   */
  protected trackSelect(
    details: CommandSelectDetails,
    groups: ListGroups,
    pattern: 'inline' | 'palette',
    location: string,
  ): void {
    track('command_item_select', {
      component: 'command',
      label: details.value,
      group: groups[details.value] ?? '',
      pattern,
      location,
    });
  }

  /** Escolher na paleta da demonstração executa e FECHA — é o contrato da paleta. */
  protected selectInPalette(details: CommandSelectDetails): void {
    this.trackSelect(details, DEMO_GROUPS, 'palette', 'docs_demo');
    this.paletteOpen.set(false);
  }

  /**
   * Abertura pelo gatilho. Ouvido no clique, e não na mudança de estado do
   * Dialog: a mudança também acontece quando o Ctrl+K abre, e aí o mesmo gesto
   * sairia contado duas vezes, uma com cada `trigger`.
   */
  protected trackButtonOpen(location: string): void {
    track('command_palette_open', { component: 'command', trigger: 'button', location });
  }

  /**
   * Ctrl+K (ou Cmd+K) em qualquer ponto da página abre a paleta da
   * demonstração. Só ABRE: com a paleta já aberta, a tecla não faz nada —
   * nem fecha, nem empilha uma segunda por cima.
   */
  protected openFromShortcut(event: KeyboardEvent): void {
    if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
    // Sem isto o navegador leva o Ctrl+K para a barra de endereço.
    event.preventDefault();
    if (this.paletteOpen()) return;
    this.paletteOpen.set(true);
    track('command_palette_open', { component: 'command', trigger: 'keyboard', location: 'docs_demo' });
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
