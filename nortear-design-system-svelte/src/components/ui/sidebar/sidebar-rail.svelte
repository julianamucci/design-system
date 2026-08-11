<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

	const sidebar = useSidebar();

	// Faixa clicável na borda do painel.
	//
	// `tabindex="-1"` de propósito: ela faz o mesmo que o gatilho, que já está na
	// ordem de tabulação — duas paradas de teclado para uma ação só é ruído para
	// quem navega sem mouse. O `aria-hidden` completa o par: sem ele, o leitor de
	// tela lista dois botões com o mesmo nome para a mesma ação, e um deles nem
	// recebe foco. O `title` fica: é a dica de ponteiro, para quem a faixa existe.
</script>

<button
	bind:this={ref}
	data-sidebar="rail"
	data-slot="sidebar-rail"
	aria-hidden="true"
	tabindex={-1}
	onclick={sidebar.toggle}
	title="Toggle Sidebar"
	class={cn("nds-sidebar-rail", className)}
	{...restProps}
>
	{@render children?.()}
</button>
