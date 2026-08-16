import { MediaQuery } from "svelte/reactivity";
import { SIDEBAR_MOBILE_QUERY } from "@/components/ui/sidebar/constants.js";

/**
 * `true` enquanto a consulta de mídia casar.
 *
 * Recebe a CONSULTA pronta, e não um número de breakpoint: a aritmética
 * `${breakpoint - 1}px` cravava a forma da regra aqui dentro (sempre
 * `max-width`, sempre um pixel a menos) e não deixava quem consome trocar o
 * critério. Com a string, o ponto de virada mora onde é decidido — em
 * `SIDEBAR_MOBILE_QUERY` — e uma story pode passar outro sem redimensionar o
 * navegador.
 *
 * A consulta é lida uma vez, no construtor: é assim que o `MediaQuery` do
 * `svelte/reactivity` funciona. Trocar de consulta significa outra instância —
 * o `SidebarState` faz exatamente isso.
 */
export class IsMobile extends MediaQuery {
	constructor(query: string = SIDEBAR_MOBILE_QUERY) {
		super(query);
	}
}
