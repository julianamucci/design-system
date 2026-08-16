// ─── Tooltip — Vanilla factory standalone ───────────────────────────────────
//
// Visual: classe .nds-tooltip-content (standalone).
// Render via portal (body) com posicionamento absoluto via JS.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
  trigger: HTMLElement;
  content: string;
  side?: TooltipSide;
  // PATCH: api — callback de exibição real para analytics (ver PATCHES.md#vanilla-tooltip-onshow)
  /** Chamado quando o tooltip é de fato exibido (após o delay interno). */
  onShow?: () => void;
  class?: string;
};

let _tooltipCounter = 0;
const SHOW_DELAY = 300;

/**
 * Janela em que o balão sobrevive ao ponteiro que saiu do gatilho.
 *
 * É a "área de tolerância" que a WCAG 1.4.13 (Hoverable) exige: o ponteiro
 * precisa poder atravessar o vão entre gatilho e balão sem que o balão suma no
 * caminho. O balão é `pointer-events: none` na folha compartilhada — igual nas
 * cinco stacks —, então quem segura a abertura não é o hover NELE, e sim a
 * coordenada do ponteiro dentro da caixa que une os dois.
 */
const GRACE_MS = 200;

function positionTooltip(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: TooltipSide
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 6;

  panel.style.visibility = 'hidden';
  panel.style.display = 'block';
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  panel.style.visibility = '';

  let top: number;
  let left: number;

  if (side === 'top') {
    top = rect.top + scrollY - ph - gap;
    left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else if (side === 'bottom') {
    top = rect.bottom + scrollY + gap;
    left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else if (side === 'left') {
    top = rect.top + scrollY + rect.height / 2 - ph / 2;
    left = rect.left + scrollX - pw - gap;
  } else {
    top = rect.top + scrollY + rect.height / 2 - ph / 2;
    left = rect.right + scrollX + gap;
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

export function createTooltip(options: TooltipOptions): DestroyableElement {
  const { trigger, content, side = 'top' } = options;

  const id = ++_tooltipCounter;
  const tooltipId = `tooltip-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let ponteiroPressionado = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'tooltip';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  /** O ponteiro está dentro da caixa que une gatilho e balão? */
  function dentroDaTolerancia(x: number, y: number): boolean {
    if (!panelEl) return false;
    const a = trigger.getBoundingClientRect();
    const b = panelEl.getBoundingClientRect();
    const margem = 8;
    return (
      x >= Math.min(a.left, b.left) - margem &&
      x <= Math.max(a.right, b.right) + margem &&
      y >= Math.min(a.top, b.top) - margem &&
      y <= Math.max(a.bottom, b.bottom) + margem
    );
  }

  function aoMover(event: MouseEvent): void {
    if (!panelEl) return;
    if (dentroDaTolerancia(event.clientX, event.clientY)) cancelarFechamento();
    else agendarFechamento();
  }

  function aoTeclar(event: KeyboardEvent): void {
    // Escape fecha sem tirar o foco do gatilho — WCAG 1.4.13 (Dismissible).
    // O foco não é tocado aqui de propósito: `blur` é que fecha por saída, e
    // mexer nele faria o Escape parecer um Tab.
    if (event.key === 'Escape') hide();
  }

  function show(): void {
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = tooltipId;
    panelEl.setAttribute('role', 'tooltip');
    panelEl.className = cn('nds-tooltip-content', options.class);
    panelEl.dataset.slot = 'tooltip-content';
    panelEl.dataset.state = 'open';
    panelEl.dataset.side = side;
    panelEl.textContent = content;

    document.body.appendChild(panelEl);
    positionTooltip(trigger, panelEl, side);

    // `aria-describedby` só enquanto o balão EXISTE. Escrevê-lo na montagem
    // deixa o gatilho apontando para um id ausente o tempo todo — violação de
    // `aria-valid-attr-value` no axe, e uma descrição que o leitor de tela
    // procura e não acha.
    trigger.setAttribute('aria-describedby', tooltipId);

    document.addEventListener('mousemove', aoMover);
    document.addEventListener('keydown', aoTeclar);

    // PATCH: api — callback de exibição real para analytics (ver PATCHES.md#vanilla-tooltip-onshow)
    options.onShow?.();
  }

  function hide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    document.removeEventListener('mousemove', aoMover);
    document.removeEventListener('keydown', aoTeclar);
    panelEl?.remove();
    panelEl = null;
    trigger.removeAttribute('aria-describedby');
  }

  function scheduleShow(): void {
    cancelarFechamento();
    if (panelEl || showTimer) return;
    // Arrow literal explícito — clarifica pro SAST que setTimeout recebe
    // função, não string evaluada. Comportamento idêntico a setTimeout(show, …).
    showTimer = setTimeout(() => { showTimer = null; show(); }, SHOW_DELAY);
  }

  function cancelarFechamento(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  function agendarFechamento(): void {
    if (hideTimer) return;
    hideTimer = setTimeout(() => { hideTimer = null; hide(); }, GRACE_MS);
  }

  /** Saída pelo ponteiro respeita a tolerância; saída pelo foco fecha na hora. */
  function aoSairDoPonteiro(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (panelEl) agendarFechamento();
  }

  /**
   * O foco abre NA HORA, sem a espera do hover.
   *
   * Quem chega por teclado não tem como "parar em cima" — a espera existe para
   * separar o ponteiro que atravessa do que para, e não tem equivalente no Tab.
   * As outras quatro stacks fazem o mesmo, e é o que o conteúdo compartilhado
   * documenta.
   *
   * `ponteiroPressionado` evita que o foco vindo de um clique abra o balão duas
   * vezes: nesse caminho quem manda é o hover, com a espera dele.
   */
  function aoFocar(): void {
    if (ponteiroPressionado) return;
    cancelarFechamento();
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    show();
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', aoSairDoPonteiro);
  /**
   * Solta o `pointerup` de `{ once: true }` que ainda não disparou.
   *
   * `once` remove sozinho AO DISPARAR — não ao sair da página. Quem removia o
   * gatilho com o ponteiro ainda pressionado (arrastar para fora e soltar lá
   * fora, tela trocada por um clique) deixava o ouvinte esperando um evento que
   * podia nunca chegar.
   */
  let soltarPonteiro: (() => void) | null = null;

  trigger.addEventListener('pointerdown', () => {
    ponteiroPressionado = true;
    const aoSoltar = () => {
      ponteiroPressionado = false;
      soltarPonteiro = null;
    };
    soltarPonteiro = () => {
      document.removeEventListener('pointerup', aoSoltar);
      soltarPonteiro = null;
    };
    document.addEventListener('pointerup', aoSoltar, { once: true });
  });
  trigger.addEventListener('focus', aoFocar);
  trigger.addEventListener('blur', hide);

  /*
   * `mousemove` e `keydown` no `document` vivem só enquanto o balão está na
   * tela, e `hide()` solta os dois junto com os temporizadores. Quem removia o
   * wrapper com o balão ABERTO não passava por `hide()`: sobravam o balão órfão
   * no `body` e dois ouvintes presos a um nó desanexado — e o `mousemove` é o
   * mais caro do conjunto, porque roda a cada pixel do ponteiro.
   */
  return tornarDestruivel(wrapper, wrapper, () => {
    hide();
    soltarPonteiro?.();
  });
}
