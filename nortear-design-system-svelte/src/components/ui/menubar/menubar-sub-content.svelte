<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import MenubarPortal from "./menubar-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenubarPrimitive.SubContentProps = $props();
</script>

<!--
	Duas correções moram aqui, e as duas eram invisíveis em teste até esta passada
	— a sonda cross-stack foi o que as revelou.

	1. **A classe do painel.** O `class` saía como `cn("", className)` — o submenu
	   renderizava sem fundo, sem borda e sem sombra, flutuando sobre a página
	   como texto solto. As outras quatro stacks reusam o painel do menu raiz.

	2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
	   raiz, que tem `overflow-y: auto` — o raiz passa a rolar e o axe acusa
	   `scrollable-region-focusable`, uma região rolável cujos itens têm
	   `tabindex="-1"`. O `Content` já portalizava; o `SubContent` não.
-->
<MenubarPortal>
	<MenubarPrimitive.SubContent
		bind:ref
		data-slot="menubar-sub-content"
		class={cn("nds-dropdown-menu-content", className)}
		{...restProps}
	/>
</MenubarPortal>
