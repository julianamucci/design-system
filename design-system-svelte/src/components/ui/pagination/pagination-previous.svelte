<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { buttonVariants } from "../button/index.js";
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Go to previous page"
	data-slot="pagination-link"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "pl-1.5!", className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<ChevronLeftIcon data-icon="inline-start" />
		<span class="cn-pagination-previous-text hidden sm:block">Previous</span>
	{/if}
</PaginationPrimitive.PrevButton>
