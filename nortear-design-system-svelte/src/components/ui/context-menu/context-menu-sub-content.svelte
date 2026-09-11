<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import ContextMenuPortal from "./context-menu-portal.svelte";
	import {
		closeAfterTab,
		keepRootOpenOnSubEscape,
		useContextMenuRootContext,
		useContextMenuSubContext,
	} from "./context";

	let {
		ref = $bindable(null),
		class: className,
		onkeydown,
		...restProps
	}: ContextMenuPrimitive.SubContentProps = $props();

	const root = useContextMenuRootContext();
	const sub = useContextMenuSubContext();

	// Escape aqui dentro fecha só este submenu e devolve o foco ao gatilho dele;
	// o menu de cima segue aberto. Ouvinte de captura no nó que a lib entrega por
	// `ref`, antes da camada de Escape do bits — ver `context.ts`.
	$effect(() => {
		if (!ref || !sub) return;
		return keepRootOpenOnSubEscape(ref, sub);
	});

	// Tab dentro do submenu fecha a RAIZ, como no painel principal: o submenu é
	// portalizado à parte, e a tecla não chega ao painel de cima — ver `context.ts`.
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
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</ContextMenuPortal>
