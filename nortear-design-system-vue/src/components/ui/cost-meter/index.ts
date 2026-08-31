export { default as CostMeter } from './CostMeter.vue'

/**
 * O vocabulário do CUSTO DE UMA EXECUÇÃO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `CostMeter.vue` porque a peça é AUTÔNOMA e mora em pasta própria —
 * ela fica AO LADO da medição da janela e abaixo da linha de estado, nunca
 * dentro de nenhuma das duas, e não entra na API de outra peça. Quem a usa a
 * importa inteira, componente e vocabulário. O que este índice acrescenta é a
 * porta única da peça, a mesma por onde as irmãs desta família saem.
 *
 * A API NÃO DIVERGE do primitivo de referência, e é o caso raro em que isso
 * vale ser dito: a peça é só leitura. Sem retorno para avisar e sem ação para
 * oferecer, não há `emit` — e é justamente o emit que costuma ser o ponto em
 * que as cinco stacks deixam de se parecer. As três props têm o mesmo nome nas
 * cinco.
 *
 * O que também não diverge é o resto: o desenho, a decisão de o dinheiro chegar
 * escrito, o par em que o teto anda, e a conta que decide o por cento e o nível
 * — `spentFraction`, `fractionPercent` e `fractionLevel`, do primitivo
 * compartilhado.
 */
export type { CostBudget, CostMeterLabels } from './CostMeter.vue'
