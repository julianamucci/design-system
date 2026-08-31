export { default as AgentStatus } from './AgentStatus.vue'

/**
 * O vocabulário do ESTADO DA EXECUÇÃO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `AgentStatus.vue` porque a peça é AUTÔNOMA e mora em pasta própria
 * — ela fica ACIMA do campo de mensagem, não dentro dele, e não entra na API de
 * nenhuma outra. Quem a usa a importa inteira, componente e vocabulário. O que
 * este índice acrescenta é a porta única da peça, a mesma por onde as irmãs
 * desta família saem.
 *
 * A API DIVERGE do primitivo de referência, e é assim que tem de ser: lá o
 * aviso de que alguém pediu a ação é um retorno passado por prop; aqui é um
 * EVENTO (`@action`), que é a forma desta stack para "o componente avisa e quem
 * consome decide". Divergência de API de framework não se "alinha":
 * registra-se.
 *
 * O que NÃO diverge é o resto, e é o que importa: o desenho, os cinco estados,
 * a palavra que descreve cada um e a pergunta que decide o que a ação pede —
 * `isRunFinished`, do vocabulário compartilhado.
 */
export type { AgentStatusIntent, AgentStatusLabels } from './AgentStatus.vue'
