export { default as AgentPlan } from './AgentPlan.vue'

/**
 * O vocabulário do PLANO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `AgentPlan.vue` porque a peça é AUTÔNOMA e mora em pasta própria —
 * ela desenha a lista que recebe e não entra na API de nenhuma outra. Quem a usa
 * a importa inteira, componente e vocabulário. O que este índice acrescenta é a
 * porta única da peça, a mesma por onde as irmãs desta família saem.
 *
 * O PASSO em si — `PlanStep`, `PlanStepState` — vem de
 * `@shared/primitives/chat-protocol`, e é o mesmo nas cinco stacks, junto da
 * pergunta que decide qual passo é o atual (`isStepFinished`). O que mora aqui é
 * só o texto, porque o nome da lista e a palavra de cada estado são texto de
 * interface e têm três idiomas.
 *
 * A API DIVERGE do primitivo de referência num ponto, e é assim que tem de ser:
 * lá a classe extra entra por opção, porque a raiz imperativa não tem outro
 * caminho; aqui ela chega sozinha à `<ol>` pelo repasse de atributos, e uma prop
 * de classe seria uma segunda porta para a mesma coisa. Divergência de API de
 * framework não se "alinha": registra-se.
 *
 * O que NÃO diverge é o resto, e é o que importa: a marcação, os cinco estados,
 * a palavra que descreve cada um, o passo que fica marcado como atual e a
 * ausência de lista quando não há passo nenhum.
 */
export type { AgentPlanLabels } from './AgentPlan.vue'
