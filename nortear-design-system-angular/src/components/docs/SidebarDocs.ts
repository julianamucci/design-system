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
import { NgTemplateOutlet } from '@angular/common';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_SIDEBAR } from '@/components/ui/sidebar';
import uiTranslations from '@/i18n/ui.json';
import sidebarTranslations from '@shared/content/sidebar/translations.json';

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

// Sobrescritas locais, todas por motivo declarado.
const { t, dict } = useTranslation(sidebarTranslations as Record<string, unknown>, {
  '*': {
    // O conteúdo compartilhado descreve a prop na API de outra lib. Aqui o
    // input chama `active` — `isActive` é convenção de React, não de Angular.
    'props.menuButton.isActive': 'Marca o item como página atual (`data-active` e `aria-current`).',
    // A capacidade é a mesma nas cinco stacks; a FORMA é que diverge por
    // linguagem de framework. Aqui o ponto de virada não é prop de componente:
    // é um token de injeção, trocável por `providers` em qualquer nível da
    // árvore. Só o nome muda — a descrição compartilhada continua valendo.
    'props.provider.mobileQueryName': 'NDS_SIDEBAR_MOBILE_QUERY',
  },
});

/**
 * Rótulo de navegação, com queda para o ui.json.
 *
 * Nem todo componente declara a lista de nav inteira no próprio JSON: o
 * slider não tem nav.compositions. Sem a queda, o que aparece na barra
 * lateral é a chave crua.
 */
function navLabel(key: string): string {
  const doComponente = t(key);
  return doComponente === key ? tNav(key) : doComponente;
}

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
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
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

const INTERFACE_CODE = `// Sem primitivo headless: não existe @radix-ng/primitives/sidebar.
// O estado mora num serviço de signals fornecido pelo Provider — o gatilho
// fica longe do painel na árvore, e passar \`open\` de mão em mão faria quem
// compõe costurar o que o componente já sabe fazer.
@Injectable()
export class NdsSidebarStore {
  readonly open: Signal<boolean>;
  readonly openMobile: Signal<boolean>;
  readonly isMobile: Signal<boolean>;
  readonly state: Signal<'expanded' | 'collapsed'>;
  definir(aberto: boolean): void;
  alternar(): void;
}

@Component({
  selector: 'div[ndsSidebarProvider]',
  providers: [NdsSidebarStore],   // por instância, não em root:
})                                // duas sidebars na página têm estados próprios
export class NdsSidebarProvider {
  readonly defaultOpen = input<boolean>(true);
  readonly open = model<boolean | undefined>(undefined);
}`;

// O snippet compartilhado descreve seletores de ELEMENTO (`<nds-sidebar>`) e a
// prop `isActive`. Aqui os seletores são de atributo, para o markup ficar igual
// ao das outras stacks, e o input chama `active`. Mesmo precedente do Card e do
// Checkbox: a estrutura correta vive aqui até o conteúdo compartilhado ser
// corrigido.
const ANATOMY_CODE = `<div ndsSidebarProvider>
  <div ndsSidebar side="left" variant="sidebar" collapsible="offcanvas">
    <div ndsSidebarHeader>Acme</div>

    <div ndsSidebarContent>
      <nav aria-label="Navegação principal">
        <div ndsSidebarGroup>
          <div ndsSidebarGroupLabel>Plataforma</div>
          <div ndsSidebarGroupContent>
            <ul ndsSidebarMenu>
              <li ndsSidebarMenuItem>
                <a ndsSidebarMenuButton href="/painel" [active]="true">
                  <svg ndsButtonIcon kind="chevron-right"></svg>
                  <span>Painel</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>

    <div ndsSidebarFooter></div>
    <button ndsSidebarRail></button>
  </div>

  <main ndsSidebarInset>
    <button ndsSidebarTrigger aria-label="Alternar barra lateral"></button>
    <div id="main-content" tabindex="-1">
      <!-- conteúdo da página -->
    </div>
  </main>
</div>`;

const CUSTOMIZATION_CODE = `/* Largura e tema por contexto, sempre em token —
   as duas custom properties já nascem em .nds-sidebar-wrapper. */
.tema-compacto {
  --sidebar-width: 14rem;
  --sidebar-width-icon: 2.5rem;
}

/* Cor do painel e do item ativo */
.tema-escuro {
  --sidebar: 240 6% 10%;
  --sidebar-accent: 240 4% 16%;
  --sidebar-accent-foreground: 0 0% 98%;
}`;

@Component({
  selector: 'nds-sidebar-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_SIDEBAR, NgTemplateOutlet,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!-- Modelo reaproveitado por quase todo preview: o que muda entre eles é o
         wrapper, não o miolo. -->
    <ng-template #tplMiolo let-rotuloNav="rotuloNav">
      <div ndsSidebarHeader>Acme</div>
      <div ndsSidebarContent>
        <nav [attr.aria-label]="rotuloNav">
          <div ndsSidebarGroup>
            <div ndsSidebarGroupLabel>{{ t('demonstration.labels.components') }}</div>
            <ul ndsSidebarMenu>
              <li ndsSidebarMenuItem>
                <a ndsSidebarMenuButton href="#painel" [active]="true">
                  <span>{{ t('demonstration.labels.dashboard') }}</span>
                </a>
              </li>
              <li ndsSidebarMenuItem>
                <a ndsSidebarMenuButton href="#tokens">
                  <span>{{ t('demonstration.labels.tokens') }}</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Do>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar collapsible="icon">
          <ng-container
            [ngTemplateOutlet]="tplMiolo"
            [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — do-icone' }"
          />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar collapsible="icon">
          <div ndsSidebarContent>
            <nav>
              <ul ndsSidebarMenu>
                <li ndsSidebarMenuItem>
                  <a ndsSidebarMenuButton href="#painel">
                    <span>{{ t('demonstration.labels.dashboard') }}</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar>
          <div ndsSidebarContent>
            <nav [attr.aria-label]="t('demonstration.labels.mainNav') + ' — dont-icone'">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>{{ t('demonstration.labels.components') }}</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#a"><span>{{ t('demonstration.labels.dashboard') }}</span></a>
                  </li>
                </ul>
              </div>
              <div ndsSidebarSeparator></div>
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>{{ t('demonstration.labels.settings') }}</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#b"><span>{{ t('demonstration.labels.profile') }}</span></a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar>
          <div ndsSidebarContent>
            <nav [attr.aria-label]="t('demonstration.labels.mainNav') + ' — do-grupos'">
              <ul ndsSidebarMenu>
                <li ndsSidebarMenuItem><a ndsSidebarMenuButton href="#a"><span>{{ t('demonstration.labels.dashboard') }}</span></a></li>
                <li ndsSidebarMenuItem><a ndsSidebarMenuButton href="#b"><span>{{ t('demonstration.labels.profile') }}</span></a></li>
                <li ndsSidebarMenuItem><a ndsSidebarMenuButton href="#c"><span>{{ t('demonstration.labels.tokens') }}</span></a></li>
                <li ndsSidebarMenuItem><a ndsSidebarMenuButton href="#d"><span>{{ t('demonstration.labels.settings') }}</span></a></li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>

    <ng-template #tplVarSidebar>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar variant="sidebar">
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — variante-sidebar' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplVarFloating>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar variant="floating">
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — variante-flutuante' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplVarInset>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar variant="inset">
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — variante-inset' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplVarIcon>
      <div ndsSidebarProvider class="nds-w-full" [defaultOpen]="false">
        <div ndsSidebar collapsible="icon">
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — variante-icone' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplVarRight>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar side="right">
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — variante-direita' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>

    <ng-template #tplCompGroups>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar>
          <div ndsSidebarContent>
            <nav [attr.aria-label]="t('demonstration.labels.mainNav') + ' — dont-lista-longa'">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>{{ t('demonstration.labels.components') }}</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#painel" [active]="true">
                      <span>{{ t('demonstration.labels.dashboard') }}</span>
                    </a>
                    <span ndsSidebarMenuBadge>3</span>
                  </li>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#tokens"><span>{{ t('demonstration.labels.tokens') }}</span></a>
                    <ul ndsSidebarMenuSub>
                      <li ndsSidebarMenuSubItem>
                        <a ndsSidebarMenuSubButton href="#cor">{{ t('demonstration.labels.settings') }}</a>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
              <div ndsSidebarSeparator></div>
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>{{ t('demonstration.labels.settings') }}</div>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <a ndsSidebarMenuButton href="#perfil"><span>{{ t('demonstration.labels.profile') }}</span></a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>
    <ng-template #tplCompSearch>
      <div ndsSidebarProvider class="nds-w-full">
        <div ndsSidebar>
          <div ndsSidebarHeader>
            <input
              ndsSidebarInput
              type="search"
              [attr.placeholder]="t('demonstration.labels.search')"
              [attr.aria-label]="t('demonstration.labels.search')"
            />
          </div>
          <ng-container [ngTemplateOutlet]="tplMiolo" [ngTemplateOutletContext]="{ rotuloNav: t('demonstration.labels.mainNav') + ' — composicao-busca' }" />
        </div>
        <div class="nds-sidebar-inset" data-slot="sidebar-inset"></div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="sidebar"
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
          <div ndsSidebarProvider class="nds-w-full">
            <div ndsSidebar>
              <div ndsSidebarHeader>Acme</div>
              <div ndsSidebarContent>
                <nav [attr.aria-label]="t('demonstration.labels.mainNav') + ' — composicao-grupos'">
                  <div ndsSidebarGroup>
                    <div ndsSidebarGroupLabel>{{ t('demonstration.labels.components') }}</div>
                    <div ndsSidebarGroupContent>
                      <ul ndsSidebarMenu>
                        <li ndsSidebarMenuItem>
                          <a ndsSidebarMenuButton href="#painel" [active]="true">
                            <span>{{ t('demonstration.labels.dashboard') }}</span>
                          </a>
                        </li>
                        <li ndsSidebarMenuItem>
                          <a ndsSidebarMenuButton href="#tokens">
                            <span>{{ t('demonstration.labels.tokens') }}</span>
                          </a>
                        </li>
                        <li ndsSidebarMenuItem>
                          <a ndsSidebarMenuButton href="#ajustes">
                            <span>{{ t('demonstration.labels.settings') }}</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </nav>
              </div>
              <div ndsSidebarFooter>
                <ul ndsSidebarMenu>
                  <li ndsSidebarMenuItem>
                    <button ndsSidebarMenuButton>
                      <span>{{ t('demonstration.labels.profile') }}</span>
                    </button>
                  </li>
                </ul>
              </div>
              <button ndsSidebarRail></button>
            </div>
            <!-- Aqui o inset é <div>, não <main> como no snippet da anatomia:
                 esta página JÁ está dentro de um <main>, e marco dentro de marco
                 é landmark-main-is-top-level no axe. Quem consome escreve
                 <main ndsSidebarInset>, porque lá ele é o marco de topo. -->
            <div class="nds-sidebar-inset" data-slot="sidebar-inset">
              <button ndsSidebarTrigger [attr.aria-label]="t('demonstration.labels.toggleOpen')">
                {{ t('demonstration.labels.toggleOpen') }}
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
          componentSlug="sidebar"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="sidebar"
          id="variantes"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="sidebar"
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
          componentSlug="sidebar"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="sidebar" />

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
export class NdsSidebarDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly customizationCode = CUSTOMIZATION_CODE;
  protected readonly importCode = `import { NDS_SIDEBAR } from '@/components/ui/sidebar';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  protected readonly tplMiolo = viewChild.required<TemplateRef<unknown>>('tplMiolo');

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarSidebar = viewChild.required<TemplateRef<unknown>>('tplVarSidebar');
  private readonly tplVarFloating = viewChild.required<TemplateRef<unknown>>('tplVarFloating');
  private readonly tplVarInset = viewChild.required<TemplateRef<unknown>>('tplVarInset');
  private readonly tplVarIcon = viewChild.required<TemplateRef<unknown>>('tplVarIcon');
  private readonly tplVarRight = viewChild.required<TemplateRef<unknown>>('tplVarRight');
  private readonly tplCompGroups = viewChild.required<TemplateRef<unknown>>('tplCompGroups');
  private readonly tplCompSearch = viewChild.required<TemplateRef<unknown>>('tplCompSearch');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: navLabel(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: navLabel(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return Object.keys(d)
      .filter((k) => /^anatomy\.item\d+$/.test(k))
      // Ordem numérica, não alfabética: com 16 itens, `item10` viria antes de
      // `item2` e a anatomia sairia embaralhada.
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
      .map((k) => d[k]);
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: d['usage.guidelines.title'] ?? '',
      items: Object.keys(d)
        .filter((k) => /^usage\.guidelines\.item\d+$/.test(k))
        .sort()
        .map((k) => d[k]),
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
    dict();
    return { title: t('usage.do.title'), items: numberedItems(dict(), 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: numberedItems(dict(), 'usage.dont') };
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
      { name: 'sidebar',   key: 'sidebar',   tpl: this.tplVarSidebar()  },
      { name: 'floating',  key: 'floating',  tpl: this.tplVarFloating() },
      { name: 'inset',     key: 'inset',     tpl: this.tplVarInset()    },
      { name: 'icon',      key: 'icon',      tpl: this.tplVarIcon()     },
      { name: 'right',     key: 'right',     tpl: this.tplVarRight()    },
    ].map(({ name, key, tpl }) => ({
      name,
      description: t(`variants.items.${key}`),
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    const mapa: { key: string; tpl: TemplateRef<unknown> }[] = [
      { key: 'withGroups', tpl: this.tplCompGroups() },
      { key: 'withSearch', tpl: this.tplCompSearch() },
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
    return ['expanded', 'collapsed', 'collapsedOffcanvas', 'mobile', 'hidden'].map((k) => ({
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
      description: toPlainText(t(key)),
    });

    return [
      {
        title: 'NdsSidebarProvider',
        cols,
        items: [
          line('defaultOpen', 'props.provider.defaultOpen', 'boolean', 'true'),
          line('open', 'props.provider.open', 'model<boolean | undefined>', '—'),
          line('openChange', 'props.provider.onOpenChange', 'output<boolean>', '—'),
          // Não é input: é token de injeção, e o nome vem do conteúdo
          // compartilhado justamente para poder divergir aqui.
          line(
            t('props.provider.mobileQueryName'),
            'props.provider.mobileQuery',
            'InjectionToken<string>',
            `'(max-width: 767px)'`,
          ),
        ],
      },
      {
        title: 'NdsSidebar',
        cols,
        items: [
          line('side', 'props.sidebar.side', `'left' | 'right'`, `'left'`),
          line('variant', 'props.sidebar.variant', `'sidebar' | 'floating' | 'inset'`, `'sidebar'`),
          line(
            'collapsible',
            'props.sidebar.collapsible',
            `'offcanvas' | 'icon' | 'none'`,
            `'offcanvas'`,
          ),
          line('mobileTitle', 'props.sidebar.mobileTitle', 'string', `'Barra lateral'`),
          line(
            'mobileDescription',
            'props.sidebar.mobileDescription',
            'string',
            `'Exibe a barra lateral como gaveta sobreposta.'`,
          ),
        ],
      },
      {
        title: 'NdsSidebarMenuButton',
        cols,
        items: [
          line('active', 'props.menuButton.isActive', 'boolean', 'false'),
          line('variant', 'props.menuButton.variant', `'default' | 'outline'`, `'default'`),
          line('size', 'props.menuButton.size', `'default' | 'sm' | 'lg'`, `'default'`),
        ],
      },
      {
        title: 'NdsSidebarMenuSubButton',
        cols,
        items: [
          line('active', 'props.menuSubButton.isActive', 'boolean', 'false'),
          line('size', 'props.menuSubButton.size', `'default' | 'sm' | 'lg'`, `'default'`),
        ],
      },
      {
        title: 'NdsSidebarMenuSkeleton',
        cols,
        items: [line('showIcon', 'props.menuSkeleton.showIcon', 'boolean', 'false')],
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
      { token: '--sidebar',                   k: 'sidebarBg',          target: '.nds-sidebar-inner' },
      { token: '--sidebar-foreground',        k: 'sidebarFg',          target: '.nds-sidebar-root' },
      { token: '--sidebar-border',            k: 'sidebarBorder',      target: '.nds-sidebar-panel' },
      { token: '--sidebar-accent',            k: 'sidebarAccent',      target: '.nds-sidebar-menu-button' },
      { token: '--sidebar-accent-foreground', k: 'sidebarAccentFg',    target: '.nds-sidebar-menu-button' },
      { token: '--sidebar-ring',              k: 'sidebarRing',        target: '.nds-sidebar-menu-button' },
      // `.nds-sidebar-wrapper` DECLARA as duas larguras; quem as consome é o
      // painel (e o vão que reserva o espaço dele). A coluna diz onde o valor
      // é aplicado, então é o painel que entra aqui — a customização por
      // sobrescrita no wrapper está no bloco de código abaixo da tabela.
      { token: '--sidebar-width',             k: 'sidebarWidth',       target: '.nds-sidebar-panel' },
      { token: '--sidebar-width-icon',        k: 'sidebarWidthIcon',   target: '.nds-sidebar-root[data-collapsible="icon"] .nds-sidebar-panel' },
      { token: '--sidebar-width-mobile',      k: 'sidebarWidthMobile', target: '.nds-sidebar-mobile' },
    ].map(({ token, k, target }) => ({
      token,
      value: target,
      description: toPlainText(t(`tokens.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    const items = Object.keys(d)
      .filter((k) => /^accessibility\.item\d+$/.test(k))
      .sort()
      .map((k) => d[k]);
    const aria = ['navLabel', 'ariaCurrent', 'ariaExpanded', 'ariaHidden', 'dataState'].map((k) =>
      t(`accessibility.aria.${k}`),
    );
    // A seção genérica não tem faixa própria para ARIA; as duas listas dizem a
    // mesma coisa em graus diferentes de detalhe, então saem juntas.
    return [...items, ...aria];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Esc',       description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Ctrl/⌘+B',  description: toPlainText(t('accessibility.keyboard.ctrlB')) },
      { key: '↑ ↓',       description: toPlainText(t('accessibility.keyboard.arrowKeys')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['navLandmark', 'activeItem', 'collapsedTooltip', 'mobileSheet', 'toggleButton'].map(
      (k) => t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'navigationMenu', name: 'Navigation Menu', path: '?path=/docs/primitives-navigation-navigationmenu--docs' },
      { key: 'tabs',           name: 'Tabs',            path: '?path=/docs/primitives-navigation-tabs--docs'           },
      { key: 'sheet',          name: 'Sheet',           path: '?path=/docs/primitives-disclosure-sheet--docs'          },
      { key: 'accordion',      name: 'Accordion',       path: '?path=/docs/primitives-disclosure-accordion--docs'      },
      { key: 'separator',      name: 'Separator',       path: '?path=/docs/primitives-layout-separator--docs'      },
      { key: 'skeleton',       name: 'Skeleton',        path: '?path=/docs/primitives-feedback-skeleton--docs'       },
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
      { e: 'navClick',      trigger: 'navClickTrigger',      carga: 'navClickPayload'      },
      { e: 'toggleOpen',    trigger: 'toggleOpenTrigger',    carga: 'togglePayload'        },
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
      items: itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']).map((r) => ({
        criterion: toPlainText(r.criterion),
        level: r.level,
        how: toPlainText(r.how),
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
        componentSlug: 'sidebar',
      });
      track('docs_page_view', {
        component_name: 'sidebar',
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
          component_name: 'sidebar',
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
 * Itens `base.itemN` na ordem numérica, quantos existirem.
 *
 * Contar na mão — `[1, 2, 3, 4].map(...)` — rende a chave crua na tela quando o
 * conteúdo tem um item a menos. Foi o que aconteceu aqui: `usage.dont` tem 3, e
 * "usage.dont.item4" apareceu escrito na página.
 */
function numberedItems(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
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
