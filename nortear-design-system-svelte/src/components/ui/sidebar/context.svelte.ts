import { IsMobile } from "@/lib/hooks/is-mobile.svelte.js";
import { getContext, setContext } from "svelte";
import { SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_MOBILE_QUERY } from "./constants.js";

type Getter<T> = () => T;

export type SidebarStateProps = {
	/**
	 * A getter function that returns the current open state of the sidebar.
	 * We use a getter function here to support `bind:open` on the `Sidebar.Provider`
	 * component.
	 */
	open: Getter<boolean>;

	/**
	 * A function that sets the open state of the sidebar. To support `bind:open`, we need
	 * a source of truth for changing the open state to ensure it will be synced throughout
	 * the sub-components and any `bind:` references.
	 */
	setOpen: (open: boolean) => void;

	/**
	 * Getter da consulta de mídia que decide entre coluna e gaveta.
	 *
	 * Getter, e não string solta, pelo mesmo motivo de `open`: é uma prop do
	 * `Sidebar.Provider`, e uma string capturada por valor congelaria no primeiro
	 * render. Quem não passa nada fica com `SIDEBAR_MOBILE_QUERY`.
	 */
	mobileQuery?: Getter<string>;
};

class SidebarState {
	readonly props: SidebarStateProps;
	open = $derived.by(() => this.props.open());
	openMobile = $state(false);
	setOpen: SidebarStateProps["setOpen"];
	state = $derived.by(() => (this.open ? "expanded" : "collapsed"));

	// A instância acompanha a consulta em vez de nascer com ela.
	//
	// `MediaQuery` fixa a string no construtor — trocar de critério exige objeto
	// novo, e não há como "reconfigurar" o existente. Com a consulta estável (o
	// caso de toda aplicação) o derived calcula uma vez e nunca mais; quem troca
	// a prop em tempo de execução — uma story que força o ramo móvel — recebe a
	// virada em vez de ficar preso ao valor da montagem.
	#isMobile = $derived.by(
		() => new IsMobile(this.props.mobileQuery?.() ?? SIDEBAR_MOBILE_QUERY),
	);

	constructor(props: SidebarStateProps) {
		this.setOpen = props.setOpen;
		this.props = props;
	}

	// Convenience getter for checking if the sidebar is mobile
	// without this, we would need to use `sidebar.isMobile.current` everywhere
	get isMobile() {
		return this.#isMobile.current;
	}

	// Event handler to apply to the `<svelte:window>`
	handleShortcutKeydown = (e: KeyboardEvent) => {
		if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			this.toggle();
		}
	};

	setOpenMobile = (value: boolean) => {
		this.openMobile = value;
	};

	toggle = () => {
		return this.#isMobile.current
			? (this.openMobile = !this.openMobile)
			: this.setOpen(!this.open);
	};
}

const SYMBOL_KEY = "scn-sidebar";

/**
 * Instantiates a new `SidebarState` instance and sets it in the context.
 *
 * @param props The constructor props for the `SidebarState` class.
 * @returns  The `SidebarState` instance.
 */
export function setSidebar(props: SidebarStateProps): SidebarState {
	return setContext(Symbol.for(SYMBOL_KEY), new SidebarState(props));
}

/**
 * Retrieves the `SidebarState` instance from the context. This is a class instance,
 * so you cannot destructure it.
 * @returns The `SidebarState` instance.
 */
export function useSidebar(): SidebarState {
	return getContext(Symbol.for(SYMBOL_KEY));
}
