import {
  dialogCloseReason,
  type DialogCloseGesture,
  type DialogCloseReason,
} from '../dialog/dialog.close-reason'

/**
 * O AlertDialog fecha por TRÊS caminhos, e a palavra que falta é proposital.
 *
 * O vocabulário é o mesmo do `dialog_close` — o evento é um só, do Dialog, do
 * Sheet e do AlertDialog —, menos `overlay`: clique no véu **não** fecha este
 * painel (D1 do `docs/shared/prd/alert-dialog.md`), porque a decisão é
 * destrutiva e sair sem responder não pode ser um acidente de ponteiro. A
 * ausência está DECLARADA no portão, em `FAMILIA_DE_MOTIVO.excecoes` de
 * `scripts/audit.mjs`, que confere a premissa contra o PRD: se o AlertDialog
 * passar a fechar pelo véu, a exceção cai e o portão volta a cobrar a palavra.
 *
 * As três palavras estão escritas à mão, e não derivadas com `Exclude<>`, por um
 * motivo medido: o portão lê o conjunto de literais do tipo, e uma derivação não
 * tem literal nenhum para ele contar — o tipo sairia com zero palavras e a
 * família o acusaria de não ter nem `escape`. A derivação existe assim mesmo,
 * como PROVA de tipo logo abaixo.
 */
export type AlertDialogCloseReason = 'escape' | 'close-button' | 'api'

/**
 * A prova de que o AlertDialog fala o dialeto do Dialog, e não um vocabulário
 * paralelo: se uma das três palavras sair do `DialogCloseReason` (ou for
 * escrita diferente aqui), isto deixa de compilar. É o que faz a restrição valer
 * sem tirar do portão os literais que ele conta.
 *
 * `false`, e não `never`, no ramo que falha: `never` é atribuível a tudo, então
 * uma asserção escrita com ele passaria justamente no caso que ela existe para
 * reprovar.
 */
type Afirma<T extends true> = T
export type AlertDialogFalaODialetoDoDialog = Afirma<
  AlertDialogCloseReason extends DialogCloseReason ? true : false
>

/**
 * Os gestos que este painel pode ver: o Escape, o clique no Cancelar e a
 * confirmação. Não há gesto de fora porque não há fechamento por fora —
 * `pointer-down-outside` e `focus-outside` ficam de fora do tipo pela mesma D1.
 */
export type AlertDialogCloseGesture = Extract<
  DialogCloseGesture,
  'escape-key-down' | 'close-press' | 'confirm'
>

/**
 * Traduz o gesto observado, REAPROVEITANDO o mapeador do Dialog.
 *
 * Um `switch` próprio aqui seria uma segunda tabela dizendo a mesma coisa, e
 * tabela duplicada é como o Sheet ficou seis semanas com três palavras contra as
 * quatro do Dialog da mesma stack. O que o AlertDialog acrescenta é o
 * ESTREITAMENTO: se um gesto de fora chegar mesmo assim — composição fora do
 * contrato, ou a lib mudando —, ele não vira `overlay`, que é palavra que este
 * componente não fala; vira `api`, o mesmo destino de todo fechamento que
 * ninguém viu acontecer.
 */
export function alertDialogCloseReason(
  gesture?: AlertDialogCloseGesture | null,
): AlertDialogCloseReason {
  const reason = dialogCloseReason(gesture)
  return reason === 'overlay' ? 'api' : reason
}

/**
 * O único controle de fechar do painel: o Cancelar.
 *
 * O AlertDialog não monta X no canto (o `AlertDialogContent` não tem
 * `showCloseButton`), então o slot do cancelar é todo o universo de
 * `close-button` aqui. A ação primária tem slot próprio
 * (`alert-dialog-action`) e NÃO entra: ela é confirmação, e quem a marca é quem
 * a executa.
 */
export const ALERT_DIALOG_CANCEL_SLOT = '[data-slot="alert-dialog-cancel"]'

/** O que `createAlertDialogCloseWatch` devolve, pronto para `v-bind` no Content. */
export interface AlertDialogCloseWatch {
  onEscapeKeyDown: () => void
  onClickCapture: (event: MouseEvent) => void
}

/**
 * Os ouvintes que observam a saída, prontos para `v-bind` num
 * `AlertDialogContent`.
 *
 * Só dois, e é a lista inteira: o Escape é emit do primitivo, e o Cancelar é
 * delegação na captura do painel — que é o que corre ANTES do fechamento da lib
 * e antes do `@click.capture` do próprio `AlertDialogCancel`. Sem esta segunda
 * anotação o Cancelar não teria gesto e sairia como `api`, que é exatamente o
 * erro simétrico do que esta stack tinha até 2026-09-12 (lá, o que sobrava virava
 * `close-button` e engolia a confirmação).
 */
export function createAlertDialogCloseWatch(
  note: (gesture: AlertDialogCloseGesture) => void,
): AlertDialogCloseWatch {
  return {
    onEscapeKeyDown: () => note('escape-key-down'),
    onClickCapture: (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest?.(ALERT_DIALOG_CANCEL_SLOT)) note('close-press')
    },
  }
}
