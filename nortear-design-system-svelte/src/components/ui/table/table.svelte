<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<!-- tabindex: .nds-table-wrapper tem overflow-x: auto — região rolável precisa
     ser alcançável por teclado (WCAG 2.1.1 / axe scrollable-region-focusable). -->
<div data-slot="table-container" class="nds-table-wrapper" tabindex="0">
	<table bind:this={ref} data-slot="table" class={cn("nds-table", className)} {...restProps}>
		{@render children?.()}
	</table>
</div>
