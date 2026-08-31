export { default as ApprovalCard } from './ApprovalCard.vue'

/**
 * O vocabulário do CARTÃO DE AUTORIZAÇÃO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ApprovalCard.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela fica à vista, junto de onde a conversa acontece, e não dentro
 * de moldura nenhuma, e não entra na API de nenhuma outra. Quem a usa a importa
 * inteira, componente e vocabulário. O que este índice acrescenta é a porta
 * única da peça, a mesma por onde as irmãs desta família saem.
 *
 * A API DIVERGE do primitivo de referência em dois pontos, e é assim que tem de
 * ser: lá o espaço dos controles é uma lista de nós passada por propriedade e o
 * aviso da escolha é um retorno; aqui os controles entram por um SLOT
 * (`#actions`) e o aviso sai por um EVENTO (`@choose`) — as duas formas desta
 * stack para "o componente dá o lugar, e quem consome decide". Divergência de
 * API de framework não se "alinha": registra-se.
 *
 * O que NÃO diverge é o resto, e é o que importa: o desenho, a marcação, a
 * região viva que envolve a pergunta e o alcance e para antes dos controles, a
 * lista de definição do alcance, e o atributo `data-approval-choice` — o único
 * pedaço do contrato que atravessa a fronteira do que a peça desenha.
 */
export type { ApprovalScopeItem } from './ApprovalCard.vue'
