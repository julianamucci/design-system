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
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_SHEET, sheetCloseReason } from '@/components/ui/sheet';
import { NdsButton } from '@/components/ui/button';
import { NdsLabel } from '@/components/ui/label';
import { NdsCheckbox } from '@/components/ui/checkbox';
import uiTranslations from '@/i18n/ui.json';
import sheetTranslations from '@shared/content/sheet/translations.json';

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
const { t, dict } = useTranslation(sheetTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Rótulos de navegação saem do `ui.json`, não do conteúdo do componente: é a
// mesma trilha em todas as docs pages deste stack, e o conteúdo por componente
// só teria como divergir.
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

const IMPORT_CODE = `import { NDS_SHEET } from '@/components/ui/sheet';

// ou, peça a peça:
import {
  NdsSheet,
  NdsSheetTrigger,
  NdsSheetContent,
  NdsSheetHeader,
  NdsSheetTitle,
  NdsSheetDescription,
  NdsSheetBody,
  NdsSheetFooter,
  NdsSheetClose,
} from '@/components/ui/sheet';`;

const IMPORT_CODE_COMPONENTE = `import { NDS_SHEET } from '@/components/ui/sheet';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_SHEET, NdsButton],
})
export class Exemplo {}`;

const INTERFACE_CODE = `// A raiz compõe o Dialog do Radix NG: é ele quem entrega foco preso,
// Escape, aria-modal, restauração de foco e trava de rolagem.
@Directive({ selector: 'ng-template[ndsSheetContent]' })
export class NdsSheetContent {
  side            = input<'top' | 'right' | 'bottom' | 'left'>('right');
  showCloseButton = input(true);
  closeLabel      = input('Fechar');   // nome acessível do X do canto
  panelClass      = input('');        // classes .nds-* extras no painel
}

@Component({
  selector: 'nds-sheet',
  hostDirectives: [
    { directive: RdxDialogRoot,
      inputs:  ['open', 'defaultOpen', 'modal', 'disablePointerDismissal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'] },
  ],
})
export class NdsSheet {}

@Directive({ selector: 'button[ndsSheetTrigger]', hostDirectives: [RdxDialogTrigger] })
export class NdsSheetTrigger {}

@Directive({ selector: 'h2[ndsSheetTitle], h3[ndsSheetTitle]', hostDirectives: [RdxDialogTitle] })
export class NdsSheetTitle {}

@Directive({ selector: 'p[ndsSheetDescription]', hostDirectives: [RdxDialogDescription] })
export class NdsSheetDescription {}

@Directive({ selector: 'button[ndsSheetClose]', hostDirectives: [RdxDialogClose] })
export class NdsSheetClose {}`;

// A variante `angular` de `props.extensibilityCode` no conteúdo compartilhado
// escreve \`class="nds-max-w-lg"\` no \`<ng-template ndsSheetContent>\`. Uma classe
// escrita num \`<ng-template>\` não vai para lugar nenhum — o template não tem
// elemento hospedeiro. A escotilha aqui é o input \`panelClass\`, que o componente
// aplica no painel de verdade, criado dentro do portal.
const EXTENSIBILITY_CODE = `<!-- Painel controlado, com largura própria -->
<nds-sheet [(open)]="aberto">
  <button ndsSheetTrigger ndsButton variant="outline">Filtros</button>

  <ng-template ndsSheetContent side="right" panelClass="nds-max-w-lg">
    <div ndsSheetHeader>
      <h2 ndsSheetTitle>Filtros avançados</h2>
      <p ndsSheetDescription>Refine os resultados.</p>
    </div>

    <div ndsSheetBody>
      <!-- formulário de filtros -->
    </div>

    <div ndsSheetFooter>
      <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton (click)="aplicar()">Aplicar filtros</button>
    </div>
  </ng-template>
</nds-sheet>`;

const TOKENS_CODE = `/* Tokens que o painel consome */
:root {
  --background:       0 0% 100%;   /* fundo do painel */
  --foreground:     222 47% 11%;   /* texto e título */
  --muted-foreground: 215 16% 47%; /* descrição */
  --border:         214 32% 91%;   /* borda do lado encostado */
  --ring:           222 47% 11%;   /* anel de foco do botão de fechar */
}

/* A direção mora em data-side, e é dela que saem posição, borda e animação:
   .nds-sheet-content[data-side="right"] { right: 0; border-left: 1px solid … } */`;

const VARIANT_CODE = (side: string, tituloVar: string) => `<nds-sheet>
  <button ndsSheetTrigger ndsButton variant="outline">Abrir filtros</button>

  <ng-template ndsSheetContent side="${side}">
    <div ndsSheetHeader>
      <h2 ndsSheetTitle>${tituloVar}</h2>
      <p ndsSheetDescription>Configure os filtros para refinar os resultados.</p>
    </div>

    <div ndsSheetFooter>
      <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton>Aplicar filtros</button>
    </div>
  </ng-template>
</nds-sheet>`;

const COMPOSITION_CODE = {
  advancedFilters: `<nds-sheet>
  <button ndsSheetTrigger ndsButton variant="outline">Abrir filtros</button>

  <ng-template ndsSheetContent side="right">
    <div ndsSheetHeader>
      <h2 ndsSheetTitle>Filtros avançados</h2>
      <p ndsSheetDescription>Configure os filtros para refinar os resultados.</p>
    </div>

    <div ndsSheetBody class="nds-stack" data-spacing="sm">
      <div class="nds-cluster" data-spacing="sm">
        <button ndsCheckbox id="cat-1"></button>
        <label ndsLabel for="cat-1">Categoria</label>
      </div>
    </div>

    <div ndsSheetFooter>
      <button ndsSheetClose ndsButton variant="outline">Cancelar</button>
      <button ndsButton>Aplicar filtros</button>
    </div>
  </ng-template>
</nds-sheet>`,
  secondaryNavigation: `<nds-sheet>
  <button ndsSheetTrigger ndsButton variant="outline">Abrir menu</button>

  <ng-template ndsSheetContent side="left">
    <div ndsSheetHeader>
      <h2 ndsSheetTitle>Navegação secundária</h2>
      <p ndsSheetDescription>Navegue entre as áreas do sistema.</p>
    </div>

    <div ndsSheetBody>
      <!-- Marco de navegação com nome próprio: a página já tem um <nav>, e dois
           sem nome distinto ficam indistinguíveis para quem navega por marcos. -->
      <nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">
        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Dashboard</a>
        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">Projetos</a>
      </nav>
    </div>
  </ng-template>
</nds-sheet>`,
};

const LINK_CLASSES = 'nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent';

@Component({
  selector: 'nds-sheet-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_SHEET, NdsButton, NdsLabel, NdsCheckbox,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- ─── Do & Don't ─────────────────────────────────────────────────── -->

    <ng-template #tplDoDont1Do>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.title') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O "don't" é o painel sem descrição. O título continua presente: um
           diálogo modal anônimo não é exemplo ruim, é armadilha — quem usa
           leitor de tela ficaria sem saber onde entrou. -->
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.title') }}</h3>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.rightLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- Mesmo painel forçado ao topo: cabe, mas contraria o fluxo de quem
           esperava o filtro do lado dos resultados. -->
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="top">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.topLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <!-- ─── Variantes: os quatro lados ─────────────────────────────────── -->

    <ng-template #tplVarRight>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.rightLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplVarLeft>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="left">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.leftLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplVarTop>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="top">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.topLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplVarBottom>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="bottom">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.bottomLabel') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>
          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton>{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <!-- ─── Composições ────────────────────────────────────────────────── -->

    <ng-template #tplCompFiltros>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="right">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('demonstration.labels.title') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>

          <div ndsSheetBody class="nds-stack" data-spacing="sm">
            @for (opcao of opcoesDeFiltro(); track opcao.id) {
              <div class="nds-cluster" data-spacing="sm">
                <button ndsCheckbox [id]="opcao.id"></button>
                <label ndsLabel [attr.for]="opcao.id">{{ opcao.rotulo }}</label>
              </div>
            }
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ t('demonstration.labels.cancel') }}</button>
            <button ndsButton (click)="aoAplicar('composicoes')">{{ t('demonstration.labels.apply') }}</button>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <ng-template #tplCompNavegacao>
      <nds-sheet>
        <button ndsSheetTrigger ndsButton variant="outline">{{ t('demonstration.labels.trigger') }}</button>
        <ng-template ndsSheetContent side="left">
          <div ndsSheetHeader>
            <h3 ndsSheetTitle>{{ t('variants.compositions.secondaryNavigation.name') }}</h3>
            <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
          </div>

          <div ndsSheetBody>
            <!-- Nome próprio no marco: a docs page já tem um <nav>, e dois marcos
                 sem nome distinto ficam indistinguíveis na lista de regiões. -->
            <nav
              [attr.aria-label]="t('variants.compositions.secondaryNavigation.name')"
              class="nds-stack"
              data-spacing="xs"
            >
              @for (destino of destinosDeNavegacao(); track destino.id) {
                <a href="#" [class]="linkClasses">{{ destino.rotulo }}</a>
              }
            </nav>
          </div>
        </ng-template>
      </nds-sheet>
    </ng-template>

    <!-- ─── Página ─────────────────────────────────────────────────────── -->

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="sheet"
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
          <div class="nds-cluster nds-w-full" data-spacing="md">
            <!-- Painel canônico: lado direito, corpo com filtros, rodapé com
                 Cancelar + ação primária. -->
            <nds-sheet (onOpenChange)="aoMudarPainel('demo_filtros', $event)">
              <button ndsSheetTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.trigger') }}
              </button>

              <ng-template ndsSheetContent side="right">
                <div ndsSheetHeader>
                  <h3 ndsSheetTitle>{{ t('demonstration.labels.title') }}</h3>
                  <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
                </div>

                <div ndsSheetBody class="nds-stack" data-spacing="sm">
                  @for (opcao of opcoesDeFiltro(); track opcao.id) {
                    <div class="nds-cluster" data-spacing="sm">
                      <button ndsCheckbox [id]="'demo-' + opcao.id"></button>
                      <label ndsLabel [attr.for]="'demo-' + opcao.id">{{ opcao.rotulo }}</label>
                    </div>
                  }
                </div>

                <div ndsSheetFooter>
                  <button ndsSheetClose ndsButton variant="outline">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                  <button ndsButton (click)="aoAplicar('demo_filtros')">
                    {{ t('demonstration.labels.apply') }}
                  </button>
                </div>
              </ng-template>
            </nds-sheet>

            <!-- Painel controlado por fora: o botão abaixo é o dono do estado. -->
            <button ndsButton (click)="painelControlado.set(true)">
              {{ t('demonstration.labels.leftLabel') }}
            </button>

            <nds-sheet
              [open]="painelControlado()"
              (openChange)="painelControlado.set($event)"
              (onOpenChange)="aoMudarPainel('demo_controlado', $event)"
            >
              <ng-template ndsSheetContent side="left">
                <div ndsSheetHeader>
                  <h3 ndsSheetTitle>{{ t('demonstration.labels.leftLabel') }}</h3>
                  <p ndsSheetDescription>{{ t('demonstration.labels.description') }}</p>
                </div>

                <div ndsSheetFooter>
                  <button ndsSheetClose ndsButton variant="outline">
                    {{ t('demonstration.labels.cancel') }}
                  </button>
                </div>
              </ng-template>
            </nds-sheet>
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
          [secondaryCode]="importCodeComponente"
          componentSlug="sheet"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="sheet"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="sheet"
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
          [customizationCode]="tokensCode"
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
          componentSlug="sheet"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="sheet"
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
export class NdsSheetDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importCodeComponente = IMPORT_CODE_COMPONENTE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly tokensCode = TOKENS_CODE;
  protected readonly linkClasses = LINK_CLASSES;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Estado do painel controlado da demonstração — dono do valor é a página. */
  protected readonly painelControlado = signal(false);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarRight = viewChild.required<TemplateRef<unknown>>('tplVarRight');
  private readonly tplVarLeft = viewChild.required<TemplateRef<unknown>>('tplVarLeft');
  private readonly tplVarTop = viewChild.required<TemplateRef<unknown>>('tplVarTop');
  private readonly tplVarBottom = viewChild.required<TemplateRef<unknown>>('tplVarBottom');
  private readonly tplCompFiltros = viewChild.required<TemplateRef<unknown>>('tplCompFiltros');
  private readonly tplCompNavegacao = viewChild.required<TemplateRef<unknown>>('tplCompNavegacao');

  /** Três opções de filtro derivadas do conteúdo — nada de literal em português. */
  protected readonly opcoesDeFiltro = computed(() => {
    dict();
    const base = t('demonstration.labels.section');
    return [1, 2, 3].map((i) => ({ id: `filtro-${i}`, rotulo: `${base} ${i}` }));
  });

  /** Destinos do exemplo de navegação secundária. */
  protected readonly destinosDeNavegacao = computed(() => {
    dict();
    return [
      { id: 'nav-1', rotulo: t('demonstration.labels.rightLabel') },
      { id: 'nav-2', rotulo: t('demonstration.labels.leftLabel') },
      { id: 'nav-3', rotulo: t('demonstration.labels.topLabel') },
      { id: 'nav-4', rotulo: t('demonstration.labels.bottomLabel') },
    ];
  });

  /**
   * Abertura e fechamento dos painéis da demonstração.
   *
   * O evento nasce AQUI, na camada de produto — o primitivo de UI não importa
   * `@/lib/analytics`. O payload leva valores estáveis (`qual`, `reason`), nunca
   * o texto traduzido, que viraria três valores distintos no GA4.
   */
  protected aoMudarPainel(qual: string, evento: RdxDialogOpenChange): void {
    if (evento.open) {
      track('dialog_open', { component: 'sheet', label: qual, location: 'docs_demo' });
      return;
    }
    track('dialog_close', {
      component: 'sheet',
      label: qual,
      reason: sheetCloseReason(evento.reason),
      location: 'docs_demo',
    });
  }

  /** Ação primária do rodapé. */
  protected aoAplicar(qual: string): void {
    track('dialog_confirm', {
      component: 'sheet',
      action: 'apply_filters',
      label: qual,
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
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => t(`anatomy.item${i}`));
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
      // `do`/`dont` e não `correct`/`avoid`: são esses os nomes que o container
      // genérico lê. O conteúdo compartilhado chama as colunas de correct/avoid.
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['title', 'description', 'trigger', 'primary'].map((k) => ({
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
    dict();
    const mapa: { key: 'right' | 'left' | 'top' | 'bottom'; tpl: TemplateRef<unknown>; rotulo: string }[] = [
      { key: 'right',  tpl: this.tplVarRight(),  rotulo: t('demonstration.labels.rightLabel')  },
      { key: 'left',   tpl: this.tplVarLeft(),   rotulo: t('demonstration.labels.leftLabel')   },
      { key: 'top',    tpl: this.tplVarTop(),    rotulo: t('demonstration.labels.topLabel')    },
      { key: 'bottom', tpl: this.tplVarBottom(), rotulo: t('demonstration.labels.bottomLabel') },
    ];
    return mapa.map(({ key, tpl, rotulo }) => ({
      name: t(`variants.items.${key}`),
      description: stripHtml(t(`variants.styles.${key}`)),
      code: VARIANT_CODE(key, rotulo),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: 'advancedFilters' | 'secondaryNavigation'; tpl: TemplateRef<unknown> }[] = [
      { key: 'advancedFilters',     tpl: this.tplCompFiltros()   },
      { key: 'secondaryNavigation', tpl: this.tplCompNavegacao() },
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
    return ['closed', 'open', 'transitioning', 'focused', 'longScrollBody'].map((k) => ({
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
    const nao = tNav('common.no');
    return [
      {
        title: 'nds-sheet',
        cols,
        items: [
          {
            name: 'open',
            type: 'model<boolean>',
            defaultValue: 'false',
            required: nao,
            description: toPlainText(t('props.table.open.description')),
          },
          {
            name: 'defaultOpen',
            type: t('props.table.defaultOpen.type'),
            defaultValue: t('props.table.defaultOpen.default'),
            required: nao,
            description: toPlainText(t('props.table.defaultOpen.description')),
          },
          {
            // A linha `onOpenChange` do conteúdo compartilhado descreve o
            // callback de mudança; aqui ele é o output `openChange`, o que
            // também habilita a forma de duas vias `[(open)]`.
            name: 'openChange',
            type: 'output<boolean>',
            defaultValue: '—',
            required: nao,
            description: toPlainText(t('props.table.onOpenChange.description')),
          },
          {
            name: 'modal',
            type: 'boolean',
            defaultValue: 'true',
            required: nao,
            description: toPlainText(t('accessibility.aria.modal')),
          },
        ],
      },
      {
        title: 'ng-template[ndsSheetContent]',
        cols,
        items: [
          {
            name: 'side',
            type: t('props.table.side.type'),
            defaultValue: t('props.table.side.default'),
            required: nao,
            description: toPlainText(t('props.table.side.description')),
          },
          {
            name: 'showCloseButton',
            type: t('props.table.showCloseButton.type'),
            defaultValue: t('props.table.showCloseButton.default'),
            required: nao,
            description: toPlainText(t('props.table.showCloseButton.description')),
          },
          {
            // A escotilha que o conteúdo compartilhado chama de `className` nas
            // outras stacks: aqui o painel é construído dentro do portal, então
            // não há elemento onde escrever a classe — ela entra por input.
            name: 'panelClass',
            type: t('props.table.className.type'),
            defaultValue: t('props.table.className.default'),
            required: nao,
            description: toPlainText(t('props.table.className.description')),
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
    // A coluna do meio vem do conteúdo compartilhado como todas as outras: as
    // classes `.nds-*` reais passaram a morar lá, no lugar dos utilitários da
    // era Tailwind que a tabela guardava (`bg-popover`, `ring-ring`).
    return [
      { token: '--background', k: 'background' },
      { token: '--foreground', k: 'foreground' },
      { token: '--muted-foreground', k: 'mutedForeground' },
      { token: '--border', k: 'border' },
      { token: '--z-modal-backdrop', k: 'overlay' },
      { token: '--ring', k: 'ring' },
      { token: '--sheet-width', k: 'width' },
    ].map(({ token, k }) => ({
      token,
      value: t(`tokens.table.${k}.class`),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Escape',    description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = sheetTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const bloco = byLocale[locale]?.accessibility?.screenReader ?? {};
    // `title` é o cabeçalho da seção, não uma linha da lista.
    return Object.entries(bloco).filter(([k]) => k !== 'title').map(([, v]) => v);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { k: 'drawer',      path: '?path=/docs/ui-drawer--docs'      },
      { k: 'dialog',      path: '?path=/docs/ui-dialog--docs'      },
      { k: 'alertDialog', path: '?path=/docs/ui-alertdialog--docs' },
      { k: 'popover',     path: '?path=/docs/ui-popover--docs'     },
    ].map(({ k, path }) => ({
      name: t(`related.items.${k}.name`),
      description: toPlainText(t(`related.items.${k}.description`)),
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
    return ['dialog_open', 'dialog_close', 'dialog_confirm'].map((evento) => ({
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

  /**
   * `testes.accessibility` deste componente é uma LISTA de frases, não uma
   * tabela de critério/nível/verificação — a forma varia entre componentes. O
   * critério é a frase; o nível é o critério da WCAG que ela cobre; a coluna de
   * verificação leva a ferramenta que fecha o portão, que é nome próprio e não
   * precisa de tradução.
   */
  protected readonly testesAccessibility = computed(() => {
    dict();
    const linhas: { i: number; level: string; how: string }[] = [
      { i: 1, level: '4.1.2', how: 'axe-core (addon-a11y)' },
      { i: 2, level: '1.4.3', how: 'axe-core (color-contrast)' },
      { i: 3, level: '4.1.2', how: 'Storybook Test' },
      { i: 4, level: '1.3.1', how: 'Storybook Test' },
      { i: 5, level: '1.3.1', how: 'Storybook Test' },
    ];
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: linhas.map(({ i, level, how }) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
        level,
        how,
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
        componentSlug: 'sheet',
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'sheet',
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
          component_name: 'sheet',
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
