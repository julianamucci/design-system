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
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  NdsBreadcrumb,
  NdsBreadcrumbEllipsis,
  NdsBreadcrumbIcon,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbList,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import uiTranslations from '@/i18n/ui.json';
import breadcrumbTranslations from '@shared/content/breadcrumb/translations.json';

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

const SLUG = 'breadcrumb';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides: só onde o conteúdo compartilhado descreve uma API que este stack
// não tem (`render`/`asChild` não existem em Angular — a diretiva vai no próprio
// elemento do consumidor) ou onde ele descreve um comportamento que já não é o
// da implementação. Nenhum snippet `*Code` entra aqui: snippet em override fica
// preso a um stack e some do conteúdo compartilhado.
const { t, dict } = useTranslation(breadcrumbTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children':
      'Conteúdo do elemento, escrito no template de quem usa.',
    'props.table.label':
      'Nome acessível do landmark de navegação. Padrão: breadcrumb.',
    'props.table.ellipsisLabel':
      'Nome acessível das reticências. Com rótulo elas são anunciadas; sem rótulo ficam decorativas.',
    'props.extensibility':
      'Todos os subcomponentes são diretivas de atributo no elemento nativo: as classes extras vão no <code>class</code> do próprio elemento e o Angular as mescla com a classe base. Para integração com router, aplique <code>ndsBreadcrumbLink</code> no <code>&lt;a routerLink&gt;</code> — não há elemento a substituir, porque o elemento já é o de quem escreve.',
    'states.asChildLink.trigger':
      'Aplicar <code>ndsBreadcrumbLink</code> no próprio <code>&lt;a&gt;</code> do router',
    'states.asChildLink.behavior':
      'O elemento do router mantém os atributos dele e ganha a classe da trilha; nenhum elemento extra é criado',
    'notes.tip3':
      'Para integração com routers, aplique a diretiva de link no próprio <code>&lt;a&gt;</code> do router — isso preserva o comportamento de pré-carregamento dele.',
    // O conteúdo compartilhado ainda descreve um texto sr-only "More" dentro do
    // indicador. Esse texto morava DENTRO de um aria-hidden e foi removido das
    // cinco stacks: hoje o rótulo é opcional e explícito. Divergência reportada.
    'accessibility.item4':
      '<strong>Reticências com rótulo opcional</strong> — <code>BreadcrumbEllipsis</code> é anunciado quando recebe rótulo; sem rótulo fica decorativo, que é o certo quando um gatilho nomeado o envolve.',
  },
  en: {
    'props.table.className':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children': 'Element content, written in the consumer template.',
    'props.table.label': 'Accessible name of the navigation landmark. Default: breadcrumb.',
    'props.table.ellipsisLabel':
      'Accessible name of the ellipsis. With a label it is announced; without one it stays decorative.',
    'props.extensibility':
      'Every subcomponent is an attribute directive on the native element: extra classes go on the element own <code>class</code> and Angular merges them with the base class. For router integration, apply <code>ndsBreadcrumbLink</code> on the <code>&lt;a routerLink&gt;</code> — there is no element to replace, because the element is already the one you wrote.',
    'states.asChildLink.trigger':
      'Apply <code>ndsBreadcrumbLink</code> on the router own <code>&lt;a&gt;</code>',
    'states.asChildLink.behavior':
      'The router element keeps its own attributes and gains the trail class; no extra element is created',
    'notes.tip3':
      'For router integration, apply the link directive on the router own <code>&lt;a&gt;</code> — this preserves its prefetch behavior.',
    'accessibility.item4':
      '<strong>Ellipsis with an optional label</strong> — <code>BreadcrumbEllipsis</code> is announced when given a label; without one it stays decorative, which is right when a named trigger wraps it.',
  },
  es: {
    'props.table.className':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children': 'Contenido del elemento, escrito en el template de quien lo usa.',
    'props.table.label': 'Nombre accesible del landmark de navegación. Predeterminado: breadcrumb.',
    'props.table.ellipsisLabel':
      'Nombre accesible de los puntos suspensivos. Con etiqueta se anuncian; sin ella quedan decorativos.',
    'props.extensibility':
      'Todos los subcomponentes son directivas de atributo sobre el elemento nativo: las clases extra van en el <code>class</code> del propio elemento y Angular las combina con la clase base. Para integración con router, aplica <code>ndsBreadcrumbLink</code> en el <code>&lt;a routerLink&gt;</code> — no hay elemento que reemplazar, porque el elemento ya es el tuyo.',
    'states.asChildLink.trigger':
      'Aplicar <code>ndsBreadcrumbLink</code> en el propio <code>&lt;a&gt;</code> del router',
    'states.asChildLink.behavior':
      'El elemento del router mantiene sus atributos y gana la clase de la ruta; no se crea ningún elemento extra',
    'notes.tip3':
      'Para integración con routers, aplica la directiva de enlace en el propio <code>&lt;a&gt;</code> del router — así se preserva su comportamiento de precarga.',
    'accessibility.item4':
      '<strong>Puntos suspensivos con etiqueta opcional</strong> — <code>BreadcrumbEllipsis</code> se anuncia cuando recibe etiqueta; sin ella queda decorativo, que es lo correcto cuando un disparador con nombre lo envuelve.',
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

// ─── Snippets ─────────────────────────────────────────────────────────────────

const IMPORT_BASICO = `import {
  NdsBreadcrumb,
  NdsBreadcrumbList,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
} from '@/components/ui/breadcrumb';`;

const IMPORT_WITH_ELLIPSIS = `import {
  NdsBreadcrumb,
  NdsBreadcrumbList,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
  NdsBreadcrumbEllipsis,
  NdsBreadcrumbIcon,
} from '@/components/ui/breadcrumb';`;

const CODE_DEFAULT = `<nav ndsBreadcrumb>
  <ol ndsBreadcrumbList>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/">Início</a>
    </li>
    <li ndsBreadcrumbSeparator></li>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/componentes">Componentes</a>
    </li>
    <li ndsBreadcrumbSeparator></li>
    <li ndsBreadcrumbItem>
      <span ndsBreadcrumbPage>Breadcrumb</span>
    </li>
  </ol>
</nav>`;

const CODE_WITH_ELLIPSIS = `<nav ndsBreadcrumb>
  <ol ndsBreadcrumbList>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/">Início</a>
    </li>
    <li ndsBreadcrumbSeparator></li>
    <li ndsBreadcrumbItem>
      <span ndsBreadcrumbEllipsis label="Mais páginas"></span>
    </li>
    <li ndsBreadcrumbSeparator></li>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/componentes">Componentes</a>
    </li>
    <li ndsBreadcrumbSeparator></li>
    <li ndsBreadcrumbItem>
      <span ndsBreadcrumbPage>Breadcrumb</span>
    </li>
  </ol>
</nav>`;

const CODE_SEPARATOR_CUSTOMIZADO = `<nav ndsBreadcrumb>
  <ol ndsBreadcrumbList>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/">Início</a>
    </li>
    <li ndsBreadcrumbSeparator>
      <svg ndsBreadcrumbIcon kind="slash"></svg>
    </li>
    <li ndsBreadcrumbItem>
      <a ndsBreadcrumbLink href="/componentes">Componentes</a>
    </li>
    <li ndsBreadcrumbSeparator>
      <svg ndsBreadcrumbIcon kind="slash"></svg>
    </li>
    <li ndsBreadcrumbItem>
      <span ndsBreadcrumbPage>Breadcrumb</span>
    </li>
  </ol>
</nav>`;

// Só tokens que existem na escada — o CSS da trilha ainda referencia
// `--spacing-1-5` e `--spacing-5`, que não estão em tokens.css (reportado).
const CODE_CUSTOMIZACAO = `/* Override escopado — a trilha lê os tokens globais do tema. */
.meu-tema .nds-breadcrumb-list {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-control);
}

.meu-tema .nds-breadcrumb-link:hover,
.meu-tema .nds-breadcrumb-page {
  color: hsl(var(--foreground));
}

.meu-tema .nds-breadcrumb-link:focus-visible {
  outline: 2px solid hsl(var(--ring) / 0.5);
  outline-offset: 2px;
}`;

const INTERFACE_CODE = `// nav[ndsBreadcrumb] — landmark da trilha
@Directive({ selector: 'nav[ndsBreadcrumb]' })
export class NdsBreadcrumb {
  readonly label = input<string | undefined>(undefined);
}

// ol[ndsBreadcrumbList] · li[ndsBreadcrumbItem]
// a[ndsBreadcrumbLink]  · span[ndsBreadcrumbPage]
// Diretivas sem entrada: aplicam classe e atributo ARIA no elemento nativo.
// href e o texto são do próprio <a>; aria-current="page" é do Page.

// li[ndsBreadcrumbSeparator] — chevron padrão, substituível por conteúdo
@Component({ selector: 'li[ndsBreadcrumbSeparator]' })
export class NdsBreadcrumbSeparator {}

// span[ndsBreadcrumbEllipsis]
@Component({ selector: 'span[ndsBreadcrumbEllipsis]' })
export class NdsBreadcrumbEllipsis {
  readonly label = input<string | undefined>(undefined);
}`;

@Component({
  selector: 'nds-breadcrumb-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsBreadcrumb, NdsBreadcrumbList, NdsBreadcrumbItem, NdsBreadcrumbLink,
    NdsBreadcrumbPage, NdsBreadcrumbSeparator, NdsBreadcrumbEllipsis,
    NdsBreadcrumbIcon,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Cada instância de trilha recebe um nome próprio: a página tem dez
      landmarks de navegação e sem nomes distintos o axe acusa landmark-unique —
      e o leitor de tela anuncia "navegação" dez vezes sem dizer qual é qual.
    -->
    <ng-template #tplVarPadrao>
      <nav ndsBreadcrumb [label]="rotulo('variante-padrao')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplVarReticencias>
      <nav ndsBreadcrumb [label]="rotulo('variante-reticencias')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbEllipsis [label]="t('demonstration.labels.more')"></span>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplVarSeparador>
      <nav ndsBreadcrumb [label]="rotulo('variante-separador')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplDoDont1Do>
      <nav ndsBreadcrumb [label]="rotulo('do-1')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <nav ndsBreadcrumb [label]="rotulo('dont-1')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <!-- O erro que o exemplo mostra: o item atual como link. -->
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'breadcrumb')">{{ t('demonstration.labels.breadcrumb') }}</a>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nav ndsBreadcrumb [label]="rotulo('do-2')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbEllipsis [label]="t('demonstration.labels.more')"></span>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <nav ndsBreadcrumb [label]="rotulo('dont-2')">
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'docs')">{{ t('demonstration.labels.docs') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'guide')">{{ t('demonstration.labels.guide') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'navigation')">{{ t('demonstration.labels.navigation') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
          </li>
          <li ndsBreadcrumbSeparator></li>
          <li ndsBreadcrumbItem>
            <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
          </li>
        </ol>
      </nav>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="breadcrumb"
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
            <nav ndsBreadcrumb [label]="rotulo('demo-padrao')">
              <ol ndsBreadcrumbList>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
                </li>
                <li ndsBreadcrumbSeparator></li>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
                </li>
                <li ndsBreadcrumbSeparator></li>
                <li ndsBreadcrumbItem>
                  <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
                </li>
              </ol>
            </nav>

            <nav ndsBreadcrumb [label]="rotulo('demo-reticencias')">
              <ol ndsBreadcrumbList>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
                </li>
                <li ndsBreadcrumbSeparator></li>
                <li ndsBreadcrumbItem>
                  <span ndsBreadcrumbEllipsis [label]="t('demonstration.labels.more')"></span>
                </li>
                <li ndsBreadcrumbSeparator></li>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
                </li>
                <li ndsBreadcrumbSeparator></li>
                <li ndsBreadcrumbItem>
                  <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
                </li>
              </ol>
            </nav>

            <nav ndsBreadcrumb [label]="rotulo('demo-separador')">
              <ol ndsBreadcrumbList>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'home')">{{ t('demonstration.labels.home') }}</a>
                </li>
                <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
                <li ndsBreadcrumbItem>
                  <a ndsBreadcrumbLink href="#" (click)="aoNavegar($event, 'components')">{{ t('demonstration.labels.components') }}</a>
                </li>
                <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
                <li ndsBreadcrumbItem>
                  <span ndsBreadcrumbPage>{{ t('demonstration.labels.breadcrumb') }}</span>
                </li>
              </ol>
            </nav>
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
          [description]="t('import.basic')"
          [code]="importBasico"
          [secondaryDescription]="t('import.withEllipsis')"
          [secondaryCode]="importComReticencias"
          componentSlug="breadcrumb"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.visualTitle')"
          [note]="t('variants.note')"
          [items]="variantItems()"
          componentSlug="breadcrumb"
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
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="breadcrumb"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="breadcrumb" />

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
export class NdsBreadcrumbDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importBasico = IMPORT_BASICO;
  protected readonly importComReticencias = IMPORT_WITH_ELLIPSIS;
  protected readonly customizationCode = CODE_CUSTOMIZACAO;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplVarPadrao = viewChild.required<TemplateRef<unknown>>('tplVarPadrao');
  private readonly tplVarReticencias = viewChild.required<TemplateRef<unknown>>('tplVarReticencias');
  private readonly tplVarSeparador = viewChild.required<TemplateRef<unknown>>('tplVarSeparador');
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  /**
   * Nome do landmark de cada instância. O prefixo vem traduzido; o sufixo é o
   * identificador do exemplo, e não texto de leitura — é o que garante nomes
   * distintos entre as dez trilhas da página.
   */
  protected rotulo(sufixo: string): string {
    return `${t('title')} — ${sufixo}`;
  }

  /**
   * Os links da página são exemplos: navegar de verdade tiraria a pessoa da
   * documentação. O payload leva a CHAVE do rótulo, não o rótulo traduzido —
   * texto traduzido partiria um evento em três no GA4.
   */
  protected aoNavegar(event: Event, chave: string): void {
    event.preventDefault();
    track('navigation_click', {
      component: 'breadcrumb',
      label: chave,
      destination: '#',
      location: 'docs_demo',
    });
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
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
      items: ['link', 'page', 'separator'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
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

  /**
   * Três das quatro configurações que o conteúdo compartilhado lista. A quarta
   * (`responsive`) põe o `BreadcrumbEllipsis` dentro de um DropdownMenu, que
   * ainda não existe neste stack — entra quando o componente chegar, e até lá
   * um exemplo sem menu diria uma coisa e mostraria outra.
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: 'default',
        description: stripHtml(t('variants.items.default')),
        code: CODE_DEFAULT,
        trackId: 'default',
        preview: this.tplVarPadrao(),
      },
      {
        name: 'withEllipsis',
        description: stripHtml(t('variants.items.withEllipsis')),
        code: CODE_WITH_ELLIPSIS,
        trackId: 'withEllipsis',
        preview: this.tplVarReticencias(),
      },
      {
        name: 'customSeparator',
        description: stripHtml(t('variants.items.customSeparator')),
        code: CODE_SEPARATOR_CUSTOMIZADO,
        trackId: 'customSeparator',
        preview: this.tplVarSeparador(),
      },
    ];
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: toPlainText(t('states.cols.trigger')),
      behavior: toPlainText(t('states.cols.behavior')),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['simple', 'asChildLink'].map((k) => ({
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
    const sim = tNav('common.yes');
    const classe = {
      name: 'class',
      type: 'string',
      defaultValue: '—',
      required: nao,
      description: toPlainText(t('props.table.className')),
    };
    const conteudo = {
      name: '(conteúdo)',
      type: 'HTML',
      defaultValue: '—',
      required: sim,
      description: toPlainText(t('props.table.children')),
    };

    return [
      {
        title: t('props.breadcrumbTitle'),
        cols,
        items: [
          { name: 'label', type: 'string', defaultValue: "'breadcrumb'", required: nao, description: toPlainText(t('props.table.label')) },
          classe,
          conteudo,
        ],
      },
      { title: t('props.listTitle'), cols, items: [classe, conteudo] },
      { title: t('props.itemTitle'), cols, items: [classe, conteudo] },
      {
        title: t('props.linkTitle'),
        cols,
        items: [
          { name: 'href', type: 'string', defaultValue: '—', required: sim, description: toPlainText(t('props.table.href')) },
          classe,
          conteudo,
        ],
      },
      { title: t('props.pageTitle'), cols, items: [classe, conteudo] },
      {
        title: t('props.separatorTitle'),
        cols,
        items: [
          classe,
          {
            name: '(conteúdo)',
            type: 'HTML',
            defaultValue: 'ChevronRight',
            required: nao,
            description: toPlainText(t('props.table.children')),
          },
        ],
      },
      {
        title: t('props.ellipsisTitle'),
        cols,
        items: [
          { name: 'label', type: 'string', defaultValue: '—', required: nao, description: toPlainText(t('props.table.ellipsisLabel')) },
          classe,
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
    return [
      { token: '--muted-foreground', classe: '.nds-breadcrumb-list',            k: 'mutedForeground' },
      { token: '--foreground',       classe: '.nds-breadcrumb-page',            k: 'foreground'      },
      { token: '--ring',             classe: '.nds-breadcrumb-link',            k: 'ring'            },
      { token: '--text-control',     classe: '.nds-breadcrumb-list',            k: 'textSm'          },
      { token: '--spacing-1-5',      classe: '.nds-breadcrumb-list',            k: 'gap'             },
      // Sem token: o CSS compartilhado mede o chevron em 0.875rem literal.
      { token: '0.875rem',           classe: '.nds-breadcrumb-separator > svg', k: 'sizeSeparator'   },
      { token: '--spacing-4',        classe: '.nds-breadcrumb-ellipsis > svg',  k: 'sizeEllipsis'    },
    ].map(({ token, classe, k }) => ({
      token,
      value: classe,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5].map((i) => t(`accessibility.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    // Neste componente as falas do leitor moram sob `accessibility.screenReader`
    // — em outros ficam na raiz. As chaves variam, então só os valores chegam ao
    // container.
    const byLocale = breadcrumbTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'navigationMenu', nome: 'NavigationMenu', path: '?path=/docs/ui-navigationmenu--docs' },
      { key: 'stepper',        nome: 'Stepper',        path: '?path=/docs/ui-stepper--docs'        },
      { key: 'tabs',           nome: 'Tabs',           path: '?path=/docs/ui-tabs--docs'           },
      { key: 'dropdownMenu',   nome: 'DropdownMenu',   path: '?path=/docs/ui-dropdownmenu--docs'   },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4].map((i) => ({ title: '', content: t(`notes.tip${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: toPlainText(t('analytics.table.trigger')),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return ['navigationClick', 'ellipsisOpen', 'pageView', 'sectionViewed', 'langSwitch'].map((k) => ({
      event: t(`analytics.table.${k}`),
      trigger: toPlainText(t(`analytics.table.${k}Trigger`)),
      payload: toPlainText(t(`analytics.table.${k}Payload`)),
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
        componentSlug: SLUG,
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
        // O JSON-LD BreadcrumbList sai daqui, não de um <script> escrito à mão
        // na página — é o que `notes.tip1` documenta.
        breadcrumb: [
          { name: 'Components', item: '/components' },
          { name: t('category'), item: '/components/navigation' },
          { name: t('title') },
        ],
      });
      track('docs_page_view', {
        component_name: SLUG,
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
          component_name: SLUG,
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
