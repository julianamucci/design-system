import type { MaybeRefOrGetter } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { SIDEBAR_MOBILE_QUERY } from '@/components/ui/sidebar/utils'

/**
 * Diz se a largura atual da janela cai no modo móvel.
 *
 * Construído sobre `matchMedia` (via `useMediaQuery`) e NÃO sobre
 * `window.innerWidth` + evento `resize`: as duas medidas discordam porque
 * `innerWidth` conta a barra de rolagem e a consulta de mídia não. Quem
 * misturasse as duas trocaria de modo numa largura diferente do resto da stack
 * — e do CSS, que também é `matchMedia`. Um mecanismo só, portanto.
 *
 * A consulta é parâmetro, e aceita ref/getter, para que o ponto de virada possa
 * vir de fora (ver `SIDEBAR_MOBILE_QUERY`).
 */
export function useIsMobile(query: MaybeRefOrGetter<string> = SIDEBAR_MOBILE_QUERY) {
  return useMediaQuery(query)
}
