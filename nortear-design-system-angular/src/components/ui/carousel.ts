import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  type OnInit,
} from '@angular/core';
import { ChevronLeft, ChevronRight } from 'lucide';
import { btnClass, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Carousel ─────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-carousel-* (docs/shared/styles/nds/carousel.css), bloco
// "composite": `.nds-carousel` > `.nds-carousel-overflow` > `.nds-carousel-track`
// > `.nds-carousel-slide`, mais `.nds-carousel-arrow-*` nas setas. É o mesmo
// DOM que react/vue/svelte produzem e é o que o snippet `angular` do conteúdo
// compartilhado descreve.
//
// SEM primitivo do @radix-ng/primitives: o pacote não publica `carousel`
// (conferido no `exports` de node_modules/@radix-ng/primitives — há accordion,
// tabs, slider, toolbar… e nada de carrossel). Também não há `embla-carousel`
// nas dependências desta stack, ao contrário do que o snippet compartilhado
// ainda anuncia — está registrado no relatório como divergência de conteúdo.
//
// A ROLAGEM É NATIVA, não `transform`. O Vanilla escreve
// `track.style.transform` a cada passo e o Embla faz o mesmo por baixo; aqui
// isso seria CSS inline, que esta stack proíbe (a medida sairia do tema e da
// densidade). `.nds-carousel-overflow` tem `overflow: hidden`, e um container
// com overflow hidden continua rolável POR SCRIPT — só não pelo usuário. Então
// `scrollTo()` no viewport dá o mesmo resultado visual sem uma linha de estilo
// inline, e ainda respeita `prefers-reduced-motion` de graça (behavior 'auto').
//
// Alvo da rolagem: `slide.offsetLeft - primeiro.offsetLeft`. `offsetLeft` é
// posição de LAYOUT, não afetada pela rolagem corrente, então a conta não
// acumula erro passo a passo como faria um `scrollBy`.

export type CarouselOrientation = 'horizontal' | 'vertical';

/**
 * De onde partiu a troca de slide. Exposto porque o produto mede engajamento
 * por origem — o payload de `slide_change` do conteúdo compartilhado tem
 * exatamente este campo.
 */
export type CarouselNavSource = 'button' | 'keyboard' | 'autoplay' | 'api';

export interface CarouselSlideChange {
  index: number;
  total: number;
  trigger: CarouselNavSource;
}

/** Rótulo padrão dos slides: só números, para não cravar idioma no primitivo. */
const ROTULO_PADRAO = '{index} / {total}';

/**
 * Movimento reduzido, pelas duas vias que este projeto reconhece.
 *
 * O toolbar "Motion" do Storybook escreve `data-reduced-motion` no `<html>` e o
 * `motion.css` zera as durações a partir dele; a media query cobre a preferência
 * real do sistema. Uma animação de rolagem que ignorasse as duas seria
 * exatamente o tipo de movimento involuntário que a WCAG 2.3.3 pede para
 * desligar.
 */
function movimentoReduzido(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.dataset['reducedMotion'] === 'true') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Ordem de documento — a de registro depende da ordem de construção das views. */
function ordenarPorDocumento(elementos: HTMLElement[]): HTMLElement[] {
  return [...elementos].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

/**
 * Estado compartilhado por toda a árvore do carrossel.
 *
 * Fornecido pelo `NdsCarousel`, nunca em `root`: a docs page mostra meia dúzia
 * de carrosséis na mesma tela, e um estado global faria todos andarem juntos.
 */
@Injectable()
export class NdsCarouselStore {
  private readonly _slides = signal<HTMLElement[]>([]);
  private readonly _index = signal(0);

  readonly index = this._index.asReadonly();
  readonly total = computed(() => this._slides().length);

  readonly orientation = signal<CarouselOrientation>('horizontal');
  readonly loop = signal(false);
  readonly slideLabel = signal(ROTULO_PADRAO);

  readonly canPrev = computed(() =>
    this.loop() ? this.total() > 1 : this._index() > 0,
  );
  readonly canNext = computed(() =>
    this.loop() ? this.total() > 1 : this._index() < this.total() - 1,
  );

  /** O componente raiz assina para emitir os outputs e pausar o autoplay. */
  aoNavegar: ((index: number, origem: CarouselNavSource) => void) | undefined;

  private viewport: HTMLElement | undefined;

  registrarViewport(el: HTMLElement): void {
    this.viewport = el;
  }

  registrarSlide(el: HTMLElement): void {
    this._slides.update((lista) => ordenarPorDocumento([...lista, el]));
  }

  removerSlide(el: HTMLElement): void {
    this._slides.update((lista) => lista.filter((x) => x !== el));
  }

  /** Rótulo acessível de um slide, já com posição e total resolvidos. */
  rotuloDoSlide(el: HTMLElement): string {
    const lista = this._slides();
    const posicao = lista.indexOf(el) + 1;
    return this.slideLabel()
      .replace('{index}', String(posicao || 1))
      .replace('{total}', String(lista.length || 1));
  }

  navegar(alvo: number, origem: CarouselNavSource): void {
    const total = this.total();
    if (total === 0) return;
    const destino = this.loop()
      ? ((alvo % total) + total) % total
      : Math.min(Math.max(alvo, 0), total - 1);
    if (destino === this._index()) return;
    this._index.set(destino);
    this.rolarAte(destino);
    this.aoNavegar?.(destino, origem);
  }

  anterior(origem: CarouselNavSource): void {
    this.navegar(this._index() - 1, origem);
  }

  proximo(origem: CarouselNavSource): void {
    this.navegar(this._index() + 1, origem);
  }

  private rolarAte(i: number): void {
    const vp = this.viewport;
    const lista = this._slides();
    const alvo = lista[i];
    const primeiro = lista[0];
    if (!vp || !alvo || !primeiro) return;
    const behavior: ScrollBehavior = movimentoReduzido() ? 'auto' : 'smooth';
    if (this.orientation() === 'vertical') {
      vp.scrollTo({ top: alvo.offsetTop - primeiro.offsetTop, behavior });
    } else {
      vp.scrollTo({ left: alvo.offsetLeft - primeiro.offsetLeft, behavior });
    }
  }
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Pacote `lucide` (agnóstico), não `lucide-angular` — este declara peer
// `@angular/core: 13.x - 21.x` e conflita com o Angular 22.
//
// Sem classe no `<svg>`: o host das setas carrega `.nds-button`, e
// `.nds-button > svg` já dimensiona o filho direto. Uma classe
// `.nds-carousel-arrow-svg` seria invenção — não existe no CSS.
//
// Declarado antes de quem o usa: `imports:` é avaliado quando a classe é
// decorada, então referência a símbolo declarado abaixo cairia na zona morta.

type CarouselIconKind = 'chevron-left' | 'chevron-right';
type LucideIconNode = [string, Record<string, string>];

const CAROUSEL_ICON_MAP: Record<CarouselIconKind, LucideIconNode[]> = {
  'chevron-left': ChevronLeft as unknown as LucideIconNode[],
  'chevron-right': ChevronRight as unknown as LucideIconNode[],
};

/**
 * SVG direcional das setas.
 *
 * Os filhos são criados por `createElementNS` num `effect`, e não pelo template:
 * cada ícone do lucide é uma lista `[tag, attrs]` com tag variável, e template
 * Angular exige tag estática. Construir nós é imune a XSS — não há `innerHTML`
 * no caminho.
 */
@Component({
  selector: 'svg[ndsCarouselIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
class NdsCarouselIcon {
  readonly kind = input.required<CarouselIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of CAROUSEL_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Raiz ─────────────────────────────────────────────────────────────────────

/**
 * Container do carrossel — `<nds-carousel>`.
 *
 * `role="region"` + `aria-roledescription="carousel"` são fixos: é o contrato
 * das cinco stacks e o que faz o leitor de tela anunciar a natureza do bloco.
 * O nome acessível NÃO é fixo — vem do `aria-label` que quem usa escreve, ou do
 * input `label`. Região sem nome não vira marco de navegação para ninguém.
 *
 * `tabindex="0"` no host: sem ele as setas do teclado só funcionariam com o foco
 * já em um dos botões, e um carrossel que exige clicar antes de navegar por
 * teclado não atende a WCAG 2.1.1. O host não rola por gesto do usuário
 * (`overflow: hidden`), então não há o caso de região rolável sem foco.
 */
@Component({
  selector: 'nds-carousel',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [NdsCarouselStore],
  host: {
    class: 'nds-carousel',
    role: 'region',
    'aria-roledescription': 'carousel',
    tabindex: '0',
    '[attr.data-slot]': '"carousel"',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-label]': 'nomeAcessivel()',
    '(keydown)': 'aoTeclar($event)',
    '(pointerenter)': 'suspender(true)',
    '(pointerleave)': 'suspender(false)',
    '(focusin)': 'suspender(true)',
    '(focusout)': 'aoPerderFoco($event)',
  },
})
export class NdsCarousel implements OnInit {
  /** Direção do deslize. Vertical exige altura definida no `ndsCarouselContent`. */
  readonly orientation = input<CarouselOrientation>('horizontal');

  /** Volta ao primeiro slide depois do último (e vice-versa). */
  readonly loop = input<boolean>(false);

  /** Liga o avanço automático. Ignorado quando há preferência por movimento reduzido. */
  readonly autoplay = input<boolean>(false);

  /** Intervalo do avanço automático, em milissegundos. */
  readonly autoplayDelay = input<number>(4000);

  /**
   * Molde do nome acessível de cada slide. `{index}` e `{total}` são
   * substituídos. O texto vem de quem usa porque é conteúdo traduzível — o
   * primitivo não carrega idioma.
   */
  readonly slideLabel = input<string>(ROTULO_PADRAO);

  /** Nome acessível da região. Sem ele vale o `aria-label` escrito no elemento. */
  readonly label = input<string | undefined>(undefined);

  /** Emitido a cada troca de slide, com a origem da navegação. */
  readonly slideChange = output<CarouselSlideChange>();

  /** Emitido quando o avanço automático para — por interação ou por comando. */
  readonly autoplayPause = output<{ index: number }>();

  protected readonly store = inject(NdsCarouselStore);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly rotuloEscrito = this.hostRef.nativeElement.getAttribute('aria-label');

  private readonly _autoplayLigado = signal(false);
  private readonly _suspenso = signal(false);

  /** Índice do slide visível. Leitura pública para dots e contadores. */
  readonly index = this.store.index;
  /** Quantidade de slides registrados. */
  readonly total = this.store.total;
  /** Se o avanço automático está rodando neste momento. */
  readonly autoplayAtivo = computed(() => this._autoplayLigado());

  protected readonly nomeAcessivel = computed(
    () => this.label() ?? this.rotuloEscrito ?? undefined,
  );

  constructor() {
    effect(() => this.store.orientation.set(this.orientation()));
    effect(() => this.store.loop.set(this.loop()));
    effect(() => this.store.slideLabel.set(this.slideLabel()));

    this.store.aoNavegar = (index, origem) => {
      // Interação do usuário para o autoplay — é o `stopOnInteraction` que o
      // conteúdo compartilhado documenta e o mecanismo que a WCAG 2.2.2 exige
      // para movimento automático com mais de 5s de duração.
      if (origem !== 'autoplay' && this._autoplayLigado()) this.pararAutoplay(index);
      this.slideChange.emit({ index, total: this.store.total(), trigger: origem });
    };

    effect((onCleanup) => {
      const rodando = this._autoplayLigado() && !this._suspenso();
      // Movimento reduzido não é lido como signal de propósito: é preferência de
      // sistema, avaliada quando o ciclo (re)começa. Ligar autoplay sob ela
      // seria justamente o que a preferência pede para não acontecer.
      if (!rodando || movimentoReduzido()) return;
      const ms = this.autoplayDelay();
      const timer = setInterval(() => this.store.proximo('autoplay'), ms);
      onCleanup(() => clearInterval(timer));
    });
  }

  ngOnInit(): void {
    // No `ngOnInit` e NÃO no construtor: ali um `input()` ainda devolve o valor
    // declarado no componente, não o que quem consome ligou — `[autoplay]="true"`
    // seria ignorado em silêncio.
    this._autoplayLigado.set(this.autoplay());

    // Os mesmos três valores dos `effect` acima, agora. Effect roda DEPOIS da
    // primeira renderização, e o track e os slides leem `orientation` no
    // primeiro passe: sem isto o carrossel vertical nasce horizontal e só se
    // corrige no quadro seguinte.
    this.store.orientation.set(this.orientation());
    this.store.loop.set(this.loop());
    this.store.slideLabel.set(this.slideLabel());
  }

  /** Slide anterior. Público para dots, contadores e controles próprios. */
  anterior(origem: CarouselNavSource = 'api'): void {
    this.store.anterior(origem);
  }

  /** Próximo slide. */
  proximo(origem: CarouselNavSource = 'api'): void {
    this.store.proximo(origem);
  }

  /** Vai direto a um índice (base zero). */
  irPara(index: number, origem: CarouselNavSource = 'api'): void {
    this.store.navegar(index, origem);
  }

  /** Liga/desliga o avanço automático — o controle que a WCAG 2.2.2 pede. */
  alternarAutoplay(): void {
    if (this._autoplayLigado()) this.pararAutoplay(this.store.index());
    else this._autoplayLigado.set(true);
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    const vertical = this.orientation() === 'vertical';
    const voltar = vertical ? 'ArrowUp' : 'ArrowLeft';
    const avancar = vertical ? 'ArrowDown' : 'ArrowRight';
    if (evento.key !== voltar && evento.key !== avancar) return;
    // Sem `preventDefault` a seta rola a página junto com o carrossel.
    evento.preventDefault();
    if (evento.key === voltar) this.store.anterior('keyboard');
    else this.store.proximo('keyboard');
  }

  /** Suspende o avanço enquanto o ponteiro ou o foco estiverem dentro. */
  protected suspender(dentro: boolean): void {
    this._suspenso.set(dentro);
  }

  protected aoPerderFoco(evento: FocusEvent): void {
    const destino = evento.relatedTarget;
    // Foco andando entre os botões do próprio carrossel não é saída.
    if (destino instanceof Node && this.hostRef.nativeElement.contains(destino)) return;
    this._suspenso.set(false);
  }

  private pararAutoplay(index: number): void {
    this._autoplayLigado.set(false);
    this.autoplayPause.emit({ index });
  }
}

// ─── Viewport ─────────────────────────────────────────────────────────────────

/**
 * Viewport que recorta os slides — `<div ndsCarouselContent>`.
 *
 * Rende DOIS elementos, como nas outras stacks: o host é `.nds-carousel-overflow`
 * (o container de rolagem) e dentro dele vai `.nds-carousel-track`, a linha
 * flex com os slides. Duas peças em um `@Component` e não duas diretivas porque
 * o track não existe no markup de quem escreve.
 *
 * Em vertical o track ganha `.nds-h-full`: a base do slide é `flex: 0 0 100%`, e
 * porcentagem em `flex-basis` só resolve contra altura DEFINIDA. Sem isso o
 * carrossel vertical empilha tudo e nada é recortado. Quem usa dá a altura ao
 * host com uma classe de proporção (`nds-aspect-video`, `nds-aspect-4-3`) —
 * altura cravada em `style` violaria a convenção de medida desta stack.
 */
@Component({
  selector: 'div[ndsCarouselContent]',
  standalone: true,
  template: `
    <div
      class="nds-carousel-track"
      [class.nds-h-full]="vertical()"
      [attr.data-slot]="'carousel-track'"
      [attr.data-orientation]="store.orientation()"
    >
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-carousel-overflow',
    '[attr.data-slot]': '"carousel-content"',
  },
})
export class NdsCarouselContent {
  protected readonly store = inject(NdsCarouselStore);
  protected readonly vertical = computed(() => this.store.orientation() === 'vertical');

  constructor() {
    this.store.registrarViewport(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);
  }
}

// ─── Slide ────────────────────────────────────────────────────────────────────

/**
 * Um slide — `<div ndsCarouselItem>`.
 *
 * `role="group"` + `aria-roledescription="slide"` são o contrato compartilhado.
 * O nome acessível é obrigatório na prática: um grupo sem nome não é anunciado,
 * e é ele que diz "slide 2 de 5" a quem não vê a posição.
 */
@Component({
  selector: 'div[ndsCarouselItem]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-carousel-slide',
    role: 'group',
    'aria-roledescription': 'slide',
    '[attr.data-slot]': '"carousel-item"',
    '[attr.data-orientation]': 'store.orientation()',
    '[attr.aria-label]': 'nomeAcessivel()',
  },
})
export class NdsCarouselItem {
  /** Nome acessível do slide. Sem ele vale o molde `slideLabel` da raiz. */
  readonly label = input<string | undefined>(undefined);

  protected readonly store = inject(NdsCarouselStore);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly rotuloEscrito = this.host.getAttribute('aria-label');

  protected readonly nomeAcessivel = computed(
    () => this.label() ?? this.rotuloEscrito ?? this.store.rotuloDoSlide(this.host),
  );

  constructor() {
    this.store.registrarSlide(this.host);
    inject(DestroyRef).onDestroy(() => this.store.removerSlide(this.host));
  }
}

// ─── Setas ────────────────────────────────────────────────────────────────────
//
// O visual é o do Button — `outline` + `icon-sm`, exatamente o que a tabela de
// props do conteúdo compartilhado descreve e o que as outras stacks compõem.
// Aqui isso é uma chamada a `btnClass()`, a mesma função pura que o `NdsButton`
// usa: sem herdar componente, sem `ndsButton` no mesmo elemento. Duas diretivas
// no mesmo host disputariam `data-slot` e uma apagaria a outra (armadilha 11).

/** Seta para o slide anterior — `<button ndsCarouselPrevious>`. */
@Component({
  selector: 'button[ndsCarouselPrevious]',
  standalone: true,
  imports: [NdsCarouselIcon],
  template: '<svg ndsCarouselIcon kind="chevron-left"></svg>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"carousel-previous"',
    '[attr.data-orientation]': 'store.orientation()',
    '[disabled]': '!store.canPrev()',
    '[attr.aria-disabled]': 'store.canPrev() ? null : "true"',
    '[attr.aria-label]': 'nomeAcessivel()',
    '(click)': 'store.anterior("button")',
  },
})
export class NdsCarouselPrevious {
  /** Variante do botão subjacente. */
  readonly variant = input<ButtonVariant>('outline');

  /** Tamanho do botão subjacente. */
  readonly size = input<ButtonSize>('icon-sm');

  /** Nome acessível. Só há ícone, então sem rótulo o botão não é anunciável. */
  readonly label = input<string | undefined>(undefined);

  protected readonly store = inject(NdsCarouselStore);

  private readonly rotuloEscrito = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement.getAttribute('aria-label');

  protected readonly nomeAcessivel = computed(
    () => this.label() ?? this.rotuloEscrito ?? 'Previous slide',
  );

  protected readonly hostClass = computed(() =>
    cn(btnClass(this.variant(), this.size()), 'nds-carousel-arrow', 'nds-carousel-arrow-prev'),
  );
}

/** Seta para o próximo slide — `<button ndsCarouselNext>`. */
@Component({
  selector: 'button[ndsCarouselNext]',
  standalone: true,
  imports: [NdsCarouselIcon],
  template: '<svg ndsCarouselIcon kind="chevron-right"></svg>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    type: 'button',
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"carousel-next"',
    '[attr.data-orientation]': 'store.orientation()',
    '[disabled]': '!store.canNext()',
    '[attr.aria-disabled]': 'store.canNext() ? null : "true"',
    '[attr.aria-label]': 'nomeAcessivel()',
    '(click)': 'store.proximo("button")',
  },
})
export class NdsCarouselNext {
  /** Variante do botão subjacente. */
  readonly variant = input<ButtonVariant>('outline');

  /** Tamanho do botão subjacente. */
  readonly size = input<ButtonSize>('icon-sm');

  /** Nome acessível. Só há ícone, então sem rótulo o botão não é anunciável. */
  readonly label = input<string | undefined>(undefined);

  protected readonly store = inject(NdsCarouselStore);

  private readonly rotuloEscrito = inject<ElementRef<HTMLElement>>(
    ElementRef,
  ).nativeElement.getAttribute('aria-label');

  protected readonly nomeAcessivel = computed(
    () => this.label() ?? this.rotuloEscrito ?? 'Next slide',
  );

  protected readonly hostClass = computed(() =>
    cn(btnClass(this.variant(), this.size()), 'nds-carousel-arrow', 'nds-carousel-arrow-next'),
  );
}

/** Conjunto pronto para `imports:` — a árvore inteira do carrossel. */
export const NDS_CAROUSEL = [
  NdsCarousel,
  NdsCarouselContent,
  NdsCarouselItem,
  NdsCarouselPrevious,
  NdsCarouselNext,
] as const;
