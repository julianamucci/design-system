/**
 * Por qual caminho a gaveta fechou, no vocabulário do DESIGN SYSTEM.
 *
 * É o mesmo conjunto fechado que o `drawer_close` cobra: quatro palavras,
 * iguais nas cinco stacks. Uma quinta aqui partiria a mesma dimensão do GA4 em
 * duas leituras.
 *
 * Até 2026-09-12 o tipo morava dentro da `DrawerDocs.svelte`, e a dedução não
 * tinha teste. Mudou de casa pela regra de `docs/shared/guidelines/18-overlay.md`
 * §Analytics: quem deduz o motivo fica AO LADO DO PRIMITIVO, porque é o
 * componente que sabe por onde o painel fechou — a página só repassa a palavra.
 */
export type DrawerCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O gesto observado.
 *
 * O primitivo desta stack avisa QUE o painel fechou (`onOpenChange` recebe um
 * booleano e nada mais), nunca POR QUÊ. Cada caminho que a lib anuncia por
 * evento próprio deixa o gesto anotado antes de o fechamento acontecer.
 *
 * `drag-dismiss` é o arraste que dispensa o painel, e não tem irmão nas outras
 * famílias: é o gesto que só a gaveta tem.
 */
export type DrawerCloseSignal =
  | 'escape-key'
  | 'outside-press'
  | 'drag-dismiss'
  | 'imperative-action';

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * O default é `close-button`, e AQUI ele é o certo: o que sobra depois de
 * Escape, véu e arraste é o botão de saída do rodapé, que a lib não anuncia por
 * evento próprio. Na família do Dialog o default é `api`, porque lá o botão de
 * fechar TEM anúncio e o que sobra é o fechamento por código.
 *
 * Função pura e exportada de propósito: o evento `drawer_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function drawerCloseReason(signal?: DrawerCloseSignal | null): DrawerCloseReason {
  switch (signal) {
    case 'escape-key':
      return 'escape';
    // Arrastar para fora fecha por `overlay`: para quem usa, é a mesma decisão
    // de "saí sem decidir nada" do clique no véu.
    case 'outside-press':
    case 'drag-dismiss':
      return 'overlay';
    case 'imperative-action':
      return 'api';
    default:
      return 'close-button';
  }
}

/** O que o `createDrawerCloseWatch` devolve. */
export interface DrawerCloseWatch {
  /** Pronto para espalhar no `DrawerContent`: tecla de escape e clique no véu. */
  readonly listeners: {
    onEscapeKeydown: () => void;
    onInteractOutside: () => void;
  };
  /**
   * Pronto para espalhar na RAIZ: o arraste que dispensa o painel.
   *
   * O gesto é anotado no ARRASTE, e não na soltura, porque a lib FECHA a gaveta
   * antes de anunciar a soltura (`closeDrawer(); onRelease(event, false)`):
   * anotado ali, o `onOpenChange` já teria passado. Arraste curto volta ao
   * repouso e é anunciado com `open = true` — ele LIMPA a anotação, senão o
   * próximo fechamento pelo botão herdaria um motivo que não é dele.
   */
  readonly drag: {
    onDrag: () => void;
    onRelease: (event: PointerEvent, open: boolean) => void;
  };
  /** Marca o fechamento por código. */
  markProgrammatic(): void;
  /** Zera o gesto pendente. Chamado na ABERTURA, para a gaveta começar limpa. */
  reset(): void;
  /** Lê o motivo do fechamento e zera o gesto pendente, numa chamada só. */
  takeReason(): DrawerCloseReason;
}

/**
 * Guarda o último gesto observado até a gaveta de fato fechar.
 *
 * Uma instância para a página inteira basta: o painel é modal, e nunca há dois
 * abertos ao mesmo tempo.
 */
export function createDrawerCloseWatch(): DrawerCloseWatch {
  let pending: DrawerCloseSignal | null = null;

  const mark = (signal: DrawerCloseSignal) => () => {
    pending = signal;
  };

  return {
    listeners: {
      onEscapeKeydown: mark('escape-key'),
      onInteractOutside: mark('outside-press'),
    },
    drag: {
      onDrag: mark('drag-dismiss'),
      onRelease: (_event: PointerEvent, open: boolean) => {
        if (open) pending = null;
      },
    },
    markProgrammatic: mark('imperative-action'),
    reset() {
      pending = null;
    },
    takeReason() {
      const reason = drawerCloseReason(pending);
      pending = null;
      return reason;
    },
  };
}
