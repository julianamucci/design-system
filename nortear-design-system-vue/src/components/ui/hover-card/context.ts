import type { InjectionKey, Ref } from 'vue'

/**
 * Contexto do HoverCard — só o gatilho.
 *
 * O painel vive num portal no `<body>`, longe do gatilho no DOM, e precisa
 * escrever `aria-describedby` NELE enquanto está aberto. Procurar o gatilho por
 * seletor daria, numa tela com vários cartões, sempre o mesmo: a associação tem
 * de vir da árvore de componentes, e é isso que este contexto carrega.
 */
export type HoverCardContext = {
  trigger: Ref<HTMLElement | null>
}

export const KEY_HOVER_CARD: InjectionKey<HoverCardContext> = Symbol('nds-hover-card')
