<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { buttonVariants } from "../button/index.js";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		ref = $bindable(null),
		class: className,
		children,
		text = "Próxima",
		"aria-label": ariaLabel = "Ir para a próxima página",
		...restProps
	}: PaginationPrimitive.NextButtonProps & { text?: string; "aria-label"?: string } = $props();
</script>

<!-- `nds-pagination-next` no lugar de `pr-1.5!`, e `data-slot` próprio — ver a nota em pagination-previous.svelte. -->
<PaginationPrimitive.NextButton
	bind:ref
	aria-label={ariaLabel}
	data-slot="pagination-next"
	class={cn(buttonVariants({ variant: "ghost", size: "default" }), "nds-pagination-next", className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		<span class="nds-pagination-label">{text}</span>
		<ChevronRightIcon data-icon="inline-end" />
	{/if}
</PaginationPrimitive.NextButton>
