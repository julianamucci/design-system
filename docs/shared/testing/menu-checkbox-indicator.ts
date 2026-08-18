/**
 * Forma desenhada dentro do indicador de um item de marcação de menu.
 *
 * O contrato visual é de dois símbolos distintos: **tique** para marcado e
 * **traço** para o estado misto ("alguns dos filhos marcados"). Nenhuma das
 * duas coisas pode ser afirmada pelo nome da classe nem pelo nome do ícone —
 * classe sobrevive à regra vazia, e o pacote de ícones muda de embalagem entre
 * stacks. O que não muda é a GEOMETRIA: um traço horizontal tem altura zero e
 * largura cheia; um tique tem a diagonal, e portanto tem altura.
 *
 * `SVGSVGElement.getBBox()` devolve a caixa dos filhos no sistema de
 * coordenadas do próprio `viewBox`, então a medida independe do tamanho em que
 * o CSS resolveu desenhar o ícone.
 */
export type FormaDoIndicador = { largura: number; altura: number } | null;

/**
 * Mede o glifo do indicador de `item`, ou devolve `null` quando não há glifo
 * nenhum — que é o resultado esperado do estado desmarcado.
 */
export function formaDoIndicador(item: Element): FormaDoIndicador {
  const svg = item.querySelector('svg');
  if (!svg || typeof svg.getBBox !== 'function') return null;
  const caixa = svg.getBBox();
  // Sem filho geométrico o `getBBox` devolve tudo zerado; isso é "sem glifo",
  // e não um traço de largura zero.
  if (caixa.width === 0 && caixa.height === 0) return null;
  return { largura: caixa.width, altura: caixa.height };
}

/** Traço: atravessa o indicador na horizontal e não tem altura própria. */
export function ehTraco(forma: FormaDoIndicador): boolean {
  return forma !== null && forma.largura > 4 && forma.altura < 1;
}

/** Tique: tem a perna diagonal, logo tem altura comparável à largura. */
export function ehTique(forma: FormaDoIndicador): boolean {
  return forma !== null && forma.largura > 4 && forma.altura > 4;
}
