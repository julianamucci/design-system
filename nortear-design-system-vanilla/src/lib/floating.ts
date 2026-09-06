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

  // Invisível para não piscar na posição antiga — e SÓ isso.
  //
  // Havia também um `display: block` aqui, herdado das três cópias que esta
  // função substituiu, e ele ficava depois da medida. Inline vence a folha:
  // `.nds-popover-content` declara `display: flex` com `gap` de 10px entre os
  // filhos diretos, e a declaração inline apagava os dois. Esta stack ficava sem
  // o respiro que as outras quatro têm, sem erro nenhum e sem nada no DOM
  // denunciando — a classe estava lá, aplicada, e perdendo.
  //
  // Era desnecessário desde sempre: as três fábricas chamam `appendChild` ANTES
  // de posicionar, então o painel já está no documento e `offsetWidth` mede sem
  // que ninguém precise mexer no `display`. Um painel fechado aqui não existe;
  // ele é criado ao abrir e removido ao fechar.
  // A função ESCREVE `top`/`left`, então ela é quem garante o esquema de
  // posicionamento de que esses dois dependem — e antes de medir, porque
  // `offsetWidth` de um painel em fluxo mede a largura do pai, não a do
  // conteúdo. Antes isto vinha da folha de cada painel, o que obrigava
  // `.nds-tooltip-content` a ser absoluto nas CINCO stacks para servir a uma;
  // nas outras quatro o balão vive dentro de um wrapper posicionado pela lib, e
  // sair do fluxo ali colapsa esse wrapper para 0×0.
  panel.style.position = 'absolute';
  panel.style.visibility = 'hidden';
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

  // ── Correção de borda, e SÓ no eixo cruzado ────────────────────────────────
  //
  // Sem isto o painel simplesmente sai da tela. Medido em 2026-09-06 com uma
  // sonda que amostra o `body` quadro a quadro: um painel de 288px centrado num
  // gatilho a x=53 ficava em **x=-91**, e ficava lá — não é transição nem
  // corrida, é a coordenada calculada. Na tela aparece como um card cortado na
  // margem esquerda. As outras quatro stacks não tinham o defeito porque a lib
  // headless de cada uma traz detecção de colisão ligada por padrão; o vanilla,
  // que é a referência de contrato da casa, era o único posicionando sem ela.
  //
  // O eixo importa, e a primeira tentativa errou nisso: clampar TAMBÉM o eixo
  // principal empurra o painel por cima do gatilho quando falta espaço, o que
  // desfaz o `side` pedido. As suítes pegaram na hora — `Side Top` do popover e
  // `Placement Sides` do tooltip afirmam essa relação. Encaixar sem espaço é
  // trabalho de `flip` (trocar o lado), não de `shift` (deslizar no cruzado), e
  // `flip` não existe aqui: pedir `top` e receber `bottom` mudaria o contrato de
  // quem chamou, e o `data-side` que a folha lê para desenhar a seta.
  //
  // `Math.max(min, …)` por FORA: com painel maior que a janela os dois limites
  // se cruzam, e nessa ordem sobra o de cima — encostar na margem de início é
  // melhor que empurrar para fora do lado oposto.
  const respiro = 8;
  if (side === 'bottom' || side === 'top') {
    const larguraVisivel = document.documentElement.clientWidth;
    left = Math.max(
      scrollX + respiro,
      Math.min(left, scrollX + larguraVisivel - pw - respiro),
    );
  } else {
    const alturaVisivel = document.documentElement.clientHeight;
    top = Math.max(
      scrollY + respiro,
      Math.min(top, scrollY + alturaVisivel - ph - respiro),
    );
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}
