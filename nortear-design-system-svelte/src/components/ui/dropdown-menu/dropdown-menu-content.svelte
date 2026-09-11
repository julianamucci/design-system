<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import type { ComponentProps } from "svelte";
	import { closeAfterTab, useDropdownMenuRoot } from "./tab-leaves-menu";

	const uid = $props.id();

	let {
		ref = $bindable(null),
		id = `nds-dropdown-menu-content-${uid}`,
		sideOffset = 4,
		align = "start",
		portalProps,
		class: className,
		onkeydown,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();

	// O painel precisa ter no DOM o `id` que a lib usa como id do conteúdo.
	//
	// A lib decide se uma tecla é busca por digitação (typeahead) comparando o
	// `id` do painel mais próximo do alvo com o id que ela guardou para o
	// conteúdo (`isKeydownInside`, `bits-ui/dist/bits/menu/menu.svelte.js:861`).
	// No conteúdo raiz o `id` é consumido pela camada flutuante
	// (`popper-layer-inner.svelte` o desestrutura) e nunca chega ao elemento: a
	// comparação era `"" === id`, e a letra digitada não movia o foco — medido em
	// 2026-09-10 na story `Open`, com o foco parado no primeiro item depois de
	// "e". Setas e Home/End andavam porque passam por outro caminho, e por isso a
	// story declarava a busca como "não aplicável" em vez de reprovar. O painel do
	// submenu não sofre disso: ele repassa o próprio `id`.
	//
	// O id é passado à lib, para que ela o guarde, e escrito aqui no nó que ela
	// entrega por `ref` — o único ponto em que o elemento fica alcançável. Mesmo
	// conserto do painel da barra de menus e do menu de contexto desta stack.
	// PATCH: a11y — typeahead morto: o painel raiz nascia sem o `id` que a lib compara (ver PATCHES.md#svelte-menu-content-id)
	$effect(() => {
		if (ref && ref.id !== id) ref.id = id;
	});

	const root = useDropdownMenuRoot();

	// O `onkeydown` de quem consome segue primeiro; o Tab que a lib deixa aberto
	// fecha depois dela — ver `tab-leaves-menu.ts`.
	// PATCH: bugfix — Tab com o gatilho na ponta da página prendia o foco (ver PATCHES.md#svelte-menu-tab-edge)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		bind:ref
		{id}
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</DropdownMenuPortal>
