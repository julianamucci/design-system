import { getContext, setContext } from "svelte";

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
 * O contrato é "Tab sai do menu e o fecha" (C2). A lib cumpre quando existe uma
 * próxima parada de tabulação depois da área: em `handleTabKeyDown`
 * (`bits/menu/menu.svelte.js`) ela barra a tecla, fecha a raiz e leva o foco a
 * essa parada. Quando a área é a ÚLTIMA parada da página — ou a primeira, no
 * Shift+Tab —, `getTabbableFrom` não acha ninguém e o ramo `else` só chama
 * `body.focus()`: a tecla continua barrada, a raiz continua aberta e o foco
 * continua no menu. Tab passava a prender o foco, o contrário de C2.
 *
 * A área cai nesse caso por causa do `tabindex={0}` que ela precisa ter (ver
 * `context-menu-trigger.svelte`): com o `-1` da lib, a busca partia de um nó não
 * tabulável e caía sempre no `<body>`, que fecha.
 *
 * O conserto fica nos wrappers do painel, sem patch: DEPOIS que a lib trata a
 * tecla, se a raiz ainda estiver aberta, ela fecha por aqui. `close` avisa quem
 * consome por `onOpenChange`, porque o fechamento vindo de fora do primitivo
 * não passa pelo aviso dele — e o fechamento por Tab é medido na docs page.
 */
export type ContextMenuRootContext = {
	isOpen(): boolean;
	close(): void;
};

const ROOT_KEY = Symbol("nds-context-menu-root");

export function setContextMenuRootContext(context: ContextMenuRootContext): void {
	setContext(ROOT_KEY, context);
}

export function useContextMenuRootContext(): ContextMenuRootContext | undefined {
	return getContext<ContextMenuRootContext | undefined>(ROOT_KEY);
}

/**
 * O fechamento por Tab que a lib não faz — ver o docblock do contexto da raiz.
 *
 * Roda numa microtarefa para ver o que a lib JÁ fez com a mesma tecla: se ela
 * fechou (havia próxima parada), a raiz está fechada e nada acontece aqui — sem
 * aviso duplicado em `onOpenChange`. Só o ramo que ela deixa aberto fecha.
 */
export function closeAfterTab(event: KeyboardEvent, root: ContextMenuRootContext | undefined): void {
	if (event.key !== "Tab" || !root) return;
	// PATCH: a11y — sem parada depois da área, o bits prende o Tab e deixa o menu aberto (ver PATCHES.md#svelte-context-menu-tab-last-stop)
	queueMicrotask(() => {
		if (root.isOpen()) root.close();
	});
}

// ─── Submenu ──────────────────────────────────────────────────────────────────

/**
 * Fechamento de UM submenu, com o foco devolvido ao item que o abriu.
 *
 * O contrato é o da WAI-ARIA APG e o do vanilla: Escape fecha o menu em que o
 * foco está, e o de fora segue aberto (`testes.functional.item6`). O bits fecha
 * a árvore inteira. As camadas de Escape dele moram numa lista global
 * (`bits/utilities/escape-layer/use-escape-layer.svelte.js`), e a responsável
 * pela tecla é a ÚLTIMA com comportamento `close`: o painel raiz nasce `close`
 * e o do submenu `defer-otherwise-close`, então quem responde ao Escape dado
 * DENTRO do submenu é o raiz — e ele fecha tudo. Um nível de volta custava os
 * dois, e a pessoa recomeçava do clique direito.
 *
 * A camada ouve `keydown` no `document`, na borbulha. O painel do submenu
 * (`context-menu-sub-content.svelte`) ouve na CAPTURA e interrompe a propagação
 * antes dela, e o resto é o que a própria lib faz na seta esquerda
 * (`SUB_CLOSE_KEYS`, em `menu-sub-content.svelte`): fecha o submenu e foca o
 * gatilho. Quem fecha é o nosso `ContextMenuSub`, que guarda o estado aberto —
 * o contexto de menu do bits não é exportado. O gatilho se registra aqui pelo
 * `ContextMenuSubTrigger`, sem consulta ao DOM.
 *
 * Com o foco no menu RAIZ (o submenu aberto só pelo ponteiro), a tecla não passa
 * pelo painel do submenu: o raiz responde e fecha tudo, que é o certo — o foco
 * estava nele.
 */
export type ContextMenuSubContext = {
	setTrigger(node: HTMLElement | null): void;
	closeToTrigger(): void;
};

const SUB_KEY = Symbol("nds-context-menu-sub");

export function setContextMenuSubContext(context: ContextMenuSubContext): void {
	setContext(SUB_KEY, context);
}

export function useContextMenuSubContext(): ContextMenuSubContext | undefined {
	return getContext<ContextMenuSubContext | undefined>(SUB_KEY);
}

/**
 * Ouvinte de CAPTURA do painel do submenu — ver `ContextMenuSubContext`.
 *
 * Devolve a função que o remove, para o `$effect` do painel.
 */
export function keepRootOpenOnSubEscape(
	panel: HTMLElement,
	sub: ContextMenuSubContext,
): () => void {
	function onKeydown(event: KeyboardEvent) {
		if (event.key !== "Escape") return;
		// PATCH: a11y — o bits fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#svelte-context-menu-submenu-escape)
		event.preventDefault();
		event.stopPropagation();
		sub.closeToTrigger();
	}
	panel.addEventListener("keydown", onKeydown, true);
	return () => panel.removeEventListener("keydown", onKeydown, true);
}
