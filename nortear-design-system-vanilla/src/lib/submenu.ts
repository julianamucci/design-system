// ─── Submenu — o painel filho de um menu, uma implementação só ────────────────
//
// A MESMA capacidade estava escrita três vezes nesta stack — `dropdown-menu`,
// `context-menu` e `menubar` —, com três mecanismos diferentes: painel no
// `body` contra painel aninhado com `hidden`, `aria-owns` contra
// `aria-controls`, `positionFloating` contra `left: 100%` na folha, percurso do
// teclado por consulta de descendentes contra um array montado à mão. Cada
// arquivo era coerente consigo mesmo, compilava e passava nos portões: nenhum
// deles vê divergência entre arquivos, e por isso ela viveu.
//
// Este módulo é a versão que resolve mais das três, e o porquê de cada decisão
// está escrito ABAIXO, junto da decisão. Sem esses parágrafos a próxima pessoa
// refaz a escolha barata — e o defeito volta invisível, que é exatamente como
// ele chegou aqui.
//
// O que ESTE módulo faz: o gatilho (papel, ARIA, `data-slot`), o painel (id,
// portal, posição, limpeza), o teclado da WAI-ARIA APG, o ponteiro com carência
// e a destruição. O que ele NÃO faz: montar os ITENS do painel. Cada componente
// tem o seu construtor de item — marcação, escolha única, atalho, recuo — e
// puxá-los para cá obrigaria os três a compartilhar um formato de item que eles
// não compartilham. Quem chama entrega uma função que devolve o painel pronto.

import { positionFloating } from '@/lib/floating';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Carência entre sair do gatilho e o painel fechar, em ms.
 *
 * É o que resolve a travessia em DIAGONAL: quem vai do item para um item lá
 * embaixo do painel filho passa por cima dos irmãos do menu pai, e fechar no
 * `mouseleave` puro arrancaria o painel no meio do gesto. A carência é cancelada
 * ao entrar no painel ou ao voltar ao gatilho, então só fecha mesmo quem saiu e
 * ficou fora. Fechar cedo demais é pior que não fechar.
 */
const DEFAULT_CLOSE_DELAY = 300;

/** Vão entre o gatilho e o painel, em px — o padrão das fábricas de menu. */
const DEFAULT_SIDE_OFFSET = 4;

export type SubmenuOptions = {
  /**
   * `data-slot` do gatilho, que muda por componente
   * (`dropdown-menu-sub-trigger`, `context-menu-sub-trigger`,
   * `menubar-sub-trigger`).
   */
  triggerSlot: string;
  /**
   * Prefixo do `id` do painel. O controlador acrescenta `-1`, `-2`… a cada
   * abertura, porque o `id` precisa ser único no documento e o painel é criado
   * e descartado a cada vez.
   */
  panelIdPrefix: string;
  /**
   * Itens que o teclado percorre dentro de um painel.
   *
   * É do chamador porque cada componente sabe o que conta como item: dois deles
   * consultam descendentes pelos papéis de menu, o menubar guarda uma lista
   * montada na construção. O controlador só precisa do PRIMEIRO, para entrar no
   * painel quando o teclado o abre.
   */
  getItems: (panel: HTMLElement) => HTMLElement[];
  /** Vão entre gatilho e painel, em px. */
  sideOffset?: number;
  /**
   * Carência do fechamento por ponteiro, em ms. `0` desliga o fechar por
   * ponteiro — o painel então só sai por teclado, clique fora ou fechamento do
   * menu pai.
   */
  closeDelay?: number;
  /** Passar o ponteiro sobre o gatilho abre o painel. */
  openOnHover?: boolean;
  /**
   * O clique no gatilho ALTERNA em vez de só abrir. Um menu que vive aberto
   * enquanto se navega por ele (a barra de menus) quer alternar; um que abre sob
   * demanda quer só abrir, porque ali o segundo clique costuma ser o gesto de
   * quem está entrando no painel.
   */
  toggleOnClick?: boolean;
  /** O clique que abre também põe o foco no primeiro item. */
  focusOnClickOpen?: boolean;
  /**
   * Escreve `data-state="open" | "closed"` no gatilho, além do `aria-expanded`.
   * É gancho de folha de estilo, não de acessibilidade — quem anuncia o estado
   * é o `aria-expanded`, sempre presente.
   */
  writeStateAttr?: boolean;
};

export type SubmenuTriggerOptions = {
  /**
   * Monta o painel do submenu, do zero, a cada abertura.
   *
   * A cada abertura e não uma vez: o painel é medido para ser posicionado, e
   * medida de nó desanexado vale zero. Guardar um painel pronto e escondido
   * também é o que leva a aninhá-lo — ver o bloco de `open`.
   */
  buildPanel: () => HTMLElement;
  /** Gatilho indisponível não abre. Ele continua alcançável e anunciado. */
  disabled?: boolean;
};

export type SubmenuController = {
  /**
   * Registra um gatilho já montado por quem chama e devolve o MESMO elemento,
   * para que um chamador que mantém a própria lista de focáveis o registre nela
   * em uma linha.
   */
  attach: (trigger: HTMLElement, options: SubmenuTriggerOptions) => HTMLElement;
  /** Abre o painel do gatilho, fechando o que estiver aberto. */
  open: (trigger: HTMLElement, focusFirstItem?: boolean) => void;
  /** Fecha o painel aberto, se houver. */
  close: (focusTrigger?: boolean) => void;
  /**
   * Teclas que agem com o foco DENTRO do painel: `ArrowLeft` e `Escape`.
   * Devolve `true` quando consumiu o evento — quem chama para de tratar.
   *
   * `Enter`, `Espaço` e `ArrowRight` não estão aqui: eles agem com o foco no
   * gatilho, e o próprio gatilho os escuta.
   */
  handleKeydown: (event: KeyboardEvent) => boolean;
  /** O nó está dentro do painel aberto? */
  contains: (node: Node | null) => boolean;
  /** Painel aberto, ou `null`. */
  readonly panel: HTMLElement | null;
  /** Gatilho do painel aberto, ou `null`. */
  readonly trigger: HTMLElement | null;
  /** Fecha, solta os temporizadores e não abre mais. Idempotente. */
  destroy: () => void;
};

/**
 * Seta do gatilho, apontando para o lado por onde o painel sai.
 *
 * `aria-hidden` porque quem anuncia que ali há um menu filho é o
 * `aria-haspopup` do item, não o desenho. A classe é o que encosta a seta na
 * borda direita do item (`margin-left: auto` na folha compartilhada) — sem ela a
 * seta cola no rótulo.
 */
export function createSubmenuChevron(): SVGSVGElement {
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
 * Um controlador por MENU, não por gatilho.
 *
 * Um painel filho de cada vez: abrir outro fecha o anterior, que é o que evita
 * dois painéis vivos sobre o mesmo menu. O estado mora aqui porque é estado do
 * menu, não do item.
 */
export function createSubmenuController(options: SubmenuOptions): SubmenuController {
  const {
    triggerSlot,
    panelIdPrefix,
    getItems,
    sideOffset = DEFAULT_SIDE_OFFSET,
    closeDelay = DEFAULT_CLOSE_DELAY,
    openOnHover = true,
    toggleOnClick = false,
    focusOnClickOpen = false,
    writeStateAttr = false,
  } = options;

  /**
   * A configuração de cada gatilho, pelo próprio elemento.
   *
   * `WeakMap` e não busca pelo texto do rótulo: o rótulo é traduzido, e casar
   * por texto quebraria no primeiro idioma que não fosse o pt-BR.
   */
  const registry = new WeakMap<HTMLElement, SubmenuTriggerOptions>();

  let panelEl: HTMLElement | null = null;
  let triggerEl: HTMLElement | null = null;
  let panelCount = 0;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  function cancelClose(): void {
    if (closeTimer === null) return;
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  function scheduleClose(): void {
    if (closeDelay <= 0) return;
    if (!panelEl) return;
    cancelClose();
    closeTimer = setTimeout(() => {
      closeTimer = null;
      // O foco manda sobre o ponteiro: quem entrou no painel pela seta não pode
      // perdê-lo porque o mouse estava parado noutro canto da tela.
      if (panelEl?.contains(document.activeElement)) return;
      close();
    }, closeDelay);
  }

  function markTrigger(trigger: HTMLElement, open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open));
    if (writeStateAttr) trigger.dataset.state = open ? 'open' : 'closed';
  }

  function focusFirstItem(): void {
    if (!panelEl) return;
    getItems(panelEl)[0]?.focus();
  }

  /**
   * Abre o painel do `trigger`, fechando o que estiver aberto.
   *
   * O PAINEL VAI PARA O `<body>`, fora da árvore do menu pai, e isto é a decisão
   * central deste módulo:
   *
   *   • O percurso do teclado de um menu sai de uma consulta de DESCENDENTES
   *     sobre os papéis de item. Com o painel aninhado, a seta do menu pai passa
   *     a percorrer os itens do filho — e o defeito só aparece com o submenu
   *     ABERTO, que é o pior formato possível, porque a story fechada continua
   *     verde e nenhum portão desta casa abre o submenu por conta própria.
   *   • Painel aninhado é recortado pelo `overflow` de qualquer ancestral.
   *     Escapa-se disso declarando `overflow: visible` no caminho inteiro — o
   *     que segura até alguém pôr uma rolagem no meio do caminho, e aí o painel
   *     some sem nada no DOM denunciando.
   *
   * O preço de portar o painel é a ligação perdida: o item diz que abriu um menu
   * e nada aponta para o menu que ele abriu. Quem a repõe é `aria-owns` no
   * gatilho, escrito aqui e retirado no fechamento. `aria-controls` NÃO serve
   * neste caso — ele é a ligação certa para o painel ANINHADO; para painel fora
   * da árvore, quem devolve a relação de posse é `aria-owns`. Não são
   * alternativas de gosto: cada uma serve ao seu caso, e este módulo só tem um.
   *
   * A posição sai de `positionFloating`, a mesma conta do popover e do tooltip.
   * Posicionar pela folha (`left: 100%`) é o que faz o painel sair da tela perto
   * da borda da janela: CSS não sabe medir a janela nem virar o lado quando não
   * cabe. A conta compartilhada trava o eixo cruzado na área visível e, AQUI,
   * também vira o lado quando o oposto cabe melhor — o `flip` é opcional lá e
   * este é o único chamador que o pede.
   */
  function open(trigger: HTMLElement, focusFirst = false): void {
    if (destroyed) return;
    cancelClose();

    const config = registry.get(trigger);
    if (!config || config.disabled) return;

    // Já aberto neste gatilho: não remonta o painel, mas ainda entra nele se foi
    // isso que pediram — a tecla que abre e a que entra são a mesma.
    if (triggerEl === trigger && panelEl) {
      if (focusFirst) focusFirstItem();
      return;
    }

    close();

    const panel = config.buildPanel();
    // O `id` existe para o `aria-owns` ter para onde apontar: com o painel fora
    // da árvore do menu pai, é a única coisa que liga o item ao menu que abriu.
    panel.id = `${panelIdPrefix}-${++panelCount}`;
    document.body.appendChild(panel);
    // Sempre pela DIREITA, encostado no topo do item: é de onde o submenu sai em
    // todo menu do sistema, e é o que a seta do gatilho desenha.
    //
    // `flip` LIGADO, e este é o único chamador que o liga. O eixo principal de
    // `side: 'right'` é o horizontal, e o travamento do `positionFloating` age
    // só no cruzado: perto da borda direita da janela o painel continuava
    // saindo da tela, e foi por isso que a migração do menubar não fechou o
    // defeito por inteiro. Virar para a esquerda é o que todo menu de sistema
    // faz ali, e o item continua ao lado do painel — a relação que a seta do
    // gatilho promete.
    //
    // Quem escreve o `data-side` do painel do submenu passa a ser a conta, não
    // quem montou: dois dos três chamadores nem o escreviam, e o terceiro
    // (menubar) cravava `right` na construção, antes de existir medida. Depois
    // da troca esse valor estaria mentindo.
    positionFloating(trigger, panel, 'right', 'start', sideOffset, { flip: true });

    if (closeDelay > 0) {
      panel.addEventListener('mouseenter', cancelClose);
      panel.addEventListener('mouseleave', scheduleClose);
    }

    markTrigger(trigger, true);
    trigger.setAttribute('aria-owns', panel.id);

    panelEl = panel;
    triggerEl = trigger;

    if (focusFirst) focusFirstItem();
  }

  /** Fecha o painel e desfaz a ligação que só vale enquanto ele existe. */
  function close(focusTrigger = false): void {
    cancelClose();
    panelEl?.remove();
    panelEl = null;
    const previous = triggerEl;
    if (previous) {
      markTrigger(previous, false);
      // `aria-owns` sai junto: apontar para um painel que já não está no
      // documento é pior que não apontar para nada.
      previous.removeAttribute('aria-owns');
    }
    triggerEl = null;
    if (focusTrigger) previous?.focus();
  }

  function attach(trigger: HTMLElement, config: SubmenuTriggerOptions): HTMLElement {
    registry.set(trigger, config);

    // O gatilho é um `menuitem` COMO OS OUTROS: entra na roda das setas do menu
    // pai, e é isso que o mantém alcançável por quem não usa mouse. O que ele
    // acrescenta é o par `aria-haspopup`/`aria-expanded` — e, com o painel
    // aberto, o `aria-owns` que aponta para ele.
    trigger.setAttribute('role', 'menuitem');
    trigger.setAttribute('aria-haspopup', 'menu');
    // `tabindex` mesmo no indisponível: sem ele o `focus()` da seta é no-op, e o
    // item ficaria na lista de candidatos sem nunca receber o foco — a roda
    // pareceria pular um passo em vez de pousar.
    trigger.setAttribute('tabindex', '-1');
    trigger.dataset.slot = triggerSlot;
    markTrigger(trigger, false);

    if (openOnHover) trigger.addEventListener('mouseenter', () => open(trigger));
    if (closeDelay > 0) trigger.addEventListener('mouseleave', scheduleClose);

    trigger.addEventListener('click', (event) => {
      // Clique abre em vez de escolher: o gatilho não tem ação própria, e fechar
      // o menu aqui descartaria o que a pessoa veio buscar.
      event.stopPropagation();
      if (toggleOnClick && triggerEl === trigger && panelEl) {
        close(true);
        return;
      }
      open(trigger, focusOnClickOpen);
    });

    trigger.addEventListener('keydown', (event) => {
      // `ArrowRight` abre e ENTRA; `Enter` e `Espaço` também, como pede a
      // WAI-ARIA APG. Abrir sem entrar deixaria a pessoa vendo um painel que a
      // seta seguinte não percorre — o percurso do teclado sai do painel que tem
      // o foco.
      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(trigger, true);
      }
    });

    return trigger;
  }

  function handleKeydown(event: KeyboardEvent): boolean {
    const active = document.activeElement;

    // Com submenu aberto, `Escape` fecha SÓ o submenu e devolve o foco ao
    // gatilho: fechar o menu inteiro aqui tiraria a pessoa de dois níveis com
    // uma tecla, e o `Escape` seguinte é que fecha o menu.
    if (event.key === 'Escape' && panelEl) {
      event.preventDefault();
      close(true);
      return true;
    }

    if (event.key === 'ArrowLeft' && panelEl?.contains(active)) {
      event.preventDefault();
      close(true);
      return true;
    }

    return false;
  }

  function contains(node: Node | null): boolean {
    return node !== null && panelEl !== null && panelEl.contains(node);
  }

  return {
    attach,
    open,
    close,
    handleKeydown,
    contains,
    get panel() {
      return panelEl;
    },
    get trigger() {
      return triggerEl;
    },
    // Nada pode sobrar no `body` depois disto: o painel é portalado, então quem
    // desmonta o menu sem fechá-lo antes deixaria um menu órfão na tela sem
    // ninguém com referência para removê-lo.
    destroy: () => {
      destroyed = true;
      close();
    },
  };
}
