<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { Snippet } from "svelte";
	import MinusIcon from '@lucide/svelte/icons/minus';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		inset,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<ContextMenuPrimitive.CheckboxItemProps> & {
		inset?: boolean;
		children?: Snippet;
	} = $props();
</script>

<ContextMenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	bind:indeterminate
	data-slot="context-menu-checkbox-item"
	data-inset={inset}
	class={cn("nds-dropdown-menu-checkbox-item", className)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<span
			class="nds-dropdown-menu-item-indicator"
			data-slot="context-menu-checkbox-item-indicator"
		>
			<!-- Traço para o estado misto, tique para o marcado: tique quer dizer
			     "marcado", e misto é "alguns dos filhos". O `indeterminate` já
			     chegava ligado aqui e o snippet o descartava, então o item misto
			     desenhava tique — mesmo desenho do marcado, significado diferente. -->
			{#if indeterminate}
				<MinusIcon  />
			{:else if checked}
				<CheckIcon  />
			{/if}
		</span>
		{@render childrenProp?.()}
	{/snippet}
</ContextMenuPrimitive.CheckboxItem>
