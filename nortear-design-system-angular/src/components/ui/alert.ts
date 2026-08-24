import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NdsButton, NdsButtonIcon } from './button';
import { cn } from '@/lib/utils';

// ─── Alert ────────────────────────────────────────────────────────────────────
//
// Mensagem estática e persistente. Markup e classes seguem o Vanilla, que é a
// referência cross-stack: `<div class="nds-alert">` com ícone, título e
// descrição como FILHOS DIRETOS — o CSS (docs/shared/styles/nds/alert.css) abre
// a coluna do ícone por `:has(> svg)` e posiciona título e descrição por
// `grid-column-start: 2`. Qualquer wrapper extra no meio quebraria as duas
// coisas, e é por isso que o seletor é de atributo no elemento nativo.
//
// SEM primitivo do Radix NG: `@radix-ng/primitives` não publica subcaminho
// `alert` (só `alert-dialog`, que é overlay modal e tem outra anatomia). Não há
// o que compor — o comportamento aqui é uma classe de variante, um `role`
// configurável e o botão de fechar, tudo já coberto por CSS + host bindings.

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

/**
 * Semântica de anúncio do elemento raiz.
 *
 * - `alert`  — live region ASSERTIVA: o leitor de tela interrompe o que estiver
 *   fazendo e anuncia na hora. Por WAI-ARIA só vale para mensagem urgente que
 *   **surge em tempo de execução**.
 * - `status` — live region polida: anuncia sem interromper.
 * - `note`   — NÃO é live region. É o certo para alert estático, já presente
 *   quando a página carrega.
 */
export type AlertRole = 'alert' | 'status' | 'note';

// Tabela em vez de cadeia de ternários — mesma decisão do badge e do Vanilla.
const VARIANT_CLASSNAME: Record<AlertVariant, string> = {
  default: '',
  destructive: 'nds-alert-destructive',
  success: 'nds-alert-success',
  warning: 'nds-alert-warning',
  info: 'nds-alert-info',
};

/**
 * As classes `.nds-animate-in` / `.nds-animate-out` vivem em `utilities.css` e
 * servem a qualquer componente que apareça/suma em runtime.
 *
 * Os timeouts NÃO são redundância defensiva genérica: sem eles o alert nunca
 * sai da tela em dois cenários reais — `prefers-reduced-motion`, onde a
 * animação é suprimida e `animationend` jamais dispara, e ambiente sem
 * composição de quadros (o Chromium headless dos testes), onde a animação fica
 * presa no primeiro quadro. Quem vencer a corrida encerra a fase.
 */
const EXIT_FALLBACK_MS = 300; // --duration-base (200ms) + folga
const ENTER_FALLBACK_MS = 450; // --duration-spring (400ms) + folga

/**
 * Corre `animationend` do próprio elemento contra um timeout e chama `feito`
 * uma vez só, seja quem for o vencedor. Devolve o cancelamento.
 */
function animationCorrerEnd(
  el: HTMLElement,
  limiteMs: number,
  feito: () => void,
): () => void {
  let finalizado = false;

  const finalizar = (evento?: AnimationEvent) => {
    // `animationend` borbulha: a animação de qualquer descendente (o botão de
    // fechar, um ícone) encerraria a fase do alert antes da hora.
    if (evento && evento.target !== el) return;
    if (finalizado) return;
    finalizado = true;
    clearTimeout(timer);
    el.removeEventListener('animationend', finalizar);
    feito();
  };

  el.addEventListener('animationend', finalizar);
  const timer = setTimeout(finalizar, limiteMs);

  return () => {
    finalizado = true;
    clearTimeout(timer);
    el.removeEventListener('animationend', finalizar);
  };
}

@Component({
  selector: 'div[ndsAlert]',
  standalone: true,
  imports: [NdsButton, NdsButtonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // O botão de fechar vem DEPOIS do `<ng-content />`: o leitor de tela anuncia
  // a mensagem antes da ação de descartá-la, e o Tab chega ao X por último.
  // Visualmente não muda nada — `.nds-alert-dismiss` é `position: absolute`.
  template: `
    <ng-content />
    @if (dismissible()) {
      <button
        #botaoFechar
        ndsButton
        variant="ghost"
        size="icon-sm"
        class="nds-alert-dismiss"
        [attr.aria-label]="dismissLabel()"
        (click)="close()"
      >
        <svg ndsButtonIcon kind="x" class="nds-icon"></svg>
      </button>
    }
  `,
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"alert"',
    '[attr.role]': 'role()',
    // O componente não pode remover o próprio host (isso é do consumidor, com
    // um `@if` sobre o `(dismiss)`), então "sair da tela" é o atributo `hidden`:
    // é HTML, não CSS inline, e tira o alert também da árvore de acessibilidade.
    '[attr.hidden]': 'closed() ? "" : null',
  },
})
export class NdsAlert implements OnDestroy {
  /** Variante semântica — escolhe o par de tokens que a folha aplica. */
  readonly variant = input<AlertVariant>('default');

  /**
   * Semântica de anúncio da raiz. `alert` (padrão) é live region ASSERTIVA.
   * Conteúdo estático, já presente ao carregar a página, deve usar `note`.
   */
  readonly role = input<AlertRole>('alert');

  /**
   * Renderiza o botão de fechar. `booleanAttribute` para aceitar a forma curta
   * `<div ndsAlert dismissible>`, como o resto do HTML faz com `disabled`.
   */
  readonly dismissible = input(false, { transform: booleanAttribute });

  /** aria-label do botão de fechar. */
  readonly dismissLabel = input<string>('Fechar alerta');

  /**
   * Emitido uma única vez, depois que o alert sai da tela.
   *
   * Nome `dismiss` e não `onDismiss`: em Angular o callback é um output ligado
   * por `(dismiss)`, e o prefixo `on` duplicaria a sintaxe do template. É
   * divergência de API de framework, não de comportamento.
   */
  readonly dismiss = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  // `read: ElementRef` é obrigatório: numa tag com componente, o `#ref` do
  // template resolve para a INSTÂNCIA do componente, não para o elemento.
  private readonly botaoFechar = viewChild('botaoFechar', {
    read: ElementRef<HTMLButtonElement>,
  });

  protected readonly closed = signal(false);
  private readonly saindo = signal(false);
  // Só o dismissible entra animado: é o único que aparece em tempo de execução.
  // A classe é TRANSITÓRIA — fica no DOM enquanto a animação roda e sai em
  // seguida. Se ficasse, um ambiente que não avança a animação (headless)
  // manteria o alert preso em `opacity: 0`, invisível para sempre.
  private readonly entrando = signal(false);

  private cancelarEntrada: (() => void) | undefined;
  private cancelarSaida: (() => void) | undefined;

  protected readonly hostClass = computed(() =>
    cn(
      'nds-alert',
      VARIANT_CLASSNAME[this.variant()],
      // Fechar antes de a entrada terminar deixaria as duas classes no
      // elemento — a saída sempre substitui a entrada.
      this.saindo() ? 'nds-animate-out' : this.entrando() && 'nds-animate-in',
    ),
  );

  constructor() {
    effect(() => {
      if (!this.dismissible() || this.closed()) return;
      this.entrando.set(true);
      this.cancelarEntrada?.();
      this.cancelarEntrada = animationCorrerEnd(
        this.hostRef.nativeElement,
        ENTER_FALLBACK_MS,
        () => this.entrando.set(false),
      );
    });

    // `data-slot="alert-dismiss"` é o contrato cross-stack para achar a ação de
    // fechar sem depender de classe. Escrever o atributo no template NÃO
    // funciona: o `NdsButton` declara `[attr.data-slot]="button"` como host
    // binding, e host binding roda DEPOIS do binding do template — o valor era
    // sobrescrito em silêncio. Como o host binding é constante, o Ivy só
    // escreve na primeira detecção; escrever depois dela é definitivo.
    afterRenderEffect(() => {
      this.botaoFechar()?.nativeElement.setAttribute('data-slot', 'alert-dismiss');
    });
  }

  protected close(): void {
    // Guarda de reentrada: enquanto a saída corre o botão continua clicável, e
    // sem isto `dismiss` sairia uma vez por clique.
    if (this.saindo() || this.closed()) return;
    this.saindo.set(true);
    this.cancelarSaida = animationCorrerEnd(
      this.hostRef.nativeElement,
      EXIT_FALLBACK_MS,
      () => {
        this.closed.set(true);
        this.dismiss.emit();
      },
    );
  }

  ngOnDestroy(): void {
    this.cancelarEntrada?.();
    this.cancelarSaida?.();
  }
}

// ─── AlertTitle ───────────────────────────────────────────────────────────────
//
// `@Directive` e não `@Component`: o texto do título já é conteúdo do próprio
// heading que o consumidor escreveu — não há nada a projetar nem markup próprio.
//
// O nível do heading é o ELEMENTO, não uma prop `as`: quem escreve escolhe
// `<h3 ndsAlertTitle>` ou `<h5 ndsAlertTitle>` conforme a hierarquia da página
// onde o Alert está. Um nível fixo em h5 pula degraus sob seções h2/h3 e falha
// o axe (heading-order).

@Directive({
  selector:
    'h1[ndsAlertTitle], h2[ndsAlertTitle], h3[ndsAlertTitle], h4[ndsAlertTitle], h5[ndsAlertTitle], h6[ndsAlertTitle]',
  standalone: true,
  host: {
    class: 'nds-alert-title',
    '[attr.data-slot]': '"alert-title"',
  },
})
export class NdsAlertTitle {}

// ─── AlertDescription ─────────────────────────────────────────────────────────
//
// Seletor de atributo puro: o Vanilla e o React montam a descrição como
// `<section>` (a folha documenta `.nds-alert > section` e a semântica de
// landmark), e é essa a forma preferida aqui. O seletor não amarra a tag para
// que quem tem uma descrição de uma linha possa usar `<div>` sem inventar um
// landmark vazio — a classe é o que o CSS realmente casa.

@Directive({
  selector: '[ndsAlertDescription]',
  standalone: true,
  host: {
    class: 'nds-alert-description',
    '[attr.data-slot]': '"alert-description"',
  },
})
export class NdsAlertDescription {}

// ─── AlertAction ──────────────────────────────────────────────────────────────
//
// Slot de ação no canto superior direito (`.nds-alert-action`, absoluto). O
// consumidor põe um `<button ndsButton size="sm" variant="default">` dentro.
// A folha já reserva o `padding-inline-end` do alert quando este slot existe.

@Directive({
  selector: 'div[ndsAlertAction]',
  standalone: true,
  host: {
    class: 'nds-alert-action',
    '[attr.data-slot]': '"alert-action"',
  },
})
export class NdsAlertAction {}

// ─── AlertIcon ────────────────────────────────────────────────────────────────
//
// Usa o pacote `lucide` (agnóstico de framework), não `lucide-angular`: este
// declara peer `@angular/core: 13.x - 21.x` e conflitaria com o Angular 22.
// O Vanilla monta os SVGs assim — mesma fonte de ícones, sem wrapper.
//
// Sem classe no SVG, de propósito: `.nds-alert > svg` já dimensiona e alinha o
// ícone. É o que o Vanilla faz, e é o que mantém o ícone na coluna 1 do grid.

import { Info, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide';

export type AlertIconKind = 'info' | 'error' | 'success' | 'warning';

type LucideIconNode = [string, Record<string, string>];

const ALERT_ICON_MAP: Record<AlertIconKind, LucideIconNode[]> = {
  info: Info as unknown as LucideIconNode[],
  error: AlertCircle as unknown as LucideIconNode[],
  success: CheckCircle2 as unknown as LucideIconNode[],
  warning: TriangleAlert as unknown as LucideIconNode[],
};

/**
 * Ícone decorativo do Alert.
 *
 * `@Directive`: o SVG não tem template — os filhos são criados por
 * `createElementNS` num `effect`, porque cada ícone do lucide é uma lista
 * `[tag, attrs]` com tag variável (`path`/`circle`/`line`) e template Angular
 * exige tag estática. Construir nós é imune a XSS: não há `innerHTML` no
 * caminho.
 *
 * `aria-hidden` fixo: o ícone repete o que o título e a descrição já dizem
 * (WCAG 1.4.1 — a cor e o desenho reforçam, não substituem o texto).
 */
@Directive({
  selector: 'svg[ndsAlertIcon]',
  standalone: true,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"alert-icon"',
  },
})
export class NdsAlertIcon {
  readonly kind = input.required<AlertIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of ALERT_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}
