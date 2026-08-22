<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import TooltipPortal from "./tooltip-portal.svelte";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@/lib/utils.js";
	import { usarDescription } from "./tooltip-descricao.svelte";

	let {
		ref = $bindable(null),
		id,
		class: className,
		sideOffset = 0,
		side = "top",
		children,
		arrowClasses,
		portalProps,
		...restProps
	}: TooltipPrimitive.ContentProps & {
		arrowClasses?: string;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof TooltipPortal>>;
	} = $props();

	const descricao = usarDescription();

	// Carimbado no nó, e não passado por prop: `PopperLayer` e `PopperLayerInner`
	// tiram `id` das props antes de chegarem ao elemento, então um `id` por prop
	// é engolido no caminho e o balão nasce sem id nenhum.
	// Ver tooltip-descricao.svelte.ts.
	$effect(() => {
		const alvo = ref;
		const identificador = id ?? descricao?.id;
		if (!alvo || !identificador) return;
		if (alvo.id !== identificador) alvo.id = identificador;
		// Avisar a raiz é o que devolve a vez ao gatilho — sem isto ele escreve
		// o `aria-describedby` antes de a lib escrever o dela, e perde.
		descricao?.marcarMontado(true);
		return () => descricao?.marcarMontado(false);
	});
</script>

<TooltipPortal {...portalProps}>
	<!-- role="tooltip": o bits-ui não emite role no conteúdo. Sem ele o painel
	     é um <div> qualquer para o leitor de tela, e o `aria-describedby` do
	     trigger aponta para algo sem papel definido. O Vanilla — referência
	     cross-stack — já define role="tooltip". -->
	<TooltipPrimitive.Content
		bind:ref
		data-slot="tooltip-content"
		role="tooltip"
		{sideOffset}
		{side}
		class={cn("nds-tooltip-content", className)}
		{...restProps}
	>
		{@render children?.()}
		<!-- A seta é posicionada só pela folha compartilhada, por `[data-side]`.
		     As classes utilitárias que moravam aqui saíram do projeto na migração
		     para `.nds-*` e não pintavam nada. -->
		<TooltipPrimitive.Arrow>
			{#snippet child({ props })}
				<div class={cn("nds-tooltip-arrow", arrowClasses)} {...props}></div>
			{/snippet}
		</TooltipPrimitive.Arrow>
	</TooltipPrimitive.Content>
</TooltipPortal>
