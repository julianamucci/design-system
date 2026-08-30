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
import { NdsResizable, NdsResizablePanel, NdsResizableHandle } from '@/components/ui/resizable';
import uiTranslations from '@/i18n/ui.json';
import resizableTranslations from '@shared/content/resizable/translations.json';

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

const { t, dict } = useTranslation(resizableTranslations as Record<string, unknown>, {
  '*': {
    // O conteúdo descreve a API da lib de painéis do React. Aqui `id` não é
    // input: o Angular já repassa o atributo nativo, e quem persiste o layout é
    // o grupo, por `autoSaveId`. E o callback de layout é um output.
    'props.table.id.description':
      'Atributo id nativo do elemento — não é input. Persistir o layout é escolha do grupo, por autoSaveId.',
    'props.table.onLayout.type': 'output<number[]>',
    'props.table.onLayout.description':
      'Emitido pelo grupo com as porcentagens finais, uma vez por gesto — não uma por pixel.',
  },
});

// Sem `composicoes`: o conteúdo compartilhado deste slug não traz
// `variants.compositions`, e uma seção sem conteúdo é cobrada pelo auditor.
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

const INTERFACE_CODE = `// Sem primitivo de painel no @radix-ng/primitives: o divisor com arrasto,
// teclado e valor ARIA é escrito aqui.
@Directive({ selector: 'div[ndsResizable]' })
export class NdsResizable {
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
  readonly autoSaveId = input<string>('');       // '' desliga a persistência
  readonly layout = output<number[]>();          // porcentagens finais
}

@Directive({ selector: 'div[ndsResizablePanel]' })
export class NdsResizablePanel {
  readonly defaultSize = input<number | undefined>(undefined);
  readonly minSize = input(10, { transform: numberAttribute });
  readonly maxSize = input(100, { transform: numberAttribute });
}

@Component({ selector: 'div[ndsResizableHandle]' })
export class NdsResizableHandle {
  readonly withHandle = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  // aria-label é escrito no elemento e é obrigatório: um separator focável
  // sem nome é anunciado apenas como "separador".
}`;

const ANATOMY_CODE = `<div ndsResizable direction="horizontal">
  <div ndsResizablePanel [defaultSize]="30" [minSize]="20" [maxSize]="50">
    <!-- Painel esquerdo -->
  </div>

  <div
    ndsResizableHandle
    [withHandle]="true"
    aria-label="Redimensionar painéis — use as setas para ajustar"
  ></div>

  <div ndsResizablePanel [defaultSize]="70" [minSize]="50" [maxSize]="80">
    <!-- Painel direito -->
  </div>
</div>`;

const VARIANT_HORIZONTAL_CODE = `<div ndsResizable direction="horizontal">
  <div ndsResizablePanel [defaultSize]="30" [minSize]="20" [maxSize]="50">…</div>
  <div ndsResizableHandle [withHandle]="true" aria-label="Redimensionar painéis — use as setas"></div>
  <div ndsResizablePanel [defaultSize]="70" [minSize]="50">…</div>
</div>`;

const VARIANT_VERTICAL_CODE = `<div ndsResizable direction="vertical">
  <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">…</div>
  <div ndsResizableHandle [withHandle]="true" aria-label="Redimensionar painéis — use as setas"></div>
  <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">…</div>
</div>`;

const VARIANT_NESTED_CODE = `<div ndsResizable direction="horizontal">
  <div ndsResizablePanel [defaultSize]="25" [minSize]="15" [maxSize]="40">…</div>
  <div ndsResizableHandle [withHandle]="true" aria-label="Redimensionar painéis — use as setas"></div>

  <div ndsResizablePanel [defaultSize]="75" [minSize]="50">
    <div ndsResizable direction="vertical" class="nds-h-full">
      <div ndsResizablePanel [defaultSize]="70" [minSize]="30">…</div>
      <div ndsResizableHandle [withHandle]="true" aria-label="Redimensionar editor e console — use as setas"></div>
      <div ndsResizablePanel [defaultSize]="30" [minSize]="15">…</div>
    </div>
  </div>
</div>`;

// A caixa de cada demo é `.nds-demo-box` com `data-min`: piso de altura, e não
// altura cravada — o painel cresce com o conteúdo e com a fonte do navegador,
// e ainda sobra área para arrastar. O degrau vem da escada `--box-height-*`
// compartilhada, no lugar do `nds-min-h-50` que só esta stack usava.
// As classes vão literais no template, e não por uma constante ligada em
// `[class]`: assim o auditor de `unknown_class_reference` consegue lê-las.

@Component({
  selector: 'nds-resizable-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsResizable, NdsResizablePanel, NdsResizableHandle,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Cada preview repetido precisa de nome acessível DISTINTO: dois
         separators com o mesmo rótulo na mesma página deixam de ser
         localizáveis por quem navega pela lista de controles. -->
    <ng-template #tplDoDont1Do>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="40" [minSize]="25" [maxSize]="60">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.left') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('do-limites')"></div>
        <div ndsResizablePanel [defaultSize]="60" [minSize]="25">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.right') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="40" [minSize]="0" [maxSize]="100">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.left') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('dont-limites')"></div>
        <div ndsResizablePanel [defaultSize]="60" [minSize]="0" [maxSize]="100">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.right') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.left') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('do-rotulo')"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.right') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.left') }}
          </div>
        </div>
        <!-- Rótulo genérico DE PROPÓSITO: é o contraexemplo do par. Ainda assim
             precisa ser único na página, senão vira ambiguidade real. -->
        <div ndsResizableHandle [withHandle]="true" aria-label="Handle (2)"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.right') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarHorizontal>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="30" [minSize]="20" [maxSize]="50">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.sidebar') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('variante-horizontal')"></div>
        <div ndsResizablePanel [defaultSize]="70" [minSize]="50">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.content') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarVertical>
      <div ndsResizable direction="vertical" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.top') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('variante-vertical')"></div>
        <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.bottom') }}
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarAninhado>
      <div ndsResizable direction="horizontal" class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md">
        <div ndsResizablePanel [defaultSize]="25" [minSize]="15" [maxSize]="40">
          <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
            {{ t('demonstration.labels.sidebar') }}
          </div>
        </div>
        <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('variante-aninhada-externa')"></div>
        <div ndsResizablePanel [defaultSize]="75" [minSize]="50">
          <div ndsResizable direction="vertical" class="nds-h-full">
            <div ndsResizablePanel [defaultSize]="70" [minSize]="30">
              <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
                {{ t('demonstration.labels.content') }}
              </div>
            </div>
            <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('variante-aninhada-interna')"></div>
            <div ndsResizablePanel [defaultSize]="30" [minSize]="15">
              <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
                {{ t('demonstration.labels.bottom') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="resizable"
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
              <span class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.horizontal') }}
              </span>
              <div
                ndsResizable
                direction="horizontal"
                class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md"
                (layout)="aoRedimensionar('demo_horizontal', $event)"
              >
                <div ndsResizablePanel [defaultSize]="30" [minSize]="20" [maxSize]="50">
                  <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
                    {{ t('demonstration.labels.sidebar') }}
                  </div>
                </div>
                <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('demo-horizontal')"></div>
                <div ndsResizablePanel [defaultSize]="70" [minSize]="50" [maxSize]="80">
                  <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
                    {{ t('demonstration.labels.content') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.vertical') }}
              </span>
              <div
                ndsResizable
                direction="vertical"
                class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md"
                (layout)="aoRedimensionar('demo_vertical', $event)"
              >
                <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">
                  <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
                    {{ t('demonstration.labels.top') }}
                  </div>
                </div>
                <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('demo-vertical')"></div>
                <div ndsResizablePanel [defaultSize]="50" [minSize]="20" [maxSize]="80">
                  <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
                    {{ t('demonstration.labels.bottom') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <span class="nds-text-caption nds-text-muted-foreground">
                {{ t('demonstration.labels.nested') }}
              </span>
              <div
                ndsResizable
                direction="horizontal"
                class="nds-w-full nds-demo-box nds-border-default nds-rounded-md nds-overflow-hidden nds-bg-background" data-min="md"
                (layout)="aoRedimensionar('demo_nested', $event)"
              >
                <div ndsResizablePanel [defaultSize]="25" [minSize]="15" [maxSize]="40">
                  <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
                    {{ t('demonstration.labels.left') }}
                  </div>
                </div>
                <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('demo-aninhada-externa')"></div>
                <div ndsResizablePanel [defaultSize]="75" [minSize]="50">
                  <div
                    ndsResizable
                    direction="vertical"
                    class="nds-h-full"
                    (layout)="aoRedimensionar('demo_nested_inner', $event)"
                  >
                    <div ndsResizablePanel [defaultSize]="70" [minSize]="30">
                      <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium" data-align="center" data-justify="center" tabindex="0">
                        {{ t('demonstration.labels.content') }}
                      </div>
                    </div>
                    <div ndsResizableHandle [withHandle]="true" [attr.aria-label]="label('demo-aninhada-interna')"></div>
                    <div ndsResizablePanel [defaultSize]="30" [minSize]="15">
                      <div class="nds-cluster nds-h-full nds-w-full nds-p-4 nds-text-body nds-font-medium nds-bg-muted nds-text-muted-foreground" data-align="center" data-justify="center" tabindex="0">
                        {{ t('demonstration.labels.bottom') }}
                      </div>
                    </div>
                  </div>
                </div>
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
          componentSlug="resizable"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="resizable"
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
          [extensibilityCode]="extensibilityCode()"
          language="ts"
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
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="resizable"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="resizable" />

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
export class NdsResizableDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly importCode =
    `import {\n  NdsResizable,\n  NdsResizablePanel,\n  NdsResizableHandle,\n} from '@/components/ui/resizable';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplVarAninhado = viewChild.required<TemplateRef<unknown>>('tplVarAninhado');

  /**
   * Nome acessível de cada punho.
   *
   * A página mostra dez divisores; com o mesmo rótulo em todos, a lista de
   * controles do leitor de tela vira dez linhas idênticas e nenhuma delas diz
   * onde está. O sufixo é o que os distingue.
   *
   * A base sai do exemplo "correto" da tabela de UX Writing do conteúdo
   * compartilhado — é lá que a regra de escrita deste rótulo mora, e assim ele
   * acompanha o idioma. As aspas do exemplo saem.
   */
  protected label(sufixo: string): string {
    const base = toPlainText(t('usage.uxWriting.table.ariaLabel.good')).replace(/^"|"$/g, '');
    return `${base} (${sufixo})`;
  }

  protected aoRedimensionar(group: string, sizes: number[]): void {
    // Payload com valores ESTÁVEIS — o rótulo traduzido dividiria o evento em
    // três no GA4, um por idioma.
    track('panel_resize', {
      component: 'resizable',
      group_id: group,
      sizes: sizes.map((n) => Math.round(n)).join('/'),
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: navLabel(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: navLabel(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => numberedItems(dict(), 'anatomy'));

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

  protected readonly uxWriting = computed(() => {
    const d = dict();
    // Derivado do dict, nunca contado à mão: a tabela ganha e perde linhas no
    // conteúdo compartilhado sem esta página saber.
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

  protected readonly usageDo = computed(() => ({
    title: t('usage.do.title'),
    items: numberedItems(dict(), 'usage.do'),
  }));

  protected readonly usageDont = computed(() => ({
    title: t('usage.dont.title'),
    items: numberedItems(dict(), 'usage.dont'),
  }));

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
      { key: 'horizontal', code: VARIANT_HORIZONTAL_CODE, tpl: this.tplVarHorizontal() },
      { key: 'vertical',   code: VARIANT_VERTICAL_CODE,   tpl: this.tplVarVertical()   },
      { key: 'nested',     code: VARIANT_NESTED_CODE,     tpl: this.tplVarAninhado()   },
    ].map(({ key, code, tpl }) => ({
      // `variants.items.<k>` é STRING neste slug e OBJETO em outros — o helper
      // cobre as duas formas, e sem ele `t()` devolveria a própria chave.
      name: valueOuField(`variants.items.${key}`, 'name') || key,
      description: stripHtml(toPlainText(t(`variants.styles.${key}`))),
      trackId: key,
      code,
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
    return ['idle', 'hover', 'dragging', 'focus', 'disabled'].map((k) => ({
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
    // `—` e nunca a string "undefined": travessão é o que a tabela usa quando
    // não há valor padrão, e é o que o conteúdo compartilhado já traz.
    const line = (name: string, key: string) => ({
      name,
      type: t(`props.table.${key}.type`),
      defaultValue: t(`props.table.${key}.default`) || '—',
      required: t(`props.table.${key}.required`),
      description: toPlainText(t(`props.table.${key}.description`)),
    });

    return [
      {
        cols,
        items: [
          line('direction', 'direction'),
          line('defaultSize', 'defaultSize'),
          line('minSize', 'minSize'),
          line('maxSize', 'maxSize'),
          line('id', 'id'),
          line('withHandle', 'withHandle'),
          line('layout', 'onLayout'),
        ],
      },
    ];
  });

  protected readonly extensibilityCode = computed(() => {
    dict();
    return t('props.extensibilityCode');
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
      { token: '--ring', k: 'ring' },
      { token: '--foreground', k: 'foreground' },
      { token: '--radius-xs', k: 'radiusXs' },
      { token: '--radius', k: 'radius' },
      { token: '--spacing-1', k: 'spacing1' },
      { token: '--spacing-4', k: 'spacing4' },
      { token: '--spacing-6', k: 'spacing6' },
      { token: '--duration-fast', k: 'durationFast' },
    ].map(({ token, k }) => ({
      token,
      value: toPlainText(t(`tokens.table.${k}.class`)),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => numberedItems(dict(), 'accessibility.items'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab', description: toPlainText(t('accessibility.keyboard.tab')) },
      {
        key: '← / →',
        description: `${toPlainText(t('accessibility.keyboard.arrowLeft'))} · ${toPlainText(t('accessibility.keyboard.arrowRight'))}`,
      },
      {
        key: '↑ / ↓',
        description: `${toPlainText(t('accessibility.keyboard.arrowUp'))} · ${toPlainText(t('accessibility.keyboard.arrowDown'))}`,
      },
      { key: 'Home',  description: toPlainText(t('accessibility.keyboard.home'))  },
      { key: 'End',   description: toPlainText(t('accessibility.keyboard.end'))   },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['handle', 'navigation', 'limits'].map((k) =>
      toPlainText(t(`accessibility.screenReader.${k}`)),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'scrollArea',  path: '?path=/docs/primitives-layout-scrollarea--docs'  },
      { key: 'sheet',       path: '?path=/docs/primitives-overlay-sheet--docs'       },
      { key: 'separator',   path: '?path=/docs/primitives-layout-separator--docs'   },
      { key: 'aspectRatio', path: '?path=/docs/primitives-layout-aspectratio--docs' },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() =>
    numberedItems(dict(), 'notes').map((content) => ({ title: '', content })),
  );

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
      {
        event: 'panel_resize',
        trigger: toPlainText(t('analytics.table.panel_resize.trigger')),
        payload: toPlainText(t('analytics.table.panel_resize.payload')),
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
    const d = dict();
    // Neste slug os critérios são STRING SOLTA (`testes.accessibility.itemN`),
    // não a trinca criterion/level/how — o helper cobre as duas formas.
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']);
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : numberedItems(d, 'testes.accessibility').map((text) => ({
          criterion: toPlainText(text),
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
        componentSlug: 'resizable',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'resizable',
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
          component_name: 'resizable',
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
 * `t()` devolve a própria chave quando ela aponta para um objeto — e é assim
 * que a chave crua acaba escrita na tela, sem erro nenhum.
 */
function valueOuField(base: string, field: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const key = `${base}.${field}`;
  const ofField = t(key);
  return ofField === key ? '' : ofField;
}

/**
 * Rótulo do menu lateral.
 *
 * Tenta primeiro o conteúdo do componente e só então o ui.json. Alguns slugs
 * trazem o próprio bloco `nav`, outros não — e `t()` devolve a PRÓPRIA CHAVE
 * quando ela não existe, então sem esta ponte o menu de quem não traz o bloco
 * mostrava "nav.overview" escrito na tela, sem erro nenhum.
 */
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
