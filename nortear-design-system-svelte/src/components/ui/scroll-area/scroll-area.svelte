<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive } from "bits-ui";
	import { Scrollbar } from "./index.js";
	import { cn, type WithoutChild } from "@/lib/utils.js";

	// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não
	// há rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
	// alternativa praticada era cada página escolher o próprio número em `style`
	// inline — 60 alturas cravadas, 20 valores distintos para dizer a mesma coisa.
	// Altura fora da escada continua possível pela custom property `--box-height`,
	// que a folha governa.
	type ScrollAreaSize = "xs" | "sm" | "md" | "lg" | "xl";

	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		class: className,
		orientation = "vertical",
		size,
		scrollbarXClasses = "",
		scrollbarYClasses = "",
		children,
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.RootProps> & {
		orientation?: "vertical" | "horizontal" | "both" | undefined;
		size?: ScrollAreaSize | undefined;
		scrollbarXClasses?: string | undefined;
		scrollbarYClasses?: string | undefined;
		viewportRef?: HTMLElement | null;
	} = $props();
</script>

<ScrollAreaPrimitive.Root
	bind:ref
	data-slot="scroll-area"
	data-size={size}
	class={cn("nds-scroll-area", className)}
	{...restProps}
>
	<ScrollAreaPrimitive.Viewport
		bind:ref={viewportRef}
		data-slot="scroll-area-viewport"
		tabindex={0}
		class="nds-scroll-area-viewport"
	>
		{@render children?.()}
	</ScrollAreaPrimitive.Viewport>
	{#if orientation === "vertical" || orientation === "both"}
		<Scrollbar orientation="vertical" class={scrollbarYClasses} />
	{/if}
	{#if orientation === "horizontal" || orientation === "both"}
		<Scrollbar orientation="horizontal" class={scrollbarXClasses} />
	{/if}
	<ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
