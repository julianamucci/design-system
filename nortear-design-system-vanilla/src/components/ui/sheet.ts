// ─── Sheet — Vanilla factory standalone ─────────────────────────────────────
// Visual: classes .nds-sheet-* (standalone). Render via portal.
// Comportamento: overlay click + Escape fecham; focus-trap.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

// PATCH: api — motivo do fechamento exposto para analytics (ver PATCHES.md#vanilla-sheet-onclose-reason)
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button';

export type SheetOptions = {
  trigger: HTMLElement;
  side?: SheetSide;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  /**
   * Nome acessível do CORPO que rola. Sem padrão, de propósito.
   *
   * O corpo entra na ordem de tabulação porque rola (WCAG 2.1.1), e uma parada
   * de teclado precisa de papel e nome — a regra 6 da §8. O conteúdo é o que
   * quem monta pôs lá dentro, e só ali se sabe o que é; padrão genérico
   * ("Conteúdo") anunciaria sem informar.
   *
   * Não herdamos o título do painel: ele já foi anunciado na abertura, e
   * repeti-lo aqui informaria pouco pelo que custa. Sem nome NÃO emitimos papel
   * nenhum — `aria-label` em elemento sem papel é atributo proibido, e o axe
   * acusa `aria-prohibited-attr`.
   *
   * `group` e não `region`: o corpo já vive dentro de um diálogo nomeado, e um
   * marco aninhado num diálogo não acrescenta navegação, só entrada na lista.
   */
  bodyLabel?: string;

  /**
   * Nome acessível do botão de fechar.
   *
   * Era a string `Fechar` cravada aqui dentro, e essa era a única string de
   * interface desta família presa a um idioma: numa página em inglês ou
   * espanhol o leitor de tela ouvia português, sem que nada na chamada
   * pudesse mudar isso. Espelha `closeLabel` das outras stacks.
   */
  closeLabel?: string;
  onOpenChange?: (open: boolean) => void;
  /** Chamado no fechamento com o caminho que o causou (espelha o Dialog). */
  onClose?: (reason: SheetCloseReason) => void;
  class?: string;
};

// ─── Close icon helper ────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
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

let _sheetCounter = 0;

/**
 * Painéis abertos. O Sheet é modal: um de cada vez, e o mais novo manda.
 *
 * O painel vive em `document.body`, FORA do wrapper — quem tira o wrapper do
 * documento não leva o painel junto. Sobravam no `body` diálogos órfãos
 * empilhados, cada um com o seu listener de `keydown` ainda ativo; as asserções
 * tinham aprendido a pegar "o último `dialog` do body" para conviver com a
 * pilha, o que é o mesmo que documentar o defeito.
 *
 * Fechar os outros na ABERTURA é a guarda determinística: não depende de quando
 * a remoção do wrapper é notificada, e descreve o estado que o componente
 * promete — dois painéis modais ao mesmo tempo deixam um deles inalcançável.
 * O `MutationObserver` de cada instância cobre o caso oposto: o wrapper sai e
 * ninguém mais abre nada.
 */
const abertos = new Set<{ close: () => void }>();

function closeOutrosPanels(current: { close: () => void }): void {
  for (const registro of [...abertos]) {
    if (registro !== current) registro.close();
  }
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createSheet ──────────────────────────────────────────────────────────────

export function createSheet(options: SheetOptions): DestroyableElement {
  const {
    trigger,
    side = 'right',
    title,
    description,
    content,
    footer,
    bodyLabel,
    closeLabel = 'Fechar',
    onOpenChange,
    onClose,
  } = options;

  const sheetId = ++_sheetCounter;
  const titleId = `sheet-title-${sheetId}`;
  const descId = `sheet-desc-${sheetId}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  /**
   * Este painel está segurando a trava de rolagem?
   *
   * `aria-modal="true"` diz ao leitor de tela que o resto da página está fora de
   * alcance, e com a rolagem solta a promessa era falsa: o conteúdo atrás do
   * painel rolava. A contagem vive em `@/lib/scroll-lock`, compartilhada com o
   * Drawer — dois contadores separados voltariam a travar a página para sempre.
   */
  let scrollLocked = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'sheet';

  // O gatilho anuncia que existe um diálogo por trás dele. As libs headless das
  // outras stacks emitem os dois atributos; aqui não existia lib para emitir, e
  // o leitor de tela ouvia um botão comum — WAI-ARIA APG para diálogo modal.
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.dataset.slot = 'sheet-trigger';

  wrapper.appendChild(trigger);

  const registro = {
    close: () => {
      const estavaOpen = panelEl !== null;
      desmontarPanel();
      if (estavaOpen) onOpenChange?.(false);
    },
  };

  function open(): void {
    // Antes de pôr mais um painel na tela, tire da tela o que já estava lá.
    closeOutrosPanels(registro);

    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-sheet-overlay';
    overlayEl.dataset.slot = 'sheet-overlay';
    overlayEl.addEventListener('click', () => closeWithReason('overlay'));

    panelEl = document.createElement('div');
    panelEl.className = cn('nds-sheet-content', options.class);
    panelEl.dataset.side = side;
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'sheet-content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'nds-sheet-close';
    closeBtn.setAttribute('aria-label', closeLabel);
    closeBtn.appendChild(createCloseIcon());
    closeBtn.addEventListener('click', () => closeWithReason('close-button'));

    // Header
    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'nds-sheet-header';
      headerEl.dataset.slot = 'sheet-header';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.id = titleId;
        titleEl.className = 'nds-sheet-title';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'nds-sheet-description';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-sheet-body';
    bodyEl.dataset.slot = 'sheet-body';
    bodyEl.setAttribute('tabindex', '0');
    if (bodyLabel) {
      bodyEl.setAttribute('role', 'group');
      bodyEl.setAttribute('aria-label', bodyLabel);
    }
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-sheet-footer';
      footerEl.dataset.slot = 'sheet-footer';
      footerEl.appendChild(footer);
      panelEl.appendChild(footerEl);
    }

    panelEl.appendChild(closeBtn);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    lockBodyScroll();
    scrollLocked = true;

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
    abertos.add(registro);
    onOpenChange?.(true);
  }

  /**
   * Tira o painel do documento e solta o que ele prendeu.
   *
   * Separado do fechamento por vontade de quem usa: aqui não se devolve foco
   * (o elemento anterior pode ter saído do DOM junto) nem se anuncia motivo.
   */
  function desmontarPanel(): void {
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    // Só solta o que ESTE painel travou: `destroy()` chama `close()` mesmo sem
    // nada montado, e uma solta a mais liberaria a trava de um painel vizinho.
    if (scrollLocked) {
      unlockBodyScroll();
      scrollLocked = false;
    }
    abertos.delete(registro);
  }

  // PATCH: api — motivo do fechamento exposto para analytics (ver PATCHES.md#vanilla-sheet-onclose-reason)
  function closeWithReason(reason: SheetCloseReason): void {
    desmontarPanel();
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

  /*
   * O painel mora em `document.body`, não dentro do wrapper: quem tira o
   * wrapper do documento não leva o painel junto, e sobravam no `body` um
   * diálogo órfão e um listener de `keydown` — vivos até a página recarregar.
   *
   * Dava para ver na suíte: as stories abriam painéis que nunca saíam, e as
   * asserções tinham aprendido a pegar "o último `dialog` do body" para
   * conviver com a pilha. O `dialog.ts` já tinha esta guarda; o `sheet.ts`
   * ficou sem ela.
   */
  // A guarda de "ainda não entrou" mora na forma compartilhada: a factory
  // devolve o wrapper e quem chama o insere DEPOIS, e quem abre o painel no
  // mesmo tique da criação (as stories que nascem abertas fazem isso) dispara a
  // primeira mutação com o wrapper ainda solto.
  return tornarDestruivel(wrapper, wrapper, () => {
    registro.close();
  });
}
