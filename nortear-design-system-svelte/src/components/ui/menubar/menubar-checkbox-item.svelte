<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { Snippet } from "svelte";
	import MinusIcon from '@lucide/svelte/icons/minus';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		indeterminate = $bindable(false),
		// PATCH: bugfix — marcar não fecha o menu, como no vanilla (ver PATCHES.md#svelte-menu-select-keeps-open)
		closeOnSelect = false,
		inset,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<MenubarPrimitive.CheckboxItemProps> & {
		inset?: boolean;
		children?: Snippet;
	} = $props();
</script>

<!--
	Alternar NÃO fecha o menu — como no vanilla e no react. A bits nasce com
	`closeOnSelect` ligado em todo item, inclusive nos de marcação, e isso ficou
	escondido enquanto a folha animava a saída: o painel seguia montado durante a
	animação, e a play que conferia "continua aberto" passava dentro dessa janela.
	Sem a animação (D5), o menu sumia a cada marcação. Quem marca uma preferência
	quer marcar a próxima. Quem consome religa pela mesma prop, e o `onSelect`
	dele continua chegando à lib por `restProps`.
-->
<MenubarPrimitive.CheckboxItem
	bind:ref
	bind:checked
	bind:indeterminate
	{closeOnSelect}
	data-slot="menubar-checkbox-item"
	data-inset={inset}
	class={cn("nds-dropdown-menu-checkbox-item", className)}
	{...restProps}
>
	{#snippet children({ checked: checked, indeterminate: indeterminate })}
		<span
			class="nds-dropdown-menu-item-indicator"
			data-slot="menubar-checkbox-item-indicator"
		>
			{#if indeterminate}
				<MinusIcon  />
			{:else if checked}
				<CheckIcon  />
			{/if}
		</span>
		{@render childrenProp?.()}
	{/snippet}
</MenubarPrimitive.CheckboxItem>
