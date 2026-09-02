// ─── HoverCard — Vanilla factory standalone ─────────────────────────────────
// Visual: classe .nds-hover-card-content (standalone).
// Mostra ao hover do trigger; mantém aberto enquanto mouse está sobre o painel.
//
// ─── Acessibilidade: o que separa este cartão do tooltip e do popover ───────
//
// Bloco canônico do sistema. As outras quatro stacks carregam a versão curta
// mais o mecanismo da lib delas; a decisão é esta, e foi medida na FONTE das
// quatro libs, não na documentação.
//
// Os três abrem uma caixa flutuante. A diferença é QUEM chega até ela:
//
//  · **tooltip DESCREVE.** Não recebe foco, não tem conteúdo próprio, e a
//    persistência da 1.4.13 é resolvida por COORDENADA — a folha dá
//    `pointer-events: none` ao balão, então o ponteiro nunca o "perde".
//  · **popover RECEBE FOCO.** Tem conteúdo interativo, abre por clique, e por
//    isso ganhou `modal`: há para onde levar o foco e de onde devolvê-lo.
//  · **hover-card abre por PONTEIRO.** Nenhuma das cinco stacks move o foco
//    para o painel, e as cinco fecham no `blur` do gatilho. Some as duas
//    coisas: um Tab a partir do gatilho FECHA o cartão antes de alcançar o que
//    houver dentro. Conteúdo interativo no painel é inalcançável por teclado, e
//    isso não é defeito de uma stack — é a forma do gesto.
//
// Daí saem três regras do COMPONENTE, não do exemplo:
//
//  1. o painel nunca carrega ação, link ou campo. Medido: nenhuma composição
//     das cinco stacks põe elemento focável dentro do painel;
//  2. o cartão é ENRIQUECIMENTO. O gatilho continua sendo o caminho — `<a>`
//     quando navega, `<button>` quando só explica —, e a informação tem sempre
//     uma via alternativa (a página de perfil, o glossário);
//  3. abrir por FOCO é obrigatório, e as cinco abrem. Sem isso o conteúdo
//     simplesmente não existiria para quem não usa ponteiro.
//
// WCAG 1.4.13, as três condições e onde cada uma é cumprida:
//
//  · **dispensável** — Escape fecha. O ouvinte é do DOCUMENTO porque o foco
//    fica no gatilho, nunca dentro do painel;
//  · **pairável** — o ponteiro entra no painel sem fechá-lo;
//  · **persistente** — só some por Escape, pelo ponteiro sair ou pelo blur.
//
// **Nome sim, descrição não.** O painel é `role="dialog"` e exige NOME: ele sai
// do rótulo declarado e, sem ele, do texto do gatilho. Pôr também
// `aria-describedby` no gatilho apontando para o painel faria o leitor anunciar
// o link e em seguida descrevê-lo com um diálogo de nome idêntico — a mesma
// coisa duas vezes. `aria-labelledby` seria pior: trocaria o nome do link pelo
// do cartão. Por isso o gatilho não recebe nenhum dos dois, e também não recebe
// `aria-expanded`/`aria-haspopup`: quem tem estado é o painel.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type Destroyable } from '@/lib/destroy';

export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';
export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardOptions = {
  trigger: HTMLElement;
  content: HTMLElement;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  /** Espera em ms antes de abrir, depois que o ponteiro entra no gatilho. */
  openDelay?: number;
  /** Espera em ms antes de fechar, depois que o ponteiro sai. */
  closeDelay?: number;
  /** Abre já na montagem — o equivalente não-controlado das outras stacks. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

/**
 * Raiz do cartão com os dois comandos imperativos.
 *
 * É a forma que o modo CONTROLADO tem numa factory: não há prop reativa para
 * observar, então quem controla chama `open()`/`close()` e recebe cada
 * mudança de volta por `onOpenChange`. Antes disso, a única maneira de abrir
 * por fora era despachar um `mouseenter` falso no gatilho — o que testava o
 * evento, não o estado.
 */
export type HoverCardElement = HTMLElement & Destroyable & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _hoverCardCounter = 0;

/**
 * Espera padrão do design system, igual nas cinco stacks.
 *
 * 600ms respeita a diretriz de uso (≥300ms) sem fazer o cartão abrir a cada
 * passada de cursor; 300ms para fechar dá tempo de o ponteiro atravessar o vão
 * entre o gatilho e o painel.
 */
const WAIT_DEFAULT_OPEN = 600;
const WAIT_DEFAULT_CLOSE = 300;

function positionHoverCard(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: HoverCardSide,
  align: HoverCardAlign
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 8;

  panel.style.visibility = 'hidden';
  panel.style.display = 'block';
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  panel.style.visibility = '';

  let top = 0;
  let left = 0;

  if (side === 'bottom') {
    top = rect.bottom + scrollY + gap;
  } else if (side === 'top') {
    top = rect.top + scrollY - ph - gap;
  } else if (side === 'left') {
    left = rect.left + scrollX - pw - gap;
  } else {
    left = rect.right + scrollX + gap;
  }

  if (side === 'bottom' || side === 'top') {
    if (align === 'start') left = rect.left + scrollX;
    else if (align === 'end') left = rect.right + scrollX - pw;
    else left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else {
    if (align === 'start') top = rect.top + scrollY;
    else if (align === 'end') top = rect.bottom + scrollY - ph;
    else top = rect.top + scrollY + rect.height / 2 - ph / 2;
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  // O lado escolhido é publicado como nas outras stacks: é por ele que o CSS e
  // os testes sabem para onde o cartão abriu.
  panel.dataset.side = side;
  panel.dataset.align = align;
}

// ─── createHoverCard ──────────────────────────────────────────────────────────

export function createHoverCard(options: HoverCardOptions): HoverCardElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    openDelay = WAIT_DEFAULT_OPEN,
    closeDelay = WAIT_DEFAULT_CLOSE,
    defaultOpen = false,
    onOpenChange,
  } = options;

  const id = ++_hoverCardCounter;
  const cardId = `hover-card-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  // O elemento nasce sem os dois comandos e os recebe no fim desta função —
  // por isso a conversão passa por `unknown`: o `<div>` só vira `HoverCardElement`
  // depois de `open`/`close` existirem.
  const wrapper = document.createElement('div') as unknown as HoverCardElement;
  wrapper.dataset.slot = 'hover-card';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  // Escape fecha (WCAG 1.4.13, dismissable). O listener é do DOCUMENTO porque o
  // foco fica no gatilho — nunca dentro do painel — e só vive enquanto o cartão
  // está aberto: um listener por instância, permanente, vazaria em toda página
  // com muitas menções.
  function onKeyDown(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') hide();
  }

  function show(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = cardId;
    panelEl.setAttribute('role', 'dialog');
    panelEl.className = cn('nds-hover-card-content', options.class);
    panelEl.dataset.slot = 'hover-card-content';
    panelEl.style.position = 'absolute';
    panelEl.appendChild(content);

    // PATCH: a11y — role="dialog" exige accessible name. Ele sai do rótulo que
    // quem compõe declara no gatilho e, sem ele, do texto do próprio gatilho —
    // a mesma regra das outras quatro stacks.
    const triggerLabel =
      trigger.getAttribute('aria-label') || trigger.textContent?.trim() || 'Prévia';
    panelEl.setAttribute('aria-label', triggerLabel);

    document.body.appendChild(panelEl);
    positionHoverCard(trigger, panelEl, side, align);

    // Keep card open while hovering over it
    panelEl.addEventListener('mouseenter', () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    panelEl.addEventListener('mouseleave', scheduleHide);
    document.addEventListener('keydown', onKeyDown);

    onOpenChange?.(true);
  }

  function hide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (!panelEl) return;
    document.removeEventListener('keydown', onKeyDown);
    panelEl.remove();
    panelEl = null;
    onOpenChange?.(false);
  }

  function scheduleShow(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    // Arrow literal — ver tooltip.ts pra justificativa.
    showTimer = setTimeout(() => { show(); }, openDelay);
  }

  function scheduleHide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(() => { hide(); }, closeDelay);
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', scheduleHide);

  // Abrir por FOCO, e não só por ponteiro: é o que sustenta a WCAG 1.4.13 para
  // quem navega por teclado, e é o comportamento que as outras quatro stacks
  // herdam da lib. Sem isto o cartão era inalcançável sem mouse.
  trigger.addEventListener('focus', scheduleShow);
  trigger.addEventListener('blur', scheduleHide);

  // `panelEl` É o estado: o painel existe enquanto o cartão está aberto e é
  // removido ao fechar. Não há sinalizador paralelo a dessincronizar.
  wrapper.open = show;
  wrapper.close = hide;
  wrapper.toggle = () => { if (panelEl) hide(); else show(); };
  wrapper.isOpen = () => panelEl !== null;

  /*
   * O painel mora no `document.body` e o `keydown` de Escape vive no
   * `document` — os dois só enquanto o cartão está EXIBIDO, e os dois soltos
   * por `hide()`. Quem removia o wrapper com o cartão aberto não passava por
   * `hide()`: sobravam o painel órfão e o ouvinte preso a um nó desanexado.
   *
   * `hide()` também derruba os dois temporizadores. Sem isso, um `show()`
   * agendado dispararia DEPOIS da remoção e poria um painel novo na página,
   * junto com um ouvinte novo — vazamento criado pela própria saída.
   */
  tornarDestruivel(wrapper, wrapper, hide);

  if (defaultOpen) {
    // `requestAnimationFrame` e não `queueMicrotask`: posicionar exige o
    // retângulo do gatilho, e ele só existe depois de o wrapper entrar no
    // documento e o navegador calcular o layout.
    requestAnimationFrame(() => { show(); });
  }

  return wrapper;
}
