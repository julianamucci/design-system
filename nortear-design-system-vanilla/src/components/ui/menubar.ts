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
import { Check, ChevronRight } from 'lucide';

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

function criarIcone(nos: LucideIconNode[]): SVGSVGElement {
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
    const filho = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
    svg.appendChild(filho);
  }
  return svg;
}

const ICONE_MARCA = () => criarIcone(Check as unknown as LucideIconNode[]);
const ICONE_SUBMENU = () => criarIcone(ChevronRight as unknown as LucideIconNode[]);

// ─── Peças do painel ──────────────────────────────────────────────────────────

/** Marcador à direita do item, presente em marcação e escolha única. */
function criarIndicador(icone: SVGSVGElement | null): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'nds-dropdown-menu-item-indicator';
  span.setAttribute('aria-hidden', 'true');
  if (icone) span.appendChild(icone);
  return span;
}

function aplicarComuns(el: HTMLElement, item: MenubarItem): void {
  if (item.inset) el.setAttribute('data-inset', '');
  if (item.disabled) el.setAttribute('aria-disabled', 'true');
  el.setAttribute('tabindex', '-1');
}

function criarRotuloEAtalho(el: HTMLElement, item: MenubarItem): void {
  const texto = document.createElement('span');
  texto.textContent = item.label ?? '';
  el.appendChild(texto);

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

  const gatilhos: HTMLButtonElement[] = [];
  let aberto: { panel: HTMLElement; trigger: HTMLButtonElement; itens: HTMLElement[] } | null = null;

  /**
   * Tabulação itinerante: a barra inteira é UMA parada de Tab.
   *
   * Sem isto, atravessar uma barra de seis menus custaria seis Tabs a quem
   * navega por teclado — e o conteúdo compartilhado promete o contrário, no
   * item de acessibilidade que diz que o Tab não para em cada gatilho.
   */
  function moverTabulacao(alvo: HTMLButtonElement): void {
    for (const g of gatilhos) g.tabIndex = g === alvo ? 0 : -1;
  }

  function fecharTudo(): void {
    if (!aberto) return;
    fecharSubmenus(aberto.panel);
    aberto.panel.hidden = true;
    aberto.trigger.dataset.state = 'closed';
    aberto.trigger.setAttribute('aria-expanded', 'false');
    aberto = null;
  }

  function fecharSubmenus(escopo: HTMLElement): void {
    for (const sub of escopo.querySelectorAll<HTMLElement>('[data-slot="menubar-sub-content"]')) {
      sub.hidden = true;
      const gatilho = sub.parentElement?.querySelector<HTMLElement>(
        '[data-slot="menubar-sub-trigger"]',
      );
      gatilho?.setAttribute('aria-expanded', 'false');
      gatilho?.setAttribute('data-state', 'closed');
    }
  }

  function abrirMenu(indice: number, foco: 'item' | 'gatilho' | 'nenhum'): void {
    const alvo = menusMontados[indice];
    if (!alvo) return;
    if (aberto?.trigger === alvo.trigger) return;
    fecharTudo();
    alvo.panel.hidden = false;
    alvo.trigger.dataset.state = 'open';
    alvo.trigger.setAttribute('aria-expanded', 'true');
    aberto = alvo;
    moverTabulacao(alvo.trigger);
    if (foco === 'item') alvo.itens[0]?.focus();
    else if (foco === 'gatilho') alvo.trigger.focus();
  }

  // ── Construção de um painel (menu de topo ou submenu) ──────────────────────

  /** Devolve o painel e a lista de elementos focáveis DESTE nível. */
  function criarPainel(
    itens: MenubarItem[],
    opcoes: { id: string; submenu: boolean },
  ): { panel: HTMLElement; focaveis: HTMLElement[] } {
    const panel = document.createElement('div');
    panel.id = opcoes.id;
    panel.className = 'nds-menubar-panel nds-dropdown-menu-content';
    panel.dataset.slot = opcoes.submenu ? 'menubar-sub-content' : 'menubar-content';
    panel.dataset.side = opcoes.submenu ? 'right' : side;
    panel.dataset.align = opcoes.submenu ? 'start' : align;
    panel.setAttribute('role', 'menu');
    panel.hidden = true;

    const focaveis: HTMLElement[] = [];

    itens.forEach((item, i) => {
      const tipo = item.type ?? 'item';

      if (tipo === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'nds-dropdown-menu-separator';
        sep.dataset.slot = 'menubar-separator';
        sep.setAttribute('role', 'separator');
        panel.appendChild(sep);
        return;
      }

      if (tipo === 'label') {
        const rotulo = document.createElement('div');
        rotulo.className = 'nds-dropdown-menu-label';
        rotulo.dataset.slot = 'menubar-label';
        if (item.inset) rotulo.setAttribute('data-inset', '');
        rotulo.textContent = item.label ?? '';
        panel.appendChild(rotulo);
        return;
      }

      if (tipo === 'checkbox') {
        const caixa = document.createElement('div');
        caixa.className = 'nds-dropdown-menu-checkbox-item';
        caixa.dataset.slot = 'menubar-checkbox-item';
        caixa.setAttribute('role', 'menuitemcheckbox');
        aplicarComuns(caixa, item);

        let marcado = item.checked ?? false;
        const indicador = criarIndicador(marcado ? ICONE_MARCA() : null);
        caixa.setAttribute('aria-checked', String(marcado));
        if (marcado) caixa.dataset.checked = '';

        criarRotuloEAtalho(caixa, item);
        caixa.appendChild(indicador);

        const alternar = (): void => {
          if (item.disabled) return;
          marcado = !marcado;
          caixa.setAttribute('aria-checked', String(marcado));
          if (marcado) caixa.dataset.checked = '';
          else delete caixa.dataset.checked;
          indicador.replaceChildren();
          if (marcado) indicador.appendChild(ICONE_MARCA());
          item.onCheckedChange?.(marcado);
          // Marcar NÃO fecha: quem marca uma preferência quer marcar a próxima.
        };
        caixa.addEventListener('click', alternar);
        caixa.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            alternar();
          }
        });

        focaveis.push(caixa);
        panel.appendChild(caixa);
        return;
      }

      if (tipo === 'radio-group') {
        const grupo = document.createElement('div');
          grupo.dataset.slot = 'menubar-radio-group';
        grupo.setAttribute('role', 'group');

        let escolhido = item.value;
        const opcoes = item.options ?? [];
        const elementos: Array<{ el: HTMLElement; indicador: HTMLElement; valor: string }> = [];

        for (const opcao of opcoes) {
          const escolha = document.createElement('div');
          escolha.className = 'nds-dropdown-menu-radio-item';
          escolha.dataset.slot = 'menubar-radio-item';
          escolha.setAttribute('role', 'menuitemradio');
          escolha.dataset.value = opcao.value;
          aplicarComuns(escolha, { disabled: opcao.disabled });

          const marcado = escolhido === opcao.value;
          escolha.setAttribute('aria-checked', String(marcado));
          if (marcado) escolha.dataset.checked = '';

          criarRotuloEAtalho(escolha, { label: opcao.label });
          const indicador = criarIndicador(marcado ? ICONE_MARCA() : null);
          escolha.appendChild(indicador);

          escolha.addEventListener('click', () => {
            if (opcao.disabled || escolhido === opcao.value) return;
            escolhido = opcao.value;
            for (const outro of elementos) {
              const ativo = outro.valor === escolhido;
              outro.el.setAttribute('aria-checked', String(ativo));
              if (ativo) outro.el.dataset.checked = '';
              else delete outro.el.dataset.checked;
              outro.indicador.replaceChildren();
              if (ativo) outro.indicador.appendChild(ICONE_MARCA());
            }
            item.onValueChange?.(escolhido);
          });

          elementos.push({ el: escolha, indicador, valor: opcao.value });
          focaveis.push(escolha);
          grupo.appendChild(escolha);
        }

        panel.appendChild(grupo);
        return;
      }

      if (tipo === 'submenu') {
        const wrapper = document.createElement('div');
        wrapper.className = 'nds-menubar-menu';
        wrapper.dataset.slot = 'menubar-sub';

        const subId = `${opcoes.id}-sub-${i}`;
        const subGatilho = document.createElement('div');
        subGatilho.className = 'nds-dropdown-menu-sub-trigger';
        subGatilho.dataset.slot = 'menubar-sub-trigger';
        subGatilho.setAttribute('role', 'menuitem');
        subGatilho.setAttribute('aria-haspopup', 'menu');
        subGatilho.setAttribute('aria-expanded', 'false');
        subGatilho.setAttribute('aria-controls', subId);
        subGatilho.dataset.state = 'closed';
        aplicarComuns(subGatilho, item);
        criarRotuloEAtalho(subGatilho, item);
        const chevron = ICONE_SUBMENU();
        chevron.setAttribute('class', 'nds-dropdown-menu-sub-trigger-chevron');
        subGatilho.appendChild(chevron);

        const { panel: subPanel, focaveis: subFocaveis } = criarPainel(item.items ?? [], {
          id: subId,
          submenu: true,
        });

        const abrirSub = (focar: boolean): void => {
          if (item.disabled) return;
          subPanel.hidden = false;
          subGatilho.setAttribute('aria-expanded', 'true');
          subGatilho.dataset.state = 'open';
          if (focar) subFocaveis[0]?.focus();
        };
        const fecharSub = (focarGatilho: boolean): void => {
          subPanel.hidden = true;
          subGatilho.setAttribute('aria-expanded', 'false');
          subGatilho.dataset.state = 'closed';
          if (focarGatilho) subGatilho.focus();
        };

        subGatilho.addEventListener('click', () => {
          if (subGatilho.getAttribute('aria-expanded') === 'true') fecharSub(true);
          else abrirSub(true);
        });
        subGatilho.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            abrirSub(true);
          }
        });
        subPanel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            fecharSub(true);
          }
        });

        wrapper.append(subGatilho, subPanel);
        focaveis.push(subGatilho);
        panel.appendChild(wrapper);
        return;
      }

      // Item comum.
      const el = document.createElement('div');
      el.className = 'nds-dropdown-menu-item';
      el.dataset.slot = 'menubar-item';
      el.dataset.variant = item.variant ?? 'default';
      el.setAttribute('role', 'menuitem');
      aplicarComuns(el, item);
      criarRotuloEAtalho(el, item);

      const acionar = (): void => {
        if (item.disabled) return;
        const gatilhoDoMenu = aberto?.trigger ?? null;
        item.onClick?.();
        fecharTudo();
        gatilhoDoMenu?.focus();
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
      const atual = livres.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        livres[(atual + 1 + livres.length) % livres.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        livres[(atual - 1 + livres.length) % livres.length]?.focus();
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
        const ordenados = [...livres.slice(atual + 1), ...livres.slice(0, atual + 1)];
        const achado = ordenados.find((el) =>
          (el.textContent ?? '').trim().toLowerCase().startsWith(letra),
        );
        if (achado) {
          e.preventDefault();
          e.stopPropagation();
          achado.focus();
        }
      }
    });

    return { panel, focaveis };
  }

  // ── Montagem dos menus de topo ────────────────────────────────────────────

  const menusMontados: Array<{
    panel: HTMLElement;
    trigger: HTMLButtonElement;
    itens: HTMLElement[];
  }> = [];

  menus.forEach((menu, indice) => {
    const panelId = `menubar-panel-${id}-${indice}`;
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
    trigger.tabIndex = indice === 0 ? 0 : -1;
    trigger.textContent = menu.label;

    const { panel, focaveis } = criarPainel(menu.items, { id: panelId, submenu: false });

    trigger.addEventListener('click', () => {
      const estavaAberto = trigger.dataset.state === 'open';
      fecharTudo();
      if (!estavaAberto) abrirMenu(indice, 'item');
      else moverTabulacao(trigger);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirMenu(indice, 'item');
      } else if (e.key === 'Escape') {
        fecharTudo();
        moverTabulacao(trigger);
      }
    });

    wrapper.append(trigger, panel);
    root.appendChild(wrapper);
    gatilhos.push(trigger);
    menusMontados.push({ panel, trigger, itens: focaveis });
  });

  // ── Teclado da BARRA ──────────────────────────────────────────────────────
  //
  // A seta horizontal é o que separa um menubar de quatro botões vizinhos: ela
  // move o foco entre gatilhos e, com um menu já aberto, TROCA o menu aberto —
  // o gesto de aplicação desktop.
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Escape') return;

    if (e.key === 'Escape') {
      const gatilhoDoAberto = aberto?.trigger ?? null;
      fecharTudo();
      if (gatilhoDoAberto) {
        moverTabulacao(gatilhoDoAberto);
        gatilhoDoAberto.focus();
      }
      return;
    }

    const passo = e.key === 'ArrowRight' ? 1 : -1;
    const atual = aberto
      ? gatilhos.indexOf(aberto.trigger)
      : gatilhos.indexOf(document.activeElement as HTMLButtonElement);
    if (atual < 0) return;

    let proximo = atual + passo;
    if (proximo >= gatilhos.length) proximo = loop ? 0 : gatilhos.length - 1;
    if (proximo < 0) proximo = loop ? gatilhos.length - 1 : 0;
    if (proximo === atual) return;

    e.preventDefault();
    if (aberto) {
      abrirMenu(proximo, 'gatilho');
    } else {
      moverTabulacao(gatilhos[proximo]);
      gatilhos[proximo].focus();
    }
  });

  /*
   * Fechar ao clicar fora. Este ouvinte era anônimo e registrado NA MONTAGEM,
   * sem par: ele nunca era removido, e nada podia removê-lo, porque não havia
   * referência à função. Cada barra criada somava mais um ouvinte de `click`
   * permanente no `document`, com a closure inteira da barra presa junto.
   */
  function aoClicarFora(e: MouseEvent): void {
    if (aberto && !root.contains(e.target as Node)) fecharTudo();
  }

  document.addEventListener('click', aoClicarFora);

  if (options?.defaultOpen !== undefined) {
    // Depois da montagem: o painel precisa estar no DOM para receber o foco.
    queueMicrotask(() => abrirMenu(options.defaultOpen!, 'nenhum'));
  }

  return tornarDestruivel(root, root, () => {
    fecharTudo();
    document.removeEventListener('click', aoClicarFora);
  });
}
