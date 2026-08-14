<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		children,
		checked,
		...restProps
	}: CommandPrimitive.ItemProps & {
		/**
		 * Estado de marcação. `undefined` = o comando não é marcável e não ganha
		 * a marca; definido, vira `data-checked` e a folha acende o check quando
		 * verdadeiro (`.nds-command-item[data-checked="true"] .nds-command-item-check`).
		 */
		checked?: boolean;
	} = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	data-checked={checked === undefined ? undefined : String(checked)}
	class={cn("nds-command-item", className)}
	{...restProps}
>
	{@render children?.()}
	{#if checked !== undefined}
		<!--
			A marca fica no DOM nos dois estados: a folha alterna a OPACIDADE, e um
			ícone que entra e sai do DOM faria a largura do comando pular a cada
			troca. Fora dos itens marcáveis ela nem existe — antes nascia em TODO
			item e roubava 16px à direita de comandos que nunca seriam marcados.
			Decorativa: quem anuncia o estado é o `data-checked`, não o desenho.
		-->
		<CheckIcon class="nds-command-item-check" aria-hidden="true" />
	{/if}
</CommandPrimitive.Item>
