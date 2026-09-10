<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';
	import { useCommandLabelRegistry } from "./command-context.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		checked,
		value,
		...restProps
	}: CommandPrimitive.ItemProps & {
		/**
		 * Estado de marcação. `undefined` = o comando não é marcável e não ganha
		 * a marca; definido, vira `data-checked` e a folha acende o check quando
		 * verdadeiro (`.nds-command-item[data-checked="true"] .nds-command-item-check`).
		 */
		checked?: boolean;
	} = $props();

	/**
	 * O nó do comando vai para o registro de rótulos da raiz, e é de lá que o
	 * filtro tira o rótulo para comparar com a busca (C9) — ver
	 * `command-context.ts`. `ref` vira `null` quando o filtro desmonta o
	 * comando; o registro guarda o último rótulo lido.
	 */
	const labels = useCommandLabelRegistry();

	$effect(() => {
		if (value) labels?.track(value, ref);
	});
	$effect(() => {
		const registered = value;
		return () => {
			if (registered) labels?.forget(registered);
		};
	});
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	data-checked={checked === undefined ? undefined : String(checked)}
	class={cn("nds-command-item", className)}
	{value}
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
