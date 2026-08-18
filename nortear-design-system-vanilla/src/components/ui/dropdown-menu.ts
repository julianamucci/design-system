// ─── DropdownMenu — Vanilla factory standalone ──────────────────────────────
// Visual: classes .nds-dropdown-menu-* (standalone).
// Render via portal, navegação por teclado (Arrow/Home/End/Esc/Tab).

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

export type DropdownMenuItemDef = {
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio';
  value?: string;
  label?: string;
  disabled?: boolean;
  /** Ênfase do item. `destructive` marca a ação irreversível. */
  variant?: 'default' | 'destructive';
  /** Atalho exibido à direita. Integra o nome acessível do item de propósito. */
  shortcut?: string;
  /** Só em `checkbox` e `radio`: estado inicial de marcação. */
  checked?: boolean;
  /**
   * Só em `checkbox`: estado misto ("alguns dos filhos selecionados"). Vale
   * sobre `checked` enquanto durar, e o primeiro clique o resolve para marcado,
   * como faz a propriedade `indeterminate` do input nativo. Mesma semântica da
   * caixa de seleção avulsa desta stack.
   */
  indeterminate?: boolean;
  /** Só em `radio`: nome do grupo de escolha única a que o item pertence. */
  group?: string;
  onClick?: () => void;
  /** Só em `checkbox` e `radio`: avisado a cada mudança de marcação. */
  onCheckedChange?: (checked: boolean) => void;
  /** Só em `checkbox`: disparado quando o estado misto é resolvido por interação. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
};

export type DropdownMenuOptions = {
  trigger: HTMLElement;
  items: DropdownMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

/** Papel ARIA de cada tipo de item que se comporta como item de menu. */
const PAPEL_POR_TIPO = {
  item: 'menuitem',
  checkbox: 'menuitemcheckbox',
  radio: 'menuitemradio',
} as const;

/** Classe `.nds-*` de cada tipo — o contrato visual que o CSS compartilhado define. */
const CLASSE_POR_TIPO = {
  item: 'nds-dropdown-menu-item',
  checkbox: 'nds-dropdown-menu-checkbox-item',
  radio: 'nds-dropdown-menu-radio-item',
} as const;

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Estado de marcação de um item. É TRI-VALORADO: o misto ("alguns dos filhos
 * selecionados") não é marcado nem desmarcado, e tem símbolo próprio.
 */
type EstadoDeMarcacao = 'checked' | 'unchecked' | 'indeterminate';

/**
 * Marca do item escolhido. Fica sempre no DOM; o que muda é o conteúdo.
 *
 * O ícone é montado nó a nó, e não por `innerHTML`: aqui não há conteúdo de
 * fora para sanitizar, mas `innerHTML` numa fábrica é o caminho por onde a
 * injeção entra na próxima vez que alguém passar um rótulo por ali.
 *
 * O traço do misto é o MESMO desenho da caixa de seleção avulsa desta stack
 * (`checkbox.ts`): um segmento horizontal de (5,12) a (19,12). Tique quer dizer
 * "marcado", e misto não é isso — repetir o tique nos dois estados apagaria a
 * diferença justamente para quem depende do símbolo.
 */
function criarIndicador(estado: EstadoDeMarcacao, slot: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'nds-dropdown-menu-item-indicator';
  // `data-slot` por TIPO de item, como nas outras quatro stacks
  // (`dropdown-menu-checkbox-item-indicator` / `…-radio-item-indicator`).
  span.dataset.slot = slot;
  // Redundante com o `aria-checked` que o papel já anuncia: para o leitor de
  // tela é ruído, para quem enxerga é o estado inteiro.
  span.setAttribute('aria-hidden', 'true');
  if (estado === 'unchecked') return span;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  if (estado === 'indeterminate') {
    const linha = document.createElementNS(SVG_NS, 'line');
    linha.setAttribute('x1', '5');
    linha.setAttribute('y1', '12');
    linha.setAttribute('x2', '19');
    linha.setAttribute('y2', '12');
    svg.appendChild(linha);
  } else {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M20 6 9 17l-5-5');
    svg.appendChild(path);
  }
  span.appendChild(svg);
  return span;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _dropdownCounter = 0;

function positionDropdown(anchor: HTMLElement, panel: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  panel.style.top = `${rect.bottom + scrollY + 4}px`;
  panel.style.left = `${rect.left + scrollX}px`;
}

// ─── createDropdownMenu ───────────────────────────────────────────────────────

export function createDropdownMenu(options: DropdownMenuOptions): DestroyableElement {
  const { trigger, items, onOpenChange } = options;

  const id = ++_dropdownCounter;
  const menuId = `dropdown-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerCliqueFora: ReturnType<typeof setTimeout> | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dropdown-menu';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);

  function buildMenu(): HTMLElement {
    const menu = document.createElement('ul');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className = cn('nds-dropdown-menu-content', options.class);
    menu.dataset.slot = 'dropdown-menu-content';

    items.forEach((item) => {
      const type = item.type ?? 'item';

      if (type === 'separator') {
        const sep = document.createElement('li');
        sep.setAttribute('role', 'separator');
        sep.className = 'nds-dropdown-menu-separator';
        menu.appendChild(sep);
        return;
      }

      if (type === 'label') {
        const lbl = document.createElement('li');
        lbl.setAttribute('role', 'presentation');
        lbl.className = 'nds-dropdown-menu-label';
        lbl.textContent = item.label ?? '';
        menu.appendChild(lbl);
        return;
      }

      // 'item' | 'checkbox' | 'radio' — os três se comportam como item de menu;
      // o que muda é o papel ARIA, a classe e o que a ativação faz.
      const tipo = type as keyof typeof PAPEL_POR_TIPO;
      const li = document.createElement('li');
      li.setAttribute('role', PAPEL_POR_TIPO[tipo]);
      li.className = CLASSE_POR_TIPO[tipo];
      li.dataset.slot = `dropdown-menu-${tipo === 'item' ? 'item' : `${tipo}-item`}`;
      if (tipo === 'item') li.dataset.variant = item.variant ?? 'default';
      if (item.disabled) li.setAttribute('aria-disabled', 'true');
      if (!item.disabled) li.setAttribute('tabindex', '-1');
      if (item.value) li.dataset.value = item.value;
      if (item.group) li.dataset.group = item.group;

      const marcavel = tipo !== 'item';
      const slotDoIndicador = `dropdown-menu-${tipo}-item-indicator`;
      // O misto vale SOBRE o marcado enquanto durar — é ele quem manda no que se
      // anuncia e no que se desenha. Só o item de marcação o tem.
      let misto = tipo === 'checkbox' && item.indeterminate === true;
      let marcado = item.checked ?? false;

      function pintarMarcacao(): void {
        // "mixed" é o que distingue "alguns selecionados" de "todos
        // selecionados"; um booleano aqui mentiria para quem lê a tela.
        li.setAttribute('aria-checked', misto ? 'mixed' : String(marcado));
        const novo = criarIndicador(
          misto ? 'indeterminate' : marcado ? 'checked' : 'unchecked',
          slotDoIndicador,
        );
        if (li.firstElementChild) li.replaceChild(novo, li.firstElementChild);
        else li.appendChild(novo);
      }

      if (marcavel) pintarMarcacao();

      const texto = document.createElement('span');
      texto.textContent = item.label ?? '';
      li.appendChild(texto);

      if (item.shortcut) {
        const atalho = document.createElement('span');
        atalho.className = 'nds-dropdown-menu-shortcut';
        atalho.dataset.slot = 'dropdown-menu-shortcut';
        // Sem `aria-hidden`: o atalho é informação, não decoração — quem usa
        // leitor de tela precisa saber que a tecla existe.
        atalho.textContent = item.shortcut;
        li.appendChild(atalho);
      }

      function alternarMarcacao(): void {
        if (tipo === 'checkbox') {
          if (misto) {
            // O primeiro clique RESOLVE o misto para marcado, como faz a
            // propriedade `indeterminate` do input nativo — e não devolve o
            // misto a ninguém, porque "alguns" é conclusão de quem consome.
            misto = false;
            marcado = true;
            pintarMarcacao();
            item.onIndeterminateChange?.(false);
            item.onCheckedChange?.(true);
            return;
          }
          marcado = !marcado;
          pintarMarcacao();
          item.onCheckedChange?.(marcado);
          return;
        }
        // Escolha única: os irmãos do mesmo grupo desmarcam junto.
        const irmaos = menu.querySelectorAll<HTMLElement>(
          `[role="menuitemradio"]${item.group ? `[data-group="${item.group}"]` : ''}`,
        );
        irmaos.forEach((irmao) => {
          const escolhido = irmao === li;
          irmao.setAttribute('aria-checked', String(escolhido));
          irmao.replaceChild(
            criarIndicador(
              escolhido ? 'checked' : 'unchecked',
              'dropdown-menu-radio-item-indicator',
            ),
            irmao.firstElementChild!,
          );
        });
        item.onCheckedChange?.(true);
      }

      if (!item.disabled) {
        const ativar = (): void => {
          if (marcavel) {
            // Alternar não fecha: quem marca uma coluna costuma marcar a próxima.
            alternarMarcacao();
            item.onClick?.();
            return;
          }
          item.onClick?.();
          close();
        };
        li.addEventListener('click', ativar);
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ativar();
          }
        });
      }

      menu.appendChild(li);
    });

    return menu;
  }

  function getMenuItems(menu: HTMLElement): HTMLElement[] {
    // Os três papéis navegam junto: uma lista de ações que mistura alternadores
    // e escolha única continua sendo uma lista só para quem usa as setas.
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"]),' +
          '[role="menuitemcheckbox"]:not([aria-disabled="true"]),' +
          '[role="menuitemradio"]:not([aria-disabled="true"])',
      ),
    );
  }

  // ── Typeahead ───────────────────────────────────────────────────────────────
  // Numa lista de ações longa é o que evita percorrer item por item. As letras
  // se acumulam por 1s, como no padrão WAI-ARIA de menu: digitar "co" rápido
  // procura "co", e não "c" e depois "o".
  let buscaTypeahead = '';
  let timerTypeahead: ReturnType<typeof setTimeout> | null = null;

  function typeahead(letra: string, menuItems: HTMLElement[]): void {
    buscaTypeahead += letra.toLowerCase();
    if (timerTypeahead !== null) clearTimeout(timerTypeahead);
    timerTypeahead = setTimeout(() => {
      buscaTypeahead = '';
      timerTypeahead = null;
    }, 1000);

    const atual = menuItems.indexOf(document.activeElement as HTMLElement);
    // A busca recomeça DEPOIS do item atual para que repetir a mesma letra
    // percorra os homônimos em vez de travar no primeiro.
    const ordem = menuItems
      .slice(atual + 1)
      .concat(menuItems.slice(0, Math.max(atual + 1, 0)));
    const alvo = ordem.find((el) =>
      (el.textContent ?? '').trim().toLowerCase().startsWith(buscaTypeahead),
    );
    alvo?.focus();
  }

  function open(): void {
    panelEl = buildMenu();
    document.body.appendChild(panelEl);
    positionDropdown(trigger, panelEl);

    trigger.setAttribute('aria-expanded', 'true');
    isOpen = true;

    // Focus first item
    const menuItems = getMenuItems(panelEl);
    menuItems[0]?.focus();

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
    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
    isOpen = false;

    if (timerCliqueFora !== null) {
      clearTimeout(timerCliqueFora);
      timerCliqueFora = null;
    }
    if (timerTypeahead !== null) {
      clearTimeout(timerTypeahead);
      timerTypeahead = null;
    }
    buscaTypeahead = '';
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);

    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!panelEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
      return;
    }

    const menuItems = getMenuItems(panelEl);
    const currentIdx = menuItems.indexOf(document.activeElement as HTMLElement);

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
      close();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key)) {
      e.preventDefault();
      typeahead(e.key, menuItems);
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

  // O menu mora em portal no `body`, e os ouvintes de `keydown`/`click` vivem no
  // `document` só enquanto ele está aberto. Quem removia o wrapper com o menu
  // ABERTO — troca de story, desmonte de tela — deixava painel órfão no body e
  // dois ouvintes presos a um nó que já não estava em lugar nenhum.
  return tornarDestruivel(wrapper, wrapper, () => {
    if (isOpen) close();
  });
}
