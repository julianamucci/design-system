<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { Snippet } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		scroll = false,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.OverlayProps> & {
		/**
		 * Rota B: o overlay vira a área de rolagem e recebe o painel como filho.
		 * Sem isto ele é só o véu, e o painel fica fixo no centro ao lado dele.
		 */
		scroll?: boolean;
		children?: Snippet;
	} = $props();
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn("nds-dialog-overlay", scroll && "nds-dialog-overlay-scroll", className)}
	{...restProps}
>
	{@render children?.()}
</DialogPrimitive.Overlay>
