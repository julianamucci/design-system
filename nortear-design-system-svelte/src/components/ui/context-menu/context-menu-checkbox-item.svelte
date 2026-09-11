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
		// PATCH: bugfix — marcar não fecha o menu, como no vanilla (ver PATCHES.md#svelte-menu-select-keeps-open)
		closeOnSelect = false,
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChildrenOrChild<ContextMenuPrimitive.CheckboxItemProps> & {
		children?: Snippet;
	} = $props();
</script>

<!--
	Alternar NÃO fecha o menu — como no vanilla e no react. A lib nasce com
	`closeOnSelect` ligado, e só a saída sem animação (D5) deixou isso visível: o
	painel ficava montado durante a animação de saída, e a play lia o item como se
	o menu seguisse aberto. Marcar é ajuste, não decisão: a pessoa costuma alternar
	mais de uma opção de uma vez. Quem consome religa pela mesma prop, e o
	`onSelect` dele continua chegando à lib por `restProps`.

	Sem `inset`: a folha só recua item comum, rótulo e sub-gatilho — o item de
	marcação reserva a pista do indicador à direita (D8), e a prop não fazia nada.
-->
<ContextMenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	bind:indeterminate
	{closeOnSelect}
	data-slot="context-menu-checkbox-item"
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
