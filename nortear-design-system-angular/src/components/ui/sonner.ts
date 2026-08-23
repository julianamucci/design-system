import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  type WritableSignal,
} from '@angular/core';

// Ícones do pacote `lucide` (agnóstico de framework), nunca `lucide-angular`:
// este declara peer `@angular/core: 13.x - 21.x` e conflita com o Angular 22.
// Os nós escolhidos são EXATAMENTE os que o Vanilla desenha à mão em
// `toast-utils.ts` — mesma silhueta nas cinco stacks, sem redesenhar nada.
import { CheckCircle2, XCircle, TriangleAlert, Info, Loader2, X } from 'lucide';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastPosition =
  | 'top-right' | 'top-center' | 'top-left'
  | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface ToastAction {
  /** Rótulo do botão. Verbo no infinitivo, no máximo duas palavras. */
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  /**
   * Milissegundos até o fechamento automático. `Infinity` deixa a torrada até
   * alguém fechá-la — reservado a erro crítico, e sempre com `closeButton`.
   */
  duration?: number;
  action?: ToastAction;
  /** Sobrepõe o padrão do Toaster para esta torrada. */
  closeButton?: boolean;
}

export interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
}

/**
 * Uma torrada na fila.
 *
 * `visible` é um signal por item, e não um campo comum: a entrada nasce
 * invisível e só vira visível no quadro seguinte, que é o que faz a transição
 * de opacidade acontecer de verdade (ver `create`). Um campo comum não avisaria
 * o template da virada.
 */
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  closeButton?: boolean;
  visible: WritableSignal<boolean>;
}

// ─── Estado global ────────────────────────────────────────────────────────────
//
// Signal em escopo de módulo, e não serviço com DI — mesma decisão do `locale`
// em `lib/i18n.ts`. `toast()` é chamado de qualquer lugar (inclusive de fora de
// um contexto de injeção, como um `catch` de fetch), e um `providedIn: 'root'`
// exigiria injetor em cada call site. O Toaster é quem desenha; a fila existe
// mesmo sem ele, e é por isso que `toast()` sem Toaster no root não estoura:
// a entrada entra na fila e ninguém a renderiza.

/** Padrão do projeto, e o mesmo que o conteúdo compartilhado documenta. */
const DEFAULT_DURATION = 4000;

/** Espelha a transição de saída de `.nds-toast` — remover antes cortaria o fade. */
const EXIT_DURATION = 200;

const queue = signal<Toast[]>([]);

let nextId = 0;

/**
 * Cronômetro de cada torrada, guardado fora do signal porque `restante` muda a
 * cada pausa e não tem nada a dizer ao template.
 */
interface Timer {
  restante: number;
  retomadoEm: number;
  handle?: ReturnType<typeof setTimeout>;
}

const timers = new Map<number, Timer>();
const exits = new Map<number, ReturnType<typeof setTimeout>>();

/** Duração default em vigor — o Toaster montado manda, via input `duration`. */
let currentDefaultDuration = DEFAULT_DURATION;

/** Ponteiro/foco dentro do Toaster congela todos os cronômetros (WCAG 2.2.1). */
let paused = false;

function startTimer(id: number): void {
  const c = timers.get(id);
  if (!c || paused || !Number.isFinite(c.restante)) return;
  c.retomadoEm = performance.now();
  c.handle = setTimeout(() => dismiss(id), c.restante);
}

function stopTimer(id: number): void {
  const c = timers.get(id);
  if (!c?.handle) return;
  clearTimeout(c.handle);
  c.handle = undefined;
  c.restante -= performance.now() - c.retomadoEm;
}

function schedule(id: number, duration: number): void {
  stopTimer(id);
  if (!Number.isFinite(duration)) {
    timers.delete(id);
    return;
  }
  timers.set(id, { restante: duration, retomadoEm: performance.now() });
  startTimer(id);
}

/**
 * Congela a contagem enquanto a pessoa lê.
 *
 * Uma torrada que some no meio da leitura é conteúdo que existiu e não pôde ser
 * consumido — e quem lê devagar, ou navega por teclado, é justamente quem mais
 * perde. Pausar no hover e no foco é o que dá tempo suficiente sem tirar o
 * fechamento automático de quem só passou o olho.
 */
function pauseTimers(): void {
  if (paused) return;
  paused = true;
  for (const id of timers.keys()) stopTimer(id);
}

function resumeTimers(): void {
  if (!paused) return;
  paused = false;
  for (const id of timers.keys()) startTimer(id);
}

function create(type: ToastType, title: string, opts: ToastOptions = {}): number {
  const id = ++nextId;
  // `loading` não tem prazo: quem o encerra é a promise que o originou.
  const duration = opts.duration ?? (type === 'loading' ? Number.POSITIVE_INFINITY : currentDefaultDuration);

  const enter: Toast = {
    id,
    type,
    title,
    description: opts.description,
    action: opts.action,
    closeButton: opts.closeButton,
    visible: signal(false),
  };

  queue.update((current) => [...current, enter]);

  // Dois quadros: o elemento precisa existir com `data-visible="false"` para
  // que a virada para `true` seja uma TRANSIÇÃO, e não o estado inicial. Sem
  // isso a torrada aparece seca — e, pior, os testes que medem opacidade não
  // teriam como distinguir "ainda entrando" de "assentada".
  requestAnimationFrame(() => enter.visible.set(true));

  schedule(id, duration);
  return id;
}

/** Troca tipo e texto de uma torrada viva, mantendo o mesmo nó no DOM. */
function update(id: number, patch: Partial<Toast>, duration: number): void {
  const target = queue().find((t) => t.id === id);
  if (!target) return;
  queue.update((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  schedule(id, duration);
}

function dismiss(id: number): void {
  const target = queue().find((t) => t.id === id);
  if (!target || exits.has(id)) return;

  stopTimer(id);
  timers.delete(id);
  target.visible.set(false);

  exits.set(
    id,
    setTimeout(() => {
      exits.delete(id);
      queue.update((current) => current.filter((t) => t.id !== id));
    }, EXIT_DURATION),
  );
}

/** Esvazia a fila na hora, sem fade — usado quando o Toaster é destruído. */
function drain(): void {
  for (const id of timers.keys()) stopTimer(id);
  timers.clear();
  for (const handle of exits.values()) clearTimeout(handle);
  exits.clear();
  paused = false;
  queue.set([]);
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Dispara uma torrada de qualquer lugar da aplicação.
 *
 * A mesma forma das outras stacks: `toast(...)` para a neutra e um método por
 * tipo semântico. Sem `<div ndsToaster>` montado nada é desenhado — e nada
 * estoura, que é o comportamento documentado.
 */
export const toast = Object.assign(
  (message: string, opts?: ToastOptions) => create('default', message, opts),
  {
    success: (message: string, opts?: ToastOptions) => create('success', message, opts),
    error: (message: string, opts?: ToastOptions) => create('error', message, opts),
    warning: (message: string, opts?: ToastOptions) => create('warning', message, opts),
    info: (message: string, opts?: ToastOptions) => create('info', message, opts),
    loading: (message: string, opts?: ToastOptions) => create('loading', message, opts),

    /** Sem `id`, dispensa todas — cada uma com o próprio fade. */
    dismiss: (id?: number) => {
      if (id !== undefined) {
        dismiss(id);
        return;
      }
      for (const t of queue()) dismiss(t.id);
    },

    /**
     * Uma torrada só para a operação inteira: nasce em `loading` e VIRA
     * `success` ou `error` no mesmo nó. Trocar o nó faria o leitor de tela
     * anunciar duas notificações para um evento só.
     *
     * Não devolve nada, e não repropaga a rejeição: quem chamou já tem a
     * promessa original para tratar o erro. Devolver uma promessa que rejeita
     * transformaria toda chamada sem `catch` numa rejeição não tratada — ruído
     * de console que nasceria da própria camada de notificação.
     */
    promise: <T>(
      promessa: Promise<T>,
      msgs: ToastPromiseMessages,
      opts?: ToastOptions,
    ): void => {
      const id = create('loading', msgs.loading, { ...opts, duration: Number.POSITIVE_INFINITY });
      const duration = opts?.duration ?? currentDefaultDuration;
      void promessa.then(
        () => update(id, { type: 'success', title: msgs.success }, duration),
        () => update(id, { type: 'error', title: msgs.error }, duration),
      );
    },
  },
);

// ─── NdsToastIcon ─────────────────────────────────────────────────────────────

export type ToastIconKind = Exclude<ToastType, 'default'> | 'close';

type LucideIconNode = [string, Record<string, string>];

const TOAST_ICON_MAP: Record<ToastIconKind, LucideIconNode[]> = {
  success: CheckCircle2  as unknown as LucideIconNode[],
  error:   XCircle       as unknown as LucideIconNode[],
  warning: TriangleAlert as unknown as LucideIconNode[],
  info:    Info          as unknown as LucideIconNode[],
  loading: Loader2       as unknown as LucideIconNode[],
  close:   X             as unknown as LucideIconNode[],
};

/**
 * SVG do ícone da torrada.
 *
 * Seletor no próprio `<svg>`: o CSS dimensiona `.nds-toast-icon > svg` e
 * `.nds-toast-close > svg`, então um wrapper a mais quebraria as duas regras.
 *
 * Os filhos entram por `createElementNS` num `effect`, e não pelo template,
 * porque cada ícone do lucide é uma lista `[tag, attrs]` com tag variável
 * (`path`/`circle`) — template Angular exige tag estática. Construir nós também
 * é imune a XSS: não há `innerHTML` no caminho.
 *
 * `aria-hidden` fixo: o ícone repete o que o tipo e o título já dizem. Anunciá-lo
 * faria o leitor de tela ler "imagem" antes de cada notificação.
 */
@Component({
  selector: 'svg[ndsToastIcon]',
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
export class NdsToastIcon {
  readonly kind = input.required<ToastIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of TOAST_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── NdsToaster ───────────────────────────────────────────────────────────────

/**
 * Região que desenha a fila de torradas. Vai UMA VEZ no root da aplicação.
 *
 * Seletor de atributo em `div`: o host é o elemento nativo, então o markup sai
 * idêntico ao do Vanilla (`<div class="nds-toaster" data-position="…">`) e o CSS
 * compartilhado casa sem wrapper.
 *
 * Acessibilidade, e o porquê de cada peça:
 *
 * - O contêiner é `role="region"` com nome — um marco de página que o leitor de
 *   tela alcança a qualquer momento, e não só no instante do anúncio.
 * - Cada torrada é `role="status"` com `aria-live="polite"`. NUNCA `assertive`
 *   no caso comum: interromper a leitura em curso para avisar que algo deu certo
 *   é hostil, e o critério 4.1.3 pede mensagem de estado, não alerta.
 * - O botão de ação é um `<button>` de verdade, dentro do fluxo de foco: com a
 *   torrada na tela, `Tab` chega nela (WCAG 2.1.1). Regra de projeto que o
 *   componente não consegue impor: a ação oferecida aqui precisa existir em
 *   OUTRO lugar também — a torrada some, e o que só existia nela some junto.
 * - Ponteiro ou foco dentro da região congela os cronômetros, para o tempo de
 *   leitura não ser o mesmo para todo mundo (WCAG 2.2.1).
 * - A pilha é uma coluna com `gap`: torrada nova não cobre torrada ainda não
 *   lida — cada uma ocupa o próprio espaço até vencer o prazo.
 */
@Component({
  selector: 'div[ndsToaster]',
  standalone: true,
  imports: [NdsToastIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-toaster',
    role: 'region',
    'data-sonner-toaster': '',
    '[attr.data-slot]': '"sonner-toaster"',
    '[attr.aria-label]': 'label()',
    '[attr.data-position]': 'position()',
    '[attr.data-rich-colors]': 'richColors()',
    '[attr.data-expand]': 'expand()',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'retomar()',
    '(focusin)': 'pause()',
    '(focusout)': 'retomar()',
    '(keydown.escape)': 'aoEscape($event)',
  },
  template: `
    @for (t of toastEls(); track t.id) {
      <div
        class="nds-toast"
        data-sonner-toast
        role="status"
        aria-live="polite"
        [attr.data-type]="t.type"
        [attr.data-rich-colors]="richColors()"
        [attr.data-visible]="t.visible()"
      >
        @if (t.type !== 'default') {
          <span class="nds-toast-icon" [class.nds-toast-icon-spin]="t.type === 'loading'">
            <svg ndsToastIcon [kind]="t.type"></svg>
          </span>
        }

        <div class="nds-toast-content">
          <p class="nds-toast-title">{{ t.title }}</p>

          @if (t.description) {
            <p class="nds-toast-description">{{ t.description }}</p>
          }

          @if (t.action; as action) {
            <button type="button" class="nds-toast-action" (click)="acionar(t.id, action)">
              {{ action.label }}
            </button>
          }
        </div>

        @if (t.closeButton ?? closeButton()) {
          <button
            type="button"
            class="nds-toast-close"
            data-close-button
            [attr.aria-label]="closeLabel()"
            (click)="close(t.id)"
          >
            <svg ndsToastIcon kind="close"></svg>
          </button>
        }
      </div>
    }
  `,
})
export class NdsToaster implements OnDestroy {
  /** Canto da tela onde a pilha nasce. */
  readonly position = input<ToastPosition>('bottom-right');

  /** Aplica a cor semântica do tema a cada tipo. */
  readonly richColors = input(false, { transform: booleanAttribute });

  /** Mostra a pilha aberta em vez de condensada. */
  readonly expand = input(false, { transform: booleanAttribute });

  /** Prazo default das torradas disparadas enquanto este Toaster está montado. */
  readonly duration = input(DEFAULT_DURATION, { transform: numberAttribute });

  /** Botão de fechar em todas as torradas. Cada `toast()` pode sobrepor. */
  readonly closeButton = input(false, { transform: booleanAttribute });

  /** Nome acessível da região. Dois Toasters na mesma tela precisam de nomes distintos. */
  readonly label = input('Notificações');

  /** Rótulo do botão de fechar — só ícone, então o nome vem daqui. */
  readonly closeLabel = input('Fechar notificação');

  protected readonly toastEls = queue.asReadonly();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // `effect`, e não o construtor: ler `this.duration()` no corpo do construtor
    // devolveria o default declarado aqui, nunca o `[duration]` de quem consome
    // (armadilha 9 do CLAUDE.md). O efeito ainda ganha o caso reativo — mudar o
    // control no painel passa a valer para a próxima torrada.
    effect(() => {
      currentDefaultDuration = this.duration();
    });
  }

  protected pause(): void {
    pauseTimers();
  }

  protected retomar(): void {
    resumeTimers();
  }

  protected acionar(id: number, action: ToastAction): void {
    action.onClick();
    // A torrada existia para oferecer essa ação; cumprida, ela sai na hora em
    // vez de esperar o prazo.
    dismiss(id);
  }

  protected close(id: number): void {
    dismiss(id);
  }

  /**
   * Escape fecha a notificação que está com o foco dentro.
   *
   * Quem chegou até o botão de ação por teclado precisa de uma saída que não
   * seja o mouse — e sair "pelo lado" (Tab até o fim) deixaria a notificação
   * ocupando a tela.
   *
   * O id vem da POSIÇÃO na lista, e não de um atributo no elemento: `data-slot`
   * e afins são o contrato de markup que as cinco stacks comparam, e um
   * `data-toast-id` só desta stack quebraria a comparação. A ordem dos filhos
   * espelha a fila item a item, inclusive as que estão saindo.
   */
  protected aoEscape(evento: Event): void {
    const target = (evento.target as HTMLElement | null)?.closest<HTMLElement>('.nds-toast');
    if (!target) return;
    const index = Array.prototype.indexOf.call(this.hostRef.nativeElement.children, target);
    const enter = this.toastEls()[index];
    if (enter) dismiss(enter.id);
  }

  ngOnDestroy(): void {
    // Sem isto a fila sobrevive à troca de story/rota e o próximo Toaster nasce
    // desenhando notificação de outra tela — com o cronômetro dela já vencido.
    drain();
    currentDefaultDuration = DEFAULT_DURATION;
  }
}
