import type { ComputedRef, Ref } from 'vue'
import { createContext } from 'reka-ui'

export const SIDEBAR_COOKIE_NAME = 'sidebar_state'
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3rem'
export const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

/**
 * A consulta de mídia que decide se a barra é coluna ou gaveta sobreposta.
 *
 * Abaixo deste corte, 16rem numa tela estreita não deixariam conteúdo, então a
 * barra deixa o fluxo e vira gaveta modal.
 *
 * É uma constante exportada — e não um número cravado dentro do provider —
 * porque o ponto de virada é do produto, não do design system: uma aplicação
 * com barra mais estreita vira mais tarde, e quem consome precisa poder dizer
 * isso sem reescrever o componente. É também o que permite exercitar o caminho
 * móvel num teste sem redimensionar o navegador: basta passar uma consulta
 * sempre verdadeira.
 */
export const SIDEBAR_MOBILE_QUERY = '(max-width: 767px)'

export const [useSidebar, provideSidebarContext] = createContext<{
  state: ComputedRef<'expanded' | 'collapsed'>
  open: Ref<boolean>
  setOpen: (value: boolean) => void
  isMobile: Ref<boolean>
  openMobile: Ref<boolean>
  setOpenMobile: (value: boolean) => void
  toggleSidebar: () => void
}>('Sidebar')
