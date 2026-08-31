export { default as ThinkingIndicator } from './ThinkingIndicator.vue'

/**
 * O indicador não publica vocabulário, e isso é uma decisão.
 *
 * As peças irmãs desta família exportam daqui um objeto de rótulos, porque
 * desenham várias coisas que precisam de palavra — estado, espécie, unidade. O
 * indicador desenha UMA: a frase que anuncia a espera. Um `ThinkingIndicatorLabels`
 * de campo único seria uma cerimônia em volta de uma string, e quem consome
 * teria de montar um objeto para dizer três palavras.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": onde uma raiz
 * imperativa recebe um objeto de opções e devolve o elemento pronto, aqui a
 * frase é a prop `label` e a classe extra chega pela forma desta stack. O nome
 * das duas propriedades é o mesmo que o conteúdo compartilhado descreve —
 * `label` e `class` —, então não há linha de tabela a sobrescrever.
 *
 * Não há prop de quantidade de pontos, nem de aparecer e sumir: os três pontos
 * estão escritos na folha, e sumir é de quem monta a conversa.
 */
