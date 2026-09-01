export { default as ComputerUse } from './ComputerUse.vue'

/**
 * O vocabulário da TELA DO COMPUTADOR.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ComputerUse.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela desenha UMA sessão, não sabe que as irmãs existem e não entra
 * na API de nenhuma outra. Quem a usa a importa inteira, componente e
 * vocabulário. O que este índice acrescenta é a porta única da peça, a mesma
 * por onde as irmãs desta família saem.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o ESPAÇO da
 * tela entra por SLOT NOMEADO — `#screen` —, e não por uma propriedade que
 * recebesse um nó já montado. Divergência de forma de composição não tem fonte
 * de verdade (regra do repositório), e o precedente desta stack é o retrato do
 * autor em `ChatMessage.vue`: espaço de quem consome se escreve no template,
 * porque é lá que esta stack escreve interface.
 *
 * O que NÃO diverge é o resto, e é o que importa: o endereço com a palavra que
 * só quem ouve recebe, o quadro que recorta, o rastro de no máximo três marcas
 * com o ponto em propriedade personalizada, a legenda como `<figcaption>`, o
 * índice preso ao alcance e o `aria-busy` só enquanto a sessão corre.
 */
export type { ComputerUseLabels } from './ComputerUse.vue'
