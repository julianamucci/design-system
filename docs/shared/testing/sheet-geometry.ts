/**
 * sheet-geometry.ts — a direção do Sheet medida, não inferida.
 *
 * `data-side="left"` é um atributo: ele prova que a prop chegou, não que o
 * painel encostou na borda esquerda. Quem decide a posição é o CSS
 * (`.nds-sheet-content[data-side="left"]`), e é ele que uma classe morta, um
 * seletor renomeado ou uma folha não carregada quebram sem que atributo nenhum
 * mude.
 *
 * A medição precisa ESPERAR. O painel entra deslocado — pelas keyframes
 * (`translateX(100%)`) ou pelo `data-starting-style` das libs headless
 * (`translateX(2.5rem)`) — então uma leitura única pega o quadro em que ele
 * ainda está fora da tela. Foi o defeito medido no drawer: `left < 1` passava
 * com o painel em -384.
 *
 * Sem dependência de framework nem de `storybook/test` de propósito: as cinco
 * stacks importam este mesmo arquivo.
 */

export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

/** Folga aceita em px. Abaixo de 1 o arredondamento subpixel derruba a medida. */
const FOLGA = 1;

function distanciaAteABorda(caixa: DOMRect, side: SheetSide): number {
  switch (side) {
    case 'right':  return window.innerWidth - caixa.right;
    case 'left':   return caixa.left;
    case 'top':    return caixa.top;
    case 'bottom': return window.innerHeight - caixa.bottom;
  }
}

/** Distância até a borda OPOSTA — o que separa "encostou" de "ocupou a tela". */
function distanciaAteAOposta(caixa: DOMRect, side: SheetSide): number {
  const oposta: Record<SheetSide, SheetSide> = {
    right: 'left', left: 'right', top: 'bottom', bottom: 'top',
  };
  return distanciaAteABorda(caixa, oposta[side]);
}

/**
 * Espera o painel assentar encostado na borda declarada e devolve a caixa final.
 *
 * Falha se ele parar longe da borda (transform não assentou, ou o lado é outro)
 * e também se encostar nas DUAS bordas do eixo: um painel que ocupa a tela
 * inteira satisfaria a primeira metade em qualquer direção, e a asserção
 * deixaria de distinguir left de right.
 */
export async function esperarEncostarNaBorda(
  painel: HTMLElement,
  side: SheetSide,
  timeout = 3000,
): Promise<DOMRect> {
  const limite = Date.now() + timeout;
  let ultimaFalha = 'o painel não foi medido';

  for (;;) {
    const caixa = painel.getBoundingClientRect();
    const encostou = Math.abs(distanciaAteABorda(caixa, side)) <= FOLGA;
    const sobrouEspaco = distanciaAteAOposta(caixa, side) > FOLGA;

    if (encostou && sobrouEspaco) return caixa;

    ultimaFalha = encostou
      ? `o painel encostou nas duas bordas do eixo de "${side}" — não dá para distinguir a direção`
      : `o painel parou a ${distanciaAteABorda(caixa, side).toFixed(1)}px da borda "${side}"`;

    if (Date.now() > limite) throw new Error(ultimaFalha);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
