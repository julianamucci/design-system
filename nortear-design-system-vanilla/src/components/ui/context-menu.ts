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

/**
 * CONTRATO DE ACESSIBILIDADE DO MENU DE CONTEXTO — bloco canônico das cinco.
 *
 * Medido em 2026-09-02 na FONTE de cada lib, não na documentação delas. As
 * outras quatro trazem a versão curta com o mecanismo da própria stack.
 *
 * DO POPUP PARA DENTRO, é o bloco canônico do `dropdown-menu` (cabeçalho de
 * `dropdown-menu.ts` desta stack) sem uma vírgula de diferença, e não por
 * coincidência: as quatro libs montam este popup com as MESMAS peças de menu —
 * `@base-ui/react/menu`, `Menu/*` do reka-ui, `bits/menu` do bits-ui e
 * `@radix-ng/primitives/menu` —, e aqui a fábrica é a mesma folha
 * `.nds-dropdown-menu-*`. Vale igual: `role="menu"`, `menuitem` /
 * `menuitemcheckbox` / `menuitemradio` com `aria-checked`, setas, `Home`/`End`,
 * typeahead, `Escape` fechando e DEVOLVENDO o foco, submenu com
 * `aria-haspopup="menu"` + `aria-expanded` no sub-gatilho, NENHUMA região viva,
 * e a seta POUSANDO no item desabilitado (decisão de 2026-09-02, com um patch
 * por lib; o mecanismo de cada uma está escrito no bloco do `dropdown-menu`).
 *
 * O QUE DIVERGE do `dropdown-menu` é só a ABERTURA — e são três coisas:
 *
 *  1. O GATILHO NÃO SE ANUNCIA, nas cinco. O do `dropdown-menu` é um botão com
 *     `aria-haspopup="menu"` e `aria-expanded`; aqui não há nem um nem outro.
 *     Conferido na fonte, e é escolha das quatro libs, não esquecimento:
 *       base-ui  — `context-menu/trigger/ContextMenuTrigger`: renderiza `div`
 *                  com `onContextMenu`/`onTouch*` e o mapeamento de estado
 *                  `pressableTriggerOpenStateMapping`, que só escreve `data-*`
 *       reka-ui  — `ContextMenu/ContextMenuTrigger`: `as: 'span'`, e os únicos
 *                  atributos são `data-state` e `data-disabled`
 *       bits-ui  — `ContextMenuTriggerState.props` em `bits/menu/menu.svelte.js`:
 *                  `data-state`, `data-disabled`, o atributo de marcação da lib
 *                  e `tabindex: -1`
 *       radix-ng — `RdxContextMenuTrigger`: host bindings `data-popup-open`,
 *                  `data-pressed`, `data-disabled`
 *     E está CERTO assim: `aria-haspopup` não é atributo global — a ARIA o
 *     admite em `button`, `link`, `menuitem`, `combobox` e afins, não em
 *     `generic`, que é o papel implícito de uma `<div>`/`<span>` de área. Dar
 *     papel de botão à área seria pior: anunciaria um controle que Enter e
 *     Espaço não acionam. O preço é real e o conteúdo compartilhado o paga por
 *     escrito — `accessibility.warning` exige que toda ação daqui exista também
 *     num ponto visível, e `notes.tip5` pede a dica visual na área.
 *
 *  2. O TECLADO ABRE, e é por isso que `tabindex="0"` na área é requisito e não
 *     enfeite: a tecla Menu e `Shift+F10` disparam `contextmenu` no elemento
 *     FOCADO. Sem parada de tabulação não há elemento focado, e o menu deixa de
 *     existir para quem não usa mouse. As cinco põem o `tabindex`. O radix-ng
 *     ainda separa os dois caminhos (`event.timeStamp - lastPointerDownTime >
 *     300` abre com o primeiro item já destacado, em vez de só o popup).
 *
 *  3. O TOQUE abre por pressionar-e-segurar nas quatro libs, com temporizador
 *     próprio (500ms em base-ui e radix-ng, `pressOpenDelay` em reka-ui, timer
 *     de long-press em bits-ui). Esta fábrica NÃO tem temporizador: ela ouve
 *     `contextmenu` e depende de o navegador emiti-lo no toque longo, o que nem
 *     todo navegador móvel faz. É divergência conhecida e não fingida — o texto
 *     compartilhado não promete toque.
 *
 * O `tabindex` da área tem ainda um segundo uso, e os dois se somam: é para ele
 * que o foco volta no fechamento. Numa `div` sem `tabindex` o `focus()` é no-op
 * e o foco cai no `<body>`, contra o que `testes.functional.item2` promete.
 */

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
      let checked =
        type === 'checkbox' ? item.checked === true : radioValue === item.value;
      // O misto vale SOBRE o marcado enquanto durar — é ele quem manda no que se
      // anuncia e no que se desenha. Só o item de marcação o tem.
      let misto = type === 'checkbox' && item.indeterminate === true;

      const li = document.createElement('li');
      li.setAttribute('role', type === 'checkbox' ? 'menuitemcheckbox' : 'menuitemradio');
      // "mixed" é o que distingue "alguns selecionados" de "todos selecionados";
      // um booleano aqui mentiria para quem lê a tela.
      li.setAttribute('aria-checked', misto ? 'mixed' : String(checked));
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
      else if (checked) indicador.appendChild(createCheckIcon());
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
              checked = true;
              li.setAttribute('aria-checked', 'true');
              indicador.replaceChildren(createCheckIcon());
              item.onIndeterminateChange?.(false);
              item.onCheckedChange?.(true);
              item.onClick?.();
              return;
            }
            checked = !checked;
            li.setAttribute('aria-checked', String(checked));
            indicador.replaceChildren();
            if (checked) indicador.appendChild(createCheckIcon());
            item.onCheckedChange?.(checked);
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
      const checked = li.dataset.value === radioValue;
      li.setAttribute('aria-checked', String(checked));
      const indicador = li.querySelector<HTMLElement>('.nds-dropdown-menu-item-indicator');
      indicador?.replaceChildren();
      if (checked && indicador) indicador.appendChild(createCheckIcon());
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

  function openSubmenu(trigger: HTMLElement, def: ContextMenuItemDef): void {
    if (subTriggerEl === trigger && subPanelEl) return;
    closeSubmenu();

    subPanelEl = buildMenu(def.items ?? [], 'context-menu-sub-content');
    subPanelEl.style.position = 'absolute';
    document.body.appendChild(subPanelEl);

    const box = trigger.getBoundingClientRect();
    subPanelEl.style.top = `${box.top + window.scrollY}px`;
    subPanelEl.style.left = `${box.right + window.scrollX}px`;

    trigger.setAttribute('aria-expanded', 'true');
    subTriggerEl = trigger;
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
   * desde 2026-09-02 é a decisão do design system para as cinco stacks (o bloco
   * canônico está no cabeçalho do `dropdown-menu` do Vanilla). O que ele não faz
   * é ativar.
   */
  function getMenuItems(menu: HTMLElement): HTMLElement[] {
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
      ),
    );
  }

  // ── Typeahead ───────────────────────────────────────────────────────────────
  // Numa lista de ações longa é o que evita percorrer item por item. As letras
  // se acumulam por 1s, como no padrão WAI-ARIA de menu: digitar "co" rápido
  // procura "co", e não "c" e depois "o". Mesma forma do `dropdown-menu` desta
  // stack — as duas fábricas compartilham a folha e o contrato de teclado.
  let searchTypeahead = '';
  let timerTypeahead: ReturnType<typeof setTimeout> | null = null;

  function typeahead(letra: string, menuItems: HTMLElement[]): void {
    searchTypeahead += letra.toLowerCase();
    if (timerTypeahead !== null) clearTimeout(timerTypeahead);
    timerTypeahead = setTimeout(() => {
      searchTypeahead = '';
      timerTypeahead = null;
    }, 1000);

    const current = menuItems.indexOf(document.activeElement as HTMLElement);
    // A busca recomeça DEPOIS do item atual para que repetir a mesma letra
    // percorra os homônimos em vez de travar no primeiro.
    const order = menuItems
      .slice(current + 1)
      .concat(menuItems.slice(0, Math.max(current + 1, 0)));
    const target = order.find((el) =>
      (el.textContent ?? '').trim().toLowerCase().startsWith(searchTypeahead),
    );
    target?.focus();
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
    if (timerTypeahead !== null) {
      clearTimeout(timerTypeahead);
      timerTypeahead = null;
    }
    searchTypeahead = '';
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
        const trigger = subTriggerEl;
        closeSubmenu();
        trigger?.focus();
        return;
      }
      close();
      return;
    }

    const active = document.activeElement as HTMLElement | null;

    if (e.key === 'ArrowRight') {
      const trigger = active?.closest<HTMLElement>('[data-slot="context-menu-sub-trigger"]');
      const def = trigger ? subTriggerDef.get(trigger) : undefined;
      if (trigger && def) {
        e.preventDefault();
        openSubmenu(trigger, def);
        if (subPanelEl) getMenuItems(subPanelEl)[0]?.focus();
        return;
      }
    }

    if (e.key === 'ArrowLeft' && subPanelEl?.contains(active)) {
      e.preventDefault();
      const trigger = subTriggerEl;
      closeSubmenu();
      trigger?.focus();
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
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key)) {
      e.preventDefault();
      typeahead(e.key, menuItems);
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
