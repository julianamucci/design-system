<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import ContextMenuPortal from "./context-menu-portal.svelte";
	import { closeAfterTab } from "@/components/ui/dropdown-menu/tab-leaves-menu";
	import { keepRootOpenOnSubEscape, useMenuSub } from "@/components/ui/dropdown-menu/sub-escape";
	import { useContextMenuRootContext } from "./context";

	let {
		ref = $bindable(null),
		class: className,
		// D15: `align="start"` + `sideOffset: 0` + `alignOffset: -5`, o mesmo dos
		// outros dois membros da família — os três montam o mesmo `bits/menu`, e
		// o desvio medido foi idêntico nos três. O porquê de cada número, e por
		// que o `align` é o que faltava, está em
		// `dropdown-menu/dropdown-menu-sub-content.svelte`.
		sideOffset = 0,
		align = "start",
		alignOffset = -5,
		onkeydown,
		...restProps
	}: ContextMenuPrimitive.SubContentProps = $props();

	const root = useContextMenuRootContext();
	const sub = useMenuSub();

	// Escape aqui dentro fecha só este submenu e devolve o foco ao gatilho dele;
	// o menu de cima segue aberto. Ouvinte de captura no nó que a lib entrega por
	// `ref`, antes da camada de Escape do bits — ver `dropdown-menu/sub-escape.ts`,
	// o mesmo do DropdownMenu e do Menubar (a lib dos três é `bits/menu`).
	// PATCH: a11y — o bits fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#svelte-context-menu-submenu-escape)
	$effect(() => {
		if (!ref || !sub) return;
		return keepRootOpenOnSubEscape(ref, sub);
	});

	// Tab dentro do submenu fecha a RAIZ, como no painel principal: o submenu é
	// portalizado à parte, e a tecla não chega ao painel de cima — ver
	// `dropdown-menu/tab-leaves-menu.ts`.
	// PATCH: a11y — sem parada depois da área, o bits prende o Tab e deixa o menu aberto (ver PATCHES.md#svelte-context-menu-tab-last-stop)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
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
		{sideOffset}
		{align}
		{alignOffset}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</ContextMenuPortal>
