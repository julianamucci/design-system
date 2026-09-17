// Arquivo próprio, e não dentro de `sheet.ts`: é a mesma forma do
// `dialog-close-reason.ts`, do `menu-close-reason.ts` e do
// `popover-close-reason.ts`, e ela existe por um motivo mecânico — a tradução é
// função PURA, e aqui ela se testa sem compilador de template no caminho. Dentro
// de `sheet.ts` o teste unitário teria de importar um módulo cheio de
// `@Component`/`@Directive`, que fora do compilador do Angular quebra; era por
// isso que esta stack era a única das cinco sem teste do mapeador.
//
// O tipo do motivo da lib é `RdxDialogOpenChangeReason`, oito palavras:
// `trigger-press`, `close-press`, `outside-press`, `focus-out`, `escape-key`,
// `swipe`, `imperative-action` e `none`. O parâmetro é `string` pelo mesmo
// motivo dos três irmãos: o galho `default` existe para o motivo que a lib
// ACRESCENTAR, e com um tipo fechado ele seria intestável.

/** Caminho que fechou o painel — o vocabulário que o analytics do produto usa. */
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

/**
 * Traduz o motivo do radix-ng para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca ao lado do primitivo — primitivo de UI que
 * importa `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 *
 * MESMO mapa do `dialogCloseReason` desta stack: Dialog e Sheet alimentam o
 * mesmo `dialog_close`, e as duas peças que recebem o motivo pronto da lib têm
 * de concordar entre si antes de concordar com as outras três stacks.
 */
export function sheetCloseReason(motivo: string | undefined): SheetCloseReason {
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
    // acrescentar: o painel fechado por CÓDIGO, "decisão de dentro". É por aqui
    // que passa o `close()` público — a ação primária que confirma e sai, e o
    // recolhimento do painel anterior quando outro abre.
    //
    // `trigger-press` cai aqui e não em `overlay` como no popover: num painel
    // modal o gatilho fica coberto pelo véu, e só código fecha por ele.
    default:
      return 'api';
  }
}
