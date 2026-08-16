export const SIDEBAR_COOKIE_NAME = "sidebar:state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/**
 * A consulta de mídia que decide se a barra é coluna ou gaveta sobreposta.
 *
 * Existe como ponto de injeção — e não cravada dentro do hook — porque o ponto
 * de virada é do produto, não do design system: uma aplicação com sidebar mais
 * estreita, ou com um layout que já reserva a coluna, vira em outra largura.
 * É também o que permite exercitar o caminho móvel sem redimensionar o
 * navegador: uma story passa `(min-width: 0px)` ao `SidebarProvider` e o ramo
 * da gaveta fica determinístico no runner headless, onde o parâmetro `viewport`
 * do Storybook não mexe no tamanho do iframe.
 *
 * A forma é canônica, COM parênteses, de propósito: o `MediaQuery` do
 * `svelte/reactivity` só embrulha a consulta quando ela ainda não os tem
 * (`/\(.+\)/`), então esta string chega intacta ao `matchMedia` — sem parênteses
 * duplicados e sem depender de aritmética de breakpoint.
 */
export const SIDEBAR_MOBILE_QUERY = "(max-width: 767px)";
