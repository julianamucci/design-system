import { getContext, setContext } from "svelte";
import type { MenuRootAccess } from "@/components/ui/dropdown-menu/tab-leaves-menu";

// ─── Grupo ────────────────────────────────────────────────────────────────────

/**
 * Marca de "estou dentro de um grupo" — é ela que decide se o rótulo NOMEIA.
 *
 * O rótulo nomeia um bloco, e nomear exige que exista um bloco: o `Label` desta
 * stack era um `<div>` solto que desenhava igual ao das outras quatro e não
 * amarrava nada. Dentro de `Group` ou `RadioGroup` ele passa a ser o cabeçalho
 * da lib, e a lib escreve o `id` dele no `aria-labelledby` do grupo — o leitor
 * de tela anuncia "Visualização, grupo" em vez de um bloco anônimo, como no
 * vanilla (onde o rótulo abre o grupo sozinho).
 *
 * A marca existe porque o cabeçalho da lib EXIGE o contexto de grupo e lança
 * erro fora dele, e o contexto da lib não é exportado. Os dois contextos correm
 * pela mesma árvore de componentes, então a marca acompanha o da lib: é ligada
 * pelos wrappers `context-menu-group.svelte` e `context-menu-radio-group.svelte`,
 * os dois pontos em que a lib também abre um grupo. Fora deles o rótulo continua
 * sendo o `<div>` de antes — solto, e sem nome a dar.
 */
const GROUP_KEY = Symbol("nds-context-menu-group");

export function markContextMenuGroup(): void {
	setContext(GROUP_KEY, true);
}

export function isInsideContextMenuGroup(): boolean {
	return getContext<boolean | undefined>(GROUP_KEY) === true;
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
