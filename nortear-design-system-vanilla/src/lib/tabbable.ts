// ─── Tab que sai de um menu — o destino, uma conta só ─────────────────────────
//
// Menu NÃO prende o foco (C2 e D1 do PRD do DropdownMenu, e o padrão de menu da
// WAI-ARIA APG): Tab, com o menu aberto, fecha o menu e o foco segue o percurso
// da página a partir do GATILHO — o próximo ponto de tabulação depois dele, ou o
// anterior no Shift+Tab. Vale para o painel raiz e para o do submenu, e para os
// três menus desta stack que vestem a mesma folha: DropdownMenu, ContextMenu
// (onde o "gatilho" é a área do clique direito) e Menubar (onde é a BARRA, que é
// uma parada só).
//
// POR QUE A CONTA É NOSSA, e o Tab não fica com o navegador. Medido em
// 2026-09-10 com teclado real (Playwright), um botão antes e outro depois do
// gatilho, antes deste módulo existir:
//
//   DropdownMenu e ContextMenu  o menu fechava, mas o foco partia do FIM do
//                               documento — o painel vive em portal no `body`, e
//                               remover o item em foco deixa lá o ponto de
//                               partida da tabulação. Tab saía do documento (na
//                               suíte, dava a volta até "Antes"); Shift+Tab caía
//                               na ÚLTIMA parada da página, "Depois".
//   Menubar                     nada escutava o Tab: o menu ficava ABERTO com o
//                               foco fora dele; Shift+Tab parava no gatilho da
//                               própria barra, e no submenu (também em portal) o
//                               foco saía pelo fim do documento com os dois
//                               painéis abertos.
//
// O ponto de partida da tabulação é do navegador, e não há API que o mova. O que
// resolve é consumir a tecla (`preventDefault`) e pôr o foco no destino — a
// mesma forma do `handleTabKeyDown` do bits-ui, que as outras stacks seguem.
// Não é armadilha: o foco SAI do menu em todos os ramos, inclusive quando não há
// vizinho (volta ao gatilho em vez de ficar no item).
//
// O que ESTE módulo não faz é fechar o menu: cada fábrica fecha pelo seu
// caminho, porque o fechamento carrega o que é dela — o modo controlado do
// dropdown, o `reason` do context-menu, a tabulação itinerante do menubar.

/**
 * Tudo o que PODE ser parada de tabulação. A conta final é de `tabIndex`: um
 * `[tabindex="-1"]` casa aqui e sai no filtro — é o marcador de foco
 * programático, e é assim que os itens de menu e os gatilhos vizinhos de uma
 * barra (tabulação itinerante) ficam fora do percurso.
 */
const CANDIDATES = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

/** Tab puro ou com Shift. Com Alt, Ctrl ou Meta a tecla é de outro gesto. */
export function isPlainTab(event: KeyboardEvent): boolean {
  return event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey;
}

function isTabbable(el: HTMLElement): boolean {
  if (el.tabIndex < 0) return false;
  if (el.matches(':disabled')) return false;
  // Painel de menu não é destino: os itens já têm `tabindex="-1"`, e isto
  // cobre o que alguém pusesse lá dentro com `tabindex` próprio.
  if (el.closest('[inert], [hidden], [role="menu"]')) return false;
  // Sem caixa, ou invisível, o navegador não para ali — `display: none` num
  // ancestral, `visibility: hidden`, `<details>` fechado.
  return el.checkVisibility({ visibilityProperty: true });
}

/**
 * O próximo (`next`) ou o anterior (`prev`) ponto de tabulação da página,
 * contado a partir de `anchor`, em ordem de documento.
 *
 * O que está DENTRO de `anchor` não conta nos dois sentidos: a âncora é um
 * lugar só no percurso, e é isso que faz a barra de menus inteira valer como
 * uma parada — o Tab parte do fim dela, e o Shift+Tab do começo. Também não
 * conta quem CONTÉM a âncora.
 *
 * `null` quando não há vizinho naquele sentido: a âncora é a primeira ou a
 * última parada da página. Quem chama decide o que fazer — os menus devolvem o
 * foco ao gatilho.
 *
 * `tabindex` positivo não reordena esta conta; o design system não o usa, e o
 * percurso da página continua sendo o do documento.
 */
export function tabbableBeside(
  anchor: HTMLElement,
  direction: 'next' | 'prev',
): HTMLElement | null {
  const candidates = Array.from(
    anchor.ownerDocument.querySelectorAll<HTMLElement>(CANDIDATES),
  ).filter((el) => !anchor.contains(el) && !el.contains(anchor) && isTabbable(el));

  if (direction === 'next') {
    return (
      candidates.find(
        (el) => anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
      ) ?? null
    );
  }
  const before = candidates.filter(
    (el) => anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
  );
  return before[before.length - 1] ?? null;
}

/**
 * O destino do Tab que sai de um menu: o vizinho de `anchor` no sentido da
 * tecla, e, sem vizinho, `fallback` — o gatilho. Nunca o `<body>`, e nunca o fim
 * do documento onde o painel vive em portal.
 */
export function tabExitTarget(
  event: KeyboardEvent,
  anchor: HTMLElement,
  fallback: HTMLElement = anchor,
): HTMLElement {
  return tabbableBeside(anchor, event.shiftKey ? 'prev' : 'next') ?? fallback;
}
