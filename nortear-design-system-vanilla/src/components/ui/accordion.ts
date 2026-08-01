// ─── Accordion — Vanilla factory alinhada ao primitive React ────────
//
// Visual: classes .nds-accordion-* (standalone .nds-*).
// Comportamentos preservados:
//   - type="single" | "multiple" + collapsible
//   - defaultValue (string | string[])
//   - data-state="open|closed" no trigger e content (chevron gira via CSS)
//   - keyboard: ArrowUp/Down, Home, End
//   - disabled por item

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-accordion-icon" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

// ─── Types ───────────────────────────────────────────────────────────────────

export type AccordionOptions = {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  items: Array<{
    value: string;
    trigger: string;
    content: string;
    disabled?: boolean;
  }>;
  class?: string;
  onValueChange?: (value: string | string[]) => void;
};

// ─── createAccordion ─────────────────────────────────────────────────────────

/**
 * Espelha `--duration-moderate` (320ms, a duração do collapse em accordion.css)
 * com folga, para reesconder só DEPOIS da animação. Se este valor ficar abaixo
 * da duração, o `hidden` corta o fechamento no meio — e o painel some de um
 * salto em vez de assentar.
 */
const CLOSE_HIDE_DELAY = 380;

/**
 * Escopo de id por instância: ids derivados só de `item.value` colidem quando
 * a página monta 2+ accordions com os mesmos values (`item-1`…), e o
 * aria-labelledby dos painéis passa a resolver para o PRIMEIRO id do documento
 * — accessible name errada em todos os demais (axe: landmark-unique).
 */
let accordionInstanceCount = 0;

export function createAccordion(options: AccordionOptions): HTMLElement {
  const { type = 'single', collapsible = true, defaultValue, items, onValueChange } = options;

  /** Timers de reesconder pendentes, por elemento de conteúdo. */
  const closeTimers = new Map<HTMLElement, number>();

  const openValues: Set<string> =
    defaultValue !== undefined
      ? new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
      : new Set();

  const instanceId = ++accordionInstanceCount;

  const root = document.createElement('div');
  root.dataset.slot = 'accordion';
  // A configuração fica registrada no DOM, não só no closure. Sem isto nada
  // distingue um accordion single de um multiple depois de montado: CSS, teste,
  // devtools e o gerador de snippet do Storybook viam exatamente o mesmo HTML.
  root.dataset.type = type;
  root.dataset.collapsible = String(collapsible);
  root.className = 'nds-accordion';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  function isOpen(value: string): boolean {
    return openValues.has(value);
  }

  function toggle(value: string, triggerEl: HTMLButtonElement, contentEl: HTMLElement): void {
    const currentlyOpen = isOpen(value);

    if (type === 'single') {
      if (currentlyOpen) {
        if (collapsible) openValues.delete(value);
        else return;
      } else {
        openValues.clear();
        openValues.add(value);
      }
    } else {
      if (currentlyOpen) openValues.delete(value);
      else openValues.add(value);
    }

    updateItemState(triggerEl, contentEl, isOpen(value));

    if (type === 'single') {
      root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]').forEach(t => {
        if (t !== triggerEl) {
          const itemValue = t.dataset.value!;
          const c = root.querySelector<HTMLElement>(`[data-content-for="${itemValue}"]`);
          updateItemState(t, c!, isOpen(itemValue));
        }
      });
    }

    if (onValueChange) {
      const val = type === 'multiple' ? [...openValues] : [...openValues][0] ?? '';
      onValueChange(val);
    }
  }

  /**
   * `hidden` mantém o conteúdo fechado fora da árvore de acessibilidade, mas
   * `display: none` impede a animação. Ele sai junto com a mudança para
   * `open` (a animação de keyframes dispara quando o elemento passa a ser
   * renderizado) e só volta DEPOIS da animação de fechamento.
   */
  function updateItemState(
    triggerEl: HTMLButtonElement,
    contentEl: HTMLElement,
    open: boolean,
    immediate = false,
  ): void {
    triggerEl.setAttribute('aria-expanded', String(open));
    triggerEl.dataset.state = open ? 'open' : 'closed';

    const pending = closeTimers.get(contentEl);
    if (pending !== undefined) {
      clearTimeout(pending);
      closeTimers.delete(contentEl);
    }

    // Estado inicial (defaultValue): aplica direto e suprime a animação por um
    // frame, para o item já aberto não "expandir" durante o carregamento.
    if (immediate) {
      contentEl.hidden = !open;
      contentEl.dataset.state = open ? 'open' : 'closed';
      contentEl.style.animation = 'none';
      requestAnimationFrame(() => { contentEl.style.animation = ''; });
      return;
    }

    if (open) {
      contentEl.hidden = false;
      contentEl.dataset.state = 'open';
      return;
    }

    contentEl.dataset.state = 'closed';
    // Timer em vez de transitionend: com prefers-reduced-motion (ou display
    // none herdado) o evento pode não disparar e o conteúdo ficaria acessível.
    const timer = window.setTimeout(() => {
      if (contentEl.dataset.state === 'closed') contentEl.hidden = true;
      closeTimers.delete(contentEl);
    }, CLOSE_HIDE_DELAY);
    closeTimers.set(contentEl, timer);
  }

  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.dataset.slot = 'accordion-item';
    itemEl.className = 'nds-accordion-item';

    const headerEl = document.createElement('h3');
    headerEl.className = 'nds-accordion-header';

    const triggerId = `accordion-${instanceId}-trigger-${item.value}`;
    const contentId = `accordion-${instanceId}-content-${item.value}`;

    const triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.id = triggerId;
    triggerEl.dataset.slot = 'accordion-trigger';
    triggerEl.dataset.value = item.value;
    triggerEl.setAttribute('aria-controls', contentId);
    triggerEl.setAttribute('aria-expanded', 'false');
    triggerEl.className = 'nds-accordion-trigger';
    if (item.disabled) triggerEl.disabled = true;

    const triggerSpan = document.createElement('span');
    triggerSpan.textContent = item.trigger;
    triggerEl.appendChild(triggerSpan);
    triggerEl.insertAdjacentHTML('beforeend', CHEVRON_SVG);
    headerEl.appendChild(triggerEl);

    const contentEl = document.createElement('div');
    contentEl.id = contentId;
    contentEl.dataset.slot = 'accordion-content';
    contentEl.setAttribute('data-content-for', item.value);
    contentEl.setAttribute('role', 'region');
    contentEl.setAttribute('aria-labelledby', triggerId);
    contentEl.className = 'nds-accordion-content';
    contentEl.hidden = true;
    contentEl.dataset.state = 'closed';

    const innerEl = document.createElement('div');
    innerEl.className = 'nds-accordion-content-body';
    innerEl.textContent = item.content;
    contentEl.appendChild(innerEl);

    if (isOpen(item.value)) {
      updateItemState(triggerEl, contentEl, true, true);
    }

    if (!item.disabled) {
      triggerEl.addEventListener('click', () => toggle(item.value, triggerEl, contentEl));
    }

    triggerEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const all = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])'));
        const currentIdx = all.indexOf(triggerEl);
        const nextIdx = e.key === 'ArrowDown'
          ? (currentIdx + 1) % all.length
          : (currentIdx - 1 + all.length) % all.length;
        all[nextIdx]?.focus();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])')[0]?.focus();
      }
      if (e.key === 'End') {
        e.preventDefault();
        const all = root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not([disabled])');
        all[all.length - 1]?.focus();
      }
    });

    itemEl.append(headerEl, contentEl);
    root.appendChild(itemEl);
  });

  return root;
}
