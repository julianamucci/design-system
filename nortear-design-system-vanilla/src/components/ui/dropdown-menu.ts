// ─── DropdownMenu — Vanilla factory standalone ──────────────────────────────
// Visual: classes .nds-dropdown-menu-* (standalone).
// Render via portal, navegação por teclado (Arrow/Home/End/Esc/Tab).

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

  const controlado = options.open !== undefined;

  const id = ++_dropdownCounter;
  const menuId = `dropdown-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let timerCliqueFora: ReturnType<typeof setTimeout> | null = null;
  let overflowAnterior = '';

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
          // Escolher fecha — mas quem fecha é o mesmo caminho de qualquer outra
          // interação: controlado, isto só anuncia a intenção.
          pedirMudanca(false);
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
      document.addEventListener('pointerdown', bloquearForaModal, true);
      document.addEventListener('mousedown', bloquearForaModal, true);
      document.addEventListener('click', bloquearForaModal, true);
      overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
      // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
      // registrado DEPOIS da limpeza e ficava para sempre.
      timerCliqueFora = setTimeout(() => {
        timerCliqueFora = null;
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
    document.removeEventListener('pointerdown', bloquearForaModal, true);
    document.removeEventListener('mousedown', bloquearForaModal, true);
    document.removeEventListener('click', bloquearForaModal, true);
    if (modal) document.body.style.overflow = overflowAnterior;

    notificar(false);
  }

  function setOpen(proximo: boolean): void {
    if (proximo) open();
    else close();
  }

  /**
   * Anuncia a mudança de estado.
   *
   * Controlado, o menu não anuncia o que ele próprio aplicou: quem pediu foi
   * quem chama, e o aviso já saiu na intenção. Sem esta cerca, um
   * `onOpenChange` que responde com `setOpen()` receberia o evento duas vezes.
   */
  function notificar(aberto: boolean): void {
    if (!controlado) onOpenChange?.(aberto);
  }

  /**
   * Intenção vinda de uma INTERAÇÃO (clique, Escape, Tab, clique fora).
   *
   * Controlada, ela só é anunciada — quem manda no estado é quem chama. Fora do
   * modo controlado, ela é executada, e `open`/`close` anunciam por conta.
   */
  function pedirMudanca(proximo: boolean): void {
    if (controlado) {
      onOpenChange?.(proximo);
      return;
    }
    setOpen(proximo);
  }

  function bloquearForaModal(e: Event): void {
    const alvo = e.target as Node;
    if (panelEl?.contains(alvo) || wrapper.contains(alvo)) return;
    e.preventDefault();
    e.stopPropagation();
    // A dispensa sai no `click`, o último do gesto: dispensar antes desmontaria
    // os bloqueadores no meio da sequência e soltaria o resto dela na página.
    if (e.type === 'click') pedirMudanca(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!panelEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      pedirMudanca(false);
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
      pedirMudanca(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key)) {
      e.preventDefault();
      typeahead(e.key, menuItems);
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      pedirMudanca(false);
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    pedirMudanca(!isOpen);
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
  const comecaAberto = controlado ? options.open === true : options.defaultOpen === true;
  if (comecaAberto) {
    setTimeout(() => {
      // A raiz pode ter sido descartada antes deste tique. Abrir aqui portaria
      // um painel para o `body` sem ninguém com referência para fechá-lo.
      if (wrapper.isConnected) open();
    }, 0);
  }

  return instancia;
}
