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
 * `visivel` é um signal por item, e não um campo comum: a entrada nasce
 * invisível e só vira visível no quadro seguinte, que é o que faz a transição
 * de opacidade acontecer de verdade (ver `criar`). Um campo comum não avisaria
 * o template da virada.
 */
interface Torrada {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  closeButton?: boolean;
  visivel: WritableSignal<boolean>;
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
const DURACAO_PADRAO = 4000;

/** Espelha a transição de saída de `.nds-toast` — remover antes cortaria o fade. */
const DURACAO_SAIDA = 200;

const fila = signal<Torrada[]>([]);

let proximoId = 0;

/**
 * Cronômetro de cada torrada, guardado fora do signal porque `restante` muda a
 * cada pausa e não tem nada a dizer ao template.
 */
interface Cronometro {
  restante: number;
  retomadoEm: number;
  handle?: ReturnType<typeof setTimeout>;
}

const cronometros = new Map<number, Cronometro>();
const saidas = new Map<number, ReturnType<typeof setTimeout>>();

/** Duração default em vigor — o Toaster montado manda, via input `duration`. */
let duracaoPadraoAtual = DURACAO_PADRAO;

/** Ponteiro/foco dentro do Toaster congela todos os cronômetros (WCAG 2.2.1). */
let pausado = false;

function iniciarCronometro(id: number): void {
  const c = cronometros.get(id);
  if (!c || pausado || !Number.isFinite(c.restante)) return;
  c.retomadoEm = performance.now();
  c.handle = setTimeout(() => dispensar(id), c.restante);
}

function pararCronometro(id: number): void {
  const c = cronometros.get(id);
  if (!c?.handle) return;
  clearTimeout(c.handle);
  c.handle = undefined;
  c.restante -= performance.now() - c.retomadoEm;
}

function agendar(id: number, duracao: number): void {
  pararCronometro(id);
  if (!Number.isFinite(duracao)) {
    cronometros.delete(id);
    return;
  }
  cronometros.set(id, { restante: duracao, retomadoEm: performance.now() });
  iniciarCronometro(id);
}

/**
 * Congela a contagem enquanto a pessoa lê.
 *
 * Uma torrada que some no meio da leitura é conteúdo que existiu e não pôde ser
 * consumido — e quem lê devagar, ou navega por teclado, é justamente quem mais
 * perde. Pausar no hover e no foco é o que dá tempo suficiente sem tirar o
 * fechamento automático de quem só passou o olho.
 */
function pausarCronometros(): void {
  if (pausado) return;
  pausado = true;
  for (const id of cronometros.keys()) pararCronometro(id);
}

function retomarCronometros(): void {
  if (!pausado) return;
  pausado = false;
  for (const id of cronometros.keys()) iniciarCronometro(id);
}

function criar(type: ToastType, title: string, opts: ToastOptions = {}): number {
  const id = ++proximoId;
  // `loading` não tem prazo: quem o encerra é a promise que o originou.
  const duracao = opts.duration ?? (type === 'loading' ? Number.POSITIVE_INFINITY : duracaoPadraoAtual);

  const entrada: Torrada = {
    id,
    type,
    title,
    description: opts.description,
    action: opts.action,
    closeButton: opts.closeButton,
    visivel: signal(false),
  };

  fila.update((atual) => [...atual, entrada]);

  // Dois quadros: o elemento precisa existir com `data-visible="false"` para
  // que a virada para `true` seja uma TRANSIÇÃO, e não o estado inicial. Sem
  // isso a torrada aparece seca — e, pior, os testes que medem opacidade não
  // teriam como distinguir "ainda entrando" de "assentada".
  requestAnimationFrame(() => entrada.visivel.set(true));

  agendar(id, duracao);
  return id;
}

/** Troca tipo e texto de uma torrada viva, mantendo o mesmo nó no DOM. */
function atualizar(id: number, patch: Partial<Torrada>, duracao: number): void {
  const alvo = fila().find((t) => t.id === id);
  if (!alvo) return;
  fila.update((atual) => atual.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  agendar(id, duracao);
}

function dispensar(id: number): void {
  const alvo = fila().find((t) => t.id === id);
  if (!alvo || saidas.has(id)) return;

  pararCronometro(id);
  cronometros.delete(id);
  alvo.visivel.set(false);

  saidas.set(
    id,
    setTimeout(() => {
      saidas.delete(id);
      fila.update((atual) => atual.filter((t) => t.id !== id));
    }, DURACAO_SAIDA),
  );
}

/** Esvazia a fila na hora, sem fade — usado quando o Toaster é destruído. */
function esvaziar(): void {
  for (const id of cronometros.keys()) pararCronometro(id);
  cronometros.clear();
  for (const handle of saidas.values()) clearTimeout(handle);
  saidas.clear();
  pausado = false;
  fila.set([]);
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
  (message: string, opts?: ToastOptions) => criar('default', message, opts),
  {
    success: (message: string, opts?: ToastOptions) => criar('success', message, opts),
    error: (message: string, opts?: ToastOptions) => criar('error', message, opts),
    warning: (message: string, opts?: ToastOptions) => criar('warning', message, opts),
    info: (message: string, opts?: ToastOptions) => criar('info', message, opts),
    loading: (message: string, opts?: ToastOptions) => criar('loading', message, opts),

    /** Sem `id`, dispensa todas — cada uma com o próprio fade. */
    dismiss: (id?: number) => {
      if (id !== undefined) {
        dispensar(id);
        return;
      }
      for (const t of fila()) dispensar(t.id);
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
      const id = criar('loading', msgs.loading, { ...opts, duration: Number.POSITIVE_INFINITY });
      const prazo = opts?.duration ?? duracaoPadraoAtual;
      void promessa.then(
        () => atualizar(id, { type: 'success', title: msgs.success }, prazo),
        () => atualizar(id, { type: 'error', title: msgs.error }, prazo),
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
        const filho = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
        svg.appendChild(filho);
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
    '(mouseenter)': 'pausar()',
    '(mouseleave)': 'retomar()',
    '(focusin)': 'pausar()',
    '(focusout)': 'retomar()',
    '(keydown.escape)': 'aoEscape($event)',
  },
  template: `
    @for (t of torradas(); track t.id) {
      <div
        class="nds-toast"
        data-sonner-toast
        role="status"
        aria-live="polite"
        [attr.data-type]="t.type"
        [attr.data-rich-colors]="richColors()"
        [attr.data-visible]="t.visivel()"
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

          @if (t.action; as acao) {
            <button type="button" class="nds-toast-action" (click)="acionar(t.id, acao)">
              {{ acao.label }}
            </button>
          }
        </div>

        @if (t.closeButton ?? closeButton()) {
          <button
            type="button"
            class="nds-toast-close"
            data-close-button
            [attr.aria-label]="closeLabel()"
            (click)="fechar(t.id)"
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
  readonly duration = input(DURACAO_PADRAO, { transform: numberAttribute });

  /** Botão de fechar em todas as torradas. Cada `toast()` pode sobrepor. */
  readonly closeButton = input(false, { transform: booleanAttribute });

  /** Nome acessível da região. Dois Toasters na mesma tela precisam de nomes distintos. */
  readonly label = input('Notificações');

  /** Rótulo do botão de fechar — só ícone, então o nome vem daqui. */
  readonly closeLabel = input('Fechar notificação');

  protected readonly torradas = fila.asReadonly();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    // `effect`, e não o construtor: ler `this.duration()` no corpo do construtor
    // devolveria o default declarado aqui, nunca o `[duration]` de quem consome
    // (armadilha 9 do CLAUDE.md). O efeito ainda ganha o caso reativo — mudar o
    // control no painel passa a valer para a próxima torrada.
    effect(() => {
      duracaoPadraoAtual = this.duration();
    });
  }

  protected pausar(): void {
    pausarCronometros();
  }

  protected retomar(): void {
    retomarCronometros();
  }

  protected acionar(id: number, acao: ToastAction): void {
    acao.onClick();
    // A torrada existia para oferecer essa ação; cumprida, ela sai na hora em
    // vez de esperar o prazo.
    dispensar(id);
  }

  protected fechar(id: number): void {
    dispensar(id);
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
    const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>('.nds-toast');
    if (!alvo) return;
    const indice = Array.prototype.indexOf.call(this.hostRef.nativeElement.children, alvo);
    const entrada = this.torradas()[indice];
    if (entrada) dispensar(entrada.id);
  }

  ngOnDestroy(): void {
    // Sem isto a fila sobrevive à troca de story/rota e o próximo Toaster nasce
    // desenhando notificação de outra tela — com o cronômetro dela já vencido.
    esvaziar();
    duracaoPadraoAtual = DURACAO_PADRAO;
  }
}
