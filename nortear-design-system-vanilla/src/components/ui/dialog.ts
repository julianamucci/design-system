// ─── Dialog — Vanilla factory standalone ────────────────────────────────────
// Visual: classes .nds-dialog-* (standalone). Render via portal.
// Comportamento: overlay click + Escape fecham; focus-trap; restaura foco.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type DialogCloseReason = 'escape' | 'overlay' | 'close-button' | 'action';

export type DialogOptions = {
  trigger: HTMLElement;
  title: string;
  description?: string;
  content: HTMLElement;
  /**
   * Ações do rodapé.
   *
   * Aceita uma lista porque `.nds-dialog-footer` é quem faz o arranjo — empilha
   * ao contrário no estreito, alinha à direita no largo — e para isso os botões
   * precisam ser filhos DIRETOS dele. Envolvê-los num `<div>` extra deixava o
   * rodapé com um único filho e o arranjo não acontecia; era o que as stories
   * disfarçavam com classes `flex` do Tailwind, que não existem mais.
   */
  footer?: HTMLElement | HTMLElement[];
  /**
   * Deixa o cabeçalho (título + descrição) só para leitor de tela.
   *
   * O diálogo PRECISA de nome — `aria-labelledby` aponta para o título, e um
   * diálogo anônimo o axe reprova. Há arranjos em que desenhá-lo seria
   * redundância pura: na paleta de comandos, "Command Palette" escrito em cima
   * do campo de busca repete o que a busca já diz para quem enxerga. Aqui o
   * cabeçalho recebe `.nds-sr-only` — sai da tela e FICA na árvore de
   * acessibilidade, ao contrário de `display: none`, que apagaria o nome.
   *
   * Aditivo: sem a opção, nada muda para quem já usa a factory.
   */
  headerHidden?: boolean;
  showCloseButton?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: (reason: DialogCloseReason) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _dialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// PATCH: bugfix — antes o close button era construído via assignment de string
// SVG (atribuição direta a innerHTML), o que viola a regra de "nenhum innerHTML
// com SVG hardcoded" do auditor de segurança. Construir nodes SVG via
// createElementNS deixa o lint feliz e elimina qualquer rota futura de injeção
// se o ícone passar a vir de translation.
function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const p1 = document.createElementNS(SVG_NS, 'path');
  p1.setAttribute('d', 'M18 6 6 18');
  const p2 = document.createElementNS(SVG_NS, 'path');
  p2.setAttribute('d', 'm6 6 12 12');
  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}

// ─── createDialog ─────────────────────────────────────────────────────────────

export function createDialog(options: DialogOptions): DestroyableElement {
  const { trigger, title, description, content, footer, onOpenChange, onClose } = options;
  const showCloseButton = options.showCloseButton !== false;

  const id = ++_dialogCounter;
  const titleId = `dialog-title-${id}`;
  const descId = `dialog-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dialog';
  wrapper.appendChild(trigger);

  function open(): void {
    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-dialog-overlay';
    overlayEl.dataset.slot = 'dialog-overlay';
    overlayEl.dataset.state = 'open';
    overlayEl.addEventListener('click', () => closeWithReason('overlay'));

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-dialog-content', options.class);
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'dialog-content';
    panelEl.dataset.state = 'open';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = options.headerHidden
      ? 'nds-dialog-header nds-sr-only'
      : 'nds-dialog-header';
    headerEl.dataset.slot = 'dialog-header';

    const titleEl = document.createElement('h2');
    titleEl.id = titleId;
    titleEl.className = 'nds-dialog-title';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.className = 'nds-dialog-description';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-dialog-body';
    bodyEl.dataset.slot = 'dialog-body';
    bodyEl.appendChild(content);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-dialog-footer';
      footerEl.dataset.slot = 'dialog-footer';
      for (const acao of Array.isArray(footer) ? footer : [footer]) {
        footerEl.appendChild(acao);
      }
      panelEl.appendChild(footerEl);
    }

    if (showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'nds-dialog-close';
      closeBtn.dataset.slot = 'dialog-close';
      closeBtn.setAttribute('aria-label', 'Fechar');
      closeBtn.appendChild(createCloseIcon());
      const srOnly = document.createElement('span');
      srOnly.className = 'nds-sr-only';
      srOnly.textContent = 'Fechar';
      closeBtn.appendChild(srOnly);
      closeBtn.addEventListener('click', () => closeWithReason('close-button'));
      panelEl.appendChild(closeBtn);
    }

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  function closeWithReason(reason: DialogCloseReason): void {
    if (overlayEl) overlayEl.dataset.state = 'closed';
    if (panelEl) panelEl.dataset.state = 'closed';
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    previousFocus?.focus();
    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeWithReason('escape');
      return;
    }
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
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

  trigger.addEventListener('click', open);

  // Limpeza quando o wrapper sai do DOM (troca de story, desmonte de página).
  // Forma compartilhada: `destroy()` público, idempotente e disparado sozinho.
  // O observador anterior se desligava na primeira mutação vista com o wrapper
  // ainda solto, e a guarda deixava de existir antes de servir para algo.
  return tornarDestruivel(wrapper, wrapper, () => {
    if (panelEl) closeWithReason('action');
  });
}
