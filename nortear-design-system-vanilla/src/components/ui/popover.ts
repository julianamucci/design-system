// ─── Popover — Vanilla factory standalone ───────────────────────────────────
// Visual: classe .nds-popover-content (standalone).
// Render via portal (body), posicionado pelo JS. Click-outside + Escape fecham.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;
  align?: PopoverAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _popoverCounter = 0;

/**
 * O que conta como "primeiro elemento focável" dentro do painel.
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => !el.closest('[hidden]'));
}

function positionFloating(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: PopoverSide,
  align: PopoverAlign
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 8;

  // Temporarily make visible to measure
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
  } else if (side === 'right') {
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
}

// ─── createPopover ────────────────────────────────────────────────────────────

export function createPopover(options: PopoverOptions): DestroyableElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    onOpenChange,
  } = options;

  const id = ++_popoverCounter;
  const contentId = `popover-content-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerCliqueFora: ReturnType<typeof setTimeout> | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'popover';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  // O gatilho passa a declarar o próprio papel no markup, como nas demais
  // stacks — a peça que compõe vence o `data-slot` de quem foi composto.
  trigger.dataset.slot = 'popover-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  // `data-state` é o contrato de estado que a tabela de Estados do conteúdo
  // compartilhado descreve e que as demais stacks emitem pela lib headless.
  // Aqui não há lib: sem esta linha o atributo documentado não existiria em
  // lugar nenhum do stack de referência.
  trigger.dataset.state = 'closed';
  // aria-controls is set only when the popover is open (otherwise it
  // references a non-existent element, which fails axe aria-valid-attr-value).

  function open(): void {
    panelEl = document.createElement('div');
    panelEl.id = contentId;
    panelEl.className = cn('nds-popover-content', options.class);
    panelEl.dataset.slot = 'popover-content';
    panelEl.dataset.state = 'open';
    panelEl.setAttribute('role', 'dialog');
    // O painel recebe foco quando não há nada focável dentro: é o que faz o
    // leitor de tela anunciar o diálogo mesmo num painel só de texto.
    panelEl.tabIndex = -1;
    panelEl.style.position = 'absolute';

    if (typeof content === 'string') {
      panelEl.textContent = content;
    } else {
      panelEl.appendChild(content);
    }

    // Accessible name (axe rule: aria-dialog-name). Prefer an existing heading
    // inside the content via aria-labelledby; otherwise fall back to a string
    // aria-label derived from the trigger's accessible text.
    const heading = panelEl.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (heading) {
      if (!heading.id) heading.id = `${contentId}-title`;
      panelEl.setAttribute('aria-labelledby', heading.id);
    } else {
      const triggerName =
        trigger.getAttribute('aria-label') ||
        trigger.textContent?.trim() ||
        'Popover';
      panelEl.setAttribute('aria-label', triggerName);
    }

    document.body.appendChild(panelEl);
    positionFloating(trigger, panelEl, side, align);

    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', contentId);
    trigger.dataset.state = 'open';
    isOpen = true;

    // O foco entra no painel — é o que separa o popover do tooltip. O conteúdo
    // é interativo (formulário, filtro, botões), e sem isto quem navega por
    // teclado teria de atravessar o resto da página para alcançá-lo. É a
    // promessa que o conteúdo compartilhado faz em três seções: acessibilidade,
    // estados e critérios de teste.
    (getFocusable(panelEl)[0] ?? panelEl).focus();

    document.addEventListener('keydown', handleKeydown);
    // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
    // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
    // registrado DEPOIS da limpeza e ficava para sempre.
    timerCliqueFora = setTimeout(() => {
      timerCliqueFora = null;
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    onOpenChange?.(true);
  }

  function close(): void {
    // Se o foco estava dentro do painel — ou já se perdeu para o <body> —, ele
    // volta ao gatilho. Fechar removendo o elemento focado sem devolver o foco
    // manda quem navega por teclado de volta ao início da página (WCAG 2.4.3).
    // Quando a dispensa levou o foco a OUTRO controle da página, o foco fica
    // onde a pessoa o pôs: puxá-lo de volta seria roubá-lo.
    const focoEstavaDentro =
      !!panelEl &&
      (panelEl.contains(document.activeElement) || document.activeElement === document.body);

    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-controls');
    trigger.dataset.state = 'closed';
    isOpen = false;

    if (timerCliqueFora !== null) {
      clearTimeout(timerCliqueFora);
      timerCliqueFora = null;
    }
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);

    if (focoEstavaDentro) trigger.focus();

    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      // `close()` já devolve o foco ao gatilho quando ele estava dentro do
      // painel, que é sempre o caso vindo do Escape.
      close();
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      close();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) close(); else open();
  });

  // O painel mora em portal no body: quando o wrapper sai do DOM — troca de
  // story no Storybook, desmonte de página — nada removeria o painel, e ele
  // sobreviveria por cima do conteúdo seguinte junto com o `keydown` e o
  // `click` de fora. Mesma forma do dialog e do sheet.
  return tornarDestruivel(wrapper, wrapper, () => {
    if (isOpen) close();
  });
}
