// Fila de notificações do Vanilla — sem dependência de framework.
//
// É a implementação de referência do `.nds-toast`: o que está aqui é o que o
// design system define, e as outras stacks embrulham uma lib que injeta o
// próprio markup.

import DOMPurify from 'dompurify';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

export interface ToasterOptions {
  /** Canto da tela onde a pilha nasce. */
  position?: ToastPosition;
  /** Aplica a cor semântica do tema a cada tipo. */
  richColors?: boolean;
  /** Mostra a pilha aberta em vez de condensada. */
  expand?: boolean;
  /** Prazo default das notificações disparadas enquanto esta região existe. */
  duration?: number;
  /** Botão de fechar em todas as notificações. Cada `toast()` pode sobrepor. */
  closeButton?: boolean;
  /** Nome acessível da região. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /**
   * Nome acessível do botão de fechar — só ícone, então o nome vem daqui.
   * Alvo diferente do `aria-label` acima, e por isso um nome à parte.
   */
  closeLabel?: string;
  class?: string;
}

export interface ToastOptions {
  description?: string;
  /**
   * Milissegundos até o fechamento automático. `Infinity` deixa a notificação
   * até alguém fechá-la — reservado a erro crítico, e sempre com `closeButton`.
   */
  duration?: number;
  action?: { label: string; onClick: () => void };
  closeButton?: boolean;
  richColors?: boolean;
  position?: ToastPosition;
}

interface ToastEntry {
  id: number;
  el: HTMLElement;
  titleEl: HTMLElement;
  iconWrap: HTMLElement | null;
  /** Sobra do prazo. Muda a cada pausa, e não tem nada a dizer ao DOM. */
  restante: number;
  retomadoEm: number;
  timer?: ReturnType<typeof setTimeout>;
}

/** Padrão do projeto, e o mesmo que o conteúdo compartilhado documenta. */
const DURATION_DEFAULT = 4000;

/** Espelha a transição de saída de `.nds-toast` — encurtar aqui corta o fade. */
const DURATION_OUTPUT = 200;

let toastId = 0;
const activeToasts: ToastEntry[] = [];
let containerEl: HTMLElement | null = null;
let currentPosition: ToastPosition = 'bottom-right';

/** Região montada por quem consome (vive além da fila) × criada sob demanda. */
let regiaoDoConsumidor = false;

/** Ponteiro ou foco dentro da região congela todos os cronômetros (WCAG 2.2.1). */
let paused = false;

/** Rótulos em português — o design system é escrito em pt-BR. */
export const REGION_LABEL = 'Notificações';
export const CLOSE_LABEL = 'Fechar notificação';

/**
 * Defaults em vigor — a região montada manda, como o input `duration` do
 * Toaster nas outras stacks. Sem região montada valem os do design system.
 */
type Defaults = Required<Pick<ToasterOptions, 'richColors' | 'duration' | 'closeButton' | 'closeLabel'>>;

const sistemaDefaults = (): Defaults => ({
  richColors: false,
  duration: DURATION_DEFAULT,
  closeButton: false,
  closeLabel: CLOSE_LABEL,
});

let defaults: Defaults = sistemaDefaults();

const ICONS: Record<ToastType, string> = {
  default: '',
  success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  // A rotação vive em `.nds-toast-icon-spin`, no wrapper — não numa classe no
  // próprio SVG. A antiga `ds-toast-spin` tinha prefixo de antes da migração
  // `.nds-*` e não existia em CSS nenhum: o ícone nunca girou.
  loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

const CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

// ─── Cronômetros ──────────────────────────────────────────────────────────────

function stopCronometro(entry: ToastEntry): void {
  if (entry.timer === undefined) return;
  clearTimeout(entry.timer);
  entry.timer = undefined;
  entry.restante -= performance.now() - entry.retomadoEm;
}

function startCronometro(entry: ToastEntry): void {
  // `setTimeout(fn, Infinity)` NÃO é "nunca": o delay é convertido para inteiro
  // de 32 bits e vira 0, então a notificação persistente sumia no quadro
  // seguinte. O guarda é o que faz `duration: Infinity` valer de verdade.
  if (paused || !Number.isFinite(entry.restante)) return;
  entry.retomadoEm = performance.now();
  entry.timer = setTimeout(() => removeToast(entry.id), entry.restante);
}

function schedule(entry: ToastEntry, duracao: number): void {
  stopCronometro(entry);
  entry.restante = duracao;
  startCronometro(entry);
}

/**
 * Congela a contagem enquanto a pessoa lê.
 *
 * Uma notificação que some no meio da leitura é conteúdo que existiu e não pôde
 * ser consumido — e quem lê devagar, ou navega por teclado, é justamente quem
 * mais perde (WCAG 2.2.1).
 */
function pauseCronometros(): void {
  if (paused) return;
  paused = true;
  for (const entry of activeToasts) stopCronometro(entry);
}

function resumeCronometros(): void {
  if (!paused) return;
  paused = false;
  for (const entry of activeToasts) startCronometro(entry);
}

// ─── Região ───────────────────────────────────────────────────────────────────

/**
 * Monta a região que desenha a fila. Vai UMA VEZ, no root da aplicação.
 *
 * Devolve o elemento já registrado como a região em vigor: sem isso o
 * `createSonnerToaster` do snippet de importação criava um `<div>` solto e o
 * `toast()` seguia montando um SEGUNDO contêiner por conta própria — duas
 * regiões com o mesmo nome, e as opções escritas pela pessoa sem efeito nenhum.
 */
export function createSonnerToaster(options: ToasterOptions = {}): HTMLElement {
  const el = mountRegiao(options);
  regiaoDoConsumidor = true;
  defaults = {
    richColors: options.richColors ?? false,
    duration: options.duration ?? DURATION_DEFAULT,
    closeButton: options.closeButton ?? false,
    closeLabel: options.closeLabel ?? CLOSE_LABEL,
  };
  return el;
}

function mountRegiao(options: ToasterOptions): HTMLElement {
  const { position = 'bottom-right', richColors = false, expand = false } = options;

  if (containerEl) containerEl.remove();

  const el = document.createElement('div');
  el.setAttribute('role', 'region');
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  el.setAttribute('aria-label', options['aria-label'] ?? options.label ?? REGION_LABEL);
  el.setAttribute('data-sonner-toaster', '');
  el.dataset.slot = 'sonner-toaster';
  el.className = options.class ? `nds-toaster ${options.class}` : 'nds-toaster';
  el.dataset.position = position;
  el.dataset.richColors = String(richColors);
  el.dataset.expand = String(expand);

  // Ponteiro ou foco dentro da região congela todos os cronômetros.
  el.addEventListener('mouseenter', pauseCronometros);
  el.addEventListener('mouseleave', resumeCronometros);
  el.addEventListener('focusin', pauseCronometros);
  el.addEventListener('focusout', resumeCronometros);

  // Escape fecha a notificação que está com o foco dentro. Quem chegou até o
  // botão de ação por teclado precisa de uma saída que não seja o mouse — e
  // sair "pelo lado" (Tab até o fim) deixaria a notificação ocupando a tela.
  el.addEventListener('keydown', (evento) => {
    if ((evento as KeyboardEvent).key !== 'Escape') return;
    const alvo = (evento.target as HTMLElement | null)?.closest<HTMLElement>('.nds-toast');
    if (!alvo) return;
    const entry = activeToasts.find((t) => t.el === alvo);
    if (entry) removeToast(entry.id);
  });

  containerEl = el;
  currentPosition = position;
  regiaoDoConsumidor = false;

  return el;
}

/**
 * A região em vigor, criada sob demanda.
 *
 * `toast()` funciona sem região montada — é o contrato desta stack, e o que
 * permite chamá-lo de um `catch` numa tela que ainda não montou nada.
 */
function ensureContainer(position: ToastPosition | undefined): HTMLElement {
  // Com uma região montada por quem consome, a posição é dela: `position` por
  // chamada só decide quando não há Toaster nenhum na página.
  if (containerEl && (regiaoDoConsumidor || position === undefined || currentPosition === position)) {
    if (!containerEl.isConnected) document.body.appendChild(containerEl);
    return containerEl;
  }

  const el = mountRegiao({ position: position ?? 'bottom-right', richColors: defaults.richColors });
  document.body.appendChild(el);
  return el;
}

function removeToast(id: number): void {
  const idx = activeToasts.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const entry = activeToasts[idx];
  stopCronometro(entry);
  activeToasts.splice(idx, 1);
  entry.el.dataset.visible = 'false';

  setTimeout(() => {
    entry.el.remove();
    // Região criada sob demanda sai junto com a última notificação; a que quem
    // consome montou continua na página — é um marco de navegação, alcançável
    // pelo leitor de tela mesmo com a fila vazia.
    if (activeToasts.length === 0 && containerEl && !regiaoDoConsumidor) {
      containerEl.remove();
      containerEl = null;
      defaults = sistemaDefaults();
    }
  }, DURATION_OUTPUT);
}

// ─── Criação ──────────────────────────────────────────────────────────────────

function mountIcon(type: ToastType): HTMLElement | null {
  if (!ICONS[type]) return null;
  const iconWrap = document.createElement('span');
  iconWrap.className = 'nds-toast-icon';
  if (type === 'loading') iconWrap.classList.add('nds-toast-icon-spin');
  // O ícone repete o que o tipo e o título já dizem. Anunciá-lo faria o leitor
  // de tela ler "imagem" antes de cada notificação.
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.innerHTML = DOMPurify.sanitize(ICONS[type]);
  return iconWrap;
}

function createToast(type: ToastType, message: string, opts: ToastOptions = {}): number {
  const id = ++toastId;
  const container = ensureContainer(opts.position);
  const richColors = opts.richColors ?? defaults.richColors;
  // `loading` não tem prazo: quem o encerra é a operação que o originou.
  const duration = opts.duration ?? (type === 'loading' ? Number.POSITIVE_INFINITY : defaults.duration);
  const closeButton = opts.closeButton ?? defaults.closeButton;

  const toast = document.createElement('div');
  toast.setAttribute('data-sonner-toast', '');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.className = 'nds-toast';
  toast.dataset.type = type;
  toast.dataset.richColors = String(richColors);
  toast.dataset.visible = 'false';

  const iconWrap = mountIcon(type);
  if (iconWrap) toast.appendChild(iconWrap);

  const content = document.createElement('div');
  content.className = 'nds-toast-content';

  const title = document.createElement('p');
  title.className = 'nds-toast-title';
  title.textContent = message;
  content.appendChild(title);

  if (opts.description) {
    const desc = document.createElement('p');
    desc.className = 'nds-toast-description';
    desc.textContent = opts.description;
    content.appendChild(desc);
  }

  if (opts.action) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-toast-action';
    actionBtn.textContent = opts.action.label;
    actionBtn.addEventListener('click', () => {
      opts.action!.onClick();
      // A notificação existia para oferecer essa ação; cumprida, ela sai na
      // hora em vez de continuar ocupando a pilha.
      removeToast(id);
    });
    content.appendChild(actionBtn);
  }

  toast.appendChild(content);

  if (closeButton) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('data-close-button', '');
    closeBtn.setAttribute('aria-label', defaults.closeLabel);
    closeBtn.className = 'nds-toast-close';
    closeBtn.innerHTML = DOMPurify.sanitize(CLOSE_SVG);
    closeBtn.addEventListener('click', () => removeToast(id));
    toast.appendChild(closeBtn);
  }

  container.appendChild(toast);

  // Dois quadros: o elemento precisa existir com `data-visible="false"` para
  // que a virada para `true` seja uma TRANSIÇÃO, e não o estado inicial. Sem
  // isso a notificação aparece seca — e os testes que medem opacidade não
  // teriam como distinguir "ainda entrando" de "assentada".
  requestAnimationFrame(() => {
    toast.dataset.visible = 'true';
  });

  const entry: ToastEntry = {
    id,
    el: toast,
    titleEl: title,
    iconWrap,
    restante: duration,
    retomadoEm: performance.now(),
  };
  activeToasts.push(entry);
  startCronometro(entry);

  return id;
}

/**
 * Troca tipo e texto de uma notificação viva, mantendo o MESMO nó no DOM.
 *
 * Trocar o nó faria o leitor de tela anunciar duas notificações para um evento
 * só — que é exatamente o que `toast.promise` existe para evitar.
 */
function update(id: number, type: ToastType, message: string, duracao: number): void {
  const entry = activeToasts.find((t) => t.id === id);
  if (!entry) return;

  entry.el.dataset.type = type;
  entry.titleEl.textContent = message;

  entry.iconWrap?.remove();
  const newIcon = mountIcon(type);
  entry.iconWrap = newIcon;
  if (newIcon) entry.el.insertBefore(newIcon, entry.el.firstChild);

  schedule(entry, duracao);
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const toast = Object.assign(
  (message: string, opts?: ToastOptions) => createToast('default', message, opts),
  {
    success: (message: string, opts?: ToastOptions) => createToast('success', message, opts),
    error: (message: string, opts?: ToastOptions) => createToast('error', message, opts),
    warning: (message: string, opts?: ToastOptions) => createToast('warning', message, opts),
    info: (message: string, opts?: ToastOptions) => createToast('info', message, opts),
    loading: (message: string, opts?: ToastOptions) => createToast('loading', message, opts),

    /** Sem `id`, dispensa todas — cada uma com o próprio fade. */
    dismiss: (id?: number) => {
      if (id !== undefined) {
        removeToast(id);
        return;
      }
      for (const entry of [...activeToasts]) removeToast(entry.id);
    },

    /**
     * Uma notificação só para a operação inteira: nasce em `loading` e VIRA
     * `success` ou `error` no mesmo nó.
     *
     * Não devolve nada e não repropaga a rejeição: quem chamou já tem a
     * promessa original para tratar o erro. Devolver uma promessa que rejeita
     * transformaria toda chamada sem `catch` numa rejeição não tratada — ruído
     * de console nascido da própria camada de notificação.
     */
    promise: <T>(
      promise: Promise<T>,
      msgs: { loading: string; success: string; error: string },
      opts?: ToastOptions,
    ): void => {
      const id = createToast('loading', msgs.loading, {
        ...opts,
        duration: Number.POSITIVE_INFINITY,
      });
      const prazo = opts?.duration ?? DURATION_DEFAULT;
      void promise.then(
        () => update(id, 'success', msgs.success, prazo),
        () => update(id, 'error', msgs.error, prazo),
      );
    },
  },
);

/**
 * No-op mantido por compatibilidade de API com as outras stacks.
 * Os estilos vivem em `@shared/styles/nds/toast.css`, sem injeção dinâmica.
 */
export function injectToastStyles(): void {
  // intencionalmente vazio — o CSS é importado pelo globals.css
}
