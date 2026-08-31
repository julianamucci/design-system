export { default as ContextBreakdown } from './ContextBreakdown.vue'

/**
 * O vocabulário da REPARTIÇÃO DO CONTEXTO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ContextBreakdown.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela convive com a medição da janela sem que nenhuma das duas saiba
 * da outra, e não entra na API de nenhuma. Quem a usa a importa inteira,
 * componente e vocabulário. O que este índice acrescenta é a porta única da
 * peça, a mesma por onde as irmãs desta família saem.
 *
 * A API NÃO DIVERGE do primitivo de referência, e é o caso raro em que isso vale
 * ser dito: a peça é só leitura, então não há retorno nem evento — o ponto em
 * que as cinco stacks costumam deixar de se parecer simplesmente não existe
 * aqui. As duas props têm o mesmo nome nas cinco.
 *
 * O que também não diverge é o resto: o desenho, a ordem das parcelas, a parcela
 * zerada que continua na lista e o por cento travado nas duas pontas —
 * `contextSlices` e `contextTotal`, do primitivo compartilhado.
 *
 * `ContextPart` NÃO sai por aqui, e a ausência é decisão: ele é vocabulário
 * compartilhado, mora em `@shared/primitives/token-budget` e quem monta a
 * repartição já o importa de lá. Reexportá-lo criaria um segundo endereço para
 * o mesmo tipo, que é como duas definições do mesmo dado começam.
 */
export type { ContextBreakdownLabels } from './ContextBreakdown.vue'
