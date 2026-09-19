<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import MenubarPortal from "./menubar-portal.svelte";
	import { closeAfterTab } from "@/components/ui/dropdown-menu/tab-leaves-menu";
	import { useMenubarRoot } from "./tab-leaves-menu";
	import { keepRootOpenOnSubEscape, useMenuSub } from "@/components/ui/dropdown-menu/sub-escape";

	let {
		ref = $bindable(null),
		class: className,
		// D15: o vão do submenu é 0 e −4, e o −4 sai de token — o mesmo dos outros
		// dois membros da família. Ver `dropdown-menu-sub-content.svelte`.
		sideOffset = 0,
		alignOffset = -4,
		onkeydown,
		...restProps
	}: MenubarPrimitive.SubContentProps = $props();

	const root = useMenubarRoot();
	const sub = useMenuSub();

	// Escape aqui dentro fecha só este submenu e devolve o foco ao gatilho dele;
	// o menu da barra segue aberto. Ouvinte de captura no nó que a lib entrega por
	// `ref`, antes da camada de Escape do bits — ver `dropdown-menu/sub-escape.ts`.
	$effect(() => {
		if (!ref || !sub) return;
		return keepRootOpenOnSubEscape(ref, sub);
	});

	// O portal tira este painel da árvore DOM do raiz: o Tab apertado aqui não
	// passa pelo ouvinte de lá. O mesmo fechamento — ver
	// `dropdown-menu/tab-leaves-menu.ts`.
	// PATCH: bugfix — Tab com o gatilho na ponta da página prendia o foco (ver PATCHES.md#svelte-menu-tab-edge)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
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
		{sideOffset}
		{alignOffset}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</MenubarPortal>
