export { default as TraceWaterfall } from './TraceWaterfall.vue';

/**
 * O vocabulário da CASCATA DE TRECHOS.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `TraceWaterfall.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela desenha UMA cascata, não sabe que as irmãs existem e não entra
 * na API de nenhuma outra. Quem a usa a importa inteira, componente e
 * vocabulário. O que este índice acrescenta é a porta única da peça, a mesma
 * por onde as irmãs desta família saem.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": a CLASSE
 * EXTRA entra por atributo de repasse, e não por uma propriedade `class`
 * declarada — mesma decisão já registrada no `index.ts` do `flow-graph` desta
 * stack. Divergência de forma de composição não tem fonte de verdade (regra do
 * repositório), e nesta stack o repasse é o caminho da casa: o Vue funde
 * `class` e `style` de quem chama na raiz do componente sozinho, e declarar a
 * propriedade DESLIGARIA essa fusão em vez de acrescentar coisa alguma. É por
 * esse mesmo caminho que a story dos limites aperta
 * `--trace-waterfall-name-min` no próprio elemento, que é onde a folha declara
 * a propriedade.
 *
 * O que NÃO diverge é o resto, e é o que importa: a peça não desenha nada sem
 * trecho ou sem eixo com extensão, a camada que rola tem papel, nome e parada
 * de teclado na mesma linha, a régua de cada linha fica fora do que é lido em
 * voz, o recuo e a posição da barra entram em propriedade personalizada, cada
 * linha diz em palavras o estado, o começo e a duração, e o `aria-busy` só
 * existe enquanto a execução corre.
 */
export type { TraceWaterfallLabels } from './TraceWaterfall.vue';
