<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		// PATCH: bugfix — escolher não fecha o menu, como no vanilla (ver PATCHES.md#svelte-menu-select-keeps-open)
		closeOnSelect = false,
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<MenubarPrimitive.RadioItemProps> = $props();
</script>

<!--
	Escolher uma opção NÃO fecha o menu, pelo mesmo motivo do item de marcação
	(ver `menubar-checkbox-item.svelte`) e como no vanilla e no react, que deixam
	o painel aberto depois da escolha. Quem consome religa pela mesma prop.

	Sem `inset`: a folha só recua item comum, rótulo e sub-gatilho — a opção de
	rádio reserva a pista do indicador à direita (D8), e a prop não fazia nada.
-->
<MenubarPrimitive.RadioItem
	bind:ref
	{closeOnSelect}
	data-slot="menubar-radio-item"
	class={cn("nds-dropdown-menu-radio-item", className)}
	{...restProps}
>
	{#snippet children({ checked })}
		<span
			class="nds-dropdown-menu-item-indicator"
			data-slot="menubar-radio-item-indicator"
		>
			{#if checked}
				<CheckIcon  />
			{/if}
		</span>
		{@render childrenProp?.({ checked })}
	{/snippet}
</MenubarPrimitive.RadioItem>
