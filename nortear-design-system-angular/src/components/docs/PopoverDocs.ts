import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { RdxPopoverOpenChange } from '@radix-ng/primitives/popover';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';
import { NdsCheckbox } from '@/components/ui/checkbox';
import { NdsInput } from '@/components/ui/input';
import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import popoverTranslations from '@shared/content/popover/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
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

// `notes.item1` do conteúdo compartilhado lista a lib de CADA stack por nome
// ("base-ui (React), reka-ui (Vue)…"). Cada docs page é lida isolada, então a
// comparação cross-stack vaza — o override devolve a nota com a lib DESTE
// stack, nos três idiomas. É a única substituição aqui: nenhuma chave `*Code`
// passa por override, que estrangularia o snippet dentro de um stack só.
const { t, dict } = useTranslation(popoverTranslations as Record<string, unknown>, {
  'pt-BR': {
    'notes.item1':
      '<strong>Lib upstream</strong>: <code>@radix-ng/primitives</code>, ' +
      'na anatomia Root / Trigger / Positioner / Popup.',
  },
  en: {
    'notes.item1':
      '<strong>Upstream lib</strong>: <code>@radix-ng/primitives</code>, ' +
      'following the Root / Trigger / Positioner / Popup anatomy.',
  },
  es: {
    'notes.item1':
      '<strong>Lib upstream</strong>: <code>@radix-ng/primitives</code>, ' +
      'con la anatomía Root / Trigger / Positioner / Popup.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Os rótulos de navegação saem do `ui.json`, não do conteúdo do componente:
// `popover/translations.json` não tem `nav.compositions`, e ler de lá deixaria
// a seção Composições com a própria chave impressa como título.
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

const SWATCH_CLASSES = 'nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring';

// A variante `angular` de `anatomy.structureCode` no conteúdo compartilhado
// descreve um elemento `<nds-popover>` que este stack não tem: a raiz é uma
// diretiva de ATRIBUTO sobre um `<div>` nativo, para o markup bater com o do
// Vanilla. O painel também é um `<ng-template>` e não um elemento — ele mora em
// portal no body, então precisa ser molde, não markup posicionado. Enquanto o
// conteúdo compartilhado não for corrigido, a estrutura mostrada aqui é a que
// compila.
const ANATOMY_CODE = `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Abrir</button>

  <ng-template ndsPopoverContent side="bottom" align="center">
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Título</h3>
      <p ndsPopoverDescription>Descrição opcional.</p>
    </div>

    <!-- conteúdo interativo -->
    <button ndsPopoverClose ndsButton size="sm">Fechar</button>
  </ng-template>
</div>`;

const IMPORT_CODE = `import { NDS_POPOVER } from '@/components/ui/popover';

// ou, peça a peça:
import {
  NdsPopover,
  NdsPopoverTrigger,
  NdsPopoverContent,
  NdsPopoverHeader,
  NdsPopoverTitle,
  NdsPopoverDescription,
  NdsPopoverClose,
} from '@/components/ui/popover';`;

const IMPORT_CODE_BUTTON = `import { NDS_POPOVER } from '@/components/ui/popover';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_POPOVER, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// A raiz é o único @Component da família — ela monta portal,
// positioner e painel. As outras peças só acrescentam atributos.
@Component({
  selector: 'div[ndsPopover]',
  hostDirectives: [
    { directive: RdxPopoverRoot,
      inputs:  ['open', 'defaultOpen', 'modal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsPopover {}

@Directive({
  selector: 'button[ndsPopoverTrigger]',
  hostDirectives: [RdxPopoverTrigger],
})
export class NdsPopoverTrigger {}

@Directive({ selector: 'ng-template[ndsPopoverContent]' })
export class NdsPopoverContent {
  // side | align | sideOffset | alignOffset
}

@Directive({ selector: '[ndsPopoverTitle]',       hostDirectives: [RdxPopoverTitle] })
@Directive({ selector: '[ndsPopoverDescription]', hostDirectives: [RdxPopoverDescription] })
@Directive({ selector: 'button[ndsPopoverClose]', hostDirectives: [RdxPopoverClose] })`;

// `props.extensibilityCode` do conteúdo compartilhado mostra `<nds-popover>` e
// um `<nds-form />` — nenhum dos dois existe aqui. O que este stack tem de
// extensível é o par `[open]` / `(openChange)`, que também habilita `[(open)]`.
const EXTENSIBILITY_CODE = `<!-- Controle externo do estado aberto/fechado -->
<div ndsPopover [(open)]="aberto">
  <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

  <ng-template ndsPopoverContent side="bottom" align="start" [sideOffset]="8">
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Editar perfil</h3>
    </div>

    <!-- fechar sem passar pelo estado externo -->
    <button ndsPopoverClose ndsButton size="sm">Concluir</button>
  </ng-template>
</div>`;

const VARIANT_CODE = {
  default: `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Ver atalhos</button>

  <ng-template ndsPopoverContent>
    <p class="nds-text-body">Use Ctrl+K para abrir a busca.</p>
  </ng-template>
</div>`,
  withTitle: `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Configurações de exibição</button>

  <ng-template ndsPopoverContent>
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Configurações de exibição</h3>
      <p ndsPopoverDescription>Ajuste a aparência do conteúdo da página.</p>
    </div>
  </ng-template>
</div>`,
  form: `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Editar perfil</button>

  <ng-template ndsPopoverContent align="start">
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Editar perfil</h3>
    </div>

    <div class="nds-stack" data-spacing="sm">
      <label ndsLabel for="nome">Nome</label>
      <input ndsInput id="nome" value="Ana Ribeiro" />
    </div>

    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar</button>
      <button ndsPopoverClose ndsButton size="sm">Atualizar</button>
    </div>
  </ng-template>
</div>`,
};

const COMPOSITION_CODE = {
  editProfile: VARIANT_CODE.form,
  tableFilter: `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Filtros</button>

  <ng-template ndsPopoverContent align="start">
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Filtrar por status</h3>
    </div>

    <div class="nds-cluster" data-spacing="sm">
      <button ndsCheckbox id="ativo"></button>
      <label ndsLabel for="ativo">Ativo</label>
    </div>

    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <button ndsButton variant="ghost" size="sm">Limpar</button>
      <button ndsPopoverClose ndsButton size="sm">Aplicar</button>
    </div>
  </ng-template>
</div>`,
  colorPicker: `<!-- A cor sai de token do tema, nunca de style inline:
     trocar de marca reescreve a paleta sem tocar no template. -->
<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Escolher cor da etiqueta</button>

  <ng-template ndsPopoverContent>
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Cor da etiqueta</h3>
    </div>

    <div class="nds-cluster" data-spacing="sm">
      <button
        type="button"
        class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-primary"
        aria-label="Primária"
      ></button>
      <!-- … demais amostras -->
    </div>
  </ng-template>
</div>`,
  quickSettings: `<div ndsPopover>
  <button ndsPopoverTrigger ndsButton variant="outline">Configurações rápidas</button>

  <ng-template ndsPopoverContent align="end">
    <div ndsPopoverHeader>
      <h3 ndsPopoverTitle>Preferências</h3>
    </div>

    <div class="nds-cluster" data-justify="between">
      <label ndsLabel for="notificacoes">Notificações</label>
      <button ndsCheckbox id="notificacoes" [checked]="true"></button>
    </div>
  </ng-template>
</div>`,
};

@Component({
  selector: 'nds-popover-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_POPOVER, NdsButton, NdsCheckbox, NdsInput, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- ─── Previews do Do & Don't ─────────────────────────────────────── -->

    <ng-template #tplDoDont1Do>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.trigger') }}
        </button>
        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('demonstration.labels.title') }}</h3>
            <p ndsPopoverDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- Sem título: o painel cai no nome de reserva herdado do gatilho, que
           mantém o axe verde mas devolve ao leitor o rótulo do botão em vez do
           assunto do painel — exatamente o que a legenda critica. -->
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.trigger') }}
        </button>
        <ng-template ndsPopoverContent>
          <p class="nds-text-body">{{ t('demonstration.labels.description') }}</p>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.form.trigger') }}
        </button>
        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('demonstration.labels.form.trigger') }}</h3>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">{{ rotuloVago() }}</button>
        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('demonstration.labels.form.trigger') }}</h3>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <!-- ─── Previews das variantes ─────────────────────────────────────── -->

    <ng-template #tplVarDefault>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.trigger') }}
        </button>
        <ng-template ndsPopoverContent>
          <p class="nds-text-body">{{ t('demonstration.labels.description') }}</p>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplVarWithTitle>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.title') }}
        </button>
        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('demonstration.labels.title') }}</h3>
            <p ndsPopoverDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <!-- ─── Previews das composições ───────────────────────────────────── -->

    <ng-template #tplFormulario>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('demonstration.labels.form.trigger') }}
        </button>
        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('demonstration.labels.form.trigger') }}</h3>
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pd-perfil-nome">{{ t('demonstration.labels.form.name') }}</label>
            <input ndsInput id="pd-perfil-nome" value="Ana Ribeiro" />
          </div>

          <div class="nds-stack" data-spacing="sm">
            <label ndsLabel for="pd-perfil-email">{{ t('demonstration.labels.form.email') }}</label>
            <input ndsInput id="pd-perfil-email" type="email" value="ana@nortear.com.br" />
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton variant="ghost" size="sm">
              {{ t('demonstration.labels.cancel') }}
            </button>
            <button ndsPopoverClose ndsButton size="sm">
              {{ t('demonstration.labels.form.submit') }}
            </button>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompFiltro>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('variants.compositions.tableFilter.name') }}
        </button>
        <ng-template ndsPopoverContent align="start">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('variants.compositions.tableFilter.name') }}</h3>
          </div>

          <div class="nds-stack" data-spacing="sm">
            @for (opcao of opcoesFiltro(); track opcao.id) {
              <div class="nds-cluster" data-spacing="sm">
                <button ndsCheckbox [id]="opcao.id"></button>
                <label ndsLabel [attr.for]="opcao.id">{{ opcao.label }}</label>
              </div>
            }
          </div>

          <div class="nds-cluster" data-justify="end" data-spacing="sm">
            <button ndsPopoverClose ndsButton size="sm">
              {{ t('demonstration.labels.save') }}
            </button>
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompCores>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('variants.compositions.colorPicker.name') }}
        </button>
        <ng-template ndsPopoverContent>
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('variants.compositions.colorPicker.name') }}</h3>
          </div>

          <div class="nds-cluster" data-spacing="sm">
            @for (cor of amostrasDeCor; track cor.className) {
              <button
                type="button"
                [class]="swatchClasses + ' ' + cor.className"
                [attr.aria-label]="cor.label"
              ></button>
            }
          </div>
        </ng-template>
      </div>
    </ng-template>

    <ng-template #tplCompPreferencias>
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline">
          {{ t('variants.compositions.quickSettings.name') }}
        </button>
        <ng-template ndsPopoverContent align="end">
          <div ndsPopoverHeader>
            <h3 ndsPopoverTitle>{{ t('variants.compositions.quickSettings.name') }}</h3>
          </div>

          <div class="nds-stack" data-spacing="sm">
            @for (pref of preferencias(); track pref.id) {
              <div class="nds-cluster" data-justify="between">
                <label ndsLabel [attr.for]="pref.id">{{ pref.label }}</label>
                <button ndsCheckbox [id]="pref.id"></button>
              </div>
            }
          </div>
        </ng-template>
      </div>
    </ng-template>

    <!-- ─── Página ─────────────────────────────────────────────────────── -->

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="popover"
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
          <div class="nds-cluster" data-spacing="md">
            <div ndsPopover (onOpenChange)="onChange('basico', $event)">
              <button ndsPopoverTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.trigger') }}
              </button>

              <ng-template ndsPopoverContent>
                <div ndsPopoverHeader>
                  <h3 ndsPopoverTitle>{{ t('demonstration.labels.title') }}</h3>
                  <p ndsPopoverDescription>{{ t('demonstration.labels.description') }}</p>
                </div>

                <div class="nds-stack" data-spacing="sm">
                  @for (pref of preferencias(); track pref.id) {
                    <div class="nds-cluster" data-justify="between">
                      <label ndsLabel [attr.for]="'demo-' + pref.id">{{ pref.label }}</label>
                      <button ndsCheckbox [id]="'demo-' + pref.id"></button>
                    </div>
                  }
                </div>

                <div class="nds-cluster" data-justify="end" data-spacing="sm">
                  <button ndsPopoverClose ndsButton variant="ghost" size="sm">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button ndsPopoverClose ndsButton size="sm">
                    {{ t('demonstration.labels.save') }}
                  </button>
                </div>
              </ng-template>
            </div>

            <div ndsPopover (onOpenChange)="onChange('formulario', $event)">
              <button ndsPopoverTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.form.trigger') }}
              </button>

              <ng-template ndsPopoverContent align="start">
                <div ndsPopoverHeader>
                  <h3 ndsPopoverTitle>{{ t('demonstration.labels.form.trigger') }}</h3>
                </div>

                <div class="nds-stack" data-spacing="sm">
                  <label ndsLabel for="pd-demo-nome">
                    {{ t('demonstration.labels.form.name') }}
                  </label>
                  <input ndsInput id="pd-demo-nome" value="Ana Ribeiro" />
                </div>

                <div class="nds-stack" data-spacing="sm">
                  <label ndsLabel for="pd-demo-email">
                    {{ t('demonstration.labels.form.email') }}
                  </label>
                  <input ndsInput id="pd-demo-email" type="email" value="ana@nortear.com.br" />
                </div>

                <div class="nds-cluster" data-justify="end" data-spacing="sm">
                  <button ndsPopoverClose ndsButton variant="ghost" size="sm">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button ndsPopoverClose ndsButton size="sm">
                    {{ t('demonstration.labels.form.submit') }}
                  </button>
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
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          [secondaryCode]="importCodeButton"
          componentSlug="popover"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="popover"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="popover"
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
          [extensibilityCode]="extensibilityCode"
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
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="popover"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="popover"
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
export class NdsPopoverDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeButton = IMPORT_CODE_BUTTON;
  protected readonly swatchClasses = SWATCH_CLASSES;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarWithTitle = viewChild.required<TemplateRef<unknown>>('tplVarWithTitle');
  private readonly tplCompFiltro = viewChild.required<TemplateRef<unknown>>('tplCompFiltro');
  private readonly tplCompCores = viewChild.required<TemplateRef<unknown>>('tplCompCores');
  private readonly tplCompPreferencias =
    viewChild.required<TemplateRef<unknown>>('tplCompPreferencias');

  /**
   * O formulário aparece duas vezes — como variante "Form" e como composição
   * "Editar perfil". Um molde só, dois usos.
   *
   * `#tplFormulario` JÁ é a TemplateRef, então o outlet recebe `tplFormulario()`
   * e não `tplFormulario()()`.
   */
  protected readonly tplFormulario = viewChild.required<TemplateRef<unknown>>('tplFormulario');

  /** Rótulo vago do segundo "don't" — a primeira palavra do bom, sem objeto. */
  protected readonly rotuloVago = computed(() => {
    dict();
    return stripHtml(t('demonstration.labels.form.trigger')).split(' ')[0];
  });

  /** Os três status do filtro de tabela, tirados da descrição da composição. */
  protected readonly opcoesFiltro = computed(() => {
    dict();
    return codesFrom(t('variants.compositions.tableFilter.description')).map((label, i) => ({
      id: `pd-filtro-${i + 1}`,
      label,
    }));
  });

  /** As preferências booleanas, tiradas da descrição da composição. */
  protected readonly preferencias = computed(() => {
    dict();
    return codesFrom(t('variants.compositions.quickSettings.description')).map((label, i) => ({
      id: `pd-pref-${i + 1}`,
      label,
    }));
  });

  /**
   * As amostras de cor saem de tokens do tema, não de valores literais: trocar
   * de marca reescreve a paleta sem tocar no exemplo — e nenhuma cor precisa de
   * `style` inline, que este sistema não admite.
   *
   * O nome acessível é o próprio token. Não é falta de tradução: `primary` e
   * `destructive` são identificadores da paleta, iguais nos três idiomas, e
   * traduzi-los desligaria o rótulo do que a pessoa encontra no CSS.
   */
  protected readonly amostrasDeCor = [
    // O nome acessível é o mesmo das cinco stories: quem não distingue a cor
    // depende dele, e nome diferente entre prévia e story parte o contrato em
    // dois sem nenhum portão ver.
    { className: 'nds-bg-primary',     label: 'Primária'   },
    { className: 'nds-bg-secondary',   label: 'Secundária' },
    { className: 'nds-bg-success',     label: 'Sucesso'    },
    { className: 'nds-bg-warning',     label: 'Atenção'    },
    { className: 'nds-bg-info',        label: 'Informação' },
    { className: 'nds-bg-destructive', label: 'Destrutiva' },
  ];

  /**
   * Abertura e fechamento do popover na demonstração.
   *
   * O evento sai do handler da docs page, nunca de dentro do primitivo de UI —
   * é o que a regra `analytics_in_ui_primitive` proíbe. O rótulo é um id
   * estável e não o texto traduzido, que viraria três valores distintos no GA4.
   */
  protected onChange(qual: string, evento: RdxPopoverOpenChange): void {
    if (evento.open) {
      track('popover_open', {
        component: 'popover',
        trigger_label: qual,
        location: 'docs_demo',
      });
      return;
    }
    track('popover_close', {
      component: 'popover',
      reason: evento.reason,
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return listFromDict(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: t('usage.guidelines.title'), items: listFromDict(d, 'usage.guidelines') };
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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']).map((r) => ({
        s: toPlainText(r.s),
        u: toPlainText(r.u),
        a: toPlainText(r.a),
      })),
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
      items: ['title', 'description', 'trigger'].map((k) => ({
        element: t(`usage.uxWriting.table.${k}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: listFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: listFromDict(d, 'usage.dont') };
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
    const mapa: { key: 'default' | 'withTitle' | 'form'; tpl: TemplateRef<unknown> }[] = [
      { key: 'default',   tpl: this.tplVarDefault()   },
      { key: 'withTitle', tpl: this.tplVarWithTitle() },
      // A variante "Form" e a composição "Editar perfil" são o mesmo exemplo no
      // conteúdo compartilhado — um molde só, instanciado nas duas seções.
      { key: 'form',      tpl: this.tplFormulario()   },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.items.${key}`),
      // `variants.styles.*` traz <code> — o container renderiza HTML
      // sanitizado, então stripHtml (que NÃO decodifica entidades) é o certo.
      description: t(`variants.styles.${key}`),
      code: VARIANT_CODE[key],
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: {
      key: 'editProfile' | 'tableFilter' | 'colorPicker' | 'quickSettings';
      tpl: TemplateRef<unknown>;
    }[] = [
      { key: 'editProfile',   tpl: this.tplFormulario()       },
      { key: 'tableFilter',   tpl: this.tplCompFiltro()       },
      { key: 'colorPicker',   tpl: this.tplCompCores()        },
      { key: 'quickSettings', tpl: this.tplCompPreferencias() },
    ];
    return mapa.map(({ key, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: t(`variants.compositions.${key}.description`),
      useWhen: t(`variants.compositions.${key}.use`),
      code: COMPOSITION_CODE[key],
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
    return ['closed', 'open', 'transitioning', 'focused'].map((k) => ({
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
        // Título é o seletor, não texto de interface: identificador de API não
        // se traduz, e traduzi-lo esconderia o que a pessoa precisa digitar.
        title: 'div[ndsPopover]',
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.open.description')),
          },
          {
            name: 'defaultOpen',
            type: 'boolean',
            defaultValue: toPlainText(t('props.table.defaultOpen.default')),
            required: not,
            description: toPlainText(t('props.table.defaultOpen.description')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.onOpenChange.description')),
          },
          {
            name: 'modal',
            type: `boolean | 'trap-focus'`,
            defaultValue: toPlainText(t('props.table.modal.default')),
            required: not,
            description: toPlainText(t('props.table.modal.description')),
          },
        ],
      },
      {
        title: 'ng-template[ndsPopoverContent]',
        cols,
        items: [
          {
            name: 'side',
            type: toPlainText(t('props.table.side.type')),
            defaultValue: toPlainText(t('props.table.side.default')),
            required: not,
            description: toPlainText(t('props.table.side.description')),
          },
          {
            name: 'align',
            type: toPlainText(t('props.table.align.type')),
            defaultValue: toPlainText(t('props.table.align.default')),
            required: not,
            description: toPlainText(t('props.table.align.description')),
          },
          {
            name: 'sideOffset',
            type: toPlainText(t('props.table.sideOffset.type')),
            defaultValue: toPlainText(t('props.table.sideOffset.default')),
            required: not,
            description: toPlainText(t('props.table.sideOffset.description')),
          },
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
    // A coluna "Classe" saía daqui porque o conteúdo compartilhado trazia nomes
    // utilitários do framework que deixou o projeto (`bg-popover`, `shadow-md`,
    // `ring-ring`), inexistentes em qualquer stack desde a migração `.nds-*`.
    // Agora o próprio `translations.json` traz a classe real, e as cinco stacks
    // documentam o mesmo seletor — este bloco só escolhe a ordem das linhas.
    return [
      { token: '--popover',            k: 'popover'           },
      { token: '--popover-foreground', k: 'popoverForeground' },
      { token: '--muted-foreground',   k: 'mutedForeground'   },
      { token: '--border',             k: 'border'            },
      { token: '--elevation-md',       k: 'shadow'            },
      { token: '--ring',               k: 'ring'              },
    ].map(({ token, k }) => ({
      token,
      value: t(`tokens.table.${k}.class`),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    // Os itens da lista mais o bloco `aria`: o container tem uma lista só, e
    // deixar os quatro atributos de fora perderia a metade verificável.
    return [
      ...listFromDict(d, 'accessibility.items'),
      t('accessibility.aria.role'),
      t('accessibility.aria.labelledBy'),
      t('accessibility.aria.describedBy'),
      t('accessibility.aria.expanded'),
    ];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Escape',    description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = popoverTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const block = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista.
    return Object.entries(block).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { k: 'tooltip',      path: '?path=/docs/primitives-overlay-tooltip--docs'       },
      { k: 'dropdownMenu', path: '?path=/docs/primitives-overlay-dropdownmenu--docs' },
      { k: 'dialog',       path: '?path=/docs/primitives-overlay-dialog--docs'        },
      { k: 'hoverCard',    path: '?path=/docs/primitives-overlay-hovercard--docs'    },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    // O corte em 4 é guarda: o conteúdo compartilhado já não traz um `item5`
    // com limitações de uma stack só, e as quatro notas restantes valem aqui.
    // `item1` entra pelo override, com a lib deste stack.
    return listFromDict(d, 'notes')
      .slice(0, 4)
      .map((content) => ({ title: '', content }));
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
    // O nome do evento É a chave — o conteúdo compartilhado não guarda uma
    // string separada para ele, e inventar uma tradução de `popover_open`
    // quebraria a correspondência com o GA4.
    return ['popover_open', 'popover_close'].map((evento) => ({
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
        result: toPlainText(r.result),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // skeleton e do separator.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: listFromDict(d, 'testes.accessibility').map((criterion) => ({
        criterion: toPlainText(criterion),
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
        componentSlug: 'popover',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'popover',
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
          component_name: 'popover',
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
 * Rótulos tirados dos `<code>` do PRIMEIRO parêntese de uma frase.
 *
 * As descrições das composições já enumeram os itens de cada exemplo
 * ("checkboxes (<code>Ativo</code>, <code>Pendente</code>, <code>Arquivado</code>)").
 * Ler dali mantém o exemplo trilíngue e em sincronia com o texto ao lado —
 * repetir a lista em literal aqui garantiria que um dia os dois divergissem.
 *
 * O recorte pelo parêntese não é enfeite: a mesma frase cita depois os botões
 * (`Limpar` / `Aplicar`) e o componente alternativo, também em `<code>`. Varrer
 * a frase inteira renderizaria cinco caixas de seleção onde há três.
 */
function codesFrom(frase: string): string[] {
  const group = /\(([^)]*)\)/.exec(String(frase ?? ''));
  const target = group ? group[1] : String(frase ?? '');
  return [...target.matchAll(/<code>([^<]+)<\/code>/g)].map((m) => m[1]);
}

/** `base.item1`, `base.item2`, … enquanto existirem. Nunca contar à mão. */
function listFromDict(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
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
