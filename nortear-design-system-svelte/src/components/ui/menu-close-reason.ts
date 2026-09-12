// Arquivo próprio, ao lado das três pastas de menu, e não dentro de uma delas:
// serve os TRÊS membros da família — o ContextMenu, o DropdownMenu e o Menubar.
// Um tradutor só é o que garante que o mesmo gesto chegue ao GA4 com a mesma
// palavra nos três eventos de fechamento. É a forma do
// `menu-close-reason.ts` do React e do Angular.
//
// Cada índice de peça o reexporta, para quem consome importar do barril do
// componente que está usando.

/**
 * Por qual caminho um menu da família fechou, no vocabulário do DESIGN SYSTEM.
 *
 * São TRÊS palavras: menu não tem botão de fechar, e `close-button` nunca
 * sairia daqui — o tipo do EVENTO é que carrega as quatro da família.
 *
 * Até 2026-09-12 cada docs page desta stack declarava o seu: `MenuCloseReason`
 * na do DropdownMenu e na do Menubar, e uma união anônima na do ContextMenu —
 * três deduções sem teste, para um vocabulário só. Regra em
 * `docs/shared/guidelines/18-overlay.md` §Analytics: quem deduz o motivo fica ao
 * lado do primitivo.
 */
export type MenuCloseReason = 'escape' | 'overlay' | 'api';

/**
 * O gesto observado.
 *
 * O bits-ui não publica motivo: o `onOpenChange` (e o `onValueChange` da barra)
 * avisa QUE o menu fechou, nunca POR QUÊ. Cada caminho se anota ANTES do aviso,
 * pelo evento próprio do painel ou pelo ouvinte que o wrapper oferece.
 *
 * `sibling-open` é do Menubar: um valor que troca direto por outro é a passagem
 * ao menu vizinho. `trigger-press` é o clique no gatilho do menu ABERTO, que o
 * menu de contexto não tem.
 */
export type MenuCloseSignal =
  | 'escape-key'
  | 'outside-press'
  | 'focus-out'
  | 'trigger-press'
  | 'sibling-open'
  | 'item-press';

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: os eventos `context_menu_close`,
 * `dropdown_menu_close` e `menubar_close` nascem na camada de produto, nunca no
 * primitivo — primitivo de UI que importa `@/lib/analytics` é o que a regra
 * `analytics_in_ui_primitive` proíbe.
 */
export function menuCloseReason(signal?: MenuCloseSignal | null): MenuCloseReason {
  switch (signal) {
    case 'escape-key':
      return 'escape';
    // "Saí do menu sem decidir nada": clique fora, o Tab que leva o foco embora,
    // o clique no gatilho já aberto e a troca de menu dentro da barra.
    case 'outside-press':
    case 'focus-out':
    case 'trigger-press':
    case 'sibling-open':
      return 'overlay';
    // Sobra o menu fechado por DECISÃO: o item escolhido e o que for fechado por
    // código ou por caminho desconhecido. É o padrão de propósito — até
    // 2026-09-11 era `overlay`, e todo fechamento de origem desconhecida
    // contava como clique fora.
    default:
      return 'api';
  }
}

export interface MenuCloseWatchOptions {
  /**
   * O painel de submenu, pelo `data-slot` que o wrapper escreve nele — muda por
   * componente (`dropdown-menu-sub-content`, `context-menu-sub-content`,
   * `menubar-sub-content`).
   */
  subContentSelector: string;
  /**
   * O menu está aberto agora? Só o clique num gatilho ABERTO dispensa o menu; no
   * fechado, ele abre. Quem tem o estado é quem consome — o menu de contexto não
   * tem gatilho e pode omitir.
   */
  isOpen?: () => boolean;
}

/** O que o `createMenuCloseWatch` devolve. */
export interface MenuCloseWatch {
  /** Pronto para espalhar no `Content`: Escape, clique fora e Tab. */
  readonly content: {
    onEscapeKeydown: () => void;
    onInteractOutside: (event: PointerEvent) => void;
    onkeydown: (event: KeyboardEvent) => void;
  };
  /**
   * Pronto para espalhar no `SubContent`: o painel do submenu vive num portal à
   * parte, e o Tab dado nele não passa pelo painel de cima.
   */
  readonly subContent: { onkeydown: (event: KeyboardEvent) => void };
  /** Pronto para espalhar no `Trigger`. */
  readonly trigger: { onpointerdown: () => void };
  /** Marca a escolha de um item de AÇÃO — a decisão que fecha o menu. */
  markItemPress(): void;
  /** Marca a passagem ao menu vizinho da barra. */
  markSiblingOpen(): void;
  /** Zera o gesto pendente. Chamado na ABERTURA, para o menu começar limpo. */
  reset(): void;
  /** Lê o motivo do fechamento e zera o gesto pendente, numa chamada só. */
  takeReason(): MenuCloseReason;
}

/**
 * Guarda o último gesto observado até o menu de fato fechar.
 *
 * Uma instância por MENU VIVO: ao contrário dos painéis modais, a página monta
 * vários menus ao mesmo tempo, e um gesto pendente compartilhado misturaria os
 * previews.
 *
 * O Escape dentro de um submenu fecha só o submenu — o wrapper barra a tecla
 * antes do painel de cima —, e por isso não chega aqui.
 */
export function createMenuCloseWatch({
  subContentSelector,
  isOpen,
}: MenuCloseWatchOptions): MenuCloseWatch {
  let pending: MenuCloseSignal | null = null;

  const mark = (signal: MenuCloseSignal) => () => {
    pending = signal;
  };

  const markOnTab = (event: KeyboardEvent) => {
    if (event.key === 'Tab') pending = 'focus-out';
  };

  return {
    content: {
      onEscapeKeydown: mark('escape-key'),
      onInteractOutside: (event: PointerEvent) => {
        // O clique num painel de submenu também chega aqui, e a lib não fecha
        // por ele: é interação DENTRO do menu, não fora.
        //
        // O alvo se reconhece pelo `closest`, e não por `instanceof Element`: a
        // dedução é a parte TESTÁVEL do componente e roda no projeto `unit`, em
        // node, onde `Element` não existe — o `instanceof` derrubava o teste com
        // `ReferenceError`, e só o navegador o exercitava.
        const target = event.target as Element | null;
        if (typeof target?.closest === 'function' && target.closest(subContentSelector)) return;
        pending = 'outside-press';
      },
      onkeydown: markOnTab,
    },
    subContent: { onkeydown: markOnTab },
    trigger: {
      onpointerdown: () => {
        if (isOpen?.()) pending = 'trigger-press';
      },
    },
    markItemPress: mark('item-press'),
    markSiblingOpen: mark('sibling-open'),
    reset() {
      pending = null;
    },
    takeReason() {
      const reason = menuCloseReason(pending);
      pending = null;
      return reason;
    },
  };
}
