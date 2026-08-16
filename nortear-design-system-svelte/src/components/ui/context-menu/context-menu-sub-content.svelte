<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import ContextMenuPortal from "./context-menu-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ContextMenuPrimitive.SubContentProps = $props();
</script>

<!--
	Duas correções moram aqui, e as duas eram invisíveis em teste até esta passada.

	1. **A classe do painel.** O `class` saía como `cn("", className)` — o submenu
	   renderizava sem fundo, sem borda e sem sombra, flutuando sobre a página
	   como texto solto. As outras stacks reusam o painel do menu raiz.

	2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
	   raiz, que tem `overflow-y: auto` — o raiz passa a rolar e o axe acusa
	   `scrollable-region-focusable`, uma região rolável cujos itens têm
	   `tabindex="-1"`. O `Content` já portalizava; o `SubContent` não.
-->
<ContextMenuPortal>
	<ContextMenuPrimitive.SubContent
		bind:ref
		data-slot="context-menu-sub-content"
		class={cn("nds-dropdown-menu-content", className)}
		{...restProps}
	/>
</ContextMenuPortal>
