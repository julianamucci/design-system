<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import ContextMenuPortal from "./context-menu-portal.svelte";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@/lib/utils.js";
	import { closeAfterTab } from "@/components/ui/dropdown-menu/tab-leaves-menu";
	import { useContextMenuRootContext } from "./context";

	const uid = $props.id();

	let {
		ref = $bindable(null),
		id = `nds-context-menu-content-${uid}`,
		portalProps,
		class: className,
		// D15: o ContextMenu raiz é `0`/`0`. O painel nasce no PONTEIRO, e
		// qualquer deslocamento ali seria número mágico — a quina do painel fica
		// onde o cursor está, que é a convenção do menu de contexto nativo. Até
		// 2026-09-18 esta stack herdava o `sideOffset: 2` do bits
		// (`context-menu-content.svelte` da lib), que não saía de token nenhum.
		//
		// MEDIDO em 2026-09-19, com o clique direito no centro da área e a quina
		// do painel comparada à coordenada do ponteiro: o `sideOffset: 2` do bits
		// punha a quina a **dx=+2,00 / dy=0,00**; com o `0` declarado ela fica em
		// **dx=0,00 / dy=0,00**. Os dois publicam `data-side="right"` e
		// `data-align="start"` — o atributo não distinguia os dois casos, e por
		// isso a asserção antiga (quina a menos de 24px do centro da área) passava
		// com qualquer um. O `0` melhorou 2px e não piorou nada mensurável.
		sideOffset = 0,
		alignOffset = 0,
		onkeydown,
		...restProps
	}: ContextMenuPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof ContextMenuPortal>>;
	} = $props();

	const root = useContextMenuRootContext();

	// O `onkeydown` de quem consome segue primeiro; o Tab que a lib deixa aberto
	// fecha depois dela — ver `context.ts` e `dropdown-menu/tab-leaves-menu.ts`.
	// PATCH: a11y — sem parada depois da área, o bits prende o Tab e deixa o menu aberto (ver PATCHES.md#svelte-context-menu-tab-last-stop)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}

	// O painel precisa ter no DOM o `id` que a lib usa como id do conteúdo.
	//
	// A lib decide se uma tecla é typeahead comparando o `id` do painel mais
	// próximo do alvo com o id que ela guardou para o conteúdo
	// (`isKeydownInside`, `bits/menu/menu.svelte.js`). No conteúdo do
	// ContextMenu o `id` é consumido pela camada flutuante
	// (`popper-layer-inner.svelte` o desestrutura) e nunca chega ao elemento: a
	// comparação era `undefined === id`, e a letra digitada não movia o foco —
	// medido na story Playground, com o foco parado no primeiro item depois de
	// "d". Setas e Home/End andavam porque passam por outro caminho.
	//
	// O id é passado à lib, para que ela o guarde, e escrito aqui no nó que ela
	// entrega por `ref` — o único ponto em que o elemento fica alcançável.
	// PATCH: a11y — o bits não põe o id no painel, e o typeahead não rodava (ver PATCHES.md#svelte-context-menu-content-id)
	$effect(() => {
		if (ref && ref.id !== id) ref.id = id;
	});
</script>

<ContextMenuPortal {...portalProps}>
	<ContextMenuPrimitive.Content
		bind:ref
		{id}
		data-slot="context-menu-content"
		{sideOffset}
		{alignOffset}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</ContextMenuPortal>
