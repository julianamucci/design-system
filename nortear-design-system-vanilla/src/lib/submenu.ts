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

import { autoUpdateFloating, positionFloating, type FloatingSide } from '@/lib/floating';

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

/**
 * Vão do submenu no eixo PRINCIPAL, em px — D15 do PRD do DropdownMenu.
 *
 * `0` encosta o subpainel no painel pai. Era `4`, e o `4` não vinha de decisão
 * nenhuma: era o `sideOffset` do menu RAIZ repassado pelo `dropdown-menu`, que
 * é o vão entre um gatilho e o painel que desce dele — outra relação. Submenu
 * não desce de um botão, ele sai da lateral de um painel que já está na tela, e
 * ali o vão separa duas superfícies que a pessoa lê como uma continuação.
 */
const DEFAULT_SIDE_OFFSET = 0;

/**
 * Vão do submenu no eixo do ALINHAMENTO, em px — a outra metade da D15.
 *
 * O que a D15 fixa é um RESULTADO, não um número: o TOPO DO PRIMEIRO ITEM do
 * submenu alinha com o topo do sub-gatilho que o abriu, e não com a borda da
 * caixa — que é meio item acima. Cada stack mede o número que produz esse
 * resultado, porque cada uma parte de uma linha de base diferente.
 *
 * Aqui a linha de base é NOSSA, e por isso ela é conhecida: `positionFloating`
 * com `align: 'start'` ancora a BORDA da caixa do painel no topo do gatilho
 * (`top = anchor.top`), e do topo do painel ao topo do primeiro item há
 * `border: 1px` MAIS `padding: var(--spacing-1)` de `.nds-dropdown-menu-content`
 * — **5px, não 4**. Medido em 2026-09-19 nos três membros, dígito a dígito
 * iguais entre eles:
 *
 *   alignOffset   topo do painel − topo do gatilho   topo do 1º item − idem
 *        0                   0,00                          +5,00
 *       -2                  -2,00                          +3,00
 *       -4                  -4,00                          +1,00
 *       -5                  -5,00                           0,00  ← alinhado
 *
 * O `-4` que esteve aqui até 2026-09-19 derivava só do `--spacing-1` e
 * ESQUECIA a borda: ele deixava o item 1px abaixo do gatilho, perto o bastante
 * para ninguém ver e longe o bastante para não ser o desenho pedido.
 *
 * Constante, e não opção: o número é de design system (a mesma leitura da D12,
 * que fixou o vão do Menubar em 8 e o do DropdownMenu em 4), e os três menus
 * desta stack desenham o mesmo submenu.
 */
const ALIGN_OFFSET = -5;

/**
 * A ORIGEM do zoom de entrada é a borda que encosta no item, na altura do item:
 * à esquerda do painel quando ele sai pela direita, à direita quando o `flip` o
 * virou. A folha compartilhada lê `--transform-origin` como primeiro degrau da
 * cadeia (o nome que o base-ui publica), e sem ele caía em `center` — o submenu
 * crescia do MEIO, em silêncio, porque `center` é fallback válido. É custom
 * property: onde a folha do painel não a lê (ou o painel não anima a entrada),
 * ela não muda nada.
 *
 * A altura sai do `top` que a conta acabou de escrever, e não de medir o painel:
 * a caixa dele pode estar no primeiro quadro da animação, com o `scale`
 * aplicado. Refeita a cada reposição, porque o lado e o `top` podem mudar.
 */
function writeTransformOrigin(trigger: HTMLElement, panel: HTMLElement, side: FloatingSide): void {
  const originY = trigger.getBoundingClientRect().top + window.scrollY - parseFloat(panel.style.top);
  panel.style.setProperty(
    '--transform-origin',
    `${side === 'left' ? '100%' : '0px'} ${Math.max(0, originY)}px`,
  );
}

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
  /**
   * Vão entre gatilho e painel, em px. Padrão `0` (D15) — nenhum dos três menus
   * desta stack o informa, e a opção fica para quem tiver medida em contrário.
   */
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
   *
   * Vale para gatilho de QUALQUER nível: um sub-gatilho montado dentro do
   * painel de um submenu é registrado no mesmo controlador, e abre o nível de
   * baixo — ver o bloco de `createSubmenuController`.
   */
  attach: (trigger: HTMLElement, options: SubmenuTriggerOptions) => HTMLElement;
  /**
   * Abre o painel do gatilho no nível dele, fechando o que estiver aberto
   * naquele nível e abaixo.
   */
  open: (trigger: HTMLElement, focusFirstItem?: boolean) => void;
  /**
   * Fecha TODOS os painéis abertos, se houver. Com `focusTrigger`, o foco vai
   * ao gatilho do primeiro nível — o item do menu do componente.
   */
  close: (focusTrigger?: boolean) => void;
  /**
   * Teclas que agem com o foco DENTRO de um painel: `ArrowLeft` e `Escape`.
   * Devolve `true` quando consumiu o evento — quem chama para de tratar.
   *
   * `Enter`, `Espaço` e `ArrowRight` não estão aqui: eles agem com o foco no
   * gatilho, e o próprio gatilho os escuta.
   */
  handleKeydown: (event: KeyboardEvent) => boolean;
  /** O nó está dentro de algum painel aberto, de qualquer nível? */
  contains: (node: Node | null) => boolean;
  /**
   * O painel aberto que contém o nó, ou `null`. É o que decide o percurso das
   * setas: ele é do painel que tem o foco, e nenhum nível recolhe os itens de
   * outro.
   */
  panelContaining: (node: Node | null) => HTMLElement | null;
  /** Painel aberto mais fundo, ou `null`. */
  readonly panel: HTMLElement | null;
  /** Gatilho do painel aberto mais fundo, ou `null`. */
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
 * Um painel por NÍVEL: abrir outro no mesmo nível fecha o anterior e tudo o que
 * estava aberto abaixo dele, que é o que evita dois painéis vivos sobre o mesmo
 * menu. O estado mora aqui porque é estado do menu, não do item.
 *
 * SUBMENU DENTRO DE SUBMENU, desde 2026-09-11. Os painéis abertos são uma PILHA,
 * e o nível de um gatilho é o painel aberto que o contém — nenhum, para o item
 * do menu do componente. Até então o controlador guardava um painel só: um
 * sub-gatilho montado dentro do painel filho, ao abrir, fechava o próprio painel
 * que o continha. O conteúdo compartilhado do Menubar mostra esse aninhamento
 * VIVO no lado "evite" do Do & Don't (o assunto do par é justamente que ele
 * confunde), e as quatro libs o permitem; o que faltava era esta pilha.
 *
 * O que muda por nível, e por quê:
 *
 *   • `Escape` fecha só o nível mais fundo, e `ArrowLeft` fecha o nível que tem
 *     o foco — a WAI-ARIA APG pede um nível por tecla, e fechar a pilha inteira
 *     tiraria a pessoa de três níveis com um toque.
 *   • A carência do ponteiro sabe DE QUE NÍVEL veio: entrar num painel só a
 *     cancela se ela fecharia aquele painel. Sair do filho de volta para o pai
 *     agenda o fechamento do filho, e entrar no pai não o cancela — sem isto o
 *     neto ficava aberto sob um ponteiro que já tinha voltado.
 *   • `close()` fecha a pilha inteira: é o que os três menus chamam quando o
 *     menu deles sai, e um neto que sobrevivesse ao avô seria um menu órfão no
 *     `body`.
 */
// PATCH: api — submenu dentro de submenu, por pilha de níveis (ver PATCHES.md#vanilla-submenu-nested-levels)
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

  /** Os painéis abertos, do primeiro nível ao mais fundo. */
  const levels: Array<{ trigger: HTMLElement; panel: HTMLElement; stopAutoUpdate: () => void }> = [];
  let panelCount = 0;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Nível que o fechamento agendado vai fechar (ele e os de baixo). */
  let closeTimerLevel = -1;
  let destroyed = false;

  /**
   * O nível em que o painel deste gatilho abre: um abaixo do painel aberto que
   * contém o gatilho, ou o primeiro, para o item do menu do componente.
   */
  function levelOf(trigger: HTMLElement): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (levels[i].panel.contains(trigger)) return i + 1;
    }
    return 0;
  }

  function cancelClose(): void {
    if (closeTimer === null) return;
    clearTimeout(closeTimer);
    closeTimer = null;
    closeTimerLevel = -1;
  }

  function scheduleClose(level: number): void {
    if (closeDelay <= 0) return;
    if (levels.length <= level) return;
    cancelClose();
    closeTimerLevel = level;
    closeTimer = setTimeout(() => {
      closeTimer = null;
      closeTimerLevel = -1;
      // O foco manda sobre o ponteiro: quem entrou no painel pela seta não pode
      // perdê-lo porque o mouse estava parado noutro canto da tela.
      if (levels.slice(level).some((l) => l.panel.contains(document.activeElement))) return;
      closeFrom(level);
    }, closeDelay);
  }

  function markTrigger(trigger: HTMLElement, open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open));
    if (writeStateAttr) trigger.dataset.state = open ? 'open' : 'closed';
  }

  function focusFirstItem(panel: HTMLElement): void {
    getItems(panel)[0]?.focus();
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

    const level = levelOf(trigger);

    // Já aberto neste gatilho: não remonta o painel, mas ainda entra nele se foi
    // isso que pediram — a tecla que abre e a que entra são a mesma.
    const current = levels[level];
    if (current?.trigger === trigger) {
      if (focusFirst) focusFirstItem(current.panel);
      return;
    }

    // O que estava aberto NESTE nível sai, com tudo abaixo dele; o nível de cima
    // — o painel que contém este gatilho — continua.
    closeFrom(level);

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
    //
    // A conta e a origem do zoom são UMA função porque rodam de novo a cada
    // rolagem, redimensionamento da janela ou mudança de tamanho do item ou do
    // painel, enquanto o painel está aberto (`autoUpdateFloating`, logo abaixo):
    // perto da borda, rolar pode ser o que vira o lado, e a origem segue o lado.
    const place = (): void => {
      const side = positionFloating(trigger, panel, 'right', 'start', sideOffset, {
        flip: true,
        alignOffset: ALIGN_OFFSET,
      });
      writeTransformOrigin(trigger, panel, side);
    };
    place();

    // Acompanhamento ligado aqui e desligado em `closeFrom`, junto do painel. O
    // gatilho já aberto voltou lá em cima sem remontar nada, então este ponto só
    // é alcançado por painel NOVO — não há segundo acompanhamento do mesmo.
    const stopAutoUpdate = autoUpdateFloating(trigger, panel, place);

    if (closeDelay > 0) {
      // Entrar no painel só cancela o fechamento que o levaria junto: o que foi
      // agendado para um nível ABAIXO dele (o ponteiro voltou do neto para o
      // filho) segue valendo, senão o neto ficava aberto sem ninguém nele.
      panel.addEventListener('mouseenter', () => {
        if (closeTimerLevel <= level) cancelClose();
      });
      panel.addEventListener('mouseleave', () => scheduleClose(level));
    }

    markTrigger(trigger, true);
    trigger.setAttribute('aria-owns', panel.id);

    levels.push({ trigger, panel, stopAutoUpdate });

    if (focusFirst) focusFirstItem(panel);
  }

  /**
   * Fecha o painel do nível `level` e todos os de baixo, e desfaz a ligação que
   * só vale enquanto cada um existe. Do mais fundo para cima: o neto não pode
   * ficar no `body` depois de o filho sair.
   */
  function closeFrom(level: number, focusTrigger = false): void {
    if (closeTimerLevel >= level) cancelClose();
    let shallowest: HTMLElement | null = null;
    while (levels.length > level) {
      const { trigger, panel, stopAutoUpdate } = levels.pop()!;
      // Antes de remover o painel: um quadro já agendado não pode medir um nó
      // que saiu do documento.
      stopAutoUpdate();
      panel.remove();
      markTrigger(trigger, false);
      // `aria-owns` sai junto: apontar para um painel que já não está no
      // documento é pior que não apontar para nada.
      trigger.removeAttribute('aria-owns');
      shallowest = trigger;
    }
    if (focusTrigger) shallowest?.focus();
  }

  /** Fecha a pilha inteira — o que cada menu chama quando ele próprio sai. */
  function close(focusTrigger = false): void {
    cancelClose();
    closeFrom(0, focusTrigger);
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
    if (closeDelay > 0) trigger.addEventListener('mouseleave', () => scheduleClose(levelOf(trigger)));

    trigger.addEventListener('click', (event) => {
      // Clique abre em vez de escolher: o gatilho não tem ação própria, e fechar
      // o menu aqui descartaria o que a pessoa veio buscar.
      event.stopPropagation();
      const level = levelOf(trigger);
      if (toggleOnClick && levels[level]?.trigger === trigger) {
        closeFrom(level, true);
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

    // Com submenu aberto, `Escape` fecha SÓ o mais fundo e devolve o foco ao
    // gatilho dele: fechar o menu inteiro aqui tiraria a pessoa de dois níveis
    // com uma tecla, e o `Escape` seguinte é que fecha o nível de cima.
    if (event.key === 'Escape' && levels.length > 0) {
      event.preventDefault();
      closeFrom(levels.length - 1, true);
      return true;
    }

    // `ArrowLeft` fecha o nível que TEM o foco — e, com ele, o que estiver
    // aberto abaixo —, e devolve o foco ao item que o abriu.
    const level = levels.findIndex((l) => l.panel.contains(active));
    if (event.key === 'ArrowLeft' && level >= 0) {
      event.preventDefault();
      closeFrom(level, true);
      return true;
    }

    return false;
  }

  function panelContaining(node: Node | null): HTMLElement | null {
    if (node === null) return null;
    return levels.find((l) => l.panel.contains(node))?.panel ?? null;
  }

  function contains(node: Node | null): boolean {
    return panelContaining(node) !== null;
  }

  return {
    attach,
    open,
    close,
    handleKeydown,
    contains,
    panelContaining,
    get panel() {
      return levels.at(-1)?.panel ?? null;
    },
    get trigger() {
      return levels.at(-1)?.trigger ?? null;
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
