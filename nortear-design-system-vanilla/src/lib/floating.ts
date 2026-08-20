// ─── Posicionamento de painel flutuante — uma conta só ───────────────────────
//
// Popover, DropdownMenu e Tooltip portalam o painel para o `body` e o
// posicionam por JS. A conta é a mesma nos três: medir a âncora, medir o
// painel, escolher o eixo pelo `side` e o deslocamento no outro eixo pelo
// `align`.
//
// Estava escrita duas vezes e meia: `positionFloating` no popover (com `side` e
// `align`), `positionTooltip` no tooltip (mesma conta, só o centro) e
// `positionDropdown` no dropdown (bottom/start cravados a 4px). Duas cópias
// divergem — e divergiram: o dropdown nunca ganhou `side`, e a story dele
// declarava um controle que não alcançava nada.
//
// Aqui não há `data-side` nem classe: quem chama decide o que anunciar no
// markup, porque o atributo de estado é contrato de cada componente.

/** Borda da âncora por onde o painel sai. */
export type FloatingSide = 'top' | 'bottom' | 'left' | 'right';

/** Encosto do painel no eixo perpendicular ao `side`. */
export type FloatingAlign = 'start' | 'center' | 'end';

/**
 * Escreve `top`/`left` absolutos no painel a partir da âncora.
 *
 * O painel precisa estar no documento e com `position: absolute` — a medida sai
 * de `offsetWidth`/`offsetHeight`, que valem zero em nó desanexado.
 *
 * @param offset Vão entre âncora e painel, em px. É o `sideOffset` das outras
 *               stacks; cada fábrica traz o próprio padrão.
 */
export function positionFloating(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: FloatingSide,
  align: FloatingAlign,
  offset = 8,
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Visível para medir, e invisível para não piscar na posição antiga.
  //
  // O `display: block` FICA depois da medida, e isso é herdado de propósito: era
  // o comportamento das três cópias que esta função substitui. No dropdown e no
  // tooltip ele não muda nada (um `<ul>` e uma `<div>` já são blocos), mas no
  // popover ele VENCE o `display: flex` que a folha compartilhada declara em
  // `.nds-popover-content`, e com ele some o `gap` entre os filhos diretos.
  // Corrigir aqui mudaria o desenho de todo popover desta stack numa tarefa que
  // é de API — fica registrado como divergência a decidir, não silenciada.
  panel.style.visibility = 'hidden';
  panel.style.display = 'block';
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  panel.style.visibility = '';

  let top = 0;
  let left = 0;

  if (side === 'bottom') {
    top = rect.bottom + scrollY + offset;
  } else if (side === 'top') {
    top = rect.top + scrollY - ph - offset;
  } else if (side === 'left') {
    left = rect.left + scrollX - pw - offset;
  } else {
    left = rect.right + scrollX + offset;
  }

  if (side === 'bottom' || side === 'top') {
    if (align === 'start') left = rect.left + scrollX;
    else if (align === 'end') left = rect.right + scrollX - pw;
    else left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else {
    if (align === 'start') top = rect.top + scrollY;
    else if (align === 'end') top = rect.bottom + scrollY - ph;
    else top = rect.top + scrollY + rect.height / 2 - ph / 2;
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}
