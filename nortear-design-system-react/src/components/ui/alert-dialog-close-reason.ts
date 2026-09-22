import { dialogCloseReason, type DialogCloseReason } from "./dialog-close-reason"

/*
 * Arquivo próprio, e não um trecho dentro de `dialog-close-reason.ts`: o
 * vocabulário é do ALERT dialog, e quem procura por ele procura pelo nome do
 * componente. É a mesma forma do `alert-dialog.close-reason.ts` do Vue e do
 * `alert-dialog/close-reason.ts` do Svelte.
 *
 * O AlertDialog fecha por TRÊS caminhos, e a palavra que falta é proposital.
 */

/**
 * Por qual caminho o AlertDialog fechou, no vocabulário do DESIGN SYSTEM.
 *
 * O evento é o mesmo `dialog_close` do Dialog e do Sheet — a família é uma
 * dimensão só no GA4 —, menos `overlay`: clique no véu **não** fecha este
 * painel (D1 do `docs/shared/prd/alert-dialog.md`, fixado na construção — a
 * `useRenderDialogRoot` liga `disablePointerDismissal` quando o modo é
 * `'alert-dialog'`). A decisão é destrutiva, e sair sem responder não pode ser
 * um acidente de ponteiro.
 *
 * A ausência está DECLARADA no portão, em `FAMILIA_DE_MOTIVO.excecoes` de
 * `scripts/audit.mjs`, que confere a premissa contra o PRD: se o AlertDialog
 * passar a fechar pelo véu, a exceção cai e o portão volta a cobrar a palavra.
 *
 * As três palavras estão escritas à mão, e não derivadas com `Exclude<>`, por
 * um motivo medido: o portão lê o conjunto de literais do tipo, e uma
 * derivação não tem literal nenhum para ele contar — o tipo sairia com zero
 * palavras e a família o acusaria de não ter nem `escape`. A derivação existe
 * assim mesmo, como PROVA de tipo logo abaixo.
 */
export type AlertDialogCloseReason = "escape" | "close-button" | "api"

/**
 * A prova de que o AlertDialog fala o dialeto do Dialog, e não um vocabulário
 * paralelo: se uma das três palavras sair do `DialogCloseReason` (ou for
 * escrita diferente aqui), isto deixa de compilar. É o que faz a restrição
 * valer sem tirar do portão os literais que ele conta.
 *
 * `false`, e não `never`, no ramo que falha: `never` é atribuível a tudo,
 * então uma asserção escrita com ele passaria justamente no caso que ela
 * existe para reprovar.
 */
type Asserts<T extends true> = T
export type AlertDialogSpeaksDialogDialect = Asserts<
  AlertDialogCloseReason extends DialogCloseReason ? true : false
>

/**
 * Traduz o motivo da base-ui (`eventDetails.reason` do `onOpenChange`),
 * REAPROVEITANDO o mapeador do Dialog — inclusive a marca de confirmação, que
 * é consumida lá dentro.
 *
 * Um `switch` próprio aqui seria uma segunda tabela dizendo a mesma coisa, e
 * tabela duplicada é como o Sheet ficou seis semanas com três palavras contra
 * as quatro do Dialog da mesma stack.
 *
 * O que o AlertDialog acrescenta é o ESTREITAMENTO: `outside-press` e
 * `focus-out` não chegam (o clique fora não fecha, e o foco fica preso no
 * painel). Se chegarem — composição fora do contrato, ou a lib mudando —, não
 * viram `overlay`, que é palavra que este componente não fala; viram `api`, o
 * mesmo destino de todo fechamento que ninguém viu acontecer.
 */
export function alertDialogCloseReason(reason?: string): AlertDialogCloseReason {
  const mapped = dialogCloseReason(reason)
  return mapped === "overlay" ? "api" : mapped
}
