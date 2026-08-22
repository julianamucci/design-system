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
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from '@/components/ui/pagination';
import uiTranslations from '@/i18n/ui.json';
import paginationTranslations from '@shared/content/pagination/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
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

const SLUG = 'pagination';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);

// Overrides: só onde o conteúdo compartilhado descreve uma API que este stack
// não tem (`className`/`children` são nomes de React; a composição com elemento
// filho não existe em Angular, porque a diretiva vai no próprio elemento do
// consumidor) ou onde ele nomeia outra stack, o que vaza numa doc que é lida
// isolada. Nenhum snippet `*Code` entra aqui: snippet em override fica preso a
// um stack e some do conteúdo compartilhado.
const { t, dict } = useTranslation(paginationTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.table.className.description':
      'Classes extras vão no atributo class do próprio elemento — o Angular mescla com a classe base.',
    'props.table.children.description':
      'Conteúdo do link — o número da página, escrito no template de quem usa.',
    'props.table.disabled.description':
      'Desliga o controle nos extremos da faixa. Aplica aria-disabled, tira o link da tabulação e barra o clique — em um link não existe disabled.',
    'props.table.label.description':
      'Nome acessível: do landmark no container, do controle em Previous e Next, das reticências quando elas precisam ser anunciadas.',
    'notes.item1':
      '<strong>A diretiva vai no elemento que você escreve</strong> — é um <code>&lt;a&gt;</code> de verdade, com o <code>href</code> e o <code>routerLink</code> que você já usava. Não há elemento a substituir.',
    'notes.item5':
      '<strong>Estado é de quem consome</strong> — a paginação não guarda página atual. Mantenha o número num sinal do componente pai e sincronize com a URL para preservar deep-link e botão voltar.',
  },
  en: {
    'props.table.className.description':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the base class.',
    'props.table.children.description':
      'Link content — the page number, written in the consumer template.',
    'props.table.disabled.description':
      'Turns the control off at the edges of the range. Applies aria-disabled, removes the link from tab order and blocks the click — a link has no disabled.',
    'props.table.label.description':
      'Accessible name: of the landmark on the container, of the control on Previous and Next, of the ellipsis when it needs to be announced.',
    'notes.item1':
      '<strong>The directive goes on the element you write</strong> — it is a real <code>&lt;a&gt;</code>, with the <code>href</code> and <code>routerLink</code> you already had. There is no element to replace.',
    'notes.item5':
      '<strong>State belongs to the consumer</strong> — pagination holds no current page. Keep the number in a parent signal and sync it with the URL to preserve deep-link and the back button.',
  },
  es: {
    'props.table.className.description':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con la clase base.',
    'props.table.children.description':
      'Contenido del enlace — el número de página, escrito en el template de quien lo usa.',
    'props.table.disabled.description':
      'Apaga el control en los extremos de la franja. Aplica aria-disabled, saca el enlace de la tabulación y bloquea el clic — en un enlace no existe disabled.',
    'props.table.label.description':
      'Nombre accesible: del landmark en el contenedor, del control en Previous y Next, de los puntos suspensivos cuando deben anunciarse.',
    'notes.item1':
      '<strong>La directiva va en el elemento que escribes</strong> — es un <code>&lt;a&gt;</code> real, con el <code>href</code> y el <code>routerLink</code> que ya tenías. No hay elemento que reemplazar.',
    'notes.item5':
      '<strong>El estado es de quien consume</strong> — la paginación no guarda la página actual. Mantén el número en una señal del componente padre y sincronízalo con la URL para preservar deep-link y el botón atrás.',
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

// ─── Números das demonstrações ────────────────────────────────────────────────
//
// Constantes, e não literais espalhados: a faixa exibida e a contagem que as
// asserções e o payload de analytics usam saem do mesmo lugar.

const SIMPLE_TOTAL = 5;
const TOTAL_INTERATIVO = 8;
const LONG_TOTAL = 12;

const SIMPLE_PAGES = Array.from({ length: SIMPLE_TOTAL }, (_, i) => i + 1);
const PAGES_INTERATIVO = Array.from({ length: TOTAL_INTERATIVO }, (_, i) => i + 1);
/** Recorte de um total de 12: primeira, vizinhas da atual e última. */
const TRECHOS_LONGOS: (number | 'ellipsis')[] = [1, 'ellipsis', 5, 6, 7, 'ellipsis', LONG_TOTAL];

// ─── Snippets ─────────────────────────────────────────────────────────────────

const IMPORT_BASICO = `import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationPrevious,
  NdsPaginationNext,
  NdsPaginationEllipsis,
} from '@/components/ui/pagination';`;

const CODE_LINK = `<li ndsPaginationItem>
  <a ndsPaginationLink href="#" aria-label="Ir para página 2">2</a>
</li>`;

const CODE_DIRECIONAL = `<li ndsPaginationItem>
  <a
    ndsPaginationPrevious
    href="#"
    text="Anterior"
    label="Ir para a página anterior"
  ></a>
</li>
<li ndsPaginationItem>
  <a
    ndsPaginationNext
    href="#"
    text="Próxima"
    label="Ir para a próxima página"
  ></a>
</li>`;

const SIMPLE_CODE = `<nav ndsPagination>
  <ul ndsPaginationContent>
    <li ndsPaginationItem>
      <a ndsPaginationPrevious href="#" text="Anterior" [disabled]="true"></a>
    </li>
    @for (n of paginas; track n) {
      <li ndsPaginationItem>
        <a
          ndsPaginationLink
          href="#"
          [isActive]="n === 1"
          [attr.aria-label]="'Ir para página ' + n"
        >{{ n }}</a>
      </li>
    }
    <li ndsPaginationItem>
      <a ndsPaginationNext href="#" text="Próxima"></a>
    </li>
  </ul>
</nav>`;

const CODE_ELLIPSIS = `<nav ndsPagination>
  <ul ndsPaginationContent>
    <li ndsPaginationItem>
      <a ndsPaginationPrevious href="#" text="Anterior"></a>
    </li>
    @for (trecho of trechos; track $index) {
      <li ndsPaginationItem>
        @if (trecho === 'ellipsis') {
          <span ndsPaginationEllipsis></span>
        } @else {
          <a
            ndsPaginationLink
            href="#"
            [isActive]="trecho === atual()"
            [attr.aria-label]="'Ir para página ' + trecho"
          >{{ trecho }}</a>
        }
      </li>
    }
    <li ndsPaginationItem>
      <a ndsPaginationNext href="#" text="Próxima"></a>
    </li>
  </ul>
</nav>`;

const CODE_INTERATIVO = `readonly atual = signal(3);
readonly total = 8;
readonly paginas = Array.from({ length: this.total }, (_, i) => i + 1);

irPara(evento: Event, pagina: number): void {
  evento.preventDefault();
  this.atual.set(pagina);
}

// template
<nav ndsPagination>
  <ul ndsPaginationContent>
    <li ndsPaginationItem>
      <a
        ndsPaginationPrevious
        href="#"
        text="Anterior"
        [disabled]="atual() === 1"
        (click)="irPara($event, atual() - 1)"
      ></a>
    </li>
    @for (n of paginas; track n) {
      <li ndsPaginationItem>
        <a
          ndsPaginationLink
          href="#"
          [isActive]="n === atual()"
          (click)="irPara($event, n)"
        >{{ n }}</a>
      </li>
    }
    <li ndsPaginationItem>
      <a
        ndsPaginationNext
        href="#"
        text="Próxima"
        [disabled]="atual() === total"
        (click)="irPara($event, atual() + 1)"
      ></a>
    </li>
  </ul>
</nav>`;

const INTERFACE_CODE = `// nav[ndsPagination] — landmark da paginação
@Directive({ selector: 'nav[ndsPagination]' })
export class NdsPagination {
  readonly label = input<string | undefined>(undefined);   // padrão: 'pagination'
}

// ul[ndsPaginationContent] · li[ndsPaginationItem]
// Diretivas sem entrada: aplicam classe e data-slot no elemento nativo.

// a[ndsPaginationLink] — link de uma página
@Component({ selector: 'a[ndsPaginationLink]' })
export class NdsPaginationLink {
  readonly isActive = input<boolean>(false);
  readonly size = input<ButtonSize>('icon');
  readonly disabled = input<boolean>(false);
}

// a[ndsPaginationPrevious] · a[ndsPaginationNext] — controles de direção
@Component({ selector: 'a[ndsPaginationPrevious]' })
export class NdsPaginationPrevious {
  readonly text = input<string>('Previous');               // rótulo visível
  readonly label = input<string | undefined>(undefined);   // nome acessível
  readonly disabled = input<boolean>(false);
}

// span[ndsPaginationEllipsis] — páginas omitidas
@Component({ selector: 'span[ndsPaginationEllipsis]' })
export class NdsPaginationEllipsis {
  readonly label = input<string | undefined>(undefined);   // sem rótulo: decorativo
}`;

const EXTENSIBILIDADE_ANGULAR = {
  'pt-BR':
    'Todos os subcomponentes são seletores de atributo no elemento nativo: as classes extras vão no <code>class</code> do próprio elemento e o Angular as mescla com a classe base. Para integrar com o router, aplique <code>ndsPaginationLink</code> no <code>&lt;a routerLink&gt;</code> — não há elemento a substituir, porque o elemento já é o de quem escreve.',
  en: 'Every subcomponent is an attribute selector on the native element: extra classes go on the element own <code>class</code> and Angular merges them with the base class. To integrate with the router, apply <code>ndsPaginationLink</code> on the <code>&lt;a routerLink&gt;</code> — there is no element to replace, because the element is already the one you wrote.',
  es: 'Todos los subcomponentes son selectores de atributo sobre el elemento nativo: las clases extra van en el <code>class</code> del propio elemento y Angular las combina con la clase base. Para integrar con el router, aplica <code>ndsPaginationLink</code> en el <code>&lt;a routerLink&gt;</code> — no hay elemento que reemplazar, porque el elemento ya es el tuyo.',
} as const;

/**
 * Nível WCAG e técnica de verificação de cada critério de acessibilidade.
 *
 * O texto do critério vem do conteúdo compartilhado; só o par nível/técnica
 * mora aqui, porque as três colunas da tabela existem no container e não no
 * JSON. Indexado por posição, com folga: se o conteúdo ganhar um critério, ele
 * aparece com o padrão em vez de sumir da tabela.
 */
const META_A11Y = [
  { level: 'AA',    how: 'axe-core' },
  { level: '1.4.3', how: 'axe-core (color-contrast)' },
  { level: '2.4.7', how: 'Storybook Interactions' },
  { level: '4.1.2', how: 'DevTools' },
  { level: '4.1.2', how: 'DevTools' },
];

@Component({
  selector: 'nds-pagination-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem, NdsPaginationLink,
    NdsPaginationPrevious, NdsPaginationNext, NdsPaginationEllipsis,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Cada paginação da página recebe um nome próprio. A docs page mostra a peça
      nove vezes; sem nomes distintos o axe acusa landmark-unique e o leitor de
      tela anuncia "navegação" nove vezes sem dizer qual é qual.
    -->
    <ng-template #tplVarLink>
      <nav ndsPagination [label]="rotulo('variante-link')">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationLink
              href="#"
              [attr.aria-label]="rotuloPagina(2)"
              (click)="irTo($event, 2, totalSimples)"
            >2</a>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplVarDirecional>
      <nav ndsPagination [label]="rotulo('variante-direcional')">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="t('demonstration.labels.previous')"
              [label]="t('demonstration.labels.previous')"
              (click)="irTo($event, 1, totalSimples)"
            ></a>
          </li>
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="t('demonstration.labels.next')"
              [label]="t('demonstration.labels.next')"
              (click)="irTo($event, 2, totalSimples)"
            ></a>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplVarSimples>
      <nav ndsPagination [label]="rotulo('variante-simples')">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="t('demonstration.labels.previous')"
              [label]="t('demonstration.labels.previous')"
              [disabled]="true"
            ></a>
          </li>
          @for (n of paginasSimples; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === 1"
                [attr.aria-label]="rotuloPagina(n)"
                (click)="irTo($event, n, totalSimples)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="t('demonstration.labels.next')"
              [label]="t('demonstration.labels.next')"
              (click)="irTo($event, 2, totalSimples)"
            ></a>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplVarReticencias>
      <nav ndsPagination [label]="rotulo('variante-reticencias')">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="t('demonstration.labels.previous')"
              [label]="t('demonstration.labels.previous')"
              (click)="irTo($event, 5, totalLongo)"
            ></a>
          </li>
          @for (trecho of trechosLongos; track $index) {
            <li ndsPaginationItem>
              @if (trecho === 'ellipsis') {
                <span ndsPaginationEllipsis></span>
              } @else {
                <a
                  ndsPaginationLink
                  href="#"
                  [isActive]="trecho === 6"
                  [attr.aria-label]="rotuloPagina(trecho)"
                  (click)="irTo($event, trecho, totalLongo)"
                >{{ trecho }}</a>
              }
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="t('demonstration.labels.next')"
              [label]="t('demonstration.labels.next')"
              (click)="irTo($event, 7, totalLongo)"
            ></a>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplVarInterativo>
      <div class="nds-stack" data-spacing="sm">
        <nav ndsPagination [label]="rotulo('variante-interativa')">
          <ul ndsPaginationContent>
            <li ndsPaginationItem>
              <a
                ndsPaginationPrevious
                href="#"
                [text]="t('demonstration.labels.previous')"
                [label]="t('demonstration.labels.previous')"
                [disabled]="paginaInterativa() === 1"
                (click)="irTo($event, paginaInterativa() - 1, totalInterativo)"
              ></a>
            </li>
            @for (n of paginasInterativo; track n) {
              <li ndsPaginationItem>
                <a
                  ndsPaginationLink
                  href="#"
                  [isActive]="n === paginaInterativa()"
                  [attr.aria-label]="rotuloPagina(n)"
                  (click)="irTo($event, n, totalInterativo)"
                >{{ n }}</a>
              </li>
            }
            <li ndsPaginationItem>
              <a
                ndsPaginationNext
                href="#"
                [text]="t('demonstration.labels.next')"
                [label]="t('demonstration.labels.next')"
                [disabled]="paginaInterativa() === totalInterativo"
                (click)="irTo($event, paginaInterativa() + 1, totalInterativo)"
              ></a>
            </li>
          </ul>
        </nav>
        <p class="nds-text-body nds-text-muted-foreground">
          {{ t('demonstration.labels.current') }}: {{ paginaInterativa() }} / {{ totalInterativo }}
        </p>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Do>
      <nav ndsPagination [label]="rotulo('do-1')">
        <ul ndsPaginationContent>
          @for (trecho of trechosLongos; track $index) {
            <li ndsPaginationItem>
              @if (trecho === 'ellipsis') {
                <span ndsPaginationEllipsis></span>
              } @else {
                <a
                  ndsPaginationLink
                  href="#"
                  [isActive]="trecho === 6"
                  [attr.aria-label]="rotuloPagina(trecho)"
                  (click)="irTo($event, trecho, totalLongo)"
                >{{ trecho }}</a>
              }
            </li>
          }
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- O erro que o exemplo mostra: doze números seguidos, sem recorte. -->
      <nav ndsPagination [label]="rotulo('dont-1')">
        <ul ndsPaginationContent>
          @for (n of paginasLongas; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === 6"
                [attr.aria-label]="rotuloPagina(n)"
                (click)="irTo($event, n, totalLongo)"
              >{{ n }}</a>
            </li>
          }
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplDoDont2Do>
      <nav ndsPagination [label]="rotulo('do-2')">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="t('demonstration.labels.previous')"
              [label]="t('demonstration.labels.previous')"
              (click)="irTo($event, 1, totalSimples)"
            ></a>
          </li>
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="t('demonstration.labels.next')"
              [label]="t('demonstration.labels.next')"
              (click)="irTo($event, 2, totalSimples)"
            ></a>
          </li>
        </ul>
      </nav>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- O erro que o exemplo mostra: seta sem nome acessível nenhum. -->
      <p class="nds-text-body nds-font-mono nds-text-muted-foreground nds-italic">
        &lt; &nbsp; &gt;
      </p>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="pagination"
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
          <div class="nds-stack nds-w-full" data-spacing="xl">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('variants.items.interactive.name') }}
              </p>
              <nav ndsPagination [label]="rotulo('demo-interativa')">
                <ul ndsPaginationContent>
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationPrevious
                      href="#"
                      [text]="t('demonstration.labels.previous')"
                      [label]="t('demonstration.labels.previous')"
                      [disabled]="paginaDemo() === 1"
                      (click)="irParaDemo($event, paginaDemo() - 1)"
                    ></a>
                  </li>
                  @for (n of paginasSimples; track n) {
                    <li ndsPaginationItem>
                      <a
                        ndsPaginationLink
                        href="#"
                        [isActive]="n === paginaDemo()"
                        [attr.aria-label]="rotuloPagina(n)"
                        (click)="irParaDemo($event, n)"
                      >{{ n }}</a>
                    </li>
                  }
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationNext
                      href="#"
                      [text]="t('demonstration.labels.next')"
                      [label]="t('demonstration.labels.next')"
                      [disabled]="paginaDemo() === totalSimples"
                      (click)="irParaDemo($event, paginaDemo() + 1)"
                    ></a>
                  </li>
                </ul>
              </nav>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ t('demonstration.labels.current') }}: {{ paginaDemo() }} / {{ totalSimples }}
              </p>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('variants.items.withEllipsis.name') }}
              </p>
              <nav ndsPagination [label]="rotulo('demo-reticencias')">
                <ul ndsPaginationContent>
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationPrevious
                      href="#"
                      [text]="t('demonstration.labels.previous')"
                      [label]="t('demonstration.labels.previous')"
                      (click)="irTo($event, 5, totalLongo)"
                    ></a>
                  </li>
                  @for (trecho of trechosLongos; track $index) {
                    <li ndsPaginationItem>
                      @if (trecho === 'ellipsis') {
                        <span ndsPaginationEllipsis></span>
                      } @else {
                        <a
                          ndsPaginationLink
                          href="#"
                          [isActive]="trecho === 6"
                          [attr.aria-label]="rotuloPagina(trecho)"
                          (click)="irTo($event, trecho, totalLongo)"
                        >{{ trecho }}</a>
                      }
                    </li>
                  }
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationNext
                      href="#"
                      [text]="t('demonstration.labels.next')"
                      [label]="t('demonstration.labels.next')"
                      (click)="irTo($event, 7, totalLongo)"
                    ></a>
                  </li>
                </ul>
              </nav>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('states.lastPage.label') }}
              </p>
              <nav ndsPagination [label]="rotulo('demo-ultima')">
                <ul ndsPaginationContent>
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationPrevious
                      href="#"
                      [text]="t('demonstration.labels.previous')"
                      [label]="t('demonstration.labels.previous')"
                      (click)="irTo($event, 4, totalSimples)"
                    ></a>
                  </li>
                  @for (n of paginasSimples; track n) {
                    <li ndsPaginationItem>
                      <a
                        ndsPaginationLink
                        href="#"
                        [isActive]="n === totalSimples"
                        [attr.aria-label]="rotuloPagina(n)"
                        (click)="irTo($event, n, totalSimples)"
                      >{{ n }}</a>
                    </li>
                  }
                  <li ndsPaginationItem>
                    <a
                      ndsPaginationNext
                      href="#"
                      [text]="t('demonstration.labels.next')"
                      [label]="t('demonstration.labels.next')"
                      [disabled]="true"
                    ></a>
                  </li>
                </ul>
              </nav>
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
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importBasico"
          componentSlug="pagination"
          language="ts"
        />

        <nds-docs-compositions
          id="variantes"
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="pagination"
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
          [extensibilityNotes]="extensibilityNotes()"
          [extensibilityCode]="t('props.extensibilityCode')"
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
          componentSlug="pagination"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="pagination" />

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
export class NdsPaginationDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importBasico = IMPORT_BASICO;

  protected readonly totalSimples = SIMPLE_TOTAL;
  protected readonly totalInterativo = TOTAL_INTERATIVO;
  protected readonly totalLongo = LONG_TOTAL;
  protected readonly paginasSimples = SIMPLE_PAGES;
  protected readonly paginasInterativo = PAGES_INTERATIVO;
  protected readonly paginasLongas = Array.from({ length: LONG_TOTAL }, (_, i) => i + 1);
  protected readonly trechosLongos = TRECHOS_LONGOS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Estado das duas demonstrações interativas — a da seção e a da variante. */
  protected readonly paginaDemo = signal(1);
  protected readonly paginaInterativa = signal(3);

  private readonly tplVarLink = viewChild.required<TemplateRef<unknown>>('tplVarLink');
  private readonly tplVarDirecional = viewChild.required<TemplateRef<unknown>>('tplVarDirecional');
  private readonly tplVarSimples = viewChild.required<TemplateRef<unknown>>('tplVarSimples');
  private readonly tplVarReticencias = viewChild.required<TemplateRef<unknown>>('tplVarReticencias');
  private readonly tplVarInterativo = viewChild.required<TemplateRef<unknown>>('tplVarInterativo');
  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');

  /**
   * Nome do landmark de cada instância. O prefixo vem traduzido; o sufixo é o
   * identificador do exemplo, e não texto de leitura — é o que garante nomes
   * distintos entre as nove paginações da página.
   */
  protected rotulo(sufixo: string): string {
    return `${t('title')} — ${sufixo}`;
  }

  /** Nome acessível de um link numerado: o número sozinho não diz nada em voz alta. */
  protected rotuloPagina(pagina: number | string): string {
    return `${t('demonstration.labels.page')} ${pagina}`;
  }

  /**
   * Os links da página são exemplos: navegar de verdade tiraria a pessoa da
   * documentação. O payload leva números e o slug — nunca texto traduzido, que
   * partiria um evento em três no GA4.
   */
  protected irTo(evento: Event, pagina: number | string, total: number): void {
    evento.preventDefault();
    track('page_change', {
      component: SLUG,
      page: Number(pagina),
      total_pages: total,
      location: 'docs_demo',
    });
  }

  /** A demonstração da seção guarda estado; as outras só emitem o evento. */
  protected irParaDemo(evento: Event, pagina: number): void {
    this.paginaDemo.set(pagina);
    this.irTo(evento, pagina, SIMPLE_TOTAL);
  }

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return stringsFromDict(d, 'anatomy');
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return {
      title: t('usage.guidelines.title'),
      items: stringsFromDict(d, 'usage.guidelines'),
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
      items: ['previous', 'next', 'page', 'ellipsis'].map((key) => ({
        element: t(`usage.uxWriting.table.${key}.name`),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: stringsFromDict(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: stringsFromDict(d, 'usage.dont') };
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
   * Duas famílias no mesmo eixo: os dois estilos de link (`variants.styles`) e
   * as três configurações da faixa (`variants.items`). O conteúdo compartilhado
   * guarda as duas sob `variants`, então as duas aparecem aqui.
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.items.default'),
        description: stripHtml(t('variants.styles.default')),
        code: CODE_LINK,
        trackId: 'default',
        preview: this.tplVarLink(),
      },
      {
        name: t('variants.items.directional'),
        description: stripHtml(t('variants.styles.directional')),
        code: CODE_DIRECIONAL,
        trackId: 'directional',
        preview: this.tplVarDirecional(),
      },
      {
        name: t('variants.items.simple.name'),
        description: stripHtml(t('variants.items.simple.description')),
        useWhen: stripHtml(t('variants.items.simple.use')),
        code: SIMPLE_CODE,
        trackId: 'simple',
        preview: this.tplVarSimples(),
      },
      {
        name: t('variants.items.withEllipsis.name'),
        description: stripHtml(t('variants.items.withEllipsis.description')),
        useWhen: stripHtml(t('variants.items.withEllipsis.use')),
        code: CODE_ELLIPSIS,
        trackId: 'withEllipsis',
        preview: this.tplVarReticencias(),
      },
      {
        name: t('variants.items.interactive.name'),
        description: stripHtml(t('variants.items.interactive.description')),
        useWhen: stripHtml(t('variants.items.interactive.use')),
        code: CODE_INTERATIVO,
        trackId: 'interactive',
        preview: this.tplVarInterativo(),
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
    return ['default', 'hover', 'active', 'disabled', 'focus', 'lastPage'].map((k) => ({
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

    const ofKey = (chave: string, nome: string) => ({
      name: nome,
      type: toPlainText(t(`props.table.${chave}.type`)),
      defaultValue: toPlainText(t(`props.table.${chave}.default`)),
      required: toPlainText(t(`props.table.${chave}.required`)),
      description: toPlainText(t(`props.table.${chave}.description`)),
    });

    return [
      {
        cols,
        items: [
          ofKey('isActive', 'isActive'),
          ofKey('size', 'size'),
          ofKey('text', 'text'),
          // `disabled` e `label` não existem no conteúdo compartilhado: são o
          // par que substitui, em Angular, o `aria-disabled`/`tabIndex` que as
          // outras stacks escrevem à mão no elemento.
          {
            name: 'disabled',
            type: 'boolean',
            defaultValue: 'false',
            required: not,
            description: toPlainText(t('props.table.disabled.description')),
          },
          {
            name: 'label',
            type: 'string',
            defaultValue: '—',
            required: not,
            description: toPlainText(t('props.table.label.description')),
          },
          ofKey('className', 'class'),
          ofKey('children', '(conteúdo)'),
        ],
      },
    ];
  });

  protected readonly extensibilityNotes = computed(() => {
    dict();
    return EXTENSIBILIDADE_ANGULAR[getLocale()];
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
      { token: '--foreground',        k: 'foreground'        },
      { token: '--accent',            k: 'accent'            },
      { token: '--accent-foreground', k: 'accentForeground'  },
      { token: '--ring',              k: 'ring'              },
      { token: '--muted-foreground',  k: 'ellipsis'          },
      { token: '--radius',            k: 'radius'            },
      { token: '--spacing-1',         k: 'gap'               },
    ].map(({ token, k }) => ({
      token,
      value: toPlainText(t(`tokens.table.${k}.class`)),
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    const d = dict();
    return stringsFromDict(d, 'accessibility.items');
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',       description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Shift+Tab', description: toPlainText(t('accessibility.keyboard.shiftTab')) },
      { key: 'Enter',     description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',     description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    // Neste componente as falas do leitor moram sob `accessibility.screenReader`
    // — em outros ficam na raiz. As chaves variam, então só os valores chegam ao
    // container.
    const byLocale = paginationTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    return Object.values(byLocale[locale]?.accessibility?.screenReader ?? {});
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'breadcrumb', path: '?path=/docs/ui-breadcrumb--docs' },
      { key: 'tabs',       path: '?path=/docs/ui-tabs--docs'       },
      { key: 'button',     path: '?path=/docs/ui-button--docs'     },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: toPlainText(t(`related.items.${key}.description`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    const d = dict();
    return stringsFromDict(d, 'notes').map((content) => ({ title: '', content }));
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
    const d = dict();
    // Derivado do dicionário: cada evento documentado é a chave que tem
    // `.trigger` sob `analytics.table`. Uma lista escrita à mão deixaria de
    // acompanhar o conteúdo compartilhado.
    return eventKeysFromDict(d).map((evento) => ({
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
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: stringsFromDict(d, 'testes.accessibility').map((criterio, i) => ({
        criterion: toPlainText(criterio),
        level: META_A11Y[i]?.level ?? 'AA',
        how: META_A11Y[i]?.how ?? 'axe-core',
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

/**
 * Linhas `item1..itemN` com subcampos. Para até acabar — contar à mão deixaria a
 * chave crua aparecer na tela se o conteúdo perdesse ou ganhasse um item.
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

/** Mesma ideia, para `item1..itemN` que são texto direto. */
function stringsFromDict(d: Record<string, string>, base: string): string[] {
  const itens: string[] = [];
  for (let i = 1; ; i++) {
    const valor = d[`${base}.item${i}`];
    if (valor === undefined) break;
    itens.push(valor);
  }
  return itens;
}

/** Eventos de `analytics.table`: as chaves que têm um `.trigger` embaixo. */
function eventKeysFromDict(d: Record<string, string>): string[] {
  const prefixo = 'analytics.table.';
  const eventos: string[] = [];
  for (const chave of Object.keys(d)) {
    if (!chave.startsWith(prefixo) || !chave.endsWith('.trigger')) continue;
    const nome = chave.slice(prefixo.length, -'.trigger'.length);
    if (nome && !nome.includes('.')) eventos.push(nome);
  }
  return eventos;
}
