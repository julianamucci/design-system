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

<div data-slot="table-container" class="nds-table-wrapper">
	<table bind:this={ref} data-slot="table" class={cn("nds-table", className)} {...restProps}>
		{@render children?.()}
	</table>
</div>
