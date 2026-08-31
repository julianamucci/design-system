export { default as ContextDisplay } from './ContextDisplay.vue'

/**
 * A lista das formas.
 *
 * Ela sai daqui como VALOR, e não só como tipo, porque quem monta a grade das
 * três — story, docs page — precisa percorrê-la. Lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export { CONTEXT_DISPLAY_FORMS } from './ContextDisplay.vue'

/**
 * O vocabulário do USO DO CONTEXTO.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `ContextDisplay.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela fica AO LADO do campo de mensagem, não dentro dele, e não entra
 * na API de nenhuma outra. Quem a usa a importa inteira, componente e
 * vocabulário. O que este índice acrescenta é a porta única da peça, a mesma
 * por onde as irmãs desta família saem.
 *
 * A API NÃO DIVERGE do primitivo de referência, e é o caso raro em que isso vale
 * ser dito: a peça é só leitura, então não há retorno nem evento — o ponto em
 * que as cinco stacks costumam deixar de se parecer simplesmente não existe
 * aqui. As três props têm o mesmo nome nas cinco.
 *
 * O que também não diverge é o resto: o desenho, as três formas, a conta que
 * decide o nível e a palavra que o descreve — `usedPercent` e `budgetLevel`, do
 * primitivo compartilhado.
 */
export type { ContextDisplayForm, ContextDisplayLabels } from './ContextDisplay.vue'
