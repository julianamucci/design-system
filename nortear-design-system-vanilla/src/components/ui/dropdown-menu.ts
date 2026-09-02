// ─── DropdownMenu — Vanilla factory standalone ──────────────────────────────
// Visual: classes .nds-dropdown-menu-* (standalone).
// Render via portal, navegação por teclado (Arrow/Home/End/Esc/Tab).

/**
 * CONTRATO DE ACESSIBILIDADE DO MENU — bloco canônico das cinco stacks.
 *
 * Medido em 2026-09-02 na FONTE de cada lib, não na documentação delas. As
 * outras quatro trazem a versão curta com o mecanismo da própria stack.
 *
 * O que as CINCO cumprem igual:
 *
 * - Gatilho: `aria-haspopup="menu"` e `aria-expanded` acompanhando o estado.
 * - Painel: `role="menu"`. Itens: `menuitem`, e `menuitemcheckbox` /
 *   `menuitemradio` quando há estado, com `aria-checked` (aqui e no Angular
 *   também `mixed`, para o estado misto).
 * - Setas cima/baixo andam item a item; `Home` e `End` vão às pontas; digitar
 *   um caractere salta para o item que começa com ele (typeahead).
 * - `Escape` fecha e DEVOLVE o foco ao gatilho.
 * - Nenhuma região viva. Menu não é anúncio: quem narra a mudança de foco é o
 *   percurso do próprio leitor de tela, e um `aria-live` aqui duplicaria a fala.
 *
 * Onde as cinco DIVERGEM, e por que não dá para alinhar:
 *
 *   O item DESABILITADO sai do percurso das setas em três stacks e continua
 *   nele em duas. Não é descuido de implementação: cada lib crava a escolha no
 *   próprio seletor de candidatos, sem prop que a inverta.
 *
 *     PULA o item desabilitado
 *       vanilla — a lista de candidatos aqui é
 *                 `[role=menuitem]:not([aria-disabled="true"])`, e o item
 *                 desabilitado também não recebe `tabindex`
 *       reka-ui — `Menu/MenuContentImpl`, RovingFocusGroup com
 *                 `attributeName: '[data-reka-collection-item]:not([data-disabled])'`
 *       bits-ui — `bits/menu/menu.svelte.js`,
 *                 `querySelectorAll('[…item]:not([data-disabled])')`
 *
 *     POUSA no item desabilitado
 *       base-ui  — `menu/item/useMenuItem`, `useButton({ focusableWhenDisabled: true })`,
 *                  e `menu/root/MenuRoot` chama `useListNavigation` com
 *                  `disabledIndices: EMPTY_ARRAY` (nenhum índice é "desabilitado")
 *       radix-ng — `getCompositeMenuItems()` filtra a lista só por VISIBILIDADE;
 *                  `disabled` não tira o item dela
 *
 *   As duas leituras têm respaldo: a WAI-ARIA recomenda manter o item
 *   desabilitado focalizável, para que ele seja ANUNCIADO em vez de sumir; e
 *   pular poupa quem navega de parar no que não executa. O que NÃO se pode é
 *   dizer que uma delas é o contrato do design system enquanto três stacks
 *   fazem o contrário. Nenhum item de `testes.accessibility` promete um dos
 *   dois lados — e a story `ItemDisabled` de cada stack assere o que a SUA lib
 *   faz, com o motivo no passo.
 *
 * Outra divergência, esta de peça e não de comportamento: esta fábrica não tem
 * submenu. `functional.item7` e `visual.item4` ficam declarados em
 * `coversNotApplicable` na story do Playground.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import {
  positionFloating,
  type FloatingAlign,
  type FloatingSide,
} from '@/lib/floating';

export type DropdownMenuSide = FloatingSide;
export type DropdownMenuAlign = FloatingAlign;

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
  /** Borda do gatilho por onde o menu sai. */
  side?: DropdownMenuSide;
  /** Encosto do menu no eixo perpendicular ao `side`. */
  align?: DropdownMenuAlign;
  /** Vão entre gatilho e menu, em px. */
  sideOffset?: number;
  /**
   * Enquanto aberto, a interação com o resto da página é bloqueada: o clique de
   * fora DISPENSA o menu e não chega ao que está embaixo, e a página não rola.
   *
   * `false` deixa a página utilizável — o menu continua fechando no clique de
   * fora, mas o clique também acerta o alvo.
   */
  modal?: boolean;
  /**
   * Estado CONTROLADO. Definido, quem manda no menu é quem chama: clique,
   * Escape, Tab e clique fora passam a apenas ANUNCIAR a intenção por
   * `onOpenChange`, e o menu só se move em `setOpen()`.
   */
  open?: boolean;
  /** Estado inicial no modo não-controlado. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

/**
 * O que a fábrica devolve.
 *
 * Verbos em INGLÊS, como no Sidebar desta stack — a forma que o repositório
 * adotou para abrir e fechar por código.
 */
export type DropdownMenuElement = DestroyableElement & {
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

/** Papel ARIA de cada tipo de item que se comporta como item de menu. */
const TYPE_ROLE = {
  item: 'menuitem',
  checkbox: 'menuitemcheckbox',
  radio: 'menuitemradio',
} as const;

/** Classe `.nds-*` de cada tipo — o contrato visual que o CSS compartilhado define. */
const TYPE_CLASSNAME = {
  item: 'nds-dropdown-menu-item',
  checkbox: 'nds-dropdown-menu-checkbox-item',
  radio: 'nds-dropdown-menu-radio-item',
} as const;

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Estado de marcação de um item. É TRI-VALORADO: o misto ("alguns dos filhos
 * selecionados") não é marcado nem desmarcado, e tem símbolo próprio.
 */
type MarkupState = 'checked' | 'unchecked' | 'indeterminate';

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
function createIndicador(state: MarkupState, slot: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'nds-dropdown-menu-item-indicator';
  // `data-slot` por TIPO de item, como nas outras quatro stacks
  // (`dropdown-menu-checkbox-item-indicator` / `…-radio-item-indicator`).
  span.dataset.slot = slot;
  // Redundante com o `aria-checked` que o papel já anuncia: para o leitor de
  // tela é ruído, para quem enxerga é o estado inteiro.
  span.setAttribute('aria-hidden', 'true');
  if (state === 'unchecked') return span;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  if (state === 'indeterminate') {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '5');
    line.setAttribute('y1', '12');
    line.setAttribute('x2', '19');
    line.setAttribute('y2', '12');
    svg.appendChild(line);
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

// A conta de posição mora em `@/lib/floating`, compartilhada com o popover e o
// tooltip. Aqui havia uma cópia que cravava bottom/start a 4px — e foi
// exatamente por ela que `side` e `align` viraram controles mortos na story.

// ─── createDropdownMenu ───────────────────────────────────────────────────────

export function createDropdownMenu(options: DropdownMenuOptions): DropdownMenuElement {
  const {
    trigger,
    items,
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    modal = true,
    onOpenChange,
  } = options;

  const controlled = options.open !== undefined;

  const id = ++_dropdownCounter;
  const menuId = `dropdown-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;
  let overflowPrevious = '';

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
    // Lado e encosto escolhidos ficam legíveis no markup, como nas outras
    // stacks. É por eles que uma story prova que a opção chegou ao painel sem
    // depender de medir pixels.
    menu.dataset.side = side;
    menu.dataset.align = align;

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
      const kind = type as keyof typeof TYPE_ROLE;
      const li = document.createElement('li');
      li.setAttribute('role', TYPE_ROLE[kind]);
      li.className = TYPE_CLASSNAME[kind];
      li.dataset.slot = `dropdown-menu-${kind === 'item' ? 'item' : `${kind}-item`}`;
      if (kind === 'item') li.dataset.variant = item.variant ?? 'default';
      if (item.disabled) li.setAttribute('aria-disabled', 'true');
      if (!item.disabled) li.setAttribute('tabindex', '-1');
      if (item.value) li.dataset.value = item.value;
      if (item.group) li.dataset.group = item.group;

      const marcavel = kind !== 'item';
      const slotDoIndicador = `dropdown-menu-${kind}-item-indicator`;
      // O misto vale SOBRE o marcado enquanto durar — é ele quem manda no que se
      // anuncia e no que se desenha. Só o item de marcação o tem.
      let misto = kind === 'checkbox' && item.indeterminate === true;
      let checked = item.checked ?? false;

      function pintarMarkup(): void {
        // "mixed" é o que distingue "alguns selecionados" de "todos
        // selecionados"; um booleano aqui mentiria para quem lê a tela.
        li.setAttribute('aria-checked', misto ? 'mixed' : String(checked));
        const nextIndicator = createIndicador(
          misto ? 'indeterminate' : checked ? 'checked' : 'unchecked',
          slotDoIndicador,
        );
        if (li.firstElementChild) li.replaceChild(nextIndicator, li.firstElementChild);
        else li.appendChild(nextIndicator);
      }

      if (marcavel) pintarMarkup();

      const text = document.createElement('span');
      text.textContent = item.label ?? '';
      li.appendChild(text);

      if (item.shortcut) {
        const atalho = document.createElement('span');
        atalho.className = 'nds-dropdown-menu-shortcut';
        atalho.dataset.slot = 'dropdown-menu-shortcut';
        // Sem `aria-hidden`: o atalho é informação, não decoração — quem usa
        // leitor de tela precisa saber que a tecla existe.
        atalho.textContent = item.shortcut;
        li.appendChild(atalho);
      }

      function toggleMarkup(): void {
        if (kind === 'checkbox') {
          if (misto) {
            // O primeiro clique RESOLVE o misto para marcado, como faz a
            // propriedade `indeterminate` do input nativo — e não devolve o
            // misto a ninguém, porque "alguns" é conclusão de quem consome.
            misto = false;
            checked = true;
            pintarMarkup();
            item.onIndeterminateChange?.(false);
            item.onCheckedChange?.(true);
            return;
          }
          checked = !checked;
          pintarMarkup();
          item.onCheckedChange?.(checked);
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
            createIndicador(
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
            toggleMarkup();
            item.onClick?.();
            return;
          }
          item.onClick?.();
          // Escolher fecha — mas quem fecha é o mesmo caminho de qualquer outra
          // interação: controlado, isto só anuncia a intenção.
          pedirChange(false);
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

  function open(): void {
    if (isOpen) return;

    panelEl = buildMenu();
    document.body.appendChild(panelEl);
    positionFloating(trigger, panelEl, side, align, sideOffset);

    trigger.setAttribute('aria-expanded', 'true');
    isOpen = true;

    // Focus first item
    const menuItems = getMenuItems(panelEl);
    menuItems[0]?.focus();

    document.addEventListener('keydown', handleKeydown);

    if (modal) {
      // Modal: a interação de fora é CONSUMIDA na captura, antes de chegar a
      // quem quer que esteja embaixo. Os três tipos do gesto são interceptados
      // porque um clique real é uma sequência — deixar o último passar faria o
      // botão de baixo disparar depois de o menu já ter fechado.
      //
      // Não há ouvinte de bolha aqui: quem dispensa é o próprio bloqueador, e
      // o gesto que ABRIU já passou pela captura antes deste registro.
      document.addEventListener('pointerdown', bloquearOutsideModal, true);
      document.addEventListener('mousedown', bloquearOutsideModal, true);
      document.addEventListener('click', bloquearOutsideModal, true);
      overflowPrevious = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
      // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
      // registrado DEPOIS da limpeza e ficava para sempre.
      timerClickOutside = setTimeout(() => {
        timerClickOutside = null;
        document.addEventListener('click', handleOutsideClick);
      }, 0);
    }

    notificar(true);
  }

  function close(): void {
    if (!isOpen) return;

    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
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
    document.removeEventListener('pointerdown', bloquearOutsideModal, true);
    document.removeEventListener('mousedown', bloquearOutsideModal, true);
    document.removeEventListener('click', bloquearOutsideModal, true);
    if (modal) document.body.style.overflow = overflowPrevious;

    notificar(false);
  }

  function setOpen(next: boolean): void {
    if (next) open();
    else close();
  }

  /**
   * Anuncia a mudança de estado.
   *
   * Controlado, o menu não anuncia o que ele próprio aplicou: quem pediu foi
   * quem chama, e o aviso já saiu na intenção. Sem esta cerca, um
   * `onOpenChange` que responde com `setOpen()` receberia o evento duas vezes.
   */
  function notificar(isOpen: boolean): void {
    if (!controlled) onOpenChange?.(isOpen);
  }

  /**
   * Intenção vinda de uma INTERAÇÃO (clique, Escape, Tab, clique fora).
   *
   * Controlada, ela só é anunciada — quem manda no estado é quem chama. Fora do
   * modo controlado, ela é executada, e `open`/`close` anunciam por conta.
   */
  function pedirChange(next: boolean): void {
    if (controlled) {
      onOpenChange?.(next);
      return;
    }
    setOpen(next);
  }

  function bloquearOutsideModal(e: Event): void {
    const target = e.target as Node;
    if (panelEl?.contains(target) || wrapper.contains(target)) return;
    e.preventDefault();
    e.stopPropagation();
    // A dispensa sai no `click`, o último do gesto: dispensar antes desmontaria
    // os bloqueadores no meio da sequência e soltaria o resto dela na página.
    if (e.type === 'click') pedirChange(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!panelEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      pedirChange(false);
      // O foco só volta se o menu de fato saiu: no modo controlado quem fecha é
      // quem chama, e devolver o foco antes disso o tiraria de dentro de um
      // menu que continua na tela.
      if (!isOpen) trigger.focus();
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
      pedirChange(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key)) {
      e.preventDefault();
      typeahead(e.key, menuItems);
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      pedirChange(false);
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    pedirChange(!isOpen);
  });

  // O menu mora em portal no `body`, e os ouvintes de `keydown`/`click` vivem no
  // `document` só enquanto ele está aberto. Quem removia o wrapper com o menu
  // ABERTO — troca de story, desmonte de tela — deixava painel órfão no body e
  // dois ouvintes presos a um nó que já não estava em lugar nenhum.
  // `Object.assign` e não um `as`: os verbos entram no tipo do próprio alvo, e
  // `tornarDestruivel` devolve exatamente `DropdownMenuElement` sem conversão.
  // Uma asserção aqui teria de passar por `unknown` — o wrapper é
  // `HTMLDivElement` e o tipo declarado parte de `HTMLElement`, e nenhum dos
  // dois cobre o outro.
  const instancia = tornarDestruivel(
    wrapper,
    Object.assign(wrapper, {
      open,
      close,
      toggle: () => setOpen(!isOpen),
      setOpen,
    }),
    () => {
      if (isOpen) close();
    },
  );

  // Estado inicial. Adiado uma volta do laço de eventos, e não um microtique: a
  // raiz ainda não entrou no documento quando a fábrica retorna, e posicionar o
  // menu exige medir um gatilho já no layout.
  const startsOpen = controlled ? options.open === true : options.defaultOpen === true;
  if (startsOpen) {
    setTimeout(() => {
      // A raiz pode ter sido descartada antes deste tique. Abrir aqui portaria
      // um painel para o `body` sem ninguém com referência para fechá-lo.
      if (wrapper.isConnected) open();
    }, 0);
  }

  return instancia;
}
