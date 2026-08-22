import type { InjectionKey, Ref } from 'vue'

/**
 * Contexto do HoverCard — só o gatilho.
 *
 * O painel vive num portal no `<body>`, longe do gatilho no DOM, e é dele que
 * sai o nome acessível do `role="dialog"`. Procurar o gatilho por seletor
 * daria, numa tela com vários cartões, o mesmo nome a todos: a associação tem
 * de vir da árvore de componentes, e é isso que este contexto carrega.
 */
export type HoverCardContext = {
  gatilho: Ref<HTMLElement | null>
}

export const KEY_HOVER_CARD: InjectionKey<HoverCardContext> = Symbol('nds-hover-card')
