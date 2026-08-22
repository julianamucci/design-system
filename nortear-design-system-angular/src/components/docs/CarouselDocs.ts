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
import { NDS_CAROUSEL, type CarouselSlideChange } from '@/components/ui/carousel';
import { NdsAspectRatio } from '@/components/ui/aspect-ratio';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import carouselTranslations from '@shared/content/carousel/translations.json';

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

// ─── Overrides ────────────────────────────────────────────────────────────────
//
// Duas famílias, e nenhuma delas é snippet `*Code` (que ficaria preso aqui e
// invisível para o conteúdo compartilhado):
//
// 1. RÓTULOS que o conteúdo compartilhado não tem. Cada preview desta página é
//    um `role="region"`, e região com o MESMO nome repetida na página reprova em
//    `landmark-unique` no axe. Os nomes curtos abaixo dão a cada preview um nome
//    próprio e servem também de título do card de variante — sem eles o card
//    repetiria a descrição inteira no lugar do título.
//
// 2. TEXTO que descreve a API do Embla, que esta stack não usa. O carrossel
//    daqui não tem plugin, `setApi` nem classes `basis-*` do Tailwind: o loop e
//    o autoplay são inputs, e a base do slide vem das utilitárias `.nds-*`.
//    Divergência registrada, não "alinhada".
const { t, dict } = useTranslation(carouselTranslations as Record<string, unknown>, {
  'pt-BR': {
    'variants.items.horizontal.name': 'Horizontal',
    'variants.items.vertical.name': 'Vertical',
    'variants.items.single.name': 'Um item por vez',
    'variants.items.multi.name': 'Vários itens visíveis',
    'demonstration.labels.regionDemo': 'Galeria de exemplos',
    'demonstration.labels.pause': 'Pausar apresentação',
    'demonstration.labels.resume': 'Retomar apresentação',
    'demonstration.labels.galleryCaption': 'Foto do produto',
    'props.extensibility':
      'Classes extras vão no atributo class do próprio elemento — o Angular as mescla com as do design system. A base do slide (quantos itens aparecem por vez) é uma utilitária de largura aplicada no item, e pode ser responsiva.',
    'doDont.pair1.doName': 'Navegação visível',
    'doDont.pair1.dontName': 'Navegação escondida',
    'doDont.pair2.doName': 'Avanço automático com pausa',
    'doDont.pair2.dontName': 'Avanço automático sem pausa',
    'usage.guidelines.item2':
      'Defina quantos itens aparecem por vez pela base do slide — as utilitárias de largura do design system, aplicadas no item, não uma medida escrita no elemento.',
    'usage.guidelines.item3':
      'Para avanço automático, combine repetição com um comando visível de pausa: a interação do usuário já interrompe o relógio sozinha.',
    'variants.angularScope':
      'Nesta stack não há plugin nem instância externa: repetição e avanço automático são entradas do próprio componente, e a posição atual é lida do componente para montar dots e contadores.',
    'notes.tip1':
      'O respiro entre os slides vem do espaçamento da faixa, não de margem negativa somada a padding: o slide é o que se vê e o que rola.',
    'notes.tip2':
      'Para montar dots ou contador, leia a posição e o total do próprio componente por referência de template e chame o comando de ir para um índice.',
    'notes.tip4':
      'Na orientação vertical o viewport precisa de altura definida — use uma classe de proporção. Sem altura, a base de 100% do slide não tem contra o que resolver e os slides empilham.',
    'accessibility.item5':
      '<strong>Movimento reduzido</strong> — a rolagem deixa de ser animada e o avanço automático não liga quando o sistema (ou o tema do Storybook) pede movimento reduzido.',
    'props.table.loop': 'Volta ao primeiro slide depois do último — as setas nunca desabilitam.',
    'props.table.autoplay': 'Liga o avanço automático. Ignorado quando há preferência por movimento reduzido.',
    'props.table.autoplayDelay': 'Intervalo do avanço automático, em milissegundos.',
    'props.table.slideLabel':
      'Molde do nome acessível de cada slide. Os marcadores de posição e de total são substituídos.',
    'props.table.label': 'Nome acessível da região. Sem ele vale o rótulo escrito no elemento.',
    'props.table.slideChange': 'Emitido a cada troca de slide, com posição, total e origem da navegação.',
    'props.table.autoplayPause': 'Emitido quando o avanço automático para, por interação ou por comando.',
    'props.table.itemLabel': 'Nome acessível do slide. Sem ele vale o molde declarado na raiz.',
    'props.table.navLabel': 'Nome acessível da seta. Só há ícone, então sem rótulo o botão não é anunciável.',
  },
  en: {
    'variants.items.horizontal.name': 'Horizontal',
    'variants.items.vertical.name': 'Vertical',
    'variants.items.single.name': 'One item at a time',
    'variants.items.multi.name': 'Several items visible',
    'demonstration.labels.regionDemo': 'Example gallery',
    'demonstration.labels.pause': 'Pause slideshow',
    'demonstration.labels.resume': 'Resume slideshow',
    'demonstration.labels.galleryCaption': 'Product photo',
    'props.extensibility':
      'Extra classes go on the class attribute of the element itself — Angular merges them with the design system ones. The slide basis (how many items show at once) is a width utility applied to the item, and it can be responsive.',
    'doDont.pair1.doName': 'Visible navigation',
    'doDont.pair1.dontName': 'Hidden navigation',
    'doDont.pair2.doName': 'Auto-advance with pause',
    'doDont.pair2.dontName': 'Auto-advance without pause',
    'usage.guidelines.item2':
      'Set how many items show at once through the slide basis — the design system width utilities applied to the item, not a measurement written on the element.',
    'usage.guidelines.item3':
      'For auto-advance, pair looping with a visible pause control: user interaction already stops the clock on its own.',
    'variants.angularScope':
      'In this stack there is no plugin and no external instance: looping and auto-advance are inputs of the component itself, and the current position is read from the component to build dots and counters.',
    'notes.tip1':
      'The gap between slides comes from the track spacing, not from a negative margin plus padding: the slide is what you see and what scrolls.',
    'notes.tip2':
      'To build dots or a counter, read the position and the total from the component through a template reference and call the go-to-index command.',
    'notes.tip4':
      'In vertical orientation the viewport needs a defined height — use an aspect-ratio class. Without height the 100% slide basis has nothing to resolve against and the slides stack.',
    'accessibility.item5':
      '<strong>Reduced motion</strong> — scrolling stops being animated and auto-advance never starts when the system (or the Storybook theme) asks for reduced motion.',
    'props.table.loop': 'Wraps to the first slide after the last one — the arrows never disable.',
    'props.table.autoplay': 'Turns on auto-advance. Ignored when reduced motion is preferred.',
    'props.table.autoplayDelay': 'Auto-advance interval, in milliseconds.',
    'props.table.slideLabel':
      'Template for each slide accessible name. The position and total placeholders are replaced.',
    'props.table.label': 'Accessible name of the region. Without it the label written on the element applies.',
    'props.table.slideChange': 'Emitted on every slide change, with position, total and navigation source.',
    'props.table.autoplayPause': 'Emitted when auto-advance stops, by interaction or by command.',
    'props.table.itemLabel': 'Accessible name of the slide. Without it the template declared on the root applies.',
    'props.table.navLabel': 'Accessible name of the arrow. It is icon-only, so without a label the button cannot be announced.',
  },
  es: {
    'variants.items.horizontal.name': 'Horizontal',
    'variants.items.vertical.name': 'Vertical',
    'variants.items.single.name': 'Un elemento por vez',
    'variants.items.multi.name': 'Varios elementos visibles',
    'demonstration.labels.regionDemo': 'Galería de ejemplos',
    'demonstration.labels.pause': 'Pausar presentación',
    'demonstration.labels.resume': 'Reanudar presentación',
    'demonstration.labels.galleryCaption': 'Foto del producto',
    'props.extensibility':
      'Las clases extra van en el atributo class del propio elemento — Angular las combina con las del design system. La base del slide (cuántos elementos se ven a la vez) es una utilidad de ancho aplicada al elemento, y puede ser responsiva.',
    'doDont.pair1.doName': 'Navegación visible',
    'doDont.pair1.dontName': 'Navegación oculta',
    'doDont.pair2.doName': 'Avance automático con pausa',
    'doDont.pair2.dontName': 'Avance automático sin pausa',
    'usage.guidelines.item2':
      'Define cuántos elementos se ven a la vez con la base del slide — las utilidades de ancho del design system aplicadas al elemento, no una medida escrita en él.',
    'usage.guidelines.item3':
      'Para el avance automático, combina el bucle con un control visible de pausa: la interacción del usuario ya detiene el reloj por sí sola.',
    'variants.angularScope':
      'En esta stack no hay plugin ni instancia externa: el bucle y el avance automático son entradas del propio componente, y la posición actual se lee del componente para construir dots y contadores.',
    'notes.tip1':
      'El respiro entre slides viene del espaciado de la pista, no de un margen negativo sumado a un padding: el slide es lo que se ve y lo que se desplaza.',
    'notes.tip2':
      'Para montar dots o un contador, lee la posición y el total del propio componente mediante una referencia de plantilla y llama al comando de ir a un índice.',
    'notes.tip4':
      'En orientación vertical el viewport necesita altura definida — usa una clase de proporción. Sin altura, la base del 100% del slide no tiene contra qué resolverse y los slides se apilan.',
    'accessibility.item5':
      '<strong>Movimiento reducido</strong> — el desplazamiento deja de animarse y el avance automático no se activa cuando el sistema (o el tema de Storybook) pide movimiento reducido.',
    'props.table.loop': 'Vuelve al primer slide después del último — las flechas nunca se deshabilitan.',
    'props.table.autoplay': 'Activa el avance automático. Se ignora cuando hay preferencia por movimiento reducido.',
    'props.table.autoplayDelay': 'Intervalo del avance automático, en milisegundos.',
    'props.table.slideLabel':
      'Molde del nombre accesible de cada slide. Los marcadores de posición y de total se sustituyen.',
    'props.table.label': 'Nombre accesible de la región. Sin él vale el rótulo escrito en el elemento.',
    'props.table.slideChange': 'Se emite en cada cambio de slide, con posición, total y origen de la navegación.',
    'props.table.autoplayPause': 'Se emite cuando el avance automático se detiene, por interacción o por comando.',
    'props.table.itemLabel': 'Nombre accesible del slide. Sin él vale el molde declarado en la raíz.',
    'props.table.navLabel': 'Nombre accesible de la flecha. Solo hay icono, así que sin rótulo el botón no se puede anunciar.',
  },
});

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

// ─── Snippets ─────────────────────────────────────────────────────────────────
//
// O `anatomy.structureCode.angular` do conteúdo compartilhado anuncia
// "embla-carousel-angular fornece a diretiva emblaCarousel". Não existe: não há
// `embla-carousel` nas dependências desta stack e o componente é escrito à mão
// (ver o cabeçalho de `src/components/ui/carousel.ts`). O markup abaixo é o que
// realmente compila — divergência registrada no relatório.

const IMPORT_CODE = `import { NDS_CAROUSEL } from '@/components/ui/carousel';`;

const ANATOMY_CODE = `<nds-carousel
  class="nds-w-full nds-max-w-md"
  label="Galeria de exemplos"
  slideLabel="Slide {index} de {total}"
>
  <!-- Viewport que recorta; a faixa flex fica dentro dele -->
  <div ndsCarouselContent>
    <div ndsCarouselItem>...</div>   <!-- role="group", nome com posição -->
    <div ndsCarouselItem>...</div>
  </div>

  <!-- Só ícone: sem rótulo o botão não é anunciável -->
  <button ndsCarouselPrevious label="Item anterior"></button>
  <button ndsCarouselNext label="Próximo item"></button>
</nds-carousel>`;

const HORIZONTAL_CODE = `<nds-carousel class="nds-w-full nds-max-w-md" label="Slides na horizontal">
  <div ndsCarouselContent>
    <div ndsCarouselItem>...</div>
  </div>
  <button ndsCarouselPrevious label="Item anterior"></button>
  <button ndsCarouselNext label="Próximo item"></button>
</nds-carousel>`;

const VERTICAL_CODE = `<!-- Em vertical o viewport precisa de altura DEFINIDA: a base
     flex: 0 0 100% do slide só resolve contra altura conhecida. A altura vem de
     uma classe de proporção, nunca de style. -->
<nds-carousel orientation="vertical" class="nds-w-full nds-max-w-xs" label="Slides na vertical">
  <div ndsCarouselContent class="nds-aspect-4-3">
    <div ndsCarouselItem>...</div>
  </div>
  <button ndsCarouselPrevious label="Item anterior"></button>
  <button ndsCarouselNext label="Próximo item"></button>
</nds-carousel>`;

const CODE_SINGLE = `<div ndsCarouselItem class="nds-basis-full">...</div>`;

const CODE_MULTI = `<!-- A base do slide é utilitária do design system, e é responsiva:
     metade a partir do breakpoint médio, um terço a partir do grande. -->
<div ndsCarouselItem class="nds-md-basis-half nds-lg-basis-third">...</div>`;

const CODE_AUTOPLAY = `<nds-carousel
  #carrossel
  label="Destaques"
  [autoplay]="true"
  [loop]="true"
  [autoplayDelay]="4000"
>
  <div ndsCarouselContent>
    <div ndsCarouselItem>...</div>
  </div>
  <button ndsCarouselPrevious label="Item anterior"></button>
  <button ndsCarouselNext label="Próximo item"></button>
</nds-carousel>

<!-- WCAG 2.2.2: movimento automático acima de 5s precisa de comando de parar -->
<button ndsButton variant="outline" size="sm" (click)="carrossel.alternarAutoplay()">
  {{ carrossel.autoplayAtivo() ? 'Pausar apresentação' : 'Retomar apresentação' }}
</button>`;

const CODE_DOTS = `<!-- #carrossel JÁ é a instância: a posição e o total saem dela,
     sem instância externa nem callback de API. -->
<nds-carousel #carrossel label="Galeria de fotos do produto">
  <div ndsCarouselContent>
    <div ndsCarouselItem>...</div>
  </div>
  <button ndsCarouselPrevious label="Item anterior"></button>
  <button ndsCarouselNext label="Próximo item"></button>
</nds-carousel>

<!-- O atual vira pílula rotulada; os demais continuam pontos. Toda a forma
     sai de .nds-carousel-dot, a classe compartilhada. -->
<div class="nds-cluster" data-justify="center" data-spacing="sm">
  @for (i of indices; track i) {
    <button
      type="button"
      class="nds-carousel-dot"
      [attr.aria-current]="carrossel.index() === i ? 'true' : null"
      [attr.aria-label]="'Ir para o slide ' + (i + 1) + ' de ' + indices.length"
      (click)="carrossel.irPara(i)"
    ><span class="nds-carousel-dot-label">Slide {{ i + 1 }}</span></button>
  }
</div>`;

const CODE_GALERIA = `<div ndsCarouselItem class="nds-md-basis-half">
  <div class="nds-stack" data-spacing="sm">
    <div ndsAspectRatio [ratio]="16 / 9">
      <img [src]="foto.src" [alt]="foto.alt" class="nds-w-full nds-h-full" />
    </div>
    <p class="nds-text-body nds-font-semibold nds-m-0">{{ foto.titulo }}</p>
    <p class="nds-text-caption nds-text-muted-foreground nds-m-0">{{ foto.descricao }}</p>
  </div>
</div>`;

const INTERFACE_CODE = `// Sem plugin e sem instância externa: o loop e o avanço automático são
// entradas, e a posição atual é lida do próprio componente.
@Component({ selector: 'nds-carousel' })
export class NdsCarousel {
  readonly orientation = input<CarouselOrientation>('horizontal');
  readonly loop = input<boolean>(false);
  readonly autoplay = input<boolean>(false);
  readonly autoplayDelay = input<number>(4000);
  readonly slideLabel = input<string>('{index} / {total}');
  readonly label = input<string | undefined>(undefined);

  readonly slideChange = output<CarouselSlideChange>();
  readonly autoplayPause = output<{ index: number }>();

  // Leitura pública, para dots e contadores.
  readonly index: Signal<number>;
  readonly total: Signal<number>;
  readonly autoplayAtivo: Signal<boolean>;

  anterior(origem?: CarouselNavSource): void;
  proximo(origem?: CarouselNavSource): void;
  irPara(index: number, origem?: CarouselNavSource): void;
  alternarAutoplay(): void;
}

interface CarouselSlideChange {
  index: number;
  total: number;
  trigger: 'button' | 'keyboard' | 'autoplay' | 'api';
}`;

const TOKENS_CSS = `/* O Carousel não declara variáveis próprias: consome os tokens globais.
   Personalizar é redefinir o token no tema, e as setas acompanham. */
.meu-tema {
  --border: 220 13% 91%;
  --accent: 220 14% 96%;
  --radius: 0.5rem;
}`;

@Component({
  selector: 'nds-carousel-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_CAROUSEL, NdsAspectRatio, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- ── Previews ──────────────────────────────────────────────────────────
         Nenhum preview usa <main> nem heading próprio: a docs page já está
         dentro de um <main>, e marco dentro de marco reprova no axe.

         Cada <nds-carousel> é um role="region", e região com nome REPETIDO
         reprova em landmark-unique — por isso todo preview recebe um nome
         próprio, montado em rotuloRegiao(). -->

    <ng-template #tplDoDont1Do>
      <nds-carousel
        class="nds-w-full nds-max-w-sm"
        [label]="rotuloRegiao(t('doDont.pair1.doName'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of tresSlides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <!-- Sem setas: o gesto de arrastar não é descoberto por todos, e por
           teclado o carrossel só anda com o foco já dentro da região. -->
      <nds-carousel
        class="nds-w-full nds-max-w-sm"
        [label]="rotuloRegiao(t('doDont.pair1.dontName'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of tresSlides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </nds-carousel>
    </ng-template>

    <!-- Nenhum preview NASCE com o avanço automático ligado: um carrossel que
         anda sozinho para sempre tornaria toda captura de regressão visual
         diferente da anterior, e o teste falharia sem ninguém ter mexido no
         código. Quem liga é o comando — que é justamente o que o par mostra. -->
    <ng-template #tplDoDont2Do>
      <div class="nds-stack nds-w-full nds-max-w-sm" data-spacing="sm">
        <nds-carousel
          #comPausa
          class="nds-w-full"
          [label]="rotuloRegiao(t('doDont.pair2.doName'))"
          [slideLabel]="moldeDoSlide()"
          [loop]="true"
          (autoplayPause)="aoPausarAutoplay($event)"
        >
          <div ndsCarouselContent>
            @for (i of tresSlides; track i) {
              <div ndsCarouselItem>
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
          <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
          <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
        </nds-carousel>

        <!-- O comando que a WCAG 2.2.2 exige para movimento automático. -->
        <button ndsButton variant="outline" size="sm" (click)="comPausa.alternarAutoplay()">
          {{ comPausa.autoplayAtivo() ? t('demonstration.labels.pause') : t('demonstration.labels.resume') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <!-- O mesmo carrossel SEM comando nenhum de parar: quem precisa de tempo
           para ler fica preso ao relógio. -->
      <nds-carousel
        class="nds-w-full nds-max-w-sm"
        [label]="rotuloRegiao(t('doDont.pair2.dontName'))"
        [slideLabel]="moldeDoSlide()"
        [loop]="true"
      >
        <div ndsCarouselContent>
          @for (i of tresSlides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      </nds-carousel>
    </ng-template>

    <ng-template #tplVarHorizontal>
      <nds-carousel
        class="nds-w-full nds-max-w-md"
        [label]="rotuloRegiao(t('variants.items.horizontal.name'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of cincoSlides; track i) {
            <div ndsCarouselItem>
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <ng-template #tplVarVertical>
      <nds-carousel
        class="nds-w-full nds-max-w-xs"
        orientation="vertical"
        [label]="rotuloRegiao(t('variants.items.vertical.name'))"
        [slideLabel]="moldeDoSlide()"
      >
        <!-- nds-aspect-4-3 dá a altura DEFINIDA que a base do slide precisa. -->
        <div ndsCarouselContent class="nds-aspect-4-3">
          @for (i of quatroSlides; track i) {
            <div ndsCarouselItem>
              <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg nds-h-full" data-justify="center">
                <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <ng-template #tplVarSingle>
      <nds-carousel
        class="nds-w-full nds-max-w-md"
        [label]="rotuloRegiao(t('variants.items.single.name'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of tresSlides; track i) {
            <div ndsCarouselItem class="nds-basis-full">
              <div ndsAspectRatio [ratio]="16 / 9">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <ng-template #tplVarMulti>
      <nds-carousel
        class="nds-w-full nds-max-w-lg"
        [label]="rotuloRegiao(t('variants.items.multi.name'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of seisSlides; track i) {
            <div ndsCarouselItem class="nds-md-basis-half nds-lg-basis-third">
              <div ndsAspectRatio [ratio]="1">
                <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                  <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ i }}</span>
                </div>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <ng-template #tplVarAutoplay>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <nds-carousel
          #autoDemo
          class="nds-w-full"
          [label]="rotuloRegiao(t('variants.items.autoplay.name'))"
          [slideLabel]="moldeDoSlide()"
          [loop]="true"
          (slideChange)="aoTrocarSlide($event)"
          (autoplayPause)="aoPausarAutoplay($event)"
        >
          <div ndsCarouselContent>
            @for (i of quatroSlides; track i) {
              <div ndsCarouselItem>
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
          <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
          <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
        </nds-carousel>

        <button ndsButton variant="outline" size="sm" (click)="autoDemo.alternarAutoplay()">
          {{ autoDemo.autoplayAtivo() ? t('demonstration.labels.pause') : t('demonstration.labels.resume') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplCompDots>
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
        <nds-carousel
          #comDots
          class="nds-w-full"
          [label]="rotuloRegiao(t('variants.compositions.withDots.name'))"
          [slideLabel]="moldeDoSlide()"
          (slideChange)="aoTrocarSlide($event)"
        >
          <div ndsCarouselContent>
            @for (i of cincoSlides; track i) {
              <div ndsCarouselItem>
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
          <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
          <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
        </nds-carousel>

        <!-- Cada controle é um button com nome que traz posição E total: "2"
             sozinho não diz para onde leva.

             Sem crase neste comentário: o template é um literal de template de
             JavaScript, e uma crase aqui dentro fecha a string.

             A classe nds-carousel-dot é a MESMA das outras quatro stacks. Esta
             docs page montava a fileira com o componente de botão em variante
             numerada: legível, mas uma composição diferente da que o conteúdo
             compartilhado descreve. O atual vira pílula com o rótulo à vista,
             os demais continuam pontos, e o alvo tem piso de 24px nos dois
             estados (WCAG 2.5.8). -->
        <div class="nds-cluster" data-justify="center" data-spacing="sm">
          @for (i of cincoSlides; track i) {
            <button
              type="button"
              class="nds-carousel-dot"
              [attr.aria-current]="comDots.index() === i - 1 ? 'true' : null"
              [attr.aria-label]="rotuloDoDot(i, cincoSlides.length)"
              (click)="comDots.irPara(i - 1)"
            ><span class="nds-carousel-dot-label">{{ rotuloVisivelDoDot(i) }}</span></button>
          }
        </div>
      </div>
    </ng-template>

    <ng-template #tplCompGaleria>
      <nds-carousel
        class="nds-w-full nds-max-w-lg"
        [label]="rotuloRegiao(t('variants.compositions.gallery.name'))"
        [slideLabel]="moldeDoSlide()"
      >
        <div ndsCarouselContent>
          @for (i of quatroSlides; track i) {
            <div ndsCarouselItem class="nds-md-basis-half">
              <div class="nds-stack" data-spacing="sm">
                <div ndsAspectRatio [ratio]="16 / 9">
                  <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                    <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ i }}</span>
                  </div>
                </div>
                <p class="nds-text-body nds-font-semibold nds-m-0">{{ rotuloDoSlide(i) }}</p>
                <p class="nds-text-caption nds-text-muted-foreground nds-m-0">
                  {{ t('demonstration.labels.galleryCaption') }}
                </p>
              </div>
            </div>
          }
        </div>
        <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
        <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
      </nds-carousel>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="carousel"
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
          <nds-carousel
            class="nds-w-full nds-max-w-md"
            [label]="t('demonstration.labels.regionDemo')"
            [slideLabel]="moldeDoSlide()"
            (slideChange)="aoTrocarSlide($event)"
            (autoplayPause)="aoPausarAutoplay($event)"
          >
            <div ndsCarouselContent>
              @for (i of cincoSlides; track i) {
                <div ndsCarouselItem>
                  <div ndsAspectRatio [ratio]="16 / 9">
                    <div class="nds-cluster nds-bg-muted-soft nds-rounded-lg" data-justify="center">
                      <span class="nds-text-h3 nds-font-semibold nds-text-muted-foreground">{{ rotuloDoSlide(i) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            <button ndsCarouselPrevious [label]="t('demonstration.labels.previous')"></button>
            <button ndsCarouselNext [label]="t('demonstration.labels.next')"></button>
          </nds-carousel>
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
          [description]="t('import.basic')"
          [code]="importCode"
          componentSlug="carousel"
          language="ts"
        />

        <nds-docs-variants
          id="variantes"
          [title]="t('variants.title')"
          [note]="variantsNote()"
          [items]="variantItems()"
          componentSlug="carousel"
          language="html"
        />

        <nds-docs-variants
          id="composicoes"
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          componentSlug="carousel"
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
          [customizationCode]="tokensCss"
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
          componentSlug="carousel"
        />

        <nds-docs-notes [title]="t('notes.title')" [items]="noteItems()" componentSlug="carousel" />

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
export class NdsCarouselDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly importCode = IMPORT_CODE;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly tokensCss = TOKENS_CSS;

  // Contagens de slides como listas prontas: o `@for` do Angular precisa de um
  // iterável, e o número de slides é o que dá sentido ao rótulo "N de M".
  protected readonly tresSlides = [1, 2, 3];
  protected readonly quatroSlides = [1, 2, 3, 4];
  protected readonly cincoSlides = [1, 2, 3, 4, 5];
  protected readonly seisSlides = [1, 2, 3, 4, 5, 6];

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarHorizontal = viewChild.required<TemplateRef<unknown>>('tplVarHorizontal');
  private readonly tplVarVertical = viewChild.required<TemplateRef<unknown>>('tplVarVertical');
  private readonly tplVarSingle = viewChild.required<TemplateRef<unknown>>('tplVarSingle');
  private readonly tplVarMulti = viewChild.required<TemplateRef<unknown>>('tplVarMulti');
  private readonly tplVarAutoplay = viewChild.required<TemplateRef<unknown>>('tplVarAutoplay');
  private readonly tplCompDots = viewChild.required<TemplateRef<unknown>>('tplCompDots');
  private readonly tplCompGaleria = viewChild.required<TemplateRef<unknown>>('tplCompGaleria');

  // ─── Rótulos dos previews ───────────────────────────────────────────────────

  /** Molde do nome acessível do slide: "Slide {index} de {total}". */
  protected readonly moldeDoSlide = computed(() => {
    dict();
    return `${t('demonstration.labels.slide')} {index} ${t('demonstration.labels.of')} {total}`;
  });

  protected rotuloDoSlide(posicao: number): string {
    return `${t('demonstration.labels.slide')} ${posicao}`;
  }

  protected rotuloDoDot(posicao: number, total: number): string {
    return `${t('demonstration.labels.goToSlide')} ${posicao} ${t('demonstration.labels.of')} ${total}`;
  }

  /**
   * Texto VISÍVEL dentro da pílula do slide atual.
   *
   * É um PEDAÇO do nome acessível ("Ir para o slide 2 de 5" contém "Slide 2"),
   * e não um segundo nome: o `aria-label` substitui o conteúdo para a
   * tecnologia assistiva, então nada é lido duas vezes, e a contenção é o que a
   * WCAG 2.5.3 (Label in Name, A) cobra de quem comanda por voz.
   */
  protected rotuloVisivelDoDot(posicao: number): string {
    return `${t('demonstration.labels.slide')} ${posicao}`;
  }

  /**
   * Nome acessível de um preview.
   *
   * Cada carrossel é um `role="region"`: duas regiões com o MESMO nome na
   * página reprovam em `landmark-unique`, e uma região sem nome nenhum some da
   * lista de marcos. O prefixo é o título do componente, o sufixo distingue.
   */
  protected rotuloRegiao(nome: string): string {
    return `${t('title')} — ${nome}`;
  }

  // ─── Analytics de produto ───────────────────────────────────────────────────

  protected aoTrocarSlide(evento: CarouselSlideChange): void {
    // O avanço do relógio não é navegação do usuário: contá-lo inflaria o
    // engajamento com o número de segundos que a página ficou aberta.
    if (evento.trigger === 'autoplay') return;
    track('slide_change', {
      component: 'carousel',
      index: evento.index,
      total: evento.total,
      // O catálogo tipado conhece button/swipe/keyboard. O clique num dot é
      // clique em botão — cai em `button`, não vira um valor novo.
      trigger: evento.trigger === 'keyboard' ? 'keyboard' : 'button',
      location: 'docs_demo',
    });
  }

  protected aoPausarAutoplay(evento: { index: number }): void {
    track('autoplay_paused', {
      component: 'carousel',
      index: evento.index,
      location: 'docs_demo',
    });
  }

  // ─── Seções ─────────────────────────────────────────────────────────────────

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
    return { title: t('usage.guidelines.title'), items: numberedItems(d, 'usage.guidelines') };
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
        // O container lê `do`/`dont`; `correct`/`avoid` renderiza duas colunas
        // vazias, e o tsc não pega porque não valida template Angular.
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['previous', 'next', 'dots', 'caption'].map((k) => ({
        element: toPlainText(t(`usage.uxWriting.table.${k}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${k}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${k}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${k}.bad`)),
      })),
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

  /**
   * A nota compartilhada fala em `basis-*` e em plugin de autoplay — vocabulário
   * do Embla, que esta stack não usa. O parágrafo de escopo entra logo depois,
   * em vez de contradizê-la em silêncio.
   */
  protected readonly variantsNote = computed(() => {
    dict();
    return `${t('variants.note')}<br><br>${t('variants.angularScope')}`;
  });

  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'horizontal', code: HORIZONTAL_CODE, tpl: this.tplVarHorizontal() },
      { key: 'vertical',   code: VERTICAL_CODE,   tpl: this.tplVarVertical()   },
      { key: 'single',     code: CODE_SINGLE,     tpl: this.tplVarSingle()     },
      { key: 'multi',      code: CODE_MULTI,      tpl: this.tplVarMulti()      },
      { key: 'autoplay',   code: CODE_AUTOPLAY,   tpl: this.tplVarAutoplay()   },
    ].map(({ key, code, tpl }) => ({
      // `.name` existe no conteúdo só para `autoplay`; para os outros quatro vem
      // do override. Lido sempre pelo mesmo caminho, o card nunca cai no caso em
      // que o título repete a descrição inteira.
      name: t(`variants.items.${key}.name`),
      description: valueOuField(`variants.items.${key}`, 'description'),
      code,
      trackId: key,
      preview: tpl,
    }));
  });

  protected readonly compositionItems = computed(() => {
    dict();
    return [
      { key: 'withDots', code: CODE_DOTS,    tpl: this.tplCompDots()    },
      { key: 'gallery',  code: CODE_GALERIA, tpl: this.tplCompGaleria() },
    ].map(({ key, code, tpl }) => ({
      name: t(`variants.compositions.${key}.name`),
      description: withQuandoUsar(
        t(`variants.compositions.${key}.description`),
        t(`variants.compositions.${key}.use`),
      ),
      code,
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
    // Uma configuração só no conteúdo compartilhado: o extremo sem loop.
    return ['disabled'].map((k) => ({
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
    // "—" e nunca a string "undefined": travessão é o vazio tipográfico, e é o
    // que as outras stacks mostram.
    const linha = (name: string, chave: string, tipo: string, padrao: string) => ({
      name,
      type: tipo,
      defaultValue: padrao,
      required: nao,
      description: toPlainText(t(`props.table.${chave}`)),
    });
    const classe = linha('class', 'className', 'string', '—');
    const conteudo = linha('(conteúdo)', 'children', 'HTML', '—');

    return [
      {
        title: t('props.carouselTitle'),
        cols,
        items: [
          linha('orientation', 'orientation', `'horizontal' | 'vertical'`, `'horizontal'`),
          linha('loop', 'loop', 'boolean', 'false'),
          linha('autoplay', 'autoplay', 'boolean', 'false'),
          linha('autoplayDelay', 'autoplayDelay', 'number', '4000'),
          linha('slideLabel', 'slideLabel', 'string', `'{index} / {total}'`),
          linha('label', 'label', 'string', '—'),
          linha('slideChange', 'slideChange', 'output<CarouselSlideChange>', '—'),
          linha('autoplayPause', 'autoplayPause', 'output<{ index: number }>', '—'),
          classe,
          conteudo,
        ],
      },
      { title: t('props.contentTitle'), cols, items: [classe, conteudo] },
      {
        title: t('props.itemTitle'),
        cols,
        items: [linha('label', 'itemLabel', 'string', '—'), classe, conteudo],
      },
      {
        title: t('props.navTitle'),
        cols,
        items: [
          linha('variant', 'variant', 'ButtonVariant', `'outline'`),
          linha('size', 'size', 'ButtonSize', `'icon-sm'`),
          linha('label', 'navLabel', 'string', '—'),
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
      { token: '--background', k: 'background',   alvo: '.nds-carousel-arrow' },
      { token: '--foreground', k: 'foreground',   alvo: '.nds-carousel-arrow' },
      { token: '--border',     k: 'border',       alvo: '.nds-carousel-arrow' },
      { token: '--accent',     k: 'accent',       alvo: '.nds-carousel-arrow' },
      { token: '--ring',       k: 'ring',         alvo: '.nds-carousel-arrow' },
      { token: '--radius',     k: 'radiusButton', alvo: '.nds-carousel-arrow' },
      { token: '--primary',    k: 'primary',      alvo: '.nds-carousel' },
      { token: '--nds-carousel-slide-scale', k: 'slideScale', alvo: '.nds-carousel-slide' },
    ].map(({ token, k, alvo }) => ({
      token,
      value: alvo,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  protected readonly a11yItems = computed(() => numberedItems(dict(), 'accessibility'));

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',   description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '←  ↑',  description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: '→  ↓',  description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: 'Enter', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space', description: toPlainText(t('accessibility.keyboard.space')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onFocus', 'onSlideChange', 'buttons'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'tabs',       nome: 'Tabs',       path: '?path=/docs/ui-tabs--docs'       },
      { key: 'scrollArea', nome: 'ScrollArea', path: '?path=/docs/ui-scrollarea--docs' },
      { key: 'card',       nome: 'Card',       path: '?path=/docs/ui-card--docs'       },
      { key: 'pagination', nome: 'Pagination', path: '?path=/docs/ui-pagination--docs' },
    ].map(({ key, nome, path }) => ({
      name: nome,
      description: toPlainText(t(`related.${key}`)),
      path,
    }));
  });

  protected readonly noteItems = computed(() =>
    numberedItems(dict(), 'notes', 'tip').map((content) => ({ title: '', content })),
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
      { e: 'slideChange',   gatilho: 'slideChangeTrigger',   carga: 'slideChangePayload'   },
      { e: 'autoplayPause', gatilho: 'autoplayPauseTrigger', carga: 'autoplayPausePayload' },
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
    // A forma varia por componente: trinca criterion/level/how ou string solta.
    const trinca = itemsFromDict(d, 'testes.accessibility', ['criterion', 'level', 'how']);
    const items = trinca.length
      ? trinca.map((r) => ({
          criterion: toPlainText(r.criterion),
          level: r.level,
          how: toPlainText(r.how),
        }))
      : numberedItems(d, 'testes.accessibility').map((texto) => ({
          criterion: toPlainText(texto),
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
        componentSlug: 'carousel',
      });
      track('docs_page_view', {
        component_name: 'carousel',
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
          component_name: 'carousel',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

// ─── Helpers de cauda ─────────────────────────────────────────────────────────

/** Rótulo de navegação, com queda para o ui.json quando o slug não o declara. */
function navLabel(chave: string): string {
  const doComponente = t(chave);
  return doComponente === chave ? tNav(chave) : doComponente;
}

/**
 * Lê uma chave que pode ser string solta OU objeto com campos.
 *
 * `t()` devolve a PRÓPRIA CHAVE quando ela aponta para um objeto — e é assim
 * que "variants.items.autoplay" acaba escrito na tela, sem erro nenhum.
 */
function valueOuField(base: string, campo: string): string {
  const direto = t(base);
  if (direto !== base) return direto;
  const chave = `${base}.${campo}`;
  const ofField = t(chave);
  return ofField === chave ? '' : ofField;
}

/**
 * Junta descrição e "quando usar" na forma que o container de variantes espera.
 *
 * `NdsDocsCompositions` faria isto sozinho, mas não repassa `language` para o
 * `NdsDocsVariants` — e os snippets aqui são template Angular, não TS.
 */
function withQuandoUsar(descricao: string, quandoUsar: string): string {
  return `${descricao}<br><br><strong>${tNav('common.useWhen')}</strong> ${quandoUsar}`;
}

/**
 * Lista numerada (`base.item1`, `base.item2`…) lida até acabar.
 *
 * Contar à mão é o defeito que aparece na tela: com um item a menos, a chave
 * crua sai escrita no lugar do texto; com um a mais, o item some da página.
 */
function numberedItems(
  d: Record<string, string>,
  base: string,
  prefixo = 'item',
): string[] {
  const itens: string[] = [];
  for (let i = 1; ; i++) {
    const valor = d[`${base}.${prefixo}${i}`];
    if (valor === undefined) break;
    itens.push(valor);
  }
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
