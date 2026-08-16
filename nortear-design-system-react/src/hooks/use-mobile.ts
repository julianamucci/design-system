import * as React from "react"

/**
 * A consulta de mídia que decide se a barra lateral é coluna ou gaveta.
 *
 * Constante exportada, e não número cravado dentro do hook, porque o ponto de
 * virada é do produto e não do design system: uma aplicação com sidebar mais
 * estreita vira mais tarde, e quem consome precisa poder dizer isso. É também
 * o que permite exercitar o caminho móvel sem redimensionar o navegador —
 * enquanto a largura vivia presa aqui, nenhuma story alcançava esse ramo.
 */
export const SIDEBAR_MOBILE_QUERY = "(max-width: 767px)"

/**
 * `useSyncExternalStore` é a forma canônica de assinar matchMedia — sem
 * setState em effect (react-hooks/set-state-in-effect) e sem valor indefinido
 * no primeiro render.
 *
 * `subscribe` e `getSnapshot` são memorizados POR CONSULTA. Se fossem funções
 * novas a cada render, o store cancelaria e refaria a assinatura em todo ciclo;
 * se fossem funções de módulo, a consulta passada por parâmetro nunca chegaria
 * ao `matchMedia`. A dependência é exatamente `query`.
 */
export function useIsMobile(query: string = SIDEBAR_MOBILE_QUERY) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
