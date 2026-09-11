<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn, type WithoutChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		// PATCH: bugfix — escolher não fecha o menu, como no vanilla (ver PATCHES.md#svelte-menu-select-keeps-open)
		closeOnSelect = false,
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<DropdownMenuPrimitive.RadioItemProps> = $props();
</script>

<!--
	Escolher uma opção NÃO fecha o menu, pelo mesmo motivo do item de marcação
	(ver `dropdown-menu-checkbox-item.svelte`) e como no vanilla e no react, que
	deixam o painel aberto depois da escolha. Quem consome religa pela mesma prop.
-->
<DropdownMenuPrimitive.RadioItem
	bind:ref
	{closeOnSelect}
	data-slot="dropdown-menu-radio-item"
	class={cn("nds-dropdown-menu-radio-item", className)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span
			class="nds-dropdown-menu-item-indicator"
			data-slot="dropdown-menu-radio-item-indicator"
		>
			{#if checked}
				<CheckIcon  />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</DropdownMenuPrimitive.RadioItem>
