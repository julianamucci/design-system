export { default as InlineCitation } from './InlineCitation.vue'

/**
 * O vocabulário da CITAÇÃO EM LINHA.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `InlineCitation.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela desenha UMA marca, não conhece as vizinhas e não entra na API
 * de nenhuma outra. Quem a usa a importa inteira, componente e vocabulário. O
 * que este índice acrescenta é a porta única da peça, a mesma por onde as irmãs
 * desta família saem.
 *
 * `Citation` e `ChatSource` NÃO saem daqui, e a ausência é o assunto: eles são
 * de `@shared/primitives/chat-protocol`, e reexportá-los faria parecer que esta
 * peça é dona do vocabulário. Ela não é — a mesma `Citation` alimenta a lista
 * de fontes do turno.
 *
 * AS DUAS DIVERGÊNCIAS DE API DE FRAMEWORK, registradas e não "alinhadas":
 *
 *   · O aviso de cada abertura e cada fechamento é um EVENTO, `@open-change`, e
 *     não uma propriedade de callback. Quem consome o escuta, e o dado que
 *     viaja é o mesmo dos dois lados — o novo estado da caixa.
 *   · O comando de fora chega por `ref` de template sobre o que a peça expõe,
 *     que é a forma que esta stack tem para falar com uma instância montada.
 *     Não há propriedade `open` controlada em stack nenhuma: a peça abre e
 *     fecha por ORDEM, e é isso que resolve a exclusão mútua entre duas prévias
 *     sem que ela precise conhecer as vizinhas.
 *
 * O que NÃO diverge é o resto, e é o que importa: a abertura pelo clique, o
 * nome acessível que chega escrito, a caixa que é filha da marca, o `<q>` do
 * trecho, a pergunta sobre o endereço no ponto em que ele encosta na página, e
 * o que não veio não ocupando lugar.
 */
export type { InlineCitationCommands, InlineCitationLabels } from './InlineCitation.vue'
