/**
 * O slot com escopo desenhou alguma coisa PARA ESTA mensagem?
 *
 * Existe por uma diferença concreta entre desenhar nó vindo de prop e desenhar
 * slot: a prop ou está lá ou não está, e o invólucro se decide por ela. O slot
 * está sempre declarado — quem decide turno a turno é o `v-if` de quem consome,
 * dentro dele. Sem esta leitura, `.nds-chat-message-actions` nasceria em TODA
 * mensagem, e um invólucro vazio não é invisível: ele soma o `gap` do corpo da
 * mensagem, e a conversa inteira ganha um degrau que ninguém pediu.
 *
 * `:empty` na folha não resolveria: o `v-for` e o `v-if` do Vue deixam âncoras
 * de texto vazio no elemento, e `:empty` não casa com elemento que tem nó de
 * texto — nem vazio. Medir os nós é o que sobra, e é barato.
 */
import { Comment, Fragment, Text, type VNode } from 'vue'

/** Um nó, sozinho, desenha alguma coisa? */
function renders(node: unknown): boolean {
  if (node === null || node === undefined || typeof node === 'boolean') return false
  if (Array.isArray(node)) return node.some(renders)
  if (typeof node === 'string' || typeof node === 'number') return String(node).trim() !== ''
  const vnode = node as VNode
  // `v-if` falso vira comentário: presente na árvore, invisível na tela.
  if (vnode.type === Comment) return false
  if (vnode.type === Text) return String(vnode.children ?? '').trim() !== ''
  if (vnode.type === Fragment) return renders(vnode.children)
  return true
}

/** O que o slot devolveu tem conteúdo desenhável? */
export function hasSlotContent(nodes: unknown): boolean {
  return renders(nodes)
}
