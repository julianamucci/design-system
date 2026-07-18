<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { Skeleton } from "@/components/ui/skeleton/index.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		showIcon = false,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {
		showIcon?: boolean;
	} = $props();

	// Random width between 50% and 90%
	const width = `${Math.floor(Math.random() * 40) + 50}%`;
</script>

<div
	bind:this={ref}
	data-slot="sidebar-menu-skeleton"
	data-sidebar="menu-skeleton"
	class={cn("nds-sidebar-menu-skeleton", className)}
	{...restProps}
>
	{#if showIcon}
		<Skeleton class="nds-sidebar-menu-skeleton-icon" data-sidebar="menu-skeleton-icon" />
	{/if}
	<Skeleton
		class="nds-sidebar-menu-skeleton-text"
		data-sidebar="menu-skeleton-text"
		style="--skeleton-width: {width};"
	/>
	{@render children?.()}
</div>
