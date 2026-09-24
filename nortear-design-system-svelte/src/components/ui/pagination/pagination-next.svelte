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
		appearance = "ghost",
		"aria-label": ariaLabel = "Ir para a próxima página",
		...restProps
	}: PaginationPrimitive.NextButtonProps & {
		text?: string;
		/** Aparência do controle. Padrão `ghost` — ver a nota em pagination-link.svelte. */
		appearance?: "ghost" | "outline";
		"aria-label"?: string;
	} = $props();

	/** Sem texto visível o direcional vira quadrado — ver a nota em pagination-previous.svelte. */
	const iconOnly = $derived(!text);
</script>

<!-- `nds-pagination-next` no lugar de `pr-1.5!`, e `data-slot` próprio — ver a nota em pagination-previous.svelte. -->
<PaginationPrimitive.NextButton
	bind:ref
	aria-label={ariaLabel}
	data-slot="pagination-next"
	class={cn(
		buttonVariants({ variant: appearance, size: iconOnly ? "icon" : "default" }),
		iconOnly ? undefined : "nds-pagination-next",
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		{#if !iconOnly}
			<span class="nds-pagination-label">{text}</span>
		{/if}
		<ChevronRightIcon data-icon="inline-end" />
	{/if}
</PaginationPrimitive.NextButton>
