// ─── Menubar — Vanilla factory standalone ───────────────────────────────────
//
// Barra horizontal de menus no padrão de aplicação desktop. Sem lib headless:
// o teclado, o estado de abertura e a ancoragem do painel são desta fábrica.
//
// VOCABULÁRIO DE CLASSES. A barra e o gatilho são `.nds-menubar-*`, porque só
// o menubar os tem. O MIOLO DO PAINEL é `.nds-dropdown-menu-*`, o mesmo de
// qualquer menu do sistema — é o que as outras quatro stacks compõem, e manter
// uma segunda família aqui significaria duas cópias do mesmo CSS, com uma delas
// sempre atrasada. `.nds-menubar-panel` sobrevive só como âncora de posição do
// painel de TOPO — o do submenu não a usa, porque ele não é ancorado por CSS.
//
// O QUE ESTA FÁBRICA EXPRESSA. Marcação (checkbox), escolha única (radio),
// submenu, recuo, variante destrutiva e atalho nasceram aqui porque o conteúdo
// compartilhado documenta os seis para as cinco stacks. Antes, as stories
// desenhavam esse DOM à mão com classes que não existem mais — o exemplo
// aparecia na tela sem estilo nenhum e o teste afirmava a classe morta.
//
// O SUBMENU MORA EM `@/lib/submenu`, e não mais aqui. A mesma capacidade estava
// escrita três vezes nesta stack, com três mecanismos diferentes, e nenhum
// portão vê divergência entre arquivos. O que esta fábrica perdeu ao migrar:
//
//   • O painel filho nascia ANINHADO no painel pai e apenas `hidden`, e a
//     posição saía da folha (`.nds-menubar-panel[data-side="right"]`, com
//     `left: 100%`). CSS não mede a janela nem vira o lado quando não cabe:
//     perto da borda direita o painel saía da tela, e como o painel pai declara
//     `overflow: visible` para hospedá-lo, ele escapava em vez de ser recortado
//     — virava rolagem horizontal. Agora o painel é construído POR ABERTURA,
//     anexado ao `<body>` e posicionado por `positionFloating`, a mesma conta do
//     popover e do tooltip.
//   • `aria-controls` estático no sub-gatilho saiu junto. Ele era a ligação
//     certa enquanto o painel era descendente; para painel FORA da árvore quem
//     devolve a relação de posse é o `aria-owns` que o auxiliar escreve na
//     abertura e retira no fechamento.
//
// O que continua sendo desta fábrica é montar os ITENS: marcação, escolha
// única, recuo e atalho são o formato de item do menubar, e nenhum dos outros
// dois menus o compartilha.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import { createSubmenuChevron, createSubmenuController } from '@/lib/submenu';
import { Check, Minus } from 'lucide';

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
  /** `type: 'submenu'` — itens do painel filho. */
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
// A seta do sub-gatilho vem de `@/lib/submenu` (`createSubmenuChevron`): ela é a
// mesma nos três menus desta stack, e o desenho acompanha o mecanismo que o
// justifica.
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
   * Focáveis de cada painel, pelo próprio painel.
   *
   * O percurso do teclado desta fábrica sai de uma LISTA montada na construção,
   * e não de uma consulta de descendentes: item de escolha única vive dentro de
   * um `role="group"`, e o menubar quer a ordem em que os itens foram
   * declarados. O auxiliar só precisa do primeiro item para entrar no painel
   * quando o teclado o abre, e é daqui que ele o tira.
   */
  const focaveisPorPainel = new WeakMap<HTMLElement, HTMLElement[]>();

  /**
   * Um controlador por BARRA, e um painel filho de cada vez.
   *
   * `toggleOnClick`: a barra vive aberta enquanto se navega por ela, então o
   * segundo clique no sub-gatilho é o gesto de quem quer fechá-lo.
   * `focusOnClickOpen`: o clique que abre também entra, que é o que esta
   * fábrica sempre fez. `writeStateAttr`: a folha do menubar lê
   * `data-state="open"` no sub-gatilho.
   */
  const submenu = createSubmenuController({
    triggerSlot: 'menubar-sub-trigger',
    panelIdPrefix: `menubar-panel-${id}-sub`,
    getItems: (panel) => focaveisPorPainel.get(panel) ?? [],
    toggleOnClick: true,
    focusOnClickOpen: true,
    writeStateAttr: true,
  });

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
    // Primeiro o filho: o painel dele vive no `body` e não sai junto com o pai.
    submenu.close();
    isOpen.panel.hidden = true;
    isOpen.trigger.dataset.state = 'closed';
    isOpen.trigger.setAttribute('aria-expanded', 'false');
    isOpen = null;
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

  /**
   * Devolve o painel e a lista de elementos focáveis DESTE nível.
   *
   * Os dois níveis divergem em três pontos, e cada um tem um porquê:
   *
   *   • `id` — só o painel de topo o recebe daqui, porque é para ele que aponta
   *     o `aria-controls` do gatilho da barra, escrito uma vez na montagem. O do
   *     submenu é criado e descartado a cada abertura, então quem numera o `id`
   *     é o auxiliar, que é também quem o aponta pelo `aria-owns`.
   *   • `.nds-menubar-panel` — é a ANCORAGEM POR CSS (`position: absolute` mais
   *     `top`/`left` por `data-side`/`data-align`), e ela vale só para o painel
   *     de topo, que continua aninhado no wrapper do gatilho. O do submenu é
   *     posicionado por medida, e herdar essas regras somaria a elas o
   *     `margin-left` da folha ao vão já calculado.
   *   • `hidden` — o painel de topo nasce escondido e é revelado; o do submenu
   *     não existe enquanto está fechado.
   */
  function createPanel(
    items: MenubarItem[],
    options: { id?: string; submenu: boolean },
  ): { panel: HTMLElement; focaveis: HTMLElement[] } {
    const panel = document.createElement('div');
    if (options.id) panel.id = options.id;
    panel.className = options.submenu
      ? 'nds-dropdown-menu-content'
      : 'nds-menubar-panel nds-dropdown-menu-content';
    panel.dataset.slot = options.submenu ? 'menubar-sub-content' : 'menubar-content';
    // Lado e encosto ficam legíveis no markup mesmo quando quem posiciona é o
    // JS: é por eles que uma story prova que o painel sai ao lado do item, sem
    // depender de medir pixels.
    // No submenu este valor é o PEDIDO, não o resultado: `positionFloating`
    // roda com `flip` ligado logo depois e reescreve `data-side` com o lado onde
    // o painel de fato coube.
    panel.dataset.side = options.submenu ? 'right' : side;
    panel.dataset.align = options.submenu ? 'start' : align;
    panel.setAttribute('role', 'menu');
    if (!options.submenu) panel.hidden = true;

    const focaveis: HTMLElement[] = [];

    items.forEach((item) => {
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
        // Aqui esta fábrica monta só o que é DELA: a caixa do item, o rótulo, o
        // atalho e a seta. Papel, `aria-haspopup`, `aria-expanded`,
        // `data-slot`, `data-state`, ponteiro, teclado e `aria-owns` entram com
        // `attach` — o sub-gatilho é um `menuitem` como os outros, e continua na
        // roda das setas do painel pai.
        //
        // O wrapper `.nds-menubar-menu` que envolvia gatilho e painel saiu: ele
        // existia para ser o bloco de referência da ancoragem relativa, e não há
        // mais ancoragem relativa a referenciar.
        const subTrigger = document.createElement('div');
        subTrigger.className = 'nds-dropdown-menu-sub-trigger';
        applyComuns(subTrigger, item);
        createLabelEAtalho(subTrigger, item);
        subTrigger.appendChild(createSubmenuChevron());

        // `attach` devolve o próprio gatilho, que é o que o põe na roda das
        // setas deste nível em uma linha.
        focaveis.push(
          submenu.attach(subTrigger, {
            disabled: item.disabled,
            // Montado a cada abertura, e não uma vez: medida de nó desanexado
            // vale zero, e é a medida que decide onde o painel cabe.
            buildPanel: () => {
              const montado = createPanel(item.items ?? [], { submenu: true });
              focaveisPorPainel.set(montado.panel, montado.focaveis);
              return montado.panel;
            },
          }),
        );

        // O auxiliar consome `ArrowRight`, `Enter` e `Espaço` NO GATILHO e não
        // interrompe a propagação — ele serve a menus que não têm barra acima.
        // Aqui têm: sem esta cerca, o `ArrowRight` que abre o submenu subiria
        // até o ouvinte da barra e TROCARIA o menu aberto no mesmo gesto, que é
        // a seta horizontal do menubar agindo sobre um gesto que não era dela.
        subTrigger.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        });

        panel.appendChild(subTrigger);
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
      // A roda são TODOS os itens, o desabilitado inclusive. Antes ela era
      // `focaveis` filtrado por `aria-disabled !== 'true'`, e quem navega de
      // ouvido não ficava sabendo que a opção existe — a WAI-ARIA APG pede que
      // ela seja alcançada e ANUNCIADA como indisponível. O que o item
      // desabilitado não faz é ativar, e disso quem cuida é `acionar()`.
      const roda = focaveis;
      if (roda.length === 0) return;
      const current = roda.indexOf(document.activeElement as HTMLElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        roda[(current + 1 + roda.length) % roda.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        roda[(current - 1 + roda.length) % roda.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        roda[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        roda[roda.length - 1]?.focus();
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        // Typeahead: o conteúdo compartilhado promete que digitar uma letra
        // move o foco para o item que começa com ela.
        const letra = e.key.toLowerCase();
        const ordenados = [...roda.slice(current + 1), ...roda.slice(0, current + 1)];
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

    // ── Teclado que só o painel FILHO tem ───────────────────────────────────
    //
    // `ArrowLeft` fecha o filho e devolve o foco ao sub-gatilho; `Escape` fecha
    // SÓ o filho — fechar a barra inteira ali tiraria a pessoa de dois níveis
    // com uma tecla. Precisa estar aqui, e não no ouvinte da barra: o painel
    // vive no `body`, então o evento nunca sobe até `root`.
    if (options.submenu) {
      panel.addEventListener('keydown', (e) => {
        submenu.handleKeydown(e);
      });
    }

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
    const target = e.target as Node;
    // O painel do submenu também é "dentro": ele vive no `body`, fora de `root`,
    // e sem esta linha um clique num rótulo ou separador do submenu dispensaria
    // a barra inteira.
    if (isOpen && !root.contains(target) && !submenu.contains(target)) closeAll();
  }

  document.addEventListener('click', onClickOutside);

  if (options?.defaultOpen !== undefined) {
    // Depois da montagem: o painel precisa estar no DOM para receber o foco.
    queueMicrotask(() => openMenu(options.defaultOpen!, 'nenhum'));
  }

  return tornarDestruivel(root, root, () => {
    closeAll();
    // Cinto e suspensório: `closeAll` já leva o painel do filho, mas quem
    // desmonta a barra FECHADA não passa por ele, e o painel é portalado — sem
    // isto sobraria um menu órfão no `body` sem ninguém com referência para
    // removê-lo, mais o temporizador de carência do ponteiro.
    submenu.destroy();
    document.removeEventListener('click', onClickOutside);
  });
}
