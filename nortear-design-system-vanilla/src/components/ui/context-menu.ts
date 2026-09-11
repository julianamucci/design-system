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
 * `aria-haspopup="menu"` + `aria-expanded` + `aria-owns` no sub-gatilho (o
 * painel filho vive no `<body>`, e sem o `aria-owns` ele é um menu solto ali),
 * NENHUMA região viva,
 * e a seta POUSANDO no item desabilitado (decisão de 2026-09-02, com um patch
 * por lib; o mecanismo de cada uma está escrito no bloco do `dropdown-menu`).
 *
 * O MECANISMO DO SUBMENU MORA EM `@/lib/submenu`, e não mais aqui. A mesma
 * capacidade estava escrita três vezes nesta stack, com três mecanismos
 * diferentes — e nenhum portão vê divergência entre arquivos. O que continua
 * sendo desta fábrica é montar os ITENS; gatilho, painel, portal, posição, ARIA,
 * teclado, ponteiro e limpeza são do auxiliar, e o porquê de cada decisão está
 * escrito lá, junto da decisão. O que muda para quem usa: o painel filho agora
 * tem CARÊNCIA de 300ms no fechamento por ponteiro, que resolve a travessia em
 * diagonal do item até o painel — antes ele só saía por outro sub-gatilho,
 * `Escape`, `ArrowLeft` ou o fechamento do menu.
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
import { createSubmenuChevron, createSubmenuController } from '@/lib/submenu';
import { positionFloatingAtPoint } from '@/lib/floating';
import { isPlainTab, tabExitTarget } from '@/lib/tabbable';

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

/**
 * Por onde o menu fechou — o vocabulário da família, o mesmo `reason` do
 * `context_menu_close`. `escape` é a tecla; `overlay` é sair SEM decidir —
 * clique fora, Tab levando o foco embora, ou um novo clique direito que
 * reabre o menu noutro ponto; `api` é o fechamento pedido pelo produto — um
 * item de ação escolhido, ou o componente saindo da página com o menu aberto.
 *
 * Não há `close-button`: este menu não tem botão de fechar.
 */
export type ContextMenuCloseReason = 'escape' | 'overlay' | 'api';

export type ContextMenuOptions = {
  trigger: HTMLElement;
  items: ContextMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  /**
   * Motivo do fechamento. Dispara uma vez por fechamento, ANTES do
   * `onOpenChange(false)` — a mesma ordem do `createAlertDialog` e do
   * `createSheet`. É o que alimenta o `reason` do `context_menu_close`: o
   * `onOpenChange` diz QUE fechou, e só a fábrica sabe por qual caminho.
   */
  onClose?: (reason: ContextMenuCloseReason) => void;
  /** Grupo de escolha única: o valor corrente entre os itens `radio`. */
  radioValue?: string;
  onRadioChange?: (value: string) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _contextMenuCounter = 0;

const SVG_NS = 'http://www.w3.org/2000/svg';

// O vão entre o sub-gatilho e o painel filho é o padrão de `@/lib/submenu`.
// Aqui ele não é opção pública porque o menu de contexto não tem `side`/`align`:
// ele abre onde o ponteiro está, e o submenu PEDE a direita do item — o auxiliar
// vira para a esquerda por conta própria quando não cabe, e anuncia o lado final
// no `data-side` do painel.

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

// A seta do sub-gatilho vive em `@/lib/submenu` (`createSubmenuChevron`): ela é
// a mesma nos três menus desta stack, e o desenho acompanha o mecanismo que o
// justifica.

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
  const { trigger, items, onOpenChange, onClose } = options;

  const id = ++_contextMenuCounter;
  const menuId = `context-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;
  let radioValue = options.radioValue;
  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;
  // O `id` de cada rótulo, para o `aria-labelledby` do grupo que ele nomeia.
  // Contador da fábrica, e não do painel: o painel é remontado a cada abertura
  // e o do submenu convive com o do menu raiz no mesmo documento.
  let labelCount = 0;

  // ── Submenu ─────────────────────────────────────────────────────────────────
  // Um controlador por menu, e um painel filho de cada vez: abrir outro fecha o
  // anterior. Gatilho, painel, posição, ARIA, teclado, ponteiro e limpeza são
  // dele; o que continua sendo desta fábrica é montar os ITENS, que é o que cada
  // menu tem de próprio.
  //
  // `writeStateAttr`: com o submenu aberto o sub-gatilho leva
  // `data-state="open"`, que é o que a folha lê para mantê-lo destacado quando o
  // foco ENTRA no painel filho. Sem ele o destaque vinha só do `:focus`, e sumia
  // exatamente no passo em que a pessoa precisa saber de onde o submenu saiu.
  const submenu = createSubmenuController({
    triggerSlot: 'context-menu-sub-trigger',
    panelIdPrefix: `${menuId}-sub`,
    getItems: getMenuItems,
    writeStateAttr: true,
  });

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
            // O painel é o `role="menu"` mais próximo, e não o do menu raiz: o
            // rádio pode morar num SUBMENU, cujo painel tem outro `data-slot` e
            // vive fora da árvore do raiz. Buscar pelo `data-slot` do raiz
            // devolvia `null` ali, e a escolha não desmarcava os irmãos.
            sincronizarRadios(li.closest<HTMLElement>('[role="menu"]'));
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
      // Aqui esta fábrica monta só o que é DELA: a caixa do item, o rótulo, o
      // atalho, o recuo e a seta. Papel, `aria-haspopup`, `aria-expanded`,
      // `data-slot`, `tabindex`, ponteiro e teclado (`ArrowRight`, `Enter`,
      // `Espaço`) entram com `attach` — o sub-gatilho é um `menuitem` como os
      // outros, e continua na roda das setas do menu pai.
      const li = document.createElement('li');
      li.className = 'nds-dropdown-menu-sub-trigger';
      if (item.inset) li.dataset.inset = 'true';
      fillItemContent(li, item);
      li.appendChild(createSubmenuChevron());

      // O painel é montado a cada abertura, e por `buildMenu`: o submenu tem os
      // mesmos tipos de item do menu raiz, e o que distingue os dois no markup é
      // o `data-slot`.
      submenu.attach(li, {
        buildPanel: () => buildMenu(item.items ?? [], 'context-menu-sub-content'),
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
      // Escolher um item de AÇÃO decide e fecha: é o fechamento `api`, o único
      // em que a pessoa terminou o que veio fazer.
      li.addEventListener('click', () => {
        item.onClick?.();
        close('api');
      });
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.onClick?.();
          close('api');
        }
      });
    }

    menu.appendChild(li);
  }

  /**
   * O rótulo NOMEIA um bloco — e nomear exige que exista um bloco.
   *
   * Ele era um `<li role="presentation">` solto entre os itens: o texto não
   * chegava a nome acessível de coisa alguma, e o leitor de tela o anunciava sem
   * dizer a que se aplicava. Agora ele abre um `role="group"` com
   * `aria-labelledby` apontando para ele, e os itens seguintes entram no grupo
   * até o próximo separador ou rótulo — a mesma forma da fábrica do
   * `dropdown-menu`, que as duas folhas compartilham. O rótulo continua fora do
   * percurso do teclado: não tem papel de item.
   *
   * `<ul>` não é filho válido de `<ul>`, então o grupo mora num `<li>` portador
   * com `role="presentation"`, que o apaga da árvore de acessibilidade para o
   * grupo continuar possuído pelo menu. Os dois níveis levam
   * `.nds-dropdown-menu-group` (`display: contents` na folha): a semântica pede
   * dois elementos onde o desenho não quer nenhum.
   */
  function buildGroup(item: ContextMenuItemDef, menu: HTMLElement): HTMLElement {
    const labelId = `${menuId}-label-${++labelCount}`;

    const carrier = document.createElement('li');
    carrier.setAttribute('role', 'presentation');
    carrier.className = 'nds-dropdown-menu-group';

    const group = document.createElement('ul');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', labelId);
    group.className = 'nds-dropdown-menu-group';
    group.dataset.slot = 'context-menu-group';

    const lbl = document.createElement('li');
    lbl.id = labelId;
    lbl.setAttribute('role', 'presentation');
    lbl.dataset.slot = 'context-menu-label';
    if (item.inset) lbl.dataset.inset = 'true';
    lbl.className = 'nds-dropdown-menu-label';
    lbl.textContent = item.label ?? '';

    group.appendChild(lbl);
    carrier.appendChild(group);
    menu.appendChild(carrier);
    return group;
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

    // O grupo ABERTO. Um rótulo abre; o separador e o rótulo seguinte fecham.
    // Item que aparece antes de qualquer rótulo continua pendurado no menu —
    // grupo sem nome não agrupa nada para quem ouve.
    let openGroup: HTMLElement | null = null;
    defs.forEach((def) => {
      const type = def.type ?? 'item';
      if (type === 'label') {
        openGroup = buildGroup(def, menu);
        return;
      }
      if (type === 'separator') {
        openGroup = null;
        buildItem(def, menu);
        return;
      }
      buildItem(def, openGroup ?? menu);
    });
    return menu;
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
    document.body.appendChild(panelEl);
    // O painel ANTES da posição: a conta mede `offsetWidth`/`offsetHeight`, e
    // nó desanexado mede zero.
    //
    // Aqui a âncora é um PONTO, não um elemento, então quem serve é a irmã de
    // `positionFloating`. Antes desta linha o `top`/`left` saía cru do
    // `clientX`/`clientY`, sem travamento nenhum: clique direito perto da borda
    // direita ou inferior punha metade do menu fora da tela.
    //
    // Um menu de contexto NÃO vira de lado — ele desliza. É `shift` puro, sem
    // `flip`: o ponto do clique é a referência que a pessoa tem na tela, e virar
    // o painel para cima do ponteiro o afastaria do gesto que o pediu. Também
    // não há `data-side` a escrever, porque não havia lado para começar.
    const { top, left } = positionFloatingAtPoint(x, y, panelEl);
    // A ORIGEM da entrada é o ponto do clique, medido dentro do painel. O painel
    // entra com zoom (`nds-menu-in`, pelo `data-state="open"`), e a folha lê a
    // origem de `--transform-origin` — o primeiro degrau da cadeia, o mesmo nome
    // que o base-ui publica. Sem ele a cadeia caía em `center` e o menu crescia
    // do MEIO, longe do ponteiro que o pediu; nada reprovava, porque `center` é
    // fallback válido. Na maioria dos cliques a origem é `0 0`, o canto que
    // encosta no ponteiro; quando a conta desliza o painel para caber, ela
    // acompanha, e o zoom continua saindo de onde a pessoa clicou.
    panelEl.style.setProperty(
      '--transform-origin',
      `${x + window.scrollX - left}px ${y + window.scrollY - top}px`,
    );
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
   * O `reason` diz por onde o menu fechou, e decide também o foco. Escape e
   * escolha de item (`escape`, `api`) devolvem o foco à área — sem isso ele cai
   * no `<body>` e quem navega por teclado perde o lugar
   * (`testes.functional.item2`). `overlay` — clique fora, Tab — NÃO devolve: ali
   * a pessoa já está indo para outro lugar, e roubar o foco de volta desfaria o
   * gesto. (O Tab leva o foco ao destino dele ANTES de chamar este fechamento.)
   */
  function close(
    reason: ContextMenuCloseReason,
    devolverFocus = reason !== 'overlay',
  ): void {
    // Já fechado: nada a fazer, e isso inclui NÃO avisar ninguém — um segundo
    // `onClose` seria um segundo `context_menu_close` no GA4.
    if (!isOpen) return;

    // Primeiro o filho: o painel dele vive no `body` e não sai junto com o pai.
    submenu.close();
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

    onClose?.(reason);
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!panelEl) return;

    const active = document.activeElement as HTMLElement | null;

    // O submenu vê a tecla PRIMEIRO, e o que ele consome não chega ao menu pai:
    // com o painel filho aberto, `Escape` fecha só ele e `ArrowLeft` volta ao
    // sub-gatilho — fechar o menu inteiro ali tiraria a pessoa de dois níveis
    // com uma tecla. `Enter`, `Espaço` e `ArrowRight` agem com o foco NO
    // sub-gatilho, e quem os escuta é o próprio elemento.
    if (submenu.handleKeydown(e)) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close('escape');
      return;
    }

    // O percurso é do painel que TEM o foco. O painel do submenu não é
    // descendente do menu pai, então nenhum dos dois recolhe os itens do outro.
    const subPanel = submenu.panel;
    const escopo = subPanel?.contains(active) ? subPanel : panelEl;
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
    } else if (isPlainTab(e)) {
      // Menu não prende o foco (C2): Tab fecha e o foco segue a página a partir
      // da ÁREA — o próximo ponto de tabulação depois dela, o anterior no
      // Shift+Tab, e a própria área quando ela é a última parada. Vale também
      // com o foco no submenu, que este ouvinte do `document` recebe igual, e aí
      // fecha a árvore inteira.
      //
      // A tecla é CONSUMIDA. Ela era deixada ao navegador, "porque o Tab é da
      // página" — e o navegador partia do fim do `body`, onde o painel vive em
      // portal: Tab saía do documento e Shift+Tab caía na última parada da
      // página (medido; ver `@/lib/tabbable`).
      //
      // O foco vai ANTES de o painel sair, para não passar pelo `<body>`; por
      // isso o `close` não devolve foco nenhum. É `overlay` e não `escape`: a
      // pessoa saiu sem decidir, como no clique fora.
      e.preventDefault();
      tabExitTarget(e, trigger).focus();
      close('overlay');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key)) {
      e.preventDefault();
      typeahead(e.key, menuItems);
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (
      !panelEl?.contains(target) &&
      !submenu.contains(target) &&
      !trigger.contains(target)
    ) {
      close('overlay');
    }
  }

  // Um evento só para os três caminhos de abertura: clique direito, tecla Menu
  // e Shift+F10. Os dois últimos o navegador entrega como `contextmenu` no
  // elemento FOCADO — é por isso que a área tem `tabindex`.
  trigger.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Um novo clique direito com o menu aberto o fecha e reabre no ponto novo.
    // O primeiro saiu sem decidir: `overlay`, como no clique fora.
    if (isOpen) close('overlay');
    open(e.clientX, e.clientY);
  });

  // O painel vive no `<body>`, fora da árvore de quem montou o componente. Quem
  // troca de tela remove o gatilho e o painel FICA — nas stories isso significa
  // o menu de uma sobrando por cima da seguinte, e a foto do Chromatic saindo
  // com dois. Nas outras stacks quem desmonta é o framework; aqui é a forma
  // compartilhada de limpeza, que antes era um observador montado por abertura.
  return tornarDestruivel(wrapper, wrapper, () => {
    // Sair da página com o menu aberto é fechamento pedido pelo produto — `api`,
    // a mesma leitura do `createAlertDialog` —, e sem devolver foco a uma área
    // que está deixando o documento.
    if (isOpen) close('api', false);
    // Cinto e suspensório: `close` já leva o painel do submenu, mas quem
    // desmonta com o menu FECHADO não passaria por ele, e o timer de carência
    // sobreviveria ao elemento que o registrou.
    submenu.destroy();
  });
}
