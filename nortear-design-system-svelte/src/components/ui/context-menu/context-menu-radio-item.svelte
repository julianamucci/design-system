<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		closeOnSelect = false,
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<ContextMenuPrimitive.RadioItemProps> = $props();
</script>

<!--
	Escolher uma opção NÃO fecha o menu, pelo mesmo motivo do item de marcação
	(ver `context-menu-checkbox-item.svelte`) e como no vanilla, em que marcar uma
	opção deixa o painel aberto. Quem consome religa pela mesma prop.

	Sem `inset`: a folha não recua o item de rádio, e a prop não fazia nada.
-->
<ContextMenuPrimitive.RadioItem
	bind:ref
	{closeOnSelect}
	data-slot="context-menu-radio-item"
	class={cn("nds-dropdown-menu-radio-item", className)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span
			class="nds-dropdown-menu-item-indicator"
			data-slot="context-menu-radio-item-indicator"
		>
			{#if checked}
				<CheckIcon  />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</ContextMenuPrimitive.RadioItem>
