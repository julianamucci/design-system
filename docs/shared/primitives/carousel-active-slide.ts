/**
 * Estado "este é o slide atual", escrito no DOM para o CSS poder responder.
 *
 * A escala do slide ativo é regra de folha compartilhada — a mesma nas cinco
 * stacks — mas quem SABE qual slide é o atual é o motor, e cada stack tem o
 * seu: quatro rodam sobre `transform` com um motor que avisa por evento, e uma
 * rola nativamente e deduz o índice da posição de rolagem. O ponto comum é este
 * atributo, e é por isso que ele mora aqui e não copiado cinco vezes.
 *
 * O ESTADO É TRÊS, e o terceiro é a ausência do atributo. Antes de o motor
 * medir — o que só acontece depois de a raiz entrar no documento — nenhum slide
 * é "o atual", e nesse instante todos ficam em tamanho cheio. Escrever `"false"`
 * de largada faria cada story nascer com os slides encolhidos e pulando para o
 * tamanho certo no quadro seguinte. Por isso o negativo é ESCRITO, e nunca
 * deduzido de ausência: `data-active="false"` significa "o motor mediu e este
 * não é o atual", que é coisa diferente de "ainda não se sabe".
 */

/** O atributo é único e escrito num lugar só, para não divergir de vocabulário. */
export const ATTR_SLIDE_ACTIVE = 'data-active';

/** O valor que o slide `indice` deve carregar quando o atual é `atual`. */
export function slideState(indice: number, atual: number): 'true' | 'false' {
  return indice === atual ? 'true' : 'false';
}

/**
 * Escreve o estado em todos os slides de uma vez.
 *
 * Percorre a lista inteira de propósito: marcar só o novo atual deixaria o
 * anterior marcado também, e a folha veria dois slides em tamanho cheio.
 */
export function marcarSlideCurrent(slides: readonly HTMLElement[], atual: number): void {
  slides.forEach((slide, indice) => {
    slide.setAttribute(ATTR_SLIDE_ACTIVE, slideState(indice, atual));
  });
}
