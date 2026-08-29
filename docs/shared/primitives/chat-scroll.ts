/**
 * chat-scroll.ts — a decisão de rolagem da conversa, compartilhada pelas 5.
 * Sem imports de framework e sem acesso ao DOM.
 * Importar via: import { onThreadScroll } from '@shared/primitives/chat-scroll'
 *
 * POR QUE ISTO É COMPARTILHADO
 *
 * A regra de acessibilidade da thread cabe em duas frases — "mensagem nova não
 * move o foco" e "a rolagem só acompanha o fim se já estava no fim" — e é
 * justamente esse tipo de frase que rende cinco implementações diferentes. Cada
 * stack escreveria o seu `if`, cada um com o próprio limiar, e a divergência só
 * apareceria com a conversa em movimento: quem lê uma resposta antiga sendo
 * arrastado para o fim numa stack e não na outra.
 *
 * O que mora aqui é a MÁQUINA, não a rolagem em si. Ler `scrollTop`, chamar
 * `scrollTo` e observar o container é trabalho de cada stack; decidir se está no
 * fim, se deve seguir e quantas mensagens chegaram enquanto se lia para trás é
 * o mesmo em todas — e é testável sem navegador.
 *
 * O CONTRATO DE MOMENTO, que a função não pode impor sozinha
 *
 * `atBottom` tem de ser medido ANTES de o conteúdo crescer. Depois que a
 * mensagem entra no DOM, o `scrollHeight` já mudou e a mesma conta responde
 * "não está no fim" para quem estava — o consumidor perderia o acompanhamento
 * exatamente quando ele importa. A ordem é: medir, inserir, e só então rolar se
 * o estado disser para seguir.
 */

/** O que o consumidor lê do container que rola. */
export type ThreadMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

/**
 * Estado da rolagem da conversa.
 *
 * `unread` conta mensagens que chegaram enquanto NÃO se estava no fim. É o
 * número que o botão de "ir para o fim" mostra, e o motivo de ele existir:
 * sem a contagem, o botão diz que há novidade sem dizer quanta.
 */
export type ThreadScrollState = {
  atBottom: boolean;
  unread: number;
};

/**
 * A conversa começa no fim, que é onde a última mensagem está.
 *
 * `unread` em zero e `atBottom` verdadeiro: quem abre a thread vê o fim dela, e
 * não há nada acumulado para anunciar.
 */
export const initialThreadScroll: ThreadScrollState = { atBottom: true, unread: 0 };

/**
 * Folga, em pixels, para considerar que a rolagem está no fim.
 *
 * Não é zero por três motivos que aparecem em tela de verdade: a rolagem por
 * roda para em número fracionário, o zoom do navegador produz altura com
 * fração, e uma sombra ou margem de um pixel no último item bastaria para o
 * "no fim" nunca ser verdadeiro. 32px é menos que a altura de uma linha de
 * texto, então nenhuma mensagem inteira cabe na folga.
 */
export const BOTTOM_THRESHOLD = 32;

/** A rolagem está no fim, dentro da folga? */
export function isAtBottom(metrics: ThreadMetrics, threshold = BOTTOM_THRESHOLD): boolean {
  const { scrollTop, scrollHeight, clientHeight } = metrics;
  // `scrollHeight - clientHeight` é o máximo que `scrollTop` alcança. Quando o
  // conteúdo não transborda, o máximo é zero (ou negativo, por arredondamento)
  // e a conta responde "no fim" — que é o certo: uma conversa de duas
  // mensagens está sempre no fim.
  return scrollHeight - clientHeight - scrollTop <= threshold;
}

/**
 * A pessoa rolou. Recalcula o estado e ZERA a contagem ao chegar no fim.
 *
 * Zerar aqui, e não só no clique do botão, é o que faz a contagem descrever o
 * que ainda não foi visto: quem rola até o fim com a mão viu o que havia.
 */
export function onThreadScroll(
  state: ThreadScrollState,
  metrics: ThreadMetrics,
  threshold = BOTTOM_THRESHOLD,
): ThreadScrollState {
  const atBottom = isAtBottom(metrics, threshold);
  if (atBottom === state.atBottom && (atBottom ? state.unread === 0 : true)) return state;
  return { atBottom, unread: atBottom ? 0 : state.unread };
}

/**
 * Uma mensagem chegou.
 *
 * Se a rolagem estava no fim, o consumidor deve seguir o fim e nada se acumula.
 * Se não estava, a mensagem entra na contagem e a rolagem NÃO se mexe — quem
 * está lendo uma resposta antiga continua onde estava.
 */
export function onThreadMessage(state: ThreadScrollState): ThreadScrollState {
  if (state.atBottom) return state;
  return { ...state, unread: state.unread + 1 };
}

/** O consumidor deve rolar até o fim depois de inserir a mensagem? */
export function shouldFollow(state: ThreadScrollState): boolean {
  return state.atBottom;
}

/** Foi ao fim pelo botão: volta ao fim e a contagem zera. */
export function onJumpToEnd(): ThreadScrollState {
  return initialThreadScroll;
}
