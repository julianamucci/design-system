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
 * de "alinhada": o espaço dos controles é um SLOT (`#actions`), e não uma lista
 * de nós do documento passada por propriedade. É a forma desta stack para "quem
 * desenha é quem consome", a mesma que a conversa e o cartão de autorização já
 * usam — quem monta o controle o monta com as ferramentas daqui, e a peça o
 * hospeda sem saber o que ele é.
 *
 * O que NÃO diverge é o resto: o desenho, o teto obrigatório, o horizonte que
 * chega escrito, a cota esgotada que troca o número por palavra em vez de
 * ganhar um quarto nível, e a conta que decide o resto, a razão e o nível —
 * `remainingUnits`, `spentFraction`, `fractionLevel` e `fractionPercent`, do
 * primitivo compartilhado.
 */
export type { QuotaAllowance, QuotaBannerLabels } from './QuotaBanner.vue'
