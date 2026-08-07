// ─── Alert Dialog — Vanilla factory (portal manual) ──────────────────────────
//
// Visual: classes .nds-alert-dialog-* (standalone .nds-*).
// Comportamentos preservados:
//   - Sem overlay-click-to-close (canônico para alert dialog); Escape fecha.
//   - Focus trap (Tab/Shift+Tab) entre cancel e action.
//   - Restaura foco no elemento anterior ao fechar.
//   - MutationObserver fecha o dialog quando o wrapper é removido do DOM
//     (Storybook remount entre stories).

/** `--duration-base` (200ms, a saída em alert-dialog.css) + folga. */
const EXIT_FALLBACK_MS = 300;

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertDialogOptions = {
  trigger: HTMLElement;
  title: string;
  description?: string;
  /**
   * Bloco de ícone no topo do header (`.nds-alert-dialog-media`). Opcional —
   * acompanha o alinhamento do header: centralizado abaixo de 40rem, à
   * esquerda acima. Use `createAlertDialogMedia()` para montá-lo.
   */
  media?: HTMLElement;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  /**
   * Abre o diálogo assim que o wrapper entra no DOM, sem clique no trigger.
   * Equivale ao `defaultOpen` das outras stacks — é o estado inicial em modo
   * não controlado, usado por capturas visuais e pelas composições.
   */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export interface AlertDialogMediaOptions {
  className?: string;
}

/**
 * Container do ícone destacado do header. Recebe o svg por appendChild — o CSS
 * dimensiona qualquer `svg` filho em 24px (`--spacing-6`).
 */
export function createAlertDialogMedia(options: AlertDialogMediaOptions = {}): HTMLElement {
  const { className } = options;
  const el = document.createElement('div');
  el.dataset.slot = 'alert-dialog-media';
  el.className = 'nds-alert-dialog-media';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  return el;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _alertDialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createAlertDialog ───────────────────────────────────────────────────────

export function createAlertDialog(options: AlertDialogOptions): HTMLElement {
  const { trigger, title, description, media, cancelButton, actionButton, onOpenChange } = options;

  const id = ++_alertDialogCounter;
  const titleId = `alert-dialog-title-${id}`;
  const descId = `alert-dialog-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'alert-dialog';
  // Identifica a instância: o painel é portalado para o body no open(), então
  // sem isto não há como ligar um trigger ao painel que ele comanda. Efeito
  // colateral útil: o renderer html do Storybook monta a caixa de código a
  // partir do outerHTML deste wrapper e só reemite quando ele muda — e o
  // wrapper só contém o trigger, então title/description/cancelLabel/actionLabel
  // não o alteravam e o snippet congelava nesses controls.
  wrapper.dataset.dialogId = String(id);
  // O trigger abre um diálogo: anuncia isso antes do clique. O aria-expanded
  // acompanha a abertura, como base-ui, reka-ui e bits-ui fazem sozinhas.
  trigger.dataset.slot = 'alert-dialog-trigger';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  cancelButton.dataset.slot = 'alert-dialog-cancel';
  actionButton.dataset.slot = 'alert-dialog-action';
  wrapper.appendChild(trigger);

  function open(): void {
    // Já aberto: um segundo open() (clique no trigger com o diálogo em cima,
    // possível quando ele nasce aberto) montaria um painel novo e perderia a
    // referência do anterior, que ficaria órfão no body.
    if (panelEl) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-alert-dialog-overlay';
    overlayEl.dataset.slot = 'alert-dialog-overlay';
    // data-state: é o gancho das animações em alert-dialog.css. As libs
    // headless das outras 3 stacks emitem esse atributo sozinhas; aqui a
    // factory precisa emitir. Sem ele o overlay/painel aparecia e sumia seco.
    overlayEl.dataset.state = 'open';

    panelEl = document.createElement('div');
    panelEl.className = 'nds-alert-dialog-content';
    panelEl.dataset.state = 'open';
    if (options.class) panelEl.classList.add(...options.class.split(' ').filter(Boolean));
    panelEl.setAttribute('role', 'alertdialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'alert-dialog-content';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'nds-alert-dialog-header';
    headerEl.dataset.slot = 'alert-dialog-header';

    // A mídia vem ANTES do título: o seletor `:has(.nds-alert-dialog-media)`
    // centraliza o header, e a ordem de leitura é ícone → título → descrição.
    if (media) headerEl.appendChild(media);

    const titleEl = document.createElement('h2');
    titleEl.id = titleId;
    titleEl.dataset.slot = 'alert-dialog-title';
    titleEl.className = 'nds-alert-dialog-title';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.dataset.slot = 'alert-dialog-description';
      descEl.className = 'nds-alert-dialog-description';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Footer
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-alert-dialog-footer';
    footerEl.dataset.slot = 'alert-dialog-footer';
    footerEl.appendChild(cancelButton);
    footerEl.appendChild(actionButton);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(footerEl);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    cancelButton.focus();

    trigger.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  function close(): void {
    const saindo = [overlayEl, panelEl].filter((el): el is HTMLElement => el !== null);
    // Solta as referências já: um segundo close() (ESC durante a saída, por
    // exemplo) não deve reagendar a remoção nem chamar onOpenChange de novo.
    overlayEl = null;
    panelEl = null;

    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', handleKeydown);
    previousFocus?.focus();
    onOpenChange?.(false);

    /* v8 ignore next -- guarda de dupla finalização: close() já zerou as
       referências, então o segundo close (ESC durante a saída) não tem o que
       remover. Sem story: exercitar exige encadear dois fechamentos no mesmo
       quadro. */
    if (saindo.length === 0) return;
    saindo.forEach((el) => { el.dataset.state = 'closed'; });

    // Sem animação de saída (prefers-reduced-motion, ou ambiente que não
    // anima), remove na hora: esperar um timeout que nunca vai ser encurtado
    // por animationend só atrasaria o fechamento para quem pediu menos
    // movimento. getComputedStyle força o recálculo antes de perguntar.
    void getComputedStyle(saindo[0]).animationName;
    /* v8 ignore next 4 -- caminho sem animação (prefers-reduced-motion ou
       ambiente que não anima). O browser dos testes roda COM animação, por
       decisão do projeto, então este ramo é inalcançável na suíte. */
    if (saindo.every((el) => el.getAnimations().length === 0)) {
      saindo.forEach((el) => el.remove());
      return;
    }

    // Remove só depois da animação de saída. NUNCA depender só do
    // animationend: com prefers-reduced-motion a animação não existe e o
    // evento nunca dispara; e se o nó for escondido (display/visibility, aba
    // em background) antes de completar, ela também não. O timeout garante a
    // remoção.
    let removido = false;
    const remover = (event?: Event) => {
      /* v8 ignore next 2 -- filtros de reentrância do animationend: evento de
         um filho animado e segunda chamada depois do timeout. Nenhum dos dois
         acontece com overlay e painel animando juntos, que é o caso da suíte. */
      if (event && !saindo.includes(event.target as HTMLElement)) return;
      /* v8 ignore next */
      if (removido) return;
      removido = true;
      window.clearTimeout(timer);
      saindo.forEach((el) => {
        el.removeEventListener('animationend', remover);
        el.remove();
      });
    };
    saindo.forEach((el) => el.addEventListener('animationend', remover));
    const timer = window.setTimeout(remover, EXIT_FALLBACK_MS);
  }

  function handleKeydown(e: KeyboardEvent): void {
    // Escape fecha sem executar a ação. É o que a docs page documenta em
    // accessibility.keyboard.escape, o que as outras três stacks fazem (as libs
    // implementam) e o que o padrão alertdialog do WAI-ARIA APG especifica.
    // Havia aqui um comentário chamando a ausência de "decisão deliberada" —
    // era divergência silenciosa: nada além deste arquivo a sustentava.
    if (e.key === 'Escape' && panelEl) {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      /* v8 ignore next -- painel sem nada focável: o contrato exige Cancel e
         Action, então só um consumidor fora do padrão chegaria aqui. */
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }

  cancelButton.addEventListener('click', close);
  actionButton.addEventListener('click', close);

  trigger.addEventListener('click', open);

  // Cleanup ao remover o wrapper (Storybook remount).
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected) {
        if (panelEl) close();
        observer.disconnect();
      }
    });
    const startObserve = () => {
      observer.observe(document.body, { childList: true, subtree: true });
    };
    /* v8 ignore next 2 -- no browser o body já existe quando a factory roda; o
       fallback cobre montagem em documento ainda sem body. */
    if (document.body) startObserve();
    else queueMicrotask(startObserve);
  }

  // O wrapper só entra na página depois que a factory retorna: o microtask
  // espera a montagem para o painel portalado e o foco encontrarem a árvore
  // pronta. Sem o isConnected, um wrapper descartado antes de montar abriria um
  // painel órfão no body.
  if (options.defaultOpen) {
    queueMicrotask(() => {
      if (wrapper.isConnected) open();
    });
  }

  return wrapper;
}
