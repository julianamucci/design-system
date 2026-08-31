/**
 * As repartições de demonstração do "de onde veio o contexto", umas só para as
 * cinco.
 *
 * Mesma razão de `chat-examples.ts` e de `tool-group-examples.ts`, e a regra
 * está escrita na §3.3 da guideline 17: se cada stack escreve a própria
 * repartição de exemplo, as cinco stories deixam de fotografar a mesma tela e a
 * divergência só aparece no Chromatic, como diferença de largura de fatia que
 * ninguém consegue atribuir a nada.
 *
 * Aqui isso é mais apertado do que nas outras peças, e vale dizer por quê: a
 * ORDEM das parcelas decide a cor de cada fatia e a linha de cada legenda. Cinco
 * listas escritas à mão divergiriam na ordem antes de divergirem no número, e a
 * foto sairia com as mesmas cores em parcelas diferentes.
 *
 * Nada de framework e nada de i18n: o `id` de uma parcela é ENDEREÇO, e a
 * palavra que se lê é interface — mora na `translations.json`, em três idiomas,
 * como a palavra de cada nível já mora.
 *
 * ONDE ESTE ARQUIVO DEVERIA MORAR: a §3.3 pede um arquivo por FAMÍLIA
 * (`medicao-examples.ts`), e é para lá que estas constantes vão quando a
 * terceira peça de medição precisar delas. O nome por slug segue o precedente
 * de `tool-group-examples.ts`, e pelo mesmo motivo mecânico — um arquivo por
 * família é exatamente o arquivo em que duas mãos colidem enquanto a família
 * está sendo construída.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT). Ver
 * `docs/shared/guidelines/17-componentes-conversacionais.md`.
 */

import type { ContextPart } from './token-budget';

/**
 * As quatro procedências, na ordem canônica.
 *
 * A ordem é a do CICLO DE VIDA do contexto, e não a do tamanho: o sistema entra
 * antes da primeira mensagem, o histórico cresce a cada turno, os anexos chegam
 * quando alguém os traz, e o resultado de ferramenta é o último a ser colado.
 * Escolhida assim porque é estável — a do tamanho mudaria a cada turno, que é
 * exatamente o que a decisão 4 de `token-budget.ts` proíbe.
 *
 * A lista é exportada, e não escrita à mão nos andaimes, para que o mapa de
 * rótulos das cinco stacks saia dela: procedência nova entra nos cinco de uma
 * vez, ou reprova nos cinco de uma vez.
 */
export const CONTEXT_PART_IDS = ['system', 'history', 'attachments', 'tools'] as const;

export type ContextPartId = (typeof CONTEXT_PART_IDS)[number];

/**
 * A repartição de uma conversa já andada — o exemplo padrão.
 *
 * Soma vinte e cinco mil, que é exatamente o consumo do exemplo `warning` da
 * peça irmã. Os dois números foram casados de propósito: a story de composição
 * mostra as duas peças juntas, e um total diferente ali faria parecer que elas
 * medem coisas diferentes quando medem a mesma.
 *
 * Os pesos fecham em cem por cento sem ajuda — é o caso comum, e o caso comum
 * não é lugar de mostrar borda.
 */
export const CONTEXT_PARTS_TYPICAL: ContextPart[] = [
  { id: 'system', tokens: 1_500 },
  { id: 'history', tokens: 17_000 },
  { id: 'attachments', tokens: 5_000 },
  { id: 'tools', tokens: 1_500 },
];

/**
 * A repartição com uma parcela quase invisível.
 *
 * `tools` vale cem tokens em vinte e cinco mil: quatro décimos de um por cento.
 * A fatia é um fio na barra, e o que salva a parcela é o NÚMERO EM TEXTO ao
 * lado do nome — que é a razão de a peça inteira não confiar em cor.
 *
 * É também onde a decisão 5 de `token-budget.ts` se vê: o peso sai como 1%, e
 * não como 0%, e por isso a coluna soma noventa e nove. Somar cem seria mentir
 * sobre a parcela que existe.
 */
export const CONTEXT_PARTS_SLIVER: ContextPart[] = [
  { id: 'system', tokens: 1_200 },
  { id: 'history', tokens: 18_400 },
  { id: 'attachments', tokens: 5_300 },
  { id: 'tools', tokens: 100 },
];

/**
 * Tudo veio de uma procedência só.
 *
 * A conversa sem anexo, sem ferramenta e com instrução de sistema vazia. A
 * barra fica de uma cor só, e as três parcelas zeradas CONTINUAM na legenda —
 * é a decisão do primitivo, e é ela que mantém a cor de cada linha apontando
 * para a fatia certa.
 */
export const CONTEXT_PARTS_SINGLE: ContextPart[] = [
  { id: 'system', tokens: 0 },
  { id: 'history', tokens: 25_000 },
  { id: 'attachments', tokens: 0 },
  { id: 'tools', tokens: 0 },
];

/**
 * A conversa que ainda não começou.
 *
 * Não há o que repartir, e o vazio aqui é VERDADE — diferente da peça irmã, em
 * que um medidor vazio mentiria sobre um teto desconhecido. Por isso a barra
 * fica e aparece vazia, em vez de sumir.
 */
export const CONTEXT_PARTS_EMPTY: ContextPart[] = CONTEXT_PART_IDS.map((id) => ({
  id,
  tokens: 0,
}));
