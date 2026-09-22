// Arquivo próprio, e não dentro de `dialog.ts`: a tradução é da FAMÍLIA dos
// diálogos modais — Dialog e AlertDialog alimentam o MESMO `dialog_close` —, e
// aqui ela é pura e se testa sem importar diretiva nenhuma do Angular. Mesma
// forma do `menu-close-reason.ts` e do `popover-close-reason.ts`.
//
// Até 2026-09-12 cada uma das duas docs pages tinha o seu mapa local
// (`CLOSE_REASON` em `DialogDocs.ts`, `ALERT_CLOSE_REASON` em
// `AlertDialogDocs.ts`), e isso era o contrato ao contrário: quem consome
// remendando o que o componente não sabe dizer. A regra está em
// `docs/shared/guidelines/18-overlay.md` §Analytics — o motivo é derivado AO
// LADO DO PRIMITIVO, e a página só repassa a palavra.
//
// O tipo do motivo da lib é `RdxDialogOpenChangeReason`, oito palavras:
// `trigger-press`, `close-press`, `outside-press`, `focus-out`, `escape-key`,
// `swipe`, `imperative-action` e `none`. O parâmetro é `string` pelo mesmo
// motivo dos dois irmãos: o galho `default` existe para o motivo que a lib
// ACRESCENTAR, e com um tipo fechado ele seria intestável.

/**
 * Por qual caminho o diálogo fechou, no vocabulário do DESIGN SYSTEM — as
 * mesmas quatro palavras do `drawer_close` e do `popover_close`, para a família
 * ser uma dimensão só no GA4.
 */
export type DialogCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * O mesmo para o AlertDialog, e com TRÊS palavras: clique no véu **não** fecha
 * este componente (D1 do `prd/alert-dialog.md`, fixado na construção por
 * `provideRdxDialogVariant({ forcePointerDismissalDisabled: true })`), então
 * `overlay` não tem comportamento atrás dele.
 *
 * A lista curta é exceção DECLARADA em `FAMILIA_DE_MOTIVO`
 * (`scripts/audit.mjs`), com a premissa conferida contra o PRD: se o
 * componente passar a fechar por clique fora, a exceção cai sozinha e o portão
 * volta a cobrar as quatro palavras.
 */
export type AlertDialogCloseReason = 'escape' | 'close-button' | 'api';

/** O que se sabe além do motivo da lib — tudo opcional. */
export interface DialogCloseHints {
  /**
   * A ação que CONFIRMA foi acionada nesta abertura.
   *
   * Quem marca é a página, que é quem sabe que a pessoa confirmou; quem traduz
   * é este arquivo. A ação primária fecha pelo mesmo caminho do X e do Cancelar
   * (as três são `RdxDialogClose`), e o radix-ng entrega `close-press` para
   * todas — sem a marca, "confirmou a exclusão" chegaria ao relatório como
   * "apertou o botão de fechar".
   */
  confirmed?: boolean;
}

/**
 * Traduz o motivo do radix-ng para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe. Mesma
 * forma do `sheetCloseReason` e do `drawerCloseReason`, e MESMO mapa do
 * `dialogCloseReason` do React: as duas stacks que recebem o motivo pronto da
 * lib têm de concordar entre si antes de concordar com as outras três.
 *
 * A confirmação vence o motivo da lib, e vem antes do `switch`: é a diferença
 * que interessa ao funil — fechou porque desistiu, ou porque concluiu.
 */
export function dialogCloseReason(
  motivo: string | undefined,
  hints: DialogCloseHints = {},
): DialogCloseReason {
  if (hints.confirmed) return 'api';
  switch (motivo) {
    case 'escape-key':
      return 'escape';
    // Clique no véu e foco que escapa são o mesmo gesto do ponto de vista de
    // quem usa: "saí do painel sem decidir nada".
    case 'outside-press':
    case 'focus-out':
      return 'overlay';
    case 'close-press':
      return 'close-button';
    // Sobram `trigger-press`, `swipe`, `imperative-action`, `none` e o que a lib
    // acrescentar: o painel fechado por CÓDIGO, "decisão de dentro".
    // `trigger-press` cai aqui e não em `overlay` como no popover: num painel
    // modal o gatilho fica coberto pelo véu, e só código fecha por ele — a mesma
    // leitura do drawer.
    default:
      return 'api';
  }
}

/**
 * O mesmo para o AlertDialog, no vocabulário de três palavras dele.
 *
 * Duas diferenças em relação ao Dialog, e as duas são o componente, não um
 * atalho: `outside-press` não chega (o clique fora não fecha) e `focus-out` não
 * chega (o foco fica preso no painel). Se chegarem — lib nova, perfil
 * afrouxado —, caem em `api` junto com o resto, que é onde o mapa local desta
 * página já os punha: inventar `overlay` para eles criaria uma palavra que o
 * componente não tem.
 */
export function alertDialogCloseReason(
  motivo: string | undefined,
  hints: DialogCloseHints = {},
): AlertDialogCloseReason {
  if (hints.confirmed) return 'api';
  switch (motivo) {
    case 'escape-key':
      return 'escape';
    // O X, o Cancelar e a ação primária são as três partes de fechar da lib.
    // Quem separa a primária das outras duas é `hints.confirmed`, acima.
    case 'close-press':
      return 'close-button';
    default:
      return 'api';
  }
}

/**
 * O seletor da ação que CONFIRMA. No Angular o seletor É o contrato da peça, e
 * é ele que fica no DOM como atributo — diferente de `data-slot`, que neste
 * elemento é disputado por duas diretivas (`ndsAlertDialogAction` e `ndsButton`
 * escrevem o mesmo atributo, sem ordem garantida).
 */
const ALERT_DIALOG_ACTION_SELECTOR = '[ndsAlertDialogAction]';

/**
 * A pessoa CONFIRMOU, lido do evento que fechou o painel.
 *
 * Por que não uma bandeira marcada no `(click)` de quem consome, como no react:
 * medido em 2026-09-22, o `(click)` do template corre **DEPOIS** do ouvinte de
 * host do `RdxDialogClose` que o `ndsAlertDialogAction` compõe — o contrário do
 * que `guidelines/13-system-design.md` §`(click)` no host afirma para ouvinte
 * declarado em `host:`. A marca chegava sempre tarde, e confirmar a exclusão
 * saía no relatório como `close-button`.
 *
 * Ler o ALVO não depende de ordem nenhuma: o `RdxDialogOpenChange` carrega o
 * evento original, e nele o alvo é o botão (ou um filho dele) tanto no clique
 * quanto no Enter/Espaço. É a mesma leitura por delegação que o vue faz.
 *
 * Função pura: recebe o evento e responde; não anexa ouvinte nem escreve no
 * DOM. O `closest` é conferido por capacidade porque o projeto `unit` roda em
 * node, onde `Element` não existe.
 */
export function alertDialogConfirmedFromEvent(event: Event | undefined): boolean {
  const target = event?.target as Element | null | undefined;
  if (!target || typeof target.closest !== 'function') return false;
  return target.closest(ALERT_DIALOG_ACTION_SELECTOR) !== null;
}
