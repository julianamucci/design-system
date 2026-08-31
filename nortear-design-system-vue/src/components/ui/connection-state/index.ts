export { default as ConnectionState } from './ConnectionState.vue'

/**
 * O vocabulário do ESTADO DA LIGAÇÃO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ConnectionState.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela fica junto de onde a conversa acontece, e não dentro de moldura
 * nenhuma, e não entra na API de nenhuma outra. Quem a usa a importa inteira,
 * componente e vocabulário. O que este índice acrescenta é a porta única da
 * peça, a mesma por onde as irmãs desta família saem.
 *
 * A API DIVERGE do primitivo de referência, e é assim que tem de ser: lá o
 * aviso de que alguém pediu para tentar de novo é um retorno passado por prop;
 * aqui é um EVENTO (`@retry`), que é a forma desta stack para "o componente
 * avisa e quem consome decide". Divergência de API de framework não se
 * "alinha": registra-se.
 *
 * O que NÃO diverge é o resto, e é o que importa: o desenho, os três estados, a
 * palavra que descreve cada um e a pergunta que decide se a contagem tem o que
 * contar — `isRetryScheduled`, do vocabulário compartilhado.
 */
export type { ConnectionStateLabels } from './ConnectionState.vue'
