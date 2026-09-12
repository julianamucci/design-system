/**
 * Por qual caminho o diálogo de alerta fechou, no vocabulário do DESIGN SYSTEM.
 *
 * São TRÊS palavras, e a que falta é `overlay` de propósito: clique no véu
 * **não** fecha o AlertDialog (D1 do `docs/shared/prd/alert-dialog.md`), então
 * uma palavra para esse caminho seria dimensão morta no GA4. A exceção está
 * declarada em `FAMILIA_DE_MOTIVO` no `scripts/audit.mjs`, com a premissa
 * conferida contra o PRD: se o componente passar a fechar por clique fora, a
 * exceção cai e o portão volta a cobrar `overlay`.
 *
 * As outras três são as mesmas do `DialogCloseReason` — o `dialog_close` é um
 * evento só para Dialog, Sheet e AlertDialog, e uma dimensão só de `reason`.
 *
 * Até 2026-09-12 o tipo morava DENTRO do `AlertDialogDemo.svelte`, com o nome
 * genérico `CloseReason`: quem sabe por onde o diálogo fechou é o componente, e
 * a página que o consome só repassa a palavra
 * (`docs/shared/guidelines/18-overlay.md` §Analytics).
 */
export type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';

/**
 * O gesto observado, no vocabulário de MOTIVO DE LIB que as outras stacks
 * recebem prontas.
 *
 * O bits-ui não publica motivo nenhum: o `onOpenChange` avisa QUE o diálogo
 * fechou, nunca POR QUÊ. `escape-key` é o único que a lib anuncia, por evento
 * próprio do `Content`; `close-press` é o Cancelar e `confirm` é a ação que
 * decide — as duas são partes de fechar da lib, indistinguíveis de fora.
 *
 * Não há `outside-press` nem `focus-out`: nenhum dos dois fecha este
 * componente.
 */
export type AlertDialogCloseSignal = 'escape-key' | 'close-press' | 'confirm';

/**
 * Traduz o gesto observado para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function alertDialogCloseReason(
  signal?: AlertDialogCloseSignal | null,
): AlertDialogCloseReason {
  switch (signal) {
    case 'escape-key':
      return 'escape';
    case 'close-press':
      return 'close-button';
    // Sobra o diálogo fechado por DECISÃO DE DENTRO — a ação que confirma e o
    // fechamento por código, que a família chama de `api`. É também o destino
    // do gesto que a lib não anunciou, e ele tem de ser o padrão: `api` erra
    // para "alguma coisa de dentro fechou", enquanto `close-button` erraria
    // inventando um clique no Cancelar que ninguém deu.
    default:
      return 'api';
  }
}

/** O que o `createAlertDialogCloseWatch` devolve. */
export interface AlertDialogCloseWatch {
  /**
   * Pronto para espalhar no `AlertDialogContent`. Só o Escape: é o único
   * caminho de fechamento que a lib anuncia neste componente.
   */
  readonly listeners: { onEscapeKeydown: () => void };
  /** Pronto para espalhar no `AlertDialogCancel`. */
  readonly cancelTrigger: { onclick: () => void };
  /** Marca a decisão de dentro ANTES de o diálogo fechar. */
  markConfirmation(): void;
  /** Marca o clique no Cancelar. */
  markCancelPress(): void;
  /** Zera o gesto pendente. Chamado na ABERTURA, para o diálogo começar limpo. */
  reset(): void;
  /** Lê o motivo do fechamento e zera o gesto pendente, numa chamada só. */
  takeReason(): AlertDialogCloseReason;
}

/**
 * Guarda o último gesto observado até o diálogo de fato fechar.
 *
 * Vence o ÚLTIMO gesto, não o primeiro: quem confirma e desiste pelo Escape
 * fechou por Escape.
 *
 * Uma instância por preview: ao contrário do Dialog e do Sheet, o preview do
 * AlertDialog é um componente instanciado várias vezes na mesma página, e um
 * gesto pendente compartilhado misturaria os previews.
 */
export function createAlertDialogCloseWatch(): AlertDialogCloseWatch {
  let pending: AlertDialogCloseSignal | null = null;

  const mark = (signal: AlertDialogCloseSignal) => () => {
    pending = signal;
  };

  return {
    listeners: { onEscapeKeydown: mark('escape-key') },
    cancelTrigger: { onclick: mark('close-press') },
    markConfirmation: mark('confirm'),
    markCancelPress: mark('close-press'),
    reset() {
      pending = null;
    },
    takeReason() {
      const reason = alertDialogCloseReason(pending);
      pending = null;
      return reason;
    },
  };
}
