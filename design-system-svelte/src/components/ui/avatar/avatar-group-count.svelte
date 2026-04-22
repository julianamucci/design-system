<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="avatar-group-count"
	class={cn(
		"bg-muted text-muted-foreground size-(--size-default) rounded-full text-sm group-has-data-[size=lg]/avatar-group:size-(--size-xl) group-has-data-[size=sm]/avatar-group:size-(--size-xs) [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 ring-background relative flex shrink-0 items-center justify-center ring-2",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
