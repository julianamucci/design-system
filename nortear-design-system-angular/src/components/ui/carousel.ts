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
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { ChevronLeft, ChevronRight } from 'lucide';
import { btnClass, type ButtonSize, type ButtonVariant } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/motion';
import { slideState } from '@shared/primitives/carousel-active-slide';

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
// A ROLAGEM É NATIVA, não `transform`. As outras quatro stacks rodam o
// `embla-carousel`, que move o track escrevendo `translate3d` nele; aqui isso
// seria CSS inline, que esta stack proíbe por regra escrita (guidelines/RULES.md
// e 01-regras-gerais §"Sem style"). `scrollTo()` no viewport dá o mesmo
// resultado visual sem uma linha de estilo, e ainda respeita
// `prefers-reduced-motion` de graça (behavior 'auto') — coisa que o motor de
// `transform` só faz com configuração explícita.
//
// Alvo da rolagem: `slide.offsetLeft - primeiro.offsetLeft`. `offsetLeft` é
// posição de LAYOUT, não afetada pela rolagem corrente, então a conta não
// acumula erro passo a passo como faria um `scrollBy`.
//
// ── O que mudou: o gesto ─────────────────────────────────────────────────────
//
// A observação que sustentava o desenho — "um container com overflow hidden
// continua rolável POR SCRIPT, só não pelo usuário" — estava certa e era
// exatamente o defeito: a rolagem já estava aqui, e quem lê não tinha como
// alcançá-la. Faltava LIBERAR o recorte, não trocar o motor.
//
// O CSS compartilhado passou a reconhecer `data-engine="native"` no recorte:
// com ele o `overflow` vira `auto` no eixo do deslize e entra `scroll-snap`, e
// o dedo passa a mover a mesma caixa que `scrollTo()` já movia. O ponto de
// parada do snap é o INÍCIO do slide, a mesmíssima coordenada que a navegação
// por setas usa — gesto e botão param no mesmo lugar, então um nunca desfaz o
// outro. A barra de rolagem fica escondida, e por isso nenhuma foto de
// regressão visual muda.
//
// O toque sai de graça; o MOUSE não — arrastar com o mouse não é gesto de
// rolagem em navegador nenhum. Daí o arraste por ponteiro de mouse abaixo, que
// é a única parte escrita à mão e existe só para a paridade com o que o motor
// das outras stacks entrega.

export type CarouselOrientation = 'horizontal' | 'vertical';

/**
 * De onde partiu a troca de slide. Exposto porque o produto mede engajamento
 * por origem — o payload de `slide_change` do conteúdo compartilhado tem
 * exatamente este campo.
 */
export type CarouselNavSource = 'button' | 'keyboard' | 'autoplay' | 'api' | 'swipe';

export interface CarouselSlideChange {
  index: number;
  total: number;
  trigger: CarouselNavSource;
}

/** Rótulo padrão dos slides: só números, para não cravar idioma no primitivo. */
const LABEL_DEFAULT = '{index} / {total}';

/**
 * Silêncio de rolagem que conta como "parou".
 *
 * Curto o bastante para que soltar o dedo e ver o índice mudar pareça imediato,
 * e longo o bastante para não cortar o `smooth` de `scrollTo()` no meio — que
 * dispararia uma segunda troca de slide para um destino intermediário.
 */
const ASSENTAMENTO_MS_WAIT = 120;

// Movimento reduzido vem de `@/lib/motion`, que responde pelas duas vias que
// este projeto reconhece: o toolbar "Motion" do Storybook escreve
// `data-reduced-motion` no `<html>` e o `motion.css` zera as durações a partir
// dele; a media query cobre a preferência real do sistema. Uma animação de
// rolagem que ignorasse as duas seria exatamente o tipo de movimento
// involuntário que a WCAG 2.3.3 pede para desligar.

/** Ordem de documento — a de registro depende da ordem de construção das views. */
function documentOrdenar(elementos: HTMLElement[]): HTMLElement[] {
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
  readonly slideLabel = signal(LABEL_DEFAULT);

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
    this._slides.update((lista) => documentOrdenar([...lista, el]));
  }

  removerSlide(el: HTMLElement): void {
    this._slides.update((lista) => lista.filter((x) => x !== el));
  }

  /**
   * O estado "este é o slide atual", para a folha compartilhada escalar o
   * slide. `null` enquanto o slide ainda não foi registrado: sem registro não
   * há índice, e a folha trata a ausência como tamanho cheio — que é o que
   * evita o slide nascer encolhido e pular no quadro seguinte.
   */
  estadoAtivo(el: HTMLElement): 'true' | 'false' | null {
    const position = this._slides().indexOf(el);
    if (position < 0) return null;
    return slideState(position, this._index());
  }

  /** Rótulo acessível de um slide, já com posição e total resolvidos. */
  rotuloDoSlide(el: HTMLElement): string {
    const lista = this._slides();
    const position = lista.indexOf(el) + 1;
    return this.slideLabel()
      .replace('{index}', String(position || 1))
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
    const alvo = this.alvoDoSlide(i);
    if (!vp || alvo === null) return;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (this.orientation() === 'vertical') vp.scrollTo({ top: alvo, behavior });
    else vp.scrollTo({ left: alvo, behavior });
  }

  // ── Rolagem conduzida por quem lê ──────────────────────────────────────────
  //
  // A rolagem SEMPRE esteve aqui; o que faltava era o usuário poder alcançá-la.
  // Com o recorte liberado (`data-engine="native"` no CSS compartilhado), o
  // dedo passa a mover a mesma caixa que `scrollTo()` movia — e então o estado
  // do componente precisa aprender a vir do sentido contrário: da posição de
  // rolagem para o índice, e não só do índice para a posição.

  private timerDeRolagem: ReturnType<typeof setTimeout> | null = null;

  /**
   * Onde a rolagem tem de parar para mostrar o slide `i`.
   *
   * A distância de layout entre o primeiro slide e o slide `i` — e depois
   * CONTIDA no fim do trilho. A contenção não é detalhe: o trilho compensa o
   * respiro do slide com uma margem negativa, então ele é um respiro mais largo
   * que a soma dos passos, e rolar até a distância crua do ÚLTIMO slide para
   * antes do fim, deixando uma tira dele fora do recorte. O motor das outras
   * stacks faz a mesma contenção, e é por isso que o último slide encosta lá e
   * não encostava aqui.
   */
  private alvoDoSlide(i: number): number | null {
    const vp = this.viewport;
    const lista = this._slides();
    const alvo = lista[i];
    const primeiro = lista[0];
    if (!vp || !alvo || !primeiro) return null;
    const vertical = this.orientation() === 'vertical';
    const bruto = vertical
      ? alvo.offsetTop - primeiro.offsetTop
      : alvo.offsetLeft - primeiro.offsetLeft;
    const limite = vertical
      ? vp.scrollHeight - vp.clientHeight
      : vp.scrollWidth - vp.clientWidth;
    return Math.min(bruto, Math.max(limite, 0));
  }

  /** Índice do slide cujo início está mais perto da posição de rolagem atual. */
  indiceMaisProximo(): number | null {
    const vp = this.viewport;
    if (!vp) return null;
    const position = this.orientation() === 'vertical' ? vp.scrollTop : vp.scrollLeft;
    let melhor: number | null = null;
    let menorDistancia = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.total(); i++) {
      const alvo = this.alvoDoSlide(i);
      if (alvo === null) continue;
      const distancia = Math.abs(alvo - position);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        melhor = i;
      }
    }
    return melhor;
  }

  /**
   * Reconcilia o índice com onde a rolagem parou.
   *
   * Espera o silêncio em vez de reagir a cada evento: um gesto com inércia
   * dispara dezenas de `scroll`, e reagir a todos emitiria uma troca de slide
   * por quadro atravessado. O adiamento também é o que dispensa uma bandeira de
   * "isto foi programático" — a rolagem que veio de `scrollTo()` chega aqui com
   * o índice JÁ igual ao destino, e a comparação abaixo a descarta sozinha.
   */
  aoRolar(): void {
    if (this.timerDeRolagem !== null) clearTimeout(this.timerDeRolagem);
    this.timerDeRolagem = setTimeout(() => {
      this.timerDeRolagem = null;
      const destino = this.indiceMaisProximo();
      if (destino === null || destino === this._index()) return;
      this._index.set(destino);
      this.aoNavegar?.(destino, 'swipe');
    }, ASSENTAMENTO_MS_WAIT);
  }

  /** Encosta no ponto de parada mais próximo — o fecho do arraste por mouse. */
  assentarNoMaisProximo(): void {
    const destino = this.indiceMaisProximo();
    if (destino === null) return;
    this.rolarAte(destino);
  }

  /** Posição de rolagem no eixo corrente. Usada pelo arraste por mouse. */
  posicaoDeRolagem(): number {
    const vp = this.viewport;
    if (!vp) return 0;
    return this.orientation() === 'vertical' ? vp.scrollTop : vp.scrollLeft;
  }

  /** Move o recorte sem animação — é o dedo (ou o mouse) que dá o tempo. */
  rolarPara(position: number): void {
    const vp = this.viewport;
    if (!vp) return;
    if (this.orientation() === 'vertical') vp.scrollTop = position;
    else vp.scrollLeft = position;
  }

  soltarRelogios(): void {
    if (this.timerDeRolagem !== null) clearTimeout(this.timerDeRolagem);
    this.timerDeRolagem = null;
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
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera para quem usa `<svg ndsCarouselIcon>` precisa IMPORTAR a
// classe, e símbolo não exportado quebra a geração (NG3004). Não é API pública —
// o barril de componentes não a reexporta.
export class NdsCarouselIcon {
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
 * O ponto de foco do teclado NÃO fica aqui: fica no recorte, que é quem rola.
 * Enquanto o recorte era cego, o host focalizável bastava para atender a WCAG
 * 2.1.1. Ao liberar a rolagem, o recorte virou uma região rolável — e região
 * rolável precisa ser alcançável por teclado, senão quem não usa mouse não
 * chega ao conteúdo que está fora da vista (o axe reprova por
 * `scrollable-region-focusable`, e reprovou: foi o que apareceu no primeiro
 * teste depois de liberar o gesto).
 *
 * Um `tabindex` em cada um dos dois criaria uma parada de tabulação a mais sem
 * nada de novo atrás dela. Então ele mora onde a rolagem mora, e o `keydown`
 * segue aqui: o evento sobe do recorte focado até este host.
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
  readonly slideLabel = input<string>(LABEL_DEFAULT);

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
      if (origem !== 'autoplay' && this._autoplayLigado()) this.stopAutoplay(index);
      this.slideChange.emit({ index, total: this.store.total(), trigger: origem });
    };

    effect((onCleanup) => {
      const rodando = this._autoplayLigado() && !this._suspenso();
      // Movimento reduzido não é lido como signal de propósito: é preferência de
      // sistema, avaliada quando o ciclo (re)começa. Ligar autoplay sob ela
      // seria justamente o que a preferência pede para não acontecer.
      if (!rodando || prefersReducedMotion()) return;
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
    if (this._autoplayLigado()) this.stopAutoplay(this.store.index());
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

  private stopAutoplay(index: number): void {
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
 * host com uma classe de proporção (`nds-aspect-16-9`, `nds-aspect-4-3`) —
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
    // A DECLARAÇÃO do motor. O CSS compartilhado só libera o recorte para o
    // gesto onde este atributo existe — as stacks de `transform` continuam com
    // `overflow: hidden`, que o motor delas exige.
    // O recorte é quem rola, então é ele que o teclado alcança.
    tabindex: '0',
    '[attr.data-engine]': '"native"',
    // O eixo precisa chegar ao recorte, e não só ao track: é aqui que o CSS
    // decide qual `overflow` vira `auto` e em que direção o snap corre.
    '[attr.data-orientation]': 'store.orientation()',
    '[attr.data-dragging]': 'arrastando() ? "true" : null',
    '(scroll)': 'store.aoRolar()',
    '(pointerdown)': 'aoApontar($event)',
  },
})
export class NdsCarouselContent implements OnDestroy {
  protected readonly store = inject(NdsCarouselStore);
  protected readonly vertical = computed(() => this.store.orientation() === 'vertical');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Ligado só durante um arraste por MOUSE — o toque nunca passa por aqui. */
  protected readonly arrastando = signal(false);

  private ponteiro: number | null = null;
  private origemDoPonteiro = 0;
  private origemDaRolagem = 0;

  constructor() {
    this.store.registrarViewport(this.host);
  }

  ngOnDestroy(): void {
    // O arraste pendura ouvintes no DOCUMENTO — eles sobrevivem à remoção do
    // componente, e um carrossel destruído no meio de um gesto os deixaria
    // presos a um host que já saiu da página.
    this.soltarOuvintes();
    this.store.soltarRelogios();
  }

  private soltarOuvintes(): void {
    const doc = this.host.ownerDocument;
    doc.removeEventListener('pointermove', this.aoMover);
    doc.removeEventListener('pointerup', this.aoSoltar);
    doc.removeEventListener('pointercancel', this.aoSoltar);
  }

  /**
   * Arraste por mouse.
   *
   * Existe SÓ para o mouse: o toque já rola nativamente, com a inércia e o
   * atrito do sistema, e interceptá-lo trocaria uma curva que a plataforma
   * acerta por uma escrita à mão. `pointerType` é o que separa os dois — sem
   * essa cerca, o mesmo código roubaria o gesto do dedo.
   *
   * Durante o arraste o `data-dragging` desliga o snap pelo CSS. Sem isso cada
   * escrita em `scrollLeft` seria puxada de volta ao ponto de parada no mesmo
   * quadro, e o conteúdo tremeria em vez de acompanhar o cursor — e desligar o
   * snap por `style` não é opção nesta stack.
   */
  protected aoApontar(evento: PointerEvent): void {
    if (evento.pointerType !== 'mouse' || evento.button !== 0) return;
    // Impede a seleção de texto durante o arraste — sem isto o gesto pinta o
    // conteúdo do slide em vez de movê-lo.
    evento.preventDefault();
    this.ponteiro = evento.pointerId;
    this.origemDoPonteiro = this.vertical() ? evento.clientY : evento.clientX;
    this.origemDaRolagem = this.store.posicaoDeRolagem();
    this.arrastando.set(true);
    // Ouvintes no DOCUMENTO, e não `setPointerCapture` no host: soltar o botão
    // fora do carrossel precisa encerrar o gesto, senão o arraste fica preso
    // ligado. A captura de ponteiro faria o mesmo, mas ela EXIGE um ponteiro
    // ativo de verdade e lança quando o id não é de um — que é exatamente o
    // caso de um gesto conduzido por teste.
    const doc = this.host.ownerDocument;
    doc.addEventListener('pointermove', this.aoMover);
    doc.addEventListener('pointerup', this.aoSoltar);
    doc.addEventListener('pointercancel', this.aoSoltar);
  }

  private readonly aoMover = (evento: PointerEvent): void => {
    if (evento.pointerId !== this.ponteiro) return;
    const atual = this.vertical() ? evento.clientY : evento.clientX;
    this.store.rolarPara(this.origemDaRolagem - (atual - this.origemDoPonteiro));
  };

  private readonly aoSoltar = (evento: PointerEvent): void => {
    if (evento.pointerId !== this.ponteiro) return;
    this.ponteiro = null;
    this.arrastando.set(false);
    this.soltarOuvintes();
    // O snap volta a valer agora, mas ele só age em rolagem do USUÁRIO — o
    // arraste terminou onde o cursor parou, então quem encosta no ponto de
    // parada é este comando.
    this.store.assentarNoMaisProximo();
  };
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
    '[attr.data-active]': 'ativo()',
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

  /**
   * Aqui é ligação de host, e não escrita direta no DOM como nas stacks de
   * motor por `transform`: o slide É este componente, então o índice atual
   * chega a ele pelo signal do store e o atributo se reescreve sozinho. O
   * atributo, os valores e a semântica do terceiro estado (a ausência) são os
   * mesmos das outras quatro — o que muda é só por onde a informação anda.
   */
  protected readonly ativo = computed(() => this.store.estadoAtivo(this.host));

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
