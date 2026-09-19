import { getContext, setContext } from "svelte";
import type { MenuRootAccess } from "@/components/ui/dropdown-menu/tab-leaves-menu";
import { isInsideMenuGroup, markMenuGroup } from "@/components/ui/menu-group-context";

// ─── Grupo ────────────────────────────────────────────────────────────────────
//
// O mecanismo mora em `menu-group-context.ts`, ao lado das três pastas: desde
// 2026-09-18 o DropdownMenu e o Menubar seguem o mesmo caminho, e o que era um
// contorno só deste componente passaria a ser três cópias do mesmo contorno.
// Aqui ficam só os nomes que as peças deste menu já importavam.

export function markContextMenuGroup(): void {
	markMenuGroup("context-menu");
}

export function isInsideContextMenuGroup(): boolean {
	return isInsideMenuGroup("context-menu");
}

// ─── Raiz ─────────────────────────────────────────────────────────────────────

/**
 * Leitura e fechamento da raiz, para o Tab que a lib deixa sem fechar.
 *
 * O contrato é "Tab sai do menu e o fecha" (C2), e o mecanismo é o MESMO do
 * DropdownMenu e do Menubar — a lib dos três é `bits/menu`, e o
 * `handleTabKeyDown` dela barra a tecla sem fechar quando não acha a próxima
 * parada. O docblock e o fechamento (`closeAfterTab`) moram em
 * `dropdown-menu/tab-leaves-menu.ts`; daqui só sai a chave do contexto, própria
 * como a da barra de menus, para que um menu de um tipo nunca feche a raiz do
 * outro.
 *
 * A área cai no caso da borda por causa do `tabindex={0}` que ela precisa ter
 * (ver `context-menu-trigger.svelte`): com o `-1` da lib, a busca partia de um
 * nó não tabulável e caía sempre no `<body>`, que fecha.
 *
 * Até 2026-09-11 esta stack tinha a sua cópia do `closeAfterTab` e do Escape de
 * submenu (`sub-escape.ts`), linha a linha igual às do DropdownMenu: duas
 * implementações do mesmo contorno, que um bump do bits teria de corrigir duas
 * vezes.
 */
const ROOT_KEY = Symbol("nds-context-menu-root");

export function setContextMenuRootContext(context: MenuRootAccess): void {
	setContext(ROOT_KEY, context);
}

export function useContextMenuRootContext(): MenuRootAccess | undefined {
	return getContext<MenuRootAccess | undefined>(ROOT_KEY);
}
