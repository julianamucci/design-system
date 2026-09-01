export { default as MessageTiming } from './MessageTiming.vue'

/**
 * O vocabulário do TEMPO DE UMA RESPOSTA.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `MessageTiming.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela convive com as quatro medições irmãs sem que nenhuma saiba da
 * outra, e não entra na API de nenhuma. Quem a usa a importa inteira,
 * componente e vocabulário. O que este índice acrescenta é a porta única da
 * peça, a mesma por onde as irmãs desta família saem.
 *
 * A DIVERGÊNCIA DE API é uma só, e está no docblock do componente: não há prop
 * `class`, porque a classe extra chega por atributo e o renderizador já a
 * concatena à classe da raiz. `stats`, `streaming` e `labels` têm o mesmo nome
 * em todas as stacks, e a peça é só leitura — sem retorno para avisar e sem
 * ação para oferecer, não há evento, que é justamente o ponto em que as stacks
 * costumam deixar de se parecer.
 *
 * NÃO HÁ CONTA A REEXPORTAR, e a ausência é o desenho: tempo não tem teto, então
 * não há fração para tirar, limiar para comparar nem nível para nomear. As
 * quatro medições irmãs leem `@shared/primitives/token-budget`; esta não lê
 * nada, porque tudo o que ela mostra já chegou escrito de quem mediu.
 */
export type { MessageTimingLabels, MessageTimingStat } from './MessageTiming.vue'
