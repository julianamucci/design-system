// ─── Posicionamento de painel flutuante — uma conta só ───────────────────────
//
// Popover, DropdownMenu, Tooltip, submenu e ContextMenu portalam o painel para
// o `body` e o posicionam por JS. A conta é a mesma: medir a âncora, medir o
// painel, escolher o eixo pelo `side` e o deslocamento no outro eixo pelo
// `align`.
//
// Estava escrita duas vezes e meia: `positionFloating` no popover (com `side` e
// `align`), `positionTooltip` no tooltip (mesma conta, só o centro) e
// `positionDropdown` no dropdown (bottom/start cravados a 4px). Duas cópias
// divergem — e divergiram: o dropdown nunca ganhou `side`, e a story dele
// declarava um controle que não alcançava nada.
//
// O arquivo tem TRÊS camadas, e a separação existe para poder ser provada:
//
//   • a GEOMETRIA (`computeFloatingPosition`, `computePointPosition`) é pura —
//     entram números, saem números. É o que a suíte `--project unit` alcança,
//     porque ela roda em node e não tem DOM nenhum;
//   • os ENVOLTÓRIOS (`positionFloating`, `positionFloatingAtPoint`) leem o DOM,
//     chamam a geometria e escrevem `top`/`left`;
//   • quem chama decide o que ANUNCIAR no markup, porque o atributo de estado é
//     contrato de cada componente — com a exceção nomeada do `flip`, explicada
//     abaixo.

/** Borda da âncora por onde o painel sai. */
export type FloatingSide = 'top' | 'bottom' | 'left' | 'right';

/** Encosto do painel no eixo perpendicular ao `side`. */
export type FloatingAlign = 'start' | 'center' | 'end';

/**
 * Margem mínima entre o painel e a borda da janela, em px.
 *
 * Um único valor para as duas funções: painel encostado sem respiro parece
 * cortado, e dois respiros diferentes no mesmo sistema aparecem como
 * inconsistência sem que nada denuncie a causa.
 */
const RESPIRO = 8;

/** A janela visível, em coordenadas de documento. */
export type FloatingViewport = {
  scrollX: number;
  scrollY: number;
  /** Largura visível — `document.documentElement.clientWidth`. */
  width: number;
  /** Altura visível — `document.documentElement.clientHeight`. */
  height: number;
};

/**
 * A âncora, em coordenadas de JANELA (o que `getBoundingClientRect` devolve).
 *
 * É um subconjunto de `DOMRect` de propósito: a geometria não pode depender de
 * um tipo do DOM, ou a suíte de node não conseguiria montá-la.
 */
export type FloatingAnchorRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/** O que a geometria devolve: coordenadas de DOCUMENTO e o lado FINAL. */
export type FloatingPlacement = {
  top: number;
  left: number;
  /**
   * O lado onde o painel de fato ficou. Igual ao pedido, salvo quando o `flip`
   * estava ligado e o lado oposto coube melhor.
   */
  side: FloatingSide;
};

const OPPOSITE: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Encaixa uma coordenada no trilho visível de um eixo.
 *
 * `Math.max(min, …)` por FORA: com painel maior que a janela os dois limites se
 * cruzam, e nessa ordem sobra o de cima — encostar na margem de início é melhor
 * que empurrar para fora do lado oposto.
 */
function fitToViewport(value: number, scroll: number, visible: number, size: number): number {
  return Math.max(scroll + RESPIRO, Math.min(value, scroll + visible - size - RESPIRO));
}

/**
 * Quantos px FALTAM para o painel caber deste lado da âncora. Zero = cabe.
 *
 * É a medida que o `flip` compara, e ela é contínua de propósito: um booleano
 * "cabe/não cabe" não distingue o lado que estoura por 2px do que estoura por
 * 200px, e é justamente essa diferença que decide se virar melhora ou só troca
 * um transbordamento por outro.
 */
function deficitOnSide(
  side: FloatingSide,
  anchor: FloatingAnchorRect,
  panelWidth: number,
  panelHeight: number,
  offset: number,
  viewport: FloatingViewport,
): number {
  if (side === 'bottom') {
    return Math.max(0, panelHeight - (viewport.height - RESPIRO - (anchor.bottom + offset)));
  }
  if (side === 'top') {
    return Math.max(0, panelHeight - (anchor.top - offset - RESPIRO));
  }
  if (side === 'right') {
    return Math.max(0, panelWidth - (viewport.width - RESPIRO - (anchor.right + offset)));
  }
  return Math.max(0, panelWidth - (anchor.left - offset - RESPIRO));
}

export type ComputeFloatingInput = {
  anchor: FloatingAnchorRect;
  panelWidth: number;
  panelHeight: number;
  side: FloatingSide;
  align: FloatingAlign;
  offset: number;
  viewport: FloatingViewport;
  /** Trocar o lado quando o oposto couber MELHOR. Ver `FloatingOptions.flip`. */
  flip?: boolean;
};

/**
 * A conta, sem DOM: entram medidas, sai `{ top, left, side }`.
 *
 * Exportada porque é o único jeito de PROVAR o posicionamento nesta stack. O
 * projeto `unit` do vitest roda em `environment: 'node'` e não há jsdom no
 * `package.json`; a suíte de navegador existe, mas não abre submenu por conta
 * própria — foi assim que o painel saindo da tela viveu tanto tempo.
 */
export function computeFloatingPosition(input: ComputeFloatingInput): FloatingPlacement {
  const { anchor, panelWidth: pw, panelHeight: ph, align, offset, viewport } = input;

  // ── `flip`, e por que ele é OPT-IN ─────────────────────────────────────────
  //
  // Virar o lado muda o contrato de quem chamou: pedir `top` e receber `bottom`
  // é resposta diferente da pergunta. Pior, o lado é LIDO pela folha — o balão
  // do tooltip desenha a seta e o `transform-origin` por `[data-side]`, e o
  // tooltip escreve esse atributo em DOIS elementos (painel e seta) e ainda
  // calcula a coordenada cruzada da seta a partir do lado. Um `flip` automático
  // deixaria a seta apontando para o lado errado em todos os chamadores que não
  // souberam que ela precisava ser refeita: defeito que compila, renderiza e
  // nenhum portão desta casa reprova.
  //
  // Então quem pede, assume. Hoje o único que pede é o submenu, que é onde o
  // defeito está medido: ele abre com `side: 'right'`, cujo eixo principal é o
  // horizontal, e perto da borda direita da janela o painel excedia mesmo com o
  // travamento do eixo cruzado em pé.
  //
  // A regra da troca: só vira se o oposto couber MELHOR (déficit estritamente
  // menor). Empate mantém o lado pedido, e trocar para um lado que também não
  // cabe é PIOR que não trocar — perde-se a previsibilidade sem ganhar pixel.
  let side = input.side;
  if (input.flip) {
    const opposite = OPPOSITE[side];
    const atual = deficitOnSide(side, anchor, pw, ph, offset, viewport);
    const oposto = deficitOnSide(opposite, anchor, pw, ph, offset, viewport);
    if (oposto < atual) side = opposite;
  }

  const verticalAxis = side === 'top' || side === 'bottom';

  let top = 0;
  let left = 0;

  if (side === 'bottom') {
    top = anchor.bottom + viewport.scrollY + offset;
  } else if (side === 'top') {
    top = anchor.top + viewport.scrollY - ph - offset;
  } else if (side === 'left') {
    left = anchor.left + viewport.scrollX - pw - offset;
  } else {
    left = anchor.right + viewport.scrollX + offset;
  }

  if (verticalAxis) {
    if (align === 'start') left = anchor.left + viewport.scrollX;
    else if (align === 'end') left = anchor.right + viewport.scrollX - pw;
    else left = anchor.left + viewport.scrollX + anchor.width / 2 - pw / 2;
  } else {
    if (align === 'start') top = anchor.top + viewport.scrollY;
    else if (align === 'end') top = anchor.bottom + viewport.scrollY - ph;
    else top = anchor.top + viewport.scrollY + anchor.height / 2 - ph / 2;
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
  // trabalho de `flip` (trocar o lado), não de `shift` (deslizar no cruzado) —
  // e o `flip` agora EXISTE, logo acima, mas continua desligado por padrão pelo
  // motivo escrito lá. Sem ele, o eixo principal segue intocado de propósito.
  //
  // Uma coisa que o `flip` NÃO muda: o eixo. O oposto de `right` é `left` e o de
  // `bottom` é `top`, então principal e cruzado continuam sendo os mesmos dois
  // depois da troca — o que muda é a coordenada do principal. Vale escrever
  // porque é a leitura errada mais fácil de fazer aqui, e ela levaria alguém a
  // recalcular o eixo cruzado que já estava certo.
  if (verticalAxis) {
    left = fitToViewport(left, viewport.scrollX, viewport.width, pw);
  } else {
    top = fitToViewport(top, viewport.scrollY, viewport.height, ph);
  }

  return { top, left, side };
}

export type ComputePointInput = {
  /** Coordenada de JANELA do ponto — o `clientX` do evento. */
  x: number;
  /** Coordenada de JANELA do ponto — o `clientY` do evento. */
  y: number;
  panelWidth: number;
  panelHeight: number;
  viewport: FloatingViewport;
};

/**
 * A conta da ancoragem por PONTO, sem DOM.
 *
 * O painel nasce com o canto superior esquerdo no ponto e desliza para caber —
 * `shift` nos DOIS eixos, sem `flip`.
 *
 * Por que não vira de lado: um menu de contexto não tem lado. Ele não sai de uma
 * borda de elemento; sai do lugar exato onde a pessoa clicou, e esse lugar é a
 * referência que ela tem na tela. Virar o painel para cima do ponteiro num
 * clique perto da borda inferior afastaria o menu do gesto que o pediu — e não
 * há `data-side` que descreva o resultado, porque não havia lado para começar.
 * Deslizar mantém o canto o mais perto possível do clique e sempre visível, que
 * é o comportamento de menu de contexto de todo sistema operacional.
 */
export function computePointPosition(input: ComputePointInput): { top: number; left: number } {
  const { x, y, panelWidth: pw, panelHeight: ph, viewport } = input;
  return {
    left: fitToViewport(x + viewport.scrollX, viewport.scrollX, viewport.width, pw),
    top: fitToViewport(y + viewport.scrollY, viewport.scrollY, viewport.height, ph),
  };
}

export type FloatingOptions = {
  /**
   * Trocar o lado quando o oposto couber melhor.
   *
   * Desligado por padrão — ver o bloco em `computeFloatingPosition`. Com ele
   * ligado, `positionFloating` passa a ESCREVER `data-side` no painel com o
   * lado final, porque a folha e as stories leem o lado por ali e um atributo
   * que contradiz a coordenada é pior que atributo nenhum.
   */
  flip?: boolean;
};

/** Lê o estado da janela uma vez, no formato que a geometria espera. */
function readViewport(): FloatingViewport {
  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  };
}

/**
 * Prepara o painel para ser MEDIDO e devolve as medidas.
 *
 * Invisível para não piscar na posição antiga — e SÓ isso.
 *
 * Havia também um `display: block` aqui, herdado das três cópias que esta
 * função substituiu, e ele ficava depois da medida. Inline vence a folha:
 * `.nds-popover-content` declara `display: flex` com `gap` de 10px entre os
 * filhos diretos, e a declaração inline apagava os dois. Esta stack ficava sem
 * o respiro que as outras quatro têm, sem erro nenhum e sem nada no DOM
 * denunciando — a classe estava lá, aplicada, e perdendo.
 *
 * Era desnecessário desde sempre: as fábricas chamam `appendChild` ANTES de
 * posicionar, então o painel já está no documento e `offsetWidth` mede sem que
 * ninguém precise mexer no `display`. Um painel fechado aqui não existe; ele é
 * criado ao abrir e removido ao fechar.
 *
 * A função ESCREVE `top`/`left`, então ela é quem garante o esquema de
 * posicionamento de que esses dois dependem — e antes de medir, porque
 * `offsetWidth` de um painel em fluxo mede a largura do pai, não a do conteúdo.
 * Antes isto vinha da folha de cada painel, o que obrigava
 * `.nds-tooltip-content` a ser absoluto nas CINCO stacks para servir a uma; nas
 * outras quatro o balão vive dentro de um wrapper posicionado pela lib, e sair
 * do fluxo ali colapsa esse wrapper para 0×0.
 */
function measurePanel(panel: HTMLElement): { panelWidth: number; panelHeight: number } {
  panel.style.position = 'absolute';
  panel.style.visibility = 'hidden';
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;
  panel.style.visibility = '';
  return { panelWidth, panelHeight };
}

/**
 * Escreve `top`/`left` absolutos no painel a partir de uma âncora ELEMENTO.
 *
 * O painel precisa estar no documento e com `position: absolute` — a medida sai
 * de `offsetWidth`/`offsetHeight`, que valem zero em nó desanexado.
 *
 * @param offset Vão entre âncora e painel, em px. É o `sideOffset` das outras
 *               stacks; cada fábrica traz o próprio padrão.
 * @returns O lado FINAL. Igual ao pedido, salvo `flip` que trocou — quem tem
 *          elemento satélite dependente do lado (a seta do tooltip) o reconcilia
 *          por aqui.
 */
export function positionFloating(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: FloatingSide,
  align: FloatingAlign,
  offset = 8,
  options: FloatingOptions = {},
): FloatingSide {
  const rect = anchor.getBoundingClientRect();
  const { panelWidth, panelHeight } = measurePanel(panel);

  const placement = computeFloatingPosition({
    anchor: rect,
    panelWidth,
    panelHeight,
    side,
    align,
    offset,
    viewport: readViewport(),
    flip: options.flip,
  });

  panel.style.top = `${placement.top}px`;
  panel.style.left = `${placement.left}px`;

  // Só com `flip` ligado: sem ele o lado não muda, e escrever aqui atropelaria
  // o `data-side` que popover, tooltip e dropdown já escrevem por conta própria
  // — cada um no momento em que monta o painel, junto do `data-align`.
  if (options.flip) panel.dataset.side = placement.side;

  return placement.side;
}

/**
 * Escreve `top`/`left` absolutos no painel a partir de um PONTO.
 *
 * A irmã de `positionFloating` para quando a âncora não é um elemento: o menu de
 * contexto sai do `clientX`/`clientY` do clique. Antes disto o `context-menu`
 * escrevia as duas coordenadas cruas, sem travamento nenhum, e um clique direito
 * perto da borda direita ou inferior punha metade do menu fora da tela.
 *
 * Sem `side`, sem `align` e sem `flip` — um ponto não tem bordas para sair, e o
 * porquê de não virar está em `computePointPosition`. Também não escreve
 * `data-side`, pelo mesmo motivo: não há lado a anunciar.
 */
export function positionFloatingAtPoint(x: number, y: number, panel: HTMLElement): void {
  const { panelWidth, panelHeight } = measurePanel(panel);

  const { top, left } = computePointPosition({
    x,
    y,
    panelWidth,
    panelHeight,
    viewport: readViewport(),
  });

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}
