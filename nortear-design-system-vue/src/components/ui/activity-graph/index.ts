export { default as ActivityGraph } from './ActivityGraph.vue';

/**
 * O vocabulário da GRADE DE ATIVIDADE.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ActivityGraph.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela desenha UMA grade, não sabe que as irmãs existem e não entra na
 * API de nenhuma outra. Quem a usa a importa inteira, componente e vocabulário.
 * O que este índice acrescenta é a porta única da peça, a mesma por onde as
 * irmãs desta família saem.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": a CLASSE
 * EXTRA entra por atributo de repasse, e não por uma propriedade `class`
 * declarada — mesma decisão já registrada no `index.ts` do `flow-graph` e do
 * `trace-waterfall` desta stack. Divergência de forma de composição não tem
 * fonte de verdade (regra do repositório), e nesta stack o repasse é o caminho
 * da casa: o Vue funde `class` e `style` de quem chama na raiz do componente
 * sozinho, e declarar a propriedade DESLIGARIA essa fusão em vez de acrescentar
 * coisa alguma. É por esse mesmo caminho que a story da casa apertada aperta
 * `--activity-graph-cell` no próprio elemento, que é onde a folha declara a
 * propriedade.
 *
 * O que NÃO diverge é o resto, e é o que importa: a peça não desenha nada sem
 * janela ou sem escala — e desenha SIM sem atividade nenhuma, que é a
 * diferença desta família em relação às duas irmãs —, a camada que rola tem
 * papel, nome e parada de teclado na mesma linha, as duas fileiras de rótulo
 * ficam fora do que é lido em voz, a posição e o nível de cada casa entram em
 * propriedade personalizada, cada casa diz em palavras o dia, a contagem e o
 * nível, a legenda repete a escala em palavras, e o `aria-busy` só existe
 * enquanto a execução corre.
 */
export type { ActivityGraphLabels } from './ActivityGraph.vue';
