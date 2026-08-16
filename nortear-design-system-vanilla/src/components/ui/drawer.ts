// ─── Drawer — Vanilla factory standalone ─────────────────────────────────────
//
// Painel que entra por uma das bordas da tela, com alça visível na direção
// padrão (de baixo). Render via portal no `document.body`.
//
// ─── Por que deixou de ser um apelido de createSheet ─────────────────────────
//
// `createDrawer` era `createSheet({ side: 'bottom' })`, e o resultado era um
// Sheet com nome de Drawer: painel `.nds-sheet-content` com `data-side`, sem
// alça, sem os cantos arredondados do Drawer, sem corpo rolável próprio e sem
// `data-vaul-drawer-direction`. As stories compensavam escrevendo o atributo à
// mão no WRAPPER — onde nenhuma regra do CSS o lê — e chamando `createSheet`
// direto para as outras três direções.
//
// O CSS compartilhado publica `.nds-drawer-content[data-vaul-drawer-direction]`,
// `.nds-drawer-handle`, `.nds-drawer-header`, `.nds-drawer-body` e
// `.nds-drawer-footer`, e nada nesta stack os usava. Como esta é a stack de
// referência de markup, o contrato que ela não cumpre é contrato que não existe.
// Daí a factory própria: mesmo markup e mesmos `data-slot` das outras stacks.
//
// Do Sheet ficam só `.nds-sheet-overlay`, `.nds-sheet-title` e
// `.nds-sheet-description`, que o próprio CSS compartilhado manda reusar.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Borda por onde o painel entra. */
export type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

/** Caminho que fechou o painel — o vocabulário que o analytics do produto usa. */
export type DrawerCloseReason = 'escape' | 'overlay' | 'close-button';

export type DrawerOptions = {
  trigger: HTMLElement;
  /** Borda de entrada. Só em `bottom` a alça aparece. */
  direction?: DrawerDirection;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  /**
   * Quando `false`, Escape e clique no overlay não fecham — a saída passa a ser
   * só o que quem compõe colocar no rodapé.
   */
  dismissible?: boolean;
  /**
   * Quando `false`, o resto da página continua utilizável: sem `aria-modal`, sem
   * trava de rolagem. O foco continua preso enquanto o painel existe.
   */
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Chamado no fechamento com o caminho que o causou (espelha o Sheet). */
  onClose?: (reason: DrawerCloseReason) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _drawerCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.closest('[hidden]'));
}

// ─── createDrawer ─────────────────────────────────────────────────────────────

export function createDrawer(options: DrawerOptions): DestroyableElement {
  const {
    trigger,
    direction = 'bottom',
    title,
    description,
    content,
    footer,
    dismissible = true,
    modal = true,
    onOpenChange,
    onClose,
  } = options;

  const id = ++_drawerCounter;
  const titleId = `drawer-title-${id}`;
  const descId = `drawer-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  let previousBodyOverflow = '';

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'drawer';
  wrapper.appendChild(trigger);

  function isOpen(): boolean {
    return panelEl !== null;
  }

  function open(): void {
    // Reentrância: o gatilho pode ser clicado de novo (ou por código) enquanto o
    // painel já está montado. Sem esta guarda saem dois diálogos no body, e a
    // busca por papel passa a falhar com "found multiple elements" — foi o que
    // derrubou nove testes desta stack.
    if (isOpen()) return;

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-sheet-overlay';
    overlayEl.dataset.slot = 'drawer-overlay';
    overlayEl.dataset.state = 'open';
    overlayEl.addEventListener('click', () => {
      if (dismissible) closeWithReason('overlay');
    });

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-drawer-content', options.class);
    panelEl.dataset.slot = 'drawer-content';
    panelEl.dataset.state = 'open';
    // O atributo que TODA regra de posição, borda e canto do painel lê no CSS
    // compartilhado. Escrevê-lo no wrapper (como as stories faziam) não pinta
    // nada: o seletor é `.nds-drawer-content[data-vaul-drawer-direction=…]`.
    panelEl.dataset.vaulDrawerDirection = direction;
    panelEl.setAttribute('role', 'dialog');
    if (modal) panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);

    // Alça: pura afordância. O CSS só a mostra na direção de baixo, e ela não
    // recebe foco nem nome — não há gesto atrás dela, então anunciá-la só
    // somaria ruído ao leitor de tela.
    const handleEl = document.createElement('div');
    handleEl.className = 'nds-drawer-handle';
    handleEl.setAttribute('aria-hidden', 'true');
    panelEl.appendChild(handleEl);

    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'nds-drawer-header';
      headerEl.dataset.slot = 'drawer-header';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.id = titleId;
        // `.nds-sheet-title` e não `.nds-drawer-title`: o cabeçalho do CSS
        // compartilhado declara que o Drawer reusa título e descrição do Sheet,
        // e `.nds-drawer-title` não existe.
        titleEl.className = 'nds-sheet-title';
        titleEl.dataset.slot = 'drawer-title';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'nds-sheet-description';
        descEl.dataset.slot = 'drawer-description';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Corpo rolável. `tabindex="0"` é obrigatório: região que rola precisa ser
    // alcançável por teclado (WCAG 2.1.1 — regra `scrollable-region-focusable`
    // do axe).
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-drawer-body';
    bodyEl.dataset.slot = 'drawer-body';
    bodyEl.setAttribute('tabindex', '0');
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-drawer-footer';
      footerEl.dataset.slot = 'drawer-footer';
      footerEl.appendChild(footer);
      panelEl.appendChild(footerEl);
    }

    // Fechador explícito, o equivalente desta stack ao componente `DrawerClose`
    // das outras: qualquer elemento com `data-slot="drawer-close"` dentro do
    // painel fecha ao ser acionado. Sem isto, o "Cancelar" do rodapé é um botão
    // inerte — e era, porque a factory anterior só oferecia o X do Sheet.
    panelEl
      .querySelectorAll<HTMLElement>('[data-slot="drawer-close"]')
      .forEach((el) => el.addEventListener('click', () => closeWithReason('close-button')));

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    if (modal) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    getFocusable(panelEl)[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  /**
   * Tira o painel do documento e solta o que ele prendeu.
   *
   * Separado do fechamento por vontade de quem usa — mesma divisão do Sheet:
   * aqui não se devolve foco (o elemento anterior pode ter saído do DOM junto)
   * nem se anuncia motivo, porque não houve motivo nenhum: a gaveta não foi
   * fechada, ela deixou de existir.
   */
  function desmontarPainel(): void {
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    if (modal) document.body.style.overflow = previousBodyOverflow;
  }

  function closeWithReason(reason: DrawerCloseReason): void {
    if (!isOpen()) return;

    desmontarPainel();
    previousFocus?.focus();
    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      // Sem `dismissible`, Escape não fecha — mas também não é engolido em
      // silêncio noutro lugar: a saída explícita do rodapé continua no foco.
      if (!dismissible) return;
      e.preventDefault();
      closeWithReason('escape');
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  trigger.addEventListener('click', open);

  /*
   * Painel e overlay moram no `document.body`, e o `keydown` de Escape/Tab vive
   * no `document` enquanto a gaveta está aberta. Fechar solta os dois — mas só
   * quem fecha. Quem removia o wrapper com a gaveta ABERTA deixava para trás o
   * painel órfão, a trava de rolagem do modo modal e o ouvinte de teclado,
   * agora preso a um nó fora do documento. Não havia nada a chamar: esta era a
   * única fábrica de sobreposição portalada sem guarda de saída.
   */
  return tornarDestruivel(wrapper, wrapper, () => {
    const estavaAberta = isOpen();
    desmontarPainel();
    if (estavaAberta) onOpenChange?.(false);
  });
}
