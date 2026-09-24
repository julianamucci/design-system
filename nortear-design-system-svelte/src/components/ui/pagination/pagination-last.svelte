<script lang="ts">
	import type { HTMLButtonAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { buttonVariants, type ButtonSize } from "../button/index.js";
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		text = "",
		appearance = "ghost",
		"aria-label": ariaLabel = "Ir para a última página",
		...restProps
	}: WithElementRef<HTMLButtonAttributes> & {
		size?: ButtonSize;
		/** Texto visível do controle. Vazio por padrão — ver a nota em pagination-first.svelte. */
		text?: string;
		/** Aparência do controle. Padrão `ghost` — ver a nota em pagination-link.svelte. */
		appearance?: "ghost" | "outline";
		"aria-label"?: string;
	} = $props();

	/** Sem texto visível o controle é quadrado — ver a nota em pagination-previous.svelte. */
	const iconOnly = $derived(!text);
</script>

<!-- Salto para a última página — o espelho de pagination-first.svelte, com a mesma nota sobre a lib. -->
<button
	bind:this={ref}
	type="button"
	aria-label={ariaLabel}
	data-slot="pagination-last"
	class={cn(
		buttonVariants({ variant: appearance, size: iconOnly ? "icon" : size }),
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
		<ChevronsRightIcon data-icon="inline-end" />
	{/if}
</button>
