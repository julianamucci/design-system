export { default as QuotaBanner } from './QuotaBanner.vue'

/**
 * O vocabulário da FAIXA DE COTA.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `QuotaBanner.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela fica AO LADO das outras medições, nunca dentro de nenhuma
 * delas, e não entra na API de outra peça. Quem a usa a importa inteira,
 * componente e vocabulário. O que este índice acrescenta é a porta única da
 * peça, a mesma por onde as irmãs desta família saem.
 *
 * A API DIVERGE do primitivo de referência num ponto só, e é registrada em vez
 * de "alinhada": o TIPO dos controles. Eles entram por propriedade, com o mesmo
 * nome e na mesma forma — uma lista —, e o que muda é o que a lista carrega:
 * nós desta stack, e não nós do documento. Quem monta o controle o monta com as
 * ferramentas desta stack, e a peça o hospeda sem saber o que ele é.
 *
 * O que NÃO diverge é o resto: o desenho, o teto obrigatório, o horizonte que
 * chega escrito, a cota esgotada que troca o número por palavra em vez de
 * ganhar um quarto nível, e a conta que decide o resto, a razão e o nível —
 * `remainingUnits`, `spentFraction`, `fractionLevel` e `fractionPercent`, do
 * primitivo compartilhado.
 */
export type { QuotaAllowance, QuotaBannerLabels } from './QuotaBanner.vue'
