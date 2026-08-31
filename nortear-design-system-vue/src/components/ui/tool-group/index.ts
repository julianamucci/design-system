export { default as ToolGroup } from './ToolGroup.vue'

/**
 * O vocabulário do GRUPO DE CHAMADAS DE FERRAMENTA.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ToolGroup.vue` porque a peça é AUTÔNOMA e mora em pasta própria —
 * ela fica junto da resposta, e não dentro de nenhuma outra, e não entra na API
 * de peça alguma. Quem a usa a importa inteira, componente e vocabulário. O que
 * este índice acrescenta é a porta única da peça, a mesma por onde as irmãs
 * desta família saem.
 *
 * A API DIVERGE do primitivo de referência, e é assim que tem de ser: lá o
 * aviso de que alguém abriu ou fechou a caixa é um retorno passado por
 * propriedade; aqui é um EVENTO (`@open-change`), que é a forma desta stack
 * para "o componente avisa e quem consome decide". Divergência de API de
 * framework não se "alinha": registra-se.
 *
 * O que NÃO diverge é o resto, e é o que importa: o desenho, os quatro estados
 * de uma chamada, a palavra que descreve cada um, a precedência que decide o
 * que o resumo diz (`summarizeToolCalls`) e a separação da chamada que espera
 * por uma pessoa (`splitWaitingCalls`) — as duas do vocabulário compartilhado.
 */
export type { ToolGroupLabels } from './ToolGroup.vue'
