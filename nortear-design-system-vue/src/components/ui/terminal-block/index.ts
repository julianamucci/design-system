export { default as TerminalBlock } from './TerminalBlock.vue'

/**
 * O vocabulário do BLOCO DE TERMINAL.
 *
 * Ele é REEXPORTADO daqui, e não redeclarado: os tipos moram no bloco de módulo
 * do próprio `TerminalBlock.vue` porque a peça é AUTÔNOMA e mora em pasta
 * própria — ela desenha UM comando, não conhece a sequência em que está e não
 * entra na API de nenhuma outra. Quem a usa a importa inteira, componente e
 * vocabulário. O que este índice acrescenta é a porta única da peça, a mesma
 * por onde as irmãs desta família saem.
 *
 * A API NÃO DIVERGE do primitivo de referência, e é a peça da família em que
 * isso acontece: as irmãs avisam por evento aquilo que lá volta por prop, e
 * esta não avisa nada — ela não oferece ação nenhuma, porque parar e repetir
 * são do estado da execução. Sem aviso não há evento, e o que sobra são
 * propriedades que já se chamam igual nas cinco stacks.
 *
 * O que também não diverge é o resto, e é o que importa: o desenho, os cinco
 * estados, a palavra que descreve cada um, a saída preservada como veio e a
 * pergunta que decide se já existe código de saída — `isRunFinished`, do
 * vocabulário compartilhado.
 */
export type { TerminalBlockLabels } from './TerminalBlock.vue'
