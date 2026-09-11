<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import { closeAfterTab, useDropdownMenuRoot } from "./tab-leaves-menu";

	let {
		ref = $bindable(null),
		class: className,
		onkeydown,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps = $props();

	const root = useDropdownMenuRoot();

	// O portal tira este painel da árvore DOM do raiz: o Tab apertado aqui não
	// passa pelo ouvinte de lá. O mesmo fechamento — ver `tab-leaves-menu.ts`.
	// PATCH: bugfix — Tab com o gatilho na ponta da página prendia o foco (ver PATCHES.md#svelte-menu-tab-edge)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
</script>

<!--
	Duas correções moram aqui — as mesmas que o submenu da barra de menus e o do
	menu de contexto já tinham recebido, e que este ficou sem.

	1. **A classe do painel.** O `class` saía como `cn("", className)` — o submenu
	   renderizava sem fundo, sem borda e sem sombra. As outras stacks reusam o
	   painel do menu raiz.

	2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
	   raiz, que tem `overflow-y: auto` — o raiz passava a rolar e o axe acusava
	   `scrollable-region-focusable` na story `WithSubmenu`, uma região rolável
	   cujos itens têm `tabindex="-1"`. Medido em 2026-09-10: reprovava com a
	   folha antiga também, então não era efeito da saída sem animação (D5).
-->
<DropdownMenuPortal>
	<DropdownMenuPrimitive.SubContent
		bind:ref
		data-slot="dropdown-menu-sub-content"
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</DropdownMenuPortal>
