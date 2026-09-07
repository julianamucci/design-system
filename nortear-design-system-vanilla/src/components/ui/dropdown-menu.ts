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
 * - Rótulo de seção: dá o nome acessível a um `role="group"` por
 *   `aria-labelledby`, e continua fora do percurso do teclado. Esta fábrica era
 *   a única sem o grupo — o rótulo ficava `role="presentation"` solto, e o nome
 *   não era conferido a nada. Corrigido em 2026-09-07.
 * - Setas cima/baixo andam item a item; `Home` e `End` vão às pontas; digitar
 *   um caractere salta para o item que começa com ele (typeahead).
 * - `Escape` fecha e DEVOLVE o foco ao gatilho.
 * - Nenhuma região viva. Menu não é anúncio: quem narra a mudança de foco é o
 *   percurso do próprio leitor de tela, e um `aria-live` aqui duplicaria a fala.
 *
 * O item DESABILITADO: a seta POUSA nele, nas cinco.
 *
 *   DECISÃO tomada em 2026-09-02, e não mais uma divergência aceita. A WAI-ARIA
 *   APG recomenda manter o item desabilitado alcançável pela seta para que ele
 *   seja ANUNCIADO: some-lo da roda esconde de quem navega de ouvido que a opção
 *   existe e está indisponível. Pular poupa uma parada a quem enxerga; sumir
 *   custa a informação a quem não enxerga, e é esse lado que o design system
 *   escolheu. O que o item desabilitado não faz, em nenhuma stack, é ATIVAR.
 *
 *   Antes desta decisão três stacks pulavam e duas pousavam. Cada lib crava a
 *   escolha no próprio seletor de candidatos, sem prop que a inverta — por isso
 *   duas das três só se alinharam por PATCH, e é o mecanismo de cada uma:
 *
 *     já pousavam, sem alteração nenhuma
 *       base-ui  — `menu/item/useMenuItem`, `useButton({ focusableWhenDisabled: true })`,
 *                  e `menu/root/MenuRoot` chama `useListNavigation` com
 *                  `disabledIndices: EMPTY_ARRAY` (nenhum índice é "desabilitado")
 *       radix-ng — `getCompositeMenuItems()` filtra a lista só por VISIBILIDADE;
 *                  `disabled` não tira o item dela
 *
 *     passaram a pousar, e como
 *       vanilla — código nosso: o seletor daqui perdeu o
 *                 `:not([aria-disabled="true"])` e o item desabilitado passou a
 *                 receber `tabindex` (sem ele o `focus()` seria no-op). O mesmo
 *                 no `menubar`; o `context-menu` já pousava.
 *       reka-ui — `patches/reka-ui+2.10.3.patch`: `Menu/MenuContentImpl` chama
 *                 `useArrowNavigation` com
 *                 `attributeName: '[data-reka-collection-item]'`, sem o
 *                 `:not([data-disabled])`, nos dois pontos de navegação.
 *       bits-ui — `patches/bits-ui+2.19.0.patch`: em `bits/menu/menu.svelte.js`
 *                 a seta NÃO passa por `#getCandidateNodes` — quem a atende é
 *                 `RovingFocusGroup`, e o seletor dele vem de `candidateAttr`,
 *                 que embute `:not([data-disabled])`. O patch passa a informar
 *                 `candidateSelector` (que tem precedência) e tira o filtro
 *                 também de `#getCandidateNodes`, que serve typeahead e
 *                 `Home`/`End`.
 *
 *   Os dois patches são de arquivo cujo NOME carrega a versão: subiu a versão, o
 *   patch para de aplicar em silêncio. O portão que reprova nesse caso é
 *   `src/lib/patches-aplicados.test.ts`, em cada stack que tem `patches/`.
 *
 *   A promessa agora é cobrável: `testes.accessibility` do conteúdo
 *   compartilhado tem um item para ela em `dropdown-menu`, `context-menu` e
 *   `menubar`, e a story `ItemDisabled` de cada stack aperta a seta e verifica
 *   ONDE o foco pousa — nunca a mera presença de `tabindex`, que a diretiva liga
 *   em todo item e por isso não reprovaria nunca.
 *
 * O SUBMENU, que esta fábrica passou a ter em 2026-09-07: o sub-gatilho é um
 * `menuitem` com `aria-haspopup="menu"` e `aria-expanded`, e o painel filho é
 * anexado ao `<body>`, FORA da árvore do menu pai.
 *
 *   O MECANISMO MORA EM `@/lib/submenu`, e não mais aqui. A mesma capacidade
 *   estava escrita três vezes nesta stack, com três mecanismos diferentes — e
 *   nenhum portão vê divergência entre arquivos. O auxiliar saiu DAQUI, que era
 *   a versão que resolvia mais: painel no `body`, `aria-owns`,
 *   `positionFloating`, carência de ponteiro. O porquê de cada decisão está
 *   escrito lá, junto da decisão; o resumo que fica aqui é o contrato.
 *
 *   Fora da árvore de propósito. O percurso do teclado sai de `getMenuItems`,
 *   que é consulta de DESCENDENTES sobre os três papéis de item: com o painel
 *   aninhado, a seta do menu pai passaria a percorrer os itens do filho, e o
 *   defeito só apareceria com o submenu ABERTO — o pior formato, porque a story
 *   fechada continua verde.
 *
 *   O preço de portar o painel é a ligação perdida: o item diz que abriu um
 *   menu e nada aponta para o menu que ele abriu. Quem a repõe é `aria-owns` no
 *   sub-gatilho, escrito na abertura e retirado no fechamento. Sem ele o
 *   submenu é, para quem lê a tela, um menu solto no `body`.
 *
 *   Teclado, como pede a WAI-ARIA APG: `ArrowRight` no sub-gatilho abre e põe o
 *   foco no primeiro item do filho; `ArrowLeft` dentro do filho fecha e devolve
 *   o foco ao sub-gatilho; `Escape` com submenu aberto fecha SÓ o submenu —
 *   fechar o menu inteiro ali tiraria a pessoa de dois níveis com uma tecla.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';
import {
  positionFloating,
  type FloatingAlign,
  type FloatingSide,
} from '@/lib/floating';
import { createSubmenuChevron, createSubmenuController } from '@/lib/submenu';

export type DropdownMenuSide = FloatingSide;
export type DropdownMenuAlign = FloatingAlign;

export type DropdownMenuItemDef = {
  /** `item` é o padrão. `submenu` exige `items`. */
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu';
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
  /** Itens do submenu. Obrigatório quando `type: 'submenu'`. */
  items?: DropdownMenuItemDef[];
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

// A seta do sub-gatilho vive em `@/lib/submenu` (`createSubmenuChevron`): ela é
// a mesma nos três menus desta stack, e o desenho acompanha o mecanismo que o
// justifica.

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _dropdownCounter = 0;

// A carência de fechamento por ponteiro — a que resolve a travessia em diagonal
// do item até o painel filho — é o padrão de `@/lib/submenu`, com o motivo
// escrito lá.

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

  // ── Submenu ─────────────────────────────────────────────────────────────────
  // Um controlador por menu, e um painel filho de cada vez: abrir outro fecha o
  // anterior. Gatilho, painel, posição, ARIA, teclado, ponteiro e limpeza são
  // dele; o que continua sendo desta fábrica é montar os ITENS, que é o que cada
  // menu tem de próprio.
  const submenu = createSubmenuController({
    triggerSlot: 'dropdown-menu-sub-trigger',
    panelIdPrefix: `${menuId}-sub`,
    getItems: getMenuItems,
    sideOffset,
  });

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dropdown-menu';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);

  /**
   * Monta um painel de menu a partir de uma lista de definições.
   *
   * Serve ao menu RAIZ e ao painel do submenu — a folha é a mesma
   * (`.nds-dropdown-menu-content`), e o que distingue os dois é o `data-slot`.
   * O que só vale para a raiz é o `id` (para onde o `aria-controls` do gatilho
   * aponta), a classe de quem chamou e o par lado/encosto.
   */
  function buildMenu(defs: DropdownMenuItemDef[], slot: string): HTMLElement {
    const isRoot = slot === 'dropdown-menu-content';
    const menu = document.createElement('ul');
    if (isRoot) menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className = cn('nds-dropdown-menu-content', isRoot ? options.class : undefined);
    menu.dataset.slot = slot;
    // Lado e encosto escolhidos ficam legíveis no markup, como nas outras
    // stacks. É por eles que uma story prova que a opção chegou ao painel sem
    // depender de medir pixels. O painel do submenu não os leva: ele não sai do
    // gatilho do componente, e sim do item que o abriu.
    if (isRoot) {
      menu.dataset.side = side;
      menu.dataset.align = align;
    }

    // O grupo ABERTO. Um rótulo abre; o separador e o rótulo seguinte fecham.
    // Item que aparece antes de qualquer rótulo continua pendurado no menu, que
    // é onde ele já estava — grupo sem nome não agrupa nada para quem ouve.
    let openGroup: HTMLElement | null = null;
    let labelCount = 0;

    defs.forEach((item) => {
      const type = item.type ?? 'item';

      if (type === 'separator') {
        const sep = document.createElement('li');
        sep.setAttribute('role', 'separator');
        sep.className = 'nds-dropdown-menu-separator';
        openGroup = null;
        menu.appendChild(sep);
        return;
      }

      if (type === 'label') {
        // O rótulo NOMEIA um bloco — e nomear exige que exista um bloco. Ele
        // era um `role="presentation"` solto: o texto do rótulo não chegava a
        // nome acessível de coisa alguma, e o conteúdo compartilhado promete o
        // contrário. O rótulo segue não sendo item focável; o que ganha nome é
        // o `role="group"` que passa a envolver os itens seguintes.
        openGroup = null;
        const labelId = `${menuId}-label-${++labelCount}`;

        // `<ul>` não é filho válido de `<ul>`: o portador existe pelo HTML, e o
        // `role="presentation"` o apaga da árvore de acessibilidade para que o
        // grupo continue sendo possuído pelo menu.
        // `.nds-dropdown-menu-group` nos DOIS níveis: quem tira a caixa dos
        // dois do layout é a folha compartilhada, e o porquê está escrito lá.
        // Era `display: contents` inline aqui, por a classe não existir; ela
        // passou a existir em 2026-09-07.
        const carrier = document.createElement('li');
        carrier.setAttribute('role', 'presentation');
        carrier.className = 'nds-dropdown-menu-group';

        const group = document.createElement('ul');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-labelledby', labelId);
        group.className = 'nds-dropdown-menu-group';
        group.dataset.slot = 'dropdown-menu-group';

        const lbl = document.createElement('li');
        lbl.id = labelId;
        lbl.setAttribute('role', 'presentation');
        lbl.className = 'nds-dropdown-menu-label';
        lbl.textContent = item.label ?? '';

        group.appendChild(lbl);
        carrier.appendChild(group);
        menu.appendChild(carrier);
        openGroup = group;
        return;
      }

      if (type === 'submenu') {
        // Aqui esta fábrica monta só o que é DELA: a caixa do item, o rótulo e a
        // seta. Papel, `aria-haspopup`, `aria-expanded`, `data-slot`, ponteiro e
        // teclado entram com `attach` — o sub-gatilho é um `menuitem` como os
        // outros, e continua na roda das setas do menu pai.
        const li = document.createElement('li');
        li.className = 'nds-dropdown-menu-sub-trigger';
        if (item.value) li.dataset.value = item.value;

        const text = document.createElement('span');
        text.textContent = item.label ?? '';
        li.appendChild(text);
        li.appendChild(createSubmenuChevron());

        // O painel é montado a cada abertura, e por `buildMenu`: o submenu tem
        // os mesmos tipos de item do menu raiz, e o que distingue os dois no
        // markup é o `data-slot`.
        submenu.attach(li, {
          buildPanel: () => buildMenu(item.items ?? [], 'dropdown-menu-sub-content'),
        });

        (openGroup ?? menu).appendChild(li);
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
      // `tabindex` em TODO item, inclusive no desabilitado: sem ele o `focus()`
      // das setas é no-op, e o item ficaria na lista de candidatos sem nunca
      // receber o foco — a roda pareceria pular um passo em vez de pousar.
      li.setAttribute('tabindex', '-1');
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

      // Dentro do grupo aberto, se houver um. `menu.querySelectorAll` continua
      // alcançando o item de qualquer profundidade, e em ordem de documento —
      // é por isso que o percurso do teclado não sente a mudança.
      (openGroup ?? menu).appendChild(li);
    });

    return menu;
  }

  function getMenuItems(menu: HTMLElement): HTMLElement[] {
    // Os três papéis navegam junto: uma lista de ações que mistura alternadores
    // e escolha única continua sendo uma lista só para quem usa as setas.
    //
    // O item DESABILITADO fica na roda. Ele era filtrado aqui por
    // `:not([aria-disabled="true"])`, e sair da roda escondia de quem navega de
    // ouvido que a opção existe — a WAI-ARIA APG pede o contrário. O que ele não
    // faz é ATIVAR, e isso não depende deste seletor: item desabilitado não
    // recebe ouvinte de `click` nem de `keydown`, e o CSS já lhe tira o ponteiro.
    //
    // O `role="group"` do rótulo NÃO entra aqui, e é de propósito: os três
    // papéis listados são os únicos que a seta pousa. O seletor é de
    // DESCENDENTE, então o item continua sendo encontrado dentro do grupo, e em
    // ordem de documento — a roda do teclado não sabe que o grupo existe.
    return Array.from(
      menu.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
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

    panelEl = buildMenu(items, 'dropdown-menu-content');
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

    // Primeiro o filho: o painel dele vive no `body` e não sai junto com o pai.
    submenu.close();
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
    // O painel do submenu também é "dentro": ele vive no `body`, fora de
    // `panelEl`, e sem esta linha o clique num item do submenu seria consumido
    // pelo bloqueador e dispensaria o menu em vez de escolher.
    if (panelEl?.contains(target) || submenu.contains(target) || wrapper.contains(target)) return;
    e.preventDefault();
    e.stopPropagation();
    // A dispensa sai no `click`, o último do gesto: dispensar antes desmontaria
    // os bloqueadores no meio da sequência e soltaria o resto dela na página.
    if (e.type === 'click') pedirChange(false);
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
      pedirChange(false);
      // O foco só volta se o menu de fato saiu: no modo controlado quem fecha é
      // quem chama, e devolver o foco antes disso o tiraria de dentro de um
      // menu que continua na tela.
      if (!isOpen) trigger.focus();
      return;
    }

    // O percurso é do painel que TEM o foco. O painel do submenu não é
    // descendente do menu pai, então nenhum dos dois recolhe os itens do outro.
    const subPanel = submenu.panel;
    const scope = subPanel?.contains(active) ? subPanel : panelEl;
    const menuItems = getMenuItems(scope);
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
      pedirChange(false);
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
      // Cinto e suspensório: `close` já leva o painel do submenu, mas quem
      // desmonta com o menu FECHADO não passaria por ele, e o timer de carência
      // sobreviveria ao elemento que o registrou.
      submenu.destroy();
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
