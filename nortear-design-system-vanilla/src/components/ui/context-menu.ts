// ─── ContextMenu — Vanilla factory standalone ───────────────────────────────
// Visual: reusa classes .nds-dropdown-menu-* (idêntico ao DropdownMenu).
// Trigger via evento contextmenu (botão direito) com coordenadas livres.
//
// Esta factory é a REFERÊNCIA cross-stack de markup: o que ela emite é o que as
// outras quatro precisam emitir. Por isso ela cobre a composição inteira que o
// conteúdo compartilhado documenta — item, atalho, recuo, variante destrutiva,
// marcação, escolha única e submenu — e não só o item simples. Antes desta
// passada as stories desenhavam essas peças à mão, com classes de uma lib que
// saiu do projeto: renderizavam sem estilo nenhum e não provavam nada.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type ContextMenuItemDef = {
  /** `item` é o padrão. `submenu` exige `items`; `radio` exige `value`. */
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu';
  value?: string;
  label?: string;
  disabled?: boolean;
  /** Recuo para alinhar com itens que têm indicador à esquerda. */
  inset?: boolean;
  /** `destructive` pinta o item com a cor de alerta. Só vale em `item`. */
  variant?: 'default' | 'destructive';
  /** Atalho exibido à direita do rótulo. Anunciado junto do item, não escondido. */
  shortcut?: string;
  /** Estado inicial de um item `checkbox`. */
  checked?: boolean;
  /**
   * Só em `checkbox`: estado misto ("alguns dos filhos selecionados"). Vale
   * sobre `checked` enquanto durar, e o primeiro clique o resolve para marcado,
   * como faz a propriedade `indeterminate` do input nativo. Mesma semântica da
   * caixa de seleção avulsa desta stack.
   */
  indeterminate?: boolean;
  /** Itens do submenu, quando `type: 'submenu'`. */
  items?: ContextMenuItemDef[];
  onClick?: () => void;
  /** Disparado por `checkbox` a cada alternância. */
  onCheckedChange?: (checked: boolean) => void;
  /** Disparado quando o estado misto de um `checkbox` é resolvido por interação. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
};

export type ContextMenuOptions = {
  trigger: HTMLElement;
  items: ContextMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  /** Grupo de escolha única: o valor corrente entre os itens `radio`. */
  radioValue?: string;
  onRadioChange?: (value: string) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _contextMenuCounter = 0;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Indicador de marcação (check). Construído por DOM — nada de innerHTML. */
function createCheckIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  svg.appendChild(path);
  return svg;
}

/**
 * Traço do estado misto — o MESMO desenho da caixa de seleção avulsa desta stack
 * (`checkbox.ts`): um segmento horizontal de (5,12) a (19,12). Tique quer dizer
 * "marcado", e misto não é isso; repetir o tique nos dois estados apagaria a
 * diferença justamente para quem depende do símbolo.
 */
function createMinusIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', '5');
  line.setAttribute('y1', '12');
  line.setAttribute('x2', '19');
  line.setAttribute('y2', '12');
  svg.appendChild(line);
  return svg;
}

/** Seta do sub-gatilho. */
function createChevronIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('nds-dropdown-menu-sub-trigger-chevron');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.appendChild(path);
  return svg;
}

/**
 * Rótulo + atalho dentro de um item.
 *
 * O atalho NÃO leva `aria-hidden`. "Excluir, Del" é o nome útil do item; com o
 * atalho escondido a pessoa ouve só "Excluir" e o atalho não ensina nada. As
 * outras quatro stacks também o deixam legível — conferido em sonda.
 */
function fillItemContent(li: HTMLElement, item: ContextMenuItemDef): void {
  const label = document.createElement('span');
  label.textContent = item.label ?? '';
  li.appendChild(label);

  if (item.shortcut) {
    const atalho = document.createElement('span');
    atalho.dataset.slot = 'context-menu-shortcut';
    atalho.className = 'nds-dropdown-menu-shortcut';
    atalho.textContent = item.shortcut;
    li.appendChild(atalho);
  }
}

// ─── createContextMenu ────────────────────────────────────────────────────────

export function createContextMenu(options: ContextMenuOptions): DestroyableElement {
  const { trigger, items, onOpenChange } = options;

  const id = ++_contextMenuCounter;
  const menuId = `context-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let subPanelEl: HTMLElement | null = null;
  let subTriggerEl: HTMLElement | null = null;
  let isOpen = false;
  let radioValue = options.radioValue;
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;

  /** Definição por sub-gatilho — procurar pelo texto do rótulo quebra na tradução. */
  const subTriggerDef = new WeakMap<HTMLElement, ContextMenuItemDef>();

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'context-menu';
  wrapper.style.display = 'contents';

  trigger.dataset.slot = 'context-menu-trigger';
  trigger.classList.add('nds-context-menu-trigger');
  // A tecla Menu (e Shift+F10) dispara `contextmenu` no elemento FOCADO: sem
  // parada de tabulação, quem não usa mouse nunca abre este menu. É também para
  // onde o foco volta no fechamento — numa div sem tabindex o `focus()` é no-op
  // e o foco cai no `<body>`.
  if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');
  wrapper.appendChild(trigger);

  function buildItem(item: ContextMenuItemDef, menu: HTMLElement): void {
    const type = item.type ?? 'item';

    if (type === 'separator') {
      const sep = document.createElement('li');
      sep.setAttribute('role', 'separator');
      sep.dataset.slot = 'context-menu-separator';
      sep.className = 'nds-dropdown-menu-separator';
      menu.appendChild(sep);
      return;
    }

    if (type === 'label') {
      const lbl = document.createElement('li');
      lbl.setAttribute('role', 'presentation');
      lbl.dataset.slot = 'context-menu-label';
      if (item.inset) lbl.dataset.inset = 'true';
      lbl.className = 'nds-dropdown-menu-label';
      lbl.textContent = item.label ?? '';
      menu.appendChild(lbl);
      return;
    }

    if (type === 'checkbox' || type === 'radio') {
      let marcado =
        type === 'checkbox' ? item.checked === true : radioValue === item.value;
      // O misto vale SOBRE o marcado enquanto durar — é ele quem manda no que se
      // anuncia e no que se desenha. Só o item de marcação o tem.
      let misto = type === 'checkbox' && item.indeterminate === true;

      const li = document.createElement('li');
      li.setAttribute('role', type === 'checkbox' ? 'menuitemcheckbox' : 'menuitemradio');
      // "mixed" é o que distingue "alguns selecionados" de "todos selecionados";
      // um booleano aqui mentiria para quem lê a tela.
      li.setAttribute('aria-checked', misto ? 'mixed' : String(marcado));
      li.setAttribute('tabindex', '-1');
      li.dataset.slot = type === 'checkbox' ? 'context-menu-checkbox-item' : 'context-menu-radio-item';
      li.className =
        type === 'checkbox' ? 'nds-dropdown-menu-checkbox-item' : 'nds-dropdown-menu-radio-item';
      if (item.value) li.dataset.value = item.value;
      if (item.disabled) {
        li.setAttribute('aria-disabled', 'true');
        li.dataset.disabled = '';
      }

      const indicador = document.createElement('span');
      // `data-slot` por TIPO de item, como nas outras quatro stacks
      // (`context-menu-checkbox-item-indicator` / `…-radio-item-indicator`).
      indicador.dataset.slot =
        type === 'checkbox' ? 'context-menu-checkbox-item-indicator' : 'context-menu-radio-item-indicator';
      indicador.className = 'nds-dropdown-menu-item-indicator';
      if (misto) indicador.appendChild(createMinusIcon());
      else if (marcado) indicador.appendChild(createCheckIcon());
      li.appendChild(indicador);

      fillItemContent(li, item);

      if (!item.disabled) {
        const alternar = () => {
          if (type === 'checkbox') {
            if (misto) {
              // O primeiro clique RESOLVE o misto para marcado, como faz a
              // propriedade `indeterminate` do input nativo — e não devolve o
              // misto a ninguém, porque "alguns" é conclusão de quem consome.
              misto = false;
              marcado = true;
              li.setAttribute('aria-checked', 'true');
              indicador.replaceChildren(createCheckIcon());
              item.onIndeterminateChange?.(false);
              item.onCheckedChange?.(true);
              item.onClick?.();
              return;
            }
            marcado = !marcado;
            li.setAttribute('aria-checked', String(marcado));
            indicador.replaceChildren();
            if (marcado) indicador.appendChild(createCheckIcon());
            item.onCheckedChange?.(marcado);
          } else if (item.value) {
            radioValue = item.value;
            sincronizarRadios(li.closest('[data-slot="context-menu-content"]') as HTMLElement);
            options.onRadioChange?.(item.value);
          }
          item.onClick?.();
          // Marcar uma opção não fecha o menu: quem marca uma costuma querer
          // marcar a próxima. Só o item de AÇÃO fecha.
        };
        li.addEventListener('click', alternar);
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            alternar();
          }
        });
      }

      menu.appendChild(li);
      return;
    }

    if (type === 'submenu') {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('aria-haspopup', 'menu');
      li.setAttribute('aria-expanded', 'false');
      li.setAttribute('tabindex', '-1');
      li.dataset.slot = 'context-menu-sub-trigger';
      li.className = 'nds-dropdown-menu-sub-trigger';
      if (item.inset) li.dataset.inset = 'true';
      fillItemContent(li, item);
      li.appendChild(createChevronIcon());
      subTriggerDef.set(li, item);

      li.addEventListener('mouseenter', () => openSubmenu(li, item));
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        openSubmenu(li, item);
      });

      menu.appendChild(li);
      return;
    }

    const li = document.createElement('li');
    li.setAttribute('role', 'menuitem');
    li.setAttribute('tabindex', '-1');
    li.dataset.slot = 'context-menu-item';
    li.dataset.variant = item.variant ?? 'default';
    if (item.inset) li.dataset.inset = 'true';
    li.className = 'nds-dropdown-menu-item';
    if (item.value) li.dataset.value = item.value;
    if (item.disabled) {
      li.setAttribute('aria-disabled', 'true');
      li.dataset.disabled = '';
    }

    fillItemContent(li, item);

    if (!item.disabled) {
      li.addEventListener('click', () => {
        item.onClick?.();
        close();
      });
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.onClick?.();
          close();
        }
      });
    }

    menu.appendChild(li);
  }

  /** Reflete a escolha única em todos os irmãos do grupo. */
  function sincronizarRadios(menu: HTMLElement | null): void {
    if (!menu) return;
    for (const li of menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]')) {
      const marcado = li.dataset.value === radioValue;
      li.setAttribute('aria-checked', String(marcado));
      const indicador = li.querySelector<HTMLElement>('.nds-dropdown-menu-item-indicator');
      indicador?.replaceChildren();
      if (marcado && indicador) indicador.appendChild(createCheckIcon());
    }
  }

  function buildMenu(defs: ContextMenuItemDef[], slot: string): HTMLElement {
    const menu = document.createElement('ul');
    if (slot === 'context-menu-content') menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className = cn('nds-dropdown-menu-content', slot === 'context-menu-content' ? options.class : undefined);
    menu.dataset.slot = slot;
    menu.dataset.state = 'open';
    defs.forEach((def) => buildItem(def, menu));
    return menu;
  }

  function openSubmenu(gatilho: HTMLElement, def: ContextMenuItemDef): void {
    if (subTriggerEl === gatilho && subPanelEl) return;
    closeSubmenu();

    subPanelEl = buildMenu(def.items ?? [], 'context-menu-sub-content');
    subPanelEl.style.position = 'absolute';
    document.body.appendChild(subPanelEl);

    const caixa = gatilho.getBoundingClientRect();
    subPanelEl.style.top = `${caixa.top + window.scrollY}px`;
    subPanelEl.style.left = `${caixa.right + window.scrollX}px`;

    gatilho.setAttribute('aria-expanded', 'true');
    subTriggerEl = gatilho;
  }

  function closeSubmenu(): void {
    subPanelEl?.remove();
    subPanelEl = null;
    subTriggerEl?.setAttribute('aria-expanded', 'false');
    subTriggerEl = null;
  }

  /**
   * Itens que o teclado percorre.
   *
   * O item desabilitado FICA na roda: escondê-lo da navegação esconde da pessoa
   * que a opção existe e está indisponível — é o que a WAI-ARIA APG recomenda, e
   * é o que as outras quatro stacks fazem. O que ele não faz é ativar.
   */
  function getMenuItems(menu: HTMLElement): HTMLElement[] {
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
      ),
    );
  }

  function open(x: number, y: number): void {
    panelEl = buildMenu(items, 'context-menu-content');
    panelEl.style.position = 'absolute';
    panelEl.style.top = `${y + window.scrollY}px`;
    panelEl.style.left = `${x + window.scrollX}px`;
    document.body.appendChild(panelEl);
    sincronizarRadios(panelEl);

    isOpen = true;

    const menuItems = getMenuItems(panelEl);
    menuItems[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
    // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
    // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
    // registrado DEPOIS da limpeza e ficava para sempre.
    timerClickOutside = setTimeout(() => {
      timerClickOutside = null;
      document.addEventListener('click', handleOutsideClick);
    }, 0);

    onOpenChange?.(true);
  }

  /**
   * `devolverFocus` distingue quem fechou. Escape e escolha de item devolvem o
   * foco à área — sem isso ele cai no `<body>` e quem navega por teclado perde o
   * lugar (`testes.functional.item2`). Clique fora e Tab NÃO devolvem: ali a
   * pessoa já está indo para outro lugar, e roubar o foco de volta desfaria o
   * gesto.
   */
  function close(devolverFocus = true): void {
    closeSubmenu();
    panelEl?.remove();
    panelEl = null;
    isOpen = false;

    if (timerClickOutside !== null) {
      clearTimeout(timerClickOutside);
      timerClickOutside = null;
    }
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);

    if (devolverFocus && trigger.isConnected) trigger.focus();

    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!panelEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (subPanelEl) {
        const gatilho = subTriggerEl;
        closeSubmenu();
        gatilho?.focus();
        return;
      }
      close();
      return;
    }

    const active = document.activeElement as HTMLElement | null;

    if (e.key === 'ArrowRight') {
      const gatilho = active?.closest<HTMLElement>('[data-slot="context-menu-sub-trigger"]');
      const def = gatilho ? subTriggerDef.get(gatilho) : undefined;
      if (gatilho && def) {
        e.preventDefault();
        openSubmenu(gatilho, def);
        if (subPanelEl) getMenuItems(subPanelEl)[0]?.focus();
        return;
      }
    }

    if (e.key === 'ArrowLeft' && subPanelEl?.contains(active)) {
      e.preventDefault();
      const gatilho = subTriggerEl;
      closeSubmenu();
      gatilho?.focus();
      return;
    }

    const escopo = subPanelEl?.contains(active) ? subPanelEl : panelEl;
    const menuItems = getMenuItems(escopo);
    const currentIdx = menuItems.indexOf(active as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = currentIdx < menuItems.length - 1 ? currentIdx + 1 : 0;
      menuItems[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = currentIdx > 0 ? currentIdx - 1 : menuItems.length - 1;
      menuItems[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      close(false);
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (
      !panelEl?.contains(target) &&
      !subPanelEl?.contains(target) &&
      !trigger.contains(target)
    ) {
      close(false);
    }
  }

  trigger.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isOpen) close(false);
    open(e.clientX, e.clientY);
  });

  // O painel vive no `<body>`, fora da árvore de quem montou o componente. Quem
  // troca de tela remove o gatilho e o painel FICA — nas stories isso significa
  // o menu de uma sobrando por cima da seguinte, e a foto do Chromatic saindo
  // com dois. Nas outras stacks quem desmonta é o framework; aqui é a forma
  // compartilhada de limpeza, que antes era um observador montado por abertura.
  return tornarDestruivel(wrapper, wrapper, () => {
    if (isOpen) close(false);
  });
}
