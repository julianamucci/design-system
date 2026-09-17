/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `drawer_close` e do `popover_close`, para a família ser uma
 * dimensão só no GA4. Vale para o `dialog_close`, que é o evento do Dialog, do
 * Sheet e do AlertDialog.
 *
 * Até 2026-09-11 esta stack não tinha o tipo: a docs page declarava um local com
 * TRÊS palavras (`escape | overlay | close-button`) e reportava `close-button`
 * como padrão — a ação que confirma e fecha, e o fechamento por código, chegavam
 * ao relatório como "apertou o botão de fechar". A palavra da família para
 * "fechou por decisão de dentro" é `api`. Regra em
 * `docs/shared/guidelines/18-overlay.md` §Analytics e `docs/shared/prd/sheet.md`
 * §9.
 */
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O gesto observado, no vocabulário de MOTIVO DE LIB que as outras stacks
 * recebem prontas (`escape-key`, `outside-press`, `focus-out`, `close-press` —
 * é o `RdxDialogOpenChangeReason` do Angular e o `eventDetails.reason` da
 * base-ui no React).
 *
 * O bits-ui é a lib que NÃO publica motivo nenhum: o `onOpenChange` avisa QUE o
 * painel fechou, nunca POR QUÊ. Os gestos são observáveis por evento próprio do
 * `Content`, e é o `createSheetCloseWatch` abaixo que os traduz para estas
 * palavras — assim o `sheetCloseReason` continua sendo a MESMA função pura das
 * outras stacks, e não um mapeador só desta.
 *
 * `confirm` é o único que não vem da lib: nenhuma delas sabe que o clique na
 * ação primária é uma decisão, e sem essa marca "confirmou e fechou" viraria
 * `close-button`.
 */
export type SheetCloseSignal =
  | 'escape-key'
  | 'outside-press'
  | 'focus-out'
  | 'close-press'
  | 'confirm';

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function sheetCloseReason(signal?: SheetCloseSignal | null): SheetCloseReason {
  switch (signal) {
    case 'escape-key':
      return 'escape';
    // Clique no véu e foco que escapa são o mesmo gesto do ponto de vista de
    // quem usa: "saí do painel sem decidir nada".
    case 'outside-press':
    case 'focus-out':
      return 'overlay';
    case 'close-press':
      return 'close-button';
    // Sobra o painel fechado por DECISÃO DE DENTRO — a ação que confirma e o
    // fechamento por código, que a família chama de `api`. É também o destino
    // do gesto que a lib não anunciou, e ele tem de ser o padrão: `api` erra
    // para "alguma coisa de dentro fechou", enquanto `close-button` erraria
    // inventando um clique que ninguém deu.
    default:
      return 'api';
  }
}

/**
 * Todo controle de fechar do painel se nomeia assim — o X que o `SheetContent`
 * monta e todo `SheetClose` que o rodapé compõe.
 */
export const SHEET_CLOSE_SLOT = '[data-slot="sheet-close"]';

/**
 * O clique caiu num controle de fechar do painel?
 *
 * É a pergunta que a DELEGAÇÃO faz, e ela é função pura de propósito: quem a
 * usa é o ouvinte de captura do `SheetContent`, e é aqui que ela pode ser
 * provada sem navegador.
 *
 * `closest` e não comparação direta: o clique costuma cair no ícone ou no
 * `.nds-sr-only` dentro do botão, e o alvo direto erraria os dois. Alvo sem
 * `closest` — nó de texto, ou o próprio documento — responde não em vez de
 * derrubar o ouvinte, que corre antes de tudo que o painel faz com o clique.
 */
export function isSheetCloseTrigger(target: EventTarget | null): boolean {
  const element = target as Element | null;
  return Boolean(element?.closest?.(SHEET_CLOSE_SLOT));
}

/** O que o `createSheetCloseWatch` devolve. */
export interface SheetCloseWatch {
  /**
   * Pronto para espalhar no `SheetContent`, que repassa os três primeiros ao
   * primitivo e consome o `onClosePress` para TODO controle de fechar do painel
   * — o X do canto e cada `SheetClose` do rodapé, por delegação. Só ouvintes
   * ficam aqui: método espalhado em componente vira atributo inválido no DOM.
   */
  readonly listeners: {
    onEscapeKeydown: () => void;
    onInteractOutside: () => void;
    onFocusOutside: () => void;
    onClosePress: () => void;
  };
  /** Marca a decisão de dentro ANTES de o painel fechar. */
  markConfirmation(): void;
  /** Marca o clique numa saída explícita — o X do canto ou um `SheetClose`. */
  markClosePress(): void;
  /** Zera o gesto pendente. Chamado na ABERTURA, para o painel começar limpo. */
  reset(): void;
  /** Lê o motivo do fechamento e zera o gesto pendente, numa chamada só. */
  takeReason(): SheetCloseReason;
}

/**
 * Guarda o último gesto observado até o painel de fato fechar.
 *
 * NÃO existe mais um `closeTrigger` para espalhar botão a botão. Ele existia
 * porque esta era a única stack sem delegação: cada `SheetClose` do rodapé
 * precisava espalhá-lo, e o que ficasse de fora fechava o painel relatando
 * `api` — a docs page espalhava em onze pontos, e o defeito de esquecer um é
 * silencioso. Hoje quem vê o clique é o ouvinte de captura do `SheetContent`,
 * como no Vanilla (`sheet.ts:371-374`) e no Vue.
 *
 * Vence o ÚLTIMO gesto, não o primeiro: quem clica em "Aplicar" e depois desiste
 * pelo Escape fechou por Escape. A precedência inversa reportaria a decisão que
 * não aconteceu.
 *
 * Uma instância para a página inteira basta: o painel é modal, e nunca há dois
 * abertos ao mesmo tempo.
 */
export function createSheetCloseWatch(): SheetCloseWatch {
  let pending: SheetCloseSignal | null = null;

  const mark = (signal: SheetCloseSignal) => () => {
    pending = signal;
  };

  return {
    listeners: {
      onEscapeKeydown: mark('escape-key'),
      onInteractOutside: mark('outside-press'),
      onFocusOutside: mark('focus-out'),
      onClosePress: mark('close-press'),
    },
    markConfirmation: mark('confirm'),
    markClosePress: mark('close-press'),
    reset() {
      pending = null;
    },
    takeReason() {
      const reason = sheetCloseReason(pending);
      pending = null;
      return reason;
    },
  };
}
