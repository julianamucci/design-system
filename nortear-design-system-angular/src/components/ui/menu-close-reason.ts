// Arquivo próprio, e não dentro de um dos três componentes: a tradução é da
// FAMÍLIA de menus (DropdownMenu, ContextMenu e Menubar) e se testa sem importar
// diretiva nenhuma do Angular. Até 2026-09-11 cada docs page da família tinha a
// sua cópia de `closeReason`, e as três mandavam `overlay` para o fechamento de
// origem desconhecida — o oposto da decisão da família.

/**
 * Por qual caminho o menu fechou, no vocabulário do DESIGN SYSTEM (PRD
 * dropdown-menu §9, 18-overlay §Analytics). Menu não tem botão de fechar, então
 * a família usa três das quatro palavras do `drawer_close`.
 */
export type MenuCloseReason = 'escape' | 'overlay' | 'api';

/**
 * O gesto de SAÍDA que um evento de entrada no gatilho (ou na barra) representa.
 *
 * Existe porque a lib entrega alguns fechamentos sem motivo (`none`): na barra,
 * o clique no gatilho do menu aberto, o Enter ou Espaço nele e o Escape com o
 * foco no gatilho. Sem o gesto, os três cairiam em `api`, que é "o código
 * fechou".
 */
export type MenuExitGesture = 'escape' | 'leave';

/** O que se sabe além do motivo da lib — tudo opcional. */
export interface MenuCloseHints {
  /** Um item de AÇÃO foi escolhido nesta abertura. */
  itemChosen?: boolean;
  /** O último gesto de saída observado no gatilho ou na barra. */
  gesture?: MenuExitGesture | null;
}

/**
 * Traduz o motivo do radix-ng para o vocabulário da família.
 *
 * Função pura e exportada de propósito: os eventos `*_close` nascem na camada
 * de produto, nunca aqui — primitivo de UI que importa `@/lib/analytics` é o
 * que a regra `analytics_in_ui_primitive` proíbe. Mesma forma do
 * `popoverCloseReason`.
 */
export function menuCloseReason(
  libReason: string | undefined,
  hints: MenuCloseHints = {},
): MenuCloseReason {
  switch (libReason) {
    case 'escape-key':
      return 'escape';
    // "Saí do menu sem decidir nada": clique fora, Tab (o wrapper fecha a
    // cadeia com `focus-out`), clique no gatilho aberto, passagem ao menu
    // vizinho e o botão solto fora do painel depois de abrir pressionando.
    case 'outside-press':
    case 'focus-out':
    case 'trigger-press':
    case 'sibling-open':
    case 'cancel-open':
      return 'overlay';
  }
  // Sobra `none`, ausente e o que a lib acrescentar. Item escolhido é a
  // decisão de quem usa; o gesto observado desempata os caminhos da barra que a
  // lib não nomeia; e o resto é o menu fechado por CÓDIGO — "decisão de dentro".
  if (hints.itemChosen) return 'api';
  if (hints.gesture === 'escape') return 'escape';
  if (hints.gesture === 'leave') return 'overlay';
  return 'api';
}

/**
 * O gesto de saída de um evento de entrada. Qualquer outro evento devolve
 * `null`, e é isso que impede um gesto velho de valer para um fechamento que
 * veio muito depois dele.
 */
export function menuExitGesture(event: { type: string; key?: string }): MenuExitGesture | null {
  if (event.type === 'pointerdown') return 'leave';
  if (event.type !== 'keydown') return null;
  if (event.key === 'Escape') return 'escape';
  if (event.key === 'Enter' || event.key === ' ') return 'leave';
  return null;
}

/**
 * O estado que o motivo precisa quando a lib não o dá — o de uma BARRA, que
 * tem vários menus, ou o de um menu só.
 *
 * Três sinais:
 *  · o item de ação escolhido, por menu (`chose`);
 *  · a passagem ao menu vizinho: a barra ABRE o vizinho antes de fechar o que
 *    estava aberto, então um fechamento com outro menu aberto é passagem;
 *  · o último gesto no gatilho ou na barra (`observe`, ou `watch` para ouvir
 *    em captura). A abertura consome o gesto que a causou.
 */
export class MenuCloseTracker {
  private readonly openMenus = new Set<string>();
  private chosenIn: string | null = null;
  private gesture: MenuExitGesture | null = null;

  /** Um menu abriu. */
  opened(menu: string): void {
    this.openMenus.add(menu);
    this.gesture = null;
    if (this.chosenIn === menu) this.chosenIn = null;
  }

  /** Um item de AÇÃO foi escolhido — a escolha fecha o menu, e o fechamento é `api`. */
  chose(menu: string): void {
    this.chosenIn = menu;
  }

  /** Um evento de entrada no gatilho ou na barra. */
  observe(event: { type: string; key?: string }): void {
    this.gesture = menuExitGesture(event);
  }

  /**
   * Ouve os eventos de entrada de `host` em CAPTURA — antes do gatilho, que
   * fecha o menu no próprio ouvinte e às vezes barra a propagação. Devolve como
   * parar.
   */
  watch(host: EventTarget): () => void {
    const onInput = (event: Event) => this.observe(event as Event & { key?: string });
    host.addEventListener('pointerdown', onInput, { capture: true });
    host.addEventListener('keydown', onInput, { capture: true });
    return () => {
      host.removeEventListener('pointerdown', onInput, { capture: true });
      host.removeEventListener('keydown', onInput, { capture: true });
    };
  }

  /** Um menu fechou: o motivo no vocabulário da família. */
  closed(menu: string, libReason: string | undefined): MenuCloseReason {
    this.openMenus.delete(menu);
    const itemChosen = this.chosenIn === menu;
    if (itemChosen) this.chosenIn = null;
    const gesture: MenuExitGesture | null = this.openMenus.size > 0 ? 'leave' : this.gesture;
    return menuCloseReason(libReason, { itemChosen, gesture });
  }
}
