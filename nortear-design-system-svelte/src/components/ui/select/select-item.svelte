<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	data-slot="select-item"
	class={cn(
		"nds-select-item",
		className
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		<span class="nds-select-item-indicator">
			{#if selected}
				<!-- Sem classe: `.nds-select-item svg:not([class*="size-"])` já dá
				     1rem ao ícone. A classe anterior (`cn-…`) não existia em folha
				     nenhuma — prefixo errado, zero efeito em runtime. -->
				<CheckIcon />
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
