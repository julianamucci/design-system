// ─── Menubar — Vanilla factory standalone ───────────────────────────────────
//
// Barra horizontal de menus no padrão de aplicação desktop. Sem lib headless:
// o teclado, o estado de abertura e a ancoragem do painel são desta fábrica.
//
// VOCABULÁRIO DE CLASSES. A barra e o gatilho são `.nds-menubar-*`, porque só
// o menubar os tem. O MIOLO DO PAINEL é `.nds-dropdown-menu-*`, o mesmo de
// qualquer menu do sistema — é o que as outras quatro stacks compõem, e manter
// uma segunda família aqui significaria duas cópias do mesmo CSS, com uma delas
// sempre atrasada. `.nds-menubar-panel` sobrevive só como âncora de posição.
//
// O QUE ESTA FÁBRICA EXPRESSA. Marcação (checkbox), escolha única (radio),
// submenu, recuo, variante destrutiva e atalho nasceram aqui porque o conteúdo
// compartilhado documenta os seis para as cinco stacks. Antes, as stories
// desenhavam esse DOM à mão com classes que não existem mais — o exemplo
// aparecia na tela sem estilo nenhum e o teste afirmava a classe morta.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { Check, ChevronRight, Minus } from 'lucide';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenubarItemType =
  | 'item'
  | 'separator'
  | 'label'
  | 'checkbox'
  | 'radio-group'
  | 'submenu';

export type MenubarRadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type MenubarItem = {
  type?: MenubarItemType;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Ação irreversível — pinta o item com a cor de perigo. */
  variant?: 'default' | 'destructive';
  /** Recuo à esquerda, para alinhar com itens que têm marcador. */
  inset?: boolean;
  /** `type: 'checkbox'` — estado inicial e callback de mudança. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * `type: 'checkbox'` — estado misto ("alguns dos filhos selecionados"). Vale
   * sobre `checked` enquanto durar, e o primeiro clique o resolve para marcado,
   * como faz a propriedade `indeterminate` do input nativo. Mesma semântica da
   * caixa de seleção avulsa desta stack.
   */
  indeterminate?: boolean;
  /** Disparado quando o estado misto é resolvido por interação. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
  /** `type: 'radio-group'` — opções, valor inicial e callback de mudança. */
  options?: MenubarRadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  /** `type: 'submenu'` — itens do painel aninhado. */
  items?: MenubarItem[];
};

export type MenubarMenu = {
  label: string;
  items: MenubarItem[];
};

export type MenubarSide = 'top' | 'bottom' | 'left' | 'right';
export type MenubarAlign = 'start' | 'center' | 'end';

export type MenubarOptions = {
  class?: string;
  /** A seta dá a volta do último gatilho para o primeiro, e vice-versa. */
  loop?: boolean;
  /** Índice do menu que já nasce aberto. */
  defaultOpen?: number;
  /** Lado de abertura do painel em relação ao gatilho. */
  side?: MenubarSide;
  /** Alinhamento do painel no eixo perpendicular ao lado. */
  align?: MenubarAlign;
};

let _menubarCounter = 0;

// ─── Ícones ───────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';
type LucideIconNode = [string, Record<string, string>];

function createIcon(nos: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nos) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

const ICON_MARCA = () => createIcon(Check as unknown as LucideIconNode[]);
const ICON_SUBMENU = () => createIcon(ChevronRight as unknown as LucideIconNode[]);
/**
 * Traço do estado misto — o mesmo desenho da caixa de seleção avulsa desta
 * stack (`checkbox.ts`): um segmento horizontal de (5,12) a (19,12). Tique quer
 * dizer "marcado", e misto não é isso; repetir o tique nos dois estados apagaria
 * a diferença justamente para quem depende do símbolo.
 */
const ICON_TRACO = () => createIcon(Minus as unknown as LucideIconNode[]);

// ─── Peças do painel ──────────────────────────────────────────────────────────

/** Marcador à direita do item, presente em marcação e escolha única. */
function createIndicador(icone: SVGSVGElement | null, slot: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'nds-dropdown-menu-item-indicator';
  // O `data-slot` é por TIPO de item, como nas outras quatro stacks
  // (`menubar-checkbox-item-indicator` / `menubar-radio-item-indicator`): aqui
  // ele não existia, e sem ele o indicador do menubar era o único do sistema
  // sem endereço próprio.
  span.dataset.slot = slot;
  span.setAttribute('aria-hidden', 'true');
  if (icone) span.appendChild(icone);
  return span;
}

function applyComuns(el: HTMLElement, item: MenubarItem): void {
  if (item.inset) el.setAttribute('data-inset', '');
  if (item.disabled) el.setAttribute('aria-disabled', 'true');
  el.setAttribute('tabindex', '-1');
}

function createLabelEAtalho(el: HTMLElement, item: MenubarItem): void {
  const text = document.createElement('span');
  text.textContent = item.label ?? '';
  el.appendChild(text);

  if (item.shortcut) {
    const atalho = document.createElement('span');
    atalho.className = 'nds-dropdown-menu-shortcut';
    atalho.dataset.slot = 'menubar-shortcut';
    atalho.textContent = item.shortcut;
    el.appendChild(atalho);
  }
}

// ─── createMenubar ────────────────────────────────────────────────────────────

export function createMenubar(menus: MenubarMenu[], options?: MenubarOptions): DestroyableElement {
  const id = ++_menubarCounter;
  const loop = options?.loop ?? true;
  const side: MenubarSide = options?.side ?? 'bottom';
  const align: MenubarAlign = options?.align ?? 'start';

  const root = document.createElement('div');
  root.dataset.slot = 'menubar';
  root.setAttribute('role', 'menubar');
  root.setAttribute('aria-orientation', 'horizontal');
  root.className = cn('nds-menubar', options?.class);

  const triggers: HTMLButtonElement[] = [];
  let isOpen: { panel: HTMLElement; trigger: HTMLButtonElement; items: HTMLElement[] } | null = null;

  /**
   * Tabulação itinerante: a barra inteira é UMA parada de Tab.
   *
   * Sem isto, atravessar uma barra de seis menus custaria seis Tabs a quem
   * navega por teclado — e o conteúdo compartilhado promete o contrário, no
   * item de acessibilidade que diz que o Tab não para em cada gatilho.
   */
  function moverTabulacao(target: HTMLButtonElement): void {
    for (const g of triggers) g.tabIndex = g === target ? 0 : -1;
  }

  function closeAll(): void {
    if (!isOpen) return;
    closeSubmenus(isOpen.panel);
    isOpen.panel.hidden = true;
    isOpen.trigger.dataset.state = 'closed';
    isOpen.trigger.setAttribute('aria-expanded', 'false');
    isOpen = null;
  }

  function closeSubmenus(escopo: HTMLElement): void {
    for (const sub of escopo.querySelectorAll<HTMLElement>('[data-slot="menubar-sub-content"]')) {
      sub.hidden = true;
      const trigger = sub.parentElement?.querySelector<HTMLElement>(
        '[data-slot="menubar-sub-trigger"]',
      );
      trigger?.setAttribute('aria-expanded', 'false');
      trigger?.setAttribute('data-state', 'closed');
    }
  }

  function openMenu(index: number, focus: 'item' | 'gatilho' | 'nenhum'): void {
    const target = menusMontados[index];
    if (!target) return;
    if (isOpen?.trigger === target.trigger) return;
    closeAll();
    target.panel.hidden = false;
    target.trigger.dataset.state = 'open';
    target.trigger.setAttribute('aria-expanded', 'true');
    isOpen = target;
    moverTabulacao(target.trigger);
    if (focus === 'item') target.items[0]?.focus();
    else if (focus === 'gatilho') target.trigger.focus();
  }

  // ── Construção de um painel (menu de topo ou submenu) ──────────────────────

  /** Devolve o painel e a lista de elementos focáveis DESTE nível. */
  function createPanel(
    items: MenubarItem[],
    options: { id: string; submenu: boolean },
  ): { panel: HTMLElement; focaveis: HTMLElement[] } {
    const panel = document.createElement('div');
    panel.id = options.id;
    panel.className = 'nds-menubar-panel nds-dropdown-menu-content';
    panel.dataset.slot = options.submenu ? 'menubar-sub-content' : 'menubar-content';
    panel.dataset.side = options.submenu ? 'right' : side;
    panel.dataset.align = options.submenu ? 'start' : align;
    panel.setAttribute('role', 'menu');
    panel.hidden = true;

    const focaveis: HTMLElement[] = [];

    items.forEach((item, i) => {
      const type = item.type ?? 'item';

      if (type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'nds-dropdown-menu-separator';
        sep.dataset.slot = 'menubar-separator';
        sep.setAttribute('role', 'separator');
        panel.appendChild(sep);
        return;
      }

      if (type === 'label') {
        const label = document.createElement('div');
        label.className = 'nds-dropdown-menu-label';
        label.dataset.slot = 'menubar-label';
        if (item.inset) label.setAttribute('data-inset', '');
        label.textContent = item.label ?? '';
        panel.appendChild(label);
        return;
      }

      if (type === 'checkbox') {
        const box = document.createElement('div');
        box.className = 'nds-dropdown-menu-checkbox-item';
        box.dataset.slot = 'menubar-checkbox-item';
        box.setAttribute('role', 'menuitemcheckbox');
        applyComuns(box, item);

        let checked = item.checked ?? false;
        // O estado é TRI-VALORADO: marcado, desmarcado e misto. O misto vale
        // SOBRE o marcado enquanto durar — é ele quem manda no que se anuncia e
        // no que se desenha.
        let misto = item.indeterminate ?? false;
        const indicador = createIndicador(null, 'menubar-checkbox-item-indicator');

        const pintar = (): void => {
          // "mixed" é o que distingue "alguns selecionados" de "todos
          // selecionados"; um booleano aqui mentiria para quem lê a tela.
          box.setAttribute('aria-checked', misto ? 'mixed' : String(checked));
          // Misto não é marcado: o atributo de dado do estado marcado fica fora.
          if (!misto && checked) box.dataset.checked = '';
          else delete box.dataset.checked;
          indicador.replaceChildren();
          if (misto) indicador.appendChild(ICON_TRACO());
          else if (checked) indicador.appendChild(ICON_MARCA());
        };

        pintar();

        createLabelEAtalho(box, item);
        box.appendChild(indicador);

        const alternar = (): void => {
          if (item.disabled) return;
          if (misto) {
            // O primeiro clique RESOLVE o misto para marcado, como faz a
            // propriedade `indeterminate` do input nativo — e não devolve o
            // estado misto a ninguém, porque "alguns" é conclusão de quem
            // consome, não de um clique.
            misto = false;
            checked = true;
            pintar();
            item.onIndeterminateChange?.(false);
            item.onCheckedChange?.(true);
            return;
          }
          checked = !checked;
          pintar();
          item.onCheckedChange?.(checked);
          // Marcar NÃO fecha: quem marca uma preferência quer marcar a próxima.
        };
        box.addEventListener('click', alternar);
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            alternar();
          }
        });

        focaveis.push(box);
        panel.appendChild(box);
        return;
      }

      if (type === 'radio-group') {
        const group = document.createElement('div');
          group.dataset.slot = 'menubar-radio-group';
        group.setAttribute('role', 'group');

        let escolhido = item.value;
        const options = item.options ?? [];
        const elementos: Array<{ el: HTMLElement; indicador: HTMLElement; value: string }> = [];

        for (const opcao of options) {
          const choice = document.createElement('div');
          choice.className = 'nds-dropdown-menu-radio-item';
          choice.dataset.slot = 'menubar-radio-item';
          choice.setAttribute('role', 'menuitemradio');
          choice.dataset.value = opcao.value;
          applyComuns(choice, { disabled: opcao.disabled });

          const checked = escolhido === opcao.value;
          choice.setAttribute('aria-checked', String(checked));
          if (checked) choice.dataset.checked = '';

          createLabelEAtalho(choice, { label: opcao.label });
          const indicador = createIndicador(
            checked ? ICON_MARCA() : null,
            'menubar-radio-item-indicator',
          );
          choice.appendChild(indicador);

          choice.addEventListener('click', () => {
            if (opcao.disabled || escolhido === opcao.value) return;
            escolhido = opcao.value;
            for (const other of elementos) {
              const active = other.value === escolhido;
              other.el.setAttribute('aria-checked', String(active));
              if (active) other.el.dataset.checked = '';
              else delete other.el.dataset.checked;
              other.indicador.replaceChildren();
              if (active) other.indicador.appendChild(ICON_MARCA());
            }
            item.onValueChange?.(escolhido);
          });

          elementos.push({ el: choice, indicador, value: opcao.value });
          focaveis.push(choice);
          group.appendChild(choice);
        }

        panel.appendChild(group);
        return;
      }

      if (type === 'submenu') {
        const wrapper = document.createElement('div');
        wrapper.className = 'nds-menubar-menu';
        wrapper.dataset.slot = 'menubar-sub';

        const subId = `${options.id}-sub-${i}`;
        const subTrigger = document.createElement('div');
        subTrigger.className = 'nds-dropdown-menu-sub-trigger';
        subTrigger.dataset.slot = 'menubar-sub-trigger';
        subTrigger.setAttribute('role', 'menuitem');
        subTrigger.setAttribute('aria-haspopup', 'menu');
        subTrigger.setAttribute('aria-expanded', 'false');
        subTrigger.setAttribute('aria-controls', subId);
        subTrigger.dataset.state = 'closed';
        applyComuns(subTrigger, item);
        createLabelEAtalho(subTrigger, item);
        const chevron = ICON_SUBMENU();
        chevron.setAttribute('class', 'nds-dropdown-menu-sub-trigger-chevron');
        subTrigger.appendChild(chevron);

        const { panel: subPanel, focaveis: subFocaveis } = createPanel(item.items ?? [], {
          id: subId,
          submenu: true,
        });

        const openSub = (focar: boolean): void => {
          if (item.disabled) return;
          subPanel.hidden = false;
          subTrigger.setAttribute('aria-expanded', 'true');
          subTrigger.dataset.state = 'open';
          if (focar) subFocaveis[0]?.focus();
        };
        const closeSub = (focarGatilho: boolean): void => {
          subPanel.hidden = true;
          subTrigger.setAttribute('aria-expanded', 'false');
          subTrigger.dataset.state = 'closed';
          if (focarGatilho) subTrigger.focus();
        };

        subTrigger.addEventListener('click', () => {
          if (subTrigger.getAttribute('aria-expanded') === 'true') closeSub(true);
          else openSub(true);
        });
        subTrigger.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            openSub(true);
          }
        });
        subPanel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            closeSub(true);
          }
        });

        wrapper.append(subTrigger, subPanel);
        focaveis.push(subTrigger);
        panel.appendChild(wrapper);
        return;
      }

      // Item comum.
      const el = document.createElement('div');
      el.className = 'nds-dropdown-menu-item';
      el.dataset.slot = 'menubar-item';
      el.dataset.variant = item.variant ?? 'default';
      el.setAttribute('role', 'menuitem');
      applyComuns(el, item);
      createLabelEAtalho(el, item);

      const acionar = (): void => {
        if (item.disabled) return;
        const menuTrigger = isOpen?.trigger ?? null;
        item.onClick?.();
        closeAll();
        menuTrigger?.focus();
      };
      el.addEventListener('click', acionar);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          acionar();
        }
      });

      focaveis.push(el);
      panel.appendChild(el);
    });

    // ── Teclado DENTRO do painel ────────────────────────────────────────────
    panel.addEventListener('keydown', (e) => {
      const livres = focaveis.filter((el) => el.getAttribute('aria-disabled') !== 'true');
      if (livres.length === 0) return;
      const current = livres.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        livres[(current + 1 + livres.length) % livres.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        livres[(current - 1 + livres.length) % livres.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        livres[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        livres[livres.length - 1]?.focus();
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        // Typeahead: o conteúdo compartilhado promete que digitar uma letra
        // move o foco para o item que começa com ela.
        const letra = e.key.toLowerCase();
        const ordenados = [...livres.slice(current + 1), ...livres.slice(0, current + 1)];
        const finding = ordenados.find((el) =>
          (el.textContent ?? '').trim().toLowerCase().startsWith(letra),
        );
        if (finding) {
          e.preventDefault();
          e.stopPropagation();
          finding.focus();
        }
      }
    });

    return { panel, focaveis };
  }

  // ── Montagem dos menus de topo ────────────────────────────────────────────

  const menusMontados: Array<{
    panel: HTMLElement;
    trigger: HTMLButtonElement;
    items: HTMLElement[];
  }> = [];

  menus.forEach((menu, index) => {
    const panelId = `menubar-panel-${id}-${index}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-menubar-menu';
    wrapper.dataset.slot = 'menubar-menu';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nds-menubar-trigger';
    trigger.dataset.slot = 'menubar-trigger';
    trigger.setAttribute('role', 'menuitem');
    // `menu`, e não `true`: é o valor que as outras quatro stacks publicam e o
    // que o conteúdo compartilhado documenta na tabela de ARIA.
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-controls', panelId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.dataset.state = 'closed';
    trigger.tabIndex = index === 0 ? 0 : -1;
    trigger.textContent = menu.label;

    const { panel, focaveis } = createPanel(menu.items, { id: panelId, submenu: false });

    trigger.addEventListener('click', () => {
      const estavaOpen = trigger.dataset.state === 'open';
      closeAll();
      if (!estavaOpen) openMenu(index, 'item');
      else moverTabulacao(trigger);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu(index, 'item');
      } else if (e.key === 'Escape') {
        closeAll();
        moverTabulacao(trigger);
      }
    });

    wrapper.append(trigger, panel);
    root.appendChild(wrapper);
    triggers.push(trigger);
    menusMontados.push({ panel, trigger, items: focaveis });
  });

  // ── Teclado da BARRA ──────────────────────────────────────────────────────
  //
  // A seta horizontal é o que separa um menubar de quatro botões vizinhos: ela
  // move o foco entre gatilhos e, com um menu já aberto, TROCA o menu aberto —
  // o gesto de aplicação desktop.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Escape') return;

    if (e.key === 'Escape') {
      const openTrigger = isOpen?.trigger ?? null;
      closeAll();
      if (openTrigger) {
        moverTabulacao(openTrigger);
        openTrigger.focus();
      }
      return;
    }

    const step = e.key === 'ArrowRight' ? 1 : -1;
    const current = isOpen
      ? triggers.indexOf(isOpen.trigger)
      : triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    let next = current + step;
    if (next >= triggers.length) next = loop ? 0 : triggers.length - 1;
    if (next < 0) next = loop ? triggers.length - 1 : 0;
    if (next === current) return;

    e.preventDefault();
    if (isOpen) {
      openMenu(next, 'gatilho');
    } else {
      moverTabulacao(triggers[next]);
      triggers[next].focus();
    }
  });

  /*
   * Fechar ao clicar fora. Este ouvinte era anônimo e registrado NA MONTAGEM,
   * sem par: ele nunca era removido, e nada podia removê-lo, porque não havia
   * referência à função. Cada barra criada somava mais um ouvinte de `click`
   * permanente no `document`, com a closure inteira da barra presa junto.
   */
  function onClickOutside(e: MouseEvent): void {
    if (isOpen && !root.contains(e.target as Node)) closeAll();
  }

  document.addEventListener('click', onClickOutside);

  if (options?.defaultOpen !== undefined) {
    // Depois da montagem: o painel precisa estar no DOM para receber o foco.
    queueMicrotask(() => openMenu(options.defaultOpen!, 'nenhum'));
  }

  return tornarDestruivel(root, root, () => {
    closeAll();
    document.removeEventListener('click', onClickOutside);
  });
}
