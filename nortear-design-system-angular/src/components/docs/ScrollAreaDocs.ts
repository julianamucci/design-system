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
import { NdsScrollArea } from '@/components/ui/scroll-area';
import uiTranslations from '@/i18n/ui.json';
import scrollAreaTranslations from '@shared/content/scroll-area/translations.json';

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

// O conteúdo compartilhado descreve a anatomia das libs headless — ScrollBar,
// Thumb e Corner como ELEMENTOS do DOM. Aqui a barra é a nativa do navegador
// (ver o comentário de decisão em components/ui/scroll-area.ts), então os três
// existem como comportamento e não como nó. Corrigir no override, e não deixar
// passar: descrever peça que não está na página manda quem lê procurar por ela.
//
// A nota de implementação 1 lista a lib de cada stack pelo nome. Cada docs page
// é lida sozinha, então a versão daqui fala só desta stack.
//
// As linhas de propriedade seguem a mesma regra do `asChild` no AspectRatio:
// prop que a stack não tem continua na tabela, dizendo que não existe e por quê
// — quem chega de outra stack procura por ela.
const { t, dict } = useTranslation(scrollAreaTranslations as Record<string, unknown>, {
  'pt-BR': {
    'anatomy.item3':
      '<strong>ScrollBar</strong> — barra desenhada pelo navegador, com a aparência do sistema operacional. Não há elemento próprio no DOM.',
    'anatomy.item4':
      '<strong>Thumb</strong> — o pegador da barra nativa, também desenhado pelo navegador; indica a posição atual.',
    'anatomy.item5':
      '<strong>Corner</strong> — o encontro das duas barras é nativo; não há elemento a estilizar.',
    'notes.item1':
      '<strong>Barra nativa</strong> — a rolagem é a do navegador, sem lib headless. Arrasto do pegador, roda do mouse, teclado e inércia de toque vêm prontos e com a aparência do sistema.',
    'props.table.label':
      'Nome acessível da região rolável. Com nome, a área vira uma região anunciada pelo leitor de tela; sem nome, nenhum papel é emitido.',
    'props.table.size':
      'Degrau da escada de altura da janela rolável, escrito no elemento raiz. Sem ele não há teto, e sem teto não há rolagem. Uma medida fora da escada vem da custom property de altura de caixa.',
    'props.table.typeAbsent':
      'Não existe nesta stack. Quando exibir a barra é decisão do navegador e do sistema operacional, não do componente.',
    'props.table.scrollHideDelayAbsent':
      'Não existe nesta stack. Não há barra própria para esconder, então não há tempo de espera a configurar.',
    'props.table.orientationAbsent':
      'Não existe nesta stack. A direção nasce do conteúdo: o eixo que transborda é o eixo que rola.',
  },
  en: {
    'anatomy.item3':
      '<strong>ScrollBar</strong> — bar drawn by the browser, with the operating system look. There is no element of its own in the DOM.',
    'anatomy.item4':
      '<strong>Thumb</strong> — the native bar grabber, also drawn by the browser; shows the current position.',
    'anatomy.item5':
      '<strong>Corner</strong> — where both bars meet is native; there is no element to style.',
    'notes.item1':
      '<strong>Native bar</strong> — scrolling is the browser one, with no headless lib. Thumb dragging, mouse wheel, keyboard and touch inertia come for free and with the system look.',
    'props.table.label':
      'Accessible name of the scrollable region. With a name the area becomes a region announced by the screen reader; without one, no role is emitted.',
    'props.table.size':
      'Step of the scroll window height scale, written on the root element. Without it there is no ceiling, and without a ceiling there is no scrolling. A measure outside the scale comes from the box height custom property.',
    'props.table.typeAbsent':
      'Does not exist in this stack. When to show the bar is a browser and operating system decision, not the component one.',
    'props.table.scrollHideDelayAbsent':
      'Does not exist in this stack. There is no bar of its own to hide, so there is no delay to configure.',
    'props.table.orientationAbsent':
      'Does not exist in this stack. Direction comes from the content: the axis that overflows is the axis that scrolls.',
  },
  es: {
    'anatomy.item3':
      '<strong>ScrollBar</strong> — barra dibujada por el navegador, con la apariencia del sistema operativo. No hay un elemento propio en el DOM.',
    'anatomy.item4':
      '<strong>Thumb</strong> — el agarre de la barra nativa, también dibujado por el navegador; indica la posición actual.',
    'anatomy.item5':
      '<strong>Corner</strong> — el encuentro de las dos barras es nativo; no hay elemento que estilizar.',
    'notes.item1':
      '<strong>Barra nativa</strong> — el desplazamiento es el del navegador, sin lib headless. Arrastre del agarre, rueda del ratón, teclado e inercia táctil vienen listos y con la apariencia del sistema.',
    'props.table.label':
      'Nombre accesible de la región desplazable. Con nombre, el área se convierte en una región anunciada por el lector de pantalla; sin nombre no se emite ningún rol.',
    'props.table.size':
      'Escalón de la escala de altura de la ventana desplazable, escrito en el elemento raíz. Sin él no hay techo, y sin techo no hay desplazamiento. Una medida fuera de la escala viene de la custom property de altura de caja.',
    'props.table.typeAbsent':
      'No existe en esta stack. Cuándo mostrar la barra es decisión del navegador y del sistema operativo, no del componente.',
    'props.table.scrollHideDelayAbsent':
      'No existe en esta stack. No hay barra propia que ocultar, así que no hay tiempo de espera que configurar.',
    'props.table.orientationAbsent':
      'No existe en esta stack. La dirección nace del contenido: el eje que desborda es el eje que se desplaza.',
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

const STRUCTURE_CODE = `<div ndsScrollArea size="lg" label="Lista de tags" class="nds-w-sm nds-rounded-md nds-border-default">
  <div class="nds-stack nds-p-4" data-spacing="sm">
    <!-- Conteúdo longo -->
  </div>
</div>`;

const VERTICAL_CODE = `<div ndsScrollArea size="md" label="Lista vertical de tags" class="nds-w-sm">
  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (tag of tags; track tag) {
      <p class="nds-text-body nds-m-0">{{ tag }}</p>
    }
  </div>
</div>`;

const HORIZONTAL_CODE = `<div ndsScrollArea label="Fila horizontal de cards" class="nds-max-w-md">
  <!-- .nds-row não quebra linha; .nds-shrink-0 impede o card de encolher -->
  <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
    @for (card of cards; track card) {
      <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted">{{ card }}</div>
    }
  </div>
</div>`;

const CODE_BOTH = `<div ndsScrollArea size="md" label="Matriz com rolagem nos dois eixos" class="nds-max-w-md">
  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (linha of linhas; track linha) {
      <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
        @for (coluna of colunas; track coluna) {
          <span class="nds-text-body nds-shrink-0">{{ linha }} · {{ coluna }}</span>
        }
      </div>
    }
  </div>
</div>`;

// Sem crase e sem template no corpo: o snippet vive dentro de um template
// literal, e uma crase interna encerraria a string no meio.
const INTERFACE_CODE = `// <div ndsScrollArea> — componente de atributo num <div> nativo
@Component({
  selector: 'div[ndsScrollArea]',
  host: { class: 'nds-scroll-area' },
  // template: um <div class="nds-scroll-area-viewport" tabindex="0">
  //           com <ng-content /> dentro
})
export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export class NdsScrollArea {
  readonly label = input<string>('');                    // nome da região
  readonly size = input<ScrollAreaSize | undefined>();   // degrau em data-size
}`;

const EXTENSIBILIDADE_CODE = `<!-- Rolagem horizontal: nada a ligar, é o conteúdo que decide o eixo.
     Sem "size" a altura vem do conteúdo — uma fila de cards não precisa de teto. -->
<div ndsScrollArea label="Catálogo" class="nds-max-w-md nds-whitespace-nowrap">
  <div class="nds-row nds-p-4" data-spacing="md">
    @for (item of itens; track item.id) {
      <div ndsCard class="nds-shrink-0 nds-w-xs">{{ item.nome }}</div>
    }
  </div>
</div>`;

const CUSTOMIZACAO_CODE = `/* A barra é a nativa: espessura e cor vêm do sistema operacional.
   Para afinar sem trocar o desenho do sistema, use as propriedades padrão. */
.nds-scroll-area-viewport {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}`;

/** Rótulo de tecla por chave do conteúdo — a lista em si vem do dicionário. */
const TECLAS: Record<string, string> = {
  tab: 'Tab',
  arrowDown: '↓',
  arrowUp: '↑',
  arrowRight: '→',
  arrowLeft: '←',
  pageDown: 'PageDown',
  pageUp: 'PageUp',
  home: 'Home',
  end: 'End',
};

/** Token de cor por chave da tabela de tokens do conteúdo. */
// Sem `thumb` e sem `muted`: as duas linhas descrevem o pegador e a trilha da
// barra CUSTOMIZADA, e aqui a barra é a nativa do navegador. O filtro em
// `tokenItems` derruba a chave que não está neste mapa, então documentar peça
// que não existe na página deixa de ser possível.
// Medido em `docs/shared/styles/nds/scroll-area.css`: a folha lê `--ring` no
// viewport com foco e `--muted-foreground` no pegador. `--background` e
// `--foreground` não entram em regra nenhuma — o fundo e o texto do viewport
// são herdados de quem usa o container —, então a aplicação fica em travessão.
const TOKENS: Record<string, { token: string; target: string }> = {
  thumb:      { token: '--muted-foreground', target: '.nds-scroll-area-thumb' },
  ring:       { token: '--ring',       target: '.nds-scroll-area-viewport:focus-visible' },
  background: { token: '--background', target: '—' },
  foreground: { token: '--foreground', target: '—' },
};

const CAMINHOS: Record<string, string> = {
  resizable: '?path=/docs/ui-resizable--docs',
  sheet: '?path=/docs/ui-sheet--docs',
  dialog: '?path=/docs/ui-dialog--docs',
  command: '?path=/docs/ui-command--docs',
};

@Component({
  selector: 'nds-scroll-area-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsScrollArea,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Os previews de Do & Dont ficam SEM nome de região de propósito: a página
      já tem seis áreas roláveis nomeadas (demonstração e variantes), e região
      repetida com o mesmo nome é indistinguível na lista do leitor de tela
      (landmark-unique). Aqui o que se demonstra é a altura, não a nomeação.
    -->
    <ng-template #tplDoDont1Do>
      <div ndsScrollArea size="sm" class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tagsDemo(); track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    </ng-template>
    <!--
      SEM "size" de propósito: a legenda deste preview é "não envolva conteúdo de
      altura indefinida — ScrollArea fica invisível". Dar-lhe um degrau mostraria
      o certo com o texto do errado.
    -->
    <ng-template #tplDoDont1Dont>
      <div ndsScrollArea class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tagsCurtas(); track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsScrollArea size="sm" class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tagsDemo(); track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    </ng-template>
    <!--
      Aqui as duas áreas TÊM degrau de propósito: o defeito demonstrado é o
      aninhamento, não a falta de teto — sem altura nas duas não haveria rolagem
      dupla a ver.
    -->
    <ng-template #tplDoDont2Dont>
      <div ndsScrollArea size="sm" class="nds-w-sm nds-rounded-md nds-border-default">
        <div ndsScrollArea size="xs" class="nds-rounded-md nds-border-default">
          <div class="nds-stack nds-p-4" data-spacing="sm">
            @for (tag of tagsDemo(); track tag) {
              <p class="nds-text-body nds-m-0">{{ tag }}</p>
            }
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #tplVarVertical>
      <div ndsScrollArea size="md" [label]="rotulos().vertical" class="nds-w-sm nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (tag of tagsDemo(); track tag) {
            <p class="nds-text-body nds-m-0">{{ tag }}</p>
          }
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarHorizontal>
      <div ndsScrollArea [label]="rotulos().horizontal" class="nds-max-w-md nds-rounded-md nds-border-default">
        <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
          @for (card of cardsDemo(); track card) {
            <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
              {{ card }}
            </div>
          }
        </div>
      </div>
    </ng-template>
    <ng-template #tplVarBoth>
      <div ndsScrollArea size="md" [label]="rotulos().both" class="nds-max-w-md nds-rounded-md nds-border-default">
        <div class="nds-stack nds-p-4" data-spacing="sm">
          @for (line of linhasDemo(); track line) {
            <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
              @for (coluna of colunasDemo(); track coluna) {
                <span class="nds-text-body nds-shrink-0">{{ line }} · {{ coluna }}</span>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="scroll-area"
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
          <div class="nds-grid nds-w-full" data-spacing="lg" style="--grid-min: 18rem">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground nds-m-0">
                {{ t('demonstration.labels.verticalTitle') }}
              </p>
              <div ndsScrollArea size="lg" [label]="t('demonstration.labels.verticalTitle')" class="nds-rounded-md nds-border-default">
                <div class="nds-stack nds-p-4" data-spacing="sm">
                  @for (tag of tagsDemo(); track tag) {
                    <p class="nds-text-body nds-m-0">{{ tag }}</p>
                  }
                </div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground nds-m-0">
                {{ t('demonstration.labels.horizontalTitle') }}
              </p>
              <div ndsScrollArea [label]="t('demonstration.labels.horizontalTitle')" class="nds-rounded-md nds-border-default">
                <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
                  @for (card of cardsDemo(); track card) {
                    <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
                      {{ card }}
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-text-muted-foreground nds-m-0">
                {{ t('demonstration.labels.bothTitle') }}
              </p>
              <div ndsScrollArea size="lg" [label]="t('demonstration.labels.bothTitle')" class="nds-rounded-md nds-border-default">
                <div class="nds-stack nds-p-4" data-spacing="sm">
                  @for (line of linhasDemo(); track line) {
                    <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
                      @for (coluna of colunasDemo(); track coluna) {
                        <span class="nds-text-body nds-shrink-0">{{ line }} · {{ coluna }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureCode]="estruturaCode"
          [structureLabel]="t('anatomy.structureLabel')"
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
          componentSlug="scroll-area"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="scroll-area"
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
          [extensibilityCode]="extensibilidadeCode"
          language="ts"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="customizacaoCode"
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
          componentSlug="scroll-area"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="scroll-area" />

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
export class NdsScrollAreaDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly estruturaCode = STRUCTURE_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilidadeCode = EXTENSIBILIDADE_CODE;
  protected readonly customizacaoCode = CUSTOMIZACAO_CODE;
  protected readonly importCode = `import { NdsScrollArea } from '@/components/ui/scroll-area';`;

  protected readonly activeSection = signal<string | undefined>(undefined);

  // Listas montadas aqui e não no template: expressão de template Angular não
  // tem globais (`Array`), e o rótulo repetido vem do dicionário.
  protected readonly tagsDemo = computed(() => {
    dict();
    const label = t('demonstration.labels.tag');
    return Array.from({ length: 24 }, (_, i) => `${label} ${i + 1}`);
  });
  protected readonly tagsCurtas = computed(() => this.tagsDemo().slice(0, 12));
  protected readonly cardsDemo = computed(() => {
    dict();
    const label = t('demonstration.labels.tag');
    return Array.from({ length: 12 }, (_, i) => `${label} ${i + 1}`);
  });
  protected readonly linhasDemo = computed(() => Array.from({ length: 16 }, (_, i) => `L${i + 1}`));
  protected readonly colunasDemo = computed(() => Array.from({ length: 10 }, (_, i) => `C${i + 1}`));

  /** Nomes das regiões das variantes — distintos entre si e dos da demonstração. */
  protected readonly rotulos = computed(() => {
    dict();
    return {
      vertical: t('variants.items.vertical'),
      horizontal: t('variants.items.horizontal'),
      both: t('variants.items.both'),
    };
  });

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarBoth = viewChild.required<TemplateRef<unknown>>('tplVarBoth');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: t(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: t(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => listFromDict(dict(), 'anatomy'));

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
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    const d = dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      // Linhas derivadas do dicionário: contar à mão faz a chave crua aparecer
      // na tela no dia em que o conteúdo ganhar ou perder uma linha.
      items: namedFromDict(d, 'usage.uxWriting.table', 'name').map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
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
    const d = dict();
    const previews: Record<string, TemplateRef<unknown>> = {
      vertical: this.tplVarVertical(),
      horizontal: this.tplVarHorizontal(),
      both: this.tplVarBoth(),
    };
    const codigos: Record<string, string> = {
      vertical: VERTICAL_CODE,
      horizontal: HORIZONTAL_CODE,
      both: CODE_BOTH,
    };
    return namedFromDict(d, 'variants.items')
      .filter((key) => previews[key])
      .map((key) => ({
        name: t(`variants.items.${key}`),
        description: t(`variants.styles.${key}`),
        code: codigos[key],
        trackId: key,
        preview: previews[key],
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
    const d = dict();
    // Estados nomeados (idle/scrolling/hover/focus), não item1..N — a forma
    // varia entre componentes, e é o dicionário que diz quais existem.
    return namedFromDict(d, 'states', 'label').map((key) => ({
      label: toPlainText(t(`states.${key}.label`)),
      trigger: toPlainText(t(`states.${key}.trigger`)),
      behavior: toPlainText(t(`states.${key}.behavior`)),
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
        title: 'NdsScrollArea',
        cols,
        items: [
          { name: 'label', type: 'string', defaultValue: '—', required: not, description: toPlainText(t('props.table.label')) },
          { name: 'size', type: '"xs" | "sm" | "md" | "lg" | "xl"', defaultValue: '—', required: not, description: toPlainText(t('props.table.size')) },
          // `class` e o conteúdo continuam descritos pelo conteúdo compartilhado:
          // as chaves são objetos ({type, default, required, description}), então
          // o caminho é completo — `t('props.table.className')` devolveria a
          // própria chave e ela apareceria crua na tela.
          {
            name: 'class',
            type: t('props.table.className.type'),
            defaultValue: t('props.table.className.default'),
            required: t('props.table.className.required'),
            description: toPlainText(t('props.table.className.description')),
          },
          {
            name: '(conteúdo)',
            type: 'HTML',
            defaultValue: t('props.table.children.default'),
            required: t('props.table.children.required'),
            description: toPlainText(t('props.table.children.description')),
          },
          { name: 'type', type: '—', defaultValue: '—', required: not, description: toPlainText(t('props.table.typeAbsent')) },
          { name: 'scrollHideDelay', type: '—', defaultValue: '—', required: not, description: toPlainText(t('props.table.scrollHideDelayAbsent')) },
          { name: 'orientation', type: '—', defaultValue: '—', required: not, description: toPlainText(t('props.table.orientationAbsent')) },
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
    const d = dict();
    return namedFromDict(d, 'tokens.table', 'part')
      .filter((key) => TOKENS[key])
      .map((key) => ({
        token: TOKENS[key].token,
        value: TOKENS[key].target,
        description: toPlainText(t(`tokens.table.${key}.part`)),
      }));
  });

  protected readonly a11yItems = computed(() => listFromDict(dict(), 'accessibility.items'));

  protected readonly keyboardItems = computed(() => {
    const d = dict();
    return namedLeafsFromDict(d, 'accessibility.keyboard', ['title']).map((key) => ({
      key: TECLAS[key] ?? key,
      description: toPlainText(t(`accessibility.keyboard.${key}`)),
    }));
  });

  protected readonly screenReaderItems = computed(() => {
    const d = dict();
    return namedLeafsFromDict(d, 'accessibility.screenReader', ['title']).map((key) =>
      t(`accessibility.screenReader.${key}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    const d = dict();
    return namedFromDict(d, 'related.items', 'name')
      .filter((key) => CAMINHOS[key])
      .map((key) => ({
        name: t(`related.items.${key}.name`),
        description: t(`related.items.${key}.description`),
        path: CAMINHOS[key],
      }));
  });

  protected readonly noteItems = computed(() =>
    listFromDict(dict(), 'notes').map((content) => ({ title: '', content })),
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
    const d = dict();
    // O componente é passivo: nada aqui dispara evento. A linha documenta o
    // evento tipado que a aplicação consumidora usa quando quer medir leitura.
    return namedFromDict(d, 'analytics.table', 'trigger').map((evento) => ({
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
      // Critério como frase única, não {criterion, level, how}.
      items: listFromDict(d, 'testes.accessibility').map((criterio) => ({
        criterion: toPlainText(criterio),
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
        componentSlug: 'scroll-area',
      });
      track('docs_page_view', {
        component_name: 'scroll-area',
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
          component_name: 'scroll-area',
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

/** Linhas `item1..itemN` com campos — para até o primeiro buraco. */
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

/** Lista `item1..itemN` de strings — a contagem vem do dicionário, não do código. */
function listFromDict(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
}

/** Chaves nomeadas sob `base` que têm o campo `field` (ordem do arquivo). */
function namedFromDict(d: Record<string, string>, base: string, field?: string): string[] {
  const sufixo = field ? `.${field}` : '';
  const rx = new RegExp(`^${base.replace(/\./g, '\\.')}\\.([^.]+)${sufixo.replace(/\./g, '\\.')}$`);
  const out: string[] = [];
  for (const key of Object.keys(d)) {
    const m = key.match(rx);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** Chaves folha diretas sob `base`, menos as de cabeçalho. */
function namedLeafsFromDict(
  d: Record<string, string>,
  base: string,
  excluir: readonly string[],
): string[] {
  return namedFromDict(d, base).filter((key) => !excluir.includes(key));
}
